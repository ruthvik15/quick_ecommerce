const mainRepository = require("../repositories/mainRepository");
const { getCache, setCache } = require("../utils/cache");
const { createtoken } = require("../utils/auth");
const { signupByRole } = require("../services/signup");
const { loginByRole } = require("../services/login");

const setLocation = (req, res) => {
  const loc = req.query.loc?.toLowerCase();
  const validLocations = ["hyderabad", "bengaluru", "mumbai", "delhi"];
  if (!validLocations.includes(loc)) return res.redirect("/");
  res.cookie("selectedLocation", loc, {
    maxAge: 30 * 24 * 60 * 60 * 1000,
    secure: true,
    sameSite: "none",
  });
  res.redirect("/");
};

const renderHome = async (req, res) => {
  const selectedLocation =
    req.query.location ||
    req.cookies.selectedLocation ||
    req.user?.location ||
    "hyderabad";
  const { category, sort, page = 1, limit = 20 } = req.query;

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const offset = (pageNum - 1) * limitNum;

  let cartLocationMismatch = false;
  if (req.user) {
    cartLocationMismatch = await mainRepository.checkCartLocationMismatch(req.user.id, selectedLocation);
  }

  const params = [selectedLocation];
  let whereClause = "WHERE location = $1 AND status != 'stopped'";
  let paramIndex = 2;

  if (category && category !== "All Products") {
    whereClause += ` AND category = $${paramIndex++}`;
    params.push(category.toLowerCase());
  }

  let orderBy = "";
  if (sort === "low-high") orderBy = "ORDER BY price ASC";
  else if (sort === "high-low") orderBy = "ORDER BY price DESC";
  else if (sort === "newest") orderBy = "ORDER BY created_at DESC";

  const categories = [
    "All Products",
    "groceries",
    "electronics",
    "clothing",
    "food",
  ];

  const isAllCategory = !category || category === "All Products";
  const shouldCache = isAllCategory && pageNum <= 5;

  // Cache-busting bucket: round current time to the nearest 3-minute window
  const bucketMs = 3 * 60 * 1000;
  const timeBucket = Math.floor(Date.now() / bucketMs);

  const cacheKey = shouldCache
    ? `products:${selectedLocation}:all:${sort || "default"}:page:${pageNum}:${limitNum}:b${timeBucket}`
    : null;

  if (cacheKey) {
    const cached = await getCache(cacheKey);
    if (cached) {
      return res.json({ success: true, ...cached, cartLocationMismatch, user: req.user });
    }
  }

  const dataParams = [...params, limitNum, offset];
  const products = await mainRepository.fetchProducts(whereClause, orderBy, dataParams, paramIndex);
  const totalItems = await mainRepository.countProducts(whereClause, params);
  
  const hasNextPage = offset + limitNum < totalItems;

  const globalData = {
    products,
    categories,
    selectedLocation,
    selectedCategory: category || "",
    selectedSort: sort || "",
    pagination: { currentPage: pageNum, limit: limitNum, hasNextPage, totalItems },
  };

  if (cacheKey) {
    await setCache(cacheKey, globalData, 180);
  }

  return res.json({ success: true, ...globalData, cartLocationMismatch, user: req.user });
};

const login = async (req, res) => {
  const { email, password, role } = req.body;

  try {
    const { token, user, redirectUrl } = await loginByRole(req.body);

    if (!req.cookies.selectedLocation && user.location) {
      res.cookie("selectedLocation", user.location, {
        maxAge: 30 * 24 * 60 * 60 * 1000,
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      });
    }

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 24 * 60 * 60 * 1000,
    });

    return res.json({ success: true, token, role, user, redirectUrl });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(400).json({ error: "Email or password incorrect" });
  }
};

const signup = async (req, res) => {
  const { name, email, password, phone, location, role } = req.body;

  try {
    const { user, redirectUrl } = await signupByRole(req.body);
    const token = createtoken(user);

    if (!req.cookies.selectedLocation && location) {
      res.cookie("selectedLocation", location, {
        maxAge: 30 * 24 * 60 * 60 * 1000,
        httpOnly: false,
        secure: true,
        sameSite: "none",
      });
    }

    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({ success: true, token, role, user, redirectUrl });
  } catch (err) {
    console.error("Signup error:", err);
    if (err.code === "23505") {
      return res
        .status(400)
        .json({ error: "Email, phone, or shop name already exists" });
    }
    if (err.message?.includes("required")) {
      return res.status(400).json({ error: err.message });
    }
    return res.status(500).json({ error: "Server error" });
  }
};

const logout = (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });
  res.json({ success: true, message: "Logged out successfully" });
};

const trackOrders = async (req, res) => {
  const now = new Date();
  const slotStartHours = { "10-12": 10, "12-2": 12, "2-4": 14, "4-6": 16 };
  
  const orders = await mainRepository.getUserOrders(req.user.id);

  let missedOrdersCount = 0;

  for (const order of orders) {
    if (order.status === "confirmed") {
      const slotHour = slotStartHours[order.delivery_slot];
      if (slotHour !== undefined) {
        const slotStart = new Date(order.delivery_date);
        slotStart.setHours(slotHour, 0, 0, 0);
        if (now >= slotStart) {
          missedOrdersCount++;
          await mainRepository.markOrderMissed(order.id);
          order.status = "missed";
        }
      }
    }
  }

  res.json({ success: true, user: req.user, orders, missedOrdersCount });
};

const cancelOrder = async (req, res) => {
  const { orderId } = req.body;
  
  try {
    const result = await mainRepository.cancelOrderTransaction(orderId, req.user.id);
    
    if (result.error) {
      return res.status(result.status || 500).json({ error: result.error });
    }
    
    res.json({ success: true, message: result.message });
  } catch (err) {
    res.status(500).json({ error: "Error cancelling order. Please contact support." });
  }
};

const trackSingleOrder = async (req, res) => {
  try {
    const row = await mainRepository.getOrderTrackingDetails(req.params.orderId);

    if (!row) {
      return res.status(404).json({ error: "Order or user info not found" });
    }

    const items = await mainRepository.getOrderItemsWithProductDetails(row.id);

    const order = {
      id: row.id,
      user_id: row.user_id,
      rider_id: row.rider_id,
      phone: row.phone,
      address: row.address,
      location: row.location,
      total: row.total,
      paid: row.paid,
      status: row.status,
      delivery_date: row.delivery_date,
      delivery_slot: row.delivery_slot,
      latitude: row.latitude,
      longitude: row.longitude,
      razorpay_payment_id: row.razorpay_payment_id,
      created_at: row.created_at,
      updated_at: row.updated_at,
      items: items,
    };

    const rider = row.rider_id
      ? {
        id: row.rider_id_val,
        name: row.rider_name,
        phone: row.rider_phone,
        vehicle_type: row.rider_vehicle_type,
        latitude: row.rider_latitude,
        longitude: row.rider_longitude,
        updated_at: row.rider_updated_at,
      }
      : null;

    let riderCoords = null;
    if (rider) {
      const redisKey = `rider:location:${rider.id}`;
      const cachedCoords = await getCache(redisKey);
      riderCoords = cachedCoords
        ? { lat: cachedCoords.latitude, lng: cachedCoords.longitude }
        : { lat: rider.latitude, lng: rider.longitude };
    }

    res.json({
      success: true,
      user: req.user,
      order,
      rider,
      product: items[0] || null,
      userCoords: { lat: row.user_latitude, lng: row.user_longitude },
      riderCoords,
    });
  } catch (err) {
    console.error("Tracking error:", err);
    res.status(500).json({ error: "Error loading order tracking" });
  }
};

const getRiderLocationForOrder = async (req, res) => {
  try {
    const row = await mainRepository.getOrderAndRiderLocation(req.params.orderId);

    if (!row) {
      return res.status(404).json({ error: "Order not found" });
    }

    if (row.user_id !== req.user.id) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    if (!row.rider_id) {
      return res.json({
        success: true,
        hasRider: false,
        message: "No rider assigned yet",
      });
    }

    const redisKey = `rider:location:${row.rider_id}`;
    const cachedCoords = await getCache(redisKey);

    let location, lastUpdated, isLive;
    if (cachedCoords?.latitude && cachedCoords?.longitude) {
      location = { lat: cachedCoords.latitude, lng: cachedCoords.longitude };
      lastUpdated = new Date();
      isLive = true;
    } else {
      location = { lat: row.rider_latitude, lng: row.rider_longitude };
      lastUpdated = row.rider_updated_at;
      isLive = false;
    }

    res.json({
      success: true,
      hasRider: true,
      location,
      lastUpdated,
      isLive,
      rider: {
        name: row.rider_name,
        phone: row.rider_phone,
        vehicle: row.rider_vehicle_type,
      },
    });
  } catch (err) {
    console.error("Rider location fetch error:", err);
    res.status(500).json({ error: "Error fetching rider location" });
  }
};

function escapeLike(text) {
  return text.replace(/[%_\\]/g, "\\$&");
}

const searchSuggestions = async (req, res) => {
  try {
    const q = (req.query.q || "").trim();
    const selectedLocation =
      req.query.location ||
      req.cookies.selectedLocation ||
      req.user?.location ||
      "hyderabad";

    if (!q) return res.json([]);

    const suggestions = await mainRepository.getSearchSuggestions(`${escapeLike(q)}%`, selectedLocation);
    res.json(suggestions);
  } catch (err) {
    res.status(500).json({ error: "Failed" });
  }
};

const handleSearchPost = async (req, res) => {
  const { searchQuery } = req.body;
  const selectedLocation =
    req.cookies.selectedLocation || req.user?.location || "hyderabad";

  if (!searchQuery?.trim()) {
    return res.json({ success: false, error: "Empty query" });
  }

  try {
    const products = await mainRepository.searchProductsExact(`%${escapeLike(searchQuery.trim())}%`, selectedLocation);

    return res.json({
      success: true,
      query: searchQuery,
      products: products,
      selectedCategory: "",
      selectedSort: "",
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

const handleSearchGet = async (req, res) => {
  const { searchQuery = "", category, sort, page = 1, limit = 20 } = req.query;
  const selectedLocation =
    req.query.location ||
    req.cookies.selectedLocation ||
    req.user?.location ||
    "hyderabad";

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const offset = (pageNum - 1) * limitNum;
  const normalizedSort = sort || "default";

  const normalizedQuery = searchQuery.trim().toLowerCase().replace(/\s+/g, "-");
  const cacheKey = `search:${selectedLocation}:${normalizedQuery}:${category || "all"}:${normalizedSort}:page:${pageNum}:${limitNum}`;

  const shouldCache = pageNum <= 5;
  if (shouldCache) {
    const cached = await getCache(cacheKey);
    if (cached) {
      console.log(`✅ Cache HIT: ${cacheKey}`);
      return res.json(cached);
    }
  }

  const params = [`%${escapeLike(searchQuery.trim())}%`, selectedLocation];
  let whereClause = "WHERE name ILIKE $1 AND location = $2 AND status != 'stopped'";
  let paramIndex = 3;

  if (category && category !== "All Products") {
    whereClause += ` AND category = $${paramIndex++}`;
    params.push(category);
  }

  let orderBy = "";
  if (normalizedSort === "low-high") orderBy = "ORDER BY price ASC";
  else if (normalizedSort === "high-low") orderBy = "ORDER BY price DESC";
  else if (normalizedSort === "newest") orderBy = "ORDER BY created_at DESC";

  try {
    const dataParams = [...params, limitNum + 1, offset];
    const rawProducts = await mainRepository.fetchProducts(whereClause, orderBy, dataParams, paramIndex);

    const hasNextPage = rawProducts.length > limitNum;
    const products = hasNextPage ? rawProducts.slice(0, limitNum) : rawProducts;

    const response = {
      success: true,
      query: searchQuery,
      products,
      selectedCategory: category || "",
      selectedSort: sort || "",
      pagination: { currentPage: pageNum, limit: limitNum, hasNextPage },
    };

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
  setLocation,
  renderHome,
  login,
  signup,
  logout,
  trackOrders,
  cancelOrder,
  trackSingleOrder,
  getRiderLocationForOrder,
  searchSuggestions,
  handleSearchPost,
  handleSearchGet,
};