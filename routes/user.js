const express = require("express");
const router = express.Router();
const { setLocation,
  renderHome,
  login,
  signup,
  logout,
  trackOrders,
  cancelOrder,
  trackSingleOrder,
  searchProducts,
  searchSuggestions,}=require("../controllers/mainController");
router.get("/set-location", setLocation);
router.get("/", renderHome);
router.post("/login", login);
router.post("/signup", signup);
router.get("/logout", logout);
router.get("/trackorders", trackOrders);
router.post("/orders/cancel/:id", cancelOrder);
router.get("/trackorders/:orderId", trackSingleOrder);
router.get("/search", searchProducts);
router.post("/search", searchProducts);
router.get("/search-suggestions", searchSuggestions);

module.exports = router;
