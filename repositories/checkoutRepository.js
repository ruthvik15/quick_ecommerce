const { pool } = require("../utils/dbConnection");
const warehouseCoords = require("../utils/warehouseCoordinates");
const getDistanceKm = require("../utils/distance");
const razorpay = require("../utils/razorpay");
const crypto = require("crypto");

const MAX_DELIVERY_DISTANCE = process.env.MAX_DELIVERY_DISTANCE || 20;

async function fetchCartItems(userId, client) {
  const db = client ;

  const cartRow = await db.query(
    "SELECT id, location FROM carts WHERE user_id = $1",
    [userId]
  );
  if (cartRow.rows.length === 0) return null;

  const { id: cartId, location } = cartRow.rows[0];

  const items = await db.query(
    `SELECT
       ci.quantity,
       p.id        AS product_id,
       p.name,
       p.price,
       p.image,
       p.location,
       p.status,
       p.quantity  AS stock
     FROM cart_items ci
     JOIN products p ON p.id = ci.product_id
     WHERE ci.cart_id = $1`,
    [cartId]
  );

  if (items.rows.length === 0) return null;

  return { cartId, location, items: items.rows };
}

async function getLastOrderAddress(userId) {
  const lastOrderResult = await pool.query(
    `SELECT address, latitude, longitude, phone
     FROM orders
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT 1`,
    [userId]
  );
  return lastOrderResult.rows[0] || null;
}

function validateItems(items, latitude, longitude) {
  for (const item of items) {
    const warehouseCoordData = warehouseCoords[item.location.toLowerCase()];
    const distance = getDistanceKm(
      parseFloat(latitude),
      parseFloat(longitude),
      warehouseCoordData.lat,
      warehouseCoordData.lng
    );

    if (distance > MAX_DELIVERY_DISTANCE) {
      return `Product "${item.name}" cannot be delivered (Distance = ${distance.toFixed(1)} km, Limit = ${MAX_DELIVERY_DISTANCE} km)`;
    }

    if (item.status && item.status !== "live") {
      return `Product "${item.name}" is no longer available (Status: ${item.status})`;
    }
  }
  return null;
}

async function deductStock(items, client) {
  for (const item of items) {
    const result = await client.query(
      `UPDATE products
       SET quantity   = quantity   - $1,
           sold_count = sold_count + $1,
           updated_at = NOW()
       WHERE id = $2 AND quantity >= $1
       RETURNING id`,
      [item.quantity, item.product_id]
    );

    if (result.rows.length === 0) {
      return `Product "${item.name}" is out of stock.`;
    }
  }
  return null;
}

async function createOrder(client, { userId, items, total, location, deliveryDate, deliverySlot, latitude, longitude, address, phone, paid, razorpay_payment_id }) {
  const orderResult = await client.query(
    `INSERT INTO orders
       (user_id, total, location, delivery_date, delivery_slot,
        latitude, longitude, address, phone, paid, razorpay_payment_id, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'confirmed')
     RETURNING id`,
    [
      userId,
      total,
      location,
      deliveryDate,
      deliverySlot,
      parseFloat(latitude),
      parseFloat(longitude),
      address,
      phone || null,
      paid || false,
      razorpay_payment_id || null,
    ]
  );

  const orderId = orderResult.rows[0].id;

  for (const item of items) {
    await client.query(
      `INSERT INTO order_items (order_id, product_id, name, quantity, price)
       VALUES ($1,$2,$3,$4,$5)`,
      [orderId, item.product_id, item.name, item.quantity, item.price]
    );
  }

  return orderId;
}

async function processCheckoutTransaction(userId, userLocation, checkoutData) {
  let client;
  let clientReleased = false;

  try {
    client = await pool.connect();
    await client.query("BEGIN");

    const { deliveryDate, deliverySlot, latitude, longitude, paymentMethod, address, phone } = checkoutData;

    const cartData = await fetchCartItems(userId, client);
    if (!cartData) {
      await client.query("ROLLBACK");
      return { status: 400, error: "Cart is empty" };
    }

    const { cartId, items } = cartData;

    const validationError = validateItems(items, latitude, longitude);
    if (validationError) {
      await client.query("ROLLBACK");
      return { status: 400, error: validationError };
    }

    const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

    if (paymentMethod === "cod") {
      const stockError = await deductStock(items, client);
      if (stockError) {
        await client.query("ROLLBACK");
        return { status: 400, error: stockError };
      }

      await createOrder(client, {
        userId, items, total, location: userLocation, deliveryDate, deliverySlot,
        latitude, longitude, address, phone, paid: false,
      });

      await client.query("DELETE FROM cart_items WHERE cart_id = $1", [cartId]);
      await client.query("UPDATE carts SET location = NULL, updated_at = NOW() WHERE id = $1", [cartId]);

      await client.query("COMMIT");
      return { success: true, redirect: "/checkout/orders/success" };
    }

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      await client.query("ROLLBACK");
      return { status: 500, error: "Razorpay keys are missing in server configuration." };
    }

    await client.query("ROLLBACK");
    client.release();
    clientReleased = true;

    const razorOrder = await razorpay.orders.create({
      amount: Math.round(total * 100),
      currency: "INR",
      receipt: `rcpt_${Math.random().toString(36).substr(2, 9)}`,
    });

    return {
      success: true,
      data: {
        razorpayOrderId: razorOrder.id,
        amount: razorOrder.amount,
        key: process.env.RAZORPAY_KEY_ID,
        deliveryDate,
        deliverySlot,
        latitude,
        longitude,
      }
    };
  } catch (err) {
    if (client && !clientReleased) await client.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    if (client && !clientReleased) client.release();
  }
}

async function verifyPaymentTransaction(userId, userLocation, paymentData) {
  let client;
  try {
    client = await pool.connect();
    await client.query("BEGIN");

    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, deliveryDate, deliverySlot, latitude, longitude, address, phone } = paymentData;

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      await client.query("ROLLBACK");
      return { status: 400, message: "Invalid payment signature" };
    }

    const cartData = await fetchCartItems(userId, client);

    if (!cartData) {
      await client.query("ROLLBACK");
      return { status: 400, message: "Cart is empty" };
    }

    const { cartId, items } = cartData;

    const firstLocation = items[0].location.toLowerCase();
    const allSameLocation = items.every(
      (item) => item.location.toLowerCase() === firstLocation
    );

    if (!allSameLocation) {
      await client.query("ROLLBACK");
      return { status: 400, message: "Cart items are from different locations. Please update your cart." };
    }

    const validationError = validateItems(items, latitude, longitude);
    if (validationError) {
      await client.query("ROLLBACK");
      return { status: 400, message: validationError };
    }

    const stockError = await deductStock(items, client);
    if (stockError) {
      await client.query("ROLLBACK");
      try {
        await razorpay.payments.refund(razorpay_payment_id);
        return { status: 400, message: `${stockError} Your payment has been fully refunded.` };
      } catch (refundErr) {
        console.error(`CRITICAL: Refund failed for Payment ID: ${razorpay_payment_id}. Reason: ${stockError}. Manual refund required.`, refundErr);
        return { status: 500, message: "Stock ran out and the automated refund failed. Please contact support with your payment ID: " + razorpay_payment_id };
      }
    }

    const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

    await createOrder(client, {
      userId,
      items,
      total,
      location: userLocation,
      deliveryDate,
      deliverySlot,
      latitude,
      longitude,
      address,
      phone,
      paid: true,
      razorpay_payment_id,
    });

    await client.query("DELETE FROM cart_items WHERE cart_id = $1", [cartId]);
    await client.query("UPDATE carts SET location = NULL, updated_at = NOW() WHERE id = $1", [cartId]);

    await client.query("COMMIT");
    return { success: true, redirect: "/checkout/orders/success" };
  } catch (err) {
    if (client) await client.query("ROLLBACK").catch(() => {});
    console.error("Payment verification failed:", err);
    throw err;
  } finally {
    if (client) client.release();
  }
}

module.exports = {
  fetchCartItems,
  getLastOrderAddress,
  processCheckoutTransaction,
  verifyPaymentTransaction,
};
