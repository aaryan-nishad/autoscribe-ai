import {
  discoverTopics,
} from "../services/discovery";

async function main() {
  console.log(
    "========================================",
  );

  console.log(
    "AutoScribe AI — Discovery Engine Test",
  );

  console.log(
    "========================================",
  );

  const startedAt =
    Date.now();

  try {
    const result =
      await discoverTopics();

    const duration =
      Date.now() -
      startedAt;

    console.log(
      "\nDiscovery completed.",
    );

    console.log(
      `Duration: ${duration}ms`,
    );

    console.log(
      `Successful sources: ${result.successfulSources}`,
    );

    console.log(
      `Failed sources: ${result.failedSources}`,
    );

    console.log(
      `Raw candidates: ${result.rawCandidateCount}`,
    );

    console.log(
      `Unique candidates: ${result.uniqueCandidateCount}`,
    );

    if (
      result.failedSourceNames
        .length > 0
    ) {
      console.log(
        "\nFailed sources:",
      );

      for (
        const sourceName of
          result.failedSourceNames
      ) {
        console.log(
          `- ${sourceName}`,
        );
      }
    }

    console.log(
      "\nTop 10 discovered topics:",
    );

    console.dir(
      result.candidates
        .slice(0, 10)
        .map(
          (candidate) => ({
            title:
              candidate.title,

            source:
              candidate.sourceName,

            url:
              candidate.url,

            publishedDate:
              candidate.publishedDate,
          }),
        ),
      {
        depth: null,
      },
    );
  } catch (error) {
    console.error(
      "\nDiscovery engine failed:",
    );

    console.error(error);

    process.exitCode = 1;
  }
}

main();