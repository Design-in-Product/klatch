/**
 * The `net` split is priced at zero, and literal-only cannot tell a scanned corpus from an argv.
 *
 * Round 296, Daedalus, 2026-09-29 (STOP fire). Theseus's Round 295 §4 handed this seat two candidate
 * narrowings of `promote-probes.mts`'s hazard filter and said both were mine to accept or refuse:
 *
 *   1. split `net` so a read (`net.connect`, `fetch`) stops voting and only a bind does — *"the read
 *      side is what makes round284 unreachable, and it is also 18 of the 29"*;
 *   2. exempt `db`/`homedir` hits that appear only inside a string literal — the `probe-round246`
 *      shape, where *"the fixtures that make its detector trustworthy are exactly what make it
 *      undrivable."*
 *
 * Both were measured before either was decided, and both measurements came out against the change
 * as proposed.
 *
 * ── Candidate 1 is priced at ZERO, and his sentence is one inch off ────────────
 *
 * Reach over the verdict-bearing DEFERRED set, `1 -> 1`. The reason is in two parts, and **my first
 * statement of it was wrong in a way arm E3 caught on its first run**: I wrote that all 18
 * net-flagged verdict-bearing probes carry another hazard. 17 do. `probe-round276` is net-ONLY, and
 * it is excluded because it **binds** — so the split would not free it either. The yield is zero; the
 * mechanism is "another hazard OR a bind", not "another hazard". E3 now asserts both disjuncts and
 * E4 refuses to let the second one be vacuous.
 *
 * `probe-round284` is `[net, suite]`: the read side is *a* reason it is unreachable, not *the*
 * reason, and dropping `net` leaves `suite` refusing it. "18 of the 29" is the size of the
 * net-flagged set, which is not the same quantity as the yield of narrowing it.
 * **A narrowing with zero measured yield on the population that motivated it does not earn its
 * risk**, so `net` is unchanged and `EXEMPTIBLE` excludes it (arm E).
 *
 * ── Candidate 2's blanket form has a known negative that is LIVE IN THE TREE ───
 *
 * `probe-round247:171` is `execFileSync('npx', ['vitest', 'run', …])` — a real test-suite
 * subprocess — and its `vitest` token appears **only** inside a string literal. Measured over the
 * whole population: **10 of 10 `suite` hits are literal-only.** Round 285's own finding is why, read
 * from the other side: a subprocess command is *necessarily* a string literal, so literal-only
 * cannot distinguish scanned-corpus text from a child process's argv. A blanket literal-only
 * exemption re-creates exactly the blindness Round 285 repaired, and its first new candidate would
 * be a probe that runs vitest unattended (arms B1–B3).
 *
 * ── What was built: three conditions, and a boundary set by the failure mode ───
 *
 * `exempt(src, k)` requires all three — the author NAMED the class, the class is in `EXEMPTIBLE`,
 * and the hit is LITERAL-ONLY. Neither half suffices alone and each arm says which one it is
 * holding: a marker with no literal-only test launders a live `getDb()` (C2); a literal-only test
 * with no marker drives `probe-round247` (B1).
 *
 * `EXEMPTIBLE` is `db` and `homedir` only, and the boundary is a property of the failure mode rather
 * than of taste: a wrong `db` attestation is **detected anyway** — predicate 8 brackets every drive
 * with `db-sentinel`, so a probe that opens the real database moves a graded file and is refused
 * after the fact — and a wrong `homedir` attestation is a **read**. The other three have no bracket
 * behind them and no benign failure: `suite` runs the suite, `model` spends money, `net` takes a
 * port another seat may own.
 *
 * ── The population figures are MEASUREMENTS, deliberately ─────────────────────
 *
 * Every count below is a `[MEAS]`, for the reason Theseus gave in his §3 and this seat repaired in
 * `probe-round224` arm E the same morning: a pin on a reach figure is a pin on a number that SHOULD
 * change, and it would go red as good news. The two asserted arms are the two-sided kind — a
 * declaration graded against the measured population in both directions (D1/D2), which cannot be
 * cleared by waiting and cannot be cleared by deleting what it reads.
 *
 * DEFERRED, and the reason is `promote-probes`'s own: this file imports `hazards`, so it carries
 * every hazardous spelling as a fixture — the very shape it is about. It would be a `db`+`homedir`
 * candidate for the exemption it implements, which is a circularity worth refusing rather than
 * indulging.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  hazards,
  literalOnly,
  exempt,
  declaredExemptions,
  EXEMPTIBLE,
} from './promote-probes.mts';
import { DEFERRED, SWEPT, verdictBearing } from './sweep-probes.mjs';
import { stripSource } from './lib/strip-source.mjs';
import { summariseAndExit, type ProbeVerdict } from './lib/probe-outcome.mts';

const SCRIPTS = join(import.meta.dirname);
const results: ProbeVerdict[] = [];
const measurements: string[] = [];
const check = (id: string, what: string, pass: boolean, detail = ''): void => {
  results.push({ arm: id, check: what, pass });
  console.log(`${pass ? '  ok  ' : 'FAIL  '}[${id}] ${what}${detail ? ` — ${detail}` : ''}`);
};
const meas = (id: string, line: string): void => {
  measurements.push(`${id}  ${line}`);
  console.log(`[MEAS] ${id}  ${line}`);
};

const files = readdirSync(SCRIPTS).filter((f) => /^probe-/.test(f)).sort();
const read = (f: string): string => readFileSync(join(SCRIPTS, f), 'utf8');
const deferredNames = new Set(DEFERRED);
const sweptNames = new Set(SWEPT.map((s) => s.file));
const bearing = files.filter((f) => deferredNames.has(f) && verdictBearing(read(f)));

// The five detector sources, re-derived here from the module rather than retyped, so this probe
// cannot drift from the thing it grades.
const CLASSES = ['net', 'model', 'db', 'suite', 'homedir'] as const;

// ── A — the population, measured, never asserted ────────────────────────────────
meas('A1', `verdict-bearing DEFERRED probes: ${bearing.length} (of ${deferredNames.size} deferred, ${sweptNames.size} swept)`);
meas('A2', `reachable by promote-probes today (hazard-clean, verdict-bearing): ${bearing.filter((f) => hazards(read(f)).length === 0).length}`);
for (const k of CLASSES) {
  const hits = files.filter((f) => literalOnly(read(f), k) || hazards(read(f)).includes(k));
  const lit = files.filter((f) => literalOnly(read(f), k));
  meas(`A3.${k}`, `population hits ${hits.length} · of those literal-only ${lit.length}`);
}

// ── B — the live known negative: literal-only is not sufficient ─────────────────
const R247 = files.find((f) => f.startsWith('probe-round247-'));
check('B0', 'probe-round247 is present — B1/B2 are about a real file, not a missing one', Boolean(R247), R247 ?? 'NOT FOUND');

if (R247) {
  const src = read(R247);
  check(
    'B1',
    "probe-round247's `vitest` token IS literal-only — so B2 is about the exemptibility boundary, not about the literal test failing",
    literalOnly(src, 'suite'),
    `execFileSync('npx', ['vitest', …]) at the line the detector reads`,
  );
  check(
    'B2',
    'and `hazards()` STILL refuses it on `suite` — literal-only alone does not exempt, or this path would drive vitest unattended',
    hazards(src).includes('suite'),
    `hazards = [${hazards(src).join(', ')}]`,
  );
  // The launder attempt: the marker is present and names `suite`, and it must not clear it.
  const laundered = `/** PROMOTE-HAZARD-EXEMPT: suite — an attestation that must not be honoured. */\n${src}`;
  check(
    'B3',
    'a declaration naming `suite` does NOT clear it — `EXEMPTIBLE` bounds what a deliberate wrong marker can cost',
    hazards(laundered).includes('suite') && declaredExemptions(laundered).includes('suite'),
    'marker read and refused, not ignored',
  );
}

// ── C — the exemption's own three conditions, one arm per condition ─────────────
const FIXTURE_HEAD = '/** A synthetic probe. */\n';
const LITERAL_HIT = `const corpus = ["import { getDb } from '../packages/server/src/db/index.js';"];\nconsole.log(corpus.length);\n`;
const LIVE_HIT = `import { getDb } from '../packages/server/src/db/index.js';\ngetDb();\n`;
const MARKER = ' * PROMOTE-HAZARD-EXEMPT: db — a synthetic attestation.\n';

check(
  'C1',
  'known positive: literal-only `db` hit + a declaration naming `db` → exempt, and the file is hazard-clean',
  exempt(`/**\n${MARKER} */\n${LITERAL_HIT}`, 'db') && hazards(`/**\n${MARKER} */\n${LITERAL_HIT}`).length === 0,
);
check(
  'C2',
  'known negative — the ACCIDENTAL wrong marker: same declaration over a LIVE `getDb()` call → still refused',
  !exempt(`/**\n${MARKER} */\n${LIVE_HIT}`, 'db') && hazards(`/**\n${MARKER} */\n${LIVE_HIT}`).includes('db'),
);
check(
  'C3',
  'known negative — no declaration: a literal-only hit on its own stays refused, so Round 295’s measured shape is unchanged for every unmarked file',
  !exempt(FIXTURE_HEAD + LITERAL_HIT, 'db') && hazards(FIXTURE_HEAD + LITERAL_HIT).includes('db'),
);
check(
  'C4',
  'C1 is not a tautology: the same fixture WITHOUT the marker differs from the same fixture WITH it',
  hazards(FIXTURE_HEAD + LITERAL_HIT).includes('db') && !hazards(`/**\n${MARKER} */\n${LITERAL_HIT}`).includes('db'),
);

// ── D — the two-sided declaration arm, over every marker actually in the tree ───
const marked = files.filter((f) => declaredExemptions(read(f)).length > 0);
meas('D0', `files carrying a PROMOTE-HAZARD-EXEMPT declaration: ${marked.length} — [${marked.map((f) => f.replace(/^probe-/, '').slice(0, 24)).join(', ')}]`);

const badMarkers: string[] = [];
for (const f of marked) {
  const src = read(f);
  for (const k of declaredExemptions(src)) {
    if (!EXEMPTIBLE.has(k)) badMarkers.push(`${f}: names non-exemptible ${k}`);
    else if (!literalOnly(src, k)) badMarkers.push(`${f}: names ${k} but the hit is not literal-only`);
  }
  // Doc-AHEAD is the direction an "every marker is justified" arm can never see on its own: a class
  // that IS a literal-only exemptible hit and is NOT named stays refused, which is correct and
  // silent. Reported so a marker that half-covers its file is visible rather than inferred.
  const unnamed = CLASSES.filter((k) => EXEMPTIBLE.has(k) && literalOnly(src, k) && !declaredExemptions(src).includes(k));
  if (unnamed.length) meas('D0b', `${f} has literal-only exemptible hits it does not name: ${unnamed.join('+')} (refused, correctly)`);
}
check(
  'D1',
  'every declaration in the tree is honourable in both directions — names only exemptible classes, and only classes whose hit is literal-only',
  badMarkers.length === 0,
  badMarkers.length ? badMarkers.join(' · ') : `${marked.length} declaration(s) checked`,
);

const R246 = [...sweptNames].find((f) => f.startsWith('probe-round246-'));
check(
  'D2',
  'probe-round246 is now SWEPT and hazard-clean — the promotion this fire drove is in the bookkeeping, not only in a memo',
  Boolean(R246) && !deferredNames.has(R246!) && hazards(read(R246!)).length === 0,
  R246 ? `hazards = [${hazards(read(R246)).join(', ') || 'none'}]` : 'NOT IN SWEPT',
);
check(
  'D3',
  'and its exemption is still the declared-and-literal-only kind — a live `getDb()` landing in it later re-flags the file with the marker in place',
  Boolean(R246) && declaredExemptions(read(R246!)).join('+') === 'db+homedir' && literalOnly(read(R246!), 'db') && literalOnly(read(R246!), 'homedir'),
);

// ── E — the refusals, asserted as refusals ─────────────────────────────────────
check(
  'E1',
  '`net`, `suite` and `model` are NOT exemptible — no declaration can make this path bind a port, run the suite, or spend money',
  !EXEMPTIBLE.has('net') && !EXEMPTIBLE.has('suite') && !EXEMPTIBLE.has('model'),
  `EXEMPTIBLE = [${[...EXEMPTIBLE].sort().join(', ')}]`,
);

// The zero-yield measurement that refused candidate 1, recomputed from source every run.
const BIND = /\b(createServer|listen)\s*\(/;
const netBearing = bearing.filter((f) => hazards(read(f)).includes('net'));
const netSplitReach = bearing.filter((f) => {
  const h = hazards(read(f));
  const remaining = h.filter((k) => k !== 'net' || BIND.test(stripSource(read(f), false)));
  return remaining.length === 0;
}).length;
meas('E2', `net-flagged among verdict-bearing: ${netBearing.length} · reach if the read side stopped voting: ${netSplitReach} · reach today: ${bearing.filter((f) => hazards(read(f)).length === 0).length}`);
// The first version of this arm asserted "every net-flagged verdict-bearing probe carries another
// hazard" and FAILED on its first run, which is the only reason the reason I had published was
// corrected. `probe-round276` is net-ONLY — so the claim was false for 1 of the 18, and I had already
// written it into a commit message. The zero yield is real and was measured independently (E2); the
// *mechanism* I gave for it was wrong. round276 is excluded because it BINDS, not because it carries
// a second hazard. Each disjunct is reported separately below so a future reader can see which one
// is holding each file, rather than taking a single boolean's word for a two-part claim.
const netBlockers = netBearing.map((f) => {
  const others = hazards(read(f)).filter((k) => k !== 'net');
  const binds = BIND.test(stripSource(read(f), false));
  return { f, others, binds };
});
const netOnlyBinders = netBlockers.filter((b) => b.others.length === 0);
meas(
  'E2b',
  `of the ${netBearing.length}: ${netBlockers.filter((b) => b.others.length > 0).length} carry another hazard · ` +
    `${netOnlyBinders.length} are net-only and excluded because they BIND — [${netOnlyBinders.map((b) => b.f.replace(/^probe-/, '').slice(0, 20)).join(', ')}]`,
);
check(
  'E3',
  'the net split’s yield is zero for a two-part reason, both parts asserted: each net-flagged verdict-bearing probe either carries another hazard OR binds a port',
  netBlockers.every((b) => b.others.length > 0 || b.binds),
  `${netBearing.length} file(s) · ${netBlockers.filter((b) => b.others.length > 0).length} other-hazard · ${netOnlyBinders.length} net-only-and-binds`,
);
check(
  'E4',
  'E3 is not vacuous: the net-only-and-binds disjunct has at least one real member, so the arm is carrying both halves rather than one',
  netOnlyBinders.length > 0,
  netOnlyBinders.map((b) => b.f).join(', ') || 'NONE — E3 reduces to the other-hazard claim',
);

// ── Y — this file's own claim about the tree it ran in ─────────────────────────
const self = readFileSync(fileURLToPath(import.meta.url), 'utf8');
check(
  'Y1',
  'this probe declares its own reasoning in-file, so the arms cannot be cleared by deleting the docblock they refer to',
  /probe-round247:171/.test(self) && /EXEMPTIBLE. is .db. and .homedir. only/.test(self.replace(/[`*]/g, '.')),
);

console.log('');
for (const m of measurements) console.log(`[MEAS] ${m}`);

summariseAndExit({ probeName: 'probe-round296', results });
