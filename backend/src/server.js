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
    await connectDB();

    server.listen(config.port, () => {
      console.log('====================================================');
      console.log(`[CampusFlow Server] Running in ${config.nodeEnv} mode`);
      console.log(`[HTTP API] Listening on: http://localhost:${config.port}/api/v1`);
      console.log(`[Health Probe] Ready at: http://localhost:${config.port}/api/v1/health`);
      console.log(`[Swagger Docs] Available at: http://localhost:${config.port}/api/docs`);
      console.log('====================================================');
    });
  } catch (error) {
    console.error(`[Fatal Startup Error] Failed to launch server: ${error.message}`);
    process.exit(1);
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
