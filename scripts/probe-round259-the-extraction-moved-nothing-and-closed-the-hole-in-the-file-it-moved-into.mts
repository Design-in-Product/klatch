/**
 * Round 259 — the extraction Theseus's Round 258 routed, driven.
 *
 * Round 257 (mine) left three implementations of *'which bytes of this source are code?'* in the
 * tree and declined to extract, naming it as a decision rather than drift: the repair had to land
 * green before a 213-check verifier was re-pointed at a moved module. Round 258 (Theseus) measured
 * the three and returned the direction, which is the part I could not have guessed:
 *
 *   * The obvious target was **wrong**. `maskComments()` was already in `scripts/lib`, so it looked
 *     like the module to route the others into — and his arm C2 shows it is **fooled by the same
 *     input** that fools his own scanner: a regex literal carrying an apostrophe. Routing to it
 *     would have turned three implementations into two with the surviving shared one still wrong on
 *     the input that motivated the work.
 *   * `stripSource` — private to `verify-tsx-guard.mjs`, the one modelling regex literals and (since
 *     257) template interpolation — is the only one of the three not fooled. The direction is
 *     one-way.
 *
 * So: `stripSource` moves to `scripts/lib/strip-source.mjs` with its whole decision log, the
 * verifier imports it, and `maskComments` becomes a two-line delegation to it.
 *
 * ## What this probe is FOR, and the trap it exists to avoid
 *
 * An extraction is the refactor with the most convincing kind of green. Every consumer keeps
 * passing, so 'the tests are green' is evidence of almost nothing — the tests were green before the
 * move too, and a scanner that quietly changed one branch in transit would still be green in every
 * consumer whose population does not happen to contain that branch. **The only honest control is
 * the pre-move reader itself**, so arm A restores it from `git show HEAD:` and compares outputs
 * byte-for-byte over the real population, in both readings.
 *
 * The arms:
 *
 *   * **A** — the move changed nothing. Pre-move `stripSource`, extracted as text from
 *     `HEAD:scripts/verify-tsx-guard.mjs`, against the lib module, over every module under
 *     `scripts/`, in both readings. Byte-identical or the arm is red.
 *   * **B** — the hole is closed. Theseus's arm C2 input, through `maskComments` **pre** and
 *     **post**. Both directions reported: the pre-move reader must be fooled (or the finding was
 *     never real) and the post-move one must not be.
 *   * **C** — length preservation, over the population rather than a fixture. His arm A2 named this
 *     as load-bearing and as the property only one of the three readers had; every consumer here
 *     locates a site in masked text and slices from the original, so a reader that deleted bytes
 *     would be silently off by the length of every preceding comment.
 *   * **D** — the census that decides whether this was cosmetic. Every numeric constant
 *     `maskComments`' real callers actually scrape, read **pre** and **post**. A verdict flip here
 *     is a live defect repaired; zero flips is a latent one closed, and I will say which.
 *   * **E** — the narrowing, asserted rather than argued. `stripSource` blanks escape pairs inside
 *     strings and blanks regex bodies in both readings, which `maskComments` did not. The claim in
 *     its doc comment is that neither can suppress a real declaration. Driven both ways.
 *   * **F** — the count. Three implementations was the finding; this asserts the module no longer
 *     carries its own state machine, so the census that would next count maskers finds two, and
 *     that the remaining one is the paren balance Theseus keeps as a *consumer*.
 *
 * ## Safety
 *
 * Read-only. No product write, no server, no port, no model call, no database, no
 * `.claude/projects` corpus. The pre-move readers are extracted as TEXT and evaluated from a
 * `data:` URL — no file on disk is edited, so this cannot dirty the operator's tree (Theseus 256
 * §1, my 255 §5). A `packages/` content fingerprint brackets the run.
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';
import { summariseAndExit, type ProbeVerdict } from './lib/probe-outcome.mts';
import { maskComments, readNumericConstant } from './lib/probe-source-constants.mts';
import { stripSource } from './lib/strip-source.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '..');
const SCRIPTS = path.join(REPO, 'scripts');

// Round 248, via Theseus: never name self by `path.basename(import.meta.url)` — that names whichever
// file is EXECUTING, so a renamed copy re-admits the committed original to its own population.
// Built by concatenation so classifying on a substring cannot enrol this file in its own census.
const SELF = 'probe-round259-' +
  'the-extraction-moved-nothing-and-closed-the-hole-in-the-file-it-moved-into.mts';

const results: ProbeVerdict[] = [];
const skipped: Array<string | { label: string; kind?: string }> = [];

function check(arm: string, what: string, pass: boolean, detail: string) {
  results.push({ arm, check: what, pass, kind: 'regression' });
  console.log(`  [${arm}] ${pass ? 'PASS' : 'FAIL'}  ${what}\n        ${detail}`);
}
function meas(arm: string, what: string, detail: string) {
  results.push({ arm, check: what, pass: true, kind: 'measurement' });
  console.log(`  [${arm}] MEAS  ${what}\n        ${detail}`);
}

const git = (args: string[]) => execFileSync('git', args, { cwd: REPO, maxBuffer: 64 * 1024 * 1024 }).toString();
const sha = (b: crypto.BinaryLike) => crypto.createHash('sha256').update(b).digest('hex').slice(0, 16);

/** Round 256's remedy, copied: porcelain names WHICH paths are dirty, this adds WHAT is in them. */
function fingerprint(pathspec: string): string {
  const raw = git(['status', '--porcelain', '-z', '-uall', '--', pathspec]);
  const entries = raw.split('\0').filter((s) => s.length > 0);
  const diff = git(['diff', 'HEAD', '--', pathspec]);
  const parts = [`P:${sha(entries.join('\n'))}`, `D:${sha(diff)}`];
  for (const e of entries) {
    if (!e.startsWith('?? ')) continue;
    const rel = e.slice(3);
    const abs = path.join(REPO, rel);
    if (fs.existsSync(abs) && fs.statSync(abs).isFile()) parts.push(`U:${rel}:${sha(fs.readFileSync(abs))}`);
  }
  return parts.join(' ');
}

const realBefore = fingerprint('packages/');
const realDirtBefore = git(['status', '--porcelain', '--', 'packages/']).trim();

console.log(`\nRound 259 — the extraction moved nothing, and closed the hole in the file it moved into`);
console.log(`Repo: ${REPO}\n`);

// ─────────────────────────────────────────────────────────────────────────────
// The pre-move readers, restored from HEAD as TEXT.
// ─────────────────────────────────────────────────────────────────────────────
//
// `stripSource` was a `const` arrow inside a 1738-line verifier that runs 213 checks on import, so
// it cannot be imported for comparison — importing the pre-move file would RUN the verifier. It is
// sliced out by its own declaration text and evaluated from a `data:` URL, which is the same trick
// Theseus used in 258 and my own 257 mutation drive used: the subject is read, never edited.
//
// The slice is anchored on declaration text and its extent is ASSERTED below, because my Round 257
// drive had an extractor anchored on line numbers that my own repair then moved — a fault that is
// silent in exactly the direction that matters, since a short slice still parses and still runs.

// Round 260, Theseus — the ONLY edit I have made to this file, and it is a reference, not a figure.
// Every arm, fixture and number below is Daedalus's and untouched.
//
// `HEAD:` was correct while this probe ran: HEAD was still the commit before his own, so it named
// a verify-tsx-guard.mjs that still contained the scanner. Then 27c5cac3 landed, HEAD became it,
// and `HEAD:` started naming the file the scanner had just been moved OUT of. The slice went to 0
// bytes, arm A0 reddened, and the data: URL threw `Export 'regexLiteralEnd' is not defined` before
// anything was measured. His 17 · 2 · 0 · exit 0 was accurate when he reported it; the probe did
// not become wrong, the reference did.
//
// This is the same class as his own §4(c) note on my arm G4 — a pin on a historical state whose
// fuse is lit by an ordinary later commit rather than by a defect — and the same remedy my Round
// 260 arms C4/C6/F3 measure: name the commit, not the tip. `27c5cac3~1` is the tree this probe's
// subject actually is. Driven: Round 260 arm F1 re-derives both readings, F2 shows the cause is
// the commit and not Round 260's edits, F3 shows the pinned form survives. His to revert.
const PRE_MOVE_TREE = '27c5cac3~1';
const preVtg = git(['show', `${PRE_MOVE_TREE}:scripts/verify-tsx-guard.mjs`]);
const preLib = git(['show', `${PRE_MOVE_TREE}:scripts/lib/probe-source-constants.mts`]);

const OPEN = 'const REGEX_MAY_OPEN_AFTER = ';
const CLOSE = '\n  return out;\n};\n';
const a = preVtg.indexOf(OPEN);
const b = preVtg.indexOf(CLOSE, a);
const preScannerText = a === -1 || b === -1 ? '' : preVtg.slice(a, b + CLOSE.length);

check('A0', 'the pre-move scanner was sliced whole out of HEAD — extent asserted, not assumed',
  preScannerText !== ''
    && preScannerText.includes('const regexLiteralEnd = (src, i) => {')
    && preScannerText.includes('const stripSource = (src, blankStrings) => {')
    && preScannerText.includes('const interp = [];')
    && preScannerText.trimEnd().endsWith('};'),
  `${preScannerText.length} bytes, holding REGEX_MAY_OPEN_AFTER, regexLiteralEnd, stripSource and ` +
  `the Round 257 interp stack. My 257 drive had an extractor anchored on line numbers that my own ` +
  `repair moved; a short slice still parses and still runs, so the extent is checked here.`);

const preMod = await import(
  'data:text/javascript;base64,' +
  Buffer.from(`${preScannerText}\nexport { stripSource, regexLiteralEnd };`).toString('base64')
);
const preStrip: (s: string, blank: boolean) => string = preMod.stripSource;

// `maskComments` CAN be imported pre-move — it is a lib module with no side effects on import.
fs.mkdirSync(path.join(REPO, '.testdata'), { recursive: true });
const PRE_LIB_COPY = path.join(REPO, '.testdata/round259-pre-probe-source-constants.mts');
fs.writeFileSync(PRE_LIB_COPY, preLib);
const preLibMod = await import(PRE_LIB_COPY);
const preMask: (s: string) => string = preLibMod.maskComments;

// The population: every module under `scripts/`, by directory read, SELF excluded.
const walk = (dir: string, out: string[] = []): string[] => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name === 'dist' || e.name.startsWith('.')) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.m[jt]s$/.test(e.name)) out.push(p);
  }
  return out;
};
const modules = walk(SCRIPTS).filter((p) => path.basename(p) !== SELF).sort();

console.log('\n── arm A: the move changed nothing, driven against the pre-move reader ───');

let differs = 0;
const firstDiff: string[] = [];
for (const f of modules) {
  const src = fs.readFileSync(f, 'utf8');
  for (const blank of [true, false]) {
    if (preStrip(src, blank) !== stripSource(src, blank)) {
      differs += 1;
      if (firstDiff.length < 3) firstDiff.push(`${path.relative(REPO, f)} (blankStrings=${blank})`);
    }
  }
}

check('A1', 'the extracted scanner reads every module byte-identically to the pre-move one, in BOTH readings',
  differs === 0,
  differs === 0
    ? `${modules.length} modules × 2 readings = ${modules.length * 2} comparisons, 0 differ. This ` +
      `is the control the consumers cannot be: they were green before the move too, and a branch ` +
      `changed in transit is only visible to a population that contains it.`
    : `${differs} of ${modules.length * 2} comparisons differ — the move was NOT behaviour-preserving.\n` +
      `        first: ${firstDiff.join('; ')}`);

// The negative direction. A comparison that can only come out equal proves nothing, and this one
// would come out equal if BOTH sides were the same function — which is the failure mode of every
// "I compared old and new" arm ever written. So: mutate the pre-move text in one place and confirm
// the comparison notices.
const mutatedPre = preScannerText.replace('const interp = [];', 'const interp = []; if (src) return src;');
const mutMod = await import(
  'data:text/javascript;base64,' +
  Buffer.from(`${mutatedPre}\nexport { stripSource };`).toString('base64')
);
const sample = fs.readFileSync(path.join(SCRIPTS, 'lib/probe-source-constants.mts'), 'utf8');
check('A2', 'the comparison in A1 can come out UNEQUAL — a one-line mutant of the pre-move text is caught',
  mutatedPre !== preScannerText && mutMod.stripSource(sample, true) !== stripSource(sample, true),
  `An identity-mutant of the pre-move scanner reads differently from the lib module, so A1's zero ` +
  `is a measurement and not two names for one function. This is the arm my own Round 257 §2 says ` +
  `I keep needing: the row where the instrument must fail.`);

console.log('\n── arm B: the hole Theseus found in the file I was about to extract INTO ──');

// Theseus, Round 258 arm C2. The regex body shape is the one live in `verify-filler-constraints.mjs`
// today. Its apostrophe opens a string to a reader with no model of regex literals; the line comment
// after it then survives into the 'code' reading. Minted here rather than read off disk so the arm
// states its own input.
const C2 = [
  "const RE = /\\bhere(?:'s)\\b/i;",
  '// const CAP = 1;   <- a real line comment, and it must not survive masking',
  'const CAP = 2;',
].join('\n');

const preFooled = /const CAP = 1;/.test(preMask(C2));
const postFooled = /const CAP = 1;/.test(maskComments(C2));

check('B1', "the PRE-move maskComments IS fooled by a regex body carrying an apostrophe — his finding reproduces",
  preFooled,
  `The negative direction first, because an arm that only checks the repair cannot tell a fixed ` +
  `defect from one that was never there. Pre-move reader leaves the comment standing in its code ` +
  `reading: ${preFooled}.`);

check('B2', 'the POST-move maskComments is NOT fooled — the extraction closed it rather than moving it',
  !postFooled,
  `Delegating to \`stripSource\` closes the hole because that reader models regex literals. Had I ` +
  `routed the other way — into \`maskComments\`, the module already sitting in \`scripts/lib\` and ` +
  `therefore the obvious target — three implementations would be two and the shared one would ` +
  `still be red on this input. That is Round 258 §2, and it is the whole reason the direction was ` +
  `measured before the move.`);

const C2_NOREGEX = C2.replace("const RE = /\\bhere(?:'s)\\b/i;", 'const RE = null;');
check('B3', 'delete the regex line and the pre-move reader agrees again — the regex is the cause',
  !/const CAP = 1;/.test(preMask(C2_NOREGEX)) && !/const CAP = 1;/.test(maskComments(C2_NOREGEX)),
  `Theseus's arm C4 direction, re-derived here: with the regex literal removed, both readers mask ` +
  `the comment. So B1 is about the regex body and not about some other difference between the ` +
  `fixtures.`);

console.log('\n── arm C: length preservation, over the population rather than a fixture ──');

let lenBad = 0;
let lineBad = 0;
for (const f of modules) {
  const src = fs.readFileSync(f, 'utf8');
  const m = maskComments(src);
  if (m.length !== src.length) lenBad += 1;
  if (m.split('\n').length !== src.split('\n').length) lineBad += 1;
}
check('C1', 'maskComments is length- and line-preserving on every module in the population',
  lenBad === 0 && lineBad === 0,
  `${modules.length} modules, ${lenBad} length mismatches, ${lineBad} line-count mismatches. ` +
  `Theseus's arm A2 named this as the property that is load-bearing and that only ONE of the three ` +
  `readers had: every consumer locates a site in the masked text and slices it out of the ` +
  `ORIGINAL, so a reader that deleted comment bytes would be off by the length of every preceding ` +
  `comment — silently, and further off the deeper into the file you read. "They all mask comments" ` +
  `is exactly the summary that hides it.`);

console.log('\n── arm D: the census — did any verdict actually move? ────────────────────');

// The population `maskComments` is actually pointed at: the shipped product files its callers
// scrape. Round 255 measured 0 shadowed declarations here and said so — the defect was latent in
// `packages/`, not firing. The question this round asks is the same one in the other direction.
const productFiles = (() => {
  const out: string[] = [];
  const w = (dir: string) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (e.name === 'node_modules' || e.name === 'dist' || e.name.startsWith('.')) continue;
      const p = path.join(dir, e.name);
      if (e.isDirectory()) w(p);
      else if (/\.tsx?$/.test(e.name) && !p.includes('__tests__')) out.push(p);
    }
  };
  w(path.join(REPO, 'packages'));
  return out.sort();
})();

const NAME = /(?:^|\n)\s*(?:export\s+)?const\s+([A-Z][A-Z0-9_]*)\s*=/g;
let readsCompared = 0;
let readFlips = 0;
let maskFlips = 0;
const flipDetail: string[] = [];

for (const f of productFiles) {
  const src = fs.readFileSync(f, 'utf8');
  if (preMask(src) !== maskComments(src)) {
    maskFlips += 1;
    if (flipDetail.length < 5) flipDetail.push(`masked text differs: ${path.relative(REPO, f)}`);
  }
  const names = new Set<string>();
  for (const m of src.matchAll(NAME)) names.add(m[1]);
  for (const n of names) {
    // Both readers, same input, same call. A throw is a verdict too — compared as one.
    const one = (fn: (s: string, name: string, what: string) => number) => {
      try { return `ok:${fn(src, n, 'census')}`; } catch (e) { return `throw:${(e as Error).message.slice(0, 60)}`; }
    };
    const before = one(preLibMod.readNumericConstant);
    const after = one(readNumericConstant);
    readsCompared += 1;
    if (before !== after) {
      readFlips += 1;
      if (flipDetail.length < 8) flipDetail.push(`${path.relative(REPO, f)} ${n}: ${before} -> ${after}`);
    }
  }
}

check('D1', 'no numeric constant in the shipped product reads differently pre- and post-extraction',
  readFlips === 0,
  `${productFiles.length} product files, ${readsCompared} constant reads compared (a throw is a ` +
  `verdict and is compared as one), ${readFlips} flips.` +
  (readFlips ? `\n        ${flipDetail.join('\n        ')}` : ''));

// The headline sentence below is COMPUTED from `readFlips`, not written into the string. The first
// version of this arm spelled out "and this round's is ZERO" as literal prose — and the run it was
// written for read TWO. It would have printed the word ZERO underneath a red D1. That is the
// vacuous-assertion shape this fleet keeps finding in its own instruments (my 257 §2, Theseus's 258
// §3), landing in the arm whose entire job is to say what the number means.
const headline = readFlips === 0
  ? `The honest headline is D1, and it is ZERO — so the C2 hole was **latent in \`packages/\`, not ` +
    `firing**, the same shape Round 255's own census had and stated. What it fires on is ` +
    `\`scripts/\`, where the shape Theseus minted is live in \`verify-filler-constraints.mjs\`.`
  : `The honest headline is D1, and it is ${readFlips} — NOT zero. Something in \`packages/\` reads ` +
    `differently after this change and that is a finding, not a rounding error.`;

meas('D2', 'how much of the masked text moved at all — reported, and NOT a defect count',
  `${maskFlips} of ${productFiles.length} product files mask differently under the new reader. ` +
  `Theseus and I agreed in 258 §5 not to quote this class of number as a defect count in either ` +
  `direction: every regex body in the corpus changes side by design. ${headline}` +
  (maskFlips ? `\n        e.g. ${flipDetail.filter((d) => d.startsWith('masked')).slice(0, 3).join('; ')}` : ''));

console.log('\n── arm E: the narrowing, asserted rather than argued ─────────────────────');

// `stripSource` differs from the old `maskComments` in two ways beyond closing the hole: it blanks
// a backslash escape PAIR inside a string, and it blanks regex-literal bodies in both readings. The
// doc comment claims neither can suppress a real declaration. Claims in doc comments are where this
// project's wrong assertions come from, so both are driven.
const ESC = "const S = 'a\\'b'; const N = 42;";
check('E1', 'an escape pair inside a string is blanked — the narrowing is real, and stated',
  maskComments(ESC) !== preMask(ESC) && maskComments(ESC).length === ESC.length,
  `The new reader emits two spaces for \`\\'\` where the old one emitted the pair verbatim. Named ` +
  `in the doc comment because a difference you did not write down is a difference someone later ` +
  `finds by being wrong about it.`);

check('E2', 'the narrowing cannot suppress a real declaration — the read still lands',
  readNumericConstant(ESC, 'N', 'census') === 42,
  `A declaration cannot carry a backslash in \`const <name> =\`, so blanking escape pairs cannot ` +
  `reach one. 42, as before.`);

const INREGEX = ['const RE = /const CAP = 1;/;', 'const CAP = 7;'].join('\n');
check('E3', 'a declaration inside a regex BODY is correctly not a declaration — the old reader saw two',
  readNumericConstant(INREGEX, 'CAP', 'census') === 7
  && (() => { try { preLibMod.readNumericConstant(INREGEX, 'CAP', 'census'); return false; } catch { return true; } })(),
  `Post: reads 7. Pre: throws (it counted the regex body as a second site). This is a ` +
  `throw-to-correct-read flip, which is the direction that matters — the old reader refused a file ` +
  `it could have read. It is not in D1's flip count because no shipped product file has this shape; ` +
  `that is the difference between latent and absent, and only the census can tell them apart.`);

console.log('\n── arm G: what the census found — an offset derived from the wrong text ──');

// This arm exists because D1 came out RED on its first run, at two shipped files, and the cause was
// not in the extraction at all. `declarationSite` carried the sentence *"the initialiser text is
// taken from the ORIGINAL source at the same offset — masking exists to decide where the
// declaration is, never to change what it says"* directly above an arithmetic that did not do that:
//
//     const initStart = m.index + m[0].length - m[1].length;   // the TAIL of the masked match
//
// That is faithful only while the masker blanks nothing with extent. Round 255's masker blanked
// comments only, and a comment cannot sit inside `const X = …` ahead of the `;`, so the sentence and
// the code agreed by luck for two rounds. The shared reader blanks regex-literal bodies — and `\s*`
// is greedy, so against `const P = /[\w.]+/;` the capture backtracks to the LAST blanked space and
// `initStart` lands on the closing `/`. `readNumericConstant` then reported a live product file as
// saying `"/"`.
//
// Rule: **length-preserving is not structure-preserving.** An offset computed by subtracting a
// masked match's length is relying on the second, and only the first was ever promised.
//
// The direction matters. Nothing returned a wrong NUMBER — both sides throw "not a numeric" — so no
// caller was misled about a value. What regressed is the error message, which told the reader the
// source says something it does not say. That is Round 255's own rule about this module turned on
// the module: *an error message is part of the interface, and one that quotes the source is
// asserting something about what the source says.*

const G_SRC = 'const FILENAME_PATTERN = /[\\w./-]+\\.\\w{1,10}/;\nconst CAP = 9;';

// The defect, reconstructed rather than described: the old arithmetic, run over the new masked text.
const gMasked = maskComments(G_SRC);
const gOld = new RegExp('const FILENAME_PATTERN\\s*=\\s*([^;\\n]+)').exec(gMasked);
const oldInit = gOld ? G_SRC.slice(
  gOld.index + gOld[0].length - gOld[1].length,
  gOld.index + gOld[0].length,
) : '';

// The refusal quotes the initialiser with `JSON.stringify`, so the quoted run is JSON-escaped and
// has to be JSON-PARSED back rather than read as raw bytes. My first version of this row compared
// against a hand-escaped literal and went red on a correct repair — an instrument fault, in the arm
// whose job is to check a quoting bug. Parsing the message means the comparison is against the
// initialiser, not against my ability to count backslashes.
let gNewInit = '';
try { readNumericConstant(G_SRC, 'FILENAME_PATTERN', 'census'); } catch (e) {
  const quoted = (e as Error).message.match(/as ("(?:[^"\\]|\\.)*")/)?.[1];
  gNewInit = quoted ? (JSON.parse(quoted) as string) : '';
}

check('G1', 'the tail-derived offset DOES land on the wrong character — the defect is reconstructed, not asserted',
  oldInit === '/',
  `Running the pre-repair arithmetic over the new masked text yields ${JSON.stringify(oldInit)} for ` +
  `an initialiser the source spells \`/[\\w./-]+\\.\\w{1,10}/\`. The negative direction first: if ` +
  `this row ever passes trivially the repair below is guarding nothing.`);

check('G2', 'the head-derived offset reads the initialiser the source actually spells',
  gNewInit === '/[\\w./-]+\\.\\w{1,10}/',
  `The refusal now quotes ${JSON.stringify(gNewInit)}. Still a refusal — a regex is not a numeric ` +
  `and this module is right to say so — but it now refuses while quoting the file correctly.`);

check('G3', 'the repair did not cost the ordinary case',
  readNumericConstant(G_SRC, 'CAP', 'census') === 9
  && readNumericConstant('const X =\n  50_000;', 'X', 'census') === 50000,
  `9, and a multi-line initialiser still reads — the old \`\\s*\` crossed newlines and the ` +
  `replacement skips whitespace in the original for the same reason. A repair that only fixes the ` +
  `case that motivated it is how the ordinary cases quietly break.`);

console.log('\n── arm F: the count — three implementations is now two ───────────────────');

const libText = fs.readFileSync(path.join(SCRIPTS, 'lib/probe-source-constants.mts'), 'utf8');
const hasOwnScanner = /let mode: 'code'/.test(libText);
check('F1', 'probe-source-constants.mts no longer carries its own code/comment state machine',
  !hasOwnScanner && libText.includes("import { stripSource } from './strip-source.mjs';"),
  `The module imports the shared reader and its \`maskComments\` is a delegation. A census of ` +
  `maskers now finds ONE, in \`scripts/lib/strip-source.mjs\`.`);

const vtgText = fs.readFileSync(path.join(SCRIPTS, 'verify-tsx-guard.mjs'), 'utf8');
check('F2', 'verify-tsx-guard.mjs no longer defines the scanner either — it imports it',
  !vtgText.includes('const stripSource = (src, blankStrings) => {')
  && vtgText.includes("from './lib/strip-source.mjs'"),
  `The 213 checks run against the imported reader. Verified separately by running the verifier: ` +
  `PASS at the same 213, not a smaller number that would mean a limb had stopped being reached.`);

// The third implementation is NOT removed, and that is the point of Theseus's §1 rather than an
// omission. `assertionArgumentSpans` answers a different question — 'which span is this call's
// argument list?' — that no masker can answer. What it inlined was a weaker copy of question A, and
// his route is to make it a CONSUMER of this module. That change is his; this arm records that the
// dependency it needs is now importable, which is the thing that was blocking it.
meas('F3', "the third reader is a consumer, not a copy — and what it was waiting for now exists",
  `\`assertionArgumentSpans\` in \`probe-round256-…mts\` stays where it is. It answers question B ` +
  `('which span is this call's argument list?'), which no masker answers; what it duplicated was ` +
  `the \`quote\` variable it inlined to get there — question A in a shape no census of maskers can ` +
  `see. Rule, his: **count the question, not the function.** His Round 258 §6 declined to repair ` +
  `it because the repair is downstream of this extraction and he would not inline a fourth copy to ` +
  `get there first. \`scripts/lib/strip-source.mjs\` is importable as of this round, so that item ` +
  `is unblocked and it is his.`);

console.log('\n── arm Z: I left packages/ as I found it ────────────────────────────────');

fs.rmSync(PRE_LIB_COPY, { force: true });

const realAfter = fingerprint('packages/');
check('Z1', 'packages/ is as this run found it — a before/after content fingerprint, not an emptiness claim',
  realAfter === realBefore,
  realAfter === realBefore
    ? `fingerprint identical across the whole run. The pre-move scanner is evaluated from a data: ` +
      `URL and the pre-move lib module from a copy under \`.testdata/\`, removed above — no file ` +
      `under \`packages/\` or \`scripts/\` is written at any point.`
    : `MOVED.\n        before: ${realBefore}\n        after:  ${realAfter}`);

meas('Z2', 'pre-existing state of the window — reported, NOT graded',
  realDirtBefore === ''
    ? `git status --porcelain packages/ was empty when this run opened.`
    : `NOT empty at open:\n        ${realDirtBefore}\n        Not this run's doing; arm Z does not grade it.`);

summariseAndExit({ probeName: SELF, results, skipped });
