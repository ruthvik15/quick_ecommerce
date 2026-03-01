const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const endpoints = {
    auth: {
        login: `${API_BASE_URL}/login`,
        signup: `${API_BASE_URL}/signup`,
        logout: `${API_BASE_URL}/logout`,
        me: `${API_BASE_URL}/me`,
    },
    products: {
        getAll: `${API_BASE_URL}/product/all`,
        detail: (id) => `${API_BASE_URL}/product/${id}`,
        search: `${API_BASE_URL}/search`,
        searchSuggestions: `${API_BASE_URL}/search-suggestions`,
        addReview: `${API_BASE_URL}/product/review`,
        base: API_BASE_URL,
    },
    cart: {
        getCart: `${API_BASE_URL}/cart`,
        addToCart: `${API_BASE_URL}/cart/add`,
        removeFromCart: `${API_BASE_URL}/cart/remove`,
        increaseQty: `${API_BASE_URL}/cart/increase`,
        decreaseQty: `${API_BASE_URL}/cart/decrease`,
    },
    checkout: {
        getCheckoutData: `${API_BASE_URL}/checkout`,
        processCheckout: `${API_BASE_URL}/checkout/process`,
        verifyPayment: `${API_BASE_URL}/checkout/verify-payment`,
        orderSuccess: `${API_BASE_URL}/checkout/orders/success`,
    },
    orders: {
        trackOrders: `${API_BASE_URL}/trackorders`,
        trackOrderDetail: (id) => `${API_BASE_URL}/trackorders/${id}`,
        cancelOrder: `${API_BASE_URL}/cancel-order`,
        riderLocation: (id) => `${API_BASE_URL}/orders/${id}/rider-location`,
    },
    seller: {
        sellerDashboard: `${API_BASE_URL}/seller/dashboard`,
        addProduct: `${API_BASE_URL}/seller/product/add`,
        stopProduct: (id) => `${API_BASE_URL}/seller/product/stop/${id}`,
        resumeProduct: (id) => `${API_BASE_URL}/seller/product/resume/${id}`,
        updatePrice: (id) => `${API_BASE_URL}/seller/product/update-price/${id}`,
        updateQuantity: (id) => `${API_BASE_URL}/seller/product/update-quantity/${id}`,
        deleteProduct: (id) => `${API_BASE_URL}/seller/product/delete/${id}`,
        heatmap: (sellerId, productId) => `${API_BASE_URL}/seller/${sellerId}/product/${productId}/heatmap`,
        dashboardTrackSection: `${API_BASE_URL}/seller/dashboard-track-section`,
    },
    rider: {
        riderDashboard: `${API_BASE_URL}/rider/dashboard`,
        pendingOrders: `${API_BASE_URL}/rider/orders/pending`,
        todayOrders: `${API_BASE_URL}/rider/orders/today`,
        acceptedOrders: `${API_BASE_URL}/rider/orders/accepted`,
        historyOrders: `${API_BASE_URL}/rider/orders/history`,
        acceptOrder: `${API_BASE_URL}/rider/orders/accept`,
        rejectOrder: `${API_BASE_URL}/rider/orders/reject`,
        outForDelivery: `${API_BASE_URL}/rider/orders/out-for-delivery`,
        completeOrder: `${API_BASE_URL}/rider/orders/complete`,
        updateStatus: (id) => `${API_BASE_URL}/rider/orders/${id}/status`,
        orderDetail: (id) => `${API_BASE_URL}/rider/orders/details/${id}`,
        updateLocation: `${API_BASE_URL}/rider/update-location`,
    }
};

export default endpoints;
