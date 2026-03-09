# Release Runbook

How to ship a new version of Klatch.

## Prerequisites

- All tests passing (`npm test`)
- All work merged to `main`
- `main` is demo-ready (branch discipline)

## Steps

### 1. Decide the version

Klatch versions map to roadmap steps:

| Version | Step | Dimension |
|---------|------|-----------|
| 0.3.0 | Steps 1-3 | Foundation |
| 0.4.0 | Step 4 | Agency |
| 0.5.0 | Step 5 | Role definition |
| 0.6.0 | Step 6 | Conversation structure |
| 0.7.0 | Step 7 | Orchestration |
| 0.8.0 | Step 8 | Data consolidation |

Minor versions (0.5.5, 0.5.6) are used for significant sub-step work.

### 2. Update CHANGELOG.md

Add a new section at the top of `CHANGELOG.md` following the existing format:

```
## [X.Y.Z] — YYYY-MM-DD

### Step N: Title

Brief description of what this release enables.

### Added
- Feature bullet points

### Changed
- Changed behavior

### Fixed
- Bug fixes

### Technical
- Infrastructure / test / architecture changes
```

### 3. Update ROADMAP.md

Move the completed step from "Next Steps" to "Completed" section.

### 4. Commit the changelog and roadmap updates

```bash
git add CHANGELOG.md docs/ROADMAP.md
git commit -m "Release vX.Y.Z: Step N — description"
```

### 5. Tag the release

```bash
git tag -a vX.Y.Z -m "vX.Y.Z: One-line summary"
git push origin main
git push origin vX.Y.Z
```

### 6. Create GitHub Release

```bash
gh release create vX.Y.Z \
  --title "vX.Y.Z — Dimension: Step title" \
  --notes-file /tmp/release-notes.md \
  --latest
```

Release notes format (write to a temp file first to avoid shell escaping issues):
- **What's new** — 1-2 sentence summary referencing the dimension
- **Features** — user-facing bullet points
- **Technical** — API/DB/architecture changes
- **Quality** — test count, infrastructure improvements
- **Full changelog** link: `https://github.com/Design-in-Product/klatch/compare/vPREV...vX.Y.Z`

### 7. Update COORDINATION.md

Update your section's status and "Last completed" to reference the release.

### 8. Verify

- [ ] `gh release list` shows the new release as Latest
- [ ] `git tag -l` includes the new tag
- [ ] CHANGELOG.md has the new entry
- [ ] ROADMAP.md reflects the completed step
- [ ] Tests still passing after all commits

## Title Convention

Release titles follow: `vX.Y.Z — Dimension: Step title`

Examples:
- v0.4.0 — Agency: Conversation control
- v0.5.0 — Role Definition: Channel identity
- v0.6.0 — Conversation Structure: Multi-entity conversations
- v0.7.0 — Orchestration: Interaction modes
