// INSIGHT (Whisper Beneath Mars): every line the game says out loud.
// Edit only the words between the last pair of quotes. Keep the ID (first) and the speaker (second) as they are.
// Inside the words use ’ for an apostrophe if you like; a straight double quote must be written \".
// After editing, reload the page. To see the whole script as a table: node tools/export_script.mjs (writes prototype/script/SCRIPT.md).
// Recordings: prototype/audio/<ID>.mp3 (see prototype/audio/README.md). IDs are never reused or renumbered.

// Speakers: key, the name on the caption, computer-voice settings.
SPEAKER("curiosity", "Curiosity", { pitch: 1.0, rate: 0.98 });
SPEAKER("seis",      "SEIS",      { pitch: 1.35, rate: 1.0 });
SPEAKER("oppy",      "Oppy",      { pitch: 1.25, rate: 0.95 });

// open: Curiosity drives up to InSight (ins.open.030 is split into caption steps by length; lines of one speaker pack together)
SCRIPT("ins.open.010", "curiosity", "Look, something is sitting out on the plain!");
SCRIPT("ins.open.020", "curiosity", "A lander! That is InSight.");
SCRIPT("ins.open.030", "curiosity", "InSight used its arm to set a seismometer on the ground. It needed a clear patch and a separate shield to help protect it from wind and temperature changes.");
SCRIPT("ins.open.040", "seis",      "A planet is trying to tell me something.");
SCRIPT("ins.open.050", "curiosity", "Let's help InSight listen. Here is our mission.");

// cards: the six mission cards ("Your mission")
SCRIPT("ins.cards.010", "curiosity", "Here are the steps of our mission.");

// survey: step 1, choose the surface (Rocky and Sloped are the wrong answers; Flat is right)
SCRIPT("ins.survey.010", "curiosity", "Which surface should we choose? Tap Rocky, Flat, or Sloped. Which gives SEIS a level spot and room for its shield?");
SCRIPT("ins.survey.020", "curiosity", "These rocks leave too little room for the shield.");
SCRIPT("ins.survey.030", "curiosity", "A slope makes it harder to set the instrument level.");
SCRIPT("ins.survey.040", "curiosity", "Flat! That gives SEIS a level spot and room for its shield.");

// sensor: step 2, set SEIS down
SCRIPT("ins.sensor.010", "curiosity", "Guide the arm to the flat patch and lower it until SEIS meets the soil.");
SCRIPT("ins.sensor.020", "curiosity", "Now place the wind and thermal shield over SEIS.");

// shield: step 3, cover SEIS with the shield
SCRIPT("ins.shield.010", "curiosity", "Line up the dome above the sensor.");
SCRIPT("ins.shield.020", "curiosity", "Next, try the separate heat probe.");

// arm: feedback while moving the arm (steps 2 and 3)
SCRIPT("ins.arm.010", "curiosity", "Move the arm inside the dashed box and lower it a little more.");
SCRIPT("ins.arm.020", "curiosity", "Use the arrow buttons to bring the arm tip into the dashed box near the ground, then press put down.");

// heat: step 4, three hammer strikes (ins.heat.030 is also the sentence on the solved panel)
SCRIPT("ins.heat.010", "curiosity", "The pink block is the internal hammer. It strikes downward inside the casing to push the mole into the soil.");
SCRIPT("ins.heat.020", "curiosity", "The mole moved a little. Try another strike.");
SCRIPT("ins.heat.030", "curiosity", "The mole barely moved. On Mars, the soil did not grip the probe enough for it to reach its planned depth.");

// wave: step 5, match two traces. The question is said as one step: ins.wave.010 + 020 (first trace) or 030 + 040 (second), then 050.
SCRIPT("ins.wave.010", "curiosity", "Which trace matches this vibration?");
SCRIPT("ins.wave.020", "curiosity", "Look for the same peak in the same spot.");
SCRIPT("ins.wave.030", "curiosity", "Which trace keeps both big peaks?");
SCRIPT("ins.wave.040", "curiosity", "A tiny extra wiggle can be noise. Match the big peaks in shape and position.");   // also the sentence on the solved panel
SCRIPT("ins.wave.050", "curiosity", "Tap a pattern.");
SCRIPT("ins.wave.060", "curiosity", "Compare the height and position of the big peaks.");
SCRIPT("ins.wave.070", "curiosity", "Yes! Same peak, same spot. One more trace.");

// check: step 6, "What was SEIS listening for?" (a wrong answer gets ins.check.020; ins.check.030 is also on the solved panel and the mission card)
SCRIPT("ins.check.010", "curiosity", "How did scientists learn about layers inside Mars? Think about what made the line move, then tap an answer.");
SCRIPT("ins.check.020", "curiosity", "Cameras see the surface. Think about what made the line move.");
SCRIPT("ins.check.030", "curiosity", "Scientists studied how vibrations traveled through the crust, mantle, and core.");

// story: SEIS reads Person 1's story "insight" (storytimes/stories.js), one recording per part: story.insight.1 to .3
STORY("insight", "seis", "parts");

// gift: the gift box (ins.gift.020 is also the line on the gift box)
SCRIPT("ins.gift.010", "curiosity", "You earned this!");
SCRIPT("ins.gift.020", "curiosity", "This dish let Oppy talk to Earth and listen for commands.");

// bench: fitting the antenna on Oppy
SCRIPT("ins.bench.010", "curiosity", "Fit the antenna! Press Space.");
SCRIPT("ins.bench.020", "oppy",      "Now I can talk to Earth and listen for commands!");
SCRIPT("ins.bench.030", "curiosity", "One more part for Oppy!");

// end: mission complete
SCRIPT("ins.end.010", "curiosity", "Mission complete! InSight helped us listen to Mars.");
