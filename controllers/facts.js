const { getFacts,addFactInDb } = require("../repository/facts");

const searchFacts = async (req, res, next) => {
  try {
    const facts = await getFacts(req.query);
    res.json(facts);
  } catch (exception) {
    console.log(exception);
    res.status(500).json({ error: "internal Servor Error with db" });
  }
};

const addFact = async (req, res, next) => {
  try{
    console.log("adding fact")
    console.log(req.body)
    const addedFact = await addFactInDb(req.body)
    res.json(addedFact)
  }
  catch(exception) {
    console.log(exception);
    res.status(500).json({ error: "internal Servor Error with db" })
  }
} 

module.exports = { addFact, searchFacts };
