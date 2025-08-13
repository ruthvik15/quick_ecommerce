const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// const orderSchema = new Schema({
//   product_id: {
//     type: Schema.Types.ObjectId,
//     ref: "Product",
//     required: true
//   },
//   user_id: {
//     type: Schema.Types.ObjectId,
//     ref: "User",
//     required: true
//   },
//   rider_id: {
//     type: Schema.Types.ObjectId,
//     ref: "Rider",
//   },
//   total: {  
//     type: Number,
//     required: true
//   },
//   location: {
//     type: String,
//     enum: ["hyderabad", "bengaluru", "mumbai", "delhi"],
//     required: true
//   },
//   status: {  // Added status tracking
//     type: String,
//     enum: ["pending", "confirmed", "shipped", "delivered", "cancelled"],
//     default: "pending"
//   },
//   quantity: {  
//     type: Number,
//     required: true,
//     min: 1
//   }
// }, { timestamps: true });
// orderSchema.index({ user_id: 1 }); // Index for user orders
// orderSchema.index({ rider_id: 1 }); // Index for rider assignments
// orderSchema.index({ status: 1 }); // Index for status queries
// orderSchema.index({ location: 1, createdAt: -1 }); // Compound index for location/time queries


// const Order = mongoose.model("Order", orderSchema);
// module.exports = Order;
const orderSchema = new Schema({
  product_id: { 
    type: Schema.Types.ObjectId, 
    ref: "Product", 
    required: true
   },
   name:{
      type: String, 
       ref: "Product",

   },
   ph_number:{
      type:Number,
   },
   address: {
  type: String,
},
  user_id: {
     type: Schema.Types.ObjectId,
     ref: "User",
     required: true },
  rider_id: {
     type: Schema.Types.ObjectId, 
     ref: "Rider" 
    },
  quantity: {
   type: Number,
   required: true,
   min: 1
  },
  total: {
     type: Number,
     required: true },
  location: {
      type: String,
      enum: ["hyderabad", "bengaluru", "mumbai", "delhi"],
      required: true },
   paid: {
       type: Boolean,
        default: false // COD by default
},
  status: { type: String,
     enum: [ "confirmed", "accepted", "delivered","out-for-delivery" ,"cancelled","missed"], 
     default: "confirmed" },

  // 🆕 Slot info
  deliveryDate: { 
    type: Date,
     required: true }, // Format: YYYY-MM-DD
  deliverySlot: { 
    type: String, 
    enum: ["10-12", "12-2", "2-4", "4-6"], 
    required: true },
    lat: { type: Number },
lng: { type: Number },
ignoredBy: [{
  type: Schema.Types.ObjectId,
  ref: "Rider"
}],
razorpay_payment_id: { type: String }

}, { timestamps: true });

orderSchema.index({ product_id: 1, createdAt: -1,status: 1  });
const Order = mongoose.model("Order", orderSchema);
module.exports = Order;
