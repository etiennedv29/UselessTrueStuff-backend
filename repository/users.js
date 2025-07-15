const User = require("../models/users");
const Fact = require("../models/facts");
const bcrypt = require("bcrypt");
const uid2 = require("uid2");

const getUserByUsername = async (username) => {
  return await User.findOne({
    username: { $regex: new RegExp("^" + username + "$", "i") },
  });
};

const getUserByEmail = async (email) => {
  return await User.findOne({
    email: { $regex: new RegExp("^" + email + "$", "i") },
  });
};

const getUserById = async (id) => {
  return await User.findById(id);
};

const getUserByToken = async (token) => {
  return await User.findOne({ token });
};

const userSignup = async ({
  firstName,
  lastName,
  username,
  email,
  password,
  connectionWithSocials
}) => {
  const hash = bcrypt.hashSync(password, 10);

  const newUser = new User({
    firstName,
    lastName,
    username,
    email,
    password: hash,
    token: uid2(32),
    connectionWithSocials
  });

  return await newUser.save();
};

const checkToken = async (token) => {
  const user = await User.findOne({ token });
  console.log(user, !!user);
  return !!user;
};

module.exports = {
  userSignup,
  checkToken,
  getUserByUsername,
  getUserByEmail,
  getUserByToken,
  getUserById,
};
