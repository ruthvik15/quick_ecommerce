package com.ecommerce.rider.utils

import android.content.Context
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import dagger.hilt.android.qualifiers.ApplicationContext
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class PreferencesManager @Inject constructor(
    @ApplicationContext private val context: Context
) {
    private val masterKey = MasterKey.Builder(context)
        .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
        .build()

    private val sharedPreferences = EncryptedSharedPreferences.create(
        context,
        "rider_secure_prefs",
        masterKey,
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
    )

    fun saveAuthToken(token: String) {
        sharedPreferences.edit().putString(Constants.PREF_AUTH_TOKEN, token).apply()
    }

    fun getAuthToken(): String? {
        return sharedPreferences.getString(Constants.PREF_AUTH_TOKEN, null)
    }

    fun saveUserInfo(email: String, name: String) {
        sharedPreferences.edit()
            .putString(Constants.PREF_USER_EMAIL, email)
            .putString(Constants.PREF_USER_NAME, name)
            .apply()
    }

    fun getUserEmail(): String? {
        return sharedPreferences.getString(Constants.PREF_USER_EMAIL, null)
    }

    fun getUserName(): String? {
        return sharedPreferences.getString(Constants.PREF_USER_NAME, null)
    }

    fun isLoggedIn(): Boolean {
        return !getAuthToken().isNullOrEmpty()
    }

    fun clearAuthData() {
        sharedPreferences.edit().clear().apply()
    }

    fun saveLastLocationSync(timestamp: Long) {
        sharedPreferences.edit().putLong(Constants.PREF_LAST_LOCATION_SYNC, timestamp).apply()
    }

    fun getLastLocationSync(): Long {
        return sharedPreferences.getLong(Constants.PREF_LAST_LOCATION_SYNC, 0L)
    }
}
