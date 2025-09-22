const mongoose = require("mongoose");
const { Types } = require("mongoose");

const preferencesSchema = new mongoose.Schema(
  {
    commentValidationNotification: {
      type: Boolean,
      required: true,
      default: true,
    },
    voteSubmissionNotification: {
      type: Boolean,
      required: true,
      default: false,
    },
    factVerificationNotification: {
      type: Boolean,
      required: true,
      default: true,
    },
    dailyFactUpdateNotification: {
      type: Boolean,
      required: true,
      default: true,
    },
    updatedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const userSchema = mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  username: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  resetPasswordToken: { type: String, default: null },
  resetPasswordTokenExpirationDate: { type: Date, default: null },
  connectionWithSocials: { type: Boolean, required: true },
  socialConnectionProvider: { type: String, default: null },
  token: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  factsSubmitted: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "facts",
      default: [],
    },
  ],
  votePlus: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "facts",
      default: [],
    },
  ],
  voteMinus: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "facts",
      default: [],
    },
  ],
  preferences: preferencesSchema,
});

const User = mongoose.model("users", userSchema);

module.exports = User;
