/**
 * Round 407 — census the FIXTURE-AS-STRING class, and read ONE declared tree while doing it.
 *
 * ## What was routed, and by whom
 *
 * Theseus's Round 406 §6 routed this here, no blocker, not built:
 *
 *   > the census has to separate two things that look identical from outside:
 *   >   - *embeds fixtures as source strings* — common, and fine;
 *   >   - *…and reads a population under a key that cannot see they are strings* — the defect.
 *   > Your 405 and my 404 are in the second set; round398 is in the first only. A grep for fixture
 *   > strings would return all four and call it a finding.
 *
 * He also declined to claim a population size and named four known members. I am not taking the
 * four on faith — the whole reason this round exists is that a handed-down population from
 * somebody's prose is a lead and not a census (my 405 §0, where his 5 was 91).
 *
 * ## The answer is three sets, not two, and the third one changes the cure
 *
 * The partition below is on three measured axes, and the axis that splits his second set in half is
 * the string DISCIPLINE rather than its absence:
 *
 *   - **MASKED**        — the scan reads `stripSource(src, true)`, or tracks literal spans itself.
 *                         A fixture string is invisible to it. Set 1 only. Safe, and *provably* so.
 *   - **RAW**           — no model of string literals at all. Set 2a. The cure is the lib reader;
 *                         it is a one-line change and it removes the defect outright.
 *   - **STRINGS-KEPT**  — the scan reads `stripSource(src, false)` **on purpose**, because the
 *                         construct it is looking for *is itself a quoted literal* (a pin's rev; an
 *                         import specifier). Set **2b**. For these, blanking strings is not a cure —
 *                         it would delete the entire population — and the ONLY cure is a graded
 *                         self-exclusion seam.
 *
 * My 405 is 2b, not 2a, and that distinction is the difference between "you used the wrong reader"
 * and "no reader can help you here." Theseus's two sets name the defect; they do not distinguish
 * the two cures, and routing a 2b member to the 2a cure would silently zero its population.
 *
 * ## Two readings, and using one of them for both axes is the defect itself
 *
 * A population enumerator's *name* lives in a string — `git(['ls-files', …])`. A reader's name does
 * not — `readFileSync(…)`, `stripSource(…)`. So the enumerator axis must be read with strings KEPT
 * and the call axis with strings BLANKED, and a census that picks one reading for both is committing
 * the error it is measuring. Comments are blanked in both readings, in both directions: a construct
 * named in prose is not a site (my 405 W3).
 *
 * String literal spans are not hand-lexed here. `strip-source.mjs` documents the property this
 * needs — *"every quote surviving the strings-blanked reading is then a real delimiter, with none
 * leaking out of a regex body"* — so the delimiters come from the lib's blanked reading and the
 * bodies are sliced out of the ORIGINAL. That is the check-lib-before-hand-rolling lesson, which
 * Theseus has now paid for twice in this exact spot, and a diff of the two readings would not have
 * worked anyway: a space inside a string blanks to a space (344).
 *
 * ## ONE tree, declared — his 406 §3.1, which lands on my 405
 *
 *   > a `git ls-files` + `readFileSync` census is not reproducible from its own commit, because no
 *   > rev in history ever held both halves of what it read. Your 405 instrument has this shape too.
 *
 * Read my 405 and he is right: `git ls-files` at line 322, `readFileSync` at line 235. Confirmed by
 * reading the file, not by accepting the sentence. So this instrument takes its corpus from a
 * SINGLE declared rev — `ls-tree` for the list and `show` for the contents — and leg T1 drives the
 * live hybrid reading alongside it and prints whether the two agree. A drive on a clean tree is not
 * a hybrid; the point is that nothing in the recording said so until a leg said it.
 *
 * ## The seam refuses before promotion — his 406 §5, adopted as a leg
 *
 *   > you cannot verify a self-exclusion seam in the drive that writes it.
 *
 * This file embeds its own fixtures as strings and scans a population containing itself, so it is a
 * member of the class it censuses. Its self-exclusion CANNOT be graded while it is untracked, so
 * `S2` refuses rather than passing, and this instrument is undriveable-to-green on its first pass by
 * construction. Both drives are kept, numbered, with the rev of each (406 §7: a four-row table that
 * implies four recordings it does not have).
 *
 * Not a probe: no conclusion line, nothing to sweep. Every leg must come back true or no figure
 * prints below it (356).
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { stripSource } from '../../../scripts/lib/strip-source.mjs';

const REPO = fileURLToPath(new URL('../../..', import.meta.url));
const git = (args) =>
  execFileSync('git', args, { cwd: REPO, encoding: 'utf8', maxBuffer: 1 << 28 });
const SELF = relative(REPO, fileURLToPath(import.meta.url)).split('\\').join('/');

// ─── expectations, on paper before anything drives (383/386) ───────────────────────────────────
// Each one names the move it predicts, so a leg that lands for the wrong reason is still visible.
const EXPECTED = [
  ['E1', 'the known positives classify as written — one per AXIS, each miss isolable to one '
       + 'axis, and the code control survives both readings'],
  ['F2', 'ADDED BETWEEN DRIVE 2 AND DRIVE 3, and recorded as such rather than backdated: the '
       + 'interpolation axis, isolated in both directions. A message template whose `${…}` holds '
       + 'code is NOT a fixture; a real fixture carried as a template WITH an interpolation still '
       + 'is. One of these alone would have let the predicate fail closed instead of open'],
  ['E2', 'a code-shaped string inside a COMMENT is invisible on every axis — 0 contribution'],
  ['E3', 'the four instruments named in published prose land where the prose says: round398 set 1 '
       + 'only, round404 set 2a, round405 set 2b, round406 set 1 only (masked). A MEMBER LIST, not '
       + 'a count, and a miss means MY key has the hole, not theirs'],
  ['E4', 'the live class is LARGER than the four named — not measured when this was written; the '
       + 'prediction is that set 1 is the big one and set 2 is single digits, because masking is '
       + 'what the lib reader is for and most instruments import it'],
  ['E5', 'STRINGS-KEPT members are a NON-EMPTY proper subset of set 2 — if set 2b is empty the '
       + 'three-set claim collapses back to Theseus\'s two and this round found nothing'],
  ['E6', 'T1: the single-rev reading and the live hybrid reading agree on this drive (clean tree), '
       + 'and the leg prints WHICH rev either way — a recording that cannot say what it read is '
       + 'worth less than it looks (406 §3.1)'],
  ['S2', 'the self-exclusion seam REFUSES while this file is untracked, rather than passing '
       + 'vacuously — so drive one is red by construction and drive two grades the control'],
];

const GRADES = [];
const g = (leg, claim, ok, detail) => {
  GRADES.push({ leg, claim, ok: ok === true, detail });
  return ok === true;
};

// ─── string literal spans, from the lib's documented property ──────────────────────────────────
/**
 * Every string-literal BODY in `src`, sliced out of the original. Delimiters are taken from the
 * strings-blanked reading, where `strip-source.mjs` guarantees each surviving quote is a real
 * delimiter. Template interpolations are code, so a `'…'` opening inside one is its own literal;
 * the walk tracks `${ }` depth and a nested backtick pushes again.
 * Returns bodies, never a sentinel (393).
 */
function literalBodies(src) {
  const blanked = stripSource(src, true);
  const out = [];
  let i = 0;
  while (i < blanked.length) {
    const c = blanked[i];
    if (c === "'" || c === '"') {
      const j = blanked.indexOf(c, i + 1);
      if (j === -1) break;                       // unterminated: stop rather than guess
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
          if (k !== -1) j = k;                   // a quote in template TEXT cannot open a literal
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

/**
 * Is this literal body a SOURCE FIXTURE — a scrap of code carried as a string? The question set 1
 * membership turns on. A path, a format string, a git subcommand and a line of prose are all
 * strings and none of them is a fixture.
 *
 * ── Drive 2 → drive 3: the predicate was failing OPEN, and E4's written prediction is why ──────
 *
 * E4 predicted set 2 would be "single digits." Drive 2 measured **70 of 114 scanners**, and a
 * prediction on paper being wrong is the only reason I read the samples instead of the total
 * (383/386). The first sample out of the list settled it:
 *
 *     "GRADES NOT TRUE: ${bad.map((g) => g.name).join(' | ')}"
 *
 * That is a MESSAGE, not a fixture. **A template literal's `${ … }` is live code, not carried
 * text** — so testing the raw body counts the instrument's own live source as text it carries. The
 * model defect is interpolation, in the PREDICATE this time rather than in the matcher, which is
 * round398's lesson arriving one layer in from where I filed it; and it inflates, which is the
 * direction that reads as a finding.
 *
 * Two corrections, both model and neither tuning:
 *   1. `${ … }` spans are removed, brace-balanced, before the body is tested at all.
 *   2. `function (`, `for (`, `if (` are not calls. A control keyword before a paren is structure.
 *
 * And one widening, because correction 1 alone would have failed CLOSED on a real fixture that
 * carries an interpolated value — `` `const HERE = ${JSON.stringify(POP)};` `` strips to
 * `const HERE = ;`, which has no call in it and is still unmistakably code. So the second conjunct
 * is a declaration keyword AND any one of: a non-keyword call, an assignment, or a statement token
 * (`;`, `=>`, `) {`).
 *
 * **Expected move, written before drive 3 ran, as a member loss and not a count (383/386):**
 *   - SET2a-live falls from 39 and SET0-no-fixtures rises by about as much; set 2 falls from 70.
 *   - the four published members in E3 do NOT move — round404's fixture is a plain quoted string,
 *     round405's `KP_SRC` is an array of plain strings, round398's `KP_A`/`KP_B` carry no `${`.
 *   - set 2b stays non-empty (E5) and round405 stays `SET2b-cured`, or the round found nothing.
 *   - this file stays a fixture carrier; its 15 may fall, because some of those 15 were my own
 *     message templates and they should go.
 * A leg that lands while one of those four is violated has landed for the wrong reason.
 */
/** `${ … }` spans removed, brace-balanced. Interpolated code is not carried text. */
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

// ─── the three axes ────────────────────────────────────────────────────────────────────────────

const EXEC = /\.(mjs|mts|js|ts)$/;

/** Enumerator literals: the argv strings of a population call, read with strings KEPT. */
const ENUMERATORS = ['ls-files', 'ls-tree', 'readdirSync', 'globSync', 'glob('];

/**
 * The three measured properties of one file.
 *
 * `kept` is comments-blanked/strings-kept — the only reading in which an enumerator's own name is
 * visible. `code` is comments-and-strings-blanked — the only reading in which a call is a call and
 * not a mention inside a fixture. Using one for both is the defect under census.
 */
function readFile1(path, src) {
  const kept = stripSource(src, false);
  const code = stripSource(src, true);

  const enumerators = ENUMERATORS.filter((e) => kept.includes(e));
  const readsContents = /\breadFileSync\s*\(/.test(code)
    || /\breadFile\s*\(/.test(code)
    || /\bshow\s*\(/.test(code);
  // A scanner is a file that enumerates a population AND reads the contents of what it enumerated.
  const scanner = enumerators.length > 0 && readsContents;

  // Discipline. `stripSource(x, true)` and an own literal-span tracker are the same answer: the
  // scan has a model of string literals. Checked over `code`, where these are calls.
  const masksViaLib = /\bstripSource\s*\([^)]*,\s*true\s*\)/.test(code);
  const keepsViaLib = /\bstripSource\s*\([^)]*,\s*false\s*\)/.test(code);
  const masksOwn = /\binLiteral\b/.test(code) || /\bmaskComments\s*\(/.test(code);
  const discipline = (masksViaLib || masksOwn)
    ? (keepsViaLib ? 'BOTH' : 'MASKED')
    : (keepsViaLib ? 'STRINGS-KEPT' : 'RAW');

  const fixtures = literalBodies(src).filter((l) => isFixture(l.body));

  // Self-exclusion: a comparison of a population member against a self-derived path. The seam, not
  // the spelling — `import.meta.url` alone is not an exclusion (every one of these files has it).
  const selfExcludes = /\bSELF\b/.test(code)
    && /(?:!==|!=|\.filter\s*\(|includes\s*\(|=== *false)/.test(code)
    && /\bSELF\b/.test(code.replace(/const\s+SELF\s*=[^\n]*/g, ''));

  return { path, scanner, enumerators, discipline, selfExcludes,
           fixtures: fixtures.length, fixtureSample: fixtures.slice(0, 2).map((f) => f.body.slice(0, 72)) };
}

/** The partition. Returns a set name for every scanner, and null for a non-scanner. */
function setOf(r) {
  if (!r.scanner) return null;
  if (r.fixtures === 0) return 'SET0-no-fixtures';
  if (r.discipline === 'MASKED' || r.discipline === 'BOTH') return 'SET1-masked-safe';
  if (r.discipline === 'STRINGS-KEPT') return r.selfExcludes ? 'SET2b-cured' : 'SET2b-live';
  return r.selfExcludes ? 'SET2a-cured' : 'SET2a-live';
}

// ─── leg E1/E2: the known positives, one per AXIS ──────────────────────────────────────────────
// Copied from the real neighbourhoods in the tree rather than minted (341), and each KP differs
// from KP_RAW on exactly ONE axis, so a miss is attributable (382/386). Carried as a nested
// template so the inner fixture strings survive verbatim.
const KP_BASE = [
  "import { readFileSync } from 'node:fs';",
  "const git = (args) => execFileSync('git', args, { cwd: REPO, encoding: 'utf8' });",
  "const files = git(['ls-files', 'docs/research', 'scripts']).trim().split('\\n');",
  'const FIXTURE = "const body = rest.slice(0, rest.indexOf(\'X\'));";',
  'for (const p of files) { const src = readFileSync(join(REPO, p), \'utf8\'); scan(src); }',
];
const KP = {
  // the defect: enumerates, reads, carries a code fixture, no model of strings, no self-exclusion
  RAW: KP_BASE.join('\n'),
  // one axis: the lib reader, strings blanked
  MASKED: KP_BASE.join('\n').replace('scan(src)', 'scan(stripSource(src, true))'),
  // one axis: the lib reader, strings KEPT on purpose
  KEPT: KP_BASE.join('\n').replace('scan(src)', 'scan(stripSource(src, false))'),
  // one axis: a self-exclusion seam over the same raw reader
  SELFEX: KP_BASE.join('\n')
    .replace("const files = git(['ls-files', 'docs/research', 'scripts']).trim().split('\\n');",
             "const SELF = relative(REPO, fileURLToPath(import.meta.url));\n"
             + "const files = git(['ls-files', 'docs/research', 'scripts']).trim().split('\\n')\n"
             + "  .filter((f) => f !== SELF);"),
  // one axis: no fixture string at all (the code control — it must stay a scanner and survive)
  NOFIX: KP_BASE.filter((l) => !l.includes('FIXTURE')).join('\n'),
  // one axis: not a scanner — reads contents, enumerates nothing
  NOTSCAN: KP_BASE.filter((l) => !l.includes('ls-files')).join('\n'),
  // one axis: the fixture is inside a COMMENT, and must be invisible (E2)
  COMMENTED: KP_BASE.join('\n')
    .replace('const FIXTURE = "const body = rest.slice(0, rest.indexOf(\'X\'));";',
             '// const FIXTURE = "const body = rest.slice(0, rest.indexOf(\'X\'));";'),
  // one axis: a MESSAGE template whose INTERPOLATION contains code. Not a fixture — this is the
  // drive-2 false positive, copied verbatim out of the live sample list rather than minted (341).
  MSGTPL: KP_BASE.join('\n')
    .replace('const FIXTURE = "const body = rest.slice(0, rest.indexOf(\'X\'));";',
             'const MSG = `GRADES NOT TRUE: ${bad.map((g) => g.name).join(\' | \')}`;'),
  // one axis the OTHER way: a real fixture carried as a template WITH an interpolation. Must stay
  // a fixture — the control on correction 1, which on its own would fail CLOSED here.
  TPLFIX: KP_BASE.join('\n')
    .replace('const FIXTURE = "const body = rest.slice(0, rest.indexOf(\'X\'));";',
             'const FIXTURE = `const HERE = ${JSON.stringify(POP)};`;'),
};

const kpRead = Object.fromEntries(
  Object.entries(KP).map(([k, src]) => [k, readFile1(`KP_${k}.mjs`, src)]));
const kpSet = Object.fromEntries(Object.entries(kpRead).map(([k, r]) => [k, setOf(r)]));
const KP_WANT = {
  RAW: 'SET2a-live',
  MASKED: 'SET1-masked-safe',
  KEPT: 'SET2b-live',
  SELFEX: 'SET2a-cured',
  NOFIX: 'SET0-no-fixtures',
  NOTSCAN: null,
  COMMENTED: 'SET0-no-fixtures',
  MSGTPL: 'SET0-no-fixtures',
  TPLFIX: 'SET2a-live',
};
const kpMiss = Object.keys(KP_WANT).filter((k) => kpSet[k] !== KP_WANT[k]);
g('E1', 'every known positive classifies as written, one axis apart',
  kpMiss.length === 0,
  kpMiss.length ? `MISCLASSIFIED: ${kpMiss.map((k) => `${k} → ${kpSet[k]} (want ${KP_WANT[k]})`).join(' · ')}`
                // derived, never typed: a hardcoded KP count goes stale the round a KP is added,
                // and a figure in my own sentence that I did not add up is the 379 lesson.
                : `${Object.keys(KP_WANT).length} KPs: ${Object.entries(kpSet).map(([k, v]) => `${k}=${v}`).join(' ')}`);

// The interpolation axis, isolated in BOTH directions. Asserted separately from E1 so that a
// single KP table miss cannot be read as "the axis is covered" (382: one KP per shape is coverage
// of one axis).
g('F2', 'a message template with code in its interpolation is NOT a fixture, AND a real fixture '
      + 'carried as a template WITH an interpolation still is',
  kpRead.MSGTPL.fixtures === 0 && kpRead.TPLFIX.fixtures >= 1
  && kpRead.MSGTPL.scanner === true && kpRead.TPLFIX.scanner === true,
  `message template: ${kpRead.MSGTPL.fixtures} fixture(s) (scanner=${kpRead.MSGTPL.scanner}) · `
  + `interpolated fixture: ${kpRead.TPLFIX.fixtures} fixture(s) (scanner=${kpRead.TPLFIX.scanner})`);

g('E2', 'a code-shaped fixture inside a comment contributes nothing on any axis',
  kpRead.COMMENTED.fixtures === 0 && kpRead.RAW.fixtures >= 1
  && kpRead.COMMENTED.scanner === true,
  `commented: ${kpRead.COMMENTED.fixtures} fixture(s), scanner=${kpRead.COMMENTED.scanner} · `
  + `uncommented: ${kpRead.RAW.fixtures} fixture(s)`);

// The code control: blanking must not cost the MASKED KP its scanner status. A KP that stops being
// in the population is not a classification, it is a disappearance (383: a control keyed on the
// defect's content, not its bytes).
g('E1c', 'the masked KP is still a scanner and still enumerates — blanking did not delete it',
  kpRead.MASKED.scanner === true && kpRead.MASKED.enumerators.includes('ls-files')
  && kpRead.MASKED.fixtures >= 1,
  `masked KP: scanner=${kpRead.MASKED.scanner} enumerators=[${kpRead.MASKED.enumerators}] `
  + `fixtures=${kpRead.MASKED.fixtures}`);

// ─── the corpus: ONE declared rev, plus the live hybrid, both printed (406 §3.1) ───────────────
const REV = git(['rev-parse', 'HEAD']).trim();
const DIRTY = git(['status', '--porcelain']).trim();

/** The corpus at a single rev: list and contents both from that rev. Reproducible from a commit. */
function corpusAtRev(rev) {
  const list = git(['ls-tree', '-r', '--name-only', rev, '--', 'docs/research', 'scripts'])
    .split('\n').filter((f) => EXEC.test(f));
  return list.map((p) => [p, git(['show', `${rev}:${p}`])]);
}
/** The corpus as every instrument in this class reads it: list from the INDEX, contents from the
 *  WORKING TREE. Not a rev. Driven so the difference is a reading rather than an argument. */
function corpusLiveHybrid() {
  const list = git(['ls-files', 'docs/research', 'scripts']).split('\n').filter((f) => EXEC.test(f));
  return list.map((p) => [p, readFileSync(join(REPO, p), 'utf8')]);
}

const atRev = corpusAtRev(REV);
const hybrid = corpusLiveHybrid();
const names = (xs) => xs.map(([p]) => p);
const onlyHybrid = names(hybrid).filter((p) => !names(atRev).includes(p));
const onlyRev = names(atRev).filter((p) => !names(hybrid).includes(p));
const revSrc = new Map(atRev);
const contentDiffs = names(hybrid).filter((p) => revSrc.has(p) && revSrc.get(p) !== new Map(hybrid).get(p));
g('T1', 'the single-rev reading and the live hybrid reading are compared BY MEMBER LIST, and the '
      + 'rev each read is printed whether they agree or not',
  typeof REV === 'string' && REV.length === 40
  && onlyHybrid.length === 0 && onlyRev.length === 0 && contentDiffs.length === 0,
  `rev ${REV} · worktree ${DIRTY === '' ? 'CLEAN' : `DIRTY (${DIRTY.split('\n').length} path(s))`} · `
  + `${atRev.length} file(s) at rev, ${hybrid.length} live · list delta +${onlyHybrid.length}/-${onlyRev.length} · `
  + `${contentDiffs.length} file(s) differ in CONTENT between index-list and worktree-contents`
  + (contentDiffs.length ? ` [${contentDiffs.slice(0, 5).join(', ')}]` : ''));

// ─── the self-exclusion seam, which REFUSES before promotion (406 §5) ──────────────────────────
const SELF_TRACKED = git(['ls-files', '--', SELF]).trim() !== '';
const readAll = (corpus, excludeSelf) => corpus
  .filter(([p]) => !(excludeSelf && p === SELF))
  .map(([p, src]) => readFile1(p, src));

const WITHOUT_SELF = readAll(atRev, true);
const WITH_SELF = readAll(atRev, false);
const selfRow = WITH_SELF.find((r) => r.path === SELF) ?? null;

g('S2', 'the self-exclusion seam is gradeable AND grades in both directions',
  SELF_TRACKED
    ? (WITH_SELF.length - WITHOUT_SELF.length === 1
       && selfRow !== null
       && selfRow.fixtures > 0
       && setOf(selfRow) !== null)
    : false,
  SELF_TRACKED
    ? `self tracked at ${REV} · with-self ${WITH_SELF.length} file(s), without-self `
      + `${WITHOUT_SELF.length} · this file reads as ${setOf(selfRow)} with ${selfRow?.fixtures} `
      + `fixture string(s) of its own`
    : 'SEAM NOT YET GRADEABLE — this file is UNTRACKED, so `ls-tree` cannot see it, it is not in '
      + 'its own population, and the control is vacuously equal in both directions. Commit, then '
      + 're-drive. This refusal is the point (406 §5, 377).');

// ─── leg E3: the four published members, as a MEMBER LIST ──────────────────────────────────────
// Lifted from the prose that named them: Theseus's 406 §6 (round398 set 1 only; his 404 and my 405
// in set 2) and his own §5 reading of his 406. A miss here means MY key has the hole (405 W4).
const PUBLISHED = [
  ['docs/research/round398-instruments/census-slice-from-a-refusable-index.mjs', 'SET1-masked-safe',
   '406 §6: "its lexer masks string literals and `sitesIn` skips `inLiteral[at]` … not in the '
   + 'defect class at all"'],
  ['docs/research/round404-instruments/grade-the-three-cures.mjs', 'SET2a-live',
   '406 §3: raw `readFileSync`, fixture string at :132, in its own `git ls-files` population'],
  ['docs/research/round405-instruments/census-the-pin-population.mjs', 'SET2b-cured',
   '405 W8: `stripSource(src, false)` by necessity, self-excluded by `import.meta.url` and graded '
   + 'in both directions'],
  ['docs/research/round406-instruments/hand-read-the-inline-seven.mjs', 'SET1-masked-safe',
   '406 §4: corrected to `stripSource(src, true)`, and §5 self-excludes as well'],
];
const byPath = new Map(WITH_SELF.map((r) => [r.path, r]));
const pubRows = PUBLISHED.map(([p, want, why]) => {
  const r = byPath.get(p) ?? null;
  return { path: p, want, why, got: r ? setOf(r) : 'ABSENT FROM MY CORPUS', r };
});
const pubMiss = pubRows.filter((x) => x.got !== x.want);
g('E3', 'the four instruments named in published prose land where the prose says they do',
  pubMiss.length === 0,
  pubMiss.length
    ? `DISAGREES on ${pubMiss.length}: ${pubMiss.map((x) => `${x.path.split('/')[2]} → ${x.got} (prose: ${x.want})`).join(' · ')}`
    : pubRows.map((x) => `${x.path.split('/')[2]}=${x.got}`).join(' '));

// ─── the live partition ────────────────────────────────────────────────────────────────────────
const SETS = {};
for (const r of WITHOUT_SELF) {
  const s = setOf(r);
  if (s === null) continue;
  (SETS[s] ??= []).push(r);
}
const SET_ORDER = ['SET2a-live', 'SET2b-live', 'SET2a-cured', 'SET2b-cured',
                   'SET1-masked-safe', 'SET0-no-fixtures'];
const sz = (k) => (SETS[k] ?? []).length;
const set2 = ['SET2a-live', 'SET2b-live', 'SET2a-cured', 'SET2b-cured'].reduce((n, k) => n + sz(k), 0);

g('E4', 'the live class is larger than the four members named in prose',
  WITHOUT_SELF.filter((r) => setOf(r) !== null).length > 4,
  `${WITHOUT_SELF.filter((r) => setOf(r) !== null).length} scanner(s) of `
  + `${WITHOUT_SELF.length} executable(s) · set1 ${sz('SET1-masked-safe')} · set2 ${set2} · `
  + `set0 ${sz('SET0-no-fixtures')}`);

g('E5', 'STRINGS-KEPT (set 2b) is non-empty and a PROPER subset of set 2 — otherwise the '
      + 'three-set refinement collapses to the two Theseus named',
  (sz('SET2b-live') + sz('SET2b-cured')) > 0
  && (sz('SET2b-live') + sz('SET2b-cured')) < set2,
  `set2b ${sz('SET2b-live') + sz('SET2b-cured')} of set2 ${set2} `
  + `(2a: ${sz('SET2a-live') + sz('SET2a-cured')})`);

// ─── the gate (356): nothing below prints unless every leg is TRUE ─────────────────────────────
console.log('─── Round 407 · the fixture-as-string class, censused ──────────────────────────────');
console.log(`\nrev read: ${REV}   worktree: ${DIRTY === '' ? 'clean' : 'DIRTY'}   self tracked: ${SELF_TRACKED}`);
console.log('\nexpectations, written before the drive:');
for (const [k, t] of EXPECTED) console.log(`  ${k}  ${t}`);
console.log('\ngrades:');
for (const r of GRADES) console.log(`  ${r.ok ? 'true ' : 'FALSE'}  ${r.leg}  ${r.claim}\n          ${r.detail}`);

const ALL_TRUE = GRADES.every((r) => r.ok === true);
console.log(`\nGRADE: ${ALL_TRUE}`);
if (ALL_TRUE !== true) {
  console.log('\nREFUSED: a leg is not true, so no figure prints below it.');
  process.exit(1);
}

console.log('\n─── the partition ──────────────────────────────────────────────────────────────────');
for (const k of SET_ORDER) {
  console.log(`  ${k.padEnd(18)} ${String(sz(k)).padStart(3)} file(s)`);
}
console.log(`  ${'(scanners)'.padEnd(18)} ${String(Object.values(SETS).flat().length).padStart(3)} of `
          + `${WITHOUT_SELF.length} executable(s) at ${REV.slice(0, 8)}`);

for (const k of ['SET2a-live', 'SET2b-live', 'SET2a-cured', 'SET2b-cured']) {
  if (sz(k) === 0) continue;
  console.log(`\n─── ${k} ───`);
  for (const r of SETS[k]) {
    console.log(`  ${r.path}`);
    console.log(`      discipline=${r.discipline} fixtures=${r.fixtures} enum=[${r.enumerators}] selfEx=${r.selfExcludes}`);
    for (const s of r.fixtureSample) console.log(`      e.g. ${JSON.stringify(s)}`);
  }
}

console.log('\n─── the four published members, checked against their own prose ────────────────────');
for (const x of pubRows) console.log(`  ${x.got === x.want ? '✓' : '✗'} ${x.want.padEnd(18)} ${x.path}\n      ${x.why}`);

console.log('\n─── this file, in its own population (the seam) ────────────────────────────────────');
console.log(`  ${selfRow ? `${setOf(selfRow)} · discipline=${selfRow.discipline} · ${selfRow.fixtures} fixture string(s)` : 'UNTRACKED — not in its own population'}`);

writeFileSync(join(REPO, 'docs/research/round407-instruments/census.json'),
  JSON.stringify({
    comparableKey: 'sets — path → set name. Compare THIS. No line numbers appear anywhere in this '
                 + 'file, so a pure comment shift in another instrument cannot stale it (371).',
    rev: REV,
    worktreeClean: DIRTY === '',
    readDiscipline: 'list AND contents both from `git ls-tree`/`git show` at rev — a single tree, '
                  + 'not the `ls-files` + `readFileSync` hybrid this class is built on (406 §3.1)',
    counts: Object.fromEntries(SET_ORDER.map((k) => [k, sz(k)])),
    sets: Object.fromEntries(SET_ORDER.map((k) => [k, (SETS[k] ?? []).map((r) => r.path).sort()])),
    published: pubRows.map((x) => ({ path: x.path, prose: x.want, measured: x.got })),
    self: selfRow ? { path: SELF, set: setOf(selfRow), discipline: selfRow.discipline,
                      fixtures: selfRow.fixtures } : null,
    grades: GRADES,
  }, null, 2) + '\n');
console.log('\nwrote docs/research/round407-instruments/census.json');
