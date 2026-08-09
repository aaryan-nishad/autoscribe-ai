import "dotenv/config";

import { reviewTopicWithAI } from "../services/editorial";
import type { TopicCandidate } from "../services/sources/types";

async function main() {
    console.log(
        "# AutoScribe AI — Meaningful New Development Test",
    );

    const candidate: TopicCandidate = {
        title:
            "Cloudflare releases a major new Kitesurf architecture with benchmarked multi-agent browser execution",

        summary:
            "Cloudflare has released a major architectural update to Kitesurf introducing a new multi-agent browser execution architecture, along with new benchmark results demonstrating substantially improved execution efficiency and scalability for autonomous AI agents.",

        sourceName:
            "Test Source",

        sourceUrl:
            "https://example.com/cloudflare-kitesurf-major-update",

        url:
            "https://example.com/cloudflare-kitesurf-major-update",

        publishedDate:
            new Date(),
    };

    console.log(
        "\nTesting meaningful new development:",
    );

    console.log(
        `Title: ${candidate.title}`,
    );

    console.log(
        `URL: ${candidate.url}`,
    );

    console.log(
        "\nRunning editorial review...",
    );

    const review =
        await reviewTopicWithAI(
            candidate,
        );

    console.dir(
        review,
        {
            depth: null,
        },
    );

    if (
        review.decision === "SELECT"
    ) {
        console.log(
            "\nPASS: Meaningful new development was allowed through.",
        );
        return;
    }

    console.error(
        "\nFAIL: Meaningful new development was rejected.",
    );

    process.exitCode = 1;
}

main().catch((error) => {
    console.error(
        "\nTest failed:",
        error,
    );

    process.exit(1);
});