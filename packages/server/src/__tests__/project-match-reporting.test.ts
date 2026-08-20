/**
 * Project-match reporting on the claude.ai bulk import response.
 *
 * Background: `findOrCreateProject` attached a re-imported ZIP's projects to
 * their existing rows correctly, but returned a bare `Project` — matched and
 * created were indistinguishable to the caller, the route kept only
 * `project.id`, and the response carried no project field at all. So a real
 * behaviour (silent attach) was invisible to the client, and Iris could not
 * render it even in principle.
 *
 * Iris's 8/19 decision fixes the surface: one aggregate line in the existing
 * result panel ("Attached to N existing project(s)"), no toast, no per-project
 * rows. The wire shape is an array rather than a count so per-project detail
 * stays reachable later without another route change.
 *
 * These tests pin the server half — the flag's correctness and the field's
 * presence on every response that can carry it.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import './setup.js';
import { createTestApp } from './app.js';
import { findOrCreateProjectWithMatch, findOrCreateProject, getAllProjects } from '../db/queries.js';
import AdmZip from 'adm-zip';

vi.mock('../claude/client.js', () => ({
  streamClaude: vi.fn(),
}));

// Built here rather than reusing `fixtures/claude-ai/test-export.zip`, which
// contains only `conversations/` and no `projects.json` — against that fixture
// `body.projects` is always `[]` and every assertion below would pass
// vacuously. A ZIP with projects is the only thing that tests this field.
function makeZip(files: Record<string, unknown>): Buffer {
  const zip = new AdmZip();
  for (const [name, content] of Object.entries(files)) {
    zip.addFile(name, Buffer.from(typeof content === 'string' ? content : JSON.stringify(content)));
  }
  return zip.toBuffer();
}

function multipartReq(zipBuffer: Buffer, filename = 'export.zip') {
  const formData = new FormData();
  formData.append('file', new File([new Uint8Array(zipBuffer)], filename, { type: 'application/zip' }));
  return { method: 'POST' as const, body: formData };
}

const projectA = {
  uuid: 'proj-match-aaa',
  name: 'Project Alpha',
  prompt_template: 'You are a helpful coding assistant.',
  docs: [],
};

const projectB = {
  uuid: 'proj-match-bbb',
  name: 'Project Beta',
  prompt_template: 'You are a testing assistant.',
  docs: [],
};

const convInA = {
  uuid: 'conv-match-1',
  name: 'Alpha Chat',
  created_at: '2026-08-20T00:00:00Z',
  project_uuid: 'proj-match-aaa',
  chat_messages: [
    { uuid: 'm1', sender: 'human', text: 'Hello', created_at: '2026-08-20T00:00:01Z' },
    { uuid: 'm2', sender: 'assistant', text: 'Hi there.', created_at: '2026-08-20T00:00:02Z' },
  ],
};

const convInB = {
  uuid: 'conv-match-2',
  name: 'Beta Chat',
  created_at: '2026-08-20T01:00:00Z',
  project_uuid: 'proj-match-bbb',
  chat_messages: [
    { uuid: 'm3', sender: 'human', text: 'Hello again', created_at: '2026-08-20T01:00:01Z' },
    { uuid: 'm4', sender: 'assistant', text: 'Hi again.', created_at: '2026-08-20T01:00:02Z' },
  ],
};

const makeStandardZip = () =>
  makeZip({
    'conversations.json': [convInA, convInB],
    'projects.json': [projectA, projectB],
  });

describe('findOrCreateProjectWithMatch', () => {
  it('reports matched=false when it creates the row', () => {
    const { project, matched } = findOrCreateProjectWithMatch(
      'Fresh Project',
      'inst',
      'claude-ai',
      { originalProjectUuid: 'zip-uuid-1' },
      'originalProjectUuid',
      'zip-uuid-1'
    );
    expect(matched).toBe(false);
    expect(project.name).toBe('Fresh Project');
  });

  it('reports matched=true on the source-identity pass', () => {
    const first = findOrCreateProjectWithMatch(
      'Repeat Project',
      'inst',
      'claude-ai',
      { originalProjectUuid: 'zip-uuid-2' },
      'originalProjectUuid',
      'zip-uuid-2'
    );
    expect(first.matched).toBe(false);

    const second = findOrCreateProjectWithMatch(
      'Repeat Project',
      'inst',
      'claude-ai',
      { originalProjectUuid: 'zip-uuid-2' },
      'originalProjectUuid',
      'zip-uuid-2'
    );
    expect(second.matched).toBe(true);
    expect(second.project.id).toBe(first.project.id);
    expect(getAllProjects().filter((p) => p.name === 'Repeat Project')).toHaveLength(1);
  });

  it('reports matched=true on the canonical-id pass (Klatch round-trip)', () => {
    const created = findOrCreateProjectWithMatch(
      'Roundtrip Project',
      'inst',
      'claude-ai',
      { originalProjectUuid: 'zip-uuid-3' },
      'originalProjectUuid',
      'zip-uuid-3'
    );
    expect(created.matched).toBe(false);

    // Re-import of a Klatch export: the match value is now the canonical Klatch
    // project id, which the first pass resolves directly.
    const roundtrip = findOrCreateProjectWithMatch(
      'Roundtrip Project',
      'inst',
      'claude-ai',
      { originalProjectUuid: created.project.id },
      'originalProjectUuid',
      created.project.id
    );
    expect(roundtrip.matched).toBe(true);
    expect(roundtrip.project.id).toBe(created.project.id);
  });

  it('findOrCreateProject still returns a bare Project and agrees with it', () => {
    const bare = findOrCreateProject(
      'Delegating Project',
      'inst',
      'claude-ai',
      { originalProjectUuid: 'zip-uuid-4' },
      'originalProjectUuid',
      'zip-uuid-4'
    );
    // No `.project` / `.matched` wrapper — the old shape is untouched.
    expect(bare.id).toBeTruthy();
    expect((bare as unknown as { matched?: boolean }).matched).toBeUndefined();

    const viaMatch = findOrCreateProjectWithMatch(
      'Delegating Project',
      'inst',
      'claude-ai',
      { originalProjectUuid: 'zip-uuid-4' },
      'originalProjectUuid',
      'zip-uuid-4'
    );
    expect(viaMatch.matched).toBe(true);
    expect(viaMatch.project.id).toBe(bare.id);
  });
});

describe('POST /api/import/claude-ai — projects field', () => {
  let app: ReturnType<typeof createTestApp>;

  beforeEach(() => {
    app = createTestApp();
  });

  it('reports every ZIP project with matched=false on a first import', async () => {
    const res = await app.request('/api/import/claude-ai', multipartReq(makeStandardZip()));
    expect(res.status).toBe(201);
    const body = await res.json();

    // Non-vacuity: the ZIP carries two projects, so the array must not be empty.
    expect(body.projects).toHaveLength(2);
    expect(body.projects.map((p: { uuid: string }) => p.uuid).sort()).toEqual([
      'proj-match-aaa',
      'proj-match-bbb',
    ]);
    expect(body.projects.map((p: { name: string }) => p.name).sort()).toEqual([
      'Project Alpha',
      'Project Beta',
    ]);
    for (const p of body.projects) {
      expect(p.matched).toBe(false);
    }
  });

  it('reports matched=true on re-import, on the 409 all-duplicates response', async () => {
    const first = await app.request('/api/import/claude-ai', multipartReq(makeStandardZip()));
    expect(first.status).toBe(201);

    const second = await app.request('/api/import/claude-ai', multipartReq(makeStandardZip()));
    // Every conversation is a duplicate the second time → 409. The project
    // find-or-create loop runs before any conversation is imported, so the
    // attach has already happened and must still be reported here.
    expect(second.status).toBe(409);
    const secondBody = await second.json();

    expect(secondBody.projects).toHaveLength(2);
    for (const p of secondBody.projects) {
      expect(p.matched).toBe(true);
    }
  });

  it('the aggregate the dialog renders is derivable from the field', async () => {
    await app.request('/api/import/claude-ai', multipartReq(makeStandardZip()));
    const res = await app.request('/api/import/claude-ai', multipartReq(makeStandardZip()));
    const body = await res.json();
    // Iris's client-side one-liner, pinned here so a shape change breaks a test
    // rather than the dialog.
    const attached = body.projects.filter((p: { matched: boolean }) => p.matched).length;
    expect(attached).toBe(2);
  });

  it('does not duplicate project rows across the two imports', async () => {
    await app.request('/api/import/claude-ai', multipartReq(makeStandardZip()));
    const afterFirst = getAllProjects().length;
    expect(afterFirst).toBeGreaterThanOrEqual(2);
    await app.request('/api/import/claude-ai', multipartReq(makeStandardZip()));
    expect(getAllProjects().length).toBe(afterFirst);
  });
});
