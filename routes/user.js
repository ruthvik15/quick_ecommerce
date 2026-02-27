const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth");
const { validateLoginInput, validateSignupInput } = require("../middleware/validators");
const { setLocation,
  renderHome,
  login,
  signup,
  logout,
  trackOrders,
  cancelOrder,
  trackSingleOrder,
  getRiderLocationForOrder,
  handleSearchPost,
  handleSearchGet,
  searchSuggestions, } = require("../controllers/mainController");

// Public routes no auth is required
router.post("/login", validateLoginInput, login);
router.post("/signup", validateSignupInput, signup);
router.get("/set-location", setLocation);
router.get("/", renderHome);
router.get("/search-suggestions", searchSuggestions);
router.route("/search")
  .get(handleSearchGet)
  .post(handleSearchPost);

// Protected routes - require authentication
router.get("/me", requireAuth, (req, res) => {
  res.json({ success: true, user: { _id: req.user._id, name: req.user.name, email: req.user.email, role: req.user.role } });
});
router.post("/logout", requireAuth, logout);
router.get("/trackorders", requireAuth, trackOrders);
router.post("/cancel-order", requireAuth, cancelOrder);
router.get("/trackorders/:orderId", requireAuth, trackSingleOrder);
router.get("/orders/:orderId/rider-location", requireAuth, getRiderLocationForOrder);

module.exports = router;
