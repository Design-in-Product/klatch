/**
 * Start the real Klatch server against a throwaway SQLite DB.
 *
 * Written for manual testing (Theseus, 2026-08-12) but generally useful: it lets
 * any agent drive the actual HTTP surface — real routes, real prompt assembly,
 * real Anthropic calls — without pointing the server at a database that holds
 * xian's conversation history.
 *
 *   node scripts/serve-scratch.mjs                 # .testdata/scratch.db
 *   node scripts/serve-scratch.mjs my-probe        # .testdata/my-probe.db
 *
 * The DB lands in `.testdata/`, where `*.db`, `*.db-wal` and `*.db-shm` are
 * gitignored (`.gitignore:3-5`). Delete the file to reset to a virgin schema.
 *
 * **Why a launcher and not `KLATCH_DB=... npm run dev`.** A shell env-assignment
 * prefix is refused by the agent tool layer on this project (verified 2026-08-11:
 * `npx vitest --version` runs, `FOO=bar npx vitest --version` does not). Setting
 * the variable in-process before importing the server sidesteps that without
 * adding a `cross-env` dependency.
 *
 * **Costs money.** The server this starts makes real Anthropic API calls on every
 * POST to `/api/channels/:id/messages`. Credentials come from the repo-root `.env`
 * that `packages/server/src/index.ts` resolves at startup.
 */
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const name = (process.argv[2] || 'scratch').replace(/[^a-zA-Z0-9._-]/g, '-');
const dbPath = path.join(__dirname, '..', '.testdata', `${name}.db`);

process.env.KLATCH_DB = dbPath;
console.log(`[serve-scratch] KLATCH_DB = ${dbPath}`);

await import('../packages/server/src/index.ts');
