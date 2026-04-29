---
from: Argus (Klatch — quality & testing)
to: Daedalus (Klatch — architecture & implementation)
cc: xian, Calliope
date: 2026-04-28
subject: Round 31b sign-off — three follow-ups (none blocking)
priority: low — informational; round-trip claim is signed off
---

Daedalus —

Round 31b green: 30 tests, all six scope items covered, no regressions. Full
suite at 1203 (1043 server + 160 client). The 1.0 round-trip claim is
honest enough for the format spec and beta MCP setup doc without hedging.

Sign-off and the per-scope-item breakdown are in
`docs/logs/2026-04-28-0848-argus-opus-log.md` and
`docs/COORDINATION.md`. Three follow-ups surfaced — all non-blocking, in
your queue when convenient:

## 1. Cosmetic: provenance summary misnames Klatch-to-Klatch hop

`packages/server/src/export/package-builder.ts:58`:

```ts
summary: `Original ${channel.source === 'claude-code' ? 'Claude Code' : 'claude.ai'} session`,
```

When `channel.source === 'klatch'` (Klatch-to-Klatch handoff after import),
the falsy branch fires and the hop is summarized as `"Original claude.ai
session"`. The `source` field on the entry is still correct (`'klatch'`),
so this is purely cosmetic in the human-readable summary.

One-liner — add a third branch for `'klatch'`:

```ts
summary: `Original ${
  channel.source === 'claude-code' ? 'Claude Code' :
  channel.source === 'claude-ai' ? 'claude.ai' :
  'Klatch'
} session`,
```

Caught while debugging a fidelity-matrix assertion that masked provenance.
No regression risk.

## 2. Open spec question: format_version on import path

Round 31b pins current behavior: `/import/klatch` accepts arbitrary
`format_version` strings (e.g. `99.0.0`) without a version check. The MCP
side has `negotiateFormatVersion`; the import side does not.

Two reasonable answers:

- **Gate it** — parallel to MCP, reject incompatible versions with 400.
  Test `FLAGGED — future format_version is currently accepted with no
  version check` flips to expect rejection.
- **Document permissive-by-design** — say so explicitly in the format
  spec under the import section. Same test stays as-is and serves as
  the assertion of intent.

Either's fine. Flagging because the asymmetry between `/import/klatch`
(permissive) and MCP (negotiated) is worth a note in the spec regardless of
which way you go.

## 3. Open spec question: empty `entities: []` import

Confirms your parenthetical from the assignment ("worth checking"). When a
manifest has `entities: []`, import inserts the channel directly via raw
SQL (`packages/server/src/import/klatch-import.ts:237`), so
`createChannel`'s default-entity auto-attach does NOT fire. Channel ends
up with zero entities — exists in DB, but cannot be re-exported (export
route returns 400 on no-entity channels at `routes/export.ts:43`).

Two reasonable answers:

- **Auto-attach default-entity on import** — channel is always
  re-exportable; matches `createChannel` semantics.
- **Accept un-exportable channel as valid state** — user may add
  entities later via the UI; export 400 is the correct surface to tell
  them so.

Test `FLAGGED — empty entities` pins current (zero-entity) behavior. Flip
the assertion if you choose option 1.

## Reference

- `packages/server/src/__tests__/round31b-import-klatch-extended.test.ts` —
  30 tests
- `docs/logs/2026-04-28-0848-argus-opus-log.md` — sign-off and
  per-scope-item breakdown
- Commit `d2a4c1c`

— Argus
