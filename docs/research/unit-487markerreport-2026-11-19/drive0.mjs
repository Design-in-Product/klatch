#!/usr/bin/env node
/**
 * `drive0` — the gate as it stood BEFORE this fire's change, driven from git rather than recalled.
 *
 * The before-state is taken from `git show 064e241a:scripts/verify-decl-body-slicers.mjs` — this
 * unit's own pre-registration commit, which is the last commit before the report line existed — and
 * relocated into `.scratch/` by the same mechanism `cripple-dead-marker-key.mjs` uses and whose
 * neutrality that file's CONTROL arm measures. **A before-figure quoted from a transcript is not a
 * before-figure**; this one is reproducible by anyone from the hash.
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { writeFileSync, mkdirSync, copyFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const SCRATCH = join(ROOT, '.scratch');
const REV = '064e241a';

mkdirSync(SCRATCH, { recursive: true });
const src = execFileSync('git', ['-C', ROOT, 'show', `${REV}:scripts/verify-decl-body-slicers.mjs`],
  { encoding: 'utf8' });
const relocated = src.replace(
  "'./lib/strip-source.mjs'",
  JSON.stringify(join(ROOT, 'scripts/lib/strip-source.mjs')),
);
if (relocated === src) {
  console.error('BLOCKED — the strip-source import specifier was not found at ' + REV + '.');
  process.exit(2);
}
const copy = join(SCRATCH, 'gate-before.mjs');
writeFileSync(copy, relocated);
copyFileSync(join(ROOT, 'scripts/decl-body-slicers.baseline'), join(SCRATCH, 'decl-body-slicers.baseline'));

console.log(`drive0 — gate at ${REV} (before the report line existed), relocated to .scratch/\n`);
const r = spawnSync('node', [copy], { encoding: 'utf8', cwd: ROOT });
process.stdout.write((r.stdout || '') + (r.stderr || ''));
console.log(`\n--- rc read off the child: ${r.status} ---`);

const out = (r.stdout || '') + (r.stderr || '');
const has = /tracked file\(s\), carrying/.test(out);
console.log(`\n  dead-marker disclosure present at ${REV}: ${has ? 'YES' : 'NO'}`
  + '  ← NO is the whole point: the gate could not see them.');
process.exit(has ? 1 : 0);
