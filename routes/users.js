var express = require("express");
var router = express.Router();

const {
  signin,
  signup,
  findVotesByFactForUser,
  updateAccount,
  deleteAccount,
  resetPassword,
} = require("../controllers/users");

router.post("/signup", signup);
router.post("/signin", signin);
router.get("/:factId/:userId", findVotesByFactForUser);
router.put("/updateAccount", updateAccount);
router.post("/softDelete", deleteAccount);
router.post("/resetPassword", resetPassword);

module.exports = router;
