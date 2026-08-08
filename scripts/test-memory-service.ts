import "dotenv/config";

import {
  memoryService,
} from "../services/memory";

async function main() {
  console.log(
    "========================================",
  );

  console.log(
    "AutoScribe AI — Memory Service Test",
  );

  console.log(
    "========================================",
  );

  const topic = {
    topicTitle:
      "Learning When to Trust via Selective Context Preference Optimization",

    topicUrl:
      "https://arxiv.org/abs/2608.06377v1",

    sourceName:
      "arXiv",

    decision:
      "SELECT" as const,

    score: 88,

    reason:
      "The paper presents a technically meaningful approach to selective trust in language models and directly addresses reliability when models receive misleading or useful external context.",

    keyInsight:
      "Models should learn to distinguish trustworthy context from misleading context rather than simply ignoring external information.",
  };

  console.log(
    "\n1. Storing editorial decision...",
  );

  const writeResult =
    await memoryService.rememberEditorialDecision(
      topic,
    );

  console.log(
    "Memory write completed.",
  );

  console.dir(
    writeResult,
    {
      depth: null,
    },
  );

  console.log(
    "\n2. Searching for related editorial memory...",
  );

  const searchResult =
    await memoryService.searchEditorialMemory(
      {
        topicTitle:
          topic.topicTitle,

        topicSummary:
          "Research on training language models to selectively trust external context.",

        topicUrl:
          topic.topicUrl,
      },
    );

  console.log(
    `Retrieved ${searchResult.results.length} memory results.`,
  );

  console.dir(
    searchResult,
    {
      depth: null,
    },
  );

  if (
    searchResult.results.length ===
    0
  ) {
    throw new Error(
      "Memory search returned no results.",
    );
  }

  console.log(
    "\n========================================",
  );

  console.log(
    "Memory service test PASSED",
  );

  console.log(
    "========================================",
  );
}

main().catch(
  (error) => {
    console.error(
      "\nMemory service test FAILED.",
    );

    console.error(error);

    process.exitCode = 1;
  },
);