const { pool } = require("../utils/dbConnection");

async function createRider({
  name,
  email,
  password,
  location,
  phone,
  address,
  vehicle_type,
  number_plate,
  latitude,
  longitude
}) {
  const result = await pool.query(
    `INSERT INTO riders 
     (name, email, password, location, phone, address, vehicle_type, number_plate, latitude, longitude)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     RETURNING id, name, email, phone, location, vehicle_type, number_plate, latitude, longitude, created_at, 'rider' as role`,
    [
      name,
      email,
      password,
      location,
      phone,
      address,
      vehicle_type,
      number_plate,
      latitude,
      longitude
    ]
  );
  return result.rows[0];
}

async function findRiderByEmail(email) {
  const result = await pool.query(
    "SELECT *, 'rider' AS role FROM riders WHERE email = $1",
    [email]
  );
  return result.rows[0];
}

async function fetchOrdersWithDetails(whereClause, params) {
  return pool.query(
    `SELECT
       o.*,
       u.name      AS user_name,
       u.phone     AS user_phone,
       u.address   AS user_address,
       u.location  AS user_location_field,
       json_agg(
         json_build_object(
           'product_id', oi.product_id,
           'name',       oi.name,
           'quantity',   oi.quantity,
           'price',      oi.price
         )
       ) AS items
     FROM orders o
     LEFT JOIN users u         ON u.id = o.user_id
     LEFT JOIN order_items oi  ON oi.order_id = o.id
     ${whereClause}
     GROUP BY o.id, u.name, u.phone, u.address, u.location
     ORDER BY o.delivery_date ASC, o.created_at ASC`,
    params
  );
}

const acceptOrderDb = async (riderId, orderId) => {
  const result = await pool.query(
    `UPDATE orders
     SET rider_id = $1, status = 'accepted', updated_at = NOW()
     WHERE id = $2 AND status = 'confirmed'
     RETURNING *`,
    [riderId, orderId]
  );
  return result.rows[0];
};

const getOrderStatus = async (orderId) => {
  const result = await pool.query("SELECT id, status FROM orders WHERE id = $1", [orderId]);
  return result.rows[0];
};

const insertOrderRejection = async (orderId, riderId) => {
  await pool.query(
    `INSERT INTO order_rejections (order_id, rider_id)
     VALUES ($1, $2)
     ON CONFLICT DO NOTHING`,
    [orderId, riderId]
  );
};

const countDeliveredOrders = async (riderId) => {
  const result = await pool.query(
    "SELECT COUNT(*) FROM orders WHERE rider_id = $1 AND status = 'delivered'",
    [riderId]
  );
  return parseInt(result.rows[0].count);
};

const getRiderById = async (riderId) => {
  const result = await pool.query("SELECT * FROM riders WHERE id = $1", [riderId]);
  return result.rows[0];
};

const countTodaysOrders = async (riderId, todayStr) => {
  const result = await pool.query(
    `SELECT COUNT(*) FROM orders
     WHERE rider_id = $1
       AND status IN ('accepted', 'out-for-delivery')
       AND delivery_date = $2::date`,
    [riderId, todayStr]
  );
  return parseInt(result.rows[0].count);
};

const countOrderRequests = async (riderId, location) => {
  const result = await pool.query(
    `SELECT COUNT(*) FROM orders o
     WHERE o.status = 'confirmed'
       AND o.location = $2
       AND o.delivery_date >= CURRENT_DATE
       AND NOT EXISTS (
         SELECT 1 FROM order_rejections r
         WHERE r.order_id = o.id AND r.rider_id = $1
       )`,
    [riderId, location]
  );
  return parseInt(result.rows[0].count);
};

const updateRiderLocationDb = async (riderId, latitude, longitude) => {
  const result = await pool.query(
    `UPDATE riders
     SET latitude = $1, longitude = $2, updated_at = NOW()
     WHERE id = $3
     RETURNING *`,
    [latitude, longitude, riderId]
  );
  return result.rows[0];
};

const getConfirmedOrdersForLocation = async (riderId, location) => {
  const result = await pool.query(
    `SELECT
       o.id,
       o.delivery_date,
       o.delivery_slot,
       o.address,
       o.location       AS user_location,
       o.phone,
       o.paid,
       o.status,
       u.name           AS user_name,
       json_agg(
         json_build_object(
           'name',     oi.name,
           'quantity', oi.quantity,
           'price',    oi.price
         )
       ) AS items
     FROM orders o
     LEFT JOIN users u        ON u.id = o.user_id
     LEFT JOIN order_items oi ON oi.order_id = o.id
     WHERE o.status = 'confirmed'
       AND o.location = $2
       AND o.delivery_date >= CURRENT_DATE
       AND NOT EXISTS (
         SELECT 1 FROM order_rejections r
         WHERE r.order_id = o.id AND r.rider_id = $1
       )
     GROUP BY o.id, u.name
     ORDER BY o.delivery_date ASC`,
    [riderId, location]
  );
  return result.rows;
};

const getTodaysAcceptedOrders = async (riderId, todayStr) => {
  const result = await pool.query(
    `SELECT
       o.id,
       o.delivery_date,
       o.delivery_slot,
       o.address,
       o.location  AS user_location,
       o.status,
       o.paid,
       u.name      AS user_name,
       json_agg(
         json_build_object(
           'name',     oi.name,
           'quantity', oi.quantity,
           'price',    oi.price
         )
       ) AS items
     FROM orders o
     LEFT JOIN users u        ON u.id = o.user_id
     LEFT JOIN order_items oi ON oi.order_id = o.id
     WHERE o.rider_id = $1
       AND o.status IN ('accepted', 'out-for-delivery', 'delivered')
       AND o.delivery_date = $2::date
     GROUP BY o.id, u.name
     ORDER BY o.delivery_date ASC`,
    [riderId, todayStr]
  );
  return result.rows;
};

const markOrderOutForDeliveryDb = async (orderId, riderId) => {
  const result = await pool.query(
    `UPDATE orders
     SET status = 'out-for-delivery', updated_at = NOW()
     WHERE id = $1
       AND rider_id = $2
       AND status = 'accepted'
     RETURNING id`,
    [orderId, riderId]
  );
  return result.rowCount > 0;
};

const markOrderCompleteDb = async (orderId, riderId) => {
  const result = await pool.query(
    `UPDATE orders
     SET status = 'delivered', updated_at = NOW()
     WHERE id = $1
       AND rider_id = $2
       AND status = 'out-for-delivery'
     RETURNING id`,
    [orderId, riderId]
  );
  return result.rowCount > 0;
};

const incrementRiderOrderCount = async (riderId) => {
  await pool.query(
    "UPDATE riders SET no_of_orders = no_of_orders + 1, updated_at = NOW() WHERE id = $1",
    [riderId]
  );
};

const getActiveOrders = async (riderId) => {
  const result = await pool.query(
    `SELECT
       o.id,
       o.delivery_date,
       o.delivery_slot,
       o.address,
       o.location  AS user_location,
       o.status,
       o.paid,
       o.total,
       o.phone,
       u.name      AS user_name,
       u.phone     AS user_phone,
       json_agg(
         json_build_object(
           'name',     oi.name,
           'quantity', oi.quantity,
           'price',    oi.price
         )
       ) AS items
     FROM orders o
     LEFT JOIN users u        ON u.id = o.user_id
     LEFT JOIN order_items oi ON oi.order_id = o.id
     WHERE o.rider_id = $1
       AND o.status IN ('accepted', 'out-for-delivery')
     GROUP BY o.id, u.name, u.phone
     ORDER BY o.delivery_date ASC`,
    [riderId]
  );
  return result.rows;
};

const getDeliveredOrders = async (riderId) => {
  const result = await pool.query(
    `SELECT
       o.id,
       o.delivery_date,
       o.delivery_slot,
       o.address,
       o.location  AS user_location,
       o.status,
       o.paid,
       o.total,
       o.phone,
       u.name      AS user_name,
       u.phone     AS user_phone,
       json_agg(
         json_build_object(
           'name',     oi.name,
           'quantity', oi.quantity,
           'price',    oi.price
         )
       ) AS items
     FROM orders o
     LEFT JOIN users u        ON u.id = o.user_id
     LEFT JOIN order_items oi ON oi.order_id = o.id
     WHERE o.rider_id = $1
       AND o.status = 'delivered'
     GROUP BY o.id, u.name, u.phone
     ORDER BY o.delivery_date DESC`,
    [riderId]
  );
  return result.rows;
};

const getMissedOrders = async () => {
  const result = await pool.query(
    `SELECT o.*, json_agg(
       json_build_object('name', oi.name, 'quantity', oi.quantity, 'price', oi.price)
     ) AS items
     FROM orders o
     LEFT JOIN order_items oi ON oi.order_id = o.id
     WHERE o.status = 'missed'
     GROUP BY o.id
     ORDER BY o.delivery_date ASC`,
    []
  );
  return result.rows;
};

const getOrderOwnership = async (orderId) => {
  const result = await pool.query("SELECT id, rider_id FROM orders WHERE id = $1", [orderId]);
  return result.rows[0];
};

const updateDeliverySlotDb = async (orderId, newDate, newSlot) => {
  await pool.query(
    `UPDATE orders
     SET delivery_date = $1::date, delivery_slot = $2, status = 'confirmed', updated_at = NOW()
     WHERE id = $3`,
    [newDate, newSlot, orderId]
  );
};

const getOrderDetailsDb = async (orderId) => {
  const result = await pool.query(
    `SELECT
       o.*,
       u.name     AS user_name,
       u.email    AS user_email,
       u.phone    AS user_phone,
       u.address  AS user_address,
       u.location AS user_location_field,
       u.latitude AS user_latitude,
       u.longitude AS user_longitude,
       json_agg(
         json_build_object(
           'product_id',  oi.product_id,
           'name',        oi.name,
           'quantity',    oi.quantity,
           'price',       oi.price
         )
       ) AS items
     FROM orders o
     LEFT JOIN users u        ON u.id = o.user_id
     LEFT JOIN order_items oi ON oi.order_id = o.id
     WHERE o.id = $1
     GROUP BY o.id, u.name, u.email, u.phone, u.address, u.location, u.latitude, u.longitude`,
    [orderId]
  );
  return result.rows[0];
};

module.exports = {
  createRider,
  findRiderByEmail,
  fetchOrdersWithDetails,
  acceptOrderDb,
  getOrderStatus,
  insertOrderRejection,
  countDeliveredOrders,
  getRiderById,
  countTodaysOrders,
  countOrderRequests,
  updateRiderLocationDb,
  getConfirmedOrdersForLocation,
  getTodaysAcceptedOrders,
  markOrderOutForDeliveryDb,
  markOrderCompleteDb,
  incrementRiderOrderCount,
  getActiveOrders,
  getDeliveredOrders,
  getMissedOrders,
  getOrderOwnership,
  updateDeliverySlotDb,
  getOrderDetailsDb,
};
