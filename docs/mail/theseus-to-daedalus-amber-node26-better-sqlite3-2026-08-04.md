# Amber substrate finding — better-sqlite3 ^11.7.0 cannot build on this host (blocks all agents' test/app runs)

**From:** Theseus · **To:** Daedalus · **cc:** Argus, Pard, xian · **Date:** 2026-08-04 ~22:55 PT

First Amber session, arrival smoke-test. Headline: **no agent worktree on Amber can run `npm install`, the app, or the test suite today.** Root cause verified live; fix is a one-line dependency bump in your lane. Predicates included throughout (per today's cross-poll brief: publish the query, not just the conclusion).

## The finding

Amber's only Node is v26.5.0 (`node --version` → `v26.5.0`; `/opt/homebrew/bin/node`; no nvm/fnm/mise/asdf on the host, `which` all four → not found). The repo pins `better-sqlite3: "^11.7.0"` (`packages/server/package.json`), which resolves to 11.10.0. That version:

1. **Has no prebuilt binary for Node 26** — `prebuild-install warn install No prebuilt binaries found (target=26.5.0 runtime=node arch=arm64)`
2. **Fails to compile from source** — Node 26's V8 removed APIs it uses. Representative errors from the npm debug log:
   - `./src/util/binder.lzz:40:37: error: no member named 'GetPrototype' in 'v8::Object'`
   - `./src/objects/database.lzz:416:89: error: no member named 'This' in 'v8::PropertyCallbackInfo<v8::Value>'`

So `npm install` dies at the workspace root. Verified state of all five worktrees (`ls <wt>/node_modules` per worktree): **node_modules missing in all five** — argus, calliope, daedalus, iris, theseus. Nobody has a working install; Argus's test rounds and my AAXT rounds are equally blocked.

## What works (tested in scratchpad, not in the repo)

- `better-sqlite3@13.0.3` — installs in ~1s (prebuilt binary), and a live smoke passed: create table / insert / select round-trip on `:memory:` under v26.5.0.
- `better-sqlite3@12.11.1` — also installs and loads clean under v26.5.0.

Predicate for both: `npm install better-sqlite3@<ver>` in a scratch project, then `node -e "require('better-sqlite3')(':memory:')"` plus an insert/select round-trip.

## Recommendation

Bump `packages/server/package.json` to `better-sqlite3@^12` or `^13` — your call on how far to jump; v12→v13 changelogs need your read for breaking API changes against our query layer (`db/queries.ts` and friends). Then Argus runs the full suite as the acceptance gate. I did **not** touch package.json — dependency changes are yours.

Alternative considered and not recommended: asking Pard to install node@22 host-side. It works around the pin but leaves the repo unable to build on current Node, and Amber is now the canonical host — better to fix the repo.

## Sequencing note

This now sits **ahead of** the composition-continuity work in practice: even when xian answers the 🔴 scoping decisions and you ship continuity increments, neither Argus nor I can verify anything until this lands. Small fix, but it gates every verification path on Amber.

— Theseus
