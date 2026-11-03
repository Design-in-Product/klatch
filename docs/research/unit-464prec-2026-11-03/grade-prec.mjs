// unit-464prec — is a `conjunctive` row's axis B a reading, or a precedence output?
//
// Theseus's 2026-11-03 START §8 routed me the axis-B precedence census over the five `conjunctive`
// rows of `unit-464order-2026-11-02/HAND-AXES-13.tsv`, plus the question of whether one cell makes
// `history-keyed > movable > immovable` an ordering.
//
// Everything this reads comes out of git at a NAMED rev. The subjects at SUBJ_REV; my own hand read
// at HAND_REV, which is its own commit and NOT the subject's, because an instrument's own input
// cannot take the subject's rev. [[feedback_an_instruments_own_input_cannot_be_pinned_to_the_subjects_rev]]
//
// Run from the repo root:
//   node docs/research/unit-464prec-2026-11-03/grade-prec.mjs
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

const LIVE = resolve('.');
const SUBJ_REV = '5ba1af7369e97a3abade0cbd5be4e542e0668971';   // HEAD at this fire's open
const HAND_REV = '2a30185c';                                    // the hand read's OWN commit
const AXES = 'docs/research/unit-464order-2026-11-02/HAND-AXES-13.tsv';
const HAND = 'docs/research/unit-464prec-2026-11-03/HAND-CONJUNCTS.tsv';
const R = 'docs/research/';

// The precedence order under test. v1.4 §2.1f names it, inferred from ONE cell. The cripple
// reverses it, so a leg that does not read it goes green either way.
// CRIPPLE_HKONLY demotes `history-keyed` to the bottom and leaves `movable > immovable` alone. If
// that moves no leg and no figure, then nothing in this unit reads the `history-keyed > movable`
// half of the ordering, and P3's green is a green about half a rule.
const ORDER = process.env.CRIPPLE_PRECKEY !== undefined
  ? ['immovable', 'movable', 'history-keyed']
  : process.env.CRIPPLE_HKONLY !== undefined
    ? ['movable', 'immovable', 'history-keyed']
    : ['history-keyed', 'movable', 'immovable'];

// DECLARED, not detected: anchor kind -> axis-B value. `history-keyed` has an entry so that its
// being UNREACHED in this sample is a measured zero rather than an absent arm.
// [[feedback_a_terminal_bucket_reached_by_fallthrough_absorbs_every_blindness]]
const KIND_AXISB = {
  'fixed-rev': 'immovable',
  'rev-from-file': 'immovable',
  'recording': 'immovable',
  'live': 'movable',
  'run-derived': 'movable',
  'selector': 'history-keyed',
};
const KIND_REACHED = Object.fromEntries(Object.keys(KIND_AXISB).map((k) => [k, 0]));

// Where each row's boolean spine is written. DECLARED per row, with the reason, because four rows
// are `check('ID', <predicate>, …)` and the fifth is an `if (<predicate>)` whose `refuse` call is
// nine lines further down — the already-published `G0@79` out-of-span finding.
const SPAN_AT = {
  'unit-464cure3-2026-11-01/grade-the-attrib-cure.mjs|71': { kind: 'check', at: 71 },
  'unit-464cure3-2026-11-01/grade-the-attrib-cure.mjs|186': { kind: 'check', at: 186 },
  'unit-464cure3-2026-11-01/grade-the-steal-cures.mjs|90': { kind: 'check', at: 90 },
  'unit-464cure3-2026-11-01/grade-the-steal-cures.mjs|194': { kind: 'check', at: 194, expand: 'ctrlPinned' },
  'unit-464vac-2026-10-31/measure.mjs|79': { kind: 'if', at: 76 },
};

const legs = [];
const check = (name, ok, note) => { legs.push({ name, ok, note }); return ok; };
const g = (args) => execFileSync('git', args,
  { cwd: LIVE, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 1 << 28 });
const show = (rev, path) => { try { return g(['show', `${rev}:${path}`]); } catch { return null; } };
const blob = (rev, path) => { try { return g(['rev-parse', `${rev}:${path}`]).trim(); } catch { return null; } };

// ------------------------------------------------------------------- the pins, verified not assumed
const SUBJECTS = [
  ['unit-464cure3-2026-11-01/grade-the-attrib-cure.mjs', '2297d29a'],
  ['unit-464cure3-2026-11-01/grade-the-steal-cures.mjs', '6604e830'],
  ['unit-464vac-2026-10-31/measure.mjs', 'f598a375'],
];
const blobs = SUBJECTS.map(([p, want]) => ({ p, want, got: (blob(SUBJ_REV, R + p) ?? '').slice(0, 8) }));
check('GPIN', blobs.every((b) => b.got === b.want),
  `all 3 subject blobs at ${SUBJ_REV.slice(0, 8)} match the pre-registered figures: ` +
  blobs.map((b) => `${b.p.split('/').pop()} ${b.got}${b.got === b.want ? '' : ` != ${b.want}`}`).join(' · '));

const SRC = Object.fromEntries(SUBJECTS.map(([p]) => [p, show(SUBJ_REV, R + p)]));
const axesSrc = show(SUBJ_REV, AXES);
const handSrc = show(HAND_REV, HAND);
if (Object.values(SRC).some((s) => s === null) || axesSrc === null || handSrc === null) {
  console.log('REFUSED — a pinned input could not be read out of git.');
  process.exit(2);
}
// The hand read is read at ITS OWN rev, and the leg says so by comparing the pinned blob to the
// worktree copy and reporting the answer either way rather than requiring agreement: a drift here
// is information, not a failure. [[feedback_a_leg_reading_a_frozen_artefact_and_the_live_subject_is_neither_pin_nor_gate]]
const handPinned = blob(HAND_REV, HAND);
const handLive = (() => { try { return g(['hash-object', HAND]).trim(); } catch { return null; } })();
check('GHANDREV', handPinned !== null,
  `hand read read at its OWN rev ${HAND_REV} (blob ${String(handPinned).slice(0, 8)}); worktree copy ` +
  `${String(handLive).slice(0, 8)} — ${handPinned === handLive ? 'identical' : 'DIFFERENT, and the pinned one is what was graded'}`);

// --------------------------------------------------------------------- the two hand reads, parsed
const rows = (tsv) => tsv.split('\n').filter((l) => l.length > 0 && !l.startsWith('#'))
  .map((l) => l.split('\t')).filter((f) => f[0] !== 'file');
const axesHdr = axesSrc.split('\n').find((l) => l.startsWith('file\t')).split('\t');
const AX = rows(axesSrc).map((f) => Object.fromEntries(axesHdr.map((h, i) => [h, f[i]])));
const handHdr = handSrc.split('\n').find((l) => l.startsWith('file\t')).split('\t');
const CJ = rows(handSrc).map((f) => Object.fromEntries(handHdr.map((h, i) => [h, f[i]])));
check('GSLICE', AX.length === 13 && CJ.length === 35,
  `sliced ${AX.length} axes rows (expect 13) and ${CJ.length} conjunct rows (expect 35) out of the pinned files`);

const CONJ = AX.filter((r) => r.axisA === 'conjunctive');
const key = (r) => `${r.file}|${r.line}`;
check('GFIVE', CONJ.length === 5 && new Set(CJ.map(key)).size === 5
  && CONJ.every((r) => CJ.some((c) => key(c) === key(r))),
  `${CONJ.length} conjunctive rows in the axes file, and my conjunct file covers ` +
  `${new Set(CJ.map(key)).size} distinct rows — join on (file,line), member lists not counts`);

// ------------------------------------------------------- P1: the spine, split off the pinned source
// A depth scanner over ()[]{} and ' " ` quotes. It does NOT model regex literals; that is sound
// here only because every registered span is bracket-balanced and contains no escaped pipe, which
// GSPLITSAFE measures rather than assumes. [[topic_regex_and_source_scanners]]
const splitSpine = (text) => {
  const out = []; let d = 0, q = null, start = 0;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '\\') i++; else if (c === q) q = null; continue; }
    if (c === "'" || c === '"' || c === '`') { q = c; continue; }
    if ('([{'.includes(c)) d++;
    else if (')]}'.includes(c)) d--;
    else if (d === 0 && (text.startsWith('&&', i) || text.startsWith('||', i))) {
      out.push(text.slice(start, i).trim()); i++; start = i + 1;
    }
  }
  out.push(text.slice(start).trim());
  return out.filter((s) => s.length > 0);
};
// The predicate span: from the opening paren of the call/`if`, take the argument text at depth 1,
// ending at the depth-1 comma (a `check`) or the closing paren (an `if`).
const spanOf = (src, spec) => {
  const lines = src.split('\n');
  const from = lines.slice(0, spec.at - 1).join('\n').length + (spec.at > 1 ? 1 : 0);
  const open = src.indexOf('(', from);
  let d = 0, q = null;
  for (let i = open; i < src.length; i++) {
    const c = src[i];
    if (q) { if (c === '\\') i++; else if (c === q) q = null; continue; }
    if (c === "'" || c === '"' || c === '`') { q = c; continue; }
    if ('([{'.includes(c)) d++;
    else if (')]}'.includes(c)) { d--; if (d === 0) return src.slice(open + 1, i); }
    else if (d === 1 && c === ',' && spec.kind === 'check') {
      // first depth-1 comma ends the name, the second ends the predicate
      const rest = src.slice(i + 1);
      let dd = 0, qq = null;
      for (let j = 0; j < rest.length; j++) {
        const e = rest[j];
        if (qq) { if (e === '\\') j++; else if (e === qq) qq = null; continue; }
        if (e === "'" || e === '"' || e === '`') { qq = e; continue; }
        if ('([{'.includes(e)) dd++;
        else if (')]}'.includes(e)) { if (dd === 0) return rest.slice(0, j); dd--; }
        else if (dd === 0 && e === ',') return rest.slice(0, j);
      }
      return rest;
    }
  }
  return null;
};
const helperBody = (src, name) => {
  const m = src.match(new RegExp(`^const ${name} = \\([^)]*\\) =>([\\s\\S]*?);\\n`, 'm'));
  return m ? m[1] : null;
};
const spans = {}, counts = {};
for (const r of CONJ) {
  const spec = SPAN_AT[key(r)];
  const text = spanOf(SRC[r.file], spec);
  let ops = splitSpine(text ?? '');
  let expanded = 0;
  if (spec.expand) {
    const body = helperBody(SRC[r.file], spec.expand);
    const inner = body === null ? [] : splitSpine(body);
    ops = ops.flatMap((o) => (o.startsWith(spec.expand + '(') ? (expanded = inner.length, inner) : [o]));
  }
  spans[key(r)] = text ?? '';
  counts[key(r)] = { derived: ops.length, ops, expanded };
}
const bal = (s) => { let d = 0; for (const c of s) { if ('([{'.includes(c)) d++; if (')]}'.includes(c)) d--; if (d < 0) return false; } return d === 0; };
check('GSPLITSAFE',
  CONJ.every((r) => !spans[key(r)].includes('\\|') && counts[key(r)].ops.every(bal)),
  `no registered span contains an escaped pipe and all ${CONJ.reduce((n, r) => n + counts[key(r)].derived, 0)} ` +
  `produced operands are bracket-balanced — the two conditions under which a regex-blind scanner is sound here`);

const handCount = Object.fromEntries(CONJ.map((r) => [key(r), CJ.filter((c) => key(c) === key(r)).length]));
const p1 = CONJ.map((r) => ({ row: `${r.id}@${r.line}`, hand: handCount[key(r)], derived: counts[key(r)].derived }));
check('GP1COUNTS', p1.every((x) => x.hand === x.derived),
  `conjunct counts, source-derived vs my filed hand read: ${p1.map((x) => `${x.row} ${x.derived}/${x.hand}`).join(' · ')} ` +
  `— ${p1.filter((x) => x.hand !== x.derived).length} departures of ${p1.length}`);

// The defect P1 was registered to FIND: my own `why` cell for @194. Read at the SUBJECT PIN, so a
// forward correction of the prose does not redden this leg.
// [[feedback_a_leg_that_asserts_the_defect_reddens_on_its_own_cure]]
const w194 = (CONJ.find((r) => r.line === '194') ?? {}).why ?? '';
const d194 = counts['unit-464cure3-2026-11-01/grade-the-steal-cures.mjs|194'];
check('GWHY194', /five conjuncts/.test(w194) && d194.derived === 7 && d194.expanded === 6,
  `@194: my filed why says "five conjuncts"; the span at the pin splits to ${d194.derived} ` +
  `(${d194.expanded} inside ctrlPinned + ${d194.derived - d194.expanded} beside it) — the why cell is wrong by two`);

// -------------------------------------------- the anchor kinds, derived from the evidence lines
const kindOf = (line) => {
  if (/readFileSync\(join\(LIVE, REC/.test(line)) return 'recording';
  if (/\bcell\(/.test(line)) return 'run-derived';
  if (/readFileSync\(join\(LIVE/.test(line)) return 'live';
  if (/\['show', `\$\{[A-Z_]+_REV\}/.test(line) || /'show', `\$\{[A-Z_]+_REV\}/.test(line)) return 'fixed-rev';
  if (/readFileSync\('[^']+'/.test(line) || /sat\.[A-Za-z]+/.test(line)) return 'rev-from-file';
  if (/\['log', '-1'/.test(line)) return 'selector';
  return null;
};
const evid = CJ.map((c) => {
  const line = (SRC[c.file].split('\n')[Number(c.evid) - 1] ?? '');
  const derivedKind = kindOf(line);
  if (derivedKind) KIND_REACHED[derivedKind]++;
  // NOT `line:` — that is the join key. drive1 spread the row and then overwrote `line` with the
  // source text, which silently emptied every row's conjunct list.
  return { ...c, srcline: line.trim(), derivedKind, derivedAxisB: KIND_AXISB[derivedKind] };
});
check('GJOIN', CONJ.every((r) => evid.filter((e) => key(e) === key(r)).length > 0),
  `every one of the ${CONJ.length} conjunctive rows joins to at least one conjunct after the kind ` +
  `derivation: [${CONJ.map((r) => `${r.id}@${r.line} ${evid.filter((e) => key(e) === key(r)).length}`).join(', ')}] ` +
  `— registered because drive1 destroyed this join by overwriting the key field`);
check('GEVID', evid.every((e) => e.derivedKind === e.anchorkind),
  `all ${evid.length} evidence lines classify to the anchor kind my hand read claims — ` +
  `${evid.filter((e) => e.derivedKind !== e.anchorkind).map((e) => `${e.id}@${e.line}k${e.k} ${e.derivedKind}!=${e.anchorkind}`).join(', ') || '0 departures'}`);
check('GAXISB', evid.every((e) => e.derivedAxisB === e.axisB),
  `all ${evid.length} per-conjunct axis-B values equal KIND_AXISB applied to the DERIVED kind — ` +
  `${evid.filter((e) => e.derivedAxisB !== e.axisB).length} departures`);
check('GKINDREACHED', KIND_REACHED['selector'] === 0 && Object.values(KIND_REACHED).filter((n) => n > 0).length === 5,
  `anchor-kind arms reached: ${Object.entries(KIND_REACHED).map(([k, n]) => `${k} ${n}`).join(' · ')} ` +
  `— the selector arm is reached ZERO times, which is P5 and a measured zero, not an absent arm`);

// ---------------------------------------------------- P2: multi-figure, and P3: the precedence rule
const perRow = CONJ.map((r) => {
  const cs = evid.filter((c) => key(c) === key(r));
  const set = [...new Set(cs.map((c) => c.axisB))];
  const most = ORDER.find((v) => set.includes(v));
  return { row: `${r.id}@${r.line}`, k: key(r), filed: r.axisB, cs, set, most, multi: set.length > 1 };
});
const multi = perRow.filter((x) => x.multi);
check('GP2MULTI', multi.length === 4 && perRow.filter((x) => !x.multi).map((x) => x.row).join() === 'G0@79',
  `multi-figure rows ${multi.length} of ${perRow.length}: [${multi.map((x) => x.row).join(', ')}]; ` +
  `single-figure [${perRow.filter((x) => !x.multi).map((x) => x.row).join(', ')}] — member lists, not counts`);
check('GP3ORDER', perRow.every((x) => x.most === x.filed),
  `most-movable-wins under [${ORDER.join(' > ')}] vs the value filed in HAND-AXES-13.tsv: ` +
  `${perRow.map((x) => `${x.row} ${x.most}/${x.filed}`).join(' · ')} — ` +
  `${perRow.filter((x) => x.most !== x.filed).length} departures of ${perRow.length}`);

// --------------------------------------- P4: which rival rules can this sample actually separate?
// A rival is REFUTED when it yields a value and that value is not the filed one, and UNDEFINED when
// it yields nothing. The two are not the same result and collapsing them would overstate the test.
const RIVALS = {
  'most-movable (v1.4)': (x) => ORDER.find((v) => x.set.includes(v)),
  'most-immovable': (x) => [...ORDER].reverse().find((v) => x.set.includes(v)),
  'POST-conjunct decides': (x) => (x.cs.find((c) => c.state === 'POST') ?? {}).axisB,
  'first conjunct decides': (x) => x.cs[0].axisB,
  'last conjunct decides': (x) => x.cs[x.cs.length - 1].axisB,
  'majority of conjuncts': (x) => {
    const n = {}; for (const c of x.cs) n[c.axisB] = (n[c.axisB] ?? 0) + 1;
    const top = Math.max(...Object.values(n));
    const win = Object.keys(n).filter((v) => n[v] === top);
    return win.length === 1 ? win[0] : undefined;
  },
};
const scored = Object.entries(RIVALS).map(([name, f]) => {
  const out = perRow.map((x) => ({ row: x.row, got: f(x), filed: x.filed }));
  return {
    name,
    agreed: out.filter((o) => o.got === o.filed).map((o) => o.row),
    refuted: out.filter((o) => o.got !== undefined && o.got !== o.filed).map((o) => o.row),
    undef: out.filter((o) => o.got === undefined).map((o) => o.row),
  };
});
const survivors = scored.filter((s) => s.refuted.length === 0);
check('GP4SURVIVE', survivors.length >= 1 && survivors.some((s) => s.name.startsWith('most-movable')),
  `rivals over the 5 filed rows — ${scored.map((s) => `${s.name}: agree ${s.agreed.length}, refuted ${s.refuted.length}${s.refuted.length ? ` [${s.refuted.join(',')}]` : ''}, undefined ${s.undef.length}${s.undef.length ? ` [${s.undef.join(',')}]` : ''}`).join(' | ')}`);
check('GP4UNIQUE', survivors.length === 1,
  `rules this sample refutes NOTHING about: [${survivors.map((s) => `${s.name} (undefined on ${s.undef.length})`).join(', ')}] ` +
  `— ${survivors.length === 1 ? 'most-movable-wins is the unique survivor' : 'most-movable-wins is NOT the unique survivor, so five rows do not pick it out'}`);
// GP4UNIQUE went RED on drive2 and the registered predicate is left EXACTLY as filed. P4(c)
// predicted POST-decides would be REFUTED by @194; it is not refuted, it is UNDEFINED there — the
// rival yields no value at all, because @194 has no POST-labelled conjunct. These two legs measure
// the relation that actually holds, beside the prediction that did not.
// [[feedback_relaxing_a_gate_to_fit_manufactures_rows_elsewhere]]
const post = scored.find((s) => s.name === 'POST-conjunct decides');
check('GP4POSTSILENT', post.refuted.length === 0 && post.undef.length === 2,
  `POST-decides is refuted by ${post.refuted.length} of the 5 rows and UNDEFINED on ${post.undef.length} ` +
  `[${post.undef.join(', ')}] — P4(c) predicted a refutation and there is none; silence is not disagreement`);
const without = (drop) => Object.entries(RIVALS).filter(([, f]) =>
  perRow.filter((x) => x.row !== drop).every((x) => { const v = f(x); return v === undefined || v === x.filed; })).map(([n]) => n);
check('GP4SENS',
  without('GCTRLPRE@194').length > survivors.length && without('G0@79').length === survivors.length,
  `rules no row refutes, with the sample at 5: ${survivors.length} [${survivors.map((s) => s.name).join(', ')}] · ` +
  `dropping GCTRLPRE@194: ${without('GCTRLPRE@194').length} [${without('GCTRLPRE@194').join(', ')}] · ` +
  `dropping G0@79: ${without('G0@79').length} — @194 is the only row doing refutation work`);

const coincide = multi.map((x) => ({
  row: x.row,
  same: JSON.stringify(x.cs.map((c) => c.axisB === x.most)) === JSON.stringify(x.cs.map((c) => c.state === 'POST')),
}));
check('GP4COINCIDE', coincide.filter((c) => c.same).length === 3 && coincide.find((c) => !c.same).row === 'GCTRLPRE@194',
  `the axis-B partition coincides with the PRE/POST state label on ${coincide.filter((c) => c.same).length} of ` +
  `${coincide.length} multi-figure rows; the one that does not is ${coincide.find((c) => !c.same)?.row ?? 'none'} ` +
  `— so on the other three, most-movable-wins and POST-decides are indistinguishable`);

// ------------------------------------------------- P6: membership moves, and does a count move?
const cellsBefore = {};
for (const r of AX) (cellsBefore[`${r.axisA} × ${r.axisB}`] ??= []).push(`${r.id}@${r.line}`);
const cellsAfter = {};
for (const r of AX) {
  if (r.axisA !== 'conjunctive') { (cellsAfter[`${r.axisA} × ${r.axisB}`] ??= []).push(`${r.id}@${r.line}`); continue; }
  for (const v of perRow.find((x) => x.k === key(r)).set) (cellsAfter[`conjunctive × ${v}`] ??= []).push(`${r.id}@${r.line}`);
}
const nBefore = Object.keys(cellsBefore).length, nAfter = Object.keys(cellsAfter).length;
check('GP6COUNT', nBefore === 6 && nAfter === 6,
  `occupied cells of the 3x3: ${nBefore} with row-level axis B, ${nAfter} with per-conjunct axis B ` +
  `— the occupancy count ${nBefore === nAfter ? 'does NOT move' : 'MOVES'}`);
const ci = 'conjunctive × immovable';
check('GP6MEMBERS',
  (cellsBefore[ci] ?? []).length === 1 && (cellsAfter[ci] ?? []).length === 5
  && !(cellsAfter['conjunctive × history-keyed']),
  `${ci}: [${(cellsBefore[ci] ?? []).join(', ')}] -> [${(cellsAfter[ci] ?? []).join(', ')}] ` +
  `(${(cellsBefore[ci] ?? []).length} -> ${(cellsAfter[ci] ?? []).length} members); ` +
  `conjunctive × history-keyed stays EMPTY — a cell whose membership quintuples while its occupancy bit holds still`);

// --------------------------------------------------------------------------------------- readings
console.log(`unit-464prec — the axis-B precedence census over the five conjunctive rows`);
console.log(`subjects pinned at ${SUBJ_REV.slice(0, 8)} · hand read at ${HAND_REV} · ORDER [${ORDER.join(' > ')}]` +
  (process.env.CRIPPLE_PRECKEY !== undefined ? '   *** CRIPPLE_PRECKEY SET ***'
    : process.env.CRIPPLE_HKONLY !== undefined ? '   *** CRIPPLE_HKONLY SET ***' : ''));
console.log('');
for (const x of perRow) {
  console.log(`   ${x.row.padEnd(12)} ${String(x.cs.length).padStart(2)} conjuncts  ` +
    `{${x.set.join(',')}}`.padEnd(26) + `most-movable ${x.most.padEnd(10)} filed ${x.filed.padEnd(10)} ` +
    `${x.multi ? 'MULTI-FIGURE' : 'single'}`);
}
console.log('');
for (const s of scored) {
  console.log(`   ${s.name.padEnd(24)} agree ${s.agreed.length}  refuted ${s.refuted.length}  undefined ${s.undef.length}` +
    `${s.refuted.length ? `   refuted by [${s.refuted.join(', ')}]` : ''}${s.undef.length ? `   silent on [${s.undef.join(', ')}]` : ''}`);
}
console.log('');
console.log(`   cells occupied, row-level axis B      ${nBefore}`);
console.log(`   cells occupied, per-conjunct axis B   ${nAfter}`);
for (const [k, v] of Object.entries(cellsAfter)) console.log(`      ${k.padEnd(30)} ${v.length}  [${v.join(', ')}]`);
console.log('');
const ok = legs.every((l) => l.ok);
for (const l of legs) console.log(`   ${l.ok ? 'ok  ' : 'RED '} ${l.name.padEnd(14)} ${l.note}`);
console.log('');
console.log(`${ok ? 'GREEN' : 'RED'} — ${legs.filter((l) => l.ok).length} of ${legs.length} legs ok`);
process.exit(ok ? 0 : 1);
