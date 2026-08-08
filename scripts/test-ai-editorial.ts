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
  console.log(
    "========================================",
  );

  console.log(
    "AutoScribe AI — Memory-Aware Editorial Test",
  );

  console.log(
    "========================================",
  );

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

  console.log(
    `AI Provider: ${
      process.env.AI_PROVIDER ??
      "gemini"
    }`,
  );

  console.log(
    `AI Model: ${
      process.env.GEMINI_MODEL ??
      "gemini-3.5-flash-lite"
    }`,
  );

  console.log(
    "\nRunning discovery...",
  );

  const discovery =
    await discoverTopics();

  console.log(
    `Discovered ${discovery.uniqueCandidateCount} unique candidates.`,
  );

  console.log(
    `Successful sources: ${discovery.successfulSources}`,
  );

  console.log(
    `Failed sources: ${discovery.failedSources}`,
  );

  const candidates =
    sampleCandidatesBySource(
      discovery.candidates,
    );

  console.log(
    `\nEvaluating ${candidates.length} candidates.`,
  );

  const distribution =
    new Map<string, number>();

  for (const candidate of candidates) {
    distribution.set(
      candidate.sourceName,
      (
        distribution.get(
          candidate.sourceName,
        ) ?? 0
      ) + 1,
    );
  }

  for (const [
    source,
    count,
  ] of distribution) {
    console.log(
      `  ${source}: ${count}`,
    );
  }

  let selectedCount = 0;
  let rejectedCount = 0;

  for (const candidate of candidates) {
    console.log(
      "\n----------------------------------------",
    );

    console.log(
      `Topic: ${candidate.title}`,
    );

    console.log(
      `Source: ${candidate.sourceName}`,
    );

    console.log(
      `URL: ${candidate.url}`,
    );

    /*
     * Show memory before the AI review.
     */
    console.log(
      "\nSearching previous memory...",
    );

    const memory =
      await memoryService.searchEditorialMemory(
        {
          topicTitle:
            candidate.title,

          topicSummary:
            candidate.summary,

          topicUrl:
            candidate.url,
        },
      );

    console.log(
      `Previous memory results: ${memory.results.length}`,
    );

    if (
      memory.results.length > 0
    ) {
      console.log(
        "Relevant previous memory:",
      );

      for (const result of memory.results.slice(
        0,
        3,
      )) {
        console.log(
          `  - ${
            result.fact ??
            result.name ??
            "No fact"
          }`,
        );
      }
    }

    console.log(
      "\nRunning Gemini editorial review...",
    );

    try {
      const review =
        await reviewTopicWithAI(
          candidate,
        );

      console.log(
        "\nEditorial decision:",
      );

      console.dir(
        review,
        {
          depth: null,
        },
      );

      if (
        review.decision ===
        "SELECT"
      ) {
        selectedCount++;
      } else {
        rejectedCount++;
      }

      console.log(
        "\nEditorial decision stored in Breeth.",
      );
    } catch (error) {
      console.error(
        "AI review failed:",
      );

      console.error(error);
    }
  }

  console.log(
    "\n========================================",
  );

  console.log(
    "Memory-Aware Editorial Summary",
  );

  console.log(
    "========================================",
  );

  console.log(
    `Candidates evaluated: ${candidates.length}`,
  );

  console.log(
    `Selected: ${selectedCount}`,
  );

  console.log(
    `Rejected: ${rejectedCount}`,
  );

  console.log(
    "\nMemory-aware editorial pipeline completed.",
  );
}

main().catch(
  (error) => {
    console.error(
      "\nMemory-aware editorial test failed:",
    );

    console.error(error);

    process.exitCode = 1;
  },
);