// SJCEM NEXT MIS — Authorized Student Information Retrieval & Integration Service
// Institution: St. John College of Engineering and Management, Palghar
// Trust: ALDEL Education Trust

import { misStore } from './store.js';

// Rate Limiter tracking state (per-user request sliding window)
const rateLimiterState = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 20;

/**
 * Validates PID input format.
 * SJCEM & Mumbai University PRNs are typically 16 numeric digits (e.g. 2022016400987654)
 * or institutional enrollment IDs between 6 and 20 alphanumeric characters (e.g. SJCEM2022CS084).
 */
export function validatePidFormat(rawPid) {
  if (!rawPid || typeof rawPid !== 'string') {
    return {
      isValid: false,
      error: 'EMPTY_PID',
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

  // Reject malicious input or symbols (strictly alphanumeric and hyphen/underscore)
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
 * Checks if the caller has exceeded the rate limit.
 */
function checkRateLimit(userId) {
  const now = Date.now();
  const userHistory = rateLimiterState.get(userId) || [];

  // Filter out timestamps outside the active window
  const activeHistory = userHistory.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);

  if (activeHistory.length >= MAX_REQUESTS_PER_WINDOW) {
    const oldest = activeHistory[0];
    const waitSeconds = Math.ceil((RATE_LIMIT_WINDOW_MS - (now - oldest)) / 1000);
    return {
      allowed: false,
      waitSeconds,
    };
  }

  activeHistory.push(now);
  rateLimiterState.set(userId, activeHistory);

  return {
    allowed: true,
    remaining: MAX_REQUESTS_PER_WINDOW - activeHistory.length,
  };
}

/**
 * Core Authorized Student Retrieval Function
 * Performs strict RBAC authorization, input sanitation, rate limiting, and audit logging.
 */
export async function retrieveStudentByPid(rawPid, options = {}) {
  // 1. Session & Authentication Verification
  if (!misStore.isUserAuthenticated()) {
    return {
      success: false,
      error: 'UNAUTHENTICATED',
      message: 'Session invalid or unauthenticated. Please sign in to access student records.',
      status: 401,
    };
  }

  const currentUser = misStore.getCurrentUser();
  const callerRole = currentUser.role;

  // 2. Strict Role Enforcement: Students CANNOT look up arbitrary student records
  if (callerRole === 'student') {
    misStore.addLookupAuditLog({
      queriedPid: rawPid || 'UNKNOWN',
      lookupResult: 'ACCESS_DENIED',
      details: `Student account ${currentUser.email} attempted unauthorized PID search.`,
    });

    return {
      success: false,
      error: 'FORBIDDEN',
      message: 'Access Denied: Student accounts are not authorized to query other student records.',
      status: 403,
    };
  }

  // 3. Input Validation
  const validation = validatePidFormat(rawPid);
  if (!validation.isValid) {
    misStore.addLookupAuditLog({
      queriedPid: rawPid || '',
      lookupResult: 'INVALID_FORMAT',
      details: `Validation failed: ${validation.message}`,
    });

    return {
      success: false,
      error: validation.error,
      message: validation.message,
      status: 400,
    };
  }

  const pid = validation.sanitizedPid;

  // 4. Rate Limiting Check
  const rateLimit = checkRateLimit(currentUser.id);
  if (!rateLimit.allowed) {
    misStore.addLookupAuditLog({
      queriedPid: pid,
      lookupResult: 'RATE_LIMITED',
      details: `Exceeded request rate limit of ${MAX_REQUESTS_PER_WINDOW} req/min.`,
    });

    return {
      success: false,
      error: 'RATE_LIMIT_EXCEEDED',
      message: `Request rate limit reached. Please wait ${rateLimit.waitSeconds} seconds before performing another lookup.`,
      status: 429,
    };
  }

  // 5. Artificial latency simulation (for authentic loading states)
  const delay = options.simulateLatency !== undefined ? options.simulateLatency : 450;
  if (delay > 0) {
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  // 6. Check Active Integration Mode
  const config = misStore.getIntegrationConfig();

  // Mode B: External Server-to-Server Gateway (Configured / Standby / Testing)
  if (config.integrationMode === 'AUTHORIZED_API') {
    return await executeExternalApiLookup(pid, currentUser, config);
  }

  // Mode A: Authorized Local Database (CSV Imported Records)
  return executeLocalImportLookup(pid, currentUser, config);
}

/**
 * Development-only Diagnostic Trace Builder
 * Produces secure diagnostic metadata: data source, columns evaluated, safe query outcome.
 * Strict Security: ZERO passwords, ZERO student private credentials, ZERO secrets exposed.
 */
export function buildDiagnosticTrace({
  rawInput,
  sanitizedPid,
  outcomeCode,
  httpStatus,
  safeDetails,
  dataSource = 'Local Database (table: imported_student_records)',
  matchedDepartment = null,
}) {
  const clean = sanitizedPid ? String(sanitizedPid).trim().toLowerCase() : '';
  const cleanNoEu = clean.startsWith('eu') ? clean.slice(2) : clean;
  const cleanWithEu = clean.startsWith('eu') ? clean : `eu${clean}`;

  return {
    timestamp: new Date().toISOString(),
    dataSource,
    table: 'imported_student_records',
    queriedInput: {
      rawLength: rawInput ? String(rawInput).length : 0,
      sanitized: sanitizedPid || 'EMPTY',
    },
    normalizationApplied: {
      trimWhitespace: true,
      stripBomAndZeroWidth: true,
      caseInsensitive: true,
      evaluatedVariants: [sanitizedPid, cleanWithEu, cleanNoEu].filter(Boolean),
    },
    columnsEvaluated: ['student_id', 'pid', 'prn', 'roll_number'],
    outcome: {
      code: outcomeCode,
      httpStatus,
      safeMessage: safeDetails,
    },
    matchedDepartment,
    databaseMetrics: {
      officialRecords: typeof misStore.getOfficialStudentCount === 'function' ? misStore.getOfficialStudentCount() : 0,
      syntheticSeedRecords: typeof misStore.getSeedStudentCount === 'function' ? misStore.getSeedStudentCount() : 0,
      totalRecordsInStore: misStore.getImportedStudents().length,
      hasOfficialRoster: typeof misStore.hasOfficialRoster === 'function' ? misStore.hasOfficialRoster() : false,
    },
  };
}

/**
 * Handles lookup against local imported database records with Department RBAC
 */
function executeLocalImportLookup(pid, currentUser, _config) {
  const student = misStore.findStudentByPid(pid);

  // Handle NOT FOUND
  if (!student) {
    misStore.addLookupAuditLog({
      queriedPid: pid,
      lookupResult: 'NOT_FOUND',
      details: `PID "${pid}" was not found in authorized imported records.`,
    });

    const officialCount = typeof misStore.getOfficialStudentCount === 'function' ? misStore.getOfficialStudentCount() : 0;
    const seedCount = typeof misStore.getSeedStudentCount === 'function' ? misStore.getSeedStudentCount() : 0;

    return {
      success: false,
      error: 'STUDENT_NOT_FOUND',
      message: `No student record found matching PID or PRN "${pid}". Verify the number or consult the Academic Registrar.`,
      status: 404,
      source: 'LOCAL_CSV_IMPORT',
      retrievedAt: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      diagnosticTrace: buildDiagnosticTrace({
        rawInput: pid,
        sanitizedPid: pid,
        outcomeCode: 'STUDENT_NOT_FOUND',
        httpStatus: 404,
        safeDetails: `No matching row in table 'imported_student_records' for identifier '${pid}' across columns [student_id, pid, prn, roll_number]. Local database currently contains ${officialCount} official records and ${seedCount} sample seed test records.${officialCount === 0 ? ' Notice: Official college roster has not been imported yet.' : ''}`,
        dataSource: 'Local Database (table: imported_student_records)',
      }),
    };
  }

  // 7. Role-Based Access Control: Faculty Department Isolation
  // Faculty can only view students enrolled in their own department
  const facultyDept = currentUser.departmentCode || 'COMP';
  if (currentUser.role === 'faculty' && student.departmentCode !== facultyDept) {
    misStore.addLookupAuditLog({
      queriedPid: pid,
      lookupResult: 'ACCESS_DENIED',
      studentDepartment: student.departmentCode,
      details: `Faculty (${facultyDept}) attempted cross-department access to student in ${student.departmentCode}.`,
    });

    return {
      success: false,
      error: 'ACCESS_DENIED',
      message: `Access Restricted: You are authorized to access student records within the Department of ${currentUser.department || facultyDept}. Student PID "${pid}" is enrolled in ${student.department}. For cross-departmental academic access, contact the Academic Dean.`,
      status: 403,
      studentDepartment: student.department,
      source: 'LOCAL_CSV_IMPORT',
      diagnosticTrace: buildDiagnosticTrace({
        rawInput: pid,
        sanitizedPid: pid,
        outcomeCode: 'ACCESS_DENIED',
        httpStatus: 403,
        safeDetails: `Row matching identifier '${pid}' was located in table 'imported_student_records', but caller authorization was denied by Department Access Control. Caller Department: '${facultyDept}', Student Department: '${student.departmentCode}'.`,
        dataSource: 'Local Database (table: imported_student_records)',
        matchedDepartment: student.departmentCode,
      }),
    };
  }

  // 8. Success: Return sanitized student profile (Strictly NO passwords or credentials)
  misStore.addLookupAuditLog({
    queriedPid: pid,
    lookupResult: 'SUCCESS',
    studentDepartment: student.departmentCode,
    details: `Successfully retrieved academic record for ${student.firstName} ${student.lastName} (${student.departmentCode})`,
  });

  return {
    success: true,
    student: {
      studentId: student.studentId || (String(student.pid).toUpperCase().startsWith('EU') ? student.pid : `EU${student.pid}`),
      pid: student.pid,
      prn: student.prn,
      rollNumber: student.rollNumber,
      firstName: student.firstName,
      middleName: student.middleName || '',
      lastName: student.lastName,
      fullName: `${student.firstName} ${student.middleName ? student.middleName + ' ' : ''}${student.lastName}`,
      department: student.department,
      departmentCode: student.departmentCode,
      program: student.program,
      admissionYear: student.admissionYear,
      academicYear: student.academicYear,
      semester: student.semester,
      division: student.division,
      status: student.status,
      academicAdvisor: student.academicAdvisor,
      attendance: student.attendance,
      iaMarks: student.iaMarks || [],
      semesterResults: student.semesterResults || [],
      sourceType: student.sourceType || 'LOCAL_CSV_IMPORT',
      lastSyncTimestamp: student.lastSyncTimestamp || '2026-10-24 10:15:00',
    },
    source: 'LOCAL_CSV_IMPORT',
    sourceLabel: student.sourceType === 'OFFICIAL_ROSTER_IMPORT' ? 'Official College Roster (Local Database)' : 'Imported Student Records (Local DB)',
    retrievedAt: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' +
                 new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    diagnosticTrace: buildDiagnosticTrace({
      rawInput: pid,
      sanitizedPid: pid,
      outcomeCode: 'SUCCESS',
      httpStatus: 200,
      safeDetails: `Authorized record retrieved from table 'imported_student_records'. Matching identifier: '${student.studentId || student.pid}', Department: '${student.departmentCode}'. Record classification: ${student.sourceType === 'OFFICIAL_ROSTER_IMPORT' ? 'Official College Roster' : 'Sample Seed Test Record'}.`,
      dataSource: 'Local Database (table: imported_student_records)',
      matchedDepartment: student.departmentCode,
    }),
  };
}

/**
 * Handles lookup via official authorized API gateway via server-side proxy.
 * Keeps credentials confidential, enforces server RBAC and rate limits, and prevents CORS failures.
 */
async function executeExternalApiLookup(pid, currentUser, config) {
  const timeoutMs = config.apiTimeoutMs || 5000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs + 1000);

  try {
    const callerPayload = {
      id: currentUser.id,
      email: currentUser.email,
      role: currentUser.role,
      departmentCode: currentUser.departmentCode || 'COMP',
      department: currentUser.department || 'Computer Engineering',
    };

    const response = await fetch('/api/v1/students/lookup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ pid, caller: callerPayload }),
      signal: controller.signal,
    });

    clearTimeout(timer);
    const data = await response.json();

    if (!response.ok || !data.success) {
      misStore.addLookupAuditLog({
        queriedPid: pid,
        lookupResult: data.error === 'STUDENT_NOT_FOUND' ? 'NOT_FOUND' : data.error === 'ACCESS_DENIED' ? 'ACCESS_DENIED' : 'GATEWAY_ERROR',
        details: data.message || `Institutional API responded with HTTP ${response.status}`,
      });

      return {
        success: false,
        error: data.error || `HTTP_${response.status}`,
        message: data.message || `External College Gateway returned an unexpected error (${response.status}).`,
        status: response.status,
        source: 'COLLEGE_API',
        retrievedAt: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        diagnosticTrace: buildDiagnosticTrace({
          rawInput: pid,
          sanitizedPid: pid,
          outcomeCode: data.error || `HTTP_${response.status}`,
          httpStatus: response.status,
          safeDetails: (data.diagnostic && data.diagnostic.safeDetails) || data.message,
          dataSource: (data.diagnostic && data.diagnostic.dataSource) || 'Institutional Gateway (Server Proxy)',
        }),
      };
    }

    // Success: record retrieved
    misStore.addLookupAuditLog({
      queriedPid: pid,
      lookupResult: 'SUCCESS',
      studentDepartment: data.student?.departmentCode,
      details: `Retrieved record via Institutional Gateway for ${data.student?.fullName || pid}`,
    });

    return {
      success: true,
      student: data.student,
      source: 'COLLEGE_API',
      sourceLabel: data.sourceLabel || 'SJCEM Institutional Gateway (Live Authorized API)',
      retrievedAt: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' +
                   new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      diagnosticTrace: buildDiagnosticTrace({
        rawInput: pid,
        sanitizedPid: pid,
        outcomeCode: 'SUCCESS',
        httpStatus: 200,
        safeDetails: (data.diagnostic && data.diagnostic.safeDetails) || 'Authorized student record retrieved via server-side institutional gateway.',
        dataSource: (data.diagnostic && data.diagnostic.dataSource) || 'Institutional Gateway (Server Proxy)',
        matchedDepartment: data.student?.departmentCode,
      }),
    };
  } catch (err) {
    clearTimeout(timer);
    const isTimeout = err.name === 'AbortError';
    const errorMsg = isTimeout
      ? `Institutional API request timed out after ${timeoutMs}ms.`
      : `Institutional Gateway proxy error: ${err.message || 'Service unavailable'}.`;

    misStore.addLookupAuditLog({
      queriedPid: pid,
      lookupResult: 'GATEWAY_UNAVAILABLE',
      details: errorMsg,
    });

    return {
      success: false,
      error: isTimeout ? 'TIMEOUT' : 'SERVICE_UNAVAILABLE',
      message: `${errorMsg} Switch to "Local Imported Data" mode to query verified offline records.`,
      status: isTimeout ? 504 : 503,
      source: 'COLLEGE_API',
      retrievedAt: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      diagnosticTrace: buildDiagnosticTrace({
        rawInput: pid,
        sanitizedPid: pid,
        outcomeCode: isTimeout ? 'TIMEOUT' : 'SERVICE_UNAVAILABLE',
        httpStatus: isTimeout ? 504 : 503,
        safeDetails: errorMsg,
        dataSource: 'Institutional Gateway (Server Proxy)',
      }),
    };
  }
}

/**
 * Queries the server-side institutional gateway configuration & health status.
 * Never leaks credentials.
 */
export async function fetchInstitutionalGatewayStatus() {
  try {
    const res = await fetch('/api/v1/integration/status');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    return {
      isConfigured: false,
      connectionStatus: 'UNAVAILABLE',
      mode: 'OFFLINE',
      message: err.message,
    };
  }
}

/**
 * Initiates an authorized server-side ping test against the institutional gateway.
 */
export async function testInstitutionalGatewayConnection() {
  try {
    const res = await fetch('/api/v1/integration/test-connection', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    return await res.json();
  } catch (err) {
    return {
      success: false,
      status: 'NETWORK_ERROR',
      httpStatus: 503,
      error: 'CONNECTION_FAILED',
      message: `Failed to contact backend server proxy: ${err.message}`,
    };
  }
}

/**
 * Comprehensive Spreadsheet Roster Parser (CSV, TSV, and Excel .xlsx/.xls)
 * Supports dynamic column alias detection, full-name splitting, duplicate detection, and validation.
 */
export function parseSpreadsheetRoster(input, fileNameOrType = 'file.csv', options = {}) {
  if (!input) {
    return { success: false, error: 'Empty or invalid spreadsheet content provided.' };
  }

  let csvText = '';

  // 1. If input is ArrayBuffer or Uint8Array (binary Excel file)
  if (typeof ArrayBuffer !== 'undefined' && (input instanceof ArrayBuffer || input instanceof Uint8Array)) {
    if (typeof window !== 'undefined' && window.XLSX) {
      try {
        const wb = window.XLSX.read(input, { type: 'array' });
        if (!wb.SheetNames || wb.SheetNames.length === 0) {
          return { success: false, error: 'Excel workbook contains no sheets.' };
        }
        const firstSheet = wb.Sheets[wb.SheetNames[0]];
        csvText = window.XLSX.utils.sheet_to_csv(firstSheet);
      } catch (err) {
        return { success: false, error: `Failed to parse Excel workbook: ${err.message || 'Corrupted file'}` };
      }
    } else {
      return { success: false, error: 'Excel parser (SheetJS) is not loaded in current environment.' };
    }
  } else if (typeof input === 'string') {
    csvText = input;
  } else {
    return { success: false, error: 'Unsupported input format. Please upload a .csv, .xlsx, .xls, or .tsv file.' };
  }

  // Strip UTF-8 BOM if present
  csvText = csvText.replace(/^\uFEFF/, '').trim();

  if (!csvText) {
    return { success: false, error: 'Spreadsheet content is empty after trimming.' };
  }

  // Split lines
  const lines = csvText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) {
    return { success: false, error: 'Spreadsheet must contain a header row and at least one student data row.' };
  }

  // Detect delimiter in header line (comma, tab, semicolon)
  const firstLine = lines[0];
  let delimiter = ',';
  if (firstLine.includes('\t') && firstLine.split('\t').length >= firstLine.split(',').length) {
    delimiter = '\t';
  } else if (firstLine.includes(';') && firstLine.split(';').length > firstLine.split(',').length) {
    delimiter = ';';
  }

  // Helper to split row by delimiter respecting quotes
  function parseRowCells(rowStr, sep) {
    const cells = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < rowStr.length; i++) {
      const char = rowStr[i];
      if (char === '"' || char === "'") {
        inQuotes = !inQuotes;
      } else if (char === sep && !inQuotes) {
        cells.push(cur.trim());
        cur = '';
      } else {
        cur += char;
      }
    }
    cells.push(cur.trim());
    return cells.map((c) => c.replace(/^["']|["']$/g, '').trim());
  }

  const rawHeaders = parseRowCells(firstLine, delimiter);
  const cleanHeaders = rawHeaders.map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ''));

  // Column aliases dictionary
  const aliasMap = {
    studentId: ['studentid', 'student_id', 'student id', 'pid', 'enrollment_no', 'enrollment no', 'enrollmentid', 'gr_no', 'gr no'],
    prn: ['prn', 'university_prn', 'university prn', 'mu_prn', 'reg_no', 'reg no'],
    rollNumber: ['rollnumber', 'roll_number', 'roll no', 'roll_no', 'roll', 'class_roll'],
    fullName: ['fullname', 'full_name', 'student_name', 'student name', 'candidate_name', 'name'],
    firstName: ['firstname', 'first_name', 'first'],
    middleName: ['middlename', 'middle_name', 'middle', 'father_name', 'father name'],
    lastName: ['lastname', 'last_name', 'last', 'surname'],
    department: ['department', 'dept', 'branch', 'department_code', 'dept_code', 'course', 'stream'],
    semester: ['semester', 'sem', 'term', 'current_semester'],
    division: ['division', 'div', 'section', 'sec'],
    admissionYear: ['admissionyear', 'admission_year', 'year_of_admission', 'batch', 'year'],
    academicYear: ['academicyear', 'academic_year', 'session'],
    status: ['status', 'enrollment_status'],
    academicAdvisor: ['advisor', 'academicadvisor', 'academic_advisor', 'mentor', 'guide'],
    attendance: ['attendance', 'attendance_percentage', 'attendancepercentage', 'att_%', 'att'],
    cgpa: ['cgpa', 'c.g.p.a.', 'pointer', 'grade_point'],
    sgpa: ['sgpa', 's.g.p.a.'],
  };

  // Find index for each canonical field
  const headerIndices = {};
  const detectedColumns = {};

  Object.entries(aliasMap).forEach(([canonicalKey, aliases]) => {
    for (const alias of aliases) {
      const idx = cleanHeaders.indexOf(alias.replace(/[^a-z0-9]/g, ''));
      if (idx !== -1 && headerIndices[canonicalKey] === undefined) {
        headerIndices[canonicalKey] = idx;
        detectedColumns[canonicalKey] = rawHeaders[idx];
        break;
      }
    }
  });

  // Verify mandatory columns
  const hasId = headerIndices.studentId !== undefined || headerIndices.prn !== undefined;
  const hasName = headerIndices.fullName !== undefined || headerIndices.firstName !== undefined;
  const hasDept = headerIndices.department !== undefined;
  const hasSem = headerIndices.semester !== undefined;

  if (!hasId || !hasName || !hasDept || !hasSem) {
    const missing = [];
    if (!hasId) missing.push('Student ID / PID / PRN');
    if (!hasName) missing.push('Student Name / First Name');
    if (!hasDept) missing.push('Department / Branch');
    if (!hasSem) missing.push('Semester');

    return {
      success: false,
      error: `Missing mandatory spreadsheet columns: ${missing.join(', ')}. Found columns: [${rawHeaders.join(', ')}].`,
      detectedColumns,
      foundHeaders: rawHeaders,
    };
  }

  const existingInStore = misStore.getImportedStudents();
  const records = [];
  const errors = [];
  const seenBatchKeys = new Set();
  let duplicatesInBatch = 0;
  let matchesInDatabase = 0;

  for (let i = 1; i < lines.length; i++) {
    const row = parseRowCells(lines[i], delimiter);
    if (row.length === 0 || (row.length === 1 && !row[0])) continue;

    const rowNum = i + 1;

    // Helper to get value
    const getVal = (key) =>
      headerIndices[key] !== undefined && row[headerIndices[key]] !== undefined ? row[headerIndices[key]].trim() : '';

    // Extract identifier
    const rawId = getVal('studentId') || getVal('prn');
    const idVal = validatePidFormat(rawId);
    if (!idVal.isValid) {
      errors.push(`Row ${rowNum}: Invalid student identifier "${rawId}" (${idVal.message})`);
      continue;
    }

    const cleanId = idVal.sanitizedPid;

    // Extract semester
    const semStr = getVal('semester');
    const semNum = parseInt(semStr, 10);
    if (isNaN(semNum) || semNum < 1 || semNum > 8) {
      errors.push(`Row ${rowNum}: Invalid semester "${semStr}". Must be an integer between 1 and 8.`);
      continue;
    }

    // Extract name
    let firstName = getVal('firstName');
    let middleName = getVal('middleName');
    let lastName = getVal('lastName');

    if (!firstName && headerIndices.fullName !== undefined) {
      const full = getVal('fullName');
      const parts = full.split(/\s+/).filter(Boolean);
      if (parts.length === 1) {
        firstName = parts[0];
      } else if (parts.length === 2) {
        firstName = parts[0];
        lastName = parts[1];
      } else if (parts.length >= 3) {
        firstName = parts[0];
        middleName = parts.slice(1, -1).join(' ');
        lastName = parts[parts.length - 1];
      }
    }

    if (!firstName) firstName = 'Student';

    // Department normalization
    const deptRaw = (getVal('department') || 'COMP').toUpperCase();
    let deptCode = 'COMP';
    let deptName = 'Computer Engineering';

    if (deptRaw.includes('IT') || deptRaw.includes('INFO')) {
      deptCode = 'IT';
      deptName = 'Information Technology';
    } else if (deptRaw.includes('AI') || deptRaw.includes('AIDS') || deptRaw.includes('DATA')) {
      deptCode = 'AIDS';
      deptName = 'Artificial Intelligence & Data Science';
    } else if (deptRaw.includes('MECH')) {
      deptCode = 'MECH';
      deptName = 'Mechanical Engineering';
    } else if (deptRaw.includes('CIVIL')) {
      deptCode = 'CIVIL';
      deptName = 'Civil Engineering';
    } else if (deptRaw.includes('EXTC') || deptRaw.includes('ELEC') || deptRaw.includes('COMM')) {
      deptCode = 'EXTC';
      deptName = 'Electronics & Telecommunication';
    }

    // Normalization of Student ID (Ensure 'EU' uppercase prefix standard)
    const normalizedStudentId = cleanId.toUpperCase().startsWith('EU') ? cleanId.toUpperCase() : `EU${cleanId.toUpperCase()}`;
    const rawPrn = getVal('prn');
    const normalizedPrn = rawPrn || (cleanId.length === 16 ? cleanId : '');

    // Duplicate detection in batch
    const batchKey = (normalizedStudentId || cleanId).toLowerCase();
    if (seenBatchKeys.has(batchKey)) {
      duplicatesInBatch++;
    }
    seenBatchKeys.add(batchKey);

    // Duplicate check in existing database
    const existsInDb = existingInStore.some((ex) => {
      const exId = String(ex.studentId || ex.pid || '').trim().toLowerCase();
      const exPrn = String(ex.prn || '').trim().toLowerCase();
      return exId === batchKey || exId === cleanId.toLowerCase() || (normalizedPrn && exPrn === normalizedPrn.toLowerCase());
    });
    if (existsInDb) {
      matchesInDatabase++;
    }

    const attendancePct = parseFloat(getVal('attendance')) || 80.0;
    const cgpaVal = parseFloat(getVal('cgpa')) || 8.0;
    const sgpaVal = parseFloat(getVal('sgpa')) || cgpaVal;

    records.push({
      studentId: normalizedStudentId,
      pid: cleanId,
      prn: normalizedPrn || cleanId,
      rollNumber: getVal('rollNumber') || `SJCEM-${cleanId.slice(-4)}`,
      firstName,
      middleName,
      lastName,
      departmentCode: deptCode,
      department: deptName,
      program: `B.E. ${deptName}`,
      semester: semNum,
      division: (getVal('division') || 'A').toUpperCase(),
      admissionYear: parseInt(getVal('admissionYear'), 10) || 2023,
      academicYear: getVal('academicYear') || '2025–2026',
      status: getVal('status') || 'ACTIVE_ENROLLED',
      academicAdvisor: getVal('academicAdvisor') || 'Prof. Anita Deshmukh',
      attendancePercentage: attendancePct,
      cgpa: cgpaVal,
      sgpa: sgpaVal,
      isSeedRecord: false,
      isTestRecord:
        Boolean(options && options.isSyntheticTest) ||
        Boolean(fileNameOrType && (fileNameOrType.toLowerCase().includes('synthetic') || fileNameOrType.toLowerCase().includes('test'))) ||
        cleanId.startsWith('EU99') ||
        (firstName && firstName.includes('[TEST]')),
      sourceType:
        (options && options.isSyntheticTest) ||
        (fileNameOrType && (fileNameOrType.toLowerCase().includes('synthetic') || fileNameOrType.toLowerCase().includes('test'))) ||
        cleanId.startsWith('EU99') ||
        (firstName && firstName.includes('[TEST]'))
          ? 'SYNTHETIC_TEST_IMPORT'
          : 'OFFICIAL_ROSTER_IMPORT',
    });
  }

  return {
    success: records.length > 0,
    records,
    totalRows: lines.length - 1,
    validCount: records.length,
    errorCount: errors.length,
    duplicateInBatchCount: duplicatesInBatch,
    existingInDbCount: matchesInDatabase,
    detectedColumns,
    errors,
    summary: `Processed ${lines.length - 1} rows: ${records.length} valid record(s), ${errors.length} rejected row(s), ${duplicatesInBatch} intra-batch duplicate(s), ${matchesInDatabase} existing database match(es).`,
  };
}

/**
 * Backwards-compatible CSV parser wrapper for existing tests and callers
 */
export function parseAndValidateStudentCsv(csvContent) {
  const result = parseSpreadsheetRoster(csvContent, 'import.csv');
  return {
    ...result,
    duplicateCount: result.duplicateInBatchCount || 0,
  };
}

/**
 * Generates official blank SJCEM CSV template for administrators (header row only)
 */
export function generateBlankStudentCsvTemplate() {
  return 'studentId,pid,prn,rollNumber,firstName,middleName,lastName,department,semester,division,admissionYear,academicYear,status,attendance,cgpa,sgpa,advisor\n';
}

/**
 * Generates clearly labelled synthetic test dataset for development and QA verification.
 * IMPORTANT: These records are strictly synthetic test fixtures and MUST NEVER be classified as official student records.
 */
export function generateSyntheticTestStudentCsv() {
  const headers = 'studentId,pid,prn,rollNumber,firstName,middleName,lastName,department,semester,division,admissionYear,academicYear,status,attendance,cgpa,sgpa,advisor';
  const rows = [
    'EU990001,EU990001,2026999900000001,SJCEM2026TEST01,[TEST] Synthetic,A.,StudentOne,COMP,6,A,2023,2025–2026,ACTIVE_ENROLLED,85.0,8.50,8.50,Prof. Anita Deshmukh',
    'EU990002,EU990002,2026999900000002,SJCEM2026TEST02,[TEST] Synthetic,B.,StudentTwo,COMP,6,A,2023,2025–2026,ACTIVE_ENROLLED,76.5,7.80,7.90,Prof. Anita Deshmukh',
    'EU990003,EU990003,2026999900000003,SJCEM2026TEST03,[TEST] Synthetic,C.,StudentThree,IT,4,B,2024,2025–2026,ACTIVE_ENROLLED,90.2,9.10,9.15,Dr. Rahul V. Mane',
    'EU990004,EU990004,2026999900000004,SJCEM2026TEST04,[TEST] Synthetic,D.,StudentFour,MECH,6,A,2023,2025–2026,ACTIVE_ENROLLED,72.0,7.40,7.50,Prof. Sudhir Rao',
    'EU990005,EU990005,2026999900000005,SJCEM2026TEST05,[TEST] Synthetic,E.,StudentFive,AIDS,2,A,2025,2025–2026,ACTIVE_ENROLLED,88.5,8.90,8.95,Dr. Geeta Sawant',
  ];
  return [headers, ...rows].join('\n');
}

/**
 * Backward compatibility sample CSV generator matching baseline identifiers
 */
export function generateSampleStudentCsv() {
  const headers = 'studentId,pid,prn,rollNumber,firstName,middleName,lastName,department,semester,division,admissionYear,academicYear,status,attendance,cgpa,sgpa,advisor';
  const rows = [
    'EU20220084,EU20220084,2022016400987654,SJCEM2022CS084,Rahul,Suresh,Sharma,COMP,6,A,2022,2025–2026,ACTIVE_ENROLLED,84.2,8.84,8.84,Prof. Anita Deshmukh',
    'EU20220062,EU20220062,2022016400987612,SJCEM2022CS062,Priya,N.,Nair,COMP,6,A,2022,2025–2026,ACTIVE_ENROLLED,78.5,8.40,8.42,Prof. Anita Deshmukh',
    'EU20230041,EU20230041,2023016400554433,SJCEM2023IT041,Sneha,R.,Kulkarni,IT,4,B,2023,2025–2026,ACTIVE_ENROLLED,89.2,9.02,9.05,Dr. Rahul V. Mane',
    'EU20220025,EU20220025,2022016400332211,SJCEM2022ME025,Rohan,A.,Mehta,MECH,6,A,2022,2025–2026,ACTIVE_ENROLLED,74.0,7.85,7.80,Prof. Sudhir Rao',
    'EU20240012,EU20240012,2024016400112233,SJCEM2024AI012,Ananya,S.,Joshi,AIDS,2,A,2024,2025–2026,ACTIVE_ENROLLED,91.5,9.35,9.35,Dr. Geeta Sawant',
  ];
  return [headers, ...rows].join('\n');
}
