import React, { useState } from 'react';
import type { Channel } from '@klatch/shared';

interface Props {
  channels: Channel[];
  activeChannelId: string;
  onSelectChannel: (id: string) => void;
  onCreateChannel: (name: string, systemPrompt: string) => void;
}

export function ChannelSidebar({
  channels,
  activeChannelId,
  onSelectChannel,
  onCreateChannel,
}: Props) {
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPrompt, setNewPrompt] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    onCreateChannel(name, newPrompt.trim() || 'You are a helpful assistant.');
    setNewName('');
    setNewPrompt('');
    setShowForm(false);
  };

  return (
    <div className="w-60 flex-shrink-0 bg-[#0a1628] border-r border-gray-800 flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-800">
        <h2 className="text-sm font-semibold text-gray-300 tracking-wide uppercase">
          Channels
        </h2>
      </div>

      {/* Channel list */}
      <div className="flex-1 overflow-y-auto py-1">
        {channels.map((ch) => (
          <button
            key={ch.id}
            onClick={() => onSelectChannel(ch.id)}
            className={`w-full text-left px-4 py-1.5 text-sm transition-colors ${
              ch.id === activeChannelId
                ? 'bg-indigo-600/20 text-white font-medium'
                : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
            }`}
          >
            <span className="text-gray-500 mr-1">#</span>
            {ch.name}
          </button>
        ))}
      </div>

      {/* Create channel */}
      <div className="border-t border-gray-800 p-3">
        {showForm ? (
          <form onSubmit={handleSubmit} className="space-y-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Channel name"
              autoFocus
              className="w-full rounded bg-gray-800 border border-gray-700 px-2.5 py-1.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500"
            />
            <textarea
              value={newPrompt}
              onChange={(e) => setNewPrompt(e.target.value)}
              placeholder="System prompt (optional)"
              rows={2}
              className="w-full rounded bg-gray-800 border border-gray-700 px-2.5 py-1.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500 resize-none"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 rounded bg-indigo-600 px-2 py-1 text-xs font-medium text-white hover:bg-indigo-500 transition-colors"
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 rounded bg-gray-700 px-2 py-1 text-xs font-medium text-gray-300 hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setShowForm(true)}
            className="w-full rounded bg-gray-800 px-3 py-1.5 text-sm text-gray-400 hover:text-gray-200 hover:bg-gray-700 transition-colors text-left"
          >
            + New channel
          </button>
        )}
      </div>
    </div>
  );
}
