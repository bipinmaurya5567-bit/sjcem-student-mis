// SJCEM NEXT MIS Certificate Management Page
import { misStore } from '../services/store.js';

export function renderCertificatesPage() {
  const certificates = misStore.getCertificates();
  const user = misStore.getCurrentUser();

  return `
    <div class="space-y-6 animate-fade-in pb-12">
      <!-- Header Banner -->
      <div class="card-subtle p-6 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4 border-slate-200">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <h2 class="text-xl md:text-2xl font-bold text-slate-800">Institutional Certificate Services</h2>
            <span class="text-xs px-2.5 py-0.5 rounded-full font-bold bg-teal-50 text-teal-800 border border-teal-200">
              Registrar Office
            </span>
          </div>
          <p class="text-xs md:text-sm text-slate-500">
            Apply online for official institutional documents with automated verification & digital seal generation.
          </p>
        </div>

        <button
          onclick="window.appOpenRequestCertificateModal()"
          class="px-4 py-2 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-semibold text-xs shadow-sm transition flex items-center gap-1.5 flex-shrink-0"
        >
          <i data-lucide="file-plus" class="w-3.5 h-3.5"></i>
          <span>Request New Certificate</span>
        </button>
      </div>

      <!-- Certificate Type Cards (Quick apply shortcuts) -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="card-subtle p-4 bg-white flex flex-col justify-between space-y-3">
          <div>
            <div class="w-8 h-8 rounded-lg bg-teal-50 text-teal-800 flex items-center justify-center font-bold mb-2">
              <i data-lucide="file-badge" class="w-4 h-4"></i>
            </div>
            <h3 class="text-sm font-bold text-slate-800">Bonafide Certificate</h3>
            <p class="text-xs text-slate-500 mt-1">For bank loans, passport verification, bus/train concessions.</p>
          </div>
          <button
            onclick="window.appOpenRequestCertificateModal('BONAFIDE')"
            class="w-full py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 font-semibold text-xs transition"
          >
            Apply Now
          </button>
        </div>

        <div class="card-subtle p-4 bg-white flex flex-col justify-between space-y-3">
          <div>
            <div class="w-8 h-8 rounded-lg bg-blue-50 text-blue-800 flex items-center justify-center font-bold mb-2">
              <i data-lucide="scroll-text" class="w-4 h-4"></i>
            </div>
            <h3 class="text-sm font-bold text-slate-800">Official Transcript</h3>
            <p class="text-xs text-slate-500 mt-1">For higher education, GRE/TOEFL, university migrations.</p>
          </div>
          <button
            onclick="window.appOpenRequestCertificateModal('TRANSCRIPT')"
            class="w-full py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-800 font-semibold text-xs transition"
          >
            Apply Now
          </button>
        </div>

        <div class="card-subtle p-4 bg-white flex flex-col justify-between space-y-3">
          <div>
            <div class="w-8 h-8 rounded-lg bg-purple-50 text-purple-800 flex items-center justify-center font-bold mb-2">
              <i data-lucide="file-check-2" class="w-4 h-4"></i>
            </div>
            <h3 class="text-sm font-bold text-slate-800">Leaving Certificate</h3>
            <p class="text-xs text-slate-500 mt-1">Formal institutional transfer & program exit certificate.</p>
          </div>
          <button
            onclick="window.appOpenRequestCertificateModal('LEAVING_CERTIFICATE')"
            class="w-full py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-800 font-semibold text-xs transition"
          >
            Apply Now
          </button>
        </div>

        <div class="card-subtle p-4 bg-white flex flex-col justify-between space-y-3">
          <div>
            <div class="w-8 h-8 rounded-lg bg-amber-50 text-amber-800 flex items-center justify-center font-bold mb-2">
              <i data-lucide="compass" class="w-4 h-4"></i>
            </div>
            <h3 class="text-sm font-bold text-slate-800">Migration Certificate</h3>
            <p class="text-xs text-slate-500 mt-1">University of Mumbai board transfer & state migration.</p>
          </div>
          <button
            onclick="window.appOpenRequestCertificateModal('MIGRATION')"
            class="w-full py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 font-semibold text-xs transition"
          >
            Apply Now
          </button>
        </div>
      </div>

      <!-- Existing Requests Table & Live Status Timeline -->
      <div class="card-subtle p-5 md:p-6 space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100">
          <div class="flex items-center space-x-2">
            <i data-lucide="inbox" class="w-5 h-5 text-teal-800"></i>
            <h3 class="font-bold text-slate-800 text-base">Your Active & Historical Requests</h3>
          </div>
          <span class="text-xs text-slate-400 font-mono">${certificates.length} Total Requests</span>
        </div>

        <div class="space-y-4">
          ${
            certificates.length === 0
              ? `
            <div class="p-12 text-center text-slate-400">
              <i data-lucide="file-text" class="w-10 h-10 mx-auto mb-2 text-slate-300"></i>
              <p class="text-sm font-medium">You haven't submitted any certificate requests yet.</p>
            </div>
          `
              : certificates
                  .map((cert) => {
                    const statusClass =
                      cert.status === 'APPROVED'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : cert.status === 'UNDER_REVIEW'
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : cert.status === 'REJECTED'
                        ? 'bg-rose-50 text-rose-800 border-rose-200'
                        : 'bg-slate-100 text-slate-700 border-slate-200';

                    return `
              <div class="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div class="flex items-center gap-2 mb-1">
                      <span class="text-sm font-bold text-slate-800">${cert.certificateType}</span>
                      <span class="text-xs font-mono font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                        ${cert.referenceNumber}
                      </span>
                    </div>
                    <p class="text-xs text-slate-500">
                      <strong>Purpose:</strong> ${cert.purpose}
                    </p>
                  </div>

                  <div class="flex items-center gap-3">
                    <span class="px-2.5 py-1 rounded-full text-xs font-bold border uppercase ${statusClass}">
                      ${cert.status}
                    </span>

                    ${
                      cert.status === 'APPROVED'
                        ? `
                      <button
                        onclick="window.appPreviewOfficialCertificate('${cert.id}')"
                        class="px-3 py-1.5 rounded-lg bg-teal-800 hover:bg-teal-900 text-white font-semibold text-xs shadow-sm transition flex items-center gap-1.5"
                      >
                        <i data-lucide="download" class="w-3.5 h-3.5"></i>
                        <span>Download Certificate</span>
                      </button>
                    `
                        : ''
                    }

                    ${
                      user.role === 'admin'
                        ? `
                      <button
                        onclick="window.appOpenAdminCertificateReview('${cert.id}')"
                        class="px-3 py-1.5 rounded-lg bg-purple-50 text-purple-800 border border-purple-200 font-semibold text-xs transition"
                      >
                        Admin Action
                      </button>
                    `
                        : ''
                    }
                  </div>
                </div>

                ${
                  cert.adminRemarks
                    ? `
                  <div class="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start gap-2">
                    <i data-lucide="message-square" class="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0"></i>
                    <span><strong>Administrator Remarks:</strong> ${cert.adminRemarks}</span>
                  </div>
                `
                    : ''
                }

                <!-- Timeline Audit Drawer -->
                <div class="pt-2 border-t border-slate-100">
                  <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 block">
                    Verification Trail
                  </span>
                  <div class="space-y-1.5">
                    ${cert.timeline
                      .map(
                        (tl) => `
                      <div class="text-[11px] text-slate-500 flex items-start gap-2">
                        <span class="w-1.5 h-1.5 rounded-full bg-teal-600 mt-1.5 flex-shrink-0"></span>
                        <span class="font-mono text-slate-400 flex-shrink-0">${tl.date}</span>
                        <span class="font-semibold text-slate-700">${tl.actor}:</span>
                        <span class="text-slate-600">${tl.remarks}</span>
                      </div>
                    `
                      )
                      .join('')}
                  </div>
                </div>
              </div>
            `;
                  })
                  .join('')
          }
        </div>
      </div>
    </div>
  `;
}
