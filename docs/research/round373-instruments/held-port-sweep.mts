/**
 * Round 373, Daedalus — the one reading neither seat has: a FULL driving sweep with `:3001` HELD.
 *
 * Theseus named it at the end of his Round 372 §4 and left it because it costs a held port for the
 * length of a sweep. It is the only drive that puts a real BLOCKED row through his new
 * `probeRowAnnotations` in the sweep's OWN output, rather than through `classify` alone: his §2
 * measured `probe-round225` on a held port directly, which establishes what `classify` returns, but
 * not what `main()`'s per-probe row prints beside it.
 *
 * Shape, deliberately the same as his occupied-port cell: the port is bound by THIS process on the
 * wildcard and released by this process, so there is nothing to reap and no `kill` anywhere. If this
 * process dies the port goes with it.
 *
 * Reads the port through the real library both ends (`scripts/lib/probe-server-ownership.mts`)
 * rather than through a hand-rolled bind — a bind on `127.0.0.1` answers FREE against a real
 * wildcard occupant, which is the defect that library exists to hold.
 *
 * Drive: `npx tsx docs/research/round373-instruments/held-port-sweep.mts`
 * The sweep's whole transcript is written to `.round373/held-port-sweep.out` (gitignored) and the
 * rows are re-read from that file, so nothing here is a count off the verdict line.
 */
import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  aWildcardBindWouldSucceed,
  portAcceptsAConnection,
  somethingIsAlreadyAnswering,
  trackedNetServer,
} from '../../../scripts/lib/probe-server-ownership.mts';

const REPO = join(import.meta.dirname, '..', '..', '..');
const PORT = 3001;
const OUT_DIR = join(REPO, '.round373');
const OUT_FILE = join(OUT_DIR, 'held-port-sweep.out');

const readPort = async (label: string) => {
  const answering = await somethingIsAlreadyAnswering(PORT);
  const accepts = await portAcceptsAConnection(PORT);
  const bindable = await aWildcardBindWouldSucceed(PORT);
  console.log(
    `${label.padEnd(18)} answering=${answering === null ? 'null' : JSON.stringify(answering).slice(0, 40)}`
      + ` · acceptsConnection=${accepts} · wildcardBindWouldSucceed=${bindable}`,
  );
  return { answering, accepts, bindable };
};

const main = async () => {
  mkdirSync(OUT_DIR, { recursive: true });

  const before = await readPort('BEFORE (free?)');
  if (before.accepts || before.answering !== null) {
    console.log('REFUSING: something already holds :3001. This cell must be the only occupant, or'
      + ' the reading is about someone else\'s server. Nothing driven.');
    process.exit(3);
  }

  const { server, closeBounded } = trackedNetServer();
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.once('listening', () => resolve());
    server.listen(PORT); // wildcard, the address `serve({ fetch, port })` binds
  });
  const held = await portAcceptsAConnection(PORT);
  console.log(`HELD               wildcard :${PORT} bound by this process · acceptsConnection=${held}`);
  if (!held) {
    await closeBounded(3000);
    console.log('REFUSING: bound but nothing connects, so the sweep would not see an occupied port.');
    process.exit(3);
  }

  const t0 = Date.now();
  const r = spawnSync('node', ['scripts/sweep-probes.mjs'], {
    cwd: REPO,
    encoding: 'utf8',
    timeout: 1_500_000,
    maxBuffer: 64 * 1024 * 1024,
  });
  const ms = Date.now() - t0;
  const out = `${r.stdout ?? ''}${r.stderr ?? ''}`;
  writeFileSync(OUT_FILE, out, 'utf8');

  const closed = await closeBounded(5000);
  console.log(`RELEASED           closeBounded -> ${closed}`);
  const after = await readPort('AFTER (free again?)');

  // Rows, re-read from the written transcript rather than counted off the verdict line.
  const lines = out.split('\n');
  const rowAt: number[] = [];
  lines.forEach((l, i) => { if (/^ {2}(PASS|RED|BLOCKED) {1,}exit/.test(l)) rowAt.push(i); });
  const states = rowAt.map((i) => (lines[i].trim().split(/\s+/)[0]));
  const tally = states.reduce<Record<string, number>>((a, s) => ({ ...a, [s]: (a[s] ?? 0) + 1 }), {});

  console.log('');
  console.log(`sweep exit         ${r.status} (signal ${String(r.signal)}) after ${ms} ms, ${out.length} bytes`);
  console.log(`rows               ${rowAt.length} total — ${JSON.stringify(tally)}`);
  console.log(`verdict line(s)    ${lines.filter((l) => /^SWEEP (PASSED|FAILED|BLOCKED)/.test(l)).join(' | ') || '(none)'}`);
  console.log('');
  console.log('Every non-PASS row with the annotation lines beneath it, verbatim:');
  for (const i of rowAt) {
    if (lines[i].trim().startsWith('PASS')) continue;
    console.log('---');
    for (let j = i; j < Math.min(i + 8, lines.length); j += 1) {
      if (j > i && /^ {2}(PASS|RED|BLOCKED) {1,}exit/.test(lines[j])) break;
      console.log(lines[j]);
    }
  }
  console.log('---');
  console.log(`transcript         ${OUT_FILE}`);
  console.log(`port after         accepts=${after.accepts} answering=${after.answering === null ? 'null' : 'SOMETHING'}`);
};

await main();
