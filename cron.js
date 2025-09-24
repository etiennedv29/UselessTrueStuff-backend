#!/usr/bin/env node
require("dotenv").config();
const mongoose = require("mongoose");
const { dailyFactGenerator } = require("./controllers/facts");
const { sendEmailSafe } = require("./utils/emails");
const User = require("./models/users"); // adapte le chemin si besoin

// fonction utilitaire dormant entre 2 envois de mails  
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runCron() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("✅ Cron: MongoDB connected");

    // 1) Générer le fait du jour
    const fact = await dailyFactGenerator();
    console.log("✅ Cron: dailyFactGenerator finished");

    // 2) Récupérer les utilisateurs abonnés aux mails quotidiens
    const users = await User.find({
      "preferences.dailyFactUpdateNotification": true,
    }).lean(); //récupère un objet js et non pas tout l'object mongoose, permettant de travailler dessus type .save()

    console.log(`📧 ${users.length} utilisateurs à notifier`);

    // 3) Envoyer les mails avec limiteur
    for (const user of users) {
      await sendEmailSafe({
        to: user.email,
        type: "dailyFact_notificationEmail",
        ctx: {
          factTitle: fact.title,
          factDescription: fact.description,
          factUrl: `${process.env.FRONTEND_URL}/facts/${fact._id}`, // lien direct vers le fait
        },
      });
      console.log(`✅ Mail envoyé à ${user.email}`);
    }

    // Pause de 501 ms pour respecter 2 mails/sec de Resend
    await sleep(501);

    process.exit(0);
  } catch (err) {
    console.error("❌ Cron error:", err);
    process.exit(1);
  }
}

runCron();
