import { Hono } from 'hono';
import { mountApiRoutes } from '../routes/mount.js';

/**
 * Build a Hono app for testing (no server.listen, no dotenv, no cors).
 *
 * The router list is **not** maintained here. `mountApiRoutes` is the same
 * function `index.ts` calls, so this app mounts the same nine routers in the
 * same order as the running server — read that file's docstring for why there
 * is only one list now.
 *
 * Before Round 218 this function kept its own list of five, and the four it
 * omitted were unreachable from every test. If you are adding a router, add it
 * in `routes/mount.ts`; there is nothing to add here.
 */
export function createTestApp(): Hono {
  return mountApiRoutes(new Hono());
}
