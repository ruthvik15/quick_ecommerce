import { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { AuthContext } from "../context/AuthContext";
import endpoints from "../api/endpoints";
import useRiderLocationTracking from "../hooks/useRiderLocationTracking";
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet marker icon issue
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
});

const RiderOrderDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, loading: authLoading } = useContext(AuthContext);
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Global clock-synced location tracking (shared with RiderDashboard)
    useRiderLocationTracking();

    useEffect(() => {
        const fetchOrderDetails = async () => {
            try {
                const res = await fetch(endpoints.rider.orderDetail(id), { credentials: "include" });
                
                if (res.status === 401) {
                    navigate("/login");
                    return;
                }
                
                const data = await res.json();
                if (data.success) {
                    setOrder(data.order);
                } else {
                    setError(data.error || "Failed to load order");
                }
            } catch (err) {
                console.error(err);
                setError("Network error");
            } finally {
                setLoading(false);
            }
        };

        fetchOrderDetails();
    }, [id]);

    const handleOrderAction = async (action) => {
        try {
            let url = "";
            if (action === "out-for-delivery") url = endpoints.rider.outForDelivery;
            if (action === "delivered") url = endpoints.rider.completeOrder;

            const res = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderId: id }),
                credentials: "include"
            });
            const data = await res.json();

            if (data.success) {
                // Refresh data
                const res2 = await fetch(endpoints.rider.orderDetail(id), { credentials: "include" });
                const data2 = await res2.json();
                if (data2.success) setOrder(data2.order);
            } else {
                alert(data.error || "Action failed");
            }
        } catch (err) {
            console.error(err);
            alert("Network error. Please try again.");
        }
    };

    if (loading) return <><Navbar /><div className="container" style={{ paddingTop: '2rem' }}>Loading details...</div></>;
    if (error) return <><Navbar /><div className="container" style={{ paddingTop: '2rem' }}>Error: {error}</div></>;
    if (!order) return <><Navbar /><div className="container" style={{ paddingTop: '2rem' }}>Order not found</div></>;

    const hasLocation = order.latitude && order.longitude;

    return (
        <>
            <Navbar />
            <div className="container" style={{ maxWidth: '600px', margin: '2rem auto' }}>
                <button onClick={() => navigate('/rider/dashboard')} className="btn-secondary" style={{ marginBottom: '1rem' }}>
                    &larr; Back to Dashboard
                </button>

                <div className="card" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--text-main)' }}>Order Details</h2>
                            <p style={{ margin: 0, color: 'var(--text-sub)' }}>ID: {order._id.substring(order._id.length - 6)}</p>
                        </div>
                        <span className={`status-badge ${order.status}`}>{order.status.replace(/-/g, ' ')}</span>
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: 'var(--text-sub)' }}>Product</h3>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            {order.product?.image && (
                                <img src={order.product.image} alt={order.product.name} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px' }} />
                            )}
                            <div>
                                <h4 style={{ margin: 0 }}>{order.product?.name}</h4>
                                <p style={{ margin: 0, color: 'var(--text-sub)' }}>₹{order.product?.price}</p>
                            </div>
                        </div>
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: 'var(--text-sub)' }}>Customer</h3>
                        <p style={{ margin: '0.2rem 0', fontWeight: 'bold' }}>👤 {order.user?.name}</p>
                        <p style={{ margin: '0.2rem 0' }}>
                            📞 <a href={`tel:${order.ph_number || order.user?.phone}`} style={{ color: 'var(--primary)', textDecoration: 'none' }}>
                                {order.ph_number || order.user?.phone || 'No Phone'}
                            </a>
                        </p>
                    </div>

                    <div style={{ marginBottom: '1.5rem', background: '#f8fafc', padding: '1rem', borderRadius: '8px' }}>
                        <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: 'var(--text-sub)' }}>Delivery Location</h3>
                        <p style={{ margin: '0 0 0.5rem 0' }}>📍 {order.address}</p>

                        {hasLocation ? (
                            <div style={{ height: '300px', width: '100%', marginBottom: '1rem', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0', zIndex: 0 }}>
                                <MapContainer key={`${order.latitude}-${order.longitude}`} center={[order.latitude, order.longitude]} zoom={15} style={{ height: '100%', width: '100%' }}>
                                    <TileLayer
                                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                    />
                                    <Marker position={[order.latitude, order.longitude]}>
                                        <Popup>Delivery Location: {order.address}</Popup>
                                    </Marker>
                                </MapContainer>
                            </div>
                        ) : (
                            <div style={{ padding: '2rem', background: '#e2e8f0', textAlign: 'center', borderRadius: '8px', marginBottom: '1rem', color: '#64748b' }}>
                                <p style={{ marginBottom: 0 }}>No precise GPS coordinates available.</p>
                            </div>
                        )}

                        <a
                            href={`https://www.google.com/maps/search/?api=1&query=${hasLocation ? `${order.latitude},${order.longitude}` : encodeURIComponent(order.address)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="btn-primary"
                            style={{ display: 'block', textDecoration: 'none', fontSize: '1rem', padding: '0.75rem', textAlign: 'center', fontWeight: 'bold' }}
                        >
                            {hasLocation ? '🗺️ Navigate to GPS Location' : '🗺️ Search Address on Google Maps'}
                        </a>
                    </div>

                    <div style={{ marginBottom: '2rem' }}>
                        <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: 'var(--text-sub)' }}>Payment Info</h3>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', border: '1px solid var(--border)', borderRadius: '8px' }}>
                            <span>Mode</span>
                            <strong>{order.paymentMode}</strong>
                        </div>
                        {order.paymentMode === 'COD' && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', border: '1px solid var(--border)', borderTop: 'none', borderRadius: '0 0 8px 8px', background: '#fff7ed', color: '#c2410c' }}>
                                <span>Amount to Collect</span>
                                <strong>₹{order.amount}</strong>
                            </div>
                        )}
                    </div>

                    {order.status === 'accepted' && (
                        <button onClick={() => handleOrderAction("out-for-delivery")} className="btn-primary" style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }}>
                            Pick Up Order
                        </button>
                    )}
                    {order.status === 'out-for-delivery' && (
                        <button onClick={() => handleOrderAction("delivered")} className="btn-success" style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }}>
                            Mark Delivered
                        </button>
                    )}
                    {order.status === 'delivered' && (
                        <div style={{ textAlign: 'center', padding: '1rem', background: '#dcfce7', color: '#166534', borderRadius: '8px', fontWeight: 'bold' }}>
                            ✅ Order Completed
                        </div>
                    )}

                </div>
            </div>
        </>
    );
};

export default RiderOrderDetails;
