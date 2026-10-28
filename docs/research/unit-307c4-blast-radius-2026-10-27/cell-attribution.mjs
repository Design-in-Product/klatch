/**
 * Stage 2b — Argus's "13 more functions across those two zero-`@param`-tag modules", checked by
 * member list rather than by count.
 *
 * His memo says, of the gate's effect on `probe-round307`'s C3/C4:
 *
 *   "That makes `Parameters<typeof fn>` resolve to concrete types instead of `any` for 13 more
 *    functions across those two zero-`@param`-tag modules — the probe's own C3/C4 run prints
 *    `gradeable.length` 14, not 1"
 *
 * The 14 and the 13 are both right. The ATTRIBUTION is what this cell checks: are all 13 in the two
 * zero-block-tag modules (`characterisation-markers`, `strip-source`), as the sentence says?
 *
 * Read off `drive16.reproduce-argus-307.out` — this seat's own re-drive of his probe at this REV —
 * rather than off his memo's prose or a retyping of C3's line. The pre-gate baseline is the single
 * member `C4`'s source pins as the whole gradeable set, sliced from the probe's own source so the
 * baseline is not hand-typed either.
 *
 * Usage: node docs/research/unit-307c4-blast-radius-2026-10-27/cell-attribution.mjs [--cripple=<name>]
 *        cripples: baseline-hand-typed | count-not-members
 */

import { readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const REPO = new URL('../../../', import.meta.url).pathname.replace(/\/$/, '');
const DIR = `${REPO}/docs/research/unit-307c4-blast-radius-2026-10-27`;
const CRIPPLE = (process.argv.find((a) => a.startsWith('--cripple=')) ?? '').split('=')[1] ?? null;
const REV = execFileSync('git', ['-C', REPO, 'rev-parse', 'HEAD'], {
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'pipe'],
}).trim();

const PROBE =
  'scripts/probe-round307-the-return-half-is-gradeable-the-parameter-half-is-any-and-the-arity-check-covers-fourteen-of-eighteen.mts';
const RECORDING = `${DIR}/drive16.reproduce-argus-307.out`;

/* ---- the post-gate gradeable set, sliced from this seat's own re-drive ---------------------- */
const recSrc = existsSync(RECORDING) ? readFileSync(RECORDING, 'utf8') : null;
// C3's line ends with "... by anything: <n> (<comma-separated members>)"
const c3 = recSrc === null ? null : recSrc.match(/\[C3\][^\n]*by anything: (\d+) \(([^)]*)\)/);
const postCount = c3 === null ? null : Number(c3[1]);
const postMembers =
  c3 === null
    ? null
    : c3[2]
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

/* ---- the pre-gate gradeable set, sliced from the probe's own C4 source ---------------------- */
const probeSrc = existsSync(`${REPO}/${PROBE}`) ? readFileSync(`${REPO}/${PROBE}`, 'utf8') : null;
// C4 pins the pre-gate set as `gradeable[0] === '<member>'` alongside `gradeable.length === 1`.
const pinnedLen = probeSrc === null ? null : probeSrc.match(/gradeable\.length === (\d+)/)?.[1] ?? null;
const pinnedMember = probeSrc === null ? null : probeSrc.match(/gradeable\[0\] === '([^']+)'/)?.[1] ?? null;
const preMembers =
  CRIPPLE === 'baseline-hand-typed'
    ? ['tsx-required::explainTsxRequirements'] // a one-character slip, the kind a retyping makes
    : pinnedMember === null
      ? null
      : [pinnedMember];

/* ---- the delta, by member -------------------------------------------------------------------- */
const gained =
  postMembers === null || preMembers === null
    ? null
    : postMembers.filter((m) => !preMembers.includes(m));
const byModule =
  gained === null
    ? null
    : gained.reduce((acc, m) => {
        const mod = m.split('::')[0];
        acc[mod] = (acc[mod] ?? 0) + 1;
        return acc;
      }, /** @type {Record<string, number>} */ ({}));

/** The two modules Argus's sentence attributes all 13 to. */
const ARGUS_TWO = ['characterisation-markers', 'strip-source'];

/* ---- legs ----------------------------------------------------------------------------------- */
const legs = [];
const check = (/** @type {string} */ id, /** @type {boolean|null} */ ok, /** @type {string} */ what) =>
  legs.push({ id, ok, what });

// G1 — GATE: the recording and the probe source must both be readable, and C3's printed count must
// equal its own printed member list. A refusal stays a RED.
check(
  'G1',
  recSrc !== null && probeSrc !== null && postMembers !== null && postMembers.length === postCount,
  `C3 line sliced from this seat's own re-drive: ${postMembers === null ? 'ABSENT' : `${postMembers.length} members against its own printed count ${postCount}`}`,
);

// G2 — GATE: the pre-gate baseline came from the probe's own pinned source, and the pin is a
// one-member set. `baseline-hand-typed` reddens here via G3's member check, not here.
check(
  'G2',
  pinnedLen === '1' && pinnedMember !== null,
  `C4's pinned pre-gate set, sliced from probe source: length ${pinnedLen}, member ${pinnedMember}`,
);

// G3 — the hand-typed baseline must not survive. The pinned member has to be a member of the
// post-gate set too (the gate only ADDS gradeable signatures), so a mis-typed baseline shows up as
// a delta one larger than it should be.
check(
  'G3',
  preMembers === null || postMembers === null ? null : preMembers.every((m) => postMembers.includes(m)),
  `pre-gate member(s) still present post-gate: ${preMembers === null ? 'REFUSED' : preMembers.filter((m) => postMembers?.includes(m)).length}/${preMembers.length} [${preMembers.join(' ')}]`,
);

// A1 — Argus's COUNT reproduces.
check(
  'A1',
  gained === null ? null : gained.length === 13 && postCount === 14,
  `gained ${gained === null ? 'REFUSED' : gained.length} (his 13), post-gate total ${postCount} (his 14)`,
);

// A2 — his ATTRIBUTION, by member. The claim is that the 13 are "across those two zero-tag
// modules". Measured per module rather than summed.
const outsideTwo = gained === null ? null : gained.filter((m) => !ARGUS_TWO.includes(m.split('::')[0]));
check(
  'A2',
  outsideTwo === null ? null : outsideTwo.length === 0,
  `of the gained, how many are OUTSIDE his two named modules: ${outsideTwo === null ? 'REFUSED' : `${outsideTwo.length} — ${outsideTwo.length ? outsideTwo.join(' ') : 'none'}`}`,
);

// A3 — the per-module split, published as a measurement rather than a pass/fail, with a sum gate so
// a mis-keyed module cannot hide in a remainder. `count-not-members` collapses this to a bare total,
// which is the shape that let the attribution through in the first place.
const sum = byModule === null ? null : Object.values(byModule).reduce((a, b) => a + b, 0);
check(
  'A3',
  CRIPPLE === 'count-not-members'
    ? gained !== null && gained.length === 13
    : byModule === null || gained === null
      ? null
      : sum === gained.length && Object.keys(byModule).length > 0,
  CRIPPLE === 'count-not-members'
    ? `gained total ${gained?.length} — module split NOT computed (this is the cripple)`
    : `per-module split of the gained: ${byModule === null ? 'REFUSED' : Object.entries(byModule).map(([k, v]) => `${k}=${v}`).join(' ')}, sum=${sum}`,
);

/* ---- report ---------------------------------------------------------------------------------- */
console.log(`REV ${REV}`);
console.log(`CRIPPLE ${CRIPPLE ?? '(none)'}`);
console.log(`RECORDING ${RECORDING.replace(REPO + '/', '')}`);
console.log('');
console.log(`PRE_GATE ${preMembers === null ? 'REFUSED' : preMembers.join(' ')}`);
console.log(`POST_GATE ${postCount} ${postMembers === null ? 'REFUSED' : ''}`);
if (postMembers) for (const m of postMembers) console.log(`  P ${m}`);
console.log('');
console.log(`GAINED ${gained === null ? 'REFUSED' : gained.length}`);
if (byModule) for (const [k, v] of Object.entries(byModule)) console.log(`  G ${k} ${v}`);
console.log('');
for (const l of legs) console.log(`LEG ${l.id} ${l.ok === null ? 'REFUSED' : l.ok ? 'ok' : 'RED'} — ${l.what}`);

const red = legs.filter((l) => l.ok === false).map((l) => l.id);
const refused = legs.filter((l) => l.ok === null).map((l) => l.id);
const token = refused.length ? 'REFUSED' : red.length ? 'RED' : 'ok';
console.log(`VERDICT/1 ${token} legs=${legs.length} red=[${red.join(',')}] refused=[${refused.join(',')}]`);
process.exitCode = token === 'ok' ? 0 : 1;
