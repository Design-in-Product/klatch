import type { Channel } from '@klatch/shared';

/**
 * Cross-reference strip shown beneath a 1-1 role chat's header: the klatches that
 * chat's agent also participates in, as clickable links. Renders nothing when empty.
 */
export function CrossRefStrip({
  klatches,
  onSelect,
}: {
  klatches: Channel[];
  onSelect: (channelId: string) => void;
}) {
  if (klatches.length === 0) return null;
  return (
    <div className="border-b border-line px-3 md:px-6 py-1.5 text-xs text-secondary flex items-center gap-x-2 gap-y-1 flex-wrap">
      <span className="text-muted">Also in:</span>
      {klatches.map((k) => (
        <button
          key={k.id}
          onClick={() => onSelect(k.id)}
          className="text-accent hover:underline font-medium"
          title={`Open #${k.name}`}
        >
          #{k.name}
        </button>
      ))}
    </div>
  );
}
