const express = require('express');
const router = express.Router();
const {
  getAdminDashboardStats,
  getUserDashboardStats,
  exportBookingsCSV,
  exportUtilizationCSV,
} = require('../controllers/analyticsController');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const { ROLES } = require('../config/constants');

// Authenticated user metrics
router.get('/user-stats', authenticate, getUserDashboardStats);

// Admin-only dashboard analytics and CSV exports
router.get('/dashboard', authenticate, authorize(ROLES.ADMIN), getAdminDashboardStats);
router.get('/export/bookings', authenticate, authorize(ROLES.ADMIN), exportBookingsCSV);
router.get('/export/utilization', authenticate, authorize(ROLES.ADMIN), exportUtilizationCSV);

module.exports = router;
