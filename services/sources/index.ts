import type { TopicSource } from "./types";

/**
 * Registry of all enabled topic discovery sources.
 *
 * New sources will be added here as they are implemented.
 *
 * Example:
 *
 * export const topicSources: TopicSource[] = [
 *   hackerNewsSource,
 *   githubSource,
 *   arxivSource,
 * ];
 */
export const topicSources: TopicSource[] = [];