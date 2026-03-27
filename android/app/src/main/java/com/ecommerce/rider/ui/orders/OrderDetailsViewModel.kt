package com.ecommerce.rider.ui.orders

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.ecommerce.rider.data.models.OrderDetail
import com.ecommerce.rider.data.repository.OrderRepository
import com.ecommerce.rider.utils.Resource
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class OrderDetailsViewModel @Inject constructor(
    private val orderRepository: OrderRepository
) : ViewModel() {

    private val _orderDetails = MutableStateFlow<Resource<OrderDetail>>(Resource.Loading())
    val orderDetails: StateFlow<Resource<OrderDetail>> = _orderDetails

    private val _orderAction = MutableStateFlow<Resource<String>>(Resource.Loading())
    val orderAction: StateFlow<Resource<String>> = _orderAction

    fun loadOrderDetails(orderId: String) {
        _orderDetails.value = Resource.Loading()
        viewModelScope.launch {
            _orderDetails.value = orderRepository.getOrderDetails(orderId)
        }
    }

    fun markOutForDelivery(orderId: String) {
        _orderAction.value = Resource.Loading()
        viewModelScope.launch {
            _orderAction.value = orderRepository.markOutForDelivery(orderId)
        }
    }

    fun markDelivered(orderId: String) {
        _orderAction.value = Resource.Loading()
        viewModelScope.launch {
            _orderAction.value = orderRepository.markDelivered(orderId)
        }
    }
}
