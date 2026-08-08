/**
 * Represents a normalized topic discovered from an external source.
 *
 * Every source connector must convert its raw response into
 * this common structure before passing it to the discovery engine.
 */
export interface TopicCandidate {
  /**
   * Title of the discovered article/story.
   */
  title: string;

  /**
   * Short description or summary of the topic.
   */
  summary: string;

  /**
   * Human-readable name of the source.
   *
   * Examples:
   * - Hacker News
   * - GitHub
   * - arXiv
   */
  sourceName: string;

  /**
   * URL of the source/platform from which the topic was discovered.
   */
   sourceUrl: string;

  /**
   * Canonical URL of the actual article, project, paper, etc.
   */
  url: string;

  /**
   * Original publication date, when available.
   */
  publishedDate?: Date;
}

/**
 * Contract that every live information source must implement.
 *
 * The discovery engine interacts with sources only through
 * this interface and does not contain source-specific logic.
 */
export interface TopicSource {
  /**
   * Unique human-readable source name.
   */
  name: string;

  /**
   * Discover current AI/technology topics from the source.
   */
  discover(): Promise<TopicCandidate[]>;
}