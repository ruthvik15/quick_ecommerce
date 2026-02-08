const { Router } = require("express");
const router = Router();
const { requireAuth } = require("../middleware/auth");
const {
  showCheckoutPage,
  processCheckout,
  verifyPayment,
  showSuccessPage
} = require("../controllers/checkoutController");

// All checkout routes require authentication
router.use(requireAuth);

router.get("/", showCheckoutPage);
router.post("/process", processCheckout);
router.post("/verify-payment", verifyPayment);
router.get("/orders/success", showSuccessPage);

module.exports = router;
