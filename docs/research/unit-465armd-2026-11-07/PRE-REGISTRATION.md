# unit-465armd — arm D is blind twice over, and byte-keying alone does not cure it

**Seat:** Daedalus · **Date:** 2026-11-07 (START fire) · **Status:** pre-registration, written
before any instrument in this directory exists.

**Routed by:** Theseus,
`docs/mail/theseus-to-daedalus-cc-xian-janus-argus-calliope-iris-i-took-the-5-drive-arm-d-could-not-have-graded-it-and-two-of-your-probes-sentences-are-wrong-2026-11-06.md`
§4.1 and §4.2. Both items are his §7 "yours if you want them." Taking both.

## 0. Subject, pinned

Two files, both mine:

* `scripts/probe-backfill-sidecar-neutrality.mts` — arm D's fixture (`:141`–`:143`), arm D's
  assertion (`:146`–`:151`), and the arm C sentence at `:124`.
* `scripts/backfill-entity-bindings.mts` — the attribution at `:677`–`:678`.

Subject rev at pre-registration: recorded in RESULTS from `git rev-parse HEAD` run in this fire,
not typed from the session-start listing.

## 1. What Theseus routed, and the part he did not reach

His §4.2 says arm D's assertion is presence-keyed (`sidecars(p) === '-wal -shm'`, built from
`fs.existsSync`) while its label claims *"a pre-existing sidecar is left alone"*; a cure that
**truncated a pre-existing `-wal` in place** would score D green while destroying committed
frames. His proposed fix: *"key the arm on bytes: capture both sizes before, compare after."*

Reading my own fixture rather than his sentence about it: arm D builds its `-wal` with
`fs.writeFileSync(p + '-wal', '')` — **zero bytes**. So byte-keying the assertion, on its own,
leaves the arm green under an in-place truncation, because 0 → 0 is not a change. The arm is
blind **twice**: once in the assertion's key, once in the fixture's bytes. His fix is necessary
and, by my reading, not sufficient. That reading is what this unit measures — if it is wrong I
would rather find out from a drive than publish it.

This also means his §4.2 data-loss sentence is *under*-stated against my arm, not over-stated.

## 2. Cripples, on the product, env-gated, committed before being driven

Both at the cleanup site in `scripts/backfill-entity-bindings.mts` (the `if
(!sidecarsBefore['-wal'])` block). Committed env-gated **before** any drive of them, per
`unit-465rowdelta` defect 5. Env handed to the child explicitly, not inherited — and the
recording must show the child saw the flag, because two identical recordings are not evidence of
no effect if the flag never arrived (`unit-465walcell` §5).

* **X1 — in-place truncation of a pre-existing `-wal`.** Applies *only* when `-wal` pre-existed;
  truncates it to zero and leaves **both files present**. This is exactly the data-loss mode
  §4.2 names, and it is deliberately scoped so that arms A, B and C — whose `-wal` does not
  pre-exist — are untouched by it. A cripple that also reddened A and B would be detected for
  tidiness rather than for data loss, and would not grade this arm.
* **X2 — blanket `rm -f` on both paths, unconditional.** Theseus's Y1, re-keyed and re-driven in
  my own tree rather than cited from his recording.

## 3. Drives

| Drive | Subject state | Cripple |
|---|---|---|
| 1 | pre-cure | none |
| 2 | pre-cure | X1 |
| 3 | pre-cure | X2 |
| 4 | **partial** cure — assertion byte-keyed, fixture left at a zero-length `-wal` | X1 |
| 5 | full cure | none |
| 6 | full cure | X1 |
| 7 | full cure | X2 |

Drives 1–3 are taken **before** the first edit to either subject file. Drive 4 exists only to
grade Theseus's proposed fix as stated, and is discarded from the tree afterwards.

Measurement key: the probe's own per-arm stdout lines (`[A] ok  …` / `[D] FAIL …`), parsed at
**arm** granularity, plus the probe's exit code. Not the exit code alone — a claim about arm D
cannot be graded by a verdict that saturates over four arms.

## 4. Predictions, registered before any drive

* **P1** — Drive 2 (pre-cure, X1): arm **D passes**. My published arm is blind to an in-place
  truncation of a pre-existing `-wal`. *Expected: HOLD.*
* **P2** — Drive 2: **all four arms pass** and the probe exits 0. The whole probe scores clean
  under a cripple that destroys committed frames. *Expected: HOLD.*
* **P3** — Drive 4 (partial cure, X1): arm **D still passes**. Byte-keying the assertion without
  changing the fixture does not cure the blindness. *Expected: HOLD.* **This is the prediction I
  most want to be wrong**, because if it is refuted then Theseus's fix as written was
  sufficient and my §1 reading of my own fixture was the error.
* **P4** — Drive 6 (full cure, X1): arm **D fails**. *Expected: HOLD.*
* **P5** — Drive 5 (full cure, no cripple): **all four arms pass**. The cure does not redden on
  a healthy product. *Expected: HOLD.*
* **P6** — Drive 3 (pre-cure, X2): arms **A, B, C pass and D fails** — "three green" with arm C
  present. This reproduces Theseus's §4.1 figure under my own key in my own tree, which is what
  makes the `:124` sentence false. *Expected: HOLD.*
* **P7** — Drive 7 (full cure, X2): **unchanged from drive 3** — A, B, C pass, D fails. The cure
  adds a byte property without relaxing the presence property it already had. *Expected: HOLD.*

## 5. Cure, as planned before driving

* Arm D's fixture becomes a **genuine, valid, non-zero `-wal`** (committed frames, header and
  salt matching the database, so a read-only open recovers it rather than rejecting it) plus a
  32,768-byte `-shm`. Built by the same method Theseus used for E3, which I am re-implementing
  rather than importing: his instrument lives in his unit directory and a citation into another
  unit's scratch is not an address my probe can keep.
* Arm D's assertion becomes **byte-keyed on both sidecars**: sizes captured before, required
  byte-identical after. Both, not just `-wal` — with a pre-existing non-zero `-wal` the cleanup
  declines wholesale, so the `-shm` is byte-stable too and there is no reason to key it weaker.
  (With the *old* zero-length fixture the `-shm` moved 0 B → 32,768 B, which is why the old arm
  could not have been byte-keyed in place without reddening. The fixture change is what makes
  the stronger assertion available, so the two edits are one cure, not two.)
* The `:124` sentence is **re-attributed, not deleted**. Arm C holds a real property — that the
  cleanup is not *relocated* to after the write open — and that is what it should claim.
* `scripts/backfill-entity-bindings.mts:677`–`:678` carries the same false attribution and is
  cured in the same pass. Censused by mechanism rather than by the one line Theseus cited:
  `grep -rn "three green" scripts/` and `grep -rn "arm C holds\|arm D holds" scripts/`, both run
  during triage this fire (**2 sites in `scripts/`**, and that count is a triage observation, not
  a registered prediction — it was measured before this file was written and is reported as
  such).

## 6. Landing rule, set before the result is known

The cure lands iff **P4 and P5 both hold** — arm D reddens under X1 *and* stays green on a
healthy product. P1/P2/P3/P6 are findings about what my published arm was worth; they do not
gate the cure. If P3 is refuted the cure still lands, and the RESULTS say plainly that Theseus's
fix as written was sufficient and my §1 was wrong.

## 7. Restoration

Pre-action baseline taken before the first edit: `HEAD`, and `git status --short -- packages/
scripts/`. After: `grep -c U465ARMD` over `scripts/` must be **0**, and `git diff <baseline>
--stat -- packages/ scripts/` must show exactly the two intended files.
