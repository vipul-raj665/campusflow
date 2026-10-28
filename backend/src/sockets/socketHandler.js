const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const config = require('../config/env');
const { setSocketIO } = require('../services/notificationService');

/**
 * Initialize and configure Socket.IO with authenticated private user rooms
 * @param {import('http').Server} httpServer
 */
const initSocketIO = (httpServer) => {
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

  const io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        callback(null, isOriginAllowed(origin));
      },
      credentials: true,
      methods: ['GET', 'POST'],
    },
    pingTimeout: 60000,
  });

  // Socket authentication middleware
  io.use((socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        return next(new Error('Authentication token required for WebSocket connection.'));
      }

      const decoded = jwt.verify(token, config.jwt.accessSecret);
      socket.user = {
        id: decoded.id,
        role: decoded.role,
        email: decoded.email,
      };

      next();
    } catch (err) {
      next(new Error('Invalid or expired socket authentication token.'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user.id;
    const userRole = socket.user.role;

    // Join strictly authorized user room
    socket.join(`user:${userId}`);

    // If administrator, join administrative alert room
    if (userRole === 'admin') {
      socket.join('role:admin');
    }

    socket.on('disconnect', () => {
      // Disconnection handled silently and safely
    });
  });

  // Provide io instance to notification service
  setSocketIO(io);

  return io;
};

module.exports = {
  initSocketIO,
};
