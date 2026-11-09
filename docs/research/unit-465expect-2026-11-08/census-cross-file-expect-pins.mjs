// Census the MECHANISM, not the instance: `probe-round377`'s A1 pins two SIBLING entries'
// `expect` arm counts as conjuncts (`e374.expect.source === 'All 8 regression checks passed'`).
// If that shape is live anywhere else, then guarding any one member of the 372-377 family and
// bumping its `expect` reddens an unrelated probe -- which is a fact the family-wide pass has to
// know BEFORE it is planned, not after its first red.
//
// Population: every `.mts`/`.mjs` under scripts/, LIVE only (lib/strip-source.mjs), so a docblock
// quoting an `All N` line is not counted as a pin. The subject's own `expect:` declarations inside
// sweep-probes.mjs are the registry itself and are reported separately, not as cross-file pins.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { stripSource } from '../../../scripts/lib/strip-source.mjs';

const DIR = 'scripts';
const files = readdirSync(DIR, { withFileTypes: true })
  .filter((d) => d.isFile() && /\.(mts|mjs)$/.test(d.name))
  .map((d) => d.name)
  .sort();

// An `All N regression checks passed` literal appearing in LIVE source. In a probe (not the
// registry) this is a pin on some entry's arm count.
const PIN = /All (\d+) regression checks passed/g;

let totalFiles = 0;
let pinFiles = 0;
const rows = [];

for (const name of files) {
  totalFiles += 1;
  const liveText = stripSource(readFileSync(join(DIR, name), 'utf8'));
  const hits = [];
  PIN.lastIndex = 0;
  let m;
  while ((m = PIN.exec(liveText))) {
    const line = liveText.slice(0, m.index).split('\n').length;
    const whole = liveText.split('\n')[line - 1].trim();
    hits.push({ n: m[1], line, whole: whole.slice(0, 140) });
  }
  if (hits.length === 0) continue;
  pinFiles += 1;
  rows.push({ name, hits });
}

console.log(`population: ${totalFiles} .mts/.mjs files under ${DIR}/ (LIVE only)`);
console.log(`files carrying at least one live \`All N regression checks passed\` literal: ${pinFiles}`);
console.log('');
for (const r of rows) {
  const kind = r.name === 'sweep-probes.mjs' ? 'THE REGISTRY (declarations, not pins)' : 'probe';
  console.log(`--- ${r.name}  [${kind}]  ${r.hits.length} hit(s)`);
  for (const h of r.hits) console.log(`    :${String(h.line).padEnd(5)} All ${h.n}  ${h.whole}`);
}
