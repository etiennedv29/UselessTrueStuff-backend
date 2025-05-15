const moment = require("moment");
const User = require("../models/users");
const Fact = require("../models/facts");

const getFacts = async ({ category, userId }) => {
  const searchParams = { status: "validated" };
  if (category) searchParams.category = category;
  if (userId) searchParams.userId = userId;

  console.log(category);

  return await Fact.find(searchParams).sort({ validatedAt: -1 });
};

const addFactInDb = async (data) => {
  console.log("repo - data that will be posted in the db : ", data);
  let newFact = new Fact({ ...data });

  await newFact.save();
  console.log("repo - new fact loaded: ", newFact);
  return newFact;
};

const validateFact = async (ratio, id) => {
  console.log("repo - updating fact with truth ratio");
  try {
    if (ratio >= 0.9) {
      await Fact.updateOne(
        { _id: id },
        { validatedAt: new Date(), status: "validated", trueRatio: ratio }
      );
    } else {
      await Fact.updateOne(
        { _id: id },
        { validatedAt: new Date(), status: "rejected", trueRatio: ratio }
      );
    }
  } catch (exception) {
    console.error("Error while updating fact:", exception);
  }
};

const checkFactWithAI = async (description, id) => {
  console.log("repo - checking fact with Le Chat = ", description);

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
        agent_id: process.env.MISTRAL_AGENT_ID,
      }),
    }
  );
  const truthTellerRaw = await responseLeChat.json();
  const truthTeller= JSON.parse(truthTellerRaw.choices[0].message.content)
  const trueRatio = truthTeller.trueRatio;
  const justification = truthTeller.justification
  const funRatio= truthTeller.funRatio
  console.log("repo - AI answer truthRatio = ", trueRatio);

  //validation du fact avec le ratio
  validateFact(trueRatio, id);
};

module.exports = { getFacts, addFactInDb, validateFact, checkFactWithAI };
