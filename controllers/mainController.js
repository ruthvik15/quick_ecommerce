const path = require("path");
const User = require("../models/user");
const Product = require("../models/product");
const Cart = require("../models/cart");
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
  const { category, sort, page = 1, limit = 20 } = req.query; // Changed default limit to 20


  // Check if user has cart items from different location and remove them
  let cartLocationMismatch = false;
  if (req.user) {
    const cart = await Cart.findOne({ user: req.user._id }).populate("items.product");
    if (cart && cart.items.length > 0) {
      // Filter out items from different locations
      const originalLength = cart.items.length;
      cart.items = cart.items.filter(item => {
        if (item.product && item.product.location !== selectedLocation) {
          return false; // Remove item from different location
        }
        return true;
      });
      
      // If items were removed, save cart and notify user
      if (cart.items.length < originalLength) {
        await cart.save();
        cartLocationMismatch = true;
      }
    }
  }

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  const filter = { location: selectedLocation, status: { $ne: "stopped" } };
  const sortOption = {};

  if (category && category !== "All Products") filter.category = category.toLowerCase();

  if (sort === "low-high") sortOption.price = 1;
  else if (sort === "high-low") sortOption.price = -1;
  else if (sort === "newest") sortOption.createdAt = -1;

  //Smart page-wise caching strategy
  // Only cache "all" category for pages 1-5 (first 100 products)
  // Other categories always query DB (stays fresh)
  // TTL: 3 minutes (invalidate frequently)
  
  const isAllCategory = !category || category === "All Products";
  const shouldCache = isAllCategory && pageNum <= 5; // Only cache first 5 pages
  
  let products;
  
  if (shouldCache) {
    // TRY TO GET FROM CACHE (only for pages 1-5 of "all" category)
    const cacheKey = `products:${selectedLocation}:all:${sort || "default"}:page:${pageNum}:${limitNum}`;
    const cached = await getCache(cacheKey);
    
    if (cached) {
      // Cache hit - super fast!
      return res.json({ success: true, ...cached, user: req.user });
    }
    
    // Cache miss - query DB and cache this page
    products = await Product.find(filter)
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum);
    
    // Calculate hasNextPage for this page
    const allCountForPrefix = await Product.countDocuments(filter);
    const hasNextPage = (skip + limitNum) < allCountForPrefix;
    
    const categories = ["All Products", "groceries", "electronics", "clothing", "food"];
    const responseData = {
      products,
      categories,
      selectedLocation,
      selectedCategory: category || "",
      selectedSort: sort || "",
      pagination: { 
        currentPage: pageNum, 
        limit: limitNum, 
        hasNextPage,
        totalItems: allCountForPrefix
      },
      cartLocationMismatch // Notify frontend if cart items were removed
    };
    
    // Cache this specific page for 3 minutes
    await setCache(cacheKey, responseData, 180);
    return res.json({ success: true, ...responseData, user: req.user });
    
  } else {
    // OTHER CATEGORIES or pages > 5: Direct DB query (no caching)
    // Always fresh data, no memory bloat
    products = await Product.find(filter)
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum);
    
    // Check if there's a next page
    const allCountForCategory = await Product.countDocuments(filter);
    const hasNextPage = (skip + limitNum) < allCountForCategory;
    
    const categories = ["All Products", "groceries", "electronics", "clothing", "food"];
    const responseData = {
      products,
      categories,
      selectedLocation,
      selectedCategory: category || "",
      selectedSort: sort || "",
      pagination: { 
        currentPage: pageNum, 
        limit: limitNum, 
        hasNextPage,
        totalItems: allCountForCategory
      },
      cartLocationMismatch // Notify frontend if cart items were removed
    };
    
    return res.json({ success: true, ...responseData, user: req.user });
  }
};


const login = async (req, res) => {
  const { email, password, role } = req.body;

  try {
    let result, redirectUrl;

    // matchPassword now returns { token, user } with password already removed
    if (role === "rider") {
      result = await Rider.matchPassword(email, password);
      redirectUrl = "/rider/dashboard";
    }
    else if (role === "seller") {
      result = await Seller.matchPassword(email, password);
      redirectUrl = "/seller/dashboard";
    }
    else {
      result = await User.matchPassword(email, password);
      redirectUrl = "/";
    }

    if (!result || !result.user || !result.token) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const { token, user } = result;

    // Preserve selectedLocation cookie if it exists, otherwise set to user's location
    const existingLocation = req.cookies.selectedLocation;
    if (!existingLocation && user.location) {
      res.cookie("selectedLocation", user.location, {
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        httpOnly: false // Accessible to JavaScript for frontend
      });
    }

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000
    });
    
    return res.json({ success: true, token, role, user: { _id: user._id, name: user.name, email: user.email, role: user.role }, redirectUrl });

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

    // Set selectedLocation cookie if not already set (preserve guest browsing preference)
    const existingLocation = req.cookies.selectedLocation;
    if (!existingLocation && location) {
      res.cookie("selectedLocation", location, {
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        httpOnly: false // Accessible to JavaScript for frontend
      });
    }

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });
    // Not sending full user object - only essential fields
    const userResponse = { _id: newUser._id, name: newUser.name, email: newUser.email, role: newUser.role };
    return res.json({ success: true, token, role, user: userResponse, redirectUrl });

  } catch (err) {
    console.error("Signup error:", err);
    if (err.code === 11000) return res.status(400).json({ error: "Email, Phone, or Shop Name already exists." });
    res.status(500).json({ error: "Server error" });
  }
};

const logout = (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: 'strict'
  });
  res.json({ success: true, message: "Logged out successfully" });
};

const trackOrders = async (req, res) => {
  const now = new Date();
  const slotStartHours = { "10-12": 10, "12-2": 12, "2-4": 14, "4-6": 16 };
  let orders = await Order.find({ userId: req.user._id }).populate("productId").sort({ createdAt: -1 });
  let missedOrdersCount = 0;

  for (let order of orders) {
    //Only mark confirmed orders as missed, not already accepted/out-for-delivery orders
    if (order.status === "confirmed") {
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
      userId: req.user._id,
      status: { $in: ["confirmed", "missed"] },
    });
    if (!order) return res.status(400).json({ error: "Invalid or already processed order" });

    // Handle refund separately with error handling to prevent race condition
    let refundFailed = false;
    if (order.paid && order.razorpay_payment_id) {
      try {
        await razorpay.payments.refund(order.razorpay_payment_id, { amount: order.total * 100 });
      } catch (refundErr) {
        console.error("Refund failed:", refundErr);
        refundFailed = true;
        // Log for manual review - don't proceed if refund fails for paid orders
        return res.status(500).json({ error: "Refund processing failed. Please contact support.", orderId });
      }
    }

    // Only proceed with inventory restoration and cancellation if refund succeeded (or wasn't needed)
    const updateResult = await Product.findByIdAndUpdate(order.productId, {
      $inc: { quantity: order.quantity, soldCount: -order.quantity },
    });
    
    if (!updateResult) {
      return res.status(500).json({ error: "Product update failed. Contact support for refund status." });
    }

    order.status = "cancelled";
    await order.save();
    res.json({ success: true, message: "Order cancelled successfully" });
  } catch (err) {
    console.error("Cancel failed:", err);
    res.status(500).json({ error: "Error cancelling order. Please contact support." });
  }
};

const trackSingleOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId)
      .populate("riderId")
      .populate("userId")
      .populate("productId");

    if (!order || !order.userId) {
      return res.status(404).json({ error: "Order or user info not found" });
    }

    let riderCoords = null;
    if (order.riderId) {
      const redisKey = `rider:location:${order.riderId._id}`;
      const cachedCoords = await getCache(redisKey);
      riderCoords = cachedCoords
        ? { lat: cachedCoords.latitude, lng: cachedCoords.longitude }
        : { lat: order.riderId.latitude, lng: order.riderId.longitude };
    }

    res.json({
      success: true,
      user: req.user,
      order,
      rider: order.riderId || null,
      product: order.productId,
      userCoords: { lat: order.userId.latitude, lng: order.userId.longitude },
      riderCoords,
    });
  } catch (err) {
    console.error("Tracking error:", err);
    res.status(500).json({ error: "Error loading order tracking" });
  }
};

const getRiderLocationForOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId)
      .populate("riderId", "name phone vehicle_type latitude longitude updatedAt");

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Verify user owns this order
    if (order.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    if (!order.riderId) {
      return res.json({
        success: true,
        hasRider: false,
        message: "No rider assigned yet"
      });
    }

    // Try Redis first (fresh), fallback to DB (stale)
    const redisKey = `rider:location:${order.riderId._id}`;
    const cachedCoords = await getCache(redisKey);

    let location, lastUpdated, isLive;
    if (cachedCoords?.latitude && cachedCoords?.longitude) {
      location = { lat: cachedCoords.latitude, lng: cachedCoords.longitude };
      lastUpdated = new Date();
      isLive = true;
    } else {
      location = { lat: order.riderId.latitude, lng: order.riderId.longitude };
      lastUpdated = order.riderId.updatedAt;
      isLive = false;
    }

    res.json({
      success: true,
      hasRider: true,
      location,
      lastUpdated,
      isLive, // true if from Redis (within last 3 mins)
      rider: {
        name: order.riderId.name,
        phone: order.riderId.phone,
        vehicle: order.riderId.vehicle_type
      }
    });
  } catch (err) {
    console.error("Rider location fetch error:", err);
    res.status(500).json({ error: "Error fetching rider location" });
  }
};

function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

const searchSuggestions = async (req, res) => {
  try {
    const q = (req.query.q || "").trim();
    const selectedLocation = req.query.location || req.cookies.selectedLocation || req.user?.location || "hyderabad";
    if (!q) return res.json([]);
    // Filter by location to show relevant products
    const docs = await Product.find({ 
      name: new RegExp("^" + escapeRegex(q), "i"),
      location: selectedLocation,
      status: { $ne: "stopped" }
    }).limit(5).select("name -_id");
    res.json(docs.map(d => d.name));
  } catch (err) {
    res.status(500).json({ error: "Failed" });
  }
};

const handleSearchPost = async (req, res) => {
  const { searchQuery } = req.body;
  const selectedLocation = req.cookies.selectedLocation || req.user?.location || "hyderabad";
  if (!searchQuery?.trim()) return res.json({ success: false, error: "Empty query" });
  try {
    //  Filter by location
    const results = await Product.find({ 
      name: new RegExp(escapeRegex(searchQuery.trim()), "i"),
      location: selectedLocation,
      status: { $ne: "stopped" }
    });
    return res.json({ success: true, query: searchQuery, products: results, selectedCategory: "", selectedSort: "" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

const handleSearchGet = async (req, res) => {
  const { searchQuery = "", category, sort, page = 1, limit = 20 } = req.query;
  const selectedLocation = req.query.location || req.cookies.selectedLocation || req.user?.location || "hyderabad";
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  // Include location and status filters + page-wise caching strategy
  // Cache first 5 pages of search results (most-used pages)
  // Direct DB for pages > 5 (less common, save memory)
  
  // Build normalized cache key
  const normalizedQuery = searchQuery.trim().toLowerCase().replace(/\s+/g, "-");
  const normalizedSort = sort || "default";
  const cacheKey = `search:${selectedLocation}:${normalizedQuery}:${category || "all"}:${normalizedSort}:page:${pageNum}:${limitNum}`;
  
  // Check cache for pages 1-5
  const shouldCache = pageNum <= 5;
  if (shouldCache) {
    const cached = await getCache(cacheKey);
    if (cached) {
      console.log(`✅ Cache HIT: ${cacheKey}`);
      return res.json(cached);
    }
  }

  let query = { 
    name: new RegExp("^" + escapeRegex(searchQuery.trim()), "i"),
    location: selectedLocation,
    status: { $ne: "stopped" }
  };
  if (category && category !== "All Products") query.category = category;

  let sortOption = {};
  if (normalizedSort === "low-high") sortOption.price = 1;
  else if (normalizedSort === "high-low") sortOption.price = -1;
  else if (normalizedSort === "newest") sortOption.createdAt = -1;

  try {
    // Get one extra to determine hasNextPage
    const products = await Product.find(query).sort(sortOption).skip(skip).limit(limitNum + 1);
    const hasNextPage = products.length > limitNum;
    const paginatedProducts = hasNextPage ? products.slice(0, limitNum) : products;

    const response = {
      success: true,
      query: searchQuery,
      products: paginatedProducts,
      selectedCategory: category || "",
      selectedSort: sort || "",
      pagination: { currentPage: pageNum, limit: limitNum, hasNextPage }
    };

    // Cache pages 1-5 for 3 minutes (180 seconds)
    if (shouldCache) {
      await setCache(cacheKey, response, 180);
      console.log(`💾 Cached: ${cacheKey} (3 min TTL)`);
    }

    res.json(response);
  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = {
  setLocation, renderHome, login, signup, logout, trackOrders, cancelOrder,
  trackSingleOrder, getRiderLocationForOrder, searchSuggestions, handleSearchPost, handleSearchGet
};