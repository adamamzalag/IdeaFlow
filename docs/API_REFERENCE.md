# IdeaFlow API Reference

## Base URL

Production: `https://ideaflow.replit.app/api` (TBD)

## Authentication

All endpoints require Replit Auth. The user is identified via Replit's authentication headers.

---

## Ideas

### List Ideas

```
GET /api/ideas
```

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| status | string | all | Filter by status: processing, ready, pursuing, deferred |
| limit | number | 20 | Items per page |
| offset | number | 0 | Pagination offset |

**Response:**
```json
{
  "ideas": [
    {
      "id": "uuid",
      "title": "AI-generated summary",
      "status": "ready",
      "createdAt": "2026-01-10T12:00:00Z",
      "updatedAt": "2026-01-10T12:05:00Z"
    }
  ],
  "total": 42,
  "hasMore": true
}
```

### Create Idea

```
POST /api/ideas
```

**Body:**
```json
{
  "rawInput": "Text of the idea or voice transcript",
  "audioUrl": "optional-url-to-audio-file"
}
```

**Response:**
```json
{
  "id": "uuid",
  "status": "processing",
  "createdAt": "2026-01-10T12:00:00Z"
}
```

### Get Idea

```
GET /api/ideas/:id
```

**Response:**
```json
{
  "id": "uuid",
  "rawInput": "Original text or transcript",
  "audioUrl": "optional",
  "status": "ready",
  "createdAt": "2026-01-10T12:00:00Z",
  "updatedAt": "2026-01-10T12:05:00Z",
  "analysis": {
    "version": 2,
    "summary": "One sentence summary",
    "problemItSolves": "...",
    "howItWouldWork": "...",
    "effortEstimate": "...",
    "potentialValue": "...",
    "challenges": "...",
    "howToAccomplish": "...",
    "nextSteps": "...",
    "questionsForYou": ["...", "..."]
  },
  "conversation": {
    "messages": [
      {
        "role": "assistant",
        "content": "I have a few questions...",
        "timestamp": "2026-01-10T12:05:00Z"
      }
    ]
  }
}
```

### Update Idea Status

```
PATCH /api/ideas/:id/status
```

**Body:**
```json
{
  "status": "pursuing" | "deferred"
}
```

**Response:**
```json
{
  "id": "uuid",
  "status": "pursuing",
  "statusChangedAt": "2026-01-10T12:10:00Z"
}
```

### Delete Idea

```
DELETE /api/ideas/:id
```

**Response:**
```json
{
  "success": true
}
```

---

## Chat

### Send Message

```
POST /api/ideas/:id/chat
```

**Body:**
```json
{
  "message": "User's message"
}
```

**Response:**
```json
{
  "response": "AI's response",
  "analysisUpdated": true,
  "analysis": {
    "version": 3,
    "summary": "Updated summary if changed",
    ...
  }
}
```

### Get Conversation

```
GET /api/ideas/:id/chat
```

**Response:**
```json
{
  "messages": [
    {
      "role": "user" | "assistant",
      "content": "Message content",
      "timestamp": "2026-01-10T12:05:00Z"
    }
  ]
}
```

---

## User

### Get Profile

```
GET /api/user/profile
```

**Response:**
```json
{
  "id": "uuid",
  "name": "Adam",
  "constraints": "COO, time-constrained, 3 kids",
  "preferences": {}
}
```

### Update Profile

```
PATCH /api/user/profile
```

**Body:**
```json
{
  "name": "Adam",
  "constraints": "Updated constraints"
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Idea not found"
  }
}
```

**Common Error Codes:**
| Code | HTTP Status | Description |
|------|-------------|-------------|
| UNAUTHORIZED | 401 | Not authenticated |
| NOT_FOUND | 404 | Resource doesn't exist |
| VALIDATION_ERROR | 400 | Invalid input |
| PROCESSING | 202 | Idea still being processed |
| INTERNAL_ERROR | 500 | Server error |

---

*Last updated: January 10, 2026*
