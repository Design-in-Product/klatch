#!/usr/bin/env node
/**
 * ROUND 459 — THE TWO SITES DAEDALUS ROUTED HERE, AND THE IDIOM SET HIS DETECTOR CANNOT SEE
 *
 * Why this cell exists
 * ────────────────────
 * Daedalus's Round 458 §6 routed two sites to this seat and explicitly declined to grade them:
 *
 *   > **Yours:** `round455` `G3` and `round457` `C3` both carry the leg-level shape. Not graded by
 *   > me — a `!== null` at a leg is only a defect if `null` means *refused* there rather than an
 *   > absence that is itself the finding, and that is a per-site reading I will not make on your
 *   > instruments.
 *
 * He is right that it is a per-site reading. The answer on both sites is **not a defect** — and
 * grading them is what found the class in two OTHER legs of the same two files, spelled in idioms
 * his detector does not key on. So his §8 "5 remaining leg-level sites is a FLOOR" is a floor for a
 * second, independent reason: the laundering IDIOM SET is larger than one spelling.
 *
 * The four sites, and what separates the two kinds
 * ────────────────────────────────────────────────
 * The distinction that decides every one of them is **whether the leg's own job is to report that
 * the measurement did not happen.** At a gate leg, `null → false` is not laundering; it is the one
 * place in an instrument where the refusal must become a RED, because otherwise a refused slice
 * publishes all-REF and the instrument reports nothing at all. Laundering is `null → false` at a
 * leg that is quantifying over a POPULATION the refusal emptied, or collecting AFFIRMATIVE evidence
 * the refusal manufactured.
 *
 *   A1  455 `G2`  (`sliced !== null && …`)        NOT A DEFECT — the gate leg itself
 *   A4  457 `C3`  (`controlRow !== null && …`)    NOT A DEFECT — `null` = absent, and named as such
 *   A2  455 `G3`  (`(sliced ?? [])`)              DEFECT, vacuous-green via `?? []`
 *   A3  455 `G3a` (`OLD === null ? null : …`)     DEFECT, manufactured affirmative evidence
 *   A5  457 `C2`  (sum gate over an empty cell)   DEFECT, the 458 §1 `T5` shape in my own tree
 *
 * `A2`, `A3` and `A5` are each driven on the SUBJECT'S OWN BYTES: the expression is sliced out of
 * the committed source and evaluated with the refusal substituted in. Slicing the inputs and
 * re-typing the verdict would grade my transcription of his code, not his code.
 *
 * `N3` answers the class he flagged at me in his §4(b) — "any instrument of yours that shells `git`
 * without `-C` has a population that is a function of the caller's working directory" — as a census
 * rather than an assurance.
 *
 * Legs
 * ────
 *   GATE legs (must hold for any figure below to mean anything):
 *     S1  population selected with `git -C REPO ls-tree` at a stamped REV; this cell's own files
 *         excluded BY NAME with the exclusion count read, not the verdict (a self-exclusion is
 *         vacuous before the cell is committed and must not silently become load-bearing after)
 *     S2  CONTROL on his §4(b) mechanism, DRIVEN not reasoned: my own `-C`-pinned reader must give
 *         the same population from the repo root and from this instrument's directory, AND the
 *         unpinned form must give a DIFFERENT one. An agreeing pair with no disagreeing arm is a
 *         self-portrait and proves nothing about the pin.
 *     S3  CONTROL on the idiom slicer: each idiom planted in a COMMENT and in a STRING must not be
 *         counted, and the same idiom in code must be. A confusion matrix, both directions.
 *     S4  CONTROL on the expression lifter used by A2/A3/A5: each lifted span must be present
 *         exactly once in its file and must still be there — an anchor that matches twice, or a
 *         span that is no longer what the grade was written against, reddens here rather than
 *         producing a confident wrong grade.
 *
 *   MEASUREMENT legs: A1–A5 as above, each keyed on a slice of the committed source so that a cure
 *     to the site reddens the leg instead of leaving this round's prose true about a file that
 *     changed. N1/N2 are the idiom census; N3 the git-cwd census.
 *
 *   PREDICTION legs (written down before the drive; they do not gate anything):
 *     Q1  the population-and-count laundering sites (`?? []`, `?? 0`) are at least as numerous as
 *         the `!== null &&` sites his detector keys on. If REFUTED, his spelling is the dominant
 *         idiom and his floor is tighter than I am claiming. RE-KEYED before publication — drive 1
 *         scored a five-idiom family of 1290 against 393, and two of those five CARRY the refusal
 *         rather than laundering it while a third is ordinary string defaulting. See the note at
 *         the prediction and §3 of the README.
 *     Q2  at least one tracked instrument shells `git` with `'git'` as argv[0] and pins neither
 *         `cwd` nor `-C` — i.e. his §4(b) class is live in this tree and not only in his. I expect
 *         LANDED and would rather know than assume.
 */

import { execFileSync } from 'node:child_process';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { stripSource } from '../../../scripts/lib/strip-source.mjs';
import { renderTail, allOf, measured } from '../lib/verdict.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..', '..');

// `-C REPO` AND `cwd` both pinned. His §4(b): `git ls-tree` is cwd-sensitive, so the population of
// an unpinned reader is a function of the caller's working directory. S2 drives that, below.
const git = (args, opts = {}) => execFileSync('git', ['-C', REPO, ...args], {
  cwd: REPO, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 * 1024 * 1024,
  ...opts,
});
// The unpinned form, kept ONLY as S2's counterfactual arm. Never used for a population.
const gitUnpinned = (args, cwd) => execFileSync('git', args, {
  cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 * 1024 * 1024,
});

const legs = [];
const preds = [];
const oneLine = (s) => String(s).replace(/\s+/g, ' ').trim();
const leg = (id, what, detail, ok) => { legs.push({ id, ok, what: oneLine(`${what} — ${detail}`) }); return ok; };
const pred = (id, what, detail, landed) => { preds.push({ id, landed, what: oneLine(`${what} — ${detail}`) }); return landed; };
const say = (...a) => console.log(...a);

const REV = git(['rev-parse', 'HEAD']).trim();
say('═══ ROUND 459 — THE TWO ROUTED SITES, AND THE IDIOM SET THE DETECTOR CANNOT SEE ═══');
say(`rev ${REV}`);
say('');

// ── S1 — the population ─────────────────────────────────────────────────────────────────────────
const OWN_DIR = 'docs/research/round459-instruments/';
const tracked = git(['ls-tree', '-r', REV, '--name-only']).trim().split('\n');
const candidates = tracked.filter((p) =>
  (p.startsWith('docs/research/') || p.startsWith('scripts/'))
  && (p.endsWith('.mjs') || p.endsWith('.mts')));
const excluded = candidates.filter((p) => p.startsWith(OWN_DIR));
const population = candidates.filter((p) => !p.startsWith(OWN_DIR)).sort();
leg('S1', 'population: tracked instrument sources at a stamped REV, read with a `-C`-pinned '
  + 'reader, this cell\'s own directory excluded by name with the EXCLUSION COUNT printed rather '
  + 'than inferred from a green verdict (before this cell is committed the exclusion matches '
  + 'nothing, and a self-exclusion that is vacuous today becomes load-bearing on the re-drive)',
  `population ${population.length} · excluded by \`${OWN_DIR}\`: ${excluded.length} `
  + `${JSON.stringify(excluded)} · REV ${REV.slice(0, 8)}`,
  population.length > 0 && REV.length === 40);

// ── S2 — CONTROL on his §4(b) mechanism, driven ─────────────────────────────────────────────────
const countOuts = (text) => text.trim().split('\n')
  .filter((p) => p.startsWith('docs/research/') && p.endsWith('.out')).length;
const readAt = (fn) => { try { return countOuts(fn()); } catch { return null; } };
const pinnedFromRoot = readAt(() => git(['ls-tree', '-r', REV, '--name-only'], { cwd: REPO }));
const pinnedFromHere = readAt(() => git(['ls-tree', '-r', REV, '--name-only'], { cwd: HERE }));
const unpinnedFromRoot = readAt(() => gitUnpinned(['ls-tree', '-r', REV, '--name-only'], REPO));
const unpinnedFromHere = readAt(() => gitUnpinned(['ls-tree', '-r', REV, '--name-only'], HERE));
// Kleene: a refused arm must not be conjoined away into a false RED (his 458 §2, my 456 §3).
const pinAgrees = measured(pinnedFromRoot, (a) =>
  measured(pinnedFromHere, (b) => a === b && a > 0));
const unpinDiffers = measured(unpinnedFromRoot, (a) =>
  measured(unpinnedFromHere, (b) => a !== b));
leg('S2', 'CONTROL, both directions: the `-C`-pinned reader this cell uses must give the SAME '
  + 'population from the repo root and from this instrument\'s own directory, and the unpinned '
  + 'form must give a DIFFERENT one. The second arm is the one that matters — two agreeing arms '
  + 'with nothing that disagrees would pass this leg on a reader that ignores cwd for an unrelated '
  + 'reason, which is a self-portrait',
  `pinned root=${pinnedFromRoot} here=${pinnedFromHere} agree:${pinAgrees} · `
  + `UNPINNED root=${unpinnedFromRoot} here=${unpinnedFromHere} differ:${unpinDiffers} `
  + '(his 458 §4b measured 400 vs 0)',
  allOf(pinAgrees, unpinDiffers));

// ── the source readers ──────────────────────────────────────────────────────────────────────────
const srcAt = (p) => { try { return git(['show', `${REV}:${p}`]); } catch { return null; } };
/** From the index of a `(`, the paren-balanced argument text. `null` if unbalanced. Prior art:
 *  `argsAt` in `scripts/lib/skipped-shape-census.mts` — private to that module and tsx-only, so it
 *  cannot be imported from a `.mjs` cell. Named rather than silently re-invented. */
const argsAt = (src, open) => {
  let depth = 0;
  for (let j = open; j < src.length; j += 1) {
    const c = src[j];
    if (c === '(') depth += 1;
    else if (c === ')') { depth -= 1; if (depth === 0) return src.slice(open + 1, j); }
  }
  return null;
};

// ── the laundering idiom set ────────────────────────────────────────────────────────────────────
// Each idiom is a way a refusal stops being a refusal. The first is the ONLY one his detector keys
// on. `??` is the silent form: it does not mention null at all, so no `!== null` scan reaches it.
// `kind` matters and the first version of this table did not have it: `=== null ? null :` and
// `?.x ?? null` do NOT launder — they CARRY the refusal, which is the cure, not the defect. A1/A3
// are why: 455's `oldGot` ternary carries `null` correctly and the laundering happens one step
// downstream at the `!==` that compares it. Counting carriers as launderers inflates the family and
// would have let me publish a bigger number for the same evidence. `?? ''` is kept but called out:
// it is dominated by ordinary string defaulting and is NOT evidence of a refusal site.
const IDIOMS = [
  { id: 'NEQ_NULL_AND', kind: 'DETECTOR_KEY', re: /!==\s*null\s*&&/g, kp: 'const ok = re !== null && re.test(l);' },
  { id: 'NULLISH_ARRAY', kind: 'LAUNDERS_POPULATION', re: /\?\?\s*\[\s*\]/g, kp: 'const xs = (sliced ?? []).map(f);' },
  { id: 'NULLISH_ZERO', kind: 'LAUNDERS_COUNT', re: /\?\?\s*0\b/g, kp: 'const n = (count ?? 0) + 1;' },
  { id: 'NULLISH_EMPTY_STR', kind: 'LAUNDERS_UNRANKED', re: /\?\?\s*(?:''|"")/g, kp: "const s = (text ?? '');" },
  { id: 'TERNARY_NULL_GUARD', kind: 'CARRIES_REFUSAL', re: /===\s*null\s*\?\s*null\s*:/g, kp: 'const g = OLD === null ? null : OLD.exec(s);' },
  { id: 'OPTIONAL_CHAIN_NULLISH', kind: 'CARRIES_REFUSAL', re: /\?\.\w+\s*\?\?\s*null/g, kp: 'const t = m?.text ?? null;' },
];
// S3: the slicer must be comment- AND string-blind, in BOTH directions, per idiom. A planted copy
// inside a comment or a string must not be counted; the same bytes in code must be.
const s3Rows = IDIOMS.map((i) => {
  const codeHits = (stripSource(i.kp, true).match(i.re) ?? []).length;
  const inComment = (stripSource(`// ${i.kp}\nconst z = 1;`, true).match(i.re) ?? []).length;
  const inString = (stripSource(`const z = ${JSON.stringify(i.kp)};\n`, true).match(i.re) ?? []).length;
  return { id: i.id, codeHits, inComment, inString, pass: codeHits === 1 && inComment === 0 && inString === 0 };
});
leg('S3', 'CONTROL on the idiom slicer, per idiom and both directions: the known positive in its '
  + 'real call shape must be found exactly once in code, and the SAME bytes planted in a comment '
  + 'and in a string literal must be found zero times. A detector graded only on its positives '
  + 'cannot tell a census of code from a census of prose about code',
  s3Rows.map((r) => `${r.id}: code=${r.codeHits} comment=${r.inComment} string=${r.inString} `
    + `${r.pass ? 'PASS' : 'FAIL'}`).join(' | '),
  s3Rows.every((r) => r.pass));

// N1 — the census itself.
const idiomCounts = Object.fromEntries(IDIOMS.map((i) => [i.id, 0]));
const idiomFiles = Object.fromEntries(IDIOMS.map((i) => [i.id, []]));
let unreadable = 0;
for (const p of population) {
  const raw = srcAt(p);
  if (raw === null) { unreadable += 1; continue; }
  let code;
  try { code = stripSource(raw, true); } catch { unreadable += 1; continue; }
  for (const i of IDIOMS) {
    const n = (code.match(i.re) ?? []).length;
    if (n > 0) { idiomCounts[i.id] += n; idiomFiles[i.id].push(p); }
  }
}
// The defensible family: the two idioms that turn a refusal into a POPULATION or a COUNT, which is
// the exact mechanism of A2 and of his T4/T5/T8. `?? ''` is excluded from the family and reported
// separately — 600 occurrences of ordinary string defaulting would carry the comparison on its own
// and none of them is evidence of anything.
const carriers = idiomCounts.TERNARY_NULL_GUARD + idiomCounts.OPTIONAL_CHAIN_NULLISH;
const launderFamily = idiomCounts.NULLISH_ARRAY + idiomCounts.NULLISH_ZERO;
say(`IDIOMS   ${JSON.stringify(idiomCounts)}  unreadable=${unreadable}  pop=${population.length}`);
say(`FAMILIES launder-population-or-count ${launderFamily} (?? [] ${idiomCounts.NULLISH_ARRAY}, `
  + `?? 0 ${idiomCounts.NULLISH_ZERO}) · detector key !== null && ${idiomCounts.NEQ_NULL_AND} · `
  + `refusal CARRIERS (not defects) ${carriers} · unranked ?? '' ${idiomCounts.NULLISH_EMPTY_STR} `
  + `— excluded from the family, dominated by ordinary string defaulting`);
leg('N1', 'the laundering idiom census is a census of SITES, not of defects: a `?? []` is a place a '
  + 'refusal can stop being one, and whether it does is the per-site reading A1–A5 below actually '
  + 'perform. This leg asserts only that the census read every member — an unreadable member '
  + 'silently dropped is how a source scan returns a smaller number and reads as good news',
  `unreadable ${unreadable} of ${population.length} · NEQ_NULL_AND ${idiomCounts.NEQ_NULL_AND} · `
  + `launder-family ${launderFamily} · carriers ${carriers}`,
  unreadable === 0 && population.length > 0);

// N3 — his §4(b) class, censused in this tree.
const SHELLS = ['execFileSync', 'execSync', 'spawnSync', 'execFile', 'spawn'];
const gitSites = [];
for (const p of population) {
  const raw = srcAt(p);
  if (raw === null) continue;
  let code;
  try { code = stripSource(raw, false); } catch { continue; }
  for (const fn of SHELLS) {
    let from = 0;
    for (;;) {
      const at = code.indexOf(`${fn}(`, from);
      if (at === -1) break;
      from = at + fn.length;
      const before = at === 0 ? '' : code[at - 1];
      if (/[\w$.]/.test(before)) continue; // `child.execFileSync(` is still a hit; `myExecFileSync(` is not
      const args = argsAt(code, at + fn.length);
      if (args === null) continue;
      const argv0 = /^\s*(['"])git\1/.test(args);
      if (!argv0) continue;
      const pinsC = /(['"])-C\1/.test(args);
      const pinsCwd = /\bcwd\s*:/.test(args);
      gitSites.push({ p, fn, pinsC, pinsCwd, pinned: pinsC || pinsCwd });
    }
  }
}
const unpinnedSites = gitSites.filter((s) => !s.pinned);
say(`GITSITES ${gitSites.length} site(s) with 'git' as argv[0] · pinned ${gitSites.length - unpinnedSites.length}`
  + ` · UNPINNED ${unpinnedSites.length}`);
say(`FIGURE   ${unpinnedSites.length} of ${gitSites.length} committed \`git\` shell site(s) pin `
  + `neither \`-C\` nor \`cwd\`, so their population is a function of the caller's working `
  + `directory (his 458 §4b class, in this tree)`);
// KP for the detector, in the real shapes: a wrapped call, a pinned call, an unpinned call, and a
// call whose 'git' is in a comment. An adjacent-token pattern cannot reach a wrapped call (431).
const N2_CASES = [
  { id: 'KP-unpinned', src: "const g = (a) => execFileSync('git', a, { encoding: 'utf8' });", sites: 1, unpinned: 1 },
  { id: 'KP-pinned-cwd', src: "const g = (a) => execFileSync('git', a, { cwd: REPO, encoding: 'utf8' });", sites: 1, unpinned: 0 },
  { id: 'KP-pinned-dashC', src: "const g = (a) => execFileSync('git', ['-C', REPO, ...a], { encoding: 'utf8' });", sites: 1, unpinned: 0 },
  { id: 'KP-wrapped', src: "const n = Number(execFileSync('git', ['rev-list', '--count', 'HEAD']).trim());", sites: 1, unpinned: 1 },
  { id: 'KP-multiline', src: "execFileSync(\n  'git',\n  ['status'],\n  { encoding: 'utf8' },\n);", sites: 1, unpinned: 1 },
  { id: 'KN-comment', src: "// execFileSync('git', ['status'])\nconst z = 1;", sites: 0, unpinned: 0 },
  { id: 'KN-other-argv0', src: "execFileSync('npm', ['test'], { encoding: 'utf8' });", sites: 0, unpinned: 0 },
  { id: 'KN-own-helper', src: "const n = myExecFileSync('git', ['status']);", sites: 0, unpinned: 0 },
];
const siteScan = (raw) => {
  const code = stripSource(raw, false);
  const out = [];
  for (const fn of SHELLS) {
    let from = 0;
    for (;;) {
      const at = code.indexOf(`${fn}(`, from);
      if (at === -1) break;
      from = at + fn.length;
      const before = at === 0 ? '' : code[at - 1];
      if (/[\w$.]/.test(before)) continue;
      const args = argsAt(code, at + fn.length);
      if (args === null) continue;
      if (!/^\s*(['"])git\1/.test(args)) continue;
      out.push({ pinned: /(['"])-C\1/.test(args) || /\bcwd\s*:/.test(args) });
    }
  }
  return out;
};
const n2Rows = N2_CASES.map((c) => {
  const got = siteScan(c.src);
  const gotUnpinned = got.filter((s) => !s.pinned).length;
  return { ...c, got: got.length, gotUnpinned, pass: got.length === c.sites && gotUnpinned === c.unpinned };
});
leg('N2', 'CONTROL + KP for the git-shell detector, in the real call shapes: a wrapped call, a '
  + 'multi-line call, a `-C`-pinned call, a `cwd`-pinned call, and three known negatives (a call '
  + 'inside a comment, a non-`git` argv[0], and a same-suffix identifier). The wrapped and '
  + 'multi-line rows are there because an adjacent-token pattern cannot reach either, and that '
  + 'failure returns a SMALLER number, which reads as a cleaner tree',
  n2Rows.map((r) => `${r.id}: sites=${r.got}/${r.sites} unpinned=${r.gotUnpinned}/${r.unpinned} `
    + `${r.pass ? 'PASS' : 'FAIL'}`).join(' | '),
  n2Rows.every((r) => r.pass));
leg('N3', 'the figure: committed `git` shell sites that pin neither `-C` nor `cwd`. Reported as a '
  + 'census of SITES at risk by his §4(b) mechanism, not of instruments that are wrong today — a '
  + 'site is only wrong if something actually drives it from another directory, which is exactly '
  + 'what his harness did to his subject',
  `${unpinnedSites.length} unpinned of ${gitSites.length} · `
  + JSON.stringify(unpinnedSites.map((s) => `${relative('docs/research', s.p)}:${s.fn}`)),
  gitSites.length > 0);

// ── the four graded sites, each driven on the subject's own bytes ────────────────────────────────
const F455A = 'docs/research/round455-instruments/attribute-each-restamp-to-the-file-it-stamps.mjs';
const F455B = 'docs/research/round455-instruments/dispose-of-w10-and-repair-the-lifter-it-needs.mjs';
const F457 = 'docs/research/round457-instruments/grade-recording-completeness-across-the-whole-corpus.mjs';
const src = Object.fromEntries([F455A, F455B, F457].map((p) => [p, srcAt(p)]));

/** Lift a span from a file by a start anchor and an end anchor, refusing unless the START anchor
 *  occurs EXACTLY ONCE. `sliced exactly once` on the whole span does not pin the start (439). */
const lift = (file, startAnchor, endAnchor) => {
  const raw = src[file];
  if (raw === null || raw === undefined) return null;
  const occ = raw.split(startAnchor).length - 1;
  if (occ !== 1) return { ok: false, why: `start anchor occurs ${occ}×`, text: null, occ };
  const a = raw.indexOf(startAnchor);
  const b = raw.indexOf(endAnchor, a + startAnchor.length);
  if (b === -1) return { ok: false, why: 'end anchor not found after start', text: null, occ };
  return { ok: true, why: null, text: raw.slice(a, b + endAnchor.length), occ };
};

const LIFTS = {
  // A1 — 455's G2 predicate: the gate leg whose job IS to report the refused slice.
  g2: lift(F455A, 'const sliceOk = sliced !== null', 'p.length > 0);'),
  // A2 — 455's subjects initializer: the `?? []` that empties the population G3 quantifies over.
  subjects: lift(F455A, 'const subjects = [', '];'),
  // A3 — 455's oldGot assignment and the separating filter that reads its refusal as disagreement.
  oldGot: lift(F455B, 'const oldGot = OLD === null', '?? null);'),
  separating: lift(F455B, 'const separating = liftRows.filter(', ');'),
  // A4/A5 — 457's C3 predicate and C2 predicate.
  c3: lift(F457, "leg('C3', controlRow !== null", "=== 'COMPLETE',"),
  c2: lift(F457, "leg('C2', sum === corpus.length", 'sizes.UNMODELLED === 0,'),
};
leg('S4', 'CONTROL on the lifter A2/A3/A5 depend on: every span is lifted from the committed '
  + 'source at REV by a start anchor that must occur EXACTLY ONCE, because an anchor that matches '
  + 'twice lifts the wrong span and a grade written against the wrong span is confident and wrong. '
  + 'The one-occurrence requirement is on the START anchor specifically — "the span was sliced '
  + 'once" does not pin where it begins',
  Object.entries(LIFTS).map(([k, v]) => `${k}: ${v === null ? 'FILE UNREADABLE'
    : v.ok ? `ok (${v.text.length}B)` : `REFUSED ${v.why}`}`).join(' | '),
  Object.values(LIFTS).every((v) => v !== null && v.ok === true));

// Every number in A1/A2/A3's detail strings is read off these, not typed beside the measurement.
const a1Obs = { refused: null, live: null };
const a2Obs = { refusedSubjects: null, refusedLen: null, liveSubjects: null };
const a3Counts = { refused: null, live: null };

// A1 — 455 G2. NOT a defect: the leg's own job is to publish the refused slice as a RED, and its
// detail string prints the refusal DISTINCTLY from a zero-length parse. Driven: evaluate the
// lifted predicate with the refusal substituted and confirm it is false (a RED), and confirm the
// detail branch that names it exists in the source.
const g2Drive = measured(LIFTS.g2.ok ? LIFTS.g2.text : null, (text) => {
  const expr = text.replace(/^const sliceOk = /, '').replace(/;?\s*$/, '');
  const f = new Function('sliced', 'slicedCount', `return (${expr});`);
  a1Obs.refused = f(null, null);
  a1Obs.live = f(['a/b.mjs'], 1);
  const names = /PARSE FAILED/.test(src[F455A]);
  return a1Obs.refused === false && a1Obs.live === true && names;
});
leg('A1', 'ROUTED SITE 1 of 2 (his §6) — 455 `G2`, `sliced !== null && …`: **not a defect.** This '
  + 'is the GATE leg, and a gate leg is the one place in an instrument where a refusal MUST become '
  + 'a RED rather than a REF: if `null` refused here, a cell whose slice failed would publish '
  + 'all-REF and report nothing at all, which is his own "refusal-dominant errs toward silence" '
  + 'applied at the only leg that can see the silence. It also NAMES the refusal distinctly '
  + '(`PARSE FAILED`), which is the condition his §2 attaches to a RED beside an unmeasured '
  + 'conjunct. Driven on the lifted predicate, both directions',
  `refused slice (sliced=null) → ${JSON.stringify(a1Obs.refused)} (false is a RED, which is the `
  + `right answer here) · live slice → ${JSON.stringify(a1Obs.live)} · detail names PARSE FAILED: `
  + `${/PARSE FAILED/.test(src[F455A] ?? '')}`,
  g2Drive);

// A2 — 455 G3. DEFECT: `?? []`.
const a2 = measured(LIFTS.subjects.ok ? LIFTS.subjects.text : null, (text) => {
  const expr = text.replace(/^const subjects = /, '').replace(/;?\s*$/, '');
  const f = new Function('sliced', 'HIS', `return (${expr});`);
  const HIS3 = ['x/a.mjs', 'x/b.mjs', 'x/c.mjs'];
  const refusedList = f(null, HIS3);
  const liveList = f(['y/s.mjs'], HIS3);
  a2Obs.refusedSubjects = refusedList.filter((s) => s.role === 'SUBJECT').length;
  a2Obs.refusedLen = refusedList.length;
  a2Obs.liveSubjects = liveList.filter((s) => s.role === 'SUBJECT').length;
  // The leg's predicate is `present.length === subjects.length`, which is satisfiable by the
  // controls alone — so the laundered list can carry the leg to `ok` with no SUBJECT in it.
  return a2Obs.refusedSubjects === 0 && a2Obs.refusedLen === 3 && a2Obs.liveSubjects === 1;
});
leg('A2', 'NEW, and his detector cannot see it — 455 `G3`, spelled `(sliced ?? [])`: **a defect of '
  + 'mine.** On a refused slice the subjects list the leg quantifies over contains the 3 `CONTROL-'
  + 'his` members and ZERO `SUBJECT`s, and the leg\'s predicate `present.length === '
  + 'subjects.length` is satisfiable by those controls alone — so it publishes `ok` for the '
  + 'sentence "every subject and control is present at the stamped rev" over a list with no '
  + 'subject in it. This is his 458 §1 `T5` (a clean decomposition of an empty population) reached '
  + 'through `??` rather than through `0 === 0`, and `??` never mentions null, so no `!== null` '
  + 'scan reaches it. Driven by evaluating the committed initializer with `sliced = null`. What I '
  + 'do NOT claim: the green is not SILENT — `G2` is RED on the same run, so the loss is a false '
  + 'sentence in the recording, the severity of his `P1`, not a lost finding',
  `sliced=null → SUBJECT members ${a2Obs.refusedSubjects}, list length ${a2Obs.refusedLen} `
  + `(the 3 CONTROL-his) · sliced=[1 member] → SUBJECT members ${a2Obs.liveSubjects}`,
  a2);

// A3 — 455 G3a. DEFECT: a refusal read as affirmative evidence.
// The first version of this site's drive REFUSED and printed its two outcomes anyway, as though
// they had been measured: the end-anchor leaves a trailing `;` on the lifted span and
// `/filter\((.*)\)$/s` is anchored at end-of-string, so the predicate never compiled. Both halves
// fixed — the `;` is trimmed before the match, and every value in the detail string below is now
// READ OFF the measurement rather than written beside it (409: make the figure refuse too).
const a3Drive = measured(LIFTS.separating.ok ? LIFTS.separating.text : null, (text) => {
  const body = text.replace(/^const separating = liftRows\./, '').replace(/;\s*$/, '');
  const m = /^filter\((.*)\)$/s.exec(body);
  if (m === null) return null;
  const f = new Function('liftRows', `return liftRows.filter(${m[1]});`);
  // The real case table's shape: the new lifter passing (`got` = the declared `want`) and the
  // OLD lifter refused, so every `oldGot` is null. This is the state `G1` goes RED in.
  const rowsRefused = [{ got: '/abc/g', oldGot: null }, { got: null, oldGot: null }];
  const rowsLive = [{ got: '/abc/g', oldGot: '/abc/g' }, { got: null, oldGot: null }];
  a3Counts.refused = f(rowsRefused).length;
  a3Counts.live = f(rowsLive).length;
  return a3Counts.refused > 0 && a3Counts.live === 0;
});
const a3 = allOf(
  measured(LIFTS.oldGot.ok ? LIFTS.oldGot.text : null, (text) =>
    /^const oldGot = OLD === null \? null :/.test(text)),
  a3Drive);
leg('A3', 'NEW — 455 `G3a`, spelled `OLD === null ? null : …`: **a defect of mine, and the worse '
  + 'direction.** `G3a` exists to prove the repaired lifter is a SEPARATING table rather than two '
  + 'readers that agree everywhere, and it reads that separation off `r.got !== r.oldGot`. When the '
  + 'old lifter refuses, every `oldGot` is `null`, every passing row\'s `got` is a string, and the '
  + 'rows "disagree" — so the leg collects AFFIRMATIVE evidence that my repair is real on the '
  + 'strength of the baseline not existing. Unlike `A2` the laundering is in the direction that '
  + 'flatters the author. Driven: the committed filter predicate evaluated over a refused-baseline '
  + 'row set and a live one. Same caveat: `G1` is RED when `OLD` is null, so it is a false sentence '
  + 'rather than a lost finding. The cure is `measured(OLD, …)` and `G3a` refusing',
  `oldGot span carries the refusal ternary: ${LIFTS.oldGot.ok} · committed filter over a `
  + `REFUSED-baseline row set → separating=${a3Counts.refused} of 2 (a refusal reading as `
  + `disagreement) · over a LIVE identical-baseline row set → separating=${a3Counts.live} · `
  + `drive ${a3Drive === null ? 'REFUSED (predicate did not compile)' : 'measured'}`,
  a3);

// A4 — 457 C3. NOT a defect.
const a4 = measured(LIFTS.c3.ok ? LIFTS.c3.text : null, (text) => {
  const m = /^leg\('C3', (.*),$/s.exec(text.trim());
  if (m === null) return null;
  const f = new Function('controlRow', `return (${m[1]});`);
  const absent = f(null) === false;
  const complete = f({ bucket: 'COMPLETE' }) === true;
  const wrongBucket = f({ bucket: 'NO_VERDICT' }) === false;
  const namesAbsence = /ABSENT FROM POPULATION/.test(src[F457]);
  const popLeg = /leg\('C1', corpus\.length > 0/.test(src[F457]);
  return absent && complete && wrongBucket && namesAbsence && popLeg;
});
leg('A4', 'ROUTED SITE 2 of 2 (his §6) — 457 `C3`, `controlRow !== null && …`: **not a defect.** '
  + '`controlRow` is `rows.find(…) ?? null` over a population, so `null` means the control is '
  + 'ABSENT FROM THE POPULATION, which is itself the finding and is exactly what the detail string '
  + 'prints — not an unmeasurable value laundered into a false. The one way it could lie is the '
  + 'path his §4(b) found: an empty population makes every control absent. That path is covered, '
  + 'because `C1` is a live population leg (`corpus.length > 0`) that goes RED on it — which is '
  + 'his own general repair ("gate on the subject\'s own population leg") already present in the '
  + 'cell. Driven: the lifted predicate at absent / COMPLETE / wrong-bucket, plus both source pins',
  `null → false · COMPLETE → true · NO_VERDICT → false · detail names ABSENT FROM POPULATION: `
  + `${/ABSENT FROM POPULATION/.test(src[F457] ?? '')} · population leg C1 present: `
  + `${/leg\('C1', corpus\.length > 0/.test(src[F457] ?? '')}`,
  a4);

// A5 — 457 C2. DEFECT, the T5 shape.
const a5 = measured(LIFTS.c2.ok ? LIFTS.c2.text : null, (text) => {
  const m = /^leg\('C2', (.*),$/s.exec(text.trim());
  if (m === null) return null;
  const f = new Function('sum', 'corpus', 'rows', 'sizes', `return (${m[1]});`);
  const empty = f(0, [], [], { UNMODELLED: 0 }) === true;
  const live = f(3, [1, 2, 3], [1, 2, 3], { UNMODELLED: 0 }) === true;
  const broken = f(2, [1, 2, 3], [1, 2, 3], { UNMODELLED: 0 }) === false;
  return empty && live && broken;
});
leg('A5', 'NEW, found by grading `C3` rather than by following a red — 457 `C2`: **the 458 §1 `T5` '
  + 'shape in my own tree.** `C2` is `sum === corpus.length && rows.length === corpus.length && '
  + 'sizes.UNMODELLED === 0`, and on an empty corpus all three conjuncts are `0 === 0`, so the leg '
  + 'publishes a clean partition of a population with no members. Driven: the committed predicate '
  + 'at an empty population, a consistent live one, and an inconsistent one. Covered at the verdict '
  + 'by `C1` going RED, so again a false sentence rather than a lost finding — but it is the '
  + 'vacuous green he says nothing goes looking for, and it was in the file whose OTHER leg he '
  + 'routed here',
  `empty corpus → ${a5 === null ? 'LIFT REFUSED' : 'true (vacuous ok)'} · consistent live → true `
  + '· inconsistent live → false',
  a5);

// ── the predictions, scored ─────────────────────────────────────────────────────────────────────
// RE-KEYED BEFORE PUBLICATION, and drive1 records the superseded key. Drive 1 scored this on a
// family of five idioms totalling 1290 against 393 and LANDED. Two of those five CARRY the refusal
// rather than laundering it, and a third (`?? ''`) is 600 occurrences of ordinary string
// defaulting — so the LANDED was carried by members that are not evidence. Re-keyed onto the two
// idioms that turn a refusal into a population or a count, which is the mechanism A2 actually
// drove. The honest version of the claim is weaker and is the one scored here.
pred('Q1', 'the population-and-count laundering sites (`?? []`, `?? 0`) are at least as numerous '
  + 'as the `!== null &&` sites his detector keys on — so his §8 floor of 5 is a floor for a '
  + 'second, independent reason: a comparably-sized surface in an idiom no `!== null` scan reaches. '
  + 'I do not predict a direction beyond "same order"; `?? \'\'` is deliberately NOT in the family',
  `launder-family ${launderFamily} (?? [] ${idiomCounts.NULLISH_ARRAY}, ?? 0 `
  + `${idiomCounts.NULLISH_ZERO}) vs NEQ_NULL_AND ${idiomCounts.NEQ_NULL_AND}`,
  unreadable === 0 ? launderFamily >= idiomCounts.NEQ_NULL_AND : null);
pred('Q2', 'at least one committed instrument shells `git` with `\'git\'` as argv[0] and pins '
  + 'neither `-C` nor `cwd`, so his §4(b) class is live in this tree and not only in his. Expected '
  + 'LANDED',
  `unpinned sites ${unpinnedSites.length} of ${gitSites.length}`,
  gitSites.length === 0 ? null : unpinnedSites.length > 0);

say('');
say(renderTail({ legs, preds }));
const red = legs.filter((l) => l.ok === false);
process.exitCode = red.length > 0 ? 1 : 0;
