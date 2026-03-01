import { useState, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { AuthContext } from "../context/AuthContext";
import { CartContext } from "../context/CartContext";
import endpoints from "../api/endpoints";

const Cart = () => {
    const { user, loading: authLoading } = useContext(AuthContext);
    const { fetchCart: fetchGlobalCart } = useContext(CartContext);
    const [cart, setCart] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const fetchCart = async () => {
        try {
            const res = await fetch(endpoints.cart.getCart, {
                credentials: "include"
            });
            const data = await res.json();
            if (data.success) {
                setCart(data.cart);
            } else if (data.error === "Unauthorized") {
                navigate("/login");
            }
        } catch (err) {
            console.error("Error fetching cart", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            navigate("/login");
            return;
        }
        if (user.role === 'rider') {
            navigate('/rider/dashboard');
            return;
        }
        if (user.role === 'seller') {
            navigate('/seller/dashboard');
            return;
        }
        fetchCart();
    }, [user, authLoading, navigate]);

    const updateQuantity = async (productId, action) => {
        try {
            const url = action === "increase" ? endpoints.cart.increaseQty : endpoints.cart.decreaseQty;
            const res = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ productId }),
                credentials: "include"
            });
            const data = await res.json();
            if (data.success) {
                setCart(data.cart);
                fetchGlobalCart(); // Sync navbar badge
            }
        } catch (err) {
            console.error("Error updating quantity", err);
        }
    };

    const removeItem = async (productId) => {
        try {
            const res = await fetch(endpoints.cart.removeFromCart, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ productId }),
                credentials: "include"
            });
            const data = await res.json();
            if (data.success) {
                setCart(data.cart);
                fetchGlobalCart(); // Sync navbar badge
            }
        } catch (err) {
            console.error("Error removing item", err);
        }
    }

    if (loading || authLoading) return <><Navbar /><div className="container">Loading cart...</div></>;

    return (
        <>
            <Navbar />
            <div className="container cart-page">
                <h1>Your Cart</h1>
                {!cart || cart.items.length === 0 ? (
                    <div className="empty-cart">
                        <p>Your cart is empty.</p>
                        <Link to="/" className="btn-primary">Find Products</Link>
                    </div>
                ) : (
                    <div className="cart-content">
                        <div className="cart-items">
                            {cart.items.map((item) => (
                                <div key={item._id} className="cart-item">
                                    <img src={item.product.image || "https://placehold.co/100"} alt={item.product.name} className="cart-item-img" />
                                    <div className="cart-item-details">
                                        <h3>{item.product.name}</h3>
                                        <p>₹{item.product.price} x {item.quantity}</p>
                                        <p className="subtotal">Subtotal: ₹{item.product.price * item.quantity}</p>
                                    </div>
                                    <div className="cart-actions">
                                        <button onClick={() => updateQuantity(item.product._id, "decrease")} disabled={item.quantity <= 1}>-</button>
                                        <span>{item.quantity}</span>
                                        <button onClick={() => updateQuantity(item.product._id, "increase")}>+</button>
                                        <button onClick={() => removeItem(item.product._id)} className="btn-remove">Remove</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="cart-summary">
                            <h2>Summary</h2>
                            <div className="summary-row">
                                <span>Total Items:</span>
                                <span>{cart.items.reduce((acc, item) => acc + item.quantity, 0)}</span>
                            </div>
                            <div className="summary-row total">
                                <span>Total Amount:</span>
                                <span>₹{cart.items.reduce((acc, item) => acc + (item.product.price * item.quantity), 0)}</span>
                            </div>
                            <Link to="/checkout" className="btn-checkout">Proceed to Checkout</Link>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default Cart;
