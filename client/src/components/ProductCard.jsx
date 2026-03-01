import { useState, useContext, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { CartContext } from "../context/CartContext";
import endpoints from "../api/endpoints";

const ProductCard = ({ product, initialQuantity = 0, onUpdateCart }) => {
    const { user } = useContext(AuthContext);
    const { cartItems, fetchCart } = useContext(CartContext);
    const navigate = useNavigate();

    // Prefer global context quantity if available, fallback to props/0
    const quantity = cartItems[product._id] !== undefined ? cartItems[product._id] : initialQuantity;
    const [loading, setLoading] = useState(false);

    const addToCart = async (e) => {
        e.preventDefault();
        if (!user) return navigate("/login");

        setLoading(true);
        try {
            const res = await fetch(endpoints.cart.addToCart, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ productId: product._id }),
                credentials: "include"
            });
            const data = await res.json();
            if (data.success) {
                fetchCart();
                if (onUpdateCart) onUpdateCart(product._id, 1);
            }
        } catch (err) {
            console.error("Cart error:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleIncrease = async (e) => {
        e.preventDefault();
        if (loading) return;
        setLoading(true);
        try {
            const res = await fetch(endpoints.cart.increaseQty, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ productId: product._id }),
                credentials: "include"
            });
            const data = await res.json();
            if (data.success) {
                fetchCart();
                if (onUpdateCart) onUpdateCart(product._id, quantity + 1);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDecrease = async (e) => {
        e.preventDefault();
        if (loading) return;
        setLoading(true);

        const targetUrl = quantity === 1 ? endpoints.cart.removeFromCart : endpoints.cart.decreaseQty;

        try {
            const res = await fetch(targetUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ productId: product._id }),
                credentials: "include"
            });
            const data = await res.json();
            if (data.success) {
                fetchCart();
                if (onUpdateCart) onUpdateCart(product._id, quantity - 1);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="product-card">
            <div className="product-image-container">
                {product.quantity <= 10 && product.quantity > 0 && (
                    <span className="badge-warning">Limited Stock</span>
                )}
                {product.quantity === 0 && (
                    <span className="badge-error">Out of Stock</span>
                )}
                <Link to={`/product/${product._id}`}>
                    <img src={product.image || "https://placehold.co/300x200"} alt={product.name} className="product-image" />
                </Link>
            </div>

            <div className="product-info">
                <div className="product-meta">
                    <span className="category-tag">{product.category}</span>
                    <span className="location-tag">{product.location}</span>
                </div>

                <Link to={`/product/${product._id}`} className="product-title-link">
                    <h3 className="product-title">{product.name}</h3>
                </Link>

                <p className="product-description">{product.description?.substring(0, 60)}...</p>

                <div className="product-footer" style={{ minHeight: '40px' }}>
                    <span className="product-price">₹{product.price.toLocaleString('en-IN')}</span>

                    {quantity > 0 ? (
                        <div className="quantity-control">
                            <button onClick={handleDecrease} className="btn-qty" disabled={loading}>-</button>
                            <span className="qty-value">{quantity}</span>
                            <button onClick={handleIncrease} className="btn-qty" disabled={loading || quantity >= product.quantity}>+</button>
                        </div>
                    ) : (
                        <button
                            className="btn-icon-cart"
                            onClick={addToCart}
                            disabled={product.quantity === 0 || loading}
                            title="Add to Cart"
                        >
                            <span className="icon">+</span>
                            <span className="text">Add to Cart</span>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductCard;
