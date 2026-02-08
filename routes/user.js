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
  getLogin,
  getSignup,
  searchSuggestions, } = require("../controllers/mainController");

// Public routes - no auth required
router.route("/login")
    .get(getLogin)
    .post(login);
router.route("/signup")
    .get(getSignup)
    .post(signup);
router.route("/search")
    .get(handleSearchGet)
    .post(handleSearchPost);
router.get("/set-location", setLocation);
router.get("/", renderHome);
router.get("/logout", requireAuth, logout);
router.get("/search-suggestions", searchSuggestions);

// Protected routes - require authentication
router.get("/profile", requireAuth, (req, res) => {
  res.json({ success: true, user: req.user });
});
router.get("/trackorders", requireAuth, trackOrders);
router.post("/cancel-order", requireAuth, cancelOrder);
router.get("/trackorders/:orderId", requireAuth, trackSingleOrder);

module.exports = router;
