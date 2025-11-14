# Admin Team Management

Admin dashboard for reviewing and accepting/rejecting hackathon teams with survey responses.

## Overview

Teams are **not accepted by default**. Admins must review team applications including all member survey responses before accepting them for participation.

---

## Admin Flow

### 1. View Hackathon Teams List

```
GET /hackathons/{hackathonId}/teams?page=1&limit=10
```

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Teams per page (default: 10)

**Response:**
```json
{
  "teams": [
    {
      "id": 1,
      "name": "Team Alpha",
      "invitationCode": "123456",
      "captainId": 5,
      "isAccepted": false,
      "memberCount": 3,
      "members": [
        {
          "id": 5,
          "username": "captain_user",
          "name": "John",
          "surname": "Doe",
          "email": "john@example.com"
        },
        {
          "id": 6,
          "username": "member2",
          "name": "Jane",
          "surname": "Smith",
          "email": "jane@example.com"
        },
        {
          "id": 7,
          "username": "member3",
          "name": "Bob",
          "surname": "Wilson",
          "email": "bob@example.com"
        }
      ],
      "createdAt": "2025-01-14T12:00:00Z",
      "updatedAt": "2025-01-14T12:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

**UI Display:**
- Table with columns: Team Name, Members Count, Status (Accepted/Pending), Created Date
- Filter by acceptance status (optional)
- Click team row to view details

---

### 2. View Team Details with Survey Responses

```
GET /hackathons/teams/{teamId}
```

**Response:**
```json
{
  "team": {
    "id": 1,
    "name": "Team Alpha",
    "invitationCode": "123456",
    "captainId": 5,
    "isAccepted": false,
    "hackathon": {
      "id": 10,
      "title": "ML Hackathon 2025",
      "teamMax": 4,
      "teamMin": 2
    },
    "memberResponses": [
      {
        "member": {
          "id": 5,
          "username": "captain_user",
          "name": "John",
          "surname": "Doe",
          "email": "john@example.com"
        },
        "surveyResponses": [
          {
            "questionId": 1,
            "question": "What is your experience level with machine learning?",
            "answer": "Intermediate - I've completed online courses and built 2-3 projects",
            "order": 1
          },
          {
            "questionId": 2,
            "question": "Why do you want to participate in this hackathon?",
            "answer": "To learn new ML techniques and collaborate with others",
            "order": 2
          },
          {
            "questionId": 3,
            "question": "What are your preferred programming languages?",
            "answer": "Python, R",
            "order": 3
          }
        ]
      },
      {
        "member": {
          "id": 6,
          "username": "member2",
          "name": "Jane",
          "surname": "Smith",
          "email": "jane@example.com"
        },
        "surveyResponses": [
          {
            "questionId": 1,
            "question": "What is your experience level with machine learning?",
            "answer": "Advanced - Professional experience with production ML systems",
            "order": 1
          },
          {
            "questionId": 2,
            "question": "Why do you want to participate in this hackathon?",
            "answer": "To test new ideas and network with other ML practitioners",
            "order": 2
          },
          {
            "questionId": 3,
            "question": "What are your preferred programming languages?",
            "answer": "Python, Julia",
            "order": 3
          }
        ]
      }
    ],
    "createdAt": "2025-01-14T12:00:00Z",
    "updatedAt": "2025-01-14T12:30:00Z"
  }
}
```

**UI Display:**
- Team header: Name, Status, Invitation Code, Captain badge
- Member cards/sections for each team member
- Each member shows:
  - Profile info (name, username, email)
  - All survey Q&A pairs
  - Captain indicator (if applicable)
- Accept/Reject buttons at bottom

---

### 3. Accept Team

```
POST /hackathons/teams/{teamId}/accept
```

**Response:**
```json
{
  "message": "Team accepted successfully",
  "team": {
    "id": 1,
    "name": "Team Alpha",
    "isAccepted": true,
    "hackathon": {
      "id": 10,
      "title": "ML Hackathon 2025"
    },
    "members": [/* ... */],
    "updatedAt": "2025-01-14T13:00:00Z"
  }
}
```

**Validation:**
- Returns 400 if team is already accepted
- Returns 404 if team not found

**UI Behavior:**
- Show success message
- Update team status badge to "Accepted"
- Optionally navigate back to teams list

---

### 4. Reject Team

```
POST /hackathons/teams/{teamId}/reject
```

**Response:**
```json
{
  "message": "Team rejected successfully",
  "team": {
    "id": 1,
    "name": "Team Alpha",
    "isAccepted": false,
    "hackathon": {
      "id": 10,
      "title": "ML Hackathon 2025"
    },
    "members": [/* ... */],
    "updatedAt": "2025-01-14T13:00:00Z"
  }
}
```

**UI Behavior:**
- Show confirmation dialog before rejecting
- Update team status badge to "Pending" or "Rejected"
- Can be used to un-accept a previously accepted team

---

## Business Rules

### Team Acceptance
- **Default state**: Teams are NOT accepted (`isAccepted = false`)
- **Admin review required**: Admin must explicitly accept teams
- **Can un-accept**: Admins can reject previously accepted teams
- **No automatic acceptance**: Even if team meets all criteria

### Access Control
- **Admin only**: All endpoints require ADMIN role
- **Authentication**: Must be logged in with valid JWT cookie
- **Authorization**: Returns 403 if user is not an admin

### Team Status Impact
- Accepted teams can participate in hackathon
- Rejected/pending teams cannot submit solutions
- Frontend should check `isAccepted` before allowing team actions

---

## Frontend Example

### Teams List Page

```typescript
// Fetch teams for hackathon
const { teams, pagination } = await fetch(
  `/hackathons/${hackathonId}/teams?page=${page}&limit=10`
).then(r => r.json())

// Display in table
teams.forEach(team => {
  displayTeamRow({
    name: team.name,
    memberCount: team.memberCount,
    status: team.isAccepted ? 'Accepted' : 'Pending',
    createdAt: team.createdAt,
    onClick: () => navigateToTeamDetails(team.id)
  })
})
```

### Team Details Page

```typescript
// Fetch team details with survey responses
const { team } = await fetch(`/hackathons/teams/${teamId}`)
  .then(r => r.json())

// Display team info
displayTeamHeader({
  name: team.name,
  status: team.isAccepted,
  invitationCode: team.invitationCode,
  hackathon: team.hackathon
})

// Display each member with their survey responses
team.memberResponses.forEach(({ member, surveyResponses }) => {
  displayMemberCard({
    member,
    isCaptain: member.id === team.captainId,
    responses: surveyResponses.map(r => ({
      question: r.question,
      answer: r.answer
    }))
  })
})

// Accept team button
async function acceptTeam() {
  const { message } = await fetch(`/hackathons/teams/${teamId}/accept`, {
    method: 'POST'
  }).then(r => r.json())

  showSuccessMessage(message)
  updateTeamStatus(true)
}

// Reject team button
async function rejectTeam() {
  if (!confirm('Are you sure you want to reject this team?')) return

  const { message } = await fetch(`/hackathons/teams/${teamId}/reject`, {
    method: 'POST'
  }).then(r => r.json())

  showSuccessMessage(message)
  updateTeamStatus(false)
}
```

---

## UI/UX Recommendations

### Teams List Page
- **Search/Filter**: By team name, acceptance status
- **Sorting**: By creation date, name, member count
- **Status badges**: Color-coded (Green = Accepted, Gray = Pending)
- **Bulk actions**: Optional bulk accept/reject
- **Export**: Download teams list as CSV

### Team Details Page
- **Clear layout**: Team info → Member cards → Actions
- **Survey Q&A format**: Question in bold, answer below
- **Member differentiation**: Highlight team captain
- **Quick actions**: Accept/Reject buttons always visible
- **Navigation**: Back to teams list, Next/Previous team
- **Confirmation**: Require confirmation for reject action

### Status Indicators
```
✅ Accepted  - Green badge
⏳ Pending   - Gray/Yellow badge
❌ Rejected  - Red badge (same as Pending in DB)
```

---

## Error Scenarios

### Get Teams
- `400` - Invalid hackathon ID
- `401` - Not authenticated
- `403` - Not an admin
- `404` - Hackathon not found

### Get Team Details
- `400` - Invalid team ID
- `401` - Not authenticated
- `403` - Not an admin
- `404` - Team not found

### Accept Team
- `400` - Team already accepted
- `401` - Not authenticated
- `403` - Not an admin
- `404` - Team not found

### Reject Team
- `400` - Invalid team ID
- `401` - Not authenticated
- `403` - Not an admin
- `404` - Team not found

---

## Database Schema

### Team Model
```prisma
model Team {
  id             Int      @id @default(autoincrement())
  name           String
  invitationCode String   @unique
  captainId      Int
  isAccepted     Boolean  @default(false)  // ← Admin acceptance
  hackathonId    Int

  members         User[]
  surveyResponses SurveyResponse[]
  hackathon       Hackathon
}
```

### Survey Response Model
```prisma
model SurveyResponse {
  id         Int
  questionId Int
  teamId     Int
  userId     Int      // Which member answered
  answer     String

  @@unique([questionId, teamId, userId])
}
```

---

## Workflow Summary

1. **Teams List** → Admin sees all teams with basic info
2. **Team Details** → Click team to see all member survey responses
3. **Review** → Read through each member's answers
4. **Decision** → Accept or Reject based on survey quality
5. **Update** → Team status changes, members can/cannot participate
6. **Repeat** → Process next team

This allows admins to manually curate hackathon teams based on survey responses and team composition.
