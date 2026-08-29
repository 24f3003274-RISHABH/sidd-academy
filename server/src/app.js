import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';

import ENV from './config/env.js';
import { initDB } from './config/db.js';
import { errorHandler } from './middleware/errorHandler.js';

// Route Imports
import healthRoutes from './routes/health.routes.js';
import authRoutes from './routes/auth.routes.js';
import courseRoutes from './routes/course.routes.js';
import subjectRoutes from './routes/subject.routes.js';
import chapterRoutes from './routes/chapter.routes.js';
import classRoutes from './routes/dailyClass.routes.js';
import noteRoutes from './routes/note.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import adminRoutes from './routes/admin.routes.js';
import bannerRoutes from './routes/banner.routes.js';

// Setup __dirname in ES module scope
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize PostgreSQL connection pool on startup
initDB();

export const app = express();

/**
 * WHY: Body Parsers
 * express.json parses incoming requests with JSON payloads
 * express.urlencoded parses URL-encoded bodies for form submissions
 */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

/**
 * WHY: Helmet Security Configuration
 * Configured to protect standard headers while allowing safe iframe embedding
 * and cross-origin resource requests for interactive applet preview environments.
 */
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: false,
  originAgentCluster: false,
  frameguard: false,
}));

/**
 * WHY: CORS Configuration
 * Allows frontend applications to communicate with the REST API securely with credentials
 */
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
}));

/**
 * WHY: Request Logging
 * Morgan provides development and production request latency logs
 */
if (ENV.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

/**
 * WHY: Static File Serving
 * Exposes uploaded PDFs and assets for course previews
 */
const uploadsDir = path.join(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsDir));

// API Routes
app.use('/api/v1/health', healthRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/courses', courseRoutes);
app.use('/api/v1/subjects', subjectRoutes);
app.use('/api/v1/chapters', chapterRoutes);
app.use('/api/v1/classes', classRoutes);
app.use('/api/v1/notes', noteRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/banners', bannerRoutes);

// Fallback 404 handler for unmatched /api routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API Route not found - ${req.originalUrl}`,
  });
});

// Centralized Error Handling Middleware
app.use(errorHandler);

export default app;
