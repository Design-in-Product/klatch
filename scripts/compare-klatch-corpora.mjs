#!/usr/bin/env node
/**
 * compare-klatch-corpora.mjs — read-only comparison of two klatch DBs on the axes
 * that decide MAXT-04 corpus selection, plus a lineage test.
 *
 * Companion to inspect-klatch-db.mjs, which censuses DBs one at a time. This one
 * answers the two questions a per-DB census cannot:
 *
 *   1. MAXT-eligible population. Not "how many channels" but "how many *imported*
 *      channels hold enough accumulated history to carry into a klatch". Empty and
 *      near-empty channels inflate every headline count and are worthless to a
 *      continuity test, so they are excluded rather than averaged in.
 *   2. Lineage. Whether B is descended from A — measured by `messages.original_id`
 *      overlap (the source-conversation identity written at import) and by channel
 *      name overlap. Two DBs sharing no original_id are disjoint corpora, not two
 *      points on one decay curve.
 *
 * Same safety properties as inspect-klatch-db.mjs, by construction:
 *   - both DBs opened { readonly: true, fileMustExist: true }. Read-only applies to the
 *     database, not the directory: SQLite creates `-wal`/`-shm` sidecars beside a
 *     WAL-mode DB even on a readonly connection (measured 2026-08-12). Both gitignored.
 *   - never runs initDb / migrations
 *   - every column probed with PRAGMA table_info before use (these DBs span
 *     several schema eras)
 *   - selects no message content; channel names only, suppressible with --no-names
 *
 * Usage:
 *   node scripts/compare-klatch-corpora.mjs <dbA> <dbB>
 *   node scripts/compare-klatch-corpora.mjs --min=20 --no-names <dbA> <dbB>
 *
 * Must be run from a checkout with node_modules (it imports better-sqlite3 by
 * bare specifier, so Node resolves it from the nearest node_modules — a bare
 * clone without an install will fail here, as Pard found on 2026-08-12).
 */

import Database from 'better-sqlite3'

const args = process.argv.slice(2)
const showNames = !args.includes('--no-names')
const minArg = args.find((a) => a.startsWith('--min='))
const MIN = minArg ? Number(minArg.split('=')[1]) : 20
const paths = args.filter((a) => !a.startsWith('--'))

if (paths.length !== 2) {
  console.error('usage: node scripts/compare-klatch-corpora.mjs [--min=N] [--no-names] <dbA> <dbB>')
  process.exit(1)
}

const open = (p) => new Database(p, { readonly: true, fileMustExist: true })

/** Columns actually present, so a March-vintage DB reports rather than throws. */
function cols(db, table) {
  try {
    return new Set(db.prepare(`PRAGMA table_info(${table})`).all().map((r) => r.name))
  } catch {
    return new Set()
  }
}

function eligible(db) {
  const cc = cols(db, 'channels')
  if (!cc.has('source')) return null
  const rows = db
    .prepare(
      `SELECT c.name AS name, c.source AS src, COUNT(m.id) AS n
         FROM channels c LEFT JOIN messages m ON m.channel_id = c.id
        WHERE c.source IS NOT NULL AND c.source != 'native'
        GROUP BY c.id HAVING n >= ? ORDER BY n DESC`
    )
    .all(MIN)
  const bySource = {}
  for (const r of rows) bySource[r.src] = (bySource[r.src] || 0) + 1
  return { rows, bySource, msgs: rows.reduce((a, r) => a + r.n, 0) }
}

function originalIds(db) {
  if (!cols(db, 'messages').has('original_id')) return null
  return new Set(
    db
      .prepare(`SELECT DISTINCT original_id FROM messages WHERE original_id IS NOT NULL`)
      .all()
      .map((r) => r.original_id)
  )
}

const channelNames = (db) =>
  new Set(db.prepare(`SELECT DISTINCT name FROM channels`).all().map((r) => r.name))

const dbs = paths.map(open)

console.log(`\n=== MAXT-eligible population (imported, >= ${MIN} messages) ===\n`)
const elig = dbs.map((db, i) => {
  const e = eligible(db)
  if (!e) {
    console.log(`${paths[i]}\n  no channels.source column — pre-import schema, nothing eligible\n`)
    return null
  }
  console.log(`${paths[i]}`)
  console.log(`  eligible channels : ${e.rows.length}`)
  console.log(`  messages in them  : ${e.msgs}`)
  console.log(`  by source         : ${JSON.stringify(e.bySource)}`)
  if (e.rows.length) {
    const depths = e.rows.map((r) => r.n)
    console.log(
      `  depth             : max ${depths[0]} · median ${depths[Math.floor(depths.length / 2)]} · min ${depths[depths.length - 1]}`
    )
    if (showNames) {
      console.log(`  deepest eligible  :`)
      for (const r of e.rows.slice(0, 8)) console.log(`      ${String(r.n).padStart(4)}  ${r.name}  [${r.src}]`)
    }
  }
  console.log()
  return e
})

console.log(`=== Lineage ===\n`)
const [ia, ib] = dbs.map(originalIds)
if (ia && ib) {
  let overlap = 0
  for (const id of ib) if (ia.has(id)) overlap++
  console.log(`original_id  A: ${ia.size} distinct · B: ${ib.size} distinct · shared: ${overlap}`)
  console.log(
    overlap === 0
      ? `  → disjoint import sets. B is not a re-import or remnant of A.`
      : `  → ${overlap} source conversations appear in both.`
  )
} else {
  console.log(`original_id  unavailable (pre-import schema in at least one DB)`)
}

const [na, nb] = dbs.map(channelNames)
const shared = [...nb].filter((n) => na.has(n))
console.log(`\nchannel name A: ${na.size} · B: ${nb.size} · shared: ${shared.length}`)
if (shared.length && showNames) for (const n of shared.slice(0, 15)) console.log(`      ${n}`)
console.log()

for (const db of dbs) db.close()
