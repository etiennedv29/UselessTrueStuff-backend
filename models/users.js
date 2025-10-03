const mongoose = require("mongoose");

//  Schéma des préférences (avec updatedAt propre à ce sous-doc)
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

// Schéma utilisateur
const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    username: { type: String, required: true },
    email: { type: String, required: true },
    password: {
      type: String,
      required: function () {
        return !this.connectionWithSocials;
      },
    },

    resetPasswordToken: { type: String, default: null },
    resetPasswordTokenExpirationDate: { type: Date, default: null },

    connectionWithSocials: { type: Boolean, required: true },
    socialConnectionProvider: { type: String, default: null },

    accessToken: { type: String, required: true },
    accessTokenExpirationDate: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
    },

    refreshToken: { type: String, required: true },
    refreshTokenExpirationDate: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 jours
    },

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
  },
  {
    // ✅ Ajout automatique des champs createdAt et updatedAt
    timestamps: true,
  }
);

const User = mongoose.model("users", userSchema);

module.exports = User;
