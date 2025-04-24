// une route pour get tous les facts, avec en query parameters : category

const express = require("express");
const router = express.Router();

const { searchFacts } = require("../controllers/facts");

router.get("/", searchFacts);

module.exports = router;
