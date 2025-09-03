const moment = require("moment");
const User = require("../models/users");
const Fact = require("../models/facts");
const mongoose = require("mongoose");
const { Types } = require("mongoose");


const addCommentInDb = async (data) => {
  console.log("repo - comment that will be posted in the db : ", data);

  try {
    let newComment = {
      author: new mongoose.Types.ObjectId(data.author),
      text: data.text,  
      submittedAt: data.submittedAt,
    };
    console.log("newComment added to db? ", newComment)
    const updatedFact = await Fact.findByIdAndUpdate(data.factId, {
      $push: { comments: newComment },
    });
    return updatedFact.populate("userID");
  } catch (exception) {
    console.error("Error adding comment", exception);
  }
};

module.exports = { addCommentInDb };
