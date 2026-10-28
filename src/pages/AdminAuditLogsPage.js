// SJCEM NEXT MIS — Authorized Administrator System Audit Logs & Security History
// Institution: St. John College of Engineering and Management, Palghar
// Managed by: ALDEL Education Trust

import { misStore } from '../services/store.js';

export function renderAdminAuditLogsPage(filterCategory = 'ALL', searchQuery = '') {
  const user = misStore.getCurrentUser();
  if (!user || user.role !== 'admin') {
    return `
      <div class="card-subtle p-8 text-center text-slate-500 space-y-3">
        <i data-lucide="shield-alert" class="w-10 h-10 text-rose-600 mx-auto"></i>
        <h3 class="text-base font-bold text-slate-800">Administrator Access Required</h3>
        <p class="text-xs text-slate-600">The institutional security audit log is restricted to authorized administrative personnel.</p>
      </div>
    `;
  }

  const rawLogs = misStore.getAuditLogs();
  const lookupLogs = misStore.getStudentLookupAuditLogs ? misStore.getStudentLookupAuditLogs() : [];

  // Unified list of immutable audit records
  const allLogs = [
    ...rawLogs.map((l) => ({
      ...l,
      category: l.action?.includes('AUTH') ? 'AUTH' : l.action?.includes('CERT') ? 'CERTIFICATE' : l.action?.includes('MARKS') || l.action?.includes('ATTENDANCE') ? 'ACADEMIC' : 'SYSTEM',
    })),
    ...lookupLogs.map((l) => ({
      id: l.id || `audit-${l.timestamp}`,
      action: l.action || 'STUDENT_LOOKUP',
      entityName: 'student_enrollments',
      details: `PID query: ${l.targetStudentPid || 'N/A'}. Result: ${l.outcome}. Department scope: ${l.targetDepartment || 'CAMPUS'}`,
      timestamp: l.timestamp,
      ipAddress: l.ipAddress || '127.0.0.1',
      actorName: l.actorName || 'Authorized User',
      actorRole: l.actorRole || 'faculty',
      category: 'RETRIEVAL',
    })),
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  let filtered = allLogs;
  if (filterCategory !== 'ALL') {
    filtered = filtered.filter((l) => l.category === filterCategory);
  }

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(
      (l) =>
        (l.action && l.action.toLowerCase().includes(q)) ||
        (l.details && l.details.toLowerCase().includes(q)) ||
        (l.actorName && l.actorName.toLowerCase().includes(q)) ||
        (l.ipAddress && l.ipAddress.toLowerCase().includes(q))
    );
  }

  return `
    <div class="space-y-6 animate-fade-in pb-12">
      <!-- 1. Page Header -->
      <div class="card-subtle p-6 bg-white border border-[#DCE4EE] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2 mb-1.5 flex-wrap">
            <span class="text-xs px-2.5 py-0.5 rounded-full font-bold bg-[#F0F4FA] text-[#073B70] border border-[#DCE4EE] flex items-center gap-1.5">
              <i data-lucide="shield-check" class="w-3.5 h-3.5 text-[#073B70]"></i>
              <span>IMMUTABLE AUDIT TRAIL</span>
            </span>
            <span class="text-xs text-slate-500">Security Clearance: LEVEL 4 (Read-Only)</span>
          </div>
          <h2 class="text-xl md:text-2xl font-bold text-slate-800 tracking-tight">System Audit Logs & Security History</h2>
          <p class="text-xs md:text-sm text-slate-500 mt-0.5">
            Tamper-evident record of all authentication attempts, grade modifications, attendance sessions, student lookups, and certificate decisions.
          </p>
        </div>

        <div class="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onclick="window.appDownloadAuditLogCsv()"
            class="px-4 py-2 rounded-xl bg-[#073B70] hover:bg-[#062B50] text-white font-semibold text-xs shadow-sm transition flex items-center gap-1.5"
          >
            <i data-lucide="download" class="w-3.5 h-3.5"></i>
            <span>Export Audit Trail (CSV)</span>
          </button>
        </div>
      </div>

      <!-- 2. Audit Filter & Category Pills -->
      <div class="card-subtle p-4 bg-white flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        <div class="relative w-full md:w-96">
          <i data-lucide="search" class="w-4 h-4 text-slate-400 absolute left-3 top-2.5"></i>
          <input
            type="text"
            id="audit-search-input"
            value="${searchQuery}"
            placeholder="Search by action, actor, IP address, or details..."
            oninput="window.appSearchAuditLogs(this.value)"
            class="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-[#073B70]"
          />
        </div>

        <div class="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <button
            type="button"
            onclick="window.appFilterAuditCategory('ALL')"
            class="px-3 py-1.5 rounded-lg font-semibold transition ${
              filterCategory === 'ALL'
                ? 'bg-[#073B70] text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }"
          >
            All (${allLogs.length})
          </button>
          <button
            type="button"
            onclick="window.appFilterAuditCategory('ACADEMIC')"
            class="px-3 py-1.5 rounded-lg font-semibold transition ${
              filterCategory === 'ACADEMIC'
                ? 'bg-teal-800 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }"
          >
            Academic
          </button>
          <button
            type="button"
            onclick="window.appFilterAuditCategory('CERTIFICATE')"
            class="px-3 py-1.5 rounded-lg font-semibold transition ${
              filterCategory === 'CERTIFICATE'
                ? 'bg-purple-800 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }"
          >
            Certificates
          </button>
          <button
            type="button"
            onclick="window.appFilterAuditCategory('RETRIEVAL')"
            class="px-3 py-1.5 rounded-lg font-semibold transition ${
              filterCategory === 'RETRIEVAL'
                ? 'bg-blue-800 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }"
          >
            Data Retrieval
          </button>
          <button
            type="button"
            onclick="window.appFilterAuditCategory('AUTH')"
            class="px-3 py-1.5 rounded-lg font-semibold transition ${
              filterCategory === 'AUTH'
                ? 'bg-emerald-800 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }"
          >
            Auth & QR
          </button>
        </div>
      </div>

      <!-- 3. Audit Log Entries Table -->
      <div class="card-subtle p-5 md:p-6 bg-white space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100">
          <div class="flex items-center space-x-2">
            <i data-lucide="list" class="w-5 h-5 text-[#073B70]"></i>
            <h3 class="font-bold text-slate-800 text-base">Recorded Institutional Events</h3>
          </div>
          <span class="text-xs text-slate-400 font-mono font-medium">${filtered.length} Recorded Entries</span>
        </div>

        ${
          filtered.length === 0
            ? `
          <div class="p-12 text-center text-slate-400 space-y-2">
            <i data-lucide="inbox" class="w-10 h-10 text-slate-300 mx-auto"></i>
            <p class="text-sm font-semibold text-slate-700">No audit events match your filter criteria.</p>
          </div>
        `
            : `
          <div class="overflow-x-auto table-scroll-container">
            <table class="w-full text-left text-xs">
              <thead>
                <tr class="bg-slate-50 border-y border-slate-200 text-slate-500 uppercase font-semibold text-[11px]">
                  <th class="py-3 px-4">Timestamp</th>
                  <th class="py-3 px-4">Action / Event</th>
                  <th class="py-3 px-4">Target Entity</th>
                  <th class="py-3 px-4">Actor & Role</th>
                  <th class="py-3 px-4">IP Address</th>
                  <th class="py-3 px-4">Change Summary & Details</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                ${filtered
                  .map((log) => {
                    const isDanger = log.action?.includes('DENIED') || log.action?.includes('REJECT') || log.action?.includes('REVOKE');
                    const isSuccess = log.action?.includes('APPROVE') || log.action?.includes('SUCCESS') || log.action?.includes('COMMIT');

                    return `
                  <tr class="hover:bg-slate-50/80 transition">
                    <td class="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      ${log.timestamp}
                    </td>
                    <td class="py-3 px-4 whitespace-nowrap">
                      <span class="px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                        isDanger
                          ? 'bg-rose-50 text-rose-800 border border-rose-200'
                          : isSuccess
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-[#F0F4FA] text-[#073B70] border border-[#DCE4EE]'
                      }">
                        ${log.action}
                      </span>
                    </td>
                    <td class="py-3 px-4 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                      ${log.entityName || 'system'}
                    </td>
                    <td class="py-3 px-4 whitespace-nowrap">
                      <div class="font-bold text-slate-800">${log.actorName || 'System'}</div>
                      <span class="text-[10px] text-slate-400 capitalize">${log.actorRole || 'service'}</span>
                    </td>
                    <td class="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      ${log.ipAddress || '127.0.0.1'}
                    </td>
                    <td class="py-3 px-4 text-slate-700 max-w-md break-words">
                      ${log.details || 'No additional parameters logged'}
                    </td>
                  </tr>
                `;
                  })
                  .join('')}
              </tbody>
            </table>
          </div>
        `
        }
      </div>
    </div>
  `;
}
