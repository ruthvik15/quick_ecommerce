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
  if (!req.user || req.user.role !== 'seller') return res.status(401).json({ error: 'Unauthorized' });

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

    res.json({ success: true, user: req.user, products: dashboardProducts });
  } catch (error) {
    console.error('Error loading seller dashboard:', error);
    res.status(500).json({ error: 'Error loading dashboard.' });
  }
}

async function stopProduct(req, res) {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, { status: 'stopped' });
    if (product) await invalidateProductCaches(product);
    res.json({ success: true, message: "Product stopped" });
  } catch (error) {
    console.error('Error stopping product:', error);
    res.status(500).json({ error: 'Error stopping product.' });
  }
}

async function updatePrice(req, res) {
  try {
    const delta = parseFloat(req.body.change);
    if (isNaN(delta)) return res.status(400).json({ error: 'Invalid price change amount.' });

    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found.' });

    const newPrice = product.price + delta;
    if (newPrice < 1) return res.status(400).json({ error: 'Price cannot go below 1.' });

    await Product.findByIdAndUpdate(product._id, { price: newPrice });
    await invalidateProductCaches(product);
    res.json({ success: true, message: "Price updated" });
  } catch (error) {
    console.error('Error updating price:', error);
    res.status(500).json({ error: 'Error updating price.' });
  }
}

async function updateQuantity(req, res) {
  try {
    const change = parseInt(req.body.change, 10);
    if (isNaN(change)) return res.status(400).json({ error: 'Invalid quantity change.' });

    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found.' });

    const newQty = product.quantity + change;
    if (newQty < 0) return res.status(400).json({ error: 'Quantity cannot go below 0.' });

    await Product.findByIdAndUpdate(product._id, { quantity: newQty });
    await invalidateProductCaches(product);
    res.json({ success: true, message: "Quantity updated" });
  } catch (error) {
    console.error('Error updating quantity:', error);
    res.status(500).json({ error: 'Error updating quantity.' });
  }
}

function renderAddPage(req, res) {
  res.render("seller/productadd");
}

async function uploadProduct(req, res) {
  try {
    const { name, price, location, category, description, quantity } = req.body;
    if (!req.file || !name || !price || !location || !category || !description || !quantity) {
      return res.status(400).json({ error: "All fields including image are required" });
    }

    // Handle Cloudinary (path/secure_url), S3 (location), or Local (filename)
    const imageUrl = req.file.path || req.file.secure_url || req.file.location || `/uploads/${req.file.filename}`;

    const product = await Product.create({
      name,
      price,
      image: imageUrl,
      description,
      quantity,
      location,
      category,
      seller: req.user._id // Use req.user instead of res.locals.user
    });

    await invalidateProductCaches(product);
    res.json({ success: true, message: "Product created", product });
  } catch (error) {
    console.error("Product upload failed:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

async function getDashboardTrackSection(req,res){
  try {
    const {sellerId} = req.params;
    const orders = await Order.find({seller:sellerId})
    const totalRevenue = orders.reduce((total, order) => total + order.totalAmount, 0);
    const totalOrders = orders.length;
    // const averageOrderValue = totalRevenue / totalOrders;
    const totalProductsLive = await Product.countDocuments({seller:sellerId})
    const totalProductsStopped = await Product.countDocuments({seller:sellerId, status:'stopped'})
    const totalProducts = totalProductsLive + totalProductsStopped ;
    const totalProductsSold = await Product.countDocuments({seller:sellerId, status:'sold'})
    const activeProducts = totalProducts - totalProductsSold;
    res.json({success:true,
      orders,
      totalRevenue,
      totalOrders,
      totalProductsLive,
      totalProducts,
      totalProductsSold,
      activeProducts
    })
  } catch (error) {
    console.log("error fetching dashboard section tracking details");
    res.json({success:false,error:error})
  }
}

async function getProductHeatmap(req, res) {
  try {
    const { sellerId, productId } = req.params;

    // Check if the product belongs to the seller
    const product = await Product.findOne({ _id: productId, seller: sellerId });
    if (!product) return res.status(404).json({ error: "Product not found or not owned by seller" });

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000); // last 24 hours
    const BLOCK_SIZE = 0.1; // ~11 km block size

    // Aggregate orders by geographic blocks
    const ordersByBlock = await Order.aggregate([
      {
        $match: {
          product_id: new mongoose.Types.ObjectId(productId),
          createdAt: { $gte: oneDayAgo },
          status: { $in: ['confirmed', 'accepted', 'out-for-delivery', 'delivered'] }
        }
      },
      {
        $addFields: {
          latBlock: { $subtract: ["$lat", { $mod: ["$lat", BLOCK_SIZE] }] },
          lngBlock: { $subtract: ["$lng", { $mod: ["$lng", BLOCK_SIZE] }] }
        }
      },
      {
        $group: {
          _id: { latBlock: "$latBlock", lngBlock: "$lngBlock" },
          totalQuantity: { $sum: "$quantity" }
        }
      },
      { $sort: { totalQuantity: -1 } }
    ]);

    // Store aggregated data in a map for frontend
    const blockMap = {};
    ordersByBlock.forEach(block => {
      const key = `${block._id.latBlock.toFixed(1)}:${block._id.lngBlock.toFixed(1)}`;
      blockMap[key] = block.totalQuantity;
    });

    res.json({ success: true, product, blocks: blockMap });

  } catch (err) {
    console.error("Error fetching product heatmap:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
}



module.exports = {
  getDashboard,
  stopProduct,
  updatePrice,
  updateQuantity,
  renderAddPage,
  uploadProduct,
  getProductHeatmap,
  getDashboardTrackSection
};
