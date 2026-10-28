const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const swaggerUi = require('swagger-ui-express');
const config = require('./config/env');
const swaggerSpec = require('./config/swagger');
const routes = require('./routes');
const { apiLimiter } = require('./middleware/rateLimiter');
const { notFoundHandler, errorHandler } = require('./middleware/errorMiddleware');

const app = express();

// Trust reverse proxies (Render, Railway, Heroku, Cloudflare)
app.set('trust proxy', 1);

// Helper to validate allowed origins across local and production deployment platforms
const isOriginAllowed = (origin) => {
  if (!origin) return true;
  const configured = (config.clientOrigin || '').split(',').map((o) => o.trim().replace(/\/$/, ''));
  const normalized = origin.replace(/\/$/, '');
  return (
    configured.includes('*') ||
    configured.includes(normalized) ||
    normalized.endsWith('.onrender.com') ||
    normalized.endsWith('.up.railway.app') ||
    normalized.endsWith('.railway.app') ||
    normalized.endsWith('.vercel.app') ||
    normalized.includes('localhost') ||
    normalized.includes('127.0.0.1')
  );
};

// Secure HTTP headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// CORS configuration supporting dynamic deployment origins
app.use(
  cors({
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked request from origin: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// Body and Cookie Parsers
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));
app.use(cookieParser(config.cookie.secret));

// Apply general API rate limiter
app.use('/api', apiLimiter);

// Interactive OpenAPI / Swagger Documentation
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));

const fs = require('fs');
const path = require('path');

// Primary Versioned REST Endpoints
app.use('/api/v1', routes);

// Serve frontend static assets in production if built
const frontendDist = path.join(__dirname, '../../frontend/dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

// 404 and Centralized Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
