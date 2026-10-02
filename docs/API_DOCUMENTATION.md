# 🍲 Phum Yeung Online Restaurant - REST API Specification

> **Base URL**: `http://localhost:5000/api`  
> **API Version**: `v1.0.0`  
> **Format**: JSON (`Content-Type: application/json`)  
> **Authentication**: JSON Web Token (JWT) Bearer Token (`Authorization: Bearer <TOKEN>`)

---

## 📑 Table of Contents
1. [Overview & Standards](#overview--standards)
2. [Authentication & User Management](#1-authentication--user-management)
3. [Dishes & Menu Management](#2-dishes--menu-management)
4. [Orders & Tracking](#3-orders--tracking)
5. [Promotions & Vouchers](#4-promotions--vouchers)
6. [Store Settings](#5-store-settings)
7. [Payments (Bakong KHQR)](#6-payments-bakong-khqr)
8. [System Health](#7-system-health)
9. [Standard Error Responses](#8-standard-error-responses)

---

## Overview & Standards

### HTTP Methods Used
- `GET`: Retrieve data or resource lists.
- `POST`: Create a new resource or perform stateful actions (e.g. login, payment).
- `PUT`: Full update of an existing resource.
- `PATCH`: Partial update (e.g. changing order status).
- `DELETE`: Remove a resource.

### Success Envelope Format
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional human-readable confirmation"
}
```

---

## 1. Authentication & User Management

### 1.1 Admin Login
Authenticate restaurant administrator and receive JWT token.

- **Endpoint**: `POST /api/auth/login`
- **Access**: Public
- **Request Body**:
```json
{
  "email": "admin@phumyeung.com",
  "password": "admin123"
}
```
- **Response `200 OK`**:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "66f4fc...",
    "name": "Phum Yeung Admin",
    "email": "admin@phumyeung.com",
    "role": "admin"
  }
}
```

---

### 1.2 Customer Registration & Email Verification (OTP)
Register a customer and send a 6-digit verification code to their email.

- **Endpoint**: `POST /api/auth/customer/register`
- **Access**: Public
- **Request Body**:
```json
{
  "name": "Sok Dara",
  "email": "sokdara@example.com",
  "phone": "012345678",
  "password": "customerPassword123"
}
```
- **Response `201 Created`**:
```json
{
  "success": true,
  "message": "Verification code sent to your email.",
  "email": "sokdara@example.com"
}
```

---

### 1.3 Verify Customer Code (OTP)
Submit the 6-digit OTP code sent via email to activate the account.

- **Endpoint**: `POST /api/auth/customer/verify`
- **Access**: Public
- **Request Body**:
```json
{
  "email": "sokdara@example.com",
  "code": "489201"
}
```
- **Response `200 OK`**:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1...",
  "user": {
    "_id": "66f501...",
    "name": "Sok Dara",
    "email": "sokdara@example.com",
    "isVerified": true
  }
}
```

---

### 1.4 Customer Login
Sign in as a registered customer.

- **Endpoint**: `POST /api/auth/customer/login`
- **Access**: Public
- **Request Body**:
```json
{
  "email": "sokdara@example.com",
  "password": "customerPassword123"
}
```
- **Response `200 OK`**:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1...",
  "user": {
    "_id": "66f501...",
    "name": "Sok Dara",
    "email": "sokdara@example.com"
  }
}
```

---

### 1.5 Get Current Profile
Retrieve profile data of currently authenticated user/admin.

- **Endpoint**: `GET /api/auth/me`
- **Access**: Private (`Authorization: Bearer <TOKEN>`)
- **Response `200 OK`**:
```json
{
  "success": true,
  "user": {
    "_id": "66f4fc...",
    "name": "Phum Yeung Admin",
    "email": "admin@phumyeung.com",
    "role": "admin"
  }
}
```

---

## 2. Dishes & Menu Management

### 2.1 Get All Dishes
Retrieve the full food and beverage catalog with filtering options.

- **Endpoint**: `GET /api/dishes`
- **Access**: Public
- **Query Parameters**:
  - `category` (optional, string): Filter by category ID (e.g. `soups`, `specials`, `duck-goose`)
  - `featured` (optional, boolean): `true` or `false`
  - `available` (optional, boolean): `true` or `false`
- **Response `200 OK`**:
```json
{
  "success": true,
  "count": 12,
  "data": [
    {
      "_id": "66f4fd...",
      "dishId": "cmt1krpbt00180aj7e18d2xp6",
      "name_km": "កង្កែបចំបើងពិសេស",
      "name_en": "Special Fried Straw Frog Legs",
      "category": "specials",
      "price": 4.50,
      "spice_level": "mild",
      "featured": true,
      "rating": 5,
      "reviews_count": 15,
      "image": "/images/foods/cmt1krpbt00180aj7e18d2xp6.jpg",
      "desc_km": "ម្ហូបឆ្ងាញ់ប្រចាំហាងភូមិយើង រសជាតិដើមបែបខ្មែរពិតៗ។",
      "desc_en": "Authentic Cambodian dish made fresh daily with traditional local seasoning.",
      "isAvailable": true
    }
  ]
}
```

---

### 2.2 Get Single Dish by ID
- **Endpoint**: `GET /api/dishes/:id`
- **Access**: Public
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "_id": "66f4fd...",
    "name_km": "កង្កែបចំបើងពិសេស",
    "name_en": "Special Fried Straw Frog Legs",
    "price": 4.50
  }
}
```

---

### 2.3 Upload Dish Photo (Multer Multipart)
Uploads an image binary file from Admin UI or mobile camera to the backend server.

- **Endpoint**: `POST /api/dishes/upload`
- **Access**: Public / Admin
- **Content-Type**: `multipart/form-data`
- **Body Parameter**: `image` (binary file, supported: JPG, PNG, WebP — Max 8MB)
- **Response `200 OK`**:
```json
{
  "success": true,
  "imageUrl": "/images/foods/dish-1790416603530-23967478.jpg",
  "fileName": "dish-1790416603530-23967478.jpg",
  "message": "Image uploaded successfully"
}
```

---

### 2.4 Create Dish (Admin)
- **Endpoint**: `POST /api/dishes`
- **Access**: Private Admin (`Authorization: Bearer <TOKEN>`)
- **Request Body**:
```json
{
  "name_km": "ត្រីអាំងទឹកត្រីអំពិលទុំ",
  "name_en": "Grilled Fish with Tamarind Sauce",
  "category": "fish-seafood",
  "price": 6.50,
  "spice_level": "medium",
  "featured": true,
  "image": "/images/foods/grilled-fish.jpg",
  "desc_km": "ត្រីរ៉ស់អាំងស្រួយ ញ៉ាំជាមួយទឹកត្រីអំពិលទុំជូរអែម។",
  "desc_en": "Crispy grilled fresh river fish paired with sweet & sour tamarind dip.",
  "isAvailable": true
}
```
- **Response `201 Created`**:
```json
{
  "success": true,
  "message": "Dish created successfully",
  "data": { "_id": "66f505...", "name_en": "Grilled Fish with Tamarind Sauce" }
}
```

---

### 2.4 Update Dish (Admin)
- **Endpoint**: `PUT /api/dishes/:id`
- **Access**: Private Admin
- **Request Body**: (Any fields to update)
```json
{
  "price": 6.00,
  "isAvailable": false
}
```
- **Response `200 OK`**:
```json
{
  "success": true,
  "message": "Dish updated successfully",
  "data": { "_id": "66f505...", "price": 6.00, "isAvailable": false }
}
```

---

### 2.5 Delete Dish (Admin)
- **Endpoint**: `DELETE /api/dishes/:id`
- **Access**: Private Admin
- **Response `200 OK`**:
```json
{
  "success": true,
  "message": "Dish deleted successfully"
}
```

---

## 3. Orders & Tracking

### 3.1 Place New Order
Submits a customer order with items, delivery info, and payment selection.

- **Endpoint**: `POST /api/orders`
- **Access**: Public
- **Request Body**:
```json
{
  "customer": {
    "name": "Vuth Vatana",
    "phone": "012888999",
    "email": "vatana@example.com"
  },
  "deliveryMethod": "delivery",
  "deliveryAddress": {
    "khan": "Chamkarmon",
    "street": "St. 310, House #14",
    "notes": "Call upon arrival"
  },
  "items": [
    {
      "dishId": "cmt1krpbt00180aj7e18d2xp6",
      "name_km": "កង្កែបចំបើងពិសេស",
      "name_en": "Special Fried Straw Frog Legs",
      "price": 4.50,
      "quantity": 2
    }
  ],
  "subtotal": 9.00,
  "deliveryFee": 1.50,
  "discount": 0.90,
  "totalUsd": 9.60,
  "totalKhr": 39360,
  "paymentMethod": "bakong_khqr",
  "promoCode": "PHUM10"
}
```
- **Response `201 Created`**:
```json
{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "_id": "66f509...",
    "orderId": "PY-ORD-1003",
    "status": "received",
    "totalUsd": 9.60,
    "createdAt": "2026-09-26T16:30:00.000Z"
  }
}
```

---

### 3.2 Track Single Order
Retrieve the live status and timeline for a customer using the Order ID.

- **Endpoint**: `GET /api/orders/:orderId`
- **Access**: Public
- **Example**: `GET /api/orders/PY-ORD-1003`
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "orderId": "PY-ORD-1003",
    "status": "preparing",
    "timeline": [
      { "status": "received", "time": "2026-09-26T16:30:00.000Z" },
      { "status": "preparing", "time": "2026-09-26T16:35:00.000Z" }
    ],
    "items": [ ... ],
    "totalUsd": 9.60,
    "paymentMethod": "bakong_khqr",
    "isPaid": true
  }
}
```

---

### 3.3 Update Order Status (Admin)
Change the progress status of an order.

- **Endpoint**: `PATCH /api/orders/:orderId/status`
- **Access**: Private Admin (`Authorization: Bearer <TOKEN>`)
- **Request Body**:
```json
{
  "status": "delivering"
}
```
*Allowed Statuses: `received`, `preparing`, `delivering`, `delivered`, `cancelled`.*
- **Response `200 OK`**:
```json
{
  "success": true,
  "message": "Order status updated to delivering",
  "data": { "orderId": "PY-ORD-1003", "status": "delivering" }
}
```

---

## 4. Promotions & Vouchers

### 4.1 Validate Promo Code
Validate whether a voucher code is active and retrieve its discount percentage.

- **Endpoint**: `GET /api/promos/validate/:code`
- **Access**: Public
- **Example**: `GET /api/promos/validate/PHUM10`
- **Response `200 OK`**:
```json
{
  "success": true,
  "valid": true,
  "data": {
    "code": "PHUM10",
    "discount": 10,
    "description": "10% OFF Welcome Promo"
  }
}
```

---

### 4.2 List All Promo Codes (Admin)
- **Endpoint**: `GET /api/promos`
- **Access**: Public / Admin
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": [
    { "code": "PHUM10", "discount": 10, "active": true },
    { "code": "KHMER20", "discount": 20, "active": true }
  ]
}
```

---

## 5. Store Settings

### 5.1 Get Store Settings
Retrieve operating status, delivery fees, and exchange rates.

- **Endpoint**: `GET /api/settings`
- **Access**: Public
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "isOpen": true,
    "standardDeliveryFee": 1.50,
    "freeDeliveryThreshold": 25.00,
    "khrRate": 4100,
    "announcement": {
      "active": true,
      "text_km": "🔥 ប្រូម៉ូសិនពិសេស៖ បញ្ចុះតម្លៃ ១០% សម្រាប់ការកុម្ម៉ង់ដំបូងដោយប្រើកូដ PHUM10!",
      "text_en": "🔥 Special Promo: Enjoy 10% OFF your first delivery order with code PHUM10!"
    }
  }
}
```

---

### 5.2 Update Store Settings (Admin)
- **Endpoint**: `PUT /api/settings`
- **Access**: Private Admin (`Authorization: Bearer <TOKEN>`)
- **Request Body**:
```json
{
  "isOpen": true,
  "standardDeliveryFee": 2.00,
  "khrRate": 4150
}
```
- **Response `200 OK`**:
```json
{
  "success": true,
  "message": "Settings updated successfully",
  "data": { ... }
}
```

---

## 6. Payments (Bakong KHQR)

### 6.1 Generate Bakong KHQR
Generates a dynamic National Bank of Cambodia (NBC) KHQR payload and QR code image for scanning in banking apps (ABA, ACLEDA, Bakong, etc.).

- **Endpoint**: `POST /api/payments/bakong/generate`
- **Access**: Public
- **Request Body**:
```json
{
  "orderId": "PY-ORD-1003",
  "amount": 9.60,
  "currency": "USD"
}
```
- **Response `200 OK`**:
```json
{
  "success": true,
  "qrString": "00020101021229300016bakong@nbc.gov.kh...",
  "qrImage": "data:image/png;base64,iVBORw0KGgo...",
  "md5": "d41d8cd98f00b204e9800998ecf8427e"
}
```

---

### 6.2 Check Bakong Transaction by MD5
Verifies whether the customer completed the bank transfer.

- **Endpoint**: `POST /api/payments/bakong/check-md5`
- **Access**: Public
- **Request Body**:
```json
{
  "md5": "d41d8cd98f00b204e9800998ecf8427e"
}
```
- **Response `200 OK`**:
```json
{
  "success": true,
  "isPaid": true,
  "message": "Payment confirmed via Bakong"
}
```

---

## 7. System Health

### 7.1 Health & Database Status
Used to verify server readiness and active MongoDB connection.

- **Endpoint**: `GET /api/health`
- **Access**: Public
- **Response `200 OK`**:
```json
{
  "status": "OK",
  "service": "Phum Yeung Online Backend API",
  "database": "Connected",
  "uptime": 128.45,
  "timestamp": "2026-09-26T16:32:00.000Z"
}
```

---

## 8. Standard Error Responses

When an error occurs, the API returns standard HTTP status codes along with a JSON error body:

```json
{
  "success": false,
  "message": "Descriptive error message"
}
```

### Common HTTP Status Codes
| Code | Meaning | Description |
| :--- | :--- | :--- |
| `200` | OK | Request succeeded. |
| `201` | Created | New record successfully created. |
| `400` | Bad Request | Missing required parameters or invalid input format. |
| `401` | Unauthorized | Missing or expired JWT authentication token. |
| `403` | Forbidden | Insufficient role permissions (Admin required). |
| `404` | Not Found | Requested resource (dish, order, promo) does not exist. |
| `500` | Server Error | Internal server or unhandled exception. |
| `503` | Service Unavailable | MongoDB connection is temporarily unavailable. |

---

## 9. Mobile Android App Integration Guide (Kotlin / Retrofit / Glide)

This backend REST API is designed to serve both the React web application and your future **Native Android App**.

### 9.1 Base URL Configuration in Android
| Environment | Base API URL | Image Static URL |
| :--- | :--- | :--- |
| **Android Studio Emulator** | `http://10.0.2.2:5000/api/` | `http://10.0.2.2:5000/images/foods/` |
| **Real Android Phone (Wi-Fi)** | `http://<YOUR_PC_IP>:5000/api/` | `http://<YOUR_PC_IP>:5000/images/foods/` |
| **Production Server** | `https://api.yourdomain.com/api/` | `https://api.yourdomain.com/images/foods/` |

> ⚠️ **Android Cleartext Traffic**: Because `http://` is used locally, add `android:usesCleartextTraffic="true"` inside your Android `AndroidManifest.xml` `<application>` tag.

### 9.2 Loading Dish Images in Android (Glide / Coil)
Each dish object returned from `/api/dishes` includes a relative image path (e.g. `"/images/foods/cmt1krpbt00180aj7e18d2xp6.jpg"`).

In Kotlin with **Glide**:
```kotlin
val baseUrl = "http://10.0.2.2:5000"
val fullImageUrl = baseUrl + dish.image

Glide.with(context)
    .load(fullImageUrl)
    .placeholder(R.drawable.dish_placeholder)
    .into(binding.dishImageView)
```

### 9.3 Sample Retrofit Interface (Kotlin)
```kotlin
interface RestaurantApiService {
    // 1. Dishes
    @GET("dishes")
    suspend fun getDishes(@Query("category") category: String? = null): Response<DishListResponse>

    // 2. Authentication
    @POST("auth/customer/login")
    suspend fun loginCustomer(@Body request: LoginRequest): Response<AuthResponse>

    @POST("auth/customer/register")
    suspend fun registerCustomer(@Body request: RegisterRequest): Response<ApiResponse>

    // 3. Orders
    @POST("orders")
    suspend fun createOrder(@Body order: OrderRequest): Response<OrderResponse>

    @GET("orders/{orderId}")
    suspend fun trackOrder(@Path("orderId") orderId: String): Response<OrderResponse>

    // 4. Bakong KHQR Payment
    @POST("payments/bakong/generate")
    suspend fun generateKHQR(@Body request: KHQRPaymentRequest): Response<KHQRResponse>
}
```

