#!/usr/bin/env node
// make-scratch.mjs — unit-464absorb, 2026-10-31 WORK fire (Daedalus).
//
// Builds the instrumented scratch copy of the LIVE checker by DERIVING it from the live
// source, not by hand-editing a 65KB copy and not by retyping anything. Every substitution
// is asserted to hit EXACTLY ONCE and the script exits non-zero and writes nothing if any
// anchor is absent or ambiguous — a copy whose anchor silently missed is a second
// implementation that reads as the first.
//
// The copy is written at the SAME DIRECTORY DEPTH as the checker's own — directly in this
// unit dir, one level under `docs/research/` — so the `../unit-…/…` arm paths in the drive
// resolve exactly as they did for the committed recording. A copy at the wrong depth refuses
// every cell.
//
// `DEPTH` below is an ASSERTION and not a claim: the checker is grepped for every
// script-relative resolver (`import.meta`, `__dirname`, `fileURLToPath`, `process.cwd`) and
// the generator refuses to write if any is present, because then moving the file WOULD change
// behaviour and cwd alone would not pin it. Measured here: zero such sites, so cwd is the
// only thing that matters and the drive pins cwd.
//
// Four knobs, all read from the environment so ONE file serves every arm and the arms
// cannot differ in anything but the knob:
//   ABSORB_BOUNDARY  live | wide | dead   — the `tokensOf` left boundary
//   ABSORB_CRIPPLE   '' | ownemits-empty | ctx-whole-section | emitted-empty
//   ABSORB_DUMP      path                 — where the per-member JSON goes (stdout untouched)
//
// Usage: node make-scratch.mjs

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';

const HERE = dirname(new URL(import.meta.url).pathname);
const LIVE = resolve(HERE, '../unit-464mapkey-2026-10-30/grade-filed-maps.mjs');
const OUT = resolve(HERE, 'grade-filed-maps.INSTRUMENTED.mjs');

const src = readFileSync(LIVE, 'utf8');

/** @type {{tag:string, find:string, repl:string}[]} */
const SUBS = [];

// --- 1. The boundary, env-driven. The `live` literal is the live source's own; the `wide`
// literal is the one-character-class cure Theseus's CUREDIFF measured; the `dead` literal is
// his own private-use-codepoint boundary (matches nothing — a real dead arm, not a wider one).
SUBS.push({
  tag: 'boundary',
  find: '  const re = /(?:^|\\s)([A-Za-z][A-Za-z0-9_.]*)=/g;',
  repl: [
    '  const re = new RegExp(',
    "    process.env.ABSORB_BOUNDARY === 'wide'",
    "      ? '(?:^|[^A-Za-z0-9_.])([A-Za-z][A-Za-z0-9_.]*)='",
    "      : process.env.ABSORB_BOUNDARY === 'dead'",
    "        ? '(?:\\uE000)([A-Za-z][A-Za-z0-9_.]*)='",
    "        : '(?:^|\\\\s)([A-Za-z][A-Za-z0-9_.]*)=',",
    "    'g',",
    '  );',
  ].join('\n'),
});

// --- 2. The three subtrahend/scope cripples, each at its own live site.
SUBS.push({
  tag: 'ownEmits-cripple',
  find: `    const ownEmits = new Set([
      ...(a === undefined ? [] : tokensOf(a.payload).keys()),
      ...(b === undefined ? [] : tokensOf(b.payload).keys()),
    ]);`,
  repl: `    const ownEmits = process.env.ABSORB_CRIPPLE === 'ownemits-empty' ? new Set() : new Set([
      ...(a === undefined ? [] : tokensOf(a.payload).keys()),
      ...(b === undefined ? [] : tokensOf(b.payload).keys()),
    ]);`,
});

SUBS.push({
  tag: 'ctx-cripple',
  find: '  const rows = reached.map((id) => {\n    const ctx = mentions(id);',
  repl:
    '  const rows = reached.map((id) => {\n' +
    "    const ctx = process.env.ABSORB_CRIPPLE === 'ctx-whole-section' ? (unmapped ? [] : section) : mentions(id);",
});

SUBS.push({
  tag: 'emitted-cripple',
  find: `  const emitted = new Set();
  for (const v of arm.values()) for (const t of tokensOf(v.payload).keys()) emitted.add(t);`,
  repl: `  const emitted = new Set();
  if (process.env.ABSORB_CRIPPLE !== 'emitted-empty')
  for (const v of arm.values()) for (const t of tokensOf(v.payload).keys()) emitted.add(t);`,
});

// --- 3. The instrumentation. Writes ONLY to `globalThis.__ABSORB`, never to stdout, so the
// `live` arm can be byte-compared against the committed recording. Inserted at the two live
// sites where the sets already exist, so nothing is recomputed by a second reader.
SUBS.push({
  tag: 'instr-row',
  find: `    const typed = [...quotedOfMe].filter((t) => !ownEmits.has(t)).sort();`,
  repl: `    const typed = [...quotedOfMe].filter((t) => !ownEmits.has(t)).sort();
    (globalThis.__ABSORB ??= { rows: [], arms: [] }).rows.push({
      id,
      ctxLines: ctx.length,
      ownEmits: [...ownEmits].sort(),
      quotedOfMe: [...quotedOfMe].sort(),
      typed,
      aTokens: a === undefined ? null : [...tokensOf(a.payload).keys()].sort(),
      bTokens: b === undefined ? null : [...tokensOf(b.payload).keys()].sort(),
    });`,
});

SUBS.push({
  tag: 'instr-arm',
  find: `  const typedRecordingKey = [...quoted].filter((t) => !emitted.has(t)).sort();`,
  repl: `  const typedRecordingKey = [...quoted].filter((t) => !emitted.has(t)).sort();
  (globalThis.__ABSORB ??= { rows: [], arms: [] }).arms.push({
    unmapped,
    sectionLines: unmapped ? 0 : section.length,
    emitted: [...emitted].sort(),
    quoted: [...quoted].sort(),
    typedRecordingKey,
    reached: reached.slice().sort(),
  });`,
});

// --- 4. The dump, inserted BEFORE the checker's own `process.exit(code)`.
//
// This was first written as an APPENDED TAIL at EOF, which never ran: the checker's last
// statement is `process.exit(code)`, so everything after it is dead code and every dump file
// was absent. The absence is what caught it — had the tail written an empty-but-present file,
// the attribution would have run on `{rows:[],arms:[]}` and reported a clean zero.
//
// So the insert is anchored on that exit, and the anchor must occur exactly once like the
// others. `writeFileSync` is NOT among the checker's own imports (`readFileSync`,
// `realpathSync`, `statSync`), so it is imported here under a mangled name.
SUBS.push({
  tag: 'instr-dump',
  find: 'process.exit(code);',
  repl: `if (process.env.ABSORB_DUMP !== undefined && process.env.ABSORB_DUMP !== '') {
  const { writeFileSync: __absorbWrite } = await import('node:fs');
  __absorbWrite(
    process.env.ABSORB_DUMP,
    JSON.stringify(
      {
        boundary: process.env.ABSORB_BOUNDARY ?? 'live',
        cripple: process.env.ABSORB_CRIPPLE ?? '',
        ...(globalThis.__ABSORB ?? { rows: [], arms: [] }),
      },
      null,
      2,
    ) + '\\n',
  );
}
process.exit(code);`,
});

let out = src;
const report = [];
for (const { tag, find, repl } of SUBS) {
  const n = out.split(find).length - 1;
  report.push(`  ${tag.padEnd(18)} anchor occurrences=${n}`);
  if (n !== 1) {
    console.log(report.join('\n'));
    console.error(`FATAL ${tag}: anchor occurs ${n} time(s), need exactly 1 — nothing written`);
    process.exit(2);
  }
  out = out.replace(find, repl);
}

// --- DEPTH, as an assertion. If the checker resolved anything relative to its own file,
// a copy elsewhere would behave differently and pinning cwd would not be enough.
const RELATIVE_RESOLVERS = ['import.meta', '__dirname', 'fileURLToPath', 'process.cwd'];
const found = RELATIVE_RESOLVERS.filter((r) => src.includes(r));
console.log('make-scratch.mjs — anchors, each required to occur exactly once:');
console.log(report.join('\n'));
console.log(
  `DEPTH  script-relative resolvers in the live checker: ${found.length} [${found.join(',')}]` +
    ` — of [${RELATIVE_RESOLVERS.join(',')}]`,
);
if (found.length > 0) {
  console.error('FATAL the checker resolves paths relative to its own file — a copy cannot be pinned by cwd alone; nothing written');
  process.exit(2);
}
writeFileSync(OUT, out);
console.log(`live   : ${LIVE}  ${src.length}B`);
console.log(`scratch: ${OUT}  ${out.length}B  (same dir depth as the checker: one under docs/research/)`);
