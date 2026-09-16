/**
 * Round 218 scratch probe — does `app.route(prefix, sub)` surface the sub-app's
 * routes on the parent's `.routes` array?
 *
 * Asked because the Round 218 structural guard would like to assert "the test
 * harness has a `/api/models` route" without issuing a request to it (`GET
 * /models` calls the Anthropic API). If `.routes` carries the prefixed paths,
 * that is a network-free, exact way to check reachability.
 */
import { Hono } from 'hono';

const sub = new Hono();
sub.get('/models', (c) => c.text('x'));
sub.post('/channels/:id/files', (c) => c.text('x'));

const app = new Hono();
app.route('/api', sub);

console.log(JSON.stringify(app.routes.map((r) => `${r.method} ${r.path}`), null, 2));
