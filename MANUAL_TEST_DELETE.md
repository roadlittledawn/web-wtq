# Manual Test Plan for Delete Functionality

## Task 25.1: Delete Confirmation Modal

### Test Cases

#### 1. Open Delete Modal

- **Steps:**
  1. Log in to the admin interface
  2. Navigate to an entries list page
  3. Click the red delete button (trash icon) on any entry
- **Expected Result:**
  - A modal dialog appears with:
    - Warning icon (red triangle with exclamation)
    - Title "Delete Entry"
    - Message showing the entry title
    - "Delete" button (red)
    - "Cancel" button (gray)

#### 2. Cancel Deletion

- **Steps:**
  1. Open delete modal (as above)
  2. Click "Cancel" button
- **Expected Result:**
  - Modal closes
  - Entry remains in the list
  - No API call is made

#### 3. Cancel with Escape Key

- **Steps:**
  1. Open delete modal
  2. Press ESC key
- **Expected Result:**
  - Modal closes
  - Entry remains in the list

#### 4. Cancel by Clicking Overlay

- **Steps:**
  1. Open delete modal
  2. Click on the dark overlay outside the modal
- **Expected Result:**
  - Modal closes
  - Entry remains in the list

#### 5. Successful Deletion

- **Steps:**
  1. Open delete modal
  2. Click "Delete" button
- **Expected Result:**
  - "Delete" button shows loading spinner and "Deleting..." text
  - API call is made to `/.netlify/functions/entries-delete/{id}`
  - On success:
    - Modal closes
    - Page refreshes
    - Entry is removed from the list
    - Entry is removed from database

#### 6. Deletion Error Handling

- **Steps:**
  1. Open delete modal
  2. Remove authentication token from localStorage
  3. Click "Delete" button
- **Expected Result:**
  - Error message appears above the entry list
  - Error message shows "Authentication token not found"
  - Modal remains open
  - Entry remains in the list

#### 7. Cannot Close During Deletion

- **Steps:**
  1. Open delete modal
  2. Click "Delete" button
  3. Immediately try to:
  - Click "Cancel"
  - Press ESC
  - Click overlay
- **Expected Result:**
  - Modal cannot be closed while deletion is in progress
  - All buttons are disabled
  - Loading spinner is visible

#### 8. Multiple Entries

- **Steps:**
  1. Open delete modal for entry A
  2. Verify other delete buttons are disabled
- **Expected Result:**
  - Only one delete operation can be active at a time
  - All other delete buttons are disabled while modal is open

### Requirements Validated

- **Requirement 4.1**: Confirm before deletion ✓
- **Requirement 4.2**: Call delete API endpoint ✓
- **Requirement 4.3**: Handle success/error ✓
- **Redirect after deletion**: Page refresh via router.refresh() ✓

### Implementation Details

**Components Created:**

- `DeleteConfirmationModal.tsx`: Reusable modal component with:
  - Accessible ARIA attributes
  - Keyboard navigation (ESC to close)
  - Click-outside-to-close
  - Loading state
  - Disabled state during deletion

**Components Modified:**

- `EntryList.tsx`: Updated to:
  - Use DeleteConfirmationModal instead of browser confirm()
  - Make API call to delete endpoint
  - Handle authentication
  - Display error messages
  - Refresh page after successful deletion
  - Prevent multiple simultaneous deletions

**API Endpoint Used:**

- `DELETE /.netlify/functions/entries-delete/{id}`
- Requires JWT authentication
- Returns success/error response
- Updates tag usage counts
