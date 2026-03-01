const Razorpay = require("razorpay");
require("dotenv").config();

// FIXED: Validate Razorpay credentials exist before initializing
const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

if (!keyId || !keySecret) {
  console.error('ERROR: Razorpay credentials not configured in environment variables');
  process.exit(1);
}

const razorpayInstance = new Razorpay({
  key_id: keyId,
  key_secret: keySecret,
});

console.log('✅ Razorpay initialized successfully');
module.exports = razorpayInstance;