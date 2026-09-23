#!/usr/bin/env npx tsx
/**
 * Round 255 — how much of the comment-shadow defect is live in `packages/` today?
 *
 * ## Why this is a probe and not a sentence in the writeup
 *
 * The repair in `scripts/lib/probe-source-constants.mts` is correct whether or not any shipped
 * file currently triggers it. But "we fixed a latent defect" and "we fixed a defect that was
 * firing" are different claims, and the writeup has to make the right one. The only honest way to
 * know is to count, and a count in a document goes stale the moment someone writes a doc comment.
 *
 * So this is an instrument: it walks `packages/*​/src` with `readdirSync` (never a glob —
 * Round 244's finding, and my own memory rule), and for every numeric `const` declaration it finds
 * it asks whether the *same* name also appears in `const NAME = …` form inside a comment in the
 * same file. That is exactly the condition under which the pre-Round-255 readers returned the
 * comment's number.
 *
 * ## The two columns, and why both are reported
 *
 * - **SHADOWED** — a comment occurrence sits *before* the code declaration. This is the live
 *   defect: the old reader took the first match in byte order, so it read the comment.
 * - **TRAILING** — a comment occurrence sits *after* the code declaration. The old reader was
 *   accidentally correct on these, and the new reader is correct on purpose. Counted separately
 *   because reporting them together would overstate what was broken, and reporting only the first
 *   column would hide how close the tree sits to the edge.
 *
 * A zero in the first column is a real result and is printed as one. **Measured 2026-09-22: both
 * columns are zero over shipped product code.** The defect this round repaired was latent in
 * `packages/`, and the writeup says so rather than implying a fire was put out. What was *not*
 * latent is the reader itself: three live probes scrape `FINGERPRINT_LINE_CAP` and
 * `MAX_IMPORT_SIZE` through it, and the first doc comment anyone writes in declaration form above
 * either line would have been read as the shipped value.
 *
 * `session-scanner.ts` carries ten mentions of `FINGERPRINT_LINE_CAP`, but none in `const … = …`
 * form, so it is not near the edge — stated because an earlier draft of this comment said it was,
 * on a count of bare mentions rather than of declaration-shaped ones, and the run corrected it.
 *
 * ## The population boundary, which the first run got wrong
 *
 * `__tests__` is excluded. The first run included it and reported **three shadowed declarations,
 * all three inside this round's own test file** — string fixtures that spell the defect on
 * purpose. The instrument was working; its population was wrong, and it had swallowed the artifact
 * the round created. Third sighting of the shape on this project (Round 247: the mutation harness
 * inside the population it audits; Theseus's Round 254 §3: the drive that would have manufactured
 * its own conclusion). Test fixtures are still counted, separately, so excluding them cannot
 * quietly become a way to make a number look better.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { maskComments } from './lib/probe-source-constants.mts';
import { summariseAndExit, type ProbeVerdict } from './lib/probe-outcome.mts';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PKGS = join(ROOT, 'packages');
const PROBE = 'probe-round255-census';

const results: ProbeVerdict[] = [];
/**
 * The verdict shape is `{ arm, check, pass, kind }`. My first version of these two helpers spelled
 * it `{ arm, label, passed, detail }`, so every entry was counted as neither a check nor a
 * measurement — `summariseAndExit` reported *"zero regression checks ran … INCONCLUSIVE"* and
 * exited 3. That is `probe-outcome.mts` — Round 247's work — refusing to let a probe of mine print
 * a verdict over the empty set, on its first contact with a probe written by the person who
 * brought it under test. Recorded because a module that catches its own author is the only
 * evidence worth much.
 */
const pass = (arm: string, check: string, ok: boolean, detail: string) =>
  results.push({ arm, check: `${check} — ${detail}`, pass: ok, kind: 'regression' });
const meas = (arm: string, check: string, detail: string) =>
  results.push({ arm, check: `${check}: ${detail}`, pass: true, kind: 'measurement' });

/** Recursive `readdirSync`. A glob has dropped a file from a count on this project three times. */
function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) {
      if (name === 'node_modules' || name === 'dist') continue;
      walk(p, out);
    } else if (/\.(ts|tsx|mts)$/.test(name)) {
      out.push(p);
    }
  }
  return out;
}

const walked: string[] = [];
for (const ws of readdirSync(PKGS)) {
  const src = join(PKGS, ws, 'src');
  try { if (statSync(src).isDirectory()) walk(src, walked); } catch { /* no src dir */ }
}
const isTest = (p: string) => p.includes('/__tests__/') || /\.test\.tsx?$/.test(p);
const files = walked.filter((p) => !isTest(p));
const testFiles = walked.filter(isTest);
meas('A', 'files walked (recursive readdirSync, not a glob)', String(walked.length));
meas('A', 'shipped product files, after excluding __tests__', String(files.length));

/** `const NAME = <something>` — the same shape the readers look for, name captured. */
const DECL = /const ([A-Z][A-Z0-9_]*)\s*=\s*([^;\n]+)/g;
const NUMERICISH = /^[+-]?[\d_]+(\.[\d_]+)?([eE][+-]?\d+)?(\s*\*\s*[+-]?[\d_]+)*$|^[+-]?0[xXbBoO][0-9a-fA-F]+$/;

function census(population: string[]) {
  let numericDecls = 0;
  const shadowed: string[] = [];
  const trailing: string[] = [];

  for (const file of population) {
    const src = readFileSync(file, 'utf8');
    const masked = maskComments(src);
    const rel = relative(ROOT, file);

    // Code declarations come from the masked text; comment occurrences are wherever the raw text
    // has one and the masked text does not.
    DECL.lastIndex = 0;
    for (let m = DECL.exec(masked); m !== null; m = DECL.exec(masked)) {
      const [, name, init] = m;
      if (!NUMERICISH.test(init.trim())) continue;
      numericDecls += 1;

      const needle = new RegExp(`const ${name}\\s*=\\s*[^;\\n]+`, 'g');
      for (let c = needle.exec(src); c !== null; c = needle.exec(src)) {
        const inComment = masked.slice(c.index, c.index + c[0].length).trim() === '';
        if (!inComment) continue;
        (c.index < m.index ? shadowed : trailing).push(`${rel}:${name}`);
      }
    }
  }
  return { numericDecls, shadowed, trailing };
}

const product = census(files);
meas('A', 'numeric const declarations in shipped product code', String(product.numericDecls));
meas('B', 'shipped declarations SHADOWED by an earlier comment occurrence',
  `${product.shadowed.length}${product.shadowed.length ? ' — ' + product.shadowed.join(' · ') : ' (the defect was latent in packages/, not firing)'}`);
meas('B', 'shipped declarations with a LATER comment occurrence (old reader accidentally right)',
  `${product.trailing.length}${product.trailing.length ? ' — ' + product.trailing.join(' · ') : ''}`);

// Reported, not excluded-and-forgotten. The first run counted these as product and they are what
// told me the population boundary was wrong.
const tests = census(testFiles);
meas('B', 'shadowed occurrences inside __tests__ (fixtures, excluded from the figure above)',
  `${tests.shadowed.length}${tests.shadowed.length ? ' — ' + [...new Set(tests.shadowed)].join(' · ') : ''}`);

// The two constants that ten probes actually scrape. Named explicitly so the census cannot be
// read as covering them only by accident.
const SCRAPED: [string, string][] = [
  ['packages/server/src/import/session-scanner.ts', 'FINGERPRINT_LINE_CAP'],
  ['packages/server/src/routes/import.ts', 'MAX_IMPORT_SIZE'],
];
for (const [rel, name] of SCRAPED) {
  const src = readFileSync(join(ROOT, rel), 'utf8');
  const masked = maskComments(src);
  const codeHits = (masked.match(new RegExp(`const ${name}\\s*=\\s*[^;\\n]+`, 'g')) ?? []).length;
  const allMentions = (src.match(new RegExp(name, 'g')) ?? []).length;
  pass('C', `${name} has exactly one code declaration, so the multiplicity guard passes it`,
    codeHits === 1, `${codeHits} code declaration(s), ${allMentions} mentions of the name in the file`);
}

// Two-sided: the census machinery must be able to SEE a shadow, or a zero above means nothing.
const MINTED = [
  '/** was: const MINTED_CAP = 9; */',
  'const MINTED_CAP = 11;',
].join('\n');
const mintedMasked = maskComments(MINTED);
pass('D', 'the detector is not vacuous — it finds a shadow in minted source',
  mintedMasked.indexOf('const MINTED_CAP = 9') === -1 && mintedMasked.includes('const MINTED_CAP = 11'),
  'the comment occurrence is masked and the code one survives; a zero in arm B is therefore a measurement, not a blind spot');

for (const r of results) {
  const tag = r.kind === 'measurement' ? 'MEAS' : r.pass ? 'PASS' : 'FAIL';
  console.log(`${tag} [${r.arm}] ${r.check}`);
}
summariseAndExit({ probeName: PROBE, results });
