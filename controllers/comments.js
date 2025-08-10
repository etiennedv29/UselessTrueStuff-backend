const {addCommentInDb} = require("../repository/comments");

const addComment = async (req, res, next) => {
  console.log("trying to add comment")
    try {
      console.log("adding comment");
      console.log(req.body);
      const addedComment = await addCommentInDb(req.body);
      if (!addedComment) {
        return res.status(500).json({ error: "Comment was not added" });
      }
      res.json(addedComment);
      return addedComment;
    } catch (exception) {
      console.log(exception);
      res.status(500).json({ error: "internal Servor Error with db" });
    }
  };

module.exports = { addComment };
