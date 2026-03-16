package com.ecommerce.rider.utils

object Constants {
    // API Endpoints
    const val ENDPOINT_LOGIN = "auth/login"
    const val ENDPOINT_DASHBOARD = "rider/dashboard"
    const val ENDPOINT_PENDING_ORDERS = "rider/orders/pending"
    const val ENDPOINT_ACCEPTED_ORDERS = "rider/orders/accepted"
    const val ENDPOINT_HISTORY_ORDERS = "rider/orders/completed"
    const val ENDPOINT_ORDER_DETAILS = "rider/orders/details/{id}"
    const val ENDPOINT_ACCEPT_ORDER = "rider/orders/accept"
    const val ENDPOINT_REJECT_ORDER = "rider/orders/reject"
    const val ENDPOINT_OUT_FOR_DELIVERY = "rider/orders/out-for-delivery"
    const val ENDPOINT_COMPLETE_ORDER = "rider/orders/complete"
    const val ENDPOINT_UPDATE_LOCATION = "rider/update-location"

    // Preferences Keys
    const val PREF_AUTH_TOKEN = "auth_token"
    const val PREF_USER_EMAIL = "user_email"
    const val PREF_USER_NAME = "user_name"
    const val PREF_LAST_LOCATION_SYNC = "last_location_sync"

    // WorkManager Tags
    const val LOCATION_WORK_TAG = "location_tracking_work"
    const val LOCATION_WORK_NAME = "location_tracking_work_unique"

    // Location Tracking
    const val LOCATION_UPDATE_INTERVAL = 180_000L // 3 minutes in milliseconds
    const val LOCATION_UPDATE_FASTEST_INTERVAL = 60_000L // 1 minute
    const val LOCATION_TRACKING_NOTIFICATION_ID = 1001

    // Request Codes
    const val REQUEST_LOCATION_PERMISSION = 1001
    const val REQUEST_BACKGROUND_LOCATION_PERMISSION = 1002
    const val REQUEST_PHONE_CALL_PERMISSION = 1003
}
