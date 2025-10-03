// une route pour get tous les facts, avec en query parameters : category

const express = require("express");
const router = express.Router();

const {
  searchFacts,
  addFact,
  checkFact,
  modifyVote,
  findVotesByFactForUser,
  topTags,
} = require("../controllers/facts");

const { verifyAccessToken } = require("../middlewares/authMiddlewares");

router.get("/topTags", topTags);
router.get("/search", (req, res) => searchFacts(req, res));
router.post("/addFact", verifyAccessToken, addFact);
router.post("/checkFact", checkFact);
router.post("/modifyLikes", verifyAccessToken, modifyVote);

module.exports = router;
