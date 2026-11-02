# BuggyBoard Delete Bug Test Plan

## Application Overview

BuggyBoard is a bug tracker. After logging in, the board (`/board`) lists bugs in a table named "Bugs" (columns ID, Severity, Title, Owner). The Open/Closed filter (group "Filter by bug state", default Open) and the search box ("Search bugs by title") narrow the list. Clicking a row opens the **Edit bug #<id>** dialog with ID, Title, Severity, State, Owner and Description fields and the buttons **Delete**, **Cancel**, **Save** and **Close** (×). Clicking **Delete** immediately calls `DELETE /api/bugs/:id` (there is no confirmation dialog), closes the dialog and refreshes the board. If the request fails, the dialog stays open and shows "Failed to delete bug.". An empty search result shows "No bugs matched.".

Observed while exploring with Playwright CLI:
- The row's accessible name includes the bug title, so a title containing "delete" makes `getByRole('button', { name: 'Delete' })` ambiguous. Use `{ name: 'Delete', exact: true }` or scope to the dialog.
- After a successful delete, `GET /api/bugs/:id` returns 404.

## Conventions for all scenarios

- **Seed:** `tests/seed.spec.ts` (logs in as the first user in `users.json` and lands on `/board`).
- **Test setup (required for every scenario):** create fresh bugs through `POST /api/bugs` (JSON `{title, severity, owner, description}`) using a unique title per test, e.g. `Delete <scenario> <uuid>`. Never rely on pre-existing bugs. The database is shared, so isolate by searching for the unique title rather than counting rows.
- **Teardown:** best-effort `DELETE /api/bugs/:id` for any bug the test still owns.
- To open a bug, search for its unique title, then click its row.

## Test Scenarios

### 1. Delete Bug

**Seed:** `tests/seed.spec.ts`

#### 1.1. Edit modal shows a Delete button

**File:** `tests/delete-bug/delete-button-visible.spec.ts`

**Steps:**
1. Setup: create a fresh open bug via the API with a unique title.
2. On the board, search for the unique title and click its row.
   - expect: The dialog "Edit bug #<id>" is visible.
   - expect: A "Delete" button (exact) is visible and enabled inside the dialog.
   - expect: The Delete button is enabled even though Save is disabled (no changes made).

#### 1.2. Deleting a bug removes it from the board and closes the modal

**File:** `tests/delete-bug/delete-removes-bug.spec.ts`

**Steps:**
1. Setup: create a fresh open bug via the API with a unique title.
2. Search for the unique title, click its row, then click "Delete" (exact).
   - expect: The Edit bug dialog is closed.
   - expect: The search for the unique title shows "No bugs matched.".
   - expect: No row with the unique title is in the "Bugs" table.

#### 1.3. Deleted bug is removed from the database

**File:** `tests/delete-bug/delete-removes-from-db.spec.ts`

**Steps:**
1. Setup: create a fresh open bug via the API and keep its id.
2. Open the bug from the board and click "Delete".
3. Request `GET /api/bugs/<id>`.
   - expect: The response status is 404.

#### 1.4. Deletion persists after a page reload

**File:** `tests/delete-bug/delete-persists-after-reload.spec.ts`

**Steps:**
1. Setup: create a fresh open bug via the API with a unique title.
2. Open the bug from the board and click "Delete".
3. Reload the page and search for the unique title.
   - expect: "No bugs matched." is shown.

#### 1.5. Deleting one bug leaves other bugs untouched

**File:** `tests/delete-bug/delete-leaves-other-bugs.spec.ts`

**Steps:**
1. Setup: create two fresh open bugs, A and B, with a shared unique prefix in their titles.
2. Search for the prefix, open bug A and click "Delete".
   - expect: Bug A's row is not in the table.
   - expect: Bug B's row is still visible with its original title, severity and owner.
   - expect: `GET /api/bugs/<B id>` still returns 200.

#### 1.6. Deleting a closed bug from the Closed filter

**File:** `tests/delete-bug/delete-closed-bug.spec.ts`

**Steps:**
1. Setup: create a fresh bug via the API, then close it with `PUT /api/bugs/<id>` (state CLOSED).
2. Select the "Closed" filter, search for the unique title, open the row and click "Delete".
   - expect: The dialog closes.
   - expect: The Closed list shows "No bugs matched." for the unique title.
   - expect: `GET /api/bugs/<id>` returns 404.

#### 1.7. Deleting the last search match shows the empty state

**File:** `tests/delete-bug/delete-last-search-match.spec.ts`

**Steps:**
1. Setup: create one fresh open bug with a unique title.
2. Search for the unique title (exactly one row is shown), open the row and click "Delete".
   - expect: The search box still contains the unique title.
   - expect: "No bugs matched." is shown.

#### 1.8. Deleting a bug keeps the active search filter

**File:** `tests/delete-bug/delete-keeps-search-filter.spec.ts`

**Steps:**
1. Setup: create two fresh open bugs sharing a unique prefix.
2. Search for the prefix (two rows are shown), open the first bug and click "Delete".
   - expect: The search box still contains the prefix.
   - expect: Only the remaining bug's row is shown.

#### 1.9. Cancel does not delete the bug

**File:** `tests/delete-bug/cancel-does-not-delete.spec.ts`

**Steps:**
1. Setup: create a fresh open bug with a unique title.
2. Open the bug from the board and click "Cancel".
   - expect: The dialog closes.
   - expect: The row with the unique title is still in the table.
   - expect: `GET /api/bugs/<id>` returns 200.

#### 1.10. Close (×) does not delete the bug

**File:** `tests/delete-bug/close-does-not-delete.spec.ts`

**Steps:**
1. Setup: create a fresh open bug with a unique title.
2. Open the bug and click the "Close" (×) button.
   - expect: The dialog closes and the row is still in the table.
   - expect: `GET /api/bugs/<id>` returns 200.

#### 1.11. Escape does not delete the bug

**File:** `tests/delete-bug/escape-does-not-delete.spec.ts`

**Steps:**
1. Setup: create a fresh open bug with a unique title.
2. Open the bug and press Escape.
   - expect: The dialog closes and the row is still in the table.
   - expect: `GET /api/bugs/<id>` returns 200.

#### 1.12. Deleting a bug with unsaved edits discards the edits

**File:** `tests/delete-bug/delete-with-unsaved-edits.spec.ts`

**Steps:**
1. Setup: create a fresh open bug with a unique title.
2. Open the bug, change the Title to `<unique title> edited` (do not save), then click "Delete".
   - expect: The dialog closes.
   - expect: Neither the original nor the edited title appears on the board.
   - expect: `GET /api/bugs/<id>` returns 404.

#### 1.13. Delete a bug using the keyboard only

**File:** `tests/delete-bug/delete-via-keyboard.spec.ts`

**Steps:**
1. Setup: create a fresh open bug with a unique title.
2. Search for the unique title, focus its row and press Enter to open it.
3. Tab to the "Delete" button and press Enter.
   - expect: The dialog closes.
   - expect: "No bugs matched." is shown for the unique title.

#### 1.14. Deleting a bug whose title contains the word "delete"

**File:** `tests/delete-bug/delete-title-contains-delete.spec.ts`

**Steps:**
1. Setup: create a fresh open bug titled `Please delete me <uuid>`.
2. Open the row, then click "Delete" (exact) inside the dialog.
   - expect: Only the dialog's Delete button is clicked (no strict-mode ambiguity with the row).
   - expect: The bug is removed from the board.

#### 1.15. Deleting a bug that was already deleted elsewhere

**File:** `tests/delete-bug/delete-already-deleted-bug.spec.ts`

**Steps:**
1. Setup: create a fresh open bug with a unique title.
2. Open the bug from the board (dialog is open).
3. Via the API, send `DELETE /api/bugs/<id>` so the bug disappears behind the open dialog.
4. Click "Delete" in the dialog.
   - expect: The application does not crash.
   - expect: The dialog stays open and shows the alert "Bug not found.".

#### 1.16. Delete failure keeps the modal open and shows an error

**File:** `tests/delete-bug/delete-failure-shows-error.spec.ts`

**Steps:**
1. Setup: create a fresh open bug with a unique title.
2. Intercept `DELETE /api/bugs/*` and fulfill it with status 500.
3. Open the bug and click "Delete".
   - expect: The dialog stays open.
   - expect: The message "Failed to delete bug." is visible.
   - expect: The bug's row is still in the table after closing the dialog.
   - expect: `GET /api/bugs/<id>` returns 200 (the real server was never called).

#### 1.17. Deleted bug id is not shown again after creating a new bug

**File:** `tests/delete-bug/deleted-bug-not-resurrected.spec.ts`

**Steps:**
1. Setup: create a fresh open bug, then delete it through the UI.
2. Create another bug with a different unique title through the "New Bug" dialog.
3. Search for the first bug's unique title.
   - expect: "No bugs matched." is shown.
   - expect: The new bug appears when searching for its own title.
