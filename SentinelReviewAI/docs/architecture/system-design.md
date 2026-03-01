# SentinelReviewAI Architecture

## Overview

SentinelReviewAI is a distributed system designed to automate code review through AI-powered analysis. The system processes pull requests from multiple Git providers, performs comprehensive analysis, and provides actionable feedback.

## System Architecture

### High-Level Design

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              Clients                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────────────────┐  │
│  │  GitHub  │  │  GitLab  │  │Bitbucket │  │   Web Dashboard        │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └───────────┬────────────┘  │
└───────┼─────────────┼─────────────┼─────────────────────┼──────────────┘
        │             │             │                     │
        └─────────────┴─────────────┼─────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         API Gateway (4000)                              │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  • Request Routing    • Authentication    • Rate Limiting       │   │
│  │  • Request Validation • Load Balancing    • Circuit Breaker     │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────┬───────────────────────────────────┘
                                      │
        ┌──────────────────────────────┼──────────────────────────────┐
        │                              │                              │
        ▼                              ▼                              ▼
┌───────────────┐            ┌─────────────────┐            ┌───────────────┐
│   Git         │            │    AI Review    │            │   Context     │
│   Integration │            │    Engine       │            │   Engine      │
│   (4001)      │            │    (4002)       │            │   (4003)      │
├───────────────┤            ├─────────────────┤            ├───────────────┤
│ • Webhook     │            │ • Code Analysis │            │ • Codebase    │
│   Parsing     │            │ • Issue         │            │   Context     │
│ • PR/MR       │            │   Detection     │            │ • History     │
│   Fetching    │            │ • AI Feedback   │            │   Analysis    │
│ • Comment     │            │   Generation    │            │ • Similarity  │
│   Posting     │            │                 │            │   Search      │
└───────┬───────┘            └────────┬────────┘            └───────┬───────┘
        │                             │                              │
        └─────────────────────────────┼──────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         Message Queue (Redis)                           │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────────┐    │
│  │ review.    │  │ context.   │  │ policy.    │  │ notification.  │    │
│  │ requests   │  │ build      │  │ check      │  │ queue          │    │
│  └────────────┘  └────────────┘  └────────────┘  └────────────────┘    │
└─────────────────────────────────────┬───────────────────────────────────┘
                                      │
        ┌──────────────────────────────┼──────────────────────────────┐
        │                              │                              │
        ▼                              ▼                              ▼
┌───────────────┐            ┌─────────────────┐            ┌───────────────┐
│   Policy      │            │   Analytics     │            │   Learning    │
│   Engine      │            │   Service       │            │   Engine      │
│   (4004)      │            │   (4006)        │            │   (4007)      │
├───────────────┤            ├─────────────────┤            ├───────────────┤
│ • Merge Gate  │            │ • Metrics       │            │ • Pattern     │
│ • Quality     │            │   Collection    │            │   Learning    │
│   Gates       │            │ • Trend         │            │ • Model       │
│ • Branch      │            │   Analysis      │            │   Updates     │
│   Protection  │            │ • Reporting     │            │ • Feedback    │
└───────┬───────┘            └────────┬────────┘            └───────┬───────┘
        │                             │                              │
        └─────────────────────────────┼──────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         Data Layer                                      │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────────────┐    │
│  │   PostgreSQL   │  │     Redis      │  │    Object Storage      │    │
│  │   (Reviews,    │  │  (Cache, Queue,│  │    (Code Snapshots,    │    │
│  │   Repositories,│  │   Sessions)    │  │     Analysis Results)  │    │
│  │   Users)       │  │                │  │                        │    │
│  └────────────────┘  └────────────────┘  └────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
```

## Core Services

### 1. API Gateway (Port 4000)

The API Gateway serves as the single entry point for all client requests.

**Responsibilities:**
- Request routing to backend services
- Authentication and authorization
- Rate limiting and throttling
- Request/response transformation
- Circuit breaker pattern

**Tech Stack:** Express.js, TypeScript, Redis

### 2. Git Integration Service (Port 4001)

Handles all interactions with Git providers (GitHub, GitLab, Bitbucket).

**Responsibilities:**
- Webhook event parsing
- Pull request/Merge request fetching
- Code diff retrieval
- Comment posting
- Status updates

**Supported Providers:**
- GitHub (REST API + Webhooks)
- GitLab (REST API + Webhooks)
- Bitbucket Cloud (REST API + Webhooks)

### 3. AI Review Engine (Port 4002)

Performs intelligent code analysis using AI models.

**Responsibilities:**
- Code parsing and AST analysis
- Issue detection (security, performance, quality)
- AI-powered feedback generation
- Code scoring and grading
- Suggestion generation

**Analysis Types:**
- Security vulnerabilities
- Performance issues
- Code smells
- Best practices violations
- Test coverage gaps
- Documentation missing

### 4. Context Engine (Port 4003)

Builds comprehensive context from the codebase.

**Responsibilities:**
- Repository structure analysis
- Codebase history mining
- Similar code search
- Dependency analysis
- Pattern detection

### 5. Policy Engine (Port 4004)

Enforces organizational policies and quality gates.

**Responsibilities:**
- Merge gate validation
- Required reviewer checks
- Branch protection rules
- Approval thresholds
- Custom policy evaluation

### 6. Webhook Listener (Port 4005)

Receives and routes incoming webhook events.

**Responsibilities:**
- Webhook endpoint hosting
- Event validation
- Event routing to appropriate services
- Retry handling for failed processing

### 7. Analytics Service (Port 4006)

Collects and provides analytics data.

**Responsibilities:**
- Metrics collection
- Trend analysis
- Report generation
- Dashboard data provider

### 8. Learning Engine (Port 4007)

Improves the system based on feedback and outcomes.

**Responsibilities:**
- Pattern learning from feedback
- Model fine-tuning
- False positive tracking
- Accuracy improvements

### 9. Merge Gate (Port 4008)

Validates if a PR is ready to merge.

**Responsibilities:**
- Final merge readiness check
- Status verification
- Conflict detection
- Approval verification

## Data Flow

### Pull Request Review Flow

```
1. Developer creates/updates PR
         │
         ▼
2. Git Provider sends Webhook
         │
         ▼
3. Webhook Listener receives event
         │
         ▼
4. Git Integration parses PR details
         │
         ▼
5. Context Engine builds code context
         │
         ▼
6. AI Review Engine analyzes code
         │
         ▼
7. Policy Engine validates policies
         │
         ▼
8. Results posted to PR (comments, status)
         │
         ▼
9. Merge Gate validates merge readiness
         │
         ▼
10. Developer merges (if approved)
```

## Technology Stack

### Backend
- **Runtime:** Node.js 18+
- **Language:** TypeScript
- **Framework:** Express.js / Fastify
- **Database:** PostgreSQL 14+
- **Cache/Queue:** Redis 7+
- **Message Queue:** Bull + Redis

### Frontend
- **Framework:** React 18
- **Language:** TypeScript
- **Build Tool:** Vite
- **UI Library:** Custom components + Tailwind CSS
- **Charts:** Recharts

### Infrastructure
- **Container:** Docker
- **Orchestration:** Kubernetes
- **IaC:** Terraform
- **CI/CD:** GitHub Actions

## Security

### Authentication
- JWT-based authentication
- API key support for services
- OAuth integration with Git providers

### Authorization
- Role-based access control (RBAC)
- Repository-level permissions
- Service-to-service authentication

### Data Protection
- Encryption at rest
- TLS for all communications
- Secret management via environment variables

## Scalability

### Horizontal Scaling
- All services are stateless
- Load balancing via API Gateway
- Auto-scaling based on metrics

### Caching Strategy
- Redis for session data
- CDN for static assets
- In-memory caching for frequently accessed data

### Message Queue
- Asynchronous processing
- Dead letter queues for failed messages
- Priority queues for urgent reviews
