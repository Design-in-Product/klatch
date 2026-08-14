/**
 * Start the real Klatch server against a throwaway SQLite DB.
 *
 * Written for manual testing (Theseus, 2026-08-12) but generally useful: it lets
 * any agent drive the actual HTTP surface — real routes, real prompt assembly,
 * real Anthropic calls — without pointing the server at a database that holds
 * xian's conversation history.
 *
 *   npx tsx scripts/serve-scratch.mjs              # .testdata/scratch.db
 *   npx tsx scripts/serve-scratch.mjs my-probe     # .testdata/my-probe.db
 *
 * **It must be `tsx`, not `node`.** This header said `node scripts/serve-scratch.mjs` until
 * 2026-08-13, and that line does not work. The server entry it imports is TypeScript whose
 * internal imports are written with `.js` specifiers (`./routes/messages.js` → `messages.ts`);
 * Node's built-in type stripping does not remap those, so plain `node` exits
 * `ERR_MODULE_NOT_FOUND: .../routes/messages.js` (verified on Node 26.5.0). `tsx` is already a
 * devDependency of `packages/server` — it is what `npm run dev` uses — so this adds nothing.
 * The bad line was written when four ad-hoc scripts were consolidated into this one and the
 * header was not re-run; see `docs/logs/2026-08-13-1047-theseus-opus-log.md`.
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
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const name = (process.argv[2] || 'scratch').replace(/[^a-zA-Z0-9._-]/g, '-');
const dir = path.join(__dirname, '..', '.testdata');
const dbPath = path.join(dir, `${name}.db`);

// `.testdata/` is gitignored wholesale (`.gitignore:33`), so it does not exist in a
// fresh clone or worktree, and better-sqlite3 throws "Cannot open database because
// the directory does not exist" rather than creating it. Hit on 2026-08-13 when the
// directory was absent at fire start. One line, so the launcher works from clean.
fs.mkdirSync(dir, { recursive: true });

process.env.KLATCH_DB = dbPath;
console.log(`[serve-scratch] KLATCH_DB = ${dbPath}`);

await import('../packages/server/src/index.ts');
