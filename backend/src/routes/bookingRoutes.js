const express = require('express');
const router = express.Router();
const {
  createBooking,
  getMyBookings,
  getBookingById,
  cancelBooking,
  getAdminQueue,
  approveBooking,
  rejectBooking,
} = require('../controllers/bookingController');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const validate = require('../middleware/validateMiddleware');
const {
  createBookingSchema,
  cancelBookingSchema,
  rejectBookingSchema,
  queryBookingSchema,
} = require('../validators/bookingValidators');
const { ROLES } = require('../config/constants');

// Authenticated booking endpoints
router.post('/', authenticate, validate(createBookingSchema), createBooking);
router.get('/my', authenticate, validate(queryBookingSchema, 'query'), getMyBookings);
router.get('/admin/queue', authenticate, authorize(ROLES.ADMIN), getAdminQueue);
router.get('/:id', authenticate, getBookingById);
router.patch('/:id/cancel', authenticate, validate(cancelBookingSchema), cancelBooking);

// Admin-only approval and rejection
router.patch('/:id/approve', authenticate, authorize(ROLES.ADMIN), approveBooking);
router.patch('/:id/reject', authenticate, authorize(ROLES.ADMIN), validate(rejectBookingSchema), rejectBooking);

module.exports = router;
