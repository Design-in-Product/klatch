#!/usr/bin/env node
/**
 * unit-465plant — the pre-commit screen Theseus's §3 concludes is the one worth building, together
 * with the red state his §5 names as the sole blocker on it.
 *
 * The screen, stated in PRE-REGISTRATION.md before this file existed:
 *
 *   Given base rev B, candidate rev C, file F: extract from each rev's F the one-line declarations
 *   whose RHS is a STRING LITERAL, keyed on (name, value). ADDED = present at C and not at B (a name
 *   whose value changed counts as added — the literal is newly typed). For each added d with value v:
 *   occ(F@C, v). FLAG iff occ >= 2, because d's own declaration line contributes 1, so 2 means the
 *   file it was typed into already carried that line.
 *
 * R2 holds: no anchor value, line number or occurrence count is typed here. Every value is read out
 * of the rev's own blob via `git show`. The PLANTED values are copied out of the file's own source at
 * run time — a hand-typed plant would be an analogy of the property, not the property.
 *
 * R8 holds: both plants are additive. One line appended, nothing else touched.
 * R9 holds: each arm records into RECORD before the next is evaluated. No predicate is computed
 * inside another arm's argument list.
 *
 * Not edited by this unit: census v1, census v2, screen-declaring-file.mjs (R3). This is a fourth,
 * separate reader.
 */
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..', '..');

const refuse = (why) => {
  console.log(`REFUSED — ${why}`);
  process.exit(2);
};
if (!existsSync(join(REPO, 'scripts', 'sweep-probes.mjs'))) {
  refuse(`repo root not found at ${REPO} (resolved from ${HERE})`);
}

/** v2's own definition, census-anchors-v2.mjs:39 — a substring count over the whole file text. */
const occ = (hay, needle) => (needle === '' ? -1 : hay.split(needle).length - 1);

/**
 * `git show` is cwd-sensitive exactly as `git ls-tree` is, so -C is pinned rather than inherited.
 * Returns null when the path does not exist at that rev, rather than throwing into an arm.
 */
const blob = (rev, path) => {
  try {
    return execFileSync('git', ['-C', REPO, 'show', `${rev}:${path}`], {
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
    });
  } catch {
    return null;
  }
};

const R375 = 'scripts/probe-round375-the-guard-on-the-routed-cure-reddens-on-the-cure-and-passes-on-a-comment.mts';
const R377 = 'scripts/probe-round377-the-cure-landed-on-the-two-reported-sites-and-the-mechanism-was-live-in-both-files.mts';

// ── the literal parser ───────────────────────────────────────────────────────────────────────────
// An unknown escape, or any interpolation, marks the declaration UNREAD rather than guessing at a
// runtime value. A guessed value would silently change every occ() derived from it.
const SIMPLE = { n: '\n', t: '\t', r: '\r', b: '\b', f: '\f', v: '\v', 0: '\0' };

/**
 * Parse `src` from index 0 as a single JS string literal. Returns {value} if the literal ends at the
 * very last character of `src` (i.e. the RHS is a *pure* literal, not a concatenation or a call), or
 * {unread: reason}.
 */
function parseLiteral(rhs) {
  const q = rhs[0];
  if (q !== "'" && q !== '"' && q !== '`') return { unread: 'rhs is not a string literal' };
  let out = '';
  let i = 1;
  while (i < rhs.length) {
    const c = rhs[i];
    if (c === '\\') {
      const e = rhs[i + 1];
      if (e === undefined) return { unread: 'trailing backslash' };
      if (e in SIMPLE) { out += SIMPLE[e]; i += 2; continue; }
      if (e === '\\' || e === "'" || e === '"' || e === '`') { out += e; i += 2; continue; }
      if (e === 'x') {
        const h = rhs.slice(i + 2, i + 4);
        if (!/^[0-9a-fA-F]{2}$/.test(h)) return { unread: 'malformed \\x escape' };
        out += String.fromCharCode(parseInt(h, 16)); i += 4; continue;
      }
      if (e === 'u') {
        const h = rhs.slice(i + 2, i + 6);
        if (!/^[0-9a-fA-F]{4}$/.test(h)) return { unread: 'malformed \\u escape' };
        out += String.fromCharCode(parseInt(h, 16)); i += 6; continue;
      }
      return { unread: `unknown escape \\${e}` };
    }
    if (q === '`' && c === '$' && rhs[i + 1] === '{') return { unread: 'template interpolation' };
    if (c === q) {
      // closed. A pure literal RHS closes on the final character.
      if (i === rhs.length - 1) return { value: out };
      return { unread: 'rhs continues past the literal (concatenation or call)' };
    }
    out += c;
    i++;
  }
  return { unread: 'unterminated literal' };
}

/** Map name -> {value, line} for every one-line `const NAME = <pure string literal>;`. */
function literalDecls(src) {
  const decls = new Map();
  const unread = [];
  const lines = src.split('\n');
  for (let n = 0; n < lines.length; n++) {
    const m = /^const ([A-Za-z_$][\w$]*) = (.*);[ \t]*$/.exec(lines[n]);
    if (!m) continue;
    const p = parseLiteral(m[2]);
    if (p.unread) { unread.push({ name: m[1], line: n + 1, why: p.unread }); continue; }
    decls.set(m[1], { value: p.value, line: n + 1 });
  }
  return { decls, unread };
}

// ── the screen itself ────────────────────────────────────────────────────────────────────────────
/**
 * @returns {{refused?: string, added: Array, flags: Array, baseCount: number, candCount: number}}
 */
function screen(label, baseSrc, candSrc, path) {
  if (baseSrc === null || candSrc === null) {
    return { refused: `${path} absent at one side of the delta`, added: [], flags: [] };
  }
  const b = literalDecls(baseSrc);
  const c = literalDecls(candSrc);
  // R6 — a leg that cannot see its own population must not score as clean.
  if (b.decls.size === 0 || c.decls.size === 0) {
    return {
      refused: `0 literal declarations at ${b.decls.size === 0 ? 'base' : 'candidate'} of ${path}`,
      added: [], flags: [], baseCount: b.decls.size, candCount: c.decls.size,
    };
  }
  const added = [];
  for (const [name, cd] of c.decls) {
    const bd = b.decls.get(name);
    if (bd === undefined) added.push({ name, ...cd, was: '(no literal declaration at base)' });
    else if (bd.value !== cd.value) added.push({ name, ...cd, was: `value changed from base :${bd.line}` });
  }
  const flags = [];
  for (const a of added) {
    const n = occ(candSrc, a.value);
    a.occ = n;
    if (n >= 2) flags.push(a);
  }
  return { added, flags, baseCount: b.decls.size, candCount: c.decls.size, unreadCand: c.unread };
}

const RECORD = [];
const rec = (id, claim, value) => { RECORD.push({ id, claim, value }); return value; };

const show = (label, r, path) => {
  console.log(`\n== ${label} ==  ${path}`);
  if (r.refused) { console.log(`  REFUSED — ${r.refused}`); return; }
  console.log(`  literal declarations: base ${r.baseCount} · candidate ${r.candCount}`);
  console.log(`  ADDED: ${r.added.length}   FLAGGED (occ >= 2): ${r.flags.length}`);
  for (const a of r.added) {
    const mark = a.occ >= 2 ? 'FLAG' : '    ';
    console.log(`    ${mark} ${a.name} @${a.line}  occ=${a.occ}  [${a.was}]`);
    console.log(`         value: ${JSON.stringify(a.value).slice(0, 120)}`);
  }
};

const B = '6b569a40', C = 'e501d6af', D = '3489290f';
console.log('unit-465plant — the pre-commit screen, graded on a natural red state and a planted one');
console.log(`repo: ${REPO}`);
for (const r of [B, C, D]) {
  const line = execFileSync('git', ['-C', REPO, 'log', '-1', '--format=%h %an %ad %s', '--date=iso', r], { encoding: 'utf8' }).trim();
  console.log(`  rev ${r}: ${line.slice(0, 150)}`);
}

// ---- LEG 1 / P1+P2+P3 — KP-REAL: the actual crash delta ----------------------------------------
const kp = screen('LEG 1 (P1,P2,P3) KP-REAL', blob(B, R375), blob(C, R375), R375);
show('LEG 1 (P1,P2,P3) KP-REAL — the real crash delta', kp, R375);
const kpSweep = kp.added.find((a) => a.name === 'C_SWEEP');
rec('P1', 'KP-REAL adds >=1 literal decl in probe-round375 and C_SWEEP is among them',
  kp.added.length >= 1 && kpSweep !== undefined);
rec('P2', 'the screen FLAGS it: occ(375@e501d6af, value(C_SWEEP)) >= 2',
  kpSweep !== undefined && kpSweep.occ >= 2);
rec('P3', 'exactly one flag, and it is (C_SWEEP, probe-round375)',
  kp.flags.length === 1 && kp.flags[0]?.name === 'C_SWEEP');

// ---- LEG 2 / P4 — CTRL-REAL: the cure ----------------------------------------------------------
const ctrl = screen('LEG 2 (P4) CTRL-REAL', blob(C, R375), blob(D, R375), R375);
show('LEG 2 (P4) CTRL-REAL — the cure I actually landed', ctrl, R375);
rec('P4', 'CTRL-REAL yields zero flags — the red clears on the cure',
  !ctrl.refused && ctrl.flags.length === 0);

// ---- LEG 3 / P5 — CTRL-NOOP: base == candidate -------------------------------------------------
const noop375 = screen('LEG 3 (P5) CTRL-NOOP 375', blob('HEAD', R375), blob('HEAD', R375), R375);
const noop377 = screen('LEG 3 (P5) CTRL-NOOP 377', blob('HEAD', R377), blob('HEAD', R377), R377);
show('LEG 3 (P5) CTRL-NOOP — HEAD against itself, 375', noop375, R375);
show('LEG 3 (P5) CTRL-NOOP — HEAD against itself, 377', noop377, R377);
rec('P5', 'CTRL-NOOP: 0 ADDED and 0 flags on both copiers',
  !noop375.refused && !noop377.refused &&
  noop375.added.length === 0 && noop375.flags.length === 0 &&
  noop377.added.length === 0 && noop377.flags.length === 0);

// ---- LEG 4 / P6 — the planted pair -------------------------------------------------------------
console.log('\n== LEG 4 (P6) — the planted red state, and its matched negative ==');
const headSrc = blob('HEAD', R375);
let plantVerdict = null;
if (headSrc === null) {
  console.log('  REFUSED — probe-round375 absent at HEAD');
} else {
  // Deterministic pick, copied out of the file's own source: the FIRST line that is a top-level
  // SCREAMING_CASE const, occurs exactly once, and contains no `"` and no `\` (so it can be
  // double-quoted verbatim — an escaped literal would not be byte-identical to its own value, and
  // the plant would then fail to flag for a reason that is about escaping, not about the property).
  let pick = null;
  const hl = headSrc.split('\n');
  for (let i = 0; i < hl.length; i++) {
    const l = hl[i];
    if (!/^const [A-Z][A-Z0-9_]* = /.test(l)) continue;
    if (l.includes('"') || l.includes('\\')) continue;
    if (occ(headSrc, l) !== 1) continue;
    pick = { line: i + 1, text: l };
    break;
  }
  if (pick === null) {
    console.log('  REFUSED — no single-occurrence, escape-free top-level const line to copy');
  } else {
    console.log(`  plant source line, COPIED from ${R375}:${pick.line} (occ in the clean file: ${occ(headSrc, pick.text)})`);
    console.log(`    ${pick.text.slice(0, 120)}`);
    // KP-PLANT — additive: one appended line whose literal value is that real line.
    const kpCand = `${headSrc}const PLANT_DUP = "${pick.text}";\n`;
    const kpPlant = screen('KP-PLANT', headSrc, kpCand, `${R375} + planted duplicate`);
    show('LEG 4 (P6) KP-PLANT — a declaration whose value the file already carries', kpPlant, `${R375} +plant`);
    // CTRL-PLANT — same shape, property absent: a run-time nonce that cannot occur in the file.
    const nonce = `unit-465plant nonce ${createHash('sha256').update(headSrc).digest('hex').slice(0, 16)}`;
    const nonceOcc = occ(headSrc, nonce);
    console.log(`\n  nonce built at run time; occ in the clean file (must be 0): ${nonceOcc}`);
    const ctrlCand = `${headSrc}const PLANT_DUP = "${nonce}";\n`;
    const ctrlPlant = screen('CTRL-PLANT', headSrc, ctrlCand, `${R375} + planted nonce`);
    show('LEG 4 (P6) CTRL-PLANT — same plant shape, one property apart', ctrlPlant, `${R375} +nonce`);
    plantVerdict =
      nonceOcc === 0 &&
      !kpPlant.refused && !ctrlPlant.refused &&
      kpPlant.added.length === 1 && kpPlant.flags.length === 1 && kpPlant.flags[0].name === 'PLANT_DUP' &&
      ctrlPlant.added.length === 1 && ctrlPlant.flags.length === 0;
  }
}
rec('P6', 'KP-PLANT flags and CTRL-PLANT does not, same plant shape', plantVerdict === true);

// ---- LEG 5 / P7 — the delta key is load-bearing ------------------------------------------------
console.log('\n== LEG 5 (P7) — is a single-tree absolute reading constant across the crash delta? ==');
let p7 = null;
const r377b = blob(B, R377), r377c = blob(C, R377);
if (r377b === null || r377c === null) {
  console.log('  REFUSED — probe-round377 absent at one of the two revs');
} else {
  const db = literalDecls(r377b).decls.get('A_SWEEP_READ');
  const dc = literalDecls(r377c).decls.get('A_SWEEP_READ');
  if (!db || !dc) {
    console.log(`  REFUSED — A_SWEEP_READ is not a pure literal declaration at ${!db ? B : C} (UNREAD, not 0)`);
  } else {
    const at375b = occ(blob(B, R375), db.value);
    const at375c = occ(blob(C, R375), dc.value);
    const at377b = occ(r377b, db.value);
    const at377c = occ(r377c, dc.value);
    console.log(`  A_SWEEP_READ declared ${B} :${db.line} · ${C} :${dc.line}`);
    console.log(`  value identical across the two revs: ${db.value === dc.value}`);
    console.log(`  occ(probe-round377, value)  —  ${B}: ${at377b}   ${C}: ${at377c}   <- what S reads`);
    console.log(`  occ(probe-round375, value)  —  ${B}: ${at375b}   ${C}: ${at375c}   <- the cell that threw`);
    p7 = at377b === at377c;
    console.log(`  S's reading is ${p7 ? 'CONSTANT' : 'NOT constant'} across the crash delta.`);
  }
}
rec('P7', "occ(377, value(A_SWEEP_READ)) is equal at 6b569a40 and e501d6af", p7 === true);

// ---- LEG 6 / P8 — precision across every scripts/ file the KP commit touched -------------------
console.log('\n== LEG 6 (P8) — the screen over EVERY scripts/ file touched by the KP-REAL commit ==');
const touched = execFileSync('git', ['-C', REPO, 'diff', '--name-only', B, C, '--', 'scripts/'], { encoding: 'utf8' })
  .split('\n').map((s) => s.trim()).filter(Boolean);
console.log(`  files touched under scripts/ in ${B}..${C}: ${touched.length}`);
let totalFlags = 0, refusedLegs = 0;
const perFile = [];
for (const p of touched) {
  const r = screen(`P8 ${p}`, blob(B, p), blob(C, p), p);
  if (r.refused) { refusedLegs++; console.log(`    REFUSED ${p} — ${r.refused}`); perFile.push({ p, refused: r.refused }); continue; }
  totalFlags += r.flags.length;
  perFile.push({ p, added: r.added.length, flags: r.flags.map((f) => f.name) });
  console.log(`    ${p}`);
  console.log(`      literal decls ${r.candCount} · ADDED ${r.added.length} · FLAGGED ${r.flags.length}${r.flags.length ? ` → ${r.flags.map((f) => `${f.name}(occ=${f.occ})`).join(', ')}` : ''}`);
}
rec('P8', 'exactly one flag across every scripts/ file the KP commit touched, and no refused leg',
  totalFlags === 1 && refusedLegs === 0);

// ---- verdict -----------------------------------------------------------------------------------
console.log('\n================ GRADES ================');
let nTrue = 0;
for (const r of RECORD) {
  console.log(`  ${r.value ? 'TRUE    ' : 'NOT TRUE'} ${r.id} — ${r.claim}`);
  if (r.value) nTrue++;
}
const notTrue = RECORD.filter((r) => !r.value).map((r) => r.id);
console.log(`\nSCREEN GRADED — ${nTrue} of ${RECORD.length} predictions true${notTrue.length ? `, not true: ${notTrue.join(', ')}` : ''}`);
console.log(`RED STATE — natural KP: ${kp.flags.length} flag(s) · planted KP: ${plantVerdict === true ? 'fires, matched negative silent' : 'NOT established'}`);
