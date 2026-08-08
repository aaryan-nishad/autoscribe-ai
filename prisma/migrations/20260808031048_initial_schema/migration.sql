-- CreateEnum
CREATE TYPE "AgentStatus" AS ENUM ('ACTIVE', 'PAUSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "TopicStatus" AS ENUM ('DISCOVERED', 'EVALUATING', 'REJECTED', 'SELECTED', 'DRAFTED', 'PUBLISHED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "EditorialDecision" AS ENUM ('PUBLISH', 'REJECT');

-- CreateEnum
CREATE TYPE "CandidateStatus" AS ENUM ('DRAFT', 'REVIEWING', 'APPROVED', 'REJECTED', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "SchedulerStatus" AS ENUM ('RUNNING', 'SUCCESS', 'FAILED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "MemoryType" AS ENUM ('PUBLISHED_POST', 'TOPIC_DECISION', 'EDITORIAL_INSIGHT');

-- CreateTable
CREATE TABLE "Agent" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "status" "AgentStatus" NOT NULL DEFAULT 'ACTIVE',
    "publishIntervalMinutes" INTEGER NOT NULL DEFAULT 60,
    "isProcessing" BOOLEAN NOT NULL DEFAULT false,
    "lastRunAt" TIMESTAMP(3),
    "nextRunAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Agent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Persona" (
    "id" TEXT NOT NULL,
    "writingStyle" TEXT NOT NULL,
    "tone" TEXT NOT NULL,
    "audience" TEXT NOT NULL,
    "interests" JSONB NOT NULL,
    "opinions" JSONB NOT NULL,
    "blacklist" JSONB NOT NULL,
    "systemPrompt" TEXT NOT NULL,
    "maxPostLength" INTEGER NOT NULL DEFAULT 180,
    "minTopicScore" DOUBLE PRECISION NOT NULL DEFAULT 7.0,
    "avoidDuplicateScore" DOUBLE PRECISION NOT NULL DEFAULT 0.80,
    "agentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Persona_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Topic" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "sourceName" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "publishedDate" TIMESTAMP(3),
    "discoveredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "score" DOUBLE PRECISION,
    "noveltyScore" DOUBLE PRECISION,
    "relevanceScore" DOUBLE PRECISION,
    "technicalScore" DOUBLE PRECISION,
    "usefulnessScore" DOUBLE PRECISION,
    "timelinessScore" DOUBLE PRECISION,
    "personaFitScore" DOUBLE PRECISION,
    "status" "TopicStatus" NOT NULL DEFAULT 'DISCOVERED',
    "editorialDecision" "EditorialDecision",
    "decisionReason" TEXT,
    "rejectionReason" TEXT,
    "agentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Topic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TopicSource" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "publishedDate" TIMESTAMP(3),
    "topicId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TopicSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CandidatePost" (
    "id" TEXT NOT NULL,
    "draft" TEXT NOT NULL,
    "review" TEXT,
    "qualityScore" DOUBLE PRECISION,
    "status" "CandidateStatus" NOT NULL DEFAULT 'DRAFT',
    "rejectionReason" TEXT,
    "model" TEXT,
    "promptVersion" TEXT,
    "topicId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CandidatePost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublishedPost" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "rationale" TEXT NOT NULL,
    "sources" TEXT[],
    "model" TEXT,
    "promptVersion" TEXT,
    "topicId" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PublishedPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Memory" (
    "id" TEXT NOT NULL,
    "type" "MemoryType" NOT NULL,
    "summary" TEXT NOT NULL,
    "keywords" TEXT[],
    "embedding" JSONB NOT NULL,
    "postId" TEXT,
    "agentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Memory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SchedulerLog" (
    "id" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "finishedAt" TIMESTAMP(3),
    "topicsFound" INTEGER NOT NULL DEFAULT 0,
    "topicsEvaluated" INTEGER NOT NULL DEFAULT 0,
    "topicsRejected" INTEGER NOT NULL DEFAULT 0,
    "topicsSelected" INTEGER NOT NULL DEFAULT 0,
    "topicsPublished" INTEGER NOT NULL DEFAULT 0,
    "status" "SchedulerStatus" NOT NULL DEFAULT 'RUNNING',
    "error" TEXT,
    "discoveryDurationMs" INTEGER,
    "editorialDurationMs" INTEGER,
    "publishingDurationMs" INTEGER,
    "agentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SchedulerLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Agent_status_idx" ON "Agent"("status");

-- CreateIndex
CREATE INDEX "Agent_nextRunAt_idx" ON "Agent"("nextRunAt");

-- CreateIndex
CREATE UNIQUE INDEX "Persona_agentId_key" ON "Persona"("agentId");

-- CreateIndex
CREATE INDEX "Topic_agentId_idx" ON "Topic"("agentId");

-- CreateIndex
CREATE INDEX "Topic_status_idx" ON "Topic"("status");

-- CreateIndex
CREATE INDEX "Topic_score_idx" ON "Topic"("score");

-- CreateIndex
CREATE INDEX "Topic_createdAt_idx" ON "Topic"("createdAt");

-- CreateIndex
CREATE INDEX "Topic_publishedDate_idx" ON "Topic"("publishedDate");

-- CreateIndex
CREATE INDEX "Topic_agentId_status_idx" ON "Topic"("agentId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Topic_agentId_url_key" ON "Topic"("agentId", "url");

-- CreateIndex
CREATE INDEX "TopicSource_topicId_idx" ON "TopicSource"("topicId");

-- CreateIndex
CREATE UNIQUE INDEX "CandidatePost_topicId_key" ON "CandidatePost"("topicId");

-- CreateIndex
CREATE INDEX "CandidatePost_agentId_idx" ON "CandidatePost"("agentId");

-- CreateIndex
CREATE INDEX "CandidatePost_status_idx" ON "CandidatePost"("status");

-- CreateIndex
CREATE INDEX "CandidatePost_qualityScore_idx" ON "CandidatePost"("qualityScore");

-- CreateIndex
CREATE INDEX "CandidatePost_createdAt_idx" ON "CandidatePost"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PublishedPost_topicId_key" ON "PublishedPost"("topicId");

-- CreateIndex
CREATE UNIQUE INDEX "PublishedPost_candidateId_key" ON "PublishedPost"("candidateId");

-- CreateIndex
CREATE INDEX "PublishedPost_agentId_idx" ON "PublishedPost"("agentId");

-- CreateIndex
CREATE INDEX "PublishedPost_publishedAt_idx" ON "PublishedPost"("publishedAt");

-- CreateIndex
CREATE INDEX "PublishedPost_agentId_publishedAt_idx" ON "PublishedPost"("agentId", "publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Memory_postId_key" ON "Memory"("postId");

-- CreateIndex
CREATE INDEX "Memory_agentId_idx" ON "Memory"("agentId");

-- CreateIndex
CREATE INDEX "Memory_type_idx" ON "Memory"("type");

-- CreateIndex
CREATE INDEX "Memory_createdAt_idx" ON "Memory"("createdAt");

-- CreateIndex
CREATE INDEX "SchedulerLog_agentId_idx" ON "SchedulerLog"("agentId");

-- CreateIndex
CREATE INDEX "SchedulerLog_status_idx" ON "SchedulerLog"("status");

-- CreateIndex
CREATE INDEX "SchedulerLog_startedAt_idx" ON "SchedulerLog"("startedAt");

-- CreateIndex
CREATE INDEX "SchedulerLog_agentId_startedAt_idx" ON "SchedulerLog"("agentId", "startedAt");

-- AddForeignKey
ALTER TABLE "Persona" ADD CONSTRAINT "Persona_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Topic" ADD CONSTRAINT "Topic_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TopicSource" ADD CONSTRAINT "TopicSource_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidatePost" ADD CONSTRAINT "CandidatePost_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidatePost" ADD CONSTRAINT "CandidatePost_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublishedPost" ADD CONSTRAINT "PublishedPost_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublishedPost" ADD CONSTRAINT "PublishedPost_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "CandidatePost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublishedPost" ADD CONSTRAINT "PublishedPost_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Memory" ADD CONSTRAINT "Memory_postId_fkey" FOREIGN KEY ("postId") REFERENCES "PublishedPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Memory" ADD CONSTRAINT "Memory_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchedulerLog" ADD CONSTRAINT "SchedulerLog_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
