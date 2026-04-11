const cartRepository = require("../repositories/cartRepository");

// ── getCart ───────────────────────────────────────────────────────────────────

async function getCart(req, res) {
  const cart = await cartRepository.fetchCartWithItems(req.user.id);
  res.json({ success: true, cart: cart || { items: [] }, user: req.user });
}

async function removeFromCart(req, res) {
  const { productId } = req.body;

  const cartRow = await cartRepository.getCartByUserId(req.user.id);
  if (!cartRow) {
    return res.json({ success: true, cart: { items: [] } });
  }

  await cartRepository.deleteCartItem(cartRow.id, productId);

  const cart = await cartRepository.fetchCartWithItems(req.user.id);
  res.json({ success: true, cart: cart || { items: [] } });
}


async function addToCart(req, res) {
  try {
    const userId = req.user.id;
    const { productId } = req.body;
    if (!productId) return res.status(400).json({ error: "Product ID is required" });

    // Validate product exists and is available
    const product = await cartRepository.getProductById(productId);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    if (product.status === "stopped" || product.status === "sold") {
      return res.status(400).json({ error: "Product is no longer available" });
    }
    if (product.quantity < 1) {
      return res.status(400).json({ error: "Product is out of stock" });
    }

    const productLocation = product.location.toLowerCase();

    // Get or create cart
    let cartRow = await cartRepository.getCartByUserId(userId);
    let cartId;

    if (!cartRow) {
      // Create new cart
      cartId = await cartRepository.createCart(userId, productLocation);
      await cartRepository.insertCartItem(cartId, productId, 1);
    } else {
      const cart = cartRow;
      cartId = cart.id;

      // Location mismatch → surface a 409
      if (cart.location && cart.location !== productLocation) {
        return res.status(409).json({
          error: "Location mismatch",
          message: `Your cart contains items from ${cart.location}. Clear cart and switch to ${productLocation}?`,
          currentLocation: cart.location,
          newLocation: productLocation,
        });
      }

      const added = await cartRepository.upsertCartItem(cartId, productId, product.quantity);

      if (!added) {
        return res.status(400).json({ error: "Cannot add more, stock limit reached" });
      }

      // Stamp cart location if it was previously unset
      if (!cart.location) {
        await cartRepository.updateCartLocation(cartId, productLocation);
      }
    }

    const updatedCart = await cartRepository.fetchCartWithItems(userId);
    res.json({ success: true, message: "Added to cart", cart: updatedCart });
  } catch (err) {
    console.error("Error adding to cart:", err);
    res.status(500).json({ error: "Server error" });
  }
}

async function increaseQuantity(req, res) {
  const { productId } = req.body;

  const cartRow = await cartRepository.getCartByUserId(req.user.id);
  if (!cartRow) {
    return res.status(404).json({ error: "Cart not found" });
  }
  const cartId = cartRow.id;

  // Fetch product for availability + stock ceiling
  const product = await cartRepository.getProductQuantityAndStatus(productId);
  if (!product) {
    return res.status(404).json({ error: "Product not found" });
  }

  if (product.status === "stopped" || product.status === "sold") {
    return res.status(400).json({ error: "Product is no longer available" });
  }

  const incremented = await cartRepository.incrementCartItemQuantity(cartId, productId, product.quantity);

  if (!incremented) {
    const itemExists = await cartRepository.checkCartItemExists(cartId, productId);
    if (!itemExists) {
      return res.status(404).json({ error: "Item not in cart" });
    }
    return res.status(400).json({ error: "Stock limit reached" });
  }

  const cart = await cartRepository.fetchCartWithItems(req.user.id);
  res.json({ success: true, cart });
}

async function decreaseQuantity(req, res) {
  const { productId } = req.body;

  const cartRow = await cartRepository.getCartByUserId(req.user.id);
  if (!cartRow) {
    return res.status(404).json({ error: "Cart not found" });
  }
  const cartId = cartRow.id;

  const decremented = await cartRepository.decrementCartItemQuantity(cartId, productId);

  if (!decremented) {
    await cartRepository.deleteCartItem(cartId, productId);
  }

  const cart = await cartRepository.fetchCartWithItems(req.user.id);
  res.json({ success: true, cart: cart || { items: [] } });
}

async function syncCart(req, res) {
  const { location } = req.body;
  if (!location) {
    return res.status(400).json({ error: "location is required" });
  }

  try {
    const { cartLocationMismatch } = await cartRepository.syncCartTransaction(req.user.id, location);
    
    const updatedCart = await cartRepository.fetchCartWithItems(req.user.id);
    return res.json({
      success: true,
      cartLocationMismatch,
      cart: updatedCart || { items: [] },
    });
  } catch (err) {
    console.error("Cart sync error:", err);
    res.status(500).json({ error: "Server error during cart sync" });
  }
}

module.exports = {
  getCart,
  removeFromCart,
  addToCart,
  increaseQuantity,
  decreaseQuantity,
  syncCart,
};
