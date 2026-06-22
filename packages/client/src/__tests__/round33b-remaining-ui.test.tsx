/**
 * Round 33b (Argus): remaining UI patch coverage for Iris triage Tier 1 + Tier 2.
 *
 * Picks up the nine surfaces left after the 5/11 partial slice (Round 33a
 * shipped cross-cutting typography contrast + T1.6 fingerprint contract):
 *
 *   T1.1 — Hide default channel prompt (App header subtitle suppression)
 *   T1.2 — Replace JSONL jargon (client side: no "JSONL" in user-facing labels)
 *   T1.3 — Claude Code session browser Select all / Unselect all parity
 *           (claude.ai side already covered in ImportDialog.test.tsx:583)
 *   T1.4 — Tooltip on truncated sidebar names
 *   T1.7 — EntityManager slides from LEFT (mr-auto + border-r)
 *   T2.1 — Channel-count per entity (client surface: "in N channels")
 *   T2.2 — ExportReviewPanel modal backdrop + click-to-close
 *   T2.3 — Helper text subtitles on Package contents + Field notes
 *   T2.4 — REMOVED 2026-06-22: "Unassigned" subtitle superseded by the default-project model
 *
 * Source: Daedalus's `daedalus-to-argus-round33-assignment-2026-05-11.md`
 * Iris's 5/18 confirmation `iris-to-theseus-ui-as-context-aaxt-reply-2026-05-18.md`
 * line 106 ("no UI changes in flight that would invalidate your probes mid-run")
 * is the unblock that authorized this work.
 *
 * Strategy notes:
 *   - Where the contract is purely structural (a class name, a CSS guard, a
 *     literal string in error messages), source-file string assertions are
 *     used. Heavy DOM render is unnecessary for pinning a CSS class.
 *   - Where the contract is behavioral (a button enables/disables based on
 *     state; a backdrop click fires onClose), render-and-interact tests are
 *     used.
 *   - Longer timeouts (10000ms) on tests that render the heavy ImportDialog;
 *     vitest singleThread mode + jsdom cost is real.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { readFileSync } from 'fs';
import path from 'path';
import { ImportDialog } from '../components/ImportDialog';
import { ExportReviewPanel } from '../components/ExportReviewPanel';
import { EntityManager } from '../components/EntityManager';
import { ChannelSidebar } from '../components/ChannelSidebar';
import type { Channel, Entity } from '@klatch/shared';

// ── API client mocks ────────────────────────────────────────

vi.mock('../api/client', () => ({
  importClaudeCodeSession: vi.fn(),
  uploadClaudeCodeSession: vi.fn(),
  importClaudeAiExport: vi.fn(),
  previewClaudeAiExport: vi.fn(),
  deleteChannelApi: vi.fn(),
  fetchClaudeCodeSessions: vi.fn(),
  fetchExportPreview: vi.fn(),
  // Reject so useModels falls back to the static AVAILABLE_MODELS shape
  // rather than corrupting `models` with a bare-array mock value.
  fetchModels: vi.fn().mockRejectedValue(new Error('test mock — use fallback')),
}));

import {
  fetchClaudeCodeSessions,
  fetchExportPreview,
} from '../api/client';

beforeEach(() => {
  vi.clearAllMocks();
});

// ── Source-pin helpers ─────────────────────────────────────

const CLIENT_SRC = path.resolve(__dirname, '..');
const SERVER_SRC = path.resolve(__dirname, '../../../server/src');

function readClient(rel: string): string {
  return readFileSync(path.join(CLIENT_SRC, rel), 'utf-8');
}
function readServer(rel: string): string {
  return readFileSync(path.join(SERVER_SRC, rel), 'utf-8');
}

// ── T1.1 — Hide default channel prompt (source-pin) ────────

describe('Round 33b T1.1 — App suppresses default systemPrompt in header', () => {
  it('App.tsx contains the literal-default-suppression guard', () => {
    const src = readClient('App.tsx');
    // Pin: the conditional renders the prompt ONLY when it's non-default.
    // Comparison normalization (trim() + literal string) is part of the contract.
    expect(src).toMatch(/systemPrompt\.trim\(\)\s*!==\s*['"]You are a helpful assistant\.['"]/);
  });
});

// ── T1.2 — Replace JSONL jargon (server + client source-pins + render) ──

describe('Round 33b T1.2 — JSONL jargon replaced with "session file"', () => {
  it('server route: POST /import/claude-code rejects non-jsonl with the new user-facing message', () => {
    const src = readServer('routes/import.ts');
    expect(src).toContain('File must be a Claude Code session file (.jsonl).');
    expect(src).toContain('Please choose a session file (.jsonl).');
  });

  it('ImportDialog: no visible "JSONL" string in user-facing labels (render check)', { timeout: 15000 }, () => {
    const { container } = render(
      <ImportDialog isOpen={true} onClose={vi.fn()} onImported={vi.fn()} />,
    );
    // Walk only the visible text content (textContent collapses to user-visible).
    // Internal refs/state names like `jsonlInputRef` are not user-visible.
    const visibleText = container.textContent || '';
    expect(visibleText).not.toMatch(/JSONL/);
  });

  it('ImportDialog: surfaces "session file" framing somewhere user-visible', { timeout: 15000 }, () => {
    render(<ImportDialog isOpen={true} onClose={vi.fn()} onImported={vi.fn()} />);
    expect(screen.getAllByText(/session file/i).length).toBeGreaterThan(0);
  });
});

// ── T1.3 — Claude Code session browser Select all + Unselect all ──

describe('Round 33b T1.3 — Claude Code session browser Select all + Unselect all', () => {
  const mockBrowseResponse = {
    projects: [
      {
        projectPath: '/Users/test/proj-a',
        sessions: [
          { path: '/Users/test/proj-a/s1.jsonl', sessionId: 's1', startedAt: '2026-05-18T10:00:00Z', alreadyImported: false, firstUserMessage: 'hello', messageCount: 5, fingerprintCapped: false },
          { path: '/Users/test/proj-a/s2.jsonl', sessionId: 's2', startedAt: '2026-05-18T11:00:00Z', alreadyImported: false, firstUserMessage: 'second', messageCount: 8, fingerprintCapped: false },
          { path: '/Users/test/proj-a/s3.jsonl', sessionId: 's3', startedAt: '2026-05-18T12:00:00Z', alreadyImported: true,  firstUserMessage: 'imported', messageCount: 12, fingerprintCapped: false },
        ],
      },
    ],
    totalProjects: 1,
    totalSessions: 3,
  };

  it('renders both Select all and Unselect all in the session browser when 2+ importable sessions exist', { timeout: 15000 }, async () => {
    vi.mocked(fetchClaudeCodeSessions).mockResolvedValue(mockBrowseResponse as any);
    const user = userEvent.setup();
    render(<ImportDialog isOpen={true} onClose={vi.fn()} onImported={vi.fn()} />);

    // Default mode is claude-code; click the Browse... button under manual path
    await user.click(screen.getByRole('button', { name: /Browse/ }));
    await waitFor(() => expect(fetchClaudeCodeSessions).toHaveBeenCalled());

    const selectAlls = await screen.findAllByRole('button', { name: 'Select all' });
    const unselectAlls = await screen.findAllByRole('button', { name: 'Unselect all' });
    expect(selectAlls.length).toBeGreaterThanOrEqual(1);
    expect(unselectAlls.length).toBeGreaterThanOrEqual(1);
  });

  it('Select all disabled when all importable already selected; Unselect all disabled when none selected', { timeout: 15000 }, async () => {
    vi.mocked(fetchClaudeCodeSessions).mockResolvedValue(mockBrowseResponse as any);
    const user = userEvent.setup();
    render(<ImportDialog isOpen={true} onClose={vi.fn()} onImported={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /Browse/ }));
    await waitFor(() => expect(fetchClaudeCodeSessions).toHaveBeenCalled());

    const selectAll = await screen.findByRole('button', { name: 'Select all' });
    const unselectAll = await screen.findByRole('button', { name: 'Unselect all' });

    // Initial state after browse: handleBrowseSessions auto-selects all
    // non-imported sessions (ImportDialog.tsx:278). So Select all is
    // disabled (everything already selected) and Unselect all is enabled.
    expect(selectAll).toBeDisabled();
    expect(unselectAll).not.toBeDisabled();

    // Click Unselect all → nothing selected → flip
    await user.click(unselectAll);
    expect(unselectAll).toBeDisabled();
    expect(selectAll).not.toBeDisabled();

    // Click Select all → all 2 importable selected → flip back
    await user.click(selectAll);
    expect(selectAll).toBeDisabled();
    expect(unselectAll).not.toBeDisabled();
  });
});

// ── T1.4 — Tooltip on truncated sidebar names ─────────────

describe('Round 33b T1.4 — sidebar tooltips on project + channel names', () => {
  const longChannelName = 'A Channel With A Long Name That Should Get A Title Attribute';
  const longProjectName = 'A Very Long Project Name That Will Truncate In The Sidebar UI';

  const mockChannel: Channel = {
    id: 'ch-1',
    name: longChannelName,
    systemPrompt: '',
    model: 'claude-opus-4-7' as any,
    mode: 'panel',
    type: 'chat',
    source: 'native',
    sourceMetadata: null,
    projectId: 'proj-1',
    projectName: longProjectName, // denormalized; ChannelSidebar derives project group from this
    createdAt: '2026-05-18T00:00:00Z',
    lastMessageAt: '2026-05-18T01:00:00Z',
  } as unknown as Channel;

  it('channel name has a title attribute equal to its full name', () => {
    render(
      <ChannelSidebar
        channels={[mockChannel]}
        activeChannelId=""
        onSelectChannel={vi.fn()}
        onCreateChannel={vi.fn()}
        theme="light"
        onToggleTheme={vi.fn()}
      />,
    );
    const matches = document.querySelectorAll(`[title="${longChannelName}"]`);
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it('project name has a title attribute equal to its full name', () => {
    render(
      <ChannelSidebar
        channels={[mockChannel]}
        activeChannelId=""
        onSelectChannel={vi.fn()}
        onCreateChannel={vi.fn()}
        theme="light"
        onToggleTheme={vi.fn()}
      />,
    );
    const matches = document.querySelectorAll(`[title="${longProjectName}"]`);
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });
});

// ── T1.7 — EntityManager slides from LEFT (source-pin + render) ──

describe('Round 33b T1.7 — EntityManager panel slides from LEFT (mr-auto + border-r)', () => {
  it('source: EntityManager.tsx panel container declares mr-auto and border-r (not ml-auto / border-l)', () => {
    const src = readClient('components/EntityManager.tsx');
    // The slide-direction class signature on the relative panel:
    expect(src).toMatch(/className=["'][^"']*\bmr-auto\b[^"']*\bborder-r\b/);
    expect(src).not.toMatch(/className=["'][^"']*\bml-auto\b[^"']*\bborder-l\b/);
  });

  it('rendered panel has mr-auto + border-r in its className', () => {
    const { container } = render(
      <EntityManager
        entities={[]}
        onCreateEntity={vi.fn()}
        onUpdateEntity={vi.fn()}
        onDeleteEntity={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    // The panel is the relative .bg-panel child of the backdrop
    const panel = container.querySelector('.bg-panel');
    expect(panel).not.toBeNull();
    expect(panel!.className).toMatch(/\bmr-auto\b/);
    expect(panel!.className).toMatch(/\bborder-r\b/);
  });
});

// ── T2.1 client — "in N conversations" surface on entity card ──

describe('Round 33b T2.1 — EntityManager surfaces "in N conversations" with pluralization', () => {
  const baseEntity: any = {
    id: 'e1',
    name: 'Test Bot',
    handle: null,
    model: 'claude-opus-4-7',
    effort: 'high',
    systemPrompt: '',
    color: '#3B82F6',
    reflections: [],
    createdAt: '2026-05-18T00:00:00Z',
  };

  it('singular: channelCount === 1 renders "in 1 conversation"', () => {
    render(
      <EntityManager
        entities={[{ ...baseEntity, channelCount: 1 } as Entity]}
        onCreateEntity={vi.fn()}
        onUpdateEntity={vi.fn()}
        onDeleteEntity={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    // The card surface text is "in 1 conversation" (no trailing s)
    expect(screen.getByText(/in 1 conversation(?!s)/)).toBeInTheDocument();
  });

  it('plural: channelCount > 1 renders "in N conversations"', () => {
    render(
      <EntityManager
        entities={[{ ...baseEntity, channelCount: 4 } as Entity]}
        onCreateEntity={vi.fn()}
        onUpdateEntity={vi.fn()}
        onDeleteEntity={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByText(/in 4 conversations/)).toBeInTheDocument();
  });

  it('zero: channelCount === 0 does NOT render the "in N conversations" label', () => {
    render(
      <EntityManager
        entities={[{ ...baseEntity, channelCount: 0 } as Entity]}
        onCreateEntity={vi.fn()}
        onUpdateEntity={vi.fn()}
        onDeleteEntity={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(screen.queryByText(/in 0 conversation/)).toBeNull();
  });
});

// ── T2.2 — ExportReviewPanel modal backdrop + click-to-close ──

describe('Round 33b T2.2 — ExportReviewPanel modal backdrop', () => {
  beforeEach(() => {
    vi.mocked(fetchExportPreview).mockResolvedValue({
      package_id: 'pkg-1',
      package_kind: 'klatch.context.v1',
      format_version: '1.0.0',
      created_at: '2026-05-18T00:00:00Z',
      source_type: 'klatch',
      provenance: [],
      conversation_context: { id: 'ch-1', name: 'test' },
      entities: [],
      files: [],
      conversation_history: { ref: 'conversation.jsonl', message_count: 0 },
      extensions: { klatch: {} },
    } as any);
  });

  it('backdrop element exists with semi-transparent overlay class', async () => {
    const { container } = render(<ExportReviewPanel channelId="ch-1" onClose={vi.fn()} />);
    await waitFor(() => expect(fetchExportPreview).toHaveBeenCalled());
    const backdrop = container.querySelector('[aria-hidden].bg-black\\/50');
    expect(backdrop).not.toBeNull();
  });

  it('clicking the backdrop fires onClose', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    const { container } = render(<ExportReviewPanel channelId="ch-1" onClose={onClose} />);
    await waitFor(() => expect(fetchExportPreview).toHaveBeenCalled());

    const backdrop = container.querySelector('[aria-hidden].bg-black\\/50') as HTMLElement;
    expect(backdrop).not.toBeNull();
    await user.click(backdrop);
    expect(onClose).toHaveBeenCalled();
  });
});

// ── T2.3 — Helper text subtitles on export sections (source-pin) ──

describe('Round 33b T2.3 — ExportReviewPanel helper text subtitles', () => {
  it('source: Package contents section has a one-line subtitle', () => {
    const src = readClient('components/ExportReviewPanel.tsx');
    expect(src).toContain('Package contents');
    expect(src).toContain('What goes into this export, by layer.');
  });

  it('source: Field notes section has a one-line subtitle (under the "Field notes for {name}" heading)', () => {
    const src = readClient('components/ExportReviewPanel.tsx');
    expect(src).toContain('Field notes for {entityName}');
    expect(src).toContain('Behavioral observations from this conversation. Review and approve to include.');
  });
});

// ── T2.4 — REMOVED 2026-06-22 (default-project model) ────
// The "Unassigned" section and its "Chats not yet assigned to a project" subtitle were
// superseded by the default-project model (docs/ux/decision-klatch-project-optionality.md):
// null-project channels now render in the "First project" group — a real workspace, not a
// triage bucket, so it carries no "not yet assigned" subtitle. A singleton user sees it flat
// with no header at all. New-behavior coverage lives in SidebarRedesign.test.tsx
// ("default project (First project)") and ChannelSidebar.test.tsx (singleton-flat + collapse).
