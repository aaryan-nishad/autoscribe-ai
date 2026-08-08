import type { TopicCandidate, TopicSource } from "./types";

const GITHUB_API = "https://api.github.com";

const MAX_REPOSITORIES_PER_QUERY = 10;

const SEARCH_TERMS = [
  "AI",
  "LLM",
  "machine-learning",
  "generative-AI",
  "AI-agent",
  "robotics",
];

const AI_TECHNOLOGY_TERMS = [
  "ai",
  "artificial-intelligence",
  "machine-learning",
  "deep-learning",
  "llm",
  "large-language-model",
  "generative-ai",
  "agent",
  "agents",
  "ai-agent",
  "computer-vision",
  "natural-language-processing",
  "nlp",
  "robotics",
  "reinforcement-learning",
  "transformer",
  "diffusion",
  "inference",
  "fine-tuning",
  "fine-tuning",
  "rag",
  "retrieval-augmented-generation",
  "developer-tools",
  "developer-tool",
  "open-source",
];

interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  html_url: string;

  description: string | null;

  language: string | null;

  stargazers_count: number;
  forks_count: number;

  created_at: string;
  updated_at: string;

  topics?: string[];

  archived?: boolean;
  fork?: boolean;
}

interface GitHubSearchResponse {
  total_count: number;
  incomplete_results: boolean;
  items: GitHubRepository[];
}

/**
 * Fetch JSON from GitHub with a timeout.
 */
async function fetchGitHub<T>(
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
        Accept: "application/vnd.github+json",
        "User-Agent": "AutoScribe-AI/1.0",
        "X-GitHub-Api-Version": "2022-11-28",
      },

      signal: controller.signal,

      cache: "no-store",
    });

    if (!response.ok) {
      const errorBody = await response.text();

      throw new Error(
        `GitHub request failed: ${response.status} ${response.statusText} - ${errorBody}`,
      );
    }

    return (await response.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Return a date representing the recent discovery window.
 *
 * GitHub search accepts YYYY-MM-DD for date filters.
 */
function getRecentDate(): string {
  const date = new Date();

  date.setUTCDate(date.getUTCDate() - 14);

  return date.toISOString().slice(0, 10);
}

/**
 * Build a valid GitHub repository search URL.
 */
function buildSearchUrl(term: string): string {
  const query = [
    term,
    `pushed:>=${getRecentDate()}`,
  ].join(" ");

  const params = new URLSearchParams({
    q: query,
    sort: "updated",
    order: "desc",
    per_page: String(MAX_REPOSITORIES_PER_QUERY),
  });

  return `${GITHUB_API}/search/repositories?${params.toString()}`;
}

/**
 * Determine whether a repository is relevant to our
 * AI/technology discovery domain.
 */
function isRelevantRepository(
  repository: GitHubRepository,
): boolean {
  if (repository.archived || repository.fork) {
    return false;
  }

  const searchableText = [
    repository.name,
    repository.full_name,
    repository.description ?? "",
    ...(repository.topics ?? []),
  ]
    .join(" ")
    .toLowerCase();

  return AI_TECHNOLOGY_TERMS.some((term) =>
    searchableText.includes(term),
  );
}

/**
 * Convert a GitHub repository into our normalized topic format.
 */
function normalizeRepository(
  repository: GitHubRepository,
): TopicCandidate {
  const description =
    repository.description?.trim() ||
    `Open-source technology project: ${repository.full_name}`;

  const topicText = repository.topics?.length
    ? `Topics: ${repository.topics.join(", ")}`
    : "";

  const summaryParts = [
    description,
    topicText,
    `Stars: ${repository.stargazers_count}`,
    `Forks: ${repository.forks_count}`,
    repository.language
      ? `Primary language: ${repository.language}`
      : "",
  ].filter(Boolean);

  return {
    title: repository.full_name,

    summary: summaryParts.join(". "),

    sourceName: "GitHub",

    sourceUrl: "https://github.com",

    url: repository.html_url,

    publishedDate: new Date(repository.updated_at),
  };
}

/**
 * Execute one GitHub search.
 *
 * A failed search returns an empty list so that one failed
 * query does not stop the entire discovery source.
 */
async function searchRepositories(
  term: string,
): Promise<GitHubRepository[]> {
  try {
    const url = buildSearchUrl(term);

    const response =
      await fetchGitHub<GitHubSearchResponse>(url);

    return response.items;
  } catch (error) {
    console.error(
      `GitHub search failed for "${term}":`,
      error,
    );

    return [];
  }
}

/**
 * GitHub live topic source.
 */
export const githubSource: TopicSource = {
  name: "GitHub",

  async discover(): Promise<TopicCandidate[]> {
    /**
     * Run searches concurrently.
     *
     * Each search is independent, and failures are isolated
     * by searchRepositories().
     */
    const results = await Promise.all(
      SEARCH_TERMS.map(searchRepositories),
    );

    const repositories = results.flat();

    /**
     * Deduplicate repositories by GitHub repository ID.
     */
    const uniqueRepositories =
      new Map<number, GitHubRepository>();

    for (const repository of repositories) {
      uniqueRepositories.set(repository.id, repository);
    }

    /**
     * Apply the broad technology relevance filter.
     */
    const relevantRepositories =
      Array.from(uniqueRepositories.values()).filter(
        isRelevantRepository,
      );

    /**
     * Normalize repositories into TopicCandidate objects.
     */
    const candidates =
      relevantRepositories.map(normalizeRepository);

    /**
     * Sort recently updated repositories first.
     */
    candidates.sort((a, b) => {
      const aTime =
        a.publishedDate?.getTime() ?? 0;

      const bTime =
        b.publishedDate?.getTime() ?? 0;

      return bTime - aTime;
    });

    /**
     * Final URL-level deduplication.
     */
    const uniqueCandidates = new Map<
      string,
      TopicCandidate
    >();

    for (const candidate of candidates) {
      uniqueCandidates.set(candidate.url, candidate);
    }

    return Array.from(uniqueCandidates.values());
  },
};