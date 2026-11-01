#!/usr/bin/env node
// grepro.mjs — unit-464sat, 2026-10-31 WORK fire (Theseus).
//
// GREPRO, the one gate the pre-registration declared and sat-census.mjs did NOT implement.
// Driven as its own instrument rather than folded into the census, so driving it cannot
// re-stamp drive3.satcensus.out — the recording the published figures were read from.
//
// The claim it grades: my LIVE drive of each cell is the same configuration the tree
// already recorded. If it is not, then my cured drive beside it is pricing a
// configuration nobody filed, and the price is not the cure's price.
//
// A cell with no committed honest recording for its map is published UNAVAILABLE, with
// the reason, and NOT as a pass. An absent answer key is not agreement.

import { readFileSync, readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, basename, posix } from 'node:path';

const REPO = '../../..';
const BASELINE_REV = readFileSync('baseline.rev', 'utf8').trim();
const MY_DIR = 'unit-464sat-2026-10-31';
const git = (...a) => {
  const r = spawnSync('git', ['-C', REPO, ...a], {
    encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 * 1024 * 1024,
  });
  return r.status === 0 ? r.stdout : null;
};

const KEYED = ['GTYPEDDEF ', 'TYPED ', 'MAPVERDICT/'];
const triple = (out) => KEYED.map((p) => out.split('\n').find((l) => l.startsWith(p)) ?? null);

// My own live drives, read off disk by the SAME naming the census wrote them under.
const mine = new Map();
for (const f of readdirSync('.')) {
  const m = f.match(/^drive\d\d\.live-(.+)\.out$/);
  if (m !== null) mine.set(m[1], triple(readFileSync(f, 'utf8')));
}

// Every committed checker recording, keyed on the map it declares and the arms it graded.
const tree = (git('ls-tree', '-r', '--name-only', BASELINE_REV) ?? '').trim().split('\n');
const outs = tree.filter((f) => f.startsWith('docs/research/') && f.endsWith('.out') && !f.includes(MY_DIR));
const recordings = [];
for (const f of outs) {
  const t = git('show', `${BASELINE_REV}:${f}`);
  if (t === null) continue;
  const lines = t.split('\n');
  if (!lines.some((l) => l === '=== grade-filed-maps.mjs ===')) continue;
  const mapDecl = (lines.find((l) => l.startsWith('map    : ')) ?? '').slice('map    : '.length);
  const cripple = (lines.find((l) => l.startsWith('cripple: ')) ?? '').slice('cripple: '.length);
  if (mapDecl === '') continue;
  const arms = lines.filter((l) => l.startsWith('ARM ')).map((l) => l.slice(4).split(/\s/)[0]);
  recordings.push({
    from: f,
    map: posix.normalize(posix.join(dirname(f), mapDecl)),
    cripple,
    arms,
    triple: triple(t),
  });
}
console.log(`GREPROPOP  ${recordings.length} committed grade-filed-maps recording(s) over ${outs.length} .out file(s) at ${BASELINE_REV.slice(0, 8)}`);

const cells = JSON.parse(readFileSync('sat.json', 'utf8')).results.filter((r) => r.refused === undefined);
let agree = 0; let disagree = 0; let unavailable = 0;
for (const c of cells) {
  const tag = `${basename(c.map).replace(/\.md$/, '')}-${c.arm}`;
  const got = mine.get(tag);
  if (got === undefined) {
    console.log(`GREPRO UNAVAILABLE ${tag}: no live drive of mine on disk under that tag`);
    unavailable += 1;
    continue;
  }
  const all = recordings.filter(
    (r) => r.map === c.map && r.cripple === 'none (clean arm)' && r.arms.includes(c.arm),
  );
  // TWO FRESHNESS LEGS, both added after the first drive printed RED on 3 cells and both
  // keyed on a figure the recording itself publishes or git can settle. The first drive's
  // RED was NOT my live drive being wrong:
  //
  //   * GATE-COUNT. A recording made by an older checker publishes `gates=8` or `gates=13`
  //     against my `gates=16`, and `GTYPEDDEF` is simply ABSENT from it — the gate did not
  //     exist yet. Comparing a line that was never printed to one that is cannot be a
  //     disagreement about the map.
  //   * MAP BLOB. `V21-MAP.md`'s blob at the recording's commit differs from its blob at
  //     the baseline rev: my own `unit-464nomoved` cure edited the map at 10-30 19:56,
  //     AFTER the rekey recording was made. The recording graded a different map TEXT.
  //
  // A candidate failing either leg is STALE and published as such. It is not evidence for
  // my drive and it is not evidence against it.
  const myGates = Number((got[2] ?? '').match(/gates=(\d+)/)?.[1]);
  const mapBlobNow = (git('rev-parse', `${BASELINE_REV}:${c.map}`) ?? '').trim();
  const staleReasons = new Map();
  const cands = all.filter((r) => {
    const why = [];
    const g = Number((r.triple[2] ?? '').match(/gates=(\d+)/)?.[1]);
    if (!Number.isFinite(g) || g !== myGates) why.push(`gates=${g} vs my gates=${myGates}`);
    // Keyed on the ADD EVENT, not on recency. `git log -1 -- <recording>` answers "the
    // newest commit touching this file", which is the commit that PRODUCED the recording
    // only while nothing has touched it since. 31 of the 788 committed `.out` files in this
    // tree have been touched after they were added (`unit-464rec-2026-10-31`,
    // `drive13.canitfire.out`), so that is not a hypothetical. The harm direction is the bad
    // one: a re-stamp moves the derived commit FORWARD, reads the map blob at a LATER tree,
    // and so makes a STALE answer key MORE likely to pass the freshness leg — inverting the
    // gate instead of weakening it.
    //
    // Found by taking the sweep Daedalus named in his 10/31 STOP §7.5 rather than assuming
    // my own directories were clean. Of the 64 .mjs in the unit directories, this was the
    // ONLY recency-keyed rev span, and it was the only span in a 308-file surface feeding an
    // answer-key freshness decision.
    //
    // The cure moves NO published figure, and that is measured rather than assumed: at
    // `baseline.rev` the two selectors return the same commit on all 110 members of this
    // population (`drive12.islive.out`, PROBEVERDICT/LATENT), and `recCommit` is used
    // nowhere but the `blobThen` derivation below. The recordings are NOT re-driven — doing
    // so would re-stamp the artefacts this instrument exists to read.
    const recCommit = (git('log', '--diff-filter=A', '--format=%H', '-1', '--', r.from) ?? '').trim();
    const blobThen = recCommit === '' ? '' : (git('rev-parse', `${recCommit}:${c.map}`) ?? '').trim();
    if (blobThen !== mapBlobNow) why.push(`map blob ${blobThen.slice(0, 8) || 'ABSENT'} at the recording's commit vs ${mapBlobNow.slice(0, 8)} at baseline`);
    if (why.length > 0) staleReasons.set(r.from, why.join(' · '));
    return why.length === 0;
  });
  for (const [f, why] of staleReasons) console.log(`     STALE ${basename(f)}: ${why}`);
  if (cands.length === 0) {
    console.log(`GREPRO UNAVAILABLE ${tag}: ${all.length} committed no-cripple recording(s) declare this map and grade this arm, and ${staleReasons.size} of them are STALE — my live drive has no FRESH answer key in the tree, and that is NOT a pass`);
    unavailable += 1;
    continue;
  }
  // Every candidate must agree with my live drive on all three published lines. Comparing
  // against the whole candidate set rather than one of them, so a tree that disagrees with
  // itself shows up as a disagreement instead of my picking the matching recording.
  const bad = cands.filter((r) => r.triple.join('\u0000') !== got.join('\u0000'));
  if (bad.length === 0) {
    agree += 1;
    console.log(`GREPRO ok  ${tag}: ${cands.length} committed no-cripple recording(s) agree with my live drive on GTYPEDDEF, TYPED and MAPVERDICT [${cands.map((r) => basename(r.from)).join(', ')}]`);
  } else {
    disagree += 1;
    console.log(`GREPRO RED ${tag}: ${bad.length} of ${cands.length} committed recording(s) DISAGREE with my live drive`);
    for (const r of bad) {
      console.log(`     vs ${r.from}`);
      KEYED.forEach((p, i) => {
        if (r.triple[i] !== got[i]) {
          console.log(`        tree : ${r.triple[i] ?? '(absent)'}`);
          console.log(`        mine : ${got[i] ?? '(absent)'}`);
        }
      });
    }
  }
}
console.log(
  `\nGREPRO ${disagree === 0 && agree > 0 ? 'ok ' : disagree > 0 ? 'RED' : 'UNMEASURED'} ` +
    `${agree} cell(s) reproduce a committed recording · ${disagree} DISAGREE · ${unavailable} have no committed ` +
    `answer key (UNAVAILABLE, not a pass) of ${cells.length} scored cell(s)`,
);
process.exit(disagree === 0 ? 0 : 2);
