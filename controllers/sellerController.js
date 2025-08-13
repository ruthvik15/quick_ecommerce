const Product = require('../models/product');
const Order = require('../models/order');
const { delCache } = require("../utils/cache");

async function invalidateProductCaches(product) {
  const location = product.location.toLowerCase();
  const categories = ['all', product.category.toLowerCase()];
  const sorts = ['default', 'low-high', 'high-low', 'newest'];

  for (const cat of categories) {
    for (const sort of sorts) {
      const key = `products:${location}:${cat}:${sort}`;
      await delCache(key);
    }
  }
}

async function getDashboard(req, res) {
  if (!req.user || req.user.role !== 'seller') return res.redirect('/login');

  try {
    const products = await Product.find({ seller: req.user._id });

    const soldCounts = await Order.aggregate([
      { $match: { status: { $in: ['confirmed', 'accepted', 'out-for-delivery', 'delivered'] } } },
      { $group: { _id: '$product_id', totalSold: { $sum: '$quantity' } } }
    ]);

    const soldMap = soldCounts.reduce((map, p) => {
      map[p._id] = p.totalSold;
      return map;
    }, {});

    const dashboardProducts = products.map(product => {
      const sold = soldMap[product._id] || 0;
      return {
        _id: product._id,
        name: product.name,
        image: product.image,
        price: product.price,
        quantity: product.quantity,
        sold,
        remaining: product.quantity - sold,
        status: product.status || 'active'
      };
    });

    res.render('seller/dashboard', { user: req.user, products: dashboardProducts });
  } catch (error) {
    console.error('Error loading seller dashboard:', error);
    res.status(500).send('Error loading dashboard.');
  }
}

async function stopProduct(req, res) {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, { status: 'stopped' });
    if (product) await invalidateProductCaches(product);
    res.redirect('/seller/dashboard');
  } catch (error) {
    console.error('Error stopping product:', error);
    res.status(500).send('Error stopping product.');
  }
}

async function updatePrice(req, res) {
  try {
    const delta = parseFloat(req.body.change);
    if (isNaN(delta)) return res.status(400).send('Invalid price change amount.');

    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).send('Product not found.');

    const newPrice = product.price + delta;
    if (newPrice < 1) return res.status(400).send('Price cannot go below 1.');

    await Product.findByIdAndUpdate(product._id, { price: newPrice });
    await invalidateProductCaches(product);
    res.redirect('/seller/dashboard');
  } catch (error) {
    console.error('Error updating price:', error);
    res.status(500).send('Error updating price.');
  }
}

async function updateQuantity(req, res) {
  try {
    const change = parseInt(req.body.change, 10);
    if (isNaN(change)) return res.status(400).send('Invalid quantity change.');

    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).send('Product not found.');

    const newQty = product.quantity + change;
    if (newQty < 0) return res.status(400).send('Quantity cannot go below 0.');

    await Product.findByIdAndUpdate(product._id, { quantity: newQty });
    await invalidateProductCaches(product);
    res.redirect('/seller/dashboard');
  } catch (error) {
    console.error('Error updating quantity:', error);
    res.status(500).send('Error updating quantity.');
  }
}

function renderAddPage(req, res) {
  res.render("seller/productadd");
}

async function uploadProduct(req, res) {
  try {
    const { name, price, location, category, description, quantity } = req.body;
    if (!req.file || !name || !price || !location || !category || !description || !quantity) {
      return res.status(400).send("All fields including image are required");
    }

    const imageUrl = req.file.location;
    const product = await Product.create({
      name,
      price,
      image: imageUrl,
      description,
      quantity,
      location,
      category,
      seller: res.locals.user._id
    });

    await invalidateProductCaches(product);
    res.redirect("/seller/dashboard");
  } catch (error) {
    console.error("Product upload failed:", error);
    res.status(500).send("Internal Server Error");
  }
}



module.exports = {
  getDashboard,
  stopProduct,
  updatePrice,
  updateQuantity,
  renderAddPage,
  uploadProduct,
  getProductHeatmap
};
