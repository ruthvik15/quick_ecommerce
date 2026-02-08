import { createContext, useState, useEffect, useMemo } from "react";
import endpoints from "../api/endpoints";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkSession = async () => {
            try {
                const res = await fetch(endpoints.auth.profile, { credentials: "include" });

                // 1. Check if the request was actually successful (status 200-299)
                if (!res.ok) {
                    setUser(null);
                    setLoading(false);
                    return;
                }
                const data = await res.json();
                if (data.success) {
                    setUser(data.user);
                } else {
                    setUser(null);
                }
            } catch (err) {
                console.error("Session check failed:", err);
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        checkSession();
    }, []);

    const login = (userData) => {
        setUser(userData);
    };

    const logout = async () => {
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
    };

    const value = useMemo(() => ({
        user,
        login,
        logout,
        loading
    }), [user, loading]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
