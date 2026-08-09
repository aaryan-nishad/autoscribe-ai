import "dotenv/config";

import {
  discoverTopics,
} from "../services/discovery";

import {
  memoryService,
} from "../services/memory";

import {
  reviewTopicWithAI,
} from "../services/editorial";

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

  for (const [
    sourceName,
    limit,
  ] of Object.entries(
    limits,
  )) {
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

async function main() {
  console.log("========================================");
  console.log("AutoScribe AI — Duplicate Publication Test");
  console.log("========================================");

  if (!process.env.GEMINI_API_KEY) {
    throw new Error(
      "GEMINI_API_KEY is not configured.",
    );
  }

  if (!process.env.BREETH_API_KEY) {
    throw new Error(
      "BREETH_API_KEY is not configured.",
    );
  }

  /*
   * This topic was previously published by AutoScribe.
   *
   * We intentionally submit the same topic again to verify
   * that publication memory influences the editorial decision.
   */
  const candidate: TopicCandidate = {
    title:
      "Cloudflare launches Kitesurf, a browser built for AI agents",

    summary:
      "Cloudflare launches Kitesurf, a browser built for AI agents.",

    sourceName:
      "Hacker News",

    sourceUrl:
      "https://news.ycombinator.com/",

    url:
      "https://techcrunch.com/2026/08/07/cloudflare-launches-kitesurf-a-browser-built-for-ai-agents/",

    publishedDate:
      new Date("2026-08-07T00:00:00Z"),
  };

  console.log("\nTesting previously published topic:");
  console.log(`Title: ${candidate.title}`);
  console.log(`URL: ${candidate.url}`);

  /*
   * First check publication memory directly.
   */
  console.log(
    "\nSearching publication memory...",
  );

  const publicationMemory =
    await memoryService.searchPublishedMemory({
      topicTitle:
        candidate.title,

      topicUrl:
        candidate.url,
    });

  console.log(
    `Publication memory results: ${publicationMemory.results.length}`,
  );

  for (
    const result of publicationMemory.results.slice(0, 10)
  ) {
    console.log(
      `  - ${
        result.fact ??
        result.name ??
        "No fact"
      }`,
    );
  }

  /*
   * Now run the real AI editorial reviewer.
   *
   * This is the important part of the test.
   */
  console.log(
    "\nRunning Gemini editorial review...",
  );

  try {
    const review =
      await reviewTopicWithAI(
        candidate,
      );

    console.log(
      "\n========================================",
    );

    console.log(
      "Editorial Review Result",
    );

    console.log(
      "========================================",
    );

    console.dir(
      review,
      {
        depth: null,
      },
    );

    /*
     * The expected result is REJECT because this topic
     * has already been published by AutoScribe.
     */
    if (
      review.decision ===
      "REJECT"
    ) {
      console.log(
        "\nPASS: Previously published topic was rejected.",
      );
    } else {
      console.log(
        "\nFAIL: Previously published topic was selected.",
      );
    }
  } catch (error) {
    console.error(
      "\nDuplicate publication test failed:",
    );

    console.error(error);

    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});