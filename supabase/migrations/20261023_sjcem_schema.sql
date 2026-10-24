-- ========================================================================
-- SJCEM NEXT — Modern Student Management Information System
-- Database Schema & Row-Level Security (RLS) Policies
-- Institution: St. John College of Engineering and Management, Palghar
-- Trust: ALDEL Education Trust
-- ========================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. INSTITUTIONAL STRUCTURE TABLES
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    hod_name VARCHAR(255),
    established_year INT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS programs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    degree_type VARCHAR(50) DEFAULT 'Bachelor of Engineering (B.E.)',
    duration_years INT DEFAULT 4,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS academic_years (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    year_code VARCHAR(20) UNIQUE NOT NULL, -- e.g., '2025-2026'
    is_current BOOLEAN DEFAULT FALSE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL
);

CREATE TABLE IF NOT EXISTS semesters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    academic_year_id UUID REFERENCES academic_years(id) ON DELETE CASCADE,
    sem_number INT NOT NULL CHECK (sem_number BETWEEN 1 AND 8),
    sem_type VARCHAR(10) CHECK (sem_type IN ('ODD', 'EVEN')),
    is_active BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS divisions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    semester_id UUID REFERENCES semesters(id) ON DELETE CASCADE,
    department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
    division_name VARCHAR(10) NOT NULL, -- e.g. 'A', 'B'
    academic_year VARCHAR(20) NOT NULL,
    UNIQUE (semester_id, department_id, division_name)
);

-- 2. USER PROFILES & ROLES
CREATE TYPE app_role AS ENUM ('student', 'faculty', 'coordinator', 'admin');

CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY, -- Maps to auth.users.id
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    last_name VARCHAR(100) NOT NULL,
    avatar_url TEXT,
    phone VARCHAR(20),
    dob DATE,
    blood_group VARCHAR(5),
    address TEXT,
    guardian_name VARCHAR(255),
    guardian_phone VARCHAR(20),
    guardian_relation VARCHAR(50),
    emergency_contact VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    role app_role NOT NULL,
    department_id UUID REFERENCES departments(id),
    is_primary BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id, role)
);

CREATE TABLE IF NOT EXISTS student_enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    student_prn VARCHAR(30) UNIQUE NOT NULL, -- Permanent Registration Number
    roll_number VARCHAR(20) NOT NULL,
    program_id UUID REFERENCES programs(id),
    department_id UUID REFERENCES departments(id),
    current_semester_id UUID REFERENCES semesters(id),
    current_division_id UUID REFERENCES divisions(id),
    admission_year INT NOT NULL,
    academic_advisor_id UUID REFERENCES profiles(id),
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. COURSES, FACULTY & TIMETABLE
CREATE TABLE IF NOT EXISTS subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_code VARCHAR(20) UNIQUE NOT NULL, -- e.g. 'CSC601'
    name VARCHAR(255) NOT NULL,
    department_id UUID REFERENCES departments(id),
    semester_num INT NOT NULL CHECK (semester_num BETWEEN 1 AND 8),
    credits INT NOT NULL DEFAULT 3,
    has_practical BOOLEAN DEFAULT FALSE,
    passing_marks INT DEFAULT 40,
    total_marks INT DEFAULT 100
);

CREATE TABLE IF NOT EXISTS faculty_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    faculty_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
    division_id UUID REFERENCES divisions(id) ON DELETE CASCADE,
    assignment_type VARCHAR(20) DEFAULT 'THEORY', -- 'THEORY', 'LAB'
    batch VARCHAR(10), -- e.g. 'A1', 'A2' or 'ALL'
    academic_year VARCHAR(20) NOT NULL,
    UNIQUE (faculty_id, subject_id, division_id, assignment_type, batch)
);

CREATE TABLE IF NOT EXISTS timetable_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    division_id UUID REFERENCES divisions(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
    faculty_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 1 AND 6), -- 1=Monday, 6=Saturday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    room_number VARCHAR(50) NOT NULL,
    type VARCHAR(20) DEFAULT 'LECTURE', -- 'LECTURE', 'LAB', 'TUTORIAL'
    batch VARCHAR(10) DEFAULT 'ALL'
);

-- 4. ATTENDANCE MANAGEMENT
CREATE TABLE IF NOT EXISTS attendance_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    faculty_id UUID REFERENCES profiles(id) ON DELETE RESTRICT,
    subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
    division_id UUID REFERENCES divisions(id) ON DELETE CASCADE,
    batch VARCHAR(10) DEFAULT 'ALL',
    session_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    topic_covered TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS attendance_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES attendance_sessions(id) ON DELETE CASCADE,
    student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL CHECK (status IN ('PRESENT', 'ABSENT', 'LATE', 'EXCUSED')),
    recorded_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (session_id, student_id)
);

-- 5. ASSESSMENTS & RESULTS
CREATE TABLE IF NOT EXISTS assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
    division_id UUID REFERENCES divisions(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL, -- e.g. 'Internal Assessment 1 (IA-1)'
    max_marks NUMERIC(5,2) NOT NULL DEFAULT 20.00,
    assessment_date DATE NOT NULL,
    is_published BOOLEAN DEFAULT FALSE,
    published_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS assessment_marks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE,
    student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    marks_obtained NUMERIC(5,2) NOT NULL,
    submitted_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (assessment_id, student_id)
);

CREATE TABLE IF NOT EXISTS semester_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    semester_num INT NOT NULL CHECK (semester_num BETWEEN 1 AND 8),
    exam_seat_no VARCHAR(50) NOT NULL,
    sgpa NUMERIC(4,2) NOT NULL,
    cgpa NUMERIC(4,2),
    total_credits INT NOT NULL,
    result_status VARCHAR(20) DEFAULT 'PASS',
    published_date DATE NOT NULL,
    marksheet_url TEXT,
    UNIQUE (student_id, semester_num)
);

-- 6. NOTICES & STUDY RESOURCES
CREATE TABLE IF NOT EXISTS notices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    author_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('ACADEMIC', 'EXAMINATION', 'EVENTS', 'ADMINISTRATIVE', 'PLACEMENT', 'SCHOLARSHIPS', 'GENERAL')),
    priority VARCHAR(20) DEFAULT 'NORMAL' CHECK (priority IN ('LOW', 'NORMAL', 'IMPORTANT', 'URGENT')),
    target_audience VARCHAR(50) DEFAULT 'ALL', -- 'ALL', 'STUDENTS', 'FACULTY', 'DEPARTMENT'
    department_id UUID REFERENCES departments(id),
    is_pinned BOOLEAN DEFAULT FALSE,
    attachment_name VARCHAR(255),
    attachment_url TEXT,
    published_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS notice_reads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    notice_id UUID REFERENCES notices(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    read_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (notice_id, user_id)
);

CREATE TABLE IF NOT EXISTS study_resources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
    uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    resource_type VARCHAR(50) NOT NULL CHECK (resource_type IN ('NOTES', 'QUESTION_PAPER', 'LAB_MANUAL', 'SYLLABUS', 'REFERENCE_BOOK')),
    file_name VARCHAR(255) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    file_url TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. PROJECT MANAGEMENT
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    abstract TEXT NOT NULL,
    department_id UUID REFERENCES departments(id),
    academic_year VARCHAR(20) NOT NULL,
    guide_id UUID REFERENCES profiles(id),
    category VARCHAR(50) DEFAULT 'CAPSTONE', -- 'CAPSTONE', 'MINI_PROJECT', 'RESEARCH'
    status VARCHAR(30) DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'CHANGES_REQUESTED', 'APPROVED', 'IN_PROGRESS', 'FINAL_SUBMISSION', 'COMPLETED', 'REJECTED')),
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS project_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    is_leader BOOLEAN DEFAULT FALSE,
    UNIQUE (project_id, student_id)
);

CREATE TABLE IF NOT EXISTS project_milestones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    due_date DATE NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS project_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    submitted_by UUID REFERENCES profiles(id),
    title VARCHAR(255) NOT NULL,
    notes TEXT,
    document_url TEXT NOT NULL,
    version VARCHAR(20) DEFAULT 'v1.0',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS project_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    reviewer_id UUID REFERENCES profiles(id),
    feedback TEXT NOT NULL,
    action_taken VARCHAR(50) NOT NULL,
    reviewed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. CERTIFICATES & REQUEST TRACKING
CREATE TABLE IF NOT EXISTS certificate_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reference_number VARCHAR(50) UNIQUE NOT NULL,
    student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    certificate_type VARCHAR(100) NOT NULL CHECK (certificate_type IN ('BONAFIDE', 'LEAVING_CERTIFICATE', 'TRANSCRIPT', 'MIGRATION', 'OTHER')),
    purpose TEXT NOT NULL,
    status VARCHAR(40) DEFAULT 'SUBMITTED' CHECK (status IN ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'ADDITIONAL_INFO_REQUIRED', 'APPROVED', 'REJECTED', 'READY_FOR_COLLECTION', 'COMPLETED')),
    admin_remarks TEXT,
    issued_document_url TEXT,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS request_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id UUID REFERENCES certificate_requests(id) ON DELETE CASCADE,
    from_status VARCHAR(40),
    to_status VARCHAR(40) NOT NULL,
    changed_by UUID REFERENCES profiles(id),
    remarks TEXT,
    changed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. NOTIFICATIONS, SUPPORT & AUDIT LOGS
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'GENERAL', -- 'ACADEMIC', 'TIMETABLE', 'CERTIFICATE', 'NOTICE', 'PROJECT'
    link_url TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_number VARCHAR(50) UNIQUE NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(30) DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED')),
    priority VARCHAR(20) DEFAULT 'NORMAL',
    assigned_to UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_name VARCHAR(100) NOT NULL,
    entity_id UUID,
    ip_address VARCHAR(50),
    user_agent TEXT,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================================================
-- ROW-LEVEL SECURITY (RLS) POLICIES
-- ========================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_marks ENABLE ROW LEVEL SECURITY;
ALTER TABLE semester_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE notice_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificate_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE request_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper security functions
CREATE OR REPLACE FUNCTION auth_user_has_role(required_role app_role)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid() AND role = required_role
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles: Users can view own profile. Admins & faculty can view assigned student profiles.
CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    USING (id = auth.uid() OR auth_user_has_role('admin') OR auth_user_has_role('faculty'));

CREATE POLICY "Users can update own contact profile"
    ON profiles FOR UPDATE
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- Attendance Records:
-- Students can only view their own attendance records.
CREATE POLICY "Students can view own attendance"
    ON attendance_records FOR SELECT
    USING (
        student_id = auth.uid() OR
        auth_user_has_role('admin') OR
        auth_user_has_role('faculty')
    );

-- Only authorized faculty or admins can insert/update attendance
CREATE POLICY "Faculty can record attendance"
    ON attendance_records FOR INSERT
    WITH CHECK (auth_user_has_role('faculty') OR auth_user_has_role('admin'));

CREATE POLICY "Faculty can update attendance"
    ON attendance_records FOR UPDATE
    USING (auth_user_has_role('faculty') OR auth_user_has_role('admin'));

-- Assessment Marks:
-- Students can only read published marks for themselves.
CREATE POLICY "Students can view own published marks"
    ON assessment_marks FOR SELECT
    USING (
        student_id = auth.uid() OR
        auth_user_has_role('faculty') OR
        auth_user_has_role('admin')
    );

-- Semester Results:
CREATE POLICY "Students can view own semester results"
    ON semester_results FOR SELECT
    USING (
        student_id = auth.uid() OR
        auth_user_has_role('admin')
    );

-- Certificate Requests:
-- Students can view and insert their own requests.
CREATE POLICY "Students can view own certificate requests"
    ON certificate_requests FOR SELECT
    USING (
        student_id = auth.uid() OR
        auth_user_has_role('admin')
    );

CREATE POLICY "Students can submit certificate requests"
    ON certificate_requests FOR INSERT
    WITH CHECK (student_id = auth.uid());

CREATE POLICY "Admins can update certificate requests"
    ON certificate_requests FOR UPDATE
    USING (auth_user_has_role('admin'));

-- Projects:
-- Members and guides can view their projects. Admins can view all.
CREATE POLICY "Project members and guides can view project"
    ON projects FOR SELECT
    USING (
        id IN (SELECT project_id FROM project_members WHERE student_id = auth.uid()) OR
        guide_id = auth.uid() OR
        auth_user_has_role('admin')
    );

-- Notifications:
CREATE POLICY "Users can view own notifications"
    ON notifications FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can mark own notifications read"
    ON notifications FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Notices:
-- Any authenticated user can read published notices.
CREATE POLICY "Authenticated users can view notices"
    ON notices FOR SELECT
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "Faculty and admin can publish notices"
    ON notices FOR INSERT
    WITH CHECK (auth_user_has_role('faculty') OR auth_user_has_role('admin'));

-- Audit Logs:
CREATE POLICY "Only admins can view audit logs"
    ON audit_logs FOR SELECT
    USING (auth_user_has_role('admin'));
