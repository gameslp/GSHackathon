# Backend Integration with React Query and hey-api

This project uses **React Query** for data fetching and state management, and **hey-api** for generating type-safe API clients from OpenAPI specifications.

## Setup

### 1. Install Dependencies

All required packages are already installed:
- `@tanstack/react-query` - Data fetching and caching
- `@tanstack/react-query-devtools` - Developer tools for React Query
- `@hey-api/openapi-ts` - OpenAPI client generator
- `@hey-api/client-fetch` - Fetch client for hey-api

### 2. API Client Generation

The API client is generated from the OpenAPI specification (`openapi.json`):

```bash
npm run generate-api
```

This generates TypeScript types and API functions in `lib/api/generated/`.

### 3. Environment Variables

Create/update `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## Architecture

### API Client (`lib/api/client.ts`)

Configures the generated API client with:
- Base URL from environment variables
- Credentials mode set to `'include'` for cookie-based authentication
- Content-Type headers

### React Query Provider (`lib/providers/QueryProvider.tsx`)

Wraps the application with QueryClientProvider and includes:
- Default query options (stale time, retry logic)
- React Query DevTools for development

### Custom Hooks

#### Authentication (`lib/hooks/useAuthMutations.ts`)

- `useCurrentUser()` - Get current authenticated user
- `useRegisterStart()` - Start registration process
- `useRegisterConfirm()` - Confirm registration with TOTP
- `useLogin()` - Login with username and TOTP
- `useLogout()` - Logout current user
- `useUpdateProfile()` - Update user profile

#### Hackathons (`lib/hooks/useHackathons.ts`)

- `useHackathons(params?)` - Get paginated list of hackathons
- `useHackathon(id)` - Get specific hackathon details
- `useActiveHackathons()` - Get currently active hackathons
- `useUpcomingHackathons()` - Get upcoming hackathons
- `useCreateHackathon()` - Create new hackathon (Admin)
- `useUpdateHackathon()` - Update hackathon (Admin)
- `useDeleteHackathon()` - Delete hackathon (Admin)

#### Teams (`lib/hooks/useTeams.ts`)

- `useMyTeam(hackathonId)` - Get user's team for a hackathon
- `useHackathonSurvey(hackathonId)` - Get survey questions
- `useCreateTeam()` - Create a new team
- `useJoinTeam()` - Join an existing team

#### Admin (`lib/hooks/useAdmin.ts`)

- `useAdminUsers(params?)` - Get all users (Admin only)
- `useUpdateUserRole()` - Update user role (Admin only)
- `useDeleteUser()` - Delete user (Admin only)
- `useHackathonTeams(hackathonId)` - Get teams for a hackathon (Admin)
- `useTeamDetail(teamId)` - Get team with survey responses (Admin)
- `useAcceptTeam()` - Accept a team (Admin)
- `useRejectTeam()` - Reject a team (Admin)

## Usage Examples

### Authentication

```tsx
import { useLogin, useCurrentUser } from '@/lib/hooks/useAuthMutations';

function LoginForm() {
  const loginMutation = useLogin();
  const { data: user, isLoading } = useCurrentUser();

  const handleLogin = () => {
    loginMutation.mutate(
      { body: { username: 'user', token: '123456' } } as any,
      {
        onSuccess: () => console.log('Logged in!'),
        onError: (error) => console.error(error),
      }
    );
  };

  if (isLoading) return <div>Loading...</div>;
  if (user) return <div>Welcome {user.username}</div>;
  
  return <button onClick={handleLogin}>Login</button>;
}
```

### Fetching Hackathons

```tsx
import { useHackathons, useActiveHackathons } from '@/lib/hooks/useHackathons';

function HackathonsList() {
  const { data, isLoading, error } = useActiveHackathons();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {data?.map(hackathon => (
        <div key={hackathon.id}>{hackathon.title}</div>
      ))}
    </div>
  );
}
```

### Creating a Team

```tsx
import { useCreateTeam } from '@/lib/hooks/useTeams';

function CreateTeamForm() {
  const createTeamMutation = useCreateTeam();

  const handleSubmit = (teamData) => {
    createTeamMutation.mutate(
      { body: teamData } as any,
      {
        onSuccess: (data) => {
          console.log('Team created:', data.team);
        },
        onError: (error) => {
          console.error('Failed to create team:', error);
        },
      }
    );
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
      <button type="submit" disabled={createTeamMutation.isPending}>
        {createTeamMutation.isPending ? 'Creating...' : 'Create Team'}
      </button>
    </form>
  );
}
```

## Protected Routes

Use the `ProtectedRoute` component to restrict access:

```tsx
import ProtectedRoute from '@/lib/components/ProtectedRoute';

function AdminPage() {
  return (
    <ProtectedRoute requiredRole="ADMIN">
      <div>Admin content</div>
    </ProtectedRoute>
  );
}
```

## Query Keys Structure

Each resource has organized query keys for better cache management:

```typescript
// Authentication
authKeys.me() // Current user

// Hackathons
hackathonKeys.lists() // All lists
hackathonKeys.list(filters) // Specific list with filters
hackathonKeys.detail(id) // Single hackathon
hackathonKeys.active() // Active hackathons
hackathonKeys.upcoming() // Upcoming hackathons

// Teams
teamKeys.myTeam(hackathonId) // User's team
teamKeys.survey(hackathonId) // Survey questions

// Admin
adminKeys.users() // All users
adminKeys.hackathonTeams(hackathonId) // Teams for hackathon
adminKeys.teamDetail(teamId) // Team details
```

## Development Tools

React Query DevTools are enabled in development mode. Press the React Query icon in the bottom-left corner to open the DevTools panel.

## Authentication Flow

1. **Registration**:
   - Call `useRegisterStart()` with username
   - Display QR code from returned `totpSecret`
   - User scans with Google Authenticator
   - Call `useRegisterConfirm()` with TOTP code
   - Redirect to login page

2. **Login**:
   - Call `useLogin()` with username and TOTP code
   - JWT stored in HTTP-only cookie
   - User data cached in React Query
   - Redirect to dashboard

3. **Session**:
   - `useCurrentUser()` checks authentication status
   - Automatically refetches on page focus
   - Cookie included in all API requests

4. **Logout**:
   - Call `useLogout()`
   - Clears all queries
   - Removes JWT cookie
   - Redirects to home page

## Error Handling

All hooks provide error states through React Query:

```tsx
const { data, error, isLoading } = useHackathons();

if (error) {
  // error.message contains the error message
  return <div>Error: {error.message}</div>;
}
```

## Regenerating API Client

When the backend API changes:

1. Update `openapi.json` with new OpenAPI specification
2. Run `npm run generate-api`
3. Update hooks if needed
4. TypeScript will catch any breaking changes
