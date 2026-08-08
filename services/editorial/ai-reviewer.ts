import {
  getAIProvider,
} from "../ai";

import {
  memoryService,
} from "../memory";

import type {
  TopicCandidate,
} from "../sources/types";

import {
  editorialPolicy,
} from "./policy";

import type {
  AIEditorialReview,
} from "./types";

function clampScore(
  value: unknown,
): number {
  const number =
    typeof value === "number"
      ? value
      : Number(value);

  if (
    Number.isNaN(number)
  ) {
    return 0;
  }

  return Math.max(
    0,
    Math.min(
      100,
      Math.round(number),
    ),
  );
}

function normalizeReview(
  value: unknown,
): AIEditorialReview {
  if (
    !value ||
    typeof value !== "object"
  ) {
    throw new Error(
      "AI editorial reviewer returned invalid JSON.",
    );
  }

  const review =
    value as Record<
      string,
      unknown
    >;

  const decision =
    review.decision ===
    "SELECT"
      ? "SELECT"
      : review.decision ===
          "REJECT"
        ? "REJECT"
        : null;

  if (!decision) {
    throw new Error(
      "AI editorial reviewer returned an invalid decision.",
    );
  }

  const reason =
    typeof review.reason ===
    "string"
      ? review.reason.trim()
      : "";

  if (!reason) {
    throw new Error(
      "AI editorial reviewer did not provide a reason.",
    );
  }

  return {
    decision,

    score:
      clampScore(
        review.score,
      ),

    relevance:
      clampScore(
        review.relevance,
      ),

    significance:
      clampScore(
        review.significance,
      ),

    novelty:
      clampScore(
        review.novelty,
      ),

    timeliness:
      clampScore(
        review.timeliness,
      ),

    evidence:
      clampScore(
        review.evidence,
      ),

    audienceValue:
      clampScore(
        review.audienceValue,
      ),

    reason,

    keyInsight:
      typeof review.keyInsight ===
        "string" &&
      review.keyInsight.trim()
        ? review.keyInsight.trim()
        : null,
  };
}

function buildSystemPrompt(): string {
  return `
You are the editorial decision engine for AutoScribe,
an autonomous AI Systems Analyst.

Your job is NOT to publish everything you discover.

Your job is to determine whether a discovered topic
is genuinely worth publishing to an audience interested
in AI systems, developer technology, open-source AI,
AI infrastructure, agents, robotics, and AI research.

You must distinguish meaningful technical developments
from hype, routine updates, low-information projects,
keyword matches, and promotional material.

EDITORIAL IDENTITY

Interests:
${editorialPolicy.interests
  .map(
    (item) =>
      `- ${item}`,
  )
  .join("\n")}

Preferred topics:
${editorialPolicy.preferredTopics
  .map(
    (item) =>
      `- ${item}`,
  )
  .join("\n")}

Low-priority topics:
${editorialPolicy.lowPriorityTopics
  .map(
    (item) =>
      `- ${item}`,
  )
  .join("\n")}

Editorial opinions:
${editorialPolicy.opinions
  .map(
    (item) =>
      `- ${item}`,
  )
  .join("\n")}

Rejection rules:
${editorialPolicy.rejectionRules
  .map(
    (item) =>
      `- ${item}`,
  )
  .join("\n")}

MINIMUM SCORE

${editorialPolicy.minimumScore}/100

SCORING

Evaluate:

1. relevance
2. significance
3. novelty
4. timeliness
5. evidence
6. audienceValue

Each criterion must be scored from 0 to 100.

The final score must also be from 0 to 100.

DECISION

Score >= ${editorialPolicy.minimumScore}
normally means SELECT.

Score < ${editorialPolicy.minimumScore}
normally means REJECT.

Hard rejection rules override the score.

MEMORY RULES

Previous AutoScribe memory is contextual evidence.

Use it to:

- Detect repeated topics.
- Detect substantially similar developments.
- Avoid unnecessary repetition.
- Understand previous editorial decisions.
- Build continuity with previously selected topics.
- Recognize when a new development is genuinely different.

Do NOT blindly copy a previous decision.

A previously rejected topic may become important
if new evidence or a meaningful technical development
has appeared.

A previously selected topic does not automatically
mean a related topic should be selected.

Evaluate the current topic independently while using
memory to improve continuity.

IMPORTANT

Do not select a topic merely because its title contains
"AI", "LLM", "agent", "robotics", or another technology
keyword.

Popularity and freshness are signals, not proof of
technical importance.

If SELECTED, keyInsight must explain the specific
technical development or implication worth discussing.

If REJECTED, keyInsight should normally be null.

The reason must clearly explain the editorial decision.

Return ONLY valid JSON.
`;
}

function buildUserPrompt(
  topic: TopicCandidate,
  memoryContext: string,
): string {
  return `
Evaluate this discovered topic.

CURRENT TOPIC

TITLE:
${topic.title}

SUMMARY:
${topic.summary}

SOURCE:
${topic.sourceName}

SOURCE URL:
${topic.sourceUrl}

TOPIC URL:
${topic.url}

PUBLISHED / UPDATED:
${
  topic.publishedDate
    ? topic.publishedDate.toISOString()
    : "Unknown"
}

PREVIOUS AUTOSCRIBE MEMORY

${
  memoryContext ||
  "No relevant previous memory was found."
}

Use the previous memory as context.

Pay special attention to whether:

1. This topic was already evaluated.
2. This topic substantially repeats a previous topic.
3. This topic represents a meaningful new development.
4. A previous rejection reason still applies.
5. The topic provides a new technical insight.

Return exactly this JSON structure:

{
  "decision": "SELECT" | "REJECT",
  "score": 0,
  "relevance": 0,
  "significance": 0,
  "novelty": 0,
  "timeliness": 0,
  "evidence": 0,
  "audienceValue": 0,
  "reason": "...",
  "keyInsight": "..."
}

All numeric values must be between 0 and 100.
`;
}

function buildMemoryContext(
  facts: Array<{
    fact?: string;
    name?: string | null;
    tier?: string;
  }>,
): string {
  if (
    facts.length === 0
  ) {
    return "";
  }

  return facts
    .map(
      (memory, index) => {
        const fact =
          memory.fact ??
          memory.name ??
          "No textual fact available.";

        return `${
          index + 1
        }. ${fact}`;
      },
    )
    .join("\n");
}

export async function reviewTopicWithAI(
  topic: TopicCandidate,
): Promise<AIEditorialReview> {
  /*
   * Step 1:
   * Retrieve relevant previous AutoScribe memory.
   */
  const memory =
    await memoryService.searchEditorialMemory(
      {
        topicTitle:
          topic.title,

        topicSummary:
          topic.summary,

        topicUrl:
          topic.url,
      },
    );

  const memoryContext =
    buildMemoryContext(
      memory.results,
    );

  /*
   * Step 2:
   * Ask Gemini to evaluate the topic using
   * both the editorial constitution and memory.
   */
  const provider =
    getAIProvider();

  const response =
    await provider.generate({
      systemPrompt:
        buildSystemPrompt(),

      userPrompt:
        buildUserPrompt(
          topic,
          memoryContext,
        ),
    });

  let parsed: unknown;

  try {
    parsed =
      JSON.parse(
        response.text,
      );
  } catch {
    throw new Error(
      `AI editorial reviewer returned invalid JSON:\n${response.text}`,
    );
  }

  const review =
    normalizeReview(
      parsed,
    );

  /*
   * Step 3:
   * Persist this editorial decision in Breeth
   * so future autonomous cycles can use it.
   */
  try {
    await memoryService.rememberEditorialDecision(
      {
        topicTitle:
          topic.title,

        topicUrl:
          topic.url,

        sourceName:
          topic.sourceName,

        decision:
          review.decision,

        score:
          review.score,

        reason:
          review.reason,

        keyInsight:
          review.keyInsight,
      },
    );
  } catch (error) {
    /*
     * Editorial judgment itself succeeded.
     *
     * Memory failure should be visible but should
     * not erase the valid AI decision.
     */
    console.error(
      "Warning: failed to persist editorial decision to Breeth.",
      error,
    );
  }

  return review;
}