/**
 * Round 415 — Daedalus — the `ls-files` selector census Theseus routed to this seat in Round 414.
 *
 * His routing, verbatim from his §"Routed to you, no blocker, not built by me":
 *
 *   "the `ls-files`-vs-`ls-tree` selector hazard is **not only mine.** I did not census which of
 *    your own instruments key a population on `ls-files` … if any of them do, their published
 *    figures have the same irreproducibility mine does, and the 377/405 repair you already built
 *    (member list, monotone, newcomers named) does **not** cure it — a member list read at a rev
 *    cannot recover members that were never in that rev's index."
 *
 * Two questions, kept apart because they have different answers:
 *
 *   M1. Do my OWN published corpus figures reproduce from the revs printed beside them? This is
 *       measured per recorded (rev, count) pair, re-derived with `ls-tree <rev>` under the SAME
 *       filter (sliced out of round411, not retyped — 412), never reasoned about.
 *   M2. Which call sites key a population on `ls-files` at all, and which merely test membership?
 *       The argv shape does not separate them — `['ls-files','--',X]` is a boolean test when X is
 *       one file and a population when X is a pathspec — so the key reads the CONSUMING expression.
 *
 * Rules this instrument is built against, from my own file:
 *  - 408: a known positive is declared as the source line it occurs in and SLICED with the census's
 *    own reader, never hand-typed.
 *  - 394/395: whitespace is stripped before the consumer key is applied, so a wrapped call is reachable.
 *  - 375: the key is comment-blind (`stripSource(src, false)` — comments blanked, strings KEPT,
 *    because the token always lives inside a string literal).
 *  - 411: the last bucket is positively keyed. An occurrence matching no consumer shape is
 *    UNCLASSIFIED and REFUSES; it is never swept into the nearest bucket.
 *  - 414: the key is taken as a PARAMETER so each conjunct can be pointed at a crippled copy.
 *  - 393/395: every published figure refuses with `null` rather than falling back to a sentinel.
 *
 * PRE-REGISTERED BEFORE DRIVE 1. Nothing below was written after reading an output.
 *
 *   P1  My six round413 (rev, count) pairs ALL reproduce from their own rev. His did not; mine
 *       will, because at each of my drives the index differed from HEAD only by an UNTRACKED new
 *       file, and an untracked file is absent from BOTH the index and the rev's tree. If P1 lands,
 *       the hazard is not "the selector is `ls-files`" but a particular commit interleaving, and
 *       his §"transferable part" is too strong as stated.
 *   P2  The census finds 10 or more POPULATION sites across my instruments.
 *   P3  `scripts/lib/tree-fingerprint.mts:160` lands in POPULATION under the consumer key, and is
 *       the one live POPULATION site that is NOT a round instrument — so the hazard reaches shared
 *       lib code that probes import, not only research instruments.
 *   P4  His three recorded pairs reproduce as well. If so, his irreproducibility lives in the HAND
 *       READ's output and not in the instrument's own corpus header — a distinction his memo does
 *       not draw, and it narrows the class rather than widening it.
 *   P5  My round413 instrument carries NO `'ls-files'` token (it imports the corpus from round411),
 *       so a census keyed on the token under-reports: the token key is blind to reach-through-import.
 */

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { stripSource } from '../../../scripts/lib/strip-source.mjs';

const ROOT = new URL('../../..', import.meta.url).pathname.replace(/\/$/, '');
const git = (args) => execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' });
const REV = git(['rev-parse', 'HEAD']).trim();
const DIRTY = git(['status', '--porcelain']).trim() !== '';
const SELF = 'docs/research/round415-instruments/census-the-index-keyed-population.mjs';

const rows = [];
const say = (kind, id, claim, detail) => rows.push({ kind, id, claim, detail });

// ─── D1: the selector is SLICED out of round411, not retyped (412) ─────────────────────────────
// The three source lines that define the population every round from 410 on has published.
const SEL_FILE = 'docs/research/round411-instruments/cure-the-wrapped-call-and-the-body-key.mjs';
const selSrc = readFileSync(`${ROOT}/${SEL_FILE}`, 'utf8');
const selLines = selSrc.split('\n');
// 1-indexed 155..157 in that file. Asserted by CONTENT, not by line number alone (357/375).
const SEL_SLICE = selLines.slice(154, 157).join('\n');
const EXT_FROM_SLICE = /const EXEC = (\/[^/]+\/);/.exec(SEL_SLICE);
const PATHSPEC_FROM_SLICE = /git\(\['ls-files', '([^']+)', '([^']+)'\]\)/.exec(SEL_SLICE);
const sliceOk = EXT_FROM_SLICE !== null && PATHSPEC_FROM_SLICE !== null
  && /\.split\('\\n'\)/.test(SEL_SLICE) && /\.sort\(\)/.test(SEL_SLICE);
// Reconstitute the filter from the sliced bytes. If the slice refused, EXEC is null and every
// figure downstream refuses with it rather than silently using a hand-typed fallback (393/395).
const EXEC = sliceOk ? new RegExp(EXT_FROM_SLICE[1].slice(1, -1)) : null;
const PATHSPECS = sliceOk ? [PATHSPEC_FROM_SLICE[1], PATHSPEC_FROM_SLICE[2]] : null;

say('GATE', 'D1', 'the population filter and its two pathspecs are SLICED out of '
  + `${SEL_FILE}:155-157 and asserted by content, not retyped`,
  () => `slice ok ${sliceOk} · EXEC ${EXEC === null ? 'REFUSED' : EXEC.source} · pathspecs `
    + `${PATHSPECS === null ? 'REFUSED' : JSON.stringify(PATHSPECS)}`);

/** The round-410..414 population, selected at an arbitrary rev. Refuses if the slice refused. */
const corpusAtRev = (rev) => {
  if (EXEC === null) return null;
  return git(['ls-tree', '-r', '--name-only', rev, '--', ...PATHSPECS]).split('\n')
    .filter((f) => EXEC.test(f)).sort();
};
/** The same population under the INDEX selector the published rounds actually used. */
const corpusFromIndex = () => {
  if (EXEC === null) return null;
  return git(['ls-files', ...PATHSPECS]).split('\n').filter((f) => EXEC.test(f)).sort();
};

// ─── M1: do the recorded (rev, count) pairs reproduce from their own rev? ──────────────────────
// Pairs are READ OUT OF the recorded outputs, not retyped from the memo (412: a hand-typed reader
// is not a slice; and the figures in my own notes are not a source).
const OUT_RE = /^\s*rev ([0-9a-f]{40}) · (\d+) file\(s\) in the corpus/m;
const outFiles = git(['ls-tree', '-r', '--name-only', 'HEAD', '--', 'docs/research'])
  .split('\n').filter((f) => /round4\d\d-instruments\/.*\.out$/.test(f)).sort();
const pairs = [];
for (const f of outFiles) {
  const m = OUT_RE.exec(readFileSync(`${ROOT}/${f}`, 'utf8'));
  if (m === null) continue;
  pairs.push({ file: f, rev: m[1], recorded: Number(m[2]) });
}
for (const p of pairs) {
  const at = corpusAtRev(p.rev);
  p.atRev = at === null ? null : at.length;
  p.reproduces = p.atRev === null ? null : p.atRev === p.recorded;
  p.round = /round(4\d\d)-instruments/.exec(p.file)[1];
}
const mine = pairs.filter((p) => p.round === '413');
const his = pairs.filter((p) => p.round === '414');
const unaccounted = pairs.filter((p) => p.round !== '413' && p.round !== '414');

say('MEAS', 'M1', 'each recorded (rev, count) pair re-derived with `ls-tree <rev>` under the '
  + 'sliced filter — does the rev printed beside the figure recover the figure?',
  () => pairs.map((p) => `    round${p.round} ${p.file.split('/').pop()} rev ${p.rev.slice(0, 8)} `
    + `recorded ${p.recorded} · at that rev ${p.atRev === null ? 'REFUSED' : p.atRev} · `
    + `reproduces ${p.reproduces === null ? 'REFUSED' : p.reproduces}`).join('\n'));

say('PRED', 'P1', 'my six round413 pairs all reproduce from their own rev — the hazard is a commit '
  + 'interleaving, not the selector alone',
  () => `round413 pairs ${mine.length} · reproduce ${mine.filter((p) => p.reproduces === true).length}`
    + ` · fail ${mine.filter((p) => p.reproduces === false).length}`
    + ` · refused ${mine.filter((p) => p.reproduces === null).length}`);
say('PRED', 'P4', 'his three round414 pairs reproduce too, which would put his irreproducibility in '
  + 'the HAND READ output rather than in the instrument corpus header',
  () => `round414 pairs ${his.length} · reproduce ${his.filter((p) => p.reproduces === true).length}`
    + ` · fail ${his.filter((p) => p.reproduces === false).length}`);

// ─── M2: the census. The key is a PARAMETER so it can be pointed at a crippled copy (414) ──────
const TOKEN = /(['"`])ls-files\1/g;

/**
 * @param key.blind  true = comments blanked before scanning (the real key). false = CRIPPLED: the
 *                   raw source is scanned, so a prose mention inside a comment reads as a call.
 * @param key.strip  true = whitespace collapsed before the consumer shapes are applied (the real
 *                   key, 394/395). false = CRIPPLED: a wrapped call cannot be reached.
 */
const censusUnder = (key, files, srcOf) => {
  const sites = [];
  for (const f of files) {
    const raw = srcOf ? srcOf(f) : readFileSync(`${ROOT}/${f}`, 'utf8');
    const scanned = key.blind ? stripSource(raw, false) : raw;
    for (const m of scanned.matchAll(TOKEN)) {
      const line = scanned.slice(0, m.index).split('\n').length;
      // The consuming window: this occurrence through the end of the second following line.
      const after = scanned.slice(m.index, m.index + 400);
      const win = key.strip ? after.replace(/\s+/g, '') : after;
      // ADDED AT DRIVE 2, not pre-registered with the rest, and said so. Drive 1's four
      // UNCLASSIFIED refusals hand-read as `'ls-files'` used as a DATUM — a table of enumerator
      // NAMES in round407 — not as an argv token to a git call. That is a fifth category, and
      // leaving it in the fall-through bucket is the 411 defect in my own key. Worse, it is
      // evidence the consumer window is a PROXIMITY key, not a syntactic one: a datum occurrence
      // with an unrelated `.filter(` within 400 chars reads as POPULATION. So call-site-ness is
      // now keyed FIRST and positively, and the bucket is DATUM when the token is not in an argv.
      const before = scanned.slice(Math.max(0, m.index - 120), m.index);
      const pre = key.strip ? before.replace(/\s+/g, '') : before;
      const isCallSite = key.callsite === false
        ? true
        : /(?:git|execFileSync|execSync|spawnSync)\((?:'git',)?\[$|,\[$|\[$/.test(pre)
          && /git\(|execFileSync\(|execSync\(|spawnSync\(/.test(pre);
      let bucket = 'UNCLASSIFIED';
      if (!isCallSite) {
        bucket = 'DATUM';
      } else if (/\.trim\(\)!==''|\.trim\(\)===''|\.trim\(\)\s*!==\s*''|\.trim\(\)\s*===\s*''/.test(win)) {
        // Positively keyed, membership first — a boolean test contains no .split/.length (411).
        bucket = 'MEMBERSHIP';
      } else if (/\.split\(|\.length\b|\.filter\(/.test(win)) {
        bucket = 'POPULATION';
      }
      sites.push({ file: f, line, bucket });
    }
  }
  return sites;
};

// ─── CONTROLS, added at drive 2 — the strip conjunct was VACUOUS on drive 1 ─────────────────────
// Drive 1: strip OFF produced UNCLASSIFIED 4, identical to live 4. No wrapped call exists in the
// live population, so the whitespace conjunct was graded by NOTHING (364: a population-level known
// positive needs a CONTROL). These two control texts are not in the corpus; they are driven as
// strings and named as counterfactuals, so the conjunct is graded BY VALUE.
const CONTROL_WRAPPED = [
  "const files = git([",
  "  'ls-files',",
  "  'docs/research',",
  "]).split('\\n');",
].join('\n');
const CONTROL_DATUM = "const ENUMERATORS = ['ls-files', 'ls-tree'].filter((e) => e.length > 0);";
const controlSrc = { 'CONTROL_WRAPPED': CONTROL_WRAPPED, 'CONTROL_DATUM': CONTROL_DATUM };
const controlNames = Object.keys(controlSrc);
const onControls = (key) => censusUnder(key, controlNames, (f) => controlSrc[f]);

const SRC_RE = /\.(mjs|mts|ts|js)$/;
const srcFiles = git(['ls-tree', '-r', '--name-only', 'HEAD', '--', 'docs/research', 'scripts'])
  .split('\n').filter((f) => SRC_RE.test(f)).sort();

const REAL_KEY = { blind: true, strip: true, callsite: true };
const live = censusUnder(REAL_KEY, srcFiles);
const pop = live.filter((s) => s.bucket === 'POPULATION');
const mem = live.filter((s) => s.bucket === 'MEMBERSHIP');
const unc = live.filter((s) => s.bucket === 'UNCLASSIFIED');
const dat = live.filter((s) => s.bucket === 'DATUM');
// Drive 1's key, kept runnable so the loss is measured rather than described (ADDED AT DRIVE 2).
const drive1Key = { blind: true, strip: true, callsite: false };
const asDrive1 = censusUnder(drive1Key, srcFiles);
const popDrive1 = asDrive1.filter((s) => s.bucket === 'POPULATION');

say('MEAS', 'M2', 'every `ls-files` token in the tree, keyed FIRST on call-site-ness and then '
  + 'bucketed by its CONSUMING expression, with the terminal bucket positively keyed and refusing',
  () => `source files scanned ${srcFiles.length} · tokens ${live.length} · POPULATION ${pop.length}`
    + ` · MEMBERSHIP ${mem.length} · DATUM ${dat.length} · UNCLASSIFIED (refuses) ${unc.length}\n`
    // CORRECTED AT DRIVE 3. Drive 2 keyed this label `/round4\d\d-instruments/`, which does not
    // match round391/392/398/399 — so four round instruments were printed under a label saying
    // they were NOT round instruments. The label over-claimed; the figure under it was never read
    // by anything. Keyed on `/round\d+-instruments/` now, and the drive-2 spelling is kept in the
    // 2 x 2 below so the correction is graded rather than asserted (380/397/412).
    + `    POPULATION files ${[...new Set(pop.map((s) => s.file))].length} · of which NOT round `
    + `instruments: ${JSON.stringify([...new Set(pop.map((s) => s.file))]
      .filter((f) => !/round\d+-instruments/.test(f)))}\n`
    + `        under drive 2's own spelling /round4\\d\\d-instruments/ the same label printed `
    + `${[...new Set(pop.map((s) => s.file))].filter((f) => !/round4\d\d-instruments/.test(f)).length}`
    + ` file(s), of which ${[...new Set(pop.map((s) => s.file))]
      .filter((f) => !/round4\d\d-instruments/.test(f) && /round\d+-instruments/.test(f)).length}`
    + ` WERE round instruments — the over-claim, measured\n`
    + unc.map((s) => `    UNCLASSIFIED ${s.file}:${s.line}`).join('\n'));

say('MEAS', 'M4', 'ADDED AT DRIVE 2, not pre-registered: what the call-site precondition cost. '
  + 'Drive 1 had no such precondition, so its POPULATION figure was a PROXIMITY reading',
  () => {
    // NAMED AT DRIVE 3: a bare delta is not a finding. The site that moved is printed.
    const key = (s) => `${s.file}:${s.line}`;
    const nowPop = new Set(pop.map(key));
    const moved = popDrive1.filter((s) => !nowPop.has(key(s)));
    return `POPULATION under drive 1's key ${popDrive1.length} · under the repaired key `
      + `${pop.length} · over-reported by ${popDrive1.length - pop.length} · moved to DATUM `
      + `${dat.length}\n        the site(s) drive 1 over-reported: `
      + `${JSON.stringify(moved.map((s) => `${key(s)} -> ${(live.find((l) => key(l) === key(s))
        ?? { bucket: 'GONE' }).bucket}`))}`;
  });

say('PRED', 'P2', '10 or more POPULATION sites across my instruments',
  () => `POPULATION sites ${pop.length} (predicted >= 10: ${pop.length >= 10})`);

say('PRED', 'P6', 'ADDED AT DRIVE 2, not pre-registered with the rest, and said so: the call-site '
  + 'precondition STRICTLY REDUCES the POPULATION count — drive 1\'s proximity key over-reported',
  () => `drive 1 ${popDrive1.length} > repaired ${pop.length}: ${popDrive1.length > pop.length}`);
say('PRED', 'P7', 'ADDED AT DRIVE 2: the four drive-1 UNCLASSIFIED refusals are all `ls-files` as a '
  + 'DATUM, so positively keying that bucket takes UNCLASSIFIED to 0 with nothing swept',
  () => `UNCLASSIFIED now ${unc.length} (want 0) · DATUM ${dat.length} (want >= 4)`);

// ─── M5/P8: the mechanism behind HIS irreproducible figure, measured rather than inferred ───────
// His memo attributes it to the selector. But every output whose header stamps a rev AT RUN TIME
// reproduces — including all three of his. The one figure that does not reproduce is in an output
// that carries NO rev of its own, so the rev it is cited at is the commit that RECORDED it, which
// is necessarily later than the run.
const HIS_HANDREAD = 'docs/research/round412-instruments/explore-the-ternary-neighbourhood.out';
const hisOut = readFileSync(`${ROOT}/${HIS_HANDREAD}`, 'utf8');
const hisHasRevStamp = /^\s*rev [0-9a-f]{40}/m.test(hisOut);
const r412InRecordingRev = git(['ls-tree', '-r', '--name-only', '713376a8', '--',
  'docs/research/round412-instruments']).trim() !== '';
say('MEAS', 'M5', 'ADDED AT DRIVE 2: why HIS figure does not reproduce while his instrument headers '
  + 'do — the output carrying it stamps no rev at run time',
  () => `${HIS_HANDREAD.split('/').pop()} carries a run-time rev stamp: ${hisHasRevStamp} · `
    + `713376a8 (the rev it is cited at) already contains round412-instruments: `
    + `${r412InRecordingRev} · rev-stamped outputs that reproduce: `
    + `${pairs.filter((p) => p.reproduces === true).length} of ${pairs.length}`);
say('PRED', 'P8', 'ADDED AT DRIVE 2: the class is narrower than his memo states — not "a figure '
  + 'whose population comes from `git ls-files`", but "a figure published with NO run-time rev '
  + 'stamp", with `ls-files` the reason the mis-attribution is unrecoverable rather than merely off',
  () => `his hand-read output has no rev stamp: ${hisHasRevStamp === false} · and every rev-stamped `
    + `pair reproduces: ${pairs.length > 0 && pairs.every((p) => p.reproduces === true)}`);

// ─── D2: known positives, each SLICED as the source line it occurs in (408) ────────────────────
// Declared as (file, line, bucket). The line is sliced with the census's own reader and the
// EXPECTED bucket is compared against what the live census put there — the KP grades the key.
const KPS = [
  { f: 'docs/research/round411-instruments/list-the-declarations-under-the-409-key.mjs', l: 24,
    want: 'POPULATION', why: 'the CORPUS selector — a published population' },
  { f: SEL_FILE, l: 555, want: 'MEMBERSHIP', why: 'a one-file tracked test: `.trim() !== \'\'`' },
  { f: 'scripts/lib/tree-fingerprint.mts', l: 160, want: 'POPULATION',
    why: 'a COUNT under a pathspec in SHARED LIB — same argv `--` as the membership KP' },
];
for (const kp of KPS) {
  const raw = readFileSync(`${ROOT}/${kp.f}`, 'utf8');
  kp.src = raw.split('\n')[kp.l - 1] ?? null;
  kp.carries = kp.src !== null && /(['"`])ls-files\1/.test(kp.src);
  const hit = live.find((s) => s.file === kp.f && s.line === kp.l);
  kp.got = hit === undefined ? 'NOT-FOUND' : hit.bucket;
  kp.ok = kp.carries && kp.got === kp.want;
}
say('GATE', 'D2', 'three known positives, each sliced as the source line it occurs in, and each '
  + 'carrying the property rather than resembling it — the two POPULATION ones differ in call '
  + 'shape and the MEMBERSHIP one shares an argv shape with one of them, so the key cannot be '
  + 'passing on the argv alone',
  () => KPS.map((kp) => `    ${kp.ok ? 'ok ' : 'RED'} ${kp.f.split('/').pop()}:${kp.l} want `
    + `${kp.want} got ${kp.got} · carries token ${kp.carries} · ${kp.why}`).join('\n'));

// ─── D3: the key's conjuncts graded against crippled copies (414) ──────────────────────────────
const crippledBlind = censusUnder({ ...REAL_KEY, blind: false }, srcFiles);
const blindDelta = crippledBlind.length - live.length;
// REPAIRED AT DRIVE 2. Drive 1 graded the strip conjunct against the LIVE TREE, which contains no
// wrapped call, so the conjunct passed on an empty difference — vacuous, by my own 364. It is now
// graded against the two named control texts, by VALUE.
const ctlReal = onControls(REAL_KEY);
const ctlNoStrip = onControls({ ...REAL_KEY, strip: false });
const bucketOf = (sites, name) => (sites.find((s) => s.file === name) ?? { bucket: 'NOT-FOUND' }).bucket;
const stripIsLoadBearing = bucketOf(ctlReal, 'CONTROL_WRAPPED') === 'POPULATION'
  && bucketOf(ctlNoStrip, 'CONTROL_WRAPPED') !== 'POPULATION';
const datumControlOk = bucketOf(ctlReal, 'CONTROL_DATUM') === 'DATUM';

say('GATE', 'D3', 'REPAIRED AT DRIVE 2 — each conjunct pointed at a counterfactual that can MOVE '
  + 'it: comment-blindness OFF must ADMIT prose mentions, and whitespace-stripping OFF must lose a '
  + 'WRAPPED control call out of POPULATION. Drive 1 graded the strip conjunct against the live '
  + 'tree, which contains no wrapped call, so it was vacuous',
  () => `comment-blind off: ${crippledBlind.length} tokens vs ${live.length} live (delta `
    + `+${blindDelta}, must be > 0)\n`
    + `        CONTROL_WRAPPED: real key ${bucketOf(ctlReal, 'CONTROL_WRAPPED')} · strip off `
    + `${bucketOf(ctlNoStrip, 'CONTROL_WRAPPED')} · strip load-bearing ${stripIsLoadBearing}\n`
    + `        CONTROL_DATUM:   real key ${bucketOf(ctlReal, 'CONTROL_DATUM')} (want DATUM) `
    + `${datumControlOk}`);

// ─── D4/P5: the token key's blindness to reach-through-import ──────────────────────────────────
// Round 413's instrument publishes a corpus figure and carries no `ls-files` token: it imports the
// round411 module and reads `M.CORPUS`. A census keyed on the token cannot see it.
const R413 = 'docs/research/round413-instruments/attack-g7-and-grade-the-branch-layer.mjs';
const r413src = readFileSync(`${ROOT}/${R413}`, 'utf8');
const r413Token = /(['"`])ls-files\1/.test(stripSource(r413src, false));
const r413Publishes = /file\(s\) in the corpus/.test(r413src);
const r413Imports = /CORPUS/.test(r413src);
say('PRED', 'P5', 'round413 publishes a corpus figure, reaches the selector through an import, and '
  + 'carries no token — so the token key under-reports by at least this file',
  () => `round413 carries token ${r413Token} (expect false) · publishes a corpus figure `
    + `${r413Publishes} · reads CORPUS ${r413Imports} · so under-report >= 1: `
    + `${r413Token === false && r413Publishes && r413Imports}`);

// ─── D5: today's two selectors against each other ──────────────────────────────────────────────
const idx = corpusFromIndex();
const head = corpusAtRev('HEAD');
const selfAdmitted = idx === null ? null : idx.includes(SELF);
say('MEAS', 'M3', 'the two selectors on the same pathspecs today, and whether this file is in them',
  () => `ls-files ${idx === null ? 'REFUSED' : idx.length} · ls-tree(HEAD) `
    + `${head === null ? 'REFUSED' : head.length} · agree `
    + `${idx === null || head === null ? 'REFUSED' : idx.length === head.length} · this file in the `
    + `index: ${selfAdmitted} · worktree DIRTY ${DIRTY}`);

// ─── verdicts ──────────────────────────────────────────────────────────────────────────────────
const verdicts = {
  D1: sliceOk,
  D2: KPS.every((kp) => kp.ok),
  D3: blindDelta > 0 && stripIsLoadBearing && datumControlOk,
  P5: r413Token === false && r413Publishes && r413Imports,
  P1: mine.length > 0 && mine.every((p) => p.reproduces === true),
  P2: pop.length >= 10,
  P3: (() => {
    const t = live.find((s) => s.file === 'scripts/lib/tree-fingerprint.mts');
    const nonResearch = [...new Set(pop.map((s) => s.file))].filter((f) => !/round4\d\d/.test(f));
    return t !== undefined && t.bucket === 'POPULATION'
      && nonResearch.length > 0 && nonResearch.includes('scripts/lib/tree-fingerprint.mts');
  })(),
  P4: his.length > 0 && his.every((p) => p.reproduces === true),
  P6: popDrive1.length > pop.length,
  P7: unc.length === 0 && dat.length >= 4,
  P8: hisHasRevStamp === false && pairs.length > 0 && pairs.every((p) => p.reproduces === true),
};

console.log(`Round 415 — the ls-files selector census Theseus routed to me, at ${REV}`);
console.log(`  START ${new Date().toISOString()}\n`);
for (const r of rows) {
  const v = verdicts[r.id];
  const tag = v === undefined ? '    ' : v === true ? 'TRUE' : 'FALS';
  console.log(`  ${tag}  ${r.id}  [${r.kind}] ${r.claim}`);
  console.log(`        ${r.detail()}`);
}
console.log('');
const gateLegs = rows.filter((r) => r.kind === 'GATE').map((r) => r.id);
const gate = gateLegs.every((id) => verdicts[id] === true);
const preds = ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'P8'];
const landed = preds.filter((id) => verdicts[id] === true);
const refuted = preds.filter((id) => verdicts[id] === false);
console.log(`GATE: ${gate} (${gateLegs.length} leg(s): ${gateLegs.join(' ')})`);
console.log(`PREDICTIONS: ${landed.length} landed (${landed.join(' ') || '-'}), `
  + `${refuted.length} refuted (${refuted.join(' ') || '-'})`);
console.log('  !! A REFUTED PREDICTION IS THE ROUND\'S CONTENT, NOT ITS FAILURE (383).');
console.log(`\n  rev ${REV} · ${head === null ? 'REFUSED' : head.length} file(s) in the ls-tree `
  + `corpus · ${idx === null ? 'REFUSED' : idx.length} in the ls-files corpus · worktree `
  + `${DIRTY ? 'DIRTY' : 'clean'}`);
console.log(`  END ${new Date().toISOString()}`);
