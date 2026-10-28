// SJCEM NEXT MIS — Authorized Student Data Lookup & Retrieval Module
// Institution: St. John College of Engineering and Management, Palghar
// Trust: ALDEL Education Trust

import { misStore } from '../services/store.js';

export function renderStudentLookupPage(lookupState) {
  const user = misStore.getCurrentUser();
  const config = misStore.getIntegrationConfig();
  const isAdmin = user.role === 'admin';
  const facultyDept = user.departmentCode || 'COMP';

  // Active view tab (for Admins: 'search' | 'import' | 'audit' | 'config'; for Faculty: 'search' | 'audit')
  const activeTab = lookupState.activeTab || 'search';

  return `
    <div class="space-y-6 animate-fade-in pb-12">
      
      <!-- Module Header -->
      <div class="card-subtle p-6 bg-gradient-to-r from-teal-900 via-[#19685F] to-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2 mb-1.5 flex-wrap">
            <span class="text-xs px-2.5 py-0.5 rounded-full font-bold bg-white/20 text-white border border-white/20 flex items-center gap-1.5">
              <i data-lucide="shield-check" class="w-3.5 h-3.5 text-emerald-300"></i>
              <span>AUTHORIZED DATA RETRIEVAL</span>
            </span>
            <span class="text-xs text-teal-200">
              Scope: ${isAdmin ? 'Campus-Wide Administrator' : `Department of ${user.department || facultyDept}`}
            </span>
          </div>
          <h2 class="text-2xl font-bold tracking-tight">Student Data Lookup</h2>
          <p class="text-xs md:text-sm text-teal-100 font-medium max-w-2xl mt-0.5">
            Query verified student academic records by institutional Student ID (e.g. EU20220084), University PRN, or Roll Number under institutional access controls and audit logging.
          </p>
        </div>
      </div>

      <!-- Navigation Tabs (Search vs CSV/Excel Import vs Audit Logs vs Gateway Config) -->
      <div class="flex items-center space-x-2 border-b border-slate-200 pb-2 overflow-x-auto text-xs font-semibold">
        <button
          onclick="window.appSetLookupTab('search')"
          class="px-4 py-2 rounded-xl transition flex items-center space-x-1.5 flex-shrink-0 ${
            activeTab === 'search'
              ? 'bg-[#247F73] text-white shadow-sm font-bold'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }"
        >
          <i data-lucide="search" class="w-4 h-4"></i>
          <span>Student PID Lookup</span>
        </button>

        <button
          onclick="window.appSetLookupTab('import')"
          class="px-4 py-2 rounded-xl transition flex items-center space-x-1.5 flex-shrink-0 ${
            activeTab === 'import'
              ? 'bg-[#247F73] text-white shadow-sm font-bold'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }"
        >
          <i data-lucide="file-up" class="w-4 h-4"></i>
          <span>${isAdmin ? 'CSV / Excel Roster Import' : 'Department Roster Import'}</span>
        </button>

        <button
          onclick="window.appSetLookupTab('audit')"
          class="px-4 py-2 rounded-xl transition flex items-center space-x-1.5 flex-shrink-0 ${
            activeTab === 'audit'
              ? 'bg-[#247F73] text-white shadow-sm font-bold'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }"
        >
          <i data-lucide="shield-alert" class="w-4 h-4"></i>
          <span>Retrieval Audit Trails</span>
        </button>

        ${
          isAdmin
            ? `
          <button
            onclick="window.appSetLookupTab('config')"
            class="px-4 py-2 rounded-xl transition flex items-center space-x-1.5 flex-shrink-0 ${
              activeTab === 'config'
                ? 'bg-[#247F73] text-white shadow-sm font-bold'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }"
          >
            <i data-lucide="sliders" class="w-4 h-4"></i>
            <span>Integration Settings</span>
          </button>
        `
            : ''
        }
      </div>

      <!-- Tab Content Area -->
      ${
        activeTab === 'search'
          ? renderSearchTabContent(lookupState, user, isAdmin)
          : activeTab === 'import'
          ? renderImportTabContent(lookupState, user, isAdmin)
          : activeTab === 'audit'
          ? renderAuditTabContent(isAdmin, facultyDept)
          : renderConfigTabContent(config, lookupState)
      }

    </div>
  `;
}

/**
 * 1. Primary Student PID Search View
 */
function renderSearchTabContent(lookupState, user, isAdmin) {
  const searchInput = lookupState.searchInput || '';
  const isLoading = !!lookupState.isLoading;
  const searchResult = lookupState.searchResult || null;
  const searchError = lookupState.searchError || null;
  const lastRetrievedAt = lookupState.lastRetrievedAt || null;
  const diagnosticTrace = lookupState.diagnosticTrace || (searchResult && searchResult.diagnosticTrace) || (searchError && searchError.diagnosticTrace) || null;

  return `
    <div class="space-y-6">
      
      <!-- PID Input & Action Bar Card -->
      <div class="card-subtle p-5 sm:p-6 bg-white space-y-4">
        <div>
          <label for="student-pid-input" class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Student Institutional Identifier (Student ID / PID / University PRN)
          </label>
          <p class="text-xs text-slate-500 mb-3">
            Enter the student's institutional Student ID (e.g. <strong>EU20220084</strong>), 16-digit University PRN, or Roll Number. Input is securely validated and evaluated against institutional role access controls.
          </p>

          <form onsubmit="window.appExecuteStudentSearch(event)" class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div class="relative flex-1">
              <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <i data-lucide="search" class="w-4 h-4"></i>
              </div>
              <input
                type="text"
                id="student-pid-input"
                name="pid"
                value="${escapeHtml(searchInput)}"
                placeholder="e.g. EU20220084, 2022016400987654, or SJCEM2022CS084"
                autocomplete="off"
                maxlength="32"
                class="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm font-mono placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-700 focus:bg-white transition"
              />
              ${
                searchInput
                  ? `
                <button
                  type="button"
                  onclick="window.appClearStudentSearch()"
                  class="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition"
                  title="Clear input"
                >
                  <i data-lucide="x" class="w-4 h-4"></i>
                </button>
              `
                  : ''
              }
            </div>

            <!-- Search Button -->
            <button
              type="submit"
              id="student-search-submit-btn"
              ${isLoading ? 'disabled' : ''}
              class="px-6 py-3 rounded-xl bg-[#247F73] hover:bg-[#19685F] text-white text-xs font-bold shadow-sm transition flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ${
                isLoading
                  ? `<div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div><span>Retrieving...</span>`
                  : `<i data-lucide="search" class="w-4 h-4"></i><span>Search Record</span>`
              }
            </button>

            <!-- Refresh Button -->
            <button
              type="button"
              onclick="window.appRefreshStudentSearch()"
              title="Refresh Current Query"
              class="px-3.5 py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition flex items-center justify-center space-x-1.5"
            >
              <i data-lucide="refresh-cw" class="w-4 h-4 text-slate-500"></i>
              <span class="hidden sm:inline">Refresh</span>
            </button>

            <!-- Clear Search Button -->
            <button
              type="button"
              onclick="window.appClearStudentSearch()"
              title="Clear Search & Results"
              class="px-3.5 py-3 rounded-xl border border-slate-200 bg-white hover:bg-rose-50 text-rose-600 hover:border-rose-200 text-xs font-semibold transition flex items-center justify-center space-x-1.5"
            >
              <i data-lucide="trash-2" class="w-4 h-4"></i>
              <span class="hidden sm:inline">Clear</span>
            </button>
          </form>
        </div>
      </div>

      <!-- Result / Error / Loading / Initial Display Container -->
      <div id="student-search-results-container">
        ${
          isLoading
            ? renderLoadingState()
            : searchError
            ? renderErrorState(searchError)
            : searchResult
            ? renderStudentProfile(searchResult, lastRetrievedAt)
            : renderInitialEmptyState(user, isAdmin)
        }
      </div>

      <!-- Development Query Diagnostic (Zero Secrets Exposed) -->
      ${diagnosticTrace ? renderDevDiagnostic(diagnosticTrace) : ''}

    </div>
  `;
}

/**
 * Loading State Indicator
 */
function renderLoadingState() {
  return `
    <div class="card-subtle p-12 bg-white text-center space-y-4 animate-pulse">
      <div class="w-12 h-12 mx-auto rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center">
        <div class="w-6 h-6 border-3 border-teal-800 border-t-transparent rounded-full animate-spin"></div>
      </div>
      <div>
        <h4 class="font-bold text-slate-800 text-base">Retrieving Student Academic Record...</h4>
        <p class="text-xs text-slate-500 max-w-md mx-auto mt-1">
          Validating caller permissions, verifying institutional role scope, and querying authorized database tables.
        </p>
      </div>
    </div>
  `;
}

/**
 * Error State Display (Validation, Not Found, Department Access Denied, Rate Limit)
 */
function renderErrorState(error) {
  const isAccessDenied = error.error === 'ACCESS_DENIED' || error.status === 403;
  const isNotFound = error.error === 'STUDENT_NOT_FOUND' || error.status === 404;
  const isRateLimit = error.error === 'RATE_LIMIT_EXCEEDED' || error.status === 429;
  const isUnavailable = error.error === 'SERVICE_UNAVAILABLE' || error.status === 503;

  const bgClass = isAccessDenied
    ? 'bg-amber-50 border-amber-200 text-amber-900'
    : isNotFound
    ? 'bg-slate-50 border-slate-200 text-slate-800'
    : isRateLimit
    ? 'bg-purple-50 border-purple-200 text-purple-900'
    : 'bg-rose-50 border-rose-200 text-rose-900';

  const iconName = isAccessDenied
    ? 'shield-alert'
    : isNotFound
    ? 'user-x'
    : isRateLimit
    ? 'hourglass'
    : 'alert-triangle';

  const iconColor = isAccessDenied
    ? 'text-amber-600'
    : isNotFound
    ? 'text-slate-500'
    : isRateLimit
    ? 'text-purple-600'
    : 'text-rose-600';

  return `
    <div class="card-subtle p-6 sm:p-8 ${bgClass} border space-y-3">
      <div class="flex items-start space-x-3.5">
        <div class="p-2.5 rounded-xl bg-white shadow-sm flex-shrink-0 ${iconColor}">
          <i data-lucide="${iconName}" class="w-6 h-6"></i>
        </div>
        <div class="space-y-1.5 flex-1">
          <div class="flex items-center justify-between">
            <h4 class="font-bold text-sm sm:text-base">
              ${
                isAccessDenied
                  ? 'Access Authorization Restricted'
                  : isNotFound
                  ? 'Student Record Not Found'
                  : isRateLimit
                  ? 'Request Rate Limit Exceeded'
                  : isUnavailable
                  ? 'External Integration Unavailable'
                  : 'Lookup Validation Error'
              }
            </h4>
            <span class="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded bg-white/70 border border-current">
              ${error.error || 'ERROR'}
            </span>
          </div>

          <p class="text-xs leading-relaxed opacity-90">
            ${escapeHtml(error.message || 'An error occurred during student data retrieval.')}
          </p>

          ${
            isNotFound
              ? `
            <div class="mt-3 pt-3 border-t border-slate-200/60 text-xs text-slate-600 space-y-2.5">
              <p>• Verify that the entered identifier is a valid institutional Student ID (e.g. EU20220084), 16-digit University PRN, or Roll Number.</p>
              <div class="pt-1">
                <button
                  type="button"
                  onclick="window.appSetLookupTab('import')"
                  class="px-3.5 py-2 rounded-xl bg-[#247F73] hover:bg-[#19685F] text-white text-xs font-semibold shadow-sm transition inline-flex items-center space-x-1.5"
                >
                  <i data-lucide="file-up" class="w-4 h-4"></i>
                  <span>Import Student Roster (CSV / Excel)</span>
                </button>
              </div>
            </div>
          `
              : ''
          }

          ${
            isAccessDenied
              ? `
            <div class="mt-3 pt-3 border-t border-amber-200/60 text-xs text-amber-800 space-y-1">
              <p>• In accordance with University and Institutional FERPA data protection guidelines, faculty members may only query records within their assigned department.</p>
              <p>• Contact Dr. Vikram Patil (Academic Dean) if you require cross-department access for Interdisciplinary Project Mentorship.</p>
            </div>
          `
              : ''
          }
        </div>
      </div>
    </div>
  `;
}

/**
 * Success State: Clean, responsive student profile view
 */
function renderStudentProfile(student, lastRetrievedAt) {
  const att = student.attendance || { percentage: 75.0, status: 'SAFE' };
  const isAttSafe = att.percentage >= 75.0;

  return `
    <div class="space-y-6">
      
      <!-- Profile Hero Banner Card -->
      <div class="card-subtle p-6 bg-white border border-slate-200 space-y-5">
        
        <!-- Header row with student info & status badges -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div class="flex items-start space-x-4">
            <div class="w-14 h-14 rounded-2xl bg-teal-800 text-white font-bold text-lg flex items-center justify-center flex-shrink-0 shadow-md">
              ${student.firstName[0]}${student.lastName[0]}
            </div>
            <div class="space-y-1">
              <div class="flex items-center gap-2 flex-wrap">
                <h3 class="text-xl font-bold text-slate-900 tracking-tight">
                  ${escapeHtml(student.fullName)}
                </h3>
                <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                  student.status === 'ACTIVE_ENROLLED'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-slate-100 text-slate-800 border border-slate-200'
                }">
                  ${student.status}
                </span>
                <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                  ${student.departmentCode}
                </span>
              </div>
              <p class="text-xs text-slate-500 font-medium">
                ${student.program} • Admission Year: ${student.admissionYear}
              </p>
            </div>
          </div>

          <!-- Metadata Tag: Data Source & Timestamp -->
          <div class="text-left sm:text-right space-y-1">
            <div class="inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold">
              <i data-lucide="database" class="w-3.5 h-3.5 text-teal-700"></i>
              <span>${student.sourceType === 'COLLEGE_API' ? 'College API Gateway' : 'Imported Student Records (Local DB)'}</span>
            </div>
            ${
              lastRetrievedAt
                ? `
              <div class="text-[11px] text-slate-400 font-medium flex items-center sm:justify-end gap-1">
                <i data-lucide="clock" class="w-3 h-3"></i>
                <span>Last Retrieved: ${lastRetrievedAt}</span>
              </div>
            `
                : ''
            }
          </div>
        </div>

        <!-- Academic Key Details Grid -->
        <div class="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
          <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <span class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Student ID (PID)</span>
            <span class="text-sm font-mono font-bold text-teal-900 mt-0.5 block truncate" title="${student.studentId || student.pid}">
              ${student.studentId || student.pid}
            </span>
          </div>

          <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <span class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">University PRN</span>
            <span class="text-sm font-mono font-bold text-slate-800 mt-0.5 block truncate" title="${student.prn}">
              ${student.prn}
            </span>
          </div>

          <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <span class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Class Roll Number</span>
            <span class="text-sm font-mono font-bold text-teal-800 mt-0.5 block">
              ${student.rollNumber}
            </span>
          </div>

          <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <span class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Academic Semester</span>
            <span class="text-sm font-bold text-slate-800 mt-0.5 block">
              Semester ${student.semester} (Div ${student.division})
            </span>
          </div>

          <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <span class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Academic Advisor</span>
            <span class="text-sm font-medium text-slate-800 mt-0.5 block truncate" title="${student.academicAdvisor}">
              ${student.academicAdvisor || 'Prof. Anita Deshmukh'}
            </span>
          </div>
        </div>

      </div>

      <!-- Academic Performance Split: Attendance vs IA Marks -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        <!-- Attendance Module Card -->
        <div class="card-subtle p-5 sm:p-6 bg-white space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <div class="flex items-center space-x-2">
              <i data-lucide="calendar-check" class="w-5 h-5 text-teal-700"></i>
              <h4 class="font-bold text-slate-800 text-sm sm:text-base">Class Attendance Record</h4>
            </div>
            <span class="text-xs px-2.5 py-0.5 rounded-full font-bold ${
              isAttSafe
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }">
              ${att.percentage}% Overall
            </span>
          </div>

          <!-- Progress Bar & Summary -->
          <div class="space-y-2">
            <div class="flex justify-between text-xs text-slate-600 font-medium">
              <span>Attendance Threshold (University Norm: 75.0%)</span>
              <span class="font-bold ${isAttSafe ? 'text-emerald-700' : 'text-rose-600'}">
                ${isAttSafe ? 'Satisfactory Attendance' : 'Attendance Defaulter Warning'}
              </span>
            </div>
            <div class="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
              <div class="h-full rounded-full transition-all duration-500 ${isAttSafe ? 'bg-[#247F73]' : 'bg-rose-500'}" style="width: ${Math.min(att.percentage, 100)}%;"></div>
            </div>
            <div class="flex justify-between text-[11px] text-slate-400">
              <span>Lectures Attended: ${att.totalAttended || '—'} / ${att.totalConducted || '—'}</span>
              <span>Status: ${att.status}</span>
            </div>
          </div>

          <!-- Subject Attendance Table -->
          ${
            att.subjectBreakdown && att.subjectBreakdown.length > 0
              ? `
            <div class="mt-4 border border-slate-100 rounded-xl overflow-x-auto table-scroll-container">
              <table class="w-full text-left text-xs">
                <thead class="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                  <tr>
                    <th class="py-2.5 px-3">Subject</th>
                    <th class="py-2.5 px-2 text-center">Attended</th>
                    <th class="py-2.5 px-3 text-right">Percentage</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  ${att.subjectBreakdown
                    .map(
                      (s) => `
                    <tr class="hover:bg-slate-50/50">
                      <td class="py-2 px-3 font-medium text-slate-800">
                        <span class="font-mono text-teal-800 font-bold block">${s.subjectCode}</span>
                        <span class="text-[11px] text-slate-500 truncate block max-w-[200px]">${s.subjectName}</span>
                      </td>
                      <td class="py-2 px-2 text-center text-slate-600">${s.attended}/${s.conducted}</td>
                      <td class="py-2 px-3 text-right font-bold ${s.percentage >= 75 ? 'text-teal-800' : 'text-rose-600'}">
                        ${s.percentage}%
                      </td>
                    </tr>
                  `
                    )
                    .join('')}
                </tbody>
              </table>
            </div>
          `
              : '<p class="text-xs text-slate-400 py-3 text-center">Detailed course-wise attendance breakdown is synchronized weekly.</p>'
          }
        </div>

        <!-- Internal Assessment (IA) Marks Card -->
        <div class="card-subtle p-5 sm:p-6 bg-white space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <div class="flex items-center space-x-2">
              <i data-lucide="file-spreadsheet" class="w-5 h-5 text-purple-700"></i>
              <h4 class="font-bold text-slate-800 text-sm sm:text-base">Internal Assessment (IA) Marks</h4>
            </div>
            <span class="text-xs px-2.5 py-0.5 rounded-full font-bold bg-purple-50 text-purple-800 border border-purple-200">
              Current Semester
            </span>
          </div>

          ${
            student.iaMarks && student.iaMarks.length > 0
              ? `
            <div class="border border-slate-100 rounded-xl overflow-x-auto table-scroll-container">
              <table class="w-full text-left text-xs">
                <thead class="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                  <tr>
                    <th class="py-2.5 px-3">Subject</th>
                    <th class="py-2.5 px-2 text-center">IA-1</th>
                    <th class="py-2.5 px-2 text-center">IA-2</th>
                    <th class="py-2.5 px-3 text-right">Avg (/20)</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  ${student.iaMarks
                    .map(
                      (m) => `
                    <tr class="hover:bg-slate-50/50">
                      <td class="py-2 px-3">
                        <span class="font-mono text-purple-800 font-bold block">${m.subjectCode}</span>
                        <span class="text-[11px] text-slate-500 truncate block max-w-[180px]">${m.subjectName}</span>
                      </td>
                      <td class="py-2 px-2 text-center font-medium text-slate-700">${m.ia1 || '—'}</td>
                      <td class="py-2 px-2 text-center font-medium text-slate-700">${m.ia2 || '—'}</td>
                      <td class="py-2 px-3 text-right font-bold text-slate-900">${m.average || '—'}</td>
                    </tr>
                  `
                    )
                    .join('')}
                </tbody>
              </table>
            </div>
          `
              : '<p class="text-xs text-slate-400 py-3 text-center">IA marks for current academic cycle have not been published yet.</p>'
          }

          <!-- Semester Results Summary -->
          <div class="pt-3 border-t border-slate-100 space-y-2">
            <h5 class="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <i data-lucide="award" class="w-3.5 h-3.5 text-amber-600"></i>
              <span>University Semester Examination Ledger</span>
            </h5>

            ${
              student.semesterResults && student.semesterResults.length > 0
                ? `
              <div class="space-y-2">
                ${student.semesterResults
                  .map(
                    (r) => `
                  <div class="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                    <div>
                      <span class="font-bold text-slate-800">Semester ${r.semester}</span>
                      <span class="text-[11px] text-slate-500 ml-2">Seat No: ${r.examSeatNo || '—'}</span>
                    </div>
                    <div class="flex items-center gap-2">
                      <span class="font-bold text-teal-800 font-mono">SGPA: ${r.sgpa}</span>
                      <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        ${r.status}
                      </span>
                    </div>
                  </div>
                `
                  )
                  .join('')}
              </div>
            `
                : '<p class="text-xs text-slate-400">Previous semester results ledger pending verification from University of Mumbai Gazette.</p>'
            }
          </div>
        </div>

      </div>

      <!-- Compliance & Security Assurance Note -->
      <div class="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 flex items-center justify-between gap-4">
        <div class="flex items-center space-x-2">
          <i data-lucide="lock" class="w-4 h-4 text-slate-400 flex-shrink-0"></i>
          <span>
            This query event has been recorded in the institutional security audit ledger. Passwords, external tokens, and personal credentials are never exposed.
          </span>
        </div>
        <button
          onclick="window.appSetLookupTab('audit')"
          class="text-teal-800 font-bold hover:underline flex-shrink-0"
        >
          View Audit Log
        </button>
      </div>

    </div>
  `;
}

/**
 * Initial State Display with Guidance
 */
function renderInitialEmptyState(user, isAdmin) {
  return `
    <div class="card-subtle p-8 sm:p-12 bg-white text-center space-y-4 border border-dashed border-slate-200">
      <div class="w-14 h-14 mx-auto rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-800 shadow-sm">
        <i data-lucide="search" class="w-7 h-7"></i>
      </div>

      <div class="max-w-md mx-auto space-y-1">
        <h3 class="font-bold text-slate-800 text-base">Ready for Student Record Retrieval</h3>
        <p class="text-xs text-slate-500 leading-relaxed">
          ${
            isAdmin
              ? 'As a System Administrator, you can search for any student across all 6 engineering departments by PID or PRN.'
              : `As a faculty member in ${user.department || 'Computer Engineering'}, you are authorized to search records of students enrolled in your department.`
          }
        </p>
      </div>

      <div class="flex items-center justify-center gap-3 pt-2 flex-wrap">
        <button
          type="button"
          onclick="document.getElementById('student-pid-input')?.focus()"
          class="px-4 py-2 rounded-xl bg-[#247F73] hover:bg-[#19685F] text-white text-xs font-semibold shadow-sm transition flex items-center space-x-1.5"
        >
          <i data-lucide="search" class="w-4 h-4"></i>
          <span>Enter Student Identifier</span>
        </button>

        ${
          isAdmin
            ? `
          <button
            type="button"
            onclick="window.appSetLookupTab('import')"
            class="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition flex items-center space-x-1.5"
          >
            <i data-lucide="upload-cloud" class="w-4 h-4 text-teal-700"></i>
            <span>Upload Official Roster (CSV)</span>
          </button>
        `
            : ''
        }
      </div>
    </div>
  `;
}

/**
 * 2. Admin CSV Batch Import View
 */
function renderImportTabContent(lookupState, user, isAdmin) {
  const currentStudents = misStore.getImportedStudents();
  const previewData = lookupState.csvPreviewData || null;
  const officialCount = typeof misStore.getOfficialStudentCount === 'function' ? misStore.getOfficialStudentCount() : 0;
  const seedCount = typeof misStore.getSeedStudentCount === 'function' ? misStore.getSeedStudentCount() : 0;
  const testCount = typeof misStore.getSyntheticTestCount === 'function' ? misStore.getSyntheticTestCount() : 0;
  const importMethod = lookupState.importInputMethod || 'file'; // 'file' | 'paste'

  return `
    <div class="space-y-6">
      
      <!-- Import Header Card -->
      <div class="card-subtle p-6 bg-white space-y-5">
        <div class="flex flex-col lg:flex-row lg:items-center justify-between pb-4 border-b border-slate-100 gap-3">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="text-xs px-2.5 py-0.5 rounded-full font-bold bg-teal-50 text-teal-800 border border-teal-200">
                AUTHORIZED ROSTER SYNC
              </span>
              <span class="text-xs text-slate-500">
                ${isAdmin ? 'Campus-Wide Registrar Authority' : `Department of ${user?.department || 'COMP'}`}
              </span>
            </div>
            <h3 class="text-lg font-bold text-slate-800">Student Roster Import (CSV & Excel)</h3>
            <p class="text-xs text-slate-500 max-w-xl">
              Synchronize student rosters into the authorized local database layer with automatic column mapping, duplicate detection, and validation.
            </p>
          </div>

          <!-- Template & Test Download Actions -->
          <div class="flex items-center gap-2 self-start lg:self-auto flex-wrap">
            <button
              type="button"
              onclick="window.appDownloadBlankCsvTemplate()"
              class="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition flex items-center space-x-1.5 shadow-sm"
              title="Download clean CSV header template without sample data for official roster entry"
            >
              <i data-lucide="file-spreadsheet" class="w-3.5 h-3.5 text-teal-700"></i>
              <span>Blank CSV Template</span>
            </button>
            <button
              type="button"
              onclick="window.appDownloadSyntheticTestCsv()"
              class="px-3 py-1.5 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-semibold transition flex items-center space-x-1.5 shadow-sm"
              title="Download explicitly labelled synthetic test rows for QA / developer verification"
            >
              <i data-lucide="download" class="w-3.5 h-3.5 text-purple-700"></i>
              <span>Synthetic Test CSV</span>
            </button>
            <button
              type="button"
              onclick="window.appLoadSyntheticTestRoster()"
              class="px-3.5 py-1.5 rounded-xl bg-[#247F73] hover:bg-[#19685F] text-white text-xs font-bold shadow-sm transition flex items-center space-x-1.5"
              title="Immediately load synthetic test records into the import preview without uploading a file"
            >
              <i data-lucide="play" class="w-3.5 h-3.5"></i>
              <span>Quick-Load Test Data</span>
            </button>
          </div>
        </div>

        <!-- Format Specifications & Field Instructions Collapsible -->
        <details class="rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-xs space-y-3">
          <summary class="cursor-pointer font-bold text-slate-800 hover:text-teal-800 flex items-center justify-between select-none">
            <span class="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-slate-700">
              <i data-lucide="info" class="w-4 h-4 text-teal-700"></i>
              <span>Roster Format Specifications & Accepted Column Headers</span>
            </span>
            <span class="text-[11px] text-teal-700 font-semibold">Click to expand format details &darr;</span>
          </summary>

          <div class="pt-3 border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4 text-slate-600">
            <div>
              <h5 class="font-bold text-slate-800 uppercase text-[10px] tracking-wider mb-1.5">Mandatory Columns (Must be present in file)</h5>
              <ul class="space-y-1 text-[11px] list-disc list-inside">
                <li><strong class="font-mono text-slate-800">studentId</strong> or <strong class="font-mono text-slate-800">pid</strong>: Official SJCEM Student ID (e.g. <code>EU20220084</code>, <code>EU20230041</code>).</li>
                <li><strong class="font-mono text-slate-800">fullName</strong> or <strong class="font-mono text-slate-800">firstName</strong>, <strong class="font-mono text-slate-800">lastName</strong>: Candidate name (e.g. <code>Rahul Suresh Sharma</code>).</li>
                <li><strong class="font-mono text-slate-800">department</strong> or <strong class="font-mono text-slate-800">dept</strong>: Branch code (<code>COMP</code>, <code>IT</code>, <code>AIDS</code>, <code>MECH</code>, <code>CIVIL</code>, <code>EXTC</code>).</li>
                <li><strong class="font-mono text-slate-800">semester</strong>: Integer between <code>1</code> and <code>8</code>.</li>
              </ul>
            </div>

            <div>
              <h5 class="font-bold text-slate-800 uppercase text-[10px] tracking-wider mb-1.5">Optional & Auxiliary Columns</h5>
              <ul class="space-y-1 text-[11px] list-disc list-inside">
                <li><strong class="font-mono text-slate-800">prn</strong>: 16-digit University of Mumbai PRN (e.g. <code>2022016400987654</code>).</li>
                <li><strong class="font-mono text-slate-800">rollNumber</strong>: Class Roll Number (e.g. <code>SJCEM2022CS084</code>).</li>
                <li><strong class="font-mono text-slate-800">attendance</strong>: Attendance % between <code>0.0</code> and <code>100.0</code>.</li>
                <li><strong class="font-mono text-slate-800">cgpa</strong>, <strong class="font-mono text-slate-800">sgpa</strong>: Academic grade pointer (e.g. <code>8.84</code>).</li>
                <li><strong class="font-mono text-slate-800">division</strong> (<code>A</code>, <code>B</code>), <strong class="font-mono text-slate-800">admissionYear</strong>, <strong class="font-mono text-slate-800">academicYear</strong>, <strong class="font-mono text-slate-800">advisor</strong>.</li>
              </ul>
            </div>
          </div>
          
          <div class="p-2.5 rounded-lg bg-teal-50 border border-teal-200 text-teal-900 text-[11px] leading-relaxed">
            <strong>Supported File Formats:</strong> <code>.csv</code>, <code>.xlsx</code> (Excel 2007+), <code>.xls</code> (Excel 97-2003), and <code>.tsv</code>. Column headers are automatically normalized (case-insensitive, ignores spaces and underscores).
          </div>
        </details>

        <!-- Zero-IT / Database Architecture Status Card -->
        <div class="rounded-xl border border-slate-200 bg-slate-900 text-white p-4 space-y-2 text-xs">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-2 text-teal-300 font-bold text-xs uppercase tracking-wider">
              <i data-lucide="database" class="w-4 h-4 text-teal-400"></i>
              <span>Database Architecture & Zero-IT Access Mode</span>
            </div>
            <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              OFFLINE / LOCAL STORAGE ACTIVE
            </span>
          </div>
          <p class="text-xs text-slate-300 leading-relaxed">
            Without college IT department intervention or network database credentials, Student MIS operates using its <strong>offline local database persistence layer</strong> (mirrored to <code>imported_student_records</code> in browser storage). All imports, duplicate merges, and role-based lookups persist across page reloads.
          </p>
          <p class="text-[11px] text-slate-400 leading-relaxed">
            <strong>Live Supabase Backend Setup:</strong> When official database infrastructure is provisioned, execute the SQL migration at <code>supabase/migrations/20261024_student_retrieval_and_import_schema.sql</code> to create the PostgreSQL tables and Row-Level Security policies on your Supabase cluster.
          </p>
        </div>

        <!-- Import Method Selector Tabs -->
        <div class="flex items-center space-x-2 border-b border-slate-100 pb-2 text-xs font-semibold">
          <button
            type="button"
            onclick="window.appSetImportMethod('file')"
            class="px-3.5 py-1.5 rounded-lg transition flex items-center space-x-1.5 ${
              importMethod === 'file'
                ? 'bg-teal-50 text-teal-800 font-bold border border-teal-200'
                : 'text-slate-600 hover:bg-slate-50'
            }"
          >
            <i data-lucide="upload" class="w-3.5 h-3.5"></i>
            <span>Upload Spreadsheet File (.csv, .xlsx, .xls, .tsv)</span>
          </button>

          <button
            type="button"
            onclick="window.appSetImportMethod('paste')"
            class="px-3.5 py-1.5 rounded-lg transition flex items-center space-x-1.5 ${
              importMethod === 'paste'
                ? 'bg-teal-50 text-teal-800 font-bold border border-teal-200'
                : 'text-slate-600 hover:bg-slate-50'
            }"
          >
            <i data-lucide="clipboard-paste" class="w-3.5 h-3.5"></i>
            <span>Paste Spreadsheet Rows</span>
          </button>
        </div>

        <!-- Mode A: File Upload Zone -->
        ${
          importMethod === 'file'
            ? `
          <div class="border-2 border-dashed border-teal-300/80 bg-teal-50/40 rounded-2xl p-8 text-center space-y-3">
            <div class="w-12 h-12 mx-auto rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center shadow-sm">
              <i data-lucide="file-spreadsheet" class="w-6 h-6"></i>
            </div>
            <div>
              <label for="spreadsheet-file-input" class="cursor-pointer text-sm font-bold text-teal-800 hover:text-teal-900 underline">
                Choose Excel or CSV File to Upload
              </label>
              <span class="text-xs text-slate-500 block mt-1">Supports official .xlsx, .xls, .csv, and .tsv formats</span>
              <input
                type="file"
                id="spreadsheet-file-input"
                accept=".csv,.xlsx,.xls,.tsv,text/csv,text/tab-separated-values,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                class="hidden"
                onchange="window.appHandleFileUpload(this)"
              />
            </div>
            <p class="text-[11px] text-slate-400">
              Auto-maps columns: Student ID (PID), PRN, Student Name, Department, Semester, Roll Number, Attendance, CGPA.
            </p>
          </div>
        `
            : `
          <!-- Mode B: Direct Paste Zone -->
          <div class="space-y-3">
            <label for="spreadsheet-paste-textarea" class="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Paste Spreadsheet Data (with Header Row)
            </label>
            <textarea
              id="spreadsheet-paste-textarea"
              rows="5"
              placeholder="Paste tab-separated or comma-separated rows copied from Excel, Google Sheets, or Registrar export...&#10;e.g.&#10;studentId	fullName	department	semester	prn&#10;EU20220084	Rahul Sharma	COMP	6	2022016400987654"
              class="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-xs font-mono placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-700 focus:bg-white transition"
            ></textarea>
            <div class="flex justify-end">
              <button
                type="button"
                onclick="window.appHandlePasteImport()"
                class="px-4 py-2 rounded-xl bg-[#247F73] hover:bg-[#19685F] text-white text-xs font-bold shadow-sm transition flex items-center space-x-1.5"
              >
                <i data-lucide="check" class="w-4 h-4"></i>
                <span>Parse & Validate Pasted Rows</span>
              </button>
            </div>
          </div>
        `
        }

        <!-- Preview Area if parsed -->
        ${
          previewData
            ? `
          <div class="space-y-4 pt-4 border-t border-slate-200">
            
            <!-- Summary Stats Banner -->
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <h4 class="font-bold text-slate-800 text-sm">Batch Validation & Mapping Summary</h4>
                <p class="text-xs text-slate-500 mt-0.5">
                  ${escapeHtml(previewData.summary || '')}
                </p>
              </div>

              <div class="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onclick="window.appCancelSpreadsheetPreview()"
                  class="px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onclick="window.appCommitSpreadsheetImport()"
                  class="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-sm transition flex items-center space-x-1.5"
                >
                  <i data-lucide="check-circle" class="w-4 h-4"></i>
                  <span>Commit Roster to Database</span>
                </button>
              </div>
            </div>

            <!-- Stats Metric Cards -->
            <div class="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              <div class="p-3 rounded-xl bg-white border border-slate-200">
                <span class="text-[10px] uppercase font-bold text-slate-400">Total Rows</span>
                <span class="text-base font-bold text-slate-800 block mt-0.5">${previewData.totalRows}</span>
              </div>
              <div class="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                <span class="text-[10px] uppercase font-bold text-emerald-800">Valid Records</span>
                <span class="text-base font-bold text-emerald-900 block mt-0.5">${previewData.validCount}</span>
              </div>
              <div class="p-3 rounded-xl bg-amber-50 border border-amber-200">
                <span class="text-[10px] uppercase font-bold text-amber-800">Batch Duplicates</span>
                <span class="text-base font-bold text-amber-900 block mt-0.5">${previewData.duplicateInBatchCount || 0}</span>
              </div>
              <div class="p-3 rounded-xl bg-purple-50 border border-purple-200">
                <span class="text-[10px] uppercase font-bold text-purple-800">Existing in DB</span>
                <span class="text-base font-bold text-purple-900 block mt-0.5">${previewData.existingInDbCount || 0}</span>
              </div>
              <div class="p-3 rounded-xl ${previewData.errorCount > 0 ? 'bg-rose-50 border-rose-200' : 'bg-slate-50 border-slate-200'}">
                <span class="text-[10px] uppercase font-bold ${previewData.errorCount > 0 ? 'text-rose-800' : 'text-slate-500'}">Rejected Rows</span>
                <span class="text-base font-bold ${previewData.errorCount > 0 ? 'text-rose-900' : 'text-slate-800'} block mt-0.5">${previewData.errorCount || 0}</span>
              </div>
            </div>

            <!-- Detected Column Mapping -->
            ${
              previewData.detectedColumns && Object.keys(previewData.detectedColumns).length > 0
                ? `
              <div class="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
                <span class="font-bold text-slate-700 text-[11px] uppercase tracking-wider block">Detected Column Mapping:</span>
                <div class="flex items-center gap-2 flex-wrap">
                  ${Object.entries(previewData.detectedColumns)
                    .map(
                      ([canonical, orig]) => `
                    <span class="px-2 py-1 rounded-md bg-white border border-slate-200 font-mono text-[11px] text-slate-700">
                      <strong>${canonical}</strong> &larr; <em>"${escapeHtml(orig)}"</em>
                    </span>
                  `
                    )
                    .join('')}
                </div>
              </div>
            `
                : ''
            }

            <!-- Import Options -->
            <div class="p-4 rounded-xl bg-teal-50/50 border border-teal-200/80 space-y-2 text-xs">
              <span class="font-bold text-teal-900 uppercase text-[11px] tracking-wider block">Import & Storage Options</span>
              <div class="flex flex-col sm:flex-row sm:items-center gap-4">
                <label class="flex items-center gap-2 cursor-pointer text-slate-700">
                  <input type="checkbox" id="import-purge-seed-checkbox" ${seedCount > 0 ? 'checked' : ''} class="rounded text-teal-700 focus:ring-teal-700" />
                  <span>Purge ${seedCount} sample seed record(s) before importing official roster</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer text-slate-700">
                  <input type="checkbox" id="import-update-duplicates" checked class="rounded text-teal-700 focus:ring-teal-700" />
                  <span>Update & merge existing student records if matching identifier is in database</span>
                </label>
              </div>
            </div>

            <!-- Preview Table -->
            <div class="border border-slate-200 rounded-xl overflow-x-auto max-h-64">
              <table class="w-full text-left text-xs">
                <thead class="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 sticky top-0">
                  <tr>
                    <th class="py-2.5 px-3">Student ID</th>
                    <th class="py-2.5 px-3">Student Name</th>
                    <th class="py-2.5 px-2">Dept</th>
                    <th class="py-2.5 px-2">Sem</th>
                    <th class="py-2.5 px-3 text-right">Attendance</th>
                    <th class="py-2.5 px-3 text-right">CGPA</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  ${previewData.records
                    .slice(0, 10)
                    .map(
                      (r) => `
                    <tr class="hover:bg-slate-50/50">
                      <td class="py-2 px-3 font-mono font-bold text-teal-800">${escapeHtml(r.studentId || r.pid)}</td>
                      <td class="py-2 px-3 font-medium text-slate-800">${escapeHtml(r.firstName)} ${escapeHtml(r.lastName)}</td>
                      <td class="py-2 px-2">${escapeHtml(r.departmentCode)}</td>
                      <td class="py-2 px-2">Sem ${r.semester}</td>
                      <td class="py-2 px-3 text-right font-semibold">${r.attendancePercentage}%</td>
                      <td class="py-2 px-3 text-right font-mono font-bold text-slate-800">${r.cgpa}</td>
                    </tr>
                  `
                    )
                    .join('')}
                </tbody>
              </table>
            </div>
            ${
              previewData.records.length > 10
                ? `<p class="text-[11px] text-slate-400 text-center">... and ${previewData.records.length - 10} more rows ready to commit.</p>`
                : ''
            }

            <!-- Validation Warnings (if any) -->
            ${
              previewData.errors && previewData.errors.length > 0
                ? `
              <details class="text-xs">
                <summary class="cursor-pointer font-bold text-rose-700 hover:text-rose-900 select-none">
                  View ${previewData.errors.length} Rejected Row Warning(s)
                </summary>
                <div class="mt-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 font-mono text-[11px] max-h-40 overflow-y-auto space-y-1">
                  ${previewData.errors.map((e) => `<div>• ${escapeHtml(e)}</div>`).join('')}
                </div>
              </details>
            `
                : ''
            }
          </div>
        `
            : ''
        }

      </div>

      <!-- Currently Stored Records Summary -->
      <div class="card-subtle p-6 bg-white space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
          <div>
            <h4 class="font-bold text-slate-800 text-sm">
              Active Database Records (${currentStudents.length} Total: ${officialCount} Official, ${testCount} Synthetic Test, ${seedCount} Seed Fixtures)
            </h4>
            <p class="text-xs text-slate-500">
              Records currently stored in the authorized local database layer (table: <code>imported_student_records</code>).
            </p>
          </div>

          <div class="flex items-center gap-2 flex-wrap">
            ${
              testCount > 0
                ? `
              <button
                type="button"
                onclick="window.appPurgeSyntheticTestImports()"
                title="Remove imported synthetic test records"
                class="px-3 py-1.5 rounded-lg border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-semibold transition flex items-center space-x-1"
              >
                <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                <span>Purge Test Imports (${testCount})</span>
              </button>
            `
                : ''
            }
            ${
              seedCount > 0
                ? `
              <button
                type="button"
                onclick="window.appPurgeSeedRecords()"
                title="Remove sample seed test fixtures"
                class="px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition flex items-center space-x-1"
              >
                <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                <span>Purge Sample Seeds (${seedCount})</span>
              </button>
            `
                : `
              <button
                type="button"
                onclick="window.appResetSeedRecords()"
                title="Restore sample seed records for testing"
                class="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-semibold transition flex items-center space-x-1"
              >
                <i data-lucide="rotate-ccw" class="w-3.5 h-3.5"></i>
                <span>Load Sample Seeds</span>
              </button>
            `
            }
          </div>
        </div>

        <div class="border border-slate-200 rounded-xl overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
              <tr>
                <th class="py-2.5 px-3">Student ID / PRN</th>
                <th class="py-2.5 px-3">Student Name</th>
                <th class="py-2.5 px-2">Dept</th>
                <th class="py-2.5 px-2">Sem / Div</th>
                <th class="py-2.5 px-3">Record Classification</th>
                <th class="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              ${
                currentStudents.length === 0
                  ? '<tr><td colspan="6" class="p-8 text-center text-slate-400">No student records in database. Please upload or paste a roster spreadsheet above.</td></tr>'
                  : currentStudents
                      .map((s) => {
                        const isSeed = s.isSeedRecord || s.sourceType === 'SYNTHETIC_SEED';
                        const isTestImport = s.sourceType === 'SYNTHETIC_TEST_IMPORT';
                        const badgeStyle = isSeed
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : isTestImport
                          ? 'bg-purple-50 text-purple-800 border border-purple-200'
                          : 'bg-emerald-50 text-emerald-800 border border-emerald-200';
                        const badgeText = isSeed
                          ? 'SYNTHETIC SEED'
                          : isTestImport
                          ? 'SYNTHETIC TEST IMPORT'
                          : 'OFFICIAL RECORD';
                        return `
                    <tr class="hover:bg-slate-50/50">
                      <td class="py-2.5 px-3">
                        <span class="font-mono font-bold text-teal-800 block">${escapeHtml(s.studentId || s.pid)}</span>
                        <span class="text-[10px] text-slate-400 block font-mono">PRN: ${escapeHtml(s.prn)}</span>
                      </td>
                      <td class="py-2.5 px-3 font-semibold text-slate-800">${escapeHtml(s.firstName)} ${escapeHtml(s.lastName)}</td>
                      <td class="py-2.5 px-2">${escapeHtml(s.departmentCode)}</td>
                      <td class="py-2.5 px-2">Sem ${s.semester} (${escapeHtml(s.division)})</td>
                      <td class="py-2.5 px-3">
                        <span class="px-2 py-0.5 rounded text-[10px] font-bold ${badgeStyle}">
                          ${badgeText}
                        </span>
                      </td>
                      <td class="py-2.5 px-3 text-right">
                        <button
                          type="button"
                          onclick="window.appQuickLookupPid('${escapeHtml(s.studentId || s.pid)}')"
                          class="px-2.5 py-1 rounded bg-teal-50 hover:bg-teal-100 text-teal-800 text-[11px] font-semibold transition"
                        >
                          Inspect Profile
                        </button>
                      </td>
                    </tr>
                  `;
                      })
                      .join('')
              }
            </tbody>
          </table>
        </div>
      </div>

    </div>
  `;
}

/**
 * Development-Only Query Diagnostic Renderer
 * Displays data source, queried table, evaluated columns, query trace, and safe error details.
 * Strict Security: ZERO passwords, ZERO credentials, ZERO secrets exposed.
 */
function renderDevDiagnostic(diag) {
  if (!diag) return '';

  const isSuccess = diag.outcome && (diag.outcome.code === 'SUCCESS' || diag.outcome.httpStatus === 200);
  const isNotFound = diag.outcome && (diag.outcome.code === 'STUDENT_NOT_FOUND' || diag.outcome.httpStatus === 404);
  const isDenied = diag.outcome && (diag.outcome.code === 'ACCESS_DENIED' || diag.outcome.httpStatus === 403);

  const badgeClass = isSuccess
    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
    : isDenied
    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
    : isNotFound
    ? 'bg-slate-700 text-slate-300 border border-slate-600'
    : 'bg-rose-500/20 text-rose-300 border border-rose-500/30';

  return `
    <details class="card-subtle p-4 bg-slate-900 border border-slate-800 rounded-2xl text-xs font-mono text-slate-300 space-y-3 mt-4" open>
      <summary class="cursor-pointer font-bold text-xs flex items-center justify-between text-teal-400 hover:text-teal-300 select-none pb-1">
        <div class="flex items-center gap-2">
          <i data-lucide="terminal" class="w-4 h-4 text-teal-400"></i>
          <span class="tracking-wider">DEVELOPMENT QUERY DIAGNOSTIC</span>
          <span class="text-[10px] text-slate-400 font-normal">(${diag.dataSource || 'Local Database'})</span>
        </div>
        <span class="text-[10px] uppercase font-bold px-2 py-0.5 rounded ${badgeClass}">
          ${diag.outcome?.code || 'STATUS'} (${diag.outcome?.httpStatus || '---'})
        </span>
      </summary>

      <div class="pt-3 border-t border-slate-800 space-y-2.5 text-[11px] leading-relaxed">
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
          <div class="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <span class="text-slate-500 block uppercase text-[9px] tracking-wider font-bold">Selected Data Source</span>
            <span class="text-slate-200 font-semibold mt-0.5 block truncate" title="${escapeHtml(diag.dataSource || 'Local Database')}">
              ${escapeHtml(diag.dataSource || 'Local DB')}
            </span>
          </div>

          <div class="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <span class="text-slate-500 block uppercase text-[9px] tracking-wider font-bold">Queried Table</span>
            <span class="text-teal-300 font-semibold mt-0.5 block truncate">
              ${escapeHtml(diag.table || 'imported_student_records')}
            </span>
          </div>

          <div class="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <span class="text-slate-500 block uppercase text-[9px] tracking-wider font-bold">Columns Evaluated</span>
            <span class="text-amber-300 font-semibold mt-0.5 block truncate" title="${(diag.columnsEvaluated || []).join(', ')}">
              [${(diag.columnsEvaluated || ['student_id', 'pid', 'prn', 'roll_number']).join(', ')}]
            </span>
          </div>

          <div class="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <span class="text-slate-500 block uppercase text-[9px] tracking-wider font-bold">Database State</span>
            <span class="text-slate-200 font-semibold mt-0.5 block">
              ${diag.databaseMetrics?.officialRecords || 0} Official | ${diag.databaseMetrics?.syntheticSeedRecords || 0} Seed
            </span>
          </div>
        </div>

        <div class="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
          <div class="flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold tracking-wider">
            <span>Safe Outcome & Error Details (Zero Credentials Exposed)</span>
            <span>Query: "${escapeHtml(diag.queriedInput?.sanitized || '')}"</span>
          </div>
          <p class="text-teal-200 text-xs font-mono leading-relaxed">
            ${escapeHtml(diag.outcome?.safeMessage || 'Query completed.')}
          </p>
        </div>

        <div class="text-[10px] text-slate-500 flex items-center justify-between flex-wrap gap-2 pt-1">
          <span>Normalization: Trimmed, BOM-stripped, Lowercased, Prefix variants evaluated (${(diag.normalizationApplied?.evaluatedVariants || []).map((v) => `'${v}'`).join(', ')})</span>
          <span>Timestamp: ${diag.timestamp || new Date().toISOString()}</span>
        </div>
      </div>
    </details>
  `;
}

/**
 * 3. Retrieval Audit Log Trails View
 */
function renderAuditTabContent(isAdmin, facultyDept) {
  const allLogs = misStore.getLookupAuditLogs();
  const logsToDisplay = isAdmin
    ? allLogs
    : allLogs.filter((l) => l.actorDepartment === facultyDept || l.actorRole === 'faculty');

  return `
    <div class="card-subtle p-6 bg-white space-y-4">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
        <div>
          <h3 class="text-lg font-bold text-slate-800">Student Retrieval Security Audit Logs</h3>
          <p class="text-xs text-slate-500">
            Immutable log of all student PID searches, authorization successes, and access denials.
          </p>
        </div>

        <span class="text-xs px-3 py-1 rounded-full font-bold bg-slate-100 text-slate-700 self-start sm:self-auto">
          ${logsToDisplay.length} Recorded Queries
        </span>
      </div>

      <div class="border border-slate-200 rounded-xl overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead class="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
            <tr>
              <th class="py-2.5 px-3">Timestamp</th>
              <th class="py-2.5 px-3">Queried PID</th>
              <th class="py-2.5 px-3">Actor / Role</th>
              <th class="py-2.5 px-2">Result</th>
              <th class="py-2.5 px-3">Audit Details</th>
              <th class="py-2.5 px-2 text-right">IP Address</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            ${
              logsToDisplay.length === 0
                ? '<tr><td colspan="6" class="p-8 text-center text-slate-400">No lookup events recorded yet.</td></tr>'
                : logsToDisplay
                    .map((l) => {
                      const isSuccess = l.lookupResult === 'SUCCESS';
                      const isDenied = l.lookupResult === 'ACCESS_DENIED';
                      const badgeClass = isSuccess
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : isDenied
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : 'bg-rose-50 text-rose-800 border-rose-200';

                      return `
                    <tr class="hover:bg-slate-50/50">
                      <td class="py-2.5 px-3 text-slate-500 font-mono text-[11px] whitespace-nowrap">${l.timestamp}</td>
                      <td class="py-2.5 px-3 font-mono font-bold text-slate-800">${escapeHtml(l.queriedPid)}</td>
                      <td class="py-2.5 px-3">
                        <span class="font-bold text-slate-800 block">${escapeHtml(l.actorName)}</span>
                        <span class="text-[10px] text-slate-400 uppercase tracking-wide block">${l.actorRole} • ${l.actorDepartment || 'GEN'}</span>
                      </td>
                      <td class="py-2.5 px-2">
                        <span class="px-2 py-0.5 rounded text-[10px] font-bold border ${badgeClass}">
                          ${l.lookupResult}
                        </span>
                      </td>
                      <td class="py-2.5 px-3 text-slate-600 max-w-xs truncate" title="${escapeHtml(l.details)}">
                        ${escapeHtml(l.details)}
                      </td>
                      <td class="py-2.5 px-2 text-right font-mono text-slate-400 text-[11px]">${l.ipAddress || '127.0.0.1'}</td>
                    </tr>
                  `;
                    })
                    .join('')
            }
          </tbody>
        </table>
      </div>
    </div>
  `;
}

/**
 * 4. Admin Integration Settings & Service Health View
 */
function renderConfigTabContent(config, lookupState) {
  const isTesting = !!lookupState?.isTestingGateway;
  const testResult = lookupState?.gatewayTestResult || null;

  return `
    <div class="space-y-6">
      
      <!-- Integration Mode Selector Card -->
      <div class="card-subtle p-6 bg-white space-y-5">
        <div class="pb-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 class="text-lg font-bold text-slate-800">Integration Configuration & Authorized Gateway</h3>
            <p class="text-xs text-slate-500">
              Manage data source modes between authorized institutional batch import and server-to-server gateway.
            </p>
          </div>
          <button
            type="button"
            onclick="window.appTestGatewayConnection()"
            ${isTesting ? 'disabled' : ''}
            class="px-4 py-2 rounded-xl ${
              isTesting ? 'bg-slate-300 text-slate-600 cursor-not-allowed' : 'bg-slate-900 hover:bg-slate-800 text-white'
            } text-xs font-bold transition flex items-center space-x-1.5 self-start sm:self-auto shadow-sm"
          >
            <i data-lucide="${isTesting ? 'loader-2' : 'activity'}" class="w-4 h-4 ${isTesting ? 'animate-spin' : 'text-teal-400'}"></i>
            <span>${isTesting ? 'Testing Server Gateway...' : 'Test Gateway Connection'}</span>
          </button>
        </div>

        <!-- Mode Radio Options -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          <!-- Mode A: Local Authorized DB (Active) -->
          <div
            onclick="window.appUpdateIntegrationMode('LOCAL_IMPORTED')"
            class="p-4 rounded-xl border-2 transition cursor-pointer ${
              config.integrationMode === 'LOCAL_IMPORTED'
                ? 'border-teal-700 bg-teal-50/40 shadow-sm'
                : 'border-slate-200 hover:border-slate-300'
            }"
          >
            <div class="flex items-center justify-between mb-2">
              <span class="font-bold text-slate-800 text-sm">Mode A: Local Imported Data (Active)</span>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${
                config.integrationMode === 'LOCAL_IMPORTED'
                  ? 'bg-teal-700 text-white'
                  : 'bg-slate-200 text-slate-600'
              }">
                ${config.integrationMode === 'LOCAL_IMPORTED' ? 'CURRENTLY ACTIVE' : 'STANDBY'}
              </span>
            </div>
            <p class="text-xs text-slate-600 leading-relaxed">
              Uses institutional student records loaded via verified CSV/Excel import into the application's database. Complies fully with security policies when the external portal does not provide an authorized REST API.
            </p>
          </div>

          <!-- Mode B: External College API Gateway (Standby) -->
          <div
            onclick="window.appUpdateIntegrationMode('AUTHORIZED_API')"
            class="p-4 rounded-xl border-2 transition cursor-pointer ${
              config.integrationMode === 'AUTHORIZED_API'
                ? 'border-teal-700 bg-teal-50/40 shadow-sm'
                : 'border-slate-200 hover:border-slate-300'
            }"
          >
            <div class="flex items-center justify-between mb-2">
              <span class="font-bold text-slate-800 text-sm">Mode B: Server-to-Server Gateway (API)</span>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${
                config.integrationMode === 'AUTHORIZED_API'
                  ? 'bg-teal-700 text-white'
                  : 'bg-slate-200 text-slate-600'
              }">
                ${config.integrationMode === 'AUTHORIZED_API' ? 'CURRENTLY ACTIVE' : 'PENDING IT APPROVAL'}
              </span>
            </div>
            <p class="text-xs text-slate-600 leading-relaxed">
              Direct connection via server-side HTTPS proxy to official SJCEM API server with bearer token credentials, automated timeouts, and error handling. Requires institutional IT department API approval.
            </p>
          </div>

        </div>

        ${
          testResult
            ? `
          <!-- Gateway Test Outcome Diagnostic Card -->
          <div class="p-4 rounded-xl border ${
            testResult.success
              ? (testResult.isSimulated ? 'bg-amber-50/70 border-amber-300' : 'bg-emerald-50/70 border-emerald-300')
              : 'bg-rose-50/70 border-rose-300'
          } space-y-2.5 transition">
            <div class="flex items-center justify-between flex-wrap gap-2">
              <div class="flex items-center space-x-2">
                <i data-lucide="${testResult.success ? 'check-circle-2' : 'alert-octagon'}" class="w-4 h-4 ${
                  testResult.success ? (testResult.isSimulated ? 'text-amber-600' : 'text-emerald-600') : 'text-rose-600'
                }"></i>
                <span class="text-xs font-bold ${
                  testResult.success ? (testResult.isSimulated ? 'text-amber-900' : 'text-emerald-900') : 'text-rose-900'
                } uppercase tracking-wider">
                  Gateway Test Result: ${testResult.status || (testResult.success ? 'OPERATIONAL' : 'FAILED')}
                </span>
                ${
                  testResult.isSimulated
                    ? '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200 text-amber-900">SIMULATED ADAPTER TEST</span>'
                    : testResult.success
                    ? '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-200 text-emerald-900">LIVE OFFICIAL GATEWAY</span>'
                    : ''
                }
              </div>
              <div class="text-[11px] font-mono text-slate-600 flex items-center gap-3">
                ${testResult.latencyMs !== undefined ? `<span>Latency: <strong>${testResult.latencyMs}ms</strong></span>` : ''}
                <span>HTTP Status: <strong>${testResult.httpStatus || 503}</strong></span>
              </div>
            </div>

            <p class="text-xs ${testResult.success ? 'text-slate-800' : 'text-rose-800'} leading-relaxed font-medium">
              ${escapeHtml(testResult.message)}
            </p>

            <div class="text-[11px] font-mono text-slate-500 bg-white/70 p-2 rounded-lg border border-slate-200 flex flex-wrap gap-x-4 gap-y-1">
              <span>Endpoint: <strong>${escapeHtml(testResult.endpoint || 'Not Configured')}</strong></span>
              <span>Tested At: <strong>${new Date().toLocaleTimeString('en-US')}</strong></span>
            </div>
          </div>
        `
            : ''
        }

        <!-- External Portal Documentation & Security Analysis Box -->
        <div class="p-4 rounded-xl bg-slate-900 text-white space-y-2">
          <div class="flex items-center space-x-2 text-teal-300 font-bold text-xs uppercase tracking-wider">
            <i data-lucide="shield-alert" class="w-4 h-4"></i>
            <span>External Portal Inspection Notice: https://report.aldel.org/student_page.php</span>
          </div>
          <p class="text-xs text-slate-300 leading-relaxed">
            Inspection confirms that the legacy student portal at <code>https://report.aldel.org/student_page.php</code> operates as an interactive form requiring a Student ID, Password, and visual CAPTCHA verification. No public REST/GraphQL API or developer tokens are published.
          </p>
          <p class="text-xs text-amber-200/90 leading-relaxed">
            <strong>Security & Compliance Directive:</strong> In accordance with college IT policy and application security standards, Student MIS <strong>does NOT</strong> attempt automated CAPTCHA bypass, session cookie hijacking, or unofficial screen scraping. All live retrieval is routed through authorized local batch imports or server-side institutional gateway proxy once official credentials are provided.
          </p>
        </div>

        <!-- Advanced Gateway Parameters Form -->
        <div class="space-y-3 pt-2">
          <h4 class="font-bold text-slate-800 text-xs uppercase tracking-wider">Client Gateway Preferences</h4>
          
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label class="block font-semibold text-slate-600 mb-1">API Endpoint URL</label>
              <input
                type="text"
                id="config-api-endpoint"
                value="${escapeHtml(config.apiEndpointUrl)}"
                class="w-full p-2.5 rounded-lg border border-slate-200 font-mono text-xs text-slate-800 bg-slate-50"
              />
            </div>

            <div>
              <label class="block font-semibold text-slate-600 mb-1">Request Timeout (milliseconds)</label>
              <input
                type="number"
                id="config-api-timeout"
                value="${config.apiTimeoutMs}"
                class="w-full p-2.5 rounded-lg border border-slate-200 font-mono text-xs text-slate-800 bg-slate-50"
              />
            </div>
          </div>

          <div class="pt-2 flex justify-between items-center flex-wrap gap-2">
            <span class="text-[11px] text-slate-500 italic">
              Note: Confidential API keys and tokens are loaded on the server via environment variables, NEVER stored in client storage.
            </span>
            <button
              type="button"
              onclick="window.appSaveIntegrationConfig()"
              class="px-4 py-2 rounded-xl bg-[#247F73] hover:bg-[#19685F] text-white text-xs font-bold transition flex items-center space-x-1.5"
            >
              <i data-lucide="save" class="w-4 h-4"></i>
              <span>Save Preferences</span>
            </button>
          </div>
        </div>

      </div>

    </div>
  `;
}

// Utility to escape HTML to prevent XSS
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
