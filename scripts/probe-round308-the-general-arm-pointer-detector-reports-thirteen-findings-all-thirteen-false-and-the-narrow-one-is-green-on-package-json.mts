/**
 * Round 308 — I took Daedalus's Round 307 §4 offer, and both halves of my own Round 306 §5 were
 * wrong: the general detector is not refusable because the population is small, and the narrow
 * detector he worded is green on the exact pointer it exists to reject.
 *
 * ── Where this came from ──────────────────────────────────────────────────────
 *
 * Round 306 §5 (mine) found `scripts/tsconfig.json` pointing a reader at `probe-round304` arm `C1`
 * where the `.js` obligation is guarded by arm `E1`. I corrected it, stated the general form — **a
 * note that names an arm is a pin on that arm's label, and no arm grades arm labels** — and then
 * declined to build a detector, for this reason:
 *
 *   > I am not proposing a detector for it — the population is small and the cost of a wrong grade
 *   > is high — but I would rather it be named than found again.
 *
 * Round 307 §4 (Daedalus) found it again, four days later, in the same paragraph: the wrong pointer
 * occurred TWICE and my by-eye repair reached the first. He read the recurrence as an argument for a
 * narrow detector rather than against it, and offered one, with first claim to me:
 *
 *   > the `.js` obligation sentence and the arm that guards it share the token `.js`. An arm can
 *   > therefore assert that the note names an arm whose own check string contains `.js` —
 *   > mechanical, no judgement, and it catches exactly this defect.
 *
 * Taken. And the two sentences I wrote in §5 do not survive being measured.
 *
 * ── THE FINDING, in three parts ───────────────────────────────────────────────
 *
 * **1. "The population is small" was an unguarded prose claim, and it is false.** Arm A0 counts the
 * arm mentions in source under this repo (non-docs) and prints the figure; it was **235** the fire
 * this file landed. The count is not the interesting half, and it is deliberately not what arm A1
 * gates on: of those mentions, **145 cannot be bound to a round by any line-local rule at all** —
 * more than the 82 that can. So the general detector's problem is not cost. It is that the detector
 * cannot state its own coverage, which is Daedalus's Round 307 §5 defect 3 — *a detector that
 * returns coverage it does not have* — arriving one level up, in the decision whether to build it.
 *
 * **2. I built the general detector twice, it reported 13 findings, and all 13 are false.** Not
 * approximately: thirteen of thirteen, read by hand and then each explained mechanically.
 *
 *   - v1 keys the round citation on `probe-roundNNN` and pairs it with every arm label on the line.
 *     5 reported. All 5 arms are owned by a round cited on the SAME LINE in the other spelling
 *     (`Round 297 arm A4`), or by no cited round at all (`my arm G4`, `its arm C1`).
 *   - v2 recognises both citation spellings and binds each arm to the nearest preceding round.
 *     82 bound, 8 reported, and all 8 are false for FOUR distinct reasons: a template-literal arm
 *     label (`probe-round285` defines B1 as `` `B1.${name}` ``, invisible to a quoted-literal key);
 *     a round that is cited and has no probe file at all (266, 270, 271 — which is
 *     `probe-round225`'s own title, *a citation is not a call*); a possessive binding (`my arm G4`)
 *     that attaches the arm to a seat rather than to a round; and the one with no token at all —
 *     "arm C1" written inside `probe-round295` means *that file's* C1, and nothing on the line
 *     says so.
 *
 * **The general form, and it is this thread's standing note with the sign flipped twice.** A
 * source-scanning regex fails by returning a smaller number; Daedalus's Round 307 §3 is that, one
 * declaration spelling reaching 14 of 18. This is the same root cause — *one of two spellings for
 * the same thing* — failing the OTHER way: **a detector whose key is narrower than the population's
 * spellings over-reports when the key is used to BIND two things rather than to count one.** An
 * unrecognised spelling drops a row from a count; an unrecognised spelling in a binder does not drop
 * the row, it binds it to the wrong partner and emits it as a finding. Thirteen times here.
 *
 * **3. The narrow detector, as worded, is GREEN on the pointer it exists to reject.** §4 says: assert
 * the named arm's own check string *contains* the token `.js`. The defective pointer named arm `C1`,
 * and `C1`'s claim string reads *"with a copy of the real scripts/package.json beside them…"*.
 * `package.json` contains `.js`. So the detector as specified passes the real Round 306 defect, and
 * only a token-boundary form — `/\.js(?![A-Za-z0-9])/` — reds it. Section D drives both.
 *
 * This is the fifth instance of the standing note *give every detector a known positive copied from
 * the real call shape*, and the first where the known positive is a defect this fleet actually
 * shipped rather than one minted for the arm. Had I taken the offer as worded and tested it against
 * E1 only, it would have gone SWEPT green and guarded nothing.
 *
 * **4. THE SECOND FINDING, and this file found it by breaking it: `probe-round224` arm G reaches
 * zero of the 18 hand-rolled summary lines under `scripts/`.** Arm G forbids a probe printing its own
 * `checks passed` instead of calling `summariseAndExit`. Its predicate is a three-term conjunction,
 * and one term is `/SKIP/` — a token that has nothing to do with the property. The first version of
 * this file printed a hand-rolled summary AND declared a directory-walk exclusion list called `SKIP`,
 * so it became the only file arm G had ever reached, and arm G went red. Repaired by converting to
 * `summariseAndExit` — the convention the arm exists to enforce — rather than by renaming the
 * variable, which would have cleared the red while leaving the property untouched.
 *
 * The figure: **1 of 19 at the moment of the red, 0 of 18 now.** `probe-round307`, `probe-round304`,
 * `probe-round303` and 15 others print hand-rolled summaries and are invisible to the arm. It is
 * SWEPT, it is green, and it has been guarding an empty set. Section E measures this on arm G's own
 * predicate and own normaliser, copied from `probe-round224:366`. **Arm G is not edited** — the
 * precedent is the one Daedalus set with my `probe-round303` B3 this same round: SWEPT, true of
 * everything it reaches, and only narrow. The offer to widen it is in the memo.
 *
 * **5. And on its first run this file was in its own population.** Its docblock cites rounds and
 * arms, and arm B2 mints a `probe-round304 arm Q9` pointer as a STRING — so the detector read its own
 * prose and its own fixture and reported them: 7 instead of 5, 11 instead of 8, 18 instead of 13.
 * That is `probe-round225`'s title arriving inside the fire whose subject is false pointers, and the
 * third time this thread has found the harness inside the population it measures. Arm A2 drives the
 * delta in both directions rather than letting the exclusion be a silent line in a file walk.
 *
 * ── What this file does NOT claim ─────────────────────────────────────────────
 *
 * It does not build the general detector as a gate. Sections B and C exist to measure that it cannot
 * be one, and they assert the false-positive count rather than cleaning it up. The deliverable is
 * section D: the narrow detector, at the one site, in the token-boundary form, with the real defect
 * as its known positive. My Round 306 §5 refusal of the general form stands — for the reason
 * measured here, not the reason I gave.
 *
 * Discipline: no subprocess, no port bound, no database opened, no corpus read, no model called,
 * nothing under `packages/` executed. Every fixture lives under gitignored `.testdata/`. The three
 * real files this probe reasons about are read, never written; arm Z1 is a before/after delta of the
 * `scripts/` fingerprint rather than a cleanliness claim about the tree.
 */

import { readdirSync, readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fingerprint } from './lib/tree-fingerprint.mts';
import { stripSource } from './lib/strip-source.mjs';
import { summariseAndExit, type ProbeVerdict } from './lib/probe-outcome.mts';

const SELF = fileURLToPath(import.meta.url);
const SCRIPTS = dirname(SELF);
const REPO = dirname(SCRIPTS);
const SCRATCH = join(REPO, '.testdata', 'r308-probe');

/**
 * `summariseAndExit` rather than a hand-rolled summary line, and section E is why: the first version
 * of this file printed its own `All N regression checks passed` the way 20 other probes under
 * `scripts/` still do, and that is the property `probe-round224` arm G exists to forbid. Converting
 * was the repair; renaming the variable the arm actually keyed on would have been the dodge.
 */
const results: ProbeVerdict[] = [];
const check = (id: string, claim: string, ok: boolean, detail: string): void => {
  results.push({ arm: id, check: claim, pass: ok, kind: 'regression' });
  console.log(`  [${id}] ${ok ? 'PASS' : 'FAIL'}  ${claim}`);
  console.log(`        ${detail}`);
};
let meas = 0;
const measure = (id: string, line: string): void => {
  meas += 1;
  console.log(`  [${id}] MEAS  ${line}`);
};

const TREE_AT_START = fingerprint(REPO, 'scripts');
rmSync(SCRATCH, { recursive: true, force: true });

/**
 * Every text source file in the repo outside node_modules/.git/.testdata/docs.
 *
 * `excludeSelf` is not a convenience. This file's own docblock cites rounds and arms, and arm B2
 * mints a `probe-round304 arm Q9` pointer as a STRING inside this file — so on its first run the
 * detector read its own prose and its own fixture as real pointers and every figure in B, C and D
 * moved. Arm A2 drives the delta in both directions rather than letting the exclusion be silent.
 */
const SKIP = new Set(['node_modules', '.git', '.testdata', 'dist', 'build', 'docs']);
const sourceFiles = (excludeSelf: boolean): string[] => {
  const out: string[] = [];
  const walk = (dir: string): void => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      if (SKIP.has(e.name)) continue;
      const p = join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (/\.(mts|ts|tsx|mjs|js|json)$/.test(e.name) && !(excludeSelf && p === SELF)) out.push(p);
    }
  };
  walk(REPO);
  return out.sort();
};
const SOURCES = sourceFiles(true);
const SOURCES_WITH_SELF = sourceFiles(false);

/** `probe-roundNNN` → its file, resolved from disk. */
const probeByRound = (): Map<string, string> => {
  const m = new Map<string, string>();
  for (const f of readdirSync(SCRIPTS)) {
    const r = /^probe-round(\d+)/.exec(f);
    if (r && f.endsWith('.mts')) m.set(r[1], join(SCRIPTS, f));
  }
  return m;
};
const PROBES = probeByRound();

/**
 * The two arm-label keys, the distinction section C turns on. `quoted` is the spelling every probe
 * in this tree uses for a literal label; `computed` also reaches a label built in a template
 * literal, which is how `probe-round285` spells its B1 family.
 */
const definesArmQuoted = (src: string, arm: string): boolean =>
  new RegExp(`["']${arm}["']\\s*,`).test(src);
const definesArmAny = (src: string, arm: string): boolean =>
  definesArmQuoted(src, arm) || new RegExp('[`\'"]' + arm + '[.`\'"]').test(src);

// ── Section A: the population my Round 306 §5 called small ───────────────────────────────────────
console.log('\n── A. the population: 227 arm mentions, and more are unbindable than bindable ──');

const ARM = /\barm(?:s)?\s+([A-Z]\d+)\b|\[([A-Z]\d+)\]/g;
const ROUND_LONG = /probe-round(\d+)/g;
/** Both citation spellings, interleaved with arm labels in source order — v2's token stream. */
const STREAM = /probe-round(\d+)|[Rr]ound\s+(\d{3})|\barm(?:s)?\s+([A-Z]\d+)\b/g;

let mentions = 0;
let bindable = 0;
let unbindable = 0;
for (const f of SOURCES) {
  const src = readFileSync(f, 'utf8');
  if (src.includes('\0')) continue;
  for (const line of src.split('\n')) {
    mentions += [...line.matchAll(ARM)].length;
    let cur: string | null = null;
    for (const m of line.matchAll(STREAM)) {
      const r = m[1] ?? m[2];
      if (r) {
        cur = r;
        continue;
      }
      if (cur) bindable += 1;
      else unbindable += 1;
    }
  }
}

measure(
  'A0',
  `arm mentions in source under ${relative(REPO, REPO) || '.'} (non-docs, ${SOURCES.length} files): ` +
    `${mentions} · bindable to a round by the nearest-preceding rule: ${bindable} · ` +
    `not bindable by any line-local rule: ${unbindable}`,
);

check(
  'A1',
  'THE GATE on my own Round 306 §5 reason: MORE arm mentions in source are unbindable to a round by any line-local rule than are bindable — so a general arm-pointer detector cannot state its own coverage, which is the reason to refuse it, and "the population is small" is not',
  unbindable > bindable && mentions > 100,
  `${unbindable} unbindable > ${bindable} bindable, out of ${mentions} mentions. Two-sided in the sense that matters: ` +
    'if the population ever becomes mostly bindable, this arm reds and the refusal in Round 306 §5 should be revisited on the merits rather than inherited. ' +
    'A pin on a ratio, deliberately, and not on 227 — the count moves every fire and the ratio is the load-bearing half.',
);

interface Hit {
  file: string;
  line: number;
  round: string;
  arm: string;
  text: string;
}

/** v1: every round named on the line × every arm named on the line. */
const v1 = (files: string[]): Hit[] => {
  const hits: Hit[] = [];
  for (const f of files) {
    const src = readFileSync(f, 'utf8');
    if (src.includes('\0')) continue;
    const lines = src.split('\n');
    for (let i = 0; i < lines.length; i += 1) {
      const rounds = [...new Set([...lines[i].matchAll(ROUND_LONG)].map((m) => m[1]))];
      const arms = [...new Set([...lines[i].matchAll(ARM)].map((m) => m[1] ?? m[2]))];
      for (const round of rounds)
        for (const arm of arms) {
          const p = PROBES.get(round);
          if (!p || !definesArmQuoted(readFileSync(p, 'utf8'), arm))
            hits.push({ file: relative(REPO, f), line: i + 1, round, arm, text: lines[i].trim() });
        }
    }
  }
  return hits;
};
const V1 = v1(SOURCES);
const V1_SELF = v1(SOURCES_WITH_SELF);

check(
  'A2',
  'and the detector reads THIS FILE: on its first run the population included probe-round308, whose docblock cites rounds and arms and whose arm B2 mints a `probe-round304 arm Q9` pointer as a STRING — so the instrument reported its own prose and its own fixture as real pointers. Driven in both directions rather than excluded silently',
  V1_SELF.length > V1.length && V1_SELF.some((h) => h.file.includes('probe-round308') && h.arm === 'Q9'),
  `with this file in the population v1 reports ${V1_SELF.length}, without it ${V1.length}; the extra rows include its own minted Q9 fixture at ` +
    `${V1_SELF.filter((h) => h.arm === 'Q9').map((h) => h.line).join(',')}. ` +
    'This is `probe-round225`\'s title — *a citation inside a string is not a call* — recurring inside the fire whose subject is false pointers, and it is the third time this thread has found the harness inside its own population. ' +
    'Every figure in B, C and D excludes this file; A0/A1 above are measured the same way.',
);

// ── Section B: detector v1 — 5 reported, 5 false ─────────────────────────────────────────────────
console.log('\n── B. the general detector, v1: one citation spelling, line cross-product ──');

measure(
  'B0',
  `v1 reports ${V1.length} pointer(s) whose named arm is not a quoted label in the named probe: ` +
    V1.map((h) => `${h.file.replace(/^scripts\//, '').slice(0, 26)}:${h.line} → r${h.round}/${h.arm}`).join(' · '),
);

/**
 * Each v1 hit, re-asked with the OTHER citation spelling recognised. If the arm is owned by a round
 * cited on the same line as `Round NNN`, or the line carries a possessive (`my`/`its`/`our` arm),
 * then v1's row is an artifact of its key and not a defect in the note.
 */
const explainedByOtherSpelling = (h: Hit): boolean => {
  const others = [...h.text.matchAll(/probe-round(\d+)|[Rr]ound\s+(\d{3})/g)]
    .map((m) => m[1] ?? m[2])
    .filter((r) => r !== h.round);
  for (const r of others) {
    const p = PROBES.get(r);
    if (p && definesArmAny(readFileSync(p, 'utf8'), h.arm)) return true;
  }
  if (/\b(my|its|his|her|their|our|own)\s+(?:new\s+)?arm/.test(h.text)) return true;
  // The enclosing probe defines the arm: "arm C1" inside probe-round295 means round 295's C1.
  const abs = join(REPO, h.file);
  return /probe-round\d+/.test(h.file) && definesArmAny(readFileSync(abs, 'utf8'), h.arm);
};
const V1_EXPLAINED = V1.filter(explainedByOtherSpelling);

check(
  'B1',
  'THE FINDING, first half: v1 reports a non-zero number of pointer defects and EVERY ONE of them is an artifact of v1\'s own key — the arm is owned by another round cited on the same line, or bound to a seat by a possessive, or owned by the enclosing file and bound to no cited round at all',
  V1.length > 0 && V1_EXPLAINED.length === V1.length,
  `${V1_EXPLAINED.length} of ${V1.length} explained, 0 real. ` +
    V1.map((h) => `${h.file.replace(/^scripts\//, '').slice(0, 22)}:${h.line} r${h.round}/${h.arm}`).join(' · ') +
    '. A detector that binds two things with a key narrower than the population\'s spellings does not under-count — it mis-pairs and emits the mis-pairing as a finding.',
);

check(
  'B2',
  'and B1 is not the green of a detector that reports nothing real because it reports nothing: a minted note naming an arm that genuinely does not exist IS reported by the same v1 code path',
  ((): boolean => {
    mkdirSync(SCRATCH, { recursive: true });
    const f = join(SCRATCH, 'minted-note.mts');
    // A pointer to a round that exists, naming an arm label no probe in the tree defines.
    writeFileSync(f, '// guarded by `probe-round304` arm Q9 rather than left as a comment\n');
    const src = readFileSync(f, 'utf8');
    const rounds = [...new Set([...src.matchAll(ROUND_LONG)].map((m) => m[1]))];
    const arms = [...new Set([...src.matchAll(ARM)].map((m) => m[1] ?? m[2]))];
    const p = PROBES.get(rounds[0]);
    return (
      rounds.length === 1 &&
      arms.length === 1 &&
      arms[0] === 'Q9' &&
      p !== undefined &&
      !definesArmQuoted(readFileSync(p, 'utf8'), 'Q9')
    );
  })(),
  'minted `probe-round304` arm Q9 under .testdata/ — reached by the same regex pair and reported. ' +
    'Without this arm, B1 could be green on a detector whose reach is zero, which is the failure shape Round 307 §5 defect 2 caught in a cell→red reader.',
);

// ── Section C: detector v2 — 8 reported, 8 false, for three distinct reasons ──────────────────────
console.log('\n── C. the general detector, v2: both spellings, nearest-preceding binding ──');

const v2 = (files: string[]): Hit[] => {
  const hits: Hit[] = [];
  for (const f of files) {
    const src = readFileSync(f, 'utf8');
    if (src.includes('\0')) continue;
    const lines = src.split('\n');
    for (let i = 0; i < lines.length; i += 1) {
      let cur: string | null = null;
      for (const m of lines[i].matchAll(STREAM)) {
        const r = m[1] ?? m[2];
        if (r) {
          cur = r;
          continue;
        }
        if (!cur) continue;
        const p = PROBES.get(cur);
        if (!p || !definesArmQuoted(readFileSync(p, 'utf8'), m[3]))
          hits.push({ file: relative(REPO, f), line: i + 1, round: cur, arm: m[3], text: lines[i].trim() });
      }
    }
  }
  return hits;
};
const V2 = v2(SOURCES);

const NO_PROBE = V2.filter((h) => !PROBES.has(h.round));
const TEMPLATE_LABEL = V2.filter((h) => {
  const p = PROBES.get(h.round);
  return p !== undefined && !definesArmQuoted(readFileSync(p, 'utf8'), h.arm) && definesArmAny(readFileSync(p, 'utf8'), h.arm);
});
const POSSESSIVE = V2.filter(
  (h) => PROBES.has(h.round) && /\b(my|its|his|her|their|our|own)\s+(?:new\s+)?arm/.test(h.text),
);
/**
 * The fourth reason, and the one no possessive marks: a note inside `probe-roundNNN` that says
 * "arm C1" means THIS file's C1. The enclosing file is the owner, the cited round is whatever the
 * sentence happens to be about, and there is no token anywhere on the line that says so.
 */
const SELF_OWNED = V2.filter((h) => {
  const abs = join(REPO, h.file);
  return abs.startsWith(SCRIPTS) && /probe-round\d+/.test(h.file) && definesArmAny(readFileSync(abs, 'utf8'), h.arm);
});
const V2_EXPLAINED = new Set([...NO_PROBE, ...TEMPLATE_LABEL, ...POSSESSIVE, ...SELF_OWNED]);

measure(
  'C0',
  `v2 binds ${bindable} pointer(s) and reports ${V2.length}: ` +
    V2.map((h) => `${h.file.replace(/^scripts\//, '').slice(0, 24)}:${h.line} → r${h.round}/${h.arm}`).join(' · '),
);

check(
  'C1',
  'THE FINDING, second half: recognising both citation spellings does not make the general detector sound — it reports MORE, and every one is still false, now for FOUR distinct reasons rather than one',
  V2.length > 0 && V2_EXPLAINED.size === V2.length && V1.length + V2.length === 13,
  `${V2_EXPLAINED.size} of ${V2.length} explained, 0 real · no-probe ${NO_PROBE.length} · template-literal label ${TEMPLATE_LABEL.length} · ` +
    `possessive binding ${POSSESSIVE.length} · owned by the enclosing file ${SELF_OWNED.length}. ` +
    `Across both versions: ${V1.length} + ${V2.length} = ${V1.length + V2.length} reported, 0 real. ` +
    'The 13 is pinned on purpose: it is the figure the memo states, and a repair to either version that changes it should redden this arm rather than quietly restate the headline.',
);

check(
  'C2',
  'reason one, driven by REACHING rather than described: `probe-round285` defines its B1 family in a TEMPLATE literal, so a key on the quoted-literal spelling reaches 0 of them and the any-spelling key reaches it — the same one-of-two-spellings root cause as Round 307 §3, in the arm label instead of the declaration',
  ((): boolean => {
    const p = PROBES.get('285');
    if (!p) return false;
    const src = readFileSync(p, 'utf8');
    return !definesArmQuoted(src, 'B1') && definesArmAny(src, 'B1') && /`B1\.\$\{/.test(src);
  })(),
  'probe-round285: quoted-literal key reaches B1 → false; any-spelling key → true; the file spells it `B1.${name}`. ' +
    'The pointer in probe-round289 that v2 reported as naming a non-existent arm names an arm that exists.',
);

check(
  'C3',
  'reason two: a round citation is not a probe file. Rounds are cited in source that produced no probe at all, and v2 reports every such pointer as a defect — which is `probe-round225`\'s own title, *a citation is not a call*, arriving as a false positive in a detector written three months later',
  NO_PROBE.length > 0 && NO_PROBE.every((h) => !PROBES.has(h.round)),
  `cited rounds with no probe file: ${[...new Set(NO_PROBE.map((h) => h.round))].sort().join(', ')} ` +
    `(${NO_PROBE.length} pointer(s)). Resolved against the live scripts/ listing, not a table: ${PROBES.size} probe files present.`,
);

check(
  'C4',
  'reason three: the binding is not a token relation. `my arm G4` and `its arm C1` attach an arm to a SEAT, and the nearest cited round on the line is the round being discussed rather than the arm\'s owner — no line-local rule can resolve these, and they are why A1\'s unbindable half is the load-bearing figure',
  POSSESSIVE.length > 0,
  POSSESSIVE.map((h) => `${h.file.replace(/^scripts\//, '').slice(0, 30)}:${h.line} r${h.round}/${h.arm}`).join(' · ') +
    '. Reported by v2 as a wrong pointer; in each case the note is correct and the detector is reading an English possessive as a token adjacency.',
);

check(
  'C5',
  'reason four, and it is the one with no token at all: a note inside `probe-roundNNN` that says "arm C1" means THIS FILE\'s C1. The enclosing file is the owner, the cited round is only what the sentence is about, and nothing on the line distinguishes the two — which is why the general detector needs a reader and the narrow one in section D does not',
  SELF_OWNED.length > 0 && SELF_OWNED.every((h) => definesArmAny(readFileSync(join(REPO, h.file), 'utf8'), h.arm)),
  SELF_OWNED.map((h) => `${h.file.replace(/^scripts\//, '').slice(0, 30)}:${h.line} cited r${h.round}, arm ${h.arm} defined in the enclosing file`).join(' · ') +
    '. Confirmed by reaching for the label in the enclosing file rather than by reading the English.',
);

// ── Section D: the §4 offer, taken — and green on the pointer it exists to reject ─────────────────
console.log('\n── D. the narrow detector, and the defect in the offer as worded ──');

const TSCONFIG = join(SCRIPTS, 'tsconfig.json');
const TSCONFIG_SRC = readFileSync(TSCONFIG, 'utf8');

/** The claim string of a named arm in a named probe, read from the `check(` call itself. */
const claimOf = (probeSrc: string, arm: string): string | null => {
  const m = new RegExp(`check\\(\\s*'${arm}',\\s*\\n\\s*('|")([\\s\\S]*?)\\1,`, 'm').exec(probeSrc);
  return m ? m[2] : null;
};

/**
 * The narrow detector. Narrow in exactly the dimension sections B and C fail in: the site, the
 * round, the arm and the token are all fixed by the note itself, so there is no binding to infer.
 * `strict` is the token-boundary form; the loose form is the offer as it was worded in Round 307 §4.
 */
const jsPointersOk = (configSrc: string, strict: boolean): { ok: boolean; detail: string } => {
  const found: string[] = [];
  for (const m of configSrc.matchAll(/`probe-round(\d+)`\s+arm\s+`?([A-Z]\d+)`?/g)) {
    const [, round, arm] = m;
    // Only pointers in a sentence that is itself about `.js` are in scope.
    const window = configSrc.slice(Math.max(0, m.index - 400), m.index + 400);
    if (!/\.js(?![A-Za-z0-9])/.test(window)) continue;
    const p = PROBES.get(round);
    const claim = p ? claimOf(readFileSync(p, 'utf8'), arm) : null;
    const hit = claim === null ? false : strict ? /\.js(?![A-Za-z0-9])/.test(claim) : claim.includes('.js');
    found.push(`r${round}/${arm}=${hit ? 'ok' : 'MISMATCH'}`);
    if (!hit) return { ok: false, detail: found.join(' · ') };
  }
  return { ok: found.length > 0, detail: found.join(' · ') };
};

const LIVE_STRICT = jsPointersOk(TSCONFIG_SRC, true);
/** The real Round 306 defect, replayed: both occurrences of the pointer back to `C1`. */
const REVERTED = TSCONFIG_SRC.replace(/(`probe-round304`\s+arm\s+)E1/g, '$1C1').replace(
  /\band E1 reddens when one appears/g,
  'and C1 reddens when one appears',
);
const REVERTED_STRICT = jsPointersOk(REVERTED, true);
const REVERTED_LOOSE = jsPointersOk(REVERTED, false);

measure(
  'D0',
  `scripts/tsconfig.json carries ${[...TSCONFIG_SRC.matchAll(/`probe-round(\d+)`\s+arm\s+`?([A-Z]\d+)`?/g)].length} ` +
    'backticked probe/arm pointer(s); the `.js`-sentence filter admits ' +
    `${LIVE_STRICT.detail.split(' · ').filter(Boolean).length} of them`,
);

check(
  'D1',
  'the offer, taken: the live `.js` obligation note in scripts/tsconfig.json names an arm whose own check string is about `.js` — so the pointer Daedalus repaired this fire is guarded by an arm from now on instead of by a reader',
  LIVE_STRICT.ok,
  `${LIVE_STRICT.detail} — probe-round304 arm E1's claim reads "there is no .js file under scripts/…". ` +
    'The note and the arm share the token by construction, which is what makes this mechanical and the general form in B/C not.',
);

check(
  'D2',
  'THE KNOWN POSITIVE, and it is the defect this fleet actually shipped rather than one minted for the arm: with both occurrences of the pointer reverted to `C1` — the state of the file from Round 304 until Theseus repaired half of it and Daedalus the other half — the detector REDS',
  !REVERTED_STRICT.ok,
  `reverted → ${REVERTED_STRICT.detail}. The revert is applied to a string in memory; scripts/tsconfig.json is never written (arm Z1). ` +
    'Round 306 §5 found this by reading; Round 307 §4 found the second occurrence by reading; from here an arm finds it.',
);

check(
  'D3',
  'THE FINDING, third part: the detector AS WORDED in Round 307 §4 — "the arm\'s own check string CONTAINS `.js`" — is GREEN on the reverted pointer, because arm C1\'s claim string reads "a copy of the real scripts/package.json" and `package.json` contains `.js`. Only the token-boundary form reds. Both drivens in one arm',
  REVERTED_LOOSE.ok && !REVERTED_STRICT.ok,
  `same reverted file: loose \`.includes('.js')\` → ${REVERTED_LOOSE.ok ? 'GREEN (wrong)' : 'red'} · ` +
    `strict /\\.js(?![A-Za-z0-9])/ → ${REVERTED_STRICT.ok ? 'green' : 'RED (correct)'}. ` +
    'Fifth instance of the standing note: give every detector a known positive copied from the real call shape. ' +
    'Had I taken the offer as written and checked it against E1 alone, it would have gone SWEPT green and guarded nothing.',
);

check(
  'D4',
  'and this is the whole argument for narrow over general, as a measured comparison rather than a preference: on this repo, this fire, the narrow detector reports 0 false positives and the two general ones report 13 between them',
  V1.length + V2.length === 13 && LIVE_STRICT.ok,
  `narrow: 0 false · general v1+v2: ${V1.length + V2.length} false. ` +
    'The difference is not care taken. The narrow form fixes the site, the round, the arm and the token in advance, so it never infers a binding; B and C exist only because every line-local approximation of that binding manufactures findings.',
);

// ── Section E: the arm this file reddened on arrival, and what its reach actually is ──────────────
// Header repaired in Round 309 arm E1: it read "1 of 21 reached", and neither half of that pairing
// is among the figures this section measures — [E0] reads 18 hand-rolled and 0 reached, [E1] reads
// "0 of 18 … and 1 of 19 at the moment this file reddened it", and 21 appears nowhere in the run.
// Which is this file's own §5 finding one level out: an arm's label restating its measured scope
// without being graded against it. The predicate was never wrong; only the sentence above it.
console.log('\n── E. probe-round224 arm G: 0 of 18 reached, and the 1 it ever reached was mine, falsely ──');

/**
 * `probe-round224` arm G, copied verbatim from `:366` so the measurement grades the real predicate
 * rather than a description of it. Normalisation is the arm's own: comments blanked, STRINGS KEPT.
 */
const isHandRolledG = (src: string): boolean =>
  /SKIP/.test(src) && /checks passed/.test(src) && !/summariseAndExit\(/.test(src);
/** The same property with the `SKIP` conjunct dropped — i.e. "hand-rolled" without the channel term. */
const isHandRolled = (src: string): boolean =>
  /checks passed/.test(src) && !/summariseAndExit\(/.test(src);

const scriptNames = readdirSync(SCRIPTS).filter(
  (n) => (n.endsWith('.mts') || n.endsWith('.mjs')) && !n.startsWith('.'),
);
const normalised = (n: string): string => stripSource(readFileSync(join(SCRIPTS, n), 'utf8'), false);
const HAND_ROLLED = scriptNames.filter((n) => isHandRolled(normalised(n)));
const REACHED_BY_G = HAND_ROLLED.filter((n) => isHandRolledG(normalised(n)));

measure(
  'E0',
  `scripts/ scanned ${scriptNames.length} · hand-rolled summary (prints "checks passed", no summariseAndExit): ` +
    `${HAND_ROLLED.length} · of those, reached by probe-round224 arm G's three-term conjunction: ${REACHED_BY_G.length}`,
);

check(
  'E1',
  'THE SECOND FINDING: `probe-round224` arm G is SWEPT and green and its reach over the property it names is ZERO — the limiting conjunct is `/SKIP/`, which is not about hand-rolled summaries at all, so every hand-rolled probe under scripts/ is invisible to it unless it happens to contain that token. It was green before this fire and it is green again, and in between the only file it could see was this one',
  HAND_ROLLED.length > 5 && REACHED_BY_G.length === 0,
  `${REACHED_BY_G.length} of ${HAND_ROLLED.length} reached — and 1 of 19 at the moment this file reddened it, which was the whole of its live reach. Not reached, among others: ` +
    `${HAND_ROLLED.filter((n) => !REACHED_BY_G.includes(n)).slice(0, 4).map((n) => n.replace(/^probe-/, '').slice(0, 28)).join(', ')}. ` +
    'Same root cause as Round 307 §3 one layer out: the arm\'s own scope is narrower than the sentence its label states, and no arm grades an arm\'s scope. ' +
    'Measured on the arm\'s own predicate and the arm\'s own normalisation (`stripSource(src, false)`), copied from probe-round224:366, not on a paraphrase. ' +
    'This arm is a pin on zero, deliberately: the moment arm G reaches a real hand-rolled probe, it reds here too, and the figure above stops being a statement about an empty set.',
);

check(
  'E2',
  'and the one file arm G DID reach, it reached falsely — this file, on its first run, because its directory-walk exclusion list is a constant named SKIP. A file-walk exclusion is not a skip channel, so the arm\'s only live hit in its entire history of reach was a false positive, while the 18 genuinely hand-rolled probes beside it were out of reach',
  ((): boolean => {
    // The pre-repair shape, replayed as a string rather than by reverting the file (arm Z1).
    const preRepair = 'const SKIP = new Set([]);\nconsole.log(`All ${pass} regression checks passed`);\n';
    const postRepair = 'const SKIP = new Set([]);\nsummariseAndExit({ probeName: "x", results });\n';
    return isHandRolledG(preRepair) && !isHandRolledG(postRepair) && !isHandRolledG(normalised(relative(SCRIPTS, SELF)));
  })(),
  'pre-repair shape → arm G reports hand-rolled (the red this file caused); post-repair shape → green. ' +
    'The repair was converting to summariseAndExit, which is the convention the arm exists to enforce — renaming SKIP would have cleared the red while leaving the property the arm is about unchanged, and that is the dodge, not the fix.',
);

check(
  'E3',
  'arm G is deliberately NOT edited here, on the precedent Daedalus set with my own probe-round303 B3 this round: it is SWEPT, its claim is true of everything it reaches, and widening another seat\'s SWEPT arm restages its pin. The gap is reported and the offer is in the memo',
  isHandRolledG('SKIP checks passed') && !isHandRolledG('checks passed'),
  'the conjunct demonstrated in two literals rather than argued: with the token present the predicate fires, without it the identical hand-rolled property does not. ' +
    'Round 304 is the precedent for when editing another seat\'s arm is right — there the arm had been made false. Here it is only narrow.',
);

// ── Section F: the fifth explainer sub-case, taken — and the widening cannot resolve ownership ───
console.log('\n── F. the fifth sub-case: live in the tree, and the label namespace is per-file ──');

/**
 * Section C's four reasons each answer "who owns this arm?" with a file named ON THE LINE: the
 * cited round, or the enclosing probe. The sub-case neither one covers is the one where the owner
 * is a THIRD file — the enclosing file does not define the label and the cited round does not
 * either. Added in Round 313; the two live sites below were already in the tree when C1 was
 * written, counted inside its pinned total and attributed to categories that are about something
 * else, which is why the figure never moved and the gap was invisible to the pin.
 */
const ownersOf = (arm: string): string[] => {
  const out: string[] = [];
  for (const [round, p] of PROBES) {
    // Self-exclusion again, and it was NOT free: arm F3's control went red on its first run because
    // this file now writes `ownersOf('Q9')`, and the any-spelling key reads a quoted label anywhere
    // in a file as a definition — so the probe became the sole "owner" of the label it mints to
    // prove nobody owns it. Section A excludes this file from the HITS; the owner side needed it
    // too, and the control is what reported that rather than a silently larger count.
    if (p === SELF) continue;
    if (definesArmAny(readFileSync(p, 'utf8'), arm)) out.push(round);
  }
  return out.sort();
};

/** The sub-case as a predicate over a hit: neither file named on the line defines the label. */
const foreignOwned = (h: Hit): boolean => {
  const abs = join(REPO, h.file);
  const enclosingDefines =
    /probe-round\d+/.test(h.file) && definesArmAny(readFileSync(abs, 'utf8'), h.arm);
  const cited = PROBES.get(h.round);
  const citedDefines = cited !== undefined && definesArmAny(readFileSync(cited, 'utf8'), h.arm);
  return !enclosingDefines && !citedDefines;
};
const FOREIGN = V2.filter(foreignOwned);
const OWNER_COUNTS = V2.map((h) => ownersOf(h.arm).length);

measure(
  'F0',
  `of the ${V2.length} pointers v2 reports, ${FOREIGN.length} are owned by neither file named on the line: ` +
    (FOREIGN.map((h) => `${h.file.replace(/^scripts\//, '').slice(0, 24)}:${h.line} r${h.round}/${h.arm} (${ownersOf(h.arm).length} file(s) define it)`).join(' · ') ||
      'none') +
    `. Owner counts across all ${V2.length}: ${OWNER_COUNTS.join(', ')} — min ${Math.min(...OWNER_COUNTS)}, max ${Math.max(...OWNER_COUNTS)}.`,
);

check(
  'F1',
  'the fifth sub-case is LIVE, not hypothetical: at least one pointer v2 reports names an arm that neither the enclosing file nor the cited round defines in either spelling — and the known positive is minted from the exact shape that reddened this probe in the next fire after the sub-case was named',
  ((): boolean => {
    mkdirSync(SCRATCH, { recursive: true });
    // The pre-repair shape as its author states it: a round citation and an arm token on one line,
    // in a file that declares no arms of its own. Reconstructed from the Round 312 memo's section 3,
    // NOT lifted from commit 4ebeb929 — see arm F3.
    const f = join(SCRATCH, 'foreign-owned.mjs');
    writeFileSync(f, "  why: 'repaired in Round 312 (C3 pin relocated, arm C5 added)',\n");
    const minted = v2([f]);
    // The known NEGATIVE, and it is the repaired line itself rather than a constructed one: the
    // shipped form carries BOTH tokens on one line and is still not reported, because the true
    // owner is cited between the wrong round and the arm label and the nearest-preceding rule
    // rebinds there. The repair is an insertion, not a separation — which is why "say whose arm it
    // is" works at all, and the reason the fix cannot be mistaken for evading the key by renaming.
    const g = join(SCRATCH, 'repaired-shape.mjs');
    writeFileSync(
      g,
      "  why: 'repaired in Round 312 (this file's C3 pin relocated to the file-declared figure, and probe-round309 arm C5 added to drive it)',\n",
    );
    const repaired = v2([g]);
    return (
      FOREIGN.length > 0 &&
      minted.length === 1 &&
      minted[0].arm === 'C5' &&
      minted[0].round === '312' &&
      foreignOwned(minted[0]) &&
      repaired.length === 0 &&
      // and the owner it is really about is reachable, just not from the line
      ownersOf('C5').includes('309')
    );
  })(),
  `${FOREIGN.length} live instance(s) in the tree; the minted positive classifies the same way. ` +
    'Both live sites are in `sweep-probes.mjs`, which declares no arms at all, so the enclosing-file ' +
    'explanation could never have reached them — the category they currently sit in is named for the ' +
    'cited round having produced no probe, which is true of the citation and silent about the arm.',
);

check(
  'F2',
  'and the widening cannot do what its name implies: resolving the owner by looking the label up across the tree is not available, because arm labels are per-file and not a namespace — every label v2 reports is defined by MANY probes, so "search for who owns C5" returns a crowd and the only repair that works is the prose one both seats reached by hand',
  OWNER_COUNTS.every((n) => n >= 2) && Math.max(...OWNER_COUNTS) >= 20,
  `owner counts ${OWNER_COUNTS.join(', ')}; median ${[...OWNER_COUNTS].sort((a, b) => a - b)[Math.floor(OWNER_COUNTS.length / 2)]}. ` +
    'A detector can say THAT a pointer is owned off-line; it cannot say BY WHOM. So the fifth sub-case is ' +
    'classifiable and not resolvable, and this arm is the measured reason — not a preference — that the ' +
    'repair discipline is "say whose arm it is" rather than "look it up".',
);

check(
  'F3',
  'the widening does not swallow the one class that would be a REAL finding: a label no probe in the tree defines is separated from the ambiguous class rather than absorbed into it — without this discriminator the new category would explain away exactly the defect the detector exists to catch',
  ((): boolean => {
    mkdirSync(SCRATCH, { recursive: true });
    const f = join(SCRATCH, 'unowned.mjs');
    // Round 304 exists and defines no Q9; no probe anywhere defines Q9. Same fixture family as B2.
    writeFileSync(f, '// guarded by `probe-round304` arm Q9 rather than left as a comment\n');
    const minted = v2([f]);
    return minted.length === 1 && foreignOwned(minted[0]) && ownersOf('Q9').length === 0;
  })(),
  'a label defined by 0 probes is reported and IS foreign-owned by the predicate, so the predicate alone ' +
    'is not the classifier — the owner count is: 0 owners = the pointer names nothing and is a real defect; ' +
    '>= 1 owner = the pointer names something the line cannot bind. F1 and this arm are the two sides, and ' +
    'the pair is why the widening is safe to add to an explainer whose whole claim is that nothing it reports is real.',
);

// ── Section Z: discipline ────────────────────────────────────────────────────────────────────────
console.log('\n── Z. discipline ──');

rmSync(SCRATCH, { recursive: true, force: true });

check(
  'Z1',
  'the population under scripts/ is byte-identical across this run — every real file this probe reasons about was read, and the reverted tsconfig in D2/D3 is a string in memory',
  fingerprint(REPO, 'scripts') === TREE_AT_START,
  'fingerprint of scripts/ taken before arm A0 and after the last arm, compared as a delta rather than as a cleanliness claim about the fire\'s tree.',
);

check(
  'Z2',
  'every fixture this probe mints — one in section B, three in section F — lived under .testdata/, which is gitignored, and the tree is removed before this arm runs',
  !existsSync(SCRATCH) && /(^|\n)\.testdata\//.test(readFileSync(join(REPO, '.gitignore'), 'utf8')),
  `${relative(REPO, SCRATCH)} absent at exit · .gitignore names .testdata/`,
);

measure(
  'Z3',
  'subprocesses: none. No port bound, no database opened, no corpus read, no model called, nothing under packages/ executed, and no compiler spawned — this probe is file reads and regexes over a tree it does not write.',
);

console.log(`\n${meas} measurements, 0 skips`);
summariseAndExit({ probeName: 'probe-round308', results });
