# SentinelReviewAI

An intelligent AI-powered code review system that automates pull request analysis, detects issues, and provides actionable feedback using advanced AI models.

## Features

- **Automated Code Review**: AI-powered analysis of pull requests and merge requests
- **Multi-Provider Support**: GitHub, GitLab, and Bitbucket integration
- **Comprehensive Analysis**: Security, performance, code quality, and best practices checks
- **Real-time Notifications**: Webhook-based event processing
- **Analytics Dashboard**: Track review metrics and team performance
- **Policy Enforcement**: Configurable merge gates and quality thresholds
- **Learning Engine**: Continuously improves based on team feedback

## Architecture

SentinelReviewAI uses a microservices architecture:

```
┌─────────────────┐
│  Webhook        │
│  Listener       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  API Gateway    │
└────────┬────────┘
         │
    ┌────┴────┬────────────┬────────────┐
    ▼         ▼            ▼            ▼
┌───────┐ ┌───────┐ ┌──────────┐ ┌─────────┐
│  Git  │ │  AI   │ │ Context  │ │ Policy  │
│  Int. │ │Engine │ │ Engine   │ │ Engine  │
└───┬───┘ └───┬───┘ └────┬─────┘ └────┬────┘
    │         │          │            │
    └─────────┴──────────┴────────────┘
                   │
                   ▼
            ┌────────────┐
            │ Merge Gate │
            └────────────┘
```

## Quick Start

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 14+
- Redis 7+
- OpenAI API key (or compatible LLM)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-org/SentinelReviewAI.git
cd SentinelReviewAI
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Start with Docker Compose:
```bash
docker-compose up -d
```

4. Access the dashboard:
- Frontend: http://localhost:3000
- API Gateway: http://localhost:4000

### Configuration

Configure your webhook endpoints in your Git provider:

- **GitHub**: Settings → Webhooks → Add webhook
- **GitLab**: Settings → Webhooks → Add webhook
- **Bitbucket**: Repository Settings → Webhooks → Add webhook

Payload URL: `https://your-domain.com/webhooks/{provider}`

## Services

| Service | Port | Description |
|---------|------|-------------|
| API Gateway | 4000 | Main entry point for all API requests |
| Git Integration | 4001 | Handles Git provider webhooks and API calls |
| AI Review Engine | 4002 | Performs AI-powered code analysis |
| Context Engine | 4003 | Builds context from codebase history |
| Policy Engine | 4004 | Enforces merge policies and quality gates |
| Webhook Listener | 4005 | Receives and routes webhook events |
| Analytics | 4006 | Tracks and stores review metrics |
| Learning Engine | 4007 | Improves based on feedback |
| Merge Gate | 4008 | Validates merge readiness |

## API Endpoints

### Reviews
- `POST /api/reviews` - Create a new review
- `GET /api/reviews/:id` - Get review by ID
- `GET /api/reviews` - List all reviews
- `PUT /api/reviews/:id/approve` - Approve a review
- `PUT /api/reviews/:id/reject` - Reject a review

### Repositories
- `POST /api/repositories` - Register a repository
- `GET /api/repositories` - List repositories
- `GET /api/repositories/:id` - Get repository details

### Analytics
- `GET /api/analytics/overview` - Get analytics overview
- `GET /api/analytics/trends` - Get trend data
- `GET /api/analytics/repositories/:id` - Repository-specific analytics

### Webhooks
- `POST /webhooks/github` - GitHub webhook endpoint
- `POST /webhooks/gitlab` - GitLab webhook endpoint
- `POST /webhooks/bitbucket` - Bitbucket webhook endpoint

## Configuration Options

| Variable | Description | Default |
|----------|-------------|---------|
| `AI_MODEL` | AI model to use | gpt-4 |
| `MAX_FILE_SIZE` | Max file size for review (bytes) | 1048576 |
| `AUTO_APPROVE_THRESHOLD` | Score for auto-approve | 90 |
| `ENABLE_SECURITY_SCAN` | Enable security scanning | true |
| `ENABLE_PERFORMANCE_SCAN` | Enable performance analysis | true |

## Development

### Running Services Locally

```bash
# Install dependencies
npm install

# Start individual services
cd backend/src/services/api-gateway
npm run dev

# Run frontend
cd frontend
npm run dev
```

### Running Tests

```bash
npm test
```

## License

MIT License - see LICENSE file for details
