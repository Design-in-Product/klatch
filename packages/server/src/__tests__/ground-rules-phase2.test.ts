/**
 * Ground rules, phase 2 — the **storage half** (2026-11-16, Daedalus, STOP fire).
 *
 * Ruling: 2026-11-03 (`docs/operations/attention-rollup.md:319`). Scope:
 * `docs/ux/ground-rules-scope-2026-11-16.md`. Pre-registration, including the
 * declared divergence from the scope doc's two-store shape and the four cripples
 * these arms were written to be gradeable under:
 * `docs/research/ground-rules-phase2-2026-11-16/PRE-REG.md`.
 *
 * ## What carries load here
 *
 * Not "a preset round-trips". The arms that would fail under a *working-but-wrong*
 * implementation are:
 *
 *  - **The default is at most one, at the storage level.** Enforced by a partial
 *    unique index, so it holds against a writer that never calls
 *    `createGroundRulesPreset` — and the arm that claims it drives a **raw
 *    INSERT**, bypassing the write path, because an arm that goes through the
 *    write path measures the write path's `UPDATE … SET is_default = 0`, not the
 *    index.
 *  - **The raw column, not the mapped field.** Every claim about what is *stored*
 *    reads `SELECT … FROM ground_rules_presets` directly. This is this morning's
 *    finding applied prospectively: `rowToChannel`'s `row.ground_rules ||
 *    undefined` collapsed `''`, and 18 arms phrased on `channel.groundRules`
 *    stayed green under a cripple that stored the wrong thing.
 *  - **A blank body is refused, not stored.** Phase 1 spent its whole argument
 *    keeping "no rules" one state; a whitespace-only saved set puts the second
 *    empty state one table over, and phase 3 would offer it as a choice.
 *  - **The migration, not the fixture.** The table and the index are measured by
 *    running `applySchema` over a fresh database. `__tests__/setup.ts` hand-types
 *    its own DDL (the corpus question routed to Argus this afternoon); a fixture
 *    agreeing with itself says nothing about what the app does to `klatch.db`.
 */
import { describe, it, expect } from 'vitest';
import Database from 'better-sqlite3';
import './setup.js';
import { testDb } from './setup.js';
import { applySchema } from '../db/index.js';
import {
  createGroundRulesPreset,
  deleteGroundRulesPreset,
  getDefaultGroundRulesPreset,
  getGroundRulesPreset,
  listGroundRulesPresets,
} from '../db/queries.js';
import { createTestApp } from './app.js';

const RULES = 'Disagree in public. No consensus theatre.';
const OTHER_RULES = 'One question per turn. Name your uncertainty.';

const post = (body: unknown) =>
  createTestApp().request('/api/ground-rules/presets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

const list = () => createTestApp().request('/api/ground-rules/presets');

const del = (id: string) =>
  createTestApp().request(`/api/ground-rules/presets/${id}`, { method: 'DELETE' });

/** The stored row, read without the mapper. */
const rawRow = (id: string) =>
  testDb
    .prepare('SELECT id, name, body, is_default FROM ground_rules_presets WHERE id = ?')
    .get(id) as { id: string; name: string | null; body: string; is_default: number } | undefined;

describe('ground rules phase 2 — the migration', () => {
  it('the real migration creates ground_rules_presets with a nullable name and an is_default flag', () => {
    const db = new Database(':memory:');
    try {
      applySchema(db);
      const cols = db.prepare('PRAGMA table_info(ground_rules_presets)').all() as {
        name: string;
        type: string;
        notnull: number;
      }[];
      const byName = new Map(cols.map((c) => [c.name, c]));

      expect(byName.has('id')).toBe(true);
      // Nullable: an unnamed row is the "make these my default" gesture.
      expect(byName.get('name')!.notnull).toBe(0);
      // The body is the whole point of the row — NOT NULL, unlike the channel column.
      expect(byName.get('body')!.notnull).toBe(1);
      expect(byName.get('is_default')!.notnull).toBe(1);
      expect(byName.has('created_at')).toBe(true);
    } finally {
      db.close();
    }
  });

  it('the real migration creates the partial unique index on is_default', () => {
    const db = new Database(':memory:');
    try {
      applySchema(db);
      const idx = db
        .prepare(
          `SELECT name, sql FROM sqlite_master WHERE type = 'index' AND name = 'idx_ground_rules_presets_default'`
        )
        .get() as { name: string; sql: string } | undefined;

      expect(idx).toBeDefined();
      // Partial — `WHERE is_default = 1`. A plain UNIQUE(is_default) would allow
      // exactly one *non*-default row too, which forbids having two templates.
      expect(idx!.sql).toMatch(/is_default\s*=\s*1/);
      expect(idx!.sql.toUpperCase()).toContain('UNIQUE');
    } finally {
      db.close();
    }
  });

  it('applying the schema twice is a no-op', () => {
    const db = new Database(':memory:');
    try {
      applySchema(db);
      expect(() => applySchema(db)).not.toThrow();
      const tables = db
        .prepare(`SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'ground_rules_presets'`)
        .all();
      expect(tables).toHaveLength(1);
    } finally {
      db.close();
    }
  });
});

describe('ground rules phase 2 — storage', () => {
  it('an unnamed save stores the body and no name, read off the raw column', () => {
    const preset = createGroundRulesPreset(RULES);
    const row = rawRow(preset.id)!;

    expect(row.body).toBe(RULES);
    // NULL, not '': the same single-empty-state discipline phase 1's column has.
    expect(row.name).toBeNull();
    expect(row.is_default).toBe(0);
  });

  it('a named save stores the name, and the body is trimmed', () => {
    const preset = createGroundRulesPreset(`  ${RULES}  `, { name: '  Review klatch  ' });
    const row = rawRow(preset.id)!;

    expect(row.body).toBe(RULES);
    expect(row.name).toBe('Review klatch');
    // And the returned object agrees with the row it claims to describe.
    expect(preset.body).toBe(RULES);
    expect(preset.name).toBe('Review klatch');
  });

  it('makeDefault stores 1 in the column, not just true in the mapped object', () => {
    const preset = createGroundRulesPreset(RULES, { makeDefault: true });

    expect(rawRow(preset.id)!.is_default).toBe(1);
    expect(preset.isDefault).toBe(true);
    expect(getGroundRulesPreset(preset.id)!.isDefault).toBe(true);
  });

  it('isDefault is a boolean, not the raw number SQLite returns', () => {
    const preset = createGroundRulesPreset(RULES, { makeDefault: true });
    const read = getGroundRulesPreset(preset.id)!;

    // `=== true`, deliberately: a consumer writing `if (p.isDefault === true)`
    // against a raw 1 takes the wrong branch while the row says default.
    expect(read.isDefault).toBe(true);
    expect(listGroundRulesPresets()[0].isDefault).toBe(true);
    expect(createGroundRulesPreset(OTHER_RULES).isDefault).toBe(false);
  });

  it('saving a second default moves the designation — the old one is cleared, not duplicated', () => {
    const first = createGroundRulesPreset(RULES, { makeDefault: true });
    const second = createGroundRulesPreset(OTHER_RULES, { makeDefault: true });

    expect(rawRow(first.id)!.is_default).toBe(0);
    expect(rawRow(second.id)!.is_default).toBe(1);
    expect(getDefaultGroundRulesPreset()!.id).toBe(second.id);
    // Both sets survive — moving the default is not a delete.
    expect(listGroundRulesPresets()).toHaveLength(2);
  });

  it('two defaults cannot coexist at the storage level, measured through a raw INSERT', () => {
    // Deliberately NOT through createGroundRulesPreset. That function clears the
    // previous default itself, so driving it would measure the write path and
    // report green with no index at all. This is the arm the index exists for:
    // a hand-written INSERT in a script, an import path, or a writer that does
    // not exist yet.
    createGroundRulesPreset(RULES, { makeDefault: true });

    expect(() =>
      testDb
        .prepare(
          'INSERT INTO ground_rules_presets (id, name, body, is_default, created_at) VALUES (?, ?, ?, ?, ?)'
        )
        .run('smuggled', null, OTHER_RULES, 1, new Date().toISOString())
    ).toThrow();

    // And the same INSERT with is_default = 0 is fine — the index constrains the
    // designation, not the table.
    expect(() =>
      testDb
        .prepare(
          'INSERT INTO ground_rules_presets (id, name, body, is_default, created_at) VALUES (?, ?, ?, ?, ?)'
        )
        .run('ordinary', null, OTHER_RULES, 0, new Date().toISOString())
    ).not.toThrow();
  });

  it('many non-default presets coexist — the index is partial, not a singleton table', () => {
    createGroundRulesPreset(RULES, { name: 'a' });
    createGroundRulesPreset(OTHER_RULES, { name: 'b' });
    createGroundRulesPreset('Third set.', { name: 'c' });

    expect(listGroundRulesPresets()).toHaveLength(3);
    expect(getDefaultGroundRulesPreset()).toBeUndefined();
  });

  it('the list is default-first, then newest-first — one list with one member marked', () => {
    const older = createGroundRulesPreset(RULES, { name: 'older' });
    const newer = createGroundRulesPreset(OTHER_RULES, { name: 'newer' });
    const theDefault = createGroundRulesPreset('Default set.', { makeDefault: true });

    const ids = listGroundRulesPresets().map((p) => p.id);
    expect(ids[0]).toBe(theDefault.id);
    // `newer` and `older` are created in the same millisecond on a fast machine,
    // so only the default's position is asserted on order; membership is the rest
    // of the claim.
    expect(new Set(ids.slice(1))).toEqual(new Set([newer.id, older.id]));
  });

  it('deleting a preset reports whether there was one', () => {
    const preset = createGroundRulesPreset(RULES);

    expect(deleteGroundRulesPreset(preset.id)).toBe(true);
    expect(rawRow(preset.id)).toBeUndefined();
    expect(deleteGroundRulesPreset(preset.id)).toBe(false);
    expect(deleteGroundRulesPreset('never-existed')).toBe(false);
  });

  it('deleting the default leaves the slot free, not occupied by a tombstone', () => {
    const theDefault = createGroundRulesPreset(RULES, { makeDefault: true });
    deleteGroundRulesPreset(theDefault.id);

    expect(getDefaultGroundRulesPreset()).toBeUndefined();
    // And a new default can be saved — the index does not retain the deleted row.
    const next = createGroundRulesPreset(OTHER_RULES, { makeDefault: true });
    expect(getDefaultGroundRulesPreset()!.id).toBe(next.id);
  });
});

describe('ground rules phase 2 — the HTTP surface', () => {
  it('POST creates an unnamed preset and returns 201 with it', async () => {
    const res = await post({ body: RULES });
    expect(res.status).toBe(201);

    const created = await res.json();
    expect(created.body).toBe(RULES);
    expect(created.name).toBeUndefined();
    expect(created.isDefault).toBe(false);
    // The row, not the response echoing its own input.
    expect(rawRow(created.id)!.body).toBe(RULES);
  });

  it('POST with makeDefault stores the designation', async () => {
    const created = await (await post({ body: RULES, makeDefault: true })).json();

    expect(created.isDefault).toBe(true);
    expect(rawRow(created.id)!.is_default).toBe(1);
  });

  it('POST refuses a blank body with a 400 and stores nothing', async () => {
    for (const body of [undefined, '', '   ', '\n\t ']) {
      const res = await post(body === undefined ? {} : { body });
      expect(res.status).toBe(400);
      expect((await res.json()).error).toMatch(/required/i);
    }
    // The refusal is the whole point: nothing reached the table.
    expect(testDb.prepare('SELECT COUNT(*) AS n FROM ground_rules_presets').get()).toEqual({ n: 0 });
  });

  it('POST refuses a present-but-blank name rather than storing it unnamed', async () => {
    const res = await post({ body: RULES, name: '   ' });
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/name/i);
    expect(testDb.prepare('SELECT COUNT(*) AS n FROM ground_rules_presets').get()).toEqual({ n: 0 });
  });

  it('POST refuses a non-boolean makeDefault', async () => {
    const res = await post({ body: RULES, makeDefault: 'yes' });
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/makeDefault/);
  });

  it('POST refuses a malformed JSON body with a 400, not a 500', async () => {
    const res = await createTestApp().request('/api/ground-rules/presets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{not json',
    });
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/valid JSON/i);
  });

  it('GET returns every preset under one key, with the default first', async () => {
    const named = createGroundRulesPreset(RULES, { name: 'Review klatch' });
    const theDefault = createGroundRulesPreset(OTHER_RULES, { makeDefault: true });

    const body = await (await list()).json();
    // One key. Which preset is the default is in the list; publishing it twice
    // is how two spellings of one fact start disagreeing.
    expect(Object.keys(body)).toEqual(['presets']);
    expect(body.presets.map((p: { id: string }) => p.id)).toEqual([theDefault.id, named.id]);
    expect(body.presets[0].isDefault).toBe(true);
    expect(body.presets[1].name).toBe('Review klatch');
  });

  it('GET on an empty store returns an empty list, not a 404', async () => {
    const res = await list();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ presets: [] });
  });

  it('DELETE removes a preset, and 404s the second time', async () => {
    const preset = createGroundRulesPreset(RULES);

    const first = await del(preset.id);
    expect(first.status).toBe(200);
    expect(await first.json()).toEqual({ deleted: true });
    expect(rawRow(preset.id)).toBeUndefined();

    const second = await del(preset.id);
    expect(second.status).toBe(404);
    expect((await second.json()).error).toMatch(/not found/i);
  });

  it('the route is reachable through the shared mount list', async () => {
    // `mountApiRoutes` is the one list the server and the harness share. A router
    // added to `index.ts` alone is structurally unreachable from every test —
    // the Round 218 defect — and this arm is what notices it for this router.
    expect((await list()).status).toBe(200);
  });
});
