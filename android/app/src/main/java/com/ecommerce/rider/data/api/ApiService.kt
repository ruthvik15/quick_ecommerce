package com.ecommerce.rider.data.api

import com.ecommerce.rider.data.models.*
import retrofit2.Response
import retrofit2.http.*

interface ApiService {
    
    @POST("auth/login")
    suspend fun login(@Body request: LoginRequest): Response<LoginResponse>
    
    @GET("rider/dashboard")
    suspend fun getDashboard(): Response<DashboardStats>
    
    @GET("rider/orders/pending")
    suspend fun getPendingOrders(): Response<OrdersResponse>
    
    @GET("rider/orders/accepted")
    suspend fun getAcceptedOrders(): Response<OrdersResponse>
    
    @GET("rider/orders/completed")
    suspend fun getCompletedOrders(): Response<OrdersResponse>
    
    @GET("rider/orders/details/{id}")
    suspend fun getOrderDetails(@Path("id") orderId: String): Response<OrderDetailsResponse>
    
    @POST("rider/orders/accept")
    suspend fun acceptOrder(@Body request: OrderActionRequest): Response<ApiResponse<Order>>
    
    @POST("rider/orders/reject")
    suspend fun rejectOrder(@Body request: OrderActionRequest): Response<ApiResponse<Any>>
    
    @POST("rider/orders/out-for-delivery")
    suspend fun markOutForDelivery(@Body request: OrderActionRequest): Response<ApiResponse<Any>>
    
    @POST("rider/orders/complete")
    suspend fun markDelivered(@Body request: OrderActionRequest): Response<ApiResponse<Any>>
    
    @POST("rider/update-location")
    suspend fun updateLocation(@Body request: LocationUpdateRequest): Response<LocationUpdateResponse>
}
