package com.ecommerce.rider.data.repository

import com.ecommerce.rider.data.api.ApiService
import com.ecommerce.rider.data.models.*
import com.ecommerce.rider.utils.Resource
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class OrderRepository @Inject constructor(
    private val apiService: ApiService
) {
    
    suspend fun getDashboardStats(): Resource<DashboardStats> {
        return withContext(Dispatchers.IO) {
            try {
                val response = apiService.getDashboard()
                if (response.isSuccessful && response.body() != null) {
                    Resource.Success(response.body()!!)
                } else {
                    Resource.Error(response.message() ?: "Failed to fetch dashboard")
                }
            } catch (e: Exception) {
                Resource.Error(e.message ?: "Network error")
            }
        }
    }
    
    suspend fun getPendingOrders(): Resource<OrdersResponse> {
        return withContext(Dispatchers.IO) {
            try {
                val response = apiService.getPendingOrders()
                if (response.isSuccessful && response.body() != null) {
                    Resource.Success(response.body()!!)
                } else {
                    Resource.Error("Failed to fetch pending orders")
                }
            } catch (e: Exception) {
                Resource.Error(e.message ?: "Network error")
            }
        }
    }
    
    suspend fun getAcceptedOrders(): Resource<OrdersResponse> {
        return withContext(Dispatchers.IO) {
            try {
                val response = apiService.getAcceptedOrders()
                if (response.isSuccessful && response.body() != null) {
                    Resource.Success(response.body()!!)
                } else {
                    Resource.Error("Failed to fetch accepted orders")
                }
            } catch (e: Exception) {
                Resource.Error(e.message ?: "Network error")
            }
        }
    }
    
    suspend fun getCompletedOrders(): Resource<OrdersResponse> {
        return withContext(Dispatchers.IO) {
            try {
                val response = apiService.getCompletedOrders()
                if (response.isSuccessful && response.body() != null) {
                    Resource.Success(response.body()!!)
                } else {
                    Resource.Error("Failed to fetch completed orders")
                }
            } catch (e: Exception) {
                Resource.Error(e.message ?: "Network error")
            }
        }
    }
    
    suspend fun getOrderDetails(orderId: String): Resource<OrderDetail> {
        return withContext(Dispatchers.IO) {
            try {
                val response = apiService.getOrderDetails(orderId)
                if (response.isSuccessful && response.body() != null && response.body()!!.success) {
                    Resource.Success(response.body()!!.order)
                } else {
                    Resource.Error("Order not found")
                }
            } catch (e: Exception) {
                Resource.Error(e.message ?: "Network error")
            }
        }
    }
    
    suspend fun acceptOrder(orderId: String): Resource<String> {
        return withContext(Dispatchers.IO) {
            try {
                val response = apiService.acceptOrder(OrderActionRequest(orderId))
                if (response.isSuccessful && response.body() != null && response.body()!!.success) {
                    Resource.Success("Order accepted successfully")
                } else {
                    Resource.Error(response.body()?.error ?: "Failed to accept order")
                }
            } catch (e: Exception) {
                Resource.Error(e.message ?: "Network error")
            }
        }
    }
    
    suspend fun rejectOrder(orderId: String): Resource<String> {
        return withContext(Dispatchers.IO) {
            try {
                val response = apiService.rejectOrder(OrderActionRequest(orderId))
                if (response.isSuccessful && response.body() != null && response.body()!!.success) {
                    Resource.Success("Order rejected")
                } else {
                    Resource.Error("Failed to reject order")
                }
            } catch (e: Exception) {
                Resource.Error(e.message ?: "Network error")
            }
        }
    }
    
    suspend fun markOutForDelivery(orderId: String): Resource<String> {
        return withContext(Dispatchers.IO) {
            try {
                val response = apiService.markOutForDelivery(OrderActionRequest(orderId))
                if (response.isSuccessful && response.body() != null && response.body()!!.success) {
                    Resource.Success("Order marked out for delivery")
                } else {
                    Resource.Error("Failed to update status")
                }
            } catch (e: Exception) {
                Resource.Error(e.message ?: "Network error")
            }
        }
    }
    
    suspend fun markDelivered(orderId: String): Resource<String> {
        return withContext(Dispatchers.IO) {
            try {
                val response = apiService.markDelivered(OrderActionRequest(orderId))
                if (response.isSuccessful && response.body() != null && response.body()!!.success) {
                    Resource.Success("Order delivered successfully")
                } else {
                    Resource.Error("Failed to mark delivered")
                }
            } catch (e: Exception) {
                Resource.Error(e.message ?: "Network error")
            }
        }
    }
    
    suspend fun updateLocation(latitude: Double, longitude: Double): Resource<String> {
        return withContext(Dispatchers.IO) {
            try {
                val response = apiService.updateLocation(LocationUpdateRequest(latitude, longitude))
                if (response.isSuccessful && response.body() != null) {
                    Resource.Success(response.body()!!.message)
                } else {
                    Resource.Error("Failed to update location")
                }
            } catch (e: Exception) {
                Resource.Error(e.message ?: "Location update failed")
            }
        }
    }
}
