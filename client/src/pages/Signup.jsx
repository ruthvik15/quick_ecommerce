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
    });
    const [error, setError] = useState("");
    const { login } = useContext(AuthContext); // Can auto-login after signup
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

                {error && <div className="error-message">{error}</div>}

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
                            <option value="user">User</option>
                            <option value="seller">Seller</option>
                            <option value="rider">Rider</option>
                        </select>
                    </div>

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

                    <button type="submit" className="btn-primary">Sign Up</button>
                </form>
                <p className="footer-text">
                    Already have an account? <Link to="/login">Login</Link>
                </p>
            </div>
        </div>
    );
};

export default Signup;
