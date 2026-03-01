import express, { Application, Request, Response } from 'express';
import { config } from 'dotenv';
import { logger } from '../../common/utils/logger';
import { aiEngineRouter } from './routes/ai';

config();

export class AIEngineApp {
  public app: Application;
  public port: number;

  constructor() {
    this.app = express();
    this.port = parseInt(process.env.AI_PORT || '3003', 10);

    this.initializeMiddleware();
    this.initializeRoutes();
  }

  private initializeMiddleware(): void {
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));
  }

  private initializeRoutes(): void {
    this.app.use('/ai', aiEngineRouter);
    
    this.app.get('/health', (req: Request, res: Response) => {
      res.json({ status: 'ok', service: 'ai-engine' });
    });
  }

  public start(): void {
    this.app.listen(this.port, () => {
      logger.info(`🚀 AI Engine Service running on port ${this.port}`);
    });
  }
}

if (require.main === module) {
  const app = new AIEngineApp();
  app.start();
}

export default new AIEngineApp().app;
