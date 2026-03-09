# Demo Plan — v0.6.0

**Status:** Active — first video captured, landing page wired up

## Format
Short MP4 videos (autoplay, loop, muted) for the landing page. GIF fallbacks for README/GitHub contexts where `<video>` isn't supported.

## Captured clips

### 1. "Multi-entity roles" (0.6.0-01-roles)
- **Source:** `demo/0.6.0-01-roles.mov` (~38MB, 1:41)
- **Web version:** `web/assets/0.6.0-01-roles-web.mp4` (~2-3MB, 800px wide, h264 crf 28)
- **GIF version:** `demo/0.6.0-01-roles.gif` (~19MB — consider trimming for README use)
- **Shows:** Multi-entity panel mode, multiple personas responding in parallel

## Clips still needed

### 2. "Roundtable discussion" (~20s)
1. Create a roundtable-mode channel with 2-3 entities
2. Send a discussion prompt
3. Watch entities respond sequentially, each building on the last
4. **Shows:** Roundtable mode — the first thing Klatch can do that claude.ai can't

### 3. "Streaming + control" (~15s)
1. Send a meaty question, watch tokens stream
2. Hit Stop mid-generation
3. Hit Retry (regenerate)
4. **Shows:** Editorial control over the conversation flow

### 4. "Channel as persona" (~15s)
1. Flip between channels with different system prompts
2. Ask the same question, show contrasting tone
3. **Shows:** Channel identity shaping personality

## Conversion commands

```bash
# MOV → web-ready MP4 (small, high quality)
ffmpeg -i demo/INPUT.mov -vf "scale=800:-2" \
  -c:v libx264 -crf 28 -preset slow -an \
  web/assets/OUTPUT-web.mp4

# MOV → GIF (for README/GitHub, trim to key moments)
ffmpeg -ss START -t DURATION -i demo/INPUT.mov \
  -vf "fps=10,scale=720:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse" \
  demo/OUTPUT.gif
```

Note: use `-2` (not `-1`) for h264 scale height to ensure even dimensions.

## Placement
- `web/index.html` — hero section (clip 1 as `<video>`)
- `README.md` — below "What it does today" (GIF or linked MP4)

## Tools
- Screen recording: QuickTime (macOS built-in)
- Conversion: ffmpeg (brew install ffmpeg)
