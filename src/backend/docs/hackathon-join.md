# Hackathon Join Flow

Team-based participation system with 6-digit invitation codes and hackathon-specific surveys.

## User Flow

### 1. View Hackathon
User browses available hackathons and selects one to join.

### 2. Choose Join Method
Two options presented:
- **Create Team** - Start a new team
- **Join Team** - Join existing team via invitation code

---

## Create Team Flow

### Step 1: Get Survey Questions
```
GET /teams/hackathon/{hackathonId}/survey
Response: { questions: [{ id, question, order }] }
```

### Step 2: Create Team
```
POST /teams/create
Body: {
  hackathonId: number,
  teamName: string,
  surveyResponses: [
    { questionId: number, answer: string }
  ]
}
```

**Validations:**
- Registration must be open (between `registrationOpen` and `startDate`)
- User not already in a team for this hackathon
- Team name: 1-100 characters
- All survey questions must be answered

**Response:**
```json
{
  "message": "Team created successfully",
  "team": {
    "id": 1,
    "name": "Team Alpha",
    "invitationCode": "123456",
    "captainId": 5,
    "hackathon": {
      "id": 1,
      "title": "ML Hackathon 2025",
      "teamMax": 4,
      "teamMin": 2
    },
    "members": [
      {
        "id": 5,
        "username": "captain_user",
        "name": "John",
        "surname": "Doe"
      }
    ],
    "createdAt": "2025-01-14T12:00:00Z"
  }
}
```

### Step 3: Team Created View
User sees:
- **Invitation Code** (6 digits) - Share with teammates
- **Team Members Table** - List of joined members
- Team name and hackathon details

---

## Join Team Flow

### Step 1: Get Survey Questions
```
GET /teams/hackathon/{hackathonId}/survey
Response: { questions: [{ id, question, order }] }
```

### Step 2: Enter Invitation Code
User enters 6-digit code from team captain.

### Step 3: Complete Survey
User answers all required survey questions.

### Step 4: Join Team
```
POST /teams/join
Body: {
  invitationCode: "123456",
  surveyResponses: [
    { questionId: number, answer: string }
  ]
}
```

**Validations:**
- Valid 6-digit invitation code
- Registration must be open
- Team not full (< teamMax)
- User not already in a team for this hackathon
- All survey questions must be answered

**Response:**
```json
{
  "message": "Successfully joined team",
  "team": {
    "id": 1,
    "name": "Team Alpha",
    "invitationCode": "123456",
    "captainId": 5,
    "hackathon": { /* ... */ },
    "members": [
      { /* captain */ },
      { /* new member */ }
    ],
    "createdAt": "2025-01-14T12:00:00Z"
  }
}
```

### Step 5: Team View
User sees their team with all current members.

---

## View My Team

Get current team for a hackathon:
```
GET /teams/hackathon/{hackathonId}
Response: { team: { /* TeamDetails */ } }
```

---

## Business Rules

### Registration Window
- Teams can only be created/joined between `registrationOpen` and `startDate`
- After `startDate`, teams are locked

### Team Constraints
- **One team per user per hackathon**
- **Team size**: Between `teamMin` and `teamMax` members
- **Captain**: First member who creates the team
- **Invitation code**: Unique 6-digit number (auto-generated)

### Survey Requirements
- Defined by admin when creating hackathon
- All questions must be answered when joining/creating team
- Responses stored per user per team
- Questions can be different for each hackathon

---

## Database Models

### Team
```prisma
model Team {
  id             Int
  name           String
  invitationCode String @unique  // 6-digit code
  captainId      Int             // Team captain
  hackathonId    Int
  members        User[]
  surveyResponses SurveyResponse[]
}
```

### SurveyQuestion
```prisma
model SurveyQuestion {
  id          Int
  hackathonId Int
  question    String
  order       Int     // Display order
  responses   SurveyResponse[]
}
```

### SurveyResponse
```prisma
model SurveyResponse {
  id         Int
  questionId Int
  teamId     Int
  userId     Int
  answer     String

  @@unique([questionId, teamId, userId])
}
```

---

## Error Scenarios

### Create Team
- `400` - Already in a team for this hackathon
- `400` - Registration not open
- `400` - Survey validation failed (missing answers)
- `404` - Hackathon not found

### Join Team
- `404` - Invalid invitation code
- `400` - Team is full
- `400` - Already in a team for this hackathon
- `400` - Registration not open
- `400` - Survey validation failed

---

## Security

- All create/join operations require authentication
- Survey questions endpoint is public (needed before auth/join)
- Invitation codes are randomly generated (100,000 - 999,999)
- Uniqueness guaranteed at database level

---

## Example Frontend Flow

```typescript
// 1. Fetch survey questions
const { questions } = await fetch(`/teams/hackathon/${hackathonId}/survey`)

// 2. User fills survey
const answers = questions.map(q => ({
  questionId: q.id,
  answer: userInput[q.id]
}))

// 3a. Create team
const { team } = await fetch('/teams/create', {
  method: 'POST',
  body: JSON.stringify({
    hackathonId,
    teamName: "Team Alpha",
    surveyResponses: answers
  })
})
// Show invitation code: team.invitationCode

// 3b. OR Join team
const { team } = await fetch('/teams/join', {
  method: 'POST',
  body: JSON.stringify({
    invitationCode: "123456",
    surveyResponses: answers
  })
})

// 4. Show team view with members
displayTeam(team)
```
