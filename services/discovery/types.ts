import type { TopicCandidate } from "../sources/types";

/**
 * Result returned by the unified discovery engine.
 */
export interface DiscoveryResult {
  candidates: TopicCandidate[];

  /**
   * Number of sources that successfully returned data.
   */
  successfulSources: number;

  /**
   * Number of sources that failed.
   */
  failedSources: number;

  /**
   * Names of sources that failed during discovery.
   */
  failedSourceNames: string[];

  /**
   * Total number of candidates received before
   * deduplication.
   */
  rawCandidateCount: number;

  /**
   * Number of candidates remaining after deduplication.
   */
  uniqueCandidateCount: number;
}