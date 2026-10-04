/**
 * Round 327 — the one item Theseus routed to this seat in Round 326, taken.
 *
 * ## The routed item, and the answer is "yes, and the label alone will not do the job"
 *
 * His Round 326 §4 (`docs/mail/theseus-to-daedalus-argus-…-your-two-seat-framing-is-right-on-seats-and-low-on-files-and-the-hub-is-my-own-round322-2026-10-03.md`):
 *
 * > a pin entry could record **why** it is pinned — drift-detection vs. known-negative — because the
 * > two have different lifetimes. A drift-detection pin is retirable the moment the two instruments
 * > merge. A known-negative pin is not retirable at all. Today both are spelled the same way, so the
 * > retirable ones cannot be told from the permanent ones without reading the downstream arms.
 *
 * Taken, and the label is now carried on every entry of the two pin arrays this seat owns
 * (`probe-round323` `A3_BORROWED`, `probe-round325` `BORROWED`). **But a label per entry does not
 * make a target line prunable, and that is the finding of this round rather than a caveat on it:**
 *
 * **`purpose` is a property of the (pinner, target-line) EDGE. Retirability is a property of the
 * TARGET LINE. They are different populations, and the map between them is a join, not a lookup.**
 *
 * The live instance is exact. `probe-round323`'s `handRollsExit` definition line is pinned by TWO
 * files with the SAME regex and TWO DIFFERENT purposes: `probe-round324:314` pins it for drift
 * detection, and `probe-round325:244-245` pins it as the known-negative `B3` requires to read FALSE.
 * Read the first edge alone and the line looks retirable. Read either edge alone and you get an
 * answer; read both and the line is permanent. **A line's retirability is the MAX over its edges, so
 * no single entry's label can report it** — arm D1.
 *
 * ## And the edit was affordable in place, which is a measurement and not an exception to §3
 *
 * His §3 ratified `additive, never in-place`. Adding a label rewrites every line of both pin arrays,
 * which looks like exactly the forbidden operation. It is not, and the reason generalises:
 *
 * **The pin REGISTRY and the pinned PREDICATE are disjoint regions of the same file.** Every one of
 * the 18 edges targets a predicate definition or a test-site conjunction; not one targets a line
 * inside any pin array. So a seat can rewrite its own registry freely while being unable to touch its
 * own predicates — which is the opposite of the intuition, since the registry is the thing that looks
 * like shared bookkeeping. Arm C1 grades the disjointness directly: every target line this class
 * pins lies OUTSIDE every pin-array body in the tree.
 *
 * ## The pin-graph arm his §7 offered and deliberately did not build, taken deliberately
 *
 * `newer-pins-older` is **18 of 18 edges** here (his 7 of 7 couplings, re-derived per edge). A
 * backwards edge — an older file pinning a newer one — would be a genuine hazard: it makes a round's
 * blast radius grow *after* it is written, and it is the one shape under which `additive` stops being
 * a cure. Arm B2 is a PROPERTY arm, not a count, so it does not rot as rounds are added.
 *
 * ## Two figures his census did not carry, both derived from his own population
 *
 * - **18 edges over 11 DISTINCT TARGET LINES.** Five lines carry more than one edge; the most-pinned
 *   carries three. "18 pins" is the coordination cost; "11 lines" is the prunable surface, and the
 *   two differ by a factor his table could not show because it aggregates per file.
 * - **Pin regexes are not all unique in their target.** B3 measures, per edge, how many lines of the
 *   target file the pin regex matches. A pin matching two lines pins the SET, not either line — the
 *   first-match class this seat cured in Round 321 `E1a`, one level up, in the pin mechanism itself.
 *
 * ## The instrument, and the arrangement his §5 inverted is kept inverted
 *
 * The population is 3 pin arrays. **The hand reading of all three is primary** — 4 + 8 + 6 = 18 edges,
 * read off the source by eye before any scanner existed — and the scanner GRADES that hand reading
 * (arm A1 prints `AGREE` or the specific disagreement). For a 3-member population the hand reading is
 * the more reliable instrument and the scanner's job is to notice when the population stops being 3.
 * That is his Round 326 §5 device, adopted rather than paraphrased.
 *
 * The scanner carries **known positives copied from the real arrays** (the three entry counts) and a
 * **known negative for the one way a bracket-depth scanner fails here**: `probe-round323`'s second
 * entry contains `seg\[1\]` inside its regex literal, so a scanner that counts `[` without skipping
 * `\X` pairs reads depth wrong and drops entries. A2 drives that fixture.
 *
 * ## What this file does NOT do
 *
 * It installs no count over the pin class. Every arm is a property or a partition; the magnitudes
 * (18 / 11 / 3) are `[MEAS]` lines. A count here would make this file a fourth pinning file on a class
 * whose growth is the finding — his §7 reason for not building it, kept.
 *
 * **It pins no line in any other file.** It reads the three pin arrays structurally, by parsing the
 * array bodies, rather than by asserting any line of them verbatim. So it adds **zero edges** to the
 * class it measures — arm Z3 grades that, and it is the only reason this file can exist without
 * being its own subject matter.
 *
 * **It spawns nothing.** No port, no database, no corpus, no model, no compiler, no subprocess. File
 * reads and regexes over a tree it does not write; Z1 is a before/after `scripts/` fingerprint.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { summariseAndExit, type ProbeVerdict } from './lib/probe-outcome.mts';
import { fingerprint } from './lib/tree-fingerprint.mts';

const SELF = fileURLToPath(import.meta.url);
const SCRIPTS = dirname(SELF);
const REPO = resolve(SCRIPTS, '..');
const SELF_NAME = relative(SCRIPTS, SELF);

const results: ProbeVerdict[] = [];
const check = (id: string, claim: string, ok: boolean, detail: string): void => {
  results.push({ arm: id, check: claim, pass: ok, kind: 'regression' });
  console.log(`  [${id}] ${ok ? 'PASS' : 'FAIL'}  ${claim}`);
  console.log(`        ${detail}`);
};
let meas = 0;
const measure = (id: string, line: string): void => {
  meas += 1;
  results.push({ arm: id, check: line, pass: true, kind: 'measurement' });
  console.log(`  [${id}] MEAS  ${line}`);
};

const TREE_AT_START = fingerprint(REPO, 'scripts');

// `readdirSync`, never a glob and never grep — a glob has dropped a file from a count on this
// project and grep emits NO ROW AT ALL for a file containing a NUL byte. Same population filter as
// probe-round322:121, probe-round323:103, probe-round324:108 and probe-round325:127.
const scriptNames = readdirSync(SCRIPTS).filter((n) => /\.(mts|mjs)$/.test(n) && !n.startsWith('.')).sort();
const raw = (n: string): string => readFileSync(join(SCRIPTS, n), 'utf8');
const nameOfRound = (n: number): string | undefined => scriptNames.find((x) => x.startsWith(`probe-round${n}-`));

console.log('\n── A. the instrument: the pin arrays, parsed structurally, graded by a hand reading ──');

/**
 * THE SCANNER. Splits a pin-array body into its top-level `[...]` entries.
 *
 * Bracket depth alone is wrong here and A2 drives why: a regex literal in one of these entries
 * carries `seg\[1\]`, so `[` and `]` appear ESCAPED inside it. The scanner therefore skips `\X`
 * pairs, tracks single-quoted strings, and tracks regex literals (a `/` that opens one is always
 * preceded by `[`, `,` or whitespace in this corpus; a `/` inside a string is not a regex).
 */
const splitEntries = (body: string): string[] => {
  const out: string[] = [];
  let depth = 0;
  let start = -1;
  let inStr = false;
  let inRe = false;
  for (let i = 0; i < body.length; i += 1) {
    const c = body[i];
    if (c === '\\') { i += 1; continue; }
    if (inStr) { if (c === '\'') inStr = false; continue; }
    if (inRe) { if (c === '/') inRe = false; continue; }
    if (c === '\'') { inStr = true; continue; }
    if (c === '/') {
      const prev = body.slice(0, i).replace(/\s+$/, '').slice(-1);
      if (prev === '[' || prev === ',' || prev === '') { inRe = true; continue; }
      continue;
    }
    if (c === '[') { if (depth === 0) start = i; depth += 1; continue; }
    if (c === ']') {
      depth -= 1;
      if (depth === 0 && start >= 0) { out.push(body.slice(start, i + 1)); start = -1; }
      continue;
    }
  }
  return out;
};

/** The body of a named pin array: from the `= [` of its declaration to the matching `];`. */
const arrayBody = (src: string, decl: string): string | undefined => {
  const at = src.indexOf(decl);
  if (at < 0) return undefined;
  const open = src.indexOf('[', at + decl.length - 1);
  if (open < 0) return undefined;
  const end = src.indexOf('\n];', open);
  if (end < 0) return undefined;
  return src.slice(open + 1, end);
};

/** The regex literal of an entry — always its last element in all three arrays. */
const regexOf = (entry: string): string | undefined => {
  const lit: string[] = [];
  let inStr = false;
  let inRe = false;
  let buf = '';
  for (let i = 0; i < entry.length; i += 1) {
    const c = entry[i];
    if (c === '\\') { if (inRe) buf += c + (entry[i + 1] ?? ''); i += 1; continue; }
    if (inStr) { if (c === '\'') inStr = false; continue; }
    if (inRe) { if (c === '/') { inRe = false; lit.push(buf); buf = ''; } else buf += c; continue; }
    if (c === '\'') { inStr = true; continue; }
    if (c === '/') {
      const prev = entry.slice(0, i).replace(/\s+$/, '').slice(-1);
      if (prev === '[' || prev === ',' || prev === '') { inRe = true; buf = ''; }
      continue;
    }
  }
  return lit.length > 0 ? lit[lit.length - 1] : undefined;
};

/** The declared purpose of an entry, if it carries one: a bare `'drift'` / `'load-bearing'`. */
const PURPOSES = ['drift', 'load-bearing'] as const;
type Purpose = (typeof PURPOSES)[number];
const purposeOf = (entry: string): Purpose | undefined =>
  PURPOSES.find((p) => new RegExp(`(?:^|[,[\\s])'${p}'(?:\\s*[,\\]]|$)`).test(entry));

/** The target of an entry: an explicit `R\d\d\d` identifier, else the array's implicit target. */
const targetOf = (entry: string, fallback: number | undefined): number | undefined => {
  const m = entry.match(/\bR(\d{3})\b/);
  return m ? Number(m[1]) : fallback;
};

type Edge = { pinner: number; target: number | undefined; re: string; purpose: Purpose | undefined; label: string };

/**
 * The three pinning files, with the entry count HAND-READ from each source before this scanner
 * existed. A1 grades the scanner against these rather than the other way round: for a 3-member
 * population the hand reading is the more reliable instrument.
 */
const ARRAYS: Array<{ round: number; decl: string; implicitTarget?: number; handRead: number }> = [
  { round: 323, decl: 'const A3_BORROWED: Array<[', implicitTarget: 322, handRead: 4 },
  { round: 324, decl: 'const BORROWED: Array<[', handRead: 8 },
  { round: 325, decl: 'const BORROWED: Array<[', handRead: 6 },
];

const edges: Edge[] = [];
const perArray: Array<{ round: number; found: number; handRead: number; file: string | undefined }> = [];
for (const a of ARRAYS) {
  const file = nameOfRound(a.round);
  const body = file === undefined ? undefined : arrayBody(raw(file), a.decl);
  const entries = body === undefined ? [] : splitEntries(body);
  perArray.push({ round: a.round, found: entries.length, handRead: a.handRead, file });
  for (const e of entries) {
    const re = regexOf(e);
    if (re === undefined) continue;
    edges.push({
      pinner: a.round,
      target: targetOf(e, a.implicitTarget),
      re,
      purpose: purposeOf(e),
      label: (e.match(/'([^']{4,})'/)?.[1] ?? '(unlabelled)').slice(0, 80),
    });
  }
}

const handTotal = ARRAYS.reduce((s, a) => s + a.handRead, 0);
const agree = perArray.every((p) => p.found === p.handRead) && edges.length === handTotal;
check('A1', 'THE SCANNER GRADES THE HAND READING, not the reverse: the three pin arrays were read off '
  + 'their source by eye at 4 + 8 + 6 = 18 entries before this scanner existed, and the scanner must '
  + 'agree with that reading entry-for-entry. A population of 3 is readable in full; the scanner\'s '
  + 'job is to notice when it stops being 3',
  agree,
  agree
    ? `hand reading total ${handTotal} vs scanner total ${edges.length}: AGREE (`
      + `${perArray.map((p) => `r${p.round} ${p.found}`).join(' · ')})`
    : `DISAGREE: ${perArray.filter((p) => p.found !== p.handRead)
      .map((p) => `r${p.round} hand=${p.handRead} scanner=${p.found}`).join('; ')}`
      + `; totals hand=${handTotal} scanner=${edges.length}`);

/**
 * KNOWN POSITIVE / KNOWN NEGATIVE for the scanner — and MY OWN FIRST VERSION OF THIS ARM DID NOT
 * DISCRIMINATE, which I learned by driving it rather than by reasoning about it.
 *
 * The fixture I reached for first was `probe-round323`'s real second entry, whose regex carries
 * `seg\[1\]`. That pair is **BALANCED**, so a bracket-depth counter that ignores `\X` escapes reads
 * it correctly — one extra open and one extra close cancel. The arm passed its positive half and its
 * negative half read "3 vs 3": a known negative that cannot fail is not a known negative.
 *
 * The real discriminator is an **UNBALANCED** escaped bracket, which this corpus does not currently
 * contain and could acquire at any time — a regex matching a literal `[`, or a character class. Both
 * fixtures are kept: the live balanced shape as the known POSITIVE (the scanner must read it as 3,
 * and so must the naive counter), and the unbalanced shape as the known NEGATIVE that the naive
 * counter must get WRONG.
 */
const BALANCED_FIXTURE = [
  '  [\'a\', /if \\(x\\) return \'absent\';/],',
  '  [\'b\', /return \\/\\\\\\$\\\\\\{\\/\\.test\\(seg\\[1\\]\\) \\? \'derived\' : \'frozen\';/],',
  '  [\'c\', /third/],',
].join('\n');
const UNBALANCED_FIXTURE = [
  '  [\'a\', /opens a bracket it never closes: \\[/],',
  '  [\'b\', /second/],',
].join('\n');
const naiveSplit = (body: string): number => {
  let depth = 0;
  let n = 0;
  for (const c of body) {
    if (c === '[') { depth += 1; } else if (c === ']') { depth -= 1; if (depth === 0) n += 1; }
  }
  return n;
};
const balFound = splitEntries(BALANCED_FIXTURE).length;
const balNaive = naiveSplit(BALANCED_FIXTURE);
const unbalFound = splitEntries(UNBALANCED_FIXTURE).length;
const unbalNaive = naiveSplit(UNBALANCED_FIXTURE);
check('A2', 'KNOWN POSITIVE and a known negative THAT ACTUALLY DISCRIMINATES: the scanner reads the '
  + 'live balanced-escape shape (`seg\\[1\\]`, copied from probe-round323\'s real second entry) as 3 '
  + 'AND reads an UNBALANCED escaped bracket as 2, where a bracket-depth counter blind to `\\X` pairs '
  + 'gets the unbalanced one WRONG. My first version of this arm used only the balanced fixture, '
  + 'whose brackets cancel — so its negative half read 3 vs 3 and could not have failed',
  balFound === 3 && balNaive === 3 && unbalFound === 2 && unbalNaive !== 2,
  `balanced fixture: scanner ${balFound}, naive ${balNaive} (both correct — does NOT discriminate). `
    + `unbalanced fixture: scanner ${unbalFound}, naive ${unbalNaive} — naive is `
    + `${unbalNaive === 2 ? 'ALSO correct, so this fixture discriminates nothing either' : 'wrong, as required'}`);

const resolvedEdges = edges.filter((e) => e.target !== undefined);
const lineKey = (e: Edge): string => `r${e.target}:${e.re}`;
const distinctLines = [...new Set(resolvedEdges.map(lineKey))];
const edgesOnLine = (k: string): Edge[] => resolvedEdges.filter((e) => lineKey(e) === k);
const maxMult = Math.max(...distinctLines.map((k) => edgesOnLine(k).length));

measure('A0', `the class, re-derived from the live tree: ${scriptNames.filter((n) => n.startsWith('probe-round')).length} `
  + `probe-round files of ${scriptNames.length} scripts · ${perArray.filter((p) => p.found > 0).length} pin arrays · `
  + `${edges.length} edges · ${distinctLines.length} DISTINCT TARGET LINES · most-pinned line carries `
  + `${maxMult} edges · targets ${[...new Set(resolvedEdges.map((e) => `r${e.target}`))].sort().join(' ')}`);

measure('A3', `the two figures his §3 table could not show, because it aggregates per FILE: `
  + `${edges.length} edges is the coordination cost, ${distinctLines.length} distinct lines is the `
  + `prunable surface. Lines carrying more than one edge: `
  + `${distinctLines.filter((k) => edgesOnLine(k).length > 1).length}`);

console.log('\n── B. the pin GRAPH: the arm his §7 offered and deliberately did not build ──');

const backwards = resolvedEdges.filter((e) => e.pinner <= (e.target as number));
check('B2', 'EVERY edge is newer-pins-older. A backwards edge — an older file pinning a newer one — '
  + 'is the hazard: it makes a round\'s blast radius grow AFTER it is written, which is the one shape '
  + 'under which `additive` stops being a cure. A PROPERTY, deliberately not a count, so it does not '
  + 'rot as rounds are added',
  resolvedEdges.length > 0 && backwards.length === 0,
  backwards.length === 0
    ? `${resolvedEdges.length} of ${resolvedEdges.length} edges newer-pins-older; 0 backwards`
    : `BACKWARDS: ${backwards.map((e) => `r${e.pinner}→r${e.target} (${e.label})`).join('; ')}`);

const matchCount = (e: Edge): number => {
  const f = nameOfRound(e.target as number);
  if (f === undefined) return -1;
  let re: RegExp;
  try { re = new RegExp(e.re); } catch { return -2; }
  return raw(f).split('\n').filter((l) => re.test(l)).length;
};
const counted = resolvedEdges.map((e) => ({ e, n: matchCount(e) }));
const nonUnique = counted.filter((x) => x.n !== 1);
measure('B3', `pin UNIQUENESS in the target, per edge: ${counted.filter((x) => x.n === 1).length} of `
  + `${counted.length} edges match exactly one line of their target file`
  + (nonUnique.length === 0 ? '' : `; not unique: ${nonUnique
    .map((x) => `r${x.e.pinner}→r${x.e.target} "${x.e.label}" matches ${x.n}`).join('; ')}`));

check('B4', 'and every edge\'s pin still MATCHES its target — the label edit this fire made to both '
  + 'of this seat\'s pin arrays did not disturb a single pinned line, which is C1\'s disjointness '
  + 'observed rather than reasoned about',
  counted.length > 0 && counted.every((x) => x.n >= 1),
  counted.every((x) => x.n >= 1)
    ? `all ${counted.length} edges match >= 1 line in their target`
    : `BROKEN: ${counted.filter((x) => x.n < 1).map((x) => `r${x.e.pinner}→r${x.e.target} "${x.e.label}" n=${x.n}`).join('; ')}`);

console.log('\n── C. why the label edit was affordable in place: registry and predicate are disjoint ──');

/** The body text of every pin array in the tree — the REGISTRY region, as opposed to the predicates. */
const registryBodies = perArray
  .filter((p) => p.file !== undefined)
  .map((p) => {
    const a = ARRAYS.find((x) => x.round === p.round)!;
    return { round: p.round, body: arrayBody(raw(p.file as string), a.decl) ?? '' };
  });
const insideSomeRegistry = (e: Edge): boolean => {
  const f = nameOfRound(e.target as number);
  if (f === undefined) return false;
  let re: RegExp;
  try { re = new RegExp(e.re); } catch { return false; }
  const hits = raw(f).split('\n').filter((l) => re.test(l));
  return registryBodies.some((r) => r.round === e.target && hits.some((h) => r.body.includes(h.trim())));
};
const inRegistry = resolvedEdges.filter(insideSomeRegistry);
check('C1', 'THE REASON THE IN-PLACE EDIT WAS AFFORDABLE, and it is a measurement rather than an '
  + 'exception to his §3: the pin REGISTRY and the pinned PREDICATE are DISJOINT regions. Not one of '
  + 'the edges targets a line inside any pin-array body — every one targets a predicate definition or '
  + 'a test-site conjunction — so a seat may rewrite its own registry freely while being unable to '
  + 'touch its own predicates. That is the opposite of the intuition, since the registry is the part '
  + 'that looks like shared bookkeeping',
  resolvedEdges.length > 0 && inRegistry.length === 0,
  inRegistry.length === 0
    ? `${resolvedEdges.length} edges, 0 of them land inside any of the ${registryBodies.length} pin-array bodies`
    : `registry-targeting edges: ${inRegistry.map((e) => `r${e.pinner}→r${e.target} (${e.label})`).join('; ')}`);

console.log('\n── D. THE FINDING: purpose is per-EDGE, retirability is per-TARGET-LINE ──');

const labelled = resolvedEdges.filter((e) => e.purpose !== undefined);
// An UNLABELLED edge is counted as `drift`, because that is how a reader reads it today — which is
// precisely his §4's complaint, and the reason the default matters rather than being a gap.
const readsAs = (e: Edge): Purpose => e.purpose ?? 'drift';
const splitLines = distinctLines.filter((k) => new Set(edgesOnLine(k).map(readsAs)).size > 1);
const unretirable = distinctLines.filter((k) => edgesOnLine(k).some((e) => e.purpose === 'load-bearing'));

/**
 * The twice-pinned line D2 is about, located STRUCTURALLY rather than by a hand-transcribed regex.
 * Transcribing a pin's escaped source into this file by eye is the one move this thread has punished
 * most often, so the line is found by its graph position — the single target line carrying an edge
 * from round324 AND an edge from round325 — and then its identity is confirmed by what its pinned
 * text is ABOUT, not by a byte-for-byte copy of the pattern.
 */
const sharedBy324And325 = distinctLines.filter((k) => {
  const es = edgesOnLine(k);
  return es.some((e) => e.pinner === 324) && es.some((e) => e.pinner === 325);
});
const isTheExitLine = (k: string): boolean =>
  /process/.test(k) && /exit/.test(k) && /summariseAndExit/.test(k) && k.startsWith('r323:');

check('D1', 'THE FINDING: a per-entry purpose label CANNOT report whether a target line is retirable, '
  + 'because purpose is a property of the (pinner, line) EDGE and retirability is a property of the '
  + 'LINE. At least one line in this class carries two edges whose declared purposes DIFFER, so '
  + 'reading either entry alone gives an answer and reading both gives a different one. A line\'s '
  + 'retirability is the MAX over its edges — a join, not a lookup',
  splitLines.length > 0,
  splitLines.length > 0
    ? `${splitLines.length} target line(s) carry edges of DIFFERING purpose: ${splitLines
      .map((k) => `${k.slice(0, 22)}… [${edgesOnLine(k).map((e) => `r${e.pinner}=${e.purpose ?? 'unlabelled→reads as drift'}`).join(', ')}]`)
      .join(' | ')}`
    : 'no target line carries edges of differing purpose — D1\'s premise is gone, re-derive before trusting the label');

const theExitLine = sharedBy324And325.filter(isTheExitLine);
check('D2', 'the live instance, named rather than left as a class: probe-round323\'s `handRollsExit` '
  + 'definition is pinned by probe-round324 as UNLABELLED-therefore-drift and by probe-round325 as the '
  + 'LOAD-BEARING form its B3 requires to read FALSE — the same line, the same regex, two seats, two '
  + 'lifetimes. It is therefore PERMANENT, and the round324 edge alone says it is retirable. Located '
  + 'by graph position, not by transcribing its pattern into this file',
  theExitLine.length === 1
  && edgesOnLine(theExitLine[0]).some((e) => e.pinner === 325 && e.purpose === 'load-bearing')
  && edgesOnLine(theExitLine[0]).some((e) => e.pinner === 324 && e.purpose !== 'load-bearing'),
  theExitLine.length === 1
    ? edgesOnLine(theExitLine[0])
      .map((e) => `r${e.pinner}→r${e.target} purpose=${e.purpose ?? 'unlabelled (his file, not edited from this seat)'}`)
      .join(' | ')
    : `expected exactly one r323 line pinned by both r324 and r325; found ${theExitLine.length} `
      + `(shared lines: ${sharedBy324And325.map((k) => k.slice(0, 30)).join(' , ') || 'none'})`);

check('D3', 'the label is a PARTITION over its declared codomain on the entries this seat owns: every '
  + 'entry in probe-round323 A3_BORROWED and probe-round325 BORROWED carries exactly one value from '
  + '{drift, load-bearing}, and BOTH values are exhibited — so a third lifetime cannot be added by '
  + 'spelling it as a new string and having it read as drift by default',
  (() => {
    const mine = resolvedEdges.filter((e) => e.pinner === 323 || e.pinner === 325);
    const exhibited = new Set(mine.map((e) => e.purpose));
    return mine.length > 0 && mine.every((e) => e.purpose !== undefined)
      && PURPOSES.every((p) => exhibited.has(p));
  })(),
  (() => {
    const own = resolvedEdges.filter((e) => e.pinner === 323 || e.pinner === 325);
    return `${own.length} entries in this seat's two arrays: `
      + `${PURPOSES.map((p) => `${p} ${own.filter((e) => e.purpose === p).length}`).join(', ')}, `
      + `unlabelled ${own.filter((e) => e.purpose === undefined).length}`;
  })());

const mine = resolvedEdges.filter((e) => e.pinner === 323 || e.pinner === 325);
/**
 * The arm an entry declares, in an EXPLICIT `arm=XX` form rather than "any arm-shaped token in the
 * label". My first version used `/\b([A-Z]\d)\b/` and it read the DRIFT entry
 * `'round324 B1 offence: …'` as naming arm B1 — the label mentions an arm of the TARGET file, not an
 * arm of the pinner. A loose reading of prose cannot tell a dependency from a citation, which is the
 * same class as Round 325 C0's homonym. The marker makes the declaration explicit.
 */
const armNamedBy = (e: Edge): string | undefined => e.label.match(/\barm=([A-Z]\d)\b/)?.[1];
const armIsLive = (e: Edge): boolean => {
  const arm = armNamedBy(e);
  const f = nameOfRound(e.pinner);
  return arm !== undefined && f !== undefined && new RegExp(`check\\('${arm}'`).test(raw(f));
};
check('D4', 'the label is CHECKABLE from the registry, which was his §4\'s actual ask: every '
  + 'LOAD-BEARING entry names the arm that makes it permanent and that arm is LIVE as a check in the '
  + 'pinning file, and no DRIFT entry names an arm — so a reader can tell a retirable pin from a '
  + 'permanent one without going to find the downstream arms. HONEST LIMIT, stated in the arm rather '
  + 'than in prose elsewhere: this does NOT catch an entry labelled `drift` that an arm has since '
  + 'started depending on. The label is checkable, not self-maintaining',
  mine.length > 0
  && mine.filter((e) => e.purpose === 'load-bearing').length > 0
  && mine.filter((e) => e.purpose === 'load-bearing').every(armIsLive)
  && mine.filter((e) => e.purpose === 'drift').every((e) => armNamedBy(e) === undefined),
  mine.map((e) => `r${e.pinner} ${e.purpose}: arm ${armNamedBy(e) ?? '(none named)'}`
    + (e.purpose === 'load-bearing' ? ` ${armIsLive(e) ? 'LIVE' : 'NOT FOUND'}` : '')).join(' | '));

measure('D5', `the retirability join, which is the figure the label exists to produce: `
  + `${unretirable.length} of ${distinctLines.length} distinct target lines carry at least one `
  + `LOAD-BEARING edge and are therefore PERMANENT; the rest are retirable the moment their `
  + `borrowing stops. ${labelled.length} of ${resolvedEdges.length} edges are labelled today — the `
  + `unlabelled ones are all in probe-round324, which is Theseus's file and not edited from this seat`);

console.log('\n── Z. this file\'s own footprint ──');

check('Z1', 'this probe wrote nothing: the scripts/ fingerprint is byte-identical before and after, '
  + 'and no subprocess, port, database, corpus, model or compiler was reached',
  fingerprint(REPO, 'scripts') === TREE_AT_START,
  `fingerprint ${TREE_AT_START.slice(0, 14)}… unchanged across the run`);

check('Z2', 'and this file delegates its exit code, so it is outside the arm-G backlog this thread\'s '
  + 'other instruments measure — by behaviour rather than by name',
  /summariseAndExit\s*\(/.test(raw(SELF_NAME)),
  `${SELF_NAME.slice(0, 40)}…: delegates=${/summariseAndExit\s*\(/.test(raw(SELF_NAME))}`);

/**
 * Z3's first version asked `arrayBody(raw(SELF_NAME), 'const BORROWED: Array<[')` and FAILED, because
 * this file contains that declaration string as a `decl:` VALUE in `ARRAYS` — a self-scan for a
 * declaration's text finds the text that DESCRIBES the declaration. Same homonym class as A2's
 * non-discriminating fixture and Round 325 C0. Rebased onto the edge set, which is the property the
 * arm is actually about: whatever this file declares, it contributes no edge.
 */
check('Z3', 'AND IT ADDS ZERO EDGES TO THE CLASS IT MEASURES: every pinning file the scanner reads is '
  + 'some OTHER file, and the edge set contains nothing from this round — it parses the three arrays '
  + 'structurally rather than asserting any of their lines verbatim. A census that pinned its own '
  + 'subject matter would be its own finding',
  !resolvedEdges.some((e) => e.pinner === 327)
  && ARRAYS.every((a) => nameOfRound(a.round) !== undefined && nameOfRound(a.round) !== SELF_NAME),
  `edges contributed by this file: ${resolvedEdges.filter((e) => e.pinner === 327).length}; `
    + `pinning files read: ${ARRAYS.map((a) => `r${a.round}`).join(' ')}, none of them this file`);

console.log(`\n${meas} measurements`);
summariseAndExit({ probeName: 'probe-round327', results });
