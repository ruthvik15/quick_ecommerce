const{Router}=require("express")
const router=Router();
const path = require("path");
const multer = require("multer");
const User =require("../models/user")
const Product = require("../models/product");
const Rider=require("../models/rider")
const Cart =require("../models/cart");
const cityCoords = require("../utils/cityCoordinates");
const getDistanceKm = require("../utils/distance");
const Review = require('../models/review');
const Order = require("../models/order");

// GET product details page
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('seller');
    if (!product) return res.status(404).send('Product not found');
    console.log("product",product);
    // Fetch all reviews for this product
    const reviews = await Review.find({ product_id: product._id })
      .populate('user_id')
      .sort({ createdAt: -1 });

    res.render('product-detail', {
      user: req.user,
      product,
      reviews
    });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).send('Server error');
  }
});

// POST add review
router.post('/:id/review', async (req, res) => {
  if (!req.user) return res.status(401).send('You must be logged in to review');

  const { comment, rating } = req.body;
  const productId = req.params.id;

  try {
    // Save review
    await Review.create({
      product_id: productId,
      user_id: req.user._id,
      comment,
      rating
    });

    // Recalculate averageRating
    const reviews = await Review.find({ product_id: productId });
    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

    await Product.findByIdAndUpdate(productId, { averageRating: avgRating });

    res.redirect(`/product/${productId}`);
  } catch (err) {
    console.error('Error saving review:', err);
    res.status(500).send('Error posting review');
  }
});
module.exports=router;