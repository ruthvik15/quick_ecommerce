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
  handleSearchPost,

  handleSearchGet,getLogin,
  getSignup,
  
  searchSuggestions,}=require("../controllers/mainController");
router.get("/set-location", setLocation);
router.get("/", renderHome);
router.get("/login", getLogin);      
router.get("/signup", getSignup);  
router.post("/login", login);
router.post("/signup", signup);
router.get("/logout", logout);
router.get("/trackorders", trackOrders);
router.post("/orders/cancel/:id", cancelOrder);
router.get("/trackorders/:orderId", trackSingleOrder);
router.get("/search",handleSearchGet );
router.post("/search", handleSearchPost);
router.get("/search-suggestions",  searchSuggestions,
  );

module.exports = router;
