const User = require("../models/users");
const Fact = require("../models/facts");
const { getUserById, getUserByToken } = require("./users");
const fetch = require('node-fetch');

const getFacts = async ({ category, userId }) => {
  const searchParams = { status: "validated" };
  if (category) searchParams.category = category;
  if (userId) searchParams.userId = userId;

  return await Fact.find(searchParams)
    .populate("comments")
    .populate("userID")
    .sort({ validatedAt: -1 });
};

const addFactInDb = async (data) => {
  //console.log("repo - data that will be posted in the db : ", data);
  let newFact = new Fact({ ...data });

  await newFact.save();
  //console.log("repo - new fact loaded: ", newFact);
  return newFact;
};

const validateFact = async (trueRatio, interestRatio, id) => {
  try {
    let validatedFact;
    if (trueRatio >= 0.9 && interestRatio >= 0.5) {
      validatedFact = await Fact.findOneAndUpdate(
        { _id: id },
        {
          validatedAt: new Date(),
          status: "validated",
          trueRatio,
          interestRatio,
        },
        { new: true }
      );
    } else {
      validatedFact = await Fact.findOneAndUpdate(
        { _id: id },
        {
          validatedAt: new Date(),
          status: "rejected",
          trueRatio,
          interestRatio,
        },
        { new: true }
      );
    }
    return validatedFact;
  } catch (exception) {
    console.error("Error while updating fact:", exception);
  }
};

const checkFactWithAI = async (description, id) => {
  console.log(
    "repo - checking fact with Le Chat = ",
    description,
    "&& id = ",
    id
  );
  console.log("Mistral API Key:", process.env.UTS_MISTRAL_API_KEY);
console.log("Agent ID:", process.env.MISTRAL_AGENT_FACTGENERATOR_ID);
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

  //validation du fact avec le ratio
  const validatedFact = await validateFact(trueRatio, interestRatio, id);
  console.log("validatedfact =", validatedFact);
  return validatedFact;
};

const getFactById = async (id) => {
  return Fact.findById(id);
};

const updateFactWithVotes = async (voteType, voteValue, factId) => {
  return await Fact.updateOne(
    { _id: factId },
    { $inc: { [voteType]: voteValue } }
  );
};

const updateUserWithVotes = async (hasVoted, voteType, factId, userId) => {
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
};
