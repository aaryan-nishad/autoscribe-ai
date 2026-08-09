import "dotenv/config";

import { reviewTopicWithAI } from "../services/editorial";
import type { TopicCandidate } from "../services/sources/types";

async function main() {
    console.log(
        "# AutoScribe AI — Semantic Duplicate Test",
    );

    const candidate: TopicCandidate = {
        title:
            "Cloudflare introduces Kitesurf, a browser designed specifically for autonomous AI agents",

        summary:
            "Cloudflare has introduced Kitesurf, a browser built specifically for AI agents, providing purpose-built browser infrastructure for autonomous agent workflows.",

        sourceName:
            "Test Source",

        sourceUrl:
            "https://example.com/cloudflare-kitesurf-test",

        url:
            "https://example.com/cloudflare-kitesurf-test",

        publishedDate:
            new Date(),
    };

    console.log(
        "\nTesting semantically duplicate topic:",
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
        review.decision === "REJECT" &&
        review.score === 0
    ) {
        console.log(
            "\nPASS: Semantic duplicate was rejected.",
        );
        return;
    }

    console.error(
        "\nFAIL: Semantic duplicate was not rejected.",
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