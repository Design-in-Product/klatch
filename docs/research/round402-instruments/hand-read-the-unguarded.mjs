/**
 * Round 402 — the severity read of the UNGUARDED rows, with the hand reading as the primary
 * instrument and this file as its grader.
 *
 * Three rounds have now agreed on a number and none of them has said what the number MEANS.
 * Daedalus's 399 said 14 of 51 are not cured; my 400 re-scoped his guard leg and said 15; his 401
 * added branch polarity and said 15 again, and closed with the audit instruction "read the 15, not
 * the 36". I named the severity read of the un-hand-read remainder as mine with no blocker and as
 * this fire's first item. This is it.
 *
 * WHY THE HAND READING IS PRIMARY AND THIS FILE IS SECONDARY. The population is 15 rows. At that
 * size a detector is the less reliable of the two readers — my own 341/350 lesson is that a detector
 * which reproduces two published figures exactly can still silently zero the third, and the cure is
 * to make the detector GRADE the hand reading rather than replace it. So the verdicts below are
 * read by eye out of the source at a pinned rev, written into HAND as data, and this file's job is
 * to catch the four ways a hand reading goes wrong:
 *
 *   1. A MISS — a row in the population with no hand entry. GRADE C, coverage leg.
 *   2. An INVENTION — a hand entry naming a site that is not in the population. GRADE C, same leg.
 *   3. THE WRONG LINE — the classic. Every hand entry carries the VERBATIM source line it claims to
 *      be about; GRADE C re-reads that line at the pinned rev and compares bytes. A hand read of a
 *      neighbouring line, or of the live file instead of the pinned one, reddens here. This is the
 *      cheapest strong check available and it is aimed at the one failure I cannot feel happening.
 *   4. A VERDICT THAT RESTS ON A CLAIM NOBODY CHECKED. Three of the verdict classes below rest on a
 *      property that is machine-decidable, so GRADE D decides it independently and requires the hand
 *      table to name EXACTLY the rows it finds — not a subset, not a superset.
 *
 * And because a grade that cannot fail is not a grade (356/369), GRADE C is driven twice more under
 * deliberate corruption: one entry dropped, and one entry's pinned line text altered by a single
 * byte. Both controls must come back FALSE. They are printed, and the gate reads them.
 *
 * THE POPULATION IS PINNED, NOT LIVE. Everything hand-read is read at `a85b4a11` — the rev my own
 * Round 400 `.out` names — for two reasons. It is the tree whose 15 rows were published, so the
 * severity read answers the question that was actually asked; and this file becomes a tracked source
 * the moment it lands, with window calls on named bindings of its own, so a live population would
 * redden this round's own grades on its own promotion (377). One leg is deliberately LIVE and says
 * so: §ANCHOR-LIVE, below, because its finding is that a site has ALREADY fired, and a claim about
 * now cannot be made at a two-day-old rev.
 */

import { readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { namedBindingSites, initRefusal } from './key-from-round400.mjs';

const REPO = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
const HEAD = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: REPO, encoding: 'utf8' }).trim();

const PIN = 'a85b4a1131b60a1a9fd3cd54e08db7beef2f0aa4';
const KEY_PIN = 'b65a7705';
const KEY_SRC_PATH = 'docs/research/round400-instruments/regrade-the-file-scoped-guard.mjs';
const MY_400_OUT = join(REPO, 'docs/research/round400-instruments/regrade-the-file-scoped-guard.out');

const git = (args, cwd = REPO) => execFileSync('git', args, { cwd, encoding: 'utf8', maxBuffer: 1 << 28 });

// ── the hand reading, as data ────────────────────────────────────────────────────────────────────
//
// `line` is the window-call line; `at` is the verbatim text of that line at `a85b4a11`, which GRADE C
// checks byte-for-byte. `verdict` is one of:
//
//   FROZEN     — the haystack the finder searches is an immutable git blob read at a pinned sha, so
//                the anchor cannot drift. Un-guarded and un-guardable-against: there is nothing to
//                guard against. Machine-corroborated by GRADE D.
//   NONNEG     — the modelled refusal value is NOT NEGATIVE, so the window is in range and correct.
//                `lastIndexOf('\n', i) + 1` maps the refusal onto 0, which IS the start of the first
//                line — the refusal is the right answer. Machine-decided by GRADE D.
//   TERM-GUARD — the binding is a compound expression and its refusable TERM is guarded under the
//                term's own name, which a guard keyed on the WINDOW's name cannot see.
//   PRECOND    — guarded by an assert-the-anchor-exists precondition that EXITS or THROWS before the
//                site, rather than by a comparison against -1.
//   DELIBERATE — the site exists in order to BE an unguarded anchor. Not a defect; the measurement.
//   REAL       — unguarded, reachable, and a refusal changes what the file reports.
//
// PRECEDENCE, because two rows qualify under more than one: FROZEN outranks everything, because an
// immutable haystack is not a guard that could be got wrong — there is no live input to refuse. Then
// NONNEG, then TERM-GUARD, then PRECOND. round383:744 is both FROZEN and PRECOND and is filed FROZEN;
// its `why` says both, because the PRECOND half is the thing worth copying.
//
// Written before this file's grades were written, from the source at the pin, one row at a time.
const HAND = [
  {
    p: 'docs/research/round368-instruments/verdict-line-kind-grade.mts',
    line: 128,
    name: 'loopStart',
    at: 'const span = SRC.slice(loopStart, verdictLog);',
    verdict: 'REAL',
    severity: 'HAS ALREADY FIRED — and loudly',
    why:
      'Both anchors are source TEXT of a live file (`scripts/sweep-probes.mjs`) read through '
      + '`readFileSync`, with no rev pin and no guard. The file has since been restructured. See '
      + '§ANCHOR-LIVE: `verdictLog` is -1 at HEAD today, the span is the rest of the file, and C1/C3/C4 '
      + 'go red on a re-drive. Red is the good outcome here — it is the one row of the four REALs whose '
      + 'failure announces itself.',
  },
  {
    p: 'docs/research/round382-instruments/grade-the-class-count-and-the-seam.mjs',
    line: 216,
    name: 'abs',
    at: "    if (blanked.slice(abs, abs + 13) !== 'readFileSync(') continue;",
    verdict: 'TERM-GUARD',
    severity: 'none',
    why:
      '`abs = m.index + m[0].indexOf(init) + at`. Of its three terms, `at` is guarded by '
      + '`if (at < 0) continue;` two lines above the site, and `m[0].indexOf(init)` cannot refuse at all '
      + 'because `init` is `m[2]`, a capture group of `m[0]` and therefore a substring of it. `abs >= 0` '
      + 'always. The guard is invisible to the census because it is keyed on `at`, not on `abs`.',
  },
  {
    p: 'docs/research/round383-instruments/grade-the-binding-class.mjs',
    line: 744,
    name: 'cutAt',
    at: "  writeFileSync(TEMP, old.slice(0, cutAt) + '\\nexport { classUnder, LIVE };\\n');",
    verdict: 'FROZEN',
    severity: 'none',
    why:
      'Filed FROZEN on precedence and it is the weaker half of the reading: `old` is `prerefactor`, '
      + "which is `git(['show', 'e922394b:docs/research/round383-instruments/grade-the-binding-class.mjs'])` "
      + '— an immutable blob. The half worth copying is that it is ALSO PRECOND: `cutAt = '
      + 'old.search(OLD_MARKER)` is unguarded against -1, and the line immediately before the site is '
      + '`if (oldMarkers !== 1) throw new Error(...)`, where `oldMarkers` counts matches of the SAME '
      + 'pattern — 0 occurrences throws before the slice. That is the cure spelling of the shape round396 '
      + 'below gets wrong. My first reading of this row filed it PRECOND and missed the pin; GRADE D is '
      + 'what said so.',
  },
  {
    p: 'docs/research/round384-instruments/grade-the-near-miss-attribution.mjs',
    line: 89,
    name: 'abs',
    at: "    const liveRead = at >= 0 && blanked.slice(abs, abs + 13) === 'readFileSync(';",
    verdict: 'TERM-GUARD',
    severity: 'none',
    why:
      'Same compound as round382, and the guard is tighter: `at >= 0 &&` short-circuits on the SAME '
      + 'line, to the left of the window call. Positionally before the site and still invisible, for the '
      + 'same reason — the guard names `at` and the window names `abs`.',
  },
  {
    p: 'docs/research/round388-instruments/grade-the-uncaught-drive-and-the-window.mjs',
    line: 169,
    name: 'c1Name',
    at: 'const c1Claim = hisSrc.slice(c1Name, c1Pred);',
    verdict: 'FROZEN',
    severity: 'none',
    why:
      '`hisSrc` is `hisAtPin`, which is `git show ${SHIPPED}:docs/research/round387-instruments/...` — '
      + 'an immutable blob at a pinned commit. The anchor `"  \'C1\',"` either occurs in that blob forever '
      + 'or never, and the instrument is recorded green, so it occurs. Nothing can drift underneath it.',
  },
  {
    p: 'docs/research/round390-instruments/grade-the-declaration-and-the-object-key.mjs',
    line: 198,
    name: 'r1Start',
    at: 'const r1ClaimMentionsLive = liveIdents.filter((id) => his389.slice(r1Start, r1End).includes(id));',
    verdict: 'FROZEN',
    severity: 'none',
    why:
      '`his389 = show(HIS_389_PIN, HIS_389_PATH)` with `HIS_389_PIN = \'311e5810\'` — pinned, immutable. '
      + 'Worth saying because the near miss is instructive: this file ALSO holds `his389Live`, and the '
      + 'comment at :186-191 records that an earlier spelling of this very grade read the STRIPPED copy, '
      + 'got -1, hit the `indexOf(x, -1)` fromIndex clamp, and "read a garbage span and reported 0 live '
      + 'identifiers in a predicate it had never looked at". The defect is documented beside the code; '
      + 'what makes the shipped line safe is the pin, not a guard.',
  },
  {
    p: 'docs/research/round393-instruments/grade-the-grade-that-is-green-on-one-machine.mjs',
    line: 133,
    name: 'end',
    at: '    const body = rest.slice(0, end);',
    verdict: 'REAL',
    severity: 'silent over-span, formatting-dependent',
    why:
      "`end = rest.indexOf('\\n);')` unguarded; a refusal makes `body` the whole rest of the file "
      + '(FAILS WIDE), and the next line takes `body.lastIndexOf(\'`,\\n  \')` — so the "verdict" attributed '
      + "to grade N becomes some later grade's verdict, silently. The tell that this is an oversight "
      + "rather than a judgement: the VERY NEXT LINE guards its own refusal value (`i < 0 ? body : "
      + "body.slice(i + 4)`). Same author, same shape, two lines apart, one guarded.",
  },
  {
    p: 'docs/research/round396-instruments/the-key-counterfactuals.mjs',
    line: 87,
    name: 'i',
    at: "report('CF-2 — first marker phrase \"rather than\" → \"instead of\"', { file: SUBJ, text: `${pristine.slice(0, i)}instead of${pristine.slice(i + 11)}` }, 'D1 RED');",
    verdict: 'REAL',
    severity: 'a counterfactual that can pass for the wrong reason',
    why:
      "`i = pristine.indexOf('rather than')`. The occurrence count IS computed, one line up — and then "
      + 'PRINTED (`console.log(\'(\'rather than\' occurs ${n}× ...)\')`) rather than asserted. If the phrase '
      + 'went away, `i` is -1, the mutation becomes `slice(0,-1) + \'instead of\' + slice(10)` — a '
      + 'corrupted subject rather than the one-phrase substitution CF-2 claims — and the expectation for '
      + 'CF-2 is `D1 RED`, which a corrupted subject would very likely also produce. The counterfactual '
      + 'would pass while testing something else. This is 347 (assert the anchor before mutating) in my '
      + 'own instrument, and both window calls on the line carry it.',
  },
  {
    p: 'docs/research/round396-instruments/the-key-counterfactuals.mjs',
    line: 87,
    name: 'i',
    at: "report('CF-2 — first marker phrase \"rather than\" → \"instead of\"', { file: SUBJ, text: `${pristine.slice(0, i)}instead of${pristine.slice(i + 11)}` }, 'D1 RED');",
    verdict: 'REAL',
    severity: 'a counterfactual that can pass for the wrong reason',
    why: 'The second window call on the same line — `pristine.slice(i + 11)`. Same mechanism, same cure.',
  },
  {
    p: 'docs/research/round397-instruments/probe-the-anchor-that-is-not-guarded.mjs',
    line: 88,
    name: 'eol',
    at: '  return `${src.slice(0, eol + 1)}type Row = { tag: string };\\n${src.slice(eol + 1)}`;',
    verdict: 'PRECOND',
    severity: 'none',
    why:
      'The module refuses before anything is mutated: `if (markerHits !== 1 || typeRowHits !== 1) '
      + "{ console.log('REFUSED to mutate: an anchor is not unique.'); process.exit(1); }`, under a comment "
      + 'citing 347. `reintroduce` is only ever called on a source where the marker is present. This is '
      + 'the same cure as round383 and the direct counterpart of round396 above — one round later, in my '
      + 'own instruments, the count is asserted instead of printed.',
  },
  {
    p: 'docs/research/round397-instruments/probe-the-anchor-that-is-not-guarded.mjs',
    line: 88,
    name: 'eol',
    at: '  return `${src.slice(0, eol + 1)}type Row = { tag: string };\\n${src.slice(eol + 1)}`;',
    verdict: 'PRECOND',
    severity: 'none',
    why: 'The second window call on the same line — `src.slice(eol + 1)`. Same precondition covers it.',
  },
  {
    p: 'docs/research/round397-instruments/probe-the-anchor-that-is-not-guarded.mjs',
    line: 108,
    name: 'idx',
    at: '  const sliced = src.slice(idx);',
    verdict: 'DELIBERATE',
    severity: 'none',
    why:
      'Hand-read in Round 400 and unchanged on re-reading: the probe exists to demonstrate an anchor '
      + 'that is not guarded. `sliced.length` is the measurement it prints; :109 reaches for the same '
      + 'index wrapped in `Math.max(idx, 0)`, and :113 prints `idx !== -1` as a column. The two "guards" '
      + 'the census sees in the file are both on :113 and both below the site.',
  },
  {
    p: 'scripts/lib/skipped-shape-census.mts',
    line: 255,
    name: 'lineStart',
    at: '      const line = src.slice(lineStart, nl === -1 ? undefined : nl);',
    verdict: 'NONNEG',
    severity: 'none',
    why:
      "`lineStart = src.lastIndexOf('\\n', m.index) + 1`. The `+ 1` maps the refusal -1 onto 0, and 0 is "
      + 'the correct start of the first line. The key models the `+ 1` (its own `initRefusal` returns 0) '
      + 'and then counts the site anyway. Note the second argument is guarded explicitly '
      + '(`nl === -1 ? undefined : nl`) — this author guarded the refusal that needed it and left the one '
      + 'that does not.',
  },
  {
    p: 'scripts/probe-round224-a-skip-must-not-summarise-as-a-pass.mts',
    line: 1931,
    name: 'ls',
    at: '        if (/^\\s*(?:\\*|\\/\\/)/.test(src.slice(ls, nlIdx === -1 ? undefined : nlIdx))) continue;',
    verdict: 'NONNEG',
    severity: 'none',
    why: 'The same start-of-line idiom, the same explicit guard on the other argument. Identical reading.',
  },
  {
    p: 'scripts/probe-round283-the-classification-theseus-asked-for-exists-and-it-has-been-red-since-yesterday.mts',
    line: 162,
    name: 'defStart',
    at: "const deferredAtTip = (stripped.slice(defStart, defEnd).match(/'probe-[^']+'/g) ?? []).length;",
    verdict: 'FROZEN',
    severity: 'none',
    why:
      "`stripped` is `stripSource(atTip)`, and `atTip` is `git show 047e5f06:scripts/sweep-probes.mjs` — "
      + 'a literal sha. The anchor `export const DEFERRED` is in that blob permanently. This is the row '
      + 'that makes the FROZEN class worth naming rather than folding into "benign": it is the same '
      + 'un-guarded shape as round368 above, reading the same file, and the only difference between a row '
      + 'that has already fired and one that never can is whether the read went through `git show`.',
  },
];

// ── the population, at the pin, in a detached worktree ───────────────────────────────────────────

const WT = join(REPO, '.testdata/round402-pin');
const removeWt = () => {
  if (existsSync(WT)) {
    try { git(['worktree', 'remove', '--force', WT]); } catch { /* best effort on every exit path */ }
  }
};

const driveAtPin = () => {
  removeWt();
  git(['worktree', 'add', '--detach', '--quiet', WT, PIN]);
  const at = git(['rev-parse', 'HEAD'], WT).trim();
  const files = git(['ls-files'], WT).split('\n').filter((p) => /\.(mjs|cjs|js|mts|cts|ts|tsx)$/.test(p));
  const sites = [];
  const srcOf = new Map();
  for (const p of files) {
    const src = readFileSync(join(WT, p), 'utf8');
    srcOf.set(p, src);
    for (const hit of namedBindingSites(src, 'both')) sites.push({ p, ...hit });
  }
  const file = [];
  for (const p of files) for (const hit of namedBindingSites(srcOf.get(p), 'file')) file.push({ p, ...hit });
  return { at, nFiles: files.length, sites, file, srcOf };
};

const pop = driveAtPin();
const UNGUARDED = pop.sites.filter((r) => !r.guarded);

// ── GRADE A — the copied key is byte-identical to round400's, at round400's commit ───────────────
//
// Refuses with null rather than falling back to "close enough" (393). The pin is a commit, so this
// cannot redden because round400's live file changed — only because MY copy drifted.

const gradeA = (() => {
  let theirs = null;
  try {
    theirs = git(['show', `${KEY_PIN}:${KEY_SRC_PATH}`]).split('\n').slice(64, 257).join('\n');
  } catch {
    return null;
  }
  let mine = null;
  try {
    const self = readFileSync(join(REPO, 'docs/research/round402-instruments/key-from-round400.mjs'), 'utf8');
    const b = self.indexOf('// ── PROVENANCE: VERBATIM BEGIN');
    const e = self.indexOf('// ── PROVENANCE: VERBATIM END');
    if (b < 0 || e < 0 || e <= b) return null;
    mine = self.slice(self.indexOf('\n', b) + 1, e).replace(/\n+$/, '');
  } catch {
    return null;
  }
  return { ok: mine === theirs, theirsLen: theirs.length, mineLen: mine.length };
})();

console.log('\n── GRADE A: the copied key is byte-identical to round400\'s, at round400\'s own commit ──');
if (gradeA === null) {
  console.log('  REFUSED — the slice could not be read at both ends; no figure is published off it');
} else {
  console.log(`  ${KEY_PIN}:${KEY_SRC_PATH} lines 65-257 — ${gradeA.theirsLen} bytes`);
  console.log(`  key-from-round400.mjs between the provenance markers — ${gradeA.mineLen} bytes`);
  console.log(`  GRADE A (same key, same population): ${gradeA.ok}`);
}

// ── GRADE B — the population reproduces the counts my own Round 400 .out published ───────────────
//
// Parsed out of the `.out`, not restated from the memo (395). Refuses with null if any of the four
// figures or the FAILS OPEN rows cannot be found, so a parse failure cannot read as agreement (393).

const my400 = (() => {
  if (!existsSync(MY_400_OUT)) return null;
  const txt = readFileSync(MY_400_OUT, 'utf8');
  const rev = /REGRADE OK at ([0-9a-f]{40})/.exec(txt);
  const fileLeg = /^ {2}file {2}sites (\d+) {2}GUARDED (\d+) {2}UNGUARDED (\d+)$/m.exec(txt);
  const bothLeg = /^ {2}both {2}sites (\d+) {2}GUARDED (\d+) {2}UNGUARDED (\d+)$/m.exec(txt);
  const open = [...txt.matchAll(/^ {4}(\S+):(\d+) {2}\(`([^`]+)` bound at :(\d+)\)$/gm)].map((m) => `${m[1]}:${m[2]}:${m[3]}@${m[4]}`);
  if (rev === null || fileLeg === null || bothLeg === null || open.length === 0) return null;
  return {
    rev: rev[1],
    file: { sites: +fileLeg[1], guarded: +fileLeg[2], unguarded: +fileLeg[3] },
    both: { sites: +bothLeg[1], guarded: +bothLeg[2], unguarded: +bothLeg[3] },
    open,
  };
})();

const sameMultiset = (a, b) => {
  const x = [...a].sort();
  const y = [...b].sort();
  return x.length === y.length && x.every((v, i) => v === y[i]);
};

const myOpen = UNGUARDED.filter((r) => r.stratum === 'FAILS OPEN').map((r) => `${r.p}:${r.line}:${r.name}@${r.bindingLine}`);

const gradeB = (() => {
  if (my400 === null) return null;
  return {
    ok:
      pop.at === PIN
      && my400.rev === PIN
      && pop.file.length === my400.file.sites
      && pop.file.filter((r) => r.guarded).length === my400.file.guarded
      && pop.file.filter((r) => !r.guarded).length === my400.file.unguarded
      && pop.sites.length === my400.both.sites
      && pop.sites.filter((r) => r.guarded).length === my400.both.guarded
      && UNGUARDED.length === my400.both.unguarded
      && sameMultiset(myOpen, my400.open),
  };
})();

console.log('\n── GRADE B: the population is the one my Round 400 .out published, at the rev it names ──');
if (gradeB === null) {
  console.log('  REFUSED — my own round400 .out did not parse; no figure is published off it');
} else {
  console.log(`  .out says    ${my400.rev} — file ${my400.file.sites}/${my400.file.guarded}/${my400.file.unguarded}, both ${my400.both.sites}/${my400.both.guarded}/${my400.both.unguarded}, ${my400.open.length} FAILS OPEN`);
  console.log(`  this drive   ${pop.at} — file ${pop.file.length}/${pop.file.filter((r) => r.guarded).length}/${pop.file.filter((r) => !r.guarded).length}, both ${pop.sites.length}/${pop.sites.filter((r) => r.guarded).length}/${UNGUARDED.length}, ${myOpen.length} FAILS OPEN`);
  console.log(`  GRADE B (same rev, same four figures, same FAILS OPEN rows): ${gradeB.ok}`);
}

// ── GRADE C — the hand table is complete, un-invented, and reading the lines it says it is ───────

const rowKey = (r) => `${r.p}:${r.line}:${r.name}`;

const gradeCunder = (hand) => {
  const rows = UNGUARDED.map(rowKey).sort();
  const hands = hand.map(rowKey).sort();
  const covered = sameMultiset(rows, hands);
  const textMismatch = [];
  for (const h of hand) {
    const src = pop.srcOf.get(h.p);
    const actual = src === undefined ? null : src.split('\n')[h.line - 1];
    if (actual === null || actual === undefined || actual !== h.at) {
      textMismatch.push({ ...h, actual: actual ?? '<file not in the pinned population>' });
    }
  }
  return { covered, textOk: textMismatch.length === 0, textMismatch, rows, hands };
};

const gradeCmain = gradeCunder(HAND);

// The controls. A coverage leg that is a filter of the population and a text leg that recomputes
// what it grades are both hollow unless they are shown to fail (369). One row dropped; one row's
// pinned text altered by a single byte. Both must come back false, and the gate reads them.
const ctlDropped = gradeCunder(HAND.slice(1));
const ctlCorrupted = gradeCunder(HAND.map((h, i) => (i === 0 ? { ...h, at: `${h.at} ` } : h)));

console.log('\n── GRADE C: the hand reading is complete, un-invented, and on the right lines ──');
console.log(`  population UNGUARDED rows: ${gradeCmain.rows.length}    hand entries: ${gradeCmain.hands.length}`);
console.log(`  coverage (every row read exactly once, no entry invented): ${gradeCmain.covered}`);
console.log(`  pinned line text matches at ${PIN.slice(0, 8)} for all ${HAND.length} entries: ${gradeCmain.textOk}`);
for (const m of gradeCmain.textMismatch) {
  console.log(`    MISMATCH ${m.p}:${m.line}`);
  console.log(`      hand   : ${JSON.stringify(m.at)}`);
  console.log(`      actual : ${JSON.stringify(m.actual)}`);
}
if (!gradeCmain.covered) {
  for (const k of gradeCmain.rows.filter((x) => !gradeCmain.hands.includes(x))) console.log(`    UNREAD row: ${k}`);
  for (const k of gradeCmain.hands.filter((x) => !gradeCmain.rows.includes(x))) console.log(`    INVENTED entry: ${k}`);
}
console.log('  controls — both must be false, or the legs above grade nothing:');
console.log(`    one entry dropped      → coverage ${ctlDropped.covered}`);
console.log(`    one entry text +1 byte → text     ${ctlCorrupted.textOk}`);
const gradeC = gradeCmain.covered && gradeCmain.textOk && ctlDropped.covered === false && ctlCorrupted.textOk === false;
console.log(`  GRADE C: ${gradeC}`);

// ── GRADE D — the three machine-decidable verdict classes, decided here and not taken from HAND ──

// D1 — NONNEG. The key's own arithmetic answers this: a site whose modelled refusal value is >= 0
// has an in-range window. Decided by calling round400's `initRefusal` on the row's initializer.
const nonneg = UNGUARDED.filter((r) => {
  const v = initRefusal(r.init);
  return v !== null && v >= 0;
}).map(rowKey);
const handNonneg = HAND.filter((h) => h.verdict === 'NONNEG').map(rowKey);

// The NONNEG verdict is only benign when the offset the refusal lands on is the RIGHT answer, which
// is a property of the anchor, not of the arithmetic. `indexOf(x) + 5` would also be non-negative and
// would be wrong. So: how many of the non-negative rows are NOT the start-of-line idiom? That number
// is the part of this verdict the arithmetic does not justify, and it is reported rather than assumed.
const SOL_IDIOM = /lastIndexOf\(\s*'\\n'\s*,[^)]*\)\s*\+\s*1\s*$/;
const nonnegNotIdiom = UNGUARDED.filter((r) => {
  const v = initRefusal(r.init);
  return v !== null && v >= 0 && !SOL_IDIOM.test(r.init.trim());
}).map(rowKey);

// D2 — FROZEN. The receiver of the finder call is bound, within the same file, to an expression that
// reaches a `git show` — chased to depth 3 through bare-identifier aliases, because round388 goes
// `hisSrc` → `hisAtPin` → `git(['show', …])` and a depth-1 reader would call it live.
//
// THE RESOLUTION IS NEAREST-PRECEDING-BY-OFFSET, and the first spelling of this leg was not. It took
// the FIRST `const <name> =` in the file, which is 341/399's bug one level up — written into the leg
// whose whole job was to corroborate a hand reading of that very bug. It returned 5 against a hand
// reading of 3: round383:744, where the hand reading was wrong (below), and round393:133, where the
// LEG was wrong. `rest` there chases to `src`, which is a PARAMETER of `chainsOf(src)`; the file also
// holds `const src = show(pin, f)` 240 lines BELOW the site, and a file-scoped reader resolved the
// parameter to it and called the row frozen. The hand reading is what caught it, which is the whole
// reason this file is built the way round — and D4 keeps that row as the standing control.
const receiverOf = (r) => {
  const m = new RegExp(`=\\s*([A-Za-z_$][\\w$.]*)\\s*\\.(?:indexOf|lastIndexOf|search|findIndex)\\s*\\(`).exec(r.init.length ? `= ${r.init}` : '');
  return m === null ? null : m[1];
};
// The nearest binding of `name` that STARTS before `limit`. Candidates are collected first and the
// nearest chosen afterwards — not filtered to the interesting ones before resolving (341/399).
const initOfName = (src, name, limit) => {
  const re = new RegExp(`\\b(?:const|let|var)\\s+${name.replace(/[$]/g, '\\$')}\\s*=\\s*([^;]*);`, 'g');
  let best = null;
  for (let m = re.exec(src); m; m = re.exec(src)) {
    if (m.index >= limit) continue;
    if (best === null || m.index > best.at) best = { at: m.index, init: m[1] };
  }
  return best;
};
const reachesShow = (src, expr, limit, depth = 0) => {
  if (expr === null || depth > 3) return false;
  if (/\bshow\b/.test(expr)) return true;
  const ids = [...expr.matchAll(/\b([A-Za-z_$][\w$]*)\b/g)].map((m) => m[1]);
  for (const id of ids) {
    const next = initOfName(src, id, limit);
    if (next !== null && next.init !== expr && reachesShow(src, next.init, next.at, depth + 1)) return true;
  }
  return false;
};
const frozen = UNGUARDED.filter((r) => {
  const recv = receiverOf(r);
  const src = pop.srcOf.get(r.p);
  if (recv === null || src === undefined) return false;
  const b = initOfName(src, recv, r.off);
  return b === null ? false : reachesShow(src, b.init, b.at, 0);
}).map(rowKey);
const handFrozen = HAND.filter((h) => h.verdict === 'FROZEN').map(rowKey);

// D3 — known negative, axis: no `git show` anywhere in the chain. round368's receiver is `SRC`, bound
// to a `readFileSync` of a live path, and it is the row this round's live finding is about: it must
// NOT come back FROZEN, or D2 is a leg that says yes to everything.
const kn = UNGUARDED.find((r) => r.p.includes('round368-instruments') && r.line === 128);
const knFrozen = kn === undefined ? null : frozen.includes(rowKey(kn));

// D4 — known negative, a DIFFERENT axis: a `show`-reaching binding of the receiver's own name exists
// in the file, but AFTER the site. Only a position-aware resolver says no here, so this row is the
// control for the bug the first spelling of D2 had. One axis each (382/383).
const kn2 = UNGUARDED.find((r) => r.p.includes('round393-instruments') && r.line === 133);
const kn2Frozen = kn2 === undefined ? null : frozen.includes(rowKey(kn2));

console.log('\n── GRADE D: the machine-decidable verdict classes, decided independently of the hand table ──');
console.log(`  D1 NONNEG (modelled refusal value >= 0, by round400's own initRefusal): ${nonneg.length}`);
for (const k of nonneg) console.log(`       ${k}`);
console.log(`     hand table names ${handNonneg.length}; exact same rows: ${sameMultiset(nonneg, handNonneg)}`);
console.log(`     of those, NOT the lastIndexOf('\\n', …) + 1 idiom (where 0 is not obviously right): ${nonnegNotIdiom.length}`);
console.log(`  D2 FROZEN (receiver reaches a \`git show\` within the file, depth <= 3): ${frozen.length}`);
for (const k of frozen) console.log(`       ${k}`);
console.log(`     hand table names ${handFrozen.length}; exact same rows: ${sameMultiset(frozen, handFrozen)}`);
console.log(`  D3 known negative, axis "no show in the chain" — round368:128 must NOT be FROZEN: ${knFrozen === false}`);
console.log(`  D4 known negative, axis "a show-reaching binding of the same name, BELOW the site" — round393:133 must NOT be FROZEN: ${kn2Frozen === false}`);
const gradeD = sameMultiset(nonneg, handNonneg) && sameMultiset(frozen, handFrozen)
  && knFrozen === false && kn2Frozen === false && nonnegNotIdiom.length === 0;
console.log(`  GRADE D: ${gradeD}`);

// ── ANCHOR-LIVE — the one leg that is deliberately about NOW ─────────────────────────────────────
//
// The round368 row's verdict is that it has already fired. That cannot be measured at a two-day-old
// pin. Both anchor literals are pulled out of round368's own source rather than transcribed (394/395
// — a transcribed anchor is a different string from the one that runs), and counted in the LIVE
// subject. Then its C1/C3/C4 are recomputed over the span the drift actually produces.

const live = (() => {
  const r368p = join(REPO, 'docs/research/round368-instruments/verdict-line-kind-grade.mts');
  const subjp = join(REPO, 'scripts/sweep-probes.mjs');
  if (!existsSync(r368p) || !existsSync(subjp)) return null;
  const r368 = readFileSync(r368p, 'utf8');
  const SRC = readFileSync(subjp, 'utf8');
  const litOf = (re) => {
    const m = re.exec(r368);
    if (m === null) return null;
    try { return Function(`return (${m[1]});`)(); } catch { return null; }
  };
  const A = litOf(/const loopStart = SRC\.indexOf\((.*)\);/);
  const B = litOf(/const verdictLog = SRC\.indexOf\((.*)\);/);
  if (typeof A !== 'string' || typeof B !== 'string') return null;
  const loopStart = SRC.indexOf(A);
  const verdictLog = SRC.indexOf(B);
  const span = SRC.slice(loopStart, verdictLog);
  const acc = (s) => [...new Set([...s.matchAll(/(\w+)\s*\+= 1;/g)].map((m) => m[1]))].sort();
  const anchor = "if (state === 'BLOCKED') blocked += 1;";
  return {
    A, B,
    aHits: SRC.split(A).length - 1,
    bHits: SRC.split(B).length - 1,
    loopStart,
    verdictLog,
    srcLen: SRC.length,
    spanLen: span.length,
    restLen: SRC.length - loopStart,
    c1: acc(span),
    c3: span.split(anchor).length - 1,
  };
})();

console.log('\n── ANCHOR-LIVE: the round368 row, measured at live HEAD rather than at the pin ──');
if (live === null) {
  console.log('  REFUSED — an anchor literal could not be read out of round368\'s source; no live claim is made');
} else {
  console.log(`  HEAD ${HEAD.slice(0, 8)} · subject scripts/sweep-probes.mjs, ${live.srcLen} bytes`);
  console.log(`  anchor 1 ${JSON.stringify(live.A)} → ${live.aHits} occurrence(s), offset ${live.loopStart}`);
  console.log(`  anchor 2 ${JSON.stringify(live.B)} → ${live.bHits} occurrence(s), offset ${live.verdictLog}`);
  console.log(`  span SRC.slice(${live.loopStart}, ${live.verdictLog}) is ${live.spanLen} bytes; the rest of the file from the loop head is ${live.restLen}`);
  console.log(`  C1 accumulators in that span: [${live.c1.join(', ')}] — the grade asserts [blocked, red]`);
  console.log(`  C3 mutation anchor occurrences in that span: ${live.c3} — the grade asserts 1`);
}
const liveFired = live !== null && live.bHits === 0 && live.verdictLog === -1
  && !sameMultiset(live.c1, ['blocked', 'red']) && live.c3 !== 1;
console.log(`  ANCHOR-LIVE (the second anchor is gone, and C1 and C3 would both be red on a re-drive): ${liveFired}`);

// ── the gate, BEFORE any headline ────────────────────────────────────────────────────────────────

const legs = {
  'GRADE A': gradeA === null ? null : gradeA.ok,
  'GRADE B': gradeB === null ? null : gradeB.ok,
  'GRADE C': gradeC,
  'GRADE D': gradeD,
  'ANCHOR-LIVE': liveFired,
};
console.log('\n── gate ──');
let failed = false;
for (const [k, v] of Object.entries(legs)) {
  if (v !== true) failed = true;
  console.log(`  ${v === true ? 'ok  ' : 'FAIL'} ${k}: ${v}`);
}
if (failed) {
  console.log('\nHAND READ REFUSED — a leg above is not true, so no severity figure is published off it.');
  removeWt();
  process.exit(1);
}

// ── the severity read ────────────────────────────────────────────────────────────────────────────
//
// Derived into constants first and then printed, never recomputed inside the sentence (380/397).

const byVerdict = {};
for (const h of HAND) (byVerdict[h.verdict] ??= []).push(h);
const ROWS = UNGUARDED.length;
const REAL = (byVerdict.REAL ?? []).length;
const BENIGN = ROWS - REAL;
const REAL_LINES = [...new Set((byVerdict.REAL ?? []).map((h) => `${h.p}:${h.line}`))];
const REAL_FILES = [...new Set((byVerdict.REAL ?? []).map((h) => h.p))];

// The un-hand-read remainder, in the unit the audit instruction is given in. My Round 400 memo said
// "the 11 unguarded sites neither of us has hand-read" — a figure derived as his 14 minus the 3
// round397 rows, in a round whose own key had already moved 14 to 15. Re-derived here at the
// cure's granularity (345) and in the unit I actually published it in (379).
const PRE_READ = HAND.filter((h) => h.p.includes('round397-instruments')).map(rowKey);
const REMAINDER = UNGUARDED.filter((r) => !PRE_READ.includes(rowKey(r)));
const REMAINDER_LINES = [...new Set(REMAINDER.map((r) => `${r.p}:${r.line}`))].length;
const REMAINDER_FILES = [...new Set(REMAINDER.map((r) => r.p))].length;

console.log(`\n── the severity read of the ${ROWS} at ${PIN.slice(0, 8)} ──`);
for (const v of ['REAL', 'DELIBERATE', 'PRECOND', 'TERM-GUARD', 'FROZEN', 'NONNEG']) {
  const rows = byVerdict[v] ?? [];
  console.log(`\n  ${v} — ${rows.length} row(s)`);
  for (const h of rows) console.log(`    ${h.p}:${h.line}  \`${h.name}\`  [${h.severity}]`);
}

console.log(`\n  rows ${ROWS} · distinct lines ${[...new Set(UNGUARDED.map((r) => `${r.p}:${r.line}`))].length} · distinct files ${[...new Set(UNGUARDED.map((r) => r.p))].length}`);
console.log(`  REAL ${REAL} row(s) at ${REAL_LINES.length} line(s) in ${REAL_FILES.length} file(s); not-a-defect ${BENIGN}`);
console.log(`  the remainder my 400 called "the 11": ${REMAINDER.length} rows at ${REMAINDER_LINES} lines in ${REMAINDER_FILES} files`);

console.log(
  `\nHAND READ OK at ${PIN.slice(0, 8)} — of the ${ROWS} UNGUARDED rows three rounds have now counted and none has read, `
  + `${REAL} are defects and ${BENIGN} are not. The ${BENIGN} are not cured and never needed curing: ${(byVerdict.FROZEN ?? []).length} read an `
  + `immutable git blob, ${(byVerdict.NONNEG ?? []).length} map their refusal onto the correct index by a trailing \`+ 1\`, `
  + `${(byVerdict['TERM-GUARD'] ?? []).length} are compound initializers whose refusable term is guarded under the term's own name, `
  + `${(byVerdict.PRECOND ?? []).length} are guarded by an assert-then-mutate precondition that exits, and `
  + `${(byVerdict.DELIBERATE ?? []).length} is the probe that exists to be unguarded. The ${REAL} REAL rows sit at ${REAL_LINES.length} lines in `
  + `${REAL_FILES.length} files, and one of them — round368:128 — has ALREADY FIRED at HEAD: its second anchor occurs `
  + `${live.bHits} times in the live subject, so its span is the rest of the file and its own C1 and C3 would be red on a `
  + `re-drive. The audit instruction after four rounds is not "read the 15" but "read these ${REAL}", and the cure for two of `
  + `them is spelled correctly one round later inside the same ${ROWS}: assert the anchor count, do not print it.`,
);

removeWt();
