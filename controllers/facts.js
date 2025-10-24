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
const { sendEmailSafe } = require("../utils/emails");
const mongoose = require("mongoose");
const { Types } = require("mongoose");

const searchFacts = async (req, res, next) => {
  console.log("facts controller - searchFacts with query = ", req.query);
  try {
    const offset = parseInt(req.query.offset) || 0;
    const limit = parseInt(req.query.limit) || 20;
    const tags = req.query.tags || "";

    // Valider que offset et limit sont des nombres positifs
    if (isNaN(offset) || isNaN(limit) || offset < 0 || limit < 1) {
      return res
        .status(400)
        .json({ error: "offset et limit doivent être des entiers positifs" });
    }

    const facts = await getFacts({
      userId: req.query.userId,
      factId: req.query.factId,
      tags: req.query.tags,
      offset,
      limit,
    });
    // Log pour débogage
    console.log(
      `Retourne ${facts.length} facts (offset: ${offset}, limit: ${limit})`
    );
    res.json(facts);
  } catch (exception) {
    console.log(exception);
    res.status(500).json({ error: "internal Servor Error with db" });
  }
};

const addFact = async (req, res, next) => {
  console.log("facts controller - addFact");
  try {
    //on récupère une image
    const validUrl = await getValidPicsumImage();
    req.body.image = validUrl;
    //ajout du fait en db
    const addedFact = await addFactInDb(req.body);

    //début de la vérification
    //fonction checkFact sans await, pas besoin de l'attendre.
    checkFact(addedFact).catch((err) =>
      console.error("Erreur checkFact interne:", err)
    );

    res.json(addedFact);
    return addedFact;
  } catch (exception) {
    console.log(exception);
    res.status(500).json({ error: "internal Servor Error with db" });
  }
};

//fonction seule pour vérifier les facts
const checkFact = async (factToCheck) => {
  console.log("facts controller - checkFact function");
  try {
    const { description, _id } = factToCheck; // factToCheck vient de Mongo, donc c’est `_id`
    const checkedFact = await checkFactWithAI(description, _id);

    //email en prévision de l'envoi du mail
    let email =
      checkedFact.userID.username === "dailyFact"
        ? "edevalmont@gmail.com"
        : checkedFact.userID.email;

    //vérification RGPD de l'envoi du mail
    if (checkedFact.userID.preferences.dailyFactUpdateNotification === true) {
      if (checkedFact.status === "validated") {
        sendEmailSafe({
          to: email,
          type: "info_validated",
          ctx: {
            username: checkedFact.userID.username,
            title: checkedFact.title,
            factUrl: `https://www.uselesstruestuff.info/facts/${checkedFact._id}`,
          },
        });
      } else if (checkedFact.status === "rejected") {
        sendEmailSafe({
          to: checkedFact.userID.email,
          type: "info_rejected",
          ctx: {
            username: checkedFact.userID.username,
            title: checkedFact.title,
            reason:
              checkedFact.justification ||
              "Pas assez vrai, ou pas assez intéressant",
          },
        });
      }
    }

    return checkedFact; //Pas de res.json, c'est une fonction interne
  } catch (exception) {
    console.error("Erreur checkFact:", exception);
    throw exception; // remonte l'erreur à addFact si besoin
  }
};

//OLD : route qui n'est plus utilisée car la vérification des facts se fait dans addFact
const checkFactFunction = async (req, res, next) => {
  console.log("facts controller - checkFact");
  try {
    const { description, id } = req.body;
    const checkedFact = await checkFactWithAI(description, id);

    //Prise en compte du cas où le fact est generated par dailyFact (sans mail)
    let email = "";

    if (checkedFact.userID.username === "dailyFact") {
      email = "edevalmont@gmail.com";
    } else {
      email = checkedFact.userID.email;
    }

    // vérification que l'utilisateur est OK pour les notifications par mail
    if (checkedFact.userID.preferences.dailyFactUpdateNotification === true) {
      if (checkedFact.status === "validated") {
        //envoi de la validation par mail
        sendEmailSafe({
          to: email,
          type: "info_validated",
          ctx: {
            username: checkedFact.userID.username,
            title: checkedFact.title,
            factUrl: `https://www.uselesstruestuff.info/facts/${checkedFact._id}`,
          },
        });
      } else if (checkedFact.status === "rejected") {
        //envoi du rejet par mail
        sendEmailSafe({
          to: checkedFact.userID.email,
          type: "info_rejected",
          ctx: {
            username: checkedFact.userID.username,
            title: checkedFact.title,
            reason:
              checkedFact.justification ||
              "Pas assez vrai, ou pas assez intéressant",
          },
        });
      }
    }
    // dans tous les cas on retourne le checkedFact
    res.json(checkedFact);
  } catch (exception) {
    console.log(exception);
    res
      .status(500)
      .json({ error: "internal Servor Error with AI fact checking" });
  }
};

const modifyVote = async (req, res, next) => {
  console.log("facts Controller - modifyVote");
  try {
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

const dailyFactGenerator = async (attempt = 1) => {
  try {
    // Étape 1: Générer un fait via l'IA
    console.log("Demande de génération de fait par l'IA");
    const fact = await factGenerationByAI();
    console.log("IA generated fact = ", fact);
    if (!fact || !fact.title || !fact.description) {
      throw new Error("Generated fact is incomplete.");
    }

    // Étape 2: Ajouter le fait dans la base de données
    const validUrl = await getValidPicsumImage();
    fact.image = validUrl; // Ajout d'une image (par exemple une image aléatoire)

    fact.submittedAt = new Date();
    fact.userID = new mongoose.Types.ObjectId("687158b82479b2f2a8cb3641");
    console.log("just before addFact in Db=", fact);
    if (fact.title.length > 33) {
      console.log(
        "le titre est trop long, longueur : ",
        fact.title.length,
        " caractères"
      );
      return dailyFactGenerator();
    }

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
    if (attempt < 2) {
      console.log("Echec tentative #1 dailyFactGenerator");
      return dailyFactGenerator(attempt + 1);
    } else {
      console.log("Echec tentative #2 dailyFactGenerator. Abort. ");
      throw new Error("Failed to generate or validate daily fact.");
    }
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
  checkFactFunction,
  modifyVote,
  dailyFactGenerator,
  topTags,
};
