import { hackerNewsSource } from "./hackernews";
import type { TopicSource } from "./types";

/**
 * All currently enabled live topic sources.
 *
 * Additional connectors will be added here as they are implemented.
 */
export const topicSources: TopicSource[] = [
  hackerNewsSource,
];