import { useState, useEffect, useContext } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";
import ProductCard from "../components/ProductCard";
import endpoints from "../api/endpoints";
import { AuthContext } from "../context/AuthContext";

const SearchPage = () => {
    const { user } = useContext(AuthContext);
    const location = useLocation();
    const [products, setProducts] = useState([]);
    const [cartItems, setCartItems] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [hasNextPage, setHasNextPage] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);

    // Fetch Cart to sync quantities
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

    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            setError(null);
            setPage(1);

            const searchParams = new URLSearchParams(location.search);
            const query = searchParams.get('query');

            if (!query) {
                setError("Please enter a search query");
                setLoading(false);
                return;
            }

            try {
                searchParams.set('page', 1);
                const res = await fetch(`${endpoints.products.search}?${searchParams.toString()}`, {
                    credentials: 'include'
                });
                const data = await res.json();

                if (data.success) {
                    setProducts(data.products || []);
                    setHasNextPage(data.pagination?.hasNextPage || false);
                } else {
                    setError(data.error || "No products found");
                }
            } catch (err) {
                console.error("Search error:", err);
                setError("Error fetching products");
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, [location.search]);

    const handleLoadMore = async () => {
        setLoadingMore(true);
        const nextPage = page + 1;

        const searchParams = new URLSearchParams(location.search);
        searchParams.set('page', nextPage);

        try {
            const res = await fetch(`${endpoints.products.search}?${searchParams.toString()}`, {
                credentials: 'include'
            });
            const data = await res.json();

            if (data.success) {
                setProducts(prev => [...prev, ...(data.products || [])]);
                setHasNextPage(data.pagination?.hasNextPage || false);
                setPage(nextPage);
            }
        } catch (err) {
            console.error("Load more error:", err);
        } finally {
            setLoadingMore(false);
        }
    };

    return (
        <>
            <Navbar />
            <div className="container">
                <h1>Search Results</h1>

                {loading ? (
                    <div className="loading">Searching...</div>
                ) : error ? (
                    <div className="error">{error}</div>
                ) : products.length === 0 ? (
                    <div className="empty-state">
                        <h3>No products found</h3>
                        <p>Try adjusting your search query.</p>
                    </div>
                ) : (
                    <>
                        <div className="products-grid">
                            {products.map(product => (
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

export default SearchPage;