import { XMLParser } from "fast-xml-parser";

import type {
  TopicCandidate,
  TopicSource,
} from "./types";

const ARXIV_API =
  "https://export.arxiv.org/api/query";

const MAX_RESULTS = 30;

const REQUEST_TIMEOUT_MS = 15_000;

const ARXIV_CATEGORIES = [
  "cs.AI",
  "cs.LG",
  "cs.CL",
  "cs.CV",
  "cs.RO",
];

interface ArxivAuthor {
  name?: string;
}

interface ArxivLink {
  "@_href"?: string;
  "@_rel"?: string;
  "@_type"?: string;
}

interface ArxivEntry {
  id?: string;
  title?: string;
  summary?: string;
  published?: string;
  updated?: string;

  author?: ArxivAuthor | ArxivAuthor[];

  link?: ArxivLink | ArxivLink[];

  category?:
    | {
        "@_term"?: string;
      }
    | {
        "@_term"?: string;
      }[];

  "arxiv:primary_category"?: {
    "@_term"?: string;
  };
}

interface ArxivFeed {
  feed?: {
    entry?: ArxivEntry | ArxivEntry[];
  };
}

/**
 * Fetch XML from arXiv with a timeout.
 */
async function fetchArxiv(
  url: string,
  timeoutMs = REQUEST_TIMEOUT_MS,
): Promise<string> {
  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
    const response = await fetch(url, {
      method: "GET",

      headers: {
        Accept:
          "application/atom+xml, application/xml, text/xml",
        "User-Agent":
          "AutoScribe-AI/1.0 (autonomous AI technology discovery)",
      },

      signal: controller.signal,

      cache: "no-store",
    });

    if (!response.ok) {
      const errorBody = await response.text();

      throw new Error(
        `arXiv request failed: ${response.status} ${response.statusText} - ${errorBody}`,
      );
    }

    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Ensure a value is always represented as an array.
 */
function toArray<T>(
  value: T | T[] | undefined,
): T[] {
  if (!value) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

/**
 * Clean whitespace from arXiv text fields.
 */
function cleanText(
  value: string | undefined,
): string {
  return (value ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Extract the arXiv abstract URL from the entry ID.
 *
 * arXiv IDs are returned in forms such as:
 *
 * http://arxiv.org/abs/2501.12345v1
 */
function normalizeUrl(
  id: string,
): string {
  const cleanId = id
    .replace(/^https?:\/\//, "")
    .replace(/^arxiv\.org\/abs\//, "");

  return `https://arxiv.org/abs/${cleanId}`;
}

/**
 * Extract authors from an arXiv entry.
 */
function extractAuthors(
  entry: ArxivEntry,
): string[] {
  return toArray(entry.author)
    .map((author) =>
      cleanText(author.name),
    )
    .filter(Boolean);
}

/**
 * Extract categories from an arXiv entry.
 */
function extractCategories(
  entry: ArxivEntry,
): string[] {
  const categories = toArray(
    entry.category,
  )
    .map(
      (category) =>
        category["@_term"] ?? "",
    )
    .filter(Boolean);

  const primaryCategory =
    entry[
      "arxiv:primary_category"
    ]?.["@_term"];

  if (
    primaryCategory &&
    !categories.includes(primaryCategory)
  ) {
    categories.unshift(primaryCategory);
  }

  return Array.from(
    new Set(categories),
  );
}

/**
 * Convert an arXiv entry into our common
 * TopicCandidate representation.
 */
function normalizePaper(
  entry: ArxivEntry,
): TopicCandidate | null {
  if (!entry.id || !entry.title) {
    return null;
  }

  const title = cleanText(entry.title);

  const summary =
    cleanText(entry.summary) ||
    `Research paper published on arXiv: ${title}`;

  const authors =
    extractAuthors(entry);

  const categories =
    extractCategories(entry);

  const authorText =
    authors.length > 0
      ? `Authors: ${authors
          .slice(0, 5)
          .join(", ")}`
      : "";

  const categoryText =
    categories.length > 0
      ? `Categories: ${categories.join(
          ", ",
        )}`
      : "";

  const summaryParts = [
    summary,
    authorText,
    categoryText,
  ].filter(Boolean);

  const publishedDate =
    entry.published
      ? new Date(entry.published)
      : undefined;

  return {
    title,

    summary:
      summaryParts.join(". "),

    sourceName: "arXiv",

    sourceUrl:
      "https://arxiv.org",

    url: normalizeUrl(entry.id),

    publishedDate:
      publishedDate &&
      !Number.isNaN(
        publishedDate.getTime(),
      )
        ? publishedDate
        : undefined,
  };
}

/**
 * arXiv live research source.
 */
export const arxivSource: TopicSource = {
  name: "arXiv",

  async discover(): Promise<
    TopicCandidate[]
  > {
    const searchQuery =
      ARXIV_CATEGORIES
        .map(
          (category) =>
            `cat:${category}`,
        )
        .join(" OR ");

    const params =
      new URLSearchParams({
        search_query: searchQuery,
        start: "0",
        max_results:
          String(MAX_RESULTS),
        sortBy: "submittedDate",
        sortOrder: "descending",
      });

    const url =
      `${ARXIV_API}?${params.toString()}`;

    const xml =
      await fetchArxiv(url);

    const parser =
      new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: "@_",
        textNodeName: "#text",
        trimValues: true,
      });

    const parsed =
      parser.parse(xml) as ArxivFeed;

    const entries =
      toArray(parsed.feed?.entry);

    const candidates = entries
      .map(normalizePaper)
      .filter(
        (
          candidate,
        ): candidate is TopicCandidate =>
          candidate !== null,
      );

    /**
     * Remove duplicate papers.
     *
     * A paper can appear in multiple categories.
     */
    const uniqueCandidates =
      new Map<
        string,
        TopicCandidate
      >();

    for (const candidate of candidates) {
      uniqueCandidates.set(
        candidate.url,
        candidate,
      );
    }

    /**
     * Most recently submitted papers first.
     */
    const result =
      Array.from(
        uniqueCandidates.values(),
      );

    result.sort((a, b) => {
      const aTime =
        a.publishedDate?.getTime() ?? 0;

      const bTime =
        b.publishedDate?.getTime() ?? 0;

      return bTime - aTime;
    });

    return result;
  },
};