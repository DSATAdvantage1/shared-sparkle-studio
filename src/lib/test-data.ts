export type Question = {
  id: number | string;
  module: "rw" | "math";
  passage?: string;
  prompt: string;
  choices: string[];
  correct: number; // index
  explanation: string;
  domain?: string;
  skill?: string;
  difficulty?: string;
  questionType?: string; // e.g. "words in context", "grammar", "algebra"
  questionId?: string;
  graph?: {
    type?: string;
    description?: string;
    expressions?: string[];
  };
};

// Source: @DesmosLab SAT September Bank — Section 1, Module 1 (Reading & Writing)
// Used with permission from the channel owner.
export const questions: Question[] = [
  {
    id: 1,
    module: "rw",
    passage:
      "The mihrab (or niche) is one of many features that are foundational to traditional mosque architecture and is therefore considered ______ aspect of mosque design. Even mosques that exhibit elements of multiple architectural styles, such as the Kocatepe Mosque, which incorporates elements from the Neoclassical Ottoman and modern styles, will also include several of these standard features.",
    prompt:
      "Which choice completes the text with the most logical and precise word or phrase?",
    choices: [
      "an unprecedented",
      "an embellished",
      "an imposing",
      "a quintessential",
    ],
    correct: 3,
    explanation:
      "The mihrab is described as 'foundational' and a feature found in nearly every mosque, even unconventional ones. 'Quintessential' (representing the most perfect example) fits.",
  },
  {
    id: 2,
    module: "rw",
    passage:
      "The following text is adapted from Willa Cather's 1912 novel Alexander's Bridge.\n\nFor the next few days Alexander was very busy. He took a desk in the office of a [Scottish] engineering firm on Henrietta Street, and was at work almost constantly. He avoided the clubs and usually dined alone at his hotel.",
    prompt:
      'As used in the text, what does the word "constantly" most nearly mean?',
    choices: ["Imperceptibly", "Fearfully", "Continuously", "Hastily"],
    correct: 2,
    explanation:
      "Alexander 'was at work almost constantly' — i.e., without interruption. 'Continuously' matches.",
  },
  {
    id: 3,
    module: "rw",
    passage:
      "Siemowit is said to have ruled what eventually became Poland in the 9th century. Unlike that of Bezprym or other well-attested figures from early Polish history, Siemowit's existence has been the subject of debate, as our knowledge of him is ______ somewhat dubious oral traditions first written down hundreds of years after the events they describe.",
    prompt:
      "Which choice completes the text with the most logical and precise word or phrase?",
    choices: [
      "unsupported by",
      "independent of",
      "derived from",
      "reminiscent of",
    ],
    correct: 2,
    explanation:
      "Knowledge of Siemowit comes from oral traditions — i.e., is 'derived from' those sources. The doubt arises because those sources are dubious, not because the knowledge lacks support.",
  },
  {
    id: 4,
    module: "rw",
    passage:
      "Parapuzosia seppenradensis, known to have lived in what is now Mexico, and Parapuzosia leptophylla, known to have lived in what is now England, were both ammonites, but P. seppenradensis was much larger than P. leptophylla. Recent research by Christina Ifrim, Nils Schorndorf, and colleagues has suggested that this ______ resulted from the unique predator threat faced by each species.",
    prompt:
      "Which choice completes the text with the most logical and precise word or phrase?",
    choices: ["disparity", "enmity", "anomaly", "ambiguity"],
    correct: 0,
    explanation:
      "The text describes a size difference between two species. 'Disparity' (a noticeable difference) fits.",
  },
  {
    id: 5,
    module: "rw",
    passage:
      "In their study of fossils of the extinct arthropod Mollisonia symmetrica, Javier Ortega-Hernández, Sarah Losso, and team reported some obvious indications of M. symmetrica's nervous system—for example, the animal's primary nerve cord. They also saw signs of what might be a synganglion, a brain-like mass of nerve tissue, in the animal's head. This evidence is exciting because it could help us better understand how M. symmetrica is related to other arthropods, such as cave crickets and krill.",
    prompt:
      'Which choice best describes the function of the underlined portion ("a brain-like mass of nerve tissue") in the text as a whole?',
    choices: [
      "It indicates that the team's claims about the M. symmetrica fossils are incorrect.",
      'It gives the definition of the term "synganglion" used earlier in the text.',
      "It explains why the team's finding of a possible synganglion is exciting.",
      "It states that krill are arthropods but cave crickets are not.",
    ],
    correct: 1,
    explanation:
      "The phrase 'a brain-like mass of nerve tissue' defines the just-introduced technical term 'synganglion.'",
  },
  {
    id: 6,
    module: "rw",
    passage:
      "High-speed rail systems, in which trains can move at great speeds, are expanding in many countries because high-speed rail can reduce the number of automobiles on the road and ultimately conserve energy. In Morocco, for instance, 186 kilometers of high-speed rail lines are in operation as of 2023, and 1,287 kilometers are under construction.",
    prompt: "Which choice best describes the overall structure of the text?",
    choices: [
      "The text notes a general trend and then cites an example of that trend.",
      "The text summarizes an argument and then offers a challenge to that argument.",
      "The text questions a course of action and then suggests alternatives to that action.",
      "The text rejects a long-held belief and then proposes a different interpretation.",
    ],
    correct: 0,
    explanation:
      "The text presents a general trend (high-speed rail is expanding) and then gives Morocco as a specific example.",
  },
  {
    id: 7,
    module: "rw",
    passage:
      "A microgenre is a specialized genre consisting of a comparatively small number of stylistically similar artists. The microgenre of electronic music known as hyperpop emerged in the 2010s, with American musician Laura Les as an early exponent. Her combination of dense synthesizer arrangements and metallic percussion with vocals electronically shifted in pitch above her natural range exemplifies the hyperpop sound. More recently, British recording artist Charli XCX has contributed to that sound by incorporating pop melodies into it.",
    prompt:
      "Which choice best describes the function of the underlined sentence (the final sentence)?",
    choices: [
      "It asserts that the hyperpop sound hasn't changed, even though new artists have adopted it.",
      "It criticizes a later hyperpop artist for being too similar to an earlier hyperpop artist.",
      "It praises a particular hyperpop artist for consistently evolving through the years.",
      "It identifies an artist who has contributed a new stylistic element to the hyperpop sound.",
    ],
    correct: 3,
    explanation:
      "The final sentence names Charli XCX and the new element (pop melodies) she added to hyperpop.",
  },
  {
    id: 8,
    module: "rw",
    passage:
      "Women like Minnie McNeal Kenny made important early contributions to the history of US cryptology, a field concerned with secure data communication and storage. Kenny worked for the National Security Agency (NSA) and received the NSA's two highest awards. She also held administrative positions at the National Cryptologic School. In this way, Kenny and others like her helped make it possible for more women—such as Anna Lysyanskaya, who currently works in and teaches digital cryptography—to enter the field of cryptology.",
    prompt: "Which choice best states the main idea of the text?",
    choices: [
      "Women such as Minnie McNeal Kenny and Anna Lysyanskaya have contributed to the field of cryptology.",
      "Cryptology is a field that focuses primarily on securely managing data.",
      "Minnie McNeal Kenny and Anna Lysyanskaya worked together on an important project in the field of cryptology.",
      "Cryptology should be taught more often in schools to encourage more women to enter the field.",
    ],
    correct: 0,
    explanation:
      "The passage's main idea is that women like Kenny and Lysyanskaya have contributed to cryptology.",
  },
  {
    id: 9,
    module: "rw",
    passage:
      "Tokyo has high pedestrian traffic, but other cities cannot increase their pedestrian traffic simply by replicating a single feature of Tokyo—e.g., its high population density—that is associated with walkability. As urbanist Mariela Alfonzo argues, many factors influence people's decision-making about whether to walk: some studies have shown the importance of personal preference, others have shown the importance of perceived safety, and so on, and it is clear that none of these factors in isolation fully explains pedestrian habits in a given city.",
    prompt:
      'Based on the text, the author would most likely agree with which statement about Tokyo\'s "high population density"?',
    choices: [
      "It may increase walkability in Tokyo but is known to reduce walkability in other cities.",
      "It should be understood as just one of several factors that influence pedestrian activity in Tokyo.",
      "It affects walking decisions in Tokyo less than personal preference and perceived safety do.",
      "It is better understood as an effect of the high level of pedestrian traffic in Tokyo than as a cause of that pedestrian traffic.",
    ],
    correct: 1,
    explanation:
      "The author argues no single factor fully explains pedestrian habits — density is just one such factor.",
  },
  {
    id: 10,
    module: "rw",
    passage:
      "Meredith E. Protas and colleagues have explored how convergent evolution—a phenomenon that occurs when the same trait evolves independently in two reproductively separate lineages—can result from a genetic mechanism shared by both lineages. Meanwhile, Cynthia C. Steiner and colleagues have investigated how convergence occurs through different genetic mechanisms, but the relative prevalence of convergence through shared and different genetic processes is still poorly understood. This motivated biologists Delbert A. Green II and Cassandra G. Extavour to evaluate both types of convergence in a single study for their 2012 paper.",
    prompt:
      "According to the text, what did Protas and colleagues focus on in their study?",
    choices: [
      "Convergent traits arising from different genetic mechanisms",
      "Convergent traits arising from a shared genetic mechanism",
      "The convergence of traits in lineages that are not reproductively separate",
      "The relative prevalence of convergent traits emerging through shared and different genetic mechanisms",
    ],
    correct: 1,
    explanation:
      "The text says Protas explored convergent evolution resulting from 'a genetic mechanism shared by both lineages.'",
  },
  {
    id: 11,
    module: "rw",
    passage:
      "Examples of Hoards found in Ireland and Northern Ireland:\n• Broighter Hoard — 1st century BCE — discovered 1896 — gold pieces\n• Balline Hoard — 4th century CE — discovered 1940 — silver pieces\n• Dooyork Hoard — 3rd century BCE–2nd century CE — discovered 2001 — gold, bronze, and beads\n\nDeposits of valuable objects, or hoards, have been unearthed in many different parts of Ireland and Northern Ireland. Some of these hoards were discovered before 2000; for example, ______",
    prompt:
      "Which choice most effectively uses data from the table to complete the statement?",
    choices: [
      "the Balline Hoard and the Dooyork Hoard were both discovered in the 2000s.",
      "the Broighter Hoard was one of several hoards discovered in the 1800s.",
      "the Dooyork Hoard was discovered in 1940, and the Balline Hoard was discovered in 2001.",
      "the Broighter Hoard was discovered in 1896, and the Balline Hoard was discovered in 1940.",
    ],
    correct: 3,
    explanation:
      "Only D matches the table (1896 and 1940) and supports 'discovered before 2000.'",
  },
  {
    id: 12,
    module: "rw",
    passage:
      "The Wonderful Wizard of Oz is a 1900 novel by L. Frank Baum. In the novel, Dorothy lives in Kansas with her aunt and uncle, but she later finds herself in a land called Oz. The narrator indicates that her aunt and uncle's house in Kansas is remote and solitary, writing that ______",
    prompt:
      "Which quotation from The Wonderful Wizard of Oz most effectively illustrates the claim?",
    choices: [
      'in Kansas, "When Dorothy stood in the doorway and looked around, she could see nothing but the great gray prairie on every side. Not a tree nor a house broke the broad sweep of flat country."',
      'in Kansas, "Once the house had been painted, but the sun blistered the paint and the rains washed it away, and now the house was as dull and gray as everything else."',
      'in Oz, "Dorothy fell asleep only once, and then she dreamed she was in Kansas, where Aunt Em was telling her how glad she was to have her little girl at home again."',
      'in Oz, "[Dorothy and her companions] walked along listening to the singing of the brightly colored birds and looking at the lovely flowers which now became so thick that the ground was carpeted with them."',
    ],
    correct: 0,
    explanation:
      'Choice A directly illustrates remoteness and solitude — "nothing but the great gray prairie... Not a tree nor a house."',
  },
  {
    id: 13,
    module: "rw",
    passage:
      "Nautilids are marine mollusks that begin growing their shells before emerging from their eggs and continue to add shell segments throughout their lifetimes. The walls between their shells' chambers are called septa, and the concentration of the isotope oxygen-18 they contain exactly reflects the isotope's concentration in the water at the depth at which the septa formed. Paleontologist Amane Tajika and colleagues examined each of the septa in two nautilid shells; finding that sample F13 had a higher concentration of the isotope than sample M03 did, the researchers concluded that F13 must have formed at a significantly lower temperature than M03 did.",
    prompt:
      "Which finding, if true, would most directly support the researchers' conclusion?",
    choices: [
      "As the concentration of oxygen-18 in water decreases, water temperature decreases and nautilid shell growth slows.",
      "As water depth increases, both the concentration of oxygen-18 and the water temperature decrease.",
      "As water depth increases, the concentration of oxygen-18 increases and water temperature decreases.",
      "As water temperature increases, nautilids are able to concentrate more oxygen-18 into their shells.",
    ],
    correct: 2,
    explanation:
      "The conclusion links higher oxygen-18 to lower temperature. C provides exactly that link via depth.",
  },
  {
    id: 14,
    module: "rw",
    passage:
      "Studies have demonstrated that positive feedback enhances real-world exercise performance and exercisers' psychological experience of physical activity. Nicole Trewick and team tested their prediction that positive feedback would produce analogous results among participants cycling on a stationary bike in a virtual reality environment. After monitoring participants' pedaling rate and heart rate to determine the effects on their physical endurance of feedback (positive, negative, or neutral) delivered at regular intervals, the researchers used participants' questionnaire responses to assess their psychological experience of the task.",
    prompt:
      "Assuming participants had similar baseline fitness levels, which finding from the study, if true, would most strongly suggest that positive feedback had the predicted psychological effect but not the predicted physical effect?",
    choices: [
      "Compared with participants who received negative or neutral feedback, participants who received positive feedback reported greater enjoyment of the activity on average but maintained their heart and pedaling rates for approximately similar durations.",
      "Compared with participants who received positive or neutral feedback, participants who received negative feedback reported lower enjoyment of the activity on average but maintained their heart and pedaling rates for longer durations.",
      "Compared with participants who received negative feedback, participants who received neutral feedback reported similar levels of enjoyment of the activity on average but maintained their heart and pedaling rates for shorter durations than participants who received positive feedback.",
      "Compared with participants who received positive feedback, participants who received neutral feedback reported lower enjoyment of the activity on average but maintained their heart and pedaling rates for longer durations than participants who received negative feedback.",
    ],
    correct: 0,
    explanation:
      "Positive feedback → greater enjoyment (psychological effect ✓) but no improvement in endurance (physical effect ✗). Only A captures this exact split.",
  },
  {
    id: 15,
    module: "rw",
    passage:
      "Blue holes—large marine sinkholes, like Watling's Blue Hole near San Salvador Island—can be hundreds of meters deep and are sometimes part of widespread subterranean networks of passageways. In 2021, researchers conducted the first formal study of the Taam Ja' Blue Hole (TJBH), located in a bay of fresh water and salt water on Mexico's coast, and reported a maximum depth of 274 meters. Oscar F. Reyes-Mendoza and colleagues later reinvestigated the depth of the TJBH, determining that it exceeded 400 meters; additionally, they detected variations in characteristics across water layers. Layers more than 400 meters deep began to show density and salinity conditions akin to those of the nearby Caribbean Sea. Reyes-Mendoza and colleagues therefore suggest that ______",
    prompt: "Which choice most logically completes the text?",
    choices: [
      "there may be tunnels and caves that connect the TJBH and the waters of the Caribbean deep underground.",
      "in the TJBH, there are greater differences between water layers less than 275 meters deep than there are between water layers greater than 400 meters deep.",
      "researchers should reevaluate existing measurements of the depths of Watling's Blue Hole and other blue holes where the conditions in very deep waters are similar to those of waters in open seas.",
      "the apparent relationship between depth and salinity level in the TJBH is the inverse of that found in the Caribbean Sea.",
    ],
    correct: 0,
    explanation:
      "Caribbean-like conditions deep in the TJBH suggest a subterranean connection — matching the article's earlier mention of 'subterranean networks of passageways.'",
  },
  {
    id: 16,
    module: "rw",
    passage:
      "When attempting to determine a fault's seismic history, geophysicists like Dr. Estella Atekwana at the University of Delaware rely in part on data about the fault's physical dimensions and geological features. For example, data from the US Geological Survey show the ______ and most recent deformation (less than 130 thousand years ago) of the Kawich Range fault in Nye County, Nevada.",
    prompt:
      "Which choice completes the text so that it conforms to the conventions of Standard English?",
    choices: [
      "length (30 km), slip rate (less than 0.2 mm/yr),",
      "length, (30 km); slip rate, (less than 0.2 mm/yr);",
      "length, (30 km), slip rate, (less than 0.2 mm/yr),",
      "length (30 km) slip rate (less than 0.2 mm/yr)",
    ],
    correct: 0,
    explanation:
      "List of three items separated by commas: 'length (30 km), slip rate (less than 0.2 mm/yr), and most recent deformation...'",
  },
  {
    id: 17,
    module: "rw",
    passage:
      "Jane Austen's Northanger Abbey (1818) is considered a satire of another novel popular at the time: Ann Radcliffe's The Mysteries of Udolpho (1794), which Austen's heroine, Catherine Morland, is depicted reading. However, the similarity of the ______ experiences—the predicaments of both Catherine and Radcliffe's Emily St. Aubert result from men's greed—suggests that underlying the satire is a social critique.",
    prompt:
      "Which choice completes the text so that it conforms to the conventions of Standard English?",
    choices: [
      "novels' protagonists",
      "novels' protagonists'",
      "novel's protagonist's",
      "novel's protagonists'",
    ],
    correct: 1,
    explanation:
      "Two novels (plural possessive: novels'), two protagonists, and the experiences belong to them (plural possessive: protagonists').",
  },
  {
    id: 18,
    module: "rw",
    passage:
      "The foxtail pine (Pinus balfouriana) known as RCR 1, located in the United States, is one of the oldest known trees in the world, at 1,666 years old. With almost two millennia of climate data in its tree ______ single tree like this, claims dendrochronologist Valerie Trouet, can tell the history of the world.",
    prompt:
      "Which choice completes the text so that it conforms to the conventions of Standard English?",
    choices: ["rings and a", "rings, a", "rings. A", "rings; a"],
    correct: 2,
    explanation:
      "Two complete independent clauses must be joined by a period (or semicolon). 'A single tree like this... can tell the history' is a full sentence, so a period works.",
  },
  {
    id: 19,
    module: "rw",
    passage:
      "When the electrons of a chemical element change energy states, they release certain wavelengths of light that are unique to that element. This means that the emission of light with a wavelength of 516.7 nanometers (nm), which falls in the 500–570 nm range defining the green portion of the visible spectrum, ______ the element iron as the source of the light.",
    prompt:
      "Which choice completes the text so that it conforms to the conventions of Standard English?",
    choices: ["identifying", "identifies", "to identify", "having identified"],
    correct: 1,
    explanation:
      "The subject 'the emission' needs a finite verb. 'Identifies' is the singular present-tense verb required.",
  },
  {
    id: 20,
    module: "rw",
    passage:
      "As the exoplanet 81 Ceti b orbits a star 330 light-years from Earth, the gas giant's gravity causes the star to wobble. In 2008, astronomers observing the wobble—indicated by redshifts and blueshifts in the star's spectral wavelengths—eventually attributed ______ to the gravitational influence of the previously undetected exoplanet.",
    prompt:
      "Which choice completes the text so that it conforms to the conventions of Standard English?",
    choices: ["them", "it", "these", "each"],
    correct: 1,
    explanation:
      "The pronoun refers to 'the wobble,' which is singular. Use 'it.'",
  },
  {
    id: 21,
    module: "rw",
    passage:
      "Their Last Ride was first released in 2022. This short ______ is about the environmental issues affecting wild and domestic horses, was directed by Cherokee filmmaker Neta Rhyne.",
    prompt:
      "Which choice completes the text so that it conforms to the conventions of Standard English?",
    choices: [
      "documentary",
      "documentary which",
      "documentary,",
      "documentary, which",
    ],
    correct: 3,
    explanation:
      "A nonrestrictive relative clause must start with ', which.' 'This short documentary, which is about... horses, was directed by...'",
  },
  {
    id: 22,
    module: "rw",
    passage:
      "In September 1862, John Francis joined the US Army. He went on to serve in the 2nd Louisiana Infantry during the US Civil War and, ______ earned a place in US history as one of the war's few Chinese-born American soldiers.",
    prompt: "Which choice completes the text with the most logical transition?",
    choices: ["in doing so,", "for instance,", "in any case,", "usually,"],
    correct: 0,
    explanation:
      "His service is the means by which he earned the historical place. 'In doing so' captures that consequence.",
  },
  {
    id: 23,
    module: "rw",
    passage:
      "The World Cup of men's soccer, one of the biggest sporting events on the planet, brought 32 national teams from six continents to the host country, Qatar, in 2022. The event, which is held every four years, used to be much smaller and more limited geographically. ______ the 1950 World Cup in Brazil included only 13 teams, all from Europe and the Americas.",
    prompt: "Which choice completes the text with the most logical transition?",
    choices: ["In addition,", "However,", "At last,", "For example,"],
    correct: 3,
    explanation:
      "The 1950 World Cup is offered as a specific example of the smaller, more limited past event.",
  },
  {
    id: 24,
    module: "rw",
    passage:
      "In a given rock formation, Fortunian rock from 538 million years ago might directly abut Rhaetian rock from 208.5 million years ago, with millions of years of material missing in between. ______ time did not stand still during these intervening years; the unaccounted-for sedimentary material was likely removed from the stratigraphic record via erosion and weathering.",
    prompt: "Which choice completes the text with the most logical transition?",
    choices: [
      "On the contrary,",
      "Of course,",
      "As a result,",
      "In particular,",
    ],
    correct: 1,
    explanation:
      "The second sentence concedes an obvious point ('time did not stand still'). 'Of course' marks that concession.",
  },
  {
    id: 25,
    module: "rw",
    passage:
      "While researching a topic, a student has taken the following notes:\n• The Madeira River is in South America.\n• It ranks No. 21 among the longest rivers in the world.\n• It is 3,380 kilometers long.\n• The Amur River is in Asia.\n• It ranks No. 10 among the longest rivers in the world.\n• It is 4,444 kilometers long.",
    prompt:
      "The student wants to compare the lengths of the two rivers. Which choice most effectively uses relevant information from the notes to accomplish this goal?",
    choices: [
      "The Madeira River in South America is 3,380 kilometers long.",
      "The Amur River is in Asia, whereas the Madeira River is located in South America.",
      "Among the longest rivers in the world, the Amur River is ranked No. 10.",
      "The Madeira River is shorter than the Amur River.",
    ],
    correct: 3,
    explanation: "Only D directly compares the two rivers' lengths.",
  },
  {
    id: 26,
    module: "rw",
    passage:
      'While researching a topic, a student has taken the following notes:\n• The A.M. Turing Award is a prestigious award given by the Association for Computing Machinery (ACM).\n• The ACM gives the award for "major contributions of lasting importance to computing."\n• It is named after groundbreaking British mathematician Alan Turing.\n• Judea Pearl won the award in 2011.',
    prompt:
      "The student wants to explain whom the award is named for and identify one recipient of it. Which choice most effectively uses relevant information from the notes to accomplish this goal?",
    choices: [
      'The A.M. Turing Award is given for "major contributions of lasting importance to computing."',
      "The A.M. Turing Award, which is named for British mathematician Alan Turing, was given to Judea Pearl in 2011.",
      'In 2011, Judea Pearl won the A.M. Turing Award, which is given for "major contributions of lasting importance to computing."',
      "It was in 2011 that Judea Pearl won the A.M. Turing Award.",
    ],
    correct: 1,
    explanation:
      "Only B addresses both goals: who the award is named for (Alan Turing) AND a recipient (Judea Pearl).",
  },
  // ── Math (sample original questions kept so the Math module still works) ──
  {
    id: 27,
    module: "math",
    prompt: "If 3x + 7 = 22, what is the value of 6x + 14?",
    choices: ["22", "30", "44", "60"],
    correct: 2,
    explanation: "6x + 14 = 2(3x + 7) = 2(22) = 44.",
  },
  {
    id: 28,
    module: "math",
    prompt:
      "A line in the xy-plane passes through the points (2, 5) and (6, 13). What is the slope of the line?",
    choices: ["1/2", "2", "3", "4"],
    correct: 1,
    explanation: "Slope = (13 − 5) / (6 − 2) = 8 / 4 = 2.",
  },
  {
    id: 29,
    module: "math",
    prompt:
      "A rectangle has a length that is 3 cm more than twice its width. If the perimeter is 36 cm, what is the width, in cm?",
    choices: ["5", "6", "7", "9"],
    correct: 0,
    explanation:
      "Let w = width. Length = 2w + 3. Perimeter: 2(w + 2w + 3) = 36 → 6w + 6 = 36 → w = 5.",
  },
  {
    id: 30,
    module: "math",
    prompt: "If f(x) = x² − 4x + 1, what is the value of f(5)?",
    choices: ["1", "6", "11", "26"],
    correct: 1,
    explanation: "f(5) = 25 − 20 + 1 = 6.",
  },
];

export const moduleInfo = {
  rw: { name: "Reading & Writing", short: "R&W", durationSec: 32 * 60 },
  math: { name: "Math", short: "Math", durationSec: 35 * 60 },
} as const;
