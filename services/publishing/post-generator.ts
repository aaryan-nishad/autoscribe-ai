import {
  getAIProvider,
} from "../ai";

import type {
  TopicCandidate,
} from "../sources/types";

import type {
  GeneratedPost,
  PostGenerationInput,
} from "./types";

function extractJson(
  text: string,
): unknown {
  const trimmed =
    text.trim();

  /*
   * First try direct JSON.
   */
  try {
    return JSON.parse(
      trimmed,
    );
  } catch {
    // Continue.
  }

  /*
   * Gemini may occasionally wrap JSON
   * inside markdown code fences.
   */
  const withoutFence =
    trimmed
      .replace(
        /^```json\s*/i,
        "",
      )
      .replace(
        /^```\s*/i,
        "",
      )
      .replace(
        /\s*```$/i,
        "",
      )
      .trim();

  try {
    return JSON.parse(
      withoutFence,
    );
  } catch {
    throw new Error(
      `Post generator returned invalid JSON:\n${text}`,
    );
  }
}

function normalizeGeneratedPost(
  value: unknown,
): GeneratedPost {
  if (
    !value ||
    typeof value !== "object"
  ) {
    throw new Error(
      "Post generator returned invalid data.",
    );
  }

  const result =
    value as Record<
      string,
      unknown
    >;

  const text =
    typeof result.text ===
    "string"
      ? result.text.trim()
      : "";

  const rationale =
    typeof result.rationale ===
    "string"
      ? result.rationale.trim()
      : "";

  const keyInsight =
    typeof result.keyInsight ===
      "string" &&
    result.keyInsight.trim()
      ? result.keyInsight.trim()
      : null;

  if (!text) {
    throw new Error(
      "Generated post is empty.",
    );
  }

  if (!rationale) {
    throw new Error(
      "Generated post has no rationale.",
    );
  }

  return {
    text,
    rationale,
    sources: [],
    keyInsight,
  };
}

function buildSystemPrompt(): string {
  return `
You are AutoScribe, an autonomous AI Systems Analyst
and technology writer.

Your job is to turn an editorially selected AI or
technology topic into a concise, technically useful
social-media-style post.

IDENTITY

You write for technically curious developers,
AI engineers, researchers, and technology professionals.

Your interests include:

- AI agents
- Large language models
- AI infrastructure
- Developer tools
- Open-source AI
- AI security
- AI research
- Robotics
- Model inference
- Developer productivity
- AI systems architecture

VOICE

Your writing must be:

- Technical
- Clear
- Analytical
- Concise
- Confident without being sensational
- Curious
- Evidence-oriented

You do NOT write like a generic AI news account.

Avoid:

- "This changes everything"
- "The future is here"
- "Revolutionary"
- "Game changer"
- Empty excitement
- Marketing language
- Unsupported claims
- Excessive emojis
- Clickbait
- Generic summaries

EDITORIAL STYLE

Prefer explaining:

1. What actually changed?
2. What is technically interesting?
3. Why does it matter?
4. What should developers or researchers pay attention to?

The post should add interpretation rather than simply
copying the source.

DO NOT invent facts that are not supported by the
provided topic information.

If the available evidence is limited, explicitly keep
the claim limited.

POST STRUCTURE

Prefer this structure:

Hook
↓
Technical development
↓
Why it matters
↓
Practical implication

The post should normally be between
500 and 900 characters.

Do not force the structure if the topic does not
support it naturally.

RATIONALE

The rationale must explain:

- Why AutoScribe chose this topic.
- Why the topic is relevant now.
- What makes it technically useful to the audience.

The rationale is metadata for the API and is NOT part
of the public post.

KEY INSIGHT

Provide one concise technical insight.

The insight must be directly supported by the topic
and editorial decision.

SOURCES

Do not invent URLs.

The application will attach the verified source URL
after generation.

Return ONLY valid JSON.

Required format:

{
  "text": "...",
  "rationale": "...",
  "keyInsight": "..."
}
`;
}

function buildUserPrompt(
  input: PostGenerationInput,
): string {
  const {
    topic,
    editorialDecision,
  } = input;

  return `
Generate an AutoScribe post for this selected topic.

TOPIC

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

Published Date:
${
  topic.publishedDate
    ? topic.publishedDate.toISOString()
    : "Unknown"
}

EDITORIAL DECISION

Score:
${editorialDecision.score}/100

Editorial reason:
${editorialDecision.reason}

Key insight:
${
  editorialDecision.keyInsight ??
  "No key insight was provided."
}

IMPORTANT

The topic has already passed AutoScribe's editorial
selection process.

Do not reconsider whether it should be selected.

Instead, create the strongest technically useful
post possible from the available evidence.

The post must:

- Stay faithful to the source.
- Avoid unsupported claims.
- Explain technical significance.
- Maintain the AutoScribe voice.
- Avoid generic AI-news language.
- Avoid excessive hashtags.
- Avoid emojis unless genuinely useful.

Return only:

{
  "text": "...",
  "rationale": "...",
  "keyInsight": "..."
}
`;
}

export async function generatePost(
  input: PostGenerationInput,
): Promise<GeneratedPost> {
  const provider =
    getAIProvider();

  const response =
    await provider.generate({
      systemPrompt:
        buildSystemPrompt(),

      userPrompt:
        buildUserPrompt(
          input,
        ),
    });

  const parsed =
    extractJson(
      response.text,
    );

  const generated =
    normalizeGeneratedPost(
      parsed,
    );

  /*
   * Source URLs are controlled by our application,
   * not generated by the model.
   */
  generated.sources = [
    input.topic.url,
  ];

  return generated;
}