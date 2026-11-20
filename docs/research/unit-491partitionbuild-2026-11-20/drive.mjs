#!/usr/bin/env node
/**
 * unit-491partitionbuild — the drive harness.
 *
 * Measures the published verdict partition's format against **every reader in this tree that reads
 * those rows**, before and after the format cure, plus the two assertions the cure adds.
 *
 * **R3 — nothing here is hand-typed.** Every reader literal is SLICED out of its own source file at
 * a unique anchor. Absence refuses `rc=2`; an anchor that matches twice refuses `rc=3` (R4), because
 * an anchor that matches twice is not an anchor — `unit-489markedrekey` §3's lesson arriving in this
 * instrument. The two count-first probes are labelled DERIVED and are produced by an **operand swap
 * on a sliced literal**, with the source span printed, never by typing a second spelling.
 *
 * **NO exemption marker, and that absence is deliberate and measured.** The reflex was to write one
 * — this file scans source character by character — but the gate's exemption is for a DECLARATION
 * BODY sliced by brace balance, and this file scans for regex-literal termination (slashes and
 * character classes) and never compares against `{` or `}`. So it is OUT of the population, a marker
 * here would exempt nothing, and it would join the gate's own disclosure list as one more member of
 * the class that report calls *"markers that were never load-bearing, written defensively by an
 * author whose sibling file had just reddened."* Found by reading that paragraph in the subject while
 * editing it. See RESULTS §6.
 *
 * Usage:
 *   node drive.mjs census                 — slice and print the reader set, with spans
 *   node drive.mjs read <capture.out>     — drive every sliced reader against a capture
 *   node drive.mjs gate <gate.mjs> <out>  — drive a gate copy, capture stdout+stderr SEPARATELY
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../../..');

const die = (rc, msg) => { console.error(`drive: REFUSED rc=${rc} — ${msg}`); process.exit(rc); };

/* ------------------------------------------------------------------ slicing (R3/R4) */
// One anchor per site. The anchor must occur EXACTLY once in its file: absent → rc=2, twice → rc=3.
// `cripple-dead-marker-key.mjs` carries `/^\s*MARKED\s+(\d+)/m` TWICE (lines 96 and 157, one under
// `one(` and one under `lg(`), which is why the anchors carry the call name and not the literal.
const SITES = [
  { id: 'a479.UNGUARDED', file: 'docs/research/unit-479braceslicekeys-2026-11-18/arm-braceslicekeys-a.mjs', anchor: '  UNGUARDED: gp(' },
  { id: 'a479.MARKED', file: 'docs/research/unit-479braceslicekeys-2026-11-18/arm-braceslicekeys-a.mjs', anchor: '  MARKED: gp(' },
  { id: 'a479.GUARDED', file: 'docs/research/unit-479braceslicekeys-2026-11-18/arm-braceslicekeys-a.mjs', anchor: '  GUARDED: gp(' },
  { id: 'c487.one.MARKED', file: 'docs/research/unit-487markerreport-2026-11-19/cripple-dead-marker-key.mjs', anchor: '    MARKED: one(' },
  { id: 'c487.one.GUARDED', file: 'docs/research/unit-487markerreport-2026-11-19/cripple-dead-marker-key.mjs', anchor: '    GUARDED: one(' },
  { id: 'c487.one.UNGUARDED', file: 'docs/research/unit-487markerreport-2026-11-19/cripple-dead-marker-key.mjs', anchor: '    UNGUARDED: one(' },
  { id: 'c487.lg.MARKED', file: 'docs/research/unit-487markerreport-2026-11-19/cripple-dead-marker-key.mjs', anchor: '  MARKED: lg(' },
  // The 8th literal is a QUOTATION in a docblock — the file that documents the hazard in prose. It
  // is the only unanchored reader in the tree and the one the cure is aimed at.
  { id: 'p487.quoted.UNANCHORED', file: 'docs/research/unit-487markerreport-2026-11-19/posthoc-label-substring.mjs', anchor: ' * `/GUARDED', quoted: true },
];

/** Slice the regex literal that follows `anchor` on its own line. Returns {body, flags, span}. */
function sliceLiteral(site) {
  const abs = join(ROOT, site.file);
  let raw;
  try { raw = readFileSync(abs, 'utf8'); } catch { die(2, `source absent: ${site.file}`); }
  let at = raw.indexOf(site.anchor);
  if (at < 0) die(2, `anchor absent in ${site.file}: ${JSON.stringify(site.anchor)}`);
  if (raw.indexOf(site.anchor, at + 1) >= 0) {
    die(3, `anchor AMBIGUOUS in ${site.file} (matches 2+): ${JSON.stringify(site.anchor)}`);
  }
  // In the quoted case the literal is delimited by backticks in prose; otherwise it is a JS regex
  // literal starting at the first `/` after the anchor. Both end at an unescaped `/`.
  const open = raw.indexOf('/', at + (site.quoted ? 0 : site.anchor.length));
  if (open < 0) die(2, `no literal after anchor in ${site.file}`);
  let i = open + 1; let inClass = false; let body = '';
  for (; i < raw.length; i += 1) {
    const ch = raw[i];
    if (ch === '\\') { body += ch + raw[i + 1]; i += 1; continue; }
    if (ch === '\n') die(2, `unterminated literal after anchor in ${site.file}`);
    if (ch === '[') inClass = true;
    if (ch === ']') inClass = false;
    if (ch === '/' && !inClass) break;
    body += ch;
  }
  let flags = '';
  for (let j = i + 1; j < raw.length && /[a-z]/.test(raw[j]); j += 1) flags += raw[j];
  const line = raw.slice(0, open).split('\n').length;
  return { ...site, body, flags, span: `${site.file}:${line}` };
}

/** DERIVED, by operand swap on a sliced literal: `LABEL\s+(\d+)` → `(\d+)\s+LABEL`. */
function deriveCountFirst(sliced) {
  const m = /^(\^?\\s[*+]?)?([A-Z]+)(\\s\+)(\(\\d\+\))(\$?)$/.exec(sliced.body);
  if (!m) die(2, `cannot DERIVE a count-first probe from ${sliced.id}: body ${sliced.body}`);
  return {
    id: `DERIVED.countfirst.${m[2]}`,
    body: `${m[4]}${m[3]}${m[2]}`,
    flags: sliced.flags.replace('m', ''),
    span: `DERIVED by operand swap on ${sliced.span} (${sliced.body})`,
  };
}

const sliced = SITES.map(sliceLiteral);
const unanchored = sliced.find((s) => s.id === 'p487.quoted.UNANCHORED');
const guardedAnchored = sliced.find((s) => s.id === 'c487.one.GUARDED');
const unguardedAnchored = sliced.find((s) => s.id === 'c487.one.UNGUARDED');
const derived = [deriveCountFirst(unanchored), deriveCountFirst(unguardedAnchored)];
if (derived[0].body === derived[1].body) die(3, 'the two DERIVED probes collapsed to one spelling');

const cmd = process.argv[2];

if (cmd === 'census') {
  console.log(`unit-491 reader census — ${sliced.length} literals sliced from source, 0 hand-typed`);
  for (const s of sliced) {
    const anchoredAtLineStart = s.body.startsWith('^');
    console.log(`  ${s.id.padEnd(22)} ${anchoredAtLineStart ? 'ANCHORED  ' : 'UNANCHORED'} /${s.body}/${s.flags}`);
    console.log(`      ${s.span}`);
  }
  for (const d of derived) {
    console.log(`  ${d.id.padEnd(22)} DERIVED    /${d.body}/${d.flags}`);
    console.log(`      ${d.span}`);
  }
  const anchored = sliced.filter((s) => s.body.startsWith('^')).length;
  console.log(`  anchored ${anchored} · unanchored ${sliced.length - anchored} · derived ${derived.length}`);
  process.exit(0);
}

if (cmd === 'read') {
  const cap = process.argv[3];
  if (!cap) die(2, 'read needs a capture path');
  let txt;
  try { txt = readFileSync(resolve(cap), 'utf8'); } catch { die(2, `capture absent: ${cap}`); }
  console.log(`unit-491 reader drive against ${cap}`);
  for (const s of [...sliced, ...derived]) {
    const re = new RegExp(s.body, s.flags);
    const m = txt.match(re);
    console.log(`  ${s.id.padEnd(22)} → ${m ? m[1] ?? m[0] : 'null'}`);
  }
  process.exit(0);
}

if (cmd === 'gate') {
  const gate = process.argv[3]; const out = process.argv[4];
  if (!gate || !out) die(2, 'gate needs <gate.mjs> <out>');
  // Theseus `unit-490` §6: `execFileSync` leaves stderr INHERITED by default, so another writer's
  // block interleaves into the capture while being absent from the string the legs read. An artefact
  // interleaved from two writers is not a capture of either. `spawnSync` here because a gate that
  // REFUSES (`rc=2`) or reddens (`rc=1`) must be captured, not thrown — and the rc is a measurement.
  const r = spawnSync('node', [resolve(gate)], {
    encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], cwd: ROOT,
  });
  if (r.error) die(2, `could not drive ${gate}: ${r.error.message}`);
  writeFileSync(resolve(out), r.stdout);
  writeFileSync(`${resolve(out)}.stderr`, r.stderr);
  console.log(`rc=${r.status} · stdout ${r.stdout.length} B → ${out} · stderr ${r.stderr.length} B → ${out}.stderr`);
  process.exit(0);
}

die(2, `unknown command ${JSON.stringify(cmd)}`);
