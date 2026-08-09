import "dotenv/config";

import { prisma } from "../lib/prisma";
import { reviewTopicWithAI } from "../services/editorial";

async function main() {
    console.log(
        "# AutoScribe AI — Real Published Topic Duplicate Test\n",
    );

    /*
     * Find the most recently published topic.
     */
    const publishedPost =
        await prisma.publishedPost.findFirst({
            orderBy: {
                publishedAt: "desc",
            },
            include: {
                topic: true,
            },
        });

    if (!publishedPost) {
        throw new Error(
            "No published post exists in PostgreSQL. Run the autonomous agent first.",
        );
    }

    const topic =
        publishedPost.topic;

    console.log(
        "Testing the most recently published topic:",
    );

    console.log(
        `Title: ${topic.title}`,
    );

    console.log(
        `URL: ${topic.url}`,
    );

    console.log(
        `Published at: ${publishedPost.publishedAt.toISOString()}`,
    );

    console.log(
        "\nRunning editorial review...",
    );

    const review =
        await reviewTopicWithAI({
            title: topic.title,
            summary: topic.summary,
            sourceName: topic.sourceName,
            sourceUrl: topic.sourceUrl,
            url: topic.url,
            publishedDate:
                topic.publishedDate ?? undefined,
        });

    console.dir(
        review,
        {
            depth: null,
        },
    );

    if (
        review.decision === "REJECT" &&
        review.score === 0
    ) {
        console.log(
            "\nPASS: Real previously published topic was rejected.",
        );
    } else {
        console.error(
            "\nFAIL: Real previously published topic was not rejected as an exact duplicate.",
        );

        process.exitCode = 1;
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