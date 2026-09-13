/**
 * Entity-name guessing for imports.
 *
 * Per xian's 2026-08-08 answer on identity resolution: Klatch guesses the name
 * and the user confirms it at import time — both, not either/or. This module is
 * the guess half.
 *
 * The guess always carries its `basis` — what the guess was made *from*. A
 * confirmation step the user can't evaluate is a rubber stamp, so "Daedalus"
 * means little on its own while "Daedalus, from the session's own identity
 * line" can be judged at a glance. Same discipline as publishing the predicate
 * alongside a finding.
 */

export type GuessBasis =
  /** The session states its own identity ("You are Daedalus, ..."). Strongest signal. */
  | 'identity-claim'
  /**
   * The session states its own *role* rather than a name ("You are my chief of
   * staff", "you are the Head of Sapient Resources").
   *
   * **Measured, Round 201/202.** Of the 14 in-window identity claims in xian's
   * March corpus, **zero propose a name** — every one is a role claim, and the
   * candidate words are `my`, `the`, `you`, `taking`, `succeeding`. Round 199
   * measured `identity-claim` at 0 of 7 precision on this corpus; Round 201
   * measured the other half, a recall ceiling of **0 out of 0**. This basis is
   * therefore not a fallback behind `identity-claim` on imported claude-ai
   * sessions — it is the only basis those sessions support.
   *
   * Precision on the same corpus: **9 of 9** determiner constructions extract a
   * real role title (`.testdata` measurement, Round 202). The determiner is what
   * makes that hold — see `ROLE_PATTERN_SOURCES`.
   */
  | 'role-title'
  /** No identity claim; fell back to the source project's name. Weak — expect edits. */
  | 'project-name'
  /** Nothing usable to guess from. The user has to name it. */
  | 'none';

/**
 * Every `GuessBasis` value, as data — so a caller taking a basis from an
 * operator (the backfill CLI's `--bases`) can reject an unknown one instead of
 * casting it through `as any[]` and reporting the resulting all-excluded run as
 * an empty corpus. Theseus's Round 176 G1.
 *
 * The assertion below fails to compile if a member is added to `GuessBasis`
 * without being added here, so the list cannot drift from the type.
 */
export const GUESS_BASES = ['identity-claim', 'role-title', 'project-name', 'none'] as const;
type _BasesAreExhaustive = Exclude<GuessBasis, (typeof GUESS_BASES)[number]> extends never
  ? true
  : never;
const _basesAreExhaustive: _BasesAreExhaustive = true;
void _basesAreExhaustive;

/**
 * Whether a guess made on this basis may bind to an entity that already carries
 * the same name, or must always mint a fresh one.
 *
 * **Why the basis has to reach the binding decision at all.** Theseus's Round
 * 201 §5 read `entity-backfill.ts` and found `action: targetId ?
 * 'matched-by-name' : 'minted'` with `targetId` looked up purely by normalized
 * name — reuse never consults the basis. A `role-title` guess shipped through
 * that path silently binds every channel that says "Chief of Staff" to *one*
 * entity, across every project, and the collision warning only sees inside a
 * single plan. `PREMISE.md`: the entity **is** its conversation, so two
 * Chief-of-Staff conversations on two projects are two entities.
 *
 * A name is a claim about *who*; a role title is a claim about *what job*. Two
 * sessions naming the same agent are evidence of one agent. Two sessions naming
 * the same job are not.
 *
 * **What this default costs, measured.** In xian's March corpus the one
 * role-title collision is two "tech-savvy Communications Chief" channels (72 and
 * 299 rows) whose own openers place them on the same named project in successive
 * date ranges — almost certainly one continuing agent, which this default splits
 * into two entities. Splitting wrongly is repaired by a human merge; merging
 * wrongly re-stamps hundreds of rows onto an identity that was never there. The
 * plan reports the near-miss (`sameNameEntityId`) so the split is visible on the
 * sheet rather than silent.
 *
 * A project-scoped rule ("reuse within one project, never across") would get
 * both cases right and is **not implementable on measured evidence**: all 139
 * channels in that corpus have `project_id IS NULL` and the `projects` table is
 * empty. Recorded as the shape to revisit when a corpus with projects exists.
 *
 * Exhaustive by construction — a new `GuessBasis` member does not compile until
 * someone decides this question for it.
 */
export const BASIS_REUSES_BY_NAME: Record<GuessBasis, boolean> = {
  'identity-claim': true,
  'role-title': false,
  'project-name': true,
  none: false,
};

export interface EntityNameGuess {
  /** Proposed name. Empty string when basis is 'none'. */
  name: string;
  basis: GuessBasis;
  /** One line the UI can show verbatim so the user can evaluate the guess. */
  rationale: string;
}

/**
 * Identity-claim patterns, most-specific first. These match how agent sessions
 * actually open — an assignment of identity in the opening turn.
 *
 * Deliberately narrow: a false "no guess" costs the user one field of typing,
 * while a confident wrong guess is the thing a confirm step exists to catch,
 * and a plausible wrong name is likelier to be waved through than a blank.
 *
 * Sources, not `RegExp` objects, because the scan below needs the `g` flag and
 * a global regex carries `lastIndex` between calls. Constructed per scan so the
 * module holds no matching state.
 */
const IDENTITY_PATTERN_SOURCES: string[] = [
  String.raw`\byou\s+are\s+([A-Za-z][A-Za-z0-9'’-]{1,30})\b`,
  // `['’]?`, not `'?`: the candidate class already accepts a typographic
  // apostrophe, so "You’re Daedalus" — anything exported from a phone, or typed
  // in an editor with smart quotes — matched nothing at all and took the blank.
  // Theseus's Round 201 §6, found because his own fixture had the curly one.
  String.raw`\byou['’]?re\s+([A-Za-z][A-Za-z0-9'’-]{1,30})\b`,
  String.raw`\bacting\s+as\s+([A-Za-z][A-Za-z0-9'’-]{1,30})\b`,
  String.raw`\bthis\s+is\s+([A-Za-z][A-Za-z0-9'’-]{1,30})\s+(?:resuming|continuing|picking\s+up)\b`,
];

/**
 * Words that turn an identity claim into a *condition on a future state* rather
 * than an assignment of identity: "**once** you are up to speed", "**when** you
 * are ready", "**as far as** you are aware".
 *
 * **Measured, Theseus's Round 201 §3.** In xian's March corpus every one of the
 * 7 false pattern hits sits in a subordinate clause and not one of the 14 real
 * claims does — 7/7 and 14/14, and four words (`once`, `when`, `if`, `as far
 * as`) account for all of it. That is the same separation `IDENTITY_WINDOW_CHARS`
 * gets on this corpus, but it does not depend on *where* the sentence falls, so
 * it survives the rewrite that defeats the window: the window is a bound on
 * distance, not on falseness, and for any opener shorter than 400 characters it
 * excludes nothing at all. Write "Hi! Once you are ready we can begin" and the
 * pre-202 module proposes `"Ready"` at the strongest confidence it has.
 *
 * With this in place the window becomes a backstop rather than the only guard.
 * Both are kept: they fail in the same direction, and Round 200 measured the
 * window's own contribution at 5 of 7.
 *
 * Grammatical, not a denylist of English words — which is the trap Round 201 §2
 * named. These are subordinating conjunctions of condition and time; the set is
 * closed in a way that "words that are not names" is not.
 *
 * The cost, stated exactly: "**Now that** you are Daedalus, …" would be refused
 * if `now that` were here. It is deliberately absent — it asserts a present
 * state rather than conditioning on a future one. Of the listed four, a refusal
 * costs one field of typing; zero such sentences exist in 139 channels.
 */
const SUBORDINATORS: string[] = [
  'once', 'when', 'whenever', 'if', 'unless', 'until', 'till',
  'after', 'before', 'while', 'as soon as', 'as long as', 'as far as',
];

/**
 * True when the text immediately preceding a claim ends in a subordinating
 * conjunction — i.e. the claim is the conjunction's clause.
 *
 * Anchored at the end of `before`, so only the word actually introducing this
 * clause counts. "Once you're oriented" is refused; "Once we are done, you are
 * Daedalus" is not, because `once` no longer abuts the claim.
 */
function isSubordinateClaim(before: string): boolean {
  const tail = before.toLowerCase();
  return SUBORDINATORS.some((word) =>
    new RegExp(String.raw`(?:^|[^a-z])${word.replace(/ /g, String.raw`\s+`)}[\s,]*$`).test(tail)
  );
}

/**
 * Role-claim patterns: a determiner, then the job.
 *
 * **The determiner is the whole trick.** Round 201 arm C showed 18 of 20
 * plainly-not-a-name openers written at offset 0 still mint at `identity-claim`
 * — `"You are welcome"`, `"You are back"`, `"You are ready"`. None of those
 * carries a determiner. Requiring one splits the two populations without a
 * denylist: measured over all 85 openers with text in xian's March corpus there
 * are **9 determiner hits inside the window and 9 of 9 extract a real role
 * title** (`career coach`, `Chief Innovation Office (CIO)`, `tech-savvy
 * communications chief`, `Head of Sapient Resources (HoSR)`, `Executive
 * Assistant and Chief of Staff`, `chief of staff`, `chief architect`, `Chief of
 * Staff (Executive Assistant)`), and **0 hits outside the window**.
 *
 * This cannot collide with `identity-claim`, which is tried first: every
 * determiner in this set is in `NOT_NAMES`, so a determiner construction can
 * never produce a name guess. The two bases partition the same sentences.
 *
 * Not recovered, and named so the recall claim is honest: `"You are you Security
 * Operations (Sec Ops) agent"` (a typo for "your") and `"You are taking on a new
 * role on this project, exploratory testing agent"` both state a role through a
 * construction this does not match. 9 of the 11 role-bearing channels, not 11.
 */
const ROLE_PATTERN_SOURCES: string[] = [
  String.raw`\byou\s+are\s+(my|our|the|a|an)\s+([^.!?\n]{1,120})`,
  String.raw`\byou['’]?re\s+(my|our|the|a|an)\s+([^.!?\n]{1,120})`,
];

/**
 * How far into the opening turn an identity claim is still an identity claim.
 *
 * **Measured, not chosen.** Against xian's March corpus (139 channels, 15 with
 * at least one pattern hit) every claim that is genuinely the session being
 * assigned an identity starts at offset 0–158; every hit at offset ≥511 is a
 * sentence that merely contains the words ("once you are up to speed", "when
 * you are ready", "once you're oriented", "as far as you are aware", "once you
 * are settled in"). The gap between the two populations is 353 characters wide
 * with nothing in it. 400 sits in that gap: 2.5× the furthest real claim, and
 * 111 characters clear of the nearest false one.
 *
 * This is what makes the rationale below true. An identity claim 1,706
 * characters into a 2,528-character opener is not the session "opening by
 * naming itself", and Round 199 found the module saying exactly that about
 * `"Oriented"`, picked out of "Once you're oriented, please review this batch".
 *
 * The failure this accepts: an opener that front-loads a long preamble — a
 * pasted file, a long briefing — before saying who the agent is gets no guess.
 * That is one field of typing, which is the direction this module has always
 * preferred to fail in.
 */
export const IDENTITY_WINDOW_CHARS = 400;

/**
 * Words that match the shape of a name but never *are* one in these openers —
 * "You are working on...", "You are the architecture agent". Without this the
 * pattern happily proposes "The" or "Working" as an agent name.
 *
 * Two groups were added in Round 200, both found by running the guess against
 * real imported sessions for the first time:
 *
 * - **`you` and the rest of the pronouns.** The list had `your`, `i`, `it`,
 *   `we`, `they`, `he`, `she` and not `you`, so `"You are you Security
 *   Operations agent"` (a typo for "your") proposed the agent name `"You"`.
 *   The object and remaining subject forms are here now too, as the same
 *   oversight waiting to happen.
 * - **Continuation verbs.** `"You are succeeding these predecessor chats"` →
 *   `Succeeding`; `"You are taking over from your predecessor"` → `Taking`.
 *   The patterns are tuned for how a session opens when it is *new*; the
 *   backfill corpus is made of sessions that opened when they were *resumed*,
 *   and that mismatch produced five of the seven bad names in Round 199.
 */
const NOT_NAMES = new Set([
  'a', 'an', 'the', 'my', 'our', 'your', 'this', 'that', 'these', 'those',
  'working', 'about', 'going', 'now', 'here', 'there', 'currently',
  'responsible', 'free', 'able', 'expected', 'asked', 'being', 'not',
  'i', 'it', 'we', 'they', 'he', 'she', 'one', 'in', 'on', 'at', 'to',
  // pronouns — `you` is the one that actually fired
  'you', 'me', 'us', 'them', 'him', 'her', 'his', 'their', 'its', 'who',
  // continuation verbs: a resumed session says what it is doing, not who it is
  'succeeding', 'taking', 'continuing', 'resuming', 'replacing', 'picking',
  'carrying', 'inheriting', 'following', 'stepping', 'assuming', 'joining',
]);

/**
 * Words that, following an `-ing` candidate, mean the candidate was a verb.
 * "You are taking **over** from…", "You are succeeding **these** chats…".
 *
 * The general net behind the named continuation verbs above: that list covers
 * what this corpus happens to contain, this covers the ones nobody has written
 * down yet. A real agent named e.g. "Sterling" followed by a preposition is
 * refused by this rule — accepted, on the module's standing trade: a blank
 * costs one field of typing, a plausible wrong name gets waved through.
 */
const VERB_TAILS = new Set([
  'over', 'from', 'on', 'in', 'into', 'up', 'out', 'off', 'onto', 'as',
  'these', 'those', 'this', 'that', 'the', 'a', 'an',
  'my', 'your', 'our', 'his', 'her', 'their', 'its',
  'after', 'where', 'when', 'with', 'for',
]);

/**
 * Matching is case-insensitive on purpose: sessions open with "You are
 * Daedalus" and "you are daedalus" about equally often, and requiring a
 * capital would silently drop the lowercase half onto the project-name
 * fallback. Casing therefore can't do the filtering — the stopword list does
 * it.
 *
 * @param after Text following the candidate, for the `-ing` + preposition rule.
 *   The caller has it; the candidate alone cannot decide that case.
 *
 * This doc comment used to finish "…and the confirm step
 * catches whatever slips through." It no longer says that, because Round 199
 * established the backfill CLI **has no confirm step** — `--apply` applies, and
 * `--channels=` is a gate that needs an operator who read the sheet. The
 * filtering here is the only filtering there is on that path.
 */
/**
 * Tokens that end a role phrase, because they start something that is not the
 * job: a scope phrase ("… **here on** the Piper Morgan project", "… (HoSR)
 * **for** the Piper Morgan project"), a time adverb ("my career coach
 * **today**"), or a relative clause ("my chief architect **who** …").
 *
 * `of` is deliberately absent — it is *inside* "Head **of** Sapient Resources"
 * and "Chief **of** Staff", the two most common role shapes in the corpus. `and`
 * is handled separately below, because it both joins titles ("Executive
 * Assistant **and** Chief of Staff") and starts a new clause ("my chief
 * architect **and you** help me …").
 */
const ROLE_PHRASE_STOPS = new Set([
  'for', 'on', 'in', 'at', 'with', 'from', 'to', 'by', 'about', 'during',
  'over', 'under', 'within', 'across', 'into', 'onto', 'per', 'via',
  'here', 'there', 'today', 'tonight', 'now', 'currently', 'also', 'again',
  'who', 'which', 'that', 'whose', 'whom', 'so', 'because', 'but',
]);

/**
 * What, following `and`, means the sentence has moved on from the title to a new
 * clause — a pronoun or a possessive. "… and Chief of Staff" keeps going; "… and
 * you help me maintain our architectural principals" stops.
 */
const AND_ENDS_TITLE_BEFORE = new Set([
  'you', 'i', 'we', 'they', 'he', 'she', 'it', 'your', 'my', 'our', 'their',
  "i'll", 'i’ll', "you'll", 'you’ll', "we'll", 'we’ll',
]);

/** Longest role title this will propose, in words. Roles are short; runaways aren't roles. */
const ROLE_MAX_WORDS = 8;

/**
 * Take the job out of a role claim: everything from the determiner to the first
 * token that is no longer part of the noun phrase.
 *
 * Returns `''` when what it finds is one word. **Measured:** all 9 role titles
 * in xian's March corpus are 2–6 words and the corpus contains no one-word
 * determiner hit at all, so this costs nothing there, and it refuses the class
 * that arrives with a determiner and no job — "You are **a genius**", "You are
 * **the best**". The residual it does *not* close is stated in the module's
 * standing direction rather than hidden: "You are a good friend" still yields the
 * two-word phrase `good friend`. There is no positive evidence of *role*-hood
 * here, only of noun-phrase-hood, which is why this basis is not in
 * `DEFAULT_APPLY_BASES` and an operator has to ask for it by name.
 */
function extractRoleTitle(tail: string): string {
  const words = tail.trim().split(/\s+/);
  const kept: string[] = [];
  for (let i = 0; i < words.length; i++) {
    const raw = words[i];
    const word = raw.toLowerCase().replace(/[^a-z0-9'’()-]/g, '');
    if (!word) break;
    if (ROLE_PHRASE_STOPS.has(word)) break;
    if (word === 'and') {
      const next = words[i + 1]?.toLowerCase().replace(/[^a-z0-9'’-]/g, '') ?? '';
      if (AND_ENDS_TITLE_BEFORE.has(next)) break;
    } else if (word.endsWith('ing') && kept.length > 0) {
      // a participle ends the noun phrase: "… (CIO) taking over from your predecessor"
      break;
    }
    kept.push(raw);
    if (kept.length >= ROLE_MAX_WORDS) break;
  }
  // A title cannot end on a conjunction or dangling punctuation.
  while (kept.length && /^(?:and|&|[-,;:])$/i.test(kept[kept.length - 1].replace(/[,;:]+$/, ''))) {
    kept.pop();
  }
  const title = kept.join(' ').replace(/[,;:]+$/, '').trim();
  return title.split(/\s+/).filter(Boolean).length >= 2 ? title : '';
}

function looksLikeName(candidate: string, after: string): boolean {
  if (!candidate) return false;
  const word = candidate.toLowerCase();
  if (NOT_NAMES.has(word)) return false;
  if (word.endsWith('ing')) {
    const nextWord = after.trim().split(/[^A-Za-z'’-]+/, 1)[0]?.toLowerCase() ?? '';
    if (VERB_TAILS.has(nextWord)) return false;
  }
  return true;
}

/**
 * Propose an entity name for an imported session.
 *
 * @param firstUserMessage The session's opening human turn (the scanner's
 *   content fingerprint). Where an identity claim lives, if there is one.
 * @param projectName Source project name — the fallback, and a weak one: it
 *   names the *work*, not the agent doing it.
 */
export function guessEntityName(
  firstUserMessage?: string,
  projectName?: string
): EntityNameGuess {
  const opener = (firstUserMessage || '').trim();

  if (opener) {
    // Every pattern's every occurrence inside the window, then **document
    // order** — not pattern order across the whole message.
    //
    // The old loop tried each pattern against the entire opener in turn, so
    // rejecting a stopword *widened* the search instead of narrowing it:
    // pattern 1 matched "You are my tech-savvy communications chief" at
    // character 7 and was correctly refused, and pattern 2 then reached 1,699
    // characters further down for "Once you're oriented" and proposed
    // `"Oriented"`. Scanning in document order means a refusal can only ever
    // move forward to the next claim, and the window means it cannot move
    // forward out of the opening.
    const window = opener.slice(0, IDENTITY_WINDOW_CHARS);
    const hits: {
      at: number;
      rank: number;
      claim: string;
      candidate: string;
      after: string;
      before: string;
    }[] = [];
    IDENTITY_PATTERN_SOURCES.forEach((source, rank) => {
      const pattern = new RegExp(source, 'gi');
      for (const match of window.matchAll(pattern)) {
        hits.push({
          at: match.index,
          rank,
          claim: match[0],
          candidate: match[1],
          after: window.slice(match.index + match[0].length),
          before: window.slice(0, match.index),
        });
      }
    });
    // Ties broken by pattern specificity, which is the order they are written in.
    hits.sort((a, b) => a.at - b.at || a.rank - b.rank);

    for (const hit of hits) {
      // A condition on a future state is not an assignment of identity, wherever
      // in the message it falls. 7/7 of this corpus's false claims, 0/14 of its
      // real ones.
      if (isSubordinateClaim(hit.before)) continue;
      if (!looksLikeName(hit.candidate, hit.after)) continue;
      // Normalize casing so "you are daedalus" and "You are Daedalus"
      // propose the same entity — otherwise the same agent imported from two
      // sessions yields two entities that differ only by capitalization.
      const name = hit.candidate.charAt(0).toUpperCase() + hit.candidate.slice(1);
      return {
        name,
        basis: 'identity-claim',
        rationale:
          `The session's opening turn says "${hit.claim}".`,
      };
    }

    // No name claim. A *role* claim is the next-strongest thing the session can
    // say about itself, and on imported claude-ai sessions it is the only thing
    // it ever says — Round 201 measured `identity-claim`'s recall ceiling on
    // xian's corpus at 0 out of 0, with all 14 in-window claims being role
    // claims. Same window and same subordinate-clause guard: "once you are the
    // lead on this" is a condition here too.
    const roleHits: { at: number; rank: number; claim: string; title: string }[] = [];
    ROLE_PATTERN_SOURCES.forEach((source, rank) => {
      const pattern = new RegExp(source, 'gi');
      for (const match of window.matchAll(pattern)) {
        if (isSubordinateClaim(window.slice(0, match.index))) continue;
        const title = extractRoleTitle(match[2]);
        if (!title) continue;
        roleHits.push({
          at: match.index,
          rank,
          // Quote the determiner and the title, not the 120 characters the
          // pattern was allowed to look at.
          claim: `${match[0].slice(0, match[0].length - match[2].length)}${title}`,
          title,
        });
      }
    });
    roleHits.sort((a, b) => a.at - b.at || a.rank - b.rank);
    const role = roleHits[0];
    if (role) {
      return {
        name: role.title,
        basis: 'role-title',
        rationale:
          `The session's opening turn says "${role.claim}" — a role, not a name. ` +
          `Two sessions holding the same job are not the same agent, so this ` +
          `mints a new entity rather than reusing one by name.`,
      };
    }
  }

  const project = (projectName || '').trim();
  if (project) {
    return {
      name: project,
      basis: 'project-name',
      rationale:
        `No identity line found in this session; suggesting the project name "${project}". ` +
        `This names the work, not the agent — worth changing if you know who this was.`,
    };
  }

  return {
    name: '',
    basis: 'none',
    rationale: 'Nothing in this session identifies the agent. Please name it.',
  };
}
