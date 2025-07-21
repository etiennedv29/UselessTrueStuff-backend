#!/usr/bin/env node
const mongoose = require("mongoose");
const { dailyFactGenerator } = require("./controllers/facts");

// 1) Open the DB connection first
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser:     true,
  useUnifiedTopology:  true,
  // any other options you use in your server...
})
.then(() => {
  console.log("✅ Cron: MongoDB connected");
  // 2) Run the generator
  return dailyFactGenerator();
})
.then(() => {
  console.log("✅ Cron: dailyFactGenerator finished");
  process.exit(0);
})
.catch(err => {
  console.error("❌ Cron error:", err);
  process.exit(1);
});
