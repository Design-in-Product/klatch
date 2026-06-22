# Pre-existing Test / Type Issues — Triage Backlog

**Filed:** 2026-06-22 by Daedalus (surfaced while building the default-project + cross-ref increments).
**Owner:** Argus.
**Blocking:** **No.** All tests RUN (vitest transpiles via esbuild, ignoring tsc); the flakes pass in isolation. This is a quality-hygiene backlog to triage **at your own pace** — it does not block merges, runtime, or other agents' work.

The 6/22 increments' own *source* is tsc-clean; everything below is pre-existing drift (with two small exceptions noted as mine).

---

## A. Client `tsc --noEmit` — 17 errors (type-check red; runtime + tests unaffected)

| File | Count | Issue | Suggested fix |
|---|---|---|---|
| `src/App.tsx` | 1 | `clearTimeoutRef = useRef<ReturnType<typeof setTimeout>>()` called with no arg — React 19 / stricter `@types/react` now require an initial value | `useRef<…>(undefined)` (1 line) |
| `src/__tests__/SidebarRedesign.test.tsx` | 12 | obsolete `interface ChannelWithType extends Channel` — `Channel` now *has* `type`, so the extension re-declares it as optional → "incorrectly extends" | **delete `ChannelWithType`, use `Channel` directly throughout**; ensure `makeChannel` defaults `type`. Resolves all 12. |
| `src/__tests__/ImportDialog.test.tsx` | 3 | fixture type drift (`projects`/`memories` typed `never[]`) | fix fixture types |
| `src/__tests__/MessageList.test.tsx` | 1 | mock `Entity` missing required `effort` | add `effort` to the mock |

**Mine vs pre-existing:** the `useRef`, ImportDialog, and MessageList errors are entirely pre-existing. Of the 12 `ChannelWithType` errors, the root cause (obsolete interface) is pre-existing; my 6/22 default-project test additions added ~3 instances following the file's existing pattern. **Daedalus has offered to do the `ChannelWithType → Channel` cleanup** (he touched that file) — Argus's call whether to take it or hand it back.

## B. Load-induced test flakes (pass isolated; fail only under full-suite load)

- **Diagnosed by Argus, 2026-06-21:** `userEvent`-based tests time out under full-suite machine load — NOT a dirty-state cascade. Argus is already hardening (ImportDialog `{timeout}`).
- **Affected:** `ImportDialog.test.tsx` (userEvent-heavy), `MessageInput.test.tsx` (flakes under load), `ChannelSidebar.test.tsx` (passes 30/30 isolated; flakes under full-suite).
- **Already applied:** Daedalus added `{ timeout: 15000 }` to the 2 `userEvent` tests touched in the 6/22 sidebar work, matching the pattern.
- **Fix direction:** timeout headroom on `userEvent` tests + settled-render; keep `singleThread`.

---

## Status (Argus to update as triaged)

| Item | Status |
|---|---|
| A — `useRef` App.tsx | open |
| A — `ChannelWithType` SidebarRedesign | open (Daedalus offered) |
| A — ImportDialog fixture types | open |
| A — MessageList mock `effort` | open |
| B — userEvent load-flakes | in progress (Argus) |
