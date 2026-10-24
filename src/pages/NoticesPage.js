// SJCEM NEXT MIS Notices & Circulars Page
import { misStore } from '../services/store.js';

export function renderNoticesPage(filterCategory = 'ALL', searchQuery = '') {
  const user = misStore.getCurrentUser();
  let notices = misStore.getNotices();

  const categories = [
    'ALL',
    'ACADEMIC',
    'EXAMINATION',
    'EVENTS',
    'ADMINISTRATIVE',
    'PLACEMENT',
    'SCHOLARSHIPS',
  ];

  if (filterCategory !== 'ALL') {
    notices = notices.filter((n) => n.category === filterCategory);
  }

  if (searchQuery.trim().length > 0) {
    const q = searchQuery.toLowerCase().trim();
    notices = notices.filter((n) => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q));
  }

  return `
    <div class="space-y-6 animate-fade-in pb-12">
      <!-- Header -->
      <div class="card-subtle p-6 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <h2 class="text-xl md:text-2xl font-bold text-slate-800">Notices, Circulars & Announcements</h2>
            <span class="text-xs px-2.5 py-0.5 rounded-full font-bold bg-teal-50 text-teal-800 border border-teal-200">
              Official Bulletin
            </span>
          </div>
          <p class="text-xs md:text-sm text-slate-500">
            Authenticated notices published by SJCEM Principal, Registrar, Exam Cell, and Departments.
          </p>
        </div>

        ${
          user.role === 'faculty' || user.role === 'admin'
            ? `
          <button
            onclick="window.appOpenCreateNoticeModal()"
            class="px-4 py-2 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-semibold text-xs shadow-sm transition flex items-center gap-1.5 flex-shrink-0"
          >
            <i data-lucide="plus" class="w-3.5 h-3.5"></i>
            <span>Publish New Notice</span>
          </button>
        `
            : ''
        }
      </div>

      <!-- Search & Category Filters -->
      <div class="card-subtle p-4 bg-white flex flex-col md:flex-row md:items-center justify-between gap-3">
        <!-- Search bar -->
        <div class="relative flex-1">
          <i data-lucide="search" class="w-4 h-4 absolute left-3 top-2.5 text-slate-400"></i>
          <input
            id="notices-search-input"
            type="text"
            value="${searchQuery}"
            placeholder="Search circulars by keyword..."
            class="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-teal-600"
            oninput="window.appSearchNotices(this.value)"
          />
        </div>

        <!-- Categories -->
        <div class="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          ${categories
            .map((cat) => {
              const isSelected = filterCategory === cat;
              return `
              <button
                onclick="window.appFilterNoticesCategory('${cat}')"
                class="px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  isSelected
                    ? 'bg-teal-800 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }"
              >
                ${cat}
              </button>
            `;
            })
            .join('')}
        </div>
      </div>

      <!-- Notices List -->
      <div class="space-y-3.5">
        ${
          notices.length === 0
            ? `
          <div class="card-subtle p-12 text-center text-slate-400">
            <i data-lucide="file-x" class="w-10 h-10 mx-auto mb-2 text-slate-300"></i>
            <p class="text-sm font-medium">No notices found matching the criteria.</p>
          </div>
        `
            : notices
                .map((n) => {
                  const priorityClass =
                    n.priority === 'URGENT'
                      ? 'bg-rose-100 text-rose-800 border-rose-200'
                      : n.priority === 'IMPORTANT'
                      ? 'bg-amber-100 text-amber-800 border-amber-200'
                      : 'bg-slate-100 text-slate-700 border-slate-200';

                  return `
            <div class="card-subtle p-5 bg-white space-y-3 ${
              n.isPinned ? 'border-teal-300 bg-teal-50/20' : ''
            }">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div class="flex flex-wrap items-center gap-2">
                  ${
                    n.isPinned
                      ? `
                    <span class="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-teal-100 text-teal-800 border border-teal-200">
                      <i data-lucide="pin" class="w-3 h-3"></i>
                      <span>PINNED</span>
                    </span>
                  `
                      : ''
                  }
                  <span class="text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${priorityClass}">
                    ${n.priority}
                  </span>
                  <span class="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                    ${n.category}
                  </span>
                  <span class="text-[11px] text-slate-400 font-medium">
                    Published: ${n.publishedDate}
                  </span>
                </div>

                <div class="flex items-center gap-2">
                  <button
                    onclick="window.appToggleNoticeRead('${n.id}', ${!n.isRead})"
                    class="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1"
                    title="${n.isRead ? 'Mark unread' : 'Mark as read'}"
                  >
                    <i data-lucide="${n.isRead ? 'check-circle' : 'circle'}" class="w-3.5 h-3.5 ${
                    n.isRead ? 'text-teal-700' : 'text-slate-300'
                  }"></i>
                    <span>${n.isRead ? 'Read' : 'Mark Read'}</span>
                  </button>
                </div>
              </div>

              <div>
                <h3 class="text-base font-bold text-slate-800 mb-1.5 leading-snug">${n.title}</h3>
                <p class="text-xs text-slate-600 leading-relaxed whitespace-pre-line">${n.content}</p>
              </div>

              <!-- Footer with author and attachment -->
              <div class="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <span class="text-slate-500 flex items-center gap-1.5">
                  <i data-lucide="user" class="w-3.5 h-3.5 text-teal-800"></i>
                  <span>Author: <strong>${n.authorName}</strong> (${n.department})</span>
                </span>

                ${
                  n.attachmentName
                    ? `
                  <button
                    onclick="window.appDownloadNoticeAttachment('${n.attachmentName}')"
                    class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 font-medium transition flex-shrink-0"
                  >
                    <i data-lucide="file-text" class="w-3.5 h-3.5"></i>
                    <span class="font-mono text-xs">${n.attachmentName} (${n.attachmentSize})</span>
                    <i data-lucide="download" class="w-3 h-3 ml-1"></i>
                  </button>
                `
                    : ''
                }
              </div>
            </div>
          `;
                })
                .join('')
        }
      </div>
    </div>
  `;
}
