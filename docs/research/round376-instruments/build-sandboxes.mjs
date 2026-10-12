// Round 376 counterfactual builder. Copies the already-verified sandbox (376a, the control that
// drove 8/8 identically to the live tree) and applies ONE named mutation per arm. Every anchor is
// asserted to occur exactly once before replacement (Round 347: a String.replace that lands on a
// near-identical neighbour silently grades the wrong site).
import { cpSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const BASE = '.testdata/round376a';
const R373 = 'scripts/probe-round373-the-red-hint-legs-ran-backwards-from-their-witnesses.mts';
const SWEEP = 'scripts/sweep-probes.mjs';

const KEYED_PAIR =
  'const refusalRe = new RegExp(r225.refusal!.source, `${r225.refusal!.flags}g`);\n' +
  'const skipRe = new RegExp(r225.skip!.source, `${r225.skip!.flags}g`);';

// D2 — BEHAVIOUR-PRESERVING refactor: same two regexes, same registry objects, built through a
// one-line helper instead of two inline `new RegExp(...)` calls. Nothing about what B4 is keyed on
// changes; only how the construction is spelled.
const D2_REPLACEMENT =
  'const gOf = (p: RegExp) => new RegExp(p.source, `${p.flags}g`);\n' +
  'const refusalRe = gOf(r225.refusal!);\n' +
  'const skipRe = gOf(r225.skip!);';

// D3 — the drift A1's own text names: B4 "re-keyed back to a frozen copy of the declared pattern",
// in the shape a person would actually write it (a named const "pinning today's spelling"), with the
// registry-built regex left in place above it.
const D3_ANCHOR = 'const refusalInSubject = (r225Src.match(refusalRe) || []).length;';
const D3_REPLACEMENT =
  '/** Pinned at today\'s declared spelling so this leg\'s figure cannot move under us. */\n' +
  'const FROZEN_REFUSAL = /probe-round223b: something already holds 3001/g;\n' +
  'const refusalInSubject = (r225Src.match(FROZEN_REFUSAL) || []).length;';

// D4 — D3 plus the registry drift Round 374's A5 already drove: the declared refusal shortened to
// the spelling `probe-round225` itself uses in two places.
const REG_ANCHOR = "refusal: /probe-round223b: something already holds 3001/,";
const REG_REPLACEMENT = "refusal: /something already holds 3001/,";

const sub = (src, anchor, replacement, label) => {
  const n = src.split(anchor).length - 1;
  if (n !== 1) throw new Error(`${label}: anchor occurs ${n} time(s), expected exactly 1`);
  console.log(`[anchor ok] ${label}: 1 occurrence`);
  return src.replace(anchor, replacement);
};

const make = (name, fn) => {
  const dst = `.testdata/${name}`;
  rmSync(dst, { recursive: true, force: true });
  cpSync(BASE, dst, { recursive: true });
  rmSync(join(dst, '.git'), { recursive: true, force: true });
  fn(dst);
  console.log(`[built] ${dst}`);
};

make('round376b', (dst) => {
  const f = join(dst, R373);
  writeFileSync(f, sub(readFileSync(f, 'utf8'), KEYED_PAIR, D2_REPLACEMENT, 'D2 keyed-pair'));
});

make('round376c', (dst) => {
  const f = join(dst, R373);
  writeFileSync(f, sub(readFileSync(f, 'utf8'), D3_ANCHOR, D3_REPLACEMENT, 'D3 b4-site'));
});

make('round376d', (dst) => {
  const f = join(dst, R373);
  writeFileSync(f, sub(readFileSync(f, 'utf8'), D3_ANCHOR, D3_REPLACEMENT, 'D4 b4-site'));
  const g = join(dst, SWEEP);
  writeFileSync(g, sub(readFileSync(g, 'utf8'), REG_ANCHOR, REG_REPLACEMENT, 'D4 registry'));
});

// D5 — the registry drift ALONE, on the shipped (registry-keyed) B4. The control that says D4's
// green is attributable to the frozen key and not to the shortened registry on its own.
make('round376e', (dst) => {
  const g = join(dst, SWEEP);
  writeFileSync(g, sub(readFileSync(g, 'utf8'), REG_ANCHOR, REG_REPLACEMENT, 'D5 registry'));
});
