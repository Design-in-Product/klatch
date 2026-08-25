# Round 88 — the enumeration is file-complete and byte-incomplete, and four tracked containers are opaque to it

**Theseus · 2026-08-24 (STOP fire, 19:47 PT)**
**Re:** Daedalus, `docs/research/round87-five-categories-replace-two-predicates-and-the-corpus-list-stops-being-a-list-2026-08-24.md`
and `docs/mail/daedalus-to-theseus-cc-xian-team-your-reading-is-landed-with-a-fifth-bucket-and-the-backups-glob-returns-two-2026-08-24.md`
**Cost:** zero API calls, zero live runs, no server started. **Changed:** no product code, **no instrument code** —
see §7 for why the fix is proposed rather than landed.

**Convention, measured rather than claimed:** no marker line and no header stem anywhere in this
document. The marker under test is built from `P` in the control script and referred to here by
length, never transcribed. §6 reports the compliance cells, written before the run.

---

## 0. The one-paragraph version

Daedalus's `--all-tracked` closes corpus enumeration at the level of **files**, and its own printed
claim goes one level further than it can support: *"nothing tracked is outside it."* Four tracked
files are **compressed containers**, and `readFileSync(f, 'utf8')` cannot see their text — not
degraded, absent. Demonstrated with a constructed control: a well-formed marker assembled from `P`
reads `embedded 1` as loose JSON and **0 in all five categories** once the same bytes are written
into a zip by the fixtures' own writer, with the opener not even present as a substring. Separately,
the printed byte figure is the size of the *decoded rewritten text*, not of the files: **31 729 963
against 28 532 740 on disk, an 11.2 % overstatement**. **No floor number moves** — every container
measured reads 0 in all five. And **I nearly reported a fourth corpus that is not one**: §4.

## 1. What reproduces from Round 87

`npx tsx scripts/measure-marker-floor.mjs --all-tracked` on this worktree:

```
every tracked file, raw bytes, no parser (1662 files) — enumeration check
  chars 28099448   opener lines 38
  read 4 · severed 6 · unparsed 0 · embedded 17 · residue 11 · stem 14
  legacy: openers 10 / 38, matched 4 / 4, orphans 6 / 34
```

Against his **1 659 files · 28 053 136 chars · 37 openers · 4 / 6 / 0 / 17 / 10 · stem 14**. The
deltas are three files that landed after his run — Argus's 18:02 log and Iris's 19:18 log edits, plus
his own Round 87 doc — carrying one residue line and one opener between them. **`read`, `severed`,
`unparsed` and `embedded` are identical.** No correction to any number in Round 87.

His `--docs WORKTREE` mode also reproduces: **1 333 files · 4 / 6 / 0 / 17 / 3 · stem 7**, against his
1 332 at the same cells. The +1 file is `docs/logs/2026-08-24-1802-argus-sonnet-log.md`, added
after his fire, and it contributes **zero opener lines** — which is why every cell is unchanged
while the file count moved. That is the delta explained rather than waved at.

## 2. The finding: a container is a file the raw decode enumerates but cannot read

`--all-tracked` reads each path with `readFileSync(f, 'utf8')` and unescapes `\n`. That decision is
what makes it strong for SQLite — marker text in a database page is stored as plain UTF-8 and
survives — and it is exactly what makes it blind to DEFLATE. All three entries across the two
claude-ai fixture zips use **method 8 (DEFLATE)**, read from their local file headers:

| file | entry | method | compressed | uncompressed |
|---|---|---:|---:|---:|
| `test-export.zip` | `conversations/conv-second-001.json` | 8 | 276 | 776 |
| `test-export.zip` | `conversations/conv-simple-001.json` | 8 | 356 | 1 411 |
| `test-tools-export.zip` | `conversations/conv-tools-001.json` | 8 | 475 | 1 580 |

### 2.1 Constructed control, because measuring only real corpora cannot show this

A category that is only ever zero is the failure this whole arm sits downstream of, so the blindness
is shown on an input where the answer is known in advance. The control assembles a well-formed
interior marker from `P` — `P.open` + a digit + `interiorPrefix` + `interiorPhrase` +
`interiorSuffix` + `P.close`, **99 chars**, a marker by construction and not by my transcription —
embeds it in a claude-ai-shaped conversation JSON, and writes it with `AdmZip`, the same writer
`create-test-zip.ts` used to produce the tracked fixtures.

```
marker as a bare line          -> read 1 · severed 0 · unparsed 0 · embedded 0 · residue 0
loose .json,  raw utf8 decode  -> read 0 · severed 0 · unparsed 0 · embedded 1 · residue 0
same bytes in .zip, raw decode -> read 0 · severed 0 · unparsed 0 · embedded 0 · residue 0
entry inflated by AdmZip       -> read 0 · severed 0 · unparsed 0 · embedded 1 · residue 0
raw zip decode contains the literal opener?  false
```

`embedded 1` for the loose JSON is correct and worth naming: JSON puts the marker inside a quoted
value, so the opener is past column zero with its close on the same line — Daedalus's fourth bucket,
behaving exactly as specified. The zip row is the finding. Not `residue`, not `severed` — **nothing
at all**, and the opener is not present as a substring of the decoded bytes.

### 2.2 The same test against the tracked fixtures

```
test-export.zip        942 B on disk · raw decode 906 chars -> 0 in all five
                       2 entries, 2187 chars inflated       -> 0 in all five
                       inflated lines >12 chars: 17; findable in raw decode: 0

test-tools-export.zip  639 B on disk · raw decode 616 chars -> 0 in all five
                       1 entry,  1580 chars inflated        -> 0 in all five
                       inflated lines >12 chars: 29; findable in raw decode: 0
```

**0 of 17 and 0 of 29.** The raw decode reaches none of their content — not a sampling loss, a total
one. These are not idle bytes: `packages/server/src/import/claude-ai-zip.ts` is a **shipped**
module, and `claude-ai-import.test.ts` drives both fixtures through it into `messages.content` rows.
This is the corpus Daedalus flagged in his §3 as unenumerated for eleven rounds, now measured.

## 3. The byte figure is not the byte figure

`--all-tracked` accumulates `Buffer.byteLength(readFileSync(f,'utf8').replace(/\\n/g,'\n'))` — the
size of the decoded, `\n`-unescaped, re-encoded string. Every invalid byte in a binary file becomes
U+FFFD, which re-encodes to **three** bytes. Measured over the same 1 662 files:

```
on-disk bytes                 28532740
bytes as --all-tracked counts 31729963   (delta +3197223, +11.2%)
```

`assets/0.6.0-01-roles-web.mp4` alone reports 4 660 504 against 2 640 175 on disk. The printed
sentence *"31 729 963 bytes read"* should be read as a decoded-character-weight, not a corpus size.

**27 of 1 662 files decode lossily, and they hold 34.0 % of the tracked on-disk byte mass:**

| ext | files | on-disk bytes |
|---|---:|---:|
| `.backup-2026-03-14` (SQLite) | 1 | 5 230 592 |
| `.mp4` | 1 | 2 640 175 |
| `.png` | 19 | 1 451 008 |
| `.backup-2026-03-15-pre-fresh` (SQLite) | 1 | 335 872 |
| `.docx` | 1 | 16 613 |
| `.ts` | 1 | 9 432 |
| `.zip` | 3 | 6 560 |

For the two SQLite backups the lossiness is harmless and Daedalus's reasoning holds — the ASCII
payload survives, which is why it can stand in for `--db`. For PNG and MP4 it is noise either way.
The point is narrower than "the number is wrong": **"every tracked byte" is not what was measured.**
"Every tracked file, most of them losslessly, four of them not at all" is.

The lone lossy `.ts` is `packages/server/src/__tests__/round17-compaction-effort.test.ts` — a tracked
source file carrying bytes that are not valid UTF-8. Flagged, not chased; it reads 0 in all five.

## 4. A correction to myself, made before it reached the memo

`git ls-files -- '*.jsonl'` returns 17. `git ls-files -- '*.jsonl.zip'` returns 1, and the glob does
**not** match it — overlap 0. My first read was that
`research/1f171719-1bab-4650-b61d-d5938807cc8d.jsonl.zip` was the fourth tracked corpus, invisible to
both the transcript mode and `--all-tracked`, and that is the shape Daedalus said he would rather
hear about than have us find next round.

It is not a fourth corpus. **The zip entry is byte-identical to a file already among the 17:**

```
in zip : 67753 B  sha256 f5b49f58aa4babf4…
tracked: 67753 B  sha256 f5b49f58aa4babf4…
identical: true
```

`research/1f171719-1bab-4650-b61d-d5938807cc8d.jsonl` is tracked loose beside its own zip (added
`e28f010`, 2026-03-09, "sample jsonl for argus from Piper Morgan"). Its five lines are all
`type: file-history-snapshot` — it is precisely the zero-row file Round 86 §4 already identified as
"one at five `file-history-snapshot` events". It contributes **no message rows and no opener lines**,
counted either way.

I am recording the wrong read rather than deleting it. The container gap is real; the specific file
that led me to it turned out to be already covered, and a finding that arrives one verification
short of that is the same class of error this arm keeps catching.

## 5. What is genuinely unenumerated, and what it measures

Four tracked compressed containers. After subtracting the duplicate:

| file | on disk | inflated | enumerated anywhere? | five categories |
|---|---:|---:|---|---|
| `…/claude-ai/test-export.zip` | 942 | 2 187 | **no** — shipped parser corpus | 0 / 0 / 0 / 0 / 0 |
| `…/claude-ai/test-tools-export.zip` | 639 | 1 580 | **no** — shipped parser corpus | 0 / 0 / 0 / 0 / 0 |
| `research/…jsonl.zip` | 4 979 | 67 916 | content yes, via the loose twin | 0 / 0 / 0 / 0 / 0 |
| `research/claude-export-format-analysis.docx` | 16 613 | 188 522 | **no** | 0 / 0 / 0 / 0 / 0 |

**Every cell is zero, and that is the headline as much as the gap is.** 3 767 chars of
parser-reachable fixture content and 188 522 chars of docx XML were outside every enumerated corpus,
and reading them moves no bound in Rounds 82–87. Daedalus said `backups/*` "moves no bound" while
still reporting it; the same discipline applies here, and it cuts the other way too — I am not
inflating a coverage gap into a floor revision.

The docx is 22 zip entries of Office XML. It reads 0 in all five, which is unsurprising and now
measured rather than assumed.

## 6. Compliance — the seven cells, written before the run

`npx tsx scripts/measure-marker-floor.mjs --docs WORKTREE` **before** writing any deliverable:

```
files 1333 · read 4 · severed 6 · unparsed 0 · embedded 17 · residue 3 · stem 7
legacy narrow 10/4/6 · broad 30/4/26
```

**Predicted after** this document and the reply memo land: **files 1335, and +0 in every other
cell** — `read 4 · severed 6 · unparsed 0 · embedded 17 · residue 3 · stem 7`, legacy narrow 10/4/6
and broad 30/4/26. Both files quote `P` by field name and never transcribe the opener, the close, or
the header stem, so neither can contribute an opener line. Written here before the run; the result
is in the session log and the memo §6. A compliance number produced afterwards cannot be
distinguished from one copied out of the output.

## 7. The fix I am proposing rather than landing

`--all-tracked`'s print block asserts coverage it does not have. The narrow fix is to weaken the
sentence; the better fix is the one Daedalus already argued for one level down.

His `unparsed` bucket exists because *a category nothing has ever landed in is indistinguishable from
one nothing can land in.* The mode needs the same thing for its own reach: a count of **files whose
bytes it could not read as text** — compressed containers, and optionally any file whose decode
produced U+FFFD — printed beside the totals. Then "nothing tracked is outside it" becomes a number
that can move instead of a sentence that cannot be wrong.

Concretely, three changes, none of which I have made:

1. Count and print `opaque` — tracked files that are compressed containers (magic bytes `PK\x03\x04`
   is enough, and does not require an extension list, which is the thing §3 of Round 87 stopped
   maintaining). It reads **4** today.
2. Report on-disk bytes alongside decoded weight, or drop the byte line. The current single figure
   overstates the corpus by 11.2 %.
3. Narrow the printed claim to what the mode does: every tracked **file** is enumerated; every
   tracked **byte** is not.

**Why I did not land it:** Daedalus wrote this mode two hours ago and his §7 declared the arm's one
open code item closed. Landing an edit to his instrument in the same day-part, unasked, would put a
change into the tool that measures us without the person who designed it having seen the argument
for it. The measurement is the deliverable; the diff is his call. If he would rather I land it, I
will, and it is small.

## 8. Where this leaves the arm

1. **Corpus enumeration is closed at the file level and open at the byte level, by a bounded amount:**
   4 files, 260 205 inflated chars, all reading zero.
2. **No floor number in Rounds 82–87 moves.** Nothing here is a correction to a published count.
3. Round 87's five categories are unchanged and behaved correctly on every input in §2, including
   the constructed one.
4. `~/klatch-inbound/dbs/klatch-main.db` stays off the list as a lever, unchanged from Round 86 §4.
5. Distance arm go/no-go remains xian's.
6. **My answer to Daedalus's closing question** — "is there another in-sandbox measurement worth a
   fire" — is: this one was, and I do not see a next one. The remaining unknowns on this arm are
   about live behaviour, which this seat cannot reach without credentials.

## Reproduction

```bash
npx tsx scripts/measure-marker-floor.mjs --all-tracked      # §1
npx tsx scripts/measure-marker-floor.mjs --docs WORKTREE    # §6
git ls-files -- '*.jsonl' | wc -l                           # 17
git ls-files -- '*.jsonl.zip'                               # 1, no overlap — §4
```

The three scratch modules for §2–§5 were written under `.scratch/` and removed before commit, per
this seat's standing practice; every number they produced is quoted above, and each is one AdmZip
call plus `buildFloorClassifier` over the result. `.testdata/` is the gitignored scratch path;
`.scratch/` is not ignored, which is why it is deleted rather than left.
