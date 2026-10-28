const mongoose = require('mongoose');
const { MAINTENANCE_STATUS } = require('../config/constants');

const maintenanceSchema = new mongoose.Schema(
  {
    resource: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resource',
      required: [true, 'Resource is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Maintenance title is required'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    reason: {
      type: String,
      required: [true, 'Maintenance reason is required'],
      trim: true,
      maxlength: [1000, 'Reason cannot exceed 1000 characters'],
    },
    startDate: {
      type: String, // YYYY-MM-DD
      required: true,
    },
    endDate: {
      type: String, // YYYY-MM-DD
      required: true,
    },
    startTime: {
      type: String, // HH:mm
      required: true,
    },
    endTime: {
      type: String, // HH:mm
      required: true,
    },
    startDateTime: {
      type: Date,
      required: true,
      index: true,
    },
    endDateTime: {
      type: Date,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(MAINTENANCE_STATUS),
      default: MAINTENANCE_STATUS.SCHEDULED,
      index: true,
    },
    affectedBookingsCount: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Maintenance = mongoose.models.Maintenance || mongoose.model('Maintenance', maintenanceSchema);
module.exports = Maintenance;
