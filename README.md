# claude-skills

Skills for [Claude Code](https://claude.com/claude-code). Each folder is one skill: a `SKILL.md` plus whatever scripts it needs.

## Skills

- **ig-human** — strips the machine fingerprint out of a draft (em dashes, AI slop words, invisible watermark characters) and scores it against a five-check detection panel. Two Python scripts, no external dependencies.

- **html-video** — vertical videos (Reels, Stories, promos) made from HTML: Chrome renders each frame, ffmpeg encodes it, and the soundtrack is synthesized in code. Includes the renderer, a small offline synthesizer, a runnable example and a storyboard-to-render workflow with the rules that mattered (hook on frame one, pace, safe zones, loudness, privacy). Needs Node 18+, Chrome and ffmpeg.

## Install

Claude Code picks up any skill folder it finds in one of these places. No command needed.

Available in every project on the machine:

```bash
git clone https://github.com/hplive/claude-skills.git /tmp/claude-skills
mkdir -p ~/.claude/skills
cp -R /tmp/claude-skills/ig-human ~/.claude/skills/
cp -R /tmp/claude-skills/html-video ~/.claude/skills/   # then: cd ~/.claude/skills/html-video/engine && npm install
```

Only in one project (and committed with it, so Claude Code on the web sees it too):

```bash
cp -R /tmp/claude-skills/ig-human <your-repo>/.claude/skills/
```

Then type `/ig-human` in a session, or just ask for a text to be humanized.

The ig-human scripts need `python3`; html-video needs Node 18+, Google Chrome and ffmpeg.
