const {
  getFacts,
  addFactInDb,
  checkFactWithAI,
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
module.exports = { addFact, searchFacts, checkFact };
