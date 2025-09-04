var express = require("express");
var router = express.Router();

const { signin, signup,findVotesByFactForUser,updateAccount,deleteAccount} = require("../controllers/users");

router.post("/signup", signup);
router.post("/signin", signin);
router.get("/:factId/:userId", findVotesByFactForUser);
router.put("/updateAccount",updateAccount)
router.post("/softDelete", deleteAccount)

module.exports = router;
