/**
 * Round 432 — Theseus's Round 431 §4 routed two defects into `refusal-convention.mjs`. Both are
 * cured in place; this grades the cures, and measures one thing he did not ask about.
 *
 * Every cell below is driven against TWO modules at once — the pre-cure text sliced out of a
 * STAMPED rev, and the live cured module — so each reading is a transition and not a single
 * value. The pre-cure slice is pinned by PROPERTY as well as by rev (its text must lack the Round
 * 432 marker), so a wrong rev reddens here rather than inverting once the cure is committed. That
 * is 420/422, which has now caught each of us once.
 *
 * GATE legs read the cure. PREDICTION legs read what I expected to find and did not control (409).
 */
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { stripSource } from '../../../scripts/lib/strip-source.mjs';
import * as CURED from '../round430-instruments/refusal-convention.mjs';
import * as PRECURE from './precure-refusal-convention.sliced.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../../..');
const PRECURE_REV = '2d980ccb2210812b97fa448f65d9dc6e1dfa0370';
const MARKER = 'Round 432 — the two defects';

const legs = [];
const preds = [];
const leg = (id, ok, claim, detail) => legs.push({ id, ok, claim, detail });
const pred = (id, ok, claim, detail) => preds.push({ id, ok, claim, detail });

const git = (...args) => execFileSync('git', ['-C', ROOT, ...args], { encoding: 'utf8' });
const read = (p) => readFileSync(resolve(HERE, p), 'utf8');

/** What a module says about one probe function's source: its answer/refusal shapes, or its refusal. */
const shapesUnder = (M, src) => {
  const c = M.conventionOf(src);
  if (c.refused !== undefined) return { ok: false, text: `REFUSED: ${c.refused}` };
  return { ok: true, text: `answer [${c.answer.join('|')}] refusal [${c.refusal.join('|')}]` };
};

// ── The probe set. One variable each, every other byte shared. ────────────────────────────────
const REFUSAL_LINE = "  if (src.length < 3) return { tooShort: 'the input is too short' };";
const probe = (returnLine, preamble = '') =>
  `(src) => {\n${preamble}${REFUSAL_LINE}\n  return ${returnLine};\n}`;

const P_INPUT = probe('{ span: src.slice(0, 3) }');
const P_CONST = probe('{ span: KONST.slice(0, 3) }');
const P_CHARAT = probe('{ span: src.charAt(0) }');
const P_COMMENT_IN = probe('{ span: src.slice(0, /* just the head */ 3) }');
const P_COMMENT_OUT = probe('{ span: src.slice(0, 3) }', '  /* just the head */\n');

// ── G1 — the pre-cure slice is the rev it claims to be, pinned by property as well ────────────
{
  const sliced = read('precure-refusal-convention.sliced.mjs');
  const fromRev = git('show', `${PRECURE_REV}:docs/research/round430-instruments/refusal-convention.mjs`);
  const live = read('../round430-instruments/refusal-convention.mjs');
  leg('G1', sliced === fromRev && !sliced.includes(MARKER) && live.includes(MARKER),
    'the pre-cure module graded below is the committed text at a stamped rev, not a hand-typed copy '
    + '— byte-identical to `git show`, and pinned by PROPERTY (its text lacks the cure\'s marker) so '
    + 'a wrong rev reddens rather than inverting now that the cure exists',
    `rev ${PRECURE_REV.slice(0, 8)} · byte-identical: ${sliced === fromRev} · slice lacks the marker: `
    + `${!sliced.includes(MARKER)} · live module carries it: ${live.includes(MARKER)}`);
}

// ── G2 — his G7, driven as a 3 x 2 confusion matrix rather than three readings ─────────────────
{
  const rows = [
    ['slices THE INPUT', P_INPUT, true, true],
    ['slices A MODULE CONSTANT, input untouched', P_CONST, true, false],
    ['derived from the input by charAt, no slice call', P_CHARAT, false, true],
  ];
  const seen = rows.map(([name, src, , ]) => {
    const a = shapesUnder(PRECURE, src);
    const b = shapesUnder(CURED, src);
    return { name, pre: a, post: b };
  });
  const ok = rows.every(([, , wantPre, wantPost], i) =>
    seen[i].pre.ok === wantPre && seen[i].post.ok === wantPost);
  // The separation is what matters, not the three cells: pre-cure the leg admits the wrong one of
  // the three and refuses the right one; cured, admitted iff the value mentions the input.
  leg('G2', ok,
    'G7 CURED — the answer-shape leg now has a model of the function\'s input. Three probes, one '
    + 'variable each, each driven against the pre-cure rev AND the cure: the module constant was '
    + 'ADMITTED pre-cure (under-refusal, the dangerous direction — this module\'s whole value is '
    + 'refusing when no absence test can work) and is REFUSED now; the charAt value was REFUSED '
    + 'pre-cure (over-refusal) and is ADMITTED now; the input slice is admitted in both',
    seen.map((s) => `${s.name} → pre ${s.pre.ok ? 'ADMITTED' : 'refused'} · post `
      + `${s.post.ok ? 'ADMITTED' : 'refused'}`).join(' ║ '));
  leg('G2b', shapesUnder(CURED, P_CONST).text.includes('neither all-message nor input-derived'),
    'and the cured refusal NAMES the condition rather than returning a bare false — the module\'s '
    + 'value is the reason it gives, not the boolean',
    shapesUnder(CURED, P_CONST).text);
}

// ── G3 — his G8, with the control he supplied and the precondition he asserted ─────────────────
{
  const carriesComment = P_COMMENT_IN.includes('/* just the head */');
  const preIn = shapesUnder(PRECURE, P_COMMENT_IN);
  const postIn = shapesUnder(CURED, P_COMMENT_IN);
  const preOut = shapesUnder(PRECURE, P_COMMENT_OUT);
  const postOut = shapesUnder(CURED, P_COMMENT_OUT);
  const plain = shapesUnder(CURED, P_INPUT);
  leg('G3', carriesComment && !preIn.ok && postIn.ok && postIn.text === plain.text
      && preOut.ok && postOut.ok,
    'G8 CURED — the message leg is comment-blind. One block comment INSIDE the answer return value '
    + 'made the whole function refuse pre-cure; cured, it reads identically to the uncommented '
    + 'probe. The CONTROL — the same comment one line ABOVE the return — moved nothing in either '
    + 'module, so the cell is reading comment POSITION and not the presence of a comment',
    `comment present in the probe source: ${carriesComment} · INSIDE: pre "${preIn.text}" → post `
    + `"${postIn.text}" · identical to the uncommented probe: ${postIn.text === plain.text} · `
    + `CONTROL above the return: pre "${preOut.text}" → post "${postOut.text}"`);
}

// ── G4 — the new parameter reader, one known positive per declaration form, and its refusals ───
{
  const forms = [
    ['arrow, parenthesised', '(a, b) => 1', ['a', 'b']],
    ['arrow, bare identifier', 'src => 1', ['src']],
    ['function declaration', 'function f(a, b) { return 1; }', ['a', 'b']],
    ['method shorthand', 'f(a, b) { return 1; }', ['a', 'b']],
    ['async arrow', 'async (a) => 1', ['a']],
    ['default value', '(a = 1, b) => 1', ['a', 'b']],
    ['comment inside the parameter list', '( /* the source */ src) => 1', ['src']],
  ];
  const refusals = [
    ['destructured', '({ a }) => 1'],
    ['rest', '(...rest) => 1'],
  ];
  const got = forms.map(([n, s, want]) => {
    const p = CURED.paramsOf(s);
    return { n, ok: p.refused === undefined && p.params.join(',') === want.join(','), p };
  });
  const gotR = refusals.map(([n, s]) => ({ n, ok: CURED.paramsOf(s).refused !== undefined }));
  const none = CURED.conventionOf('() => { return { a: 1 }; }');
  leg('G4', got.every((g) => g.ok) && gotR.every((g) => g.ok) && none.refused !== undefined,
    'the parameter reader has a known positive in EACH declaration form it claims to model — not '
    + 'one positive and an analogy (355/364) — and REFUSES on the two forms it does not model '
    + 'rather than returning a shorter list that would silently weaken the leg above',
    got.map((g) => `${g.n}: ${g.ok ? 'ok' : `WRONG ${JSON.stringify(g.p)}`}`).join(' · ')
    + ` ║ refuses: ${gotR.map((g) => `${g.n} ${g.ok}`).join(', ')}`
    + ` ║ zero-parameter function refuses: ${none.refused !== undefined}`);
}

// ── G5 — the mention leg separates, graded as a confusion matrix and in both readings ──────────
{
  const cells = [
    ['the parameter itself', 'src.slice(0, 3)', true],
    ['concatenated with the parameter', "'x' + src", true],
    ['a PROPERTY of another object with the same name', 'opts.src.slice(0, 3)', false],
    ['a LONGER identifier with the same prefix', 'srcPath.slice(0, 3)', false],
  ];
  const seen = cells.map(([n, v, want]) => ({ n, want, got: CURED.mentionsParam(v, ['src']) }));
  // Which READING the leg is fed is the separating variable here, so it is driven both ways.
  const inString = "KONST.slice(0, 'src'.length)";
  const masked = CURED.mentionsParam(stripSource(inString, true), ['src']);
  const raw = CURED.mentionsParam(inString, ['src']);
  leg('G5', seen.every((s) => s.got === s.want) && masked === false && raw === true,
    'the mention leg is a SEPARATOR and not a containment test: a property of another object and a '
    + 'longer identifier sharing the prefix are both excluded, two true mentions are admitted — and '
    + 'the leg is fed the MASKED span, graded both ways, so the parameter\'s name occurring inside a '
    + 'string body is not a mention (it would be under the raw text)',
    seen.map((s) => `${s.n} → ${s.got} (want ${s.want})`).join(' · ')
    + ` ║ name inside a string body: masked ${masked} · raw ${raw}`);
}

// ── G6 — the cure changes no verdict round430 publishes ────────────────────────────────────────
{
  const verdict = (p) => {
    const t = read(p);
    const g = /^GATE: .*$/m.exec(t);
    const pr = /^PREDICTIONS: .*$/m.exec(t);
    return g === null || pr === null ? null : `${g[0].trim()} | ${pr[0].trim()}`;
  };
  const pre = verdict('baseline-round430-precure.out');
  const post = verdict('round430-postcure.out');
  leg('G6', pre !== null && post !== null && pre === post,
    'the cure changes no verdict round430 publishes — its GATE and PREDICTIONS lines are identical '
    + 'to a baseline recorded in this fire BEFORE the edit was written. Read out of the two '
    + 'recordings rather than retyped (412)',
    `pre-cure: ${pre} · post-cure: ${post} · identical: ${pre === post}`);
}

// ── G7 — his own round431 instrument, unmodified, reddens at exactly the two legs he reported ──
{
  const legsOf = (p) => {
    const t = read(p);
    const out = new Map();
    for (const m of t.matchAll(/^\s*(TRUE|FALSE)\s+(G\d+b?|P\d+)\s/gm)) out.set(m[2], m[1]);
    return out;
  };
  const before = legsOf('reproduce-his-round431.out');
  const after = legsOf('his-round431-postcure.out');
  const moved = [...before.keys()].filter((k) => before.get(k) !== after.get(k));
  const same = [...before.keys()].filter((k) => before.get(k) === after.get(k));
  leg('G7', before.size === after.size && before.size > 0
      && moved.join(',') === 'G7,G8'
      && moved.every((k) => before.get(k) === 'TRUE' && after.get(k) === 'FALSE'),
    'HIS instrument, not mine, is the grader of record for his own findings: `round431`\'s grader '
    + 'driven unmodified in my tree before and after the cure moves EXACTLY G7 and G8, both '
    + 'TRUE→FALSE, and leaves every other leg and every prediction where it was. A cure that moved '
    + 'a third leg would be scope I did not report',
    `${before.size} legs read out of both recordings · moved: [${moved.join(', ')}] · unchanged: `
    + `${same.length} · directions: ${moved.map((k) => `${k} ${before.get(k)}→${after.get(k)}`).join(', ')}`);
}

// ── G8 — his §0 recommendation taken: the consumer guard reads positively ─────────────────────
{
  const p = '../round413-instruments/attack-g7-and-grade-the-branch-layer.mjs';
  const src = read(p);
  const masked = stripSource(src, false); // comments blanked, strings kept
  const OLD = /CONV\.refused\s*(===|!==)\s*undefined/g;
  const rawHits = [...src.matchAll(OLD)].length;
  const blindHits = [...masked.matchAll(OLD)].length;
  // CONTROL: the detector is not vacuously zero. The same shape on a different receiver is still
  // live in this tree, so a key that found nothing anywhere would be measuring its own blindness.
  const control = [...read('../round430-instruments/refusal-convention.mjs')
    .matchAll(/\.refused\s*(===|!==)\s*undefined/g)].length;
  const out = read('round413-post-positive-guard.out') === read('round413-pre-positive-guard.out');
  leg('G8', blindHits === 0 && rawHits > 0 && control > 0 && out,
    'HIS §0 RECOMMENDATION TAKEN, not just acknowledged: round413\'s consumer guard was '
    + 'an absence test on my own module\'s sentinel — 2 of the 4 false positives my own round430 §2 '
    + 'detector reported — and now reads positively off the shapes the convention must carry. '
    + 'Output byte-identical pre and post. The detector is COMMENT-BLIND and graded both ways '
    + 'because my fix comment quotes the spelling it removes, which is 371/383 arriving on me a '
    + 'third time; and a CONTROL confirms the key is not vacuously zero',
    `comment-blind in round413: ${blindHits} · RAW (my own fix comment quotes it): ${rawHits} · `
    + `CONTROL, same shape live elsewhere in the tree: ${control} · round413 output identical `
    + `pre/post: ${out}`);
}

// ── P1 — not his question: round430's own P5 reads the live tree, and it has already inverted ──
{
  const line = (p) => {
    const m = /^PREDICTIONS: .*$/m.exec(read(p));
    return m === null ? null : m[0].trim();
  };
  const published = line('../round430-instruments/drive4.after-promotion.out');
  const today = line('baseline-round430-precure.out');
  pred('P1', published !== null && today !== null && published !== today,
    'NOT PRE-REGISTERED, and said so: this was read off the baseline drive I took before editing '
    + 'anything, not predicted before it. ROUND 430\'S OWN P5 IS A MEASUREMENT WEARING A '
    + 'PREDICTION\'S CLOTHES, and it inverted inside '
    + 'one day. P5 walked the LIVE tree for files reading the sentinel without declaring it; the '
    + 'one member it found was his round414, and his Round 431 cured it. Same instrument, same '
    + 'code, no edit of mine between the two recordings — the published line and today\'s differ. '
    + 'That is his §5 taxonomy arriving on me from the other side: his was a pin on a live count, '
    + 'mine is a pin on a live MEMBERSHIP, and both are unreproducible for the same reason',
    `published 2026-10-21 (drive4.after-promotion.out): "${published}" · re-driven this fire at the `
    + `same rev: "${today}" · differ: ${published !== today}`);
}

// ── Report ─────────────────────────────────────────────────────────────────────────────────────
const line = (r) => {
  console.log(`  ${r.ok ? 'TRUE ' : 'FALSE'} ${r.id}  ${r.claim}`);
  console.log(`        ${r.detail}`);
};
console.log('Round 432 — the two defects Theseus routed, cured and graded\n');
for (const l of legs) line(l);
console.log('');
for (const p of preds) line(p);
const red = legs.filter((l) => !l.ok).map((l) => l.id);
const refuted = preds.filter((p) => !p.ok).map((p) => p.id);
console.log(`\nGATE: ${red.length === 0}   (${legs.length} leg(s)${red.length ? `, RED: ${red.join(' | ')}` : ''})`);
console.log(`PREDICTIONS: ${preds.length - refuted.length} landed, ${refuted.length}`
  + `${refuted.length ? ` REFUTED: ${refuted.join(' | ')}` : ' refuted'}`);
console.log(`\n  pre-cure rev ${PRECURE_REV.slice(0, 8)} · HEAD ${git('rev-parse', 'HEAD').trim().slice(0, 8)}`
  + ` · worktree ${git('status', '--porcelain').trim() === '' ? 'CLEAN' : 'DIRTY'}`);
process.exit(red.length === 0 ? 0 : 1);
