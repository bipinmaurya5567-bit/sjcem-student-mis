// SJCEM NEXT MIS — Authorized Faculty Class Attendance Management Page
// Institution: St. John College of Engineering and Management, Palghar
// Managed by: ALDEL Education Trust

import { misStore } from '../services/store.js';

export function renderFacultyAttendancePage(selectedSubjectCode = 'CSC601', selectedDivision = 'TE COMP Div A') {
  const user = misStore.getCurrentUser();
  if (!user || user.role !== 'faculty') {
    return `
      <div class="card-subtle p-8 text-center text-slate-500 space-y-3">
        <i data-lucide="shield-alert" class="w-10 h-10 text-rose-600 mx-auto"></i>
        <h3 class="text-base font-bold text-slate-800">Faculty Authorization Required</h3>
        <p class="text-xs text-slate-600">Attendance registers can only be accessed and recorded by authorized teaching faculty.</p>
      </div>
    `;
  }

  const assignedClasses = misStore.getFacultyClasses();
  const activeClass = assignedClasses.find((c) => c.subjectCode === selectedSubjectCode) || assignedClasses[0];
  const students = misStore.getClassRoster(selectedDivision);
  const todayStr = new Date().toISOString().split('T')[0];

  return `
    <div class="space-y-6 animate-fade-in pb-12">
      <!-- 1. Page Header -->
      <div class="card-subtle p-6 bg-white border border-[#DCE4EE] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2 mb-1.5 flex-wrap">
            <span class="text-xs px-2.5 py-0.5 rounded-full font-bold bg-[#F0F4FA] text-[#073B70] border border-[#DCE4EE] flex items-center gap-1.5">
              <i data-lucide="calendar-check" class="w-3.5 h-3.5 text-[#073B70]"></i>
              <span>CLASSROOM ATTENDANCE REGISTER</span>
            </span>
            <span class="text-xs text-slate-500">
              Department of ${user.department || 'Computer Engineering'}
            </span>
          </div>
          <h2 class="text-xl md:text-2xl font-bold text-slate-800 tracking-tight">Classroom Attendance Management</h2>
          <p class="text-xs md:text-sm text-slate-500 mt-0.5">
            Record, verify, and lock attendance for conducted theory lectures and laboratory batches with tamper-evident audit trails.
          </p>
        </div>

        <div class="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onclick="window.appQuickMarkAllAttendance('PRESENT')"
            class="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-semibold text-xs transition flex items-center gap-1.5"
          >
            <i data-lucide="check-check" class="w-3.5 h-3.5 text-emerald-600"></i>
            <span>Mark All Present</span>
          </button>
          <button
            type="button"
            onclick="window.appQuickMarkAllAttendance('ABSENT')"
            class="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 font-semibold text-xs transition flex items-center gap-1.5"
          >
            <i data-lucide="x" class="w-3.5 h-3.5 text-rose-600"></i>
            <span>Mark All Absent</span>
          </button>
        </div>
      </div>

      <!-- 2. Lecture Session Selector Configuration Card -->
      <div class="card-subtle p-5 md:p-6 bg-white space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100">
          <div class="flex items-center space-x-2">
            <i data-lucide="sliders" class="w-4 h-4 text-[#073B70]"></i>
            <h3 class="font-bold text-slate-800 text-sm md:text-base">Session Parameters</h3>
          </div>
          <span class="text-[11px] font-mono font-medium text-slate-400">AY 2025–26 • Term VI</span>
        </div>

        <form id="attendance-session-form" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <!-- Course / Subject -->
          <div>
            <label class="block text-slate-700 font-bold mb-1">Assigned Course</label>
            <select
              id="faculty-att-subject-select"
              onchange="window.appChangeAttendanceClass(this.value)"
              class="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold text-slate-800 focus:outline-none focus:border-[#073B70]"
            >
              ${assignedClasses
                .map(
                  (c) => `
                <option value="${c.subjectCode}" ${c.subjectCode === activeClass.subjectCode ? 'selected' : ''}>
                  ${c.subjectCode} — ${c.subjectName} (${c.type})
                </option>
              `
                )
                .join('')}
            </select>
          </div>

          <!-- Class Division / Batch -->
          <div>
            <label class="block text-slate-700 font-bold mb-1">Class Division / Batch</label>
            <select
              id="faculty-att-division-select"
              class="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold text-slate-800 focus:outline-none focus:border-[#073B70]"
            >
              <option value="${activeClass.division}" selected>${activeClass.division}</option>
              <option value="TE COMP Div A (Batch A1)">TE COMP Div A (Batch A1)</option>
              <option value="TE COMP Div A (Batch A2)">TE COMP Div A (Batch A2)</option>
            </select>
          </div>

          <!-- Lecture Date -->
          <div>
            <label class="block text-slate-700 font-bold mb-1">Session Date</label>
            <input
              type="date"
              id="faculty-att-date-input"
              value="${todayStr}"
              max="${todayStr}"
              class="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold text-slate-800 focus:outline-none focus:border-[#073B70]"
            />
          </div>

          <!-- Time Slot -->
          <div>
            <label class="block text-slate-700 font-bold mb-1">Lecture Time Slot</label>
            <select
              id="faculty-att-slot-select"
              class="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold text-slate-800 focus:outline-none focus:border-[#073B70]"
            >
              <option value="11:15 AM - 12:15 PM" selected>11:15 AM - 12:15 PM (Theory Slot)</option>
              <option value="01:00 PM - 03:00 PM">01:00 PM - 03:00 PM (Practical Lab Slot)</option>
              <option value="09:15 AM - 10:15 AM">09:15 AM - 10:15 AM (Morning Slot)</option>
              <option value="03:15 PM - 04:15 PM">03:15 PM - 04:15 PM (Evening Slot)</option>
            </select>
          </div>

          <!-- Topic Covered (Full Width) -->
          <div class="sm:col-span-2 lg:col-span-4">
            <label class="block text-slate-700 font-bold mb-1">Syllabus Topic Covered</label>
            <input
              type="text"
              id="faculty-att-topic-input"
              required
              placeholder="e.g. Module 4: Multi-Tenant Cloud Architecture, Hypervisor Virtualization & Container Isolation"
              value="Module 4: Virtual Machine Live Migration & Distributed Resource Schedulers"
              class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:border-[#073B70]"
            />
          </div>
        </form>
      </div>

      <!-- 3. Real-Time Headcount Counter -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div class="p-3.5 rounded-xl bg-white border border-slate-200 text-center">
          <span class="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Total Enrolled</span>
          <div id="roster-total-count" class="text-2xl font-extrabold text-slate-800 mt-1">${students.length}</div>
          <span class="text-[10px] text-slate-400 font-medium">Class Roster</span>
        </div>
        <div class="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
          <span class="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider block">Present</span>
          <div id="roster-present-count" class="text-2xl font-extrabold text-emerald-700 mt-1">${students.length}</div>
          <span class="text-[10px] text-emerald-600 font-medium">Attending Session</span>
        </div>
        <div class="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-center">
          <span class="text-[11px] font-semibold text-rose-800 uppercase tracking-wider block">Absent</span>
          <div id="roster-absent-count" class="text-2xl font-extrabold text-rose-700 mt-1">0</div>
          <span class="text-[10px] text-rose-600 font-medium">Absentees</span>
        </div>
        <div class="p-3.5 rounded-xl bg-[#F0F4FA] border border-[#DCE4EE] text-center">
          <span class="text-[11px] font-semibold text-[#073B70] uppercase tracking-wider block">Session Percentage</span>
          <div id="roster-pct-count" class="text-2xl font-extrabold text-[#073B70] mt-1">100%</div>
          <span class="text-[10px] text-teal-700 font-medium">Attendance Ratio</span>
        </div>
      </div>

      <!-- 4. Student Roster Table -->
      <div class="card-subtle p-5 md:p-6 bg-white space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100">
          <div class="flex items-center space-x-2">
            <i data-lucide="users" class="w-5 h-5 text-[#073B70]"></i>
            <h3 class="font-bold text-slate-800 text-base">Authorized Student Roster — ${activeClass.division}</h3>
          </div>
          <span class="text-xs text-slate-400 font-mono">${students.length} Authorized Students</span>
        </div>

        <div class="overflow-x-auto table-scroll-container">
          <table class="w-full text-left text-xs">
            <thead>
              <tr class="bg-slate-50 border-y border-slate-200 text-slate-500 uppercase font-semibold text-[11px]">
                <th class="py-3 px-4">Roll No</th>
                <th class="py-3 px-4">Student ID / PID</th>
                <th class="py-3 px-4">Candidate Full Name</th>
                <th class="py-3 px-4 text-center">Attendance Status</th>
                <th class="py-3 px-4">Remarks / Exception</th>
              </tr>
            </thead>
            <tbody id="attendance-roster-tbody" class="divide-y divide-slate-100">
              ${students
                .map(
                  (s, idx) => `
                <tr class="hover:bg-slate-50/80 transition" data-student-id="${s.studentId}">
                  <td class="py-3 px-4 font-mono font-bold text-slate-800">${s.rollNumber}</td>
                  <td class="py-3 px-4 font-mono font-bold text-[#073B70]">${s.studentId}</td>
                  <td class="py-3 px-4 font-semibold text-slate-800">${s.name}</td>
                  <td class="py-3 px-4 text-center">
                    <div class="inline-flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 gap-1">
                      <label class="cursor-pointer">
                        <input
                          type="radio"
                          name="att_status_${idx}"
                          value="PRESENT"
                          checked
                          onchange="window.appUpdateAttendanceCounters()"
                          class="sr-only peer"
                        />
                        <span class="px-2.5 py-1 rounded-lg text-xs font-bold text-slate-500 peer-checked:bg-emerald-600 peer-checked:text-white transition block">
                          P
                        </span>
                      </label>
                      <label class="cursor-pointer">
                        <input
                          type="radio"
                          name="att_status_${idx}"
                          value="ABSENT"
                          onchange="window.appUpdateAttendanceCounters()"
                          class="sr-only peer"
                        />
                        <span class="px-2.5 py-1 rounded-lg text-xs font-bold text-slate-500 peer-checked:bg-rose-600 peer-checked:text-white transition block">
                          A
                        </span>
                      </label>
                      <label class="cursor-pointer">
                        <input
                          type="radio"
                          name="att_status_${idx}"
                          value="LATE"
                          onchange="window.appUpdateAttendanceCounters()"
                          class="sr-only peer"
                        />
                        <span class="px-2.5 py-1 rounded-lg text-xs font-bold text-slate-500 peer-checked:bg-amber-600 peer-checked:text-white transition block">
                          L
                        </span>
                      </label>
                    </div>
                  </td>
                  <td class="py-3 px-4">
                    <input
                      type="text"
                      placeholder="Optional notes..."
                      class="att-remark-input w-full px-2.5 py-1 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-[#073B70]"
                    />
                  </td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
        </div>

        <!-- 5. Submit Action Card -->
        <div class="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div class="flex items-center gap-2 text-slate-500 text-xs">
            <i data-lucide="shield-check" class="w-4 h-4 text-emerald-600"></i>
            <span>Recorded attendance generates immutable server audit logs for AICTE & Mumbai University compliance.</span>
          </div>

          <div class="flex items-center gap-2">
            <button
              type="button"
              onclick="window.appNavigate('faculty-workspace')"
              class="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition"
            >
              Cancel
            </button>
            <button
              type="button"
              id="btn-save-attendance"
              onclick="window.appSaveFacultyAttendanceRegister()"
              class="px-5 py-2.5 rounded-xl bg-[#073B70] hover:bg-[#062B50] text-white font-bold text-xs shadow-md transition flex items-center gap-2"
            >
              <i data-lucide="save" class="w-4 h-4"></i>
              <span>Save & Commit Attendance Register</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}
