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
// override: true because Claude for Mac sets ANTHROPIC_API_KEY="" in the
// environment, and dotenv's default is to not overwrite existing vars.
dotenv.config({ path: findEnv(__dirname), override: true });
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serve } from '@hono/node-server';
import { messageRoutes } from './routes/messages.js';
import { channelRoutes } from './routes/channels.js';
import { entityRoutes } from './routes/entities.js';
import { importRoutes } from './routes/import.js';
import { getDb } from './db/index.js';

const app = new Hono();

app.use('/*', cors());
app.route('/api', channelRoutes);
app.route('/api', messageRoutes);
app.route('/api', entityRoutes);
app.route('/api', importRoutes);

// Initialize database on startup
getDb();

const port = 3001;
serve({ fetch: app.fetch, port }, (info) => {
  console.log(`Klatch server running on http://localhost:${info.port}`);
});
