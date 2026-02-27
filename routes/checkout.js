const { Router } = require("express");
const router = Router();
const { requireAuth } = require("../middleware/auth");
const { validateCheckoutInput } = require("../middleware/validators");
const {
  showCheckoutPage,
  processCheckout,
  verifyPayment,
  showSuccessPage
} = require("../controllers/checkoutController");

// authentication is mandatory for the checkout routes
router.use(requireAuth);

router.get("/", showCheckoutPage);
router.post("/process", validateCheckoutInput, processCheckout);
router.post("/verify-payment", verifyPayment);
router.get("/orders/success", showSuccessPage);

module.exports = router;
