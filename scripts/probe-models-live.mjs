/**
 * One-shot: list the models the live Models API returns, plus each model's
 * effort ladder if the API surfaces one. Used 2026-09-07 (Round 166 fire) to
 * verify Argus's routed `claude-fable-5-1` id and its effort levels before
 * adding an `AVAILABLE_MODELS` entry, rather than inferring the ladder from
 * Fable 5. Reads the key from `.env` and prints nothing but model metadata.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const env = readFileSync(join(root, '.env'), 'utf8');
const match = env.match(/^ANTHROPIC_API_KEY=(.+)$/m);
if (!match) {
  console.log('NO KEY IN .env');
  process.exit(0);
}

const res = await fetch('https://api.anthropic.com/v1/models?limit=100', {
  headers: { 'x-api-key': match[1].trim(), 'anthropic-version': '2023-06-01' },
});
console.log('HTTP', res.status);
const body = await res.json();
if (!body.data) {
  console.log(JSON.stringify(body).slice(0, 400));
  process.exit(0);
}
for (const m of body.data) {
  console.log(JSON.stringify(m));
}
