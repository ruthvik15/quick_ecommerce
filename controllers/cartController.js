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
  // Populate after save
  await cart.populate("items.product");
  res.json({ success: true, cart });
}

async function addToCart(req, res) {
  try {
    const userId = req.user._id;
    const { productId } = req.body;
    if (!productId) return res.status(400).json({ error: "Product ID is required" });

    // Validate product exists and has stock
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    if (product.status === "stopped" || product.status === "sold") {
      return res.status(400).json({ error: "Product is no longer available" });
    }
    if (product.quantity < 1) {
      return res.status(400).json({ error: "Product is out of stock" });
    }

    let cart = await Cart.findOne({ user: userId });
    const productLocation = product.location.toLowerCase();

    if (!cart) {
      // BUG #12 FIX: Create cart with location tracking
      cart = await Cart.create({
        user: userId,
        items: [{ product: productId, quantity: 1 }],
        location: productLocation
      });
      // Populate for the return value
      await cart.populate("items.product");
    } else {
      // BUG #12 FIX: Check if product location matches cart location
      if (cart.location && cart.location !== productLocation) {
        // Location mismatch - clear the cart and add new product
        await Cart.findByIdAndUpdate(cart._id, {
          items: [{ product: productId, quantity: 1 }],
          location: productLocation
        });
        cart = await Cart.findById(cart._id).populate("items.product");
        return res.json({ 
          success: true, 
          message: "Cart cleared - products must be from same city. Added item from new location.", 
          cart 
        });
      }

      // Same location - proceed normally
      const index = cart.items.findIndex(item => item.product.toString() === productId);
      if (index >= 0) {
        // Check stock before increasing quantity
        if (cart.items[index].quantity >= product.quantity) {
          return res.status(400).json({ error: "Cannot add more, stock limit reached" });
        }
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
  
  if (item) {
    // FIXED BUG #15: Reload product to get latest stock (race condition mitigation)
    const freshProduct = await Product.findById(productId);
    if (!freshProduct) {
      return res.status(404).json({ error: "Product not found" });
    }
    if (freshProduct.status === "stopped" || freshProduct.status === "sold") {
      return res.status(400).json({ error: "Product is no longer available" });
    }
    if (item.quantity >= freshProduct.quantity) {
      return res.status(400).json({ error: "Stock limit reached" });
    }
    
    item.quantity++;
    await cart.save();
    // Populate after save
    await cart.populate("items.product");
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
      // Remove item when quantity reaches 0
      cart.items.splice(itemIndex, 1);
    }
    await cart.save();
    // Populate after save
    await cart.populate("items.product");
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
