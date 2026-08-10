// November 2025 Digital SAT — questions sourced from the user's
// uploaded PDFs (EliteXSAT November 2025 Int A/B/C). The PDFs do
// not include answer keys; correct answers below are derived from
// the standard SAT-style rationale for each item.
//
// Heavy figure/table/equation items from the Math modules were
// skipped because they do not survive plain-text transcription.

import type { Question } from "./test-data";

export const novemberQuestions: Question[] = [
  // ============== READING & WRITING ==============
  {
    id: 1001,
    module: "rw",
    passage:
      "A study by Augusta D. Gaspar and Joana Carneiro Pinto found that a bank's corporate social responsibility (CSR) efforts, including environmental and social campaigns, improve its corporate image. When CSR was mentioned in bank marketing strategies, favorability scores assigned by study participants tended to ______ the scores assigned by participants when CSR wasn't mentioned.",
    prompt:
      "Which choice completes the text with the most logical and precise word or phrase?",
    choices: ["identify", "disturb", "replace", "exceed"],
    correct: 3,
    explanation:
      "CSR efforts 'improve' the bank's image, so favorability scores in the CSR condition should be higher than (i.e., 'exceed') those in the no-CSR condition.",
  },
  {
    id: 1002,
    module: "rw",
    passage:
      "Researchers have long debated the origins of silver used in European coins from the 600s through the early 800s CE. Geochemical analysis by Kershaw et al. of 49 coins dating to 660–820 CE provides concrete evidence that reconciles two competing theories: early coins were made from Byzantine silver, and later coins used Frankish silver — findings that provide firm details in a previously ______ area of study.",
    prompt:
      "Which choice completes the text with the most logical and precise word or phrase?",
    choices: ["esoteric", "authoritative", "solitary", "speculative"],
    correct: 3,
    explanation:
      "The new evidence is contrasted with prior 'debate' and 'competing theories.' 'Speculative' (based on conjecture rather than firm evidence) fits this contrast.",
  },
  {
    id: 1003,
    module: "rw",
    passage:
      'The following text is adapted from Alice Dunbar Nelson\'s 1899 short story "The Fisherman of Pass Christian."\n\nThe swift breezes on the beach at Pass Christian meet and conflict as though each strove for the mastery of the air. The land-breeze blows down through the pines, resinous, fragrant, cold, bringing breath-like memories of dim, dark woods shaded by myriad pine-needles. The breeze from the Gulf is warm and soft and languorous, blowing up from the south with its suggestion of tropical warmth.',
    prompt:
      'As used in the text, what does the word "mastery" most nearly mean?',
    choices: ["Familiarity", "Domination", "Comprehension", "Skillfulness"],
    correct: 1,
    explanation:
      "The breezes 'meet and conflict' as though competing — each striving to dominate the air. 'Domination' captures this struggle for control.",
  },
  {
    id: 1004,
    module: "rw",
    passage:
      "Science fiction has long served as a ______ real-world technological advancements. Indeed, from Jules Verne's 1865 novel From the Earth to the Moon inspiring developments in aerospace engineering to the television show Star Trek sparking the design of the ancestor of today's smartphones, these narratives have spurred many actual innovations.",
    prompt:
      "Which choice completes the text with the most logical and precise word or phrase?",
    choices: ["diversion from", "catalyst of", "constraint to", "sponsor of"],
    correct: 1,
    explanation:
      "The examples show science fiction inspiring or sparking innovation. 'Catalyst of' (something that causes change) matches that role.",
  },
  {
    id: 1005,
    module: "rw",
    passage:
      "Any effort to raise the toll that drivers must pay to use the Lewis and Clark Bridge, which spans the Ohio River to connect Indiana and Kentucky, should explain why a higher toll is necessary; no amount of justification, however, is likely to persuade some drivers who believe the current toll is ______.",
    prompt:
      "Which choice completes the text with the most logical and precise word or phrase?",
    choices: ["exorbitant", "contentious", "equivocal", "warranted"],
    correct: 0,
    explanation:
      "Drivers who think the current toll is already too high ('exorbitant') would resist any increase, no matter how it is justified.",
  },
  {
    id: 1006,
    module: "rw",
    passage:
      'Moving beyond a simple "present or absent" designation, researchers created a new classification system that allows for a nuanced understanding of bioluminescence in marine organisms that was unavailable under binary classification systems. The new six-point scale considers varying levels of supporting evidence used to identify bioluminescent species. For example, the firefly squid scores 1 because of inconsistent reports, the emperor squid scores 4 because of its anatomical similarity to known luminous relatives, and the shaggy anglerfish scores 6 because of substantiated direct observations.',
    prompt:
      'Which choice best describes the function of the underlined sentence ("The new six-point scale considers varying levels of supporting evidence used to identify bioluminescent species.") in the text as a whole?',
    choices: [
      "It emphasizes the thoroughness of the research conducted.",
      "It explains how the new classification system was derived from the previous binary system.",
      "It justifies the need for a new classification system for marine species.",
      "It explains the basis for the new system's scoring criteria.",
    ],
    correct: 3,
    explanation:
      "The sentence states what the six-point scale measures (levels of supporting evidence). The examples that follow then illustrate the scores — i.e., it explains the basis for the scoring.",
  },
  {
    id: 1007,
    module: "rw",
    passage:
      "Postcranial skeletal pneumaticity (PSP) refers to the presence of extensions of an animal's lungs and air sacs inside its bones. These extensions are known as pneumatic diverticula. Vascularity and other identifying characteristics of pneumatic diverticula tend not to fossilize, so paleontologists have relied on studies of living bird species to document these qualities, augmenting their findings from fossil analysis to glean additional insights into the respiratory systems of extinct genera such as Tyrannosaurus, Euhelopus, and other Cretaceous theropods and sauropods that may have also exhibited PSP.",
    prompt:
      'Which choice best describes the function of the underlined portion ("Vascularity and other identifying characteristics of pneumatic diverticula tend not to fossilize") in the text as a whole?',
    choices: [
      "It presents information about the fossilization of pneumatic diverticula that has led paleontologists to question the applicability of studies of certain living species.",
      "It accounts for disagreements among paleontologists about how the respiratory systems of certain extinct genera functioned.",
      "It highlights an issue with fossils that previously led paleontologists to misidentify certain characteristics of pneumatic diverticula.",
      "It indicates why paleontologists have used another approach in addition to fossil analysis to learn about certain aspects of pneumatic diverticula.",
    ],
    correct: 3,
    explanation:
      "The underlined sentence is followed by 'so paleontologists have relied on studies of living bird species' — i.e., it explains why an additional approach is needed beyond fossil analysis.",
  },
  {
    id: 1008,
    module: "rw",
    passage:
      "Adult glass eels can be found off the coast of Maine, but the eels begin their lives in the Sargasso Sea. Though biologists believe they have identified the general area in the Sargasso Sea that is crucial to the endangered eels' survival, little is yet known about how the animals spawn there. Scientists believe that solving the mystery will lead to better conservation of glass eels and their habitat, helping in turn to sustain several other species that rely on them as a food source.",
    prompt:
      'Which choice best describes the function of the underlined portion ("helping in turn to sustain several other species") in the text as a whole?',
    choices: [
      "It suggests that scientists are more concerned about other species than about glass eels' habitat.",
      "It indicates that the benefit of understanding glass eels' spawning behavior extends beyond the eels.",
      "It discusses a role that glass eels and other species serve in supporting the ecosystem of the Sargasso Sea.",
      "It presents a finding from a study that identifies the circumstances required to ensure the survival of glass eels.",
    ],
    correct: 1,
    explanation:
      "The phrase extends the benefit of glass-eel conservation to other species — i.e., the benefit reaches beyond the eels themselves.",
  },
  {
    id: 1009,
    module: "rw",
    passage:
      "Seesaw Girl was Linda Sue Park's debut novel. It was published in 1999. A debut novel is the first book that an author has published. Debut novels are especially interesting to literary critics (people whose job it is to evaluate books) and readers because these books offer a look at new voices in the literary world.",
    prompt:
      "According to the text, what is someone who professionally evaluates books called?",
    choices: [
      "A book publisher",
      "A literary critic",
      "A bookseller",
      "An author",
    ],
    correct: 1,
    explanation:
      "The text defines literary critics as 'people whose job it is to evaluate books.'",
  },
  {
    id: 1010,
    module: "rw",
    passage:
      "Microplastics are a common pollutant in large masses of water like glaciers. High concentrations and ______ among particles — variations in size, shape, and material — make it onerous to comprehensively classify the microplastics in a water sample, so Ojeda-Benítez et al. are exploring a device to help quickly and accurately identify certain characteristics.",
    prompt:
      "Which choice completes the text with the most logical and precise word or phrase?",
    choices: [
      "restraints",
      "inconsistencies",
      "incompatibilities",
      "disruptions",
    ],
    correct: 1,
    explanation:
      "The dash defines the missing word as 'variations in size, shape, and material.' 'Inconsistencies' fits that definition.",
  },
  {
    id: 1011,
    module: "rw",
    passage:
      "Founded in 1904, the Hispanic Society of America showcases the arts and cultures of Spanish-speaking and Portuguese-speaking regions around the world, including Latin America. It is located in New York City and has more than 18,000 objects in its museum collection. Since 2000, a number of other institutions devoted to Latino cultures have opened in the United States. A notable example is LA Plaza de Cultura y Artes in Los Angeles. It focuses on Mexican American art and culture.",
    prompt:
      "Which statement about the Hispanic Society of America is best supported by the text?",
    choices: [
      "Its collection includes over 18,000 objects.",
      "It is no longer located in New York City.",
      "It was founded after 2000.",
      "It is visited by more people than any other Latino cultural institution in the US.",
    ],
    correct: 0,
    explanation:
      "The text states the museum 'has more than 18,000 objects in its museum collection.'",
  },
  {
    id: 1012,
    module: "rw",
    passage:
      "Animals Out of Paper is a 2008 play by Rajiv Joseph. ______ play was first performed at the McGinn/Cazale Theater in New York City.",
    prompt:
      "Which choice completes the text so that it conforms to the conventions of Standard English?",
    choices: ["These", "This", "It", "Those"],
    correct: 1,
    explanation:
      "A singular demonstrative is needed to refer back to the singular noun 'play.' 'This' is correct.",
  },
  {
    id: 1013,
    module: "rw",
    passage:
      "A portrait of Silas Wright, former governor of New York, appeared on the $50 gold certificate. This form of paper currency ______ discontinued by the US Treasury in 1933.",
    prompt:
      "Which choice completes the text so that it conforms to the conventions of Standard English?",
    choices: ["having been", "to be", "was", "being"],
    correct: 2,
    explanation:
      "The subject 'This form of paper currency' needs a finite verb. 'Was' creates a complete sentence in the past passive.",
  },
  {
    id: 1014,
    module: "rw",
    passage:
      "Julia Saltz is a biologist at Rice ______ conducts research on animal behaviors.",
    prompt:
      "Which choice completes the text so that it conforms to the conventions of Standard English?",
    choices: [
      "University. She",
      "University she",
      "University, she",
      "University. Where she",
    ],
    correct: 0,
    explanation:
      "Two independent clauses must be joined by a period (or semicolon). 'University. She' produces two grammatical sentences.",
  },
  {
    id: 1015,
    module: "rw",
    passage:
      "Artists' palettes — the surfaces on which painters arrange and mix their paints — can provide valuable insights into the painters' creative processes. In her 2024 book The Artist's Palette, Alexandra Loske analyzes the palettes of 50 different painters across 500 years. ______ Loske reveals clues about the techniques and practices of such artists as Kerry James Marshall, Artemisia Gentileschi, and Vincent van Gogh.",
    prompt: "Which choice completes the text with the most logical transition?",
    choices: ["Lastly,", "In comparison,", "In doing so,", "However,"],
    correct: 2,
    explanation:
      "The second sentence describes a result of the analysis introduced in the previous sentence. 'In doing so' links the action to its outcome.",
  },
  {
    id: 1016,
    module: "rw",
    passage:
      "The visual magnitude scale, which measures the brightness of stars, is reverse logarithmic: the brighter a star, the lower its magnitude number. ______ the star Dubhe, the 34th brightest in the sky, has a higher visual magnitude number (1.79) than does the brighter star Adhara. The 22nd-brightest star, Adhara has a magnitude of 1.5.",
    prompt: "Which choice completes the text with the most logical transition?",
    choices: ["On the other hand,", "Hence,", "Nonetheless,", "Moreover,"],
    correct: 1,
    explanation:
      "The example illustrates the rule just stated (brighter = lower number). 'Hence' (= therefore) signals that the example follows from the rule.",
  },

  // ============== MATH ==============
  {
    id: 1101,
    module: "math",
    prompt: "If 9x + 4 = 67, what is the value of 90x + 40?",
    choices: ["7", "70", "130", "670"],
    correct: 3,
    explanation: "Multiply both sides of 9x + 4 = 67 by 10: 90x + 40 = 670.",
  },
  {
    id: 1102,
    module: "math",
    prompt:
      "A length of 450 meters is equal to how many decimeters? (1 meter = 10 decimeters)",
    choices: ["45", "450", "4,500", "45,000"],
    correct: 2,
    explanation: "450 m × 10 dm/m = 4,500 dm.",
  },
  {
    id: 1103,
    module: "math",
    prompt:
      "The equation 58 = 2x + 2y gives the perimeter of a rectangular garden that has length x feet and width y feet. The width of the garden is 14 feet. What is the length, in feet, of the garden?",
    choices: ["15", "22", "29", "44"],
    correct: 0,
    explanation: "Substitute y = 14: 58 = 2x + 28 → 2x = 30 → x = 15.",
  },
  {
    id: 1104,
    module: "math",
    prompt:
      "The relationship between x and y is exponential. When x = 0, y = 40, and for every increase in x by 1, the value of y increases by 50% of its previous value. Which equation represents this relationship?",
    choices: [
      "y = 40(1.50)^x",
      "y = 40(1.05)^x",
      "y = 50(1.40)^x",
      "y = 50(1.04)^x",
    ],
    correct: 0,
    explanation:
      "Initial value 40, growth factor 1 + 0.50 = 1.50. So y = 40(1.50)^x.",
  },
  {
    id: 1105,
    module: "math",
    prompt:
      "The function f is defined by f(x) = 3x − 1/4. What is the y-intercept of the graph of y = f(x) in the xy-plane?",
    choices: ["(0, −1/4)", "(0, −3)", "(0, 3)", "(0, 4)"],
    correct: 0,
    explanation:
      "The y-intercept is f(0) = 3(0) − 1/4 = −1/4, so the point is (0, −1/4).",
  },
  {
    id: 1106,
    module: "math",
    prompt:
      "Solve the system: x + 6y = 28 and 6y = 14. What is the value of x?",
    choices: ["14", "28", "42", "−14"],
    correct: 0,
    explanation:
      "From the second equation, 6y = 14. Substitute: x + 14 = 28 → x = 14.",
  },
  {
    id: 1107,
    module: "math",
    prompt:
      "The length of a side of square X is 9 cm. The area of rectangle Y is 32 square cm. What is the total area, in square cm, of square X and rectangle Y?",
    choices: ["145", "113", "82", "81"],
    correct: 1,
    explanation: "Area of square X = 9² = 81. Total = 81 + 32 = 113.",
  },
  {
    id: 1108,
    module: "math",
    prompt:
      "A black bear weighed 293 pounds when entering hibernation and lost weight at a mean rate of 0.9 pounds per day. At this rate, how many days after entering hibernation would the bear weigh 230 pounds?",
    choices: ["57", "63", "70", "207"],
    correct: 2,
    explanation: "Weight lost = 293 − 230 = 63 pounds. Days = 63 ÷ 0.9 = 70.",
  },
  {
    id: 1109,
    module: "math",
    prompt:
      "What is the radius of the circle in the xy-plane defined by (x + 3)² + (y + 9)² = 361?",
    choices: ["19", "38", "180.5", "361"],
    correct: 0,
    explanation:
      "Standard form (x − h)² + (y − k)² = r² gives r² = 361, so r = √361 = 19.",
  },
  {
    id: 1110,
    module: "math",
    prompt:
      "How many distinct real solutions does the equation x² − 81/16 = 0 have?",
    choices: ["Zero", "Exactly one", "Exactly two", "Infinitely many"],
    correct: 2,
    explanation: "x² = 81/16 → x = ±9/4. Two distinct real solutions.",
  },
  {
    id: 1111,
    module: "math",
    prompt:
      "Triangle ABC is dilated by a scale factor of 6 to form triangle A'B'C'. If the length of AB is 18, what is the length of A'B'?",
    choices: ["3", "6", "24", "108"],
    correct: 3,
    explanation:
      "A dilation by scale factor 6 multiplies side lengths by 6: 18 × 6 = 108.",
  },
  {
    id: 1112,
    module: "math",
    prompt:
      "In the figure, line p is parallel to line r, and line t intersects both lines, creating an angle of 72° on one line and an angle of x° on the other in corresponding position. What is the value of x?",
    choices: ["36", "72", "108", "180"],
    correct: 1,
    explanation:
      "Corresponding angles formed by a transversal cutting parallel lines are equal, so x = 72.",
  },
];
