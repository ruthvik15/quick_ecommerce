import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Home from "./pages/Home";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderSuccess from "./pages/OrderSuccess";
import SellerDashboard from "./pages/SellerDashboard";
import RiderDashboard from "./pages/RiderDashboard";
import MyOrders from "./pages/MyOrders";
import SearchPage from "./pages/SearchPage";

function App() {
  return (
    <Router>
      <AuthProvider>
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
          <Route path="/rider/dashboard" element={<RiderDashboard />} />
          <Route path="/orders" element={<MyOrders />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
