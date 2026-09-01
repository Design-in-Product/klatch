/**
 * probe-import-sites.mjs — Round 133, Daedalus.
 *
 * A candidate **fourth limb** for `verify-tsx-guard.mjs`'s read-only population, built as a
 * measurement instrument rather than shipped. Run it:
 *
 *     node scripts/probe-import-sites.mjs
 *
 * ## Why this exists
 *
 * Round 129 §5 found that the read-only modules under `scripts/` — the ones outside the `verify-*`
 * convention, which §(b2) and §(c) may not execute — have exactly one limb: `importsGuardSource`,
 * a source reading. It asked whether a fourth limb was available "at acceptable cost", and framed
 * it as an *import-only load*: execute the module graph, not the probe's main.
 *
 * That framing was the obstacle, and it was the wrong one. The cost that made a run limb look
 * infeasible is execution cost, and execution is not needed. Nothing here runs any target.
 *
 * ## Three independences from §(b), each deliberate
 *
 *  1. **Sites come from a real parser** (`typescript`, already a devDependency of this repo), not
 *     from `stripSource`. Rounds 131 and 132 found that hand-rolled scanner desynchronised on four
 *     live files at once; a scanner desync cannot hide a site from a parser. This independence is
 *     structural — no shared code — rather than demonstrated by a mutant.
 *  2. **"Is this a TypeScript import" is asked of the filesystem**, not of an enumeration of
 *     extension spellings. §(b)'s anchor requires a TypeScript extension *in the specifier text*;
 *     TypeScript ESM writes an import of a `.ts` sibling as `./x.js`, so a real wrong-runner import
 *     spelled that way is not an anchor at all. Measured: that shape was live in
 *     `probe-expand-continuation.mts` and crashed raw under plain `node` while the instrument
 *     reported `PASS — all 185 checks passed`. Repaired in the same round; the check remains,
 *     because the *reason* it was invisible has not been repaired.
 *  3. **Non-literal specifiers are sites, not absences.** Round 125's residual shapes 1 (a computed
 *     specifier) and 2 (a literal bound to a variable first) are invisible to §(b) — shape 2 does
 *     not even reach the unclassified bucket, which is keyed on the *broad* reading rather than on
 *     being an anchor. A parser sees `import(<anything>)` and can report the position even when it
 *     cannot report the value.
 *
 * ## What it does not do
 *
 * It is a **reading**, not a run. It cannot see a guard that is present in the source and disarmed
 * at runtime — the M19 class, which is exactly what §(c) exists for. The read-only population still
 * has no behavioural limb and this does not give it one; it gives it a second, independent reading
 * whose failure modes do not overlap the first one's.
 *
 * Two things must be settled before any of this is shipped into `verify-tsx-guard.mjs`, and neither
 * is settled here:
 *
 *  - `ts.createSourceFile` does not throw on malformed input; it returns a tree with `parseDiagnostics`
 *    set. A limb that silently degrades to "no sites found" on a parse failure is the same class of
 *    defect as everything else in this thread, so it needs a precondition that asserts the parse was
 *    clean, plus a positive control that the site-finder still recognises a real site.
 *  - It would be the first third-party import in `verify-tsx-guard.mjs`, whose whole subject is
 *    instruments that misreport. That is a real change in the instrument's dependency surface and
 *    belongs to a round that argues it, not to the round that found the reason for it.
 *
 * Zero API calls, zero model calls, zero corpus runs. Reads source; executes nothing.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(path.join(REPO, 'package.json'));
const ts = require('typescript');

const SCRIPTS = path.join(REPO, 'scripts');
const walk = (dir, base = '') => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
  const rel = base ? `${base}/${e.name}` : e.name;
  return e.isDirectory() ? walk(path.join(dir, e.name), rel) : [rel];
});
// Same population as §(b)'s `readable`, same self-exclusion, for the same reason: this file and
// `verify-tsx-guard.mjs` both quote specifiers as data.
const SELF = path.relative(SCRIPTS, fileURLToPath(import.meta.url)).split(path.sep).join('/');
const readable = walk(SCRIPTS)
  .filter((r) => /\.m[jt]s$/.test(r))
  .filter((r) => r !== 'verify-tsx-guard.mjs' && r !== SELF)
  .sort();

const TS_EXT = ['.ts', '.tsx', '.mts', '.cts'];

// A specifier is a wrong-runner import if what it lands on is TypeScript source. Two ways that
// happens, and the second is the one §(b)'s anchor cannot express:
//
//   - it lands directly on a `.ts`/`.tsx`/`.mts`/`.cts` file — the spelling §(b) already sees;
//   - it lands nowhere, but a TypeScript sibling of the same stem exists — the `.js` spelling.
//
// Note the first cut of this asked only `existsSync(abs)` and called any hit "resolves". That was
// wrong and the measurement said so immediately: `../x.ts` exists on disk, so every known-guarded
// site came back clean and the limb was reporting nothing about the four files §(c) certifies.
// Existence is not loadability under plain node.
const classifySpecifier = (spec, fromFile) => {
  if (!spec.startsWith('.')) return 'bare';               // node_modules — not this instrument's subject
  const abs = path.resolve(path.dirname(fromFile), spec);
  if (fs.existsSync(abs)) return TS_EXT.includes(path.extname(abs)) ? 'typescript' : 'resolves';
  const stem = abs.replace(/\.[cm]?[jt]sx?$/, '');
  for (const e of TS_EXT) if (fs.existsSync(stem + e)) return 'typescript';
  return 'missing';                                        // resolves under neither runner
};

// Guarded = the site is lexically inside a `try` block whose `catch` clause calls
// `explainTsxRequirement`. Ancestry, not proximity: `importsGuardSource` asks whether the file
// mentions the guard anywhere, which is why Round 129 needed conjuncts to keep prose out.
const guardsThis = (node) => {
  for (let n = node.parent; n; n = n.parent) {
    if (ts.isTryStatement(n) && n.catchClause) {
      let calls = false;
      const visit = (c) => {
        if (ts.isCallExpression(c) && ts.isIdentifier(c.expression)
            && c.expression.text === 'explainTsxRequirement') calls = true;
        ts.forEachChild(c, visit);
      };
      visit(n.catchClause);
      if (calls) return true;
    }
  }
  return false;
};

const rows = [];
let parseErrors = 0;
for (const rel of readable) {
  const abs = path.join(SCRIPTS, rel);
  const src = fs.readFileSync(abs, 'utf8');
  const sf = ts.createSourceFile(abs, src, ts.ScriptTarget.Latest, /* setParentNodes */ true,
    rel.endsWith('.mts') ? ts.ScriptKind.TS : ts.ScriptKind.JS);
  // Stated rather than assumed — see the docblock. Reported, not yet asserted.
  if (sf.parseDiagnostics && sf.parseDiagnostics.length > 0) {
    parseErrors += 1;
    console.log(`  PARSE     ${rel}  (${sf.parseDiagnostics.length} diagnostic(s) — sites below may be incomplete)`);
  }
  const visit = (n) => {
    if (ts.isCallExpression(n) && n.expression.kind === ts.SyntaxKind.ImportKeyword) {
      const arg = n.arguments[0];
      const literal = arg && ts.isStringLiteral(arg) ? arg.text : null;
      rows.push({
        rel,
        line: sf.getLineAndCharacterOfPosition(n.getStart(sf)).line + 1,
        spec: literal,
        kind: literal === null ? 'non-literal' : classifySpecifier(literal, abs),
        guarded: guardsThis(n),
      });
    }
    ts.forEachChild(n, visit);
  };
  visit(sf);
}

const verdictOf = (r) =>
  r.kind === 'typescript' ? (r.guarded ? 'guarded' : 'UNGUARDED')
    : r.kind === 'non-literal' ? (r.guarded ? 'unreadable/guarded' : 'UNREADABLE')
      : r.kind;

console.log(`\n${readable.length} modules parsed, ${rows.length} dynamic-import sites, ${parseErrors} with parse diagnostics\n`);
for (const r of rows) {
  console.log(`  ${verdictOf(r).padEnd(18)} ${r.rel}:${r.line}  ${r.spec ?? '<computed>'}`);
}

const named = rows.filter((r) => ['UNGUARDED', 'UNREADABLE', 'missing'].includes(verdictOf(r)));
console.log(`\n${named.length} site(s) a fourth limb would name:`);
for (const r of named) console.log(`  ${r.rel}:${r.line}  ${r.spec ?? '<computed>'}  (${r.kind})`);
process.exit(named.length === 0 ? 0 : 1);
