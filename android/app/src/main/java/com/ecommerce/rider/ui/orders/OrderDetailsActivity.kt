package com.ecommerce.rider.ui.orders

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import com.ecommerce.rider.data.models.OrderDetail
import com.ecommerce.rider.ui.theme.RiderAppTheme
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class OrderDetailsActivity : ComponentActivity() {

    private val viewModel: OrderDetailsViewModel by viewModels()
    private var orderId: String? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        orderId = intent.getStringExtra("ORDER_ID")
        if (orderId == null) {
            finish()
            return
        }

        setContent {
            RiderAppTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    OrderDetailsScreen(
                        viewModel = viewModel,
                        orderId = orderId!!,
                        onNavigateBack = { onBackPressedDispatcher.onBackPressed() },
                        onCallCustomer = { phoneNumber ->
                            makePhoneCall(phoneNumber)
                        },
                        onNavigate = { latitude, longitude ->
                            openGoogleMaps(latitude, longitude)
                        }
                    )
                }
            }
        }
    }

    private fun makePhoneCall(phoneNumber: String) {
        val intent = Intent(Intent.ACTION_CALL).apply {
            data = Uri.parse("tel:$phoneNumber")
        }
        startActivity(intent)
    }

    private fun openGoogleMaps(latitude: Double, longitude: Double) {
        val uri = Uri.parse("google.navigation:q=$latitude,$longitude&mode=d")
        val intent = Intent(Intent.ACTION_VIEW, uri).apply {
            setPackage("com.google.android.apps.maps")
        }

        if (intent.resolveActivity(packageManager) != null) {
            startActivity(intent)
        } else {
            val webUri = Uri.parse("https://www.google.com/maps/dir/?api=1&destination=$latitude,$longitude")
            startActivity(Intent(Intent.ACTION_VIEW, webUri))
        }
    }
}
