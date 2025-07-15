const {
  userSignup,
  getUserByUsername,
  getUserByEmail,
  getUserById,
} = require("../repository/users");
const { checkBody } = require("../utils/utilFunctions");
const bcrypt = require("bcrypt");

const signup = async (req, res, next) => {
  try {
    if (
      !req.body.connectionWithSocials &&
      !checkBody(req.body, [
        "username",
        "password",
        "firstName",
        "lastName",
        "email",
      ])
    ) {
      return res.status(400).json({ error: "Missing or empty fields" });
    }

    const user = await getUserByUsername(req.body.username.toLowerCase());
    const checkedemail = await getUserByEmail(req.body.email.toLowerCase());


    if (user === null && checkedemail === null) {
      const userObject = await userSignup(req.body);
      res.json(userObject);
    } else {
      res.status(409).json({ error: "User already exists" });
    }
  } catch (exception) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const signin = async (req, res, next) => {

  try {
    if (
      !req.body.connectionWithSocials &&
      !checkBody(req.body, ["email", "password"])
    ) {
      return res.status(400).json({ error: "Missing or empty fields" });
    }

    const user = await getUserByEmail(req.body.email.toLowerCase());

    if (
      user &&
      user.connectionWithSocials === false &&
      bcrypt.compareSync(req.body.password, user.password)
    ) {
      res.json(user);
    } else if (user && user.connectionWithSocials === true) {
      res.json(user);
    } else {
      res.status(401).json({ error: "User not found or wrong password" });
    }
  } catch (exception) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const findVotesByFactForUser = async (req, res, next) => {
  console.log("params findVotesByFactForUser = ", req.params);
  try {
    const user = await getUserById(req.params.userId);
    let votePlusCheck = user.votePlus?.some(
      (id) => id.toString() === req.params.factId
    );
    let voteMinusCheck = user.voteMinus?.some(
      (id) => id.toString() === req.params.factId
    );
    console.log({ votePlusCheck });
    console.log({ voteMinusCheck });

    res.json({ votePlusCheck, voteMinusCheck });
  } catch (exception) {
    console.log(exception);
    res.status(500).json({ error: "internal Servor Error with db" });
  }
};

module.exports = { signup, signin, findVotesByFactForUser };
