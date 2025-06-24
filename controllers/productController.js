const Product = require("../models/product");
const Review = require("../models/review");


const getProductDetail = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('seller');
    if (!product) return res.status(404).send('Product not found');

    const reviews = await Review.find({ product_id: product._id })
      .populate('user_id')
      .sort({ createdAt: -1 });

    res.render('product-detail', {
      user: req.user,
      product,
      reviews
    });
  } catch (err) {
    console.error('Error fetching product:', err);
    res.status(500).send('Server error');
  }
};


const postReview = async (req, res) => {
  if (!req.user) return res.status(401).send('You must be logged in to review');

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

    res.redirect(`/product/${productId}`);
  } catch (err) {
    console.error('Error saving review:', err);
    res.status(500).send('Error posting review');
  }
};

module.exports = {
  getProductDetail,
  postReview,
};
