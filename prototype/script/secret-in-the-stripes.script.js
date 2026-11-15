// THE SECRET IN THE STRIPES (Chute the parachute's game): every line the game says out loud.
// Edit only the words between the last pair of quotes. Keep the ID (first) and the speaker (second) as they are.
// Inside the words use ’ for an apostrophe if you like; a straight double quote must be written \".
// {made}, {letter} and similar are filled in by the game: keep them exactly as they are.
// After editing, reload the page. To see the whole script as a table: node tools/export_script.mjs (writes prototype/script/SCRIPT.md).
// Recordings: prototype/audio/<ID>.mp3 (see prototype/audio/README.md). IDs are never reused or renumbered.

// Speakers: key, the name on the caption, computer-voice settings.
SPEAKER("chute",        "Chute",        { pitch: 1.35, rate: 1.05 });
SPEAKER("curiosity",    "Curiosity",    { pitch: 1.0, rate: 0.98 });
SPEAKER("oppy",         "Oppy",         { pitch: 1.25, rate: 0.95 });
SPEAKER("perseverance", "Perseverance", { pitch: 1.15, rate: 1.05 });

// land: the landing scene (the parachute opens above Mars), then the camera looks up at the stripes
SCRIPT("pc.land.010", "chute",        "February 18, 2021. Perseverance is rushing toward Mars. Here's my cue!");
SCRIPT("pc.land.020", "chute",        "Ta-da! I open, the air pulls on me, and the fall slows right down.");
SCRIPT("pc.land.030", "perseverance", "Thanks, Chute! I'm in the backshell, safe and sound.");
SCRIPT("pc.land.040", "chute",        "A camera on the backshell looked up and took my picture. See my stripes?");
SCRIPT("pc.land.050", "chute",        "They spell a secret message. But wait, I forgot some of them!");

// meet: Curiosity meets Chute
SCRIPT("pc.meet.010", "curiosity", "A parachute! And it's smiling.");
SCRIPT("pc.meet.020", "chute",     "I'm Chute! I slowed Perseverance down on landing day.");
SCRIPT("pc.meet.030", "chute",     "Engineers sewed a message into my stripes. Some stripes are blank now.");
SCRIPT("pc.meet.040", "curiosity", "Let's sew them back. First, the code!");

// brief: the "Before you sew" card and the puzzle overview
SCRIPT("pc.brief.010", "curiosity", "Before we start: how to fix a letter!");
SCRIPT("pc.brief.020", "curiosity", "Four puzzles to solve. They get harder!");

// board: said as each puzzle starts, the intro and then its clue (the clue is also shown on the puzzle card, with ___ for the blank)
SCRIPT("pc.board.010", "chute", "My first word has a blank letter. Can you guess the word?");
SCRIPT("pc.board.020", "chute", "Clue: Brave enough to try? I blank you!");
SCRIPT("pc.board.030", "chute", "My next word has two blank letters.");
SCRIPT("pc.board.040", "chute", "Clue: Toys, rocks and rovers are all blank.");
SCRIPT("pc.board.050", "chute", "Two blanks again, with three stripes each!");
SCRIPT("pc.board.060", "chute", "Clue: Very, very strong. Like a blank rocket!");
SCRIPT("pc.board.070", "chute", "Now my whole secret message, with one blank in every word.");
SCRIPT("pc.board.080", "chute", "Clue: All three words together. You know them now!");

// tap: too many stripes tapped

// open: the OPEN button is pressed
SCRIPT("pc.open.010", "chute", "Here I go!");

// solve: a puzzle is solved: Curiosity reads out the word, then Chute cheers
SCRIPT("pc.solve.010", "curiosity", "D, A, R, E. DARE!");
SCRIPT("pc.solve.020", "curiosity", "T, H, I, N, G, S. THINGS!");
SCRIPT("pc.solve.030", "curiosity", "M, I, G, H, T, Y. MIGHTY!");
SCRIPT("pc.solve.040", "curiosity", "Dare. Mighty. Things!");
SCRIPT("pc.solve.050", "chute",     "You read my stripes!");
SCRIPT("pc.solve.060", "chute",     "Dare mighty things. I remember it all now!");

// fail: OPEN was pressed and the camera did not read the right letter ({made} = the word the stripes made)
SCRIPT("pc.fail.010", "curiosity", "One letter is still all white. Guess the word, then copy that letter's stripes!");
SCRIPT("pc.fail.020", "curiosity", "{made} is a word, but it's not the one on my parachute. Try another letter!");
SCRIPT("pc.fail.030", "curiosity", "{made}? That's not a word. Try another letter!");
SCRIPT("pc.fail.040", "curiosity", "Those stripes aren't a letter at all. Check the key!");

// hint: the Hint button ({letter} = the letter to copy from the key; pc.hint.030 starts a hint the game gives by itself)
SCRIPT("pc.hint.010", "curiosity", "The right stripes were there. I took off the extra taps!");
SCRIPT("pc.hint.020", "curiosity", "All copied! Press OPEN.");
SCRIPT("pc.hint.030", "curiosity", "Need a little help?");
SCRIPT("pc.hint.040", "curiosity", "Look at {letter} on the key. This stripe should be white.");
SCRIPT("pc.hint.050", "curiosity", "Look at {letter} on the key. Try this stripe.");
SCRIPT("pc.hint.060", "curiosity", "I copied {letter} for you. Your turn!");

// check: "Why stripes?" quiz (a wrong answer's reason is followed by pc.check.040)
SCRIPT("pc.check.010", "chute",     "Quick quiz! What was my real job on landing day?");
SCRIPT("pc.check.020", "chute",     "Steer? I can't steer. Rockets did the last part of the landing.");
SCRIPT("pc.check.030", "chute",     "Dig? I'm made of cloth!");
SCRIPT("pc.check.040", "chute",     "Try another one!");
SCRIPT("pc.check.050", "chute",     "Yes! The air pulled on me and slowed Perseverance down.");
SCRIPT("pc.check.060", "chute",     "My stripes also helped engineers check that I opened properly.");
SCRIPT("pc.check.070", "curiosity", "And they carried a secret message!");

// story: Chute reads Person 1's story "parachute" (storytimes/stories.js): parts 1, 4 and 6 of the six story pages are story.parachute.1 to .3
STORY("parachute", "chute", "parts");
// story pages 2, 3 and 5 (drafts with NASA sources, for Person 1 to review)
SCRIPT("pc.story.010", "chute", "My best trick? I opened in less than a second. My canopy is 21.5 meters across, the largest ever sent to Mars. I slowed Perseverance from about 1,512 to about 320 kilometers per hour. A spacecraft high above even took my picture! Its HiRISE camera was about 700 kilometers away.");
SCRIPT("pc.story.020", "chute", "Before Mars, engineers tested a parachute like me on a rocket launched from Earth. In 2018, one opened in four tenths of a second. It held a pull of 67,000 pounds, the highest ever survived by a supersonic parachute. That broke a record! That test was on September 7, 2018, the third and final test flight.");
SCRIPT("pc.story.030", "chute", "Even after I opened, we were still falling at about 320 kilometers per hour. So at 2.1 kilometers up, Perseverance let go of me and my backshell. Then a sky crane lowered Perseverance gently toward the ground. Its wheels touched the ground at only 2.6 kilometers per hour.");

// gift: the gift box (pc.gift.020 is also the line on the gift box)
SCRIPT("pc.gift.010", "chute", "You earned this!");
SCRIPT("pc.gift.020", "chute", "Oppy's camera eyes sat on a mast about 1.5 m above the ground.");

// bench: fitting the camera mast on Oppy
SCRIPT("pc.bench.010", "curiosity", "Oppy has no eyes yet. Let's fit the camera mast!");
SCRIPT("pc.bench.020", "oppy",      "I can see! Look at all of Mars!");
SCRIPT("pc.bench.030", "curiosity", "One part fixed! More Mars equipment is waiting to help.");

// end: mission complete
SCRIPT("pc.end.010", "curiosity", "Mission complete! Oppy has a camera mast.");
