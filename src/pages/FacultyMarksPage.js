// SJCEM NEXT MIS — Authorized Faculty Internal Assessment Marks Entry Page
// Institution: St. John College of Engineering and Management, Palghar
// Managed by: ALDEL Education Trust

import { misStore } from '../services/store.js';

export function renderFacultyMarksPage(selectedSubjectCode = 'CSC601', selectedAssessment = 'IA1') {
  const user = misStore.getCurrentUser();
  if (!user || user.role !== 'faculty') {
    return `
      <div class="card-subtle p-8 text-center text-slate-500 space-y-3">
        <i data-lucide="shield-alert" class="w-10 h-10 text-rose-600 mx-auto"></i>
        <h3 class="text-base font-bold text-slate-800">Faculty Authorization Required</h3>
        <p class="text-xs text-slate-600">Internal Continuous Assessment scores can only be evaluated and entered by authorized teaching faculty.</p>
      </div>
    `;
  }

  const assignedClasses = misStore.getFacultyClasses();
  const activeClass = assignedClasses.find((c) => c.subjectCode === selectedSubjectCode) || assignedClasses[0];
  const students = misStore.getClassRoster('TE COMP Div A');
  const internalMarks = misStore.getInternalMarks();
  const subjectMark = internalMarks.find((m) => m.subjectCode === activeClass.subjectCode);
  const baselineScore = selectedAssessment === 'IA1' ? (subjectMark?.ia1 || 18.0) : (subjectMark?.ia2 || 17.5);

  return `
    <div class="space-y-6 animate-fade-in pb-12">
      <!-- 1. Page Header -->
      <div class="card-subtle p-6 bg-white border border-[#DCE4EE] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2 mb-1.5 flex-wrap">
            <span class="text-xs px-2.5 py-0.5 rounded-full font-bold bg-[#F0F4FA] text-[#073B70] border border-[#DCE4EE] flex items-center gap-1.5">
              <i data-lucide="file-spreadsheet" class="w-3.5 h-3.5 text-[#073B70]"></i>
              <span>INTERNAL CONTINUOUS ASSESSMENT (IA)</span>
            </span>
            <span class="text-xs text-slate-500">
              Department of ${user.department || 'Computer Engineering'}
            </span>
          </div>
          <h2 class="text-xl md:text-2xl font-bold text-slate-800 tracking-tight">Internal Assessment Marks Submission</h2>
          <p class="text-xs md:text-sm text-slate-500 mt-0.5">
            Submit, evaluate, and lock continuous internal assessment scores for Mumbai University credit compliance.
          </p>
        </div>

        <div class="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onclick="window.appPrefillSampleMarks()"
            class="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition flex items-center gap-1.5"
          >
            <i data-lucide="sparkles" class="w-3.5 h-3.5 text-teal-700"></i>
            <span>Load Grade Baseline</span>
          </button>
        </div>
      </div>

      <!-- 2. Assessment Parameters Configuration -->
      <div class="card-subtle p-5 md:p-6 bg-white space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100">
          <div class="flex items-center space-x-2">
            <i data-lucide="sliders" class="w-4 h-4 text-[#073B70]"></i>
            <h3 class="font-bold text-slate-800 text-sm md:text-base">Assessment Evaluation Scheme</h3>
          </div>
          <span class="text-[11px] font-mono font-medium text-slate-400">Max Marks: 20.00 | Passing: 8.00 (40%)</span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <!-- Course / Subject -->
          <div>
            <label class="block text-slate-700 font-bold mb-1">Teaching Course</label>
            <select
              id="faculty-marks-subject-select"
              onchange="window.appChangeMarksSubject(this.value)"
              class="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold text-slate-800 focus:outline-none focus:border-[#073B70]"
            >
              ${assignedClasses
                .map(
                  (c) => `
                <option value="${c.subjectCode}" ${c.subjectCode === activeClass.subjectCode ? 'selected' : ''}>
                  ${c.subjectCode} — ${c.subjectName}
                </option>
              `
                )
                .join('')}
            </select>
          </div>

          <!-- Assessment Type -->
          <div>
            <label class="block text-slate-700 font-bold mb-1">Assessment Component</label>
            <select
              id="faculty-marks-assessment-select"
              onchange="window.appChangeMarksComponent(this.value)"
              class="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold text-slate-800 focus:outline-none focus:border-[#073B70]"
            >
              <option value="IA1" ${selectedAssessment === 'IA1' ? 'selected' : ''}>Internal Assessment 1 (IA-1) — Max 20.0</option>
              <option value="IA2" ${selectedAssessment === 'IA2' ? 'selected' : ''}>Internal Assessment 2 (IA-2) — Max 20.0</option>
              <option value="PRELIMS" ${selectedAssessment === 'PRELIMS' ? 'selected' : ''}>End-Semester Prelims — Max 80.0</option>
            </select>
          </div>

          <!-- Division / Class -->
          <div>
            <label class="block text-slate-700 font-bold mb-1">Student Division</label>
            <select
              id="faculty-marks-division-select"
              class="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold text-slate-800 focus:outline-none focus:border-[#073B70]"
            >
              <option value="TE COMP Div A" selected>TE COMP Div A (Sem VI)</option>
              <option value="BE COMP Div B">BE COMP Div B (Sem VIII)</option>
            </select>
          </div>
        </div>
      </div>

      <!-- 3. Dynamic Marks Metrics Bar -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div class="p-3.5 rounded-xl bg-white border border-slate-200 text-center">
          <span class="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Total Candidates</span>
          <div id="marks-stat-candidates" class="text-2xl font-extrabold text-slate-800 mt-1">${students.length}</div>
          <span class="text-[10px] text-slate-400 font-medium">Enrolled Roster</span>
        </div>
        <div class="p-3.5 rounded-xl bg-teal-50 border border-teal-200 text-center">
          <span class="text-[11px] font-semibold text-teal-800 uppercase tracking-wider block">Class Average</span>
          <div id="marks-stat-average" class="text-2xl font-extrabold text-teal-800 mt-1">${baselineScore.toFixed(1)} / 20</div>
          <span class="text-[10px] text-teal-600 font-medium">Mean Score</span>
        </div>
        <div class="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
          <span class="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider block">Highest Score</span>
          <div id="marks-stat-highest" class="text-2xl font-extrabold text-emerald-700 mt-1">19.5 / 20</div>
          <span class="text-[10px] text-emerald-600 font-medium">Top Performer</span>
        </div>
        <div class="p-3.5 rounded-xl bg-[#F0F4FA] border border-[#DCE4EE] text-center">
          <span class="text-[11px] font-semibold text-[#073B70] uppercase tracking-wider block">Pass Rate</span>
          <div id="marks-stat-passrate" class="text-2xl font-extrabold text-[#073B70] mt-1">100%</div>
          <span class="text-[10px] text-teal-700 font-medium">&ge; 8.00 Marks Threshold</span>
        </div>
      </div>

      <!-- 4. Student Marks Roster -->
      <div class="card-subtle p-5 md:p-6 bg-white space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100">
          <div class="flex items-center space-x-2">
            <i data-lucide="graduation-cap" class="w-5 h-5 text-[#073B70]"></i>
            <h3 class="font-bold text-slate-800 text-base">Student Score Entries — Max Marks: 20.00</h3>
          </div>
          <span class="text-xs text-slate-400 font-mono">Numbers only (0.00 to 20.00)</span>
        </div>

        <div class="overflow-x-auto table-scroll-container">
          <table class="w-full text-left text-xs">
            <thead>
              <tr class="bg-slate-50 border-y border-slate-200 text-slate-500 uppercase font-semibold text-[11px]">
                <th class="py-3 px-4">Roll No</th>
                <th class="py-3 px-4">Student ID / PID</th>
                <th class="py-3 px-4">Candidate Full Name</th>
                <th class="py-3 px-4 text-center">Marks Obtained (out of 20)</th>
                <th class="py-3 px-4 text-center">Percentage</th>
                <th class="py-3 px-4 text-center">Compliance Status</th>
              </tr>
            </thead>
            <tbody id="marks-roster-tbody" class="divide-y divide-slate-100">
              ${students
                .map((s, idx) => {
                  // Varied realistic scores around the baseline
                  const scoreOffsets = [1.5, 0.0, -1.0, 1.0, -2.5, 0.5, 1.0];
                  const initialScore = Math.min(20, Math.max(0, baselineScore + (scoreOffsets[idx % scoreOffsets.length] || 0)));
                  const pct = Math.round((initialScore / 20) * 100);
                  const isPass = initialScore >= 8;

                  return `
                <tr class="hover:bg-slate-50/80 transition" data-student-id="${s.studentId}">
                  <td class="py-3 px-4 font-mono font-bold text-slate-800">${s.rollNumber}</td>
                  <td class="py-3 px-4 font-mono font-bold text-[#073B70]">${s.studentId}</td>
                  <td class="py-3 px-4 font-semibold text-slate-800">${s.name}</td>
                  <td class="py-3 px-4 text-center">
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="20"
                      value="${initialScore.toFixed(1)}"
                      oninput="window.appRecalculateMarksStats()"
                      class="marks-score-input w-24 text-center px-3 py-1.5 rounded-lg border border-slate-300 font-mono font-bold text-slate-800 focus:outline-none focus:border-[#073B70]"
                    />
                  </td>
                  <td class="py-3 px-4 text-center font-mono font-bold text-slate-700 marks-pct-cell">
                    ${pct}%
                  </td>
                  <td class="py-3 px-4 text-center marks-status-cell">
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${isPass ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}">
                      ${isPass ? 'PASSED' : 'RETEST REQUIRED'}
                    </span>
                  </td>
                </tr>
              `;
                })
                .join('')}
            </tbody>
          </table>
        </div>

        <!-- 5. Submit Action Card -->
        <div class="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div class="flex items-center gap-2 text-slate-500 text-xs">
            <i data-lucide="shield-check" class="w-4 h-4 text-emerald-600"></i>
            <span>Scores are validated against university grading schemes and signed digitally by faculty credentials.</span>
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
              id="btn-save-marks"
              onclick="window.appSaveFacultyMarksRegister()"
              class="px-5 py-2.5 rounded-xl bg-[#073B70] hover:bg-[#062B50] text-white font-bold text-xs shadow-md transition flex items-center gap-2"
            >
              <i data-lucide="save" class="w-4 h-4"></i>
              <span>Save & Submit Assessment Scores</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}
