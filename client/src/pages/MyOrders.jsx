import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { AuthContext } from "../context/AuthContext";
import endpoints from "../api/endpoints";

const MyOrders = () => {
    const { user, loading: authLoading } = useContext(AuthContext);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const fetchOrders = async () => {
        try {
            const res = await fetch(endpoints.orders.trackOrders, { credentials: "include" });
            const data = await res.json();
            if (data.success) {
                setOrders(data.orders);
            } else if (data.error === "Unauthorized") {
                navigate("/login");
            }
        } catch (err) {
            console.error("Error fetching orders:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            navigate("/login");
            return;
        }
        fetchOrders();
    }, [user, authLoading, navigate]);

    const handleCancel = async (orderId) => {
        if (!confirm("Are you sure you want to cancel this order?")) return;
        try {
            const res = await fetch(endpoints.orders.cancelOrder, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderId }),
                credentials: "include"
            });
            const data = await res.json();
            if (data.success) {
                alert("Order cancelled");
                fetchOrders();
            } else {
                alert(data.error || "Failed to cancel");
            }
        } catch (err) {
            console.error(err);
        }
    };

    if (loading || authLoading) return <><Navbar /><div className="container">Loading orders...</div></>;

    return (
        <>
            <Navbar />
            <div className="container dashboard-container">
                <h1>My Orders</h1>
                {orders.length === 0 ? <p>No orders found.</p> : (
                    <div className="orders-list">
                        {orders.map(order => (
                            <div key={order._id} className="card order-card" style={{ borderColor: order.status === 'delivered' ? 'var(--success)' : 'transparent' }}>
                                <div className="order-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                    <div>
                                        <strong>Order #{order._id.slice(-6)}</strong>
                                        <div style={{ fontSize: '0.9rem', color: 'var(--text-sub)' }}>
                                            {new Date(order.createdAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <span className={`status-badge ${order.status}`}>{order.status}</span>
                                </div>
                                <div className="order-body" style={{ display: 'flex', gap: '1rem' }}>
                                    <img src={order.product_id?.image} alt={order.product_id?.name} style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '0.5rem' }} />
                                    <div>
                                        <h4>{order.product_id?.name}</h4>
                                        <p>Qty: {order.quantity} | Total: ₹{order.total}</p>
                                        <p>Slot: {order.deliverySlot} ({new Date(order.deliveryDate).toLocaleDateString()})</p>
                                    </div>
                                </div>
                                <div className="order-footer" style={{ marginTop: '1rem', textAlign: 'right' }}>
                                    {['confirmed'].includes(order.status) && (
                                        <button onClick={() => handleCancel(order._id)} className="btn-danger-outline">Cancel Order</button>
                                    )}
                                    {['out-for-delivery', 'accepted'].includes(order.status) && (
                                        <button className="btn-primary" style={{ opacity: 0.7, cursor: 'not-allowed' }}>Track Live (Coming Soon)</button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
};

export default MyOrders;
