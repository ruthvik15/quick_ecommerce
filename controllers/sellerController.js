const sellerRepository = require("../repositories/sellerRepository");
const { delCache, delCachePattern } = require("../utils/cache");

async function invalidateProductCaches(product) {
  const location = product.location.toLowerCase();
  const productCategory = (product.category || "").toLowerCase();
  const sorts = ["default", "low-high", "high-low", "newest"];
  const maxCachedPages = 5;
  const limit = 20;

  for (const sort of sorts) {
    for (let page = 1; page <= maxCachedPages; page++) {
      const allKey = `products:${location}:all:${sort}:page:${page}:${limit}`;
      await delCache(allKey);
      console.log(`🗑️  Cleared: ${allKey}`);
    }
    for (let page = 1; page <= maxCachedPages; page++) {
      const catKey = `products:${location}:${productCategory}:${sort}:page:${page}:${limit}`;
      await delCache(catKey);
    }
  }
}

async function invalidateSearchCaches(location) {
  const pattern = `search:${location.toLowerCase()}:*`;
  const count = await delCachePattern(pattern);
 }

async function getDashboard(req, res) {
  if (!req.user || req.user.role !== "seller") {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const sellerId = req.user.id;

    // All products for this seller
    const products = await sellerRepository.getProductsBySeller(sellerId);

    if (products.length === 0) {
      return res.json({ success: true, user: req.user, products: [] });
    }

    const productIds = products.map((p) => p.id);

    // Aggregate sold counts only for this seller's products
    const soldRows = await sellerRepository.getSoldCountsByProducts(productIds);

    const soldMap = {};
    soldRows.forEach((r) => {
      soldMap[r.product_id] = parseInt(r.total_sold);
    });

    const dashboardProducts = products.map((product) => {
      const sold = soldMap[product.id] || 0;
      return {
        id: product.id,
        name: product.name,
        image: product.image,
        price: product.price,
        quantity: product.quantity,
        sold,
        remaining: product.quantity - sold,
        status: product.status || "live",
      };
    });

    res.json({ success: true, user: req.user, products: dashboardProducts });
  } catch (error) {
    console.error("Error loading seller dashboard:", error);
    res.status(500).json({ error: "Error loading dashboard." });
  }
}

async function stopProduct(req, res) {
  try {
    const product = await sellerRepository.updateProductStatus(req.params.id, req.user.id, 'stopped');

    if (!product) {
      return res.status(403).json({ error: "Product not found or unauthorized." });
    }

    await invalidateProductCaches(product);
    await invalidateSearchCaches(product.location);

    res.json({ success: true, message: "Product stopped" });
  } catch (error) {
    console.error("Error stopping product:", error);
    res.status(500).json({ error: "Error stopping product." });
  }
}

async function resumeProduct(req, res) {
  try {
    const product = await sellerRepository.updateProductStatus(req.params.id, req.user.id, 'live');

    if (!product) {
      return res.status(403).json({ error: "Product not found or unauthorized." });
    }

    await invalidateProductCaches(product);
    await invalidateSearchCaches(product.location);

    res.json({ success: true, message: "Product is now live" });
  } catch (error) {
    console.error("Error resuming product:", error);
    res.status(500).json({ error: "Error resuming product." });
  }
}

async function updatePrice(req, res) {
  try {
    const delta = parseFloat(req.body.change);
    if (isNaN(delta)) return res.status(400).json({ error: "Invalid price change amount." });

    const product = await sellerRepository.getProductByIdAndSeller(req.params.id, req.user.id);
    if (!product) {
      return res.status(403).json({ error: "Product not found or unauthorized." });
    }

    const newPrice = product.price + delta;
    if (newPrice < 1) return res.status(400).json({ error: "Price cannot go below 1." });

    await sellerRepository.updateProductPrice(product.id, newPrice);

    await invalidateProductCaches(product);
    await invalidateSearchCaches(product.location);
    res.json({ success: true, message: "Price updated" });
  } catch (error) {
    console.error("Error updating price:", error);
    res.status(500).json({ error: "Error updating price." });
  }
}

async function updateQuantity(req, res) {
  try {
    const change = parseInt(req.body.change, 10);
    if (isNaN(change)) return res.status(400).json({ error: "Invalid quantity change." });

    const product = await sellerRepository.getProductByIdAndSeller(req.params.id, req.user.id);
    if (!product) {
      return res.status(403).json({ error: "Product not found or unauthorized." });
    }

    const newQty = product.quantity + change;
    if (newQty < 0) return res.status(400).json({ error: "Quantity cannot go below 0." });

    await sellerRepository.updateProductQuantity(product.id, newQty);

    await invalidateProductCaches(product);
    await invalidateSearchCaches(product.location);
    res.json({ success: true, message: "Quantity updated" });
  } catch (error) {
    console.error("Error updating quantity:", error);
    res.status(500).json({ error: "Error updating quantity." });
  }
}

function renderAddPage(req, res) {
  res.render("seller/productadd");
}

async function uploadProduct(req, res) {
  try {
    if (!req.user || req.user.role !== "seller") {
      return res.status(403).json({ error: "Unauthorized: Only sellers can upload products" });
    }

    const { name, price, location, category, description, quantity } = req.body;
    if (!req.file || !name || !price || !location || !category || !description || !quantity) {
      return res.status(400).json({ error: "All fields including image are required" });
    }

    // Handle Cloudinary / S3 / local upload paths
    const imageUrl =
      req.file.path ||
      req.file.secure_url ||
      req.file.location ||
      `/uploads/${req.file.filename}`;

    const product = await sellerRepository.insertProduct(
      name, price, imageUrl, description, quantity, location, category, req.user.id
    );

    await invalidateProductCaches(product);
    await invalidateSearchCaches(product.location);

    res.json({ success: true, message: "Product created", product });
  } catch (error) {
    console.error("Product upload failed:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

async function getDashboardTrackSection(req, res) {
  try {
    const sellerId = req.user.id;

    const productIds = await sellerRepository.getProductIdsBySeller(sellerId);

    if (productIds.length === 0) {
      return res.json({
        success: true,
        trackSection: {
          orders: [],
          totalRevenue: 0,
          totalOrders: 0,
          totalProductsLive: 0,
          totalProducts: 0,
          totalProductsSold: 0,
          activeProducts: 0,
        },
      });
    }

    const orders = await sellerRepository.getOrderRevenueAndItemsForProducts(productIds);

    const totalRevenue = orders.reduce((sum, o) => sum + parseFloat(o.seller_order_revenue || 0), 0);
    const totalOrders = orders.length;

    const countResult = await sellerRepository.getCountLiveAndStoppedProducts(sellerId);
    const totalProductsLive = parseInt(countResult.live_count);
    const totalProducts = totalProductsLive + parseInt(countResult.stopped_count);

    const totalProductsSold = await sellerRepository.getTotalSoldForProducts(productIds);

    res.json({
      success: true,
      trackSection: {
        orders,
        totalRevenue,
        totalOrders,
        totalProductsLive,
        totalProducts,
        totalProductsSold,
        activeProducts: totalProductsLive,
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard section tracking details:", error);
    res.status(500).json({ success: false, error: error.message });
  }
}

async function getProductHeatmap(req, res) {
  try {
    const { sellerId, productId } = req.params;

    const product = await sellerRepository.getProductByIdAndSeller(productId, sellerId);
    if (!product) {
      return res.status(404).json({ error: "Product not found or not owned by seller" });
    }

    const BLOCK_SIZE = 0.1; // ~11 km blocks
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const heatmapRows = await sellerRepository.getProductHeatmapDb(productId, oneDayAgo, BLOCK_SIZE);

    const blockMap = {};
    heatmapRows.forEach((row) => {
      const key = `${parseFloat(row.lat_block).toFixed(1)}:${parseFloat(row.lng_block).toFixed(1)}`;
      blockMap[key] = parseInt(row.total_quantity);
    });

    res.json({ success: true, product, blocks: blockMap });
  } catch (err) {
    console.error("Error fetching product heatmap:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
}

async function deleteProduct(req, res) {
  try {
    const product = await sellerRepository.getProductById(req.params.id);

    if (!product) {
      return res.status(404).json({ error: "Product not found." });
    }

    if (product.seller_id !== req.user.id) {
      return res.status(403).json({ error: "Not authorized to delete this product." });
    }

    await sellerRepository.deleteProductById(req.params.id);

    await invalidateProductCaches(product);
    await invalidateSearchCaches(product.location);

    res.json({ success: true, message: "Product deleted successfully" });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ error: "Error deleting product." });
  }
}

module.exports = {
  getDashboard,
  stopProduct,
  resumeProduct,
  updatePrice,
  updateQuantity,
  renderAddPage,
  uploadProduct,
  deleteProduct,
  getProductHeatmap,
  getDashboardTrackSection,
};
