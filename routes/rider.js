const{Router}=require("express")
const router=Router();
const path = require("path");
const multer = require("multer");
const User =require("../models/user")
const Product = require("../models/product");
const Cart =require("../models/cart");
const Order = require("../models/order");
const Rider=require("../models/rider")
const redis = require("../utils/redisClient");

router.post("/orders/accept", async (req, res) => {
  const { orderId } = req.body;
  const order = await Order.findById(orderId);

  if (!order || order.status !== "confirmed") return res.status(400).send("Order not available");

  order.rider_id = req.user._id;
  order.status = "accepted";
  await order.save();

  res.redirect("/rider/orders/pending");
});

router.post("/orders/reject", async (req, res) => {
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
});


router.get("/dashboard", async (req, res) => {
  if (!req.user) return res.redirect("/login");

  const rider = await Rider.findById(req.user._id);

  // Count completed orders
  const completedCount = await Order.countDocuments({
    rider_id: rider._id,
    status: "delivered"
  });

  rider.no_of_orders = completedCount;

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
});


router.post("/signup", async (req, res) => {
  try {
    const { name, email, password, phone, location, vehicle_type, latitude, longitude,number_plate} = req.body;
    const role="rider"
    // Basic validation
    if (!name || !email || !password || !phone || !location || !vehicle_type ||!number_plate) {
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
});

router.post("/:id/location", async (req, res) => {
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
});
router.post("/update-location", async (req, res) => {
  try {
    const riderId = req.user._id; // assuming token middleware sets req.user
    const { latitude, longitude } = req.body;

    await Rider.findByIdAndUpdate(riderId, {
      latitude,
      longitude,
    });

    res.status(200).json({ message: "Location updated" });
  } catch (err) {
    console.error("Failed to update rider location:", err);
    res.status(500).json({ error: "Failed to update location" });
  }
});
router.get("/orders/pending", async (req, res) => {
  try {
    const slotOrder = {
      "10-12": 1,
      "12-2": 2,
      "2-4": 3,
      "4-6": 4
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0); // set time to 00:00 for strict date comparison

    const orders = await Order.find({
      status: "confirmed",
      deliveryDate: { $gte: today },
      ignoredBy: { $ne: req.user._id }
        // exclude past delivery dates
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
        address:order.address,
        ph_number:order.ph_number,
        paid:order.paid
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
});


router.get("/orders/today", async (req, res) => {
  try {
    const slotOrder = {
      "10-12": 1,
      "12-2": 2,
      "2-4": 3,
      "4-6": 4
    };
    
    // Simulated testing date
    // const today = new Date("2025-06-19T00:00:00Z");
    // const tomorrow = new Date("2025-06-20T00:00:00Z");
    const today = new Date();
today.setHours(0, 0, 0, 0); // Set to 00:00:00.000

const tomorrow = new Date(today);
tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Fetch only accepted orders for the logged-in rider and today’s delivery
    const orders = await Order.find({
status: { $in: ["accepted", "out-for-delivery", "delivered"] },
      rider_id: req.user._id, // ✅ rider-specific
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
});

router.post("/orders/out-for-delivery", async (req, res) => {
  const { orderId } = req.body;
  try {
    req.user.status="out-for-delivery"
    await Order.findByIdAndUpdate(orderId, {
      status: req.user.status,
      rider_id: req.user._id // attach the rider at accept time
    });
    res.redirect("/rider/orders/today");
  } catch (err) {
    console.error("Accept error:", err);
    res.status(500).send("Failed to accept order");
  }
});

router.post("/orders/complete", async (req, res) => {
  const { orderId } = req.body;

  try {
    await Order.findByIdAndUpdate(orderId, {
      status: "delivered"
    });
    res.redirect("/rider/orders/today");
  } catch (err) {
    console.error("Complete error:", err);
    res.status(500).send("Failed to mark order delivered");
  }
});

router.get("/orders/accepted", async (req, res) => {
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
});
router.get("/orders/completed", async (req, res) => {
  try {
    const riderId = req.user._id;

    const deliveredOrders = await Order.find({
      rider_id: riderId,
      status: "delivered"
    })
      .populate("user_id")
      .populate("product_id")
      .sort({ deliveryDate: -1, deliverySlot: 1 }); // most recent first

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
});

router.get("/orders/unaccepted", async (req, res) => {
  const now = new Date();

  const slotOrder = {
    "10-12": 10,
    "12-2": 12,
    "2-4": 14,
    "4-6": 16
  };

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

});
router.post("/orders/update-slot", async (req, res) => {
  const { orderId, newDate, newSlot } = req.body;

  try {
    await Order.findByIdAndUpdate(orderId, {
      deliveryDate: new Date(newDate),
      deliverySlot: newSlot,
      status:"confirmed"
    });

    res.redirect("/rider/orders/unaccepted");
  } catch (err) {
    console.error("Failed to update delivery slot", err);
    res.status(500).send("Error updating slot");
  }
});

module.exports=router;