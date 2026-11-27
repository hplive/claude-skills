# Segment prompt (fill the <…> parts, one subagent per segment)

You are running one segment of a "crowd simulation" that stress-tests an idea: invented people react to it on fake social networks, then we harvest who liked it, who hated it and why. You only write text files; do not touch any project or git repo.

Read the idea brief: <ABSOLUTE PATH TO brief.md>

SEGMENT: **<segment name and one-line description>**

Steps:
1. Invent <8–12> personas for this segment. Make them genuinely varied, not nice people agreeing: <persona hints — ages, places, roles, current tools, money attitudes, a hostile one, a loyal user of competitor X…>. Each: name, age, place, job/role, habit relevant to the idea, tools they use now, money attitude, one personal quirk or past experience that shapes their view. Give each a hidden starting bias (enthusiast / neutral / skeptic / hostile), roughly 3/3/3/1. Do not make everyone come around.
2. **Network A (<long thread: Reddit / forum / LinkedIn>):** a neutral user posts the brief. Each persona writes a top-level comment in their own voice and language register (short or long, typos allowed). Then 2 rounds of replies where personas argue with, agree with, or mock each other. A persona changes mind only if a reply genuinely persuades them; say so explicitly and say what did it.
3. **Network B (<short posts: X/Threads / WhatsApp group behind closed doors>):** each persona writes 1 short post or message about the idea as if they had just seen it. Include at least one viral-style negative take and one genuine fan.
4. Stay honest and realistic, not marketing. Raise what real people would raise: <likely objections: price, "this already exists", privacy, trust in a small maker, switching cost…>. Also notice what they would actually love.

Write the full simulation (personas + both networks) in <language> to:
<ABSOLUTE OUTPUT PATH>/seg-<id>.md

Then reply with ONLY a compact summary in <user's language> (max ~400 words):
- per persona one line: name, age/role, one-line profile, final stance (−2 to +2), the reason in their words (short quote)<, and the price they would accept if they mentioned one>;
- top 3 objections (with how many personas raised each);
- top 3 things they loved (or buying signals);
- up to 3 surprising angles the maker probably has not thought of;
- who changed their mind and what convinced them.
