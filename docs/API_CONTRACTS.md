# Backend REST API Contracts & Specifications

This document outlines the REST API endpoints, request contracts, response envelopes, and data schemas designed for the Logistics App backend.
All mock fixtures in the mobile application reside in `src/data/mock/` and strictly adhere to these specifications.

---

## 1. Standard Response Format

All API responses return a standard JSON envelope:

### Success Response (`200 OK`, `201 Created`)

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Operation successful description",
  "data": { ... },
  "meta": { ... },
  "timestamp": "2026-09-20T12:00:00.000Z"
}
```

### Error Response (`400 Bad Request`, `401 Unauthorized`, `500 Internal Server Error`)

```json
{
  "success": false,
  "statusCode": 400,
  "error": "ERROR_CODE_STRING",
  "message": "Human-readable description of error",
  "timestamp": "2026-09-20T12:00:00.000Z"
}
```

---

## 2. Authentication API (`/api/v1/auth`)

### 2.1 Get Supported Languages

- **Method:** `GET`
- **Path:** `/api/v1/auth/languages`
- **Authentication:** None
- **Response (`200 OK`):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Languages retrieved successfully",
  "data": [
    { "code": "en", "label": "English", "nativeLabel": "English" },
    { "code": "hi", "label": "Hindi", "nativeLabel": "हिन्दी" },
    { "code": "es", "label": "Spanish", "nativeLabel": "Español" },
    { "code": "fr", "label": "French", "nativeLabel": "Français" },
    { "code": "ar", "label": "Arabic", "nativeLabel": "العربية" }
  ],
  "timestamp": "2026-09-20T12:00:00.000Z"
}
```

### 2.2 Get Auth Configuration

- **Method:** `GET`
- **Path:** `/api/v1/auth/config`
- **Authentication:** None
- **Response (`200 OK`):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Authentication config retrieved",
  "data": {
    "defaultEmail": "example@gmail.com",
    "mockOtp": "5814",
    "otpLength": 4,
    "resendCountdownSeconds": 24
  },
  "timestamp": "2026-09-20T12:00:00.000Z"
}
```

### 2.3 Send OTP

- **Method:** `POST`
- **Path:** `/api/v1/auth/otp/send`
- **Authentication:** None
- **Body:**

```json
{
  "email": "user@example.com"
}
```

- **Response (`200 OK`):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "OTP sent successfully",
  "data": {
    "sent": true,
    "resendCountdownSeconds": 24
  },
  "timestamp": "2026-09-20T12:00:00.000Z"
}
```

### 2.4 Verify OTP

- **Method:** `POST`
- **Path:** `/api/v1/auth/otp/verify`
- **Authentication:** None
- **Body:**

```json
{
  "email": "user@example.com",
  "otp": "5814"
}
```

- **Response (`200 OK`):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "OTP verified successfully",
  "data": {
    "token": "jwt_mock_access_token_v1",
    "user": {
      "id": "usr_c8192a839f",
      "email": "user@example.com",
      "name": "Logistics User",
      "role": "customer"
    }
  },
  "timestamp": "2026-09-20T12:00:00.000Z"
}
```

---

## 3. Vehicles & Ride Catalog API (`/api/v1/vehicles`, `/api/v1/rides`)

### 3.1 Get Vehicle Types

- **Method:** `GET`
- **Path:** `/api/v1/vehicles`
- **Authentication:** Bearer Token (optional for guest)
- **Response (`200 OK`):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Vehicles retrieved successfully",
  "data": {
    "featured": [
      {
        "id": "bike",
        "name": "Bike",
        "description": "Up to 20 kg · Documents, food, small parcels",
        "imageKey": "bike",
        "category": "featured",
        "capacity": "20 kg"
      },
      {
        "id": "mini-truck",
        "name": "Mini Truck",
        "description": "Up to 600 kg · Home appliances, large cargo",
        "imageKey": "mini-truck",
        "category": "featured",
        "capacity": "600 kg"
      }
    ],
    "standard": [
      {
        "id": "large-truck",
        "name": "Large Truck",
        "imageKey": "large-truck",
        "category": "standard"
      },
      {
        "id": "e-rikshaw",
        "name": "e-Rikshaw",
        "imageKey": "e-rikshaw",
        "category": "standard"
      },
      {
        "id": "pickup-truck",
        "name": "Pickup Truck",
        "imageKey": "pickup-truck",
        "category": "standard"
      }
    ]
  },
  "timestamp": "2026-09-20T12:00:00.000Z"
}
```

### 3.2 Get Ride Options & Estimates

- **Method:** `GET`
- **Path:** `/api/v1/rides/options`
- **Query Parameters:** `pickupLat`, `pickupLng`, `dropLat`, `dropLng`
- **Response (`200 OK`):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Ride options calculated successfully",
  "data": [
    {
      "id": "two-wheeler",
      "name": "Two-Wheeler",
      "description": "Up to 10 kg · Documents, food, small parcels",
      "etaMinutes": 12,
      "price": 620,
      "imageKey": "bike"
    },
    {
      "id": "three-wheeler",
      "name": "Three-Wheeler",
      "description": "Up to 150 kg · Medium boxes, small furniture",
      "etaMinutes": 18,
      "price": 620,
      "imageKey": "pickup-truck"
    },
    {
      "id": "e-rickshaw",
      "name": "E-Rickshaw",
      "description": "Up to 300 kg · City deliveries, medium loads",
      "etaMinutes": 20,
      "price": 620,
      "imageKey": "e-rikshaw"
    },
    {
      "id": "mini-truck",
      "name": "Mini Truck",
      "description": "Up to 600 kg · Home appliances, large cargo",
      "etaMinutes": 25,
      "price": 850,
      "imageKey": "mini-truck"
    }
  ],
  "timestamp": "2026-09-20T12:00:00.000Z"
}
```

---

## 4. Places & Addresses API (`/api/v1/places`, `/api/v1/user`)

### 4.1 Search Known Places Directory

- **Method:** `GET`
- **Path:** `/api/v1/places/directory`
- **Response (`200 OK`):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Place directory fetched",
  "data": [
    { "id": "place-a58", "name": "A 58", "address": "Yojna Vihar, Yamuna Bank, New Delhi" },
    {
      "id": "place-passport-seva",
      "name": "Passport Seva Kendra",
      "address": "Jhandewalan, Block E 3, New Delhi"
    }
  ],
  "timestamp": "2026-09-20T12:00:00.000Z"
}
```

### 4.2 Get User Saved Addresses

- **Method:** `GET`
- **Path:** `/api/v1/user/saved-addresses`
- **Authentication:** Bearer Token
- **Response (`200 OK`):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Saved addresses retrieved",
  "data": [
    {
      "id": "seed-work",
      "name": "Work",
      "address": "Reyansh Authortopic Private Limited, IP Estate",
      "iconType": "work",
      "isFavorited": true,
      "savedAt": 0
    },
    {
      "id": "seed-home",
      "name": "Home",
      "address": "Chaman Kumar, 6, Rama Park Rd, Mohan Garden",
      "iconType": "home",
      "isFavorited": true,
      "savedAt": 0
    }
  ],
  "timestamp": "2026-09-20T12:00:00.000Z"
}
```

---

## 5. Account Dashboard API (`/api/v1/user/account-summary`)

### 5.1 Get Account Summary

- **Method:** `GET`
- **Path:** `/api/v1/user/account-summary`
- **Authentication:** Bearer Token
- **Response (`200 OK`):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Account summary retrieved",
  "data": {
    "rating": 4.93,
    "promoItems": [
      {
        "id": "promos",
        "title": "You have multiple promos",
        "subtitle": "We'll automatically apply the one that saves you the most",
        "icon": "percent",
        "iconEmoji": "%",
        "iconBg": "bg-red-50 dark:bg-red-950/30",
        "iconTint": "#FF5A1F"
      }
    ],
    "menuLinks": [
      { "id": "refer", "label": "Refer & Earn" },
      { "id": "about", "label": "About" },
      { "id": "terms", "label": "Terms and Conditions" },
      { "id": "privacy", "label": "Privacy Policy" }
    ]
  },
  "timestamp": "2026-09-20T12:00:00.000Z"
}
```

---

## 6. Drivers & Order Tracking API (`/api/v1/drivers`, `/api/v1/orders`)

### 6.1 Get Nearby Available Drivers

- **Method:** `GET`
- **Path:** `/api/v1/drivers/available`
- **Authentication:** Bearer Token
- **Response (`200 OK`):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Nearby available drivers retrieved",
  "data": [
    {
      "id": "drv-1",
      "name": "Arun Kumar",
      "rating": 4.9,
      "vehicleLabel": "Mini Truck",
      "vehiclePlate": "KA 03 MX 2814"
    }
  ],
  "timestamp": "2026-09-20T12:00:00.000Z"
}
```

### 6.2 Get Order Tracking

- **Method:** `GET`
- **Path:** `/api/v1/orders/:orderId/tracking`
- **Authentication:** Bearer Token
- **Response (`200 OK`):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Order tracking details retrieved",
  "data": {
    "steps": [
      { "id": "searching", "label": "Finding your driver" },
      { "id": "heading_to_pickup", "label": "Heading to pickup" },
      { "id": "pickup_complete", "label": "Pickup complete" },
      { "id": "delivered", "label": "Delivered" }
    ],
    "trackingRoute": [
      { "latitude": 28.6507, "longitude": 77.2334 },
      { "latitude": 28.6455, "longitude": 77.2378 },
      { "latitude": 28.6395, "longitude": 77.242 },
      { "latitude": 28.6321, "longitude": 77.2455 }
    ],
    "confirmationRoute": [
      { "latitude": 28.6385, "longitude": 77.2405 },
      { "latitude": 28.635, "longitude": 77.239 },
      { "latitude": 28.6317, "longitude": 77.2415 },
      { "latitude": 28.6321, "longitude": 77.2455 },
      { "latitude": 28.629, "longitude": 77.248 }
    ]
  },
  "timestamp": "2026-09-20T12:00:00.000Z"
}
```
