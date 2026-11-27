---
name: idea-crowd-sim
description: Stress-test a product, feature, pricing or campaign idea with a simulated crowd. Invents dozens of varied personas, lets them argue about the idea on two fake social networks (a long forum thread and short posts), then reports who liked it, who hated it, why, and the angles nobody had thought of. You can then "talk" to any persona. A light, no-extra-cost take on the MiroFish / OASIS method, run with subagents. Use when someone asks "will this idea work?", "what would people say about X?", "simulate users/customers reacting", "test my pricing", "MiroFish", or wants objections before a launch, pitch or meeting.
---

# Idea crowd simulation

What this is for: **finding angles, not deciding.** Every persona is the same model doing many voices. Change the model, the wording of the brief or the persona mix and the verdict can flip. Say this in the report every time, and never present the result as market research or a prediction.

Inspired by MiroFish (github.com/666ghj/MiroFish, built on CAMEL-AI's OASIS). That engine runs thousands of agents with memory on simulated Twitter and Reddit; it is free software but needs a paid LLM API and a memory service. This skill keeps the useful part (varied people, real disagreement, two networks, a harvest at the end) at the scale of a few subagents.

## 1. Brief (5 minutes, before any agent runs)

Write `brief.md` in a scratch folder. Keep it to what an outsider would see:
- the idea in two lines, who makes it (solo founder? big company? that changes trust);
- what is free, what is paid and the **real prices**;
- the alternatives people already use (named competitors, "doing nothing", spreadsheets);
- what is still undecided (so personas can push on it).

Pull facts from the project's own docs when they exist. Do not oversell in the brief: marketing language makes the crowd friendlier than real people.

Ask the user only if the price or the target market is unknown. Otherwise go.

## 2. Segments (3 by default, up to 5)

Split the crowd by **who would pay or decide differently**, not by demographics alone. Typical split:
- core users in the home market;
- users in a second market / foreigners / power users of a competitor;
- the other side of the business (buyers, partners, regulators, people the product affects).

Each segment gets **8 to 12 personas** with a hidden starting bias of roughly 3 enthusiast / 3 neutral / 3 skeptic / 1 hostile. Insist on variety: age, place, money attitude, current tools, one past experience that shapes their view (got burned by an app that died, lost data, got lost on a mountain). The hostile one is important: it surfaces the viral negative take.

## 3. Run the segments in parallel

One subagent per segment, launched in the **same message** so they run at once, in the background. Use `templates/segment-prompt.md`: fill in the segment, the persona hints, the networks and the output path.

- Prefer a **different, cheaper model** for the personas than the one writing the report (for example Sonnet for personas, the main model for the synthesis). It is cheaper and it reduces the "one mind agreeing with itself" effect.
- Each agent writes the **full simulation to a file** and returns only a compact summary. This keeps the main context small.
- Two networks per segment, matched to the audience:
  - **long thread** (Reddit, a forum, LinkedIn comments): top-level comment from each persona, then 2 rounds of replies where they argue;
  - **short posts** (X/Threads, a WhatsApp group behind closed doors): one line each, at least one viral negative take and one genuine fan.
- Mind changes only when a reply genuinely persuades, and the agent must say what persuaded them. That line is often the most useful output (it is the argument the product should lead with).

## 4. Report

Read the summaries (open the full files only to quote). Write the report from `templates/report.md`, in the user's language:
1. **Verdict in one line**, plus the caveat (one model, many voices).
2. Scoreboard: personas per stance (−2 to +2) per segment.
3. Top objections across segments, with counts, merged when they are the same thing said differently.
4. What people loved (the hooks).
5. **Angles nobody had thought of**: the reason to run this. Be strict: only list things the founder's docs do not already address.
6. Arguments that changed minds: use them in the landing page, pitch or store text.
7. What to do next: 3 concrete, cheap checks with real people (a question to ask 5 real users, a fake-door test, a call with one buyer).

Save the report and the raw simulation files where the user keeps product docs (e.g. `docs/product/crowd-sim-YYYY-MM-DD.md` plus a folder for the raw files), and tell them in a few bullets. Long reports lose people: lead with the verdict and the surprises.

## 5. Talk to a persona (optional)

When the user wants to question someone ("pergunta à Rosa porque é que não pagava"), spawn a small agent with that persona's card and their posts from the raw file, and ask it to stay in character and answer briefly. Or continue the segment agent with SendMessage if it is still addressable. Tell the user again that it is a simulated voice.

## Rules that mattered

- Real prices and real competitors in the brief, or the crowd invents its own.
- Do not let the crowd converge: if almost everyone ends positive, the run is too friendly. Rerun the segment with a harsher mix or tell the user the result is suspect.
- Personas speak in their own language and register (typos, slang, short replies). Polished paragraphs from everyone mean the voices are not distinct.
- Never put the user's private data (emails, revenue, customer names) into the brief. Anything in it can end up in files the user shares.
- Cost: 3 segments × ~10 personas is a few subagent runs. Do not scale to "thousands" to imitate MiroFish; more voices from one model mostly add repetition, not insight.
