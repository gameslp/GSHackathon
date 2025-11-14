# Authentication

TOTP-based authentication using Google Authenticator + JWT sessions.

## Flow

### 1. Registration
```
POST /auth/register-start
Body: { username: string }
Response: { userId, username, totpSecret }
```
- Creates user with TOTP secret
- Frontend generates QR code from `totpSecret`
- User scans with Google Authenticator

```
POST /auth/register-confirm
Body: { username: string, token: string }
Response: { message }
```
- Verifies TOTP code
- Activates user account

### 2. Login
```
POST /auth/login
Body: { username: string, token: string }
Response: { message, user: { id, username, role } }
```
- Validates username + current TOTP code
- Sets HTTP-only cookie with JWT (7 day expiry)

### 3. Session Management
```
GET /auth/me (protected)
Response: { id, username, role }
```
- Returns current user from JWT cookie

```
POST /auth/logout (protected)
Response: { message }
```
- Clears authentication cookie

## Security

- JWT stored in HTTP-only cookie (not accessible via JavaScript)
- TOTP window: 30 seconds with 2-step tolerance for clock skew
- Passwords: None (TOTP-only authentication)
- JWT Secret: Set via `SECRET` env variable

## Database Schema

```prisma
model User {
  id            Int      @id @default(autoincrement())
  username      String   @unique
  totpSecret    String   // base32 encoded
  totpConfirmed Boolean  @default(false)
  role          Role     @default(PARTICIPANT)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

enum Role {
  ADMIN
  JUDGE
  PARTICIPANT
}
```

## Environment Variables

```env
SECRET=your-jwt-secret-key
JWT_EXPIRES_IN=7d  # Optional, defaults to 7d
```

## Protected Routes

Add `auth` middleware to protect routes:

```typescript
import { auth } from './middleware/auth';

router.get('/protected', auth, controller);
```

User data available in request:
```typescript
(req as any).user // { userId, username, role }
```
