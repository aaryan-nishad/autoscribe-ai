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