import fs from 'fs';
import os from 'os';
import path from 'path';
import readline from 'readline';
import { createChannelBySessionIdResolver } from '../db/queries.js';
import { isHumanTurnBoundary } from './parser.js';

export interface SessionInfo {
  /** Full path to the JSONL file */
  path: string;
  /** Session UUID (filename without .jsonl) */
  sessionId: string;
  /** Decoded project working directory */
  projectPath: string;
  /** Project name (basename of projectPath) */
  projectName: string;
  /** File size in bytes */
  sizeBytes: number;
  /** Last modified date (ISO string) */
  modifiedAt: string;
  /** Whether this session has already been imported */
  alreadyImported: boolean;
  /** Channel ID if already imported */
  existingChannelId?: string;
  /** Channel name if already imported */
  existingChannelName?: string;
  /** Whether this session came from the exports directory (cloud agent convention) */
  isExported?: boolean;
  /** Content fingerprint — first real human-typed user message, truncated ~80 chars. Empty if not found. */
  firstUserMessage?: string;
  /** Approximate message count (user + assistant turns). May be capped — see fingerprintCapped. */
  messageCount?: number;
  /**
   * Number of human turn boundaries — i.e. how many exchanges this session
   * becomes once imported. This is the count that predicts what lands:
   * `importSession` persists at most two rows per turn.
   *
   * `messageCount` counts raw events instead, and is 2–3x larger on real
   * sessions because every assistant tool-call event is its own JSONL event
   * but collapses into one row plus artifacts. Measured on real sessions:
   * 469 events -> 75 turns -> 143 rows. See
   * `scripts/probe-browse-count-vs-persisted-rows.mts` for the reconciliation.
   *
   * Also capped — see fingerprintCapped.
   */
  turnCount?: number;
  /** True if the fingerprint scan hit its line-read cap before reaching EOF (messageCount is a lower bound). */
  fingerprintCapped?: boolean;
  /**
   * The projects root this session was found under (e.g. `/Users/x/.claude-pm/projects`).
   *
   * **Present only when more than one root is being scanned.** With a single root
   * the value is the same for every session and so carries no information; omitting
   * it keeps the single-root payload byte-identical to what shipped before
   * multi-root support, which is a property worth being able to assert.
   *
   * Nothing renders this today. It exists because a session's root is the only
   * thing that distinguishes which *account* it belongs to — `/Users/x/.claude`
   * vs `/Users/x/.claude-pm` — and two sessions from different accounts can
   * otherwise look identical in Browse. Labelling is Iris's call, not the
   * scanner's; this is the input she'd need.
   */
  sourceRoot?: string;
}

export interface ProjectSessions {
  /** Decoded project working directory */
  projectPath: string;
  /** Project name (basename of projectPath) */
  projectName: string;
  /** Sessions in this project, sorted by modification date (newest first) */
  sessions: SessionInfo[];
}

/**
 * Decode a Claude Code encoded project directory name back to an absolute path.
 * Claude Code encodes cwd by replacing / with - (leading slash becomes leading -).
 * e.g., -home-user-klatch → /home/user/klatch
 *
 * Note: This is a heuristic — ambiguous if directory names contain hyphens.
 * We validate by checking if the decoded path exists on the filesystem.
 */
export function decodeProjectPath(encoded: string): string {
  // Replace leading - with /, then remaining - with /
  // This is the inverse of cwd.replace(/\//g, '-')
  if (encoded.startsWith('-')) {
    return encoded.replace(/-/g, '/');
  }
  return '/' + encoded.replace(/-/g, '/');
}

/**
 * Expand a leading `~/` against the home directory.
 *
 * These paths arrive from `.env`, which is read by dotenv and not by a shell, so
 * a `~` written there stays a literal `~` and would silently resolve to a
 * non-existent relative directory. Only a leading `~/` (or a bare `~`) is
 * expanded — `~user` is not, because resolving another user's home is a
 * different lookup and we have no caller who needs it.
 */
function expandHome(p: string): string {
  if (p === '~') return os.homedir();
  if (p.startsWith('~/')) return path.join(os.homedir(), p.slice(2));
  return p;
}

/**
 * Map a Claude *config* directory to the projects directory inside it.
 *
 * Claude Code stores session JSONL under `<configDir>/projects`. The one
 * forgiving rule: if the caller already pointed at a directory named `projects`,
 * take it as-is rather than looking for `projects/projects`. That is the most
 * likely way to mis-set the variable and the rule for handling it is mechanical,
 * not a guess about intent.
 */
function projectsDirOf(configDir: string): string {
  const abs = path.resolve(expandHome(configDir));
  return path.basename(abs) === 'projects' ? abs : path.join(abs, 'projects');
}

/**
 * Get the base directory where Claude Code stores project data.
 *
 * Honors `CLAUDE_CONFIG_DIR`, Claude Code's own variable for relocating its
 * config directory. **Replace semantics, matching Claude Code:** setting it
 * moves this root, it does not add a second one. Use `KLATCH_EXTRA_SESSION_ROOTS`
 * (see `getSessionRoots`) when you want both.
 */
export function getClaudeProjectsDir(): string {
  const configured = process.env.CLAUDE_CONFIG_DIR?.trim();
  return projectsDirOf(configured || path.join(os.homedir(), '.claude'));
}

/**
 * Every projects root the session scanner should walk, in scan order.
 *
 * **Why more than one root exists.** Claude Code keeps one config directory per
 * Anthropic account. xian runs Klatch/DinP under one account and Piper Morgan
 * under another, so PM's eleven department heads live in `~/.claude-pm/projects`
 * while everything else lives in `~/.claude/projects`. Before this, Browse
 * silently returned the first set and none of the second — not an error, not an
 * empty list, just the wrong directory (Janus, 2026-09-04). PM's cast is the
 * corpus continuity #3 exists to demonstrate, so "somewhere other than the
 * default" is a requirement, not a convenience.
 *
 * **Why two variables and not one.**
 * - `CLAUDE_CONFIG_DIR` is Claude Code's own, and honoring it with Claude Code's
 *   own replace semantics means someone who relocated their whole config gets
 *   Klatch working with no Klatch-specific setup.
 * - `KLATCH_EXTRA_SESSION_ROOTS` is *additive*, `path.delimiter`-separated, and
 *   is the one that answers the actual need: see both accounts at once. Additive
 *   is the safe default — a misconfigured extra root adds nothing rather than
 *   making the user's existing sessions disappear.
 *
 * Entries are config dirs (`~/.claude-pm`), matching `CLAUDE_CONFIG_DIR`; a
 * path already ending in `projects` is also accepted (see `projectsDirOf`).
 *
 * Roots are de-duplicated by real path, so listing the default again, or
 * pointing at it through a symlink, cannot double every session in Browse.
 * Non-existent roots are kept in the list and skipped by the scanner, so a
 * typo'd root is visible to a probe rather than silently absent here.
 */
export function getSessionRoots(): string[] {
  const roots = [getClaudeProjectsDir()];

  const extra = process.env.KLATCH_EXTRA_SESSION_ROOTS?.trim();
  if (extra) {
    for (const entry of extra.split(path.delimiter)) {
      const trimmed = entry.trim();
      if (trimmed) roots.push(projectsDirOf(trimmed));
    }
  }

  // Dedupe on the real path where we can resolve one — a symlinked alias of the
  // default root is the same corpus and scanning it twice would double it.
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const root of roots) {
    let key = root;
    try {
      key = fs.realpathSync(root);
    } catch {
      // Doesn't exist (or isn't readable) — dedupe on the literal path instead.
    }
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(root);
  }
  return unique;
}

/**
 * Extract the session ID from the first few lines of a JSONL file.
 * Reads only the first event to get the sessionId, avoiding full file parse.
 */
export async function extractSessionId(filePath: string): Promise<string | undefined> {
  return new Promise((resolve) => {
    const stream = fs.createReadStream(filePath, { encoding: 'utf-8' });
    const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });
    let found = false;

    rl.on('line', (line) => {
      if (found) return;
      try {
        const event = JSON.parse(line);
        if (event.sessionId) {
          found = true;
          rl.close();
          stream.destroy();
          resolve(event.sessionId);
        }
      } catch {
        // skip malformed lines
      }
    });

    rl.on('close', () => {
      if (!found) resolve(undefined);
    });

    rl.on('error', () => resolve(undefined));
    stream.on('error', () => resolve(undefined));
  });
}

/**
 * Pathological-file guard on lines read per session during the fingerprint scan.
 *
 * **This is no longer a latency knob.** It was 1500 until 2026-09-04, when xian
 * ruled to remove the cap and keep only a backstop against a runaway file.
 *
 * The measurement behind the ruling (Round 143, `docs/scan-cap-latency-2026-09-03.md`,
 * 506 sessions / 547 MB): the 1500 cap bit 11 of 506 files (2.2%) but those 11 held
 * 1165 of 1980 turns (58.8%) — it spent 59% of the corpus's turn signal to skip a
 * third of its bytes, aimed precisely at the deep sessions a size hint is *for*.
 * Removing it cost +645 ms on a 1387 ms browse and took turn counts 41.2% -> 100%.
 * There was no knee to find: marginal cost was flat (0.50-0.55 ms/turn at every cap),
 * so intermediate values were dominated rather than balanced. The choice was 1500 or
 * nothing, and nothing won.
 *
 * **Why 50_000 and not Infinity.** It exists only so one malformed or machine-generated
 * file cannot hang Browse. `capped` should be false corpus-wide — that is what makes
 * `turnCount` exact and retires the `turnCount+` rendering question.
 *
 * **Headroom is thinner than it first looked, and the correction is worth reading.**
 * The value was chosen against `~/.claude/projects`, whose largest file is 15,371 lines
 * (~3x headroom). Janus flagged the same day that the corpus this feature actually
 * exists for — Piper Morgan's eleven department heads — lives in a *second* config
 * directory, `~/.claude-pm/projects`. Verified directly: those files run 13,054–40,397
 * lines (Theseus measured 40,458 hours later, on the same file — it is being appended
 * to while we measure it). So the real headroom over the largest known session is
 * **~24%, not 3x**, and one more growth step reaches it.
 *
 * That second root is no longer unreachable — `getSessionRoots()` above walks it when
 * `KLATCH_EXTRA_SESSION_ROOTS` names it — which means **this guard now has to hold for
 * a corpus it was not chosen against.** Theseus measured `fingerprintCapped` false on
 * all 592 sessions across both roots on 2026-09-04, so it is not biting today.
 * If this guard ever starts biting, that is the number that moved.
 *
 * **Revisit if:** `capped` starts coming back true on real sessions (the guard is
 * biting, not guarding), or browse latency regresses past what the fingerprint cache
 * below absorbs. Both are monitorable from the scan result; see the monitoring note
 * in `docs/scan-cap-latency-2026-09-03.md`.
 */
const FINGERPRINT_LINE_CAP = 50_000;
/** Truncate the surfaced first-user-message to this many chars (per Iris T1.6). */
const FINGERPRINT_MAX_CHARS = 80;

/**
 * Pull a content fingerprint from a JSONL session — first real human-typed
 * user message + approximate turn count. Streams up to FINGERPRINT_LINE_CAP
 * lines and reports whether the guard was reached (messageCount and turnCount
 * become lower bounds in that case). Since 2026-09-04 the guard is set above
 * every real session in the corpus, so `capped` should be false in practice —
 * a true is a signal worth investigating, not a routine outcome.
 *
 * `lineCap` is overridable so the cap's latency cost can be measured against
 * the shipped code path rather than a copy of it (see
 * scripts/probe-scan-latency-vs-cap.mts). Callers in the product don't pass it.
 *
 * "Real human" filter mirrors parser.ts isConversationEvent + the injection-
 * metadata flags: skip events that are isMeta / isCompactSummary / tool
 * results / sidechain. We don't need byte-perfect fidelity for a fingerprint;
 * a reasonably faithful preview is the goal.
 */
export interface SessionFingerprint {
  firstUserMessage: string;
  messageCount: number;
  turnCount: number;
  capped: boolean;
}

export async function extractSessionFingerprint(filePath: string, lineCap: number = FINGERPRINT_LINE_CAP): Promise<SessionFingerprint> {
  return new Promise((resolve) => {
    const stream = fs.createReadStream(filePath, { encoding: 'utf-8' });
    const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

    let firstUserMessage = '';
    let messageCount = 0;
    let turnCount = 0;
    let linesRead = 0;
    let capped = false;

    const finish = () => {
      rl.close();
      stream.destroy();
      resolve({ firstUserMessage, messageCount, turnCount, capped });
    };

    rl.on('line', (line) => {
      linesRead++;
      if (linesRead > lineCap) {
        capped = true;
        finish();
        return;
      }

      let event: any;
      try { event = JSON.parse(line); } catch { return; }
      if (!event || (event.type !== 'user' && event.type !== 'assistant')) return;
      if (event.isSidechain) return;
      if (event.isMeta || event.isCompactSummary || event.isVisibleInTranscriptOnly) return;
      if (!event.message) return;

      // Tool-result user events: content is an array of tool_result blocks. Skip.
      if (event.type === 'user') {
        const content = event.message.content;
        const isToolResult = Array.isArray(content) && content.every((b: any) => b?.type === 'tool_result');
        if (isToolResult) return;

        // Count turns with the importer's own predicate, so the browse screen
        // and the import agree by construction rather than by coincidence.
        // Boundary detection is per-event and order-independent, so counting in
        // stream order matches groupIntoTurns' post-sort count.
        //
        // The two filters are near-identical but not provably equal: this
        // scanner also drops isVisibleInTranscriptOnly, which
        // isHumanTurnBoundary does not check. Measured across the repo's real
        // sessions the divergence is 0 events; the probe script reports it as
        // "boundaries scanner missed" if that ever stops being true.
        if (isHumanTurnBoundary(event)) turnCount++;

        // First real human-typed user message wins
        if (!firstUserMessage) {
          const text = extractFingerprintText(content);
          if (text) {
            firstUserMessage = text.length > FINGERPRINT_MAX_CHARS
              ? text.slice(0, FINGERPRINT_MAX_CHARS - 1).trimEnd() + '…'
              : text;
          }
        }
      }

      messageCount++;
    });

    rl.on('close', () => resolve({ firstUserMessage, messageCount, turnCount, capped }));
    rl.on('error', () => resolve({ firstUserMessage, messageCount, turnCount, capped }));
    stream.on('error', () => resolve({ firstUserMessage, messageCount, turnCount, capped }));
  });
}

function extractFingerprintText(content: any): string {
  if (typeof content === 'string') return content.trim();
  if (!Array.isArray(content)) return '';
  for (const block of content) {
    if (block?.type === 'text' && typeof block.text === 'string' && block.text.trim()) {
      return block.text.trim();
    }
  }
  return '';
}

interface FingerprintCacheEntry {
  /** Modification time the fingerprint was computed against, in float ms. */
  mtimeMs: number;
  /** File size the fingerprint was computed against. */
  sizeBytes: number;
  /** Line cap the fingerprint was computed under — see the note below on why this is part of validity. */
  lineCap: number;
  fp: SessionFingerprint;
}

/**
 * Fingerprint cache, process-lifetime, in-memory.
 *
 * Browse spends nearly all its time in `extractSessionFingerprint`, which is a
 * pure function of file *content*. Session JSONL files are append-only and
 * overwhelmingly unchanged between two browses, so the same bytes get parsed
 * again on every visit to the import screen.
 *
 * **One entry per path, not per (path, version).** A changed file overwrites its
 * own entry, so the map is bounded by the number of distinct session files this
 * process has seen — not by how often they change. An actively-appended session
 * re-keys in place rather than accumulating a row per browse.
 *
 * **What is deliberately NOT cached:** `alreadyImported` / `existingChannelId` /
 * `existingChannelName`. Those are functions of the database, not of the file, and
 * caching them would leave the browse screen claiming a just-imported session is
 * still unimported until its file happened to change. They stay live on every scan
 * (cheap since Round 145 hoisted the lookup out of the loop). Pinned by test.
 *
 * **Why `lineCap` is part of the key.** The cap is under an open decision (Round 143,
 * routed to xian). If it is raised or removed, every cached `capped: true` entry is
 * a stale *undercount* for a file that never changed — mtime and size alone would
 * not catch it. Keying on the cap makes a cap change self-invalidating.
 *
 * **Known limit:** validity is `(mtimeMs, size)`. A file rewritten to the identical
 * byte length within a single mtime tick would hit stale. The window is narrower than
 * "one millisecond" — `stat.mtimeMs` carries the filesystem's own resolution, which is
 * sub-millisecond on APFS (observed: `...825.5498`) — but it is not zero. Appends
 * change the size, so this cannot occur on the append-only JSONL this reads; it is
 * recorded because a future writer of these files might not be append-only.
 *
 * Persistence across restarts is a separate decision and is deliberately not built
 * here — see `docs/fingerprint-cache-2026-09-04.md`.
 */
const fingerprintCache = new Map<string, FingerprintCacheEntry>();

/**
 * Fingerprint a session file, reusing a previous result when the file is provably
 * unchanged. `stat` is passed in rather than re-`stat`ing because every caller
 * already holds one.
 */
export async function getSessionFingerprint(
  filePath: string,
  stat: fs.Stats,
  lineCap: number = FINGERPRINT_LINE_CAP,
): Promise<SessionFingerprint> {
  const hit = fingerprintCache.get(filePath);
  if (hit && hit.mtimeMs === stat.mtimeMs && hit.sizeBytes === stat.size && hit.lineCap === lineCap) {
    return hit.fp;
  }

  const fp = await extractSessionFingerprint(filePath, lineCap);
  // Frozen because the same object is handed to every future caller — a caller that
  // mutated it would corrupt the cache for everyone after it.
  const frozen = Object.freeze(fp);
  fingerprintCache.set(filePath, { mtimeMs: stat.mtimeMs, sizeBytes: stat.size, lineCap, fp: frozen });
  return frozen;
}

/** Drop all cached fingerprints. For tests and probes; nothing in the product calls this. */
export function clearSessionFingerprintCache(): void {
  fingerprintCache.clear();
}

/** Number of cached entries. For tests and probes. */
export function sessionFingerprintCacheSize(): number {
  return fingerprintCache.size;
}

/**
 * Scan every configured projects root for Claude Code session files.
 * Returns sessions grouped by project, with dedup detection.
 *
 * **Roots are merged by decoded project path, not concatenated.** Two roots can
 * hold the same encoded directory — the same working directory used under two
 * Anthropic accounts — and the browse UI keys its project rows and its
 * expand/collapse state on `projectPath` (`ImportDialog.tsx`), so emitting two
 * groups with one path would give React duplicate keys and make expanding one
 * row expand the other. Merging is therefore load-bearing, not tidiness.
 *
 * Measured on this machine 2026-09-04: `~/.claude/projects` (17 project dirs)
 * and `~/.claude-pm/projects` (77) collide on **zero** encoded names, so the
 * merge path is currently latent. It is built because the collision is a
 * configuration away, and because the failure it produces is silent.
 *
 * Within a merged group, sessions are de-duplicated by `sessionId`: that UUID is
 * the import identity (`source_metadata.originalSessionId`), so two entries
 * claiming it are the same conversation, and showing both would offer the user a
 * choice with no difference. First root in scan order wins.
 */
export async function scanClaudeCodeSessions(): Promise<ProjectSessions[]> {
  const roots = getSessionRoots();
  const multiRoot = roots.length > 1;

  // One channels scan for the whole walk instead of one per session file — the
  // per-call lookup is unindexed, so in a loop it costs O(files x channels).
  // Built once across ALL roots, not once per root: the hoist's O(files +
  // channels) property is a property of the whole scan, and rebuilding it per
  // root would put the channels scan back in a loop.
  // Nothing here writes channels, so a snapshot is safe.
  const findChannel = createChannelBySessionIdResolver();

  // Keyed by decoded project path so the same project seen under two roots
  // becomes one group. Map preserves insertion order; the final sort is
  // by name, as before.
  const byProjectPath = new Map<string, ProjectSessions>();
  const seenSessionIds = new Map<string, Set<string>>();

  for (const projectsDir of roots) {
    if (!fs.existsSync(projectsDir)) continue;

    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(projectsDir, { withFileTypes: true });
    } catch {
      continue; // skip unreadable roots
    }

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      const projectDir = path.join(projectsDir, entry.name);
      const projectPath = decodeProjectPath(entry.name);
      const projectName = path.basename(projectPath);

      // Find all .jsonl files in this project directory (non-recursive — subagent dirs have their own)
      let files: fs.Dirent[];
      try {
        files = fs.readdirSync(projectDir, { withFileTypes: true });
      } catch {
        continue; // skip unreadable directories
      }

      const sessions: SessionInfo[] = [];
      let idsHere = seenSessionIds.get(projectPath);
      if (!idsHere) {
        idsHere = new Set<string>();
        seenSessionIds.set(projectPath, idsHere);
      }

      for (const file of files) {
        if (!file.isFile() || !file.name.endsWith('.jsonl')) continue;

        const filePath = path.join(projectDir, file.name);
        const sessionId = file.name.replace('.jsonl', '');

        // Same conversation already collected from an earlier root.
        if (idsHere.has(sessionId)) continue;

        let stat: fs.Stats;
        try {
          stat = fs.statSync(filePath);
        } catch {
          continue; // skip unreadable files
        }

        // Skip tiny files (< 100 bytes — likely empty or corrupted)
        if (stat.size < 100) continue;

        // Check dedup against database. Deliberately NOT cached with the fingerprint —
        // this answer changes when the user imports, without the file changing.
        const existing = findChannel(sessionId);

        // Content fingerprint — first user message + approximate turn count.
        // Cached on (path, mtime, size, cap); recomputed only when the file changed.
        const fp = await getSessionFingerprint(filePath, stat);

        idsHere.add(sessionId);
        sessions.push({
          path: filePath,
          sessionId,
          projectPath,
          projectName,
          sizeBytes: stat.size,
          modifiedAt: stat.mtime.toISOString(),
          alreadyImported: !!existing,
          existingChannelId: existing?.id,
          existingChannelName: existing?.name,
          firstUserMessage: fp.firstUserMessage || undefined,
          messageCount: fp.messageCount,
          turnCount: fp.turnCount,
          fingerprintCapped: fp.capped || undefined,
          // Omitted entirely in the single-root case — see SessionInfo.sourceRoot.
          ...(multiRoot ? { sourceRoot: projectsDir } : {}),
        });
      }

      if (sessions.length === 0) continue;

      const group = byProjectPath.get(projectPath);
      if (group) {
        group.sessions.push(...sessions);
      } else {
        byProjectPath.set(projectPath, { projectPath, projectName, sessions });
      }
    }
  }

  const projects = [...byProjectPath.values()];

  // Sort by modification date (newest first). Done after the merge so a merged
  // group is ordered as one list rather than root-by-root.
  for (const project of projects) {
    project.sessions.sort((a, b) => b.modifiedAt.localeCompare(a.modifiedAt));
  }

  // Sort projects alphabetically by name
  projects.sort((a, b) => a.projectName.localeCompare(b.projectName));

  return projects;
}

/**
 * Scan the repo's exports/sessions/ directory for JSONL files.
 * Cloud agents commit their session files here for easy import.
 * Returns a single ProjectSessions group if any files are found.
 */
export async function scanExportedSessions(repoRoot: string): Promise<ProjectSessions | null> {
  const exportDir = path.join(repoRoot, 'exports', 'sessions');

  if (!fs.existsSync(exportDir)) return null;

  let files: fs.Dirent[];
  try {
    files = fs.readdirSync(exportDir, { withFileTypes: true });
  } catch {
    return null;
  }

  const sessions: SessionInfo[] = [];

  // Same reason as scanClaudeCodeSessions: one channels scan, not one per file.
  const findChannel = createChannelBySessionIdResolver();

  for (const file of files) {
    if (!file.isFile() || !file.name.endsWith('.jsonl')) continue;

    const filePath = path.join(exportDir, file.name);
    let stat: fs.Stats;
    try {
      stat = fs.statSync(filePath);
    } catch {
      continue;
    }

    if (stat.size < 100) continue;

    // Extract session ID: try the filename (sans .jsonl), or read from file
    const sessionId = file.name.replace('.jsonl', '');
    const existing = findChannel(sessionId);
    // Same split as scanClaudeCodeSessions: dedup live, fingerprint cached.
    const fp = await getSessionFingerprint(filePath, stat);

    sessions.push({
      path: filePath,
      sessionId,
      projectPath: exportDir,
      projectName: 'Exported sessions',
      sizeBytes: stat.size,
      modifiedAt: stat.mtime.toISOString(),
      alreadyImported: !!existing,
      existingChannelId: existing?.id,
      existingChannelName: existing?.name,
      isExported: true,
      firstUserMessage: fp.firstUserMessage || undefined,
      messageCount: fp.messageCount,
      turnCount: fp.turnCount,
      fingerprintCapped: fp.capped || undefined,
    });
  }

  if (sessions.length === 0) return null;

  sessions.sort((a, b) => b.modifiedAt.localeCompare(a.modifiedAt));

  return {
    projectPath: exportDir,
    projectName: 'Exported sessions',
    sessions,
  };
}
