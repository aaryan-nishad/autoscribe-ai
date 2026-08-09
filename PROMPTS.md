# AI Usage Log — AutoScribe AI

## Project

AutoScribe AI is an autonomous AI and technology editorial agent built for the ABTalks Vibe Code Hackathon.

The agent independently discovers technology topics, evaluates them using deterministic editorial scoring and AI editorial judgment, generates content in a consistent persona, remembers previously published content, and publishes over time without additional human prompts.

## AI-Assisted Development

This project was developed iteratively with AI assistance during the hackathon.

AI was used for:
- Project architecture and planning
- Designing the autonomous discovery → editorial → publishing pipeline
- Implementing and debugging API routes
- Designing the editorial policy and scoring system
- Debugging Prisma/PostgreSQL deployment
- Debugging Vercel deployment and environment variables
- Designing the autonomous scheduler
- Debugging GitHub Actions scheduling
- Testing production endpoints
- Reviewing and improving candidate selection
- Debugging the production dashboard and agent ID mismatch
- Preparing deployment and submission documentation

## Important Development Prompts

### Autonomous agent architecture

Prompt:
> Build an autonomous AI and technology persona that independently discovers live technology topics, evaluates whether they are worth publishing, writes in a consistent editorial voice, remembers previous publications, and continues publishing without human prompts.

### Editorial judgment

Prompt:
> Design an editorial system where not every discovered topic is published. The agent should reject low-value, promotional, repetitive, irrelevant, or weakly supported topics and only publish topics that meet a defined editorial standard.

### Persona

Prompt:
> Create a stable AI and technology editorial persona with consistent interests, writing style, opinions, and rejection rules.

### Memory

Prompt:
> Make the agent remember previously published content and use that memory to avoid unnecessary repetition and maintain editorial continuity.

### Autonomous scheduling

Prompt:
> Make the agent continue running after initialization without requiring additional human API calls or prompts.

### Deployment debugging

Prompt:
> Debug the autonomous scheduler, production deployment, environment variables, cron authentication, PostgreSQL/Neon connection, and GitHub Actions workflow.

### Editorial pipeline improvement

Prompt:
> Review why the autonomous agent discovers many topics but rejects all candidates. Improve the candidate-selection pipeline without removing the final AI editorial quality gate.

### Production debugging

Prompt:
> Verify the deployed initialization, scheduler, agent status, feed, publishing pipeline, and dashboard, and identify mismatches between development and production agent state.

## Development Iteration

The project was developed through multiple iterations:

1. Built the autonomous discovery and publishing pipeline.
2. Added the scheduler and scheduler API.
3. Added agent status and dashboard functionality.
4. Connected the application to PostgreSQL/Neon.
5. Added production environment configuration.
6. Deployed the application to Vercel.
7. Moved recurring scheduling to GitHub Actions to avoid Vercel Hobby cron limitations.
8. Debugged a stale scheduler lock.
9. Debugged production environment configuration.
10. Verified production scheduler execution.
11. Discovered an agent ID mismatch between the dashboard and production agent.
12. Fixed the dashboard to use the current production agent.
13. Improved deterministic candidate preselection while retaining a separate AI editorial threshold.

## AI Usage Principle

AI assistance was used as a development and debugging partner. The final project architecture, implementation, testing, deployment configuration, and editorial behavior were iteratively verified against the working application.


The link of My ChatGPT conversation : https://chatgpt.com/share/6a786364-e5dc-83e8-b93c-9cc403c3cb76