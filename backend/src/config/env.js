const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const requiredVars = [
  'MONGODB_URI',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
];

const missing = requiredVars.filter((key) => !process.env[key]);

if (missing.length > 0) {
  console.warn(`[Configuration Warning] Missing environment variables: ${missing.join(', ')}`);
  console.warn('CampusFlow is using default fallbacks. Please configure MONGODB_URI in your deployment dashboard.');
}

const config = {
  port: parseInt(process.env.PORT, 10) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  mongodbUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/campusflow',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'cf_default_access_secret_for_dev_mode_only_12345',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'cf_default_refresh_secret_for_dev_mode_only_12345',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  cookie: {
    secret: process.env.COOKIE_SECRET || 'cf_dev_cookie_secret_99887766554433221100',
    refreshCookieName: 'campusflow_refresh',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  },
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || 'CampusFlow Notifications <no-reply@campusflow.edu>',
  },
};

module.exports = config;
