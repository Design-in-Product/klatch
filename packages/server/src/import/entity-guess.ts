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
export const GUESS_BASES = ['identity-claim', 'project-name', 'none'] as const;
type _BasesAreExhaustive = Exclude<GuessBasis, (typeof GUESS_BASES)[number]> extends never
  ? true
  : never;
const _basesAreExhaustive: _BasesAreExhaustive = true;
void _basesAreExhaustive;

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
  String.raw`\byou'?re\s+([A-Za-z][A-Za-z0-9'’-]{1,30})\b`,
  String.raw`\bacting\s+as\s+([A-Za-z][A-Za-z0-9'’-]{1,30})\b`,
  String.raw`\bthis\s+is\s+([A-Za-z][A-Za-z0-9'’-]{1,30})\s+(?:resuming|continuing|picking\s+up)\b`,
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
    const hits: { at: number; rank: number; claim: string; candidate: string; after: string }[] = [];
    IDENTITY_PATTERN_SOURCES.forEach((source, rank) => {
      const pattern = new RegExp(source, 'gi');
      for (const match of window.matchAll(pattern)) {
        hits.push({
          at: match.index,
          rank,
          claim: match[0],
          candidate: match[1],
          after: window.slice(match.index + match[0].length),
        });
      }
    });
    // Ties broken by pattern specificity, which is the order they are written in.
    hits.sort((a, b) => a.at - b.at || a.rank - b.rank);

    for (const hit of hits) {
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
