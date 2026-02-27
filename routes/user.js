const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth");
const { setLocation,
  renderHome,
  login,
  signup,
  logout,
  trackOrders,
  cancelOrder,
  trackSingleOrder,
  handleSearchPost,
  handleSearchGet,
  searchSuggestions, } = require("../controllers/mainController");

// Public routes no auth is required
router.post("/login", login);
router.post("/signup", signup);
router.get("/set-location", setLocation);
router.get("/", renderHome);
router.get("/search-suggestions", searchSuggestions);
router.route("/search")
  .get(handleSearchGet)
  .post(handleSearchPost);

// Protected routes - require authentication
router.post("/logout", requireAuth, logout);
router.get("/profile", requireAuth, (req, res) => {
  res.json({ success: true, user: req.user });
});
router.get("/trackorders", requireAuth, trackOrders);
router.post("/cancel-order", requireAuth, cancelOrder);
router.get("/trackorders/:orderId", requireAuth, trackSingleOrder);

module.exports = router;
