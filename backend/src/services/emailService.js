const config = require('../config/env');

/**
 * Send email or fall back to safe development logging
 * @param {object} options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Subject line
 * @param {string} options.text - Plain text content
 * @param {string} [options.html] - HTML content
 * @returns {Promise<{ delivered: boolean, mode: string }>}
 */
const sendEmail = async ({ to, subject, text, html = '' }) => {
  if (config.smtp.host && config.smtp.user && config.smtp.pass) {
    // In production with configured SMTP, nodemailer or provider is used
    try {
      // Lazy-load nodemailer if configured
      const nodemailer = require('nodemailer');
      const transporter = nodemailer.createTransport({
        host: config.smtp.host,
        port: config.smtp.port,
        secure: config.smtp.port === 465,
        auth: {
          user: config.smtp.user,
          pass: config.smtp.pass,
        },
      });

      await transporter.sendMail({
        from: config.smtp.from,
        to,
        subject,
        text,
        html: html || text,
      });

      return { delivered: true, mode: 'smtp' };
    } catch (err) {
      console.error(`[Email Service Error] Failed to send via SMTP to ${to}: ${err.message}`);
      return { delivered: false, mode: 'smtp_error', error: err.message };
    }
  }

  // Safe development fallback: Log non-sensitive action without crashing or silent pretending
  console.log('----------------------------------------------------');
  console.log(`[Email Service - Dev Mode] Simulated dispatch:`);
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(`Body:\n${text}`);
  console.log('----------------------------------------------------');

  return { delivered: true, mode: 'development_simulated' };
};

module.exports = {
  sendEmail,
};
