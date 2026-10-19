#!/usr/bin/env node
// Round 419 — drive Theseus's Round 418 instruments UNMODIFIED, before anything of mine is built.
//
// Why a driver rather than three shell invocations: this fire's shell refuses compound commands,
// and more importantly a driver records the cwd, the argv, the exit code and the captured bytes
// for each run in ONE output file, so the reproduction claim is readable without reconstructing
// which command produced which block. 328: reproduce their figures under their own key first.
//
// Each instrument is driven from the REPO ROOT and, separately, from the directory it is committed
// in — because his §5 found exactly that difference in MY round417 instrument, and a claim that his
// are drivable from both places should be measured, not assumed.
import { spawnSync } from 'node:child_process';
import { existsSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const REPO = path.resolve(import.meta.dirname, '../../..');
const HIS = 'docs/research/round418-instruments';
const INSTRUMENTS = [
  'compaction-capability-computed-then-discarded.mjs',
  'installed-sdk-and-sec4-by-shape.mjs',
  'sec3-key-verbatim-then-widened.mjs',
];

const lines = [];
const say = (s) => { lines.push(s); console.log(s); };

say('# Round 419 — Theseus\'s Round 418 instruments, driven unmodified');
say('');
say(`repo root: ${REPO}`);
say(`driven at: ${new Date().toISOString()}`);
const headRev = spawnSync('git', ['-C', REPO, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).stdout.trim();
say(`HEAD: ${headRev}`);
say('');

const results = [];
for (const name of INSTRUMENTS) {
  const abs = path.join(REPO, HIS, name);
  if (!existsSync(abs)) { say(`MISSING: ${HIS}/${name}`); results.push({ name, missing: true }); continue; }

  for (const [label, cwd] of [['repo-root', REPO], ['own-directory', path.join(REPO, HIS)]]) {
    const r = spawnSync('node', [abs], { cwd, encoding: 'utf8', timeout: 240000 });
    const out = (r.stdout || '') + (r.stderr || '');
    say('='.repeat(78));
    say(`## ${name}  [cwd: ${label}]`);
    say(`exit: ${r.status}   stdout bytes: ${(r.stdout || '').length}   stderr bytes: ${(r.stderr || '').length}`);
    say('-'.repeat(78));
    say(out.trimEnd());
    say('');
    results.push({ name, cwd: label, status: r.status, out });
  }
}

// --- Verdicts on his round, computed from the captured text, not from reading it ---
say('='.repeat(78));
say('## VERDICTS (computed from the captured output above)');

const byName = (n, c) => results.find((r) => r.name === n && r.cwd === c);

const cap = byName('compaction-capability-computed-then-discarded.mjs', 'repo-root');
const capVerdict = cap && /VERDICT:\s*COMPUTED AND DISCARDED/.test(cap.out);
const capRead0 = cap && /READ\s+0×/.test(cap.out);
say(`V1 his §4 census reproduces (VERDICT: COMPUTED AND DISCARDED): ${capVerdict === true}`);
say(`V2 his §4 census still reads 0× in non-test source:          ${capRead0 === true}`);

const sec3 = byName('sec3-key-verbatim-then-widened.mjs', 'repo-root');
const sec3Nine = sec3 && /\b9\b/.test(sec3.out);
say(`V3 his §3 grader ran to completion (exit 0):                 ${sec3 ? sec3.status === 0 : false}`);
say(`V4 his §3 output mentions a 9:                               ${sec3Nine === true}`);

const inst = byName('installed-sdk-and-sec4-by-shape.mjs', 'repo-root');
say(`V5 his §1/§2 shape instrument ran to completion (exit 0):    ${inst ? inst.status === 0 : false}`);

// His §5 charge against MY instrument was "it throws when driven from its own directory".
// Grade his own three on the same property rather than taking it on trust.
for (const name of INSTRUMENTS) {
  const root = byName(name, 'repo-root');
  const own = byName(name, 'own-directory');
  if (!root || !own) continue;
  say(`V6 ${name}: root exit ${root.status}, own-dir exit ${own.status}, same: ${root.status === own.status}`);
}

writeFileSync(path.join(import.meta.dirname, 'his418-driven-live.out'), lines.join('\n') + '\n');
