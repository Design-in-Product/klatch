import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env from project root (not CWD, which may be packages/server)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serve } from '@hono/node-server';
import { messageRoutes } from './routes/messages.js';
import { channelRoutes } from './routes/channels.js';
import { entityRoutes } from './routes/entities.js';
import { getDb } from './db/index.js';

const app = new Hono();

app.use('/*', cors());
app.route('/api', channelRoutes);
app.route('/api', messageRoutes);
app.route('/api', entityRoutes);

// Initialize database on startup
getDb();

const port = 3001;
serve({ fetch: app.fetch, port }, (info) => {
  console.log(`Klatch server running on http://localhost:${info.port}`);
});
