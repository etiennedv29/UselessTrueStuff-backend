const User = require("../models/users");
const Fact = require("../models/facts");
const bcrypt = require("bcrypt");
const uid2 = require("uid2");

const getUserByUsername = async (username) => {
  console.log("users repo - getUserByUsername");
  return await User.findOne({
    username: { $regex: new RegExp("^" + username + "$", "i") },
  });
};
// Échappe tous les caractères spéciaux pour les expressions régulières
const escapeRegex = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const getUserByEmail = async (email) => {
  console.log("users repo - getUserByEmail - ", email);
  // Recherche insensible à la casse d'un utilisateur par email exact
  return await User.findOne({
    email: new RegExp(`^${escapeRegex(email)}$`, "i"),
  });
};

const getUserById = async (id) => {
  console.log("users repo - getUserById");
  return await User.findById(id);
};

const getUserByToken = async (token) => {
  console.log("users repo - getUserByToken");
  return await User.findOne({ token });
};

const getUserByResetToken = async (resetPasswordToken) => {
  console.log("users repo - get UserByResetToken");
  return await User.findOne({ resetPasswordToken });
};

const userSignup = async ({
  firstName,
  lastName,
  username,
  email,
  password,
  connectionWithSocials,
  accessToken,
  accessTokenExpirationDate,
  refreshToken,
  refreshTokenExpirationDate,
}) => {
  console.log("users repo - userSignup : ", {
    firstName,
    email,
  });
  const hash = bcrypt.hashSync(password, 10);
  const socialConnectionProvider = connectionWithSocials ? "Google" : null;
  const newUser = new User({
    firstName,
    lastName,
    username,
    email,
    password: hash,
    token: uid2(32),
    connectionWithSocials,
    socialConnectionProvider,
    accessToken,
    accessTokenExpirationDate,
    refreshToken,
    refreshTokenExpirationDate,
  });

  return await newUser.save();
};

const checkToken = async (token) => {
  console.log("users repo - checkToken");
  const user = await User.findOne({ token });
  console.log(user, !!user);
  return !!user;
};

const updateUserAccount = async (infos) => {
  console.log("users repo - updateUserAccount");

  try {
    // if userId alors on trouve le user, et on prend tous les champs possibles du user
    if (!infos.userId && !infos.email) {
      throw new Error("Ni userIDd, ni email fournis pour la mise à jour");
    }
    const searchField = infos.userId
      ? { _id: infos.userId }
      : { email: infos.email };
    const userToUpdate = await User.findOne(searchField);
    console.log("userToupdate = ", userToUpdate);

    if (!userToUpdate) {
      throw new Error("Utilisateur non trouvé.");
    }

    // if c'est bon alors on crée un "possibleFieldsToUpdate" et on cherche un par un les champs dans infos
    const userObject = userToUpdate.toObject(); // Convertit en objet JS pur
    const possibleFieldsToUpdate = Object.keys(userObject).filter(
      (field) => !field.startsWith("_")
    );
    const updateFields = {};

    possibleFieldsToUpdate.forEach((field) => {
      if (field in infos && infos[field] != undefined) {
        updateFields[field] = infos[field];
      }
    });
    const updatedUser = await User.findOneAndUpdate(
      searchField,
      { $set: updateFields },
      { new: true } // Retourne le document modifié
    );

    return updatedUser;
  } catch (exception) {
    console.error("Erreur lors de la mise à jour du compte :", exception);
    throw new Error("Database Error while updating account");
  }
};

const softDeleteUserById = async (userId) => {
  console.log("users repo - softDeleteUserById");
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
