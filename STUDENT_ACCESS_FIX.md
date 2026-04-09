# Student Access Fix - Templates & Experiments

## Issue
Students could not see any templates or experiments on their dashboard. The pages were loading but showing "No templates available".

## Root Causes
1. **API Permission Issue**: The `/api/templates` GET endpoint only allowed `['faculty_coordinator', 'lab_faculty', 'hod', 'principal']` roles, excluding `student` role
2. **Template Detail API**: The `/api/templates/[id]` GET endpoint also excluded students
3. **Template Structure Mismatch**: Student pages expected fields like `subject`, `difficulty`, `estimatedTime` that don't exist in the actual `ExperimentTemplate` model
4. **Unnecessary Filters**: Student experiments page had subject filters (Physics, Chemistry, Biology) that don't match the template structure

## Changes Made

### 1. API Permission Updates
**File**: `app/api/templates/route.ts`
- Added `'student'` to allowed roles in GET endpoint
- Added logic to only show active templates to students: `if (authResult.role === 'student') { query.active = true; }`

**File**: `app/api/templates/[id]/route.ts`
- Added `'student'` to allowed roles in GET endpoint

### 2. Student Experiments Page
**File**: `app/student/experiments/page.tsx`
- Updated `Template` interface to match actual model: `{ _id, title, description, objectives?, departmentId? }`
- Removed subject/difficulty filters (Physics, Chemistry, Biology)
- Removed unused `filter` state
- Updated template card to show objectives instead of subject/difficulty
- Improved empty state message

### 3. Student Templates Page
**File**: `app/student/templates/page.tsx`
- Updated `Template` interface to match actual model
- Removed subject/difficulty/estimatedTime badges
- Updated template card to show objectives list
- Simplified card layout

## Template Structure
The actual `ExperimentTemplate` model includes:
- `title`: string
- `description`: string
- `objectives`: string[]
- `steps`: ExperimentStep[]
- `observationTables`: ObservationTable[]
- `departmentId`: ObjectId
- `active`: boolean
- `createdBy`: ObjectId
- `createdAt`: Date
- `updatedAt`: Date

## Testing
Students can now:
1. View all active templates at `/student/experiments`
2. View all active templates at `/student/templates`
3. Click on a template to start a new experiment submission
4. Access template details via API for the submission form

## Next Steps
- Faculty should create templates using the template builder at `/faculty/templates/create`
- Templates must be marked as active for students to see them
- Students can then browse and select templates to create submissions
