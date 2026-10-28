const Resource = require('../models/Resource');
const { getResourceAvailability } = require('../services/slotService');
const { recordAuditLog } = require('../services/auditService');
const { AUDIT_ACTIONS, RESOURCE_STATUS } = require('../config/constants');

/**
 * List resources with search, filters, sorting, and pagination
 */
const getResources = async (req, res, next) => {
  try {
    const { search, type, building, minCapacity, status, page = 1, limit = 12, sort = '-createdAt' } = req.query;

    const filter = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { building: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    if (type) {
      filter.type = type;
    }

    if (building) {
      filter.building = { $regex: building, $options: 'i' };
    }

    if (minCapacity) {
      filter.capacity = { $gte: Number(minCapacity) };
    }

    // By default, public search only shows active resources unless admin explicitly requests status
    if (status) {
      filter.status = status;
    } else if (!req.user || req.user.role !== 'admin') {
      filter.status = RESOURCE_STATUS.ACTIVE;
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [resources, total] = await Promise.all([
      Resource.find(filter).sort(sort).skip(skip).limit(Number(limit)),
      Resource.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: {
        resources,
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
 * Get resource by ID
 */
const getResourceById = async (req, res, next) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found.',
      });
    }

    res.status(200).json({
      success: true,
      data: { resource },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Check resource real-time availability for a date
 */
const checkAvailability = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Query parameter "date" (YYYY-MM-DD) is required.',
      });
    }

    const availability = await getResourceAvailability(id, date);

    res.status(200).json({
      success: true,
      data: availability,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create new campus resource (Admin only)
 */
const createResource = async (req, res, next) => {
  try {
    const existing = await Resource.findOne({ code: req.body.code.toUpperCase() });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: `A resource with code "${req.body.code}" already exists.`,
      });
    }

    const resource = await Resource.create({
      ...req.body,
      code: req.body.code.toUpperCase(),
    });

    await recordAuditLog({
      actor: req.user._id,
      action: AUDIT_ACTIONS.RESOURCE_CREATE,
      targetModel: 'Resource',
      targetId: resource._id,
      details: { name: resource.name, code: resource.code, type: resource.type },
      req,
    });

    res.status(201).json({
      success: true,
      message: 'Resource created successfully.',
      data: { resource },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update resource details (Admin only)
 */
const updateResource = async (req, res, next) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found.',
      });
    }

    if (req.body.code && req.body.code.toUpperCase() !== resource.code) {
      const existing = await Resource.findOne({
        code: req.body.code.toUpperCase(),
        _id: { $ne: resource._id },
      });
      if (existing) {
        return res.status(409).json({
          success: false,
          message: `A resource with code "${req.body.code}" already exists.`,
        });
      }
      req.body.code = req.body.code.toUpperCase();
    }

    Object.assign(resource, req.body);
    await resource.save();

    await recordAuditLog({
      actor: req.user._id,
      action: AUDIT_ACTIONS.RESOURCE_UPDATE,
      targetModel: 'Resource',
      targetId: resource._id,
      details: { updatedFields: Object.keys(req.body) },
      req,
    });

    res.status(200).json({
      success: true,
      message: 'Resource updated successfully.',
      data: { resource },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Deactivate / Archive resource (Admin only)
 */
const deleteResource = async (req, res, next) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found.',
      });
    }

    // Soft delete / archive to preserve historical booking audit trails
    resource.status = RESOURCE_STATUS.INACTIVE;
    await resource.save();

    await recordAuditLog({
      actor: req.user._id,
      action: AUDIT_ACTIONS.RESOURCE_DELETE,
      targetModel: 'Resource',
      targetId: resource._id,
      details: { name: resource.name, code: resource.code },
      req,
    });

    res.status(200).json({
      success: true,
      message: 'Resource status set to inactive.',
      data: { resource },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getResources,
  getResourceById,
  checkAvailability,
  createResource,
  updateResource,
  deleteResource,
};
