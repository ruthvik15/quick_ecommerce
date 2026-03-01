const Cart = require("../models/cart");
const Product = require("../models/product");
const Order = require("../models/order");
const warehouseCoords = require("../utils/warehouseCoordinates");
const getDistanceKm = require("../utils/distance");
const razorpay = require("../utils/razorpay");
const crypto = require("crypto");
const mongoose = require("mongoose");
require("dotenv").config();

// BUG #21 FIX: Distance limit now configurable via environment variable
const MAX_DELIVERY_DISTANCE = process.env.MAX_DELIVERY_DISTANCE || 20;

async function showCheckoutPage(req, res) {
  const cart = await Cart.findOne({ user: req.user._id }).populate("items.product");

  if (!cart || cart.items.length === 0) {
    return res.status(400).json({ error: "Cart is empty" });
  }

  const firstLocation = cart.items[0].product.location.toLowerCase();
  const allSameLocation = cart.items.every(
    item => item.product.location.toLowerCase() === firstLocation
  );

  if (!allSameLocation) {
    return res.status(400).json({
      error: "All items in your cart must be from the same city to proceed to checkout.",
      code: "LOCATION_MISMATCH"
    });
  }

  // Get last used address/coords for this user
  const lastOrder = await Order.findOne({ userId: req.user._id })
    .sort({ createdAt: -1 });

  const warehouseData = warehouseCoords[firstLocation] || warehouseCoords["hyderabad"];

  res.json({
    success: true,
    user: req.user,
    cart,
    cartLocation: firstLocation,
    warehouseCoords: warehouseData,
    lastDelivery: lastOrder ? {
      address: lastOrder.address,
      lat: lastOrder.lat,
      lng: lastOrder.lng,
      phone: lastOrder.phoneNumber
    } : null,
    razorpayKeyId: process.env.RAZORPAY_KEY_ID
  });
}

async function processCheckout(req, res) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { deliveryDate, deliverySlot, latitude, longitude, paymentMethod, address, phone } = req.body;

    if (!address || !latitude || !longitude) {
      await session.abortTransaction();
      return res.status(400).json({ error: "Delivery address and location coordinates are required" });
    }

    const userId = req.user._id;
    const cart = await Cart.findOne({ user: userId }).populate("items.product").session(session);
    
    if (!cart || cart.items.length === 0) {
      await session.abortTransaction();
      return res.status(400).json({ error: "Cart is empty" });
    }

    // FIX for BUG #19 & #20: Validate all constraints before making any changes
    const ordersToCreate = [];
    
    for (const item of cart.items) {
      const product = item.product;
      // BUG #17 FIX: Use warehouse coordinates instead of city center for accurate delivery distance calculation
      const warehouseCoordData = warehouseCoords[product.location.toLowerCase()];
      const distance = getDistanceKm(
        parseFloat(latitude),
        parseFloat(longitude),
        warehouseCoordData.lat,
        warehouseCoordData.lng
      );

      // BUG #21 FIX: Use environment variable for distance limit
      if (distance > MAX_DELIVERY_DISTANCE) {
        await session.abortTransaction();
        return res.status(400).json({ error: `Product "${product.name}" cannot be delivered (Distance = ${distance.toFixed(1)} km, Limit = ${MAX_DELIVERY_DISTANCE} km)` });
      }
      
      // BUG #18 FIX: Verify product is active before allowing checkout
      if (product.status && product.status !== 'live') {
        await session.abortTransaction();
        return res.status(400).json({ error: `Product "${product.name}" is no longer available (Status: ${product.status})` });
      }

      // BUG #19 FIX: Use atomic findByIdAndUpdate to prevent race condition
      // Verify stock is available AND update in same atomic operation
      const updatedProduct = await Product.findByIdAndUpdate(
        product._id,
        { $inc: { quantity: -item.quantity, soldCount: +item.quantity } },
        { new: true, session, runValidators: true }
      );

      if (updatedProduct.quantity < 0) {
        // Stock was insufficient - revert transaction
        await session.abortTransaction();
        return res.status(400).json({ error: `Product "${product.name}" is out of stock.` });
      }

      ordersToCreate.push({
        productId: product._id,
        name: product.name,
        quantity: item.quantity,
        total: product.price * item.quantity,
        location: req.user.location,
        deliveryDate,
        deliverySlot,
        lat: parseFloat(latitude),
        lng: parseFloat(longitude),
        address,
        phoneNumber: phone
      });
    }

    if (paymentMethod === "cod") {
      // BUG #20 FIX: Create all orders atomically within transaction
      for (const orderData of ordersToCreate) {
        const order = new Order({
          ...orderData,
          userId: userId,
          status: "confirmed"
        });
        await order.save({ session });
      }

      await Cart.deleteOne({ user: userId }, { session });
      await session.commitTransaction();
      return res.json({ success: true, redirect: "/checkout/orders/success" });
    }

    // For Razorpay, defer order creation to verifyPayment
    // Store validated order data in session
    req.session.pendingOrders = ordersToCreate;
    req.session.checkoutUserId = userId;

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      await session.abortTransaction();
      return res.status(500).json({ error: "Razorpay keys are missing in server configuration." });
    }

    const amount = cart.items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    const razorOrder = await razorpay.orders.create({
      amount: amount * 100,
      currency: "INR",
      receipt: `order_rcptid_${Math.random().toString(36).substr(2, 9)}`
    });

    await session.abortTransaction();
    return res.json({
      razorpayOrderId: razorOrder.id,
      amount: razorOrder.amount,
      key: process.env.RAZORPAY_KEY_ID,
      deliveryDate,
      deliverySlot,
      latitude,
      longitude
    });
  } catch (err) {
    await session.abortTransaction();
    console.error("Checkout error:", err);
    res.status(500).json({ error: err.message || "Something went wrong during checkout" });
  } finally {
    await session.endSession();
  }
}

async function verifyPayment(req, res) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      deliveryDate,
      deliverySlot,
      latitude,
      longitude,
      address,
      phone
    } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: "Invalid payment signature" });
    }

    const userId = req.user._id;
    const cart = await Cart.findOne({ user: userId }).populate("items.product").session(session);

    if (!cart || cart.items.length === 0) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: "Cart is empty" });
    }

    // BUG #22 FIX: Re-validate cart location and distance constraints
    const firstLocation = cart.items[0].product.location.toLowerCase();
    const allSameLocation = cart.items.every(
      item => item.product.location.toLowerCase() === firstLocation
    );

    if (!allSameLocation) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Cart items are from different locations. Please update your cart."
      });
    }

    // Re-validate all items against location and distance
    const ordersToCreate = [];
    
    for (const item of cart.items) {
      const product = item.product;
      // BUG #17 FIX: Use warehouse coordinates instead of city center for accurate delivery distance calculation
      const warehouseCoordData = warehouseCoords[product.location.toLowerCase()];
      const distance = getDistanceKm(
        parseFloat(latitude),
        parseFloat(longitude),
        warehouseCoordData.lat,
        warehouseCoordData.lng
      );

      // BUG #21 FIX: Use environment variable for distance limit
      if (distance > MAX_DELIVERY_DISTANCE) {
        await session.abortTransaction();
        return res.status(400).json({ 
          success: false, 
          message: `Product "${product.name}" cannot be delivered (Distance = ${distance.toFixed(1)} km, Limit = ${MAX_DELIVERY_DISTANCE} km)` 
        });
      }
      
      // BUG #18 FIX: Re-verify product is still active at payment time
      if (product.status && product.status !== 'live') {
        await session.abortTransaction();
        return res.status(400).json({ 
          success: false, 
          message: `Product "${product.name}" is no longer available (Status: ${product.status})` 
        });
      }

      // BUG #19 FIX: Atomic stock check and update within transaction
      const updatedProduct = await Product.findByIdAndUpdate(
        product._id,
        { $inc: { quantity: -item.quantity, soldCount: +item.quantity } },
        { new: true, session, runValidators: true }
      );

      if (updatedProduct.quantity < 0) {
        // Stock insufficient - transaction will rollback
        await session.abortTransaction();
        return res.status(400).json({ 
          success: false, 
          message: `Product "${product.name}" is out of stock.` 
        });
      }

      ordersToCreate.push({
        productId: product._id,
        name: product.name,
        quantity: item.quantity,
        total: product.price * item.quantity,
        location: req.user.location,
        deliveryDate,
        deliverySlot,
        lat: parseFloat(latitude),
        lng: parseFloat(longitude),
        address,
        phoneNumber: phone
      });
    }

    // BUG #20 FIX: Create all orders atomically within transaction
    for (const orderData of ordersToCreate) {
      const order = new Order({
        ...orderData,
        userId: userId,
        status: "confirmed",
        paid: true,
        razorpay_payment_id
      });
      await order.save({ session });
    }

    await Cart.deleteOne({ user: userId }, { session });
    await session.commitTransaction();
    
    return res.json({ success: true, redirect: "/checkout/orders/success" });
  } catch (err) {
    await session.abortTransaction();
    console.error("Payment verification failed:", err);
    res.status(500).json({ success: false, message: "Payment verification failed" });
  } finally {
    await session.endSession();
  }
}

function showSuccessPage(req, res) {
  res.json({ success: true, message: "Order placed successfully" });
}

module.exports = {
  showCheckoutPage,
  processCheckout,
  verifyPayment,
  showSuccessPage
};
