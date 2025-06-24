const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const { createtoken } = require("../utils/auth");

const assignedSlotSchema = new mongoose.Schema({
  date: {
    type: String, // Format: 'YYYY-MM-DD'
    required: true
  },
  slot: {
    type: String, // e.g., "10AM–12PM"
    required: true
  },
  count: {
    type: Number,
    default: 0
  }
}, { _id: false });

const riderSchema = new mongoose.Schema({
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
  role:{
    type:String,
    enum:["user","rider"],
    default:"rider"
  },
  phone: {
    type: String,
    required: true
  },
  no_of_orders: {
    type: Number,
    default: 0  
  },
  number_plate:{
    type:String,
  },
  vehicle_type: {  
    type: String,
    enum: ["bike", "scooter", "car"],
    required: true
  },
  longitude: {
  type: Number,
  default: null
},
latitude: {
  type: Number,
  default: null
},


  // 🆕 New field: Track slot-wise load
  assignedSlots: {
    type: [assignedSlotSchema],
    default: []
  }

}, { timestamps: true });

riderSchema.index({ email: 1 });
riderSchema.index({ location: 1, vehicle_type: 1 });
riderSchema.index({ no_of_orders: -1 });
// Optional: Composite index on assignedSlots (advanced, can be added to RiderSlotAssignment collection)

riderSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ✅ Match password for login
riderSchema.static("matchPassword", async function (email, plainPassword) {
  const rider = await this.findOne({ email });
  if (!rider) throw new Error("Rider not found");

  const isMatch = await bcrypt.compare(plainPassword, rider.password);
  if (!isMatch) throw new Error("Incorrect password");

  return createtoken(rider);
});

const Rider = mongoose.model("Rider", riderSchema);
module.exports = Rider;