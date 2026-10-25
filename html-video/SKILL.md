---
name: html-video
description: >-
  Make short vertical videos (Instagram Reels/Stories, TikTok, Shorts, app-store
  previews, promos) from HTML: each frame is a pure function of time, Chrome
  renders it, ffmpeg encodes it, and the soundtrack is synthesized in code
  (no samples, nothing to license). Use when the user asks for a story, reel,
  promo, teaser or motion graphic and wants it on-brand, repeatable and free of
  stock footage or AI video. Includes a storyboard-to-render workflow, safe
  zones, loudness and file-size rules, and a runnable example.
---

# html-video

A video is three small files in one folder, plus a renderer:

```
my-video/
  timeline.js   one source of truth for every timing (seconds); sets globalThis.TL
  scene.html    window.render(t) draws the frame at time t; window.ready resolves when fonts/assets are loaded
  audio.mjs     optional soundtrack built with engine/synth.mjs (writes <name>.wav at -14 LUFS)
engine/
  render.mjs    Chrome (puppeteer-core) -> frames -> ffmpeg -> mp4 + contact sheet
  synth.mjs     offline synthesizer: drones, impacts, risers, bells, clicks, ringtone, reverb
```

Needs: Node 18+, Google Chrome, `ffmpeg` on PATH (or `FFMPEG=...`), and `npm install` once in `engine/`.

## Run the example first

```bash
cd html-video/engine && npm install
cd ../example && node ../engine/render.mjs .       # -> ./out/example.mp4 + example-sheet.png
node ../engine/render.mjs . --at 1.5,4             # single frames as PNG, to check a moment
open scene.html?play                               # live loop in a browser while you edit
```

Copy `example/` to start a new video. Output goes to `./out` (set `VIDEO_OUT` to change it).

## The workflow

1. **Storyboard in a table before any code**: time range, what is on screen, the text (exact words), the sound. Show it to the user if the idea is new. Timings go into `timeline.js`, never hard-coded in the scene or the audio.
2. **Scene**: absolutely positioned elements on a fixed stage (1080x1920 by default; set `TL.width/height` for other sizes). `render(t)` sets opacity/transform from `t` only: no CSS animations, `setTimeout`, or `Date.now()`, otherwise frames are not repeatable. Helpers: `seg(t,a,b)` (0..1 progress), easing functions, `set(el, opacity, transform)`.
3. **Audio**: `createSynth(duration)` then place events at the same `TL` instants as the picture (hit on the title slam, clicks while a counter runs, chime on the end card). `finish(name)` normalizes to -14 LUFS.
4. **Check before the final render**: `--stills` for the key moments, `?guides` to see the safe zones, then the contact sheet. Read the text on the frames, not just the code.
5. **Render once, alone.** Then open the mp4 and listen. Loudness measuring is not listening.

## Rules that made these videos work

**Hook and pace**
- Text must be on screen on frame 0. If a story starts with a black frame or a logo, people swipe.
- Calm beats fast for non-technical audiences: each caption on screen at least 3 s, at most 3 short lines, big type. If people say "it goes too fast", stretch the timeline (a single multiplier over the numbers does it) instead of cutting words.
- One idea per scene. Steps one at a time, then all together as a recap.
- Make the first second personal or surprising; explain after.

**Instagram/TikTok layout (1080x1920)**
- Keep text out of the top ~250 px and bottom ~340 px (UI overlays). Use `?guides` to draw the bands.
- Leave a clearly free band (about y 740-1100) on the end card for a link/poll sticker, and point an arrow at it.
- Hold the end card still for 5-6 s so people can read it; design the last frame to loop into the first.
- Stories: up to 60 s per clip; reels up to 90 s. Keep files under ~15-20 MB (`--crf` up if the renderer warns).

**Sound**
- Synthesize, don't borrow: no samples, no copyrighted music, so there is nothing to license. Fixed seeds keep it identical between renders.
- -14 LUFS integrated. The renderer puts a limiter before AAC; without it the AAC encode pushes true peak over -1 dBTP.
- A moment of near-silence before an impact makes the impact. Don't fill every second.

**Content hygiene (public videos)**
- Mask personal data on screen (phone numbers like `000 ••• 000`, emails, names). Use generic avatars, not real people.
- No third-party logos or brands unless the user says it is fine; no trademarked characters or music (build an homage out of your own symbol instead).
- Only claim what is true on the day it is published (store availability, counts). Put the numbers that change in `timeline.js` so a new version takes minutes.

**Mechanics that bite**
- Never run two renders at once (shared CPU/ffmpeg/Chrome produced corrupted files); the renderer holds a lock, and if it says another render is running, check for orphans (`pgrep -fl render.mjs`).
- Wait for fonts in `window.ready` (`document.fonts.load(...)` with the actual characters, including accents), or the first frames use the wrong font.
- Emoji render with the OS emoji font: fine on macOS, different elsewhere. Check them on the contact sheet.
- If a render crashes mid-way, delete `out/.render.lock` only after confirming no render process is alive.
- Keep each video's assets small and local; web fonts need network on the first render only if loaded from a CDN, so prefer fonts you ship in the folder when the machine may be offline.

## Typical pipeline for a campaign

Write the script with an Instagram copy skill if available, make 3-4 different hooks as separate folders sharing the engine, render the contact sheets side by side, publish the strongest, and keep the others for later. When a number changes ("8 testers" becomes "12"), edit `timeline.js`, re-render, done.
