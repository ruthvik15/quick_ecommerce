const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const { createtoken } = require("../utils/auth");

const sellerSchema = new mongoose.Schema({
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
  shopName: {
    type: String,
    required: true,
    unique: true
  },
  phone: {
    type: String,
    required: true,
    match: [/^\d{10}$/, "Please enter a valid 10-digit phone number"]
  },
  address: {
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
    default: "seller"
  },
  isVerified: {
    type: Boolean,
    default: false // Admin can approve sellers later
  }
}, { timestamps: true });

sellerSchema.index({ location: 1 });

sellerSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

sellerSchema.static("matchPassword", async function (email, plainPassword) {
  const seller = await this.findOne({ email });
  if (!seller) throw new Error("Seller not found");

  const isMatch = await bcrypt.compare(plainPassword, seller.password);
  if (!isMatch) throw new Error("Incorrect password");

  return createtoken(seller);
});

const Seller = mongoose.model("Seller", sellerSchema);
module.exports = Seller;