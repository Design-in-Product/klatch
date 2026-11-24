/**
 * unit-513consumernull-2026-11-24 — arm.
 *
 * **A `null` is detectable only if its consumer checks it.**
 *
 * Every figure either seat has published on the label `tracked files read` is keyed on the PATTERN:
 * my unit-511 census (15 matcher sites / 11 files), Theseus's unit-512 subject split (8 LIVE / 7
 * FROZEN), his 12-of-13-go-to-`null`. His §4 then says, of the one pattern that survives a rename:
 * *"A `null` is at least detectable; this is not."* That sentence is a claim about **consumers**, and
 * no key of ours has read one. This arm reads them.
 *
 * Keys, all four declared in PRE-REGISTRATION.md §1 before this file existed:
 *   A  host mode      — is the pattern applied to a whole string or to single lines
 *   B  subject        — LIVE (drives the gate at run time) / FROZEN (reads committed captures)
 *   C  consumer       — THROW / REPORTED / DEFAULT / SKIP / UNCLEAR  (the new axis)
 *   D  alternation    — does the pattern have sibling label branches that survive a rename
 *
 * Every row prints the slice it was classified from, verbatim. A tally with no auditable slice
 * behind it is not a finding on this thread.
 *
 * No exemption marker: this file compares no braces, so it is out of the gate's population and a
 * marker here would exempt nothing (see unit-511 §3 — markers that exempt nothing get reported).
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..', '..');
const CAPS = join(HERE, 'captures');
mkdirSync(CAPS, { recursive: true });

const LABEL = 'tracked files read';
const GATE = 'scripts/verify-decl-body-slicers.mjs';
const SELF_DIR = 'docs/research/unit-513consumernull-2026-11-24/';
const CODE_EXT = new Set(['.mjs', '.mts', '.ts', '.js', '.cjs', '.tsx', '.jsx']);
const REGEX_LITERAL = /\/(?:[^/\\\n]|\\.)+\/[a-z]*/g;

const out = [];
const say = (s = '') => { out.push(s); console.log(s); };

// ---------------------------------------------------------------- census (population)

const tracked = execFileSync('git', ['-C', ROOT, 'ls-files'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
  .split('\n').filter(Boolean)
  .filter((p) => CODE_EXT.has(p.slice(p.lastIndexOf('.'))));

const srcCache = new Map();
const srcOf = (rel) => {
  if (!srcCache.has(rel)) srcCache.set(rel, readFileSync(join(ROOT, rel), 'utf8'));
  return srcCache.get(rel);
};

/** Every regex literal in the tracked code tree that contains the label. */
function censusSites() {
  const sites = [];
  for (const rel of tracked) {
    let src;
    try { src = srcOf(rel); } catch { continue; }
    if (!src.includes(LABEL)) continue;
    const lines = src.split('\n');
    for (let i = 0; i < lines.length; i += 1) {
      if (!lines[i].includes(LABEL)) continue;
      for (const m of lines[i].matchAll(REGEX_LITERAL)) {
        if (!m[0].includes(LABEL)) continue;
        sites.push({ rel, line: i + 1, pattern: m[0] });
      }
    }
  }
  return sites;
}

// ---------------------------------------------------------------- key helpers

/** The identifier a regex literal is bound to on its own line, if any. */
function boundName(line) {
  const m = line.match(/(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*\//);
  return m ? m[1] : null;
}

/** Where a pattern is actually APPLIED: the literal's own line, or the line that uses its name. */
function useSites(rel, site) {
  const lines = srcOf(rel).split('\n');
  const own = lines[site.line - 1];
  if (/\.(?:match|exec|test|matchAll|replace|split|search)\s*\(/.test(own) && own.includes(LABEL)) {
    return [{ line: site.line, text: own, via: 'literal-inline' }];
  }
  const name = boundName(own);
  if (!name) return [{ line: site.line, text: own, via: 'no-application-found' }];
  const uses = [];
  const useRe = new RegExp(`(?:\\b${name}\\.(?:exec|test)\\s*\\()|(?:\\.(?:match|matchAll|replace|search)\\s*\\(\\s*${name}\\b)`);
  for (let i = 0; i < lines.length; i += 1) {
    if (i + 1 === site.line) continue;
    if (useRe.test(lines[i])) uses.push({ line: i + 1, text: lines[i], via: `named:${name}` });
  }
  return uses.length ? uses : [{ line: site.line, text: own, via: `named:${name}:unused` }];
}

/**
 * The receiver of a `.match(`-style call, read by walking LEFT from the dot over a balanced
 * expression. A left-to-right regex here captured `Number(preL` on the first real row — the
 * receiver is the innermost expression, not the longest prefix.
 */
function receiverBefore(t, dotIdx) {
  let i = dotIdx - 1;
  let depth = 0;
  const chars = [];
  while (i >= 0) {
    const c = t[i];
    if (c === ']') { depth += 1; chars.push(c); i -= 1; continue; }
    if (c === '[') { if (depth === 0) break; depth -= 1; chars.push(c); i -= 1; continue; }
    if (depth > 0) { chars.push(c); i -= 1; continue; }
    if (/[\w$.]/.test(c)) { chars.push(c); i -= 1; continue; }
    break;
  }
  return chars.reverse().join('').replace(/^\.+/, '');
}

const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Key A — the subject expression of a match call, and whether it is a line or a whole string. */
function hostMode(rel, use) {
  const src = srcOf(rel);
  const lines = src.split('\n');
  const t = use.text;
  let subj = null;
  let m;
  if ((m = t.match(/\.(?:match|matchAll|search)\s*\(/))) subj = receiverBefore(t, m.index);
  else if ((m = t.match(/\.(?:exec|test)\s*\(\s*([^),]+)/))) subj = m[1].trim();
  if (subj === '') subj = null;
  if (!subj) return { mode: 'UNCLEAR', subject: null, evidence: 'no subject expression found on the use line' };
  // Inline evidence first: an indexed read or an inline split is decisive on the line itself.
  if (/\[\s*[a-z_$][\w$]*\s*\]\s*$/.test(subj) || /\[\s*\d+\s*\]\s*$/.test(subj)) {
    return { mode: 'LINE', subject: subj, evidence: `indexed subject on the use line: ${subj}` };
  }
  if (/\.split\(\s*['"]\\n['"]\s*\)/.test(subj)) return { mode: 'LINE', subject: subj, evidence: `inline split on the use line: ${subj}` };
  const bare = (subj.match(/^[A-Za-z_$][\w$]*/) || [''])[0];
  if (!bare) return { mode: 'UNCLEAR', subject: subj, evidence: 'subject expression has no leading identifier' };
  // Origin of the subject identifier anywhere in the file.
  const originRe = new RegExp(`(?:const|let|var)\\s+${escRe(bare)}\\b[^\\n]*|for\\s*\\(\\s*(?:const|let)\\s+${escRe(bare)}\\s+of[^\\n]*`);
  for (let i = 0; i < lines.length; i += 1) {
    const hit = lines[i].match(originRe);
    if (!hit) continue;
    if (/\.split\(\s*['"]\\n['"]\s*\)/.test(hit[0])) {
      return { mode: 'LINE', subject: subj, evidence: `${rel}:${i + 1}  ${hit[0].trim()}` };
    }
    return { mode: 'STRING', subject: subj, evidence: `${rel}:${i + 1}  ${hit[0].trim()}` };
  }
  return { mode: 'UNCLEAR', subject: subj, evidence: `no origin found for \`${bare}\`` };
}

/** Key B — does the host drive the gate (or a copy of its source) at run time? */
function subjectClass(rel) {
  const src = srcOf(rel);
  const spawnCalls = [...src.matchAll(/\b(spawnSync|execFileSync|execSync|spawn)\s*\(/g)].map((m) => m[1]);
  if (spawnCalls.length === 0) return { cls: 'FROZEN', spawns: 0, evidence: 'zero spawnSync/execFileSync/execSync/spawn calls in the file' };
  const gateRef = src.includes('verify-decl-body-slicers');
  return {
    cls: gateRef ? 'LIVE' : 'DRIVES_OTHER',
    spawns: spawnCalls.length,
    evidence: `${spawnCalls.length} call(s): ${[...new Set(spawnCalls)].join(', ')}; names the gate: ${gateRef}`,
  };
}

/**
 * Key C — consumer null-handling. Declared precedence, and the deciding line is printed per row:
 *   1 THROW     an explicit throw/exit on the null, or an UNGUARDED `ID[1]` read (TypeError)
 *   2 SKIP      a guard with an EMPTY body (continue / return / nothing emitted)
 *     REPORTED  ...unless the guard's body emits — then the absence reaches the output
 *   3 DEFAULT   the null is replaced by a number or empty string (`?? 0`, `|| 0`, `?? ''`)
 *   4 REPORTED  the null reaches the output as a visible non-number (null/NaN/undefined/'-')
 *   5 SKIP      a bare `.test()` in a condition — the branch simply does not run
 * Nothing falls through: anything else is UNCLEAR, a declared bucket.
 */
function consumerClass(rel, use) {
  const lines = srcOf(rel).split('\n');
  const i0 = use.line - 1;
  const window = lines.slice(i0, Math.min(lines.length, i0 + 13));
  const t = use.text;
  const idm = t.match(/(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:[^=]*?)\.(?:match|exec)\s*\(/);
  const id = idm ? idm[1] : null;
  const joined = window.join('\n');
  const deciding = (pred) => {
    for (const l of window) if (pred(l)) return l.trim();
    return null;
  };

  // 5 first only when there is no result identifier at all: a bare predicate use.
  if (!id) {
    if (/\.test\s*\(/.test(t) && /\bif\s*\(|\?|&&|\|\|/.test(t)) {
      return { cls: 'SKIP', deciding: t.trim(), why: 'bare .test() in a condition: under a rename the branch does not run and nothing is emitted' };
    }
    if (/\.replace\s*\(/.test(t)) {
      return { cls: 'SKIP', deciding: t.trim(), why: '.replace() with no match is a no-op: the text passes through unchanged' };
    }
    if (/\.match\s*\(|\.exec\s*\(|\.matchAll\s*\(/.test(t)) {
      // result consumed inline
      if (/\?\?\s*0|\|\|\s*0|\?\?\s*['"]['"]/.test(t)) return { cls: 'DEFAULT', deciding: t.trim(), why: 'inline nullish/or default to a number or empty string' };
      if (/\?\.\[/.test(t)) return { cls: 'REPORTED', deciding: t.trim(), why: 'inline optional read: undefined reaches the consumer as a visible non-number' };
      if (/\)\s*\[\s*1\s*\]/.test(t)) return { cls: 'THROW', deciding: t.trim(), why: 'inline unguarded [1] on a possibly-null match: TypeError' };
    }
    return { cls: 'UNCLEAR', deciding: t.trim(), why: 'no result identifier and no declared inline form' };
  }

  const guardRe = new RegExp(`if\\s*\\(\\s*!\\s*${id}\\b|if\\s*\\(\\s*${id}\\s*===?\\s*null|if\\s*\\(\\s*${id}\\s*\\)|${id}\\s*&&|${id}\\s*\\?`);
  const throwRe = /\bthrow\b|process\.exit\s*\(|\bassert\b/;
  const guardLine = deciding((l) => guardRe.test(l));
  const throwLine = deciding((l) => throwRe.test(l) && (l.includes(id) || guardLine));

  if (throwLine && guardLine) return { cls: 'THROW', deciding: `${guardLine}  …  ${throwLine}`, why: 'guarded null raises' };
  if (new RegExp(`\\b${id}\\s*\\[\\s*1\\s*\\]`).test(joined) && !guardLine) {
    const l = deciding((l) => new RegExp(`\\b${id}\\s*\\[\\s*1\\s*\\]`).test(l));
    return { cls: 'THROW', deciding: l, why: `unguarded ${id}[1] read: a null match is a TypeError` };
  }
  if (guardLine) {
    const gi = window.findIndex((l) => guardRe.test(l));
    const body = window.slice(gi, Math.min(window.length, gi + 4)).join('\n');
    const emits = /say\s*\(|console\.(log|error)\s*\(|push\s*\(|\bwarn\b/.test(body);
    if (/\?\?\s*0|\|\|\s*0|\?\?\s*['"]['"]/.test(body)) return { cls: 'DEFAULT', deciding: guardLine, why: 'guard defaults the figure to a number or empty string' };
    return emits
      ? { cls: 'REPORTED', deciding: guardLine, why: 'guard body emits, so the absence reaches the output' }
      : { cls: 'SKIP', deciding: guardLine, why: 'guard body emits nothing: the figure is omitted with no trace' };
  }
  if (new RegExp(`${id}\\?\\.\\[`).test(joined)) {
    const l = deciding((l) => new RegExp(`${id}\\?\\.\\[`).test(l));
    if (/\?\?\s*0|\|\|\s*0|\?\?\s*['"]['"]/.test(l)) return { cls: 'DEFAULT', deciding: l, why: 'optional read defaulted to a number or empty string' };
    return { cls: 'REPORTED', deciding: l, why: 'optional read: undefined/null reaches the output as a visible non-number' };
  }
  return { cls: 'UNCLEAR', deciding: t.trim(), why: 'result identifier found but no declared handling form in the next 13 lines' };
}

/** Key D — alternation over label alternatives, and what survives a rename of THIS label. */
function alternation(pattern) {
  const body = pattern.replace(/^\//, '').replace(/\/[a-z]*$/, '');
  const grp = body.match(/\(([^()]*\|[^()]*)\)/);
  if (!grp) return { alt: false, branches: [], survivors: [] };
  const branches = grp[1].split('|');
  const survivors = branches.filter((b) => !b.includes(LABEL));
  return { alt: true, branches, survivors };
}

// ---------------------------------------------------------------- known positives (P7)

const KP_HOSTS = [
  { want: 'THROW', src: `const m = stdout.match(/tracked files read: (\\d+)/);\nif (!m) throw new Error('no figure');\nconst n = Number(m[1]);\n` },
  { want: 'REPORTED', src: `const m = stdout.match(/tracked files read: (\\d+)/);\nsay(\`  figure: \${m?.[1]}\`);\n` },
  { want: 'DEFAULT', src: `const m = stdout.match(/tracked files read: (\\d+)/);\nconst n = Number(m?.[1] ?? 0);\nsay(\`  figure: \${n}\`);\n` },
  { want: 'SKIP', src: `const m = stdout.match(/tracked files read: (\\d+)/);\nif (m) {\n  figures.read = Number(m[1]);\n}\n` },
];

function kpRun() {
  const rows = [];
  for (const kp of KP_HOSTS) {
    const rel = `__kp_${kp.want}__.mjs`;
    srcCache.set(rel, kp.src);
    const site = { rel, line: 1, pattern: `/${LABEL}: (\\d+)/` };
    const [use] = useSites(rel, site);
    const got = consumerClass(rel, use);
    rows.push({ want: kp.want, got: got.cls, deciding: got.deciding, ok: got.cls === kp.want });
    srcCache.delete(rel);
  }
  return rows;
}

// ---------------------------------------------------------------- drive

const rev = execFileSync('git', ['-C', ROOT, 'rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim();
const now = execFileSync('date', ['+%H:%M:%S'], { encoding: 'utf8', env: { ...process.env, TZ: 'America/Los_Angeles' } }).trim();

say(`unit-513consumernull — consumer null-handling census on \`${LABEL}\``);
say(`  rev ${rev} · driven ${now} PST · pre-registration e7ce8214 (pushed 13:20:50 PST)`);
say('');

say('§0  known positives for Key C — P7, and the census is void below 4 of 4');
const kp = kpRun();
for (const r of kp) say(`  want ${r.want.padEnd(9)} got ${r.got.padEnd(9)} ${r.ok ? 'OK ' : 'MISS'}   deciding: ${r.deciding}`);
const kpScore = kp.filter((r) => r.ok).length;
say(`  P7: ${kpScore} of ${kp.length}${kpScore === kp.length ? ' — HIT, the key is graded' : ' — REFUTED, no class figures published'}`);
say('');

const allSites = censusSites();
const corpus = allSites.filter((s) => !s.rel.startsWith(SELF_DIR) && s.rel !== GATE);
const ownSites = allSites.filter((s) => s.rel.startsWith(SELF_DIR));
const gateSites = allSites.filter((s) => s.rel === GATE);

say('§1  census — every regex literal in the tracked code tree containing the label');
say(`  total literals found:                 ${allSites.length}`);
say(`  in this unit's own files (excluded):  ${ownSites.length}   [${[...new Set(ownSites.map((s) => s.rel))].length} file(s)]`);
say(`  in the gate itself (excluded, SELF):  ${gateSites.length}`);
say(`  CORPUS:                               ${corpus.length}   in ${[...new Set(corpus.map((s) => s.rel))].length} file(s)`);
say(`  unit-511 post-hoc 2 found 13 in 12 files at 7ae1eb18 this morning.`);
say(`  P1 (corpus >= 16): ${corpus.length >= 16 ? 'HIT' : 'REFUTED'} — ${corpus.length}`);
say('');

const rows = [];
for (const site of corpus) {
  const uses = useSites(site.rel, site);
  for (const use of uses) {
    rows.push({
      ...site,
      use,
      mode: hostMode(site.rel, use),
      subj: subjectClass(site.rel),
      cons: consumerClass(site.rel, use),
      alt: alternation(site.pattern),
    });
  }
}

say('§2  the rows, each with the slice it was classified from');
for (const r of rows) {
  say(`  ${r.rel}:${r.line}`);
  say(`      pattern   ${r.pattern}`);
  say(`      applied   ${r.use.via}  at :${r.use.line}   ${r.use.text.trim()}`);
  say(`      KEY A     ${r.mode.mode}   subject ${r.mode.subject ?? '—'}   [${r.mode.evidence}]`);
  say(`      KEY B     ${r.subj.cls}   [${r.subj.evidence}]`);
  say(`      KEY C     ${r.cons.cls}   ${r.cons.why}`);
  say(`                deciding: ${r.cons.deciding}`);
  say(`      KEY D     ${r.alt.alt ? `alternation, ${r.alt.branches.length} branches, ${r.alt.survivors.length} survive a rename of this label` : 'single label'}`);
}
say('');

const by = (k, v) => rows.filter((r) => k(r) === v).length;
const classes = ['THROW', 'REPORTED', 'DEFAULT', 'SKIP', 'UNCLEAR'];
say('§3  the figures');
say(`  rows (site × application):            ${rows.length}`);
say(`  KEY B   LIVE ${by((r) => r.subj.cls, 'LIVE')} · FROZEN ${by((r) => r.subj.cls, 'FROZEN')} · DRIVES_OTHER ${by((r) => r.subj.cls, 'DRIVES_OTHER')}`);
say(`  KEY A   LINE ${by((r) => r.mode.mode, 'LINE')} · STRING ${by((r) => r.mode.mode, 'STRING')} · UNCLEAR ${by((r) => r.mode.mode, 'UNCLEAR')}`);
say(`  KEY C   ${classes.map((c) => `${c} ${by((r) => r.cons.cls, c)}`).join(' · ')}`);
const silent = rows.filter((r) => r.cons.cls === 'DEFAULT' || r.cons.cls === 'SKIP');
say(`  SILENT (DEFAULT + SKIP) — a null here is NOT detectable: ${silent.length}`);
for (const r of silent) say(`      ${r.rel}:${r.use.line}  ${r.cons.cls}  ${r.subj.cls}`);
say(`  P3 (>= 2 SILENT): ${silent.length >= 2 ? 'HIT' : 'REFUTED'} — ${silent.length}`);
const counts = classes.map((c) => [c, by((r) => r.cons.cls, c)]).sort((a, b) => b[1] - a[1]);
say(`  P4 (REPORTED is the largest class): ${counts[0][0] === 'REPORTED' ? 'HIT' : 'REFUTED'} — largest is ${counts[0][0]} at ${counts[0][1]}`);
const anchored = rows.filter((r) => r.rel.includes('unit-500trackedcomplement') && r.line === 20);
say(`  P5 (the end-anchored site that dictated the cure's shape is THROW or REPORTED): ${
  anchored.length === 0 ? 'UNGRADEABLE — site not in the corpus' : (['THROW', 'REPORTED'].includes(anchored[0].cons.cls) ? 'HIT' : 'REFUTED')
} — ${anchored.map((r) => `${r.cons.cls}`).join(', ') || 'absent'}`);
const frozenFiles = [...new Set(rows.filter((r) => r.subj.cls === 'FROZEN').map((r) => r.rel))];
say('');
say('§4  P2 — Theseus\'s FROZEN set, re-derived under my own key');
say('  he named 3 files frozen: unit-500…/posthoc-landing-condition.mjs, unit-504…/posthoc-standing-unmoved.mjs, unit-506…/posthoc-standing-linewise.mjs');
for (const f of frozenFiles) say(`      FROZEN here: ${f}`);
const his = ['unit-500trackedcomplement-2026-11-22/posthoc-landing-condition.mjs', 'unit-504mixedstalelabels-2026-11-22/posthoc-standing-unmoved.mjs', 'unit-506labelmultiset-2026-11-23/posthoc-standing-linewise.mjs'];
const extra = frozenFiles.filter((f) => !his.some((h) => f.endsWith(h)));
const missing = his.filter((h) => !frozenFiles.some((f) => f.endsWith(h)));
say(`  agreement: ${extra.length === 0 && missing.length === 0 ? 'EXACT — P2 HIT' : 'P2 REFUTED'}`);
if (extra.length) say(`      frozen under my key and not in his three: ${extra.join(', ')}`);
if (missing.length) say(`      in his three and not frozen under my key: ${missing.join(', ')}`);
say('');
say('§5  KEY D — alternation rows (the mechanism his §4 found by eye)');
const alts = rows.filter((r) => r.alt.alt && r.alt.survivors.length > 0);
if (alts.length === 0) say('  none');
for (const r of alts) {
  say(`  ${r.rel}:${r.line}  ${r.subj.cls}  consumer ${r.cons.cls}`);
  say(`      branches: ${r.alt.branches.join('   |   ')}`);
  say(`      survive a rename of this label: ${r.alt.survivors.join(', ')}`);
}

writeFileSync(join(CAPS, 'ARM.out'), `${out.join('\n')}\n`);
writeFileSync(join(CAPS, 'ARM.json'), `${JSON.stringify({
  rev, drivenAt: now, preReg: 'e7ce8214',
  kp, kpScore,
  censusTotals: { all: allSites.length, own: ownSites.length, gate: gateSites.length, corpus: corpus.length },
  rows: rows.map((r) => ({
    rel: r.rel, line: r.line, pattern: r.pattern, appliedAt: r.use.line, via: r.use.via,
    mode: r.mode.mode, subject: r.mode.subject, modeEvidence: r.mode.evidence,
    subjectClass: r.subj.cls, subjectEvidence: r.subj.evidence,
    consumer: r.cons.cls, consumerWhy: r.cons.why, consumerDeciding: r.cons.deciding,
    alternation: r.alt.alt, branches: r.alt.branches, survivors: r.alt.survivors,
  })),
}, null, 2)}\n`);
