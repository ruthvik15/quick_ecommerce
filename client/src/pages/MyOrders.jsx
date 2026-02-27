import { useState, useEffect, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";
import Toast from "../components/Toast";
import { AuthContext } from "../context/AuthContext";
import endpoints from "../api/endpoints";

const MyOrders = () => {
    const { user, loading: authLoading } = useContext(AuthContext);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);
    const [confirmCancel, setConfirmCancel] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const res = await fetch(endpoints.orders.trackOrders, { credentials: "include" });
            
            // Handle 401 Unauthorized
            if (res.status === 401) {
                navigate("/login");
                return;
            }
            
            const data = await res.json();
            if (data.success) {
                setOrders(data.orders);
            } else if (data.error === "Unauthorized") {
                navigate("/login");
            }
        } catch (err) {
            console.error("Error fetching orders:", err);
            // If there's a network error or JSON parse error, still show something
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
        if (user.role === 'rider') {
            navigate('/rider/dashboard');
            return;
        }
        if (user.role === 'seller') {
            navigate('/seller/dashboard');
            return;
        }
        fetchOrders();
    }, [user, authLoading, location.pathname]); // Re-fetch when route changes

    const handleCancel = (orderId) => {
        setConfirmCancel(orderId);
    };

    const performCancel = async () => {
        if (!confirmCancel) return;
        try {
            const res = await fetch(endpoints.orders.cancelOrder, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderId: confirmCancel }),
                credentials: "include"
            });
            const data = await res.json();
            if (data.success) {
                setToast({ message: "Order cancelled successfully", type: "success" });
                fetchOrders();
            } else {
                setToast({ message: data.error || "Failed to cancel order", type: "error" });
            }
        } catch (err) {
            console.error(err);
            setToast({ message: "Failed to cancel order", type: "error" });
        }
    };

    if (loading || authLoading) return <><Navbar /><div className="container">Loading orders...</div></>;

    return (
        <>
            <Navbar />
            {confirmCancel && (
                <Toast
                    message="Are you sure you want to cancel this order?"
                    type="warning"
                    onClose={() => setConfirmCancel(null)}
                    onConfirm={performCancel}
                    confirmText="Yes, Cancel Order"
                    cancelText="No, Keep Order"
                />
            )}
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
            <div className="container dashboard-container">
                <h1>My Orders</h1>
                {orders.length === 0 ? <p>No orders found.</p> : (
                    <div className="orders-list">
                        {orders.map(order => (
                            <div key={order._id} className="card order-card" style={{ borderColor: order.status === 'delivered' ? 'var(--success)' : 'transparent' }}>
                                <div className="order-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                    <div>
                                        <strong>Order #{order._id.slice(-6)}</strong>
                                        <div style={{ fontSize: '0.9rem', color: 'var(--text-sub)', marginTop: '0.25rem' }}>
                                            {new Date(order.createdAt).toLocaleDateString()} • {order.paid || order.razorpay_payment_id ? 'Prepaid' : 'COD'}
                                        </div>
                                    </div>
                                    <span className={`status-badge ${order.status}`}>{order.status}</span>
                                </div>
                                <div className="order-body" style={{ display: 'flex', gap: '1rem' }}>
                                    <img src={order.productId?.image} alt={order.productId?.name} style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '0.5rem' }} />
                                    <div>
                                        <h4>{order.productId?.name}</h4>
                                        <p>Qty: {order.quantity} | Total: ₹{order.total}</p>
                                        <p>Slot: {order.deliverySlot} ({new Date(order.deliveryDate).toLocaleDateString()})</p>
                                    </div>
                                </div>
                                <div className="order-footer" style={{ marginTop: '1rem', textAlign: 'right' }}>
                                    {['confirmed'].includes(order.status) && (
                                        <button onClick={() => handleCancel(order._id)} className="btn-danger-outline">Cancel Order</button>
                                    )}
                                    {['out-for-delivery', 'accepted'].includes(order.status) && (
                                        <button onClick={() => navigate(`/track-order/${order._id}`)} className="btn-primary">
                                            📍 Track Live
                                        </button>
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
