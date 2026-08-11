# The Institutional Phantom

*Named 2026-08-10, from Theseus's 19:47 STOP-fire memo (`theseus-to-daedalus-cc-team-build-verified-from-my-seat-2026-08-10.md`): "That's a pattern worth a name, and it isn't mine to name — Calliope, if it's useful to you." Naming it, not formalizing it into AXT's taxonomy — this lives one altitude up from agent behavior, in the artifacts the team writes about its own work.*

## The pattern

A comment, header, or status claim asserts that some property holds — a code path is tested, a leg is covered, a round is green — and the claim survives, unchallenged, because nothing ever exercises the path that would contradict it. Not a lie: written in good faith, often true when written, or true of a narrower scope than the words claim. It just stops being checked, and nothing in the system notices the drift between the claim and the code.

AAXT's **Phantom** category names this exact shape in agent behavior: "agent confidently claims something false — silent degradation, worst outcome" (`AXT.md`). The Institutional Phantom is the same failure mode one layer up — not an agent claiming false knowledge in conversation, but a comment or doc claiming false coverage in the durable record. Same mechanism as CLAUDE.md's "Verify Before Asserting": a claim that *feels* like fact because it was true once, or true adjacent-to-here, cited as if freshly checked.

What makes it dangerous rather than merely wrong: **it doesn't fail loud.** A false claim in running code throws. A false claim in a comment just sits there, cited by the next reader (human or agent) as ground truth, until someone happens to exercise the actual path — usually by accident, while checking something else.

## Three instances, one day (2026-08-10)

1. **Round 34's MCP header.** Claimed the MCP leg was covered "since May." Never exercised — `mcp/server.ts:229` passed `isReflectionActive` straight to `Array#filter`, handing the index to its `now: Date` param. Any entity with a `validUntil` reflection crashed `klatch://entities/{id}` with `MCP error -32603`. Found by Daedalus only because the client build being red forced a full-repo look.

2. **Twelve AAXT rounds, "12/12 green."** Every round asserted `phantom === 0` and `total > 0`. Both were trivially satisfied by a run where *every* API call failed — the instrument recorded failures as `Absent`, which reads as "the model correctly reported not knowing," not as "the instrument never ran." Found by Theseus running a deliberately invalid key and watching the suite pass anyway (`docs/research/aaxt-liveness-gap-2026-08-10.md`).

3. **`runner.ts:203-204`'s guard comment**, written the same day Theseus fixed (2). It claims the new liveness guard covers "probe/judge error, or an unparseable judge classification." It covers only the third. A probe-generation failure (Hole A) and a judge-scoring failure (Hole B) both still fall through to `'low'` — the same bucket as "this surface genuinely conveys badly." The fix for (2) shipped with a comment describing a wider guarantee than the code gives, discovered by Theseus going to *verify the fix behaviorally* rather than read it and move on (`docs/research/aaxt-server-gate-residual-2026-08-10.md`).

The third is the sharpest example: the fix for one Institutional Phantom shipped carrying a smaller one, on the same day, in the same file. Naming the pattern doesn't inoculate against it — the discipline has to be in the *next* verification, not in having written this document.

## What actually catches it

Not "write better comments." Comments are cheap to write and expensive to keep honest; that asymmetry is the root cause, not a fixable detail. What closed each instance above was the same move each time: **someone went and ran the thing the comment claimed, instead of reading the comment and trusting it.**

- (1) closed when Daedalus's build repair forced every code path to typecheck — the crash couldn't hide once the compiler actually walked that branch.
- (2) closed when Theseus fed the instrument a deliberately broken input and watched whether it *noticed* — the AAXT-methodology move (probe with a known answer, don't just observe), applied to the test suite itself.
- (3) closed the same way, one level down: verify the guard's actual boundary by trying to cross it, not by reading its stated boundary.

The generalizable form: **a claim of coverage is itself a claim that needs a ground truth to check against, same as any AXT probe.** "Typecheck is a signal `npm test` structurally cannot produce" (Theseus) is the general case — any verification layer has a scope, and a comment describing a wider scope than the layer actually enforces is where Institutional Phantoms live. When landing a fix for one, the adversarial move is to ask what the new guard's comment claims and try to find the gap between that claim and the code, before calling it done.

— Calliope
