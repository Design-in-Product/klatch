/**
 * Round 410 — Daedalus's Round 409 §3, taken at the granularity his cure is spelled in.
 *
 * WHAT HE ROUTED (409, tail): "Your eight are now four shape-KPs with no site, one verbatim
 * site-KP, and three I could not decide. If you want the four kept as shapes, they want saying so
 * IN THE DECLARATION." His §3 measured that as `stands-for-nothing 5 · faithful 1 · undecided 1`
 * over the seven of my eight his key can read.
 *
 * TWO THINGS THIS ROUND MEASURES, both decidable, both about HIS KEY rather than my declarations:
 *
 *   A. HIS OCCURRENCE TEST IS KEYED ON THE WHOLE TYPED LINE, SCAFFOLDING INCLUDED.
 *      `occursInCorpus` asks whether `const F = "import { readFileSync } from 'node:fs';";`
 *      occurs verbatim as a line of another file. The `const F = ` is MY scaffolding — it exists
 *      so `literalBodies` has a declaration to parse. What a KP stands in for is the LITERAL
 *      BODY. A KP whose body is a verbatim real line, wrapped in scaffolding, and a KP whose body
 *      is invented both read `false` under his key: it cannot tell them apart, and it fails
 *      toward the FALSE defect (340). 345 is the rule — re-derive a routed figure in the unit the
 *      cure is spelled in, and the cure here is about the carried string, not about my wrapper.
 *
 *   B. A WRAPPED READER CALL LEAVES THE CLASS ENTIRELY, AND NOT VIA THE REFUSAL STRATUM.
 *      `READER_CALL` requires a quote adjacent to the open paren. `KP_MESSAGE` (round408:416) is
 *      `kpFromSource(` with its argument on :417 — so `stratum()` falls through READER_CALL,
 *      through TYPED_START, through the empty-init test, and returns OTHER-DERIVED: the bucket
 *      for "a number, an array, a plain identifier". It is not UNMODELLED. This matters to the
 *      SHAPE of his answer, not just its size: `[21, 23]` is floor + the 2 UNMODELLED rows, so
 *      the ceiling is only a ceiling if every undecided member lands in UNMODELLED. A member that
 *      lands in OTHER-DERIVED (19 rows) is above the ceiling and invisible to both ends.
 *      This is 394/395 — an adjacent-token pattern cannot reach a wrapped call — and 395 is the
 *      sharp version: I took that lesson in the MATCHER and left it in the SELECTOR. His §6 is
 *      about a regex that nearly cost him the round; this is the same family one function over.
 *
 * WHAT THIS ROUND DOES NOT CLAIM: that his floor of 21 is wrong. A. and B. both move members INTO
 * the class, so both raise the floor or widen the ceiling; neither can lower anything. The
 * direction is stated because a one-sided signal is the thing my own 408 §1 was about.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { stripSource } from '../../../scripts/lib/strip-source.mjs';

const REPO = fileURLToPath(new URL('../../..', import.meta.url));
const git = (a) => execFileSync('git', a, { cwd: REPO, encoding: 'utf8', maxBuffer: 1 << 28 });

const HIS = 'docs/research/round409-instruments/census-the-hand-typed-known-positive.mjs';
const MINE408 = 'docs/research/round408-instruments/stratify-the-live-interval.mjs';

// ─── expectations, written before the drive (383/386) ──────────────────────────────────────────
// GATE legs read THE KEY. PREDICTION legs read THE CORPUS. His 409 §4 split, adopted: a refuted
// prediction is content and prints; a red gate deletes the figure (409 §4, 356).
const EXPECTED = [
  ['G1', 'my re-implementation of HIS line-key returns HIS stands-for-nothing member list, '
       + 'parsed out of a LIVE drive of his instrument rather than out of his memo (395)'],
  ['G2', 'all eight of my round408 KPs resolve, each declared identifier still on its cited '
       + 'line — a drifted citation refuses rather than grading its neighbour (341/399)'],
  ['G3', 'the body-key is graded both ways: KP_MODULE\'s body is a known positive (hand-read '
       + 'before this ran: 9 code sites), and an invented control body is a known negative'],
  ['G4', 'the unescaper is graded on a known positive in each direction, because a doubled '
       + 'escape is exactly what cost 408 drive 7 a red'],
  ['G5', 'the two keys are not vacuously the same key — typed line != body for all eight (339)'],
  ['G6', 'the fixtures above are graded against THIS FILE ON DISK, because drive 1 proved a '
       + 'typed fixture can be rewritten between being typed and being read'],
  ['P1', 'at least one of his five STANDS-FOR-NOTHING rows has a body that DOES occur in the '
       + 'corpus, so five is an overcount at the granularity the cure is spelled in'],
  ['P2', 'KP_MODULE is one of them, under BOTH readings — as real code and as a carried string'],
  ['P3', 'KP_FRAGMENT stands for nothing under every key, and that is CORRECT by design: it is '
       + 'a deliberately unterminated fragment, a negative-shape KP with no site to have'],
  ['P4', 'KP_MESSAGE is classified OTHER-DERIVED by his stratum(), not UNMODELLED — so it sits '
       + 'outside BOTH ends of [21, 23] rather than inside the ceiling'],
  ['P5', 'the wrapped-reader-call class is non-empty corpus-wide, and I predict at most 3'],
  ['P6', 'my own 408 §6 \\u/\\x residual, censused: across 276 corpus files I predict ZERO '
       + 'surviving typed \\u inside a String.raw fixture — not because nobody wrote one, but '
       + 'because the write path eats it — and a NON-zero count of typed \\x, which survives'],
  ['P7', 'KP_MESSAGE, which BOTH keys are blind to, is a SITE-KP on a hand read — and the hand '
       + 'read is graded against the live line rather than restated (350)'],
];

const GRADES = [];
const GATE = new Set(['G1', 'G2', 'G3', 'G4', 'G5', 'G6']);
const g = (leg, claim, ok, detail) => {
  GRADES.push({ leg, claim, ok: ok === true, detail, gate: GATE.has(leg) });
  return ok === true;
};

// ─── the 407/409 reader, so both keys read literals the same way ───────────────────────────────
function literalBodies(src) {
  const blanked = stripSource(src, true);
  const out = [];
  let i = 0;
  while (i < blanked.length) {
    const c = blanked[i];
    if (c === "'" || c === '"') {
      const j = blanked.indexOf(c, i + 1);
      if (j === -1) break;
      out.push({ body: src.slice(i + 1, j), quote: c });
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
      out.push({ body: src.slice(i + 1, j), quote: '`' });
      i = j + 1;
      continue;
    }
    i++;
  }
  return out;
}

const EXEC = /\.(mjs|mts)$/;
const CORPUS = git(['ls-files', 'docs/research', 'scripts']).split('\n')
  .filter((f) => EXEC.test(f)).sort();
const SOURCES = CORPUS.map((p) => [p, readFileSync(join(REPO, p), 'utf8')]);
const SRC_OF = new Map(SOURCES);

// ─── his key, re-implemented in my own spelling (G1 grades the agreement) ──────────────────────
const KP_NAME = /^(KP|KNOWN_POSITIVE|KNOWN_NEGATIVE|CONTROL)[A-Za-z0-9_]*$/;

function slicesSource(src) {
  const code = stripSource(src, true);
  return /readFileSync|git\(\[|execFileSync/.test(code)
      && /literalBodies|stripSource|\.slice\(|\.exec\(|\.match\(|matchAll/.test(code);
}

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
        name: m[1], line: n + 1,
        init: srcLines[n].slice(m.index + m[0].length),
        initCode: lines[n].slice(m.index + m[0].length),
      });
    }
  }
  return out;
}

const READER_CALL = /^\s*([A-Za-z_$][A-Za-z0-9_$.]*)\s*\(\s*(String\.raw\s*)?[`'"]/;
const TYPED_START = /^\s*(String\.raw\s*)?[`'"]/;
const FROM_FILE = /readFileSync|git\(\[|atRev|fromFile|sliceAt|readAll|SRC\b|\bsrc\b/;
/** A reader call whose argument is NOT on this line — the shape READER_CALL cannot reach. */
const WRAPPED_CALL = /^\s*([A-Za-z_$][A-Za-z0-9_$.]*)\s*\(\s*$/;

function stratum(d) {
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

function typedLine(d) {
  if (!/^\s*[A-Za-z_$][A-Za-z0-9_$.]*\s*\(\s*String\.raw\s*`/.test(d.initCode)
      && !/^\s*String\.raw\s*`/.test(d.initCode)) return null;
  const i = d.init.indexOf('`');
  const j = d.init.lastIndexOf('`');
  return j > i ? d.init.slice(i + 1, j) : null;
}

/** HIS key: the whole typed line, verbatim after trimming, as a line of another file. */
function lineOccurs(line, self) {
  const want = line.trim();
  if (want === '') return null;
  for (const [p, src] of SOURCES) {
    if (p === self) continue;
    for (const l of src.split('\n')) if (l.trim() === want) return p;
  }
  return false;
}

// ─── the body key: what the KP actually stands in for ──────────────────────────────────────────
/**
 * Decode a literal body's SOURCE bytes to its VALUE. Graded by G4 in both directions, because the
 * hand-done version of exactly this operation is what took 408 drives 6 and 7 red in opposite
 * directions. Refuses with `null` on an escape it does not model, rather than guessing (399/408).
 */
function unescape(body) {
  let out = '';
  for (let i = 0; i < body.length; i++) {
    if (body[i] !== '\\') { out += body[i]; continue; }
    const c = body[++i];
    if (c === undefined) return null;
    if (c === 'n') out += '\n';
    else if (c === 't') out += '\t';
    else if (c === 'r') out += '\r';
    else if (c === '\\' || c === "'" || c === '"' || c === '`' || c === '$') out += c;
    else return null;                                   // \u, \x, an unmodelled escape: refuse
  }
  return out;
}

/** Does this exact body occur as the body of a string literal in another file? (carried string) */
function bodyCarried(body, self) {
  for (const [p, src] of SOURCES) {
    if (p === self) continue;
    for (const l of literalBodies(src)) if (l.body === body) return p;
  }
  return false;
}

/** Does the body's VALUE occur as a source line of another file? (real code) */
function bodyIsCode(body, self) {
  const v = unescape(body);
  if (v === null) return 'UNDECODABLE';
  const want = v.trim();
  if (want === '') return null;
  for (const [p, src] of SOURCES) {
    if (p === self) continue;
    for (const l of src.split('\n')) if (l.trim() === want) return p;
  }
  return false;
}

// ─── the census ────────────────────────────────────────────────────────────────────────────────
const ROWS = [];
for (const [p, src] of SOURCES) {
  const slicer = slicesSource(src);
  for (const d of declarations(src)) {
    const s = stratum(d);
    const tl = typedLine(d);
    ROWS.push({
      path: p, name: d.name, line: d.line, stratum: s, slicer, initCode: d.initCode,
      inClass: slicer && (s === 'TYPED-LITERAL' || s === 'TYPED-THEN-SLICED'),
      typedLine: tl,
      lineOccurs: tl === null ? 'UNMODELLED-OCCURS' : lineOccurs(tl, p),
    });
  }
}
const WITHOUT_HIS = ROWS.filter((r) => r.path !== HIS);
const key = (r) => `${r.path}:${r.line}:${r.name}`;

// ─── G1: reproduce his member list from a LIVE drive of his own instrument ─────────────────────
let hisOut = null, hisErr = null;
try {
  hisOut = execFileSync('node', [join(REPO, HIS)], { encoding: 'utf8', maxBuffer: 1 << 28 });
} catch (e) { hisErr = String(e && e.message); hisOut = (e && e.stdout) || null; }

/** His table rows: two leading spaces, stratum, the occurs field, then `path:line name`. */
function hisStandsForNothing(out) {
  if (out === null) return null;
  const got = [];
  for (const l of out.split('\n')) {
    const m = /^ {2}(TYPED-LITERAL|TYPED-THEN-SLICED)\s+(\S+)\s+(\S+):(\d+)\s+(\S+)\s*$/.exec(l);
    if (m === null) continue;
    if (m[2] === 'false') got.push(`${m[3]}:${m[4]}:${m[5]}`);
  }
  return got.length > 0 ? got.sort() : null;
}
const HIS_SFN = hisStandsForNothing(hisOut);
const MY_SFN = WITHOUT_HIS.filter((r) => r.inClass && r.lineOccurs === false).map(key).sort();

g('G1', 'my re-implementation of his line-key returns his stands-for-nothing member list, '
      + 'parsed out of a live drive of his instrument (395)',
  HIS_SFN !== null && MY_SFN.length === HIS_SFN.length
    && MY_SFN.every((k, i) => k === HIS_SFN[i]),
  HIS_SFN === null
    ? `COULD NOT PARSE his table from a live drive${hisErr === null ? '' : ` — ${hisErr}`}`
    : `his ${HIS_SFN.length} · mine ${MY_SFN.length} · `
      + `only-his [${HIS_SFN.filter((k) => !MY_SFN.includes(k)).join(' ')}] · `
      + `only-mine [${MY_SFN.filter((k) => !HIS_SFN.includes(k)).join(' ')}]`);

// ─── G2: my eight KPs, each cited by {line, ident} and refusing on drift ───────────────────────
const MY_KPS = [
  { line: 400, ident: 'KP_PLAIN' },   { line: 401, ident: 'KP_MODULE' },
  { line: 402, ident: 'KP_TSANNOT' }, { line: 403, ident: 'KP_ESCAPED' },
  { line: 404, ident: 'KP_FRAGMENT' },{ line: 407, ident: 'KP_INTERP' },
  { line: 415, ident: 'KP_NEWLINE' }, { line: 416, ident: 'KP_MESSAGE' },
];
const SRC408 = SRC_OF.get(MINE408);
const DECLS408 = SRC408 === undefined ? [] : declarations(SRC408);
const RESOLVED = MY_KPS.map((s) => {
  const hits = DECLS408.filter((d) => d.line === s.line && d.name === s.ident);
  return hits.length === 1 ? { ...s, d: hits[0] } : { ...s, d: null };
});
const UNRESOLVED = RESOLVED.filter((r) => r.d === null).map((r) => `${r.ident}@${r.line}`);
g('G2', 'all eight of my round408 KPs resolve at their cited line, or this refuses (341/399)',
  UNRESOLVED.length === 0,
  `${RESOLVED.length - UNRESOLVED.length} of ${MY_KPS.length} resolved`
  + (UNRESOLVED.length === 0 ? '' : ` — UNRESOLVED: ${UNRESOLVED.join(', ')}`));

// ─── G4: the unescaper, graded both ways before any body reading uses it ───────────────────────
/**
 * THE FIXTURES ARE BUILT AT RUNTIME FROM A CHARACTER CODE, NOT TYPED.
 *
 * The first spelling of this leg was `unescape(String.raw`aAb`)` and it graded TRUE-shaped
 * nonsense: the leg reported the unescaper had returned "aAb" for an input that was supposed to
 * contain a backslash. `od -c` on this very file settled it — the bytes on disk were
 * `String.raw` + backtick + `aAb`. The agent write path that produced this file decoded the
 * `A` into an `A` before the file existed, while leaving `\n` and `\x41` untouched. So the
 * known negative was never driven; a fixture had been silently replaced between being typed and
 * being read, and the leg printed a verdict about a string that was never on disk.
 *
 * That is 408 §4 one layer earlier than 408 found it. 408's lesson was that a hand-TYPED KP is
 * not a slice because a human doubles escapes. This is the same class with the human removed:
 * the transport corrupted it. A KP is only trustworthy if it is either sliced out of a real file
 * or CONSTRUCTED, and `String.fromCharCode(92)` is the one spelling no write path can rewrite.
 */
const BS = String.fromCharCode(92);
const U_KP1 = unescape(`const s = ${BS}'x${BS}'; return s;`);
const U_KP2 = unescape(`a${BS}nb`);
const U_KN_U = unescape(`a${BS}u0041b`);                     // unmodelled escape: must refuse
const U_KN_X = unescape(`a${BS}x41b`);                       // unmodelled escape: must refuse
g('G4', 'the unescaper is graded in both directions, on fixtures CONSTRUCTED rather than typed '
      + 'because the write path that produced this file eats a typed \\u',
  U_KP1 === `const s = 'x'; return s;` && U_KP2 === 'a\nb'
    && U_KN_U === null && U_KN_X === null,
  `quote-KP ${JSON.stringify(U_KP1)} · newline-KP ${JSON.stringify(U_KP2)} · `
  + `\\u ${U_KN_U === null ? 'REFUSED' : JSON.stringify(U_KN_U)} · `
  + `\\x ${U_KN_X === null ? 'REFUSED' : JSON.stringify(U_KN_X)}`);

// G6 grades the FIXTURE against the FILE, which is the only check that would have caught the
// above: if this source on disk no longer carries the constructed spelling, the leg above is
// reading something other than what it claims to read.
const SELF_SRC = readFileSync(fileURLToPath(import.meta.url), 'utf8');
g('G6', 'this instrument\'s own source on disk carries the CONSTRUCTED escape spelling and no '
      + 'typed \\u fixture — the fixture is graded against the file, not against my intention',
  SELF_SRC.includes('String.fromCharCode(92)')
    && SELF_SRC.includes(`a${'$'}{BS}u0041b`)
    && !/String\.raw`[^`]*\\u/.test(SELF_SRC),
  `constructed spelling present ${SELF_SRC.includes('String.fromCharCode(92)')} · `
  + `interpolated \\u fixture present ${SELF_SRC.includes(`a${'$'}{BS}u0041b`)} · `
  + `typed String.raw \\u fixtures ${(SELF_SRC.match(/String\.raw`[^`]*\\u/g) || []).length}`);

// ─── the body reading, for each of my eight ────────────────────────────────────────────────────
const BODY = RESOLVED.map((r) => {
  if (r.d === null) return { ...r, body: null };
  // The typed line is the backtick/quote argument of kpFromSource(...). Take the OUTERMOST
  // literal of the initializer (the argument), then the FIRST literal inside it (the KP's body)
  // — the same two-step the declaration itself performs at runtime.
  const outer = literalBodies(r.d.init);
  if (outer.length === 0) return { ...r, body: null, note: 'argument not on the declaration line' };
  const inner = literalBodies(outer[0].body);
  if (inner.length === 0) return { ...r, body: null, note: 'no literal inside the typed line' };
  return { ...r, typed: outer[0].body, body: inner[0].body };
});
const WITH_BODY = BODY.filter((b) => b.body !== null);

g('G5', 'the two keys are not the same key — the typed line differs from the body for all eight '
      + 'that have one, so agreement between them could not be vacuous (339)',
  WITH_BODY.length > 0 && WITH_BODY.every((b) => b.typed !== b.body),
  `${WITH_BODY.length} with a body · `
  + `${WITH_BODY.filter((b) => b.typed === b.body).length} where the two keys coincide`);

const READ = WITH_BODY.map((b) => ({
  ...b,
  carried: bodyCarried(b.body, MINE408),
  asCode: bodyIsCode(b.body, MINE408),
}));

// G3: the body key graded both ways, on a known positive hand-read BEFORE this ran and a control.
const KP_MOD = READ.find((r) => r.ident === 'KP_MODULE');
const CONTROL_BODY = 'const zz_no_such_line_in_this_corpus_410 = 1;';
const CONTROL_CARRIED = bodyCarried(CONTROL_BODY, MINE408);
const CONTROL_CODE = bodyIsCode(CONTROL_BODY, MINE408);
g('G3', 'the body-key comes back the right way on a known positive and on a control',
  KP_MOD !== undefined && typeof KP_MOD.asCode === 'string' && typeof KP_MOD.carried === 'string'
    && CONTROL_CARRIED === false && CONTROL_CODE === false,
  KP_MOD === undefined ? 'KP_MODULE did not resolve — no reading'
    : `KP positive: carried=${KP_MOD.carried} asCode=${KP_MOD.asCode} · `
      + `control: carried=${CONTROL_CARRIED} asCode=${CONTROL_CODE}`);

// ─── predictions ───────────────────────────────────────────────────────────────────────────────
const HIS_SFN_SET = new Set(HIS_SFN === null ? [] : HIS_SFN);
const RESCUED = READ.filter((r) => HIS_SFN_SET.has(`${MINE408}:${r.line}:${r.ident}`)
  && (typeof r.carried === 'string' || typeof r.asCode === 'string'));

g('P1', 'at least one of his five STANDS-FOR-NOTHING rows has a body that DOES occur — five is '
      + 'an overcount in the unit the cure is spelled in (345)',
  RESCUED.length > 0,
  HIS_SFN === null ? 'his member list did not parse — this prediction is UNREADABLE'
    : `his stands-for-nothing ${HIS_SFN_SET.size} · of those, ${RESCUED.length} have a body that `
      + `occurs: ${RESCUED.map((r) => r.ident).join(', ') || '(none)'}`);

g('P2', 'KP_MODULE is one of them, under BOTH readings — carried string AND real code',
  KP_MOD !== undefined && typeof KP_MOD.carried === 'string' && typeof KP_MOD.asCode === 'string',
  KP_MOD === undefined ? 'unresolved'
    : `carried at ${KP_MOD.carried} · as code at ${KP_MOD.asCode}`);

const KP_FRAG = READ.find((r) => r.ident === 'KP_FRAGMENT');
g('P3', 'KP_FRAGMENT stands for nothing under every key, and that is correct by design',
  KP_FRAG !== undefined && KP_FRAG.carried === false
    && (KP_FRAG.asCode === false || KP_FRAG.asCode === 'UNDECODABLE'),
  KP_FRAG === undefined ? 'unresolved'
    : `carried=${KP_FRAG.carried} · asCode=${KP_FRAG.asCode}`);

const MSG_ROW = ROWS.find((r) => r.path === MINE408 && r.line === 416);
g('P4', 'KP_MESSAGE is classified OTHER-DERIVED, not UNMODELLED — so it is outside BOTH ends of '
      + 'his [21, 23] rather than inside the ceiling',
  MSG_ROW !== undefined && MSG_ROW.stratum === 'OTHER-DERIVED',
  MSG_ROW === undefined ? 'no row at round408:416 at all'
    : `stratum ${MSG_ROW.stratum} · inClass ${MSG_ROW.inClass} · initCode ${JSON.stringify(MSG_ROW.initCode)}`);

const WRAPPED = WITHOUT_HIS.filter((r) => r.slicer && WRAPPED_CALL.test(r.initCode));
g('P5', 'the wrapped-reader-call class is non-empty corpus-wide, and at most 3',
  WRAPPED.length > 0 && WRAPPED.length <= 3,
  `${WRAPPED.length} wrapped reader call(s) in slicing files: `
  + WRAPPED.map((r) => `${r.path.split('/').pop()}:${r.line} ${r.name} [${r.stratum}]`).join(' | '));

// ─── P6: the \u / \x residual my own 408 §6 named and 409 lists as still mine ──────────────────
// Keyed on String.raw fixtures only: that is the spelling whose whole purpose is "these bytes,
// verbatim", so an escape the reader cannot model is a defect there in a way it is not in
// ordinary cooked code. Counted per SITE, and the member lists are printed, not just the counts.
const RAW_FIXTURE = /String\.raw`([^`]*)`/g;
const rawU = [], rawX = [];
for (const [p, src] of SOURCES) {
  if (p === HIS) continue;
  const lines = src.split('\n');
  for (let n = 0; n < lines.length; n++) {
    RAW_FIXTURE.lastIndex = 0;
    let m;
    while ((m = RAW_FIXTURE.exec(lines[n])) !== null) {
      if (/\\u/.test(m[1])) rawU.push(`${p.split('/').pop()}:${n + 1}`);
      if (/\\x/.test(m[1])) rawX.push(`${p.split('/').pop()}:${n + 1}`);
    }
  }
}
g('P6', 'the \\u/\\x residual censused over String.raw fixtures: zero surviving typed \\u, '
      + 'because the write path eats it, and a non-zero typed \\x, which survives',
  rawU.length === 0 && rawX.length > 0,
  `typed \\u in a String.raw fixture: ${rawU.length}${rawU.length === 0 ? '' : ` [${rawU.join(' ')}]`}`
  + ` · typed \\x: ${rawX.length}${rawX.length === 0 ? '' : ` [${rawX.slice(0, 6).join(' ')}]`}`);

// ─── P7: the hand read of KP_MESSAGE, GRADED (350 — the key grades the hand reading) ──────────
// KP_MESSAGE is invisible to BOTH automated keys: his stratum() files it under OTHER-DERIVED, and
// my body reader cannot reach an argument that is not on the declaration line. A population of
// one is a hand read, so the citation is hand-read and this leg grades it: the cited line must
// still carry the cited text, or the row refuses instead of standing on a stale reading.
const MSG_SITE = { path: 'scripts/probe-import-large-session.mts', line: 391 };
const MSG_WANT = 'import succeeded (';
const msgSrc = SRC_OF.get(MSG_SITE.path);
const msgLine = msgSrc === undefined ? null : (msgSrc.split('\n')[MSG_SITE.line - 1] ?? null);
g('P7', 'KP_MESSAGE is a SITE-KP after all — hand-read to probe-import-large-session.mts:391, '
      + 'and this leg grades the citation against the live line rather than restating it',
  msgLine !== null && msgLine.includes(MSG_WANT)
    && msgLine.includes('subject.lines.toLocaleString()'),
  msgLine === null ? `cited line does not exist — citation REFUSED`
    : `cited line carries the text: ${msgLine.trim().slice(0, 96)}`);

// ─── report ────────────────────────────────────────────────────────────────────────────────────
const rev = git(['rev-parse', '--short', 'HEAD']).trim();
const porcelain = git(['status', '--porcelain']).trim();
console.log(`\nRound 410 — the wrapped call and the body granularity, at ${rev}`);
console.log(`  worktree ${porcelain === '' ? 'CLEAN' : `DIRTY (${porcelain.split('\n').length} path(s))`}`
  + ` · corpus ${CORPUS.length} file(s) · ${ROWS.length} declaration(s) WITH his file\n`);
for (const [leg, claim] of EXPECTED) console.log(`  EXPECTED ${leg}  ${claim}`);
console.log('');
for (const r of GRADES) {
  console.log(`  ${r.ok ? 'TRUE ' : 'FALSE'} ${r.leg}  [${r.gate ? 'GATE' : 'PRED'}] ${r.claim}`);
  console.log(`        ${r.detail}`);
}

const gateOk = GRADES.filter((r) => r.gate).every((r) => r.ok === true);
const preds = GRADES.filter((r) => !r.gate);
console.log(`\nGATE: ${gateOk}   (${GRADES.filter((r) => r.gate).length} leg(s) on the key itself)`);
console.log(`PREDICTIONS: ${preds.filter((r) => r.ok).length} landed, `
  + `${preds.filter((r) => !r.ok).length} REFUTED`
  + (preds.some((r) => !r.ok) ? `: ${preds.filter((r) => !r.ok).map((r) => r.leg).join(' | ')}` : ''));

if (gateOk !== true) {
  console.log('\n  !! GATE RED — no figure below. 356: a printed self-test that gates nothing is');
  console.log('     not a self-test, and the figure is what a reader takes away.');
  process.exit(1);
}

console.log('\n── my eight, at BOTH granularities ──\n');
console.log('  KP             his line-key    body: carried      body: as code');
for (const r of READ) {
  const his = HIS_SFN_SET.has(`${MINE408}:${r.line}:${r.ident}`) ? 'STANDS-FOR-NOTHING'
    : (ROWS.find((x) => x.path === MINE408 && x.line === r.line)?.lineOccurs === 'UNMODELLED-OCCURS'
        ? 'refused' : 'faithful');
  const short = (v) => v === false ? 'no' : (v === null ? '(empty)' : String(v).split('/').pop().slice(0, 34));
  console.log(`  ${r.ident.padEnd(14)} ${his.padEnd(15)} ${short(r.carried).padEnd(18)} ${short(r.asCode)}`);
}
for (const r of BODY.filter((b) => b.body === null)) {
  console.log(`  ${r.ident.padEnd(14)} NO BODY READ — ${r.note ?? 'unresolved'}`);
}
console.log(`\n  his five stands-for-nothing, re-read at body granularity: `
  + `${RESCUED.length} stand for something, ${HIS_SFN_SET.size - RESCUED.length} genuinely for nothing\n`);
