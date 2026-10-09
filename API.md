# API Documentation - Simple Subscription Manager

This document details all the endpoints of the Simple Subscription Manager API, including parameters, responses, and examples.

## Base URL

```
https://api.gestor-assinaturas.com
```

For local development:
```
http://localhost:3000
```

## Authentication

All endpoints (except webhooks) require a better-auth session, sent as an HttpOnly cookie.

- Obtain it with `POST /api/auth/sign-up/email` `{ name, email, password }` or `POST /api/auth/sign-in/email` `{ email, password }`.
- `POST /api/auth/sign-out` ends it.
- `GET /api/users/profile` returns the current user.

---

## Endpoints

### Subscriptions

#### List all subscriptions

```
GET /api/subscriptions
```

**Response**
```json
[
  {
    "id": "1",
    "userId": "user_123",
    "name": "Netflix",
    "amount": 19.99,
    "renewalDate": "2025-05-15T00:00:00.000Z",
    "frequency": "monthly",
    "category": "Entertainment",
    "active": true,
    "createdAt": "2025-04-15T14:30:00.000Z",
    "updatedAt": "2025-04-15T14:30:00.000Z"
  },
  {
    "id": "2",
    "userId": "user_123",
    "name": "Spotify",
    "amount": 9.99,
    "renewalDate": "2025-04-28T00:00:00.000Z",
    "frequency": "monthly",
    "category": "Music",
    "active": true,
    "createdAt": "2025-04-15T14:35:00.000Z",
    "updatedAt": "2025-04-15T14:35:00.000Z"
  }
]
```

#### Create new subscription

```
POST /api/subscriptions
```

**Request body**
```json
{
  "name": "Disney+",
  "amount": 14.99,
  "renewalDate": "2025-05-10T00:00:00.000Z",
  "frequency": "monthly",
  "category": "Entertainment",
  "active": true
}
```

**Response (201 Created)**
```json
{
  "id": "3",
  "userId": "user_123",
  "name": "Disney+",
  "amount": 14.99,
  "renewalDate": "2025-05-10T00:00:00.000Z",
  "frequency": "monthly",
  "category": "Entertainment",
  "active": true,
  "createdAt": "2025-04-16T15:00:00.000Z",
  "updatedAt": "2025-04-16T15:00:00.000Z"
}
```

#### Get subscription details

```
GET /api/subscriptions/:id
```

**Response**
```json
{
  "id": "1",
  "userId": "user_123",
  "name": "Netflix",
  "amount": 19.99,
  "renewalDate": "2025-05-15T00:00:00.000Z",
  "frequency": "monthly",
  "category": "Entertainment",
  "active": true,
  "createdAt": "2025-04-15T14:30:00.000Z",
  "updatedAt": "2025-04-15T14:30:00.000Z"
}
```

#### Update a subscription

```
PUT /api/subscriptions/:id
```

**Request body**
```json
{
  "name": "Netflix Premium",
  "amount": 21.99
}
```

**Response**
```json
{
  "id": "1",
  "userId": "user_123",
  "name": "Netflix Premium",
  "amount": 21.99,
  "renewalDate": "2025-05-15T00:00:00.000Z",
  "frequency": "monthly",
  "category": "Entertainment",
  "active": true,
  "createdAt": "2025-04-15T14:30:00.000Z",
  "updatedAt": "2025-04-16T15:10:00.000Z"
}
```

#### Delete a subscription

```
DELETE /api/subscriptions/:id
```

**Response (200 OK)**
```json
{
  "message": "Subscription deleted successfully"
}
```

### Notifications

#### Get notification settings

```
GET /api/notifications
```

**Response**
```json
{
  "userId": "user_123",
  "emailEnabled": true,
  "smsEnabled": false,
  "pushEnabled": false,
  "daysBeforeRenewal": 3,
  "phoneNumber": null,
  "createdAt": "2025-04-15T14:30:00.000Z",
  "updatedAt": "2025-04-15T14:30:00.000Z"
}
```

#### Update notification settings

```
PUT /api/notifications
```

**Request body**
```json
{
  "emailEnabled": true,
  "smsEnabled": true,
  "pushEnabled": false,
  "daysBeforeRenewal": 5,
  "phoneNumber": "+5511999999999"
}
```

**Response**
```json
{
  "userId": "user_123",
  "emailEnabled": true,
  "smsEnabled": true,
  "pushEnabled": false,
  "daysBeforeRenewal": 5,
  "phoneNumber": "+5511999999999",
  "createdAt": "2025-04-15T14:30:00.000Z",
  "updatedAt": "2025-04-16T15:15:00.000Z"
}
```

#### Send test notification

```
POST /api/notifications/test
```

**Request body**
```json
{
  "type": "email"
}
```

**Response**
```json
{
  "success": true,
  "message": "Test email notification sent successfully"
}
```

### Payments

#### Create Stripe checkout session

```
POST /api/payments/create-checkout-session
```

**Request body**
```json
{
  "plan": "monthly"
}
```

**Response**
```json
{
  "sessionId": "cs_test_a1b2c3d4e5f6g7h8i9j0",
  "url": "https://checkout.stripe.com/pay/cs_test_a1b2c3d4e5f6g7h8i9j0"
}
```

#### Stripe webhook for payment events

```
POST /api/payments/webhook
```

This endpoint is called by Stripe and should not be called directly.

#### Get payment history

```
GET /api/payments/history
```

**Response**
```json
[
  {
    "id": "1",
    "userId": "user_123",
    "amount": 9.90,
    "status": "success",
    "stripeSessionId": "cs_live_a1b2c3d4e5f6g7h8i9j0",
    "plan": "monthly",
    "createdAt": "2025-04-15T16:00:00.000Z"
  }
]
```

#### Get premium subscription status

```
GET /api/payments/subscription-status
```

**Response**
```json
{
  "plan": "premium",
  "premiumUntil": "2025-05-15T16:00:00.000Z",
  "isActive": true
}
```

### Users

#### Get user profile

```
GET /api/users/profile
```

**Response**
```json
{
  "id": "user_123",
  "email": "user@example.com",
  "name": "Example User",
  "plan": "premium",
  "premiumUntil": "2025-05-15T16:00:00.000Z",
  "createdAt": "2025-04-01T12:00:00.000Z",
  "updatedAt": "2025-04-15T16:00:00.000Z"
}
```

#### Update user profile

```
PUT /api/users/profile
```

**Request body**
```json
{
  "name": "New User Name"
}
```

**Response**
```json
{
  "id": "user_123",
  "email": "user@example.com",
  "name": "New User Name",
  "plan": "premium",
  "premiumUntil": "2025-05-15T16:00:00.000Z",
  "createdAt": "2025-04-01T12:00:00.000Z",
  "updatedAt": "2025-04-16T15:20:00.000Z"
}
```

## Error Codes

- `400 Bad Request` - Invalid request or missing parameters
- `401 Unauthorized` - Authentication required or invalid token
- `403 Forbidden` - Permission denied for the resource
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Internal server error

## Rate Limits

- Free plan: 100 requests per minute
- Premium plan: 500 requests per minute
