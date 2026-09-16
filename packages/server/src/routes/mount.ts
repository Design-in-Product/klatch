import type { Hono } from 'hono';
import { channelRoutes } from './channels.js';
import { messageRoutes } from './messages.js';
import { entityRoutes } from './entities.js';
import { importRoutes } from './import.js';
import { projectRoutes } from './projects.js';
import { modelRoutes } from './models.js';
import { fileRoutes } from './files.js';
import { aaxtRoutes } from './aaxt.js';
import { exportRoutes } from './export.js';

/**
 * The API mount list — **one list, used by the real server and by the tests.**
 *
 * ## Why this file exists
 *
 * Until Round 218 there were two mount lists. `index.ts` mounted nine routers;
 * `__tests__/app.ts`'s `createTestApp()` mounted five. The four it omitted —
 * `modelRoutes`, `fileRoutes`, `aaxtRoutes`, `exportRoutes` — were not missing
 * on purpose. Nobody decided to leave them out; the harness list was written
 * once and then never grew alongside the server's.
 *
 * What that costs is specific and was measured. `POST /channels/:id/files` and
 * `POST /projects/:id/files` answered malformed multipart bodies with
 * `500 · text/plain` from the day they shipped until `c46b14a1` (Round 216),
 * and **no test in the suite could have noticed**, because no test could reach
 * them. The suite was 1850 tests green across that entire window. Test count is
 * not a coverage signal when the harness omits a router — the route is
 * structurally unreachable, and an unreachable route produces no red.
 *
 * (Narrower than it first reads, and worth stating accurately: the *query*
 * endpoints in `files.ts` were driven — `round14-file-domain-model.test.ts:243`
 * hits `GET /api/channels/default/files`. It did that by building its own local
 * `Hono()` and mounting `fileRoutes` on it, which `round14`, `round15`, `round16`
 * and `round216` each do separately. Four private copies of the harness is the
 * same gap wearing a workaround: the *upload* handlers, which those local apps
 * never POST to, are the ones that went unreached.)
 *
 * ## Why a shared function and not a test that diffs two lists
 *
 * A diff test would have caught this. It would also have been one more thing
 * that has to be remembered, and the failure mode here was never a lapse of
 * attention — it was that nothing at the point of action could say no. Adding a
 * router to a server whose test harness has its own list is an edit that *is*
 * complete and *is* correct on its own terms; there is no moment at which it
 * looks wrong.
 *
 * So there is no second list to drift. `mountApiRoutes` is the list. Add a
 * router here and the tests see it in the same call, in the same order, or the
 * server does not get it either.
 *
 * ## Order is part of the contract
 *
 * Hono resolves first-match, so two routers that both claim a path resolve by
 * mount order. Keeping the tests on this exact sequence is most of the point:
 * a test app that mounts the same routers in a different order is a different
 * server. Do not sort this list.
 *
 * Deliberately not included: `cors()`, `getDb()` and `serve()` stay in
 * `index.ts`. This function mounts routes and does nothing else, so importing
 * it from a test cannot start a listener or touch a real database.
 */
export function mountApiRoutes(app: Hono): Hono {
  app.route('/api', channelRoutes);
  app.route('/api', messageRoutes);
  app.route('/api', entityRoutes);
  app.route('/api', importRoutes);
  app.route('/api/projects', projectRoutes);
  app.route('/api', modelRoutes);
  app.route('/api', fileRoutes);
  app.route('/api', aaxtRoutes);
  app.route('/api', exportRoutes);
  return app;
}
