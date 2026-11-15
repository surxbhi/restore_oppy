# Emotion tags brief (read fully)

Repo: /Users/surabhimalani/Documents/nasa/restore_oppy. Kids' pixel-art game "Restore Oppy" (ages 6 to 12): Curiosity visits five machines NASA left on Mars, plays a mini-game at each, and earns parts to wake the sleeping rover Opportunity ("Oppy"). Every spoken line is recorded with ElevenLabs. The owner wants the voices more exciting and matched to the emotion of each moment: "regenerate the other audio with emotion tags so it's more exciting, match the emotions of the story".

Your job: for EVERY recordable spoken line of ONE page (named in your prompt), choose ElevenLabs v3 audio tags that fit that exact moment, and write them to a JSON file. You do not generate audio and you do not change any words.

## Where the lines are
- The page's script file `prototype/script/<page>.script.js`: one `SCRIPT("<id>", "<speaker>", "<text>")` per line. Read the `// scene:` comments and the IDs (`<prefix>.<scene>.<number>`).
- How and when each line is used: search the page's template `prototype/<page>.template.html` for the ID (`LINE("<id>")` or `TEXT("<id>")`). Read a few lines around it to understand the moment: the opening, a hint, a wrong try, a solved puzzle, story time, the gift box, the ending.
- If the script file has a `STORY("<storyId>", "<speaker>", "parts"|"sentences")` line, that page also reads Person 1's story `storytimes/stories.js` (the object `window.restoreOppyStories["<storyId>"].lines`). Its line IDs are `story.<storyId>.<n>` for "parts" (n = 1 for the first line), or `story.<storyId>.<n>.<k>` for "sentences" (k = the k-th sentence of line n, split at . ! ? followed by a space). Tag those too.
- Skip lines whose text contains a `{placeholder}`. Skip Oppy's lines with these IDs, which are already done: `td.bench.020`, `td.test.020`, `phx.fit.020`, `pc.bench.020`, `ins.bench.020`, `ing.bench.020`, `shell.meet.010`, `shell.wake.020`, `shell.wake.040`.

## The characters
Curiosity (the guide: warm, curious, encouraging, a big-sister voice), Oppy (Opportunity: gentle, wise; after waking, warm and proud), Sojourner (small, quick, cheerful, proud to be first), Scoop (Phoenix's digging arm: busy, a careful detective), SEIS and InSight (quiet, thoughtful listeners), Chute (Perseverance's parachute: bright, playful, loves its secret code), Perseverance (the rover: confident, friendly), Ingenuity (the little helicopter: light, zippy, excited), Phoenix (the lander, in the finale).

## How to tag
- 1 or 2 tags per line, at the START, in square brackets, each a short plain description, e.g. `[excited]`, `[curious]`, `[surprised]`, `[gentle]`, `[encouraging]`, `[proud]`, `[warmly]`, `[amazed]`, `[thoughtful]`, `[playful]`, `[whispering]`, `[cheerful]`, `[impressed]`, `[determined]`, `[laughs]`, `[sighs]`, `[gasps]`, `[giggles]`. Sound tags like `[laughs]` or `[gasps]` only where that sound really fits, at most once in a while.
- Match the moment: discoveries and "Wow!" lines excited or amazed; hints and wrong tries gentle and encouraging (never disappointed or mocking); a solved puzzle proud and happy; facts in NASA stories warm, clear and interested (not shouting; stories should stay easy to follow); sad moments (Oppy's last message, the end of a mission) soft and tender; goodbyes warm.
- Keep variety: do not put `[excited]` on everything. Calm instructions ("Use the arrow buttons…") get at most a light `[friendly]` or `[encouraging]`.
- Never put tags in the middle of a line, never change, add or remove words, never add tags that make the voice read something aloud.

## Output
Write `tools/tags/<page>.json`: `{ "<line id>": "[tag] [tag]", ... }` for every recordable line of the page (script lines and story lines), in script order. Check it parses (`node -e 'JSON.parse(require("fs").readFileSync(process.argv[1]))' tools/tags/<page>.json`) and that every key is a real line ID from the script file or the story. Do not edit any other file. Do not run git.

Reply in at most 8 lines: how many lines tagged, how many skipped and why, the tag mix (counts of the most used tags), and three example lines with their tags from different moments.
