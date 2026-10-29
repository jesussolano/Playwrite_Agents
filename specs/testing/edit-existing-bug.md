# BuggyBoard - Edit Existing Bug

## Application Overview

End-to-end test plan for editing an existing bug (spec: `specs/features/09-edit-bug.md`). Explored live with Playwright MCP, including creating a bug first through New Bug.

Observed behavior:
- Board rows are `role=button` elements (not `row`); clicking one opens a dialog headed "Edit bug #<id>" (e.g. "Edit bug #18"), with a Close (x) button.
- Fields: ID (read-only textbox), Title, Severity (combobox HIGH/MID/LOW), State (combobox Open/Closed), Owner (textbox), Description (textbox). Buttons: Delete, Cancel, Save.
- Save is disabled on open, disabled when a field is restored to its original value, and disabled when Title, Description or Owner is blank or whitespace-only. It enables once a valid change is made.
- Severity select text color follows severity: MID rgb(166, 124, 71) (amber), HIGH rgb(184, 74, 46) (terracotta).
- Clicking the backdrop does not close the modal and keeps edits. Cancel, x and Escape close without saving; the board row stays unchanged.
- Save closes the modal and the row updates immediately (e.g. "18 HIGH Edited title ... buggy"). Changes persist after reload, and the board's search finds the new title.
- Locators: `getByRole('button', { name: /<title>/ })` for the row, `getByRole('dialog')`, `getByLabel('Title')`, `getByRole('button', { name: 'Save', exact: true })`.

All scenarios assume the seed logs in as user `buggy` and lands on /board. Each test creates its own bug with a unique title (timestamp suffix) via New Bug (Title, Severity, Description) so tests are independent.

## Test Scenarios

### 1. Edit Existing Bug

**Seed:** `tests/seed.spec.ts`

#### 1.1. Open a bug from the board

**File:** `tests/edit-bug/open-bug.spec.ts`

**Steps:**
  1. Create bug 'Edit me <ts>' (MID, description 'Original description').
  2. Click its row on the board.
    - expect: Dialog with heading 'Edit bug #<id>' is visible
    - expect: ID, Title, Severity (MID), State (Open), Owner (buggy) and Description show the bug's values
    - expect: Delete, Cancel, Save and Close buttons are present

#### 1.2. ID is read-only; other fields are editable

**File:** `tests/edit-bug/field-editability.spec.ts`

**Steps:**
  1. Open the bug.
  2. Try to type in ID.
  3. Edit Title, Severity, State, Owner and Description.
    - expect: ID textbox is read-only and its value does not change
    - expect: All other fields accept edits

#### 1.3. Edit title and save

**File:** `tests/edit-bug/edit-title.spec.ts`

**Steps:**
  1. Open the bug, change Title to 'Edited title <ts>'.
  2. Click Save.
    - expect: Save becomes enabled after the change
    - expect: Modal closes
    - expect: Board shows the row with the new title and the same ID; the old title is gone
    - expect: Other columns (severity, owner) unchanged

#### 1.4. Edit description and save

**File:** `tests/edit-bug/edit-description.spec.ts`

**Steps:**
  1. Open the bug, change Description to 'Updated description'.
  2. Click Save, then reopen the bug.
    - expect: Modal closes after Save
    - expect: Reopened modal shows 'Updated description'
    - expect: Board row title is unchanged

#### 1.5. Edit severity and other fields; board reflects change

**File:** `tests/edit-bug/edit-severity.spec.ts`

**Steps:**
  1. Open the bug (MID), set Severity HIGH and Owner to another value; Save.
    - expect: Board row shows HIGH (terracotta) and the new owner
    - expect: Row position follows the current sort

#### 1.6. Changes persist after reload

**File:** `tests/edit-bug/persistence.spec.ts`

**Steps:**
  1. Edit title, severity and description; Save.
  2. Reload the page and reopen the bug.
    - expect: Heading, Title, Severity and Description show the saved values

#### 1.7. Cancel discards changes

**File:** `tests/edit-bug/cancel.spec.ts`

**Steps:**
  1. Open the bug, change Title.
  2. Click Cancel.
    - expect: Modal closes
    - expect: Board shows the original title
    - expect: Reopening shows the original values

#### 1.8. Close with X discards changes

**File:** `tests/edit-bug/close-x.spec.ts`

**Steps:**
  1. Open the bug, change Title, click Close (x).
    - expect: Modal closes and the original title remains on the board

#### 1.9. Escape discards changes

**File:** `tests/edit-bug/escape.spec.ts`

**Steps:**
  1. Open the bug, change Title, press Escape.
    - expect: Modal closes and the original title remains on the board

#### 1.10. Backdrop click does not close the modal

**File:** `tests/edit-bug/backdrop.spec.ts`

**Steps:**
  1. Open the bug and change Title.
  2. Click the dimmed area outside the modal.
    - expect: Modal remains open
    - expect: Edited Title value is preserved

#### 1.11. Save disabled with no changes

**File:** `tests/edit-bug/save-disabled-no-changes.spec.ts`

**Steps:**
  1. Open the bug.
    - expect: Save is disabled
  2. Change Title then restore the original value.
    - expect: Save becomes enabled, then disabled again

#### 1.12. Save disabled when a required field is blank

**File:** `tests/edit-bug/save-disabled-blank.spec.ts`

**Steps:**
  1. Open the bug and clear Title; check Save. Restore it.
  2. Repeat for Description and Owner.
  3. Enter only spaces in Title.
    - expect: Save is disabled in each blank/whitespace-only case
    - expect: Save is enabled again once valid values are entered with a real change

#### 1.13. Severity select uses board color coding

**File:** `tests/edit-bug/severity-colors.spec.ts`

**Steps:**
  1. Open a bug and switch Severity among HIGH, MID, LOW.
    - expect: Options are HIGH, MID, LOW
    - expect: Select text color matches the board colors (HIGH terracotta, MID amber, LOW sage)

#### 1.14. Edited bug is found by board search

**File:** `tests/edit-bug/search-after-edit.spec.ts`

**Steps:**
  1. Rename the bug to 'Edited title <ts>' and Save.
  2. Search 'Edited title <ts>'; then search the old title.
    - expect: New title matches the bug
    - expect: Old title shows 'No bugs matched.'

#### 1.15. Editing one bug does not affect others

**File:** `tests/edit-bug/isolation.spec.ts`

**Steps:**
  1. Create two bugs; edit the first and Save.
    - expect: Second bug's row and values are unchanged

#### 1.16. Change state to Closed

**File:** `tests/edit-bug/state-change.spec.ts`

**Steps:**
  1. Open the bug, set State to Closed, Save.
    - expect: Bug disappears from the Open view and appears under the Closed filter (verify actual behavior)
