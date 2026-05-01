# DocMaster API Documentation

## Base URL
```
http://localhost:5000/api
```

---

## Authentication Endpoints

### 1. Register User
**POST** `/auth/register`

Create a new user account. A unique referral code is automatically generated.

#### Request Body
```json
{
  "nom": "Dupont",
  "prenom": "Jean",
  "email": "jean.dupont@example.com",
  "mot_de_passe": "SecurePassword123!",
  "telephone": "+237123456789",
  "pays": "Cameroun",
  "ville": "Yaoundé",
  "parrain_id": "uuid-of-referrer (optional)"
}
```

#### Response (201 Created)
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "nom": "Dupont",
    "prenom": "Jean",
    "email": "jean.dupont@example.com",
    "telephone": "+237123456789",
    "pays": "Cameroun",
    "ville": "Yaoundé",
    "is_verified": false,
    "points": 0,
    "wallet_balance": "0.00",
    "created_at": "2024-04-28T10:30:00Z",
    "updated_at": "2024-04-28T10:30:00Z"
  },
  "code_invitation": "ABC12XYZ"
}
```

#### Error Responses
- **400**: Missing required fields (nom, prenom, email, mot_de_passe)
- **409**: Email already exists
- **500**: Server error

---

### 2. Login User
**POST** `/auth/login`

Authenticate user and receive JWT token for subsequent requests.

#### Request Body
```json
{
  "email": "jean.dupont@example.com",
  "mot_de_passe": "SecurePassword123!"
}
```

#### Response (200 OK)
```json
{
  "message": "Login successful",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "nom": "Dupont",
    "prenom": "Jean",
    "email": "jean.dupont@example.com",
    "telephone": "+237123456789",
    "pays": "Cameroun",
    "ville": "Yaoundé",
    "is_verified": false,
    "code_invitation": "ABC12XYZ",
    "points": 0,
    "wallet_balance": "0.00",
    "created_at": "2024-04-28T10:30:00Z",
    "updated_at": "2024-04-28T10:30:00Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Error Responses
- **400**: Email and password required
- **401**: Invalid email or password
- **500**: Server error

---

### 3. Forgot Password
**POST** `/auth/forgot-password`

Request a password reset. In production, a reset link should be sent via email.

#### Request Body
```json
{
  "email": "jean.dupont@example.com"
}
```

#### Response (200 OK)
```json
{
  "message": "Password reset email sent",
  "token": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"
}
```

#### Error Responses
- **400**: Email required
- **404**: User not found
- **500**: Server error

---

### 4. Reset Password
**POST** `/auth/reset-password`

Complete password reset using the token received from forgot-password endpoint.

#### Request Body
```json
{
  "token": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
  "newPassword": "NewSecurePassword456!"
}
```

#### Response (200 OK)
```json
{
  "message": "Password reset successfully",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "jean.dupont@example.com"
  }
}
```

#### Error Responses
- **400**: Token and password required
- **401**: Invalid or expired reset token
- **500**: Server error

---

### 5. Get User Profile
**GET** `/auth/profile` (Protected)

Retrieve current user's profile information.

#### Headers
```
Authorization: Bearer <your-jwt-token>
```

#### Response (200 OK)
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "nom": "Dupont",
  "prenom": "Jean",
  "email": "jean.dupont@example.com",
  "telephone": "+237123456789",
  "pays": "Cameroun",
  "ville": "Yaoundé",
  "is_verified": false,
  "code_invitation": "ABC12XYZ",
  "photo_url": "uploads/profiles/user-123.jpg",
  "points": 0,
  "wallet_balance": "0.00",
  "created_at": "2024-04-28T10:30:00Z",
  "updated_at": "2024-04-29T08:15:00Z"
}
```

---

### 6. Update User Profile
**PUT** `/auth/profile` (Protected)

Update user profile details and/or profile photo. Supports `multipart/form-data`.

#### Headers
```
Authorization: Bearer <your-jwt-token>
Content-Type: multipart/form-data
```

#### Request Body (Form Data)
| Key | Type | Description |
| :--- | :--- | :--- |
| `nom` | string | User's last name |
| `prenom` | string | User's first name |
| `telephone` | string | User's phone number |
| `ville` | string | User's city |
| `photo_profile` | file | Profile photo (PNG, JPG, max 5MB) |

#### Response (200 OK)
```json
{
  "message": "Profile updated successfully",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "nom": "Dupont",
    "prenom": "Jean",
    "email": "jean.dupont@example.com",
    "telephone": "+237677000000",
    "photo_url": "uploads/profiles/photo-1714382000.jpg",
    ...
  }
}
```

---

## Document Endpoints

### 1. Register Document
**POST** `/documents` (Protected)

Register a personal document with photos. Supports `multipart/form-data`.

#### Headers
```
Authorization: Bearer <your-jwt-token>
Content-Type: multipart/form-data
```

#### Request Body (Form Data)
| Key | Type | Description |
| :--- | :--- | :--- |
| `type_doc` | string | Type of document (CNI, Passeport, etc.) |
| `numero_doc` | string | Document number |
| `nom_complet` | string | Name on document |
| `date_expiration` | date | Expiry date (optional) |
| `photo_recto` | file | Front photo |
| `photo_verso` | file | Back photo |

#### Response (201 Created)
```json
{
  "success": true,
  "message": "Document personnel enregistré avec succès",
  "data": { "id": "...", ... }
}
```

---

### 2. List My Documents
**GET** `/documents` (Protected)

List all personal documents registered by the current user.

#### Response (200 OK)
```json
{
  "success": true,
  "count": 3,
  "data": [
    { "id": "1", "type_doc": "CNI", ... },
    { "id": "2", "type_doc": "Passeport", ... }
  ]
}
```

---

### 3. Delete Document
**DELETE** `/documents/:id` (Protected)

Delete a personal document.

#### Response (200 OK)
```json
{
  "success": true,
  "message": "Document supprimé avec succès"
}
```

---

## Key Features

### 🔐 Security
- Passwords hashed with **Argon2** (strongest hashing algorithm)
- JWT tokens with configurable expiry (default: 24h)
- Password reset tokens expire after 24h
- Reset tokens marked as used after one-time use (prevents reuse)
- SQL injection prevention using prepared statements

### 🎯 Referral System
- Unique 8-character referral code generated automatically per user
- Format: Alphanumeric (A-Z, 0-9) - Example: `XY7KA9Z2`
- Stored in `code_invitation` field
- Can be used for referral tracking

### 📧 JWT Token
- Contains: `id`, `email`
- Expiry: 24 hours (configurable in `.env`)
- Use in subsequent requests as: `Authorization: Bearer <token>`

---

## Environment Variables

Add these to your `.env` file:

```env
JWT_SECRET=your-secret-key-min-32-chars-for-production
JWT_EXPIRY=24h
DATABASE_URL=postgresql://user:password@localhost:5432/docmaster
PORT=5000
```

---

## Error Handling

All endpoints follow standard HTTP status codes:
- **200**: Success
- **201**: Created successfully
- **400**: Bad request (validation error)
- **401**: Unauthorized (invalid credentials/token)
- **404**: Not found
- **409**: Conflict (duplicate email)
- **500**: Server error

---

## Future Endpoints (To be implemented)

- [ ] POST `/auth/verify-email` - Email verification
- [ ] POST `/auth/refresh-token` - Refresh JWT
- [ ] POST `/auth/logout` - Logout (optional, stateless)
- [ ] GET `/auth/referrals` - Get user referrals
- [ ] POST `/declarations` - Declare a lost/found document
- [ ] GET `/declarations` - List declared documents
