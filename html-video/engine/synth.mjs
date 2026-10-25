// Tiny offline synthesizer for soundtracks: oscillators, seeded noise, envelopes, a simple Schroeder reverb.
// No samples, no third-party music, so nothing to license.
// createSynth(duration) returns the instruments; finish(name) mixes, normalizes (-14 LUFS, -1.5 dBTP) and writes <outDir>/<name>.wav.
import { writeFileSync, mkdirSync, renameSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";

const OUT = process.env.VIDEO_OUT || join(process.cwd(), "out");
const FFMPEG = process.env.FFMPEG || "/opt/homebrew/bin/ffmpeg";
const SR = 48000;
const TAU = Math.PI * 2;

export function createSynth(duration, { seed: seed0 = 12345 } = {}) {
const N = Math.ceil(duration * SR);
const L = new Float32Array(N), R = new Float32Array(N);       // dry
const RL = new Float32Array(N), RR = new Float32Array(N);     // reverb send

let seed = seed0;
const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const noise = () => rnd() * 2 - 1;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

// Add a mono voice: fn(tLocal) -> sample; pan -1..1; rev = amount sent to the reverb
function add(t0, dur, fn, { gain = 1, pan = 0, rev = 0, until = Infinity } = {}) {
  const s0 = Math.max(0, Math.floor(t0 * SR)), s1 = Math.min(N, Math.floor(Math.min(t0 + dur, until) * SR));
  const gl = Math.cos((pan + 1) * Math.PI / 4), gr = Math.sin((pan + 1) * Math.PI / 4);
  for (let i = s0; i < s1; i++) {
    const v = fn(i / SR - t0) * gain;
    L[i] += v * gl; R[i] += v * gr;
    if (rev) { RL[i] += v * gl * rev; RR[i] += v * gr * rev; }
  }
}
const env = (t, a, d) => (t < a ? t / a : Math.exp(-(t - a) / d));          // linear attack, exponential decay
const adsr = (t, dur, a, r) => clamp(Math.min(t / a, (dur - t) / r), 0, 1);  // trapezoid
function lowpass(fc) { let y = 0; const k = 1 - Math.exp(-TAU * fc / SR); return (x) => (y += k * (x - y)); }
function bandpass(fc, q) { // RBJ biquad; set() changes the frequency without losing state
  let b0, b2, a1, a2, x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  const f = (x) => { const y = b0 * x + b2 * x2 - a1 * y1 - a2 * y2; x2 = x1; x1 = x; y2 = y1; y1 = y; return y; };
  f.set = (fc) => { const w = TAU * Math.min(fc, SR * .45) / SR, al = Math.sin(w) / (2 * q), a0 = 1 + al; b0 = al / a0; b2 = -al / a0; a1 = -2 * Math.cos(w) / a0; a2 = (1 - al) / a0; };
  f.set(fc); return f;
}

// ---------- instruments ----------
function vibrate(t0, dur) {
  const lp = lowpass(900); let ph = 0;
  add(t0, dur, (t) => { ph += 168 / SR; const buzz = Math.tanh(Math.sin(TAU * ph) * 4) * (0.6 + 0.4 * Math.sin(TAU * 31 * t)); return lp(buzz + noise() * .15) * adsr(t, dur, .02, .05); }, { gain: .32 });
}
function ring(t0, dur, gain = .16, pan = 0, f1 = 1175, f2 = 1480, rev = .2, until) {
  // classic two-note trill (D6/F#6) at 15 Hz with a little harmonic
  add(t0, dur, (t) => { const f = Math.floor(t * 15) % 2 ? f2 : f1; return (Math.sin(TAU * f * t) + .25 * Math.sin(TAU * 2 * f * t)) * adsr(t, dur, .01, .04); }, { gain, pan, rev, until });
}
function heartbeat(t0, g = 1) {
  const lp = lowpass(180);
  add(t0, .5, (t) => {
    const a = Math.sin(TAU * (62 * t - 40 * t * t)) * env(t, .006, .07);
    const tb = t - .2, b = tb > 0 ? Math.sin(TAU * (54 * tb - 30 * tb * tb)) * env(tb, .006, .06) * .7 : 0;
    return lp((a + b) * 2.2);
  }, { gain: .7 * g });
}
function impact(t0, size = 1) {
  add(t0, 2.6, (t) => Math.sin(TAU * (38 * t + 70 * (1 - Math.exp(-t * 14)) / 14)) * env(t, .004, .45 * size), { gain: .9 * size, rev: .25 });
  const lp = lowpass(2200);
  add(t0, 1.4, (t) => lp(noise()) * env(t, .002, .12 * size), { gain: .55 * size, rev: .6 });
  add(t0, .08, (t) => noise() * env(t, .001, .012), { gain: .5 * size });
}
function glitch(t0, dur, g = .22) {
  let hold = 0, v = 0;
  add(t0, dur, (t) => { if (hold-- <= 0) { hold = 20 + Math.floor(rnd() * 160); v = noise(); } return (v + Math.sign(Math.sin(TAU * 220 * t)) * .3) * adsr(t, dur, .005, .02); }, { gain: g, pan: noise() * .5 });
}
function blip(t0, f0, f1, dur, g = .2, pan = 0) {
  add(t0, dur, (t) => Math.sin(TAU * (f0 * t + (f1 - f0) * t * t / (2 * dur))) * env(t, .004, dur / 3), { gain: g, pan, rev: .15 });
}
function click(t0, g = .25, fc = 3200) { const bp = bandpass(fc, 3); add(t0, .05, (t) => bp(noise()) * env(t, .0008, .008), { gain: g * 3 }); }
function bell(t0, f, g = .2, pan = 0, decay = 1.2, rev = .45) {
  add(t0, decay * 5, (t) => (Math.sin(TAU * f * t) + .35 * Math.sin(TAU * 2.76 * f * t) * Math.exp(-t * 4) + .2 * Math.sin(TAU * 5.4 * f * t) * Math.exp(-t * 9)) * env(t, .003, decay), { gain: g, pan, rev });
}
function pad(t0, dur, freqs, g = .08, a = 1, r = 1.2, bright = 1200) {
  freqs.forEach((f, k) => {
    const lp = lowpass(bright), det = [1, 1.004, .996];
    add(t0, dur, (t) => { let s = 0; det.forEach((d) => { const ph = (f * d * t + k * .13) % 1; s += (2 * ph - 1) * .35 + Math.sin(TAU * f * d * t); }); return lp(s) * adsr(t, dur, a, r) * (1 + .08 * Math.sin(TAU * .3 * t + k)); }, { gain: g / freqs.length, pan: (k / (freqs.length - 1 || 1) - .5) * .8, rev: .5 });
  });
}
function sweepNoise(t0, dur, f0, f1, g = .3, q = 2, pan = 0) {
  // filtered noise with a sliding center frequency (coefficients updated every 64 samples)
  let bp = bandpass(f0, q), n = 0;
  add(t0, dur, (t) => { if (n++ % 64 === 0) bp.set(f0 * Math.pow(f1 / f0, t / dur)); return bp(noise()) * Math.sin(Math.PI * clamp(t / dur, 0, 1)); }, { gain: g, pan, rev: .3 });
}


function finish(name = "soundtrack") {
// ---------- reverb (simple Schroeder) ----------
function reverb(inp, out, delays, ap) {
  const combs = delays.map((d) => ({ buf: new Float32Array(Math.floor(d * SR)), i: 0 }));
  const aps = ap.map((d) => ({ buf: new Float32Array(Math.floor(d * SR)), i: 0 }));
  let lpS = 0;
  for (let n = 0; n < N; n++) {
    let s = 0;
    for (const c of combs) { const y = c.buf[c.i]; lpS = y; c.buf[c.i] = inp[n] + y * .78; c.i = (c.i + 1) % c.buf.length; s += y; }
    s /= combs.length;
    for (const a of aps) { const y = a.buf[a.i]; const x = s + y * -.5; a.buf[a.i] = x; a.i = (a.i + 1) % a.buf.length; s = y + x * .5; }
    out[n] += s * .9;
  }
}
reverb(RL, L, [.0297, .0371, .0411, .0437, .0533], [.005, .0017]);
reverb(RR, R, [.0311, .0353, .0423, .0451, .0571], [.0051, .0019]);

// ---------- mix ----------
// final fade-out and soft limiter
for (let i = 0; i < N; i++) {
  const t = i / SR, fade = clamp((duration - t) / .6, 0, 1);
  L[i] = Math.tanh(L[i] * 1.1) * fade; R[i] = Math.tanh(R[i] * 1.1) * fade;
}
mkdirSync(OUT, { recursive: true });
const raw = join(OUT, `${name}-raw.wav`), wav = join(OUT, `${name}.wav`);
const buf = Buffer.alloc(44 + N * 4);
buf.write("RIFF", 0); buf.writeUInt32LE(36 + N * 4, 4); buf.write("WAVE", 8); buf.write("fmt ", 12);
buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22); buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34);
buf.write("data", 36); buf.writeUInt32LE(N * 4, 40);
for (let i = 0; i < N; i++) { buf.writeInt16LE(Math.round(clamp(L[i], -1, 1) * 32767), 44 + i * 4); buf.writeInt16LE(Math.round(clamp(R[i], -1, 1) * 32767), 46 + i * 4); }
writeFileSync(raw, buf);

// two-pass loudnorm (linear: keeps the dynamics)
const m = spawnSync(FFMPEG, ["-hide_banner", "-i", raw, "-af", "loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json", "-f", "null", "-"], { encoding: "utf8" });
const j = JSON.parse(m.stderr.slice(m.stderr.lastIndexOf("{"), m.stderr.lastIndexOf("}") + 1));
const af = `loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=${j.input_i}:measured_TP=${j.input_tp}:measured_LRA=${j.input_lra}:measured_thresh=${j.input_thresh}:offset=${j.target_offset}:linear=true`;
const r = spawnSync(FFMPEG, ["-y", "-loglevel", "error", "-i", raw, "-af", af, "-ar", "48000", "-c:a", "pcm_s16le", wav + ".tmp.wav"], { stdio: "inherit" });
if (r.status !== 0) throw new Error("loudnorm failed");
renameSync(wav + ".tmp.wav", wav);
console.log(`${name}.wav: ${duration}s, input ${j.input_i} LUFS / ${j.input_tp} dBTP -> -14 LUFS`);
return wav;
}

return { SR, N, TAU, L, R, rnd, noise, clamp, add, env, adsr, lowpass, bandpass,
  vibrate, ring, heartbeat, impact, glitch, blip, click, bell, pad, sweepNoise, finish };
}
