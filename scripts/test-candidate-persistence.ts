import "dotenv/config";

import { prisma } from "../lib/prisma";

import {
  discoverTopics,
} from "../services/discovery";

import {
  reviewTopicWithAI,
} from "../services/editorial";

import {
  generatePost,
  reviewGeneratedPost,
  saveCandidatePost,
} from "../services/publishing";

import type {
  TopicCandidate,
} from "../services/sources/types";

function sampleCandidatesBySource(
  candidates: TopicCandidate[],
): TopicCandidate[] {
  const limits: Record<
    string,
    number
  > = {
    GitHub: 2,
    "Hacker News": 2,
    arXiv: 1,
  };

  const selected: TopicCandidate[] =
    [];

  for (
    const [
      sourceName,
      limit,
    ] of Object.entries(
      limits,
    )
  ) {
    const sourceCandidates =
      candidates.filter(
        (candidate) =>
          candidate.sourceName ===
          sourceName,
      );

    selected.push(
      ...sourceCandidates.slice(
        0,
        limit,
      ),
    );
  }

  return selected;
}

async function getOrCreateTestAgent() {
  const existing =
    await prisma.agent.findFirst({
      where: {
        name: "AutoScribe Test Agent",
        domain: "AI Technology",
      },
    });

  if (existing) {
    return existing;
  }

  return prisma.agent.create({
    data: {
      name:
        "AutoScribe Test Agent",

      domain:
        "AI Technology",

      persona: {
        create: {
          writingStyle:
            "Technical, analytical, concise, evidence-oriented",

          tone:
            "Confident, curious, non-sensational",

          audience:
            "AI engineers, developers, researchers, and technology professionals",

          interests: [
            "AI systems",
            "AI agents",
            "LLMs",
            "AI infrastructure",
            "developer tools",
            "AI security",
            "AI research",
            "robotics",
          ],

          opinions: [
            "Prefer evidence over hype",
            "Technical substance matters more than popularity",
            "AI systems should be evaluated by measurable behavior",
          ],

          blacklist: [
            "clickbait",
            "unsupported claims",
            "generic AI hype",
            "promotional content",
          ],

          systemPrompt:
            "You are AutoScribe, an autonomous AI systems analyst and technology writer.",
        },
      },
    },
  });
}

async function getOrCreateTopic(
  candidate: TopicCandidate,
  agentId: string,
) {
  const existing =
    await prisma.topic.findUnique({
      where: {
        agentId_url: {
          agentId,
          url: candidate.url,
        },
      },
    });

  if (existing) {
    return existing;
  }

  return prisma.topic.create({
    data: {
      title: candidate.title,

      summary: candidate.summary,

      sourceName: candidate.sourceName,

      sourceUrl: candidate.sourceUrl,

      url: candidate.url,

      publishedDate:
        candidate.publishedDate,

      agentId,
    },
  });
}

async function main() {
  console.log(
    "========================================",
  );

  console.log(
    "AutoScribe AI — Candidate Persistence Test",
  );

  console.log(
    "========================================",
  );

  /*
   * 1. Get the test agent.
   */
  console.log(
    "\nCreating/loading test agent...",
  );

  const agent =
    await getOrCreateTestAgent();

  console.log(
    `Agent: ${agent.name}`,
  );

  console.log(
    `Agent ID: ${agent.id}`,
  );

  /*
   * 2. Discover topics.
   */
  console.log(
    "\nRunning discovery...",
  );

  const discovery =
    await discoverTopics();

  console.log(
    `Discovered ${discovery.uniqueCandidateCount} candidates.`,
  );

  /*
   * 3. Limit development API usage.
   */
  const candidates =
    sampleCandidatesBySource(
      discovery.candidates,
    );

  console.log(
    `Testing ${candidates.length} candidates.`,
  );

  /*
   * 4. Find first editorially selected topic.
   */
  let selectedTopic:
    | TopicCandidate
    | null = null;

  let editorialDecision:
    | Awaited<
        ReturnType<
          typeof reviewTopicWithAI
        >
      >
    | null = null;

  for (
    const candidate of candidates
  ) {
    console.log(
      `\nEditorial review: ${candidate.title}`,
    );

    try {
      const review =
        await reviewTopicWithAI(
          candidate,
        );

      console.log(
        `Decision: ${review.decision} (${review.score})`,
      );

      if (
        review.decision ===
        "SELECT"
      ) {
        selectedTopic =
          candidate;

        editorialDecision =
          review;

        break;
      }
    } catch (error) {
      console.error(
        "Editorial review failed:",
      );

      console.error(error);
    }
  }

  if (
    !selectedTopic ||
    !editorialDecision
  ) {
    throw new Error(
      "No topic passed editorial review.",
    );
  }

  /*
   * 5. Persist the Topic.
   */
  console.log(
    "\nPersisting selected topic...",
  );

  const databaseTopic =
    await getOrCreateTopic(
      selectedTopic,
      agent.id,
    );

  console.log(
    `Topic ID: ${databaseTopic.id}`,
  );

  /*
   * 6. Generate post.
   */
  console.log(
    "\nGenerating post...",
  );

  const generated =
    await generatePost({
      topic:
        selectedTopic,

      editorialDecision: {
        score:
          editorialDecision.score,

        reason:
          editorialDecision.reason,

        keyInsight:
          editorialDecision.keyInsight,
      },
    });

  console.log(
    "\nGenerated post:",
  );

  console.log(
    generated.text,
  );

  /*
   * 7. Quality review.
   */
  console.log(
    "\nRunning quality review...",
  );

  const qualityReview =
    await reviewGeneratedPost(
      selectedTopic,
      generated,
    );

  console.log(
    `Quality decision: ${qualityReview.decision}`,
  );

  console.log(
    `Quality score: ${qualityReview.score}`,
  );

  /*
   * 8. Persist CandidatePost.
   */
  console.log(
    "\nPersisting CandidatePost...",
  );

  const candidatePost =
    await saveCandidatePost({
      topic:
        selectedTopic,

      agentId:
        agent.id,

      generatedPost:
        generated,

      qualityReview:
        qualityReview,
    });

  console.log(
    "\n========================================",
  );

  console.log(
    "CandidatePost persisted successfully",
  );

  console.log(
    "========================================",
  );

  console.log(
    `Candidate ID: ${candidatePost.id}`,
  );

  console.log(
    `Topic ID: ${candidatePost.topicId}`,
  );

  console.log(
    `Agent ID: ${candidatePost.agentId}`,
  );

  console.log(
    `Status: ${candidatePost.status}`,
  );

  console.log(
    `Quality Score: ${candidatePost.qualityScore}`,
  );

  /*
   * 9. Read it back from PostgreSQL.
   */
  console.log(
    "\nReading CandidatePost back from PostgreSQL...",
  );

  const stored =
    await prisma.candidatePost.findUnique({
      where: {
        id:
          candidatePost.id,
      },

      include: {
        topic: true,
        agent: true,
      },
    });

  if (!stored) {
    throw new Error(
      "CandidatePost could not be read back from PostgreSQL.",
    );
  }

  console.log(
    "\nStored database record:",
  );

  console.dir(
    {
      id:
        stored.id,

      status:
        stored.status,

      qualityScore:
        stored.qualityScore,

      topic:
        stored.topic.title,

      agent:
        stored.agent.name,
    },
    {
      depth: null,
    },
  );

  console.log(
    "\n========================================",
  );

  console.log(
    "CANDIDATE PERSISTENCE TEST PASSED",
  );

  console.log(
    "========================================",
  );
}

main()
  .catch(
    (error) => {
      console.error(
        "\nCandidate persistence test FAILED.",
      );

      console.error(error);

      process.exitCode = 1;
    },
  )
  .finally(
    async () => {
      await prisma.$disconnect();
    },
  );
