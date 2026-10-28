-- ========================================================================
-- SJCEM NEXT — Authorized Student Information Retrieval & Import Schema
-- Migration: 20261024_student_retrieval_and_import_schema.sql
-- Institution: St. John College of Engineering and Management, Palghar
-- Managed by: ALDEL Education Trust
-- ========================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. IMPORTED STUDENT RECORDS TABLE
-- Stores authorized imported student profiles with attendance, assessment marks,
-- and results. Used for local lookup when live API integration is pending IT approval.
CREATE TABLE IF NOT EXISTS imported_student_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id VARCHAR(50),                           -- Institutional Student ID (e.g. EU20220084)
    pid VARCHAR(50) UNIQUE NOT NULL,                  -- Permanent Identification Number / PRN
    prn VARCHAR(30) UNIQUE NOT NULL,                  -- University PRN (16-digits)
    roll_number VARCHAR(20) NOT NULL,                 -- Class Roll Number (e.g. SJCEM2022CS084)
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(25),
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    department_code VARCHAR(20) NOT NULL,             -- 'COMP', 'IT', 'AIDS', 'EXTC', 'MECH', 'CIVIL'
    program_name VARCHAR(255) NOT NULL,               -- e.g. 'B.E. Computer Engineering'
    admission_year INT NOT NULL,                      -- e.g. 2022
    academic_year VARCHAR(20) NOT NULL,               -- e.g. '2025–2026'
    current_semester INT NOT NULL CHECK (current_semester BETWEEN 1 AND 8),
    current_division VARCHAR(10) NOT NULL,            -- e.g. 'A', 'B'
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',     -- 'ACTIVE', 'INACTIVE', 'GRADUATED', 'DETAINED'
    academic_advisor VARCHAR(255),                    -- e.g. 'Prof. Anita Deshmukh'
    attendance_percentage NUMERIC(5,2),               -- Aggregate attendance percentage
    attendance_details JSONB,                         -- Breakdown by subject: [{subjectCode, subjectName, attended, conducted, percentage}]
    ia_marks JSONB,                                   -- IA marks: [{subjectCode, subjectName, ia1, ia2, average, maxMarks}]
    semester_results JSONB,                           -- Semester grades: [{semester, sgpa, cgpa, status, examSeatNo}]
    source_type VARCHAR(50) NOT NULL DEFAULT 'CSV_IMPORT', -- 'CSV_IMPORT', 'API_GATEWAY', 'SERVER_TRANSFER'
    source_batch_id VARCHAR(100),                     -- Batch tracking identifier
    last_verified_at TIMESTAMPTZ DEFAULT NOW(),       -- Timestamp of last data synchronization
    imported_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_imported_students_student_id ON imported_student_records(student_id);
CREATE INDEX IF NOT EXISTS idx_imported_students_pid ON imported_student_records(pid);
CREATE INDEX IF NOT EXISTS idx_imported_students_prn ON imported_student_records(prn);
CREATE INDEX IF NOT EXISTS idx_imported_students_dept ON imported_student_records(department_code);
CREATE INDEX IF NOT EXISTS idx_imported_students_sem ON imported_student_records(current_semester);

-- 2. INTEGRATION CONFIGURATIONS TABLE
-- Manages college integration settings (CSV mode vs authorized external API gateway)
CREATE TABLE IF NOT EXISTS integration_configurations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_key VARCHAR(50) UNIQUE NOT NULL,          -- e.g. 'ALDEL_STUDENT_PORTAL'
    service_name VARCHAR(255) NOT NULL,
    integration_mode VARCHAR(50) NOT NULL DEFAULT 'LOCAL_IMPORTED', -- 'LOCAL_IMPORTED', 'AUTHORIZED_API', 'HYBRID'
    api_endpoint_url TEXT,                            -- e.g. 'https://api.aldel.org/v1/students' (pending IT approval)
    api_timeout_ms INT DEFAULT 5000,                  -- Request timeout in milliseconds
    rate_limit_per_min INT DEFAULT 20,                -- Rate limit per authenticated user
    is_active BOOLEAN DEFAULT TRUE,
    health_status VARCHAR(30) DEFAULT 'OPERATIONAL',  -- 'OPERATIONAL', 'DEGRADED', 'STANDBY', 'OFFLINE'
    last_health_check TIMESTAMPTZ DEFAULT NOW(),
    last_sync_timestamp TIMESTAMPTZ,
    notes TEXT,
    updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. STUDENT LOOKUP AUDIT LOGS TABLE
-- Immutable security audit log tracking all PID queries, outcomes, and access control denials
CREATE TABLE IF NOT EXISTS student_lookup_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    actor_name VARCHAR(255) NOT NULL,
    actor_role app_role NOT NULL,
    actor_department VARCHAR(50),
    queried_pid VARCHAR(50) NOT NULL,
    lookup_result VARCHAR(50) NOT NULL,               -- 'SUCCESS', 'NOT_FOUND', 'ACCESS_DENIED', 'RATE_LIMITED', 'INVALID_FORMAT'
    student_department VARCHAR(50),                   -- Department of student if found
    denial_reason TEXT,                               -- Explanation if access was restricted
    ip_address VARCHAR(50) DEFAULT '127.0.0.1',
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lookup_audit_actor ON student_lookup_audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_lookup_audit_pid ON student_lookup_audit_logs(queried_pid);
CREATE INDEX IF NOT EXISTS idx_lookup_audit_time ON student_lookup_audit_logs(created_at DESC);

-- ========================================================================
-- ROW-LEVEL SECURITY (RLS) POLICIES
-- ========================================================================

ALTER TABLE imported_student_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_lookup_audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper to get user's active department code
CREATE OR REPLACE FUNCTION auth_user_department_code()
RETURNS VARCHAR AS $$
    SELECT d.code 
    FROM user_roles ur
    JOIN departments d ON d.id = ur.department_id
    WHERE ur.user_id = auth.uid()
    LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 1. Policies for imported_student_records:
-- Admins can view and manage all student records
CREATE POLICY "Admins full access to imported student records"
    ON imported_student_records FOR ALL
    USING (auth_user_has_role('admin'))
    WITH CHECK (auth_user_has_role('admin'));

-- Faculty can ONLY view student records belonging to their department
CREATE POLICY "Faculty can view student records in their department"
    ON imported_student_records FOR SELECT
    USING (
        auth_user_has_role('faculty') 
        AND (
            department_code = auth_user_department_code()
            OR department_code = 'COMP' -- Default faculty department
        )
    );

-- Students CANNOT query arbitrary student records
-- (They can only view their own record through profiles and student_enrollments)

-- 2. Policies for integration_configurations:
CREATE POLICY "Admins can view and edit integration configs"
    ON integration_configurations FOR ALL
    USING (auth_user_has_role('admin'))
    WITH CHECK (auth_user_has_role('admin'));

CREATE POLICY "Faculty can read active integration configs"
    ON integration_configurations FOR SELECT
    USING (auth_user_has_role('faculty'));

-- 3. Policies for student_lookup_audit_logs:
CREATE POLICY "Admins can view all lookup audit logs"
    ON student_lookup_audit_logs FOR SELECT
    USING (auth_user_has_role('admin'));

CREATE POLICY "Faculty can view own lookup audit logs"
    ON student_lookup_audit_logs FOR SELECT
    USING (auth_user_has_role('faculty') AND actor_id = auth.uid());

CREATE POLICY "System can record lookup audit logs"
    ON student_lookup_audit_logs FOR INSERT
    WITH CHECK (true);

-- ========================================================================
-- SECURITY DEFINER FUNCTION: SAFE STUDENT LOOKUP BY PID
-- ========================================================================
CREATE OR REPLACE FUNCTION lookup_student_by_pid_secure(
    p_pid TEXT,
    p_ip_address VARCHAR(50) DEFAULT '127.0.0.1',
    p_user_agent TEXT DEFAULT 'SJCEM-NEXT-Client'
)
RETURNS JSONB AS $$
DECLARE
    v_actor_id UUID := auth.uid();
    v_actor_role app_role;
    v_actor_dept VARCHAR(50);
    v_actor_name VARCHAR(255);
    v_record imported_student_records%ROWTYPE;
    v_sanitized_pid TEXT;
BEGIN
    -- 1. Authenticate caller
    IF v_actor_id IS NULL THEN
        RAISE EXCEPTION 'Unauthenticated request: You must be logged in to search student records.'
            USING ERRCODE = '28000';
    END IF;

    -- 2. Retrieve caller credentials & role
    SELECT ur.role, d.code, (p.first_name || ' ' || p.last_name)
    INTO v_actor_role, v_actor_dept, v_actor_name
    FROM user_roles ur
    JOIN profiles p ON p.id = ur.user_id
    LEFT JOIN departments d ON d.id = ur.department_id
    WHERE ur.user_id = v_actor_id
    LIMIT 1;

    -- Only faculty or admin are permitted
    IF v_actor_role NOT IN ('faculty', 'admin') THEN
        INSERT INTO student_lookup_audit_logs (
            actor_id, actor_name, actor_role, actor_department,
            queried_pid, lookup_result, denial_reason, ip_address, user_agent
        ) VALUES (
            v_actor_id, COALESCE(v_actor_name, 'Unknown'), COALESCE(v_actor_role, 'student'), v_actor_dept,
            COALESCE(p_pid, ''), 'ACCESS_DENIED', 'Students are unauthorized to execute arbitrary PID lookups', p_ip_address, p_user_agent
        );
        RAISE EXCEPTION 'Unauthorized: Student accounts cannot perform student PID lookups.'
            USING ERRCODE = '42501';
    END IF;

    -- 3. Sanitize and validate input PID / Student ID
    v_sanitized_pid := TRIM(p_pid);
    IF v_sanitized_pid IS NULL OR LENGTH(v_sanitized_pid) < 4 OR LENGTH(v_sanitized_pid) > 32 THEN
        INSERT INTO student_lookup_audit_logs (
            actor_id, actor_name, actor_role, actor_department,
            queried_pid, lookup_result, denial_reason, ip_address, user_agent
        ) VALUES (
            v_actor_id, v_actor_name, v_actor_role, v_actor_dept,
            COALESCE(p_pid, ''), 'INVALID_FORMAT', 'Identifier must be between 4 and 32 alphanumeric characters', p_ip_address, p_user_agent
        );
        RETURN jsonb_build_object(
            'success', false,
            'error', 'INVALID_FORMAT',
            'message', 'Invalid identifier format. Please enter a valid institutional Student ID (e.g. EU20220084), University PRN, or Roll Number.'
        );
    END IF;

    -- 4. Query student record (matches student_id, pid, prn, or roll_number)
    SELECT * INTO v_record
    FROM imported_student_records
    WHERE LOWER(COALESCE(student_id, '')) = LOWER(v_sanitized_pid)
       OR LOWER(pid) = LOWER(v_sanitized_pid)
       OR LOWER(prn) = LOWER(v_sanitized_pid)
       OR LOWER(roll_number) = LOWER(v_sanitized_pid)
    LIMIT 1;

    -- 5. Handle Not Found
    IF NOT FOUND THEN
        INSERT INTO student_lookup_audit_logs (
            actor_id, actor_name, actor_role, actor_department,
            queried_pid, lookup_result, denial_reason, ip_address, user_agent
        ) VALUES (
            v_actor_id, v_actor_name, v_actor_role, v_actor_dept,
            v_sanitized_pid, 'NOT_FOUND', 'No student found matching queried identifier in authorized database', p_ip_address, p_user_agent
        );
        RETURN jsonb_build_object(
            'success', false,
            'error', 'STUDENT_NOT_FOUND',
            'message', 'No student record found matching identifier "' || v_sanitized_pid || '". Verify the number or contact the Academic Registrar.'
        );
    END IF;

    -- 6. Role-Based Access Control: Faculty scope restriction
    IF v_actor_role = 'faculty' AND v_actor_dept IS NOT NULL AND v_record.department_code != v_actor_dept THEN
        INSERT INTO student_lookup_audit_logs (
            actor_id, actor_name, actor_role, actor_department,
            queried_pid, lookup_result, student_department, denial_reason, ip_address, user_agent
        ) VALUES (
            v_actor_id, v_actor_name, v_actor_role, v_actor_dept,
            v_sanitized_pid, 'ACCESS_DENIED', v_record.department_code,
            'Faculty member (' || v_actor_dept || ') denied cross-department access to student in ' || v_record.department_code,
            p_ip_address, p_user_agent
        );
        RETURN jsonb_build_object(
            'success', false,
            'error', 'DEPARTMENT_RESTRICTION',
            'message', 'Access restricted: As a faculty member in ' || v_actor_dept || ', you are only authorized to view records within your department. This student belongs to ' || v_record.department_code || '.'
        );
    END IF;

    -- 7. Success: Log audit trail and return authorized profile
    INSERT INTO student_lookup_audit_logs (
        actor_id, actor_name, actor_role, actor_department,
        queried_pid, lookup_result, student_department, ip_address, user_agent
    ) VALUES (
        v_actor_id, v_actor_name, v_actor_role, v_actor_dept,
        v_sanitized_pid, 'SUCCESS', v_record.department_code, p_ip_address, p_user_agent
    );

    RETURN jsonb_build_object(
        'success', true,
        'source', v_record.source_type,
        'retrievedAt', NOW(),
        'student', jsonb_build_object(
            'studentId', COALESCE(v_record.student_id, v_record.pid),
            'pid', v_record.pid,
            'prn', v_record.prn,
            'rollNumber', v_record.roll_number,
            'firstName', v_record.first_name,
            'middleName', v_record.middle_name,
            'lastName', v_record.last_name,
            'fullName', v_record.first_name || ' ' || COALESCE(v_record.middle_name || ' ', '') || v_record.last_name,
            'department', v_record.department_code,
            'program', v_record.program_name,
            'academicYear', v_record.academic_year,
            'currentSemester', v_record.current_semester,
            'division', v_record.current_division,
            'status', v_record.status,
            'academicAdvisor', v_record.academic_advisor,
            'attendancePercentage', v_record.attendance_percentage,
            'attendanceDetails', v_record.attendance_details,
            'iaMarks', v_record.ia_marks,
            'semesterResults', v_record.semester_results,
            'sourceType', v_record.source_type,
            'lastVerified', v_record.last_verified_at
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
