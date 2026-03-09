# Release a new version of Klatch

Follow the release runbook at `docs/RELEASE-RUNBOOK.md` to ship a new version.

## Arguments
- `$ARGUMENTS` — the version number (e.g., "0.8.0") and optionally a short description

## Steps

1. **Validate readiness**: Run `npm test` to confirm all tests pass. Check `git status` for uncommitted work. Abort if not clean.

2. **Determine version and step**: Parse the version from arguments. Look at `docs/ROADMAP.md` to identify which step this release corresponds to and its dimension name.

3. **Update CHANGELOG.md**: Add a new section at the top following the existing format. Include: step title, dimension, features added/changed/fixed, technical changes, test count.

4. **Update ROADMAP.md**: Move the completed step from "Next Steps" to "Completed" with a checkmark. Promote the next step if appropriate.

5. **Commit**: Stage CHANGELOG.md and docs/ROADMAP.md, commit with message "Release vX.Y.Z: Step N — description".

6. **Tag**: Create annotated tag `vX.Y.Z` with one-line summary.

7. **Push**: Push commit and tag to origin.

8. **GitHub Release**: Write release notes to a temp file, then create the release with `gh release create`. Follow the title convention: "vX.Y.Z — Dimension: Step title". Include: What's new, Features, Technical, Quality sections, and a full changelog comparison link.

9. **Update COORDINATION.md**: Update status to reflect the release.

10. **Verify**: Confirm release appears in `gh release list`, tag exists, and tests still pass.
