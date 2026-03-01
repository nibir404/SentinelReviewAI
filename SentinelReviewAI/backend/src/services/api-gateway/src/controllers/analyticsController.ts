import { Response } from 'express';
import { AuthenticatedRequest } from '../../../common/middleware/auth';
import { logger } from '../../../common/utils/logger';
import { AnalyticsService } from '../../analytics/src/services/analyticsService';

export class AnalyticsController {
  private analyticsService: AnalyticsService;

  constructor() {
    this.analyticsService = new AnalyticsService();
  }

  /**
   * Get dashboard overview
   */
  async getOverview(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const organizationId = req.user!.organizationId;
      const { period = '7d' } = req.query;

      const overview = await this.analyticsService.getOverview(organizationId, period as string);

      res.json({
        success: true,
        data: overview
      });
    } catch (error) {
      logger.error('Error getting overview:', error);
      throw error;
    }
  }

  /**
   * Get review statistics
   */
  async getStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const organizationId = req.user!.organizationId;
      const { startDate, endDate, repositoryId } = req.query;

      const stats = await this.analyticsService.getStats({
        organizationId,
        startDate: startDate as string,
        endDate: endDate as string,
        repositoryId: repositoryId as string
      });

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('Error getting stats:', error);
      throw error;
    }
  }

  /**
   * Get trends
   */
  async getTrends(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const organizationId = req.user!.organizationId;
      const { metric, period = '30d' } = req.query;

      const trends = await this.analyticsService.getTrends(
        organizationId,
        metric as string,
        period as string
      );

      res.json({
        success: true,
        data: trends
      });
    } catch (error) {
      logger.error('Error getting trends:', error);
      throw error;
    }
  }

  /**
   * Get team performance
   */
  async getTeamPerformance(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const organizationId = req.user!.organizationId;
      const { period = '30d' } = req.query;

      const teamPerformance = await this.analyticsService.getTeamPerformance(
        organizationId,
        period as string
      );

      res.json({
        success: true,
        data: teamPerformance
      });
    } catch (error) {
      logger.error('Error getting team performance:', error);
      throw error;
    }
  }

  /**
   * Get developer stats
   */
  async getDeveloperStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { developerId } = req.params;
      const organizationId = req.user!.organizationId;
      const { period = '30d' } = req.query;

      const stats = await this.analyticsService.getDeveloperStats(
        developerId,
        organizationId,
        period as string
      );

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('Error getting developer stats:', error);
      throw error;
    }
  }

  /**
   * Get repository stats
   */
  async getRepositoryStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { repoId } = req.params;
      const organizationId = req.user!.organizationId;
      const { period = '30d' } = req.query;

      const stats = await this.analyticsService.getRepositoryStats(
        repoId,
        organizationId,
        period as string
      );

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('Error getting repository stats:', error);
      throw error;
    }
  }

  /**
   * Get quality metrics
   */
  async getQualityMetrics(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const organizationId = req.user!.organizationId;
      const { period = '30d', repositoryId } = req.query;

      const metrics = await this.analyticsService.getQualityMetrics(
        organizationId,
        period as string,
        repositoryId as string
      );

      res.json({
        success: true,
        data: metrics
      });
    } catch (error) {
      logger.error('Error getting quality metrics:', error);
      throw error;
    }
  }

  /**
   * Get AI performance
   */
  async getAIPerformance(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const organizationId = req.user!.organizationId;
      const { period = '30d' } = req.query;

      const performance = await this.analyticsService.getAIPerformance(
        organizationId,
        period as string
      );

      res.json({
        success: true,
        data: performance
      });
    } catch (error) {
      logger.error('Error getting AI performance:', error);
      throw error;
    }
  }

  /**
   * Get time series data
   */
  async getTimeSeries(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const organizationId = req.user!.organizationId;
      const { metric, interval = '1d', startDate, endDate } = req.query;

      const data = await this.analyticsService.getTimeSeries(
        organizationId,
        metric as string,
        interval as string,
        startDate as string,
        endDate as string
      );

      res.json({
        success: true,
        data
      });
    } catch (error) {
      logger.error('Error getting time series:', error);
      throw error;
    }
  }

  /**
   * Export analytics data
   */
  async exportData(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const organizationId = req.user!.organizationId;
      const { format = 'csv', ...filters } = req.query;

      const data = await this.analyticsService.exportData(
        organizationId,
        format as string,
        filters as any
      );

      res.setHeader('Content-Type', format === 'csv' ? 'text/csv' : 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=analytics-${Date.now()}.${format}`);
      res.send(data);
    } catch (error) {
      logger.error('Error exporting data:', error);
      throw error;
    }
  }
}
