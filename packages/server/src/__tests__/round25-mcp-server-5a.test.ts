/**
 * Round 25: Phase 5a — MCP server (read-only resources)
 *
 * Tests for the Klatch MCP server module. Validates that:
 * - The server registers the expected resources
 * - Resource reads produce canonical packages matching the HTTP export shape
 * - Missing channels/projects/entities return idiomatic errors
 * - Resource listing callbacks enumerate live DB content
 */

import { describe, it, expect, beforeEach } from 'vitest';
import './setup.js';
import {
  createChannel,
  createProject,
  createEntity,
  assignEntityToChannel,
  setChannelProject,
  insertMessage,
  appendReflection,
} from '../db/queries.js';
import {
  createKlatchMcpServer,
  listChannelsLightweight,
  _internal,
  CHANNELS_LIST_URI,
} from '../mcp/server.js';
import { FORMAT_VERSION, SUPPORTED_FORMAT_VERSIONS } from '../export/package-builder.js';

const { assembleChannelPackage, assembleProjectPackage, assembleEntityPackage } = _internal;

describe('Round 25: MCP server (Phase 5a)', () => {
  describe('package assembly — channels', () => {
    it('assembles a canonical package for a simple channel', () => {
      const entity = createEntity('Tester', 'claude-opus-4-6', 'Test entity prompt', '#3B82F6', 'tester');
      const channel = createChannel('test-channel', 'channel prompt');
      assignEntityToChannel(channel.id, entity.id);
      insertMessage(channel.id, 'user', 'hello');
      insertMessage(channel.id, 'assistant', 'hi', 'complete', undefined, entity.id);

      const pkg = assembleChannelPackage(channel.id);

      expect(pkg).not.toBeNull();
      expect(pkg.format_version).toBe(FORMAT_VERSION);
      expect(pkg.source_type).toBe('klatch');
      expect(pkg.package_kind).toBe('klatch.context.v1');
      expect(pkg.package_id).toBeTruthy();
      expect(pkg.created_at).toBeTruthy();
      expect(pkg.conversation_context.id).toBe(channel.id);
      expect(pkg.conversation_context.name).toBe('test-channel');
      // createChannel auto-assigns the default entity; we added Tester as a second entity
      expect(pkg.entities.length).toBeGreaterThanOrEqual(1);
      const tester = pkg.entities.find((e: any) => e.id === entity.id);
      expect(tester).toBeDefined();
      expect(tester.name).toBe('Tester');
      expect(pkg.conversation_history.message_count).toBe(2);
    });

    it('includes project package when channel has a project', () => {
      const project = createProject('test-project', 'project instructions', 'native', {}, 'project memory');
      const channel = createChannel('proj-channel', 'channel prompt');
      setChannelProject(channel.id, project.id);

      const pkg = assembleChannelPackage(channel.id);

      expect(pkg.project).not.toBeNull();
      expect(pkg.project.id).toBe(project.id);
      expect(pkg.project.name).toBe('test-project');
      expect(pkg.project.instructions.length_chars).toBe('project instructions'.length);
      expect(pkg.project.memory.length_chars).toBe('project memory'.length);
    });

    it('returns null for missing channel', () => {
      const pkg = assembleChannelPackage('does-not-exist');
      expect(pkg).toBeNull();
    });

    it('includes provenance with a klatch hop', () => {
      const channel = createChannel('prov-test', 'x');
      const pkg = assembleChannelPackage(channel.id);

      expect(pkg.provenance).toHaveLength(1);
      expect(pkg.provenance[0].source).toBe('klatch');
      expect(pkg.provenance[0].channel_id).toBe(channel.id);
      expect(pkg.provenance[0].event_id).toBeTruthy();
      expect(pkg.provenance[0].integrity).toBeNull();
    });

    it('field_notes is null when no reflections or briefings present', () => {
      const entity = createEntity('Bare', 'claude-opus-4-6', 'prompt', '#3B82F6');
      const channel = createChannel('bare', 'x');
      assignEntityToChannel(channel.id, entity.id);

      const pkg = assembleChannelPackage(channel.id);
      expect(pkg.entities[0].field_notes).toBeNull();
    });

    it('field_notes includes reflections when entity has them', () => {
      const entity = createEntity('Reflective', 'claude-opus-4-6', 'prompt', '#3B82F6');
      const channel = createChannel('ref-chan', 'x');
      assignEntityToChannel(channel.id, entity.id);

      appendReflection(entity.id, {
        observation: 'User prefers short answers',
        createdAt: new Date().toISOString(),
        channelId: channel.id,
        type: 'session-end',
      });

      const pkg = assembleChannelPackage(channel.id);
      expect(pkg.entities[0].field_notes).not.toBeNull();
      expect(pkg.entities[0].field_notes).toHaveLength(1);
      expect(pkg.entities[0].field_notes[0].source).toBe('micro-reflection');
      expect(pkg.entities[0].field_notes[0].trust).toBe('agent-observed');
    });
  });

  describe('package assembly — projects', () => {
    it('assembles a project package', () => {
      const project = createProject('p1', 'my instructions', 'native', {}, 'my memory');
      const pkg = assembleProjectPackage(project.id);

      expect(pkg).not.toBeNull();
      expect(pkg.format_version).toBe(FORMAT_VERSION);
      expect(pkg.package_kind).toBe('klatch.project.v1');
      expect(pkg.project.id).toBe(project.id);
      expect(pkg.project.instructions.content).toBe('my instructions');
      expect(pkg.project.memory.content).toBe('my memory');
      expect(pkg.provenance).toHaveLength(1);
      expect(pkg.provenance[0].project_id).toBe(project.id);
    });

    it('returns null for missing project', () => {
      expect(assembleProjectPackage('nope')).toBeNull();
    });

    it('layer_fidelity reflects content presence', () => {
      const p1 = createProject('empty', '', 'native', {}, '');
      const p2 = createProject('full', 'instr', 'native', {}, 'mem');

      const pkg1 = assembleProjectPackage(p1.id)!;
      const pkg2 = assembleProjectPackage(p2.id)!;

      expect(pkg1.provenance[0].layer_fidelity.L2).toBe('absent');
      expect(pkg1.provenance[0].layer_fidelity.L3).toBe('absent');
      expect(pkg2.provenance[0].layer_fidelity.L2).toBe('full');
      expect(pkg2.provenance[0].layer_fidelity.L3).toBe('full');
    });
  });

  describe('package assembly — entities', () => {
    it('assembles an entity package', () => {
      const entity = createEntity('Sage', 'claude-opus-4-6', 'You are wise', '#F59E0B', 'sage');
      const pkg = assembleEntityPackage(entity.id);

      expect(pkg).not.toBeNull();
      expect(pkg.format_version).toBe(FORMAT_VERSION);
      expect(pkg.package_kind).toBe('klatch.entity.v1');
      expect(pkg.entity.id).toBe(entity.id);
      expect(pkg.entity.name).toBe('Sage');
      expect(pkg.entity.handle).toBe('sage');
      expect(pkg.entity.prompt).toBe('You are wise');
      expect(pkg.entity.field_notes).toBeNull();
    });

    it('includes reflections in entity package', () => {
      const entity = createEntity('Noted', 'claude-opus-4-6', 'prompt', '#3B82F6');
      appendReflection(entity.id, {
        observation: 'Something learned',
        createdAt: new Date().toISOString(),
        channelId: 'any',
        type: 'session-end',
      });

      const pkg = assembleEntityPackage(entity.id)!;
      expect(pkg.entity.field_notes).toHaveLength(1);
      expect(pkg.entity.field_notes[0].observation).toBe('Something learned');
    });

    it('returns null for missing entity', () => {
      expect(assembleEntityPackage('nope')).toBeNull();
    });
  });

  describe('listing', () => {
    it('listChannelsLightweight returns all channels with metadata', () => {
      const entity = createEntity('E', 'claude-opus-4-6', 'p', '#3B82F6');
      const c1 = createChannel('alpha', 'x');
      const c2 = createChannel('beta', 'y');
      assignEntityToChannel(c1.id, entity.id);
      assignEntityToChannel(c2.id, entity.id);
      insertMessage(c1.id, 'user', 'hi');

      const channels = listChannelsLightweight();
      // Note: a 'default' channel exists from setup seed data
      expect(channels.length).toBeGreaterThanOrEqual(2);
      const alpha = channels.find((c) => c.name === 'alpha');
      const beta = channels.find((c) => c.name === 'beta');
      expect(alpha).toBeDefined();
      expect(beta).toBeDefined();
      expect(alpha!.message_count).toBe(1);
      expect(beta!.message_count).toBe(0);
      // createChannel auto-assigns the default entity, plus we added E = 2
      expect(alpha!.entity_count).toBe(2);
    });
  });

  describe('server construction', () => {
    it('createKlatchMcpServer returns a server with expected metadata', () => {
      const server = createKlatchMcpServer();
      expect(server).toBeDefined();
      expect(server.server).toBeDefined();
    });

    it('advertises format version support', () => {
      expect(SUPPORTED_FORMAT_VERSIONS).toContain(FORMAT_VERSION);
      expect(SUPPORTED_FORMAT_VERSIONS.length).toBeGreaterThan(0);
    });

    it('CHANNELS_LIST_URI uses klatch scheme', () => {
      expect(CHANNELS_LIST_URI).toBe('klatch://channels');
    });
  });

  describe('equivalence with HTTP export manifest', () => {
    it('channel package matches the shape produced by buildManifest', () => {
      const entity = createEntity('E', 'claude-opus-4-6', 'prompt', '#3B82F6');
      const channel = createChannel('eq-test', 'context');
      assignEntityToChannel(channel.id, entity.id);
      insertMessage(channel.id, 'user', 'q');
      insertMessage(channel.id, 'assistant', 'a', 'complete', undefined, entity.id);

      const pkg = assembleChannelPackage(channel.id)!;

      // Required top-level fields per Phase 1 spec
      expect(pkg).toHaveProperty('format_version');
      expect(pkg).toHaveProperty('source_type');
      expect(pkg).toHaveProperty('package_id');
      expect(pkg).toHaveProperty('package_kind');
      expect(pkg).toHaveProperty('created_at');
      expect(pkg).toHaveProperty('provenance');
      expect(pkg).toHaveProperty('conversation_context');
      expect(pkg).toHaveProperty('entities');
      expect(pkg).toHaveProperty('files');
      expect(pkg).toHaveProperty('conversation_history');
      expect(pkg).toHaveProperty('extensions');
      expect(pkg.extensions).toHaveProperty('klatch');
    });
  });
});
