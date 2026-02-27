// routes/riderRoutes.js
const express = require("express");
const router = express.Router();
const { requireRole } = require("../middleware/auth");

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
  updateOrderSlot,
  getOrderDetails } = require("../controllers/riderController");


// All rider routes require authentication and rider role
router.use(requireRole('rider'));

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
router.get("/orders/details/:id", getOrderDetails);

module.exports = router;