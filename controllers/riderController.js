const Order = require("../models/order");
const Rider = require("../models/rider");
const Product = require("../models/product");
const { setCache } = require("../utils/cache");

// Accept Order
const acceptOrder = async (req, res) => {
  const { orderId } = req.body;
  const order = await Order.findById(orderId);
  if (!order || order.status !== "confirmed") return res.status(400).send("Order not available");

  order.rider_id = req.user._id;
  order.status = "accepted";
  await order.save();
  res.redirect("/rider/orders/pending");
};

// Reject Order
const rejectOrder = async (req, res) => {
  const { orderId } = req.body;
  const order = await Order.findById(orderId);
  if (!order || order.status !== "confirmed") return res.status(400).send("Order not found or already processed.");

  if (!order.ignoredBy.includes(req.user._id)) {
    order.ignoredBy.push(req.user._id);
    await order.save();
  }
  res.redirect("/rider/orders/pending");
};

// Dashboard
const dashboard = async (req, res) => {
  const rider = await Rider.findById(req.user._id);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const completedCount = await Order.countDocuments({ rider_id: rider._id, status: "delivered" });
  const todaysOrderCount = await Order.countDocuments({
    rider_id: rider._id,
    status: { $in: ["accepted", "out-for-delivery"] },
    deliveryDate: { $gte: today, $lt: tomorrow },
  });
  const orderRequestCount = await Order.countDocuments({
    status: "confirmed",
    deliveryDate: { $gte: today }
  });

  rider.no_of_orders = completedCount;
  res.render("rider/dashboard", { rider, todaysOrderCount, orderRequestCount });
};

// Signup
const signup = async (req, res) => {
  try {
    const { name, email, password, phone, location, vehicle_type, latitude, longitude, number_plate } = req.body;
    const role = "rider";
    if (!name || !email || !password || !phone || !location || !vehicle_type || !number_plate) {
      return res.status(400).send("All fields are required.");
    }
    const existing = await Rider.findOne({ email });
    if (existing) return res.status(400).send("Rider already exists.");

    const newRider = new Rider({
      name, email, password, phone, location, role, vehicle_type, number_plate,
      latitude: latitude || null,
      longitude: longitude || null
    });
    await newRider.save();

    const token = await Rider.matchPassword(email, password);
    res.cookie("token", token).redirect("/rider/dashboard");
  } catch (err) {
    console.error("Rider signup failed:", err);
    res.status(500).send("Server error.");
  }
};

// Update Rider Location via ID
const updateLocationById = async (req, res) => {
  const { latitude, longitude } = req.body;
  const rider = await Rider.findByIdAndUpdate(req.params.id, { latitude, longitude }, { new: true });
  if (!rider) return res.status(404).json({ error: "Rider not found" });
  res.json({ message: "Location updated", rider });
};

// Update Rider Location (with Redis)
const updateLocation = async (req, res) => {
  const { latitude, longitude } = req.body;
  const redisKey = `rider:location:${req.user._id}`;
  await Rider.findByIdAndUpdate(req.user._id, { latitude, longitude });
  await setCache(redisKey, { latitude, longitude }, 600);
  res.status(200).json({ message: "Location updated" });
};

// Export all
module.exports = {
  acceptOrder,
  rejectOrder,
  dashboard,
  signup,
  updateLocationById,
  updateLocation,
};
