// SJCEM NEXT MIS Administrator Workspace
import { misStore } from '../services/store.js';

export function renderAdminWorkspace() {
  const certificates = misStore.getCertificates();
  const pendingCerts = certificates.filter((c) => c.status === 'UNDER_REVIEW' || c.status === 'SUBMITTED');
  const auditLogs = misStore.getAuditLogs();
  const notices = misStore.getNotices();

  return `
    <div class="space-y-6 animate-fade-in pb-12">
      <!-- Admin Header -->
      <div class="card-subtle p-6 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <span class="text-xs px-2.5 py-0.5 rounded-full font-bold bg-purple-500/20 text-purple-200 border border-purple-400/30">
              SYSTEM ADMINISTRATOR
            </span>
            <span class="text-xs text-slate-400">Security Clearance: LEVEL 4</span>
          </div>
          <h2 class="text-2xl font-bold tracking-tight">Dr. Vikram K. Patil</h2>
          <p class="text-xs md:text-sm text-slate-300 font-medium">
            Academic Dean & MIS System Administrator • St. John College of Engineering and Management
          </p>
        </div>

        <div class="flex items-center gap-2 flex-wrap">
          <button
            onclick="window.appViewDatabaseSchema()"
            class="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs shadow-sm transition flex items-center gap-1.5"
          >
            <i data-lucide="database" class="w-3.5 h-3.5"></i>
            <span>Inspect PostgreSQL Schema & RLS</span>
          </button>
        </div>
      </div>

      <!-- Institutional Metrics KPI Row -->
      <div class="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <div class="card-subtle p-4 bg-white text-center">
          <span class="text-xs text-slate-400 font-semibold block">Enrolled Students</span>
          <div class="text-2xl font-bold text-slate-800 mt-1">1,240</div>
          <span class="text-[11px] text-teal-800 font-medium">Across 6 Engineering Branches</span>
        </div>
        <div class="card-subtle p-4 bg-white text-center">
          <span class="text-xs text-slate-400 font-semibold block">Active Faculty</span>
          <div class="text-2xl font-bold text-slate-800 mt-1">86</div>
          <span class="text-[11px] text-slate-500 font-medium">AICTE Norm Compliant</span>
        </div>
        <div class="card-subtle p-4 bg-white text-center">
          <span class="text-xs text-slate-400 font-semibold block">Pending Certificates</span>
          <div class="text-2xl font-bold text-amber-600 mt-1">${pendingCerts.length}</div>
          <span class="text-[11px] text-amber-600 font-medium">Action Required</span>
        </div>
        <div class="card-subtle p-4 bg-white text-center">
          <span class="text-xs text-slate-400 font-semibold block">Academic Departments</span>
          <div class="text-2xl font-bold text-slate-800 mt-1">6</div>
          <span class="text-[11px] text-slate-500 font-medium">COMP, IT, AIDS, EXTC, MECH, CIVIL</span>
        </div>
        <div class="card-subtle p-4 bg-white text-center">
          <span class="text-xs text-slate-400 font-semibold block">System Uptime</span>
          <div class="text-2xl font-bold text-emerald-600 mt-1">99.98%</div>
          <span class="text-[11px] text-emerald-600 font-medium">Zero Data Breaches</span>
        </div>
      </div>

      <!-- Two Modules: Certificate Approval Queue vs System Audit Trails -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- 1. Certificate Approvals Queue -->
        <div class="card-subtle p-5 md:p-6 bg-white space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <div class="flex items-center space-x-2">
              <i data-lucide="file-badge-2" class="w-5 h-5 text-purple-700"></i>
              <h3 class="font-bold text-slate-800 text-base">Student Certificate Approval Queue</h3>
            </div>
            <span class="text-xs px-2 py-0.5 rounded-full font-bold bg-amber-50 text-amber-800 border border-amber-200">
              ${pendingCerts.length} Pending
            </span>
          </div>

          <div class="space-y-3">
            ${
              pendingCerts.length === 0
                ? '<div class="p-8 text-center text-slate-400 text-xs">All pending certificates have been reviewed.</div>'
                : pendingCerts
                    .map(
                      (c) => `
              <div class="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2 text-xs">
                <div class="flex items-center justify-between">
                  <span class="font-mono font-bold text-purple-800">${c.referenceNumber}</span>
                  <span class="px-2 py-0.5 rounded font-bold text-[10px] bg-amber-100 text-amber-800 border border-amber-200">
                    ${c.status}
                  </span>
                </div>
                <h4 class="font-bold text-slate-800">${c.certificateType}</h4>
                <p class="text-slate-600"><strong>Purpose:</strong> ${c.purpose}</p>
                <div class="pt-2 flex items-center gap-2">
                  <button
                    onclick="window.appAdminApproveCert('${c.id}')"
                    class="px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs shadow-sm transition flex items-center gap-1"
                  >
                    <i data-lucide="check" class="w-3.5 h-3.5"></i>
                    <span>Approve & Issue</span>
                  </button>
                  <button
                    onclick="window.appAdminRejectCert('${c.id}')"
                    class="px-3.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold text-xs transition"
                  >
                    Reject with Reason
                  </button>
                </div>
              </div>
            `
                    )
                    .join('')
            }
          </div>
        </div>

        <!-- 2. System Audit Trails -->
        <div class="card-subtle p-5 md:p-6 bg-white space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <div class="flex items-center space-x-2">
              <i data-lucide="shield-check" class="w-5 h-5 text-teal-800"></i>
              <h3 class="font-bold text-slate-800 text-base">Security & Administrative Audit Log</h3>
            </div>
            <span class="text-xs text-slate-400 font-mono">Immutable Log</span>
          </div>

          <div class="space-y-2 max-h-80 overflow-y-auto">
            ${auditLogs
              .map(
                (log) => `
              <div class="p-2.5 rounded-lg border border-slate-100 bg-slate-50/50 text-xs space-y-1">
                <div class="flex items-center justify-between text-[10px] text-slate-400">
                  <span class="font-mono text-slate-500 font-semibold">${log.timestamp}</span>
                  <span class="font-mono text-teal-800">${log.ipAddress}</span>
                </div>
                <div class="flex items-center gap-1.5 font-bold text-slate-800 text-[11px]">
                  <span class="text-teal-800 font-mono">${log.action}</span>
                  <span>•</span>
                  <span>${log.actorName} (${log.actorRole})</span>
                </div>
                <p class="text-[11px] text-slate-600">${log.details}</p>
              </div>
            `
              )
              .join('')}
          </div>
        </div>
      </div>
    </div>
  `;
}
