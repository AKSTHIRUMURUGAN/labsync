# Requirements Document

## Introduction

The Digital Lab Manual System is a SaaS platform designed to replace traditional paper-based lab manuals in engineering and science colleges. The system ensures authentic, real-time lab work submission with faculty verification, eliminating issues such as copied lab records, mass-produced manuals, paper waste, and inability to verify authenticity. The platform provides structured digital workflows for students to submit lab work with proof, faculty to verify submissions in real-time, and administrators to monitor academic compliance.

## Glossary

- **System**: The Digital Lab Manual System platform
- **Student**: A user enrolled in a course who performs lab experiments and submits lab work
- **Lab_Faculty**: A faculty member who conducts lab sessions and verifies student submissions
- **Faculty_Coordinator**: A faculty member who creates standardized experiment templates and defines observation formats
- **HOD**: Head of Department who monitors lab activities and faculty performance
- **Principal**: Administrative head with full system access and department-wide reporting capabilities
- **Experiment_Template**: A standardized format defining the structure, steps, and required fields for a lab experiment
- **Lab_Session**: A time-bound period during which students can submit lab work for specific experiments
- **Lab_Group**: A collection of students organized by class and semester for lab activities
- **Submission**: A student's completed lab work including observations, calculations, results, and proof images
- **Observation_Table**: A structured data entry format for recording experimental measurements and data
- **Proof_Image**: A photograph uploaded by students showing physical evidence of experiment execution
- **Approval_Workflow**: The process of submission review, verification, and approval or rejection by faculty
- **Manual_Record**: The final approved digital lab record stored in the system
- **Auth_Token**: A JWT token stored in HTTP-only cookies for user authentication
- **Image_Storage**: Cloudinary service for storing proof images
- **File_Storage**: Cloudflare R2 service for storing PDF files and documents
- **PDF_Generator**: Component that converts approved submissions into printable PDF format

## Requirements

### Requirement 1: User Authentication and Authorization

**User Story:** As a system user, I want to securely log in with role-based access, so that I can access features appropriate to my role and protect sensitive academic data.

#### Acceptance Criteria

1. WHEN a user submits valid credentials, THE System SHALL generate an Auth_Token and store it in an HTTP-only cookie
2. WHEN a user submits invalid credentials, THE System SHALL reject the login attempt and return an error message within 2 seconds
3. WHEN an Auth_Token expires, THE System SHALL require re-authentication before allowing further actions
4. THE System SHALL enforce role-based access control for all protected routes and API endpoints
5. WHEN a user logs out, THE System SHALL invalidate the Auth_Token and clear the authentication cookie
6. THE System SHALL use JWT tokens with a maximum validity period of 24 hours

### Requirement 2: Experiment Template Management

**User Story:** As a Faculty_Coordinator, I want to create standardized experiment templates, so that all lab sessions follow a uniform structure and students submit consistent data.

#### Acceptance Criteria

1. THE Faculty_Coordinator SHALL create Experiment_Templates with title, description, and objectives
2. WHEN creating an Experiment_Template, THE Faculty_Coordinator SHALL define at least one Observation_Table structure with column names and data types
3. THE Faculty_Coordinator SHALL specify required experiment steps in sequential order within each Experiment_Template
4. THE Faculty_Coordinator SHALL define required fields that students must complete before submission
5. WHEN an Experiment_Template is saved, THE System SHALL validate that all required metadata fields are present
6. THE System SHALL store Experiment_Templates in the database with unique identifiers
7. THE Faculty_Coordinator SHALL mark Observation_Table fields as required or optional
8. WHERE calculation formulas are needed, THE Faculty_Coordinator SHALL define calculation rules within the Experiment_Template



### Requirement 3: Lab Group and Session Management

**User Story:** As a Lab_Faculty, I want to create lab groups and control lab sessions, so that I can organize students and ensure submissions occur only during actual lab time.

#### Acceptance Criteria

1. THE Lab_Faculty SHALL create Lab_Groups with class name, semester, and academic year
2. WHEN creating a Lab_Group, THE Lab_Faculty SHALL assign students to the Lab_Group from the student database
3. THE Lab_Faculty SHALL associate one or more Experiment_Templates with each Lab_Group
4. WHEN starting a Lab_Session, THE Lab_Faculty SHALL specify the Lab_Group, Experiment_Template, and session duration
5. WHEN a Lab_Session is started, THE System SHALL record the start timestamp and enable submission access for assigned students
6. WHEN a Lab_Session is stopped, THE System SHALL record the end timestamp and disable new submissions for that session
7. WHILE a Lab_Session is not active, THE System SHALL prevent students from creating or submitting lab work for that experiment
8. THE System SHALL allow only one active Lab_Session per Lab_Group and Experiment_Template combination at any time
9. WHEN a Lab_Session ends, THE System SHALL automatically mark all unsubmitted work as incomplete

### Requirement 4: Student Lab Work Submission

**User Story:** As a Student, I want to enter observations and submit lab work with proof during active lab sessions, so that I can complete my lab requirements authentically and receive faculty approval.

#### Acceptance Criteria

1. WHEN a Lab_Session is active, THE System SHALL display available experiments to assigned students
2. THE Student SHALL enter data into Observation_Tables according to the structure defined in the Experiment_Template
3. WHEN entering observation data, THE System SHALL validate data types match the Observation_Table column definitions
4. THE Student SHALL upload at least one Proof_Image showing physical evidence of experiment execution
5. WHEN uploading a Proof_Image, THE System SHALL store the image in Image_Storage and associate it with the Submission
6. THE System SHALL enforce a maximum Proof_Image file size of 10 megabytes per image
7. THE Student SHALL complete all required fields marked in the Experiment_Template before submission
8. WHERE calculation fields are defined, THE Student SHALL enter calculated values based on observation data
9. WHEN a Student submits lab work, THE System SHALL record the submission timestamp and change status to "Pending Review"
10. IF a Student attempts to submit without completing required fields, THEN THE System SHALL display validation errors and prevent submission
11. WHILE a Lab_Session is active, THE Student SHALL save work in progress without submitting for final review
12. THE System SHALL support uploading multiple Proof_Images up to a maximum of 10 images per Submission

### Requirement 5: Faculty Verification and Approval Workflow

**User Story:** As a Lab_Faculty, I want to review and approve student submissions, so that I can verify authentic lab work and provide feedback for corrections.

#### Acceptance Criteria

1. WHEN a Submission status is "Pending Review", THE System SHALL display it in the Lab_Faculty review queue
2. THE Lab_Faculty SHALL view all Submission details including Observation_Tables, calculations, results, and Proof_Images
3. THE Lab_Faculty SHALL approve a Submission by changing its status to "Approved"
4. THE Lab_Faculty SHALL reject a Submission by changing its status to "Rejected" and providing written feedback
5. WHEN a Submission is rejected, THE System SHALL notify the Student and allow resubmission during the next Lab_Session
6. WHEN a Submission is approved, THE System SHALL mark it as a final Manual_Record and prevent further modifications
7. THE System SHALL record the Lab_Faculty identifier and timestamp for all approval and rejection actions
8. THE Lab_Faculty SHALL add optional comments to approved submissions for student learning feedback
9. THE System SHALL display submission statistics showing pending, approved, and rejected counts per Lab_Session



### Requirement 6: Anti-Copy and Authenticity Mechanisms

**User Story:** As a Lab_Faculty, I want the system to track submission patterns and prevent copying, so that I can ensure each student performs genuine lab work.

#### Acceptance Criteria

1. THE System SHALL record unique submission timestamps for each Student within a Lab_Session
2. THE System SHALL track the time duration between Lab_Session start and each Submission
3. WHEN multiple students submit identical Observation_Table data, THE System SHALL flag these submissions for faculty review
4. THE System SHALL require unique Proof_Images for each Submission (no duplicate image hashes)
5. IF a Student uploads a Proof_Image that matches an existing image hash in the same Lab_Session, THEN THE System SHALL reject the upload and display a warning
6. THE System SHALL store submission edit history showing all modifications made before final submission
7. THE System SHALL display submission time analytics to Lab_Faculty showing submission patterns across students
8. WHERE suspicious patterns are detected, THE System SHALL highlight submissions for detailed faculty review

### Requirement 7: PDF Generation and Print Functionality

**User Story:** As a Student, I want to generate a PDF of my approved lab work, so that I can maintain a printable record for official documentation.

#### Acceptance Criteria

1. WHEN a Submission is approved, THE System SHALL enable PDF generation for that Manual_Record
2. THE PDF_Generator SHALL format the Manual_Record with experiment title, student details, observation data, calculations, results, and embedded Proof_Images
3. THE PDF_Generator SHALL apply professional formatting with consistent typography, spacing, and layout
4. WHEN generating a PDF, THE System SHALL include faculty approval details with Lab_Faculty name and approval timestamp
5. THE System SHALL store generated PDFs in File_Storage with unique identifiers
6. THE Student SHALL download generated PDFs through a secure authenticated endpoint
7. THE System SHALL include a verification QR code in each PDF linking to the online Manual_Record for authenticity verification
8. THE PDF_Generator SHALL compress Proof_Images to ensure PDF file size remains under 20 megabytes

### Requirement 8: HOD Monitoring and Analytics Dashboard

**User Story:** As an HOD, I want to monitor lab activities and faculty performance, so that I can ensure academic quality and identify areas needing attention.

#### Acceptance Criteria

1. THE HOD SHALL view department-wide lab activity statistics including total Lab_Sessions, Submissions, and approval rates
2. THE System SHALL display Lab_Faculty performance metrics showing average review time and approval rates per faculty member
3. THE HOD SHALL filter analytics by Lab_Group, semester, and date range
4. THE System SHALL generate visual charts showing submission trends over time
5. THE HOD SHALL view lists of students with incomplete or rejected submissions
6. THE System SHALL calculate and display average submission times per experiment across all Lab_Groups
7. WHERE submission rates fall below 80 percent for any Lab_Group, THE System SHALL highlight this in the HOD dashboard
8. THE HOD SHALL export analytics reports as CSV files for external analysis

### Requirement 9: Principal System Oversight and Reporting

**User Story:** As a Principal, I want full system access and department-wide reports, so that I can monitor institutional academic compliance and system usage.

#### Acceptance Criteria

1. THE Principal SHALL access all features available to HOD, Lab_Faculty, and Faculty_Coordinator roles
2. THE System SHALL display department-wise comparison reports showing lab activity across all departments
3. THE Principal SHALL view system-wide usage statistics including total users, active Lab_Sessions, and storage utilization
4. THE System SHALL generate monthly summary reports showing submission counts, approval rates, and faculty engagement
5. THE Principal SHALL filter reports by department, semester, and academic year
6. THE System SHALL display compliance metrics showing percentage of completed lab requirements per department
7. THE Principal SHALL export comprehensive reports in PDF format for institutional records



### Requirement 10: Image Storage and Management

**User Story:** As a Student, I want to upload experiment proof images reliably, so that I can provide visual evidence of my lab work without technical issues.

#### Acceptance Criteria

1. WHEN a Student uploads a Proof_Image, THE System SHALL validate the file format is JPEG, PNG, or WebP
2. THE System SHALL store uploaded Proof_Images in Image_Storage with unique identifiers
3. WHEN storing a Proof_Image, THE System SHALL generate a secure URL for retrieval
4. THE System SHALL compress Proof_Images to optimize storage while maintaining visual clarity
5. IF an image upload fails, THEN THE System SHALL retry the upload up to 3 times before displaying an error
6. THE System SHALL associate each Proof_Image with the corresponding Submission identifier in the database
7. WHEN a Submission is deleted, THE System SHALL remove associated Proof_Images from Image_Storage
8. THE System SHALL serve Proof_Images through authenticated endpoints requiring valid Auth_Tokens
9. THE System SHALL implement image lazy loading to optimize page performance when displaying multiple Proof_Images

### Requirement 11: File Storage for PDF Documents

**User Story:** As the System, I want to store generated PDFs reliably, so that users can access their lab records at any time.

#### Acceptance Criteria

1. WHEN a PDF is generated, THE System SHALL store it in File_Storage with a unique identifier
2. THE System SHALL generate a secure download URL for each stored PDF with a validity period of 1 hour
3. WHEN a download URL expires, THE System SHALL generate a new URL upon user request
4. THE System SHALL associate each PDF file with the corresponding Manual_Record identifier in the database
5. THE System SHALL implement access control ensuring only the Student and authorized faculty can download a specific PDF
6. WHERE storage quota is exceeded, THE System SHALL archive PDFs older than 2 years to cold storage
7. THE System SHALL maintain PDF availability for a minimum of 5 years for academic record compliance

### Requirement 12: Responsive User Interface

**User Story:** As a system user, I want a professional and responsive interface, so that I can access the system efficiently from any device.

#### Acceptance Criteria

1. THE System SHALL render all user interfaces using responsive design supporting desktop, tablet, and mobile viewports
2. THE System SHALL implement the shadcn/ui component library for consistent UI elements
3. WHEN a user interacts with UI elements, THE System SHALL provide visual feedback within 100 milliseconds
4. THE System SHALL apply professional animations for page transitions and component state changes
5. THE System SHALL use color psychology principles with distinct colors for different user roles and action states
6. THE System SHALL maintain WCAG 2.1 Level AA accessibility standards for all interactive elements
7. THE System SHALL display loading indicators for operations taking longer than 500 milliseconds
8. WHERE forms contain validation errors, THE System SHALL highlight error fields with clear error messages
9. THE System SHALL implement keyboard navigation support for all interactive features

### Requirement 13: Database Schema and Data Persistence

**User Story:** As the System, I want to persist all data reliably in MongoDB, so that academic records are maintained with integrity and availability.

#### Acceptance Criteria

1. THE System SHALL store user accounts with hashed passwords using bcrypt with a minimum cost factor of 12
2. THE System SHALL maintain referential integrity between Lab_Groups, Experiment_Templates, and Submissions using document references
3. WHEN data is written to the database, THE System SHALL use transactions to ensure atomicity for related operations
4. THE System SHALL implement database indexes on frequently queried fields including user identifiers, Lab_Session timestamps, and Submission status
5. THE System SHALL backup database contents daily to prevent data loss
6. THE System SHALL validate all data against defined schemas before persisting to the database
7. WHERE database operations fail, THE System SHALL log errors and return appropriate error responses to users
8. THE System SHALL implement soft deletion for Submissions and Lab_Groups to maintain audit trails



### Requirement 14: API Route Implementation

**User Story:** As a frontend developer, I want well-defined API endpoints, so that I can integrate backend functionality with the user interface.

#### Acceptance Criteria

1. THE System SHALL implement RESTful API routes under the /app/api directory following Next.js App Router conventions
2. WHEN an API request is received, THE System SHALL validate the Auth_Token before processing protected endpoints
3. THE System SHALL return appropriate HTTP status codes for all API responses (200 for success, 400 for validation errors, 401 for unauthorized, 500 for server errors)
4. THE System SHALL implement rate limiting of 100 requests per minute per user to prevent abuse
5. WHEN API validation fails, THE System SHALL return structured error responses with field-level error details
6. THE System SHALL log all API requests with timestamp, user identifier, endpoint, and response status
7. THE System SHALL implement CORS policies restricting API access to authorized domains
8. WHERE file uploads are processed, THE System SHALL validate file size and type before accepting the upload

### Requirement 15: Real-Time Notifications

**User Story:** As a Student, I want to receive notifications about submission status changes, so that I can respond promptly to faculty feedback.

#### Acceptance Criteria

1. WHEN a Submission is approved or rejected, THE System SHALL create a notification for the Student
2. THE System SHALL display unread notifications in the user interface with a visual indicator
3. THE Student SHALL view notification history showing all past notifications with timestamps
4. WHEN a Lab_Session is started, THE System SHALL notify all students in the assigned Lab_Group
5. THE System SHALL mark notifications as read when the Student views them
6. WHERE a Lab_Session is ending within 15 minutes, THE System SHALL send a warning notification to students with unsubmitted work
7. THE System SHALL store notifications in the database with user identifier, message content, timestamp, and read status
8. THE System SHALL automatically delete notifications older than 90 days to manage storage

### Requirement 16: Search and Filter Functionality

**User Story:** As a Lab_Faculty, I want to search and filter submissions, so that I can efficiently review specific experiments or student work.

#### Acceptance Criteria

1. THE Lab_Faculty SHALL search Submissions by student name, experiment title, or submission date
2. THE System SHALL filter Submissions by status (Pending Review, Approved, Rejected)
3. THE Lab_Faculty SHALL filter Submissions by Lab_Group and date range
4. WHEN search criteria are applied, THE System SHALL return results within 2 seconds
5. THE System SHALL display search results with pagination showing 20 items per page
6. THE Lab_Faculty SHALL sort search results by submission date, student name, or approval status
7. WHERE no results match the search criteria, THE System SHALL display a clear "no results found" message
8. THE System SHALL persist filter preferences in the user session for convenience

### Requirement 17: Student Dashboard and Progress Tracking

**User Story:** As a Student, I want to view my lab progress and submission history, so that I can track my academic performance and identify pending work.

#### Acceptance Criteria

1. THE System SHALL display a dashboard showing all assigned experiments with completion status
2. THE Student SHALL view submission history with status, submission date, and faculty feedback for each experiment
3. THE System SHALL calculate and display overall lab completion percentage for the current semester
4. WHERE submissions are rejected, THE System SHALL highlight these prominently with faculty comments
5. THE Student SHALL access detailed views of approved submissions including all observation data and Proof_Images
6. THE System SHALL display upcoming Lab_Sessions with experiment titles and scheduled times
7. THE System SHALL show statistics including total experiments, completed count, pending count, and rejected count
8. WHEN a Student has pending corrections, THE System SHALL display these at the top of the dashboard



### Requirement 18: Data Validation and Input Sanitization

**User Story:** As the System, I want to validate and sanitize all user inputs, so that I can prevent security vulnerabilities and maintain data integrity.

#### Acceptance Criteria

1. THE System SHALL validate all form inputs against defined schemas before processing
2. WHEN text input is received, THE System SHALL sanitize HTML and script tags to prevent XSS attacks
3. THE System SHALL enforce maximum length constraints on all text fields (255 characters for titles, 5000 characters for descriptions)
4. THE System SHALL validate email addresses using RFC 5322 compliant regex patterns
5. WHERE numeric input is expected, THE System SHALL reject non-numeric values and display validation errors
6. THE System SHALL validate date inputs ensuring they fall within acceptable ranges
7. IF SQL-like patterns are detected in user input, THEN THE System SHALL reject the input and log a security warning
8. THE System SHALL validate file uploads checking MIME types match file extensions
9. THE System SHALL implement server-side validation for all data even when client-side validation exists

### Requirement 19: Error Handling and Logging

**User Story:** As a system administrator, I want comprehensive error logging, so that I can troubleshoot issues and maintain system reliability.

#### Acceptance Criteria

1. WHEN an error occurs, THE System SHALL log the error with timestamp, user identifier, error message, and stack trace
2. THE System SHALL categorize errors by severity (Info, Warning, Error, Critical)
3. WHERE critical errors occur, THE System SHALL send alerts to system administrators
4. THE System SHALL display user-friendly error messages without exposing sensitive system details
5. THE System SHALL log all authentication attempts including successful and failed logins
6. THE System SHALL implement structured logging with consistent format for automated analysis
7. WHERE database operations fail, THE System SHALL log the query details and error response
8. THE System SHALL rotate log files daily and retain logs for a minimum of 90 days
9. THE System SHALL provide a log viewer interface for administrators to search and filter logs

### Requirement 20: Session Management

**User Story:** As a system user, I want secure session management, so that my account remains protected while I work in the system.

#### Acceptance Criteria

1. WHEN a user logs in, THE System SHALL create a session with a unique session identifier
2. THE System SHALL store session data in HTTP-only cookies to prevent client-side access
3. THE System SHALL set session timeout to 24 hours of inactivity
4. WHEN a session expires, THE System SHALL redirect the user to the login page
5. THE System SHALL allow only one active session per user account at any time
6. WHERE a user logs in from a new device, THE System SHALL invalidate previous sessions
7. THE System SHALL refresh session expiration time on each authenticated request
8. THE System SHALL implement CSRF protection for all state-changing operations
9. WHEN a user changes their password, THE System SHALL invalidate all existing sessions and require re-authentication

### Requirement 21: Experiment Template Versioning

**User Story:** As a Faculty_Coordinator, I want to version experiment templates, so that I can update templates without affecting ongoing lab sessions.

#### Acceptance Criteria

1. WHEN an Experiment_Template is modified, THE System SHALL create a new version while preserving the previous version
2. THE System SHALL associate each Lab_Session with a specific Experiment_Template version
3. THE Faculty_Coordinator SHALL view version history showing all changes with timestamps and author information
4. WHERE an Experiment_Template is updated, THE System SHALL apply changes only to new Lab_Sessions
5. THE System SHALL allow Faculty_Coordinator to revert to previous Experiment_Template versions
6. THE System SHALL display version numbers using semantic versioning (major.minor.patch)
7. WHEN comparing versions, THE System SHALL highlight differences in template structure and fields
8. THE System SHALL prevent deletion of Experiment_Template versions that are associated with existing Submissions



### Requirement 22: Bulk Operations for Faculty

**User Story:** As a Lab_Faculty, I want to perform bulk operations on submissions, so that I can efficiently manage large numbers of student submissions.

#### Acceptance Criteria

1. THE Lab_Faculty SHALL select multiple Submissions using checkboxes in the review interface
2. THE Lab_Faculty SHALL approve multiple selected Submissions simultaneously with a single action
3. THE Lab_Faculty SHALL add the same comment to multiple selected Submissions in bulk
4. WHEN bulk operations are performed, THE System SHALL process each Submission individually and report success or failure for each
5. WHERE some Submissions in a bulk operation fail, THE System SHALL complete successful operations and report which items failed
6. THE Lab_Faculty SHALL export selected Submissions as a combined PDF report
7. THE System SHALL limit bulk operations to a maximum of 50 Submissions per action to prevent performance issues
8. THE System SHALL display a progress indicator during bulk operation processing

### Requirement 23: Observation Table Data Validation

**User Story:** As a Student, I want clear validation feedback on observation data, so that I can correct errors before submission.

#### Acceptance Criteria

1. WHEN a Student enters data in an Observation_Table, THE System SHALL validate the data type matches the column definition
2. WHERE numeric ranges are defined for a column, THE System SHALL reject values outside the specified range
3. THE System SHALL validate required columns contain non-empty values before allowing submission
4. IF a calculation field depends on other columns, THEN THE System SHALL validate the calculation formula produces a valid result
5. THE System SHALL display inline validation errors immediately after data entry without requiring form submission
6. WHERE units are specified for numeric columns, THE System SHALL display the unit label adjacent to the input field
7. THE System SHALL support decimal precision validation ensuring values match the specified decimal places
8. THE System SHALL validate date and time values in Observation_Tables are in ISO 8601 format

### Requirement 24: Faculty Performance Analytics

**User Story:** As an HOD, I want detailed faculty performance metrics, so that I can evaluate teaching effectiveness and workload distribution.

#### Acceptance Criteria

1. THE System SHALL calculate average review time per Lab_Faculty measured from submission to approval or rejection
2. THE System SHALL display approval rate percentage per Lab_Faculty showing ratio of approved to total reviewed submissions
3. THE HOD SHALL view Lab_Faculty workload showing number of Lab_Sessions conducted and Submissions reviewed per month
4. THE System SHALL identify Lab_Faculty with review times exceeding 48 hours and highlight these in the analytics dashboard
5. WHERE approval rates fall below 60 percent for any Lab_Faculty, THE System SHALL flag this for HOD attention
6. THE System SHALL generate comparative charts showing performance metrics across all Lab_Faculty in the department
7. THE HOD SHALL filter performance data by date range and Lab_Group
8. THE System SHALL export faculty performance reports as PDF documents with charts and summary statistics

### Requirement 25: Student Submission Analytics

**User Story:** As a Lab_Faculty, I want analytics on student submission patterns, so that I can identify students needing additional support.

#### Acceptance Criteria

1. THE System SHALL track submission timing showing how long after Lab_Session start each Student submits
2. THE Lab_Faculty SHALL view submission quality metrics including rejection rates per Student
3. THE System SHALL identify students with multiple rejected submissions and highlight these in the analytics view
4. WHERE a Student has not submitted work for 3 or more Lab_Sessions, THE System SHALL flag this as at-risk
5. THE System SHALL calculate average submission time per Student across all experiments
6. THE Lab_Faculty SHALL view comparison charts showing submission patterns across all students in a Lab_Group
7. THE System SHALL display correlation between submission timing and approval rates
8. THE System SHALL generate student progress reports showing completion rates and quality trends over time



### Requirement 26: System Configuration and Settings

**User Story:** As a system administrator, I want configurable system settings, so that I can customize the platform for institutional requirements.

#### Acceptance Criteria

1. THE System SHALL provide configuration for maximum file upload sizes with default values of 10 MB for images and 20 MB for PDFs
2. THE System SHALL allow configuration of session timeout duration with a minimum of 1 hour and maximum of 48 hours
3. THE System SHALL support configuration of Lab_Session maximum duration with default value of 4 hours
4. WHERE institutional branding is required, THE System SHALL allow upload of custom logos and color schemes
5. THE System SHALL provide configuration for notification delivery preferences including email and in-app notifications
6. THE System SHALL allow configuration of password complexity requirements including minimum length and required character types
7. THE System SHALL support configuration of automatic backup schedules with options for daily, weekly, or monthly backups
8. THE System SHALL validate all configuration changes before applying them to prevent invalid system states
9. WHEN configuration is changed, THE System SHALL log the change with administrator identifier and timestamp

### Requirement 27: Audit Trail and Compliance

**User Story:** As a Principal, I want comprehensive audit trails, so that I can ensure academic integrity and comply with institutional policies.

#### Acceptance Criteria

1. THE System SHALL record all user actions including logins, submissions, approvals, and configuration changes
2. THE System SHALL store audit records with user identifier, action type, timestamp, IP address, and affected resources
3. THE Principal SHALL search audit logs by user, action type, and date range
4. THE System SHALL retain audit logs for a minimum of 7 years for compliance purposes
5. WHERE suspicious activity is detected, THE System SHALL flag audit entries for administrative review
6. THE System SHALL generate audit reports showing all actions performed within a specified time period
7. THE System SHALL implement tamper-proof audit logging ensuring records cannot be modified after creation
8. THE System SHALL export audit logs in CSV format for external compliance audits
9. WHEN a Submission is modified before final approval, THE System SHALL record all changes in the audit trail

### Requirement 28: Mobile Responsive Design

**User Story:** As a Student, I want to access the system from my mobile device, so that I can submit lab work without requiring a desktop computer.

#### Acceptance Criteria

1. THE System SHALL render all pages with responsive layouts adapting to screen widths from 320px to 2560px
2. WHEN accessed from mobile devices, THE System SHALL optimize touch targets to minimum 44x44 pixels for accessibility
3. THE System SHALL implement mobile-optimized navigation with collapsible menus for small screens
4. THE System SHALL support mobile camera integration for direct Proof_Image capture and upload
5. WHERE tables contain many columns, THE System SHALL implement horizontal scrolling or card-based layouts for mobile views
6. THE System SHALL optimize image loading on mobile networks using progressive loading and compression
7. THE System SHALL test responsive design on iOS Safari, Android Chrome, and mobile Firefox browsers
8. THE System SHALL maintain functionality parity between desktop and mobile interfaces

### Requirement 29: Data Export and Reporting

**User Story:** As an HOD, I want to export data in multiple formats, so that I can perform external analysis and share reports with stakeholders.

#### Acceptance Criteria

1. THE HOD SHALL export Submission data as CSV files including all observation data, timestamps, and approval status
2. THE System SHALL generate PDF reports with charts, tables, and summary statistics for presentation purposes
3. THE HOD SHALL export Lab_Group rosters with student information and completion statistics
4. WHEN exporting data, THE System SHALL apply appropriate access controls ensuring users only export data they are authorized to view
5. THE System SHALL support exporting filtered and searched data maintaining the applied criteria
6. THE System SHALL include metadata in exports showing export date, user who generated the export, and data range
7. WHERE large datasets are exported, THE System SHALL process exports asynchronously and notify users when complete
8. THE System SHALL limit export file sizes to 100 MB and provide pagination options for larger datasets



### Requirement 30: System Performance and Scalability

**User Story:** As a system user, I want fast and reliable system performance, so that I can complete my work efficiently without delays.

#### Acceptance Criteria

1. THE System SHALL load page content within 2 seconds on standard broadband connections (10 Mbps or higher)
2. THE System SHALL handle concurrent access by up to 500 simultaneous users without performance degradation
3. WHEN database queries are executed, THE System SHALL return results within 500 milliseconds for 95 percent of queries
4. THE System SHALL implement caching for frequently accessed data including Experiment_Templates and user profiles
5. WHERE API responses exceed 1 second, THE System SHALL log performance warnings for optimization review
6. THE System SHALL optimize image delivery using CDN distribution and lazy loading techniques
7. THE System SHALL implement database connection pooling with a minimum pool size of 10 connections
8. THE System SHALL monitor system resource usage and alert administrators when CPU or memory usage exceeds 80 percent
9. WHEN system load increases, THE System SHALL scale horizontally by adding additional server instances

### Requirement 31: Backup and Disaster Recovery

**User Story:** As a system administrator, I want automated backups and recovery procedures, so that I can protect academic data from loss.

#### Acceptance Criteria

1. THE System SHALL perform automated daily backups of the database at 2:00 AM local time
2. THE System SHALL store backup copies in geographically separate locations from the primary database
3. THE System SHALL retain daily backups for 30 days, weekly backups for 90 days, and monthly backups for 1 year
4. WHEN a backup completes, THE System SHALL verify backup integrity by performing a test restore
5. IF a backup fails, THEN THE System SHALL retry the backup operation and alert administrators if retry fails
6. THE System SHALL document recovery procedures with step-by-step instructions for data restoration
7. THE System SHALL test disaster recovery procedures quarterly to ensure backup viability
8. THE System SHALL backup File_Storage and Image_Storage contents in addition to database backups
9. WHERE data corruption is detected, THE System SHALL provide point-in-time recovery to any backup within the retention period

### Requirement 32: Help and Documentation System

**User Story:** As a new user, I want accessible help documentation, so that I can learn to use the system effectively without external training.

#### Acceptance Criteria

1. THE System SHALL provide context-sensitive help buttons on each page linking to relevant documentation
2. THE System SHALL include a searchable help center with articles organized by user role and feature
3. THE System SHALL provide video tutorials demonstrating key workflows for each user role
4. WHERE users encounter errors, THE System SHALL display help links related to the specific error condition
5. THE System SHALL include a FAQ section addressing common questions and troubleshooting steps
6. THE System SHALL provide tooltips on form fields explaining expected input formats and requirements
7. THE System SHALL include an onboarding wizard for first-time users guiding them through initial setup
8. THE System SHALL allow users to submit feedback and feature requests through an integrated form

### Requirement 33: Notification Preferences and Management

**User Story:** As a system user, I want to control notification preferences, so that I receive relevant alerts without being overwhelmed.

#### Acceptance Criteria

1. THE System SHALL provide a notification settings page where users can configure their preferences
2. THE User SHALL enable or disable notifications for specific event types including submissions, approvals, and Lab_Session starts
3. WHERE email notifications are enabled, THE System SHALL send email summaries at user-configured intervals (immediate, daily, weekly)
4. THE System SHALL respect user preferences and only send notifications for enabled event types
5. THE User SHALL configure quiet hours during which no notifications are sent
6. THE System SHALL provide a "Do Not Disturb" mode that temporarily disables all notifications
7. WHERE critical system alerts occur, THE System SHALL override user preferences and send notifications regardless of settings
8. THE System SHALL display notification preview in settings allowing users to see what notifications look like before enabling them



### Requirement 34: Experiment Template Parser and Serializer

**User Story:** As a Faculty_Coordinator, I want to import and export experiment templates, so that I can share templates across departments and backup template configurations.

#### Acceptance Criteria

1. THE System SHALL provide a Template_Parser that parses JSON-formatted Experiment_Template files into Experiment_Template objects
2. WHEN a valid JSON template file is uploaded, THE Template_Parser SHALL validate the structure against the Experiment_Template schema
3. IF an invalid JSON template file is uploaded, THEN THE Template_Parser SHALL return descriptive error messages indicating the validation failures
4. THE System SHALL provide a Template_Serializer that formats Experiment_Template objects into valid JSON files
5. THE Template_Serializer SHALL include all template metadata, Observation_Table definitions, required fields, and calculation rules in the output
6. FOR ALL valid Experiment_Template objects, parsing the serialized JSON then serializing again SHALL produce an equivalent JSON structure (round-trip property)
7. THE System SHALL validate that serialized templates conform to JSON specification before allowing download
8. WHERE templates reference other templates or shared components, THE Template_Parser SHALL resolve these references during import
9. THE System SHALL support batch import of multiple template files simultaneously
10. WHEN exporting templates, THE System SHALL include version information and export timestamp in the JSON metadata

### Requirement 35: Observation Table Schema Validation

**User Story:** As the System, I want to validate observation table data against defined schemas, so that data integrity is maintained throughout the submission lifecycle.

#### Acceptance Criteria

1. THE System SHALL define a schema for each Observation_Table specifying column names, data types, constraints, and validation rules
2. WHEN observation data is submitted, THE System SHALL validate each cell value against the corresponding column schema
3. WHERE a column specifies an enumeration of allowed values, THE System SHALL reject values not in the enumeration
4. THE System SHALL validate numeric columns enforce minimum and maximum value constraints when defined
5. IF a required column contains null or empty values, THEN THE System SHALL reject the submission with field-specific error messages
6. THE System SHALL validate string columns respect maximum length constraints
7. WHERE calculation columns are defined, THE System SHALL validate the calculation formula syntax before allowing template creation
8. THE System SHALL validate that column data types are compatible with defined calculation operations
9. FOR ALL Observation_Tables, the schema validation SHALL be idempotent (validating twice produces the same result)

### Requirement 36: Data Integrity and Consistency

**User Story:** As the System, I want to maintain data integrity across all operations, so that academic records remain accurate and trustworthy.

#### Acceptance Criteria

1. THE System SHALL enforce foreign key constraints ensuring Lab_Groups reference valid Experiment_Templates
2. WHEN a Lab_Session is deleted, THE System SHALL prevent deletion if approved Submissions exist for that session
3. THE System SHALL validate that Submission timestamps fall within the corresponding Lab_Session time boundaries
4. WHERE a Student is removed from a Lab_Group, THE System SHALL maintain their existing Submissions for audit purposes
5. THE System SHALL prevent concurrent modifications to the same Submission using optimistic locking with version numbers
6. IF a database transaction fails, THEN THE System SHALL rollback all changes to maintain consistency
7. THE System SHALL validate that approval timestamps occur after submission timestamps
8. THE System SHALL enforce uniqueness constraints preventing duplicate Submissions for the same Student and Lab_Session combination
9. WHERE cascading deletes are required, THE System SHALL execute them within a single transaction to prevent orphaned records

### Requirement 37: API Request and Response Validation

**User Story:** As a frontend developer, I want consistent API contracts, so that I can reliably integrate with backend services.

#### Acceptance Criteria

1. THE System SHALL validate all API request bodies against defined JSON schemas before processing
2. WHEN API validation fails, THE System SHALL return a 400 status code with structured error details including field names and validation messages
3. THE System SHALL validate request headers include required authentication tokens for protected endpoints
4. THE System SHALL validate query parameters match expected types and formats
5. WHERE pagination is supported, THE System SHALL validate page and limit parameters are positive integers
6. THE System SHALL return consistent response structures with status, data, and error fields for all API endpoints
7. THE System SHALL validate API responses match defined schemas before sending to clients
8. FOR ALL API endpoints, the request and response validation SHALL be deterministic (same input produces same validation result)
9. THE System SHALL document all API endpoints with OpenAPI specification including request and response schemas



### Requirement 38: Image Processing and Optimization

**User Story:** As a Student, I want my uploaded images to be processed efficiently, so that they load quickly without losing important details.

#### Acceptance Criteria

1. WHEN a Proof_Image is uploaded, THE System SHALL validate the image dimensions are at least 640x480 pixels
2. THE System SHALL compress images exceeding 2 MB to reduce file size while maintaining visual quality
3. THE System SHALL generate thumbnail versions of Proof_Images at 200x200 pixels for list views
4. WHERE images are in PNG format, THE System SHALL convert them to JPEG format to optimize storage
5. THE System SHALL preserve EXIF metadata including capture timestamp and device information
6. THE System SHALL validate images are not corrupted by attempting to decode them after upload
7. IF image processing fails, THEN THE System SHALL reject the upload and provide a clear error message
8. THE System SHALL support progressive JPEG encoding for faster initial display
9. WHERE images contain sensitive information in EXIF data, THE System SHALL strip GPS coordinates before storage

### Requirement 39: Concurrent Session Management

**User Story:** As a Lab_Faculty, I want to manage multiple lab sessions simultaneously, so that I can conduct labs for different groups efficiently.

#### Acceptance Criteria

1. THE Lab_Faculty SHALL create multiple Lab_Sessions for different Lab_Groups running concurrently
2. THE System SHALL prevent scheduling conflicts where the same Lab_Faculty has overlapping Lab_Sessions
3. WHEN viewing active sessions, THE Lab_Faculty SHALL see all currently running Lab_Sessions with student participation counts
4. THE System SHALL allow Lab_Faculty to switch between active Lab_Sessions without ending them
5. WHERE a Lab_Faculty manages multiple sessions, THE System SHALL display pending review counts per session
6. THE System SHALL maintain separate submission queues for each Lab_Session
7. THE Lab_Faculty SHALL end specific Lab_Sessions independently without affecting other active sessions
8. THE System SHALL track Lab_Faculty availability and warn when scheduling exceeds recommended workload limits

### Requirement 40: Student Collaboration Prevention

**User Story:** As a Lab_Faculty, I want to prevent unauthorized collaboration, so that each student submits their own authentic work.

#### Acceptance Criteria

1. THE System SHALL detect when multiple students submit identical or highly similar observation data within the same Lab_Session
2. WHEN similarity exceeds 90 percent between two Submissions, THE System SHALL flag both for faculty review
3. THE System SHALL compare Proof_Images using perceptual hashing to detect duplicate or nearly identical images
4. WHERE students submit from the same IP address within a short time window, THE System SHALL log this for review
5. THE System SHALL track submission patterns including typing speed and pause durations to identify copy-paste behavior
6. THE Lab_Faculty SHALL view similarity reports showing flagged Submissions with comparison details
7. THE System SHALL allow Lab_Faculty to mark flagged Submissions as legitimate collaboration or academic misconduct
8. WHERE patterns of copying are detected across multiple Lab_Sessions, THE System SHALL generate alerts for HOD review

### Requirement 41: Accessibility Compliance

**User Story:** As a user with disabilities, I want the system to be fully accessible, so that I can use all features without barriers.

#### Acceptance Criteria

1. THE System SHALL provide alternative text for all images and icons
2. THE System SHALL support keyboard navigation for all interactive elements with visible focus indicators
3. THE System SHALL maintain color contrast ratios of at least 4.5:1 for normal text and 3:1 for large text
4. WHERE forms contain errors, THE System SHALL announce errors to screen readers using ARIA live regions
5. THE System SHALL provide skip navigation links allowing users to bypass repetitive content
6. THE System SHALL ensure all interactive elements are reachable and operable using keyboard alone
7. THE System SHALL support screen reader announcements for dynamic content updates
8. THE System SHALL provide text alternatives for time-based media including video tutorials
9. WHERE complex data tables are used, THE System SHALL implement proper table headers and ARIA attributes for screen reader navigation



### Requirement 42: System Health Monitoring

**User Story:** As a system administrator, I want real-time health monitoring, so that I can proactively address issues before they impact users.

#### Acceptance Criteria

1. THE System SHALL monitor database connection health and alert administrators if connections fail
2. THE System SHALL track API response times and alert when average response time exceeds 2 seconds
3. THE System SHALL monitor storage utilization for Image_Storage and File_Storage with alerts at 80 percent capacity
4. WHEN external services (Cloudinary, Cloudflare R2) become unavailable, THE System SHALL log errors and attempt automatic retry
5. THE System SHALL provide a health check endpoint returning system status and component availability
6. THE System SHALL monitor memory usage and alert when available memory falls below 20 percent
7. WHERE error rates exceed 5 percent of total requests, THE System SHALL send critical alerts to administrators
8. THE System SHALL track user session counts and alert when approaching maximum concurrent user limits
9. THE System SHALL provide a status dashboard showing real-time metrics for all monitored components

### Requirement 43: Internationalization and Localization

**User Story:** As a user in a non-English speaking region, I want the system in my language, so that I can use it comfortably and effectively.

#### Acceptance Criteria

1. THE System SHALL support multiple languages including English, Hindi, Tamil, Telugu, and Kannada
2. THE User SHALL select their preferred language from account settings
3. WHEN a language is selected, THE System SHALL display all UI text, labels, and messages in the chosen language
4. THE System SHALL store user-generated content in its original language without automatic translation
5. WHERE translations are missing, THE System SHALL fall back to English as the default language
6. THE System SHALL format dates, times, and numbers according to the user's locale preferences
7. THE System SHALL support right-to-left text direction for languages that require it
8. THE System SHALL provide translation management tools for administrators to update language files
9. WHERE new features are added, THE System SHALL ensure all UI text is externalized for translation

### Requirement 44: Rate Limiting and Abuse Prevention

**User Story:** As a system administrator, I want rate limiting and abuse prevention, so that the system remains available and performs well for all users.

#### Acceptance Criteria

1. THE System SHALL limit API requests to 100 requests per minute per user account
2. WHEN rate limits are exceeded, THE System SHALL return a 429 status code with retry-after header
3. THE System SHALL limit file upload attempts to 10 uploads per minute per user
4. WHERE repeated failed login attempts occur, THE System SHALL implement exponential backoff increasing delay between attempts
5. THE System SHALL block IP addresses that exceed 1000 requests per hour across all endpoints
6. THE System SHALL limit bulk operations to prevent resource exhaustion
7. WHERE automated bot activity is detected, THE System SHALL require CAPTCHA verification
8. THE System SHALL provide rate limit status in API response headers showing remaining quota
9. THE System SHALL allow administrators to configure rate limits per user role with higher limits for faculty

### Requirement 45: Data Retention and Archival

**User Story:** As a Principal, I want configurable data retention policies, so that I can comply with institutional record-keeping requirements while managing storage costs.

#### Acceptance Criteria

1. THE System SHALL retain approved Submissions and Manual_Records for a minimum of 5 years
2. THE System SHALL archive Submissions older than 2 years to cold storage with reduced access speed
3. WHERE data retention periods expire, THE System SHALL notify administrators before automatic deletion
4. THE System SHALL allow administrators to configure retention periods per data type
5. THE System SHALL maintain audit logs for a minimum of 7 years regardless of other retention settings
6. WHERE legal holds are placed, THE System SHALL prevent deletion of affected records until the hold is released
7. THE System SHALL provide data export functionality before archival allowing backup to external systems
8. THE System SHALL compress archived data to optimize storage utilization
9. WHEN archived data is accessed, THE System SHALL restore it to active storage within 24 hours



### Requirement 46: Email Notification System

**User Story:** As a system user, I want to receive email notifications for important events, so that I stay informed even when not actively using the system.

#### Acceptance Criteria

1. WHEN a Submission is approved or rejected, THE System SHALL send an email notification to the Student
2. THE System SHALL send email notifications to Lab_Faculty when new Submissions are pending review
3. WHEN a Lab_Session is scheduled, THE System SHALL send reminder emails to assigned students 24 hours before the session
4. THE System SHALL use professional email templates with institutional branding
5. WHERE email delivery fails, THE System SHALL retry sending up to 3 times with exponential backoff
6. THE System SHALL include unsubscribe links in all non-critical email notifications
7. THE System SHALL track email delivery status and log failures for administrator review
8. THE System SHALL batch email notifications to prevent overwhelming users with multiple emails
9. WHERE users have email notifications disabled, THE System SHALL respect preferences and only send critical alerts

### Requirement 47: QR Code Verification System

**User Story:** As a verifier, I want to scan QR codes on printed lab records, so that I can verify authenticity and access the original digital submission.

#### Acceptance Criteria

1. WHEN a PDF is generated, THE System SHALL embed a unique QR code containing the Manual_Record identifier
2. THE System SHALL provide a public verification endpoint that accepts Manual_Record identifiers
3. WHEN a QR code is scanned, THE System SHALL display submission details including student name, experiment title, submission date, and approval status
4. THE System SHALL validate QR code authenticity by checking digital signatures
5. WHERE a Manual_Record has been modified after PDF generation, THE System SHALL display a warning on the verification page
6. THE System SHALL log all QR code verification attempts with timestamp and IP address
7. THE System SHALL generate QR codes using error correction level M for reliable scanning
8. THE System SHALL position QR codes consistently in the footer of all generated PDFs
9. WHERE QR codes cannot be generated, THE System SHALL include a verification URL as fallback

### Requirement 48: Calculation Engine for Observation Tables

**User Story:** As a Student, I want automatic calculations in observation tables, so that I can focus on data entry without manual computation errors.

#### Acceptance Criteria

1. THE System SHALL evaluate calculation formulas defined in Experiment_Templates when observation data is entered
2. THE System SHALL support basic arithmetic operations (addition, subtraction, multiplication, division) in calculation formulas
3. WHERE calculation formulas reference other columns, THE System SHALL automatically recalculate when referenced values change
4. THE System SHALL support mathematical functions including square root, logarithm, trigonometric functions, and exponentiation
5. IF a calculation formula contains errors or references invalid columns, THEN THE System SHALL display an error message and prevent submission
6. THE System SHALL validate that calculation results fall within expected ranges when constraints are defined
7. THE System SHALL display calculated values in real-time as students enter observation data
8. WHERE division by zero occurs in calculations, THE System SHALL handle the error gracefully and display an appropriate message
9. THE System SHALL support conditional calculations using IF-THEN-ELSE logic in formulas

### Requirement 49: Lab Equipment and Resource Management

**User Story:** As a Lab_Faculty, I want to track lab equipment usage, so that I can manage resources and schedule maintenance effectively.

#### Acceptance Criteria

1. THE Lab_Faculty SHALL create equipment records with name, identifier, location, and maintenance schedule
2. WHEN creating a Lab_Session, THE Lab_Faculty SHALL associate required equipment with the session
3. THE System SHALL track equipment usage by recording which Lab_Sessions used specific equipment
4. WHERE equipment maintenance is due, THE System SHALL alert Lab_Faculty and prevent scheduling sessions requiring that equipment
5. THE System SHALL display equipment availability when scheduling Lab_Sessions
6. THE Lab_Faculty SHALL log equipment issues and maintenance activities
7. THE System SHALL generate equipment utilization reports showing usage frequency and patterns
8. WHERE multiple Lab_Sessions require the same equipment simultaneously, THE System SHALL warn about resource conflicts



### Requirement 50: Security and Data Protection

**User Story:** As a system administrator, I want comprehensive security measures, so that I can protect sensitive academic data and prevent unauthorized access.

#### Acceptance Criteria

1. THE System SHALL encrypt all data in transit using TLS 1.3 or higher
2. THE System SHALL encrypt sensitive data at rest including passwords, Auth_Tokens, and personal information
3. WHEN storing passwords, THE System SHALL hash them using bcrypt with a cost factor of at least 12
4. THE System SHALL implement Content Security Policy headers to prevent XSS attacks
5. THE System SHALL validate and sanitize all file uploads to prevent malicious file execution
6. WHERE sensitive operations are performed, THE System SHALL require re-authentication for elevated privileges
7. THE System SHALL implement HTTP security headers including X-Frame-Options, X-Content-Type-Options, and Strict-Transport-Security
8. THE System SHALL log all security-relevant events including authentication failures, authorization denials, and suspicious activities
9. THE System SHALL conduct regular security audits and vulnerability scans
10. WHERE security vulnerabilities are discovered, THE System SHALL provide mechanisms for rapid patching and updates

---

## Summary

This requirements document defines 50 comprehensive requirements for the Digital Lab Manual System, covering:

- User authentication and role-based access control (5 roles: Student, Lab_Faculty, Faculty_Coordinator, HOD, Principal)
- Experiment template management with versioning and structured observation tables
- Lab session control with real-time submission windows
- Student submission workflow with proof-based verification
- Faculty approval workflow with feedback mechanisms
- Anti-copy mechanisms including similarity detection and image hash validation
- PDF generation with QR code verification
- Analytics and reporting for all user roles
- System infrastructure including API routes, database management, file storage, and security
- Accessibility, internationalization, and mobile responsiveness
- Performance, scalability, and disaster recovery
- Data integrity, validation, and audit trails

The requirements follow EARS patterns (Ubiquitous, Event-driven, State-driven, Unwanted event, Optional feature, and Complex) and comply with INCOSE quality rules ensuring clarity, testability, completeness, and positive statements. Each requirement includes user stories and detailed acceptance criteria that can be verified through testing.

The system is designed as a professional SaaS platform using Next.js 16.2.2 with App Router, React 19, TypeScript, Tailwind CSS 4, MongoDB, Cloudinary, and Cloudflare R2, providing a comprehensive solution to replace traditional paper-based lab manuals with authentic, verifiable digital submissions.
