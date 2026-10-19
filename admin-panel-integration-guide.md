# Refrigerator Pictures — Super Admin Panel
## Backend Integration Guide (for the web developer)

| | |
|---|---|
| **Audience** | Web developer building the Super Admin Panel front end |
| **Backend** | Node / Express / MongoDB REST API (JSON over HTTPS) |
| **Reflects** | The backend as of **2026-10-15** |
| **Companion files** | `docs/openapi.yaml` (full OpenAPI spec) · `docs/postman_collection.json` + `docs/postman_environment.json` |
| **Source requirements** | "Refrigerator Admin Panel" requirements document (Modules 1–6) |

Every request and response example in this guide was captured from the **real running routes** (not hand-written), then trimmed for length. Where the backend does **not** yet do something the requirements document asks for, this guide says so explicitly — see [§2 Status & known gaps](#2-status--known-gaps) before you plan your screens.

---

## Contents

1. [Quick start](#1-quick-start)
2. [Status & known gaps](#2-status--known-gaps) ← **read this first**
3. [Conventions](#3-conventions) — envelope, pagination, errors, enums, gotchas
4. [Module 1 — Admin access](#4-module-1--admin-access-login--session)
5. [Module 2 — Dashboard](#5-module-2--dashboard)
6. [Module 3 — User management](#6-module-3--user-management)
7. [Module 4 — Content moderation](#7-module-4--content-moderation)
8. [Module 5 — Notifications](#8-module-5--notification-management)
9. [Module 6 — Reports & chat monitoring](#9-module-6--reports--private-messaging-monitoring)
10. [Optional: video-pipeline health](#10-optional-video-pipeline-health)
11. [What admin actions do to the mobile app](#11-what-admin-actions-do-to-the-mobile-app)
12. [Screen → endpoint map](#12-screen--endpoint-map)
13. [TypeScript types](#13-typescript-types)
14. [Recommended client setup](#14-recommended-client-setup)
15. [Testing checklist](#15-testing-checklist)

---

## 1. Quick start

### Base URL

| Environment | Base URL |
|---|---|
| Local (`npm run dev`) | `http://localhost:3050` |
| Local Docker | `http://localhost:3001` |
| Staging / Production | *Ask the backend owner* |

There is **no `/api` prefix and no version segment**. Admin routes live under `/admin/*`. Two password-reset steps reuse the shared `/auth/*` routes (see [§4](#4-module-1--admin-access-login--session)).

### Authentication in one minute

```http
POST /admin/auth/login
Content-Type: application/json

{ "email": "admin@example.com", "password": "AdminPass123" }
```

Take `data.token` from the response and send it on **every** other call:

```http
GET /admin/analytics/stats
Authorization: Bearer <token>
```

* Auth is a **Bearer header only** — no cookies, no CSRF token, no refresh token.
* All `/admin/*` routes (except login and forgot-password) require an admin token. A normal app-user token gets **403**.
* There is **no public "create admin" API**. Admin accounts are created by the backend owner (`npm run seed:admin`). Ask them for a test admin on dev/staging. Never commit credentials.

### CORS — one thing the backend owner must do

The API only accepts browser requests from origins listed in the `CORS_ORIGINS` environment variable (comma-separated). In local development with it empty, any origin is allowed; in **staging and production it is required**. Send the backend owner your admin panel's exact origin(s), e.g. `https://admin.example.com`. If your browser console shows a CORS error against a deployed API, this is why.

### Try it from a terminal

```bash
BASE=http://localhost:3050
TOKEN=$(curl -s -X POST $BASE/admin/auth/login -H 'Content-Type: application/json' \
  -d '{"email":"admin@example.com","password":"AdminPass123"}' | jq -r .data.token)

curl -s $BASE/admin/analytics/stats -H "Authorization: Bearer $TOKEN" | jq
```

---

## 2. Status & known gaps

Legend: ✅ available · ⚠️ partly available · ❌ not available yet

### Per-module summary

| Module | Requirement | Status | Notes |
|---|---|---|---|
| **1 Admin access** | Email/password login | ✅ | |
| | Forgot password | ⚠️ | Works as a **3-step OTP flow**, not an emailed link (G14) |
| | Logout | ⚠️ | Client-side only — discard the token (G15) |
| | Auto-logout after inactivity | ✅ | 30 min, enforced by the server |
| | Lock after repeated failed logins | ✅ | 5 failures → locked 15 min |
| **2 Dashboard** | Total users, active users, total posts | ✅ | |
| | Posts by category | ✅ | |
| | New users (today) | ✅ | |
| | New users (7 / 30 days) | ❌ | G1 |
| | Blocked users | ❌ | G2 (workaround below) |
| | User-growth line chart + date-range filter | ❌ | G3 |
| **3 Users** | List, search, status filter, pagination | ✅ | |
| | List columns: sign-up method, connections, posts | ❌ | G4 |
| | Filter by sign-up method / joined date; sort any column | ❌ | G5 |
| | Detail: profile, account info, posts-by-category, magnets, reports | ✅ | |
| | Detail: friends list, comment & reaction counts, block history | ❌ | G6 |
| | Block / unblock (with reason) | ✅ | Fully enforced |
| | Delete | ✅ | Full cascade |
| **4 Content** | List, filters, search, detail | ✅ | |
| | Remove / restore post, remove comment | ✅ | |
| | See / remove **replies** | ❌ | G7 |
| | "Reported" status filter *(suggested in spec)* | ❌ | G8 |
| **5 Notifications** | Create (now / scheduled / draft), list, detail, cancel, delete draft | ✅ | |
| | **Edit** a draft / send a saved draft later | ❌ | G9 |
| | Delivery stats / recipient count | ❌ | G10 |
| **6 Reports** | List, detail, open → under review, resolve / dismiss with notes | ✅ | |
| | Reported chat message + surrounding conversation | ⚠️ | Text only; **images/videos in chats aren't resolved** (G11) |
| | Filter by date; group/link reports about the same user | ❌ | G12 |
| | Conversation survives if the reported user is deleted | ❌ | G13 — content is wiped on deletion |
| **Global** | Audit log *(suggested in spec)* | ❌ | G16 |

### Gap details and workarounds

| # | Gap | What to do in the meantime |
|---|---|---|
| **G1** | Dashboard returns only `newUsersToday`. | Show "today" only. Hide the 7/30-day cards until the backend adds them. |
| **G2** | No blocked-users count on the dashboard. | `GET /admin/users?isDeactivatedByAdmin=true&limit=1` and read `data.pagination.totalItems`. |
| **G3** | No time-series endpoint; no date-range parameters on the stats endpoint. | Omit the growth chart and date-range picker for now. |
| **G4** | The users **list** doesn't include `method`, `friendsCount`, `postsCount` (the **detail** call does). | Show those columns only on the detail screen for now. |
| **G5** | List supports only `sortBy = createdAt \| name`; no sign-up-method or joined-date filter. | Offer just those two sorts and the status filter. |
| **G6** | User detail has no friends list, comment/reaction counts or block history. | It does include `friendsCount`, `postsCount`, `postCounts` by category, `magnets` and `reports`. For "removed content", call `GET /admin/content/posts?author=<id>&status=removed`. |
| **G7** | Post detail returns top-level comments only (each has `replyCount`). An admin cannot list or remove replies. `post.commentCount` **includes** replies. | Show the reply count; don't offer reply moderation yet. |
| **G8** | No "Reported" status for posts. | Use the Reports module instead. |
| **G9** | A saved draft can only be **deleted**; it can't be edited or sent/scheduled afterwards. | The "Edit" and "Send draft" buttons can't be built yet. Workaround: delete the draft and create a new notification. |
| **G10** | No recipient count or delivery result is stored. | Omit. |
| **G11** | A chat message's `media` is an array of raw file ids (not URLs). | Show "[image]"/"[video] — preview unavailable" for non-text messages. |
| **G12** | The reports list has no date filter and can't be filtered by reported-user id. `reason` filter accepts only 4 fixed values. | Group on the client by `reportedUserId._id` within the loaded page. Use `search` (name/email) to find a user's reports. |
| **G13** | If the reported user's account is deleted, their sent messages are wiped (`content: null`, `isDeletedForEveryone: true`), so the "saved conversation" can be partly blank. | Render `isDeletedForEveryone` messages as "Message deleted". The **report record itself** is always kept. |
| **G14** | The spec describes a reset **link**. The backend sends a one-time **code (OTP)** instead. | Build three steps: email → code → new password ([§4](#4-module-1--admin-access-login--session)). |
| **G15** | Admin accounts have an `email` but **no `name`**; there is no `GET /admin/me`; there is no logout endpoint. | Show the email in the top bar. Persist the login response's `admin` object yourself. Log out by clearing the token. |
| **G16** | No audit log. | — |

> As gaps are closed on the backend, this guide will be re-issued — its structure won't change, only the status table and the affected sections.

---

## 3. Conventions

### 3.1 Response envelope

**Success**

```json
{
  "success": true,
  "message": "User suspended successfully",
  "data": null,
  "pagination": { }
}
```

* `message` is a human-readable string suitable for a **success toast**.
* `data` is `null` for pure actions (suspend, remove, cancel, …).
* `pagination` is present only on some list endpoints, and **its position is not uniform** — see 3.2.

**Error**

```json
{ "success": false, "message": "User not found" }
```

**Validation error (HTTP 422)** — note the key is `error` (singular) and holds an array:

```json
{
  "success": false,
  "message": "Unprocessable Entity",
  "error": [
    { "path": "body.email", "message": "Please enter a valid Email address" },
    { "path": "body.password", "message": "Password must be at least 8 characters long" }
  ]
}
```

`path` is `body.<field>`, `query.<field>` or `params.<field>` — map it straight onto your form fields.

### 3.2 Pagination

Query: `?page=1&limit=20` (`page` ≥ 1; `limit` 1–100; defaults differ per endpoint — see each section).

Pagination object:

```json
{ "itemsPerPage": 20, "currentPage": 1, "totalItems": 53, "totalPages": 3 }
```

**Where it sits depends on the endpoint** — this is the single most common integration slip:

| Endpoint | List payload | Pagination at |
|---|---|---|
| `GET /admin/users` | `data.users[]` | `data.pagination` |
| `GET /admin/content/posts` | `data.posts[]` | `data.pagination` |
| `GET /admin/reports` | `data.reports[]` | `data.pagination` |
| `GET /admin/notifications` | `data[]` (array) | **top-level** `pagination` (sibling of `data`) |
| `GET /admin/content/posts/:id` | `data.comments[]`, `data.reactions[]` | `data.commentsPagination`, `data.reactionsPagination` |

Pagination is **server-side**. There is no total-count-only call; request `limit=1` and read `totalItems` if you only need a count.

### 3.3 HTTP status codes

| Code | Meaning | Typical `message` |
|---|---|---|
| 200 | OK (also used for "created") | — |
| 400 | Business-rule violation | `User is already suspended` |
| 401 | Missing / invalid / expired / idle session, bad credentials, locked account | see [§4](#4-module-1--admin-access-login--session) |
| 403 | Authenticated but not an admin | `Access denied. Required role: superadmin` |
| 404 | Resource not found, or unknown route | `User not found` |
| 422 | Request failed validation | `Unprocessable Entity` + `error[]` |
| 429 | Rate-limited (shared `/auth/*` routes only) | `Too many attempts. Please try again later.` |
| 500 | Unexpected server error | `Something went wrong…` in production |

### 3.4 Request rules the validators enforce (important for filter bars)

All query strings are validated **strictly**. Verified behaviour:

| You send | Result |
|---|---|
| An **unknown** query parameter (e.g. `?foo=1`, a cache-buster `?_=123`) | **422** `Unrecognized key` |
| An **empty** enum / boolean / date param (`?status=`, `?isDeactivatedByAdmin=`, `?dateFrom=`) | **422** |
| An empty `search=` | 200 (treated as "no search") |
| `page=0`, `limit=101` | **422** |
| An invalid sort field (`sortBy=email`) | **422** |
| A malformed id in the path (`/admin/users/abc`) | **422** `Invalid user ID` |
| An extra field in a JSON body | **422** `Unrecognized key` |

> **Rule of thumb:** build your query strings by **omitting** any filter that is unset or blank. Never send `key=` for anything except `search`.

Search boxes match **case-insensitively as plain text** — characters like `(`, `[`, `+` are safe to type.

### 3.5 Dates, ids, nulls

* **Dates** are ISO-8601 in **UTC** with a trailing `Z` (`2026-10-15T11:23:43.111Z`). Convert for display and show the timezone (the spec requires it).
* **Dates you send** (`scheduledAt`, `dateFrom`, `dateTo`) should be `new Date(...).toISOString()`. `scheduledAt` **must** end in `Z` — an offset like `+05:00` is rejected (422).
* **Ids** are 24-character hex strings. Documents use `_id`, except the login response which uses `id`.
* Missing values are `null`, not omitted — except some raw documents (users) where an unset field may be absent.

### 3.6 Enumerations

| Name | Values |
|---|---|
| Post category | `family`, `food`, `fun` *(the third category is **Fun** — the requirements doc's "Memories" is a stale label)* |
| Post status (admin) | `visible`, `removed` |
| Report status | `pending`, `under_review`, `resolved`, `dismissed` |
| Report type (`entityType`) | `User`, `Post`, `Chat` |
| Report reason (filter) | `Harassment`, `Spam`, `Inappropriate Content`, `Scam` |
| Notification status | `draft`, `scheduled`, `sent`, `cancelled` |
| Notification audience | `active_users`, `custom` |
| Reaction type | `like`, `heart`, `laugh`, `wow`, `sad`, `angry` |
| Sign-up method (`user.method`) | `email`, `google`, `apple` |
| Message type | `text`, `image`, `video` |

### 3.7 Shapes differ between endpoints — read this

Some endpoints return **raw database documents** and others return **shaped** objects. Be tolerant of extra fields (`__v`, `processing`, …) and always read images from **`location`**:

| Where | `profilePicture` is | Image URL field |
|---|---|---|
| Users list / detail | raw file doc (`filename`, `key`, `location`, …) or `null` | `.location` |
| Content list / detail | shaped (`fileName`, `key`, `location`, `video`, …) or `null` | `.location` |
| Reports | `{ _id, key, location }` or `null` | `.location` |

`location` is a full, publicly readable URL.

---

## 4. Module 1 — Admin access (login & session)

### 4.1 Login

`POST /admin/auth/login` — public.

```json
// request
{ "email": "admin@example.com", "password": "AdminPass123" }
```

```json
// 200
{
  "success": true,
  "message": "Admin logged in successfully",
  "data": {
    "token": "<jwt>",
    "admin": { "id": "6ad0b7bff8e14410da20257e", "email": "admin@example.com", "role": "superadmin" }
  }
}
```

* Email is trimmed and lower-cased server-side. Password: minimum 8 characters.
* The token's own lifetime is **7 days by default** (a server setting), **but** the idle timeout (4.4) will usually end the session much sooner.
* `admin.name` is not returned (G15) — show the email.

| Case | Status | `message` |
|---|---|---|
| Wrong email or password | 401 | `Invalid email or password` |
| Bad format | 422 | `error[]` with `body.email` / `body.password` |
| Admin account deactivated | 401 | `Your admin account has been deactivated` |
| 5th consecutive failure | 401 | `Too many failed login attempts. Your account is locked for 15 minutes.` |
| Any attempt while locked (even a correct password) | 401 | `Too many failed login attempts. Try again in N minute(s).` |

The counter resets on a successful login. Surface the 401 `message` directly under the form.

### 4.2 Forgot password — 3 steps (G14)

The requirements document describes an emailed link. The backend implements a **one-time code**:

```
 ① email  ──►  ② enter code  ──►  ③ new password  ──►  back to login
```

**① Request a code** — `POST /admin/auth/forgot-password` (public)

```json
{ "email": "admin@example.com" }
```
```json
// 200
{ "success": true, "message": "OTP sent successfully", "data": null }
```
Unknown email → **404** `User not found`.

**② Verify the code** — `POST /auth/verify-otp` (public, shared route)

```json
{ "email": "admin@example.com", "otp": "12345", "purpose": "reset", "role": "superadmin" }
```
```json
// 200
{ "success": true, "message": "OTP verified successfully", "data": { "resetToken": "<jwt>" } }
```
* `otp` is 4–6 digits and expires after **10 minutes**.
* `purpose` must be `"reset"` and `role` must be `"superadmin"` — both are required for the admin flow.
* Wrong/expired code → **400** `Invalid or expired OTP`. Show "expired" guidance and offer "resend" (call ① again).
* The returned `resetToken` is valid for **15 minutes**.

**③ Set the new password** — `POST /auth/reset-password` (public, shared route)

```json
{ "resetToken": "<jwt from step ②>", "password": "NewAdminPass123" }
```
```json
// 200
{ "success": true, "message": "Password reset successfully", "data": null }
```
Minimum 8 characters. An expired or tampered `resetToken` → **400** `Invalid or expired reset token` (a value shorter than 20 characters fails validation first, with **422** `Reset token is invalid`). Either way, send the admin back to step ① to request a new code.

> **Rate limit:** the two shared routes (② and ③) allow **10 requests per 15 minutes** per IP + email, then return **429** `Too many attempts. Please try again later.` Handle 429 with a friendly "try again later" message.
>
> **Email delivery:** local/dev environments may not have email configured. If no code arrives, ask the backend owner for it.

### 4.3 Logout

There is **no logout endpoint** (G15). Admin sessions are stateless tokens, so logging out is purely client-side:

1. Delete the token from storage and memory.
2. Clear any cached query data.
3. Navigate to the login screen.

### 4.4 Session expiry — inactivity auto-logout

The server expires an admin session after **30 minutes without an authenticated request**. The next request returns:

```json
// 401
{ "success": false, "message": "Your session has expired due to inactivity. Please log in again." }
```

Behaviour to design around:

* **Any** authenticated request counts as activity — including background polling or auto-refresh. A dashboard that polls every minute will **never** go idle. Either avoid polling, or run your own idle timer (recommended, below).
* Recommended: run a **client-side** idle timer (mouse/keyboard/route activity) that warns at ~25 minutes and logs out locally at 30, so the user sees a graceful message instead of a surprise 401.

**Handle 401 globally.** Other 401 messages you may see mid-session:

| `message` | Meaning |
|---|---|
| `Unauthorized - No token provided` | No `Authorization` header |
| `Invalid or expired token. Please re-login.` | Token malformed or past its 7-day life |
| `No such account found - Access denied` | Admin account removed/deactivated |
| `Your session has expired due to inactivity. Please log in again.` | Idle timeout |

For all of them: clear the token and redirect to login, showing the `message`.

---

## 5. Module 2 — Dashboard

### `GET /admin/analytics/stats`

```json
{
  "success": true,
  "message": "Operation Successfully",
  "data": {
    "totalUsers": 3,
    "newUsersToday": 3,
    "activeUsers": 2,
    "totalPosts": 3,
    "postsByCategory": { "fun": 1, "family": 1, "food": 1 },
    "totalFriendships": 1,
    "pendingReports": 2
  }
}
```

| Field | Meaning | Gotcha |
|---|---|---|
| `totalUsers` | Registered, non-deleted users | Includes blocked users |
| `newUsersToday` | Users created since 00:00 **server time** today | Server timezone, not the admin's |
| `activeUsers` | Distinct users who currently have a live logged-in session | **Not** "active in the last N days" — it's "currently signed in somewhere" |
| `totalPosts` | Non-removed posts | |
| `postsByCategory` | Map of category → count | A category with **zero** posts is **missing** from the map — default each of `family`/`food`/`fun` to `0` |
| `totalFriendships` | Accepted friendships | |
| `pendingReports` | Reports with status exactly `pending` | **Excludes** `under_review` — it drops as soon as an admin opens a report |

**Not available yet:** new users for 7/30 days (G1), blocked-users count (G2), user-growth chart and date-range filter (G3).

**Blocked-users card workaround:**

```http
GET /admin/users?isDeactivatedByAdmin=true&limit=1
→ data.pagination.totalItems
```

### Card click-through targets

The spec wants each card to open its module pre-filtered. Everything below is already supported by the filters:

| Card | Navigate to | Call |
|---|---|---|
| Total users | Users | `GET /admin/users` |
| Blocked users | Users, status = Blocked | `GET /admin/users?isDeactivatedByAdmin=true` |
| Total posts | Content | `GET /admin/content/posts` |
| Posts by category (a bar/slice) | Content, that category | `GET /admin/content/posts?category=fun` |
| Pending reports | Reports, status = Pending | `GET /admin/reports?status=pending` |

---

## 6. Module 3 — User management

Auth required on every route below.

### 6.1 List — `GET /admin/users`

| Query | Type | Default | Notes |
|---|---|---|---|
| `page` | int ≥ 1 | 1 | |
| `limit` | int 1–100 | 20 | |
| `search` | string | — | Matches name, email **or** username |
| `isDeactivatedByAdmin` | `"true"` \| `"false"` | — | `true` = Blocked, `false` = Active |
| `isProfileCompleted` | `"true"` \| `"false"` | — | |
| `showDeleted` | `"true"` \| `"false"` | `false` | Include soft-deleted users |
| `sortBy` | `createdAt` \| `name` | `createdAt` | G5 |
| `sortOrder` | `asc` \| `desc` | `desc` | |

```json
// 200 — trimmed
{
  "success": true,
  "message": "Operation Successfully",
  "data": {
    "users": [
      {
        "_id": "6ad0b7bff8e14410da20258b",
        "name": "Carol Clark",
        "username": "carol",
        "email": "carol@example.com",
        "profilePicture": null,
        "dob": null,
        "isEmailVerified": true,
        "isProfileCompleted": true,
        "isDeactivatedByAdmin": false,
        "isDeleted": false,
        "createdAt": "2026-10-15T11:23:43.111Z"
      }
    ],
    "pagination": { "itemsPerPage": 2, "currentPage": 1, "totalItems": 3, "totalPages": 2 }
  }
}
```

**Status badge** — derive it from two flags:

| Condition | Badge |
|---|---|
| `isDeleted` | Deleted |
| `isDeactivatedByAdmin` | Blocked |
| otherwise | Active |

**Not in the list yet (G4):** sign-up method, connections count, posts count. They are on the detail response.

### 6.2 Detail — `GET /admin/users/:userId`

Works for blocked **and** deleted users (so you can review them). Unknown id → 404 `User not found`.

```json
// 200 — trimmed
{
  "success": true,
  "message": "Operation Successfully",
  "data": {
    "user": {
      "_id": "6ad0b7bff8e14410da202587",
      "name": "Alice Anderson",
      "bio": null,
      "username": "alice",
      "email": "alice@example.com",
      "method": "email",
      "friendsCount": 1,
      "postsCount": 2,
      "dob": "1994-05-12T00:00:00.000Z",
      "favoriteVacationDestinations": ["Lisbon", "Kyoto"],
      "favoriteActivities": ["Hiking"],
      "favoriteRestaurants": ["Nobu"],
      "profilePicture": { "_id": "…", "key": "profiles/alice.jpg", "location": "https://cdn.example.com/profiles/alice.jpg", "mimetype": "image/jpeg" },
      "isEmailVerified": true,
      "isProfileCompleted": true,
      "isDeactivatedByAdmin": false,
      "deactivationReason": null,
      "isDeleted": false,
      "notificationPreferences": { "friendRequests": true, "messages": true, "likesAndComments": true, "magnets": true, "muteAll": false },
      "createdAt": "2026-10-15T11:23:43.099Z",
      "updatedAt": "2026-10-15T11:23:43.281Z"
    },
    "postCounts": { "family": 1, "fun": 1 },
    "magnets": [
      { "_id": "…", "user": "6ad0b7bff8e14410da202587", "category": "family", "earnedAt": "2026-10-15T11:23:43.276Z" }
    ],
    "reports": []
  }
}
```

Mapping to the spec's detail screen:

| Spec section | Source |
|---|---|
| Profile: name, date of birth, favourites | `user.name`, `user.dob`, `user.favoriteVacationDestinations[]`, `user.favoriteActivities[]`, `user.favoriteRestaurants[]` *(arrays of up to 5, not single values)* |
| Account info: email, sign-up method, joined, status | `user.email`, `user.method`, `user.createdAt`, status badge (6.1) |
| Activity: posts by category | `postCounts` (**a category with zero posts is missing — default to 0**) |
| Activity: friendship count | `user.friendsCount` |
| Activity: magnets earned (Family / Food / Fun) | `magnets[].category` — present means earned |
| Reports against the user | `reports[]` — **every** report about this person: filed on them directly, on one of their posts, or on a chat message they sent. Each item has `reporter` (a small `{_id, name, username, profilePicture}` stub), `entityType`, `reason`, `description`, `status`, `adminNotes`, `createdAt`. Ids such as `entityId` / `reportedUserId` are **bare ids here, not populated** — link through to `GET /admin/reports/:_id` for the full report |
| Block reason (if blocked) | `user.deactivationReason` |
| Comments / reactions counts, friends list, block history | ❌ G6 |
| Removed content | `GET /admin/content/posts?author=<userId>&status=removed` |

### 6.3 Block / unblock — `PATCH /admin/users/:userId/status`

```json
// block, with an optional reason (max 500 chars)
{ "action": "deactivate", "reason": "Spam / fake account" }

// unblock
{ "action": "activate" }
```
```json
// 200
{ "success": true, "message": "User suspended successfully", "data": null }
```

| Case | Status | `message` |
|---|---|---|
| Already blocked | 400 | `User is already suspended` |
| Already active | 400 | `User is already active` |
| Unknown / deleted user | 404 | `User not found` |
| `action` not `activate`/`deactivate` | 422 | `error[]` |

**What blocking does immediately** (so your confirmation modal can say it):

1. The user is **signed out of every device** at once.
2. They **cannot log back in** — they see "Your account has been suspended. Please contact support."
3. Their profile, posts and refrigerator are **hidden from everyone else** (profile lookups, search, discovery, direct links, friends' feeds).
4. Any **pending friend requests** to/from them are cancelled. Existing friendships stay (so unblocking restores everything).
5. `reason` is stored and shown back as `user.deactivationReason`; it's cleared on unblock.

**Unblocking** restores access and visibility. It does not restore cancelled friend requests and does not log them in.

### 6.4 Delete — `DELETE /admin/users/:userId`

```json
// 200
{ "success": true, "message": "User deleted successfully", "data": null }
```

Unknown or already-deleted → 404 `User not found`.

**Irreversible from the panel.** Confirmation copy should state that this will:

* sign them out everywhere and mark the account deleted;
* dissolve **all** their friendships and friend requests;
* remove their **posts** and **comments**;
* wipe the content of the **messages they sent** and deactivate their chats;
* **keep** any reports filed against them on record.

After deletion the user disappears from the default list (use `showDeleted=true` to see them) and their posts show up in the Content list as `removed` with `removedByAdmin: false` (see [§7](#7-module-4--content-moderation)).

> The delete is **permanent in intent but implemented as a soft delete** — records remain in the database for the dev team. Don't promise users their data is physically erased.

---

## 7. Module 4 — Content moderation

### 7.1 List — `GET /admin/content/posts`

Lists **every** post from every author — including posts by blocked or deleted users. Moderation sees everything a normal user can't.

| Query | Type | Default | Notes |
|---|---|---|---|
| `page`, `limit` | int | 1, 20 | `limit` max 100 |
| `category` | `family` \| `food` \| `fun` | — | |
| `status` | `visible` \| `removed` | — | |
| `author` | user id | — | Exact author |
| `search` | string | — | Caption text **or** author name/username |
| `dateFrom`, `dateTo` | ISO date or datetime | — | Range on posted date. A date-only value means **00:00 UTC of that day**, so for an inclusive "to" date send the end of day: `dateTo=2026-01-31T23:59:59.999Z` (a bare `2026-01-31` would exclude most of the 31st) |

```json
// 200 — trimmed
{
  "success": true,
  "message": "Operation Successfully",
  "data": {
    "posts": [
      {
        "_id": "6ad0b7bff8e14410da2025cc",
        "author": { "_id": "6ad0b7bff8e14410da202589", "name": "Bob Brown", "username": "bob", "profilePicture": null },
        "category": "food",
        "captionPreview": "Homemade pasta",
        "thumbnail": null,
        "mediaCount": 0,
        "totalReactions": 0,
        "commentCount": 0,
        "status": "visible",
        "removedByAdmin": false,
        "removalReason": null,
        "createdAt": "2026-10-15T11:23:43.289Z"
      }
    ],
    "pagination": { "itemsPerPage": 20, "currentPage": 1, "totalItems": 3, "totalPages": 1 }
  }
}
```

Column mapping: thumbnail → `thumbnail.location` (null for text-only posts) · text preview → `captionPreview` (truncated to 140 chars + `…`) · author → `author.name` · category · posted date → `createdAt` · reactions → `totalReactions` (sum across all types) · comments → `commentCount` · status → `status`.

**About `thumbnail`:** for an image post it is the **image itself** (not a resized copy) — lazy-load it. For a video post it is the client-generated thumbnail.

**Status badge logic:**

| `status` | `removedByAdmin` | Show | Restore button? |
|---|---|---|---|
| `visible` | — | Visible | — |
| `removed` | `true` | Removed (by admin) + `removalReason` | **Yes** |
| `removed` | `false` | Removed (by author / deleted account) | **No** — the backend refuses |

### 7.2 Detail — `GET /admin/content/posts/:postId`

Works for removed posts too.

| Query | Default | |
|---|---|---|
| `commentsPage` / `commentsLimit` | 1 / 20 | `commentsLimit` max 100 |
| `reactionsPage` / `reactionsLimit` | 1 / 20 | `reactionsLimit` max 100 |

```json
// 200 — trimmed
{
  "success": true,
  "message": "Operation Successfully",
  "data": {
    "post": {
      "_id": "6ad0b7bff8e14410da2025b8",
      "author": { "_id": "…", "name": "Alice Anderson", "username": "alice", "profilePicture": { "location": "https://…/alice.jpg" } },
      "category": "family",
      "caption": "Sunday lunch with the whole family",
      "media": [],
      "isPolaroid": false,
      "status": "visible",
      "removedByAdmin": false,
      "removalReason": null,
      "reactionCounts": { "like": 0, "heart": 1, "laugh": 0, "wow": 0, "sad": 0, "angry": 0 },
      "commentCount": 2,
      "createdAt": "2026-10-15T11:23:43.266Z",
      "updatedAt": "2026-10-15T11:23:43.329Z"
    },
    "comments": [
      {
        "_id": "6ad0b7bff8e14410da2025dd",
        "author": { "_id": "…", "name": "Bob Brown", "username": "bob", "profilePicture": null },
        "text": "Looks amazing!",
        "replyCount": 1,
        "likeCount": 0,
        "createdAt": "2026-10-15T11:23:43.303Z"
      }
    ],
    "commentsPagination": { "itemsPerPage": 20, "currentPage": 1, "totalItems": 1, "totalPages": 1 },
    "reactions": [
      { "_id": "…", "user": { "_id": "…", "name": "Bob Brown", "username": "bob", "profilePicture": null }, "type": "heart", "createdAt": "2026-10-15T11:23:43.328Z" }
    ],
    "reactionsPagination": { "itemsPerPage": 20, "currentPage": 1, "totalItems": 1, "totalPages": 1 }
  }
}
```

Notes:

* `comments[]` are **top-level only** and come back **newest first**. Replies are not listed (G7). `post.commentCount` counts comments **and** replies, so it can exceed `commentsPagination.totalItems`.
* Reaction breakdown for the "all reactions" section: use `post.reactionCounts` for the totals by type and `reactions[]` for who reacted.
* **Rendering `media[]`** — each item is `{ file, thumbnail }`:
  * **Image:** `<img src={file.location}>`.
  * **Video:** look at `file.video.status`:
    * `"ready"` → play the HLS stream `file.video.hlsUrl` (an `.m3u8`). Use **hls.js** in Chrome/Firefox/Edge; Safari plays HLS natively. Use `file.video.posterUrl` as the poster.
    * anything else (`"none"`, `"pending"`, `"processing"`, `"failed"`) → fall back to the original `file.location` in a plain `<video>`. HLS conversion only applies to post videos and can be switched off server-side, so the fallback path is normal.
  * `thumbnail` (a file object, may be `null`) is the client-generated still for videos.

### 7.3 Remove / restore a post — `PATCH /admin/content/posts/:postId/status`

```json
{ "action": "remove", "reason": "Violates community guidelines" }   // reason optional, max 500
{ "action": "restore" }
```
```json
// 200
{ "success": true, "message": "Post removed successfully", "data": null }
```

| Case | Status | `message` |
|---|---|---|
| Remove an already-removed post | 400 | `Post is already removed` |
| Restore a post that isn't removed | 400 | `Post is not removed` |
| Restore a post the **author** deleted | 400 | `This post was deleted by its author, not removed by an admin, and cannot be restored here` |
| Unknown post | 404 | `Post not found` |

**Remove** takes effect immediately: the post — and with it its comments and reactions — disappears from the app for everyone; the author is **notified** ("Your post was removed by an admin. Reason: …", with a generic reason if you send none); the author's post count drops. **A magnet the author earned from that post is never taken away.** A user already viewing the post simply sees it disappear on their next refresh.

**Restore** only works on posts an admin removed (see the badge table in 7.1), makes the post visible again and clears the stored reason.

### 7.4 Remove a comment — `DELETE /admin/content/comments/:commentId`

```json
// 200
{ "success": true, "message": "Comment removed successfully", "data": null }
```

Only that comment goes; the post and its other comments stay. There is **no restore** for comments. Unknown / already-removed → 404 `Comment not found`. Remember to refresh the post detail afterwards (`commentCount` changes).

---

## 8. Module 5 — Notification management

### 8.1 Lifecycle

```
 Create ─┬─ "send now"  ───────────────────────────────►  sent
         ├─ "schedule" ──► scheduled ─┬─ time arrives ──►  sent
         │                            └─ admin cancels ─►  cancelled
         └─ "save draft" ► draft ─── admin deletes ────►  (gone)
```

* A **scheduled** notification is sent automatically within about **a minute** after its `scheduledAt`.
* Nothing is shown to any user until the moment it actually sends. Who receives it is worked out **at send time**.
* A `cancelled` notification stays in the list for the record; a deleted draft does not.

### 8.2 Create — `POST /admin/notifications`

Fields:

| Field | Type | Rules |
|---|---|---|
| `title` | string | 1–100 chars (trimmed) |
| `description` | string | 1–500 chars (trimmed). This is the message body |
| `targetAudience` | `active_users` \| `custom` | **Required unless saving a draft** |
| `customUsers` | user id[] | Required and non-empty when `targetAudience` is `custom` |
| `scheduledAt` | ISO datetime, **UTC (`Z`)** | Must be in the future. Omit to send now |
| `saveAsDraft` | boolean | `true` saves without sending; `targetAudience` not required |

Show the **character limits** (100 / 500) with live counters, as the spec asks.

Three ways to call it:

```json
// ① Send now
{ "title": "Welcome!", "description": "Thanks for joining", "targetAudience": "active_users" }

// ② Schedule
{ "title": "Weekend challenge", "description": "Post a photo from your weekend!",
  "targetAudience": "active_users", "scheduledAt": "2026-10-16T11:00:00.000Z" }

// ③ Save as draft
{ "title": "Draft idea", "description": "Not ready yet", "saveAsDraft": true }
```
```json
// 200
{ "success": true, "message": "Notification sent successfully",
  "data": { "notificationContentId": "6ad0b7c3f8e14410da2026ce" } }
```
`message` is `"Notification scheduled successfully"` or `"Notification saved as draft"` for ② and ③.

Audience types:

* `active_users` — everyone with a live signed-in session **at the moment of sending**.
* `custom` — exactly the users you list.

| Case | Status | `message` / `error[]` |
|---|---|---|
| Missing audience (not a draft) | 422 | `body.targetAudience: targetAudience is required unless saveAsDraft is true` |
| `custom` with no users | 422 | `body.customUsers: customUsers array is required and must not be empty…` |
| `scheduledAt` in the past | 422 | `body.scheduledAt: scheduledAt must be a date in the future` |
| `scheduledAt` with an offset (`+05:00`) or no `Z` | 422 | `body.scheduledAt: Invalid ISO datetime` |
| Title > 100 / body > 500 | 422 | `body.title: Too big…` |
| Audience resolves to nobody (e.g. `active_users` with no one signed in) | 400 | `No target users found for this notification` |

**Time zones:** let the admin pick a date/time in **their** zone, then convert with `date.toISOString()` before sending. Display `scheduledAt` back in their zone with the zone name.

Users who have switched push notifications off at the OS level still get the **in-app** version.

### 8.3 List — `GET /admin/notifications`

| Query | Default | Notes |
|---|---|---|
| `page`, `limit` | 1, **10** | `limit` max 100 |
| `status` | — | `draft` \| `scheduled` \| `sent` \| `cancelled` |
| `targetAudience` | — | The spec's "type" filter |
| `search` | — | Title or description |
| `sortBy` | `createdAt` | `createdAt` \| `scheduledAt` |
| `sortOrder` | `desc` | |

```json
// 200 — NOTE: data is an array and pagination is a sibling of data
{
  "success": true,
  "message": "Admin notifications retrieved successfully",
  "data": [
    {
      "_id": "6ad0b7bff8e14410da20261b",
      "title": "Draft idea",
      "description": "Not ready yet",
      "targetAudience": null,
      "scheduledAt": null,
      "sentAt": null,
      "status": "draft",
      "createdAt": "2026-10-15T11:23:43.372Z",
      "updatedAt": "2026-10-15T11:23:43.372Z"
    }
  ],
  "pagination": { "itemsPerPage": 10, "currentPage": 1, "totalItems": 2, "totalPages": 1 }
}
```

(Other fields — `metadata`, `isAdmin`, `__v` — can be ignored.)

### 8.4 Detail — `GET /admin/notifications/:notificationId`

Same object as one list item (content, `status`, `scheduledAt`, `sentAt`). Unknown id → 404 `Notification not found`. Show the send time as: `sentAt` if sent, otherwise `scheduledAt` if scheduled.

### 8.5 Cancel a scheduled notification — `PATCH /admin/notifications/:notificationId/status`

```json
{ "action": "cancel" }
```
```json
// 200
{ "success": true, "message": "Scheduled notification cancelled", "data": null }
```
Only works while `status` is `scheduled`; otherwise **400** `Only a scheduled notification can be cancelled (this one is draft)`. Nobody was ever notified, so there is nothing to retract. Show the button **only** for `scheduled` rows.

### 8.6 Delete a draft — `DELETE /admin/notifications/:notificationId`

```json
// 200
{ "success": true, "message": "Draft deleted", "data": null }
```
Only for `draft` rows; otherwise **400** `Only a draft can be deleted this way (this one is sent)`. Show the button **only** for `draft` rows.

### 8.7 Button visibility by status

| Status | View | Cancel | Delete |
|---|---|---|---|
| `draft` | ✅ | — | ✅ |
| `scheduled` | ✅ | ✅ | — |
| `sent` | ✅ | — | — |
| `cancelled` | ✅ | — | — |

> **G9:** a saved draft cannot be edited or sent later. Until that's added, a draft is only useful as a note — "edit" means delete and recreate.

---

## 9. Module 6 — Reports & private-messaging monitoring

Admins only ever see conversations that were **reported** — never anyone's private chats in general.

### 9.1 Status flow

```
 pending ──(admin opens it)──► under_review ──┬─ resolve ─► resolved
    └───────────────(or directly)─────────────┴─ dismiss ─► dismissed
```

### 9.2 List — `GET /admin/reports`

| Query | Default | Notes |
|---|---|---|
| `page`, `limit` | 1, 20 | `limit` max 100 |
| `status` | — | `pending` \| `under_review` \| `resolved` \| `dismissed` |
| `reason` | — | **Only** `Harassment`, `Spam`, `Inappropriate Content`, `Scam` (G12) |
| `search` | — | The **reported** user's name or email — works for User, Post **and** Chat reports. It does not match reports about accounts that have since been deleted |

```json
// 200 — one item, trimmed (a Post report)
{
  "_id": "6ad0b7bff8e14410da202616",
  "reporter":       { "_id": "…", "name": "Carol Clark", "email": "carol@example.com", "profilePicture": null },
  "reportedUserId": { "_id": "…", "name": "Alice Anderson", "email": "alice@example.com",
                      "profilePicture": { "_id": "…", "key": "profiles/alice.jpg", "location": "https://…/alice.jpg" },
                      "isDeactivatedByAdmin": false },
  "entityType": "Post",
  "entityId":   { "_id": "…", "caption": "Beach day!", "category": "fun", "…": "the reported Post document" },
  "messageId": null,
  "reason": "Inappropriate Content",
  "description": null,
  "status": "pending",
  "resolvedBy": null,
  "resolvedAt": null,
  "adminNotes": null,
  "createdAt": "2026-10-15T11:23:43.359Z"
}
```

Columns the spec asks for: **Report id** → `_id` · **reporter** → `reporter.name` · **reported user** → `reportedUserId.name` · **reason** · **date** → `createdAt` · **status**.

Things to know:

* **`reportedUserId`** is always the person the report is *about*, whatever the type: the user themself, a post's author, or the *other* participant of a reported chat. Use it for the "reported user" summary and for the block action. It can be `null` only on reports filed before this field existed.
* **`entityId`** is **polymorphic** — a populated `User`, `Post` or `Chat` document depending on `entityType`. Switch on `entityType`.
* `status` filtering is how the dashboard's "Pending reports" card lands here.

### 9.3 Detail — `GET /admin/reports/:reportId`

> ⚠️ **Opening a report changes it.** A `pending` report is moved to `under_review` as a side effect of this GET (that is the spec's "Open report" action). It's idempotent — opening again changes nothing. So: **don't call this from row hover, prefetching or link previews**, only when the admin actually opens the report; and **refetch the list** afterwards because the status badge (and the dashboard's pending count) will have changed.

```json
// 200 — Chat report, trimmed
{
  "success": true,
  "message": "Operation Successfully",
  "data": {
    "report": {
      "_id": "6ad0b7bff8e14410da202612",
      "reporter":       { "_id": "6ad0b7bff8e14410da202589", "name": "Bob Brown", "email": "bob@example.com", "profilePicture": null },
      "reportedUserId": { "_id": "6ad0b7bff8e14410da202587", "name": "Alice Anderson", "email": "alice@example.com", "profilePicture": { "location": "https://…" }, "isDeactivatedByAdmin": false },
      "entityType": "Chat",
      "entityId": { "_id": "6ad0b7bff8e14410da202602", "participants": ["6ad0b7bff8e14410da202587", "6ad0b7bff8e14410da202589"], "isActive": true },
      "messageId": "6ad0b7bff8e14410da202608",
      "reason": "Harassment",
      "description": "Keeps sending rude messages",
      "status": "under_review",
      "resolvedBy": null, "resolvedAt": null, "adminNotes": null,
      "createdAt": "2026-10-15T11:23:43.355Z"
    },
    "messageContext": {
      "message": { "_id": "6ad0b7bff8e14410da202608", "sender": "6ad0b7bff8e14410da202587", "type": "text", "content": "you are so annoying", "media": [], "isDeletedForEveryone": false, "createdAt": "2026-10-15T11:23:43.345Z" },
      "before": [ { "_id": "…", "sender": "6ad0b7bff8e14410da202589", "type": "text", "content": "hey", "createdAt": "…" } ],
      "after":  [ { "_id": "…", "sender": "6ad0b7bff8e14410da202589", "type": "text", "content": "stop", "createdAt": "…" } ]
    }
  }
}
```

**`messageContext`** is `null` for User and Post reports. For a Chat report it holds the reported `message`, plus up to **10 messages before** (oldest → newest) and **10 after** — enough context without exposing the whole thread. To render the conversation, concatenate `[...before, message, ...after]` and highlight `message`.

**Labelling who said what:** `sender` is a bare user id. Compare it with `report.reporter._id` (→ "Reporter") and `report.reportedUserId._id` (→ "Reported user").

Rendering rules:

| Message state | Show |
|---|---|
| `type: "text"`, `content` present | the text |
| `isDeletedForEveryone: true` (or `content: null`) | "Message deleted" (G13) |
| `type: "image"` / `"video"` | "[Image]" / "[Video] — preview unavailable" (G11: `media` is raw ids, not URLs) |

`messageContext.message` can be `null` if the message no longer exists — handle it.

**Admin notes field:** the `adminNotes` input is part of the resolve/dismiss action (9.4); there is no separate "save note" call. Once settled, show `adminNotes`, `resolvedAt` and `resolvedBy` (`resolvedBy` carries the admin's **email**; there is no admin name — G15) read-only.

If the reported user was later deleted, the report still opens and `reportedUserId` still populates; their messages may show as deleted (G13). Reports stay available even if one participant blocked the other.

### 9.4 Resolve or dismiss — `PATCH /admin/reports/:reportId/status`

```json
{ "action": "resolve", "adminNotes": "Confirmed harassment", "suspendUser": true }
{ "action": "dismiss", "adminNotes": "Not enough evidence" }
```

| Field | Rules |
|---|---|
| `action` | `resolve` \| `dismiss` |
| `adminNotes` | **Required** for **both**, 1–1000 chars after trimming. Whitespace-only is rejected |
| `suspendUser` | boolean, default `false`. Only meaningful with `resolve` |

```json
// 200
{ "success": true, "message": "Report resolved and user suspended", "data": null }
```
Other success messages: `Report resolved successfully`, `Report dismissed successfully`.

| Case | Status | Message |
|---|---|---|
| Missing/blank `adminNotes` | 422 | `body.adminNotes: …` |
| Report already `resolved` / `dismissed` | 400 | `Report is already dismissed and cannot be modified` |
| Unknown report | 404 | `Report not found` |

Works from `pending` or `under_review`. Disable the action buttons once a report is settled.

**`suspendUser: true`** blocks `reportedUserId` using exactly the same flow as User Management's block (signed out everywhere, can't log in, hidden from others, pending friend requests cancelled) and records `Suspended via report <id>: <your note>` as the block reason. It works for **every** report type — for a chat report it blocks the reported *sender*, never the reporter. If that user is already blocked it simply succeeds.

**"Block user" button inside the report screen** (spec): either send `suspendUser: true` when resolving, or call `PATCH /admin/users/:reportedUserId/status` (`action: "deactivate"`) directly — same effect.

**Multiple reports about the same user** (spec: grouped or linked): not supported server-side (G12). Group on the client by `reportedUserId._id` within the loaded page, and offer a `search` link by the user's name/email.

---

## 10. Optional: video-pipeline health

Not part of the requirements document, but available if you want an "ops" tile.

### `GET /admin/video-processing`

```json
{
  "success": true,
  "data": {
    "generatedAt": "2026-10-15T11:23:47.626Z",
    "hlsEnabled": true,
    "healthy": true,
    "attention": [],
    "files": { "byStatus": { "none": 0, "pending": 0, "processing": 0, "ready": 0, "failed": 0 }, "legacyRemaining": 0 },
    "queue": null,
    "pipeline": { "oldestPendingAgeSec": null, "pendingOverTenMinutes": 0, "legacyPending": 0 },
    "last7Days": { "ready": 0, "failedByReason": {}, "encodeSeconds": { "count": 0, "avg": null, "p95": null, "max": null }, "realtimeRatio": { "count": 0, "avg": null, "p95": null, "max": null } },
    "legacyRevertedByReason": {}
  }
}
```

A simple use: show a green/red dot from `healthy`, and list the plain-English strings in `attention[]` when it's false. `queue` is `null` when the queue isn't reachable.

---

## 11. What admin actions do to the mobile app

Useful for confirmation-modal copy and for QA.

| Admin action | Effect in the mobile app |
|---|---|
| **Block user** | Signed out on all devices at once; can't log in ("account suspended"); profile/posts disappear for everyone else; pending friend requests cancelled |
| **Unblock user** | Can log in again; profile/posts visible again |
| **Delete user** | Signed out; account gone; friendships dissolved; posts & comments removed; sent messages wiped |
| **Remove post** | Gone from feeds/refrigerators; its comments & reactions go with it; author gets a notification; author keeps any magnet |
| **Restore post** | Visible again |
| **Remove comment** | That comment disappears; post unaffected |
| **Send notification** | Push (if the user allows push) **and** in-app list entry |
| **Cancel scheduled notification** | Never sent; never appears |
| **Resolve + suspend** | Same as Block user |

All of these take effect on the user's **next request** — there is no delay and nothing to refresh on your side except your own lists.

---

## 12. Screen → endpoint map

| Screen | Calls |
|---|---|
| **Login** | `POST /admin/auth/login` |
| **Forgot password** | `POST /admin/auth/forgot-password` → `POST /auth/verify-otp` → `POST /auth/reset-password` |
| **Dashboard** | `GET /admin/analytics/stats` (+ `GET /admin/users?isDeactivatedByAdmin=true&limit=1` for blocked count) |
| **Users — list** | `GET /admin/users` |
| **Users — detail** | `GET /admin/users/:id` · `PATCH /admin/users/:id/status` · `DELETE /admin/users/:id` · `GET /admin/content/posts?author=:id&status=removed` |
| **Content — list** | `GET /admin/content/posts` |
| **Content — detail** | `GET /admin/content/posts/:id` · `PATCH /admin/content/posts/:id/status` · `DELETE /admin/content/comments/:commentId` · link to Users detail via `post.author._id` |
| **Notifications — list** | `GET /admin/notifications` |
| **Notifications — create** | `POST /admin/notifications` |
| **Notifications — detail** | `GET /admin/notifications/:id` · `PATCH …/:id/status` · `DELETE …/:id` |
| **Reports — list** | `GET /admin/reports` |
| **Reports — detail** | `GET /admin/reports/:id` · `PATCH /admin/reports/:id/status` · `PATCH /admin/users/:reportedUserId/status` |

---

## 13. TypeScript types

Copy-paste starting point. Optional fields are those that can be absent on raw documents.

```ts
// ---------- shared ----------
export type ObjectId = string;      // 24-char hex
export type ISODate = string;       // "2026-10-15T11:23:43.111Z" (UTC)

export interface Pagination {
  itemsPerPage: number;
  currentPage: number;
  totalItems: number;
  totalPages: number;
}

export interface ApiSuccess<T> {
  success: true;
  message: string;
  data: T;
  pagination?: Pagination;          // only on GET /admin/notifications
}

export interface ApiError {
  success: false;
  message: string;
  error?: { path: string; message: string }[];   // 422 only; note: "error", singular
}

export type Category = 'family' | 'food' | 'fun';
export type SignUpMethod = 'email' | 'google' | 'apple';

export interface FileRef {          // image location lives in `location`
  _id: ObjectId;
  key: string | null;
  location: string | null;
  mimetype?: string | null;
  size?: number | null;
  fileName?: string | null;
  video?: VideoInfo | null;         // only on video files in /admin/content
}

export interface VideoInfo {
  status: 'none' | 'pending' | 'processing' | 'ready' | 'failed';
  failureReason: string | null;
  hlsUrl: string | null;            // .m3u8 — use hls.js
  posterUrl: string | null;
  durationSec: number | null;
  width: number | null;
  height: number | null;
}

export interface UserStub {
  _id: ObjectId;
  name: string | null;
  username: string | null;
  profilePicture: FileRef | null;
}

// ---------- Module 1 ----------
export interface LoginData {
  token: string;
  admin: { id: ObjectId; email: string; role: 'superadmin' };   // no name (G15)
}

// ---------- Module 2 ----------
export interface DashboardStats {
  totalUsers: number;
  newUsersToday: number;
  activeUsers: number;
  totalPosts: number;
  postsByCategory: Partial<Record<Category, number>>;   // missing key => 0
  totalFriendships: number;
  pendingReports: number;                               // status === 'pending' only
}

// ---------- Module 3 ----------
export interface UserListItem {
  _id: ObjectId;
  name: string | null;
  username: string | null;
  email: string;
  profilePicture: FileRef | null;
  dob: ISODate | null;
  isEmailVerified: boolean;
  isProfileCompleted: boolean;
  isDeactivatedByAdmin: boolean;
  isDeleted: boolean;
  createdAt: ISODate;
}
export type UserListData = { users: UserListItem[]; pagination: Pagination };

export interface UserDetail {
  user: UserListItem & {
    bio: string | null;
    method: SignUpMethod | null;
    friendsCount: number;
    postsCount: number;
    favoriteVacationDestinations: string[];
    favoriteActivities: string[];
    favoriteRestaurants: string[];
    deactivationReason: string | null;
    notificationPreferences: {
      friendRequests: boolean; messages: boolean; likesAndComments: boolean;
      magnets: boolean; muteAll: boolean;
    };
    updatedAt: ISODate;
  };
  postCounts: Partial<Record<Category, number>>;     // missing key => 0
  magnets: { _id: ObjectId; user: ObjectId; category: Category; earnedAt: ISODate }[];
  reports: UserReportItem[];            // all reports about this user (not the populated shape of /admin/reports)
}

export interface UserReportItem {
  _id: ObjectId;
  reporter: UserStub | null;
  entityType: ReportEntityType;
  entityId: ObjectId;                   // bare id here — open GET /admin/reports/:_id for detail
  reportedUserId: ObjectId | null;
  messageId: ObjectId | null;
  reason: string;
  description: string | null;
  status: ReportStatus;
  adminNotes: string | null;
  createdAt: ISODate;
}

// ---------- Module 4 ----------
export type PostStatus = 'visible' | 'removed';

export interface ContentListItem {
  _id: ObjectId;
  author: UserStub | null;
  category: Category;
  captionPreview: string | null;
  thumbnail: FileRef | null;
  mediaCount: number;
  totalReactions: number;
  commentCount: number;                 // includes replies
  status: PostStatus;
  removedByAdmin: boolean;              // restore allowed only if status==='removed' && this is true
  removalReason: string | null;
  createdAt: ISODate;
}
export type ContentListData = { posts: ContentListItem[]; pagination: Pagination };

export type ReactionType = 'like' | 'heart' | 'laugh' | 'wow' | 'sad' | 'angry';

export interface ContentDetail {
  post: {
    _id: ObjectId;
    author: UserStub | null;
    category: Category;
    caption: string | null;
    media: { file: FileRef | null; thumbnail: FileRef | null }[];
    isPolaroid: boolean;
    status: PostStatus;
    removedByAdmin: boolean;
    removalReason: string | null;
    reactionCounts: Record<ReactionType, number>;
    commentCount: number;
    createdAt: ISODate;
    updatedAt: ISODate;
  };
  comments: { _id: ObjectId; author: UserStub | null; text: string;
              replyCount: number; likeCount: number; createdAt: ISODate }[];   // top-level only (G7)
  commentsPagination: Pagination;
  reactions: { _id: ObjectId; user: UserStub | null; type: ReactionType; createdAt: ISODate }[];
  reactionsPagination: Pagination;
}

// ---------- Module 5 ----------
export type NotificationStatus = 'draft' | 'scheduled' | 'sent' | 'cancelled';
export type Audience = 'active_users' | 'custom';

export interface AdminNotification {
  _id: ObjectId;
  title: string;
  description: string;
  targetAudience: Audience | null;
  scheduledAt: ISODate | null;
  sentAt: ISODate | null;
  status: NotificationStatus;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export interface CreateNotificationBody {
  title: string;                         // 1–100
  description: string;                   // 1–500
  targetAudience?: Audience;             // required unless saveAsDraft
  customUsers?: ObjectId[];              // required (non-empty) if 'custom'
  scheduledAt?: ISODate;                 // future, UTC with 'Z'
  saveAsDraft?: boolean;
}

// ---------- Module 6 ----------
export type ReportStatus = 'pending' | 'under_review' | 'resolved' | 'dismissed';
export type ReportEntityType = 'User' | 'Post' | 'Chat';

export interface ReportPerson {
  _id: ObjectId;
  name: string | null;
  email: string;
  profilePicture: { _id: ObjectId; key: string | null; location?: string | null } | null;
  isDeactivatedByAdmin?: boolean;        // reportedUserId only
}

export interface ReportListItem {
  _id: ObjectId;
  reporter: ReportPerson | null;
  reportedUserId: ReportPerson | null;   // null on legacy reports
  entityType: ReportEntityType;
  entityId: Record<string, unknown> | null;   // populated User | Post | Chat doc — switch on entityType
  messageId: ObjectId | null;            // Chat reports only
  reason: string;
  description: string | null;
  status: ReportStatus;
  resolvedBy: { _id: ObjectId; email: string } | null;
  resolvedAt: ISODate | null;
  adminNotes: string | null;
  createdAt: ISODate;
}
export type ReportListData = { reports: ReportListItem[]; pagination: Pagination };

export interface ChatMessage {
  _id: ObjectId;
  chatId: ObjectId;
  sender: ObjectId;                      // compare with reporter._id / reportedUserId._id
  type: 'text' | 'image' | 'video';
  content: string | null;                // null if deleted
  media: ObjectId[];                     // raw ids, NOT urls (G11)
  isDeletedForEveryone: boolean;
  createdAt: ISODate;
}

export interface ReportDetailData {
  report: ReportListItem;
  messageContext: null | {
    message: ChatMessage | null;
    before: ChatMessage[];               // oldest -> newest, up to 10
    after: ChatMessage[];                // oldest -> newest, up to 10
  };
}

export interface ResolveReportBody {
  action: 'resolve' | 'dismiss';
  adminNotes: string;                    // required, 1–1000
  suspendUser?: boolean;                 // only with 'resolve'
}
```

---

## 14. Recommended client setup

### 14.1 A single HTTP client

```ts
import axios from 'axios';

export const api = axios.create({ baseURL: import.meta.env.VITE_API_URL });

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('adminToken');   // or in-memory; avoid localStorage if you can
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    const status = err.response?.status;
    const message = err.response?.data?.message;
    if (status === 401 && !err.config.url?.includes('/admin/auth/login')) {
      sessionStorage.removeItem('adminToken');
      // show `message` on the login screen ("session expired due to inactivity", …)
      window.location.assign('/login?reason=' + encodeURIComponent(message ?? ''));
    }
    return Promise.reject(err);
  },
);
```

> Exempt the **login** (and forgot/reset) calls from the "401 → redirect" rule — a wrong password is also a 401 and should just show the message inline.

### 14.2 Build query strings without blanks

```ts
export const clean = (params: Record<string, unknown>) =>
  Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ''),
  );

api.get('/admin/users', { params: clean({ page, limit, search, isDeactivatedByAdmin }) });
```

This one helper prevents the most common 422s (see 3.4). Keep filter state out of the URL **only if** it can contain keys the API doesn't know.

### 14.3 UX conventions the spec asks for

| Spec | How |
|---|---|
| Success & error toasts after every action | success → `response.data.message`; error → `error.response.data.message` |
| Field-level form errors | map 422 `error[].path` (strip the `body.` prefix) onto fields |
| Confirmation modal naming the item | use the `name` / `title` you already hold; use the effect lists in §6.3, §6.4, §7.3 for the body copy |
| Loading / empty / error state per list & detail | every list returns `[]` + `totalItems: 0` when empty |
| Dates with timezone | `new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short', timeZoneName: 'short' }).format(new Date(iso))` |
| Status badges | Users §6.1 · Posts §7.1 · Reports §9.1 · Notifications §8.1 |
| Desktop-first, usable on tablet | no API impact |

### 14.4 Idle-timeout helper (recommended)

```ts
const IDLE_MS = 30 * 60 * 1000, WARN_MS = 25 * 60 * 1000;
let warnTimer: number, logoutTimer: number;

export function resetIdleTimers(onWarn: () => void, onLogout: () => void) {
  clearTimeout(warnTimer); clearTimeout(logoutTimer);
  warnTimer = window.setTimeout(onWarn, WARN_MS);
  logoutTimer = window.setTimeout(onLogout, IDLE_MS);
}
// call on mousemove / keydown / route change (throttled)
```

Reminder: **background polling resets the server's idle clock** (4.4). If you poll, the server will never log the admin out — your client timer must do it.

### 14.5 HLS video

```ts
import Hls from 'hls.js';

function attach(video: HTMLVideoElement, f: FileRef) {
  const v = f.video;
  if (v?.status === 'ready' && v.hlsUrl) {
    if (video.canPlayType('application/vnd.apple.mpegurl')) video.src = v.hlsUrl;      // Safari
    else if (Hls.isSupported()) { const h = new Hls(); h.loadSource(v.hlsUrl); h.attachMedia(video); }
    if (v.posterUrl) video.poster = v.posterUrl;
  } else {
    video.src = f.location!;                                                           // original file
  }
}
```

---

## 15. Testing checklist

**Auth & session**
- [ ] Wrong password shows the inline message; 5th failure shows the lock message; a correct password during the lock is still refused
- [ ] Forgot-password: email → code → new password → can log in with the new password
- [ ] Bad / expired code shows an error and offers "resend"; 429 shows "try again later"
- [ ] Log out clears the token and cache
- [ ] After 30 min idle (temporarily lower `ADMIN_INACTIVITY_TIMEOUT_MINUTES` on dev to test) the next call redirects to login with the idle message
- [ ] A normal app-user token gets 403 on admin pages

**Lists** (users, posts, reports, notifications)
- [ ] Pagination works, including the **notifications** list where `pagination` is top-level
- [ ] Every filter combination works, and clearing a filter **removes** the param (no `status=`)
- [ ] Searching `(`, `[`, `+` doesn't break anything
- [ ] Empty results show the empty state

**Users**
- [ ] Block with a reason → status becomes Blocked, `deactivationReason` shows; blocking again shows the 400 message
- [ ] Unblock → Active
- [ ] Blocked user can't log in on the mobile app; their posts vanish from the app
- [ ] Delete → disappears from the default list; appears with `showDeleted=true` as Deleted

**Content**
- [ ] Remove with and without a reason; list shows Removed + reason; author receives the notification
- [ ] Restore works on an admin-removed post and is refused (button hidden) on an author-deleted one
- [ ] Remove comment updates `commentCount`
- [ ] Image posts render; video posts play (HLS when `ready`, original file otherwise)

**Notifications**
- [ ] Send now / schedule / save draft all create the right status
- [ ] Past `scheduledAt` and offset-style dates are rejected with a readable message
- [ ] Cancel only appears on `scheduled`; Delete only on `draft`
- [ ] A scheduled notification sends within ~1 minute of its time and flips to `sent`

**Reports**
- [ ] Opening a pending report flips it to Under Review and the list/dashboard counts update
- [ ] Chat report shows the conversation with the reported message highlighted and both sides labelled
- [ ] Resolve/dismiss refuse empty notes; settled reports can't be modified again
- [ ] "Resolve + suspend" actually blocks the **reported** user (not the reporter) for User, Post and Chat reports

---

*Questions about anything in this guide, or a response that doesn't match it, should go to the backend owner with the request, the response body and the time — and the `message` string, which is intentionally specific.*
