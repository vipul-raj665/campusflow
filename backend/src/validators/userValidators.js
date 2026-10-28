const { z } = require('zod');
const { ROLES } = require('../config/constants');

const updateRoleSchema = z.object({
  role: z.enum(Object.values(ROLES)),
});

const updateStatusSchema = z.object({
  isActive: z.boolean(),
});

module.exports = {
  updateRoleSchema,
  updateStatusSchema,
};
