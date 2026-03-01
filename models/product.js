const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const productSchema = new Schema(
  {
    name: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true,
      min: [0, "Price cannot be negative"]
    },
    image: {
      type: String,
    },
    description: {
      type: String,
    },
    quantity: {
      type: Number,
      required: true,
      min: [0, "Quantity cannot be negative"]
    },
    location: {
      type: String,
      enum: ["hyderabad", "bengaluru", "mumbai", "delhi"],
      required: true
    },
    category: {
      type: String,
      enum: ["groceries", "electronics", "clothing", "food","other"],
    },
    seller: {
      type: Schema.Types.ObjectId,
      ref: "Seller"
    },
    status:{
      type:String,
      enum: ["live", "stopped", "sold"],
      default:"live"
    },
    soldCount: {
      type: Number,
      default: 0
    },
    averageRating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    }
  },
  { timestamps: true }
);

productSchema.index({ name: 1 });
productSchema.index({ location: 1, category: 1 });
productSchema.index({ price: 1 });
// Add status index for product filtering (live/stopped/sold)
productSchema.index({ status: 1 });
// Seller dashboard queries products by seller
productSchema.index({ seller: 1, status: 1 });
// Search with location and name
productSchema.index({ location: 1, name: 1, status: 1 });

const Product = mongoose.model("Product", productSchema);
module.exports = Product;
