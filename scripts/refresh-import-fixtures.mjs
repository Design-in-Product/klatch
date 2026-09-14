#!/usr/bin/env node
/**
 * Refresh the import test fixtures against what Claude Code actually emits today.
 *
 * Why this exists: on 2026-08-28 an audit found 9 fabricated turns in 75 on a real
 * transcript, because every fixture was hand-written in March 2026 against Claude Code
 * 2.1.19/2.1.30 and the suite was still proving the parser handles a format nobody runs.
 * See packages/server/src/__tests__/fixtures/PROVENANCE.md.
 *
 * Usage
 *   node scripts/refresh-import-fixtures.mjs                 # survey ~/.claude/projects
 *   node scripts/refresh-import-fixtures.mjs --limit 20      # survey more sessions
 *   node scripts/refresh-import-fixtures.mjs --input FILE    # survey one transcript
 *   node scripts/refresh-import-fixtures.mjs --emit          # also write a redacted fixture
 *   node scripts/refresh-import-fixtures.mjs --shape attachment
 *                                                            # field names + value TYPES
 *                                                            # for one event type, no values
 *
 * It never writes to ~/.claude, and `--emit` REDACTS all message text: only structure,
 * flags, versions and block types are preserved, so the output is safe to commit.
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const args = process.argv.slice(2);
const flag = (name, fallback = null) => {
  const i = args.indexOf(name);
  return i === -1 ? fallback : (args[i + 1] ?? true);
};
const LIMIT = Number(flag('--limit', 10));
const EMIT = args.includes('--emit');
const INPUT = flag('--input', null);
const SHAPE = flag('--shape', null);

const projectsDir = process.env.CLAUDE_CONFIG_DIR
  ? path.join(process.env.CLAUDE_CONFIG_DIR, 'projects')
  : path.join(os.homedir(), '.claude', 'projects');

// Everything the parser depends on. New entries appearing here are the signal to look.
const KNOWN_EVENT_TYPES = new Set(['user', 'assistant', 'system', 'progress',
  'file-history-snapshot', 'queue-operation', 'last-prompt']);
const KNOWN_BLOCK_TYPES = new Set(['text', 'tool_use', 'tool_result', 'thinking', 'image']);
const KNOWN_USER_FLAGS = new Set(['isMeta', 'isCompactSummary', 'isVisibleInTranscriptOnly',
  'permissionMode', 'sourceToolUseID', 'sourceToolAssistantUUID', 'isSidechain',
  'isApiErrorMessage']);

function collectFiles() {
  if (INPUT) return [INPUT];
  if (!fs.existsSync(projectsDir)) {
    console.error(`No transcripts at ${projectsDir}.`);
    console.error(`Set CLAUDE_CONFIG_DIR, or pass --input <file.jsonl>.`);
    process.exit(1);
  }
  const out = [];
  const walk = (dir, depth = 0) => {
    if (depth > 3) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full, depth + 1);
      else if (entry.name.endsWith('.jsonl')) {
        try { out.push({ full, mtime: fs.statSync(full).mtimeMs }); } catch { /* skip */ }
      }
    }
  };
  walk(projectsDir);
  return out.sort((a, b) => b.mtime - a.mtime).slice(0, LIMIT).map(f => f.full);
}

const versions = new Map();
const contentBearing = new Set();
// --shape: field paths and value TYPES for one event type. Values are never printed, so
// the output is safe to paste anywhere. Added because the first --emit run redacted
// `attachment` payloads out of existence — the one thing worth seeing about a new type.
const shapeFields = new Map();
let shapeCount = 0;
function recordShape(obj, prefix = '') {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix + k;
    if (v && typeof v === 'object' && !Array.isArray(v)) { recordShape(v, key + '.'); continue; }
    const t = Array.isArray(v)
      ? `array[${v.length}]${v.length && typeof v[0] === 'object' ? ' of object' : ''}`
      : typeof v === 'string' ? `string(len ${v.length})` : typeof v;
    const entry = shapeFields.get(key) || { count: 0, types: new Set() };
    entry.count++; entry.types.add(t.replace(/len \d+/, 'len N'));
    shapeFields.set(key, entry);
  }
}
const eventTypes = new Map();
const blockTypes = new Map();
const userFlags = new Map();
const userFlagsTruthy = new Map();
const systemSubtypes = new Map();
const bump = (m, k) => m.set(k, (m.get(k) || 0) + 1);

let totalEvents = 0, totalFiles = 0, sessionIdOnLineOne = 0, missingTimestamps = 0;
const sample = [];

for (const file of collectFiles()) {
  let lines;
  try { lines = fs.readFileSync(file, 'utf-8').split('\n').filter(l => l.trim()); }
  catch { continue; }
  totalFiles++;

  lines.forEach((line, idx) => {
    let e;
    try { e = JSON.parse(line); } catch { return; }
    totalEvents++;
    if (idx === 0 && e.sessionId) sessionIdOnLineOne++;
    if (e.version) bump(versions, e.version);
    bump(eventTypes, e.type);
    if (e.message || (e.parentUuid && e.type !== 'system')) contentBearing.add(e.type);
    if (e.type === 'system' && e.subtype) bump(systemSubtypes, e.subtype);
    if ((e.type === 'user' || e.type === 'assistant') && e.message && !e.timestamp) missingTimestamps++;

    if (e.type === 'user' && e.message) {
      for (const [k, v] of Object.entries(e)) {
        if (!(/^is[A-Z]/.test(k) || k === 'permissionMode' || /^source[A-Z]/.test(k))) continue;
        bump(userFlags, k);
        // Presence is not the signal. `isSidechain: false` sits on nearly every user event,
        // so counting keys reported it as the most common flag in the file and meant
        // nothing. What matters for turn-boundary logic is how often a flag is TRUE.
        if (v) bump(userFlagsTruthy, k);
      }
    }
    const content = e.message?.content;
    if (Array.isArray(content)) for (const b of content) if (b?.type) bump(blockTypes, b.type);

    if (SHAPE && e.type === SHAPE) { shapeCount++; recordShape(e); }
    if (EMIT && sample.length < 400) sample.push(redact(e));
  });
}

/** Keep structure, flags, versions and block types. Discard every word. */
function redact(e) {
  const out = {};
  for (const [k, v] of Object.entries(e)) {
    if (k === 'message') continue;
    if (k === 'cwd') { out[k] = '/redacted/project'; continue; }
    if (k === 'gitBranch' || k === 'slug') { out[k] = 'redacted'; continue; }
    if (typeof v === 'object' && v !== null) {
      // Keep the shape, drop the values: a new event type is only diagnosable if you can
      // see what fields it carries. The first --emit run stripped `attachment` payloads
      // entirely, which hid the one thing worth knowing about them.
      out[k] = Array.isArray(v)
        ? [`[redacted array of ${v.length}]`]
        : Object.fromEntries(Object.keys(v).map(kk => [kk, `[${typeof v[kk]}]`]));
      continue;
    }
    out[k] = v;
  }
  if (e.message) {
    const m = { role: e.message.role };
    if (e.message.model) m.model = e.message.model;
    const c = e.message.content;
    if (typeof c === 'string') m.content = `[redacted ${c.length} chars]`;
    else if (Array.isArray(c)) {
      m.content = c.map(b => {
        const nb = { type: b.type };
        if (b.type === 'text') nb.text = `[redacted ${String(b.text ?? '').length} chars]`;
        if (b.type === 'thinking') nb.thinking = `[redacted ${String(b.thinking ?? '').length} chars]`;
        if (b.type === 'tool_use') { nb.name = b.name; nb.id = b.id; nb.input = { redacted: true }; }
        if (b.type === 'tool_result') { nb.tool_use_id = b.tool_use_id; nb.content = `[redacted ${String(b.content ?? '').length} chars]`; if (b.is_error) nb.is_error = true; }
        if (b.type === 'image') nb.source = { type: b.source?.type, media_type: b.source?.media_type, data: '[redacted]' };
        return nb;
      });
    }
    out.message = m;
  }
  return out;
}

const table = (m) => [...m.entries()].sort((a, b) => b[1] - a[1]).map(([k, v]) => `    ${String(k).padEnd(28)} ${v}`).join('\n') || '    (none)';
const unknown = (m, known) => [...m.keys()].filter(k => !known.has(k));

if (SHAPE) {
  console.log(`\nShape of "${SHAPE}" events — field names and value types only, no values.`);
  console.log(`Found ${shapeCount} across ${totalFiles} transcript(s).\n`);
  if (!shapeCount) {
    console.log('  (none found — check the type name against the survey output)\n');
  } else {
    for (const [field, { count, types }] of [...shapeFields.entries()].sort((a, b) => b[1].count - a[1].count)) {
      console.log(`    ${field.padEnd(38)} ${String(count).padEnd(6)} ${[...types].join(' | ')}`);
    }
    console.log('\n  Paste this output as-is. It contains no message content.\n');
  }
  process.exit(0);
}

console.log(`\nSurveyed ${totalFiles} transcript(s), ${totalEvents} events`);
console.log(`  source: ${INPUT ?? projectsDir}\n`);
console.log(`  Claude Code versions\n${table(versions)}\n`);
console.log(`  Event types\n${table(eventTypes)}\n`);
console.log(`  System subtypes\n${table(systemSubtypes)}\n`);
console.log(`  Content block types\n${table(blockTypes)}\n`);
const flagTable = () => [...userFlags.entries()].sort((a, b) => b[1] - a[1])
  .map(([k, v]) => `    ${k.padEnd(28)} present ${String(v).padEnd(6)} true ${userFlagsTruthy.get(k) || 0}`)
  .join('\n') || '    (none)';
console.log(`  User-event flags\n${flagTable()}\n`);
console.log(`  sessionId present on line 1: ${sessionIdOnLineOne}/${totalFiles} file(s)`);
console.log(`  conversation events missing a timestamp: ${missingTimestamps}\n`);

const newEvents = unknown(eventTypes, KNOWN_EVENT_TYPES);
const newBlocks = unknown(blockTypes, KNOWN_BLOCK_TYPES);
const newFlags  = unknown(userFlags, KNOWN_USER_FLAGS);

// Not every unknown event type matters. One that carries a message, or hangs off a
// conversation event via parentUuid, may hold content the import is dropping. One that
// carries only session bookkeeping does not.
const carriesContent = new Set();
for (const t of newEvents) if (contentBearing.has(t)) carriesContent.add(t);
const bookkeeping = newEvents.filter(t => !carriesContent.has(t));

if (newEvents.length || newBlocks.length || newFlags.length) {
  console.log('  ⚠ SHAPES THE PARSER DOES NOT KNOW ABOUT');
  if (carriesContent.size) {
    console.log(`    new event types WITH message or parent links: ${[...carriesContent].join(', ')}`);
    console.log(`      ^ these may carry content the import is silently dropping. Look first.`);
  }
  if (bookkeeping.length) console.log(`    new event types (session bookkeeping): ${bookkeeping.join(', ')}`);
  if (newBlocks.length) console.log(`    new block types:  ${newBlocks.join(', ')}`);
  if (newFlags.length)  console.log(`    new user flags:   ${newFlags.join(', ')}`);
  console.log('\n    A new user-event flag is the dangerous one: isHumanTurnBoundary requires');
  console.log('    permissionMode and rejects known injection flags, so an unknown flag on an');
  console.log('    otherwise-human-looking event is where a fabricated turn would come from.');
  console.log('    Add a case to turn-boundary-regression.test.ts before changing the parser.\n');
} else {
  console.log('  ✓ No unknown event types, block types or user flags.\n');
}

if (EMIT) {
  const version = [...versions.keys()].sort().pop() ?? 'unknown';
  const outPath = path.join('packages/server/src/__tests__/fixtures', `real-shapes-${version}.jsonl`);
  fs.writeFileSync(outPath, sample.map(e => JSON.stringify(e)).join('\n') + '\n', 'utf-8');
  console.log(`  Wrote ${outPath} (${sample.length} events, all text redacted).`);
  console.log(`  Next: add it to fixtures/provenance.json, bump lastReviewed, run the suite.\n`);
}

console.log('  When done, set lastReviewed in fixtures/provenance.json to today.\n');
