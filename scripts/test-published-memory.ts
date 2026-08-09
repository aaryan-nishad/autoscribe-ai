import "dotenv/config";
import {
    memoryService,
} from "../services/memory";

async function main() {
    console.log(
        "# AutoScribe AI — Published Post Memory Test\n",
    );

    const testTopic = {
        topicTitle:
            "AutoScribe Published Memory Test Topic",

        topicUrl:
            "https://example.com/autoscribe-published-memory-test",

        postText:
            "This is a test publication memory created by AutoScribe.",

        rationale:
            "Testing whether published posts are stored in Breeth.",

        sources: [
            "https://example.com/autoscribe-published-memory-test",
        ],
    };

    console.log(
        "1. Writing published-post memory...",
    );

    const writeResult =
        await memoryService.rememberPublishedPost(
            testTopic,
        );

    console.log(
        "Memory write successful.",
    );

    console.dir(
        writeResult,
        {
            depth: null,
        },
    );

    console.log(
        "\nWaiting for Breeth background processing...",
    );

    await new Promise(
        (resolve) => setTimeout(resolve, 20000),
    );

    console.log(
        "Breeth processing wait completed.",
    );

    console.log(
        "\n2. Searching for the published topic...",
    );

    const searchResult =
    await memoryService.searchPublishedMemory({
        topicTitle:
            testTopic.topicTitle,

        topicUrl:
            testTopic.topicUrl,
    });

    console.log(
        "Memory search successful.",
    );

    console.dir(
        searchResult,
        {
            depth: null,
        },
    );

    console.log(
        "\nRetrieved memory edges:",
        searchResult.results.length,
    );
}

main().catch((error) => {
    console.error(
        "\nPublished memory test failed:",
        error,
    );

    process.exit(1);
});