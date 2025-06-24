const express = require('express');
const router = express.Router();
const Product = require('../models/product'); // adjust path
const Order = require('../models/order');
const path = require("path");
const multer = require("multer");
const upload = require("../utils/s3Uploader");
// ✅ Seller Dashboard
router.get('/dashboard', async (req, res) => {
  if (!req.user || req.user.role !== 'seller') return res.redirect('/signin');

  try {
    const products = await Product.find({ seller: req.user._id });
    console.log(products)

    // Get total sold per product
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

    res.render('seller-dashboard', { user: req.user, products: dashboardProducts });
  } catch (error) {
    console.error('Error loading seller dashboard:', error);
    res.status(500).send('Error loading dashboard.');
  }
});

// ✅ Stop Selling
router.post('/product/:id/stop', async (req, res) => {
  try {
    await Product.findByIdAndUpdate(req.params.id, { status: 'stopped' });
    res.redirect('/seller/dashboard');
  } catch (error) {
    console.error('Error stopping product:', error);
    res.status(500).send('Error stopping product.');
  }
});

// ✅ Increase or decrease price
// ✅ Increase or decrease price by user-provided amount
router.post('/product/:id/price', async (req, res) => {
  try {
    const { change } = req.body; // a number like 50 or -50
    const delta = parseFloat(change); // parse to number

    if (isNaN(delta)) {
      return res.status(400).send('Invalid price change amount.');
    }

    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).send('Product not found.');

    const newPrice = product.price + delta;
    if (newPrice < 1) {
      return res.status(400).send('Price cannot go below 1.');
    }

    await Product.findByIdAndUpdate(product._id, { price: newPrice });
    res.redirect('/seller/dashboard');
  } catch (error) {
    console.error('Error updating price:', error);
    res.status(500).send('Error updating price.');
  }
});
// ✅ Increase or decrease stock by user-provided amount
router.post('/product/:id/quantity', async (req, res) => {
  try {
    const change = parseInt(req.body.change, 10); // can be +5 or -3
    if (isNaN(change)) {
      return res.status(400).send('Invalid quantity change.');
    }

    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).send('Product not found.');

    const newQty = product.quantity + change;
    if (newQty < 0) {
      return res.status(400).send('Quantity cannot go below 0.');
    }

    await Product.findByIdAndUpdate(product._id, { quantity: newQty });
    res.redirect('/seller/dashboard');
  } catch (error) {
    console.error('Error updating quantity:', error);
    res.status(500).send('Error updating quantity.');
  }
});
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, path.resolve("./public/uploads"))
//   },
//   filename: function (req, file, cb) {
//     const filename = `${Date.now()}-${file.originalname}`
//     cb(null,filename)
//   }
// })

// const upload = multer({ storage: storage })

// router.get("/add-product",(req,res)=>res.render("productadd"));

// router.post("/productadd", upload.single("image"), async (req, res) => {
//   try {
//     const { name, price, location, category, description, quantity } = req.body;

//     if (!name || !price || !location || !category || !description || !quantity) {
//       return res.status(400).send("All fields are required");
//     }

//     const product = await Product.create({
//       name,
//       price,
//       image: `/uploads/${req.file.filename}`,
//       description,
//       quantity,
//       location,
//       category,
//       seller: res.locals.user._id // assuming logged-in user
//     });

//     await product.save();
//     console.log(product);
//     res.redirect("/seller/dashboard");
//   } catch (error) {
//     console.error("Product upload failed:", error);
//     res.status(500).send("Internal Server Error");
//   }
// });
router.get("/add-product", (req, res) => res.render("productadd"));

// Upload product with image to S3
router.post("/productadd", upload.single("image"), async (req, res) => {
  try {
    const { name, price, location, category, description, quantity } = req.body;

    if (!req.file || !name || !price || !location || !category || !description || !quantity) {
      return res.status(400).send("All fields including image are required");
    }

    const imageUrl = req.file.location; // S3 public URL

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

    res.redirect("/seller/dashboard");
  } catch (error) {
    console.error("Product upload failed:", error);
    res.status(500).send("Internal Server Error");
  }
});

module.exports = router;
