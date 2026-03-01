import { Router, Response } from 'express';
import { AnalyticsController } from '../controllers/analyticsController';
import { AuthenticatedRequest } from '../../../common/middleware/auth';

export const analyticsRouter = Router();
const analyticsController = new AnalyticsController();

// Get dashboard overview
analyticsRouter.get('/overview', async (req: AuthenticatedRequest, res: Response) => {
  await analyticsController.getOverview(req, res);
});

// Get review statistics
analyticsRouter.get('/stats', async (req: AuthenticatedRequest, res: Response) => {
  await analyticsController.getStats(req, res);
});

// Get trends
analyticsRouter.get('/trends', async (req: AuthenticatedRequest, res: Response) => {
  await analyticsController.getTrends(req, res);
});

// Get team performance
analyticsRouter.get('/team', async (req: AuthenticatedRequest, res: Response) => {
  await analyticsController.getTeamPerformance(req, res);
});

// Get developer stats
analyticsRouter.get('/developers/:developerId', async (req: AuthenticatedRequest, res: Response) => {
  await analyticsController.getDeveloperStats(req, res);
});

// Get repository stats
analyticsRouter.get('/repositories/:repoId', async (req: AuthenticatedRequest, res: Response) => {
  await analyticsController.getRepositoryStats(req, res);
});

// Get quality metrics
analyticsRouter.get('/quality', async (req: AuthenticatedRequest, res: Response) => {
  await analyticsController.getQualityMetrics(req, res);
});

// Get AI performance
analyticsRouter.get('/ai-performance', async (req: AuthenticatedRequest, res: Response) => {
  await analyticsController.getAIPerformance(req, res);
});

// Get time series data
analyticsRouter.get('/timeseries', async (req: AuthenticatedRequest, res: Response) => {
  await analyticsController.getTimeSeries(req, res);
});

// Export analytics data
analyticsRouter.get('/export', async (req: AuthenticatedRequest, res: Response) => {
  await analyticsController.exportData(req, res);
});
