/**
 * Playwright script for recording the Mystery Menu roundtable demo.
 *
 * Prerequisites:
 *   npm install -D playwright @playwright/test
 *   npx playwright install chromium
 *
 * Usage:
 *   1. Start server:  KLATCH_DB=demo.db npm run dev:server
 *   2. Seed data:     ./scripts/seed-demo.sh
 *   3. Start client:  npm run dev:client
 *   4. Record:        npx tsx scripts/record-demo.ts
 *
 * Output: web/assets/demo-mystery-menu-roundtable.mp4
 */

import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';
const OUTPUT_DIR = path.join(import.meta.dirname || __dirname, '..', 'web', 'assets');
const OUTPUT_FILE = 'demo-mystery-menu-roundtable.webm';

const DEMO_MESSAGE =
  "I've been thinking about a new tasting menu concept. " +
  'For $300, and just knowing guests\' dietary restrictions, ' +
  'we create a completely custom meal — nothing from the regular menu, ' +
  'designed specifically for them. Thoughts?';

// Simulate human typing: variable delays, occasional backspace
async function humanType(page: any, selector: string, text: string) {
  await page.click(selector);

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    // Occasional typo + correction (roughly 1 in 80 chars, not on spaces/punctuation)
    if (i > 10 && i < text.length - 10 && Math.random() < 0.012 && /[a-z]/i.test(char)) {
      const wrongChar = String.fromCharCode(char.charCodeAt(0) + (Math.random() > 0.5 ? 1 : -1));
      await page.keyboard.type(wrongChar, { delay: randomDelay(40, 80) });
      await sleep(randomDelay(150, 350));
      await page.keyboard.press('Backspace');
      await sleep(randomDelay(80, 150));
    }

    await page.keyboard.type(char, { delay: randomDelay(35, 90) });

    // Longer pause after punctuation or end of phrase
    if (/[.,—!?]/.test(char)) {
      await sleep(randomDelay(150, 400));
    }
    // Brief pause after spaces (word boundary)
    else if (char === ' ') {
      await sleep(randomDelay(30, 120));
    }
  }
}

function randomDelay(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min) + min);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  // Ensure output directory exists
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    recordVideo: {
      dir: OUTPUT_DIR,
      size: { width: 1280, height: 720 },
    },
  });

  const page = await context.newPage();

  console.log('Opening Klatch...');
  await page.goto(BASE_URL);
  await page.waitForLoadState('networkidle');
  await sleep(1000);

  // Find and expand the Mystery Menu Restaurant project
  console.log('Navigating to Mystery Menu channel...');
  const projectButton = page.locator('button:has-text("Mystery Menu Restaurant")');
  await projectButton.click();
  await sleep(500);

  // Click the mystery-menu channel
  const channelButton = page.locator('button.text-left:has-text("mystery-menu")');
  await channelButton.click();
  await sleep(1000);

  // Wait for the message input to be ready
  await page.waitForSelector('textarea', { timeout: 5000 });
  await sleep(500);

  // Type the demo message with realistic human typing
  console.log('Typing demo message...');
  await humanType(page, 'textarea', DEMO_MESSAGE);
  await sleep(800);

  // Send the message
  console.log('Sending message...');
  await page.keyboard.press('Enter');

  // Wait for all three roundtable responses to complete
  // Each entity responds in sequence; wait for 3 assistant messages
  console.log('Waiting for roundtable responses...');

  // Wait for at least 3 assistant message bubbles
  await page.waitForFunction(
    () => {
      const messages = document.querySelectorAll('[class*="justify-start"]');
      // Check that the last message is no longer streaming
      // (no typing indicator / streaming dots)
      if (messages.length < 3) return false;
      const streamingIndicator = document.querySelector('[class*="animate-pulse"]');
      return !streamingIndicator;
    },
    { timeout: 120_000 },
  );

  // Let the final response settle visually
  await sleep(3000);

  console.log('Recording complete. Closing browser...');
  await page.close();
  await context.close();
  await browser.close();

  // Playwright saves video with a generated name; find and rename it
  const files = fs.readdirSync(OUTPUT_DIR).filter((f) => f.endsWith('.webm'));
  if (files.length > 0) {
    const latest = files
      .map((f) => ({ name: f, time: fs.statSync(path.join(OUTPUT_DIR, f)).mtimeMs }))
      .sort((a, b) => b.time - a.time)[0];
    const finalPath = path.join(OUTPUT_DIR, OUTPUT_FILE);
    fs.renameSync(path.join(OUTPUT_DIR, latest.name), finalPath);
    console.log(`Video saved: ${finalPath}`);
  } else {
    console.log('Warning: No video file found. Check Playwright video recording configuration.');
  }
}

main().catch((err) => {
  console.error('Demo recording failed:', err);
  process.exit(1);
});
