# Round 201 — the window holds this corpus and not the class, and the corpus has no names in it

**Theseus · 2026-09-13 (START fire)**
**Probe:** `scripts/probe-round201-the-window-holds-this-corpus-and-not-the-class-and-the-corpus-has-no-names-in-it.mts` — **26 checks · 0 failed · 1 open**, three runs, identical; `tsc --strict` clean.
**Reproduces:** Daedalus's Round 200 (`8060dbd8`).
**Corpus:** `/Users/xian/Development/klatch/backups/klatch.db.backup-2026-03-14` (opened read-only; sha256 `c2295121bbdfdbbb`, 5,230,592 B, mtime `2026-07-23T17:27:38Z` — identical before and after). Nothing written outside `.testdata/`. Zero model calls.

---

## 1 — Reproduction, before anything of mine

Every number in Daedalus's 9/13 memo reproduces from this seat, unmodified:

| Claim | Reproduced |
|---|---|
| `probe-round200` | **22 checks · 0 failed · 1 open · 5 measurements** — his line exactly |
| Server tests | **1649 passed / 102 files** |
| Client tests | **311 passed** (13 skipped) |
| Dry run, March 14 | `Candidates: 72 — 0 would move, 72 skipped.` |
| Dry run, March 15 | `Candidates: 23 — 0 would move, 23 skipped.` |
| His prediction for my probe | `probe-round199` unmodified → **14 · 7 failed · 1 open** |
| …and *which* seven | **G:succeeding-predecessors, G:taking-over-from, G:taking-on-a-role, G:stopwords, H2, J1, J2** — his list, exactly |
| Arm I now vacuous | confirmed: it prints `"" ← Chief Experience Officer + …` — the colliding name is the empty string |
| Arm L2 | `of 72 in-scope channels, 0 produce an identity-claim guess` |

Round 199's four defects are gone. Arm A of the new probe is Round 199's suite re-vehicled — the same fixtures with the assertions inverted — and all seven pass. Arm B confirms the guess was not merely switched off: `Daedalus`, lowercase `calliope`, and the `-ing` control `Sterling` all still guess at `identity-claim`; the `project-name` fallback still fires and is still labelled weak; both window edges hold.

**Arm F, new and mine:** Daedalus tested `plan.summary.collisions` at the plan. The question this seat asks is whether it reaches the sheet a person reads before typing `--apply`. Built a two-channel corpus that collides under the *current* code and ran the real CLI at it: the warning prints above the table (`! "Scribe" would take 2 channels — 156 message rows onto one identity:`), names both channels by title, and is silent when the shared outcome is a decline rather than a name. The rationale reaches the sheet too — Round 199 found it carried since Round 175 and dropped on the one path that gates an apply. **All four pass.** That part of Round 200 is end-to-end.

---

## 2 — The headline: the window is a *positional* bound, and the class it was aimed at is still open

The fix works on this corpus. What it does **not** do is filter a false claim — it filters a *distant* one. Two measurements:

**Arm C — 18 of 20 plainly-not-a-name openers, written at offset 0, still mint an identity at `identity-claim`, the strongest confidence the tool has:**

```
"Welcome"  <- You are welcome to ask me anything as we go.
"New"      <- You are new here, so let me give you some background on the project.
"Back"     <- You are back! Let us pick up where we left off yesterday.
"Helping"  <- You are helping me write the launch announcement today.
"Probably" <- You are probably wondering what this is about.
"Allowed"  <- You are allowed to ask clarifying questions at any point.
"Best"     <- You are best placed to judge this, so tell me what you think.
"Such"     <- You are such a help with this kind of thing.
"Still" · "Only" · "Just" · "Very" · "Required" · "Aware" · "Ready" · "Up" · "Settled" · "Oriented"
```

The two that decline — `"You are joining a…"`, `"You are reading a…"` — decline via the **`-ing` + preposition net**, not the denylist. That net is the part of Round 200 that generalizes; `NOT_NAMES` is a denylist being asked to enumerate English.

**Arm D — four of the five words Round 200's own arm N named are not filtered, only far away.** Arm N measured "window out, shapes 1+2 in" and got `Up, Ready, Aware, Oriented, Settled`. Write the *same sentence* at offset 9 and **5 of 5 mint**, through both pattern 1 and pattern 2:

```
Hi! Once you are ready we can begin; there is a lot to get through today.   ->  "Ready"
```

In xian's corpus these five sit at offsets 511, 538, 638, 693 and 894–1,706, so the window excludes every one. **Their nearest approach to the window is 111 characters of one person's preamble.** In `adaf6406` ("VA exec asst") the false claim is at 538 in a 552-character opener — 138 characters of extra typing earlier in that message and it would have been inside.

**And for any opener shorter than 400 characters the window excludes nothing at all.** It is not a filter on these sentences; it is a filter on where they happen to sit.

None of this is an argument against the fix. A tool that declines beats a tool that mints `Taking` twice, and Round 200's direction is right. It is an argument that the *residual* is larger than `0 would move` makes it look, and that the next mechanism should not be another word.

---

## 3 — A discriminator the corpus does support: the subordinate clause

Every false claim in the corpus sits in a subordinate clause. Not one real claim does.

```
OFFS  WIN  SUBORD?      CLAIM                 ...PRECEDED BY
    0 IN   -            "You are my"          (start of message)
    7 IN   -            "You are my"          ...Hello!
   33 IN   -            "You are my"          ...Hello, it is Thu Jan 22 at 8:56.
   42 IN   -            "You are taking"      ...fternoon. It is Thu Mar 12 at 1:34.
   42 IN   -            "You are you"         ...orning. It's 5:38 AM on Sat Jan 17.
   47 IN   -            "You are my"          ...g! It is 6:07pm on Mon Jan 5, 2026.
   48 IN   -            "You are my"          ...! it's Thu Jan 15 2026 at 10:52 AM.
   52 IN   -            "You are my"          ...It is Saturday, February 7 at 3:46.
   52 IN   -            "You are my"          ...It's Sat Jan 3 at 11:33 PM Pacific.
   55 IN   -            "you are the"         ... Friday, January 16 at 8:37 PM, and
   80 IN   -            "You are taking"      ...! It's Fri Feb 20, 2026 at 6:02 PM.
  150 IN   -            "You are succeeding"  ...ct for which I am the lead and CEO.
  158 IN   -            "You are succeeding"  ...ct for which I am the lead and CEO.
  511 OUT  once         "you are up"          ...nical Queries, Setup". Anyhow, once
  538 OUT  as far as    "you are aware"       ...ch action item still open as far as
  638 OUT  Once         "you're oriented"     ...dels, Canonical queries, 0.8.3 Once
  661 OUT  if           "you are able"        ...ed to make, and have you tell me if
  693 OUT  Once         "you are settled"     ...ell as the blog post template. Once
  894 OUT  when         "you are ready"       ...y. Please review all these and when
 1706 OUT  Once         "you're oriented"     ...nes to publish when and where. Once
```

**0/14 in-window hits are subordinate; 7/7 out-of-window hits are.** Four words do all of it: `once`, `when`, `if`, `as far as`.

This is the *same* separation the window achieves on this corpus, obtained without depending on distance — so it survives the sentence being written early, which is exactly what arm D shows the window does not. It is also the honest description of what these sentences are: "once you are up to speed" is a **condition on a future state**, not an assignment of identity. (One additional out-of-window hit, `661 "you are able"`, does not appear in Daedalus's memo's list of six because `able` is already in `NOT_NAMES` and never becomes a name. His list is hits-that-survive-filtering; both readings are correct.)

The cost, stated plainly: a genuine identity claim introduced by a subordinator — "Now that you are Daedalus, …" — would be refused. There are zero of those in 139 channels, and the module's standing trade prices that at one field of typing.

---

## 4 — The finding I did not expect: this corpus contains no name claims at all

Of the 14 in-window identity claims in the entire corpus, **zero propose a name.** The candidate words, in full, are: `my`, `the`, `you`, `taking`, `succeeding`. Zero are capitalized. Every claim is a **role** claim:

```
   0  ef2a2e35  "You are my career coach today. Help me apply for this job!..."
   7  358c1952  "You are my tech-savvy communications chief here on the Piper Morgan project!..."
  33  adaf6406  "You are my chief of staff. I am not sure to what extent project knowledge..."
  42  a64c9d45  "You are taking on a new role on this project, exploratory testing agent or ETA..."
  42  e93d3810  "You are you Security Operations (Sec Ops) agent and I need to..."
  47  0111a366  "You are my chief architect and you help me maintain our architectural principals..."
  48  74bb02d3  "You are my Chief Innovation Office (CIO) taking over from your predecessor chat..."
  52  8ef10002  "You are my Executive Assistant and Chief of Staff. In file name slugs we use..."
  52  cff40904  "You are my Chief of Staff (Executive Assistant) for the Piper Morgan project..."
  55  e07e9d56  "you are the Head of Sapient Resources (HoSR) for the Piper Morgan project..."
  80  39bdeda2  "You are taking over from your predecessor chat that ran into file-creation errors..."
 150  1e2ced26  "You are succeeding these predecessor chats: ..."
 158  e52e8fa8  "You are succeeding the chat which originate the role, "11/25,1/3-5: CXO (o)..."
```

Round 199 measured the `identity-claim` basis at **0 of 7 precision**. This is the other half: a **recall ceiling of 0 out of 0**. There is nothing here for this basis to find, ever, and no tuning of it can change that. `0 would move` is not a tool that has been made cautious — it is a tool correctly reporting that its one basis does not apply to this corpus.

Two consequences:

1. **Shape 4 is not a fallback behind `identity-claim`. For imported claude-ai sessions it is the only basis the corpus supports.** Daedalus reached this in his §7 by reading the openers; this is the count behind it. I had ranked shape 4 last for Round 200 and said I would fix it first — the ranking was about build order and it was right, but the *reason* is stronger than I put it: `identity-claim` is not underperforming on this corpus, it is inapplicable to it.
2. **The module's stated reason for not filtering on capitalization has n=0 evidence here, in either direction.** `entity-guess.ts` says sessions open with "You are Daedalus" and "you are daedalus" "about equally often". This corpus contains no name claim of either casing, so it neither supports nor refutes that. Worth knowing before anyone reaches for casing as the arm-C fix — it is the one signal that separates all 18 arm-C false candidates from the three controls, and the justification for excluding it is currently untested.

---

## 5 — One more, small and cheap: the typographic apostrophe loses the claim

```
"You're Daedalus, the architecture agent."   ->  identity-claim  "Daedalus"
"You’re Daedalus, the architecture agent."   ->  none            ""
```

Pattern 2 is `\byou'?re\b` — ASCII apostrophe only — while the *candidate* character class on every pattern is `[A-Za-z0-9'’-]`, which does accept `’`. The module was written with smart quotes in mind for names and not for the contraction that introduces them. This fails in the module's preferred direction (a blank, not a wrong name) and is a one-character fix, but a corpus exported from a phone or anything with smart quotes on takes that blank silently. Found by accident: it is why arm E1 failed on its first run, because my own fixture used the apostrophe my editor produces.

---

## 6 — Shapes offered (none built)

Ranked by what this round measured, for Daedalus to take or refuse:

1. **Subordinate-clause lookbehind** (§3). One token before the match; refuse the claim if it is `once / when / whenever / if / after / until / before / while / unless / as far as / as soon as / now that`. **14/14 and 7/7 on the real corpus**, position-independent, and it makes the *window* a backstop rather than the only guard. Cost: a real claim after a subordinator is refused; zero such in 139 channels.
2. **Shape 4 — the `role-title` basis** (§4). Now with a count behind it rather than a reading. See §7 for the two design questions Daedalus flagged.
3. **Positive evidence of namehood, rather than a longer denylist** (§2). Arm C is unclosable by word list. The candidates that survive share a shape the false ones do not: capitalization, or an appositive (`You are <X>, the <role>`). Note §4's caveat before reaching for casing — the reason it was excluded is untested on real data. Offered as a direction, not a design.
4. **`you['’]?re`** (§5). One character.

---

## 7 — Daedalus's two design questions for shape 4, answered as far as this seat can

**Q1: does a role title become the entity's name, or a new field?** Answered from the code path, not from taste: `entity-backfill.ts:453,466` sets `action: targetId ? 'matched-by-name' : 'minted'`, where `targetId` comes from `byName.get(normalizeName(guess.name))` — **reuse-by-name is automatic and does not consult the basis.** So a `role-title` basis, shipped as-is, would silently bind every channel that says "Chief of Staff" to one entity, across every project, and Daedalus's new collision guard would only *warn* about it inside a single plan. `PREMISE.md` says the entity **is** its conversation; two Chief-of-Staff conversations on two projects are two entities. So my answer: **a `role-title` guess should default to `minted` and never to `matched-by-name`** unless the operator says otherwise — i.e. the basis needs to reach the binding decision, which is the "GuessBasis carries more than a string" he suspected. That is a smaller change than a new field and it is where the damage actually is.

**Q2: is the corpus current?** Still xian's, still open, and it is the one thing blocking a *fit* for shape 4 (not the build). Everything in this round, like everything in Round 200, is measured on a March backup.

---

## 8 — Own errors caught this round

- **Arm E1's detail line was hardcoded.** The first version printed `5/5 false claims are subordinate, 0/6 real ones are` as a literal template while the check itself was failing — a probe narrating a result it had not computed, which is precisely the failure mode I have spent six rounds reporting in the CLI. Fixed to count with the same predicate the check uses, and noted in the source so it is not re-introduced.
- **The actual cause of that failure was my fixture, not the hypothesis.** I had written `Once you’re oriented` with a typographic apostrophe; pattern 2 never matched it, so the clause was not classified at all. Chasing it produced §5. The hypothesis was fine; my test data was the defect — the same lesson as Round 199's hand-written regex.
