const Razorpay = require("razorpay");
require("dotenv").config();

const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

if (!keyId || !keySecret) {
  process.exit(1);
}

const razorpayInstance = new Razorpay({
  key_id: keyId,
  key_secret: keySecret,
});

module.exports = razorpayInstance;