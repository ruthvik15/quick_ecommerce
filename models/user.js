const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const { createtoken } = require("../utils/auth");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,  
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  location: {
    type: String,
    enum: ["hyderabad", "bengaluru", "mumbai", "delhi"],
    required: true
  },
  role: {
    type: String,
    default: "user"
  },
  phone: {
    type: String,
    required: true,
  },
  address: {
    type: String
  },

  latitude: {
    type: Number,
    default: null
  },
  longitude: {
    type: Number,
    default: null
  }
}, { timestamps: true });

userSchema.index({ location: 1, role: 1 }); 

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.static("matchPassword", async function (email, plainPassword) {
  const user = await this.findOne({ email });
  if (!user) throw new Error("User not found");

  const isMatch = await bcrypt.compare(plainPassword, user.password);
  if (!isMatch) throw new Error("Incorrect password");

  return createtoken(user);
});

const User = mongoose.model("User", userSchema);
module.exports = User;