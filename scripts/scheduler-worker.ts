import "dotenv/config";

import { prisma } from "../lib/prisma";
import { runSchedulerOnce } from "../services/scheduler";

const POLL_INTERVAL_MS = 60 * 1000; // Check every minute

let isWorkerRunning = false;

async function checkScheduler() {
  if (isWorkerRunning) {
    console.log(
      "[Scheduler Worker] Previous check is still running. Skipping.",
    );
    return;
  }

  isWorkerRunning = true;

  try {
    const agent = await prisma.agent.findFirst({
      where: {
        name: "AutoScribe",
      },
    });

    if (!agent) {
      console.log(
        "[Scheduler Worker] AutoScribe agent not found.",
      );
      return;
    }

    if (agent.status !== "ACTIVE") {
      console.log(
        `[Scheduler Worker] Agent is ${agent.status}.`,
      );
      return;
    }

    const now = new Date();

    if (
      agent.nextRunAt &&
      agent.nextRunAt > now
    ) {
      console.log(
        `[Scheduler Worker] Next run scheduled for ${agent.nextRunAt.toISOString()}`,
      );
      return;
    }

    console.log(
      `[Scheduler Worker] Starting AutoScribe run at ${now.toISOString()}`,
    );

    const result =
      await runSchedulerOnce();

    console.dir(
      result,
      {
        depth: null,
      },
    );
  } catch (error) {
    console.error(
      "[Scheduler Worker] Scheduler check failed:",
      error,
    );
  } finally {
    isWorkerRunning = false;
  }
}

async function main() {
  console.log(
    "========================================",
  );

  console.log(
    "AutoScribe Scheduler Worker",
  );

  console.log(
    "========================================",
  );

  console.log(
    `Polling every ${POLL_INTERVAL_MS / 1000} seconds.`,
  );

  await checkScheduler();

  setInterval(
    checkScheduler,
    POLL_INTERVAL_MS,
  );
}

process.on(
  "SIGINT",
  async () => {
    console.log(
      "\n[Scheduler Worker] Shutting down...",
    );

    await prisma.$disconnect();

    process.exit(0);
  },
);

process.on(
  "SIGTERM",
  async () => {
    console.log(
      "\n[Scheduler Worker] Shutting down...",
    );

    await prisma.$disconnect();

    process.exit(0);
  },
);

main().catch(async (error) => {
  console.error(
    "[Scheduler Worker] Fatal error:",
    error,
  );

  await prisma.$disconnect();

  process.exit(1);
});