import { prisma } from "../lib/prisma";

async function main() {
  const nextRunAt = new Date(Date.now() +60* 60 * 1000);

  const result = await prisma.agent.updateMany({
    where: {
      name: "AutoScribe",
    },
    data: {
        // fromhere we can change the publishing interval time
      publishIntervalMinutes: 60,
      nextRunAt,
    },
  });

  console.log(`Updated ${result.count} AutoScribe agent(s).`);
  console.log("Interval: 60 minute");
  console.log(`Next run: ${nextRunAt.toISOString()}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });