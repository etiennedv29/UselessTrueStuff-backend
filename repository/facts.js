const User = require("../models/users");
const Fact = require("../models/facts");
const { getUserById, getUserByToken } = require("./users");
const fetch = require("node-fetch");
const mongoose = require("mongoose");
const { Types } = require("mongoose");

const getFacts = async ({ userId, factId, tags, offset, limit }) => {
  console.log("repo - getFacts with params:", {
    userId,
    factId,
    tags,
    offset,
    limit,
  });

  const searchParams = { status: "validated" };
  if (tags) searchParams.tags = tags;
  if (userId) searchParams.userID = new mongoose.Types.ObjectId(userId);
  if (factId) searchParams._id = factId;
  if (!limit) limit = 200;
  if (!offset) offset = 0;

  return await Fact.find(searchParams)
    .populate("comments")
    .populate("userID")
    .populate("comments.author")
    .sort({ validatedAt: -1 })
    .skip(offset) // Sauter les 'offset' premiers résultats
    .limit(limit); // Limiter à 'limit' résultats
};

const addFactInDb = async (data) => {
  console.log(
    "facts repo - addFactInDb : ",
    data?.description.slice(0, 30),
    "..."
  );
  let newFact = new Fact({ ...data });
  await newFact.save();
  return newFact;
};

const validateFact = async (
  trueRatio,
  interestRatio,
  justification,
  tags,
  id
) => {
  console.log("facts repo - validateFact");
  try {
    //constantes
    const trueRatioThreshold = 0.9;
    const interestRatioThreshold = 0.5;
    //définition de validation
    const factValidation =
      trueRatio >= trueRatioThreshold &&
      interestRatio >= interestRatioThreshold;
    //fonction d'update du fact actuellement en statut "pending"
    const findFactAndUpdate = async (status) => {
      const updatedFact = await Fact.findOneAndUpdate(
        { _id: id },
        {
          validatedAt: new Date(),
          status,
          trueRatio,
          interestRatio,
          justification,
          tags,
        },
        { new: true }
      );
      return updatedFact.populate("userID");
    };
    let validatedFact;
    if (factValidation) {
      validatedFact = await findFactAndUpdate("validated");
    } else {
      validatedFact = await findFactAndUpdate("rejected");
    }
    return validatedFact;
  } catch (exception) {
    console.error("Error while updating fact:", exception);
  }
};

const checkFactWithAI = async (description, id) => {
  console.log(
    "facts repo - checking fact with AI = ",
    description.slice(0, 30),
    "...",
    " && id = ",
    id
  );
  const responseLeChat = await fetch(
    "https://api.mistral.ai/v1/agents/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.UTS_MISTRAL_API_KEY}`,
      },
      body: JSON.stringify({
        messages: [
          {
            role: "user",
            content: description,
          },
        ],
        agent_id: process.env.MISTRAL_AGENT_TRUTHCHECKER_ID,
      }),
    }
  );
  if (!responseLeChat.ok) {
    const errorText = await responseLeChat.text();
    console.error("❌ Mistral Error body fact verification:\n", errorText);
    throw new Error(`Mistral API error ${responseLeChat.status}`);
  }
  const truthTellerRaw = await responseLeChat.json();

  const truthTeller = JSON.parse(truthTellerRaw.choices[0].message.content);
  const trueRatio = truthTeller.trueRatio;
  const justification = truthTeller.justification;
  const interestRatio = truthTeller.interestRatio;
  const tags = truthTeller.tags;

  //validation du fact avec le ratio
  const validatedFact = await validateFact(
    trueRatio,
    interestRatio,
    justification,
    tags,
    id
  );
  //console.log("validatedfact =", validatedFact);
  return validatedFact;
};

const getFactById = async (id) => {
  console.log("facts repo - fetFactById");
  return Fact.findById(id);
};

const updateFactWithVotes = async (voteType, voteValue, factId) => {
  console.log("facts repo - updateFactWithVotes");
  return await Fact.updateOne(
    { _id: factId },
    { $inc: { [voteType]: voteValue } }
  );
};

const updateUserWithVotes = async (hasVoted, voteType, factId, userId) => {
  console.log("facts repo - updateUserWithVotes");
  if (hasVoted === true) {
    return await User.updateOne(
      { _id: userId },
      { $pull: { [voteType]: factId } }
    );
  } else if (hasVoted === false) {
    await User.updateOne({ _id: userId }, { $push: { [voteType]: factId } });
  }
};

const modifyVoteInDb = async (factId, voteType, userId) => {
  console.log("facts repo - modifyVoteInDb");
  let userToCheck = await getUserById(userId);
  let userHasAlreadyVoted = userToCheck[voteType]?.some(
    (id) => id.toString() === factId
  );

  //ajuster la valeur de la mise à jour
  let voteValue;
  if (voteType === "votePlus" && !userHasAlreadyVoted) {
    voteValue = 1;
    updateFactWithVotes(voteType, voteValue, factId);
    updateUserWithVotes((hasVoted = false), voteType, factId, userId);
  } else if (voteType === "votePlus" && userHasAlreadyVoted) {
    voteValue = -1;
    updateFactWithVotes(voteType, voteValue, factId);
    updateUserWithVotes((hasVoted = true), voteType, factId, userId);
  } else if (voteType === "voteMinus" && !userHasAlreadyVoted) {
    voteValue = -1;
    updateFactWithVotes(voteType, voteValue, factId);
    updateUserWithVotes((hasVoted = false), voteType, factId, userId);
  } else if (voteType === "voteMinus" && userHasAlreadyVoted) {
    voteValue = 1;
    updateFactWithVotes(voteType, voteValue, factId);
    updateUserWithVotes((hasVoted = true), voteType, factId, userId);
  }

  return;
};

const factGenerationByAI = async () => {
  console.log("repo facts - factGenerationByAI");
  //liste des thèmes possibles :
  const themeList = [
    "Ecologie",
    "Conspiration",
    "Animaux",
    "Astronomie",
    "Corps",
    "Histoire",
    "Science",
    "Technologie",
    "Geographie",
    "Culture",
    "Cinema",
    "Musique",
    "Livre",
    "Art",
    "Sport",
    "Nourriture",
    "Boisson",
    "Voyage",
    "Nature",
    "Environnement",
    "Invention",
    "Decouverte",
    "Espace",
    "Planete",
    "Etoile",
    "Galaxie",
    "Meteo",
    "Montagne",
    "Foret",
    "Desert",
    "Ville",
    "Pays",
    "Monument",
    "Chateau",
    "Musee",
    "Tradition",
    "Fete",
    "Mythologie",
    "Religion",
    "Langue",
    "Phrase",
    "Auteur",
    "Peintre",
    "Sculpture",
    "Photo",
    "Danse",
    "Theatre",
    "Opera",
    "Instrument",
    "Chanson",
    "Groupe",
    "Acteur",
    "Realisateur",
    "Film",
    "Serie",
    "Jeu",
    "Jouet",
    "Vetement",
    "Accessoire",
    "Bijou",
    "Parfum",
    "Voiture",
    "Avion",
    "Bateau",
    "Train",
    "Velo",
    "Moto",
    "Architecture",
    "Design",
    "Meuble",
    "Decoration",
    "Jardin",
    "Plante",
    "Fleur",
    "Arbre",
    "Fruit",
    "Legume",
    "Epice",
    "Fromage",
    "Vin",
    "Biere",
    "Cocktail",
    "Dessert",
    "Chocolat",
    "Cafe",
    "The",
    "Recette",
    "Chef",
    "Restaurant",
    "Hotel",
    "Plage",
    "Ski",
    "Parc",
    "Zoo",
    "Aquarium",
    "Cirque",
    "Magie",
    "Humour",
    "Devinette",
    "Illusion",
    "Reve",
    "Croyance",
    "Superstition",
    "Fantome",
    "Monstre",
    "Legende",
    "Conte",
    "Fable",
    "Heros",
    "Mechant",
    "Pirate",
    "Chevalier",
    "Samourai",
    "Ninja",
    "Espion",
    "Detective",
    "Policier",
    "Mystere",
    "Aventure",
    "Fiction",
    "Fantasy",
    "Horreur",
    "Romance",
    "Poesie",
    "Proverbe",
    "Citation",
    "Discours",
    "Politique",
    "Economie",
    "Finance",
    "Entreprise",
    "Startup",
    "Metier",
    "Psychologie",
    "Sociologie",
    "Philosophie",
    "Education",
    "Universite",
    "Recherche",
    "Innovation",
    "Robot",
    "Intelligence",
    "Securite",
    "Reseau",
    "Internet",
    "Site",
    "Application",
    "Logiciel",
    "Materiel",
    "Gadget",
    "Telephone",
    "Ordinateur",
    "Tablette",
    "Video",
    "Audio",
    "Television",
    "Radio",
    "Journal",
    "Magazine",
    "LivreNumerique",
    "Streaming",
    "Podcast",
    "Blog",
    "Influenceur",
    "Communaute",
    "Amitie",
    "Amour",
    "Famille",
    "Enfant",
    "Adolescent",
    "Adulte",
    "Sante",
    "Medecine",
    "Bien-etre",
    "Fitness",
    "Yoga",
    "Meditation",
    "Nutrition",
    "Regime",
    "Beaute",
    "Soin",
    "Maquillage",
    "Coiffure",
    "Chapeau",
    "Echarpe",
    "Gant",
    "Ceinture",
    "Cravate",
    "Lunette",
    "Montre",
    "Sac",
    "Chaussure",
    "Mignon",
    "Emotion",
    "Paysage",
    "Riviere",
    "Ecriture",
    "Documentaire",
    "Evenement",
    "Celebration",
    "Collection",
    "Japon",
    "Inde",
    "Etats-Unis",
    "Bresil",
    "Italie",
    "Australie",
    "Egypte",
    "Chine",
    "Russie",
    "Allemagne",
    "France",
    "Royaume-Uni",
    "Canada",
    "Mexique",
    "Afrique du Sud",
    "Grece",
    "Islande",
    "Nouvelle-Zelande",
    "Suisse",
    "Espagne",
    "Albert Einstein",
    "Marie Curie",
    "Isaac Newton",
    "Charles Darwin",
    "Nikola Tesla",
    "Stephen Hawking",
    "Leonardo da Vinci",
    "Vincent van Gogh",
    "Pablo Picasso",
    "Michelangelo",
    "William Shakespeare",
    "Ernest Hemingway",
    "J.K. Rowling",
    "Mark Twain",
    "F. Scott Fitzgerald",
    "George Orwell",
    "Sigmund Freud",
    "Carl Jung",
    "Friedrich Nietzsche",
    "Jean-Paul Sartre",
    "Socrate",
    "Platon",
    "Albert Camus",
    "Mahatma Gandhi",
    "Nelson Mandela",
    "Martin Luther King Jr.",
    "Winston Churchill",
    "Abraham Lincoln",
    "Charles de Gaulle",
    "Angela Merkel",
    "Margaret Thatcher",
    "Franklin D. Roosevelt",
    "John F. Kennedy",
    "Vladimir Poutine",
    "Barack Obama",
    "Donald Trump",
    "Adolf Hitler",
    "Joseph Stalin",
    "Napoleon Bonaparte",
    "Alexander le Grand",
    "Cleopatre",
    "Jules Cesar",
    "Gengis Khan",
    "Thomas Edison",
    "Henry Ford",
    "Steve Jobs",
    "Bill Gates",
    "Elon Musk",
    "Jeff Bezos",
    "Larry Page",
    "Sergey Brin",
    "Mark Zuckerberg",
    "Tim Berners-Lee",
    "Richard Branson",
    "Coco Chanel",
    "Yves Saint Laurent",
    "Alexander McQueen",
    "Karl Lagerfeld",
    "Audrey Hepburn",
    "Marilyn Monroe",
    "James Dean",
    "Humphrey Bogart",
    "Cary Grant",
    "Leonardo DiCaprio",
    "Tom Hanks",
    "Meryl Streep",
    "Johnny Depp",
    "Robert Downey Jr.",
    "Will Smith",
    "Quentin Tarantino",
    "Steven Spielberg",
    "Alfred Hitchcock",
    "Martin Scorsese",
    "Ridley Scott",
    "Bruce Lee",
    "Muhammad Ali",
    "Michael Jordan",
    "Serena Williams",
    "Cristiano Ronaldo",
    "Lionel Messi",
    "Usain Bolt",
    "Michael Phelps",
    "Pele",
    "Audrey Tautou",
    "Cate Blanchett",
    "Natalie Portman",
    "Emma Watson",
    "Kate Winslet",
    "Lady Gaga",
    "Beyonce",
    "Madonna",
    "Elvis Presley",
    "Michael Jackson",
    "The Beatles",
    "David Bowie",
    "Bob Dylan",
    "Jimi Hendrix",
    "Freddie Mercury",
    "Tupac Shakur",
    "Mozart",
  ];
  // Fonction pour obtenir N éléments aléatoires sans doublons
  // function shuffle(array) {
  //   const arr = [...array];
  //   for (let i = arr.length - 1; i > 0; i--) {
  //     const j = Math.floor(Math.random() * (i + 1));
  //     [arr[i], arr[j]] = [arr[j], arr[i]];
  //   }
  //   return arr;
  // }
  // // On prend les n=5 premier
  // const themesToday = shuffle(themeList).slice(0,5);

  //Fonction pour ne choisir qu'un élément random
  function getRandomElement(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }
  const themeToday = getRandomElement(themeList);
  console.log("thème du jour : ", themeToday);
  try {
    const responseLeChat = await fetch(
      "https://api.mistral.ai/v1/agents/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.UTS_MISTRAL_API_KEY}`,
        },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: `${process.env.FACT_GENERATION_PROMPT} ${themeToday}`,
            },
          ],
          agent_id: process.env.MISTRAL_AGENT_FACTGENERATOR_ID,
        }),
      }
    );
    console.log("responseLeChat = ", responseLeChat);
    if (!responseLeChat.ok) {
      const errorText = await responseLeChat.text();
      console.error("❌ Mistral Error body fact generator:\n", errorText);
      throw new Error(`Mistral API error ${responseLeChat.status}`);
    } else {
      const factGeneratedRaw = await responseLeChat.json();
      console.log(
        "json of ResponseLeChat - factGeneratedRaw = ",
        factGeneratedRaw
      );
      const factGenerated = JSON.parse(
        factGeneratedRaw.choices[0].message.content
      );
      const factGeneratedTitle = factGenerated.title;
      const factGeneratedDescription = factGenerated.description;
      return {
        title: factGeneratedTitle,
        description: factGeneratedDescription,
      };
    }
  } catch (exception) {
    console.error("Error while generating fact:", exception);
  }
};

const getTopTags = async () => {
  const topTags = await Fact.aggregate([
    { $match: { status: "validated" } }, // Filtre les faits validés
    { $unwind: "$tags" }, // Déplie le tableau des catégories
    { $match: { tags: { $ne: {} } } }, // Filtre les éléments vides {}
    { $group: { _id: "$tags", count: { $sum: 1 } } }, // Groupe par catégorie et compte les occurrences
    { $sort: { count: -1 } }, // Trie par fréquence (du plus grand au plus petit)
    { $limit: 5 }, // Limite aux 5 premières catégories
  ]);

  return topTags.map((tag) => tag._id);
};

const updateFactImage = async (factId, url) => {
  console.log("facts repo - updateFactImage - ", factId);
  try {
    // Utilisation de findOneAndUpdate pour renvoyer l'objet mis à jour
    const updatedFact = await Fact.findOneAndUpdate(
      { _id: factId },
      { $set: { image: url } },
      { new: true } // ✅ renvoie l'objet après mise à jour
    );

    if (!updatedFact) {
      throw new Error(
        `facts repository - updateFactImage - factId non trouvé : ${factId}`
      );
    }

    return updatedFact;
  } catch (error) {
    console.error("Erreur lors de facts repositoy - updateFactImage :", error);
    throw new Error(
      "Erreur en base de données lors de la mise à jour de l'image"
    );
  }
};

module.exports = {
  getFacts,
  addFactInDb,
  validateFact,
  checkFactWithAI,
  modifyVoteInDb,
  getFactById,
  updateUserWithVotes,
  updateFactWithVotes,
  factGenerationByAI,
  getTopTags,
  updateFactImage,
};
