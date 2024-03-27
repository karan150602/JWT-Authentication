const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const app = express();
app.use(express.json({ limit: "50mb" }));

// Initialize Passport
app.use(passport.initialize());

// Serve static files
app.use(express.static("frontend"));

//mongoDb Connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URL);
    console.log("Database Connected");
  } catch (error) {
    console.log(error);
  }
};

connectDB();

//User Model
const User = require("./models/User");

// Dummy database for users
let users = [];

// Secret key for JWT
const secretKey = "Karan";

// Middleware function to authenticate users
const authenticateUser = (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  try {
    const decodedToken = jwt.verify(token, secretKey);
    req.user = decodedToken;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

// Admin authorization middleware
const isAdmin = (req, res, next) => {
  const { isAdmin } = req.user;
  if (!isAdmin) {
    return res
      .status(403)
      .json({ message: "Forbidden, admin access required" });
  }
  next();
};

// Register new account
app.post("/register", async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new Error("Email already exists");
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, email, password: hashedPassword });
    await newUser.save();
    res.status(201).send(newUser);
  } catch (error) {
    next(error);
  }
});

// User login endpoint
app.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const token = jwt.sign(
      { username: user.username, isAdmin: user.isAdmin },
      secretKey
    );
    res.status(200).json({ token });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

// Logout
app.post('/logout', authenticateUser, async (req, res, next) => {
  try {
      req.logout(); // Logout the user (assumes you are using Passport.js for authentication)
      res.clearCookie('session'); // Clear the session cookie (if using cookie-based sessions)
      res.sendStatus(200);
  } catch (error) {
      next(error);
  }
});

// Get profile details
app.get("/profile/:userId", authenticateUser, async (req, res, next) => {
  try {
    const userId = req.params.userId;
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }
    if (
      !user.profile.isPublic &&
      !req.user.isAdmin &&
      req.user._id.toString() !== userId
    ) {
      throw new Error("You are not authorized to view this profile");
    }
    res.send(user.profile);
  } catch (error) {
    next(error);
  }
});

// Edit profile details
app.put('/profile/:userId', authenticateUser, async (req, res, next) => {
  try {
      const userId = req.params.userId;
      const updatedProfile = req.body;
      const user = await User.findByIdAndUpdate(userId, { $set: { profile: updatedProfile } }, { new: true });
      res.send(user);
  } catch (error) {
      next(error);
  }
});

// Get all public profiles endpoint
app.get("/profiles", authenticateUser, (req, res) => {
  const publicProfiles = users.filter((user) => user.isPublic === true);
  res.status(200).json(publicProfiles);
});

// Admin endpoint to get all profiles
app.get("/admin/profiles", authenticateUser, isAdmin, (req, res) => {
  res.status(200).json(users);
});

// Set profile privacy endpoint
app.put("/profile/privacy", authenticateUser, (req, res) => {
  const { isPublic } = req.body;
  const { username } = req.user;
  const userIndex = users.findIndex((user) => user.username === username);
  if (userIndex === -1) {
    return res.status(404).json({ message: "User not found" });
  }
  users[userIndex].isPublic = isPublic;
  return res
    .status(200)
    .json({ message: "Profile privacy updated successfully" });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
