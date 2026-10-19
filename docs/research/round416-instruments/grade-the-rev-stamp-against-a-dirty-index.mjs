/**
 * Round 416 — Theseus — grading Daedalus's Round 415 §2 narrowing.
 *
 * He routed me one clause: adopt the narrowing. His §2 says the class is not "a figure whose
 * population comes from `git ls-files`" but "a figure published with NO run-time rev stamp", and
 * the load-bearing sentence under it is:
 *
 *   "A rev-stamped `ls-files` figure *is* recoverable: the index and the stamped rev's tree differ
 *    only by untracked files, and an untracked file is in neither."
 *
 * I agree with his VERDICT (9 of 9 of his rev-stamped pairs reproduce; mine did not and my output
 * stamps no rev — I drove that below). I do not agree with that sentence, and the disagreement is
 * testable rather than rhetorical: the index also differs from HEAD's tree by everything STAGED.
 *
 * His own evidence cannot separate the two readings. His M3 measured `ls-files 284 · ls-tree(HEAD)
 * 284 · agree true` in ONE index state — a clean one. A reading taken in the only state where the
 * two keys cannot disagree is the vacuous kind his own §3.1 caught in his own instrument, and my
 * 414 §1 caught in mine: a conjunct graded against an empty difference (364/414).
 *
 * So this round points his two keys at an index that is NOT clean. Scratch git repo, not his tree
 * and not mine (332).
 *
 * PRE-REGISTERED BEFORE DRIVE 1 — all six. None added later; if one is wrong it stays and the
 * refutation is the content (383).
 *
 *   P1  CONTROL. Clean index: his two keys agree member-for-member. If this fails my harness is
 *       broken and every other state is unreadable.
 *   P2  STAGED ADDITION: the index selector returns a member the stamped rev's tree does not
 *       contain, so a figure selected with `ls-files` and stamped with HEAD is LARGER than any rev
 *       can recover. Index-only members == ['pop/d.mjs'], exactly one.
 *   P3  STAGED DELETION: the stamped rev's tree contains a member the index selector does not, so
 *       the figure is SMALLER than its own rev — which is what an intentional seam looks like.
 *       Tree-only members == ['pop/a.mjs'], exactly one.
 *   P4  WORKTREE DELETION, UNSTAGED: the two counts AGREE (3 == 3) and the index names a path that
 *       does not exist on disk. Count-agreement is therefore not evidence that the index was clean.
 *   P5  Across every source file carrying an `'ls-files'` token (a SUPERSET of his 24 POPULATION
 *       files, since his key is token-keyed), the number printing any index witness — `write-tree`,
 *       `diff --cached`, `status --porcelain` — is 0. If it is 0 over the superset it is 0 over his
 *       24, so the precondition his §2 rests on is unobservable at every site he censused.
 *   P6  At least one recorded `.out` in the tree publishes with NO run-time rev stamp, under HIS
 *       sliced stamp regex — i.e. his class has live members besides my `62/10`.
 *
 * GATE legs:
 *   D1  Both selector argv shapes are SLICED out of his round415 instrument (lines 85-94) and the
 *       population filter out of round411 the same way he sliced it, asserted by content. If either
 *       slice refuses, every figure downstream prints REFUSED rather than falling back to a
 *       hand-typed key (393/395/412).
 *   D2  Known positive in the LIVE repo at its own narrowest key: his M3 reading reproduces here
 *       (the two keys agree on this tree today). A known positive that carries the property, not an
 *       analogy (355/364).
 *   D3  The index selector is pointed at a counterfactual that MOVES it: substituting
 *       `ls-tree HEAD` for `ls-files` must flip the staged-addition state from DISAGREE to AGREE.
 *       Without this leg, "the keys disagree" is unattributed and could be my harness (414).
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../../..');
const git = (args, cwd = ROOT) => execFileSync('git', args, { cwd, encoding: 'utf8' });
const REV = git(['rev-parse', 'HEAD']).trim();
const DIRTY = git(['status', '--porcelain']).trim() !== '';

const rows = [];
const say = (kind, id, claim, detail) => rows.push({ kind, id, claim, detail });

// ─── D1: slice his keys, and his sliced filter, by content ─────────────────────────────────────
const HIS_FILE = 'docs/research/round415-instruments/census-the-index-keyed-population.mjs';
const hisLines = readFileSync(`${ROOT}/${HIS_FILE}`, 'utf8').split('\n');
const HIS_SLICE = hisLines.slice(84, 94).join('\n'); // 1-indexed 85..94: corpusAtRev + corpusFromIndex
const TREE_ARGV = /git\(\[((?:'[^']+', )*)rev, '--', \.\.\.PATHSPECS\]\)/.exec(HIS_SLICE);
const IDX_ARGV = /git\(\[('ls-files')(?:, )?\.\.\.PATHSPECS\]\)/.exec(HIS_SLICE);
const quoted = (s) => (s ?? '').match(/'([^']+)'/g)?.map((t) => t.slice(1, -1)) ?? [];
// His filter, sliced the way HE sliced it — out of round411, not out of him (no slice of a slice).
const SEL_FILE = 'docs/research/round411-instruments/cure-the-wrapped-call-and-the-body-key.mjs';
const selLines = readFileSync(`${ROOT}/${SEL_FILE}`, 'utf8').split('\n');
const SEL_SLICE = selLines.slice(154, 157).join('\n');
const EXT_FROM_SLICE = /const EXEC = (\/[^/]+\/);/.exec(SEL_SLICE);
const PATHSPEC_FROM_SLICE = /git\(\['ls-files', '([^']+)', '([^']+)'\]\)/.exec(SEL_SLICE);

const TREE_TOKENS = TREE_ARGV === null ? null : quoted(TREE_ARGV[1]);
const IDX_TOKENS = IDX_ARGV === null ? null : quoted(IDX_ARGV[1]);
const EXEC = EXT_FROM_SLICE === null ? null : new RegExp(EXT_FROM_SLICE[1].slice(1, -1));
const PATHSPECS = PATHSPEC_FROM_SLICE === null
  ? null : [PATHSPEC_FROM_SLICE[1], PATHSPEC_FROM_SLICE[2]];
const sliceOk = TREE_TOKENS !== null && IDX_TOKENS !== null && EXEC !== null && PATHSPECS !== null
  && TREE_TOKENS[0] === 'ls-tree' && IDX_TOKENS[0] === 'ls-files';

say('GATE', 'D1', 'both selector argv shapes SLICED out of ' + HIS_FILE + ':85-94 and the '
  + 'population filter out of round411:155-157, asserted by content, not retyped',
  () => `slice ok ${sliceOk} · tree argv ${JSON.stringify(TREE_TOKENS)} · index argv `
    + `${JSON.stringify(IDX_TOKENS)} · EXEC ${EXEC === null ? 'REFUSED' : EXEC.source} · pathspecs `
    + `${JSON.stringify(PATHSPECS)}`);

/** HIS tree key, taken as a parameter so it can be pointed at a counterfactual (414). */
const treeAt = (cwd, rev, pathspecs) => (!sliceOk ? null
  : git([...TREE_TOKENS, rev, '--', ...pathspecs], cwd).split('\n')
    .filter((f) => f !== '' && EXEC.test(f)).sort());
/** HIS index key, same. */
const fromIndex = (cwd, pathspecs) => (!sliceOk ? null
  : git([...IDX_TOKENS, ...pathspecs], cwd).split('\n')
    .filter((f) => f !== '' && EXEC.test(f)).sort());

// ─── D2: known positive — his M3 reading reproduces on the live tree ───────────────────────────
const liveIdx = sliceOk ? fromIndex(ROOT, PATHSPECS) : null;
const liveTree = sliceOk ? treeAt(ROOT, 'HEAD', PATHSPECS) : null;
const liveAgree = liveIdx !== null && liveTree !== null
  && liveIdx.length === liveTree.length && liveIdx.every((f, i) => f === liveTree[i]);
say('GATE', 'D2', 'known positive at its own narrowest key: his M3 reading reproduces on the live '
  + 'tree under the sliced keys — the two agree HERE, which is the state his reading was taken in',
  () => `ls-files ${liveIdx === null ? 'REFUSED' : liveIdx.length} · ls-tree(HEAD) `
    + `${liveTree === null ? 'REFUSED' : liveTree.length} · member-for-member ${liveAgree} · `
    + `worktree DIRTY ${DIRTY}`);

// ─── M1: his two keys in four index states, in a scratch repo (332) ────────────────────────────
const SANDBOX = `${ROOT}/.testdata/round416-dirty-index`;
const SPEC = ['pop'];
const mkRepo = (name) => {
  const d = `${SANDBOX}/${name}`;
  rmSync(d, { recursive: true, force: true });
  mkdirSync(`${d}/pop`, { recursive: true });
  git(['init', '-q', '--initial-branch=main'], SANDBOX === d ? d : d);
  git(['-c', 'user.name=t', '-c', 'user.email=t@t', 'config', 'user.name', 'round416'], d);
  git(['config', 'user.email', 'round416@local'], d);
  for (const f of ['a', 'b', 'c']) writeFileSync(`${d}/pop/${f}.mjs`, `// ${f}\n`);
  git(['add', '-A'], d);
  git(['commit', '-q', '-m', 'baseline'], d);
  return d;
};
rmSync(SANDBOX, { recursive: true, force: true });
mkdirSync(SANDBOX, { recursive: true });

const states = [];
const measure = (name, d, note) => {
  const rev = git(['rev-parse', 'HEAD'], d).trim();
  const idx = fromIndex(d, SPEC);
  const tree = treeAt(d, rev, SPEC);
  const idxOnly = idx === null || tree === null ? null : idx.filter((f) => !tree.includes(f));
  const treeOnly = idx === null || tree === null ? null : tree.filter((f) => !idx.includes(f));
  const phantom = idx === null ? null : idx.filter((f) => !existsSync(`${d}/${f}`));
  const agree = idxOnly !== null && idxOnly.length === 0 && treeOnly.length === 0;
  states.push({ name, note, rev, idx, tree, idxOnly, treeOnly, phantom, agree, dir: d });
  return states[states.length - 1];
};

// S1 CONTROL — clean index.
measure('S1_CLEAN', mkRepo('s1-clean'), 'nothing staged, nothing untracked');
// S2 — a STAGED ADDITION. The file is in the index and in no commit.
{
  const d = mkRepo('s2-staged-add');
  writeFileSync(`${d}/pop/d.mjs`, '// d\n');
  git(['add', 'pop/d.mjs'], d);
  measure('S2_STAGED_ADD', d, 'pop/d.mjs added to the index, never committed');
}
// S3 — a STAGED DELETION. The file is in HEAD's tree and in no index.
{
  const d = mkRepo('s3-staged-del');
  git(['rm', '-q', 'pop/a.mjs'], d);
  measure('S3_STAGED_DEL', d, 'pop/a.mjs removed from the index, still in HEAD');
}
// S4 — a WORKTREE deletion that was never staged. The index entry survives the file.
{
  const d = mkRepo('s4-worktree-del');
  rmSync(`${d}/pop/b.mjs`);
  measure('S4_WORKTREE_DEL_UNSTAGED', d, 'pop/b.mjs deleted on disk, index entry untouched');
}

const byName = (n) => states.find((s) => s.name === n);
say('MEAS', 'M1', 'his two keys — the index selector and the tree-at-the-stamped-rev selector — in '
  + 'four index states of a scratch repo, compared as MEMBER LISTS and not as counts (340)',
  () => states.map((s) => `    ${s.name.padEnd(24)} ls-files ${s.idx === null ? 'REF' : s.idx.length}`
    + ` · ls-tree(own rev) ${s.tree === null ? 'REF' : s.tree.length} · agree ${s.agree}`
    + ` · index-only ${JSON.stringify(s.idxOnly)} · tree-only ${JSON.stringify(s.treeOnly)}`
    + ` · listed-but-absent-on-disk ${JSON.stringify(s.phantom)}  (${s.note})`).join('\n'));

const s1 = byName('S1_CLEAN');
const s2 = byName('S2_STAGED_ADD');
const s3 = byName('S3_STAGED_DEL');
const s4 = byName('S4_WORKTREE_DEL_UNSTAGED');

say('PRED', 'P1', 'CONTROL: with a clean index his two keys agree member-for-member — so a '
  + 'DISAGREE in any other state is the index state and not my harness',
  () => `agree ${s1.agree} · ${s1.idx === null ? 'REFUSED' : s1.idx.length} both ways`,
  );
say('PRED', 'P2', 'STAGED ADDITION: the index selector returns a member the stamped rev cannot '
  + 'recover, so a rev-stamped `ls-files` figure is LARGER than its own rev — refuting "the index '
  + 'and the stamped rev\'s tree differ only by untracked files"',
  () => `index-only ${JSON.stringify(s2.idxOnly)} (want exactly ["pop/d.mjs"]) · `
    + `${s2.idx.length} vs ${s2.tree.length}`);
say('PRED', 'P3', 'STAGED DELETION: the stamped rev\'s tree carries a member the index does not, '
  + 'so the published figure is SMALLER than its own rev — indistinguishable from a deliberate seam',
  () => `tree-only ${JSON.stringify(s3.treeOnly)} (want exactly ["pop/a.mjs"]) · `
    + `${s3.idx.length} vs ${s3.tree.length}`);
say('PRED', 'P4', 'UNSTAGED WORKTREE DELETION: the two COUNTS agree while the index names a path '
  + 'that does not exist on disk — so count-agreement is not evidence the index was clean',
  () => `counts agree ${s4.idx.length === s4.tree.length} · listed-but-absent `
    + `${JSON.stringify(s4.phantom)} (want exactly ["pop/b.mjs"])`);

// ─── D3: is the index selector load-bearing, or is the disagreement my harness? ────────────────
// Cripple exactly one thing — swap the index key for the tree key — and S2 must flip to AGREE.
const crippledIdx = (cwd, pathspecs) => treeAt(cwd, 'HEAD', pathspecs);
const s2Crippled = (() => {
  const idx = crippledIdx(s2.dir, SPEC);
  const tree = treeAt(s2.dir, s2.rev, SPEC);
  return idx !== null && tree !== null && idx.length === tree.length
    && idx.every((f, i) => f === tree[i]);
})();
say('GATE', 'D3', 'the index selector pointed at a counterfactual that MOVES it: substituting '
  + '`ls-tree HEAD` for `ls-files` must flip S2 from DISAGREE to AGREE, which attributes the '
  + 'disagreement to the selector reading the INDEX rather than to this harness',
  () => `S2 real key agree ${s2.agree} (want false) · S2 crippled key agree ${s2Crippled} `
    + `(want true) · selector load-bearing ${s2.agree === false && s2Crippled === true}`);

// ─── M2: is the precondition his §2 rests on observable anywhere? ──────────────────────────────
// Population: every source file carrying an `'ls-files'` token — a SUPERSET of his 24 POPULATION
// files, because his key is token-keyed. 0 over the superset is 0 over his 24.
const TOKEN = /(['"`])ls-files\1/;
const WITNESS = /write-tree|diff\s+--cached|'--cached'|status['",\s]+.*--porcelain|'--porcelain'/;
const srcFiles = (treeAt(ROOT, 'HEAD', PATHSPECS) ?? []);
const tokenFiles = srcFiles.filter((f) => TOKEN.test(readFileSync(`${ROOT}/${f}`, 'utf8')));
const witnessFiles = tokenFiles.filter((f) => WITNESS.test(readFileSync(`${ROOT}/${f}`, 'utf8')));
say('MEAS', 'M2', 'over every source file carrying an `ls-files` token (a superset of his 24 '
  + 'POPULATION files), how many print an INDEX WITNESS — anything that would let a reader check '
  + 'the precondition his §2 rests on',
  () => `token-carrying files ${tokenFiles.length} · of which print an index witness `
    + `${witnessFiles.length} ${JSON.stringify(witnessFiles)}`);
say('PRED', 'P5', 'that number is 0 — the index state his narrowing depends on is recorded nowhere, '
  + 'so a reader holding a rev-stamped `ls-files` figure cannot tell S1 from S2',
  () => `index witnesses ${witnessFiles.length} (predicted 0: ${witnessFiles.length === 0})`);

// ─── ADDED AT DRIVE 2 — post-hoc, and said so. P5 was REFUTED at drive 1 (11 of 25) and stays
// refuted; drive 1's spelling is printed beside the new key rather than replaced (380/397/412).
// What drive 1's refutation showed me: `--porcelain` is a witness that cannot discriminate. A
// boolean `worktree DIRTY` is `true` in S1-with-untracked-files AND in S2, which are the two states
// his §2 needs separated. So the figure has to be re-keyed at the granularity the cure needs (345).
const WITNESS_DISC = /write-tree|--cached/;
// Two controls, driven as strings, so the new key reddens BY VALUE and not by identity (354/395).
const CONTROL_DISC = "const staged = git(['diff', '--cached', '--stat']).trim() === '';";
const CONTROL_NONDISC = "const DIRTY = git(['status', '--porcelain']).trim() !== '';";
const ctlDiscOk = WITNESS_DISC.test(CONTROL_DISC) && WITNESS.test(CONTROL_DISC);
const ctlNonDiscOk = !WITNESS_DISC.test(CONTROL_NONDISC) && WITNESS.test(CONTROL_NONDISC);
say('GATE', 'D4', 'ADDED AT DRIVE 2: the discriminating-witness key graded against two control '
  + 'texts driven as strings — a `diff --cached` control must read DISCRIMINATING and a '
  + '`status --porcelain` control must read WITNESS-BUT-NOT-DISCRIMINATING, so the new key is '
  + 'graded by value rather than by its own agreement with drive 1',
  () => `CONTROL_DISC discriminating ${WITNESS_DISC.test(CONTROL_DISC)} (want true) and a witness `
    + `${WITNESS.test(CONTROL_DISC)} (want true) · CONTROL_NONDISC discriminating `
    + `${WITNESS_DISC.test(CONTROL_NONDISC)} (want false) but still a witness `
    + `${WITNESS.test(CONTROL_NONDISC)} (want true) · both ${ctlDiscOk && ctlNonDiscOk}`);

const discFiles = witnessFiles.filter((f) => WITNESS_DISC.test(readFileSync(`${ROOT}/${f}`, 'utf8')));
say('MEAS', 'M4', 'ADDED AT DRIVE 2: of the witness-printing files, how many carry a witness that '
  + 'can SEPARATE a staged index from a merely-untracked worktree — named, not left as a delta',
  () => `witness-printing ${witnessFiles.length} (drive 1\'s spelling, kept) · of which `
    + `discriminating ${discFiles.length} ${JSON.stringify(discFiles)} · non-discriminating `
    + `${witnessFiles.length - discFiles.length} — those print a collapsed boolean that is true in `
    + 'S1-with-untracked AND in S2');
say('PRED', 'P7', 'ADDED AT DRIVE 2, post-hoc: at most 2 of the token-carrying files carry a '
  + 'DISCRIMINATING witness, so drive 1\'s 11 is a witness count and not a recoverability count',
  () => `discriminating ${discFiles.length} (post-hoc bound <= 2: ${discFiles.length <= 2})`);

// The seam this file will put in its own figures when it is committed, DECLARED rather than
// discovered by the next round (380/397/412, and his own §0 mechanism one level up).
const selfTracked = (treeAt(ROOT, 'HEAD', PATHSPECS) ?? [])
  .includes('docs/research/round416-instruments/grade-the-rev-stamp-against-a-dirty-index.mjs');
say('MEAS', 'M6', 'ADDED AT DRIVE 2: the seam THIS file puts in its own figures, declared before it '
  + 'is committed — it carries an `ls-files` token, a `--cached` witness and a `write-tree` mention, '
  + 'so once tracked it joins every population measured above',
  () => `this file in the ls-tree corpus now: ${selfTracked} · so when committed, token-carrying `
    + `files ${tokenFiles.length} -> ${tokenFiles.length + (selfTracked ? 0 : 1)}, witnesses `
    + `${witnessFiles.length} -> ${witnessFiles.length + (selfTracked ? 0 : 1)}, discriminating `
    + `${discFiles.length} -> ${discFiles.length + (selfTracked ? 0 : 1)}`);

// ─── M3: how big is his class, live? His own stamp regex, over every recorded output ───────────
const STAMP_RE_SRC = /const OUT_RE = \/\^\\s\*rev \(\[0-9a-f\]\{40\}\)/.test(hisLines.slice(98, 100).join('\n'))
  ? /^\s*rev [0-9a-f]{40}/m : null;
const outs = (treeAt(ROOT, 'HEAD', ['docs/research']) ?? []).length === 0
  ? git(['ls-tree', '-r', '--name-only', 'HEAD', '--', 'docs/research']).split('\n')
    .filter((f) => /round4\d\d-instruments\/.*\.out$/.test(f)).sort()
  : git(['ls-tree', '-r', '--name-only', 'HEAD', '--', 'docs/research']).split('\n')
    .filter((f) => /round4\d\d-instruments\/.*\.out$/.test(f)).sort();
const unstamped = STAMP_RE_SRC === null ? null
  : outs.filter((f) => !STAMP_RE_SRC.test(readFileSync(`${ROOT}/${f}`, 'utf8')));
say('MEAS', 'M3', 'his own stamp key — sliced by content from his OUT_RE, refusing if that line '
  + 'moved — applied to EVERY recorded `.out` in the round4xx instrument directories, not only the '
  + 'ones carrying a corpus header',
  () => `recorded outputs ${outs.length} · carry a run-time rev stamp `
    + `${unstamped === null ? 'REFUSED' : outs.length - unstamped.length} · carry none `
    + `${unstamped === null ? 'REFUSED' : unstamped.length}\n`
    + `    unstamped: ${unstamped === null ? 'REFUSED' : JSON.stringify(unstamped.slice(0, 12))}`
    + `${unstamped !== null && unstamped.length > 12 ? ` … and ${unstamped.length - 12} more` : ''}`);
say('PRED', 'P6', 'his class has live members besides my `62/10` — at least one recorded output '
  + 'publishes with no run-time rev stamp',
  () => `unstamped ${unstamped === null ? 'REFUSED' : unstamped.length} (predicted >= 1: `
    + `${unstamped !== null && unstamped.length >= 1})`);

// ADDED AT DRIVE 2. The surface a later round actually reads is the recorded OUTPUT, not the
// source, so the witness question has to be asked there too — and asked WIDER than the source key,
// since prose would do: anything naming `--cached`, `write-tree` or the word "staged" counts.
const OUT_WITNESS_DISC = /write-tree|--cached|staged/i;
const stamped = unstamped === null ? null : outs.filter((f) => !unstamped.includes(f));
const stampedWithDisc = stamped === null ? null
  : stamped.filter((f) => OUT_WITNESS_DISC.test(readFileSync(`${ROOT}/${f}`, 'utf8')));
say('MEAS', 'M5', 'ADDED AT DRIVE 2: the readable surface — of the recorded outputs that DO carry a '
  + 'run-time rev stamp, how many print anything a reader could use to tell a staged index from an '
  + 'untracked worktree. Keyed WIDER than the source key, so prose counts',
  () => `rev-stamped outputs ${stamped === null ? 'REFUSED' : stamped.length} · of which print a `
    + `discriminating index witness ${stampedWithDisc === null ? 'REFUSED' : stampedWithDisc.length}`
    + ` ${JSON.stringify(stampedWithDisc)}`);
say('PRED', 'P8', 'ADDED AT DRIVE 2, post-hoc: that number is 0 — so for every rev-stamped figure '
  + 'in the tree, his §2\'s precondition is unobservable to the reader who holds the output, which '
  + 'is the reader the stamp exists for',
  () => `stamped outputs with a discriminating witness `
    + `${stampedWithDisc === null ? 'REFUSED' : stampedWithDisc.length} (post-hoc 0: `
    + `${stampedWithDisc !== null && stampedWithDisc.length === 0})`);

// ADDED AT DRIVE 3, measured and NOT predicted — said so rather than back-dating a prediction.
// `94 unstamped outputs` is an upper bound on his class and I will not publish it as the hazard
// count: most of the 129 are `sweep.out` / `typecheck-*.out` wrapper captures that publish no
// population figure at all, and an output with no figure cannot carry a mis-attributed one. So key
// the 94 again on whether the output publishes a POPULATION-SHAPED figure.
const NOUN = '(?:file|site|token|instance|declaration|probe|row|match|pair)';
// Drive 3's spelling, KEPT so the repair is graded and not asserted (380/397/412). It failed its
// own control two ways: the noun had to sit ADJACENT to the number, and my real `62/10` line reads
// `62 KP-shaped declaration(s)` with a modifier between them (394/395 in a new dress); and the
// trailing `\b` cannot match between `)` and `;`, so even an adjacent `declaration(s);` missed.
const FIGURE_RE_D3 = new RegExp(`\\b\\d+ ${NOUN}(?:\\(s\\)|s|es)?\\b`);
// Repaired at drive 4: up to two intervening modifier words, and no trailing `\b` after `(s)`.
const FIGURE_RE = new RegExp(`\\b\\d+(?:\\s+[\\w-]+){0,2}\\s+${NOUN}(?:\\(s\\)|s|es)?(?![\\w])`);
const CTL_FIGURE = '  scanned 62 KP-shaped declaration(s); 10 have a "?" in the window';
const CTL_NOFIGURE = '  exit 0 · 0 error TS · 356 captured bytes';
// A third control, added with the repair, because widening a key is how a scanner starts
// over-reporting (415): a timing line full of digits and no population noun must NOT match.
const CTL_OVERREACH = '  rev 8690abe7 · 00:26:37.870Z -> 00:30:35.713Z = 3 min 58 s · 0 red, 0 blocked';
const figCtlOk = FIGURE_RE.test(CTL_FIGURE) && !FIGURE_RE.test(CTL_NOFIGURE)
  && !FIGURE_RE.test(CTL_OVERREACH);
const withFig = (re) => (unstamped === null ? null
  : unstamped.filter((f) => re.test(readFileSync(`${ROOT}/${f}`, 'utf8'))));
const unstampedWithFigure = withFig(FIGURE_RE);
const unstampedWithFigureD3 = withFig(FIGURE_RE_D3);
say('GATE', 'D5', 'ADDED AT DRIVE 3, REPAIRED AT DRIVE 4: the population-figure key graded against '
  + 'three control strings — my own `62/10` line must read AS A FIGURE, a typecheck capture must '
  + 'read AS NONE, and a timing line thick with digits must read AS NONE so the widening that fixed '
  + 'the first control did not buy an over-report',
  () => `CTL_FIGURE ${FIGURE_RE.test(CTL_FIGURE)} (want true) · CTL_NOFIGURE `
    + `${FIGURE_RE.test(CTL_NOFIGURE)} (want false) · CTL_OVERREACH `
    + `${FIGURE_RE.test(CTL_OVERREACH)} (want false) · all three ${figCtlOk}\n`
    + `        drive 3's spelling on the same three: ${FIGURE_RE_D3.test(CTL_FIGURE)} / `
    + `${FIGURE_RE_D3.test(CTL_NOFIGURE)} / ${FIGURE_RE_D3.test(CTL_OVERREACH)} — it missed the `
    + 'known positive, which is why its live figure was a floor');
say('MEAS', 'M7', 'ADDED AT DRIVE 3: the 94 unstamped outputs re-keyed on whether they publish a '
  + 'population-shaped figure at all — the honest size of his class, since a wrapper capture with '
  + 'no figure cannot carry a mis-attributed one. Both spellings printed',
  () => `unstamped ${unstamped === null ? 'REFUSED' : unstamped.length} · publish a figure under `
    + `the REPAIRED key ${unstampedWithFigure === null ? 'REFUSED' : unstampedWithFigure.length}`
    + ` · under drive 3's broken key `
    + `${unstampedWithFigureD3 === null ? 'REFUSED' : unstampedWithFigureD3.length}`
    + ` (under-reported by `
    + `${unstampedWithFigure === null ? 'REFUSED' : unstampedWithFigure.length - unstampedWithFigureD3.length}`
    + `) · so the class is ${unstampedWithFigure === null ? 'REFUSED' : unstampedWithFigure.length}`
    + ` of ${outs.length} recorded outputs, not ${unstamped === null ? 'REFUSED' : unstamped.length}`);

// ─── report ────────────────────────────────────────────────────────────────────────────────────
const verdicts = {
  D1: sliceOk,
  D2: liveAgree,
  D3: s2.agree === false && s2Crippled === true,
  P1: s1.agree === true,
  P2: JSON.stringify(s2.idxOnly) === JSON.stringify(['pop/d.mjs']),
  P3: JSON.stringify(s3.treeOnly) === JSON.stringify(['pop/a.mjs']),
  P4: s4.idx !== null && s4.idx.length === s4.tree.length
    && JSON.stringify(s4.phantom) === JSON.stringify(['pop/b.mjs']),
  P5: witnessFiles.length === 0,
  P6: unstamped !== null && unstamped.length >= 1,
  D4: ctlDiscOk && ctlNonDiscOk,
  P7: discFiles.length <= 2,
  P8: stampedWithDisc !== null && stampedWithDisc.length === 0,
  D5: figCtlOk,
};

console.log(`Round 416 — grading his 415 §2 against an index that is not clean, at ${REV}`);
console.log(`  START ${new Date().toISOString()}\n`);
for (const r of rows) {
  const v = verdicts[r.id];
  const tag = v === undefined ? '     ' : (v === true ? 'TRUE ' : 'FALSE');
  const head = r.kind === 'GATE' ? `[GATE] ${r.claim}`
    : r.kind === 'PRED' ? `[PRED] ${r.claim}` : `[MEAS] ${r.claim}`;
  console.log(`  ${tag} ${r.id}  ${head}`);
  console.log(`        ${typeof r.detail === 'function' ? r.detail() : r.detail}`);
}
const gateLegs = ['D1', 'D2', 'D3', 'D4', 'D5'];
const gate = gateLegs.every((l) => verdicts[l] === true);
const preds = ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'P8'];
const landed = preds.filter((p) => verdicts[p] === true);
const refuted = preds.filter((p) => verdicts[p] !== true);
console.log(`\nGATE: ${gate} (${gateLegs.length} leg(s): ${gateLegs.join(' ')})`);
console.log(`PREDICTIONS: ${landed.length} landed (${landed.join(' ') || '-'}), `
  + `${refuted.length} refuted (${refuted.join(' ') || '-'})`);
console.log('  !! A REFUTED PREDICTION IS THE ROUND\'S CONTENT, NOT ITS FAILURE (383).');
console.log(`\n  rev ${REV} · ${liveTree === null ? 'REFUSED' : liveTree.length} file(s) in the `
  + `ls-tree corpus · ${liveIdx === null ? 'REFUSED' : liveIdx.length} in the ls-files corpus · `
  + `worktree ${DIRTY ? 'DIRTY' : 'clean'}`);
console.log(`  END ${new Date().toISOString()}`);
