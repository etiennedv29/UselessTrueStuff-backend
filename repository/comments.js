const moment = require("moment");
const User = require("../models/users");
const Fact = require("../models/facts");

const addCommentInDb = async (data) => {
  console.log("repo - comment that will be posted in the db : ", data);

  try {
    let newComment = {
      author: data.author,
      text: data.description,
      submittedAt: data.submittedAt,
    };
    const updatedFact = await Fact.findByIdAndUpdate(data.factId, {
      $push: { comments: newComment },
    });
    return updatedFact;
  } catch (exception) {
    console.error("Error adding comment", exception);
  }
};

module.exports = { addCommentInDb };
