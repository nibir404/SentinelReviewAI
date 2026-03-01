import { Router, Request, Response } from 'express';

export const healthRouter = Router();

healthRouter.get('/', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.APP_VERSION || '1.0.0',
      services: {
        api: 'up',
        database: 'up',
        queue: 'up',
        ai: 'up'
      }
    }
  });
});

healthRouter.get('/ready', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      ready: true,
      timestamp: new Date().toISOString()
    }
  });
});

healthRouter.get('/live', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      alive: true,
      timestamp: new Date().toISOString()
    }
  });
});
