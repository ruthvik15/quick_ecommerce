package com.ecommerce.rider.data.models

import com.google.gson.annotations.SerializedName

data class ApiResponse<T>(
    @SerializedName("success")
    val success: Boolean,
    
    @SerializedName("data")
    val data: T? = null,
    
    @SerializedName("message")
    val message: String? = null,
    
    @SerializedName("error")
    val error: String? = null
)

data class LoginRequest(
    @SerializedName("email")
    val email: String,
    
    @SerializedName("password")
    val password: String,
    
    @SerializedName("role")
    val role: String = "rider"
)

data class LoginResponse(
    @SerializedName("success")
    val success: Boolean,
    
    @SerializedName("token")
    val token: String,
    
    @SerializedName("user")
    val user: Rider,
    
    @SerializedName("role")
    val role: String,
    
    @SerializedName("redirectUrl")
    val redirectUrl: String?
)

data class Rider(
    @SerializedName("_id")
    val id: String,
    
    @SerializedName("name")
    val name: String,
    
    @SerializedName("email")
    val email: String,
    
    @SerializedName("phone")
    val phone: String?,
    
    @SerializedName("location")
    val location: String?,
    
    @SerializedName("vehicle_type")
    val vehicleType: String?,
    
    @SerializedName("no_of_orders")
    val numberOfOrders: Int = 0,
    
    @SerializedName("latitude")
    val latitude: Double?,
    
    @SerializedName("longitude")
    val longitude: Double?
)

data class DashboardStats(
    @SerializedName("success")
    val success: Boolean,
    
    @SerializedName("rider")
    val rider: Rider,
    
    @SerializedName("todaysOrderCount")
    val todaysOrderCount: Int,
    
    @SerializedName("orderRequestCount")
    val orderRequestCount: Int,
    
    @SerializedName("user")
    val user: Rider
)

data class Order(
    @SerializedName("_id")
    val id: String,
    
    @SerializedName("productName")
    val productName: String?,
    
    @SerializedName("userName")
    val userName: String?,
    
    @SerializedName("phoneNumber")
    val phoneNumber: String?,
    
    @SerializedName("address")
    val address: String,
    
    @SerializedName("userLocation")
    val userLocation: String?,
    
    @SerializedName("deliverySlot")
    val deliverySlot: String,
    
    @SerializedName("deliveryDate")
    val deliveryDate: String,
    
    @SerializedName("status")
    val status: String,
    
    @SerializedName("payment")
    val payment: String?,
    
    @SerializedName("paid")
    val paid: Boolean?,
    
    @SerializedName("amount")
    val amount: Double?,
    
    @SerializedName("latitude")
    val latitude: Double?,
    
    @SerializedName("longitude")
    val longitude: Double?
) {
    fun getPaymentMode(): String {
        return if (paid == true) "Prepaid" else payment ?: "COD"
    }
    
    fun getStatusColor(): String {
        return when (status) {
            "confirmed" -> "#2196F3"
            "accepted" -> "#FFC107"
            "out-for-delivery" -> "#FF9800"
            "delivered" -> "#4CAF50"
            else -> "#9E9E9E"
        }
    }
}

data class OrdersResponse(
    @SerializedName("success")
    val success: Boolean,
    
    @SerializedName("groupedOrders")
    val groupedOrders: Map<String, List<Order>>?,
    
    @SerializedName("groupedSlots")
    val groupedSlots: Map<String, List<Order>>?,
    
    @SerializedName("user")
    val user: Rider?,
    
    @SerializedName("status")
    val status: String?
)

data class OrderDetailsResponse(
    @SerializedName("success")
    val success: Boolean,
    
    @SerializedName("order")
    val order: OrderDetail
)

data class OrderDetail(
    @SerializedName("_id")
    val id: String,
    
    @SerializedName("product")
    val product: Product?,
    
    @SerializedName("user")
    val user: Customer?,
    
    @SerializedName("deliverySlot")
    val deliverySlot: String,
    
    @SerializedName("status")
    val status: String,
    
    @SerializedName("paymentMode")
    val paymentMode: String,
    
    @SerializedName("amount")
    val amount: Double?,
    
    @SerializedName("orderDate")
    val orderDate: String,
    
    @SerializedName("phoneNumber")
    val phoneNumber: String?,
    
    @SerializedName("latitude")
    val latitude: Double?,
    
    @SerializedName("longitude")
    val longitude: Double?,
    
    @SerializedName("address")
    val address: String
)

data class Product(
    @SerializedName("_id")
    val id: String,
    
    @SerializedName("name")
    val name: String,
    
    @SerializedName("price")
    val price: Double,
    
    @SerializedName("image")
    val image: String?,
    
    @SerializedName("description")
    val description: String?
)

data class Customer(
    @SerializedName("_id")
    val id: String,
    
    @SerializedName("name")
    val name: String,
    
    @SerializedName("email")
    val email: String?,
    
    @SerializedName("phone")
    val phone: String?,
    
    @SerializedName("address")
    val address: String?
)

data class OrderActionRequest(
    @SerializedName("orderId")
    val orderId: String
)

data class LocationUpdateRequest(
    @SerializedName("latitude")
    val latitude: Double,
    
    @SerializedName("longitude")
    val longitude: Double
)

data class LocationUpdateResponse(
    @SerializedName("message")
    val message: String
)
