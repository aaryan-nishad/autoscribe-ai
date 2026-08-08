import type {
  MemoryResult,
  MemorySearchResult,
  MemoryWriteResult,
  RememberMemoryInput,
  SearchMemoryInput,
} from "./types";

const BREETH_API_KEY =
  process.env.BREETH_API_KEY;

const BREETH_BASE_URL =
  process.env.BREETH_BASE_URL ??
  "https://api.thebreeth.com";

if (!BREETH_API_KEY) {
  throw new Error(
    "BREETH_API_KEY is not configured.",
  );
}

interface BreethEpisodeResponse {
  ok?: boolean;

  episode_name?: string;

  group_id?: string;

  cogram?: {
    mode?: string;
    status?: string;
    task_id?: string;
    note?: string;
  };

  warning?: string | null;
}

interface BreethSearchResponse {
  director_profile?: unknown;

  edges?: Array<{
    edge_uuid?: string;
    source_node?: string;
    target_node?: string;
    fact?: string;
    name?: string | null;
    intent_meta?: unknown;
    _tier?: string;
  }>;

  _cache?: {
    tier?: string;
    hot_hits?: number;
    cold_hits?: number;
    group_id?: string;
  };

  note?: string | null;
}

async function breethRequest<T>(
  path: string,
  options: RequestInit,
): Promise<T> {
  const response = await fetch(
    `${BREETH_BASE_URL}${path}`,
    {
      ...options,

      headers: {
        "Content-Type":
          "application/json",

        Authorization:
          `Bearer ${BREETH_API_KEY}`,

        ...(options.headers ?? {}),
      },
    },
  );

  const text =
    await response.text();

  let data: unknown = null;

  try {
    data = text
      ? JSON.parse(text)
      : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    throw new Error(
      `Breeth request failed: ${response.status} ${response.statusText}\n${JSON.stringify(
        data,
        null,
        2,
      )}`,
    );
  }

  return data as T;
}

export async function writeBreethMemory(
  input: RememberMemoryInput,
): Promise<MemoryWriteResult> {
  const response =
    await breethRequest<BreethEpisodeResponse>(
      "/v1/episodes",
      {
        method: "POST",

        body: JSON.stringify({
          content: input.content,

          group_id: input.groupId,

          extract_intent: false,
        }),
      },
    );

  return {
    success:
      response.ok === true,

    episodeName:
      response.episode_name,

    taskId:
      response.cogram?.task_id,
  };
}

export async function searchBreethMemory(
  input: SearchMemoryInput,
): Promise<MemorySearchResult> {
  const response =
    await breethRequest<BreethSearchResponse>(
      "/v1/search",
      {
        method: "POST",

        body: JSON.stringify({
          query: input.query,

          group_id: input.groupId,

          limit:
            input.limit ?? 5,
        }),
      },
    );

  const results: MemoryResult[] =
    (response.edges ?? []).map(
      (edge) => ({
        edgeUuid:
          edge.edge_uuid,

        sourceNode:
          edge.source_node,

        targetNode:
          edge.target_node,

        fact:
          edge.fact,

        name:
          edge.name,

        intentMeta:
          edge.intent_meta,

        tier:
          edge._tier,
      }),
    );

  return {
    query: input.query,
    results,
  };
}