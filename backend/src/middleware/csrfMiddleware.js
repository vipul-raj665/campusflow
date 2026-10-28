/**
 * Anti-CSRF protection middleware
 * For state-changing requests, ensure custom header is present,
 * preventing malicious cross-site forms or non-preflighted requests.
 */
const csrfProtection = (req, res, next) => {
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (safeMethods.includes(req.method)) {
    return next();
  }

  // If request uses Bearer token in Authorization header, it's inherently immune to classic ambient cookie CSRF
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    return next();
  }

  // For requests using ambient cookies (such as refresh token endpoint), enforce custom anti-CSRF header
  const xRequestedWith = req.headers['x-requested-with'];
  if (xRequestedWith === 'XMLHttpRequest') {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: 'CSRF verification failed: Missing required X-Requested-With header.',
  });
};

module.exports = csrfProtection;
