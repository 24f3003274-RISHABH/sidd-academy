import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

import connectDB from './src/config/db.js';
import { errorHandler, notFound } from './src/middleware/errorHandler.js';

// Import Routes
import authRoutes from './src/routes/auth.routes.js';
import courseRoutes from './src/routes/course.routes.js';
import subjectRoutes from './src/routes/subject.routes.js';
import chapterRoutes from './src/routes/chapter.routes.js';
import classRoutes from './src/routes/dailyClass.routes.js';
import noteRoutes from './src/routes/note.routes.js';
import paymentRoutes from './src/routes/payment.routes.js';
import adminRoutes from './src/routes/admin.routes.js';
import bannerRoutes from './src/routes/banner.routes.js';

// Setup __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Security Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(mongoSanitize());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Body parsers and cookie parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// CORS config
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));

// Dev logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Static folders
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/courses', courseRoutes);
app.use('/api/v1/subjects', subjectRoutes);
app.use('/api/v1/chapters', chapterRoutes);
app.use('/api/v1/classes', classRoutes);
app.use('/api/v1/notes', noteRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/banners', bannerRoutes);

// Health check
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({ status: 'success', message: 'Server is healthy' });
});

// Error handling
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
