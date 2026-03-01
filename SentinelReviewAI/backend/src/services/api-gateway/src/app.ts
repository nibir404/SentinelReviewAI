import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { config } from 'dotenv';
import { logger } from '../../common/utils/logger';
import { authMiddleware } from '../../common/middleware/auth';
import { errorHandler } from '../../common/middleware/errorHandler';
import { rateLimiter } from '../../common/middleware/rateLimiter';

// Routes
import { healthRouter } from './routes/health';
import { webhookRouter } from './routes/webhook';
import { reviewRouter } from './routes/review';
import { analyticsRouter } from './routes/analytics';
import { authRouter } from './routes/auth';
import { adminRouter } from './routes/admin';

// Load environment variables
config();

export class App {
  public app: Application;
  public port: number;

  constructor() {
    this.app = express();
    this.port = parseInt(process.env.PORT || '3000', 10);

    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddleware(): void {
    // Security middleware
    this.app.use(helmet());
    this.app.use(cors({
      origin: process.env.CORS_ORIGIN || '*',
      credentials: true
    }));

    // Performance middleware
    this.app.use(compression());
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Rate limiting
    this.app.use(rateLimiter);

    // Request logging
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      const start = Date.now();
      res.on('finish', () => {
        const duration = Date.now() - start;
        logger.info(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
      });
      next();
    });
  }

  private initializeRoutes(): void {
    // Health check (no auth required)
    this.app.use('/health', healthRouter);

    // Auth endpoints (no auth required)
    this.app.use('/api/v1/auth', authRouter);

    // Webhook endpoints (no auth required - uses signature verification)
    this.app.use('/webhooks', webhookRouter);

    // Protected routes
    this.app.use('/api/v1/reviews', authMiddleware, reviewRouter);
    this.app.use('/api/v1/analytics', authMiddleware, analyticsRouter);
    this.app.use('/api/v1/admin', authMiddleware, adminRouter);

    // API info endpoint
    this.app.get('/api', (req: Request, res: Response) => {
      res.json({
        name: 'SentinelReviewAI API',
        version: process.env.APP_VERSION || '1.0.0',
        description: 'AI-powered code review platform',
        endpoints: {
          health: '/health',
          webhooks: '/webhooks',
          reviews: '/api/v1/reviews',
          analytics: '/api/v1/analytics',
          admin: '/api/v1/admin'
        }
      });
    });

    // 404 handler
    this.app.use((req: Request, res: Response) => {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Route ${req.method} ${req.path} not found`
        }
      });
    });
  }

  private initializeErrorHandling(): void {
    this.app.use(errorHandler);
  }

  public start(): void {
    this.app.listen(this.port, () => {
      logger.info(`🚀 API Gateway running on port ${this.port}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  }
}

// Start the server if this is the main module
if (require.main === module) {
  const app = new App();
  app.start();
}

export default new App().app;
