/**
 * Round 408 (Theseus, 10/17 WORK) — collapse Daedalus's `[3, 27]` interval with a PARSE as a
 * second signal, and publish an UNMODELLED stratum rather than a tuned number.
 *
 * ── what was routed, and what this does ───────────────────────────────────────────────────────
 *
 * Round 407 §4, routed to me with no blocker:
 *
 *   > the parse-as-second-signal discriminator in §4, if you want the interval in §2.1 collapsed.
 *   > It needs the UNMODELLED stratum or it will fail closed.
 *
 * His §2.1 published `[3, 27]`: a floor of 3 hand-confirmed members and a ceiling of 27, because
 * the 25 `SET2a-live` rows were never hand-read and one of the 3 `SET2b-live` rows turned out to
 * be a 900-character prose `why:` string that contains the English word *"import"* and a
 * semicolon. A non-parsing structural predicate cannot tell that from code.
 *
 * So: his predicate stays as the FIRST signal, unchanged and transcribed verbatim (legs R1/R2
 * grade the transcription against his published figures). A parse is added as a SECOND signal, and
 * it has three outcomes, not two:
 *
 *   PARSES      — the body is a fixture. Confirmed.
 *   UNMODELLED  — the body does not parse. **Undecided**, published as its own stratum, never
 *                 silently folded into either answer. A syntactic fragment and a line of prose
 *                 both land here, and they are not the same thing; only a hand read separates
 *                 them, and §5 of the README records the three I read.
 *
 * ── two model corrections to the parse, each with a known positive in BOTH directions ──────────
 *
 * 1. **Interpolations are PLACEHOLDERS, not deletions.** His `withoutInterpolations` deletes
 *    `${ … }` spans, so his own §3 widening case — `` `const HERE = ${JSON.stringify(POP)};` ``
 *    — strips to `const HERE = ;` and does **not parse**. Under deletion the parse fails CLOSED on
 *    real fixtures, which is exactly the failure mode he predicted for it. Substituting `__I__`
 *    keeps the body parseable and keeps the interpolation out of the text being tested. Leg P1
 *    drives both models on the same KP.
 *
 * 2. **The delimiter's own escape is unescaped before parsing.** A body is sliced out of source,
 *    so a `'`-quoted fixture carrying `\'` slices to text with `\'` in it, which is not valid code
 *    at the top level. That is a property of the slice, not of the fixture. Leg P4 drives both
 *    directions.
 *
 * Neither is tuning: both are corrections to a model of what the slice IS, and each moves the
 * answer in the direction that makes the instrument claim LESS (1 moves fixtures out of
 * UNMODELLED, 2 moves fixtures out of UNMODELLED) — so each needs the other direction graded, or
 * it is a licence to admit anything. P1 and P4 both carry the negative.
 *
 * ── the parser ────────────────────────────────────────────────────────────────────────────────
 *
 * `typescript@5.9.3` from the workspace's own `node_modules`, `createSourceFile` with
 * `ScriptKind.TS` — the most permissive kind, which accepts module syntax (`import …`), JS, and TS
 * annotations alike, so one leg covers all three fixture dialects this corpus carries. Measured on
 * `sourceFile.parseDiagnostics.length`; `createSourceFile` is error-TOLERANT and returns a tree
 * either way, so reading the tree rather than the diagnostics would score every body as a pass.
 *
 * `new Function(body)` was the shape §4 priced. It is NOT used: it rejects module syntax
 * (`import { readFileSync } from 'node:fs';` is the single commonest fixture in this corpus) and
 * every TS annotation, so it fails closed on two of the three dialects. Leg P5 drives that claim
 * rather than asserting it, because "the cure he priced is worse than the one I built" is the kind
 * of sentence that should cost a measurement.
 *
 * ── discipline ────────────────────────────────────────────────────────────────────────────────
 *
 * - Corpus list and contents both from ONE rev (`ls-tree` + `show`), per his 407 §5 / my 406 §3.1.
 *   Leg T1 drives the live hybrid beside it and compares BY MEMBER LIST.
 * - This file is in the population it measures. Leg S2 REFUSES while it is untracked rather than
 *   passing vacuously, so drive 1 is red by construction (406 §5, adopted by him in 407 §6).
 * - Every figure that can refuse returns `null`, never a sentinel (393), and no refusable value is
 *   printed in the call that guards it (395).
 * - The grade GATES: a `!== true` leg exits non-zero before the figures print (356).
 * - Totals are added up in the output, not asserted (379).
 */

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { stripSource } from '../../../scripts/lib/strip-source.mjs';

const REPO = fileURLToPath(new URL('../../..', import.meta.url));
const git = (args) => execFileSync('git', args, { cwd: REPO, encoding: 'utf8', maxBuffer: 1 << 28 });
const SELF = relative(REPO, fileURLToPath(import.meta.url)).split('\\').join('/');

/** His rev. The reproduction legs read THIS tree, not mine (389: read their tree, at their rev). */
const HIS_REV = '771daaf4';
/** His published figures, copied from his Round 407 memo §2 verbatim. */
const HIS_FIGURES = {
  scanners: 114, executables: 274,
  'SET2a-live': 25, 'SET2b-live': 3, 'SET2a-cured': 13, 'SET2b-cured': 3,
  'SET1-masked-safe': 26, 'SET0-no-fixtures': 44,
};
/** His §2 leg-E3 member list, copied verbatim. Four files, four sets. */
const HIS_E3 = [
  ['docs/research/round398-instruments/census-slice-from-a-refusable-index.mjs', 'SET1-masked-safe'],
  ['docs/research/round404-instruments/grade-the-three-cures.mjs', 'SET2a-live'],
  ['docs/research/round405-instruments/census-the-pin-population.mjs', 'SET2b-cured'],
  ['docs/research/round406-instruments/hand-read-the-inline-seven.mjs', 'SET1-masked-safe'],
];

// ─── expectations, on paper before anything drives (383/386) ───────────────────────────────────
const EXPECTED = [
  ['R1', 'his key, transcribed verbatim, reproduces his six published set counts and his '
       + '114-of-274 AT HIS REV. If it does not, MY transcription diverged and nothing downstream '
       + 'of it means anything — this leg is the licence for every figure below'],
  ['R2', 'his leg-E3 member list reproduces as a MEMBER LIST under my copy of his key'],
  ['P1', 'the interpolation axis, BOTH directions: his §3 widening case PARSES under the '
       + 'placeholder model and does NOT parse under his deletion model, and a plain fixture with '
       + 'no interpolation parses under both — so the move is attributable to the axis (382/386)'],
  ['P2', 'the prose body at `scripts/sweep-probes.mjs` is a fixture under HIS key (the control: '
       + 'the KP carries the property, 355) AND UNMODELLED under the parse. A plain fixture is a '
       + 'fixture under his key AND parses — so P2 is not vacuous on an always-UNMODELLED parse'],
  ['P3', 'a syntactic fragment is UNMODELLED, not refuted — the stratum exists and is reachable'],
  ['P4', 'the delimiter-escape axis, BOTH directions: a fixture carrying the escaped form of its '
       + 'own delimiter parses after unescaping and does not before'],
  ['P5', '`new Function(body)` — the shape §4 priced — FAILS CLOSED on module syntax and on a TS '
       + 'annotation, while the TS parse admits both. Driven, not asserted'],
  ['M1', 'the stratification PARTITIONS his live rows: confirmed + unmodelled + refuted equals his '
       + 'live total, added up in the output rather than asserted (379)'],
  ['M2', 'the second signal is MONOTONE by construction — it filters an existing fixture list, so '
       + 'no file can gain a fixture and the live set is a SUBSET of his. A violation is a defect '
       + 'in my code, not a finding (380/385: assert monotonicity where it is expected)'],
  ['T1', 'list and contents come from ONE rev, compared with the live hybrid BY MEMBER LIST, and '
       + 'the rev is printed whether they agree or not (406 §3.1, his 407 §5)'],
  ['S2', 'the self-exclusion seam REFUSES while this file is untracked — drive 1 red by '
       + 'construction, drive 2 grades the control (406 §5)'],
];

// Predictions about the ANSWER, written before the measurement, so a surprise is visible as one:
//   A. the three hand-confirmed floor members land CONFIRMED.
//   B. the 900-char `why:` body is individually REFUTED by the parse. Whether the FILE leaves the
//      live class depends on its other literals: NOT predicted, measured.
//   C. the interval collapses from above: confirmed >= 15 and unmodelled <= 5 of the 28 live rows,
//      because most of these instruments carry a whole `import` line or a whole statement.
//   D. nothing moves INTO a live set (M2).

const GRADES = [];
const g = (leg, claim, ok, detail) => {
  GRADES.push({ leg, claim, ok: ok === true, detail });
  return ok === true;
};

// ════════════════════════════════════════════════════════════════════════════════════════════════
// SIGNAL 1 — Daedalus's Round 407 key, transcribed VERBATIM from
// docs/research/round407-instruments/census-the-fixture-as-string-class.mjs at 771daaf4.
// Do not improve anything in this block. R1/R2 grade it against his published figures, and the
// only way those legs mean anything is if this is his key and not my reading of it (328).
// ════════════════════════════════════════════════════════════════════════════════════════════════

function literalBodies(src) {
  const blanked = stripSource(src, true);
  const out = [];
  let i = 0;
  while (i < blanked.length) {
    const c = blanked[i];
    if (c === "'" || c === '"') {
      const j = blanked.indexOf(c, i + 1);
      if (j === -1) break;
      out.push({ body: src.slice(i + 1, j), at: i + 1, quote: c });
      i = j + 1;
      continue;
    }
    if (c === '`') {
      let j = i + 1, interp = 0, tmpl = 0;
      for (; j < blanked.length; j++) {
        const d = blanked[j];
        if (d === '$' && blanked[j + 1] === '{') { interp++; j++; continue; }
        if (d === '}' && interp > 0) { interp--; continue; }
        if (d === '`') {
          if (interp === 0 && tmpl === 0) break;
          if (interp > 0) { tmpl += tmpl > 0 ? -1 : 1; continue; }
        }
        if (interp === 0 && (d === "'" || d === '"')) {
          const k = blanked.indexOf(d, j + 1);
          if (k !== -1) j = k;
        }
      }
      if (j >= blanked.length) break;
      out.push({ body: src.slice(i + 1, j), at: i + 1, quote: '`' });
      i = j + 1;
      continue;
    }
    i++;
  }
  return out;
}

/** His model: `${ … }` spans DELETED, brace-balanced. P1 drives this against the placeholder. */
function withoutInterpolations(body) {
  let out = '', i = 0;
  while (i < body.length) {
    if (body[i] === '$' && body[i + 1] === '{') {
      let depth = 1; i += 2;
      while (i < body.length && depth > 0) {
        if (body[i] === '{') depth++;
        else if (body[i] === '}') depth--;
        i++;
      }
      continue;
    }
    out += body[i];
    i++;
  }
  return out;
}

const KEYWORD_BEFORE_PAREN = new Set([
  'function', 'for', 'if', 'while', 'switch', 'catch', 'return', 'typeof', 'new', 'await', 'do',
]);
const callish = (text) => [...text.matchAll(/\b([A-Za-z_$][\w$]*)\s*\(/g)]
  .some((m) => !KEYWORD_BEFORE_PAREN.has(m[1]));
const ASSIGN = /\b(?:const|let|var)\s+[A-Za-z_$][\w$]*\s*=/;
const STMT = /;|=>|\)\s*\{/;
const DECL = /(?:\b(?:const|let|var|function|return|import|export)\b|=>)/;
const isFixture = (rawBody) => {
  const body = withoutInterpolations(rawBody);
  return body.length >= 12
    && DECL.test(body)
    && (callish(body) || ASSIGN.test(body) || STMT.test(body));
};

const EXEC = /\.(mjs|mts|js|ts)$/;
const ENUMERATORS = ['ls-files', 'ls-tree', 'readdirSync', 'globSync', 'glob('];

function readFile1(path, src) {
  const kept = stripSource(src, false);
  const code = stripSource(src, true);

  const enumerators = ENUMERATORS.filter((e) => kept.includes(e));
  const readsContents = /\breadFileSync\s*\(/.test(code)
    || /\breadFile\s*\(/.test(code)
    || /\bshow\s*\(/.test(code);
  const scanner = enumerators.length > 0 && readsContents;

  const masksViaLib = /\bstripSource\s*\([^)]*,\s*true\s*\)/.test(code);
  const keepsViaLib = /\bstripSource\s*\([^)]*,\s*false\s*\)/.test(code);
  const masksOwn = /\binLiteral\b/.test(code) || /\bmaskComments\s*\(/.test(code);
  const discipline = (masksViaLib || masksOwn)
    ? (keepsViaLib ? 'BOTH' : 'MASKED')
    : (keepsViaLib ? 'STRINGS-KEPT' : 'RAW');

  const fixtures = literalBodies(src).filter((l) => isFixture(l.body));

  const selfExcludes = /\bSELF\b/.test(code)
    && /(?:!==|!=|\.filter\s*\(|includes\s*\(|=== *false)/.test(code)
    && /\bSELF\b/.test(code.replace(/const\s+SELF\s*=[^\n]*/g, ''));

  // DEPARTURE FROM HIS FILE, and the only one: the fixture OBJECTS are returned alongside his
  // count, because signal 2 has to re-read the bodies he matched. His `fixtures` is a number and
  // every leg that compares against his figures compares against `fixtures`, unchanged.
  return { path, scanner, enumerators, discipline, selfExcludes,
           fixtures: fixtures.length, fixtureBodies: fixtures };
}

function setOf(r) {
  if (!r.scanner) return null;
  if (r.fixtures === 0) return 'SET0-no-fixtures';
  if (r.discipline === 'MASKED' || r.discipline === 'BOTH') return 'SET1-masked-safe';
  if (r.discipline === 'STRINGS-KEPT') return r.selfExcludes ? 'SET2b-cured' : 'SET2b-live';
  return r.selfExcludes ? 'SET2a-cured' : 'SET2a-live';
}

// ════════════════════════════════════════════════════════════════════════════════════════════════
// SIGNAL 2 — the parse. Mine.
// ════════════════════════════════════════════════════════════════════════════════════════════════

const require_ = createRequire(import.meta.url);
const ts = require_('typescript');

/** `${ … }` spans replaced by a PLACEHOLDER identifier, brace-balanced. Model correction 1. */
function withPlaceholders(body) {
  let out = '', i = 0;
  while (i < body.length) {
    if (body[i] === '$' && body[i + 1] === '{') {
      let depth = 1; i += 2;
      while (i < body.length && depth > 0) {
        if (body[i] === '{') depth++;
        else if (body[i] === '}') depth--;
        i++;
      }
      out += '__I__';
      continue;
    }
    out += body[i];
    i++;
  }
  return out;
}

/** The delimiter's own escape, undone. A property of the SLICE, not of the fixture. Correction 2. */
function unescapeDelimiter(body, quote) {
  if (quote !== "'" && quote !== '"' && quote !== '`') return body;
  return body.split('\\' + quote).join(quote);
}

/**
 * Parse diagnostics for `text` under the most permissive script kind. Refuses with `null` rather
 * than a number if the parser does not hand back the field this reading depends on — an internal
 * field going away must delete the figure, not score every body as a pass (393).
 */
function parseErrors(text) {
  const sf = ts.createSourceFile('fixture.ts', text, ts.ScriptTarget.Latest, false, ts.ScriptKind.TS);
  return Array.isArray(sf.parseDiagnostics) ? sf.parseDiagnostics.length : null;
}

/** `PARSES` | `UNMODELLED`, or `null` if the parser refused. Signal 2 on one literal. */
function parseVerdict(rawBody, quote) {
  const n = parseErrors(withPlaceholders(unescapeDelimiter(rawBody, quote)));
  if (n === null) return null;
  return n === 0 ? 'PARSES' : 'UNMODELLED';
}

/** The shape §4 priced, driven so P5 is a measurement. `true` iff it compiles. Never executed. */
function newFunctionAccepts(text) {
  try { new Function(text); return true; } catch { return false; }
}

// ─── known positives, one per axis, each differing from PLAIN on exactly ONE axis (382/386) ────
// Copied from real neighbourhoods in this tree, not minted (341). FRAGMENT is a real fixture
// truncated at a real call boundary, which is what a syntactic fragment IS; labelled as such.
const KP_PLAIN    = { body: "const files = git(['ls-tree', '-r', rev]).split('\\n');", quote: "'" };
const KP_MODULE   = { body: "import { readFileSync } from 'node:fs';", quote: "'" };
const KP_TSANNOT  = { body: 'const rows: Array<string> = xs.map((x) => String(x));', quote: "'" };
const KP_INTERP   = { body: 'const HERE = ${JSON.stringify(POP)};', quote: '`' };
// KP_ESCAPED is the body AS SLICED out of a `'`-quoted outer literal whose fixture contains a
// `'`-quoted inner string: source `'const s = \'x\'; return s;'` slices to `const s = \'x\';…`.
// Drive 1 had this KP wrong — I wrote a nested APOSTROPHE (`it\'s`) inside a nested single-quoted
// string, which is unparseable as real code too, so the KP failed for a reason that was not the
// axis. The axis is the escape introduced by the SLICE; the KP has to carry that and nothing else
// (355: a known positive must carry the property, not an analogy).
const KP_ESCAPED  = { body: "const s = \\'x\\'; return s;", quote: "'" };
const KP_FRAGMENT = { body: "const files = git(['ls-tree', '-r', rev", quote: "'" };

// ════════════════════════════════════════════════════════════════════════════════════════════════
// drive
// ════════════════════════════════════════════════════════════════════════════════════════════════

const REV = git(['rev-parse', 'HEAD']).trim();
const DIRTY = git(['status', '--porcelain']).trim();

function corpusAtRev(rev) {
  const list = git(['ls-tree', '-r', '--name-only', rev, '--', 'docs/research', 'scripts'])
    .split('\n').filter((f) => EXEC.test(f));
  return list.map((p) => [p, git(['show', `${rev}:${p}`])]);
}
function corpusLiveHybrid() {
  const list = git(['ls-files', 'docs/research', 'scripts']).split('\n').filter((f) => EXEC.test(f));
  return list.map((p) => [p, readFileSync(join(REPO, p), 'utf8')]);
}

const partition = (reads) => {
  const sets = {};
  for (const r of reads) {
    const s = setOf(r);
    if (s === null) continue;
    (sets[s] ||= []).push(r.path);
  }
  return sets;
};

// ─── R1/R2: his key at HIS rev, against his published figures ──────────────────────────────────
// Drive 1 → drive 2, and the correction is to MY leg, not to his key: drive 1 compared the
// SELF-INCLUDED reading against his table and read 115 of 275 with SET1-masked-safe at 27 — his
// memo §2 publishes 114 of 274 and 26. All three off by exactly +1, which is a member and not a
// drift, so the delta is graded BY MEMBER LIST rather than by subtracting one (340). His
// instrument builds the table from `WITHOUT_SELF` (`census-the-fixture-as-string-class.mjs:469`,
// read at his rev); his §6 then reports his own row as `SET1-masked-safe` separately. Both
// sentences are true of different populations and neither says which — see README §4.
const HIS_SELF = 'docs/research/round407-instruments/census-the-fixture-as-string-class.mjs';
const hisCorpus = corpusAtRev(HIS_REV);
const hisReadsAll = hisCorpus.map(([p, src]) => readFile1(p, src));
/** His published population: his key's own self-exclusion applied, as his table does it. */
const hisReads = hisReadsAll.filter((r) => r.path !== HIS_SELF);
const hisSets = partition(hisReads);
const hisScanners = hisReads.filter((r) => r.scanner).length;
const hisCount = (k) => (hisSets[k] ? hisSets[k].length : 0);
const SET_ORDER = ['SET2a-live', 'SET2b-live', 'SET2a-cured', 'SET2b-cured',
                   'SET1-masked-safe', 'SET0-no-fixtures'];

const r1Mismatch = [
  hisScanners === HIS_FIGURES.scanners ? null : `scanners ${hisScanners} vs ${HIS_FIGURES.scanners}`,
  hisCorpus.length - 1 === HIS_FIGURES.executables ? null
    : `executables ${hisCorpus.length - 1} vs ${HIS_FIGURES.executables}`,
  ...SET_ORDER.map((k) => (hisCount(k) === HIS_FIGURES[k] ? null
    : `${k} ${hisCount(k)} vs ${HIS_FIGURES[k]}`)),
].filter(Boolean);

// The +1 attributed by member list: the included reading must exceed the excluded one by exactly
// his own file, and in exactly SET1-masked-safe. A count that merely differs by one proves nothing.
const allSets = partition(hisReadsAll);
const deltaMembers = Object.entries(allSets).flatMap(([s, ps]) =>
  ps.filter((p) => !(hisSets[s] ?? []).includes(p)).map((p) => `${p} → ${s}`));
const deltaIsHisSelfInSet1 = deltaMembers.length === 1
  && deltaMembers[0] === `${HIS_SELF} → SET1-masked-safe`;

g('R1', 'his key transcribed verbatim reproduces his six published set counts and his 114 of 274 '
      + 'at HIS rev under HIS self-exclusion, and the self-included reading differs from it by '
      + 'exactly one MEMBER — his own file, in SET1-masked-safe',
  r1Mismatch.length === 0 && deltaIsHisSelfInSet1,
  `rev ${HIS_REV} · without-self ${hisScanners} scanner(s) of ${hisCorpus.length - 1} executable(s) · `
  + SET_ORDER.map((k) => `${k}=${hisCount(k)}`).join(' ')
  + (r1Mismatch.length ? ` · MISMATCH vs his §2: ${r1Mismatch.join('; ')}` : ' · all six match his §2')
  + ` · with-self delta by member list: [${deltaMembers.join(' | ') || 'EMPTY'}]`);

const setByPath = new Map();
for (const [s, ps] of Object.entries(allSets)) for (const p of ps) setByPath.set(p, s);
const e3Rows = HIS_E3.map(([p, want]) => [p, want, setByPath.get(p) ?? 'ABSENT']);
g('R2', 'his leg-E3 member list reproduces under my copy of his key, as a member list',
  e3Rows.every(([, want, got]) => want === got),
  e3Rows.map(([p, want, got]) => `${p.split('/')[2] ?? p}: ${got}${want === got ? ' ✓' : ` ✗ want ${want}`}`)
    .join(' · '));

// ─── P1: the interpolation axis, both directions ───────────────────────────────────────────────
const interpPlaceholder = parseErrors(withPlaceholders(KP_INTERP.body));
const interpDeleted = parseErrors(withoutInterpolations(KP_INTERP.body));
const plainPlaceholder = parseErrors(withPlaceholders(KP_PLAIN.body));
const plainDeleted = parseErrors(withoutInterpolations(KP_PLAIN.body));
g('P1', 'his §3 widening case parses under the placeholder model and NOT under his deletion '
      + 'model, while a plain fixture parses under both — the move is attributable to the axis',
  interpPlaceholder === 0 && typeof interpDeleted === 'number' && interpDeleted > 0
  && plainPlaceholder === 0 && plainDeleted === 0,
  `interpolated fixture: placeholder=${interpPlaceholder} err, deletion=${interpDeleted} err · `
  + `plain fixture: placeholder=${plainPlaceholder} err, deletion=${plainDeleted} err`);

// ─── P2: the prose body, with the control that it carries the property under HIS key ───────────
// Read out of the tree at the rev rather than retyped, and located by its own line rather than by
// a line number: a number in prose is the thing that goes stale (394 — strip whitespace, and never
// key on a count where the content is available).
const sweepSrc = git(['show', `${HIS_REV}:scripts/sweep-probes.mjs`]);
const sweepLits = literalBodies(sweepSrc);
const proseLit = sweepLits
  .filter((l) => isFixture(l.body))
  .filter((l) => l.body.includes('E2 keeps the import specifier'))
  .sort((a, b) => b.body.length - a.body.length)[0] ?? null;
const proseIsFixtureHisKey = proseLit === null ? null : isFixture(proseLit.body);
const proseParse = proseLit === null ? null : parseVerdict(proseLit.body, proseLit.quote);
const plainIsFixture = isFixture(KP_PLAIN.body);
const plainParse = parseVerdict(KP_PLAIN.body, KP_PLAIN.quote);
g('P2', 'the prose body is a fixture under HIS key AND UNMODELLED under the parse, while a plain '
      + 'fixture is a fixture under his key AND parses — so this is a discrimination, not an '
      + 'always-UNMODELLED parse',
  proseLit !== null && proseIsFixtureHisKey === true && proseParse === 'UNMODELLED'
  && plainIsFixture === true && plainParse === 'PARSES',
  proseLit === null
    ? 'prose body NOT FOUND in sweep-probes.mjs at the rev — the KP is gone, the leg is deleted'
    : `prose (${proseLit.body.length} chars, at offset ${proseLit.at}): his key=${proseIsFixtureHisKey} `
      + `parse=${proseParse} · plain fixture: his key=${plainIsFixture} parse=${plainParse}`);

// ─── P3: the fragment stratum is reachable ─────────────────────────────────────────────────────
g('P3', 'a syntactic fragment lands UNMODELLED — the stratum exists and is reachable, and a '
      + 'fragment is NOT the same verdict as a refutation',
  parseVerdict(KP_FRAGMENT.body, KP_FRAGMENT.quote) === 'UNMODELLED'
  && parseVerdict(KP_PLAIN.body, KP_PLAIN.quote) === 'PARSES',
  `fragment (a real fixture truncated at a call boundary): ${parseVerdict(KP_FRAGMENT.body, KP_FRAGMENT.quote)}`
  + ` · the untruncated form: ${parseVerdict(KP_PLAIN.body, KP_PLAIN.quote)}`);

// ─── P4: the delimiter-escape axis, both directions ────────────────────────────────────────────
const escUn = parseErrors(withPlaceholders(unescapeDelimiter(KP_ESCAPED.body, KP_ESCAPED.quote)));
const escRaw = parseErrors(withPlaceholders(KP_ESCAPED.body));
g('P4', 'a fixture carrying the escaped form of its own delimiter parses after unescaping and '
      + 'does not before — both directions',
  escUn === 0 && typeof escRaw === 'number' && escRaw > 0,
  `escaped-delimiter fixture: unescaped=${escUn} err, as-sliced=${escRaw} err`);

// ─── P5: the shape §4 priced, driven ───────────────────────────────────────────────────────────
const nfModule = newFunctionAccepts(KP_MODULE.body);
const nfTs = newFunctionAccepts(KP_TSANNOT.body);
const tsModule = parseVerdict(KP_MODULE.body, KP_MODULE.quote);
const tsTs = parseVerdict(KP_TSANNOT.body, KP_TSANNOT.quote);
const nfPlain = newFunctionAccepts(KP_PLAIN.body);
g('P5', '`new Function(body)` fails CLOSED on module syntax and on a TS annotation while the TS '
      + 'parse admits both, and it is not simply broken — it accepts a plain fixture',
  nfModule === false && nfTs === false && nfPlain === true
  && tsModule === 'PARSES' && tsTs === 'PARSES',
  `new Function: module=${nfModule} tsAnnot=${nfTs} plain=${nfPlain} · `
  + `ts parse: module=${tsModule} tsAnnot=${tsTs}`);

// ─── T1: one rev vs the live hybrid, by member list ────────────────────────────────────────────
const atRev = corpusAtRev(REV);
const hybrid = corpusLiveHybrid();
const names = (xs) => xs.map(([p]) => p);
const revSrc = new Map(atRev);
const hybSrc = new Map(hybrid);
const onlyHybrid = names(hybrid).filter((p) => !revSrc.has(p));
const onlyRev = names(atRev).filter((p) => !hybSrc.has(p));
const contentDiffs = names(hybrid).filter((p) => revSrc.has(p) && revSrc.get(p) !== hybSrc.get(p));
g('T1', 'list and contents come from one rev, compared with the live hybrid by member list, rev '
      + 'printed either way',
  typeof REV === 'string' && REV.length === 40
  && onlyHybrid.length === 0 && onlyRev.length === 0 && contentDiffs.length === 0,
  `rev ${REV} · worktree ${DIRTY === '' ? 'CLEAN' : `DIRTY (${DIRTY.split('\n').length} path(s))`} · `
  + `${atRev.length} at rev, ${hybrid.length} live · list delta +${onlyHybrid.length}/-${onlyRev.length}`
  + ` · ${contentDiffs.length} differ in CONTENT`
  + (contentDiffs.length ? ` [${contentDiffs.slice(0, 4).join(', ')}]` : ''));

// ─── S2: the self-exclusion seam, refusing before promotion ────────────────────────────────────
const SELF_TRACKED = git(['ls-files', '--', SELF]).trim() !== '';
const selfAtRev = revSrc.has(SELF);
g('S2', 'the seam is gradeable only once this file is in its own population — it REFUSES while '
      + 'untracked rather than passing vacuously',
  SELF_TRACKED === true && selfAtRev === true,
  SELF_TRACKED && selfAtRev
    ? `SEAM GRADEABLE — ${SELF} is tracked and present at ${REV.slice(0, 8)}; it is a member of the `
      + 'population it measures, which is where the author of this instrument belongs'
    : `SEAM NOT YET GRADEABLE — ${SELF} tracked=${SELF_TRACKED}, present at rev=${selfAtRev}. `
      + '`ls-tree` cannot see an untracked file, so it is not in its own population and the '
      + 'control is vacuously equal in both directions. Commit, then re-drive.');

// ─── the stratification, at ONE rev ────────────────────────────────────────────────────────────
// Signal 2 applied to the live rows of signal 1. Every body his key matched is re-read; a row's
// own verdict is the STRONGEST verdict among its bodies, because one parsing fixture is enough to
// confirm the file is in the class.
const liveSets = ['SET2a-live', 'SET2b-live'];
const liveRows = hisReads.filter((r) => liveSets.includes(setOf(r) ?? ''));
let parserRefused = 0;
const strata = liveRows.map((r) => {
  const verdicts = r.fixtureBodies.map((l) => {
    const v = parseVerdict(l.body, l.quote);
    if (v === null) parserRefused++;
    return { v, len: l.body.length, at: l.at, head: l.body.slice(0, 64).replace(/\s+/g, ' ') };
  });
  const parses = verdicts.filter((x) => x.v === 'PARSES');
  const unmod = verdicts.filter((x) => x.v === 'UNMODELLED');
  const stratum = parses.length > 0 ? 'CONFIRMED'
    : unmod.length > 0 ? 'UNMODELLED' : 'REFUTED';
  return { path: r.path, set: setOf(r), his: r.fixtures,
           parses: parses.length, unmod: unmod.length, stratum,
           sample: (parses[0] ?? unmod[0] ?? null) };
});
const confirmed = strata.filter((s) => s.stratum === 'CONFIRMED');
const unmodelled = strata.filter((s) => s.stratum === 'UNMODELLED');
const refuted = strata.filter((s) => s.stratum === 'REFUTED');

g('M1', 'the three strata partition his live rows exactly — the total is added up, not asserted',
  parserRefused === 0
  && confirmed.length + unmodelled.length + refuted.length === liveRows.length
  && liveRows.length === HIS_FIGURES['SET2a-live'] + HIS_FIGURES['SET2b-live'],
  `${confirmed.length} CONFIRMED + ${unmodelled.length} UNMODELLED + ${refuted.length} REFUTED = `
  + `${confirmed.length + unmodelled.length + refuted.length} of ${liveRows.length} live row(s) `
  + `(his 25 + 3 = ${HIS_FIGURES['SET2a-live'] + HIS_FIGURES['SET2b-live']}) · `
  + `parser refusals: ${parserRefused}`);

// M2: monotonicity. Signal 2 filters a list, so no row may gain a fixture and no file may enter.
const gained = strata.filter((s) => s.parses + s.unmod > s.his);
g('M2', 'the second signal is monotone by construction — no row gains a fixture under it',
  gained.length === 0,
  gained.length === 0
    ? `all ${strata.length} row(s): parses+unmodelled <= his fixture count`
    : `MONOTONICITY VIOLATED, which is a defect in MY code: ${gained.map((s) => s.path).join(', ')}`);

// ─── gate, before any figure prints (356) ──────────────────────────────────────────────────────
console.log('EXPECTED, on paper before this drove:');
for (const [k, t] of EXPECTED) console.log(`  ${k}  ${t}`);
console.log('');
for (const gr of GRADES) {
  console.log(`${gr.ok ? 'TRUE ' : 'FALSE'}  ${gr.leg}  ${gr.claim}`);
  console.log(`       ${gr.detail}`);
}
const bad = GRADES.filter((gr) => gr.ok !== true);
console.log('');
console.log(`GRADE: ${bad.length === 0}  (${GRADES.length - bad.length} of ${GRADES.length} legs true)`);
if (bad.length > 0) {
  console.log(`GRADES NOT TRUE: ${bad.map((gr) => gr.leg).join(' | ')}`);
  console.log('REFUSING to print the stratification: a figure under a red grade is not a reading.');
  process.exit(1);
}

// ════════════════════════════════════════════════════════════════════════════════════════════════
// the answer
// ════════════════════════════════════════════════════════════════════════════════════════════════

console.log('');
console.log(`── the live interval, stratified at ${HIS_REV} ─────────────────────────────────────`);
console.log(`his published interval: [3, 27]  (floor hand-confirmed, ceiling not claimed)`);
console.log(`measured here:          [${confirmed.length}, ${confirmed.length + unmodelled.length}]`);
console.log('');
console.log(`  CONFIRMED   ${String(confirmed.length).padStart(3)}  at least one fixture body PARSES`);
console.log(`  UNMODELLED  ${String(unmodelled.length).padStart(3)}  has bodies, none parse — undecided, not refuted`);
console.log(`  REFUTED     ${String(refuted.length).padStart(3)}  no body survives the second signal; leaves the class`);
console.log('');
for (const s of [...confirmed, ...unmodelled, ...refuted].sort((a, b) =>
  a.stratum.localeCompare(b.stratum) || a.path.localeCompare(b.path))) {
  console.log(`  ${s.stratum.padEnd(11)} ${s.set.padEnd(11)} his=${String(s.his).padStart(3)} `
    + `parses=${String(s.parses).padStart(3)} unmod=${String(s.unmod).padStart(3)}  ${s.path}`);
  if (s.sample) console.log(`              ${s.sample.v} @${s.sample.at} (${s.sample.len}c): ${s.sample.head}`);
}

writeFileSync(new URL('./stratification.json', import.meta.url), JSON.stringify({
  rev: REV, hisRev: HIS_REV, worktree: DIRTY === '' ? 'CLEAN' : 'DIRTY',
  hisFigures: HIS_FIGURES, reproduced: r1Mismatch.length === 0,
  interval: { his: [3, 27], measured: [confirmed.length, confirmed.length + unmodelled.length] },
  strata: strata.sort((a, b) => a.path.localeCompare(b.path)),
  grades: GRADES.map(({ leg, ok, detail }) => ({ leg, ok, detail })),
}, null, 2) + '\n');
console.log('');
console.log('stratification.json written beside this file.');
