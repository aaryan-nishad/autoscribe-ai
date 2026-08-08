import type { TopicCandidate, TopicSource } from "./types";

const HACKER_NEWS_API =
  "https://hacker-news.firebaseio.com/v0";

const HACKER_NEWS_WEBSITE =
  "https://news.ycombinator.com";

const MAX_STORIES_TO_FETCH = 30;

/**
 * Keywords used only for initial topic discovery.
 *
 * This is NOT the final editorial filter.
 * The Editorial Engine will make the actual publishing decision.
 */
const TECHNOLOGY_KEYWORDS = [
  "ai",
  "artificial intelligence",
  "machine learning",
  "deep learning",
  "llm",
  "large language model",
  "generative ai",
  "generative artificial intelligence",
  "gpt",
  "openai",
  "anthropic",
  "claude",
  "gemini",
  "deepmind",
  "mistral",
  "llama",
  "hugging face",
  "huggingface",
  "neural network",
  "neural networks",
  "robotics",
  "robot",
  "autonomous",
  "agentic",
  "ai agent",
  "ai agents",
  "computer vision",
  "nlp",
  "natural language processing",
  "reinforcement learning",
  "inference",
  "fine-tuning",
  "fine tuning",
  "transformer",
  "transformers",
  "diffusion model",
  "diffusion models",
  "gpu",
  "cuda",
  "nvidia",
  "amd",
  "semiconductor",
  "chip",
  "chips",
  "developer tools",
  "programming",
  "software",
  "open source",
  "opensource",
  "github",
  "database",
  "cloud computing",
  "cybersecurity",
  "cyber security",
  "quantum computing",
  "web development",
  "developer",
  "developers",
];

/**
 * Minimal representation of a Hacker News item.
 *
 * Hacker News returns many optional fields, so we only model
 * the fields that this connector actually needs.
 */
interface HackerNewsItem {
  id: number;
  type?: string;
  title?: string;
  url?: string;
  text?: string;
  time?: number;
  score?: number;
  dead?: boolean;
  deleted?: boolean;
}

/**
 * Fetch JSON with a timeout.
 *
 * A discovery source must not hang the autonomous publishing
 * pipeline indefinitely if an external API becomes unavailable.
 */
async function fetchJson<T>(
  url: string,
  timeoutMs = 10_000,
): Promise<T> {
  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "User-Agent": "AutoScribe-AI/1.0",
      },
      signal: controller.signal,
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(
        `Hacker News request failed: ${response.status} ${response.statusText}`,
      );
    }

    return (await response.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Determine whether a story appears relevant to AI or technology.
 *
 * Discovery uses a broad filter so that potentially valuable topics
 * are not lost. The editorial engine will perform stricter judgment.
 */
function isTechnologyTopic(item: HackerNewsItem): boolean {
  const searchableText = [
    item.title ?? "",
    item.text ?? "",
    item.url ?? "",
  ]
    .join(" ")
    .toLowerCase();

  return TECHNOLOGY_KEYWORDS.some((keyword) =>
    searchableText.includes(keyword),
  );
}

/**
 * Convert a Unix timestamp from Hacker News into a JavaScript Date.
 */
function convertTimestamp(timestamp?: number): Date | undefined {
  if (!timestamp) {
    return undefined;
  }

  const date = new Date(timestamp * 1000);

  return Number.isNaN(date.getTime()) ? undefined : date;
}

/**
 * Convert a Hacker News item into our common TopicCandidate format.
 */
function normalizeStory(item: HackerNewsItem): TopicCandidate | null {
  if (!item.title || !item.id) {
    return null;
  }

  const storyUrl =
    item.url ?? `${HACKER_NEWS_WEBSITE}/item?id=${item.id}`;

  const summary =
    item.text?.replace(/<[^>]*>/g, "").trim() ||
    `Hacker News story: ${item.title}`;

  return {
    title: item.title.trim(),

    summary,

    sourceName: "Hacker News",

    sourceUrl: `${HACKER_NEWS_WEBSITE}/item?id=${item.id}`,

    url: storyUrl,

    publishedDate: convertTimestamp(item.time),
  };
}

/**
 * Fetch a list of story IDs and then retrieve their details.
 */
async function fetchStories(
  endpoint: "topstories" | "newstories",
): Promise<HackerNewsItem[]> {
  const ids = await fetchJson<number[]>(
    `${HACKER_NEWS_API}/${endpoint}.json`,
  );

  const selectedIds = ids.slice(0, MAX_STORIES_TO_FETCH);

  const results = await Promise.all(
    selectedIds.map(async (id) => {
      try {
        return await fetchJson<HackerNewsItem>(
          `${HACKER_NEWS_API}/item/${id}.json`,
        );
      } catch {
        // A single failed item should not break the entire source.
        return null;
      }
    }),
  );

  return results.filter(
    (item): item is HackerNewsItem =>
      item !== null &&
      item.type === "story" &&
      !item.deleted &&
      !item.dead,
  );
}

/**
 * Hacker News topic discovery source.
 */
export const hackerNewsSource: TopicSource = {
  name: "Hacker News",

  async discover(): Promise<TopicCandidate[]> {
    const [topStories, newStories] = await Promise.all([
      fetchStories("topstories"),
      fetchStories("newstories"),
    ]);

    /**
     * Combine top and new stories.
     *
     * The same story can appear in both lists, so use a Map
     * keyed by Hacker News item ID for deduplication.
     */
    const uniqueStories = new Map<number, HackerNewsItem>();

    for (const story of [...topStories, ...newStories]) {
      uniqueStories.set(story.id, story);
    }

    const candidates: TopicCandidate[] = [];

    for (const story of uniqueStories.values()) {
      if (!isTechnologyTopic(story)) {
        continue;
      }

      const candidate = normalizeStory(story);

      if (candidate) {
        candidates.push(candidate);
      }
    }

    /**
     * Newest topics first.
     */
    candidates.sort((a, b) => {
      const aTime = a.publishedDate?.getTime() ?? 0;
      const bTime = b.publishedDate?.getTime() ?? 0;

      return bTime - aTime;
    });

    return candidates;
  },
};