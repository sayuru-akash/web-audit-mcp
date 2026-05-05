import { runPageAudit } from "../src/lib/audit-engine";

const url = process.argv[2];
if (!url) {
  console.error("Usage: npm run audit:url -- https://example.com");
  process.exit(1);
}

const result = await runPageAudit(url);
console.log(JSON.stringify(result, null, 2));
