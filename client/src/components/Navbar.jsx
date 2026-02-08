import { useState, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import endpoints from "../api/endpoints";

const Navbar = () => {
    const { user, logout } = useContext(AuthContext);
    const [searchQuery, setSearchQuery] = useState("");
    const [cartCount, setCartCount] = useState(0);
    const navigate = useNavigate();

    useEffect(() => {
        if (user && user.role === 'user') {
            fetch(endpoints.cart.getCart, { credentials: "include" })
                .then(res => res.json())
                .then(data => {
                    if (data.success && data.cart) {
                        const count = data.cart.items.reduce((acc, item) => acc + item.quantity, 0);
                        setCartCount(count);
                    }
                })
                .catch(err => console.error("Error fetching cart count:", err));
        }
    }, [user]);

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/search?searchQuery=${encodeURIComponent(searchQuery)}`);
        }
    };

    return (
        <nav className="navbar">
            <div className="container navbar-content">
                <Link to="/" className="brand-logo">
                    QuickKart
                </Link>

                <form onSubmit={handleSearch} className="search-bar">
                    <input
                        type="text"
                        placeholder="Search for products..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <button type="submit">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                    </button>
                </form>

                <div className="nav-links">
                    <Link to="/" className="nav-item">Home</Link>

                    {user ? (
                        <>
                            {user.role === 'user' && (
                                <Link to="/cart" className="nav-item cart-link">
                                    Cart
                                    {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
                                </Link>
                            )}
                            <Link to="/orders" className="nav-item">My Orders</Link>
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
