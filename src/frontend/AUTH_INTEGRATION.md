# Dokumentacja autentykacji - Integracja z Backend API

## Przegląd

System autentykacji wykorzystuje **TOTP (Time-based One-Time Password)** z Google Authenticator oraz sesje JWT przechowywane w ciasteczkach HTTP-only.

## Flow Autentykacji

### 1. Rejestracja (2 kroki)

#### Krok 1: Rozpoczęcie rejestracji
```typescript
// Hook: useRegisterStart()
const registerStartMutation = useRegisterStart();

registerStartMutation.mutate(username, {
  onSuccess: (data) => {
    // data zawiera: { userId, username, totpSecret }
    // Generuj QR kod z totpSecret
  }
});
```

**Endpoint:** `POST /auth/register-start`
- **Body:** `{ username: string }`
- **Response:** `{ userId: number, username: string, totpSecret: string }`
- Tworzy użytkownika z TOTP secret
- Frontend generuje QR kod używając funkcji `generateTotpQrCodeUrl()`
- Użytkownik skanuje kod w Google Authenticator

#### Krok 2: Potwierdzenie rejestracji
```typescript
// Hook: useRegisterConfirm()
const registerConfirmMutation = useRegisterConfirm();

registerConfirmMutation.mutate(
  { username, token: '123456' },
  {
    onSuccess: () => {
      // Automatyczne przekierowanie do /login?registered=true
    }
  }
);
```

**Endpoint:** `POST /auth/register-confirm`
- **Body:** `{ username: string, token: string }`
- **Response:** `{ message: string }`
- Weryfikuje 6-cyfrowy kod TOTP
- Aktywuje konto użytkownika
- Po sukcesie: redirect do strony logowania

### 2. Logowanie

```typescript
// Hook: useLogin()
const loginMutation = useLogin();

loginMutation.mutate(
  { username, token: '123456' },
  {
    onSuccess: (data) => {
      // data zawiera: { message, user: { id, username, role } }
      // Automatyczne przekierowanie do /dashboard
    }
  }
);
```

**Endpoint:** `POST /auth/login`
- **Body:** `{ username: string, token: string }`
- **Response:** `{ message: string, user: { id, username, role } }`
- Weryfikuje username + aktualny kod TOTP
- Ustawia ciasteczko HTTP-only z JWT (ważność: 7 dni)
- Dane użytkownika zapisywane w cache React Query
- Automatyczne przekierowanie do dashboard

### 3. Zarządzanie sesją

#### Pobieranie aktualnego użytkownika
```typescript
// Hook: useCurrentUser()
const { data: user, isLoading, error } = useCurrentUser();

// user zawiera: { id, username, role, name, surname, email, totpConfirmed, profileFillPercentage }
```

**Endpoint:** `GET /auth/me` (chroniony)
- **Response:** `UserProfile`
- Zwraca dane użytkownika z sesji JWT
- Automatyczne cache'owanie przez React Query (5 minut)
- Retry wyłączony (błąd 401 = niezalogowany)

#### Wylogowanie
```typescript
// Hook: useLogout()
const logoutMutation = useLogout();

logoutMutation.mutate();
// Automatyczne wyczyszczenie cache i przekierowanie do /
```

**Endpoint:** `POST /auth/logout` (chroniony)
- **Response:** `{ message: string }`
- Usuwa ciasteczko z JWT
- Czyści wszystkie query cache
- Usuwa dane z localStorage
- Automatyczne przekierowanie do strony głównej

### 4. Aktualizacja profilu

```typescript
// Hook: useUpdateProfile()
const updateProfileMutation = useUpdateProfile();

updateProfileMutation.mutate({
  name: 'Jan',
  surname: 'Kowalski',
  email: 'jan@example.com'
});
```

**Endpoint:** `PATCH /auth/profile` (chroniony)
- **Body:** `{ name?: string, surname?: string, email?: string }`
- **Response:** `{ message: string, user: UserProfile }`
- Aktualizuje dane profilu
- Odświeża cache z nowymi danymi

## Komponenty i Hooki

### Hooki dostępne w `lib/hooks/useAuthMutations.ts`

- **`useCurrentUser()`** - Query do pobierania aktualnego użytkownika
- **`useRegisterStart()`** - Mutation do rozpoczęcia rejestracji
- **`useRegisterConfirm()`** - Mutation do potwierdzenia rejestracji
- **`useLogin()`** - Mutation do logowania
- **`useLogout()`** - Mutation do wylogowania
- **`useUpdateProfile()`** - Mutation do aktualizacji profilu

### Funkcje pomocnicze

```typescript
// Generowanie URL QR kodu dla TOTP
generateTotpQrCodeUrl(username: string, totpSecret: string): string

// Walidacja kodu TOTP (6 cyfr)
isValidTotpCode(code: string): boolean

// Walidacja username (min 3 znaki, alfanumeryczne + - _)
isValidUsername(username: string): boolean
```

### Hook `useAuth()` (uproszczony)

```typescript
const { user, loading, error, logout, refetch } = useAuth();

if (loading) return <div>Loading...</div>;
if (!user) return <LoginForm />;

return <div>Welcome {user.username}</div>;
```

### Komponent `ProtectedRoute`

```typescript
import ProtectedRoute from '@/lib/components/ProtectedRoute';

function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}

// Wymaganie konkretnej roli
function AdminPage() {
  return (
    <ProtectedRoute requiredRole="ADMIN">
      <AdminPanel />
    </ProtectedRoute>
  );
}
```

## Bezpieczeństwo

### JWT w ciasteczkach HTTP-only
- Token JWT **nie jest dostępny** dla JavaScript (HttpOnly flag)
- Automatycznie dołączany do każdego requestu (`credentials: 'include'`)
- Ważność: 7 dni
- Bezpieczny przed atakami XSS

### TOTP (Google Authenticator)
- Okno czasowe: 30 sekund
- Tolerancja: 2 kroki (clock skew)
- Brak haseł - tylko TOTP
- Secret przechowywany w formacie base32

### Konfiguracja klienta API
```typescript
// lib/api/client.ts
client.setConfig({
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  credentials: 'include', // ⚠️ Kluczowe dla JWT w cookies
  headers: {
    'Content-Type': 'application/json',
  },
});
```

## Stany autentykacji

### Niezalogowany
- `useCurrentUser()` zwraca `error` z kodem 401
- `user === null`
- `ProtectedRoute` przekierowuje do `/login`

### Zalogowany
- `useCurrentUser()` zwraca dane użytkownika
- JWT w ciasteczku jest ważny
- Dostęp do chronionych tras

### Role użytkowników
- **PARTICIPANT** - domyślna rola (uczestnik hackathonów)
- **JUDGE** - sędzia (ocenia zgłoszenia)
- **ADMIN** - administrator (pełen dostęp)

## Cache i Query Keys

```typescript
// Klucze cache dla React Query
authKeys.all         // ['auth']
authKeys.me()        // ['auth', 'me']
```

## Obsługa błędów

### Rejestracja
- **400**: Nieprawidłowe dane lub username już istnieje
- **401**: Nieprawidłowy kod TOTP (confirm)
- **404**: Użytkownik nie znaleziony (confirm)
- **500**: Błąd serwera

### Logowanie
- **400**: Nieprawidłowe dane
- **401**: Nieprawidłowe credentials lub konto nieaktywowane
- **500**: Błąd serwera

### Chronione endpointy
- **401**: Brak sesji / nieprawidłowy token
- **403**: Brak uprawnień (role)

## Przykład kompletnego flow

```typescript
// Strona rejestracji
function SignUpPage() {
  const registerStart = useRegisterStart();
  const registerConfirm = useRegisterConfirm();
  
  const [step, setStep] = useState<'username' | 'qrcode' | 'verify'>('username');
  const [username, setUsername] = useState('');
  const [totpSecret, setTotpSecret] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  
  // Krok 1: Username
  const handleUsernameSubmit = () => {
    registerStart.mutate(username, {
      onSuccess: (data) => {
        setTotpSecret(data.totpSecret!);
        setQrCodeUrl(generateTotpQrCodeUrl(username, data.totpSecret!));
        setStep('qrcode');
      }
    });
  };
  
  // Krok 2: Skanowanie QR (user action w Google Authenticator)
  
  // Krok 3: Weryfikacja kodu
  const handleVerifyCode = (code: string) => {
    registerConfirm.mutate(
      { username, token: code },
      {
        onSuccess: () => {
          // Automatyczne przekierowanie do /login?registered=true
        }
      }
    );
  };
}

// Strona logowania
function LoginPage() {
  const login = useLogin();
  
  const handleLogin = (username: string, code: string) => {
    login.mutate(
      { username, token: code },
      {
        onSuccess: () => {
          // Automatyczne przekierowanie do /dashboard
        }
      }
    );
  };
}

// Dashboard (chroniony)
function DashboardPage() {
  const { user, loading } = useAuth();
  const logout = useLogout();
  
  if (loading) return <Spinner />;
  if (!user) return null; // ProtectedRoute przekieruje
  
  return (
    <div>
      <h1>Welcome {user.username}</h1>
      <p>Role: {user.role}</p>
      <button onClick={() => logout.mutate()}>Logout</button>
    </div>
  );
}
```

## Zmienne środowiskowe

```env
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## Backend Requirements

Backend musi być uruchomiony na porcie 3000 (lub innym zdefiniowanym w `NEXT_PUBLIC_API_URL`) i musi:
1. Obsługiwać wszystkie endpointy opisane w dokumentacji
2. Ustawiać ciasteczko HTTP-only z JWT po logowaniu
3. Weryfikować JWT w chronionych endpointach
4. Zwracać odpowiednie kody błędów (401, 403, etc.)
