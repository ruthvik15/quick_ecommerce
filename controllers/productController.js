const productRepository = require("../repositories/productRepository");

const getProductDetail = async (req, res) => {
  try {
    const row = await productRepository.getProductByIdWithSeller(req.params.id);

    if (!row) {
      return res.status(404).json({ error: "Product not found" });
    }

    const product = {
      id: row.id,
      name: row.name,
      price: row.price,
      image: row.image,
      description: row.description,
      quantity: row.quantity,
      location: row.location,
      category: row.category,
      status: row.status,
      sold_count: row.sold_count,
      average_rating: row.average_rating,
      created_at: row.created_at,
      seller: row.seller_id
        ? {
            id: row.seller_id,
            name: row.seller_name,
            shop_name: row.seller_shop_name,
            location: row.seller_location,
          }
        : null,
    };

    const reviews = await productRepository.getProductReviews(product.id);

    res.json({
      success: true,
      product,
      reviews,
      user: req.user,
    });
  } catch (err) {
    console.error("Error fetching product:", err);
    res.status(500).json({ error: "Server error" });
  }
};

const postReview = async (req, res) => {
  const { comment, rating } = req.body;
  const productId = req.params.id;

  try {
    await productRepository.upsertProductReview(productId, req.user.id, comment, rating);
    await productRepository.updateProductAverageRating(productId);

    res.json({ success: true, message: "Review posted successfully" });
  } catch (err) {
    console.error("Error saving review:", err);
    res.status(500).json({ error: "Error posting review" });
  }
};

module.exports = {
  getProductDetail,
  postReview,
};
