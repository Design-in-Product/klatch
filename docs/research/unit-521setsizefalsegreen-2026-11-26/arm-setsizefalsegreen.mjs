/**
 * unit-521setsizefalsegreen — the arm.
 *
 * Census of `new Set(<expr>).size <op> <n>` sites in the INSTRUMENT corpus (`scripts/` +
 * `docs/research/`), keyed by DIRECTION and by whether the set's own argument excludes absence.
 *
 * Subject: `docs/research/unit-506labelmultiset-2026-11-23/posthoc-standing-linewise.mjs:88`.
 * `new Set(rows.map((r) => r.figures[k])).size === 1` — three `undefined`s make a set of size 1, so
 * a figure absent at EVERY stage is published among the figures that HELD CONSTANT across all
 * three. A false green. Pre-registration: `PRE-REGISTRATION.md`, commit `148ebe57c8f8`.
 *
 * ## Two readers are DEPENDENCIES, not copies
 *
 * `parenSpanEnd` and `stripSource` come from `scripts/lib/`. Checking the lib before hand-rolling
 * is a banked lesson of this seat, and here it paid twice:
 *
 * 1. The pre-registration declared a **STRING/COMMENT PARENS** blindness — a paren inside a string
 *    or comment mis-closing the balanced scan. `stripSource(src, true)` blanks comment AND string
 *    bodies while PRESERVING LENGTH, so the blindness is **cured rather than declared** and every
 *    index into the stripped reading indexes the original too.
 * 2. Searching the STRIPPED text for the literal `new Set(` means a comment *writing about* the
 *    form is not a site. That is `unit-520` §5's P9 resolution (`:33` was a comment about the
 *    form, a true positive of "built-label text" and a false positive of "built label") arriving
 *    for free, by dependency, instead of by hand-reading line text afterwards.
 *
 * The brace-balance gate's population key compares against BOTH braces; this walk compares against
 * parens and is a CONSUMER of the shared slicer, so it is out of that population by construction —
 * asserted at §0 below rather than assumed.
 */

import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { parenSpanEnd } from '../../../scripts/lib/decl-body.mjs';
import { stripSource } from '../../../scripts/lib/strip-source.mjs';

const ROOT = new URL('../../../', import.meta.url).pathname;
const sh = (cmd) => execSync(cmd, { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });

// ─── §0 ─────────────────────────────────────────────────────────────────────────────────────────
// The product tree is untouched by this unit, asserted before any measurement runs.
const dirty = sh('git diff --stat HEAD -- packages/ scripts/').trim();
if (dirty !== '') {
  throw new Error(`§0: packages/ or scripts/ is dirty, so no figure here is attributable:\n${dirty}`);
}
const SHA = sh('git rev-parse --short=12 HEAD').trim();
const CLOCK = sh('TZ=America/Los_Angeles date "+%Y-%m-%d %H:%M:%S %Z"').trim();

// ─── the reader ─────────────────────────────────────────────────────────────────────────────────

const NEEDLE = 'new Set(';
const GUARD_PREDS = ['!= null', '!== null', '!== undefined', '!= undefined', 'Number.isFinite(', 'Boolean('];

/** `>=`/`<=` before `>`/`<`: a shorter alternative first would eat the longer operator. */
const TAIL = /^\s*\.size\s*(===|==|!==|!=|>=|<=|>|<)\s*(\d+)/;

const INVARIANCE = [['===', 1], ['==', 1], ['<=', 1], ['<', 2]];
const CHANGE = [['>', 1], ['>=', 2], ['!==', 1], ['!=', 1]];
const EMPTY = [['===', 0], ['==', 0], ['!==', 0], ['!=', 0], ['>', 0], ['>=', 1]];
const inSet = (table, op, n) => table.some(([o, k]) => o === op && k === n);

const direction = (op, n) => {
  if (inSet(INVARIANCE, op, n)) return 'INVARIANCE';
  if (inSet(CHANGE, op, n)) return 'CHANGE';
  if (inSet(EMPTY, op, n)) return 'EMPTY';
  return 'OTHER-N';
};

const lineOf = (text, idx) => text.slice(0, idx).split('\n').length;

/** Every `new Set(` site in one source, keyed. Operates on the stripped reading; slices the raw. */
function sitesIn(path, raw) {
  const code = stripSource(raw, true);
  const out = [];
  let i = 0;
  while ((i = code.indexOf(NEEDLE, i)) !== -1) {
    const open = i + NEEDLE.length - 1; // index of the `(` of `new Set(`
    const end = parenSpanEnd(code, open);
    const line = lineOf(code, i);
    if (end === -1) {
      out.push({ path, line, direction: 'SCAN-FAILED', guard: null, op: null, n: null, text: null });
      i += NEEDLE.length;
      continue;
    }
    const span = code.slice(open, end + 1);
    const tail = code.slice(end + 1, end + 41);
    const m = TAIL.exec(tail);
    let dir;
    let op = null;
    let n = null;
    if (m) {
      op = m[1];
      n = Number(m[2]);
      dir = direction(op, n);
    } else if (/^\s*\.size/.test(tail)) {
      dir = 'NO-COMPARISON';
    } else {
      dir = 'NOT-SIZE-KEYED';
    }
    // GUARD: exact — the presence predicate must be inside the set's OWN argument span.
    const guard = (dir === 'INVARIANCE' || dir === 'CHANGE')
      ? (GUARD_PREDS.some((p) => span.includes(p)) ? 'GUARDED' : 'BLIND')
      : null;
    // The proximity-window reading, computed as a SEPARATE UPPER BOUND and never as the key: a
    // proximity-window consumer key over-reports, and this seat has recorded that.
    const lines = code.split('\n');
    const window = lines.slice(Math.max(0, line - 11), line).join('\n');
    const nearGuard = guard !== null && GUARD_PREDS.some((p) => window.includes(p));
    out.push({
      path,
      line,
      direction: dir,
      guard,
      nearGuard,
      op,
      n,
      text: raw.split('\n')[line - 1].trim().slice(0, 150),
    });
    i = end + 1;
  }
  return out;
}

// ─── population, pinned to the SHA above ────────────────────────────────────────────────────────

const CODE_EXT = /\.(mjs|mts|js|ts|cjs)$/;
const tracked = sh('git ls-files').split('\n').filter(Boolean);
const instrumentCorpus = tracked.filter(
  (p) => CODE_EXT.test(p) && (p.startsWith('scripts/') || p.startsWith('docs/research/')),
);
const productCorpus = tracked.filter((p) => CODE_EXT.test(p) && p.startsWith('packages/'));

const read = (p) => { try { return readFileSync(`${ROOT}${p}`, 'utf8'); } catch { return null; } };

const allSites = [];
let unreadable = 0;
let rawOnlyNeedles = 0; // post-hoc, NOT pre-registered: `new Set(` in prose/strings only
for (const p of instrumentCorpus) {
  const raw = read(p);
  if (raw === null) { unreadable += 1; continue; }
  const rawCount = raw.split(NEEDLE).length - 1;
  const codeCount = stripSource(raw, true).split(NEEDLE).length - 1;
  rawOnlyNeedles += rawCount - codeCount;
  allSites.push(...sitesIn(p, raw));
}

const productSites = [];
for (const p of productCorpus) {
  const raw = read(p);
  if (raw !== null) productSites.push(...sitesIn(p, raw));
}

const by = (xs, k) => xs.reduce((m, x) => ({ ...m, [x[k]]: (m[x[k]] || 0) + 1 }), {});
const invariance = allSites.filter((s) => s.direction === 'INVARIANCE');
const change = allSites.filter((s) => s.direction === 'CHANGE');

// ─── P12: the INDIRECT upper bound ──────────────────────────────────────────────────────────────
// Every literal `.size` comparison in the corpus that is NOT the tail of a balanced `new Set(...)`.
// Over-counts by construction: it also holds every Map/other-collection `.size`. Reported as a
// bound, never as a count.
const SIZE_CMP = /\.size\s*(?:===|==|!==|!=|>=|<=|>|<)\s*\d+/g;
let indirectBound = 0;
for (const p of instrumentCorpus) {
  const raw = read(p);
  if (raw === null) continue;
  const code = stripSource(raw, true);
  const tails = new Set();
  let i = 0;
  while ((i = code.indexOf(NEEDLE, i)) !== -1) {
    const open = i + NEEDLE.length - 1;
    const end = parenSpanEnd(code, open);
    if (end !== -1) {
      const after = code.slice(end + 1);
      const ws = after.length - after.trimStart().length;
      tails.add(end + 1 + ws);
      i = end + 1;
    } else i += NEEDLE.length;
  }
  for (const m of code.matchAll(SIZE_CMP)) if (!tails.has(m.index)) indirectBound += 1;
}

// ─── KP: seven cells, planted-and-declared except KP5 which is SLICED ───────────────────────────
// Whether the LIVE corpus holds a guarded invariance site is the question this unit asks, so a
// sliced positive would presuppose the answer. KP5 is the direction where a real cell can be had.
const KP5_HOST = 'scripts/verify-x0-reachability.mjs';
const KP5_RAW = read(KP5_HOST);
const KP5_LINE = KP5_RAW.split('\n')[213]; // :214, hand-read before this script existed
if (!KP5_LINE.includes('new Set(') || /\.size/.test(KP5_LINE)) {
  throw new Error(`KP5: the sliced known negative moved — ${KP5_HOST}:214 is now: ${KP5_LINE}`);
}

const KP_SOURCE = [
  '// KP1 — the live subject\'s exact form.',
  'const flatFigures = Object.keys(NAMED).filter(',
  '  (k) => new Set(rows.map((r) => r.figures[k])).size === 1,',
  ');',
  '// KP2 — the same with an arg-internal presence filter.',
  'const guardedFlat = Object.keys(NAMED).filter(',
  '  (k) => new Set(rows.map((r) => r.figures[k]).filter((v) => v !== undefined)).size === 1,',
  ');',
  '// KP3 — the CHANGE direction.',
  'const moved = Object.keys(NAMED).filter((k) => new Set(rows.map((r) => r.figures[k])).size > 1);',
  '// KP4 — a set argument spanning three source lines: a different SHAPE, not a second KP1.',
  'const spread = new Set(',
  '  rows',
  '    .map((r) => r.figures.x),',
  ').size === 1;',
  `// KP5 — SLICED known negative from ${KP5_HOST}:214, no \`.size\` follows.`,
  KP5_LINE,
  '// KP6 — the EMPTY bucket.',
  'const none = new Set(xs).size === 0;',
  '// KP7 — the OTHER-N fall-through bucket, so it is reachable rather than absorbent.',
  'const three = new Set(xs).size === 3;',
].join('\n');

const kpSites = sitesIn('<KP>', KP_SOURCE);
const kpCell = (name, pred) => ({ name, pass: Boolean(pred) });
const findKp = (needle) => kpSites.find((s) => s.text.includes(needle));
const KP = [
  kpCell('KP1 INVARIANCE/BLIND (live subject form)', (() => {
    const s = findKp('r.figures[k])).size === 1');
    return s && s.direction === 'INVARIANCE' && s.guard === 'BLIND';
  })()),
  kpCell('KP2 INVARIANCE/GUARDED (arg-internal presence filter)', (() => {
    const s = findKp('v !== undefined');
    return s && s.direction === 'INVARIANCE' && s.guard === 'GUARDED';
  })()),
  kpCell('KP3 CHANGE', (() => {
    const s = findKp('.size > 1');
    return s && s.direction === 'CHANGE';
  })()),
  kpCell('KP4 three-line span found and keyed INVARIANCE', (() => {
    const s = kpSites.find((x) => x.text === 'const spread = new Set(');
    return s && s.direction === 'INVARIANCE' && s.guard === 'BLIND';
  })()),
  kpCell('KP5 SLICED known negative refused into NOT-SIZE-KEYED', (() => {
    const s = kpSites.find((x) => x.text === KP5_LINE.trim().slice(0, 150));
    return s && s.direction === 'NOT-SIZE-KEYED' && s.guard === null;
  })()),
  kpCell('KP6 EMPTY reachable', (() => {
    const s = findKp('.size === 0');
    return s && s.direction === 'EMPTY';
  })()),
  kpCell('KP7 OTHER-N fall-through reachable', (() => {
    const s = findKp('.size === 3');
    return s && s.direction === 'OTHER-N';
  })()),
];

// ─── P7: the driven counterfactual, on a SLICED expression ──────────────────────────────────────
// The verdict is produced by the published code, not retyped here. Slicing the inputs and retyping
// the verdict measures the retyping.
const HOST = 'docs/research/unit-506labelmultiset-2026-11-23/posthoc-standing-linewise.mjs';
const hostRaw = read(HOST);
const hostCode = stripSource(hostRaw, true);
const flatAt = hostCode.indexOf('const flatFigures');
const movedAt = hostCode.indexOf('const movedFigures');
if (flatAt === -1 || movedAt === -1) throw new Error('P7: the host expression moved; slice refused.');
const movedOpen = hostCode.indexOf('(', hostCode.indexOf('.filter', movedAt));
const movedEnd = parenSpanEnd(hostCode, movedOpen);
if (movedEnd === -1) throw new Error('P7: the host expression never closes; slice refused.');
const SLICE = hostRaw.slice(flatAt, movedEnd + 2);
for (const marker of ['new Set(', 'r.figures[k]', '.size === 1', '.size > 1', 'Object.keys(NAMED)']) {
  if (!SLICE.includes(marker)) throw new Error(`P7: sliced span is missing \`${marker}\``);
}
const drive = new Function('NAMED', 'rows', `${SLICE}\nreturn { flatFigures, movedFigures };`);
const NAMED = { 'tracked files read': 0 };
const stages = (v) => [1, 2, 3].map((i) => ({ stage: `s${i}`, figures: v === 'absent' ? {} : { 'tracked files read': v } }));
const P7 = {
  allEqual: drive(NAMED, stages(1072)),
  allUndefined: drive(NAMED, stages('absent')),
  allNull: drive(NAMED, stages(null)),
};

// ─── report ─────────────────────────────────────────────────────────────────────────────────────

const out = {
  sha: SHA,
  clock: CLOCK,
  population: {
    tracked: tracked.length,
    instrumentCorpus: instrumentCorpus.length,
    productCorpus: productCorpus.length,
    unreadable,
  },
  sites: {
    total: allSites.length,
    byDirection: by(allSites, 'direction'),
    sizeKeyed: allSites.filter((s) => ['INVARIANCE', 'CHANGE', 'EMPTY', 'OTHER-N'].includes(s.direction)).length,
    scanFailed: allSites.filter((s) => s.direction === 'SCAN-FAILED').length,
  },
  invariance: {
    total: invariance.length,
    blind: invariance.filter((s) => s.guard === 'BLIND').length,
    guarded: invariance.filter((s) => s.guard === 'GUARDED').length,
    blindButNearGuard: invariance.filter((s) => s.guard === 'BLIND' && s.nearGuard).length,
    members: invariance.map((s) => `${s.path}:${s.line}  [${s.guard}${s.nearGuard ? ' near-guard' : ''}]  ${s.text}`),
  },
  change: {
    total: change.length,
    blind: change.filter((s) => s.guard === 'BLIND').length,
    guarded: change.filter((s) => s.guard === 'GUARDED').length,
    blindButNearGuard: change.filter((s) => s.guard === 'BLIND' && s.nearGuard).length,
    members: change.map((s) => `${s.path}:${s.line}  [${s.guard}${s.nearGuard ? ' near-guard' : ''}]  ${s.text}`),
  },
  product: {
    sites: productSites.length,
    invariance: productSites.filter((s) => s.direction === 'INVARIANCE').length,
    members: productSites.filter((s) => s.direction === 'INVARIANCE').map((s) => `${s.path}:${s.line}  ${s.text}`),
  },
  indirectBound,
  rawOnlyNeedles,
  kp: KP,
  kpPassing: `${KP.filter((k) => k.pass).length} of ${KP.length}`,
  p7: P7,
};

console.log(JSON.stringify(out, null, 2));
