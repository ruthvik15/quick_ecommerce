const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const orderSchema = new Schema({
  productId: { 
    type: Schema.Types.ObjectId, 
    ref: "Product", 
    required: true
   },
   name:{
      type: String, 
       ref: "Product",

   },
   phoneNumber:{
      type:Number,
   },
   address: {
  type: String,
},
  userId: {
     type: Schema.Types.ObjectId,
     ref: "User",
     required: true },
  riderId: {
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
        default: false 
},
  status: { type: String,
     enum: [ "confirmed", "accepted", "delivered","out-for-delivery" ,"cancelled","missed"], 
     default: "confirmed" },

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
  riderId: { type: Schema.Types.ObjectId, ref: "Rider", required: true },
  rejectedAt: { type: Date, default: Date.now }
}],
razorpay_payment_id: { type: String }

}, { timestamps: true });

//Add critical indexes for frequently queried fields
// Rider gets pending orders filtered by status and deliveryDate
orderSchema.index({ status: 1, deliveryDate: 1 });
// For user order tracking
orderSchema.index({ userId: 1, createdAt: -1 });
// Legacy index - keep for backward compatibility but note field name changed
orderSchema.index({ productId: 1, createdAt: -1, status: 1 });

//TTL cleanup for ignoredBy array - remove rejections older than 1 hour
// Prevents array growth when riders repeatedly reject orders
orderSchema.index({ "ignoredBy.rejectedAt": 1 }, { sparse: true, expireAfterSeconds: 3600 });

// Pre-save hook: Clean expired rejections as fallback (in case TTL index doesn't trigger)
orderSchema.pre('save', function(next) {
  const oneHourAgo = new Date(Date.now() - 3600000);
  this.ignoredBy = this.ignoredBy.filter(rejection => rejection.rejectedAt > oneHourAgo);
  next();
});

const Order = mongoose.model("Order", orderSchema);
module.exports = Order;
