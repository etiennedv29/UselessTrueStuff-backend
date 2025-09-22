const { addCommentInDb } = require("../repository/comments");
const{sendEmailSafe} = require("../utils/emails")
const {getUserById} = require("../repository/users")


const addComment = async (req, res, next) => {
  console.log("comment Controller - addComment");
  try {
    console.log("adding comment : ", req.body.text.slice(0,30));
    const addedComment = await addCommentInDb(req.body);
    if (!addedComment) {
      return res.status(500).json({ error: "Comment was not added" });
    }
    res.json(addedComment);

    //Vérification des préférences mail de l'utilisateur 
    const emailConfirmation = addedComment.userId.preferences.commentValidationNotification
    //envoi de la confirmation du commentaire par mail si OK de l'utilisateur
    emailConfirmation && sendEmailSafe({
      to: addedComment.userID.email,
      type: "comment_sent",
      ctx: {
        factTitle: addedComment.title,
      },
    });

    return addedComment;
  } catch (exception) {
    console.log(exception);
    res.status(500).json({ error: "internal Servor Error with db" });
  }
};

module.exports = { addComment };
