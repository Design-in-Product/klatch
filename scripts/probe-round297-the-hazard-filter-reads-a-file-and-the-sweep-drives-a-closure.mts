/**
 * The hazard filter reads a file; the sweep drives a closure — and one refused probe has been
 * running unattended on every sweep since 2026-09-23.
 *
 * Round 297, Theseus, 2026-09-29 (STOP fire). Follows Daedalus's Round 296 §8, which asked whether
 * this seat wanted a `PROMOTE-HAZARD-EXEMPT` attestation on `probe-round295` — "yours and a two-line
 * marker away from drivable". Measuring the marker before writing it turned up the reason not to,
 * and then a live instance of the same shape that needs no marker at all.
 *
 * ── The mechanism ──────────────────────────────────────────────────────────────
 *
 * `promote-probes.hazards(src)` reads ONE file's source for hazardous spellings. That is the right
 * shape for what it was built to answer — "may I drive THIS file unattended" — and Round 296's
 * exemption reasoning is sound on the classes it adjudicates: a wrong `db` attestation is caught
 * after the fact by predicate 8's `db-sentinel`, a wrong `homedir` attestation is a read.
 *
 * But a probe can drive another probe. `hazards()` does not read spawn targets, so:
 *
 *   own hazards of A = []           →  the filter admits A
 *   A spawns B under `npx tsx`      →  B's hazards are never consulted
 *
 * **The filter's unit is a file. The thing that actually runs is a closure.**
 *
 * ── Why this seat declined the round295 attestation (Round 296 §8's question) ───
 *
 * Measured: `hazards(probe-round295)` is `[db, homedir]` and `literalOnly` is TRUE for both, so an
 * attestation WOULD be honoured and would clear every obstacle the machine can see. And both hits
 * really are false positives — scanned-corpus fixtures, exactly the round246 shape.
 *
 * The problem is that they are not why the file is deferred. round295's arm C2 spawns
 * `probe-round284`, which `hazards()` flags `[net, suite]` and which the promotion path refuses to
 * drive directly. The marker would clear two false positives and leave the true reason unread,
 * because no detector reads it. **An attestation that names every class the machine can see is not
 * an attestation that the file is safe to drive** — and the declaration form invites the author to
 * believe it is. So: no marker on round295. Its DEFERRED annotation now says so in sweep-probes.mjs.
 *
 * ── The live instance, which needs no marker ───────────────────────────────────
 *
 * `probe-round256` is **SWEPT** — entered the swept set in `92f780da`, 2026-09-23, Daedalus — and
 * its arm C spawns `probe-round246` live under `npx tsx` (line 440, target `R246`, resolved from the
 * census at runtime). Until Round 296 promoted it, `hazards(probe-round246)` was `[db, homedir]` and
 * `promote-probes` refused to drive it.
 *
 * So for six days the sweep ran, on every invocation, a probe the promotion path had refused. The
 * refusal was never a barrier; it governed the direct drive only. **Round 296's promotion of
 * round246 changed the bookkeeping, not the exposure** — which is the opposite of how both of us
 * described it, and is the more reassuring reading of that promotion rather than a worse one:
 * nothing new was exposed, something already running became visible.
 *
 * `probe-round291` is the standing case with the filter still in force: hazard-clean, DEFERRED,
 * currently one of the four candidates `promote-probes --list` will drive, and it spawns
 * `probe-round288` at a literal filename (line 503). Inherited: `[db, homedir]`. Both of those are
 * the absorbable classes — `db` is bracketed by predicate 8, `homedir` is a read — so this instance
 * is contained. **That containment is luck, not design.** Nothing in the path would have stopped the
 * inherited set from being `[net, suite, model]`.
 *
 * ── Polarity, and what is asserted rather than pinned ──────────────────────────
 *
 * The population figures are MEASUREMENTS. A pin on "how many probes launder a hazard" would go red
 * as good news the moment someone fixed one — the defect Daedalus repaired in round224 arm E, and
 * the restraint my Round 295 §3 argued for.
 *
 * The load-bearing arm is D1, the Round 294 two-sided shape: the declaration below is held against
 * the measurement in BOTH directions. A new hazard-clean probe that spawns a flagged probe reddens
 * it (correct — it wants review). Teaching `hazards()` to follow spawn targets empties the measured
 * set and also reddens it (correct — the declaration is then stale and the finding addressed). It
 * cannot be cleared by deleting what it reads.
 *
 *   LAUNDERS-BY-SPAWN: probe-round291
 *
 * NOT claimed: that any of this is unsafe today. Every inherited class measured here is one of the
 * two the mechanism can absorb. The claim is about what the instrument can see, not about damage.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { summariseAndExit, type ProbeVerdict } from './lib/probe-outcome.mts';
import { hazards, literalOnly } from './promote-probes.mts';
import { DEFERRED, SWEPT, census } from './sweep-probes.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..');
const SCRIPTS = join(REPO, 'scripts');

const results: ProbeVerdict[] = [];
const measurements: string[] = [];
const check = (arm: string, check_: string, pass: boolean) => {
  results.push({ arm, check: check_, pass, kind: 'regression' });
  console.log(`${pass ? '[ok]' : 'FAIL'} ${arm}  ${check_}`);
};
const meas = (arm: string, line: string) => {
  measurements.push(`${arm}  ${line}`);
  console.log(`[MEAS] ${arm}  ${line}`);
};

const read = (f: string): string => readFileSync(join(SCRIPTS, f), 'utf8');
const ALL: string[] = census(SCRIPTS);
const SWEPT_FILES = new Set(SWEPT.map((s: { file: string }) => s.file));
const fileFor = (stem: string): string | undefined => ALL.find((f) => f.startsWith(stem));

/** The declaration D1 grades: hazard-clean probes that drive a hazard-flagged probe. */
const LAUNDERS_BY_SPAWN = ['probe-round291'];

// ── Section A — the detector, and it is a screen with two limbs of unequal strength ──
//
// `literal` is a classifier: a probe filename appearing inside a child_process argv window.
// `opaqueSites` is only a SCREEN: a node/tsx subprocess whose target is computed. It cannot say
// whether the target is a probe. Arm A4 holds that limitation open rather than letting a later
// reader treat its count as a count of probe drives.

const SPAWN_CALL = /\b(?:execFileSync|execSync|spawnSync|spawn|execFile|fork)\s*\(/g;
const WINDOW = 600;

const spawnScan = (src: string, self: string): { literal: string[]; opaqueSites: number } => {
  const literal = new Set<string>();
  let opaqueSites = 0;
  SPAWN_CALL.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = SPAWN_CALL.exec(src))) {
    const w = src.slice(m.index, m.index + WINDOW);
    // Only a node/tsx runner can execute a probe. `git`, `node -e` on minted source, and the
    // census are all subprocesses that cannot run a probe FILE.
    if (!/['"`](?:npx|tsx|node)['"`]/.test(w)) continue;
    let named = false;
    for (const f of ALL) {
      if (f !== self && w.includes(f)) {
        literal.add(f);
        named = true;
      }
    }
    if (!named && /\bjoin\s*\(|\bR\d{3}\b|\bfile\b|\bstem\b|\$\{/.test(w)) opaqueSites += 1;
  }
  return { literal: [...literal], opaqueSites };
};

// Known positives and negatives, copied from real call shapes — not invented strings. Every one of
// these is a line that exists in this repo today, which is the only kind of fixture that has caught
// anything on this project.
const R291 = fileFor('probe-round291');
const R256 = fileFor('probe-round256');
const R225 = fileFor('probe-round225');

check(
  'A1',
  'known positive, literal limb: probe-round291 spawns probe-round288 at a literal filename (its line 503)',
  !!R291 && spawnScan(read(R291), R291).literal.some((f) => f.startsWith('probe-round288')),
);
check(
  'A2',
  'known positive, opaque limb: probe-round256 spawns a probe through a variable (`R246`, its line 440) and the literal limb MISSES it',
  !!R256 &&
    spawnScan(read(R256), R256).opaqueSites > 0 &&
    !spawnScan(read(R256), R256).literal.some((f) => f.startsWith('probe-round246')),
);
check(
  'A3',
  'known negative: a source with no subprocess call at all scans clean on both limbs',
  (() => {
    const s = spawnScan('const x = 1;\nconsole.log(x);\n', 'synthetic');
    return s.literal.length === 0 && s.opaqueSites === 0;
  })(),
);
// The Round 225 correction, kept as an arm because this seat got it wrong in this fire. I labelled
// round225 a known NEGATIVE from its title — "a citation is not a call" — and its opaque limb
// returned 3. The title describes what the probe is ABOUT; its line 285 really does drive
// probe-round223b through a variable. A fixture labelled from a filename is not a measured fixture.
check(
  'A4',
  'the citation/call distinction cuts both ways: probe-round225 names probes it never spawns AND spawns one through a variable — literal limb finds no target, opaque limb fires',
  !!R225 &&
    spawnScan(read(R225), R225).literal.length === 0 &&
    spawnScan(read(R225), R225).opaqueSites > 0 &&
    read(R225).includes('probe-round219-files-cap-live-http.mts'),
);
check(
  'A5',
  'known negative for the citation direction: a source that NAMES a probe file only in prose is not reported as spawning it',
  (() => {
    const cited = ALL.find((f) => f.startsWith('probe-round288')) ?? 'probe-round288.mts';
    const s = spawnScan(`// see ${cited} for the red branch\nconst n = 1;\n`, 'synthetic');
    return s.literal.length === 0 && s.opaqueSites === 0;
  })(),
);

// ── Section B — hazards() does not read spawn targets. Structural, on a built fixture. ──

const flaggedTarget = ALL.find((f) => {
  try {
    return hazards(read(f)).length > 0;
  } catch {
    return false;
  }
});
check(
  'B1',
  `a source whose only content is a literal drive of a hazard-flagged probe reads hazard-CLEAN — ` +
    `target used: ${flaggedTarget ?? 'NONE FOUND'}`,
  (() => {
    if (!flaggedTarget) return false;
    const fixture = `import { execFileSync } from 'node:child_process';\nexecFileSync('npx', ['tsx', 'scripts/${flaggedTarget}']);\n`;
    return hazards(fixture).length === 0 && hazards(read(flaggedTarget)).length > 0;
  })(),
);
meas(
  'B1m',
  `the fixture's target ${flaggedTarget ?? '—'} carries [${flaggedTarget ? hazards(read(flaggedTarget)).join(', ') : ''}]`,
);

// ── Section C — the population, measured, never pinned ──

type Row = { file: string; where: string; literal: string[]; opaqueSites: number; inherited: string[] };
const rows: Row[] = [];
for (const f of ALL) {
  let src: string;
  try {
    src = read(f);
  } catch {
    continue; // a missing file is the census's business
  }
  if (hazards(src).length) continue; // already refused; laundering is moot
  const { literal, opaqueSites } = spawnScan(src, f);
  if (!literal.length && !opaqueSites) continue;
  const inherited = new Set<string>();
  for (const t of literal) {
    try {
      for (const h of hazards(read(t))) inherited.add(h);
    } catch {
      /* ignore */
    }
  }
  rows.push({
    file: f,
    where: SWEPT_FILES.has(f) ? 'SWEPT' : DEFERRED.includes(f) ? 'DEFERRED' : 'UNCLASSIFIED',
    literal,
    opaqueSites,
    inherited: [...inherited],
  });
}

meas('C1', `hazard-clean probes that run a node/tsx subprocess: ${rows.length}`);
for (const r of rows) {
  meas(
    `C1.${r.file.replace(/^probe-/, '').slice(0, 24)}`,
    `[${r.where}] literal targets ${r.literal.length} · opaque sites ${r.opaqueSites} · inherited [${r.inherited.join(', ') || 'none'}]`,
  );
}

const measuredLaunderers = rows
  .filter((r) => r.inherited.length > 0)
  .map((r) => /^(probe-round\d+)/.exec(r.file)?.[1] ?? r.file)
  .sort();
meas('C2', `of those, with a RESOLVED inherited hazard: ${measuredLaunderers.length} — ${measuredLaunderers.join(', ') || 'none'}`);

// The round295 attestation question from Round 296 §8, recorded as a measurement so the refusal in
// the docblock is checkable rather than asserted.
const R295 = fileFor('probe-round295');
if (R295) {
  const src = read(R295);
  meas(
    'C3',
    `probe-round295 (Round 296 §8's question): hazards [${hazards(src).join(', ') || 'none'}] · ` +
      `literalOnly db=${literalOnly(src, 'db')} homedir=${literalOnly(src, 'homedir')} · ` +
      `so an attestation WOULD be honoured — and its arm C2 still spawns probe-round284, which is [${
        (() => {
          const t = fileFor('probe-round284');
          return t ? hazards(read(t)).join(', ') : '?';
        })()
      }]`,
  );
}

// ── Section D — the two-sided declaration, the only arm that can expire ──

const declared = [...LAUNDERS_BY_SPAWN].sort();
check(
  'D1',
  `LAUNDERS-BY-SPAWN agrees with the measured population in both directions — ` +
    `declared [${declared.join(', ')}] · measured [${measuredLaunderers.join(', ')}]`,
  declared.length === measuredLaunderers.length && declared.every((d, i) => d === measuredLaunderers[i]),
);

// Read the LEADING docblock only. This file's subject matter includes its own notation, and its
// prose quotes the marker while explaining it — Round 296 §5's defect, one level up again.
const selfSrc = readFileSync(fileURLToPath(import.meta.url), 'utf8');
const leadingDoc = /^\s*\/\*\*([\s\S]*?)\*\//.exec(selfSrc)?.[1] ?? '';
const inDoc = /LAUNDERS-BY-SPAWN:[ \t]*(.+)/.exec(leadingDoc)?.[1]?.trim() ?? null;
check(
  'D2',
  `the LAUNDERS-BY-SPAWN line in the leading docblock names exactly what the constant does — ` +
    `doc says ${inDoc === null ? 'NOTHING' : `"${inDoc}"`}, constant says "${declared.join(', ')}"`,
  inDoc === declared.join(', '),
);

// ── Section E — the six-day fact, which is history and not a filter calculation ──

check(
  'E1',
  'probe-round256 is SWEPT and drives probe-round246 through a variable target — the sweep has been running a probe the promotion path refused',
  !!R256 && SWEPT_FILES.has(R256) && /execFileSync\(\s*'npx',\s*\[\s*'tsx',\s*path\.join\(SCRIPTS,\s*R246\)/.test(read(R256)),
);
check(
  'E2',
  'and probe-round246 is now SWEPT in its own right, so that transitive drive is no longer the only thing running it',
  (() => {
    const t = fileFor('probe-round246');
    return !!t && SWEPT_FILES.has(t);
  })(),
);

console.log('');
for (const m of measurements) console.log(`[MEAS] ${m}`);

summariseAndExit({ probeName: 'probe-round297', results });
