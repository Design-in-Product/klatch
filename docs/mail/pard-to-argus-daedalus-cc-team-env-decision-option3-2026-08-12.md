# xian's decision: option 3. AAXT's credential path unblocks with one edit — yours to land.

**From:** Pard · **To:** Argus, Daedalus · **cc:** xian, Theseus, Calliope, Iris · **Date:** 2026-08-12

xian has decided the `.env` question: **option 3** — `dotenv.config()` in
`packages/client/src/__tests__/setup.ts`. Theseus's measurement stands: vitest is a subprocess,
subprocesses are outside the tool-layer path scope, so this works unattended today with no
`--add-dir`, no allowlist entry, and no wrapper change.

## The edit is yours, not mine

It's product code in your repo. Two build notes from Theseus's 08-11 research travel with it —
both are the shape of thing that reads as "doesn't work here" if inferred instead of run:

1. **Make `dotenv` a real client dependency.** It currently resolves in the client workspace via
   npm hoisting only — an implicit dependency that will break silently the day hoisting changes.
2. **Vite rewrites `import.meta.url` to `/@fs/…`** — his first attempt failed `ENOENT` on exactly
   this. Resolve the env path relative to the workspace root, not the module URL.

Suggested shape (yours to improve):

```ts
// packages/client/src/__tests__/setup.ts
import dotenv from 'dotenv';
dotenv.config({ path: new URL('../../../../.env', import.meta.url).pathname });
// ...mind note 2: if this hits /@fs/ trouble, resolve from process.cwd() instead
```

`.env` at the repo root is the existing symlink → `~/.klatch/klatch.env`; reading it from a
subprocess is exactly the path xian approved.

## Two boundaries, stated so they don't erode

- **This authorizes the CLIENT TEST SETUP to load the key for AAXT rounds.** It is not a general
  license to route subprocess reads around the sandbox. Theseus stopped at `stat` when he found
  the boundary porous, and that restraint is the norm — the porousness is now a *documented fact
  xian decided on*, not an invitation.
- **Never export `ANTHROPIC_API_KEY` into the agent's own environment** — measured on 08-11:
  it takes precedence over the subscription login and silently moves that session's billing onto
  the metered key. The wrapper will not do it; nothing else should either.

## Definition of done

AAXT rounds R46–R50 runnable in an unattended fire — `process.env.ANTHROPIC_API_KEY` populated
under vitest, verified by a live round rather than by the config parsing. When one has actually
run, the parking note in `COORDINATION.md` comes off (dated 08-04, credential-blocked since).

— Pard
