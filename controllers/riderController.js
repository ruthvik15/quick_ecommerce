// controllers/riderController.js
const path = require("path");
const multer = require("multer");
const User = require("../models/user");
const Product = require("../models/product");
const Cart = require("../models/cart");
const Order = require("../models/order");
const Rider = require("../models/rider");
const redis = require("../utils/redisClient");
const { getCache, setCache } = require("../utils/cache");

// Slot order mapping
const slotOrder = {
  "10-12": 1,
  "12-2": 2,
  "2-4": 3,
  "4-6": 4
};

// Accept an order
const acceptOrder = async (req, res) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findById(orderId);

    if (!order || order.status !== "confirmed") {
      return res.status(400).send("Order not available");
    }

    order.rider_id = req.user._id;
    order.status = "accepted";
    await order.save();

    res.redirect("/rider/orders/pending");
  } catch (err) {
    console.error("Error accepting order:", err);
    res.status(500).send("Server error");
  }
};

// Reject an order
const rejectOrder = async (req, res) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findById(orderId);
    
    if (!order || order.status !== "confirmed") {
      return res.status(400).send("Order not found or already processed.");
    }

    // Prevent duplicate ignores
    if (!order.ignoredBy.includes(req.user._id)) {
      order.ignoredBy.push(req.user._id);
      await order.save();
    }

    res.redirect("/rider/orders/pending");
  } catch (err) {
    console.error("Error rejecting order:", err);
    res.status(500).send("Server error");
  }
};

// Get rider dashboard
const getDashboard = async (req, res) => {
  try {
    if (!req.user) return res.redirect("/login");

    const rider = await Rider.findById(req.user._id);

    // Count completed orders
    const completedCount = await Order.countDocuments({
      rider_id: rider._id,
      status: "delivered"
    });

    rider.no_of_orders = completedCount;
    await rider.save();

    // Count today's accepted or out-for-delivery orders
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const todaysOrderCount = await Order.countDocuments({
      rider_id: rider._id,
      status: { $in: ["accepted", "out-for-delivery"] },
      deliveryDate: { $gte: today, $lt: tomorrow }
    });

    // Count order requests (unassigned pending orders)
    const orderRequestCount = await Order.countDocuments({
      status: "confirmed",
      deliveryDate: { $gte: today }
    });

    res.render("rider/dashboard", {
      rider,
      todaysOrderCount,
      orderRequestCount
    });
  } catch (err) {
    console.error("Error fetching dashboard:", err);
    res.status(500).send("Server error");
  }
};

// Rider signup
const signupRider = async (req, res) => {
  try {
    const { name, email, password, phone, location, vehicle_type, latitude, longitude, number_plate } = req.body;
    const role = "rider";
    
    // Basic validation
    if (!name || !email || !password || !phone || !location || !vehicle_type || !number_plate) {
      return res.status(400).send("All fields are required.");
    }

    // Check for existing rider
    const existing = await Rider.findOne({ email });
    if (existing) {
      return res.status(400).send("Rider with this email already exists.");
    }

    // Create new rider
    const newRider = new Rider({
      name,
      email,
      password,
      phone,
      location,
      role,
      vehicle_type,
      latitude: latitude || null,
      longitude: longitude || null,
      number_plate
    });

    await newRider.save();

    // Generate JWT token
    const token = await Rider.matchPassword(email, password);

    // Set token in cookie
    res.cookie("token", token).redirect("/rider/dashboard");
  } catch (err) {
    console.error("Rider signup failed:", err);
    res.status(500).send("Server error. Try again.");
  }
};

// Update rider location by ID
const updateLocationById = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    const riderId = req.params.id;

    if (!latitude || !longitude) {
      return res.status(400).json({ error: "Latitude and longitude required" });
    }

    const rider = await Rider.findByIdAndUpdate(riderId, {
      latitude,
      longitude,
    }, { new: true });

    if (!rider) return res.status(404).json({ error: "Rider not found" });

    res.json({ message: "Location updated", rider });
  } catch (err) {
    console.error("Location update failed:", err);
    res.status(500).json({ error: "Failed to update location" });
  }
};

// Update current rider's location
const updateLocation = async (req, res) => {
  try {
    const riderId = req.user._id;
    const { latitude, longitude } = req.body;

    // Save to Redis
    const redisKey = `rider:location:${riderId}`;
    await setCache(redisKey, { latitude, longitude }, 600); // cache for 10 mins

    res.status(200).json({ message: "Location updated" });
  } catch (err) {
    console.error("Failed to update rider location:", err);
    res.status(500).json({ error: "Failed to update location" });
  }
};

// Get pending orders
const getPendingOrders = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const orders = await Order.find({
      status: "confirmed",
      deliveryDate: { $gte: today },
      ignoredBy: { $ne: req.user._id }
    })
      .populate("user_id")
      .populate("product_id")
      .sort({ deliveryDate: 1 });

    const groupedOrders = {};

    orders.forEach(order => {
      const dateKey = new Date(order.deliveryDate).toDateString();

      if (!groupedOrders[dateKey]) {
        groupedOrders[dateKey] = [];
      }

      groupedOrders[dateKey].push({
        _id: order._id,
        deliveryDate: order.deliveryDate,
        deliverySlot: order.deliverySlot,
        address: order.user_id.address,
        userName: order.user_id.name,
        userLocation: order.user_id.location,
        productName: order.product_id.name,
        status: order.status,
        address: order.address,
        ph_number: order.ph_number,
        paid: order.paid
      });
    });

    // Sort slots inside each group by slot order
    Object.keys(groupedOrders).forEach(date => {
      groupedOrders[date].sort(
        (a, b) => slotOrder[a.deliverySlot] - slotOrder[b.deliverySlot]
      );
    });

    res.render("rider/order-pending", {
      user: req.user,
      groupedOrders,
      status: "confirmed"
    });
  } catch (err) {
    console.error("Error fetching confirmed orders:", err);
    res.status(500).send("Server Error");
  }
};

// Get today's orders
const getTodayOrders = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Fetch only accepted orders for the logged-in rider and today's delivery
    const orders = await Order.find({
      status: { $in: ["accepted", "out-for-delivery", "delivered"] },
      rider_id: req.user._id,
      deliveryDate: { $gte: today, $lt: tomorrow }
    })
      .populate("user_id")
      .populate("product_id")
      .sort({ deliverySlot: 1 });

    // Group orders by time slot
    const groupedSlots = {};
    orders.forEach(order => {
      const slot = order.deliverySlot;
      if (!groupedSlots[slot]) groupedSlots[slot] = [];
      
      groupedSlots[slot].push({
        _id: order._id,
        deliveryDate: order.deliveryDate,
        deliverySlot: slot,
        address: order.user_id.address,
        userName: order.user_id.name,
        userLocation: order.user_id.location,
        productName: order.product_id.name,
        status: order.status,
        payment: order.paid ? "prepaid" : "cod"
      });
    });

    // Sort slots in desired order
    const sortedGroupedSlots = Object.keys(slotOrder)
      .filter(slot => groupedSlots[slot])
      .reduce((acc, slot) => {
        acc[slot] = groupedSlots[slot];
        return acc;
      }, {});

    res.render("rider/orders-today", {
      user: req.user,
      groupedSlots: sortedGroupedSlots
    });
  } catch (err) {
    console.error("Error fetching today's orders:", err);
    res.status(500).send("Server error");
  }
};

// Mark order as out for delivery
const markOrderOutForDelivery = async (req, res) => {
  try {
    const { orderId } = req.body;
    req.user.status = "out-for-delivery";
    
    await Order.findByIdAndUpdate(orderId, {
      status: req.user.status,
      rider_id: req.user._id
    });
    
    res.redirect("/rider/orders/today");
  } catch (err) {
    console.error("Error marking order out for delivery:", err);
    res.status(500).send("Failed to update order status");
  }
};

// Mark order as complete
const markOrderComplete = async (req, res) => {
  try {
    const { orderId } = req.body;
    await Order.findByIdAndUpdate(orderId, {
      status: "delivered"
    });
    
    res.redirect("/rider/orders/today");
  } catch (err) {
    console.error("Error completing order:", err);
    res.status(500).send("Failed to mark order delivered");
  }
};

// Get accepted orders
const getAcceptedOrders = async (req, res) => {
  try {
    const riderId = req.user._id;
    const activeOrders = await Order.find({
      rider_id: riderId,
      status: { $in: ["accepted", "out-for-delivery"] }
    })
      .populate("user_id")
      .populate("product_id")
      .sort({ deliveryDate: 1, deliverySlot: 1 });

    // Group orders by delivery date
    const grouped = {};
    activeOrders.forEach(order => {
      const dateKey = new Date(order.deliveryDate).toDateString();
      if (!grouped[dateKey]) grouped[dateKey] = [];
      
      grouped[dateKey].push({
        _id: order._id,
        productName: order.product_id.name,
        userName: order.user_id.name,
        address: order.user_id.address,
        deliverySlot: order.deliverySlot,
        status: order.status
      });
    });

    res.render("rider/orders-active", {
      user: req.user,
      groupedOrders: grouped
    });
  } catch (err) {
    console.error("Error fetching active rider orders:", err);
    res.status(500).send("Server error");
  }
};

// Get completed orders
const getCompletedOrders = async (req, res) => {
  try {
    const riderId = req.user._id;
    const deliveredOrders = await Order.find({
      rider_id: riderId,
      status: "delivered"
    })
      .populate("user_id")
      .populate("product_id")
      .sort({ deliveryDate: -1, deliverySlot: 1 });

    // Group by delivery date
    const grouped = {};
    deliveredOrders.forEach(order => {
      const dateKey = new Date(order.deliveryDate).toDateString();
      if (!grouped[dateKey]) grouped[dateKey] = [];
      
      grouped[dateKey].push({
        _id: order._id,
        productName: order.product_id.name,
        userName: order.user_id.name,
        address: order.user_id.address,
        deliverySlot: order.deliverySlot,
        status: order.status
      });
    });

    res.render("rider/orders-completed", {
      user: req.user,
      groupedOrders: grouped
    });
  } catch (err) {
    console.error("Error fetching completed orders:", err);
    res.status(500).send("Server error");
  }
};

// Get unaccepted orders
const getUnacceptedOrders = async (req, res) => {
  try {
    const now = new Date();
    const orders = await Order.find({ status: "missed" });
    
    const unacceptedOrders = orders.filter(order => {
      const slotStartHour = slotOrder[order.deliverySlot];
      if (!slotStartHour) return false;

      const slotStart = new Date(order.deliveryDate);
      slotStart.setHours(slotStartHour, 0, 0, 0);
      
      return now >= slotStart;
    });

    res.render("user-unaccepted-orders", {
      user: req.user,
      unacceptedOrders
    });
  } catch (err) {
    console.error("Error fetching unaccepted orders:", err);
    res.status(500).send("Server error");
  }
};

// Update order delivery slot
const updateOrderSlot = async (req, res) => {
  try {
    const { orderId, newDate, newSlot } = req.body;
    await Order.findByIdAndUpdate(orderId, {
      deliveryDate: new Date(newDate),
      deliverySlot: newSlot,
      status: "confirmed"
    });

    res.redirect("/rider/orders/unaccepted");
  } catch (err) {
    console.error("Failed to update delivery slot", err);
    res.status(500).send("Error updating slot");
  }
};

// Export all controller methods
module.exports = {
  acceptOrder,
  rejectOrder,
  getDashboard,
  signupRider,
  updateLocationById,
  updateLocation,
  getPendingOrders,
  getTodayOrders,
  markOrderOutForDelivery,
  markOrderComplete,
  getAcceptedOrders,
  getCompletedOrders,
  getUnacceptedOrders,
  updateOrderSlot
};
