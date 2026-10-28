const http = require('http');
const app = require('./app');
const config = require('./config/env');
const { connectDB, disconnectDB } = require('./config/db');
const { initSocketIO } = require('./sockets/socketHandler');

const server = http.createServer(app);

// Initialize Socket.IO with server
initSocketIO(server);

// Start server
const startServer = async () => {
  try {
    server.listen(config.port, '0.0.0.0', () => {
      console.log('====================================================');
      console.log(`[CampusFlow Server] Running in ${config.nodeEnv} mode`);
      console.log(`[HTTP API] Listening on: http://0.0.0.0:${config.port}/api/v1`);
      console.log(`[Health Probe] Ready at: http://0.0.0.0:${config.port}/api/v1/health`);
      console.log(`[Swagger Docs] Available at: http://0.0.0.0:${config.port}/api/docs`);
      console.log('====================================================');
    });

    if (config.mongodbUri) {
      connectDB().catch((err) => {
        console.error(`[Database Error] Connection failed: ${err.message}`);
        console.error('Please verify your MONGODB_URI and ensure MongoDB Atlas Network Access allows 0.0.0.0/0.');
      });
    } else {
      console.warn('[Database Warning] MONGODB_URI is not set. Configure MONGODB_URI in your dashboard.');
    }
  } catch (error) {
    console.error(`[Fatal Startup Error] Failed to launch server: ${error.message}`);
  }
};

// Graceful shutdown
const shutdown = async () => {
  console.log('\n[Process] Received termination signal. Closing gracefully...');
  server.close(async () => {
    await disconnectDB();
    console.log('[CampusFlow Server] Shutdown complete.');
    process.exit(0);
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

if (require.main === module) {
  startServer();
}

module.exports = { app, server, startServer };
