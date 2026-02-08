import { useState, useEffect, useContext } from "react";
import Navbar from "../components/Navbar";
import { AuthContext } from "../context/AuthContext";
import endpoints from "../api/endpoints";

const RiderDashboard = () => {
    const { user } = useContext(AuthContext);
    const [stats, setStats] = useState(null);
    const [orders, setOrders] = useState([]); // This will hold the current tab's orders
    const [activeTab, setActiveTab] = useState("pending"); // pending, today, history
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
            else if (tab === "today") url = endpoints.rider.todayOrders;
            else if (tab === "history") url = endpoints.rider.historyOrders;

            const res = await fetch(url, { credentials: "include" });
            const data = await res.json();
            if (data.success) {
                // Normalize data structure since endpoints differ slightly
                setOrders(data.groupedOrders || data.groupedSlots || {});
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

            // Refresh
            fetchStats();
            fetchOrders(activeTab);
        } catch (err) { console.error(err); }
    };

    const renderOrders = () => {
        if (loading) return <p>Loading orders...</p>;

        // Handling Pending (Grouped by Date)
        if (activeTab === "pending") {
            const keys = Object.keys(orders);
            if (keys.length === 0) return <p>No pending orders.</p>;

            return keys.map(date => (
                <div key={date} className="order-group">
                    <h3>{date}</h3>
                    {orders[date].map(order => (
                        <div key={order._id} className="order-card-row">
                            <div>
                                <strong>{order.productName}</strong> ({order.deliverySlot})<br />
                                <small>{order.userName}, {order.address}</small>
                            </div>
                            <div className="btn-group">
                                <button onClick={() => handleOrderAction("accept", order._id)} className="btn-success">Accept</button>
                                <button onClick={() => handleOrderAction("reject", order._id)} className="btn-danger">Ignore</button>
                            </div>
                        </div>
                    ))}
                </div>
            ));
        }

        // Handling Today (Grouped by Slot)
        if (activeTab === "today") {
            const keys = Object.keys(orders);
            if (keys.length === 0) return <p>No orders for today.</p>;

            return keys.map(slot => (
                <div key={slot} className="order-group">
                    <h3>Slot: {slot}</h3>
                    {orders[slot].map(order => (
                        <div key={order._id} className="order-card-row">
                            <div>
                                <strong>{order.productName}</strong><br />
                                <small>Status: {order.status}</small>
                            </div>
                            <div className="btn-group">
                                {order.status === 'accepted' && (
                                    <button onClick={() => handleOrderAction("out-for-delivery", order._id)} className="btn-primary">Pick Up</button>
                                )}
                                {order.status === 'out-for-delivery' && (
                                    <button onClick={() => handleOrderAction("delivered", order._id)} className="btn-success">Delivered</button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ));
        }

        // Handling History
        if (activeTab === "history") {
            const keys = Object.keys(orders);
            if (keys.length === 0) return <p>No completed orders.</p>;
            return keys.map(date => (
                <div key={date} className="order-group">
                    <h3>{date}</h3>
                    {orders[date].map(order => (
                        <div key={order._id} className="order-card-row">
                            <div>
                                <strong>{order.productName}</strong><br />
                                <small>Delivered to {order.userName}</small>
                            </div>
                            <span className="badge-success">Completed</span>
                        </div>
                    ))}
                </div>
            ));
        }
    };

    return (
        <>
            <Navbar />
            <div className="container dashboard-container">
                <h1>Rider Dashboard</h1>

                {stats && (
                    <div className="stats-grid">
                        <div className="stat-card">
                            <h3>{stats.todaysOrderCount || 0}</h3>
                            <p>Today's Deliveries</p>
                        </div>
                        <div className="stat-card">
                            <h3>{stats.rider?.no_of_orders || 0}</h3>
                            <p>Total Completed</p>
                        </div>
                        <div className="stat-card">
                            <h3>{stats.orderRequestCount || 0}</h3>
                            <p>New Requests</p>
                        </div>
                    </div>
                )}

                <div className="tabs">
                    <button className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`} onClick={() => setActiveTab('pending')}>New Requests</button>
                    <button className={`tab-btn ${activeTab === 'today' ? 'active' : ''}`} onClick={() => setActiveTab('today')}>Today's Tasks</button>
                    <button className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>History</button>
                </div>

                <div className="orders-list">
                    {renderOrders()}
                </div>
            </div>
        </>
    );
};

export default RiderDashboard;
