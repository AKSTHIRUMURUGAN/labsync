# Implementation Plan

- [ ] 1. Write bug condition exploration tests
  - **Property 1: Bug Condition** - Unauthorized Role Access to Submissions and Unscoped Data
  - **CRITICAL**: Write these tests BEFORE implementing any fix — failure confirms each bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **GOAL**: Surface counterexamples that demonstrate each of the five bugs
  - **Scoped PBT Approach**: Scope each property to the concrete failing role/endpoint pair to ensure reproducibility
  - Test C1 — `POST /api/submissions` with role `lab_faculty`: assert response status is 403 (from `isBugCondition_C1` in design)
  - Test C2 — `GET /api/submissions/:id` with role `faculty_coordinator`: assert response status is 403 (from `isBugCondition_C2` in design)
  - Test C3 — `PUT /api/submissions/:id` with role `faculty_coordinator`: assert response status is 403 (from `isBugCondition_C3` in design)
  - Test C4 — `GET /api/sessions` with role `student` not enrolled in any lab group: assert response returns empty array, not all sessions (from `isBugCondition_C4` in design)
  - Test C5 — `GET /api/lab-groups/:id` with role `student` not in the group: assert response status is 403 (from `isBugCondition_C5` in design)
  - Run all tests on UNFIXED code
  - **EXPECTED OUTCOME**: All five tests FAIL (this is correct — it proves each bug exists)
  - Document counterexamples found (e.g., "`POST /api/submissions` with `lab_faculty` returns 200 and creates a document")
  - Mark task complete when tests are written, run, and failures are documented
  - _Requirements: 1.4, 1.5, 1.6, 1.7, 1.8_

- [ ] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Authorized Access Patterns Unchanged
  - **IMPORTANT**: Follow observation-first methodology — run UNFIXED code with authorized inputs and record actual outputs
  - Observe: `GET /api/sessions` with `lab_faculty` returns all sessions unfiltered on unfixed code
  - Observe: `GET /api/sessions` with `student` enrolled in two groups returns sessions for those groups on unfixed code
  - Observe: `GET /api/lab-groups/:id` with `student` who is a member returns the document on unfixed code
  - Observe: `GET /api/submissions/:id` with `lab_faculty` returns the submission on unfixed code
  - Observe: `PUT /api/submissions/:id` with owning `student` returns 200 on unfixed code
  - Observe: `POST /api/submissions` with `student` role returns 200 on unfixed code
  - Write property-based tests capturing these observed behaviors (from Preservation Requirements in design):
    - For all roles in `['lab_faculty', 'hod', 'principal']`: `GET /api/sessions` returns all sessions (no scoping)
    - For all roles in `['lab_faculty', 'hod', 'principal']`: `GET /api/lab-groups/:id` returns the document
    - For all roles in `['student', 'lab_faculty', 'hod', 'principal']`: `GET /api/submissions/:id` for an owned/any submission returns 200
    - For `student` enrolled in N lab groups (N ≥ 1): `GET /api/sessions` returns exactly the sessions for those N groups
    - For `student` who is a member of a lab group: `GET /api/lab-groups/:id` returns the document
    - For owning `student`: `PUT /api/submissions/:id` returns 200
    - For `student`: `POST /api/submissions` returns 200
  - Verify all preservation tests PASS on UNFIXED code
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10, 3.11, 3.12, 3.13_

- [-] 3. Fix role-based access control across five API endpoints

  - [x] 3.1 Fix `POST /api/submissions` — restrict to student role only
    - In `app/api/submissions/route.ts`, replace `requireAuth` with `requireRole(request, ['student'])` in the `POST` handler
    - Update the import: replace `requireAuth` import with `requireRole` (keep `requireAuth` only if still used by the `GET` handler in the same file)
    - _Bug_Condition: `isBugCondition_C1(request)` — `request.role NOT IN ['student']` AND method is `POST /api/submissions`_
    - _Expected_Behavior: handler returns 403 Forbidden and does NOT create a submission document_
    - _Preservation: `student` calling `POST /api/submissions` continues to succeed (Requirement 3.11)_
    - _Requirements: 1.8, 2.9, 3.11_

  - [ ] 3.2 Fix `GET /api/submissions/:id` — restrict to permitted roles
    - In `app/api/submissions/[id]/route.ts`, replace `requireAuth` with `requireRole(request, ['student', 'lab_faculty', 'hod', 'principal'])` in the `GET` handler
    - Preserve the existing student ownership check (`submission.studentId.toString() !== authResult.userId`) — do NOT remove it
    - _Bug_Condition: `isBugCondition_C2(request)` — `request.role NOT IN ['student', 'lab_faculty', 'hod', 'principal']` AND method is `GET /api/submissions/:id`_
    - _Expected_Behavior: handler returns 403 Forbidden for disallowed roles_
    - _Preservation: `student` reading own submission, `lab_faculty`/`hod`/`principal` reading any submission all continue to return 200 (Requirements 3.8, 3.9)_
    - _Requirements: 1.6, 2.6, 2.7, 3.8, 3.9_

  - [ ] 3.3 Fix `PUT /api/submissions/:id` — restrict to permitted roles
    - In `app/api/submissions/[id]/route.ts`, replace `requireAuth` with `requireRole(request, ['student', 'lab_faculty', 'hod', 'principal'])` in the `PUT` handler
    - Preserve the existing student ownership check and the approved-submission guard — do NOT remove them
    - After fixing both `GET` and `PUT` in this file, remove the `requireAuth` import and ensure `requireRole` is imported from `@/lib/middleware/auth-middleware`
    - _Bug_Condition: `isBugCondition_C3(request)` — `request.role NOT IN ['student', 'lab_faculty', 'hod', 'principal']` AND method is `PUT /api/submissions/:id`_
    - _Expected_Behavior: handler returns 403 Forbidden for disallowed roles and does NOT modify the submission document_
    - _Preservation: owning `student` and `lab_faculty`/`hod`/`principal` updating a submission continue to return 200 (Requirements 3.10)_
    - _Requirements: 1.7, 2.8, 3.10_

  - [ ] 3.4 Fix `GET /api/sessions` — scope results to enrolled lab groups for students
    - In `app/api/sessions/route.ts`, after the existing `labGroupId` query block and before `const skip = ...`, add a student-scoping block:
      ```typescript
      if (authResult.role === 'student') {
        const studentLabGroups = await db
          .collection('labGroups')
          .find({ students: new ObjectId(authResult.userId) })
          .project({ _id: 1 })
          .toArray();
        const labGroupIds = studentLabGroups.map((g) => g._id);
        if (query.labGroupId) {
          const isEnrolled = labGroupIds.some(
            (id) => id.toString() === query.labGroupId.toString()
          );
          if (!isEnrolled) {
            return successResponse([], { page, limit, total: 0 });
          }
        } else {
          query.labGroupId = { $in: labGroupIds };
        }
      }
      ```
    - _Bug_Condition: `isBugCondition_C4(request)` — `request.role = 'student'` AND method is `GET /api/sessions`_
    - _Expected_Behavior: response contains only sessions whose `labGroupId` is in the student's enrolled lab groups_
    - _Preservation: `lab_faculty`/`hod`/`principal` continue to receive all sessions unfiltered; `student` enrolled in groups continues to receive sessions for those groups (Requirements 3.6, 3.12)_
    - _Requirements: 1.4, 2.4, 3.6, 3.12_

  - [ ] 3.5 Fix `GET /api/lab-groups/:id` — enforce student membership check
    - In `app/api/lab-groups/[id]/route.ts`, after the `if (!labGroup)` not-found check and before `return successResponse(labGroup)`, add a membership check:
      ```typescript
      if (authResult.role === 'student') {
        const isMember = labGroup.students.some(
          (s: ObjectId) => s.toString() === authResult.userId
        );
        if (!isMember) {
          return forbiddenError('You are not a member of this lab group');
        }
      }
      ```
    - Ensure `forbiddenError` is imported from `@/lib/api-response` (it is already imported in this file)
    - _Bug_Condition: `isBugCondition_C5(request, labGroup)` — `request.role = 'student'` AND `request.userId NOT IN labGroup.students` AND method is `GET /api/lab-groups/:id`_
    - _Expected_Behavior: handler returns 403 Forbidden when student is not a member_
    - _Preservation: `student` who is a member continues to receive the document; `lab_faculty`/`hod`/`principal` continue to receive the document (Requirements 3.7, 3.13)_
    - _Requirements: 1.5, 2.5, 3.7, 3.13_

  - [ ] 3.6 Verify bug condition exploration tests now pass
    - **Property 1: Expected Behavior** - Unauthorized Role Access Correctly Blocked
    - **IMPORTANT**: Re-run the SAME tests from task 1 — do NOT write new tests
    - The tests from task 1 encode the expected behavior for all five bug conditions
    - When these tests pass, it confirms the expected behavior is satisfied for C1–C5
    - Run all five bug condition exploration tests from step 1
    - **EXPECTED OUTCOME**: All five tests PASS (confirms all five bugs are fixed)
    - _Requirements: 2.4, 2.5, 2.6, 2.8, 2.9_

  - [ ] 3.7 Verify preservation tests still pass
    - **Property 2: Preservation** - Authorized Access Patterns Unchanged
    - **IMPORTANT**: Re-run the SAME tests from task 2 — do NOT write new tests
    - Run all preservation property tests from step 2
    - **EXPECTED OUTCOME**: All preservation tests PASS (confirms no regressions)
    - Confirm all authorized access patterns are unaffected by the five fixes
    - _Requirements: 3.1–3.13_

- [ ] 4. Checkpoint — Ensure all tests pass
  - Run the full test suite and confirm all tests pass
  - Verify no TypeScript compilation errors in the five modified files
  - Ensure all tests pass; ask the user if questions arise
