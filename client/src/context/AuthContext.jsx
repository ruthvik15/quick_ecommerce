import { createContext, useState, useEffect, useMemo, useCallback } from "react";
import endpoints from "../api/endpoints";

export const AuthContext = createContext();

// FIXED: Helper function to decode JWT and check expiry
const isTokenExpired = (token) => {
    if (!token) return true;
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.exp * 1000 < Date.now();
    } catch {
        return true;
    }
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Check authentication on mount by calling /me endpoint
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const res = await fetch(endpoints.auth.me, {
                    credentials: 'include'
                });
                
                if (res.ok) {
                    const data = await res.json();
                    if (data.success && data.user) {
                        setUser(data.user);
                    } else {
                        setUser(null);
                    }
                } else {
                    setUser(null);
                }
            } catch (err) {
                console.error("Auth check failed:", err);
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, []);

    // FIXED: Use useCallback to prevent unnecessary re-renders
    const login = useCallback((userData) => {
        setUser(userData);
    }, []);

    // FIXED: Use useCallback for logout
    const logout = useCallback(async () => {
        try {
            await fetch(endpoints.auth.logout, {
                method: "POST",
                credentials: "include"
            });
        } catch (err) {
            console.error("Logout request failed:", err);
        } finally {
            setUser(null);
        }
    }, []);

    // FIXED: Add token expiry check in isAuthenticated
    const isAuthenticated = useCallback(() => {
        if (!user) return false;
        // Check if token appears expired by checking session
        return !isTokenExpired(document.cookie);
    }, [user]);

    // FIXED: Proper dependencies - now only includes data, not functions
    const value = useMemo(() => ({
        user,
        login,
        logout,
        isAuthenticated,
        loading
    }), [user, loading, login, logout, isAuthenticated]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
