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
 */
const IDENTITY_PATTERNS: RegExp[] = [
  /\byou\s+are\s+([A-Za-z][A-Za-z0-9'’-]{1,30})\b/i,
  /\byou'?re\s+([A-Za-z][A-Za-z0-9'’-]{1,30})\b/i,
  /\bacting\s+as\s+([A-Za-z][A-Za-z0-9'’-]{1,30})\b/i,
  /\bthis\s+is\s+([A-Za-z][A-Za-z0-9'’-]{1,30})\s+(?:resuming|continuing|picking\s+up)\b/i,
];

/**
 * Words that match the shape of a name but never *are* one in these openers —
 * "You are working on...", "You are the architecture agent". Without this the
 * pattern happily proposes "The" or "Working" as an agent name.
 */
const NOT_NAMES = new Set([
  'a', 'an', 'the', 'my', 'our', 'your', 'this', 'that', 'these', 'those',
  'working', 'about', 'going', 'now', 'here', 'there', 'currently',
  'responsible', 'free', 'able', 'expected', 'asked', 'being', 'not',
  'i', 'it', 'we', 'they', 'he', 'she', 'one', 'in', 'on', 'at', 'to',
]);

/**
 * Matching is case-insensitive on purpose: sessions open with "You are
 * Daedalus" and "you are daedalus" about equally often, and requiring a
 * capital would silently drop the lowercase half onto the project-name
 * fallback. Casing therefore can't do the filtering — the stopword list does
 * it, and the confirm step catches whatever slips through.
 */
function looksLikeName(candidate: string): boolean {
  if (!candidate) return false;
  return !NOT_NAMES.has(candidate.toLowerCase());
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
    for (const pattern of IDENTITY_PATTERNS) {
      const match = opener.match(pattern);
      const candidate = match?.[1];
      if (candidate && looksLikeName(candidate)) {
        // Normalize casing so "you are daedalus" and "You are Daedalus"
        // propose the same entity — otherwise the same agent imported from two
        // sessions yields two entities that differ only by capitalization.
        const name = candidate.charAt(0).toUpperCase() + candidate.slice(1);
        return {
          name,
          basis: 'identity-claim',
          rationale: `The session opens by naming itself "${name}".`,
        };
      }
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
