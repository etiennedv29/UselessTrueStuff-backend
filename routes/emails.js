const express = require("express");
const router = express.Router();

const {
    sendEmails
  } = require("../controllers/emails");

  router.post("/sendEmails", sendEmails)

  module.exports = router;