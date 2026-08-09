import type { TopicCandidate } from "../sources/types";

import {
  scoreTopic,
} from "./scorer";

export interface RankedCandidate {
  topic: TopicCandidate;
  score: ReturnType<typeof scoreTopic>;
}

/**
 * Rank discovered topics using the deterministic
 * editorial scorer.
 */
export function rankCandidates(
  candidates: TopicCandidate[],
): RankedCandidate[] {
  return candidates
    .map((topic) => ({
      topic,
      score: scoreTopic(topic),
    }))
    .sort(
      (a, b) =>
        b.score.totalScore -
        a.score.totalScore,
    );
}

/**
 * Select candidates while maintaining source diversity.
 *
 * The algorithm first gives each configured source
 * a chance to contribute its strongest candidate.
 *
 * Remaining slots are then filled by global score.
 */
export function selectDiverseCandidates(
  rankedCandidates: RankedCandidate[],
  limit = 5,
): RankedCandidate[] {
  if (limit <= 0) {
    return [];
  }

  const selected: RankedCandidate[] = [];

  const selectedUrls =
    new Set<string>();

  /**
   * Group candidates by source.
   */
  const bySource =
    new Map<
      string,
      RankedCandidate[]
    >();

  for (const candidate of rankedCandidates) {
    const source =
      candidate.topic.sourceName;

    const existing =
      bySource.get(source) ?? [];

    existing.push(candidate);

    bySource.set(
      source,
      existing,
    );
  }

  /**
   * Every source group is already globally
   * sorted because rankedCandidates is sorted.
   *
   * Give each source its strongest candidate first.
   */
  const sourceLeaders =
    Array.from(
      bySource.entries(),
    )
      .map(
        ([source, candidates]) => ({
          source,
          candidate:
            candidates[0],
        }),
      )
      .sort(
        (a, b) =>
          b.candidate.score.totalScore -
          a.candidate.score.totalScore,
      );

  for (const entry of sourceLeaders) {
    if (
      selected.length >= limit
    ) {
      break;
    }

    const candidate =
      entry.candidate;

    /**
     * Never select a candidate rejected
     * by the deterministic policy.
     */
    if (
      candidate.score.decision !==
      "SELECT"
    ) {
      continue;
    }

    if (
      selectedUrls.has(
        candidate.topic.url,
      )
    ) {
      continue;
    }

    selected.push(candidate);

    selectedUrls.add(
      candidate.topic.url,
    );
  }

  /**
   * Fill remaining slots using the highest
   * scoring candidates regardless of source.
   */
  for (const candidate of rankedCandidates) {
    if (
      selected.length >= limit
    ) {
      break;
    }

    if (
      candidate.score.decision !==
      "SELECT"
    ) {
      continue;
    }

    if (
      selectedUrls.has(
        candidate.topic.url,
      )
    ) {
      continue;
    }

    selected.push(candidate);

    selectedUrls.add(
      candidate.topic.url,
    );
  }

  return selected;
}

/**
 * Convenience function used by the autonomous
 * execution pipeline.
 */
export function rankAndSelectCandidates(
  candidates: TopicCandidate[],
  limit = 5,
): RankedCandidate[] {
  const ranked =
    rankCandidates(
      candidates,
    );

  return selectDiverseCandidates(
    ranked,
    limit,
  );
}