/* backend/src/app.js - FINAL WORKING VERSION */
require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

// Import routes
const routes = require('./routes');

// Import middleware
const { errorHandler } = require('./middleware/errorHandler');
const { sanitizeInput } = require('./middleware/sanitize');

const app = express();

// ========== CORS CONFIGURATION ==========
// IMPORTANT: Use the SAME origin as in server.js for Socket.IO
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
const corsOptions = {
  origin: corsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow images from other origins
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'", "https:"],
      connectSrc: ["'self'", corsOrigin, "ws://localhost:5000"] // Allow WebSocket connections
    }
  }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Increase for development
  message: {
    success: false,
    message: 'تعداد درخواست‌های شما بیش از حد مجاز است. لطفاً کمی صبر کنید.'
  }
});
app.use('/api/', limiter);

// ========== PROPER Body Parsing ==========
// Custom JSON parser that handles empty bodies gracefully
app.use((req, res, next) => {
  const contentType = req.get('Content-Type');
  
  // Only parse JSON if Content-Type is application/json
  if (contentType && contentType.includes('application/json')) {
    const contentLength = req.get('Content-Length');
    
    // If body is empty (Content-Length is 0 or not present), set req.body to empty object
    if (!contentLength || parseInt(contentLength) === 0) {
      req.body = {};
      return next();
    }
    
    // Otherwise, use the standard express.json parser
    return express.json({ limit: '10mb', strict: false })(req, res, next);
  }
  
  // For other content types, skip JSON parsing
  next();
});

app.use(express.urlencoded({
  extended: true,
  limit: '10mb'
}));

// Debug middleware for development
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    if (req.method === 'POST' && req.url.includes('/api/')) {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
      console.log('Headers:', {
        'content-type': req.get('content-type'),
        authorization: req.get('authorization') ? 'Present' : 'Missing'
      });
    }
    next();
  });
}

// Compression
app.use(compression());

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

// Sanitize input
app.use(sanitizeInput);

// Serve static files from uploads directory
const uploadsPath = process.env.UPLOAD_DIR || path.join(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsPath));

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'Fobino API',
    corsOrigin: corsOrigin
  });
});

// API Routes
app.use('/api', routes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'مسیر مورد نظر یافت نشد'
  });
});

// Error handler
app.use(errorHandler);

module.exports = app;