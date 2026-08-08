import "dotenv/config";

const BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL ??
  "http://localhost:3000";

async function initializeAgent() {
  const response = await fetch(
    `${BASE_URL}/api/agent/init`,
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",
      },
    },
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
    "AutoScribe AI — Agent Initialization API Test",
  );

  console.log(
    "========================================",
  );

  console.log(
    `API: ${BASE_URL}/api/agent/init`,
  );

  /*
   * First initialization.
   */
  console.log(
    "\n1. Initializing AutoScribe...",
  );

  const first =
    await initializeAgent();

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
      "First agent initialization failed.",
    );
  }

  if (!first.body.agent) {
    throw new Error(
      "API did not return an agent.",
    );
  }

  if (!first.body.agent.persona) {
    throw new Error(
      "API did not return the agent persona.",
    );
  }

  const firstAgentId =
    first.body.agent.id;

  /*
   * Second initialization.
   *
   * This tests idempotency.
   */
  console.log(
    "\n2. Initializing AutoScribe again...",
  );

  const second =
    await initializeAgent();

  console.log(
    "HTTP status:",
    second.status,
  );

  console.dir(
    second.body,
    {
      depth: null,
    },
  );

  if (
    second.status !== 200 ||
    !second.body.success
  ) {
    throw new Error(
      "Second agent initialization failed.",
    );
  }

  const secondAgentId =
    second.body.agent?.id;

  if (
    firstAgentId !==
    secondAgentId
  ) {
    throw new Error(
      "Agent initialization is not idempotent. Different agent IDs were returned.",
    );
  }

  console.log(
    "\n========================================",
  );

  console.log(
    "AGENT INITIALIZATION TEST PASSED",
  );

  console.log(
    "========================================",
  );

  console.log(
    `Agent ID: ${firstAgentId}`,
  );

  console.log(
    `Agent: ${first.body.agent.name}`,
  );

  console.log(
    `Persona ID: ${first.body.agent.persona.id}`,
  );

  console.log(
    "Idempotency: verified",
  );
}

main().catch(
  (error) => {
    console.error(
      "\nAgent initialization test FAILED.",
    );

    console.error(error);

    process.exitCode = 1;
  },
);