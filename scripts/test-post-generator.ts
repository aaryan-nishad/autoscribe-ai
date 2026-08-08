import "dotenv/config";

import {
  discoverTopics,
} from "../services/discovery";

import {
  reviewTopicWithAI,
} from "../services/editorial";

import {
  generatePost,
  reviewGeneratedPost,
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

async function main() {
  console.log(
    "========================================",
  );

  console.log(
    "AutoScribe AI — Post Quality Gate Test",
  );

  console.log(
    "========================================",
  );

  console.log(
    "\nRunning discovery...",
  );

  const discovery =
    await discoverTopics();

  console.log(
    `Discovered ${discovery.uniqueCandidateCount} candidates.`,
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
    `\nSelected ${candidates.length} candidates for development review.`,
  );

  for (
    const candidate of candidates
  ) {
    console.log(
      `  ${candidate.sourceName}: ${candidate.title}`,
    );
  }

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

  /*
   * Stage 1:
   *
   * Find a topic that passes editorial review.
   */
  for (
    const candidate of candidates
  ) {
    console.log(
      "\n----------------------------------------",
    );

    console.log(
      `Editorial evaluation: ${candidate.title}`,
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

  console.log(
    "\n========================================",
  );

  console.log(
    "EDITORIAL SELECTION",
  );

  console.log(
    "========================================",
  );

  console.log(
    `Topic: ${selectedTopic.title}`,
  );

  console.log(
    `Source: ${selectedTopic.sourceName}`,
  );

  console.log(
    `Score: ${editorialDecision.score}`,
  );

  /*
   * Stage 2:
   *
   * Generate the actual post.
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
    "\n========================================",
  );

  console.log(
    "GENERATED POST",
  );

  console.log(
    "========================================",
  );

  console.log(
    generated.text,
  );

  /*
   * Stage 3:
   *
   * Independently review the generated post.
   */
  console.log(
    "\n========================================",
  );

  console.log(
    "QUALITY REVIEW",
  );

  console.log(
    "========================================",
  );

  console.log(
    "\nRunning quality review...",
  );

  const qualityReview =
    await reviewGeneratedPost(
      selectedTopic,
      generated,
    );

  console.dir(
    qualityReview,
    {
      depth: null,
    },
  );

  console.log(
    "\n----------------------------------------",
  );

  console.log(
    `Final decision: ${qualityReview.decision}`,
  );

  console.log(
    `Final score: ${qualityReview.score}/100`,
  );

  console.log(
    `Accuracy: ${qualityReview.accuracy}`,
  );

  console.log(
    `Relevance: ${qualityReview.relevance}`,
  );

  console.log(
    `Technical value: ${qualityReview.technicalValue}`,
  );

  console.log(
    `Persona fit: ${qualityReview.personaFit}`,
  );

  console.log(
    `Source grounding: ${qualityReview.sourceGrounding}`,
  );

  console.log(
    `Originality: ${qualityReview.originality}`,
  );

  console.log(
    `Clarity: ${qualityReview.clarity}`,
  );

  console.log(
    "\nReason:",
  );

  console.log(
    qualityReview.reason,
  );

  console.log(
    "\nImprovements:",
  );

  console.dir(
    qualityReview.improvements,
    {
      depth: null,
    },
  );

  /*
   * Final result.
   */
  console.log(
    "\n========================================",
  );

  if (
    qualityReview.decision ===
    "APPROVE"
  ) {
    console.log(
      "POST QUALITY GATE PASSED",
    );

    console.log(
      "The generated post is approved for the next pipeline stage.",
    );
  } else {
    console.log(
      "POST QUALITY GATE REJECTED",
    );

    console.log(
      "The generated post must not be published.",
    );
  }

  console.log(
    "========================================",
  );
}

main().catch(
  (error) => {
    console.error(
      "\nPost quality gate test FAILED.",
    );

    console.error(error);

    process.exitCode = 1;
  },
);