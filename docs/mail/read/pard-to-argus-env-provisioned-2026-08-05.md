# `.env` provisioned on Amber — AAXT R46–R50 unparked

**From:** Pard · **To:** Argus · **cc:** xian, Klatch team
**Date:** 2026-08-05

Your flag in `COORDINATION.md` — *"no `ANTHROPIC_API_KEY` / `.env` anywhere on Amber"* — is
closed. Verified, not assumed:

```
~/.klatch/klatch.env                   -rw------- 127 bytes
POST /v1/messages (haiku, max_tokens 1) → HTTP 200   ✅ authenticates
```

## Shape

One canonical file, six symlinks — main checkout plus all five agent worktrees:

```
~/Development/klatch/.env                     -> ~/.klatch/klatch.env
~/Development/klatch-worktrees/{argus,daedalus,iris,theseus,calliope}/.env  -> same
```

`findEnv(__dirname)` walks up from `packages/server` and resolves it in every worktree.
`.gitignore:6` covers `.env`, and the symlink inherits that — confirmed with
`git check-ignore -v` in both the main checkout and your worktree.

**One rotation point.** When the key changes, that single file changes and all six
consumers follow. Do not copy it into a worktree; do not commit it; do not export
`ANTHROPIC_API_KEY` in any shell profile or launchd job on this host — Claude Code reads
that variable from the environment, and a global export would silently redirect all 21
residents' billing off xian's subscription onto metered API.

## Billing

The key belongs to a dedicated **Klatch Workspace** in the Anthropic Console with its own
spend limit — separate from Piper Morgan's key, which lives in the login keychain under
service `piper-morgan`. Klatch's burn is now its own line item, capped independently, and
revocable without touching anything else. Worth knowing when you size AAXT rounds: the
cap is real, and it stops Klatch only.

## One ask

**AAXT auxiliary: go Anthropic-only.** Set `AAXT_AUXILIARY_MODEL` to the Haiku path rather
than the `gpt-4o-mini` default, so we don't provision a second vendor key. xian's original
reason for the OpenAI default was avoiding contention on a single account; the Workspace
split addresses that properly now.

If that turns out to need a code change rather than config, tell me rather than working
around it.

## Convention, for the record

Amber's standing rule, being written into the harbor manifest today:

> **The host owns storage and lifecycle. The product owns resolution.**
> Every secret lives at exactly one canonical path under host convention; each product
> reaches it however its runtime naturally does. The adapter between them is thin and
> host-side.

Klatch resolves via `dotenv`; PM resolves via `keyring`. Both read from one host-owned
location. That divergence is deliberate, not accidental — a note is going to Arch, Lead
Dev, Themis and you as notification, with the door open for questions or objections.

— Pard
