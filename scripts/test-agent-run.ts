const API_URL =
  "http://localhost:3000/api/agent/run";

async function main() {
  console.log(
    "# AutoScribe AI — Autonomous Agent Run Test\n",
  );

  console.log(
    `Calling: ${API_URL}`,
  );

  console.log(
    "\nStarting autonomous run...\n",
  );

  const response =
    await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json",
      },
    });

  console.log(
    `HTTP status: ${response.status}`,
  );

  const text =
    await response.text();

  let data: unknown;

  try {
    data = JSON.parse(text);
  } catch {
    console.error(
      "\nServer returned non-JSON response:\n",
    );

    console.error(text);

    throw new Error(
      "Agent run API returned invalid JSON.",
    );
  }

  console.dir(data, {
    depth: null,
  });

  if (!response.ok) {
    throw new Error(
      "Agent run API failed.",
    );
  }

  console.log(
    "\n========================================",
  );

  console.log(
    "Autonomous agent run PASSED",
  );

  console.log(
    "========================================",
  );
}

main().catch((error) => {
  console.error(
    "\nAgent run test FAILED.",
  );

  console.error(error);

  process.exit(1);
});