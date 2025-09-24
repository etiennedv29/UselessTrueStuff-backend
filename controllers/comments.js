const { addCommentInDb } = require("../repository/comments");
const { sendEmailSafe } = require("../utils/emails");
const { mistralModeration } = require("../utils/moderation");
const { getUserById } = require("../repository/users");

const addComment = async (req, res, next) => {
  console.log(
    `comment Controller - addComment : ${req.body.text.slice(0, 30)} by ${req.body?.author}`
  );

  try {
    // Validation
    if (!req.body.text?.trim()) {
      return res.status(400).json({ error: "Comment text is required" });
    }

    //Modération
    const moderationResult = await mistralModeration(req.body.text);
    if (moderationResult.moderation) {
      req.body.moderatedText = req.body.text;
      req.body.text = "Commentaire modéré";
      req.body.moderatedCategories = moderationResult.flaggedCategories;
    }

    //Ajout en base
    const addedComment = await addCommentInDb(req.body);
    if (!addedComment) {
      return res.status(500).json({ error: "Comment was not added" });
    }

    //Envoi du mail de confirmation
    try {
      //Vérification des préférences mail de l'utilisateur
      const emailConfirmation =
        addedComment.userId?.preferences?.commentValidationNotification;
      //envoi de la confirmation du commentaire par mail si OK de l'utilisateur
      if (emailConfirmation) {
        await sendEmailSafe({
          to: addedComment.userId.email, // ⚠️ tu avais `userID` au lieu de `userId` → possible bug
          type: "comment_sent",
          ctx: {
            factTitle: addedComment.title,
          },
        });
      }
    } catch (mailErr) {
      console.error("Erreur lors de l’envoi d’email :", mailErr);
    }

    //réponse route
    res.json(addedComment);

  } catch (exception) {
    console.log(exception);
    return res.status(500).json({ error: "internal Servor Error with db" });
  }
};

module.exports = { addComment };
