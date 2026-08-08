import {
  topicSources,
} from "../sources";

import type {
  TopicCandidate,
  TopicSource,
} from "../sources/types";

import type {
  DiscoveryResult,
} from "./types";

/**
 * Normalize a URL so that small URL differences do not
 * create duplicate topics.
 */
function normalizeUrl(
  url: string,
): string {
  try {
    const parsed = new URL(url);

    parsed.hash = "";

    /**
     * Remove common tracking parameters.
     */
    const trackingParameters = [
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_term",
      "utm_content",
      "ref",
      "source",
    ];

    for (
      const parameter of trackingParameters
    ) {
      parsed.searchParams.delete(
        parameter,
      );
    }

    return parsed.toString();
  } catch {
    return url.trim();
  }
}

/**
 * Normalize a candidate before it enters the
 * unified discovery pipeline.
 */
function normalizeCandidate(
  candidate: TopicCandidate,
): TopicCandidate {
  return {
    ...candidate,

    title: candidate.title.trim(),

    summary:
      candidate.summary.trim(),

    sourceName:
      candidate.sourceName.trim(),

    sourceUrl:
      candidate.sourceUrl.trim(),

    url: normalizeUrl(
      candidate.url,
    ),
  };
}

/**
 * Remove duplicate candidates.
 *
 * The canonical URL is the primary identity of a discovered
 * topic. This prevents the same article/project/paper from
 * appearing multiple times.
 */
function deduplicateCandidates(
  candidates: TopicCandidate[],
): TopicCandidate[] {
  const uniqueCandidates =
    new Map<
      string,
      TopicCandidate
    >();

  for (
    const candidate of candidates
  ) {
    const normalizedUrl =
      normalizeUrl(candidate.url);

    /**
     * Keep the first candidate encountered.
     *
     * The source registry order determines which source
     * representation is retained when multiple sources
     * point to exactly the same URL.
     */
    if (
      !uniqueCandidates.has(
        normalizedUrl,
      )
    ) {
      uniqueCandidates.set(
        normalizedUrl,
        {
          ...candidate,
          url: normalizedUrl,
        },
      );
    }
  }

  return Array.from(
    uniqueCandidates.values(),
  );
}

/**
 * Sort candidates by freshness.
 *
 * Candidates without a publication date are placed after
 * candidates that have a valid date.
 */
function sortByFreshness(
  candidates: TopicCandidate[],
): TopicCandidate[] {
  return [...candidates].sort(
    (a, b) => {
      const aTime =
        a.publishedDate?.getTime() ??
        0;

      const bTime =
        b.publishedDate?.getTime() ??
        0;

      return bTime - aTime;
    },
  );
}

/**
 * Run a single source safely.
 *
 * One failing source must never prevent the remaining
 * sources from running.
 */
async function runSource(
  source: TopicSource,
): Promise<{
  source: TopicSource;
  candidates: TopicCandidate[];
  error?: unknown;
}> {
  try {
    const candidates =
      await source.discover();

    return {
      source,
      candidates,
    };
  } catch (error) {
    return {
      source,
      candidates: [],
      error,
    };
  }
}

/**
 * Unified discovery engine.
 */
export async function discoverTopics(): Promise<DiscoveryResult> {
  /**
   * Run all enabled sources concurrently.
   *
   * Promise.allSettled-style behavior is achieved by
   * isolating errors inside runSource().
   */
  const results =
    await Promise.all(
      topicSources.map(
        runSource,
      ),
    );

  const successfulResults =
    results.filter(
      (result) =>
        !result.error,
    );

  const failedResults =
    results.filter(
      (result) =>
        result.error,
    );

  const rawCandidates =
    results.flatMap(
      (result) =>
        result.candidates,
    );

  const normalizedCandidates =
    rawCandidates.map(
      normalizeCandidate,
    );

  const uniqueCandidates =
    deduplicateCandidates(
      normalizedCandidates,
    );

  const sortedCandidates =
    sortByFreshness(
      uniqueCandidates,
    );

  return {
    candidates:
      sortedCandidates,

    successfulSources:
      successfulResults.length,

    failedSources:
      failedResults.length,

    failedSourceNames:
      failedResults.map(
        (result) =>
          result.source.name,
      ),

    rawCandidateCount:
      rawCandidates.length,

    uniqueCandidateCount:
      sortedCandidates.length,
  };
}