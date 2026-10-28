const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const config = require('../config/env');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const PasswordResetToken = require('../models/PasswordResetToken');
const { sendEmail } = require('../services/emailService');
const { ROLES } = require('../config/constants');

// Helper to hash tokens with SHA-256
const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

// Generate JWT access token
const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role, email: user.email },
    config.jwt.accessSecret,
    { expiresIn: config.jwt.accessExpiresIn }
  );
};

// Generate random refresh token string
const generateRefreshTokenString = () => crypto.randomBytes(40).toString('hex');

// Attach HttpOnly cookie
const setRefreshTokenCookie = (res, token) => {
  res.cookie(config.cookie.refreshCookieName, token, {
    httpOnly: true,
    secure: config.isProduction, // HTTPS in production
    sameSite: config.isProduction ? 'none' : 'lax',
    maxAge: config.cookie.maxAge,
    path: '/api/v1/auth',
  });
};

/**
 * Register a new student or faculty account
 */
const signup = async (req, res, next) => {
  try {
    const { name, email, password, department, role, studentOrEmployeeId, phone } = req.body;

    // Check for duplicate email
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists.',
      });
    }

    // Role safety: public registration cannot create administrator accounts
    const assignedRole = role === ROLES.FACULTY ? ROLES.FACULTY : ROLES.STUDENT;

    const user = await User.create({
      name,
      email,
      password,
      department,
      role: assignedRole,
      studentOrEmployeeId,
      phone,
    });

    // Create session tokens
    const accessToken = generateAccessToken(user);
    const rawRefreshToken = generateRefreshTokenString();
    const tokenHash = hashToken(rawRefreshToken);
    const expiresAt = new Date(Date.now() + config.cookie.maxAge);

    await RefreshToken.create({
      user: user._id,
      tokenHash,
      expiresAt,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] || '',
    });

    setRefreshTokenCookie(res, rawRefreshToken);

    res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      data: {
        user,
        accessToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Authenticate existing user
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email address or password.',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email address or password.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact campus administration.',
      });
    }

    const accessToken = generateAccessToken(user);
    const rawRefreshToken = generateRefreshTokenString();
    const tokenHash = hashToken(rawRefreshToken);
    const expiresAt = new Date(Date.now() + config.cookie.maxAge);

    await RefreshToken.create({
      user: user._id,
      tokenHash,
      expiresAt,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] || '',
    });

    setRefreshTokenCookie(res, rawRefreshToken);

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: {
        user,
        accessToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Rotate refresh token and issue new access token
 */
const refreshSession = async (req, res, next) => {
  try {
    const incomingToken = req.cookies?.[config.cookie.refreshCookieName];
    if (!incomingToken) {
      return res.status(401).json({
        success: false,
        message: 'No refresh token provided in session cookie.',
      });
    }

    const incomingHash = hashToken(incomingToken);
    const tokenRecord = await RefreshToken.findOne({ tokenHash: incomingHash });

    if (!tokenRecord || tokenRecord.isRevoked || tokenRecord.expiresAt < new Date()) {
      // Possible reuse detection or expired token: clear cookie
      res.clearCookie(config.cookie.refreshCookieName, { path: '/api/v1/auth' });
      return res.status(401).json({
        success: false,
        message: 'Refresh token is invalid, expired, or revoked.',
      });
    }

    const user = await User.findById(tokenRecord.user);
    if (!user || !user.isActive) {
      res.clearCookie(config.cookie.refreshCookieName, { path: '/api/v1/auth' });
      return res.status(401).json({
        success: false,
        message: 'User account is invalid or deactivated.',
      });
    }

    // Token rotation: Revoke current token and generate replacement
    const newRawRefreshToken = generateRefreshTokenString();
    const newTokenHash = hashToken(newRawRefreshToken);
    const newExpiresAt = new Date(Date.now() + config.cookie.maxAge);

    tokenRecord.isRevoked = true;
    tokenRecord.replacedByTokenHash = newTokenHash;
    await tokenRecord.save();

    await RefreshToken.create({
      user: user._id,
      tokenHash: newTokenHash,
      expiresAt: newExpiresAt,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] || '',
    });

    setRefreshTokenCookie(res, newRawRefreshToken);

    const newAccessToken = generateAccessToken(user);

    res.status(200).json({
      success: true,
      message: 'Session refreshed successfully.',
      data: {
        user,
        accessToken: newAccessToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Revoke session and clear refresh cookie
 */
const logout = async (req, res, next) => {
  try {
    const incomingToken = req.cookies?.[config.cookie.refreshCookieName];
    if (incomingToken) {
      const incomingHash = hashToken(incomingToken);
      await RefreshToken.updateOne({ tokenHash: incomingHash }, { isRevoked: true });
    }

    res.clearCookie(config.cookie.refreshCookieName, {
      httpOnly: true,
      secure: config.isProduction,
      sameSite: config.isProduction ? 'none' : 'lax',
      path: '/api/v1/auth',
    });

    res.status(200).json({
      success: true,
      message: 'Logged out successfully.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get profile of currently authenticated user
 */
const getMe = async (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      user: req.user,
    },
  });
};

/**
 * Request password reset token
 */
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    // Prevent email enumeration: Always respond with success message
    const genericResponse = {
      success: true,
      message: 'If an account with that email exists, a password reset link has been dispatched.',
    };

    if (!user) {
      return res.status(200).json(genericResponse);
    }

    // Invalidate existing unused tokens for this user
    await PasswordResetToken.deleteMany({ user: user._id });

    const rawResetToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashToken(rawResetToken);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await PasswordResetToken.create({
      user: user._id,
      tokenHash,
      expiresAt,
    });

    const resetUrl = `${config.clientOrigin}/reset-password?token=${rawResetToken}`;

    await sendEmail({
      to: user.email,
      subject: 'CampusFlow Password Reset Request',
      text: `Hello ${user.name},\n\nYou requested a password reset for your CampusFlow account.\n\nPlease visit the following link within 1 hour to set a new password:\n${resetUrl}\n\nIf you did not request this, please ignore this email.`,
      html: `<p>Hello <strong>${user.name}</strong>,</p><p>You requested a password reset for your CampusFlow account.</p><p><a href="${resetUrl}">Click here to reset your password</a></p><p>This link expires in 1 hour.</p>`,
    });

    res.status(200).json(genericResponse);
  } catch (error) {
    next(error);
  }
};

/**
 * Execute password reset with valid token
 */
const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    const tokenHash = hashToken(token);

    const resetRecord = await PasswordResetToken.findOne({
      tokenHash,
      isUsed: false,
      expiresAt: { $gt: new Date() },
    });

    if (!resetRecord) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired password reset token.',
      });
    }

    const user = await User.findById(resetRecord.user);
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'User account not found.',
      });
    }

    // Update password (pre-save hook hashes it)
    user.password = newPassword;
    await user.save();

    // Mark reset token used
    resetRecord.isUsed = true;
    await resetRecord.save();

    // Revoke all existing refresh sessions for security
    await RefreshToken.updateMany({ user: user._id }, { isRevoked: true });

    res.status(200).json({
      success: true,
      message: 'Password reset successful. Please log in with your new password.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  signup,
  login,
  refreshSession,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
};
