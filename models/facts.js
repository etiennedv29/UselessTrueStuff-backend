const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  author: { type: String, required: true },
  text: { type: String, required: true }
});

const factSchema = new mongoose.Schema({
  userID: { type: String, required: true },
  title: { 
    type: String, 
    required: true,
    minlength: 10,
    maxlength: 30 
  },
  description: { 
    type: String, 
    required: true,
    minlength: 50,
    maxlength: 500 
  },
  category: {type: String},
  votePlus: { type: Number, default: 0 },
  voteMinus: { type: Number, default: 0 },
  comments: [commentSchema],
  submittedAt: { type: Date, required: true },
  validatedAt: { type: Date },
  trueRatio: { type: Number, min: 0, max: 1 },
  status: { type: String, enum: ['pending', 'validated', 'rejected'], default: 'pending' },
  image: { type: String }
});

 const Fact = mongoose.model('facts', factSchema);

 module.exports = Fact