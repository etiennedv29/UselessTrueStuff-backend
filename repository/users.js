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
  console.log("dans userSignup", {firstName, password, email,connectionWithSocials})
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

const updateUserAccount = async (infos) => {
  try{
  const { id=infos.userId, username, email } = infos;
  const updateFields = {};

  if (username) updateFields.username = username;
  if (email) updateFields.email = email;

  const updatedUser = await User.findOneAndUpdate(
    { _id: id },
    { $set: updateFields },
    { new: true } // renvoie le document modifié
  );
  return updatedUser;}
  catch(exception){
    res.status(500).json({ error: "Database Error while updating account" });
  }
};

const softDeleteUserById = async (userId) =>{
  console.log ("repo softDeleting by userId, userId = ", userId)
  try {
    const result = await User.findByIdAndUpdate(
        userId,
        {
            username: "Un 👻 du passé",
            email: null,
            firstName:null,
            lastName:null,
            password:null,
            token:null
        },
        { new: true } // Retourne le document mis à jour
    );
    return result !== null; // true si mis à jour, false si introuvable
} catch (error) {
    console.error("Erreur :", error);
    return false;
}
}

module.exports = {
  userSignup,
  checkToken,
  getUserByUsername,
  getUserByEmail,
  getUserByToken,
  getUserById,
  updateUserAccount,softDeleteUserById
};
