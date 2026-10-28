// SJCEM NEXT MIS Student Profile Page with Secure Digital ID System
import { misStore } from '../services/store.js';

export function renderProfilePage() {
  const user = misStore.getCurrentUser();
  const qrRecord = misStore.getUserQrRecord(user.id);

  const isTokenActive = qrRecord ? (!qrRecord.isRevoked && !qrRecord.isExpired && qrRecord.status !== 'REVOKED') : true;

  return `
    <div class="space-y-8 animate-fade-in pb-12">
      
      <!-- Top Overview Banner -->
      <div class="bg-white rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 border border-slate-200 shadow-sm">
        <div class="flex items-start md:items-center space-x-5">
          <div class="relative">
            <img
              src="${user.avatarUrl}"
              alt="${user.firstName}"
              class="w-20 h-20 md:w-24 md:h-24 rounded-2xl object-cover border-2 border-slate-200 shadow-sm"
              onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(user.firstName + ' ' + user.lastName)}&background=247F73&color=fff'"
            />
            <span class="absolute bottom-1 right-1 w-4 h-4 rounded-full ${isTokenActive ? 'bg-emerald-500' : 'bg-rose-500'} border-2 border-white" title="${isTokenActive ? 'Active Verification Status' : 'Identity Status Alert'}"></span>
          </div>
          <div>
            <div class="flex items-center gap-2 mb-1">
              <h2 class="text-xl md:text-2xl font-bold text-slate-800">${user.firstName} ${user.middleName || ''} ${user.lastName}</h2>
              <span class="text-xs px-2.5 py-0.5 rounded-full font-bold ${isTokenActive ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'} border">
                ${isTokenActive ? 'VERIFIED ACTIVE' : (qrRecord && qrRecord.status) ? qrRecord.status : 'ACTIVE'}
              </span>
            </div>
            <p class="text-xs md:text-sm text-slate-500 font-medium">
              ${
                user.role === 'faculty'
                  ? `${user.designation || 'Assistant Professor & Project Coordinator'} • Department of ${user.department || 'Computer Engineering'}`
                  : user.role === 'admin'
                  ? `${user.designation || 'Academic Dean & System Administrator'} • St. John College of Engineering and Management`
                  : user.program || 'Bachelor of Engineering in Computer Engineering'
              }
            </p>
            <div class="mt-2 flex flex-wrap gap-2 text-xs">
              ${
                user.role === 'faculty'
                  ? `
                <span class="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-mono font-medium">Faculty ID: ${user.facultyId || user.employeeId || user.institutional_id || 'Profile information unavailable'}</span>
                <span class="px-2.5 py-1 rounded-md bg-blue-50 text-blue-800 font-medium font-mono">${user.departmentCode || 'COMP'} Faculty</span>
                <span class="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 font-medium">Approved Cadre</span>
              `
                  : user.role === 'admin'
                  ? `
                <span class="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-mono font-medium">Admin ID: ${user.adminId || user.employeeId || user.institutional_id || 'Profile information unavailable'}</span>
                <span class="px-2.5 py-1 rounded-md bg-purple-50 text-purple-800 font-medium">Security Clearance: LEVEL 4</span>
                <span class="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-medium">Central Administration</span>
              `
                  : `
                <span class="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-mono font-medium">Student ID: ${user.studentId || user.pid || user.institutional_id || 'Profile information unavailable'}</span>
                <span class="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-mono font-medium">Roll: ${user.rollNumber || 'SJCEM2022CS084'}</span>
                <span class="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-mono font-medium">PRN: ${user.prn || '2022016400987654'}</span>
                <span class="px-2.5 py-1 rounded-md bg-teal-50 text-teal-800 font-medium">Sem VI (Div A)</span>
              `
              }
            </div>
          </div>
        </div>

        <!-- Quick actions -->
        <div class="flex flex-col sm:items-end justify-between space-y-3">
          <div class="text-left sm:text-right">
            <span class="text-xs text-slate-500 font-medium block">Institutional Record Sync</span>
            <div class="flex items-center gap-2 mt-1">
              <div class="w-32 bg-slate-200 rounded-full h-2">
                <div class="bg-teal-700 h-2 rounded-full" style="width: 100%;"></div>
              </div>
              <span class="text-xs font-bold text-teal-800">100% Synced</span>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button
              onclick="window.appPrintDigitalId()"
              class="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-black text-white font-semibold text-xs shadow-sm transition flex items-center gap-1.5"
              title="Print official identity card"
            >
              <i data-lucide="printer" class="w-3.5 h-3.5"></i>
              <span>Print ID Card</span>
            </button>
            <button
              onclick="window.appOpenEditContactModal()"
              class="px-3.5 py-2 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-semibold text-xs shadow-sm transition flex items-center gap-1.5"
            >
              <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
              <span>Edit Contact</span>
            </button>
          </div>
        </div>
      </div>

      <!-- ================= PART 4: SECURE DIGITAL ID CARD SECTION ================= -->
      <section class="bg-gradient-to-r from-[#073B70] via-[#0E447E] to-[#062B50] rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        
        <!-- Subtle Background Decors -->
        <div class="absolute -right-10 -bottom-10 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>
        <div class="absolute left-1/3 top-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div class="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 relative z-10">
          
          <!-- Section Information & Privacy Notice -->
          <div class="max-w-xl space-y-4">
            <div class="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-teal-700/60 border border-teal-500/40 text-teal-200 text-xs font-semibold">
              <i data-lucide="shield-check" class="w-3.5 h-3.5 text-emerald-400"></i>
              <span>Cryptographic Identity Token (Opaque Hash)</span>
            </div>

            <div>
              <h3 class="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                <span>My Digital ID</span>
                <span class="text-xs px-2.5 py-0.5 rounded-full font-bold ${isTokenActive ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30' : 'bg-rose-500/20 text-rose-300 border border-rose-400/30'}">
                  ${isTokenActive ? 'Active & Valid' : (qrRecord && qrRecord.status) ? qrRecord.status : 'Active'}
                </span>
              </h3>
              <p class="text-xs sm:text-sm text-teal-100/80 mt-1.5 leading-relaxed">
                Official digital campus identification for campus gate entry, lab verification, examination halls, and library circulation.
              </p>
            </div>

            <!-- Security & Privacy Guardrails info -->
            <div class="bg-black/25 backdrop-blur rounded-xl p-4 border border-white/10 text-xs text-teal-100/90 space-y-2">
              <div class="flex items-center space-x-2 text-emerald-300 font-bold">
                <i data-lucide="lock" class="w-4 h-4"></i>
                <span>Privacy-Preserving Security Architecture</span>
              </div>
              <p class="text-[11px] leading-relaxed text-teal-200/80">
                This QR code does <strong>NOT</strong> embed your private phone number, home address, marks, or passwords. It contains an unguessable cryptographic token that resolves only authorized verification data via SJCEM Row-Level Security.
              </p>
              <div class="pt-1 flex items-center justify-between text-[10px] font-mono text-teal-300/70 border-t border-white/10">
                <span>Token: ${qrRecord ? qrRecord.token.substring(0, 18) + '...' : 'sjcem_sec_live'}</span>
                <span>Created: ${qrRecord ? qrRecord.createdAt : 'Current Term'}</span>
              </div>
            </div>

            <!-- Action buttons -->
            <div class="flex flex-wrap items-center gap-3 pt-2">
              <button
                onclick="window.appDownloadQrPng('${user.rollNumber || user.facultyId || user.adminId || user.institutional_id || 'SJCEM-ID'}')"
                class="px-4 py-2.5 rounded-xl bg-white text-teal-900 hover:bg-teal-50 font-bold text-xs shadow-md transition flex items-center space-x-2"
                title="Download scannable QR code PNG"
              >
                <i data-lucide="download" class="w-4 h-4 text-teal-800"></i>
                <span>Download QR PNG</span>
              </button>

              <button
                onclick="window.appPrintDigitalId()"
                class="px-4 py-2.5 rounded-xl bg-teal-700/80 hover:bg-teal-700 text-white font-bold text-xs border border-teal-500/50 transition flex items-center space-x-2"
                title="Open print layout for ID card"
              >
                <i data-lucide="printer" class="w-4 h-4"></i>
                <span>Print ID Card</span>
              </button>

              <button
                onclick="window.appRefreshQrCard()"
                class="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 transition"
                title="Refresh Digital ID Card"
              >
                <i data-lucide="refresh-cw" class="w-4 h-4"></i>
              </button>
            </div>
          </div>

          <!-- The Physical Card Rendering (Also the source for Print & Visual View) -->
          <div class="flex-shrink-0 mx-auto">
            <!-- Digital ID Card Container (Preview in Dashboard) -->
            <div
              id="printable-id-card"
              class="w-full max-w-[340px] bg-white rounded-2xl shadow-2xl border-2 border-teal-500/40 text-slate-900 overflow-hidden relative"
            >
              <!-- Card Header -->
              <div class="bg-gradient-to-r from-[#073B70] to-[#062B50] text-white px-4 py-3 flex items-center justify-between">
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
                    <p class="text-[9px] text-teal-200 uppercase tracking-wider font-semibold">Aldel Education Trust • Palghar</p>
                  </div>
                </div>
                <span class="text-[9px] font-bold bg-white/20 px-1.5 py-0.5 rounded text-white font-mono uppercase">
                  ${user.role === 'faculty' ? 'FACULTY' : user.role === 'admin' ? 'ADMINISTRATOR' : 'STUDENT'}
                </span>
              </div>

              <!-- Card Body -->
              <div class="p-4 space-y-3.5 bg-gradient-to-b from-white to-slate-50">
                <!-- Photo & Info Row -->
                <div class="flex items-center space-x-3">
                  <img
                    src="${user.avatarUrl}"
                    alt="${user.firstName}"
                    class="w-16 h-20 rounded-lg object-cover border-2 border-teal-800 shadow-sm flex-shrink-0"
                    onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(user.firstName + ' ' + user.lastName)}&background=247F73&color=fff'"
                  />
                  <div class="space-y-0.5 overflow-hidden">
                    <p class="text-xs font-extrabold text-slate-900 truncate leading-tight">${user.firstName} ${user.middleName ? user.middleName[0] + '.' : ''} ${user.lastName}</p>
                    ${
                      user.role === 'faculty'
                        ? `
                      <p class="text-[10px] text-teal-800 font-bold truncate">${user.designation || 'Assistant Professor'}</p>
                      <p class="text-[10px] text-slate-500 font-mono">Faculty ID: <span class="font-bold text-slate-700">${user.facultyId || user.employeeId || user.institutional_id || 'Profile information unavailable'}</span></p>
                      <p class="text-[10px] text-slate-500 font-mono">Dept: <span class="font-bold text-slate-700">${user.departmentCode || user.department || 'COMP'}</span></p>
                      <div class="flex items-center space-x-1.5 pt-0.5">
                        <span class="text-[9px] font-bold bg-blue-50 text-blue-900 border border-blue-200 px-1.5 py-0.2 rounded">Teaching Cadre</span>
                        <span class="text-[9px] font-bold ${isTokenActive ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'} border px-1.5 py-0.2 rounded">
                          ${isTokenActive ? 'ACTIVE' : 'REVOKED'}
                        </span>
                      </div>
                    `
                        : user.role === 'admin'
                        ? `
                      <p class="text-[10px] text-teal-800 font-bold truncate">${user.designation || 'Academic Dean & System Administrator'}</p>
                      <p class="text-[10px] text-slate-500 font-mono">Admin ID: <span class="font-bold text-slate-700">${user.adminId || user.employeeId || user.institutional_id || 'Profile information unavailable'}</span></p>
                      <p class="text-[10px] text-purple-700 font-bold">Clearance: <span class="font-mono">LEVEL 4</span></p>
                      <div class="flex items-center space-x-1.5 pt-0.5">
                        <span class="text-[9px] font-bold bg-purple-50 text-purple-900 border border-purple-200 px-1.5 py-0.2 rounded">Administration</span>
                        <span class="text-[9px] font-bold ${isTokenActive ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'} border px-1.5 py-0.2 rounded">
                          ${isTokenActive ? 'ACTIVE' : 'REVOKED'}
                        </span>
                      </div>
                    `
                        : `
                      <p class="text-[10px] text-teal-800 font-bold truncate">${user.program || 'B.E. Computer Engineering'}</p>
                      <p class="text-[10px] text-slate-500 font-mono">Student ID: <span class="font-bold text-slate-700">${user.studentId || user.pid || user.institutional_id || 'Profile information unavailable'}</span></p>
                      <p class="text-[10px] text-slate-500 font-mono">PRN: <span class="font-bold text-slate-700">${user.prn || '2022016400987654'}</span></p>
                      <p class="text-[10px] text-slate-500 font-mono">Roll: <span class="font-bold text-slate-700">${user.rollNumber || 'SJCEM2022CS084'}</span></p>
                      <div class="flex items-center space-x-1.5 pt-0.5">
                        <span class="text-[9px] font-bold bg-teal-50 text-teal-900 border border-teal-200 px-1.5 py-0.2 rounded">Sem VI - Div A</span>
                        <span class="text-[9px] font-bold ${isTokenActive ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'} border px-1.5 py-0.2 rounded">
                          ${isTokenActive ? 'VALID' : 'REVOKED'}
                        </span>
                      </div>
                    `
                    }
                  </div>
                </div>

                <!-- QR Code & Cryptographic Verification Area -->
                <div class="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between gap-3">
                  <div class="space-y-1">
                    <div class="flex items-center space-x-1 text-teal-800">
                      <i data-lucide="shield-check" class="w-3.5 h-3.5"></i>
                      <span class="text-[10px] font-bold uppercase tracking-wider">
                        ${user.role === 'faculty' ? 'Faculty Digital Pass' : user.role === 'admin' ? 'Admin Access Token' : 'Authorized Digital ID'}
                      </span>
                    </div>
                    <p class="text-[9px] text-slate-500 leading-tight">
                      Scan via SJCEM MIS or campus readers to verify active ${user.role} authorization.
                    </p>
                    <p class="text-[8px] font-mono text-slate-400 break-all">
                      ${qrRecord ? qrRecord.token.substring(0, 16) + '...' : 'sjcem_sec_token'}
                    </p>
                  </div>

                  <!-- QR Canvas Container -->
                  <div class="flex-shrink-0 p-1.5 bg-white border border-slate-200 rounded-lg shadow-inner flex flex-col items-center">
                    <canvas id="${user.role === 'faculty' ? 'faculty-qr-canvas' : user.role === 'admin' ? 'admin-qr-canvas' : 'student-qr-canvas'}" width="90" height="90" class="block w-[90px] h-[90px]"></canvas>
                    <span class="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">${user.role === 'faculty' ? 'FACULTY ID' : user.role === 'admin' ? 'ADMIN ID' : 'SJCEM ID'}</span>
                  </div>
                </div>

                <!-- Security chip & strip -->
                <div class="pt-1 flex items-center justify-between text-[9px] text-slate-400 border-t border-slate-200">
                  <span class="font-mono">${user.role === 'student' ? 'VALID: 2022–2026' : 'ANNUAL VALIDITY: 2026–2027'}</span>
                  <span class="font-semibold text-teal-800">Palghar, Maharashtra</span>
                </div>
              </div>

              <!-- Card Bottom Footer Bar -->
              <div class="bg-slate-900 text-white px-4 py-1.5 flex items-center justify-between text-[9px]">
                <span class="tracking-widest uppercase font-mono text-slate-300">SJCEM DIGITAL IDENTITY</span>
                <span class="font-bold text-emerald-400 flex items-center gap-1">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  NAAC ACCREDITED
                </span>
              </div>
            </div>
          </div>

        </div>
      </section>

      <!-- ================= Academic and Personal Detail Grids ================= -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        <!-- 1. Academic Institutional Records (Read-Only) -->
        <div class="card-subtle p-5 md:p-6 space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <div class="flex items-center space-x-2">
              <i data-lucide="graduation-cap" class="w-5 h-5 text-teal-800"></i>
              <h3 class="font-bold text-slate-800 text-sm md:text-base">Institutional Academic Records</h3>
            </div>
            <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
              OFFICIAL READ-ONLY
            </span>
          </div>

          <div class="grid grid-cols-2 gap-4 text-xs">
            ${
              user.role === 'faculty'
                ? `
              <div>
                <span class="text-slate-400 font-medium block">Department</span>
                <span class="text-slate-800 font-bold mt-0.5 block">${user.department || 'Computer Engineering'}</span>
              </div>
              <div>
                <span class="text-slate-400 font-medium block">Designation</span>
                <span class="text-slate-800 font-bold mt-0.5 block">${user.designation || 'Assistant Professor & Project Coordinator'}</span>
              </div>
              <div>
                <span class="text-slate-400 font-medium block">Employee ID</span>
                <span class="text-slate-800 font-mono font-bold mt-0.5 block">${user.employeeId || 'SJCEM-FAC-2017-042'}</span>
              </div>
              <div>
                <span class="text-slate-400 font-medium block">Academic Department Code</span>
                <span class="text-slate-800 font-mono font-bold mt-0.5 block">${user.departmentCode || 'COMP'}</span>
              </div>
              <div>
                <span class="text-slate-400 font-medium block">Assigned Subject Specialization</span>
                <span class="text-slate-800 font-bold mt-0.5 block">Cloud Computing & Distributed Virtualization</span>
              </div>
              <div>
                <span class="text-slate-400 font-medium block">Office / Cabin</span>
                <span class="text-slate-800 font-bold mt-0.5 block">Room 304, Academic Block A</span>
              </div>
              <div class="col-span-2">
                <span class="text-slate-400 font-medium block">Institutional Faculty Email</span>
                <span class="text-slate-800 font-mono font-semibold mt-0.5 block">${user.email}</span>
              </div>
            `
                : user.role === 'admin'
                ? `
              <div>
                <span class="text-slate-400 font-medium block">Administrative Division</span>
                <span class="text-slate-800 font-bold mt-0.5 block">${user.department || 'Academic Administration'}</span>
              </div>
              <div>
                <span class="text-slate-400 font-medium block">Administrative Role</span>
                <span class="text-slate-800 font-bold mt-0.5 block">${user.designation || 'Academic Dean & MIS Administrator'}</span>
              </div>
              <div>
                <span class="text-slate-400 font-medium block">Administrative Employee ID</span>
                <span class="text-slate-800 font-mono font-bold mt-0.5 block">${user.employeeId || 'SJCEM-ADM-2012-005'}</span>
              </div>
              <div>
                <span class="text-slate-400 font-medium block">Security Clearance</span>
                <span class="text-purple-800 font-bold mt-0.5 block">LEVEL 4 — Full Institutional Systems Oversight</span>
              </div>
              <div>
                <span class="text-slate-400 font-medium block">Office Location</span>
                <span class="text-slate-800 font-bold mt-0.5 block">Dean's Suite, Ground Floor Central Wing</span>
              </div>
              <div>
                <span class="text-slate-400 font-medium block">Governance</span>
                <span class="text-slate-800 font-bold mt-0.5 block">ALDEL Education Trust / SJCEM Governing Body</span>
              </div>
              <div class="col-span-2">
                <span class="text-slate-400 font-medium block">Institutional Administrative Email</span>
                <span class="text-slate-800 font-mono font-semibold mt-0.5 block">${user.email}</span>
              </div>
            `
                : `
              <div>
                <span class="text-slate-400 font-medium block">Department</span>
                <span class="text-slate-800 font-bold mt-0.5 block">${user.department || 'Computer Engineering'}</span>
              </div>
              <div>
                <span class="text-slate-400 font-medium block">Degree Program</span>
                <span class="text-slate-800 font-bold mt-0.5 block">${user.program || 'B.E. Computer Engineering'}</span>
              </div>
              <div>
                <span class="text-slate-400 font-medium block">Permanent Reg. Number (PRN)</span>
                <span class="text-slate-800 font-mono font-bold mt-0.5 block">${user.prn || '2022016400987654'}</span>
              </div>
              <div>
                <span class="text-slate-400 font-medium block">Roll Number</span>
                <span class="text-slate-800 font-mono font-bold mt-0.5 block">${user.rollNumber || 'SJCEM2022CS084'}</span>
              </div>
              <div>
                <span class="text-slate-400 font-medium block">Current Semester</span>
                <span class="text-slate-800 font-bold mt-0.5 block">Semester VI (Sixth)</span>
              </div>
              <div>
                <span class="text-slate-400 font-medium block">Division & Batch</span>
                <span class="text-slate-800 font-bold mt-0.5 block">Division A (Batch A2)</span>
              </div>
              <div>
                <span class="text-slate-400 font-medium block">Admission Year</span>
                <span class="text-slate-800 font-bold mt-0.5 block">${user.admissionYear || 2022}</span>
              </div>
              <div>
                <span class="text-slate-400 font-medium block">Assigned Academic Advisor</span>
                <span class="text-teal-800 font-bold mt-0.5 block">${user.academicAdvisor || 'Prof. Anita Deshmukh'}</span>
              </div>
              <div class="col-span-2">
                <span class="text-slate-400 font-medium block">College Institute Email</span>
                <span class="text-slate-800 font-mono font-semibold mt-0.5 block">${user.email}</span>
              </div>
            `
            }
          </div>

          <div class="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-500 flex items-start gap-2">
            <i data-lucide="info" class="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5"></i>
            <span>
              Official institutional attributes are synced with the University of Mumbai Gazette and DTE Maharashtra. Corrections require formal application to the Registrar Office.
            </span>
          </div>
        </div>

        <!-- 2. Personal & Contact Details (Student-Managed) -->
        <div class="card-subtle p-5 md:p-6 space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <div class="flex items-center space-x-2">
              <i data-lucide="user-check" class="w-5 h-5 text-teal-800"></i>
              <h3 class="font-bold text-slate-800 text-sm md:text-base">Personal & Contact Information</h3>
            </div>
            <button
              onclick="window.appOpenEditContactModal()"
              class="text-xs text-teal-700 hover:text-teal-900 font-semibold flex items-center gap-1"
            >
              <span>Update</span>
              <i data-lucide="edit-2" class="w-3 h-3"></i>
            </button>
          </div>

          <div class="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span class="text-slate-400 font-medium block">Mobile Phone</span>
              <span class="text-slate-800 font-bold mt-0.5 block">${user.phone}</span>
            </div>
            <div>
              <span class="text-slate-400 font-medium block">Date of Birth</span>
              <span class="text-slate-800 font-bold mt-0.5 block">${user.dob}</span>
            </div>
            <div>
              <span class="text-slate-400 font-medium block">Blood Group</span>
              <span class="text-slate-800 font-bold mt-0.5 block">${user.bloodGroup}</span>
            </div>
            <div>
              <span class="text-slate-400 font-medium block">Emergency Contact</span>
              <span class="text-rose-700 font-bold mt-0.5 block">${user.emergencyContact || user.phone}</span>
            </div>
            <div class="col-span-2">
              <span class="text-slate-400 font-medium block">Residential Address</span>
              <span class="text-slate-800 font-medium mt-0.5 block leading-relaxed">${user.address}</span>
            </div>
          </div>

          ${
            user.role === 'student'
              ? `
          <!-- Guardian Section -->
          <div class="pt-4 border-t border-slate-100">
            <h4 class="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Guardian / Parent Details</h4>
            <div class="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span class="text-slate-400 font-medium block">Guardian Name</span>
                <span class="text-slate-800 font-bold mt-0.5 block">${user.guardianName || 'Suresh R. Sharma'}</span>
              </div>
              <div>
                <span class="text-slate-400 font-medium block">Relation</span>
                <span class="text-slate-800 font-bold mt-0.5 block">${user.guardianRelation || 'Father'}</span>
              </div>
              <div class="col-span-2">
                <span class="text-slate-400 font-medium block">Guardian Phone</span>
                <span class="text-slate-800 font-bold mt-0.5 block">${user.guardianPhone || '+91 98201 54300'}</span>
              </div>
            </div>
          </div>
          `
              : `
          <!-- Institutional Personnel Section -->
          <div class="pt-4 border-t border-slate-100">
            <h4 class="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Institutional Personnel Clearance</h4>
            <div class="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span class="text-slate-400 font-medium block">Cadre Status</span>
                <span class="text-slate-800 font-bold mt-0.5 block">Approved Institutional Personnel</span>
              </div>
              <div>
                <span class="text-slate-400 font-medium block">Campus Clearance</span>
                <span class="text-emerald-700 font-bold mt-0.5 block">${user.role === 'admin' ? 'Unrestricted (Level 4)' : 'Academic & Labs (Level 2)'}</span>
              </div>
              <div class="col-span-2">
                <span class="text-slate-400 font-medium block">Emergency Campus Extension</span>
                <span class="text-slate-800 font-mono font-bold mt-0.5 block">Ext. 2401 (Security & Registrar)</span>
              </div>
            </div>
          </div>
          `
          }
        </div>

      </div>
    </div>
  `;
}
