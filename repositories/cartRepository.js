const { pool } = require("../utils/dbConnection");

const fetchCartWithItems = async (userId) => {
  const cartRow = await pool.query(
    "SELECT id, user_id, location FROM carts WHERE user_id = $1",
    [userId]
  );
  if (cartRow.rows.length === 0) return null;

  const cart = cartRow.rows[0];

  const itemsRow = await pool.query(
    `SELECT
       ci.id,
       ci.quantity,
       p.id          AS product_id,
       p.name,
       p.price,
       p.image,
       p.description,
       p.quantity    AS stock,
       p.location,
       p.category,
       p.status,
       p.sold_count,
       p.average_rating
     FROM cart_items ci
     JOIN products p ON p.id = ci.product_id
     WHERE ci.cart_id = $1`,
    [cart.id]
  );

  cart.items = itemsRow.rows;
  return cart;
};

const getCartByUserId = async (userId) => {
  const result = await pool.query("SELECT id, location FROM carts WHERE user_id = $1", [userId]);
  return result.rows[0];
};

const deleteCartItem = async (cartId, productId) => {
  await pool.query("DELETE FROM cart_items WHERE cart_id = $1 AND product_id = $2", [cartId, productId]);
};

const getProductById = async (productId) => {
  const result = await pool.query("SELECT * FROM products WHERE id = $1", [productId]);
  return result.rows[0];
};

const createCart = async (userId, location) => {
  const newCart = await pool.query(
    `INSERT INTO carts (user_id, location) VALUES ($1, $2) RETURNING id`,
    [userId, location]
  );
  return newCart.rows[0].id;
};

const insertCartItem = async (cartId, productId, quantity) => {
  await pool.query(
    "INSERT INTO cart_items (cart_id, product_id, quantity) VALUES ($1, $2, $3)",
    [cartId, productId, quantity]
  );
};

const upsertCartItem = async (cartId, productId, maxStock) => {
  const result = await pool.query(
    `INSERT INTO cart_items (cart_id, product_id, quantity)
     VALUES ($1, $2, 1)
     ON CONFLICT (cart_id, product_id) DO UPDATE
       SET quantity = cart_items.quantity + 1
     WHERE cart_items.quantity < $3
     RETURNING quantity`,
    [cartId, productId, maxStock]
  );
  return result.rowCount > 0;
};

const updateCartLocation = async (cartId, location) => {
  await pool.query(
    "UPDATE carts SET location = $1, updated_at = NOW() WHERE id = $2",
    [location, cartId]
  );
};

const getProductQuantityAndStatus = async (productId) => {
  const result = await pool.query("SELECT quantity, status FROM products WHERE id = $1", [productId]);
  return result.rows[0];
};

const incrementCartItemQuantity = async (cartId, productId, maxStock) => {
  const result = await pool.query(
    `UPDATE cart_items
     SET quantity = quantity + 1
     WHERE cart_id = $1
       AND product_id = $2
       AND quantity < $3`,
    [cartId, productId, maxStock]
  );
  return result.rowCount > 0;
};

const checkCartItemExists = async (cartId, productId) => {
  const result = await pool.query("SELECT 1 FROM cart_items WHERE cart_id = $1 AND product_id = $2", [cartId, productId]);
  return result.rowCount > 0;
};

const decrementCartItemQuantity = async (cartId, productId) => {
  const result = await pool.query(
    `UPDATE cart_items
     SET quantity = quantity - 1
     WHERE cart_id = $1
       AND product_id = $2
       AND quantity > 1`,
    [cartId, productId]
  );
  return result.rowCount > 0;
};

const syncCartTransaction = async (userId, location) => {
  let client;
  try {
    client = await pool.connect();
    const cartRow = await client.query("SELECT id, location FROM carts WHERE user_id = $1", [userId]);

    if (cartRow.rows.length === 0) {
      return { cartLocationMismatch: false };
    }

    const cart = cartRow.rows[0];

    const mismatchedItems = await client.query(
      `SELECT ci.id
       FROM cart_items ci
       JOIN products p ON p.id = ci.product_id
       WHERE ci.cart_id = $1
         AND LOWER(p.location) != LOWER($2)`,
      [cart.id, location]
    );

    let cartLocationMismatch = false;

    await client.query("BEGIN");

    if (mismatchedItems.rows.length > 0) {
      const mismatchIds = mismatchedItems.rows.map((r) => r.id);

      await client.query(`DELETE FROM cart_items WHERE id = ANY($1::int[])`, [mismatchIds]);
      cartLocationMismatch = true;

      const remaining = await client.query("SELECT COUNT(*) FROM cart_items WHERE cart_id = $1", [cart.id]);
      const count = parseInt(remaining.rows[0].count);
      const newLocation = count > 0 ? location.toLowerCase() : null;

      await client.query("UPDATE carts SET location = $1, updated_at = NOW() WHERE id = $2", [newLocation, cart.id]);
    } else if (!cart.location) {
      await client.query("UPDATE carts SET location = $1, updated_at = NOW() WHERE id = $2", [location.toLowerCase(), cart.id]);
    }

    await client.query("COMMIT");

    return { cartLocationMismatch };
  } catch (err) {
    if (client) await client.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    if (client) client.release();
  }
};

module.exports = {
  fetchCartWithItems,
  getCartByUserId,
  deleteCartItem,
  getProductById,
  createCart,
  insertCartItem,
  upsertCartItem,
  updateCartLocation,
  getProductQuantityAndStatus,
  incrementCartItemQuantity,
  checkCartItemExists,
  decrementCartItemQuantity,
  syncCartTransaction,
};
