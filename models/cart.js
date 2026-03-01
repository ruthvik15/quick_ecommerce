const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const cartSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true
  },
  items: [
    {
      product: {
        type: Schema.Types.ObjectId,
        ref: "Product",
        required: true
      },
      quantity: {
        type: Number,
        default: 1,
        min: 1
      }
    }
  ],
  // BUG #12 FIX: Track cart location to ensure all items are from same city
  location: {
    type: String,
    enum: ["hyderabad", "bengaluru", "mumbai", "delhi"],
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model("Cart", cartSchema);
