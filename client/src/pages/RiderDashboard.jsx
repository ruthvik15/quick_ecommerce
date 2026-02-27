import { useState, useEffect, useContext } from "react";
import Navbar from "../components/Navbar";
import { AuthContext } from "../context/AuthContext";
import endpoints from "../api/endpoints";

const RiderDashboard = () => {
    const { user } = useContext(AuthContext);
    const [stats, setStats] = useState(null);
    const [orders, setOrders] = useState({}); // Stores grouped orders
    const [activeTab, setActiveTab] = useState("pending"); // pending, accepted, history
    const [loading, setLoading] = useState(true);

    const fetchStats = async () => {
        try {
            const res = await fetch(endpoints.rider.riderDashboard, { credentials: "include" });
            const data = await res.json();
            if (data.success) setStats(data);
        } catch (err) { console.error(err); }
    };

    const fetchOrders = async (tab) => {
        setLoading(true);
        try {
            let url = "";
            if (tab === "pending") url = endpoints.rider.pendingOrders;
            else if (tab === "accepted") url = endpoints.rider.acceptedOrders;
            else if (tab === "history") url = endpoints.rider.historyOrders;

            const res = await fetch(url, { credentials: "include" });
            const data = await res.json();
            if (data.success) {
                // Normalize data to always be an object (grouped by date usually)
                setOrders(data.groupedOrders || {});
            }
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => {
        fetchStats();
        fetchOrders(activeTab);
    }, [activeTab]);

    const handleOrderAction = async (action, orderId) => {
        try {
            let url = "";
            if (action === "accept") url = endpoints.rider.acceptOrder;
            if (action === "reject") url = endpoints.rider.rejectOrder;
            if (action === "out-for-delivery") url = endpoints.rider.outForDelivery;
            if (action === "delivered") url = endpoints.rider.completeOrder;

            await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderId }),
                credentials: "include"
            });

            // Refresh data
            fetchStats();
            fetchOrders(activeTab);
        } catch (err) { console.error(err); }
    };

    const renderOrders = () => {
        if (loading) return <div className="loading-spinner">Loading orders...</div>;

        const dateKeys = Object.keys(orders);

        if (dateKeys.length === 0) {
            return (
                <div className="empty-state">
                    <p>No orders found for this section.</p>
                </div>
            );
        }

        return dateKeys.map(date => (
            <div key={date} className="order-group fade-in">
                <h3 className="order-date-header">{date}</h3>
                {orders[date].map(order => (
                    <div key={order._id} className="order-card-row">
                        <div className="order-info">
                            {activeTab === 'pending' ? (
                                <>
                                    <h4 className="product-name">Delivery Request</h4>
                                    <div className="order-meta">
                                        <span>📦 Slot: <strong>{order.deliverySlot}</strong></span>
                                        <span>📍 {order.address}</span>
                                        <span style={{ fontSize: '0.85rem', color: 'var(--primary)', marginTop: '0.2rem' }}>
                                            Accept to view details
                                        </span>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <h4 className="product-name">{order.productName}</h4>
                                    <div className="order-meta">
                                        <span>📍 {order.address}</span>
                                        <span>📦 Slot: <strong>{order.deliverySlot}</strong></span>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="btn-group">
                            {activeTab === 'pending' && (
                                <>
                                    <button onClick={() => handleOrderAction("accept", order._id)} className="btn-accept">
                                        Accept
                                    </button>
                                    <button onClick={() => handleOrderAction("reject", order._id)} className="btn-ignore">
                                        Ignore
                                    </button>
                                </>
                            )}

                            {activeTab === 'accepted' && (
                                <button
                                    onClick={() => window.location.href = `/rider/orders/${order._id}`}
                                    className="btn-primary"
                                    style={{ width: '100%' }}
                                >
                                    View Details ➝
                                </button>
                            )}

                            {activeTab === 'history' && (
                                <span className="status-badge delivered">Delivered</span>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        ));
    };

    return (
        <>
            <Navbar />
            <div className="container dashboard-container">
                <div className="dashboard-header">
                    <div>
                        <h1>Rider Dashboard</h1>
                        <p style={{ color: 'var(--text-sub)' }}>Manage your deliveries and earnings</p>
                    </div>
                </div>

                {stats && (
                    <div className="stats-grid">
                        <div className="stat-card">
                            <h3>{stats.todaysOrderCount || 0}</h3>
                            <p>Today's Deliveries</p>
                        </div>
                        <div className="stat-card">
                            <h3>{stats.orderRequestCount || 0}</h3>
                            <p>New Requests</p>
                        </div>
                        <div className="stat-card">
                            <h3>{stats.rider?.no_of_orders || 0}</h3>
                            <p>Total Completed</p>
                        </div>
                    </div>
                )}

                <div className="tabs">
                    <button className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`} onClick={() => setActiveTab('pending')}>
                        New Requests
                    </button>
                    <button className={`tab-btn ${activeTab === 'accepted' ? 'active' : ''}`} onClick={() => setActiveTab('accepted')}>
                        Accepted Tasks
                    </button>
                    <button className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
                        History
                    </button>
                </div>

                <div className="orders-list">
                    {renderOrders()}
                </div>
            </div>
        </>
    );
};

export default RiderDashboard;
