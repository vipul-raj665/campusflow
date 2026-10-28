const express = require('express');
const router = express.Router();
const {
  getResources,
  getResourceById,
  checkAvailability,
  createResource,
  updateResource,
  deleteResource,
} = require('../controllers/resourceController');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const validate = require('../middleware/validateMiddleware');
const {
  createResourceSchema,
  updateResourceSchema,
  queryResourceSchema,
} = require('../validators/resourceValidators');
const { ROLES } = require('../config/constants');

// Public resource browsing
router.get('/', validate(queryResourceSchema, 'query'), getResources);
router.get('/:id', getResourceById);
router.get('/:id/availability', checkAvailability);

// Admin-only management endpoints
router.post('/', authenticate, authorize(ROLES.ADMIN), validate(createResourceSchema), createResource);
router.put('/:id', authenticate, authorize(ROLES.ADMIN), validate(updateResourceSchema), updateResource);
router.delete('/:id', authenticate, authorize(ROLES.ADMIN), deleteResource);

module.exports = router;
