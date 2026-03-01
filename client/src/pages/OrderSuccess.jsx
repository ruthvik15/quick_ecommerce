import { Link, useNavigate, useLocation } from "react-router-dom";
import { useContext, useEffect } from "react";
import Navbar from "../components/Navbar";
import { CartContext } from "../context/CartContext";
import { AuthContext } from "../context/AuthContext";

const OrderSuccess = () => {
    const { fetchCart } = useContext(CartContext);
    const { user, loading } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();

    // Protect route - only accessible after successful checkout or if logged in
    useEffect(() => {
        if (loading) return;
        
        // If not logged in, redirect to login
        if (!user) {
            navigate("/login");
            return;
        }
        
        // Restrict riders and sellers
        if (user.role === 'rider') {
            navigate('/rider/dashboard');
            return;
        }
        if (user.role === 'seller') {
            navigate('/seller/dashboard');
            return;
        }
        
        // If accessed directly (not from checkout), redirect to home
        if (!location.state?.fromCheckout) {
            navigate("/");
            return;
        }
    }, [user, loading, location, navigate]);

    // Refresh cart after successful order (backend clears cart)
    useEffect(() => {
        if (user) {
            fetchCart();
        }
    }, [fetchCart, user]);

    return (
        <>
            <Navbar />
            <div className="container text-center" style={{ padding: '4rem 0' }}>
                <div style={{ color: '#10b981', fontSize: '4rem', marginBottom: '1rem' }}>
                    ✔
                </div>
                <h1>Order Placed Successfully!</h1>
                <p>Thank you for your purchase. Your order has been confirmed.</p>
                <div style={{ marginTop: '2rem' }}>
                    <Link to="/" className="btn-primary">Continue Shopping</Link>
                </div>
            </div>
        </>
    );
};

export default OrderSuccess;
