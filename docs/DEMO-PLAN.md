# Demo Plan — Post-0.5.6

**Status:** Blocked on 0.5.6 identity pass (in progress on laptop agent)

## Format
Short animated GIFs (15–30s each), one per concept. For the landing page and README.

## Clips to capture

### 1. "Channel as persona" (lead clip)
- Create two channels: one strict code reviewer, one creative brainstormer
- Ask the same question in both
- Cut between the two responses to show the contrast

### 2. "Streaming + control"
- Send a message, watch tokens stream in
- Hit stop mid-generation
- Hit regenerate, watch a fresh response arrive
- Shows the editorial feel that distinguishes Klatch

### 3. "Model switching" (optional, if it reads well in a GIF)
- Same channel, swap Opus → Haiku
- Show the speed difference on a similar prompt

## Placement
- `web/index.html` — hero section or below the feature grid
- `README.md` — below "What it does today"

## Tools
- Screen recording: any tool (QuickTime, Kap, OBS)
- GIF conversion: `ffmpeg -i input.mov -vf "fps=12,scale=720:-1" output.gif`
- Or use Kap which exports GIF directly

## When ready
Ping either session: "0.5.6 is merged, let's make the demo GIFs"
