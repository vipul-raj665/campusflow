const AuditLog = require('../models/AuditLog');

/**
 * Retrieve system audit logs with filters (Admin only)
 */
const getAuditLogs = async (req, res, next) => {
  try {
    const { action, targetModel, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (action) {
      filter.action = action;
    }

    if (targetModel) {
      filter.targetModel = targetModel;
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [auditLogs, total] = await Promise.all([
      AuditLog.find(filter)
        .populate('actor', 'name email role department')
        .sort('-createdAt')
        .skip(skip)
        .limit(Number(limit)),
      AuditLog.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: {
        auditLogs,
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

module.exports = {
  getAuditLogs,
};
