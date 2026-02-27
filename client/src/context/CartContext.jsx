import { createContext, useState, useContext, useEffect } from "react";
import endpoints from "../api/endpoints";
import { AuthContext } from "./AuthContext";

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const { user } = useContext(AuthContext);
    const [cartCount, setCartCount] = useState(0);
    const [cartItems, setCartItems] = useState({});

    const fetchCart = async () => {
        if (!user || user.role !== 'user') {
            setCartCount(0);
            setCartItems({});
            return;
        }

        try {
            const res = await fetch(endpoints.cart.getCart, { credentials: "include" });
            const data = await res.json();
            if (data.success && data.cart) {
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
    };

    useEffect(() => {
        fetchCart();
    }, [user]);

    useEffect(() => {
        setCartCount(Object.keys(cartItems).length);
    }, [cartItems]);
    const updateItemQuantity = (productId, newQty) => {
        setCartItems(prev => {
            const updated = { ...prev };
            if (newQty <= 0) {
                delete updated[productId];
            } else {
                updated[productId] = newQty;
            }
            return updated;
        });
    };

    return (
        <CartContext.Provider value={{ cartCount, cartItems, fetchCart, updateItemQuantity }}>
            {children}
        </CartContext.Provider>
    );
};
