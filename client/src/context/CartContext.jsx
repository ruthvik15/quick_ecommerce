import { createContext, useState, useContext, useEffect, useCallback } from "react";
import endpoints from "../api/endpoints";
import { AuthContext } from "./AuthContext";

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const { user } = useContext(AuthContext);
    const [cartCount, setCartCount] = useState(0);
    const [cartItems, setCartItems] = useState({});

    // FIXED: Use useCallback to prevent unnecessary re-renders and dependency issues
    const fetchCart = useCallback(async () => {
        // FIXED: Better role check - only regular users should have carts
        // Allow any user role except if explicitly checking that role is 'user'
        if (!user) {
            setCartCount(0);
            setCartItems({});
            return;
        }

        // Only non-seller, non-rider users should have carts
        if (user.role !== 'user') {
            setCartCount(0);
            setCartItems({});
            return;
        }

        try {
            const res = await fetch(endpoints.cart.getCart, { credentials: "include" });
            const data = await res.json();
            if (data.success && data.cart) {
                // Count number of distinct products
                setCartCount(data.cart.items.length);

                const itemsMap = {};
                data.cart.items.forEach(item => {
                    itemsMap[item.product._id] = item.quantity;
                });
                setCartItems(itemsMap);
            } else {
                setCartCount(0);
                setCartItems({});
            }
        } catch (err) {
            console.error("Error fetching cart:", err);
        }
    }, [user]);

    // FIXED: useEffect dependency now includes fetchCart from useCallback
    useEffect(() => {
        fetchCart();
    }, [fetchCart]);
    
    const updateItemQuantity = useCallback((productId, newQty) => {
        setCartItems(prev => {
            const updated = { ...prev };
            if (newQty <= 0) {
                delete updated[productId];
            } else {
                updated[productId] = newQty;
            }
            return updated;
        });
    }, []);

    return (
        <CartContext.Provider value={{ cartCount, cartItems, fetchCart, updateItemQuantity }}>
            {children}
        </CartContext.Provider>
    );
};
