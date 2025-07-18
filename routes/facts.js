// une route pour get tous les facts, avec en query parameters : category

const express = require("express");
const router = express.Router();

const {
  searchFacts,
  addFact,
  checkFact,
  modifyVote,
  findVotesByFactForUser,
  topTags
} = require("../controllers/facts");

router.get("/topTags", topTags);
router.get("/search/:category?/:userId?", (req, res) => searchFacts(req, res));
router.post("/addFact", addFact);
router.post("/checkFact", checkFact);
router.post("/modifyLikes", modifyVote);



module.exports = router;
