import {
  getAIProvider,
} from "../ai";

import type {
  GeneratedPost,
  PostQualityReview,
} from "./types";

import type {
  TopicCandidate,
} from "../sources/types";

function parseAIJson(
  text: string,
): unknown {
  const raw = text.trim();

  // Direct JSON
  try {
    return JSON.parse(raw);
  } catch {
    // Continue.
  }

  // JSON inside Markdown code fences
  const fencedMatch =
    raw.match(
      /```(?:json)?\s*([\s\S]*?)\s*```/i,
    );

  if (fencedMatch?.[1]) {
    try {
      return JSON.parse(
        fencedMatch[1].trim(),
      );
    } catch {
      // Continue.
    }
  }

  // JSON embedded inside surrounding text
  const firstBrace =
    raw.indexOf("{");

  const lastBrace =
    raw.lastIndexOf("}");

  if (
    firstBrace !== -1 &&
    lastBrace > firstBrace
  ) {
    const possibleJson =
      raw.slice(
        firstBrace,
        lastBrace + 1,
      );

    try {
      return JSON.parse(
        possibleJson,
      );
    } catch {
      // Continue.
    }
  }

  throw new Error(
    `Post quality reviewer returned invalid JSON:\n${text}`,
  );
}

function numberInRange(
  value: unknown,
  fieldName: string,
): number {
  if (
    typeof value !==
      "number" ||
    !Number.isFinite(value)
  ) {
    throw new Error(
      `${fieldName} must be a number.`,
    );
  }

  if (
    value < 0 ||
    value > 100
  ) {
    throw new Error(
      `${fieldName} must be between 0 and 100.`,
    );
  }

  return value;
}

function stringArray(
  value: unknown,
  fieldName: string,
): string[] {
  if (!Array.isArray(value)) {
    throw new Error(
      `${fieldName} must be an array.`,
    );
  }

  return value
    .filter(
      (item): item is string =>
        typeof item === "string",
    )
    .map(
      (item) =>
        item.trim(),
    )
    .filter(Boolean);
}

function normalizeReview(
  value: unknown,
): PostQualityReview {
  if (
    !value ||
    typeof value !== "object"
  ) {
    throw new Error(
      "Post quality reviewer returned invalid data.",
    );
  }

  const result =
    value as Record<
      string,
      unknown
    >;

  const decision =
    result.decision;

  if (
    decision !== "APPROVE" &&
    decision !== "REJECT"
  ) {
    throw new Error(
      "Post quality reviewer returned an invalid decision.",
    );
  }

  const reason =
    typeof result.reason ===
      "string"
      ? result.reason.trim()
      : "";

  if (!reason) {
    throw new Error(
      "Post quality reviewer returned no reason.",
    );
  }

  return {
    decision,

    score:
      numberInRange(
        result.score,
        "score",
      ),

    accuracy:
      numberInRange(
        result.accuracy,
        "accuracy",
      ),

    relevance:
      numberInRange(
        result.relevance,
        "relevance",
      ),

    technicalValue:
      numberInRange(
        result.technicalValue,
        "technicalValue",
      ),

    personaFit:
      numberInRange(
        result.personaFit,
        "personaFit",
      ),

    sourceGrounding:
      numberInRange(
        result.sourceGrounding,
        "sourceGrounding",
      ),

    originality:
      numberInRange(
        result.originality,
        "originality",
      ),

    clarity:
      numberInRange(
        result.clarity,
        "clarity",
      ),

    reason,

    improvements:
      stringArray(
        result.improvements,
        "improvements",
      ),
  };
}

function buildSystemPrompt(): string {
  return `
You are the quality editor for AutoScribe.

AutoScribe is an autonomous AI and technology
publication focused on:

- AI systems
- AI agents
- LLMs
- AI infrastructure
- Developer tools
- Open-source AI
- AI security
- AI research
- Robotics
- Machine learning systems

Your task is NOT to decide whether the underlying
topic is newsworthy.

That decision has already been made by the editorial
reviewer.

Your task is to determine whether the generated POST
is good enough to represent the AutoScribe persona.

QUALITY CRITERIA

Evaluate the generated post on seven dimensions.

1. ACCURACY

Does the post faithfully represent the information
provided by the topic?

Reject unsupported claims, invented facts, or
significant distortions.

2. RELEVANCE

Does the post remain focused on the selected AI or
technology topic?

3. TECHNICAL VALUE

Does the post explain something technically useful?

A strong post should provide interpretation rather
than merely repeating a headline.

4. PERSONA FIT

Does the post sound like AutoScribe?

AutoScribe is:

- analytical
- technical
- concise
- evidence-oriented
- confident but not sensational

Reject generic AI-news language.

5. SOURCE GROUNDING

Are the claims supported by the supplied topic
information and source?

The model must NOT invent evidence.

6. ORIGINALITY

Does the post provide useful interpretation rather
than simply rewriting the topic title or summary?

7. CLARITY

Is the post easy to understand?

Avoid:

- unnecessary jargon
- excessive repetition
- awkward structure
- bloated explanations

HARD REJECTION CONDITIONS

Reject when:

- The post contains fabricated facts.
- The post makes claims unsupported by the topic.
- The post significantly misrepresents the source.
- The post is mostly generic AI commentary.
- The post is clearly promotional or clickbait.
- The post does not actually discuss the selected topic.
- The post contains serious logical contradictions.

APPROVAL THRESHOLD

A post should normally receive:

- overall score >= 75
- accuracy >= 70
- sourceGrounding >= 70
- personaFit >= 70

If a hard rejection condition exists, reject even if
the numerical score is high.

IMPROVEMENTS

If the post is rejected, provide specific improvements
that another generation pass could act on.

If the post is approved, improvements may still be
provided but should be minor.

Return ONLY valid JSON.

Required format:

{
  "decision": "APPROVE",
  "score": 85,
  "accuracy": 90,
  "relevance": 85,
  "technicalValue": 88,
  "personaFit": 90,
  "sourceGrounding": 85,
  "originality": 80,
  "clarity": 90,
  "reason": "...",
  "improvements": [
    "..."
  ]
}
`;
}

function buildUserPrompt(
  topic: TopicCandidate,
  post: GeneratedPost,
): string {
  return `
Review the following AutoScribe candidate post.

ORIGINAL TOPIC

Title:
${topic.title}

Summary:
${topic.summary}

Source:
${topic.sourceName}

Source URL:
${topic.sourceUrl}

Topic URL:
${topic.url}

EDITORIAL KEY INSIGHT

${post.keyInsight ?? "None"}

GENERATED POST

${post.text}

GENERATION RATIONALE

${post.rationale}

VERIFIED SOURCE URL

${topic.url}

Evaluate ONLY the generated post.

Do not reconsider whether the underlying topic should
be covered.

Return only the JSON quality review.
`;
}

export async function reviewGeneratedPost(
  topic: TopicCandidate,
  post: GeneratedPost,
): Promise<PostQualityReview> {
  const provider =
    getAIProvider();

  const response =
    await provider.generate({
      systemPrompt:
        buildSystemPrompt(),

      userPrompt:
        buildUserPrompt(
          topic,
          post,
        ),
    });

  const parsed =
    parseAIJson(
      response.text,
    );

  return normalizeReview(
    parsed,
  );
}