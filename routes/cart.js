const { Router } = require("express");
const router = Router();
const { requireAuth } = require("../middleware/auth");
const {
  getCart,
  removeFromCart,
  addToCart,
  increaseQuantity,
  decreaseQuantity
} = require("../controllers/cartController");

// All cart routes require authentication
router.use(requireAuth);

router.get("/", getCart);
router.post("/remove", removeFromCart);
router.post("/add", addToCart);
router.post("/increase", increaseQuantity);
router.post("/decrease", decreaseQuantity);

module.exports = router;
