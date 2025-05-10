const {
  userSignup,
  getUserByUsername,
  getUserByEmail,
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
      res.json({ token, username, firstName, _id });
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
        username: user.username,
        firstName: user.firstName,
      });
    } else {
      res.json.status(401).json({ error: "User not found or wrong password" });
    }
  } catch (exception) {
    console.log(exception);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = { signup, signin };
