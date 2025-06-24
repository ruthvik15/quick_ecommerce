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
    enum: ["user", "admin","seller"],
    default: "user"
  },
  phone: {
    type: Number,  
    required: true
  },
  address: {
    type: String,
    required: true
  },
}, { timestamps: true });
userSchema.index({ email: 1 }); // Unique index for email
userSchema.index({ location: 1, role: 1 }); // Compound index for location/role queries
userSchema.index({ phone: 1 }); // Unique index for phone

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