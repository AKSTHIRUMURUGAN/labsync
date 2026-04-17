# Bugfix Requirements Document

## Introduction

LabSync has two distinct access-control vulnerabilities that together allow users to view pages and data belonging to other roles. The first is a gap in the frontend middleware: the `roleRoutes` map is incomplete, so `faculty_coordinator`, `hod`, and `principal` users can freely browse route prefixes that are not their own (e.g., `/faculty/*`, `/student/*`). The second is a set of API GET/PUT endpoints that either accept any authenticated user or fail to scope returned data to the requesting user's context, allowing students to see sessions and lab groups they are not enrolled in, and allowing non-student roles to read or modify any submission.

---

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a `faculty_coordinator` user navigates to any `/faculty/*` page THEN the system allows access without redirecting, because `faculty_coordinator` has no `/faculty` entry in `roleRoutes`

1.2 WHEN a `hod` user navigates to any `/faculty/*`, `/coordinator/*`, or `/student/*` page THEN the system allows access without redirecting, because `hod` has no entries for those prefixes in `roleRoutes`

1.3 WHEN a `principal` user navigates to any `/faculty/*`, `/coordinator/*`, or `/student/*` page THEN the system allows access without redirecting, because `principal` has no entries for those prefixes in `roleRoutes`

1.4 WHEN a `student` calls `GET /api/sessions` THEN the system returns all sessions in the database with no filtering by the student's enrolled lab groups

1.5 WHEN a `student` calls `GET /api/lab-groups/:id` for a lab group they are not a member of THEN the system returns the full lab group document without verifying membership

1.6 WHEN any authenticated user (including `faculty_coordinator` or `hod`) calls `GET /api/submissions/:id` THEN the system returns the submission without verifying that the caller is either the owning student or a faculty/hod/principal role

1.7 WHEN any authenticated user calls `PUT /api/submissions/:id` THEN the system allows the update without verifying the caller is either the owning student or a permitted faculty role

1.8 WHEN a non-student authenticated user calls `POST /api/submissions` THEN the system creates a submission on their behalf without enforcing that only students may create submissions

### Expected Behavior (Correct)

2.1 WHEN a `faculty_coordinator` user navigates to any `/faculty/*` page THEN the system SHALL redirect them to their designated dashboard (`/coordinator/dashboard`)

2.2 WHEN a `hod` user navigates to any `/faculty/*`, `/coordinator/*`, or `/student/*` page THEN the system SHALL redirect them to their designated dashboard (`/hod/dashboard`)

2.3 WHEN a `principal` user navigates to any `/faculty/*`, `/coordinator/*`, or `/student/*` page THEN the system SHALL redirect them to their designated dashboard (`/principal/dashboard`)

2.4 WHEN a `student` calls `GET /api/sessions` THEN the system SHALL return only sessions whose `labGroupId` matches a lab group the student is enrolled in

2.5 WHEN a `student` calls `GET /api/lab-groups/:id` for a lab group they are not a member of THEN the system SHALL return a 403 Forbidden response

2.6 WHEN a user calls `GET /api/submissions/:id` and the user's role is not `student`, `lab_faculty`, `hod`, or `principal` THEN the system SHALL return a 403 Forbidden response

2.7 WHEN a `student` calls `GET /api/submissions/:id` for a submission that does not belong to them THEN the system SHALL return a 403 Forbidden response (this behavior already exists and must be preserved)

2.8 WHEN a user calls `PUT /api/submissions/:id` and the user is not the owning student and not a `lab_faculty`, `hod`, or `principal` THEN the system SHALL return a 403 Forbidden response

2.9 WHEN a non-student authenticated user calls `POST /api/submissions` THEN the system SHALL return a 403 Forbidden response

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a `student` navigates to any `/student/*` page THEN the system SHALL CONTINUE TO allow access

3.2 WHEN a `lab_faculty` user navigates to any `/faculty/*` page THEN the system SHALL CONTINUE TO allow access

3.3 WHEN a `faculty_coordinator` user navigates to any `/coordinator/*` page THEN the system SHALL CONTINUE TO allow access

3.4 WHEN a `hod` user navigates to any `/hod/*` page THEN the system SHALL CONTINUE TO allow access

3.5 WHEN a `principal` user navigates to any `/principal/*` page THEN the system SHALL CONTINUE TO allow access

3.6 WHEN a `student` calls `GET /api/sessions` and is enrolled in one or more lab groups THEN the system SHALL CONTINUE TO return sessions for those lab groups

3.7 WHEN a `student` calls `GET /api/lab-groups/:id` for a lab group they are a member of THEN the system SHALL CONTINUE TO return the lab group document

3.8 WHEN a `student` calls `GET /api/submissions/:id` for their own submission THEN the system SHALL CONTINUE TO return the submission

3.9 WHEN a `lab_faculty`, `hod`, or `principal` calls `GET /api/submissions/:id` THEN the system SHALL CONTINUE TO return the submission

3.10 WHEN a `student` calls `PUT /api/submissions/:id` for their own submission THEN the system SHALL CONTINUE TO allow the update

3.11 WHEN a `student` calls `POST /api/submissions` THEN the system SHALL CONTINUE TO allow submission creation

3.12 WHEN a `lab_faculty`, `hod`, or `principal` calls `GET /api/sessions` THEN the system SHALL CONTINUE TO return sessions without additional scoping restrictions

3.13 WHEN a `lab_faculty`, `hod`, or `principal` calls `GET /api/lab-groups/:id` THEN the system SHALL CONTINUE TO return the lab group document

---

## Bug Condition Derivation

### C1 — Middleware Route Gap

```pascal
FUNCTION isBugCondition_C1(role, pathname)
  INPUT: role of type UserRole, pathname of type string
  OUTPUT: boolean

  // A role is accessing a route prefix that is not in its allowed list,
  // but that prefix is also not registered in roleRoutes at all for this role,
  // so the middleware's isRoleRoute check passes without blocking access.
  allowedPrefixes ← roleRoutes[role]   // e.g. ['/coordinator'] for faculty_coordinator
  allRolePrefixes ← UNION of all values in roleRoutes  // ['/student','/faculty','/coordinator','/hod','/principal']

  isRoleSpecificPath ← EXISTS prefix IN allRolePrefixes WHERE pathname.startsWith(prefix)
  hasAccess         ← EXISTS prefix IN allowedPrefixes WHERE pathname.startsWith(prefix)

  RETURN isRoleSpecificPath AND NOT hasAccess
END FUNCTION

// Property: Fix Checking — C1
FOR ALL (role, pathname) WHERE isBugCondition_C1(role, pathname) DO
  response ← middleware'(role, pathname)
  ASSERT response IS redirect TO roleRoutes[role][0] + '/dashboard'
END FOR

// Property: Preservation Checking — C1
FOR ALL (role, pathname) WHERE NOT isBugCondition_C1(role, pathname) DO
  ASSERT middleware(role, pathname) = middleware'(role, pathname)
END FOR
```

### C2 — API Data Scoping Gap

```pascal
FUNCTION isBugCondition_C2_sessions(role)
  INPUT: role of type UserRole
  OUTPUT: boolean
  RETURN role = 'student'
END FUNCTION

// Property: Fix Checking — sessions scoping
FOR ALL request WHERE isBugCondition_C2_sessions(request.role) DO
  sessions ← GET_sessions'(request)
  ASSERT FOR ALL s IN sessions: EXISTS labGroup WHERE labGroup._id = s.labGroupId
                                                  AND request.userId IN labGroup.students
END FOR

FUNCTION isBugCondition_C2_labGroup(role, studentId, labGroupId)
  INPUT: role, studentId, labGroupId
  OUTPUT: boolean
  RETURN role = 'student' AND studentId NOT IN labGroup(labGroupId).students
END FUNCTION

// Property: Fix Checking — lab group membership
FOR ALL request WHERE isBugCondition_C2_labGroup(request.role, request.userId, request.params.id) DO
  response ← GET_labGroup'(request)
  ASSERT response.status = 403
END FOR

FUNCTION isBugCondition_C2_submission_get(role)
  INPUT: role of type UserRole
  OUTPUT: boolean
  RETURN role NOT IN ['student', 'lab_faculty', 'hod', 'principal']
END FUNCTION

// Property: Fix Checking — submission GET role check
FOR ALL request WHERE isBugCondition_C2_submission_get(request.role) DO
  response ← GET_submission'(request)
  ASSERT response.status = 403
END FOR

// Property: Preservation Checking — C2
FOR ALL request WHERE NOT isBugCondition_C2(request) DO
  ASSERT API(request) = API'(request)
END FOR
```
