const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const comment = {
  author: {
    type: String,
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  // каждый коммент может относиться к конкретному посту, и таких комментов может быть несколько
  post: {
    // указываем id поста, в котором будет находиться комментарий
    type: mongoose.Schema.Types.ObjectId,
    ref: "Post",
  },
};

const commentSchema = new Schema(comment);

module.exports = mongoose.model("Comment", commentSchema);
