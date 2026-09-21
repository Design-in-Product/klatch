/**
 * Mint a Claude Code transcript with a chosen number of turns.
 *
 * ## Why this exists
 *
 * Theseus, Round 242 (`docs/mail/theseus-to-daedalus-…-no-band-fixes-arm-a-and-my-census-arm-found-124-invisible-transcripts-2026-09-20.md`
 * §1–3), measured every `.jsonl` on this machine with the product's own parser:
 *
 * ```
 * ALL        n= 535  med=1  max=277  >1 turn: 17
 * in-band    n= 162  med=1  max=  5  >1 turn:  1
 * ```
 *
 * **518 of 535 real sessions are exactly one turn.** So a probe that resolves a real cast out of
 * `~/.claude/projects` and then asserts anything about *assistant rows* is almost certainly
 * asserting it over **one row** — which is how `probe-import-entity-binding.mts` arm A came to
 * carry a fanout check that passes on data with the fanout defect injected (Round 242 arm F).
 *
 * His counting result is the part that closes the door on the obvious fix: the size band is not
 * mistuned, and no band repairs it. 17 multi-turn sessions live in 14 directories, only **3** of
 * which hold two or more — so a turn-aware resolver needing 5 directories **refuses permanently
 * on the machine the probe exists to run on**. Correct refusal, useless probe.
 *
 * The remedy is the one Round 240 §4 has now produced three rounds running: **mint it.** A claim
 * about rows does not need a real transcript, it needs many assistant rows, and those are free.
 *
 * ## The division of labour this module assumes
 *
 * - Claims about **identity** — independent authorship, distinct real names, one entity per
 *   source — need real, independently-authored transcripts. One turn is plenty. That is
 *   {@link ./probe-corpus-sessions.mts}.
 * - Claims about **rows** — fanout, per-message binding, counts that scale with the conversation
 *   — need a known number of assistant rows and nothing else. That is this module.
 *
 * Mixing them is how an instrument reports power it does not have.
 *
 * ## The write guard is structural, not a promise
 *
 * Round 242 arm G checked, after the fact, that the probe had not written into the corpus it was
 * measuring. That is the right check and the wrong place for it: an instrument that mutates its
 * subject has already done so by the time an arm notices. {@link mintTranscript} **throws** if
 * its target directory resolves inside a Claude Code corpus root, so the failure mode is
 * unreachable rather than detected.
 */

import fs from 'fs';
import path from 'path';
import { DEFAULT_PROJECTS_DIR } from './probe-corpus-sessions.mts';

export interface MintOptions {
  /**
   * Session id, and the basename stem. Use a minted marker, never a value that occurs in the
   * world — Round 240 §4. Callers in this repo prefix with the round (`r243-…`).
   */
  id: string;
  /** How many human prompts to write. The parser emits one turn, and the import one assistant row, per prompt. */
  turns: number;
  /** Directory to write into. Must not be inside a Claude Code corpus root; created if absent. */
  dir: string;
  /** Recorded as the transcript's `cwd` basename. Cosmetic; the import derives a channel name from it. */
  project?: string;
  model?: string;
  /** Corpus roots this transcript must not land inside. Defaults to the live one. */
  forbiddenRoots?: string[];
}

export interface MintedTranscript {
  path: string;
  /** Turns requested — and, per {@link mintTranscript}'s contract, turns the parser will emit. */
  turns: number;
  sizeBytes: number;
  sessionId: string;
}

/**
 * Write a transcript with exactly `turns` human prompts, each answered once.
 *
 * The shape is the one the real parser accepts, verified against it rather than against the docs:
 * a `user` event whose `message.content` is a plain string (so `isHumanTurnBoundary` accepts it —
 * a `tool_result` envelope would be filtered as injected), then an `assistant` event carrying a
 * `text` block. No `isSidechain`, so every event survives `isConversationEvent`.
 *
 * @throws Error if `dir` resolves inside a forbidden corpus root, or `turns < 1`.
 */
export function mintTranscript(opts: MintOptions): MintedTranscript {
  const { id, turns } = opts;
  if (turns < 1) throw new RangeError(`turns must be >= 1, got ${turns}`);

  const dir = path.resolve(opts.dir);
  const roots = (opts.forbiddenRoots ?? [DEFAULT_PROJECTS_DIR]).map((r) => path.resolve(r));
  for (const root of roots) {
    if (dir === root || dir.startsWith(root + path.sep)) {
      throw new Error(
        `refusing to mint into ${dir}: it is inside the Claude Code corpus root ${root}. ` +
          `An instrument must not write into the corpus it measures — mint under .testdata/ instead.`,
      );
    }
  }
  fs.mkdirSync(dir, { recursive: true });

  const project = opts.project ?? id;
  const base = {
    parentUuid: null as string | null,
    userType: 'external',
    cwd: `/Users/test/minted/${project}`,
    sessionId: id,
    version: '2.1.19',
    gitBranch: 'main',
    slug: 'minted',
  };

  const lines: string[] = [];
  for (let i = 0; i < turns; i++) {
    // Zero-padded to 3 so timestamps stay sortable past 100 turns — a flat timestamp sort is
    // what groupIntoTurns uses, so `10` sorting before `9` would silently reorder the transcript.
    const t = String(i).padStart(3, '0');
    const mm = String(Math.floor(i / 60) % 60).padStart(2, '0');
    const ss = String(i % 60).padStart(2, '0');
    lines.push(
      JSON.stringify({
        ...base,
        type: 'user',
        message: { role: 'user', content: `Question ${i} for ${id}, asked by a human.` },
        uuid: `${id}-u${t}`,
        timestamp: `2026-03-14T10:${mm}:${ss}.000Z`,
      }),
    );
    lines.push(
      JSON.stringify({
        ...base,
        parentUuid: `${id}-u${t}`,
        type: 'assistant',
        message: {
          model: opts.model ?? 'claude-opus-5',
          id: `msg-${id}-${t}`,
          type: 'message',
          role: 'assistant',
          content: [{ type: 'text', text: `Answer ${i} from ${id}.` }],
          stop_reason: 'end_turn',
          usage: { input_tokens: 10, output_tokens: 5 },
        },
        uuid: `${id}-a${t}`,
        timestamp: `2026-03-14T10:${mm}:${ss}.500Z`,
      }),
    );
  }

  const p = path.join(dir, `${id}.jsonl`);
  fs.writeFileSync(p, lines.join('\n') + '\n');
  return { path: p, turns, sizeBytes: fs.statSync(p).size, sessionId: id };
}
