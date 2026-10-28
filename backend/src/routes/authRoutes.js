const express = require('express');
const router = express.Router();
const {
  signup,
  login,
  refreshSession,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
} = require('../controllers/authController');
const { authenticate } = require('../middleware/authMiddleware');
const validate = require('../middleware/validateMiddleware');
const csrfProtection = require('../middleware/csrfMiddleware');
const { authLimiter } = require('../middleware/rateLimiter');
const {
  signupSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} = require('../validators/authValidators');

router.post('/signup', authLimiter, validate(signupSchema), signup);
router.post('/login', authLimiter, validate(loginSchema), login);
router.post('/refresh', csrfProtection, refreshSession);
router.post('/logout', logout);
router.get('/me', authenticate, getMe);
router.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', authLimiter, validate(resetPasswordSchema), resetPassword);

module.exports = router;
