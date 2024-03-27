const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: {
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
  profile: {
    name: String,
    bio: String,
    phone: String,
    photo: String,
    isPublic: { type: Boolean, default: true }, // New field for profile privacy
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
});

module.exports = mongoose.model("User", userSchema);
