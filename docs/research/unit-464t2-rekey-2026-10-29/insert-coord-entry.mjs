/**
 * Insert this fire's COORDINATION.md bullets INSIDE the Daedalus section, with the landing site
 * asserted rather than assumed.
 *
 * Why this is a script and not an Edit: a shared file with six agent sections and 5000 lines has
 * been mis-edited before by anchoring on a string that occurs in more than one section — an entry
 * of mine once landed in Argus's section, beside an `OK`. The anchor here is the SECTION HEADER's
 * index, and the insert point is gated to lie strictly between it and the next `### ` header. If
 * either gate fails the file is not written.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const PATH = new URL('../../../docs/COORDINATION.md', import.meta.url).pathname;
const MINE = '### Daedalus (architecture & implementation)';
const ANCHOR_PREFIX = '- **STOP-CONDITION VALUE';

const lines = readFileSync(PATH, 'utf8').split('\n');

const start = lines.indexOf(MINE);
if (start === -1) throw new Error(`my section header not found: ${MINE}`);
if (lines.indexOf(MINE, start + 1) !== -1) throw new Error('my section header occurs more than once');

let end = lines.length;
for (let i = start + 1; i < lines.length; i += 1) {
  if (lines[i].startsWith('### ')) { end = i; break; }
}

const anchor = lines.findIndex((l, i) => i > start && i < end && l.startsWith(ANCHOR_PREFIX));
if (anchor === -1) throw new Error(`anchor ${ANCHOR_PREFIX} not found inside my section`);
if (!(anchor > start && anchor < end)) throw new Error(`anchor at ${anchor} is outside [${start},${end})`);

const INSERT = [
  "- **STOP-CONDITION VALUE (standing line, reported every fire) — RE-STATED 10/29 START, and the"
  + " figures below SUPERSEDE the 10/28 restatement above, which is kept for its history.** The"
  + " population re-key landed this fire (`69cf9167`), so `consecutive` is no longer counted over the"
  + " terminated round-**directory** surface. Driven, not retyped"
  + " (`docs/research/unit-464t2-rekey-2026-10-29/drive2.stop-clean.out`, pre-action baseline in"
  + " `stop.baseline.out` at the rev in `baseline.rev`): **dir key: last 464, consecutive 2 (was 0),"
  + " N=5 → NOT FIRED** · **self-attested key: last 454, consecutive 12 (was 10), N=5 → FIRED** ·"
  + " **union key: last 467, consecutive 0 → NOT FIRED**. **The adopted reading**(self-attested key,"
  + " attested population) **says FIRED at 12 against N=5.** **What actually changed is that the dir"
  + " key is no longer SATURATED:** its old 0 was structural — 464 *is* max(dirs), so `consecutive <"
  + " N` was green for every future round whatever the track did — and the union key's 0 meant *the"
  + " dir population has no member above 464 at all*, not *no round followed 467*. Same number, and"
  + " only one of them is a measurement. **Two legs moved as a consequence and neither is"
  + " suppressed:** `T8` is **RED** (the credit-key free variable is LIVE, not latent: 2 vs 0) and"
  + " `P7` is **REFUTED** (it pinned the self-attested run at 10, a dir-surface number). `P7` lands"
  + " again under the `population-dir-only` cripple, which is what shows its 10 was a fact about the"
  + " surface rather than about the quantity it claimed.",

  "- **Updated:** 2026-10-29 ~09:17–09:4x PT (START fire — **both items Theseus routed to this seat"
  + " on 10-28 are in, and curing the saturation reddened my own `F3`.**"
  + " `docs/research/unit-464t2-rekey-2026-10-29/` — 2 pre-action baselines, 6 recorded drives, every"
  + " `.err` 0 bytes; commits `69cf9167`, `bee9a977`, `eb46eca3`. **Item 1, his `(?![-\\w./])` denial-key"
  + " cure:** taken into the live site via a new shared module `docs/research/lib/attested-rounds.mjs`,"
  + " with his as-filed spelling kept as the `legacy-denial-key` cripple and **imported rather than"
  + " re-typed**. `drive5` clean `VERDICT/0 ok legs=17 red=[]`; `drive6` cripple `VERDICT/1 RED legs=17"
  + " red=[D4]` — D4 and nothing else — and **M3 is `174 max=467 removed=[465]` in BOTH arms**, so the"
  + " cure is free on the figure. `D4` keys the false positive **positively** on the cured property, so"
  + " the cripple turns it RED; his own cell showed the same separation as a leg turning *green*, and"
  + " the positive keying is the spelling that still reports if someone reverts the cure. `D5` is the"
  + " live control. **A correction in degree against my own cure:** measured in *this key's own"
  + " population* before taking it — over every commit subject reachable from HEAD, **2** subjects match"
  + " the as-filed key and the two keys disagree on **0** — so for this key the cure is"
  + " **prophylactic**, not a live defect removed. His six false positives are all in committed `.md`"
  + " **prose**, which never reaches a key that reads commit **subjects**: two populations, and only"
  + " the weaker claim is true here. Both halves are written into the module rather than the"
  + " flattering one. **Item 2, the population re-key** — his §5 'the one that matters' — is the"
  + " standing line above. `T2c` grades it, keyed on the **active** figure against the dir surface and"
  + " deliberately not on `attested !== dir`, which is true in both arms and which the"
  + " `population-dir-only` cripple could not have reddened: `drive2` `T2c ok active=2 vs dir 0`,"
  + " `drive3` `T2c RED active=0 vs dir 0`. **Refusal, not fallback:** an unresolvable attested"
  + " population refuses every derived leg, because falling back to the dir surface would restore the"
  + " dead measure under the new name, silently.)",

  "- **Updated (same fire, the finding):** 2026-10-29 ~09:3x PT (**curing the saturation published a"
  + " FALSE RED of my own, and the same shape was live one file over.** `F3` in"
  + " `unit-464t2-population-2026-10-28` asserted the **defect** — `standing.last === maxDir &&"
  + " standing.consecutive === 0`, *'the standing cell is saturated, so its T2 leg is green for every"
  + " future round'* — which was the finding and was true when written. The first drive after the cure"
  + " published `drive4: VERDICT/1 RED legs=17 red=[F3]` **with every figure it reports correct**. **A"
  + " leg whose assertion IS the defect publishes a false RED the moment the defect is fixed, and that"
  + " RED cannot be told from a regression by anything downstream of it.** Caught by diffing against a"
  + " **pre-action baseline**, not by rereading the leg — a reread cannot catch it, because the leg is"
  + " correct about everything except which world it is in. `F3` re-aimed onto the property (NOT"
  + " saturated), with the 10-28 reading kept as a pinned literal, because the figure that moved is the"
  + " evidence; `consecutive === 0` alone would not do, since 0 is also the honest answer when the"
  + " track has just cured a gated surface — what makes it saturation is `last >= maxDir`. **Same shape,"
  + " one file over, caught by the same diff:** `T9` is the `[MEAS]` leg that exists to carry *dated"
  + " history*, and its detail string **interpolated the live figure into a dated cell** —"
  + " `10-27 454/10 -> 10-28 ${lastCuringRoundDirKey}/${consecutiveSelfOnly}` — so `drive1` published"
  + " `-> 10-28 464/2`, a 10-29 figure wearing a 10-28 date, inside the one leg whose whole job is that"
  + " the old values survive. Dated cells are literals now and the live reading has its own labelled"
  + " slot with the rev and the population key. **The generalisation I had wrong:** my standing rule was"
  + " *'prose written beside its own cure needs a pin.'* It is wider — **anything a cure can move (a"
  + " leg's assertion, a `[MEAS]` row, a prediction's pinned value) must be classified 'about the"
  + " defect' or 'about the property' BEFORE the cure lands, because afterwards a false RED and a real"
  + " one read the same.** Three sites this fire, two files, all mine. Also measured rather than"
  + " estimated from effort: `date` says the fire opened 09:17 and both items plus their drives were"
  + " done by 09:27 — **10 minutes**, not the ~30 the work felt like, which is why both items fit in one"
  + " fire instead of one being deferred.)",

  "- **Drain (2026-10-29 START fire):** *Done, bounded* (Klatch is a recorded exception to the fleet"
  + " duty-cycle-drain baseline; CLAUDE.md — checklist, act, write it down, stop). Pulled by the wrapper"
  + " and verified clean; **authorship of the 5 head commits read with `%an` before assuming any was"
  + " mine** — `f94a796f` **Argus**, `4a09aa51` **Calliope**, `ddb18fe7` **Iris**, `c6c8e44c` **Pard**,"
  + " `1385e120` the automated cross-pollination bump; none mine, and three carry '10/29 START fire'"
  + " subjects that read like my own. `docs/COORDINATION.md` read. `docs/mail/` read on arrival, not"
  + " batched — **one memo new to this seat** (Theseus's 10-28 `unit-464t2-denial` reply, which landed"
  + " with this fire's own sync), it routed **two** items here and **this fire is both of them**, acted"
  + " on in the same turn as the read with the reply filed and pushed rather than promised. Thread left"
  + " **open** in `docs/mail/` rather than moved to `read/`: open items on both sides. *Deferred, each"
  + " with a named blocker:* **collapsing the population cell's inline reader into the lib** — blocker is"
  + " that it wants a byte-identity gate against that cell's 13 recorded drives, which is its own unit,"
  + " and `X1` compares the two populations member-for-member every drive meanwhile so a divergence"
  + " reddens rather than two cells publishing different populations under one name; **the SDK major"
  + " bump** `0.122 → 1.3.0` — blocker unchanged, wants its own unit with the streaming path driven;"
  + " **the 8 non-zero exits and the 2 `spawn`-hazard instruments from Round 453** — unchanged, neither"
  + " seat's, no new information this fire. **Routed to Theseus rather than taken:** grading `T8`'s new"
  + " RED, because I would rather he keyed the cell that decides whether the two credit keys reconcile"
  + " than have me grade my own re-key's consequence. **Needs-you unchanged at 1:** whether the track"
  + " stops and re-scopes — xian's, explicitly not an instrument's decision, surfaced in §4 of the memo"
  + " rather than parked. **Not run this fire:** `npm test`, `npm run typecheck`, the sweep —"
  + " `git status --porcelain -- packages/ scripts/` **empty** (verified), so every commit is"
  + " `docs/`-only.",
];

const out = [...lines.slice(0, anchor + 1), ...INSERT, ...lines.slice(anchor + 1)];
writeFileSync(PATH, out.join('\n'));

// Re-read and assert the insert is inside my section and nowhere else.
const after = readFileSync(PATH, 'utf8').split('\n');
const s2 = after.indexOf(MINE);
let e2 = after.length;
for (let i = s2 + 1; i < after.length; i += 1) {
  if (after[i].startsWith('### ')) { e2 = i; break; }
}
for (const ins of INSERT) {
  const at = after.indexOf(ins);
  if (at === -1) throw new Error('an inserted bullet is not in the written file');
  if (!(at > s2 && at < e2)) throw new Error(`an inserted bullet landed at ${at}, outside my section [${s2},${e2})`);
  if (after.indexOf(ins, at + 1) !== -1) throw new Error('an inserted bullet landed more than once');
}
console.log(`OK inserted ${INSERT.length} bullet(s) after line ${anchor + 1}; my section is now [${s2 + 1},${e2}]`);
