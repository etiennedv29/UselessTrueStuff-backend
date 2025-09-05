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

const getUserByResetToken = async (resetPasswordToken )=>{
  return await User.findOne({resetPasswordToken})
}

const userSignup = async ({
  firstName,
  lastName,
  username,
  email,
  password,
  connectionWithSocials,
}) => {
  console.log("dans userSignup", {
    firstName,
    password,
    email,
    connectionWithSocials,
  });
  const hash = bcrypt.hashSync(password, 10);

  const newUser = new User({
    firstName,
    lastName,
    username,
    email,
    password: hash,
    token: uid2(32),
    connectionWithSocials,
  });

  return await newUser.save();
};

const checkToken = async (token) => {
  const user = await User.findOne({ token });
  console.log(user, !!user);
  return !!user;
};

const updateUserAccount = async (infos) => {
  console.log({infos})
  try {
    const {
      id = infos.userId,
      username,
      email,
      resetPasswordToken,
      resetPasswordTokenExpirationDate,
      password,
    } = infos;
    const updateFields = {};

    if ('username' in infos) updateFields.username = username;
    if ('email' in infos) updateFields.email = email;
    if ('resetPasswordToken' in infos) updateFields.resetPasswordToken = resetPasswordToken;
    if ('resetPasswordTokenExpirationDate' in infos) updateFields.resetPasswordTokenExpirationDate = resetPasswordTokenExpirationDate;
    if ('password' in infos) updateFields.password = password;

    if (id) {
      const updatedUser = await User.findOneAndUpdate(
        { _id: id },
        { $set: updateFields },
        { new: true } // renvoie le document modifié
      );
      return updatedUser;
    } else if (email) {

      const updatedUser = await User.findOneAndUpdate(
        { email: email },
        { $set: updateFields },
        { new: true } // renvoie le document modifié
      );
      return updatedUser;
    }
  } catch (exception) {
    res.status(500).json({ error: "Database Error while updating account" });
  }
};

const softDeleteUserById = async (userId) => {
  console.log("repo softDeleting by userId, userId = ", userId);
  try {
    const result = await User.findByIdAndUpdate(
      userId,
      {
        username: "Un 👻 du passé",
        email: null,
        firstName: null,
        lastName: null,
        password: null,
        token: null,
      },
      { new: true } // Retourne le document mis à jour
    );
    return result !== null; // true si mis à jour, false si introuvable
  } catch (error) {
    console.error("Erreur :", error);
    return false;
  }
};

module.exports = {
  userSignup,
  checkToken,
  getUserByUsername,
  getUserByEmail,
  getUserByToken,
  getUserByResetToken,
  getUserById,
  updateUserAccount,
  softDeleteUserById,
};
