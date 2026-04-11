const riderRepository = require("../repositories/riderRepository");
const { setCache, getCache } = require("../utils/cache");

// Slot display order (used for sorting)
const slotOrder = { "10-12": 1, "12-2": 2, "2-4": 3, "4-6": 4 };

const acceptOrder = async (req, res) => {
  try {
    const { orderId } = req.body;

    const updatedOrder = await riderRepository.acceptOrderDb(req.user.id, orderId);

    if (!updatedOrder) {
      return res.status(400).json({ error: "Order not available" });
    }

    res.json({ success: true, message: "Order accepted", order: updatedOrder });
  } catch (err) {
    console.error("Error accepting order:", err);
    res.status(500).json({ error: "Server error" });
  }
};

const rejectOrder = async (req, res) => {
  try {
    const { orderId } = req.body;

    // Verify order exists and is still in confirmed state
    const orderData = await riderRepository.getOrderStatus(orderId);

    if (!orderData || orderData.status !== "confirmed") {
      return res.status(400).json({ error: "Order not found or already processed." });
    }

    // Prevent duplicate rejections — INSERT IGNORE pattern
    await riderRepository.insertOrderRejection(orderId, req.user.id);

    res.json({ success: true, message: "Order rejected" });
  } catch (err) {
    console.error("Error rejecting order:", err);
    res.status(500).json({ error: "Server error" });
  }
};

const getDashboard = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });

    const riderId = req.user.id;

    // Compute completed order count as a live derived value.
    const completedCount = await riderRepository.countDeliveredOrders(riderId);
    const rider = await riderRepository.getRiderById(riderId);

    const todayStr = new Date().toISOString().split("T")[0];

    const todaysOrderCount = await riderRepository.countTodaysOrders(riderId, todayStr);
    const orderRequestCount = await riderRepository.countOrderRequests(riderId, req.user.location);

    res.json({
      success: true,
      rider: { ...rider, no_of_orders: completedCount },
      todaysOrderCount,
      orderRequestCount,
      user: req.user,
    });
  } catch (err) {
    console.error("Error fetching dashboard:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// ── signupRider — delegated to services (kept for backward compat) ─────────────

const signupRider = async (req, res) => {
  res.status(501).json({ error: "Use /signup with role=rider" });
};

// ── updateLocationById ────────────────────────────────────────────────────────

const updateLocationById = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    const riderId = req.params.id;

    if (!latitude || !longitude) {
      return res.status(400).json({ error: "Latitude and longitude required" });
    }

    const updatedRider = await riderRepository.updateRiderLocationDb(riderId, latitude, longitude);

    if (!updatedRider) {
      return res.status(404).json({ error: "Rider not found" });
    }

    res.json({ message: "Location updated", rider: updatedRider });
  } catch (err) {
    console.error("Location update failed:", err);
    res.status(500).json({ error: "Failed to update location" });
  }
};

const updateLocation = async (req, res) => {
  try {
    const riderId = req.user.id;
    const { latitude, longitude } = req.body;

    const redisKey = `rider:location:${riderId}`;
    await setCache(redisKey, { latitude, longitude }, 600); // 10 mins

    res.status(200).json({ message: "Location updated" });
  } catch (err) {
    console.error("Failed to update rider location:", err);
    res.status(500).json({ error: "Failed to update location" });
  }
};

const getPendingOrders = async (req, res) => {
  try {
    const orders = await riderRepository.getConfirmedOrdersForLocation(req.user.id, req.user.location);

    const groupedOrders = {};
    orders.forEach((order) => {
      const dateKey = new Date(order.delivery_date).toDateString();
      if (!groupedOrders[dateKey]) groupedOrders[dateKey] = [];
      groupedOrders[dateKey].push(order);
    });

    Object.keys(groupedOrders).forEach((date) => {
      groupedOrders[date].sort(
        (a, b) => (slotOrder[a.delivery_slot] || 99) - (slotOrder[b.delivery_slot] || 99)
      );
    });

    res.json({ success: true, user: req.user, groupedOrders, status: "confirmed" });
  } catch (err) {
    console.error("Error fetching confirmed orders:", err);
    res.status(500).json({ error: "Server Error" });
  }
};

const getTodayOrders = async (req, res) => {
  try {
    const todayStr = new Date().toISOString().split("T")[0];
    const orders = await riderRepository.getTodaysAcceptedOrders(req.user.id, todayStr);

    // Group by delivery slot
    const groupedSlots = {};
    orders.forEach((order) => {
      const slot = order.delivery_slot;
      if (!groupedSlots[slot]) groupedSlots[slot] = [];
      groupedSlots[slot].push({
        id: order.id,
        delivery_date: order.delivery_date,
        delivery_slot: slot,
        address: order.address,
        user_name: order.user_name,
        user_location: order.user_location,
        items: order.items,
        status: order.status,
        payment: order.paid ? "prepaid" : "cod",
      });
    });

    // Sort slots in correct order, sort within slots by user name
    const sortedGroupedSlots = Object.keys(slotOrder)
      .filter((slot) => groupedSlots[slot])
      .reduce((acc, slot) => {
        groupedSlots[slot].sort((a, b) =>
          (a.user_name || "").localeCompare(b.user_name || "")
        );
        acc[slot] = groupedSlots[slot];
        return acc;
      }, {});

    res.json({ success: true, user: req.user, groupedSlots: sortedGroupedSlots });
  } catch (err) {
    console.error("Error fetching today's orders:", err);
    res.status(500).json({ error: "Server error" });
  }
};

const markOrderOutForDelivery = async (req, res) => {
  try {
    const { orderId } = req.body;

    const updated = await riderRepository.markOrderOutForDeliveryDb(orderId, req.user.id);

    if (!updated) {
      return res.status(403).json({
        error: "Unauthorized or invalid status transition",
      });
    }

    res.json({ success: true, message: "Order Out for Delivery" });
  } catch (err) {
    console.error("Error marking order out for delivery:", err);
    res.status(500).json({ error: "Failed to update order status" });
  }
};

const markOrderComplete = async (req, res) => {
  try {
    const { orderId } = req.body;

    const updated = await riderRepository.markOrderCompleteDb(orderId, req.user.id);

    if (!updated) {
      return res.status(403).json({
        error: "Unauthorized or invalid status transition",
      });
    }

    // Increment the rider's lifetime completed order tally
    await riderRepository.incrementRiderOrderCount(req.user.id);

    res.json({ success: true, message: "Order Delivered" });
  } catch (err) {
    console.error("Error completing order:", err);
    res.status(500).json({ error: "Failed to mark order delivered" });
  }
};

const getAcceptedOrders = async (req, res) => {
  try {
    const riderId = req.user.id;
    const orders = await riderRepository.getActiveOrders(riderId);

    const grouped = {};
    orders.forEach((order) => {
      const dateKey = new Date(order.delivery_date).toDateString();
      if (!grouped[dateKey]) grouped[dateKey] = [];
      grouped[dateKey].push({
        id: order.id,
        items: order.items,
        user_name: order.user_name,
        phone: order.phone || order.user_phone,
        address: order.address,
        user_location: order.user_location,
        delivery_slot: order.delivery_slot,
        status: order.status,
        payment: order.paid ? "Prepaid" : "COD",
        amount: order.total,
      });
    });

    res.json({ success: true, user: req.user, groupedOrders: grouped });
  } catch (err) {
    console.error("Error fetching active rider orders:", err);
    res.status(500).json({ error: "Server error" });
  }
};

const getCompletedOrders = async (req, res) => {
  try {
    const riderId = req.user.id;
    const orders = await riderRepository.getDeliveredOrders(riderId);

    const grouped = {};
    orders.forEach((order) => {
      const dateKey = new Date(order.delivery_date).toDateString();
      if (!grouped[dateKey]) grouped[dateKey] = [];
      grouped[dateKey].push({
        id: order.id,
        items: order.items,
        user_name: order.user_name,
        phone: order.phone || order.user_phone,
        address: order.address,
        user_location: order.user_location,
        delivery_slot: order.delivery_slot,
        status: order.status,
        payment: order.paid ? "Prepaid" : "COD",
        amount: order.total,
      });
    });

    res.json({ success: true, user: req.user, groupedOrders: grouped });
  } catch (err) {
    console.error("Error fetching completed orders:", err);
    res.status(500).json({ error: "Server error" });
  }
};

const getUnacceptedOrders = async (req, res) => {
  try {
    const missedOrders = await riderRepository.getMissedOrders();
    const slotStartHours = { "10-12": 10, "12-2": 12, "2-4": 14, "4-6": 16 };

    const unacceptedOrders = missedOrders.filter((order) => {
      const slotHour = slotStartHours[order.delivery_slot];
      if (!slotHour) return false;
      const slotStart = new Date(order.delivery_date);
      slotStart.setHours(slotHour, 0, 0, 0);
      return new Date() >= slotStart;
    });

    res.json({
      success: true,
      user: req.user,
      unacceptedOrders,
      count: unacceptedOrders.length,
    });
  } catch (err) {
    console.error("Error fetching unaccepted orders:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

const updateOrderSlot = async (req, res) => {
  try {
    const { orderId, newDate, newSlot } = req.body;

    const orderData = await riderRepository.getOrderOwnership(orderId);

    if (!orderData) {
      return res.status(404).json({ error: "Order not found" });
    }

    if (orderData.rider_id && orderData.rider_id !== req.user.id) {
      return res.status(403).json({
        error: "Unauthorized: You can only modify your own orders",
      });
    }

    await riderRepository.updateDeliverySlotDb(orderId, newDate, newSlot);

    res.json({ success: true, message: "Order slot updated" });
  } catch (err) {
    console.error("Failed to update delivery slot", err);
    res.status(500).json({ error: "Error updating slot" });
  }
};

const getOrderDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const row = await riderRepository.getOrderDetailsDb(id);

    if (!row) {
      return res.status(404).json({ success: false, error: "Order not found" });
    }

    // Auth: confirmed orders visible to any rider; accepted+ only to assigned rider
    if (row.status !== "confirmed" && row.rider_id && row.rider_id !== req.user.id) {
      return res.status(403).json({ success: false, error: "Unauthorized" });
    }

    res.json({
      success: true,
      order: {
        id: row.id,
        items: row.items,
        user: {
          name: row.user_name,
          email: row.user_email,
          phone: row.user_phone,
          address: row.user_address,
          location: row.user_location_field,
        },
        delivery_slot: row.delivery_slot,
        delivery_date: row.delivery_date,
        status: row.status,
        payment_mode: row.paid ? "Prepaid" : "COD",
        amount: row.total,
        phone: row.phone || row.user_phone,
        latitude: row.latitude || row.user_latitude,
        longitude: row.longitude || row.user_longitude,
        address: row.address || row.user_address,
      },
    });
  } catch (error) {
    console.error("Error fetching order details:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

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
  getOrderDetails,
};
