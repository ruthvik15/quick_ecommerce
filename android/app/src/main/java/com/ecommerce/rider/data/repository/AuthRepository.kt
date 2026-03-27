package com.ecommerce.rider.data.repository

import com.ecommerce.rider.data.api.ApiService
import com.ecommerce.rider.data.models.LoginRequest
import com.ecommerce.rider.data.models.LoginResponse
import com.ecommerce.rider.utils.PreferencesManager
import com.ecommerce.rider.utils.Resource
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AuthRepository @Inject constructor(
    private val apiService: ApiService,
    private val preferencesManager: PreferencesManager
) {
    
    suspend fun login(email: String, password: String): Resource<LoginResponse> {
        return withContext(Dispatchers.IO) {
            try {
                val response = apiService.login(LoginRequest(email, password))
                
                if (response.isSuccessful && response.body() != null) {
                    val loginResponse = response.body()!!
                    if (loginResponse.success) {
                        // Save auth data
                        preferencesManager.saveAuthToken(loginResponse.token)
                        preferencesManager.saveUserInfo(loginResponse.user.email, loginResponse.user.name)
                        Resource.Success(loginResponse)
                    } else {
                        Resource.Error("Login failed")
                    }
                } else {
                    Resource.Error("Invalid credentials")
                }
            } catch (e: Exception) {
                Resource.Error(e.message ?: "Network error")
            }
        }
    }
    
    fun logout() {
        preferencesManager.clearAuthData()
    }
    
    fun isLoggedIn(): Boolean {
        return preferencesManager.isLoggedIn()
    }
}
