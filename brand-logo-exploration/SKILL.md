---
name: brand-logo-exploration
description: Explore, test and apply a logo for an app or product. Several genuinely different concepts, a small-size test sheet, an honest similarity check, then application to the app icon, launch screen and watch complications. Use when someone says the logo is basic or generic, asks for a new icon or brand mark, or wants "a drawing" instead of a letter.
---

# Logo exploration

Lesson that shaped this method: a plain red dot felt generic, then a geometric letter felt generic too. What worked was **showing several different kinds of mark** (letter, object, line drawing, mascot), letting the user pick the kind, and only then refining. An object illustration with one meaningful accent beat everything else.

## 1. Brief before drawing

Write a short brief with:
- what the product does in two lines, and the **one idea** the mark should own;
- the visual direction already decided (palette, one typeface family, **one accent colour**) and what the user rejects (typical AI-look: gradients, glow, 3D, shadows, glowing rings, mint+coral pairs, italic serif accents);
- where the mark must live: 1024 px app icon, watch icon (circular), one-colour complication, 16 and 32 px favicon, lockup with the name;
- the output folder, and that apps and website are **not touched** during exploration.

If the request is vague ("a drawing"), ask which **kind** (object illustration, hand-drawn line, mascot, letter) before spending a round.

## 2. Concepts (4 to 6, even if not all are good)

- Genuinely different ideas, not variations of one. Look for the **least obvious object** tied to the core idea (a microphone already exists in thousands of apps).
- Each as a **clean SVG**: geometric, few nodes, no filters.
- Accent colour only on the point that carries the meaning.
- Keep one letter concept as a comparison.

## 3. Small-size test sheet (do not skip)

One contact sheet with each concept at: 1024; iOS icon at 120/60/40/29 (dark and light); favicon 32/16; round watch icon 120/48; one colour; black on white; red. Look at the images and critique honestly. Drop any concept that:
- disappears under 60 px;
- reads as something else (an ear reads as a question mark, a document with a badge reads as a PDF);
- has the silhouette of a known pictogram (check icon libraries such as Material Symbols and SF Symbols).

Ten-second test: can it be drawn from memory?

## 4. Similarity check (mandatory)

For the two finalists, search the web for similar marks in the same category **and** in categories where the drawing is common. Rules:
- count only what you actually opened and saw; everything else is marked **[NOT VERIFIED]**;
- never write "nothing like it exists"; write what you searched and what you saw;
- state the reading risk (could it be mistaken for another kind of app?).

Before the mark goes public: a **trademark search by figure** (EUIPO, national office, USPTO) and a "what app is this?" test with about five people.

## 5. Deliverables (`brand/logo-exploration/`)

`concepts/NN-name.svg`, `contact-sheet.png`, `recommended/` (mark, one-colour mark using `currentColor`, detail-free version for 32 px and below, opaque 1024 app icon, opaque 1024 watch icon, favicon, lockup), and a `README.md`: concepts, what was dropped and why, similarity check, recommendation.

## 6. Technical notes

- **Xcode asset catalogs import SVG with masks badly.** Redraw the mark in CoreGraphics with the same geometry and export a transparent PNG; see `render_mark.swift` (a neutral template: edit the shapes). Use `blendMode .clear` for cut-outs.
- App icon: **opaque** 1024 PNG (no alpha); iOS rounds the corners. Watch icon: scale the mark to about 84 percent so it fits the circular mask.
- Under 32 px use a version **without the fine detail**.
- Launch screen: use the **same image, position and size** in the system launch screen (`UILaunchScreen` / `UIImageName`) and in the SwiftUI splash, so there is no jump; the name fades in afterwards.
- Watch complication: a one-colour image with `template-rendering-intent: template` and `.widgetAccentable()`, so the watch tints it for the face.
- An SVG lockup opened as an image does not load web fonts: use it inline on a page that loads the font, or convert the text to outlines for standalone files.
- A browser may block a page (anti-bot) or the user may decline a permission: record it as not verified, do not work around it.

## 7. Apply only after approval

App icons, launch screen and complication first (build, test, install). The **website only after** the figure trademark search and the reading test, because it is public. Record the decision in the project's `CLAUDE.md`.
