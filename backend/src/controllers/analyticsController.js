const Booking = require('../models/Booking');
const Resource = require('../models/Resource');
const User = require('../models/User');
const Maintenance = require('../models/Maintenance');
const Notification = require('../models/Notification');
const { BOOKING_STATUS, RESOURCE_STATUS, MAINTENANCE_STATUS } = require('../config/constants');

/**
 * Get comprehensive analytics for Administrator Dashboard
 */
const getAdminDashboardStats = async (req, res, next) => {
  try {
    const todayStr = new Date().toISOString().slice(0, 10);

    const [
      totalResources,
      activeResources,
      totalUsers,
      pendingCount,
      approvedCount,
      rejectedCount,
      cancelledCount,
      activeMaintenanceCount,
      upcomingTodayCount,
    ] = await Promise.all([
      Resource.countDocuments(),
      Resource.countDocuments({ status: RESOURCE_STATUS.ACTIVE }),
      User.countDocuments(),
      Booking.countDocuments({ status: BOOKING_STATUS.PENDING }),
      Booking.countDocuments({ status: BOOKING_STATUS.APPROVED }),
      Booking.countDocuments({ status: BOOKING_STATUS.REJECTED }),
      Booking.countDocuments({ status: BOOKING_STATUS.CANCELLED }),
      Maintenance.countDocuments({ status: { $in: [MAINTENANCE_STATUS.SCHEDULED, MAINTENANCE_STATUS.IN_PROGRESS] } }),
      Booking.countDocuments({ date: todayStr, status: BOOKING_STATUS.APPROVED }),
    ]);

    // Aggregate bookings by resource type
    const bookingsByType = await Booking.aggregate([
      {
        $lookup: {
          from: 'resources',
          localField: 'resource',
          foreignField: '_id',
          as: 'resourceDetails',
        },
      },
      { $unwind: '$resourceDetails' },
      {
        $group: {
          _id: '$resourceDetails.type',
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          type: '$_id',
          count: 1,
          _id: 0,
        },
      },
      { $sort: { count: -1 } },
    ]);

    // Aggregate bookings by department
    const bookingsByDepartment = await Booking.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'userDetails',
        },
      },
      { $unwind: '$userDetails' },
      {
        $group: {
          _id: '$userDetails.department',
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          department: '$_id',
          count: 1,
          _id: 0,
        },
      },
      { $sort: { count: -1 } },
      { $limit: 8 },
    ]);

    // Top 5 most booked resources
    const topResources = await Booking.aggregate([
      { $match: { status: { $in: [BOOKING_STATUS.APPROVED, BOOKING_STATUS.COMPLETED] } } },
      {
        $group: {
          _id: '$resource',
          totalBookings: { $sum: 1 },
        },
      },
      { $sort: { totalBookings: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'resources',
          localField: '_id',
          foreignField: '_id',
          as: 'resource',
        },
      },
      { $unwind: '$resource' },
      {
        $project: {
          _id: '$resource._id',
          name: '$resource.name',
          code: '$resource.code',
          type: '$resource.type',
          building: '$resource.building',
          totalBookings: 1,
        },
      },
    ]);

    // Daily booking trends for the last 14 days
    const past14Days = new Date();
    past14Days.setDate(past14Days.getDate() - 14);

    const dailyTrends = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: past14Days },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          total: { $sum: 1 },
          approved: {
            $sum: { $cond: [{ $eq: ['$status', BOOKING_STATUS.APPROVED] }, 1, 0] },
          },
          pending: {
            $sum: { $cond: [{ $eq: ['$status', BOOKING_STATUS.PENDING] }, 1, 0] },
          },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          date: '$_id',
          total: 1,
          approved: 1,
          pending: 1,
          _id: 0,
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalResources,
          activeResources,
          totalUsers,
          totalBookings: pendingCount + approvedCount + rejectedCount + cancelledCount,
          pendingCount,
          approvedCount,
          rejectedCount,
          cancelledCount,
          activeMaintenanceCount,
          upcomingTodayCount,
        },
        bookingsByType,
        bookingsByDepartment,
        topResources,
        dailyTrends,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get dashboard stats for individual Student or Faculty
 */
const getUserDashboardStats = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const now = new Date();

    const [pendingCount, approvedCount, totalBookings, unreadNotificationsCount, upcomingBookings, recentBookings] =
      await Promise.all([
        Booking.countDocuments({ user: userId, status: BOOKING_STATUS.PENDING }),
        Booking.countDocuments({ user: userId, status: BOOKING_STATUS.APPROVED }),
        Booking.countDocuments({ user: userId }),
        Notification.countDocuments({ recipient: userId, isRead: false }),
        Booking.find({
          user: userId,
          status: BOOKING_STATUS.APPROVED,
          endDateTime: { $gte: now },
        })
          .populate('resource', 'name code building roomNumber imageUrl')
          .sort('startDateTime')
          .limit(5),
        Booking.find({ user: userId })
          .populate('resource', 'name code building roomNumber')
          .sort('-createdAt')
          .limit(5),
      ]);

    res.status(200).json({
      success: true,
      data: {
        stats: {
          pendingCount,
          approvedCount,
          totalBookings,
          unreadNotificationsCount,
        },
        upcomingBookings,
        recentBookings,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Export filtered bookings to CSV
 */
const exportBookingsCSV = async (req, res, next) => {
  try {
    const { status, startDate, endDate } = req.query;
    const filter = {};

    if (status && status !== 'all') {
      filter.status = status;
    }

    if (startDate && endDate) {
      filter.date = { $gte: startDate, $lte: endDate };
    }

    const bookings = await Booking.find(filter)
      .populate('resource', 'name code building roomNumber type')
      .populate('user', 'name email department studentOrEmployeeId')
      .sort('-date -startTime');

    // Build CSV string
    const headers = [
      'Booking Number',
      'Resource Name',
      'Resource Code',
      'Type',
      'Building',
      'Room',
      'Requester Name',
      'Requester Email',
      'Department',
      'Date',
      'Start Time',
      'End Time',
      'Attendees',
      'Status',
      'Purpose',
      'Created At',
    ];

    const escapeCsv = (str) => {
      if (str === null || str === undefined) return '""';
      const clean = String(str).replace(/"/g, '""');
      return `"${clean}"`;
    };

    const rows = bookings.map((b) => [
      escapeCsv(b.bookingNumber),
      escapeCsv(b.resource?.name || 'N/A'),
      escapeCsv(b.resource?.code || 'N/A'),
      escapeCsv(b.resource?.type || 'N/A'),
      escapeCsv(b.resource?.building || 'N/A'),
      escapeCsv(b.resource?.roomNumber || 'N/A'),
      escapeCsv(b.user?.name || 'N/A'),
      escapeCsv(b.user?.email || 'N/A'),
      escapeCsv(b.user?.department || 'N/A'),
      escapeCsv(b.date),
      escapeCsv(b.startTime),
      escapeCsv(b.endTime),
      escapeCsv(b.expectedAttendees),
      escapeCsv(b.status),
      escapeCsv(b.purpose),
      escapeCsv(b.createdAt?.toISOString()),
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="campusflow_bookings_${Date.now()}.csv"`);
    res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};

/**
 * Export resource utilization report to CSV
 */
const exportUtilizationCSV = async (req, res, next) => {
  try {
    const resources = await Resource.find().sort('name');

    const headers = [
      'Resource Name',
      'Code',
      'Type',
      'Building',
      'Room Number',
      'Capacity',
      'Status',
      'Operating Hours',
      'Total Approved Bookings',
    ];

    const escapeCsv = (str) => {
      if (str === null || str === undefined) return '""';
      const clean = String(str).replace(/"/g, '""');
      return `"${clean}"`;
    };

    const rows = [];
    for (const r of resources) {
      const approvedCount = await Booking.countDocuments({
        resource: r._id,
        status: { $in: [BOOKING_STATUS.APPROVED, BOOKING_STATUS.COMPLETED] },
      });

      rows.push([
        escapeCsv(r.name),
        escapeCsv(r.code),
        escapeCsv(r.type),
        escapeCsv(r.building),
        escapeCsv(r.roomNumber),
        escapeCsv(r.capacity),
        escapeCsv(r.status),
        escapeCsv(`${r.operatingHours?.openTime} - ${r.operatingHours?.closeTime}`),
        escapeCsv(approvedCount),
      ]);
    }

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="campusflow_resource_utilization_${Date.now()}.csv"`);
    res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAdminDashboardStats,
  getUserDashboardStats,
  exportBookingsCSV,
  exportUtilizationCSV,
};
