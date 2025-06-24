const{Router}=require("express")
const router=Router();
const path = require("path");
const multer = require("multer");
const User =require("../models/user")
const Product = require("../models/product");
const Rider=require("../models/rider")
const Cart =require("../models/cart");
const cityCoords = require("../utils/cityCoordinates");
const getDistanceKm = require("../utils/distance");


const Order = require("../models/order");

router.get("/", async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id }).populate("items.product");
  res.render("cart", { user: req.user, cart });
});
router.post("/remove", async (req, res) => {
  const { productId } = req.body;
  const cart = await Cart.findOne({ user: req.user._id });
  cart.items = cart.items.filter(item => item.product.toString() !== productId);
  await cart.save();
  res.redirect("/cart");
});

router.post("/add", async (req, res) => {
  try {
    if(!req.user) return  res.redirect("/login");
    const userId = req.user._id; 
    const { productId, returnTo } = req.body;


    if (!productId) return res.status(400).send("Product ID is required");

    let cart = await Cart.findOne({ user: userId });

    if (!cart) {
      // New cart for user
      cart = await Cart.create({
        user: userId,
        items: [{ product: productId, quantity: 1 }]
      });
    } else {
      const itemIndex = cart.items.findIndex(item => item.product.toString() === productId);

      if (itemIndex >= 0) {
        cart.items[itemIndex].quantity += 1;
      } else {
        cart.items.push({ product: productId, quantity: 1 });
      }

      await cart.save();
    }
  
      return res.redirect(returnTo || "/");

  } catch (err) {
    console.error("Error adding to cart:", err);
    res.status(500).send("Server error");
  }
});


router.post("/increase", async (req, res) => {
  const { productId } = req.body;
  const cart = await Cart.findOne({ user: req.user._id }).populate("items.product");
  const item = cart.items.find(i => i.product._id.toString() === productId);
  if (item && item.quantity < item.product.quantity) {
    item.quantity++;
    await cart.save();
  }
  res.redirect("/cart");
});

router.post("/decrease", async (req, res) => {
  const { productId } = req.body;
  const cart = await Cart.findOne({ user: req.user._id });
  const item = cart.items.find(i => i.product.toString() === productId);
  if (item && item.quantity > 1) {
    item.quantity--;
    await cart.save();
  }
  res.redirect("/cart");
});

module.exports=router;