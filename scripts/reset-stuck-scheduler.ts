import { prisma } from "../lib/prisma";

async function main() {
  const agent = await prisma.agent.findFirst({
    where: {
      name: "AutoScribe",
    },
  });

  if (!agent) {
    throw new Error("AutoScribe agent not found.");
  }

  const now = new Date();

  await prisma.agent.update({
    where: {
      id: agent.id,
    },
    data: {
      isProcessing: false,
      nextRunAt: now,
    },
  });

  const runningLogs =
    await prisma.schedulerLog.findMany({
      where: {
        agentId: agent.id,
        status: "RUNNING",
      },
    });

  for (const log of runningLogs) {
    await prisma.schedulerLog.update({
      where: {
        id: log.id,
      },
      data: {
        status: "FAILED",
        finishedAt: now,
        error:
          "Recovered stale scheduler execution during development.",
      },
    });
  }

  console.log("Scheduler lock reset successfully.");
  console.log({
    agentId: agent.id,
    isProcessing: false,
    nextRunAt: now,
    recoveredLogs: runningLogs.length,
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });