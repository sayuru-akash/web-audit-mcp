import { processQueuedAudits } from "../src/lib/audit-service";

const limit = Number(process.argv[2] ?? 5);
const processed = await processQueuedAudits(limit);
console.log(
  JSON.stringify(
    {
      processed: processed.length,
      audits: processed.map((audit) => ({ id: audit.id, status: audit.status, score: audit.overallScore })),
    },
    null,
    2,
  ),
);
