# BuggyBoard - Log Out

## Application Overview

End-to-end test plan for logging out and guarded routes (spec: `specs/features/05-logout.md`). Explored live with Playwright MCP, including creating a bug before and after logging out and signing in as both users in `users.json`.

Observed behavior:
- The title bar has a "Logout" button (`getByRole('button', { name: 'Logout', exact: true })`; use `exact: true` because bug rows can contain "Logout" in their title).
- Session is held in `localStorage` key `buggyboard_user` (value like `{"username":"vanny"}`); no cookies or sessionStorage. Logout removes the key.
- Logout redirects to `/login`, which shows the BuggyBoard heading, Username, Password (masked) and a Login button, and no title bar or bug table.
- Guarded routes: while logged out, `/board`, `/` and unknown paths such as `/nonexistent` all end up on `/login`. Back-button navigation after logout stays on `/login` and never shows the board.
- While logged in, visiting `/login` redirects to `/board`.
- Logging back in lands on `/board` with reset UI state: empty search, default Severity descending sort. Bugs created before logout persist.
- With the Create/Edit dialog open, the Logout button cannot be clicked (the modal blocks it); close the dialog first.
- Different users are supported: logging in as `vanny` shows a New Bug dialog with Owner `vanny`.
- Credentials come from `users.json` in the repo root (read at test time; do not hard-code them in tests).

All scenarios start from the seed state (logged in as the first user in `users.json`, on /board) unless stated.

## Test Scenarios

### 1. Log Out

**Seed:** `tests/seed.spec.ts`

#### 1.1. Logout redirects to the login page

**File:** `tests/log-out/logout-redirect.spec.ts`

**Steps:**
  1. On /board, click Logout.
    - expect: URL is /login
    - expect: Username and Password fields and the Login button are visible
    - expect: Title bar, New Bug button and bug table are not visible

#### 1.2. Logout clears the session

**File:** `tests/log-out/session-cleared.spec.ts`

**Steps:**
  1. Confirm `buggyboard_user` exists in localStorage while logged in.
  2. Click Logout.
    - expect: `buggyboard_user` is removed from localStorage

#### 1.3. Board URL is guarded after logout

**File:** `tests/log-out/guarded-board.spec.ts`

**Steps:**
  1. Log out, then navigate directly to /board.
    - expect: App redirects to /login
    - expect: No bug data is shown
  2. Navigate to / and to an unknown path (/nonexistent).
    - expect: Each ends on /login

#### 1.4. Browser back after logout does not restore the session

**File:** `tests/log-out/back-button.spec.ts`

**Steps:**
  1. Log out, then press the browser Back button (repeat a few times).
    - expect: User stays on /login and is never shown the board
    - expect: localStorage session key is still absent

#### 1.5. Login page is the only content reachable while logged out

**File:** `tests/log-out/login-page-content.spec.ts`

**Steps:**
  1. Log out and inspect /login.
    - expect: Heading BuggyBoard, masked password field, Login button
    - expect: Cannot reach /board without credentials

#### 1.6. Log back in after logout

**File:** `tests/log-out/relogin.spec.ts`

**Steps:**
  1. Create bug 'Logout <ts>' via New Bug.
  2. Click Logout, then sign in with the same credentials.
    - expect: URL is /board
    - expect: Bug 'Logout <ts>' is still listed (data persists)
    - expect: Session key is set again

#### 1.7. UI state resets after logout and relogin

**File:** `tests/log-out/state-reset.spec.ts`

**Steps:**
  1. Type a search text and sort by Title ascending.
  2. Log out and log in again.
    - expect: Search field is empty
    - expect: Severity descending is the active sort (down arrow on Severity only)

#### 1.8. Logging out and signing in as a different user

**File:** `tests/log-out/switch-user.spec.ts`

**Steps:**
  1. Log out and sign in as the second user in `users.json`.
    - expect: Board loads for the second user
    - expect: New Bug dialog Owner defaults to the second user's username
  2. Log out and sign in as the first user again.
    - expect: Owner defaults to the first user

#### 1.9. Authenticated user visiting /login is sent to the board

**File:** `tests/log-out/login-when-authed.spec.ts`

**Steps:**
  1. While logged in, navigate to /login.
    - expect: App redirects to /board

#### 1.10. Logout is unavailable while a modal is open

**File:** `tests/log-out/logout-with-modal.spec.ts`

**Steps:**
  1. Click New Bug (or open a bug) and try to click Logout.
    - expect: Logout is blocked by the dialog and user stays on /board
  2. Press Escape, then click Logout.
    - expect: User is logged out and sees /login

#### 1.11. Session removed in another tab

**File:** `tests/log-out/multi-tab.spec.ts`

**Steps:**
  1. Open /board in two tabs of the same context. Log out in tab A.
  2. In tab B, reload or navigate to a board route.
    - expect: Tab B ends on /login (verify live; cross-tab behavior was not explored)
