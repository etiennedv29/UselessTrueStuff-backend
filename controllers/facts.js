const {
  getFacts,
  addFactInDb,
  checkFactWithAI,
  modifyVoteInDb,
  getFactById,
  factGenerationByAI,
  getTopTags,
} = require("../repository/facts");
const { getValidPicsumImage } = require("../utils/utilFunctions");
const mongoose = require("mongoose");
const { Types } = require("mongoose");
const fetch = require("node-fetch");

const searchFacts = async (req, res, next) => {
  console.log(req.query);
  try {
    const facts = await getFacts(req.query);
    res.json(facts);
  } catch (exception) {
    console.log(exception);
    res.status(500).json({ error: "internal Servor Error with db" });
  }
};

const addFact = async (req, res, next) => {
  console.log("adding fact in db controller, body == ", req.body);
  try {
    const validUrl = await getValidPicsumImage();
    req.body.image = validUrl;
    const addedFact = await addFactInDb(req.body);
    res.json(addedFact);
    return addedFact;
  } catch (exception) {
    console.log(exception);
    res.status(500).json({ error: "internal Servor Error with db" });
  }
};

const checkFact = async (req, res, next) => {
  try {
    console.log("controller - truth checking");
    const { description, id } = req.body;
    const checkedFact = await checkFactWithAI(description, id);
    res.json(checkedFact);
  } catch (exception) {
    console.log(exception);
    res
      .status(500)
      .json({ error: "internal Servor Error with AI fact checking" });
  }
};

const modifyVote = async (req, res, next) => {
  try {
    console.log("modifying vote");
    const modifiedVote = await modifyVoteInDb(
      req.body.factId,
      req.body.voteType,
      req.body.userId
    );
    res.json({ modifiedVote, updated: true });
  } catch (exception) {
    console.log(exception);
    res
      .status(500)
      .json({ error: "Internal servor error while modifying votes" });
  }
};

const dailyFactGenerator = async () => {
  try {
    // Étape 1: Générer un fait via l'IA
    console.log("Demande de génération de fait par l'IA");
    const fact = await factGenerationByAI();

    if (!fact || !fact.title || !fact.description) {
      throw new Error("Generated fact is incomplete.");
    }

    // Étape 2: Ajouter le fait dans la base de données
    const validUrl = await getValidPicsumImage();
    fact.image = validUrl; // Ajout d'une image (par exemple une image aléatoire)

    fact.submittedAt = new Date();
    fact.userID = new mongoose.Types.ObjectId("687158b82479b2f2a8cb3641");
    console.log("just before addFact in Db=", fact);
    const addedFact = await addFactInDb(fact);

    // Étape 3: Vérification du fait avec l'IA

    const checkedFact = await checkFactWithAI(fact.description, addedFact.id);
    console.log("Fait Vérifié");
    // Si le fait est validé par l'IA, mettre à jour son statut
    if (checkedFact.status === "validated") {
      // On pourrait ajouter une logique ici pour mettre à jour un champ dans la DB si nécessaire
      console.log("Fact validated:", checkedFact);
      return checkedFact; // Retourner le fait validé
    } else {
      // Si le fait n'est pas validé, on peut tenter de le régénérer ou de prendre des actions
      console.log("Fact rejected. Regenerating...");

      // Tentative de régénération du fait (en appelant à nouveau dailyFactGenerator ou en boucle)
      return await dailyFactGenerator(); // Répéter la génération et la validation
    }
  } catch (exception) {
    console.log("Error during daily fact generation:", exception);
    throw new Error("Failed to generate or validate daily fact.");
  }
};

const topTags = async (req, res) => {
  try {
    const topCategories = await getTopTags();
    res.json(topCategories);
  } catch (exception) {
    console.error(exception);
    res.status(500).send("Erreur serveur recherche top categories");
  }
};

module.exports = {
  addFact,
  searchFacts,
  checkFact,
  modifyVote,
  dailyFactGenerator,
  topTags,
};
