const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const post = {
  title: {
    type: String,
    required: true,
  },
  body: {
    type: String,
    required: true,
  },
  viewCount: {
    type: Number,
    default: 0,
  },
  author: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  // массив комментариев к конкретному посту
  comments: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
    },
  ],
};

const PostSchema = new Schema(post);

module.exports = mongoose.model("posts", PostSchema);
