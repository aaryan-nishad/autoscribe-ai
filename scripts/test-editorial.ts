import {
  discoverTopics,
} from "../services/discovery";

import {
  scoreTopic,
} from "../services/editorial";

async function main() {
  console.log(
    "========================================",
  );

  console.log(
    "AutoScribe AI — Editorial Engine Test",
  );

  console.log(
    "========================================",
  );

  const discovery =
    await discoverTopics();

  console.log(
    `\nDiscovered ${discovery.uniqueCandidateCount} unique candidates.`,
  );

  const scored =
    discovery.candidates.map(
      (topic) => ({
        topic,
        score:
          scoreTopic(topic),
      }),
    );

  const selected =
    scored.filter(
      (item) =>
        item.score.decision ===
        "SELECT",
    );

  const rejected =
    scored.filter(
      (item) =>
        item.score.decision ===
        "REJECT",
    );

  console.log(
    `Selected: ${selected.length}`,
  );

  console.log(
    `Rejected: ${rejected.length}`,
  );

  console.log(
    "\nTop selected topics:",
  );

  console.dir(
    selected
      .sort(
        (a, b) =>
          b.score.totalScore -
          a.score.totalScore,
      )
      .slice(0, 10)
      .map(
        (item) => ({
          title:
            item.topic.title,

          source:
            item.topic.sourceName,

          score:
            item.score.totalScore,

          decision:
            item.score.decision,

          reason:
            item.score.reason,
        }),
      ),
    {
      depth: null,
    },
  );

  console.log(
    "\nSample rejected topics:",
  );

  console.dir(
    rejected
      .slice(0, 10)
      .map(
        (item) => ({
          title:
            item.topic.title,

          source:
            item.topic.sourceName,

          score:
            item.score.totalScore,

          decision:
            item.score.decision,

          reason:
            item.score.reason,
        }),
      ),
    {
      depth: null,
    },
  );
}

main().catch(
  (error) => {
    console.error(
      "Editorial test failed:",
      error,
    );

    process.exitCode = 1;
  },
);