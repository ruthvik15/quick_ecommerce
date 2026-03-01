import { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import endpoints from "../api/endpoints";

const Signup = () => {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        phone: "",
        location: "hyderabad",
        role: "user",
        vehicle_type: "bike",
        address: "",   // Added for Seller/Rider
        shopName: ""   // Added for Seller
    });
    
    const [error, setError] = useState("");
    const { login } = useContext(AuthContext); 
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        try {
            const res = await fetch(endpoints.auth.signup, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
                credentials: "include",
            });

            const data = await res.json();

            if (data.success) {
                login(data.user || { role: data.role });
                navigate(data.redirectUrl || "/");
            } else {
                setError(data.error || "Signup failed");
            }
        } catch (err) {
            setError("Server error. Please try again.");
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2>Create Account</h2>
                <p className="subtitle">Join us today!</p>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Name</label>
                        <input name="name" onChange={handleChange} required />
                    </div>

                    <div className="form-group">
                        <label>Email</label>
                        <input name="email" type="email" onChange={handleChange} required />
                    </div>

                    <div className="form-group">
                        <label>Password</label>
                        <input name="password" type="password" onChange={handleChange} required />
                    </div>

                    <div className="form-group">
                        <label>Phone</label>
                        <input name="phone" onChange={handleChange} required />
                    </div>

                    <div className="form-group">
                        <label>Location</label>
                        <select name="location" value={formData.location} onChange={handleChange}>
                            <option value="hyderabad">Hyderabad</option>
                            <option value="bengaluru">Bengaluru</option>
                            <option value="mumbai">Mumbai</option>
                            <option value="delhi">Delhi</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Role</label>
                        <select name="role" value={formData.role} onChange={handleChange}>
                            <option value="user">User (Customer)</option>
                            <option value="seller">Seller (Shop Owner)</option>
                            <option value="rider">Rider (Delivery Partner)</option>
                        </select>
                    </div>

                    {/* --- CONDITIONAL FIELDS --- */}

                    {/* 1. Shop Name: Only for SELLERS */}
                    {formData.role === "seller" && (
                        <div className="form-group">
                            <label>Shop Name</label>
                            <input 
                                name="shopName" 
                                placeholder="e.g. Fresh Mart"
                                onChange={handleChange} 
                                required // Mandatory for Seller
                            />
                        </div>
                    )}

                    {/* 2. Address: Mandatory for SELLERS and RIDERS */}
                    {(formData.role === "seller" || formData.role === "rider") && (
                        <div className="form-group">
                            <label>Address {formData.role === "seller" ? "(Pickup Location)" : "(Base Location)"}</label>
                            <textarea 
                                name="address" 
                                placeholder="Enter full address"
                                onChange={handleChange} 
                                required 
                            />
                        </div>
                    )}

                    {/* 3. Vehicle Type: Only for RIDERS */}
                    {formData.role === "rider" && (
                        <div className="form-group">
                            <label>Vehicle Type</label>
                            <select name="vehicle_type" value={formData.vehicle_type} onChange={handleChange} required>
                                <option value="bike">Bike</option>
                                <option value="scooter">Scooter</option>
                                <option value="car">Car</option>
                            </select>
                        </div>
                    )}

                    {error && <div className="error-message">{error}</div>}

                    <button type="submit" className="btn-primary btn-block">Sign Up</button>
                </form>
                
                <p className="footer-text">
                    Already have an account? <Link to="/login">Login</Link>
                </p>
            </div>
        </div>
    );
};

export default Signup;