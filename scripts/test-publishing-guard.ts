import "dotenv/config";

import { prisma } from "../lib/prisma";
import { publishCandidate } from "../services/publishing";

async function main() {
    console.log(
        "# AutoScribe AI — Publishing Guard Test\n",
    );

    const agent =
        await prisma.agent.findFirst({
            where: {
                name: "AutoScribe",
            },
        });

    if (!agent) {
        throw new Error(
            "AutoScribe agent not found.",
        );
    }

    /*
     * Create an isolated test topic.
     */
    const topic =
        await prisma.topic.create({
            data: {
                title:
                    "AutoScribe Publishing Guard Test Topic",

                url:
                    `https://example.com/publishing-guard-test-${Date.now()}`,

                sourceName:
                    "Publishing Guard Test",

                sourceUrl:
                    "https://example.com/publishing-guard-test",

                summary:
                    "Synthetic topic used to verify that rejected candidates cannot be published.",

                agentId:
                    agent.id,
            },
        });

    let candidateId: string | null = null;

    try {
        /*
         * Create a deliberately REJECTED candidate.
         */
        const candidate =
            await prisma.candidatePost.create({
                data: {
                    draft:
                        "This is a synthetic rejected draft used to test the publishing guard.",

                    review:
                        JSON.stringify({
                            decision: "REJECT",
                            score: 20,
                            reason:
                                "Synthetic rejection for publishing guard test.",
                        }),

                    qualityScore: 20,

                    status: "REJECTED",

                    topicId:
                        topic.id,

                    agentId:
                        agent.id,
                },
            });

        candidateId = candidate.id;

        console.log(
            "Created rejected candidate:",
            candidate.id,
        );

        console.log(
            "Candidate status:",
            candidate.status,
        );

        console.log(
            "\nAttempting to publish rejected candidate...",
        );

        let guardTriggered = false;

        try {
            await publishCandidate({
                candidateId:
                    candidate.id,
            });
        } catch (error) {
            guardTriggered = true;

            console.log(
                "\nExpected publication error:",
            );

            console.log(
                error instanceof Error
                    ? error.message
                    : String(error),
            );
        }

        if (!guardTriggered) {
            console.error(
                "\nFAIL: Rejected candidate was allowed into the publishing service.",
            );

            process.exitCode = 1;
            return;
        }

        /*
         * Verify that no PublishedPost was created.
         */
        const publishedPost =
            await prisma.publishedPost.findUnique({
                where: {
                    topicId:
                        topic.id,
                },
            });

        if (publishedPost) {
            console.error(
                "\nFAIL: A PublishedPost exists for the rejected candidate.",
            );

            process.exitCode = 1;
            return;
        }

        console.log(
            "\nPASS: Rejected candidate was blocked by the publishing guard.",
        );

        console.log(
            "PASS: No PublishedPost was created.",
        );
    } finally {
        /*
         * Clean up the synthetic test data.
         */
        if (candidateId) {
            await prisma.candidatePost.delete({
                where: {
                    id: candidateId,
                },
            });
        }

        await prisma.topic.delete({
            where: {
                id: topic.id,
            },
        });

        console.log(
            "\nTest data cleaned up.",
        );
    }
}

main()
    .catch((error) => {
        console.error(
            "\nTest failed:",
            error,
        );

        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });