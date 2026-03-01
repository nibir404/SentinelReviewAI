import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import { logger } from './utils/logger';
import { ReviewQueue } from './services/reviewQueue';
import { CodeReviewer } from './services/codeReviewer';
import { ReviewPublisher } from './services/reviewPublisher';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4006;

// Initialize services
const reviewQueue = new ReviewQueue();
const codeReviewer = new CodeReviewer();
const reviewPublisher = new ReviewPublisher();

app.use(express.json());

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'ai-review-engine' });
});

// Review status endpoint
app.get('/reviews/:id', async (req: Request, res: Response) => {
  try {
    const review = await reviewQueue.getReview(req.params.id);
    if (!review) {
      res.status(404).json({ error: 'Review not found' });
      return;
    }
    res.json(review);
  } catch (error) {
    logger.error('Error getting review:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Manual review trigger
app.post('/reviews', async (req: Request, res: Response) => {
  try {
    const { provider, repository, pullRequest, diff, baseBranch, headBranch } = req.body;
    
    const reviewId = await reviewQueue.createReview({
      provider,
      repository,
      pullRequest,
      baseBranch,
      headBranch,
      status: 'pending',
      createdAt: new Date().toISOString()
    });

    // Queue for async processing
    await reviewQueue.publishForReview({
      reviewId,
      provider,
      repository,
      pullRequest,
      diff,
      baseBranch,
      headBranch
    });

    res.status(202).json({ reviewId, status: 'pending' });
  } catch (error) {
    logger.error('Error creating review:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

async function start() {
  try {
    await reviewQueue.connect();
    logger.info('Queue service connected');

    // Subscribe to review requests
    await reviewQueue.subscribeToReviews(async (message) => {
      try {
        logger.info(`Processing review: ${message.reviewId}`);
        
        // Update status to processing
        await reviewQueue.updateReviewStatus(message.reviewId, 'processing');

        // Perform code review
        const review = await codeReviewer.reviewCode(message.diff, {
          language: 'auto',
          context: {
            repository: message.repository,
            pullRequest: message.pullRequest,
            baseBranch: message.baseBranch,
            headBranch: message.headBranch
          }
        });

        // Update review with results
        await reviewQueue.updateReviewResults(message.reviewId, review);

        // Publish results
        await reviewPublisher.publishReviewResults(message, review);

        logger.info(`Review completed: ${message.reviewId}`);
      } catch (error) {
        logger.error(`Error processing review ${message.reviewId}:`, error);
        await reviewQueue.updateReviewStatus(message.reviewId, 'failed');
      }
    });

    app.listen(PORT, () => {
      logger.info(`AI Review Engine running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();
