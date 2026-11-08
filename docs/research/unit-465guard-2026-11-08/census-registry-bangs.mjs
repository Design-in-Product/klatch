/**
 * unit-465guard P7 — the MECHANISM census, not the instance.
 *
 * The defect `probe-round372` had is not "a `!` in one file". It is: a probe dereferences an
 * OPTIONAL registry declaration through a non-null assertion, so a registry in which that entry
 * stops declaring the pattern makes the probe THROW rather than report a red. The selector here is
 * therefore keyed on the shape — `<expr>.refusal!` / `<expr>.skip!`, in any file under `scripts/`,
 * including the registry itself — and not on `probe-round372`'s spelling of it.
 *
 * Two things this is honest about:
 *
 * - **The scanner is only the enumerator.** A source scanner's failure mode is under-reporting, so
 *   every candidate line is PRINTED for a hand read, and the published figure is "N candidates, all
 *   hand read" rather than "the scanner found N".
 * - **Not every hit is the defect.** A `!` reached only after an arm has already asserted the field
 *   is present, or one whose throw lands after the verdict rows are recorded, is a different and
 *   much weaker thing. The `guarded` column is the hand read's, assigned by reading each site's
 *   upstream — it is not computed here, because a line-local rule cannot see an upstream guard.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const UNIT = dirname(fileURLToPath(import.meta.url));
const SCRIPTS = join(UNIT, '..', '..', '..', 'scripts');
// Not hand-rolled: the same blanker the probes use, so "comment-blind" means here what it means
// there. `false` keeps string literals, which is right — a `!` inside a template literal that
// builds a mutation anchor IS live code.
const { stripSource } = await import(join(SCRIPTS, 'lib', 'strip-source.mjs'));

const files = readdirSync(SCRIPTS, { withFileTypes: true })
  .filter((d) => d.isFile() && (d.name.endsWith('.mts') || d.name.endsWith('.mjs')))
  .map((d) => d.name)
  .sort();

const PATTERN = /([A-Za-z_$][\w$]*)\.(refusal|skip)!/g;
const rows = [];
const hitsIn = (line) => {
  PATTERN.lastIndex = 0;
  const out = [];
  let m;
  while ((m = PATTERN.exec(line)) !== null) out.push(`${m[1]}.${m[2]}!`);
  return out;
};

for (const name of files) {
  const raw = readFileSync(join(SCRIPTS, name), 'utf8');
  const bare = stripSource(raw, false).split('\n');
  raw.split('\n').forEach((line, i) => {
    const hits = hitsIn(line);
    if (!hits.length) return;
    // A line whose hits survive comment-blanking is LIVE CODE; one whose hits vanish was PROSE
    // about the defect. Both are printed, because the second class is exactly the trap this
    // project has tripped before: a correction that quotes the wrong spelling re-trips the
    // detector that catches it — and the first version of this census counted this unit's own
    // cure docblock as an instance of the thing it cures.
    const live = hitsIn(bare[i] ?? '');
    rows.push({ name, n: i + 1, hits, live: live.length, text: line.trim() });
  });
}

const liveRows = rows.filter((r) => r.live > 0);
const proseRows = rows.filter((r) => r.live === 0);
const sum = (rs, k) => rs.reduce((a, r) => a + (k === 'live' ? r.live : r.hits.length), 0);

console.log(`files scanned under scripts/: ${files.length} (.mts + .mjs, non-recursive)`);
console.log(
  `candidate lines: ${rows.length} in ${new Set(rows.map((r) => r.name)).size} file(s), ` +
    `${sum(rows, 'raw')} dereference tokens`,
);
console.log(
  `  LIVE CODE (comments blanked, strings kept): ${liveRows.length} line(s) in ` +
    `${new Set(liveRows.map((r) => r.name)).size} file(s), ${sum(liveRows, 'live')} dereference(s)`,
);
console.log(
  `  PROSE ABOUT THE DEFECT (hits vanish under blanking): ${proseRows.length} line(s) in ` +
    `${new Set(proseRows.map((r) => r.name)).size} file(s), ${sum(proseRows, 'raw')} token(s)`,
);
console.log('');
for (const r of rows) {
  console.log(`[${r.live > 0 ? 'LIVE' : 'prose'}] ${r.name}:${r.n}`);
  console.log(`    ${r.hits.join(' ')}   ${r.text.slice(0, 150)}`);
}
console.log('');
const byFile = new Map();
for (const r of liveRows) byFile.set(r.name, (byFile.get(r.name) ?? 0) + r.live);
console.log('LIVE dereferences per file:');
for (const [name, n] of [...byFile].sort((a, b) => b[1] - a[1])) console.log(`  ${n}  ${name}`);
console.log('');
console.log(
  `probe-round372 (this unit's subject) live dereferences: ` +
    `${byFile.get('probe-round372-the-rows-are-keyed-on-the-limb-and-the-contradiction-is-latent.mts') ?? 0}`,
);
