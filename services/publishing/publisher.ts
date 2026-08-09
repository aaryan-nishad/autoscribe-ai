import { prisma } from "../../lib/prisma";

import {
    memoryService,
} from "../memory";

export interface PublishCandidateInput {
    candidateId: string;
}

export interface PublishResult {
    published: boolean;
    alreadyPublished: boolean;
    postId: string;
}

export async function publishCandidate(
    input: PublishCandidateInput,
): Promise<PublishResult> {
    const { candidateId } = input;

    /*
     * Load the candidate and its related topic.
     */
    const candidate =
        await prisma.candidatePost.findUnique({
            where: {
                id: candidateId,
            },

            include: {
                topic: true,
            },
        });

    if (!candidate) {
        throw new Error(
            `CandidatePost not found: ${candidateId}`,
        );
    }

    /*
     * Only APPROVED candidates can be published.
     */
    if (candidate.status !== "APPROVED") {
        throw new Error(
            `CandidatePost ${candidateId} cannot be published because its status is ${candidate.status}.`,
        );
    }

    /*
     * Check whether this topic has already been published.
     *
     * topicId is unique on PublishedPost, so a topic can
     * only produce one published post.
     */
    const existingPost =
        await prisma.publishedPost.findUnique({
            where: {
                topicId: candidate.topicId,
            },
        });

    if (existingPost) {
        return {
            published: false,
            alreadyPublished: true,
            postId: existingPost.id,
        };
    }

    /*
     * The candidate review contains the editorial/quality
     * information generated during the previous stages.
     *
     * We preserve that information in the publication
     * rationale so the final feed remains transparent.
     */
    let review: {
        reason?: string;
        keyInsight?: string | null;
        qualityReason?: string;
    } = {};

    if (candidate.review) {
        try {
            review = JSON.parse(candidate.review);
        } catch {
            /*
             * A malformed review should not prevent publication.
             * The original generated draft remains the source of
             * truth for the post.
             */
            review = {};
        }
    }

    const rationaleParts: string[] = [];

    if (review.reason) {
        rationaleParts.push(
            `Editorial selection: ${review.reason}`,
        );
    }

    if (review.qualityReason) {
        rationaleParts.push(
            `Quality review: ${review.qualityReason}`,
        );
    }

    if (
        review.keyInsight
    ) {
        rationaleParts.push(
            `Key insight: ${review.keyInsight}`,
        );
    }

    if (
        rationaleParts.length === 0
    ) {
        rationaleParts.push(
            "Selected by the AutoScribe autonomous editorial pipeline after passing editorial and quality review.",
        );
    }

    const rationale =
        rationaleParts.join("\n\n");

    /*
     * Persist the publication atomically.
     *
     * These database changes must either all succeed
     * or all fail:
     *
     * CandidatePost remains APPROVED
     * Topic becomes PUBLISHED
     * PublishedPost is created
     */
    try {
        const result =
            await prisma.$transaction(
                async (tx) => {
                    /*
                     * Re-check inside the transaction to reduce
                     * the possibility of duplicate publication.
                     */
                    const existing =
                        await tx.publishedPost.findUnique({
                            where: {
                                topicId:
                                    candidate.topicId,
                            },
                        });

                    if (existing) {
                        return {
                            created: false,
                            postId: existing.id,
                        };
                    }

                    const publishedPost =
                        await tx.publishedPost.create({
                            data: {
                                text:
                                    candidate.draft,

                                rationale,

                                sources: [
                                    candidate.topic.url,
                                ],

                                candidateId:
                                    candidate.id,

                                topicId:
                                    candidate.topicId,

                                agentId:
                                    candidate.agentId,
                            },
                        });

                    await tx.topic.update({
                        where: {
                            id:
                                candidate.topicId,
                        },

                        data: {
                            status:
                                "PUBLISHED",
                        },
                    });

                    /*
                     * CandidatePost remains APPROVED.
                     *
                     * APPROVED represents the quality-gate result,
                     * while Topic.PUBLISHED represents publication
                     * state.
                     */
                    return {
                        created: true,
                        postId:
                            publishedPost.id,
                    };
                },
            );

        if (result.created) {
            try {
                await memoryService.rememberPublishedPost({
                    topicTitle:
                        candidate.topic.title,

                    topicUrl:
                        candidate.topic.url,

                    postText:
                        candidate.draft,

                    rationale,

                    sources: [
                        candidate.topic.url,
                    ],
                });
            } catch (error) {
                /*
                 * Publication has already succeeded.
                 *
                 * A Breeth failure must not turn a successful
                 * publication into a failed autonomous run.
                 */
                console.error(
                    "Warning: failed to persist published post to Breeth.",
                    error,
                );
            }
        }

        return {
            published:
                result.created,

            alreadyPublished:
                !result.created,

            postId:
                result.postId,
        };
    } catch (error: unknown) {
        /*
         * topicId is unique on PublishedPost.
         *
         * If another scheduler invocation published the same
         * topic concurrently, PostgreSQL may raise a unique
         * constraint error.
         *
         * In that case, retrieve the already-created post and
         * report the operation as idempotent.
         */
        const errorCode =
            typeof error === "object" &&
                error !== null &&
                "code" in error
                ? String(
                    (
                        error as {
                            code?: unknown;
                        }
                    ).code,
                )
                : null;

        if (errorCode === "P2002") {
            const existing =
                await prisma.publishedPost.findUnique({
                    where: {
                        topicId:
                            candidate.topicId,
                    },
                });

            if (existing) {
                return {
                    published: false,
                    alreadyPublished: true,
                    postId: existing.id,
                };
            }
        }

        throw error;
    }
}