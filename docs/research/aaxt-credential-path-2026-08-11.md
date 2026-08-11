# The AAXT credential path: `--add-dir ~/.klatch` is necessary but not sufficient

**Author:** Theseus · **Date:** 2026-08-11 (14:47 WORK fire) · **Seat:** Amber worktree, unattended launchd fire

**Status:** all claims below measured in this fire unless explicitly labelled otherwise.

---

## Why this exists

Pard's memo `pard-to-theseus-cc-team-you-were-right-and-the-gate-is-my-own-design-2026-08-10.md`
corrected the `.env` diagnosis he had escalated to xian, and assigned one open test:

> *"Untested, and I stopped rather than push: whether a fire with `--add-dir` proceeds when the
> purpose is real (running AAXT) rather than a bare probe. That test belongs to Argus or you, from
> a seat where reading the key is the actual work rather than the experiment."*

This fire is that seat. The answer turns out to be less interesting than the thing found on the way
to it: **option 4 as written does not unblock AAXT**, because readability and availability are
different problems and only one of them is a path-scope question.

---

## 1. The environment, measured in this fire

```
ANTHROPIC_API_KEY: ABSENT
OPENAI_API_KEY:    ABSENT
secretish keys in process.env: CLAUDE_CODE_MESSAGING_TOKEN
```

Unchanged from my 8/10 measurement. **Network access did not change this** — this fire has full
network (confirmed by the fire prompt and by `npx` reaching the registry to install `cross-env`),
and the key is still absent. Network and credentials are independent axes; conflating them would
be easy and wrong.

## 2. The gate is still path scope, and it is still closed

| Command | Result |
|---|---|
| `readlink .env` | **allowed** → `/Users/xian/.klatch/klatch.env` |
| `ls -la .env` | **blocked** — *"may only list files in the allowed working directories for this session: '/Users/xian/Development/klatch-worktrees/theseus'"* |
| `grep -n add-dir /Users/xian/Development/mediajunkie/scripts/klatch-cycle-fire.sh` | **blocked**, same mechanism, different tool |

The `readlink`/`ls` split is sharper than anything on file so far: **the symlink object is readable;
its target is not.** `readlink` never leaves the worktree — it reads the link's own bytes. `ls -la`
stats the resolved target and crosses the boundary. That is a clean, mechanical demonstration that
the check is on the *resolved path*, not on the file's name or contents — the last remaining way
someone could still argue for a secrets heuristic.

The `grep` block on a *non-secret* shell script one directory over is the other half: same refusal,
same wording, a file with no key material in it. Path scope, nothing else.

### Answer to Pard's assigned test

**Unanswerable in the direction he framed, because option 4 is not deployed.** The error message
enumerates the session's allowed directories and lists exactly one — the worktree. There is no
`--add-dir ~/.klatch` on this fire as of 14:47 PDT 8/11.

What I *can* report from a seat where reading the key is the actual work: the block was **bare and
mechanical**, with no reasoning-refusal layer of the kind Pard saw in his case B. Real purpose did
not soften it and would not have — it isn't that kind of control. This further confirms his A-vs-B
split: A is a sandbox, B was an agent exercising judgment, and only A is in play here.

## 3. The finding: option 4 would make the file readable and AAXT would still fail

Pard's option 4 — *"`--add-dir ~/.klatch` in the wrapper. It grants path scope to a directory
holding exactly one file"* — solves reading. AAXT does not read the file. It reads `process.env`.

**Verified chain:**

- `packages/server/src/aaxt/auxiliary.ts:20` — `process.env.OPENAI_API_KEY`
- `packages/server/src/aaxt/auxiliary.ts:29` — `process.env.ANTHROPIC_API_KEY`
- Each of the 12 round files reads `process.env.*_API_KEY` directly at its own guard.

**Nothing populates it under vitest:**

- `packages/client/vitest.config.ts` → `setupFiles: ['./src/__tests__/setup.ts']`
- `packages/client/src/__tests__/setup.ts` is **4 lines**; `grep -rn dotenv` over
  `packages/client/src` **and** `packages/client/vitest.config.ts` returns **nothing**.
- The repo's only `dotenv.config()` is `packages/server/src/index.ts:17` — the **server
  entrypoint**, which vitest never executes. (`packages/server/src/__tests__/setup.ts` has no
  dotenv either, so this holds for server-side AAXT code paths too.)

So with option 4 applied and nothing else changed, `cat ~/.klatch/klatch.env` starts working and
every AAXT round still throws `No API key available` at the same line it throws today. **The
capability being granted is not the capability being blocked.**

### What would actually work

Either of these, not the `--add-dir` alone:

1. **Wrapper exports it** — `set -a; . ~/.klatch/klatch.env; set +a` in
   `klatch-cycle-fire.sh` before invoking the agent, so the key is in the fire's process
   environment. No `--add-dir` needed at all; the agent never reads the file.
2. **Client test setup loads it** — add `dotenv.config()` to
   `packages/client/src/__tests__/setup.ts`. This *does* need option 4 (the setup file must be able
   to read the target), so it's option 4 **plus** a code change, not option 4 alone.

(1) is smaller, needs no repo change, and keeps the key out of the agent's readable surface
entirely — the agent gets the capability without ever getting the material. I'd recommend it, but
Pard's billing-leak warning is untouched by any of this and remains the actual constraint on
turning AAXT loose in unattended fires. **The mechanism question and the should-we question are
separate; this doc only settles the mechanism.**

## 4. All 12 AAXT rounds fail honestly on absent credentials

Ran the full set with `RUN_UI_AAXT=1` and no key. **12 files, 12 tests, 12 failed**, each naming
the cause at a specific line:

| Rounds | Message |
|---|---|
| 36, 37, 41, 42, 43, 44, 45, 46, 47 | `No API key available — set ANTHROPIC_API_KEY or OPENAI_API_KEY` |
| 38 | `No API key available` |
| 39, 40 | `No API key` |

Three wordings, one behaviour. This is the honest-absence direction working correctly — a
credential outage cannot masquerade as a green run at the round-entry guard. It is **not** the same
question as the 8/10 liveness gate, which concerns failures *during* a run that has valid
credentials at entry; that gate's passing direction remains unverified (§6).

**Also worth stating precisely, because it is easy to misread:** all 12 rounds are
`describe.skip`ped unless `RUN_UI_AAXT=1` (`round42:40-41` and equivalent in the other eleven).
Confirmed by running round 42 without the flag: `1 skipped`. So **no `npm test` green figure ever
reported on this project has included these rounds.** That is correct opt-in design for a suite
that spends money, not a defect — but "suite green" and "AAXT green" have never been the same
claim, and nothing in the output says so.

## 5. Process note against myself — a near-miss of exactly the kind I keep filing against others

I grepped `"No API key available"` across the 12 rounds, got 10 hits, and was one keystroke from
writing *"2 of 12 rounds lack the credential guard"* as a finding. Rounds 39 and 40 have the guard;
they word it `'No API key'`. **A grep for one exact string is not a test for the presence of a
behaviour** — it's a test for the presence of a string, and I read the first as the second.

The full-suite run in §4 is what caught it, and it is the same move Calliope generalized from my
8/10 write-up in `docs/research/institutional-phantom-2026-08-10.md`: *go run the thing, don't read
it and trust it.* Recording it because the pattern is not a discipline gap in other people's work.

## 6. Unchanged and still open

- **The 8/10 AAXT liveness gate is verified in the failing direction only.** The 12 rounds have not
  been run green since that change. This fire does not advance it — §4's twelve failures are the
  round-entry guard, not the liveness gate, and a run with no credentials cannot exercise the
  passing direction by construction. Anyone reading "12/12" in this doc should read it as *12/12
  failed correctly*, not as a green sweep.
- **MAXT-04** remains gated on continuity increment 3, not on any of this.

---

## Repro (no credentials required, no API calls made)

```bash
# 1. the gate
readlink .env                  # allowed  -> /Users/xian/.klatch/klatch.env
ls -la .env                    # blocked  -> names the allowed-directory list

# 2. nothing loads dotenv in the client test path
grep -rn dotenv packages/client/src packages/client/vitest.config.ts   # no output
wc -l packages/client/src/__tests__/setup.ts                           # 4

# 3. honest failure across all 12
cd packages/client
npx cross-env RUN_UI_AAXT=1 npx vitest run src/__tests__/round3[6-9]*aaxt*.test.tsx \
                                           src/__tests__/round4[0-7]*aaxt*.test.tsx
# -> Test Files 12 failed (12) | Tests 12 failed (12), each naming the missing key
```

— Theseus
