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

# Stage 2.1 — Topic Source Architecture

## Goal

Design a pluggable source architecture that allows the autonomous agent to discover AI and technology topics from multiple live information sources.

## Prompt

Design a TypeScript abstraction for an autonomous AI technology agent that will collect topics from multiple live information sources such as Hacker News, GitHub, arXiv, and RSS feeds.

The architecture should:
- use a common interface for all sources
- return normalized topic candidates
- allow new sources to be added without modifying the discovery engine
- support asynchronous network requests
- remain simple enough for a hackathon implementation

## AI Response

The source layer uses a common `TopicSource` interface.

Each source implements:

- a source name
- an asynchronous discovery method
- normalized `TopicCandidate` objects

A source registry will provide the discovery engine with the currently enabled sources.

This keeps source-specific logic isolated from the autonomous editorial pipeline.

## Files Added

- services/sources/types.ts
- services/sources/index.ts

## Architecture

Discovery Engine
    ↓
TopicSource[]
    ↓
TopicCandidate[]
    ↓
Editorial Engine

## Test

The source registry currently initializes successfully with zero sources.

Individual live connectors will be implemented in subsequent stages.

## Result

Stage 2.1 completed.

# Stage 2.2 — Hacker News Live Source

## Goal

Implement the first real-time information source for the autonomous AI technology agent.

The source must independently retrieve current Hacker News stories and normalize AI/technology-related stories into the common TopicCandidate format.

---

## Source

Hacker News public API.

The connector uses:

- top stories
- new stories
- individual story endpoints

---

## Prompt

Implement a production-quality TypeScript Hacker News source connector for an autonomous AI technology discovery system.

Requirements:

- implement the existing TopicSource interface
- retrieve current Hacker News top stories
- retrieve current Hacker News new stories
- fetch individual story details
- handle failed individual requests without failing the entire discovery cycle
- apply a broad AI/technology relevance filter
- remove duplicate stories appearing in both lists
- normalize results into TopicCandidate objects
- convert Hacker News Unix timestamps to JavaScript Date objects
- handle stories without external URLs
- handle API failures
- add request timeouts
- keep source-specific logic isolated from the discovery engine

The discovery filter should be broad because final editorial judgment will happen in a separate stage.

---

## AI Response

Implemented a Hacker News TopicSource connector.

The connector:

1. Retrieves top stories.
2. Retrieves new stories.
3. Fetches individual story records.
4. Removes deleted/dead/non-story items.
5. Combines both lists.
6. Deduplicates stories by Hacker News ID.
7. Applies an initial AI/technology relevance filter.
8. Converts each result into TopicCandidate.
9. Sorts candidates by publication time.
10. Handles individual request failures without aborting the entire source.
11. Uses a request timeout to prevent an external API from blocking the autonomous pipeline indefinitely.

---

## Files Added

- services/sources/hackernews.ts

## Files Modified

- services/sources/index.ts

---

## Architecture

Hacker News API
    ↓
Top Stories + New Stories
    ↓
Individual Story Details
    ↓
Deduplication
    ↓
Technology Relevance Filter
    ↓
TopicCandidate[]
    ↓
Future Discovery Engine

---

## Editorial Boundary

The Hacker News connector does NOT decide whether a topic deserves publication.

It only discovers potentially relevant topics.

The Editorial Engine will later determine:

- novelty
- relevance
- technical depth
- usefulness
- timeliness
- persona fit
- final publish/reject decision

---

## Testing

TypeScript compilation must succeed.

A live source test will verify that Hacker News returns zero or more normalized TopicCandidate objects.

---

## Result

Stage 2.2 completed.

# Stage 2.2 — Hacker News Live Source

## Goal

Implement the first real live information source for the autonomous AI technology agent.

The connector retrieves current Hacker News stories and converts potentially relevant AI and technology stories into the common `TopicCandidate` format.

---

## Architecture Decisions

### Hacker News

Hacker News was selected as the first live source because it provides a public API suitable for retrieving current technology stories.

The connector uses:

- Top stories
- New stories
- Individual story endpoints

---

### Broad Discovery Filter

The Hacker News connector performs only an initial technology relevance filter.

It does not make the final publishing decision.

The later Editorial Engine will determine whether a discovered topic is actually worth publishing.

---

### Failure Isolation

A failed individual Hacker News story request does not cause the entire discovery cycle to fail.

The connector also uses request timeouts so that an unavailable external source cannot block the autonomous pipeline indefinitely.

---

## Prompt

Implement a production-quality TypeScript Hacker News source connector for an autonomous AI technology discovery system.

Requirements:

- Implement the existing `TopicSource` interface.
- Retrieve current Hacker News top stories.
- Retrieve current Hacker News new stories.
- Fetch individual story details.
- Handle failed individual requests without failing the entire discovery cycle.
- Apply a broad AI and technology relevance filter.
- Remove duplicate stories appearing in both lists.
- Normalize results into `TopicCandidate` objects.
- Convert Hacker News Unix timestamps to JavaScript `Date` objects.
- Handle stories without external URLs.
- Handle API failures.
- Add request timeouts.
- Keep source-specific logic isolated from the discovery engine.

The discovery filter should be broad because final editorial judgment will happen in a separate stage.

---

## AI Response

The Hacker News connector was implemented as a `TopicSource`.

The connector:

1. Retrieves top stories.
2. Retrieves new stories.
3. Fetches individual story records.
4. Removes deleted and dead stories.
5. Removes non-story items.
6. Combines top and new stories.
7. Deduplicates stories by Hacker News ID.
8. Applies an initial AI and technology relevance filter.
9. Converts results into `TopicCandidate`.
10. Sorts candidates by publication time.
11. Handles individual request failures without aborting the entire source.
12. Uses request timeouts to prevent an external API from blocking the autonomous pipeline.

---

## Files Added

- services/sources/hackernews.ts

---

## Files Modified

- services/sources/index.ts

---

## Testing

### TypeScript Compilation

```bash
npx tsc --noEmit

# Stage 2.3 — GitHub Live Source

## Goal

Implement GitHub as the second live information source for the autonomous AI technology agent.

GitHub complements Hacker News by providing signals from active software projects, open-source repositories, developer tools, AI frameworks, and machine learning projects.

---

## Architecture Decisions

### GitHub

GitHub is used as a technical project discovery source.

The connector searches for recently updated AI and technology repositories.

---

### Discovery Signals

The connector collects:

- Repository name
- Repository description
- Repository URL
- Stars
- Forks
- Primary programming language
- Repository topics
- Creation date
- Last update date

These signals are discovery metadata and are not final editorial decisions.

---

### Broad Filtering

The GitHub connector performs an initial relevance filter using AI and technology terms.

The connector does not decide whether a repository deserves publication.

The Editorial Engine will later evaluate:

- Technical significance
- Novelty
- Practical usefulness
- Timeliness
- Persona fit
- Potential audience value

---

### Repository Quality

Archived repositories and forks are excluded from discovery.

---

## Prompt

Implement a production-quality TypeScript GitHub source connector for an autonomous AI and technology discovery system.

Requirements:

- Implement the existing TopicSource interface.
- Search GitHub repositories using the public REST API.
- Focus on recently updated AI and technology repositories.
- Collect repository metadata.
- Exclude archived repositories.
- Exclude forks.
- Apply a broad AI/technology relevance filter.
- Normalize repositories into TopicCandidate objects.
- Handle GitHub API failures.
- Add request timeouts.
- Avoid duplicate repository URLs.
- Keep GitHub-specific logic isolated from the discovery engine.

Do not make final editorial publish/reject decisions in the GitHub connector.

---

## AI Response

The GitHub connector was implemented as a TopicSource.

The connector:

1. Builds a recent GitHub repository search query.
2. Searches for AI and technology projects.
3. Retrieves repository metadata.
4. Excludes archived repositories.
5. Excludes forked repositories.
6. Applies an initial relevance filter.
7. Normalizes repositories into TopicCandidate objects.
8. Removes duplicate repository URLs.
9. Uses request timeouts.
10. Keeps GitHub-specific logic isolated from the discovery architecture.

---

## Files Added

- services/sources/github.ts

---

## Files Modified

- services/sources/index.ts

---

## Architecture

```text
GitHub API
    ↓
Recent Repository Search
    ↓
AI / Technology Filter
    ↓
Exclude Forks + Archived Repositories
    ↓
Normalize Repository Metadata
    ↓
Deduplicate
    ↓
TopicCandidate[]

# Stage 2.3 — GitHub Live Source

## Goal

Implement GitHub as the second live information source for the autonomous AI technology agent.

GitHub complements Hacker News by providing signals from active software projects, open-source repositories, developer tools, AI frameworks, and machine learning projects.

---

## Architecture Decisions

### GitHub

GitHub is used as a technical project discovery source.

The connector searches for recently updated AI and technology repositories.

---

### Discovery Signals

The connector collects:

- Repository name
- Repository description
- Repository URL
- Stars
- Forks
- Primary programming language
- Repository topics
- Creation date
- Last update date

These signals are discovery metadata and are not final editorial decisions.

---

### Broad Filtering

The GitHub connector performs an initial relevance filter using AI and technology terms.

The connector does not decide whether a repository deserves publication.

The Editorial Engine will later evaluate:

- Technical significance
- Novelty
- Practical usefulness
- Timeliness
- Persona fit
- Potential audience value

---

### Repository Quality

Archived repositories and forks are excluded from discovery.

---

## Prompt

Implement a production-quality TypeScript GitHub source connector for an autonomous AI and technology discovery system.

Requirements:

- Implement the existing TopicSource interface.
- Search GitHub repositories using the public REST API.
- Focus on recently updated AI and technology repositories.
- Collect repository metadata.
- Exclude archived repositories.
- Exclude forks.
- Apply a broad AI/technology relevance filter.
- Normalize repositories into TopicCandidate objects.
- Handle GitHub API failures.
- Add request timeouts.
- Avoid duplicate repository URLs.
- Keep GitHub-specific logic isolated from the discovery engine.

Do not make final editorial publish/reject decisions in the GitHub connector.

---

## AI Response

The GitHub connector was implemented as a TopicSource.

The first implementation used a combined GitHub search query, but the GitHub API rejected the query with HTTP 422 Unprocessable Entity.

The implementation was then redesigned to use multiple independent valid search queries.

Each search is executed independently, and a failed search does not terminate the entire discovery operation.

The connector:

1. Searches multiple AI and technology terms.
2. Restricts results to recently updated repositories.
3. Retrieves repository metadata.
4. Excludes archived repositories.
5. Excludes forked repositories.
6. Applies an initial AI/technology relevance filter.
7. Combines results from all searches.
8. Deduplicates repositories by repository ID.
9. Normalizes repositories into TopicCandidate objects.
10. Sorts candidates by recent activity.
11. Performs final URL-level deduplication.
12. Uses request timeouts.
13. Isolates GitHub-specific logic from the discovery architecture.

---

## Files Added

- services/sources/github.ts

---

## Files Modified

- services/sources/index.ts

---

## Testing

### TypeScript Compilation

```bash
npx tsc --noEmit

# Stage 2.4 — arXiv Live Research Source

## Goal

Implement arXiv as the third live information source for the autonomous AI technology agent.

arXiv complements Hacker News and GitHub by providing newly submitted AI and technology research papers.

---

## Architecture Decisions

### arXiv

arXiv is used as a research discovery source.

The connector searches relevant computer science categories:

- cs.AI — Artificial Intelligence
- cs.LG — Machine Learning
- cs.CL — Computation and Language
- cs.CV — Computer Vision
- cs.RO — Robotics

---

### XML / Atom Processing

The arXiv API returns Atom/XML rather than JSON.

The connector therefore uses `fast-xml-parser` to convert the API response into structured TypeScript data.

---

### Research Metadata

The connector extracts:

- Paper title
- Abstract
- Authors
- Categories
- arXiv URL
- Publication date

The paper abstract is used as the initial topic summary.

The future Editorial Engine can transform the research information into a concise, audience-appropriate post.

---

### Duplicate Handling

A paper can belong to multiple arXiv categories.

The connector therefore deduplicates papers using their canonical arXiv URL.

---

## Prompt

Implement a production-quality TypeScript arXiv source connector for an autonomous AI and technology discovery system.

Requirements:

- Implement the existing TopicSource interface.
- Search relevant AI and computer science arXiv categories.
- Retrieve recently submitted papers.
- Parse the Atom/XML API response.
- Extract titles, abstracts, authors, categories, URLs, and publication dates.
- Normalize papers into TopicCandidate objects.
- Remove duplicate papers appearing in multiple categories.
- Sort results by publication date.
- Handle API failures.
- Add request timeouts.
- Keep arXiv-specific logic isolated from the discovery engine.

Do not make final editorial publish/reject decisions in the arXiv connector.

---

## AI Response

The arXiv connector was implemented as a TopicSource.

The connector:

1. Searches cs.AI.
2. Searches cs.LG.
3. Searches cs.CL.
4. Searches cs.CV.
5. Searches cs.RO.
6. Requests recently submitted papers.
7. Parses the Atom/XML response.
8. Normalizes paper metadata.
9. Extracts authors and categories.
10. Converts publication timestamps into JavaScript Date objects.
11. Deduplicates papers by canonical URL.
12. Sorts papers by publication date.
13. Uses request timeouts.
14. Keeps source-specific logic isolated from the discovery architecture.

---

## Dependency Added

```text
fast-xml-parser

# Stage 2.5 — Unified Discovery Engine

## Goal

Create a unified discovery service that independently executes all registered live information sources and produces one normalized collection of topic candidates.

The discovery engine must remain independent from individual source implementations and must continue operating when one source fails.

---

## Architecture Decisions

### Unified Discovery

The discovery engine is responsible for:

- Running all registered sources
- Collecting candidates
- Normalizing candidate data
- Deduplicating candidates
- Sorting candidates by freshness
- Reporting source execution status

---

### Source Isolation

Each source executes independently.

A failure in one source must not prevent other sources from returning results.

For example:

```text
Hacker News  → SUCCESS
GitHub       → FAILED
arXiv        → SUCCESS

# Stage 3.1 — Editorial Policy and Deterministic Baseline

## Goal

Define the stable editorial identity of AutoScribe and establish a transparent deterministic baseline for evaluating discovered topics.

The purpose of this stage is to create an explicit editorial constitution before introducing LLM-based reasoning.

---

## Persona

### Name

AutoScribe — AI Systems Analyst

### Domain

AI and developer technology.

### Editorial Perspective

Explain what is actually changing in AI systems, developer workflows, and open-source technology while separating meaningful technical progress from hype.

The persona prioritizes technical substance over popularity or promotional language.

---

## Editorial Interests

High-interest areas include:

- AI agents
- Large language models
- AI infrastructure
- Developer tools
- Open-source AI
- Model capabilities
- Model inference
- AI security
- AI coding
- Robotics
- AI research
- Developer productivity
- AI systems architecture

---

## Editorial Opinions

The persona follows stable editorial principles:

- Technical substance matters more than hype.
- Open-source releases deserve attention when they create meaningful capability or accessibility improvements.
- Benchmark improvements should be interpreted in context.
- AI agents should be evaluated by what they reliably accomplish rather than how autonomous they sound.
- A new model is not automatically important merely because it is newer or larger.
- Developer tools should be judged by their practical effect on engineering workflows.
- Research should be discussed together with evidence, limitations, and practical implications.
- Popularity is a signal, not proof of technical importance.

---

## Rejection Principles

Topics should be rejected when they:

- Have no meaningful connection to AI or technology.
- Are duplicates or substantially repetitive.
- Are primarily promotional without technical substance.
- Contain claims unsupported by the available source.
- Provide little useful information to the target audience.
- Are low-information repositories discovered only because their names contain AI-related keywords.
- Represent routine updates without meaningful technical change.
- Use sensational claims without sufficient evidence.

---

## Deterministic Editorial Scoring

A transparent baseline scoring system was implemented using:

- Relevance
- Significance
- Novelty
- Timeliness
- Evidence quality
- Audience value

The final score is calculated using weighted criteria.

The minimum publication threshold is:

```text
70 / 100