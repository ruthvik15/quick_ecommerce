package com.ecommerce.rider.ui.main

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.ecommerce.rider.data.models.DashboardStats
import com.ecommerce.rider.utils.Resource

@Composable
fun DashboardScreen(
    viewModel: MainViewModel,
    onNavigateToOrders: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    val dashboardStats by viewModel.dashboardStats.collectAsStateWithLifecycle()
    var selectedTab by remember { mutableStateOf(0) }

    LaunchedEffect(Unit) {
        viewModel.loadDashboardStats()
    }

    Column(modifier = modifier.fillMaxSize()) {
        // Top Bar
        TopAppBar(
            title = { Text("Rider Dashboard") },
            actions = {
                IconButton(
                    onClick = {
                        viewModel.loadDashboardStats()
                    }
                ) {
                    Icon(Icons.Default.Refresh, contentDescription = "Refresh")
                }
            }
        )

        when (dashboardStats) {
            is Resource.Loading<*> -> {
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator()
                }
            }
            is Resource.Success<DashboardStats> -> {
                val data = dashboardStats.data
                Column(modifier = Modifier.fillMaxSize()) {
                    // Stats Section
                    LazyColumn(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        item {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(bottom = 16.dp),
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                StatCard(
                                    title = "Today's Deliveries",
                                    value = data?.todaysOrderCount?.toString() ?: "0",
                                    modifier = Modifier
                                        .weight(1f)
                                        .height(100.dp)
                                )
                                StatCard(
                                    title = "New Requests",
                                    value = data?.orderRequestCount?.toString() ?: "0",
                                    modifier = Modifier
                                        .weight(1f)
                                        .height(100.dp)
                                )
                                StatCard(
                                    title = "Total Completed",
                                    value = data?.rider?.numberOfOrders?.toString() ?: "0",
                                    modifier = Modifier
                                        .weight(1f)
                                        .height(100.dp)
                                )
                            }
                        }
                    }

                    // Tab Section
                    TabRow(
                        selectedTabIndex = selectedTab
                    ) {
                        listOf("Pending", "Accepted", "History").forEachIndexed { index, title ->
                            Tab(
                                selected = selectedTab == index,
                                onClick = { selectedTab = index },
                                text = { Text(title) }
                            )
                        }
                    }

                    // Orders Section (placeholder)
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(16.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "Orders content for ${listOf("Pending", "Accepted", "History")[selectedTab]} tab",
                            style = MaterialTheme.typography.bodyLarge
                        )
                    }
                }
            }
            is Resource.Error<*> -> {
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = dashboardStats.message ?: "Error loading dashboard",
                        color = MaterialTheme.colorScheme.error
                    )
                }
            }
        }
    }
}

@Composable
fun StatCard(
    title: String,
    value: String,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier,
        elevation = CardDefaults.cardElevation(4.dp),
        shape = RoundedCornerShape(12.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(12.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Text(
                text = value,
                style = MaterialTheme.typography.headlineMedium,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.primary
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = title,
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.align(Alignment.CenterHorizontally)
            )
        }
    }
}
