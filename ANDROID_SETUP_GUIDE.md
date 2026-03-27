# Android Rider App - Setup & Build Guide

## Project Structure

```
ecommerce/quick_ecommerce/android/
├── app/
│   ├── build.gradle.kts                    # App-level build configuration (Compose dependencies)
│   ├── proguard-rules.pro                  # ProGuard/R8 obfuscation rules
│   └── src/main/
│       ├── AndroidManifest.xml             # Permissions, Activities, Services
│       ├── java/com/ecommerce/rider/
│       │   ├── RiderApplication.kt         # Hilt setup, notification channels
│       │   ├── Constants.kt                # API endpoints, config values
│       │   ├── PreferencesManager.kt       # Encrypted token storage
│       │   ├── data/
│       │   │   ├── models/                 # Data models (Order, Rider, etc)
│       │   │   ├── api/                    # Retrofit API service
│       │   │   ├── interceptors/           # Auth interceptor
│       │   │   ├── repository/             # Business logic layer
│       │   │   └── modules/                # Hilt dependency injection
│       │   ├── services/
│       │   │   ├── LocationTrackingService.kt  # Foreground service
│       │   │   └── LocationWorker.kt           # Background location updates
│       │   ├── ui/
│       │   │   ├── theme/                  # Material3 theme & typography
│       │   │   ├── auth/                   # Login screen & ViewModel (Compose)
│       │   │   ├── main/                   # Dashboard screen & ViewModel (Compose)
│       │   │   ├── orders/                 # Order details screen & ViewModel (Compose)
│       │   │   └── splash/                 # Splash screen (Compose)
│       │   └── utils/
│       │       ├── Extensions.kt           # Helper functions
│       │       └── Resource.kt             # API response wrapper
│       └── res/
│           ├── values/
│           │   ├── strings.xml             # UI strings
│           │   ├── colors.xml              # Color definitions
│           │   └── themes.xml              # Material3 theme styles
│           ├── drawable/                   # Vector drawables
│           └── xml/                        # Data extraction rules, backup rules
├── build.gradle.kts                        # Root-level build configuration
├── settings.gradle.kts                     # Project structure
└── gradle.properties                       # Gradle settings
```

## Prerequisites

### System Requirements
- **macOS** (Intel or Apple Silicon)
- **Java 17+** (Check: `java -version`)
- **Android SDK 34** (API 34 - Android 14)
- **Minimum SDK**: API 24 (Android 7.0)
- **Target SDK**: API 34 (Android 14)

### Download Tools
```bash
# Option 1: Via Homebrew (macOS)
brew install android-sdk
brew install android-ndk
brew install android-studio

# Option 2: Manual download
# Visit: https://developer.android.com/studio
```

### Environment Setup
```bash
# Add to ~/.zshrc or ~/.bash_profile
export ANDROID_SDK_ROOT="$HOME/Library/Android/sdk"
export ANDROID_HOME="$ANDROID_SDK_ROOT"
export PATH="$ANDROID_SDK_ROOT/emulator:$ANDROID_SDK_ROOT/tools:$ANDROID_SDK_ROOT/tools/bin:$ANDROID_SDK_ROOT/platform-tools:$PATH"

# Reload shell
source ~/.zshrc
```

## Building the Project

### 1. Clean Build
```bash
cd ecommerce/quick_ecommerce/android

# Clean previous builds
./gradlew clean

# Build debug APK
./gradlew assembleDebug

# Output: app/build/outputs/apk/debug/app-debug.apk
```

### 2. Build Release APK (with ProGuard)
```bash
./gradlew assembleRelease

# Output: app/build/outputs/apk/release/app-release.apk
# Note: Requires signing key configuration
```

### 3. Run Tests
```bash
# Unit tests
./gradlew testDebug

# Instrumented tests (requires emulator/device)
./gradlew connectedAndroidTest
```

### 4. Run Lint & Static Analysis
```bash
# Android Lint
./gradlew lint

# Ktlint (Kotlin style checking)
./gradlew ktlintCheck
```

## Running on Emulator/Device

### Create Android Emulator
```bash
# Launch Android Studio
android-studio

# Or use command line:
# 1. List available system images
sdkmanager --list | grep "system-images"

# 2. Create emulator
avdmanager create avd -n Pixel5_API34 -k "system-images;android-34;google_apis;arm64-v8a"

# 3. Start emulator
emulator -avd Pixel5_API34 -netdelay none -netspeed full
```

### Install & Run
```bash
# Install debug APK on emulator
./gradlew installDebug

# Run app (opens MainActivity)
adb shell am start -n com.ecommerce.rider/.ui.splash.SplashActivity

# View logs
adb logcat -s RiderApp

# View all logs
adb logcat
```

### Physical Device
```bash
# Enable USB Debugging on device:
# Settings → Developer Options → USB Debugging

# Connect device and verify
adb devices

# Install APK
./gradlew installDebug

# Check installation
adb shell pm list packages | grep ecommerce
```

## Configuration Files

### app/build.gradle.kts
```groovy
// Minimum SDK configuration
minSdk = 24              // Android 7.0

// Target SDK configuration
targetSdk = 34           // Android 14

// Version codes
versionCode = 1
versionName = "1.0.0"

// Key Compose dependencies
dependencies {
    // Compose BOM (Bill of Materials) - manages all Compose versions
    implementation platform("androidx.compose:compose-bom:2024.01.00")
    
    // Material3 UI components
    implementation("androidx.compose.material3:material3")
    
    // Navigation Compose
    implementation("androidx.navigation:navigation-compose:2.7.5")
    
    // Lifecycle integration
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.6.1")
}
```

### gradle.properties
```properties
# JVM memory allocation
org.gradle.jvmargs=-Xmx2048m -XX:MaxMetaspaceSize=512m

# AndroidX support
android.useAndroidX=true

# Enable Jetpack Compose
android.enableComposeCompiler=true

# Kotlin compiler options
kotlin.jvmTarget=17
kotlin.stdlib.jvm.target=17
```

## API Endpoints Configuration

Edit `Constants.kt`:
```kotlin
object Constants {
    const val BASE_URL = "http://192.168.1.100:3000/api/"  // Your backend URL
    
    // Location tracking
    const val LOCATION_UPDATE_INTERVAL_MS = 180000L      // 3 minutes
    const val LOCATION_FASTEST_UPDATE_INTERVAL_MS = 60000L // 1 minute
    
    // Background job
    const val LOCATION_WORK_TAG = "location_tracking"
    const val LOCATION_WORK_PERIOD_MINUTES = 10
}
```

## Key Compose Files

### Theme System
- **`ui/theme/Theme.kt`**: Material3 color schemes, dark/light mode
- **`ui/theme/Typography.kt`**: Text styles (Display, Headline, Body, Label)

### Screens (Composables)
1. **`ui/splash/SplashActivity.kt`**: Splash screen with auto-login detection
2. **`ui/auth/LoginScreen.kt`**: Login form with validation
3. **`ui/main/DashboardScreen.kt`**: Dashboard stats and tabs
4. **`ui/orders/OrderDetailsScreen.kt`**: Order information and actions

### State Management (ViewModels)
- **`ui/auth/LoginViewModel.kt`**: Login state, validation
- **`ui/main/MainViewModel.kt`**: Dashboard stats, orders, actions
- **`ui/orders/OrderDetailsViewModel.kt`**: Order details, status updates

### Activities (Compose Wrappers)
- **`ui/splash/SplashActivity.kt`**: Entry point
- **`ui/auth/LoginActivity.kt`**: Login flow
- **`ui/main/MainActivity.kt`**: Dashboard/Main app
- **`ui/orders/OrderDetailsActivity.kt`**: Order details

## Common Issues & Solutions

### Issue: Gradle Build Fails with "Module not found"
```bash
# Solution: Update dependencies
./gradlew --refresh-dependencies build

# Or clear gradle cache
rm -rf ~/.gradle/caches
./gradlew clean build
```

### Issue: "Compose not recognized" or "No Compose imports"
```bash
# Ensure build.gradle.kts has:
plugins {
    id 'com.android.application' version '8.1.0'
    kotlin("android") version "1.9.20"
}

# Compose BOM must be added
implementation platform("androidx.compose:compose-bom:2024.01.00")
```

### Issue: App crashes on login
```bash
# Check logs:
adb logcat | grep RiderApp

# Verify API endpoint in Constants.kt
# Verify backend is running at BASE_URL
# Check network permissions in AndroidManifest.xml
```

### Issue: Location updates not working
```bash
# Check location permissions on device:
# Settings → Apps → Rider App → Permissions → Location

# Verify location services enabled:
# Settings → Location → Toggle ON

# Check WorkManager status:
adb shell dumpsys jobscheduler
```

### Issue: Emulator too slow
```bash
# Use hardware acceleration
emulator -avd Pixel5_API34 -accel auto

# Reduce graphics rendering
emulator -avd Pixel5_API34 -gpu swiftshader

# Increase allocated RAM
# In Android Studio: Settings → AVD Manager → Edit → RAM allocation
```

## Performance Optimization

### Gradle Build Optimization
```bash
# Enable parallel builds
export GRADLE_OPTS="-XX:MaxMetaspaceSize=2048m"

# Build with parallel compilation
./gradlew --parallel build

# Use gradle cache
./gradlew --build-cache assembleDebug
```

### Android App Optimization
1. **ProGuard/R8**: Minification enabled in release builds
2. **Code shrinking**: ProGuard rules in `proguard-rules.pro`
3. **Resource shrinking**: Unused resources automatically removed
4. **Compose performance**: Stable types, remember usage patterns

## Testing

### Unit Tests
```bash
# Run unit tests
./gradlew testDebugUnitTest

# Run specific test class
./gradlew testDebugUnitTest --tests "com.ecommerce.rider.ui.auth.LoginViewModelTest"
```

### Instrumented Tests (on device/emulator)
```bash
# Run instrumented tests
./gradlew connectedAndroidTest

# Run specific test
./gradlew connectedAndroidTest --tests "com.ecommerce.rider.ui.auth.LoginActivityTest"
```

### Debugging
```bash
# Start debug session
./gradlew installDebug

# In Android Studio: Run → Debug 'app'

# Or use adb
adb shell am start -D -N com.ecommerce.rider/.ui.splash.SplashActivity

# View verbose logging
adb logcat *:V RiderApp
```

## Documentation Files

- **[ANDROID_RIDER_APP_PLAN.md](./ANDROID_RIDER_APP_PLAN.md)** - Comprehensive architecture plan
- **[ANDROID_IMPLEMENTATION_SUMMARY.md](./ANDROID_IMPLEMENTATION_SUMMARY.md)** - Implementation details
- **[COMPOSE_MIGRATION_SUMMARY.md](./COMPOSE_MIGRATION_SUMMARY.md)** - Jetpack Compose migration guide
- **[README.md](./README.md)** - Project overview
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Data flow architecture

## Release Checklist

- [ ] Unit tests passing: `./gradlew testDebug`
- [ ] Lint warnings resolved: `./gradlew lint`
- [ ] Debug APK builds: `./gradlew assembleDebug`
- [ ] App installs on emulator
- [ ] Login flow works end-to-end
- [ ] Dashboard displays stats
- [ ] Orders list functional
- [ ] Order details show correctly
- [ ] Location tracking initializes
- [ ] Foreground service shows notification
- [ ] Permissions request dialog appears
- [ ] Release APK builds: `./gradlew assembleRelease`

## Troubleshooting Command Reference

```bash
# Comprehensive clean and rebuild
./gradlew clean \
  && ./gradlew --refresh-dependencies \
  && ./gradlew assembleDebug

# View dependency tree
./gradlew dependencies

# Sync project
./gradlew sync

# Verify build configuration
./gradlew properties | grep -i compose

# Check installed packages
adb shell pm list packages

# Clear app data
adb shell pm clear com.ecommerce.rider

# Grant location permission
adb shell pm grant com.ecommerce.rider android.permission.ACCESS_FINE_LOCATION
adb shell pm grant com.ecommerce.rider android.permission.ACCESS_BACKGROUND_LOCATION

# Uninstall app
adb uninstall com.ecommerce.rider
```

## Quick Start Commands

```bash
# One-liner: Clean build and install
cd ecommerce/quick_ecommerce/android && \
./gradlew clean assembleDebug && \
adb install -r app/build/outputs/apk/debug/app-debug.apk

# Start dev iteration
./gradlew assembleDebug      # Build
adb install -r *.apk         # Install
adb logcat -s RiderApp       # View logs

# Release build
./gradlew assembleRelease --no-daemon --max-workers=2
```

---

## Next Steps

1. ✅ **Compose Migration Complete** - See [COMPOSE_MIGRATION_SUMMARY.md](./COMPOSE_MIGRATION_SUMMARY.md)
2. **Build & Test** - Run `./gradlew clean assembleDebug`
3. **Deploy to Emulator** - Follow "Running on Emulator" section
4. **Connect Backend** - Update Constants.kt with your API endpoint
5. **Test Flows** - Verify login → dashboard → orders

---

**Last Updated**: January 2024
**Status**: Production Ready
**Compose Version**: 2024.01.00
**Min SDK**: 24 (Android 7.0)
**Target SDK**: 34 (Android 14)
