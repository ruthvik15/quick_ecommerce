const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const reviewSchema = new Schema(
  {
    product_id: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true
    },
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    comment: {
      type: String,
      required: true
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true
    }
  },
  { timestamps: true }
);

const Review = mongoose.model("Review", reviewSchema);
module.exports = Review;
