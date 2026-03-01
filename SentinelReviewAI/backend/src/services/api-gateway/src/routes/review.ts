import { Router, Response } from 'express';
import { ReviewController } from '../controllers/reviewController';
import { AuthenticatedRequest } from '../../../common/middleware/auth';

export const reviewRouter = Router();
const reviewController = new ReviewController();

// Get all reviews for organization
reviewRouter.get('/', async (req: AuthenticatedRequest, res: Response) => {
  await reviewController.getReviews(req, res);
});

// Get review by ID
reviewRouter.get('/:reviewId', async (req: AuthenticatedRequest, res: Response) => {
  await reviewController.getReviewById(req, res);
});

// Get review details with diff
reviewRouter.get('/:reviewId/diff', async (req: AuthenticatedRequest, res: Response) => {
  await reviewController.getReviewDiff(req, res);
});

// Trigger manual review
reviewRouter.post('/trigger', async (req: AuthenticatedRequest, res: Response) => {
  await reviewController.triggerReview(req, res);
});

// Re-run review on existing PR
reviewRouter.post('/:reviewId/rerun', async (req: AuthenticatedRequest, res: Response) => {
  await reviewController.rerunReview(req, res);
});

// Accept suggestion
reviewRouter.post('/suggestions/:suggestionId/accept', async (req: AuthenticatedRequest, res: Response) => {
  await reviewController.acceptSuggestion(req, res);
});

// Dismiss suggestion
reviewRouter.post('/suggestions/:suggestionId/dismiss', async (req: AuthenticatedRequest, res: Response) => {
  await reviewController.dismissSuggestion(req, res);
});

// Apply fix
reviewRouter.post('/suggestions/:suggestionId/apply', async (req: AuthenticatedRequest, res: Response) => {
  await reviewController.applyFix(req, res);
});

// Get review comments
reviewRouter.get('/:reviewId/comments', async (req: AuthenticatedRequest, res: Response) => {
  await reviewController.getComments(req, res);
});

// Add comment to review
reviewRouter.post('/:reviewId/comments', async (req: AuthenticatedRequest, res: Response) => {
  await reviewController.addComment(req, res);
});

// Get review summary
reviewRouter.get('/:reviewId/summary', async (req: AuthenticatedRequest, res: Response) => {
  await reviewController.getSummary(req, res);
});

// Get merge recommendation
reviewRouter.get('/:reviewId/recommendation', async (req: AuthenticatedRequest, res: Response) => {
  await reviewController.getRecommendation(req, res);
});
