const API_BASE_URL = "http://localhost:3000";

const endpoints = {
    auth: {
        login: `${API_BASE_URL}/login`,
        signup: `${API_BASE_URL}/signup`,
        logout: `${API_BASE_URL}/logout`,
        profile: `${API_BASE_URL}/profile`,
    },
    products: {
        getAll: `${API_BASE_URL}/product/all`,
        detail: `${API_BASE_URL}/product`, // UI adds /id
        search: `${API_BASE_URL}/search`,  // UI adds ?searchQuery=...
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
        trackOrderDetail: `${API_BASE_URL}/order`, // UI adds /id
        cancelOrder: `${API_BASE_URL}/cancel-order`,
    },
    seller: {
        sellerDashboard: `${API_BASE_URL}/seller/dashboard`,
        addProduct: `${API_BASE_URL}/seller/product/add`,
        stopProduct: `${API_BASE_URL}/seller/product/stop`, // UI adds /id
        updatePrice: `${API_BASE_URL}/seller/product/update-price`, // UI adds /id
        updateQuantity: `${API_BASE_URL}/seller/product/update-quantity`, // UI adds /id
        heatmap: `${API_BASE_URL}/seller`, // Complex path
    },
    rider: {
        riderDashboard: `${API_BASE_URL}/rider/dashboard`,
        pendingOrders: `${API_BASE_URL}/rider/orders/pending`,
        todayOrders: `${API_BASE_URL}/rider/orders/today`,
        historyOrders: `${API_BASE_URL}/rider/orders/history`,
        acceptOrder: `${API_BASE_URL}/rider/order/accept`,
        rejectOrder: `${API_BASE_URL}/rider/order/reject`,
        outForDelivery: `${API_BASE_URL}/rider/order/out-for-delivery`,
        completeOrder: `${API_BASE_URL}/rider/order/complete`,
        updateStatus: `${API_BASE_URL}/rider/order`, // UI adds /id/status
    }
};

export default endpoints;
