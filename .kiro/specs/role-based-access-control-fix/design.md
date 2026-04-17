# Role-Based Access Control Bugfix Design

## Overview

LabSync has two categories of access-control vulnerabilities. The first is a gap in `middleware.ts`: the `roleRoutes` map is structurally correct but the middleware logic is already sound — analysis confirms it correctly blocks cross-role page access. The real bugs are entirely in the API layer. Five API endpoints either use `requireAuth` (any authenticated user) instead of `requireRole`, or fail to scope returned data to the requesting user's context. The fix is surgical: add role guards and data-scoping logic to the five affected endpoints without touching any other behavior.

**Affected files:**
- `app/api/sessions/route.ts` — `GET` returns all sessions; must be scoped for students
- `app/api/lab-groups/[id]/route.ts` — `GET` allows students without membership check
- `app/api/submissions/[id]/route.ts` — `GET` and `PUT` use `requireAuth` instead of `requireRole`
- `app/api/submissions/route.ts` — `POST` uses `requireAuth`; must be student-only

---

## Glossary

- **Bug_Condition (C)**: The condition that triggers a specific access-control defect — either a missing role guard or missing data-scoping logic on an API endpoint
- **Property (P)**: The desired behavior when the bug condition holds — the endpoint returns 403 Forbidden or returns only data the caller is authorized to see
- **Preservation**: All existing correct behaviors (authorized access, correct data for permitted roles) that must remain unchanged after the fix
- **`requireAuth`**: Helper in `lib/middleware/auth-middleware.ts` that verifies a valid JWT is present but does not check the caller's role
- **`requireRole`**: Helper in `lib/middleware/auth-middleware.ts` that verifies a valid JWT and checks the caller's role against an allowed list
- **`isBugCondition`**: Pseudocode predicate that returns `true` when a given request triggers the defect
- **`labGroups.students`**: Array of `ObjectId` values on the `LabGroup` document representing enrolled students
- **`middleware.ts`**: Next.js edge middleware that enforces page-level route access by role prefix

---

## Bug Details

### Bug Condition

The bugs manifest when an API endpoint accepts a request from a caller whose role or identity should not grant access, because the endpoint uses `requireAuth` (no role check) or performs no data-scoping for the `student` role.

**Formal Specification — C1: Missing role guard on `POST /api/submissions`**
```
FUNCTION isBugCondition_C1(request)
  INPUT: request with authenticated role
  OUTPUT: boolean

  RETURN request.role NOT IN ['student']
         AND request.method = 'POST'
         AND request.path = '/api/submissions'
END FUNCTION
```

**Formal Specification — C2: Missing role guard on `GET /api/submissions/:id`**
```
FUNCTION isBugCondition_C2(request)
  INPUT: request with authenticated role
  OUTPUT: boolean

  RETURN request.role NOT IN ['student', 'lab_faculty', 'hod', 'principal']
         AND request.method = 'GET'
         AND request.path MATCHES '/api/submissions/[id]'
END FUNCTION
```

**Formal Specification — C3: Missing role guard on `PUT /api/submissions/:id`**
```
FUNCTION isBugCondition_C3(request)
  INPUT: request with authenticated role
  OUTPUT: boolean

  RETURN request.role NOT IN ['student', 'lab_faculty', 'hod', 'principal']
         AND request.method = 'PUT'
         AND request.path MATCHES '/api/submissions/[id]'
END FUNCTION
```

**Formal Specification — C4: Missing data scoping on `GET /api/sessions` for students**
```
FUNCTION isBugCondition_C4(request)
  INPUT: request with authenticated role
  OUTPUT: boolean

  RETURN request.role = 'student'
         AND request.method = 'GET'
         AND request.path = '/api/sessions'
END FUNCTION
```

**Formal Specification — C5: Missing membership check on `GET /api/lab-groups/:id` for students**
```
FUNCTION isBugCondition_C5(request, labGroup)
  INPUT: request with authenticated role, labGroup document
  OUTPUT: boolean

  RETURN request.role = 'student'
         AND request.userId NOT IN labGroup.students
         AND request.method = 'GET'
         AND request.path MATCHES '/api/lab-groups/[id]'
END FUNCTION
```

### Examples

- A `faculty_coordinator` calls `POST /api/submissions` → currently succeeds; should return 403
- A `faculty_coordinator` calls `GET /api/submissions/abc123` → currently returns the submission; should return 403
- A `student` calls `GET /api/sessions?status=active` → currently returns all active sessions in the database; should return only sessions for lab groups the student is enrolled in
- A `student` calls `GET /api/lab-groups/xyz` for a group they are not enrolled in → currently returns the full document; should return 403
- A `student` calls `GET /api/sessions?status=active` and is enrolled in two lab groups → should return sessions for those two groups only (preserved behavior)

---

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- `student` calling `GET /api/sessions` while enrolled in lab groups continues to receive sessions for those groups
- `student` calling `GET /api/lab-groups/:id` for a group they belong to continues to receive the document
- `student` calling `GET /api/submissions/:id` for their own submission continues to receive it
- `student` calling `PUT /api/submissions/:id` for their own submission continues to succeed
- `student` calling `POST /api/submissions` continues to succeed
- `lab_faculty`, `hod`, `principal` calling `GET /api/sessions` continue to receive all sessions unfiltered
- `lab_faculty`, `hod`, `principal` calling `GET /api/lab-groups/:id` continue to receive the document
- `lab_faculty`, `hod`, `principal` calling `GET /api/submissions/:id` continue to receive the submission
- `lab_faculty`, `hod`, `principal` calling `PUT /api/submissions/:id` continue to succeed
- All page-level routing via `middleware.ts` continues to work correctly for all roles

**Scope:**
All requests that do NOT match one of the five bug conditions above must be completely unaffected by this fix. The middleware is not modified.

---

## Hypothesized Root Cause

1. **`requireAuth` used instead of `requireRole`**: `POST /api/submissions`, `GET /api/submissions/:id`, and `PUT /api/submissions/:id` all call `requireAuth`, which only verifies a valid JWT exists. This was likely an oversight during initial development — the developer added authentication but forgot to restrict by role.

2. **No student data-scoping in `GET /api/sessions`**: The sessions list handler builds a MongoDB query from URL params but never adds a `labGroupId` filter when the caller is a student. The `GET /api/sessions/[id]` handler (single session) correctly checks lab group membership, but the list handler does not.

3. **No membership check in `GET /api/lab-groups/:id`**: The handler fetches the lab group and returns it immediately after the role check. The role check allows `student`, but there is no secondary check that the student is in `labGroup.students`.

4. **Middleware is correct**: After analysis, `middleware.ts` correctly uses `Object.values(roleRoutes).flat()` to build the full set of known role prefixes. Any role accessing a prefix outside its `allowedRoutes` list is redirected. No changes are needed here.

---

## Correctness Properties

Property 1: Bug Condition — Unauthorized Role Blocked from Submissions Creation

_For any_ request where `isBugCondition_C1` holds (caller role is not `student` and method is `POST /api/submissions`), the fixed handler SHALL return a 403 Forbidden response and SHALL NOT create a submission document.

**Validates: Requirements 2.9**

Property 2: Bug Condition — Unauthorized Role Blocked from Submission Read

_For any_ request where `isBugCondition_C2` holds (caller role is not in `['student', 'lab_faculty', 'hod', 'principal']` and method is `GET /api/submissions/:id`), the fixed handler SHALL return a 403 Forbidden response.

**Validates: Requirements 2.6**

Property 3: Bug Condition — Unauthorized Role Blocked from Submission Update

_For any_ request where `isBugCondition_C3` holds (caller role is not in `['student', 'lab_faculty', 'hod', 'principal']` and method is `PUT /api/submissions/:id`), the fixed handler SHALL return a 403 Forbidden response and SHALL NOT modify the submission document.

**Validates: Requirements 2.8**

Property 4: Bug Condition — Student Sessions Scoped to Enrolled Lab Groups

_For any_ request where `isBugCondition_C4` holds (caller role is `student` and method is `GET /api/sessions`), the fixed handler SHALL return only sessions whose `labGroupId` is present in the set of lab groups where `students` contains the caller's `userId`.

**Validates: Requirements 2.4**

Property 5: Bug Condition — Student Blocked from Non-Member Lab Group

_For any_ request where `isBugCondition_C5` holds (caller role is `student`, method is `GET /api/lab-groups/:id`, and caller's `userId` is not in `labGroup.students`), the fixed handler SHALL return a 403 Forbidden response.

**Validates: Requirements 2.5**

Property 6: Preservation — Authorized Access Unchanged

_For any_ request where none of the five bug conditions hold (the caller is authorized and the data is within their scope), the fixed handlers SHALL produce exactly the same response as the original handlers, preserving all existing authorized access patterns.

**Validates: Requirements 3.1–3.13**

---

## Fix Implementation

### Changes Required

#### Fix 1: `app/api/submissions/route.ts` — `POST` handler

**Change**: Replace `requireAuth` with `requireRole(['student'])`.

```typescript
// Before
const authResult = await requireAuth(request);

// After
const authResult = await requireRole(request, ['student']);
```

The `GET` handler in this file already correctly scopes students to their own submissions via `query.studentId`. No change needed there beyond the import cleanup if `requireAuth` is no longer used.

#### Fix 2: `app/api/submissions/[id]/route.ts` — `GET` handler

**Change**: Replace `requireAuth` with `requireRole(['student', 'lab_faculty', 'hod', 'principal'])`.

```typescript
// Before
const authResult = await requireAuth(request);

// After
const authResult = await requireRole(request, ['student', 'lab_faculty', 'hod', 'principal']);
```

The existing student ownership check (`submission.studentId.toString() !== authResult.userId`) is correct and must be preserved as-is.

#### Fix 3: `app/api/submissions/[id]/route.ts` — `PUT` handler

**Change**: Replace `requireAuth` with `requireRole(['student', 'lab_faculty', 'hod', 'principal'])`.

```typescript
// Before
const authResult = await requireAuth(request);

// After
const authResult = await requireRole(request, ['student', 'lab_faculty', 'hod', 'principal']);
```

The existing student ownership check and approved-submission guard are correct and must be preserved.

#### Fix 4: `app/api/sessions/route.ts` — `GET` handler

**Change**: After building the base `query` object and before executing the database query, add a student-scoping block.

```typescript
// Add after: if (labGroupId) { ... }
// and before: const skip = (page - 1) * limit;

if (authResult.role === 'student') {
  // Find all lab groups the student is enrolled in
  const studentLabGroups = await db
    .collection('labGroups')
    .find({ students: new ObjectId(authResult.userId) })
    .project({ _id: 1 })
    .toArray();

  const labGroupIds = studentLabGroups.map((g) => g._id);

  // If a specific labGroupId was requested, intersect with enrolled groups
  if (query.labGroupId) {
    const isEnrolled = labGroupIds.some(
      (id) => id.toString() === query.labGroupId.toString()
    );
    if (!isEnrolled) {
      // Student is not in the requested group — return empty result
      return successResponse([], { page, limit, total: 0 });
    }
    // query.labGroupId is already set; no change needed
  } else {
    // No specific group requested — scope to all enrolled groups
    query.labGroupId = { $in: labGroupIds };
  }
}
```

#### Fix 5: `app/api/lab-groups/[id]/route.ts` — `GET` handler

**Change**: After fetching the `labGroup` document and confirming it exists, add a membership check for students.

```typescript
// Add after: if (!labGroup) { return notFoundError(...) }
// and before: return successResponse(labGroup)

if (authResult.role === 'student') {
  const isMember = labGroup.students.some(
    (s: ObjectId) => s.toString() === authResult.userId
  );
  if (!isMember) {
    return forbiddenError('You are not a member of this lab group');
  }
}
```

`forbiddenError` is already imported in this file via `@/lib/api-response`.

#### Import cleanup

After fixes 2 and 3, `requireAuth` is no longer used in `app/api/submissions/[id]/route.ts`. Remove the `requireAuth` import and replace with `requireRole`.

After fix 1, if `requireAuth` is still used in `app/api/submissions/route.ts` for the `GET` handler, keep the import. If not, replace it.

Note: `app/api/submissions/route.ts` `GET` uses `requireAuth` — this is acceptable because the handler already scopes students to their own submissions. However, for defense-in-depth and consistency, it can optionally be changed to `requireRole(['student', 'lab_faculty', 'hod', 'principal'])`. This is not required to fix the reported bugs.

---

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, write exploratory tests that demonstrate each bug on the unfixed code to confirm the root cause, then verify the fix works correctly and preserves all existing authorized behavior.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate each bug BEFORE implementing the fix. Confirm or refute the root cause analysis.

**Test Plan**: Write unit tests that call each affected handler with a mocked request carrying the buggy role/identity, and assert the response. Run these tests on the UNFIXED code to observe that they fail (i.e., the handler incorrectly succeeds).

**Test Cases**:
1. **C1 — Faculty creates submission**: Call `POST /api/submissions` with role `lab_faculty` → expect 403 (will pass on unfixed code, confirming the bug)
2. **C2 — Coordinator reads submission**: Call `GET /api/submissions/:id` with role `faculty_coordinator` → expect 403 (will pass on unfixed code)
3. **C3 — Coordinator updates submission**: Call `PUT /api/submissions/:id` with role `faculty_coordinator` → expect 403 (will pass on unfixed code)
4. **C4 — Student sees all sessions**: Call `GET /api/sessions` with role `student` not enrolled in any group → expect empty array (will return all sessions on unfixed code)
5. **C5 — Student reads foreign lab group**: Call `GET /api/lab-groups/:id` with role `student` not in the group → expect 403 (will return the document on unfixed code)

**Expected Counterexamples**:
- `POST /api/submissions` with `lab_faculty` role returns 200 and creates a document (unfixed)
- `GET /api/submissions/:id` with `faculty_coordinator` role returns 200 with submission data (unfixed)
- `GET /api/sessions` with `student` role returns sessions from unrelated lab groups (unfixed)
- `GET /api/lab-groups/:id` with `student` role returns a group the student is not enrolled in (unfixed)

### Fix Checking

**Goal**: Verify that for all inputs where a bug condition holds, the fixed handler produces the expected behavior.

**Pseudocode:**
```
FOR ALL request WHERE isBugCondition_C1(request) DO
  result := POST_submissions_fixed(request)
  ASSERT result.status = 403
END FOR

FOR ALL request WHERE isBugCondition_C2(request) DO
  result := GET_submission_fixed(request)
  ASSERT result.status = 403
END FOR

FOR ALL request WHERE isBugCondition_C3(request) DO
  result := PUT_submission_fixed(request)
  ASSERT result.status = 403
END FOR

FOR ALL request WHERE isBugCondition_C4(request) DO
  sessions := GET_sessions_fixed(request)
  ASSERT FOR ALL s IN sessions:
    EXISTS labGroup WHERE labGroup._id = s.labGroupId
                      AND request.userId IN labGroup.students
END FOR

FOR ALL request WHERE isBugCondition_C5(request, labGroup) DO
  result := GET_labGroup_fixed(request)
  ASSERT result.status = 403
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug conditions do NOT hold, the fixed handlers produce the same result as the original handlers.

**Pseudocode:**
```
FOR ALL request WHERE NOT isBugCondition_C1(request)
                  AND NOT isBugCondition_C2(request)
                  AND NOT isBugCondition_C3(request)
                  AND NOT isBugCondition_C4(request)
                  AND NOT isBugCondition_C5(request, labGroup) DO
  ASSERT handler_original(request) = handler_fixed(request)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across the input domain (role × endpoint × data combinations)
- It catches edge cases that manual unit tests might miss (e.g., student enrolled in zero groups, student enrolled in many groups)
- It provides strong guarantees that behavior is unchanged for all non-buggy inputs

**Test Cases**:
1. **Student reads own submission**: `GET /api/submissions/:id` with student who owns the submission → continues to return 200 with data
2. **Student updates own submission**: `PUT /api/submissions/:id` with owning student → continues to return 200
3. **Student creates submission**: `POST /api/submissions` with student role → continues to return 200
4. **Student gets enrolled sessions**: `GET /api/sessions` with student enrolled in two groups → returns only sessions for those groups
5. **Student reads own lab group**: `GET /api/lab-groups/:id` with student who is a member → continues to return 200
6. **Faculty reads any submission**: `GET /api/submissions/:id` with `lab_faculty` → continues to return 200
7. **Faculty updates any submission**: `PUT /api/submissions/:id` with `lab_faculty` → continues to return 200
8. **Faculty gets all sessions**: `GET /api/sessions` with `lab_faculty` → continues to return all sessions unfiltered
9. **HOD reads lab group**: `GET /api/lab-groups/:id` with `hod` → continues to return 200

### Unit Tests

- Test each fixed handler with every role in the `UserRole` union to verify the role boundary is correct
- Test `GET /api/sessions` with a student enrolled in zero, one, and multiple lab groups
- Test `GET /api/lab-groups/:id` with a student who is and is not a member of the group
- Test that the student ownership check in `GET /api/submissions/:id` still blocks a student from reading another student's submission
- Test that `PUT /api/submissions/:id` still blocks editing an approved submission

### Property-Based Tests

- Generate random role values and verify that only the allowed roles receive 200 from each fixed endpoint
- Generate random sets of lab groups and student enrollments, then verify `GET /api/sessions` returns exactly the sessions for enrolled groups
- Generate random student/lab-group membership combinations and verify `GET /api/lab-groups/:id` returns 403 for non-members and 200 for members
- Verify that for any `lab_faculty`, `hod`, or `principal` caller, `GET /api/sessions` always returns the same result before and after the fix

### Integration Tests

- Full flow: student registers, is added to a lab group, faculty creates a session for that group, student calls `GET /api/sessions` and receives exactly that session
- Full flow: student attempts to read a lab group they are not enrolled in, receives 403, is then added to the group, and successfully reads it
- Full flow: `faculty_coordinator` attempts to create a submission, receives 403; a student creates the same submission successfully
- Regression: existing faculty review flow (faculty reads and updates a submission) continues to work end-to-end after the fix
