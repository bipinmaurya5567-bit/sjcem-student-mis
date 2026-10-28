// Automated End-to-End Test Suite for SJCEM Student Retrieval Module
// Tests institutional EU identifier formats, University PRNs, RBAC, and CSV importing.
import { misStore } from './src/services/store.js';
import {
  retrieveStudentByPid,
  validatePidFormat,
  parseAndValidateStudentCsv,
  parseSpreadsheetRoster,
  generateSampleStudentCsv,
  generateBlankStudentCsvTemplate,
  generateSyntheticTestStudentCsv,
} from './src/services/studentRetrievalService.js';
import { DEMO_USERS } from './src/data/mockDatabase.js';
import {
  validateStudentIdentifier,
  getSafeGatewayStatus,
  testGatewayConnection,
  lookupStudentFromInstitutionalApi,
} from './server/institutionalApiAdapter.js';

// Polyfill basic localStorage for node CLI testing if not present
if (typeof globalThis.localStorage === 'undefined') {
  const memoryStore = new Map();
  globalThis.localStorage = {
    getItem: (k) => memoryStore.get(k) || null,
    setItem: (k, v) => memoryStore.set(k, String(v)),
    removeItem: (k) => memoryStore.delete(k),
    clear: () => memoryStore.clear(),
  };
}

let passed = 0;
let failed = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${testName}`);
    failed++;
  }
}

async function runTests() {
  console.log('=== Student MIS: Institutional Student Information Retrieval Test Suite ===\n');

  // Test 1: Institutional Identifier Format Validation
  console.log('[1] Institutional Identifier Format & Sanitization Tests:');
  const emptyCheck = validatePidFormat('');
  assert(!emptyCheck.isValid && emptyCheck.error === 'EMPTY_PID', 'Reject empty identifier input');

  const tooShortCheck = validatePidFormat('12');
  assert(!tooShortCheck.isValid && tooShortCheck.error === 'INVALID_LENGTH', 'Reject identifier shorter than 4 characters');

  const shortValidCheck = validatePidFormat('EU101');
  assert(shortValidCheck.isValid && shortValidCheck.sanitizedPid === 'EU101', 'Accept short valid institutional identifier (e.g. EU101)');

  const euCheck = validatePidFormat('EU20220084');
  assert(euCheck.isValid && euCheck.sanitizedPid === 'EU20220084', 'Accept official institutional Student ID format (EU20220084)');

  const prnCheck = validatePidFormat('2022016400987654');
  assert(prnCheck.isValid && prnCheck.sanitizedPid === '2022016400987654', 'Accept valid 16-digit university PRN (2022016400987654)');

  const illegalCheck = validatePidFormat('2022<script>');
  assert(!illegalCheck.isValid && illegalCheck.error === 'ILLEGAL_CHARACTERS', 'Reject illegal characters/XSS injections');

  // Test 2: Unauthenticated Request
  console.log('\n[2] Session Authentication Tests:');
  misStore.logout();
  const unauthRes = await retrieveStudentByPid('EU20220084', { simulateLatency: 0 });
  assert(!unauthRes.success && unauthRes.status === 401, 'Unauthenticated lookup returns 401 UNAUTHENTICATED');

  // Test 3: Student Role Access Denial
  console.log('\n[3] Student Role Authorization Tests:');
  misStore.currentUser = { ...DEMO_USERS.student };
  misStore.isAuthenticated = true;
  misStore.sessionToken = 'test-student-session';

  const studentSearchRes = await retrieveStudentByPid('EU20220084', { simulateLatency: 0 });
  assert(!studentSearchRes.success && studentSearchRes.status === 403 && studentSearchRes.error === 'FORBIDDEN',
    'Student role is strictly blocked from searching student records');

  // Test 4: Faculty Authorized Lookup with EU Identifier
  console.log('\n[4] Faculty Authorized Lookup with EU Identifiers:');
  misStore.currentUser = { ...DEMO_USERS.faculty }; // Prof. Anita Deshmukh (COMP)
  misStore.isAuthenticated = true;
  misStore.sessionToken = 'test-faculty-session';

  // 4a: Search Rahul Sharma by EU identifier
  const facultyEuSuccess = await retrieveStudentByPid('EU20220084', { simulateLatency: 0 });
  assert(
    facultyEuSuccess.success &&
    facultyEuSuccess.student.studentId === 'EU20220084' &&
    facultyEuSuccess.student.fullName === 'Rahul Suresh Sharma' &&
    facultyEuSuccess.student.departmentCode === 'COMP' &&
    facultyEuSuccess.student.attendance.percentage === 84.2 &&
    facultyEuSuccess.student.iaMarks.length > 0 &&
    facultyEuSuccess.student.semesterResults.length > 0,
    'Faculty in COMP retrieves Rahul Sharma via official Student ID (EU20220084)'
  );

  // 4b: Search Bipin Maurya by EU identifier
  const facultyBipinSuccess = await retrieveStudentByPid('EU20220001', { simulateLatency: 0 });
  assert(
    facultyBipinSuccess.success &&
    facultyBipinSuccess.student.studentId === 'EU20220001' &&
    facultyBipinSuccess.student.fullName === 'Bipin R. Maurya' &&
    facultyBipinSuccess.student.departmentCode === 'COMP',
    'Faculty in COMP retrieves Bipin Maurya via official Student ID (EU20220001)'
  );

  // 4c: Case-insensitive EU lookup
  const facultyCaseInsensitive = await retrieveStudentByPid('eu20220084', { simulateLatency: 0 });
  assert(
    facultyCaseInsensitive.success &&
    facultyCaseInsensitive.student.fullName === 'Rahul Suresh Sharma',
    'Case-insensitive identifier lookup (eu20220084) resolves correctly'
  );

  // 4d: Lookup by 16-digit PRN
  const facultyPrnSuccess = await retrieveStudentByPid('2022016400987654', { simulateLatency: 0 });
  assert(
    facultyPrnSuccess.success &&
    facultyPrnSuccess.student.studentId === 'EU20220084' &&
    facultyPrnSuccess.student.prn === '2022016400987654',
    'Faculty in COMP retrieves record via 16-digit University PRN (2022016400987654)'
  );

  // 4e: Lookup by Roll Number
  const facultyRollSuccess = await retrieveStudentByPid('SJCEM2022CS084', { simulateLatency: 0 });
  assert(
    facultyRollSuccess.success &&
    facultyRollSuccess.student.studentId === 'EU20220084',
    'Faculty in COMP retrieves record via Roll Number (SJCEM2022CS084)'
  );

  // Test 5: Faculty Cross-Department Restriction
  console.log('\n[5] Faculty Department Isolation Tests:');
  const facultyDeptBlocked = await retrieveStudentByPid('EU20230041', { simulateLatency: 0 }); // Sneha (IT)
  assert(
    !facultyDeptBlocked.success &&
    facultyDeptBlocked.status === 403 &&
    facultyDeptBlocked.error === 'ACCESS_DENIED' &&
    facultyDeptBlocked.message.includes('Department of Computer Engineering'),
    'Faculty in COMP is denied cross-department access to IT student (EU20230041)'
  );

  // Test 6: Administrator Campus-Wide Access
  console.log('\n[6] Administrator Campus-Wide Access Tests:');
  misStore.currentUser = { ...DEMO_USERS.admin }; // Dr. Vikram Patil (Admin)
  misStore.isAuthenticated = true;
  misStore.sessionToken = 'test-admin-session';

  const adminSearchComp = await retrieveStudentByPid('EU20220084', { simulateLatency: 0 });
  assert(adminSearchComp.success && adminSearchComp.student.studentId === 'EU20220084',
    'Admin retrieves COMP student (EU20220084)');

  const adminSearchIt = await retrieveStudentByPid('EU20230041', { simulateLatency: 0 });
  assert(adminSearchIt.success && adminSearchIt.student.fullName === 'Sneha R. Kulkarni',
    'Admin retrieves IT student (EU20230041)');

  const adminSearchMech = await retrieveStudentByPid('EU20220025', { simulateLatency: 0 });
  assert(adminSearchMech.success && adminSearchMech.student.fullName === 'Rohan A. Mehta',
    'Admin retrieves Mechanical Engineering student (EU20220025)');

  const adminSearchAids = await retrieveStudentByPid('EU20240012', { simulateLatency: 0 });
  assert(adminSearchAids.success && adminSearchAids.student.fullName === 'Ananya S. Joshi',
    'Admin retrieves AI&DS student (EU20240012)');

  // Test 7: Non-existent Record (404 Handling)
  console.log('\n[7] Non-existent Record (404 Handling) Tests:');
  const notFoundRes = await retrieveStudentByPid('EU99999999', { simulateLatency: 0 });
  assert(
    !notFoundRes.success &&
    notFoundRes.status === 404 &&
    notFoundRes.error === 'STUDENT_NOT_FOUND',
    'Non-existent identifier (EU99999999) returns authentic 404 STUDENT_NOT_FOUND without fabricating data'
  );

  // Test 8: CSV Batch Parser, Duplicate Detection & Importer
  console.log('\n[8] CSV Roster Parser & Importer Tests:');
  const sampleCsv = generateSampleStudentCsv();
  const parseResult = parseAndValidateStudentCsv(sampleCsv);
  assert(
    parseResult.success &&
    parseResult.validCount === 5 &&
    parseResult.errorCount === 0,
    'Sample CSV generates and parses 5 valid student records with EU identifiers'
  );

  // Test CSV with intentional duplicate row
  const csvWithDuplicate = `${sampleCsv}\nEU20220084,EU20220084,2022016400987654,SJCEM2022CS084,Rahul,Suresh,Sharma,COMP,6,A,2022,2025–2026,ACTIVE_ENROLLED,85.0,8.84,8.84,Prof. Anita Deshmukh`;
  const parseDupResult = parseAndValidateStudentCsv(csvWithDuplicate);
  assert(
    parseDupResult.duplicateCount === 1,
    'CSV parser correctly detects intra-batch duplicate identifier (EU20220084)'
  );

  const importResult = misStore.importStudentsFromCsv(parseResult.records, 'Automated Test Import');
  assert(
    importResult.success &&
    importResult.totalRecords >= 5,
    'CSV records committed to store database with audit tracking'
  );

  // Test 9: Security Audit Logging
  console.log('\n[9] Audit Logging Verification Tests:');
  const auditLogs = misStore.getLookupAuditLogs();
  assert(auditLogs.length > 0, 'Audit logs recorded query events');
  const hasDeniedLog = auditLogs.some((l) => l.lookupResult === 'ACCESS_DENIED');
  assert(hasDeniedLog, 'Audit trail contains recorded ACCESS_DENIED security event');
  const hasSuccessLog = auditLogs.some((l) => l.lookupResult === 'SUCCESS');
  assert(hasSuccessLog, 'Audit trail contains recorded SUCCESS lookup event');

  // Test 10: Development Query Diagnostic Payload Tests
  console.log('\n[10] Development Query Diagnostic Payload Tests:');
  const diagSuccess = await retrieveStudentByPid('EU20220084', { simulateLatency: 0 });
  assert(
    diagSuccess.diagnosticTrace &&
    diagSuccess.diagnosticTrace.dataSource.includes('imported_student_records') &&
    diagSuccess.diagnosticTrace.table === 'imported_student_records' &&
    Array.isArray(diagSuccess.diagnosticTrace.columnsEvaluated) &&
    diagSuccess.diagnosticTrace.columnsEvaluated.includes('student_id') &&
    diagSuccess.diagnosticTrace.outcome.httpStatus === 200,
    'Diagnostic payload reports correct data source, table, columns, and 200 outcome'
  );

  const diagNotFound = await retrieveStudentByPid('EU99999999', { simulateLatency: 0 });
  assert(
    diagNotFound.diagnosticTrace &&
    diagNotFound.diagnosticTrace.outcome.httpStatus === 404 &&
    diagNotFound.diagnosticTrace.outcome.code === 'STUDENT_NOT_FOUND' &&
    !JSON.stringify(diagNotFound.diagnosticTrace).toLowerCase().includes('password'),
    'Diagnostic reports safe 404 details with strictly ZERO credential leaks'
  );

  // Test 11: Multi-format Spreadsheet (TSV / Custom Aliases) Parser Tests
  console.log('\n[11] TSV & Column Alias Spreadsheet Parser Tests:');
  const tsvData = `student_id\tcandidate_name\tbranch\tcurrent_semester\treg_no\nEU20259901\tAarav Rajesh Verma\tInformation Technology\t4\t2025016400998877`;
  const tsvResult = parseSpreadsheetRoster(tsvData, 'pasted_roster.tsv');
  assert(
    tsvResult.success &&
    tsvResult.validCount === 1 &&
    tsvResult.records[0].studentId === 'EU20259901' &&
    tsvResult.records[0].firstName === 'Aarav' &&
    tsvResult.records[0].middleName === 'Rajesh' &&
    tsvResult.records[0].lastName === 'Verma' &&
    tsvResult.records[0].departmentCode === 'IT' &&
    tsvResult.records[0].semester === 4 &&
    tsvResult.records[0].prn === '2025016400998877',
    'TSV parser correctly splits full names, maps custom aliases (branch, candidate_name), and validates records'
  );

  // Test 12: Seed Record vs Official Record Distinction & Purge
  console.log('\n[12] Seed Record vs Official Record Classification & Purge Tests:');
  misStore.resetSampleSeedRecords();
  const baselineSeedCount = misStore.getSeedStudentCount();
  assert(baselineSeedCount === 7, `Initial database contains ${baselineSeedCount} synthetic seed test records (never assumed real)`);

  // Import one official record
  const officialImport = misStore.importStudentsFromCsv(tsvResult.records, 'Official Registrar Test Batch');
  assert(officialImport.success && misStore.getOfficialStudentCount() >= 1, 'Official record import increments official count');

  // Purge seed records
  const purgeRes = misStore.purgeSeedRecords();
  assert(
    purgeRes.success &&
    purgeRes.removedCount === baselineSeedCount &&
    misStore.getSeedStudentCount() === 0 &&
    misStore.getOfficialStudentCount() >= 1,
    'Purge seed records successfully removes all synthetic seed fixtures while retaining official imported records'
  );

  // Restore seed records for clean testing state
  misStore.resetSampleSeedRecords();
  assert(misStore.getSeedStudentCount() === baselineSeedCount, 'Reset sample seed records restores testing baseline of 7 records');

  // Test 13: Downloadable Blank Template & Synthetic Test Dataset Verification
  console.log('\n[13] Downloadable Template & Synthetic Test Dataset Tests:');
  const blankTemplate = generateBlankStudentCsvTemplate();
  assert(
    blankTemplate.includes('studentId') &&
    blankTemplate.includes('department') &&
    blankTemplate.includes('semester') &&
    blankTemplate.split('\n').filter(Boolean).length === 1,
    'Blank CSV template contains exact accepted headers with no dummy records'
  );

  const syntheticCsv = generateSyntheticTestStudentCsv();
  assert(
    syntheticCsv.includes('[TEST]') &&
    syntheticCsv.includes('COMP') &&
    syntheticCsv.includes('IT'),
    'Synthetic test CSV records are explicitly tagged with [TEST] to prevent confusion with genuine students'
  );

  const parsedSynth = parseSpreadsheetRoster(syntheticCsv, 'synthetic_test_roster.csv', { isSyntheticTest: true });
  assert(
    parsedSynth.success &&
    parsedSynth.validCount === 5 &&
    parsedSynth.records.every((r) => r.sourceType === 'SYNTHETIC_TEST_IMPORT'),
    'Parsed synthetic test records are strictly classified as SYNTHETIC_TEST_IMPORT'
  );

  const synthImportRes = misStore.importStudentsFromCsv(parsedSynth.records, 'QA Synthetic Verification Batch', { isSyntheticTest: true });
  assert(
    synthImportRes.success &&
    misStore.getSyntheticTestCount() === 5,
    'Importing synthetic test records increments getSyntheticTestCount without inflating official count'
  );

  // Authenticate as faculty and verify lookup on newly imported synthetic test student
  misStore.currentUser = DEMO_USERS.faculty;
  misStore.isAuthenticated = true;
  const facultySynthCompSearch = await retrieveStudentByPid('EU990001', { simulateLatency: 0 });
  assert(
    facultySynthCompSearch.success &&
    facultySynthCompSearch.student.studentId === 'EU990001',
    'Faculty in COMP can retrieve newly imported COMP synthetic test student'
  );

  const facultySynthItSearch = await retrieveStudentByPid('EU990003', { simulateLatency: 0 });
  assert(
    !facultySynthItSearch.success &&
    facultySynthItSearch.error === 'ACCESS_DENIED' &&
    facultySynthItSearch.status === 403,
    'Department isolation strictly enforced on imported synthetic test students (COMP faculty blocked from IT student)'
  );

  // Purge synthetic test imports
  const purgeTestRes = misStore.purgeSyntheticTestImports();
  assert(
    purgeTestRes.success &&
    misStore.getSyntheticTestCount() === 0 &&
    misStore.getSeedStudentCount() === baselineSeedCount,
    'Purging synthetic test imports cleanly removes test records while preserving seed baseline'
  );

  // Test 14: Server-Side Institutional API Adapter Tests
  console.log('\n[14] Server-Side Institutional API Adapter & Gateway Proxy Tests:');

  // 14a: Server-Side Input Sanitization
  const serverEmpty = validateStudentIdentifier('');
  assert(!serverEmpty.isValid && serverEmpty.error === 'EMPTY_IDENTIFIER', 'Server adapter rejects empty PID');

  const serverInjection = validateStudentIdentifier("EU' OR '1'='1");
  assert(!serverInjection.isValid && serverInjection.error === 'ILLEGAL_CHARACTERS', 'Server adapter blocks SQL/script injection payloads');

  const serverValid = validateStudentIdentifier('EU20220084');
  assert(serverValid.isValid && serverValid.sanitizedPid === 'EU20220084', 'Server adapter validates authentic EU identifier');

  // 14b: Gateway Status Security (No credentials leak)
  const safeStatus = getSafeGatewayStatus();
  assert(
    safeStatus.connectionStatus === 'NOT_CONFIGURED' &&
    !safeStatus.apiKey &&
    !safeStatus.token &&
    safeStatus.isConfigured === false,
    'getSafeGatewayStatus never leaks private keys or credentials'
  );

  // 14c: Gateway Connection Test when unconfigured
  const unconfiguredTest = await testGatewayConnection();
  assert(
    !unconfiguredTest.success &&
    unconfiguredTest.status === 'NOT_CONFIGURED' &&
    unconfiguredTest.httpStatus === 503 &&
    unconfiguredTest.error === 'GATEWAY_CREDENTIALS_MISSING',
    'testGatewayConnection reports 503 GATEWAY_CREDENTIALS_MISSING when college IT credentials are absent'
  );

  // 14d: Server RBAC Enforcement
  const unauthLookup = await lookupStudentFromInstitutionalApi('EU20220084', null);
  assert(!unauthLookup.success && unauthLookup.status === 401, 'lookupStudentFromInstitutionalApi rejects unauthenticated caller with 401');

  const studentLookup = await lookupStudentFromInstitutionalApi('EU20220084', { role: 'student', id: 's1' });
  assert(!studentLookup.success && studentLookup.status === 403, 'lookupStudentFromInstitutionalApi rejects student caller with 403 FORBIDDEN');

  // 14e: Unconfigured live lookup fails safely
  const facultyLookupUnconfigured = await lookupStudentFromInstitutionalApi('EU20220084', {
    role: 'faculty',
    id: 'f1',
    departmentCode: 'COMP',
  });
  assert(
    !facultyLookupUnconfigured.success &&
    facultyLookupUnconfigured.status === 503 &&
    facultyLookupUnconfigured.error === 'GATEWAY_NOT_CONFIGURED',
    'Unconfigured gateway returns 503 GATEWAY_NOT_CONFIGURED advising switch to local DB'
  );

  // 14f: Transparent Mock Gateway Simulation Testing
  process.env.ENABLE_MOCK_INSTITUTIONAL_GATEWAY = 'true';

  const mockTestConn = await testGatewayConnection();
  assert(
    mockTestConn.success &&
    mockTestConn.status === 'MOCK_OPERATIONAL' &&
    mockTestConn.isSimulated === true,
    'Mock gateway simulation returns 200 MOCK_OPERATIONAL with isSimulated: true'
  );

  // 14g: Retrieve COMP student via mock gateway with zero password exposure
  const mockCompStudent = await lookupStudentFromInstitutionalApi('EU20220084', {
    role: 'faculty',
    id: 'f1',
    departmentCode: 'COMP',
    department: 'Computer Engineering',
  });
  assert(
    mockCompStudent.success &&
    mockCompStudent.status === 200 &&
    mockCompStudent.student.studentId === 'EU20220084' &&
    mockCompStudent.student.password === undefined &&
    mockCompStudent.student.passwordHash === undefined &&
    mockCompStudent.source === 'INSTITUTIONAL_API_MOCK',
    'Mock gateway retrieves COMP student EU20220084 with strictly zero password exposure'
  );

  // 14h: Department RBAC enforcement in mock gateway (COMP faculty blocked from IT student)
  const mockCrossDept = await lookupStudentFromInstitutionalApi('EU20230041', {
    role: 'faculty',
    id: 'f1',
    departmentCode: 'COMP',
    department: 'Computer Engineering',
  });
  assert(
    !mockCrossDept.success &&
    mockCrossDept.status === 403 &&
    mockCrossDept.error === 'ACCESS_DENIED',
    'Mock gateway strictly enforces department isolation (COMP faculty blocked from IT student)'
  );

  // 14i: Non-existent mock student
  const mockNotFound = await lookupStudentFromInstitutionalApi('EU99999999', {
    role: 'faculty',
    id: 'f1',
    departmentCode: 'COMP',
  });
  assert(
    !mockNotFound.success &&
    mockNotFound.status === 404 &&
    mockNotFound.error === 'STUDENT_NOT_FOUND',
    'Mock gateway returns 404 STUDENT_NOT_FOUND for unknown identifier'
  );

  // Clean up test environment variable
  delete process.env.ENABLE_MOCK_INSTITUTIONAL_GATEWAY;

  console.log(`\n=================================================`);
  console.log(`Total: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
  console.log(`=================================================`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
