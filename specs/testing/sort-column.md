# BuggyBoard - Sort Board Columns

## Application Overview

End-to-end test plan for sorting the bug board table (spec: `specs/features/10-sort-board-columns.md`). Explored live with Playwright MCP, including creating bugs with distinct titles, severities and owners.

Observed behavior:
- All four column headers (ID, Severity, Title, Owner) are buttons inside `columnheader` cells. Locator: `page.getByRole('button', { name: 'Title', exact: true })`.
- Default sort on load is Severity descending: the Severity header shows `↓`, no other header shows an arrow, and rows run HIGH, MID, LOW.
- Clicking an unsorted column sorts it ascending (`↑`); clicking again toggles to descending (`↓`) and again back to ascending. Only the active column shows an arrow; the previous one loses its arrow.
- ID: ascending 1, 2, 3...; descending highest ID first (e.g. 34, 33, 32).
- Severity: ascending LOW, MID, HIGH; descending HIGH, MID, LOW.
- Title: case-insensitive alphabetical (e.g. 'alpha' sorts before 'Both'; 'Zeta' last ascending). Ties on text are not tie-broken by ID.
- Owner: case-insensitive alphabetical (alice, Amy, bob, buggy, zed).
- Note: titles with repeated internal spaces display collapsed, but appear to sort by their raw text (a 'Checkout   crash <ts>' bug sorted ahead of 'Checkout crash <ts>'). Tests should use titles without repeated spaces.
- The sort arrow is a text glyph inside the header button (`aria-hidden`), so check header text content.
- Sorting stays active while searching and when switching the Open/Closed filter; edits that change a sort key re-order the row.
- Not yet verified live: whether the sort choice survives a reload (scenario 1.13), and the exact placement of new or edited rows under an active sort (1.10, 1.11).

All scenarios assume the seed logs in as `buggy` and lands on /board. Create bugs via New Bug with unique titles (timestamp suffix) and distinct owners, then assert on the relative order of those rows only, since other data may exist.

## Test Scenarios

### 1. Sort Column

**Seed:** `tests/seed.spec.ts`

#### 1.1. Default sort is Severity descending

**File:** `tests/sort-column/default-sort.spec.ts`

**Steps:**
  1. Create one HIGH, one MID and one LOW bug, then load /board.
    - expect: Severity header shows the descending arrow (down)
    - expect: ID, Title and Owner headers show no arrow
    - expect: Rows run HIGH, then MID, then LOW

#### 1.2. First click sorts a column ascending

**File:** `tests/sort-column/first-click-ascending.spec.ts`

**Steps:**
  1. Create bugs 'Zeta <ts>', 'alpha <ts>', 'Mid <ts>'.
  2. Click the Title header.
    - expect: Title header shows the up arrow; no other header shows an arrow
    - expect: 'alpha <ts>' appears before 'Mid <ts>', which appears before 'Zeta <ts>'

#### 1.3. Second click toggles to descending, third back to ascending

**File:** `tests/sort-column/toggle-direction.spec.ts`

**Steps:**
  1. Click Title, then Title again.
    - expect: Title header shows the down arrow
    - expect: Order is 'Zeta <ts>', 'Mid <ts>', 'alpha <ts>'
  2. Click Title a third time.
    - expect: Title header shows the up arrow and ascending order returns

#### 1.4. Only one column is sorted at a time

**File:** `tests/sort-column/single-active-column.spec.ts`

**Steps:**
  1. Click Owner.
    - expect: Owner header shows the up arrow
  2. Click Severity.
    - expect: Severity header shows an arrow and Owner header shows none
    - expect: Rows are ordered by severity only (first click ascending: LOW, MID, HIGH)

#### 1.5. Severity ascending order is LOW, MID, HIGH

**File:** `tests/sort-column/severity-ascending.spec.ts`

**Steps:**
  1. Click Severity (it starts descending, so the first click toggles to ascending; verify the arrow).
    - expect: Severity arrow is up
    - expect: Rows run LOW, then MID, then HIGH

#### 1.6. Severity descending order is HIGH, MID, LOW

**File:** `tests/sort-column/severity-descending.spec.ts`

**Steps:**
  1. From ascending, click Severity again.
    - expect: Severity arrow is down
    - expect: Rows run HIGH, then MID, then LOW

#### 1.7. Sort by ID

**File:** `tests/sort-column/sort-id.spec.ts`

**Steps:**
  1. Click ID, then ID again.
    - expect: First click: up arrow, lowest ID first
    - expect: Second click: down arrow, newest (highest) ID first, including newly created bugs

#### 1.8. Sort by Owner is case-insensitive

**File:** `tests/sort-column/sort-owner.spec.ts`

**Steps:**
  1. Create bugs owned by 'zed', 'Amy' and 'bob' (change Owner in the create dialog).
  2. Click Owner, then Owner again.
    - expect: Ascending: Amy, bob, zed (case ignored)
    - expect: Descending: zed, bob, Amy

#### 1.9. All four columns are clickable and sortable

**File:** `tests/sort-column/all-columns-sortable.spec.ts`

**Steps:**
  1. Click each of ID, Severity, Title and Owner in turn.
    - expect: Each header is a button and shows an arrow after being clicked
    - expect: The previously sorted header loses its arrow

#### 1.10. New bug is placed according to the active sort

**File:** `tests/sort-column/create-while-sorted.spec.ts`

**Steps:**
  1. Sort by Title ascending.
  2. Create bug 'AAA first <ts>' via New Bug.
    - expect: The new row appears at its alphabetical position (near the top), not just at the end
    - expect: Title arrow is still the up arrow

#### 1.11. Editing a sort key re-orders the row

**File:** `tests/sort-column/edit-while-sorted.spec.ts`

**Steps:**
  1. Sort by Severity descending with a LOW bug at the bottom.
  2. Open that bug, change Severity to HIGH, Save.
    - expect: The row moves to the HIGH group; the Severity arrow is unchanged

#### 1.12. Sort is preserved with search and state filter

**File:** `tests/sort-column/sort-with-search-and-filter.spec.ts`

**Steps:**
  1. Sort by Title ascending, then search '<ts>'.
    - expect: Matching rows keep ascending Title order and the arrow remains
  2. Close one matching bug and switch between Open and Closed.
    - expect: Each view keeps the Title ascending order and arrow

#### 1.13. Sort resets to default after reload

**File:** `tests/sort-column/reload-resets-sort.spec.ts`

**Steps:**
  1. Sort by Owner, then reload /board.
    - expect: Severity descending is active again and Owner shows no arrow
