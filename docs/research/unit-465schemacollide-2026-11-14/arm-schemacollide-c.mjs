/**
 * unit-465schemacollide — arm C
 *
 * ADDITIVE again. Arm B repaired three of arm A's keys and then committed the same class of error a
 * third time, in its own `B11`:
 *
 *   readsRecording = /readFileSync\s*\(/.test(src) && /\.out\b/.test(src)
 *
 * `.out` is a file extension AND a property name. `scripts/verify-verifier-exit-codes.mjs` reads
 * `a.out`, `c.out`, `d.out` — fields on child-process results — and never opens a recording file.
 * It also defines its OWN local `readVerdict(out)` at line 110 and does not import the library's.
 * So arm B's "real call sites = 21, of which read a .out recording = 8" fuses three mechanisms:
 * a local function of the same name, a property access spelled like an extension, and an actual
 * consumer of the library's reader. **Neither 21 nor 8 is publishable.**
 *
 * This arm keys on what the question actually needs:
 *   - a consumer of the LIBRARY's reader imports `readVerdict` from a `verdict.mjs` path;
 *   - a consumer of a RECORDING names a quoted string ending in `.out`, not a bare `.out` token.
 *
 * Both are still source-scanning keys and both are declared as such; arm C publishes the member
 * LIST at this population size so the figures can be hand-read rather than trusted.
 */

import { execFileSync } from 'node:child_process';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..', '..');
const THIS_UNIT = 'docs/research/unit-465schemacollide-2026-11-14/';

const legs = [];
const red = [];
const refused = [];
const preds = [];
const refuted = [];

function leg(id, ok, detail) {
  legs.push(id);
  if (ok === null) {
    refused.push(id);
    console.log(`  REFUSED ${id}  ${detail}`);
  } else if (ok) {
    console.log(`  ok      ${id}  ${detail}`);
  } else {
    red.push(id);
    console.log(`  RED     ${id}  ${detail}`);
  }
}
function pred(id, held, detail) {
  preds.push(id);
  if (held) console.log(`  LANDED  ${id}  ${detail}`);
  else {
    refuted.push(id);
    console.log(`  REFUTED ${id}  ${detail}`);
  }
}

const git = (...args) =>
  execFileSync('git', ['-C', ROOT, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });

// ---------------------------------- C1: the contaminant arm B's key could not tell from a call site

const VVE = 'scripts/verify-verifier-exit-codes.mjs';
const vveSrc = git('show', `HEAD:${VVE}`);
const vveDefinesOwn = /function readVerdict\s*\(/.test(vveSrc);
const vveImportsLib = /import[^;]*\breadVerdict\b[^;]*verdict\.mjs/s.test(vveSrc);
const vveQuotedOut = [...vveSrc.matchAll(/['"`][^'"`]*\.out['"`]/g)].map((m) => m[0]);
const vveBareOut = (vveSrc.match(/\.out\b/g) || []).length;
leg(
  'C1',
  vveDefinesOwn && !vveImportsLib,
  `${VVE}: defines its own readVerdict=${vveDefinesOwn} imports the library's=${vveImportsLib}`
);
leg(
  'C2',
  vveQuotedOut.length === 0 && vveBareOut > 0,
  `${VVE}: bare \`.out\` tokens=${vveBareOut} (property accesses), quoted ".out" paths=${vveQuotedOut.length} — ` +
    `arm B's key counted the former as the latter`
);
pred(
  'S1',
  vveDefinesOwn && !vveImportsLib && vveQuotedOut.length === 0,
  "arm B's `8` includes a file that neither imports the library's reader nor opens a recording: its own key fused three mechanisms"
);

// ------------------------------- C2: the consumer census, keyed on the import and a quoted path

const sources = git('ls-tree', '-r', '--name-only', 'HEAD', 'docs/research/', 'scripts/', 'packages/')
  .split('\n')
  .filter((p) => p.endsWith('.mjs') && !p.startsWith(THIS_UNIT) && basename(dirname(p)) !== 'lib');

const rows = [];
for (const p of sources) {
  const src = git('show', `HEAD:${p}`);
  const importsLib = /import[^;]*\breadVerdict\b[^;]*verdict\.mjs/s.test(src);
  const definesOwn = /function readVerdict\s*\(/.test(src);
  const calls = (src.match(/\breadVerdict\s*\(/g) || []).length;
  if (!importsLib && !definesOwn && calls === 0) continue;
  const quotedOut = [...src.matchAll(/['"`][^'"`]*\.out['"`]/g)].length;
  rows.push({ p, importsLib, definesOwn, calls, quotedOut });
}

console.log('          --- every file that imports, defines, or calls a readVerdict');
for (const r of rows) {
  console.log(
    `          ${r.importsLib ? 'LIB-IMPORT' : r.definesOwn ? 'OWN-LOCAL ' : 'CALL-ONLY '} ` +
      `calls=${String(r.calls).padStart(2)} quoted.out=${String(r.quotedOut).padStart(2)}  ${r.p}`
  );
}

const libConsumers = rows.filter((r) => r.importsLib && r.calls > 0);
const ownLocal = rows.filter((r) => !r.importsLib && r.definesOwn);
leg('C3', rows.length > 0, `files mentioning a readVerdict at all (non-lib, non-this-unit): ${rows.length}`);
leg(
  'C4',
  ownLocal.length > 0,
  `files defining their OWN readVerdict rather than importing the library's: ${ownLocal.length} ` +
    `(${ownLocal.map((r) => r.p.replace('docs/research/', '')).join(', ')})`
);
leg(
  'C5',
  libConsumers.length > 0,
  `consumers of the LIBRARY's reader: ${libConsumers.length}`
);

const recordingConsumers = libConsumers.filter((r) => r.quotedOut > 0);
console.log('          --- library-reader consumers that also name a quoted .out path');
for (const r of recordingConsumers) console.log(`          ${r.p}  (quoted .out literals = ${r.quotedOut})`);
leg(
  'C6',
  true,
  `of the ${libConsumers.length} library-reader consumers, ${recordingConsumers.length} name a quoted .out path`
);
pred(
  'S2',
  recordingConsumers.length > 0 && recordingConsumers.length < 8,
  `the publishable figure for recording-reading consumers of the library's reader is ${recordingConsumers.length}, ` +
    `strictly below arm B's contaminated 8`
);

// ------------------- C3: does any of them read a POPULATION, or only its own named recordings?
//
// This is the question the boarding turns on, and the one Argus already answered in the general
// case ("no sweep-level reader exists yet", 2026-11-10). Keyed on directory walking, which is what
// a population reader needs and a named-file reader does not.
const walkers = recordingConsumers.filter((r) => {
  const src = git('show', `HEAD:${r.p}`);
  return /readdirSync\s*\(|ls-tree|ls-files|globSync\s*\(/.test(src);
});
console.log('          --- which of those enumerate a population rather than named files');
for (const r of recordingConsumers) {
  const src = git('show', `HEAD:${r.p}`);
  const how = /readdirSync\s*\(/.test(src) ? 'readdirSync'
    : /ls-tree/.test(src) ? 'ls-tree'
    : /ls-files/.test(src) ? 'ls-files'
    : /globSync\s*\(/.test(src) ? 'globSync' : 'named files only';
  console.log(`          ${how.padEnd(16)} ${r.p}`);
}
leg(
  'C7',
  true,
  `recording-reading library consumers that enumerate a population: ${walkers.length} of ${recordingConsumers.length}`
);
pred(
  'S3',
  walkers.length === 0,
  'no consumer of the library reader enumerates a recording POPULATION — so the 98 refused hand-rolled recordings cost nothing TODAY, which is a fact about the absent sweep and not about the collision'
);

// ------------------------------------------------------------------- gate

const dirty = git('status', '--porcelain', 'packages', 'scripts', 'docs/research/lib').trim();
leg('C-gate', dirty === '', `git status --porcelain packages scripts docs/research/lib → ${JSON.stringify(dirty)}`);

const state = red.length ? 'RED' : refused.length ? 'REFUSED' : 'GREEN';
const exit = red.length || refused.length ? 1 : 0;
console.log(
  `VERDICT/${exit} ${state} legs=${legs.length} red=[${red}] refused=[${refused}] ` +
    `preds=${preds.length} refuted=[${refuted}] prefused=[]`
);
process.exit(exit);
