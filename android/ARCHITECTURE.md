# Android Rider App - Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      ANDROID RIDER APP                          │
│                   (Kotlin, MVVM, Hilt)                          │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                         UI LAYER                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Splash     │  │    Login     │  │  Dashboard   │          │
│  │  Activity    │→ │   Activity   │→ │   Activity   │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                            │                     │
│                         └──────────────────┴─────────────┐      │
│                                                           │      │
│                    ┌──────────────────────────────────────▼──┐  │
│                    │        ViewPager2 + TabLayout          │  │
│                    ├────────────┬──────────┬────────────────┤  │
│                    │            │          │                │  │
│                    │  Pending   │ Accepted │   History      │  │
│                    │  Fragment  │ Fragment │   Fragment     │  │
│                    │            │          │                │  │
│                    └────────────┴──────────┴────────────────┘  │
│                                                                  │
│                           ┌──────────────────────┐              │
│                           │  Order Details       │              │
│                           │  Activity            │              │
│                           └──────────────────────┘              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                      VIEW MODEL LAYER                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────┐  ┌────────────────┐  ┌──────────────────┐  │
│  │  LoginViewModel│  │  MainViewModel │  │OrderDetailsViewModel│
│  ├────────────────┤  ├────────────────┤  ├──────────────────┤  │
│  │ - loginState   │  │ - dashStats    │  │ - orderDetails   │  │
│  │ - validate()   │  │ - pendingOrders│  │ - orderAction    │  │
│  │ - login()      │  │ - acceptOrder()│  │ - markDelivered()│  │
│  └────────────────┘  └────────────────┘  └──────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                    REPOSITORY LAYER                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐              ┌──────────────────┐         │
│  │  AuthRepository  │              │  OrderRepository │         │
│  ├──────────────────┤              ├──────────────────┤         │
│  │ - login()        │              │ - getDashboard() │         │
│  │ - logout()       │              │ - getPending()   │         │
│  │ - isLoggedIn()   │              │ - acceptOrder()  │         │
│  └──────────────────┘              │ - updateLocation()        │
│                                    └──────────────────┘         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                       DATA LAYER                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │              ApiService (Retrofit)                      │    │
│  ├────────────────────────────────────────────────────────┤    │
│  │  POST /api/auth/login                                  │    │
│  │  GET  /api/rider/dashboard                             │    │
│  │  GET  /api/rider/orders/pending                        │    │
│  │  POST /api/rider/orders/accept                         │    │
│  │  POST /api/rider/update-location                       │    │
│  │  ... (12 endpoints total)                              │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │          AuthInterceptor (OkHttp)                      │    │
│  ├────────────────────────────────────────────────────────┤    │
│  │  - Adds JWT token to all requests                      │    │
│  │  - Cookie: token=<jwt>                                 │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                  BACKGROUND SERVICES                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────────┐      ┌────────────────────────┐    │
│  │  LocationWorker        │      │ LocationTrackingService│    │
│  │  (WorkManager)         │      │ (Foreground)           │    │
│  ├────────────────────────┤      ├────────────────────────┤    │
│  │ - Runs every 3 min     │      │ - Runs during delivery │    │
│  │ - Gets current location│      │ - Updates every 1 min  │    │
│  │ - Sends to server      │      │ - Shows notification   │    │
│  │ - Battery optimized    │      │ - Higher GPS accuracy  │    │
│  └────────────────────────┘      └────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    UTILITIES & DI                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────┐    ┌──────────────────────┐          │
│  │ PreferencesManager   │    │  NetworkModule (Hilt)│          │
│  ├──────────────────────┤    ├──────────────────────┤          │
│  │ - Encrypted storage  │    │ - Provides Retrofit  │          │
│  │ - Token management   │    │ - Provides OkHttp    │          │
│  │ - User data          │    │ - Provides ApiService│          │
│  └──────────────────────┘    └──────────────────────┘          │
│                                                                  │
│  ┌──────────────────────────────────────────────────────┐      │
│  │               Resource<T> Pattern                     │      │
│  ├──────────────────────────────────────────────────────┤      │
│  │  - Loading: Show progress                            │      │
│  │  - Success: Display data                             │      │
│  │  - Error: Show error message                         │      │
│  └──────────────────────────────────────────────────────┘      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    EXTERNAL INTEGRATIONS                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐  ┌──────────────────┐  ┌─────────────┐   │
│  │  Google Maps     │  │  Google Location │  │  Phone App  │   │
│  │  SDK             │  │  Services        │  │  (Calling)  │   │
│  ├──────────────────┤  ├──────────────────┤  ├─────────────┤   │
│  │ - Navigation     │  │ - GPS tracking   │  │ - Call intent│  │
│  │ - Markers        │  │ - Geofencing     │  │ - Permission │  │
│  └──────────────────┘  └──────────────────┘  └─────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      DATA FLOW EXAMPLE                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  User Accepts Order:                                            │
│                                                                  │
│  1. User taps "Accept" button                                  │
│     └──> OrdersFragment.onAcceptClick()                        │
│                                                                  │
│  2. ViewModel processes action                                  │
│     └──> MainViewModel.acceptOrder(orderId)                    │
│                                                                  │
│  3. Repository makes API call                                   │
│     └──> OrderRepository.acceptOrder(orderId)                  │
│                                                                  │
│  4. Network request via Retrofit                                │
│     └──> ApiService.acceptOrder(request)                       │
│                                                                  │
│  5. AuthInterceptor adds token                                  │
│     └──> Headers: Cookie: token=<jwt>                          │
│                                                                  │
│  6. Server responds with success                                │
│     └──> ApiResponse<Order>                                    │
│                                                                  │
│  7. Repository wraps in Resource                                │
│     └──> Resource.Success(response)                            │
│                                                                  │
│  8. ViewModel updates LiveData                                  │
│     └──> _orderAction.value = Resource.Success()               │
│                                                                  │
│  9. Fragment observes change                                    │
│     └──> Shows toast, refreshes list                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

KEY PRINCIPLES:
═══════════════
✓ Separation of Concerns: Each layer has distinct responsibility
✓ Single Source of Truth: ViewModel holds UI state
✓ Unidirectional Data Flow: Data flows from UI → VM → Repo → API
✓ Reactive Programming: LiveData for UI updates
✓ Dependency Injection: Hilt manages object creation
✓ Error Handling: Resource pattern for consistent error states
✓ Security: Encrypted storage, JWT tokens
✓ Battery Optimization: WorkManager constraints
