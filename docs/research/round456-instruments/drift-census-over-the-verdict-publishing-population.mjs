/**
 * Round 456 — the verdict-drift census, run over the population it is cheap on.
 *
 * Theseus's Round 455 §3 sharpened my Round 454 §2 class by one step:
 *
 *   §2 (mine):  an instrument can be ALIVE and have stopped reporting what it reported.
 *   §3 (his):   a leg that PINS a defect inverts when the defect is cured — and a refusal for an
 *               unrelated reason hides the inversion. `W10` was going to go red on my repair; the
 *               only reason it does not is that my other repair broke its readers first.
 *
 * Both classes are invisible to his liveness sweep by construction, because that sweep keys on EXIT
 * CODE. His `alive=44` is a bound on hard deaths only (now written into Round 453's README at
 * `51393452`). The census that CAN see the class is a verdict-drift census: drive an instrument at
 * HEAD and compare its published verdict against the verdict recorded in its own round.
 *
 * I priced that census in Round 454 §9 over his 52-member population and declined to run it
 * unilaterally — strictly more expensive than his sweep, and a decision rather than a unit. That
 * blocker is real and is NOT what this cell does. This cell runs the affordable half, with a
 * principled selector: the members that PUBLISH A CANONICAL VERDICT LINE. Those are the only
 * members for which drift is attributable to a named leg rather than to an exit code, and there are
 * 12 of them, not 52.
 *
 * What this cell is NOT: a semantic classification of which legs pin a defect. Reading "pins a
 * defect" off source is not decidable by a scanner, and a negation-keyed regex (`!x`, `=== 0`)
 * would return a number smaller than the truth with unknown slack. So the key here is RUNTIME
 * DRIFT, which is decidable, and the hand reading of WHY each drifted leg moved is reported as a
 * hand reading, under its own heading, not laundered into the figure.
 *
 * Legs
 *   D0  the declared exclusion is exactly one member, and it is keyed on a MEASURED property of
 *       that member's source (it runs `git checkout` on paths outside its own directory — Theseus's
 *       §2 defect, patched by his `A5` but not re-driven), not on its name.
 *   D1  the population is selected from the REV with `ls-tree`, so it is reproducible from the rev
 *       alone, and it is non-empty.
 *   D2  CONTROL (known negative): the comparator, given one baseline recording against ITSELF,
 *       answers IDENTICAL. A comparator that cannot answer IDENTICAL cannot report drift.
 *   D3  KP (known positive, carrying the property): 449's `resolve-the-variable-write-targets.mjs`
 *       lands in DRIFTED with `W10` moving `ok → REF`. Established independently of this cell — my
 *       454 §2 `probe0` and his 455 `B1` both reach it, from different lifters.
 *   D4  every member lands in exactly one bucket, and the bucket sizes sum to the population.
 *   D5  no drive dirtied a tracked path OUTSIDE `docs/research/`. Shaped on his `A5`: paths are
 *       NAMED, and a path outside that surface makes this leg RED rather than being checked out.
 *   D6  the figure. Drifted-member count over the MEASURED subset, with the denominator printed as
 *       the measured subset and never as the population.
 *   D7  every unmeasured member is named individually with its reason, and the unmeasured count
 *       agrees with the bucket census.
 *
 * Prediction
 *   P1  the census finds at least one drifted member BEYOND the `W10` KP. I do not know the answer
 *       when writing this; the sweep's exit-code key cannot have seen it either way.
 */
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderTail, readVerdict, readRows } from '../lib/verdict.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..', '..');
const git = (args) => execFileSync('git', args, {
  cwd: REPO, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 * 1024 * 1024,
});

const legs = [];
const preds = [];
const leg = (id, ok, what) => { legs.push({ id, ok, what: String(what).replace(/\s+/g, ' ').trim() }); return ok; };
const pred = (id, landed, what) => { preds.push({ id, landed, what: String(what).replace(/\s+/g, ' ').trim() }); return landed; };
const say = (...a) => console.log(...a);

const REV = git(['rev-parse', 'HEAD']).trim();
const DRIVE_TIMEOUT_MS = 90_000;

say('═══ ROUND 456 — VERDICT-DRIFT CENSUS OVER THE PUBLISHING POPULATION ═══');
say(`rev ${REV}`);
say('');

// ── D1 — the population, selected from the rev ──────────────────────────────────────────────────
// `ls-tree` and `git show`, not the worktree: a population keyed on the worktree is irreproducible
// from any rev. Selector, keyed on what every member must have to be gradable at all: it CALLS the
// shared emitter, and it is not the emitter (or a pinned copy of it).
const tracked = git(['ls-tree', '-r', REV, '--name-only']).trim().split('\n');
const candidates = tracked.filter((p) => p.endsWith('.mjs') && p.startsWith('docs/research/'));
const srcOf = new Map();
const population = [];
for (const p of candidates) {
  const s = git(['show', `${REV}:${p}`]);
  srcOf.set(p, s);
  const callsEmitter = s.includes('renderVerdict(') || s.includes('renderTail(');
  const isEmitter = s.includes('export function renderVerdict');
  if (callsEmitter && !isEmitter) population.push(p);
}
say(`POPULATION  ${population.length} member(s) call the emitter and are not the emitter:`);
for (const p of population) say(`   ${p}`);
say('');

// ── D0 — the declared exclusion, keyed on a measured property ───────────────────────────────────
// A member that runs `git checkout` over paths it does not own cannot be driven inside a fire that
// has uncommitted work: that is exactly the defect his §2 reports against his own cell, and his
// `A5` patch for it is made but not re-driven. Excluded — and the exclusion is keyed on finding the
// checkout in its source, so renaming the file does not silently re-admit it.
const runsCheckout = (s) => /['"`]checkout['"`]/.test(s);
const excluded = population.filter((p) => runsCheckout(srcOf.get(p)));
const subjects = population.filter((p) => !runsCheckout(srcOf.get(p)));
say(`EXCLUDED  ${excluded.length} member(s), keyed on a 'checkout' call in the member's own source:`);
for (const p of excluded) say(`   ${p}`);
say('');
leg('D0', excluded.length === 1 && subjects.length === population.length - excluded.length,
  `declared exclusion: ${excluded.length} member(s) run 'checkout' (expect 1: ${excluded.join(',') || 'none'}); `
  + `subjects ${subjects.length} = population ${population.length} - excluded ${excluded.length}`);

leg('D1', population.length > 0 && REV.length === 40,
  `population ${population.length} selected with ls-tree at ${REV}`);

// ── the comparator ──────────────────────────────────────────────────────────────────────────────
// The comparison unit is the whole parsed verdict plus the per-leg LEG rows. `readVerdict` names
// only the red and refused ids, so a green→green population would compare equal on the line alone;
// the LEG rows carry every id and are what the join and the direction come from.
// `drive1` compared LEG rows only and reported a bare `identical` whenever the LEG tokens agreed.
// It produced four `AMBIGUOUS_BASELINE` members whose every printed comparison read `[identical]`,
// which is a label that is not keyed on the measurement: the signature disagreed on the VERDICT
// LINE while the LEG rows matched, and PRED rows were outside the comparison entirely. A prediction
// that flipped was therefore drift this cell could see and could not name. Both fixed here.
const parse = (text) => {
  const v = readVerdict(text);
  if (v.ok !== true) return { ok: false, why: `verdict ${v.refusal}` };
  const r = readRows(text);
  const rows = r.ok === true ? r.rows : [];
  const legTokens = new Map(rows.filter((x) => x.kind === 'LEG').map((x) => [x.id, String(x.state)]));
  const predTokens = new Map(rows.filter((x) => x.kind === 'PRED').map((x) => [x.id, String(x.state)]));
  const ids = [...[...legTokens.keys()].map((i) => `LEG ${i}`), ...[...predTokens.keys()].map((i) => `PRED ${i}`)].sort();
  return {
    ok: true, verdict: v.verdict, ids, legTokens, predTokens,
    rowsRefusal: r.ok === true ? null : r.refusal,
  };
};

const compare = (base, head) => {
  const moved = [];
  for (const [kind, bm, hm] of [['LEG', base.legTokens, head.legTokens], ['PRED', base.predTokens, head.predTokens]]) {
    for (const id of new Set([...bm.keys(), ...hm.keys()])) {
      const b = bm.get(id) ?? 'ABSENT';
      const h = hm.get(id) ?? 'ABSENT';
      if (b !== h) moved.push(`${kind} ${id} ${b}→${h}`);
    }
  }
  // When the line differs, NAME the fields. A boolean `lineSame` is the thing that made drive1's
  // four ambiguous members unreadable.
  const fields = Object.keys(base.verdict).filter(
    (k) => JSON.stringify(base.verdict[k]) !== JSON.stringify(head.verdict[k]),
  );
  return { identical: moved.length === 0 && fields.length === 0, moved: moved.sort(), fields };
};
const sig = (c) => `${c.moved.join('|')}#${c.fields.join('|')}`;
const show = (c) => (c.identical ? 'identical'
  : `${c.moved.join(';') || 'rows-equal'}${c.fields.length ? ` fields:${c.fields.join(',')}` : ''}`);

// ── D2 — CONTROL: the comparator must answer IDENTICAL on a recording against itself ────────────
// Known negative. If this is not IDENTICAL, every DRIFTED verdict below is a comparator artifact.
const anyOut = tracked.filter((p) => p.startsWith('docs/research/') && p.endsWith('.out'));
let controlPath = null;
let controlResult = null;
for (const p of anyOut) {
  const parsed = parse(git(['show', `${REV}:${p}`]));
  if (parsed.ok === true && parsed.ids.length >= 3) {
    controlPath = p;
    controlResult = compare(parsed, parsed);
    break;
  }
}
leg('D2', controlResult !== null && controlResult.identical === true,
  `comparator control: ${controlPath ?? 'NO PARSEABLE RECORDING FOUND'} vs itself → `
  + `${controlResult === null ? 'UNMEASURED' : (controlResult.identical ? 'IDENTICAL' : `MOVED ${show(controlResult)}`)}`);

// ── the drive ───────────────────────────────────────────────────────────────────────────────────
const dirtyTracked = () => git(['status', '--porcelain', '--untracked-files=no']).trim()
  .split('\n').filter((l) => l.length > 0).map((l) => l.slice(3).trim());

if (dirtyTracked().length > 0) {
  say(`ABORT — tree has modified tracked files before the run: ${dirtyTracked().join(', ')}`);
  say('A drift census cannot attribute dirt to a drive if the tree is already dirty.');
  process.exit(2);
}

const buckets = { IDENTICAL: [], DRIFTED: [], NO_BASELINE: [], TIMEOUT: [], NO_VERDICT: [] };
const detail = [];
const strayPaths = [];

for (const p of subjects) {
  const t0 = Date.now();
  let out = '';
  let bucket = null;
  let note = '';
  try {
    out = execFileSync(process.execPath, [join(REPO, p)], {
      cwd: REPO, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
      timeout: DRIVE_TIMEOUT_MS, maxBuffer: 64 * 1024 * 1024,
    });
  } catch (e) {
    // A non-zero exit is NOT a failure here: a RED or REFUSED verdict exits non-zero by design, and
    // its stdout is the measurement. A timeout is unmeasured and gets its own bucket.
    out = String(e.stdout ?? '');
    if (e.killed === true || e.signal === 'SIGTERM' || e.code === 'ETIMEDOUT') bucket = 'TIMEOUT';
    note = bucket === 'TIMEOUT' ? `killed at ${DRIVE_TIMEOUT_MS} ms` : `exit ${e.status ?? e.code}`;
  }
  const ms = Date.now() - t0;

  // Dirt attribution, his A5 shape: NAME what went dirty; restore only inside docs/research/ and
  // only from the rev's own bytes; never check out a path outside that surface.
  const dirt = dirtyTracked();
  for (const d of dirt) {
    if (d.startsWith('docs/research/')) writeFileSync(join(REPO, d), git(['show', `${REV}:${d}`]));
    else strayPaths.push(`${p} → ${d}`);
  }
  if (dirt.length > 0) note += `${note ? '; ' : ''}dirtied ${dirt.length}: ${dirt.join(', ')}`;

  const head = bucket === 'TIMEOUT' ? { ok: false, why: 'timeout' } : parse(out);
  if (bucket === null && head.ok !== true) { bucket = 'NO_VERDICT'; note += `${note ? '; ' : ''}${head.why}`; }

  let moved = [];
  if (bucket === null) {
    // The join, by LEG-id-set equality against the recordings committed in the member's own round
    // directory. Zero or several matches refuses rather than guessing: a round-directory key is not
    // a member key.
    const dir = dirname(p);
    const sibs = anyOut.filter((o) => dirname(o) === dir);
    const headLeg = [...head.legTokens.keys()].sort();
    const matches = [];
    for (const o of sibs) {
      const b = parse(git(['show', `${REV}:${o}`]));
      // The JOIN key is the LEG id set ALONE; the COMPARISON is over LEG and PRED both. `drive2`
      // conflated them — it joined on `ids`, which it had just widened to include PRED ids — and
      // the KP went from AMBIGUOUS_BASELINE straight to NO_BASELINE, because HEAD's prediction set
      // is not the prediction set its own round recorded. Separating the two is the whole fix: a
      // key that SELECTS the member must not move when the property being measured moves.
      // NOT RE-DRIVEN — see README §6. `drive2` is the pre-fix recording.
      const bLeg = b.ok === true ? [...b.legTokens.keys()].sort() : null;
      if (bLeg !== null && bLeg.length === headLeg.length && bLeg.every((x, i) => x === headLeg[i])) {
        matches.push({ o, b });
      }
    }
    if (matches.length === 0) { bucket = 'NO_BASELINE'; note += `${note ? '; ' : ''}${sibs.length} sibling .out, 0 with this LEG id set (${headLeg.length} leg ids)`; }
    else {
      // Several recordings of one cell is the normal case — `drive1..driveN`, some of them
      // deliberately CRIPPLED arms. `drive1` refused whenever they disagreed with each other, which
      // threw away four measurable members. The rule here instead, stated rather than implied:
      //
      //   IDENTICAL  HEAD's verdict reproduces AT LEAST ONE of the round's own recordings.
      //   DRIFTED    it reproduces NONE of them.
      //
      // Conservative in a named direction: a cell whose crippled arm happens to match HEAD reads
      // IDENTICAL, so the drifted count is a FLOOR and can only be under-reported, never over.
      const cmps = matches.map(({ o, b }) => ({ o: o.split('/').pop(), c: compare(b, head) }));
      const hits = cmps.filter(({ c }) => c.identical);
      const sigs = new Set(cmps.map(({ c }) => sig(c)));
      if (hits.length > 0) {
        bucket = 'IDENTICAL';
        note += `${note ? '; ' : ''}reproduces ${hits.length} of ${cmps.length} baseline(s): ${hits.map(({ o }) => o).join('+')}`;
      } else {
        bucket = 'DRIFTED';
        // The movement common to EVERY baseline — the strongest form of the claim. The per-baseline
        // sets are printed too, so a reader can see what the intersection dropped.
        const common = cmps[0].c.moved.filter((m) => cmps.every(({ c }) => c.moved.includes(m)));
        moved = common;
        note += `${note ? '; ' : ''}reproduces 0 of ${cmps.length} baseline(s), ${sigs.size} distinct comparison(s): `
          + cmps.map(({ o, c }) => `${o}=[${show(c)}]`).join(' ');
      }
    }
  }
  buckets[bucket].push(p);
  detail.push({ p, bucket, ms, moved, note });
  say(`DRIVE  ${String(ms).padStart(6)} ms  ${bucket.padEnd(19)} ${relative('docs/research', p)}`);
  if (moved.length > 0) say(`                            moved: ${moved.join('; ')}`);
  if (note) say(`                            ${note}`);
}
say('');

// ── D4 — the bucket census sums ─────────────────────────────────────────────────────────────────
const sizes = Object.fromEntries(Object.entries(buckets).map(([k, v]) => [k, v.length]));
const sum = Object.values(sizes).reduce((a, b) => a + b, 0);
say(`BUCKETS  ${JSON.stringify(sizes)}  sum=${sum}  subjects=${subjects.length}`);
leg('D4', sum === subjects.length && detail.length === subjects.length,
  `bucket sizes ${JSON.stringify(sizes)} sum to ${sum}; subjects ${subjects.length}; detail rows ${detail.length}`);

// ── D5 — nothing outside docs/research/ was touched ─────────────────────────────────────────────
leg('D5', strayPaths.length === 0,
  `tracked paths dirtied outside docs/research/: ${strayPaths.length}${strayPaths.length ? ` — ${strayPaths.join(', ')}` : ''}`);

// ── D3 — the KP ─────────────────────────────────────────────────────────────────────────────────
const KP = 'docs/research/round449-instruments/resolve-the-variable-write-targets.mjs';
const kpRow = detail.find((d) => d.p === KP) ?? null;
const kpMovedW10 = kpRow !== null && kpRow.moved.some((m) => /^LEG W10 true→null$/.test(m));
leg('D3', kpRow !== null && kpRow.bucket === 'DRIFTED' && kpMovedW10,
  `KP ${relative('docs/research', KP)}: bucket ${kpRow === null ? 'ABSENT FROM POPULATION' : kpRow.bucket}, `
  + `moved [${kpRow === null ? '' : kpRow.moved.join('; ')}] — expect DRIFTED carrying 'W10 true→null'`);

// ── D6 — the figure, over the measured subset ───────────────────────────────────────────────────
const measured = sizes.IDENTICAL + sizes.DRIFTED;
const unmeasured = detail.filter((d) => !['IDENTICAL', 'DRIFTED'].includes(d.bucket));
say(`FIGURE  drifted ${sizes.DRIFTED} of ${measured} MEASURED member(s) `
  + `(population ${population.length}, subjects ${subjects.length}, unmeasured ${unmeasured.length})`);
leg('D6', measured > 0,
  `drifted ${sizes.DRIFTED} / measured ${measured} — denominator is the measured subset, not the population `
  + `(${population.length}) and not the subjects (${subjects.length})`);

// ── D7 — every unmeasured member named ──────────────────────────────────────────────────────────
say('');
say(`UNMEASURED  ${unmeasured.length}:`);
for (const d of unmeasured) say(`   ${d.bucket.padEnd(19)} ${relative('docs/research', d.p)} — ${d.note}`);
leg('D7', unmeasured.length === subjects.length - measured && unmeasured.every((d) => d.note.length > 0),
  `${unmeasured.length} unmeasured, each named with a reason; subjects ${subjects.length} - measured ${measured} = ${subjects.length - measured}`);

// ── the drifted members, per leg ────────────────────────────────────────────────────────────────
say('');
say('DRIFTED, per member:');
for (const d of detail.filter((x) => x.bucket === 'DRIFTED')) {
  say(`   ${relative('docs/research', d.p)}`);
  // A member can drift with an EMPTY intersection — the movement differs per baseline, or the only
  // difference is in the verdict line's fields. The note carries it, so print the note too rather
  // than leaving an empty bullet that reads like "drifted, nothing moved".
  for (const m of d.moved) say(`      common: ${m}`);
  if (d.moved.length === 0) say('      common: NONE — the drift is per-baseline or field-only');
  say(`      ${d.note}`);
}

// ── P1 — the prediction ─────────────────────────────────────────────────────────────────────────
const beyondKp = buckets.DRIFTED.filter((p) => p !== KP);
pred('P1', beyondKp.length > 0,
  `drifted members beyond the W10 KP: ${beyondKp.length}${beyondKp.length ? ` — ${beyondKp.map((p) => relative('docs/research', p)).join(', ')}` : ''}`);

say('');
// `renderTail` returns ONE string, not an array of lines — iterating it would print characters.
say(renderTail({ legs, preds }));
const red = legs.filter((l) => l.ok === false).length;
const refused = legs.filter((l) => l.ok === null).length;
process.exit(red + refused > 0 ? 1 : 0);
