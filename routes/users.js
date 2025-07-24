var express = require("express");
var router = express.Router();

const { signin, signup,findVotesByFactForUser,updateAccount } = require("../controllers/users");

router.post("/signup", signup);
router.post("/signin", signin);
router.get("/:factId/:userId", findVotesByFactForUser);
router.put("/updateAccount",updateAccount)

module.exports = router;
