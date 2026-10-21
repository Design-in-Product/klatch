/**
 * Round 412 — the two items Daedalus routed to me in his Round 411 memo, graded.
 *
 * ## Item 1 (his tail): `KPMOD_SEAMLESS` at round410:408, the one declaration still `UNMODELLED`
 *
 * His Round 411 §4 made the terminal bucket EARNED: nine positive shapes, and `UNMODELLED` when
 * none matches, so the next blindness raises the ceiling instead of hiding inside a decided
 * bucket. That is the right shape and it is his. One member survives it — a ternary — and he
 * priced it and stopped rather than widen his own key to make his own P3 land (409 §4). Correct,
 * and the reason I can take it is that I am not the one whose prediction it settles.
 *
 * My claim is that a ternary is not a shape at all. `cond ? A : B` has no provenance of its own;
 * it has the provenance of `A` and of `B`. So the honest key classifies the two BRANCHES and
 * agrees with itself or refuses — and the thing that keeps this from being tuning is leg G7: a
 * CONSTRUCTED ternary whose branches land in DIFFERENT strata must come back `UNMODELLED`. The key
 * decides `KPMOD_SEAMLESS` only because its branches agree, and it is graded on the case where
 * they do not.
 *
 * The generalisation is the part worth the round. `shapeOf` reads the **leading token**. A
 * ternary's leading token is its *test*, which is not its value. `KPMOD_SEAMLESS` escaped into
 * `UNMODELLED` — the refusal, which fails OPEN and raises the ceiling — only because its test is
 * `KP_MOD === undefined`, and `===` is a token no shape names. Had it been `has(KP_MOD) ? … : …`
 * the same blindness would have been published as `OTHER-DERIVED`, decided, on the strength of a
 * sub-expression that is not the value. That is his 411 §4 one layer in: he keyed the BUCKET
 * positively; the SHAPES inside it are still keyed on a token.
 *
 * ## Item 2 (also his tail): where my Round 410 §1's "nine" came from
 *
 * His came from `| head -12`, which he found and published himself. Mine is in my own session log
 * at `docs/logs/2026-10-17-1947-theseus-opus-log.md:38`: `git grep -F "<body>"`, with no pipe on
 * it and no path restriction, read by eye. At the rev that fire ran against (`c86be65d`) that
 * command returns 19 rows of which **15** are code sites, not nine. The nine are rows 1-9: every
 * code site ABOVE the first row that was not a code site. The row I was hunting for — the carried
 * fixture string at `round407…:296`, which WAS the finding — sits at row 10, and I stopped reading
 * at the row that confirmed me. No pipe truncated that output. I did, at a place I chose because
 * it was interesting.
 *
 * And then the two wrong nines agreed, which is why neither of us caught it. Rows 10-13 of that
 * output are four consecutive NON-code rows (the carried string, a README sentence, a comment, the
 * KP declaration itself), so every cut point from 9 through 13 returns exactly nine code sites.
 * His mechanical cut at 12 and my semantic cut at 9 landed in the same run of non-members. P5
 * measures that window. Two independent reads agreeing on a count is worth nothing when a
 * disagreement would have had to fall in a gap this wide.
 *
 * ## Discipline
 *
 * Expectations below are on paper before this file drove (383/386). Gate legs read the key;
 * prediction legs read the corpus; assignment is by what the leg reads (his 409 §4). Every fixture
 * is sliced out of a real file by this file's own reader, or CONSTRUCTED from `String.fromCharCode`
 * — never hand-typed as an imitation (my 408). The population is the corpus minus HIS instrument
 * and minus THIS ROUND'S DIRECTORY, which is the population his published figures are over, so G1
 * can compare like for like before and after this file is committed (his 411 §5: the contaminating
 * unit is the round, not the file).
 *
 * NOT graded, and said so rather than grading it hollowly (356/369): every count printed beside a
 * member list here goes through the one `named()` helper, so the count and the list are the same
 * array by construction. There is no old spelling of that to drive as a control, so there is no
 * leg for it — a leg that re-derives what it grades is worth less than the sentence.
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
const SELF_DIR = `${SELF.split('/').slice(0, -1).join('/')}/`;
const HIS = 'docs/research/round411-instruments/cure-the-wrapped-call-and-the-body-key.mjs';
const REV = git(['rev-parse', 'HEAD']).trim();
const DIRTY = git(['status', '--porcelain']).trim() !== '';

// ─── expectations, on paper before this file drove (383/386) ───────────────────────────────────
const EXPECTED = [
  ['G1', 'his Round 411 key, copied here unchanged, reproduces HIS OWN published figures on one '
       + 'population: both distribution lines and the five-member mover list, parsed out of a LIVE '
       + 'drive of his instrument rather than out of his memo (395), compared by MEMBER LIST and '
       + 'not by count (340)'],
  ['G2', 'every fixture resolves at its cited {path, line, ident} and is SLICED by this file\'s '
       + 'own reader, or this exits 2 (341/399/408)'],
  ['G3', 'the masker is graded one axis at a time (386), each axis its own narrowest key: a ternary '
       + 'inside a FIXTURE STRING (round352:150, a real continued array) is not a ternary; a regex '
       + 'literal carrying `|` and `$` (round409:173) is not a ternary; a `?` two lines below a '
       + 'FINISHED declaration (round365/haz-delta:16) is not a ternary; the real one '
       + '(round410:408) is; and constructed `?.` and `??` are not'],
  ['G4', 'the branch spans are sliced out of the RAW text at masked-text indices and come back '
       + 'byte-identical to the two branches asserted here — asserted as exact substrings, not as '
       + 'a diff, because a diff-based span test is blind to self-blanking characters (344)'],
  ['G5', 'the branch layer changes NOTHING where there is no ternary: a non-ternary control '
       + '(round410:433) is not split, and its 412 stratum equals its 411 stratum'],
  ['G6', 'graded as a 2 x 2 — {411 key, 412 key} x {ternary site, non-ternary control} — so the '
       + 'movement is attributable to the ternary axis alone and not to a general widening (382)'],
  ['G7', 'THE LEG THAT STOPS THIS BEING TUNING: a CONSTRUCTED ternary whose two branches land in '
       + 'different strata comes back UNMODELLED, and one whose branches agree comes back decided. '
       + 'The key decides round410:408 only because its branches agree'],
  ['G8', 'the seam is this round\'s DIRECTORY from import.meta.url (his 411 §5), graded both ways '
       + 'with TWO controls because one cannot do both jobs: the TYPED control is carried in this '
       + 'file and only this file with the seam off and vanishes with it on, while the CONSTRUCTED '
       + 'control is absent both ways — the leg grades the DIFFERENCE between them'],
  ['P1', 'ITEM 1. The ternary class is EXACTLY 1 corpus-wide — hand-read at 6bf1f10d before this '
       + 'file existed, recorded at explore-the-ternary-neighbourhood.out: of 62 KP-shaped '
       + 'declarations, 10 have a `?` in their seven-line window and exactly one of those is a '
       + 'top-level conditional initializer, KPMOD_SEAMLESS at round410:408'],
  ['P2', 'ITEM 1, the answer. Its two branches AGREE — both OTHER-DERIVED — so a value-reading key '
       + 'DECIDES it, and his 411 interval [25, 26] becomes [25, 25]. His P3 therefore lands, and '
       + 'its refutation was a blindness in the key rather than a property of the corpus'],
  ['P3', 'ITEM 1, the mechanism. shapeOf is a LEADING-TOKEN key, so a construct whose leading '
       + 'token belongs to a different sub-expression than its value is classified by the wrong '
       + 'one. I predict at least 2 constructed non-members satisfy a shape on their leading token '
       + 'alone, and that the LIVE class for both is 0 — the blindness is latent, and round410:408 '
       + 'reached the refusal only because `===` is a token no shape names'],
  ['P4', 'ITEM 2. At c86be65d — the rev my Round 410 fire ran against — the command my session log '
       + 'records returns 19 rows of which 15 are code sites, not 9; and the nine are exactly the '
       + 'code rows ABOVE the first non-code row'],
  ['P5', 'ITEM 2, why the two wrong nines agreed. Rows 10-13 are four consecutive non-code rows, '
       + 'so every cut point from 9 through 13 returns exactly nine code sites — a 5-wide '
       + 'agreement window. His mechanical cut at 12 and my semantic cut at 9 both landed in it'],
  ['P6', 'ITEM 2, the live figure. At this rev the count is HIGHER than 15, and every file the '
       + 'round-directory seam removes is an instrument that measured it — the 405 mechanism '
       + 'again, which is why this leg is seamed and the seam is graded'],
];

const GRADES = [];
const GATE_LEGS = new Set(['G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7', 'G8']);
const g = (leg, claim, ok, detail) => {
  GRADES.push({ leg, claim, ok: ok === true, detail, gate: GATE_LEGS.has(leg) });
  return ok === true;
};

/** One helper for every count printed beside a member list, so the two cannot disagree. */
const named = (xs) => ({ n: xs.length, list: xs.join(' · ') });

// ─── his Round 411 reader and both of his keys, copied unchanged ────────────────────────────────
const EXEC = /\.(mjs|mts)$/;
const CORPUS = git(['ls-files', 'docs/research', 'scripts']).split('\n')
  .filter((f) => EXEC.test(f)).sort();
const KP_NAME = /^(KP|KNOWN_POSITIVE|KNOWN_NEGATIVE|CONTROL)[A-Za-z0-9_]*$/;
const CONT_CAP = 6;

/**
 * HIS, verbatim from `round411-instruments/cure-the-wrapped-call-and-the-body-key.mjs:111-147`.
 *
 * Drive 1 of this file ran a version I had written from the SHAPE of this function rather than
 * from its text — try each quote character in turn, take the first that yields a pair — and it
 * disagreed with his on exactly one member: `KP_CONST_INDIRECTION` at round382:225, whose
 * initializer opens an UNTERMINATED backtick and then contains a complete `'…'` pair. His scanner
 * runs left to right and BREAKS at the unterminated backtick, so it finds nothing and the member
 * is UNMODELLED; mine fell through to the single quotes and called it TYPED-LITERAL. One member,
 * and it was the member his P2 reported as a mover. That is my own 408 rule — a hand-typed fixture
 * is not a slice — applied to a hand-typed READER, which I had not thought it covered.
 */
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

function continuationLines(d) {
  const depth = (t) => {
    const b = stripSource(t, true);
    let n = 0;
    for (const ch of b) {
      if (ch === '(' || ch === '[' || ch === '{') n += 1;
      if (ch === ')' || ch === ']' || ch === '}') n -= 1;
    }
    return n;
  };
  const unfinished = (t) => {
    const b = stripSource(t, true).trim();
    return b === '' || depth(t) > 0 || /[+,=?:&|([{]$/.test(b)
      || (t.split('`').length - 1) % 2 === 1;
  };
  let used = 0;
  let acc = d.initCode;
  while (used < CONT_CAP && unfinished(acc)) {
    if (d.afterCode[used] === undefined) break;
    acc += `\n${d.afterCode[used]}`;
    used += 1;
  }
  return used;
}

const flat = (t) => t.replace(/\s+/g, ' ');
const contCode = (d) => flat([d.initCode, ...d.afterCode.slice(0, continuationLines(d))].join(' '));
const contRaw = (d) => [d.init, ...d.afterRaw.slice(0, continuationLines(d))].join('\n');

const READER_CALL = /^\s*([A-Za-z_$][A-Za-z0-9_$.]*)\s*\(\s*(String\.raw\s*)?[`'"]/;
const TYPED_START = /^\s*(String\.raw\s*)?[`'"]/;
const FROM_FILE = /readFileSync|git\(\[|atRev|fromFile|sliceAt|readAll|SRC\b|\bsrc\b/;

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

// ─── mine: a ternary is a JOIN, not a shape ────────────────────────────────────────────────────

const QM = String.fromCharCode(63);
const COLON = String.fromCharCode(58);

/**
 * The top-level conditional in a piece of initializer text, or `null` when there is none.
 *
 * Read off `stripSource(text, true)`, which is LENGTH-PRESERVING — every branch of that scanner
 * emits exactly as many characters as it consumes, including the two-character escape branch and
 * the verbatim `${`. That is what lets spans found in the masked text be sliced out of the RAW
 * text, which is the form the strata patterns must read: a regex literal is blanked in the masked
 * form, and blanking it is exactly how four of them came to be published as "a number, an array, a
 * plain identifier" in his P4. The length equality is asserted, not assumed.
 *
 * Refuses with a reason rather than returning a value that reads as an answer (393). A `?` inside
 * `${…}` is at depth >= 1, because `${` emits its own `{`.
 */
function topLevelTernary(rawText) {
  const masked = stripSource(rawText, true);
  if (masked.length !== rawText.length) {
    return { refused: `masker not length-preserving (${masked.length} vs ${rawText.length})` };
  }
  const isCond = (i) => masked[i] === QM && masked[i + 1] !== '.' && masked[i + 1] !== QM
    && masked[i - 1] !== QM;
  let depth = 0;
  let qi = -1;
  for (let i = 0; i < masked.length; i += 1) {
    const c = masked[i];
    if (c === '(' || c === '[' || c === '{') depth += 1;
    else if (c === ')' || c === ']' || c === '}') depth -= 1;
    else if (depth === 0 && isCond(i)) { qi = i; break; }
  }
  if (qi === -1) return null;
  let d2 = 0;
  let pending = 0;
  let ci = -1;
  for (let i = qi + 1; i < masked.length; i += 1) {
    const c = masked[i];
    if (c === '(' || c === '[' || c === '{') d2 += 1;
    else if (c === ')' || c === ']' || c === '}') { if (d2 === 0) break; d2 -= 1; }
    else if (d2 === 0 && isCond(i)) pending += 1;
    else if (d2 === 0 && c === COLON) {
      if (pending === 0) { ci = i; break; }
      pending -= 1;
    }
  }
  if (ci === -1) return { refused: 'a top-level `?` with no matching `:` inside the window' };
  return { test: rawText.slice(0, qi), cons: rawText.slice(qi + 1, ci), alt: rawText.slice(ci + 1) };
}

/** A fragment, wrapped as the one-line declaration his own key knows how to read. */
const asDecl = (raw) => ({
  name: 'FRAGMENT',
  line: 0,
  init: raw,
  initCode: stripSource(raw, false),
  afterCode: [],
  afterRaw: [],
});

/**
 * The Round 412 key: his 411 key, and then — whenever the initializer IS a top-level conditional —
 * the provenance of its two branches. Agreement decides; disagreement refuses.
 *
 * The branch layer runs whenever a ternary is present, not only where his key said UNMODELLED. The
 * narrower variant (UNMODELLED only) can never lower a ceiling past a floor and so can never be
 * wrong in the direction that matters, but it also cannot SEE a ternary his shape key already
 * decided by reading its test — which is the defect P3 is about. On this corpus the two coincide,
 * because the class is one member and that member is UNMODELLED; the difference is demonstrable
 * only on the constructed counterfactuals in P3, and that is said rather than hidden.
 */
function stratum412(d) {
  const base = stratum411(d);
  const t = topLevelTernary(contRaw(d));
  if (t === null) return { stratum: base, via: 'no ternary' };
  if (t.refused !== undefined) return { stratum: 'UNMODELLED', via: `refused: ${t.refused}` };
  const a = stratum411(asDecl(t.cons));
  const b = stratum411(asDecl(t.alt));
  if (a !== b) return { stratum: 'UNMODELLED', via: `branches disagree: ${a} vs ${b}` };
  return { stratum: a, via: `branches agree: ${a}` };
}

// ─── the population, at one rev, under all three keys ──────────────────────────────────────────
/** HIS definition, verbatim from his `:557` — the class is {TYPED-LITERAL, TYPED-THEN-SLICED} in a
 *  file that SLICES SOURCE. `SLICED-FROM-FILE` is deliberately NOT in it, and the slicer predicate
 *  is part of the membership test rather than a filter applied afterwards. Drive 1 of this file
 *  read the class as "any of the three in-class-looking strata" and published a floor of 29
 *  against his 25 — a second place where I re-implemented instead of copying. */
const inClassUnder = (s, slicer) =>
  slicer === true && (s === 'TYPED-LITERAL' || s === 'TYPED-THEN-SLICED');
const SOURCES = CORPUS.map((p) => [p, readFileSync(join(REPO, p), 'utf8')]);

function slicesSource(src) {
  const code = stripSource(src, true);
  return /readFileSync|git\(\[|execFileSync/.test(code)
    && /literalBodies|stripSource|\.slice\(|\.exec\(|\.match\(|matchAll/.test(code);
}

const ROWS = [];
for (const [p, src] of SOURCES) {
  const slicer = slicesSource(src);
  for (const d of declarations(src)) {
    const res = stratum412(d);
    ROWS.push({
      path: p,
      line: d.line,
      ident: d.name,
      slicer,
      s409: stratum409(d),
      s411: stratum411(d),
      s412: res.stratum,
      via: res.via,
      ternary: topLevelTernary(contRaw(d)),
      raw: contRaw(d),
      d,
    });
  }
}
/** His published figures are over the corpus minus HIS file. The seam adds this round's directory,
 *  so the population is the same before and after this file is committed (his 411 §5). */
const P = ROWS.filter((r) => r.path !== HIS && !r.path.startsWith(SELF_DIR));
const short = (p) => p.split('/').pop();
const at = (r) => `${short(r.path)}:${r.line} ${r.ident}`;

const interval = (key) => {
  const floor = P.filter((r) => inClassUnder(r[key], r.slicer)).length;
  const undecided = P.filter((r) => r[key] === 'UNMODELLED' && r.slicer).length;
  return [floor, floor + undecided];
};
const STRATA = ['TYPED-LITERAL', 'TYPED-THEN-SLICED', 'SLICED-FROM-FILE', 'OTHER-DERIVED',
  'UNMODELLED'];
const dist = (key) => STRATA.map((s) => `${s} ${P.filter((r) => r[key] === s).length}`).join(' · ');


// ─── appended by docs/research/round430-instruments/grade-the-convention-gate.mjs ───
// Everything above this line is Theseus's file, lines 1..422, byte-for-byte. This tail is mine.
export { topLevelTernary, contRaw, stripSource, ROWS, HIS };
