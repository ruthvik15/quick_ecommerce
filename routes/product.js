const { Router } = require("express");
const router = Router();
const { requireAuth } = require("../middleware/auth");
const { validateReviewInput } = require("../middleware/validators");
const productController = require("../controllers/productController");


router.get('/:id', productController.getProductDetail);

// Protected route - only logged-in users can review
router.post('/:id/review', requireAuth, validateReviewInput, productController.postReview);

module.exports = router;
