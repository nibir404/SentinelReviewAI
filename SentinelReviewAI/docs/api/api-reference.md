# SentinelReviewAI API Documentation

## Base URL

```
Production: https://api.sentinelreview.ai
Development: http://localhost:4000
```

## Authentication

### API Keys

Include your API key in the request header:

```http
Authorization: Bearer YOUR_API_KEY
```

### JWT Tokens

For user authentication, include the JWT token:

```http
Authorization: Bearer YOUR_JWT_TOKEN
```

## Response Format

All responses follow this structure:

### Success Response

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2024-01-15T10:30:00Z",
    "requestId": "req_abc123"
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request parameters",
    "details": [...]
  },
  "meta": {
    "timestamp": "2024-01-15T10:30:00Z",
    "requestId": "req_abc123"
  }
}
```

## Endpoints

---

## Reviews

### Create Review

Create a new code review for a pull request.

**Endpoint:** `POST /api/reviews`

**Request Body:**

```json
{
  "provider": "github",
  "repositoryId": "repo_123",
  "pullRequestNumber": 42,
  "baseBranch": "main",
  "headBranch": "feature/new-feature",
  "author": "developer-username",
  "title": "Add new feature",
  "description": "This PR adds..."
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "review_abc123",
    "status": "pending",
    "score": null,
    "issues": [],
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

---

### Get Review

Retrieve a specific review by ID.

**Endpoint:** `GET /api/reviews/:id`

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "review_abc123",
    "status": "completed",
    "score": 85,
    "issues": [
      {
        "type": "security",
        "severity": "high",
        "message": "Potential SQL injection",
        "file": "src/db/query.ts",
        "line": 45,
        "suggestion": "Use parameterized queries"
      }
    ],
    "feedback": "Great code structure...",
    "createdAt": "2024-01-15T10:30:00Z",
    "completedAt": "2024-01-15T10:30:45Z"
  }
}
```

---

### List Reviews

List all reviews with optional filtering.

**Endpoint:** `GET /api/reviews`

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | string | Filter by status (pending, completed, failed) |
| `repositoryId` | string | Filter by repository |
| `author` | string | Filter by author |
| `from` | date | Start date filter |
| `to` | date | End date filter |
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 20) |

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "review_abc123",
      "status": "completed",
      "score": 85,
      "repository": "my-repo",
      "author": "developer1",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "meta": {
    "total": 150,
    "page": 1,
    "limit": 20,
    "totalPages": 8
  }
}
```

---

### Approve Review

Mark a review as approved.

**Endpoint:** `PUT /api/reviews/:id/approve`

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "review_abc123",
    "status": "approved",
    "approvedAt": "2024-01-15T10:35:00Z"
  }
}
```

---

### Reject Review

Mark a review as rejected with reason.

**Endpoint:** `PUT /api/reviews/:id/reject`

**Request Body:**

```json
{
  "reason": "Security issues must be resolved",
  "requiredChanges": ["Fix SQL injection", "Add input validation"]
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "review_abc123",
    "status": "rejected",
    "rejectedAt": "2024-01-15T10:35:00Z"
  }
}
```

---

## Repositories

### Register Repository

Register a new repository for review.

**Endpoint:** `POST /api/repositories`

**Request Body:**

```json
{
  "provider": "github",
  "name": "my-awesome-project",
  "fullName": "org/my-awesome-project",
  "url": "https://github.com/org/my-awesome-project",
  "defaultBranch": "main",
  "settings": {
    "autoReview": true,
    "autoApproveThreshold": 90,
    "requiredReviewers": 2,
    "blockOnSecurity": true
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "repo_abc123",
    "name": "my-awesome-project",
    "settings": {
      "autoReview": true,
      "autoApproveThreshold": 90
    },
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

---

### Get Repository

Get repository details.

**Endpoint:** `GET /api/repositories/:id`

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "repo_abc123",
    "name": "my-awesome-project",
    "fullName": "org/my-awesome-project",
    "url": "https://github.com/org/my-awesome-project",
    "defaultBranch": "main",
    "settings": {...},
    "stats": {
      "totalReviews": 150,
      "avgScore": 82,
      "issuesFound": 450
    }
  }
}
```

---

### List Repositories

List all registered repositories.

**Endpoint:** `GET /api/repositories`

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "repo_abc123",
      "name": "my-awesome-project",
      "provider": "github",
      "stats": {...}
    }
  ]
}
```

---

### Update Repository Settings

Update repository settings.

**Endpoint:** `PUT /api/repositories/:id/settings`

**Request Body:**

```json
{
  "autoReview": true,
  "autoApproveThreshold": 85,
  "requiredReviewers": 1,
  "blockOnSecurity": false
}
```

---

## Analytics

### Get Analytics Overview

Get overall analytics summary.

**Endpoint:** `GET /api/analytics/overview`

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `from` | date | Start date |
| `to` | date | End date |

**Response:**

```json
{
  "success": true,
  "data": {
    "totalReviews": 1250,
    "avgScore": 78,
    "issuesFound": 3420,
    "securityIssues": 156,
    "performanceIssues": 234,
    "codeQualityIssues": 890,
    "approvalRate": 0.85,
    "avgReviewTime": "4.2 minutes"
  }
}
```

---

### Get Trend Data

Get analytics trends over time.

**Endpoint:** `GET /api/analytics/trends`

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `metric` | string | Metric to track (reviews, score, issues) |
| `interval` | string | Time interval (day, week, month) |
| `from` | date | Start date |
| `to` | date | End date |

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "date": "2024-01-01",
      "reviews": 45,
      "avgScore": 76,
      "issues": 120
    },
    {
      "date": "2024-01-08",
      "reviews": 52,
      "avgScore": 79,
      "issues": 98
    }
  ]
}
```

---

### Get Repository Analytics

Get analytics for a specific repository.

**Endpoint:** `GET /api/analytics/repositories/:id`

**Response:**

```json
{
  "success": true,
  "data": {
    "repositoryId": "repo_abc123",
    "totalReviews": 150,
    "avgScore": 82,
    "issuesByType": {
      "security": 25,
      "performance": 45,
      "codeQuality": 120
    },
    "topIssues": [...],
    "contributors": [...]
  }
}
```

---

## Webhooks

### GitHub Webhook

**Endpoint:** `POST /webhooks/github`

**Events Handled:**
- `pull_request`
- `push`
- `check_run`

**Headers:**
- `X-GitHub-Event`: Event type
- `X-Hub-Signature-256`: HMAC signature for verification

---

### GitLab Webhook

**Endpoint:** `POST /webhooks/gitlab`

**Events Handled:**
- `merge_request`
- `push`
- `tag_push`

**Headers:**
- `X-Gitlab-Event`: Event type
- `X-Gitlab-Token`: Token for verification

---

### Bitbucket Webhook

**Endpoint:** `POST /webhooks/bitbucket`

**Events Handled:**
- `pullrequest`
- `push`

---

## Users

### Get Current User

**Endpoint:** `GET /api/users/me`

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "user_abc123",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "admin",
    "settings": {...}
  }
}
```

---

### Update User Settings

**Endpoint:** `PUT /api/users/me/settings`

**Request Body:**

```json
{
  "notifications": {
    "email": true,
    "slack": false
  },
  "preferences": {
    "theme": "dark",
    "language": "en"
  }
}
```

---

## Error Codes

| Code | Description |
|------|-------------|
| `UNAUTHORIZED` | Invalid or missing authentication |
| `FORBIDDEN` | Insufficient permissions |
| `NOT_FOUND` | Resource not found |
| `VALIDATION_ERROR` | Invalid request parameters |
| `RATE_LIMITED` | Too many requests |
| `INTERNAL_ERROR` | Server error |
| `SERVICE_UNAVAILABLE` | Service temporarily unavailable |

## Rate Limits

| Endpoint | Limit |
|----------|-------|
| API (authenticated) | 1000 requests/minute |
| Webhooks | 100 requests/minute |
| Reviews (create) | 100 requests/minute |

Rate limit headers are included in responses:
- `X-RateLimit-Limit`: Maximum requests
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Reset timestamp
