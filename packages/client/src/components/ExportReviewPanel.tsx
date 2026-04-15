import React, { useState, useEffect } from 'react';
import { fetchExportPreview, getExportUrl } from '../api/client.js';

interface FieldNote {
  observation: string;
  citations: string[];
  confidence: 'high' | 'medium' | 'low';
  source: string;
  trust: string;
  status: string;
  category: string;
}

interface ExportEntity {
  id: string;
  name: string;
  model: string;
  effort: string;
  prompt_length_chars: number;
  field_notes: FieldNote[] | null;
}

interface Props {
  channelId: string;
  onClose: () => void;
}

export function ExportReviewPanel({ channelId, onClose }: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [manifest, setManifest] = useState<any>(null);
  const [reviewedNotes, setReviewedNotes] = useState<Map<string, Map<number, FieldNote>>>(new Map());
  const [rejectedIndices, setRejectedIndices] = useState<Map<string, Set<number>>>(new Map());

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchExportPreview(channelId, { briefing: true, extract: true })
      .then((data) => {
        setManifest(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [channelId]);

  const handleDownload = () => {
    const url = getExportUrl(channelId, { briefing: true, extract: true });
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <div className="border-b border-line bg-panel px-3 md:px-6 py-4 animate-in">
        <div className="text-sm text-muted">Preparing export preview...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border-b border-line bg-panel px-3 md:px-6 py-4 animate-in">
        <div className="text-sm text-danger">{error}</div>
        <button onClick={onClose} className="mt-2 text-xs text-muted hover:text-secondary">Close</button>
      </div>
    );
  }

  const entities: ExportEntity[] = manifest?.entities || [];
  const hasFieldNotes = entities.some((e) => e.field_notes && e.field_notes.length > 0);

  return (
    <div className="border-b border-line bg-panel px-3 md:px-6 py-4 animate-in">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-secondary uppercase tracking-wide">
          Export Preview
        </h2>
        <button onClick={onClose} className="text-muted hover:text-secondary transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="space-y-4 max-w-2xl">
        {/* Export summary */}
        <ExportSummary manifest={manifest} />

        {/* Field note review per entity */}
        {hasFieldNotes && entities.map((entity) => {
          if (!entity.field_notes || entity.field_notes.length === 0) return null;
          return (
            <FieldNoteReview
              key={entity.id}
              entityId={entity.id}
              entityName={entity.name}
              notes={entity.field_notes}
              reviewedNotes={reviewedNotes.get(entity.id) || new Map()}
              rejectedIndices={rejectedIndices.get(entity.id) || new Set()}
              onAccept={(idx) => {
                setReviewedNotes((prev) => {
                  const next = new Map(prev);
                  const entityMap = new Map(next.get(entity.id) || new Map());
                  const note = { ...entity.field_notes![idx], status: 'approved', trust: 'human-authored' };
                  entityMap.set(idx, note);
                  next.set(entity.id, entityMap);
                  return next;
                });
              }}
              onReject={(idx) => {
                setRejectedIndices((prev) => {
                  const next = new Map(prev);
                  const entitySet = new Set<number>(next.get(entity.id) || new Set());
                  entitySet.add(idx);
                  next.set(entity.id, entitySet);
                  return next;
                });
              }}
            />
          );
        })}

        {/* Export actions */}
        <div className="flex gap-2 pt-2 border-t border-line">
          <button
            onClick={handleDownload}
            className="rounded bg-accent px-4 py-1.5 text-sm font-medium text-white hover:bg-accent-hover transition-colors"
          >
            Download Export
          </button>
          <button
            onClick={onClose}
            className="rounded bg-card px-4 py-1.5 text-sm font-medium text-secondary hover:bg-hover transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Export Summary ────────────────────────────────────────────

function ExportSummary({ manifest }: { manifest: any }) {
  const project = manifest?.project;
  const ctx = manifest?.conversation_context;
  const entities: ExportEntity[] = manifest?.entities || [];
  const files = manifest?.files || [];
  const history = manifest?.conversation_history;

  return (
    <div className="rounded-lg border border-line bg-card p-3">
      <div className="text-xs font-medium text-secondary mb-2">Package contents</div>
      <div className="space-y-1 text-xs">
        {project?.instructions?.length_chars > 0 && (
          <div className="flex justify-between">
            <span className="text-secondary">Project instructions</span>
            <span className="text-muted">{project.instructions.length_chars.toLocaleString()} chars from "{project.name}"</span>
          </div>
        )}
        {project?.memory?.length_chars > 0 && (
          <div className="flex justify-between">
            <span className="text-secondary">Project memory</span>
            <span className="text-muted">{project.memory.length_chars.toLocaleString()} chars</span>
          </div>
        )}
        {ctx?.context?.length_chars > 0 && (
          <div className="flex justify-between">
            <span className="text-secondary">Channel context</span>
            <span className="text-muted">{ctx.context.length_chars.toLocaleString()} chars</span>
          </div>
        )}
        {entities.map((e) => (
          <div key={e.id} className="flex justify-between">
            <span className="text-secondary">Role prompt ({e.name})</span>
            <span className="text-muted">{e.prompt_length_chars.toLocaleString()} chars</span>
          </div>
        ))}
        <div className="pt-1 mt-1 border-t border-line flex justify-between">
          <span className="text-secondary">Conversation</span>
          <span className="text-muted">{history?.message_count || 0} messages</span>
        </div>
        {files.length > 0 && (
          <div className="flex justify-between">
            <span className="text-secondary">Files</span>
            <span className="text-muted">{files.length} file{files.length !== 1 ? 's' : ''}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-secondary">Entities</span>
          <span className="text-muted">{entities.length}</span>
        </div>
      </div>
    </div>
  );
}

// ── Field Note Review ────────────────────────────────────────

function sourceLabel(source: string): string {
  if (source === 'external-extraction') return 'External analysis';
  if (source === 'self-authored-briefing') return 'Self-reported';
  if (source === 'micro-reflection') return 'Micro-reflection';
  return source;
}

function sourceColor(source: string): string {
  if (source === 'external-extraction') return 'text-cyan-600';
  if (source === 'self-authored-briefing') return 'text-indigo-600';
  if (source === 'micro-reflection') return 'text-amber-600';
  return 'text-muted';
}

function FieldNoteReview({
  entityId,
  entityName,
  notes,
  reviewedNotes,
  rejectedIndices,
  onAccept,
  onReject,
}: {
  entityId: string;
  entityName: string;
  notes: FieldNote[];
  reviewedNotes: Map<number, FieldNote>;
  rejectedIndices: Set<number>;
  onAccept: (idx: number) => void;
  onReject: (idx: number) => void;
}) {
  // Group notes: find agreements (same category, different sources) vs single-source
  const agreements: Array<{ indices: number[]; notes: FieldNote[] }> = [];
  const singleSource: Array<{ index: number; note: FieldNote }> = [];
  const used = new Set<number>();

  // Simple pairing: match notes by category from different sources
  for (let i = 0; i < notes.length; i++) {
    if (used.has(i)) continue;
    const note = notes[i];
    let paired = false;
    for (let j = i + 1; j < notes.length; j++) {
      if (used.has(j)) continue;
      if (notes[j].category === note.category && notes[j].source !== note.source) {
        agreements.push({ indices: [i, j], notes: [note, notes[j]] });
        used.add(i);
        used.add(j);
        paired = true;
        break;
      }
    }
    if (!paired) {
      singleSource.push({ index: i, note });
      used.add(i);
    }
  }

  const [showAgreements, setShowAgreements] = useState(false);

  return (
    <div className="rounded-lg border border-line bg-card p-3">
      <div className="text-xs font-medium text-secondary mb-3">Field notes for {entityName}</div>

      {/* Agreements */}
      {agreements.length > 0 && (
        <div className="mb-3">
          <button
            onClick={() => setShowAgreements(!showAgreements)}
            className="text-xs text-muted hover:text-secondary transition-colors flex items-center gap-1"
          >
            <svg className={`w-3 h-3 transition-transform ${showAgreements ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
            {agreements.length} note{agreements.length !== 1 ? 's' : ''} confirmed by both sources
          </button>
          {showAgreements && (
            <div className="mt-2 space-y-2">
              {agreements.map(({ indices, notes: pair }) => (
                <NoteCard
                  key={indices[0]}
                  note={pair[0]}
                  secondSource={pair[1].source}
                  isAccepted={reviewedNotes.has(indices[0])}
                  isRejected={rejectedIndices.has(indices[0])}
                  onAccept={() => { onAccept(indices[0]); onAccept(indices[1]); }}
                  onReject={() => { onReject(indices[0]); onReject(indices[1]); }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Single-source notes */}
      {singleSource.length > 0 && (
        <div className="space-y-2">
          {singleSource.map(({ index, note }) => (
            <NoteCard
              key={index}
              note={note}
              isAccepted={reviewedNotes.has(index)}
              isRejected={rejectedIndices.has(index)}
              onAccept={() => onAccept(index)}
              onReject={() => onReject(index)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Note Card ────────────────────────────────────────────────

function NoteCard({
  note,
  secondSource,
  isAccepted,
  isRejected,
  onAccept,
  onReject,
}: {
  note: FieldNote;
  secondSource?: string;
  isAccepted: boolean;
  isRejected: boolean;
  onAccept: () => void;
  onReject: () => void;
}) {
  if (isRejected) {
    return (
      <div className="rounded border border-line bg-card px-3 py-2 opacity-40">
        <div className="text-xs text-muted line-through">{note.observation}</div>
        <div className="text-[10px] text-muted mt-1">Rejected</div>
      </div>
    );
  }

  return (
    <div className={`rounded border px-3 py-2 ${isAccepted ? 'border-green-500/30 bg-green-500/5' : 'border-line bg-card'}`}>
      <div className="text-xs text-primary mb-1">{note.observation}</div>
      <div className="flex items-center gap-2 text-[10px] mb-1">
        <span className={sourceColor(note.source)}>{sourceLabel(note.source)}</span>
        {secondSource && (
          <>
            <span className="text-muted">+</span>
            <span className={sourceColor(secondSource)}>{sourceLabel(secondSource)}</span>
          </>
        )}
        <span className="text-muted">{note.confidence} confidence</span>
      </div>
      {note.citations.length > 0 && (
        <div className="text-[10px] text-muted mb-2">
          Citations: {note.citations.join(', ')}
        </div>
      )}
      {!isAccepted && (
        <div className="flex gap-2">
          <button
            onClick={onAccept}
            className="text-[10px] px-2 py-0.5 rounded bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
          >
            Accept
          </button>
          <button
            onClick={onReject}
            className="text-[10px] px-2 py-0.5 rounded text-muted hover:text-danger hover:bg-danger/10 transition-colors"
          >
            Reject
          </button>
        </div>
      )}
      {isAccepted && (
        <div className="text-[10px] text-green-600 flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Approved
        </div>
      )}
    </div>
  );
}
