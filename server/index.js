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

// Vercel/Render sit behind a proxy; needed so rate limiting sees the real client IP
app.set('trust proxy', 1);

// Security HTTP Headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// Production & Development CORS Configuration
const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map((origin) => origin.trim().replace(/\/$/, ''))
  : ['http://localhost:5173', 'http://127.0.0.1:5173'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like health checks, server-to-server, curl)
    if (!origin) return callback(null, true);

    // Allow explicit origin matches or universal wildcard
    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Allow Vercel preview/production deployments if vercel.app is configured
    const isVercelOrigin = allowedOrigins.some(o => o.includes('vercel.app')) && /^https:\/\/[a-zA-Z0-9_-]+\.vercel\.app$/.test(origin);
    if (isVercelOrigin) {
      return callback(null, true);
    }

    // Allow all origins in non-production environments
    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }

    // Don't throw (that turns into a 500). Just omit CORS headers: same-origin
    // requests (frontend + API on the same Vercel domain) still work, and the
    // browser blocks genuine cross-origin callers on its own.
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

// Ensure DB connection is established for all incoming requests (Serverless & Server)
app.use(async (req, res, next) => {
  const connected = await connectDB();
  if (!connected && req.path.startsWith('/api/') && req.path !== '/api/health') {
    return res.status(503).json({
      success: false,
      error: 'Database connection unavailable. Please verify MONGODB_URI environment variable on Vercel.'
    });
  }
  next();
});

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

// Connect to MongoDB and start Express server if running standalone
if (!process.env.VERCEL) {
  app.listen(PORT, async () => {
    console.log(`[ConnectDesk Server] Running on http://localhost:${PORT}`);
    await connectDB();
  });
}

export default app;
