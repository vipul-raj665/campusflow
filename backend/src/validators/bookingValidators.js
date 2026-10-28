const { z } = require('zod');
const { BOOKING_STATUS } = require('../config/constants');

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const createBookingSchema = z
  .object({
    resource: z.string().regex(objectIdRegex, 'Invalid resource ID'),
    date: z.string().regex(dateRegex, 'Invalid date format (YYYY-MM-DD)'),
    startTime: z.string().regex(timeRegex, 'Invalid start time format (HH:mm)'),
    endTime: z.string().regex(timeRegex, 'Invalid end time format (HH:mm)'),
    purpose: z.string().trim().min(5, 'Purpose must be at least 5 characters').max(500),
    expectedAttendees: z.coerce.number().int().positive().default(1),
  })
  .refine((data) => data.startTime < data.endTime, {
    message: 'End time must be after start time',
    path: ['endTime'],
  });

const cancelBookingSchema = z.object({
  cancellationReason: z.string().trim().max(300).optional().default('Cancelled by user'),
});

const rejectBookingSchema = z.object({
  rejectionReason: z.string().trim().min(3, 'Rejection reason is required (min 3 characters)').max(500),
});

const queryBookingSchema = z.object({
  status: z.enum([...Object.values(BOOKING_STATUS), 'all']).optional(),
  resource: z.string().optional(),
  date: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

module.exports = {
  createBookingSchema,
  cancelBookingSchema,
  rejectBookingSchema,
  queryBookingSchema,
};
