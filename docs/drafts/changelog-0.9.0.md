# v0.9.0 CHANGELOG DRAFT

Ready to prepend to CHANGELOG.md when cutting the release.

---

## [0.9.0] — 2026-04-04

### Step 9 Complete: Files, Context Architecture & Infrastructure

The biggest release since Step 8. Files are now first-class citizens with their own domain model, scope-aware context injection, and upward promotion. The UI vocabulary is clarified. Compaction is research-backed and tuned. Entities gain per-model effort control. The test suite nearly doubled.

### Added — File Domain Model (Phases 1–5)
- **File domain model**: New `files` and `file_refs` tables with scope-aware references (message, channel, project, entity). Backfill migration from existing `message_artifacts`. Indexes on scope lookups.
- **Channel file pinning (Phase 2)**: Pin files to channels via `POST /api/files/pin`. Pinned files listed in Layer 4 system prompt as "Channel files available: ...". Pin/unpin UI on file cards. Pinned files section in channel settings with unpin controls.
- **Project knowledge base (Phase 3)**: Upload files to project knowledge base. Project files listed in Layer 3 system prompt as "Project knowledge base files: ...". Knowledge base section in project settings with upload, view, and remove.
- **Dual-write completion (Phase 4)**: All file creation paths (`save_file` tool, upload endpoint, backfill) now consistently populate both `message_artifacts` and `files`/`file_refs`.
- **File promotion (Phase 5)**: `POST /api/files/:id/promote` promotes files upward (message → channel → project). Idempotent, additive (original refs preserved). "Promote to project" button on channel-pinned files.
- **File API endpoints**: `GET /api/projects/:id/files`, `GET /api/channels/:id/files`, `GET /api/entities/:id/files`, `GET /api/messages/:id/files`, `GET /api/files/:id/refs`.

### Added — Step 9a–d (File Upload & Artifacts)
- **File upload/attach (9a)**: Multipart file upload to channels. File attachment cards in messages. MIME detection with extension fallback. File storage on disk with served endpoint.
- **Artifact rendering (9b)**: Inline artifact rendering in messages.
- **Kit briefing file awareness (9c)**: Layer 1 includes file handling guidance for entities.
- **Code block save (9d-A)**: Save code blocks from messages as files. Smart filename detection from language hints and content.
- **Tool-based file creation (9d-B)**: `save_file` tool enables entities to create files natively during conversation.

### Added — Infrastructure
- **Per-entity effort parameter**: New `effort` column on entities (low/medium/high/max). Passed as `output_config: { effort }` in API calls. Model-aware defaults: Sonnet → medium, others → high. `max` restricted to Opus 4.6. Effort selector in entity settings, filtered by model capabilities.
- **Compaction threshold tuned**: Raised from 80K to 160K tokens (research-backed — 80K fired at 8% of 1M context, Claude Code uses 75%). Entity-attribution preservation instructions for roundtable/directed channels.

### Changed
- **Nomenclature rename**: "System prompt" → "Channel context" (Layer 4) and "Role prompt" (Layer 5) across all UI surfaces. Terminology guide at `docs/NOMENCLATURE.md`.
- **File Domain Model phases resequenced**: Phases 6–7 (memory-as-file, entity library) deferred to Steps 10–11 where they deliver more user value.
- **Prompt-debug endpoint**: Now reports file info in both Layer 3 (project files) and Layer 4 (channel files) sections.

### Documentation
- RFC-001 Five-Layer Context Model response filed with Dispatch
- Nomenclature guide (`docs/NOMENCLATURE.md`)
- File Domain Model design doc (`docs/plans/FILE-DOMAIN-MODEL.md`)
- Compaction threshold deep dive (`docs/research/compaction-threshold-deep-dive.md`)
- Effort parameter evaluation (`docs/research/effort-parameter-evaluation.md`)
- AuditBench methodology review (`docs/research/auditbench-review.md`)
- Blog: "Your Model or Theirs," "What Doesn't Transfer"
- Intelligence sweeps #5 and #6

### Technical
- **819 tests passing** (680 server + 139 client), zero failures. Up from 727 at v0.8.9.
- Rounds 13–16: test infra fixes, feature tests, FDM coverage (58 FDM-specific tests).
- Root-level `npx vitest run` fixed (Vitest v4 workspace config).
- New tables: `files`, `file_refs`. New columns: `entities.effort`.
- New shared types: `FileRefScope`, `FileRefType`, `KlatchFile`, `FileRef`, `FileWithRef`, `EffortLevel`.
- Vitest workspace config at repo root (`vitest.config.ts`).
- GitHub #21 closed (stale kit briefing assertions).

---

## Website update notes

Update `index.html` release banner to reference v0.9.0 and the File Domain Model as the headline feature. Update roadmap section: Step 9 complete, Step 10 next.
