/* memory-index-trim.mjs — compact MEMORY.md's HOOKS without touching its entry set.
 *
 * Written 2026-11-25 STOP (Theseus) after a post-write hook reported the index at 19.5 KB against a
 * 17.1 KB target. The 2026-11-17 WORK fire did this by hand and got 20,844 B → 15,981 B; eight days
 * later the same 125 entries measured 19,969 B, because fires kept appending detail to hooks. A
 * by-hand pass that has to be repeated is a script that was never written, so this is the script.
 *
 * It does NOT merge entries. The ~20-merge structural pass recorded as owed in the index preamble is
 * still owed; this only buys bytes.
 *
 * Invariants, asserted before anything is written — the apply aborts if any fails:
 *   1. the entry count is unchanged
 *   2. the ordered list of link TARGETS is byte-identical
 *   3. the ordered list of entry TITLES is byte-identical
 *   4. the result is smaller
 * Run with --apply to write; default is a dry run.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const PATH = process.env.MEMORY_INDEX
  ?? '/Users/xian/.claude/projects/-Users-xian-Development-klatch/memory/MEMORY.md';
const APPLY = process.argv.includes('--apply');
const BUDGET = 110;            // bytes; entries at or under this are left alone

/* The title is matched GREEDILY and the target is pinned to `.md`, because one title legitimately
 * contains brackets — `A \`[false,false]\` row looks like an untouched defect` — and a `[^\]]+`
 * title class silently drops that line from the population. It was found by comparing this
 * script's 124 against a `/^- \[/` count of 125; the line is short and would have been left
 * untouched either way, which is exactly why a population one member short can go unnoticed. */
const ENTRY = /^- \[(.+)\]\((\S+?\.md)\)(.*)$/;
const parse = (s) => s.split('\n').map((line) => {
  const m = line.match(ENTRY);
  return m ? { line, title: m[1], target: m[2], hook: m[3] } : { line, title: null, target: null, hook: null };
});

const src = readFileSync(PATH, 'utf8');
const rows = parse(src);
const entries = rows.filter((r) => r.target !== null);
const bytes = (s) => Buffer.byteLength(s, 'utf8');

/* A hook is kept only when it carries something no title can: a COUNT, or a STATUS fact. Everything
 * else is detail, and detail belongs in the file the line points at. */
const keepers = [
  /^ — (\d+)(?: (?:cases?|instances?|directions?|mechanisms?))?\b/,   // "— 7 cases; the 7th is …" → "— 7"
  /^ — (closed [^;,]+)/,                                             // a status fact, not detail
];
const trim = (hook) => {
  for (const re of keepers) {
    const m = hook.match(re);
    if (m) return ` — ${m[1]}`;
  }
  return '';
};

let trimmed = 0;
const outRows = rows.map((r) => {
  if (r.target === null) return r.line;
  if (bytes(r.line) <= BUDGET) return r.line;
  const next = `- [${r.title}](${r.target})${trim(r.hook)}`;
  if (next !== r.line) trimmed += 1;
  return next;
});
const out = outRows.join('\n');

const after = parse(out).filter((r) => r.target !== null);
const ok = {
  count: after.length === entries.length,
  targets: JSON.stringify(after.map((r) => r.target)) === JSON.stringify(entries.map((r) => r.target)),
  titles: JSON.stringify(after.map((r) => r.title)) === JSON.stringify(entries.map((r) => r.title)),
  smaller: bytes(out) < bytes(src),
};

console.log(`index: ${PATH}`);
console.log(`  entries before ${entries.length}  after ${after.length}`);
console.log(`  bytes   before ${bytes(src)}  after ${bytes(out)}   delta ${bytes(out) - bytes(src)}`);
console.log(`  hooks trimmed: ${trimmed}`);
console.log(`  invariants: ${Object.entries(ok).map(([k, v]) => `${k}=${v}`).join('  ')}`);

const allOk = Object.values(ok).every(Boolean);
if (!allOk) { console.log('\n  ABORT — an invariant failed; nothing written.'); process.exit(1); }
if (!APPLY) { console.log('\n  dry run; pass --apply to write.'); process.exit(0); }
writeFileSync(PATH, out);
console.log('\n  written.');
