import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { LocationProvider } from "./context/LocationContext";
import { CartProvider } from "./context/CartContext";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Home from "./pages/Home";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderSuccess from "./pages/OrderSuccess";
import SellerDashboard from "./pages/SellerDashboard";
import ProductHeatmap from "./pages/ProductHeatmap";
import RiderDashboard from "./pages/RiderDashboard";
import RiderOrderDetails from "./pages/RiderOrderDetails";
import MyOrders from "./pages/MyOrders";
import TrackOrder from "./pages/TrackOrder";
import SearchPage from "./pages/SearchPage";

function App() {
  return (
    <Router>
      <AuthProvider>
        <LocationProvider>
          <CartProvider>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/order-success" element={<OrderSuccess />} />
              <Route path="/seller/dashboard" element={<SellerDashboard />} />
              <Route path="/seller/heatmap" element={<ProductHeatmap />} />
              <Route path="/rider/dashboard" element={<RiderDashboard />} />
              <Route path="/rider/orders/:id" element={<RiderOrderDetails />} />
              <Route path="/orders" element={<MyOrders />} />
              <Route path="/track-order/:orderId" element={<TrackOrder />} />
            </Routes>
          </CartProvider>
        </LocationProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
