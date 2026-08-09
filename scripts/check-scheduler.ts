import { prisma } from "../lib/prisma";

async function main() {
  const agent = await prisma.agent.findFirst({
    where: {
      name: "AutoScribe",
    },
  });

  console.log("\n=== AGENT ===");

  if (!agent) {
    console.log("AutoScribe agent not found.");
    return;
  }

  console.dir(
    {
      id: agent.id,
      name: agent.name,
      isProcessing: agent.isProcessing,
      lastRunAt: agent.lastRunAt,
      nextRunAt: agent.nextRunAt,
    },
    { depth: null },
  );

  const logs = await prisma.schedulerLog.findMany({
    where: {
      agentId: agent.id,
    },
    orderBy: {
      startedAt: "desc",
    },
    take: 5,
  });

  console.log("\n=== LAST 5 SCHEDULER LOGS ===");

  console.dir(logs, {
    depth: null,
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