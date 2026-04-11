const express = require('express');
const cookieParser = require("cookie-parser");
const path = require('path');
const rateLimit = require('express-rate-limit');

// DB models fully migrated to PostgreSQL — no Mongoose model imports needed
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
const { connectPgDB } = require("./utils/dbConnection");
require("dotenv").config();

// Middleware

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    
    if (origin.startsWith('http://localhost:')) {
      return callback(null, true);
    }
    
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

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // 15 requests per windowMs
  message: 'Too many login/signup attempts, please try again in 15 minutes',
  standardHeaders: true, 
  legacyHeaders: false,
  skipSuccessfulRequests: false 
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // 500 requests per windowMs
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false
});

const checkoutLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5000, // 50 requests per windowMs
  message: 'Too many checkout attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false
});

app.use(generalLimiter);

app.use(checkcookie("token"));

// Routes
app.use("/", authLimiter, userrouter)
app.use("/cart", cartrouter);
app.use("/rider", riderrouter);

app.use("/checkout", checkoutLimiter, checkoutroute);
app.use('/seller', sellerRoutes);
app.use("/product", productroute)

require('./utils/locationsync');

const PORT = process.env.PORT || 3000;

startServer();
async function startServer() {
  try {
    await Promise.all([
      connectPgDB(),
      connectRedis()
    ]);
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server Startup Error:", error);
    process.exit(1);
  }
}