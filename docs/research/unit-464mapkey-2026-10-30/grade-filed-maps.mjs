#!/usr/bin/env node
// grade-filed-maps.mjs — 2026-10-30 START fire, Daedalus.
//
// WHAT THIS GRADES.
//
// The subject is a FILED CRIPPLE MAP, read as text. The ground truth is the pair of
// recordings the map predicted — a clean drive and one arm drive per mapped arm. The
// convention it grades the map against is docs/research/CRIPPLE-MAP-CONVENTION.md (v2),
// published before this file existed.
//
// It never recomputes the map from the recordings. A pin that recomputes what it grades
// is hollow: the only reason to read the map as text is that the author's words are the
// thing under test.
//
// THE TWO DEFECTS IT EXISTS TO CATCH, both measured 2026-10-29 on real filed maps:
//
//   (a) a map keyed on the cell's VERDICT sets (red=/refused=/refuted=) cannot name a
//       member an arm demonstrably REACHES but whose verdict is structurally unable to
//       move — a [MEAS] leg has no verdict. Mine: 4 reached, 2 nameable.
//   (b) a map token TYPED from the author's intent instead of CAPTURED from the output
//       names a reached member in a spelling no comparison can match. Theseus's:
//       `pinned=true` where the cell prints `pinArmPinned=true`.
//
// BOTH KEYS ARE REPORTED, not just the new one, because a figure under one key alone is
// not a measurement: `reached` (v2, the member's printed line moved) beside
// `verdictReached` (v1, the member entered or left a verdict set), and `tokensNamed`
// (the token NAME on a member-mentioning line — Theseus's key, so his figure is
// reproducible here under his own key) beside `tokensCaptured` (the exact `name=value`
// string occurs — v2 §3.4's stricter key).
//
// REFUSAL. Every reader returns `null` for "could not read", never 0 and never []. An
// under-report of 0 and an inability to measure the under-report are the two answers a
// map checker must not confuse, and a grading instrument that cannot refuse manufactures
// findings. The refusal is itself graded, by `--cripple=no-refusal`.
//
// Usage:
//   node grade-filed-maps.mjs --map=<path> --clean=<path> --arm=<name>=<path> [...] [--cripple=<name>]
//
// Exit 0 only if every gate is ok. A gate that REFUSES is a RED, not a pass.

import { readFileSync, statSync } from 'node:fs';

// ---------------------------------------------------------------------------
// Arms. Each is a KEY perturbation on this instrument, and each has a row in
// PRE-REGISTRATION.md written before any of them was driven.
// ---------------------------------------------------------------------------
const CRIPPLES = new Set(['verdict-keyed-reach', 'word-anywhere', 'stamp-blind', 'no-refusal']);

const args = process.argv.slice(2);
const CRIPPLE = (() => {
  const a = args.find((x) => x.startsWith('--cripple='));
  if (a === undefined) return null;
  const name = a.slice('--cripple='.length);
  if (!CRIPPLES.has(name)) {
    console.error(`unknown --cripple=${name}; known: ${[...CRIPPLES].join(', ')}`);
    process.exit(2);
  }
  return name;
})();

// Optional: print one named member's movement per arm, mapped or not. This is how a
// single member's reach is reproduced across arms the map does not cover.
const MEMBER = (() => {
  const a = args.find((x) => x.startsWith('--member='));
  return a === undefined ? null : a.slice('--member='.length);
})();

const MAP_PATH = (args.find((x) => x.startsWith('--map=')) ?? '').slice('--map='.length);
const CLEAN_PATH = (args.find((x) => x.startsWith('--clean=')) ?? '').slice('--clean='.length);
const ARMS = args
  .filter((x) => x.startsWith('--arm='))
  .map((x) => {
    const rest = x.slice('--arm='.length);
    const eq = rest.indexOf('=');
    return eq === -1 ? { name: rest, path: null } : { name: rest.slice(0, eq), path: rest.slice(eq + 1) };
  });

if (MAP_PATH === '' || CLEAN_PATH === '' || ARMS.length === 0) {
  console.error('usage: grade-filed-maps.mjs --map=<path> --clean=<path> --arm=<name>=<path> [...]');
  process.exit(2);
}

// ---------------------------------------------------------------------------
// The cell's seven printed status labels, taken as a PARAMETER so a blindness in
// this reader can be driven rather than argued about.
//
// Derived from the branch literals in the cell itself, not from what a recording
// happens to contain: round464-instruments/grade-the-stop-condition.mjs:1678 prints
// legs as MEAS / 'REF ' / ' ok ' / 'RED ', and :1684 prints predictions as
// PREF / LAND / REFU. A reader missing one label is off by a CONSTANT in every
// recording, so the error cancels in a delta — which is why GABS below is an
// ABSOLUTE count per recording and not a difference of two counts.
// ---------------------------------------------------------------------------
const ALL_STATUS_LABELS = ['MEAS', 'REF ', ' ok ', 'RED ', 'PREF', 'LAND', 'REFU'];

const readText = (path) => {
  if (path === null) return null;
  try {
    if (!statSync(path).isFile()) return null;
    return readFileSync(path, 'utf8');
  } catch {
    return null;
  }
};

// ---------------------------------------------------------------------------
// Readers over a RECORDING. Each takes text, never a path, so a known positive can
// drive it on a synthetic string.
// ---------------------------------------------------------------------------

/**
 * Every member of the cell, as printed. A member is a 4-char status label, a space,
 * an id, a colon; its second line is the indented `detail:` (legs) or
 * `expected=/actual=` (predictions) line. Returns null if the text has no members.
 * @param {string|null} text
 * @param {string[]} labels
 */
const membersOf = (text, labels) => {
  if (text === null) return null;
  const lines = text.split('\n');
  const out = new Map();
  for (let i = 0; i < lines.length; i += 1) {
    const label = lines[i].slice(0, 4);
    if (!labels.includes(label)) continue;
    const m = lines[i].slice(4).match(/^ ([A-Za-z][A-Za-z0-9_]*): /);
    if (m === null) continue;
    const next = lines[i + 1] ?? '';
    // The payload line is the indented continuation. If the next line is not
    // indented the member printed no payload; that is '' and not a refusal, because
    // the member WAS found.
    const payload = /^ {6}\S/.test(next) ? next.trim() : '';
    out.set(m[1], { label, payload });
  }
  return out.size === 0 ? null : out;
};

/** The `VERDICT/` line's own counts and verdict sets. null if there is no such line. */
const verdictLine = (text) => {
  if (text === null) return null;
  const line = text.split('\n').find((l) => /^VERDICT\//.test(l));
  if (line === undefined) return null;
  const num = (key) => {
    const m = line.match(new RegExp(`${key}=(\\d+)`));
    return m === null ? null : Number(m[1]);
  };
  const set = (key) => {
    const m = line.match(new RegExp(`${key}=\\[([^\\]]*)\\]`));
    if (m === null) return null;
    return m[1] === '' ? [] : m[1].split(',');
  };
  const v = {
    legs: num('legs'),
    preds: num('preds'),
    red: set('red'),
    refused: set('refused'),
    refuted: set('refuted'),
    prefused: set('prefused'),
    line,
  };
  return Object.values(v).some((x) => x === null) ? null : v;
};

/**
 * Captured tokens off a payload line, keyed on ` <ident>=` boundaries.
 *
 * NOT a whitespace split. Theseus's first grading split on whitespace, which breaks
 * `selector=max(pins first)` into two tokens and invents a 12th that does not exist;
 * it reported movedTokens=4 for an arm whose true figure is 3. Credit to him for
 * recording that rather than replacing it. GKP below gates this on a real slice of
 * his clean recording.
 * @param {string} payload
 */
const tokensOf = (payload) => {
  const out = new Map();
  const re = /(?:^|\s)([A-Za-z][A-Za-z0-9_.]*)=/g;
  const hits = [...payload.matchAll(re)];
  for (let i = 0; i < hits.length; i += 1) {
    const name = hits[i][1];
    const valueStart = hits[i].index + hits[i][0].length;
    const valueEnd = i + 1 < hits.length ? hits[i + 1].index : payload.length;
    out.set(name, payload.slice(valueStart, valueEnd).trim());
  }
  return out;
};

// ---------------------------------------------------------------------------
// Readers over a MAP FILE.
// ---------------------------------------------------------------------------

/** The MAPSTAMP block's declared fields, or null if the map carries no stamp. */
const mapStamp = (mapText) => {
  if (mapText === null) return null;
  const m = mapText.match(/MAPSTAMP v2\n([\s\S]*?)```/);
  if (m === null) {
    // v1 maps carry the stamp as prose. Read the one field a v1 stamp does state,
    // so a pre-convention map is graded on what it claims rather than refused for
    // not being v2 — and report WHICH form was found, because the forms differ in
    // what a comparator can do with them.
    const prose = mapText.match(/legs=(\d+)\s+preds=(\d+)/);
    if (prose === null) return null;
    return { form: 'v1-prose', legs: Number(prose[1]), preds: Number(prose[2]) };
  }
  const body = m[1];
  const field = (k) => {
    const f = body.match(new RegExp(`^${k}:\\s*(.+)$`, 'm'));
    return f === null ? null : f[1].trim();
  };
  const size = field('cell-size-at-filing');
  const sm = size === null ? null : size.match(/legs=(\d+)\s+preds=(\d+)/);
  if (sm === null) return null;
  return { form: 'v2-block', legs: Number(sm[1]), preds: Number(sm[2]), filingRev: field('filing-rev') };
};

/**
 * The lines of the map section for one arm. Refuses (null) unless exactly one
 * heading contains the arm name — zero means the map does not map this arm, and two
 * means the figure would silently come from whichever came first.
 * @param {string|null} mapText
 * @param {string} armName
 */
const sectionFor = (mapText, armName) => {
  if (mapText === null) return null;
  const lines = mapText.split('\n');
  const heads = [];
  lines.forEach((l, i) => {
    const h = l.match(/^(#+)\s/);
    if (h !== null && l.includes(armName)) heads.push({ i, level: h[1].length });
  });
  if (heads.length !== 1) return null;
  const { i: start, level } = heads[0];
  let end = lines.length;
  for (let j = start + 1; j < lines.length; j += 1) {
    const h = lines[j].match(/^(#+)\s/);
    if (h !== null && h[1].length <= level) {
      end = j;
      break;
    }
  }
  return lines.slice(start, end);
};

// ---------------------------------------------------------------------------
// The grade for one arm.
// ---------------------------------------------------------------------------

/**
 * @param {Map<string,{label:string,payload:string}>|null} clean
 * @param {Map<string,{label:string,payload:string}>|null} arm
 * @param {string[]|null} section
 * @param {{red:string[],refused:string[],refuted:string[],prefused:string[]}|null} cleanV
 * @param {{red:string[],refused:string[],refuted:string[],prefused:string[]}|null} armV
 */
const gradeArm = (clean, arm, section, cleanV, armV) => {
  // Two refusals at two granularities, deliberately not collapsed into one.
  //
  //   `recording` — nothing can be measured; reach is unknown.
  //   `section`   — the RECORDING side is fully measurable and only the MAP side is
  //                 not, because the map has no row for this arm. An unmapped arm is
  //                 the single most interesting row in a completeness audit, so
  //                 refusing the whole grade would discard exactly the measurement a
  //                 map-completeness check exists to take.
  if (clean === null || arm === null) return { refused: 'recording' };
  const unmapped = section === null;

  const ids = [...new Set([...clean.keys(), ...arm.keys()])].sort();

  // v2 reach: the member's PRINTED line moved (label, payload, or presence).
  const reachedV2 = ids.filter((id) => {
    const a = clean.get(id);
    const b = arm.get(id);
    if (a === undefined || b === undefined) return true;
    return a.label !== b.label || a.payload !== b.payload;
  });

  // v1 reach: the member entered or left a verdict set. null if either verdict
  // line is unreadable — this is the figure the old convention was keyed on and it
  // must be able to refuse too.
  const verdictReached =
    cleanV === null || armV === null
      ? null
      : ids.filter((id) => {
          const pos = (v) =>
            ['red', 'refused', 'refuted', 'prefused']
              .filter((k) => v[k].includes(id))
              .join('+');
          return pos(cleanV) !== pos(armV);
        });

  // The arm the cripple swaps in. Under `verdict-keyed-reach` the grade is taken
  // over the v1 set, which is what the six already-filed maps were keyed on.
  const reached =
    CRIPPLE === 'verdict-keyed-reach' ? (verdictReached ?? []) : reachedV2;

  const sectionText = unmapped ? '' : section.join('\n');
  const mentions = (id) =>
    unmapped ? [] : section.filter((l) => new RegExp(`\\b${id}\\b`).test(l));

  const rows = reached.map((id) => {
    const ctx = mentions(id);
    const a = clean.get(id);
    const b = arm.get(id);
    const ta = a === undefined ? new Map() : tokensOf(a.payload);
    const tb = b === undefined ? new Map() : tokensOf(b.payload);
    const movedTokens = [...new Set([...ta.keys(), ...tb.keys()])]
      .filter((t) => ta.get(t) !== tb.get(t))
      .sort();

    // Theseus's key: the token NAME on a line that mentions the member.
    // `word-anywhere` drops the member-context gate, which is the over-report his
    // own first grading had — scored two tokens named off ordinary prose.
    const haystack = CRIPPLE === 'word-anywhere' ? [sectionText] : ctx;
    const named = movedTokens.filter((t) => haystack.some((l) => new RegExp(`\\b${t}\\b`).test(l)));

    // v2 §3.4's key: the exact `name=value` string, as captured from the arm's
    // recording, occurs in the section. Strictly stronger than `named`.
    const captured = movedTokens.filter((t) => {
      const want = `${t}=${tb.get(t)}`;
      return haystack.some((l) => l.includes(want));
    });

    // Tokens quoted on a line that mentions THIS member, which this member's own
    // payload never emits — the typed-token defect, at the member's granularity.
    //
    // This key was wrong on its first drive and the failure is recorded, not
    // replaced: keyed on the whole RECORDING (`typedRecordingKey` below) it reported
    // n=0 and missed the one defect this unit was predicted to find. `pinned=true` is
    // quoted of `T2bSAT`, which never emits it — but `T8CEIL` does, on its own line,
    // and with the same value `true`. So a recording-wide key lets ANOTHER member's
    // token launder a mis-spelling, which is the precise confusion a captured-token
    // convention exists to prevent. A join key must not widen past the property.
    const ownEmits = new Set([
      ...(a === undefined ? [] : tokensOf(a.payload).keys()),
      ...(b === undefined ? [] : tokensOf(b.payload).keys()),
    ]);
    const quotedOfMe = new Set();
    for (const l of ctx) for (const t of tokensOf(l).keys()) quotedOfMe.add(t);
    const typed = [...quotedOfMe].filter((t) => !ownEmits.has(t)).sort();

    return { id, mentioned: ctx.length > 0, movedTokens, named, captured, typed };
  });

  // The superseded key, kept beside the live one so the correction is a 2-key
  // comparison and not a silent replacement: a token the section quotes that NO
  // member of the arm's recording emits.
  const emitted = new Set();
  for (const v of arm.values()) for (const t of tokensOf(v.payload).keys()) emitted.add(t);
  const quoted = new Set();
  for (const l of unmapped ? [] : section) {
    for (const t of tokensOf(l).keys()) quoted.add(t);
  }
  const typedRecordingKey = [...quoted].filter((t) => !emitted.has(t)).sort();
  const tokensTyped = [...new Set(rows.flatMap((r) => r.typed))].sort();

  // Map-side figures REFUSE on an unmapped arm — `null`, never 0. An arm with no map
  // row has an unmeasurable under-report, not an under-report of zero, and reporting 0
  // would publish the most complete-looking row in the audit for the least mapped arm.
  return {
    refused: null,
    unmapped,
    reached,
    reachedV2,
    verdictReached,
    rows,
    tokensTyped: unmapped ? null : tokensTyped,
    typedRecordingKey: unmapped ? null : typedRecordingKey,
    named: unmapped ? null : rows.filter((r) => r.mentioned).map((r) => r.id),
    // Two axes, kept separate because the v1 key hides exactly one of them. MEMBERSHIP:
    // a reached member with no mention at all. TOKEN: a mentioned member whose moved
    // tokens are not all named. The combined figure conflates them, and the combined
    // figure is what made the first reading of P4 wrong.
    underReported: unmapped ? null : rows.filter((r) => !r.mentioned || r.named.length < r.movedTokens.length).map((r) => r.id),
    underReportedMembership: unmapped ? null : rows.filter((r) => !r.mentioned).map((r) => r.id),
    underReportedTokens: unmapped ? null : rows.filter((r) => r.mentioned && r.named.length < r.movedTokens.length).map((r) => r.id),
    // Two completeness figures, because the two keys genuinely select differently and
    // one of them alone is not a measurement:
    //   fullyNamed    — Theseus's key: every moved token's NAME appears on a
    //                   member-mentioning line. Reproduces his published grade.
    //   fullyCaptured — v2 §3.4's key: every moved token appears as the exact
    //                   `name=value` string captured from the arm's recording.
    // fullyCaptured ≤ fullyNamed by construction; where they differ, the row is one a
    // name-keyed convention passes and no comparison can match.
    fullyNamed: unmapped ? null : rows.filter((r) => r.mentioned && r.named.length === r.movedTokens.length).length,
    fullyCaptured: unmapped ? null : rows.filter((r) => r.mentioned && r.captured.length === r.movedTokens.length).length,
    capturedShort: unmapped ? null : rows.filter((r) => r.captured.length < r.named.length).map((r) => r.id),
  };
};

// ---------------------------------------------------------------------------
// Drive.
// ---------------------------------------------------------------------------
const mapText = readText(MAP_PATH);
const cleanText = readText(CLEAN_PATH);
const labels = ALL_STATUS_LABELS;

const cleanMembers = membersOf(cleanText, labels);
const cleanVerdict = verdictLine(cleanText);

console.log(`=== grade-filed-maps.mjs ===`);
console.log(`map    : ${MAP_PATH}`);
console.log(`clean  : ${CLEAN_PATH}`);
console.log(`cripple: ${CRIPPLE ?? 'none (clean arm)'}`);
console.log(`labels : ${labels.length} [${labels.map((l) => JSON.stringify(l)).join(',')}]`);
console.log('');

// --- GKP: the tokenizer, gated on a REAL SLICE of a recording, not a typed string.
// The slice is T2bSAT's clean payload, whose `selector=max(pins first)` is the token a
// whitespace split breaks. A hand-typed known positive is not a slice.
const kpSlice = cleanMembers === null ? null : (cleanMembers.get('T2bSAT')?.payload ?? null);
const kpTokens = kpSlice === null ? null : tokensOf(kpSlice);
const GKP =
  kpTokens === null
    ? { ok: false, why: 'REFUSED — no T2bSAT payload in the clean recording to slice' }
    : kpTokens.get('selector') === 'max(pins first)' && kpTokens.size === 11
      ? { ok: true, why: `selector round-trips whole; ${kpTokens.size} tokens` }
      : {
          ok: false,
          why: `selector=${JSON.stringify(kpTokens.get('selector'))} size=${kpTokens.size}; want "max(pins first)" and 11`,
        };
console.log(`GKP    ${GKP.ok ? 'ok ' : 'RED'} tokenizer on a real slice: ${GKP.why}`);
// The slice itself, printed verbatim. Any standing figure quoted about this member —
// the T2b countdown is quoted off its pinDistance token — then has a drive line in
// THIS unit to be read off, instead of being retyped from the previous fire's prose.
if (kpSlice !== null) console.log(`KPSLICE ${kpSlice}`);

// --- GABS: ABSOLUTE member count per recording against that recording's own VERDICT
// counts. A delta gate cannot see a constant blindness in this reader; this can.
const GABS = (() => {
  if (cleanMembers === null || cleanVerdict === null) {
    return { ok: false, why: 'REFUSED — clean recording unreadable or no VERDICT line' };
  }
  const want = cleanVerdict.legs + cleanVerdict.preds;
  return cleanMembers.size === want
    ? { ok: true, why: `${cleanMembers.size} members = legs ${cleanVerdict.legs} + preds ${cleanVerdict.preds}` }
    : { ok: false, why: `read ${cleanMembers.size}, VERDICT line says ${want} (legs ${cleanVerdict.legs} + preds ${cleanVerdict.preds})` };
})();
console.log(`GABS   ${GABS.ok ? 'ok ' : 'RED'} absolute member count: ${GABS.why}`);

// --- GSTAMP: the completeness stamp, machine-checked against the clean recording's own
// VERDICT line. `stamp-blind` reports OK without comparing.
const stamp = mapStamp(mapText);
const GSTAMP = (() => {
  if (stamp === null) return { ok: false, verdict: null, why: 'REFUSED — map carries no readable stamp' };
  if (cleanVerdict === null) return { ok: false, verdict: null, why: 'REFUSED — no VERDICT line to compare against' };
  const dLegs = cleanVerdict.legs - stamp.legs;
  const dPreds = cleanVerdict.preds - stamp.preds;
  if (CRIPPLE === 'stamp-blind') {
    return { ok: dLegs === 0 && dPreds === 0, verdict: 'OK', why: `OK (not compared — stamp-blind arm)` };
  }
  const verdict = dLegs === 0 && dPreds === 0 ? 'OK' : `STALE legs=${dLegs >= 0 ? '+' : ''}${dLegs} preds=${dPreds >= 0 ? '+' : ''}${dPreds}`;
  return { ok: true, verdict, why: `${stamp.form} declares legs=${stamp.legs} preds=${stamp.preds}; recording says legs=${cleanVerdict.legs} preds=${cleanVerdict.preds} → ${verdict}` };
})();
console.log(`GSTAMP ${GSTAMP.ok ? 'ok ' : 'RED'} stamp: ${GSTAMP.why}`);
console.log('');

// --- Per-arm grades.
const grades = [];
for (const { name, path } of ARMS) {
  const armText = readText(path);
  const armMembers = membersOf(armText, labels);
  const armVerdict = verdictLine(armText);
  const section = sectionFor(mapText, name);
  let g = gradeArm(cleanMembers, armMembers, section, cleanVerdict, armVerdict);

  // `no-refusal` collapses a refusal into a clean zero — the arm that shows the
  // refusal is load-bearing rather than decorative.
  if (CRIPPLE === 'no-refusal') {
    if (g.refused !== null && g.refused !== undefined) {
      g = { refused: null, unmapped: false, reached: [], reachedV2: [], verdictReached: [], rows: [], tokensTyped: [], typedRecordingKey: [], named: [], underReported: [], underReportedMembership: [], underReportedTokens: [], fullyNamed: 0, fullyCaptured: 0, capturedShort: [] };
    } else if (g.unmapped) {
      g = { ...g, unmapped: false, tokensTyped: [], typedRecordingKey: [], named: [], underReported: [], underReportedMembership: [], underReportedTokens: [], fullyNamed: 0, fullyCaptured: 0, capturedShort: [] };
    }
  }
  grades.push({ name, path, g });

  if (g.refused) {
    console.log(`ARM ${name}`);
    console.log(`  REFUSED (${g.refused}) — reached=null named=null underReported=null`);
    console.log('');
    continue;
  }
  const n = (v) => (v === null ? 'REFUSED' : Array.isArray(v) ? v.length : v);
  const l = (v) => (v === null ? 'REFUSED' : v.join(','));
  console.log(`ARM ${name}${g.unmapped ? '   [UNMAPPED — no section in the map; map-side figures REFUSE]' : ''}`);
  console.log(
    `  reached=${g.reached.length} (v2) · verdictReached=${n(g.verdictReached)} (v1)`
    + ` · named=${n(g.named)} · fullyNamed=${n(g.fullyNamed)} · fullyCaptured=${n(g.fullyCaptured)} · underReported=${n(g.underReported)}`
  );
  console.log(`  reached=[${g.reached.join(',')}]`);
  console.log(`  verdictReached=[${l(g.verdictReached)}]`);
  console.log(`  underReported=[${l(g.underReported)}]  =  membership[${l(g.underReportedMembership)}] + tokens[${l(g.underReportedTokens)}]`);
  console.log(
    `  tokensTyped=[${l(g.tokensTyped)}]   (quoted OF a member, never emitted BY that member)`
    + `  ·  typedRecordingKey=[${l(g.typedRecordingKey)}]  (superseded, recording-wide)`
  );
  if (MEMBER !== null) {
    const r = g.rows.find((x) => x.id === MEMBER);
    console.log(
      `  MEMBER ${MEMBER}: ${r === undefined ? 'UNMOVED moved=0 []' : `REACHED moved=${r.movedTokens.length} [${r.movedTokens.join(',')}]`}`
    );
  }
  for (const r of g.rows) {
    if (r.movedTokens.length === 0 && r.mentioned && r.typed.length === 0) continue;
    console.log(
      `    ${r.id.padEnd(12)} mentioned=${String(r.mentioned).padEnd(5)}`
      + ` moved=${String(r.movedTokens.length).padEnd(2)} [${r.movedTokens.join(',')}]`
      + ` named=[${r.named.join(',')}] captured=[${r.captured.join(',')}] typed=[${r.typed.join(',')}]`
    );
  }
  console.log('');
}

// --- GREACH: the re-key is non-vacuous. v2 reach must strictly contain v1 reach on at
// least one arm; otherwise the re-key cannot be shown to do anything. Under
// `verdict-keyed-reach` the grade is taken over the v1 set and this must go RED.
const GREACH = (() => {
  const live = grades.filter((x) => !x.g.refused);
  if (live.length === 0) return { ok: false, why: 'REFUSED — no arm graded' };
  const strictlyWider = live.filter(
    (x) => x.g.verdictReached !== null && x.g.reached.length > x.g.verdictReached.length
  );
  return strictlyWider.length > 0
    ? { ok: true, why: `${strictlyWider.length}/${live.length} arms: v2 reach strictly wider than v1 (${strictlyWider.map((x) => `${x.name} ${x.g.verdictReached.length}→${x.g.reached.length}`).join('; ')})` }
    : { ok: false, why: `0/${live.length} arms have v2 reach wider than v1 — the re-key is vacuous here` };
})();
console.log(`GREACH ${GREACH.ok ? 'ok ' : 'RED'} re-key non-vacuity: ${GREACH.why}`);

// --- GCTX: the member-context gate on token naming must be able to BITE. Computed in
// the clean arm by taking the loose figure beside the gated one; `word-anywhere`
// replaces the gated figure with the loose one, collapsing the difference.
const GCTX = (() => {
  const live = grades.filter((x) => !x.g.refused && !x.g.unmapped);
  if (live.length === 0) return { ok: false, why: 'REFUSED — no mapped arm graded' };
  const gated = live.reduce((n, x) => n + x.g.rows.reduce((m, r) => m + r.named.length, 0), 0);
  const loose = live.reduce((n, x) => {
    const sectionText = (sectionFor(mapText, x.name) ?? []).join('\n');
    return n + x.g.rows.reduce(
      (m, r) => m + r.movedTokens.filter((t) => new RegExp(`\\b${t}\\b`).test(sectionText)).length,
      0
    );
  }, 0);
  if (CRIPPLE === 'word-anywhere') {
    return { ok: gated < loose, why: `gated=${gated} loose=${loose} — word-anywhere arm: the gate was removed, so these are the same figure` };
  }
  return gated <= loose
    ? { ok: true, why: `gated=${gated} ≤ loose=${loose}; the context gate removes ${loose - gated} token namings` }
    : { ok: false, why: `gated=${gated} > loose=${loose} — impossible unless the gate is not a restriction` };
})();
console.log(`GCTX   ${GCTX.ok ? 'ok ' : 'RED'} member-context gate: ${GCTX.why}`);

// --- GREFUSE: an arm whose recording could not be read must publish null, not 0.
// Two refusal obligations, each with its own occurrence count printed, so a leg that
// is vacuous in this drive says so instead of reading as a pass.
const GREFUSE = (() => {
  const unreadable = ARMS.filter(({ path }) => readText(path) === null).map((a) => a.name);
  // An arm whose RECORDING is unreadable is not also counted as unmapped: the section
  // question is moot there, and counting it twice inflates the occurrence denominator.
  const unmappedNames = ARMS.filter(({ name, path }) => readText(path) !== null && sectionFor(mapText, name) === null).map((a) => a.name);
  const leaked = [];
  for (const nm of unreadable) {
    const x = grades.find((y) => y.name === nm);
    if (x !== undefined && !x.g.refused) leaked.push(`${nm}:recording`);
  }
  for (const nm of unmappedNames) {
    const x = grades.find((y) => y.name === nm);
    if (x !== undefined && !x.g.refused && x.g.underReported !== null) leaked.push(`${nm}:section`);
  }
  const occurrences = unreadable.length + unmappedNames.length;
  if (occurrences === 0) {
    return { ok: true, why: 'VACUOUS in this drive — 0 unreadable recordings and 0 unmapped arms, so nothing was given the chance to refuse' };
  }
  return leaked.length === 0
    ? { ok: true, why: `${occurrences} refusal occasion(s) all refused (unreadable=[${unreadable.join(',')}] unmapped=[${unmappedNames.join(',')}])` }
    : { ok: false, why: `${leaked.length} of ${occurrences} published a figure instead of refusing: [${leaked.join(',')}]` };
})();
console.log(`GREFUSE ${GREFUSE.ok ? 'ok ' : 'RED'} refusal: ${GREFUSE.why}`);

// --- GTYPED: the member-granularity typed-token key must be at least as strict as the
// superseded recording-wide one. A CONTAINMENT, not "a defect exists" — a gate that
// asserts the defect reddens on its own cure, and the point of this key is that it
// cannot be laundered, not that the population is dirty.
const GTYPED = (() => {
  const l = grades.filter((x) => !x.g.refused && !x.g.unmapped);
  if (l.length === 0) return { ok: false, why: 'REFUSED — no mapped arm graded' };
  const escapes = l.flatMap((x) => x.g.typedRecordingKey.filter((t) => !x.g.tokensTyped.includes(t)).map((t) => `${x.name}:${t}`));
  const stricter = l.flatMap((x) => x.g.tokensTyped.filter((t) => !x.g.typedRecordingKey.includes(t)).map((t) => `${x.name}:${t}`));
  return escapes.length === 0
    ? { ok: true, why: `recording-wide key ⊆ member key; member key is stricter by ${stricter.length} token(s)${stricter.length === 0 ? '' : ` [${stricter.join(',')}]`}` }
    : { ok: false, why: `${escapes.length} token(s) the recording-wide key flags escape the member key: [${escapes.join(',')}]` };
})();
console.log(`GTYPED ${GTYPED.ok ? 'ok ' : 'RED'} typed-token key strictness: ${GTYPED.why}`);

// --- Summary, in the units the two authors' hand grades are published in. Map-side
// sums are taken over MAPPED arms only and the unmapped count is published beside
// them, never folded in: an unmapped arm's under-report is unmeasurable, and summing
// it as 0 would make the least-mapped audit look the most complete.
const live = grades.filter((x) => !x.g.refused);
const mapped = live.filter((x) => !x.g.unmapped);
const sumFullyNamed = mapped.reduce((n, x) => n + x.g.fullyNamed, 0);
const sumFullyCaptured = mapped.reduce((n, x) => n + x.g.fullyCaptured, 0);
const sumReached = live.reduce((n, x) => n + x.g.reached.length, 0);
const sumReachedMapped = mapped.reduce((n, x) => n + x.g.reached.length, 0);
const sumUnder = mapped.reduce((n, x) => n + x.g.underReported.length, 0);
const sumUnderMem = mapped.reduce((n, x) => n + x.g.underReportedMembership.length, 0);
const sumUnderTok = mapped.reduce((n, x) => n + x.g.underReportedTokens.length, 0);
const typed = [...new Set(mapped.flatMap((x) => x.g.tokensTyped))].sort();
const typedOld = [...new Set(mapped.flatMap((x) => x.g.typedRecordingKey))].sort();
console.log('');
console.log(
  `GRADE  armsGiven=${ARMS.length} graded=${live.length} unreadable=${ARMS.length - live.length} unmapped=${live.length - mapped.length}`
  + ` reachedCells=${sumReached} (mapped arms ${sumReachedMapped}) fullyNamedCells=${sumFullyNamed} fullyCapturedCells=${sumFullyCaptured} underReportedCells=${sumUnder} (membership ${sumUnderMem} + tokens ${sumUnderTok})`
);
console.log(`TYPED  tokensTyped=[${typed.join(',')}] n=${typed.length}  ·  superseded recording-wide key=[${typedOld.join(',')}] n=${typedOld.length}`);
console.log(`STAMP  ${GSTAMP.verdict ?? 'REFUSED'}`);

// --- GCOMPLETE: every arm the run was GIVEN was measurable. Distinct from GREFUSE,
// which grades whether an unmeasurable arm refused correctly: a run can refuse
// correctly on an arm it could not read and still be an incomplete audit. Without
// this, a drive pointed at a missing recording exits 0 with a clean-looking summary.
const GCOMPLETE = (() => {
  const unreadable = ARMS.filter(({ path }) => readText(path) === null).map((a) => a.name);
  return unreadable.length === 0
    ? { ok: true, why: `all ${ARMS.length} arm recording(s) readable` }
    : { ok: false, why: `${unreadable.length} of ${ARMS.length} arm recording(s) unreadable: [${unreadable.join(",")}] — the audit is incomplete whether or not the refusal was correct` };
})();
console.log(`GCOMP  ${GCOMPLETE.ok ? "ok " : "RED"} coverage: ${GCOMPLETE.why}`);

const gates = { GKP, GABS, GSTAMP, GREACH, GCTX, GREFUSE, GTYPED, GCOMPLETE };
const red = Object.entries(gates).filter(([, v]) => !v.ok).map(([k]) => k);
const code = red.length > 0 ? 1 : 0;
console.log(`\nMAPVERDICT/${code} ${red.length === 0 ? 'ok' : 'RED'} gates=${Object.keys(gates).length} red=[${red.join(',')}]`);
process.exit(code);
