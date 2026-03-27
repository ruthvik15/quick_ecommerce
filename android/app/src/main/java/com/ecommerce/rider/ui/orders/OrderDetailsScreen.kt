package com.ecommerce.rider.ui.orders

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Call
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.ecommerce.rider.data.models.OrderDetail
import com.ecommerce.rider.utils.Resource

@Composable
fun OrderDetailsScreen(
    viewModel: OrderDetailsViewModel,
    orderId: String,
    onNavigateBack: () -> Unit,
    onCallCustomer: (String) -> Unit,
    onNavigate: (Double, Double) -> Unit,
    modifier: Modifier = Modifier
) {
    val orderDetails by viewModel.orderDetails.collectAsStateWithLifecycle()
    val orderAction by viewModel.orderAction.collectAsStateWithLifecycle()

    LaunchedEffect(Unit) {
        viewModel.loadOrderDetails(orderId)
    }

    Column(modifier = modifier.fillMaxSize()) {
        // Top Bar
        TopAppBar(
            title = { Text("Order Details") },
            navigationIcon = {
                IconButton(onClick = onNavigateBack) {
                    Text("← Back")
                }
            }
        )

        when (orderDetails) {
            is Resource.Loading<*> -> {
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator()
                }
            }
            is Resource.Success<OrderDetail> -> {
                val order = orderDetails.data
                order?.let {
                    LazyColumn(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        item {
                            OrderHeaderCard(order)
                        }
                        item {
                            OrderDetailsCard(order)
                        }
                        item {
                            ActionButtonsSection(
                                order = order,
                                isLoading = orderAction is Resource.Loading<*>,
                                onCall = { onCallCustomer(it.phoneNumber ?: "") },
                                onNavigate = {
                                    if (it.latitude != null && it.longitude != null) {
                                        onNavigate(it.latitude, it.longitude)
                                    }
                                },
                                onOutForDelivery = {
                                    viewModel.markOutForDelivery(orderId)
                                },
                                onDelivered = {
                                    viewModel.markDelivered(orderId)
                                }
                            )
                        }
                    }
                }
            }
            is Resource.Error<*> -> {
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = orderDetails.message ?: "Error loading order",
                        color = MaterialTheme.colorScheme.error
                    )
                }
            }
        }
    }
}

@Composable
fun OrderHeaderCard(order: OrderDetail) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(4.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(
                text = order.product?.name ?: "Order",
                style = MaterialTheme.typography.headlineSmall,
                fontWeight = FontWeight.Bold
            )
            Spacer(modifier = Modifier.height(8.dp))
            StatusBadge(status = order.status)
        }
    }
}

@Composable
fun OrderDetailsCard(order: OrderDetail) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(2.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            DetailRow("Customer", order.user?.name ?: "N/A")
            DetailRow("Address", order.address)
            DetailRow("Phone", order.phoneNumber ?: "N/A")
            DetailRow("Delivery Slot", order.deliverySlot)
            DetailRow("Payment", order.paymentMode)
            DetailRow("Amount", "₹${order.amount ?: 0}")
        }
    }
}

@Composable
fun DetailRow(label: String, value: String) {
    Column(modifier = Modifier.padding(vertical = 4.dp)) {
        Text(
            text = label,
            style = MaterialTheme.typography.labelSmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        Text(
            text = value,
            style = MaterialTheme.typography.bodyMedium,
            fontWeight = FontWeight.SemiBold
        )
    }
}

@Composable
fun StatusBadge(status: String) {
    val color = when (status) {
        "accepted" -> MaterialTheme.colorScheme.tertiary
        "out-for-delivery" -> MaterialTheme.colorScheme.secondary
        "delivered" -> MaterialTheme.colorScheme.primary
        else -> MaterialTheme.colorScheme.outline
    }

    Surface(
        color = color,
        shape = RoundedCornerShape(8.dp),
        modifier = Modifier.width(120.dp)
    ) {
        Text(
            text = status.uppercase(),
            style = MaterialTheme.typography.labelSmall,
            color = MaterialTheme.colorScheme.onPrimary,
            modifier = Modifier.padding(8.dp)
        )
    }
}

@Composable
fun ActionButtonsSection(
    order: OrderDetail,
    isLoading: Boolean,
    onCall: (OrderDetail) -> Unit,
    onNavigate: (OrderDetail) -> Unit,
    onOutForDelivery: () -> Unit,
    onDelivered: () -> Unit
) {
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Button(
                onClick = { onCall(order) },
                modifier = Modifier.weight(1f),
                enabled = !isLoading
            ) {
                Icon(Icons.Default.Call, contentDescription = null)
                Spacer(modifier = Modifier.width(8.dp))
                Text("Call")
            }
            Button(
                onClick = { onNavigate(order) },
                modifier = Modifier.weight(1f),
                enabled = !isLoading && order.latitude != null && order.longitude != null
            ) {
                Icon(Icons.Default.LocationOn, contentDescription = null)
                Spacer(modifier = Modifier.width(8.dp))
                Text("Navigate")
            }
        }

        AnimatedVisibility(visible = order.status == "accepted") {
            Button(
                onClick = onOutForDelivery,
                modifier = Modifier.fillMaxWidth(),
                enabled = !isLoading
            ) {
                Text("Out for Delivery")
            }
        }

        AnimatedVisibility(visible = order.status == "out-for-delivery") {
            Button(
                onClick = onDelivered,
                modifier = Modifier.fillMaxWidth(),
                enabled = !isLoading,
                colors = ButtonDefaults.buttonColors(
                    containerColor = MaterialTheme.colorScheme.tertiary
                )
            ) {
                Text("Mark Delivered")
            }
        }
    }
}
