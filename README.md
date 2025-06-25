<h1 align="center">🛒 QuickCart</h1>

<p align="center">
  <b>Your Instant City-Based E-Commerce Solution</b><br/>
  Fast. Reliable. Time-Slot Based Delivery.

</p>

<p align="center">
  <a href="https://quickcartind.xyz"><img src="https://img.shields.io/badge/Live Site-quickcartind.xyz-blue?style=flat-square" /></a>
  <img src="https://img.shields.io/badge/Made_with-Node.js-blue?style=flat-square" />
  <img src="https://img.shields.io/badge/Database-MongoDB-green?style=flat-square" />
</p>

---

## 🚀 Features

### 👨‍💼 Seller Panel
- Login/Register to start selling
- Track available/left products
- Stop selling when out of stock
- Product image storage via **AWS S3**

### 🛍️ User Panel
- Add products to cart
- Choose delivery date and time slot
- Change delivery location (Leaflet map)
- Checkout with **Razorpay** payment integration
- Track order: `Accepted`, `Out for delivery`, `Delivered`, `Cancelled`
- Cancel if no rider has accepted
- Missed Orders section to reschedule or cancel
- Razorpay refund triggered for prepaid canceled orders

### 🗓️ Unique Delivery Feature
- Select **delivery date and time slot**
- Designed for **In city deliveries**

### 🧑‍✈️ Rider Panel
- 4 Screens:
  - Accepted Orders
  - Order Requests
  - Today’s Orders (with Live Tracking)
  - Completed Orders
- Rider location updates every **2 minutes**
- Redis cache stores temporary data for **30 mins** before DB update

---

## 🛠️ Tech Stack

| Layer        | Tech                                                                 |
|--------------|----------------------------------------------------------------------|
| Backend      | Node.js, Express.js                                                  |
| Frontend     | EJS, HTML, CSS, JavaScript                                           |
| Database     | MongoDB Atlas                                                        |
| Caching      | Redis (Cloud)                                                        |
| Payments     | Razorpay                                                             |
| Maps         | Leaflet.js                                                           |
| File Storage | AWS S3                                                               |
| Deployment   | Docker, AWS Beanstalk                                                |

---


