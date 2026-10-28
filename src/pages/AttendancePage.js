// SJCEM NEXT MIS Attendance Management Page
import { misStore } from '../services/store.js';

export function renderAttendancePage(filterSubject = 'ALL', filterStatus = 'ALL') {
  const attendance = misStore.getAttendance();
  const overall = misStore.getOverallAttendance();
  let logs = misStore.getAttendanceLogs();

  if (filterSubject !== 'ALL') {
    logs = logs.filter((l) => l.subjectCode === filterSubject);
  }
  if (filterStatus !== 'ALL') {
    logs = logs.filter((l) => l.status === filterStatus);
  }

  return `
    <div class="space-y-6 animate-fade-in pb-12">
      <!-- 1. Header & Summary Stats Row -->
      <div class="card-subtle p-6 bg-white border-slate-200">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <h2 class="text-xl md:text-2xl font-bold text-slate-800">Academic Attendance Record</h2>
              <span class="text-xs px-2.5 py-0.5 rounded-full font-bold bg-teal-50 text-teal-800 border border-teal-200">
                Sem VI (Active)
              </span>
            </div>
            <p class="text-xs md:text-sm text-slate-500">
              Verified classroom & laboratory lecture records updated up to 23 Oct 2026.
            </p>
          </div>

          <div class="flex items-center gap-2">
            <button
              onclick="window.appDownloadAttendanceReport()"
              class="px-4 py-2 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-semibold text-xs shadow-sm transition flex items-center gap-1.5"
            >
              <i data-lucide="download" class="w-3.5 h-3.5"></i>
              <span>Download Official Report (CSV)</span>
            </button>
          </div>
        </div>

        <!-- 3 Big Metric Highlights -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6">
          <div class="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
            <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Aggregate Attendance</span>
            <div class="text-3xl font-extrabold text-teal-800 mt-1">${overall.percentage}%</div>
            <span class="text-[11px] font-medium text-emerald-600 block mt-1">
              ✓ Satisfies Mumbai University 75% Rule
            </span>
          </div>

          <div class="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
            <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Total Lectures Attended</span>
            <div class="text-3xl font-extrabold text-slate-800 mt-1">${overall.attended}</div>
            <span class="text-[11px] font-medium text-slate-500 block mt-1">
              Out of ${overall.conducted} conducted sessions
            </span>
          </div>

          <div class="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
            <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Attendance Status</span>
            <div class="text-3xl font-extrabold text-emerald-600 mt-1">SAFE</div>
            <span class="text-[11px] font-medium text-slate-500 block mt-1">
              Eligible for University Examinations
            </span>
          </div>
        </div>
      </div>

      <!-- 2. Subject-wise Attendance Table -->
      <div class="card-subtle p-5 md:p-6 space-y-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-2">
            <i data-lucide="book-open" class="w-5 h-5 text-teal-800"></i>
            <h3 class="font-bold text-slate-800 text-base">Course-wise Attendance Breakdown</h3>
          </div>
          <span class="text-xs text-slate-400 font-medium">B.E. Computer Engg • Sem 6</span>
        </div>

        <div class="overflow-x-auto table-scroll-container">
          <table class="w-full text-left text-xs">
            <thead>
              <tr class="bg-slate-50 border-y border-slate-200 text-slate-500 uppercase font-semibold text-[11px]">
                <th class="py-3 px-4">Subject Code</th>
                <th class="py-3 px-4">Course Title</th>
                <th class="py-3 px-4">Faculty In-Charge</th>
                <th class="py-3 px-4 text-center">Attended</th>
                <th class="py-3 px-4 text-center">Conducted</th>
                <th class="py-3 px-4 text-center">Percentage</th>
                <th class="py-3 px-4 text-center">Compliance</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              ${attendance
                .map((row) => {
                  const isSafe = row.percentage >= 75;
                  const isWarning = row.percentage >= 65 && row.percentage < 75;

                  return `
                  <tr class="hover:bg-slate-50/80 transition">
                    <td class="py-3 px-4 font-mono font-bold text-teal-800">${row.subjectCode}</td>
                    <td class="py-3 px-4 font-bold text-slate-800">${row.subjectName}</td>
                    <td class="py-3 px-4 text-slate-600 font-medium">${row.facultyName}</td>
                    <td class="py-3 px-4 text-center font-mono font-bold text-slate-800">${row.attended}</td>
                    <td class="py-3 px-4 text-center font-mono text-slate-500">${row.conducted}</td>
                    <td class="py-3 px-4 text-center">
                      <div class="flex items-center justify-center gap-2">
                        <div class="w-16 bg-slate-200 rounded-full h-1.5 hidden sm:block">
                          <div class="${isSafe ? 'bg-teal-700' : isWarning ? 'bg-amber-500' : 'bg-rose-500'} h-1.5 rounded-full" style="width: ${row.percentage}%;"></div>
                        </div>
                        <span class="font-bold font-mono ${isSafe ? 'text-teal-800' : isWarning ? 'text-amber-600' : 'text-rose-600'}">
                          ${row.percentage}%
                        </span>
                      </div>
                    </td>
                    <td class="py-3 px-4 text-center">
                      <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isSafe
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : isWarning
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : 'bg-rose-50 text-rose-800 border border-rose-200'
                      }">
                        ${isSafe ? 'SAFE' : isWarning ? 'WARNING' : 'CRITICAL'}
                      </span>
                    </td>
                  </tr>
                `;
                })
                .join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- 3. Date-wise Attendance History Log with Filters -->
      <div class="card-subtle p-5 md:p-6 space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div class="flex items-center space-x-2">
            <i data-lucide="history" class="w-5 h-5 text-teal-800"></i>
            <h3 class="font-bold text-slate-800 text-base">Date-wise Lecture Log</h3>
          </div>

          <!-- Filters -->
          <div class="flex items-center gap-2 text-xs">
            <select
              id="filter-attendance-subject"
              onchange="window.appFilterAttendance()"
              class="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 font-medium focus:outline-none"
            >
              <option value="ALL" ${filterSubject === 'ALL' ? 'selected' : ''}>All Subjects</option>
              ${attendance
                .map((a) => `<option value="${a.subjectCode}" ${filterSubject === a.subjectCode ? 'selected' : ''}>${a.subjectCode} - ${a.subjectName.substring(0, 20)}...</option>`)
                .join('')}
            </select>

            <select
              id="filter-attendance-status"
              onchange="window.appFilterAttendance()"
              class="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 font-medium focus:outline-none"
            >
              <option value="ALL" ${filterStatus === 'ALL' ? 'selected' : ''}>All Statuses</option>
              <option value="PRESENT" ${filterStatus === 'PRESENT' ? 'selected' : ''}>Present</option>
              <option value="ABSENT" ${filterStatus === 'ABSENT' ? 'selected' : ''}>Absent</option>
              <option value="LATE" ${filterStatus === 'LATE' ? 'selected' : ''}>Late</option>
            </select>
          </div>
        </div>

        <!-- Logs Table -->
        <div class="overflow-x-auto table-scroll-container">
          <table class="w-full text-left text-xs">
            <thead>
              <tr class="bg-slate-50 border-y border-slate-200 text-slate-500 uppercase font-semibold text-[11px]">
                <th class="py-2.5 px-4">Date</th>
                <th class="py-2.5 px-4">Time Slot</th>
                <th class="py-2.5 px-4">Subject</th>
                <th class="py-2.5 px-4">Session Type</th>
                <th class="py-2.5 px-4">Conducted By</th>
                <th class="py-2.5 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              ${
                logs.length === 0
                  ? `
                <tr>
                  <td colspan="6" class="py-8 text-center text-slate-400">
                    No attendance records found matching selected filters.
                  </td>
                </tr>
              `
                  : logs
                      .map((log) => {
                        const statusClass =
                          log.status === 'PRESENT'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : log.status === 'LATE'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-rose-50 text-rose-800 border-rose-200';

                        return `
                  <tr class="hover:bg-slate-50/80 transition">
                    <td class="py-2.5 px-4 font-mono font-bold text-slate-800">${log.date}</td>
                    <td class="py-2.5 px-4 text-slate-500 font-medium">${log.time}</td>
                    <td class="py-2.5 px-4">
                      <span class="font-bold text-slate-800 block">${log.subjectName}</span>
                      <span class="text-[10px] text-teal-800 font-mono">${log.subjectCode}</span>
                    </td>
                    <td class="py-2.5 px-4">
                      <span class="text-[10px] px-2 py-0.5 rounded font-mono font-medium ${
                        log.type === 'LAB' ? 'bg-purple-50 text-purple-700' : 'bg-slate-100 text-slate-700'
                      }">
                        ${log.type}
                      </span>
                    </td>
                    <td class="py-2.5 px-4 text-slate-600">${log.facultyName}</td>
                    <td class="py-2.5 px-4 text-center">
                      <span class="px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusClass}">
                        ${log.status}
                      </span>
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

      <!-- Legal & University Notice Footer -->
      <div class="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 leading-relaxed">
        <p class="font-semibold text-slate-700 mb-1">Institutional Attendance Policy (Mumbai University Ordinance 6086):</p>
        <p>
          A minimum of 75% attendance in theory lectures and practicals is compulsory to be eligible to appear for semester-end examinations. Students falling between 60% and 74% due to medical emergencies must submit medical certificates attested by an authorized civil surgeon to the Academic Dean within 3 days of resuming college.
        </p>
      </div>
    </div>
  `;
}
