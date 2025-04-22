const moment = require("moment");

const User = require("../models/users");
const Fact = require("../models/facts")

const getFacts = async({category, userId }) => {
     const searchParams = {
        category,
        userId
     }
     return await Fact.find(searchParams).sort({createdAt:-1})
}




module.exports = {getFacts};