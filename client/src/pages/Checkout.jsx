import { useState, useEffect, useContext, useRef, useMemo } from "react";
import 'leaflet/dist/leaflet.css';
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Toast from "../components/Toast";
import { AuthContext } from "../context/AuthContext";
import endpoints from "../api/endpoints";
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
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

const LocationMarker = ({ position, setPosition }) => {
    const map = useMapEvents({
        click(e) {
            setPosition(e.latlng);
            map.flyTo(e.latlng, map.getZoom());
        },
    });

    return position === null ? null : (
        <Marker position={position}></Marker>
    );
};

// Helper function to get local date in YYYY-MM-DD format
const getTodayLocal = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const Checkout = () => {
    const { user, loading: authLoading } = useContext(AuthContext);
    const [cart, setCart] = useState(null);
    const [razorpayKeyId, setRazorpayKeyId] = useState("");
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);
    const [formData, setFormData] = useState({
        address: "",
        phone: "",
        paymentMethod: "online",
        latitude: 17.3850,
        longitude: 78.4867,
        deliveryDate: getTodayLocal(),
        deliverySlot: "10-12"
    });
    const [markerPosition, setMarkerPosition] = useState({ lat: 17.3850, lng: 78.4867 });

    const [cityCoords, setCityCoords] = useState({ lat: 17.3850, lng: 78.4867 });
    const [lastDelivery, setLastDelivery] = useState(null);

    const navigate = useNavigate();

    useEffect(() => {
        // Check auth and role
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

        // Load Razorpay Script
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.async = true;
        document.body.appendChild(script);

        const fetchCheckoutData = async () => {
            try {
                const res = await fetch(endpoints.checkout.getCheckoutData, { credentials: "include" });
                
                if (res.status === 401) {
                    navigate("/login");
                    return;
                }
                
                const data = await res.json();

                if (data.success) {
                    setCart(data.cart);
                    setRazorpayKeyId(data.razorpayKeyId);
                    setCityCoords(data.cityCoords);
                    setLastDelivery(data.lastDelivery);

                    // Default view to city coords
                    setMarkerPosition(data.cityCoords);

                    if (data.lastDelivery) {
                        setFormData(prev => ({
                            ...prev,
                            address: data.lastDelivery.address,
                            phone: data.lastDelivery.phone || data.user.phone || "",
                            latitude: data.lastDelivery.lat,
                            longitude: data.lastDelivery.lng
                        }));
                        setMarkerPosition({ lat: data.lastDelivery.lat, lng: data.lastDelivery.lng });
                    } else {
                        setFormData(prev => ({
                            ...prev,
                            phone: data.user.phone || ""
                        }));
                    }
                } else {
                    setToast({ message: data.error, type: "error" });
                    if (data.code === "LOCATION_MISMATCH") {
                        setTimeout(() => navigate("/cart"), 2000);
                    } else if (data.error === "Unauthorized") {
                        navigate("/login");
                    }
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchCheckoutData();

        return () => {
            if (document.body.contains(script)) {
                document.body.removeChild(script);
            }
        }
    }, [navigate, user, authLoading]);

    // Update formData when marker changes
    useEffect(() => {
        if (markerPosition) {
            setFormData(prev => ({
                ...prev,
                latitude: markerPosition.lat,
                longitude: markerPosition.lng
            }));
        }
    }, [markerPosition]);

    const useLastAddress = () => {
        if (lastDelivery) {
            setFormData(prev => ({
                ...prev,
                address: lastDelivery.address,
                latitude: lastDelivery.lat,
                longitude: lastDelivery.lng
            }));
            setMarkerPosition({ lat: lastDelivery.lat, lng: lastDelivery.lng });
        }
    };

    const [availableSlots, setAvailableSlots] = useState([]);

    const timeSlots = [
        { value: "10-12", label: "10 AM - 12 PM", startHour: 10 },
        { value: "12-2", label: "12 PM - 2 PM", startHour: 12 },
        { value: "2-4", label: "2 PM - 4 PM", startHour: 14 },
        { value: "4-6", label: "4 PM - 6 PM", startHour: 16 },
    ];

    useEffect(() => {
        const updateSlots = () => {
            const now = new Date();
            const currentHour = now.getHours();
            const selectedDate = new Date(formData.deliveryDate);
            const isToday = selectedDate.toDateString() === now.toDateString();

            const slots = timeSlots.map(slot => ({
                ...slot,
                available: !isToday || currentHour < slot.startHour
            }));

            setAvailableSlots(slots);

            // If currently selected slot is invalid, switch to first available
            const currentSlotValid = slots.find(s => s.value === formData.deliverySlot)?.available;
            if (!currentSlotValid) {
                const firstAvailable = slots.find(s => s.available);
                if (firstAvailable) {
                    setFormData(prev => ({ ...prev, deliverySlot: firstAvailable.value }));
                } else {
                    setFormData(prev => ({ ...prev, deliverySlot: "" })); // No slots available
                }
            }
        };

        updateSlots();
    }, [formData.deliveryDate]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handlePayment = async (e) => {
        e.preventDefault();

        try {
            const res = await fetch(endpoints.checkout.processCheckout, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
                credentials: "include"
            });
            const data = await res.json();

            if (formData.paymentMethod === "cod") {
                if (data.success) {
                    navigate("/order-success", { state: { fromCheckout: true } });
                } else {
                    setToast({ message: data.error || "Order failed", type: "error" });
                }
                return;
            }

            if (data.razorpayOrderId) {
                const options = {
                    key: razorpayKeyId || data.key,
                    amount: data.amount,
                    currency: "INR",
                    name: "QuickMart",
                    description: "Order Payment",
                    order_id: data.razorpayOrderId,
                    handler: async function (response) {
                        const verifyRes = await fetch(endpoints.checkout.verifyPayment, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                ...response,
                                ...formData
                            }),
                            credentials: "include"
                        });
                        const verifyData = await verifyRes.json();
                        if (verifyData.success) {
                            navigate("/order-success", { state: { fromCheckout: true } });
                        } else {
                            setToast({ message: "Payment verification failed", type: "error" });
                        }
                    },
                    prefill: {
                        name: user.name,
                        email: user.email,
                        contact: formData.phone
                    },
                    theme: {
                        color: "#6366f1"
                    }
                };

                const rzp1 = new window.Razorpay(options);
                rzp1.open();
            } else {
                // Handle errors from backend (e.g., failed to create order)
                setToast({ message: data.error || "Failed to initiate online payment", type: "error" });
            }

        } catch (err) {
            console.error("Checkout failed", err);
            setToast({ message: "Checkout failed. Please try again.", type: "error" });
        }
    };

    if (loading) return <><Navbar /><div className="container">Loading checkout...</div></>;

    return (
        <>
            <Navbar />
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
            <div className="container checkout-page">
                <h1>Checkout</h1>
                <div className="checkout-grid">
                    <div className="checkout-form-container">
                        <form onSubmit={handlePayment} className="checkout-form">
                            <h3>Delivery Details</h3>

                            <div className="form-group">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                    <label>Delivery Location (Click on map to select)</label>
                                    {lastDelivery && (
                                        <button
                                            type="button"
                                            onClick={useLastAddress}
                                            className="btn-secondary"
                                            style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem' }}
                                        >
                                            Use Last Order Location
                                        </button>
                                    )}
                                </div>
                                <div style={{ height: '300px', marginBottom: '1rem', borderRadius: '0.5rem', overflow: 'hidden', border: '1px solid var(--border)' }}>
                                    <MapContainer key={`${cityCoords.lat}-${cityCoords.lng}`} center={[cityCoords.lat, cityCoords.lng]} zoom={13} style={{ height: '100%', width: '100%' }}>
                                        <TileLayer
                                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                        />
                                        <LocationMarker position={markerPosition} setPosition={setMarkerPosition} />
                                    </MapContainer>
                                </div>
                                <div style={{ fontSize: '0.8rem', color: '#666', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between' }}>
                                    <span>Selected: {formData.latitude.toFixed(4)}, {formData.longitude.toFixed(4)}</span>
                                    <span style={{ color: 'var(--primary)', fontWeight: '500' }}>← Move marker to your exact door</span>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Full Address</label>
                                <textarea name="address" value={formData.address} onChange={handleChange} required placeholder="House No, Street, Landmark..." />
                            </div>
                            <div className="form-group">
                                <label>Phone</label>
                                <input name="phone" value={formData.phone} onChange={handleChange} required />
                            </div>
                            <div className="form-group">
                                <label>Delivery Date</label>
                                <input type="date" name="deliveryDate" min={getTodayLocal()} value={formData.deliveryDate} onChange={handleChange} required />
                            </div>
                            <div className="form-group">
                                <label>Time Slot</label>
                                <select name="deliverySlot" value={formData.deliverySlot} onChange={handleChange}>
                                    {availableSlots.map(slot => (
                                        <option key={slot.value} value={slot.value} disabled={!slot.available}>
                                            {slot.label} {!slot.available && "(Unavailable)"}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <h3>Payment Method</h3>
                            <div className="form-group payment-options">
                                <label className="payment-option">
                                    <input type="radio" name="paymentMethod" value="online" checked={formData.paymentMethod === "online"} onChange={handleChange} />
                                    <span>Online Payment (Razorpay)</span>
                                </label>
                                <label className="payment-option">
                                    <input type="radio" name="paymentMethod" value="cod" checked={formData.paymentMethod === "cod"} onChange={handleChange} />
                                    <span>Cash on Delivery</span>
                                </label>
                            </div>

                            <button type="submit" className="btn-primary" style={{ width: '100%' }}>Place Order</button>
                        </form>
                    </div>

                    <div className="order-summary">
                        <h3>Order Summary</h3>
                        {cart && cart.items.map(item => (
                            <div key={item._id} className="summary-item">
                                <span>{item.product.name} x {item.quantity}</span>
                                <span>₹{item.product.price * item.quantity}</span>
                            </div>
                        ))}
                        <div className="total-row">
                            <strong>Total</strong>
                            <strong>₹{cart ? cart.items.reduce((acc, item) => acc + (item.product.price * item.quantity), 0) : 0}</strong>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Checkout;
