// Helper script to create test ZIP fixtures
// Run with: npx tsx packages/server/src/__tests__/fixtures/claude-ai/create-test-zip.ts
import AdmZip from 'adm-zip';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function createTestZip() {
  const zip = new AdmZip();

  // Add conversations
  const simple = fs.readFileSync(path.join(__dirname, 'simple-conversation.json'), 'utf-8');
  const second = fs.readFileSync(path.join(__dirname, 'second-conversation.json'), 'utf-8');

  zip.addFile('conversations/conv-simple-001.json', Buffer.from(simple));
  zip.addFile('conversations/conv-second-001.json', Buffer.from(second));

  zip.writeZip(path.join(__dirname, 'test-export.zip'));
  console.log('Created test-export.zip');
}

function createToolHeavyZip() {
  const zip = new AdmZip();
  const toolHeavy = fs.readFileSync(path.join(__dirname, 'tool-heavy-conversation.json'), 'utf-8');
  zip.addFile('conversations/conv-tools-001.json', Buffer.from(toolHeavy));
  zip.writeZip(path.join(__dirname, 'test-tools-export.zip'));
  console.log('Created test-tools-export.zip');
}

createTestZip();
createToolHeavyZip();
