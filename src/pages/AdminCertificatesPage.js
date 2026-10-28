// SJCEM NEXT MIS — Authorized Administrator Certificate Approvals Workflow Page
// Institution: St. John College of Engineering and Management, Palghar
// Managed by: ALDEL Education Trust

import { misStore } from '../services/store.js';

export function renderAdminCertificatesPage(filterStatus = 'ALL', searchQuery = '') {
  const user = misStore.getCurrentUser();
  if (!user || user.role !== 'admin') {
    return `
      <div class="card-subtle p-8 text-center text-slate-500 space-y-3">
        <i data-lucide="shield-alert" class="w-10 h-10 text-rose-600 mx-auto"></i>
        <h3 class="text-base font-bold text-slate-800">Administrator Access Required</h3>
        <p class="text-xs text-slate-600">The certificate approval queue is restricted to authorized academic administration personnel.</p>
      </div>
    `;
  }

  const allCertificates = misStore.getCertificates();
  const pendingCount = allCertificates.filter((c) => c.status === 'UNDER_REVIEW' || c.status === 'SUBMITTED').length;
  const approvedCount = allCertificates.filter((c) => c.status === 'APPROVED' || c.status === 'READY_FOR_COLLECTION').length;
  const rejectedCount = allCertificates.filter((c) => c.status === 'REJECTED').length;

  let filteredCerts = allCertificates;
  if (filterStatus === 'PENDING') {
    filteredCerts = filteredCerts.filter((c) => c.status === 'UNDER_REVIEW' || c.status === 'SUBMITTED');
  } else if (filterStatus === 'APPROVED') {
    filteredCerts = filteredCerts.filter((c) => c.status === 'APPROVED' || c.status === 'READY_FOR_COLLECTION');
  } else if (filterStatus === 'REJECTED') {
    filteredCerts = filteredCerts.filter((c) => c.status === 'REJECTED');
  }

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filteredCerts = filteredCerts.filter(
      (c) =>
        c.referenceNumber.toLowerCase().includes(q) ||
        c.certificateType.toLowerCase().includes(q) ||
        c.purpose.toLowerCase().includes(q)
    );
  }

  return `
    <div class="space-y-6 animate-fade-in pb-12">
      <!-- 1. Header Banner -->
      <div class="card-subtle p-6 bg-white border border-[#DCE4EE] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2 mb-1.5 flex-wrap">
            <span class="text-xs px-2.5 py-0.5 rounded-full font-bold bg-purple-50 text-purple-800 border border-purple-200 flex items-center gap-1.5">
              <i data-lucide="file-badge-2" class="w-3.5 h-3.5 text-purple-700"></i>
              <span>OFFICIAL REGISTRAR CELL</span>
            </span>
            <span class="text-xs text-slate-500">
              Clearance: Level 4 Administrative Approver
            </span>
          </div>
          <h2 class="text-xl md:text-2xl font-bold text-slate-800 tracking-tight">Student Certificate Approvals & Issuance</h2>
          <p class="text-xs md:text-sm text-slate-500 mt-0.5">
            Review student applications for bonafide certificates, transcripts, leaving letters, and migration records with digital seal issuing.
          </p>
        </div>

        <div class="flex items-center gap-2">
          <button
            type="button"
            onclick="window.appRefreshAdminCertificates()"
            class="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition flex items-center gap-1.5"
            title="Refresh certificate queue"
          >
            <i data-lucide="refresh-cw" class="w-3.5 h-3.5"></i>
            <span>Refresh Queue</span>
          </button>
        </div>
      </div>

      <!-- 2. Status Counter Pills -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          type="button"
          onclick="window.appFilterAdminCertStatus('ALL')"
          class="p-3.5 rounded-xl text-left border transition ${
            filterStatus === 'ALL'
              ? 'bg-[#073B70] text-white border-[#073B70] shadow-md'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }"
        >
          <span class="text-[11px] font-semibold uppercase tracking-wider block opacity-80">Total Requests</span>
          <div class="text-2xl font-extrabold mt-1">${allCertificates.length}</div>
          <span class="text-[10px] block mt-0.5 opacity-90">All Applications</span>
        </button>

        <button
          type="button"
          onclick="window.appFilterAdminCertStatus('PENDING')"
          class="p-3.5 rounded-xl text-left border transition ${
            filterStatus === 'PENDING'
              ? 'bg-amber-600 text-white border-amber-600 shadow-md'
              : 'bg-white border-slate-200 hover:border-amber-300'
          }"
        >
          <span class="text-[11px] font-semibold uppercase tracking-wider block opacity-80">Pending Action</span>
          <div class="text-2xl font-extrabold mt-1 text-amber-600 ${filterStatus === 'PENDING' ? 'text-white' : ''}">${pendingCount}</div>
          <span class="text-[10px] block mt-0.5 opacity-90">Awaiting Decision</span>
        </button>

        <button
          type="button"
          onclick="window.appFilterAdminCertStatus('APPROVED')"
          class="p-3.5 rounded-xl text-left border transition ${
            filterStatus === 'APPROVED'
              ? 'bg-emerald-700 text-white border-emerald-700 shadow-md'
              : 'bg-white border-slate-200 hover:border-emerald-300'
          }"
        >
          <span class="text-[11px] font-semibold uppercase tracking-wider block opacity-80">Approved & Issued</span>
          <div class="text-2xl font-extrabold mt-1 text-emerald-700 ${filterStatus === 'APPROVED' ? 'text-white' : ''}">${approvedCount}</div>
          <span class="text-[10px] block mt-0.5 opacity-90">Ready / Completed</span>
        </button>

        <button
          type="button"
          onclick="window.appFilterAdminCertStatus('REJECTED')"
          class="p-3.5 rounded-xl text-left border transition ${
            filterStatus === 'REJECTED'
              ? 'bg-rose-700 text-white border-rose-700 shadow-md'
              : 'bg-white border-slate-200 hover:border-rose-300'
          }"
        >
          <span class="text-[11px] font-semibold uppercase tracking-wider block opacity-80">Rejected</span>
          <div class="text-2xl font-extrabold mt-1 text-rose-700 ${filterStatus === 'REJECTED' ? 'text-white' : ''}">${rejectedCount}</div>
          <span class="text-[10px] block mt-0.5 opacity-90">Deficiency Noted</span>
        </button>
      </div>

      <!-- 3. Search & Filter Bar -->
      <div class="card-subtle p-4 bg-white flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div class="relative w-full sm:w-96">
          <i data-lucide="search" class="w-4 h-4 text-slate-400 absolute left-3 top-2.5"></i>
          <input
            type="text"
            id="admin-cert-search-input"
            value="${searchQuery}"
            placeholder="Search by Reference ID (e.g. SJCEM-CERT), type, or purpose..."
            oninput="window.appSearchAdminCerts(this.value)"
            class="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-[#073B70]"
          />
        </div>
        <div class="flex items-center gap-2 text-slate-400 font-medium">
          <span>Showing <strong>${filteredCerts.length}</strong> of ${allCertificates.length} requests</span>
        </div>
      </div>

      <!-- 4. Applications List / Table -->
      <div class="card-subtle p-5 md:p-6 bg-white space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100">
          <div class="flex items-center space-x-2">
            <i data-lucide="inbox" class="w-5 h-5 text-purple-700"></i>
            <h3 class="font-bold text-slate-800 text-base">Certificate Applications Queue</h3>
          </div>
          <span class="text-xs text-slate-400 font-mono font-medium">Registrar Approval Engine</span>
        </div>

        ${
          filteredCerts.length === 0
            ? `
          <div class="p-12 text-center text-slate-400 space-y-2">
            <i data-lucide="check-circle" class="w-10 h-10 text-emerald-500 mx-auto"></i>
            <p class="text-sm font-semibold text-slate-700">No applications match the selected criteria.</p>
            <p class="text-xs text-slate-400">All submissions have been processed or no matching records found.</p>
          </div>
        `
            : `
          <div class="space-y-3.5">
              ${filteredCerts
                .map((c) => {
                  const isPending = c.status === 'UNDER_REVIEW' || c.status === 'SUBMITTED';
                  const isApproved = c.status === 'APPROVED' || c.status === 'READY_FOR_COLLECTION';

                  return `
              <div class="p-4 sm:p-5 rounded-2xl border ${
                isPending
                  ? 'border-amber-200 bg-amber-50/20'
                  : isApproved
                  ? 'border-emerald-200 bg-emerald-50/20'
                  : 'border-rose-200 bg-rose-50/20'
              } space-y-3 transition hover:shadow-sm">
                
                <!-- Card Header -->
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div class="flex items-center gap-2 flex-wrap">
                    <span class="font-mono font-extrabold text-sm text-[#073B70]">${c.referenceNumber}</span>
                    <span class="px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                      isPending
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : isApproved
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-rose-100 text-rose-800 border border-rose-300'
                    }">
                      ${c.status}
                    </span>
                    <span class="text-[11px] text-slate-400 font-mono">Submitted: ${c.submittedDate}</span>
                  </div>

                  <span class="text-xs px-2.5 py-0.5 rounded-md font-bold bg-[#F0F4FA] text-[#073B70] border border-[#DCE4EE] w-fit">
                    ${c.certificateType}
                  </span>
                </div>

                <!-- Card Details -->
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
                  <div>
                    <span class="text-slate-400 font-medium block">Applicant Candidate</span>
                    <span class="font-bold text-slate-800 text-sm mt-0.5 block">Rahul Suresh Sharma</span>
                    <span class="text-slate-500 font-mono text-[11px]">EU20220084 • B.E. Computer Engg</span>
                  </div>
                  <div class="sm:col-span-2">
                    <span class="text-slate-400 font-medium block">Declared Application Purpose</span>
                    <p class="text-slate-700 font-medium mt-0.5 leading-relaxed bg-white/80 p-2.5 rounded-xl border border-slate-200/80">
                      ${c.purpose}
                    </p>
                  </div>
                </div>

                ${
                  c.adminRemarks
                    ? `
                  <div class="p-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-600 flex items-start gap-2">
                    <i data-lucide="message-square" class="w-3.5 h-3.5 text-purple-700 flex-shrink-0 mt-0.5"></i>
                    <div>
                      <span class="font-bold text-slate-800">Administrative Decision Note:</span>
                      <span>${c.adminRemarks}</span>
                    </div>
                  </div>
                `
                    : ''
                }

                <!-- Action Toolbar -->
                <div class="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200/60">
                  <button
                    type="button"
                    onclick="window.appViewRequestDetail('${c.referenceNumber}')"
                    class="text-xs text-[#073B70] hover:underline font-semibold flex items-center gap-1"
                  >
                    <i data-lucide="history" class="w-3.5 h-3.5"></i>
                    <span>View Timeline & History</span>
                  </button>

                  <div class="flex items-center gap-2">
                    ${
                      isPending
                        ? `
                      <button
                        type="button"
                        onclick="window.appAdminRejectCertPrompt('${c.id}')"
                        class="px-3.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold text-xs transition flex items-center gap-1"
                      >
                        <i data-lucide="x" class="w-3.5 h-3.5"></i>
                        <span>Reject with Reason</span>
                      </button>
                      <button
                        type="button"
                        onclick="window.appAdminApproveCertConfirm('${c.id}')"
                        class="px-4 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-sm transition flex items-center gap-1"
                      >
                        <i data-lucide="check" class="w-3.5 h-3.5"></i>
                        <span>Approve & Issue Certificate</span>
                      </button>
                    `
                        : `
                      <span class="text-xs font-semibold text-slate-500">
                        Processed on ${c.lastUpdated}
                      </span>
                    `
                    }
                  </div>
                </div>

              </div>
            `;
              })
              .join('')}
          </div>
        `
        }
      </div>
    </div>
  `;
}
