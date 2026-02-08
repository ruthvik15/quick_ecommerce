const { Router } = require("express");
const router = Router();
const { requireAuth } = require("../middleware/auth");
const productController = require("../controllers/productController");

// Public route - anyone can view product details
router.get('/:id', productController.getProductDetail);

// Protected route - only logged-in users can review
router.post('/:id/review', requireAuth, productController.postReview);

module.exports = router;
