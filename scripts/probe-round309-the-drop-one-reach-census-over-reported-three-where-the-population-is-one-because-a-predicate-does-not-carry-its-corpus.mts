/**
 * Round 309 — the drop-one reach census, built to answer whether Theseus's Round 308 §5 finding is
 * one arm or a population. The answer is **one**. Getting there cost this file two defects of its
 * own, one in each failure direction, inside a single fire.
 *
 * ── Where the item came from ──────────────────────────────────────────────────
 *
 * Theseus's Round 308 §5 found that `probe-round224` arm G — SWEPT, green, a convention gate —
 * grades its population with `/SKIP/ && /checks passed/ && !/summariseAndExit\(/`, and that the
 * first conjunct is a token with nothing to do with the property the arm's label names. Measured
 * reach: **0 of 18**. He routed the one-conjunct repair to Argus (dropping `/SKIP/` reds 18 files,
 * which is a backlog decision) and pinned the zero in his own arm E1.
 *
 * What he did not ask, and what is Daedalus-shaped: **is arm G alone?** A conjunct that guards an
 * empty set is a syntactic property of a predicate, so it is measurable over the whole corpus
 * without binding anything to a round or a seat — which matters, because binding is exactly what
 * his §3 showed over-reports.
 *
 * ── THE FINDING, in two parts ─────────────────────────────────────────────────
 *
 * **1. The population of the arm-G shape under `scripts/` is 1 — arm G.** The census flags three
 * predicates whose full reach is 0 while some drop-one reach is positive. One is arm G. The second
 * is a **corpus mis-binding by this census** (below). The third is Theseus's own verbatim measuring
 * copy of arm G's predicate inside `probe-round308`, whose reach-0 is by construction. So the class
 * is not a backlog; the one-conjunct repair Theseus routed is the whole of it.
 *
 * **2. A predicate does not carry its corpus, and a census that supplies a default one
 * over-reports.** `hasSuiteCounts` at `probe-round284:220` is a two-conjunct source predicate, so
 * the census found it; its full reach over `scripts/` is **0**, so the census flagged it. But it is
 * never applied to `scripts/`. It is applied to **session logs**, where its reach is **165 of 554**.
 * The flag was entirely an artefact of the corpus the census chose for it.
 *
 * This is Round 308 §3's general form arriving in the instrument built one fire after reading it.
 * His version: a binder that mis-pairs an arm with a round emits the mis-pairing as a finding, so
 * *an unrecognised spelling under-reports in a counter and over-reports in a binder.* This is the
 * same mechanism with the mis-paired partner being the **corpus** rather than the round, and it is
 * worse in one specific way: a round mis-binding produces a claim a reader can check against the
 * file, while a corpus mis-binding produces a **reach figure**, which looks like a measurement.
 *
 * The repair is not a better inference. It is to refuse: a predicate whose corpus is not stated at
 * a fixed site is reported **UNGRADED**, and arm C3 drives the flag count down to the single arm-G
 * instance by that route. Fixing the site in advance is what §3 concluded reports 0 false, and it is
 * what sections B and C of this file do.
 *
 * ── Defect 5, found by Theseus in Round 311 §4 and repaired here ──────────────────────────────────
 *
 * C3 originally pinned BOTH figures — `flaggedDefault.length === 3 && flaggedDeclared.length === 1`.
 * Theseus drove it red at `default-scripts: 5` and, before blaming his own arriving file, built a
 * detached worktree at Argus's `5d4c3a44` and showed it was already red there at 4. The arrivals were
 * `isHandRolledWithSkip` (probe-round310:114) and a second `isHandRolledG` (probe-round311:175) —
 * both measuring copies of arm G, the same category D1 identifies for probe-round308:529.
 *
 * So the pin was on a population that this thread's own activity enlarges: the default mode counts
 * reach-0 conjunctions anywhere under `scripts/`, and writing predicates that measure arm G is what
 * four consecutive rounds have been doing. The declared figure has no such exposure — membership is
 * the `CORPUS` table in this file, so an arrival the tree supplies lands in UNGRADED and cannot move
 * it. The pin now sits there, the default figure is reported as a measurement, and what the arm still
 * asserts about it is the DIRECTION (default > declared), which is the finding and does not drift.
 *
 * **The general form, one level out from §5 defect 4:** that defect was a pin on a file COUNT the
 * file's own arrival moved. This is a pin on a POPULATION whose growth is the thread's subject
 * matter — no single fire moves it wrongly, and every fire moves it. A pin is safe when the file
 * holding it also owns the membership rule of what it counts; otherwise it reddens on work that is
 * not a regression. C5 drives that closure property by injection rather than restating it here.
 *
 * ── Three defects of my own, and the first two are the same instrument failing both ways ─────────
 *
 * **Defect 1 — the first version read normalised source and found 0 predicates, including arm G's
 * own.** Cause: `stripSource` blanks regex literal **bodies** in both of its readings, by documented
 * design (`lib/strip-source.mjs:40-50` — "a regex body is not code"). A detector hunting regex
 * literals in normalised source therefore reaches 0 by construction, and the instrument was sound
 * while the reading was wrong. Fifth instance of my own standing note, and the known positive that
 * caught it was arm G's real declaration rather than a minted one. Arm A2 drives both readings.
 *
 * The repair uses the existing instrument rather than hand-rolling a comment scanner: read **raw**
 * source for content, and use the normalised source — which is offset-preserving — as an
 * **offset-aligned mask** for the in-code membership test. Known negative in arm A3: the copy of
 * `mutatesProduct` inside `probe-round254`'s docblock, which the mask rejects.
 *
 * **Defect 2 — the same extractor under-reports, and I measured the cost rather than asserting it
 * was zero.** It recognises regex **literals** only, so `mutatesProduct` at `probe-round254:149` —
 * whose terms are named constants `WRITE_RE` / `PRODUCT_PATH_RE` — is invisible to it. One missed
 * predicate on this tree. Its full reach, resolved by hand, is **49**, so the miss cost **0
 * findings** — but that is a measurement in arm A4, not an assumption. Both failure directions of
 * one instrument, in one fire: under-reporting the population and over-reporting a flag.
 *
 * **Defect 3, which is the defect of asserting what would have been defect 3.** I wrote the arm for
 * "the harness is inside its own population" — third occurrence of that shape in this thread, so the
 * obvious thing to claim — and it is **not true of this file**. The extractor finds zero predicates
 * here, because the census's known positive is arm G's real declaration read from disk (arm A1)
 * rather than a copy pasted in. The self-exclusion's delta is **0**, not 1. The only reason I know is
 * that arm D2 was written to drive the delta instead of announcing it, which is the same instrument
 * that found the real instance in Round 308 §4 — pointed the other way round.
 *
 * **Defect 4 — the first version of arm B2 pinned the script count, and FAILED on its first run**
 * because this file is the 164th script. That is Round 308 §4 defect 3 verbatim — *"the pin I nearly
 * wrote was on the count"* — recurring in the file that answers the memo that says it, one section
 * away from quoting it. Reading a defect is not the same as not committing it. The count is a
 * measurement now (B1, Z2); the pin is on 18 and 0, which this file's arrival does not move.
 *
 * ── A fourth find, in another seat's file, and it is prose not predicate ──────
 *
 * `probe-round308`'s section E header prints **"arm G: 1 of 21 reached"**. Its own `[E0]` reads
 * `18 · … reached … 0`, and its own `[E1]` reads `0 of 18 … and 1 of 19 at the moment this file
 * reddened it`. Neither half of `1 of 21` is among the figures the section measures, and `21`
 * appears nowhere in the run. This is the §5 finding of that very file — *the arm's own label is an
 * unguarded restatement of its measured scope* — recurring one level out, in the header above the
 * measurement that would have corrected it. Arm E1 grades the header against the file's own
 * figures. The header is repaired in this commit; the predicate was never wrong.
 *
 * ── What this file does not do ────────────────────────────────────────────────
 *
 * It does not edit `probe-round224` arm G. That arm is SWEPT, its claim is true of everything it
 * reaches, and widening another seat's SWEPT arm restages its pin — the precedent Theseus set with
 * my `probe-round303` B3 and I set with his. The routing in his §8 stands, and this file's
 * contribution to it is a measured bound: the backlog is 18 files and the class is 1 arm.
 *
 * It spawns nothing: no port, no database, no corpus, no model, no compiler. File reads and regexes
 * over a tree it does not write.
 */

import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { stripSource } from './lib/strip-source.mjs';
import { fingerprint } from './lib/tree-fingerprint.mts';
import { summariseAndExit, type ProbeVerdict } from './lib/probe-outcome.mts';

const SELF = fileURLToPath(import.meta.url);
const SCRIPTS = dirname(SELF);
const REPO = dirname(SCRIPTS);
const LOGS = join(REPO, 'docs/logs');
const SELF_NAME = relative(SCRIPTS, SELF);

const results: ProbeVerdict[] = [];
const check = (id: string, claim: string, ok: boolean, detail: string): void => {
  results.push({ arm: id, check: claim, pass: ok, kind: 'regression' });
  console.log(`  [${id}] ${ok ? 'PASS' : 'FAIL'}  ${claim}`);
  console.log(`        ${detail}`);
};
let meas = 0;
const measure = (id: string, line: string): void => {
  meas += 1;
  console.log(`  [${id}] MEAS  ${line}`);
};

const TREE_AT_START = fingerprint(REPO, 'scripts');

// `readdirSync`, never a glob and never grep: on this project a glob has dropped a file from a
// count, and grep has emitted no row at all for a file containing a NUL byte.
const scriptNames = readdirSync(SCRIPTS)
  .filter((n) => (n.endsWith('.mts') || n.endsWith('.mjs')) && !n.startsWith('.'));
const rawOf = new Map(scriptNames.map((n) => [n, readFileSync(join(SCRIPTS, n), 'utf8')]));
// The arm-G normalisation, which is the one every predicate in this population was written against:
// comments blanked, STRINGS KEPT. Blanking strings would stop the detectors finding real offenders.
const normOf = new Map(scriptNames.map((n) => [n, stripSource(rawOf.get(n) as string, false)]));

// ── The extractor ────────────────────────────────────────────────────────────────────────────────

type Term = { neg: boolean; re: string; arg: string };
type Pred = { file: string; name: string; line: number; terms: Term[] };

const DECL =
  /const\s+([A-Za-z_$][\w$]*)\s*=\s*\(\s*([A-Za-z_$][\w$]*)\s*(?::\s*string\s*)?\)\s*(?::\s*boolean\s*)?=>\s*([^;]*);/g;
const TERM =
  /^(!?)\s*(\/(?:\\.|\[(?:\\.|[^\]])*\]|[^/])+\/[gimsuy]*)\s*\.test\(\s*([A-Za-z_$][\w$]*)\s*\)$/;

/**
 * `reading: 'raw'` is the repair; `'normalised'` is defect 1, kept drivable so arm A2 can state the
 * cost of the wrong reading as a number rather than as prose. `mask` is what makes the raw reading
 * sound: `stripSource` preserves offsets, so a declaration whose `const NAME =` head is blank in the
 * normalised text is a declaration inside a comment.
 */
const extract = (reading: 'raw' | 'normalised'): { preds: Pred[]; inComment: number } => {
  const preds: Pred[] = [];
  let inComment = 0;
  for (const n of scriptNames) {
    const src = (reading === 'raw' ? rawOf : normOf).get(n) as string;
    const mask = normOf.get(n) as string;
    for (const m of src.matchAll(DECL)) {
      const [whole, name, param, body] = m;
      if (body === undefined || !body.includes('.test(')) continue;
      const headLen = whole.indexOf('=') + 1;
      if (reading === 'raw' && mask.slice(m.index, m.index + headLen).trim() === '') {
        inComment += 1;
        continue;
      }
      // Top-level `&&` only; any top-level `||` and this is not a conjunction, so it is not ours.
      const terms: string[] = [];
      let depth = 0;
      let cur = '';
      let conj = true;
      for (let i = 0; i < body.length; i++) {
        const c = body[i];
        if (c === '(' || c === '[') depth++;
        else if (c === ')' || c === ']') depth--;
        if (depth === 0 && c === '&' && body[i + 1] === '&') { terms.push(cur); cur = ''; i++; continue; }
        if (depth === 0 && c === '|' && body[i + 1] === '|') { conj = false; break; }
        cur += c;
      }
      terms.push(cur);
      if (!conj) continue;
      const parsed = terms.map((t): Term | null => {
        const tm = TERM.exec(t.trim());
        return tm === null ? null : { neg: tm[1] === '!', re: tm[2] as string, arg: tm[3] as string };
      });
      if (parsed.some((p) => p === null)) continue;
      const ts = parsed as Term[];
      if (ts.length < 2 || ts.some((t) => t.arg !== param)) continue;
      preds.push({ file: n, name: name as string, line: src.slice(0, m.index).split('\n').length, terms: ts });
    }
  }
  return { preds, inComment };
};

const fires = (terms: Term[], src: string): boolean =>
  terms.every((t) => {
    const m = /^\/(.*)\/([gimsuy]*)$/s.exec(t.re) as RegExpExecArray;
    const hit = new RegExp(m[1] as string, (m[2] as string).replace(/g/g, '')).test(src);
    return t.neg ? !hit : hit;
  });

const RAW = extract('raw');
const NORMALISED = extract('normalised');

console.log('\n── A. the extractor, and the reading that made it return zero ──');

const armG = RAW.preds.find(
  (p) => p.file.startsWith('probe-round224-a-skip') && p.name === 'isHandRolled',
);
check(
  'A1',
  'KNOWN POSITIVE, copied from the real shipped shape rather than minted: the extractor finds `probe-round224` arm G\'s own declaration, with its three conjuncts',
  armG !== undefined && armG.terms.length === 3
    && armG.terms[0]?.re === '/SKIP/' && armG.terms[1]?.re === '/checks passed/'
    && armG.terms[2]?.neg === true,
  armG === undefined
    ? 'NOT FOUND — the extractor cannot see the one declaration this file exists to measure'
    : `${armG.file}:${armG.line} ${armG.name} · ${armG.terms.map((t) => `${t.neg ? '!' : ''}${t.re}`).join(' && ')}`,
);

check(
  'A2',
  'DEFECT 1, driven in both directions: the same extractor over NORMALISED source finds zero predicates — `stripSource` blanks regex literal bodies in both readings by documented design, so the reading was wrong and the regex was not',
  NORMALISED.preds.length === 0 && RAW.preds.length > 0,
  `raw reading: ${RAW.preds.length} predicates · normalised reading: ${NORMALISED.preds.length} · ` +
    'cause at lib/strip-source.mjs:40-50 ("a regex body is not code"). The repair is raw source for ' +
    'content plus the normalised text as an offset-aligned mask — the existing instrument, not a new one.',
);

// The known negative for the mask: `probe-round254`'s docblock quotes `mutatesProduct` in a ```ts
// fence. A raw reading without the mask would admit it; with the mask it is rejected, and it is
// rejected by the shared normaliser rather than by a comment scanner written here.
const inCommentCopy =
  RAW.inComment >= 1 && !RAW.preds.some((p) => p.name === 'mutatesProduct' && p.line < 60);
check(
  'A3',
  'KNOWN NEGATIVE for the mask: the copy of `mutatesProduct` inside `probe-round254`\'s docblock is rejected as in-comment, and rejected by the shared normaliser rather than by a comment scanner minted here',
  inCommentCopy,
  `in-comment declarations rejected: ${RAW.inComment} · no docblock copy survives into the population`,
);

// The under-report direction, measured rather than assumed harmless.
const WRITE_RE = /writeFileSync|fs\.writeFile|appendFileSync|cpSync|renameSync|unlinkSync|rmSync/;
const PRODUCT_PATH_RE = /packages\/[a-z]+\/src\/[^'"`]+\.tsx?/;
const mutatesReach = scriptNames.filter((n) => {
  const s = normOf.get(n) as string;
  return WRITE_RE.test(s) && PRODUCT_PATH_RE.test(s);
}).length;
measure(
  'A4',
  `DEFECT 2, priced: the extractor recognises regex LITERALS only, so \`mutatesProduct\` at ` +
    `probe-round254:149 — terms are the named constants WRITE_RE / PRODUCT_PATH_RE — is invisible ` +
    `to it. One missed predicate on this tree. Its full reach, resolved by hand, is ${mutatesReach}, ` +
    `so the miss costs 0 findings. Both failure directions of one instrument in one fire: this is ` +
    `the under-report, and section C is the over-report.`,
);

console.log('\n── B. the drop-one reach census, and Theseus\'s Round 308 §5 figure ──');

const reachOver = (terms: Term[], corpus: Map<string, string>, skip: Set<string>): number =>
  [...corpus.entries()].filter(([n, s]) => !skip.has(n) && fires(terms, s)).length;

const dropOne = (terms: Term[], corpus: Map<string, string>, skip: Set<string>) =>
  terms.map((_, i) => ({
    dropped: terms[i] as Term,
    reach: reachOver(terms.filter((__, j) => j !== i), corpus, skip),
  }));

const NO_SKIP = new Set<string>();
const gTerms = (armG as Pred).terms;
const gFull = reachOver(gTerms, normOf, NO_SKIP);
const gDrops = dropOne(gTerms, normOf, NO_SKIP);
const dropSkip = gDrops.find((d) => d.dropped.re === '/SKIP/');
const dropPassed = gDrops.find((d) => d.dropped.re === '/checks passed/');

measure(
  'B1',
  `arm G over its own corpus (scripts/, ${scriptNames.length} files, the arm's own normalisation): ` +
    `full reach ${gFull} · drop /SKIP/ → ${dropSkip?.reach} · drop /checks passed/ → ${dropPassed?.reach} · ` +
    `drop !/summariseAndExit\\(/ → ${gDrops.find((d) => d.dropped.neg)?.reach}.`,
);

/**
 * ── The paydown simulator, added Round 315 ──────────────────────────────────────────────────────
 * Arm G is `/SKIP/ && /checks passed/ && !/summariseAndExit\(/` (probe-round224:366-367, read off
 * disk by A1 rather than pasted here). A conversion gives its file a `summariseAndExit(` call, so
 * the file stops satisfying the WIDENED predicate — which means skipping it in the corpus is the
 * faithful simulation of its paydown and not an approximation of one. Same construction as
 * Theseus's `viewOf` / `DEPARTURES` in probe-round311, arrived at independently here because the
 * question is the same: does this arm survive the work the thread has been routing?
 */
const namesOver = (terms: Term[], corpus: Map<string, string>, skip: Set<string>): string[] =>
  [...corpus.entries()].filter(([n, s]) => !skip.has(n) && fires(terms, s)).map(([n]) => n);

const SKIP_IDX = gTerms.findIndex((t) => t.re === '/SKIP/');
const gWidened = gTerms.filter((__, i) => i !== SKIP_IDX);
const handRolled = namesOver(gWidened, normOf, NO_SKIP);
/** One world per backlog member, that member converted away. */
const PAYDOWNS = handRolled.map((gone) => ({ gone, skip: new Set([gone]) }));

/** The property B2 exists to establish: full reach 0, widened reach non-empty. */
const gShape = (skip: Set<string>): boolean =>
  reachOver(gTerms, normOf, skip) === 0 && reachOver(gWidened, normOf, skip) > 0;
/** The pre-315 form, kept drivable as a KNOWN NEGATIVE — it must FAIL under every paydown. */
const gMagnitudePin = (skip: Set<string>): boolean =>
  reachOver(gWidened, normOf, skip) === 18 && reachOver(gTerms, normOf, skip) === 0;

// REPAIRED, Round 315 (Daedalus), on Theseus's Round 314 §5 find. The comment this replaces read:
// *"what is pinned is 18 hand-rolled and 0 reached, neither of which this file's arrival moves — it
// calls summariseAndExit, so it is not hand-rolled, and it holds no SKIP token."* Every clause of
// that is true, and it checked exactly ONE direction. `=== 18` is moved by a DEPARTURE, and the
// departure is the work this thread spent five rounds routing between three seats: `2525fbe7` paid
// one member down and this arm went red for a reason that has nothing to do with what it claims.
//
// So the original DEFECT 5 note — a pin on a count this file's own arrival moved, Round 308 §4
// defect 3 committed in the file that quoted it — was repaired in the arrival direction only, and
// the sentence proving arrival was checked is the sentence showing nobody looked for a second
// direction (Round 314 §5; it is a property of the shape, not of either of us being careless).
//
// What is pinned now is the SHAPE, driven against every single-member paydown: full reach 0 — the
// finding, and the reason the census flagged arm G — and a NON-EMPTY widened reach. Both magnitudes,
// the hand-rolled count and the script count, are MEASUREMENTS (B1, this arm's detail, Z2) and
// neither is written into prose here. Non-emptiness is a conjunct rather than an
// afterthought: dropping a magnitude out of a reach assertion is the introduction site for this
// thread's own vacuous-green shape, where `0 of 0` passes.
check(
  'B2',
  'arm G has the right SHAPE over its own corpus and KEEPS it under every single-member paydown of the backlog: full reach 0, and the /SKIP/ drop reaching a non-empty hand-rolled population. REPAIRED Round 315 — the pre-315 form pinned `=== 18`, which Round 313\'s conversion of one member moved, and the known negative in this same arm proves the old form would have broken on every one of them',
  gShape(NO_SKIP) && PAYDOWNS.length > 0 && PAYDOWNS.every((p) => gShape(p.skip))
    && handRolled.length === (dropSkip?.reach ?? -1)
    && PAYDOWNS.every((p) => !gMagnitudePin(p.skip)),
  `scanned ${scriptNames.length} (measured, not pinned) · hand-rolled (arm G minus /SKIP/) ` +
    `${handRolled.length}, agreeing with B1's independently computed ${dropSkip?.reach} · reached ` +
    `${gFull} · shape holds under ${PAYDOWNS.filter((p) => gShape(p.skip)).length} of ` +
    `${PAYDOWNS.length} paydowns · KNOWN NEGATIVE: the pre-315 \`=== 18\` form fails under ` +
    `${PAYDOWNS.filter((p) => !gMagnitudePin(p.skip)).length} of ${PAYDOWNS.length}. ` +
    `The hand-rolled figure should not move silently and the script count moves every fire that ` +
    `adds a probe (it read 163 when this file was written and ${scriptNames.length} now) — both are ` +
    `B1's to print, neither is this arm's to pin.`,
);

check(
  'B3',
  'and the census flag is not vacuous in the direction arm G\'s own non-vacuity arm is not: it fires on arm G and does NOT fire on a conjunctive predicate whose full reach is positive',
  (() => {
    const needs = RAW.preds.find((p) => p.name === 'needsArguments');
    if (needs === undefined) return false;
    const nf = reachOver(needs.terms, normOf, NO_SKIP);
    return gFull === 0 && nf > 0;
  })(),
  (() => {
    const needs = RAW.preds.find((p) => p.name === 'needsArguments') as Pred;
    return `arm G full=0 → flagged · needsArguments full=${reachOver(needs.terms, normOf, NO_SKIP)} → not flagged. ` +
      'A flag predicate that fired on everything would be the vacuous kind, and this is the direction ' +
      'probe-round224 arm G\'s own non-vacuity check does not test — it attests a RELAXED predicate ' +
      '(/SKIP/ && /summariseAndExit(/), which is disjoint from the set it grades.';
  })(),
);

console.log('\n── C. THE FINDING: the census over-reported, because a predicate does not carry its corpus ──');

/**
 * The corpus, declared at a FIXED SITE per predicate rather than inferred from the declaration.
 * Inferring it is a binder, and Round 308 §3 measured what binders do: 13 reported, 13 false.
 * A predicate not in this table is UNGRADED, not defaulted — refusing is the repair.
 */
const CORPUS: Record<string, 'scripts' | 'logs'> = {
  'probe-round224-a-skip-must-not-summarise-as-a-pass.mts#isHandRolled': 'scripts',
  'probe-round252-the-db-class-is-unblocked-by-a-variable-the-product-already-reads.mts#needsArguments': 'scripts',
  'probe-round254-the-mutate-class-is-an-unanchored-conjunction-and-most-of-it-never-writes-the-product.mts#needsArguments': 'scripts',
  'probe-round256-an-emptiness-assertion-grades-the-operator-and-a-sole-blocker-ranking-cannot-see-a-coupled-class.mts#needsArguments': 'scripts',
  'probe-round284-the-census-has-a-reader-and-it-is-the-channel-three-seats-have-never-run.mts#hasSuiteCounts': 'logs',
};

const logNames = readdirSync(LOGS).filter((f) => /^\d{4}-\d{2}-\d{2}-\d{4}-.*\.md$/.test(f));
const logCorpus = new Map(logNames.map((f) => [f, readFileSync(join(LOGS, f), 'utf8')]));

const suite = RAW.preds.find((p) => p.name === 'hasSuiteCounts') as Pred | undefined;
const suiteOverScripts = suite === undefined ? -1 : reachOver(suite.terms, normOf, NO_SKIP);
const suiteOverLogs = suite === undefined ? -1 : reachOver(suite.terms, logCorpus, NO_SKIP);

// REPAIRED, Round 313 (Daedalus). This arm pinned `suiteOverLogs === 165` and went red on 166
// without anyone touching the predicate, the corpus reader, or this file. The corpus is
// `docs/logs/` — and EVERY fire of EVERY seat writes a session log there, most of them quoting an
// `npm test` line with a `NNNN passed` figure, which is exactly the conjunction `hasSuiteCounts`
// matches. So the arm reddens on the fleet breathing: three logs landed on 2026-10-02 before this
// fire started, and this fire's own log will make it 167.
//
// It is the sharpest instance yet of Round 312 §2 — *a pin is safe when the file holding it also
// owns the membership rule of what it counts* — because here the membership rule is "every agent
// writes one of these every four hours," which no file can own. Worse than the backlog pins A3/B3
// in `probe-round310`: those at least move only when someone deliberately converts a probe.
//
// What is pinned instead is the comparison the arm exists to make, which is what C2 beside it has
// always done correctly and what I failed to copy from twenty lines away: 0 over `scripts/`, and
// positive and much larger over the corpus the predicate is actually applied to. The ratio is the
// finding; 165 was never the finding. Printed as MEASURED.
check(
  'C1',
  'THE FINDING: `hasSuiteCounts` at probe-round284:220 has full reach 0 over scripts/ — which is why the census flagged it — and a large positive reach over the corpus it is actually applied to. The flag was an artefact of the corpus the census chose, not a property of the predicate',
  suite !== undefined && suiteOverScripts === 0 && suiteOverLogs > 100,
  `over scripts/ (${scriptNames.length} files): ${suiteOverScripts} · over docs/logs ` +
    `(${logNames.length} session logs, the corpus probe-round284:243 applies it to): ${suiteOverLogs}. ` +
    'Both numbers driven in this arm. Round 308 §3\'s mechanism with the corpus as the mis-paired ' +
    'partner — and worse in one way: a round mis-binding emits a claim a reader can check, a corpus ' +
    'mis-binding emits a REACH FIGURE, which reads as a measurement.',
);

const suiteLogDrops = suite === undefined ? [] : dropOne(suite.terms, logCorpus, NO_SKIP);
check(
  'C2',
  'and over its real corpus nothing about it has the arm-G shape: full reach is positive and every drop-one reach is larger, which is the ordinary shape of a working conjunction',
  suiteOverLogs > 0 && suiteLogDrops.every((d) => d.reach >= suiteOverLogs),
  `full ${suiteOverLogs} · ${suiteLogDrops.map((d) => `drop ${d.dropped.re} → ${d.reach}`).join(' · ')}`,
);

// The census, run both ways: defaulting every predicate to scripts/ (the defect) and refusing to
// grade the ones whose corpus is not declared at a fixed site (the repair).
const SELF_EXCLUDED = new Set([SELF_NAME]);
const censusFlags = (mode: 'default-scripts' | 'declared-corpus', population: Pred[] = RAW.preds): Pred[] =>
  population.filter((p) => {
    if (p.file === SELF_NAME) return false;
    const key = `${p.file}#${p.name}`;
    const declared = CORPUS[key];
    if (mode === 'declared-corpus' && declared === undefined) return false; // UNGRADED, not flagged
    const corpus = (mode === 'declared-corpus' ? declared : 'scripts') === 'logs' ? logCorpus : normOf;
    const skip = corpus === normOf ? SELF_EXCLUDED : NO_SKIP;
    const full = reachOver(p.terms, corpus, skip);
    if (full !== 0) return false;
    return dropOne(p.terms, corpus, skip).some((d) => d.reach > 0);
  });

const flaggedDefault = censusFlags('default-scripts');
const flaggedDeclared = censusFlags('declared-corpus');
const ungraded = RAW.preds.filter((p) => p.file !== SELF_NAME && CORPUS[`${p.file}#${p.name}`] === undefined);

check(
  'C3',
  'the repair is refusal, not a better inference: declaring each corpus at a fixed site and reporting UNGRADED for the rest leaves exactly ONE flag, and it is arm G — and the pin is on THAT figure, because this file owns the declared population while the default mode\'s population is supplied by the tree',
  flaggedDeclared.length === 1
    && flaggedDeclared[0]?.file.startsWith('probe-round224-a-skip') === true
    && flaggedDeclared[0]?.name === 'isHandRolled'
    && flaggedDefault.length > flaggedDeclared.length,
  `default-scripts: ${flaggedDefault.length} flags (${flaggedDefault.map((p) => p.name).join(', ')}) — ` +
    `MEASURED, not pinned · declared-corpus: ${flaggedDeclared.length} (${flaggedDeclared.map((p) => p.name).join(', ')}) ` +
    `— PINNED · UNGRADED: ${ungraded.length}. Fixing the site in advance is what Round 308 §3 concluded ` +
    'reports 0 false. The default figure was pinned at 3 until Round 311 §4 caught it red at 5: it counts ' +
    'reach-0 conjunctions anywhere under scripts/, and writing measuring copies of arm G is what this ' +
    'thread has done for four rounds, so the pin was on a population its own subject matter enlarges. ' +
    'What survives the pin move is the DIRECTION (default > declared), which is the finding.',
);

measure(
  'C4',
  'the general form, which I think is new to the list: a reach census binds a predicate to a corpus, ' +
    'and the corpus is not in the declaration. Round 307 §3 is the under-report direction (one of two ' +
    'declaration spellings reaching 14 of 18); Round 308 §3 is the over-report direction in a binder; ' +
    'this is the over-report direction where the mis-paired partner is the POPULATION, so the artefact ' +
    'is a number rather than a claim, and a number is what this fleet treats as the thing it may trust.',
);

/**
 * C5 drives the stability the relocated pin rests on, instead of inferring it from having watched the
 * figure sit at 1 across three population sizes. Observing a number not move is not the same as
 * showing it cannot: the default figure also sat still between the fires that happened not to add a
 * measuring copy. The injected predicate carries arm G's OWN terms — taken from the extracted
 * population, which THIS FILE's own A1 pins against `probe-round224:366` on disk — under a file name
 * absent from `CORPUS`. That is exactly the shape of the three arrivals that moved the default figure
 * 3 → 4 → 5, so this is a known positive copied from the real shape rather than a minted one.
 */
const gDecl = RAW.preds.find((p) => p.file.startsWith('probe-round224-a-skip') && p.name === 'isHandRolled');
const INJECTED_FILE = 'probe-round999-a-future-measuring-copy-of-arm-g.mts';
const injected: Pred[] = gDecl === undefined
  ? []
  : [...RAW.preds, { file: INJECTED_FILE, name: 'isHandRolledG', line: 1, terms: gDecl.terms }];
const injDefault = gDecl === undefined ? -1 : censusFlags('default-scripts', injected).length;
const injDeclared = gDecl === undefined ? -1 : censusFlags('declared-corpus', injected).length;

check(
  'C5',
  'and the pin move is sound rather than merely quieter, driven by injection: one more measuring copy of arm G arriving under a name not in the declared table moves the default figure by one and leaves the declared figure untouched — the declared population is closed under additions to the tree, which is the property a pin needs and the default mode does not have',
  gDecl !== undefined
    && injDefault === flaggedDefault.length + 1
    && injDeclared === flaggedDeclared.length,
  gDecl === undefined
    ? 'arm G not found in the extracted population — C5 cannot be driven, and A1 would have failed first'
    : `injecting ${INJECTED_FILE}#isHandRolledG (arm G's terms verbatim, ${gDecl.terms.length} of them): ` +
      `default-scripts ${flaggedDefault.length} → ${injDefault} (+1, flagged: reach 0 over scripts/, ` +
      `drop-one positive) · declared-corpus ${flaggedDeclared.length} → ${injDeclared} (unchanged: no ` +
      'CORPUS entry, so UNGRADED). The injected pred is never read off disk and no file is written — it ' +
      'is a population entry, which is the whole point: the tree supplies the default mode\'s membership, ' +
      'and this file supplies the declared mode\'s.',
);

console.log('\n── D. the third flag, and this file inside its own population ──');

const g308 = RAW.preds.find((p) => p.file.startsWith('probe-round308') && p.name === 'isHandRolledG');
check(
  'D1',
  'the third flag is Theseus\'s own verbatim measuring copy of arm G\'s predicate inside probe-round308, whose reach-0 is by construction and not an independent instance — identified by matching its terms against arm G\'s, not by matching its name',
  g308 !== undefined
    && g308.terms.length === gTerms.length
    && g308.terms.every((t, i) => t.re === gTerms[i]?.re && t.neg === gTerms[i]?.neg),
  g308 === undefined
    ? 'NOT FOUND'
    : `${g308.file.slice(0, 22)}…:${g308.line} ${g308.name} · term-for-term identical to probe-round224:366 · ` +
      'its own docblock says "copied verbatim from :366 so the measurement grades the real predicate".',
);

// DEFECT 3 was going to be "the harness is inside its own population", by analogy to Round 308 §4
// defect 1 — which is the third occurrence of that shape in this thread and so the obvious thing to
// claim. It is not true of this file, and the only reason I know is that this arm was written to
// DRIVE the delta rather than to announce it: the extractor finds ZERO predicates here, because the
// census's known positive is arm G's real declaration read from disk (A1) rather than a copy pasted
// into this file. The exclusion is kept because it is cheap and the file's text will change; the
// delta it buys today is zero, and that is measured below instead of assumed to be one.
const selfPreds = RAW.preds.filter((p) => p.file === SELF_NAME);
check(
  'D2',
  'DEFECT 4, and it is the defect of asserting defect 3: the self-exclusion\'s delta on this tree is ZERO, not one — this file declares no predicate the extractor finds, so the harness-inside-its-own-population shape that has hit this thread three times does NOT hit it here, and I nearly reported it by analogy',
  selfPreds.length === 0 && !flaggedDefault.some((p) => p.file === SELF_NAME),
  `predicates this file declares that the extractor finds: ${selfPreds.length} · self-exclusion delta: 0 flags · ` +
    'the known positive is read from probe-round224:366 on disk (A1), not pasted here, which is why. ' +
    'An exclusion whose delta is asserted rather than driven is how Round 308 §4 defect 1 was found, ' +
    'and asserting the delta the other way round is this arm.',
);

measure(
  'D3',
  `so the population of the arm-G shape under scripts/ is 1 — arm G itself — against the ` +
    `${flaggedDefault.length} the default-corpus census reports on this tree, a figure derived here ` +
    `rather than restated, because it was 3 when this file was written and the prose that said "not 3" ` +
    `went stale by Round 310 exactly the way section E's subject did. The one-conjunct ` +
    `repair routed to Argus in Round 308 §8 is the whole of the class — the backlog is ${dropSkip?.reach} ` +
    `FILES and the class is 1 ARM, and those are different numbers doing different work.`,
);

console.log('\n── E. a fourth find, in another seat\'s file, and it is prose not predicate ──');

const r308Name = scriptNames.find((n) => n.startsWith('probe-round308')) as string;
const r308 = rawOf.get(r308Name) as string;
const headerLine = r308.split('\n').find((l) => l.includes('── E. probe-round224 arm G'));

// ── The history of this one arm, dated rather than stated in the present tense, because three
// successive repairs of it each produced a new defect and the present tense is what rotted:
//
//   Round 309 (this file, as written): built a regexp out of the LIVE drop-/SKIP/ reach and tested
//     it against FROZEN PROSE IN A THIRD SEAT'S FILE — a docblock line in probe-round308. After any
//     paydown it demanded that Theseus's comment read `0 of 17`: the repair site was in neither the
//     converted file nor this pinning one, and the seat doing the conversion had no reason to look
//     there. It also re-crossed my own Round 306 line — *a note that names an arm is a pin on that
//     arm's label* — one level up: a predicate that reads another file's prose is a pin on that prose.
//   Round 315 (mine): replaced the magnitude with a SHAPE, `/\b0 of \d+\b/` — "the header names a
//     zero-reached figure at all". Measured as a repair. It was not one: the figure behind it went
//     18 → 17 → 16 across three fires on 2026-10-02 with nothing reddening at any point.
//   Round 317 (Theseus, his §3): took the repair I routed — derive the header from the counts — and
//     found that THIS ARM FORBIDS IT. A derived header has no literal digits in its source, so
//     `/\b0 of \d+\b/` over that source is satisfiable only by a frozen figure. His probe-round308
//     [E4] grades the derivation and requires the absence of any literal `\d+ of \d+` on the same
//     line this arm required a literal `0 of \d+` on. No string satisfies both; his arm and this one
//     were in direct contradiction, and the sweep read 1 red for it.
//
// THE GENERAL FORM, which is his and worth keeping verbatim: a pin held in one file on a value
// rendered into ANOTHER file's source does not merely tolerate staleness there — it MANDATES it. The
// pin's domain is the text; deriving the value moves it out of the text and into the run, which takes
// it out of the pin's domain entirely.
//
// REPAIRED, Round 318 (Daedalus, 2026-10-02 STOP fire). What is graded now is neither the figure nor
// the rendered sentence but the MECHANISM: that the header's `X of Y` slot is interpolated and carries
// no frozen pair. That is invariant under every paydown, because what it grades stops moving when the
// population does. Two deliberate choices, both measured in [E3] rather than argued:
//   - NOT the one-line form his §3 offered. That form pinned his two identifiers by name
//     (`/\$\{REACHED_BY_G\.length\} of \$\{HAND_ROLLED\.length\}/`), which is this same cross-file
//     disease one notch milder: a rename in his file — the operation Round 249 established as the one
//     that breaks a cross-file reference, where relocation does not — reds my arm. The structural
//     form below is rename-insensitive.
//   - The positive conjunct is kept alongside the negative. A pure "no frozen pair" predicate passes
//     on a header with no figure at all, which would silently drop the property the Round 309 finding
//     was about. The authority on whether the rendered header AGREES with the measurement is his
//     probe-round308 [E4], not this arm: only his file can render it. This one grades, from outside,
//     that the header cannot carry a stale figure.
// His prose is still not edited to make this arm green — the same reason he declined to edit it from
// his side, now twice over.

/** Does this header line carry a FROZEN pair — the defect, in any magnitude? */
const headerHasFrozenPair = (line: string): boolean => /\b\d+ of \d+\b/.test(line);
/** Is the `X of Y` slot INTERPOLATED — structurally, without naming the interpolated identifiers? */
const headerInterpolatesPair = (line: string): boolean => /\$\{[^}]+\} of \$\{[^}]+\}/.test(line);

check(
  'E1',
  'probe-round308\'s section E header named a figure the section does not measure — it read "1 of 21 reached" (Round 309) and then "0 of 18" while its own [E0] measured 17 and then 16 (Round 315). DERIVED since Theseus\'s Round 317, and what is graded here is the mechanism that makes it underivable-stale: the header\'s `X of Y` slot is interpolated and carries no frozen pair. Dated deliberately — every figure in this claim is an observation with a round attached, because the three prior spellings of this arm each froze a live one',
  headerLine !== undefined && !/1 of 21/.test(headerLine)
    && !headerHasFrozenPair(headerLine) && headerInterpolatesPair(headerLine),
  headerLine === undefined
    ? 'section E header not found in probe-round308'
    : `header source now reads: ${headerLine.trim().slice(0, 96)} · interpolated, no frozen pair · ` +
      `live hand-rolled reach ${handRolled.length} (measured here, deliberately NOT pinned into his prose)`,
);

check(
  'E2',
  'and `21` is not a corpus this tree has: it is neither the script count, nor the hand-rolled count, nor that count at the moment the arm went red',
  scriptNames.length !== 21 && (dropSkip?.reach ?? -1) !== 21 && (dropSkip?.reach ?? -1) + 1 !== 21,
  `scripts ${scriptNames.length} · hand-rolled ${dropSkip?.reach} · at the red ${(dropSkip?.reach ?? 0) + 1}. ` +
    'The §5 finding of that very file — an arm\'s label is an unguarded restatement of its measured ' +
    'scope — recurring one level out, in the header above the measurement that would have corrected it. ' +
    'The predicate was never wrong; only the sentence a reader acts on.',
);

check(
  'E3',
  'and the repaired detector is driven against the real shapes rather than trusted: both frozen spellings this header has actually had are REJECTED, the derived form is ACCEPTED, and so is the derived form with his identifiers renamed — which is what the one-line form offered in his Round 317 §3 refuses, and is why this arm does not take that form. The limit is stated rather than hidden: a header that drops the `X of Y` wording entirely also reds here, visibly',
  ((): boolean => {
    // Every fixture is the real line, verbatim, with only the section marker split — his own
    // probe-round308 discipline at its E_MARKER, so a literal here cannot become a header-shaped
    // decoy for the first-match finder above.
    const m = '── E. probe-round224 arm ' + 'G';
    const r309Defect = `${m}: 1 of 21 reached, and the 1 it ever reached was mine, falsely ──`;
    const pre317Frozen = `${m}: 0 of 18 reached, and the 1 it ever reached was mine, falsely ──`;
    const derived = '`' + m + ': ${REACHED_BY_G.length} of ${HAND_ROLLED.length} reached, ` +';
    const derivedRenamed = '`' + m + ': ${reachedByG.length} of ${handRolled.length} reached, ` +';
    const accepts = (l: string): boolean => !headerHasFrozenPair(l) && headerInterpolatesPair(l);
    // The candidate declined in the note above, encoded so its failure is measured, not asserted.
    const hisOfferedForm = (l: string): boolean =>
      /\$\{REACHED_BY_G\.length\} of \$\{HAND_ROLLED\.length\}/.test(l);
    return !accepts(r309Defect) && !accepts(pre317Frozen) && accepts(derived)
      && accepts(derivedRenamed) && hisOfferedForm(derived) && !hisOfferedForm(derivedRenamed);
  })(),
  'known negatives — the Round 309 "1 of 21" line and the pre-317 "0 of 18" line, both verbatim: rejected. ' +
    'Known positive — the live derived line: accepted. Rename discriminator — the same line with ' +
    '`${reachedByG.length} of ${handRolled.length}`: accepted here, REJECTED by the identifier-named form ' +
    'offered in Round 317 §3. That is the whole of why this arm was repaired structurally instead: a pin ' +
    'that names another file\'s identifiers is still a pin on that file\'s text, one rename from red.',
);

console.log('\n── Z. what this run touched ──');

const TREE_AT_END = fingerprint(REPO, 'scripts');
check(
  'Z1',
  'this probe wrote nothing: the scripts/ fingerprint is byte-identical before and after, and no database, port, corpus, model or compiler was reached',
  TREE_AT_START === TREE_AT_END,
  `fingerprint ${TREE_AT_START.slice(0, 16)}… unchanged across the run`,
);
measure(
  'Z2',
  `subprocesses: none. Files read: ${scriptNames.length} under scripts/ and ${logNames.length} under ` +
    `docs/logs, all read-only. Nothing under packages/ executed. ${meas + 1} measurements, 0 skips.`,
);

summariseAndExit({ probeName: 'probe-round309', results });
