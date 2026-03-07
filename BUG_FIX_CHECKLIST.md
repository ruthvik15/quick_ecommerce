# 🐛 BUG FIX CHECKLIST
Quick reference for tracking bug fixes

## 🔴 CRITICAL - FIX IMMEDIATELY

- [ ] **SECURITY-1:** Remove `.env` from git history and rotate ALL credentials
- [ ] **SECURITY-2:** Change JWT_SECRET to cryptographically secure random string
- [ ] **BUG-32:** Fix `getDashboardTrackSection` - Order model has no seller field
- [ ] **BUG-30:** Fix `markOrderOutForDelivery` - changes req.user.status instead of order status
- [ ] **BUG-41:** Add rider role verification to rider routes
- [ ] **BUG-39:** Add seller role verification to seller routes
- [ ] **BUG-1:** Change Product model seller reference from "User" to "Seller"

## 🟠 HIGH PRIORITY - THIS WEEK

### Security
- [ ] **SECURITY-3:** Add input validation middleware (express-validator)
- [ ] **SECURITY-4:** Add rate limiting (express-rate-limit)
- [ ] **SECURITY-5:** Add CSRF protection (csurf)
- [ ] **SECURITY-6:** Fix cookie settings for SPA architecture
- [ ] **SECURITY-7:** Add password strength validation

### Data Integrity
- [ ] **BUG-4:** Add "cancelled" to Order status enum
- [ ] **BUG-11:** Add MongoDB transaction to cancelOrder
- [ ] **BUG-19:** Add MongoDB transaction to checkout process
- [ ] **BUG-20:** Make checkout atomic - all items or none
- [ ] **BUG-10:** Fix trackOrders - don't mark accepted orders as missed

### Controller Bugs
- [ ] **BUG-13:** Fix populate in addToCart after save
- [ ] **BUG-14:** Validate product status and stock in addToCart
- [ ] **BUG-17:** Use seller coordinates instead of city center for distance
- [ ] **BUG-18:** Check product status in checkout
- [ ] **BUG-23:** Add authorization check for product reviews
- [ ] **BUG-34:** Add product ownership check in seller operations
- [ ] **BUG-46:** Replace hardcoded localhost with environment variable

## 🟡 MEDIUM PRIORITY - THIS MONTH

### Models
- [ ] **BUG-2:** Add "sold" to Product status enum OR remove from controller
- [ ] **BUG-3:** Standardize field naming (ph_number → phoneNumber)
- [ ] **BUG-5:** Clarify location vs lat/lng usage in Order model
- [ ] **BUG-6:** Make rider coordinates required OR make address optional
- [ ] **BUG-7:** Add unique compound index [user_id, product_id] to Review
- [ ] **WARN-4:** Add unique constraint to User phone field
- [ ] **WARN-5:** Add email validation regex to User model
- [ ] **WARN-6:** Change assignedSlots date from String to Date type
- [ ] **WARN-2:** Add validator for future delivery dates

### Controllers
- [ ] **BUG-8:** Fix TODO - don't send full user object (remove password)
- [ ] **BUG-9:** Remove or justify clearing selectedLocation cookie on login
- [ ] **BUG-12:** Add location filter to search or warn users
- [ ] **BUG-15:** Add pessimistic locking for cart quantity increases
- [ ] **BUG-16:** Add TTL or cleanup for old cart items
- [ ] **BUG-21:** Move distance limit to configuration
- [ ] **BUG-22:** Re-validate cart in verifyPayment
- [ ] **BUG-24:** Prevent duplicate reviews
- [ ] **BUG-25:** Add validation for review content
- [ ] **BUG-26:** Verify slot format consistency across codebase
- [ ] **BUG-27:** Add authorization to updateOrderSlot
- [ ] **BUG-28:** Change getUnacceptedOrders to return JSON
- [ ] **BUG-29:** Fix slot sorting in getPendingOrders
- [ ] **BUG-31:** Update no_of_orders on order completion, not dashboard load
- [ ] **BUG-33:** Add mongoose import to sellerController
- [ ] **BUG-35:** Fix invalidateProductCaches to handle pagination
- [ ] **BUG-36:** Verify seller role in uploadProduct
- [ ] **BUG-37:** Fix getDashboard sold count aggregation
- [ ] **BUG-40:** Fix dashboardTrackSection route to include sellerId param
- [ ] **BUG-47:** Fix trackOrderDetail endpoint in frontend

### Utilities & Middleware
- [ ] **BUG-38:** Improve token validation error handling
- [ ] **BUG-42:** Make validatetoken throw instead of returning null
- [ ] **BUG-43:** Add delCachePattern function for pattern-based deletion
- [ ] **BUG-44:** Add error recovery to locationsync cron
- [ ] **BUG-45:** Validate Razorpay environment variables on startup
- [ ] **BUG-48:** Fix user role check in CartContext
- [ ] **WARN-15:** Create requireRole(role) middleware
- [ ] **WARN-18:** Validate JWT_SECRET exists
- [ ] **WARN-19:** Add Redis reconnection logic
- [ ] **WARN-21:** Return cache error status to callers

### Improvements
- [ ] **WARN-1:** Choose single source of truth for soldCount
- [ ] **WARN-3:** Add TTL cleanup for Order.ignoredBy array
- [ ] **WARN-8:** Fix pagination cache invalidation
- [ ] **WARN-9:** Add location filter to search
- [ ] **WARN-10:** Clarify decreaseQuantity behavior at quantity=1
- [ ] **WARN-11:** Add rollback logic to COD checkout path
- [ ] **WARN-12:** Optimize average rating calculation
- [ ] **WARN-13:** Match location cache TTL with sync interval
- [ ] **WARN-14:** Check pending orders before stopping product
- [ ] **WARN-23:** Add file size limit to multer
- [ ] **WARN-24:** Add file type validation
- [ ] **WARN-27:** Add JWT token expiry handling in frontend
- [ ] **WARN-29:** Fix useEffect dependency in CartContext

## 🟢 LOW PRIORITY - TECHNICAL DEBT

### Architecture
- [ ] **ARCH-1:** Implement MongoDB transactions across critical operations
- [ ] **ARCH-2:** Extract business logic to service layer
- [ ] **ARCH-3:** Implement express-validator for all routes
- [ ] **ARCH-4:** Create centralized error handling middleware
- [ ] **ARCH-5:** Fix cache invalidation strategy
- [ ] **ARCH-6:** Add API versioning (/api/v1/)
- [ ] **ARCH-7:** Define API contract with DTOs
- [ ] **ARCH-8:** Create Request/Response DTOs
- [ ] **ARCH-9:** Implement event-driven architecture for notifications

### Performance
- [ ] **PERF-1:** Optimize N+1 queries with aggregation pipelines
- [ ] **PERF-2:** Add database indexes (Order.status+deliveryDate, Product.name, Cart.user)
- [ ] **PERF-3:** Review cache key strategy
- [ ] **PERF-4:** Ensure CDN usage for images
- [ ] **PERF-5:** Cache seller dashboard aggregations
- [ ] **PERF-6:** Configure MongoDB connection pooling
- [ ] **PERF-7:** Implement circuit breaker for Redis

### Infrastructure
- [ ] **INFRA-1:** Implement logging system (Winston/Pino)
- [ ] **INFRA-2:** Add monitoring/APM (New Relic/DataDog)
- [ ] **INFRA-3:** Add automated tests (Jest + Supertest)
- [ ] **INFRA-4:** Create API documentation (Swagger)
- [ ] **INFRA-5:** Add health check endpoints (/health, /ready)
- [ ] **INFRA-6:** Implement graceful shutdown
- [ ] **INFRA-7:** Add request ID tracing
- [ ] **INFRA-8:** Set up async job queue (Bull)
- [ ] **INFRA-9:** Integrate email service (SendGrid)
- [ ] **INFRA-10:** Build admin panel
- [ ] **INFRA-11:** Implement soft deletes
- [ ] **INFRA-12:** Add audit trail logging
- [ ] **INFRA-13:** Document backup/restore strategy
- [ ] **INFRA-14:** Set up CI/CD pipeline

### Code Quality
- [ ] **QUALITY-1:** Add TypeScript
- [ ] **QUALITY-2:** Add ESLint rules
- [ ] **QUALITY-3:** Add Prettier formatting
- [ ] **QUALITY-4:** Remove commented code in fileUploader.js
- [ ] **QUALITY-5:** Add PropTypes or TypeScript to React components
- [ ] **QUALITY-6:** Add error boundaries in React
- [ ] **QUALITY-7:** Improve error messages consistency
- [ ] **QUALITY-8:** Add accessibility features (a11y)

---

## 📊 PROGRESS TRACKER

**Total Issues:** 95 (47 bugs + 29 warnings + 19 architecture/infra)

### By Priority:
- 🔴 Critical: 7 issues (0% complete)
- 🟠 High: 18 issues (0% complete)
- 🟡 Medium: 43 issues (0% complete)
- 🟢 Low: 27 issues (0% complete)

### By Category:
- Security: 7 issues
- Models: 10 issues
- Controllers: 35 issues
- Routes/Middleware: 5 issues
- Utilities: 8 issues
- Frontend: 5 issues
- Architecture: 9 issues
- Performance: 7 issues
- Infrastructure: 14 issues

---

## 🎯 WEEKLY SPRINT SUGGESTIONS

### Week 1: Security & Critical Bugs
- All 🔴 Critical items
- Security items from 🟠 High priority

### Week 2: Data Integrity & Core Features
- Transaction implementation
- Model fixes
- Critical controller bugs

### Week 3: Authorization & Validation
- Role-based access control
- Input validation middleware
- Authorization checks

### Week 4: Medium Priority Controllers
- Fix remaining controller bugs
- Optimize queries
- Improve error handling

### Weeks 5-8: Technical Debt
- Add tests
- Implement monitoring
- Performance optimizations
- Documentation

---

**Last Updated:** February 27, 2026
**Status:** Initial assessment complete, fixes not started
