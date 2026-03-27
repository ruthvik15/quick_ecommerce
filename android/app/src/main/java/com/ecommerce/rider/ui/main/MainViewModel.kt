package com.ecommerce.rider.ui.main

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.ecommerce.rider.data.models.DashboardStats
import com.ecommerce.rider.data.models.Order
import com.ecommerce.rider.data.repository.AuthRepository
import com.ecommerce.rider.data.repository.OrderRepository
import com.ecommerce.rider.utils.Resource
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class MainViewModel @Inject constructor(
    private val orderRepository: OrderRepository,
    private val authRepository: AuthRepository
) : ViewModel() {

    private val _dashboardStats = MutableStateFlow<Resource<DashboardStats>>(Resource.Loading())
    val dashboardStats: StateFlow<Resource<DashboardStats>> = _dashboardStats

    private val _pendingOrders = MutableStateFlow<Resource<List<Pair<String, List<Order>>>>>(Resource.Loading())
    val pendingOrders: StateFlow<Resource<List<Pair<String, List<Order>>>>> = _pendingOrders

    private val _acceptedOrders = MutableStateFlow<Resource<List<Pair<String, List<Order>>>>>(Resource.Loading())
    val acceptedOrders: StateFlow<Resource<List<Pair<String, List<Order>>>>> = _acceptedOrders

    private val _historyOrders = MutableStateFlow<Resource<List<Pair<String, List<Order>>>>>(Resource.Loading())
    val historyOrders: StateFlow<Resource<List<Pair<String, List<Order>>>>> = _historyOrders

    private val _orderAction = MutableStateFlow<Resource<String>>(Resource.Loading())
    val orderAction: StateFlow<Resource<String>> = _orderAction

    fun loadDashboardStats() {
        _dashboardStats.value = Resource.Loading()
        viewModelScope.launch {
            _dashboardStats.value = orderRepository.getDashboardStats()
        }
    }

    fun loadPendingOrders() {
        _pendingOrders.value = Resource.Loading()
        viewModelScope.launch {
            val result = orderRepository.getPendingOrders()
            if (result is Resource.Success) {
                val ordersMap = result.data?.groupedOrders ?: emptyMap()
                _pendingOrders.value = Resource.Success(ordersMap.toList())
            } else {
                _pendingOrders.value = Resource.Error(result.message ?: "Failed to load orders")
            }
        }
    }

    fun loadAcceptedOrders() {
        _acceptedOrders.value = Resource.Loading()
        viewModelScope.launch {
            val result = orderRepository.getAcceptedOrders()
            if (result is Resource.Success) {
                val ordersMap = result.data?.groupedOrders ?: emptyMap()
                _acceptedOrders.value = Resource.Success(ordersMap.toList())
            } else {
                _acceptedOrders.value = Resource.Error(result.message ?: "Failed to load orders")
            }
        }
    }

    fun loadHistoryOrders() {
        _historyOrders.value = Resource.Loading()
        viewModelScope.launch {
            val result = orderRepository.getCompletedOrders()
            if (result is Resource.Success) {
                val ordersMap = result.data?.groupedOrders ?: emptyMap()
                _historyOrders.value = Resource.Success(ordersMap.toList())
            } else {
                _historyOrders.value = Resource.Error(result.message ?: "Failed to load orders")
            }
        }
    }

    fun acceptOrder(orderId: String) {
        _orderAction.value = Resource.Loading()
        viewModelScope.launch {
            _orderAction.value = orderRepository.acceptOrder(orderId)
        }
    }

    fun rejectOrder(orderId: String) {
        _orderAction.value = Resource.Loading()
        viewModelScope.launch {
            _orderAction.value = orderRepository.rejectOrder(orderId)
        }
    }

    fun logout() {
        authRepository.logout()
    }
}
