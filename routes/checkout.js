const { Router } = require("express");
const router = Router();
const {
  showCheckoutPage,
  processCheckout,
  verifyPayment,
  showSuccessPage
} = require("../controllers/checkoutController");

router.get("/", showCheckoutPage);
router.post("/process", processCheckout);
router.post("/verify-payment", verifyPayment);
router.get("/orders/success", showSuccessPage);

module.exports = router;
