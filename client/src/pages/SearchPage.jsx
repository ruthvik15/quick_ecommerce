import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";
import ProductCard from "../components/ProductCard";
import endpoints from "../api/endpoints";

const SearchPage = () => {
    const location = useLocation();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            setError(null);

            // Parse query parameter properly
            const searchParams = new URLSearchParams(location.search);
            const query = searchParams.get('query');

            if (!query) {
                setError("Please enter a search query");
                setLoading(false);
                return;
            }

            try {
                const res = await fetch(`${endpoints.products.search}?searchQuery=${encodeURIComponent(query)}`, {
                    credentials: 'include'
                });
                const data = await res.json();

                if (data.success) {
                    setProducts(data.products || []);
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
                    <div className="products-grid">
                        {products.map(product => (
                            <ProductCard key={product._id} product={product} />
                        ))}
                    </div>
                )}
            </div>
        </>
    );
};

export default SearchPage;