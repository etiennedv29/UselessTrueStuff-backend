const User = require("../models/users");
const Fact = require("../models/facts");
const { getUserById, getUserByToken } = require("./users");
const fetch = require("node-fetch");
const mongoose = require("mongoose");
const { Types } = require("mongoose");
const { sendEmailSafe } = require("../utils/emails");

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

  console.log({ searchParams });

  return await Fact.find(searchParams)
    .populate("comments")
    .populate("userID")
    .populate("comments.author")
    .sort({ validatedAt: -1 })
    .skip(offset) // Sauter les 'offset' premiers résultats
    .limit(limit); // Limiter à 'limit' résultats
};

const addFactInDb = async (data) => {
  console.log("facts repo - addFactInDb : ", data?.description.slice(0, 30), "...");
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
  console.log("repo facts - factGenerationByAI")
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
              content: process.env.FACT_GENERATION_PROMPT,
            },
          ],
          agent_id: process.env.MISTRAL_AGENT_FACTGENERATOR_ID,
        }),
      }
    );
    console.log("responseLeChat = ", responseLeChat)
    if (!responseLeChat.ok) {
      const errorText = await responseLeChat.text();
      console.error("❌ Mistral Error body fact generator:\n", errorText);
      throw new Error(`Mistral API error ${responseLeChat.status}`);
    } else {
      const factGeneratedRaw = await responseLeChat.json();
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
};
