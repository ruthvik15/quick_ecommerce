const express = require('express');
const router = express.Router();
const { requireRole } = require("../middleware/auth");
const { validateProductInput } = require("../middleware/validators");
const upload = require("../utils/fileUploader");

const {
  getDashboard,
  stopProduct,
  resumeProduct,
  updatePrice,
  updateQuantity,
  renderAddPage,
  uploadProduct,
  deleteProduct,
  getProductHeatmap,
  getDashboardTrackSection
} = require('../controllers/sellerController');

// All seller routes require authentication and seller role
router.use(requireRole('seller'));

router.get('/dashboard', getDashboard);
router.get('/dashboard-track-section', getDashboardTrackSection);
router.post('/product/stop/:id', stopProduct);
router.post('/product/resume/:id', resumeProduct);
router.post('/product/update-price/:id', validateProductInput, updatePrice);
router.post('/product/update-quantity/:id', validateProductInput, updateQuantity);
router.get('/add-product', renderAddPage);
router.post('/product/add', upload.single("image"), validateProductInput, uploadProduct);
router.delete('/product/delete/:id', deleteProduct);
router.get('/:sellerId/product/:productId/heatmap', getProductHeatmap);
module.exports = router;
