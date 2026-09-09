# Round 177 — Iris's Browse "Done" seating, verified in a real browser

**Theseus · 2026-09-09 (START fire)**
**Instrument:** `scripts/probe-round177-browse-done-seating-in-a-browser.mts`
**Under test:** Iris's Round 174 fix — `ImportDialog.tsx:654`, `ChannelSidebar.tsx:132` (`docs/ux/browse-done-seating-2026-09-09.md`)
**Result:** **25/25 regression checks pass · 0 open · 34 measurements.** Two full runs, same result both times. Zero browser console errors across the whole drive. Zero model calls, zero API spend. `packages/` diff unchanged, asserted in-probe. Scratch DB and a synthetic `CLAUDE_CONFIG_DIR` under `.testdata/`; xian's data never opened.

---

## Why this fire went here

Iris closed her memo with the gap named plainly:

> **Not verified:** no live browser walkthrough this fire — same caveat you and Daedalus have both named at every layer of this feature; code-and-test only against the documented contract and mocked API.

Her five new tests are jsdom against a mocked API client. That layer is genuinely valuable and it is not this one. This is the same route on real Chromium, a real Vite build, a real Hono server, real SQLite, and real session files on disk — the layer that has now caught something at three consecutive rounds on this feature, including a Round 173 fixture that went green while not matching the shape it claimed to mock.

**The instrument reported her change before I asked it to.** I re-ran the unmodified Round 174 probe first, and it hung for 60 seconds waiting on `getByRole('button', { name: 'Done' })`. That is Iris's rename arriving in a real browser: `ImportDialog.tsx:654` now reads `composeMode && bulkResult.imported.length === 1 ? 'Use this agent' : 'Done'`. A stale probe failing loudly on a deliberate copy change is the correct behavior, and it is why the notice strings in these probes are read out of the component source rather than retyped.

## Both halves of the Round 174 finding are closed

Round 174's finding was that the obvious button discarded the seat Daedalus's Round 173 fix had just made reachable. Both halves are separately falsifiable — "the button does the right thing" and "the button says what it does" — and the defect was in the second, so both are asserted.

**D1 — one session.** The compose-mode primary reads **"Use this agent"** (Round 174 measured `"Done"`). Pressing it produces `chips=["Tarn"] · notice=null` — Round 174 measured `chips=[] · notice=null` at this exact point. The seated agent is not the shared default. The vocabulary split with the manual path (`ImportDialog.tsx:585`) is gone.

**D2 — two sessions.** The primary correctly goes *back* to reading "Done" when there is more than one row, which matters: "Use this agent" would be a lie about what it does there. Pressing it gives `chips=[] · notice="Imported 2 agents — pick one from the list to seat it."` — Round 174 measured `notice=null`. The notice is asserted against the exact string read from `ChannelSidebar.tsx:132`, not for non-emptiness, because "seat none" is only a defensible ruling if the user is told; a seat-none that says nothing is the silence being fixed.

And the softening half is now a check rather than a hope: both agents are still minted and in the picker afterwards (`["Claude","Wren","Tarn","Bramble","Sorrel"]`). **"Seat none" must not mean "import nothing,"** and it doesn't.

## Iris's N > 1 reasoning, restated because I agree with it and had the opposite instinct

My Round 174 memo split Daedalus's open question and leaned toward "seat all up to the cap, say what was displaced." Iris ruled "seat none, say what was imported," and her reason is the one I had flagged without following to its conclusion: **a Chat's cap-1 roster cannot receive three candidates under any rule shared with a Klatch's cap-5.** Seat-all needs ordered multi-seat plus displacement copy, in a surface where the two destinations disagree about how many seats exist. Seat-none needs one more branch in notice machinery that already exists. Gall's law points the same way, and the silence — which was the actual defect — is fixed either way, so the ruling stays reversible on evidence rather than being locked in by the fix.

## Regression cover carried forward, and why it belongs in the same run

N1, N2, N3 and X are carried unchanged from Round 174. They are not padding: the seating path Iris edited is the one Daedalus's `entityId` change made reachable at all, so it is precisely the code most able to break underneath her. All four still hold —

- **N1** a confirmed name seats that agent, and the composed channel survives to `prompt-debug` bound to it (`entityName="Wren"`, not the placeholder)
- **N2** a blank name seats nothing and shows the unidentified notice
- **N3** typing `"Claude"` still seats Claude — Round 172's arm B3, still green on this route
- **X** N2's and N3's channels are bound *identically* (`default-entity` both), which is the standing measurement of why the row's `entityId` is load-bearing: the channel cannot tell the two cases apart, so one of its two answers would be a lie

## Nothing open

No open items from this drive. The Round 174 thread — Daedalus's Browse fix, Iris's seating ruling, and both halves of the affordance finding — closes here.

## Not claiming

This drives the Browse route in compose mode. The manual path's equivalents were driven in Rounds 171/172 and are not re-driven here. The N > 1 ruling is verified as *built*, not as *right* — whether "seat none" is the behavior xian wants is his call, and this probe pins what it does so a later reconsideration has something to change against. Commits are local as of writing; the wrapper owns delivery.
