// INGENUITY, "FLIGHT PLAN" (Ingenuity's game): every line the game says out loud.
// Edit only the words between the last pair of quotes. Keep the ID (first) and the speaker (second) as they are.
// Inside the words use ’ for an apostrophe if you like; a straight double quote must be written \".
// After editing, reload the page. To see the whole script as a table: node tools/export_script.mjs (writes prototype/script/SCRIPT.md).
// Recordings: prototype/audio/<ID>.mp3 (see prototype/audio/README.md). IDs are never reused or renumbered.

// Speakers: key, the name on the caption, computer-voice settings.
SPEAKER("ingenuity", "Ingenuity", { pitch: 1.5, rate: 1.12 });
SPEAKER("curiosity", "Curiosity", { pitch: 1.0, rate: 0.98 });
SPEAKER("oppy",      "Oppy",      { pitch: 1.25, rate: 0.95 });

// find: Curiosity follows a shadow
SCRIPT("ing.find.010", "curiosity", "A shadow on the ground. With an X! Where is it coming from?");

// meet: Curiosity meets Ingenuity
SCRIPT("ing.meet.010", "ingenuity", "Hi! I'm Ingenuity, a helicopter. I flew on Mars!");
SCRIPT("ing.meet.020", "ingenuity", "They hoped I'd fly five times. I may have got carried away.");
SCRIPT("ing.meet.030", "curiosity", "Can you help Oppy? It needs to remember the sky.");
SCRIPT("ing.meet.040", "ingenuity", "Plan my flights, like my team on Earth did. I fly them on my own!");

// brief: the flights overview card and the "Before you fly" card
SCRIPT("ing.brief.010", "curiosity", "Four flights to plan. They get harder!");
SCRIPT("ing.brief.020", "curiosity", "Here are my moves. Are you ready for the game?");

// board: said as each flight starts
SCRIPT("ing.board.010", "ingenuity", "Fly out, photo the striped rock, then come home to land.");
SCRIPT("ing.board.020", "ingenuity", "A one-way trip! Photo the striped rock and land on the new airfield.");
SCRIPT("ing.board.030", "ingenuity", "The science team wants a 3D picture. Photo the rock from two different angles!");
SCRIPT("ing.board.040", "ingenuity", "Going all the way round is too long. Find the shortcut over the rocks!");

// drive: while the plan runs (GO), and when it is solved
SCRIPT("ing.drive.010", "ingenuity", "Give me a plan first!");
SCRIPT("ing.drive.020", "ingenuity", "Smooth sand... nothing to follow! I'm lost. Flying back!");
SCRIPT("ing.drive.030", "ingenuity", "That's the edge of our map! Flying back.");
SCRIPT("ing.drive.040", "ingenuity", "Click! Got it. And a soft landing!");
SCRIPT("ing.drive.050", "curiosity", "You did it! On to the next flight.");
SCRIPT("ing.drive.060", "ingenuity", "I remember flights like that! Every one of them.");

// fix: what went wrong with the plan, after the flight (each asks the player to fix it)
SCRIPT("ing.fix.010", "curiosity", "Which move flew onto the ripples? Fix it, then GO.");
SCRIPT("ing.fix.020", "curiosity", "Which move went off the map? Fix it, then GO.");
SCRIPT("ing.fix.030", "ingenuity", "I can't land on a rock! Finish on an airfield.");
SCRIPT("ing.fix.040", "ingenuity", "The team only checked the airfields. Finish on one!");
SCRIPT("ing.fix.050", "ingenuity", "This flight goes out and comes home. Finish back home!");
SCRIPT("ing.fix.060", "ingenuity", "Let's land on the new airfield, where Perseverance is heading.");
SCRIPT("ing.fix.070", "ingenuity", "One picture is flat. Take another from a different angle to make it 3D!");
SCRIPT("ing.fix.080", "ingenuity", "That's a picture of sand. Turn me to face the striped rock, then Photo.");
SCRIPT("ing.fix.090", "ingenuity", "Nice landing! But where's our picture? Add a Photo.");

// hint: the Hint button (ing.hint.010 is said just before ing.hint.040 to ing.hint.070 when the game offers help by itself)
SCRIPT("ing.hint.010", "curiosity", "Need a little help?");
SCRIPT("ing.hint.020", "curiosity", "The flight is done before those last moves. I took them off!");
SCRIPT("ing.hint.030", "curiosity", "This plan already works. Press GO!");
SCRIPT("ing.hint.040", "curiosity", "Ingenuity faces the striped rock. Try a Photo next!");
SCRIPT("ing.hint.050", "curiosity", "Try turning right next.");
SCRIPT("ing.hint.060", "curiosity", "Try turning left next.");
SCRIPT("ing.hint.070", "curiosity", "Try flying forward to the square with the arrow.");
SCRIPT("ing.hint.080", "curiosity", "I fixed the plan up to here. Your turn!");

// check: Part 3, "what do the parts do?": the question (also shown big on the screen), the right answer, a wrong answer's reason
SCRIPT("ing.check.010", "ingenuity", "What do my rotors do?");
SCRIPT("ing.check.020", "ingenuity", "What does my solar panel do?");
SCRIPT("ing.check.030", "ingenuity", "What does my camera do?");
SCRIPT("ing.check.040", "ingenuity", "My rotors spin very fast, so I can lift off in the thin Mars air.");
SCRIPT("ing.check.050", "ingenuity", "My solar panel charges my batteries with sunlight.");
SCRIPT("ing.check.060", "ingenuity", "My cameras take pictures, and help me find my way.");
SCRIPT("ing.check.070", "ingenuity", "Lifting me up is the rotors' job, not this part's.");
SCRIPT("ing.check.080", "ingenuity", "Making power from sunlight is the solar panel's job, not this part's.");
SCRIPT("ing.check.090", "ingenuity", "Taking pictures is the camera's job, not this part's.");
SCRIPT("ing.check.100", "ingenuity", "Try another one!");

// story: Ingenuity reads Person 1's story "ingenuity" (storytimes/stories.js), one recording per part: story.ingenuity.1 to .3
STORY("ingenuity", "ingenuity", "parts");

// more: five extra story pages after Person 1's three parts (Person 2's drafts, for Person 1 to review), read by Curiosity
SCRIPT("ing.more.010", "curiosity", "Ingenuity's very first flight was the first powered, controlled flight on another planet! It went up 3 meters and hovered for 30 seconds. The whole flight lasted 39.1 seconds. Mars has an extremely thin atmosphere, with only 1% the pressure at the surface. A swatch from the original Wright Flyer was onboard Ingenuity.");
SCRIPT("ing.more.020", "curiosity", "The plan was no more than five test flights in 30 days. Ingenuity completed 72 flights across nearly three years! It flew 17.0 kilometers in all, with 128.8 minutes in the air. Its highest flight reached 24.0 meters, and it became an aerial scout for Perseverance.");
SCRIPT("ing.more.030", "curiosity", "On January 18, 2024, Ingenuity made its final flight, flight 72. Its navigation camera looks down at the ground, but on flight 72 it crossed steep, relatively featureless sand ripples. Engineers think Ingenuity touched down with high sideways speed and hit a sloping sand ripple hard. The hard landing snapped all four rotor blades off at their weakest point.");
SCRIPT("ing.more.040", "curiosity", "Ingenuity was not just thrown away. It stays at a spot nicknamed Valinor Hills. In late 2024, it still sent weather and test data to Perseverance about once a week. Its data can give a long-term perspective on Martian weather patterns and dust movement. It also sent a farewell message featuring the names of people who worked on the mission.");
SCRIPT("ing.more.050", "curiosity", "NASA has a concept for a bigger Mars helicopter called Mars Chopper. JPL says Mars Chopper would be approximately 20 times heavier than Ingenuity. It could fly several pounds of science equipment, with payloads as large as 11 pounds, or 5 kilograms. It could cover up to 3 kilometers in a day.");

// gift: the gift box (ing.gift.020 is also the line on the gift box)
SCRIPT("ing.gift.010", "ingenuity", "You earned this!");
SCRIPT("ing.gift.020", "ingenuity", "Solar panels turned sunlight into power for Oppy.");

// bench: fitting the solar panels on Oppy
SCRIPT("ing.bench.010", "curiosity", "Fit the part! Press Space.");
SCRIPT("ing.bench.020", "oppy",      "Sunlight! Now I can make my own power.");
SCRIPT("ing.bench.030", "ingenuity", "My solar panel does that for me too!");

// end: Mission complete
SCRIPT("ing.end.010", "curiosity", "Mission complete! Oppy has its solar panels.");
