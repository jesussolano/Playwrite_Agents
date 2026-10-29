# BuggyBoard - Create New Bug

## Application Overview

End-to-end test plan for the Create bug modal. Explored: New Bug opens dialog "Create bug" with Title (empty), Severity select (HIGH/MID/LOW, default MID), Owner (prefilled with current user "buggy"), Description (empty), Cancel, Save and Close (x). Saving blank shows alert "Title is required." and "Description is required." Escape closes the modal. All scenarios assume a fresh state: seed logs in as the first user in users.json and lands on /board.

## Test Scenarios

### 1. Create Bug

**Seed:** `tests/seed.spec.ts`

#### 1.1. Open modal and verify default values

**File:** `tests/seed.spec.ts`

**Steps:**
  1. Click New Bug in the header.
  2. Inspect dialog fields.
    - expect: Dialog 'Create bug' visible with Close, Cancel, Save
    - expect: Title and Description empty; Severity MID; Owner = logged-in user (buggy)

#### 1.2. Create bug with valid data (happy path)

**File:** `tests/seed.spec.ts`

**Steps:**
  1. Open New Bug.
  2. Enter unique Title (e.g. 'Checkout fails <timestamp>').
  3. Select Severity HIGH.
  4. Enter Description 'Steps to reproduce'.
  5. Click Save.
    - expect: Modal closes
    - expect: Bugs table shows new row with next ID, HIGH, the title, owner buggy
    - expect: No errors shown

#### 1.3. Create bug keeping default severity and owner

**File:** `tests/seed.spec.ts`

**Steps:**
  1. Open New Bug, fill only Title and Description.
  2. Click Save.
    - expect: New row has severity MID and owner equal to current user

#### 1.4. Create bug with each severity (HIGH, MID, LOW)

**File:** `tests/seed.spec.ts`

**Steps:**
  1. For each severity, open New Bug, fill Title/Description, choose severity, Save.
    - expect: Each row shows the chosen severity
    - expect: Severity sort orders them correctly

#### 1.5. Blank form validation

**File:** `tests/seed.spec.ts`

**Steps:**
  1. Open New Bug.
  2. Click Save without entering data.
    - expect: Modal stays open
    - expect: Alert lists 'Title is required.' and 'Description is required.'
    - expect: No row added

#### 1.6. Only Title missing / only Description missing

**File:** `tests/seed.spec.ts`

**Steps:**
  1. Open New Bug, fill only Description, Save.
    - expect: Only 'Title is required.' shown
  2. Reopen, fill only Title, Save.
    - expect: Only 'Description is required.' shown
    - expect: Nothing created

#### 1.7. Whitespace-only values rejected

**File:** `tests/seed.spec.ts`

**Steps:**
  1. Open New Bug, enter spaces in Title and Description.
  2. Click Save.
    - expect: Required errors shown; no bug created (if accepted, record as defect)

#### 1.8. Cleared Owner field

**File:** `tests/seed.spec.ts`

**Steps:**
  1. Open New Bug, fill Title/Description, clear Owner, Save.
    - expect: Document behavior: validation error or fallback owner; no crash

#### 1.9. Cancel discards input

**File:** `tests/seed.spec.ts`

**Steps:**
  1. Open New Bug, type Title and Description.
  2. Click Cancel.
    - expect: Modal closes, no row added
  3. Reopen New Bug.
    - expect: Form is empty with defaults

#### 1.10. Close (x) button closes modal

**File:** `tests/seed.spec.ts`

**Steps:**
  1. Open New Bug, enter data, click the x button.
    - expect: Modal closes, no bug created

#### 1.11. Escape key closes modal

**File:** `tests/seed.spec.ts`

**Steps:**
  1. Open New Bug, press Escape.
    - expect: Modal closes; board unchanged

#### 1.12. Validation errors clear after correction

**File:** `tests/seed.spec.ts`

**Steps:**
  1. Open New Bug, Save blank to trigger errors.
  2. Fill valid Title and Description, Save.
    - expect: Bug created, modal closes
    - expect: Errors not shown on reopening

#### 1.13. Persistence after reload

**File:** `tests/seed.spec.ts`

**Steps:**
  1. Create a bug with unique title.
  2. Reload the page (log in again if needed).
    - expect: Bug still listed with same ID, severity, title, owner

#### 1.14. Long text values

**File:** `tests/seed.spec.ts`

**Steps:**
  1. Create bug with 255+ char Title and 5000 char Description, Save.
    - expect: Created with layout intact (truncated/wrapped) or a clear length validation error; no crash

#### 1.15. Special characters and injection strings

**File:** `tests/seed.spec.ts`

**Steps:**
  1. Create bug with Title "<script>alert(1)</script> & 'quotes' é 🐞" and similar Description, Save.
  2. View the row and reload.
    - expect: Text shown literally
    - expect: No script executes
    - expect: Value persists

#### 1.16. Duplicate titles

**File:** `tests/seed.spec.ts`

**Steps:**
  1. Create two bugs with identical Title.
    - expect: Both created with distinct IDs (or clear duplicate error)

#### 1.17. Double-click Save does not create duplicates

**File:** `tests/seed.spec.ts`

**Steps:**
  1. Fill valid data and double-click Save.
    - expect: Exactly one bug created

#### 1.18. Keyboard accessibility

**File:** `tests/seed.spec.ts`

**Steps:**
  1. Open New Bug, Tab through fields, change Severity with arrow keys, Tab to Save, press Enter.
    - expect: Focus starts in Title
    - expect: Order logical
    - expect: Bug created by keyboard only

#### 1.19. New bug visible under Open filter and search

**File:** `tests/seed.spec.ts`

**Steps:**
  1. Create a bug.
  2. Click Open filter, then search by its title.
    - expect: Bug appears in Open and in search results
    - expect: Absent from Closed
