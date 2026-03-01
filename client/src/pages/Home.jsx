import { useState, useEffect, useContext } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import Navbar from "../components/Navbar";
import endpoints from "../api/endpoints";
import { AuthContext } from "../context/AuthContext";
import { LocationContext } from "../context/LocationContext";

const Home = () => {
    const { user } = useContext(AuthContext);
    const { selectedLocation } = useContext(LocationContext);
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [cartItems, setCartItems] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [hasNextPage, setHasNextPage] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);

    const location = useLocation();

    // Redirect riders and sellers to their dashboards
    useEffect(() => {
        if (user) {
            if (user.role === 'rider') {
                navigate('/rider/dashboard');
            } else if (user.role === 'seller') {
                navigate('/seller/dashboard');
            }
        }
    }, [user, navigate]);

    // Fetch cart to sync quantities
    const fetchCart = async () => {
        if (!user) return;
        try {
            const res = await fetch(endpoints.cart.getCart, { credentials: 'include' });
            const data = await res.json();
            if (data.success && data.cart) {
                const itemsMap = {};
                data.cart.items.forEach(item => {
                    itemsMap[item.product._id] = item.quantity;
                });
                setCartItems(itemsMap);
            }
        } catch (err) {
            console.error("Failed to sync cart", err);
        }
    };

    useEffect(() => {
        if (user) fetchCart();
    }, [user]);

    const fetchProducts = async (pageNum = 1, append = false) => {
        // Only proceed if location is selected
        if (!selectedLocation) return;

        if (append) {
            setLoadingMore(true);
        } else {
            setLoading(true);
        }

        try {
            const searchParams = new URLSearchParams(location.search);
            searchParams.set('page', pageNum);
            searchParams.set('location', selectedLocation); // FIXED: Add location to query

            const res = await fetch(`${endpoints.products.base}/?${searchParams.toString()}`, {
                credentials: 'include'
            });
            const data = await res.json();

            if (data.success) {
                if (append) {
                    setProducts(prev => [...prev, ...(data.products || [])]);
                } else {
                    setProducts(data.products || []);
                }
                setHasNextPage(data.pagination?.hasNextPage || false);
            } else {
                setError("Failed to load products");
            }
        } catch (err) {
            console.error(err);
            setError("Error connecting to server");
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    // FIXED: Re-fetch when location changes
    useEffect(() => {
        if (selectedLocation) {
            setPage(1);
            fetchProducts(1, false);
        }
    }, [selectedLocation, location.search]);

    const handleLoadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchProducts(nextPage, true);
    };

    // Callback to update local cart state when ProductCard changes it
    const updateLocalCart = (productId, newQty) => {
        setCartItems(prev => {
            const updated = { ...prev };
            if (newQty <= 0) {
                delete updated[productId];
            } else {
                updated[productId] = newQty;
            }
            return updated;
        });
    };

    return (
        <>
            <Navbar />
            <div className="container">
                <header className="home-header">
                    <h1 className="home-title">Discover Products</h1>
                    <div className="filters">
                        <Link to="/?category=All Products" className="filter-select">All</Link>
                        <Link to="/?category=groceries" className="filter-select">Groceries</Link>
                        <Link to="/?category=electronics" className="filter-select">Electronics</Link>
                        <Link to="/?category=clothing" className="filter-select">Clothing</Link>
                    </div>
                </header>

                {loading ? (
                    <div className="loading">Loading products...</div>
                ) : error ? (
                    <div className="error">{error}</div>
                ) : products.length === 0 ? (
                    <div className="empty-state">
                        <h3>No products found</h3>
                        <p>Try adjusting your search or filters.</p>
                    </div>
                ) : (
                    <>
                        <div className="products-grid">
                            {products.map((product) => (
                                <ProductCard
                                    key={product._id}
                                    product={product}
                                    initialQuantity={cartItems[product._id] || 0}
                                    onUpdateCart={updateLocalCart}
                                />
                            ))}
                        </div>

                        {hasNextPage && (
                            <div className="pagination-controls">
                                <button
                                    onClick={handleLoadMore}
                                    className="btn-load-more"
                                    disabled={loadingMore}
                                >
                                    {loadingMore ? "Loading..." : "Load More"}
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </>
    );
};

export default Home;
