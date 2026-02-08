import { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import Navbar from "../components/Navbar";
import endpoints from "../api/endpoints";

const Home = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const location = useLocation();

    const fetchProducts = async () => {
        setLoading(true);
        try {
            // Pass the current search/filter params to the backend
            const query = location.search;
            const res = await fetch(`${endpoints.products.base}/${query}`, {
                credentials: 'include'
            });
            const data = await res.json();

            if (data.success) {
                setProducts(data.products || []);
            } else {
                setError("Failed to load products");
            }
        } catch (err) {
            console.error(err);
            setError("Error connecting to server");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, [location.search]);

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
                    <div className="products-grid">
                        {products.map((product) => (
                            <ProductCard key={product._id} product={product} />
                        ))}
                    </div>
                )}
            </div>
        </>
    );
};

export default Home;
