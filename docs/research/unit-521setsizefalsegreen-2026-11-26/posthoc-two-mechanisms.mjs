/**
 * unit-521 — post-hoc for `PRE-REGISTRATION-ADDENDUM-TWO-MECHANISMS.md`.
 *
 * Grades PH1–PH6. The population is the arm's OWN PUBLISHED CAPTURE (`captures/ARM.out`), so this
 * grades the figure that was published rather than a fresh reading that might differ from it; the
 * spans, however, are re-sliced from the live files with the shared lib readers, and the operator
 * form is re-read from each span's tail rather than taken from the arm's `op` field — so the
 * emptiness split is derived independently of the key that fused it.
 *
 * ## The sub-key, and why THROWING is keyed on the parameter NAME
 *
 * `JSON.stringify(x)` is a method call, and a key that asked "does the callback call a method?"
 * would call it a throwing projection. `JSON` is always present; it cannot throw for absence.
 * `JSON.stringify(undefined)` returns `undefined` — it PROPAGATES absence silently, which is the
 * opposite class. So THROWING is keyed on a call whose receiver is the mapped parameter itself
 * (`a.split(`), which is exact, instead of on the presence of a call, which is not.
 */

import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { parenSpanEnd } from '../../../scripts/lib/decl-body.mjs';
import { stripSource } from '../../../scripts/lib/strip-source.mjs';

const ROOT = new URL('../../../', import.meta.url).pathname;
const HERE = new URL('.', import.meta.url).pathname;
const CLOCK = execSync('TZ=America/Los_Angeles date "+%Y-%m-%d %H:%M:%S %Z"', { encoding: 'utf8' }).trim();
const ARM = JSON.parse(readFileSync(`${HERE}captures/ARM.out`, 'utf8'));

// ─── MK: the sub-key's known positives, DRIVEN rather than asserted ─────────────────────────────
// Each cell is the runtime consequence that the class name claims. A class whose consequence is
// only asserted is a label, not a finding.
let threw = null;
try { [undefined].map((a) => a.split(':')[0]); } catch (e) { threw = e.constructor.name; }
const MK = {
  'MK-B PROJ-THROWING: an absent member makes the projection throw': threw === 'TypeError',
  'MK-C PROJ-SILENT: an absent property yields undefined, and the set of them has size 1':
    new Set([{ figures: {} }, { figures: {} }, { figures: {} }].map((r) => r.figures.x)).size === 1,
  'MK-D PROJ-TOTAL: a .length projection is never absent':
    new Set([[], [1]].map((x) => x.length)).size === 2,
  'MK-E JSON.stringify PROPAGATES absence (undefined) but RENDERS a present null (\'null\')':
    JSON.stringify(undefined) === undefined && JSON.stringify(null) === 'null',
};

// ─── PH3: driven, the two operator forms on the SAME empty input ────────────────────────────────
const EMPTY = [];
const PH3 = {
  'new Set([]).size === 1': new Set(EMPTY).size === 1,
  'new Set([]).size < 2': new Set(EMPTY).size < 2,
  opposite: (new Set(EMPTY).size === 1) !== (new Set(EMPTY).size < 2),
};

// ─── re-slice each published member and sub-key it ──────────────────────────────────────────────

const NEEDLE = 'new Set(';
const TOTAL = ['.length', 'Boolean(', 'Number(', 'String('];

const spanAt = (code, line) => {
  const lines = code.split('\n');
  const before = lines.slice(0, line - 1).join('\n');
  const base = line === 1 ? 0 : before.length + 1;
  const i = code.indexOf(NEEDLE, base);
  if (i === -1) return null;
  const open = i + NEEDLE.length - 1;
  const end = parenSpanEnd(code, open);
  if (end === -1) return null;
  return { open, end, span: code.slice(open, end + 1), tail: code.slice(end + 1, end + 41) };
};

const subKey = (span) => {
  const arg = span.slice(1, -1).trim();
  const mapAt = arg.indexOf('.map(');
  if (mapAt === -1) return arg.startsWith('[') ? 'ARG-LITERAL' : 'NO-PROJECTION';
  const cbOpen = mapAt + '.map'.length;
  const cbEnd = parenSpanEnd(arg, cbOpen);
  const cb = cbEnd === -1 ? arg.slice(cbOpen) : arg.slice(cbOpen + 1, cbEnd);
  if (TOTAL.some((t) => cb.includes(t))) return 'PROJ-TOTAL';
  const param = (/^\s*\(?\s*([A-Za-z_$][\w$]*)\s*\)?\s*=>/.exec(cb) || [])[1];
  if (param && new RegExp(`\\b${param}\\.\\w+\\s*\\(`).test(cb)) return 'PROJ-THROWING';
  return 'PROJ-SILENT';
};

const OPS = /^\s*\.size\s*(===|==|!==|!=|>=|<=|>|<)\s*(\d+)/;
const emptinessOf = (tail) => {
  const m = OPS.exec(tail);
  if (!m) return 'NO-TAIL';
  const [, op, n] = [m[0], m[1], Number(m[2])];
  // Derived from the operator literals, not from a table of verdicts typed next to them.
  const verdictOnEmpty = { '===': 0 === n, '==': 0 === n, '!==': 0 !== n, '!=': 0 !== n, '>': 0 > n, '<': 0 < n, '>=': 0 >= n, '<=': 0 <= n }[op];
  return verdictOnEmpty ? 'EMPTY-READS-INVARIANT' : 'EMPTY-READS-VARIED';
};

const parseMember = (s) => {
  const m = /^(\S+):(\d+)\s+\[/.exec(s);
  return { path: m[1], line: Number(m[2]) };
};

const rows = [];
for (const member of ARM.invariance.members) {
  const { path, line } = parseMember(member);
  const code = stripSource(readFileSync(`${ROOT}${path}`, 'utf8'), true);
  const s = spanAt(code, line);
  if (!s) { rows.push({ path, line, subKey: 'SLICE-FAILED', emptiness: 'SLICE-FAILED', span: null }); continue; }
  rows.push({
    path,
    line,
    subKey: subKey(s.span),
    emptiness: emptinessOf(s.tail),
    tail: s.tail.split('\n')[0].trim().slice(0, 40),
    span: s.span.replace(/\s+/g, ' ').slice(0, 220),
  });
}

const tally = (xs, k) => xs.reduce((m, x) => ({ ...m, [x[k]]: (m[x[k]] || 0) + 1 }), {});
const FALSE_GREEN_CAPABLE = ['PROJ-SILENT', 'NO-PROJECTION'];
const capable = rows.filter((r) => FALSE_GREEN_CAPABLE.includes(r.subKey));
const emptyInvariant = rows.filter((r) => r.emptiness === 'EMPTY-READS-INVARIANT');

// PH6 — CHANGE sites in a file that also holds an INVARIANCE site.
const invFiles = new Set(rows.map((r) => r.path));
const changePaired = ARM.change.members
  .map(parseMember)
  .filter((c) => invFiles.has(c.path));

const out = {
  clock: CLOCK,
  gradedAgainst: { armSha: ARM.sha, armClock: ARM.clock, invariance: ARM.invariance.total },
  MK,
  PH3,
  rows,
  tallies: { subKey: tally(rows, 'subKey'), emptiness: tally(rows, 'emptiness') },
  PH1_argLiteral: rows.filter((r) => r.subKey === 'ARG-LITERAL').length,
  PH4_falseGreenCapable: { count: capable.length, members: capable.map((r) => `${r.path}:${r.line} [${r.subKey}]`) },
  PH5_emptinessOnly: {
    count: emptyInvariant.filter((r) => !FALSE_GREEN_CAPABLE.includes(r.subKey)).length,
    members: emptyInvariant.map((r) => `${r.path}:${r.line} [${r.subKey}] ${r.tail}`),
  },
  PH6_pairedChange: { count: changePaired.length, members: changePaired.map((c) => `${c.path}:${c.line}`) },
};

console.log(JSON.stringify(out, null, 2));
