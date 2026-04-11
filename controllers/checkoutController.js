const checkoutRepository = require("../repositories/checkoutRepository");
const warehouseCoords = require("../utils/warehouseCoordinates");

async function showCheckoutPage(req, res) {
  try {
    const cartData = await checkoutRepository.fetchCartItems(req.user.id);

    if (!cartData) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    const { items } = cartData;
    const firstLocation = items[0].location.toLowerCase();
    const allSameLocation = items.every(
      (item) => item.location.toLowerCase() === firstLocation
    );

    if (!allSameLocation) {
      return res.status(400).json({
        error: "All items in your cart must be from the same city to proceed to checkout.",
        code: "LOCATION_MISMATCH",
      });
    }

    const lastOrder = await checkoutRepository.getLastOrderAddress(req.user.id);
    const warehouseData = warehouseCoords[firstLocation] || warehouseCoords["hyderabad"];

    res.json({
      success: true,
      user: req.user,
      cart: cartData,
      cartLocation: firstLocation,
      warehouseCoords: warehouseData,
      lastDelivery: lastOrder
        ? {
            address: lastOrder.address,
            lat: lastOrder.latitude,
            lng: lastOrder.longitude,
            phone: lastOrder.phone,
          }
        : null,
      razorpayKeyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error("Error fetching checkout page details:", err);
    res.status(500).json({ error: "Server error" });
  }
}

async function processCheckout(req, res) {
  try {
    const {
      deliveryDate,
      deliverySlot,
      latitude,
      longitude,
      paymentMethod,
      address,
      phone,
    } = req.body;

    if (!address || !latitude || !longitude) {
      return res.status(400).json({
        error: "Delivery address and location coordinates are required",
      });
    }

    const result = await checkoutRepository.processCheckoutTransaction(
      req.user.id,
      req.user.location,
      req.body
    );

    if (result.error || result.message) {
      return res.status(result.status || 400).json({ error: result.error || result.message });
    }

    if (result.redirect) {
      return res.json({ success: true, redirect: result.redirect });
    }

    return res.json(result.data);
  } catch (err) {
    console.error("Checkout error:", err);
    res.status(500).json({ error: err.message || "Something went wrong during checkout" });
  }
}

async function verifyPayment(req, res) {
  try {
    const result = await checkoutRepository.verifyPaymentTransaction(
      req.user.id,
      req.user.location,
      req.body
    );

    if (!result.success) {
      return res.status(result.status || 400).json({ success: false, message: result.message });
    }

    return res.json({ success: true, redirect: result.redirect });
  } catch (err) {
    console.error("Payment verification failed:", err);
    res.status(500).json({ success: false, message: "Payment verification failed" });
  }
}

function showSuccessPage(req, res) {
  res.json({ success: true, message: "Order placed successfully" });
}

module.exports = {
  showCheckoutPage,
  processCheckout,
  verifyPayment,
  showSuccessPage,
};
