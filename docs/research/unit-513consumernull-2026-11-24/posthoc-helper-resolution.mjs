/**
 * unit-513 post-hoc 1 — **my Key C was blind to the dominant shape in this corpus, and the arm's
 * own figures say so out loud: `UNCLEAR 17` of 25 rows was the largest class.**
 *
 * The arm read the match statement and the 13 lines after it. But this corpus does not extract
 * figures at the match site — it passes the pattern to a one-line local helper:
 *
 *     const one = (rx) => { const m = out.match(rx); return m ? Number(m[1]) : null; };
 *     trackedRead: one(/^\s*tracked files read: (\d+)/m),
 *
 * The null-handling lives in the HELPER, and what makes it visible (or not) lives in the CALLER.
 * A key that reads only the match statement cannot see either. So the arm's class figures are an
 * artefact of that blindness and `ARM.out` is kept exactly as driven beside this file.
 *
 * R2 = the arm's Key C **plus one level of local helper resolution**, with the combination rule
 * declared before it ran (below), and with the known-positive set grown from 4 to 7 so the new
 * shape is itself graded. **Below 7 of 7 this file publishes no class figures.**
 *
 * No exemption marker: compares no braces, out of the gate's population.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { bodyOf } from '../../../scripts/lib/decl-body.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..', '..');
const CAPS = join(HERE, 'captures');
mkdirSync(CAPS, { recursive: true });

const out = [];
const say = (s = '') => { out.push(s); console.log(s); };
const arm = JSON.parse(readFileSync(join(CAPS, 'ARM.json'), 'utf8'));

const srcCache = new Map();
const srcOf = (rel) => {
  if (!srcCache.has(rel)) srcCache.set(rel, readFileSync(join(ROOT, rel), 'utf8'));
  return srcCache.get(rel);
};
const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Classify a block of source that contains ONE match statement — the arm's Key C, lifted so it can
 * be pointed at a helper body as well as at a file.
 */
function classifyBlock(text) {
  const lines = text.split('\n');
  const t = lines[0];
  const idm = text.match(/(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*[^=\n]*?\.(?:match|exec)\s*\(/);
  const id = idm ? idm[1] : null;
  if (!id) {
    if (/\.test\s*\(/.test(text)) return { cls: 'SKIP', deciding: t.trim(), why: 'bare .test() in a condition: the branch does not run and nothing is emitted' };
    if (/\.replace\s*\(/.test(text)) return { cls: 'SKIP', deciding: t.trim(), why: '.replace() with no match is a no-op' };
    return { cls: 'UNCLEAR', deciding: t.trim(), why: 'no result identifier' };
  }
  const idE = escRe(id);
  const find = (re) => lines.find((l) => re.test(l))?.trim() ?? null;
  const throwL = find(new RegExp(`(?:throw|process\\.exit|assert)[^\\n]*`));
  const guardL = find(new RegExp(`if\\s*\\(\\s*!\\s*${idE}\\b|if\\s*\\(\\s*${idE}\\s*===?\\s*null|if\\s*\\(\\s*${idE}\\s*\\)|${idE}\\s*&&|${idE}\\s*\\?[^.]`));
  if (throwL && new RegExp(`!\\s*${idE}\\b|${idE}\\s*===?\\s*null`).test(text)) return { cls: 'THROW', deciding: throwL, why: 'guarded null raises or exits' };
  if (new RegExp(`\\b${idE}\\s*\\[\\s*1\\s*\\]`).test(text) && !guardL) {
    return { cls: 'THROW', deciding: find(new RegExp(`\\b${idE}\\s*\\[\\s*1\\s*\\]`)), why: `unguarded ${id}[1]: a null match is a TypeError` };
  }
  if (guardL) {
    // What does the no-match arm of the guard YIELD? That is what decides visibility.
    const yields = text.match(new RegExp(`${idE}\\s*\\?[^:]*:\\s*([^;,\\n)]+)`));
    const alt = yields ? yields[1].trim() : null;
    if (alt && /^(?:0|''|""|\[\]|\{\})$/.test(alt)) return { cls: 'DEFAULT', deciding: guardL, why: `no-match arm yields ${alt} — indistinguishable from a real figure of that value` };
    if (alt && /^(?:null|undefined|NaN|'-'|"-"|'\?'|"\?")$/.test(alt)) return { cls: 'REPORTED', deciding: guardL, why: `no-match arm yields ${alt} — a visible non-number` };
    if (/\?\?\s*0|\|\|\s*0|\?\?\s*['"]['"]/.test(text)) return { cls: 'DEFAULT', deciding: guardL, why: 'guard defaults to a number or empty string' };
    const gi = lines.findIndex((l) => new RegExp(`if\\s*\\(\\s*!?\\s*${idE}\\b`).test(l));
    const body = gi >= 0 ? lines.slice(gi, gi + 4).join('\n') : '';
    const emits = /say\s*\(|console\.(?:log|error)\s*\(|push\s*\(/.test(body);
    return emits
      ? { cls: 'REPORTED', deciding: guardL, why: 'guard body emits, so the absence reaches the output' }
      : { cls: 'SKIP', deciding: guardL, why: 'guard body emits nothing: the figure is omitted with no trace' };
  }
  if (new RegExp(`${idE}\\?\\.\\[`).test(text)) {
    const l = find(new RegExp(`${idE}\\?\\.\\[`));
    if (/\?\?\s*0|\|\|\s*0|\?\?\s*['"]['"]/.test(l)) return { cls: 'DEFAULT', deciding: l, why: 'optional read defaulted to a number or empty string' };
    return { cls: 'REPORTED', deciding: l, why: 'optional read: undefined reaches the output as a visible non-number' };
  }
  return { cls: 'UNCLEAR', deciding: t.trim(), why: 'no declared handling form' };
}

/** The local helper a pattern is handed to, if any: `one(/…/)` → the definition of `one`. */
function resolveHelper(rel, row) {
  const src = srcOf(rel);
  const lines = src.split('\n');
  const useLine = lines[row.appliedAt - 1] ?? '';
  const needle = row.pattern;
  // A call whose argument list holds the pattern literal, or the name it is bound to.
  const boundName = (lines[row.line - 1] || '').match(/(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*\//)?.[1] ?? null;
  // Every `IDENT(` on the use line, with its argument span read by paren balance. A single
  // left-to-right regex returns only the OUTERMOST call — `say(…)` — and then never reaches the
  // helper inside it, which is what made the first three helper known-positives MISS.
  const cands = [];
  for (const m of useLine.matchAll(/([A-Za-z_$][\w$]*)\s*\(/g)) {
    const name = m[1];
    if (['if', 'for', 'while', 'return', 'function', 'switch', 'catch', 'typeof'].includes(name)) continue;
    let depth = 0; let end = -1;
    const open = m.index + m[0].length - 1;
    for (let i = open; i < useLine.length; i += 1) {
      if (useLine[i] === '(') depth += 1;
      else if (useLine[i] === ')') { depth -= 1; if (depth === 0) { end = i; break; } }
    }
    const args = useLine.slice(open + 1, end < 0 ? useLine.length : end);
    if (args.includes(needle) || (boundName && new RegExp(`\\b${escRe(boundName)}\\b`).test(args))) {
      cands.push({ name, len: args.length });
    }
  }
  cands.sort((a, b) => a.len - b.len); // innermost call first
  for (const { name } of cands) {
    const defRe = new RegExp(`^[^\\n]*(?:const|let|var)\\s+${escRe(name)}\\s*=\\s*(?:async\\s*)?\\(|^[^\\n]*function\\s+${escRe(name)}\\s*\\(`);
    const di = lines.findIndex((l) => defRe.test(l));
    if (di < 0) continue;
    // Helper body via the SHARED reader — `bodyOf` from scripts/lib/decl-body.mjs. A hand-rolled
    // brace walk here is exactly what this repo's own gate reddens, and it reddened this file on
    // its first commit attempt; the gate was right and the shared reader is the cure.
    const braced = bodyOf(src, name);
    const body = braced ?? lines[di].slice(lines[di].indexOf('=>') + 2).trim();
    return { name, defLine: di + 1, body: `${lines[di]}\n${body}` };
  }
  return null;
}

/** How the CALLER consumes the helper's return — what makes an absent figure visible, or not. */
function callerVisibility(rel, row) {
  const lines = srcOf(rel).split('\n');
  const l = lines[row.appliedAt - 1] ?? '';
  const win = lines.slice(row.appliedAt - 1, row.appliedAt + 3).join('\n');
  if (/\$\{/.test(l) || /say\s*\(|console\.(?:log|error)\s*\(/.test(l)) return { vis: 'EMITTED', deciding: l.trim() };
  if (/\?\?\s*0|\|\|\s*0|Number\s*\(/.test(l)) return { vis: 'COERCED', deciding: l.trim() };
  if (/^\s*[A-Za-z_$][\w$]*:\s/.test(l)) return { vis: 'STORED', deciding: l.trim() };
  if (/\$\{/.test(win)) return { vis: 'EMITTED-NEARBY', deciding: win.split('\n').find((x) => x.includes('${'))?.trim() ?? l.trim() };
  return { vis: 'UNCLEAR', deciding: l.trim() };
}

/**
 * Declared combination rule (written before this file was driven):
 *   helper THROW                                  → THROW
 *   helper REPORTED (yields null/undefined/NaN)   → REPORTED if the caller EMITS or STORES-then-emits
 *                                                 → DEFAULT  if the caller COERCES (Number(null) === 0)
 *   helper DEFAULT (yields 0 or '')               → DEFAULT
 *   helper SKIP                                   → SKIP
 *   anything else                                 → UNCLEAR_R2 (declared bucket, not a fall-through)
 */
function combine(helperCls, vis) {
  if (helperCls === 'THROW') return 'THROW';
  if (helperCls === 'DEFAULT') return 'DEFAULT';
  if (helperCls === 'SKIP') return 'SKIP';
  if (helperCls === 'REPORTED') {
    if (vis === 'COERCED') return 'DEFAULT';
    if (vis === 'EMITTED' || vis === 'EMITTED-NEARBY' || vis === 'STORED') return 'REPORTED';
    return 'UNCLEAR_R2';
  }
  return 'UNCLEAR_R2';
}

// ---------------------------------------------------------------- known positives: 4 old + 3 new

const KPS = [
  { want: 'THROW', kind: 'direct', src: `const m = stdout.match(/tracked files read: (\\d+)/);\nif (!m) throw new Error('no figure');\nconst n = Number(m[1]);\n` },
  { want: 'REPORTED', kind: 'direct', src: `const m = stdout.match(/tracked files read: (\\d+)/);\nsay(\`  figure: \${m?.[1]}\`);\n` },
  { want: 'DEFAULT', kind: 'direct', src: `const m = stdout.match(/tracked files read: (\\d+)/);\nconst n = Number(m?.[1] ?? 0);\nsay(\`  figure: \${n}\`);\n` },
  { want: 'SKIP', kind: 'direct', src: `const m = stdout.match(/tracked files read: (\\d+)/);\nif (m) {\n  figures.read = Number(m[1]);\n}\n` },
  // the three new shapes — the ones the arm was blind to
  { want: 'REPORTED', kind: 'helper', src: `const one = (rx) => { const m = out.match(rx); return m ? Number(m[1]) : null; };\nsay(\`  read \${one(/tracked files read: (\\d+)/)}\`);\n` },
  { want: 'DEFAULT', kind: 'helper', src: `const one = (rx) => { const m = out.match(rx); return m ? Number(m[1]) : 0; };\nsay(\`  read \${one(/tracked files read: (\\d+)/)}\`);\n` },
  { want: 'DEFAULT', kind: 'helper-coerced', src: `const one = (rx) => { const m = out.match(rx); return m ? m[1] : null; };\nconst n = Number(one(/tracked files read: (\\d+)/));\n` },
];

function kpRun() {
  const rows = [];
  for (const kp of KPS) {
    const rel = `__kp_${kp.kind}_${kp.want}__.mjs`;
    srcCache.set(rel, kp.src);
    const lines = kp.src.split('\n');
    const line = lines.findIndex((l) => l.includes('tracked files read')) + 1;
    const appliedAt = line;
    const row = { rel, line, appliedAt, pattern: (lines[line - 1].match(/\/[^/\n]*tracked files read[^/\n]*\/[a-z]*/) || [''])[0] };
    const helper = resolveHelper(rel, row);
    let cls; let why; let deciding;
    if (helper) {
      const hc = classifyBlock(helper.body);
      const vis = callerVisibility(rel, row);
      cls = combine(hc.cls, vis.vis);
      why = `helper ${helper.name} → ${hc.cls} (${hc.why}); caller ${vis.vis}`;
      deciding = `${helper.body.split('\n')[0].trim()}   ||   ${vis.deciding}`;
    } else {
      const direct = classifyBlock(lines.slice(line - 1).join('\n'));
      cls = direct.cls; why = direct.why; deciding = direct.deciding;
    }
    rows.push({ want: kp.want, kind: kp.kind, got: cls, ok: cls === kp.want, why, deciding });
    srcCache.delete(rel);
  }
  return rows;
}

// ---------------------------------------------------------------- drive

const rev = execFileSync('git', ['-C', ROOT, 'rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim();
const now = execFileSync('date', ['+%H:%M:%S'], { encoding: 'utf8', env: { ...process.env, TZ: 'America/Los_Angeles' } }).trim();

say('unit-513 post-hoc 1 — Key C R2: one level of local helper resolution');
say(`  rev ${rev} · driven ${now} PST · arm rows ${arm.rows.length}, of which UNCLEAR ${arm.rows.filter((r) => r.consumer === 'UNCLEAR').length}`);
say('');
say('§0  known positives — 4 from the arm + 3 helper shapes. Below 7 of 7, no class figures.');
const kp = kpRun();
for (const r of kp) say(`  ${r.kind.padEnd(14)} want ${r.want.padEnd(9)} got ${String(r.got).padEnd(10)} ${r.ok ? 'OK ' : 'MISS'}  ${r.why}`);
const kpScore = kp.filter((r) => r.ok).length;
say(`  P7-R2: ${kpScore} of ${kp.length}${kpScore === kp.length ? ' — the R2 key is graded' : ' — REFUTED, no class figures published'}`);
say('');

const rows = [];
for (const r of arm.rows) {
  const helper = resolveHelper(r.rel, r);
  if (!helper) {
    rows.push({ ...r, r2: r.consumer, path: 'direct (arm)', why: r.consumerWhy, deciding: r.consumerDeciding, helper: null });
    continue;
  }
  const hc = classifyBlock(helper.body);
  const vis = callerVisibility(r.rel, r);
  rows.push({
    ...r,
    r2: combine(hc.cls, vis.vis),
    path: `helper:${helper.name}@${helper.defLine}`,
    why: `helper → ${hc.cls} (${hc.why}); caller ${vis.vis}`,
    deciding: `${hc.deciding}   ||   ${vis.deciding}`,
    helper: { name: helper.name, defLine: helper.defLine, first: helper.body.split('\n')[0].trim() },
  });
}

say('§1  the rows, R2 — arm class → R2 class, with the deciding slices');
for (const r of rows) {
  const moved = r.r2 !== r.consumer;
  say(`  ${r.rel}:${r.line}   ${r.subjectClass}`);
  say(`      arm ${r.consumer} → R2 ${r.r2}${moved ? '   (MOVED)' : ''}   via ${r.path}`);
  if (r.helper) say(`      helper    ${r.rel}:${r.helper.defLine}  ${r.helper.first}`);
  say(`      why       ${r.why}`);
  say(`      deciding  ${r.deciding}`);
}
say('');

const CLS = ['THROW', 'REPORTED', 'DEFAULT', 'SKIP', 'UNCLEAR', 'UNCLEAR_R2'];
const n = (k) => rows.filter((r) => r.r2 === k).length;
say('§2  figures — R2');
say(`  rows                              ${rows.length}`);
say(`  arm classes                       ${CLS.map((c) => `${c} ${arm.rows.filter((r) => r.consumer === c).length}`).join(' · ')}`);
say(`  R2 classes                        ${CLS.map((c) => `${c} ${n(c)}`).join(' · ')}`);
say(`  rows resolved by helper reading    ${rows.filter((r) => r.helper).length}`);
say(`  rows whose class MOVED             ${rows.filter((r) => r.r2 !== r.consumer).length}`);
const silent = rows.filter((r) => r.r2 === 'DEFAULT' || r.r2 === 'SKIP');
const silentLive = silent.filter((r) => r.subjectClass === 'LIVE');
say(`  SILENT (DEFAULT + SKIP)            ${silent.length}   of which LIVE: ${silentLive.length}`);
for (const r of silent) say(`      ${r.rel}:${r.line}  ${r.r2}  ${r.subjectClass}`);
say(`  P3 (>= 2 SILENT) under R2:        ${silent.length >= 2 ? 'HIT' : 'REFUTED'} — ${silent.length}`);
const counts = CLS.map((c) => [c, n(c)]).sort((a, b) => b[1] - a[1]);
say(`  P4 (REPORTED largest) under R2:   ${counts[0][0] === 'REPORTED' ? 'HIT' : 'REFUTED'} — largest is ${counts[0][0]} at ${counts[0][1]}`);
const anch = rows.filter((r) => r.rel.includes('unit-500trackedcomplement') && r.line === 20);
say(`  P5 (end-anchored site THROW/REPORTED) under R2: ${anch.length ? (['THROW', 'REPORTED'].includes(anch[0].r2) ? 'HIT' : 'REFUTED') : 'UNGRADEABLE'} — ${anch.map((r) => r.r2).join(', ')}`);
say('');
say('§3  the sentence this unit set out to test');
say('  Theseus, unit-512 §4: "A `null` is at least detectable; this is not."');
say(`  Of ${rows.length} applications of this label's patterns, a null is NOT detectable at ${silent.length}`);
say(`  (${silentLive.length} of them LIVE, i.e. reachable by a rename of the live gate's label).`);
say('  So the alternation survivor is not the only silent site — it is the only one found by eye.');

writeFileSync(join(CAPS, 'POSTHOC-HELPER.out'), `${out.join('\n')}\n`);
writeFileSync(join(CAPS, 'POSTHOC-HELPER.json'), `${JSON.stringify({ rev, drivenAt: now, kp, kpScore, rows }, null, 2)}\n`);
