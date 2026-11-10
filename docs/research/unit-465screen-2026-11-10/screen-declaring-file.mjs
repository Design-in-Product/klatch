#!/usr/bin/env node
/**
 * unit-465screen — the screen Daedalus's P5 implies, built AND graded against the cells it is
 * derived from.
 *
 * The screen, as his §6 states it: report by `occ(declaring file, anchor)` rather than by "is it
 * hand-typed?". Formally, anchor A declared in copier D with value v is FLAGGED iff
 * `occ(D, v) >= 2` — because `occ` is a SUBSTRING count, A's own declaration line contributes 1, so
 * 2 means "the declaring file also carries the real line".
 *
 * R2 holds: no anchor value, line number or cell count is typed here.
 *   - ids, declaring copiers, declaration LINE NUMBERS, kinds and all 66 cells come from a FRESH run
 *     of `unit-465census-v2/census-anchors-v2.mjs` (unedited; R3).
 *   - anchor VALUES are read off the declaring file's own source at the line v2 reports — NOT parsed
 *     out of v2's stdout, because v2 prints `a.rhs.slice(0, 96)` and a truncated needle would
 *     silently inflate every count derived from it.
 *   - the recovered values are then CALIBRATED: this reader recomputes all of v2's cells with its own
 *     `occ` and must reproduce every one, member by member, or it REFUSES (R6/R7).
 *
 * v1 and v2 are not edited. This is a third, separate reader.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..', '..');
const SCRIPTS = join(REPO, 'scripts');
const V2DIR = join(REPO, 'docs', 'research', 'unit-465census-v2-2026-11-10');
const V2 = join(V2DIR, 'census-anchors-v2.mjs');
const V2CAP = join(V2DIR, 'census-v2-run-1.txt');

const refuse = (why) => {
  console.log(`REFUSED — ${why}`);
  process.exit(2);
};
if (!existsSync(join(SCRIPTS, 'sweep-probes.mjs'))) refuse(`scripts/ not found at ${SCRIPTS} (resolved from ${HERE})`);
if (!existsSync(V2) || !existsSync(V2CAP)) refuse(`v2 source or capture not found under ${V2DIR}`);

/** v2's own definition, census-anchors-v2.mjs:39 — a substring count over the whole file text. */
const occ = (hay, needle) => (needle === '' ? -1 : hay.split(needle).length - 1);

// ---- LEG 1 (P1) — reproduce v2 in THIS tree, and diff against its committed capture -------------
console.log(`== LEG 1 (P1). v2 re-run unedited in this worktree, vs. its committed capture ==`);
const run = spawnSync(process.execPath, [V2], { encoding: 'utf8', cwd: REPO });
console.log(`  exit code (from spawnSync, not inferred from the output): ${run.status}`);
if (run.status !== 0) refuse(`v2 exited ${run.status}; stderr: ${(run.stderr || '').slice(0, 300)}`);
const fresh = run.stdout;
const committed = readFileSync(V2CAP, 'utf8');
const fl = fresh.split('\n');
const cl = committed.split('\n');
const diffLines = [];
for (let i = 0; i < Math.max(fl.length, cl.length); i++) if (fl[i] !== cl[i]) diffLines.push(i + 1);
console.log(`  lines: fresh ${fl.length}, committed ${cl.length} · differing line numbers: ${diffLines.join(', ') || '(none)'}`);
for (const n of diffLines.slice(0, 6)) {
  console.log(`    L${n} committed: ${String(cl[n - 1]).slice(0, 110)}`);
  console.log(`    L${n} fresh    : ${String(fl[n - 1]).slice(0, 110)}`);
}

// ---- parse the fresh run -------------------------------------------------------------------------
const copierFull = [];
for (const l of fl) {
  const m = /^ {2}(\S+\.mts) {2}\(throw at :(\d+)\)$/.exec(l);
  if (m) copierFull.push(m[1]);
}
const subjects = [];
for (const l of fl) {
  const m = /^ {2}(\S+?) {2}— /.exec(l);
  if (m && (m[1].endsWith('.mts') || m[1].endsWith('.mjs'))) subjects.push(m[1]);
}
const expand = (prefix) => {
  const hit = copierFull.filter((f) => f.startsWith(prefix));
  if (hit.length !== 1) refuse(`copier prefix "${prefix}" matched ${hit.length} full names, not 1`);
  return hit[0];
};

const anchors = [];
for (const l of fl) {
  const m = /^ {2}(\S+)… (\S+) @(\d+|-) \[(hand-typed|derived|UNREAD)\]/.exec(l);
  if (m) anchors.push({ id: m[2], copier: expand(m[1]), line: m[3] === '-' ? null : Number(m[3]), kind: m[4] });
}

const cells = []; // { id, file, n }
let cur = null;
for (const l of fl) {
  const h = /^ {2}anchor (\S+) \((\S+)…:(\d+)\)$/.exec(l);
  if (h) {
    cur = /— DERIVED|— UNREAD/.test(l) ? null : h[1];
    continue;
  }
  if (/^ {2}anchor /.test(l)) { cur = null; continue; } // derived / UNREAD trailer lines
  const c = /^ {4} *(-?\d+) {2}(\S+)/.exec(l);
  if (c && cur) cells.push({ id: cur, file: c[2], n: Number(c[1]) });
  if (/^== /.test(l)) cur = null;
}

const head = fl.find((l) => /^copiers: /.test(l)) ?? '';
const headCells = fl.find((l) => /^cells counted: /.test(l)) ?? '';
const hA = /anchors: (\d+) \((\d+) hand-typed, (\d+) derived, (\d+) UNREAD\) · files: (\d+)/.exec(head);
const hC = /cells counted: (\d+) — (\d+) at >1/.exec(headCells);
if (!hA || !hC) refuse(`could not read v2's own headline lines back out of its stdout`);

// ---- R6 — parse completeness, checked against v2's OWN headline and never against a typed figure -
console.log(`\n== R6. parse completeness — parsed rows vs. the headline v2 printed in the same run ==`);
const handTyped = anchors.filter((a) => a.kind === 'hand-typed');
const derivedA = anchors.filter((a) => a.kind === 'derived');
const nFiles = new Set(cells.map((c) => c.file)).size;
const checks = [
  ['anchors', anchors.length, Number(hA[1])],
  ['hand-typed', handTyped.length, Number(hA[2])],
  ['derived', derivedA.length, Number(hA[3])],
  ['files', nFiles, Number(hA[5])],
  ['cells', cells.length, Number(hC[1])],
  ['collisions', cells.filter((c) => c.n > 1).length, Number(hC[2])],
];
for (const [what, mine, theirs] of checks) {
  console.log(`  ${what.padEnd(11)} parsed ${String(mine).padStart(3)} · headline ${String(theirs).padStart(3)} · ${mine === theirs ? 'OK' : 'MISMATCH'}`);
}
if (checks.some(([, m, t]) => m !== t)) refuse(`the parse does not account for everything v2's headline reports — no matrix is reported from a partial parse`);

// ---- anchor VALUES, read off the declaring file's own source at v2's reported line ---------------
const src = new Map(readdirSync(SCRIPTS).filter((f) => f.endsWith('.mts') || f.endsWith('.mjs')).map((f) => [f, readFileSync(join(SCRIPTS, f), 'utf8')]));

/** Unquote a single- or double-quoted JS string literal. Returns null if it is not one. */
const unquote = (lit) => {
  const t = lit.trim().replace(/;$/, '').trim();
  const q = t[0];
  if ((q !== '"' && q !== "'") || t[t.length - 1] !== q) return null;
  let out = '';
  for (let i = 1; i < t.length - 1; i++) {
    if (t[i] !== '\\') { out += t[i]; continue; }
    const nx = t[++i];
    out += nx === 'n' ? '\n' : nx === 't' ? '\t' : nx === 'r' ? '\r' : nx;
  }
  return out;
};
/** The RHS of the `const <name> = ...;` on `line` of `file`, unquoted. */
const valueAt = (fileText, line) => {
  const l = fileText.split('\n')[line - 1] ?? '';
  const m = /^\s*const\s+[A-Za-z_$][\w$]*\s*(?::[^=]+)?=\s*(.*)$/.exec(l);
  if (!m) return { v: null, why: `line ${line} is not a top-level const declaration: ${l.slice(0, 60)}` };
  if (l.length >= 400) return { v: null, why: `declaration line is ${l.length} chars — suspect` };
  const v = unquote(m[1]);
  return v === null ? { v: null, why: `RHS is not a plain string literal: ${m[1].slice(0, 60)}` } : { v, why: null };
};

console.log(`\n== values recovered from the declaring file's own source (not from v2's 96-char-truncated print) ==`);
for (const a of handTyped) {
  const { v, why } = valueAt(src.get(a.copier), a.line);
  a.value = v;
  a.unreadWhy = why;
  console.log(`  ${a.id.padEnd(18)} ${a.copier.slice(0, 14)}…:${a.line}  ${v === null ? `UNREAD — ${why}` : `${v.length} chars · ${JSON.stringify(v).slice(0, 72)}`}`);
}
if (handTyped.some((a) => a.value === null)) refuse(`${handTyped.filter((a) => a.value === null).length} hand-typed anchor value(s) UNREAD — a partial value set cannot calibrate`);

// ---- R7 — CALIBRATION: this reader must reproduce EVERY cell v2 reported, member by member -------
console.log(`\n== R7. calibration — recompute all ${cells.length} cells with this reader's own occ ==`);
const mineCell = new Map();
for (const a of handTyped) for (const f of subjects) mineCell.set(`${a.id}\u0000${f}`, occ(src.get(f) ?? '', a.value));
const divergences = [];
for (const c of cells) {
  const m = mineCell.get(`${c.id}\u0000${c.file}`);
  if (m !== c.n) divergences.push(`${c.id} × ${c.file}: v2 ${c.n}, mine ${m}`);
}
console.log(`  cells compared: ${cells.length} · divergences: ${divergences.length}`);
for (const d of divergences.slice(0, 10)) console.log(`    ${d}`);
if (divergences.length) refuse(`calibration failed on ${divergences.length} cell(s) — every figure below would be contaminated`);
console.log(`  CALIBRATED — this reader's occ and its recovered values reproduce v2's cells exactly.`);

// ---- LEG 2 (P2, P3) — the screen itself ---------------------------------------------------------
const cellOf = (id, f) => cells.find((c) => c.id === id && c.file === f);
console.log(`\n== LEG 2 (P2/P3). Screen S — FLAGGED iff occ(declaring file, anchor) >= 2 ==`);
const scored = handTyped.map((a) => {
  const self = cellOf(a.id, a.copier);
  return { ...a, declSelf: self ? self.n : null };
});
for (const a of scored) {
  const verdict = a.declSelf === null ? 'UNDEFINED (declaring file not in the counted-against set)' : a.declSelf >= 2 ? 'FLAGGED' : 'clear';
  console.log(`  ${String(a.declSelf ?? '-').padStart(2)}  ${a.id.padEnd(18)} declared in ${a.copier.slice(0, 14)}…  ${verdict}`);
}
const flagged = scored.filter((a) => a.declSelf !== null && a.declSelf >= 2);
console.log(`  FLAGGED ${flagged.length} of ${handTyped.length} hand-typed: ${flagged.map((a) => a.id).sort().join(', ')}`);
for (const c of [...new Set(handTyped.map((a) => a.copier))]) {
  const own = scored.filter((a) => a.copier === c);
  const f = own.filter((a) => a.declSelf >= 2);
  console.log(`  by declaring file — ${c.slice(0, 20)}…: ${f.length} of ${own.length} FLAGGED (${f.map((a) => a.id).join(', ') || 'none'})`);
}
console.log(`  derived anchors: the screen is UNDEFINED on all ${derivedA.length} (${derivedA.map((a) => a.id).join(', ')}) — their value is computed from the subject at run time, so there is no literal in the declaring file to count.`);

// ---- LEG 3 (P4) — is the screen narrower than the census it came from? ---------------------------
console.log(`\n== LEG 3 (P4). the 12 COLLISION cells, split by whether the file DECLARES the anchor ==`);
const declOf = new Map(handTyped.map((a) => [a.id, a.copier]));
const coll = cells.filter((c) => c.n > 1);
const visible = coll.filter((c) => declOf.get(c.id) === c.file);
const invisible = coll.filter((c) => declOf.get(c.id) !== c.file);
console.log(`  COLLISION cells: ${coll.length} · on the anchor's own declaring file (S can see): ${visible.length} · elsewhere (S cannot see at any threshold): ${invisible.length}`);
console.log(`  -- visible to S --`);
for (const c of visible) console.log(`     ${c.id} × ${c.file.slice(0, 44)}… = ${c.n}`);
console.log(`  -- INVISIBLE to S --`);
for (const c of invisible) console.log(`     ${c.id} × ${c.file.slice(0, 44)}… = ${c.n}   (declared in ${declOf.get(c.id).slice(0, 20)}…)`);

// ---- LEG 4 (P5) — classify all occurrences behind the COLLISION cells ---------------------------
const anchorDeclLines = new Map(); // file -> Set(line numbers that declare a CENSUS anchor)
for (const a of anchors) {
  if (!anchorDeclLines.has(a.copier)) anchorDeclLines.set(a.copier, new Map());
  if (a.line) anchorDeclLines.get(a.copier).set(a.line, a.id);
}
const classify = (file, v) => {
  const text = src.get(file);
  const out = [];
  let idx = text.indexOf(v);
  while (idx !== -1) {
    const lineNo = text.slice(0, idx).split('\n').length;
    const lineText = text.split('\n')[lineNo - 1] ?? '';
    const isAnchorDecl = anchorDeclLines.get(file)?.has(lineNo);
    const kind = lineText.trim() === v.trim()
      ? 'exact-line'
      : isAnchorDecl
        ? `census-anchor-decl (${anchorDeclLines.get(file).get(lineNo)})`
        : /^\s*const\s+[A-Za-z_$][\w$]*\s*(?::[^=]+)?=\s*["'`]/.test(lineText)
          ? 'other-const-literal'
          : 'other-line-containing';
    out.push({ lineNo, kind, lineText: lineText.trim().slice(0, 86) });
    idx = text.indexOf(v, idx + 1);
  }
  return out;
};
console.log(`\n== LEG 4 (P5). every occurrence behind each COLLISION cell, classified ==`);
const noAnchorDecl = [];
for (const c of coll) {
  const a = handTyped.find((x) => x.id === c.id);
  const occs = classify(c.file, a.value);
  const anyAnchorDecl = occs.some((o) => o.kind.startsWith('census-anchor-decl'));
  if (!anyAnchorDecl) noAnchorDecl.push(c);
  console.log(`  ${c.id} × ${c.file.slice(0, 40)}… = ${c.n}  ${declOf.get(c.id) === c.file ? '[own declaring file]' : '[elsewhere]'}${anyAnchorDecl ? '' : '  <-- NO census-anchor declaration among its occurrences'}`);
  for (const o of occs) console.log(`      :${String(o.lineNo).padStart(4)}  ${o.kind.padEnd(28)} ${o.lineText}`);
}
console.log(`  cells whose occurrences include NO census-anchor declaration: ${noAnchorDecl.length} — ${noAnchorDecl.map((c) => `${c.id}×${c.file.slice(11, 19)}`).join(', ') || '(none)'}`);

// ---- LEG 5 (P6, P7) — the screen carried back to the one crash we have --------------------------
console.log(`\n== LEG 5 (P6/P7). the screen at e501d6af, the rev whose collision crashed the gate ==`);
const REVS = ['6b569a40', 'e501d6af', '3489290f', 'HEAD'];
const show = (rev, path) => {
  const r = spawnSync('git', ['-C', REPO, 'show', `${rev}:scripts/${path}`], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  return r.status === 0 ? r.stdout : null;
};
const F375 = copierFull.find((f) => f.startsWith('probe-round375'));
const F377 = copierFull.find((f) => f.startsWith('probe-round377'));
if (!F375 || !F377) refuse(`could not identify the 375/377 copiers from v2's own copier list`);

/** Extract a named const's unquoted literal from an arbitrary source text, by id. */
const valueOfId = (text, id) => {
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const m = new RegExp(`^const ${id}\\s*(?::[^=]+)?=\\s*(.*)$`).exec(lines[i]);
    if (m) return { v: unquote(m[1]), line: i + 1 };
  }
  return { v: null, line: null };
};

console.log(`  subject of the crash: the cell (A_SWEEP_READ × probe-round375). A_SWEEP_READ is declared in probe-round377.`);
for (const rev of REVS) {
  const s375 = show(rev, F375);
  const s377 = show(rev, F377);
  if (!s375 || !s377) { console.log(`  ${rev.padEnd(9)} UNREAD — one of the two files does not exist at this rev`); continue; }
  const asr = valueOfId(s377, 'A_SWEEP_READ');
  const csw = valueOfId(s375, 'C_SWEEP');
  const cswKind = csw.v === null ? 'derived/not-a-literal' : 'hand-typed literal';
  console.log(`  ${rev.padEnd(9)} A_SWEEP_READ declared ${F377.slice(0, 14)}…:${asr.line ?? '-'} ${asr.v === null ? '(UNREAD — not a plain literal)' : `= ${JSON.stringify(asr.v)}`}`);
  if (asr.v !== null) {
    console.log(`            occ(375, A_SWEEP_READ) = ${occ(s375, asr.v)}   <-- the cell that threw` + (occ(s375, asr.v) !== 1 ? '   ** COLLISION **' : ''));
    console.log(`            occ(377, A_SWEEP_READ) = ${occ(s377, asr.v)}   <-- what Screen S reads (its DECLARING file)`);
  }
  console.log(`            C_SWEEP in 375 @${csw.line ?? '-'}: ${cswKind}${csw.v === null ? '' : ` = ${JSON.stringify(csw.v)}`}` + (csw.v === null ? '' : `, occ(375, C_SWEEP) = ${occ(s375, csw.v)}`));
}

console.log(`\n== HEADLINE ==`);
console.log(`P1 differing lines: ${diffLines.length} (${diffLines.join(', ') || 'none'}) · v2 exit ${run.status}`);
console.log(`calibration: ${cells.length} of ${cells.length} cells reproduced, 0 divergences`);
console.log(`Screen S at HEAD: ${flagged.length} of ${handTyped.length} hand-typed FLAGGED — ${flagged.map((a) => a.id).sort().join(', ')}`);
console.log(`COLLISION cells: ${coll.length} — ${visible.length} visible to S, ${invisible.length} INVISIBLE to S`);
console.log(`COLLISION cells with no census-anchor declaration among their occurrences: ${noAnchorDecl.length}`);
