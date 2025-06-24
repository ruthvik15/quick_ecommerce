const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require("cookie-parser");
const path = require('path');
require("dotenv").config(); 
const User = require("./models/user");
const Cart=require("./models/cart")
const userrouter=require("./routes/user")
const riderrouter=require("./routes/rider")
const sellerRoutes = require('./routes/seller');
const checkoutroute=require("./routes/checkout")
const cartrouter=require("./routes/cart")
const productroute=require("./routes/product")
const { checkcookie } = require("./middleware/auth");
const redis = require("redis");
const app = express();
console.log("✅ DB URI:", process.env.MONGO_DB_URI);
mongoose.connect(process.env.MONGO_DB_URI).then((e)=>{console.log("connected")})

// Middleware
app.use(cookieParser());
app.use(checkcookie("token")); 
app.use(express.json());

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));


app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
// const redisClient = redis.createClient({
//    socket: {
//     host: "redis", // ✅ Use the service name, not 127.0.0.1
//     port: 6379
//   }
// });

// redisClient.connect().then(() => {
//   console.log("✅ Redis connected");
// }).catch((err) => {
//   console.error("❌ Redis Error:", err);
// });

app.use((req, res, next) => {
  let selectedLocation;
  
  // If logged in, give priority to user location
  if (req.user) {
    selectedLocation = req.user.location;
  } else if (req.cookies.selectedLocation) {
    selectedLocation = req.cookies.selectedLocation;
  } else {
    selectedLocation = "Hyderabad";
  }
  
  res.locals.selectedLocation = selectedLocation;
  next();
});
app.use(async (req, res, next) => {
  if (req.user && req.user.role === "user") {
    const cart = await Cart.findOne({ user: req.user._id });
    res.locals.cartItemCount = cart ? cart.items.length : 0;
  } else {
    res.locals.cartItemCount = 0;
  }
  next();
});
// Routes
app.use("/",userrouter)
app.use("/cart",cartrouter);
app.use("/rider",riderrouter);
app.use("/checkout",checkoutroute);
app.use('/seller', sellerRoutes); 
app.use("/product",productroute)


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
