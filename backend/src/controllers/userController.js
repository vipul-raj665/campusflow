const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const { recordAuditLog } = require('../services/auditService');
const { AUDIT_ACTIONS } = require('../config/constants');

/**
 * List registered campus users (Admin only)
 */
const getUsers = async (req, res, next) => {
  try {
    const { search, role, status, department, page = 1, limit = 15 } = req.query;
    const filter = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { studentOrEmployeeId: { $regex: search, $options: 'i' } },
      ];
    }

    if (role) {
      filter.role = role;
    }

    if (status !== undefined && status !== '') {
      filter.isActive = status === 'true';
    }

    if (department) {
      filter.department = { $regex: department, $options: 'i' };
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [users, total] = await Promise.all([
      User.find(filter).sort('-createdAt').skip(skip).limit(Number(limit)),
      User.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: {
        users,
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
 * Change user role (Admin only)
 */
const updateUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    // Safety: prevent an admin from demoting themselves
    if (String(user._id) === String(req.user._id) && role !== 'admin') {
      return res.status(400).json({
        success: false,
        message: 'You cannot change or demote your own administrator role.',
      });
    }

    const previousRole = user.role;
    user.role = role;
    await user.save();

    await recordAuditLog({
      actor: req.user._id,
      action: AUDIT_ACTIONS.USER_ROLE_CHANGE,
      targetModel: 'User',
      targetId: user._id,
      details: { previousRole, newRole: role, targetUserEmail: user.email },
      req,
    });

    res.status(200).json({
      success: true,
      message: `User role updated from ${previousRole} to ${role}.`,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Suspend or reactivate user account (Admin only)
 */
const updateUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    // Safety: prevent admin from deactivating their own account
    if (String(user._id) === String(req.user._id)) {
      return res.status(400).json({
        success: false,
        message: 'You cannot deactivate your own account.',
      });
    }

    user.isActive = isActive;
    await user.save();

    // If deactivated, immediately revoke all active refresh tokens
    if (!isActive) {
      await RefreshToken.updateMany({ user: user._id }, { isRevoked: true });
    }

    await recordAuditLog({
      actor: req.user._id,
      action: AUDIT_ACTIONS.USER_STATUS_CHANGE,
      targetModel: 'User',
      targetId: user._id,
      details: { isActive, targetUserEmail: user.email },
      req,
    });

    res.status(200).json({
      success: true,
      message: `User account has been ${isActive ? 'reactivated' : 'suspended'}.`,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  updateUserRole,
  updateUserStatus,
};
