import { Hono } from 'hono';
import {
  createGroundRulesPreset,
  deleteGroundRulesPreset,
  listGroundRulesPresets,
} from '../db/queries.js';
import { readJsonBody } from './json-body.js';

/**
 * Saved ground-rules sets — the server half of **phase 2** of the 2026-11-03
 * ground-rules ruling (`docs/operations/attention-rollup.md:319`), scoped in
 * `docs/ux/ground-rules-scope-2026-11-16.md`.
 *
 * Phase 1 shipped the field itself (`channels.ground_rules`, the klatch-creation
 * textarea, the layer-4a prompt part). This is the store that phase 2's
 * save-on-submit gesture writes and phase 3's offer-previous-rules reads.
 *
 * **Zero callers today, and that is named rather than hidden.** The submit-time
 * prompt ("save these as your default?" / "name this template") and the
 * creation-time picker are client work and stay Iris's; this is the surface they
 * code against, deliberately landed first so neither is waiting on a server.
 * Same shape as `GET /entities/:id/delete-preview` this morning: the endpoint is
 * one fire old, has no caller, and its shape is offered as changeable.
 *
 * **Not built, so nobody has to infer it from the absence:** re-designating an
 * existing preset as the default after the fact (the ruling asks for
 * save-as-default on submit and offer-on-next-klatch, not a manager), and dedup
 * (saving the same body twice makes two rows).
 */
const app = new Hono();

app.get('/ground-rules/presets', (c) => {
  // One key, not `{ presets, default }`. Which preset is the default is already
  // in the list, and publishing it twice is how two spellings of one fact start
  // disagreeing.
  return c.json({ presets: listGroundRulesPresets() });
});

app.post('/ground-rules/presets', async (c) => {
  const body = await readJsonBody<{ body?: string; name?: string; makeDefault?: boolean }>(c);

  // A blank preset is the one thing this store must not hold. Phase 1 spent its
  // whole argument keeping "the user wrote no rules" a single state (blank in,
  // NULL stored); a whitespace-only *saved set* would reintroduce the second
  // empty state one table over, and phase 3 would offer it as a choice.
  if (!body.body?.trim()) {
    return c.json({ error: 'Ground rules body is required' }, 400);
  }

  // A `name` key present but blank is refused rather than quietly stored as an
  // unnamed save: the caller asked for a named template, and silently dropping
  // the name loses the request instead of reporting it.
  if (body.name !== undefined && !body.name.trim()) {
    return c.json({ error: 'name must not be blank — omit it to save an unnamed default' }, 400);
  }

  if (body.makeDefault !== undefined && typeof body.makeDefault !== 'boolean') {
    return c.json({ error: 'makeDefault must be a boolean' }, 400);
  }

  const preset = createGroundRulesPreset(body.body, {
    name: body.name,
    makeDefault: body.makeDefault,
  });
  return c.json(preset, 201);
});

app.delete('/ground-rules/presets/:id', (c) => {
  const deleted = deleteGroundRulesPreset(c.req.param('id'));
  if (!deleted) {
    return c.json({ error: 'Ground rules preset not found' }, 404);
  }
  return c.json({ deleted: true });
});

export { app as groundRulesRoutes };
