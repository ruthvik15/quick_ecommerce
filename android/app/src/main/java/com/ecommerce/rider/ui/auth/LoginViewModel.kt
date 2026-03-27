package com.ecommerce.rider.ui.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.ecommerce.rider.data.models.LoginResponse
import com.ecommerce.rider.data.repository.AuthRepository
import com.ecommerce.rider.utils.Resource
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class LoginViewModel @Inject constructor(
    private val authRepository: AuthRepository
) : ViewModel() {

    private val _loginState = MutableStateFlow<Resource<LoginResponse>>(Resource.Loading())
    val loginState: StateFlow<Resource<LoginResponse>> = _loginState

    fun login(email: String, password: String) {
        _loginState.value = Resource.Loading()
        
        viewModelScope.launch {
            val result = authRepository.login(email, password)
            _loginState.value = result
        }
    }

    fun validateInput(email: String, password: String): String? {
        return when {
            email.isEmpty() -> "Email is required"
            password.isEmpty() -> "Password is required"
            !android.util.Patterns.EMAIL_ADDRESS.matcher(email).matches() -> "Invalid email format"
            password.length < 6 -> "Password must be at least 6 characters"
            else -> null
        }
    }
}
