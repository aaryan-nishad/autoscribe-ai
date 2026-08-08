import "dotenv/config";

const BREETH_API_KEY =
  process.env.BREETH_API_KEY;

const BREETH_BASE_URL =
  process.env.BREETH_BASE_URL ??
  "https://api.thebreeth.com";

if (!BREETH_API_KEY) {
  throw new Error(
    "BREETH_API_KEY is not configured. Check your .env file.",
  );
}

/**
 * Small helper for making Breeth API requests.
 */
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
        Authorization: `Bearer ${BREETH_API_KEY}`,
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

interface BreethWriteResponse {
  [key: string]: unknown;
}

interface BreethSearchResponse {
  edges?: unknown[];
  [key: string]: unknown;
}

async function writeMemory(): Promise<BreethWriteResponse> {
  const content = `
AutoScribe AI editorial memory test.

The AutoScribe persona is an AI Systems Analyst focused on meaningful
AI systems, developer technology, open-source AI, AI infrastructure,
AI research, robotics, and developer productivity.

Editorial principle:
Technical substance matters more than hype.

Rejection principle:
Low-information repositories that only contain AI-related keywords
without meaningful technical evidence should be rejected.

This memory was created during the Breeth connectivity test.
`;

  return breethRequest<BreethWriteResponse>(
    "/v1/episodes",
    {
      method: "POST",
      body: JSON.stringify({
        content,
        group_id:
          "autoscribe-editorial",
        extract_intent: false,
      }),
    },
  );
}

async function searchMemory(): Promise<BreethSearchResponse> {
  return breethRequest<BreethSearchResponse>(
    "/v1/search",
    {
      method: "POST",
      body: JSON.stringify({
        query:
          "What are AutoScribe's editorial principles for evaluating AI technology topics?",
        group_id:
          "autoscribe-editorial",
        limit: 5,
      }),
    },
  );
}

async function main() {
  console.log(
    "========================================",
  );

  console.log(
    "AutoScribe AI — Breeth Memory Test",
  );

  console.log(
    "========================================",
  );

  console.log(
    `Breeth URL: ${BREETH_BASE_URL}`,
  );

  console.log(
    "\n1. Writing test memory...",
  );

  const writeResult =
    await writeMemory();

  console.log(
    "Memory write successful.",
  );

  console.dir(
    writeResult,
    {
      depth: null,
    },
  );

  console.log(
    "\n2. Searching memory...",
  );

  const searchResult =
    await searchMemory();

  console.log(
    "Memory search successful.",
  );

  console.dir(
    searchResult,
    {
      depth: null,
    },
  );

  const edgeCount =
    searchResult.edges?.length ??
    0;

  console.log(
    `\nRetrieved memory edges: ${edgeCount}`,
  );

  if (edgeCount === 0) {
    throw new Error(
      "Breeth write succeeded but search returned no memory edges.",
    );
  }

  console.log(
    "\n========================================",
  );

  console.log(
    "Breeth connectivity test PASSED",
  );

  console.log(
    "========================================",
  );
}

main().catch(
  (error) => {
    console.error(
      "\nBreeth connectivity test FAILED.",
    );

    console.error(error);

    process.exitCode = 1;
  },
);