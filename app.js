const express = require('express');
const cookieParser = require("cookie-parser");
const path = require('path');
const rateLimit = require('express-rate-limit');

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

// ===== RATE LIMITING MIDDLEWARE =====
// BUG #4 FIX: Implement express-rate-limit to prevent brute force & DDoS attacks

// Strict rate limit for authentication endpoints (login, signup)
// 15 requests per 15 minutes per IP to prevent brute force attacks
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // 15 requests per windowMs
  message: 'Too many login/signup attempts, please try again in 15 minutes',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skipSuccessfulRequests: false // Count successful responses
  // Note: Using default keyGenerator which properly handles IPv6 addresses
});

// General rate limit for all API endpoints
// 500 requests per 15 minutes per IP (allows normal browsing without throttling)
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5000, // 500 requests per windowMs
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false
  // Uses default IPv6-aware keyGenerator
});

// Stricter limit for checkout endpoints to prevent abuse
// 50 requests per 15 minutes per IP
const checkoutLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // 50 requests per windowMs
  message: 'Too many checkout attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false
  // Uses default IPv6-aware keyGenerator
});

// Apply general rate limiter to all routes
app.use(generalLimiter);

app.use(checkcookie("token"));

// Routes
// Apply stricter auth limiter to user routes (login/signup endpoints)
app.use("/", authLimiter, userrouter)
app.use("/cart", cartrouter);
app.use("/rider", riderrouter);
// Apply stricter checkout limiter to prevent checkout abuse
app.use("/checkout", checkoutLimiter, checkoutroute);
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