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

// ─── G1 — his own figures, parsed out of a live drive of HIS instrument (395) ───────────────────
const hisText = readFileSync(join(REPO, SELF_DIR, 'his411-driven-live.out'), 'utf8');
const hisLine = (tag) => {
  const m = hisText.match(new RegExp(`^\\s*${tag} key: (.+)$`, 'm'));
  return m === null ? null : m[1].trim();
};
const hisMovers = (() => {
  const m = hisText.match(/^\s*FALSE P2 .+\n\s+\d+ mover\(s\),[^·]+· (.+)$/m);
  if (m === null) return null;
  return m[1].split(' | ').map((s) => s.trim().split(' ').pop()).sort();
})();
const myMovers = P.filter((r) => r.s409 !== r.s411).map((r) => r.ident).sort();
const his409 = hisLine('409');
const his411 = hisLine('411');
const onlyHis = hisMovers === null ? null : hisMovers.filter((x) => !myMovers.includes(x));
const onlyMine = hisMovers === null ? null : myMovers.filter((x) => !hisMovers.includes(x));
g('G1', 'his 411 key copied here reproduces his own published distributions and his mover MEMBER '
  + 'LIST, both parsed out of a live drive of his instrument',
  his409 !== null && his411 !== null && hisMovers !== null
    && his409 === dist('s409') && his411 === dist('s411')
    && onlyHis.length === 0 && onlyMine.length === 0,
  his409 === null || his411 === null || hisMovers === null
    ? 'REFUSED: could not parse his figures out of his live drive — the leg grades nothing and is '
      + 'red, rather than passing on a sentinel (393)'
    : `409 line reproduces ${his409 === dist('s409')} · 411 line reproduces `
      + `${his411 === dist('s411')} · movers ${named(myMovers).n} [${named(myMovers).list}] · `
      + `only-his [${onlyHis.join(' ')}] · only-mine [${onlyMine.join(' ')}] · |P| ${P.length}`);

// ─── G2 — every fixture SLICED at its cited site, or exit 2 (341/399/408) ──────────────────────
const R410 = 'docs/research/round410-instruments/census-the-wrapped-call-and-the-body-granularity.mjs';
const SITES = {
  TERNARY: { path: R410, line: 408, ident: 'KPMOD_SEAMLESS' },
  NOT_TERNARY: { path: R410, line: 433, ident: 'KP_FRAG' },
  IN_STRING: { path: 'docs/research/round352-valuation-leg-key.mjs', line: 150, ident: 'KP' },
  REGEXY: {
    path: 'docs/research/round409-instruments/census-the-hand-typed-known-positive.mjs',
    line: 173,
    ident: 'KP_NAME',
  },
  FINISHED: { path: 'docs/research/round365-instruments/haz-delta.mts', line: 16, ident: 'KP' },
};
const KPS = {};
for (const [k, s] of Object.entries(SITES)) {
  const d = declarations(readFileSync(join(REPO, s.path), 'utf8'))
    .find((x) => x.line === s.line && x.name === s.ident);
  KPS[k] = d === undefined ? null : d;
}
const unsliced = Object.entries(KPS).filter(([, v]) => v === null).map(([k]) => k);
g('G2', 'every cited fixture resolved at its {path, line, ident} and was sliced by this reader',
  unsliced.length === 0,
  `${named(Object.keys(KPS)).n} fixture(s) cited · unsliced [${unsliced.join(' ')}]`);

function report() {
  console.log(`Round 412 — the ternary is a join, and my nine was a semantic truncation, `
    + `at ${REV}\n`);
  for (const [leg, claim] of EXPECTED) console.log(`  EXPECTED ${leg}  ${claim}`);
  console.log('');
  for (const r of GRADES) {
    console.log(`  ${r.ok ? 'TRUE ' : 'FALSE'} ${r.leg}  [${r.gate ? 'GATE' : 'PRED'}] ${r.claim}`);
    console.log(`        ${r.detail}`);
  }
  const gateLegs = GRADES.filter((r) => r.gate);
  const ok = gateLegs.length > 0 && gateLegs.every((r) => r.ok);
  const preds = GRADES.filter((r) => !r.gate);
  const failed = preds.filter((r) => !r.ok).map((r) => r.leg);
  console.log(`\nGATE: ${ok}   (${gateLegs.length} leg(s) on the key itself)`);
  console.log(`PREDICTIONS: ${preds.length - failed.length} landed`
    + `${failed.length > 0 ? `, ${failed.length} REFUTED: ${failed.join(' | ')}` : ''}`);
  console.log('\n  !! A REFUTED PREDICTION IS THE ROUND\'S CONTENT, NOT ITS FAILURE (383). Gate '
    + 'legs read\n     the key; prediction legs read the corpus (his 409 §4).');
  return ok;
}

if (unsliced.length > 0) {
  report();
  console.error(`\nREFUSED: fixture(s) did not slice: ${unsliced.join(' ')} — a fixture that does `
    + 'not resolve cannot grade its neighbour (341/399)');
  process.exit(2);
}

// ─── G3 — the masker, one axis at a time, each by its own narrowest key (386) ──────────────────
const CONSTRUCTED_OPTIONAL = `a${QM}.b`;
const CONSTRUCTED_NULLISH = `a ${QM}${QM} b`;
const axes = [
  ['IN-STRING  round352:150, a real continued array of fixture strings carrying two ternaries',
    contRaw(KPS.IN_STRING), false],
  ['REGEX      round409:173, a regex literal carrying | and $', contRaw(KPS.REGEXY), false],
  ['FINISHED   round365/haz-delta:16, a finished declaration with a `?` two lines below',
    contRaw(KPS.FINISHED), false],
  ['TERNARY    round410:408, the real one', contRaw(KPS.TERNARY), true],
  ['CONSTRUCTED optional chaining', CONSTRUCTED_OPTIONAL, false],
  ['CONSTRUCTED nullish coalescing', CONSTRUCTED_NULLISH, false],
];
const axisRows = axes.map(([label, text, want]) => {
  const t = topLevelTernary(text);
  const got = t !== null && t.refused === undefined;
  return { label, want, got, ok: got === want };
});
g('G3', 'the masker is right on every axis: a ternary in a string, in a regex, below a finished '
  + 'declaration, `?.` and `??` are all NOT ternaries, and the real one IS',
  axisRows.every((r) => r.ok),
  axisRows.map((r) => `${r.ok ? 'ok ' : 'RED'} want=${r.want} got=${r.got}  ${r.label}`)
    .join('\n        '));

// ─── G4 — the branch spans, asserted as exact raw substrings (344) ─────────────────────────────
const tern = topLevelTernary(contRaw(KPS.TERNARY));
const WANT = {
  test: ' KP_MOD === undefined ',
  cons: ' null ',
  alt: ' bodyCarried(KP_MOD.body, MINE408, false);',
};
g('G4', 'the branch spans sliced out of the RAW text are byte-identical to the asserted substrings',
  tern !== null && tern.refused === undefined && tern.test === WANT.test
    && tern.cons === WANT.cons && tern.alt === WANT.alt,
  tern === null || tern.refused !== undefined
    ? `REFUSED: ${tern === null ? 'no ternary found at the cited site' : tern.refused}`
    : `test ${JSON.stringify(tern.test)} · cons ${JSON.stringify(tern.cons)} · `
      + `alt ${JSON.stringify(tern.alt)}`);

// ─── G5 / G6 — the 2 x 2, so the movement is the ternary axis alone (382) ──────────────────────
const cell = (k, which) => (which === 411 ? stratum411(KPS[k]) : stratum412(KPS[k]).stratum);
const grid = {
  T411: cell('TERNARY', 411), T412: cell('TERNARY', 412),
  C411: cell('NOT_TERNARY', 411), C412: cell('NOT_TERNARY', 412),
};
const controlSplit = topLevelTernary(contRaw(KPS.NOT_TERNARY));
g('G5', 'the branch layer changes nothing where there is no ternary',
  controlSplit === null && grid.C411 === grid.C412,
  `control split: ${controlSplit === null ? 'not a ternary' : JSON.stringify(controlSplit)} · `
  + `control @411=${grid.C411} @412=${grid.C412}`);
g('G6', 'the 2 x 2: the ternary cell moves out of UNMODELLED and the control cell does not move',
  grid.T411 === 'UNMODELLED' && grid.T412 !== 'UNMODELLED' && grid.C411 === grid.C412,
  `TERNARY @411=${grid.T411} @412=${grid.T412} · CONTROL @411=${grid.C411} @412=${grid.C412}`);

// ─── G7 — the leg that stops this being tuning ─────────────────────────────────────────────────
// Branches in DIFFERENT strata, constructed character by character so no write path and no corpus
// edit can reach them: the consequent is a typed literal (TYPED-LITERAL), the alternate a bare
// number (OTHER-DERIVED).
const SQ = String.fromCharCode(39);
const DISAGREE = ` cond ${QM} ${SQ}x${SQ} ${COLON} 7;`;
const AGREE = ` cond ${QM} 7 ${COLON} 8;`;
const disagreeRes = stratum412(asDecl(DISAGREE));
const agreeRes = stratum412(asDecl(AGREE));
g('G7', 'a constructed ternary whose branches land in DIFFERENT strata comes back UNMODELLED, and '
  + 'one whose branches agree comes back decided',
  disagreeRes.stratum === 'UNMODELLED' && /branches disagree/.test(disagreeRes.via)
    && agreeRes.stratum !== 'UNMODELLED' && /branches agree/.test(agreeRes.via),
  `DISAGREE ${JSON.stringify(DISAGREE)} -> ${disagreeRes.stratum} (${disagreeRes.via}) · `
  + `AGREE ${JSON.stringify(AGREE)} -> ${agreeRes.stratum} (${agreeRes.via})`);

// ─── G8 — the seam, graded both ways, with TWO controls (his 411 §5) ───────────────────────────
const BS = String.fromCharCode(92);
const CONTROL_TYPED = 'zz-r412-typed-control-carried-in-exactly-one-corpus-file';
const CONTROL_CONSTRUCTED = `zz-r412-constructed${BS}u0041-no-write-path-can-rewrite-this`;
/** Which corpus files CARRY this string anywhere in their text? Seam = this round's directory. */
const carriedIn = (needle, seam) => SOURCES
  .filter(([p, src]) => (!seam || !p.startsWith(SELF_DIR)) && src.includes(needle))
  .map(([p]) => p);
const typedSeamOff = carriedIn(CONTROL_TYPED, false);
const typedSeamOn = carriedIn(CONTROL_TYPED, true);
const constrSeamOff = carriedIn(CONTROL_CONSTRUCTED, false);
const SELF_TRACKED = git(['ls-files', '--', SELF]).trim() !== '';
g('G8', 'the seam does exactly one thing, and the leg grades the DIFFERENCE between a TYPED '
  + 'control and a CONSTRUCTED one — one control cannot do both jobs',
  (SELF_TRACKED
    ? typedSeamOff.length === 1 && typedSeamOff[0] === SELF
    : typedSeamOff.length === 0)
  && typedSeamOn.length === 0 && constrSeamOff.length === 0,
  `self tracked ${SELF_TRACKED} · TYPED control seam OFF [${typedSeamOff.join(' ')}] seam ON `
  + `${typedSeamOn.length} · CONSTRUCTED control seam OFF ${constrSeamOff.length} (absent from `
  + 'its own source by construction, so it cannot grade a seam at all)');

// ─── P1 / P2 / P3 — the ternary class, the interval, and the leading-token mechanism ───────────
const ternaries = P.filter((r) => r.ternary !== null && r.ternary.refused === undefined);
const refusedTern = P.filter((r) => r.ternary !== null && r.ternary.refused !== undefined);
g('P1', 'the ternary class is exactly 1 corpus-wide and it is KPMOD_SEAMLESS at round410:408',
  ternaries.length === 1 && ternaries[0].ident === 'KPMOD_SEAMLESS' && ternaries[0].line === 408,
  `${named(ternaries.map(at)).n} member(s): ${named(ternaries.map(at)).list} · `
  + `${refusedTern.length} refused · out of ${P.length} declaration(s) in the population`);

const i411 = interval('s411');
const i412 = interval('s412');
g('P2', 'the branches agree, a value-reading key decides it, and his [25, 26] becomes [25, 25] — '
  + 'so his P3 lands and its refutation was a key blindness, not a corpus property',
  i411[0] === 25 && i411[1] === 26 && i412[0] === 25 && i412[1] === 25
    && ternaries.length === 1 && ternaries[0].via === 'branches agree: OTHER-DERIVED',
  `411 [${i411.join(', ')}] · 412 [${i412.join(', ')}] · KPMOD_SEAMLESS via `
  + `"${ternaries.length === 1 ? ternaries[0].via : 'NO SINGLE MEMBER — leg cannot speak'}"`);

const LT = [
  ['a parenthesised expression is not a function', ' (a || b).c;', 'FUNCTION'],
  ['a ternary whose test is a call is not a call', ` f(x) ${QM} null ${COLON} g();`,
    'CALL-OR-IDENT'],
];
const ltRows = LT.map(([label, raw, want]) => ({ label, raw, want, got: shapeOf(raw.trim()) }));
const ltHits = ltRows.filter((r) => r.got === r.want);
const liveParen = P.filter((r) => /^\(/.test(r.raw.trim()));
const liveCallTernary = ternaries.filter((r) => shapeOf(r.raw.trim()) !== null);
g('P3', 'shapeOf is a leading-token key: at least 2 constructed non-members satisfy a shape on '
  + 'their leading token alone, and the live class for both is 0',
  ltHits.length >= 2 && liveParen.length === 0 && liveCallTernary.length === 0,
  ltRows.map((r) => `${r.got === r.want ? 'hit ' : 'miss'} shapeOf(${JSON.stringify(r.raw)}) = `
    + `${r.got}, wanted ${r.want} — ${r.label}`).join('\n        ')
  + `\n        live: parenthesised initializers ${liveParen.length} · ternaries already DECIDED `
  + `by their own test ${liveCallTernary.length}`);

// ─── item 2: the rev my 410 fire ran against, and the agreement window ─────────────────────────
const KP_MODULE_BODY = (() => {
  const r408 = 'docs/research/round408-instruments/stratify-the-live-interval.mjs';
  const d = declarations(readFileSync(join(REPO, r408), 'utf8'))
    .find((x) => x.name === 'KP_MODULE');
  if (d === undefined) return null;
  const tl = d.init.slice(d.init.indexOf('`') + 1, d.init.lastIndexOf('`'));
  const ls = literalBodies(tl);
  return ls.length > 0 ? ls[0].body : null;
})();
if (KP_MODULE_BODY === null) {
  report();
  console.error('\nREFUSED: could not slice KP_MODULE\'s body out of round408 — item 2 cannot run');
  process.exit(2);
}

const BASE_REV = 'c86be65d';
const parsed = git(['grep', '-F', KP_MODULE_BODY, BASE_REV]).split('\n')
  .filter((l) => l !== '')
  .map((l) => {
    const body = l.slice(`${BASE_REV}:`.length);
    const i = body.indexOf(':');
    const text = body.slice(i + 1);
    return { path: body.slice(0, i), text, code: text.trim() === KP_MODULE_BODY };
  });
const codeRows = parsed.filter((r) => r.code);
const firstNonCode = parsed.findIndex((r) => !r.code);
const codeAbove = parsed.slice(0, firstNonCode).filter((r) => r.code).length;
g('P4', `at ${BASE_REV} the command my session log records returns 19 rows of which 15 are code `
  + 'sites, and the nine are exactly the code rows above the first non-code row',
  parsed.length === 19 && codeRows.length === 15 && codeAbove === 9,
  `rows ${parsed.length} · code sites ${named(codeRows.map((r) => short(r.path))).n} · first `
  + `non-code row is #${firstNonCode + 1} (${parsed[firstNonCode]?.path}) · code rows above it `
  + `${codeAbove}`);

const curveOf = (rows) => rows.map((_, i) => rows.slice(0, i + 1).filter((r) => r.code).length);
const windowOf = (c) => c.map((v, i) => [i + 1, v]).filter(([, v]) => v === 9).map(([n]) => n);
const curve = curveOf(parsed);
const windowFor9 = windowOf(curve);

/**
 * His output is NOT mine. Drive 2 of this file passed P5 on a predicate that read only my own
 * 19-row curve, under a sentence that also claimed something about HIS `head -12` — and his grep
 * ran at a later rev and returned 22 rows, so row 12 of his output is not row 12 of mine. The
 * predicate was right and the sentence beside it was ungraded, which is 380/397 inside the very
 * leg I wrote about counting carefully. So the leg now reads HIS committed grep too, in HIS own
 * row-numbering, and grades both halves of its own sentence.
 */
const hisRowsPath = 'docs/research/round411-instruments/handread-the-body-sites.out';
const hisRows = readFileSync(join(REPO, hisRowsPath), 'utf8').split('\n')
  .filter((l) => l !== '')
  .map((l) => {
    const i = l.indexOf(':');
    const rest = l.slice(i + 1);
    const j = rest.indexOf(':');
    return { path: l.slice(0, i), text: rest.slice(j + 1) };
  })
  .map((r) => ({ ...r, code: r.text.trim() === KP_MODULE_BODY }));
const hisCurve = curveOf(hisRows);
const hisWindow = windowOf(hisCurve);
const hisAt12 = hisCurve[11];
/**
 * And then drive 3 measured HIS window as [9 10 11 12 13] — identical to mine, over an output with
 * three more rows — so the sentence I had just repaired ("they are NOT the same window") was wrong
 * in the other direction. It IS one window: the two outputs share their first 13 rows verbatim,
 * because everything his grep found and mine did not sorts BELOW the run. Third pass over one
 * sentence, and the predicate was right every time. Now the leg asserts the shared prefix, which
 * is the thing that actually makes the two nines one event rather than two.
 */
const sharedPrefix = hisRows.slice(0, 13).every((r, i) => r.path === parsed[i]?.path);
const runStart = firstNonCode + 1;
const runLength = (() => {
  let n = 0;
  for (let i = firstNonCode; i < parsed.length && !parsed[i].code; i += 1) n += 1;
  return n;
})();
g('P5', 'the two nines are ONE event, not two agreeing reads. Both outputs share their first 13 '
  + 'rows verbatim, rows 10-13 are a run of four consecutive NON-code rows beginning exactly at '
  + 'the carried-string row that was the finding, and every cut from 9 to 13 returns nine — so '
  + 'his mechanical `head -12` and my semantic stop at 9 fell in the same run. Agreement reachable '
  + 'from a 5-wide window of cut points corroborates nothing',
  windowFor9.length === 5 && windowFor9[0] === 9 && windowFor9[windowFor9.length - 1] === 13
    && hisRows.length === 22 && hisAt12 === 9 && hisWindow.includes(12)
    && sharedPrefix && runStart === 10 && runLength === 4,
  `MINE (${parsed.length} rows at ${BASE_REV}): cuts returning 9 [${windowFor9.join(' ')}] · `
  + `HIS (${hisRows.length} rows, ${short(hisRowsPath)}): cut at 12 returns ${hisAt12}, window `
  + `[${hisWindow.join(' ')}] · first 13 rows identical in both: ${sharedPrefix} · the non-code `
  + `run starts at row ${runStart} and is ${runLength} row(s) long`);

const codeFiles = (body, seam) => SOURCES
  .filter(([p, src]) => (!seam || !p.startsWith(SELF_DIR))
    && src.split('\n').some((l) => l.trim() === body))
  .map(([p]) => p);
const liveSeamOn = codeFiles(KP_MODULE_BODY, true);
const liveSeamOff = codeFiles(KP_MODULE_BODY, false);
const removedBySeam = liveSeamOff.filter((p) => !liveSeamOn.includes(p));
g('P6', 'the live count is higher than 15, and every file the round-directory seam removes is an '
  + 'instrument of this round',
  liveSeamOn.length > 15 && removedBySeam.every((p) => p.startsWith(SELF_DIR)),
  `seam ON ${named(liveSeamOn.map(short)).n} · seam OFF ${liveSeamOff.length} · removed by the `
  + `seam [${removedBySeam.join(' ')}]`);

// ─── report ────────────────────────────────────────────────────────────────────────────────────
const gateOk = report();

console.log('\n── the three keys on one population at one rev ──\n');
console.log(`  rev ${REV} · corpus ${CORPUS.length} file(s) · ${P.length} declaration(s) in the `
  + `population (corpus minus his file and minus this round) · worktree `
  + `${DIRTY ? 'DIRTY' : 'clean'}`);
for (const k of ['s409', 's411', 's412']) {
  console.log(`\n  ${k.slice(1)} key: ${dist(k)}`);
  console.log(`          interval [${interval(k).join(', ')}]`);
}

console.log('\n── the ternary class, by member ──\n');
for (const r of ternaries) {
  console.log(`  ${r.path}:${r.line} ${r.ident}`);
  console.log(`        @409 ${r.s409} · @411 ${r.s411} · @412 ${r.s412} — ${r.via}`);
  console.log(`        shapeOf(whole) ${shapeOf(r.raw.trim())}  <- the LEADING TOKEN, i.e. the test`);
  console.log(`        test ${JSON.stringify(r.ternary.test)}`);
  console.log(`        cons ${JSON.stringify(r.ternary.cons)} -> `
    + `${stratum411(asDecl(r.ternary.cons))}`);
  console.log(`        alt  ${JSON.stringify(r.ternary.alt)} -> `
    + `${stratum411(asDecl(r.ternary.alt))}`);
}

console.log(`\n── item 2: the cut-point curve over the ${parsed.length} rows at ${BASE_REV} ──\n`);
parsed.forEach((r, i) => {
  const mark = windowFor9.includes(i + 1) ? ' <- cut here and you get nine' : '';
  console.log(`  ${String(i + 1).padStart(2)} ${r.code ? 'CODE' : '    '} ${String(curve[i])
    .padStart(2)}  ${r.path}${mark}`);
});

if (!gateOk) process.exitCode = 1;
