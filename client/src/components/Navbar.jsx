import { useState, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { CartContext } from "../context/CartContext";
import endpoints from "../api/endpoints";

const Navbar = () => {
    const { user, logout } = useContext(AuthContext);
    const { cartCount } = useContext(CartContext);
    const [searchQuery, setSearchQuery] = useState("");
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchSuggestions = async () => {
            if (searchQuery.trim().length < 2) {
                setSuggestions([]);
                return;
            }

            try {
                const res = await fetch(`${endpoints.products.searchSuggestions}?q=${encodeURIComponent(searchQuery)}`, {
                    credentials: 'include'
                });
                const data = await res.json();
                setSuggestions(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error("Error fetching suggestions:", err);
                setSuggestions([]);
            }
        };

        const debounceTimer = setTimeout(fetchSuggestions, 300);
        return () => clearTimeout(debounceTimer);
    }, [searchQuery]);

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/search?query=${encodeURIComponent(searchQuery)}`);
            setShowSuggestions(false);
        }
    };

    const handleSuggestionClick = (suggestion) => {
        setSearchQuery(suggestion);
        navigate(`/search?query=${encodeURIComponent(suggestion)}`);
        setShowSuggestions(false);
    };

    return (
        <nav className="navbar">
            <div className="container navbar-content">
                <Link to="/" className="brand-logo">
                    Quick Kart
                </Link>

                <form onSubmit={handleSearch} className="search-bar">
                    <input
                        type="text"
                        placeholder="Search for products..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => setShowSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    />
                    <button type="submit">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                    </button>
                    {showSuggestions && suggestions.length > 0 && (
                        <div className="search-suggestions">
                            {suggestions.map((suggestion, idx) => (
                                <div
                                    key={idx}
                                    className="suggestion-item"
                                    onClick={() => handleSuggestionClick(suggestion)}
                                >
                                    {suggestion}
                                </div>
                            ))}
                        </div>
                    )}
                </form>

                <div className="nav-links">
                    <Link to="/" className="nav-item">Home</Link>

                    {user ? (
                        <>
                            {user.role === 'user' && (
                                <>
                                    <Link to="/cart" className="nav-item cart-link">
                                        Cart
                                        {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
                                    </Link>
                                    <Link to="/orders" className="nav-item">My Orders</Link>
                                </>
                            )}
                            {user.role === 'seller' && <Link to="/seller/dashboard" className="nav-item">Dashboard</Link>}
                            {user.role === 'rider' && <Link to="/rider/dashboard" className="nav-item">Dashboard</Link>}

                            <div className="user-menu">
                                <span className="username">Hi, {user.name?.split(' ')[0]}</span>
                                <button onClick={logout} className="btn-logout">Logout</button>
                            </div>
                        </>
                    ) : (
                        <div className="auth-buttons">
                            <Link to="/login" className="btn-login">Login</Link>
                            <Link to="/signup" className="btn-signup">Sign Up</Link>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
