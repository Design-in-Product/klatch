#!/usr/bin/env node
// reach-census.mjs — unit-464reach, 2026-10-31 START fire (Theseus).
//
// Grades Daedalus's 10-31 §3 finding at population scale: G1, G2, P3, P4.
//
// THE READER IS SLICED FROM THE LIVE CHECKER SOURCE, NOT COPIED. Daedalus copied
// `tokensOf` verbatim and gated the copy. A verbatim copy is still a second
// implementation of the key and it goes stale silently the moment the cure he deferred
// lands. Here the function TEXT is sliced out of grade-filed-maps.mjs AT THE BASELINE REV
// (via `git show`, so the subject is rev-pinned and not the working tree) and evaluated,
// so the reader IS the live source bytes.
//
// And the WIDE reader is the SAME sliced text with EXACTLY ONE character class
// substituted — which is literally the cure. So P3's two numbers differ by one character
// class of real source and nothing in this file hand-writes a tokenizer.
//
// Every gate refuses with a non-zero exit and publishes NO reach figure.

import { readFileSync, writeFileSync, statSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const BASELINE_REV = readFileSync('baseline.rev', 'utf8').trim();
const CHECKER_PATH = 'docs/research/unit-464mapkey-2026-10-30/grade-filed-maps.mjs';
const HIS_DIR = '../unit-464authored-2026-10-31';
const REPO = '../../..'; // from docs/research/unit-464reach-2026-10-31/ to the worktree root

let REFUSALS = 0;
const refuse = (leg, why) => {
  console.log(`${leg} REFUSED — ${why}`);
  REFUSALS += 1;
};

// ---------------------------------------------------------------------------
// G1 — HIS ROUND REPRODUCES, READ OFF HIS TREE.
// His argv is DERIVED from his own recording's DENOM lines, not retyped here.
// ---------------------------------------------------------------------------
const hisOutPath = `${HIS_DIR}/quoted-denominator.out`;
const hisOut = readFileSync(hisOutPath, 'utf8');
const hisPairs = hisOut
  .split('\n')
  .filter((l) => l.startsWith('DENOM '))
  .map((l) => {
    const m = l.match(/^DENOM\s+(\S+)\s+\/\s+(\S+):/);
    return m === null ? null : [m[1], m[2]];
  });

if (hisPairs.length === 0 || hisPairs.some((p) => p === null)) {
  refuse('G1', `could not derive argv from ${hisOutPath} DENOM lines (got ${hisPairs.length})`);
} else {
  const argv = hisPairs.flat();
  const r = spawnSync('node', ['quoted-denominator.mjs', ...argv], {
    cwd: HIS_DIR,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  writeFileSync('g1.redrive.out', r.stdout ?? '');
  writeFileSync('g1.redrive.err', r.stderr ?? '');
  const errB = statSync('g1.redrive.err').size;
  const same = (r.stdout ?? '') === hisOut;
  console.log(
    `G1 ${same ? 'ok ' : 'RED'} his quoted-denominator.mjs re-driven unmodified from its own dir ` +
      `(${hisPairs.length} pairs, argv sliced from his own DENOM lines): exit=${r.status} err=${errB}B ` +
      `stdout ${same ? 'BYTE-IDENTICAL to' : 'DIFFERS from'} the committed quoted-denominator.out ` +
      `(${(r.stdout ?? '').length}B vs ${hisOut.length}B)`,
  );
  if (!same) refuse('G1', 'his recording does not reproduce; every figure below is unmeasured');
}

// ---------------------------------------------------------------------------
// G2 — SLICE the reader out of the live checker at the baseline rev.
// Structural gates: anchor occurs EXACTLY once; terminator found; the sliced text
// CONTAINS the boundary under test (so a cured source cannot be graded as uncured).
// ---------------------------------------------------------------------------
const checkerSrc = (() => {
  const r = spawnSync('git', ['-C', REPO, 'show', `${BASELINE_REV}:${CHECKER_PATH}`], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 64 * 1024 * 1024,
  });
  if (r.status !== 0) {
    refuse('G2', `git show ${BASELINE_REV}:${CHECKER_PATH} exited ${r.status}`);
    return null;
  }
  return r.stdout;
})();

const sliceFn = (src, anchor, label) => {
  if (src === null) return null;
  const lines = src.split('\n');
  const starts = [];
  lines.forEach((l, i) => {
    if (l === anchor) starts.push(i);
  });
  if (starts.length !== 1) {
    refuse('G2', `${label}: start anchor ${JSON.stringify(anchor)} occurs ${starts.length}x, not once`);
    return null;
  }
  const start = starts[0];
  let end = -1;
  for (let j = start + 1; j < lines.length; j += 1) {
    if (lines[j] === '};') {
      end = j;
      break;
    }
  }
  if (end === -1) {
    refuse('G2', `${label}: no column-0 '};' terminator after the anchor`);
    return null;
  }
  return { text: lines.slice(start, end + 1).join('\n'), startLine: start + 1, endLine: end + 1 };
};

const BOUNDARY = '(?:^|\\s)';
const CURED_BOUNDARY = '(?:^|[^A-Za-z0-9_.])';

const tokSlice = sliceFn(checkerSrc, 'const tokensOf = (payload) => {', 'tokensOf');
const secSlice = sliceFn(checkerSrc, 'const sectionFor = (mapText, armName) => {', 'sectionFor');

let tokensOf = null;
let tokensOfWide = null;
let sectionFor = null;

if (tokSlice !== null) {
  const occurrences = tokSlice.text.split(BOUNDARY).length - 1;
  if (occurrences !== 1) {
    refuse(
      'G2',
      `the boundary ${BOUNDARY} occurs ${occurrences}x in the sliced tokensOf, not once — ` +
        `a blanket substitution would rewrite its own replacement, and a 0 means the source is ` +
        `already cured and must not be graded as uncured`,
    );
  } else {
    console.log(
      `G2SLICE ok  tokensOf sliced from ${CHECKER_PATH}:${tokSlice.startLine}-${tokSlice.endLine} ` +
        `at ${BASELINE_REV.slice(0, 8)} (${tokSlice.text.length}B); boundary ${BOUNDARY} present exactly once`,
    );
    const mk = (text, tag) => {
      try {
        // eslint-disable-next-line no-new-func
        return new Function(`"use strict";\n${text}\nreturn tokensOf;`)();
      } catch (e) {
        refuse('G2', `${tag}: sliced text did not evaluate (${e.message})`);
        return null;
      }
    };
    tokensOf = mk(tokSlice.text, 'live');
    const wideText = tokSlice.text.replace(BOUNDARY, CURED_BOUNDARY);
    if (wideText === tokSlice.text) {
      refuse('G2', 'the one-character-class substitution changed nothing');
    } else {
      tokensOfWide = mk(wideText, 'wide');
      console.log(
        `G2CURE  ok  WIDE reader is the SAME sliced text with ${BOUNDARY} -> ${CURED_BOUNDARY}, ` +
          `one substitution, ${wideText.length - tokSlice.text.length}B delta`,
      );
    }
  }
}
if (secSlice !== null) {
  try {
    // eslint-disable-next-line no-new-func
    sectionFor = new Function(`"use strict";\n${secSlice.text}\nreturn sectionFor;`)();
    console.log(
      `G2SLICE ok  sectionFor sliced from ${CHECKER_PATH}:${secSlice.startLine}-${secSlice.endLine}`,
    );
  } catch (e) {
    refuse('G2', `sectionFor sliced text did not evaluate (${e.message})`);
  }
}

// --- G2KP: the sliced reader must reproduce the TWO figures the checker's own GKP
// publishes, on the same real slice, and the expected values are SLICED from a committed
// recording rather than typed here.
if (tokensOf !== null) {
  const KP_REC = '../unit-464t2b-sat-2026-10-29/drive2.clean.out';
  const recLines = readFileSync(KP_REC, 'utf8').split('\n');
  let payload = null;
  for (let i = 0; i < recLines.length; i += 1) {
    const m = recLines[i].slice(4).match(/^ ([A-Za-z][A-Za-z0-9_]*): /);
    if (m !== null && m[1] === 'T2bSAT') {
      const next = recLines[i + 1] ?? '';
      if (/^ {6}\S/.test(next)) payload = next.trim();
      break;
    }
  }
  if (payload === null) {
    refuse('G2KP', `T2bSAT payload not readable from ${KP_REC}`);
  } else {
    const got = tokensOf(payload);
    const n = got.size;
    const sel = got.get('selector');
    // The EXPECTATION IS SLICED FROM THE CHECKER'S OWN SOURCE, from the line where GKP
    // states it, and not typed here.
    //
    // First attempt read it off the checker's PRINTED `GKP` line. That line publishes
    // `selector round-trips whole; 11 tokens` and NEVER the selector's value, so the
    // extractor came back `null` and this gate REFUSED — correctly, and the refusal is
    // recorded in drive1.out rather than tidied away. Daedalus's `KPGATE` line asserts
    // the value as `(checker publishes "max(pins first)")`; the checker's STDOUT does not
    // publish it, its SOURCE does, at grade-filed-maps.mjs:613. His value is the
    // checker's own expectation, so the KP is sound; the provenance phrase is imprecise
    // about which surface. Slicing from :613 is what makes mine a slice.
    const expLine = checkerSrc
      .split('\n')
      .find((l) => /kpTokens\.get\('selector'\)\s*===/.test(l)) ?? '';
    const expSel = (expLine.match(/===\s*'([^']*)'/) ?? [])[1];
    const expN = Number((expLine.match(/kpTokens\.size\s*===\s*(\d+)/) ?? [])[1]);
    if (expSel === undefined || !Number.isFinite(expN)) {
      refuse(
        'G2KP',
        `could not slice GKP's own expectation out of the checker source ` +
          `(line=${JSON.stringify(expLine)}) — no figure published`,
      );
    } else {
      const okN = n === expN;
      const okSel = sel === expSel;
      // The PROPERTY the checker's printed line names is "round-trips whole", and what a
      // whitespace split breaks is exactly the space inside the value. Pinned as a
      // property as well as a value, so a future rename of the selector cannot make this
      // gate pass vacuously on a truncated capture.
      const whole = typeof sel === 'string' && /\s/.test(sel);
      console.log(
        `G2KP ${okN && okSel && whole ? 'ok ' : 'RED'} sliced reader on GKP's own real slice: ` +
          `${n} tokens (checker source :613 wants ${expN}), selector=${JSON.stringify(sel)} ` +
          `(checker source :613 wants ${JSON.stringify(expSel)}), round-trips-whole=${whole}`,
      );
      if (!okN || !okSel || !whole) {
        refuse('G2KP', "the sliced reader does not reproduce the checker's own expectation");
      }
    }
  }
}

// --- G2AGREE: the sliced reader must agree with HIS COPY on all four of his pairs,
// NAME SET for NAME SET — member lists compared, not counts.
if (tokensOf !== null && sectionFor !== null && !hisPairs.some((p) => p === null)) {
  let disagreements = 0;
  for (const [mapRel, arm] of hisPairs) {
    const mapPath = mapRel.startsWith('..') ? mapRel : `${HIS_DIR}/${mapRel}`;
    const resolved = mapRel.startsWith('..') ? `${HIS_DIR}/${mapRel}` : mapPath;
    const text = readFileSync(resolved, 'utf8');
    const sec = sectionFor(text, arm);
    if (sec === null) {
      refuse('G2AGREE', `sectionFor refused on ${mapRel} / ${arm}`);
      disagreements += 1;
      continue;
    }
    const mine = new Set();
    for (const l of sec) for (const k of tokensOf(l).keys()) mine.add(k);
    const hisLine = hisOut.split('\n').find((l) => l.startsWith(`DENOM  ${mapRel} / ${arm}:`)) ?? '';
    const hisNames = (hisLine.match(/\[([^\]]*)\]/) ?? [, ''])[1];
    const hisSet = hisNames === '' ? [] : hisNames.split(',');
    const mineSorted = [...mine].sort();
    const same = mineSorted.join(',') === hisSet.join(',');
    if (!same) disagreements += 1;
    console.log(
      `G2AGREE ${same ? 'ok ' : 'RED'} ${mapRel} / ${arm}: sliced=[${mineSorted.join(',')}] ` +
        `his=[${hisSet.join(',')}]`,
    );
  }
  if (disagreements > 0) {
    refuse('G2AGREE', `${disagreements} of ${hisPairs.length} pairs disagree with his copy`);
  }
}

if (REFUSALS > 0) {
  console.log(`\nREFUSED/${REFUSALS} — no reach figure is published. P3 and P4 are UNMEASURED.`);
  process.exit(2);
}

// ---------------------------------------------------------------------------
// Leg D — the POSITIVE key for "is a cripple map", counted and printed.
// ---------------------------------------------------------------------------
const lsTree = spawnSync('git', ['-C', REPO, 'ls-tree', '-r', '--name-only', BASELINE_REV], {
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'pipe'],
  maxBuffer: 64 * 1024 * 1024,
});
if (lsTree.status !== 0) {
  console.log('LEGD REFUSED — git ls-tree exited non-zero');
  process.exit(2);
}
const all = lsTree.stdout.trim().split('\n');
const legA = all.filter((f) => f.startsWith('docs/research/'));
const legB = legA.filter((f) => f.endsWith('.md'));
const legC = legB.filter((f) => /MAP/.test(f.split('/').pop()));
const ARM_HEAD = /^##+ Arm `([^`]+)`/;
const legD = [];
for (const f of legC) {
  const show = spawnSync('git', ['-C', REPO, 'show', `${BASELINE_REV}:${f}`], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 16 * 1024 * 1024,
  });
  if (show.status !== 0) {
    console.log(`LEGD REFUSED — git show failed for ${f}`);
    process.exit(2);
  }
  const arms = show.stdout.split('\n').map((l) => l.match(ARM_HEAD)).filter((m) => m !== null);
  if (arms.length > 0) legD.push({ path: f, arms: arms.map((m) => m[1]), text: show.stdout });
}
console.log(
  `\nLEGS  A=${legA.length} (docs/research/) · B=${legB.length} (.md) · C=${legC.length} ` +
    `(basename /MAP/) · D=${legD.length} (has a \`## Arm \`name\`\` heading)`,
);
console.log(`LEGD-OUT  in C but not D: [${legC.filter((f) => !legD.some((d) => d.path === f)).join(', ')}]`);

// ---------------------------------------------------------------------------
// P3 / P4 — reach and the mechanism, per map.
// ---------------------------------------------------------------------------
const classify = (secLines, name) => {
  // Where does this name's `name=` match sit, and what reaches it?
  //
  // FIRST-IN-SPAN IS KEYED POSITIVELY, on whether any other `name=` token precedes this
  // one INSIDE THE SAME SPAN, and not on `prevChar === '`'`. The first cut keyed it on the
  // preceding character, which files `` ` surface=` `` — a SINGLE-token span padded with a
  // space inside the backticks — under "second-or-later token in a multi-token span", i.e.
  // it credits Daedalus's stated mechanism with a reach class he did not name. Hand-read
  // of V21-MAP.md section line 34 is what caught it; the detector grades it.
  const hits = [];
  let fenced = false;
  secLines.forEach((line, li) => {
    if (/^\s*```/.test(line)) {
      fenced = !fenced;
      return;
    }
    const re = new RegExp(`${name.replace(/\./g, '\\.')}=`, 'g');
    let m;
    while ((m = re.exec(line)) !== null) {
      const prevChar = m.index === 0 ? '^' : line[m.index - 1];
      // inside an inline code span? odd number of backticks strictly before the match
      const backticksBefore = (line.slice(0, m.index).match(/`/g) ?? []).length;
      const inSpan = !fenced && backticksBefore % 2 === 1;
      let firstInSpan = null;
      let spanText = null;
      if (inSpan) {
        const open = line.lastIndexOf('`', m.index);
        const close = line.indexOf('`', m.index);
        spanText = line.slice(open + 1, close === -1 ? line.length : close);
        const before = line.slice(open + 1, m.index);
        // Any other `ident=` token already inside this span, before this one?
        firstInSpan = (before.match(/[A-Za-z][A-Za-z0-9_.]*=/g) ?? []).length === 0;
      }
      hits.push({ li, prevChar, fenced, inSpan, firstInSpan, spanText });
    }
  });
  return hits;
};

const rows = [];
for (const d of legD) {
  for (const arm of d.arms) {
    const sec = sectionFor(d.text, arm);
    if (sec === null) {
      rows.push({ path: d.path, arm, refused: 'sectionFor returned null (heading not unique)' });
      continue;
    }
    const live = new Set();
    const wide = new Set();
    for (const l of sec) {
      for (const k of tokensOf(l).keys()) live.add(k);
      for (const k of tokensOfWide(l).keys()) wide.add(k);
    }
    rows.push({ path: d.path, arm, secLines: sec.length, live: [...live].sort(), wide: [...wide].sort(), sec });
  }
}

console.log('\n--- P3: reach of the live tokenizer vs the one-character-class cure, per map');
let p3Refuted = 0;
let p3Scored = 0;
const p3Refused = [];
for (const r of rows) {
  if (r.refused !== undefined) {
    console.log(`P3ROW REFUSED ${r.path} / ${r.arm}: ${r.refused}`);
    p3Refused.push(`${r.path}/${r.arm}`);
    continue;
  }
  if (r.wide.length === 0) {
    console.log(
      `P3ROW REFUSED ${r.path} / ${r.arm}: wide denominator is 0 over ${r.secLines} section line(s) — ` +
        `a ratio over 0 refuses rather than scoring (this is the rowless probe's shape)`,
    );
    p3Refused.push(`${r.path}/${r.arm}`);
    continue;
  }
  const pct = (100 * r.live.length) / r.wide.length;
  const under10 = pct < 10;
  if (!under10) p3Refuted += 1;
  p3Scored += 1;
  console.log(
    `P3ROW ${under10 ? 'ok ' : 'REFUTES'} ${r.path} / ${r.arm}: live sees ${r.live.length} of ${r.wide.length} ` +
      `= ${pct.toFixed(1)}% over ${r.secLines} section line(s)  live=[${r.live.join(',')}]`,
  );
}
console.log(
  `P3 ${p3Refuted === 0 && p3Scored > 0 ? 'LANDS' : p3Scored === 0 ? 'UNMEASURED' : 'REFUTED'} — ` +
    `${p3Scored} rows-bearing map(s) scored, ${p3Refuted} at or above 10%, ` +
    `${p3Refused.length} refused [${p3Refused.join(', ')}]`,
);
// --- A SECOND measure, added AFTER P3's drive and labelled as such. It is NOT the
// prediction and does not rescue it. P3 was keyed on a RATIO, and the wide denominator
// across the scored maps ranges 9..31, so a fixed percentage threshold is the wrong unit
// for the quantity: the two maps that refute P3 do so by having a SMALLER denominator,
// not by the detector seeing more. The absolute figure is the one the blindness is in.
{
  const scored = rows.filter((r) => r.refused === undefined && r.wide.length > 0);
  const liveCounts = scored.map((r) => r.live.length);
  const wideCounts = scored.map((r) => r.wide.length);
  console.log(
    `P3ABS (added after the drive, NOT the prediction) — across ${scored.length} scored map(s): ` +
      `live reach min=${Math.min(...liveCounts)} max=${Math.max(...liveCounts)}, ` +
      `wide denominator min=${Math.min(...wideCounts)} max=${Math.max(...wideCounts)}. ` +
      `Every scored map is seen by the live detector at ${Math.min(...liveCounts)}-${Math.max(...liveCounts)} ` +
      `distinct name(s). A ratio over a denominator that varies ${Math.min(...wideCounts)}..${Math.max(...wideCounts)} ` +
      `was the wrong unit and that is my error, not a change in the finding.`,
  );
}

console.log('\n--- P4: the mechanism, per SEEN name. Daedalus\'s claim: every seen name is a');
console.log('    second-or-later token inside a multi-token INLINE code span.');
const offMechanism = [];
let seenTotal = 0;
for (const r of rows) {
  if (r.refused !== undefined || r.live.length === 0) continue;
  for (const name of r.live) {
    const hits = classify(r.sec, name);
    // The hit that the live reader actually reached is one whose preceding char is
    // whitespace or line start. Report every hit, and flag the reached ones.
    const reached = hits.filter((h) => h.prevChar === '^' || /\s/.test(h.prevChar));
    seenTotal += 1;
    for (const h of reached) {
      const cls = h.fenced
        ? 'FENCED-BLOCK'
        : h.inSpan
          ? h.firstInSpan
            ? 'INLINE-SPAN-FIRST-PADDED'
            : 'INLINE-SPAN-LATER'
          : 'BARE-PROSE';
      // ONLY `INLINE-SPAN-LATER` is his stated mechanism. Every other class is keyed
      // positively above, so nothing reaches "on mechanism" by falling through.
      const onMech = cls === 'INLINE-SPAN-LATER';
      if (!onMech) offMechanism.push({ path: r.path, arm: r.arm, name, cls, prevChar: h.prevChar, line: h.li });
      console.log(
        `P4HIT ${onMech ? '   ' : '*OFF*'} ${r.path.split('/').slice(-1)[0]} / ${r.arm}  name=${name}  ` +
          `class=${cls}  prevChar=${JSON.stringify(h.prevChar)}  secLine=${h.li}  ` +
          `span=${JSON.stringify(h.spanText)}`,
      );
    }
    if (reached.length === 0) {
      console.log(
        `P4HIT *ODD * ${r.path} / ${r.arm}  name=${name}  class=UNLOCATED — the reader saw it but no ` +
          `whitespace/line-start occurrence was located by the classifier`,
      );
      offMechanism.push({ path: r.path, arm: r.arm, name, cls: 'UNLOCATED', prevChar: null, line: null });
    }
  }
}
{
  const tally = {};
  for (const o of offMechanism) tally[o.cls] = (tally[o.cls] ?? 0) + 1;
  console.log(
    `P4CLASS off-mechanism by class: ${Object.entries(tally).map(([k, v]) => `${k}=${v}`).join(' · ') || '(none)'}`,
  );
}
console.log(
  `P4 ${offMechanism.length > 0 ? 'LANDS' : 'REFUTED'} — ${seenTotal} seen name(s) classified, ` +
    `${offMechanism.length} off his stated mechanism` +
    (offMechanism.length === 0
      ? '. His cause is exactly right at population scale; P4 was written to be lost and it was.'
      : `: [${offMechanism.map((o) => `${o.name}@${o.path.split('/').pop()}:${o.cls}`).join(', ')}]`),
);

console.log('\nCENSUS COMPLETE — gates all green, so the figures above are measured.');
