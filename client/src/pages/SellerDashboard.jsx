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

    useEffect(() => {
        if (!user || user.role !== "seller") {
            // navigate("/login"); // let api handle auth check
        }
        fetchDashboard();
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

    if (loading) return <><Navbar /><div className="container">Loading dashboard...</div></>;

    return (
        <>
            <Navbar />
            <div className="container dashboard-container">
                <div className="dashboard-header">
                    <h1>Seller Dashboard</h1>
                    <button className="btn-primary" onClick={() => setShowAddForm(!showAddForm)}>
                        {showAddForm ? "Cancel" : "+ Add Product"}
                    </button>
                </div>

                {showAddForm && (
                    <div className="add-product-form card">
                        <h3>Add New Product</h3>
                        <form onSubmit={handleAddSubmit}>
                            <div className="form-grid">
                                <input type="text" placeholder="Product Name" value={newProduct.name} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} required />
                                <input type="number" placeholder="Price" value={newProduct.price} onChange={e => setNewProduct({ ...newProduct, price: e.target.value })} required />
                                <input type="number" placeholder="Quantity" value={newProduct.quantity} onChange={e => setNewProduct({ ...newProduct, quantity: e.target.value })} required />
                                <select value={newProduct.category} onChange={e => setNewProduct({ ...newProduct, category: e.target.value })}>
                                    <option value="groceries">Groceries</option>
                                    <option value="electronics">Electronics</option>
                                    <option value="clothing">Clothing</option>
                                    <option value="food">Food</option>
                                </select>
                                <input type="text" placeholder="Location" value={newProduct.location} onChange={e => setNewProduct({ ...newProduct, location: e.target.value })} required />
                                <input type="file" onChange={handleFileChange} required />
                            </div>
                            <textarea placeholder="Description" value={newProduct.description} onChange={e => setNewProduct({ ...newProduct, description: e.target.value })} required></textarea>
                            <button type="submit" className="btn-primary btn-block" style={{ marginTop: '1rem' }}>Upload Product</button>
                        </form>
                    </div>
                )}

                <div className="products-table-container card">
                    <table className="products-table">
                        <thead>
                            <tr>
                                <th>Image</th>
                                <th>Name</th>
                                <th>Price</th>
                                <th>Sold / Total</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map(product => (
                                <tr key={product._id}>
                                    <td><img src={product.image} alt={product.name} className="table-img" /></td>
                                    <td>{product.name}</td>
                                    <td>
                                        ₹{product.price}
                                        <div className="action-row">
                                            <button onClick={() => handleUpdate(product._id, 'price', 10)} className="btn-micro">▲</button>
                                            <button onClick={() => handleUpdate(product._id, 'price', -10)} className="btn-micro">▼</button>
                                        </div>
                                    </td>
                                    <td>
                                        {product.sold} / {product.quantity + product.sold}
                                        <div className="action-row">
                                            <button onClick={() => handleUpdate(product._id, 'qty', 1)} className="btn-micro">+</button>
                                            <button onClick={() => handleUpdate(product._id, 'qty', -1)} className="btn-micro">-</button>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`status-badge ${product.status}`}>{product.status}</span>
                                    </td>
                                    <td>
                                        {product.status !== 'stopped' && (
                                            <button onClick={() => handleStopProduct(product._id)} className="btn-danger-outline">Stop</button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
};

export default SellerDashboard;
