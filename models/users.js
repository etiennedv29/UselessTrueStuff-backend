const mongoose = require("mongoose");

//  Schéma des préférences (avec updatedAt propre à ce sous-doc)
const preferencesSchema = new mongoose.Schema(
  {
    commentValidationNotification: Boolean,
    voteSubmissionNotification: Boolean,
    factVerificationNotification: Boolean,
    dailyFactUpdateNotification: Boolean,
    updatedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

//valeurs par défaut à la création de l'utilisateur :
const defaultPreferences = {
  commentValidationNotification: true,
  voteSubmissionNotification: false,
  factVerificationNotification: true,
  dailyFactUpdateNotification: true,
  updatedAt: Date.now(),
};

// Schéma utilisateur
const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, default: null },
    lastName: { type: String, required: true, default: null },
    username: { type: String, required: true, default: null },
    email: { type: String, required: true, default: null },
    password: {
      type: String,
      required: function () {
        return !this.connectionWithSocials;
      },
    },

    resetPasswordToken: { type: String, default: null },
    resetPasswordTokenExpirationDate: { type: Date, default: null },

    connectionWithSocials: { type: Boolean, required: true, default: null },
    socialConnectionProvider: { type: String, default: null },

    accessToken: { type: String, required: true, default: null },
    accessTokenExpirationDate: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
    },

    refreshToken: { type: String, required: true, default: null },
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

    preferences: {
      type: preferencesSchema,
      required: true,
      default: () => ({ ...defaultPreferences }),
    },
  },
  {
    // ✅ Ajout automatique des champs createdAt et updatedAt
    timestamps: true,
  }
);

const User = mongoose.model("users", userSchema);

module.exports = User;
