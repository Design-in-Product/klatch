#!/usr/bin/env node
/**
 * unit-465srckeys — grade the four SOURCE patterns of the attested round population, and price
 * Theseus's routed fifth source at two revs.
 *
 * The subject AS FILED is read from git at a pinned rev (`PRE_CURE_REV`), never from the working
 * tree: this unit cures its own subject in the same fire, so a working-tree read would silently
 * grade the cure as the baseline.
 *
 * All crippling is done on programmatic copies under `scratch/` (gitignored). The live module is
 * never edited by this arm. Every substitution asserts its anchor occurs EXACTLY ONCE and refuses
 * otherwise — a silently-missed cripple must not read as a clean arm.
 *
 * Usage: node arm-srckeys.mjs
 */

import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync, rmSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '..', '..', '..');
const SCRATCH = resolve(HERE, 'scratch');
const SUBJECT_PATH = 'docs/research/lib/attested-rounds.mjs';

/** The pre-registration commit. Its copy of the module is the subject AS FILED. */
const PRE_CURE_REV = '94b17b20';
/** This fire's tip at pre-registration time. */
const HEAD_REV = '3ee13880';
/** Theseus's rev — where his `A=175 C=174 removed=[465]` was read. */
const THESEUS_REV = '69cf9167';

const legs = [];
const red = [];
const refused = [];
const preds = [];
const refuted = [];
const prefused = [];

function leg(id, what, fn) {
  legs.push(id);
  let out;
  try {
    out = fn();
  } catch (e) {
    refused.push(id);
    console.log(`[${id}] REFUSED ${what} :: ${e.message}`);
    return null;
  }
  if (out && out.refused) {
    refused.push(id);
    console.log(`[${id}] REFUSED ${what} :: ${out.why}`);
    return null;
  }
  const ok = out && out.ok;
  if (!ok) red.push(id);
  console.log(`[${id}] ${ok ? 'ok  ' : 'RED '} ${what} :: ${out ? out.note : 'no note'}`);
  return out;
}

function pred(id, what, verdict, note) {
  preds.push(id);
  if (verdict === 'refused') {
    prefused.push(id);
    console.log(`[${id}] PREFUSED ${what} :: ${note}`);
    return;
  }
  if (!verdict) refuted.push(id);
  console.log(`[${id}] ${verdict ? 'HELD    ' : 'REFUTED '} ${what} :: ${note}`);
}

function git(args) {
  const r = spawnSync('git', ['-C', REPO, ...args], { stdio: 'pipe', encoding: 'utf8', maxBuffer: 1 << 28 });
  if (r.status !== 0) return null;
  return r.stdout;
}

// ---------------------------------------------------------------------------
// The substitutions. Each: a name, an anchor that must occur exactly once, and its replacement.
// ---------------------------------------------------------------------------

/** Never matches anything, and has no capture group — so a blinded arm cannot quietly half-work. */
const NEVER = '/(?!)/';

const BLIND = {
  S1: {
    anchor: "let m = /^docs\\/research\\/round(\\d+)-instruments\\//.exec(p);",
    replace: `let m = ${NEVER}.exec(p);`,
    what: 'round dirs',
  },
  S2: {
    anchor: "m = /(?:^|\\/)round(\\d+)[^/]*\\.test\\.tsx?$/.exec(p);",
    replace: `m = ${NEVER}.exec(p);`,
    what: 'roundNNN*.test.ts[x]',
  },
  S3: {
    anchor: "m = /^docs\\/research\\/[^/]*round(\\d+)/.exec(p);",
    replace: `m = ${NEVER}.exec(p);`,
    what: 'other docs/research round paths',
  },
  S4: {
    anchor: "export const SUBJECT_ROUND_RE = /\\bround\\s*(\\d+)\\b/i;",
    replace: `export const SUBJECT_ROUND_RE = ${NEVER};`,
    what: 'commit subjects',
  },
  /** Only exists post-cure: the as-filed module has no fifth source to blind. */
  S5: {
    anchor: "m = /^docs\\/research\\/unit-(\\d+)/.exec(p);",
    replace: `m = ${NEVER}.exec(p);`,
    what: 'unit-NNN dirs',
  },
};

/** S5 — Theseus's routed fifth source, as three additive substitutions. */
const ADD_S5 = [
  {
    anchor: '  const otherDocs = new Set();',
    replace: '  const otherDocs = new Set();\n  const unitDirs = new Set();',
  },
  {
    anchor: '    if (m) otherDocs.add(Number(m[1]));',
    replace:
      '    if (m) { otherDocs.add(Number(m[1])); continue; }\n' +
      "    m = /^docs\\/research\\/unit-(\\d+)/.exec(p);\n" +
      '    if (m) unitDirs.add(Number(m[1]));',
  },
  {
    anchor: '  const nonSubject = new Set([...dirs, ...tests, ...otherDocs]);',
    replace: '  const nonSubject = new Set([...dirs, ...tests, ...otherDocs, ...unitDirs]);',
  },
];

function substitute(src, subs) {
  let out = src;
  for (const s of subs) {
    const n = out.split(s.anchor).length - 1;
    if (n !== 1) throw new Error(`anchor occurs ${n}× (want exactly 1): ${JSON.stringify(s.anchor.slice(0, 60))}`);
    out = out.replace(s.anchor, s.replace);
  }
  if (out === src) throw new Error('substitution produced an identical file');
  return out;
}

let copyN = 0;
async function loadVariant(tag, src, subs) {
  const body = subs.length ? substitute(src, subs) : src;
  const file = resolve(SCRATCH, `v${++copyN}-${tag}.mjs`);
  writeFileSync(file, body, 'utf8');
  return await import(pathToFileURL(file).href);
}

const sortNum = (a) => [...a].sort((x, y) => x - y);
const setDiff = (a, b) => sortNum([...a].filter((x) => !b.has(x)));

// ---------------------------------------------------------------------------

async function main() {
  rmSync(SCRATCH, { recursive: true, force: true });
  mkdirSync(SCRATCH, { recursive: true });

  const preCureSrc = git(['show', `${PRE_CURE_REV}:${SUBJECT_PATH}`]);
  if (preCureSrc === null) {
    console.log(`FATAL: cannot read ${SUBJECT_PATH} at ${PRE_CURE_REV}`);
    process.exit(2);
  }
  console.log(`subject AS FILED: ${SUBJECT_PATH}@${PRE_CURE_REV}  ${preCureSrc.length} chars`);

  const asFiled = await loadVariant('as-filed', preCureSrc, []);
  const liveMod = await import(pathToFileURL(resolve(REPO, SUBJECT_PATH)).href);
  const cured = typeof liveMod.classifyPath === 'function';
  console.log(`working tree: classifyPath ${cured ? 'PRESENT — post-cure drive' : 'ABSENT — pre-cure drive'}`);
  console.log(`revs: as-filed=${PRE_CURE_REV} head=${HEAD_REV} theseus=${THESEUS_REV}\n`);

  // -- T0: the as-filed subject's own self-test passes, so a cripple's throw means something ----
  leg('T0', 'as-filed selfTest() returns true', () => {
    const r = asFiled.selfTest();
    return { ok: r === true, note: `returned ${JSON.stringify(r)}` };
  });

  // -- T1: blind each source in the AS-FILED module; does its selfTest notice? -----------------
  const clean = asFiled.attestedRounds(REPO, HEAD_REV);
  if (clean === null) {
    console.log('FATAL: clean population refused at HEAD');
    process.exit(2);
  }
  console.log(
    `clean@${HEAD_REV}: raw=${clean.raw.size} filtered=${clean.filtered.size} removed=[${clean.removed}] max=${clean.sorted.at(-1)}\n`
  );

  const blindedSeen = {};
  const asFiledNoticed = [];
  for (const id of ['S1', 'S2', 'S3', 'S4']) {
    const b = BLIND[id];
    // eslint-disable-next-line no-await-in-loop
    const mod = await loadVariant(`asfiled-blind-${id}`, preCureSrc, [b]);
    let noticed;
    try {
      const r = mod.selfTest();
      noticed = r !== true;
    } catch {
      noticed = true;
    }
    if (noticed) asFiledNoticed.push(id);
    blindedSeen[id] = mod;
    console.log(`  as-filed selfTest with ${id} (${b.what}) blinded: ${noticed ? 'NOTICED' : 'green'}`);
  }
  leg('T1', 'as-filed selfTest is blind to all four source patterns', () => ({
    ok: asFiledNoticed.length === 0,
    note: `noticed=[${asFiledNoticed}] of [S1,S2,S3,S4]`,
  }));
  pred(
    'P1',
    'the as-filed selfTest returns true under all 4 blindings',
    asFiledNoticed.length === 0,
    `noticed ${asFiledNoticed.length} of 4: [${asFiledNoticed}]`
  );

  // -- T2: what each blinding costs the population at HEAD ------------------------------------
  const cost = {};
  for (const id of ['S1', 'S2', 'S3', 'S4']) {
    const pop = blindedSeen[id].attestedRounds(REPO, HEAD_REV);
    if (pop === null) {
      cost[id] = null;
      continue;
    }
    cost[id] = {
      filtered: pop.filtered.size,
      lost: setDiff(clean.filtered, pop.filtered),
      gained: setDiff(pop.filtered, clean.filtered),
      removed: pop.removed,
    };
    console.log(
      `  ${id} blinded: filtered=${pop.filtered.size} (clean ${clean.filtered.size}) lost=${cost[id].lost.length} gained=${cost[id].gained.length} removed=[${pop.removed}]`
    );
  }
  leg('T2', 'every blinding is measurable (no blinding is a no-op on the population)', () => {
    const noop = ['S1', 'S2', 'S3', 'S4'].filter((id) => cost[id] && cost[id].lost.length === 0);
    const refusedIds = ['S1', 'S2', 'S3', 'S4'].filter((id) => cost[id] === null);
    if (refusedIds.length) return { refused: true, why: `population refused under [${refusedIds}]` };
    return { ok: noop.length === 0, note: `no-op blindings=[${noop}]` };
  });

  const s2Lost = cost.S2 ? cost.S2.lost : null;
  pred(
    'P2',
    'blinding S2 costs exactly one member, 465, and the other three cost more than one',
    s2Lost !== null &&
      s2Lost.length === 1 &&
      s2Lost[0] === 465 &&
      cost.S2.removed.includes(465) &&
      ['S1', 'S3', 'S4'].every((id) => cost[id] && cost[id].lost.length > 1),
    `S2 lost=[${s2Lost}] removed=[${cost.S2 && cost.S2.removed}] · ` +
      ['S1', 'S3', 'S4'].map((id) => `${id} lost ${cost[id] ? cost[id].lost.length : '?'}`).join(' · ')
  );

  // -- T3/T4: S5 priced at two revs, as a set difference both ways ----------------------------
  const withS5 = await loadVariant('asfiled-plus-S5', preCureSrc, ADD_S5);
  const s5At = {};
  for (const rev of [HEAD_REV, THESEUS_REV]) {
    const base = asFiled.attestedRounds(REPO, rev);
    const plus = withS5.attestedRounds(REPO, rev);
    if (base === null || plus === null) {
      s5At[rev] = null;
      continue;
    }
    s5At[rev] = {
      base: { n: base.filtered.size, removed: base.removed },
      plus: { n: plus.filtered.size, removed: plus.removed },
      added: setDiff(plus.filtered, base.filtered),
      dropped: setDiff(base.filtered, plus.filtered),
    };
    const r = s5At[rev];
    console.log(
      `  S5 @${rev}: filtered ${r.base.n} → ${r.plus.n} · removed [${r.base.removed}] → [${r.plus.removed}] · added=[${r.added}] dropped=[${r.dropped}]`
    );
  }

  leg('T3', `S5 adds no member at HEAD (${HEAD_REV})`, () => {
    const r = s5At[HEAD_REV];
    if (!r) return { refused: true, why: 'a population refused at HEAD' };
    return {
      ok: r.added.length === 0 && r.dropped.length === 0,
      note: `added=[${r.added}] dropped=[${r.dropped}] removed [${r.base.removed}] → [${r.plus.removed}]`,
    };
  });

  leg('T4', `S5 subsumes the denial filter's bite at ${THESEUS_REV}`, () => {
    const r = s5At[THESEUS_REV];
    if (!r) return { refused: true, why: `a population refused at ${THESEUS_REV}` };
    const baseBit = r.base.removed.length > 0;
    const plusBit = r.plus.removed.length > 0;
    return {
      ok: baseBit && !plusBit,
      note: `removed [${r.base.removed}] → [${r.plus.removed}] · filtered ${r.base.n} → ${r.plus.n}`,
    };
  });

  const h = s5At[HEAD_REV];
  const t = s5At[THESEUS_REV];
  pred(
    'P3a',
    'S5 is a 0-member change at HEAD, set-differenced both ways',
    h ? h.added.length === 0 && h.dropped.length === 0 && h.base.removed.length === 0 && h.plus.removed.length === 0 : 'refused',
    h ? `added=[${h.added}] dropped=[${h.dropped}] removed [${h.base.removed}] → [${h.plus.removed}]` : 'refused'
  );
  pred(
    'P3b',
    `S5 takes removed [465] → [] and filtered 174 → 175 at ${THESEUS_REV}`,
    t
      ? t.base.removed.length === 1 &&
        t.base.removed[0] === 465 &&
        t.plus.removed.length === 0 &&
        t.base.n === 174 &&
        t.plus.n === 175
      : 'refused',
    t ? `removed [${t.base.removed}] → [${t.plus.removed}] · filtered ${t.base.n} → ${t.plus.n}` : 'refused'
  );

  // -- T5/T6: classification. Needs the cure's classifyPath; refuses pre-cure. -----------------
  const headPaths = (git(['ls-tree', '-r', '--name-only', HEAD_REV]) || '').split('\n').filter(Boolean);
  const headSet = new Set(headPaths);

  leg('T5', 'every "present" case path is actually in the tree at HEAD', () => {
    if (!cured) return { refused: true, why: 'classifyPath absent — pre-cure drive' };
    const cases = liveMod.SOURCE_CASES && liveMod.SOURCE_CASES.present;
    if (!Array.isArray(cases) || cases.length === 0) return { refused: true, why: 'SOURCE_CASES.present missing or empty' };
    const missing = cases.map(([p]) => p).filter((p) => !headSet.has(p));
    return { ok: missing.length === 0, note: `${cases.length} case path(s), missing=[${missing}]` };
  });

  leg('T6', 'classifyPath assigns every declared case to its declared source', () => {
    if (!cured) return { refused: true, why: 'classifyPath absent — pre-cure drive' };
    const sc = liveMod.SOURCE_CASES;
    if (!sc) return { refused: true, why: 'SOURCE_CASES missing' };
    const all = [...(sc.present || []), ...(sc.synthetic || [])];
    if (all.length < 4) return { refused: true, why: `only ${all.length} case(s) declared` };
    const wrong = [];
    for (const [p, wantSource, wantRound] of all) {
      const got = liveMod.classifyPath(p);
      if (got.source !== wantSource || got.round !== wantRound) {
        wrong.push(`${p} → ${got.source}/${got.round} want ${wantSource}/${wantRound}`);
      }
    }
    return { ok: wrong.length === 0, note: `${all.length} cases · wrong=${wrong.length}${wrong.length ? ' :: ' + wrong.join(' ; ') : ''}` };
  });

  pred(
    'P4',
    'the three real tree paths classify S1-only / S2-only / no-source',
    cured
      ? (() => {
          const want = [
            ['packages/server/src/__tests__/round465-data-delta.test.ts', 'S2', 465],
            ['docs/research/round464-instruments/grade-the-stop-condition.mjs', 'S1', 464],
            ['docs/research/unit-465attestdenial-2026-11-12/grade-the-denial-rekey.mjs', null, null],
          ];
          return want.every(([p, s, n]) => {
            const g = liveMod.classifyPath(p);
            return headSet.has(p) && g.source === s && g.round === n;
          });
        })()
      : 'refused',
    cured
      ? ['packages/server/src/__tests__/round465-data-delta.test.ts', 'docs/research/round464-instruments/grade-the-stop-condition.mjs', 'docs/research/unit-465attestdenial-2026-11-12/grade-the-denial-rekey.mjs']
          .map((p) => `${p.split('/').pop()}→${liveMod.classifyPath(p).source}${headSet.has(p) ? '' : ' (ABSENT)'}`)
          .join(' · ')
      : 'classifyPath absent'
  );

  // -- T7: S3 is anchored to the first path component; the live blind spot, measured ------------
  let invisible = null;
  leg('T7', 'S3 is first-component-anchored, and the live blind spot hides no member', () => {
    if (!cured) return { refused: true, why: 'classifyPath absent — pre-cure drive' };
    // NOTE the nested case is `notes-2026/`, not `unit-999x/`, which the pre-registration named.
    // The cure added S5, which claims every `unit-*` path, so a `unit-*` nested path no longer
    // isolates S3's first-component anchoring. Both spellings are declared synthetic; the swap is
    // recorded in RESULTS §T7 rather than made silently.
    const nested = liveMod.classifyPath('docs/research/notes-2026/round999-notes.md');
    const flat = liveMod.classifyPath('docs/research/round999-notes.md');
    const unseen = headPaths.filter((p) => /round\d+/i.test(p) && liveMod.classifyPath(p).source === null);
    const unseenRounds = sortNum(new Set(unseen.map((p) => Number(/round(\d+)/i.exec(p)[1]))));
    const outside = unseenRounds.filter((n) => !clean.filtered.has(n));
    invisible = { count: unseen.length, rounds: unseenRounds, outside };
    return {
      ok: nested.source === null && flat.source === 'S3' && unseen.length > 0,
      note: `nested→${nested.source} flat→${flat.source} · ${unseen.length} invisible path(s) naming rounds [${unseenRounds}] · outside the population=[${outside}]`,
    };
  });
  pred(
    'P5',
    'the blind spot is non-empty and its round numbers are a subset of the population',
    invisible ? invisible.count > 0 && invisible.outside.length === 0 : 'refused',
    invisible ? `${invisible.count} invisible path(s) · outside=[${invisible.outside}]` : 'classifyPath absent'
  );

  // -- T8: the cure is behaviour-preserving on the population ----------------------------------
  leg('T8', 'cured attestedRounds returns the identical member set at HEAD', () => {
    if (!cured) return { refused: true, why: 'classifyPath absent — pre-cure drive' };
    const after = liveMod.attestedRounds(REPO, HEAD_REV);
    if (after === null) return { refused: true, why: 'cured population refused' };
    const lost = setDiff(clean.filtered, after.filtered);
    const gained = setDiff(after.filtered, clean.filtered);
    return {
      ok: lost.length === 0 && gained.length === 0 && String(after.removed) === String(clean.removed),
      note: `as-filed ${clean.filtered.size} vs cured ${after.filtered.size} · lost=[${lost}] gained=[${gained}] · removed [${clean.removed}] → [${after.removed}]`,
    };
  });

  pred(
    'P6pop',
    'the cure is behaviour-preserving on the population (the member-set half of P6)',
    cured
      ? (() => {
          const after = liveMod.attestedRounds(REPO, HEAD_REV);
          if (after === null) return false;
          return (
            setDiff(clean.filtered, after.filtered).length === 0 &&
            setDiff(after.filtered, clean.filtered).length === 0
          );
        })()
      : 'refused',
    cured ? 'set difference empty in both directions — see T8' : 'classifyPath absent'
  );

  // -- T9: the cure is NON-VACUOUS — the same four blindings must now be noticed ---------------
  // The cured source is read from the working-tree FILE, which is the live subject; the as-filed
  // one came from git. The two readings are deliberately different sources.
  let curedNoticed = null;
  if (cured) {
    const curedSrc = readFileSync(resolve(REPO, SUBJECT_PATH), 'utf8');
    curedNoticed = [];
    for (const id of ['S1', 'S2', 'S3', 'S4', 'S5']) {
      let noticed;
      let why = '';
      try {
        // eslint-disable-next-line no-await-in-loop
        const mod = await loadVariant(`cured-blind-${id}`, curedSrc, [BLIND[id]]);
        try {
          noticed = mod.selfTest() !== true;
        } catch (e) {
          noticed = true;
          why = e.message.slice(0, 90);
        }
      } catch (e) {
        noticed = 'refused';
        why = e.message.slice(0, 90);
      }
      if (noticed === true) curedNoticed.push(id);
      console.log(`  cured selfTest with ${id} (${BLIND[id].what}) blinded: ${noticed === true ? 'NOTICED' : noticed === 'refused' ? 'REFUSED' : 'green'} ${why}`);
    }
  }
  leg('T9', 'cured selfTest notices all five blindings', () => {
    if (!cured) return { refused: true, why: 'classifyPath absent — pre-cure drive' };
    const missed = ['S1', 'S2', 'S3', 'S4', 'S5'].filter((id) => !curedNoticed.includes(id));
    return { ok: missed.length === 0, note: `noticed=[${curedNoticed}] missed=[${missed}]` };
  });
  pred(
    'P1inv',
    "the inversion half named in P1's own text — the cure notices every blinding",
    curedNoticed ? curedNoticed.length === 5 : 'refused',
    curedNoticed ? `noticed ${curedNoticed.length} of 5: [${curedNoticed}]` : 'classifyPath absent'
  );

  // -- T10: the routed change's whole content, measured rather than asserted -------------------
  const T10_PROBE = 'docs/research/unit-465attestdenial-2026-11-12/grade-the-denial-rekey.mjs';
  let t10 = null;
  if (cured && headSet.has(T10_PROBE)) {
    const blinded = await loadVariant(
      'cured-blind-S5-classify',
      readFileSync(resolve(REPO, SUBJECT_PATH), 'utf8'),
      [BLIND.S5]
    );
    t10 = { withS5: liveMod.classifyPath(T10_PROBE), withoutS5: blinded.classifyPath(T10_PROBE) };
  }
  leg('T10', 'S5 is what moves a unit-* path from no-source to attested', () => {
    if (!cured) return { refused: true, why: 'classifyPath absent — pre-cure drive' };
    if (t10 === null) return { refused: true, why: `${T10_PROBE} not in the tree at HEAD` };
    return {
      ok: t10.withS5.source === 'S5' && t10.withS5.round === 465 && t10.withoutS5.source === null,
      note: `five-source → ${t10.withS5.source}/${t10.withS5.round} · four-source → ${t10.withoutS5.source}/${t10.withoutS5.round}`,
    };
  });

  const code = red.length > 0 || refused.length > 0 ? 1 : 0;
  const status = red.length > 0 ? 'RED' : refused.length > 0 ? 'REFUSED' : 'GREEN';
  console.log(
    `\nVERDICT/${code} ${status} legs=${legs.length} red=[${red}] refused=[${refused}] preds=${preds.length} refuted=[${refuted}] prefused=[${prefused}]`
  );
  process.exit(code);
}

main().catch((e) => {
  console.log(`FATAL ${e && e.stack ? e.stack : e}`);
  process.exit(2);
});
