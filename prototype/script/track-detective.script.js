// TRACK DETECTIVE (Sojourner's game): every line the game says out loud.
// Edit only the words between the last pair of quotes. Keep the ID (first) and the speaker (second) as they are.
// Inside the words use ’ for an apostrophe if you like; a straight double quote must be written \".
// After editing, reload the page. To see the whole script as a table: node tools/export_script.mjs (writes prototype/script/SCRIPT.md).
// Recordings: prototype/audio/<ID>.mp3 (see prototype/audio/README.md). IDs are never reused or renumbered.

// Speakers: key, the name on the caption, computer-voice settings.
SPEAKER("curiosity", "Curiosity", { pitch: 1.0, rate: 0.98 });
SPEAKER("sojourner", "Sojourner", { pitch: 1.6, rate: 1.08 });
SPEAKER("oppy",      "Oppy",      { pitch: 1.25, rate: 0.95 });

// open: Curiosity finds tiny tracks (Part 1)
SCRIPT("td.open.010", "curiosity", "Oh! Tiny tracks in the sand. They're not mine. Mine are big!");
SCRIPT("td.open.020", "curiosity", "Who made them? Let's follow them!");

// meet: Curiosity meets Sojourner
SCRIPT("td.meet.010", "curiosity", "Hello! Did you make these tracks?");
SCRIPT("td.meet.020", "sojourner", "Big wheels? Please. I explored Mars first!");
SCRIPT("td.meet.030", "sojourner", "I studied rocks, but my memory is bumpy. Help me drive again!");

// brief: the "Before you drive" card and the puzzle overview
SCRIPT("td.brief.010", "curiosity", "Find the grey sparkly rock. Here are your moves!");
SCRIPT("td.brief.020", "curiosity", "Four puzzles to solve. They get harder!");

// board: said as each puzzle starts (also shown on the puzzle card)
SCRIPT("td.board.010", "curiosity", "Find Barnacle Bill, the grey sparkly rock. Sojourner faces away from it, so back up with the down arrow key, then Explore!");
SCRIPT("td.board.020", "curiosity", "A rock is in the way. Drive around it, then back up to the grey rock and Explore.");
SCRIPT("td.board.030", "curiosity", "Next stop: Yogi, a big rock Sojourner really studied. A row of rocks blocks the way. Drive through an opening between them!");
SCRIPT("td.board.040", "curiosity", "Last one! A long, rocky drive to the grey rock.");

// drive: while the plan runs (GO)
SCRIPT("td.drive.010", "sojourner", "Give me some arrows first!");
SCRIPT("td.drive.020", "sojourner", "Oof! A rock. Let's go back and try again!");
SCRIPT("td.drive.030", "sojourner", "Oops! I bumped the rock I want to study. Back to the start, let's try again!");
SCRIPT("td.drive.040", "sojourner", "Whoa, that's the edge of the map! Let's try again.");
SCRIPT("td.drive.050", "sojourner", "Right where I need to be!");
SCRIPT("td.drive.060", "curiosity", "You did it! On to the next rock.");
SCRIPT("td.drive.070", "sojourner", "I remember driving to rocks like this!");

// fix: what went wrong with the plan, after the drive
SCRIPT("td.fix.010", "curiosity", "Which move hit the rock? Fix it, then GO.");
SCRIPT("td.fix.020", "curiosity", "Too far! Stop next to the rock. Fix the crossed move.");
SCRIPT("td.fix.030", "curiosity", "Which move went off the map? Fix it, then GO.");
SCRIPT("td.fix.040", "sojourner", "Not there yet. Park next to the grey rock, then Explore. Fix your plan, then GO.");
SCRIPT("td.fix.050", "sojourner", "My tool is on my BACK! Turn around. Fix your plan, then GO.");
SCRIPT("td.fix.060", "sojourner", "I'm parked at the rock! Add Explore so my tool can study it.");
SCRIPT("td.fix.070", "sojourner", "Just sand here! Explore next to the grey rock. Fix your plan, then GO.");
SCRIPT("td.fix.080", "sojourner", "I was there, then drove away! Explore when you get there. Fix your plan, then GO.");

// hint: the Hint button (td.hint.060 is said just before td.hint.070 or td.hint.080 when the game offers help by itself)
SCRIPT("td.hint.010", "curiosity", "Sojourner only needs the moves up to Explore. I took off the extra ones!");
SCRIPT("td.hint.020", "curiosity", "This plan already gets there. Press GO!");
SCRIPT("td.hint.030", "curiosity", "Sojourner's back is on the rock. Try Explore next!");
SCRIPT("td.hint.040", "curiosity", "Try turning Sojourner right next.");
SCRIPT("td.hint.050", "curiosity", "Try turning Sojourner left next.");
SCRIPT("td.hint.060", "curiosity", "Need a little help?");
SCRIPT("td.hint.070", "curiosity", "Try backing up to the square with the arrow.");
SCRIPT("td.hint.080", "curiosity", "Try driving forward to the square with the arrow.");
SCRIPT("td.hint.090", "curiosity", "I fixed the plan up to here. Your turn!");

// check: Part 3, "Why did Sojourner drive to the rock?" (a wrong answer's reason is followed by td.check.040)
SCRIPT("td.check.010", "sojourner", "Why did I drive all the way to that rock?");
SCRIPT("td.check.020", "sojourner", "I was not in a hurry. I'm very, very slow!");
SCRIPT("td.check.030", "sojourner", "Hide? I wanted everyone to see what I found!");
SCRIPT("td.check.040", "sojourner", "Try another!");
SCRIPT("td.check.050", "sojourner", "My tool touched the rock and found out what it's made of!");
SCRIPT("td.check.060", "curiosity", "So that's why you drove to rocks!");

// story: Sojourner reads Person 1's story "sojourner" (storytimes/stories.js), one recording per part: story.sojourner.1 to .6
STORY("sojourner", "sojourner", "parts");

// gift: the gift box (td.gift.020 is also the line on the gift box)
SCRIPT("td.gift.010", "curiosity", "You earned this!");
SCRIPT("td.gift.020", "curiosity", "Oppy rolled on six aluminium wheels with cleats for grip.");

// bench: fitting the wheels on Oppy
SCRIPT("td.bench.010", "curiosity", "Fit the wheels! Press Space.");
SCRIPT("td.bench.020", "oppy",      "Oh! I remember going somewhere.");

// test: Oppy's test drive
SCRIPT("td.test.010", "curiosity", "Test them! Press → to drive Oppy.");
SCRIPT("td.test.020", "oppy",      "I can move again! Thank you, Sojourner!");
SCRIPT("td.test.030", "sojourner", "Told you. Wheels are everything.");
SCRIPT("td.test.040", "curiosity", "One part fixed! More Mars equipment is waiting to help.");

// end: mission complete
SCRIPT("td.end.010", "curiosity", "Mission complete! Oppy has its wheels back.");
