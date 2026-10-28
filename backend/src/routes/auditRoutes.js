const express = require('express');
const router = express.Router();
const { getAuditLogs } = require('../controllers/auditController');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const { ROLES } = require('../config/constants');

// All audit routes are Admin-only
router.use(authenticate, authorize(ROLES.ADMIN));

router.get('/', getAuditLogs);

module.exports = router;
