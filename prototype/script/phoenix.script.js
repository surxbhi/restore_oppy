// PHOENIX, "The Clue That Vanished" (Phoenix's arm and Curiosity): every line the game says out loud.
// Edit only the words between the last pair of quotes. Keep the ID (first) and the speaker (second) as they are.
// Inside the words use ’ for an apostrophe if you like; a straight double quote must be written \".
// After editing, reload the page. To see the whole script as a table: node tools/export_script.mjs (writes prototype/script/SCRIPT.md).
// Recordings: prototype/audio/<ID>.mp3 (see prototype/audio/README.md). IDs are never reused or renumbered.

// Speakers: key, the name on the caption, computer-voice settings.
SPEAKER("scoop",     "Phoenix's arm", { pitch: 1.35, rate: 1.04 });
SPEAKER("curiosity", "Curiosity",     { pitch: 1.0, rate: 0.98 });
SPEAKER("oppy",      "Oppy",          { pitch: 1.25, rate: 0.95 });

// open: Curiosity drives north and finds Phoenix (the lines of one scene are packed into caption steps by the game)
SCRIPT("phx.open.010", "curiosity", "Brrr! The far north of Mars.");
SCRIPT("phx.open.020", "curiosity", "A parachute on the ground! Something landed near here.");
SCRIPT("phx.open.030", "curiosity", "And a heat shield! It kept a lander safe on the way down. Let's keep going!");
SCRIPT("phx.open.040", "curiosity", "There it is! Phoenix!");
SCRIPT("phx.open.050", "scoop", "A missing clue! On a planet with no witnesses. Except my camera.");
SCRIPT("phx.open.060", "scoop", "A sol is one day on Mars. It is about 40 minutes longer than a day on Earth.");   // for Person 1 to confirm the kid-friendly wording (NASA: a Mars solar day is 24 h 39 min 35 s)
SCRIPT("phx.open.070", "curiosity", "What went missing?");
SCRIPT("phx.open.080", "scoop", "I dug a trench. Bright chunks were in it. Days later, some were GONE!");
SCRIPT("phx.open.090", "scoop", "Help me dig again. Then we'll compare the pictures and find out why.");

// brief: the "Before you dig" card and the cases overview
SCRIPT("phx.brief.010", "scoop", "Here's how I dig. Blade for soil, rasp for hard ice.");
SCRIPT("phx.brief.020", "curiosity", "Four cases to solve. Each one is a bit harder.");

// case: said when a case starts (the intros of cases 2 to 4 are also shown on the case card; case 1's card text is only shown, see phoenix-cases.json)
SCRIPT("phx.case.010", "curiosity", "Move the scoop with the arrows. Press DIG to dig!");
SCRIPT("phx.case.020", "curiosity", "Some ground is HARD. Switch to the rasp!");
SCRIPT("phx.case.030", "curiosity", "Dig around the rock!");
SCRIPT("phx.case.040", "curiosity", "The biggest dig! Deep soil, hard ice, and lots to compare.");

// dig: feedback while digging
SCRIPT("phx.dig.010", "scoop", "My arm only reaches the trench!");
SCRIPT("phx.dig.020", "scoop", "That's a rock. I'll dig around it.");
SCRIPT("phx.dig.030", "scoop", "Rasp out! That's for hard ice.");
SCRIPT("phx.dig.040", "scoop", "Blade ready! That's for soil.");
SCRIPT("phx.dig.050", "scoop", "The rasp is for hard ice. Switch to the blade for soil!");
SCRIPT("phx.dig.060", "curiosity", "Something hard underneath. Try digging again!");
SCRIPT("phx.dig.070", "curiosity", "Clunk! Hard ice. Switch to the rasp on the back of the scoop!");
SCRIPT("phx.dig.080", "scoop", "Clunk! Rasp, please!");
SCRIPT("phx.dig.090", "scoop", "This square is done. Move to another one!");
SCRIPT("phx.dig.100", "scoop", "Ooh! Something bright down here!");

// hint: the Hint buttons (dig screen 010 to 040, find screen 050 and 060)
SCRIPT("phx.hint.010", "curiosity", "Switch to the blade (R), then dig.");
SCRIPT("phx.hint.020", "curiosity", "Hard ice! Switch to the rasp (R).");
SCRIPT("phx.hint.030", "curiosity", "Press DIG (Space) right here.");
SCRIPT("phx.hint.040", "curiosity", "Dig the square with the yellow box. Move there with the arrows.");
SCRIPT("phx.hint.050", "curiosity", "Look inside the yellow circle. What's different?");
SCRIPT("phx.hint.060", "curiosity", "Watch that spot… Was something there before?");

// wait: all squares dug, the camera takes the pictures
SCRIPT("phx.wait.010", "scoop", "All dug! The camera takes the EARLIER picture. Sol 20.");
SCRIPT("phx.wait.020", "curiosity", "Now we wait. Four sols!");
SCRIPT("phx.wait.030", "scoop", "Click! The LATER picture. Sol 24.");

// find: tapping what vanished (right answers 030 to 060: the game picks one by how many are found; 030 and 060 are the same words, said by different speakers)
SCRIPT("phx.find.010", "curiosity", "Compare the pictures. Tap whatever VANISHED!");
SCRIPT("phx.find.020", "curiosity", "One picture this time. Press Switch picture to flip between Earlier and Later. Tap whatever VANISHED!");
SCRIPT("phx.find.030", "scoop", "Gone! That's our clue.");
SCRIPT("phx.find.040", "curiosity", "Vanished! Good eyes.");
SCRIPT("phx.find.050", "scoop", "Yes! It was there on Sol 20. Gone by Sol 24!");
SCRIPT("phx.find.060", "curiosity", "Gone! That's our clue.");
SCRIPT("phx.find.070", "curiosity", "That chunk is still there. What disappeared?");
SCRIPT("phx.find.080", "curiosity", "That part stayed the same. What disappeared?");
SCRIPT("phx.find.090", "curiosity", "Shadows move when the Sun moves. Look for something that's gone.");
SCRIPT("phx.find.100", "curiosity", "That's new, not gone! It's the soil I dug.");
SCRIPT("phx.find.110", "curiosity", "That stayed the same. Look for something that's gone.");
SCRIPT("phx.find.120", "curiosity", "That rock stayed the same. Look for something that's gone.");
SCRIPT("phx.find.130", "curiosity", "Nothing changed there. Tap something that's gone.");
SCRIPT("phx.find.140", "curiosity", "Already found that one!");

// solved: a case is solved
SCRIPT("phx.solved.010", "scoop", "Case solved! Every vanished chunk found.");

// why: "Why did the bright chunks vanish?"
SCRIPT("phx.why.010", "curiosity", "Why did the bright chunks vanish? Pick a picture.");
SCRIPT("phx.why.020", "curiosity", "Too cold here, and the air is too thin. Ice doesn't make puddles here.");
SCRIPT("phx.why.030", "curiosity", "Then the spot would be covered, not empty. Look again!");
SCRIPT("phx.why.040", "curiosity", "No one else is here! Just us and the camera.");
SCRIPT("phx.why.050", "scoop", "Exposed ice can turn straight into gas. That's called sublimation!");
SCRIPT("phx.why.060", "curiosity", "So the chunks WERE ice. Disappearing was the proof!");
SCRIPT("phx.why.070", "scoop", "I dug, the camera took pictures, and people on Earth put the clues together.");

// check: the quick check (tap ice, gas, empty in order)
SCRIPT("phx.check.010", "curiosity", "First, then, last. Tap them in order!");
SCRIPT("phx.check.020", "curiosity", "Then?");
SCRIPT("phx.check.030", "curiosity", "And last?");
SCRIPT("phx.check.040", "curiosity", "Ice → gas → gone. No puddle! That's sublimation!");
SCRIPT("phx.check.050", "curiosity", "No puddles! Ice turns straight into gas here.");
SCRIPT("phx.check.060", "curiosity", "Not yet. What comes first?");
SCRIPT("phx.check.070", "curiosity", "Not yet. What comes next?");
SCRIPT("phx.check.080", "curiosity", "Not yet. What comes last?");

// story: story time. Parts 1, 3 and 6 are Person 1's lines (storytimes/stories.js), read by the arm; one ID per sentence:
// story.phoenix.<part>.<sentence>. The parts below are this game's own draft lines (NASA sources, waiting for Person 1 to review),
// one line per sentence; the game packs the sentences into caption steps.
STORY("phoenix", "scoop", "sentences");
// part 2: Digging a trench
// part 4: The best thing Phoenix did
// part 5: More clues
// part 7: Why did Phoenix stop? (first page)
// part 8: Why did Phoenix stop? (second page)
// part 9: Listening one last time

// gift: the gift box (020 is also shown in the gift box)
SCRIPT("phx.gift.010", "curiosity", "You earned this!");
SCRIPT("phx.gift.020", "curiosity", "Oppy's real arm had a rock grinder and three science tools.");

// fit: fitting the arm on Oppy
SCRIPT("phx.fit.010", "curiosity", "Fit the arm! Press Space.");
SCRIPT("phx.fit.020", "oppy", "There were rocks. So many rocks.");
SCRIPT("phx.fit.030", "curiosity", "You remember! One more part for Oppy.");

// end: mission complete
SCRIPT("phx.end.010", "scoop", "Case closed! Mission complete!");

// ---- Story pages (researched slide text, plans/slideshow/games-sojourner-phoenix.json) ----
SCRIPT("phx.story2.030", "scoop", "White material, possibly ice, showed in the upper part of the trench.");
SCRIPT("phx.story2.020", "scoop", "Two digs on Sol 18 made a trench the team nicknamed Dodo-Goldilocks.");
SCRIPT("phx.story2.010", "scoop", "My first big job was digging, with a robotic arm nearly 8 feet long.");
SCRIPT("phx.story4.040", "scoop", "\"We have water,\" said William Boynton of the University of Arizona.");
SCRIPT("phx.story4.030", "scoop", "I delivered soil to TEGA, an instrument that identifies vapors produced by the heating of samples.");
SCRIPT("phx.story4.020", "scoop", "The sample came from a trench about 2 inches deep, where my arm hit a hard layer of frozen soil.");
SCRIPT("phx.story4.010", "scoop", "On July 31, 2008, NASA announced that Phoenix had identified water in a soil sample.");
SCRIPT("phx.story5.040", "scoop", "Phoenix also discovered traces of the chemical perchlorate, a possible energy source for microbes.");
SCRIPT("phx.story5.030", "scoop", "Soil tests pointed to calcium carbonate, the main composition of chalk.");
SCRIPT("phx.story5.020", "scoop", "The data show the snow vaporizing before reaching the ground.");
SCRIPT("phx.story5.010", "scoop", "A laser on Phoenix detected snow from clouds about 4 kilometers up.");
SCRIPT("phx.story7.030", "scoop", "The lander worked for two additional months before it ran out of energy.");
SCRIPT("phx.story7.020", "scoop", "Its originally planned 90-day mission was extended to Sept. 30.");
SCRIPT("phx.story7.010", "scoop", "In August 2008, Phoenix completed its three-month mission studying Martian ice, soil and atmosphere.");
SCRIPT("phx.story8.030", "scoop", "NASA lists Phoenix's end of mission as Nov. 2, 2008.");
SCRIPT("phx.story8.020", "scoop", "Reduced sunlight left my solar panels with too little energy to keep the lander functioning.");
SCRIPT("phx.story8.010", "scoop", "Winter brought overnight lows of minus 89 degrees Celsius (minus 128 Fahrenheit).");
SCRIPT("phx.story9.040", "scoop", "Scientists think the weight of carbon dioxide frost may have collapsed that panel.");
SCRIPT("phx.story9.030", "scoop", "An orbiter image of the landing site showed no shadow from the western solar panel.");
SCRIPT("phx.story9.020", "scoop", "NASA compared orbiter pictures of the lander from July 20, 2008, and May 7, 2010.");
SCRIPT("phx.story9.010", "scoop", "Phoenix was a solar-powered robot, not designed to survive a Martian arctic winter.");
