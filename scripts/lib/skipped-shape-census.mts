/**
 * Round 362 — the live-caller shape census for `summarise`'s `skipped` argument.
 *
 * Why this exists, and why it is a census rather than a guard in `probe-outcome.mts`:
 *
 * Daedalus handed over one crash in Round 361 — `summarise({skipped: [null]})` dies at `kindOf`
 * with `Cannot read properties of null`, the Round 358/359 hatch shape one field over. Rather than
 * cure the field, Round 362 censused the whole crash surface (11 hostile values × 15 field paths =
 * 165 cells) and found **33 throwing cells across 5 paths**: `input` itself (11), `results` (10),
 * `results[0]` (2), `skipped` (8), `skipped[0]` (2). `inapplicable`, `inapplicable[0]`,
 * `regressionKind`, `results[0].kind`, `skipped[0].kind` and `skipped[0].label` have none — those
 * are the fields Rounds 357, 358 and 359 cured.
 *
 * The honest outcome for the remaining 22 cells on `results`/`skipped` is a **declared
 * measurement**, not a cure, for two driven reasons:
 *
 *   1. **No live caller can reach them.** That is what this file measures.
 *   2. **The crash is in the safe direction.** Driven as a subprocess: a throwing
 *      `summariseAndExit` exits **1** with **0 bytes on stdout** — no headline, no `REGRESSIONS:`
 *      block, and in particular never the word "passed". The sweep reads exit 1 as a red. Contrast
 *      Round 355's class, where the defect was an exit 0 *claiming* a pass.
 *
 * Reason 1 is the one that can stop being true. So it is pinned here, in both directions, by
 * `probe-round224` arm Q: add a caller whose `skipped` is a conditional, a call, or a re-assigned
 * variable, and the arm goes red and names the file. The prose above is not load-bearing alone.
 *
 * Not a probe: no conclusion line, nothing for the sweep to pick up. It is an instrument arm Q
 * drives, factored out per Daedalus's Round 361 note that the next round's arm should import the
 * instrument rather than re-derive it.
 */
import fs from 'node:fs';
import path from 'node:path';
import { stripSource } from './strip-source.mjs';

/**
 * Round 363 — the `SKIP_VAR_NAMES` constant that stood here is GONE, and that is a correction
 * rather than a tidy-up.
 *
 * Its docblock read: *"the identifier names observed to feed a `skipped` argument. Measured, not
 * assumed — any name outside this set shows up as an `unknown-identifier` site and reddens arm
 * Q."* Neither half was true of the code beside it. Nothing read the constant — `grep -rn
 * SKIP_VAR_NAMES scripts/` returned its own declaration and its own docblock, and no third line —
 * and there is no `unknown-identifier` member of {@link SkippedSite.kind} for a site to be
 * reported as. The real protection against an unexpected feeding name is `boundAs: 'unbound'`,
 * which arm Q's Q3 does count.
 *
 * Kept as a note rather than deleted silently because it is the same object as Round 361's
 * finding and Round 362's §1: **a prose claim about a mechanism, authored in the commit that
 * built the mechanism, and graded by nothing.** A dead export whose comment describes a check
 * that does not exist reads, to the next round, exactly like a check that exists.
 */

export type SkippedSite = {
  file: string;
  line: number;
  /** `literal-array` and `identifier` are the two safe shapes; everything else can be a non-array. */
  kind: 'literal-array' | 'identifier' | 'conditional' | 'call' | 'spread' | 'other';
  /** The identifier name for an `identifier` site, else ''. */
  name: string;
  /**
   * How the identifier is bound. `param` is the shape that matters: `probe-round224` has two sites
   * where `skipped_` is a FUNCTION PARAMETER of the control's own driver, declared `unknown[]` and
   * fed hostile values on purpose. Those are fixtures, not live callers, and a cell asserting
   * "every feeding variable is an array-initialised local" is false of them for the right reason.
   * Classified by rule rather than excused by name, so a new parameter-fed site is still visible.
   */
  boundAs: 'local' | 'param' | 'unbound' | 'n/a';
  rhs: string;
};

export type PushSite = {
  file: string;
  line: number;
  /** `literal` covers a string, template or object literal, or a ternary between two of those. */
  kind: 'literal' | 'other';
  arg: string;
};

export type DeclSite = {
  file: string;
  line: number;
  name: string;
  /** True when the initialiser is an array literal. */
  arrayInit: boolean;
  /** Assignments to the name other than its declaration. */
  reassignments: number;
  init: string;
};

const walk = (d: string, out: string[] = []): string[] => {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) { if (e.name !== 'node_modules') walk(p, out); } else out.push(p);
  }
  return out;
};

/** From the index of a call's `(`, the argument text, paren-balanced. `null` if unbalanced. */
const argsAt = (src: string, open: number): string | null => {
  let depth = 0;
  for (let j = open; j < src.length; j += 1) {
    const c = src[j];
    if (c === '(') depth += 1;
    else if (c === ')') { depth -= 1; if (depth === 0) return src.slice(open + 1, j); }
  }
  return null;
};

/**
 * The value of a top-level `key` in an object-literal text.
 *
 * Returns `'<shorthand>'` for the ES6 shorthand `{ ..., skipped }`. The first version of this
 * reader had no case for it and silently dropped **29 of 31** identifier sites — the commonest
 * live shape. A known positive caught it; reading could not have, because the absent case and the
 * absent-key case are the same `null`.
 */
const valueOf = (objText: string, key: string): string | null => {
  const short = new RegExp(`(^|[{,])\\s*${key}\\s*(,|$|\\})`);
  const sm = short.exec(objText);
  if (sm) {
    let d = 0;
    for (let k = 0; k < sm.index; k += 1) {
      const c = objText[k];
      if ('([{'.includes(c)) d += 1; else if (')]}'.includes(c)) d -= 1;
    }
    if (d <= 1) return '<shorthand>';
  }
  const re = new RegExp(`(^|[{,\\s])${key}\\s*:`, 'g');
  let m: RegExpExecArray | null;
  while ((m = re.exec(objText)) !== null) {
    const start = m.index + m[0].length;
    let depth = 0;
    for (let k = 0; k < start; k += 1) {
      const c = objText[k];
      if ('([{'.includes(c)) depth += 1; else if (')]}'.includes(c)) depth -= 1;
    }
    if (depth !== 1) continue;                       // a nested `skipped:` one level down
    let d = 0, out = '';
    for (let j = start; j < objText.length; j += 1) {
      const c = objText[j];
      if ('([{'.includes(c)) d += 1;
      else if (')]}'.includes(c)) { if (d === 0) break; d -= 1; }
      else if (c === ',' && d === 0) break;
      out += c;
    }
    return out.trim();
  }
  return null;
};

export const classifyRhs = (rhs: string): SkippedSite['kind'] => {
  if (rhs === '<shorthand>') return 'identifier';
  if (/^\[/.test(rhs)) return 'literal-array';
  if (/^[A-Za-z_$][\w$]*$/.test(rhs)) return 'identifier';
  if (/^\.\.\./.test(rhs)) return 'spread';
  let depth = 0;
  for (let k = 0; k < rhs.length; k += 1) {
    const c = rhs[k];
    if ('([{'.includes(c)) depth += 1;
    else if (')]}'.includes(c)) depth -= 1;
    else if (depth === 0 && (c === '?' || (c === '&' && rhs[k + 1] === '&') || (c === '|' && rhs[k + 1] === '|'))) {
      return 'conditional';
    }
  }
  if (/\)$/.test(rhs)) return 'call';
  return 'other';
};

/** A push argument is safe when it cannot evaluate to `null` or `undefined`. */
export const classifyPushArg = (arg: string): PushSite['kind'] => {
  const literal = (s: string) => /^[`'"{]/.test(s.trim());
  if (literal(arg)) return 'literal';
  // A ternary is safe when BOTH branches are literals. Split at the depth-0 `?` and `:`.
  let depth = 0, q = -1, colon = -1;
  for (let k = 0; k < arg.length; k += 1) {
    const c = arg[k];
    if ('([{'.includes(c)) depth += 1;
    else if (')]}'.includes(c)) depth -= 1;
    else if (depth === 0 && c === '?' && q === -1) q = k;
    else if (depth === 0 && c === ':' && q !== -1 && colon === -1) colon = k;
  }
  if (q !== -1 && colon !== -1
      && literal(arg.slice(q + 1, colon)) && literal(arg.slice(colon + 1))) return 'literal';
  return 'other';
};

export type Census = {
  files: number;
  sources: number;
  sites: SkippedSite[];
  pushes: PushSite[];
  decls: DeclSite[];
};

export type CensusOptions = {
  /**
   * The `SummariseInput` key whose argument shapes are censused — `'skipped'` for arm Q,
   * `'results'` for arm R. The key also selects which names count as *feeding* variables, so
   * pushes and declarations follow it without a second parameter.
   */
  argKey: string;
};

/**
 * Round 363 — the census, parameterised on the argument key.
 *
 * Theseus routed `results` over in Round 362 §7 as "a parameter change plus its own planted
 * counterfactual," and that is exactly what it was: this function is his Round 362 body with
 * `'skipped'` lifted to `opts.argKey`, and {@link censusSkippedShapes} is a one-line wrapper so
 * arm Q's call site and its pinned figures do not move. Re-aimed, not loosened — the parameter is
 * the only behavioural change, and arm Q's own cells grade that claim by continuing to pass on
 * byte-identical numbers.
 *
 * One thing the parameterisation exposed that the `skipped` instance could not: `results` is a
 * REQUIRED field, so its site population is an order of magnitude larger and contains shapes
 * `skipped` has none of. See arm R in `probe-round224` for the measured split — the answer is not
 * "0 unsafe sites", and that is the point of running it.
 */
export function censusArgumentShapes(scriptsDir: string, opts: CensusOptions): Census {
  const { argKey } = opts;
  const files = walk(scriptsDir);
  // Walked with readdirSync rather than grep: grep emits NO ROW for a NUL-carrying file, so a
  // grep-derived count fails SMALL, which is the direction that hides a caller.
  const sources = files.filter((f) => /\.(mts|mjs|ts)$/.test(f));
  const rel = (f: string) => path.relative(scriptsDir, f);

  const sites: SkippedSite[] = [];
  const pushes: PushSite[] = [];
  const decls: DeclSite[] = [];

  for (const f of sources) {
    if (f.endsWith(path.join('lib', 'probe-outcome.mts'))) continue;   // the subject, not a caller
    if (f.endsWith(path.join('lib', 'skipped-shape-census.mts'))) continue;  // this instrument
    /**
     * Scanned with STRING BODIES BLANKED, via the shared reader in `lib/strip-source.mjs` —
     * not a hand-rolled masker, per Round 338's lesson that the correct instrument was already
     * there. Length-preserving, so every line number below is still a line number in the original.
     *
     * This is load-bearing and was found by a red, not by reading: `probe-round224` arm Q plants
     * its own counterfactual callers as SOURCE STRINGS inside itself, and the first version of
     * this census read those two string literals as live `conditional` and `call` sites in the
     * probe's own file. Excluding the file by name would have been the wrong cure — arm E keeps a
     * cell asserting its scan still SEES its own live call, precisely so self-exclusion does not
     * become a blind spot. A caller inside a string literal is not a caller; a caller in code is.
     */
    const src = stripSource(fs.readFileSync(f, 'utf8'), true);
    const lineOf = (i: number) => src.slice(0, i).split('\n').length;

    // 1 — argument sites
    const callRe = /\b(summariseAndExit|summarise)\s*\(/g;
    let m: RegExpExecArray | null;
    while ((m = callRe.exec(src)) !== null) {
      const lineStart = src.lastIndexOf('\n', m.index) + 1;
      const nl = src.indexOf('\n', m.index);
      const line = src.slice(lineStart, nl === -1 ? undefined : nl);
      if (/^\s*(\*|\/\/)/.test(line)) continue;                        // docblock or comment
      const args = argsAt(src, m.index + m[0].length - 1);
      if (args === null) continue;
      const rhs = valueOf(args, argKey);
      if (rhs === null) continue;
      const kind = classifyRhs(rhs);
      const name = kind === 'identifier' ? (rhs === '<shorthand>' ? argKey : rhs) : '';
      let boundAs: SkippedSite['boundAs'] = 'n/a';     // a literal array binds no name
      if (name) {
        boundAs = 'unbound';
        const isParam = new RegExp(`\\([^)]*\\b${name}\\s*:`).test(src)
          && !new RegExp(`(?:const|let|var)\\s+${name}\\s*(?::[^=]*?)?=`).test(src);
        const isLocal = new RegExp(`(?:const|let|var)\\s+${name}\\s*(?::[^=]*?)?=`).test(src);
        boundAs = isLocal ? 'local' : isParam ? 'param' : 'unbound';
      }
      sites.push({ file: rel(f), line: lineOf(m.index), kind, name, boundAs, rhs: rhs.replace(/\s+/g, ' ').slice(0, 80) });
    }

    /**
     * The names that actually feed an `argKey` argument IN THIS FILE. Declarations and pushes are
     * censused against this measured set rather than against a name list: `promote-probes`
     * declares an unrelated `const skipped = {}` and `sweep-probes` a `const skipped = Boolean(…)`,
     * and neither file passes `skipped` to `summarise` at all. A wholesale scan reported those two
     * as non-array initialisers — two false positives in the one cell that is supposed to name a
     * real caller, and a false positive in an instrument produces no work at all.
     */
    const feeding = new Set(sites.filter((s) => s.file === rel(f) && s.name && s.boundAs === 'local')
      .map((s) => s.name));
    if (feeding.size === 0) continue;

    // 2 — pushes onto a feeding variable name
    const pushRe = new RegExp(`\\b(${[...feeding].join('|')})\\.push\\(`, 'g');
    while ((m = pushRe.exec(src)) !== null) {
      const open = m.index + m[0].length - 1;
      let depth = 0, arg = '';
      for (let j = open; j < src.length; j += 1) {
        const c = src[j];
        if (c === '(') depth += 1;
        else if (c === ')') { depth -= 1; if (depth === 0) break; }
        if (j > open) arg += c;
      }
      arg = arg.trim();
      pushes.push({ file: rel(f), line: lineOf(m.index), kind: classifyPushArg(arg), arg: arg.replace(/\s+/g, ' ').slice(0, 80) });
    }

    /**
     * 3 — declarations of, and assignments to, every feeding variable name.
     *
     * The declaration's `=` is located EXACTLY (end of the declarator match) and an assignment is
     * excluded only on exact equality of that offset. My first version excluded any assignment
     * within `name.length + 14` bytes of a declaration, which swallowed the `skipped = undefined`
     * on the line after `let skipped = ['a']` — so the planted re-assignment counterfactual came
     * back 0 and the known positive reddened. A proximity window is not an identity test.
     */
    for (const nm of feeding) {
      const dre = new RegExp(`(?:const|let|var)\\s+${nm}\\s*(?::[^=]*?)?=`, 'g');
      const declEq = new Set<number>();
      while ((m = dre.exec(src)) !== null) declEq.add(m.index + m[0].length - 1);
      const are = new RegExp(`(?<![\\w$.])${nm}\\s*=(?!=)`, 'g');
      let reassignments = 0;
      let a: RegExpExecArray | null;
      while ((a = are.exec(src)) !== null) {
        if (!declEq.has(a.index + a[0].length - 1)) reassignments += 1;
      }
      dre.lastIndex = 0;
      while ((m = dre.exec(src)) !== null) {
        const eq = m.index + m[0].length;
        const nl = src.indexOf('\n', eq);
        const semi = src.indexOf(';', eq);
        const end = Math.min(nl === -1 ? src.length : nl, semi === -1 ? src.length : semi);
        const init = src.slice(eq, end).trim();
        decls.push({
          file: rel(f), line: lineOf(m.index), name: nm,
          arrayInit: /^\[/.test(init), reassignments, init: init.replace(/\s+/g, ' ').slice(0, 60),
        });
      }
    }
  }

  return { files: files.length, sources: sources.length, sites, pushes, decls };
}

/** Arm Q's call, unchanged in behaviour: every `skipped` argument, push and declaration. */
export const censusSkippedShapes = (scriptsDir: string): Census =>
  censusArgumentShapes(scriptsDir, { argKey: 'skipped' });

/** Arm R's call: the other half of Round 362 §2 — `results`, the required field. */
export const censusResultsShapes = (scriptsDir: string): Census =>
  censusArgumentShapes(scriptsDir, { argKey: 'results' });
