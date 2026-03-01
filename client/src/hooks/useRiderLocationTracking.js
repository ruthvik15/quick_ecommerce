import { useEffect } from 'react';
import endpoints from '../api/endpoints';

/**
 * Custom hook for rider location tracking
 * Syncs to global clock (e.g., 3:00, 3:03, 3:06...) instead of component mount time
 * Works across all rider pages without duplicates
 */
const useRiderLocationTracking = () => {
    useEffect(() => {
        const SYNC_INTERVAL_MS = 180000; // 3 minutes
        const STORAGE_KEY = 'rider_last_location_sync';

        const updateLocation = async () => {
            if (!("geolocation" in navigator)) {
                console.warn("Geolocation not available");
                return;
            }

            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    try {
                        await fetch(endpoints.rider.updateLocation, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                latitude: position.coords.latitude,
                                longitude: position.coords.longitude
                            }),
                            credentials: "include"
                        });
                        
                        // Record sync time in localStorage for cross-page tracking
                        localStorage.setItem(STORAGE_KEY, Date.now().toString());
                        console.log("📍 Location updated at", new Date().toLocaleTimeString());
                    } catch (err) {
                        console.error("Location update failed:", err);
                    }
                },
                (error) => console.error("Geolocation error:", error),
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
        };

        // Calculate milliseconds until next global sync point
        const getMillisecondsUntilNextSync = () => {
            const now = Date.now();
            const lastSync = parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10);
            
            // If last sync was more than 3 minutes ago, sync immediately
            if (now - lastSync >= SYNC_INTERVAL_MS) {
                return 0;
            }
            
            // Calculate time remaining until next 3-minute mark
            const timeSinceLastSync = now - lastSync;
            return SYNC_INTERVAL_MS - timeSinceLastSync;
        };

        // Initial sync check
        const initialDelay = getMillisecondsUntilNextSync();
        
        if (initialDelay === 0) {
            // Sync immediately if needed
            updateLocation();
            
            // Then set up regular 3-minute interval
            const locationInterval = setInterval(updateLocation, SYNC_INTERVAL_MS);
            return () => clearInterval(locationInterval);
        } else {
            // Wait for next sync point, then start regular interval
            console.log(`⏰ Next location sync in ${Math.round(initialDelay / 1000)}s`);
            
            const initialTimeout = setTimeout(() => {
                updateLocation();
                const locationInterval = setInterval(updateLocation, SYNC_INTERVAL_MS);
                
                // Cleanup function will clear this interval
                return () => clearInterval(locationInterval);
            }, initialDelay);
            
            return () => clearTimeout(initialTimeout);
        }
    }, []);
};

export default useRiderLocationTracking;
