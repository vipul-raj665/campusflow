const express = require('express');
const router = express.Router();
const {
  getMaintenanceBlocks,
  createMaintenance,
  cancelMaintenance,
} = require('../controllers/maintenanceController');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const validate = require('../middleware/validateMiddleware');
const { createMaintenanceSchema } = require('../validators/maintenanceValidators');
const { ROLES } = require('../config/constants');

// All maintenance routes are Admin-only
router.use(authenticate, authorize(ROLES.ADMIN));

router.get('/', getMaintenanceBlocks);
router.post('/', validate(createMaintenanceSchema), createMaintenance);
router.patch('/:id/cancel', cancelMaintenance);

module.exports = router;
