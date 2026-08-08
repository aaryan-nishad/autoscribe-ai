import "dotenv/config";

import { prisma } from "../lib/prisma";

import {
  publishCandidate,
} from "../services/publishing";

async function main() {
  console.log(
    "========================================",
  );

  console.log(
    "AutoScribe AI — Publication Test",
  );

  console.log(
    "========================================",
  );

  /*
   * Find the most recently created approved
   * candidate.
   */
  console.log(
    "\nFinding latest APPROVED candidate...",
  );

  const candidate =
    await prisma.candidatePost.findFirst({
      where: {
        status: "APPROVED",
      },

      orderBy: {
        createdAt: "desc",
      },

      include: {
        topic: true,
        agent: true,
      },
    });

  if (!candidate) {
    throw new Error(
      "No APPROVED CandidatePost exists.",
    );
  }

  console.log(
    `Candidate ID: ${candidate.id}`,
  );

  console.log(
    `Topic: ${candidate.topic.title}`,
  );

  console.log(
    `Agent: ${candidate.agent.name}`,
  );

  console.log(
    `Quality score: ${candidate.qualityScore}`,
  );

  /*
   * Publish.
   */
  console.log(
    "\nPublishing candidate...",
  );

  const result =
    await publishCandidate({
      candidateId:
        candidate.id,
    });

  console.log(
    "\nPublication result:",
  );

  console.dir(
    result,
    {
      depth: null,
    },
  );

  /*
   * Verify PublishedPost.
   */
  console.log(
    "\nReading PublishedPost from PostgreSQL...",
  );

  const published =
    await prisma.publishedPost.findUnique({
      where: {
        id:
          result.postId,
      },

      include: {
        topic: true,
        agent: true,
        memory: true,
      },
    });

  if (!published) {
    throw new Error(
      "PublishedPost was not found after publication.",
    );
  }

  console.log(
    "\nPublished database record:",
  );

  console.dir(
    {
      id:
        published.id,

      text:
        published.text,

      rationale:
        published.rationale,

      sources:
        published.sources,

      topic:
        published.topic.title,

      topicStatus:
        published.topic.status,

      agent:
        published.agent.name,

      publishedAt:
        published.publishedAt,
    },
    {
      depth: null,
    },
  );

  /*
   * Verify topic state.
   */
  if (
    published.topic.status !==
    "PUBLISHED"
  ) {
    throw new Error(
      `Expected Topic status PUBLISHED but received ${published.topic.status}.`,
    );
  }

  /*
   * Verify idempotency.
   *
   * Running publication again with the same candidate
   * must NOT create another PublishedPost.
   */
  console.log(
    "\nTesting idempotency...",
  );

  const secondResult =
    await publishCandidate({
      candidateId:
        candidate.id,
    });

  console.log(
    "Second publication attempt:",
  );

  console.dir(
    secondResult,
    {
      depth: null,
    },
  );

  if (
    secondResult.postId !==
    result.postId
  ) {
    throw new Error(
      "Idempotency test failed: second publication returned a different post.",
    );
  }

  if (
    !secondResult.alreadyPublished
  ) {
    throw new Error(
      "Idempotency test failed: second publication was not recognized as already published.",
    );
  }

  /*
   * Count posts for the topic.
   */
  const postCount =
    await prisma.publishedPost.count({
      where: {
        topicId:
          candidate.topicId,
      },
    });

  if (postCount !== 1) {
    throw new Error(
      `Expected exactly one PublishedPost for this topic, found ${postCount}.`,
    );
  }

  console.log(
    "\n========================================",
  );

  console.log(
    "PUBLICATION TEST PASSED",
  );

  console.log(
    "========================================",
  );

  console.log(
    `PublishedPost: ${result.postId}`,
  );

  console.log(
    "Topic status: PUBLISHED",
  );

  console.log(
    "Duplicate publication: prevented",
  );
}

main()
  .catch(
    (error) => {
      console.error(
        "\nPublication test FAILED.",
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