const path = require("path");
const User = require("../models/user");
const Product = require("../models/product");
const Rider = require("../models/rider");
const Order = require("../models/order");
const { getCache, setCache } = require("../utils/cache");
const razorpay = require("../utils/razorpay");

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
  // If user role check is needed for redirection, handle in frontend or specific auth route
  // The API should just return data

  const selectedLocation = req.query.location || req.cookies.selectedLocation || req.user?.location || "hyderabad";
  const { category, sort } = req.query;
  const filter = { location: selectedLocation, status: { $ne: "stopped" } };
  const sortOption = {};

  if (category && category !== "All Products") {
    filter.category = category.toLowerCase();
  }

  if (sort === "low-high") sortOption.price = 1;
  else if (sort === "high-low") sortOption.price = -1;
  else if (sort === "newest") sortOption.createdAt = -1;

  const cacheKey = `products:${selectedLocation}:${category || "all"}:${sort || "default"}`;
  const cached = await getCache(cacheKey);

  if (cached) {
    return res.json({
      success: true,
      ...cached,
      user: req.user
    });
  }

  const products = await Product.find(filter).sort(sortOption);
  const categories = ["All Products", "groceries", "electronics", "clothing", "food"];

  await setCache(cacheKey, {
    products,
    categories,
    selectedLocation,
    selectedCategory: category || "",
    selectedSort: sort || "",
  });

  res.json({
    success: true,
    products,
    categories,
    user: req.user,
    selectedLocation,
    selectedCategory: category || "",
    selectedSort: sort || "",
  });
};
const getLogin = (req, res) => {
  res.render("login");
};

const getSignup = (req, res) => {
  res.render("signup");
};

const login = async (req, res) => {
  const { email, password, role } = req.body;

  try {
    if (role === "rider") {
      const token = await Rider.matchPassword(email, password);
      res.cookie("token", token, {
        httpOnly: true,
        secure: false, // Set to true in production
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000 // 1 day
      });
      return res.json({ success: true, token, role: "rider", redirectUrl: "/rider/dashboard" });
    }

    const token = await User.matchPassword(email, password);
    const user = await User.findOne({ email });

    if (!user) return res.status(400).json({ error: "User not found" });

    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000
    });

    if (role === "seller") {
      return res.json({ success: true, token, role: "seller", redirectUrl: "/seller/dashboard" });
    }

    res.clearCookie("selectedLocation");
    return res.json({ success: true, token, role: "user", user, redirectUrl: "/" });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(400).json({ error: "Email or password incorrect." });
  }
};

const signup = async (req, res) => {
  const { name, email, password, phone, location, role, address } = req.body;

  if (!name || !email || !password || !phone || !location || !role || !address) {
    return res.status(400).json({ error: "All fields are required." });
  }

  try {
    if (role === "rider") {
      // Rider signup page rendering logic - might need separate handling for API
      // For now, returning specific error or instruction
      return res.status(400).json({ error: "Rider signup not yet implemented via API" });
    }

    const user = new User({ name, email, password, phone, location, role, address });
    await user.save();

    const token = await User.matchPassword(email, password);
    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000
    });

    if (role === "seller") {
      return res.json({ success: true, token, role: "seller", redirectUrl: "/seller/dashboard" });
    }

    res.clearCookie("selectedLocation");
    return res.json({ success: true, token, role, user, redirectUrl: "/" });
  } catch (err) {
    console.error("Signup error:", err);
    if (err.code === 11000) return res.status(400).json({ error: "Email or phone already exists." });
    res.status(500).json({ error: "Server error" });
  }
};

const logout = (req, res) => {
  res.clearCookie("token");
  res.json({ success: true, message: "Logged out successfully" });
};

const trackOrders = async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });

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

  res.json({
    success: true,
    user: req.user,
    orders,
    missedOrdersCount,
  });
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
      try {
        await razorpay.payments.refund(order.razorpay_payment_id, {
          amount: order.total * 100,
        });
      } catch (refundErr) {
        console.error("Refund failed:", refundErr);
        return res.status(500).json({ error: "Refund failed. Please contact support." });
      }
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
  const Order = require("../models/order");

  try {
    const order = await Order.findById(req.params.orderId)
      .populate("rider_id")
      .populate("user_id")
      .populate("product_id");

    if (!order || !order.rider_id || !order.user_id) {
      return res.status(404).json({ error: "Order or delivery information not found" });
    }

    const redisKey = `rider:location:${order.rider_id._id}`;
    const cachedCoords = await getCache(redisKey);

    const riderCoords = cachedCoords
      ? { lat: cachedCoords.latitude, lng: cachedCoords.longitude }
      : { lat: order.rider_id.latitude, lng: order.rider_id.longitude };

    res.json({
      success: true,
      user: req.user,
      order,
      rider: order.rider_id,
      product: order.product_id,
      userCoords: { lat: order.lat, lng: order.lng }, // lat/lng might be on user or order depending on schema, assuming order for now as per render
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

// 🔍 GET /search-suggestions
const searchSuggestions = async (req, res) => {
  try {
    const q = (req.query.q || "").trim();
    if (!q) return res.json([]);

    const docs = await Product
      .find({ name: new RegExp("^" + q, "i") })
      .limit(5)
      .select("name -_id");

    const names = docs.map(d => d.name);
    res.json(names);
  } catch (err) {
    console.error("Suggestions error:", err);
    res.status(500).json({ error: "Failed to fetch suggestions" });
  }
};

// 🔎 POST /search (homepage search box)
const handleSearchPost = async (req, res) => {
  const { searchQuery } = req.body;

  if (!searchQuery || searchQuery.trim() === "") {
    return res.json({ success: false, error: "Empty query" });
  }

  try {
    const safeQuery = escapeRegex(searchQuery.trim());
    const regex = new RegExp(safeQuery, "i");
    const results = await Product.find({ name: regex });

    return res.json({
      success: true,
      query: searchQuery,
      products: results,
      selectedCategory: "",
      selectedSort: ""
    });
  } catch (err) {
    console.error("Search failed:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// 🔎 GET /search (search results + filter/sort)
const handleSearchGet = async (req, res) => {
  const { searchQuery = "", category, sort } = req.query;

  const safeQuery = escapeRegex(searchQuery.trim());
  let query = { name: new RegExp(safeQuery, "i") };

  if (category) {
    query.category = category;
  }

  let sortOption = {};
  if (sort === "low-high") sortOption.price = 1;
  else if (sort === "high-low") sortOption.price = -1;
  else if (sort === "newest") sortOption.createdAt = -1;

  try {
    const products = await Product.find(query).sort(sortOption);
    res.json({
      success: true,
      products,
      query: searchQuery,
      selectedCategory: category || "",
      selectedSort: sort || ""
    });
  } catch (err) {
    console.error("GET Search failed:", err);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = {
  setLocation,
  renderHome,
  login,
  signup,
  logout,
  trackOrders,
  cancelOrder,
  trackSingleOrder,
  searchSuggestions,
  handleSearchPost,
  handleSearchGet,
  getLogin,
  getSignup,
  searchSuggestions,

};
