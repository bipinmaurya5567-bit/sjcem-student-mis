// SJCEM NEXT MIS Faculty Workspace with Secure Digital Faculty Identity
import { misStore } from '../services/store.js';

export function renderFacultyWorkspace() {
  const user = misStore.getCurrentUser();
  const timetable = misStore.getTimetable();
  const project = misStore.getProject();
  const qrRecord = misStore.getUserQrRecord(user.id);
  const isTokenActive = qrRecord && qrRecord.status === 'ACTIVE';

  return `
    <div class="space-y-6 animate-fade-in pb-12">
      
      <!-- Welcome Header -->
      <div class="card-subtle p-6 bg-gradient-to-r from-teal-900 to-[#19685F] text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <span class="text-xs px-2.5 py-0.5 rounded-full font-bold bg-white/20 text-white border border-white/20">
              FACULTY CONSOLE
            </span>
            <span class="text-xs text-teal-200">ID: ${user.facultyId || 'SJCEM-FAC-2017-042'}</span>
          </div>
          <h2 class="text-2xl font-bold tracking-tight">${user.firstName} ${user.lastName}</h2>
          <p class="text-xs md:text-sm text-teal-100 font-medium">
            ${user.designation || 'Assistant Professor'} • Department of ${user.department || 'Computer Engineering'}
          </p>
        </div>

        <div class="flex items-center gap-2 flex-wrap">
          <button
            onclick="window.appOpenFacultyAttendanceModal()"
            class="px-4 py-2 rounded-xl bg-white text-teal-900 font-semibold text-xs shadow-sm hover:bg-teal-50 transition flex items-center gap-1.5"
          >
            <i data-lucide="calendar-check" class="w-4 h-4 text-teal-800"></i>
            <span>Record Lecture Attendance</span>
          </button>
          <button
            onclick="window.appOpenFacultyMarksModal()"
            class="px-4 py-2 rounded-xl bg-teal-800/80 hover:bg-teal-800 text-white font-semibold text-xs border border-white/20 transition flex items-center gap-1.5"
          >
            <i data-lucide="file-spreadsheet" class="w-4 h-4"></i>
            <span>Enter IA Marks</span>
          </button>
        </div>
      </div>

      <!-- ================= PART 4: FACULTY SECURE DIGITAL ID CARD SECTION ================= -->
      <section class="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 rounded-2xl p-6 sm:p-7 text-white shadow-xl relative overflow-hidden">
        <div class="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 relative z-10">
          
          <div class="max-w-xl space-y-3.5">
            <div class="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-900/60 border border-emerald-500/40 text-emerald-200 text-xs font-semibold">
              <i data-lucide="shield-check" class="w-3.5 h-3.5 text-emerald-400"></i>
              <span>Faculty Academic Identity Pass</span>
            </div>

            <div>
              <h3 class="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                <span>My Faculty ID</span>
                <span class="text-xs px-2.5 py-0.5 rounded-full font-bold ${isTokenActive ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30' : 'bg-rose-500/20 text-rose-300 border border-rose-400/30'}">
                  ${isTokenActive ? 'Verified Staff' : qrRecord ? qrRecord.status : 'Active'}
                </span>
              </h3>
              <p class="text-xs text-slate-300 leading-relaxed">
                Cryptographic institutional identity card for campus access, staff attendance registers, examination supervision, and department authentication.
              </p>
            </div>

            <div class="flex flex-wrap items-center gap-3 pt-2">
              <button
                onclick="window.appDownloadQrPng('${user.facultyId || 'SJCEM-FAC-042'}')"
                class="px-4 py-2 rounded-xl bg-white text-slate-900 hover:bg-slate-100 font-bold text-xs shadow-md transition flex items-center space-x-2"
              >
                <i data-lucide="download" class="w-4 h-4 text-teal-800"></i>
                <span>Download QR PNG</span>
              </button>

              <button
                onclick="window.appPrintDigitalId()"
                class="px-4 py-2 rounded-xl bg-teal-800 hover:bg-teal-700 text-white font-bold text-xs border border-teal-600 transition flex items-center space-x-2"
              >
                <i data-lucide="printer" class="w-4 h-4"></i>
                <span>Print Faculty ID</span>
              </button>

              <button
                onclick="window.appRefreshQrCard()"
                class="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 transition"
                title="Refresh ID Card"
              >
                <i data-lucide="refresh-cw" class="w-4 h-4"></i>
              </button>

              <button
                onclick="window.appReportCompromisedQr('${user.id}')"
                class="px-3 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-400/30 text-xs font-semibold transition flex items-center space-x-1.5"
              >
                <i data-lucide="alert-triangle" class="w-3.5 h-3.5 text-rose-400"></i>
                <span>Report Compromised / Re-issue</span>
              </button>
            </div>
          </div>

          <!-- Physical Faculty ID Card Element -->
          <div class="flex-shrink-0 mx-auto">
            <div
              id="printable-id-card"
              class="w-[320px] sm:w-[340px] bg-white rounded-2xl shadow-2xl border-2 border-emerald-500/40 text-slate-900 overflow-hidden relative"
            >
              <!-- Card Header -->
              <div class="bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 text-white px-4 py-3 flex items-center justify-between">
                <div class="flex items-center space-x-2.5">
                  <div class="h-9 w-9 bg-white rounded-lg p-1 shadow-sm flex items-center justify-center flex-shrink-0">
                    <img
                      src="public/assets/aldel-logo.png"
                      alt="ALDEL Education Trust"
                      class="h-full w-full object-contain"
                    />
                  </div>
                  <div>
                    <h4 class="text-[11px] font-extrabold uppercase tracking-tight text-white leading-tight">St. John College of Engg. &amp; Mgmt.</h4>
                    <p class="text-[9px] text-emerald-300 uppercase tracking-wider font-semibold">Aldel Education Trust • Palghar</p>
                  </div>
                </div>
                <span class="text-[9px] font-bold bg-emerald-500/30 border border-emerald-400/40 px-1.5 py-0.5 rounded text-white font-mono">FACULTY</span>
              </div>

              <!-- Card Body -->
              <div class="p-4 space-y-3 bg-gradient-to-b from-white to-slate-50">
                <div class="flex items-center space-x-3">
                  <img
                    src="${user.avatarUrl}"
                    alt="${user.firstName}"
                    class="w-16 h-20 rounded-lg object-cover border-2 border-emerald-900 shadow-sm flex-shrink-0"
                    onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(user.firstName + ' ' + user.lastName)}&background=0F5132&color=fff'"
                  />
                  <div class="space-y-0.5 overflow-hidden">
                    <p class="text-xs font-extrabold text-slate-900 truncate leading-tight">${user.firstName} ${user.lastName}</p>
                    <p class="text-[10px] text-emerald-800 font-bold truncate">${user.designation || 'Assistant Professor'}</p>
                    <p class="text-[10px] text-slate-600 truncate">Dept. of ${user.department || 'Computer Engineering'}</p>
                    <p class="text-[10px] text-slate-500 font-mono">ID: <span class="font-bold text-slate-800">${user.facultyId || 'SJCEM-FAC-2017-042'}</span></p>
                    <p class="text-[9px] text-slate-500 font-mono truncate">${user.email}</p>
                  </div>
                </div>

                <!-- QR Area -->
                <div class="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between gap-3">
                  <div class="space-y-1">
                    <div class="flex items-center space-x-1 text-emerald-900">
                      <i data-lucide="shield-check" class="w-3.5 h-3.5"></i>
                      <span class="text-[10px] font-bold uppercase tracking-wider">Verified Faculty Pass</span>
                    </div>
                    <p class="text-[9px] text-slate-500 leading-tight">
                      Institutional credential for class conduction, invigilation, and department duties.
                    </p>
                    <p class="text-[8px] font-mono text-slate-400 break-all">
                      ${qrRecord ? qrRecord.token.substring(0, 16) + '...' : 'sjcem_sec_fac'}
                    </p>
                  </div>

                  <div class="flex-shrink-0 p-1.5 bg-white border border-slate-200 rounded-lg shadow-inner flex flex-col items-center">
                    <canvas id="faculty-qr-canvas" width="90" height="90" class="block w-[90px] h-[90px]"></canvas>
                    <span class="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">SJCEM STAFF</span>
                  </div>
                </div>

                <div class="pt-1 flex items-center justify-between text-[9px] text-slate-400 border-t border-slate-200">
                  <span class="font-mono">VALID: PERMANENT STAFF</span>
                  <span class="font-semibold text-emerald-800">Palghar, Maharashtra</span>
                </div>
              </div>

              <!-- Card Footer -->
              <div class="bg-slate-900 text-white px-4 py-1.5 flex items-center justify-between text-[9px]">
                <span class="tracking-widest uppercase font-mono text-slate-300">SJCEM FACULTY IDENTITY</span>
                <span class="font-bold text-emerald-400 flex items-center gap-1">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  NAAC ACCREDITED
                </span>
              </div>
            </div>
          </div>

        </div>
      </section>

      <!-- Quick Faculty KPI Tiles -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="card-subtle p-4 bg-white text-center">
          <span class="text-xs text-slate-400 font-semibold block">Assigned Batches</span>
          <div class="text-2xl font-bold text-slate-800 mt-1">3 Classes</div>
          <span class="text-[11px] text-teal-800 font-medium">TE Div A, BE Div B</span>
        </div>
        <div class="card-subtle p-4 bg-white text-center">
          <span class="text-xs text-slate-400 font-semibold block">Today's Lectures</span>
          <div class="text-2xl font-bold text-slate-800 mt-1">2 Sessions</div>
          <span class="text-[11px] text-slate-500 font-medium">Cloud Computing & Lab</span>
        </div>
        <div class="card-subtle p-4 bg-white text-center">
          <span class="text-xs text-slate-400 font-semibold block">Pending Project Reviews</span>
          <div class="text-2xl font-bold text-amber-600 mt-1">1 Group</div>
          <span class="text-[11px] text-amber-600 font-medium">Capstone Phase I</span>
        </div>
        <div class="card-subtle p-4 bg-white text-center">
          <span class="text-xs text-slate-400 font-semibold block">IA Marks Status</span>
          <div class="text-2xl font-bold text-emerald-600 mt-1">Verified</div>
          <span class="text-[11px] text-emerald-600 font-medium">IA-1 Submitted</span>
        </div>
      </div>

      <!-- Work modules: Attendance Recording & Project Reviews -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- 1. Attendance Workflow Module -->
        <div class="card-subtle p-5 md:p-6 bg-white space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <div class="flex items-center space-x-2">
              <i data-lucide="calendar-check" class="w-5 h-5 text-teal-800"></i>
              <h3 class="font-bold text-slate-800 text-base">Classroom Attendance Workflow</h3>
            </div>
            <button
              onclick="window.appOpenFacultyAttendanceModal()"
              class="text-xs text-teal-700 hover:text-teal-900 font-semibold flex items-center gap-1"
            >
              <span>Launch Entry Form</span>
              <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
            </button>
          </div>

          <p class="text-xs text-slate-500 leading-relaxed">
            Record attendance for conducted theory lectures or laboratory practical batches. Generates automated tamper-proof server audit logs and updates student threshold indicators in real-time.
          </p>

          <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
            <div class="flex items-center justify-between font-bold text-slate-800">
              <span>Next Immediate Class:</span>
              <span class="text-teal-800">01:00 PM – 03:00 PM</span>
            </div>
            <p class="text-slate-600">
              <strong>Course:</strong> Cloud Computing Laboratory (CSL601) • <strong>Batch:</strong> TE COMP A2 • <strong>Room:</strong> CC Lab 402
            </p>
            <div class="pt-2 flex items-center gap-2">
              <button
                onclick="window.appOpenFacultyAttendanceModal('CSL601')"
                class="px-3.5 py-1.5 rounded-lg bg-teal-800 hover:bg-teal-900 text-white font-semibold text-xs shadow-sm transition"
              >
                Mark Batch A2 Attendance
              </button>
            </div>
          </div>
        </div>

        <!-- 2. Capstone Mentoring & Project Review Module -->
        <div class="card-subtle p-5 md:p-6 bg-white space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <div class="flex items-center space-x-2">
              <i data-lucide="folder-git-2" class="w-5 h-5 text-teal-800"></i>
              <h3 class="font-bold text-slate-800 text-base">Assigned Project Mentorship</h3>
            </div>
            <span class="text-xs text-slate-400 font-mono">Group 14</span>
          </div>

          <div class="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2 text-xs">
            <div class="flex items-center justify-between">
              <span class="font-bold text-slate-800">${project.title}</span>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                Deliverable Review Pending
              </span>
            </div>
            <p class="text-slate-500 text-[11px]">
              Team: Rahul Sharma, Priya Nair, Amit Patil • Category: ${project.category}
            </p>
            <div class="pt-2 flex items-center gap-2">
              <button
                onclick="window.appOpenFacultyReviewProjectModal('${project.submissions[0]?.id || ''}')"
                class="px-3.5 py-1.5 rounded-lg bg-blue-800 hover:bg-blue-900 text-white font-semibold text-xs shadow-sm transition flex items-center gap-1.5"
              >
                <i data-lucide="check" class="w-3.5 h-3.5"></i>
                <span>Review & Approve Milestone</span>
              </button>
            </div>
          </div>

          <!-- Quick Action Buttons: Notice & Resource -->
          <div class="grid grid-cols-2 gap-3 pt-2">
            <button
              onclick="window.appOpenCreateNoticeModal()"
              class="p-3 rounded-xl border border-slate-200 hover:border-teal-400 hover:bg-teal-50/50 text-left transition flex items-center gap-2.5 text-xs text-slate-700 font-bold"
            >
              <i data-lucide="bell-plus" class="w-4 h-4 text-teal-800"></i>
              <span>Publish Circular</span>
            </button>
            <button
              onclick="window.appOpenUploadResourceModal()"
              class="p-3 rounded-xl border border-slate-200 hover:border-teal-400 hover:bg-teal-50/50 text-left transition flex items-center gap-2.5 text-xs text-slate-700 font-bold"
            >
              <i data-lucide="upload-cloud" class="w-4 h-4 text-teal-800"></i>
              <span>Upload Notes</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}
