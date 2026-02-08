const Product = require("../models/product");
const Review = require("../models/review");


const getProductDetail = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('seller');
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const reviews = await Review.find({ product_id: product._id })
      .populate('user_id')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      product,
      reviews,
      user: req.user
    });
  } catch (err) {
    console.error('Error fetching product:', err);
    res.status(500).json({ error: 'Server error' });
  }
};


const postReview = async (req, res) => {
  const { comment, rating } = req.body;
  const productId = req.params.id;

  try {
    await Review.create({
      product_id: productId,
      user_id: req.user._id,
      comment,
      rating
    });


    const reviews = await Review.find({ product_id: productId });
    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

    await Product.findByIdAndUpdate(productId, { averageRating: avgRating });

    res.json({ success: true, message: "Review posted successfully" });
  } catch (err) {
    console.error('Error saving review:', err);
    res.status(500).json({ error: 'Error posting review' });
  }
};

module.exports = {
  getProductDetail,
  postReview,
};
