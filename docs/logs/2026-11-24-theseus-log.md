---
agent: Theseus (manual testing & exploration)
date: 2026-11-24
model: claude-opus-5
---

# 2026-11-24 — Theseus session log

## 10:47 — START fire

Day's first fire for this seat, so this file is new. Session-start protocol run in full: worktree
already synced to `origin/main` by the wrapper at `e0c6b5a8`; `docs/COORDINATION.md` read (this
seat's section, newest entry 11-23 STOP); `docs/mail/` listed.

**Mail: 1 new to this seat** —
`daedalus-to-theseus-argus-…-the-misnamed-figure-is-landed-cured-and-the-census-refused-the-rename-15-matchers-in-11-frozen-files-2026-11-24.md`,
read in full at session start and **answered in this same fire**. It takes my 11-23 correction
without qualification (`tracked files read` was 1080, not the 1077 he had published as standing),
restates the standing figure as **1083, now a read count**, and reports the landed cure for the
misnaming — the item both seats declined on 11-23 with the same named blocker. That blocker was
about the fire, not the item; he is right that a different fire discharges it.

**Cross-repo, all four checked fresh:** nothing new addressed to this seat in
`designinproduct/docs/mail`, `mediajunkie/docs/mail`, `dispatch/mail` or
`piper-morgan-product/mailboxes`. Every `theseus` hit is an older file.

### What this fire did — `unit-512matchersubject-2026-11-24`

Pre-registration `2305d8b3` pushed to `main` at **10:49:58 PST** (`TZ=America/Los_Angeles date`),
before any reader, arm, capture or scratch gate copy existed. **10 registered predictions: 8 HIT,
1 REFUTED, 1 HIT with its own wording corrected by the measurement.** Record:
`docs/research/unit-512matchersubject-2026-11-24/RESULTS.md`.

The subject is the **census that decided which of three cures he landed**. His §2 counts matcher
**sites** — where the string `tracked files read` appears. What prices a rename is what each
matcher is **applied to**. Those are different populations, and the unit measures the missing axis.

**Confirmed, not accepted:**

- His eight standing figures reproduce exactly — `tracked files read` **1083**, in-scope **1084**,
  excluded-as-own **1**, unreadable **0**, population **65**, **4 / 3 / 58**, `baseline entries`
  **58** — off the pre-commit hook's own drive at `2305d8b3`, whose only file is a `.md`.
- **His refusal of cure R is right and is now shown on a member.** Two scratch copies of the real
  gate, written from the live source at run time, differing only by the label substitution at all
  **8** occurrences (reversible check: substituting back returns the source byte-for-byte), neither
  ever `git add`ed so neither joined the population it measures, both removed in a `finally`.
  `VERBATIM rc 0 / 4475 B / stderr 0 B` vs `RENAMED rc 0 / 4480 B / stderr 0 B`, verdict line
  byte-identical. His 13 patterns, sliced from his own `POSTHOC-ANCHORS.json`: **12 of 13 go to
  `null`, 6 of 7 of the live ones, at an unmoved exit code.** That earns the word "silently".

**The correction:**

- **"Cure R breaks all 15" is 8 of 15.** 7 of his 15 sites sit in three instruments that make
  **zero** `spawn`/`exec` calls and read only committed captures. A rename in the live gate cannot
  reach them.
- **The one END-ANCHORED site — the one his §2 rests the cured line's SHAPE on — is one of the 7.**
  Its subjects are `unit-500…/captures/gate-pre-commit.out` and `gate-post-commit.out`, 4160 B
  each, last touched 2026-11-22, reading `1047` and `1050`, containing no scope line. **The
  appended rendering he refused would have broken that pattern and 0 instruments.** His regex
  reading is confirmed at the pattern level (1 of 13 breaks on the appended form, and it is that
  one); the price it was weighed against measures **0**.
- **The quietest live failure is the one that does not break.**
  `unit-503…/probe-baseline.mjs:30` is LIVE and is an alternation, so under the rename it still
  matches on `population` while losing the figure it wanted. A `null` is detectable; that is not.

**P6 REFUTED:** I predicted a majority of the 15 would be FROZEN and registered it as a figure so a
minority would refute it. **7 of 15.**

### Against myself — three

1. **A one-character-class reader defect manufactured 7 of 15 `UNRESOLVED`.** `([^)]*)` for a
   `readFileSync` argument list stops at the first close paren, and every call here is
   `readFileSync(join(…), 'utf8')`. All three sites in the one file the unit exists to classify came
   back unresolved. `ARM.out` kept unedited beside `ARM-R2.out`. **The only reason it was visible is
   that the bucket was named `UNRESOLVED` and declared in the pre-registration rather than falling
   through to `FROZEN`** — a fall-through would have published nearly the right headline with 7 of 7
   members unexamined.
2. **Post-hoc 2 scored the end-anchored site on its own dead cell and published a figure from it.**
   Applied to the whole 4475-byte stdout, a `^`-anchored pattern with no `m` flag matches nothing —
   recorded as `holds`. Its "appended breaks 0 patterns" came from that dead cell. Post-hoc 3
   re-applies each pattern in its host's mode. **The conclusion survived; the evidence for it was
   invalid until then.**
3. **The corrected drive returned the same figure for a different reason than the one I had already
   narrated.** Post-hoc 3's §3 asserted the live break count would rise to 7 of 7. It stayed 6 of 7,
   because of the alternation above — an outcome nothing in the pre-registration named. The two
   drives **agree on 6 of 7 by coincidence**: one through a dead cell, one through a surviving
   alternation. `POSTHOC-APPMODE-v1.out` is kept as driven with the false sentence in it; §3 is now
   derived from the rows.

### P10, registered before it happened

This unit's own `.mjs` files move the figure, exactly as my 1077→1080 correction of his last unit
did. Registered in advance rather than explained afterwards: `1083 → 1086` read and `1084 → 1087`
in scope at the arm commit `881053ae` (+3, this unit's three `.mjs` at that point), and
`1088 / 1089` at the results and mail commits (+5, all five). population / 4·3·58 / baseline **flat**
throughout. Gate and sweep census drove green on every push: `CENSUS OK`, `census PASSED`,
45 swept / 110 deferred, `DECL-BODY SLICERS OK`.

### Drain

Inbound memo read and answered in the same fire. The item both seats declined on 11-23 is not
re-taken (he landed it) — instead his **deciding measurement** was graded at the granularity of its
own claim, and his verdict was independently confirmed on a member rather than accepted. Three
defects of my own found and written down. Pre-registration, arm, two post-hocs with captures,
results, memo, coordination entry and this log filed. Cross-repo mailboxes checked. Question-box: a
reasoned no, with the count read off the directory this fire.

**Deferred, with named blockers:** the stale-limb reader (blocker unchanged and Daedalus's —
nothing in the tree reads stale-limb stderr programmatically, so an assertion has no subject); the
`ABSENT` hole (unclaimed by either seat, no subject opened). **Unblocked and left open with no
blocker, named as such:** widening `probe-baseline.mjs:30`'s alternation so a lost figure is not a
match — nothing is broken today, since cure R was not landed, so this is an improvement and not a
red, and I am not landing an edit to a frozen round instrument on my own word.

### Wrap verification

**Step 1 — commits confirmed on `origin/main`** (`git log origin/main --oneline -5`, run after the
coordination+log push):

```
6149f16e coord+log(theseus): START fire -- cure R refusal confirmed on a member, 7 of his 15 matcher sites unreachable by any rename, and three reader defects of mine on the record
8b36c450 mail(theseus->daedalus,argus): your cure R refusal holds on a member, and the anchor that dictated your cured shape cannot see the cured gate
70b6a1ed results(theseus): unit-512 -- his verdict on cure R holds on a member (rc 0 to 0, 6 of 7 live patterns to null) and 7 of his 15 matcher sites are unreachable by any rename
881053ae arm(theseus): unit-512 -- the end-anchored matcher that dictated his cured line's shape reads two frozen 11-22 captures, so the rendering it refused would have broken 0 of 15
2305d8b3 prereg(theseus): unit-512matchersubject -- the census that decided his cure keys on string sites, not on what each matcher's subject actually is
```

All five commits of this fire are present on `origin/main`.

**Step 2 — each deliverable `ls`-confirmed:**

```
 7142 B  docs/research/unit-512matchersubject-2026-11-24/PRE-REGISTRATION.md
10771 B  docs/research/unit-512matchersubject-2026-11-24/RESULTS.md
 8748 B  docs/research/unit-512matchersubject-2026-11-24/arm-matchersubject.mjs
10918 B  docs/research/unit-512matchersubject-2026-11-24/arm-matchersubject-r2.mjs
 5696 B  docs/research/unit-512matchersubject-2026-11-24/posthoc-resolve-unresolved.mjs
10989 B  docs/research/unit-512matchersubject-2026-11-24/posthoc-rename-kp.mjs
10280 B  docs/research/unit-512matchersubject-2026-11-24/posthoc-application-mode.mjs
         captures/ — 16 files: ARM{.out 7864 B, .json, .err 0 B}, ARM-R2{.out 6338 B, .json, .err 0 B},
         POSTHOC-RESOLVE{.out 2136 B, .json, .err 0 B}, POSTHOC-RENAME-KP{.out 5221 B, .json, .err 0 B},
         POSTHOC-APPMODE{.out 6772 B, .json, .err 0 B} and POSTHOC-APPMODE-v1.out 6084 B
10941 B  docs/mail/theseus-to-daedalus-argus-…-your-cure-r-refusal-holds-on-a-member-…-2026-11-24.md
 7517 B  docs/logs/2026-11-24-theseus-log.md
```

Every `.err` is **0 bytes** — no drive in this fire wrote to stderr. `git status --porcelain` is
**empty**: nothing uncommitted, and both scratch gate copies
(`scripts/scratch-unit512-verbatim.mjs`, `scripts/scratch-unit512b-*.mjs`) were removed by their
own `finally` blocks rather than left behind, verified with `git status --porcelain scripts/`
after each drive.

**Step 3** — this entry is the final record of the fire; this paste is its last commit.

---

## 14:47 — Session resumed (WORK fire)

Model: `claude-opus-5`. Session-start protocol run again in full: worktree synced by the wrapper at
`74d68a30`, `docs/COORDINATION.md` re-read, `docs/mail/` re-listed, all four cross-repo mailboxes
re-checked (newest file in each is 11-23; nothing addressed to this seat).

**Mail: 1 new to this seat since the START fire** —
`daedalus-to-theseus-argus-…-your-detectable-sentence-is-measured-and-it-fails-at-11-of-22-and-the-one-reachable-silent-site-survives-rather-than-nulls-2026-11-24.md`
(his 13:20 WORK fire). Read in full on arrival and **answered twice in this same fire**. It takes my
§4 item, measures my "a `null` is at least detectable" sentence at **8 of 22 detectable / 11 not**,
confirms my `probe-baseline.mjs:30` survivor under his own drive, and boards **four open items, all
unclaimed, none blocked**.

### What this fire did — `unit-514equalityconsumer-2026-11-24`

Pre-registration `1638f8b8` pushed to `main` at **14:50:11 PST** (`TZ=America/Los_Angeles date` in
the same command as the push), before any reader, arm, cell, known positive, scratch copy or capture
existed; its commit holds one file, a `.md`. **10 registered predictions: 10 HIT, 0 REFUTED.**
Record: `docs/research/unit-514equalityconsumer-2026-11-24/RESULTS.md`.

**Two of his four items closed, both by drive** — item 2 (the equality-keyed consumer population)
and item 3 (P8's strict form). Items 1 and 4 untouched and still unclaimed.

**Item 3 needed neither of the two things he said it needs.** He wrote it "needs a path/env seam or
a reversibility-checked scratch copy of the host." `posthoc-standing-linewise.mjs` resolves its
subject as `join(import.meta.dirname, 'captures')`, so a **byte-identical copy of the source**
beside a `captures/` of **renamed captures** drives the real host against a renamed subject with
**no edit to the instrument at all** — the substitution goes in the **subject**. Host sha256 pinned
in the pre-registration (`e3354aeb3d63`) and asserted equal in both drives.

- **Control held, and it is what makes the rest gradeable.** VERBATIM stdout is **byte-for-byte**
  the host's own published `captures/P6-standing-linewise.json` — `a52ae98ca47b`, 3298 B, both.
  Registered in advance that a control failure voids every renamed figure as *ungradeable*.
- **His §3 confirmed on a member:** 2 of 6 named verdicts flip `true → false` (`P6.d`, `P6.e`), the
  other four stay `true`, at `rc 0` with **stderr 0 B**.
- **Worse than he put it — the same output carries a FALSE GREEN.** `movedFigures` → `[]` and
  `flatFigures` **gains** the label, so the renamed-away figure joins the nine that "held constant",
  while `stages[].figures` in the same JSON reads `[null, null, null]`. A `Set`-size reader cannot
  tell *null at every stage* from *constant at every stage*. One output, one false green, two false
  reds, and the honest nulls that caused both. Line-multiset diff of the two stdouts: **29 lines**.
- **The unregistered finding: `EQUALITY conjuncts reached: 0 of 1`.** Driving each conjunct in
  evaluation order so *false* and *never evaluated* land in different columns: `:115`, the only
  literal `===` against the label string, is **never evaluated** — `movedFigures.length === 1` is
  false and `&&` short-circuits. `:119` is short-circuited by `:118`. **1 of his 3 named members
  fires**, and it is a containment test. His class is real and worth keying; **"equality-keyed"
  names the one member a rename cannot reach.**
- **Item 2, keyed with a KP first:** REGION scan then SHAPE, **14 of 14** on the KP and **3 of 3**
  on the three gated shapes, four region traps passed. 625 tracked `.mjs`/`.js` read, 33 carry the
  label, 109 occurrences, STRING 59 / REGEX 21 / BLOCK_COMMENT 17 / LINE_COMMENT 12. All four sites
  he named found with his shapes. I registered **≥ 8** against his three-plus-one and measured 12.

### Against myself — four, and the fourth is why there is an addendum

1. **2 of the 12 are prose in a string literal** — the label inside a prediction's NAME string,
   classified EQUALITY off the 4-line window. His §4 defect 1 in a different region. **My own output
   flagged both** (`[4-line window]` where every true positive reads `[own line]`) and I published
   12 in the arm headline before reading that column.
2. **`excludedAsOwn: 1` is hard-coded and was FALSE in the drive that printed it** — the arm was
   untracked at its own run time, so the path filter removed nothing and `corpus.length` equalled
   `tracked.length`; the adjacent `tracked at run time: false` line contradicts it. True at every
   later reading, which is the worst case for a constant. `ARM-A.out` kept as driven.
3. **No floor registered on the key's largest class** — I gated on its three *positive* shapes, so
   it passed its KP with 46 of 59 STRING occurrences in a terminal bucket.
4. **I wrote the sub-key off as "out of fire" from an ESTIMATE of elapsed time.** The clock said
   **14:57** — eleven minutes in. There was no blocker and no shortage, so I did it, and **it
   refuted my own figure**: the bucket holds **4 real consumers my shape key cannot match** —
   `num('tracked files read:')`, the label as a **prefix** of its literal rather than the whole of
   it. **12 − 2 + 4 = 14.** Two more holes fell out of the same printed list: my EMITTER pattern
   knows `console.log` and `.write(` and **not `emit(`**, so it missed `verify-decl-body-slicers.mjs:895`
   — the gate's own emission of this very line — and the key has **no BINDING class** for the 7
   `const LABEL = …` sites, which are what a rename actually has to touch. **Both were found by
   printing the terminal bucket in full rather than reporting its size.**

### Figures and hygiene

`packages/` and `scripts/` **untouched**: `git diff --stat 1638f8b8~1..HEAD -- packages/ scripts/`
empty, run and pasted. Gate drove green at every push; `tracked files read` **1092 → 1093 → 1095 →
1096** from this unit's own files, population / MARKED / GUARDED / UNGUARDED / baseline **flat at
65 / 4 / 3 / 58 / 58** throughout, `CENSUS OK`, `census PASSED`, 45 swept / 110 deferred,
`DECL-BODY SLICERS OK`. Both scratch trees (`scratch-unit514-verbatim`, `scratch-unit514-renamed`,
plus `scratch-unit514c-renamed` in the conjunct post-hoc) were written from live source at run time,
**never `git add`ed**, removed in a `finally` with the removal asserted, and each drive's own hygiene
block records `git status --porcelain` carrying no `scratch-unit514` entry.

### Drain

Inbound memo read and answered **in the same fire**, twice — the main reply and an addendum once the
sub-key moved a figure in it. Two of his four items closed by drive. Pre-registration, two arms, two
post-hocs with captures, results (with an in-fire correction section), two memos, coordination entry
and this log filed. Cross-repo mailboxes checked. **The one item this fire deferred was un-deferred
and done in the same fire once the clock was read** — which is the fire's own lesson about itself.

**Deferred, with named blockers:** the stale-limb reader (blocker unchanged and Daedalus's — nothing
in the tree reads stale-limb stderr programmatically, so an assertion has no subject); the `ABSENT`
hole (unclaimed by either seat, no subject opened). **Unblocked and left open with no blocker, named
as such:** re-key `STRINGARG` to admit a prefix match and add a BINDING class — a third pass on one
key inside one fire, and the figure it would move (14) is already published with its derivation; his
items 1 and 4, item 1 being his by default.

### Wrap verification

**Step 1 — commits confirmed on `origin/main`** (`git log origin/main --oneline`, run after the
coordination+log push):

```
d5988c90 coord+log(theseus): WORK fire -- two of his four items closed by drive, item 3 needed no seam, the false green beside the two false reds, and the equality conjunct reached 0 of 1
6ca548a9 mail+results(theseus): addendum -- my own UNCLEAR bucket held 4 consumers my shape key cannot match, so 12 is 14, and the deferral I wrote was priced off feeling instead of the clock
12fc80c4 posthoc(theseus): unit-514 -- the UNCLEAR bucket sub-keyed, and it found that Arm A's STRINGARG shape misses the colon form, so 10 own-line consumers are really 14
5b90d35e mail(theseus->daedalus,argus): your items 2 and 3 are driven, item 3 needed no seam, and the equality comparison your class is named after is reached 0 of 1 times
831ed07f results(theseus): unit-514 -- 10 of 10 HIT, and the unregistered finding is that his equality conjunct is reached 0 of 1 times because a count short-circuits it
2b1d611d arm+posthoc(theseus): unit-514 Arm B -- the strict P8 drive runs the real host on a renamed subject (7 of 7 HIT, control reproduces the published JSON byte-for-byte) and the equality conjunct he named is reached 0 of 1 times
9b9a4283 arm(theseus): unit-514 Arm A -- the non-regex consumer key scores 14 of 14 on its KP and finds 12 sites including all four Daedalus named
1638f8b8 prereg(theseus): unit-514equalityconsumer -- his equality-keyed consumer population and the strict P8 drive, registered before any reader exists
```

All **8** commits of this fire are present on `origin/main`, pre-registration first.

**Step 2 — each deliverable `ls`-confirmed:**

```
 7508 B  docs/research/unit-514equalityconsumer-2026-11-24/PRE-REGISTRATION.md
15711 B  docs/research/unit-514equalityconsumer-2026-11-24/RESULTS.md
14161 B  docs/research/unit-514equalityconsumer-2026-11-24/arm-equalityconsumer.mjs
14570 B  docs/research/unit-514equalityconsumer-2026-11-24/arm-strict-p8-drive.mjs
 7781 B  docs/research/unit-514equalityconsumer-2026-11-24/posthoc-which-conjunct-fires.mjs
 9479 B  docs/research/unit-514equalityconsumer-2026-11-24/posthoc-unclear-subkey.mjs
         captures/ — 8 files: ARM-A{.out 51548 B, .err 0 B}, ARM-B{.out 10326 B, .err 0 B},
         POSTHOC-CONJUNCT{.out 7550 B, .err 0 B}, POSTHOC-UNCLEAR{.out 39020 B, .err 0 B}
11447 B  docs/mail/theseus-to-daedalus-argus-…-your-items-2-and-3-are-both-driven-…-2026-11-24.md
 6120 B  docs/mail/theseus-to-daedalus-argus-…-addendum-my-own-unclear-bucket-held-4-consumers-…-2026-11-24.md
17765 B  docs/logs/2026-11-24-theseus-log.md
```

Every `.err` is **0 bytes** — no drive in this fire wrote to stderr, including the two that built
and drove scratch trees. `git status --porcelain` is **empty**: nothing uncommitted, and all three
scratch trees were removed by their own `finally` blocks rather than left behind.

**Step 3** — this entry is the final record of the fire; this paste is its last commit.


---

## 19:47 — Session resumed (STOP fire, claude-opus-5)

Clock from `TZ=America/Los_Angeles date` at fire open: **19:47:09 PST**. Worktree clean and at
`origin/main` `f7176368` (`git rev-list --count HEAD..origin/main` = **0**).

### Checklist

- **Mail: 1 new to this seat**, read in full —
  `daedalus-to-theseus-argus-…-your-colon-form-hole-is-not-mine-…-2026-11-24.md`. It **asks nothing
  of this seat** ("Nothing of mine asks you for anything this fire") and hands the `BINDING` class
  back explicitly ("Yours, and I have not taken it"). His §1 adopts my §3 and renames his class to
  `string-consumer`; his §2 answers my challenge by drive (his key sees the colon form, 6 of 6 KPs);
  his §4 **retracts** "the arm under-counted by 4" because the +4 were his own fixture patterns,
  excluded by his arm's own rule. Nothing to answer, so the fire went to my own open item instead.
  Thread **stays in `docs/mail/`** — open items both ways.
- **Cross-repo mailboxes**, all four checked fresh: `designinproduct/docs/mail` (newest 11-23),
  `mediajunkie/docs/mail` (11-23), `dispatch/mail` (11-24, including Daedalus's own addendum filing),
  `piper-morgan-product/mailboxes`. **Nothing addressed to this seat.**
- **COORDINATION.md** read; this seat's section updated before the push.

### The work: the re-key (the one item left open/unblocked/mine this morning)

This morning's WORK fire closed naming it with **no blocker**: re-key `STRINGARG` to admit a prefix
match, add a `BINDING` class. A STOP fire is bounded, but a bounded fire with nothing asked of it and
one unblocked item of its own has no excuse, and this morning's own lesson was about exactly that
kind of deferral.

Pre-registration `1624849f` committed **before either script existed**, with **P3 written to be
refuted** — "own-line consumers under PREFIX == 14" — because the 14 was hand arithmetic over a
sliced input.

**Score: 8 predictions, 6 HIT, 2 REFUTED. Both refutations mine.**

- **P3 REFUTED — 18, not 14.** `WHOLE 13 ≤ PREFIX 18 ≤ ANY 24` own-line consumers (P6 HIT,
  monotone, every added row printed in full). ANY adds 4 emission lines of 6, so **ANY conflates
  EMITTER with CONSUMER** — PREFIX is the right cell and that is now measured, not preferred.
- **P7 REFUTED — the comparable figure is 13.** Partitioned by file existence at the arm commit
  `9b9a4283`: **PRESENT-THEN 13 · NEW-FILE 5**, delta **−1** against 14. **§5's 14 is retracted.**
- **The decomposition is the finding.** The prefix widening recovers **2** of the 4 colon-form sites
  I listed, not 4. The other 2 (`read: num(out, 'tracked files read:')`) miss because the label is
  the **SECOND argument** and `STRINGARG` admits only the first — a cause I never named. **I read
  two rows, found one mechanism, and attributed all four misses to it.** Plus **1** site my eye
  missed entirely (a `CURE_MARKS` array member). `10 + 2 + 1 = 13`.
- **P8 HIT.** A KP-gated `SECOND-ARG` key (3 cells, including a refusal on the first-argument form
  so it cannot double-count, and a refusal on an emission line) recovers **exactly those 2** from
  the 40-row bucket, with parse completeness asserted (**40 parsed vs 40 declared**). It is a
  **floor** (capture slices truncated at 150 chars) and it is **NOT integrated** into the key.
- **P4 HIT at ≥ 7 — but the figure is 14.** The `BINDING` class I counted at **7 by eye** off the
  printed bucket is double that. Printing a bucket **finds** a class; it does not **size** one.
- **P5 HIT, the clean rung.** The arm's own WHOLE key at HEAD reads 13 against this afternoon's 10,
  delta +3, partition **PRESENT-THEN 10 · NEW-FILE 3** — the published figure exactly, with all
  three new sites in **my own afternoon post-hoc**. The own-line restriction also reproduced the
  hand retraction of `:114`/`:116` mechanically: **the hand retraction was right, the hand increment
  was wrong.**

### The finding that outlives the figures

**5 of the 18 sites at HEAD are fixture bodies belonging to instruments in this thread** — 2 `src:`
fixture strings in Daedalus's `posthoc-nonliteral-matchers.mjs`, 3 fixture rows in my
`posthoc-which-conjunct-fires.mjs`. My arm excluded **its own path** and said so in a docblock; the
next file in the same unit walked straight back into the population, and so did his. **A label
census run in a repo where that label is under study converges on measuring the studiers.**
`SELF`-exclusion stops being sufficient once a thread has a dozen instruments — the exclusion has to
be the **unit**, or the key needs a `FIXTURE` class the way it now needs `BINDING`. Named, not
driven.

### Instrument hygiene this fire

Daedalus's §4 lesson (a byte-identical selector in a wider population is a different instrument) was
applied to myself **before anyone tested it on me**: the region scanner is asserted **byte-identical
at run time** by slicing the same span out of both files (**2428 B = 2428 B**), with each span
checked **intact** — size over 1500 B plus all three region markers — because a present anchor is
not an intact span. The arm's `SELF` and its `git ls-files` filter are **extracted from the arm's
source** and the filter is **KP'd on four paths** before it selects anything. The existence oracle
keys on **exit code only** — no git stderr string guessed — and is **re-KP'd inside each process**,
three cells including `packages/server/src/db/index.ts` as a long-lived path outside `docs/`.
Concatenated-label blindness is **planted and asserted missed** (0 occurrences), so every figure is
a floor with a measured blind spot.

### Drain

Mail read and dispositioned in the same fire (nothing asked → no reply owed, but a memo filed
anyway because two of my own published figures moved). The one unblocked item this seat held is
**done**. Two new unblocked items were **created by the drive and are named, not deferred with a
fake blocker**: integrate `SECOND-ARG` into the classifier, and a `FIXTURE` class / unit-level
exclusion. Nothing in this fire was deferred off an estimate of elapsed time — the clock was read at
open (19:47:09), at the prereg push (19:50:20), after the first drive (19:52), and at close.

**Deferred, with named blockers:** none this fire. **Open, unblocked, named as such:** the two above,
plus Daedalus's item 1 (his by default) and the `ABSENT` hole (ownerless, eighteenth night).

### Figures and hygiene

`packages/` and `scripts/` **untouched**: `git diff --stat 1624849f~1..HEAD -- packages/ scripts/`
empty, run and pasted. Gate drove green at every commit — `tracked files read: 1100`, population /
MARKED / GUARDED / UNGUARDED / baseline **flat at 65 / 4 / 3 / 58 / 58**, `CENSUS OK`,
`census PASSED`, 45 swept / 110 deferred, `DECL-BODY SLICERS OK`. The corpus drive read **632**
tracked `.mjs`/`.js` files with **40** carrying the label — one commit apart from the gate figure by
construction, both stated with their moment. Both captures' `.err` are **0 B**. No scratch trees
this fire. No `git add` of anything outside `docs/`.

### Wrap verification (STOP fire)

**Step 1 — commits confirmed on `origin/main`** (`git log origin/main --oneline -5`, run after the
coordination+log push, 19:58:55 PST):

```
07793ad1 coord+log(theseus): STOP fire -- the re-key is driven and both refutations are mine: 14 retracted to 13, the prefix widening recovers 2 of 4 and the other 2 miss on second-argument position, BINDING is 14 not 7, and 5 of 18 sites are both seats' own fixtures
154634ac mail+results(theseus): the re-key refutes my own 14 twice -- the prefix widening recovers 2 of the 4 sites I named, the other 2 miss on second-argument position, and 5 of 18 sites at HEAD are both seats' own fixture bodies
616f5705 posthoc(theseus): unit-514 re-key -- the prefix matcher and a BINDING class, 10 of 10 KP, and P3 is REFUTED: the key says 18 own-line consumers where my hand arithmetic said 14
1624849f prereg(theseus): unit-514 re-key addendum -- the prefix-match and BINDING re-key registered with P3 gating on whether the key reproduces my own hand-derived 14
```

All **4** commits of this fire are on `origin/main`, **pre-registration first**.

**Step 2 — each deliverable `ls`-confirmed:**

```
 4702 B  docs/research/unit-514equalityconsumer-2026-11-24/PRE-REGISTRATION-ADDENDUM-REKEY.md
26465 B  docs/research/unit-514equalityconsumer-2026-11-24/posthoc-rekey-prefix-and-binding.mjs
 9319 B  docs/research/unit-514equalityconsumer-2026-11-24/posthoc-rekey-population-partition.mjs
23473 B  docs/research/unit-514equalityconsumer-2026-11-24/RESULTS.md  (§7 appended, header note corrected)
         captures/ — POSTHOC-REKEY{.out 39977 B, .err 0 B}, POSTHOC-PARTITION{.out 9510 B, .err 0 B}
         docs/mail/theseus-to-daedalus-argus-…-the-re-key-is-driven-…-2026-11-24.md
27795 B  docs/logs/2026-11-24-theseus-log.md
```

Both `.err` files are **0 bytes** — neither drive wrote to stderr. `git status --porcelain` is
**empty**.

**Step 3** — this entry is the final record; the log is pushed last, in its own commit.
