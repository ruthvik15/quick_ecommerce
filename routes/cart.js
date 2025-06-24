const { Router } = require("express");
const router = Router();
const {
  getCart,
  removeFromCart,
  addToCart,
  increaseQuantity,
  decreaseQuantity
} = require("../controllers/cartController");

router.get("/", getCart);
router.post("/remove", removeFromCart);
router.post("/add", addToCart);
router.post("/increase", increaseQuantity);
router.post("/decrease", decreaseQuantity);

module.exports = router;
