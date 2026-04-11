const { pool } = require("../utils/dbConnection");
const razorpay = require("../utils/razorpay");

const checkCartLocationMismatch = async (userId, selectedLocation) => {
  const cartRow = await pool.query(
    `SELECT ci.id
     FROM carts c
     JOIN cart_items ci ON ci.cart_id = c.id
     JOIN products   p  ON p.id = ci.product_id
     WHERE c.user_id = $1
       AND LOWER(p.location) != LOWER($2)
     LIMIT 1`,
    [userId, selectedLocation]
  );
  return cartRow.rows.length > 0;
};

const fetchProducts = async (whereClause, orderBy, params, limitParamIndex) => {
  const result = await pool.query(
    `SELECT * FROM products ${whereClause} ${orderBy} LIMIT $${limitParamIndex} OFFSET $${limitParamIndex + 1}`,
    params
  );
  return result.rows;
};

const countProducts = async (whereClause, params) => {
  const countResult = await pool.query(
    `SELECT COUNT(*) FROM products ${whereClause}`,
    params
  );
  return parseInt(countResult.rows[0].count);
};

const getUserOrders = async (userId) => {
  const result = await pool.query(
    `SELECT
       o.*,
       json_agg(
         json_build_object(
           'id',         oi.id,
           'product_id', oi.product_id,
           'name',       oi.name,
           'quantity',   oi.quantity,
           'price',      oi.price
         )
       ) AS items
     FROM orders o
     LEFT JOIN order_items oi ON oi.order_id = o.id
     WHERE o.user_id = $1
     GROUP BY o.id
     ORDER BY o.created_at DESC`,
    [userId]
  );
  return result.rows;
};

const markOrderMissed = async (orderId) => {
  await pool.query(
    "UPDATE orders SET status = 'missed', updated_at = NOW() WHERE id = $1",
    [orderId]
  );
};

const cancelOrderTransaction = async (orderId, userId) => {
  let client;
  try {
    client = await pool.connect();
    await client.query("BEGIN");

    const orderResult = await client.query(
      `SELECT * FROM orders
       WHERE id = $1
         AND user_id = $2
         AND status IN ('confirmed', 'missed')
       FOR UPDATE`,
      [orderId, userId]
    );

    if (orderResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return { status: 400, error: "Invalid or already processed order" };
    }

    const order = orderResult.rows[0];

    await client.query(
      "UPDATE orders SET status = 'refunding', updated_at = NOW() WHERE id = $1",
      [order.id]
    );

    const itemsResult = await client.query(
      "SELECT product_id, quantity FROM order_items WHERE order_id = $1",
      [order.id]
    );

    await client.query("COMMIT");

    if (order.paid && order.razorpay_payment_id) {
      try {
        await razorpay.payments.refund(order.razorpay_payment_id, {
          amount: order.total * 100,
        });
      } catch (refundErr) {
        console.error("Refund failed:", refundErr);
        await client.query(
          "UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2",
          [order.status, order.id]
        );
        return { status: 500, error: "Refund processing failed. Please contact support." };
      }
    }

    await client.query("BEGIN");

    if (itemsResult.rows.length > 0) {
      const valuePlaceholders = itemsResult.rows
        .map((_, i) => `($${i * 2 + 1}::int, $${i * 2 + 2}::int)`)
        .join(", ");

      const valueParams = itemsResult.rows.flatMap((item) => [
        item.product_id,
        item.quantity,
      ]);

      const batchResult = await client.query(
        `UPDATE products AS p
         SET quantity   = p.quantity   + v.qty,
             sold_count = p.sold_count - v.qty,
             updated_at = NOW()
         FROM (VALUES ${valuePlaceholders}) AS v(product_id, qty)
         WHERE p.id = v.product_id
         RETURNING p.id`,
        valueParams
      );

      if (batchResult.rows.length !== itemsResult.rows.length) {
        await client.query("ROLLBACK");
        return { status: 500, error: "One or more products could not be updated. Contact support." };
      }
    }

    await client.query(
      "UPDATE orders SET status = 'cancelled', updated_at = NOW() WHERE id = $1",
      [order.id]
    );

    await client.query("COMMIT");
    return { success: true, message: "Order cancelled successfully" };
  } catch (err) {
    if (client) await client.query("ROLLBACK").catch(() => { });
    console.error("Cancel failed:", err);
    throw err;
  } finally {
    if (client) client.release();
  }
};

const getOrderTrackingDetails = async (orderId) => {
  const result = await pool.query(
    `SELECT
       o.*,
       r.id           AS rider_id_val,
       r.name         AS rider_name,
       r.phone        AS rider_phone,
       r.vehicle_type AS rider_vehicle_type,
       r.latitude     AS rider_latitude,
       r.longitude    AS rider_longitude,
       r.updated_at   AS rider_updated_at,
       u.latitude     AS user_latitude,
       u.longitude    AS user_longitude
     FROM orders o
     LEFT JOIN riders r ON r.id = o.rider_id
     LEFT JOIN users  u ON u.id = o.user_id
     WHERE o.id = $1`,
    [orderId]
  );
  return result.rows[0];
};

const getOrderItemsWithProductDetails = async (orderId) => {
  const result = await pool.query(
    `SELECT oi.*, p.image, p.category
     FROM order_items oi
     LEFT JOIN products p ON p.id = oi.product_id
     WHERE oi.order_id = $1`,
    [orderId]
  );
  return result.rows;
};

const getOrderAndRiderLocation = async (orderId) => {
  const result = await pool.query(
    `SELECT
       o.id,
       o.user_id,
       o.rider_id,
       r.name         AS rider_name,
       r.phone        AS rider_phone,
       r.vehicle_type AS rider_vehicle_type,
       r.latitude     AS rider_latitude,
       r.longitude    AS rider_longitude,
       r.updated_at   AS rider_updated_at
     FROM orders o
     LEFT JOIN riders r ON r.id = o.rider_id
     WHERE o.id = $1`,
    [orderId]
  );
  return result.rows[0];
};

const getSearchSuggestions = async (queryLike, location) => {
  const result = await pool.query(
    `SELECT name FROM products
     WHERE name ILIKE $1
       AND location = $2
       AND status != 'stopped'
     LIMIT 5`,
    [queryLike, location]
  );
  return result.rows.map((r) => r.name);
};

const searchProductsExact = async (queryLike, location) => {
  const result = await pool.query(
    `SELECT * FROM products
     WHERE name ILIKE $1
       AND location = $2
       AND status != 'stopped'`,
    [queryLike, location]
  );
  return result.rows;
};

module.exports = {
  checkCartLocationMismatch,
  fetchProducts,
  countProducts,
  getUserOrders,
  markOrderMissed,
  cancelOrderTransaction,
  getOrderTrackingDetails,
  getOrderItemsWithProductDetails,
  getOrderAndRiderLocation,
  getSearchSuggestions,
  searchProductsExact,
};
