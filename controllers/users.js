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
      const { token, username, firstName, _id } = await userSignup(req.body);
      res.json({ token, username, firstName, _id,votePlus,voteMinus });
    } else {
      res.status(409).json({ error: "User already exists" });
    }
  } catch (exception) {
    console.log(exception);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const signin = async (req, res, next) => {
  try {
    if (!checkBody(req.body, ["email", "password"])) {
      return res.status(400).json({ error: "Missing or empty fields" });
    }

    const user = await getUserByEmail(req.body.email.toLowerCase());

    if (user && bcrypt.compareSync(req.body.password, user.password)) {
      res.json({
        token: user.token,
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        votePlus:user.votePlus,
        voteMinus:user.voteMinus,
      });
    } else {
      res.json.status(401).json({ error: "User not found or wrong password" });
    }
  } catch (exception) {
    console.log(exception);
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
