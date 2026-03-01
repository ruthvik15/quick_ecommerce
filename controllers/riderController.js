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
      return res.status(400).json({ error: "Order not available" });
    }

    order.riderId = req.user._id;
    order.status = "accepted";
    await order.save();

    res.json({ success: true, message: "Order accepted", order });
  } catch (err) {
    console.error("Error accepting order:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// Reject an order
const rejectOrder = async (req, res) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findById(orderId);

    if (!order || order.status !== "confirmed") {
      return res.status(400).json({ error: "Order not found or already processed." });
    }

    // Prevent duplicate ignores - check if rider already rejected this order
    const alreadyRejected = order.ignoredBy.some(rejection => 
      rejection.riderId.toString() === req.user._id.toString()
    );
    
    if (!alreadyRejected) {
      order.ignoredBy.push({ riderId: req.user._id, rejectedAt: new Date() });
      await order.save();
    }

    res.json({ success: true, message: "Order rejected" });
  } catch (err) {
    console.error("Error rejecting order:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// Get rider dashboard
const getDashboard = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });

    const rider = await Rider.findById(req.user._id);

    // Count completed orders
    const completedCount = await Order.countDocuments({
      riderId: rider._id,
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
      riderId: rider._id,
      status: { $in: ["accepted", "out-for-delivery"] },
      deliveryDate: { $gte: today, $lt: tomorrow }
    });

    // Count order requests (unassigned pending orders)
    const orderRequestCount = await Order.countDocuments({
      status: "confirmed",
      deliveryDate: { $gte: today }
    });

    res.json({
      success: true,
      rider,
      todaysOrderCount,
      orderRequestCount,
      user: req.user
    });
  } catch (err) {
    console.error("Error fetching dashboard:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// Rider signup
const signupRider = async (req, res) => {
  try {
    const { name, email, password, phone, location, vehicle_type, latitude, longitude, number_plate } = req.body;
    const role = "rider";

    // Basic validation
    if (!name || !email || !password || !phone || !location || !vehicle_type || !number_plate) {
      return res.status(400).json({ error: "All fields are required." });
    }

    // Check for existing rider
    const existing = await Rider.findOne({ email });
    if (existing) {
      return res.status(400).json({ error: "Rider with this email already exists." });
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
    res.cookie("token", token, { httpOnly: true });
    res.json({ success: true, token, role: "rider", user: newRider, redirectUrl: "/rider/dashboard" });
  } catch (err) {
    console.error("Rider signup failed:", err);
    res.status(500).json({ error: "Server error. Try again." });
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

    //Use aggregation pipeline instead of populate to avoid N+1 query problem
    // This makes 1 query instead of 1 + n*2 (n = number of orders)
    const orders = await Order.aggregate([
      {
        $match: {
          status: "confirmed",
          deliveryDate: { $gte: today },
          ignoredBy: { $not: { $elemMatch: { riderId: req.user._id } } }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "userDetails"
        }
      },
      {
        $lookup: {
          from: "products",
          localField: "productId",
          foreignField: "_id",
          as: "productDetails"
        }
      },
      {
        $unwind: { path: "$userDetails", preserveNullAndEmptyArrays: true }
      },
      {
        $unwind: { path: "$productDetails", preserveNullAndEmptyArrays: true }
      },
      {
        $sort: { deliveryDate: 1 }
      },
      {
        $project: {
          _id: 1,
          deliveryDate: 1,
          deliverySlot: 1,
          address: 1,
          userName: "$userDetails.name",
          userLocation: "$location",
          productName: "$productDetails.name",
          status: 1,
          phoneNumber: 1,
          paid: 1
        }
      }
    ]);

    const groupedOrders = {};

    orders.forEach(order => {
      const dateKey = new Date(order.deliveryDate).toDateString();

      if (!groupedOrders[dateKey]) {
        groupedOrders[dateKey] = [];
      }

      groupedOrders[dateKey].push(order);
    });

    // Sort slots inside each group by slot order
    Object.keys(groupedOrders).forEach(date => {
      groupedOrders[date].sort(
        (a, b) => slotOrder[a.deliverySlot] - slotOrder[b.deliverySlot]
      );
    });

    res.json({
      success: true,
      user: req.user,
      groupedOrders,
      status: "confirmed"
    });
  } catch (err) {
    console.error("Error fetching confirmed orders:", err);
    res.status(500).json({ error: "Server Error" });
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
      riderId: req.user._id,
      deliveryDate: { $gte: today, $lt: tomorrow }
    })
      .populate("userId")
      .populate("productId");

    // Group orders by time slot
    const groupedSlots = {};
    orders.forEach(order => {
      const slot = order.deliverySlot;
      if (!groupedSlots[slot]) groupedSlots[slot] = [];

      groupedSlots[slot].push({
        _id: order._id,
        deliveryDate: order.deliveryDate,
        deliverySlot: slot,
        address: order.address,
        userName: order.userId?.name,
        userLocation: order.location,
        productName: order.productId?.name,
        status: order.status,
        payment: order.paid ? "prepaid" : "cod"
      });
    });

    // BUG #26 FIX: Sort slots in correct order using slotOrder mapping
    const sortedGroupedSlots = Object.keys(slotOrder)
      .filter(slot => groupedSlots[slot])
      .reduce((acc, slot) => {
        // Within each slot, sort orders by userName for consistency
        groupedSlots[slot].sort((a, b) => (a.userName || '').localeCompare(b.userName || ''));
        acc[slot] = groupedSlots[slot];
        return acc;
      }, {});

    res.json({
      success: true,
      user: req.user,
      groupedSlots: sortedGroupedSlots
    });
  } catch (err) {
    console.error("Error fetching today's orders:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// Mark order as out for delivery
const markOrderOutForDelivery = async (req, res) => {
  try {
    const { orderId } = req.body;

    await Order.findByIdAndUpdate(orderId, {
      status: "out-for-delivery",
      riderId: req.user._id
    });

    res.json({ success: true, message: "Order Out for Delivery" });
  } catch (err) {
    console.error("Error marking order out for delivery:", err);
    res.status(500).json({ error: "Failed to update order status" });
  }
};

// Mark order as complete
const markOrderComplete = async (req, res) => {
  try {
    const { orderId } = req.body;
    await Order.findByIdAndUpdate(orderId, {
      status: "delivered"
    });

    res.json({ success: true, message: "Order Delivered" });
  } catch (err) {
    console.error("Error completing order:", err);
    res.status(500).json({ error: "Failed to mark order delivered" });
  }
};

// Get accepted orders
const getAcceptedOrders = async (req, res) => {
  try {
    const riderId = req.user._id;
    const activeOrders = await Order.find({
      riderId: riderId,
      status: { $in: ["accepted", "out-for-delivery"] }
    })
      .populate("userId")
      .populate("productId")
      .sort({ deliveryDate: 1, deliverySlot: 1 });

    // Group orders by delivery date
    const grouped = {};
    activeOrders.forEach(order => {
      const dateKey = new Date(order.deliveryDate).toDateString();
      if (!grouped[dateKey]) grouped[dateKey] = [];

      grouped[dateKey].push({
        _id: order._id,
        productName: order.productId?.name,
        userName: order.userId?.name,
        phoneNumber: order.phoneNumber || order.userId?.phone,
        address: order.address,
        userLocation: order.location,
        deliverySlot: order.deliverySlot,
        status: order.status,
        payment: order.paid ? "Prepaid" : "COD",
        amount: order.productId?.price
      });
    });

    res.json({
      success: true,
      user: req.user,
      groupedOrders: grouped
    });
  } catch (err) {
    console.error("Error fetching active rider orders:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// Get completed orders
const getCompletedOrders = async (req, res) => {
  try {
    const riderId = req.user._id;
    const deliveredOrders = await Order.find({
      riderId: riderId,
      status: "delivered"
    })
      .populate("userId")
      .populate("productId")
      .sort({ deliveryDate: -1, deliverySlot: 1 });

    // Group by delivery date
    const grouped = {};
    deliveredOrders.forEach(order => {
      const dateKey = new Date(order.deliveryDate).toDateString();
      if (!grouped[dateKey]) grouped[dateKey] = [];

      grouped[dateKey].push({
        _id: order._id,
        productName: order.productId?.name,
        userName: order.userId?.name,
        phoneNumber: order.phoneNumber || order.userId?.phone, // Phone fallback
        address: order.address,
        userLocation: order.location, // Map string or coords if available
        deliverySlot: order.deliverySlot,
        status: order.status,
        payment: order.paid ? "Prepaid" : "COD",
        amount: order.productId?.price // Useful to show amount to collect
      });
    });

    res.json({
      success: true,
      user: req.user,
      groupedOrders: grouped
    });
  } catch (err) {
    console.error("Error fetching completed orders:", err);
    res.status(500).json({ error: "Server error" });
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

    // BUG #28 FIX: Return JSON API response instead of HTML
    res.json({
      success: true,
      user: req.user,
      unacceptedOrders,
      count: unacceptedOrders.length
    });
  } catch (err) {
    console.error("Error fetching unaccepted orders:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

// Update order delivery slot
const updateOrderSlot = async (req, res) => {
  try {
    const { orderId, newDate, newSlot } = req.body;
    
    // BUG #27 FIX: Verify rider owns this order before updating
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    
    // Only the assigned rider can update the delivery slot
    if (order.riderId && order.riderId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Unauthorized: You can only modify your own orders" });
    }
    
    await Order.findByIdAndUpdate(orderId, {
      deliveryDate: new Date(newDate),
      deliverySlot: newSlot,
      status: "confirmed"
    });

    res.json({ success: true, message: "Order slot updated" });
  } catch (err) {
    console.error("Failed to update delivery slot", err);
    res.status(500).json({ error: "Error updating slot" });
  }
};

// Get order details
const getOrderDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id)
      .populate("userId", "name email phone address location")
      .populate("productId", "name price image description duration category");

    if (!order) {
      return res.status(404).json({ success: false, error: "Order not found" });
    }

    if (order.status !== 'confirmed' && order.riderId && order.riderId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, error: "Unauthorized" });
    }

    res.json({
      success: true,
      order: {
        _id: order._id,
        product: order.productId,
        user: order.userId,
        deliverySlot: order.deliverySlot,
        status: order.status,
        paymentMode: order.paid ? "Prepaid" : "COD",
        amount: order.productId?.price,
        orderDate: order.orderDate,
        phoneNumber: order.phoneNumber || order.userId?.phone,
        latitude: order.lat || order.userId?.latitude,
        longitude: order.lng || order.userId?.longitude,
        address: order.address || order.userId?.address
      }
    });

  } catch (error) {
    console.error("Error fetching order details:", error);
    res.status(500).json({ success: false, error: "Server error" });
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
  updateOrderSlot,
  getOrderDetails
};
