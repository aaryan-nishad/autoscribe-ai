import { NextResponse } from "next/server";

import { initializeAgent } from "../../../../services/agent/agent-service";
import { discoverTopics } from "../../../../services/discovery";
import {
    reviewTopicWithAI,
    rankAndSelectCandidates,
} from "../../../../services/editorial";

import {
    generatePost,
    reviewGeneratedPost,
    saveCandidatePost,
    publishCandidate,
} from "../../../../services/publishing";

import { memoryService } from "../../../../services/memory";

import { prisma } from "../../../../lib/prisma";

const MAX_CANDIDATES = 8;

export async function POST() {
    const startedAt = Date.now();

    try {
        /*
         * 1. Initialize / load AutoScribe.
         */
        const agent = await initializeAgent();

        const runWarnings: string[] = [];

        /*
         * 2. Discover topics from all configured sources.
         */
        const discovery = await discoverTopics();

        if (discovery.failedSources > 0) {
            runWarnings.push(
                `Failed discovery sources: ${discovery.failedSourceNames.join(", ")}`,
            );
        }

        const rankedCandidates =
            rankAndSelectCandidates(
                discovery.candidates,
                MAX_CANDIDATES,
            );

        const candidates =
            rankedCandidates.map(
                (candidate) =>
                    candidate.topic,
            );

        const results = [];

        /*
         * Only one candidate may be published
         * during a single autonomous run.
         *
         * We still review all selected candidates so
         * the agent can exercise editorial judgment.
         */
        let hasPublished = false;

        console.log(
            "\nAutoScribe candidate ranking:",
        );

        for (
            const candidate of rankedCandidates
        ) {
            console.log(
                `${candidate.score.totalScore}/100 | ` +
                `${candidate.topic.sourceName} | ` +
                candidate.topic.title,
            );
        }

        /*
         * 3. Process candidates sequentially.
         *
         * Sequential processing is intentional for now:
         * - easier debugging
         * - easier Breeth memory handling
         * - avoids unnecessary Gemini/API concurrency
         */
        for (const topic of candidates) {
            try {
                /*
                 * 3A. Editorial AI review.
                 */
                const editorialReview =
                    await reviewTopicWithAI(topic);

                /*
                 * If editorial review rejects the topic,
                 * move to the next candidate.
                 */
                if (
                    editorialReview.decision !== "SELECT"
                ) {
                    results.push({
                        title: topic.title,
                        source: topic.sourceName,
                        decision: "REJECTED",
                        score: editorialReview.score,
                    });

                    continue;
                }

                /*
                 * 3B. Persist Topic.
                 *
                 * agentId + url is the canonical Topic identity.
                 */
                const databaseTopic =
                    await prisma.topic.upsert({
                        where: {
                            agentId_url: {
                                agentId: agent.id,
                                url: topic.url,
                            },
                        },

                        update: {
                            title: topic.title,
                            summary: topic.summary,
                            sourceName: topic.sourceName,
                            sourceUrl: topic.sourceUrl,
                            publishedDate:
                                topic.publishedDate,
                        },

                        create: {
                            title: topic.title,
                            summary: topic.summary,
                            url: topic.url,
                            sourceName: topic.sourceName,
                            sourceUrl: topic.sourceUrl,
                            publishedDate:
                                topic.publishedDate,
                            agentId: agent.id,
                        },
                    });

                /*
                 * Keep the variable referenced so the
                 * topic persistence operation remains explicit.
                 */
                void databaseTopic;

                /*
                 * 3C. Generate the post.
                 */
                const generatedPost =
                    await generatePost({
                        topic,
                        editorialDecision:
                            editorialReview,
                    });

                /*
                 * 3D. Quality gate.
                 */
                const qualityReview =
                    await reviewGeneratedPost(
                        topic,
                        generatedPost,
                    );

                /*
                 * 3E. Persist candidate.
                 *
                 * This stores both APPROVED and REJECTED
                 * generated candidates.
                 */
                const candidate =
                    await saveCandidatePost({
                        topic,
                        agentId: agent.id,
                        generatedPost,
                        qualityReview,
                    });

                /*
                 * 3F. Only approved candidates can be published.
                 */
                if (
                    qualityReview.decision !== "APPROVE"
                ) {
                    results.push({
                        title: topic.title,
                        source: topic.sourceName,
                        decision: "QUALITY_REJECTED",
                        editorialScore:
                            editorialReview.score,
                        qualityScore:
                            qualityReview.score,
                        candidateId: candidate.id,
                    });

                    continue;
                }

                /*
                 * Only ONE post may be published per run.
                 *
                 * If an earlier candidate was already published,
                 * this approved candidate is intentionally deferred.
                 */
                if (hasPublished) {
                    results.push({
                        title: topic.title,
                        source: topic.sourceName,
                        decision: "DEFERRED",
                        editorialScore:
                            editorialReview.score,
                        qualityScore:
                            qualityReview.score,
                        candidateId: candidate.id,
                    });

                    continue;
                }

                /*
                 * 3G. Publish.
                 */
                const publication =
                    await publishCandidate({
                        candidateId: candidate.id,
                    });

                if (publication.published) {
                    hasPublished = true;
                }

                /*
                 * 3H. Remember publication in Breeth.
                 *
                 * Memory failure must never undo a successful
                 * database publication.
                 */
                if (publication.published) {
                    try {
                        await memoryService.rememberPublishedPost({
                            topicTitle: topic.title,
                            topicUrl: topic.url,
                            postText: generatedPost.text,
                            rationale: generatedPost.rationale,
                            sources: generatedPost.sources,
                        });
                    } catch (memoryError) {
                        console.warn(
                            "Warning: failed to persist published post to Breeth.",
                            memoryError,
                        );
                    }
                }

                results.push({
                    title: topic.title,
                    source: topic.sourceName,
                    decision: "PUBLISHED",
                    editorialScore:
                        editorialReview.score,
                    qualityScore:
                        qualityReview.score,
                    candidateId: candidate.id,
                    postId: publication.postId,
                    alreadyPublished:
                        publication.alreadyPublished,
                });
            } catch (error) {
                /*
                 * One candidate failing must not kill the
                 * complete autonomous run.
                 */
                console.error(
                    `Failed processing topic: ${topic.title}`,
                    error,
                );

                results.push({
                    title: topic.title,
                    source: topic.sourceName,
                    decision: "ERROR",
                    error:
                        error instanceof Error
                            ? error.message
                            : String(error),
                });
            }
        }

        const publishedCount =
            results.filter(
                (result) =>
                    result.decision === "PUBLISHED",
            ).length;

        const rejectedCount =
            results.filter(
                (result) =>
                    result.decision === "REJECTED" ||
                    result.decision ===
                    "QUALITY_REJECTED",
            ).length;

        const errorCount =
            results.filter(
                (result) =>
                    result.decision === "ERROR",
            ).length;

        return NextResponse.json({
            success: true,

            run: {
                durationMs:
                    Date.now() - startedAt,

                agent: {
                    id: agent.id,
                    name: agent.name,
                },

                discovery: {
                    successfulSources:
                        discovery.successfulSources,

                    failedSources:
                        discovery.failedSources,

                    rawCandidates:
                        discovery.rawCandidateCount,

                    uniqueCandidates:
                        discovery.uniqueCandidateCount,

                    evaluatedCandidates:
                        candidates.length,
                },

                results,

                summary: {
                    published:
                        publishedCount,

                    rejected:
                        rejectedCount,

                    errors:
                        errorCount,

                    warnings:
                        runWarnings,
                },
            },
        });
    } catch (error) {
        console.error(
            "AutoScribe run failed:",
            error,
        );

        return NextResponse.json(
            {
                success: false,
                error:
                    error instanceof Error
                        ? error.message
                        : String(error),

                errorType:
                    error instanceof Error
                        ? error.name
                        : "UnknownError",
            },
            {
                status: 500,
            },
        );
    }
}