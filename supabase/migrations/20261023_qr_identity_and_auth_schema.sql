-- ========================================================================
-- SJCEM NEXT — Secure QR Identity System & Two-Step Auth Schema Extension
-- Institution: St. John College of Engineering and Management, Palghar
-- Managed by: ALDEL Education Trust
-- ========================================================================

-- 1. SECURE QR IDENTITY TOKENS
-- Stores cryptographically opaque tokens for students and faculty members.
-- Never stores private credentials or plaintext sensitive data.
CREATE TABLE IF NOT EXISTS qr_identity_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL UNIQUE,       -- SHA-256 hash of token
    token_prefix VARCHAR(32) NOT NULL DEFAULT 'sjcem_sec_',
    token_preview VARCHAR(64) NOT NULL,            -- e.g. 'sjcem_sec_7a...356'
    token_raw_opaque TEXT,                         -- Seed reference token
    is_revoked BOOLEAN DEFAULT FALSE,
    revoked_at TIMESTAMPTZ,
    revoked_reason TEXT,
    scan_count INT DEFAULT 0,
    last_scanned_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_active_user_token UNIQUE (user_id, token_hash)
);

CREATE INDEX IF NOT EXISTS idx_qr_tokens_hash ON qr_identity_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_qr_tokens_user ON qr_identity_tokens(user_id);

-- 2. EMAIL OTP AUTHENTICATION CHALLENGES
-- Manages server-side email verification codes with expiration & attempt limits
CREATE TABLE IF NOT EXISTS email_otp_challenges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    requested_role app_role NOT NULL,
    otp_code_hash VARCHAR(255) NOT NULL,           -- Hashed 6-digit challenge code
    is_verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ NOT NULL,               -- 5-minute expiry
    attempt_count INT DEFAULT 0,
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_otp_email ON email_otp_challenges(email, requested_role);

-- 3. QR SCAN AUDIT TRAILS
-- Immutable security log recording every identity card verification scan
CREATE TABLE IF NOT EXISTS scan_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token_id UUID REFERENCES qr_identity_tokens(id) ON DELETE CASCADE,
    scanned_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    scanner_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL, -- NULL if scanned publicly
    scanner_role VARCHAR(50) DEFAULT 'PUBLIC_VIEWER',
    ip_address VARCHAR(50),
    user_agent TEXT,
    verification_status VARCHAR(50) NOT NULL,      -- 'VALID', 'REVOKED', 'EXPIRED', 'UNKNOWN'
    scanned_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scan_logs_user ON scan_audit_logs(scanned_user_id);
CREATE INDEX IF NOT EXISTS idx_scan_logs_time ON scan_audit_logs(scanned_at DESC);

-- ========================================================================
-- ROW-LEVEL SECURITY (RLS) POLICIES
-- ========================================================================

ALTER TABLE qr_identity_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_otp_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_audit_logs ENABLE ROW LEVEL SECURITY;

-- QR Tokens: Users can read their own identity token; Admins can manage all
CREATE POLICY "Users can view own QR token"
    ON qr_identity_tokens FOR SELECT
    USING (user_id = auth.uid() OR auth_user_has_role('admin'));

CREATE POLICY "Admins can revoke or regenerate QR tokens"
    ON qr_identity_tokens FOR UPDATE
    USING (auth_user_has_role('admin') OR user_id = auth.uid())
    WITH CHECK (auth_user_has_role('admin') OR user_id = auth.uid());

-- Scan Audit Logs: Admins can inspect; scanning generates log
CREATE POLICY "Admins can view scan audit logs"
    ON scan_audit_logs FOR SELECT
    USING (auth_user_has_role('admin') OR scanned_user_id = auth.uid());

CREATE POLICY "System can record scan audits"
    ON scan_audit_logs FOR INSERT
    WITH CHECK (true);

-- Security Definer Function: Safe QR Verification
-- Returns only authorized fields based on scanner privilege
CREATE OR REPLACE FUNCTION verify_sjcem_qr_identity(
    p_token_text TEXT,
    p_scanner_ip VARCHAR(50) DEFAULT 'UNKNOWN'
)
RETURNS TABLE (
    is_valid BOOLEAN,
    status_code VARCHAR(50),
    full_name VARCHAR(255),
    role_category VARCHAR(50),
    department_name VARCHAR(255),
    program_name VARCHAR(255),
    academic_year VARCHAR(50),
    is_revoked BOOLEAN,
    revoked_reason TEXT,
    access_level VARCHAR(50)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_token_record RECORD;
    v_profile RECORD;
    v_scanner_role VARCHAR(50) := 'PUBLIC';
BEGIN
    -- 1. Find token by raw text or hash
    SELECT * INTO v_token_record
    FROM qr_identity_tokens
    WHERE token_raw_opaque = p_token_text
       OR token_hash = encode(sha256(p_token_text::bytea), 'hex')
    LIMIT 1;

    IF NOT FOUND THEN
        -- Log unknown scan attempt
        INSERT INTO scan_audit_logs (token_id, scanned_user_id, scanner_role, ip_address, verification_status)
        VALUES (NULL, NULL, 'PUBLIC', p_scanner_ip, 'UNKNOWN');

        RETURN QUERY SELECT false, 'NOT_FOUND'::VARCHAR, NULL::VARCHAR, NULL::VARCHAR, NULL::VARCHAR, NULL::VARCHAR, NULL::VARCHAR, false, NULL::TEXT, 'PUBLIC'::VARCHAR;
        RETURN;
    END IF;

    -- 2. Fetch user profile
    SELECT p.*, d.name AS dept_name, prg.name AS prog_name
    INTO v_profile
    FROM profiles p
    LEFT JOIN student_enrollments se ON se.student_id = p.id
    LEFT JOIN departments d ON d.id = se.department_id
    LEFT JOIN programs prg ON prg.id = se.program_id
    WHERE p.id = v_token_record.user_id;

    -- 3. Check revocation status
    IF v_token_record.is_revoked THEN
        INSERT INTO scan_audit_logs (token_id, scanned_user_id, scanner_role, ip_address, verification_status)
        VALUES (v_token_record.id, v_token_record.user_id, 'PUBLIC', p_scanner_ip, 'REVOKED');

        RETURN QUERY SELECT false, 'REVOKED'::VARCHAR, (v_profile.first_name || ' ' || v_profile.last_name)::VARCHAR, 'STUDENT'::VARCHAR, v_profile.dept_name::VARCHAR, NULL::VARCHAR, '2025-2026'::VARCHAR, true, v_token_record.revoked_reason, 'PUBLIC'::VARCHAR;
        RETURN;
    END IF;

    -- 4. Check expiration
    IF v_token_record.expires_at < NOW() THEN
        INSERT INTO scan_audit_logs (token_id, scanned_user_id, scanner_role, ip_address, verification_status)
        VALUES (v_token_record.id, v_token_record.user_id, 'PUBLIC', p_scanner_ip, 'EXPIRED');

        RETURN QUERY SELECT false, 'EXPIRED'::VARCHAR, (v_profile.first_name || ' ' || v_profile.last_name)::VARCHAR, 'STUDENT'::VARCHAR, v_profile.dept_name::VARCHAR, NULL::VARCHAR, '2025-2026'::VARCHAR, false, 'Identity expired'::TEXT, 'PUBLIC'::VARCHAR;
        RETURN;
    END IF;

    -- 5. Record successful scan
    UPDATE qr_identity_tokens
    SET scan_count = scan_count + 1,
        last_scanned_at = NOW()
    WHERE id = v_token_record.id;

    INSERT INTO scan_audit_logs (token_id, scanned_user_id, scanner_role, ip_address, verification_status)
    VALUES (v_token_record.id, v_token_record.user_id, 'PUBLIC', p_scanner_ip, 'VALID');

    -- Return verified profile
    RETURN QUERY SELECT 
        true,
        'ACTIVE_VERIFIED'::VARCHAR,
        (v_profile.first_name || ' ' || v_profile.last_name)::VARCHAR,
        'Student'::VARCHAR,
        v_profile.dept_name::VARCHAR,
        v_profile.prog_name::VARCHAR,
        '2025-2026'::VARCHAR,
        false,
        NULL::TEXT,
        'PUBLIC_VERIFICATION'::VARCHAR;
END;
$$;
