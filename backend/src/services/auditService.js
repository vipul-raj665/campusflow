const AuditLog = require('../models/AuditLog');

/**
 * Record an administrative or security-sensitive action
 * @param {object} params
 * @param {string|ObjectId} params.actor - Acting User ID
 * @param {string} params.action - One of AUDIT_ACTIONS
 * @param {string} params.targetModel - e.g. 'Booking', 'Resource', 'User'
 * @param {string|ObjectId} params.targetId - ID of target entity
 * @param {object} [params.details] - Non-sensitive context
 * @param {object} [params.req] - Express request object for IP and agent
 */
const recordAuditLog = async ({ actor, action, targetModel, targetId, details = {}, req = null }) => {
  try {
    const ipAddress = req
      ? req.headers['x-forwarded-for'] || req.socket?.remoteAddress || ''
      : '';
    const userAgent = req ? req.headers['user-agent'] || '' : '';

    // Sanitize details to never persist sensitive keys
    const sanitizedDetails = { ...details };
    delete sanitizedDetails.password;
    delete sanitizedDetails.token;
    delete sanitizedDetails.refreshToken;
    delete sanitizedDetails.secret;

    await AuditLog.create({
      actor,
      action,
      targetModel,
      targetId: String(targetId),
      details: sanitizedDetails,
      ipAddress: String(ipAddress).slice(0, 50),
      userAgent: String(userAgent).slice(0, 200),
    });
  } catch (error) {
    console.error(`[Audit Service Error] Failed to write audit log: ${error.message}`);
  }
};

module.exports = {
  recordAuditLog,
};
