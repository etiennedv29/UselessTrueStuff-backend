const {
  userSignup,
  getUserByUsername,
  getUserByEmail,
  getUserById,
  getUserByResetToken,
  updateUserAccount,
  softDeleteUserById,
} = require("../repository/users");
const { checkBody } = require("../utils/utilFunctions");
const bcrypt = require("bcrypt");
const { sendEmailSafe } = require("../utils/emails");
const uid2 = require("uid2");
const jwt = require("jsonwebtoken");

const accessTokenExpirationDuration = 30; //min
const refreshTokenExpirationDuration = 15; //jours

const generateAccessToken = (userId) => {
  return jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: `${accessTokenExpirationDuration}m`,
  });
};

const generateRefreshToken = () => {
  return uid2(64); //
};

const signup = async (req, res, next) => {
  console.log("users controller - signup - ", req?.body?.username);
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
      //création des tokens et dates d'expiration
      const accessToken = generateAccessToken(req.body._id);
      const refreshToken = generateRefreshToken();

      const accessTokenExpirationDate = new Date(
        Date.now() + accessTokenExpirationDuration * 60 * 1000
      );
      const refreshTokenExpirationDate = new Date(
        Date.now() + refreshTokenExpirationDuration * 24 * 60 * 60 * 1000
      );

      const userObject = await userSignup({
        ...req.body,
        accessToken,
        accessTokenExpirationDate,
        refreshToken,
        refreshTokenExpirationDate,
      });

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
  console.log("users controller - signin");
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
    console.log("req.body.email =", req.body.email)
    const user = await getUserByEmail(req.body.email.toLowerCase());
    console.log({user})
    // On gère les différents cas

    // cas 1 - social login mais utilisateur inconnu
    if (!user && isSocialConnection) {
      console.log("signin cas 1");

      //on construit un payload pour appeler signup
      const payload = {
        firstName: req.body.firstName || req.body.given_name || "",
        lastName: req.body.lastName || req.body.family_name || "",
        username: req.body.username,
        email: req.body.email,
        connectionWithSocials: true,
        password: req.body.password || "",
      };
      //Pour récupérer un _id afin de générer les tokens, on crée l'utilisateur avec seulement ces infos
      // on n'appelle pas signup, mais userSignup directement dans repository/users
      const createdUser = await userSignup(payload);

      //Comme on va envoyer vers userSignup, on génère des tokens pour le nouvel utilisateur maintenant qu'on a son Id
      const accessToken = generateAccessToken(createdUser._id);
      const refreshToken = generateRefreshToken();

      const accessTokenExpirationDate = new Date(
        Date.now() + accessTokenExpirationDuration * 60 * 1000
      );
      const refreshTokenExpirationDate = new Date(
        Date.now() + refreshTokenExpirationDuration * 24 * 60 * 60 * 1000
      );

      // Mise à jour en base avec les tokens
      createdUser.accessToken = accessToken;
      createdUser.accessTokenExpirationDate = accessTokenExpirationDate;
      createdUser.refreshToken = refreshToken;
      createdUser.refreshTokenExpirationDate = refreshTokenExpirationDate;
      await createdUser.save();
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

      //on doit maintenant vérifier pour update des tokens, on a bien le _id via user du getUserByEmail
      const accessToken = generateAccessToken(user._id.toString());
      const refreshToken = generateRefreshToken();

      const accessTokenExpirationDate = new Date(
        Date.now() + accessTokenExpirationDuration * 60 * 1000
      );
      const refreshTokenExpirationDate = new Date(
        Date.now() + refreshTokenExpirationDuration * 24 * 60 * 60 * 1000
      );

      // Mise à jour en base via l’instance mongoose
      user.accessToken = accessToken;
      user.accessTokenExpirationDate = accessTokenExpirationDate;
      user.refreshToken = refreshToken;
      user.refreshTokenExpirationDate = refreshTokenExpirationDate;
      await user.save();

      return res.json(user);
    }

    // cas 3 - social Login et l'utilisateur existe bien
    else if (user && user.connectionWithSocials === true) {
      console.log("signin cas 3");
      // pour le futur : mise à jour auto des informations username etc parce qu'elles sont différentes dans le social login

      // user._id existe, on génère de nouveaux tokens
      const accessToken = generateAccessToken(user._id.toString());
      const refreshToken = generateRefreshToken();

      const accessTokenExpirationDate = new Date(
        Date.now() + accessTokenExpirationDuration * 60 * 1000
      );
      const refreshTokenExpirationDate = new Date(
        Date.now() + refreshTokenExpirationDuration * 24 * 60 * 60 * 1000
      );

      // Mise à jour en base via l’instance mongoose
      user.accessToken = accessToken;
      user.accessTokenExpirationDate = accessTokenExpirationDate;
      user.refreshToken = refreshToken;
      user.refreshTokenExpirationDate = refreshTokenExpirationDate;
      console.log({ user });
      await user.save();

      res.json(user);

      // cas 4 - échec autre
    } else {
      console.log("signin cas 4");
      res.status(401).json({ error: "User not found or wrong password" });
    }
  } catch (exception) {
    // cas 5 - échec du signin global
    console.log("signin cas 5");
    console.log("détail de l'erreur = ", exception);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const refreshTokens = async (req, res) => {
  console.log("users controller - refresh");
  const { email, refreshToken } = req.body;

  try {
    // Vérification que les infos sont présentes
    if (!email || !refreshToken) {
      return res.status(400).json({ error: "Email et refreshToken requis" });
    }

    // On retrouve l'utilisateur
    const user = await getUserByEmail(email.toLowerCase());
    if (!user) {
      return res.status(401).json({ error: "Utilisateur introuvable" });
    }

    // Vérification du refreshToken et de sa date
    if (user.refreshToken !== refreshToken) {
      return res.status(401).json({ error: "Refresh token invalide" });
    }
    if (new Date() >= user.refreshTokenExpirationDate) {
      return res.status(401).json({ error: "Refresh token expiré" });
    }

    // Génération d’un nouveau accessToken
    const newAccessToken = generateAccessToken(user._id.toString());
    const newAccessTokenExpirationDate = new Date(
      Date.now() + accessTokenExpirationDuration * 60 * 1000
    );

    // Mise à jour en base
    user.accessToken = newAccessToken;
    user.accessTokenExpirationDate = newAccessTokenExpirationDate;
    await user.save();

    // Retourne au front
    return res.json({
      accessToken: user.accessToken,
      accessTokenExpirationDate: user.accessTokenExpirationDate,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const findVotesByFactForUser = async (req, res, next) => {
  console.log(
    "users controller - findVotesByFactForUser with params = ",
    req.params
  );
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
  console.log("users controller - updateAccount");
  console.log("req.body =", req.body);
  try {
    const updatedUser = await updateUserAccount(req.body);
    res.json(updatedUser);
  } catch (exception) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const deleteAccount = async (req, res) => {
  console.log("users controller - deleteAccount");
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

const forgotPassword = async (req, res) => {
  console.log("users controller - forgotPassword");
  const { email } = req.body;
  const validityDelay = 15; //toke valide 15min

  try {
    const user = await getUserByEmail(email);
    // Vérification qu'il y a bien un compte pour cet email
    if (!user) {
      return res
        .status(400)
        .json({ error: "Aucun compte associé à cet email" });
    }

    //Cas où l'utilisateur est connecté avec social Login
    if (user.connectionWithSocials) {
      return res.status(401).json({
        success: false,
        socialConnectionProvider: user.socialConnectionProvider,
        message: `Tu es enregistré avec ton compte ${user.socialConnectionProvider}, essaie avec pour voir !`,
      });
    }

    //génération du token temporaire
    const resetPasswordToken = uid2(32);
    const resetPasswordTokenExpirationDate = new Date();

    // validité 15min
    resetPasswordTokenExpirationDate.setMinutes(
      resetPasswordTokenExpirationDate.getMinutes() + validityDelay
    );

    //Sauvegarder le token pour l'utilisateur
    console.log({ resetPasswordTokenExpirationDate });
    const updatedUser = await updateUserAccount({
      email,
      resetPasswordToken,
      resetPasswordTokenExpirationDate,
    });

    // créer le lien de réinitilisation
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetPasswordToken}`;

    //Envoyer à l'utilisateur un lien de reset
    sendEmailSafe({
      to: email,
      type: "password_reset_request",
      ctx: {
        firstName: user.firstName,
        resetPasswordToken,
        validityDelay,
        resetUrl,
      },
    });

    res.status(200).json({
      sucess: true,
      message: "Un mail de réinitialisation du mot de passe t'a été envoyé",
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal servor error" });
  }
};

const resetPassword = async (req, res) => {
  console.log("users controller - resetPassword");
  const { token, newPassword } = req.body;
  try {
    //on cherche l'utilisateur
    const user = await getUserByResetToken(token);
    if (!user) {
      console.log("AA");
      return res
        .status(400)
        .json({ success: false, message: "Utilisateur inconnu" });
    } else {
      //vérification que le passwordToken existe
      if (user.resetPasswordToken !== token) {
        console.log("BB");
        return res
          .status(400)
          .json({ success: false, message: "Token invalide" });
      } else if (new Date() >= user.resetPasswordTokenExpirationDate) {
        console.log("CC");
        return res
          .status(400)
          .json({ success: false, message: "Token expiré" });
      }
    }

    // Hacher le nouveau mot de passe
    const hash = bcrypt.hashSync(newPassword, 10);

    console.log("all infos ok, time to update");
    //udpate l'utilisateur avec le nouveau mot de passe et supprimer le token et expiration
    const password = hash;
    const resetPasswordToken = null;
    const resetPasswordTokenExpirationDate = null;
    const updatedUser = await updateUserAccount({
      email: user.email,
      password,
      resetPasswordToken,
      resetPasswordTokenExpirationDate,
    });

    if (!updatedUser) {
      return res.status(400).json({
        sucess: false,
        message: "Erreur à l'enregistrement du nouveau mot de passe",
      });
    } else {
      return res.status(200).json({
        sucess: true,
        message: "Ton mot de passe a bien été réinitialisé",
      });
    }
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getCurrentUser = async (req, res) => {
  try {
    console.log("req.user = ", req.user);
    //pas besoin d'aller chercher le user en DB, il est déjà fourni par le middleware verifyAccessToken en fin de fonction
    if (!req.user) {
      return res.status(401).json({ error: "Utilisateur non identifié" });
    }

    //on édulcore le user pour ne garder que les infos ok, pas d'info sensible
    const safeUser = {
      _id: req.user._id,
      username: req.user.username,
      email: req.user.email,
      votePlus: req.user.votePlus,
      voteMinus: req.user.voteMinus,
      preferences: req.user.preferences,
      createdAt: req.user.createdAt,
    };
    // on renvoie
    return res.json(safeUser);
  } catch (error) {
    console.error("Erreur getCurrentUser :", error);
    res.status(500).json({ error: "Erreur interne serveur" });
  }
};
module.exports = {
  signup,
  signin,
  findVotesByFactForUser,
  updateAccount,
  deleteAccount,
  forgotPassword,
  resetPassword,
  refreshTokens,
  getCurrentUser,
};
