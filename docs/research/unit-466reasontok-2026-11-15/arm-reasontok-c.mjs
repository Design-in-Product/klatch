#!/usr/bin/env node
// unit-466reasontok arm C — the re-key of arm A's declared limit 1, per PRE-REGISTRATION-C.md.
//
// Four keys held APART and reported per form, never fused:
//   K1 token form        BACKTICK | DQUOTE | SQUOTE
//   K2 containment       SUBSTRING | BOUNDARY | BOUNDARY_STRIPPED
//   K3 resolution        AS_PRINTED | BASENAME_UNIQUE (unique basenames only; rest a named remainder)
//   K4 population        held at arm A's pin on purpose — a pure key delta, NOT a current census
//
// Every prediction is graded at top level, outside any conditional: arm A dropped one of its own
// five because its only grading site sat inside `if (ceilingFired)`.
import { execFileSync } from 'node:child_process';
import { stripSource } from '../../../scripts/lib/strip-source.mjs';

const REPO = '/Users/xian/Development/klatch-worktrees/daedalus';
const PIN = '5d430e5411885ffe56bdcbd19a4fd9664564748e';
const UNIT = 'docs/research/unit-466reasontok-2026-11-15';

const legs = [];
const leg = (name, ok, what) => { legs.push({ name, ok, what }); console.log(`${ok ? 'ok  ' : 'RED '} ${name} — ${what}`); };
const pred = [];
const grade = (name, verdict, what) => { pred.push({ name, verdict, what }); console.log(`${verdict.padEnd(8)} ${name} — ${what}`); };

const git = (...args) => execFileSync('git', ['-C', REPO, ...args], { encoding: 'utf8', maxBuffer: 4e8 });
const showAt = (rev, path) => { try { return git('show', `${rev}:${path}`); } catch { return null; } };
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const boundary = (hay, tok) => new RegExp(`(?<![A-Za-z0-9_$])${esc(tok)}(?![A-Za-z0-9_$])`).test(hay);

console.log('='.repeat(78));
console.log(`unit-466reasontok arm C — PIN ${PIN}`);
console.log('='.repeat(78));

// ------------------------------------------------- A0: two-sided, matched (same control as arm A)
const known = 'docs/research/lib/attested-rounds.mjs';
const a0a = git('ls-tree', '-r', '--name-only', PIN, '--', known).trim();
const a0b = git('ls-tree', '-r', '--name-only', PIN, '--', `${UNIT}/PRE-REGISTRATION-C.md`).trim();
leg('A0a', a0a === known, `ls-tree at the pin FINDS a known corpus file: ${JSON.stringify(a0a)}`);
leg('A0b', a0b === '', `ls-tree at the pin does NOT find THIS arm's pre-registration C: ${JSON.stringify(a0b)}`);

// ------------------------------------------------- population (K4, held constant)
const allFiles = git('ls-tree', '-r', '--name-only', PIN).trim().split('\n');
const outs = allFiles.filter((f) => /\.out$/.test(f));
const treeFiles = new Set(allFiles);
const byBasename = new Map();
for (const f of allFiles) {
  const b = f.split('/').pop();
  if (!byBasename.has(b)) byBasename.set(b, []);
  byBasename.get(b).push(f);
}
console.log(`\npopulation: ${outs.length} committed *.out recordings at the pin, ${allFiles.length} files in tree`);
console.log(`basename index: ${byBasename.size} distinct basenames; ${[...byBasename.values()].filter((v) => v.length === 1).length} unique, ${[...byBasename.values()].filter((v) => v.length > 1).length} shared`);

// ------------------------------------------------- K1: three token forms, counted separately
const FORMS = {
  BACKTICK: /`([A-Za-z_$][\w$]*)`/g,
  DQUOTE: /"([A-Za-z_$][\w$]*)"/g,
  SQUOTE: /'([A-Za-z_$][\w$]*)'/g,
};
const RE_CITE = /((?:[\w.\-/]+\/)?[\w.\-]+\.(?:mjs|mts|ts|md|tsx|json)):(\d+)/g;

const pairs = [];
for (const f of outs) {
  const text = showAt(PIN, f);
  if (text === null) continue;
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const cites = [...lines[i].matchAll(RE_CITE)].map((m) => ({ path: m[1], line: +m[2] }));
    if (!cites.length) continue;
    for (const [form, re] of Object.entries(FORMS)) {
      re.lastIndex = 0;
      for (const m of lines[i].matchAll(re)) {
        for (const c of cites) pairs.push({ file: f, lineNo: i + 1, text: lines[i], token: m[1], form, cite: c });
      }
    }
  }
}
const idOf = (p) => `${p.file}:${p.lineNo}|${p.token}|${p.cite.path}:${p.cite.line}`;
const perForm = {};
for (const form of Object.keys(FORMS)) perForm[form] = pairs.filter((p) => p.form === form);
console.log(`\nK1 pair counts, per form (one line may yield the same token in two forms — not fused):`);
for (const form of Object.keys(FORMS)) {
  const ps = perForm[form];
  console.log(`  ${form.padEnd(9)} pairs=${String(ps.length).padStart(5)}  distinct=${String(new Set(ps.map(idOf)).size).padStart(5)}  recordings=${new Set(ps.map((p) => p.file)).size}`);
}
const distinctAll = new Set(pairs.map(idOf));
console.log(`  ALL-FORMS pairs=${pairs.length}  distinct=${distinctAll.size}  recordings=${new Set(pairs.map((p) => p.file)).size}`);

// ------------------------------------------------- K3: resolution, two spellings
const srcCache = new Map();
const readPinned = (p) => { if (!srcCache.has(p)) srcCache.set(p, showAt(PIN, p)); return srcCache.get(p); };
const strippedCache = new Map();
const readStripped = (p) => {
  if (!strippedCache.has(p)) {
    const s = readPinned(p);
    let out = null;
    if (s !== null) { try { out = stripSource(s, true); } catch (e) { out = null; strippedCache.set(`${p}|err`, String(e && e.message)); } }
    strippedCache.set(p, out);
  }
  return strippedCache.get(p);
};

const resolve = (p, mode) => {
  // returns {path} or {why}
  if (treeFiles.has(p.cite.path)) return { path: p.cite.path, how: 'exact' };
  if (mode === 'AS_PRINTED') return { why: 'noFileInTree' };
  if (p.cite.path.includes('/')) return { why: 'noFileInTree_hadDir' };
  const hits = byBasename.get(p.cite.path);
  if (!hits) return { why: 'basenameNotInTree' };
  if (hits.length > 1) return { why: 'basenameAmbiguous' };
  return { path: hits[0], how: 'basenameUnique' };
};

const screenPass = (ps, mode) => {
  const res = { screenable: 0, unresolvable: 0, by: {}, rows: [] };
  for (const p of ps) {
    const r = resolve(p, mode);
    if (r.why) { res.unresolvable++; res.by[r.why] = (res.by[r.why] || 0) + 1; res.rows.push({ ...p, why: r.why }); continue; }
    const src = readPinned(r.path);
    if (src === null) { res.unresolvable++; res.by.noBlob = (res.by.noBlob || 0) + 1; res.rows.push({ ...p, why: 'noBlob' }); continue; }
    const srcLines = src.split('\n');
    if (p.cite.line < 1 || p.cite.line > srcLines.length) { res.unresolvable++; res.by.lineOutOfRange = (res.by.lineOutOfRange || 0) + 1; res.rows.push({ ...p, why: 'lineOutOfRange' }); continue; }
    res.screenable++;
    const subject = srcLines[p.cite.line - 1];
    const strippedSrc = readStripped(r.path);
    const subjectStripped = strippedSrc === null ? null : strippedSrc.split('\n')[p.cite.line - 1];
    res.rows.push({
      ...p,
      resolvedPath: r.path,
      how: r.how,
      subject,
      subjectStripped,
      SUBSTRING: subject.includes(p.token),
      BOUNDARY: boundary(subject, p.token),
      BOUNDARY_STRIPPED: subjectStripped === null ? null : boundary(subjectStripped, p.token),
      inWholeFile: boundary(src, p.token),
    });
  }
  return res;
};

// --- the PUBLISHED key, reimplemented here and pinned against arm A's printed figures
const published = screenPass(perForm.BACKTICK, 'AS_PRINTED');
const pubFlagged = published.rows.filter((r) => r.subject !== undefined && r.SUBSTRING === false);
const pubClean = published.rows.filter((r) => r.subject !== undefined && r.SUBSTRING === true);
console.log(`\nREPRO of arm A's published key (BACKTICK + AS_PRINTED + SUBSTRING):`);
console.log(`  pairs=${perForm.BACKTICK.length} screenable=${published.screenable} unresolvable=${published.unresolvable} flagged=${pubFlagged.length} clean=${pubClean.length}`);
console.log(`  arm A drive1.out printed: pairs=296 screenable=242 unresolvable=54 flagged=84 clean=158`);
const reproOk = perForm.BACKTICK.length === 296 && published.screenable === 242 && published.unresolvable === 54 && pubFlagged.length === 84 && pubClean.length === 158;
leg('REPRO', reproOk, `arm C reproduces arm A's five published figures exactly off the same pin — ${reproOk ? 'all five match' : 'MISMATCH, see the two lines above'}`);

// --- the WIDENED key
const widened = screenPass(pairs, 'BASENAME_UNIQUE');
const wScreened = widened.rows.filter((r) => r.subject !== undefined);
const unresolvableRate = pairs.length ? widened.unresolvable / pairs.length : 0;
console.log(`\nWIDENED (all forms + BASENAME_UNIQUE): screenable ${widened.screenable}, unresolvable ${widened.unresolvable} (${(unresolvableRate * 100).toFixed(1)}%) — ${JSON.stringify(widened.by)}`);
const byHow = {};
for (const r of wScreened) byHow[r.how] = (byHow[r.how] || 0) + 1;
console.log(`  resolved how: ${JSON.stringify(byHow)}`);

const count = (k) => wScreened.filter((r) => r[k] === false).length;
console.log(`\nK2 containment, same screened set (${wScreened.length} pairs), three tests:`);
console.log(`  FLAGGED under SUBSTRING          ${count('SUBSTRING')}`);
console.log(`  FLAGGED under BOUNDARY           ${count('BOUNDARY')}`);
console.log(`  FLAGGED under BOUNDARY_STRIPPED  ${count('BOUNDARY_STRIPPED')}  (null-stripped: ${wScreened.filter((r) => r.BOUNDARY_STRIPPED === null).length})`);

// ------------------------------------------------- Q2 monotonicity leg
const widenedIds = new Set(wScreened.map(idOf));
const pubIds = [...pubFlagged, ...pubClean].map(idOf);
const lostMembers = pubIds.filter((id) => !widenedIds.has(id));
leg('Q2', lostMembers.length === 0, `monotonicity: every pair screened by the published key is still screened by the widened one — lost=${lostMembers.length}${lostMembers.length ? ' ' + JSON.stringify(lostMembers.slice(0, 5)) : ''}`);

// ------------------------------------------------- KPa–KPd: the four declared answer keys
const HIS1 = 'docs/research/unit-466striplift-2026-11-15/drive1.arma.out';
const i1All = pairs.filter((p) => p.file === HIS1 && p.token === 'KP_G' && /enumerate-legs\.mjs$/.test(p.cite.path) && p.cite.line === 275);
const i1Forms = [...new Set(i1All.map((p) => p.form))].sort();
leg('KPa', i1Forms.includes('DQUOTE') && !i1Forms.includes('BACKTICK'), `instance 1 is reached by DQUOTE and still missed by BACKTICK — forms that find it: ${JSON.stringify(i1Forms)}`);
const i1Row = wScreened.find((r) => r.file === HIS1 && r.token === 'KP_G' && r.cite.line === 275);
if (i1Row) {
  leg('KPb', i1Row.SUBSTRING === true && i1Row.BOUNDARY === true, `instance 1, once reached, reads CLEAN under SUBSTRING (${i1Row.SUBSTRING}) and BOUNDARY (${i1Row.BOUNDARY}) — the widening reaches it and the screen clears it`);
  console.log(`      KPb subject:  ${JSON.stringify(i1Row.subject.trim().slice(0, 190))}`);
  console.log(`      KPb stripped: ${JSON.stringify(i1Row.subjectStripped === null ? null : i1Row.subjectStripped.trim().slice(0, 190))}`);
  console.log(`      KPb resolved: ${i1Row.resolvedPath} via ${i1Row.how}`);
} else leg('KPb', false, 'instance 1 did not reach the screened set at all — KPb is ungradeable, which is a RED and not a pass');

const HIS2 = 'docs/research/unit-466striplift-2026-11-15/drive3.armc.out';
const i2Pub = published.rows.find((r) => r.file === HIS2 && r.token === 'in' && r.cite.line === 275);
const i2Wide = widened.rows.find((r) => r.file === HIS2 && r.token === 'in' && r.cite.line === 275);
leg('KPc', !!i2Pub && i2Pub.why === 'noFileInTree' && !!i2Wide && i2Wide.why === undefined,
  `instance 2 was REACHED and never SCREENED by the published key (why=${i2Pub ? i2Pub.why : 'absent'}), and BASENAME_UNIQUE screens it (why=${i2Wide ? i2Wide.why ?? 'resolved' : 'absent'})`);
if (i2Wide && i2Wide.subject !== undefined) {
  leg('KPd', i2Wide.SUBSTRING === true && i2Wide.BOUNDARY === true, `instance 2 reads CLEAN under SUBSTRING (${i2Wide.SUBSTRING}) AND under BOUNDARY (${i2Wide.BOUNDARY}) — the boundary repair alone does not rescue it; the word "in" is prose inside the subject's own template literal`);
  console.log(`      KPd subject:  ${JSON.stringify(i2Wide.subject.trim().slice(0, 190))}`);
  console.log(`      KPd stripped: ${JSON.stringify(i2Wide.subjectStripped === null ? null : i2Wide.subjectStripped.trim().slice(0, 190))}`);
  console.log(`      KPd BOUNDARY_STRIPPED verdict: ${i2Wide.BOUNDARY_STRIPPED}  (false = FLAGGED, i.e. the stripped repair reaches it)`);
  console.log(`      KPd resolved: ${i2Wide.resolvedPath} via ${i2Wide.how}`);
} else leg('KPd', false, 'instance 2 is not in the screened set — KPd is ungradeable, a RED not a pass');

// ------------------------------------------------- the ceiling, graded unconditionally
const CEILING = 0.40;
const ceilingFired = unresolvableRate > CEILING;
console.log(`\nCEILING (>40% unresolvable after BASENAME_UNIQUE): ${ceilingFired ? 'FIRED' : 'held'} at ${(unresolvableRate * 100).toFixed(1)}%`);

// ------------------------------------------------- composition + the new-flag delta
const pubFlagIds = new Set(pubFlagged.map(idOf));
const wideFlagSub = wScreened.filter((r) => r.SUBSTRING === false);
const newlyFlagged = wideFlagSub.filter((r) => !pubFlagIds.has(idOf(r)));
const newlyAbsentWholeFile = newlyFlagged.filter((r) => r.inWholeFile === false);
const flipBoundary = wScreened.filter((r) => r.SUBSTRING === true && r.BOUNDARY === false);
const flipStripped = wScreened.filter((r) => r.SUBSTRING === true && r.BOUNDARY_STRIPPED === false);
// Q4 is specifically about arm A's 158 CLEAN pairs, not about the widened clean set.
const pubCleanIds = new Set(pubClean.map(idOf));
const flipBoundaryAmongPubClean = flipBoundary.filter((r) => pubCleanIds.has(idOf(r)));
const flipStrippedAmongPubClean = flipStripped.filter((r) => pubCleanIds.has(idOf(r)));

console.log(`\ndelta vs arm A: newly FLAGGED (substring test, widened keys) = ${newlyFlagged.length}; of those, token absent from the WHOLE cited file = ${newlyAbsentWholeFile.length}`);
console.log(`flips among arm A's own 158 CLEAN pairs: SUBSTRING->BOUNDARY ${flipBoundaryAmongPubClean.length}, SUBSTRING->BOUNDARY_STRIPPED ${flipStrippedAmongPubClean.length}`);

console.log(`\n--- every pair arm A's CLEAN set loses under BOUNDARY (${flipBoundaryAmongPubClean.length}) ---`);
for (const r of flipBoundaryAmongPubClean) {
  console.log(`FLIP \`${r.token}\` -> ${r.resolvedPath}:${r.cite.line}  [${r.file.split('/').pop()}:${r.lineNo}]`);
  console.log(`     subject: ${JSON.stringify(r.subject.trim().slice(0, 170))}`);
}
console.log(`\n--- every NEWLY FLAGGED pair whose token is absent from the whole cited file (${newlyAbsentWholeFile.length}) ---`);
for (const r of newlyAbsentWholeFile) {
  console.log(`NEW[${r.form}] \`${r.token}\` absent from all of ${r.resolvedPath} (cited line ${r.cite.line})`);
  console.log(`     recording: ${r.file}:${r.lineNo}`);
  console.log(`     rec line:  ${JSON.stringify(r.text.trim().slice(0, 170))}`);
  console.log(`     subject:   ${JSON.stringify(r.subject.trim().slice(0, 170))}`);
}
console.log(`\n--- distinct tokens among ALL newly flagged (${new Set(newlyFlagged.map((r) => r.token)).size}) ---`);
console.log(JSON.stringify([...new Set(newlyFlagged.map((r) => r.token))].sort()));
console.log(`\n--- every unresolvable class member count, widened pass ---`);
console.log(JSON.stringify(widened.by, null, 1));
const bareBasenamePairs = pairs.filter((p) => !p.cite.path.includes('/'));
const bareUnique = bareBasenamePairs.filter((p) => (byBasename.get(p.cite.path) || []).length === 1);
console.log(`\nbare-basename citations among all-forms pairs: ${bareBasenamePairs.length}; of those, basename unique in tree: ${bareUnique.length}`);

// ------------------------------------------------- PREDICTIONS, all at top level
console.log('\n' + '='.repeat(78));
console.log('PREDICTIONS (every one graded here, outside any conditional)');
console.log('='.repeat(78));
grade('Q1', perForm.DQUOTE.length >= 296 ? 'LANDS' : 'REFUTED', `DQUOTE at least doubles arm A's 296: DQUOTE pairs=${perForm.DQUOTE.length}`);
grade('Q3', unresolvableRate < 0.10 ? 'LANDS' : 'REFUTED', `BASENAME_UNIQUE cuts the unresolvable rate below 10% (arm A: 18.2%): ${(unresolvableRate * 100).toFixed(1)}%`);
grade('Q4', flipBoundaryAmongPubClean.length >= 5 ? 'LANDS' : 'REFUTED', `BOUNDARY flips >=5 of arm A's 158 CLEAN pairs to flagged: ${flipBoundaryAmongPubClean.length}`);
const i1Stripped = i1Row ? i1Row.BOUNDARY_STRIPPED : null;
grade('Q5', i1Stripped === false ? 'LANDS' : 'REFUTED', `instance 1 reads FLAGGED under BOUNDARY_STRIPPED (i.e. stripSource blanks \${…} interpolations too): BOUNDARY_STRIPPED=${i1Stripped} ${i1Stripped === true ? '— the scanner IS interpolation-aware' : ''}`);
grade('Q6', flipStrippedAmongPubClean.length >= 2 * Math.max(1, flipBoundaryAmongPubClean.length) ? 'LANDS' : 'REFUTED', `BOUNDARY_STRIPPED costs >=2x BOUNDARY among arm A's CLEAN pairs: ${flipStrippedAmongPubClean.length} vs ${flipBoundaryAmongPubClean.length}`);
const q7Rate = newlyFlagged.length ? newlyAbsentWholeFile.length / newlyFlagged.length : 0;
grade('Q7', ceilingFired ? 'VOID' : (q7Rate >= 0.30 ? 'LANDS' : 'REFUTED'), ceilingFired
  ? `ceiling fired at ${(unresolvableRate * 100).toFixed(1)}% — composition not published, by my own pre-registered terms`
  : `>=30% of newly flagged pairs have their token absent from the whole cited file: ${newlyAbsentWholeFile.length}/${newlyFlagged.length} = ${(q7Rate * 100).toFixed(1)}%`);

console.log('\n' + '='.repeat(78));
const red = legs.filter((l) => !l.ok);
console.log(`VERDICT: ${legs.length} legs, ${red.length} red${red.length ? ' — ' + red.map((l) => l.name).join(', ') : ''}; ${pred.length} predictions graded, ${pred.filter((p) => p.verdict === 'REFUTED').length} refuted, ${pred.filter((p) => p.verdict === 'VOID').length} void`);
console.log(`FIGURES: recordings=${outs.length} backtickPairs=${perForm.BACKTICK.length} dquotePairs=${perForm.DQUOTE.length} squotePairs=${perForm.SQUOTE.length} allFormsPairs=${pairs.length} allFormsDistinct=${distinctAll.size} widenedScreenable=${widened.screenable} widenedUnresolvable=${widened.unresolvable} widenedUnresolvableRate=${(unresolvableRate * 100).toFixed(1)}% flaggedSubstring=${count('SUBSTRING')} flaggedBoundary=${count('BOUNDARY')} flaggedBoundaryStripped=${count('BOUNDARY_STRIPPED')} newlyFlagged=${newlyFlagged.length} newlyAbsentWholeFile=${newlyAbsentWholeFile.length} flipBoundaryAmongPubClean=${flipBoundaryAmongPubClean.length} flipStrippedAmongPubClean=${flipStrippedAmongPubClean.length} bareBasenamePairs=${bareBasenamePairs.length} bareUnique=${bareUnique.length}`);
console.log('='.repeat(78));
process.exit(red.length ? 1 : 0);
