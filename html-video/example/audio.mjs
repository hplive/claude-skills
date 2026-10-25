// Soundtrack for the example scene, built with the offline synth (no samples, nothing to license).
// Writes $VIDEO_OUT/<name>.wav at -14 LUFS. render.mjs runs this for you.
import { createSynth } from "../engine/synth.mjs";
import "./timeline.js";

const T = globalThis.TL;
const S = createSynth(T.duration, { seed: 7 });
const { pad, impact, bell, click, sweepNoise, finish } = S;

pad(0, T.duration, [55, 82.4, 110], 0.16, 1.2, 1.5, 700);        // low drone under everything
sweepNoise(T.boom - 0.9, 0.9, 400, 5000, 0.25);                   // riser into the hit
impact(T.boom, 1.2);                                              // the hit when the headline slams
for (let t = T.count[0]; t < T.count[1]; t += 0.18) click(t, 0.1, 3200);   // ticks while the number counts
bell(T.end, 880, 0.18); bell(T.end + 0.12, 1320, 0.12);           // chime on the end card

finish(process.env.VIDEO_NAME || "example");
