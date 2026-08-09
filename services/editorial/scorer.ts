import type {
  TopicCandidate,
} from "../sources/types";

import {
  editorialPolicy,
} from "./policy";

import type {
  EditorialScore,
} from "./types";

/**
 * Convert a score from a 0-100 scale into the weighted
 * contribution used by the final editorial score.
 */
function weightedScore(
  score: number,
  weight: number,
): number {
  return score * weight;
}

/**
 * Check whether text contains any keyword.
 */
function containsKeyword(
  text: string,
  keywords: string[],
): boolean {
  const normalized =
    text.toLowerCase();

  return keywords.some(
    (keyword) =>
      normalized.includes(
        keyword.toLowerCase(),
      ),
  );
}

/**
 * Score topic relevance.
 */
function scoreRelevance(
    topic: TopicCandidate,
): number {
    const text = [
        topic.title,
        topic.summary,
    ].join(" ").toLowerCase();

    if (
        containsKeyword(
            text,
            editorialPolicy.blacklist,
        )
    ) {
        return 0;
    }

    const strongSignals = [
        "artificial intelligence",
        "machine learning",
        "large language model",
        "large language models",
        "llm",
        "ai agent",
        "ai agents",
        "ai infrastructure",
        "ai security",
        "model inference",
        "model training",
        "robotics",
        "computer vision",
        "open source",
        "open-source",
        "developer tool",
        "developer tools",
        "coding agent",
        "ai coding",
        "neural network",
        "foundation model",
    ];

    const matches = strongSignals.filter(
        (keyword) =>
            text.includes(keyword),
    ).length;

    if (matches >= 3) {
        return 100;
    }

    if (matches === 2) {
        return 90;
    }

    if (matches === 1) {
        return 75;
    }

    return 35;
}

/**
 * Estimate significance from available discovery metadata.
 *
 * This is intentionally conservative.
 *
 * The LLM editorial reviewer will later provide a deeper
 * semantic assessment.
 */
function scoreSignificance(
  topic: TopicCandidate,
): number {
  const text = [
    topic.title,
    topic.summary,
  ].join(" ");

  const significantSignals = [
    "new model",
    "new architecture",
    "state-of-the-art",
    "open source",
    "open-source",
    "breakthrough",
    "research",
    "benchmark",
    "inference",
    "agent",
    "security",
    "robotics",
  ];

  if (
    containsKeyword(
      text,
      significantSignals,
    )
  ) {
    return 75;
  }

  return 45;
}

/**
 * Estimate novelty.
 *
 * At this stage novelty is based only on available topic
 * information. Memory-aware semantic novelty will be
 * implemented later.
 */
function scoreNovelty(
  topic: TopicCandidate,
): number {
  if (
    topic.sourceName ===
    "arXiv"
  ) {
    return 75;
  }

  if (
    topic.sourceName ===
    "GitHub"
  ) {
    return 60;
  }

  if (
    topic.sourceName ===
    "Hacker News"
  ) {
    return 65;
  }

  return 50;
}

/**
 * Score timeliness based on publication/update date.
 */
function scoreTimeliness(
  topic: TopicCandidate,
): number {
  if (!topic.publishedDate) {
    return 40;
  }

  const ageMs =
    Date.now() -
    topic.publishedDate.getTime();

  const ageHours =
    ageMs / (1000 * 60 * 60);

  if (ageHours <= 6) {
    return 100;
  }

  if (ageHours <= 24) {
    return 90;
  }

  if (ageHours <= 72) {
    return 75;
  }

  if (ageHours <= 168) {
    return 60;
  }

  return 40;
}

/**
 * Score source evidence quality.
 */
function scoreEvidence(
  topic: TopicCandidate,
): number {
  if (
    topic.sourceName ===
    "arXiv"
  ) {
    return 95;
  }

  if (
    topic.sourceName ===
    "GitHub"
  ) {
    return 80;
  }

  if (
    topic.sourceName ===
    "Hacker News"
  ) {
    return 75;
  }

  return 50;
}

/**
 * Estimate audience value.
 */
function scoreAudienceValue(
  topic: TopicCandidate,
): number {
  const text = [
    topic.title,
    topic.summary,
  ].join(" ");

  const audienceSignals = [
    "developer",
    "developers",
    "engineer",
    "engineering",
    "llm",
    "agent",
    "model",
    "inference",
    "open source",
    "open-source",
    "api",
    "framework",
    "research",
  ];

  if (
    containsKeyword(
      text,
      audienceSignals,
    )
  ) {
    return 85;
  }

  return 50;
}

/**
 * Produce a deterministic editorial score.
 */
export function scoreTopic(
  topic: TopicCandidate,
): EditorialScore {
  const relevance =
    scoreRelevance(topic);

  const significance =
    scoreSignificance(topic);

  const novelty =
    scoreNovelty(topic);

  const timeliness =
    scoreTimeliness(topic);

  const evidence =
    scoreEvidence(topic);

  const audienceValue =
    scoreAudienceValue(topic);

  const totalScore =
    weightedScore(
      relevance,
      editorialPolicy.weights
        .relevance,
    ) +
    weightedScore(
      significance,
      editorialPolicy.weights
        .significance,
    ) +
    weightedScore(
      novelty,
      editorialPolicy.weights
        .novelty,
    ) +
    weightedScore(
      timeliness,
      editorialPolicy.weights
        .timeliness,
    ) +
    weightedScore(
      evidence,
      editorialPolicy.weights
        .evidence,
    ) +
    weightedScore(
      audienceValue,
      editorialPolicy.weights
        .audienceValue,
    );

  const roundedScore =
    Math.round(
      totalScore,
    );

  const rejectedByBlacklist =
    relevance === 0;

  const decision =
    !rejectedByBlacklist &&
    roundedScore >=
        editorialPolicy.preselectionScore
        ? "SELECT"
        : "REJECT";

  const reason =
    rejectedByBlacklist
      ? "Rejected because the topic matches an editorial blacklist rule."
      : decision === "SELECT"
        ? `Selected for AI editorial review because it scored ${roundedScore}/100 and meets the deterministic preselection threshold of ${editorialPolicy.preselectionScore}.`
        : `Rejected because it scored ${roundedScore}/100, below the deterministic preselection threshold of ${editorialPolicy.preselectionScore}.`;

  return {
    relevance,
    significance,
    novelty,
    timeliness,
    evidence,
    audienceValue,

    totalScore:
      roundedScore,

    decision,

    reason,
  };
}