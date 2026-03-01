import express, { Application, Request, Response } from 'express';
import { config } from 'dotenv';
import { logger } from '../../common/utils/logger';
import { contextEngineRouter } from './routes/context';

config();

export class ContextEngineApp {
  public app: Application;
  public port: number;

  constructor() {
    this.app = express();
    this.port = parseInt(process.env.CONTEXT_PORT || '3004', 10);

    this.initializeMiddleware();
    this.initializeRoutes();
  }

  private initializeMiddleware(): void {
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));
  }

  private initializeRoutes(): void {
    this.app.use('/context', contextEngineRouter);
    
    this.app.get('/health', (req: Request, res: Response) => {
      res.json({ status: 'ok', service: 'context-engine' });
    });
  }

  public start(): void {
    this.app.listen(this.port, () => {
      logger.info(`🚀 Context Engine Service running on port ${this.port}`);
    });
  }
}

if (require.main === module) {
  const app = new ContextEngineApp();
  app.start();
}

export default new ContextEngineApp().app;
