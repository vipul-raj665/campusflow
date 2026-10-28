const Maintenance = require('../models/Maintenance');
const Resource = require('../models/Resource');
const Booking = require('../models/Booking');
const ReservationSlot = require('../models/ReservationSlot');
const { releaseSlots, blockMaintenanceSlots } = require('../services/slotService');
const { sendNotification } = require('../services/notificationService');
const { recordAuditLog } = require('../services/auditService');
const { createDateTime } = require('../utils/timeUtils');
const { MAINTENANCE_STATUS, BOOKING_STATUS, NOTIFICATION_TYPES, AUDIT_ACTIONS, RESOURCE_STATUS } = require('../config/constants');

/**
 * List all maintenance periods
 */
const getMaintenanceBlocks = async (req, res, next) => {
  try {
    const { resource, status, page = 1, limit = 10 } = req.query;
    const filter = {};

    if (resource) {
      filter.resource = resource;
    }

    if (status) {
      filter.status = status;
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [maintenanceBlocks, total] = await Promise.all([
      Maintenance.find(filter)
        .populate('resource', 'name code building roomNumber')
        .populate('createdBy', 'name email')
        .sort('-startDateTime')
        .skip(skip)
        .limit(Number(limit)),
      Maintenance.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: {
        maintenanceBlocks,
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
 * Schedule resource maintenance and resolve booking conflicts with user notification
 */
const createMaintenance = async (req, res, next) => {
  try {
    const { resource: resourceId, title, reason, startDate, endDate, startTime, endTime } = req.body;

    const resource = await Resource.findById(resourceId);
    if (!resource) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found.',
      });
    }

    const startDateTime = createDateTime(startDate, startTime);
    const endDateTime = createDateTime(endDate, endTime);

    if (endDateTime <= startDateTime) {
      return res.status(400).json({
        success: false,
        message: 'Maintenance end time must be after start time.',
      });
    }

    // Detect overlapping active or pending bookings
    const conflictingBookings = await Booking.find({
      resource: resourceId,
      status: { $in: [BOOKING_STATUS.PENDING, BOOKING_STATUS.APPROVED] },
      startDateTime: { $lt: endDateTime },
      endDateTime: { $gt: startDateTime },
    }).populate('user', 'name email');

    // Policy: Cancel overlapping bookings and release their user slots
    for (const booking of conflictingBookings) {
      await releaseSlots(booking._id);
      booking.status = BOOKING_STATUS.CANCELLED;
      booking.cancellationReason = `Resource scheduled for maintenance: ${title} (${reason})`;
      await booking.save();

      // Notify affected users
      await sendNotification({
        recipient: booking.user._id,
        title: 'Booking Cancelled due to Campus Maintenance ⚠️',
        message: `Your booking #${booking.bookingNumber} on ${booking.date} (${booking.startTime}-${booking.endTime}) was cancelled because ${resource.name} has scheduled maintenance: ${title}.`,
        type: NOTIFICATION_TYPES.MAINTENANCE_SCHEDULED,
        link: `/bookings/${booking._id}`,
        metadata: { bookingId: booking._id, resourceId },
      });
    }

    // Create Maintenance document
    const maintenance = await Maintenance.create({
      resource: resourceId,
      title,
      reason,
      startDate,
      endDate,
      startTime,
      endTime,
      startDateTime,
      endDateTime,
      affectedBookingsCount: conflictingBookings.length,
      createdBy: req.user._id,
    });

    // Block reservation slots for maintenance
    await blockMaintenanceSlots(resourceId, startDate, startTime, endTime, maintenance._id);

    // If maintenance starts today or is immediate, update resource status
    const now = new Date();
    if (now >= startDateTime && now <= endDateTime) {
      resource.status = RESOURCE_STATUS.MAINTENANCE;
      await resource.save();
    }

    await recordAuditLog({
      actor: req.user._id,
      action: AUDIT_ACTIONS.MAINTENANCE_CREATE,
      targetModel: 'Maintenance',
      targetId: maintenance._id,
      details: {
        resource: resource.name,
        title,
        startDate,
        endDate,
        affectedBookingsCount: conflictingBookings.length,
      },
      req,
    });

    res.status(201).json({
      success: true,
      message: `Maintenance scheduled. ${conflictingBookings.length} overlapping booking(s) were notified and safely cancelled.`,
      data: { maintenance, affectedBookingsCount: conflictingBookings.length },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cancel a scheduled maintenance period
 */
const cancelMaintenance = async (req, res, next) => {
  try {
    const { id } = req.params;

    const maintenance = await Maintenance.findById(id).populate('resource');
    if (!maintenance) {
      return res.status(404).json({
        success: false,
        message: 'Maintenance record not found.',
      });
    }

    // Release maintenance blocked slots
    await ReservationSlot.deleteMany({ booking: maintenance._id });

    // Restore resource status to active if currently maintenance
    if (maintenance.resource && maintenance.resource.status === RESOURCE_STATUS.MAINTENANCE) {
      maintenance.resource.status = RESOURCE_STATUS.ACTIVE;
      await maintenance.resource.save();
    }

    maintenance.status = MAINTENANCE_STATUS.CANCELLED;
    await maintenance.save();

    await recordAuditLog({
      actor: req.user._id,
      action: AUDIT_ACTIONS.MAINTENANCE_CANCEL,
      targetModel: 'Maintenance',
      targetId: maintenance._id,
      details: { title: maintenance.title, resource: maintenance.resource?.name },
      req,
    });

    res.status(200).json({
      success: true,
      message: 'Maintenance cancelled and resource slots unlocked.',
      data: { maintenance },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMaintenanceBlocks,
  createMaintenance,
  cancelMaintenance,
};
