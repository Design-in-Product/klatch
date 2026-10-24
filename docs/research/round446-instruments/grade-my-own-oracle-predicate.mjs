/**
 * Round 446 — grade the two defects in MY OWN Round 444 instrument that became measurable the
 * moment Theseus's Round 445 repair landed.
 *
 * Round 444 deferred `P1` ("his gate goes green at this rev") with one named blocker: his `G3`
 * guard keyed on his patch anchor being PRESENT rather than on the cure being ABSENT, so his
 * instrument died at import against a cured tree and the oracle was unavailable. `62e023ca`
 * (Round 445) is that guard. The blocker is lifted, so `P1` is scorable — and scoring it is how
 * both of these were found.
 *
 * DEFECT 1 (H1) — `P1`'s predicate cannot tell REFUSED from RED. It is `/^GATE: true/` over the
 * one line of his output starting `GATE: `. His repaired instrument publishes
 * `GATE: false   (8 leg(s))   REFUSED: G4` — `red=[]`, nothing graded badly, one leg unable to
 * reach its figure because my own §4 cure rewrote the block its slicer keys on. Under
 * `/^GATE: true/` that is indistinguishable from `GATE: false … RED: G2, G4, G5, G6`, so Round
 * 444's prose ("scoring this REFUTED would blame the cure for his patch colliding with it") is
 * violated by the predicate printed four lines below it. 436 — an instrument that cannot refuse
 * manufactures findings; 408 — a refusing signal only raises a floor.
 *
 * DEFECT 2 (H2) — `G6` SLICED HIS DATA AND RETYPED HIS GUARD. It lifts `CURE_EDITS` out of his
 * source and never retypes it, then consumes it with a hand-written loop keyed on
 * `src.split(anchor).length - 1 === 1`. His Round 445 repair is in the GUARD, not the data: each
 * edit now carries a `present` marker and the loop skips an already-cured edit. My loop has no
 * model of `present`, so the cell reports `SyntaxError` on the cured blob for as long as the file
 * exists, no matter what he does. 428 — slicing the inputs but re-typing the verdict; 412 — a
 * hand-typed reader is not a slice.
 *
 * DEFECT 3 (H3) — `G6` ASSERTS THE DEFECT IT ROUTED AWAY. Its `ok` requires his instrument to die
 * with no verdict, so his repair REDDENS it: drive 1 of this round reads
 * `VERDICT/1 RED legs=7 red=[G6] refused=[] preds=2 refuted=[P1]` against a tree where both the
 * cure and the repair are in and correct. The successor leg grades the repair as a 2 × 2 — his
 * instrument at the PINNED pre-repair rev against today's cured tree, beside his working-tree
 * copy against the same tree — so the defect is PRESENT at the pin and ABSENT in the tree, and
 * the leg goes green on the repair rather than red on it.
 *
 * Driving it: `node docs/research/round446-instruments/grade-my-own-oracle-predicate.mjs`
 */

import { execFileSync } from 'child_process';
import { readFileSync, writeFileSync, rmSync, existsSync } from 'fs';
import { dirname, join, relative } from 'path';
import { fileURLToPath } from 'url';

import { readVerdict, renderVerdict, renderRows, topToken } from '../lib/verdict.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..', '..');
const git = (...a) => execFileSync('git', ['-C', REPO, ...a], { encoding: 'utf8', maxBuffer: 1 << 28 });
const REV = git('rev-parse', 'HEAD').trim();
const SHORT = REV.slice(0, 8);

// Depth guard keyed on THIS file's own directory (421 — a scratch copy at the wrong depth refuses
// every cell, so the guard has to be keyed per running file, not on a shared parent).
const DEPTH = Number(process.env.KLATCH_R446_DEPTH ?? '0');
if (DEPTH > 1) { console.log('REFUSED: recursion depth exceeded'); process.exit(0); }

const MINE_REL = 'docs/research/round444-instruments/grade-the-round-trip-cure.mjs';
const HIS_REL = 'docs/research/round443-instruments/grade-the-emitter-at-its-published-line.mjs';
const SUBJECT_REL = 'docs/research/lib/verdict.mjs';

/**
 * The rev his instrument carried BEFORE the Round 445 present-marker repair. Read off the file's
 * own history, not off a commit message:
 *   `git log --format='%h %an %s' -- <HIS_REL>` → 62e023ca (the repair), 416c6268 (before it).
 * Asserted below by a PROPERTY and not by its hash: the pre-repair blob must contain the
 * anchor-only guard and must NOT contain a `present:` key (445 — a verbatim source pin is not a
 * property pin).
 */
const HIS_PRE_REPAIR_REV = '416c6268';

/** The rev `verdict.mjs` carried before Round 444's cure. Asserted by property, same reason. */
const PRE_REV = '626ab6fe';

/**
 * The rev MY OWN Round 444 instrument still carries both defects at. Pinned BEFORE curing it, not
 * after: `H1` and `H2` slice the defective predicate and the retyped loop OUT OF THIS FILE, so
 * sourcing them from HEAD would empty both cells the moment the cure lands — which is the class
 * that has now inverted a cell on this project five times (420/422/436/444, and 377/405/434/435
 * for the promotion half). Asserted below by a PROPERTY, not by the hash.
 */
const MINE_DEFECTIVE_REV = 'c3c6ec49';

// ── Tracked-tree watch, snapshotted before anything runs (440/441). ─────────────────────────────
const statusLines = () => git('status', '--porcelain').split('\n')
  .map((l) => l.match(/^(..) (.*)$/)).filter((m) => m !== null)
  .map((m) => ({ code: m[1], path: m[2] }));
const trackedModified = () => {
  const out = {};
  for (const { code, path } of statusLines()) if (/[MARCD]/.test(code)) out[path] = code;
  return out;
};
const DIRTY_AT_ENTRY = trackedModified();
const BYTES_AT_ENTRY = Object.fromEntries([MINE_REL, HIS_REL, SUBJECT_REL]
  .map((r) => [r, readFileSync(join(REPO, r), 'utf8')]));

const legs = [];
const preds = [];
const leg = (id, what, detail, ok) => legs.push({ id, what, detail, ok });
const pred = (id, what, detail, landed) => preds.push({ id, what, detail, landed });

/** Both graded sources come out of a REV, so every cell is reproducible from a checkout (414/415/416). */
const MINE_SRC = git('show', `${MINE_DEFECTIVE_REV}:${MINE_REL}`);
const MINE_NOW_SRC = git('show', `${REV}:${MINE_REL}`);
const HIS_SRC = git('show', `${REV}:${HIS_REL}`);
const HIS_PRE_SRC = git('show', `${HIS_PRE_REPAIR_REV}:${HIS_REL}`);

/**
 * The pin asserted by PROPERTY: the pinned blob must carry the defective predicate and must NOT
 * carry the cured one. A hash alone would still "hold" if the wrong rev were typed (375/445).
 */
const PIN_HAS_OLD = MINE_SRC.includes('/^GATE: true/.test(hisGate)');
const PIN_HAS_NEW = /topToken/.test(MINE_SRC);

/** Import a source STRING at this directory's depth, so a relative import inside it resolves. */
let scratchN = 0;
const importSource = async (src, tag) => {
  const p = join(HERE, `.scratch-${tag}-${scratchN++}.mjs`);
  writeFileSync(p, src);
  try { return await import(`file://${p}?t=${Date.now()}`); }
  finally { rmSync(p, { force: true }); }
};

/**
 * The four recordings the predicates are graded over — one per bucket of `topToken` plus a control
 * with no verdict line at all. Real committed artifacts of HIS instruments, read as blobs at the
 * rev; `want.old` / `want.new` are pre-registered here, above every cell that reads them, so `H1`
 * and `H5` grade the same population by construction rather than by two hand-kept copies of it.
 */
const ROWS = [
  { bucket: 'GREEN', rel: 'docs/research/round444-instruments/his-round442-instrument.postcommit.out', want: { old: true, new: true } },
  { bucket: 'REFUSED', rel: 'docs/research/round443-instruments/drive6-r445-anchor-guard-repaired.out', want: { old: false, new: null } },
  { bucket: 'RED', rel: 'docs/research/round443-instruments/drive5.final.out', want: { old: false, new: false } },
  { bucket: 'NO-VERDICT (control)', rel: 'docs/research/round444-instruments/his-r443-instrument-dies-at-this-rev.out', want: { old: null, new: null } },
];
const rowText = (rel) => { try { return git('show', `${REV}:${rel}`); } catch (e) { return null; } };

// ═════════════════════════════════════════════════════════════════════════════════════════════════
// H1 — MY `P1` PREDICATE CONFLATES REFUSED WITH RED.
//
// A confusion matrix, not a known positive. Four REAL committed recordings of his instruments —
// one per bucket plus a control that has no verdict at all — read as BLOBS at the rev. Each is
// scored twice: once by the OLD predicate, SLICED out of my own Round 444 source rather than
// retyped (412, applied to myself this time), and once by the lib reader the project already has.
//
// The cell that matters is the REFUSED row. A green leg requires the two predicates to agree on
// three rows and disagree on exactly that one, which is what separates "the old predicate is
// wrong" from "the old predicate is wrong about everything" (418 — a separating key needs a
// confusion matrix, not a known positive).
// ═════════════════════════════════════════════════════════════════════════════════════════════════
{
  // The OLD predicate, sliced from the `P1` block of MY source. The block is isolated first and
  // each of its two constituent tokens asserted to occur exactly ONCE INSIDE IT — `GATE: ` appears
  // twice in the file as a whole (P1 and P2's `pcGate`), so slicing on the file would take the
  // wrong one (426 — `sliced exactly once` does not pin the start anchor).
  const START = '  // P1 — the cure holds under HIS gate, not just under mine.';
  const END = 'hisGate === null ? null : /^GATE: true/.test(hisGate));';
  const i = MINE_SRC.indexOf(START);
  const j = MINE_SRC.indexOf(END, i);
  const startN = MINE_SRC.split(START).length - 1;
  const endN = MINE_SRC.split(END).length - 1;
  const block = i === -1 || j === -1 ? null : MINE_SRC.slice(i, j + END.length);
  const selN = block === null ? -1 : block.split("startsWith('GATE: ')").length - 1;
  const reN = block === null ? -1 : block.split('/^GATE: true/').length - 1;

  const sliceOk = block !== null && startN === 1 && endN === 1 && selN === 1 && reN === 1
    && PIN_HAS_OLD === true && PIN_HAS_NEW === false;

  /** Reconstructed from the two sliced tokens, so a change to either breaks this cell. */
  const oldPredicate = (text) => {
    const line = text.split('\n').find((l) => l.startsWith('GATE: ')) ?? null;
    return line === null ? null : /^GATE: true/.test(line);
  };
  /**
   * The NEW predicate, derived from the branch literals of the shared reader's own `topToken`
   * rather than from a regex over prose (426). `ok` → LANDED, `RED` → REFUTED, `REFUSED` → open.
   */
  const newPredicate = (text) => {
    const rv = readVerdict(text);
    if (rv.ok !== true) return null;
    const t = topToken(rv.verdict.red, rv.verdict.refused);
    return t === 'ok' ? true : t === 'RED' ? false : null;
  };

  const scored = ROWS.map((r) => {
    const text = rowText(r.rel);
    const why = text === null ? `not committed at ${SHORT}` : 'read';
    const o = text === null ? 'UNREADABLE' : oldPredicate(text);
    const n = text === null ? 'UNREADABLE' : newPredicate(text);
    const rv = text === null ? null : readVerdict(text);
    return {
      ...r,
      why,
      old: o,
      new: n,
      agree: o === n,
      asRead: rv === null ? 'UNREADABLE' : rv.ok ? `${rv.verdict.token} red=${JSON.stringify(rv.verdict.red)} refused=${JSON.stringify(rv.verdict.refused)}` : rv.refusal,
    };
  });

  const disagreeing = scored.filter((r) => !r.agree);
  const allWanted = scored.every((r) => r.old === r.want.old && r.new === r.want.new);
  const ok = !sliceOk ? null
    : (allWanted && disagreeing.length === 1 && disagreeing[0].bucket === 'REFUSED');

  leg('H1', 'MY `P1` PREDICATE CANNOT TELL A REFUSED LEG FROM A RED ONE, and the row it is wrong '
    + 'about is the one his repaired instrument actually produces. The predicate is `/^GATE: true/` '
    + 'over the single line starting `GATE: `; his repaired run publishes `GATE: false … REFUSED: '
    + 'G4` with `red=[]`, so nothing graded badly and one leg could not reach its figure — and '
    + 'that scores identically to a run with four red legs. Four real committed recordings, one '
    + 'per bucket plus a no-verdict control, each read as a blob at the rev and scored by BOTH '
    + 'predicates; the old one is sliced out of my own `P1` block, not retyped',
    `slice of my own P1 block, PINNED at ${MINE_DEFECTIVE_REV}: ${sliceOk ? 'OK' : 'REFUSED'} `
    + `(start ${startN}×, end ${endN}× in the blob; \`startsWith('GATE: ')\` ${selN}× and `
    + `\`/^GATE: true/\` ${reN}× INSIDE the block, 1 each required)\n`
    + `        pin by property: defective predicate in the pin ${PIN_HAS_OLD} (true required) · `
    + `cured predicate in the pin ${PIN_HAS_NEW} (false required) · cure live at ${SHORT}: `
    + `${/topToken/.test(MINE_NOW_SRC)} (REPORTED, not gated — H5 grades it)\n`
    + scored.map((r) => `        ${r.bucket.padEnd(21)} ${relative('docs/research', r.rel)}\n`
      + `          read back as: ${r.asRead}\n`
      + `          OLD /^GATE: true/ → ${String(r.old).padEnd(5)} (want ${String(r.want.old)}) · `
      + `NEW topToken → ${String(r.new).padEnd(5)} (want ${String(r.want.new)}) · `
      + `${r.agree ? 'agree' : 'DISAGREE'}`).join('\n')
    + `\n        disagreements: ${disagreeing.length} ${JSON.stringify(disagreeing.map((r) => r.bucket))} `
    + '(exactly 1, at REFUSED, required)',
    ok);
}

// ═════════════════════════════════════════════════════════════════════════════════════════════════
// H2 — `G6` SLICED HIS DATA AND RETYPED HIS GUARD, so it is blind to the repair by construction.
//
// A 2 × 2: {my retyped loop, his sliced loop} × {pre-cure `verdict.mjs`, cured `verdict.mjs`}.
// BOTH loops are sliced — mine out of my source, his out of his — so neither is my paraphrase of
// what the other does. The separating cell is (cured): his loop skips the already-cured edit and
// the scratch module compiles; mine applies it twice and it does not.
//
// The blindness is keyed on the CURE BEING ABSENT from my loop text, not on an anchor being
// present in it (347/389/422/444, and the shape this whole thread is about).
// ═════════════════════════════════════════════════════════════════════════════════════════════════
{
  const sliceOnce = (src, start, endTok, tag) => {
    const i = src.indexOf(start);
    const n = src.split(start).length - 1;
    if (i === -1 || n !== 1) return { ok: false, why: `${tag}: start anchor occurs ${n}×, not 1` };
    const j = src.indexOf(endTok, i);
    if (j === -1) return { ok: false, why: `${tag}: end anchor not found after start` };
    return { ok: true, text: src.slice(i, j + endTok.length) };
  };

  // His CURE_EDITS — the DATA, lifted whole, exactly as Round 444's `G6` lifted it.
  const editsSlice = sliceOnce(HIS_SRC, 'const CURE_EDITS = [', '\n];', 'his CURE_EDITS');
  // His GUARD — the loop that consumes the data. This is what Round 444 did not slice.
  const hisLoopSlice = sliceOnce(HIS_SRC, '  for (const e of CURE_EDITS) {', '\n  }', 'his loop');
  // My retyped loop, out of my own `G6`.
  const myLoopSlice = sliceOnce(MINE_SRC, '    const apply = (src) => {', '\n    };', 'my apply');

  const slicesOk = editsSlice.ok && hisLoopSlice.ok && myLoopSlice.ok;

  let cells = null; let editsN = null; let presentN = null; let myMentionsPresent = null;
  let hisLoopMentionsPresent = null;
  if (slicesOk) {
    const edits = (await importSource(`export default ${editsSlice.text.slice('const CURE_EDITS = '.length)};`, 'edits')).default;
    editsN = edits.length;
    presentN = edits.filter((e) => typeof e.present === 'string' && e.present.length > 0).length;
    myMentionsPresent = /\bpresent\b/.test(myLoopSlice.text);
    hisLoopMentionsPresent = /\bpresent\b/.test(hisLoopSlice.text);

    // Both loops rebuilt from their own sliced text, over the same two subject blobs.
    // Each wrapper names its parameter with the FREE VARIABLE ITS OWN SLICED TEXT USES — mine
    // closes over `edits`, his over `CURE_EDITS` — so neither slice is edited to fit the harness.
    const mod = await importSource(
      'export const mine = (edits, src) => {\n'
      + `${myLoopSlice.text.replace('    const apply = (src) => {', '  const apply = (src) => {')}\n`
      + '  return apply(src);\n};\n'
      + 'export const his = (CURE_EDITS, original) => {\n  let cured = original;\n'
      + '  const editStates = [];\n  const anchorCounts = [];\n'
      + `${hisLoopSlice.text}\n`
      + '  return { cured, editStates, anchorCounts };\n};\n', 'loops');

    const SUBJECTS = [
      { tag: 'PRE-CURE verdict.mjs @626ab6fe', src: git('show', `${PRE_REV}:${SUBJECT_REL}`) },
      { tag: `CURED verdict.mjs @${SHORT}`, src: git('show', `${REV}:${SUBJECT_REL}`) },
    ];
    const tryImport = async (src, tag) => {
      try { await importSource(src, tag); return 'IMPORTS'; }
      catch (e) { return `${e.name}: ${e.message.slice(0, 46)}`; }
    };
    cells = [];
    for (const s of SUBJECTS) {
      cells.push({
        loop: 'MINE (retyped, anchor-only)', subject: s.tag,
        result: await tryImport(mod.mine(edits, s.src), 'm'), states: null,
      });
      const h = mod.his(edits, s.src);
      cells.push({
        loop: 'HIS (sliced, present-keyed)', subject: s.tag,
        result: await tryImport(h.cured, 'h'), states: h.editStates,
      });
    }
  }

  const want = {
    'MINE (retyped, anchor-only)|PRE-CURE': 'IMPORTS',
    'MINE (retyped, anchor-only)|CURED': 'SyntaxError',
    'HIS (sliced, present-keyed)|PRE-CURE': 'IMPORTS',
    'HIS (sliced, present-keyed)|CURED': 'IMPORTS',
  };
  const key = (c) => `${c.loop}|${c.subject.startsWith('PRE-CURE') ? 'PRE-CURE' : 'CURED'}`;
  const matched = cells === null ? null
    : cells.every((c) => (want[key(c)] === 'IMPORTS' ? c.result === 'IMPORTS' : /SyntaxError/.test(c.result)));
  const ok = !slicesOk || cells === null ? null
    : (matched
      && presentN === editsN && editsN === 2
      && myMentionsPresent === false && hisLoopMentionsPresent === true);

  leg('H2', 'ROUND 444 `G6` SLICED HIS DATA AND RETYPED HIS GUARD, which is why it still reports '
    + '`SyntaxError` on the cured blob one rev after he repaired it. His Round 445 fix is in the '
    + 'GUARD — each edit carries a `present` marker and an already-cured edit is skipped — and my '
    + 'hand-written loop has no model of `present` at all, so the cell cannot move no matter what '
    + 'he does to it. Both loops are SLICED here, mine from my source and his from his, and run '
    + 'over the same two pinned subject blobs. The blindness is keyed on `present` being ABSENT '
    + 'from my loop text, not on an anchor being present in it',
    `slices: his CURE_EDITS ${editsSlice.ok ? 'OK' : editsSlice.why} · his loop `
    + `${hisLoopSlice.ok ? 'OK' : hisLoopSlice.why} · my apply ${myLoopSlice.ok ? 'OK' : myLoopSlice.why}\n`
    + `        his edits: ${editsN ?? '—'}, of which carrying a non-empty \`present\`: ${presentN ?? '—'} `
    + `(all required) · my sliced loop mentions \`present\`: ${myMentionsPresent} (false required) · `
    + `his sliced loop mentions it: ${hisLoopMentionsPresent} (true required)\n`
    + (cells === null ? '        cells: UNREACHABLE'
      : cells.map((c) => `        ${c.loop.padEnd(28)} × ${c.subject.padEnd(32)} → ${c.result}`
        + `${c.states === null ? '' : ` ${JSON.stringify(c.states)}`}`).join('\n')),
    ok);
}

// ═════════════════════════════════════════════════════════════════════════════════════════════════
// H3 — THE SUCCESSOR TO `G6`: grade his repair, do not assert the defect.
//
// Round 444's `G6` required his instrument to die with no verdict, so his repair REDDENS it —
// the probe that found the defect was asserting it (the same shape as Round 384's). The honest
// successor runs his instrument twice against TODAY's cured tree: once as the PINNED pre-repair
// blob, once as the working-tree copy. Defect PRESENT at the pin, ABSENT in the tree.
//
// The pre-repair blob is written at THIS directory's depth, so its own `HERE/../../..` still
// resolves to the repo root (421). The pin is asserted by a PROPERTY — no `present:` key, and the
// anchor-only guard text — not by its hash (375/445).
// ═════════════════════════════════════════════════════════════════════════════════════════════════
{
  const pinHasPresent = /\n\s*present:/.test(HIS_PRE_SRC);
  const pinHasAnchorGuard = HIS_PRE_SRC.includes('if (n === 1) {')
    || /const n = cured\.split\(e\.anchor\)\.length - 1;/.test(HIS_PRE_SRC);
  const treeHasPresent = /\n\s*present:/.test(HIS_SRC);
  const pinOk = pinHasPresent === false && pinHasAnchorGuard === true && treeHasPresent === true;

  // `stdio` is PINNED. `execFileSync`'s default echoes the child's stderr to the parent's in
  // addition to capturing it, so drive 2 of this round wrote his pre-repair blob's 18-line
  // `SyntaxError` trace into the head of its own recording, ahead of the `SUBJECTS:` line — a
  // committed `.out` carrying another process's crash. Captured only, never inherited.
  const run = (absPath) => {
    try {
      return execFileSync('node', [absPath], {
        encoding: 'utf8', maxBuffer: 1 << 28, cwd: REPO,
        stdio: ['ignore', 'pipe', 'pipe'],
        env: { ...process.env, KLATCH_R446_DEPTH: String(DEPTH + 1) },
      });
    } catch (e) { return (e.stdout ?? '') + (e.stderr ?? ''); }
  };

  let pinOut = null;
  if (pinOk) {
    const p = join(HERE, '.scratch-his-pre-repair.mjs');
    writeFileSync(p, HIS_PRE_SRC);
    try { pinOut = run(p); } finally { rmSync(p, { force: true }); }
  }
  const treeOut = run(join(REPO, HIS_REL));

  const rd = (t) => (t === null ? null : readVerdict(t));
  const pinV = rd(pinOut);
  const treeV = rd(treeOut);
  const lines = (t) => (t === null ? 0 : t.split('\n').length);
  const legLines = (t) => (t === null ? 0 : t.split('\n').filter((l) => /^(?: ok |FAIL|REF ) G/.test(l)).length);

  // The defect is "publishes NOTHING at all": no verdict line AND no leg lines. Both conjuncts
  // read, so a run that printed legs but lost its tail cannot pass as the same defect.
  const pinDied = pinV !== null && pinV.ok === false && pinV.refusal === 'NO_VERDICT_LINE' && legLines(pinOut) === 0;
  const treeLives = treeV !== null && treeV.ok === true && legLines(treeOut) > 0;
  const ok = !pinOk || pinOut === null ? null : (pinDied && treeLives);

  leg('H3', 'HIS REPAIR IS REAL, GRADED AS A 2 × 2 AGAINST THE PINNED PRE-REPAIR BLOB rather than '
    + 'by asserting the defect. Round 444 `G6` required his instrument to die with no verdict, so '
    + 'it reddens on the repair it asked for — drive 1 of this round reads `red=[G6]` against a '
    + 'tree where cure and repair are both in and both correct. This leg instead runs his '
    + 'instrument twice against TODAY\'s cured tree: his pre-repair blob must still publish '
    + 'NOTHING (no verdict line AND no leg lines, both read), and his working-tree copy must '
    + 'publish a verdict line my reader accepts. That is what attributes the change to the repair '
    + 'rather than to the tree moving under both',
    `pin ${HIS_PRE_REPAIR_REV} asserted by property, not hash: \`present:\` key in the pin `
    + `${pinHasPresent} (false required) · anchor-only guard in the pin ${pinHasAnchorGuard} `
    + `(true required) · \`present:\` in the working tree ${treeHasPresent} (true required)\n`
    + `        HIS PRE-REPAIR BLOB vs today's cured tree: ${pinV === null ? 'NOT RUN' : (pinV.ok ? pinV.verdict.token : pinV.refusal)} · `
    + `${lines(pinOut)} line(s), ${legLines(pinOut)} leg line(s) · first error: `
    + `${(pinOut ?? '').split('\n').find((l) => /Error/.test(l))?.slice(0, 72) ?? '(none)'}\n`
    + `        HIS WORKING TREE vs the same tree: ${treeV === null ? 'NOT RUN' : (treeV.ok ? `${treeV.verdict.token} red=${JSON.stringify(treeV.verdict.red)} refused=${JSON.stringify(treeV.verdict.refused)}` : treeV.refusal)} · `
    + `${lines(treeOut)} line(s), ${legLines(treeOut)} leg line(s)`,
    ok);

  // ═══════════════════════════════════════════════════════════════════════════════════════════════
  // P1′ — Round 444's `P1`, RE-SCORED under the repaired predicate, off the live run above.
  //
  // Round 444 left it `prefused`. It is now scorable, and the answer is REFUSED AGAIN — for a
  // different reason, which is the point: his gate is false because `G4` cannot REACH its figure
  // (`red=[]`), not because a leg graded the cure badly. The old predicate scores this REFUTED and
  // would have published "his instrument says my cure is wrong" off a leg that said nothing at all.
  // ═══════════════════════════════════════════════════════════════════════════════════════════════
  const scoreP1 = (text) => {
    const rv = readVerdict(text);
    if (rv.ok !== true) return { landed: null, why: `his output is unreadable: ${rv.refusal}` };
    const t = topToken(rv.verdict.red, rv.verdict.refused);
    if (t === 'ok') return { landed: true, why: 'his gate is green: red=[] refused=[]' };
    if (t === 'RED') return { landed: false, why: `his gate is RED on ${JSON.stringify(rv.verdict.red)} — a leg GRADED the tree badly` };
    return { landed: null, why: `his gate is REFUSED on ${JSON.stringify(rv.verdict.refused)} with red=[] — no leg graded the tree badly; the figure was unreachable` };
  };
  const s = treeOut === null ? { landed: null, why: 'his instrument was not run' } : scoreP1(treeOut);
  const oldWouldSay = treeOut === null ? null
    : (() => {
      const l = treeOut.split('\n').find((x) => x.startsWith('GATE: ')) ?? null;
      return l === null ? null : /^GATE: true/.test(l);
    })();

  pred('P1', 'ROUND 444 `P1`, RE-SCORED UNDER THE REPAIRED PREDICATE — the deferral is taken, and '
    + 'the answer is REFUSED for a SECOND, different reason. Round 444 left this `prefused` with '
    + 'one named blocker: his anchor-presence guard. `62e023ca` lifted it. Scored off the live run '
    + 'in `H3` with the `topToken` predicate, his gate is REFUSED, not RED — `G4` cannot reach its '
    + 'figure because my own §4 cure rewrote the block its slicer keys on, and `red=[]`. The old '
    + '`/^GATE: true/` predicate scores the same output REFUTED, which is Round 444\'s prose '
    + '("scoring this REFUTED would blame the cure") violated by the predicate printed below it',
    `his live verdict: ${treeOut === null ? 'NOT RUN' : (readVerdict(treeOut).ok ? readVerdict(treeOut).verdict.token : readVerdict(treeOut).refusal)}\n`
    + `        NEW predicate → ${s.landed === null ? 'REFUSED (open)' : s.landed ? 'LANDED' : 'REFUTED'} — ${s.why}\n`
    + `        OLD predicate → ${oldWouldSay === null ? 'open' : oldWouldSay ? 'LANDED' : 'REFUTED'} `
    + `${oldWouldSay === false && s.landed === null ? '← THE DEFECT: a manufactured refutation' : ''}`,
    s.landed);
}

// ═════════════════════════════════════════════════════════════════════════════════════════════════
// H5 — THE CURE, DRIVEN IN THE SUBJECT, NOT PROPOSED (321/368 — a routed finding does not validate
// its routed cure).
//
// `H1` proves the old predicate is wrong, off a PINNED blob. That says nothing about whether the
// fix landed. This leg SLICES the cured predicate out of the Round 444 instrument's WORKING-TREE
// copy and scores it over the same four recordings `H1` uses — the same `ROWS`, not a second
// hand-kept copy — and requires the REFUSED row to come back `null`.
//
// It REFUSES rather than reddens while the cure is absent, so this file is honest at the rev it
// was written at and lands at the rev the cure is committed at (436 — an instrument that cannot
// refuse manufactures findings).
// ═════════════════════════════════════════════════════════════════════════════════════════════════
{
  const TREE_SRC = readFileSync(join(REPO, MINE_REL), 'utf8');
  const START = '  // P1 — the cure holds under HIS gate, not just under mine.';
  const END = 'pred(\'P1\',';
  const i = TREE_SRC.indexOf(START);
  const j = TREE_SRC.indexOf(END, i);
  const startN = TREE_SRC.split(START).length - 1;
  const block = i === -1 || j === -1 || startN !== 1 ? null : TREE_SRC.slice(i, j);

  // TWO slices, because one cannot do both jobs. `block` is the evaluable part — the lines that
  // compute the score, ending at the `pred(` call. But the old predicate LIVES INSIDE that call,
  // as its fourth argument, so checking `block` for `/^GATE: true/` is structurally false in the
  // DEFECTIVE file too: drive 4 printed `still contains /^GATE: true/ false` with the cure
  // absent. A conjunct the slice boundary makes true cannot be re-keyed red (380/381/385/386).
  // `region` runs to the start of the `P2` block and therefore spans the whole `pred` call.
  const P2_START = '  // P2 — my own promotion moves the adoption cell';
  const k = TREE_SRC.indexOf(P2_START, i);
  const p2N = TREE_SRC.split(P2_START).length - 1;
  const region = i === -1 || k === -1 || p2N !== 1 ? null : TREE_SRC.slice(i, k);

  // The cure is recognised by what it READS, not by a comment claiming it. Both tokens required.
  const usesReader = region !== null && /readVerdict\s*\(/.test(region);
  const usesTopToken = region !== null && /topToken\s*\(/.test(region);

  // `stillHasOld` is keyed on the retired predicate's ROLE, not on its bytes. A region-wide
  // `includes('/^GATE: true/')` goes true on the CURED file too, because the cure's own comment
  // explains what it replaced and its detail line prints the contrast — a correction that quotes
  // the wrong spelling re-trips the detector (371/383). What matters is whether the old predicate
  // is still the SCORER, so this reads the final argument of the `pred('P1', …)` call: the value
  // the prediction is actually scored on. Quoting it anywhere else is prose and does not count.
  const callIdx = region === null ? -1 : region.indexOf("pred('P1',");
  const predCall = callIdx === -1 ? null : region.slice(callIdx);
  const closeIdx = predCall === null ? -1 : predCall.lastIndexOf(');');
  const finalArg = closeIdx === -1 ? null : predCall.slice(0, closeIdx).split('\n').pop().trim();
  const stillHasOld = finalArg === null ? true : finalArg.includes('/^GATE: true/');

  let scored = null; let evalWhy = 'cure absent';
  if (block !== null && region !== null && usesReader && usesTopToken && !stillHasOld) {
    try {
      // The sliced block is evaluated as a function of the text, with the lib injected the same
      // way the subject imports it. A slice that does not evaluate REFUSES; it is never retyped.
      const mod = await importSource(
        // Both spellings are bound. The subject imports the emitter dynamically as `NEW` — which
        // IS this same `../lib/verdict.mjs`, read off the working tree — and `G6` beside this
        // block already says `NEW.readVerdict`, so the slice is evaluable whichever it uses.
        `import { readVerdict, topToken } from '../lib/verdict.mjs';\n`
        + 'const NEW = { readVerdict, topToken };\n'
        + 'export const score = (HIS_OUT) => {\n'
        + `${block}\n`
        + '  return hisVerdict;\n};\n', 'cured-pred');
      scored = ROWS.map((r) => {
        const text = rowText(r.rel);
        let got = 'UNREADABLE';
        if (text !== null) { try { got = mod.score(text); } catch (e) { got = `THREW: ${e.message.slice(0, 40)}`; } }
        return { ...r, got, agree: got === r.want.new };
      });
      evalWhy = 'sliced and evaluated';
    } catch (e) { evalWhy = `slice did not evaluate: ${e.message.slice(0, 60)}`; }
  }

  const ok = scored === null ? null : scored.every((r) => r.agree);
  leg('H5', 'THE CURED PREDICATE IS IN THE SUBJECT AND SCORES THE REFUSED ROW AS REFUSED — sliced '
    + 'out of the Round 444 instrument\'s WORKING-TREE copy and run over the same four recordings '
    + '`H1` grades the old one against, so the two legs cannot disagree about the population. The '
    + 'cure is recognised by the predicate READING `readVerdict` and `topToken` and no longer '
    + 'containing `/^GATE: true/` — by what it does, not by a comment saying it was fixed. While '
    + 'the cure is absent this leg REFUSES; it does not redden',
    `cure in the working-tree copy of ${MINE_REL}: evaluable block sliced ${block !== null} `
    + `(start ${startN}×, 1 required) · P1 REGION sliced ${region !== null} (P2 anchor ${p2N}×, 1 `
    + `required; the region spans the \`pred(\` call, the block does not — drive 4's `
    + `\`stillHasOld\` was read off the block and was false with the cure ABSENT) · reads `
    + `\`readVerdict\` ${usesReader} · reads \`topToken\` ${usesTopToken}\n`
    + `        the value P1 is SCORED on (final argument of the \`pred\` call, not a quote of the `
    + `old spelling anywhere in the region): ${finalArg === null ? 'UNREADABLE' : JSON.stringify(finalArg)} `
    + `· is the retired predicate ${stillHasOld} (false required) · ${evalWhy}\n`
    + (scored === null ? '        rows: NOT SCORED — the cure is not in the subject yet'
      : scored.map((r) => `        ${r.bucket.padEnd(21)} cured predicate → ${String(r.got).padEnd(5)} `
        + `(want ${String(r.want.new)}) · ${r.agree ? 'agree' : 'DISAGREE'}`).join('\n')),
    ok);
}

// ═════════════════════════════════════════════════════════════════════════════════════════════════
// H4 — THE TRACKED TREE. His instrument is driven in place twice above, and a scratch copy of his
// pre-repair blob is written into this directory, so this is the cell that catches either having
// left something behind (440/441 — a drive can re-stamp someone else's recording).
// ═════════════════════════════════════════════════════════════════════════════════════════════════
{
  const now = trackedModified();
  const foreign = Object.keys(now).filter((p) => !(p in DIRTY_AT_ENTRY));
  const changed = Object.entries(BYTES_AT_ENTRY)
    .filter(([r, b]) => readFileSync(join(REPO, r), 'utf8') !== b).map(([r]) => r);
  const scratchLeft = ['.scratch-his-pre-repair.mjs']
    .filter((f) => existsSync(join(HERE, f)));
  leg('H4', 'THIS DRIVE REWROTE NO COMMITTED RECORDING AND LEFT NO SCRATCH FILE BEHIND. His '
    + 'instrument is executed in place twice and his pre-repair blob is written into this '
    + 'directory at the depth its own `HERE` needs, so both are caught here',
    `tracked MODIFIED on entry (not this drive's): ${Object.keys(DIRTY_AT_ENTRY).length} `
    + `${JSON.stringify(Object.keys(DIRTY_AT_ENTRY))} · MODIFIED by this drive: ${foreign.length} `
    + `${JSON.stringify(foreign)} · subjects byte-identical at exit: ${changed.length === 0} `
    + `${JSON.stringify(changed)} · scratch files left: ${scratchLeft.length} ${JSON.stringify(scratchLeft)}`,
    foreign.length === 0 && changed.length === 0 && scratchLeft.length === 0);
}

// ═════════════════════════════════════════════════════════════════════════════════════════════════
// TAIL — emitted by the shared emitter, which throws rather than publishing a line its own reader
// refuses (443/444).
// ═════════════════════════════════════════════════════════════════════════════════════════════════
const out = [];
out.push(`SUBJECTS: ${MINE_REL} (the defective instrument) · ${HIS_REL}`);
out.push(`REV: ${SHORT}   his pre-repair blob pinned at: ${HIS_PRE_REPAIR_REV}   `
  + `pre-cure subject blob: ${PRE_REV}   depth: ${DEPTH}`);
out.push('');
// Rows in the same grammar Rounds 443/444 print, so `legLines` above and the row reader downstream
// see the shape they key on. `renderRows` drops the detail, which is the evidence, so the rows are
// emitted here and the lib call is kept beside them as the token source.
const TOKEN = Object.fromEntries(renderRows([{ id: 'x', ok: true }, { id: 'x', ok: false }, { id: 'x', ok: null }])
  .map((r, i) => [String([true, false, null][i]), r.split(' ')[2]]));
for (const l of legs) {
  const t = TOKEN[String(l.ok)];
  out.push(`${t === 'ok' ? ' ok ' : t === 'RED' ? 'FAIL' : 'REF '} ${l.id}  ${l.what}`);
  out.push(`        ${l.detail}`);
}
out.push('');
for (const p of preds) {
  out.push(`${p.landed === null ? 'REFUSED ' : p.landed ? 'LANDED  ' : 'REFUTED '} ${p.id}  ${p.what}`);
  out.push(`        ${p.detail}`);
}
out.push('');
const line = renderVerdict({ legs, preds });
out.push(line);
console.log(out.join('\n'));

const rt = readVerdict(line);
if (rt.ok !== true) { console.log(`SELF-CHECK FAILED: ${rt.refusal}`); process.exit(2); }
process.exit(rt.verdict.red.length > 0 ? 1 : 0);
