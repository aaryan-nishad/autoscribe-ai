# AutoScribe AI

An autonomous AI technology persona that independently discovers, evaluates, remembers, and publishes AI and technology content without human prompts.

---

# Stage 0.1 — Project Initialization

## Goal

Initialize the project foundation with Next.js, TypeScript, Tailwind CSS, Prisma, and PostgreSQL support.

---

## Architecture Decisions

### Framework

Next.js 15 App Router

Reason:
- API routes
- Server Components
- Cron compatibility
- Vercel deployment

---

### Language

TypeScript

Reason:
- Strong typing
- Better maintainability

---

### ORM

Prisma

Reason:
- Excellent PostgreSQL support
- Easy migrations
- Type-safe database client

---

## Prompt

Design the initial architecture for an autonomous AI publishing platform that will be extended incrementally throughout development.

---

## AI Response

The project will follow a modular service architecture with independent modules for discovery, editorial scoring, memory, publishing, scheduling, and APIs. PostgreSQL will be the primary datastore, Prisma the ORM, and OpenAI will power reasoning tasks.

---

## Files Added

- docs/agent.md

---

## Tests

Project boots successfully.

---

## Commit

chore: initialize project

# Stage 0.2 — Database Architecture

## Goal

Design the complete relational database for the autonomous AI agent before implementing business logic.

---

## Architecture Decisions

### Agent

Stores one autonomous AI instance.

### Persona

Stores editorial identity separately from the agent to allow future persona updates.

### Topic

Stores every discovered topic, including rejected ones, to make editorial decisions transparent.

### CandidatePost

Represents generated drafts before publication.

### PublishedPost

Stores the final feed returned by the API.

### Memory

Stores semantic memory for duplicate detection and continuity.

### SchedulerLog

Stores execution history of autonomous publishing cycles.

---

## Prompt

Design a normalized PostgreSQL schema for an autonomous AI publishing platform that supports editorial decisions, semantic memory, scheduled publishing, and transparent reasoning.

---

## AI Response

The database was normalized into seven core entities:
Agent, Persona, Topic, CandidatePost, PublishedPost, Memory, and SchedulerLog. This separation keeps responsibilities clear, supports future scalability, and simplifies autonomous workflows.

---

## Deliverables

- Database entity design completed
- Relationships defined
- Development plan updated

---

## Commit

docs: design system architecture

# Stage 0.3 — Final Database Implementation

## Goal

Implement and synchronize the final PostgreSQL database schema for the autonomous AI publishing system.

## Architecture Decisions

The final schema supports:

- Multiple autonomous agents
- Persistent persona configuration
- Live topic discovery
- Multiple sources per topic
- Editorial scoring
- Explicit publish/reject decisions
- Candidate post generation
- Published post history
- Semantic agent memory
- Autonomous scheduler execution logs

## Database

PostgreSQL 18

## ORM

Prisma 7.9.1

## Important Design Decisions

### Agent

Stores the autonomous AI identity and scheduling configuration.

### Persona

Stores writing style, tone, audience, interests, opinions, blacklist, and editorial thresholds.

### Topic

Stores every discovered topic, including rejected topics.

This allows the system to demonstrate editorial judgment rather than only storing published content.

### TopicSource

Allows a topic to have multiple supporting sources.

### CandidatePost

Stores AI-generated drafts before publication.

### PublishedPost

Stores the final content, rationale, and source URLs returned by the feed API.

### Memory

Stores persistent semantic memory associated with the agent.

The initial implementation uses JSON for embeddings. This will be migrated to PostgreSQL pgvector during the Memory Engine stage.

### SchedulerLog

Records autonomous execution cycles and their results.

## Prompt

Design and implement a production-ready PostgreSQL/Prisma schema for an autonomous AI technology persona that can discover topics, evaluate them, reject low-quality topics, generate posts, remember previous content, and publish autonomously over time.

## AI Response

The database was structured around the complete autonomous publishing lifecycle:

Agent → Persona → Topic Discovery → Editorial Decision → Candidate Post → Published Post → Memory.

Scheduler execution is independently logged so autonomous activity can be observed and debugged.

## Validation

Prisma schema validated successfully.

## Migration

Database migration completed successfully.

## Verification

Prisma Studio successfully connected to the PostgreSQL database.

## Result

Stage 0.3 completed successfully.

## Commit

feat: implement final database schema