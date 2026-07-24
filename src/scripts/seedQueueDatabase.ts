import { seedQueueDatabaseFromInitialRecords } from "../services/queueOrchestration.js";
import { prisma } from "../db.js";

seedQueueDatabaseFromInitialRecords()
  .then((summary) => {
    console.log(JSON.stringify({ seed: "queue-database-complete", ...summary }, null, 2));
  })
  .catch((error) => {
    console.error("Queue database seed failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
