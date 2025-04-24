const { getFacts } = require("../repository/facts");

const searchFacts = async (req, res, next) => {
  try {
    const facts = await getFacts(req.query);
    res.json(facts);
  } catch (exception) {
    console.log(exception);
    res.status(500).json({ error: "internal Servor Error with db" });
  }
};

module.exports = { searchFacts };
