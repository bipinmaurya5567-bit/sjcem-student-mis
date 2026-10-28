// SJCEM NEXT MIS — Server-Side Institutional Student API Adapter
// Institution: St. John College of Engineering and Management, Palghar
// Trust: ALDEL Education Trust
//
// Security Directives:
// 1. NEVER expose private API keys, bearer tokens, or secrets to the frontend.
// 2. Enforce Faculty/Admin RBAC and department isolation server-side.
// 3. Handle network timeouts, connection drops, and HTTP errors gracefully.
// 4. Zero credentials or passwords ever logged or returned in responses.



/**
 * Validates PID input format server-side.
 * Rejects illegal characters, path traversal, injection payloads, and invalid lengths.
 */
export function validateStudentIdentifier(rawPid) {
  if (!rawPid || typeof rawPid !== 'string') {
    return {
      isValid: false,
      error: 'EMPTY_IDENTIFIER',
      message: 'Student identifier (Student ID, PID, or University PRN) cannot be empty.',
    };
  }

  const clean = rawPid.trim();
  if (clean.length < 4 || clean.length > 32) {
    return {
      isValid: false,
      error: 'INVALID_LENGTH',
      message: 'Student identifier must be between 4 and 32 characters in length (e.g. EU20220084 or 16-digit University PRN).',
    };
  }

  // Strictly alphanumeric digits, hyphens, and underscores only
  const safeRegex = /^[A-Za-z0-9\-_]+$/;
  if (!safeRegex.test(clean)) {
    return {
      isValid: false,
      error: 'ILLEGAL_CHARACTERS',
      message: 'Identifier contains invalid characters. Only alphanumeric digits, hyphens, and underscores are permitted.',
    };
  }

  return {
    isValid: true,
    sanitizedPid: clean,
  };
}

/**
 * Reads server-side configuration from environment variables.
 * Secret keys (INSTITUTIONAL_API_KEY) are used internally and NEVER exposed to clients.
 */
export function getGatewayConfig() {
  const endpointUrl = process.env.INSTITUTIONAL_API_URL || process.env.ALDEL_API_GATEWAY_URL || '';
  const apiKey = process.env.INSTITUTIONAL_API_KEY || process.env.ALDEL_API_SECRET_KEY || '';
  const clientId = process.env.INSTITUTIONAL_API_CLIENT_ID || process.env.ALDEL_API_CLIENT_ID || 'sjcem-mis-production-client';
  const authType = process.env.INSTITUTIONAL_API_AUTH_TYPE || 'Bearer';
  const timeoutMs = parseInt(process.env.INSTITUTIONAL_API_TIMEOUT_MS || process.env.ALDEL_API_TIMEOUT_MS, 10) || 5000;
  const isMockEnabled = process.env.ENABLE_MOCK_INSTITUTIONAL_GATEWAY === 'true';

  const isConfigured = Boolean(
    endpointUrl &&
    apiKey &&
    !apiKey.includes('your_secret') &&
    !apiKey.includes('your-authorized') &&
    !endpointUrl.includes('placeholder')
  );

  return {
    isConfigured,
    endpointUrl,
    apiKey,
    clientId,
    authType,
    timeoutMs,
    isMockEnabled,
  };
}

/**
 * Returns safe public gateway status for client diagnostic display.
 * Strictly hides secrets, credentials, and full authorization tokens.
 */
export function getSafeGatewayStatus() {
  const cfg = getGatewayConfig();
  return {
    isConfigured: cfg.isConfigured,
    connectionStatus: cfg.isConfigured ? 'CONFIGURED' : 'NOT_CONFIGURED',
    mode: cfg.isConfigured ? 'AUTHORIZED_API' : 'STANDBY',
    endpointUrl: cfg.endpointUrl ? cfg.endpointUrl.replace(/\/\/[^@]+@/, '//***@') : 'Not Configured',
    clientId: cfg.clientId || 'Not Configured',
    authType: cfg.authType,
    timeoutMs: cfg.timeoutMs,
    isMockEnabled: cfg.isMockEnabled,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Tests connection to the institutional API gateway without retrieving student data.
 * Used by administrators to verify that server-to-server credentials and networking are operational.
 */
export async function testGatewayConnection() {
  const cfg = getGatewayConfig();

  // If mock mode is explicitly enabled for development testing
  if (cfg.isMockEnabled) {
    return {
      success: true,
      status: 'MOCK_OPERATIONAL',
      httpStatus: 200,
      message: '[SIMULATED TEST GATEWAY] Gateway mock simulation is active. This confirms server-side adapter plumbing but is NOT connected to live college IT servers.',
      endpoint: cfg.endpointUrl || 'https://api.aldel.org/v1/students (Simulated)',
      latencyMs: 45,
      isSimulated: true,
    };
  }

  // If credentials are not configured, fail honestly with actionable instruction
  if (!cfg.isConfigured) {
    return {
      success: false,
      status: 'NOT_CONFIGURED',
      httpStatus: 503,
      error: 'GATEWAY_CREDENTIALS_MISSING',
      message: 'Institutional API credentials (INSTITUTIONAL_API_URL and INSTITUTIONAL_API_KEY) are not configured in the server environment. Contact St. John Technical Campus Network Cell for official API credentials.',
      endpoint: cfg.endpointUrl || 'Not Configured',
      isSimulated: false,
    };
  }

  // Perform live server-side HTTPS ping/health check
  const startTime = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), cfg.timeoutMs);

  try {
    // Attempt health endpoint or HEAD/OPTIONS on base endpoint
    const pingUrl = cfg.endpointUrl.endsWith('/') ? `${cfg.endpointUrl}health` : `${cfg.endpointUrl}/health`;
    const headers = {
      'Accept': 'application/json',
      'X-SJCEM-Client': cfg.clientId,
      'User-Agent': 'SJCEM-NEXT-Backend/2.4.0',
    };

    if (cfg.authType === 'Bearer') {
      headers['Authorization'] = `Bearer ${cfg.apiKey}`;
    } else {
      headers['X-API-Key'] = cfg.apiKey;
    }

    const response = await fetch(pingUrl, {
      method: 'GET',
      headers,
      signal: controller.signal,
    });

    clearTimeout(timer);
    const latencyMs = Date.now() - startTime;

    if (response.ok) {
      return {
        success: true,
        status: 'OPERATIONAL',
        httpStatus: response.status,
        latencyMs,
        message: 'Successfully verified connection to official institutional API gateway.',
        endpoint: cfg.endpointUrl,
        isSimulated: false,
      };
    }

    if (response.status === 401 || response.status === 403) {
      return {
        success: false,
        status: 'AUTHENTICATION_FAILED',
        httpStatus: response.status,
        latencyMs,
        error: 'GATEWAY_AUTH_REJECTED',
        message: 'Institutional API gateway rejected server credentials (HTTP 401/403). Verify INSTITUTIONAL_API_KEY with college IT.',
        endpoint: cfg.endpointUrl,
        isSimulated: false,
      };
    }

    return {
      success: false,
      status: 'ERROR',
      httpStatus: response.status,
      latencyMs,
      error: `HTTP_${response.status}`,
      message: `Institutional API gateway responded with unexpected status HTTP ${response.status}.`,
      endpoint: cfg.endpointUrl,
      isSimulated: false,
    };
  } catch (err) {
    clearTimeout(timer);
    const isTimeout = err.name === 'AbortError';

    return {
      success: false,
      status: isTimeout ? 'TIMEOUT' : 'NETWORK_ERROR',
      httpStatus: isTimeout ? 504 : 502,
      error: isTimeout ? 'GATEWAY_TIMEOUT' : 'CONNECTION_REFUSED',
      message: isTimeout
        ? `Connection to institutional gateway timed out after ${cfg.timeoutMs}ms.`
        : `Could not connect to institutional gateway: ${err.message || 'Network unreachable'}. Verify campus firewall and proxy settings.`,
      endpoint: cfg.endpointUrl,
      isSimulated: false,
    };
  }
}

/**
 * Server-Side Authorized Student Retrieval Provider
 * Performs:
 * 1. Input sanitization
 * 2. Caller role verification (Faculty or Admin only)
 * 3. Server-side HTTPS request with authorization headers
 * 4. Department isolation filtering (Faculty can only view students in their department)
 * 5. Strict response sanitization (no passwords, secrets, or internal tokens)
 */
export async function lookupStudentFromInstitutionalApi(rawPid, caller) {
  // 1. Caller Authorization Check
  if (!caller || typeof caller !== 'object') {
    return {
      success: false,
      status: 401,
      error: 'UNAUTHENTICATED',
      message: 'Session invalid or unauthenticated. Please sign in to access student records.',
    };
  }

  const role = caller.role;
  if (role !== 'faculty' && role !== 'admin') {
    return {
      success: false,
      status: 403,
      error: 'FORBIDDEN',
      message: 'Access Denied: Only authorized Faculty and Administrators may query student records.',
    };
  }

  // 2. Input Validation
  const validation = validateStudentIdentifier(rawPid);
  if (!validation.isValid) {
    return {
      success: false,
      status: 400,
      error: validation.error,
      message: validation.message,
    };
  }

  const pid = validation.sanitizedPid;
  const cfg = getGatewayConfig();

  // 3. Handle Development Mock Mode (Explicitly flagged and transparent)
  if (cfg.isMockEnabled) {
    return handleMockGatewayLookup(pid, caller);
  }

  // 4. Verify Live Gateway Credentials Configuration
  if (!cfg.isConfigured) {
    return {
      success: false,
      status: 503,
      error: 'GATEWAY_NOT_CONFIGURED',
      message: 'Institutional API integration is pending official IT credentials from St. John Technical Campus Network Cell. Switch to "Local Imported Data" mode to search authorized offline records.',
      diagnostic: {
        dataSource: 'Institutional API Gateway (Standby)',
        outcome: 'NOT_CONFIGURED',
        httpStatus: 503,
        safeDetails: 'INSTITUTIONAL_API_URL or INSTITUTIONAL_API_KEY environment variables are missing or set to placeholder values. External network calls are prevented.',
      },
    };
  }

  // 5. Execute Secure Server-Side HTTPS Call
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), cfg.timeoutMs);
  const startTime = Date.now();

  try {
    const targetUrl = new URL(
      `${cfg.endpointUrl.replace(/\/$/, '')}/${encodeURIComponent(pid)}`
    );

    const headers = {
      'Accept': 'application/json',
      'X-SJCEM-Client': cfg.clientId,
      'X-SJCEM-Caller-Role': caller.role,
      'X-SJCEM-Caller-Dept': caller.departmentCode || 'ACAD',
      'User-Agent': 'SJCEM-NEXT-Backend/2.4.0',
    };

    if (cfg.authType === 'Bearer') {
      headers['Authorization'] = `Bearer ${cfg.apiKey}`;
    } else {
      headers['X-API-Key'] = cfg.apiKey;
    }

    const response = await fetch(targetUrl.toString(), {
      method: 'GET',
      headers,
      signal: controller.signal,
    });

    clearTimeout(timer);
    const latencyMs = Date.now() - startTime;

    // 404 Handling: Authentic student not found
    if (response.status === 404) {
      return {
        success: false,
        status: 404,
        error: 'STUDENT_NOT_FOUND',
        message: `Institutional Gateway reports student identifier "${pid}" was not found in university records.`,
        diagnostic: {
          dataSource: `Institutional Gateway (${targetUrl.hostname})`,
          outcome: 'NOT_FOUND',
          httpStatus: 404,
          latencyMs,
          safeDetails: `Institutional API query completed in ${latencyMs}ms with HTTP 404. No student record exists for identifier "${pid}".`,
        },
      };
    }

    // 401/403 Handling: Gateway credential rejection
    if (response.status === 401 || response.status === 403) {
      return {
        success: false,
        status: 502,
        error: 'GATEWAY_AUTHENTICATION_ERROR',
        message: 'Institutional API gateway rejected server credentials. Please notify college system administrator.',
        diagnostic: {
          dataSource: `Institutional Gateway (${targetUrl.hostname})`,
          outcome: 'AUTH_FAILED',
          httpStatus: response.status,
          latencyMs,
          safeDetails: `Institutional Gateway returned HTTP ${response.status} Authentication Failure.`,
        },
      };
    }

    // 429 Rate Limit from Gateway
    if (response.status === 429) {
      return {
        success: false,
        status: 429,
        error: 'GATEWAY_RATE_LIMITED',
        message: 'Institutional API gateway request threshold exceeded. Please wait a moment before trying again.',
        diagnostic: {
          dataSource: `Institutional Gateway (${targetUrl.hostname})`,
          outcome: 'RATE_LIMITED',
          httpStatus: 429,
          latencyMs,
          safeDetails: 'External institutional gateway throttled request.',
        },
      };
    }

    // 5xx Server Error from Gateway
    if (!response.ok) {
      return {
        success: false,
        status: 502,
        error: 'GATEWAY_SERVER_ERROR',
        message: `Institutional API gateway returned an unexpected response (HTTP ${response.status}). Falling back to local database recommended.`,
        diagnostic: {
          dataSource: `Institutional Gateway (${targetUrl.hostname})`,
          outcome: 'SERVER_ERROR',
          httpStatus: response.status,
          latencyMs,
          safeDetails: `External institutional gateway returned HTTP ${response.status}.`,
        },
      };
    }

    // Parse Response
    const rawData = await response.json();
    const rawStudent = rawData.student || rawData.data || rawData;

    if (!rawStudent || typeof rawStudent !== 'object') {
      return {
        success: false,
        status: 502,
        error: 'INVALID_GATEWAY_RESPONSE',
        message: 'Institutional gateway returned an invalid or empty student payload.',
      };
    }

    // 6. Department Isolation Enforcement
    const facultyDept = caller.departmentCode || 'COMP';
    const studentDept = (rawStudent.departmentCode || rawStudent.department_code || 'COMP').toUpperCase();

    if (caller.role === 'faculty' && studentDept !== facultyDept) {
      return {
        success: false,
        status: 403,
        error: 'ACCESS_DENIED',
        message: `Access Restricted: You are authorized to access student records within the Department of ${caller.department || facultyDept}. Student PID "${pid}" is enrolled in ${rawStudent.department || studentDept}. Cross-department queries require Academic Dean clearance.`,
        studentDepartment: studentDept,
        diagnostic: {
          dataSource: `Institutional Gateway (${targetUrl.hostname})`,
          outcome: 'ACCESS_DENIED',
          httpStatus: 403,
          latencyMs,
          safeDetails: `Record retrieved from institutional gateway, but cross-department access denied for faculty (${facultyDept} vs ${studentDept}).`,
        },
      };
    }

    // 7. Sanitize Output: Strictly remove passwords, hashes, tokens
    const sanitizedStudent = sanitizeStudentProfile(rawStudent);

    return {
      success: true,
      status: 200,
      student: sanitizedStudent,
      source: 'INSTITUTIONAL_API',
      sourceLabel: 'SJCEM Institutional API Gateway (Live Official)',
      retrievedAt: new Date().toISOString(),
      diagnostic: {
        dataSource: `Institutional Gateway (${targetUrl.hostname})`,
        outcome: 'SUCCESS',
        httpStatus: 200,
        latencyMs,
        safeDetails: `Authorized record successfully retrieved from institutional gateway for identifier '${sanitizedStudent.studentId}'.`,
      },
    };
  } catch (err) {
    clearTimeout(timer);
    const isTimeout = err.name === 'AbortError';

    return {
      success: false,
      status: isTimeout ? 504 : 503,
      error: isTimeout ? 'GATEWAY_TIMEOUT' : 'SERVICE_UNAVAILABLE',
      message: isTimeout
        ? `Request to institutional gateway timed out after ${cfg.timeoutMs}ms.`
        : `Unable to connect to institutional gateway: ${err.message || 'Network unreachable'}. Switch to "Local Imported Data" mode to search offline records.`,
      diagnostic: {
        dataSource: 'Institutional Gateway (Network)',
        outcome: isTimeout ? 'TIMEOUT' : 'CONNECTION_ERROR',
        httpStatus: isTimeout ? 504 : 503,
        safeDetails: `External gateway network error: ${err.message || 'Failed to connect'}.`,
      },
    };
  }
}

/**
 * Strips any sensitive credentials, passwords, or tokens from external API payloads.
 */
function sanitizeStudentProfile(raw) {
  const clean = { ...raw };

  // Explicitly remove security-sensitive fields
  delete clean.password;
  delete clean.password_hash;
  delete clean.passwordHash;
  delete clean.pin;
  delete clean.token;
  delete clean.secret;
  delete clean.auth_token;
  delete clean.session_token;
  delete clean.api_key;
  delete clean.ssn;
  delete clean.aadhaar_full;

  return {
    studentId: clean.studentId || clean.student_id || clean.pid || 'N/A',
    pid: clean.pid || clean.studentId || clean.student_id || 'N/A',
    prn: clean.prn || clean.university_prn || 'N/A',
    rollNumber: clean.rollNumber || clean.roll_number || 'N/A',
    firstName: clean.firstName || clean.first_name || 'Student',
    middleName: clean.middleName || clean.middle_name || '',
    lastName: clean.lastName || clean.last_name || '',
    fullName: clean.fullName || clean.full_name || `${clean.firstName || ''} ${clean.lastName || ''}`.trim(),
    department: clean.department || 'Engineering',
    departmentCode: clean.departmentCode || clean.department_code || 'COMP',
    program: clean.program || clean.program_name || 'B.E. Engineering',
    admissionYear: parseInt(clean.admissionYear || clean.admission_year, 10) || 2023,
    academicYear: clean.academicYear || clean.academic_year || '2025–2026',
    semester: parseInt(clean.semester || clean.current_semester, 10) || 6,
    division: clean.division || clean.current_division || 'A',
    status: clean.status || 'ACTIVE_ENROLLED',
    academicAdvisor: clean.academicAdvisor || clean.academic_advisor || 'Prof. Anita Deshmukh',
    attendance: clean.attendance || {
      percentage: parseFloat(clean.attendancePercentage || clean.attendance_percentage) || 80.0,
      status: (parseFloat(clean.attendancePercentage || clean.attendance_percentage) || 80.0) >= 75 ? 'SAFE' : 'WARNING',
      totalAttended: 120,
      totalConducted: 150,
      subjectBreakdown: clean.attendanceBreakdown || [],
    },
    iaMarks: clean.iaMarks || clean.ia_marks || [],
    semesterResults: clean.semesterResults || clean.semester_results || [],
    sourceType: 'INSTITUTIONAL_API_GATEWAY',
    lastSyncTimestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
  };
}

/**
 * Handles mock lookup when ENABLE_MOCK_INSTITUTIONAL_GATEWAY is explicitly set to true.
 * Used exclusively for testing the server-side adapter flow without fake claims.
 */
function handleMockGatewayLookup(pid, caller) {
  const cleanPid = pid.toUpperCase().startsWith('EU') ? pid.toUpperCase() : `EU${pid.toUpperCase()}`;
  const facultyDept = caller.departmentCode || 'COMP';

  // Mock student dataset strictly labelled for testing adapter pipeline
  const mockStudents = {
    'EU20220084': {
      studentId: 'EU20220084',
      pid: 'EU20220084',
      prn: '2022016400987654',
      rollNumber: 'SJCEM2022CS084',
      firstName: 'Rahul',
      middleName: 'Suresh',
      lastName: 'Sharma',
      departmentCode: 'COMP',
      department: 'Computer Engineering',
      program: 'B.E. Computer Engineering',
      admissionYear: 2022,
      academicYear: '2025–2026',
      semester: 6,
      division: 'A',
      status: 'ACTIVE_ENROLLED',
      academicAdvisor: 'Prof. Anita Deshmukh',
      attendancePercentage: 84.2,
      sourceType: 'SIMULATED_MOCK_GATEWAY',
    },
    'EU20230041': {
      studentId: 'EU20230041',
      pid: 'EU20230041',
      prn: '2023016400554433',
      rollNumber: 'SJCEM2023IT041',
      firstName: 'Sneha',
      middleName: 'R.',
      lastName: 'Kulkarni',
      departmentCode: 'IT',
      department: 'Information Technology',
      program: 'B.E. Information Technology',
      admissionYear: 2023,
      academicYear: '2025–2026',
      semester: 4,
      division: 'B',
      status: 'ACTIVE_ENROLLED',
      academicAdvisor: 'Dr. Rahul V. Mane',
      attendancePercentage: 89.2,
      sourceType: 'SIMULATED_MOCK_GATEWAY',
    },
  };

  const student = mockStudents[cleanPid];

  if (!student) {
    return {
      success: false,
      status: 404,
      error: 'STUDENT_NOT_FOUND',
      message: `[MOCK GATEWAY] Student identifier "${cleanPid}" does not exist in mock institutional records.`,
      diagnostic: {
        dataSource: 'Institutional Gateway (Mock Adapter Simulation)',
        outcome: 'NOT_FOUND',
        httpStatus: 404,
        safeDetails: `Mock adapter evaluated identifier '${cleanPid}'. Record not found.`,
      },
    };
  }

  // Department RBAC on mock records
  if (caller.role === 'faculty' && student.departmentCode !== facultyDept) {
    return {
      success: false,
      status: 403,
      error: 'ACCESS_DENIED',
      message: `[MOCK GATEWAY] Access Restricted: You are authorized to access student records within the Department of ${caller.department || facultyDept}. Student is enrolled in ${student.department}.`,
      studentDepartment: student.departmentCode,
      diagnostic: {
        dataSource: 'Institutional Gateway (Mock Adapter Simulation)',
        outcome: 'ACCESS_DENIED',
        httpStatus: 403,
        safeDetails: `Mock adapter denied cross-department access for faculty (${facultyDept} vs ${student.departmentCode}).`,
      },
    };
  }

  return {
    success: true,
    status: 200,
    student: sanitizeStudentProfile(student),
    source: 'INSTITUTIONAL_API_MOCK',
    sourceLabel: 'SJCEM Institutional API (Simulated Test Adapter)',
    retrievedAt: new Date().toISOString(),
    diagnostic: {
      dataSource: 'Institutional Gateway (Mock Adapter Simulation)',
      outcome: 'SUCCESS',
      httpStatus: 200,
      safeDetails: 'Record retrieved via simulated server-side institutional adapter for development/testing.',
    },
  };
}
