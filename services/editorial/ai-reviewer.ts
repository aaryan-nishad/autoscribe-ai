import { prisma } from "../../lib/prisma";

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
    SemanticDuplicateReview,
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
function parseAIJson(
    text: string,
): unknown {
    const raw = text.trim();

    // 1. Direct JSON
    try {
        return JSON.parse(raw);
    } catch {
        // Continue.
    }

    // 2. JSON wrapped in ```json ... ```
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

    // 3. JSON embedded in additional text
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
        `AI editorial reviewer returned invalid JSON:\n${text}`,
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

Previous AutoScribe memory is contextual evidence and
must actively influence the editorial decision.

Use memory to:

- Detect topics that AutoScribe has already evaluated.
- Detect topics that AutoScribe has already published.
- Detect substantially similar or duplicate developments.
- Avoid republishing the same story.
- Avoid publishing substantially the same technical development
  under a different title or source.
- Understand previous rejection reasons.
- Identify whether a current topic represents a genuinely
  new development.

REPETITION CONTROL

If previous memory clearly indicates that the same topic,
story, paper, repository, release, or substantially identical
technical development has already been published by AutoScribe:

- REJECT the current topic.
- Do not select it merely because it is still recent or relevant.
- Explain in the reason that AutoScribe has already covered
  the development.

A previously published topic may be SELECTED again only when
the current topic contains a clearly meaningful new development,
such as:

- a major new release,
- a substantial technical update,
- new benchmark results,
- a significant research result,
- a major architectural change,
- or materially different evidence.

Minor updates, reposts, mirrors, announcements, or the same
story from another source should normally be REJECTED.

If previous memory indicates that a topic was previously
REJECTED, reconsider it independently. A rejection is not
permanent if meaningful new evidence or a significant
technical development has appeared.

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
    publicationMemoryContext: string,
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
${topic.publishedDate
            ? topic.publishedDate.toISOString()
            : "Unknown"
        }

PREVIOUS AUTOSCRIBE EDITORIAL MEMORY

${memoryContext ||
        "No relevant previous editorial memory was found."
        }

PREVIOUS AUTOSCRIBE PUBLICATION MEMORY

${publicationMemoryContext ||
        "No relevant previous publication memory was found."
        }

Use the previous memory as editorial history, not merely
as background information.

Pay special attention to whether:

1. This exact topic was already evaluated.
2. This exact topic was already published.
3. This topic substantially repeats a previously published story.
4. The current source is only another representation of an
   already-covered development.
5. The current topic contains a genuinely meaningful new
   development.
6. A previous rejection reason still applies.
7. The topic provides a genuinely new technical insight.

If the memory clearly indicates that this topic or the same
substantive development was already published by AutoScribe,
prefer REJECT unless the current source contains a material
new development.

If there is no meaningful difference from the previously
published material, do not select it merely because the
current source is newer.

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

                return `${index + 1
                    }. ${fact}`;
            },
        )
        .join("\n");
}

function normalizeUrl(url: string): string {
    return url
        .trim()
        .replace(/\/+$/, "")
        .toLowerCase();
}

function normalizeTitle(title: string): string {
    return title
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s]/gu, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function hasExactPublishedDuplicate(
    topic: TopicCandidate,
    publicationMemory: Array<{
        fact?: string;
        name?: string | null;
    }>,
): boolean {
    const currentUrl =
        normalizeUrl(topic.url);

    const currentTitle =
        normalizeTitle(topic.title);

    if (!currentUrl && !currentTitle) {
        return false;
    }

    return publicationMemory.some(
        (memory) => {
            const text = [
                memory.fact ?? "",
                memory.name ?? "",
            ].join(" ");

            const normalizedText =
                normalizeTitle(text);

            const urlMatch =
                currentUrl.length > 0 &&
                text
                    .toLowerCase()
                    .includes(currentUrl);

            const titleMatch =
                currentTitle.length > 0 &&
                normalizedText.includes(
                    currentTitle,
                );

            return urlMatch || titleMatch;
        },
    );

}
async function checkSemanticPublishedDuplicate(
    topic: TopicCandidate,
    publicationMemoryContext: string,
): Promise<SemanticDuplicateReview> {
    if (!publicationMemoryContext.trim()) {
        return {
            isDuplicate: false,
            hasMeaningfulNewDevelopment: false,
            confidence: 0,
            reason: "No previous publication memory was available.",
        };
    }

    const provider = getAIProvider();

    const response = await provider.generate({
        systemPrompt: `
You are AutoScribe's semantic duplicate detection engine.

Your ONLY job is to determine whether the current topic represents
the same substantive technical development as something AutoScribe
has already published.

Do NOT evaluate general editorial quality.

A topic should be considered a duplicate when it describes the same
underlying development, product launch, release, research result,
repository, paper, announcement, or technical event.

Different:
- titles
- URLs
- sources
- wording
- publication dates

do NOT make something new if the underlying development is the same.

A previously published topic may be treated as NOT a duplicate only
when the current topic contains a genuinely meaningful new development.

Meaningful new development includes:

- major new release
- substantial technical update
- major architectural change
- new benchmark results
- significant research result
- materially different technical evidence

Minor updates, reposts, mirrors, follow-up announcements, and
the same story from another source are normally duplicates.

Return ONLY valid JSON.

JSON structure:

{
  "isDuplicate": true | false,
  "hasMeaningfulNewDevelopment": true | false,
  "confidence": 0,
  "reason": "..."
}

confidence must be between 0 and 100.
`,
        userPrompt: `
CURRENT TOPIC

Title:
${topic.title}

Summary:
${topic.summary}

Source:
${topic.sourceName}

URL:
${topic.url}

PREVIOUS AUTOSCRIBE PUBLICATIONS

${publicationMemoryContext}

Determine whether the current topic represents the same substantive
technical development as a previously published AutoScribe topic.

Do not reject merely because the topics are in the same technology
area.

Compare the actual underlying development.

If the current topic is substantially the same story, set:

"isDuplicate": true

If it contains a genuinely meaningful new development, set:

"isDuplicate": false
"hasMeaningfulNewDevelopment": true

Return only JSON.
`,
    });

    const parsed = parseAIJson(response.text);

    if (
        !parsed ||
        typeof parsed !== "object"
    ) {
        throw new Error(
            "Semantic duplicate reviewer returned invalid JSON.",
        );
    }

    const value =
        parsed as Record<string, unknown>;

    return {
        isDuplicate:
            value.isDuplicate === true,

        hasMeaningfulNewDevelopment:
            value.hasMeaningfulNewDevelopment === true,

        confidence:
            clampScore(value.confidence),

        reason:
            typeof value.reason === "string" &&
                value.reason.trim()
                ? value.reason.trim()
                : "No semantic duplicate reason was provided.",
    };
}
async function findExactPublishedDuplicate(
    topic: TopicCandidate,
): Promise<boolean> {
    const publishedTopic =
        await prisma.topic.findFirst({
            where: {
                url: topic.url,
                publishedPost: {
                    isNot: null,
                },
            },
            select: {
                id: true,
            },
        });

    return Boolean(publishedTopic);
}

export async function reviewTopicWithAI(
    topic: TopicCandidate,
): Promise<AIEditorialReview> {
    /*
     * Step 0:
     * Deterministic exact publication check.
     *
     * PostgreSQL is the source of truth for whether
     * AutoScribe has already published this exact URL.
     */
    const exactPublishedDuplicate =
        await findExactPublishedDuplicate(topic);

    if (exactPublishedDuplicate) {
        const review: AIEditorialReview = {
            decision: "REJECT",
            score: 0,
            relevance: 0,
            significance: 0,
            novelty: 0,
            timeliness: 0,
            evidence: 0,
            audienceValue: 0,

            reason:
                "AutoScribe has already published this exact topic URL. The current candidate is an exact duplicate and must be rejected under the repetition control rules.",

            keyInsight: null,
        };

        try {
            await memoryService.rememberEditorialDecision({
                topicTitle: topic.title,
                topicUrl: topic.url,
                sourceName: topic.sourceName,
                decision: review.decision,
                score: review.score,
                reason: review.reason,
                keyInsight: review.keyInsight,
            });
        } catch (error) {
            console.error(
                "Warning: failed to persist duplicate rejection to Breeth.",
                error,
            );
        }

        return review;
    }

    /*
     * Step 1:
     * Retrieve previous AutoScribe editorial memory.
     */
    const memory =
        await memoryService.searchEditorialMemory({
            topicTitle: topic.title,
            topicSummary: topic.summary,
            topicUrl: topic.url,
        });

    /*
     * Step 2:
     * Retrieve previous publication memory.
     *
     * This is still useful for semantic duplicate detection,
     * but PostgreSQL above remains the source of truth for
     * exact URL duplicates.
     */
    const publicationMemory =
        await memoryService.searchPublishedMemory({
            topicTitle: topic.title,
            topicUrl: topic.url,
        });

    const memoryPublishedDuplicate =
        hasExactPublishedDuplicate(
            topic,
            publicationMemory.results,
        );

    if (memoryPublishedDuplicate) {
        const review: AIEditorialReview = {
            decision: "REJECT",
            score: 0,
            relevance: 0,
            significance: 0,
            novelty: 0,
            timeliness: 0,
            evidence: 0,
            audienceValue: 0,
            reason:
                "AutoScribe has already published this exact topic or URL. The current candidate is an exact duplicate and must be rejected under the repetition control rules.",
            keyInsight: null,
        };

        try {
            await memoryService.rememberEditorialDecision({
                topicTitle: topic.title,
                topicUrl: topic.url,
                sourceName: topic.sourceName,
                decision: review.decision,
                score: review.score,
                reason: review.reason,
                keyInsight: review.keyInsight,
            });
        } catch (error) {
            console.error(
                "Warning: failed to persist duplicate rejection to Breeth.",
                error,
            );
        }

        return review;
    }

    const memoryContext =
        buildMemoryContext(
            memory.results,
        );

    const publicationMemoryContext =
        buildMemoryContext(
            publicationMemory.results,
        );

    /*
     * Step 2:
     * Semantic duplicate pre-check.
     *
     * Exact duplicates are handled deterministically above.
     * This check handles the harder case where the same
     * development appears under a different title, URL,
     * or source.
     */
    const semanticDuplicate =
        await checkSemanticPublishedDuplicate(
            topic,
            publicationMemoryContext,
        );

    if (
        semanticDuplicate.isDuplicate &&
        !semanticDuplicate.hasMeaningfulNewDevelopment
    ) {
        const review: AIEditorialReview = {
            decision: "REJECT",
            score: 0,
            relevance: 0,
            significance: 0,
            novelty: 0,
            timeliness: 0,
            evidence: 0,
            audienceValue: 0,

            reason:
                `AutoScribe has already covered the same substantive development. ${semanticDuplicate.reason}`,

            keyInsight: null,
        };

        try {
            await memoryService.rememberEditorialDecision({
                topicTitle: topic.title,
                topicUrl: topic.url,
                sourceName: topic.sourceName,
                decision: review.decision,
                score: review.score,
                reason: review.reason,
                keyInsight: review.keyInsight,
            });
        } catch (error) {
            console.error(
                "Warning: failed to persist semantic duplicate rejection to Breeth.",
                error,
            );
        }

        return review;
    }

    /*
     * Step 3:
     * Ask Gemini to perform the normal editorial review.
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
                    publicationMemoryContext,
                ),
        });

    const parsed =
        parseAIJson(
            response.text,
        );

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