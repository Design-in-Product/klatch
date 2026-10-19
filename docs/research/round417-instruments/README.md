# Round 417 instruments

Driven 2026-10-19 (START fire) by Daedalus. Two unrelated instruments, one per routed item from
Argus's 2026-10-19 intel memo.

## `control-is-the-membership-leg-load-bearing.mts`

Grades the control in the new `round39-model-fallback-parity.test.ts` block
("5.5 models: recognised by the overlay, floored pending capability verification").

The question: `fallbackEffortLevels` returns the three-level floor for **any** string, so an
assertion that `claude-opus-5-5` floors at three levels would pass just as happily for a typo'd id.
Is the `id in AVAILABLE_MODELS` leg doing work, or is it decoration?

Drive it:

```bash
npx tsx docs/research/round417-instruments/control-is-the-membership-leg-load-bearing.mts
```

Recorded output: `control.out`. Verdict:

```
LADDER leg alone separates real from typo: false (false => vacuous alone)
MEMBERSHIP leg separates real from typo: true (true => control load-bearing)
CONTROL VERDICT: PASS — membership is the only separating leg, and the floor is not universal
```

Four typo'd ids (`claude-opus-55`, `claude-opus-5-5-`, `claude-sonnet-5.5`,
`claude-haiku-5-5-20260101`) all floor at three levels and are all absent from the overlay — so the
ladder leg cannot tell them from the three real ids and the membership leg can. A second control
asserts the known five-level models (`claude-opus-5`, `claude-sonnet-5`, `claude-fable-5-1`) do
**not** floor, so the floor assertion is not true of everything.

## `sdk-gap-0122-to-0135.mjs`

Sizes the `@anthropic-ai/sdk` jump from Klatch's pin to the registry's latest, and keys the
changelog segment between them for breaking changes, removals, renames and deprecations.

Takes the changelog path as `argv[2]` (the recorded drive used a gitignored cache):

```bash
curl -sL https://raw.githubusercontent.com/anthropics/anthropic-sdk-typescript/main/CHANGELOG.md -o /tmp/CHANGELOG.md
node docs/research/round417-instruments/sdk-gap-0122-to-0135.mjs /tmp/CHANGELOG.md
```

Recorded output: `sdk-gap.out`. Verdict:

```
SUMMARY: pin 0.122.0 -> latest 0.135.0 | 14 releases | 2 breaking, 6 removed, 1 renamed, 8 deprecated
```

**Read the heading key before reusing it.** The first version was
`/^##\s+(\d+\.\d+\.\d+)/`, which read 198 headings and could not find `0.135.0` at all — the four
newest changelog headings are markdown links (`## [0.135.0](…)`) and the `\d` never met the `[`.
The committed key is `/^##\s+\[?(\d+\.\d+\.\d+)\]?/`, reads 212, and asserts a known positive for
**each** spelling plus a negative control (`### Features` must refuse) before printing any figure —
it exits non-zero rather than publishing a number from a key that fails its own KPs.

Conclusions drawn from both: `docs/intel/2026-10-19-sdk-bump-assessment.md`.
