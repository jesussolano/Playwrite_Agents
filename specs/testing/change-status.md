# BuggyBoard - Change Severity and Status

## Application Overview

End-to-end test plan for changing a bug's severity and state (Open/Closed) (specs: `specs/features/09-edit-bug.md`, `specs/features/13-bug-status.md`). Explored live with Playwright MCP, including creating a bug first.

Observed behavior:
- The New Bug dialog has no State field. A new bug is created as Open and appears under the default Open filter (e.g. "22 LOW Status <ts> buggy").
- Severity and state are changed only from the Edit dialog (click the board row; rows are `role=button`). The board has no inline editing. The dialog has Severity (HIGH/MID/LOW) and State (Open/Closed) comboboxes.
- Changing severity and saving updates the row at once (LOW to HIGH). Several fields can be changed in one save (state Closed and severity MID together).
- Closing a bug removes it from the Open view; it appears under Closed with its updated severity. Reopening moves it back to Open. Reopening the dialog shows the saved state and severity.
- Search applies within the selected state: the closed bug was found with Closed selected and gave "No bugs matched." with Open selected.
- The Open/Closed toggle buttons expose no `aria-pressed`; the selected style is visual only (check via CSS/class or screenshot). Open is selected by default.
- Locators: `getByRole('button', { name: /<title>/ })`, `getByRole('dialog')`, `getByLabel('State')`, `getByLabel('Severity')`, `getByRole('button', { name: 'Closed', exact: true })`.

All scenarios assume the seed logs in as `buggy` and lands on /board with the Open filter. Each test creates its own bug with a unique title (timestamp suffix) through New Bug.

## Test Scenarios

### 1. Change Severity and Status

**Seed:** `tests/seed.spec.ts`

#### 1.1. New bug is created Open and has no State field in the create dialog

**File:** `tests/change-status/new-bug-open.spec.ts`

**Steps:**
  1. Click New Bug.
  2. Inspect the dialog.
    - expect: No State field is present
  3. Fill Title, Severity LOW, Description; Save.
    - expect: Bug appears in the Open view with severity LOW
  4. Open the bug.
    - expect: State shows Open

#### 1.2. Change severity via the edit dialog

**File:** `tests/change-status/change-severity.spec.ts`

**Steps:**
  1. Create bug (LOW). Open it, set Severity HIGH, Save.
    - expect: Modal closes
    - expect: Board row shows HIGH with the same ID and title
  2. Reopen the bug.
    - expect: Severity shows HIGH

#### 1.3. Every severity transition

**File:** `tests/change-status/severity-transitions.spec.ts`

**Steps:**
  1. For LOW to MID, MID to HIGH, HIGH to LOW: open bug, change severity, Save.
    - expect: Row shows the new severity each time
    - expect: Save is disabled until a change is made

#### 1.4. Close a bug

**File:** `tests/change-status/close-bug.spec.ts`

**Steps:**
  1. Create bug. Open it, set State Closed, Save.
    - expect: Modal closes
    - expect: Bug disappears from the Open view
  2. Select Closed in the state filter.
    - expect: Bug is listed with its ID, severity, title and owner
  3. Open the bug.
    - expect: State shows Closed

#### 1.5. Reopen a closed bug

**File:** `tests/change-status/reopen-bug.spec.ts`

**Steps:**
  1. Close a bug, select Closed filter, open it, set State Open, Save.
    - expect: Bug disappears from the Closed view
  2. Select Open.
    - expect: Bug is listed again

#### 1.6. Change severity and state in one save

**File:** `tests/change-status/severity-and-state.spec.ts`

**Steps:**
  1. Create a LOW bug. Open it, set Severity MID and State Closed, Save.
  2. Select Closed.
    - expect: Row shows MID in the Closed view
    - expect: Bug is absent from the Open view

#### 1.7. Change severity of a closed bug

**File:** `tests/change-status/closed-severity.spec.ts`

**Steps:**
  1. With Closed selected, open a closed bug, change Severity, Save.
    - expect: Bug stays in the Closed view with the new severity

#### 1.8. Changes persist after reload

**File:** `tests/change-status/persistence.spec.ts`

**Steps:**
  1. Close a bug and change severity; reload.
    - expect: Filter returns to Open by default and the bug is not listed
  2. Select Closed and open the bug.
    - expect: Saved severity and state are shown

#### 1.9. Cancel does not change severity or state

**File:** `tests/change-status/cancel.spec.ts`

**Steps:**
  1. Open a bug, change Severity and State, click Cancel.
    - expect: Board row and view are unchanged
  2. Repeat with Escape.
    - expect: No change saved

#### 1.10. State filter default and exclusivity

**File:** `tests/change-status/filter-toggle.spec.ts`

**Steps:**
  1. Load /board.
    - expect: Open is the selected filter and only open bugs are shown
  2. Click Closed, then Open.
    - expect: Only the selected state's bugs are displayed; one option is selected at a time

#### 1.11. Search combines with state filter

**File:** `tests/change-status/search-with-state.spec.ts`

**Steps:**
  1. Close a bug 'Status <ts>'. Select Closed and search 'Status <ts>'.
    - expect: Bug is listed
  2. Select Open with the same search.
    - expect: 'No bugs matched.' is shown

#### 1.12. Sorting is preserved within a state filter

**File:** `tests/change-status/sort-with-state.spec.ts`

**Steps:**
  1. Close two bugs with different titles and severities. Select Closed and sort by Title, then Severity.
    - expect: Only closed bugs are shown in the chosen order
    - expect: Changing a bug's severity re-sorts it correctly

#### 1.13. Closed filter with no closed bugs

**File:** `tests/change-status/closed-empty.spec.ts`

**Steps:**
  1. With a fresh database (no closed bugs), select Closed.
    - expect: 'No bugs matched.' is shown and no bug rows

#### 1.14. Save disabled without changes

**File:** `tests/change-status/save-disabled.spec.ts`

**Steps:**
  1. Open a bug.
    - expect: Save is disabled
  2. Change State to Closed, then back to Open.
    - expect: Save enables, then disables again
