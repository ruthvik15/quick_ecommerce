import { useState, useEffect, useContext, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { AuthContext } from "../context/AuthContext";
import endpoints from "../api/endpoints";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
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

// Custom rider icon
const riderIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// Custom delivery location icon
const deliveryIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const TrackOrder = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const { user, loading: authLoading } = useContext(AuthContext);
    const [order, setOrder] = useState(null);
    const [riderLocation, setRiderLocation] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [isLive, setIsLive] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const [, setTicker] = useState(0); // Force re-render every second for timer display

    // Fetch order details once
    useEffect(() => {
        const fetchOrder = async () => {
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

            try {
                const res = await fetch(endpoints.orders.trackOrderDetail(orderId), { credentials: "include" });
                
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

        fetchOrder();
    }, [orderId, user, authLoading, navigate]);

    // Function to fetch rider location (memoized to prevent unnecessary re-renders)
    const fetchRiderLocation = useCallback(async () => {
        if (!order) return;
        if (!['accepted', 'out-for-delivery'].includes(order.status)) return;

        setRefreshing(true);
        try {
            const res = await fetch(endpoints.orders.riderLocation(orderId), { credentials: "include" });
            
            if (res.status === 401) {
                navigate("/login");
                return;
            }
            
            const data = await res.json();
            if (data.success && data.hasRider) {
                setRiderLocation(data.location);
                setLastUpdated(new Date(data.lastUpdated));
                setIsLive(data.isLive);
            }
        } catch (err) {
            console.error("Location fetch error:", err);
        } finally {
            setRefreshing(false);
        }
    }, [order, orderId, navigate]);

    // Auto-fetch rider location every 3 minutes
    useEffect(() => {
        if (!order) return;
        if (!['accepted', 'out-for-delivery'].includes(order.status)) return;

        // Fetch immediately when page loads
        fetchRiderLocation();

        // Auto-refresh every 3 minutes (180 seconds)
        const interval = setInterval(fetchRiderLocation, 180000);

        return () => clearInterval(interval);
    }, [order, fetchRiderLocation]);

    // Update timer display every second
    useEffect(() => {
        if (!lastUpdated) return;
        
        const timer = setInterval(() => {
            setTicker(prev => prev + 1); // Trigger re-render to update time display
        }, 1000);

        return () => clearInterval(timer);
    }, [lastUpdated]);

    const getTimeSinceUpdate = () => {
        if (!lastUpdated) return "Unknown";
        const diff = Math.floor((new Date() - lastUpdated) / 1000); // seconds
        if (diff < 60) return `${diff} seconds ago`;
        const mins = Math.floor(diff / 60);
        if (mins < 60) return `${mins} minute${mins > 1 ? 's' : ''} ago`;
        const hours = Math.floor(mins / 60);
        return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    };

    if (loading || authLoading) {
        return (
            <>
                <Navbar />
                <div className="container" style={{ paddingTop: '2rem' }}>Loading order details...</div>
            </>
        );
    }

    if (error) {
        return (
            <>
                <Navbar />
                <div className="container" style={{ paddingTop: '2rem' }}>
                    <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
                        <h3>⚠️ {error}</h3>
                        <button onClick={() => navigate('/my-orders')} className="btn-primary" style={{ marginTop: '1rem' }}>
                            Back to Orders
                        </button>
                    </div>
                </div>
            </>
        );
    }

    if (!order) {
        return (
            <>
                <Navbar />
                <div className="container" style={{ paddingTop: '2rem' }}>Order not found</div>
            </>
        );
    }

    const hasDeliveryLocation = order.lat && order.lng;
    const canTrackRider = ['accepted', 'out-for-delivery'].includes(order.status);

    return (
        <>
            <Navbar />
            <div className="container" style={{ maxWidth: '900px', margin: '2rem auto', paddingBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h1>Track Order #{order._id.slice(-6)}</h1>
                    <button onClick={() => navigate('/my-orders')} className="btn-secondary">
                        ← Back
                    </button>
                </div>

                {/* Order Status */}
                <div className="card" style={{ marginBottom: '1.5rem', padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h3 style={{ margin: '0 0 0.5rem 0' }}>Order Status</h3>
                            <span className={`status-badge ${order.status}`} style={{ fontSize: '1rem' }}>
                                {order.status}
                            </span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.9rem', color: 'var(--text-sub)' }}>Delivery Slot</div>
                            <div style={{ fontWeight: '500' }}>
                                {order.deliverySlot} • {new Date(order.deliveryDate).toLocaleDateString()}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Live Tracking */}
                {canTrackRider && riderLocation && (
                    <div className="card" style={{ marginBottom: '1.5rem', padding: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h3 style={{ margin: 0 }}>🚴 Live Tracking</h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <div style={{
                                        width: '8px',
                                        height: '8px',
                                        borderRadius: '50%',
                                        backgroundColor: isLive ? '#22c55e' : '#94a3b8',
                                        animation: isLive ? 'pulse 2s infinite' : 'none'
                                    }}></div>
                                    <span style={{ fontSize: '0.9rem', color: 'var(--text-sub)' }}>
                                        {isLive ? 'Live' : 'Last seen'}: {getTimeSinceUpdate()}
                                    </span>
                                </div>
                                <button
                                    onClick={fetchRiderLocation}
                                    disabled={refreshing}
                                    className="btn-secondary"
                                    style={{
                                        fontSize: '0.85rem',
                                        padding: '0.4rem 0.8rem',
                                        opacity: refreshing ? 0.6 : 1,
                                        cursor: refreshing ? 'wait' : 'pointer'
                                    }}
                                >
                                    {refreshing ? '🔄' : '↻'} Refresh
                                </button>
                            </div>
                        </div>

                        {hasDeliveryLocation && (
                            <div style={{ height: '400px', width: '100%', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                                <MapContainer
                                    key={`${riderLocation.lat}-${riderLocation.lng}-${order.lat}-${order.lng}`}
                                    center={[riderLocation.lat, riderLocation.lng]}
                                    zoom={13}
                                    style={{ height: '100%', width: '100%' }}
                                >
                                    <TileLayer
                                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                    />
                                    {/* Rider marker */}
                                    <Marker position={[riderLocation.lat, riderLocation.lng]} icon={riderIcon}>
                                        <Popup>📍 Rider's Current Location</Popup>
                                    </Marker>
                                    {/* Delivery location marker */}
                                    <Marker position={[order.lat, order.lng]} icon={deliveryIcon}>
                                        <Popup>🏠 Your Delivery Location</Popup>
                                    </Marker>
                                    {/* Line connecting them */}
                                    <Polyline
                                        positions={[[riderLocation.lat, riderLocation.lng], [order.lat, order.lng]]}
                                        color="#3b82f6"
                                        weight={3}
                                        opacity={0.6}
                                        dashArray="10, 10"
                                    />
                                </MapContainer>
                            </div>
                        )}
                    </div>
                )}

                {/* Order Details */}
                <div className="card" style={{ padding: '1.5rem' }}>
                    <h3 style={{ marginTop: 0 }}>Order Details</h3>
                    {order.productId && (
                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                            <img
                                src={order.productId.image}
                                alt={order.productId.name}
                                style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '0.5rem' }}
                            />
                            <div>
                                <h4 style={{ margin: '0 0 0.5rem 0' }}>{order.productId.name}</h4>
                                <p style={{ margin: '0 0 0.5rem 0', color: 'var(--text-sub)' }}>
                                    Quantity: {order.quantity}
                                </p>
                                <p style={{ margin: 0, fontWeight: '600', fontSize: '1.1rem' }}>
                                    Total: ₹{order.total.toLocaleString('en-IN')}
                                </p>
                            </div>
                        </div>
                    )}

                    {order.address && (
                        <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '0.5rem', marginBottom: '1rem' }}>
                            <div style={{ fontWeight: '500', marginBottom: '0.5rem' }}>Delivery Address</div>
                            <div style={{ color: 'var(--text-sub)' }}>{order.address}</div>
                        </div>
                    )}

                    {order.riderId && (
                        <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '0.5rem' }}>
                            <div style={{ fontWeight: '500', marginBottom: '0.5rem' }}>Rider Details</div>
                            <div style={{ color: 'var(--text-sub)' }}>
                                {order.riderId.name} • {order.riderId.vehicle_type}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
            `}</style>
        </>
    );
};

export default TrackOrder;
