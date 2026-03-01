import { Response } from 'express';
import { AuthenticatedRequest } from '../../../common/middleware/auth';
import { logger } from '../../../common/utils/logger';
import { ReviewService } from '../../ai-review-engine/src/services/reviewService';
import { BadRequestError, NotFoundError } from '../../../common/utils/errors';

export class ReviewController {
  private reviewService: ReviewService;

  constructor() {
    this.reviewService = new ReviewService();
  }

  /**
   * Get all reviews for the organization
   */
  async getReviews(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { page = '1', limit = '20', status, repositoryId, author } = req.query;
      const organizationId = req.user!.organizationId;

      const result = await this.reviewService.getReviews({
        organizationId,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        status: status as string,
        repositoryId: repositoryId as string,
        author: author as string
      });

      res.json({
        success: true,
        data: result.reviews,
        pagination: result.pagination
      });
    } catch (error) {
      logger.error('Error getting reviews:', error);
      throw error;
    }
  }

  /**
   * Get review by ID
   */
  async getReviewById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { reviewId } = req.params;
      const organizationId = req.user!.organizationId;

      const review = await this.reviewService.getReviewById(reviewId, organizationId);

      if (!review) {
        throw new NotFoundError('Review not found');
      }

      res.json({
        success: true,
        data: review
      });
    } catch (error) {
      logger.error('Error getting review:', error);
      throw error;
    }
  }

  /**
   * Get review diff
   */
  async getReviewDiff(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { reviewId } = req.params;
      const organizationId = req.user!.organizationId;

      const diff = await this.reviewService.getReviewDiff(reviewId, organizationId);

      if (!diff) {
        throw new NotFoundError('Review diff not found');
      }

      res.json({
        success: true,
        data: diff
      });
    } catch (error) {
      logger.error('Error getting review diff:', error);
      throw error;
    }
  }

  /**
   * Trigger a new review
   */
  async triggerReview(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { repositoryId, pullRequestId, branch, baseBranch } = req.body;
      const organizationId = req.user!.organizationId;

      if (!repositoryId || !pullRequestId) {
        throw new BadRequestError('repositoryId and pullRequestId are required');
      }

      const review = await this.reviewService.triggerReview({
        organizationId,
        repositoryId,
        pullRequestId,
        branch,
        baseBranch,
        triggeredBy: req.user!.userId
      });

      res.status(201).json({
        success: true,
        data: review
      });
    } catch (error) {
      logger.error('Error triggering review:', error);
      throw error;
    }
  }

  /**
   * Re-run review on existing PR
   */
  async rerunReview(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { reviewId } = req.params;
      const organizationId = req.user!.organizationId;

      const review = await this.reviewService.rerunReview(reviewId, organizationId);

      res.json({
        success: true,
        data: review
      });
    } catch (error) {
      logger.error('Error re-running review:', error);
      throw error;
    }
  }

  /**
   * Accept a suggestion
   */
  async acceptSuggestion(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { suggestionId } = req.params;
      const organizationId = req.user!.organizationId;
      const userId = req.user!.userId;

      await this.reviewService.acceptSuggestion(suggestionId, organizationId, userId);

      res.json({
        success: true,
        message: 'Suggestion accepted'
      });
    } catch (error) {
      logger.error('Error accepting suggestion:', error);
      throw error;
    }
  }

  /**
   * Dismiss a suggestion
   */
  async dismissSuggestion(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { suggestionId } = req.params;
      const { reason } = req.body;
      const organizationId = req.user!.organizationId;
      const userId = req.user!.userId;

      await this.reviewService.dismissSuggestion(suggestionId, organizationId, userId, reason);

      res.json({
        success: true,
        message: 'Suggestion dismissed'
      });
    } catch (error) {
      logger.error('Error dismissing suggestion:', error);
      throw error;
    }
  }

  /**
   * Apply a fix
   */
  async applyFix(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { suggestionId } = req.params;
      const organizationId = req.user!.organizationId;
      const userId = req.user!.userId;

      const result = await this.reviewService.applyFix(suggestionId, organizationId, userId);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Error applying fix:', error);
      throw error;
    }
  }

  /**
   * Get review comments
   */
  async getComments(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { reviewId } = req.params;
      const organizationId = req.user!.organizationId;

      const comments = await this.reviewService.getComments(reviewId, organizationId);

      res.json({
        success: true,
        data: comments
      });
    } catch (error) {
      logger.error('Error getting comments:', error);
      throw error;
    }
  }

  /**
   * Add comment to review
   */
  async addComment(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { reviewId } = req.params;
      const { content, line, file, type } = req.body;
      const organizationId = req.user!.organizationId;
      const userId = req.user!.userId;

      const comment = await this.reviewService.addComment({
        reviewId,
        organizationId,
        userId,
        content,
        line,
        file,
        type
      });

      res.status(201).json({
        success: true,
        data: comment
      });
    } catch (error) {
      logger.error('Error adding comment:', error);
      throw error;
    }
  }

  /**
   * Get review summary
   */
  async getSummary(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { reviewId } = req.params;
      const organizationId = req.user!.organizationId;

      const summary = await this.reviewService.getSummary(reviewId, organizationId);

      res.json({
        success: true,
        data: summary
      });
    } catch (error) {
      logger.error('Error getting summary:', error);
      throw error;
    }
  }

  /**
   * Get merge recommendation
   */
  async getRecommendation(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { reviewId } = req.params;
      const organizationId = req.user!.organizationId;

      const recommendation = await this.reviewService.getRecommendation(reviewId, organizationId);

      res.json({
        success: true,
        data: recommendation
      });
    } catch (error) {
      logger.error('Error getting recommendation:', error);
      throw error;
    }
  }
}
