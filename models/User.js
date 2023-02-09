const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userModel = {
  user_name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  favorites: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
    },
  ],
  avatar: {
    type: String,
    required: false,
  },
  token: {
    type: String,
  },
};

const UserSchema = new Schema(userModel);
module.exports = mongoose.model("users", UserSchema);
