// une route pour get tous les facts, avec en query parameters : category

const express = require("express");
const router = express.Router();

const { addComment } = require("../controllers/comments");


router.post("/addComment", addComment);



module.exports = router;
