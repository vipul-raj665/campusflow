const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const resourceRoutes = require('./resourceRoutes');
const bookingRoutes = require('./bookingRoutes');
const maintenanceRoutes = require('./maintenanceRoutes');
const notificationRoutes = require('./notificationRoutes');
const analyticsRoutes = require('./analyticsRoutes');
const userRoutes = require('./userRoutes');
const auditRoutes = require('./auditRoutes');
const healthRoutes = require('./healthRoutes');

router.use('/auth', authRoutes);
router.use('/resources', resourceRoutes);
router.use('/bookings', bookingRoutes);
router.use('/maintenance', maintenanceRoutes);
router.use('/notifications', notificationRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/users', userRoutes);
router.use('/audit-logs', auditRoutes);
router.use('/health', healthRoutes);

module.exports = router;
