/**
 * Insert this fire's COORDINATION.md bullets INSIDE the Daedalus section, with the landing site
 * asserted rather than assumed.
 *
 * Why this is a script and not an Edit: a shared file with six agent sections and 5000+ lines has
 * been mis-edited before by anchoring on a string that occurs in more than one section — an entry
 * of mine once landed in Argus's section, beside an `OK`. The anchor here is the SECTION HEADER's
 * index, and the insert point is gated to lie strictly between it and the next `### ` header. If
 * either gate fails the file is not written.
 *
 * Carried forward from `unit-464mapkey-2026-10-30/insert-coord-entry.mjs`, same gates.
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
  "- **STOP-CONDITION VALUE (standing line, reported every fire) — NOT RE-READ 10/30 WORK, and"
  + " therefore NOT restated as current.** This fire drove no cell recording: all nine drives read"
  + " already-committed recordings, and `grade-filed-maps.mjs` never recomputes the cell. The last"
  + " driven reading stands as filed at 10/30 START — dir key `last 464 → NOT FIRED` · self-attested"
  + " key `last 454, consecutive 12, N=5 → FIRED` · union key still PINNED so `T8` REFUSES; adopted"
  + " reading **FIRED at 12 against N=5**, quotable only with the key named — read off"
  + " `unit-464mapkey-2026-10-30/drive11.FINAL-theseus-six-arms.out`'s `KPSLICE` line, whose"
  + " `pinDistance=3` is that fire's countdown and is **not** re-asserted as this fire's. A figure"
  + " not driven this fire is reported as not driven this fire.",

  "- **10/30 WORK — all three of Theseus's routed items are IN, and the cure inverts a sentence I"
  + " published this morning.** Unit `docs/research/unit-464drift-2026-10-30/` (pre-registration"
  + " `f88c18be` **before** the instrument existed; work `582a8d1d`; results + convention v2.1"
  + " `ed4e8dc3`; memo `02f209bd`). 11 predictions, **9 landed, 2 refuted**, 9 drives, every `.err`"
  + " **0 bytes** by `statSync` with the child's `stdio` pinned so the zero is the child's property"
  + " and not the capture's. `grade-filed-maps.mjs` goes **8 gates → 13**: `GCTRL` (the drift axis is"
  + " covered at all), `GDRIFTBITE` (the exclusion is wired to the figure), `GDRIFTREF` (it refuses"
  + " rather than falling back), `GMUST` (§3.1's four fields, where v2 declared four MUST and read"
  + " one), `GCONFORM` (**the gate that reads `underReported`** — Theseus measured that not one of"
  + " the eight did, so a map with zero §3.4-conforming rows scored `MAPVERDICT/0 ok`)."
  + " **His §4 was verified off my own `drive11` before being accepted**, not taken from his memo:"
  + " `G1`/`T9`/`W1` in the `reached` line of all six arms, `t9-insensitive-leg`'s whole set"
  + " `[G1,T10,T9,W1]` so 3 of its 4, `T9 moved=0` on five of six.",

  "- **10/30 WORK (the findings against my own work) — two predictions failed and each one moved the"
  + " method, not just a number.** **(a) `P1` refuted, and the refutation is the better result.** I"
  + " predicted the drift set would be *exactly* the three ids his arms exposed. **The control pair"
  + " finds five:** `DRIFT n=5 [G1,T9,W1,W2,W3]` — `W2` (`movedTokens=1 [band]`) and `W3`"
  + " (`movedTokens=0`) drift and simply were not reached by any of his six arms. My prediction was"
  + " keyed on what the arms happened to reveal, which is precisely what a control exists to stop"
  + " being the measure; had I filed the three-id list I rejected on other grounds, the next arm to"
  + " touch `W2`/`W3` would have been credited with reaching them. **(b) `P9` refuted structurally,"
  + " and it changed how every cripple arm on this instrument is graded.** `--cripple=control-"
  + "fallback` reddens **three** gates, not one — and all three correctly, because `GCTRL`,"
  + " `GDRIFTBITE` and `GDRIFTREF` all key on the same precondition (a readable control pair), so"
  + " **an arm that removes a shared precondition cannot be isolated by an absolute red list.**"
  + " Fix is in the grading METHOD: grade a cripple as a **delta against a matched no-cripple"
  + " drive** — `drive9`, identical inputs, only `--cripple` differing — which isolates it to"
  + " `adds=[GDRIFTREF]`. All four arms then MATCH (`grade-arms.mjs`, `ARMVERDICT/0 ok rows=6"
  + " mismatched=0`). **Two corollaries:** a cripple that makes a gate **green** grades as a"
  + " REMOVAL (`must-blind` first returned `ok: missing.length === 0` — it said 'OK (not compared)'"
  + " in its reason while its verdict stayed keyed on the comparison, so **the gate still reddened"
  + " under its own cripple and the arm proved nothing**); and a **saturated** gate grades at the"
  + " REASON level — `P10`'s arm needs a map whose only under-report is drift, none exists, so it is"
  + " recorded **UNREACHABLE AT THE VERDICT** rather than counted as a pass, with the key names and"
  + " counts distinguishing what the verdict cannot (`key=underReportedArmCaused cells=3"
  + " membership=0` against `key=underReported cells=6 membership=3`).",

  "- **10/30 WORK — the published figure, corrected, and a second gate of mine that was wrong on its"
  + " first drive.** `drive1.his-six-arms-with-control.out:141-142`, both lines kept so the"
  + " correction has the figure it corrects beside it: raw `(mapped arms 24) … underReportedCells=24"
  + " (membership 14 + tokens 10)` → `GRADEA drift-excluded (CEILING): reachedCells=15"
  + " underReportedCells=15 (membership 5 + tokens 10)`. **`P3` and `P4` landed exactly** —"
  + " `reachedDrift=3` on **every one** of the six arms (18 cells), and my published **'14 of 24'"
  + " is 5 of 15**. **But it is not only a ceiling, it INVERTS the claim:** my 10/30 START sentence"
  + " 'the membership axis is the LARGER half in both seats' maps — 14 of 24 in his, 14 of 18 in"
  + " mine' is **false for his maps** once drift is out (5 membership against 10 tokens) and **true"
  + " for mine** (12 against 4). **And the asymmetry has an unpredicted cause:** `drive4` prints"
  + " `reachedDrift=0` on two of my three arms against 3 on all six of his — my clean drive and my"
  + " three re-drives came from one clock window, his did not. **Drift is a property of how the"
  + " recordings were produced, not of the author's care**, so my smaller figure is not evidence my"
  + " maps are better and §3.3a says so beside the table rather than leaving it to be read the"
  + " flattering way. **The second own-gate failure:** `GMUST`'s first version failed his INTACT"
  + " map, flagging `cell:unreadable(docs/research/…)` — because a map declares **repo-relative**"
  + " paths and the checker runs from a unit directory. Now resolved cwd-then-repo-relative, with"
  + " `clean-recording` compared to the drive's own `--clean=` **by realpath**: two spellings, one"
  + " file. **A gate that compares declared paths as strings fails every map that is correct, and"
  + " the failure looks exactly like the map being wrong.** Also: `filing-rev` is checked by"
  + " **resolving** it (`git cat-file -e <sha>^{commit}`), because his stripped map's forty zeroes"
  + " are forty valid hex characters and a shape check passes them.",

  "- **10/30 WORK — `docs/research/CRIPPLE-MAP-CONVENTION.md` is at v2.1, hours after v2, and the"
  + " reason generalises: a convention is not checkable until something has been written under it.**"
  + " Theseus authored the first map under v2 in the fire v2 landed in and that one attempt measured"
  + " four defects. All four fixed, each attributed inline: **§3.3a** the drift exclusion, with the"
  + " control-pair method, the CEILING caveat and the two-seat table; **§3.1** `filing-rev`"
  + " respecified as the PARENT of the filing commit (v2 asked for a sha that does not exist while"
  + " the map is being written — unwritable as specified) and all four fields now gated; **§3.2**"
  + " the one-heading rule (his as-filed map was refused for naming its arm in its own `# ` title;"
  + " the refusal is correct and stays, the rule is now written); **§3.4** the one-physical-line"
  + " rule (`mentions()` selects physical lines, so a wrapped captured token sits outside its own"
  + " member's context — his `key====` scored uncaptured by a line break). **§3's own sentence"
  + " 'the checker refuses to grade it rather than grading it as clean' was FALSE when v2 published"
  + " it**, for three of its own five fields; a `>` note above it says so rather than quietly"
  + " correcting. **§4 now carries three ordered halves, not two** (drift exclusion → reach re-key →"
  + " captured tokens), plus delta-grading and reason-level grading of a saturated gate.",

  "- **Drain (2026-10-30 WORK fire):** *Done, bounded* (Klatch is a recorded exception to the fleet"
  + " duty-cycle-drain baseline; CLAUDE.md — checklist, act, write it down, stop). Synced by the"
  + " wrapper; **authorship read with `%an` before assuming anything was mine**, and it mattered:"
  + " the head commit `f5394430`'s subject reads '10/30 MID fire' and it is **Calliope's**, not"
  + " mine — my last fire was START at 09:17, there was no Daedalus MID fire today."
  + " `docs/COORDINATION.md` read. `docs/mail/` read on arrival, not batched — **one memo new to"
  + " this seat** (Theseus's 10-30 START reply, filed 11:2x, after my START fire closed), it routed"
  + " **three** items here, and **this fire is all three**, acted on in the same turn as the read"
  + " with the reply filed and pushed rather than promised. All four cross-repo mailboxes checked by"
  + " mtime **and** by content grep of every new file: designinproduct 0 new, mediajunkie 2 new,"
  + " dispatch 0 new, piper-morgan-product 384 new — **10 `klatch|daedalus` hits, all read: 5 are"
  + " MANIFEST/DIRECTORY index listings, and the 2 real memos (Pard's mechanical-stamps reply, the"
  + " CIO workstream review) are informational — Pard's says he will route a one-liner for non-PM"
  + " seats via Janus, the CIO's cites Klatch as a worked example.** Nothing owed from any."
  + " *Deferred, each with a named blocker:* **collapsing the population cell's inline reader into"
  + " the lib** — unchanged, wants a byte-identity gate against that cell's 13 recorded drives;"
  + " **the SDK major bump** `0.122 → 1.3.0` — unchanged, wants its own unit with the streaming path"
  + " driven; **the 8 non-zero exits and 2 `spawn`-hazard instruments from Round 453** — unchanged,"
  + " neither seat's, no new information this fire. *Not taken, no blocker, named so it stays"
  + " claimable:* **no map has been authored under v2.1** — the same hole v2 had this morning, one"
  + " turn later, and his §2 is the evidence that writing one is how the next defects surface;"
  + " **nothing checks that the control pair's two paths are no-cripple drives** (the driver's choice"
  + " of files asserts it; a stamp field naming the control pair would close it); **retro-grading the"
  + " six pre-10-30 maps**. **Needs-you unchanged at 1:** whether the track stops and re-scopes —"
  + " xian's. **Not run this fire:** `npm test`, `npm run typecheck`, the sweep —"
  + " `git status --porcelain -- packages/ scripts/` **empty** at open and at close (recorded in the"
  + " unit's `baseline.gitstatus.txt`), so every commit is `docs/`-only and both instruments sit"
  + " outside the probe census by construction; the pre-commit census ran on each commit and"
  + " printed `CENSUS OK · 153 probe files · 43 swept / 110 deferred` every time. Nothing left"
  + " running.",
];

const out = [...lines.slice(0, anchor + 1), ...INSERT, ...lines.slice(anchor + 1)];
writeFileSync(PATH, out.join('\n'));

// Re-read and assert each insert is inside my section and lands exactly once.
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
