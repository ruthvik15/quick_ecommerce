const express = require('express');
const cookieParser = require("cookie-parser");
const path = require('path');

const User = require("./models/user");
const Cart = require("./models/cart")
const userrouter = require("./routes/user")
const riderrouter = require("./routes/rider")
const sellerRoutes = require('./routes/seller');
const checkoutroute = require("./routes/checkout")
const cartrouter = require("./routes/cart")
const productroute = require("./routes/product")
const { checkcookie } = require("./middleware/auth");
const app = express();
const cors = require('cors');
const { connectRedis } = require("./utils/redisClient");
const connectToMongoDb = require("./utils/dbConnection");
require("dotenv").config();

// Middleware

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // In development, allow any localhost port
    if (origin.startsWith('http://localhost:')) {
      return callback(null, true);
    }
    
    // In production, only allow the configured frontend URL
    if (origin === process.env.FRONTEND_URL) {
      return callback(null, true);
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(checkcookie("token"));

// Routes
app.use("/", userrouter)
app.use("/cart", cartrouter);
app.use("/rider", riderrouter);
app.use("/checkout", checkoutroute);
app.use('/seller', sellerRoutes);
app.use("/product", productroute)

require('./utils/locationsync');
const PORT = process.env.PORT || 3000;

startServer();
async function startServer() {
  try {
    await connectToMongoDb();
    await connectRedis();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server Startup Error:", error);
    process.exit(1);
  }
}