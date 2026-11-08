/**
 * unit-465guard374 — the 2×2 drive. P5, P6, P7.
 *
 * Cells: SUBJECT (shipped | cured) × REGISTRY (faithful | entry-absent).
 *
 * The subject copy is read from a REV (`git show <rev>:<path>`) rather than from a copy made by
 * hand before editing, because this unit cures its own subject and a hand copy is a copy of
 * whatever the tree happened to hold when I remembered to make it.
 *
 * The cripple models the FIRST of the three hazards Daedalus's U2 names — "promotion reverted, file
 * renamed, entry demoted to deferred" — by renaming the keyed entry's `file:` value in a registry
 * copy, so `SWEPT.find((s) => s.file === R225)` returns `undefined`. DECLARED: excising the object
 * literal is a different edit with the same `find` result; the rename is chosen because its anchor
 * can be asserted unique and an excision's cannot.
 *
 * Usage: node drive-cells.mjs <shipped-rev|cured> <faithful|absent>
 */
import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..', '..');
const SCRIPTS = join(REPO, 'scripts');
const SUBJECT_REL =
  'scripts/probe-round374-the-absence-check-has-no-control-and-the-drift-is-already-in-the-tree.mts';
const R225_ENTRY_ANCHOR = "file: 'probe-round225-a-citation-is-not-a-call.mts',";

const [subjectArg, registryArg] = process.argv.slice(2);
if (!subjectArg || !['faithful', 'absent'].includes(registryArg)) {
  throw new Error('usage: node drive-cells.mjs <shipped-rev|cured> <faithful|absent>');
}

const SANDBOX = join(REPO, '.testdata', `unit-465guard374-${subjectArg}-${registryArg}`);
mkdirSync(join(SANDBOX, 'lib'), { recursive: true });
/**
 * The registry module has exactly one relative import — `./lib/strip-source.mjs` (`:198`) — so a
 * copy of it placed in a bare sandbox dir fails to RESOLVE, upstream of the cripple and of every
 * arm. The first drive of this unit did exactly that and reported exit 1, zero rows, no headline:
 * the shape P5 predicts, for a reason that has nothing to do with the absent entry. That capture
 * is DISCARDED. The subject's own sandbox copies this same file into its own `lib/` for this same
 * reason (`probe-round374:144`); inheriting the constraint rather than rediscovering it twice.
 */
copyFileSync(join(SCRIPTS, 'lib', 'strip-source.mjs'), join(SANDBOX, 'lib', 'strip-source.mjs'));

/** Replace exactly one asserted occurrence, or throw. Inherited from the subject's own `once`. */
const occurrences = (h, n) => h.split(n).length - 1;
const once = (src, from, to) => {
  const n = occurrences(src, from);
  if (n !== 1) throw new Error(`anchor occurs ${n} time(s), expected exactly 1: ${from}`);
  return src.replace(from, to);
};

// --- the registry copy ----------------------------------------------------------------------
const sweepSrc = readFileSync(join(SCRIPTS, 'sweep-probes.mjs'), 'utf8');
const registryPath = join(SANDBOX, 'registry.mjs');
if (registryArg === 'faithful') {
  writeFileSync(registryPath, sweepSrc, 'utf8');
} else {
  writeFileSync(
    registryPath,
    once(
      sweepSrc,
      R225_ENTRY_ANCHOR,
      "file: 'probe-round225-RENAMED-BY-A-REVERTED-PROMOTION.mts',",
    ),
    'utf8',
  );
}

// --- the subject copy -----------------------------------------------------------------------
let subjectSrc;
if (subjectArg === 'cured') {
  subjectSrc = readFileSync(join(REPO, SUBJECT_REL), 'utf8');
} else {
  const show = spawnSync('git', ['-C', REPO, 'show', `${subjectArg}:${SUBJECT_REL}`], {
    encoding: 'utf8',
  });
  if (show.status !== 0) throw new Error(`git show failed: ${show.stderr}`);
  subjectSrc = show.stdout;
}

/**
 * Four rewrites, each asserted unique. `HERE`'s declaration is anchored on the TWO-line span
 * including `REPO`, because the one-line form also occurs as a string constant at `R373_HERE` — a
 * present anchor is not an intact span, and `once` would have thrown on 2 rather than silently
 * editing the wrong one.
 */
let s = once(
  subjectSrc,
  "import { summariseAndExit, type ProbeVerdict } from './lib/probe-outcome.mts';",
  `import { summariseAndExit, type ProbeVerdict } from '${join(SCRIPTS, 'lib', 'probe-outcome.mts')}';`,
);
s = once(s, "import { SWEPT } from './sweep-probes.mjs';", `import { SWEPT } from '${registryPath}';`);
s = once(
  s,
  "const HERE = dirname(fileURLToPath(import.meta.url));\nconst REPO = join(HERE, '..');",
  `const HERE = ${JSON.stringify(SCRIPTS)};\nconst REPO = ${JSON.stringify(REPO)};`,
);
s = once(
  s,
  "const SANDBOX = join(REPO, '.testdata', 'round374');",
  `const SANDBOX = ${JSON.stringify(join(SANDBOX, 'inner'))};`,
);
s = once(
  s,
  "join(REPO, '.testdata', 'round374-r373-child')",
  JSON.stringify(join(SANDBOX, 'inner-r373-child')),
);
const subjectPath = join(SANDBOX, 'subject.mts');
writeFileSync(subjectPath, s, 'utf8');

// --- the drive ------------------------------------------------------------------------------
const run = spawnSync('npx', ['tsx', subjectPath], {
  cwd: REPO,
  encoding: 'utf8',
  timeout: 600_000,
});
const out = `${run.stdout ?? ''}${run.stderr ?? ''}`;
writeFileSync(join(HERE, `cell-${subjectArg}-${registryArg}.txt`), out, 'utf8');

const lines = out.split('\n');
const rows = lines.filter((l) => /^(\[ok\]|FAIL) /.test(l));
const failing = rows.filter((l) => l.startsWith('FAIL ')).map((l) => l.slice(5).split(/\s+/)[0]);
const headline = lines.find((l) => /regression check/.test(l)) ?? '(NONE PRINTED)';
const threw = /^\s*(TypeError|Error|ReferenceError)\b/m.test(out) || /Cannot read properties/.test(out);

console.log(`CELL        subject=${subjectArg}  registry=${registryArg}`);
console.log(`  exit      ${String(run.status)}`);
console.log(`  rows      ${rows.length}   (verdict lines, counted off this capture)`);
console.log(`  failing   ${failing.length ? failing.join(' ') : '(none)'}`);
console.log(`  headline  ${headline.trim()}`);
console.log(`  threw     ${threw}`);
console.log(
  `SUMMARY exit=${String(run.status)} rows=${rows.length} failing=${failing.join(',') || 'none'} ` +
    `headline=${headline.trim() === '(NONE PRINTED)' ? 'absent' : 'present'} threw=${threw}`,
);
