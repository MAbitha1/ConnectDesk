import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { connectDB, getDBHealthStatus } from './config/db.js';
import customerRoutes from './routes/customerRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import authRoutes from './routes/authRoutes.js';
import followUpRoutes from './routes/followUpRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security HTTP Headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// CORS Configuration
app.use(cors());
app.use(express.json());

// Rate limiting for authentication routes to prevent brute-force attacks
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 authentication requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many authentication attempts from this IP. Please try again after 15 minutes.'
  }
});

// Health Check Endpoint (Public)
app.get('/api/health', (req, res) => {
  const dbStatus = getDBHealthStatus();
  res.status(200).json({
    status: 'ok',
    message: 'ConnectDesk API is running smoothly',
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(process.uptime())}s`,
    environment: process.env.NODE_ENV || 'development',
    database: dbStatus,
  });
});

// Apply Rate Limiter to Auth Endpoints
app.use('/api/auth/login', authRateLimiter);
app.use('/api/auth/register', authRateLimiter);

// Domain API Routes
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/follow-ups', followUpRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Endpoint not found' });
});

// Global Error-handling Middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err.message);

  const isProd = process.env.NODE_ENV === 'production';
  const statusCode = err.status || err.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    error: isProd && statusCode === 500 ? 'Internal Server Error' : err.message || 'Internal Server Error',
    status: statusCode,
  });
});

// Connect to MongoDB and start Express server
app.listen(PORT, async () => {
  console.log(`[ConnectDesk Server] Running on http://localhost:${PORT}`);
  await connectDB();
});
