// One source of truth for timing. The scene (scene.html) and the soundtrack (audio.mjs) both read it,
// so changing a number here moves the picture and the sound together. Seconds.
globalThis.TL = {
  duration: 8,
  fps: 30,
  width: 1080, height: 1920,
  // scene 1: hook, readable on the very first frame
  hook: 0.0,
  boom: 2.5,            // impact: the headline slams in
  // scene 2: the number counts up
  count: [3.2, 5.0],
  // scene 3: end card (hold it still for the last ~2 s)
  end: 5.6,
  // key moments for --stills and the contact sheet
  stills: [0, 1.2, 2.6, 4.0, 5.2, 6.5, 7.9],
  sheet: [0.1, 1.5, 2.8, 4.2, 6.2, 7.9],
};
