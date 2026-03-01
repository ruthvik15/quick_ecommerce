const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const { createtoken } = require("../utils/auth");
const cityCoords = require("../utils/cityCoordinates");

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
  role: {
    type: String,
    default: "rider"
  },
  phone: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true 
  },
  no_of_orders: {
    type: Number,
    default: 0  
  },
  number_plate: {
    type: String,
  },
  vehicle_type: {  
    type: String,
    enum: ["bike", "scooter", "car"],
    required: true
  },
  longitude: {
    type: Number,
    default: function() {
      // Provide default coordinates based on location
      const coords = cityCoords[this.location?.toLowerCase()] || cityCoords.hyderabad;
      return coords.lng;
    }
  },
  latitude: {
    type: Number,
    default: function() {
      //Provide default coordinates based on location
      const coords = cityCoords[this.location?.toLowerCase()] || cityCoords.hyderabad;
      return coords.lat;
    }
  },
  assignedSlots: {
    type: [assignedSlotSchema],
    default: []
  }
}, { timestamps: true });

riderSchema.index({ location: 1, vehicle_type: 1 });
riderSchema.index({ no_of_orders: -1 });

//Auto-fix riders with null coordinates on load
riderSchema.post('init', function(doc) {
  if (doc.latitude === null || doc.longitude === null) {
    const coords = cityCoords[doc.location?.toLowerCase()] || cityCoords.hyderabad;
    doc.latitude = coords.lat;
    doc.longitude = coords.lng;
  }
});

riderSchema.pre("save", async function (next) {
  //Ensure coordinates are set before save
  if (this.latitude === null || this.latitude === undefined || this.longitude === null || this.longitude === undefined) {
    const coords = cityCoords[this.location?.toLowerCase()] || cityCoords.hyderabad;
    this.latitude = coords.lat;
    this.longitude = coords.lng;
  }
  
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

riderSchema.static("matchPassword", async function (email, plainPassword) {
  const rider = await this.findOne({ email });
  if (!rider) throw new Error("Rider not found");

  const isMatch = await bcrypt.compare(plainPassword, rider.password);
  if (!isMatch) throw new Error("Incorrect password");

  //Return both token and sanitized rider (no password exposure)
  const token = createtoken(rider);
  const sanitizedRider = rider.toObject();
  delete sanitizedRider.password; // Remove password from returned object
  
  return { token, user: sanitizedRider };
});

const Rider = mongoose.model("Rider", riderSchema);
module.exports = Rider;