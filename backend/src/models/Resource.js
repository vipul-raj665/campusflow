const mongoose = require('mongoose');
const { RESOURCE_TYPES, RESOURCE_STATUS, ROLES } = require('../config/constants');

const resourceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Resource name is required'],
      trim: true,
      index: true,
    },
    code: {
      type: String,
      required: [true, 'Resource identifier code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    type: {
      type: String,
      enum: Object.values(RESOURCE_TYPES),
      required: [true, 'Resource type is required'],
      index: true,
    },
    building: {
      type: String,
      required: [true, 'Building name is required'],
      trim: true,
      index: true,
    },
    roomNumber: {
      type: String,
      required: [true, 'Room or location number is required'],
      trim: true,
    },
    capacity: {
      type: Number,
      required: [true, 'Capacity is required'],
      min: [1, 'Capacity must be at least 1'],
    },
    amenities: {
      type: [String],
      default: [],
    },
    operatingHours: {
      openTime: {
        type: String,
        default: '08:00',
        match: [/^([01]\d|2[0-3]):[0-5]\d$/, 'Invalid time format (HH:mm)'],
      },
      closeTime: {
        type: String,
        default: '20:00',
        match: [/^([01]\d|2[0-3]):[0-5]\d$/, 'Invalid time format (HH:mm)'],
      },
    },
    allowedRoles: {
      type: [String],
      enum: Object.values(ROLES),
      default: [ROLES.STUDENT, ROLES.FACULTY, ROLES.ADMIN],
    },
    minDurationMinutes: {
      type: Number,
      default: 30,
      min: 15,
    },
    maxDurationMinutes: {
      type: Number,
      default: 240, // 4 hours
      max: 720,
    },
    advanceBookingDaysLimit: {
      type: Number,
      default: 14,
      min: 1,
    },
    bufferMinutes: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: Object.values(RESOURCE_STATUS),
      default: RESOURCE_STATUS.ACTIVE,
      index: true,
    },
    imageUrl: {
      type: String,
      default: '',
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound text index for search
resourceSchema.index({ name: 'text', description: 'text', building: 'text', code: 'text' });

const Resource = mongoose.models.Resource || mongoose.model('Resource', resourceSchema);
module.exports = Resource;
