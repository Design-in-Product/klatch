// Round 455, cell B — W10's disposition, and the lifter defect that his "no victim" verdict
// becomes wrong about once the disposition is made.
//
// Daedalus's Round 454 routed two items to me as judgements about my own leg:
//
//   §6.2  W10's re-aim or retirement.          Blocker: your leg, your claim.
//   §6.3  449's comment-blind regex lift.      Blocker: no current victim, your file.
//
// They are the same item, and this cell is why. W10 REFUSES at HEAD because his 452 re-pointed both
// of the readers it slices at the lib's exported `LEG_TOKENS`/`legRows`, so neither statement
// contains a regex literal and the slicer returns null twice. That much I take from his probe0 and
// reproduce here. But `readable` is not the only conjunct that moved:
//
//   W10's ok = readable && agree448>0 && disagree448>0 && libBy448===0
//              && legDetailPublished && !predDetailPublished && predIdInVerdict
//
// `!predDetailPublished` ASSERTS THE DEFECT IS PRESENT. `renderTail` now calls `renderPredRows`,
// so a prediction's detail IS published — the half of W10 that his own P1 work cured. The leg is
// therefore not merely unreadable: on a tree where the readers were restored it would publish RED,
// on a tree where the defect it names is CURED. A leg that pins a defect inverts when the defect
// is repaired, and refusing for an unrelated reason is currently hiding that.
//
// So the disposition is RE-AIM, not retire: the evidence worth standing is the cure. And a re-aimed
// W10 has to measure "neither reader carries a regex literal any more" — which puts the slicer back
// on the critical path and gives his victimless §6.3 defect a victim. A lifter that can mistake a
// COMMENT for a regex reports a regex present where there is none, which is the cure claim exactly
// inverted. His §6.3 was true at his HEAD and stops being true the moment §6.2 is answered.
//
// Read-only. It drives nothing, writes nothing, and takes every subject through `git show`.

import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { stripSource, regexLiteralEnd } from '../../../scripts/lib/strip-source.mjs';
import { renderTail, renderRows } from '../lib/verdict.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..', '..');

const git = (...args) =>
  execFileSync('git', args, { cwd: REPO, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 * 1024 * 1024 });

const legs = [];
const preds = [];
const oneLine = (s) => String(s).replace(/\s+/g, ' ').trim();
const leg = (id, what, detail, ok) => { legs.push({ id, ok, what: oneLine(`${what} ${detail}`) }); return ok; };

const HEAD = git('rev-parse', 'HEAD').trim();
const F449 = 'docs/research/round449-instruments/resolve-the-variable-write-targets.mjs';
const F446 = 'docs/research/round446-instruments/grade-my-own-oracle-predicate.mjs';
const F448 = 'docs/research/round448-instruments/record-cripples.mjs';
// Both readers were last touched by the SAME commit — his 452 — so one parent rev restores both.
const CURE = '2e23293a';
const PRE = git('rev-parse', `${CURE}^`).trim();

console.log(`HEAD ${HEAD.slice(0, 8)} · pre-cure ${PRE.slice(0, 8)} (= ${CURE}^)`);

const src449 = git('show', `${HEAD}:${F449}`);

// ─── the statement-span slicer, lifted from 449 by string slice ──────────────────────────────────
// Taken by `indexOf`, never by a regex, because the thing being graded here IS regex-lifting and a
// regex-lifted copy of a regex lifter cannot grade itself.
const sliceBetween = (text, open, close) => {
  const i = text.indexOf(open);
  if (i === -1) return null;
  const j = text.indexOf(close, i + open.length);
  if (j === -1) return null;
  return { text: text.slice(i + open.length, j), occurrences: text.split(open).length - 1 };
};

// First pass keyed the slice on `const m = ` over the whole file and G1 went RED: it occurs TWICE
// in 449 (the lifter at 708 and the vocabulary reader at 773), so the slice was ambiguous and the
// gate is the only reason that was visible. Narrowed to the enclosing `const sliceRe = ` statement,
// inside which it occurs once — a scope, not a longer hand-typed anchor.
const sliceReOuter = (() => {
  const i = src449.indexOf('const sliceRe = ');
  if (i === -1) return null;
  const j = src449.indexOf('\n  };', i);
  return j === -1 ? null : src449.slice(i, j);
})();
const oldLift = sliceReOuter === null ? null : sliceBetween(sliceReOuter, 'const m = ', '.exec(stmt);');
let OLD = null;
try { OLD = oldLift === null ? null : new Function(`return ${oldLift.text};`)(); } catch { OLD = null; }
leg('G1', 'the OLD lifter is SLICED out of 449\'s source at HEAD by plain `indexOf`, never by a '
  + 'regex and never retyped — a regex-lifted copy of a regex lifter cannot grade itself, and a '
  + 'hand-typed copy could differ from his file invisibly. Its anchor must occur exactly once '
  + 'INSIDE the enclosing `sliceRe` statement: keyed on the whole file it occurs twice, and this '
  + 'row going red is how that was found',
  `\`const sliceRe = \` occurrences in ${F449.split('/').pop()}: `
  + `${src449.split('const sliceRe = ').length - 1} · \`const m = \` occurrences inside it: `
  + `${oldLift?.occurrences ?? 'NOT FOUND'} (whole file: ${src449.split('const m = ').length - 1}) · `
  + `compiles to a RegExp: ${OLD instanceof RegExp} · source ${JSON.stringify(oldLift?.text ?? null)}`,
  sliceReOuter !== null && src449.split('const sliceRe = ').length - 1 === 1
  && oldLift !== null && oldLift.occurrences === 1 && OLD instanceof RegExp);

// The statement span, as 449 computes it: brace/paren balance to a depth-0 `;` over BLINDED text,
// sliced out of RAW. Reproduced rather than imported, because 449 does not export it.
const stmtSpan = (src, anchor) => {
  const i = src.indexOf(anchor);
  if (i === -1) return null;
  const blind = stripSource(src, true);
  let d = 0;
  let j = i;
  for (; j < blind.length; j += 1) {
    const c = blind[j];
    if ('(['.includes(c) || c === '{') d += 1;
    else if (')]'.includes(c) || c === '}') d -= 1;
    else if (c === ';' && d === 0) break;
  }
  return { raw: src.slice(i, j), at: i, occurrences: src.split(anchor).length - 1 };
};

// ─── the repaired lifter ─────────────────────────────────────────────────────────────────────────
// `stripSource` blanks comments, strings AND regex literals, and it is OFFSET-PRESERVING (verified
// by G2 below rather than assumed). So a maximal run of positions blank in the blinded reading and
// non-blank in the raw one is exactly one stepped-over span, and its FIRST character says which
// kind it is: `/` not followed by `/` or `*` is a regex literal; `//` and `/*` are comments; a
// quote is a string. That is a positive key on the span's kind, where the old lifter's key was
// "the first thing in the raw text that looks like a regex" — which is why two `/` in prose
// compiled for him. Regex FLAGS are not blanked, so they are taken from the raw tail.
const newLift = (raw) => {
  const blind = stripSource(raw, true);
  if (blind.length !== raw.length) return { re: null, text: null, why: 'NOT OFFSET-PRESERVING' };
  let i = 0;
  while (i < raw.length) {
    if (blind[i] === ' ' && raw[i] !== ' ') {
      let end = i;
      while (end < raw.length && blind[end] === ' ' && raw[end] !== ' ') end += 1;
      const head = raw.slice(i, i + 2);
      if (raw[i] === '/' && head !== '//' && head !== '/*') {
        // The END comes from the lib's own `regexLiteralEnd`, not from the end of the blank run.
        // First pass took the blank run and B3 went RED: a regex literal containing a SPACE —
        // `/^(?: ok |RED |REF ) ([A-Z][A-Z0-9]*)  /`, which is precisely the pre-cure 448 reader —
        // has `raw[k] === ' '` inside it, so the run ends five characters in and `/^(?:` does not
        // compile. The case table had no space-carrying positive, so only the counterfactual arm
        // saw it. The library already had the instrument (448/§lib-before-handrolling).
        const stop = regexLiteralEnd(raw, i);
        if (stop !== -1) {
          let f = stop;
          while (f < raw.length && /[gimsuyd]/.test(raw[f])) f += 1;
          const text = raw.slice(i, f);
          try { return { re: new Function(`return ${text};`)(), text, why: 'lifted' }; } catch { /* keep scanning */ }
        }
      }
      i = end;
      continue;
    }
    i += 1;
  }
  return { re: null, text: null, why: 'no regex-literal span in the statement' };
};

const probeOffsets = 'const a = 1; // a / b / c\nconst re = /x[/]y/g;\n';
leg('G2', '`stripSource` is OFFSET-PRESERVING, which is the one property the repaired lifter rests '
  + 'on: it blanks a stepped-over span in place rather than deleting it, so a position blank in the '
  + 'blinded reading and non-blank in the raw one is inside a comment, string or regex and nowhere '
  + 'else. Read off the module, not off its prose',
  `probe length raw ${probeOffsets.length} · blinded ${stripSource(probeOffsets, true).length}`,
  stripSource(probeOffsets, true).length === probeOffsets.length);

// KP / KN for the repaired lifter, each with the expected answer declared before the run.
const LIFT_CASES = [
  { id: 'KP-plain', src: 'const r = /abc/g;', want: '/abc/g' },
  { id: 'KP-class-slash', src: 'const r = /x[/]y/gi;', want: '/x[/]y/gi' },
  { id: 'KP-escaped-slash', src: 'const r = /a\\/\\/b/;', want: '/a\\/\\/b/' },
  { id: 'KP-after-comment', src: 'const r = /* found by brace/paren */ /real/u;', want: '/real/u' },
  // Added after B3 reddened: a literal carrying SPACES, in the real shape of the pre-cure 448
  // reader. The first repaired lifter passed all six other rows and could not lift this one.
  { id: 'KP-spaces-inside', src: 'const m = l.match(/^(?: ok |RED |REF ) ([A-Z][A-Z0-9]*)  /);', want: '/^(?: ok |RED |REF ) ([A-Z][A-Z0-9]*)  /' },
  { id: 'KP-spaces-after-comment', src: 'const m = x; // a / b\nconst n = /^(?: ok |RED ) G/.test(l);', want: '/^(?: ok |RED ) G/' },
  { id: 'KN-comment-only', src: 'const r = 1; // found by brace/paren balance/here', want: null },
  { id: 'KN-division', src: 'const r = a / b / c;', want: null },
  { id: 'KN-string-slashes', src: "const r = 'a/b/c';", want: null },
];
const liftRows = LIFT_CASES.map((c) => {
  const got = newLift(c.src).text;
  const oldGot = OLD === null ? null : (OLD.exec(c.src)?.[1] ?? null);
  return { ...c, got, oldGot, pass: got === c.want };
});
// The counts in this row's prose are DERIVED from the table, not typed beside it: the first pass
// said "four known positives and three known negatives" and B3's red forced two more KPs in, which
// would have left a true sentence about the old table sitting beside the new one.
leg('G3', `the repaired lifter is graded against a declared case table before it is used on any `
  + `subject — ${LIFT_CASES.filter((c) => c.want !== null).length} known positives (including the `
  + `exact shape that defeated the old one: a comment carrying \`brace/paren\` AHEAD of a real `
  + `literal, and a literal carrying SPACES) and ${LIFT_CASES.filter((c) => c.want === null).length} `
  + `known negatives (a comment alone, division, and slashes inside a string). The old lifter is run `
  + `on the SAME rows so the table is a confusion matrix and not a self-portrait`,
  liftRows.map((r) => `${r.id}: new=${JSON.stringify(r.got)} ${r.pass ? 'PASS' : 'FAIL'} old=${JSON.stringify(r.oldGot)}`).join(' | '),
  liftRows.every((r) => r.pass));

const separating = liftRows.filter((r) => r.got !== r.oldGot);
leg('G3a', 'the two lifters DISAGREE on at least one row, so G3 is a separating table rather than '
  + 'two readers that happen to agree everywhere — without this row a repair that changed nothing '
  + 'would pass G3 and read as a fix',
  `rows where new ≠ old: ${separating.length} of ${liftRows.length} `
  + JSON.stringify(separating.map((r) => r.id)), separating.length > 0);

// ─── B1: the three anchors at HEAD, both lifters ─────────────────────────────────────────────────
const ANCHORS = [
  { tag: '446 reader', file: F446, anchor: 'const legLines = ' },
  { tag: '448 reader', file: F448, anchor: 'const legTokens = ' },
  { tag: '449 sliceRe', file: F449, anchor: 'const sliceRe = ' },
];
const atHead = ANCHORS.map((a) => {
  const src = git('show', `${HEAD}:${a.file}`);
  const span = stmtSpan(src, a.anchor);
  const n = span === null ? { re: null, text: null, why: 'anchor not found' } : newLift(span.raw);
  const o = span === null || OLD === null ? null : (OLD.exec(span.raw)?.[1] ?? null);
  return { ...a, occurrences: span?.occurrences ?? 0, spanBytes: span?.raw.length ?? 0, newText: n.text, newWhy: n.why, oldText: o };
});
leg('B1', 'HIS 454 §2 REPRODUCES, AND THE REPAIRED LIFTER AGREES WITH IT WHERE IT MATTERS: both '
  + 'readers\' anchors are present exactly once at HEAD and NEITHER statement contains a regex '
  + 'literal any more, under the repaired lifter as well as the old one — so "the anchors survived, '
  + 'the regexes behind them did not" is not an artifact of the old lifter\'s blindness. The 449 row '
  + 'is where they part: the old one lifts a FRAGMENT OF A COMMENT and the repaired one lifts the '
  + 'real literal',
  atHead.map((r) => `${r.tag}: anchor×${r.occurrences} span ${r.spanBytes}B · new=${JSON.stringify(r.newText)} · old=${JSON.stringify(r.oldText)}`).join(' | '),
  atHead.every((r) => r.occurrences === 1)
  && atHead[0].newText === null && atHead[1].newText === null
  && atHead[0].oldText === null && atHead[1].oldText === null
  && atHead[2].newText !== null && atHead[2].oldText !== null && atHead[2].newText !== atHead[2].oldText);

// ─── B2: is the prediction-detail half of W10 cured? Driven, not read ────────────────────────────
const probe = renderTail({
  legs: [{ id: 'KPLEG', ok: true, what: 'LEG-DETAIL-SENTINEL' }],
  preds: [{ id: 'KPPRED', landed: false, what: 'PRED-DETAIL-SENTINEL' }],
});
const legDetailPublished = probe.includes('LEG-DETAIL-SENTINEL');
const predDetailPublished = probe.includes('PRED-DETAIL-SENTINEL');
const predIdInVerdict = /refuted=\[KPPRED\]/.test(probe);
leg('B2', 'W10(a) IS CURED, driven through the lib at HEAD with sentinels that cannot occur by '
  + 'accident rather than read off `renderTail`\'s source: a prediction\'s detail now reaches the '
  + 'recording. This is the half of W10 that his own P1 work closed, and W10\'s predicate asserts '
  + 'its ABSENCE',
  `legDetailPublished ${legDetailPublished} · predDetailPublished ${predDetailPublished} `
  + `(W10 requires FALSE) · predIdInVerdict ${predIdInVerdict}`,
  legDetailPublished && predDetailPublished && predIdInVerdict);

// ─── B3: the inversion, driven as a counterfactual ───────────────────────────────────────────────
// Restore `readable` by slicing the two readers at the PRE-cure rev, then evaluate W10's remaining
// conjuncts against HEAD's lib. If the verdict is RED rather than REFUSED, the leg does not merely
// stop reporting — it reports the opposite of the truth.
const preSpans = [
  { tag: '446 reader', file: F446, anchor: 'const legLines = ' },
  { tag: '448 reader', file: F448, anchor: 'const legTokens = ' },
].map((a) => {
  const src = git('show', `${PRE}:${a.file}`);
  const span = stmtSpan(src, a.anchor);
  const n = span === null ? { re: null, text: null } : newLift(span.raw);
  return { ...a, text: n.text, re: n.re };
});
const readablePre = preSpans.every((s) => s.re instanceof RegExp);
const readableHead = atHead.slice(0, 2).every((s) => s.newText !== null);

// `libBy448 === 0` — the lib's own unpadded rows, counted by the PRE-cure 448 reader.
const libRows = renderRows([{ id: 'W1', ok: true, what: 'x' }, { id: 'W2', ok: false, what: 'y' },
  { id: 'W3', ok: null, what: 'z' }]).join('\n');
const countWith = (re, text) => (re === null ? null
  : text.split('\n').filter((l) => new RegExp(re.source, re.flags.replace('g', '')).test(l)).length);
const libBy448Pre = countWith(preSpans[1].re ?? null, libRows);

const conj = (readable) => ({
  readable,
  'libBy448===0': libBy448Pre === 0,
  legDetailPublished,
  '!predDetailPublished': !predDetailPublished,
  predIdInVerdict,
});
const verdictOf = (c) => (c.readable === false ? 'REFUSED (readable is false, so the leg never evaluates the rest)'
  : (Object.values(c).every(Boolean) ? 'ok' : 'RED'));
const headVerdict = verdictOf(conj(readableHead));
const preVerdict = verdictOf(conj(readablePre));
const failingPre = Object.entries(conj(readablePre)).filter(([, v]) => v === false).map(([k]) => k);
leg('B3', 'THE COUNTERFACTUAL: W10 DOES NOT MERELY STOP REPORTING — RESTORE THE READERS AND IT '
  + 'PUBLISHES RED ON A TREE WHERE THE DEFECT IT NAMES IS CURED. The two readers are re-sliced at '
  + 'the pre-cure rev so `readable` is true again, and the remaining conjuncts are evaluated '
  + 'against HEAD\'s lib. The failing conjunct is named rather than inferred from the verdict, '
  + 'because a leg with five conjuncts can go red for a reason other than the one being claimed',
  `readable at HEAD ${readableHead} → ${headVerdict} · readable at ${PRE.slice(0, 8)} `
  + `${readablePre} → ${preVerdict} · conjuncts false in the pre-cure arm: ${JSON.stringify(failingPre)} · `
  + `pre-cure 448 reader sliced: ${JSON.stringify(preSpans[1].text)}`,
  readableHead === false && readablePre === true
  && headVerdict.startsWith('REFUSED') && preVerdict === 'RED'
  && failingPre.length === 1 && failingPre[0] === '!predDetailPublished');

leg('B4', 'SO THE DISPOSITION IS RE-AIM, NOT RETIREMENT, AND IT GIVES HIS §6.3 A VICTIM. W10\'s '
  + 'two halves were cured by two different rounds — (a) by his P1 work in the lib, (b) by his 452 '
  + 're-pointing both readers at the lib\'s exported tokens — so the evidence worth standing is the '
  + 'CURE, and a re-aimed W10 must measure "neither reader carries a regex literal". That puts the '
  + 'lifter back on the critical path: a lifter that mistakes a comment for a regex reports a '
  + 'literal present where there is none, which is the cure claim exactly inverted. His "no current '
  + 'victim" was true at his HEAD and stops being true once §6.2 is answered — which is why these '
  + 'two routed items could not be decided separately',
  `old lifter on the 449 anchor: ${JSON.stringify(atHead[2].oldText)} — a comment fragment · `
  + `repaired: ${JSON.stringify(atHead[2].newText)} · separating rows in the case table: `
  + `${separating.length}`,
  atHead[2].oldText !== null && !/^\/\(\\\//.test(String(atHead[2].oldText))
  && atHead[2].newText !== null && liftRows.every((r) => r.pass) && separating.length > 0);

console.log('');
console.log(renderTail({ legs, preds }));
process.exitCode = legs.some((l) => l.ok === false) ? 1 : 0;
