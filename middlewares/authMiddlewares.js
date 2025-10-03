const jwt = require("jsonwebtoken");
const User = require("../models/users");

// Middleware pour vérifier l'accessToken
const verifyAccessToken = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // "Bearer xxx"

    if (!token) {
      return res.status(401).json({ error: "Access token manquant" });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({ error: "Access token expiré" });
      }
      return res.status(401).json({ error: "Access token invalide" });
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: "Utilisateur introuvable" });
    }

    // Vérification que c’est bien le dernier token en cours
    if (user.accessToken !== token) {
      return res.status(401).json({ error: "Access token invalide (non correspondant)" });
    }

    // Vérification expiration par rapport à la DB
    if (!user.accessTokenExpirationDate || new Date() >= user.accessTokenExpirationDate) {
      return res.status(401).json({ error: "Access token expiré" });
    }

    // OK → on attache l'utilisateur à req
    req.user = user;
    next();
  } catch (err) {
    console.error("Erreur middleware verifyAccessToken:", err);
    return res.status(500).json({ error: "Erreur interne du serveur" });
  }
};

module.exports = { verifyAccessToken };
