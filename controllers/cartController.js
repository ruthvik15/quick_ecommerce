const Cart = require("../models/cart");
const Product = require("../models/product");

async function getCart(req, res) {
  const cart = await Cart.findOne({ user: req.user._id }).populate("items.product");
  res.json({ success: true, cart, user: req.user });
}

async function removeFromCart(req, res) {
  const { productId } = req.body;
  const cart = await Cart.findOne({ user: req.user._id });
  cart.items = cart.items.filter(item => item.product.toString() !== productId);
  await cart.save();
  res.json({ success: true, cart });
}

async function addToCart(req, res) {
  try {
    const userId = req.user._id;
    const { productId } = req.body;
    if (!productId) return res.status(400).json({ error: "Product ID is required" });

    let cart = await Cart.findOne({ user: userId });

    if (!cart) {
      cart = await Cart.create({
        user: userId,
        items: [{ product: productId, quantity: 1 }]
      });
    } else {
      const index = cart.items.findIndex(item => item.product.toString() === productId);
      if (index >= 0) {
        cart.items[index].quantity += 1;
      } else {
        cart.items.push({ product: productId, quantity: 1 });
      }
      await cart.save();
    }

    res.json({ success: true, message: "Added to cart", cart });
  } catch (err) {
    console.error("Error adding to cart:", err);
    res.status(500).json({ error: "Server error" });
  }
}

async function increaseQuantity(req, res) {
  const { productId } = req.body;
  const cart = await Cart.findOne({ user: req.user._id }).populate("items.product");
  const item = cart.items.find(i => i.product._id.toString() === productId);
  if (item && item.quantity < item.product.quantity) {
    item.quantity++;
    await cart.save();
  }
  res.json({ success: true, cart });
}

async function decreaseQuantity(req, res) {
  const { productId } = req.body;
  const cart = await Cart.findOne({ user: req.user._id });
  const item = cart.items.find(i => i.product.toString() === productId);
  if (item && item.quantity > 1) {
    item.quantity--;
    await cart.save();
  }
  res.json({ success: true, cart });
}

module.exports = {
  getCart,
  removeFromCart,
  addToCart,
  increaseQuantity,
  decreaseQuantity
};
