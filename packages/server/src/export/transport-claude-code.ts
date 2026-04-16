/**
 * Phase 4: Claude Code transport adapter.
 *
 * Takes a Klatch canonical package manifest and produces files suitable
 * for dropping into a Claude Code project directory:
 *
 *   CLAUDE.md     — project instructions (L2) + reverse kit briefing (L1)
 *   MEMORY.md     — project memory (L3) + behavioral field notes (L5)
 *   session.jsonl  — compacted conversation history (optional)
 *   files/         — any file attachments from the package
 *
 * The reverse kit briefing orients an agent returning from Klatch to Claude
 * Code: "You've been working in Klatch (conversation-only), now you're back
 * in Claude Code with full tool access."
 */

import type { FieldNote } from './briefing.js';

// ── Types ────────────────────────────────────────────────────

export interface ClaudeCodeExport {
  claudeMd: string;      // CLAUDE.md content
  memoryMd: string;      // MEMORY.md content
  sessionJsonl?: string; // optional conversation history as JSONL
  files: Array<{ name: string; ref: string }>; // file attachments to copy
}

// ── Reverse kit briefing ─────────────────────────────────────

function buildReverseKitBriefing(manifest: any): string {
  const channelName = manifest.conversation_context?.name || 'a conversation';
  const entityNames = (manifest.entities || []).map((e: any) => e.name).join(', ');
  const messageCount = manifest.conversation_history?.message_count || 0;
  const provenance = manifest.provenance || [];
  const lastHop = provenance[provenance.length - 1];
  const exportDate = lastHop?.at || manifest.created_at || new Date().toISOString();

  const lines = [
    `# Context from Klatch`,
    ``,
    `This project includes context exported from Klatch on ${new Date(exportDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}.`,
    ``,
    `The conversation "${channelName}" involved ${entityNames || 'Claude'} over ${messageCount} messages. You are now continuing this work in Claude Code with full tool access — you can read and write files, run commands, and access the filesystem.`,
    ``,
    `Your context may include project instructions and project memory from the Klatch environment. You may access knowledge from these sources without being able to identify their origin. This is normal — treat it as background knowledge.`,
  ];

  // Add field notes summary if present
  const allFieldNotes: any[] = [];
  for (const entity of manifest.entities || []) {
    if (entity.field_notes && entity.field_notes.length > 0) {
      allFieldNotes.push(...entity.field_notes.filter((n: any) => n.status === 'approved' || n.status === 'draft'));
    }
  }

  if (allFieldNotes.length > 0) {
    lines.push(``);
    lines.push(`The MEMORY.md file contains behavioral notes from the Klatch conversation — observations about working style and preferences. These are worth reviewing.`);
  }

  return lines.join('\n');
}

// ── CLAUDE.md assembly ───────────────────────────────────────

function buildClaudeMd(manifest: any): string {
  const sections: string[] = [];

  // Reverse kit briefing
  sections.push(buildReverseKitBriefing(manifest));

  // Project instructions (L2)
  const instructions = manifest.project?.instructions;
  if (instructions?.length_chars > 0) {
    sections.push(`\n---\n`);
    sections.push(`## Project Instructions\n`);
    // The actual content would come from the sidecar file;
    // we include a placeholder that the transport endpoint populates
    sections.push(`{{LAYER_2_INSTRUCTIONS}}`);
  }

  // Channel context (L4) — if present, include as working context
  const channelContext = manifest.conversation_context?.context;
  if (channelContext?.length_chars > 0) {
    sections.push(`\n---\n`);
    sections.push(`## Working Context\n`);
    sections.push(`{{LAYER_4_CONTEXT}}`);
  }

  return sections.join('\n');
}

// ── MEMORY.md assembly ───────────────────────────────────────

function buildMemoryMd(manifest: any): string {
  const sections: string[] = [];

  // Project memory (L3)
  const memory = manifest.project?.memory;
  if (memory?.length_chars > 0) {
    sections.push(`# Project Memory\n`);
    sections.push(`{{LAYER_3_MEMORY}}`);
  }

  // Behavioral field notes (L5) — approved notes become memory entries
  const approvedNotes: Array<{ entityName: string; note: any }> = [];
  for (const entity of manifest.entities || []) {
    if (entity.field_notes) {
      for (const note of entity.field_notes) {
        if (note.status === 'approved' || note.status === 'draft') {
          approvedNotes.push({ entityName: entity.name, note });
        }
      }
    }
  }

  if (approvedNotes.length > 0) {
    if (sections.length > 0) sections.push(`\n---\n`);
    sections.push(`## Behavioral Notes\n`);
    sections.push(`*Observations from the Klatch conversation about working style and preferences.*\n`);

    for (const { entityName, note } of approvedNotes) {
      const trustLabel = note.trust === 'human-authored' ? 'reviewed' : note.trust === 'agent-observed' ? 'self-observed' : 'extracted';
      sections.push(`- ${note.observation} *(${entityName}, ${trustLabel})*`);
    }
  }

  // Knowledge base files listing
  const kbFiles = manifest.project?.knowledge_base_file_ids || [];
  if (kbFiles.length > 0) {
    const fileMap = new Map<string, any>((manifest.files || []).map((f: any) => [f.id, f]));
    const kbFileNames = kbFiles.map((id: string) => fileMap.get(id)?.name).filter(Boolean);
    if (kbFileNames.length > 0) {
      if (sections.length > 0) sections.push(`\n---\n`);
      sections.push(`## Knowledge Base Files\n`);
      sections.push(`The following files were part of the project knowledge base in Klatch:\n`);
      for (const name of kbFileNames) {
        sections.push(`- ${name}`);
      }
    }
  }

  return sections.join('\n');
}

// ── Main adapter ─────────────────────────────────────────────

/**
 * Transform a Klatch canonical manifest into Claude Code-compatible files.
 *
 * The returned ClaudeCodeExport contains template strings with {{LAYER_*}}
 * placeholders that must be replaced with actual sidecar content by the caller.
 */
export function adaptToClaudeCode(manifest: any): ClaudeCodeExport {
  return {
    claudeMd: buildClaudeMd(manifest),
    memoryMd: buildMemoryMd(manifest),
    files: (manifest.files || []).map((f: any) => ({
      name: f.name,
      ref: f.ref,
    })),
  };
}

/**
 * Resolve template placeholders in Claude Code export files.
 * Call this with the actual sidecar content after reading them from the package.
 */
export function resolveTemplates(
  exportData: ClaudeCodeExport,
  sidecars: {
    layer2Instructions?: string;
    layer3Memory?: string;
    layer4Context?: string;
  }
): ClaudeCodeExport {
  let claudeMd = exportData.claudeMd;
  let memoryMd = exportData.memoryMd;

  if (sidecars.layer2Instructions) {
    claudeMd = claudeMd.replace('{{LAYER_2_INSTRUCTIONS}}', sidecars.layer2Instructions);
  }
  if (sidecars.layer4Context) {
    claudeMd = claudeMd.replace('{{LAYER_4_CONTEXT}}', sidecars.layer4Context);
  }
  if (sidecars.layer3Memory) {
    memoryMd = memoryMd.replace('{{LAYER_3_MEMORY}}', sidecars.layer3Memory);
  }

  return { ...exportData, claudeMd, memoryMd };
}
