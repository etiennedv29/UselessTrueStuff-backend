// une route pour get tous les facts, avec en query parameters : category

const express = require("express");
const router = express.Router();

const { searchFacts,addFact,checkFact } = require("../controllers/facts");

router.get("/:category?/:userId?", (req, res) => searchFacts(req, res));
router.post("/addFact", addFact);
router.post("/checkFact", checkFact)


module.exports = router;
