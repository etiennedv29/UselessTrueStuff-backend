const moment = require("moment");
const User = require("../models/users");
const Fact = require("../models/facts");

const getFacts = async ({ category, userId }) => {
  const searchParams = {
    category,
    userId,
  };
  return await Fact.find(searchParams).sort({ createdAt: -1 });
};

const addFactInDb = async (data) => {
   console.log ("data that will be posted in the db : ", data)
  let newFact = new Fact({ ...data });

  await newFact.save();
  console.log("new fact loaded: ",newFact);
  return newFact;
};

// const updateFact = async () => {
//   await updateOne();
// };
module.exports = { getFacts, addFactInDb };
