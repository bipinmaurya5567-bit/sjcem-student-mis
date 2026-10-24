// SJCEM NEXT MIS Study Resources Page
import { misStore } from '../services/store.js';

export function renderResourcesPage(filterType = 'ALL', filterSubject = 'ALL') {
  const user = misStore.getCurrentUser();
  let resources = misStore.getStudyResources();
  const attendance = misStore.getAttendance();

  if (filterType !== 'ALL') {
    resources = resources.filter((r) => r.resourceType === filterType);
  }
  if (filterSubject !== 'ALL') {
    resources = resources.filter((r) => r.subjectCode === filterSubject);
  }

  return `
    <div class="space-y-6 animate-fade-in pb-12">
      <!-- Header -->
      <div class="card-subtle p-6 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <h2 class="text-xl md:text-2xl font-bold text-slate-800">Academic Study Resources & Lab Manuals</h2>
            <span class="text-xs px-2.5 py-0.5 rounded-full font-bold bg-teal-50 text-teal-800 border border-teal-200">
              Department Repository
            </span>
          </div>
          <p class="text-xs md:text-sm text-slate-500">
            Faculty-shared lecture notes, laboratory experiment manuals, syllabus copies, and past question papers.
          </p>
        </div>

        ${
          user.role === 'faculty' || user.role === 'admin'
            ? `
          <button
            onclick="window.appOpenUploadResourceModal()"
            class="px-4 py-2 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-semibold text-xs shadow-sm transition flex items-center gap-1.5 flex-shrink-0"
          >
            <i data-lucide="upload-cloud" class="w-3.5 h-3.5"></i>
            <span>Upload Course Material</span>
          </button>
        `
            : ''
        }
      </div>

      <!-- Filters Row -->
      <div class="card-subtle p-4 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div class="flex items-center gap-2">
          <span class="text-slate-400 font-medium">Filter Type:</span>
          <select
            id="filter-resource-type"
            onchange="window.appFilterResources()"
            class="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 font-semibold focus:outline-none"
          >
            <option value="ALL" ${filterType === 'ALL' ? 'selected' : ''}>All Resource Types</option>
            <option value="NOTES" ${filterType === 'NOTES' ? 'selected' : ''}>Lecture Notes</option>
            <option value="QUESTION_PAPER" ${filterType === 'QUESTION_PAPER' ? 'selected' : ''}>Question Papers & PYQ</option>
            <option value="LAB_MANUAL" ${filterType === 'LAB_MANUAL' ? 'selected' : ''}>Lab Manuals</option>
            <option value="SYLLABUS" ${filterType === 'SYLLABUS' ? 'selected' : ''}>Syllabus Copies</option>
          </select>
        </div>

        <div class="flex items-center gap-2">
          <span class="text-slate-400 font-medium">Course:</span>
          <select
            id="filter-resource-subject"
            onchange="window.appFilterResources()"
            class="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 font-semibold focus:outline-none"
          >
            <option value="ALL" ${filterSubject === 'ALL' ? 'selected' : ''}>All Courses</option>
            ${attendance
              .map((a) => `<option value="${a.subjectCode}" ${filterSubject === a.subjectCode ? 'selected' : ''}>${a.subjectCode} - ${a.subjectName.substring(0, 20)}...</option>`)
              .join('')}
          </select>
        </div>
      </div>

      <!-- Resource Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        ${
          resources.length === 0
            ? `
          <div class="col-span-2 card-subtle p-12 text-center text-slate-400">
            <i data-lucide="folder-search" class="w-10 h-10 mx-auto mb-2 text-slate-300"></i>
            <p class="text-sm font-medium">No study materials found matching filters.</p>
          </div>
        `
            : resources
                .map((r) => {
                  const formatIcon = r.fileFormat === 'ZIP' ? 'archive' : 'file-text';
                  const formatColor = r.fileFormat === 'ZIP' ? 'text-amber-600 bg-amber-50' : 'text-teal-800 bg-teal-50';

                  return `
            <div class="card-subtle p-5 bg-white flex flex-col justify-between space-y-4 hover:border-teal-300 transition group">
              <div>
                <div class="flex items-center justify-between text-xs mb-2">
                  <span class="font-mono font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                    ${r.subjectCode}
                  </span>
                  <span class="text-slate-400 font-medium">${r.uploadDate}</span>
                </div>

                <div class="flex items-start space-x-3">
                  <div class="w-10 h-10 rounded-xl ${formatColor} flex items-center justify-center flex-shrink-0 border border-slate-200">
                    <i data-lucide="${formatIcon}" class="w-5 h-5"></i>
                  </div>
                  <div>
                    <h3 class="text-sm font-bold text-slate-800 group-hover:text-teal-800 transition line-clamp-2">
                      ${r.title}
                    </h3>
                    <p class="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">${r.description}</p>
                  </div>
                </div>
              </div>

              <div class="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <div class="flex items-center gap-1.5 text-slate-500">
                  <span class="truncate max-w-[120px] font-medium">${r.uploadedBy}</span>
                  <span>•</span>
                  <span class="font-mono">${r.fileSize}</span>
                </div>

                <button
                  onclick="window.appDownloadResource('${r.title}')"
                  class="px-3 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-800 hover:text-white text-teal-800 font-semibold text-xs border border-teal-200 transition flex items-center gap-1.5"
                >
                  <i data-lucide="download" class="w-3.5 h-3.5"></i>
                  <span>Download ${r.fileFormat}</span>
                </button>
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
