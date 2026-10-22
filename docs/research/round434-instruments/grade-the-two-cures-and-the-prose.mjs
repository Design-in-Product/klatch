/**
 * Round 434 — grading the two cures Theseus's Round 433 routed, plus the prose his §2 reds.
 *
 * ## What is graded, and what is only predicted
 *
 * Two cures landed in `../round430-instruments/refusal-convention.mjs`:
 *
 *   - **§1** — `mentionsParam` admitted a nested object KEY spelled like the parameter as a
 *     reference to the input, so `return { span: { src: 1 } }` was derived the answer shape while
 *     reading the input nowhere. UNDER-refusal, the direction this module exists to avoid.
 *     Cured by `maskKeyPositions`, called inside `mentionsParam`.
 *   - **§2** — `entriesOf` read its structural text out of the RAW expression, so a doc comment
 *     above a key landed inside the key. Cured by taking the object-literal test, the inner span
 *     offset and the key out of the masked text. The header sentence that claimed comment-blindness
 *     for the MODULE is re-aimed at the one leg it was true of.
 *
 * Every cell below is driven against TWO modules: the pre-cure slice committed in this directory
 * (asserted byte-identical to its blob at the stamped rev, with the cure's own marker asserted
 * ABSENT from it and PRESENT in the live module, so a wrong rev reddens instead of inverting once
 * the cure is committed — 420/422), and the live module.
 *
 * ## The honesty labels on this instrument
 *
 * `G9` reports the reason-level census movement, and it is a **GATE, not a prediction**, because I
 * drove his Round 433 grader against the cured module before this leg was written and had the
 * number in hand. Calling it a prediction afterwards would be drafting the slot for a measurement
 * that had already run (405). The three PREDICTION legs are the ones whose figures were genuinely
 * unread when they were written: the identity of the one moving member, and the two cures' reach
 * over a SECOND population this module is not aimed at.
 *
 * `G9`'s own key is the REASON, not the verdict — which is the lesson his refuted P2 paid for (433,
 * 345): on this population every verdict is `refused`, so a verdict-level key is saturated and
 * blind to a real cause.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..', '..');
const git = (...a) => execFileSync('git', a, { cwd: REPO, encoding: 'utf8', maxBuffer: 1 << 28 });
const REV = git('rev-parse', 'HEAD').trim();
const DIRTY = git('status', '--porcelain').trim() !== '';

const legs = [];
const preds = [];
const leg = (id, claim, detail, ok) => legs.push({ id, claim, detail, ok });
const pred = (id, claim, detail, landed) => preds.push({ id, claim, detail, landed });

const MOD = 'docs/research/round430-instruments/refusal-convention.mjs';
const SLICE = 'docs/research/round434-instruments/precure-refusal-convention.sliced.mjs';
// The rev the pre-cure slice is a slice OF. Gated by property below, not trusted.
const PRE_REV = '839e6063';
const CURE_MARKER = 'maskKeyPositions';

const PRE = await import(join(REPO, SLICE));
const LIVE = await import(join(REPO, MOD));

const liveText = readFileSync(join(REPO, MOD), 'utf8');
const sliceText = readFileSync(join(REPO, SLICE), 'utf8');

// ─── G1 — the pre-cure side is a slice, and it is pre-cure BY PROPERTY ──────────────────────────
const blob = (() => { try { return git('show', `${PRE_REV}:${MOD}`); } catch { return null; } })();
const g1 = blob !== null && blob === sliceText
  && !sliceText.includes(CURE_MARKER) && liveText.includes(CURE_MARKER);
leg('G1', 'the pre-cure side of every cell below is a SLICE of the module at a stamped rev, not a '
  + 'retyped copy, and it is pre-cure by PROPERTY (the cure\'s marker absent from it, present in '
  + 'the live module) rather than by trusting the rev — so a wrong rev reddens this leg instead of '
  + 'inverting a cell once the cure is committed (420/422)',
  `slice === blob at ${PRE_REV}: ${blob !== null && blob === sliceText} · bytes ${sliceText.length}`
  + ` · "${CURE_MARKER}" in slice: ${sliceText.includes(CURE_MARKER)} · in live module: `
  + `${liveText.includes(CURE_MARKER)}`, g1);

// ─── G2 — his round reproduces, driven unmodified before anything of mine was built (328) ───────
const verdictLines = (p) => {
  let t;
  try { t = readFileSync(join(REPO, p), 'utf8'); } catch { return null; }
  const g = t.match(/^GATE: (.+)$/m);
  const q = t.match(/^PREDICTIONS: (.+)$/m);
  return g === null || q === null ? null : { gate: g[1].trim(), pred: q[1].trim(), text: t };
};
const hisOwn = verdictLines('docs/research/round433-instruments/drive2.after-promotion.out');
const myRepro = verdictLines('docs/research/round434-instruments/reproduce-his-round433.out');
const reproDiff = hisOwn === null || myRepro === null ? null : (() => {
  const a = myRepro.text.split('\n');
  const b = hisOwn.text.split('\n');
  const d = [];
  for (let i = 0; i < Math.max(a.length, b.length); i += 1) if (a[i] !== b[i]) d.push(i);
  return d;
})();
const g2 = hisOwn !== null && myRepro !== null
  && myRepro.gate === hisOwn.gate && myRepro.pred === hisOwn.pred
  && reproDiff !== null && reproDiff.length === 2;
leg('G2', 'his Round 433 reproduces in my tree, driven UNMODIFIED before anything of mine was '
  + 'built (328), and the whole-file diff against his own recording is the two rev stamps and '
  + 'nothing else — derived by diffing the two files rather than asserted by eye',
  hisOwn === null || myRepro === null ? 'REFUSED: a verdict line was unreadable'
    : `his "${hisOwn.gate}" / "${hisOwn.pred}" · mine "${myRepro.gate}" / "${myRepro.pred}"`
      + ` · differing line indices ${JSON.stringify(reproDiff)}`, g2);

// ─── G3 / G4 — the two cures, each as a matrix over subjects this file constructs ───────────────
const SUBJ = (ret) => `function read(src) {
  if (src === undefined) return { refused: 'no input' };
  if (src === '') return null;
  return ${ret};
}`;
const admitted = (c) => (c === null ? null : c.refused === undefined);
const cell = (fnSource) => ({
  pre: PRE.conventionOf(fnSource),
  cured: LIVE.conventionOf(fnSource),
});

// §1. `want` is [pre-cure admitted?, cured admitted?].
const KEY_CELLS = [
  ['nested KEY spelled like the param, value reads the input nowhere — { span: { src: 1 } }',
    '{ span: { src: 1 } }', [true, false]],
  ['CONTROL: the same shape with the key renamed — { span: { q: 1 } }',
    '{ span: { q: 1 } }', [false, false]],
  ['CONTROL: the param name as a string VALUE — { span: { nope: 2, also: 3 } }',
    '{ span: { nope: 2, also: 3 } }', [false, false]],
  ['OVER-REACH CONTROL: genuinely derived through a nested value — { span: { from: src.length } }',
    '{ span: { from: src.length } }', [true, true]],
  ['OVER-REACH CONTROL: the param as KEY and in the value — { span: { src: src.length } }',
    '{ span: { src: src.length } }', [true, true]],
  ['OVER-REACH CONTROL: a ternary\'s second colon in a nested value — { span: { a: src===1?src:0 } }',
    '{ span: { a: src === 1 ? src : 0 } }', [true, true]],
  ['OVER-REACH CONTROL: an arrow BLOCK body in a value — { span: (x) => { return src; } }',
    '{ span: (x) => { return src; } }', [true, true]],
];
const keyRows = KEY_CELLS.map(([name, ret, want]) => {
  const c = cell(SUBJ(ret));
  const got = [admitted(c.pre), admitted(c.cured)];
  return { name, got, want, ok: got[0] === want[0] && got[1] === want[1], reason: c.cured.refused };
});
const g3 = keyRows.length === 7 && keyRows.every((r) => r.ok)
  && keyRows.some((r) => r.want[0] === true && r.want[1] === false)
  && keyRows.some((r) => r.want[0] === false && r.want[1] === false)
  && keyRows.some((r) => r.want[0] === true && r.want[1] === true);
leg('G3', 'HIS §1 CURED, and the cure graded for OVER-REACH as well as for the hole: the cell his '
  + '3 × 2 left out (a nested object KEY spelled like the parameter) flips admitted → refused, two '
  + 'controls that refused before still refuse, and FOUR shapes that genuinely do reach the input '
  + 'through a nested value — including a ternary\'s second colon and an arrow block body, the two '
  + 'ways a naive key-position reader would blank a real reference — stay admitted. All three '
  + 'directions of the matrix have a member, so no filter can make a conjunct here vacuously true',
  keyRows.map((r) => `${r.ok ? 'ok  ' : 'BAD '}[pre ${r.got[0]} → cured ${r.got[1]}; want `
    + `${r.want[0]} → ${r.want[1]}] ${r.name}`).join('\n        '), g3);

// §2. The key leg.
const COMMENT_CELLS = [
  ['a BLOCK doc comment above the key', `{
    /** the slice the caller asked for */
    span: src.slice(0, 1),
  }`, [false, true]],
  ['CONTROL: the same return with the comment deleted', `{
    span: src.slice(0, 1),
  }`, [true, true]],
  ['a LINE comment above the key — the masker blanks `//` too', `{
    // the slice the caller asked for
    span: src.slice(0, 1),
  }`, [false, true]],
  ['an inline comment BETWEEN the key and its colon', '{ span /* k */: src.slice(0, 1) }',
    [false, true]],
  ['a comment before the OPENING BRACE of the return value', `/* lead */ {
    span: src.slice(0, 1),
  }`, [false, true]],
  ['OVER-REACH CONTROL: a genuinely non-identifier key must STILL refuse — { \'span\': … }',
    "{ 'span': src.slice(0, 1) }", [false, false]],
  ['OVER-REACH CONTROL: a computed key must STILL refuse — { [k]: … }',
    '{ [k]: src.slice(0, 1) }', [false, false]],
];
const commentRows = COMMENT_CELLS.map(([name, ret, want]) => {
  const c = cell(SUBJ(ret));
  const got = [admitted(c.pre), admitted(c.cured)];
  return {
    name, got, want, ok: got[0] === want[0] && got[1] === want[1],
    preReason: c.pre.refused, curedReason: c.cured.refused,
  };
});
// The pre-cure refusal on the three comment-above-key cells must be the KEY leg specifically, not
// some other refusal that would make this a cell about the wrong mechanism.
const keyLegWasTheCause = commentRows.slice(0, 1).concat(commentRows.slice(2, 4))
  .every((r) => /^a non-identifier key/.test(String(r.preReason)));
const g4 = commentRows.length === 7 && commentRows.every((r) => r.ok) && keyLegWasTheCause;
leg('G4', 'HIS §2 CURED, and the KEY LEG is shown to be the pre-cure cause rather than assumed: '
  + 'three spellings of a comment at a key position (block, line, and inline between key and '
  + 'colon) each refused pre-cure WITH THE KEY LEG\'S OWN REASON and derive the convention after; '
  + 'a comment before the opening brace — the same raw-vs-masked confusion one level up — is cured '
  + 'with them; and two keys that are genuinely not identifiers (a string key, a computed key) '
  + 'still refuse, so the cure did not turn the key leg into a leg that accepts anything',
  commentRows.map((r) => `${r.ok ? 'ok  ' : 'BAD '}[pre ${r.got[0]} → cured ${r.got[1]}; want `
    + `${r.want[0]} → ${r.want[1]}] ${r.name}`
    + (r.preReason === undefined ? '' : `\n              pre-cure reason: ${String(r.preReason).slice(0, 72)}`))
    .join('\n        ')
    + `\n        the key leg was the pre-cure cause on all three comment-at-key cells: ${keyLegWasTheCause}`,
  g4);

// ─── G5 — the prose seam, graded as a 2 × 2 against the OLD spelling (380/397/412) ──────────────
// His own detector for the sentence he reds, re-typed from his 433 G4b and run here rather than
// reasoned about (329-331/367/409/429).
const HIS_CLAIM_RE = /a comment inside a value cancels and the leg is[\s*]+comment-blind/;
const NEW_CLAIM_RE = /the message leg cannot see a comment inside a[\s*]+value/;
const SCOPE_RE = /property of that one leg/;
const proseCells = {
  oldInSlice: HIS_CLAIM_RE.test(sliceText),
  oldInLive: HIS_CLAIM_RE.test(liveText),
  newInSlice: NEW_CLAIM_RE.test(sliceText),
  newInLive: NEW_CLAIM_RE.test(liveText),
};
const g5 = proseCells.oldInSlice === true && proseCells.oldInLive === false
  && proseCells.newInSlice === false && proseCells.newInLive === true
  && SCOPE_RE.test(liveText) && !SCOPE_RE.test(sliceText);
leg('G5', 'THE PROSE his §2 reds is re-aimed, not loosened, and the correction does not quote the '
  + 'spelling it removes (371/383): a 2 × 2 of {his own detector regex, the replacement\'s regex} '
  + 'against {the pre-cure slice, the live module} — the old sentence present in the slice and '
  + 'ABSENT from the live module, the new one the other way round. Both regexes are run here, '
  + 'tolerant of the block-comment continuation the sentences wrap across',
  Object.entries(proseCells).map(([k, v]) => `${k} ${v}`).join(' · ')
  + ` · the new sentence names the leg it is a property of: ${SCOPE_RE.test(liveText)}`
  + ` (and that phrase is absent pre-cure: ${!SCOPE_RE.test(sliceText)})`, g5);

// ─── G6 — the new masker is length-preserving, which every offset-based consumer assumes ────────
const lenRows = KEY_CELLS.concat(COMMENT_CELLS).map(([, ret]) => {
  const spans = LIVE.returnExprs(SUBJ(ret)) ?? [];
  return spans.map((s) => LIVE.maskKeyPositions(s.masked).length === s.masked.length);
}).flat();
const g6 = lenRows.length > 0 && lenRows.every((x) => x === true);
leg('G6', '`maskKeyPositions` is LENGTH-PRESERVING on every return span of every subject above — '
  + 'the property `stripSource` exists to provide and that every offset-based read in this module '
  + 'inherits. Asserted, not assumed, because a blanker that shortened its input would leave each '
  + 'consumer silently off by the length of every preceding key',
  `${lenRows.filter((x) => x).length} of ${lenRows.length} spans length-preserving`, g6);

// ─── G7 — round430's own gate, red at HEAD before this round, green after the C4 repair ─────────
const r430Head = verdictLines('docs/research/round434-instruments/round430-gate-at-HEAD-unedited.out');
const r430Now = verdictLines('docs/research/round434-instruments/round430-gate-postcure.out');
const r432Now = verdictLines('docs/research/round434-instruments/round432-gate-postcure.out');
const g7 = r430Head !== null && r430Now !== null && r432Now !== null
  && /^false/.test(r430Head.gate) && /^true/.test(r430Now.gate) && /^true/.test(r432Now.gate)
  && /separates true/.test(r430Now.text);
leg('G7', 'MY OWN ROUND 430 GATE WAS ALREADY RED AT HEAD, and not because of this round\'s edit: '
  + 'driven with HEAD\'s blob swapped over the module and restored byte-identical, it reads GATE '
  + 'false. Its G7 cell pinned a COUNT of live `CONV.refused === undefined` absence tests, and my '
  + 'own Round 432 commit `8f412aaa` — taking Theseus\'s 431 §0 recommendation — removed the last '
  + 'one, so the cell that grades the receiver leg went vacuous on its own promotion while the '
  + 'recording saying GATE true was committed one commit earlier at `4186708a`. Re-graded as a '
  + '2 × 2 on constructed text with the live count published as a measurement; green again. '
  + 'Round 432\'s gate is re-driven here too and unmoved by this round\'s cures',
  `round430 at HEAD, my edit absent: GATE ${r430Head?.gate} · round430 after the C4 repair: GATE `
  + `${r430Now?.gate} · round432 under this round's cures: GATE ${r432Now?.gate} / `
  + `${r432Now?.pred} · the C4 2 × 2 separates: ${/separates true/.test(String(r430Now?.text))}`, g7);

// ─── G8 — his own grader post-cure reds exactly the legs that assert the defects ────────────────
const hisPost = verdictLines('docs/research/round434-instruments/his-round433-postcure.out');
const hisRedLegs = hisPost === null ? null
  : (hisPost.gate.match(/FALSE: (.+)$/) ?? [, ''])[1].split(',').map((s) => s.trim()).filter(Boolean);
const EXPECT_RED = ['G3', 'G4', 'G4b', 'G4c'];
const g8 = hisRedLegs !== null && hisRedLegs.length === EXPECT_RED.length
  && EXPECT_RED.every((x) => hisRedLegs.includes(x))
  && hisPost.pred === myRepro?.pred;
leg('G8', 'HIS OWN ROUND 433 GRADER, re-driven against the cured module, goes red on EXACTLY the '
  + 'four legs that assert the two defects (G3, G4, G4b, G4c) and on nothing else, and its '
  + 'PREDICTIONS line is unmoved. A probe asserting a defect must redden when the defect is cured '
  + '— that is the signature of a cure, and a grader that stayed green here would be re-typing a '
  + 'verdict rather than reading one (428). His remaining five legs are untouched by the cures',
  hisPost === null ? 'REFUSED: his post-cure verdict line was unreadable'
    : `his GATE post-cure: "${hisPost.gate}" · red legs ${JSON.stringify(hisRedLegs)} · expected `
      + `${JSON.stringify(EXPECT_RED)} · PREDICTIONS "${hisPost.pred}" (pre-cure: `
      + `"${myRepro?.pred}")`, g8);

// ─── The census, over his own population, keyed on the REASON ──────────────────────────────────
// His §3 population and his reason classes, re-keyed here. An UNCLASSIFIED reason reddens the leg
// rather than falling into a terminal bucket (411).
const classOf = (r) => (/^the input is not nameable/.test(r) ? 'the input is not nameable (paramsOf refused)'
  : /^a return form this reader does not model/.test(r) ? 'a return form this reader does not model'
    : /^a non-identifier key/.test(r) ? 'a non-identifier key'
      : /^no `return` site/.test(r) ? 'no `return` site in the source'
        : /^no answer shape/.test(r) ? 'no answer shape among the returns'
          : /^no refusal shape/.test(r) ? 'no refusal shape among the returns'
            : /that is neither all-message nor input-derived/.test(r) ? 'neither all-message nor input-derived'
              : /^the function takes no parameter/.test(r) ? 'the function takes no parameter'
                : /^the answer and refusal shapes share/.test(r) ? 'the answer and refusal shapes share a key'
                  : /^the masker was not length-preserving/.test(r) ? 'the masker was not length-preserving'
                    : `UNCLASSIFIED: ${r.slice(0, 50)}`);

const census = async (dir) => {
  const files = git('ls-tree', '-r', '--name-only', REV, dir).trim().split('\n')
    .filter((f) => f.endsWith('.mjs') && !f.includes('round434-instruments'));
  const identical = files.filter((f) => git('show', `${REV}:${f}`) === readFileSync(join(REPO, f), 'utf8'));
  const cells = new Map();
  const moved = [];
  const preReasons = new Map();
  const curedReasons = new Map();
  let fns = 0;
  let importFails = 0;
  for (const f of files) {
    let mod;
    try { mod = await import(join(REPO, f)); } catch { importFails += 1; continue; }
    for (const [name, v] of Object.entries(mod)) {
      if (typeof v !== 'function') continue;
      fns += 1;
      const s = v.toString();
      const a = PRE.conventionOf(s);
      const b = LIVE.conventionOf(s);
      const k = `${admitted(a) ? 'admitted' : 'refused'}->${admitted(b) ? 'admitted' : 'refused'}`;
      cells.set(k, (cells.get(k) ?? 0) + 1);
      const ra = a.refused === undefined ? null : classOf(a.refused);
      const rb = b.refused === undefined ? null : classOf(b.refused);
      if (ra !== null) preReasons.set(ra, (preReasons.get(ra) ?? 0) + 1);
      if (rb !== null) curedReasons.set(rb, (curedReasons.get(rb) ?? 0) + 1);
      if (ra !== rb) moved.push({ member: `${f}#${name}`, from: ra ?? 'ADMITTED', to: rb ?? 'ADMITTED' });
    }
  }
  const unclassified = [...preReasons.keys(), ...curedReasons.keys()].filter((k) => k.startsWith('UNCLASSIFIED'));
  return {
    files, identical, cells, moved, preReasons, curedReasons, fns, importFails, unclassified,
  };
};

const lib = await census('scripts/lib/');
// His published §3 table, quoted from his memo and reproduced here under my own reader. My
// PRE-cure side is his CURED side — the same module, the same rev — so this is his figure checked
// against an independently written census rather than a recount of my own (328).
const HIS_PUBLISHED = {
  'a return form this reader does not model': 25,
  'the input is not nameable (paramsOf refused)': 2,
  'neither all-message nor input-derived': 1,
  'a non-identifier key': 1,
  'no `return` site in the source': 1,
};
const hisTableReproduces = Object.entries(HIS_PUBLISHED)
  .every(([k, n]) => lib.preReasons.get(k) === n)
  && lib.preReasons.size === Object.keys(HIS_PUBLISHED).length;
const g9ok = lib.files.length > 0 && lib.identical.length === lib.files.length
  && lib.importFails === 0 && lib.unclassified.length === 0 && hisTableReproduces
  && [...lib.cells.keys()].join('|') === 'refused->refused'
  && lib.moved.length === 1
  && lib.moved[0].from === 'a non-identifier key'
  && lib.moved[0].to === 'neither all-message nor input-derived';
leg('G9', 'THE REACH, KEYED ON THE REASON RATHER THAN THE VERDICT — which is what his refuted P2 '
  + 'paid for (433/345): over every function export of `scripts/lib/` at a stamped rev, every '
  + 'verdict is `refused` both sides, so a verdict-level key is SATURATED and cannot see a cause. '
  + 'At reason level exactly ONE member moves, and it moves off the key leg onto a second, '
  + 'unmodelled return — which is the movement his G4c predicted by deleting comment spans, '
  + 'reached here by curing the leg instead. My PRE-cure distribution is his CURED distribution '
  + '(same module, same rev), so his published §3 table is reproduced here under a census written '
  + 'independently of his. **This is a GATE, not a prediction: I had driven his grader against the '
  + 'cured module before this leg was written** (405). An UNCLASSIFIED reason reddens it (411)',
  `rev ${REV.slice(0, 8)} · files ${lib.files.length} (all byte-identical to their blobs: `
  + `${lib.identical.length === lib.files.length}) · import failures ${lib.importFails}`
  + ` · function exports ${lib.fns}`
  + `\n        verdict transitions: ${[...lib.cells].map(([k, c]) => `${k} ${c}`).join(' ║ ')}`
  + `\n        his published §3 table reproduces under my census: ${hisTableReproduces}`
  + `\n        pre-cure reasons:   ${[...lib.preReasons].sort((x, y) => y[1] - x[1]).map(([k, c]) => `${c}× ${k}`).join(' ║ ')}`
  + `\n        cured reasons:      ${[...lib.curedReasons].sort((x, y) => y[1] - x[1]).map(([k, c]) => `${c}× ${k}`).join(' ║ ')}`
  + `\n        moved (${lib.moved.length}): ${lib.moved.map((m) => `${m.member}: ${m.from} → ${m.to}`).join(' ║ ')}`,
  g9ok);

// ─── P1 — the identity of the one moving member, unread when this leg was written ───────────────
const P1_MEMBER = 'scripts/lib/recall-tap.mjs#tapSummary';
const p1 = lib.moved.length === 1 && lib.moved[0].member === P1_MEMBER;
pred('P1', 'the ONE member whose refusal reason moves is `' + P1_MEMBER + '` — the live member his '
  + '§2 named from his own side, verified here by a census that finds it rather than by taking his '
  + 'word for it. Genuinely unread when this leg was written: his grader prints reason COUNTS, not '
  + 'member names, so the post-cure drive I had already taken could not tell me which member it was',
  `moved ${lib.moved.length} member(s): ${lib.moved.map((m) => m.member).join(', ') || '(none)'}`
  + ` · predicted ${P1_MEMBER}`, p1);

// ─── P2 — is the new masker INERT on the live population? Unread when this leg was written ──────
// A cure whose machinery never fires on anything real is worth knowing about, and the answer is not
// implied by G9: G9 reads whether a VERDICT moved, and `maskKeyPositions` can blank a real key
// position in a span without changing that span's verdict.
const maskFires = [];
for (const f of lib.files) {
  let mod;
  try { mod = await import(join(REPO, f)); } catch { continue; }
  for (const [name, v] of Object.entries(mod)) {
    if (typeof v !== 'function') continue;
    for (const s of LIVE.returnExprs(v.toString()) ?? []) {
      const blanked = LIVE.maskKeyPositions(s.masked);
      if (blanked !== s.masked) maskFires.push(`${f}#${name}@${s.at}`);
    }
  }
}
const p2 = maskFires.length >= 1;
pred('P2', 'the §1 machinery is NOT inert on the live population: `maskKeyPositions` blanks at '
  + 'least one real key position in a real return span of `scripts/lib/`. Not implied by G9, which '
  + 'reads whether a VERDICT moved — a key can be blanked in a span whose verdict is unchanged. If '
  + 'this came back 0 the cure would be exercised only by this file\'s constructed probes, which is '
  + 'a thing I would want on the record rather than discovered by the next seat',
  `spans where the masker fires: ${maskFires.length}`
  + (maskFires.length === 0 ? '' : `\n        ${maskFires.slice(0, 8).join(' ║ ')}`
    + (maskFires.length > 8 ? ` ║ …and ${maskFires.length - 8} more` : '')), p2);

// ─── Report ─────────────────────────────────────────────────────────────────────────────────────
const out = [];
out.push('Round 434 — grading the two cures Theseus\'s Round 433 routed, plus the prose his §2 reds');
out.push('');
for (const l of legs) {
  out.push(`  ${l.ok === true ? 'TRUE ' : 'FALSE'} ${l.id}  [GATE] ${l.claim}`);
  out.push(`        ${l.detail}`);
}
for (const p of preds) {
  out.push(`  ${p.landed === true ? 'TRUE ' : 'FALSE'} ${p.id}  [PRED] ${p.claim}`);
  out.push(`        ${p.detail}`);
}
out.push('');
const failed = legs.filter((l) => l.ok !== true);
const refuted = preds.filter((p) => p.landed !== true);
out.push(`GATE: ${failed.length === 0 ? 'true' : 'false'}   (${legs.length} leg(s))`
  + (failed.length === 0 ? '' : ` — FALSE: ${failed.map((l) => l.id).join(', ')}`));
out.push(`PREDICTIONS: ${preds.length - refuted.length} landed, ${refuted.length} refuted`
  + (refuted.length === 0 ? '' : `: ${refuted.map((p) => p.id).join(' | ')}`));
out.push(`  rev ${REV.slice(0, 8)} · pre-cure slice rev ${PRE_REV} · worktree `
  + `${DIRTY ? 'DIRTY' : 'clean'}`);
console.log(out.join('\n'));
process.exitCode = failed.length === 0 ? 0 : 1;
