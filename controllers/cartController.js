const Cart = require("../models/cart");
const Product = require("../models/product");

async function getCart(req, res) {
  const cart = await Cart.findOne({ user: req.user._id }).populate("items.product");
  res.json({ success: true, cart, user: req.user });
}

async function removeFromCart(req, res) {
  const { productId } = req.body;
  const cart = await Cart.findOne({ user: req.user._id }).populate("items.product");
  if (!cart) return res.json({ success: true, cart: { items: [] } });

  cart.items = cart.items.filter(item => item.product._id.toString() !== productId);
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
      // Populate for the return value
      await cart.populate("items.product");
    } else {
      const index = cart.items.findIndex(item => item.product.toString() === productId);
      if (index >= 0) {
        cart.items[index].quantity += 1;
      } else {
        cart.items.push({ product: productId, quantity: 1 });
      }
      await cart.save();
      // Populate for the return value
      await cart.populate("items.product");
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
  const cart = await Cart.findOne({ user: req.user._id }).populate("items.product");

  const itemIndex = cart.items.findIndex(i => i.product._id.toString() === productId);

  if (itemIndex > -1) {
    const item = cart.items[itemIndex];
    if (item.quantity > 1) {
      item.quantity--;
    } else {
      // If quantity is 1 and we decrease, remove it?
      // User request says: "once added to cart dont show + again show - number + ."
      // and typically - on 1 removes it.
      // But let's check if the existing frontend logic expects removal on 0 or checks > 1.
      // Cart.jsx: disabled={item.quantity <= 1}
      // So Frontend prevents decreasing below 1.
      // However, ProductCard.jsx (future) might want to remove it.
      // For now, let's keep it > 0 but populate the result.
      // Actually, standard behavior is remove on 0. But Cart page explicitly disables the button at 1.
      // So I will just fix the populate for now to solve the NaN bug.
      // Refactoring `decreaseQuantity` to remove items is part of Phase 15. I'll stick to fixing bugs here.
      item.quantity--;
    }
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
