# Demo Plan — v0.5.6

**Status:** Active — seed script ready, landing page scaffolded, awaiting screen capture

## Format
Short animated GIFs (15–30s each), one per concept. For the landing page and README.

## Seed script

Run `npm run demo:seed` to set up demo-ready state:
- Creates two channels with distinct system prompts
- Clears any existing messages so the recording starts clean
- Does NOT send messages — you type live for the authentic streaming feel

### Channels created

| Channel | System prompt gist | Purpose |
|---------|-------------------|---------|
| `code-reviewer` | Senior engineer, concise, cites line numbers | Strict persona |
| `brainstormer` | Creative partner, uses analogies, asks questions | Warm persona |

## Clips to capture

### 1. "Channel as persona" (lead clip, ~20s)
1. Start in `#code-reviewer`, type: *"How should I handle errors in a REST API?"*
2. Let ~5s of response stream, then click `#brainstormer` in sidebar
3. Type the same question, let it stream
4. Cut between the two to show contrasting tone

**What to show:** sidebar navigation, system prompt shaping personality, streaming

### 2. "Streaming + control" (~15s)
1. Send a meaty question in any channel
2. Watch tokens stream for ~3s
3. Hit **Stop** mid-generation
4. Hit **Retry** (regenerate), watch a fresh response arrive
5. Shows the editorial feel that distinguishes Klatch

**What to show:** live token streaming, stop button, retry action

### 3. "Model switching" (optional, ~15s)
1. In channel settings, switch Opus → Haiku
2. Ask a short question, note the speed
3. Switch back to Opus, ask the same question

**What to show:** settings panel, model selector, speed difference

## Placement
- `web/index.html` — hero section (clip 1) + feature grid (clips 2–3)
- `README.md` — below "What it does today"

## Landing page

`web/index.html` is a static single-page scaffold with:
- Hero section with placeholder for lead GIF
- Feature grid (3 cards) with placeholders for each clip
- Quick-start instructions
- Drop GIF files into `web/assets/` and update `src` attributes

## Tools
- Screen recording: any tool (QuickTime, Kap, OBS)
- GIF conversion: `ffmpeg -i input.mov -vf "fps=12,scale=720:-1" output.gif`
- Or use Kap which exports GIF directly

## Nonblocking notes for implementation agent
This demo work is additive only (new files in `web/`, a seed script, docs).
It does not touch any `packages/` source code. Entity work (0.6) can proceed
in parallel without conflicts. Once entities land, we'll capture an updated
"multi-persona" demo clip.
