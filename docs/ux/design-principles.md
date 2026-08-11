# Klatch Design Principles

**Author:** Iris, with xian
**Status:** Living document — grows from real design decisions
**Started:** 2026-04-12
**Last updated:** 2026-04-12

These principles emerged from conversations between xian and Iris during the UX discovery phase (April 5-12, 2026). They are not a manifesto or a rigid system. They document how xian thinks about design, grounded in decades of UX and product practice. The principles are meant to support consistency without imposing doctrine — a guide for Iris, Daedalus, and future contributors.

New principles should be added as they surface from real design decisions, not from speculation. Each should cite the decision that revealed it.

---

## The meta-principle

**Who bears the burden?**

Every design question in Klatch can be restated as: *who should carry this particular burden — the system, the interface, the user, or the evidence?* The answer is always: the entity best equipped to handle it.

This is Tesler's Law generalized. Complexity, communication, mechanical work, and design speculation are all forms of burden that can be relocated. Klatch's job is to relocate each burden to the right bearer.

---

## Four clusters

### 1. Absorb complexity

*The tool bears the complexity burden so the user encounters simplicity.*

- **Tesler's Law is the project's load-bearing design principle.** The complexity of cross-environment context management is irreducible. It can only be relocated — into the tool or into the user's head. Klatch chooses the tool.
- **Smart defaults with power-user override.** The default experience should be unburdened. Configuration exists for those who seek it, but the system does the right thing without being asked. Don't overload casual users with choices.
- **Service design, not configuration screens.** The export isn't a form the user fills out. It's a service the product provides — like a moving company guiding a homeowner through what can and can't be shipped.
- **Don't push configuration onto users.** Every choice surfaced to the user is a burden relocated from the system to the person. Earn each one.

### 2. Communicate with clarity

*The interface bears the communication burden so the user encounters honesty and focus.*

- **Clarity and focus.** One action per screen. Mobile-first discipline as a design constraint, not a platform-specific treatment.
- **Frame handoffs, not losses.** When something can't transfer (Layer 5 behavioral calibration), the framing is "information transfers; judgment is recoverable through use" — not "here's what you're losing." The user is not a victim.
- **No separate "mobile UX."** Holistic design for users who are sometimes mobile. The same design adapts to context through progressive disclosure and information density — not through separate layouts or flows.
- **Honest, specific, shows the work.** The blog's voice — precise but not clinical, personal but not casual — should inform how the product communicates. Name uncertainties. Don't hide behind vague language.
- **Negative state needs explicit representation, not implicit absence.** When a UI says "X exists when N > 0" without saying "X doesn't exist when N === 0," users can't distinguish "nothing here" from "I don't know." Zero is a real state that deserves its own signal. Surfaced by Theseus's UI-as-context AAXT (Rounds 36/37/38, 2026-05-18) — three findings (collapsed sidebar projects, missing zero-files row, asymmetric import badges) share this shape. User-surface analogue of the agent-side Subliminal classification: data is present (zero is real), surface obscures it (no visible signal for zero).
- **Render the categories that could exist, not just the ones that do.** Sibling to the above, scoped specifically to panel surfaces. Conditional rendering ("only show X when N > 0") hides the categorical state of an object — a user can't tell whether the object doesn't have that category vs. whether the UI doesn't surface it. The right pattern: always show what the object *could* have, with empty-state language for what doesn't apply. The Channel context (L4) textarea is the positive instance — always rendered with a framing-rich label ("Channel context (purpose, agenda, constraints — injected into every message)") — and it scored 100% conveyance in Theseus R39 AAXT precisely because it follows this pattern. Surfaced by Theseus's R39 UI-as-context AAXT on ChannelSettings (the "junk drawer" panel from F4.4): the panel scored 54.5% conveyance — the lowest of any UI-as-context surface — because pinned files, source provenance, project assignment, and other categorical concepts all disappear when their underlying data is absent. Propagating the channel-context pattern to other panel surfaces would address most of the R39 findings without redesign.
- **Presentation must not imply a guarantee the mechanism doesn't provide.** Klatch's discretion model (spec-composition-gesture.md §6, landed 2026-08-09) has no platform-enforced privacy boundary — ground rules ("Chatham House rules" for a klatch, or a 1-1's implicit expectation of directness) are a convention agents are asked to follow, never a wall the system verifies. A user can be technically un-deceived (the mechanism is documented) and still feel surprised in a way that reads as a broken promise, if chrome borrowed from apps where the boundary *is* enforced (lock icons, "private"/"DM" language, confidentiality-flavored copy) leaks into a surface that can't back it. Concretely: don't reach for that vocabulary in the 1-1 view, and when the ground-rules-prompt affordance is designed, say plainly that it's a convention the agent is asked to honor, not enforcement. Verified 2026-08-10: no current surface uses this language today (`grep` across `packages/client/src` for lock/private/DM chrome — clean), so this is a standing constraint on new surfaces, not a fix to an existing one. Surfaced by xian via Calliope, responding to the discretion-model answer (`calliope-to-iris-ux-avoid-false-privacy-impression-2026-08-10.md`).

### 3. Preserve human agency

*The system bears the mechanical burden. The human bears the judgment burden.*

- **Smart bottleneck vs. dumb bottleneck.** Every workflow step can be tested: is this mechanical work the user is forced to do because of tool boundaries (dumb), or judgment work the user wants to do because it requires their intelligence (smart)? Automate the dumb. Preserve the smart.
- **Review is central, not a rubber stamp.** When an LLM drafts something for human review (field notes, synthesis, summaries), the review experience must feel meaningful — structured items presented one at a time with friction in the right places, not a wall of text with an "Approve all" button.
- **Accountability stays human.** The output goes under the user's name. Final sign-off is always a smart bottleneck. Never automate the user out of their own process.
- **Heroism is a failure mode.** Rushed, pressured work is not a virtue. The system should support steady, sustainable pace — not create urgency.

### 4. Build from evidence

*The evidence bears the design burden. Build from what you've observed, not from what you've speculated.*

- **Gall's Law.** Each feature is the smallest working increment. Complex systems evolve from simple ones that work.
- **Generalize from worked examples.** Anchor on strong jobs-to-be-done (daily omnibus, weekly ship). Look for patterns by observing what worked, not by speculating about what might. The interaction modes (panel/roundtable/directed) are first sketches, not a finished taxonomy.
- **"Methodology beats code."** Process infrastructure (documentation, coordination, session protocols) often achieves more than code frameworks. Independently validated across both Klatch and Piper Morgan.
- **No bias-to-action pressure.** Prefer slow, steady work to rushed delivery. "No points for rushing" is a load-bearing principle, not decoration.

---

## Developing areas

These are gaps in the design principles where xian has instincts but hasn't fully articulated positions. They will develop through real design decisions.

### Visual language

High standards, no specific imposed aesthetic or style. Xian does not have a unitary visual system to require. The visual identity will develop through conversation and concrete decisions as the interface evolves. What matters is quality and coherence, not adherence to a predetermined look.

### Error and recovery

Xian has strong, long-standing opinions here:
- Error messages must be in **plain language**, never cryptic.
- Errors must provide a **recovery path** — or at minimum a workaround.
- Errors must be **logged** for debugging.
- The ideal is **self-healing**: the system detects and resolves the problem without bothering the user.
- In the AI era, interfaces can **troubleshoot themselves** — an LLM-assisted error recovery layer is a natural extension of the service design principle.

### Delight and personality

This matters. Xian's quirky personality and taste should be expressed in the product — not as imposed decoration, but as moments of flavor that emerge naturally. The blog has personality (TMBG references, Bobiverse analogies, mythological agent names). The product should too, in places where it adds warmth without being non-constructively idiosyncratic. Be on the lookout for these moments rather than manufacturing them.

### Density vs. breathing room

The primary mechanism is **progressive disclosure**. Start focused and spacious. Reveal density on demand. The threshold between "focused beginner" and "dense expert" isn't a hard line — it's a series of affordances that let the user pull more information toward them when they want it.

### Agent experience design

This is frontier territory. Xian can reason by analogy (the five-layer model, the kit briefing, Layer 4 as purpose communication) but doesn't have deeply rooted opinions about how to design *for* agents. This is a new discipline — not UX (human-facing), not DX (developer-facing), but AX (agent-facing). Understanding is still forming. Needs further discussion as real agent-facing design decisions arise.

---

## How to use this document

- **When making a design decision:** Check whether the decision aligns with the four clusters. If it violates a principle, that's a signal to reconsider or to articulate why the exception is warranted.
- **When a new principle surfaces:** Add it to the appropriate cluster with a citation to the decision that revealed it. If it doesn't fit a cluster, it might reveal a new cluster.
- **When principles conflict:** They will. "Absorb complexity" can conflict with "preserve human agency" (the system can't absorb judgment complexity without removing the human from the loop). The meta-principle resolves this: who is best equipped to carry *this specific* burden?
- **When in doubt:** Ask "who bears the burden?" and "is this a smart bottleneck or a dumb bottleneck?" These two questions resolve most design disputes.
