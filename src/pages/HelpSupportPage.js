// SJCEM NEXT MIS Help & Support Page
import { INSTITUTION_INFO } from '../data/mockDatabase.js';
import { misStore } from '../services/store.js';

export function renderHelpSupportPage() {
  const tickets = misStore.getSupportTickets();

  const faqs = [
    {
      q: 'How is attendance percentage calculated under University of Mumbai norms?',
      a: 'Attendance percentage is computed as (Attended Sessions / Conducted Sessions) × 100. Laboratory practical hours carry double duration. Students must maintain a minimum 75% aggregate to be eligible for end-semester University examinations under Ordinance 6086.',
    },
    {
      q: 'How do I obtain my Western Railway student concession pass?',
      a: 'Railway concession vouchers can be collected directly from the Student Section (Counter 3) between 10:30 AM to 01:30 PM on all working weekdays. Bring your physical SJCEM student identity card and current term fee receipt.',
    },
    {
      q: 'What is the processing turnaround time for a Bonafide Certificate?',
      a: 'Standard Bonafide requests submitted online through SJCEM NEXT are verified within 2 to 3 working days by the Student Section and authenticated by the Registrar and Principal.',
    },
    {
      q: 'How do I submit my Capstone Project deliverables?',
      a: 'Go to the Projects module from the left navigation, select your assigned project group, and click "Submit Progress Update" to upload your synopsis, presentation, or thesis PDF.',
    },
    {
      q: 'What should I do if my name is misspelled on a grade card?',
      a: 'Submit a support ticket under the "Examination & Records" category and attach a scanned copy of your 10th or 12th passing certificate. The Exam Cell will correct the ledger before the final University degree gazette print.',
    },
  ];

  return `
    <div class="space-y-6 animate-fade-in pb-12">
      <!-- Header -->
      <div class="card-subtle p-6 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <h2 class="text-xl md:text-2xl font-bold text-slate-800">Help, Campus Directory & Support Desk</h2>
            <span class="text-xs px-2.5 py-0.5 rounded-full font-bold bg-teal-50 text-teal-800 border border-teal-200">
              Palghar Campus
            </span>
          </div>
          <p class="text-xs md:text-sm text-slate-500">
            Institutional contact directory, frequently asked academic questions, and student ticket assistance.
          </p>
        </div>

        <button
          onclick="window.appOpenNewTicketModal()"
          class="px-4 py-2 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-semibold text-xs shadow-sm transition flex items-center gap-1.5 flex-shrink-0"
        >
          <i data-lucide="life-buoy" class="w-3.5 h-3.5"></i>
          <span>Raise Support Ticket</span>
        </button>
      </div>

      <!-- Campus Directory & Department Contacts -->
      <div class="card-subtle p-5 md:p-6 bg-white space-y-4">
        <div class="flex items-center space-x-2 pb-3 border-b border-slate-100">
          <i data-lucide="building" class="w-5 h-5 text-teal-800"></i>
          <h3 class="font-bold text-slate-800 text-base">Institutional Campus Contacts</h3>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div class="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <span class="font-bold text-slate-800 text-sm block">Main Administrative Office</span>
            <p class="text-slate-500">${INSTITUTION_INFO.location}</p>
            <p class="font-mono text-teal-800 font-bold">${INSTITUTION_INFO.contacts.phone}</p>
            <p class="font-mono text-slate-600">${INSTITUTION_INFO.contacts.email}</p>
          </div>

          <div class="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <span class="font-bold text-slate-800 text-sm block">Examination Cell</span>
            <p class="text-slate-500">Academic Block 1, Room 108</p>
            <p class="font-mono text-teal-800 font-bold">02525-297279 (Ext. 204)</p>
            <p class="font-mono text-slate-600">${INSTITUTION_INFO.contacts.examCellEmail}</p>
          </div>

          <div class="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <span class="font-bold text-slate-800 text-sm block">Student Section & Scholarships</span>
            <p class="text-slate-500">Counter 1 to 4, Ground Floor</p>
            <p class="font-mono text-teal-800 font-bold">10:30 AM to 04:30 PM (Mon-Fri)</p>
            <p class="font-mono text-slate-600">${INSTITUTION_INFO.contacts.admissionEmail}</p>
          </div>
        </div>
      </div>

      <!-- Two Columns: FAQs Accordion vs Active Tickets -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- FAQs (2 cols) -->
        <div class="lg:col-span-2 card-subtle p-5 md:p-6 space-y-3">
          <div class="flex items-center space-x-2 pb-3 border-b border-slate-100">
            <i data-lucide="help-circle" class="w-5 h-5 text-teal-800"></i>
            <h3 class="font-bold text-slate-800 text-base">Frequently Asked Questions</h3>
          </div>

          <div class="space-y-3">
            ${faqs
              .map(
                (f, idx) => `
              <div class="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1.5 text-xs">
                <h4 class="font-bold text-slate-800 text-sm flex items-start gap-2">
                  <span class="text-teal-800 font-mono">Q${idx + 1}.</span>
                  <span>${f.q}</span>
                </h4>
                <p class="text-slate-600 leading-relaxed pl-6 pt-1">${f.a}</p>
              </div>
            `
              )
              .join('')}
          </div>
        </div>

        <!-- Active Support Tickets (1 col) -->
        <div class="card-subtle p-5 md:p-6 space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <div class="flex items-center space-x-2">
              <i data-lucide="ticket" class="w-5 h-5 text-teal-800"></i>
              <h3 class="font-bold text-slate-800 text-base">Your Tickets</h3>
            </div>
            <span class="text-xs text-slate-400 font-mono">${tickets.length} Total</span>
          </div>

          <div class="space-y-3">
            ${
              tickets.length === 0
                ? '<div class="p-6 text-center text-slate-400 text-xs">No active support tickets.</div>'
                : tickets
                    .map((t) => {
                      const isResolved = t.status === 'RESOLVED';
                      return `
                <div class="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2 text-xs">
                  <div class="flex items-center justify-between">
                    <span class="font-mono font-bold text-teal-800 text-[11px]">${t.ticketNumber}</span>
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isResolved
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }">
                      ${t.status}
                    </span>
                  </div>
                  <h4 class="font-bold text-slate-800">${t.subject}</h4>
                  <p class="text-[11px] text-slate-500 line-clamp-2">${t.description}</p>
                  ${
                    t.lastReply
                      ? `<div class="p-2 rounded bg-teal-50 border border-teal-200 text-[11px] text-teal-900 mt-2">
                          <strong>Helpdesk Reply:</strong> ${t.lastReply}
                        </div>`
                      : ''
                  }
                </div>
              `;
                    })
                    .join('')
            }
          </div>
        </div>
      </div>
    </div>
  `;
}
