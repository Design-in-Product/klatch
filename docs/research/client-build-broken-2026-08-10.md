# `npm run build` fails — the client hasn't typechecked in some time, and `npm test` can't see it

**Author:** Theseus · **Date:** 2026-08-10 (14:47 fire) · **Status:** found and characterised, not fixed
**Found:** incidentally, while confirming the AAXT liveness fix introduced no type errors

## The finding

Root `npm run build` fails. The client workspace's build script is `tsc && vite build`, and
`tsc` exits non-zero:

```
src/App.tsx(220,27): error TS2554: Expected 1 arguments, but got 0.
npm error Lifecycle script `build` failed with error:
npm error code 2
npm error workspace @klatch/client@0.0.1
npm error command sh -c tsc && vite build
```

**27 errors across 8 files.** Verified this fire by running the build, not inferred.

| File | Errors | Nature |
|---|---|---|
| `src/__tests__/SidebarRedesign.test.tsx` | 12 | `ChannelType` — fixture `type` is optional, `Channel` requires it |
| `src/__tests__/round43-message-list-aaxt.test.tsx` | 4 | `Entity` fixtures missing `effort`, `createdAt` |
| `src/__tests__/round41-composition-surface-aaxt.test.tsx` | 3 | same |
| `src/__tests__/ImportDialog.test.tsx` | 3 | `never[]` inference on scan-result fixtures |
| `src/__tests__/exp-fixture-randomization.test.tsx` | 2 | TS2783 duplicate `id` / `name` in spread |
| `src/__tests__/round42-entity-manager-aaxt.test.tsx` | 1 | `Entity` fixture missing `effort`, `createdAt` |
| `src/__tests__/MessageList.test.tsx` | 1 | same |
| **`src/App.tsx`** | **1** | **production source** — React 19 `useRef` signature |

## Why nobody noticed

The team's green signal is `npm test`, and **Vitest does not typecheck**. `npm test` is
genuinely green — 1151 server / 212 client, exit 0, verified this fire — while `npm run build`
has been failing the whole time. Every "suite green" claim on file is true and none of them
covers this.

That gap is the actual finding. The type errors are mundane; the fact that our green light
structurally cannot see them is not.

## How long

Mixed vintage, which suggests a blind spot rather than a fresh regression:

- **`App.tsx:220`** — the code dates to `d3ecae8` (2026-03-07). `useRef<T>()` with no argument
  was legal under React 18 types and became an error under React 19's. So it broke whenever the
  React 19 upgrade landed, not in March.
- **`effort` / `createdAt` on `Entity`** — `38bcebf` (2026-08-10 12:55 PT), roughly two hours
  before this fire. Today's.
- **`SidebarRedesign` / `ImportDialog`** — undated here; older than today.

So: broken before today, and today made it worse.

## The one production fix

Everything except `App.tsx` is test-fixture drift. The single product-source error:

```ts
// packages/client/src/App.tsx:220 — current
const clearTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

// React 19 requires an explicit initial value
const clearTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
```

Zero runtime change — `useRef()` already initialised to `undefined`; React 19 just stopped
inferring it.

## Why I didn't fix it

I deliberately stopped at characterisation:

1. Fixing `App.tsx` alone leaves the build red, so it delivers nothing on its own.
2. The other 26 errors live in test files across Daedalus's and Iris's surfaces
   (`ImportDialog`, `SidebarRedesign`), and Daedalus has continuity `#3` in flight. Rewriting
   fixtures under him unattended is how merge pain gets manufactured.

The repair is mechanical and probably 20 minutes attended. It is not mine to do at 14:47 without
a human.

## Recommendation

1. **Someone lands the repair** — `App.tsx` one-liner plus fixture updates. Daedalus's lane.
2. **Wire typecheck into the green signal**, or this recurs. Two candidates, and I'd take the
   first: add `"typecheck": "tsc --noEmit"` to each workspace and fold it into root `npm test`,
   so the number the team quotes covers types. Alternatively `vitest --typecheck`, but that only
   covers test files and misses `App.tsx` — which is exactly the error that matters most here.
3. **Check the release path.** A `release` skill is available to agents here, but it does not
   live in the repo (no `.claude/skills/`, no `SKILL.md` anywhere under the worktree) so I
   couldn't read what it runs. If it invokes `npm run build`, a release attempt fails today.
   Flagging, not asserting.

Also verified while looking: **there is no CI** — no `.github/` directory at all. Nothing runs
the build except a human typing it, which is the mechanical reason a red build survived this
long. That makes recommendation 2 the load-bearing one: if the check isn't inside the command
the team already runs, it won't run.

— Theseus
