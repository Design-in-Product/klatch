/**
 * Round 22: Phase 3.5d — export review UI component tests
 *
 * Tests for ExportReviewPanel, ExportSummary, FieldNoteReview, NoteCard.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import './setup';
import { ExportReviewPanel } from '../components/ExportReviewPanel';

// Mock the API client
vi.mock('../api/client.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../api/client.js')>();
  return {
    ...actual,
    fetchExportPreview: vi.fn(),
    getExportUrl: vi.fn(() => 'http://localhost:3001/api/channels/ch-1/export?briefing=true&extract=true'),
  };
});

import { fetchExportPreview } from '../api/client.js';
const mockFetchPreview = vi.mocked(fetchExportPreview);

// ── Test data ────────────────────────────────────────────────

const baseManifest = {
  format_version: '1.0.0',
  source_type: 'klatch',
  package_id: 'pkg-123',
  package_kind: 'klatch.context.v1',
  created_at: '2026-04-14T00:00:00Z',
  provenance: [{ event_id: 'ev-1', source: 'klatch', at: '2026-04-14T00:00:00Z' }],
  project: {
    id: 'proj-1',
    name: 'Test Project',
    instructions: { ref: 'layer_2_instructions.md', length_chars: 500 },
    memory: { ref: 'layer_3_memory.md', length_chars: 200 },
    knowledge_base_file_ids: [],
  },
  conversation_context: {
    id: 'ch-1',
    name: 'Test Channel',
    type: 'chat',
    mode: 'panel',
    created_at: '2026-04-14T00:00:00Z',
    last_active_at: '2026-04-14T01:00:00Z',
    context: { ref: 'layer_4_context.md', length_chars: 100 },
    pinned_file_ids: [],
    compaction_state: null,
  },
  entities: [{
    id: 'ent-1',
    name: 'TestBot',
    model: 'claude-opus-4-6',
    effort: 'high',
    prompt_length_chars: 50,
    field_notes: null,
  }],
  files: [],
  conversation_history: { ref: 'conversation.jsonl', message_count: 10, first_message_at: '2026-04-14T00:00:00Z', last_message_at: '2026-04-14T01:00:00Z' },
  extensions: { klatch: {} },
};

function manifestWithNotes(notes: any[]) {
  return {
    ...baseManifest,
    entities: [{
      ...baseManifest.entities[0],
      field_notes: notes,
    }],
  };
}

// ── ExportReviewPanel ────────────────────────────────────────

describe('ExportReviewPanel', () => {
  beforeEach(() => {
    mockFetchPreview.mockReset();
  });

  it('renders loading state while fetching', () => {
    mockFetchPreview.mockReturnValue(new Promise(() => {})); // never resolves
    render(<ExportReviewPanel channelId="ch-1" onClose={vi.fn()} />);
    // T1.5 (2026-05-11): loading state now uses an ellipsis + secondary
    // explanatory line. Match the leading copy with a regex tolerant to
    // future whitespace tweaks.
    expect(screen.getByText(/Preparing export preview/i)).toBeInTheDocument();
  });

  it('renders error state on fetch failure', async () => {
    mockFetchPreview.mockRejectedValue(new Error('Network error'));
    render(<ExportReviewPanel channelId="ch-1" onClose={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  it('renders ExportSummary when manifest loads', async () => {
    mockFetchPreview.mockResolvedValue(baseManifest);
    render(<ExportReviewPanel channelId="ch-1" onClose={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getByText('Package contents')).toBeInTheDocument();
    });
  });

  it('renders FieldNoteReview only when entities have field_notes', async () => {
    const manifest = manifestWithNotes([
      { observation: 'Test note', citations: [], confidence: 'high', source: 'self-authored-briefing', trust: 'agent-observed', status: 'draft', category: 'patterns' },
    ]);
    mockFetchPreview.mockResolvedValue(manifest);
    render(<ExportReviewPanel channelId="ch-1" onClose={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getByText('Field notes for TestBot')).toBeInTheDocument();
    });
  });

  it('does not render FieldNoteReview when field_notes is null', async () => {
    mockFetchPreview.mockResolvedValue(baseManifest);
    render(<ExportReviewPanel channelId="ch-1" onClose={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getByText('Package contents')).toBeInTheDocument();
    });
    expect(screen.queryByText('Field notes for')).not.toBeInTheDocument();
  });

  it('Download Export button is present', async () => {
    mockFetchPreview.mockResolvedValue(baseManifest);
    render(<ExportReviewPanel channelId="ch-1" onClose={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getByText('Download Export')).toBeInTheDocument();
    });
  });

  it('Cancel button calls onClose', async () => {
    const onClose = vi.fn();
    mockFetchPreview.mockResolvedValue(baseManifest);
    render(<ExportReviewPanel channelId="ch-1" onClose={onClose} />);
    await waitFor(() => {
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });
    await userEvent.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalled();
  });
});

// ── ExportSummary ────────────────────────────────────────────

describe('ExportSummary', () => {
  beforeEach(() => {
    mockFetchPreview.mockReset();
  });

  it('shows project instructions with char count', async () => {
    mockFetchPreview.mockResolvedValue(baseManifest);
    render(<ExportReviewPanel channelId="ch-1" onClose={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getByText('Project instructions')).toBeInTheDocument();
      expect(screen.getByText(/500/)).toBeInTheDocument();
    });
  });

  it('shows project memory with char count', async () => {
    mockFetchPreview.mockResolvedValue(baseManifest);
    render(<ExportReviewPanel channelId="ch-1" onClose={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getByText('Project memory')).toBeInTheDocument();
      expect(screen.getByText(/200/)).toBeInTheDocument();
    });
  });

  it('shows channel context with char count', async () => {
    mockFetchPreview.mockResolvedValue(baseManifest);
    render(<ExportReviewPanel channelId="ch-1" onClose={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getByText('Channel context')).toBeInTheDocument();
      expect(screen.getByText(/100/)).toBeInTheDocument();
    });
  });

  it('shows entity prompt with char count', async () => {
    mockFetchPreview.mockResolvedValue(baseManifest);
    render(<ExportReviewPanel channelId="ch-1" onClose={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getByText('Role prompt (TestBot)')).toBeInTheDocument();
      expect(screen.getByText(/50 chars/)).toBeInTheDocument();
    });
  });

  it('shows conversation message count', async () => {
    mockFetchPreview.mockResolvedValue(baseManifest);
    render(<ExportReviewPanel channelId="ch-1" onClose={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getByText('10 messages')).toBeInTheDocument();
    });
  });

  it('shows agent count', async () => {
    // Internal name "entities" → user-facing "Agents" per V2 vocabulary
    // (Iris/Daedalus 5/18 F3 reclassify).
    mockFetchPreview.mockResolvedValue(baseManifest);
    render(<ExportReviewPanel channelId="ch-1" onClose={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getByText('Agents')).toBeInTheDocument();
    });
  });
});

// ── FieldNoteReview grouping ─────────────────────────────────

describe('FieldNoteReview grouping', () => {
  beforeEach(() => {
    mockFetchPreview.mockReset();
  });

  it('groups same-category different-source notes as agreements', async () => {
    const manifest = manifestWithNotes([
      { observation: 'Note from briefing', citations: [], confidence: 'high', source: 'self-authored-briefing', trust: 'agent-observed', status: 'draft', category: 'patterns' },
      { observation: 'Note from extraction', citations: [], confidence: 'medium', source: 'external-extraction', trust: 'synthesized', status: 'draft', category: 'patterns' },
    ]);
    mockFetchPreview.mockResolvedValue(manifest);
    render(<ExportReviewPanel channelId="ch-1" onClose={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getByText(/confirmed by both sources/)).toBeInTheDocument();
    });
  });

  it('unmatched notes appear as single-source (expanded by default)', async () => {
    const manifest = manifestWithNotes([
      { observation: 'Unique extraction note', citations: [], confidence: 'high', source: 'external-extraction', trust: 'synthesized', status: 'draft', category: 'avoid' },
    ]);
    mockFetchPreview.mockResolvedValue(manifest);
    render(<ExportReviewPanel channelId="ch-1" onClose={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getByText('Unique extraction note')).toBeInTheDocument();
    });
  });

  it('agreement group is collapsed by default', async () => {
    const manifest = manifestWithNotes([
      { observation: 'Hidden briefing note', citations: [], confidence: 'high', source: 'self-authored-briefing', trust: 'agent-observed', status: 'draft', category: 'patterns' },
      { observation: 'Hidden extraction note', citations: [], confidence: 'high', source: 'external-extraction', trust: 'synthesized', status: 'draft', category: 'patterns' },
    ]);
    mockFetchPreview.mockResolvedValue(manifest);
    render(<ExportReviewPanel channelId="ch-1" onClose={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getByText(/confirmed by both sources/)).toBeInTheDocument();
    });
    // The note text should NOT be visible when collapsed
    expect(screen.queryByText('Hidden briefing note')).not.toBeInTheDocument();
  });
});

// ── NoteCard interactions ────────────────────────────────────

describe('NoteCard interactions', () => {
  beforeEach(() => {
    mockFetchPreview.mockReset();
  });

  it('shows source badge with correct label', async () => {
    const manifest = manifestWithNotes([
      { observation: 'External note', citations: [], confidence: 'high', source: 'external-extraction', trust: 'synthesized', status: 'draft', category: 'patterns' },
      { observation: 'Self note', citations: [], confidence: 'medium', source: 'self-authored-briefing', trust: 'agent-observed', status: 'draft', category: 'avoid' },
      { observation: 'Micro note', citations: [], confidence: 'low', source: 'micro-reflection', trust: 'agent-observed', status: 'draft', category: 'other' },
    ]);
    mockFetchPreview.mockResolvedValue(manifest);
    render(<ExportReviewPanel channelId="ch-1" onClose={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getByText('External analysis')).toBeInTheDocument();
      expect(screen.getByText('Self-reported')).toBeInTheDocument();
      expect(screen.getByText('Micro-reflection')).toBeInTheDocument();
    });
  });

  it('shows confidence level', async () => {
    const manifest = manifestWithNotes([
      { observation: 'High conf note', citations: [], confidence: 'high', source: 'self-authored-briefing', trust: 'agent-observed', status: 'draft', category: 'patterns' },
    ]);
    mockFetchPreview.mockResolvedValue(manifest);
    render(<ExportReviewPanel channelId="ch-1" onClose={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getByText('high confidence')).toBeInTheDocument();
    });
  });

  it('shows citations when present', async () => {
    const manifest = manifestWithNotes([
      { observation: 'Cited note', citations: ['stop summarizing', 'be more terse'], confidence: 'high', source: 'self-authored-briefing', trust: 'agent-observed', status: 'draft', category: 'avoid' },
    ]);
    mockFetchPreview.mockResolvedValue(manifest);
    render(<ExportReviewPanel channelId="ch-1" onClose={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getByText(/stop summarizing/)).toBeInTheDocument();
    });
  });

  it('Accept button transitions note to approved state', async () => {
    const user = userEvent.setup();
    const manifest = manifestWithNotes([
      { observation: 'Approvable note', citations: [], confidence: 'high', source: 'self-authored-briefing', trust: 'agent-observed', status: 'draft', category: 'patterns' },
    ]);
    mockFetchPreview.mockResolvedValue(manifest);
    render(<ExportReviewPanel channelId="ch-1" onClose={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getByText('Accept')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Accept'));
    expect(screen.getByText('Approved')).toBeInTheDocument();
    expect(screen.queryByText('Accept')).not.toBeInTheDocument();
  });

  it('Reject button transitions note to rejected state with strikethrough', async () => {
    const user = userEvent.setup();
    const manifest = manifestWithNotes([
      { observation: 'Rejectable note', citations: [], confidence: 'low', source: 'external-extraction', trust: 'synthesized', status: 'draft', category: 'other' },
    ]);
    mockFetchPreview.mockResolvedValue(manifest);
    render(<ExportReviewPanel channelId="ch-1" onClose={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getByText('Reject')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Reject'));
    expect(screen.getByText('Rejected')).toBeInTheDocument();
    expect(screen.queryByText('Accept')).not.toBeInTheDocument();
    expect(screen.queryByText('Reject')).not.toBeInTheDocument();
  });
});
