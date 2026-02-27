import { useState, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { AuthContext } from "../context/AuthContext";
import endpoints from "../api/endpoints";

const SellerDashboard = () => {
    const { user } = useContext(AuthContext);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [dashboardTrackSection, setDashboardTrackSection] = useState([]);
    const navigate = useNavigate();

    // Add Product Form State
    const [newProduct, setNewProduct] = useState({
        name: "", price: "", quantity: "", category: "groceries", description: "", location: "hyderabad", image: null
    });

    const fetchDashboard = async () => {
        try {
            const res = await fetch(endpoints.seller.sellerDashboard, { credentials: "include" });
            const data = await res.json();

            if (data.success) {
                setProducts(data.products);
            } else if (data.error === "Unauthorized") {
                navigate("/login");
            }
        } catch (err) {
            console.error("Error fetching dashboard", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchDashboardTrackSection = async () => {
        try {
            const res = await fetch(endpoints.seller.dashboardTrackSection, { credentials: "include" });
            const data = await res.json();

            if (data.success) {
                setDashboardTrackSection(data.trackSection);
            } else if (data.error === "Unauthorized") {
                navigate("/login");
            }
        } catch (err) {
            console.error("Error fetching dashboard track section", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboard();
        fetchDashboardTrackSection();
    }, [user, navigate]);

    const handleStopProduct = async (id) => {
        await fetch(`${endpoints.seller.stopProduct}/${id}`, { method: "POST", credentials: "include" });
        fetchDashboard();
    };

    const handleUpdate = async (id, type, change) => {
        const url = type === 'price' ? `${endpoints.seller.updatePrice}/${id}` : `${endpoints.seller.updateQuantity}/${id}`;
        await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ change }),
            credentials: "include"
        });
        fetchDashboard();
    };

    const handleFileChange = (e) => {
        setNewProduct({ ...newProduct, image: e.target.files[0] });
    };

    const handleAddSubmit = async (e) => {
        e.preventDefault();
        console.log("Submitting product...", newProduct);

        if (!newProduct.image) {
            alert("Please select an image file.");
            return;
        }

        const formData = new FormData();
        Object.keys(newProduct).forEach(key => formData.append(key, newProduct[key]));

        try {
            const res = await fetch(endpoints.seller.addProduct, {
                method: "POST",
                body: formData,
                credentials: "include"
            });
            console.log("Response status:", res.status);

            const data = await res.json();
            console.log("Response data:", data);

            if (data.success) {
                setShowAddForm(false);
                setNewProduct({ name: "", price: "", quantity: "", category: "groceries", description: "", location: "hyderabad", image: null });
                fetchDashboard();
                alert("Product added successfully!");
            } else {
                alert(data.error || "Failed to add product");
            }
        } catch (err) {
            console.error("Upload failed", err);
            alert("Error uploading product. Check console.");
        }
    };

    // Calculate Stats
    const totalProducts = dashboardTrackSection.totalProducts;  
    const totalSold = dashboardTrackSection.totalProductsSold;
    const totalRevenue = dashboardTrackSection.totalRevenue;
    const activeProducts = dashboardTrackSection.activeProducts;

    if (loading) return <><Navbar /><div className="container">Loading dashboard...</div></>;

    return (
        <>
            <Navbar />
            <div className="container dashboard-container">
                <div className="dashboard-header">
                    <div>
                        <h1>Seller Dashboard</h1>
                        <p style={{ color: 'var(--text-sub)' }}>Manage your inventory and track sales</p>
                    </div>
                    <button className="btn-primary" onClick={() => setShowAddForm(!showAddForm)}>
                        {showAddForm ? "Close Form" : "+ Add New Product"}
                    </button>
                </div>

                {/* Stats Grid */}
                <div className="stats-grid">
                    <div className="stat-card">
                        <h3>{totalProducts}</h3>
                        <p>Total Products</p>
                    </div>
                    <div className="stat-card">
                        <h3>{activeProducts}</h3>
                        <p>Active Listings</p>
                    </div>
                    <div className="stat-card">
                        <h3>{totalSold}</h3>
                        <p>Total Items Sold</p>
                    </div>
                    <div className="stat-card highlight">
                        <h3>₹{totalRevenue.toLocaleString()}</h3>
                        <p>Total Revenue</p>
                    </div>
                </div>

                {showAddForm && (
                    <div className="add-product-form card fade-in">
                        <h3>Add New Product</h3>
                        <form onSubmit={handleAddSubmit}>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Product Name</label>
                                    <input type="text" placeholder="e.g. Fresh Apples" value={newProduct.name} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label>Price (₹)</label>
                                    <input type="number" placeholder="0.00" value={newProduct.price} onChange={e => setNewProduct({ ...newProduct, price: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label>Quantity</label>
                                    <input type="number" placeholder="Available Stock" value={newProduct.quantity} onChange={e => setNewProduct({ ...newProduct, quantity: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label>Category</label>
                                    <select value={newProduct.category} onChange={e => setNewProduct({ ...newProduct, category: e.target.value })}>
                                        <option value="groceries">Groceries</option>
                                        <option value="electronics">Electronics</option>
                                        <option value="clothing">Clothing</option>
                                        <option value="food">Food</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Location</label>
                                    <input type="text" placeholder="City / Area" value={newProduct.location} onChange={e => setNewProduct({ ...newProduct, location: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label>Product Image</label>
                                    <input type="file" onChange={handleFileChange} required className="file-input" />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <textarea rows="3" placeholder="Product details..." value={newProduct.description} onChange={e => setNewProduct({ ...newProduct, description: e.target.value })} required></textarea>
                            </div>
                            <button type="submit" className="btn-primary btn-block" style={{ marginTop: '1rem' }}>Upload Product</button>
                        </form>
                    </div>
                )}

                <div className="products-table-container card">
                    <div style={{ paddingBottom: '1rem', borderBottom: '1px solid var(--border)', marginBottom: '1rem' }}>
                        <h3 style={{ margin: 0 }}>Your Inventory</h3>
                    </div>
                    <table className="products-table">
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th>Price</th>
                                <th>Stock Status</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map(product => (
                                <tr key={product._id}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <img src={product.image} alt={product.name} className="table-img" />
                                            <span style={{ fontWeight: '500' }}>{product.name}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            ₹{product.price}
                                            <div className="action-column">
                                                <button onClick={() => handleUpdate(product._id, 'price', 10)} className="btn-micro">▲</button>
                                                <button onClick={() => handleUpdate(product._id, 'price', -10)} className="btn-micro">▼</button>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span>{product.quantity} left</span>
                                            <span className="text-sub">({product.sold || 0} sold)</span>
                                            <div className="action-column">
                                                <button onClick={() => handleUpdate(product._id, 'qty', 1)} className="btn-micro">+</button>
                                                <button onClick={() => handleUpdate(product._id, 'qty', -1)} className="btn-micro">-</button>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`status-badge ${product.status}`}>
                                            {product.status === 'active' ? '● Active' : '○ Stopped'}
                                        </span>
                                    </td>
                                    <td>
                                        {product.status !== 'stopped' && (
                                            <button onClick={() => handleStopProduct(product._id)} className="btn-danger-outline btn-sm">
                                                Stop Sale
                                            </button>
                                        )}
                                        {product.status === 'stopped' && (
                                            <span className="text-sub" style={{ fontSize: '0.9rem' }}>Stopped</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {products.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-sub)' }}>
                            <p>No products listed yet. Start selling today!</p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default SellerDashboard;
