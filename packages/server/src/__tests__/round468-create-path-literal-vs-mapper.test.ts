/**
 * round468 — **a writer's hand-built literal is a second spelling of the row.**
 *
 * Unit: `docs/research/unit-468createlit-2026-11-17/` (pre-registration, census
 * arm A and its own corrected drive, RESULTS).
 *
 * ## What carries load here
 *
 * Not "a create round-trips". Every one of these arms compares **the object the
 * writer returned** against **the object a read of the same row returns**, and
 * the two go through different code: the writer builds a literal from its own
 * arguments, the reader maps the stored row through `rowTo*`. Any normalisation
 * the mapper performs (`|| undefined`, `|| ''`, `=== 1`, `|| DEFAULT_MODEL`) is
 * absent from the writer's spelling, so the same row can be published two ways.
 *
 * That is not only a value-disagreement. It is why 11/16's C4 cripple
 * (`rowToGroundRulesPreset` returning the raw column) reddened three read arms
 * and left the `POST … makeDefault` arm green: **a mapper defect cannot reach a
 * create response that never calls the mapper.** The arms below are the ones a
 * mapper cripple must be able to redden.
 *
 * Census (arm A, drive 2): of **13** exported writers in `queries.ts`, **12**
 * return a hand-built literal and **0** return through a mapper; **10** of the 12
 * have a sibling mapper for their own return type. Those 10 are the population,
 * and all 10 are driven here — one arm each, named, so a missing member is
 * visible rather than absorbed.
 *
 * `toEqual`, not `toStrictEqual`, is deliberate: a key absent and a key present
 * holding `undefined` serialise identically over the API, so that difference is
 * not the defect under study. A difference in **value** is.
 */
import { describe, it, expect } from 'vitest';
import './setup.js';
import { testDb } from './setup.js';
import {
  createChannel,
  getChannel,
  createGroundRulesPreset,
  getGroundRulesPreset,
  insertMessage,
  getMessage,
  createEntity,
  getEntity,
  createProject,
  getProject,
  createFileArtifact,
  createCarriedContextArtifact,
  createToolUseArtifact,
  getMessageArtifacts,
  createFile,
  getFile,
  createFileRef,
  getFileRefs,
} from '../db/queries.js';
import { DEFAULT_MODEL, ENTITY_COLORS } from '@klatch/shared';
import type { ModelId } from '@klatch/shared';

describe('round468 — the writer\'s return equals a read of the row it wrote', () => {
  it('createChannel: whitespace ground rules', () => {
    const created = createChannel('c468', 'prompt', undefined, undefined, undefined, undefined, '   ');
    expect(created).toEqual(getChannel(created.id));
  });

  it('createGroundRulesPreset: unnamed default, untrimmed body', () => {
    const created = createGroundRulesPreset('  be brief  ', { makeDefault: true });
    expect(created).toEqual(getGroundRulesPreset(created.id));
  });

  it('insertMessage: empty model and empty entityId', () => {
    // `'' as ModelId` is the shape a route passes when a caller sends a blank
    // field rather than omitting it — the INSERT collapses it to NULL
    // (`model || null`), so the stored state is "no model" either way.
    const created = insertMessage('default', 'user', 'hi', 'complete', '' as ModelId, '');
    expect(created).toEqual(getMessage(created.id));
  });

  it('createEntity: empty handle', () => {
    const created = createEntity('E468', DEFAULT_MODEL, 'sp', ENTITY_COLORS[0], '');
    expect(created).toEqual(getEntity(created.id));
  });

  it('createProject: empty instructions and memory', () => {
    const created = createProject('P468', '', 'native', {}, '');
    expect(created).toEqual(getProject(created.id));
  });

  it('createFileArtifact: all fields populated', () => {
    const msg = insertMessage('default', 'assistant', 'a', 'complete');
    const created = createFileArtifact(msg.id, 'f.txt', 'text/plain', 12, 'store/key');
    const read = getMessageArtifacts(msg.id).find((a) => a.id === created.id);
    expect(created).toEqual(read);
  });

  it('createCarriedContextArtifact: counts', () => {
    const msg = insertMessage('default', 'assistant', 'a', 'complete');
    const created = createCarriedContextArtifact(msg.id, {
      roomCount: 2,
      messageCount: 7,
      omittedCount: 0,
      hasOlderHistory: false,
    });
    const read = getMessageArtifacts(msg.id).find((a) => a.id === created.id);
    expect(created).toEqual(read);
  });

  it('createToolUseArtifact: empty inputSummary', () => {
    const msg = insertMessage('default', 'assistant', 'a', 'complete');
    const created = createToolUseArtifact(msg.id, 'recall', '');
    const read = getMessageArtifacts(msg.id).find((a) => a.id === created.id);
    expect(created).toEqual(read);
  });

  it('createFile: empty createdBy', () => {
    const created = createFile('f.txt', 'text/plain', 12, 'store/key-468', '');
    expect(created).toEqual(getFile(created.id));
  });

  it('createFileRef: empty addedBy', () => {
    const file = createFile('g.txt', 'text/plain', 12, 'store/key-468b');
    const created = createFileRef(file.id, 'channel', 'default', 'pinned', '');
    const read = getFileRefs(file.id).find((r) => r.id === created.id);
    expect(created).toEqual(read);
  });
});

/**
 * ## Why a second block exists, and why the first one alone was not enough
 *
 * The equality arms above were driven **four ways** before this block was
 * written (`unit-468createlit-2026-11-17/RESULTS.md`, legs A–D): cured tree ±
 * a cripple on `rowToFile`'s `createdBy: row.created_by || undefined`, and
 * pre-cure tree ± the same cripple. Failing-test counts: **0, 0, 4, 4**. The
 * cripple reddened **nothing, in either tree**.
 *
 * Post-cure that is structural, not luck: `expect(created).toEqual(read)` now
 * compares **two readings that share the mapper**, so a defect inside the mapper
 * moves both sides equally and the difference is invariant. The arm those four
 * legs grade is "a writer stopped using the mapper" — a real regression guard for
 * the idiom this unit removed, and *not* a mapper grader.
 *
 * Pre-cure the same cripple was invisible for a different reason: those four arms
 * were **already red**, so they had no spare signal to carry a second defect.
 *
 * These arms grade the mapper on the create path, by comparing the writer's
 * return against the **raw column** with the normalisation written out as a
 * literal expectation. Each one names what is stored *and* what is published, so
 * a cripple on either side has somewhere to land. This is 11/16's C4 finding
 * discharged: C4 crippled `rowToGroundRulesPreset` and left `POST … makeDefault`
 * green, and the `isDefault` arm below is the one that would have caught it.
 */
describe('round468 — the writer publishes the normalised form of the stored column', () => {
  it('createGroundRulesPreset: is_default stores 1, isDefault publishes true', () => {
    const created = createGroundRulesPreset('be brief', { makeDefault: true });
    const raw = testDb
      .prepare('SELECT is_default, name FROM ground_rules_presets WHERE id = ?')
      .get(created.id) as any;
    expect(raw.is_default).toBe(1);
    expect(created.isDefault).toBe(true);
    expect(raw.name).toBeNull();
    expect(created.name).toBeUndefined();
  });

  it('createFile: created_by stores NULL, createdBy publishes undefined', () => {
    const created = createFile('h.txt', 'text/plain', 3, 'store/key-468c', '');
    const raw = testDb.prepare('SELECT created_by FROM files WHERE id = ?').get(created.id) as any;
    expect(raw.created_by).toBeNull();
    expect(created.createdBy).toBeUndefined();
  });

  it('createFileRef: added_by stores NULL, addedBy publishes undefined', () => {
    const file = createFile('i.txt', 'text/plain', 3, 'store/key-468d');
    const created = createFileRef(file.id, 'channel', 'default', 'pinned', '');
    const raw = testDb.prepare('SELECT added_by FROM file_refs WHERE id = ?').get(created.id) as any;
    expect(raw.added_by).toBeNull();
    expect(created.addedBy).toBeUndefined();
  });

  it('insertMessage: model and entity_id store NULL, both publish undefined', () => {
    const created = insertMessage('default', 'user', 'hi', 'complete', '' as ModelId, '');
    const raw = testDb
      .prepare('SELECT model, entity_id FROM messages WHERE id = ?')
      .get(created.id) as any;
    expect(raw.model).toBeNull();
    expect(raw.entity_id).toBeNull();
    expect(created.model).toBeUndefined();
    expect(created.entityId).toBeUndefined();
  });

  it('createToolUseArtifact: input_summary stores the empty string, inputSummary publishes undefined', () => {
    // The other sub-mechanism. Here the INSERT does **not** collapse — '' is
    // stored as '' — and `rowToArtifact`'s `|| undefined` is the whole of the
    // normalisation. The raw assertion is what distinguishes the two, and is why
    // a cure applied only at the INSERT side would have been reported as
    // complete while this member still disagreed.
    const msg = insertMessage('default', 'assistant', 'a', 'complete');
    const created = createToolUseArtifact(msg.id, 'recall', '');
    const raw = testDb
      .prepare('SELECT input_summary FROM message_artifacts WHERE id = ?')
      .get(created.id) as any;
    expect(raw.input_summary).toBe('');
    expect(created.inputSummary).toBeUndefined();
  });
});
