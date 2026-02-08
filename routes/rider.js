// routes/riderRoutes.js
const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth");

const { acceptOrder,
  rejectOrder,
  getDashboard,
  updateLocationById,
  updateLocation,
  getPendingOrders,
  getTodayOrders,
  markOrderOutForDelivery,
  markOrderComplete,
  getAcceptedOrders,
  getCompletedOrders,
  getUnacceptedOrders,
  updateOrderSlot } = require("../controllers/riderController");


// All rider routes require authentication
router.use(requireAuth);

router.post("/orders/accept", acceptOrder);
router.post("/orders/reject", rejectOrder);
router.get("/dashboard", getDashboard);
router.post("/:id/location", updateLocationById);
router.post("/update-location", updateLocation);
router.get("/orders/pending", getPendingOrders);
router.get("/orders/today", getTodayOrders);
router.post("/orders/out-for-delivery", markOrderOutForDelivery);
router.post("/orders/complete", markOrderComplete);
router.get("/orders/accepted", getAcceptedOrders);
router.get("/orders/completed", getCompletedOrders);
router.get("/orders/unaccepted", getUnacceptedOrders);
router.post("/orders/update-slot", updateOrderSlot);

module.exports = router;