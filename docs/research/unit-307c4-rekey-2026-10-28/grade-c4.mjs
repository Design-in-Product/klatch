/**
 * Grade the re-keyed C4/C4a/C4b of `probe-round307` by MAKING THEM FAIL, not by watching the probe
 * exit 0.
 *
 * Round 467 (Daedalus), 2026-10-28. Argus routed a RED in `probe-round307` C4 caused by my own
 * `scripts/lib/**\/*.mjs` typecheck gate (`87270c6f`); Theseus reproduced it and narrowed the repair
 * to one survivor. The repair is in. This instrument is the part that decides whether the repair is
 * worth anything: five mutation cripples against the wired probe, each with a PREDICTED verdict map
 * written before it is driven, plus a clean control.
 *
 * Shape, and why each piece is here:
 *
 * - **Mutation cripples, not env-var dispatch.** Each keys on an anchor in the probe's own source,
 *   and the anchor is asserted to occur EXACTLY ONCE before it is applied — a cripple whose anchor
 *   occurs zero times is a no-op that reads identically to "the cripple did not redden", which is
 *   the shape that published exit 0 in this thread twice last week.
 * - **The verdict reader is proved on minted lines, both polarities, before any drive is read**, and
 *   an arm MISSING from a drive's output comes back `null` rather than green. A reader that is wrong
 *   only on `FAIL` grades every cripple clean.
 * - **The restore is diffed against a pre-action baseline sha**, not against "the file looks fine" —
 *   and the baseline is captured before the first mutation, so a crash mid-drive is visible.
 * - **Two of the five cripples are predicted to leave C4 GREEN.** Those are the load-bearing ones:
 *   they show that C4's live set equality is blind to the per-signature slice and to the
 *   refusal/`'none'` distinction, and that C4a — minted, not measured — is the only leg covering
 *   either. One further cripple is predicted NOT to separate at all and is labelled as such rather
 *   than counted.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..', '..');
const PROBE = join(
  REPO,
  'scripts',
  'probe-round307-the-return-half-is-gradeable-the-parameter-half-is-any-and-the-arity-check-covers-fourteen-of-eighteen.mts',
);

const sha = (/** @type {string} */ s) => createHash('sha256').update(s).digest('hex').slice(0, 16);
const BASELINE = readFileSync(PROBE, 'utf8');
const BASELINE_SHA = sha(BASELINE);

const results = [];
const check = (/** @type {string} */ id, /** @type {string} */ claim, /** @type {boolean} */ ok, /** @type {string} */ detail) => {
  results.push({ id, ok });
  console.log(`  [${id}] ${ok ? 'PASS' : 'FAIL'}  ${claim}`);
  console.log(`        ${detail}`);
};

// ── G0: the verdict reader, proved in both polarities and on an absent arm ───────────────────────
/**
 * `null` = the arm did not appear in this drive's output. Kept distinct from `false`, because an arm
 * that vanished (renamed, or the probe died before reaching it) and an arm that failed are different
 * events and only one of them is evidence a cripple worked.
 */
const verdictOf = (/** @type {string} */ out, /** @type {string} */ arm) => {
  const m = new RegExp(`^\\s*\\[${arm}\\]\\s+(PASS|FAIL)\\b`, 'm').exec(out);
  return m ? m[1] === 'PASS' : null;
};
const MINTED_OUT = ['  [C4a] PASS  claim text', '  [C4] FAIL  claim text', '  [C9m] MEAS  a measurement'].join('\n');
check(
  'G0',
  'THE READER is proved before any drive is read: it answers true on a minted PASS line, false on a minted FAIL line, and null for an arm that is absent from the output — never green by default',
  verdictOf(MINTED_OUT, 'C4a') === true &&
    verdictOf(MINTED_OUT, 'C4') === false &&
    verdictOf(MINTED_OUT, 'C4b') === null &&
    verdictOf(MINTED_OUT, 'C9m') === null,
  `minted PASS → ${String(verdictOf(MINTED_OUT, 'C4a'))} · minted FAIL → ${String(verdictOf(MINTED_OUT, 'C4'))} · ` +
    `absent arm → ${String(verdictOf(MINTED_OUT, 'C4b'))} · a MEAS line is not a verdict → ${String(verdictOf(MINTED_OUT, 'C9m'))}. ` +
    'The `[C4]` key must not also match `[C4a]`, which `\\b` after the bracket contents is what buys.',
);
check(
  'G0b',
  'and the reader does not confuse a longer arm id for a shorter one — `[C4]` must not be answered by `[C4a]`’s line',
  verdictOf('  [C4a] PASS  only this arm is present', 'C4') === null,
  `output holding only [C4a] PASS, asked for C4 → ${String(verdictOf('  [C4a] PASS  only this arm is present', 'C4'))} (want null). ` +
    'Without this, the two cripples below that are PREDICTED to leave C4 green would have read their own C4a red as C4’s verdict — i.e. the reader would have manufactured G3’s finding instead of measuring it.',
);

// ── The cripples, each with its verdict map PREDICTED here, before the drive ─────────────────────
/**
 * `want` is the predicted verdict map. `null` means "this arm must be absent" — not used here; every
 * cripple is a one-line edit that leaves the probe runnable, which is itself asserted (`ran`).
 */
const CRIPPLES = [
  {
    name: 'k-inline-blind',
    why: 'the inline `@type` branch of the key is live: blind it and the 10 inline-annotated signatures stop matching, which also leaves C4b with no inline style to witness',
    from: 'const inline = /@type\\b/.test(span);',
    to: 'const inline = /@typedef\\b/.test(span);',
    want: { C4a: false, C4: false, C4b: false },
  },
  {
    name: 'k-block-blind',
    why: 'the block `@param` branch is live: blind it and `tsx-required`’s 4 drop out, and C4b loses the other style',
    from: 'const block = /@param\\b/.test(blockAboveOf(src, name));',
    to: 'const block = /@paramz\\b/.test(blockAboveOf(src, name));',
    want: { C4a: false, C4: false, C4b: false },
  },
  {
    name: 'k-inline-per-module',
    why: 'THE LOAD-BEARING ONE: abandon the per-SIGNATURE slice and credit a signature for an `@type` anywhere in its module. C4’s live set equality cannot see it — every real module here is uniformly annotated or uniformly bare, and all four of `tsx-required`’s functions sit in a file that happens to carry one inline `@type` of its own — and C4a, minted with a deliberately mixed module, can',
    from: 'const inline = /@type\\b/.test(span);',
    to: 'const inline = /@type\\b/.test(src);',
    want: { C4a: false, C4: true, C4b: true },
  },
  {
    name: 'k-refuse-as-none',
    why: 'collapse the refusal into `none`. Also invisible to C4 — the live population has no unanchorable signature — so C4a is again the only leg that answers',
    from: "  const span = paramSpanOf(src, name);\n  if (span === null) return null;",
    to: "  const span = paramSpanOf(src, name);\n  if (span === null) return 'none';",
    want: { C4a: false, C4: true, C4b: true },
  },
  {
    name: 'k-count-not-set',
    why: 'PREDICTED NOT TO SEPARATE, and kept for that: drop the member-wise half of the set equality and compare counts only. Annotated is 14 and gradeable is 14 today, so nothing reddens — the set/count distinction is not graded by the live population, which is a statement about this tree, not a defect in the arm',
    from: '  sortedAnnotated.length === sortedGradeable.length && sortedAnnotated.every((k, i) => k === sortedGradeable[i]);',
    to: '  sortedAnnotated.length === sortedGradeable.length;',
    want: { C4a: true, C4: true, C4b: true },
  },
];

const drive = (/** @type {string} */ label, /** @type {number} */ n) => {
  const r = spawnSync('npx', ['tsx', PROBE], { cwd: REPO, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  const out = r.stdout ?? '';
  writeFileSync(join(HERE, `drive${String(n).padStart(2, '0')}.${label}.out`), out);
  writeFileSync(join(HERE, `drive${String(n).padStart(2, '0')}.${label}.err`), r.stderr ?? '');
  return { out, status: r.status };
};

mkdirSync(HERE, { recursive: true });
let n = 1;
const anchorCounts = [];
const observed = [];
let restoredSha = null;

try {
  for (const c of CRIPPLES) {
    const occurrences = BASELINE.split(c.from).length - 1;
    anchorCounts.push({ name: c.name, occurrences });
    if (occurrences !== 1) {
      observed.push({ name: c.name, skipped: true, map: {}, status: null });
      continue;
    }
    writeFileSync(PROBE, BASELINE.split(c.from).join(c.to));
    n += 1;
    const { out, status } = drive(`cripple-${c.name}`, n);
    observed.push({
      name: c.name,
      skipped: false,
      status,
      map: { C4a: verdictOf(out, 'C4a'), C4: verdictOf(out, 'C4'), C4b: verdictOf(out, 'C4b') },
      summary: (/^\s*(All \d+ regression checks passed\.|\d+ of \d+ regression check\(s\) FAILED\.)\s*$/m.exec(out) ?? [
        'SUMMARY LINE NOT FOUND',
      ])[0].trim(),
    });
    writeFileSync(PROBE, BASELINE);
  }
} finally {
  writeFileSync(PROBE, BASELINE);
  restoredSha = sha(readFileSync(PROBE, 'utf8'));
}

// ── G1: every cripple's anchor occurred exactly once ────────────────────────────────────────────
check(
  'G1',
  'every cripple’s anchor occurs EXACTLY ONCE in the probe’s own source — a zero-occurrence anchor is a no-op whose output is indistinguishable from "the cripple did not redden"',
  anchorCounts.every((a) => a.occurrences === 1),
  anchorCounts.map((a) => `${a.name} ${a.occurrences}×`).join(' · '),
);

// ── G2: each cripple's measured verdict map equals its predicted one ─────────────────────────────
const mismatches = [];
for (const c of CRIPPLES) {
  const o = observed.find((x) => x.name === c.name);
  if (!o || o.skipped) {
    mismatches.push(`${c.name}: NOT DRIVEN (anchor count ≠ 1)`);
    continue;
  }
  for (const [arm, wanted] of Object.entries(c.want)) {
    const got = o.map[arm];
    if (got !== wanted) mismatches.push(`${c.name} ${arm}: want ${String(wanted)}, got ${String(got)}`);
  }
}
check(
  'G2',
  'THE GATE: every cripple’s measured verdict map equals the map predicted in this file BEFORE it was driven — including the two predicted to leave C4 green and the one predicted not to separate at all',
  mismatches.length === 0,
  mismatches.length === 0
    ? observed
        .map((o) => `${o.name} → C4a ${String(o.map.C4a)} · C4 ${String(o.map.C4)} · C4b ${String(o.map.C4b)} (exit ${String(o.status)})`)
        .join(' · ')
    : `MISMATCH: ${mismatches.join('; ')}`,
);

// ── G3: the two cripples that must leave C4 green actually did, and C4a caught both ─────────────
const blindToC4 = ['k-inline-per-module', 'k-refuse-as-none'].map((nm) => observed.find((o) => o.name === nm));
check(
  'G3',
  'THE FINDING, stated as its own leg: the per-signature slice and the refusal/`none` distinction are each caught by C4a and MISSED by C4 — so C4a is load-bearing rather than decorative, and C4’s live green is not evidence about either',
  blindToC4.every((o) => o && o.map.C4 === true && o.map.C4a === false),
  blindToC4
    .map((o) => (o ? `${o.name}: C4 ${String(o.map.C4)} (green — blind) · C4a ${String(o.map.C4a)} (red — caught)` : 'MISSING'))
    .join(' · ') +
    '. Both cripples still exit non-zero overall, because C4a is a regression check; a reader following only C4 would have called each of them clean.',
);

// ── G4: the probe is byte-identical to the pre-action baseline ──────────────────────────────────
check(
  'G4',
  'the probe is byte-identical to the baseline captured BEFORE the first mutation — a restoration leg keyed on anything else reads this fire’s own work as residue',
  restoredSha === BASELINE_SHA,
  `baseline sha256/16 ${BASELINE_SHA} · after restore ${String(restoredSha)} · ${CRIPPLES.length} mutations applied and reverted, ${n - 1} driven.`,
);

const red = results.filter((r) => !r.ok);
console.log(
  `\nVERDICT/1 ${red.length === 0 ? 'ok' : 'RED'} legs=${results.length} red=[${red.map((r) => r.id).join(', ')}]`,
);
for (const o of observed) if (!o.skipped) console.log(`  ${o.name}: ${o.summary}`);
process.exit(red.length === 0 ? 0 : 1);
