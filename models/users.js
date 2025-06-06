const mongoose = require("mongoose");
const { Types } = require("mongoose");

const userSchema = mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  username: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  token: { type: String, required: true },
  createdAt: Date,
  factsSubmitted: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "facts",
    default:[]

  }],
  votePlus: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "facts",
      default:[]
    },
  ],
  voteMinus: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "facts",
      default:[]
    },
  ],
});

const User = mongoose.model("users", userSchema);

module.exports = User;
