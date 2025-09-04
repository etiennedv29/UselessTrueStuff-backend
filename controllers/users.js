const {
  userSignup,
  getUserByUsername,
  getUserByEmail,
  getUserById,
  updateUserAccount,
  softDeleteUserById,
} = require("../repository/users");
const { checkBody } = require("../utils/utilFunctions");
const bcrypt = require("bcrypt");
const { sendEmailSafe } = require("../utils/emails");

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
      //confirmation par mail avant de renvoyer le nouvel utilisateur au fron
      sendEmailSafe({
        to: userObject.email,
        type: "signup_confirmation",
        ctx: { firstName: userObject.firstName },
      });

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
    const isSocialConnection = !!req.body.connectionWithSocials;

    //Vérification que tous les champs du signin sont remplis + else if concerne l'email obligatoire uniquement si connectionWithSocials===true
    if (!isSocialConnection && !checkBody(req.body, ["email", "password"])) {
      return res.status(400).json({ error: "Missing or empty fields" });
    } else if (
      (isSocialConnection &&
        !checkBody({ email: req.body.email }, ["email"])) ||
      typeof req.body.email !== "string"
    ) {
      return res
        .status(400)
        .json({ error: "email nécessaire pour la connexion avec les réseaux" });
    }

    //recherche de l'utilisateur par mail
    const user = await getUserByEmail(req.body.email.toLowerCase());

    // On gère les différents cas
    // cas 1 - social login mais utilisateur inconnu

    if (!user && isSocialConnection) {
      console.log("signin cas 1");

      //on construit un payload pour appeler signup
      //req.body={email: '',password: '',connectionWithSocials: true}
      const payload = {
        firstName: req.body.firstName || req.body.given_name || "",
        lastName: req.body.lastName || req.body.family_name || "",
        username: req.body.username,
        email: req.body.email,
        connectionWithSocials: true,
        password: req.body.password || "",
      };
      // on n'appelle pas signup, mais userSignup directement dans repository/users
      const createdUser = await userSignup(payload);
      //console.log({ createdUser });
      return res.json(createdUser);

      // cas 2 - cas normal de connexion avec mot de passe sans social login
    } else if (user && user.connectionWithSocials === false) {
      console.log("signin cas 2");
      if (!req.body.password) {
        return res.status(400).json({ error: "Missing password" });
      }
      const okPassword = bcrypt.compareSync(req.body.password, user.password);
      if (!okPassword) {
        return res
          .status(401)
          .json({ error: "User not found or wrong password" });
      }
      return res.json(user);
    }
    // cas 3 - social Login et l'utilisateur existe bien
    else if (user && user.connectionWithSocials === true) {
      console.log("signin cas 3");
      // pour le futur : mise à jour auto des informations username etc parce qu'elles sont différentes dans le social login
      res.json(user);

      // cas 4 - échec autre
    } else {
      console.log("signin cas 4");
      res.status(401).json({ error: "User not found or wrong password" });
    }
  } catch (exception) {
    // cas 5 - échec du signin global
    console.log("signin cas 5");
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

const updateAccount = async (req, res, next) => {
  try {
    const updatedUser = await updateUserAccount(req.body);
    res.json(updatedUser);
  } catch (exception) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const deleteAccount = async (req, res) => {
  //besoin de userId, email,
  //le user souhaite supprimer son compte: on supprime toutes les données personnelles et on garde les données publiques
  const { userId, email } = req.body;
  try {
    const softDelete = await softDeleteUserById(userId);
    if (!softDelete) {
      return res.status(400).json({
        deleteAccount: false,
        message: "Utilisateur non trouvé ou déjà supprimé",
      });
    }
    res.status(200).json({
      deleteAccount: true,
      message:
        "Ton compte a été supprimé, tes données perso supprimées et tes données publiques anonymisées",
    });
  } catch (error) {
    res.status(500).json({
      deleteAccount: false,
      message: "Internal Servor Error",
      error: error.message,
    });
  }
  sendEmailSafe({
    to: email,
    type: "account_deleted",
    ctx: {},
  });
};
module.exports = {
  signup,
  signin,
  findVotesByFactForUser,
  updateAccount,
  deleteAccount,
};
