import "dotenv/config";

const BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL ??
  "http://localhost:3000";

async function getFeed(
  query = "",
) {
  const response = await fetch(
    `${BASE_URL}/api/agent/feed${query}`,
  );

  const body =
    await response.json();

  return {
    status:
      response.status,

    body,
  };
}

async function main() {
  console.log(
    "========================================",
  );

  console.log(
    "AutoScribe AI — Agent Feed API Test",
  );

  console.log(
    "========================================",
  );

  /*
   * First request.
   */
  console.log(
    "\n1. Requesting default feed...",
  );

  const first =
    await getFeed();

  console.log(
    "HTTP status:",
    first.status,
  );

  console.dir(
    first.body,
    {
      depth: null,
    },
  );

  if (
    first.status !== 200 ||
    !first.body.success
  ) {
    throw new Error(
      "Feed request failed.",
    );
  }

  const firstData =
    first.body.data;

  if (!firstData) {
    throw new Error(
      "Feed response is missing data.",
    );
  }

  if (
    !Array.isArray(
      firstData.posts,
    )
  ) {
    throw new Error(
      "Feed response is missing posts array.",
    );
  }

  console.log(
    `Posts returned: ${firstData.posts.length}`,
  );

  /*
   * We already published a post during Stage 4.4,
   * so the feed should contain at least one post.
   */
  if (
    firstData.posts.length === 0
  ) {
    throw new Error(
      "Expected at least one published post in the feed.",
    );
  }

  /*
   * Validate the first post.
   */
  const firstPost =
    firstData.posts[0];

  if (!firstPost.id) {
    throw new Error(
      "Published post is missing id.",
    );
  }

  if (!firstPost.text) {
    throw new Error(
      "Published post is missing text.",
    );
  }

  if (
    !firstPost.publishedAt
  ) {
    throw new Error(
      "Published post is missing publishedAt.",
    );
  }

  if (
    !Array.isArray(
      firstPost.sources,
    )
  ) {
    throw new Error(
      "Published post sources must be an array.",
    );
  }

  if (!firstPost.topic) {
    throw new Error(
      "Published post is missing topic.",
    );
  }

  if (
    firstPost.topic.status
  ) {
    throw new Error(
      "Topic status should not be exposed as an unnecessary feed field.",
    );
  }

  /*
   * Test explicit limit.
   */
  console.log(
    "\n2. Testing limit parameter...",
  );

  const limited =
    await getFeed(
      "?limit=1",
    );

  console.log(
    "HTTP status:",
    limited.status,
  );

  if (
    limited.status !== 200 ||
    !limited.body.success
  ) {
    throw new Error(
      "Limited feed request failed.",
    );
  }

  if (
    limited.body.data.posts
      .length > 1
  ) {
    throw new Error(
      "Feed returned more posts than requested limit.",
    );
  }

  /*
   * Test maximum limit protection.
   */
  console.log(
    "\n3. Testing maximum limit...",
  );

  const maximum =
    await getFeed(
      "?limit=500",
    );

  if (
    maximum.status !== 200 ||
    !maximum.body.success
  ) {
    throw new Error(
      "Maximum-limit feed request failed.",
    );
  }

  if (
    maximum.body.data.pagination
      .limit > 50
  ) {
    throw new Error(
      "Feed exceeded maximum page size of 50.",
    );
  }

  /*
   * Test cursor pagination when more pages exist.
   */
  console.log(
    "\n4. Testing cursor pagination...",
  );

  const pagination =
    firstData.pagination;

  if (
    pagination.hasMore &&
    pagination.nextCursor
  ) {
    const second =
      await getFeed(
        `?limit=1&cursor=${encodeURIComponent(
          pagination.nextCursor,
        )}`,
      );

    if (
      second.status !== 200 ||
      !second.body.success
    ) {
      throw new Error(
        "Cursor pagination request failed.",
      );
    }

    if (
      second.body.data.posts
        .length > 1
    ) {
      throw new Error(
        "Cursor request returned more posts than requested.",
      );
    }

    if (
      second.body.data.posts
        .length > 0 &&
      second.body.data.posts[0]
        .id === firstData.posts[0].id
    ) {
      throw new Error(
        "Cursor pagination returned the same post.",
      );
    }

    console.log(
      "Cursor pagination: verified",
    );
  } else {
    console.log(
      "Cursor pagination: no second page available",
    );
  }

  console.log(
    "\n========================================",
  );

  console.log(
    "AGENT FEED API TEST PASSED",
  );

  console.log(
    "========================================",
  );

  console.log(
    `Published posts available: ${firstData.posts.length}`,
  );

  console.log(
    `Page limit: ${firstData.pagination.limit}`,
  );

  console.log(
    `Has more: ${firstData.pagination.hasMore}`,
  );
}

main().catch(
  (error) => {
    console.error(
      "\nAgent feed test FAILED.",
    );

    console.error(error);

    process.exitCode = 1;
  },
);