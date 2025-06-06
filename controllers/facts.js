const {
  getFacts,
  addFactInDb,
  checkFactWithAI,
  modifyVoteInDb,
  getFactById,
} = require("../repository/facts");

const searchFacts = async (req, res, next) => {
  try {
    const facts = await getFacts(req.params);
    res.json(facts);
  } catch (exception) {
    console.log(exception);
    res.status(500).json({ error: "internal Servor Error with db" });
  }
};



const addFact = async (req, res, next) => {
  try {
    console.log("adding fact");
    console.log(req.body);
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
    console.log("controller truth checking");
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
module.exports = { addFact, searchFacts, checkFact, modifyVote };
