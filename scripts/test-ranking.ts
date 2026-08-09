import {
  discoverTopics,
} from "../services/discovery";

import {
  rankAndSelectCandidates,
} from "../services/editorial/candidate-ranker";

async function main() {
  console.log(
    "# AutoScribe AI — Candidate Ranking Test\n",
  );

  console.log(
    "Running discovery...",
  );

  const discovery =
    await discoverTopics();

  console.log(
    `Discovered ${discovery.uniqueCandidateCount} unique candidates.`,
  );

  const selected =
    rankAndSelectCandidates(
      discovery.candidates,
      5,
    );

  console.log(
    "\nSelected candidates:",
  );

  for (
    const [index, candidate] of selected.entries()
  ) {
    console.log(
      `\n${index + 1}. ${candidate.topic.title}`,
    );

    console.log(
      `   Source: ${candidate.topic.sourceName}`,
    );

    console.log(
      `   Score: ${candidate.score.totalScore}`,
    );

    console.log(
      `   Decision: ${candidate.score.decision}`,
    );

    console.log(
      `   Reason: ${candidate.score.reason}`,
    );
  }

  console.log(
    "\nSource distribution:",
  );

  const distribution =
    new Map<string, number>();

  for (const candidate of selected) {
    const source =
      candidate.topic.sourceName;

    distribution.set(
      source,
      (distribution.get(source) ?? 0) + 1,
    );
  }

  for (
    const [source, count] of distribution
  ) {
    console.log(
      `   ${source}: ${count}`,
    );
  }
}

main().catch((error) => {
  console.error(
    "\nRanking test FAILED.",
  );

  console.error(error);

  process.exit(1);
});