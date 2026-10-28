const { z } = require('zod');

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const createMaintenanceSchema = z
  .object({
    resource: z.string().regex(objectIdRegex, 'Invalid resource ID'),
    title: z.string().trim().min(3, 'Title is required (min 3 chars)').max(150),
    reason: z.string().trim().min(5, 'Reason is required (min 5 chars)').max(1000),
    startDate: z.string().regex(dateRegex, 'Invalid start date format (YYYY-MM-DD)'),
    endDate: z.string().regex(dateRegex, 'Invalid end date format (YYYY-MM-DD)'),
    startTime: z.string().regex(timeRegex, 'Invalid start time format (HH:mm)'),
    endTime: z.string().regex(timeRegex, 'Invalid end time format (HH:mm)'),
  })
  .refine((data) => data.startDate <= data.endDate, {
    message: 'End date must be on or after start date',
    path: ['endDate'],
  });

module.exports = {
  createMaintenanceSchema,
};
