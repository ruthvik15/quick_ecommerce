package com.ecommerce.rider.services

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import androidx.core.app.ActivityCompat
import androidx.hilt.work.HiltWorker
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.ecommerce.rider.data.repository.OrderRepository
import com.ecommerce.rider.utils.PreferencesManager
import com.google.android.gms.location.LocationServices
import com.google.android.gms.location.Priority
import com.google.android.gms.tasks.CancellationTokenSource
import dagger.assisted.Assisted
import dagger.assisted.AssistedInject
import kotlinx.coroutines.tasks.await

@HiltWorker
class LocationWorker @AssistedInject constructor(
    @Assisted context: Context,
    @Assisted params: WorkerParameters,
    private val orderRepository: OrderRepository,
    private val preferencesManager: PreferencesManager
) : CoroutineWorker(context, params) {

    override suspend fun doWork(): Result {
        return try {
            if (ActivityCompat.checkSelfPermission(
                    applicationContext,
                    Manifest.permission.ACCESS_FINE_LOCATION
                ) == PackageManager.PERMISSION_GRANTED
            ) {
                val fusedLocationClient = LocationServices.getFusedLocationProviderClient(applicationContext)
                val location = fusedLocationClient.getCurrentLocation(
                    Priority.PRIORITY_BALANCED_POWER_ACCURACY,
                    CancellationTokenSource().token
                ).await()

                if (location != null) {
                    val result = orderRepository.updateLocation(location.latitude, location.longitude)
                    if (result is com.ecommerce.rider.utils.Resource.Success) {
                        preferencesManager.saveLastLocationSync(System.currentTimeMillis())
                        Result.success()
                    } else {
                        Result.retry()
                    }
                } else {
                    Result.retry()
                }
            } else {
                Result.failure()
            }
        } catch (e: Exception) {
            e.printStackTrace()
            Result.retry()
        }
    }
}
