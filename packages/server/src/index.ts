import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Walk up from this file to find .env at the monorepo root
const __dirname = path.dirname(fileURLToPath(import.meta.url));
function findEnv(dir: string): string | undefined {
  const candidate = path.join(dir, '.env');
  if (fs.existsSync(candidate)) return candidate;
  const parent = path.dirname(dir);
  if (parent === dir) return undefined; // reached filesystem root
  return findEnv(parent);
}
// A PORT handed to us by whoever spawned us is read HERE, before the override
// below can replace it. `override: true` means a `PORT` line in `.env` beats the
// environment: measured 2026-09-22, a child spawned with PORT=54029 and PORT=9999
// in `.env` reads 9999 afterwards. `.env` carries no PORT today (only
// ANTHROPIC_API_KEY), so this changes nothing now — it keeps an explicit caller
// winning if one is ever added, which is the whole point of the variable.
const portFromCaller = process.env.PORT;
// Same capture, same reason, for the database path. `db/index.ts` reads this out
// of the environment rather than receiving it as an argument, so the channel back
// to it is `process.env` — restored below, after dotenv has had its say.
const dbFromCaller = process.env.KLATCH_DB;

// override: true because Claude for Mac sets ANTHROPIC_API_KEY="" in the
// environment, and dotenv's default is to not overwrite existing vars.
dotenv.config({ path: findEnv(__dirname), override: true });
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serve } from '@hono/node-server';
import { mountApiRoutes } from './routes/mount.js';
import { getDb } from './db/index.js';
import { fromEnv, resolvePort } from './port.js';

const app = new Hono();

app.use('/*', cors());
// The mount list lives in `routes/mount.ts` so the test harness uses this exact
// list, in this exact order, rather than a second copy of it. See that file.
mountApiRoutes(app);

// Precedence: a PORT from whoever spawned us, then one out of `.env`, then 3001.
// See `port.ts` for what the lever is for, and the note above `dotenv.config()`
// for why the caller's value had to be captured before this line could use it.
//
// Resolved BEFORE `getDb()`, not after: getDb() runs initSchema() and
// runMigrations(), so it writes. A misconfigured PORT must not migrate klatch.db
// on its way to failing.
const port = resolvePort(fromEnv(portFromCaller) ?? fromEnv(process.env.PORT));

// Same precedence for the database: a KLATCH_DB from whoever spawned us, then one
// out of `.env`. `override: true` means dotenv has already clobbered the caller's
// value by this point, so put it back before anything opens the database. Until
// Round 253 this was moot in both directions — `db/index.ts` resolved its path at
// module scope, i.e. before line 25 ran, so `.env` could not reach it and the
// caller always won by accident. Now that `.env` works, the accident has to
// become a decision.
if (fromEnv(dbFromCaller) !== undefined) process.env.KLATCH_DB = dbFromCaller;

// Initialize database on startup. Resolves KLATCH_DB when called, not when
// imported — see `dbPath.ts`.
getDb();

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`Klatch server running on http://localhost:${info.port}`);
});
