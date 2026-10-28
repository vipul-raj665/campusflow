const express = require('express');
const router = express.Router();
const {
  getUsers,
  updateUserRole,
  updateUserStatus,
} = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const validate = require('../middleware/validateMiddleware');
const {
  updateRoleSchema,
  updateStatusSchema,
} = require('../validators/userValidators');
const { ROLES } = require('../config/constants');

// All user management routes are Admin-only
router.use(authenticate, authorize(ROLES.ADMIN));

router.get('/', getUsers);
router.patch('/:id/role', validate(updateRoleSchema), updateUserRole);
router.patch('/:id/status', validate(updateStatusSchema), updateUserStatus);

module.exports = router;
