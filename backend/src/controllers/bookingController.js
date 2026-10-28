const crypto = require('crypto');
const Booking = require('../models/Booking');
const Resource = require('../models/Resource');
const ReservationSlot = require('../models/ReservationSlot');
const { reserveSlots, releaseSlots, confirmSlots } = require('../services/slotService');
const { sendNotification, notifyAdmins } = require('../services/notificationService');
const { recordAuditLog } = require('../services/auditService');
const { timeToMinutes, createDateTime } = require('../utils/timeUtils');
const { BOOKING_STATUS, NOTIFICATION_TYPES, AUDIT_ACTIONS, RESOURCE_STATUS } = require('../config/constants');

// Generate unique human-readable booking identifier
const generateBookingNumber = () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `BK-${dateStr}-${randomSuffix}`;
};

/**
 * Submit a new booking request
 */
const createBooking = async (req, res, next) => {
  let createdBooking = null;

  try {
    const { resource: resourceId, date, startTime, endTime, purpose, expectedAttendees = 1 } = req.body;
    const userId = req.user._id;
    const userRole = req.user.role;

    // 1. Fetch resource and verify existence and status
    const resource = await Resource.findById(resourceId);
    if (!resource) {
      return res.status(404).json({
        success: false,
        message: 'The requested resource was not found.',
      });
    }

    if (resource.status !== RESOURCE_STATUS.ACTIVE) {
      return res.status(400).json({
        success: false,
        message: `Resource is currently ${resource.status} and cannot be booked.`,
      });
    }

    // 2. Verify role permission
    if (resource.allowedRoles && !resource.allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: `Your account role (${userRole}) is not permitted to reserve this resource.`,
      });
    }

    // 3. Verify capacity
    if (expectedAttendees > resource.capacity) {
      return res.status(400).json({
        success: false,
        message: `Attendee count (${expectedAttendees}) exceeds the resource capacity of ${resource.capacity}.`,
      });
    }

    // 4. Verify operating hours
    const startMins = timeToMinutes(startTime);
    const endMins = timeToMinutes(endTime);
    const durationMins = endMins - startMins;

    const openMins = timeToMinutes(resource.operatingHours?.openTime || '08:00');
    const closeMins = timeToMinutes(resource.operatingHours?.closeTime || '20:00');

    if (startMins < openMins || endMins > closeMins) {
      return res.status(400).json({
        success: false,
        message: `Booking must fall within resource operating hours (${resource.operatingHours?.openTime} - ${resource.operatingHours?.closeTime}).`,
      });
    }

    // 5. Verify duration limits
    if (durationMins < resource.minDurationMinutes) {
      return res.status(400).json({
        success: false,
        message: `Minimum reservation duration is ${resource.minDurationMinutes} minutes.`,
      });
    }

    if (durationMins > resource.maxDurationMinutes) {
      return res.status(400).json({
        success: false,
        message: `Maximum reservation duration is ${resource.maxDurationMinutes} minutes.`,
      });
    }

    // 6. Verify advance booking limit
    const bookingDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diffDays = Math.ceil((bookingDate - today) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot book resources for past dates.',
      });
    }

    if (diffDays > resource.advanceBookingDaysLimit) {
      return res.status(400).json({
        success: false,
        message: `This resource can only be booked up to ${resource.advanceBookingDaysLimit} days in advance.`,
      });
    }

    const startDateTime = createDateTime(date, startTime);
    const endDateTime = createDateTime(date, endTime);

    // 7. Create booking record in status PENDING
    const bookingNumber = generateBookingNumber();
    createdBooking = await Booking.create({
      bookingNumber,
      user: userId,
      resource: resourceId,
      date,
      startTime,
      endTime,
      startDateTime,
      endDateTime,
      purpose,
      expectedAttendees,
      status: BOOKING_STATUS.PENDING,
    });

    // 8. Atomically hold discrete slots via unique compound index
    // If any slot is already reserved, reserveSlots throws a 409 Conflict error
    await reserveSlots(resourceId, date, startTime, endTime, createdBooking._id, 'held');

    // 9. Record audit log
    await recordAuditLog({
      actor: userId,
      action: AUDIT_ACTIONS.BOOKING_CREATE,
      targetModel: 'Booking',
      targetId: createdBooking._id,
      details: {
        bookingNumber,
        resource: resource.name,
        date,
        startTime,
        endTime,
      },
      req,
    });

    // 10. Dispatch real-time notifications
    await sendNotification({
      recipient: userId,
      title: 'Booking Request Submitted',
      message: `Your booking request #${bookingNumber} for ${resource.name} on ${date} (${startTime} - ${endTime}) has been received and is awaiting approval.`,
      type: NOTIFICATION_TYPES.BOOKING_CREATED,
      link: `/bookings/${createdBooking._id}`,
      metadata: { bookingId: createdBooking._id, bookingNumber },
    });

    await notifyAdmins({
      title: 'New Booking Request',
      message: `${req.user.name} submitted booking #${bookingNumber} for ${resource.name} (${date} ${startTime}-${endTime}).`,
      type: NOTIFICATION_TYPES.BOOKING_CREATED,
      link: `/admin/bookings`,
      metadata: { bookingId: createdBooking._id, bookingNumber },
    });

    const populatedBooking = await Booking.findById(createdBooking._id)
      .populate('resource', 'name code building roomNumber type capacity imageUrl')
      .populate('user', 'name email department');

    res.status(201).json({
      success: true,
      message: 'Booking request submitted successfully.',
      data: { booking: populatedBooking },
    });
  } catch (error) {
    // If slot reservation failed, rollback unconfirmed booking record
    if (createdBooking && createdBooking._id) {
      await Booking.findByIdAndDelete(createdBooking._id);
    }
    next(error);
  }
};

/**
 * Get current user's bookings
 */
const getMyBookings = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const filter = { user: req.user._id };

    if (status && status !== 'all') {
      filter.status = status;
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [bookings, total] = await Promise.all([
      Booking.find(filter)
        .populate('resource', 'name code building roomNumber type capacity imageUrl')
        .sort('-createdAt')
        .skip(skip)
        .limit(Number(limit)),
      Booking.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: {
        bookings,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single booking details
 */
const getBookingById = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('resource')
      .populate('user', 'name email department studentOrEmployeeId phone')
      .populate('reviewedBy', 'name email');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking record not found.',
      });
    }

    // Role check: Students and faculty can only view their own bookings
    if (req.user.role !== 'admin' && String(booking.user._id) !== String(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Access forbidden: You can only view your own bookings.',
      });
    }

    res.status(200).json({
      success: true,
      data: { booking },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cancel an eligible booking (Student, Faculty, or Admin)
 */
const cancelBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { cancellationReason = 'Cancelled by user' } = req.body;

    const booking = await Booking.findById(id).populate('resource', 'name');
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found.',
      });
    }

    // Authorization: User can cancel own booking, Admin can cancel any booking
    if (req.user.role !== 'admin' && String(booking.user) !== String(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: You can only cancel your own bookings.',
      });
    }

    if (booking.status === BOOKING_STATUS.CANCELLED || booking.status === BOOKING_STATUS.REJECTED) {
      return res.status(400).json({
        success: false,
        message: `Booking is already ${booking.status}.`,
      });
    }

    // Release discrete slots atomically
    await releaseSlots(booking._id);

    booking.status = BOOKING_STATUS.CANCELLED;
    booking.cancellationReason = cancellationReason;
    await booking.save();

    await recordAuditLog({
      actor: req.user._id,
      action: AUDIT_ACTIONS.BOOKING_CANCEL,
      targetModel: 'Booking',
      targetId: booking._id,
      details: {
        bookingNumber: booking.bookingNumber,
        cancellationReason,
      },
      req,
    });

    // Notify user if admin cancelled it, or confirm cancellation
    await sendNotification({
      recipient: booking.user,
      title: 'Booking Cancelled',
      message: `Booking #${booking.bookingNumber} for ${booking.resource?.name} has been cancelled.`,
      type: NOTIFICATION_TYPES.BOOKING_CANCELLED,
      link: `/bookings/${booking._id}`,
      metadata: { bookingId: booking._id },
    });

    res.status(200).json({
      success: true,
      message: 'Booking cancelled and reserved time slots released.',
      data: { booking },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin: Get pending approval queue with conflict indicators
 */
const getAdminQueue = async (req, res, next) => {
  try {
    const { status = BOOKING_STATUS.PENDING, page = 1, limit = 15 } = req.query;
    const filter = {};

    if (status !== 'all') {
      filter.status = status;
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [bookings, total] = await Promise.all([
      Booking.find(filter)
        .populate('resource', 'name code building roomNumber capacity')
        .populate('user', 'name email department studentOrEmployeeId')
        .sort('date startTime')
        .skip(skip)
        .limit(Number(limit)),
      Booking.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: {
        bookings,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin: Approve pending booking
 */
const approveBooking = async (req, res, next) => {
  try {
    const { id } = req.params;

    const booking = await Booking.findById(id).populate('resource', 'name');
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found.',
      });
    }

    if (booking.status !== BOOKING_STATUS.PENDING) {
      return res.status(400).json({
        success: false,
        message: `Booking cannot be approved because current status is ${booking.status}.`,
      });
    }

    // Transition slots to confirmed
    await confirmSlots(booking._id);

    booking.status = BOOKING_STATUS.APPROVED;
    booking.reviewedBy = req.user._id;
    booking.reviewedAt = new Date();
    await booking.save();

    await recordAuditLog({
      actor: req.user._id,
      action: AUDIT_ACTIONS.BOOKING_APPROVE,
      targetModel: 'Booking',
      targetId: booking._id,
      details: {
        bookingNumber: booking.bookingNumber,
        resource: booking.resource?.name,
      },
      req,
    });

    await sendNotification({
      recipient: booking.user,
      title: 'Booking Approved! 🎉',
      message: `Your booking #${booking.bookingNumber} for ${booking.resource?.name} on ${booking.date} (${booking.startTime} - ${booking.endTime}) has been approved.`,
      type: NOTIFICATION_TYPES.BOOKING_APPROVED,
      link: `/bookings/${booking._id}`,
      metadata: { bookingId: booking._id },
    });

    res.status(200).json({
      success: true,
      message: 'Booking approved successfully.',
      data: { booking },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin: Reject pending booking with reason
 */
const rejectBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;

    const booking = await Booking.findById(id).populate('resource', 'name');
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found.',
      });
    }

    if (booking.status !== BOOKING_STATUS.PENDING) {
      return res.status(400).json({
        success: false,
        message: `Booking cannot be rejected because current status is ${booking.status}.`,
      });
    }

    // Atomically free any held slots
    await releaseSlots(booking._id);

    booking.status = BOOKING_STATUS.REJECTED;
    booking.rejectionReason = rejectionReason;
    booking.reviewedBy = req.user._id;
    booking.reviewedAt = new Date();
    await booking.save();

    await recordAuditLog({
      actor: req.user._id,
      action: AUDIT_ACTIONS.BOOKING_REJECT,
      targetModel: 'Booking',
      targetId: booking._id,
      details: {
        bookingNumber: booking.bookingNumber,
        rejectionReason,
      },
      req,
    });

    await sendNotification({
      recipient: booking.user,
      title: 'Booking Request Declined',
      message: `Your booking #${booking.bookingNumber} for ${booking.resource?.name} was rejected. Reason: ${rejectionReason}`,
      type: NOTIFICATION_TYPES.BOOKING_REJECTED,
      link: `/bookings/${booking._id}`,
      metadata: { bookingId: booking._id, rejectionReason },
    });

    res.status(200).json({
      success: true,
      message: 'Booking rejected and held slots released.',
      data: { booking },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createBooking,
  getMyBookings,
  getBookingById,
  cancelBooking,
  getAdminQueue,
  approveBooking,
  rejectBooking,
};
