// une route pour get tous les facts, avec en query parameters : category

const express = require("express");
const router = express.Router();

const { searchFacts,addFact } = require("../controllers/facts");

router.get("/", searchFacts);
router.post("/addFact", addFact);

module.exports = router;
