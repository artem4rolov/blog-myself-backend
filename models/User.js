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
  },
  password: {
    type: String,
    required: true,
  },
  avatar: {
    type: String,
    required: false,
  },
};

const UserSchema = new Schema(userModel);
module.exports = mongoose.model("users", UserSchema);
