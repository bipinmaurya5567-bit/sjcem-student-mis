// SJCEM NEXT MIS Internal Marks & Semester Results Page
import { misStore } from '../services/store.js';

export function renderMarksResultsPage(activeTab = 'internal') {
  const internalMarks = misStore.getInternalMarks();
  const semesterResults = misStore.getSemesterResults();

  return `
    <div class="space-y-6 animate-fade-in pb-12">
      <!-- Tab Header -->
      <div class="card-subtle p-6 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <h2 class="text-xl md:text-2xl font-bold text-slate-800">Academic Marks & Semester Results</h2>
            <span class="text-xs px-2.5 py-0.5 rounded-full font-bold bg-teal-50 text-teal-800 border border-teal-200">
              University of Mumbai
            </span>
          </div>
          <p class="text-xs md:text-sm text-slate-500">
            Verified internal continuous assessment & university semester grade sheets.
          </p>
        </div>

        <!-- Tab Switcher -->
        <div class="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-semibold w-full md:w-auto">
          <button
            onclick="window.appSetMarksTab('internal')"
            class="text-center px-3 py-2 rounded-lg transition ${
              activeTab === 'internal' ? 'bg-white text-teal-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }"
          >
            Internal (IA)
          </button>
          <button
            onclick="window.appSetMarksTab('semester')"
            class="text-center px-3 py-2 rounded-lg transition ${
              activeTab === 'semester' ? 'bg-white text-teal-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }"
          >
            Semester Results
          </button>
        </div>
      </div>

      ${
        activeTab === 'internal'
          ? `
        <!-- Internal Assessment Scores Section -->
        <div class="card-subtle p-5 md:p-6 space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <div class="flex items-center space-x-2">
              <i data-lucide="file-spreadsheet" class="w-5 h-5 text-teal-800"></i>
              <h3 class="font-bold text-slate-800 text-base">Semester VI — Continuous Assessment Marks</h3>
            </div>
            <span class="text-xs text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
              Verified by Academic Committee
            </span>
          </div>

          <div class="overflow-x-auto table-scroll-container">
            <table class="w-full text-left text-xs">
              <thead>
                <tr class="bg-slate-50 border-y border-slate-200 text-slate-500 uppercase font-semibold text-[11px]">
                  <th class="py-3 px-4">Subject Code</th>
                  <th class="py-3 px-4">Course Title</th>
                  <th class="py-3 px-4 text-center">IA-1 (Out of 20)</th>
                  <th class="py-3 px-4 text-center">IA-2 (Out of 20)</th>
                  <th class="py-3 px-4 text-center">Average IA (20)</th>
                  <th class="py-3 px-4 text-center">Prelims (80)</th>
                  <th class="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                ${internalMarks
                  .map(
                    (m) => `
                  <tr class="hover:bg-slate-50/80 transition">
                    <td class="py-3 px-4 font-mono font-bold text-teal-800">${m.subjectCode}</td>
                    <td class="py-3 px-4 font-bold text-slate-800">${m.subjectName}</td>
                    <td class="py-3 px-4 text-center font-mono font-bold text-slate-800">${m.ia1.toFixed(1)}</td>
                    <td class="py-3 px-4 text-center font-mono font-bold text-slate-800">${m.ia2.toFixed(1)}</td>
                    <td class="py-3 px-4 text-center font-mono font-extrabold text-teal-800">${m.average.toFixed(2)}</td>
                    <td class="py-3 px-4 text-center font-mono font-bold text-slate-700">${m.prelims}</td>
                    <td class="py-3 px-4 text-center">
                      <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                        ${m.status}
                      </span>
                    </td>
                  </tr>
                `
                  )
                  .join('')}
              </tbody>
            </table>
          </div>
        </div>
      `
          : `
        <!-- Semester Results Section (Sem 1 to Sem 5) -->
        <div class="space-y-6">
          <!-- Overall CGPA Highlight Card -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div class="card-subtle p-5 bg-white text-center">
              <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Cumulative GPA (CGPA)</span>
              <div class="text-3xl font-extrabold text-teal-800 mt-1">8.58 / 10.0</div>
              <span class="text-[11px] font-medium text-emerald-600 block mt-1">First Class with Distinction</span>
            </div>
            <div class="card-subtle p-5 bg-white text-center">
              <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Total Earned Credits</span>
              <div class="text-3xl font-extrabold text-slate-800 mt-1">109 Credits</div>
              <span class="text-[11px] font-medium text-slate-500 block mt-1">Semesters I through V cleared</span>
            </div>
            <div class="card-subtle p-5 bg-white text-center">
              <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider block">University Seat No.</span>
              <div class="text-2xl font-mono font-bold text-slate-800 mt-2">SJCEM-2025-W-5084</div>
              <span class="text-[11px] font-medium text-slate-500 block mt-1">DTE Code: EN3218</span>
            </div>
          </div>

          <!-- List of Semesters -->
          <div class="space-y-4">
            ${semesterResults
              .map(
                (res) => `
              <div class="card-subtle p-5 md:p-6 bg-white space-y-4">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div>
                    <div class="flex items-center gap-2">
                      <h3 class="font-bold text-slate-800 text-base">${res.semesterName}</h3>
                      <span class="text-xs px-2 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        ${res.resultStatus}
                      </span>
                    </div>
                    <p class="text-xs text-slate-400 font-medium mt-0.5">
                      Seat No: ${res.examSeatNo} • Published: ${res.publishedDate} • Total Credits: ${res.totalCredits}
                    </p>
                  </div>

                  <div class="flex items-center gap-4">
                    <div class="text-left sm:text-right">
                      <span class="text-[10px] uppercase font-bold text-slate-400 block">Semester SGPA</span>
                      <span class="text-xl font-extrabold text-teal-800">${res.sgpa.toFixed(2)}</span>
                    </div>
                    <button
                      onclick="window.appPreviewGradeCard(${res.semesterNum})"
                      class="px-3.5 py-1.5 rounded-lg bg-teal-800 hover:bg-teal-900 text-white font-semibold text-xs shadow-sm transition flex items-center gap-1.5"
                    >
                      <i data-lucide="eye" class="w-3.5 h-3.5"></i>
                      <span>View Grade Card</span>
                    </button>
                  </div>
                </div>

                <!-- Courses Table -->
                <div class="overflow-x-auto table-scroll-container">
                  <table class="w-full text-left text-xs">
                    <thead>
                      <tr class="bg-slate-50 border-y border-slate-200 text-slate-500 uppercase font-semibold text-[10px]">
                        <th class="py-2.5 px-3">Course Code</th>
                        <th class="py-2.5 px-3">Subject Name</th>
                        <th class="py-2.5 px-3 text-center">Course Credits</th>
                        <th class="py-2.5 px-3 text-center">Letter Grade</th>
                        <th class="py-2.5 px-3 text-center">Grade Points</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                      ${res.courses
                        .map(
                          (c) => `
                        <tr class="hover:bg-slate-50/60">
                          <td class="py-2 px-3 font-mono font-bold text-teal-800">${c.code}</td>
                          <td class="py-2 px-3 font-medium text-slate-800">${c.name}</td>
                          <td class="py-2 px-3 text-center font-mono">${c.credits}</td>
                          <td class="py-2 px-3 text-center font-bold text-teal-800">${c.grade}</td>
                          <td class="py-2 px-3 text-center font-mono font-bold text-slate-800">${c.gradePoints}</td>
                        </tr>
                      `
                        )
                        .join('')}
                    </tbody>
                  </table>
                </div>
              </div>
            `
              )
              .join('')}
          </div>
        </div>
      `
      }

      <!-- Disclaimer notice -->
      <div class="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 leading-relaxed">
        <p class="font-bold text-slate-700 mb-1">Official University of Mumbai Verification Notice:</p>
        <p>
          These grade records are published for immediate academic information of the student. Final degree awarding requires original gazetted marksheets issued by the University of Mumbai Exam House, Kalina, Santacruz. Any discrepancies must be reported to the SJCEM Examination Cell within 15 days.
        </p>
      </div>
    </div>
  `;
}
