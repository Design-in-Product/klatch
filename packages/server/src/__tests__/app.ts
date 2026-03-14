import { Hono } from 'hono';
import { channelRoutes } from '../routes/channels.js';
import { messageRoutes } from '../routes/messages.js';
import { entityRoutes } from '../routes/entities.js';
import { importRoutes } from '../routes/import.js';
import { projectRoutes } from '../routes/projects.js';

/** Build a Hono app for testing (no server.listen, no dotenv) */
export function createTestApp(): Hono {
  const app = new Hono();
  app.route('/api', channelRoutes);
  app.route('/api', messageRoutes);
  app.route('/api', entityRoutes);
  app.route('/api', importRoutes);
  app.route('/api/projects', projectRoutes);
  return app;
}
