// SJCEM NEXT MIS Academic Analytics Page with Real Interactive Charts
import { misStore } from '../services/store.js';

export function renderAnalyticsPage() {
  const overall = misStore.getOverallAttendance();

  return `
    <div class="space-y-6 animate-fade-in pb-12">
      <!-- Header -->
      <div class="card-subtle p-6 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <h2 class="text-xl md:text-2xl font-bold text-slate-800">Academic Analytics & Performance Insights</h2>
            <span class="text-xs px-2.5 py-0.5 rounded-full font-bold bg-teal-50 text-teal-800 border border-teal-200">
              Interactive Charts
            </span>
          </div>
          <p class="text-xs md:text-sm text-slate-500">
            Multi-semester trend analysis for B.E. Computer Engineering (2022–2026 Batch).
          </p>
        </div>

        <div class="flex items-center gap-2">
          <button
            onclick="window.appDownloadAnalyticsReport()"
            class="px-4 py-2 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-semibold text-xs shadow-sm transition flex items-center gap-1.5"
          >
            <i data-lucide="download" class="w-3.5 h-3.5"></i>
            <span>Export Analytics Summary</span>
          </button>
        </div>
      </div>

      <!-- Quick KPI Row -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="card-subtle p-4 bg-white text-center">
          <span class="text-xs text-slate-400 font-semibold block">Cumulative SGPA Trend</span>
          <div class="text-2xl font-bold text-teal-800 mt-1">8.72 / 10</div>
          <span class="text-[11px] text-emerald-600 font-medium">↗ +0.07 from Sem IV</span>
        </div>
        <div class="card-subtle p-4 bg-white text-center">
          <span class="text-xs text-slate-400 font-semibold block">Overall Attendance</span>
          <div class="text-2xl font-bold text-teal-800 mt-1">${overall.percentage}%</div>
          <span class="text-[11px] text-emerald-600 font-medium">Above 75% threshold</span>
        </div>
        <div class="card-subtle p-4 bg-white text-center">
          <span class="text-xs text-slate-400 font-semibold block">Best Performing Course</span>
          <div class="text-2xl font-bold text-slate-800 mt-1">DevOps (18.75)</div>
          <span class="text-[11px] text-slate-500 font-medium">IA Continuous Assessment</span>
        </div>
        <div class="card-subtle p-4 bg-white text-center">
          <span class="text-xs text-slate-400 font-semibold block">Total Degree Credits</span>
          <div class="text-2xl font-bold text-slate-800 mt-1">109 / 160</div>
          <span class="text-[11px] text-slate-500 font-medium">68.1% Completed</span>
        </div>
      </div>

      <!-- Chart Grid: 2 Columns -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- 1. Subject-wise Attendance Bar Chart -->
        <div class="card-subtle p-5 md:p-6 bg-white space-y-3">
          <div class="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h3 class="font-bold text-slate-800 text-sm md:text-base">Subject Attendance Percentage</h3>
              <p class="text-xs text-slate-400">Current Semester VI courses</p>
            </div>
            <span class="text-xs text-slate-400 font-mono">Norm: 75%</span>
          </div>
          <div class="relative h-64 w-full">
            <canvas id="attendanceBarChart"></canvas>
          </div>
        </div>

        <!-- 2. Semester SGPA Progression Line Chart -->
        <div class="card-subtle p-5 md:p-6 bg-white space-y-3">
          <div class="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h3 class="font-bold text-slate-800 text-sm md:text-base">SGPA Progression Across Semesters</h3>
              <p class="text-xs text-slate-400">Sem I to Sem V university examinations</p>
            </div>
            <span class="text-xs text-teal-800 font-bold bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
              CGPA: 8.58
            </span>
          </div>
          <div class="relative h-64 w-full">
            <canvas id="sgpaLineChart"></canvas>
          </div>
        </div>

        <!-- 3. Internal Assessment Comparison (IA1 vs IA2) -->
        <div class="card-subtle p-5 md:p-6 bg-white space-y-3">
          <div class="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h3 class="font-bold text-slate-800 text-sm md:text-base">Internal Assessment 1 vs IA-2 Comparison</h3>
              <p class="text-xs text-slate-400">Continuous assessment scores out of 20</p>
            </div>
          </div>
          <div class="relative h-64 w-full">
            <canvas id="iaComparisonChart"></canvas>
          </div>
        </div>

        <!-- 4. Monthly Attendance Trajectory -->
        <div class="card-subtle p-5 md:p-6 bg-white space-y-3">
          <div class="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h3 class="font-bold text-slate-800 text-sm md:text-base">Monthly Attendance Trajectory (2025–26)</h3>
              <p class="text-xs text-slate-400">July 2025 through October 2026</p>
            </div>
          </div>
          <div class="relative h-64 w-full">
            <canvas id="monthlyAttendanceChart"></canvas>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Function to initialize Chart.js after DOM rendering
export function initAnalyticsCharts() {
  if (typeof Chart === 'undefined') return;

  const attendance = misStore.getAttendance();
  const semesterResults = misStore.getSemesterResults();
  const internalMarks = misStore.getInternalMarks();

  // 1. Attendance Bar Chart
  const ctxAtt = document.getElementById('attendanceBarChart');
  if (ctxAtt) {
    new Chart(ctxAtt, {
      type: 'bar',
      data: {
        labels: attendance.map((a) => a.subjectCode),
        datasets: [
          {
            label: 'Attendance %',
            data: attendance.map((a) => a.percentage),
            backgroundColor: attendance.map((a) => (a.percentage >= 75 ? '#247F73' : '#D97706')),
            borderRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            min: 50,
            max: 100,
            ticks: { callback: (val) => val + '%' },
          },
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => `Attendance: ${ctx.parsed.y}%`,
            },
          },
        },
      },
    });
  }

  // 2. SGPA Line Chart
  const ctxSgpa = document.getElementById('sgpaLineChart');
  if (ctxSgpa) {
    const sorted = [...semesterResults].reverse();
    new Chart(ctxSgpa, {
      type: 'line',
      data: {
        labels: sorted.map((s) => `Sem ${s.semesterNum}`),
        datasets: [
          {
            label: 'SGPA',
            data: sorted.map((s) => s.sgpa),
            borderColor: '#247F73',
            backgroundColor: 'rgba(36, 127, 115, 0.12)',
            fill: true,
            tension: 0.3,
            pointRadius: 5,
            pointHoverRadius: 7,
            pointBackgroundColor: '#19685F',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            min: 7.0,
            max: 10.0,
            ticks: { callback: (val) => val.toFixed(1) },
          },
        },
        plugins: {
          legend: { display: false },
        },
      },
    });
  }

  // 3. IA Comparison Chart
  const ctxIa = document.getElementById('iaComparisonChart');
  if (ctxIa) {
    new Chart(ctxIa, {
      type: 'bar',
      data: {
        labels: internalMarks.map((m) => m.subjectCode),
        datasets: [
          {
            label: 'IA-1 (Out of 20)',
            data: internalMarks.map((m) => m.ia1),
            backgroundColor: '#4C9B89',
            borderRadius: 4,
          },
          {
            label: 'IA-2 (Out of 20)',
            data: internalMarks.map((m) => m.ia2),
            backgroundColor: '#247F73',
            borderRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            min: 0,
            max: 20,
          },
        },
      },
    });
  }

  // 4. Monthly Attendance Chart
  const ctxMonthly = document.getElementById('monthlyAttendanceChart');
  if (ctxMonthly) {
    new Chart(ctxMonthly, {
      type: 'line',
      data: {
        labels: ['July', 'August', 'September', 'October'],
        datasets: [
          {
            label: 'Monthly Attended %',
            data: [89.5, 86.2, 83.0, 84.2],
            borderColor: '#0284C7',
            backgroundColor: 'rgba(2, 132, 199, 0.1)',
            fill: true,
            tension: 0.35,
            pointRadius: 5,
            pointBackgroundColor: '#0369A1',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            min: 70,
            max: 100,
            ticks: { callback: (val) => val + '%' },
          },
        },
        plugins: {
          legend: { display: false },
        },
      },
    });
  }
}
