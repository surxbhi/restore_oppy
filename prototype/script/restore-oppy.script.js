// RESTORE OPPY (the game shell): every line the shell says out loud: the three NASA stories, Curiosity finding Oppy, the map
// remarks, Oppy waking up, the end card and the team finale. (The five mini-games have their own script files.)
// Edit only the words between the last pair of quotes. Keep the ID (first) and the speaker (second) as they are.
// Inside the words use ’ for an apostrophe if you like; a straight double quote must be written \".
// {n}, {parts} = a word the game fills in: the computer voice says those lines (there is no recording for them).
// After editing, reload the page. To see the whole script as a table: node tools/export_script.mjs (writes prototype/script/SCRIPT.md).
// Recordings: prototype/audio/<ID>.mp3 (see prototype/audio/README.md). IDs are never reused or renumbered.
// The NASA stories are read a few lines at a time: the game packs consecutive lines into one caption (up to two caption lines),
// and plays their recordings one after another. Scene curiosity1 = page 1 of "Meet Curiosity", opportunity1 = page 1 of
// "Meet Opportunity", rocks1 = page 1 of "What the Rocks Remember".

// Speakers: key, the name on the caption, computer-voice settings (the team finale: each machine a little quicker).
SPEAKER("curiosity", "Curiosity", { pitch: 1.0, rate: 0.98 });
SPEAKER("oppy",      "Oppy",      { pitch: 1.25, rate: 0.95 });
SPEAKER("sojourner", "Sojourner", { pitch: 1.5, rate: 1.15 });
SPEAKER("phoenix",   "Phoenix",   { pitch: 0.85, rate: 1.1 });
SPEAKER("insight",   "InSight",   { pitch: 1.1, rate: 1.1 });
SPEAKER("chute",     "Chute",     { pitch: 1.6, rate: 1.15 });
SPEAKER("ingenuity", "Ingenuity", { pitch: 1.75, rate: 1.2 });

// ============ Meet Curiosity (the NASA story that opens the game; Curiosity speaks) ============
// ---- The three NASA stories (researched slide text, plans/slideshow/*.json; every fact sourced, see plans/slideshow/story-slideshow-script.md) ----
SCRIPT("shell.curiosity1.010", "curiosity", "Hi, I'm Curiosity, a NASA rover carrying an advanced kit of 10 science instruments.");
SCRIPT("shell.curiosity1.020", "curiosity", "I'm 10 feet long, 9 feet wide and 7 feet tall, not counting my arm.");
SCRIPT("shell.curiosity1.030", "curiosity", "On Earth I weigh 899 kilograms, which is 1,982 pounds.");
SCRIPT("shell.curiosity1.040", "curiosity", "On Mars I weigh only 337 kilograms, which is 743 pounds.");
SCRIPT("shell.curiosity2.010", "curiosity", "I launched on November 26, 2011, on top of an Atlas V rocket.");
SCRIPT("shell.curiosity2.020", "curiosity", "My rocket lifted off from Launch Pad 41 at Cape Canaveral in Florida.");
SCRIPT("shell.curiosity2.030", "curiosity", "The trip to Mars took 254 days and about 350 million miles.");
SCRIPT("shell.curiosity2.040", "curiosity", "I landed on Mars on August 6, 2012, ending that long journey.");
SCRIPT("shell.curiosity3.010", "curiosity", "I hit Mars's air going about 13,000 miles an hour.");
SCRIPT("shell.curiosity3.020", "curiosity", "I had only seven minutes to slow from that speed to a full stop.");
SCRIPT("shell.curiosity3.030", "curiosity", "I landed using a parachute and a new element called the sky crane.");
SCRIPT("shell.curiosity3.040", "curiosity", "A NASA orbiter photographed my parachute fully open as I fell.");
SCRIPT("shell.curiosity3.050", "curiosity", "I touched down in Gale Crater on August 6, 2012.");
SCRIPT("shell.curiosity4.010", "curiosity", "I carry 10 science instruments and 17 cameras to study Mars.");
SCRIPT("shell.curiosity4.020", "curiosity", "My laser vaporizes small spots on rocks from a distance, and I watch the spark to learn what they are made of.");
SCRIPT("shell.curiosity4.030", "curiosity", "In this drawing my laser looks red, but it is really invisible infrared light.");
SCRIPT("shell.curiosity4.040", "curiosity", "My drill, on the end of my robotic arm, has collected 36 powdered rock samples.");
SCRIPT("shell.curiosity5.010", "curiosity", "NASA sent me to find out whether Mars was ever able to support tiny living things, called microbes.");
SCRIPT("shell.curiosity5.020", "curiosity", "In September 2012, my camera photographed rounded pebbles in a rock outcrop named Hottah.");
SCRIPT("shell.curiosity5.030", "curiosity", "Round pebbles show flowing water carried them, in a river that was ankle- to hip-deep.");
SCRIPT("shell.curiosity5.040", "curiosity", "Rivers and lakes lasted in Gale Crater for perhaps a million years or longer.");
SCRIPT("shell.curiosity6.010", "curiosity", "In early 2013, I drilled into the Sheepbed mudstone at Yellowknife Bay, at a rock called John Klein.");
SCRIPT("shell.curiosity6.020", "curiosity", "The powder held sulfur, nitrogen, oxygen, phosphorus and carbon, key ingredients necessary for life.");
SCRIPT("shell.curiosity6.030", "curiosity", "The clay and low salt suggest fresh, possibly drinkable water once flowed there.");
SCRIPT("shell.curiosity6.040", "curiosity", "This place had the right chemistry to support living microbes long ago.");
SCRIPT("shell.curiosity7.010", "curiosity", "On December 16, 2014, scientists announced that I had found organic molecules in drilled rock.");
SCRIPT("shell.curiosity7.020", "curiosity", "But organic molecules are not proof of life, because they can also be made without anything alive.");
SCRIPT("shell.curiosity7.030", "curiosity", "I also sniffed methane, a gas, and its level in Gale Crater rises in warm summers and drops in winter.");
SCRIPT("shell.curiosity7.040", "curiosity", "Methane is a clue, not proof of life: living things or chemical reactions between rock and water can make it.");
SCRIPT("shell.curiosity7.050", "curiosity", "Curiosity also found the largest organic molecules on Mars to date: decane, undecane and dodecane.");
SCRIPT("shell.curiosity8.010", "curiosity", "Since 2014, I have been climbing Mount Sharp, a mountain 3 miles tall.");
SCRIPT("shell.curiosity8.020", "curiosity", "On August 26, 2026, I reached an elevation gain of 1 kilometer.");
SCRIPT("shell.curiosity8.030", "curiosity", "As of October 11, 2026, I have driven more than 38 kilometers on Mars, which is 23.65 miles.");
SCRIPT("shell.curiosity9.010", "curiosity", "My wheels print the Morse code for J, P and L in the dust, short for Jet Propulsion Laboratory.");
SCRIPT("shell.curiosity9.020", "curiosity", "My wheel pattern helps me measure how far I have traveled, so I can tell if my wheels slipped.");
SCRIPT("shell.curiosity9.030", "curiosity", "I take selfies with a camera called MAHLI on my arm, stitching 92 photos together.");
SCRIPT("shell.opportunity1.010", "oppy", "Hi, I'm Opportunity, a rover who landed on Mars in January 2004!");
SCRIPT("shell.opportunity1.020", "oppy", "Spirit is my identical twin, and we are two golf-cart-sized rovers.");
SCRIPT("shell.opportunity1.030", "oppy", "We are solar-powered, which means sunlight gives us our power.");
SCRIPT("shell.opportunity1.040", "oppy", "Spirit landed first, at Gusev Crater, on Jan. 4, 2004.");
SCRIPT("shell.opportunity1.050", "oppy", "I landed on the opposite side of Mars, at Meridiani Planum, on Jan. 24, 2004.");
SCRIPT("shell.opportunity2.010", "oppy", "I launched on July 7, 2003, riding a Delta II rocket.");
SCRIPT("shell.opportunity2.020", "oppy", "I lifted off at night, at 11:18 p.m., from Cape Canaveral, Florida.");
SCRIPT("shell.opportunity2.030", "oppy", "Just 83 minutes after liftoff, I separated from the rocket's third stage and flew on toward Mars.");
SCRIPT("shell.opportunity2.040", "oppy", "My trip to Mars took about six months.");
SCRIPT("shell.opportunity3.010", "oppy", "My lander, wrapped in airbags, bounced at least 26 times before it stopped in Meridiani Planum.");
SCRIPT("shell.opportunity3.020", "oppy", "It even hit a rock, which scientists named Bounce, one of the only rocks around.");
SCRIPT("shell.opportunity3.030", "oppy", "This picture, from my front hazard-avoidance camera, shows Bounce, a rock about 16 inches across.");
SCRIPT("shell.opportunity4.010", "oppy", "My team built me to last just 90 Martian days and to travel 1,100 yards, or 1,000 meters.");
SCRIPT("shell.opportunity4.020", "oppy", "My robotic arm held my tools and placed them directly against soil or rock.");
SCRIPT("shell.opportunity4.030", "oppy", "My rock abrasion tool ground into a rock called McKittrick, my first rock grinding on Mars.");
SCRIPT("shell.opportunity4.040", "oppy", "Inside McKittrick, my grinder unexpectedly cut two blueberries in half.");
SCRIPT("shell.opportunity4.050", "oppy", "I outlived my plan by 60 times and traveled more than 28 miles, or 45 kilometers.");
SCRIPT("shell.opportunity5.010", "oppy", "Near my landing site I found tiny round balls of hematite, which the team nicknamed blueberries.");
SCRIPT("shell.opportunity5.020", "oppy", "Hematite is a mineral that forms in water, so my blueberries are a clue that water was here.");
SCRIPT("shell.opportunity5.030", "oppy", "The blueberries formed late, from rising, acidic groundwater.");
SCRIPT("shell.opportunity5.040", "oppy", "This is Berry Bowl, a rock in Eagle Crater with blueberries scattered all around it.");
SCRIPT("shell.opportunity6.010", "oppy", "I drove to Victoria Crater, and this view is from Cape Verde, one of the points on its rim.");
SCRIPT("shell.opportunity6.020", "oppy", "From there, the far side of the crater was about 800 meters, or half a mile, away.");
SCRIPT("shell.opportunity6.030", "oppy", "Cape Verde gave me a good view of the rock layers in the cliff face of Cape St. Mary.");
SCRIPT("shell.opportunity7.010", "oppy", "On the rim of Endeavour Crater, I found white veins of the mineral gypsum.");
SCRIPT("shell.opportunity7.020", "oppy", "One vein, called Homestake, was about as wide as my thumb and 45 centimeters long.");
SCRIPT("shell.opportunity7.030", "oppy", "Gypsum veins are a telltale sign of water that traveled through underground fractures.");
SCRIPT("shell.opportunity7.040", "oppy", "I also found clay minerals that formed in neutral-pH water, not too acidic and not too basic.");
SCRIPT("shell.opportunity8.010", "oppy", "On March 25, 2015, NASA announced that I had traveled 26.219 miles, or 42.195 kilometers.");
SCRIPT("shell.opportunity8.020", "oppy", "That made me the first to go marathon distance on another world.");
SCRIPT("shell.opportunity8.030", "oppy", "By the end, I had driven 28.06 miles, which is 45.16 kilometers in all.");
SCRIPT("shell.opportunity9.010", "oppy", "I took 354 pictures from May 13 to June 10, 2018, to build this last 360-degree view.");
SCRIPT("shell.opportunity9.020", "oppy", "Then a severe Mars-wide dust storm blanketed my location, blocking the sunlight my solar panels need.");
SCRIPT("shell.opportunity9.030", "oppy", "I have not talked to Earth since June 10, 2018, even after more than a thousand commands to restore contact.");
SCRIPT("shell.opportunity9.040", "oppy", "On Feb. 13, 2019, NASA declared my mission complete after almost 15 years on Mars.");
SCRIPT("shell.opportunity9.050", "oppy", "Thank you for exploring with me! I lasted 60 times longer than planned. Goodbye, friends!");
SCRIPT("shell.rocks1.010", "oppy", "I landed in January 2004, and the small crater in this picture, Eagle Crater, is about 22 meters wide.");
SCRIPT("shell.rocks1.020", "oppy", "My team designed me to last just ninety Martian days.");
SCRIPT("shell.rocks1.030", "oppy", "My job was to look for clues for past water activity on Mars.");
SCRIPT("shell.rocks1.040", "oppy", "Scientists concluded my part of Mars was soaking wet in the past, because liquid water once flowed through these rocks.");
SCRIPT("shell.rocks2.010", "oppy", "Those round grains are my blueberries: small spheres of the mineral hematite.");
SCRIPT("shell.rocks2.020", "oppy", "The blueberries formed late, from rising, acidic groundwater.");
SCRIPT("shell.rocks2.030", "oppy", "My rocks held a mineral called jarosite, which may point to an old acidic lake or hot springs.");
SCRIPT("shell.rocks2.040", "oppy", "NASA says I found evidence that Mars may once have been able to sustain microbial life.");
SCRIPT("shell.rocks3.010", "oppy", "My ninety Martian days turned into almost fifteen years on Mars.");
SCRIPT("shell.rocks3.020", "oppy", "At Endeavour Crater I found white veins of gypsum, a telltale sign of water that traveled through underground fractures.");
SCRIPT("shell.rocks3.030", "oppy", "A pale rock called Esperance pointed to clay minerals, made when water changed the rock.");
SCRIPT("shell.rocks3.040", "oppy", "NASA says the environment at Endeavour had the friendliest conditions for ancient microbial life.");
SCRIPT("shell.rocks4.010", "oppy", "In June 2018, a severe Mars-wide dust storm blanketed my location and darkened the skies around my solar panels.");
SCRIPT("shell.rocks4.020", "oppy", "On June 10, 2018, I sent home my last data: a noisy, incomplete picture with the bottom missing.");
SCRIPT("shell.rocks4.030", "oppy", "NASA has not heard from me since that day.");
SCRIPT("shell.rocks5.010", "oppy", "Mission control sent more than a thousand commands, hoping to hear from me again.");
SCRIPT("shell.rocks5.020", "oppy", "NASA declared my mission complete on February 13, 2019, after almost fifteen years on Mars.");
SCRIPT("shell.rocks5.030", "oppy", "John Callas, manager of my project, said, \"Farewell, Opportunity, and well done.\"");
SCRIPT("shell.rocks6.010", "oppy", "I drove 28.06 miles, an off-world record that stood until Perseverance passed it on October 11, 2026.");
SCRIPT("shell.rocks6.020", "oppy", "Spirit and I carried the first Martian AutoNav system, and Perseverance has now driven more than 90 percent of its distance using AutoNav.");
SCRIPT("shell.rocks6.030", "oppy", "Curiosity and the Mars 2020 rovers build upon the lessons of Spirit and me.");
SCRIPT("shell.rocks6.040", "oppy", "Scientists believe Jezero Crater, Perseverance's landing site, was once flooded and home to an ancient river delta, and the rover is searching for signs of ancient microbial life.");










// ============ find: Curiosity drives in and finds Oppy ============
// scene: find
SCRIPT("shell.find.010", "curiosity", "Wait. What is that, under all the dust?");
SCRIPT("shell.find.020", "curiosity", "It's another rover! This is Opportunity. Friends call it Oppy.");

// scene: meet: after the "Meet Oppy" card, Oppy wakes a little and Curiosity promises to help
SCRIPT("shell.meet.010", "oppy", "Oh… hello. I can't move. And I can't remember my story.");
SCRIPT("shell.meet.020", "curiosity", "Don't worry, Oppy. I will find a way to help you.");

// ============ the map ============
// scene: map: Curiosity's remarks when the map opens or a flag is chosen ({n} = parts found so far)
SCRIPT("shell.map.010", "curiosity", "Pick a flag on the map. Any order!");
SCRIPT("shell.map.020", "curiosity", "{n} of 5 parts found. Where next?");
SCRIPT("shell.map.030", "curiosity", "Oppy is awake! You can visit any place again.");
SCRIPT("shell.map.040", "curiosity", "Oppy needs five parts. We have {n}.");
SCRIPT("shell.map.050", "curiosity", "Oppy is awake! Want to hear the story again?");

// scene: pick: a flag chosen whose part is not found yet (one line per place)
SCRIPT("shell.pick.010", "curiosity", "Phoenix! Dig a trench with Phoenix's arm. Spot the ice that vanished.");
SCRIPT("shell.pick.020", "curiosity", "Sojourner! Follow the little tracks. Drive Sojourner to the right rock.");
SCRIPT("shell.pick.030", "curiosity", "Chute! Match the stripes on the parachute. Read the secret message.");
SCRIPT("shell.pick.040", "curiosity", "Ingenuity! Plan each flight for Ingenuity. Steer clear of the sand ripples.");
SCRIPT("shell.pick.050", "curiosity", "InSight! Place the sensor on the ground. Listen for marsquakes.");

// scene: have: a flag chosen whose part is already found (one line per place)
SCRIPT("shell.have.010", "curiosity", "We already have Phoenix's part. You can play again!");
SCRIPT("shell.have.020", "curiosity", "We already have Sojourner's part. You can play again!");
SCRIPT("shell.have.030", "curiosity", "We already have Chute's part. You can play again!");
SCRIPT("shell.have.040", "curiosity", "We already have Ingenuity's part. You can play again!");
SCRIPT("shell.have.050", "curiosity", "We already have InSight's part. You can play again!");

// scene: back: leaving a mini-game from its Map button (one line per place when the part is not found yet)
SCRIPT("shell.back.010", "curiosity", "Back on the map. Where next?");
SCRIPT("shell.back.020", "curiosity", "We can go back to Phoenix any time.");
SCRIPT("shell.back.030", "curiosity", "We can go back to Sojourner any time.");
SCRIPT("shell.back.040", "curiosity", "We can go back to Chute any time.");
SCRIPT("shell.back.050", "curiosity", "We can go back to Ingenuity any time.");
SCRIPT("shell.back.060", "curiosity", "We can go back to InSight any time.");

// scene: got: a part has just been earned ({parts} = "robotic arm", or "wheels and the camera mast"; {n} = parts found)
SCRIPT("shell.got.010", "curiosity", "We got the {parts}! That's all five parts!");
SCRIPT("shell.got.020", "curiosity", "We got the {parts}! {n} of 5 parts for Oppy.");

// scene: allfive: all five parts found, Curiosity drives to Oppy by itself
SCRIPT("shell.allfive.010", "curiosity", "All five parts! Let's wake Oppy!");
SCRIPT("shell.allfive.020", "curiosity", "Let's hear Oppy's story!");

// ============ wake: Oppy wakes up with all five parts on ============
// scene: wake
SCRIPT("shell.wake.010", "curiosity", "Look, Oppy! All five parts are on.");
SCRIPT("shell.wake.020", "oppy", "Oh! I can move. And I remember… I remember everything!");
SCRIPT("shell.wake.030", "curiosity", "Welcome back, Oppy! What do you remember?");
SCRIPT("shell.wake.040", "oppy", "My whole mission. It really happened. First, let me introduce myself.");

// ============ Meet Opportunity (the NASA story, Oppy speaks) ============









// scene: thanks: after "Meet Opportunity"
SCRIPT("shell.thanks.010", "oppy", "Thank you for helping me roll again. You are an explorer, just like me!");

// ============ What the Rocks Remember (Oppy's closing story) ============
// PROPOSED FOR PERSON 1 TO ADOPT: this is the shell's own updated copy of Person 1's Opportunity story (the owner asked for
// it to be updated with newer NASA facts). The shell no longer reads storytimes/stories.js, so these are normal script lines
// here, not story.* lines. If Person 1 adopts the text, the words move to storytimes/stories.js and this scene goes away.






// ============ the end ============
// scene: end: the end card
SCRIPT("shell.end.010", "oppy", "Thank you for helping me remember.");

// ============ the team finale (each machine says its own line as it arrives) ============
// scene: finale
SCRIPT("shell.finale.010", "curiosity", "Team Mars, line up!");
SCRIPT("shell.finale.020", "sojourner", "Sojourner! First rover on Mars!");
SCRIPT("shell.finale.030", "phoenix", "Phoenix! I found water ice!");
SCRIPT("shell.finale.040", "insight", "InSight! I heard marsquakes!");
SCRIPT("shell.finale.050", "chute", "Chute here! I carried a secret code!");
SCRIPT("shell.finale.060", "ingenuity", "Ingenuity! I flew on another planet!");
SCRIPT("shell.finale.070", "curiosity", "Curiosity! I found ancient lakes!");
SCRIPT("shell.finale.080", "oppy", "Oppy! The rover that kept going!");
SCRIPT("shell.finale.090", "curiosity", "Congratulations, explorer! The Mars team is back together!");
