var express = require("express");
var router = express.Router();

const { signin, signup,findVotesByFactForUser } = require("../controllers/users");

router.post("/signup", signup);
router.post("/signin", signin);
router.get("/:factId/:userId", findVotesByFactForUser);

module.exports = router;
