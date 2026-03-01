import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { config } from 'dotenv';
import { logger } from '../common/utils/logger';
import { errorHandler } from '../common/middleware/errorHandler';
import { authMiddleware } from '../common/middleware/auth';
import { webhookRouter } from './routes/webhook';
import { reviewRouter } from './routes/review';
import { analyticsRouter } from './routes/analytics';
import { adminRouter } from './routes/admin';
import { healthRouter } from './routes/health';
import { authRouter } from './routes/auth';

// Load environment variables
config();

const app: Application = express();
const PORT = process.env.PORT || 4000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Logging
app.use(morgan('combined', {
  stream: {
    write: (message: string) => logger.info(message.trim())
  }
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check (no auth required)
app.use('/health', healthRouter);

// Auth endpoints (no auth required)
app.use('/api/v1/auth', authRouter);

// Public webhook endpoint (no auth required)
app.use('/webhook', webhookRouter);

// Protected routes
app.use('/api/v1/reviews', authMiddleware, reviewRouter);
app.use('/api/v1/analytics', authMiddleware, analyticsRouter);
app.use('/api/v1/admin', authMiddleware, adminRouter);

// Error handling
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  errorHandler.handleError(err, res);
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Endpoint not found'
    }
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`API Gateway running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
