const express = require("express");
const JWT = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const router = express.Router();

//Load User Model
const User = require("../models/User");

//Sign-Up
router.post("/signup", (req, res) => {
  const { email, password } = req.body;

  //validations
  if (!email) {
    return res.send({ error: "Email is required" });
  }
  if (!password) {
    return res.send({ error: "Password is required" });
  }

  // Check if user already exists
  User.findOne({ email }).then((user) => {
    if (user) {
      return res
        .status(400)
        .json({ email: "Already Registered please login!!" });
    }

    const newUser = new User({
      email,
      password,
    });

    // Hash password before saving in database
    bcrypt.genSalt(10, (err, salt) => {
      bcrypt.hash(newUser.password, salt, (err, hash) => {
        if (err) throw err;
        newUser.password = hash;
        newUser
          .save()
          .then((user) => res.json(user))
          .catch((err) => console.log(err));
      });
    });
  });
});

//Login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User Not Found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect Password!!" });
    }

    const payload = {
      user: {
        id: user.id,
        email: user.email,
      },
    };

    JWT.sign(payload, process.env.KEY, { expiresIn: 3600 }, (err, token) => {
      if (err) throw err;
      res.status(200).json({
        token,
      });
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Server Error",
    });
  }
});

module.exports = router;
