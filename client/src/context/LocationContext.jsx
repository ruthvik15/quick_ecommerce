import { createContext, useState, useEffect } from "react";

export const LocationContext = createContext();

export const LocationProvider = ({ children }) => {
    const [selectedLocation, setSelectedLocation] = useState("hyderabad");
    const cities = ["hyderabad", "bengaluru", "mumbai", "delhi"];

    // Initialize from localStorage on mount
    useEffect(() => {
        const stored = localStorage.getItem('selectedCity');
        if (stored && cities.includes(stored)) {
            setSelectedLocation(stored);
        }
    }, []);

    // Update localStorage when location changes
    useEffect(() => {
        localStorage.setItem('selectedCity', selectedLocation);
    }, [selectedLocation]);

    return (
        <LocationContext.Provider value={{ selectedLocation, setSelectedLocation, cities }}>
            {children}
        </LocationContext.Provider>
    );
};
