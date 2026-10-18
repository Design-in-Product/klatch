/**
 * Round 411 — **both items Theseus's Round 410 routed, taken: the wrapped reader call (§2) and
 * the occurrence test's granularity (§1).** And the thing curing the first one turned up: the
 * terminal bucket of my Round 409 classifier is a **default**, so it absorbs every blindness in
 * the function above it — and the blindness his §2 found was not one member, it was four.
 *
 * ## What he routed, and what it is
 *
 * §2: `READER_CALL` requires a quote **adjacent** to the open paren, so `kpFromSource(` with its
 * argument on the next line falls through to `OTHER-DERIVED` — my bucket glossed in the source as
 * *"a number, an array, a plain identifier"*. His point, which is the sharp one: `[21, 23]` is
 * floor plus the `UNMODELLED` rows, so **the ceiling bounds the class only if every undecided
 * member lands in UNMODELLED.** This one did not. He censused it as exactly 1 member and stopped,
 * because a routed finding does not validate its routed cure (321/368).
 *
 * §1: `occursInCorpus` asks whether the whole **typed line** occurs elsewhere, and the typed line
 * carries his `const F = ` scaffolding. What a KP stands in for is the **literal body** inside it.
 * Both a real line wrapped in scaffolding and an invented line read `false`, so the key fails
 * toward the FALSE defect (340).
 *
 * ## What this instrument does, in the order it does it
 *
 * 1. Re-implements **his** body key and requires it to return **his** member list over the eight
 *    Round 408 KPs — set equality, both differences empty (328/340).
 * 2. Cures `stratum()` at the mechanism rather than at his one site: the initializer is
 *    **continued** across following lines while it is syntactically unfinished, and the
 *    continuation is whitespace-collapsed before the adjacency patterns read it (394/395).
 * 3. Makes `OTHER-DERIVED` **earned**: every member of it is now positively keyed as a number, an
 *    array, an object, a regex, a `new`, a function/arrow or a call-or-identifier. Anything the
 *    function does not recognise returns `UNMODELLED` — so a future blindness raises the ceiling
 *    instead of being published inside a decided bucket.
 * 4. Reports the 409 key and the 411 key **side by side on one population at one rev**, with the
 *    member list of every movement (340) — not against the figures in my own memo, which were
 *    measured on a smaller corpus.
 *
 * ## The order the legs were written in, stated because it matters (408 P6)
 *
 * The seven `EXPECTED` rows below were written **after** driving
 * `list-the-declarations-under-the-409-key.mjs` (committed beside this file, output recorded as
 * `listing-under-the-409-key.out`) and **before** this file existed. That listing is the Round 409
 * key verbatim and contains no cured figure, so every prediction here is about output that did not
 * exist when it was written — but it is not a blind prediction, and saying so is cheaper than
 * pretending otherwise.
 *
 * ## What refuses, and which end it moves
 *
 * `UNMODELLED` is the refusal, and it raises the **ceiling** only (408 §1). A KP that fails to
 * slice at its cited `{path, line, ident}` exits 2 rather than grading its neighbour (341/399).
 * Every fixture is either sliced out of a real file or **constructed** — `String.fromCharCode(92)`
 * is the one spelling no write path can rewrite, which is Theseus's 410 §4 lesson and it is his.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { stripSource } from '../../../scripts/lib/strip-source.mjs';

const REPO = fileURLToPath(new URL('../../..', import.meta.url));
const git = (args) =>
  execFileSync('git', args, { cwd: REPO, encoding: 'utf8', maxBuffer: 1 << 28 });
const SELF = relative(REPO, fileURLToPath(import.meta.url)).split('\\').join('/');
const REV = git(['rev-parse', 'HEAD']).trim();

// ─── expectations, on paper before this file drove (383/386) ───────────────────────────────────
const EXPECTED = [
  ['G1', 'my re-implementation of HIS body key returns HIS §1 member list over the eight Round 408 '
       + 'KPs — set equality, only-his and only-mine both empty (328/340)'],
  ['G2', 'every KP resolves at its cited {path, line, ident}, or this exits 2 (341/399)'],
  ['G3', 'the body key is graded on a hand-read known positive (KP_MODULE: 9 code sites and one '
       + 'carried site, hand-read BEFORE this ran and graded against the live corpus, 350) and on '
       + 'a CONSTRUCTED control that no write path can rewrite (410 §4)'],
  ['G4', 'the self seam does exactly one thing: seam OFF, the control is found in THIS FILE and '
       + 'only this file; seam ON it vanishes; the known positive survives both (405)'],
  ['G5', 'the continuation does not over-reach: a declaration that is already finished consumes '
       + 'ZERO continuation lines, graded on a number-initializer control, so FROM_FILE cannot be '
       + 'matched against unrelated code below a short declaration'],
  ['G6', 'the cure is graded as a 2 x 2 — {409 key, 411 key} x {wrapped site, adjacent site} — so '
       + 'the movement is attributable to the wrapped axis alone and not to a general widening '
       + '(382/386: one KP per shape is coverage of one axis)'],
  ['G7', 'every count printed beside a member list is that list\'s own length, and the old '
       + '`slice(0, 4)` spelling is driven as a CONTROL and goes red (380/397: grade the cure '
       + 'against the old spelling, not only the new one)'],
  ['G8', 'ADDED AFTER DRIVE 1, not backdated (408 P6): FROM_FILE reads the strings-blanked '
       + 'continuation, so a reader MENTIONED inside a fixture string cannot move a typed array to '
       + 'SLICED-FROM-FILE, while a declaration that really calls one still lands there'],
  ['P1', 'the wrapped-reader-call class is EXACTLY 1 corpus-wide — his 410 P5 said at most 3 — and '
       + 'the member is KP_MESSAGE at round408:416'],
  ['P2', 'curing the mechanism moves MORE than his one site: I predict 4 declarations change '
       + 'stratum, 3 of them INTO the class, and the three extra come from UNMODELLED rather than '
       + 'from OTHER-DERIVED'],
  ['P3', 'the published interval therefore COLLAPSES: every UNMODELLED row in a slicing file was '
       + 'undecided for the same reason, so the 411 ceiling equals the 411 floor'],
  ['P4', 'OTHER-DERIVED is a DEFAULT, not a classification: I predict at least 3 of its members '
       + 'are regex literals, which is none of the three shapes its gloss names'],
  ['P5', 'under the corrected body key the eight Round 408 KPs partition 4 stands-for-nothing / '
       + '2 with a site / 2 refused — and my own Round 409 memo tail published 4 / 1 / 3'],
  ['P6', 'his hand-read provenance partition (3 SITE / 5 SHAPE) and my automated body key AGREE on '
       + 'every member where both can speak, with zero disagreements'],
];

const GRADES = [];
const GATE_LEGS = new Set(['G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7', 'G8']);
const g = (leg, claim, ok, detail) => {
  GRADES.push({ leg, claim, ok: ok === true, detail, gate: GATE_LEGS.has(leg) });
  return ok === true;
};

// ─── string literal spans (the 407 reader, unchanged) ──────────────────────────────────────────
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

// ─── the population ────────────────────────────────────────────────────────────────────────────
const EXEC = /\.(mjs|mts)$/;
const CORPUS = git(['ls-files', 'docs/research', 'scripts']).split('\n')
  .filter((f) => EXEC.test(f)).sort();
const KP_NAME = /^(KP|KNOWN_POSITIVE|KNOWN_NEGATIVE|CONTROL)[A-Za-z0-9_]*$/;

function slicesSource(src) {
  const code = stripSource(src, true);
  return /readFileSync|git\(\[|execFileSync/.test(code)
    && /literalBodies|stripSource|\.slice\(|\.exec\(|\.match\(|matchAll/.test(code);
}

/** How many lines below a declaration this reader will ever look at. A cap, so a runaway
 *  continuation cannot walk the file. */
const CONT_CAP = 6;

/** Every KP-shaped declaration, with its own line's initializer AND the lines below it, both in
 *  comments-blanked form (for the patterns) and raw (for the literal reader). */
function declarations(src) {
  const code = stripSource(src, false);
  const lines = code.split('\n');
  const srcLines = src.split('\n');
  const out = [];
  const re = /(?:const|let|var)\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*=/g;
  for (let n = 0; n < lines.length; n++) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(lines[n])) !== null) {
      if (!KP_NAME.test(m[1])) continue;
      out.push({
        name: m[1],
        line: n + 1,
        init: srcLines[n].slice(m.index + m[0].length),
        initCode: lines[n].slice(m.index + m[0].length),
        afterCode: lines.slice(n + 1, n + 1 + CONT_CAP),
        afterRaw: srcLines.slice(n + 1, n + 1 + CONT_CAP),
      });
    }
  }
  return out;
}

/**
 * How many lines BELOW the declaration belong to its initializer. A declaration that is already
 * finished takes zero (G5) — otherwise `FROM_FILE` would be matched against whatever code happens
 * to sit under a one-line declaration, which is a widening dressed as a cure.
 *
 * Unfinished means: brackets still open, or the text ends on an operator, or it is empty (the
 * initializer begins on the next line). Counted over the comments-and-strings-blanked text, so a
 * bracket inside a string or a regex cannot drive it (398).
 */
function continuationLines(d) {
  const depth = (t) => {
    const b = stripSource(t, true);
    let n = 0;
    for (const ch of b) {
      if (ch === '(' || ch === '[' || ch === '{') n++;
      if (ch === ')' || ch === ']' || ch === '}') n--;
    }
    return n;
  };
  const unfinished = (t) => {
    const b = stripSource(t, true).trim();
    return b === '' || depth(t) > 0 || /[+,=?:&|([{]$/.test(b)
      // an unterminated template/string literal: an odd count of unblanked backticks
      || (t.split('`').length - 1) % 2 === 1;
  };
  let used = 0;
  let acc = d.initCode;
  while (used < CONT_CAP && unfinished(acc)) {
    if (d.afterCode[used] === undefined) break;
    acc += `\n${d.afterCode[used]}`;
    used++;
  }
  return used;
}

const flat = (t) => t.replace(/\s+/g, ' ');
const contCode = (d) => flat([d.initCode, ...d.afterCode.slice(0, continuationLines(d))].join(' '));
const contRaw = (d) => [d.init, ...d.afterRaw.slice(0, continuationLines(d))].join('\n');

const READER_CALL = /^\s*([A-Za-z_$][A-Za-z0-9_$.]*)\s*\(\s*(String\.raw\s*)?[`'"]/;
const TYPED_START = /^\s*(String\.raw\s*)?[`'"]/;
const FROM_FILE = /readFileSync|git\(\[|atRev|fromFile|sliceAt|readAll|SRC\b|\bsrc\b/;

// ─── the Round 409 key, copied unchanged, so both keys drive on ONE population ─────────────────
function stratum409(d) {
  const init = d.initCode;
  if (READER_CALL.test(init)) return 'TYPED-THEN-SLICED';
  if (TYPED_START.test(init)) {
    const ls = literalBodies(d.init);
    return ls.length > 0 ? 'TYPED-LITERAL' : 'UNMODELLED';
  }
  if (FROM_FILE.test(init)) return 'SLICED-FROM-FILE';
  if (/^\s*$/.test(init)) return 'UNMODELLED';
  return 'OTHER-DERIVED';
}

/** The positive keys for the terminal bucket. Read off the RAW initializer, because a regex
 *  literal is blanked out of the code form — which is exactly how three of them came to be
 *  published as "a number, an array, a plain identifier" (P4). */
const SHAPES = [
  ['REGEX', /^\s*\/(?![/*])/],
  ['NUMBER', /^\s*-?\d/],
  ['ARRAY', /^\s*\[/],
  ['OBJECT', /^\s*\{/],
  ['NEW', /^\s*new\s/],
  ['FUNCTION', /^\s*(async\s+)?(function\b|\(|[A-Za-z_$][A-Za-z0-9_$]*\s*=>)/],
  ['CALL-OR-IDENT', /^\s*[A-Za-z_$][A-Za-z0-9_$.?\[\]']*\s*[(;.,)\]]/],
  ['AWAIT', /^\s*await\s/],
  ['TRUTH', /^\s*(true|false|null|undefined)\b/],
];

function shapeOf(rawInit) {
  for (const [name, re] of SHAPES) if (re.test(rawInit)) return name;
  return null;
}

/**
 * The Round 411 key: continuation-aware, and the terminal bucket is EARNED.
 *
 * `FROM_FILE` reads the **strings-blanked** continuation, which the Round 409 key did not have to
 * do: one line of initializer rarely carries a fixture, but a continued array of fixture strings
 * carries `readFileSync` and `git([` *inside the fixtures*, and matching those is reading a
 * MENTION as a NAME. Drive 1 measured the cost of getting this wrong — five array-and-object
 * literals moved to `SLICED-FROM-FILE`, a stratum whose whole meaning is "not typed here". The
 * adjacency patterns above it must read the un-blanked form, because they key on the quote itself.
 */
function stratum411(d) {
  const c = contCode(d);
  if (READER_CALL.test(c)) return 'TYPED-THEN-SLICED';
  if (TYPED_START.test(c)) {
    const ls = literalBodies(contRaw(d));
    return ls.length > 0 ? 'TYPED-LITERAL' : 'UNMODELLED';
  }
  if (FROM_FILE.test(flat(stripSource(c, true)))) return 'SLICED-FROM-FILE';
  return shapeOf(contRaw(d).trim()) === null ? 'UNMODELLED' : 'OTHER-DERIVED';
}

// ─── the typed line, and then the BODY inside it (his §1) ──────────────────────────────────────
function typedLine(d) {
  if (!/^\s*[A-Za-z_$][A-Za-z0-9_$.]*\s*\(\s*String\.raw\s*`/.test(d.initCode)
      && !/^\s*String\.raw\s*`/.test(d.initCode)) return null;
  const i = d.init.indexOf('`');
  const j = d.init.lastIndexOf('`');
  return j > i ? d.init.slice(i + 1, j) : null;
}

/** The literal body INSIDE a typed line — the thing the KP actually stands in for. `null` when
 *  the typed line carries no string literal at all, never a sentinel (393). */
function bodyOf(tl) {
  if (tl === null) return null;
  const ls = literalBodies(tl);
  return ls.length > 0 ? ls[0].body : null;
}

const SOURCES = CORPUS.map((p) => [p, readFileSync(join(REPO, p), 'utf8')]);
const SRC_OF = new Map(SOURCES);

/** Does `body` occur as a verbatim trimmed LINE of some corpus file outside `skip`? */
function bodyIsCode(body, skip) {
  if (body === null || body.trim() === '') return null;
  const want = body.trim();
  for (const [p, src] of SOURCES) {
    if (skip.has(p)) continue;
    for (const l of src.split('\n')) if (l.trim() === want) return p;
  }
  return false;
}

/** Does `body` occur CARRIED INSIDE some corpus line outside `skip` — a fixture quoted in a file
 *  rather than executed by it? */
function bodyCarried(body, skip) {
  if (body === null || body.trim() === '') return null;
  const want = body.trim();
  for (const [p, src] of SOURCES) {
    if (skip.has(p)) continue;
    for (const l of src.split('\n')) if (l.includes(want) && l.trim() !== want) return p;
  }
  return false;
}

/** The whole-typed-line key from Round 409, kept so the two keys can be compared (339). */
function lineOccurs(tl, skip) {
  if (tl === null) return 'REFUSED';
  const want = tl.trim();
  if (want === '') return 'REFUSED';
  for (const [p, src] of SOURCES) {
    if (skip.has(p)) continue;
    for (const l of src.split('\n')) if (l.trim() === want) return p;
  }
  return false;
}

// ─── my known positives: {path, line, ident} into the live corpus ──────────────────────────────
const R408 = 'docs/research/round408-instruments/stratify-the-live-interval.mjs';
const KP_SITES = {
  WRAPPED:  { path: R408, line: 416, ident: 'KP_MESSAGE',
              want409: 'OTHER-DERIVED', want411: 'TYPED-THEN-SLICED' },
  ADJACENT: { path: R408, line: 400, ident: 'KP_PLAIN',
              want409: 'TYPED-THEN-SLICED', want411: 'TYPED-THEN-SLICED' },
  NUMBER:   { path: 'docs/research/round392-instruments/grade-the-finding-that-is-its-own-finding.mjs',
              line: 348, ident: 'KP_PROBE_PRINTS',
              want409: 'OTHER-DERIVED', want411: 'OTHER-DERIVED' },
  REGEX:    { path: 'docs/research/round409-instruments/census-the-hand-typed-known-positive.mjs',
              line: 173, ident: 'KP_NAME',
              want409: 'OTHER-DERIVED', want411: 'OTHER-DERIVED' },
  // the two halves of the mention-vs-name axis the strings-blanked FROM_FILE exists for (G8)
  MENTION:  { path: 'docs/research/round407-instruments/census-the-fixture-as-string-class.mjs',
              line: 295, ident: 'KP_BASE',
              want409: 'OTHER-DERIVED', want411: 'OTHER-DERIVED' },
  NAME:     { path: 'docs/research/round409-instruments/census-the-hand-typed-known-positive.mjs',
              line: 281, ident: 'KP_FAITHFUL',
              want409: 'UNMODELLED', want411: 'SLICED-FROM-FILE' },
};

function declAt(src, site) {
  const hits = declarations(src).filter((d) => d.line === site.line && d.name === site.ident);
  return hits.length === 1 ? { ...hits[0], path: site.path } : null;
}

const KP = {};
for (const [k, site] of Object.entries(KP_SITES)) {
  KP[k] = declAt(readFileSync(join(REPO, site.path), 'utf8'), site);
}
const UNSLICED = Object.entries(KP).filter(([, v]) => v === null).map(([k]) => k);
if (UNSLICED.length > 0) {
  console.error(`KP DID NOT SLICE: ${UNSLICED.join(', ')} — the cited identifier is no longer `
    + `declared on the cited line. Re-cite before reading any figure below. (341/399)`);
  process.exit(2);
}

// ─── the eight Round 408 KPs, read out of his file by name ─────────────────────────────────────
const EIGHT = ['KP_PLAIN', 'KP_MODULE', 'KP_TSANNOT', 'KP_ESCAPED', 'KP_FRAGMENT', 'KP_INTERP',
               'KP_NEWLINE', 'KP_MESSAGE'];
const R408_DECLS = declarations(readFileSync(join(REPO, R408), 'utf8'));
const SKIP = new Set([SELF, R408]);                     // the seam (405), graded both ways in G4
const EIGHT_ROWS = EIGHT.map((name) => {
  const ds = R408_DECLS.filter((d) => d.name === name);
  if (ds.length !== 1) return { name, refused: `declared ${ds.length} time(s) in his file` };
  const d = ds[0];
  const tl = typedLine(d);
  const body = bodyOf(tl);
  return {
    name, line: d.line, s409: stratum409(d), s411: stratum411(d),
    typedLine: tl, body,
    lineKey: lineOccurs(tl, SKIP),
    asCode: bodyIsCode(body, SKIP),
    carried: bodyCarried(body, SKIP),
  };
});
const REFUSED_EIGHT = EIGHT_ROWS.filter((r) => r.refused);

// his §1 member list, at the BODY granularity: stands for nothing under BOTH sub-keys
const bodyDecided = (r) => r.body !== null;
const standsForNothingBody = EIGHT_ROWS
  .filter((r) => !r.refused && bodyDecided(r) && r.asCode === false && r.carried === false);
const hasSiteBody = EIGHT_ROWS
  .filter((r) => !r.refused && bodyDecided(r)
                 && (typeof r.asCode === 'string' || typeof r.carried === 'string'));
const refusedBody = EIGHT_ROWS.filter((r) => !r.refused && !bodyDecided(r));

// HIS published §1 member list — the four he leaves standing for nothing, and the one he moves.
const HIS_STANDS_FOR_NOTHING = ['KP_PLAIN', 'KP_TSANNOT', 'KP_ESCAPED', 'KP_FRAGMENT'];
const HIS_MOVED = ['KP_MODULE'];
const mineSFN = standsForNothingBody.map((r) => r.name).sort();
const onlyHis = HIS_STANDS_FOR_NOTHING.filter((n) => !mineSFN.includes(n));
const onlyMine = mineSFN.filter((n) => !HIS_STANDS_FOR_NOTHING.includes(n));

g('G1', 'my re-implementation of his body key returns his §1 member list — set equality (328/340)',
  onlyHis.length === 0 && onlyMine.length === 0 && mineSFN.length > 0
  && HIS_MOVED.every((n) => {
    const r = EIGHT_ROWS.find((x) => x.name === n);
    return r !== undefined && (typeof r.asCode === 'string' || typeof r.carried === 'string');
  }),
  `mine [${mineSFN.join(' ')}] · only-his [${onlyHis.join(' ')}] · only-mine [${onlyMine.join(' ')}]`
  + ` · his moved member ${HIS_MOVED.join(',')}: asCode=`
  + `${EIGHT_ROWS.find((x) => x.name === 'KP_MODULE')?.asCode} carried=`
  + `${EIGHT_ROWS.find((x) => x.name === 'KP_MODULE')?.carried}`);

g('G2', 'every KP resolved at its cited {path, line, ident}, and his eight are all singly declared',
  UNSLICED.length === 0 && REFUSED_EIGHT.length === 0
  && Object.entries(KP_SITES).every(([k, s]) => KP[k].name === s.ident),
  `${Object.keys(KP).length} cited KP(s) sliced, 0 refused · his eight: `
  + `${EIGHT_ROWS.length - REFUSED_EIGHT.length} of 8 singly declared`);

// ─── G3/G4: the body key, on a hand read and on a CONSTRUCTED control ──────────────────────────
// Hand read first, recorded whole at `handread-the-body-sites.out` — the full `git grep`, with no
// pipe on it. `import { readFileSync } from 'node:fs';` occurs as a verbatim line in **16** corpus
// files and CARRIED at round407-instruments/…:296. That hand read is what this leg grades — the
// key must reproduce it, not restate it (350).
//
// My FIRST hand read said nine, and so does his 410 §1. Nine is the number you get from the first
// twelve lines of that grep — which is what I had typed, `| head -12`. The count is a graded leg
// here precisely because it was prose in both of our memos and prose is not measured.
const HAND_READ_CODE_FILES = 16;
const HAND_READ_CARRIED = 'docs/research/round407-instruments/census-the-fixture-as-string-class.mjs';
const kpModule = EIGHT_ROWS.find((r) => r.name === 'KP_MODULE');
const codeFileCount = (body, skip) => {
  const want = body.trim();
  return SOURCES.filter(([p, src]) =>
    !skip.has(p) && src.split('\n').some((l) => l.trim() === want)).length;
};

// The control is CONSTRUCTED, never typed: 410 §4 measured an agent write path decoding a typed
// backslash before the file existed. `String.fromCharCode(92)` is the one spelling it cannot eat.
const BS = String.fromCharCode(92);
const CONTROL_BODY = `const zz_r411_control_${BS}u0041 = 'no corpus line is spelled this way';`;

g('G3', 'the body key reproduces the hand read on a known positive and refuses a constructed control',
  kpModule !== undefined
  && typeof kpModule.asCode === 'string' && typeof kpModule.carried === 'string'
  && codeFileCount(kpModule.body, SKIP) === HAND_READ_CODE_FILES
  && kpModule.carried === HAND_READ_CARRIED
  && bodyIsCode(CONTROL_BODY, SKIP) === false && bodyCarried(CONTROL_BODY, SKIP) === false,
  `KP_MODULE body ${JSON.stringify(kpModule?.body)} · asCode ${kpModule?.asCode} · `
  + `code files ${kpModule === undefined ? 'MISSING' : codeFileCount(kpModule.body, SKIP)} `
  + `(hand read ${HAND_READ_CODE_FILES}) · carried ${kpModule?.carried} · `
  + `control asCode ${bodyIsCode(CONTROL_BODY, SKIP)} carried ${bodyCarried(CONTROL_BODY, SKIP)}`);

const NO_SEAM = new Set([R408]);                         // SELF no longer skipped
const ctrlSeamOff = bodyCarried(CONTROL_BODY, NO_SEAM);
const ctrlSeamOn = bodyCarried(CONTROL_BODY, SKIP);
const kpSeamOff = kpModule === undefined ? null : bodyIsCode(kpModule.body, NO_SEAM);
const kpSeamOn = kpModule === undefined ? null : bodyIsCode(kpModule.body, SKIP);
const SELF_TRACKED = git(['ls-files', '--', SELF]).trim() !== '';
g('G4', 'the self seam does exactly one thing, graded both ways (405)',
  SELF_TRACKED
    ? ctrlSeamOff === SELF && ctrlSeamOn === false
      && typeof kpSeamOff === 'string' && typeof kpSeamOn === 'string'
    : 'REFUSES — this file is untracked, so it is not in the corpus and the seam has nothing to do',
  SELF_TRACKED
    ? `control: seam OFF -> ${ctrlSeamOff} · seam ON -> ${ctrlSeamOn} · `
      + `known positive survives both: ${kpSeamOff} / ${kpSeamOn}`
    : `${SELF} is NOT in \`git ls-files\` at ${REV.slice(0, 8)} — drive one cannot grade the seam`);

// ─── G5: the continuation does not over-reach ──────────────────────────────────────────────────
const contOf = Object.fromEntries(Object.entries(KP).map(([k, d]) => [k, continuationLines(d)]));
g('G5', 'a finished declaration consumes ZERO continuation lines; the wrapped one consumes at least 1',
  contOf.NUMBER === 0 && contOf.ADJACENT === 0 && contOf.REGEX === 0 && contOf.WRAPPED >= 1,
  Object.entries(contOf).map(([k, v]) => `${k}=${v}`).join(' · '));

// ─── G6: the 2 x 2 ─────────────────────────────────────────────────────────────────────────────
const cell = (k, which) => (which === 409 ? stratum409(KP[k]) : stratum411(KP[k]));
const grid = [['WRAPPED', 409], ['WRAPPED', 411], ['ADJACENT', 409], ['ADJACENT', 411]];
g('G6', 'the cure moves the WRAPPED cell and leaves the ADJACENT cell and both controls alone',
  cell('WRAPPED', 409) === KP_SITES.WRAPPED.want409
  && cell('WRAPPED', 411) === KP_SITES.WRAPPED.want411
  && cell('ADJACENT', 409) === KP_SITES.ADJACENT.want409
  && cell('ADJACENT', 411) === KP_SITES.ADJACENT.want411
  && cell('NUMBER', 409) === 'OTHER-DERIVED' && cell('NUMBER', 411) === 'OTHER-DERIVED'
  && cell('REGEX', 409) === 'OTHER-DERIVED' && cell('REGEX', 411) === 'OTHER-DERIVED',
  grid.map(([k, w]) => `${k}@${w}=${cell(k, w)}`).join(' · ')
  + ` · controls NUMBER@411=${cell('NUMBER', 411)} REGEX@411=${cell('REGEX', 411)}`);

// ─── G8: a fixture that MENTIONS a reader is not a declaration that CALLS one ──────────────────
// Added after drive 1, where the continuation handed FROM_FILE the inside of five fixture arrays
// and five typed literals became `SLICED-FROM-FILE`. Recorded as added, not backdated (408 P6).
g('G8', 'FROM_FILE reads the strings-blanked continuation: a mentioned reader does not move a '
  + 'fixture array, and a called one still lands SLICED-FROM-FILE',
  cell('MENTION', 411) === KP_SITES.MENTION.want411
  && cell('MENTION', 409) === KP_SITES.MENTION.want409
  && cell('NAME', 411) === KP_SITES.NAME.want411
  && cell('NAME', 409) === KP_SITES.NAME.want409,
  `MENTION (an array of fixtures carrying "readFileSync") @409=${cell('MENTION', 409)} `
  + `@411=${cell('MENTION', 411)} · NAME (a declaration that calls it) @409=`
  + `${cell('NAME', 409)} @411=${cell('NAME', 411)}`);

// ─── the census, both keys, one population ─────────────────────────────────────────────────────
const ROWS = [];
for (const [p, src] of SOURCES) {
  const slicer = slicesSource(src);
  for (const d of declarations(src)) {
    const s409 = stratum409(d);
    const s411 = stratum411(d);
    const inClass = (s) => slicer && (s === 'TYPED-LITERAL' || s === 'TYPED-THEN-SLICED');
    ROWS.push({ path: p, name: d.name, line: d.line, slicer, s409, s411,
                in409: inClass(s409), in411: inClass(s411),
                shape: shapeOf(contRaw(d).trim()), cont: continuationLines(d),
                rawInit: contRaw(d).trim().slice(0, 60) });
  }
}
const P = ROWS.filter((r) => r.path !== SELF);
const movers = P.filter((r) => r.s409 !== r.s411);
const intoClass = movers.filter((r) => !r.in409 && r.in411);
const fromUnmodelled = movers.filter((r) => r.s409 === 'UNMODELLED');

// ─── G7: the count beside a member list is that list's length, old spelling as control ─────────
/** Every member list this file prints goes through here, so a count and its list cannot disagree
 *  (his 410 §7, and 340). The printed names ARE the counted names. */
function named(rows, cap = Infinity) {
  // `path` is absent on the eight Round 408 rows, which all come from one file by construction.
  const names = rows.map((r) => `${(r.path ?? R408).split('/').pop()}:${r.line} ${r.name}`);
  const shown = names.slice(0, cap);
  return { n: shown.length, total: names.length, text: shown.join(' | ') };
}
const sfnAll = named(standsForNothingBody);
const sfnOld = standsForNothingBody.slice(0, 4);         // the old `slice(0, 4)` spelling, driven
g('G7', 'the printed count equals its own member list, and the old slice(0, 4) spelling goes red',
  sfnAll.n === sfnAll.total && sfnAll.n === standsForNothingBody.length
  && !(sfnOld.length === standsForNothingBody.length && standsForNothingBody.length === 5),
  `cured: count ${sfnAll.n} beside ${sfnAll.n} name(s) · CONTROL, old spelling: count `
  + `${standsForNothingBody.length} beside ${sfnOld.length} name(s) — `
  + `${sfnOld.length === standsForNothingBody.length ? 'AGREE on this population' : 'DISAGREE'}`);

// ─── predictions ───────────────────────────────────────────────────────────────────────────────
const wrappedClass = P.filter((r) => r.s409 === 'OTHER-DERIVED' && r.s411 === 'TYPED-THEN-SLICED');
g('P1', 'the wrapped-reader-call class is exactly 1 corpus-wide, and it is KP_MESSAGE',
  wrappedClass.length === 1 && wrappedClass[0].name === 'KP_MESSAGE',
  `${wrappedClass.length} member(s): ${named(wrappedClass).text || 'none'}`);

g('P2', 'curing the mechanism moves 4 declarations, 3 into the class, 3 of them out of UNMODELLED',
  movers.length === 4 && intoClass.length === 3 && fromUnmodelled.length === 3,
  `${movers.length} mover(s), ${intoClass.length} into the class, ${fromUnmodelled.length} out of `
  + `UNMODELLED · ${named(movers).text}`);

const undec409 = P.filter((r) => r.s409 === 'UNMODELLED' && r.slicer);
const undec411 = P.filter((r) => r.s411 === 'UNMODELLED' && r.slicer);
const floor409 = P.filter((r) => r.in409).length;
const floor411 = P.filter((r) => r.in411).length;
g('P3', 'the interval collapses: the 411 ceiling equals the 411 floor',
  undec411.length === 0,
  `409: [${floor409}, ${floor409 + undec409.length}] · `
  + `411: [${floor411}, ${floor411 + undec411.length}] · `
  + `undecided-in-a-slicing-file ${undec409.length} -> ${undec411.length}`
  + (undec411.length > 0 ? ` · still undecided: ${named(undec411).text}` : ''));

const otherDerived = P.filter((r) => r.s409 === 'OTHER-DERIVED');
const regexes = otherDerived.filter((r) => r.shape === 'REGEX');
g('P4', 'OTHER-DERIVED is a default: at least 3 of its members are regex literals, which its gloss '
  + 'does not name',
  regexes.length >= 3,
  `OTHER-DERIVED(409) ${otherDerived.length} · REGEX ${regexes.length} · by shape: `
  + Object.entries(otherDerived.reduce((a, r) => {
      a[r.shape ?? 'UNRECOGNISED'] = (a[r.shape ?? 'UNRECOGNISED'] ?? 0) + 1; return a; }, {}))
      .map(([k, v]) => `${k} ${v}`).join(' · '));

g('P5', 'the eight partition 4 stands-for-nothing / 2 with a site / 2 refused under the body key',
  standsForNothingBody.length === 4 && hasSiteBody.length === 2 && refusedBody.length === 2,
  `${standsForNothingBody.length} nothing [${mineSFN.join(' ')}] · ${hasSiteBody.length} site `
  + `[${hasSiteBody.map((r) => r.name).join(' ')}] · ${refusedBody.length} refused `
  + `[${refusedBody.map((r) => r.name).join(' ')}]`);

// His hand-read provenance partition, from his 410 §3 — three SITE-KPs and five SHAPE-KPs.
const HIS_SITE = ['KP_MODULE', 'KP_NEWLINE', 'KP_MESSAGE'];
const HIS_SHAPE = EIGHT.filter((n) => !HIS_SITE.includes(n));
const disagreements = EIGHT_ROWS.filter((r) => {
  if (r.refused || !bodyDecided(r)) return false;        // mine refuses: not a disagreement
  const mineSaysSite = typeof r.asCode === 'string' || typeof r.carried === 'string';
  return mineSaysSite !== HIS_SITE.includes(r.name);
});
g('P6', 'his hand-read partition and my body key agree on every member where both can speak',
  disagreements.length === 0,
  `his 3 SITE [${HIS_SITE.join(' ')}] / 5 SHAPE · mine decides `
  + `${EIGHT_ROWS.filter((r) => !r.refused && bodyDecided(r)).length} of 8 · disagreements `
  + `${disagreements.length}${disagreements.length > 0
      ? `: ${disagreements.map((r) => r.name).join(' ')}` : ''}`);

// ─── verdict, then the figures — never the other way round (356) ───────────────────────────────
console.log(`\nRound 411 — the wrapped call and the body key, at ${REV.slice(0, 8)}\n`);
for (const [leg, why] of EXPECTED) console.log(`  EXPECTED ${leg}  ${why}`);
console.log('');
for (const { leg, claim, ok, detail, gate } of GRADES) {
  console.log(`  ${String(ok).toUpperCase().padEnd(5)} ${leg.padEnd(3)} ${gate ? '[GATE]' : '[PRED]'} ${claim}`);
  console.log(`        ${detail}`);
}
const badGate = GRADES.filter((x) => x.gate && x.ok !== true);
const refuted = GRADES.filter((x) => !x.gate && x.ok !== true);
console.log(`\nGATE: ${badGate.length === 0}   (${GRADES.filter((x) => x.gate).length} leg(s) on `
  + `the key itself)`);
if (badGate.length !== 0) {
  console.log(`GATE NOT TRUE: ${badGate.map((x) => x.leg).join(' | ')} — the key is not sound, so `
    + `no figure is published below it (356).`);
  process.exit(1);
}
console.log(`PREDICTIONS: ${GRADES.filter((x) => !x.gate && x.ok).length} landed, `
  + `${refuted.length} REFUTED${refuted.length > 0 ? `: ${refuted.map((x) => x.leg).join(' | ')}` : ''}`);
if (refuted.length > 0) {
  console.log(`\n  !! A REFUTED PREDICTION IS THE ROUND'S CONTENT, NOT ITS FAILURE (383). Each one`);
  console.log(`     above prints what it measured. Gate legs read the key; prediction legs read the`);
  console.log(`     corpus; the assignment is by what the leg reads and does not move (409 §4).`);
}

console.log(`\n── the two keys on one population at one rev ──\n`);
console.log(`  rev ${REV.slice(0, 8)} · corpus ${CORPUS.length} file(s) · ${P.length} `
  + `declaration(s) outside this file · worktree `
  + `${git(['status', '--porcelain']).trim() === '' ? 'CLEAN' : 'DIRTY'}`);
for (const key of ['409', '411']) {
  const f = key === '409' ? floor409 : floor411;
  const u = key === '409' ? undec409 : undec411;
  console.log(`\n  ${key} key: ` + ['TYPED-LITERAL', 'TYPED-THEN-SLICED', 'SLICED-FROM-FILE',
    'OTHER-DERIVED', 'UNMODELLED'].map((s) =>
      `${s} ${P.filter((r) => r[`s${key}`] === s).length}`).join(' · '));
  console.log(`          interval [${f}, ${f + u.length}] — floor ${f} decided in-class, `
    + `+${u.length} undecided in a slicing file`);
}
console.log(`\n── every movement, by member (340) ──\n`);
for (const r of movers) {
  console.log(`  ${r.s409.padEnd(17)} -> ${r.s411.padEnd(17)} ${r.in409 ? 'in' : 'out'}->`
    + `${r.in411 ? 'in' : 'out'} cont=${r.cont}  ${r.path}:${r.line} ${r.name}`);
  console.log(`        init: ${JSON.stringify(r.rawInit)}`);
}
console.log(`\n── the eight Round 408 KPs: the line key, then the body key ──\n`);
for (const r of EIGHT_ROWS) {
  if (r.refused) { console.log(`  ${r.name.padEnd(12)} REFUSED — ${r.refused}`); continue; }
  console.log(`  ${r.name.padEnd(12)} ${r.s409.padEnd(17)} -> ${r.s411.padEnd(17)} `
    + `line-key ${String(r.lineKey).split('/').pop().padEnd(22)} `
    + `body as-code ${String(r.asCode).split('/').pop().padEnd(16)} `
    + `carried ${String(r.carried).split('/').pop()}`);
  console.log(`               body: ${JSON.stringify(r.body)}`);
}
console.log(`\n── OTHER-DERIVED(409), by the shape the 411 key can actually name ──\n`);
for (const r of otherDerived) {
  console.log(`  ${String(r.shape ?? 'UNRECOGNISED').padEnd(14)} ${r.path}:${r.line} ${r.name}`);
}
console.log('');
