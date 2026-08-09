import { prisma } from "../../lib/prisma";

import type {
    GeneratedPost,
    PostQualityReview,
} from "./types";

import type {
    TopicCandidate,
} from "../sources/types";

interface SaveCandidateInput {
    topic: TopicCandidate;

    agentId: string;

    generatedPost: GeneratedPost;

    qualityReview: PostQualityReview;
}

export async function saveCandidatePost(
    input: SaveCandidateInput,
) {
    const {
        topic,
        agentId,
        generatedPost,
        qualityReview,
    } = input;

    /*
     * The Topic must exist before CandidatePost can
     * reference it.
     *
     * The production pipeline will eventually create
     * the Topic during the discovery/persistence stage.
     *
     * For now we use the topic URL as the canonical
     * identifier.
     */
    const databaseTopic =
        await prisma.topic.findUnique({
            where: {
                agentId_url: {
                    agentId,
                    url: topic.url,
                },
            },
        });

    if (!databaseTopic) {
        throw new Error(
            `Topic does not exist in PostgreSQL: ${topic.url}`,
        );
    }

    /*
     * CandidatePost is intentionally persisted regardless
     * of approval status.
     *
     * This allows the system to remember rejected drafts
     * and demonstrate editorial transparency.
     */
    const candidate =
    await prisma.candidatePost.upsert({
        where: {
            topicId:
                databaseTopic.id,
        },

        update: {
            draft:
                generatedPost.text,

            review:
                JSON.stringify({
                    decision:
                        qualityReview.decision,

                    score:
                        qualityReview.score,

                    accuracy:
                        qualityReview.accuracy,

                    relevance:
                        qualityReview.relevance,

                    technicalValue:
                        qualityReview.technicalValue,

                    personaFit:
                        qualityReview.personaFit,

                    sourceGrounding:
                        qualityReview.sourceGrounding,

                    originality:
                        qualityReview.originality,

                    clarity:
                        qualityReview.clarity,

                    reason:
                        qualityReview.reason,

                    improvements:
                        qualityReview.improvements,
                }),

            qualityScore:
                qualityReview.score,

            
        },

        create: {
            draft:
                generatedPost.text,

            review:
                JSON.stringify({
                    decision:
                        qualityReview.decision,

                    score:
                        qualityReview.score,

                    accuracy:
                        qualityReview.accuracy,

                    relevance:
                        qualityReview.relevance,

                    technicalValue:
                        qualityReview.technicalValue,

                    personaFit:
                        qualityReview.personaFit,

                    sourceGrounding:
                        qualityReview.sourceGrounding,

                    originality:
                        qualityReview.originality,

                    clarity:
                        qualityReview.clarity,

                    reason:
                        qualityReview.reason,

                    improvements:
                        qualityReview.improvements,
                }),

            qualityScore:
                qualityReview.score,

            status:
                qualityReview.decision ===
                    "APPROVE"
                    ? "APPROVED"
                    : "REJECTED",

            topicId:
                databaseTopic.id,

            agentId,
        },
    });

    return candidate;
}