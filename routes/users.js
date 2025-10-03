var express = require("express");
var router = express.Router();

const {
  signin,
  signup,
  findVotesByFactForUser,
  updateAccount,
  deleteAccount,
  forgotPassword,
  resetPassword,
  refreshTokens
} = require("../controllers/users");
const {verifyAccessToken} = require ("../middlewares/authMiddlewares")

router.post("/signup", signup);
router.post("/signin", signin);
router.get("/:factId/:userId", findVotesByFactForUser);
router.put("/updateAccount",verifyAccessToken, updateAccount);
router.post("/softDelete",verifyAccessToken, deleteAccount);
router.post("/forgotPassword", forgotPassword);
router.post("/resetPassword", resetPassword)
router.post("/refresh", refreshTokens);

module.exports = router;
