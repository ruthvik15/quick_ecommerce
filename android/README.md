# Android Rider Tracking App

A native Android application for delivery riders to manage orders and provide real-time location tracking for the ecommerce platform.

## 📱 Features

### ✅ Implemented Features
- **Authentication**: Secure login with JWT token storage
- **Dashboard**: Real-time statistics (today's deliveries, new requests, total completed)
- **Order Management**:
  - View pending orders (grouped by date)
  - Accept/Reject order requests
  - View accepted orders
  - Order history
  - Detailed order information with customer details
- **Location Tracking**:
  - Background location updates (every 3 minutes)
  - Battery-optimized tracking using WorkManager
  - Persistent location sync even when app is closed
- **Navigation**: 
  - View customer location on Google Maps
  - One-tap navigation to delivery address
- **Status Updates**:
  - Mark order "Out for Delivery"
  - Mark order "Delivered"
  - Real-time status sync with server
- **Communication**:
  - Direct call to customer
  - Phone permission management

## 🏗️ Architecture

This app follows **MVVM architecture with Repository pattern**:

```
ui/                 # Presentation Layer
├── auth/            # Login screen
├── main/            # Dashboard & navigation
├── orders/          # Order listing & details
└── splash/          # Splash screen

data/               # Data Layer
├── api/             # Retrofit API service
├── models/          # Data models
└── repository/      # Data repositories

services/           # Background Services
├── LocationTrackingService.kt  # Foreground service
└── LocationWorker.kt           # WorkManager periodic task

utils/              # Utilities
├── Constants.kt
├── PreferencesManager.kt
└── Extensions.kt
```

## 🛠️ Tech Stack

- **Language**: Kotlin
- **UI**: Material Design 3, ViewBinding
- **Networking**: Retrofit2, OkHttp3, Gson
- **Dependency Injection**: Hilt
- **Background Tasks**: WorkManager
- **Location**: Google Play Services Location API
- **Maps**: Google Maps SDK
- **Architecture**: MVVM, LiveData, ViewModel
- **Security**: EncryptedSharedPreferences

## 📋 Prerequisites

- Android Studio Hedgehog or later
- JDK 17
- Android SDK 24+ (Target SDK 34)
- Google Maps API Key

## 🚀 Setup Instructions

### 1. Clone the Repository
```bash
cd ecommerce/quick_ecommerce/android
```

### 2. Configure Google Maps API Key
1. Get API key from [Google Cloud Console](https://console.cloud.google.com/)
2. Open `app/src/main/AndroidManifest.xml`
3. Replace `YOUR_GOOGLE_MAPS_API_KEY_HERE` with your actual API key

```xml
<meta-data
    android:name="com.google.android.geo.API_KEY"
    android:value="YOUR_ACTUAL_API_KEY_HERE" />
```

### 3. Configure API Base URL
- **For Development (Emulator)**: Already configured to `http://10.0.2.2:5000/api/`
- **For Production**: Update `BASE_URL` in `app/build.gradle.kts`:

```kotlin
buildTypes {
    release {
        buildConfigField("String", "BASE_URL", "\"https://your-production-url.com/api/\"")
    }
}
```

### 4. Build the Project
```bash
./gradlew build
```

### 5. Run on Emulator/Device
```bash
./gradlew installDebug
```

Or use Android Studio: Run > Run 'app'

## 📝 Configuration

### Minimum Requirements
- **Min SDK**: 24 (Android 7.0) - covers 95%+ devices
- **Target SDK**: 34 (Android 14)
- **Compile SDK**: 34

### Permissions Required
- `ACCESS_FINE_LOCATION` - Precise location tracking
- `ACCESS_COARSE_LOCATION` - Approximate location
- `ACCESS_BACKGROUND_LOCATION` - Background location (Android 10+)
- `INTERNET` - Network requests
- `CALL_PHONE` - Direct calling to customers
- `FOREGROUND_SERVICE` - Background location service
- `FOREGROUND_SERVICE_LOCATION` - Location foreground service type

### Location Tracking Settings
```kotlin
// Configured in Constants.kt
LOCATION_UPDATE_INTERVAL = 180_000L        // 3 minutes
LOCATION_UPDATE_FASTEST_INTERVAL = 60_000L // 1 minute minimum
```

## 🧪 Testing

### Run Unit Tests
```bash
./gradlew test
```

### Run Instrumented Tests
```bash
./gradlew connectedAndroidTest
```

### Test Credentials (Development)
Use the same credentials as your web rider login.

## 📦 Building Release APK

### 1. Create Keystore (first time only)
```bash
keytool -genkey -v -keystore rider-app.keystore -alias rider-app -keyalg RSA -keysize 2048 -validity 10000
```

### 2. Build Signed Release
```bash
./gradlew assembleRelease
```

### 3. Find APK
```
app/build/outputs/apk/release/app-release.apk
```

## 🎨 Code Quality

### Kotlin Style Guide
- Follows official Kotlin coding conventions
- Max line length: 120 characters
- Prefer `val` over `var`
- Use named parameters for improved readability

### Linting (Optional)
Add KtLint to your project:
```bash
./gradlew ktlintFormat  # Auto-format code
./gradlew ktlintCheck   # Check style violations
```

## 🔒 Security Features

- **Encrypted Token Storage**: Uses `EncryptedSharedPreferences`
- **HTTPS Enforcement**: Required for production builds
- **ProGuard**: Code obfuscation in release builds
- **No Hardcoded Secrets**: API keys via build config

## 🐛 Troubleshooting

### Location Not Updating
1. Check location permissions are granted
2. Ensure GPS is enabled on device
3. Verify network connectivity
4. Check WorkManager logs: `adb logcat | grep LocationWorker`

### Build Errors
```bash
# Clean and rebuild
./gradlew clean build

# Invalidate caches (Android Studio)
File > Invalidate Caches / Restart
```

### Google Maps Not Showing
1. Verify API key is correct
2. Enable "Maps SDK for Android" in Google Cloud Console
3. Check billing is enabled

## 📱 Supported Android Versions

- ✅ Android 7.0 (API 24) and above
- ✅ Tested on Android 10, 11, 12, 13, 14
- ✅ Emulator and physical devices

## 🚧 Known Limitations

- Background location tracking may be restricted on some devices (MIUI, ColorOS)
- Location updates might be delayed in battery saver mode
- Requires Google Play Services for location

## 🔮 Future Enhancements

- [ ] Push notifications for new orders
- [ ] Offline mode with local database (Room)
- [ ] Earnings summary and analytics
- [ ] Route optimization for multiple deliveries
- [ ] In-app chat with customers
- [ ] Multi-language support
- [ ] Dark mode theme

## 📄 License

This project is part of the ecommerce platform.

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## 📞 Support

For issues or questions:
- Check existing GitHub issues
- Create a new issue with detailed description
- Include logs (`adb logcat`) for crashes

---

**Version**: 1.0.0  
**Last Updated**: March 2026  
**Minimum Android Version**: 7.0 (API 24)
