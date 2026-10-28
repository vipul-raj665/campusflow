const { z } = require('zod');
const { RESOURCE_TYPES, RESOURCE_STATUS, ROLES } = require('../config/constants');

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

const createResourceSchema = z.object({
  name: z.string().trim().min(2, 'Resource name is required'),
  code: z.string().trim().min(2, 'Unique resource code is required').toUpperCase(),
  type: z.enum(Object.values(RESOURCE_TYPES)),
  building: z.string().trim().min(1, 'Building is required'),
  roomNumber: z.string().trim().min(1, 'Room number is required'),
  capacity: z.coerce.number().int().positive('Capacity must be at least 1'),
  amenities: z.array(z.string()).optional().default([]),
  operatingHours: z
    .object({
      openTime: z.string().regex(timeRegex, 'Invalid open time format (HH:mm)').default('08:00'),
      closeTime: z.string().regex(timeRegex, 'Invalid close time format (HH:mm)').default('20:00'),
    })
    .default({ openTime: '08:00', closeTime: '20:00' }),
  allowedRoles: z.array(z.enum(Object.values(ROLES))).default([ROLES.STUDENT, ROLES.FACULTY, ROLES.ADMIN]),
  minDurationMinutes: z.coerce.number().int().min(15).default(30),
  maxDurationMinutes: z.coerce.number().int().max(720).default(240),
  advanceBookingDaysLimit: z.coerce.number().int().min(1).default(14),
  bufferMinutes: z.coerce.number().int().min(0).default(0),
  status: z.enum(Object.values(RESOURCE_STATUS)).default(RESOURCE_STATUS.ACTIVE),
  imageUrl: z.string().optional().default(''),
  description: z.string().trim().optional().default(''),
});

const updateResourceSchema = createResourceSchema.partial();

const queryResourceSchema = z.object({
  search: z.string().optional(),
  type: z.string().optional(),
  building: z.string().optional(),
  minCapacity: z.coerce.number().optional(),
  status: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(12),
  sort: z.string().optional().default('-createdAt'),
});

module.exports = {
  createResourceSchema,
  updateResourceSchema,
  queryResourceSchema,
};
