const { pool } = require("../utils/dbConnection");

async function createSeller({
  name,
  email,
  password,
  shop_name,
  phone,
  address,
  location,
  is_verified = false
}) {
  const result = await pool.query(
    `INSERT INTO sellers 
     (name, email, password, shop_name, phone, address, location, is_verified)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     RETURNING id, name, email, shop_name, phone, location, is_verified, created_at, 'seller' as role`,
    [name, email, password, shop_name, phone, address, location, is_verified]
  );

  return result.rows[0];
}

async function findSellerByEmail(email) {
  const result = await pool.query(
    "SELECT *, 'seller' AS role FROM sellers WHERE email = $1",
    [email]
  );
  return result.rows[0];
}

const getProductsBySeller = async (sellerId) => {
  const result = await pool.query("SELECT * FROM products WHERE seller_id = $1", [sellerId]);
  return result.rows;
};

const getSoldCountsByProducts = async (productIds) => {
  const result = await pool.query(
    `SELECT oi.product_id, SUM(oi.quantity) AS total_sold
     FROM order_items oi
     JOIN orders o ON o.id = oi.order_id
     WHERE oi.product_id = ANY($1::int[])
       AND o.status IN ('confirmed', 'accepted', 'out-for-delivery', 'delivered')
     GROUP BY oi.product_id`,
    [productIds]
  );
  return result.rows;
};

const updateProductStatus = async (productId, sellerId, status) => {
  const result = await pool.query(
    "UPDATE products SET status = $1, updated_at = NOW() WHERE id = $2 AND seller_id = $3 RETURNING *",
    [status, productId, sellerId]
  );
  return result.rows[0];
};

const getProductByIdAndSeller = async (productId, sellerId) => {
  const result = await pool.query(
    "SELECT * FROM products WHERE id = $1 AND seller_id = $2",
    [productId, sellerId]
  );
  return result.rows[0];
};

const updateProductPrice = async (productId, newPrice) => {
  await pool.query(
    "UPDATE products SET price = $1, updated_at = NOW() WHERE id = $2",
    [newPrice, productId]
  );
};

const updateProductQuantity = async (productId, newQty) => {
  await pool.query(
    "UPDATE products SET quantity = $1, updated_at = NOW() WHERE id = $2",
    [newQty, productId]
  );
};

const insertProduct = async (name, price, image, description, quantity, location, category, sellerId) => {
  const result = await pool.query(
    `INSERT INTO products (name, price, image, description, quantity, location, category, seller_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     RETURNING *`,
    [name, price, image, description, quantity, location, category, sellerId]
  );
  return result.rows[0];
};

const getProductIdsBySeller = async (sellerId) => {
  const result = await pool.query("SELECT id FROM products WHERE seller_id = $1", [sellerId]);
  return result.rows.map((p) => p.id);
};

const getOrderRevenueAndItemsForProducts = async (productIds) => {
  const result = await pool.query(
    `SELECT o.id, o.status,
            SUM(oi.price * oi.quantity) AS seller_order_revenue,
            json_agg(json_build_object(
              'product_id', oi.product_id,
              'name',       oi.name,
              'quantity',   oi.quantity,
              'price',      oi.price
            )) AS items
     FROM orders o
     JOIN order_items oi ON oi.order_id = o.id
     WHERE oi.product_id = ANY($1::int[])
       AND o.status IN ('confirmed', 'accepted', 'out-for-delivery', 'delivered')
     GROUP BY o.id`,
    [productIds]
  );
  return result.rows;
};

const getCountLiveAndStoppedProducts = async (sellerId) => {
  const result = await pool.query(
    `SELECT
       COUNT(*) FILTER (WHERE status = 'live')    AS live_count,
       COUNT(*) FILTER (WHERE status = 'stopped') AS stopped_count
     FROM products WHERE seller_id = $1`,
    [sellerId]
  );
  return result.rows[0];
};

const getTotalSoldForProducts = async (productIds) => {
  const result = await pool.query(
    `SELECT COALESCE(SUM(oi.quantity), 0) AS total_sold
     FROM order_items oi
     JOIN orders o ON o.id = oi.order_id
     WHERE oi.product_id = ANY($1::int[])
       AND o.status IN ('confirmed', 'accepted', 'out-for-delivery', 'delivered')`,
    [productIds]
  );
  return parseInt(result.rows[0].total_sold);
};

const getProductHeatmapDb = async (productId, oneDayAgo, blockSize) => {
  const result = await pool.query(
    `SELECT
       FLOOR(o.latitude  / $1) * $1  AS lat_block,
       FLOOR(o.longitude / $1) * $1  AS lng_block,
       SUM(oi.quantity)               AS total_quantity
     FROM orders o
     JOIN order_items oi ON oi.order_id = o.id
     WHERE oi.product_id = $2
       AND o.created_at >= $3
       AND o.status IN ('confirmed', 'accepted', 'out-for-delivery', 'delivered')
       AND o.latitude IS NOT NULL AND o.longitude IS NOT NULL
     GROUP BY lat_block, lng_block
     ORDER BY total_quantity DESC`,
    [blockSize, productId, oneDayAgo]
  );
  return result.rows;
};

const getProductById = async (productId) => {
  const result = await pool.query("SELECT * FROM products WHERE id = $1", [productId]);
  return result.rows[0];
};

const deleteProductById = async (productId) => {
  await pool.query("DELETE FROM products WHERE id = $1", [productId]);
};

module.exports = {
  createSeller,
  findSellerByEmail,
  getProductsBySeller,
  getSoldCountsByProducts,
  updateProductStatus,
  getProductByIdAndSeller,
  updateProductPrice,
  updateProductQuantity,
  insertProduct,
  getProductIdsBySeller,
  getOrderRevenueAndItemsForProducts,
  getCountLiveAndStoppedProducts,
  getTotalSoldForProducts,
  getProductHeatmapDb,
  getProductById,
  deleteProductById,
};
