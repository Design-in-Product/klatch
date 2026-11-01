// Is the defect in `unit-464sat-2026-10-31/grepro.mjs:96` LIVE or LATENT?
//
// The span asks git for "the recording's commit" and gets the NEWEST commit touching the
// recording file. Those are the same commit only while nothing has touched the file since
// it was added. On this track, recordings DO get re-stamped — that is a recorded defect of
// mine from an earlier round — so the question is empirical, not rhetorical.
//
// Direction of harm, stated before the number: a re-stamp moves the derived commit FORWARD,
// so the map blob is read at a LATER tree, which is MORE likely to match the baseline blob.
// The failure is therefore a false FRESH — a stale answer key admitted as evidence. That is
// the exact failure GREPRO exists to prevent, so the defect inverts the gate rather than
// merely weakening it.
//
// Driven from THIS directory. It does not write into unit-464sat and does not drive grepro.

import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const REPO = '../../..';
const BASELINE_REV = readFileSync('baseline.rev', 'utf8').trim();
const SAT_DIR = 'unit-464sat-2026-10-31';

const git = (...a) => {
  const r = spawnSync('git', ['-C', REPO, ...a], {
    encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 * 1024 * 1024,
  });
  return r.status === 0 ? r.stdout : null;
};

// Reproduce grepro's own population selection, at grepro's own baseline rev.
const tree = (git('ls-tree', '-r', '--name-only', BASELINE_REV) ?? '').trim().split('\n');
const outs = tree.filter((f) => f.startsWith('docs/research/') && f.endsWith('.out') && !f.includes(SAT_DIR));

let unreadable = 0;
const recordings = [];
for (const f of outs) {
  const t = git('show', `${BASELINE_REV}:${f}`);
  if (t === null) { unreadable += 1; continue; }
  const lines = t.split('\n');
  if (!lines.some((l) => l === '=== grade-filed-maps.mjs ===')) continue;
  if (!lines.some((l) => l.startsWith('map    : '))) continue;
  recordings.push(f);
}

console.log(`population  ${outs.length} committed .out files outside ${SAT_DIR}; ${recordings.length} are`);
console.log(`            grade-filed-maps recordings with a map declaration (grepro's own filter).`);
console.log(`            ${unreadable} unreadable at the baseline rev — grepro drops these with a bare`);
console.log(`            \`continue\`, which is a separate blindness and is NAMED, not fixed here.`);
console.log('');

let moved = 0; const movedRows = [];
for (const f of recordings) {
  const newest = (git('log', '-1', '--format=%H', '--', f) ?? '').trim();
  const added = (git('log', '--diff-filter=A', '--format=%H', '-1', '--', f) ?? '').trim();
  const same = newest === added && newest !== '';
  if (!same) {
    moved += 1;
    const n = (git('log', '-1', '--format=%h %ad %an', '--date=short', '--', f) ?? '').trim();
    const a = (git('log', '--diff-filter=A', '--format=%h %ad %an', '-1', '--date=short', '--', f) ?? '').trim();
    movedRows.push({ f, newest: n, added: a });
  }
}

console.log(`LIVE?  of the ${recordings.length} recordings grepro ranges over, ${moved} have been touched by a`);
console.log(`       commit LATER than the one that added them.`);
console.log('');
if (moved === 0) {
  console.log('VERDICT  LATENT, not live. The two selectors agree on every member of the');
  console.log('         population TODAY, so the published GREPRO figures are unaffected and');
  console.log('         the cure moves no figure. The defect is a correctness defect in the');
  console.log('         SELECTOR, which the first re-stamp of any recording makes live, and');
  console.log('         nothing in the committed recording would say so when it does.');
} else {
  console.log('VERDICT  LIVE. Members where the two selectors disagree:');
  for (const r of movedRows) {
    console.log(`  ${r.f}`);
    console.log(`     newest: ${r.newest}`);
    console.log(`     added : ${r.added}`);
  }
}
console.log('');
console.log(`PROBEVERDICT/${moved === 0 ? 'LATENT' : 'LIVE'}  ${moved} of ${recordings.length} members disagree`);
