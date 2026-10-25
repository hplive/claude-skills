#!/usr/bin/env node
// Render an HTML scene frame by frame with Chrome (puppeteer-core) and encode it with ffmpeg.
//
//   node render.mjs <project-dir>                  -> out/<name>.mp4 + out/<name>-sheet.png (6-frame contact sheet)
//   node render.mjs <project-dir> --stills         -> PNGs of the key moments (TL.stills) in out/stills/
//   node render.mjs <project-dir> --at 1.5,4,9     -> PNGs of those instants
//   node render.mjs <project-dir> --audio          -> force the soundtrack to be rebuilt
//   options: --crf 24  --max-mb 15  --guides (draw the Instagram safe zones on stills)
//
// A project dir holds:  scene.html (window.render(t) + window.ready), timeline.js (sets globalThis.TL),
// and optionally audio.mjs (uses synth.mjs and writes <out>/<name>.wav). See ../SKILL.md.
// Env: CHROME (path to Chrome), FFMPEG (path to ffmpeg), VIDEO_OUT (output dir, default ./out).
import { spawn } from "node:child_process";
import { mkdirSync, existsSync, writeFileSync, readFileSync, unlinkSync, statSync } from "node:fs";
import { dirname, join, resolve, basename } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import puppeteer from "puppeteer-core";

const HERE = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const flag = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const dirArg = args.find((a) => !a.startsWith("--") && (args.indexOf(a) === 0));
if (!dirArg) { console.error("usage: node render.mjs <project-dir> [--stills | --at t1,t2] [--audio] [--crf N] [--max-mb N]"); process.exit(1); }

const PROJECT = resolve(dirArg);
const NAME = basename(PROJECT);
const OUT = resolve(process.env.VIDEO_OUT || join(process.cwd(), "out"));
const FFMPEG = process.env.FFMPEG || "ffmpeg";
const CHROME = process.env.CHROME || [
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser",
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
].find(existsSync);
if (!CHROME) { console.error("Chrome not found: set CHROME=/path/to/chrome"); process.exit(1); }
mkdirSync(OUT, { recursive: true });

// Only one render at a time: two renders sharing ffmpeg/Chrome/CPU have produced corrupted files before.
const LOCK = join(OUT, ".render.lock");
if (existsSync(LOCK)) {
  const pid = parseInt(readFileSync(LOCK, "utf8"), 10);
  let alive = false; try { process.kill(pid, 0); alive = true; } catch { /* stale */ }
  if (alive) { console.error(`Another render is running (pid ${pid}). Wait for it or kill it.`); process.exit(1); }
}
writeFileSync(LOCK, String(process.pid));
const cleanup = () => { try { unlinkSync(LOCK); } catch { /* ignore */ } };
process.on("exit", cleanup); process.on("SIGINT", () => process.exit(130)); process.on("SIGTERM", () => process.exit(143));

await import(pathToFileURL(join(PROJECT, "timeline.js")).href);
const TL = globalThis.TL;
if (!TL?.duration || !TL?.fps) { console.error("timeline.js must set globalThis.TL = { duration, fps, ... }"); process.exit(1); }
const W = TL.width || 1080, H = TL.height || 1920;

function run(cmd, argv, opts = {}) {
  return new Promise((res, rej) => {
    const p = spawn(cmd, argv, { stdio: ["pipe", "inherit", "inherit"], ...opts });
    p.on("error", rej); p.on("close", (c) => (c === 0 ? res() : rej(new Error(`${cmd} exited with ${c}`))));
  });
}

async function openPage(browser) {
  const page = await browser.newPage();
  await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
  page.on("pageerror", (e) => console.error("[page]", e.message));
  page.on("console", (m) => { if (m.type() === "error") console.error("[console]", m.text()); });
  await page.goto(pathToFileURL(join(PROJECT, "scene.html")).href + (args.includes("--guides") ? "?guides" : ""), { waitUntil: "networkidle0" });
  await page.evaluate(() => window.ready);
  return page;
}
async function shot(page, t, path) {
  await page.evaluate((t) => window.render(t), t);
  const buf = await page.screenshot({ type: "png", captureBeyondViewport: false });
  if (path) writeFileSync(path, buf);
  return buf;
}

const browser = await puppeteer.launch({
  executablePath: CHROME, headless: true,
  args: ["--hide-scrollbars", "--force-color-profile=srgb", "--disable-lcd-text", "--font-render-hinting=none", "--allow-file-access-from-files"],
});
try {
  const stills = args.includes("--stills"), at = flag("--at");
  if (stills || at) {
    const times = at ? at.split(",").map(Number) : (TL.stills || [0, TL.duration / 2, TL.duration - 0.05]);
    mkdirSync(join(OUT, "stills"), { recursive: true });
    const page = await openPage(browser);
    for (const t of times) await shot(page, t, join(OUT, "stills", `${NAME}-${t.toFixed(2).padStart(5, "0")}.png`));
    console.log(`${times.length} stills in ${join(OUT, "stills")}`);
    await page.close();
  } else {
    const wav = join(OUT, `${NAME}.wav`);
    const audioScript = join(PROJECT, "audio.mjs");
    if (existsSync(audioScript) && (!existsSync(wav) || args.includes("--audio"))) {
      await run(process.execPath, [audioScript], { env: { ...process.env, VIDEO_OUT: OUT, VIDEO_NAME: NAME } });
    }
    const hasAudio = existsSync(wav);
    const mp4 = join(OUT, `${NAME}.mp4`);
    const crf = flag("--crf", String(TL.crf || 24));
    const page = await openPage(browser);
    const ff = spawn(FFMPEG, [
      "-y", "-loglevel", "error",
      "-f", "image2pipe", "-framerate", String(TL.fps), "-c:v", "png", "-i", "-",
      ...(hasAudio ? ["-i", wav] : ["-f", "lavfi", "-i", `anullsrc=r=48000:cl=stereo`]),
      "-vf", "scale=out_color_matrix=bt709:out_range=tv,format=yuv420p",
      "-c:v", "libx264", "-preset", "slow", "-crf", crf, "-profile:v", "high", "-tune", "animation",
      "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", "-color_range", "tv",
      // AAC encoding raises true peak; a limiter first keeps it under -1 dBTP (about -14 LUFS, -3 dBTP final)
      "-af", "alimiter=limit=0.6:level=false:attack=3:release=80,volume=0.6dB",
      "-c:a", "aac", "-b:a", "128k", "-ar", "48000",
      "-movflags", "+faststart", "-t", String(TL.duration), mp4,
    ], { stdio: ["pipe", "inherit", "inherit"] });
    const done = new Promise((res, rej) => ff.on("close", (c) => (c === 0 ? res() : rej(new Error("ffmpeg failed")))));
    const N = Math.round(TL.duration * TL.fps), t0 = Date.now();
    for (let f = 0; f < N; f++) {
      const buf = await shot(page, f / TL.fps);
      if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once("drain", r));
      if (f % 60 === 0) process.stdout.write(`\rframe ${f}/${N} (${((Date.now() - t0) / 1000).toFixed(0)} s)`);
    }
    ff.stdin.end(); await done;
    const mb = statSync(mp4).size / 1048576;
    process.stdout.write(`\r${N} frames in ${((Date.now() - t0) / 1000).toFixed(0)} s -> ${mp4} (${mb.toFixed(1)} MB)\n`);
    const maxMb = parseFloat(flag("--max-mb", String(TL.maxMb || 15)));
    if (mb > maxMb) console.warn(`WARNING: ${mb.toFixed(1)} MB is over ${maxMb} MB. Re-run with a higher --crf (e.g. ${parseInt(crf) + 2}).`);
    // contact sheet: 6 frames side by side (TL.sheet, or evenly spaced)
    const sheetAt = TL.sheet || [0.05, 0.2, 0.4, 0.6, 0.8, 0.98].map((k) => +(TL.duration * k).toFixed(2));
    const sheet = join(OUT, `${NAME}-sheet.png`);
    await run(FFMPEG, ["-y", "-loglevel", "error", "-i", mp4, "-vf",
      `select='${sheetAt.map((s) => `eq(n,${Math.round(s * TL.fps)})`).join("+")}',scale=360:-1,tile=6x1:padding=10:margin=10:color=0x0B1124`,
      "-fps_mode", "passthrough", "-frames:v", "1", "-update", "1", sheet]);
    console.log("contact sheet ->", sheet);
    await page.close();
  }
} finally {
  await browser.close();
}
