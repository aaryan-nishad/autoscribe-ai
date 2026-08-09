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
70 / 

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

# Stage 3.3.3 — Memory-Aware Editorial Reviewer

## Goal

Integrate persistent semantic memory directly into the AI editorial decision process.

The reviewer must retrieve relevant previous AutoScribe decisions before evaluating a new topic and store the new decision after evaluation.

This transforms memory from a standalone feature into an active part of editorial reasoning.

---

## Architecture

The editorial pipeline now follows:

```text
New Topic
    ↓
Breeth Memory Search
    ↓
Previous Editorial Context
    ↓
Gemini Editorial Reviewer
    ↓
SELECT / REJECT
    ↓
Persist Editorial Decision
    ↓
Breeth

# Stage 4.1 — Persona-Driven Post Generation

## Goal

Convert an editorially selected AI or technology topic into a publishable AutoScribe post while maintaining a consistent technical identity and editorial voice.

The post generator operates only after a topic has passed the editorial review stage.

---

## Architecture

The publishing pipeline now contains:

```text
Live Information Sources
        ↓
Discovery Engine
        ↓
Editorial Review
        ↓
SELECTED TOPIC
        ↓
Post Generator
        ↓
Generated Post


# Stage 4.3 — PostgreSQL Candidate Persistence

## Goal

Connect the AI editorial pipeline to PostgreSQL so that approved and rejected generated candidates are persisted instead of existing only in memory or terminal output.

Before this stage:

Discovery → Editorial → Generation → Quality Gate → Terminal

After this stage:

Discovery → Editorial → Generation → Quality Gate → PostgreSQL

---

## Architecture

The persistence pipeline is:

```text
Live Sources
    ↓
Discovery
    ↓
Editorial Review
    ↓
Selected Topic
    ↓
Post Generation
    ↓
Quality Review
    ↓
CandidatePost
    ↓
PostgreSQL

# Stage 4.4 — Publication Transaction

## Goal

Convert an approved CandidatePost into a persistent PublishedPost while ensuring that the same candidate/topic cannot be published more than once.

---

## Architecture

The publication lifecycle is:

```text
CandidatePost
     ↓
APPROVED
     ↓
Publication Service
     ↓
PublishedPost
     ↓
Topic = PUBLISHED

# Stage 5.1 — Agent Initialization API

## Goal

Expose an API endpoint that initializes the AutoScribe autonomous agent and its persona while remaining idempotent across repeated requests.

## API

POST `/api/agent/init`

## Architecture

The initialization flow is:

Next.js API Route
→ Agent Service
→ Prisma
→ PostgreSQL

The endpoint creates the AutoScribe agent and its associated persona if they do not already exist.

If the agent already exists, the existing agent and persona are returned instead of creating duplicates.

## Agent Configuration

### Name

AutoScribe

### Domain

AI and Technology

### Status

ACTIVE

## Persona

### Writing Style

Concise, analytical, technical, and evidence-oriented.

### Tone

Professional, thoughtful, skeptical, and precise.

### Audience

AI engineers, software engineers, researchers, and technology practitioners.

### Interests

- artificial intelligence
- machine learning
- LLMs
- AI agents
- AI infrastructure
- developer tools
- robotics
- AI research
- software engineering

### Editorial Principles

- Prefer technically meaningful developments over hype.
- Prefer evidence over marketing claims.
- Prefer practical engineering implications.
- Avoid sensationalism.
- Avoid publishing low-information projects.

### Blacklist

- political propaganda
- celebrity news
- generic marketing
- low-information repositories
- AI keyword spam
- unsupported claims

## System Prompt

The AutoScribe persona is instructed to discover, evaluate, explain, and publish meaningful developments in artificial intelligence and technology.

It prioritizes:

- technical substance
- meaningful engineering developments
- research contributions
- AI systems and infrastructure
- developer tools
- robotics
- practical implications

It rejects:

- hype without evidence
- generic AI keyword projects
- low-information repositories
- promotional content
- sensationalism
- unsupported claims

The persona is designed for technically informed readers and must remain concise, analytical, evidence-oriented, and precise.

It must never invent facts that are not supported by available sources.

## Validation

TypeScript compilation passed successfully.

```text
npx tsc --noEmit

# Stage 5.2 — Agent Feed API

## Goal

Expose published AutoScribe content through a read-only API endpoint.

## API

GET `/api/agent/feed`

## Architecture

The feed API reads already-published content from PostgreSQL through Prisma.

The endpoint does not:

- discover topics
- call AI providers
- generate posts
- run editorial review
- publish content

The flow is:

PublishedPost
→ Prisma
→ `/api/agent/feed`
→ API consumer

## Response

The API returns:

- published post ID
- post text
- editorial rationale
- source URLs
- publication timestamp
- topic information
- agent information
- pagination metadata

## Pagination

The endpoint supports cursor-based pagination.

### Default request

GET `/api/agent/feed`

Default page size:

10 posts

### Custom page size

GET `/api/agent/feed?limit=10`

### Cursor pagination

GET `/api/agent/feed?limit=10&cursor=<POST_ID>`

The maximum page size is limited to 50 posts.

## Data Filtering

Only content represented by `PublishedPost` records is returned.

Published posts are ordered by:

1. `publishedAt` descending
2. `id` descending

This ensures deterministic ordering when multiple posts have similar publication timestamps.

## Error Handling

Unexpected database or API errors return HTTP 500 with a JSON error response.

## Validation

TypeScript compilation passed successfully.

## API Test

Agent Feed API test completed successfully.

### Default feed

HTTP status:

```text
200

# Stage 5.3 — Autonomous Agent Run API

## Goal

Connect the independently tested AutoScribe services into a single autonomous execution pipeline.

## Pipeline

Agent Initialization
→ Topic Discovery
→ AI Editorial Review
→ Topic Persistence
→ Post Generation
→ Post Quality Review
→ Candidate Persistence
→ Publication
→ Breeth Memory

## API

POST /api/agent/run

## Execution Behavior

The autonomous run:

1. Initializes or loads the AutoScribe agent.
2. Discovers topics from all configured sources.
3. Evaluates candidates using the AI editorial reviewer.
4. Persists selected topics in PostgreSQL.
5. Generates candidate posts using Gemini.
6. Runs the post quality gate.
7. Persists CandidatePost records.
8. Publishes approved candidates.
9. Stores published-post memory in Breeth.
10. Continues processing if an individual candidate fails.

## Error Isolation

A failure processing one candidate does not terminate the complete autonomous run.

## Validation

Autonomous execution API tested successfully.

Test result:

- HTTP status: 200
- Successful sources: 3
- Failed sources: 0
- Raw candidates: 112
- Unique candidates: 112
- Candidates evaluated: 5
- Published: 0
- Rejected: 5
- Errors: 0
- Execution duration: 85.7 seconds

## Result

Stage 5.3 completed successfully.

## Commit

feat: add autonomous agent run API

## Stage 5.4 — Candidate Ranking and Source Diversity

Implemented a deterministic candidate ranking layer before AI editorial review.

### Ranking

The system now:

1. Discovers candidates from all enabled sources.
2. Scores candidates using the deterministic editorial scorer.
3. Rejects deterministic candidates below the editorial threshold.
4. Ranks eligible candidates by total editorial score.
5. Gives each source an opportunity to contribute its strongest candidate.
6. Fills remaining candidate slots using the highest-scoring candidates overall.
7. Sends the selected candidates to the AI editorial reviewer.

### Implementation

New service:

```text
services/editorial/candidate-ranker.ts

## Stage 5.5 — Run Safety, Failure Isolation, and Idempotent Candidate Persistence

Implemented robust autonomous-run failure handling.

### Candidate Failure Isolation

Each candidate is processed inside an isolated try/catch.

A failure during editorial review, topic persistence, post generation, quality review, candidate persistence, or publication is recorded as an `ERROR` result and does not terminate processing of the remaining candidates.

### Discovery Warnings

Discovery source failures are now surfaced through the run summary using `runWarnings`.

A partially degraded discovery run can therefore complete while explicitly reporting failed sources.

### Candidate Error Metadata

Candidate processing errors record both the error message and error type for easier debugging.

### Idempotent Candidate Persistence

CandidatePost persistence uses Prisma `upsert()` keyed by the unique `topicId`.

This prevents repeated autonomous runs from failing with a Prisma `P2002` unique-constraint error when a topic has already produced a CandidatePost.

Existing candidate records are updated rather than duplicated.

### Publication Idempotency

Publication remains idempotent. Previously published candidates are not published again.

### Validation

Full autonomous run passed:

```text
97 unique candidates discovered
3 successful sources
5 candidates evaluated
1 published
4 rejected
0 errors
0 warnings

## Current Project Progress — Autonomous Agent, Memory, Publishing & Scheduler

### Autonomous Agent Pipeline

AutoScribe currently follows this autonomous pipeline:

1. Initialize/load the AutoScribe agent.
2. Discover AI/technology topics from enabled sources.
3. Normalize and deduplicate discovered topics.
4. Rank discovered topics using deterministic candidate scoring.
5. Select a limited number of candidates for editorial evaluation.
6. Perform AI editorial review using Gemini.
7. Use previous editorial and publication memory during evaluation.
8. Reject exact previously published topics deterministically.
9. Reject semantically duplicate previously covered developments.
10. Allow meaningful new developments on previously covered subjects when the AI determines that the development is materially new.
11. Generate a draft post for selected topics.
12. Run a quality review on generated posts.
13. Persist candidate posts.
14. Publish only candidates that pass the quality gate.
15. Persist successful publications in PostgreSQL.
16. Persist published-post memory in Breeth.
17. Continue processing remaining candidates if an individual candidate fails.

### Discovery

Enabled discovery sources currently include:

- Hacker News
- GitHub
- arXiv

The unified discovery engine:

- Runs enabled sources concurrently.
- Isolates source failures so one failed source does not stop other sources.
- Normalizes candidate data.
- Normalizes URLs.
- Removes common tracking parameters.
- Deduplicates candidates by canonical URL.
- Sorts candidates by publication freshness.
- Reports successful and failed sources.
- Reports raw and unique candidate counts.

A discovery failure is represented as a warning in the autonomous run rather than automatically terminating the complete run.

### Editorial System

The editorial system contains:

- AI editorial review.
- Deterministic candidate ranking.
- Editorial scoring.
- Relevance/significance/novelty/timeliness/evidence/audience-value evaluation.
- Editorial decision persistence through memory.
- Publication repetition controls.

The AI editorial reviewer uses previous AutoScribe memory to improve decisions about:

- Previously evaluated topics.
- Previous rejection reasons.
- Previously published topics.
- Related technical developments.
- Repeated stories.
- Meaningful new developments.

### Duplicate Publication Protection

Duplicate protection currently operates at multiple levels.

#### Exact URL protection

PostgreSQL is the source of truth for exact publication history.

Before AI editorial evaluation, AutoScribe checks whether the exact topic URL already has a published post.

If it does, the topic is immediately rejected with score `0`.

#### Publication memory protection

Breeth publication memory is also searched for previous AutoScribe publications.

This provides semantic context for identifying previously covered developments.

#### Semantic duplicate protection

The editorial prompt uses publication memory to identify topics that describe the same underlying technical development even when the URL and title are different.

A semantically duplicate topic can therefore be rejected even when it is not an exact URL match.

#### Meaningful new development exception

A previously covered subject is not automatically rejected.

If the current topic represents a clearly meaningful new development, such as:

- major architectural changes,
- significant new capabilities,
- benchmarked improvements,
- materially different technical developments,

the editorial system may select the topic again.

### Memory

The memory service uses the `autoscribe-editorial` memory group.

It supports:

- Editorial decision memory.
- Published-post memory.
- Editorial memory search.
- Published memory search.

Published posts are remembered after successful database publication.

Memory failures do not undo successful database publication or editorial decisions. They are logged as warnings/errors while allowing the primary workflow to continue.

### Publishing

The publishing service provides:

- Candidate status validation.
- APPROVED-only publishing.
- Atomic PostgreSQL publication transaction.
- Topic status transition to `PUBLISHED`.
- PublishedPost creation.
- Duplicate publication protection.
- Idempotent publication behavior.
- Breeth publication-memory persistence after successful publication.

A rejected candidate cannot be published.

Repeated publication attempts for an already published topic return the existing PublishedPost instead of creating a duplicate.

### Scheduler

The scheduler is implemented under:

`services/scheduler/`

It provides:

- Agent lookup.
- ACTIVE-agent validation.
- Atomic `isProcessing` locking.
- Scheduler execution logging.
- Autonomous `/api/agent/run` execution.
- Scheduler run statistics.
- `lastRunAt` tracking.
- `nextRunAt` scheduling.
- Processing-lock release.
- Failure recovery.
- Retry scheduling after failures.

The scheduler worker polls every 60 seconds but only starts an autonomous run when the database `nextRunAt` has been reached.

The normal AutoScribe publishing interval is currently configured to:

`60 minutes`

The scheduler can be temporarily configured to a shorter interval during development/testing.

### Scheduler Safety

The scheduler uses an atomic database update to acquire the processing lock.

This prevents multiple scheduler invocations from simultaneously owning the same agent run.

The worker also prevents overlapping checks within the same worker process.

A recovery script exists for development situations where a stale scheduler lock remains:

`scripts/reset-stuck-scheduler.ts`

A scheduler inspection script exists:

`scripts/check-scheduler.ts`

### Verified Tests

The following behaviors have been tested successfully:

- Autonomous agent initialization.
- Autonomous agent run.
- Candidate ranking.
- Editorial AI review.
- Exact duplicate publication rejection.
- Semantic duplicate rejection.
- Meaningful new development selection.
- Published-post memory writing/search.
- Real previously published topic rejection.
- APPROVED-only publishing guard.
- Publication idempotency.
- Duplicate publication prevention.
- Scheduler execution.
- Scheduler state persistence.
- Scheduler `nextRunAt` handling.
- Scheduler processing lock behavior.

### Current Known State

The core autonomous backend pipeline is operational.

A real autonomous run has successfully published a post:

`esengine/DeepSeek-Reasonix`

The resulting PostgreSQL `PublishedPost` record and publication state were verified.

A second publication attempt correctly detected the existing publication and prevented duplication.

The remaining major project work is primarily around productization, dashboard/UI, operational robustness, observability, configuration, and final production-readiness rather than the core autonomous publishing loop.