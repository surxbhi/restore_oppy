# Voice recordings for Restore Oppy

This folder holds the real voices. Every line the game says has an ID (like `td.open.010`). Put a recording here
named after the ID, and the game plays it instead of the computer voice, line by line, as soon as it is listed.
Lines with no recording yet keep the computer voice, so you can add recordings a few at a time.

## Where the words are

- The full script, as tables by game and scene, with the file name each line expects:
  `prototype/script/SCRIPT.md` (and `prototype/script/script.csv` for a spreadsheet). Make it fresh with
  `node tools/export_script.mjs`.
- To change the words of a line: edit the page's script file, `prototype/script/<page>.script.js`. Each line looks like
  `SCRIPT("td.open.020", "curiosity", "Who made them? Let's follow them!");` Change only the words in the last quotes.
  Keep the ID and the speaker. Then reload the game page.
- Story-time lines (IDs that start with `story.`) belong to Person 1: their words are in `storytimes/stories.js`.
  Record them like the others; ask Person 1 before changing their words.
- If the words of a line change after you recorded it (you, the script writer, or Person 1 for a story line), the
  recording is **OUT OF DATE**: `node tools/export_script.mjs` says so, and SCRIPT.md shows "OUT OF DATE" in the
  *Recorded* column with the words now and the words recorded. Record it again under the same file name and run the two
  commands below (or change the words back). The game itself still plays the old file until you do.

## File names

- One file per ID: `<ID>.<extension>`, e.g. `td.open.010.mp3`, `story.sojourner.3.mp3`, `story.phoenix.2.1.m4a`.
- `.mp3` is best (plays everywhere). `.m4a` is fine too. `.wav` works but is big. `.ogg` does not play on iPhone/Safari.
- One file for each ID; no spaces or extra words in the name. Two files for one ID: the `.mp3` wins.

## Recording

- Mono, 44.1 kHz. For mp3, 96 to 128 kbps is plenty.
- Trim the silence at the start and the end (leave at most about 0.1 s): the caption's words run over the length of the
  file, so long silences make them run ahead of or behind the voice.
- Even loudness across all files: aim for about -16 LUFS (peaks below -1 dB). Most editors have a "normalize" or
  "loudness" step; use the same setting for every file.
- Say exactly the words in the script (the captions show the script's words).
- `{name}` in a line means the game fills in a word there (it changes). Those lines stay with the computer voice unless
  the script marks them *(static)*; skip them.
- A line can be cut into two caption steps by the game when it is long; that is handled for you (one file per ID).

## After adding, renaming or removing files

From the top folder of the project:

```
node tools/build_audio_manifest.mjs     # lists the recordings for the game, and remembers the words each one says
node tools/export_script.mjs            # updates SCRIPT.md: the "Recorded" column (yes / no / OUT OF DATE), checks for mistakes
```

Run `build_audio_manifest` right after dropping new files in: it notes each line's words at that moment (and the
file's date), and keeps that note until the file is replaced by a newer one. That note is how OUT OF DATE is found.
Do not edit `manifest.js` by hand.

Then reload the game. If a file is missing or will not play, the game uses the computer voice for that line and says
so in the browser console. The Voice button (or the V key) turns both kinds of voice off and on; `?mute=1` in the
address starts with the voice off.
