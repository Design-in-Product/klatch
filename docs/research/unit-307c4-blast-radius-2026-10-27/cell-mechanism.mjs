/**
 * Stage 2a — does `C4`'s MECHANISM occur anywhere in the 19 selected deferred probes?
 *
 * `C4` broke for a specific reason, read off Argus's memo and then off the probe itself: its
 * `jsdocTags` counter is a regex over `@param\b|@returns\b`, and Daedalus's cure annotated the lib
 * signatures with inline `/** @type {T} *` + '/' instead. A third JSDoc style existing is what
 * falsifies the correlation `C4` pinned. So the question that decides the blast radius is not
 * "which deferred probes mention these files" (stage 1: **19**) but "which of them read a property
 * the cure moved".
 *
 * Two PROBE-SIDE properties, each keyed separately rather than as one "mechanism" bucket:
 *   M1  a JSDoc BLOCK-tag count/regex (`@param` / `@returns`) — `C4`'s own key
 *   M3  `Parameters<typeof …>` / `ReturnType<typeof …>` — what resolved from `any` to concrete
 *
 * ONE SUBJECT-SIDE property, which this cell's first drive got wrong and which the KP caught:
 *   S2  an inline `@type` annotation — what the cure ADDED
 *
 * `S2` was keyed probe-side as "M2" in `drive7`, asserting the KP carried all three. `K1` reddened:
 * `probe-round307` is `M1=true M2=false M3=true`. The RED is correct and the assertion was wrong —
 * `@type` is a property of the **lib file being graded**, not of the probe doing the grading. The
 * two sides are what make the mechanism a correlation at all: the cure writes `@type` into the
 * subject, and `C4` reads `@param`/`@returns` off it. Re-aimed to the subject side with the 9 cured
 * lib files as its own known positive, rather than dropped and rather than `K1` loosened to
 * "every key except M2" — which would have been the cheap fix and would have left the cell
 * asserting a property of the wrong population.
 *
 * WHY A ZERO HERE WOULD OTHERWISE BE WORTHLESS. A source-scanning key fails by returning a smaller
 * number, and this cell's whole output is a set of counts that could each be 0. `probe-round307` is
 * the one probe MEASURED to carry all three properties, so it is the KNOWN POSITIVE and it is run
 * through the identical key in the identical call shape. If the key cannot find M1/M2/M3 in 307, a
 * 0 over the 19 is the key failing, not an absence. 307 is SWEPT, so it is a control and not a
 * member — the populations are reported separately and never summed.
 *
 * KNOWN NEGATIVE: `probe-accepted-multipart-allocation.mts`, a deferred probe stage 1 did NOT
 * select, asserted to carry none of the three. Without it, an all-green M-key could be a key that
 * matches everything.
 *
 * Usage: node docs/research/unit-307c4-blast-radius-2026-10-27/cell-mechanism.mjs [--cripple=<name>]
 *        cripples: kp-drop-m1 | kp-wrong-spelling | neg-use-307 | s2-probe-side | m3t-static-only
 */

import { readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const REPO = new URL('../../../', import.meta.url).pathname.replace(/\/$/, '');
const CRIPPLE = (process.argv.find((a) => a.startsWith('--cripple=')) ?? '').split('=')[1] ?? null;

const git = (/** @type {string[]} */ args) =>
  execFileSync('git', ['-C', REPO, ...args], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
const REV = git(['rev-parse', 'HEAD']).trim();

/** Stage 1's selected set, read from its committed recording rather than recomputed. */
const STAGE1 = `${REPO}/docs/research/unit-307c4-blast-radius-2026-10-27/drive4.recon-with-c0.out`;
const stage1Src = existsSync(STAGE1) ? readFileSync(STAGE1, 'utf8') : null;
const selected = stage1Src === null ? null : [...stage1Src.matchAll(/^ {2}D (\S+)/gm)].map((m) => m[1]);
const stage1Count = stage1Src === null ? null : Number(stage1Src.match(/^SELECTED_DEFERRED (\d+)\//m)?.[1] ?? NaN);

const KP = 'probe-round307-the-return-half-is-gradeable-the-parameter-half-is-any-and-the-arity-check-covers-fourteen-of-eighteen.mts';
const KN = CRIPPLE === 'neg-use-307' ? KP : 'probe-accepted-multipart-allocation.mts';

/** The probe-side keys. `kp-wrong-spelling` mis-keys M1 the way a hand-typed key would. */
const M1_RE = CRIPPLE === 'kp-wrong-spelling' ? /@params\b|@return\b/ : /@param\b|@returns\b/;
const S2_RE = /@type\b/;
const KEYS = {
  M1: M1_RE,
  M3: /Parameters<\s*typeof|ReturnType<\s*typeof/,
  // `s2-probe-side` restores drive7's defect: S2 keyed over the probes. Must redden K1, which is
  // the leg that caught it the first time.
  ...(CRIPPLE === 's2-probe-side' ? { M2: S2_RE } : {}),
};
const keyNames = Object.keys(KEYS).filter((k) => !(CRIPPLE === 'kp-drop-m1' && k === 'M1'));

/**
 * S2, subject-side: the 9 cured lib files, derived from the same commit range stage 1 used. Its own
 * known positive is that EVERY cured file carries `@type` — that is what the cure consists of — and
 * its known negative is that the lib files do NOT carry `C4`'s key where the cure did not add it.
 */
const curedLibs = git(['diff', '--name-only', 'd5205b76~1', '87270c6f'])
  .split('\n')
  .map((s) => s.trim())
  .filter((s) => /^scripts\/lib\/[^/]+\.mjs$/.test(s))
  .sort();
const libProfile = curedLibs.map((p) => {
  const abs = `${REPO}/${p}`;
  if (!existsSync(abs)) return { file: p, s2: null, m1: null };
  const src = readFileSync(abs, 'utf8');
  return { file: p, s2: S2_RE.test(src), m1: /@param\b|@returns\b/.test(src) };
});
const libsUnreadable = libProfile.filter((r) => r.s2 === null);
const libsWithS2 = libProfile.filter((r) => r.s2 === true);
const libsWithM1 = libProfile.filter((r) => r.m1 === true);

/** Returns a per-key boolean map for one probe, or `null` if unreadable — refuse, never 0. */
const profile = (/** @type {string} */ file) => {
  const abs = `${REPO}/scripts/${file}`;
  if (!existsSync(abs)) return null;
  const src = readFileSync(abs, 'utf8');
  return Object.fromEntries(keyNames.map((k) => [k, KEYS[k].test(src)]));
};

const kpProfile = profile(KP);
const knProfile = profile(KN);
const memberProfiles = selected === null ? null : selected.map((f) => ({ file: f, p: profile(f) }));
const unreadable = memberProfiles === null ? null : memberProfiles.filter((r) => r.p === null);

/** Per-key member counts over the 19 — `null` if any member was unreadable. */
const counts =
  memberProfiles === null || unreadable === null || unreadable.length > 0
    ? null
    : Object.fromEntries(keyNames.map((k) => [k, memberProfiles.filter((r) => r.p[k]).length]));

/* ---- legs ---------------------------------------------------------------------------------- */
const legs = [];
const check = (/** @type {string} */ id, /** @type {boolean|null} */ ok, /** @type {string} */ what) =>
  legs.push({ id, ok, what });

// G1 — GATE: stage 1's recording must be readable and its member list must match its own count.
// A refusal here stays a RED: this is the leg that decides whether anything below is a measurement.
check(
  'G1',
  stage1Src !== null && selected !== null && Number.isFinite(stage1Count) && selected.length === stage1Count,
  `stage 1 recording read: ${stage1Src === null ? 'ABSENT' : `${selected?.length} member lines against its own SELECTED_DEFERRED ${stage1Count}`}`,
);

// G2 — GATE: every member readable. Refusal stays a RED, same reason.
check(
  'G2',
  unreadable !== null && unreadable.length === 0,
  `unreadable members: ${unreadable === null ? 'REFUSED (no member list)' : unreadable.length}`,
);

// G3 — GATE on the cell's own headline. This cell exists to publish "M1 = 0 of 19", so M1 must be
// a LIVE key; `M3` likewise. Added because the `kp-drop-m1` cripple exited 0: with M1 dropped, `K1`
// is green on M3 alone, `COUNT M1` is simply absent from the output, and the verdict still reads
// `ok`. Nothing reddened, and the cell had stopped measuring the thing it is named for. Following
// the reds would never have found this; only driving the cripple did. A refusal here stays a RED.
check(
  'G3',
  keyNames.includes('M1') && keyNames.includes('M3') && keyNames.length === 2,
  `live probe-side keys are exactly M1 and M3: [${keyNames.join(' ')}]`,
);

// K1 — KNOWN POSITIVE: the key finds all of its own keys in the one measured victim.
const kpAll = kpProfile !== null && keyNames.every((k) => kpProfile[k]);
check(
  'K1',
  kpAll,
  `KP probe-round307 carries every live key: ${kpProfile === null ? 'UNREADABLE' : keyNames.map((k) => `${k}=${kpProfile[k]}`).join(' ')}`,
);

// K2 — KNOWN NEGATIVE: an unselected deferred probe carries none of them.
const knNone = knProfile !== null && keyNames.every((k) => !knProfile[k]);
check(
  'K2',
  knNone,
  `KN ${KN} carries none: ${knProfile === null ? 'UNREADABLE' : keyNames.map((k) => `${k}=${knProfile[k]}`).join(' ')}`,
);

// S1 — SUBJECT SIDE, the re-aimed half, re-aimed a SECOND time by its own RED.
//
// `drive8` asserted all 9 cured files carry inline `@type` and reddened at 8/9. The miss is real
// and it is not noise: `opaque-container.mjs` was cured with block `@param` tags
// (`git diff d5205b76~1 87270c6f -- scripts/lib/opaque-container.mjs`, three hunks, all `@param`).
// So the cure is NOT "add inline @type" — it is "add a type annotation in ONE OF TWO STYLES,
// chosen per file". The property every cured file must carry is therefore the disjunction, and the
// interesting number is the SPLIT, not the total. Keyed on the disjunction here and partitioned in
// `S4`; refuses rather than counting an unreadable file as a miss.
const libsWithEither = libProfile.filter((r) => r.s2 === true || r.m1 === true);
check(
  'S1',
  libsUnreadable.length > 0
    ? null
    : curedLibs.length === 9 && libsWithEither.length === curedLibs.length,
  `cured lib files carrying a type annotation in EITHER style: ${libsWithEither.length}/${curedLibs.length} (inline @type ${libsWithS2.length}, block tags ${libsWithM1.length}, unreadable ${libsUnreadable.length})`,
);

// S4 — the style split as a positively-keyed 2x2 that must SUM to the population. No bucket is
// reached by fall-through: each of the four is keyed on its own conjunction, and the sum leg is
// what stops a mis-keyed bucket from hiding in a remainder.
const bBoth = libProfile.filter((r) => r.s2 === true && r.m1 === true).length;
const bTypeOnly = libProfile.filter((r) => r.s2 === true && r.m1 === false).length;
const bTagsOnly = libProfile.filter((r) => r.s2 === false && r.m1 === true).length;
const bNeither = libProfile.filter((r) => r.s2 === false && r.m1 === false).length;
check(
  'S4',
  libsUnreadable.length > 0
    ? null
    : bBoth + bTypeOnly + bTagsOnly + bNeither === curedLibs.length && bNeither === 0,
  `style 2x2 over ${curedLibs.length}: both=${bBoth} typeOnly=${bTypeOnly} tagsOnly=${bTagsOnly} neither=${bNeither}, sum=${bBoth + bTypeOnly + bTagsOnly + bNeither}`,
);

// S3 — the asymmetry that falsifies `C4`, measured on the subject side and NAMED BY MEMBER rather
// than counted. `C4` reads `@param`/`@returns`; the files that are now typed but still carry no
// block tag are the ones it cannot see. Argus's memo shows diffs for two files; this leg is where
// it is checked whether those two are a SAMPLE or the whole set.
const typeOnlyMembers = libProfile
  .filter((r) => r.s2 === true && r.m1 === false)
  .map((r) => r.file.replace('scripts/lib/', ''));
const argusTwo = ['characterisation-markers.mjs', 'strip-source.mjs'];
const sameSet =
  typeOnlyMembers.length === argusTwo.length &&
  argusTwo.every((f) => typeOnlyMembers.includes(f)) &&
  typeOnlyMembers.every((f) => argusTwo.includes(f));
check(
  'S3',
  libsUnreadable.length > 0 ? null : typeOnlyMembers.length > 0 && sameSet,
  `cured libs typed but carrying NO block tag — the set C4 cannot see: ${typeOnlyMembers.length} [${typeOnlyMembers.join(' ')}]; identical to the two Argus's memo diffs: ${sameSet}`,
);

/**
 * M3T — the TARGET of an M3 type query, which is what decides whether an M3 hit is a candidate.
 *
 * `COUNT M3 2/19` over-reports: a probe can write `ReturnType<typeof …>` about anything. The
 * mechanism needs the query to resolve against a CURED lib file. Two target shapes, because a
 * static-import key alone would clear the known positive:
 *
 *   static   a `typeof X` whose `X` is imported from one of the 9 cured `.mjs` files
 *   dynamic  the probe RESOLVES `.mjs` files from disk and generates its own cells — this is
 *            `probe-round307`'s shape (its `Parameters<typeof impl.N>` reaches the cured libs
 *            through a generated `import * as impl from './<resolved>.mjs'`, never through a
 *            static import of its own). A static-only key would report 307 as not targeting a
 *            cured lib, which is the opposite of the measured truth.
 *
 * KP = 307, which must be true on at least one shape. Without it a `false` on both members is the
 * key failing to reach a wrapped target rather than an absence.
 */
const curedBasenames = curedLibs.map((p) => p.replace(/^scripts\/lib\//, ''));
const targetProfile = (/** @type {string} */ file) => {
  const abs = `${REPO}/scripts/${file}`;
  if (!existsSync(abs)) return null;
  const src = readFileSync(abs, 'utf8');
  const queried = [...src.matchAll(/(?:Parameters|ReturnType)<\s*typeof\s+([A-Za-z_$][\w$.]*)/g)].map(
    (m) => m[1].split('.')[0],
  );
  // static: the queried root identifier is imported from a cured .mjs lib file
  const staticHit = queried.some((id) => {
    const re = new RegExp(`import[^;]*\\b${id}\\b[^;]*from\\s*['"][^'"]*lib/([^'"/]+\\.mjs)['"]`, 's');
    const m = src.match(re);
    return m !== null && curedBasenames.includes(m[1]);
  });
  // dynamic: the probe resolves .mjs files from disk AND builds an import out of what it found
  // `m3t-static-only` drops the dynamic shape — the key a static-import reading would have used.
  // Must redden `M3T-KP`, because 307 reaches the cured libs only dynamically.
  const dynamicHit =
    CRIPPLE === 'm3t-static-only'
      ? false
      : /readdirSync|ls-tree|globSync/.test(src) && /\.mjs/.test(src) && /import \* as \w+ from/.test(src);
  return { queried: [...new Set(queried)], staticHit, dynamicHit };
};

const m3Members = memberProfiles === null ? [] : memberProfiles.filter((r) => r.p && r.p.M3);
const m3Targets = m3Members.map((r) => ({ file: r.file, t: targetProfile(r.file) }));
const kpTarget = targetProfile(KP);
const m3Reaching = m3Targets.filter((r) => r.t && (r.t.staticHit || r.t.dynamicHit));
const m3TargetUnreadable = m3Targets.filter((r) => r.t === null);

// M3T-KP — the wrapped known positive. A refusal stays a RED: this is the gate on M3T's zero.
check(
  'M3T-KP',
  kpTarget === null ? false : kpTarget.staticHit || kpTarget.dynamicHit,
  `KP probe-round307's M3 query reaches a cured lib: ${kpTarget === null ? 'UNREADABLE' : `static=${kpTarget.staticHit} dynamic=${kpTarget.dynamicHit} queried=[${kpTarget.queried.join(' ')}]`}`,
);

// M3T — the measurement. How many of the M3 members' queries actually reach a cured lib file?
check(
  'M3T',
  m3TargetUnreadable.length > 0 ? null : m3Reaching.length === 0,
  `M3 members whose type query reaches a cured lib file: ${m3Reaching.length}/${m3Members.length}${m3Reaching.length ? ` — ${m3Reaching.map((r) => r.file).join(' ')}` : ' (so the M3 count over-reports and the mechanism-relevant number is 0)'}`,
);

/* ---- report -------------------------------------------------------------------------------- */
console.log(`REV ${REV}`);
console.log(`CRIPPLE ${CRIPPLE ?? '(none)'}`);
console.log(`LIVE_KEYS ${keyNames.join(' ')}`);
console.log(`POPULATION ${selected === null ? 'REFUSED' : selected.length} selected deferred probes (stage 1)`);
console.log('');
if (counts === null) {
  console.log('COUNTS REFUSED — population or a member could not be read');
} else {
  for (const k of keyNames) {
    const who = memberProfiles.filter((r) => r.p[k]).map((r) => r.file);
    console.log(`COUNT ${k} ${counts[k]}/${selected.length}${who.length ? ` — ${who.join(' ')}` : ''}`);
  }
}
console.log('');
console.log(`CONTROL KP ${kpProfile === null ? 'UNREADABLE' : keyNames.map((k) => `${k}=${kpProfile[k]}`).join(' ')}`);
console.log(`CONTROL KN ${knProfile === null ? 'UNREADABLE' : keyNames.map((k) => `${k}=${knProfile[k]}`).join(' ')}`);
console.log('');
console.log('');
console.log(`M3_TARGETS KP static=${kpTarget?.staticHit} dynamic=${kpTarget?.dynamicHit}`);
for (const r of m3Targets) {
  console.log(
    `  M ${r.file}  static=${r.t?.staticHit} dynamic=${r.t?.dynamicHit} queried=[${r.t?.queried.join(' ')}]`,
  );
}
console.log('');
console.log(`SUBJECT ${curedLibs.length} cured lib files`);
for (const r of libProfile) {
  console.log(`  L ${r.file.replace('scripts/lib/', '')}  @type=${r.s2} blockTags=${r.m1}`);
}
console.log('');
for (const l of legs) console.log(`LEG ${l.id} ${l.ok === null ? 'REFUSED' : l.ok ? 'ok' : 'RED'} — ${l.what}`);

const red = legs.filter((l) => l.ok === false).map((l) => l.id);
const refused = legs.filter((l) => l.ok === null).map((l) => l.id);
const token = refused.length ? 'REFUSED' : red.length ? 'RED' : 'ok';
console.log(
  `VERDICT/1 ${token} legs=${legs.length} red=[${red.join(',')}] refused=[${refused.join(',')}]`,
);
process.exitCode = token === 'ok' ? 0 : 1;
