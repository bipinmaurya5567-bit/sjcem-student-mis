// SJCEM NEXT MIS Unified Request Tracking Page
import { misStore } from '../services/store.js';

export function renderRequestsPage(filterStatus = 'ALL', searchQuery = '') {
  const certificates = misStore.getCertificates();
  const project = misStore.getProject();
  const tickets = misStore.getSupportTickets();

  // Combine into unified requests list
  const unifiedRequests = [
    ...certificates.map((c) => ({
      id: c.id,
      ref: c.referenceNumber,
      category: 'Certificate Request',
      type: c.certificateType,
      purpose: c.purpose,
      submittedDate: c.submittedDate,
      lastUpdated: c.lastUpdated,
      status: c.status,
      dept: 'Student Section & Registrar',
      timeline: c.timeline,
      rawItem: c,
    })),
    ...project.submissions.map((s) => ({
      id: s.id,
      ref: `SJCEM-PROJ-${s.version}`,
      category: 'Project Milestone',
      type: project.category,
      purpose: s.title,
      submittedDate: s.submittedDate,
      lastUpdated: s.submittedDate,
      status: s.status === 'REVIEWED' ? 'COMPLETED' : 'UNDER_REVIEW',
      dept: 'Computer Engineering Department',
      timeline: [
        { date: s.submittedDate, status: 'SUBMITTED', actor: 'Project Team 14', remarks: 'Milestone uploaded' },
        ...(s.feedback ? [{ date: s.submittedDate, status: 'REVIEWED', actor: project.guideName, remarks: s.feedback }] : []),
      ],
      rawItem: s,
    })),
    ...tickets.map((t) => ({
      id: t.id,
      ref: t.ticketNumber,
      category: 'Support Ticket',
      type: t.category,
      purpose: t.subject,
      submittedDate: t.createdDate,
      lastUpdated: t.createdDate,
      status: t.status === 'RESOLVED' ? 'COMPLETED' : t.status === 'IN_PROGRESS' ? 'UNDER_REVIEW' : 'SUBMITTED',
      dept: 'Administrative IT Helpdesk',
      timeline: [
        { date: t.createdDate, status: 'OPEN', actor: 'Student', remarks: t.description },
        ...(t.lastReply ? [{ date: t.createdDate, status: t.status, actor: 'Helpdesk Officer', remarks: t.lastReply }] : []),
      ],
      rawItem: t,
    })),
  ];

  let filtered = unifiedRequests;
  if (filterStatus !== 'ALL') {
    filtered = filtered.filter((r) => r.status === filterStatus);
  }
  if (searchQuery.trim().length > 0) {
    const q = searchQuery.toLowerCase().trim();
    filtered = filtered.filter(
      (r) => r.ref.toLowerCase().includes(q) || r.purpose.toLowerCase().includes(q) || r.category.toLowerCase().includes(q)
    );
  }

  return `
    <div class="space-y-6 animate-fade-in pb-12">
      <!-- Header -->
      <div class="card-subtle p-6 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <h2 class="text-xl md:text-2xl font-bold text-slate-800">Unified Student Request Tracking</h2>
            <span class="text-xs px-2.5 py-0.5 rounded-full font-bold bg-teal-50 text-teal-800 border border-teal-200">
              One-Stop Desk
            </span>
          </div>
          <p class="text-xs md:text-sm text-slate-500">
            Consolidated lifecycle tracking for certificates, project approvals, leave applications, and help tickets.
          </p>
        </div>

        <button
          onclick="window.appOpenRequestCertificateModal()"
          class="px-4 py-2 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-semibold text-xs shadow-sm transition flex items-center gap-1.5 flex-shrink-0"
        >
          <i data-lucide="plus" class="w-3.5 h-3.5"></i>
          <span>New Request</span>
        </button>
      </div>

      <!-- Filters & Search Bar -->
      <div class="card-subtle p-4 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div class="relative flex-1">
          <i data-lucide="search" class="w-4 h-4 absolute left-3 top-2.5 text-slate-400"></i>
          <input
            id="requests-search-input"
            type="text"
            value="${searchQuery}"
            placeholder="Search by reference number or purpose..."
            class="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-teal-600"
            oninput="window.appSearchRequests(this.value)"
          />
        </div>

        <div class="flex items-center gap-1.5">
          <span class="text-slate-400 font-medium">Status:</span>
          <select
            id="filter-requests-status"
            onchange="window.appFilterRequestsStatus(this.value)"
            class="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 font-semibold focus:outline-none"
          >
            <option value="ALL" ${filterStatus === 'ALL' ? 'selected' : ''}>All Statuses</option>
            <option value="SUBMITTED" ${filterStatus === 'SUBMITTED' ? 'selected' : ''}>Submitted</option>
            <option value="UNDER_REVIEW" ${filterStatus === 'UNDER_REVIEW' ? 'selected' : ''}>Under Review</option>
            <option value="APPROVED" ${filterStatus === 'APPROVED' ? 'selected' : ''}>Approved</option>
            <option value="COMPLETED" ${filterStatus === 'COMPLETED' ? 'selected' : ''}>Completed</option>
          </select>
        </div>
      </div>

      <!-- Unified Requests Table -->
      <div class="card-subtle p-5 md:p-6 space-y-4">
        <div class="overflow-x-auto table-scroll-container">
          <table class="w-full text-left text-xs">
            <thead>
              <tr class="bg-slate-50 border-y border-slate-200 text-slate-500 uppercase font-semibold text-[10px]">
                <th class="py-3 px-4">Ref Number</th>
                <th class="py-3 px-4">Category</th>
                <th class="py-3 px-4">Subject / Purpose</th>
                <th class="py-3 px-4">Department</th>
                <th class="py-3 px-4 text-center">Submitted</th>
                <th class="py-3 px-4 text-center">Status</th>
                <th class="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              ${
                filtered.length === 0
                  ? `
                <tr>
                  <td colspan="7" class="py-12 text-center text-slate-400">
                    No requests found matching your query.
                  </td>
                </tr>
              `
                  : filtered
                      .map((req) => {
                        const isApproved = req.status === 'APPROVED' || req.status === 'COMPLETED';
                        const isReview = req.status === 'UNDER_REVIEW';

                        return `
                  <tr class="hover:bg-slate-50/80 transition">
                    <td class="py-3 px-4 font-mono font-bold text-teal-800">${req.ref}</td>
                    <td class="py-3 px-4 font-bold text-slate-800">
                      <span class="block">${req.category}</span>
                      <span class="text-[10px] text-slate-400 font-normal">${req.type}</span>
                    </td>
                    <td class="py-3 px-4 text-slate-600 max-w-xs truncate">${req.purpose}</td>
                    <td class="py-3 px-4 text-slate-500 text-[11px]">${req.dept}</td>
                    <td class="py-3 px-4 text-center font-mono text-slate-500">${req.submittedDate}</td>
                    <td class="py-3 px-4 text-center">
                      <span class="px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase ${
                        isApproved
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : isReview
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }">
                        ${req.status}
                      </span>
                    </td>
                    <td class="py-3 px-4 text-center">
                      <button
                        onclick="window.appViewRequestDetail('${req.ref}')"
                        class="px-2.5 py-1 rounded bg-slate-100 hover:bg-teal-50 hover:text-teal-800 text-slate-700 font-semibold transition"
                      >
                        Timeline
                      </button>
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
    </div>
  `;
}
