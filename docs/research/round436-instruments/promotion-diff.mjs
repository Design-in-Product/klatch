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
 * ## What the predicate is, after drive 1 of it found two real things
 *
 * Drive 1 required every differing line to be byte-identical after substituting the rev out. That
 * was the wrong key, and re-aiming it rather than loosening it (357) means naming what it was
 * conflating. A promotion legitimately moves two kinds of line:
 *
 *   - **stamps** — the rev, and `worktree DIRTY` becoming `clean` because the commit happened.
 *   - **measurements** — a leg whose detail text reads the tree will print different text after a
 *     commit that adds files to the tree, while its VERDICT stays green. That is the leg working.
 *
 * What his §6 is about is neither: it is a leg whose **verdict** moves on promotion. So the gate is
 * the per-leg VERDICT MAP plus the GATE line, and the differing-line report is kept as evidence
 * rather than as the key. A figure pinned to something the promotion changed shows up as a verdict
 * flip, which is exactly what drive 1 caught: `G1` explained a recording taken at an older rev by
 * substituting out LIVE HEAD, so it went red the instant the promotion commit landed (420/422).
 *
 * The rev each side is explained with is read off that side's own stamp line, with `revStampOf`
 * imported from the grader rather than re-typed (412).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..', '..');
const GRADER = 'docs/research/round436-instruments/grade-the-cures-against-a-runtime-oracle.mjs';

const { revStampOf } = await import(join(HERE, 'grade-the-cures-against-a-runtime-oracle.mjs'));

const git = (...a) => execFileSync('git', a, { cwd: REPO, encoding: 'utf8' });
const HEAD = git('rev-parse', 'HEAD').trim().slice(0, 8);

const beforeText = readFileSync(join(HERE, 'drive3.before-promotion.out'), 'utf8');
const before = beforeText.split('\n');
const beforeRev = revStampOf(beforeText);

/** The per-leg verdict map: `{ G1: true, G5: false, … }`, read off this file's own print format. */
const verdictMap = (ls) => Object.fromEntries(ls
  .map((l) => /^(\s?ok\s|FAIL)\s+(G\d+)\s/.exec(l))
  .filter((m) => m !== null)
  .map((m) => [m[2], m[1].trim() === 'ok']));

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

if (beforeRev === null || beforeRev === HEAD) {
  say('');
  say(beforeRev === HEAD
    ? `ABORTED: both drives are at ${HEAD}. The promotion commit has not been made, so this `
      + 'instrument has nothing to measure. It is vacuous before promotion and says so (430).'
    : 'ABORTED: the pre-promotion drive carries no readable rev stamp.');
  say('');
  say('PROMOTION: NOT MEASURED');
} else {
  // Evidence, not the key: every differing line, classified as a stamp or as moved text.
  const stampish = (s) => (s ?? '').split(beforeRev).join('<R>').split(HEAD).join('<R>')
    .split('DIRTY').join('<W>').split('clean').join('<W>');
  const moved = [];
  for (const i of diff) {
    const isStamp = stampish(before[i]) === stampish(after[i]);
    say(`  [${i}] ${isStamp ? 'a STAMP (rev / worktree state) — explained' : 'text MOVED'}`);
    if (!isStamp) {
      moved.push(i);
      say(`        before: ${JSON.stringify(before[i])}`);
      say(`        after:  ${JSON.stringify(after[i])}`);
    }
  }

  // The key: no leg's VERDICT may move across the promotion, and the GATE line may not either.
  const vb = verdictMap(before);
  const va = verdictMap(after);
  const ids = [...new Set([...Object.keys(vb), ...Object.keys(va)])].sort();
  const flipped = ids.filter((id) => vb[id] !== va[id]);
  const gateBefore = before.find((l) => l.startsWith('GATE:')) ?? '';
  const gateAfter = after.find((l) => l.startsWith('GATE:')) ?? '';
  say('');
  say(`  legs read: ${ids.length} before / ${Object.keys(va).length} after`);
  say(`  GATE line before: ${gateBefore}`);
  say(`  GATE line after:  ${gateAfter}`);
  say(`  VERDICTS FLIPPED: ${flipped.length === 0 ? 'none' : flipped.map((id) => `${id} ${vb[id]}->${va[id]}`).join(', ')}`);
  say('');
  say(`differing line indices ${JSON.stringify(diff)} · of those, text moved (not a stamp): ${JSON.stringify(moved)}`);
  const ok = flipped.length === 0 && ids.length > 0 && gateBefore === gateAfter;
  // `OK` / `RED` is a branch literal, so the leg that reads this line keys on a token and not on
  // a substring of prose (426).
  say(ok
    ? `PROMOTION: OK — ${diff.length} line(s) differ, ${moved.length} of them a measurement reading `
      + 'a changed tree; no leg verdict moved and the GATE line is unchanged'
    : `PROMOTION: RED — ${flipped.length} leg verdict(s) moved across this round's own promotion `
      + `[${flipped.join(', ')}]; a figure in this file is pinned to something the promotion changed`);
}

writeFileSync(join(HERE, 'promotion-diff.out'), `${lines.join('\n')}\n`);
