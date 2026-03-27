package com.ecommerce.rider.data.api

import com.ecommerce.rider.utils.PreferencesManager
import okhttp3.Interceptor
import okhttp3.Response
import javax.inject.Inject

class AuthInterceptor @Inject constructor(
    private val preferencesManager: PreferencesManager
) : Interceptor {
    
    override fun intercept(chain: Interceptor.Chain): Response {
        val originalRequest = chain.request()
        val token = preferencesManager.getAuthToken()
        
        val request = if (!token.isNullOrEmpty()) {
            originalRequest.newBuilder()
                .header("Authorization", "Bearer $token")
                .header("Cookie", "token=$token")
                .build()
        } else {
            originalRequest
        }
        
        return chain.proceed(request)
    }
}
