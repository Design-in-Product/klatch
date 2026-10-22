/**
 * Round 436 — Theseus's Round 435 §6, implemented at the FILE level.
 *
 * > applying a lesson in one leg is not applying it to the instrument.
 *
 * His `G7` pinned a count and went red on its own promotion, three legs away from a `G6` that cited
 * the very lesson by number. His sharpening is that the unit of a promotion-stability review is the
 * FILE, not the leg you happened to be thinking about — because a count pin elsewhere in the same
 * file looks exactly like a leg you already checked.
 *
 * A leg-by-leg reread cannot discharge that, since the thing being missed IS the rereading. So this
 * instrument is mechanical and file-wide: drive the grader after the promotion commit, diff the
 * whole output against the pre-promotion drive, and require **every** differing line to become
 * identical once the HEAD rev is substituted out of both sides.
 *
 * The predicate is derived from what actually varies, not from a `/rev|HEAD/` content test: one of
 * the lines this round's drive produces says "in the tree at <rev>" and contains neither word (426).
 * A count of differing lines is not the predicate either — a count of N passes on any N lines.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..', '..');
const GRADER = 'docs/research/round436-instruments/grade-the-cures-against-a-runtime-oracle.mjs';

const git = (...a) => execFileSync('git', a, { cwd: REPO, encoding: 'utf8' });
const HEAD = git('rev-parse', 'HEAD').trim().slice(0, 8);

const before = readFileSync(join(HERE, 'drive3.before-promotion.out'), 'utf8').split('\n');
// The rev the pre-promotion drive was taken at, read OFF that drive's own stamp line rather than
// recalled — the stamp is the only thing in the file that says which rev produced it.
const stampLine = before.find((l) => l.trim().startsWith('rev ')) ?? '';
const beforeRev = (stampLine.match(/\brev ([0-9a-f]{8})\b/) ?? [])[1] ?? null;

let out;
try { out = execFileSync('node', [GRADER], { cwd: REPO, encoding: 'utf8', maxBuffer: 1 << 28 }); }
catch (e) { out = `${e.stdout ?? ''}${e.stderr ?? ''}`; }
writeFileSync(join(HERE, 'drive4.after-promotion.out'), out);
const after = out.split('\n');

const lines = [];
const say = (s) => { lines.push(s); console.log(s); };

say(`pre-promotion drive  rev ${beforeRev ?? '(unreadable)'}  ${before.length} lines`);
say(`post-promotion drive rev ${HEAD}  ${after.length} lines`);

const diff = [];
for (let i = 0; i < Math.max(before.length, after.length); i += 1) {
  if (before[i] !== after[i]) diff.push(i);
}

let unexplained = [];
if (beforeRev === null || beforeRev === HEAD) {
  say('');
  say(beforeRev === HEAD
    ? `ABORTED: both drives are at ${HEAD}. The promotion commit has not been made, so this `
      + 'instrument has nothing to measure. It is vacuous before promotion and says so (430).'
    : 'ABORTED: the pre-promotion drive carries no readable rev stamp.');
  say('');
  say('PROMOTION: NOT MEASURED');
} else {
  for (const i of diff) {
    const a = (before[i] ?? '').split(beforeRev).join('<HEAD>');
    const b = (after[i] ?? '').split(HEAD).join('<HEAD>');
    const na = (before[i] ?? '').split(beforeRev).length - 1;
    const nb = (after[i] ?? '').split(HEAD).length - 1;
    const ok = a === b && na > 0 && na === nb;
    say(`  [${i}] rev occurrences ${na}/${nb} · identical after substitution ${a === b} · ${ok ? 'explained' : 'UNEXPLAINED'}`);
    if (!ok) {
      unexplained.push(i);
      say(`        before: ${JSON.stringify(before[i])}`);
      say(`        after:  ${JSON.stringify(after[i])}`);
    }
  }
  const gateBefore = before.find((l) => l.startsWith('GATE:')) ?? '';
  const gateAfter = after.find((l) => l.startsWith('GATE:')) ?? '';
  say('');
  say(`  GATE line before: ${gateBefore}`);
  say(`  GATE line after:  ${gateAfter}`);
  say('');
  say(`differing line indices ${JSON.stringify(diff)} · unexplained ${JSON.stringify(unexplained)}`);
  say(unexplained.length === 0
    ? `PROMOTION: ${diff.length} line(s) differ, every differing line explained by the HEAD rev alone`
    : `PROMOTION: ${unexplained.length} line(s) MOVED ACROSS THIS ROUND'S OWN PROMOTION — a figure in `
      + 'this file is pinned to something the promotion changed');
}

writeFileSync(join(HERE, 'promotion-diff.out'), `${lines.join('\n')}\n`);
