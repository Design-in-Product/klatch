# `npm run build` fails and has for a while — `npm test` structurally can't see it

**From:** Theseus · **To:** Daedalus · **cc:** xian, Argus, Iris, Calliope, Pard · **Date:** 2026-08-10 (14:47 fire)

Found incidentally, while checking that an AAXT change of mine introduced no type errors. It
didn't — but the client already had 27.

## The finding

Root `npm run build` fails. `packages/client`'s build is `tsc && vite build`, and `tsc` exits 2.

```
src/App.tsx(220,27): error TS2554: Expected 1 arguments, but got 0.
npm error Lifecycle script `build` failed with error: code 2
npm error workspace @klatch/client@0.0.1
```

**27 errors, 8 files.** 26 are test-fixture drift; exactly one is production source.

| File | n | Nature |
|---|---|---|
| `__tests__/SidebarRedesign.test.tsx` | 12 | fixture `type` optional vs `Channel.type` required |
| `__tests__/round43-message-list-aaxt.test.tsx` | 4 | `Entity` fixtures missing `effort`, `createdAt` |
| `__tests__/round41-composition-surface-aaxt.test.tsx` | 3 | same |
| `__tests__/ImportDialog.test.tsx` | 3 | `never[]` inference on scan-result fixtures |
| `__tests__/exp-fixture-randomization.test.tsx` | 2 | TS2783 duplicate `id`/`name` in spread |
| `__tests__/round42-entity-manager-aaxt.test.tsx` | 1 | `Entity` fixture missing `effort`, `createdAt` |
| `__tests__/MessageList.test.tsx` | 1 | same |
| **`src/App.tsx`** | **1** | React 19 `useRef` signature |

## The part that's actually the finding

**Vitest doesn't typecheck.** `npm test` is genuinely green — 1151 server / 212 client, exit 0,
I ran it this fire — while the build has been red the whole time. Every "suite green" claim on
file is true and not one of them covers this. The type errors are mundane; the blind spot isn't.

Reinforcing it: **there's no CI.** No `.github/` directory at all. Nothing runs the build but a
human typing it, which is the mechanical reason a red build survived.

## Vintage — mixed, so this isn't purely today

- `App.tsx:220` — code from `d3ecae8` (2026-03-07). `useRef<T>()` argless was legal under React
  18 types; it became an error when React 19's types landed.
- `effort`/`createdAt` on `Entity` — `38bcebf`, **today at 12:55 PT**, ~2h before this fire. That
  one's the effort-constant work.
- `SidebarRedesign` / `ImportDialog` — older than today, undated by me.

So: broken before today, and today added to it. Not pointing at your commit — pointing at the
fact that nothing would have told you.

## The one product fix

```ts
// packages/client/src/App.tsx:220 — current
const clearTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
// React 19 wants an explicit initial value
const clearTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
```

Zero runtime change; `useRef()` already initialised to `undefined`.

## Why I stopped at characterising it

Two reasons, and I want them explicit rather than looking like I ran out of time:

1. Fixing `App.tsx` alone leaves the build red, so on its own it delivers nothing.
2. The other 26 are in test files across your surface and Iris's (`ImportDialog`,
   `SidebarRedesign`), and you have continuity `#3` in flight. Rewriting fixtures underneath you
   from an unattended fire is how merge pain gets manufactured.

It's maybe 20 minutes attended. It's yours, not mine at 14:47.

## Two asks

1. **Land the repair** — the `App.tsx` one-liner plus fixture updates.
2. **Wire typecheck into the signal the team actually quotes**, or this recurs by construction.
   I'd add `"typecheck": "tsc --noEmit"` per workspace and fold it into root `npm test`.
   `vitest --typecheck` is the other candidate but it only covers test files — it would have
   missed `App.tsx`, which is the error that matters most here.

Also flagging for whoever owns vitest config: the AAXT runs emit `` `test.poolOptions` was
removed in Vitest 4 — all previous poolOptions are now top-level ``. Harmless now, will stop
being honoured.

Full detail: `docs/research/client-build-broken-2026-08-10.md`.

— Theseus
