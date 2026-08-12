#!/usr/bin/env node
/**
 * inspect-klatch-db.mjs — read-only structural census of one or more klatch DBs.
 *
 * Written 2026-08-12 by Theseus to settle "which of the inbound DBs is canonical
 * for MAXT-04 seeding" without reading a single message body.
 *
 * Design constraints, deliberate:
 *   - Opens every DB `readonly: true`. It cannot mutate xian's conversation history.
 *   - Never runs initDb / migrations. These DBs span at least four schema eras
 *     (Mar/Apr/May), so every column is probed with PRAGMA table_info first and
 *     skipped if absent, rather than assumed.
 *   - Emits counts, names, sources, timestamps and per-channel message *totals*.
 *     It does not select `messages.content` or `message_artifacts.content`.
 *     Channel names are emitted because the canonicity call turns on them; if
 *     even that is too much, run with --no-names.
 *
 * Usage:
 *   node scripts/inspect-klatch-db.mjs ~/klatch-inbound/dbs/*.db
 *   node scripts/inspect-klatch-db.mjs --no-names path/to/a.db path/to/b.db
 */

import Database from 'better-sqlite3'

const args = process.argv.slice(2)
const showNames = !args.includes('--no-names')
const paths = args.filter((a) => !a.startsWith('--'))

if (paths.length === 0) {
  console.error('usage: node scripts/inspect-klatch-db.mjs [--no-names] <db> [<db>...]')
  process.exit(1)
}

/** Columns present on a table, or null if the table itself is absent. */
function columnsOf(db, table) {
  const rows = db.prepare(`PRAGMA table_info(${table})`).all()
  return rows.length ? new Set(rows.map((r) => r.name)) : null
}

function count(db, sql) {
  try {
    return db.prepare(sql).get()?.n ?? null
  } catch {
    return null
  }
}

function inspect(path) {
  console.log(`\n${'='.repeat(72)}\n${path}\n${'='.repeat(72)}`)

  let db
  try {
    db = new Database(path, { readonly: true, fileMustExist: true })
  } catch (err) {
    console.log(`  UNREADABLE: ${err.message}`)
    return
  }

  const tables = db
    .prepare(`SELECT name FROM sqlite_master WHERE type='table' ORDER BY name`)
    .all()
    .map((r) => r.name)
  console.log(`\ntables (${tables.length}): ${tables.join(', ') || '(none)'}`)
  if (tables.length === 0) {
    db.close()
    return
  }

  const chanCols = columnsOf(db, 'channels')
  const msgCols = columnsOf(db, 'messages')

  // --- schema era fingerprint -------------------------------------------------
  // Which post-March columns exist tells us roughly when this file was last
  // migrated, independent of any timestamp inside it.
  const era = []
  for (const [table, cols, want] of [
    ['channels', chanCols, ['source', 'source_metadata', 'project_id', 'mode']],
    ['messages', msgCols, ['original_timestamp', 'original_id', 'entity_id', 'status', 'stop_reason']],
  ]) {
    if (!cols) continue
    for (const c of want) era.push(`${table}.${c}=${cols.has(c) ? 'yes' : 'NO'}`)
  }
  console.log(`schema:  ${era.join('  ')}`)

  // --- headline counts --------------------------------------------------------
  console.log('\ncounts:')
  for (const [label, sql] of [
    ['channels', 'SELECT COUNT(*) n FROM channels'],
    ['messages', 'SELECT COUNT(*) n FROM messages'],
    ['entities', 'SELECT COUNT(*) n FROM entities'],
    ['channel_entities', 'SELECT COUNT(*) n FROM channel_entities'],
    ['projects', 'SELECT COUNT(*) n FROM projects'],
    ['message_artifacts', 'SELECT COUNT(*) n FROM message_artifacts'],
  ]) {
    const n = count(db, sql)
    if (n !== null) console.log(`  ${label.padEnd(18)} ${n}`)
  }

  // The number Pard's table could not show: how many channels hold nothing.
  const empty = count(
    db,
    'SELECT COUNT(*) n FROM channels c WHERE NOT EXISTS (SELECT 1 FROM messages m WHERE m.channel_id = c.id)'
  )
  if (empty !== null) console.log(`  ${'channels EMPTY'.padEnd(18)} ${empty}`)

  // --- provenance -------------------------------------------------------------
  if (chanCols?.has('source')) {
    console.log('\nchannels by source:')
    for (const r of db
      .prepare(`SELECT COALESCE(source,'(null)') s, COUNT(*) n FROM channels GROUP BY s ORDER BY n DESC`)
      .all())
      console.log(`  ${String(r.s).padEnd(18)} ${r.n}`)
  } else {
    console.log('\nchannels by source: (no `source` column — pre-import-era schema)')
  }

  // --- "newest" disambiguated -------------------------------------------------
  // Pard's inbound table reported one "Newest" per DB. created_at (when Klatch
  // wrote the row) and original_timestamp (when the imported conversation
  // happened) answer completely different questions; report both.
  console.log('\ntimestamps:')
  if (msgCols?.has('created_at')) {
    const r = db.prepare('SELECT MIN(created_at) lo, MAX(created_at) hi FROM messages').get()
    console.log(`  messages.created_at         ${r.lo} .. ${r.hi}`)
  }
  if (msgCols?.has('original_timestamp')) {
    const r = db
      .prepare('SELECT MIN(original_timestamp) lo, MAX(original_timestamp) hi FROM messages WHERE original_timestamp IS NOT NULL')
      .get()
    const n = count(db, 'SELECT COUNT(*) n FROM messages WHERE original_timestamp IS NOT NULL')
    console.log(`  messages.original_timestamp ${r.lo} .. ${r.hi}   (${n} imported msgs)`)
  }
  if (chanCols?.has('created_at')) {
    const r = db.prepare('SELECT MIN(created_at) lo, MAX(created_at) hi FROM channels').get()
    console.log(`  channels.created_at         ${r.lo} .. ${r.hi}`)
  }

  // --- depth distribution -----------------------------------------------------
  // The canonicity call turns on depth-per-channel, not channel count: a
  // continuity test needs conversations with accumulated history, and an average
  // hides whether that history is spread thin or concentrated.
  const dist = db
    .prepare(
      `SELECT n, COUNT(*) c FROM (
         SELECT c.id, COUNT(m.id) n FROM channels c
         LEFT JOIN messages m ON m.channel_id = c.id GROUP BY c.id
       ) GROUP BY n ORDER BY n`
    )
    .all()
  const bucket = { '0': 0, '1-4': 0, '5-19': 0, '20-99': 0, '100+': 0 }
  for (const { n, c } of dist) {
    if (n === 0) bucket['0'] += c
    else if (n < 5) bucket['1-4'] += c
    else if (n < 20) bucket['5-19'] += c
    else if (n < 100) bucket['20-99'] += c
    else bucket['100+'] += c
  }
  console.log('\nchannels by message count:')
  for (const [k, v] of Object.entries(bucket)) console.log(`  ${k.padEnd(18)} ${v}`)

  // --- deepest channels -------------------------------------------------------
  if (showNames) {
    const sel = chanCols?.has('source') ? 'c.name, c.source' : 'c.name, NULL AS source'
    const top = db
      .prepare(
        `SELECT ${sel}, COUNT(m.id) n FROM channels c
         LEFT JOIN messages m ON m.channel_id = c.id
         GROUP BY c.id ORDER BY n DESC LIMIT 15`
      )
      .all()
    console.log('\ndeepest 15 channels:')
    for (const r of top) console.log(`  ${String(r.n).padStart(5)}  ${r.name}  [${r.source ?? '-'}]`)
  }

  // --- entity binding ---------------------------------------------------------
  // Whether imports minted real entities or all collapsed onto the default one
  // is exactly what increment #1 changed; it decides whether a corpus can
  // exercise the guess+confirm path or only the legacy path.
  if (columnsOf(db, 'entities')) {
    const ents = db
      .prepare(
        `SELECT e.id, e.name, COUNT(ce.channel_id) n FROM entities e
         LEFT JOIN channel_entities ce ON ce.entity_id = e.id
         GROUP BY e.id ORDER BY n DESC LIMIT 10`
      )
      .all()
    console.log('\nentities by channels bound:')
    for (const r of ents) console.log(`  ${String(r.n).padStart(5)}  ${r.name}  (${r.id})`)
  }

  db.close()
}

for (const p of paths) {
  try {
    inspect(p)
  } catch (err) {
    console.log(`\n${p}\n  FAILED: ${err.stack}`)
  }
}
