import { useState, useEffect, useContext, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { AuthContext } from "../context/AuthContext";
import endpoints from "../api/endpoints";

const ProductHeatmap = () => {
    const { user, loading: authLoading } = useContext(AuthContext);
    const [products, setProducts] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [heatmapData, setHeatmapData] = useState(null);
    const [loading, setLoading] = useState(true);
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (authLoading) return;
        if (!user || user.role !== 'seller') {
            navigate('/login');
            return;
        }
        fetchProducts();
    }, [user, authLoading, navigate]);

    const fetchProducts = async () => {
        try {
            const res = await fetch(endpoints.seller.sellerDashboard, { credentials: "include" });
            if (res.status === 401) {
                navigate("/login");
                return;
            }
            const data = await res.json();
            if (data.success) {
                setProducts(data.products);
                if (data.products.length > 0) {
                    setSelectedProduct(data.products[0]._id);
                }
            }
        } catch (err) {
            console.error("Error fetching products", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (selectedProduct && user) {
            fetchHeatmapData(selectedProduct);
        }
    }, [selectedProduct, user]);

    const fetchHeatmapData = async (productId) => {
        try {
            const res = await fetch(endpoints.seller.heatmap(user._id, productId), { credentials: "include" });
            const data = await res.json();
            if (data.success) {
                setHeatmapData(data.blocks);
                renderHeatmap(data.blocks);
            }
        } catch (err) {
            console.error("Error fetching heatmap", err);
        }
    };

    const loadHeatmapPlugin = (callback) => {
        const heatScript = document.createElement('script');
        heatScript.src = 'https://unpkg.com/leaflet.heat/dist/leaflet-heat.js';
        heatScript.onload = () => {
            callback();
        };
        heatScript.onerror = () => {
            console.error("Failed to load heatmap plugin");
        };
        document.head.appendChild(heatScript);
    };

    const renderHeatmap = (blocks) => {
        // Wait for next tick to ensure DOM element exists
        setTimeout(() => {
            if (!mapRef.current) {
                return;
            }

            // Load Leaflet dynamically if not already loaded
            if (!window.L) {
                const leafletCSS = document.createElement('link');
                leafletCSS.rel = 'stylesheet';
                leafletCSS.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
                document.head.appendChild(leafletCSS);

                const leafletScript = document.createElement('script');
                leafletScript.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
                leafletScript.onload = () => {
                    loadHeatmapPlugin(() => drawMap(blocks));
                };
                leafletScript.onerror = () => {
                    console.error("Failed to load Leaflet");
                };
                document.head.appendChild(leafletScript);
            } else if (!window.L.heatLayer) {
                loadHeatmapPlugin(() => drawMap(blocks));
            } else {
                drawMap(blocks);
            }
        }, 100);
    };

    const drawMap = (blocks) => {
        if (!mapRef.current) {
            return;
        }

        // Clear previous map
        if (mapInstanceRef.current) {
            mapInstanceRef.current.remove();
        }

        const heatmapPoints = [];
        let maxCount = 0;
        let sumLat = 0, sumLng = 0, countPoints = 0;

        for (const key in blocks) {
            const count = blocks[key];
            if (count > 0) {
                const [lat, lng] = key.split(':').map(Number);
                const blockSize = 0.1;
                heatmapPoints.push([lat + blockSize / 2, lng + blockSize / 2, count]);
                if (count > maxCount) maxCount = count;
                sumLat += lat;
                sumLng += lng;
                countPoints++;
            }
        }

        if (heatmapPoints.length > 0) {
            const centerLat = sumLat / countPoints;
            const centerLng = sumLng / countPoints;
            
            const map = window.L.map(mapRef.current).setView([centerLat, centerLng], 11);

            window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap contributors'
            }).addTo(map);

            window.L.heatLayer(heatmapPoints, {
                radius: 40,
                blur: 25,
                max: maxCount,
                maxZoom: 12,
                minOpacity: 0.2,
                gradient: { 0.2: 'blue', 0.4: 'cyan', 0.7: 'yellow', 1.0: 'red' }
            }).addTo(map);

            heatmapPoints.forEach(p => {
                const [lat, lng, count] = p;
                window.L.circleMarker([lat, lng], { radius: 20, fillOpacity: 0, stroke: false })
                    .addTo(map)
                    .bindTooltip(`<b>Orders: ${count}</b>`);
            });

            mapInstanceRef.current = map;
        }
    };

    if (loading) return <><Navbar /><div className="container">Loading...</div></>;

    return (
        <>
            <Navbar />
            <div className="container dashboard-container">
                <div className="dashboard-header">
                    <div>
                        <h1>Product Heatmap</h1>
                        <p style={{ color: 'var(--text-sub)' }}>Orders in last 24 hours by location</p>
                    </div>
                    <button className="btn-secondary" onClick={() => navigate('/seller/dashboard')}>
                        ← Back to Dashboard
                    </button>
                </div>

                {products.length === 0 ? (
                    <div className="card">
                        <p>No products found.</p>
                    </div>
                ) : (
                    <>
                        <div className="form-group" style={{ maxWidth: '400px', marginBottom: '2rem' }}>
                            <label>Select Product</label>
                            <select 
                                value={selectedProduct || ''} 
                                onChange={(e) => setSelectedProduct(e.target.value)}
                                style={{ 
                                    width: '100%', 
                                    padding: '0.75rem', 
                                    borderRadius: '0.5rem',
                                    border: '1px solid var(--border)',
                                    fontSize: '1rem'
                                }}
                            >
                                {products.map(product => (
                                    <option key={product._id} value={product._id}>
                                        {product.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {heatmapData === null ? (
                            <div className="card">
                                <p>Loading heatmap data...</p>
                            </div>
                        ) : Object.keys(heatmapData).length === 0 ? (
                            <div className="card">
                                <p>No orders in last 24 hours for this product.</p>
                            </div>
                        ) : (
                            <div className="card" style={{ padding: 0, overflow: 'hidden', position: 'relative' }}>
                                <div 
                                    ref={mapRef} 
                                    style={{ 
                                        height: '600px', 
                                        width: '100%'
                                    }}
                                />
                                <div style={{
                                    position: 'absolute',
                                    bottom: '20px',
                                    right: '20px',
                                    background: 'rgba(255,255,255,0.95)',
                                    padding: '15px 20px',
                                    borderRadius: '8px',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                    zIndex: 1000
                                }}>
                                    <h4 style={{ margin: '0 0 8px 0', textAlign: 'center', fontSize: '0.9rem' }}>Order Intensity</h4>
                                    <div style={{ 
                                        width: '150px', 
                                        height: '20px', 
                                        background: 'linear-gradient(to right, blue, cyan, yellow, red)', 
                                        border: '1px solid #777',
                                        borderRadius: '4px'
                                    }} />
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginTop: '5px' }}>
                                        <span>Low</span>
                                        <span>High</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </>
    );
};

export default ProductHeatmap;
