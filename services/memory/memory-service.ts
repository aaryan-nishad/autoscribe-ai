import {
    searchBreethMemory,
    writeBreethMemory,
} from "./breeth";

import type {
    MemorySearchResult,
    MemoryWriteResult,
} from "./types";

const DEFAULT_GROUP_ID =
    "autoscribe-editorial";

export interface RememberEditorialDecisionInput {
    topicTitle: string;
    topicUrl: string;
    sourceName: string;

    decision:
    | "SELECT"
    | "REJECT";

    score: number;

    reason: string;

    keyInsight?: string | null;
}

export interface SearchEditorialMemoryInput {
    topicTitle: string;
    topicSummary?: string;
    topicUrl?: string;
}

export class MemoryService {
    private readonly groupId: string;

    constructor(
        groupId = DEFAULT_GROUP_ID,
    ) {
        this.groupId = groupId;
    }

    async rememberEditorialDecision(
        input: RememberEditorialDecisionInput,
    ): Promise<MemoryWriteResult> {
        const content = `
AutoScribe editorial decision.

Topic:
${input.topicTitle}

Source:
${input.sourceName}

URL:
${input.topicUrl}

Decision:
${input.decision}

Score:
${input.score}/100

Editorial reason:
${input.reason}

Key insight:
${input.keyInsight ?? "None"}

This memory represents a previous AutoScribe
editorial decision and should be considered
when evaluating related topics in the future.
`;

        return writeBreethMemory({
            content,
            groupId: this.groupId,
        });
    }

    async searchEditorialMemory(
        input: SearchEditorialMemoryInput,
    ): Promise<MemorySearchResult> {
        const query = `
Find previous AutoScribe editorial decisions
related to this topic.

Title:
${input.topicTitle}

Summary:
${input.topicSummary ?? "Not provided"}

URL:
${input.topicUrl ?? "Not provided"}

Look for:
- previously evaluated topics
- previously published topics
- similar technical developments
- repeated stories
- related editorial decisions
- previous rejection reasons
- previous key insights
`;

        return searchBreethMemory({
            query,
            groupId: this.groupId,
            limit: 5,
        });
    }

    async rememberPublishedPost(
        input: {
            topicTitle: string;
            topicUrl: string;
            postText: string;
            rationale: string;
            sources: string[];
        },
    ): Promise<MemoryWriteResult> {
        const content = `
AutoScribe published post.

Topic:
${input.topicTitle}

Topic URL:
${input.topicUrl}

Post:
${input.postText}

Rationale:
${input.rationale}

Sources:
${input.sources.join("\n")}

This content has already been published by
AutoScribe and should be considered when
evaluating future topics to avoid unnecessary
repetition.
`;

        return writeBreethMemory({
            content,
            groupId: this.groupId,
        });
    }
    async searchPublishedMemory(
  input: {
    topicTitle: string;
    topicUrl?: string;
  },
): Promise<MemorySearchResult> {
  const query = `
Find AutoScribe publications that may represent the same
underlying technical development as the current topic.

CURRENT TOPIC

Title:
${input.topicTitle}

URL:
${input.topicUrl ?? "Not provided"}

Search specifically for:

- the same company
- the same product
- the same repository
- the same paper
- the same project
- the same release
- the same technical development
- the same announcement
- the same underlying event
- alternative titles describing the same development
- previously published coverage of this development

Prioritize semantic similarity to the CURRENT TOPIC.

Do NOT return unrelated AI, LLM, agent, robotics, or developer
topics merely because they share technology keywords.

Only return previous AutoScribe publication memories that could
help determine whether the CURRENT TOPIC has already been covered.

The purpose of this search is duplicate-publication detection.
`;

  return searchBreethMemory({
    query,
    groupId: this.groupId,
    limit: 10,
  });
}
}

export const memoryService =
    new MemoryService();