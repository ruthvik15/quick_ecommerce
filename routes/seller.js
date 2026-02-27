const express = require('express');
const router = express.Router();
const { requireAuth } = require("../middleware/auth");
const upload = require("../utils/fileUploader");

const {
  getDashboard,
  stopProduct,
  updatePrice,
  updateQuantity,
  renderAddPage,
  uploadProduct,
  getProductHeatmap,
  getDashboardTrackSection
} = require('../controllers/sellerController');

// All seller routes require authentication
router.use(requireAuth);

router.get('/dashboard', getDashboard);
router.post('/product/stop/:id', stopProduct);
router.post('/product/update-price/:id', updatePrice);
router.post('/product/update-quantity/:id', updateQuantity);
router.get('/add-product', renderAddPage);
router.post('/product/add', upload.single("image"), uploadProduct);
router.get('/:sellerId/product/:productId/heatmap', getProductHeatmap);
router.get('/dashboard-track-section', getDashboardTrackSection);
module.exports = router;
