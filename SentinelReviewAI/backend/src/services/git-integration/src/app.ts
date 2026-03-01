import express, { Application, Request, Response } from 'express';
import { config } from 'dotenv';
import { logger } from '../../common/utils/logger';
import { gitIntegrationRouter } from './routes/git';

config();

export class GitIntegrationApp {
  public app: Application;
  public port: number;

  constructor() {
    this.app = express();
    this.port = parseInt(process.env.GIT_PORT || '3002', 10);

    this.initializeMiddleware();
    this.initializeRoutes();
  }

  private initializeMiddleware(): void {
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));
  }

  private initializeRoutes(): void {
    this.app.use('/git', gitIntegrationRouter);
    
    this.app.get('/health', (req: Request, res: Response) => {
      res.json({ status: 'ok', service: 'git-integration' });
    });
  }

  public start(): void {
    this.app.listen(this.port, () => {
      logger.info(`🚀 Git Integration Service running on port ${this.port}`);
    });
  }
}

if (require.main === module) {
  const app = new GitIntegrationApp();
  app.start();
}

export default new GitIntegrationApp().app;
