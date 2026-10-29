# BuggyBoard - Search Board

## Application Overview

End-to-end test plan for searching the board by title (spec: `specs/features/11-search-board.md`). Explored live with Playwright MCP.

Observed behavior:
- Header has a search field (role `search`, accessible name "Search bugs by title") to the left of "New Bug". Locator: `page.getByRole('search', { name: 'Search bugs by title' })`.
- When text is entered a "Clear search" button (×) appears next to the field.
- Board filters as the user types; bugs not matching the title are removed from the table.
- Verified: after creating bugs "Login fails" (HIGH), "Issue with log-in" (LOW) and "Checkout   crash" (MID, extra spaces), searching `login` showed "Login fails" plus existing "Login button misaligned ..." rows. Searching `CHECKOUT crash` (case and spacing differences) showed only "Checkout crash".
- Searching `zzzz` replaces the bug rows with a single row containing the text "No bugs matched." (table headers remain).
- OBSERVED DISCREPANCY: the spec example says `login` should match "Issue with log-in", but in the explored build "Issue with log-in" was NOT shown for `login`. Scenario 1.3 documents the expected (spec) behavior and may fail until fixed.
- Description text is not searched (out of scope).
- Bugs are created via New Bug > dialog 'Create bug' (Title, Severity, Owner, Description, Save). IDs are assigned incrementally. Titles are collapsed on display.

All scenarios assume the seed logs in as the first user (buggy) and lands on /board. Use unique title suffixes (e.g. timestamp) to avoid clashes with existing data, and scope assertions to the unique title.

## Test Scenarios

### 1. Search Board

**Seed:** `tests/seed.spec.ts`

#### 1.1. Blank search shows all bugs

**File:** `tests/search-board/blank-search.spec.ts`

**Steps:**
  1. Open /board with existing bugs.
  2. Inspect the search field and the table.
    - expect: Search field is empty and no Clear search (×) button is visible
    - expect: All bugs are listed
    - expect: No "No bugs matched." message

#### 1.2. Typing filters bugs by title

**File:** `tests/search-board/filter-by-title.spec.ts`

**Steps:**
  1. Create bug 'Login fails <ts>' and bug 'Checkout crash <ts>' via New Bug.
  2. Type 'login' in the search field.
    - expect: Row 'Login fails <ts>' is visible
    - expect: Row 'Checkout crash <ts>' is not visible
    - expect: Clear search (×) button appears
  3. Type additional characters ('login fails <ts>').
    - expect: Only the one matching row remains

#### 1.3. Case-insensitive, punctuation-normalized matching (spec example)

**File:** `tests/search-board/normalization.spec.ts`

**Steps:**
  1. Create bugs 'Login fails <ts>' and 'Issue with log-in <ts>' and 'Checkout crash <ts>'.
  2. Type 'login' in the search field.
    - expect: Both 'Login fails <ts>' and 'Issue with log-in <ts>' are visible (known discrepancy: currently 'log-in' is not matched)
    - expect: 'Checkout crash <ts>' is not visible
  3. Replace the query with 'LOGIN FAILS'.
    - expect: 'Login fails <ts>' is visible (case-insensitive)

#### 1.4. Whitespace is collapsed in query and titles

**File:** `tests/search-board/whitespace.spec.ts`

**Steps:**
  1. Create bug with title 'Checkout   crash <ts>' (multiple spaces).
  2. Search '  CHECKOUT    crash <ts> ' (extra leading/inner/trailing spaces).
    - expect: The bug 'Checkout crash <ts>' is visible
    - expect: Unrelated bugs are hidden

#### 1.5. No results shows empty-state message

**File:** `tests/search-board/no-results.spec.ts`

**Steps:**
  1. Type 'zzzz-no-such-bug' in the search field.
    - expect: Text "No bugs matched." is visible
    - expect: No bug data rows are shown (ID/Severity/Title/Owner header remains)
  2. Click Clear search (×).
    - expect: Message disappears and all bugs are listed again

#### 1.6. Clear search with the × button

**File:** `tests/search-board/clear-search.spec.ts`

**Steps:**
  1. Type 'login' and confirm the list is filtered.
  2. Click the 'Clear search' button.
    - expect: Search field is blank
    - expect: All bugs are displayed
    - expect: × button is no longer visible

#### 1.7. Sorting is preserved while searching

**File:** `tests/search-board/sort-preserved.spec.ts`

**Steps:**
  1. Create several bugs with titles sharing 'Sortable <ts>' (e.g. 'Sortable B', 'Sortable A', 'Sortable C') and differing severities.
  2. Click the Title column header to sort ascending.
  3. Type 'Sortable <ts>' in the search field.
    - expect: Matching rows are in ascending Title order
    - expect: Title header still shows the sort indicator
  4. Clear the search.
    - expect: Sort order and indicator remain unchanged

#### 1.8. Newly created bug appears in current search

**File:** `tests/search-board/create-while-searching.spec.ts`

**Steps:**
  1. Type 'Searchable <ts>' in the search field (no results message shown).
  2. Create bug 'Searchable <ts>' via New Bug and Save.
    - expect: Modal closes
    - expect: Row 'Searchable <ts>' is visible under the active search
    - expect: "No bugs matched." message is gone

#### 1.9. Search does not match description, owner or severity

**File:** `tests/search-board/title-only.spec.ts`

**Steps:**
  1. Create bug with title 'Plain title <ts>' and description 'secretdesc<ts>', severity LOW.
  2. Search 'secretdesc<ts>'.
    - expect: "No bugs matched." is shown
  3. Search 'LOW' and 'buggy' (severity and owner).
    - expect: Bug 'Plain title <ts>' is not matched solely by severity/owner text

#### 1.10. Search is retained/reset behavior and special characters

**File:** `tests/search-board/special-characters.spec.ts`

**Steps:**
  1. Type regex-like or special input: '(', '[', '.*', '<script>'.
    - expect: No error or crash; board shows matching rows or "No bugs matched."
  2. Reload the page.
    - expect: Search field state after reload is consistent (blank by default) and all bugs are shown
