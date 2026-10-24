/**
 * Round 449 (Theseus) — THE VARIABLE-TARGET WRITE-SITE RESOLVER.
 *
 * This is the second half of my own Round 441 §5 open item, which Round 443 `G7` left explicitly
 * undone ("The modelled-target subtraction is not redone here; this leg measures the
 * comment-blindness alone. The variable-target resolver is the next unit and is NOT in this
 * round"), and which Daedalus's Round 448 §"What I have NOT taken" confirms is this seat's:
 * "The variable-target write-site resolver (`G7`'s next unit) — yours, and you have it queued."
 *
 * ## What was wrong with the two published figures
 *
 * Round 441 published a pair and labelled their characters honestly but could not improve either:
 *
 *   - **9 modelled tracked targets — a FLOOR.** Its resolver modelled exactly one shape,
 *     `writeFileSync(join(HERE|REPO, '<literal>'))`. Anything else was counted, not resolved.
 *   - **125 unresolved in 65 files — an UPPER bound**, and comment-blind at that: Round 443 `G7`
 *     showed the token count included occurrences in comments and in leg prose.
 *
 * The honest statement left standing was "the class is at least 9 and the remainder is unmeasured".
 * The remainder is the whole question, because the damage class — a drive that rewrites a committed
 * recording and destroys its provenance — lives in whether a site's target is **tracked**, and a
 * site whose target is unresolved is a site whose tracked-ness is unknown, not a site that is safe.
 *
 * ## What this instrument does differently, and what the terrain forced
 *
 * `probe-the-argument-shapes.mjs` ran FIRST (`drive1.shape-census.out`) and is committed as the
 * record of that ordering — Round 447's lesson was that three of my keys were wrong because I
 * designed them from a diff instead of from the terrain. It came back with the fact that decides
 * this design: of 148 string-and-comment-blind call sites, **78 — a clear majority — pass a bare
 * identifier**, and the old resolver modelled none of them. `path.join(import.meta.dirname, '<lit>')`
 * is another 21 and was likewise unmodelled. So the shape the old regex handled is a minority of a
 * minority, which is why its figure could only ever be a floor.
 *
 * Three properties this one has that the old one did not:
 *
 * 1. **Every bucket is positively keyed and the buckets SUM to the population.** `UNMODELLED` is
 *    not where control falls through to; it is entered by its own predicate and its members' raw
 *    argument text is printed, so a blindness shows up as a named member rather than as a smaller
 *    number (439 — a terminal bucket reached by fall-through absorbs every blindness; 383 — give
 *    the exception a cell and assert the sum).
 * 2. **A refusal is published, never guessed.** A target that resolves to nothing resolvable is
 *    `UNMODELLED`; one that resolves ambiguously (two assignments to the same name) is `AMBIGUOUS`;
 *    neither is folded into "untracked", which would read as safe (387/436).
 * 3. **The direction against the old figure is checked as a MEMBER LIST, at the same rev**, with
 *    the old regex SLICED out of its own pinned source and evaluated rather than retyped
 *    (447/363 — a hand-typed reader is not a slice; 414 — compare member lists, not counts).
 *
 * ## Leg map
 *
 * - `W1` extraction: length-preservation and paren balance, with a KP bundle carrying one positive
 *   and one CONTROL per model, in the real call shape.
 * - `W2` the partition is total: buckets positively keyed, sizes sum to the site count.
 * - `W3` resolution: resolved targets classified OUTSIDE / UNTRACKED / **TRACKED**, which is the
 *   damage surface, with the tracked members named.
 * - `W4` direction: the old round441 regex, sliced from its pin, over the same population at the
 *   same rev — its member set must be a SUBSET of this one.
 * - `W5` mechanism census: is `writeFileSync(` the whole write surface, or is the figure keyed on
 *   one token out of several? (428 — census the mechanism, not just the reported instance.)
 * - `W6` adoption of the existing cure: how many sites route through `verdict.mjs`'s
 *   `writeRecording`, which already refuses a tracked target.
 * - `W7` self-exclusion counted and read, not trusted (430/434).
 * - `W8` this drive modified no tracked file.
 * - `W9` every cripple this run reports is one a hook implements (my own Round 447 `G9`).
 *
 * `Q1` and `Q2` are PREDICTIONS, declared below before the first run of this file, scored by
 * predicates that can refuse. They are kept separate from the gate legs (401 — gate the figure on
 * the key, not on the prediction).
 */
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative, resolve as presolve } from 'node:path';
import { readFileSync } from 'node:fs';
import { stripSource } from '../../../scripts/lib/strip-source.mjs';
import { renderTail, renderRows, readVerdict as readVerdictLib, selfTest } from '../lib/verdict.mjs';

// A printed self-test that gates nothing is not a gate (356): `!== true`, and it throws on failure.
if (selfTest() !== true) throw new Error('verdict.mjs selfTest did not return true');

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..', '..');
const SELF_ABS = fileURLToPath(import.meta.url);
const SELF_REL = relative(REPO, SELF_ABS);
const git = (...a) => execFileSync('git', ['-C', REPO, ...a], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });

const REV = git('rev-parse', 'HEAD').trim();
const SHORT = REV.slice(0, 8);

// ═══ CRIPPLES ════════════════════════════════════════════════════════════════════════════════════
// Each name below is read by a hook further down. Round 447 found three names in my own registry
// that NOTHING read, so a run announcing itself crippled was byte-identical to a clean one in every
// leg (356). `W9` asserts each implemented name occurs more than once in this file — i.e. somewhere
// other than the line that declares it.
const IMPLEMENTED = ['KLATCH_R449_FALLTHROUGH', 'KLATCH_R449_NOVAR', 'KLATCH_R449_TOKENONLY'];
const crippled = IMPLEMENTED.filter((n) => process.env[n] === '1');
const requested = Object.keys(process.env).filter((k) => k.startsWith('KLATCH_R449_') && process.env[k] === '1');
const CRIPPLE_FALLTHROUGH = process.env.KLATCH_R449_FALLTHROUGH === '1';
const CRIPPLE_NOVAR = process.env.KLATCH_R449_NOVAR === '1';
const CRIPPLE_TOKENONLY = process.env.KLATCH_R449_TOKENONLY === '1';

// ═══ DECLARED BEFORE THE RUN ═════════════════════════════════════════════════════════════════════
// Written into source before this file was executed once. Never draft the slot for a running
// measurement (398) — these are claims, and the drive is allowed to refute them.
const Q1_CLAIM = 'the UNMODELLED+AMBIGUOUS residue is a MINORITY of the call sites — i.e. the '
  + '"125 unresolved" upper bound is mostly resolvable, and the honest figure is a partition rather '
  + 'than a floor plus an unmeasured remainder';
const Q2_CLAIM = 'the TRACKED-target set found here is a strict SUPERSET of the old round441 '
  + 'regex\'s set over the same population at the same rev — the floor of 9 was a floor';

const legs = [];
const preds = [];
const leg = (id, what, detail, ok) => { legs.push({ id, ok, what: `${what}\n        ${detail}` }); return ok; };
const pred = (id, claim, detail, landed) => { preds.push({ id, landed, what: `${claim}\n        ${detail}` }); return landed; };

const DIRTY_AT_ENTRY = git('status', '--porcelain=v1').split('\n')
  .filter((l) => l !== '' && /^.?[MARCD]/.test(l.slice(0, 2)))
  .map((l) => l.slice(3));
const UNTRACKED_AT_ENTRY = git('status', '--porcelain=v1').split('\n')
  .filter((l) => l.startsWith('??')).map((l) => l.slice(3));

// ═══ POPULATION ══════════════════════════════════════════════════════════════════════════════════
// `ls-tree -z` at a stamped rev. A population keyed on `ls-files` is irreproducible from any rev
// (386); NUL-delimited because a newline split drops a name containing one (289).
const ALL_MJS = git('ls-tree', '-r', '--name-only', '-z', REV, 'docs/').split('\0')
  .filter((f) => f.endsWith('.mjs'));
const POP = ALL_MJS.filter((f) => f !== SELF_REL);
const EXCLUDED = ALL_MJS.length - POP.length;
const SELF_TRACKED = git('ls-tree', '-r', '--name-only', REV, SELF_REL).trim() === SELF_REL;

const TRACKED_AT_REV = new Set(git('ls-tree', '-r', '--name-only', '-z', REV).split('\0').filter((f) => f !== ''));

const TOKEN = 'writeFileSync(';

// ═══ EXTRACTION ══════════════════════════════════════════════════════════════════════════════════
// Paren balance over the BLINDED text (a paren inside a string or comment cannot move the depth),
// sliced out of the RAW text. `stripSource` is length-preserving, which is what makes the two
// indices interchangeable, and `W1` asserts that per file rather than trusting the docstring.
const argSpan = (raw, blind, open) => {
  let depth = 0;
  let i = open;
  for (; i < blind.length; i += 1) {
    if (blind[i] === '(') depth += 1;
    else if (blind[i] === ')') { depth -= 1; if (depth === 0) return raw.slice(open + 1, i); }
  }
  return null;
};
const firstArg = (args, blindArgs) => {
  let depth = 0;
  for (let i = 0; i < blindArgs.length; i += 1) {
    const c = blindArgs[i];
    if ('(['.includes(c) || c === '{') depth += 1;
    else if (')]'.includes(c) || c === '}') depth -= 1;
    else if (c === ',' && depth === 0) return args.slice(0, i);
  }
  return args;
};

// ═══ THE RESOLVER ════════════════════════════════════════════════════════════════════════════════
// A small expression reader over the first argument's text. Every return is a TAGGED result, so a
// caller cannot mistake "resolved to nothing" for "resolved to the empty path" (387/393).
//
//   { kind: 'PATH',       value }   an absolute path
//   { kind: 'OUTSIDE',    why   }   resolves outside the repo by construction (tmpdir, an absolute
//                                   literal elsewhere, a URL)
//   { kind: 'AMBIGUOUS',  why   }   an identifier with more than one assignment in the file
//   { kind: 'UNMODELLED', why   }   positively keyed: no model matched, and `why` names the form
//
// `UNMODELLED` is RETURNED BY ITS OWN BRANCH at the end of a chain of `if`s each of which tests a
// named form — it is not a `default:` and not an `else` on a fall-through. The cripple
// KLATCH_R449_FALLTHROUGH replaces it with the old shape (silently dropping unmatched sites) so
// `W2` can be shown to move.
const LIT = /^(['"])((?:[^'"\\]|\\.)*)\1$/;
const BARE_TEMPLATE = /^`([^`$\\]*)`$/;
const IDENT = /^[A-Za-z_$][A-Za-z0-9_$]*$/;
const JOINER = /^(?:path\s*\.\s*)?(?:join|resolve)$/;

/** Every `const <id> = <rhs>;` in the file, as a name → list of RHS texts (a LIST, so a second
 *  assignment is AMBIGUOUS rather than silently last-wins). Read off the blinded source for
 *  structure and sliced from the raw, same as the call sites. */
const assignmentsOf = (raw, blind) => {
  const map = new Map();
  const re = /\b(?:const|let|var)\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*=/g;
  let m;
  while ((m = re.exec(blind)) !== null) {
    const name = m[1];
    // The RHS runs to the first top-level `;` or newline-at-depth-0 after the `=`.
    let i = re.lastIndex;
    let depth = 0;
    const start = i;
    for (; i < blind.length; i += 1) {
      const c = blind[i];
      if ('(['.includes(c) || c === '{') depth += 1;
      else if (')]'.includes(c) || c === '}') { if (depth === 0) break; depth -= 1; }
      else if (depth === 0 && (c === ';' || c === '\n')) break;
    }
    const rhs = raw.slice(start, i).trim();
    if (!map.has(name)) map.set(name, []);
    map.get(name).push(rhs);
  }
  return map;
};

const OUTSIDE_CALL = /^(?:os\s*\.\s*)?tmpdir\s*\(\s*\)$/;

// The deepest chain any site in the population actually needed, and the cap. Drive 3 ran with a
// cap of 6 and reported `recursion depth exceeded` 14× as if it were a fact about the terrain — it
// was a fact about my guess. `const REPO = join(HERE, '..','..','..')` plus `HERE =
// dirname(fileURLToPath(import.meta.url))` is already 7 levels, so the cap was cutting resolvable
// chains and the bucket made my own limit look like the population's. The cap is now far above
// anything observed, the OBSERVED maximum is published beside it, and a genuine cycle is keyed
// separately by identifier name so "deep" and "circular" are not the same bucket.
const DEPTH_CAP = 64;
let maxDepthSeen = 0;
const resolveExpr = (text, ctx, depth = 0, seen = new Set()) => {
  const t = text.trim();
  if (depth > maxDepthSeen) maxDepthSeen = depth;
  if (depth > DEPTH_CAP) return { kind: 'UNMODELLED', why: 'recursion depth exceeded' };

  // 1 — a quoted literal. ALWAYS a `PATH` when it resolves, absolute or relative: whether that
  //     path is inside the repo is `classOf`'s question, not this function's. Drive 2 had this
  //     function answering it too, which is a classification taken twice in two places — and the
  //     KP caught it by declaring a want the resolver contradicted.
  const lit = LIT.exec(t);
  if (lit) {
    const v = lit[2].replace(/\\(.)/g, '$1');
    return { kind: 'PATH', value: v.startsWith('/') ? presolve(v) : presolve(ctx.dir, v) };
  }

  // 2 — a template literal with no substitution.
  const bt = BARE_TEMPLATE.exec(t);
  if (bt) return { kind: 'PATH', value: presolve(ctx.dir, bt[1]) };

  // 3 — a template literal WITH a substitution: positively keyed, and not resolved. Named as its
  //     own form rather than lumped with "no model matched", because the two are different
  //     blindnesses and one of them is curable.
  if (t.startsWith('`') && t.endsWith('`') && t.includes('${')) {
    return { kind: 'UNMODELLED', why: 'interpolated template' };
  }

  // 4 — `import.meta.dirname` / `import.meta.url` / `__dirname`.
  if (/^import\s*\.\s*meta\s*\.\s*dirname$/.test(t) || t === '__dirname') return { kind: 'PATH', value: ctx.dir };
  if (/^import\s*\.\s*meta\s*\.\s*url$/.test(t)) return { kind: 'PATH', value: ctx.abs };

  // 4b — `fileURLToPath(import.meta.url)` and `dirname(<expr>)`, which is how all but a handful of
  //      this population spell their own directory. Drive 2 did NOT model these, and that single
  //      omission is why its tracked set was DISJOINT from the old resolver's rather than a
  //      superset of it: `HERE` is almost always `dirname(fileURLToPath(import.meta.url))`, so
  //      every `join(HERE, '<lit>')` — the one shape the old regex DID handle — came back
  //      UNMODELLED here. Counts alone read that as 21 ≥ 10 and would have passed (414).
  const call = /^([A-Za-z_$][A-Za-z0-9_$.\s]*)\s*\((.*)\)$/s.exec(t);
  if (call && /^(?:url\s*\.\s*)?fileURLToPath$/.test(call[1].trim())) {
    const r = resolveExpr(call[2], ctx, depth + 1, seen);
    return r.kind === 'PATH' ? r : { kind: 'UNMODELLED', why: `fileURLToPath(${r.kind})` };
  }
  if (call && /^(?:path\s*\.\s*)?dirname$/.test(call[1].trim())) {
    const r = resolveExpr(call[2], ctx, depth + 1, seen);
    return r.kind === 'PATH' ? { kind: 'PATH', value: dirname(r.value) } : { kind: 'UNMODELLED', why: `dirname(${r.kind})` };
  }

  // 5 — a call that is outside the repo by construction.
  if (OUTSIDE_CALL.test(t)) return { kind: 'OUTSIDE', why: 'os.tmpdir()' };
  if (/^new\s+URL\s*\(/.test(t)) {
    const inner = t.slice(t.indexOf('(') + 1, t.lastIndexOf(')'));
    const first = firstArg(inner, stripSource(inner, true));
    const r = resolveExpr(first, ctx, depth + 1, seen);
    return r.kind === 'PATH' ? r : { kind: 'UNMODELLED', why: `new URL(${r.kind})` };
  }

  // 6 — `join(a, b, …)` / `path.join(…)` / `resolve(…)`: resolved iff EVERY argument resolves.
  const open = t.indexOf('(');
  if (open > 0 && t.endsWith(')') && JOINER.test(t.slice(0, open))) {
    const inner = t.slice(open + 1, t.length - 1);
    const blindInner = stripSource(inner, true);
    const parts = [];
    let d = 0;
    let from = 0;
    for (let i = 0; i <= blindInner.length; i += 1) {
      const c = blindInner[i];
      if (i === blindInner.length || (c === ',' && d === 0)) { parts.push(inner.slice(from, i)); from = i + 1; continue; }
      if ('(['.includes(c) || c === '{') d += 1;
      else if (')]'.includes(c) || c === '}') d -= 1;
    }
    const rs = parts.map((p) => resolveExpr(p, ctx, depth + 1, seen));
    const bad = rs.find((r) => r.kind !== 'PATH');
    if (bad) return bad.kind === 'OUTSIDE' ? { kind: 'OUTSIDE', why: `join(… ${bad.why})` } : bad;
    // Later absolute segments win, which is what `path.join` does NOT do and `path.resolve` does;
    // every member of this population passes a relative tail, and a segment that is absolute is
    // only ever the first, so the two agree here. Reported in the leg detail, not assumed silently.
    let v = rs[0].value;
    for (const r of rs.slice(1)) v = presolve(v, relative(ctx.dir, r.value) || '.');
    return { kind: 'PATH', value: v };
  }

  // 7 — a bare identifier: resolved through its assignments in the same file.
  if (IDENT.test(t)) {
    if (CRIPPLE_NOVAR) return { kind: 'UNMODELLED', why: 'identifier (variable resolution disabled)' };
    const rhss = ctx.assign.get(t);
    if (rhss === undefined) return { kind: 'UNMODELLED', why: `identifier ${t} with no assignment in this file` };
    if (rhss.length > 1) return { kind: 'AMBIGUOUS', why: `${t} assigned ${rhss.length}×` };
    // A genuine cycle gets its own key. Without this, `const a = b; const b = a;` is
    // indistinguishable from a chain that is merely long, and both land in the depth bucket — which
    // is how the depth cap came to look like a fact about the terrain.
    if (seen.has(t)) return { kind: 'UNMODELLED', why: `identifier cycle through ${t}` };
    return resolveExpr(rhss[0], ctx, depth + 1, new Set([...seen, t]));
  }

  // 8 — string concatenation `a + b`: resolved iff the LEFTMOST term resolves to a path, with the
  //     tail reported as a varying basename. Keyed positively on a top-level `+`.
  const blindT = stripSource(t, true);
  let d2 = 0;
  for (let i = 0; i < blindT.length; i += 1) {
    const c = blindT[i];
    if ('(['.includes(c) || c === '{') d2 += 1;
    else if (')]'.includes(c) || c === '}') d2 -= 1;
    else if (c === '+' && d2 === 0) {
      const l = resolveExpr(t.slice(0, i), ctx, depth + 1, seen);
      return l.kind === 'PATH'
        ? { kind: 'UNMODELLED', why: 'concatenation with a resolvable prefix (varying basename)' }
        : l;
    }
  }

  // 9 — THE LAST BUCKET, POSITIVELY KEYED. Reached only when none of the forms above matched, and
  //     it names the form it could not read rather than returning a sentinel a caller could compare
  //     past.
  return { kind: 'UNMODELLED', why: `unrecognised form: ${t.slice(0, 60).replace(/\s+/g, ' ')}` };
};

// ═══ THE CENSUS ══════════════════════════════════════════════════════════════════════════════════
const sites = [];
const lenPreserved = [];
let unbalanced = 0;
let viaWriteRecording = 0;
let viaWriteRecordingOthers = 0;
for (const f of POP) {
  const raw = git('show', `${REV}:${f}`);
  const blind = stripSource(raw, true);
  lenPreserved.push(blind.length === raw.length);
  const ctx = { dir: presolve(REPO, dirname(f)), abs: presolve(REPO, f), assign: assignmentsOf(raw, blind) };
  const n = blind.split('writeRecording(').length - 1;
  viaWriteRecording += n;
  // Adoption BY OTHERS. This round's own directory contributes its recorder and its re-diff script
  // to the figure above, so the whole-population number is partly self-inflated — the post-commit
  // drive moved it 5 -> 6 for exactly that reason. Both are published; a cure's adoption measured
  // over a population that includes the cure's own round is not a measure of adoption (443 §6).
  if (!f.startsWith('docs/research/round449-instruments/')) viaWriteRecordingOthers += n;
  let from = 0;
  for (;;) {
    const at = blind.indexOf(TOKEN, from);
    if (at === -1) break;
    from = at + TOKEN.length;
    const open = at + TOKEN.length - 1;
    const args = argSpan(raw, blind, open);
    if (args === null) { unbalanced += 1; continue; }
    const a = firstArg(args, blind.slice(open + 1, open + 1 + args.length)).trim();
    const r = resolveExpr(a, ctx);
    // KLATCH_R449_FALLTHROUGH restores the OLD behaviour this round replaced: a site whose target
    // no model reads is silently absent from the census rather than named in a bucket. Applied here
    // at the top level rather than inside `resolveExpr`, because returning a sentinel from the
    // recursive function made every crippled drive DIE before printing a line — three identical
    // dead runs read as "no effect" (444), which is the opposite of what a cripple must show.
    if (CRIPPLE_FALLTHROUGH && r.kind === 'UNMODELLED') continue;
    sites.push({ file: f, arg: a.replace(/\s+/g, ' '), ...r });
  }
}

const classOf = (s) => {
  if (s.kind !== 'PATH') return s.kind;
  if (!presolve(s.value).startsWith(presolve(REPO))) return 'OUTSIDE';
  const rel = relative(REPO, s.value);
  return TRACKED_AT_REV.has(rel) ? 'TRACKED' : 'UNTRACKED';
};
const BUCKETS = ['TRACKED', 'UNTRACKED', 'OUTSIDE', 'AMBIGUOUS', 'UNMODELLED'];
const byBucket = new Map(BUCKETS.map((b) => [b, []]));
for (const s of sites) byBucket.get(classOf(s)).push(s);
const size = (b) => byBucket.get(b).length;
const trackedMembers = [...new Set(byBucket.get('TRACKED').map((s) => relative(REPO, s.value)))].sort();

// ═══ W1 — EXTRACTION, GRADED BY A KP BUNDLE WITH A CONTROL PER MODEL ═════════════════════════════
{
  // Known positives in the REAL call shape, not by analogy (355/364/424), each paired with a
  // CONTROL that must NOT be read as a site or must NOT resolve — because a bundle of positives
  // alone cannot show a reader is not simply saying yes (424).
  // Row 1 is `dirname(fileURLToPath(import.meta.url))` and it is in this bundle BECAUSE its
  // absence is what made drive 2's tracked set disjoint from the old resolver's. A KP for the
  // shape that actually bit, in the spelling the population actually uses — not an analogy (424).
  const KP_SRC = [
    'const HERE = dirname(fileURLToPath(import.meta.url));',
    "writeFileSync(join(HERE, 'live.out'), x);",      // positive: the shape drive 2 could not read
    "// writeFileSync(join(HERE, 'commented.out'))",  // control: comment, must vanish
    "const s = \"writeFileSync(join(HERE, 'instring.out'))\";", // control: string, must vanish
    "writeFileSync(`${d}/interp.out`, x);",            // positive site, UNMODELLED target
    'writeFileSync(abs, x);',                          // positive site, identifier
    "const abs = join(HERE, 'via-var.out');",
    'writeFileSync(join(tmpdir(), \'scratch.out\'), x);', // positive site, OUTSIDE
    'writeFileSync(twice, x);',                        // positive site, AMBIGUOUS
    "const twice = join(HERE, 'a.out');",
    "const twice = join(HERE, 'b.out');",
  ].join('\n');
  const kpBlind = stripSource(KP_SRC, true);
  const ctx = { dir: '/tmp/kpdir', abs: '/tmp/kpdir/kp.mjs', assign: assignmentsOf(KP_SRC, kpBlind) };
  const got = [];
  let from = 0;
  for (;;) {
    const at = kpBlind.indexOf(TOKEN, from);
    if (at === -1) break;
    from = at + TOKEN.length;
    const open = at + TOKEN.length - 1;
    const args = argSpan(KP_SRC, kpBlind, open);
    const a = firstArg(args, kpBlind.slice(open + 1, open + 1 + args.length)).trim();
    const r = resolveExpr(a, ctx);
    got.push(r === null ? 'DROPPED' : (r.kind === 'PATH' ? `PATH:${r.value}` : r.kind));
  }
  // DECLARED, in source, before the run: five sites survive blinding (the comment and the
  // in-string occurrence are the two controls and must be gone), and their five kinds are these.
  // `/tmp/kpdir` is `ctx.dir`, so row 1 asserts that the resolver reached the file's OWN directory
  // through `dirname(fileURLToPath(import.meta.url))` — the step whose absence caused drive 2's
  // disjointness — and not through some other route that happens to produce a path.
  const WANT = ['PATH:/tmp/kpdir/live.out', 'UNMODELLED', 'PATH:/tmp/kpdir/via-var.out', 'OUTSIDE',
    'AMBIGUOUS'];
  const kpOk = got.length === WANT.length && got.every((g, i) => g === WANT[i]);
  // The blind controls, counted separately so "4 sites" cannot be reached by a different route.
  const rawTokens = KP_SRC.split(TOKEN).length - 1;
  const allPreserved = lenPreserved.every((p) => p === true);
  leg('W1', 'THE EXTRACTOR READS CALL SITES, NOT TOKENS — the first argument is sliced by paren '
    + 'balance over the string-and-comment-blinded text and taken out of the raw, which is sound '
    + 'only because `stripSource` preserves length; that is asserted per file here rather than '
    + 'taken from its docstring. The KP bundle carries one positive per model AND a control per '
    + 'blinding stage: a commented-out call and a call inside a string literal must both vanish, '
    + 'because a scanner that fails does so by returning a SMALLER number (344) and only a control '
    + 'row shows the difference between comment-blind and string-blind (371/383)',
    `population ${POP.length} file(s) · length preserved in all of them: ${allPreserved} · `
    + `unbalanced argument lists: ${unbalanced}\n`
    + `        KP: raw \`${TOKEN}\` tokens ${rawTokens}, of which blinded away `
    + `${rawTokens - got.length} (expected 2: one comment, one string literal)\n`
    + `        KP kinds got  ${JSON.stringify(got)}\n`
    + `        KP kinds WANT ${JSON.stringify(WANT)}  → ${kpOk}`,
    kpOk && allPreserved && unbalanced === 0);
}

// ═══ W2 — THE PARTITION IS TOTAL ═════════════════════════════════════════════════════════════════
{
  const sum = BUCKETS.reduce((a, b) => a + size(b), 0);
  // The property: every site is in exactly one bucket and the bucket sizes SUM to the site count.
  // Under KLATCH_R449_FALLTHROUGH the last branch drops unmatched sites instead of naming them, so
  // this sum falls below the token count and the leg reddens — which is the vacuity grade for the
  // positive keying itself.
  const tokenCount = (() => {
    let n = 0;
    for (const f of POP) n += stripSource(git('show', `${REV}:${f}`), true).split(TOKEN).length - 1;
    return n;
  })();
  const total = sum === sites.length && sites.length + unbalanced === tokenCount;
  leg('W2', 'EVERY BUCKET IS POSITIVELY KEYED AND THE BUCKETS SUM TO THE POPULATION — `UNMODELLED` '
    + 'is entered by its own branch at the end of a chain of named forms, not by a `default:`, and '
    + 'its members\' raw argument text is printed below. A terminal bucket reached by fall-through '
    + 'absorbs every blindness (439): the figure gets SMALLER and nothing says so. The sum is '
    + 'checked against the independently recomputed blind TOKEN count, so a dropped site cannot '
    + 'hide inside a self-consistent set of buckets (383)',
    `blind \`${TOKEN}\` token count ${tokenCount} = sites ${sites.length} + unbalanced ${unbalanced}`
    + ` · bucket sum ${sum}\n`
    + BUCKETS.map((b) => `        ${b.padEnd(11)} ${String(size(b)).padStart(4)}`).join('\n'),
    total);
}

// ═══ W3 — RESOLUTION, AND THE DAMAGE SURFACE ═════════════════════════════════════════════════════
{
  const resolved = size('TRACKED') + size('UNTRACKED') + size('OUTSIDE');
  const residue = size('UNMODELLED') + size('AMBIGUOUS');
  const unmodelledWhy = new Map();
  for (const s of byBucket.get('UNMODELLED')) unmodelledWhy.set(s.why.replace(/:.*/, ''), (unmodelledWhy.get(s.why.replace(/:.*/, '')) ?? 0) + 1);
  leg('W3', 'THE 148 SITES, RESOLVED AND CLASSIFIED — the damage class is a target that is TRACKED '
    + 'at the rev, because a drive that rewrites a committed recording destroys the provenance of '
    + 'what it recorded, and Round 441 `G8` measured that already happening to a depth of six '
    + 'generations. A site whose target is unresolved is a site whose tracked-ness is UNKNOWN, not '
    + 'a site that is safe, which is why the residue is reported as its own figure and not rolled '
    + 'into `UNTRACKED`',
    `resolved ${resolved} of ${sites.length} · residue (UNMODELLED+AMBIGUOUS) ${residue}`
    + ` · deepest chain any site needed: ${maxDepthSeen} (cap ${DEPTH_CAP}, published so the cap `
    + `is a measurement and not a guess)\n`
    + `        TRACKED targets: ${size('TRACKED')} site(s) → ${trackedMembers.length} distinct path(s)\n`
    + trackedMembers.map((p) => `          ${p}`).join('\n')
    + `\n        UNMODELLED by form: ${JSON.stringify([...unmodelledWhy.entries()])}`,
    // The leg grades the MEASUREMENT being takeable, not a direction. The second conjunct used to
    // be `trackedMembers.every((p) => TRACKED_AT_REV.has(p))` — vacuous by construction, because
    // `trackedMembers` is the list `TRACKED_AT_REV.has(…)` SELECTED (417). A conjunct a filter makes
    // true cannot be re-keyed red. Re-keyed on an INDEPENDENT oracle: every tracked target must be
    // readable as a blob at the rev via `cat-file -e`, which is a different question asked of a
    // different command than the set membership that chose the members.
    sites.length > 0 && trackedMembers.length > 0 && trackedMembers.every((p) => {
      try {
        execFileSync('git', ['-C', REPO, 'cat-file', '-e', `${REV}:${p}`], { stdio: ['ignore', 'ignore', 'ignore'] });
        return true;
      } catch { return false; }
    }));
}

// ═══ W4 — DIRECTION AGAINST THE OLD FIGURE, THE OLD REGEX SLICED FROM ITS PIN ════════════════════
{
  const OLD_REL = 'docs/research/round441-instruments/key-the-silent-class-from-source.mjs';
  const oldSrc = git('show', `${REV}:${OLD_REL}`);
  // SLICED, not retyped (447/363). The old resolver is one regex literal in that file; it is lifted
  // out of the pinned source by its own anchor and compiled, so a divergence between my copy and
  // his source is unrepresentable.
  const anchor = 'const re = ';
  const i = oldSrc.indexOf(anchor);
  const lineEnd = i === -1 ? -1 : oldSrc.indexOf('\n', i);
  const reText = i === -1 ? null : oldSrc.slice(i + anchor.length, lineEnd).replace(/;\s*$/, '');
  let oldSet = null;
  let oldErr = null;
  if (reText !== null && /^\/.*\/[gimsuy]*$/.test(reText)) {
    try {
      // eslint-disable-next-line no-new-func
      const oldRe = new Function(`return ${reText};`)();
      oldSet = new Set();
      for (const f of POP) {
        const src = git('show', `${REV}:${f}`);
        const re2 = new RegExp(oldRe.source, oldRe.flags);
        let m;
        while ((m = re2.exec(src)) !== null) {
          const rel = m[1] === 'HERE' ? join(dirname(f), m[3]) : m[3];
          if (TRACKED_AT_REV.has(rel)) oldSet.add(rel);
        }
      }
    } catch (e) { oldErr = String(e); }
  }
  const mine = new Set(trackedMembers);
  const missing = oldSet === null ? null : [...oldSet].filter((p) => !mine.has(p));
  const gained = oldSet === null ? null : [...mine].filter((p) => !oldSet.has(p));
  // REFUSES rather than reporting a direction if the slice did not produce a regex (436).
  const ok = oldSet === null ? null : (missing.length === 0 && mine.size >= oldSet.size);
  leg('W4', 'THE OLD RESOLVER\'S TRACKED SET IS A SUBSET OF THIS ONE — the Round 441 regex is '
    + 'SLICED out of its own pinned source by its anchor and compiled, never retyped, so my copy '
    + 'cannot drift from his (447/363); and it is re-run over the SAME population at the SAME rev, '
    + 'because the published 9 was taken at `8d891c70` and a figure compared across revs is '
    + 'comparing two populations (349). Compared as MEMBER LISTS: equal counts have hidden a '
    + 'non-empty symmetric difference here before (414)',
    `old regex sliced from ${OLD_REL}: ${reText === null ? 'NOT FOUND' : reText}\n`
    + `        old tracked set at ${SHORT}: ${oldSet === null ? `REFUSED (${oldErr ?? 'anchor missed'})` : oldSet.size}`
    + ` · mine: ${mine.size}\n`
    + `        in his and NOT mine (must be empty): ${JSON.stringify(missing)}\n`
    + `        in mine and not his: ${gained === null ? 'n/a' : gained.length} ${JSON.stringify((gained ?? []).slice(0, 8))}`,
    ok);
}

// ═══ W5 — IS `writeFileSync(` THE WHOLE WRITE SURFACE? ═══════════════════════════════════════════
{
  // Census the MECHANISM, not just the reported instance (428) — the last time a shape was reported
  // narrow it turned out to be in my own lib. The published figure is keyed on ONE token; a write
  // through any of these others is the same damage with a different spelling.
  const OTHER = CRIPPLE_TOKENONLY ? [] : [
    'appendFileSync(', 'writeFile(', 'appendFile(', 'createWriteStream(', 'copyFileSync(',
    'cpSync(', 'renameSync(', 'rmSync(', 'unlinkSync(', 'truncateSync(', 'writeSync(',
  ];
  const counts = new Map();
  for (const f of POP) {
    const blind = stripSource(git('show', `${REV}:${f}`), true);
    for (const t of OTHER) {
      const n = blind.split(t).length - 1;
      if (n > 0) counts.set(t, (counts.get(t) ?? 0) + n);
    }
  }
  const otherTotal = [...counts.values()].reduce((a, b) => a + b, 0);
  // KP: the token list must be able to find something it is pointed at, or a zero here means
  // "scanned nothing" rather than "nothing there" (344/423).
  const KP = 'appendFileSync(x); // appendFileSync(commented)\nconst s = "renameSync(";\nrenameSync(a, b);';
  const kpBlind = stripSource(KP, true);
  const kpApp = kpBlind.split('appendFileSync(').length - 1;
  const kpRen = kpBlind.split('renameSync(').length - 1;
  const kpOk = kpApp === 1 && kpRen === 1;
  leg('W5', 'THE PUBLISHED FIGURE IS KEYED ON ONE TOKEN, AND THIS IS THE REST OF THE WRITE SURFACE '
    + '— `writeFileSync(` is one of several ways to put bytes over a tracked path. Reported as '
    + 'measured, narrow or wide, with a known positive for the token list itself so a zero cannot '
    + 'mean "scanned nothing" (344/423). These sites are NOT added to the figures above; the '
    + 'population this instrument resolves is still the one token, and that scope is now a '
    + 'measurement rather than an unstated choice (415)',
    `other write tokens found: ${otherTotal} occurrence(s) across ${counts.size} spelling(s)\n`
    + `        ${JSON.stringify([...counts.entries()])}\n`
    + `        token-list KP (1 live + 1 comment + 1 string each): appendFileSync ${kpApp}, `
    + `renameSync ${kpRen} · expected 1,1: ${kpOk} · token list length ${OTHER.length}`,
    // The token list must be NON-EMPTY as well as correct. Drive 7 gated this leg on `kpOk` alone,
    // so KLATCH_R449_TOKENONLY — which empties the list — moved no leg at all: a declared cripple
    // that was wired by name and inert in effect, which is the same defect my own `W9` exists to
    // catch one level up (356/447). A census that scans no other mechanism cannot tell a narrow
    // result from an unscanned one, and that is the property this conjunct keeps.
    kpOk && OTHER.length > 0);
}

// ═══ W6 — ADOPTION OF THE CURE THAT ALREADY EXISTS ═══════════════════════════════════════════════
{
  // `verdict.mjs`'s `writeRecording` already refuses a tracked target. It is the cure for exactly
  // the class this instrument measures, and nobody has taken its adoption figure — the measure of a
  // cure is whether it MOVED, not whether it exists (the shape of Daedalus's own Round 443 §6).
  const libSites = sites.filter((s) => s.file === 'docs/research/lib/verdict.mjs');
  leg('W6', 'ADOPTION OF `writeRecording`, WHICH ALREADY REFUSES A TRACKED TARGET — the cure for '
    + 'this class is in `docs/research/lib/verdict.mjs` and has been since Round 444. This leg '
    + 'measures how many of the write sites in this population route through it rather than calling '
    + '`writeFileSync` directly. A cure that exists and is not adopted leaves the surface exactly '
    + 'as wide as it was; that is a figure, and it is taken here rather than asserted',
    `\`writeRecording(\` call sites in the population: ${viaWriteRecording}, of which OUTSIDE this `
    + `round's own directory ${viaWriteRecordingOthers} — the whole-population figure is partly `
    + `self-inflated and the post-commit drive moved it by 1 for exactly that reason · direct `
    + `\`${TOKEN}\` sites: ${sites.length} · adoption `
    + `${((viaWriteRecording / (viaWriteRecording + sites.length)) * 100).toFixed(1)}%\n`
    + `        the lib's own site (correct by construction, inside \`writeRecording\` itself): `
    + `${libSites.length} — ${JSON.stringify(libSites.map((s) => s.arg))}`,
    // Graded on the figure being READABLE, not on its value: a leg that required adoption to be
    // high would redden on a true measurement of a low one.
    // `viaWriteRecording >= 0` was a second dead conjunct — true of every count. Dropped. What is
    // left is the one thing this leg needs in order to have measured anything: the lib's own write
    // site is present in the census. The adoption percentage is REPORTED, never gated, because a
    // leg that required adoption to be high would redden on a true measurement of a low one.
    libSites.length >= 1);
}

// ═══ W7 — SELF-EXCLUSION, COUNTED AND READ ═══════════════════════════════════════════════════════
leg('W7', 'THIS INSTRUMENT IS EXCLUDED FROM ITS OWN POPULATION, AND THE EXCLUSION IS READ RATHER '
  + 'THAN TRUSTED — an instrument does not census its own source (425): this file contains the '
  + 'token it scans for, in its own live calls and in its own prose. The count is printed and gated '
  + 'against whether this file is tracked at the rev, because a self-exclusion leg is VACUOUS '
  + 'before promotion and green either way if it only reads the verdict (434)',
  `tracked .mjs under docs/ at ${SHORT}: ${ALL_MJS.length} · EXCLUDED as this instrument's own `
  + `source: ${EXCLUDED} · this file tracked at the rev: ${SELF_TRACKED} · censused: ${POP.length}`,
  EXCLUDED === (SELF_TRACKED ? 1 : 0));

// ═══ W8 — THIS DRIVE MODIFIED NO TRACKED FILE ════════════════════════════════════════════════════
{
  const dirtyNow = git('status', '--porcelain=v1').split('\n')
    .filter((l) => l !== '' && /^.?[MARCD]/.test(l.slice(0, 2))).map((l) => l.slice(3));
  const modifiedByThisDrive = dirtyNow.filter((p) => !DIRTY_AT_ENTRY.includes(p));
  leg('W8', 'THIS DRIVE MODIFIED NO TRACKED FILE — read as a FIELD over the whole tracked tree. '
    + 'This instrument only ever reads blobs at a rev; it opens no file for writing. The one thing '
    + 'it would be most embarrassing to get wrong in a round about write sites',
    `tracked MODIFIED on entry (not this drive's): ${DIRTY_AT_ENTRY.length} `
    + `${JSON.stringify(DIRTY_AT_ENTRY)} · untracked on entry: ${UNTRACKED_AT_ENTRY.length} · `
    + `tracked files MODIFIED by this drive: ${modifiedByThisDrive.length} `
    + `${JSON.stringify(modifiedByThisDrive)}`,
  modifiedByThisDrive.length === 0);
}

// ═══ W9 — EVERY CRIPPLE REPORTED IS ONE A HOOK IMPLEMENTS ════════════════════════════════════════
{
  const SELF = readFileSync(SELF_ABS, 'utf8');
  const occurrences = (n) => SELF.split(n).length - 1;
  const wired = IMPLEMENTED.map((n) => ({ name: n, sites: occurrences(n) }));
  const unwired = wired.filter((w) => w.sites < 2).map((w) => w.name);
  const inert = requested.filter((n) => !IMPLEMENTED.includes(n));
  leg('W9', 'EVERY CRIPPLE THIS RUN REPORTS IS ONE A HOOK ACTUALLY IMPLEMENTS — Round 447 found '
    + 'three names in my own registry that nothing read, so a run announcing itself crippled was '
    + 'byte-identical to a clean one in every leg (356). Each implemented name must occur MORE THAN '
    + 'ONCE in this file — i.e. somewhere other than the line declaring it — which is the property '
    + 'the dead three failed, and a requested name nothing implements reddens by name rather than '
    + 'printing as active',
    `registry ${IMPLEMENTED.length} · occurrences `
    + `${JSON.stringify(wired.map((w) => `${w.name}×${w.sites}`))} · declared-but-unwired `
    + `${JSON.stringify(unwired)} · requested-but-INERT ${JSON.stringify(inert)}`,
    IMPLEMENTED.length > 0 && unwired.length === 0 && inert.length === 0);
}

// ═══ W10 — THE ROW GRAMMAR HAS THREE LIVE SPELLINGS AND BOTH ITS READERS ARE KEYED ON ONE ════════
//
// Found by adopting `renderTail`, which is the lib's own "convenience: the whole tail a round
// prints" and which THIS FILE IS THE FIRST CALLER OF — censused below, not assumed. Two things came
// out of that adoption and they are different defects:
//
//   a. `renderTail({legs, preds})` passes `preds` to `renderVerdict` (so they reach the verdict
//      line's lists) but calls `renderRows(legs)` — so a PREDICTION's `what` is accepted by the API
//      and silently discarded. Drive 4 of this round published `refuted=[Q1]` with the figure it
//      was scored on appearing nowhere. A refuted prediction with no reason in the recording.
//   b. The two readers that read leg ROWS are each keyed on a spelling the lib does not emit, and
//      one of them is keyed on a spelling NOTHING emits.
// ═════════════════════════════════════════════════════════════════════════════════════════════════
{
  // Both readers SLICED from their own pinned sources by anchor and compiled — never retyped
  // (447/363). A divergence between my copy and theirs is unrepresentable.
  // Drive 5 keyed this on the regex following the anchor IMMEDIATELY, and both slices came back
  // NOT FOUND — the regex is nested inside an arrow body (`const legLines = (t) => … /re/.test(l)`),
  // several tokens in. The leg REFUSED rather than reporting a grammar divergence off two null
  // readers, which is the only reason the wrong key was visible at all (436). Re-keyed: the
  // statement is sliced from the anchor to the end of its line, and the FIRST regex literal in that
  // span is lifted out of it. Still a slice, never a retype.
  const sliceRe = (rel, anchor) => {
    const src = git('show', `${REV}:${rel}`);
    const i = src.indexOf(anchor);
    if (i === -1) return null;
    // Drive 6 keyed the span as "anchor to end of LINE" and the 448 slice came back NOT FOUND
    // AGAIN: its regex is three lines below its own `const legTokens = `, inside a block body. The
    // row I was looking for became the terminator of the window I was looking in (420). The span is
    // now the whole STATEMENT, found by brace/paren balance over the BLINDED source — so a regex
    // literal containing a brace cannot end the scan — and sliced out of the raw.
    const blind = stripSource(src, true);
    let d = 0;
    let j = i;
    for (; j < blind.length; j += 1) {
      const c = blind[j];
      if ('(['.includes(c) || c === '{') d += 1;
      else if (')]'.includes(c) || c === '}') d -= 1;
      else if (c === ';' && d === 0) break;
    }
    const stmt = src.slice(i, j);
    const m = /(\/(?:[^/\\\n[]|\\.|\[(?:[^\]\\]|\\.)*\])+\/[gimsuy]*)/.exec(stmt);
    if (m === null) return null;
    try {
      // eslint-disable-next-line no-new-func
      return { text: m[1], re: new Function(`return ${m[1]};`)() };
    } catch { return null; }
  };
  const r446 = sliceRe('docs/research/round446-instruments/grade-my-own-oracle-predicate.mjs', 'const legLines = ');
  const r448 = sliceRe('docs/research/round448-instruments/record-cripples.mjs', 'const legTokens = ');

  // Is this file really the first caller of `renderTail`? Censused over the population, not
  // assumed — and keyed on the IMPORT rather than on the token, because the token occurs in
  // `verdict.mjs` itself as its own `export function renderTail(` declaration, which drive 5
  // counted as a caller and reported as `1`.
  const tailImporters = POP.filter((f) => {
    const blind = stripSource(git('show', `${REV}:${f}`), false);
    return /import\s*\{[^}]*\brenderTail\b[^}]*\}\s*from/.test(blind);
  });

  // (a) — does `renderTail` publish a prediction's detail? Driven through the lib itself, with a
  // detail string that cannot occur by accident, rather than read off its source.
  const probe = renderTail({
    legs: [{ id: 'KPLEG', ok: true, what: 'LEG-DETAIL-SENTINEL' }],
    preds: [{ id: 'KPPRED', landed: false, what: 'PRED-DETAIL-SENTINEL' }],
  });
  const legDetailPublished = probe.includes('LEG-DETAIL-SENTINEL');
  const predDetailPublished = probe.includes('PRED-DETAIL-SENTINEL');
  const predIdInVerdict = /refuted=\[KPPRED\]/.test(probe);

  // (b) — the confusion matrix. Members are SELECTED BY THE CELL'S OWN PREDICATE over committed
  // recordings, never by a hand-typed filename (448 §4.1 — a cell defined by a property must not be
  // populated by a name), and each cell's size is printed.
  const outs = git('ls-tree', '-r', '--name-only', '-z', REV, 'docs/').split('\0')
    .filter((f) => f.endsWith('.out'));
  const countWith = (re, text) => (re === null ? null
    : text.split('\n').filter((l) => new RegExp(re.source, re.flags.replace('g', '')).test(l)).length);
  const rows = [];
  for (const f of outs) {
    const text = git('show', `${REV}:${f}`);
    const v = readVerdictLib(text);
    if (v.ok !== true) continue; // a recording with no readable verdict line has no count to agree with
    rows.push({
      f,
      legs: v.verdict.legs,
      by446: countWith(r446?.re ?? null, text),
      by448: countWith(r448?.re ?? null, text),
      red: v.verdict.red.length,
    });
  }
  // The lib's OWN grammar, rendered by the lib, read by both readers. This is the row my adoption
  // of `renderRows` produces, and there is no committed recording of it yet — so it is rendered
  // here rather than hand-typed.
  const libRows = renderRows([{ id: 'W1', ok: true, what: 'x' }, { id: 'W2', ok: false, what: 'y' },
    { id: 'W3', ok: null, what: 'z' }]).join('\n');
  const libBy446 = countWith(r446?.re ?? null, libRows);
  const libBy448 = countWith(r448?.re ?? null, libRows);

  // The row-token VOCABULARY, censused rather than inferred from two readers' source. A line is a
  // candidate row if its second whitespace-separated token is an upper-case leg id; the token in
  // front of it is the spelling. This is how many spellings are actually live, measured — my first
  // write-up of this leg said "three" from reading the two readers, and `round442/drive2.out` reads
  // 9 of 9 under the `FAIL` reader, which that account cannot explain.
  const vocab = new Map();
  for (const r of rows) {
    for (const l of git('show', `${REV}:${r.f}`).split('\n')) {
      const m = /^(\S{1,8}|\s?\S{1,7})\s+([A-Z][A-Z0-9]{0,3})\s\s/.exec(l);
      if (m === null) continue;
      const tok = m[1].trim();
      if (!/^[A-Za-z]+$/.test(tok)) continue;
      if (!vocab.has(tok)) vocab.set(tok, { recs: new Set(), line: l });
      vocab.get(tok).recs.add(r.f);
    }
  }
  // Which spellings does each sliced reader actually cover? Each reader is RUN against a REAL
  // committed row line carrying that spelling — not against a row I synthesise. The synthesised
  // version of this reported that neither reader covers `ok`, because it padded the token on the
  // right (`'ok  '`) and the emitters pad it on the LEFT (`' ok '`). A hand-typed exemplar is not a
  // slice (417), and the four-character padded tag is the exact shape that has cost this round
  // track a cell before (441 §3).
  const covers = (re) => (re === null ? null : [...vocab.entries()]
    .filter(([, v]) => new RegExp(re.source, re.flags.replace('g', '')).test(v.line))
    .map(([t]) => t));
  const vocabRows = [...vocab.entries()].map(([t, v]) => `${t}(${v.recs.size} rec)`).sort();
  const cover446 = covers(r446?.re ?? null);
  const cover448 = covers(r448?.re ?? null);

  const agree448 = rows.filter((r) => r.by448 === r.legs);
  const disagree448 = rows.filter((r) => r.by448 !== r.legs);
  // The exemplar-independent figure, and the one that decides the finding: does each reader's row
  // count agree with the leg count the SAME recording's own verdict line publishes? `covers` above
  // depends on which recording happened to supply the exemplar for a spelling, so it can only
  // suggest; this reads every member end to end.
  const agree446 = rows.filter((r) => r.by446 === r.legs).length;
  const bothAgree = rows.filter((r) => r.by446 === r.legs && r.by448 === r.legs).length;
  const neitherAgrees = rows.filter((r) => r.by446 !== r.legs && r.by448 !== r.legs).length;
  // A RED row in HIS grammar: does the 446 reader, which spells the false token `FAIL`, see it?
  const withRed = rows.filter((r) => r.red > 0);
  const redSeenBy446 = withRed.map((r) => ({ f: r.f, legs: r.legs, by446: r.by446 }));

  const readable = r446 !== null && r448 !== null;
  const ok = readable
    // The matrix must be SEPARATING: both the agreeing and the disagreeing cell occupied, or this
    // leg is a known positive with no control (424).
    // SEPARATING: both cells occupied. This conjunct was `disagree448.length >= 0` — which is true
    // of every possible value, i.e. dead code printed beside the figure it was supposed to guard
    // (409). A matrix with an empty disagreeing cell is a known positive with no finding in it.
    && agree448.length > 0 && disagree448.length > 0
    // The lib's own grammar must be unreadable to at least one of the two row readers, which is
    // the defect; and the lib must publish a leg's detail but not a prediction's, which is (a).
    && libBy448 === 0 && legDetailPublished && !predDetailPublished && predIdInVerdict;
  leg('W10', 'THE ROW VOCABULARY IS WIDER THAN EITHER OF ITS TWO READERS, AND `renderTail` DROPS A '
    + 'PREDICTION\'S DETAIL — found by being the first caller of the lib\'s own convenience '
    + 'function. MY FIRST WRITE-UP OF THIS LEG SAID "three spellings, and 446 is keyed on `FAIL` '
    + 'which neither emitter produces"; the census below refutes both halves and is what is '
    + 'published. `FAIL` IS live, in 2 recordings. MY SECOND WRITE-UP WAS WRONG TOO — it said '
    + '"each reader is blind to a spelling the other reads", and running both against real exemplar '
    + 'lines makes 448\'s coverage a SUBSET of 446\'s rather than a mirror of it. So what this leg '
    + 'publishes is the one figure that does not depend on which recording happened to supply an '
    + 'exemplar: each reader\'s row count against the leg count THE SAME RECORDING\'S OWN verdict '
    + 'line publishes, read end to end over every member. Both readers are also blind to the lib\'s '
    + 'own unpadded `LEG <id> <tok>`, which is what an adopting round emits. Both are SLICED from '
    + 'their pinned sources and compiled, never retyped (447/363), and every member is selected by '
    + 'the cell\'s own predicate over committed recordings (448 §4.1)',
    `files in the population that IMPORT renderTail (this one excluded as self): `
    + `${tailImporters.length} ${JSON.stringify(tailImporters)} · `
    + `leg detail published by renderTail: ${legDetailPublished} · PREDICTION detail published: `
    + `${predDetailPublished} · but the prediction id reaches the verdict line: ${predIdInVerdict}\n`
    + `        446 reader sliced: ${r446?.text ?? 'NOT FOUND'}\n`
    + `        448 reader sliced: ${r448?.text ?? 'NOT FOUND'}\n`
    + `        committed .out recordings with a readable verdict line: ${rows.length}\n`
    + `        ROW-TOKEN VOCABULARY, censused over those recordings: ${vocab.size} spelling(s) `
    + `${JSON.stringify(vocabRows)}\n`
    + `        spellings each reader matches ON ONE REAL EXEMPLAR LINE (suggestive only — which `
    + `recording supplied the exemplar is a confound): 446 ${JSON.stringify(cover446)} · 448 `
    + `${JSON.stringify(cover448)}\n`
    + `        AGREEMENT WITH THE RECORDING'S OWN PUBLISHED LEG COUNT, read end to end over all `
    + `${rows.length}: 446 agrees ${agree446} · 448 agrees ${agree448.length} · both `
    + `${bothAgree} · NEITHER ${neitherAgrees}\n`
    + `        cell [448 row count === verdict legs]  AGREE ${agree448.length}  DISAGREE `
    + `${disagree448.length}\n`
    + agree448.slice(0, 2).map((r) => `          AGREE    legs=${r.legs} by448=${r.by448} by446=${r.by446}  ${r.f}`).join('\n')
    + (disagree448.length ? `\n${disagree448.slice(0, 2).map((r) => `          DISAGREE legs=${r.legs} by448=${r.by448} by446=${r.by446}  ${r.f}`).join('\n')}` : '')
    + `\n        THE LIB'S OWN ROWS, rendered by renderRows and read by both: by446=${libBy446} `
    + `by448=${libBy448} of 3 rows — a recording that adopts the lib is INVISIBLE to the cripple `
    + `grader that reads rows\n`
    + `        recordings carrying a RED leg, as counted by the 446 reader (which spells it `
    + `\`FAIL\`): ${JSON.stringify(redSeenBy446.slice(0, 3))}`,
    readable ? ok : null);
}

// ═══ PREDICTIONS ═════════════════════════════════════════════════════════════════════════════════
{
  const residue = size('UNMODELLED') + size('AMBIGUOUS');
  const share = sites.length === 0 ? null : residue / sites.length;
  pred('Q1', Q1_CLAIM,
    `residue ${residue} of ${sites.length} sites = ${share === null ? 'REFUSED' : `${(share * 100).toFixed(1)}%`}`
    + ` · minority: ${share === null ? 'n/a' : share < 0.5}`,
    share === null ? null : share < 0.5);
}
{
  const OLD_REL = 'docs/research/round441-instruments/key-the-silent-class-from-source.mjs';
  const oldSrc = git('show', `${REV}:${OLD_REL}`);
  const anchor = 'const re = ';
  const i = oldSrc.indexOf(anchor);
  const reText = i === -1 ? null : oldSrc.slice(i + anchor.length, oldSrc.indexOf('\n', i)).replace(/;\s*$/, '');
  let oldSize = null;
  if (reText !== null && /^\/.*\/[gimsuy]*$/.test(reText)) {
    // eslint-disable-next-line no-new-func
    const oldRe = new Function(`return ${reText};`)();
    const s = new Set();
    for (const f of POP) {
      const src = git('show', `${REV}:${f}`);
      const re2 = new RegExp(oldRe.source, oldRe.flags);
      let m;
      while ((m = re2.exec(src)) !== null) {
        const rel = m[1] === 'HERE' ? join(dirname(f), m[3]) : m[3];
        if (TRACKED_AT_REV.has(rel)) s.add(rel);
      }
    }
    oldSize = s.size;
  }
  pred('Q2', Q2_CLAIM,
    `old tracked distinct paths at ${SHORT}: ${oldSize === null ? 'REFUSED' : oldSize} · mine: `
    + `${trackedMembers.length} · strict superset: `
    + `${oldSize === null ? 'REFUSED' : trackedMembers.length > oldSize}`,
    oldSize === null ? null : trackedMembers.length > oldSize);
}

console.log(`REV: ${SHORT}   crippled: ${crippled.length === 0 ? 'none' : crippled.join(',')}`);
console.log('');
console.log(renderTail({ legs, preds }));
