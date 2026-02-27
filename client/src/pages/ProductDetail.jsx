import { useState, useEffect, useContext } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { AuthContext } from "../context/AuthContext";
import endpoints from "../api/endpoints";

const ProductDetail = () => {
    const { id } = useParams();
    const { user } = useContext(AuthContext);
    const [product, setProduct] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const res = await fetch(`${endpoints.products.detail}/${id}`, {
                    credentials: 'include'
                });
                const data = await res.json();

                if (data.success) {
                    setProduct(data.product);
                    setReviews(data.reviews || []);
                } else {
                    setError(data.error || "Product not found");
                }
            } catch (err) {
                setError("Error fetching product details");
            } finally {
                setLoading(false);
            }
        };

        fetchProduct();
    }, [id]);

    const navigate = useNavigate();

    const addToCart = async () => {
        try {
            if (!user) {
                return navigate("/login");
            }
            const res = await fetch(endpoints.cart.addToCart, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ productId: product._id }),
                credentials: "include"
            });
            const data = await res.json();
            if (data.success) {
                alert("Added to cart!");
            } else {
                alert(data.error);
            }
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) return <><Navbar /><div className="container">Loading...</div></>;
    if (error || !product) return <><Navbar /><div className="container">Error: {error}</div></>;

    return (
        <>
            <Navbar />
            <div className="container product-detail-container">
                <div className="detail-image-container">
                    <img src={product.image || "https://placehold.co/600x400"} alt={product.name} />
                </div>

                <div className="detail-info">
                    <div className="product-meta">
                        <span className="category-tag">{product.category}</span>
                        <span className="location-tag"> • {product.location}</span>
                    </div>

                    <h1>{product.name}</h1>
                    <div className="rating">
                        ⭐ {product.averageRating?.toFixed(1) || "No ratings"} ({reviews.length} reviews)
                    </div>

                    <div className="detail-price">₹{product.price.toLocaleString('en-IN')}</div>

                    <p className="detail-description">{product.description}</p>

                    <div className="action-buttons">
                        {product.quantity > 0 ? (
                            <button onClick={addToCart} className="btn-primary btn-lg">Add to Cart</button>
                        ) : (
                            <button disabled className="btn-primary btn-lg" style={{ opacity: 0.5 }}>Out of Stock</button>
                        )}
                    </div>

                    {/* Reviews Section - Simplified for this phase */}
                    <div className="reviews-section" style={{ marginTop: '3rem' }}>
                        <h3>Reviews</h3>
                        {reviews.length === 0 ? <p>No reviews yet.</p> : (
                            <ul className="reviews-list">
                                {reviews.map(r => (
                                    <li key={r._id} style={{ padding: '1rem 0', borderBottom: '1px solid #eee' }}>
                                        <strong>{r.user_id?.name || 'User'}</strong>: {r.comment} ({r.rating}⭐)
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default ProductDetail;
