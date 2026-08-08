import { githubSource } from "./github";
import { hackerNewsSource } from "./hackernews";
import type { TopicSource } from "./types";

/**
 * All currently enabled live topic sources.
 */
export const topicSources: TopicSource[] = [
  hackerNewsSource,
  githubSource,
];