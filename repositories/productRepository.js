const { pool } = require("../utils/dbConnection");

const getProductByIdWithSeller = async (productId) => {
  const result = await pool.query(
    `SELECT
       p.*,
       s.id        AS seller_id,
       s.name      AS seller_name,
       s.shop_name AS seller_shop_name,
       s.location  AS seller_location
     FROM products p
     LEFT JOIN sellers s ON s.id = p.seller_id
     WHERE p.id = $1`,
    [productId]
  );
  return result.rows[0];
};

const getProductReviews = async (productId) => {
  const result = await pool.query(
    `SELECT
       r.*,
       u.name AS reviewer_name
     FROM reviews r
     JOIN users u ON u.id = r.user_id
     WHERE r.product_id = $1
     ORDER BY r.created_at DESC`,
    [productId]
  );
  return result.rows;
};

const upsertProductReview = async (productId, userId, comment, rating) => {
  await pool.query(
    `INSERT INTO reviews (product_id, user_id, comment, rating)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (product_id, user_id)
     DO UPDATE SET comment = EXCLUDED.comment, rating = EXCLUDED.rating, updated_at = NOW()`,
    [productId, userId, comment, rating]
  );
};

const updateProductAverageRating = async (productId) => {
  const avgResult = await pool.query(
    "SELECT AVG(rating) AS avg_rating FROM reviews WHERE product_id = $1",
    [productId]
  );
  const avgRating = parseFloat(avgResult.rows[0].avg_rating) || 0;

  await pool.query(
    "UPDATE products SET average_rating = $1, updated_at = NOW() WHERE id = $2",
    [avgRating, productId]
  );
};

module.exports = {
  getProductByIdWithSeller,
  getProductReviews,
  upsertProductReview,
  updateProductAverageRating,
};
