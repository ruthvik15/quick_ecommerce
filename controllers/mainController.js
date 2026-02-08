const path = require("path");
const User = require("../models/user");
const Product = require("../models/product");
const Rider = require("../models/rider");
const Seller = require("../models/seller");
const Order = require("../models/order");
const { getCache, setCache } = require("../utils/cache");
const razorpay = require("../utils/razorpay");
const { createtoken } = require("../utils/auth");

const cityCoords = require("../utils/cityCoordinates");
const getDistanceKm = require("../utils/distance");

const setLocation = (req, res) => {
  const loc = req.query.loc?.toLowerCase();
  const validLocations = ["hyderabad", "bengaluru", "mumbai", "delhi"];
  if (!validLocations.includes(loc)) return res.redirect("/");
  res.cookie("selectedLocation", loc, { maxAge: 30 * 24 * 60 * 60 * 1000 });
  res.redirect("/");
};

const renderHome = async (req, res) => {
  const selectedLocation = req.query.location || req.cookies.selectedLocation || req.user?.location || "hyderabad";
  const { category, sort, page = 1, limit = 10 } = req.query;

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  const filter = { location: selectedLocation, status: { $ne: "stopped" } };
  const sortOption = {};

  if (category && category !== "All Products") filter.category = category.toLowerCase();

  if (sort === "low-high") sortOption.price = 1;
  else if (sort === "high-low") sortOption.price = -1;
  else if (sort === "newest") sortOption.createdAt = -1;

  const cacheKey = `products:${selectedLocation}:${category || "all"}:${sort || "default"}:${pageNum}:${limitNum}`;
  const cached = await getCache(cacheKey);

  if (cached) {
    return res.json({ success: true, ...cached, user: req.user });
  }

  const products = await Product.find(filter).sort(sortOption).skip(skip).limit(limitNum + 1);
  const hasNextPage = products.length > limitNum;
  const paginatedProducts = hasNextPage ? products.slice(0, limitNum) : products;

  const categories = ["All Products", "groceries", "electronics", "clothing", "food"];

  const responseData = {
    products: paginatedProducts,
    categories,
    selectedLocation,
    selectedCategory: category || "",
    selectedSort: sort || "",
    pagination: { currentPage: pageNum, limit: limitNum, hasNextPage }
  };

  await setCache(cacheKey, responseData);
  res.json({ success: true, ...responseData, user: req.user });
};


const login = async (req, res) => {
  const { email, password, role } = req.body;

  try {
    let token, user, redirectUrl;

    if (role === "rider") {
      token = await Rider.matchPassword(email, password);
      user = await Rider.findOne({ email }).select("-password");
      redirectUrl = "/rider/dashboard";
    }
    else if (role === "seller") {
      token = await Seller.matchPassword(email, password);
      user = await Seller.findOne({ email }).select("-password");
      redirectUrl = "/seller/dashboard";
    }
    else {
      token = await User.matchPassword(email, password);
      user = await User.findOne({ email }).select("-password");
      redirectUrl = "/";
      res.clearCookie("selectedLocation");
    }

    if (!user || !token) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000
    });
    //todo refactor not to send total user object
    return res.json({ success: true, token, role, user, redirectUrl });

  } catch (error) {
    console.error("Login error:", error);
    return res.status(400).json({ error: "Email or password incorrect." });
  }
};

const signup = async (req, res) => {
  const { name, email, password, phone, location, role, vehicle_type, address, shopName } = req.body;

  if (!name || !email || !password || !phone || !location || !role) {
    return res.status(400).json({ error: "All fields are required." });
  }

  try {
    let newUser, redirectUrl;

    if (role === "rider") {
      if (!vehicle_type || !address) return res.status(400).json({ error: "Vehicle and Address required." });
      newUser = new Rider({ name, email, password, phone, location, role, vehicle_type, address });
      redirectUrl = "/rider/dashboard";
    }
    else if (role === "seller") {
      if (!address || !shopName) return res.status(400).json({ error: "Shop Name and Address required." });
      newUser = new Seller({ name, email, password, phone, location, role, address, shopName });
      redirectUrl = "/seller/dashboard";
    }
    else {
      newUser = new User({ name, email, password, phone, location, role, address: "" });
      redirectUrl = "/";
    }

    await newUser.save();
    const token = createtoken(newUser);

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });
    //todo refactor not to send total user object
    return res.json({ success: true, token, role, user: newUser, redirectUrl });

  } catch (err) {
    console.error("Signup error:", err);
    if (err.code === 11000) return res.status(400).json({ error: "Email, Phone, or Shop Name already exists." });
    res.status(500).json({ error: "Server error" });
  }
};

const logout = (req, res) => {
  res.clearCookie("token");
  res.json({ success: true, message: "Logged out successfully" });
};

const trackOrders = async (req, res) => {
  const now = new Date();
  const slotStartHours = { "10-12": 10, "12-2": 12, "2-4": 14, "4-6": 16 };
  let orders = await Order.find({ user_id: req.user._id }).populate("product_id").sort({ createdAt: -1 });
  let missedOrdersCount = 0;

  for (let order of orders) {
    if (["confirmed", "missed", "accepted", "out-for-delivery"].includes(order.status)) {
      const slotHour = slotStartHours[order.deliverySlot];
      if (slotHour !== undefined) {
        const slotStart = new Date(order.deliveryDate);
        slotStart.setHours(slotHour, 0, 0, 0);
        if (now >= slotStart) {
          missedOrdersCount++;
          order.status = "missed";
          await order.save();
        }
      }
    }
  }
  res.json({ success: true, user: req.user, orders, missedOrdersCount });
};

const cancelOrder = async (req, res) => {
  const { orderId } = req.body;
  try {
    const order = await Order.findOne({
      _id: orderId,
      user_id: req.user._id,
      status: { $in: ["confirmed", "missed"] },
    });
    if (!order) return res.status(400).json({ error: "Invalid or already processed order" });

    if (order.paid && order.razorpay_payment_id) {
      await razorpay.payments.refund(order.razorpay_payment_id, { amount: order.total * 100 });
    }

    await Product.findByIdAndUpdate(order.product_id, {
      $inc: { quantity: order.quantity, soldCount: -order.quantity },
    });

    order.status = "cancelled";
    await order.save();
    res.json({ success: true, message: "Order cancelled" });
  } catch (err) {
    console.error("Cancel failed:", err);
    res.status(500).json({ error: "Error cancelling order" });
  }
};

const trackSingleOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId)
      .populate("rider_id")
      .populate("user_id")
      .populate("product_id");

    if (!order || !order.user_id) {
      return res.status(404).json({ error: "Order or user info not found" });
    }

    let riderCoords = null;
    if (order.rider_id) {
      const redisKey = `rider:location:${order.rider_id._id}`;
      const cachedCoords = await getCache(redisKey);
      riderCoords = cachedCoords
        ? { lat: cachedCoords.latitude, lng: cachedCoords.longitude }
        : { lat: order.rider_id.latitude, lng: order.rider_id.longitude };
    }

    res.json({
      success: true,
      user: req.user,
      order,
      rider: order.rider_id || null,
      product: order.product_id,
      userCoords: { lat: order.user_id.latitude, lng: order.user_id.longitude },
      riderCoords,
    });
  } catch (err) {
    console.error("Tracking error:", err);
    res.status(500).json({ error: "Error loading order tracking" });
  }
};

function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

const searchSuggestions = async (req, res) => {
  try {
    const q = (req.query.q || "").trim();
    if (!q) return res.json([]);
    const docs = await Product.find({ name: new RegExp("^" + escapeRegex(q), "i") }).limit(5).select("name -_id");
    res.json(docs.map(d => d.name));
  } catch (err) {
    res.status(500).json({ error: "Failed" });
  }
};

const handleSearchPost = async (req, res) => {
  const { searchQuery } = req.body;
  if (!searchQuery?.trim()) return res.json({ success: false, error: "Empty query" });
  try {
    const results = await Product.find({ name: new RegExp(escapeRegex(searchQuery.trim()), "i") });
    return res.json({ success: true, query: searchQuery, products: results, selectedCategory: "", selectedSort: "" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

const handleSearchGet = async (req, res) => {
  const { searchQuery = "", category, sort, page = 1, limit = 10 } = req.query;
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  let query = { name: new RegExp(escapeRegex(searchQuery.trim()), "i") };
  if (category) query.category = category;

  let sortOption = {};
  if (sort === "low-high") sortOption.price = 1;
  else if (sort === "high-low") sortOption.price = -1;
  else if (sort === "newest") sortOption.createdAt = -1;

  try {
    const products = await Product.find(query).sort(sortOption).skip(skip).limit(limitNum + 1);
    const hasNextPage = products.length > limitNum;
    const paginatedProducts = hasNextPage ? products.slice(0, limitNum) : products;

    res.json({
      success: true,
      query: searchQuery,
      products: paginatedProducts,
      selectedCategory: category || "",
      selectedSort: sort || "",
      pagination: { currentPage: pageNum, limit: limitNum, hasNextPage }
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = {
  setLocation, renderHome, login, signup, logout, trackOrders, cancelOrder,
  trackSingleOrder, searchSuggestions, handleSearchPost, handleSearchGet
};