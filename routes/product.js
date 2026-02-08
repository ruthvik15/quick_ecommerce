const { Router } = require("express");
const router = Router();
const { requireAuth } = require("../middleware/auth");
const productController = require("../controllers/productController");


router.get('/:id', productController.getProductDetail);

// Protected route - only logged-in users can review
router.post('/:id/review', requireAuth, productController.postReview);

module.exports = router;
