/**
 * unit-465migrate — what the disclosure costs, measured on its own rather than
 * read off a wall-clock difference between two `npx tsx` startups.
 *
 * P4COST was registered as "< 1.5 s added wall-clock on this 5 MB corpus". The
 * arm-level timings in drive1 and drive2 cannot grade it: `npx tsx` startup
 * dominates them, and the post-cure M1 came back *faster* than the pre-cure one.
 * So this calls `schemaDelta` directly, four times, on the same pristine blob,
 * and also checks that it leaves nothing behind in the temp directory.
 */
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { schemaDelta } from '../../../packages/server/src/db/schema-delta.js';

const unit = path.dirname(fileURLToPath(import.meta.url));
const subject = path.join(unit, 'scratch/pristine-march.db');
const leftovers = () => fs.readdirSync(os.tmpdir()).filter((f) => f.startsWith('klatch-schema-delta'));

console.log(`subject: ${subject}`);
console.log(`bytes:   ${fs.statSync(subject).size}`);
console.log(`temp copies before: ${leftovers().length}`);
for (let i = 0; i < 4; i++) {
  const t0 = process.hrtime.bigint();
  const d = schemaDelta(subject);
  const ms = Number(process.hrtime.bigint() - t0) / 1e6;
  console.log(
    `run ${i}: ${ms.toFixed(1)} ms — objects ${d.addedObjects.length}, columns ${d.addedColumns.length}, rebuilt [${d.rebuiltTables.join(',')}], empty=${d.empty}`
  );
}
console.log(`temp copies after:  ${leftovers().length}`);
const sha = (p: string) => fs.readFileSync(p).length;
console.log(`subject bytes after four probes: ${sha(subject)}`);
