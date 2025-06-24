const { Router } = require("express");
const router = Router();
const productController = require("../controllers/productController");


router.get('/:id', productController.getProductDetail);
router.post('/:id/review', productController.postReview);

module.exports = router;
