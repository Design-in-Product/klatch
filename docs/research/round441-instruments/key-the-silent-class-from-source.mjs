/**
 * Round 441 — his Round 440 routed me a fifth state: "names no failing legs at all" is not
 * "grammar unknown", and his `G9` reports FIVE of eleven members in that class. The state is real
 * and this round takes it. The DENOMINATOR is not.
 *
 * His `G9` is measured, in his own words, "from emitted lines with no source model". Every member
 * of that five-member class is GREEN. A green instrument's `GATE: true` line carries no leg-id
 * label *because it is true* — round431 prints `, RED: G7 | G8)` today and would print nothing but
 * `(11 leg(s))` the moment its legs went green. So "no label observed on a true line" and "this
 * emitter has no label grammar" are the same observation under his key, and the class he routed is
 * keyed on GREENNESS, not on capability. That is 380/381/385/386 (a conjunct a filter makes true
 * cannot be re-keyed red) sitting underneath the number, and the separator is the source read his
 * own `G4` REFUSED on.
 *
 * ## What each leg is pointed at
 *
 * `G1` — his Round 440 reproduces, driven unmodified as this fire's first action, before this file
 * existed, from a tree verified clean against HEAD first. The verdict pin is his MEMO's §6 figure
 * typed from the memo, so agreement is three-way: his sentence, his recording, my drive. Every
 * differing line must be accounted for by a class enumerated before the diff was read.
 *
 * `G2` — the population, re-derived here from his Round 439 mechanism (`ls-tree` at a stamped rev,
 * never `ls-files` — 414/415/416; module by content read AT the rev; round cut by a derived key)
 * and then REQUIRED to agree with the member rows sliced out of my own recording of his drive.
 *
 * `G3` — THE HAND READING, and it is primary (the population is nine emitting members, so a
 * detector is the thing being graded, not the source of truth). Each member's capability is
 * declared below as a literal, together with the source ANCHOR the reading rests on, and the leg
 * reddens unless every anchor occurs EXACTLY ONCE in that member's blob at the rev (347/389/422,
 * 408 — a hand-typed anchor is not a slice, so the occurrence is counted in the file, not asserted).
 *
 * `G4` — the REGION-CUT detector, which is the thing his `G4` refused for want of one: the gate
 * line is assembled across several statements, so the cut has to be the whole statement including
 * its `+` continuations, not a line or a statement head. Graded against `G3` as a confusion matrix
 * in BOTH directions — `tp > 0` and `tn > 0` and no `fp` and no `fn`, because a detector that
 * answers "capable" everywhere passes one half by itself (418).
 *   Its key covers BOTH quote styles. round433 emits its gate line by single-quote concatenation
 *   (`'\nGATE: ' + …`); a backtick-only key — the obvious one, and the one I wrote first in my head
 *   — misses it entirely and would have returned a SMALLER number (398). round433 is carried as a
 *   known positive for exactly that axis.
 *
 * `G5` — his published five, re-keyed, and the 2 × 2 that shows why the key cannot produce a number:
 * (emitted state) × (source capability) over the whole population.
 *
 * `G6` — the fifth state, BUILT. A positively keyed reader over (emitted gate line, source
 * capability) with every state keyed on something it must match, and no fall-through default
 * (411/439 — after curing one terminal bucket, key every OTHER value the same function derives).
 * Reddens if any member matches zero states or two.
 *
 * `G7` — mine, and it extends his §3. He named the mechanism as "any member may write anywhere in
 * the tree" and cured it with a before/after drive snapshot whose stated limitation is that "in a
 * tree already carrying the damage it reports 0 — it catches the first drive, not the tenth". The
 * mechanism is narrower than that and STATIC: three unconditional `writeFileSync` sites whose
 * target is a path that is TRACKED at the rev. A source census of those needs no drive at all, and
 * so reports the tenth drive as readily as the first.
 *
 * `G8` — the figure his detector structurally cannot take: for each tracked write target, how many
 * commits have changed its content since the commit that introduced it. The damage is not a
 * working-tree hazard that a `git checkout` undoes; it is committed, and several generations deep.
 *
 * `G9` — hygiene, measured ABSOLUTELY against HEAD rather than as a before/after difference, with
 * this instrument's own output directory excluded by path (425).
 *
 * Drives nothing: this instrument spawns no child and reads his drive out of my committed recording
 * of it, so there is no depth hazard to guard and `G9` says so by measuring instead of asserting.
 */

import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..', '..');
const git = (...a) => execFileSync('git', ['-C', REPO, ...a], { encoding: 'utf8', maxBuffer: 1 << 28 });

const REV = git('rev-parse', 'HEAD').trim();
const SHORT = REV.slice(0, 8);
const HIS_ROUND = 437; // the round whose G9 population is the subject — his key, not mine
const MY_DIR_REL = 'docs/research/round441-instruments';

// Absolute hygiene snapshot, taken before anything below runs.
const dirtyVsHead = () => git('diff', '--name-only', 'HEAD').split('\n').filter((l) => l !== '');
const DIRTY_AT_ENTRY = dirtyVsHead();

const legs = [];
const preds = [];
const leg = (id, what, detail, ok) => legs.push({ id, what, detail, ok, gate: true });
const pred = (id, what, detail, landed) => preds.push({ id, what, detail, landed });

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// The population key — his Round 439 mechanism, written here rather than imported or copied.
// `myRound` and `graderRe` are parameters so a crippled key can be driven (414).
// ─────────────────────────────────────────────────────────────────────────────────────────────────
function populationOf(rev, myRound, graderRe) {
  const all = git('ls-tree', '-r', '--name-only', rev, 'docs/research/').split('\n')
    .filter((f) => f.endsWith('.mjs'))
    .filter((f) => {
      try { return git('show', `${rev}:${f}`).includes('refusal-convention'); } catch { return false; }
    });
  const roundOf = (p) => Number(p.match(/round(\d+)-instruments/)?.[1] ?? NaN);
  return {
    all,
    later: all.filter((f) => !(roundOf(f) < myRound)),
    graders: all.filter((f) => roundOf(f) < myRound && graderRe.test(f)),
    roundOf,
  };
}

const KEY = {
  myRound: Number.parseInt(process.env.KLATCH_R441_MYROUND ?? String(HIS_ROUND), 10),
  graderRe: new RegExp(process.env.KLATCH_R441_GRADERRE ?? 'grade|attack'),
  quoteStyles: (process.env.KLATCH_R441_QUOTES ?? 'all'),
};
const CRIPPLED = ['KLATCH_R441_MYROUND', 'KLATCH_R441_GRADERRE', 'KLATCH_R441_QUOTES']
  .filter((k) => process.env[k] !== undefined);

const POP = populationOf(REV, KEY.myRound, KEY.graderRe);
const roundKeyOf = (p) => `round${POP.roundOf(p)}`;

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// G1 — his Round 440 reproduces.
// ─────────────────────────────────────────────────────────────────────────────────────────────────
{
  // His memo §6 and README, typed from the memo. Two lines, both published.
  const HIS_GATE = 'GATE: false   (10 leg(s))   RED: G6, G10   REFUSED: G4';
  const HIS_PREDS = 'PREDICTIONS: 1 landed, 0 refuted, 1 refused: P2';
  const mineP = join(HERE, 'reproduce-his-round440.out');
  const hisP = join(REPO, 'docs/research/round440-instruments/drive4.final.out');
  const mine = existsSync(mineP) ? readFileSync(mineP, 'utf8').split('\n') : null;
  const his = existsSync(hisP) ? readFileSync(hisP, 'utf8').split('\n') : null;

  if (mine === null || his === null) {
    leg('G1', 'HIS ROUND 440 REPRODUCES', 'REFUSED — a recording is missing', null);
  } else {
    const gl = mine.find((l) => l.startsWith('GATE: ')) ?? null;
    const pl = mine.find((l) => l.startsWith('PREDICTIONS: ')) ?? null;
    // The stamp substituted for mine is read out of the TRAILER OF EACH RECORDING, never from live
    // HEAD: his own G1 reddened this round for sourcing it from HEAD after HEAD moved (420/422/436).
    const stampOf = (ls) => ls.map((l) => l.match(/^ {2}rev ([0-9a-f]{8})/)?.[1]).find((x) => x) ?? null;
    const myStamp = stampOf(mine);
    const hisStamp = stampOf(his);
    const n = Math.max(mine.length, his.length);
    const diff = [];
    for (let i = 0; i < n; i += 1) if ((mine[i] ?? '\u0000') !== (his[i] ?? '\u0000')) diff.push(i);
    // Classes enumerated BEFORE the diff was read: a rev stamp, a dirty flag, a wall-clock elapsed,
    // or a rev-dependent census count in his G2 header. The last is admitted only under an
    // assertion that the `population N, M graders` tail is character-identical (357/375).
    const substituted = (s) => (myStamp === null || hisStamp === null) ? s
      : s.split(myStamp).join(hisStamp).replace(/\b\d+ ?ms\b/g, 'Nms');
    const explained = [];
    const census = [];
    const entryDirty = [];
    const unexplained = [];
    const tailOf = (s) => s.match(/population \d+, (\d+) graders/)?.[1] ?? null;
    // Third admitted class, and it is a FINDING rather than a mask: his own G10 prints how many
    // tracked files the DRIVING TREE was already carrying as dirty on entry. That is a property of
    // whose worktree the drive ran in, not of the instrument, and it moved. Admitted only under an
    // assertion that the `dirtied by this drive: N [list]` prefix — the figure the leg is about —
    // is character-identical (357/375: re-aim the pin, do not loosen it).
    const entryOf = (s) => s.match(/^(\s*tracked files dirtied by this drive: .*?) · tracked already dirty on entry \(not this drive's\): (\d+)$/);
    for (const i of diff) {
      const a = his[i] ?? '';
      const b = mine[i] ?? '';
      if (substituted(b) === a) { explained.push(i); continue; }
      const ha = a.match(/^\s*tree at [0-9a-f]+: (\d+) name the module · round >= \d+ excluded: (\d+)/);
      const hb = b.match(/^\s*tree at [0-9a-f]+: (\d+) name the module · round >= \d+ excluded: (\d+)/);
      if (ha && hb && tailOf(a) !== null && tailOf(a) === tailOf(b)) {
        census.push({ i, moved: `name the module ${ha[1]}→${hb[1]}, excluded ${ha[2]}→${hb[2]}`, tail: tailOf(a) });
        continue;
      }
      const ea = entryOf(a);
      const eb = entryOf(b);
      if (ea && eb && ea[1] === eb[1]) {
        entryDirty.push({ i, his: ea[2], mine: eb[2] });
        continue;
      }
      unexplained.push(i);
    }
    const ok = gl === HIS_GATE && pl === HIS_PREDS && diff.length > 0 && unexplained.length === 0;
    leg('G1', 'HIS ROUND 440 REPRODUCES — driven unmodified as this fire\'s first action, out of a '
      + 'tree verified clean against HEAD beforehand, before this file existed. The verdict pin is '
      + 'his MEMO\'s §6 figure typed from the memo, which makes the agreement three-way: his '
      + 'sentence, his recording, my drive. Every differing line is then accounted for by a class '
      + 'enumerated BEFORE the diff was read — rev stamp, dirty flag, wall-clock elapsed — or by '
      + 'the rev-dependent census counts in his G2 header, admitted only under an assertion that '
      + 'the `population N, M graders` tail is character-identical. The stamp substituted is read '
      + 'out of the TRAILER OF EACH RECORDING, never from live HEAD (420/422/436)',
      `${gl} · ${pl}\n        his stamp ${hisStamp ?? 'ABSENT'} · my stamp ${myStamp ?? 'ABSENT'}`
      + ` · whole-file diff ${JSON.stringify(diff)} · stamps/elapsed ${JSON.stringify(explained)}`
      + ` · rev-dependent census ${JSON.stringify(census.map((c) => c.i))}`
      + ` · entry-dirty ${JSON.stringify(entryDirty.map((c) => c.i))}`
      + ` · UNEXPLAINED ${JSON.stringify(unexplained)}`
      + census.map((c) => `\n        line ${c.i} moved: ${c.moved} — population tail identical (${c.tail} graders)`).join('')
      + entryDirty.map((c) => `\n        line ${c.i} moved: tracked files ALREADY DIRTY on entry — his tree ${c.his}, mine ${c.mine}`
        + ' — the dirtied-by-this-drive list is character-identical; the driving tree is not the instrument').join(''),
      ok);
  }
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// G2 — the population, derived independently and then required to agree with his drive's rows.
// ─────────────────────────────────────────────────────────────────────────────────────────────────
let AGREED_MEMBERS = null;
{
  // His Round 440 does NOT print one `<STATE> <path>` row per member the way his Round 439 did;
  // its rows are keyed by round directory (`GREEN round413 → …`) and its size is in the G2 header
  // tail. Drive 1 of this instrument pointed HIS Round 439 row reader at his Round 440 recording
  // and sliced **0 rows**, then published `identical: false` — a reader copied by shape instead of
  // written against the recording in front of it (412). Both of his surfaces are read here, and
  // both must agree with mine.
  const recP = join(HERE, 'reproduce-his-round440.out');
  let hisGraders = null; // the count, from his G2 header tail
  let hisRoundKeys = null; // the member identities he prints, from his G9 rows
  if (existsSync(recP)) {
    const txt = readFileSync(recP, 'utf8');
    const t = txt.match(/population \d+, (\d+) graders/);
    hisGraders = t ? Number(t[1]) : null;
    const keys = txt.split('\n')
      .map((l) => l.match(/^\s{8}(?:GREEN|RED|UNGRADEABLE|REFUSED)\s+(round\d+) → /))
      .filter((x) => x).map((x) => x[1]);
    hisRoundKeys = keys.length ? [...new Set(keys)].sort() : null;
  }
  const mine = [...POP.graders].sort();
  const myRoundKeys = [...new Set(mine.map(roundKeyOf))].sort();
  const countAgrees = hisGraders === null ? null : hisGraders === mine.length;
  // His G9 only prints the members that EMIT a gate line, so his key set is a subset of mine; the
  // assertion is containment in that direction, plus the count agreeing on the whole population.
  const keysContained = hisRoundKeys === null ? null : hisRoundKeys.every((k) => myRoundKeys.includes(k));
  const agree = countAgrees === null || keysContained === null ? null : (countAgrees && keysContained);
  if (agree === true) AGREED_MEMBERS = mine;
  leg('G2', 'THE POPULATION, DERIVED INDEPENDENTLY AND THEN REQUIRED TO AGREE — on BOTH surfaces '
    + 'his recording offers, because drive 1 of this instrument read neither. The key is written '
    + 'from his Round 439 mechanism — `ls-tree` at a stamped rev rather than `ls-files` '
    + '(414/415/416), the module read AT the rev, the round cut by a derived key. Drive 1 pointed '
    + 'his Round 439 `<STATE> <path>` row reader at his Round 440 recording, which prints neither '
    + 'of those tokens, sliced 0 rows and published `identical: false` — a reader copied by shape '
    + 'rather than written against the recording in front of it (412). The sizes are MEASUREMENTS: '
    + 'a count here reddens on its own promotion (377/405/434/435)',
    agree === null ? `REFUSED — could not slice ${hisGraders === null ? 'his grader count' : 'his member rows'} out of the recording`
      : `tree at ${SHORT}: ${POP.all.length} name the module · round >= ${KEY.myRound} excluded: `
        + `${POP.later.length} · population ${POP.graders.length} graders`
        + `${CRIPPLED.length ? ` · KEY CRIPPLED by ${JSON.stringify(CRIPPLED)}` : ''}`
        + `\n        his G2 header tail: ${hisGraders} graders · mine ${mine.length} · agree: ${countAgrees}`
        + `\n        his G9 round keys (emitting members only) ${hisRoundKeys.length} ${JSON.stringify(hisRoundKeys)}`
        + `\n        mine ${myRoundKeys.length} ${JSON.stringify(myRoundKeys)} · his ⊆ mine: ${keysContained}`
        + (keysContained ? '' : `\n        ONLY HIS: ${JSON.stringify(hisRoundKeys.filter((k) => !myRoundKeys.includes(k)))}`),
    agree);
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// G4 — the REGION-CUT detector his own G4 refused for want of.
//
// The cut is the whole emit STATEMENT, from the boundary before the `GATE: ` literal to the first
// `;` that is in code state — which is what spans the `+ (…)` continuation round434/435/433 use
// and what a per-statement-head or per-line cut cannot reach.
// ─────────────────────────────────────────────────────────────────────────────────────────────────
// Code-state scanner: returns the set of indices where a `;` is real code (not inside a string,
// template, template-substitution-nested string, line comment or block comment).
function codeSemicolons(src) {
  const out = [];
  const stack = []; // 'sq' | 'dq' | 'tpl' | 'sub'
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    const top = stack[stack.length - 1];
    if (top === 'sq' || top === 'dq') {
      if (c === '\\') { i += 2; continue; }
      if ((top === 'sq' && c === "'") || (top === 'dq' && c === '"')) stack.pop();
      i += 1; continue;
    }
    if (top === 'tpl') {
      if (c === '\\') { i += 2; continue; }
      if (c === '`') { stack.pop(); i += 1; continue; }
      if (c === '$' && src[i + 1] === '{') { stack.push('sub'); i += 2; continue; }
      i += 1; continue;
    }
    // code state (top is undefined or 'sub')
    if (c === '/' && src[i + 1] === '/') { const j = src.indexOf('\n', i); i = j === -1 ? src.length : j; continue; }
    if (c === '/' && src[i + 1] === '*') { const j = src.indexOf('*/', i); i = j === -1 ? src.length : j + 2; continue; }
    if (c === "'") { stack.push('sq'); i += 1; continue; }
    if (c === '"') { stack.push('dq'); i += 1; continue; }
    if (c === '`') { stack.push('tpl'); i += 1; continue; }
    if (c === '}' && top === 'sub') { stack.pop(); i += 1; continue; }
    if (c === ';' && stack.length === 0) out.push(i);
    i += 1;
  }
  return out;
}

// Both quote styles. round433 emits by single-quote concatenation; a backtick-only key misses it
// and returns a SMALLER number (398). `quoteStyles` is a parameter so that defect can be DRIVEN.
const EMIT_RE = KEY.quoteStyles === 'backtick-only'
  ? /`(?:\\n)?GATE: /g
  : /['"`](?:\\n)?GATE: /g;
const LABEL_INTRODUCERS = ['RED:', 'FALSE:', 'REFUSED:', 'FAILED:'];

function regionCut(src) {
  EMIT_RE.lastIndex = 0;
  const sites = [];
  let m;
  while ((m = EMIT_RE.exec(src)) !== null) sites.push(m.index);
  if (sites.length === 0) return { state: 'NO_EMIT_SITE', region: null, sites: 0 };
  const semis = codeSemicolons(src);
  const regions = [];
  for (const s of sites) {
    const start = semis.filter((x) => x < s).pop() ?? -1;
    const end = semis.find((x) => x > s);
    if (end === undefined) return { state: 'UNCUTTABLE', region: null, sites: sites.length };
    regions.push(src.slice(start + 1, end + 1));
  }
  return { state: 'CUT', region: regions.join('\n'), sites: sites.length };
}

function detectCapability(src) {
  const cut = regionCut(src);
  if (cut.state !== 'CUT') return { capable: null, why: cut.state, sites: cut.sites };
  const hit = LABEL_INTRODUCERS.filter((t) => cut.region.includes(t));
  return { capable: hit.length > 0, why: hit.length ? hit.join('+') : 'no introducer in region', sites: cut.sites, region: cut.region };
}


// G3 — THE HAND READING. Declared first, anchored to source, and the anchors counted in the blob.
//
// Read by hand this fire, from each member's gate-line emit site, BEFORE the detector below was
// written. `capable` means: this emitter has a branch that appends a failing-leg-id list to the
// gate line. The anchor is the shortest fragment of the emit statement that carries the property
// — for a capable member, the label introducer itself; for an incapable one, the whole single-
// statement gate print that provably has no continuation.
// ─────────────────────────────────────────────────────────────────────────────────────────────────
// Keyed by PATH, not by round directory. Drive 1 keyed this map on `round<N>` and went red: round435
// and round436 each contribute TWO members to this population (a grader and a `cripple-and-regrade`),
// so a round key is not a member key, and both anchors were looked for in the wrong file and found
// 0×. The same collapse is in his G9's own row labels, where it is harmless only because the second
// member of each pair emits no gate line at all.
const HAND = {
  'docs/research/round413-instruments/attack-g7-and-grade-the-branch-layer.mjs':
    { capable: false, anchor: 'console.log(`\\nGATE: ${gateOk}   (${gateLegs.length} leg(s) on the key itself)`);' },
  'docs/research/round414-instruments/grade-the-refusing-half-and-reconcile-the-ten.mjs':
    { capable: false, anchor: 'console.log(`\\nGATE: ${gateOk}   (${gateLegs.length} leg(s) on the key itself)`);' },
  'docs/research/round430-instruments/grade-the-convention-gate.mjs':
    { capable: false, anchor: 'console.log(`\\nGATE: ${gateOk}   (${gateLegs.length} leg(s) on the cure itself)`);' },
  'docs/research/round431-instruments/grade-his-convention-and-measure-the-reach.mjs':
    { capable: true, anchor: '`${redLegs.length ? `, RED: ${redLegs.map((x) => x.id).join(\' | \')}` : \'\'})`' },
  'docs/research/round432-instruments/grade-the-two-cures.mjs':
    { capable: true, anchor: '${red.length ? `, RED: ${red.join(\' | \')}` : \'\'}' },
  'docs/research/round433-instruments/grade-his-cure-and-census-its-reach.mjs':
    { capable: true, anchor: "+ (failed.length === 0 ? '' : ' — FALSE: ' + failed.map((l) => l.id).join(', '))" },
  'docs/research/round434-instruments/grade-the-two-cures-and-the-prose.mjs':
    { capable: true, anchor: '+ (failed.length === 0 ? \'\' : ` — FALSE: ${failed.map((l) => l.id).join(\', \')}`)' },
  'docs/research/round435-instruments/grade-his-cure-and-oracle-the-matrix.mjs':
    { capable: true, anchor: '+ (failed.length === 0 ? \'\' : ` — FALSE: ${failed.map((l) => l.id).join(\', \')}`)' },
  'docs/research/round436-instruments/grade-the-cures-against-a-runtime-oracle.mjs':
    { capable: true, anchor: '${red.length ? `   RED: ${red.map((l) => l.id).join(\', \')}` : \'\'}' },
  // The two non-emitters, declared as their own state rather than dropped or defaulted. This round
  // is about not collapsing "nothing to read" into "cannot read", so a member that emits no gate
  // line at all gets `capable: null` WITH a verified reason, not a silent exclusion (411/439).
  'docs/research/round435-instruments/cripple-and-regrade.mjs':
    { capable: null, reason: 'emits no gate line — it reads its subject\'s', anchor: 'const g = t.match(' },
  // A different reader shape from round435's, and drive 2 reddened for reusing round435's anchor
  // here: a hand-typed anchor is not transferable between two files with the same NAME (408).
  'docs/research/round436-instruments/cripple-and-regrade.mjs':
    { capable: null, reason: 'emits no gate line — it reads its subject\'s', anchor: "const gate = out.split('\\n').find((l) => l.startsWith('GATE:'))" },
};

const blobOf = (p) => git('show', `${REV}:${p}`);
let HAND_OK = null;
{
  const rows = [];
  const members = AGREED_MEMBERS ?? [...POP.graders].sort();
  for (const p of members) {
    const h = HAND[p];
    if (h === undefined) { rows.push({ key: roundKeyOf(p), p, declared: undefined, occ: null, sites: null }); continue; }
    const src = blobOf(p);
    const occ = src.split(h.anchor).length - 1;
    rows.push({ key: roundKeyOf(p), p, declared: h.capable, reason: h.reason ?? null, occ, sites: regionCut(src).sites });
  }
  const undeclared = rows.filter((r) => r.declared === undefined);
  const graded = rows.filter((r) => r.declared !== undefined);
  const badAnchor = graded.filter((r) => r.occ !== 1);
  // The `capable: null` claim is "emits no gate line", which is checkable: zero emit sites. A
  // declaration nobody checks is a second guess (412).
  const badNull = graded.filter((r) => r.declared === null && r.sites !== 0);
  const badEmitter = graded.filter((r) => r.declared !== null && r.sites === 0);
  const ok = badAnchor.length === 0 && undeclared.length === 0 && badNull.length === 0 && badEmitter.length === 0;
  HAND_OK = ok ? rows : null;
  leg('G3', 'THE HAND READING, AND IT IS PRIMARY. Eleven members is a population a person can '
    + 'read, so the detector below is the thing being graded and this is what grades it. Each '
    + 'member is declared by PATH — drive 1 keyed this map on the round directory and reddened, '
    + 'because round435 and round436 each contribute two members and a round key is not a member '
    + 'key — together with the source ANCHOR the reading rests on. The leg reddens unless every '
    + 'anchor occurs EXACTLY ONCE in that member\'s blob AT THE REV (408: a hand-typed anchor is '
    + 'not a slice; 347/389/422: an anchor that does not occur exactly once reads nothing), unless '
    + 'every `capable: null` member really has ZERO emit sites and every declared emitter has at '
    + 'least one, and unless every member of the population carries a declaration at all',
    `declared ${graded.length} of ${rows.length} member(s) · capable ${graded.filter((r) => r.declared === true).length}`
    + ` · no label ${graded.filter((r) => r.declared === false).length}`
    + ` · emits no gate line ${graded.filter((r) => r.declared === null).length}`
    + ` · anchors occurring exactly once: ${graded.filter((r) => r.occ === 1).length}/${graded.length}`
    + (badAnchor.length ? `\n        BAD ANCHORS: ${JSON.stringify(badAnchor.map((r) => [r.p, r.occ]))}` : '')
    + (undeclared.length ? `\n        UNDECLARED MEMBERS: ${JSON.stringify(undeclared.map((r) => r.p))}` : '')
    + (badNull.length ? `\n        DECLARED SILENT BUT HAS EMIT SITES: ${JSON.stringify(badNull.map((r) => [r.p, r.sites]))}` : '')
    + (badEmitter.length ? `\n        DECLARED EMITTER WITH NO EMIT SITE: ${JSON.stringify(badEmitter.map((r) => r.p))}` : '')
    + rows.map((r) => `\n        ${r.declared === undefined ? 'UNDECLARED' : r.declared === true ? 'capable   ' : r.declared === false ? 'no label  ' : 'no gate ln'} ${r.key} · ${r.sites ?? '?'} emit site(s) · anchor occurs ${r.occ ?? 'n/a'}×  ${r.p.split('/').pop()}`).join(''),
    ok);
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
let CAP = null;
{
  if (HAND_OK === null) {
    leg('G4', 'THE REGION-CUT DETECTOR', 'REFUSED — G3 did not produce a gradeable hand reading', null);
  } else {
    const rows = HAND_OK.map((r) => {
      const d = detectCapability(blobOf(r.p));
      return { ...r, detected: d.capable, why: d.why, sites: d.sites };
    });
    // Three declared classes, so the matrix is 3 × 3 and each diagonal cell must be occupied: a
    // detector that answered "capable" for everything, or "no emit site" for everything, would
    // pass a two-cell check (418).
    const emitters = rows.filter((r) => r.declared === true || r.declared === false);
    const silent = rows.filter((r) => r.declared === null);
    const tp = emitters.filter((r) => r.declared === true && r.detected === true).length;
    const tn = emitters.filter((r) => r.declared === false && r.detected === false).length;
    const fp = emitters.filter((r) => r.declared === false && r.detected === true);
    const fn = emitters.filter((r) => r.declared === true && r.detected === false);
    // An emitter the detector cannot cut is a REFUSAL, not a verdict, and it fails this leg.
    const unreadable = emitters.filter((r) => r.detected === null);
    // The silent members must come back as `NO_EMIT_SITE` specifically — not as "no label", which
    // is the collapse this whole round is about.
    const silentOk = silent.filter((r) => r.detected === null && r.why === 'NO_EMIT_SITE');
    const silentBad = silent.filter((r) => !(r.detected === null && r.why === 'NO_EMIT_SITE'));
    const ok = tp > 0 && tn > 0 && silentOk.length > 0 && fp.length === 0 && fn.length === 0
      && unreadable.length === 0 && silentBad.length === 0;
    if (ok) CAP = new Map(rows.filter((r) => r.declared !== null).map((r) => [r.key, r.detected]));
    leg('G4', 'THE REGION-CUT DETECTOR — the reading his own G4 REFUSED for want of a region cut. '
      + 'The cut is the whole emit STATEMENT, from the last code-state `;` before the `GATE: ` '
      + 'literal to the first one after it, which is what reaches the `+ (…)` continuation three '
      + 'members use and what a per-statement-head cut cannot. Graded against G3\'s hand reading as '
      + 'a confusion matrix in BOTH directions: a detector answering "capable" everywhere passes '
      + 'the positive half by itself, so `tp > 0` AND `tn > 0` are both required (418). The key '
      + 'covers single quotes, double quotes and backticks — round433 emits its gate line by '
      + 'single-quote concatenation and a backtick-only key misses it, returning a SMALLER number '
      + '(398); that key is drivable via KLATCH_R441_QUOTES. The two members that emit no gate '
      + 'line at all must come back as NO_EMIT_SITE specifically rather than as "no label", '
      + 'because that collapse is the defect this whole round is about',
      `quote key: ${KEY.quoteStyles} · tp ${tp} · tn ${tn} · fp ${fp.length} · fn ${fn.length}`
      + ` · emitters unreadable ${unreadable.length} · silent members correctly NO_EMIT_SITE ${silentOk.length}/${silent.length}`
      + (fp.length ? `\n        FALSE POSITIVES: ${JSON.stringify(fp.map((r) => r.key))}` : '')
      + (fn.length ? `\n        FALSE NEGATIVES: ${JSON.stringify(fn.map((r) => r.key))}` : '')
      + (unreadable.length ? `\n        UNREADABLE EMITTERS: ${JSON.stringify(unreadable.map((r) => [r.key, r.why]))}` : '')
      + (silentBad.length ? `\n        SILENT MEMBER MIS-CLASSED: ${JSON.stringify(silentBad.map((r) => [r.p, r.detected, r.why]))}` : '')
      + rows.map((r) => `\n        ${r.key} hand ${r.declared === true ? 'capable   ' : r.declared === false ? 'no label  ' : 'UNDECLARED'} · detector ${r.detected === true ? 'capable   ' : r.detected === false ? 'no label  ' : 'REFUSED   '} · ${r.sites} emit site(s) · ${r.why}`).join(''),
      ok);
  }
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// G5 — his published five, re-keyed; and the 2 × 2 that shows the key reads greenness.
// ─────────────────────────────────────────────────────────────────────────────────────────────────
{
  // His G9's five, sliced out of my recording of his drive rather than typed from his memo (412).
  const recP = join(HERE, 'reproduce-his-round440.out');
  let hisFive = null;
  let states = null;
  if (existsSync(recP)) {
    const txt = readFileSync(recP, 'utf8');
    const m = txt.match(/members with NO label at all \((\d+)\): (\[[^\]]*\])/);
    if (m) hisFive = JSON.parse(m[2]).map((s) => s.split(':')[0]);
    // His G9 member rows: `        GREEN round413 → …`
    states = new Map(txt.split('\n')
      .map((l) => l.match(/^\s{8}(GREEN|RED|UNGRADEABLE|REFUSED)\s+(round\d+) → /))
      .filter((x) => x)
      .map((x) => [x[2], x[1]]));
  }
  if (hisFive === null || CAP === null || states === null || states.size === 0) {
    leg('G5', 'HIS PUBLISHED FIVE, RE-KEYED',
      `REFUSED — ${hisFive === null ? 'could not slice his five out of the recording'
        : CAP === null ? 'G4 did not produce a graded capability map' : 'could not slice his member states'}`, null);
  } else {
    const capableAmongHisFive = hisFive.filter((k) => CAP.get(k) === true);
    const grid = { 'green·capable': [], 'green·no-label': [], 'red·capable': [], 'red·no-label': [] };
    for (const [k, st] of states) {
      const c = CAP.get(k);
      if (c === undefined) continue;
      const row = `${st === 'GREEN' ? 'green' : st === 'RED' ? 'red' : st.toLowerCase()}·${c ? 'capable' : 'no-label'}`;
      if (grid[row]) grid[row].push(k);
    }
    // The key cannot separate iff BOTH halves of green are occupied: a member his key calls
    // "no label" is in one of them and there is nothing in the emitted line to tell which.
    const confounded = grid['green·capable'].length > 0 && grid['green·no-label'].length > 0;
    const ok = capableAmongHisFive.length > 0 && confounded;
    leg('G5', 'HIS PUBLISHED FIVE, RE-KEYED AGAINST SOURCE — and the 2 × 2 that says why his key '
      + 'cannot produce a number at all. His G9 is measured, in his own words, "from emitted lines '
      + 'with no source model", and every member of his five is GREEN. A green instrument prints '
      + 'no leg-id label BECAUSE IT IS GREEN: round431 would print `(11 leg(s))` and nothing else '
      + 'the moment its legs passed. So his class is keyed on the conjunct his own population '
      + 'filter makes true (380/381/385/386), and the leg asserts the confound directly — both '
      + 'halves of GREEN must be occupied, which is what makes "no label observed" unable to '
      + 'decide between them. The leg also reddens if NONE of his five turns out capable, because '
      + 'then his number was right and mine is the wrong one',
      `his five: ${JSON.stringify(hisFive)}`
      + `\n        of those, label-CAPABLE from source: ${capableAmongHisFive.length} — ${JSON.stringify(capableAmongHisFive)}`
      + `\n        so the true "names no legs at all" class is ${hisFive.length - capableAmongHisFive.length} of `
      + `${CAP.size} graded, not ${hisFive.length} — the error direction is OVER-reporting`
      + `\n        2 × 2 (emitted state × source capability): `
      + Object.entries(grid).map(([k, v]) => `\n          ${k.padEnd(16)} ${v.length} ${JSON.stringify(v)}`).join('')
      + `\n        both halves of GREEN occupied (his key cannot separate them): ${confounded}`,
      ok);
  }
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// G6 — the fifth state, BUILT. Every state positively keyed; no fall-through default.
// ─────────────────────────────────────────────────────────────────────────────────────────────────
const LABEL_FORMS = [
  { id: ', RED: … )', re: /, RED: (.+)\)\s*$/ },
  { id: ') — FALSE: …', re: /\) — FALSE: (.+?)\s*$/ },
  { id: ')   RED: …', re: /\)\s{2,}RED: (.+?)\s*$/ },
  { id: ')   REFUSED: …', re: /\)\s{2,}REFUSED: (.+?)\s*$/ },
];

// (emitted gate line, source capability) → one of five states, each keyed on something it must
// match. 411/439: the last bucket is keyed positively and anything else REFUSES by name.
function readFailingLegs(line, capable) {
  if (typeof line !== 'string' || !/^GATE: /.test(line)) return { state: 'NOT_A_GATE_LINE', legs: null };
  const verdict = line.match(/^GATE: (true|false)\b/)?.[1] ?? null;
  if (verdict === null) return { state: 'GATE_VERDICT_UNREADABLE', legs: null };
  const matched = LABEL_FORMS.filter((f) => f.re.test(line));
  if (matched.length > 1) return { state: 'AMBIGUOUS_LABEL', legs: null, forms: matched.map((f) => f.id) };
  if (matched.length === 1) {
    const ids = matched[0].re.exec(line)[1].split(/\s*[|,]\s*/).filter((s) => s !== '');
    return { state: 'NAMED', legs: ids, form: matched[0].id };
  }
  if (verdict === 'true') return { state: 'GREEN_NO_LABEL_EXPECTED', legs: [] };
  if (capable === false) return { state: 'NO_LABEL_BY_DESIGN', legs: null };
  if (capable === true) return { state: 'RED_UNPARSED', legs: null };
  return { state: 'CAPABILITY_UNKNOWN', legs: null };
}

{
  const recP = join(HERE, 'reproduce-his-round440.out');
  let lines = null;
  if (existsSync(recP)) {
    // His G9 rows carry each member's own emitted gate line verbatim in G3's rows:
    //   `        round431 → ["G7 | G8)"]   from "GATE: false   (11 leg(s), RED: G7 | G8)"`
    // and the green ones only in G9. Slice the actual lines out of G3's `from "…"` quotes, and
    // take the green members' lines from the G9 rows, which print the member and its state.
    const txt = readFileSync(recP, 'utf8');
    lines = new Map(txt.split('\n')
      .map((l) => l.match(/^\s{8}(round\d+) → .* from "(GATE: [^"]*)"/))
      .filter((x) => x)
      .map((x) => [x[1], x[2]]));
  }
  if (lines === null || lines.size === 0 || CAP === null) {
    leg('G6', 'THE FIFTH STATE, BUILT',
      `REFUSED — ${CAP === null ? 'no graded capability map from G4'
        : 'could not slice any member\'s emitted gate line out of the recording'}`, null);
  } else {
    // Synthetic counterfactual lines: the only reachable way to ask what a GREEN member's `false`
    // line would be read as, which is the half the real drive cannot show (380/397/412 — grade the
    // old spelling and the new one, not just the one in front of you).
    const cases = [];
    for (const [k, line] of lines) cases.push({ k, line, kind: 'LIVE', r: readFailingLegs(line, CAP.get(k)) });
    for (const [k, cap] of CAP) {
      const cf = `GATE: false   (9 leg(s))`; // a bare false line: what a silent member emits when red
      cases.push({ k, line: cf, kind: 'COUNTERFACTUAL', r: readFailingLegs(cf, cap) });
    }
    const states = [...new Set(cases.map((c) => c.r.state))];
    const byDesign = cases.filter((c) => c.r.state === 'NO_LABEL_BY_DESIGN');
    const unparsed = cases.filter((c) => c.r.state === 'RED_UNPARSED');
    const fallthrough = cases.filter((c) => c.r.state === 'CAPABILITY_UNKNOWN' || c.r.state === 'AMBIGUOUS_LABEL');
    // The point of the round: on the bare-false counterfactual the two states must BOTH be
    // reachable and must SPLIT the population — one refusing bucket for both is 411 one level down.
    const ok = byDesign.length > 0 && unparsed.length > 0 && fallthrough.length === 0
      && cases.filter((c) => c.r.state === 'NAMED').length > 0;
    leg('G6', 'THE FIFTH STATE, BUILT AND SPLIT. A positively keyed reader over (emitted gate '
      + 'line, source capability). "I cannot read this" and "there is nothing here to read" are '
      + 'different answers, so NO_LABEL_BY_DESIGN and RED_UNPARSED are separate states keyed on '
      + 'the capability G4 derives, and a capability the detector REFUSED on becomes '
      + 'CAPABILITY_UNKNOWN rather than falling into either (411/439). The live lines can only '
      + 'exercise the states the current drive happens to reach, so every member is ALSO put '
      + 'through the bare `GATE: false   (9 leg(s))` counterfactual — the line a silent member '
      + 'emits when it goes red, which is the whole subject of his route and which no green '
      + 'member\'s real output can show. The leg reddens unless both states are occupied and '
      + 'nothing reaches a fall-through',
      `cases ${cases.length} (${lines.size} live, ${CAP.size} counterfactual) · states reached ${JSON.stringify(states)}`
      + `\n        NO_LABEL_BY_DESIGN ${byDesign.length} — ${JSON.stringify([...new Set(byDesign.map((c) => c.k))])}`
      + `\n        RED_UNPARSED ${unparsed.length} — ${JSON.stringify([...new Set(unparsed.map((c) => c.k))])}`
      + `\n        fall-through/ambiguous: ${fallthrough.length}`
      + cases.filter((c) => c.kind === 'LIVE').map((c) => `\n        LIVE ${c.k} → ${c.r.state}${c.r.legs ? ` ${JSON.stringify(c.r.legs)}` : ''}`).join('')
      + cases.filter((c) => c.kind === 'COUNTERFACTUAL').map((c) => `\n        CF   ${c.k} → ${c.r.state}`).join(''),
      ok);
  }
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// G7 — mine: the write-site census his §3 mechanism admits of, taken STATICALLY.
// ─────────────────────────────────────────────────────────────────────────────────────────────────
let TRACKED_TARGETS = null;
{
  const tracked = new Set(git('ls-tree', '-r', '--name-only', REV, 'docs/').split('\n').filter((l) => l !== ''));
  const allMjs = [...tracked].filter((f) => f.endsWith('.mjs'));
  const found = [];
  for (const f of allMjs) {
    const src = blobOf(f);
    // `writeFileSync(join(HERE|REPO, '<literal>'), …)` — the only shape in this corpus. A target
    // built from a variable is reported as UNRESOLVED rather than dropped, because dropping it
    // would make the census a floor dressed as a count (436).
    const re = /writeFileSync\(\s*join\(\s*(HERE|REPO)\s*,\s*(['"`])([^'"`]+)\2\s*\)/g;
    let m;
    while ((m = re.exec(src)) !== null) {
      const rel = m[1] === 'HERE' ? join(dirname(f), m[3]) : m[3];
      found.push({ writer: f, target: rel, tracked: tracked.has(rel) });
    }
    const loose = (src.match(/writeFileSync\(/g) ?? []).length;
    const modelled = (src.match(/writeFileSync\(\s*join\(\s*(?:HERE|REPO)\s*,\s*['"`]/g) ?? []).length;
    if (loose > modelled) found.push({ writer: f, target: null, tracked: null, unresolved: loose - modelled });
  }
  const trackedTargets = found.filter((r) => r.tracked === true);
  const unresolved = found.filter((r) => r.target === null);
  // His G10 reported two, from the drive. Sliced out of HIS recording, not typed from the memo.
  const hisDiffP = join(REPO, 'docs/research/round440-instruments/drive-rewrote-committed-recordings.diff');
  const hisTwo = existsSync(hisDiffP)
    ? [...new Set((readFileSync(hisDiffP, 'utf8').match(/^\+\+\+ b\/(\S+)/gm) ?? []).map((l) => l.replace('+++ b/', '')))]
    : null;
  const covers = hisTwo === null ? null : hisTwo.every((p) => trackedTargets.some((r) => r.target === p));
  TRACKED_TARGETS = trackedTargets;
  leg('G7', 'THE WRITE-SITE CENSUS, TAKEN STATICALLY — mine, and it narrows his §3. He named the '
    + 'mechanism as "any member may write anywhere in the tree" and cured it with a before/after '
    + 'drive snapshot whose own stated limitation is that "in a tree already carrying the damage '
    + 'it reports 0 — it catches the first drive, not the tenth". But the mechanism is not '
    + 'arbitrary: it is a small set of UNCONDITIONAL `writeFileSync(join(HERE|REPO, \'<lit>\'))` '
    + 'sites whose target is TRACKED at the rev. That is a source property, censusable over the '
    + 'whole tree at a stamped rev with no drive at all, so it reads the tenth drive as readily as '
    + 'the first. The leg requires the census to COVER the two paths his own G10 found — sliced '
    + 'out of his committed diff rather than typed from his memo (412) — because a census that '
    + 'misses a known instance is not a census. A write target built from a variable is reported '
    + 'as UNRESOLVED rather than dropped: dropping it would make this a floor dressed as a count '
    + '(436). Sizes are measurements, not pins (377/405)',
    `tracked .mjs under docs/ at ${SHORT}: ${allMjs.length} · modelled write sites ${found.filter((r) => r.target !== null).length}`
    + ` · of those, target TRACKED at the rev: ${trackedTargets.length}`
    + ` · unresolved write sites: ${unresolved.reduce((a, r) => a + r.unresolved, 0)} in ${unresolved.length} file(s)`
    + `\n        his G10's dirtied set, sliced from his diff: ${JSON.stringify(hisTwo)} · covered by this census: ${covers}`
    + trackedTargets.map((r) => `\n        ${r.target}  ←  ${r.writer}`).join(''),
    covers === true && trackedTargets.length > 0);
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// G8 — the generations figure his before/after detector structurally cannot take.
// ─────────────────────────────────────────────────────────────────────────────────────────────────
{
  if (TRACKED_TARGETS === null || TRACKED_TARGETS.length === 0) {
    leg('G8', 'THE GENERATIONS FIGURE', 'REFUSED — G7 produced no tracked write targets', null);
  } else {
    const rows = [];
    for (const r of [...new Set(TRACKED_TARGETS.map((x) => x.target))]) {
      const revs = git('log', '--format=%H', REV, '--', r).split('\n').filter((l) => l !== '');
      // Content generations: distinct blob hashes this path has carried, in commit order.
      const blobs = [];
      for (const rv of revs) {
        let h = null;
        try { h = git('rev-parse', `${rv}:${r}`).trim(); } catch { h = null; }
        if (h !== null && (blobs.length === 0 || blobs[blobs.length - 1] !== h)) blobs.push(h);
      }
      rows.push({ target: r, commits: revs.length, generations: blobs.length });
    }
    const restamped = rows.filter((r) => r.generations > 1);
    const maxGen = rows.reduce((a, r) => Math.max(a, r.generations), 0);
    leg('G8', 'THE GENERATIONS FIGURE — what a before/after drive snapshot structurally cannot '
      + 'take. For each tracked write target, the number of DISTINCT committed blobs the path has '
      + 'carried. His §3 says he "restored both", and he did — to the content committed before his '
      + 'fire. This leg asks whether that content was itself a re-stamp, which is a question about '
      + 'history and not about a working tree. A recording whose committed content has been '
      + 'rewritten N times is a record of its last drive, not of the round it is named for, and a '
      + '`git checkout` cannot recover what was never committed. The leg reddens if nothing is '
      + 'multi-generation, because then the hazard is working-tree-only and his cure is sufficient',
      `tracked write targets ${rows.length} · multi-generation (committed content rewritten at `
      + `least once) ${restamped.length} · deepest ${maxGen} generations`
      + rows.map((r) => `\n        ${r.generations} generation(s) across ${r.commits} commit(s)  ${r.target}`).join(''),
      restamped.length > 0);
  }
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// G9 — hygiene, measured ABSOLUTELY against HEAD, with my own directory excluded by path (425).
// ─────────────────────────────────────────────────────────────────────────────────────────────────
{
  const exclude = (p) => p.startsWith(`${MY_DIR_REL}/`);
  const entry = DIRTY_AT_ENTRY.filter((p) => !exclude(p));
  const exitNow = dirtyVsHead().filter((p) => !exclude(p));
  const added = exitNow.filter((p) => !entry.includes(p));
  // Spawns nothing: asserted by SOURCE PIN on this file, named as a pin, plus the absence of any
  // child-process import other than execFileSync for git.
  const self = readFileSync(fileURLToPath(import.meta.url), 'utf8');
  const spawns = (self.match(/execFileSync\(/g) ?? []).length;
  const gitOnly = (self.match(/execFileSync\('git'/g) ?? []).length;
  const ok = entry.length === 0 && exitNow.length === 0 && added.length === 0 && spawns === gitOnly;
  leg('G9', 'HYGIENE, MEASURED ABSOLUTELY RATHER THAN AS A DIFFERENCE. His G10 differences a '
    + 'before-snapshot against an after-snapshot, which is exactly why it reports 0 in a tree that '
    + 'arrived dirty. This leg reports BOTH: the dirty-vs-HEAD set at entry (which must be empty, '
    + 'and this fire restored three carried re-stamps to make it so) and the dirty-vs-HEAD set '
    + 'now. My own output directory is excluded BY PATH, because an instrument that walks the '
    + 'directory it writes into reddens in every cell (425). The no-spawn claim is a source pin on '
    + 'this file and is labelled as one: every `execFileSync` in it is a git call',
    `dirty vs HEAD at entry (excl. my dir) ${entry.length} ${JSON.stringify(entry)}`
    + ` · now ${exitNow.length} ${JSON.stringify(exitNow)} · newly dirtied by me ${added.length} ${JSON.stringify(added)}`
    + `\n        execFileSync sites in this file ${spawns}, of which git ${gitOnly} (source pin)`,
    ok);
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// Predictions — declared before the legs above were run, and each says why it is not blind.
// ─────────────────────────────────────────────────────────────────────────────────────────────────
{
  const g5 = legs.find((l) => l.id === 'G5');
  const m = g5 && g5.detail.match(/label-CAPABLE from source: (\d+)/);
  const n = m ? Number(m[1]) : null;
  pred('P1', 'HIS ROUTED FIVE IS AN OVER-REPORT. At least one member of his published '
    + '"names no legs at all" class is label-CAPABLE from source, so the fifth state is worth '
    + 'building and the denominator he routed is not the one to build it against. Declared NOT '
    + 'BLIND and why: I hand-read all five emit sites this fire BEFORE the detector was written, '
    + 'and the hand reading is committed above as G3\'s literal. What this prediction tests is '
    + 'whether an independently written region cut agrees with that hand reading — and a region '
    + 'cut that modelled the continuation wrongly would have come back with FEWER capable members, '
    + 'not more (398)',
    n === null ? 'REFUSED — G5 published no capable count' : `${n} of his five are label-capable from source`,
    n === null ? null : n > 0);

  const g7 = legs.find((l) => l.id === 'G7');
  const t = g7 && g7.detail.match(/target TRACKED at the rev: (\d+)/);
  const hisN = g7 && g7.detail.match(/sliced from his diff: \[([^\]]*)\]/);
  const mineN = t ? Number(t[1]) : null;
  const hisCount = hisN ? (hisN[1].trim() === '' ? 0 : hisN[1].split(',').length) : null;
  pred('P2', 'THE STATIC CENSUS FINDS STRICTLY MORE THAN HIS DRIVE DID. His G10 saw two paths '
    + 'because his population excludes round >= 437 by his own derived round key, while the TREE '
    + 'does not — the third re-stamp my own worktree arrived carrying is in round438, outside his '
    + 'population. A source census over the whole tree has no population filter to be narrowed by. '
    + 'Declared NOT BLIND and why: I knew of a third instance before building this, from `git '
    + 'status` in my own worktree at this fire\'s open (`my-tree-carried-restamps.diff`, committed '
    + 'beside this file); what I did not know is the total, and a scanner with a wrong write-site '
    + 'model would have returned a SMALLER one (398/415)',
    mineN === null || hisCount === null ? 'REFUSED — a count is missing'
      : `static census ${mineN} tracked target(s) vs his drive's ${hisCount}`,
    mineN === null || hisCount === null ? null : mineN > hisCount);
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// Report
// ─────────────────────────────────────────────────────────────────────────────────────────────────
const out = [];
out.push('Round 441 — his routed fifth state is real, and the five it is keyed on reads greenness');
out.push('');
for (const l of legs) {
  const tag = l.ok === true ? ' ok  ' : l.ok === null ? 'REF  ' : 'FAIL ';
  out.push(`${tag} ${l.id}  ${l.what}`);
  out.push(`        ${l.detail}`);
}
out.push('');
for (const p of preds) {
  const tag = p.landed === true ? 'LANDED ' : p.landed === null ? 'REFUSED' : 'REFUTED';
  out.push(`${tag} ${p.id}  ${p.what}`);
  out.push(`        ${p.detail}`);
}
out.push('');
const failed = legs.filter((l) => l.ok !== true);
const red = legs.filter((l) => l.ok === false);
const refused = legs.filter((l) => l.ok === null);
const refutedP = preds.filter((p) => p.landed === false);
const refusedP = preds.filter((p) => p.landed === null);
out.push(`GATE: ${failed.length === 0 ? 'true' : 'false'}   (${legs.length} leg(s))`
  + (red.length === 0 ? '' : `   RED: ${red.map((l) => l.id).join(', ')}`)
  + (refused.length === 0 ? '' : `   REFUSED: ${refused.map((l) => l.id).join(', ')}`));
out.push(`PREDICTIONS: ${preds.length - refutedP.length - refusedP.length} landed, ${refutedP.length} refuted`
  + (refutedP.length === 0 ? '' : `: ${refutedP.map((p) => p.id).join(' | ')}`)
  + (refusedP.length === 0 ? '' : `, ${refusedP.length} refused: ${refusedP.map((p) => p.id).join(' | ')}`));
out.push(`  rev ${SHORT} · worktree ${dirtyVsHead().length === 0 ? 'clean' : 'DIRTY'}`
  + `${CRIPPLED.length ? ` · CRIPPLED ${JSON.stringify(CRIPPLED)}` : ''}`);
console.log(out.join('\n'));
process.exitCode = failed.length === 0 ? 0 : 1;
