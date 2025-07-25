const mongoose = require("mongoose");
const { Types } = require("mongoose");

const commentSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
    required: true,
    minlength: 2,
    maxlength: 30,
  },

  text: { type: String, required: true, minlength: 5, maxlength: 500 },
  submittedAt: { type: Date, required: true },
});

const factSchema = new mongoose.Schema({
  userID: { type: mongoose.Schema.Types.ObjectId, ref: 'users',required: true },
  title: {
    type: String,
    required: true,
    minlength: 10,
    maxlength: 30,
  },
  description: {
    type: String,
    required: true,
    minlength: 10,
    maxlength: 500,
  },
  tags: { type: Array, default: [] },
  votePlus: { type: Number, default: 0 },
  voteMinus: { type: Number, default: 0 },
  comments: [commentSchema],
  submittedAt: { type: Date, required: true },
  validatedAt: { type: Date },
  trueRatio: { type: Number, min: 0, max: 1, default: null },
  interestRatio: { type: Number, min: 0, max: 1, default: null },
  status: {
    type: String,
    enum: ["pending", "validated", "rejected"],
    default: "pending",
  },
  image: { type: String, default: "" },
});

const Fact = mongoose.model("facts", factSchema);

module.exports = Fact;
