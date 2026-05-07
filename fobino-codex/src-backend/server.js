/* backend/src/server.js */
const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const { initializeSocket } = require('./socket');
const connectDB = require('./config/database');
const logger = require('./utils/logger');
const { initializeJobs } = require('./jobs');

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

// ========== IMPORTANT: Socket.IO Configuration ==========
// Use the SAME origin as in app.js
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';

const io = new Server(server, {
  cors: {
    origin: corsOrigin,
    methods: ['GET', 'POST'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
  },
  // Optional: If you need custom path (remove if not needed)
  // path: '/socket.io',
  
  // Connection settings
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ['websocket', 'polling'], // Enable both transports
  allowUpgrades: true
});

// Log Socket.IO events for debugging
io.engine.on("connection_error", (err) => {
  console.log('Socket.IO connection error:', err.req);      // the request object
  console.log('Socket.IO error code:', err.code);         // the error code, for example 1
  console.log('Socket.IO error message:', err.message);   // the error message, for example "Session ID unknown"
  console.log('Socket.IO error context:', err.context);   // some additional error context
});

// Initialize Socket.IO handlers
initializeSocket(io);
logger.info('Socket.IO initialized');

// Log when clients connect/disconnect
io.on('connection', (socket) => {
  logger.info(`Socket client connected: ${socket.id}`);
  
  socket.on('disconnect', (reason) => {
    logger.info(`Socket client disconnected: ${socket.id}, Reason: ${reason}`);
  });
});

// Connect to database and start server
const startServer = async () => {
  try {
    await connectDB();
    
    // Initialize scheduled jobs
    initializeJobs();
    logger.info('Cron jobs initialized');
    
    server.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🌐 CORS Origin: ${corsOrigin}`);
      logger.info(`🔌 Socket.IO path: ${io._opts.path || '/socket.io'}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Rejection:', err);
  server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

startServer();