/**
 * Round 361 — arm P's grading drive, factored out so that it is a reviewable file rather than an
 * escaped string inside the probe.
 *
 * Takes the path to a PRE-CURE copy of `probe-outcome.mts` as argv[2], imports it dynamically, and
 * re-states every one of arm P's predicates against it, emitting one JSON row per cell. The point
 * is Theseus's Round 360 clause: a cell's classification as a cure cell or a known negative is
 * BEHAVIOURAL, so it must be driven against the pre-cure lib rather than written in a comment. His
 * own cell O8 was labelled `KN:` and was red at the pre-cure lib; a drive caught it and a comment
 * could not have. This file ran against my first draft of arm P and corrected one of MY labels the
 * same way — `trustworthy-soft` was written as a known negative and is red at Round 360.
 *
 * Not a probe: no conclusion line, nothing to sweep. It is an instrument arm P drives.
 */
const preLibPath = process.argv[2];
if (!preLibPath) { console.error('usage: round361-pin-grade.mts <path-to-pre-cure-probe-outcome.mts>'); process.exit(2); }
const { summarise: pre } = (await import(preLibPath)) as { summarise: unknown };

type O = { code: number; headline: string; reasons: string[] };
const S = (o: Record<string, unknown>): O =>
  (pre as (i: unknown) => O)({ probeName: 'subject', ...o });
const NA = 'not applicable: ';
const SOFT = 'not a hard check, did not run: ';
const hasNA = (o: O) => o.reasons.some((r) => r.startsWith(NA));
const hasSoft = (o: O) => o.reasons.some((r) => r.startsWith(SOFT));
const ok = (arm: string, check: string) => ({ arm, check, pass: true, kind: 'regression' });
const bad = (arm: string, check: string) => ({ arm, check, pass: false, kind: 'regression' });
const HATCH = ['C1 — no untracked, gitignored repo-root backup is present on this tree'];

const LIMBS: Record<string, Record<string, unknown>> = {
  'code 1 · failed': { results: [bad('A', 'broke')], inapplicable: HATCH },
  'code 3 · configProblems': { regressionKind: ['regression'], results: [ok('A', 'fine')], inapplicable: HATCH },
  'code 3 · nearMisses': { regressionKind: 'regressoin', results: [ok('A', 'fine')], inapplicable: HATCH },
  'code 3 · invertedVocabulary': {
    regressionKind: 'check',
    results: [{ arm: 'A', check: 'untagged', pass: true }, ok('B', 'tagged')],
    inapplicable: HATCH,
  },
  'code 3 · unreadableKinds': { results: [{ arm: 'A', check: 'c', pass: true, kind: {} }], inapplicable: HATCH },
  'code 3 · reasons.length': { results: [ok('A', 'fine')], skipped: ['env missing'], inapplicable: HATCH },
  'code 0 · all green': { results: [ok('A', 'fine')], inapplicable: HATCH },
};

const cells: { cell: string; pred: () => boolean; detail: () => string }[] = [
  { cell: 'every-limb',
    pred: () => Object.values(LIMBS).every((i) => hasNA(S(i))),
    detail: () => `${Object.values(LIMBS).filter((i) => hasNA(S(i))).length} of ${Object.keys(LIMBS).length} limbs carry it` },
  { cell: 'distinct-outcomes',
    pred: () => new Set(Object.values(LIMBS).map((i) => `${S(i).code}:${S(i).headline.slice(0, 40)}`)).size >= 6,
    detail: () => `${new Set(Object.values(LIMBS).map((i) => `${S(i).code}:${S(i).headline.slice(0, 40)}`)).size} distinct` },
  { cell: 'no-code-moved',
    pred: () => S(LIMBS['code 1 · failed']).code === 1 && S(LIMBS['code 0 · all green']).code === 0,
    detail: () => `${S(LIMBS['code 1 · failed']).code}/${S(LIMBS['code 0 · all green']).code}` },
  { cell: 'green-stays-green',
    pred: () => {
      const g = S({ results: [ok('A', 'fine')], inapplicable: HATCH });
      return g.code === 0 && /^All 1 regression checks passed\.$/.test(g.headline);
    },
    detail: () => `code ${S({ results: [ok('A', 'fine')], inapplicable: HATCH }).code}` },
  { cell: 'none-declared',
    pred: () => Object.values(LIMBS).every((i) => { const { inapplicable: _d, ...r } = i; return !hasNA(S(r)); }),
    detail: () => 'no synthesised line' },
  { cell: 'empty-declared',
    pred: () => { const e = S({ results: [bad('A', 'broke')], inapplicable: [] }); return !hasNA(e) && e.code === 1; },
    detail: () => `code ${S({ results: [bad('A', 'broke')], inapplicable: [] }).code}` },
  { cell: 'inversion-limb-split',
    pred: () => {
      const o = S({ regressionKind: 'check', results: [{ arm: 'A', check: 'untagged', pass: true }],
        skipped: [{ label: 'env missing', kind: 'regression' }], inapplicable: HATCH });
      return o.code === 3 && hasNA(o) && !hasSoft(o);
    },
    detail: () => { const o = S({ regressionKind: 'check', results: [{ arm: 'A', check: 'untagged', pass: true }],
      skipped: [{ label: 'env missing', kind: 'regression' }], inapplicable: HATCH });
      return `code ${o.code} NA=${hasNA(o)} SOFT=${hasSoft(o)}`; } },
  { cell: 'trustworthy-soft',
    pred: () => {
      const o = S({ results: [ok('A', 'fine'), bad('B', 'broke')],
        skipped: [{ label: 'arm Z', kind: 'open-item' }], inapplicable: HATCH });
      return o.code === 1 && hasSoft(o) && hasNA(o);
    },
    detail: () => { const o = S({ results: [ok('A', 'fine'), bad('B', 'broke')],
      skipped: [{ label: 'arm Z', kind: 'open-item' }], inapplicable: HATCH });
      return `code ${o.code} SOFT=${hasSoft(o)} NA=${hasNA(o)}`; } },
  { cell: 'unreadable-everywhere',
    pred: () => Object.values(LIMBS).every((i) => S({ ...i, inapplicable: 'probe-x' })
      .reasons.some((r) => r.startsWith('inapplicable is '))),
    detail: () => 'Round 359 hatch complaint' },
];

const out = cells.map((c) => {
  let preCure: 'RED' | 'GREEN' | 'ERROR';
  let detail: string;
  try { preCure = c.pred() ? 'GREEN' : 'RED'; detail = c.detail(); } catch (e) { preCure = 'ERROR'; detail = (e as Error).message.slice(0, 80); }
  return { cell: c.cell, preCure, detail };
});
console.log(JSON.stringify(out, null, 1));
