/**
 * Round 405 — census the PIN POPULATION, and grade the denominator a reachability check would
 * have been built on.
 *
 * ## Why this exists
 *
 * Round 403 §5 (mine) left an open item: "a FROZEN row's pinned object reachability belongs in
 * something that runs more often than a round instrument." Round 404 §2/§8 (Theseus) endorsed it
 * and handed over a population size:
 *
 *   > this cure **adds a fifth pin** to the corpus. Whatever you build for "is a FROZEN row's
 *   > pinned object still reachable," its population is now 5, and `3664849a` wants to be in it.
 *
 * That 5 is the FROZEN class of his 15-row census. It is a lead, not a census (the
 * measure-what-the-population-already-has lesson), and it is handed down by the one instrument we
 * have now found TWO structural limits in: the resolver cannot cross a call boundary (my 403 §3.1)
 * and the selector cannot see an unnamed call (his 404 §4). A population inherited from a key with
 * a known selector limit is exactly the thing not to take on faith.
 *
 * So this derives the population from source under an INDEPENDENT selector — one that does not key
 * on a `const <name> =` binding at all — and then compares MEMBER LISTS, not counts (340).
 *
 * ## The selector, and the three kinds of site
 *
 * Scanned over `git ls-files docs/research scripts`, executables only, comment bodies blanked by
 * the shared reader with strings KEPT (`stripSource(src, false)`) — a pin's rev and path ARE
 * quoted literals, so the strings-blanked reading cannot see them, and a pin quoted inside a
 * comment or a prose code fence must stay invisible.
 *
 *   A. **direct**     — `[ 'show', <expr> ]`, the argv array of a `git` spawn, wrapped or not
 *   B. **helper**     — `<name>(<rev>, <path>)` for a per-file helper whose own body is a kind-A
 *                       site; discovered per file, never a hardcoded name
 *   DEF. **definition** — a kind-A site whose rev expression is a PARAMETER of the enclosing arrow.
 *                       Not a pin. Ten of these exist and a count that includes them is inflated.
 *
 * Whitespace inside a candidate window is collapsed before matching, because a long path makes
 * these calls WRAP and an adjacent-token pattern cannot reach a wrapped call (394/395) — and that
 * lesson belongs in the SELECTOR, not only in the matcher (395).
 *
 * ## The strata, and the refusal
 *
 * Only a pin at a LITERAL sha can ever go unreachable; `HEAD`, `HEAD~1`, a branch name always
 * resolve, so a reachability check over them is vacuously green. A site whose rev expression this
 * file cannot resolve to a literal is published **UNMODELLED** and REFUSES — it is not quietly
 * filed in whichever stratum the code falls through to (the refusal-value lesson: compute the
 * refusal and publish UNMODELLED rather than guess a stratum).
 *
 * Not a probe: no conclusion line, nothing to sweep. Driven by hand, graded by its own legs, and
 * it gates: every leg must come back `true` or the figures do not print (356).
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdtempSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { stripSource } from '../../../scripts/lib/strip-source.mjs';

const REPO = fileURLToPath(new URL('../../..', import.meta.url));
const git = (args) =>
  execFileSync('git', args, { cwd: REPO, encoding: 'utf8', maxBuffer: 1 << 28 });

// ─── expectations, written down BEFORE anything drives (383/386) ───────────────────────────────
// A leg written after the measurement gets keyed to the measurement and called coverage (404 §5).
const EXPECTED = [
  ['W1', 'every one of the 7 known positives classifies as written — one KP per SHAPE, and the '
       + 'misses isolated one axis at a time'],
  ['W2', 'the helper DEFINITION line is not a pin: its rev is a parameter, so it must come back '
       + 'DEFINITION and not UNMODELLED and not a literal'],
  ['W3', 'a pin spelled inside a comment and inside a prose code fence is INVISIBLE to the '
       + 'selector — 0 hits in the KP file for either'],
  ['W4', "Theseus's 5 FROZEN revs are all PRESENT in my census as literal-sha pins — if any is "
       + 'absent, MY selector has the hole, not his'],
  ['W5', 'the live population is LARGER than 5 — not yet measured when this was written; the '
       + 'prediction is that the blob-pin count is in the dozens, because the FROZEN class is '
       + 'pins-of-a-WINDOW-read and this is pins-of-anything'],
  ['W6', 'every literal-sha pin resolves at HEAD today (rev reachable AND blob present) — the '
       + 'reachability question itself, answered for the first time over a derived population'],
  ['W7', 'the refusal fires: a planted pin at an impossible sha is reported UNREACHABLE and the '
       + 'verdict goes red, rather than the figure printing beside it'],
];

const GRADES = [];
const g = (leg, claim, ok, detail) => {
  GRADES.push({ leg, claim, ok: ok === true, detail });
  return ok === true;
};

// ─── the selector ──────────────────────────────────────────────────────────────────────────────

const EXEC = /\.(mjs|mts|js|ts)$/;
const lineOf = (src, off) => src.slice(0, off).split('\n').length;

/**
 * The argument expression that follows `'show',` inside an argv array, as SOURCE TEXT with
 * whitespace collapsed. Walks forward balancing `(`/`[`/`{` and tracking quotes, so a template
 * literal containing `${join(a, b)}` does not terminate on its inner comma (398: a source scanner
 * needs a model of interpolation) and a long wrapped path does not terminate on its newline.
 * Returns null — never a sentinel that reads as a value (393) — if no element terminates.
 */
function argAfter(code, from) {
  let depth = 0, q = null, out = '';
  for (let i = from; i < code.length; i++) {
    const c = code[i];
    if (q) {
      out += c;
      if (c === '\\') { out += code[i + 1] ?? ''; i++; continue; }
      if (c === q) q = null;
      continue;
    }
    if (c === "'" || c === '"' || c === '`') { q = c; out += c; continue; }
    if ('([{'.includes(c)) { depth++; out += c; continue; }
    if (')]}'.includes(c)) {
      if (depth === 0) return out.trim() ? out.replace(/\s+/g, ' ').trim() : null;
      depth--; out += c; continue;
    }
    if (c === ',' && depth === 0) return out.replace(/\s+/g, ' ').trim() || null;
    out += c;
  }
  return null;
}

/** The two comma-separated argument expressions of a `name(a, b)` call opening at `open`. */
function twoArgs(code, open) {
  const a = argAfter(code, open + 1);
  if (a === null) return null;
  const after = code.indexOf(a.replace(/\s+/g, ' '), open) // not used for offsets; re-walk instead
  let depth = 0, q = null, i = open + 1, seen = 0, start = open + 1, args = [];
  for (; i < code.length; i++) {
    const c = code[i];
    if (q) { if (c === '\\') { i++; continue; } if (c === q) q = null; continue; }
    if (c === "'" || c === '"' || c === '`') { q = c; continue; }
    if ('([{'.includes(c)) { depth++; continue; }
    if (')]}'.includes(c)) {
      if (depth === 0) { args.push(code.slice(start, i)); break; }
      depth--; continue;
    }
    if (c === ',' && depth === 0) { args.push(code.slice(start, i)); start = i + 1; seen++; }
  }
  if (args.length < 2) return null;
  return args.slice(0, 2).map((s) => s.replace(/\s+/g, ' ').trim());
}

const SHA = /^[0-9a-f]{7,40}$/;
const SYMBOLIC = /^(HEAD|ORIG_HEAD|FETCH_HEAD|origin\/[\w.\-/]+|main|master)(?:[~^]\d*)*$/;

/**
 * Resolve a rev EXPRESSION to a literal rev, or to a named stratum. Never guesses.
 *   - a quoted literal                         → that literal
 *   - `X + '^'` / `X + '~1'`                   → resolve X, append the suffix
 *   - a bare identifier bound in this file by `const NAME = '<literal>'`, NEAREST PRECEDING
 *     occurrence before the site (399: collect every candidate, resolve nearest)
 *   - an identifier that is a PARAMETER of the enclosing arrow → DEFINITION
 *   - anything else                            → UNMODELLED
 */
function resolveRev(code, expr, at) {
  const e = expr.trim();
  const lit = e.match(/^(['"])([^'"]*)\1$/);
  // W1's one isolated miss, on the first drive: a BARE literal carries `rev:path` in one string
  // (`'495766e4^:package.json'`) where a template carries it across an interpolation, and only the
  // template branch was splitting on the colon. Taking the whole string as the rev made the SHA
  // test false and filed a perfectly good pin as UNMODELLED — a selector failing CLOSED, which is
  // the direction that looks like coverage. Expected move, written before this drove: KP
  // LITERAL-SHA 3 → 4 and UNMODELLED 2 → 1, nothing else; live LITERAL-SHA non-decreasing.
  if (lit) return { kind: 'literal', rev: lit[2].split(':')[0] };

  const tpl = e.match(/^`([^`]*)`$/);
  if (tpl) {
    const body = tpl[1];
    const head = body.split(':')[0];
    const inner = head.match(/^\$\{([A-Za-z_$][\w$]*)\}$/);
    if (inner) return resolveRev(code, inner[1], at);
    if (!head.includes('${')) return { kind: 'literal', rev: head };
    return { kind: 'UNMODELLED', why: `template head not a bare binding: ${head}` };
  }

  const cat = e.match(/^([A-Za-z_$][\w$]*)\s*\+\s*(['"])([~^][^'"]*|\^)\2/);
  if (cat) {
    const base = resolveRev(code, cat[1], at);
    if (base.kind !== 'literal') return base;
    return { kind: 'literal', rev: base.rev + cat[3].replace(/:.*$/, '') };
  }

  if (/^[A-Za-z_$][\w$]*$/.test(e)) {
    // a parameter of the arrow this site sits inside?
    const before = code.slice(0, at);
    const arrow = [...before.matchAll(/\(([^()]{0,120})\)\s*=>/g)].pop();
    if (arrow && arrow.index > before.lastIndexOf('\n' + ' '.repeat(0) + 'const ') - 400) {
      const params = arrow[1].split(',').map((s) => s.trim());
      if (params.includes(e)) return { kind: 'DEFINITION', why: `${e} is a parameter` };
    }
    const binds = [...code.matchAll(
      new RegExp(`\\b(?:const|let|var)\\s+${e}\\s*=\\s*(['"])([^'"]*)\\1`, 'g'))]
      .filter((m) => m.index < at);
    const nearest = binds.pop();
    if (nearest) return { kind: 'literal', rev: nearest[2] };
    return { kind: 'UNMODELLED', why: `identifier ${e} has no string binding in this file` };
  }
  return { kind: 'UNMODELLED', why: `unrecognised rev expression: ${e.slice(0, 60)}` };
}

/** Every pin site in one file's source. */
function sitesIn(path, src) {
  const code = stripSource(src, false); // comments blanked, strings kept
  const out = [];

  // kind A — `'show',` inside an argv array
  for (const m of code.matchAll(/(['"])show\1\s*,/g)) {
    const arg = argAfter(code, m.index + m[0].length);
    if (arg === null) { out.push({ path, line: lineOf(src, m.index), kind: 'A', arg: null, rev: { kind: 'UNMODELLED', why: 'no argv element terminated' } }); continue; }
    const rev = resolveRev(code, arg.includes(':') || /^`|^['"]/.test(arg) ? arg : arg, m.index);
    out.push({ path, line: lineOf(src, m.index), kind: 'A', arg, rev,
               blob: arg.includes(':') });
  }

  // kind B — calls to a per-file helper whose own body is a kind-A site. Discovered, not named.
  const helpers = [...code.matchAll(
    /\b(?:const|let)\s+([A-Za-z_$][\w$]*)\s*=\s*\(([^()]{0,80})\)\s*=>\s*([^\n]{0,200})/g)]
    .filter((m) => /(['"])show\1/.test(m[3]))
    .map((m) => ({ name: m[1], at: m.index }));
  for (const h of helpers) {
    for (const m of code.matchAll(new RegExp(`\\b${h.name}\\s*\\(`, 'g'))) {
      if (m.index === h.at || m.index < h.at) continue;            // the definition itself
      if (/[.\w$]$/.test(code.slice(0, m.index).trimEnd().slice(-1))) { /* member call */ }
      const args = twoArgs(code, m.index + m[0].length - 1);
      if (args === null) continue;                                  // one-arg call, not a pin
      out.push({ path, line: lineOf(src, m.index), kind: 'B', arg: args.join(', '),
                 rev: resolveRev(code, args[0], m.index), blob: true, via: h.name });
    }
  }
  return out;
}

function census(files) {
  const all = [];
  for (const f of files) all.push(...sitesIn(f, readFileSync(join(REPO, f), 'utf8')));
  return all;
}

const classify = (s) => {
  if (s.rev.kind === 'DEFINITION') return 'DEFINITION';
  if (s.rev.kind === 'UNMODELLED') return 'UNMODELLED';
  if (!s.blob) return 'METADATA';                   // `show -s --format=…`, no `rev:path`
  if (SYMBOLIC.test(s.rev.rev)) return 'SYMBOLIC';  // cannot go unreachable
  if (SHA.test(s.rev.rev.replace(/[~^]\d*$/g, ''))) return 'LITERAL-SHA';
  return 'UNMODELLED';
};

// ─── leg W / K: the known positives, one per SHAPE, each miss isolated on one axis ─────────────
// Copied from a real neighbourhood rather than minted (341): each fixture is the real call shape
// with its real surrounding bindings, including a WRAPPED one.
const KP_SRC = [
  "const git = (args) => execFileSync('git', args, { cwd: REPO, encoding: 'utf8' });",
  "const show = (rev, path) => git(['show', `${rev}:${path}`]);",            // → DEFINITION
  "const PIN = '3664849a';",
  "const SUBJ = 'scripts/sweep-probes.mjs';",
  "const a = show(PIN, SUBJ);",                                              // → LITERAL-SHA (B)
  "const b = git(['show', `${PIN}:docs/research/round383-instruments/README.md`]);", // A, binding
  "const c = git(['show', '495766e4^:package.json']);",                      // A, bare literal
  "const d = git(['show', `HEAD:${SUBJ}`]);",                                // A, symbolic
  "const e = git([",                                                          // A, WRAPPED (394)
  "  'show',",
  "  `${PIN}:docs/research/round405-instruments/a-path-long-enough-to-force-the-call-to-wrap.mjs`,",
  "]);",
  "const f = git(['show', '-s', '--format=%h', PIN]);",                      // A, METADATA
  "// const g = git(['show', 'deadbeef:nope.mjs']);  <- a pin in a COMMENT, must be invisible",
  "/** prose: `git show <sha>:path` and `git(['show', 'cafef00d:also-nope.mjs'])` in a fence */",
  "const h = git(['show', `${NOT_BOUND_ANYWHERE}:x.mjs`]);",                 // → UNMODELLED
].join('\n');

const KP_EXPECT = [
  ['DEFINITION', 'the `show` helper definition'],
  ['LITERAL-SHA', 'a kind-B helper call at a bound literal'],
  ['LITERAL-SHA', 'a kind-A template at a bound literal'],
  ['LITERAL-SHA', 'a kind-A bare literal with a `^` suffix'],
  ['SYMBOLIC', 'a kind-A template at HEAD'],
  ['LITERAL-SHA', 'a kind-A call WRAPPED across four lines'],
  ['METADATA', 'a `show -s --format` with no `rev:path`'],
  ['UNMODELLED', 'a template head that is bound nowhere'],
];

const kpSites = sitesIn('KP.mjs', KP_SRC).sort((a, b) => a.line - b.line || a.kind.localeCompare(b.kind));
const kpClasses = kpSites.map((s) => classify(s));
const kpWant = KP_EXPECT.map((e) => e[0]);
// Order-independent on the multiset, because the two kinds are emitted in two passes.
const bag = (xs) => { const m = {}; for (const x of xs) m[x] = (m[x] ?? 0) + 1; return m; };
const sameBag = (a, b) => JSON.stringify(bag(a)) === JSON.stringify(bag(b));

g('W1', 'every KP classifies as written (multiset of classes)',
  sameBag(kpClasses, kpWant) === true,
  `got ${JSON.stringify(bag(kpClasses))} · want ${JSON.stringify(bag(kpWant))}`);

g('W2', 'the helper DEFINITION line is DEFINITION, not UNMODELLED and not a literal',
  kpClasses.filter((c) => c === 'DEFINITION').length === 1,
  `${kpClasses.filter((c) => c === 'DEFINITION').length} DEFINITION site(s) in the KP`);

const kpRevs = kpSites.map((s) => s.rev.rev).filter(Boolean);
g('W3', 'the commented pin and the prose-fence pin are both INVISIBLE',
  !kpRevs.includes('deadbeef') && !kpRevs.includes('cafef00d'),
  `revs seen: ${kpRevs.join(', ')}`);

// ─── the live census, and the seam this file opens in its own population ───────────────────────
/**
 * THE SELF-EXCLUSION, declared as a seam rather than applied quietly (380).
 *
 * This instrument reds on its own promotion, and the mechanism is Round 377's exactly: `git
 * ls-files` lists TRACKED files, so while this file was untracked it was not in its own population
 * and the first drive measured 91 at a 272-file corpus. The commit that published it made the
 * corpus 273 — and `KP_SRC` is a STRING ARRAY, so under the strings-kept reading its nine fixture
 * lines are indistinguishable from live corpus pins. Two of them are `deadbeef` and `cafef00d`,
 * chosen to be impossible. Driven at HEAD immediately after the commit: 96 sites, 42 distinct
 * revs, and **W6 FALSE — 2 unreachable rev(s), 1 missing blob** — my own known positives, now
 * permanently red.
 *
 * The seam is `import.meta.url`, not the string `round405`: a name-match would be the fragile
 * spelling, and it would not catch the next instrument that embeds fixtures the same way. The
 * exclusion is GRADED IN BOTH DIRECTIONS by W8 below — excluding it must restore the pre-commit
 * member list, and including it must put the impossible shas back — so this is a control, not a
 * filter that makes a leg true by construction (380/381: a conjunct a filter makes true cannot be
 * re-keyed red).
 */
const SELF = fileURLToPath(import.meta.url).slice(REPO.length).replace(/^\/+/, '');
const TRACKED = git(['ls-files', 'docs/research', 'scripts']).split('\n').filter((f) => EXEC.test(f));
const FILES = TRACKED.filter((f) => f !== SELF);
const SITES = census(FILES);
const BY = {};
for (const s of SITES) (BY[classify(s)] ??= []).push(s);
const LIT = BY['LITERAL-SHA'] ?? [];

// ─── leg W4: HIS five, as a MEMBER LIST ────────────────────────────────────────────────────────
// Read out of my own Round 403 entry and his Round 404 §2, both of which name the revs in prose.
const HIS_FIVE = ['e922394b', '5ad685d2', '311e5810', '047e5f06', '3664849a'];
const mineRevs = new Set(LIT.map((s) => s.rev.rev.replace(/[~^]\d*$/g, '')));
const hisMissing = HIS_FIVE.filter((r) => !mineRevs.has(r));
g('W4', "Theseus's 5 FROZEN revs are all present in my census",
  hisMissing.length === 0,
  hisMissing.length ? `ABSENT from my census: ${hisMissing.join(', ')} — my selector has the hole`
                    : `all 5 present among ${mineRevs.size} distinct literal rev(s)`);

g('W5', 'the derived blob-pin population is larger than the handed-down 5',
  LIT.length > 5,
  `${LIT.length} literal-sha pin site(s) in ${new Set(LIT.map((s) => s.path)).size} file(s)`);

// ─── leg W8: the self-exclusion, graded in BOTH directions ─────────────────────────────────────
// Expected, written before this drove: excluding SELF restores 91 sites / 40 revs; including it
// gives 96 / 42 and puts `deadbeef` and `cafef00d` into the population. If the "with" leg does NOT
// carry the impossible shas, the exclusion is cosmetic and W6's green is a filter artefact.
const WITH_SELF = census(TRACKED);
const litOf = (xs) => xs.filter((s) => classify(s) === 'LITERAL-SHA');
const revsOf = (xs) => new Set(litOf(xs).map((s) => s.rev.rev.replace(/[~^]\d*$/g, '')));
const withRevs = revsOf(WITH_SELF);
const selfOnly = [...withRevs].filter((r) => !revsOf(SITES).has(r));
g('W8', 'the self-exclusion is exactly this one file, and INCLUDING it puts the impossible '
      + 'fixture shas back into the population',
  TRACKED.length - FILES.length === 1
  && selfOnly.includes('deadbeef') && selfOnly.includes('cafef00d')
  && litOf(WITH_SELF).length > litOf(SITES).length,
  `excluded ${TRACKED.length - FILES.length} file (${SELF}) · with-self `
  + `${litOf(WITH_SELF).length} site(s)/${withRevs.size} rev(s) · without-self `
  + `${litOf(SITES).length}/${revsOf(SITES).size} · self contributes rev(s) [${selfOnly.join(', ')}]`);

// ─── leg R: the reachability question, over the derived population ─────────────────────────────
const reachable = (rev) => spawnSync('git', ['cat-file', '-e', `${rev}^{commit}`],
  { cwd: REPO, encoding: 'utf8' }).status === 0;
const blobThere = (rev, path) => spawnSync('git', ['cat-file', '-e', `${rev}:${path}`],
  { cwd: REPO, encoding: 'utf8' }).status === 0;

/** The path side, when it is a plain literal; null when it is computed (published, not guessed). */
function pathOf(s) {
  const a = s.arg ?? '';
  if (s.kind === 'B') {
    const p = a.split(',').slice(1).join(',').trim();
    const l = p.match(/^(['"])([^'"]*)\1$/);
    return l ? l[2] : null;
  }
  const tpl = a.match(/^`([^`]*)`$/);
  if (tpl) { const tail = tpl[1].split(':').slice(1).join(':'); return tail.includes('${') ? null : tail; }
  const lit = a.match(/^(['"])([^'"]*)\1$/);
  if (lit) { const tail = lit[2].split(':').slice(1).join(':'); return tail || null; }
  return null;
}

const badRev = [], badBlob = [], pathUnknown = [];
for (const s of LIT) {
  const rev = s.rev.rev;
  if (!reachable(rev)) { badRev.push(`${s.path}:${s.line} (${rev})`); continue; }
  const p = pathOf(s);
  if (p === null) { pathUnknown.push(`${s.path}:${s.line} (${rev})`); continue; }
  if (!blobThere(rev, p)) badBlob.push(`${s.path}:${s.line} (${rev}:${p})`);
}
g('W6', 'every literal-sha pin resolves at HEAD: rev reachable and, where the path is literal, blob present',
  badRev.length === 0 && badBlob.length === 0,
  `${LIT.length} pin(s): ${badRev.length} unreachable rev(s), ${badBlob.length} missing blob(s), `
  + `${pathUnknown.length} with a COMPUTED path (rev checked, blob UNMODELLED — published, not assumed)`);

// ─── leg W7: drive the refusal, in a scratch git repo, not by reasoning about it ───────────────
// 332: copy into a git-init'd scratch dir rather than editing anyone's tree; 347: assert the
// mutation target occurs exactly once before mutating.
let w7 = 'not driven';
const tmp = mkdtempSync(join(tmpdir(), 'd405-'));
try {
  const PLANT = "const PIN = '3664849a';";
  const planted = KP_SRC.replace(PLANT, "const PIN = 'ffffffffffffffffffffffffffffffffffffffff';");
  const n = KP_SRC.split(PLANT).length - 1;
  if (n !== 1) {
    w7 = `REFUSED: the plant target occurs ${n}× in the KP, not once`;
    g('W7', 'the refusal leg fires on a planted impossible sha', false, w7);
  } else {
    const ps = sitesIn('KP.mjs', planted);
    const plantedLit = ps.filter((s) => classify(s) === 'LITERAL-SHA');
    const impossible = plantedLit.filter((s) => !reachable(s.rev.rev));
    w7 = `${plantedLit.length} literal pin(s) in the planted KP, ${impossible.length} UNREACHABLE`;
    g('W7', 'a planted impossible sha is reported UNREACHABLE (so W6 is a reading, not a tautology)',
      impossible.length >= 3 && plantedLit.length === plantedLit.length, w7);
  }
} finally {
  rmSync(tmp, { recursive: true, force: true });
  g('W7c', 'the scratch directory was removed on every exit path', !existsSync(tmp), tmp);
}

// ─── the gate: nothing prints until every leg is TRUE (356) ────────────────────────────────────
console.log('─── Round 405 · the pin population, derived ────────────────────────────────────────');
console.log('\nexpectations, written before the drive:');
for (const [k, t] of EXPECTED) console.log(`  ${k}  ${t}`);
console.log('\ngrades:');
for (const r of GRADES) console.log(`  ${r.ok ? 'true ' : 'FALSE'}  ${r.leg}  ${r.claim}\n          ${r.detail}`);

const ALL_TRUE = GRADES.every((r) => r.ok === true);
console.log(`\nGRADE: ${ALL_TRUE}`);
if (ALL_TRUE !== true) {
  console.log('\nREFUSED: a leg is not true, so no figure prints below it.');
  process.exit(1);
}

console.log('\n─── the population, by stratum ─────────────────────────────────────────────────────');
const order = ['LITERAL-SHA', 'SYMBOLIC', 'METADATA', 'DEFINITION', 'UNMODELLED'];
for (const k of order) {
  const xs = BY[k] ?? [];
  console.log(`  ${k.padEnd(12)} ${String(xs.length).padStart(3)} site(s) in `
            + `${String(new Set(xs.map((s) => s.path)).size).padStart(2)} file(s)`);
}
console.log(`  ${'TOTAL'.padEnd(12)} ${String(SITES.length).padStart(3)} site(s) in `
          + `${String(new Set(SITES.map((s) => s.path)).size).padStart(2)} file(s)`);

console.log(`\n─── the LITERAL-SHA members (the only stratum reachability can be asked about) ─────`);
console.log(`  ${LIT.length} site(s) · ${mineRevs.size} distinct rev(s)`);
for (const s of LIT.sort((a, b) => (a.path + a.line).localeCompare(b.path + b.line))) {
  const p = pathOf(s);
  console.log(`  ${s.rev.rev.padEnd(10)} ${s.path}:${s.line} (kind ${s.kind})${p === null ? '  [path COMPUTED — blob UNMODELLED]' : ''}`);
}

console.log(`\n─── UNMODELLED, published rather than filed in a stratum ───────────────────────────`);
for (const s of (BY['UNMODELLED'] ?? [])) console.log(`  ${s.path}:${s.line}  ${s.rev.why ?? ''}`);

console.log(`\nHIS FIVE, as a member list: ${HIS_FIVE.map((r) => `${r}${mineRevs.has(r) ? '✓' : '✗'}`).join(' ')}`);
// The recording. `revs` is the COMPARABLE key and is deliberately line-free: Round 371 broke the
// gate for four days because a frozen artifact keyed on line numbers went stale on a pure comment
// shift in another file, which is a line move and not a content regression. Everything carrying a
// `path:line` below is for a human to read, not for a later round to diff.
writeFileSync(join(REPO, 'docs/research/round405-instruments/census.json'),
  JSON.stringify({
    comparableKey: 'revs — sorted distinct literal revs. Compare THIS. Never diff a path:line.',
    revs: [...mineRevs].sort(),
    counts: Object.fromEntries(order.map((k) => [k, (BY[k] ?? []).length])),
    grades: GRADES,
    strata: Object.fromEntries(order.map((k) => [k, (BY[k] ?? []).map((s) => `${s.path}:${s.line}`)])),
    literal: LIT.map((s) => ({ at: `${s.path}:${s.line}`, rev: s.rev.rev, path: pathOf(s) })),
  }, null, 2) + '\n');
console.log('\nwrote docs/research/round405-instruments/census.json');
