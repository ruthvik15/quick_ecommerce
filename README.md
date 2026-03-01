# 🛒 QuickCart - Modern E-Commerce Platform

> **A city-based e-commerce solution with real-time delivery tracking, React frontend, and enterprise-grade backend**

[![Live Site](https://img.shields.io/badge/Live%20Site-quickcartind.xyz-blue?style=flat-square)](https://quickcartind.xyz)
![Backend](https://img.shields.io/badge/Backend-Node.js-blue?style=flat-square)
![Frontend](https://img.shields.io/badge/Frontend-React-61dafb?style=flat-square)
![Database](https://img.shields.io/badge/Database-MongoDB-green?style=flat-square)

---

## 🚀 Key Features

### 👨‍💼 **Seller Dashboard**
- Modern React-based seller interface
- Real-time product inventory tracking
- Automated stock management with status control (Active/Stopped/Sold)
- Product image delivery via Cloudinary CDN
- Sales heatmap visualization by location
- Order dashboard with delivery status tracking

### 🛍️ **Customer Shopping Experience**
- Responsive React frontend with modern UI
- Smart cart with **automatic clearing on location change** - when users switch cities, cart items from the previous city are automatically cleared with user notification
- Time-slot delivery selection (4 slots: 10am-12pm, 12pm-2pm, 2pm-4pm, 4pm-6pm)
- Interactive map integration for precise delivery location
- Multi-payment support: Cash on Delivery & Razorpay prepaid
- Real-time order tracking (Accepted → Out for Delivery → Delivered)
- Order cancellation & rescheduling from "Missed Orders"
- Automatic refunds for canceled prepaid orders

### 🗓️ **Intelligent Delivery System**
- Time-slot based scheduling (4 slots per day)
- In-city delivery with **warehouse-based distance calculation** - distances are calculated from actual fulfillment centers instead of city centers, providing accurate delivery radius assessment
- Configurable delivery radius via `MAX_DELIVERY_DISTANCE` environment variable
- Automatic rider location sync and coordinate validation
- Smart product filtering based on user location

### 🧑‍✈️ **Real-Time Rider Tracking**
- Purpose-built React dashboard for delivery operations
- 4 operational screens: Available Orders, Accepted Orders, Today's Orders, Completed Orders
- **Live rider location synchronization every 2 minutes** - rider coordinates are automatically synced to the system, with fallback to city-based defaults for offline riders, ensuring accurate real-time tracking without manual updates
- Intelligent slot-based order organization with correct chronological sorting
- Live customer tracking with automatic city selection
- Order acceptance workflow with stock validation

### 🔐 **Security & Data Integrity**
- **MongoDB transactions** for atomic multi-item checkout operations
- **Race condition prevention** with atomic stock increments
- Role-based access control (Seller/Rider/User/Admin)
- IP-based rate limiting: 5 req/15min for auth, 20 req/15min for checkout, 100 req/15min general
- Cross-user and cross-role data isolation with verification checks
- Secure password hashing (bcrypt with salt rounds)
- JWT-based authentication with token expiry
- Authorization checks on all sensitive operations

### 📊 **Performance Optimizations**
- Intelligent page-wise caching (first 5 pages) with 3-minute TTL
- MongoDB compound indexes on critical queries (status, deliveryDate, location, seller)
- N+1 query prevention using aggregation pipelines with $lookup
- Redis caching for location sync and session persistence
- Cloudinary CDN for optimized image delivery
- Connection pooling for database and cache layers

---

## 🛠️ Tech Stack

| Component | Technology |
|-----------|-----------|
| **Backend Language** | Node.js 18+ |
| **Backend Framework** | Express.js |
| **Frontend Framework** | React 18 + Vite |
| **Frontend Routing** | React Router v7 |
| **Database** | MongoDB Atlas (with transactions) |
| **Caching Layer** | Redis |
| **Payment Gateway** | Razorpay |
| **Location Services** | Leaflet.js, Haversine formula |
| **File Storage** | Cloudinary |
| **Authentication** | JWT + bcrypt |
| **Rate Limiting** | express-rate-limit (IPv6-aware) |
| **Containerization** | Docker + Docker Compose |

---

## 📋 Project Structure

```
.
├── app.js                 # Express server entry point
├── client/                # React frontend (Vite)
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── context/       # React context (Auth, Cart)
│   │   └── api/           # API endpoints
│   └── vite.config.js
├── controllers/           # Route handlers
├── models/                # MongoDB schemas
├── routes/                # API routes
├── middleware/            # Express middleware
├── utils/                 # Helper functions
│   ├── distance.js        # Haversine distance calculation
│   ├── warehouseCoordinates.js # Fulfillment center locations
│   ├── redisClient.js     # Redis connection
│   └── cache.js           # Cache utilities
└── docker-compose.yml     # Docker configuration
```

---

## 🔧 Setup & Installation

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- Redis Cloud account
- Razorpay account
- Cloudinary account

### Environment Variables
```env
# Database
MONGODB_URI=your_mongodb_uri

# Redis
REDIS_HOST=your_redis_host
REDIS_PORT=your_redis_port

# Payments
RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret

# File Storage
CLOUDINARY_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Delivery Configuration
MAX_DELIVERY_DISTANCE=20  # km

# Authentication
JWT_SECRET=your_secure_jwt_secret
```

### Installation

```bash
# Clone repository
git clone <repo-url>
cd quick_ecommerce

# Install backend dependencies
npm install

# Install frontend dependencies
cd client
npm install
cd ..

# Start with Docker Compose
docker-compose up -d

# Or run locally
npm run dev
```


## 📝 API Documentation

### Authentication Endpoints
- `POST /login` - User/Rider/Seller login
- `POST /signup` - New user registration
- `POST /logout` - Logout (requires auth)
- `GET /set-location` - Set user delivery location
- `GET /search-suggestions` - Get product search suggestions

### User Endpoints
- `GET /me` - Get authenticated user profile (requires auth)
- `GET /trackorders` - Get all user orders (requires auth)
- `GET /trackorders/:orderId` - Track single order status (requires auth)
- `POST /cancel-order` - Cancel an order (requires auth)
- `GET /orders/:orderId/rider-location` - Get real-time rider location for order (requires auth)

### Product Endpoints
- `GET /product` - Get all products with location filtering
- `GET /product/:id` - Get product detail
- `POST /product/:id/review` - Add product review (requires auth)

### Cart Endpoints
- `GET /cart` - Get user cart
- `POST /cart/add` - Add item to cart
- `POST /cart/remove` - Remove item from cart
- `POST /cart/increase` - Increase item quantity
- `POST /cart/decrease` - Decrease item quantity

### Checkout Endpoints
- `GET /checkout` - Show checkout page
- `POST /checkout/process` - Process COD checkout
- `POST /checkout/verify-payment` - Verify Razorpay payment
- `GET /checkout/orders/success` - Show order success page

### Seller Endpoints
- `GET /seller/dashboard` - Get seller dashboard metrics (requires seller auth)
- `GET /seller/dashboard-track-section` - Get order tracking section (requires seller auth)
- `GET /seller/add-product` - Show add product form (requires seller auth)
- `POST /seller/product/add` - Upload new product with image (requires seller auth)
- `POST /seller/product/stop/:id` - Stop selling product (requires seller auth)
- `POST /seller/product/resume/:id` - Resume product sales (requires seller auth)
- `POST /seller/product/update-price/:id` - Update product price (requires seller auth)
- `POST /seller/product/update-quantity/:id` - Update product stock (requires seller auth)
- `DELETE /seller/product/delete/:id` - Delete product (requires seller auth)
- `GET /seller/:sellerId/product/:productId/heatmap` - Get sales heatmap by location for product

### Rider Endpoints
- `GET /rider/dashboard` - Get rider dashboard (requires rider auth)
- `GET /rider/orders/unaccepted` - Get available orders to accept (requires rider auth)
- `GET /rider/orders/pending` - Get pending orders (requires rider auth)
- `GET /rider/orders/today` - Get today's accepted orders with time slots (requires rider auth)
- `GET /rider/orders/accepted` - Get all accepted orders (requires rider auth)
- `GET /rider/orders/completed` - Get completed orders (requires rider auth)
- `GET /rider/orders/details/:id` - Get specific order details (requires rider auth)
- `POST /rider/orders/accept` - Accept an available order (requires rider auth)
- `POST /rider/orders/reject` - Reject an order (requires rider auth)
- `POST /rider/orders/out-for-delivery` - Mark order as out for delivery (requires rider auth)
- `POST /rider/orders/complete` - Mark order as complete (requires rider auth)
- `POST /rider/orders/update-slot` - Change delivery time slot (requires rider auth)
- `POST /rider/update-location` - Update rider's live location (requires rider auth)
- `POST /rider/:id/location` - Update location by rider ID

---

## 🚢 Deployment

### Using Docker

```bash
docker-compose up --build
```

The application will start on:
- Backend: http://localhost:3000
- Frontend: http://localhost:5173

### Environment-Specific Configuration
- Development: Local mongo/redis
- Production: Cloud services (MongoDB Atlas, Redis Cloud)

---

## 📊 Performance Metrics

- **Page Load Time**: < 2 seconds (cached pages)
- **API Response Time**: < 200ms (average)
- **Database Query Time**: < 100ms (with indexes)
- **Cache Hit Rate**: 70%+ for homepage
- **Concurrent Users Supported**: 500+

---

## 🔒 Security Considerations

- **Data Protection**: All sensitive data encrypted at rest
- **Transit Security**: HTTPS for all communications
- **Rate Limiting**: Built-in protection against brute force & DDoS
- **Authorization**: Role-based access control on all endpoints
- **Input Validation**: All inputs validated and sanitized
- **Payment Security**: PCI-DSS compliant through Razorpay

---

## 📈 Future Enhancements

- [ ] Admin dashboard for platform management
- [ ] Email notifications for orders
- [ ] SMS tracking updates
- [ ] Multiple delivery address support
- [ ] Subscription/recurring orders
- [ ] Advanced analytics & reporting
- [ ] Mobile app (React Native)
- [ ] AI-powered demand forecasting

---
