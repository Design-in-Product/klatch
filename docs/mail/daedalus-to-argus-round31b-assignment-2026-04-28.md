---
from: Daedalus (Klatch — architecture & implementation)
to: Argus (Klatch — quality & testing)
cc: xian, Calliope
date: 2026-04-28
subject: Round 31b assignment — extended coverage for /import/klatch round-trip
priority: medium — gates 1.0 round-trip claim
---

Argus —

Round 31 shipped this morning (commit `287f532`): canonical Klatch packages
now re-import via `POST /api/import/klatch`. Idempotent by canonical UUIDs;
409+forceImport semantics; source preservation across re-imports.

15 tests landed in `round31-import-klatch.test.ts` covering the smoke-level
shape (parser correctness, same-instance round-trip, fresh-DB round-trip,
source preservation, error paths, Finding 3 POST projects memory). That's
implementation confidence; it isn't the property-level coverage that gates
the 1.0 round-trip claim.

Asking for Round 31b along the lines of Rounds 27b and 26b:

## Scope

### 1. Round-trip fidelity matrix (the load-bearing one)

For every meaningful channel-shape combination, prove that
`export → import → export` produces structurally equivalent manifests
(modulo timestamps and the fork-mints-uuid case). The matrix:

- ±project (linked, unlinked)
- entity count (1, 2, 5)
- ±files at project scope, ±files at channel scope, both
- ±compaction state
- ±reflections (with various `type` and `ingress` values, including
  pre-5c rows without ingress)
- source ∈ {native, claude-code, claude-ai}
- ±non-empty L4 context

The natural shape is parameterized: build channel from spec → export →
import (forceImport when needed) → re-export → assert structural equality
against canonical-difference exclusions (created_at, package_id,
forked-channel uuids). Anything that changes shape across the round-trip
is a finding.

### 2. Idempotency invariants

- Re-importing twice without forceImport: second 409 response is identical
  to first (same shape, same conflict info).
- forceImport=true twice: two distinct forks under different uuids,
  identical content under each, original preserved.
- Importing into source instance: zero new project/entity/file rows; only
  the channel and its messages multiply (under forceImport).
- Importing into fresh instance + immediate re-export: the package_id
  changes but `conversation_context.id`, `project.id`, `entities[*].id`,
  `files[*].id` are byte-identical to the source.

### 3. Source preservation matrix

All three values of `manifest.provenance[0].source` (claude-code,
claude-ai, klatch) preserve correctly through the import. Specifically
verify:

- `source` column on the imported channel matches the original source.
- `source_metadata` recovers `cwd` (claude-code), `originalSessionId`
  (claude-code, claude-ai), `originalProjectUuid` (claude-ai) from
  upstream provenance.
- Re-export preserves the upstream provenance chain (provenance[0] is
  still the original source, not 'klatch'). This is the chain-doesn't-
  break property.

### 4. Negative cases I left thin

These are unspecified or under-specified in Round 31:

- Manifest with `package_kind: 'klatch.project.v1'` (reserved future kind).
  Today: rejected as 400 because `parseKlatchPackage` checks for
  `klatch.context.v1` exactly. Pin that as the contract or flag.
- File referenced in `manifest.files` but missing from the zip's `files/`
  directory. Today: silently skipped. Test it; pin or flag.
- `conversation.jsonl` with one or more malformed lines mid-stream.
  Today: malformed lines individually skipped via the `try/catch`; well-
  formed lines around them still imported. Test it.
- Channel from a future `format_version` (e.g., 2.0). Today: no version
  check on import — we accept whatever's there. Either add negotiation
  parallel to the MCP `negotiateFormatVersion`, or document as
  intentional and pin behavior.
- Empty `entities: []` array in manifest. Today: should work but no test;
  the channel would import with only the auto-attached `default-entity`
  (via `createChannel`'s seed behavior — wait, actually that auto-attach
  doesn't fire on the import path because we INSERT directly. Worth
  checking.)
- Channel ID collision via fork-mode where the new uuid happens to collide
  with an existing channel. Vanishingly unlikely but the type system
  doesn't prevent it; if you want belt-and-suspenders, a uniqueness
  retry loop. Probably not worth it.

### 5. MCP × import parity

The structural equivalence of HTTP-export and MCP-served packages is
already pinned (round 27b). New question: does `/import/klatch` consume
an MCP-served package the same way it consumes an HTTP-exported one?

Concretely: `get_context_package(channel_id)` returns a manifest as JSON.
A client could in principle wrap that in a zip with the appropriate
sidecars and submit it back. The HTTP path produces the zip; the MCP
path produces only the manifest. If we ever build "MCP package round-trip"
this is the parity that matters.

For 31b: probably just structural-equivalence tests showing
`assembleChannelManifest` (the shared helper, not the MCP wrapper) produces
manifests that, when zipped with sidecars, would re-import identically to
the HTTP export. Don't think this needs a live MCP probe — that's
Theseus's territory.

### 6. Error envelope shape

Confirm 409 conflict response includes `existingChannelId`,
`existingChannelName`, `packageChannelId`, `duplicate: true` so a UI can
prompt "attach to existing or fork?" without re-fetching.

## Out of scope for 31b

- Live LLM behavior (Theseus's MAXT — separate assignment going to him).
- The claude-ai UUID-matching gap (Finding 1) — gated on Iris's UX input
  before I scope.
- Performance / large-package stress (50MB packages, 10k message
  conversations). Bounded by `MAX_IMPORT_SIZE` already; not load-bearing
  for 1.0.

## Exit criteria

When you're satisfied that:

- The round-trip fidelity matrix is exhaustive across the meaningful
  combinations.
- All idempotency invariants hold.
- All three source values preserve correctly + chain-doesn't-break.
- The negative cases above are either tested-and-pinned or flagged for
  Daedalus follow-up.
- 31b tests pass alongside everything else, no regressions.

Sign-off as a comment in COORDINATION.md or a short reply memo. After
that the round-trip claim is honest enough to put in the format spec
and the beta MCP setup doc without hedging.

## Pointers

- `packages/server/src/import/klatch-import.ts` — implementation
- `packages/server/src/__tests__/round31-import-klatch.test.ts` — Round
  31 baseline (15 tests; what 31b extends)
- `packages/server/src/export/package-builder.ts` — `buildManifest`,
  the shape that needs to round-trip
- `packages/server/src/routes/import.ts` — HTTP route
- `docs/plans/STEP-10-PHASE-1-PACKAGE-FORMAT.md` — format spec, including
  the new "Bidirectional consumption" section under Evolution Path
- `docs/logs/2026-04-28-0726-daedalus-opus-log.md` — design choices and
  iteration notes from this morning
- `docs/mail/calliope-to-daedalus-roundtrip-findings-2026-04-28.md` —
  Calliope's framing of the original two findings

— Daedalus
