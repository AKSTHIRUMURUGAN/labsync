# Bugfix Requirements Document

## Introduction

The department selected during signup is not correctly propagating through the LabSync system. This affects every downstream operation: governance checks at registration, lab group scoping, coordinator isolation, faculty submission visibility, and student session visibility. The fix must ensure that a user's `departmentId` (stored as a valid MongoDB ObjectId) is the single source of truth that gates all API responses throughout the user journey — from signup through reporting.

---

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a student or lab_faculty attempts to register for a department THEN the system checks for coordinator and HOD counts against the `users` collection using `departmentId`, but departments were seeded with a default `institutionId` that may not match any real institution, causing the governance guard to pass or fail based on stale seed data rather than the actual departments collection state.

1.2 WHEN a user selects a department from the dropdown during signup THEN the system stores the `departmentId` as an ObjectId on the user record, but the JWT token may not carry `departmentId` if the field is absent or undefined, causing downstream API calls to lose department context.

1.3 WHEN a coordinator calls any coordinator API route (faculty list, student list, lab groups, assignments) THEN the system scopes results by `authResult.departmentId` from the JWT, but if `departmentId` is missing from the token the guard returns a validation error instead of enforcing isolation, and some routes do not re-validate that the requested resource belongs to the coordinator's department.

1.4 WHEN a lab_faculty user calls `GET /api/submissions` THEN the system returns all submissions in the database without filtering by the faculty's assigned lab groups, exposing submissions from other departments and unassigned groups.

1.5 WHEN a student user calls `GET /api/sessions` and has no enrolled lab groups THEN the system returns all active sessions in the database instead of an empty list, exposing sessions from other departments and unrelated groups.

1.6 WHEN a lab_faculty creates a session via `POST /api/sessions` THEN the system verifies the faculty has an active assignment for the given `labGroupId`, but does not verify that the lab group belongs to the faculty's own department, allowing cross-department session creation if a valid assignment exists.

1.7 WHEN a coordinator creates a lab group via `POST /api/lab-groups` THEN the system enforces the coordinator's `departmentId` for the `faculty_coordinator` role, but `lab_faculty` and `hod` roles can supply any `departmentId` in the request body without validation against their own department.

1.8 WHEN a template is created via `POST /api/templates` THEN the system falls back through multiple heuristics (last created group, any group, any template) to resolve `departmentId` when it is not provided, potentially assigning the template to the wrong department.

---

### Expected Behavior (Correct)

2.1 WHEN a student or lab_faculty attempts to register for a department THEN the system SHALL verify that the `departmentId` references an existing, active document in the `departments` collection AND that at least one active `faculty_coordinator` and one active `hod` exist with that same `departmentId` before creating the user.

2.2 WHEN a user completes signup with a valid `departmentId` THEN the system SHALL store `departmentId` as an ObjectId on the user document and SHALL include `departmentId` as a string in the JWT payload so all subsequent authenticated requests carry department context.

2.3 WHEN a coordinator calls any coordinator API route THEN the system SHALL always scope results exclusively to the coordinator's own `departmentId` from the JWT, and SHALL reject any request where `departmentId` is absent from the token with a clear authentication error rather than a validation error.

2.4 WHEN a lab_faculty user calls `GET /api/submissions` THEN the system SHALL return only submissions whose `labSessionId` maps to a session whose `labGroupId` is covered by an active `facultyAssignment` for that faculty member.

2.5 WHEN a student user calls `GET /api/sessions` and has no enrolled lab groups THEN the system SHALL return an empty list rather than all active sessions.

2.6 WHEN a lab_faculty creates a session via `POST /api/sessions` THEN the system SHALL verify that the target `labGroupId` belongs to the faculty's own department (via the `labGroups` collection) in addition to checking the active assignment.

2.7 WHEN any authenticated user (lab_faculty, hod, faculty_coordinator) creates a lab group THEN the system SHALL enforce that the `departmentId` of the new group matches the authenticated user's own `departmentId` from the JWT, ignoring any `departmentId` supplied in the request body that differs.

2.8 WHEN a template is created via `POST /api/templates` THEN the system SHALL use the authenticated user's `departmentId` from the JWT as the authoritative department for the template, and SHALL reject the request with a validation error if `departmentId` is absent from the token rather than falling back to heuristics.

---

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a principal registers THEN the system SHALL CONTINUE TO allow registration without a `departmentId` and SHALL CONTINUE TO grant access to all departments' data.

3.2 WHEN a coordinator, HOD, or principal registers THEN the system SHALL CONTINUE TO allow registration without the governance guard (coordinator/HOD pre-existence check) that applies only to student and lab_faculty roles.

3.3 WHEN a student calls `GET /api/sessions` and IS enrolled in one or more lab groups THEN the system SHALL CONTINUE TO return only sessions for those enrolled groups.

3.4 WHEN a student calls `GET /api/submissions` THEN the system SHALL CONTINUE TO return only that student's own submissions.

3.5 WHEN a principal calls any coordinator or admin API route THEN the system SHALL CONTINUE TO return data across all departments without department scoping.

3.6 WHEN a lab_faculty creates a session for a lab group they are actively assigned to THEN the system SHALL CONTINUE TO allow session creation.

3.7 WHEN `GET /api/departments` is called without authentication THEN the system SHALL CONTINUE TO return the list of active departments so the signup page can populate the dropdown.

3.8 WHEN a template is shared to other departments via `visibleToDepartmentIds` THEN the system SHALL CONTINUE TO make that template visible to users in those departments.

3.9 WHEN a coordinator creates a lab group for their own department THEN the system SHALL CONTINUE TO allow creation and SHALL CONTINUE TO associate the group with the coordinator's department.

3.10 WHEN a faculty_coordinator calls `GET /api/lab-groups` THEN the system SHALL CONTINUE TO return only lab groups belonging to their own department.

---

## Bug Condition Pseudocode

### Bug Condition Functions

```pascal
FUNCTION isBugCondition_GovernanceGuard(X)
  INPUT: X = { role, departmentId }
  OUTPUT: boolean
  RETURN X.role IN ['student', 'lab_faculty']
         AND X.departmentId IS NOT NULL
         AND department document for X.departmentId does NOT exist in departments collection
         // i.e., guard queries users collection only, not departments collection
END FUNCTION

FUNCTION isBugCondition_MissingDeptInToken(X)
  INPUT: X = { user record after registration }
  OUTPUT: boolean
  RETURN X.departmentId IS NULL OR X.departmentId IS UNDEFINED
         AND X.role != 'principal'
END FUNCTION

FUNCTION isBugCondition_FacultySubmissionLeak(X)
  INPUT: X = { requestingUserId, requestingUserRole }
  OUTPUT: boolean
  RETURN X.requestingUserRole = 'lab_faculty'
END FUNCTION

FUNCTION isBugCondition_StudentSessionLeak(X)
  INPUT: X = { studentId, enrolledGroupIds }
  OUTPUT: boolean
  RETURN X.enrolledGroupIds IS EMPTY
END FUNCTION
```

### Fix Checking Properties

```pascal
// Property: Governance guard queries departments collection
FOR ALL X WHERE isBugCondition_GovernanceGuard(X) DO
  result ← register'(X)
  ASSERT result.error CONTAINS 'Department governance is incomplete'
         OR result.error CONTAINS 'Invalid department'
END FOR

// Property: departmentId always present in JWT for non-principal users
FOR ALL X WHERE isBugCondition_MissingDeptInToken(X) DO
  result ← register'(X)
  ASSERT result.token.departmentId IS NOT NULL
END FOR

// Property: Faculty sees only their assigned group submissions
FOR ALL X WHERE isBugCondition_FacultySubmissionLeak(X) DO
  result ← getSubmissions'(X)
  ASSERT ALL submissions IN result HAVE labGroupId IN facultyAssignedGroupIds(X.requestingUserId)
END FOR

// Property: Student with no enrollments sees no sessions
FOR ALL X WHERE isBugCondition_StudentSessionLeak(X) DO
  result ← getSessions'(X)
  ASSERT result.data IS EMPTY
END FOR
```

### Preservation Checking

```pascal
// Property: Preservation Checking
FOR ALL X WHERE NOT isBugCondition_GovernanceGuard(X)
             AND NOT isBugCondition_MissingDeptInToken(X)
             AND NOT isBugCondition_FacultySubmissionLeak(X)
             AND NOT isBugCondition_StudentSessionLeak(X) DO
  ASSERT F(X) = F'(X)
END FOR
```
