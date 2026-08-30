# Kinetra — Mobile Team Integration Guide

> **Target Audience**: Mobile Application Engineers (React Native / Flutter / iOS / Android)  
> **Backend Protocol**: REST / JSON over HTTPS  
> **API Version**: `v1`  
> **API Contract Reference**: [API_CONTRACT.md](API_CONTRACT.md)

---

## 1. Environment & API Base URL Configuration

The mobile application should configure and store a single environment variable:

```env
API_BASE_URL=http://localhost:5000/api/v1
```

### Environment Base URLs

| Environment | Base URL | Health Check URL | Notes |
|---|---|---|---|
| **Local (iOS Simulator)** | `http://localhost:5000/api/v1` | `http://localhost:5000/health` | Directly accessible on iOS simulator / macOS |
| **Local (Android Emulator)** | `http://10.0.2.2:5000/api/v1` | `http://10.0.2.2:5000/health` | Android emulator loopback interface |
| **Local (Physical Device)** | `http://<YOUR_LAN_IP>:5000/api/v1` | `http://<YOUR_LAN_IP>:5000/health` | Ensure mobile and backend are on same Wi-Fi |
| **Production** | `https://<deployed-domain>/api/v1` | `https://<deployed-domain>/health` | Placeholder until production deployment |

> ⚠️ **Rule for Mobile Codebase**:
> - Never hardcode endpoint URLs or hostnames throughout mobile screens.
> - Append paths dynamically to `API_BASE_URL` (e.g., `${API_BASE_URL}/users/me`).
> - The health probe `GET /health` is hosted at the server root, outside `/api/v1`.

---

## 2. Authentication & Authorization Flow

Kinetra uses **Supabase Auth** for identity management.

### How it works:
1. The mobile app signs in the user directly via the Supabase Mobile Client SDK (email/password, OAuth, etc.).
2. Supabase returns a user session with an `access_token` (JWT).
3. The mobile app attaches this `access_token` to every request sent to Kinetra backend endpoints in the `Authorization` header.

### Required Header Format:
```http
Authorization: Bearer <SUPABASE_ACCESS_TOKEN>
Content-Type: application/json
```

### 🔒 Security Rules:
- **NEVER** embed or send `SUPABASE_SERVICE_ROLE_KEY` in mobile builds or network payloads.
- The service-role key is strictly for server-to-server operations and must never exist on client devices.
- Mobile clients only need their Supabase anon key (for Supabase Client Auth SDK) and the user's `access_token` for Kinetra API calls.

---

## 3. Public vs Protected Endpoints

| Endpoint | Path | Auth Required | Purpose |
|---|---|---|---|
| **Health Check** | `GET /health` | **No** (Public) | Service liveness & environment probe |
| **All API Endpoints** | `/api/v1/*` | **Yes** (Bearer Token) | All user, workout, session, pose, injury, nutrition, challenge, and leaderboard APIs |

For detailed request/response schemas for all 30 endpoints, consult the official [API_CONTRACT.md](API_CONTRACT.md).

---

## 4. Standard Response Envelope Formats

### 4.1 Success Response (`200 OK`, `201 Created`)

#### Single Resource / Action:
```json
{
  "success": true,
  "data": {
    "id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "display_name": "Harshit",
    "avatar_url": "https://assets.kinetra.app/avatars/user.png"
  }
}
```

#### Paginated List:
```json
{
  "success": true,
  "data": [
    {
      "id": "11111111-9c0b-4ef8-bb6d-6bb9bd380a11",
      "title": "Full Body Strength"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 45
  }
}
```

### 4.2 Error Response (`4xx`, `5xx`)

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [
      {
        "field": "title",
        "message": "Title is required"
      }
    ]
  }
}
```

---

## 5. Common Error Handling for Mobile Clients

| HTTP Status | Error Code | Cause | Mobile Client Action |
|---|---|---|---|
| `401` | `INVALID_TOKEN` | Access token missing, expired, or invalid signature | Call Supabase SDK `supabase.auth.refreshSession()` to obtain a fresh token, then retry request. If refresh fails, navigate user to Login screen. |
| `403` | `FORBIDDEN` | Caller attempted to access/modify a resource owned by another user (e.g. another user's private workout, session, or injury) | Show access denied message; do not retry with same credentials. |
| `404` | `PROFILE_NOT_FOUND` | Authenticated user has no row in `users` table | Redirect user to complete initial profile onboarding (`PUT /api/v1/users/me`). |
| `404` | `*_NOT_FOUND` | Requested entity (workout, exercise, session, injury, challenge) does not exist | Show resource not found notification. |
| `400` | `SESSION_ALREADY_ACTIVE` | Attempted to start session while another session is active | Prompt user to resume existing session or complete it before starting a new one. |
| `400` | `SESSION_NOT_ACTIVE` | Attempted to log set or end an already completed/cancelled session | Inform user that session has concluded. |
| `409` | `DUPLICATE_RECORD` | Record with unique constraint already exists | Notify user of duplicate data. |
| `422` | `VALIDATION_ERROR` | Request payload failed field-level schema validation | Inspect `error.details[]` and highlight corresponding input field in UI. |
| `500` | `INTERNAL_SERVER_ERROR` | Unexpected backend error | Display friendly retry prompt ("Something went wrong. Please try again later"). |

---

## 6. Code Examples for Mobile Implementation

### Example 1: TypeScript / JavaScript (React Native / Fetch API)

```typescript
// apiClient.ts
import { supabase } from './supabaseClient';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:5000/api/v1';

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  // 1. Retrieve current access token from Supabase session
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  if (!token) {
    throw new Error('User is not authenticated');
  }

  // 2. Execute HTTP request with standard headers
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  });

  const json = await response.json();

  // 3. Handle token expiration and refresh
  if (response.status === 401 && json.error?.code === 'INVALID_TOKEN') {
    const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
    if (!refreshError && refreshData.session?.access_token) {
      // Retry once with refreshed token
      const retryResponse = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${refreshData.session.access_token}`,
          ...options.headers,
        },
      });
      return (await retryResponse.json()).data;
    }
  }

  if (!response.ok) {
    throw new Error(json.error?.message || 'API request failed');
  }

  return json.data;
}

// Usage Example:
// const profile = await apiRequest<UserProfile>('/users/me');
// const workouts = await apiRequest<Workout[]>('/workouts?mine=true');
```

### Example 2: Dart / Flutter (Dio / Http)

```dart
// api_client.dart
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:supabase_flutter/supabase_flutter.dart';

class ApiClient {
  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:5000/api/v1', // Android emulator default
  );

  static Future<Map<String, dynamic>> get(String path) async {
    final session = Supabase.instance.client.auth.currentSession;
    final token = session?.accessToken;

    if (token == null) {
      throw Exception('Unauthenticated: No active Supabase session');
    }

    final response = await http.get(
      Uri.parse('$apiBaseUrl$path'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
    );

    final data = jsonDecode(response.body);
    if (response.statusCode >= 200 && response.statusCode < 300) {
      return data['data'];
    } else {
      throw Exception(data['error']?['message'] ?? 'Request failed');
    }
  }
}
```

---

## 7. AI Pose Analysis Integration Pattern

For AI camera tracking, the mobile client executes on-device MediaPipe landmark detection locally at 30/60 FPS, maintaining joint state machines and rep counting on-device.

### When to Call the Backend:
- **DO NOT** stream raw landmark coordinates or camera video frames to the backend.
- **DO** submit a single summary payload via `POST /api/v1/pose-analysis` immediately upon completion of each set.

### Payload Submitted upon Set Completion:
```json
POST /api/v1/pose-analysis
Authorization: Bearer <SUPABASE_ACCESS_TOKEN>

{
  "session_id": "d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44",
  "exercise_id": "c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33",
  "set_number": 1,
  "reps": 12,
  "weight_kg": 60.0,
  "duration_sec": 45,
  "form_score": 91.5,
  "injury_flag": false,
  "flagged_body_parts": [],
  "rep_scores": [88.0, 92.0, 94.5, 91.0, 90.5]
}
```

The backend processes the set summary, writes the exercise metrics, auto-generates contextual coach feedback, and creates injury alerts when biomechanical anomalies occur.

---

## 8. Summary Checklist for Mobile Developers

- [ ] Mobile app configured with single `API_BASE_URL` setting.
- [ ] User authenticates using Supabase Client SDK.
- [ ] `Authorization: Bearer <access_token>` attached to all `/api/v1/*` requests.
- [ ] `401 INVALID_TOKEN` triggers Supabase token refresh flow.
- [ ] Response parsing accommodates `{ success: true, data: ... }` envelope.
- [ ] Error parsing accommodates `{ success: false, error: { code, message, details } }` envelope.
- [ ] AI pose tracking processes frames locally and posts once per completed set to `POST /api/v1/pose-analysis`.
- [ ] No service-role keys or backend secrets included in client bundle.
