// SJCEM NEXT MIS Project Management Workspace
import { misStore } from '../services/store.js';

export function renderProjectsPage() {
  const project = misStore.getProject();
  const user = misStore.getCurrentUser();

  const completedMilestones = project.milestones.filter((m) => m.isCompleted).length;
  const progressPercent = Math.round((completedMilestones / project.milestones.length) * 100);

  return `
    <div class="space-y-6 animate-fade-in pb-12">
      <!-- Header Banner -->
      <div class="card-subtle p-6 bg-white border-slate-200">
        <div class="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div class="flex flex-wrap items-center gap-2 mb-2">
              <span class="text-xs px-2.5 py-0.5 rounded-full font-bold bg-teal-50 text-teal-800 border border-teal-200">
                ${project.category}
              </span>
              <span class="text-xs px-2.5 py-0.5 rounded-full font-bold bg-blue-50 text-blue-800 border border-blue-200">
                ${project.status}
              </span>
              <span class="text-xs text-slate-400 font-mono">AY ${project.academicYear}</span>
            </div>
            <h2 class="text-xl md:text-2xl font-bold text-slate-800 tracking-tight leading-snug">
              ${project.title}
            </h2>
            <p class="text-xs md:text-sm text-slate-600 mt-2 leading-relaxed max-w-4xl">
              ${project.abstract}
            </p>
          </div>

          <div class="flex items-center gap-2 flex-shrink-0">
            ${
              user.role === 'student'
                ? `
              <button
                onclick="window.appOpenSubmitProjectModal()"
                class="px-4 py-2 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-semibold text-xs shadow-sm transition flex items-center gap-1.5"
              >
                <i data-lucide="upload" class="w-3.5 h-3.5"></i>
                <span>Submit Progress Update</span>
              </button>
            `
                : user.role === 'faculty'
                ? `
              <button
                onclick="window.appOpenFacultyReviewProjectModal('${project.submissions[0]?.id || ''}')"
                class="px-4 py-2 rounded-xl bg-blue-800 hover:bg-blue-900 text-white font-semibold text-xs shadow-sm transition flex items-center gap-1.5"
              >
                <i data-lucide="check-square" class="w-3.5 h-3.5"></i>
                <span>Review Latest Deliverable</span>
              </button>
            `
                : ''
            }
          </div>
        </div>

        <!-- Guide & Team Meta Bar -->
        <div class="pt-5 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div class="flex items-center space-x-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div class="w-9 h-9 rounded-xl bg-teal-800 text-white flex items-center justify-center font-bold">
              <i data-lucide="user-check" class="w-4 h-4"></i>
            </div>
            <div>
              <span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Assigned Faculty Mentor</span>
              <span class="font-bold text-slate-800 text-sm block">${project.guideName}</span>
              <span class="text-teal-800 font-mono">${project.guideEmail}</span>
            </div>
          </div>

          <div class="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
            <div class="flex items-center justify-between mb-1.5">
              <span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Milestone Completion</span>
              <span class="font-bold text-teal-800">${completedMilestones} of ${project.milestones.length} Completed (${progressPercent}%)</span>
            </div>
            <div class="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
              <div class="bg-teal-800 h-2 rounded-full transition-all" style="width: ${progressPercent}%;"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Two Column Layout: Milestones vs Team Roster & Submissions -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- 1. Milestone Roadmap (2 Cols on lg) -->
        <div class="lg:col-span-2 card-subtle p-5 md:p-6 space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <div class="flex items-center space-x-2">
              <i data-lucide="flag" class="w-5 h-5 text-teal-800"></i>
              <h3 class="font-bold text-slate-800 text-base">Project Lifecycle & Milestones</h3>
            </div>
            <span class="text-xs text-slate-400 font-medium">Department Approved Schedule</span>
          </div>

          <div class="space-y-3">
            ${project.milestones
              .map(
                (m, idx) => `
              <div class="p-4 rounded-xl border transition flex items-start space-x-3 ${
                m.isCompleted
                  ? 'bg-emerald-50/40 border-emerald-200'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }">
                <div class="mt-0.5 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                  m.isCompleted
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 border border-slate-300 text-slate-500'
                }">
                  <i data-lucide="${m.isCompleted ? 'check' : 'circle'}" class="w-3.5 h-3.5"></i>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                    <h4 class="text-xs sm:text-sm font-bold text-slate-800">
                      Phase ${idx + 1}: ${m.title}
                    </h4>
                    <span class="text-[11px] font-mono font-medium ${
                      m.isCompleted ? 'text-emerald-700' : 'text-slate-500'
                    }">
                      Due: ${m.dueDate}
                    </span>
                  </div>
                  ${
                    m.remarks
                      ? `<p class="text-xs text-slate-600 bg-white/80 p-2 rounded-lg border border-slate-200/80 mt-1.5">
                          <strong class="text-teal-800">Mentor Note:</strong> ${m.remarks}
                        </p>`
                      : '<p class="text-xs text-slate-400 italic">Deliverable submission pending</p>'
                  }
                </div>
              </div>
            `
              )
              .join('')}
          </div>
        </div>

        <!-- 2. Team Roster & Submissions History (1 Col on lg) -->
        <div class="space-y-6">
          <!-- Team Members -->
          <div class="card-subtle p-5 md:p-6 space-y-3">
            <h3 class="font-bold text-slate-800 text-sm md:text-base pb-2 border-b border-slate-100 flex items-center justify-between">
              <span>Project Team Roster</span>
              <span class="text-xs text-slate-400 font-normal">Group 14</span>
            </h3>

            <div class="space-y-2.5">
              ${project.teamMembers
                .map(
                  (mem) => `
                <div class="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                  <div>
                    <span class="font-bold text-slate-800 block flex items-center gap-1.5">
                      ${mem.name}
                      ${mem.isLeader ? '<span class="text-[9px] px-1.5 py-0.2 rounded bg-teal-800 text-white font-bold">Leader</span>' : ''}
                    </span>
                    <span class="text-[10px] text-slate-400 font-mono">${mem.roll}</span>
                  </div>
                  <span class="text-[10px] text-teal-800 font-mono truncate max-w-[100px]">${mem.email}</span>
                </div>
              `
                )
                .join('')}
            </div>
          </div>

          <!-- Document Submissions Log -->
          <div class="card-subtle p-5 md:p-6 space-y-3">
            <h3 class="font-bold text-slate-800 text-sm md:text-base pb-2 border-b border-slate-100 flex items-center justify-between">
              <span>Submission History</span>
              <i data-lucide="file-check" class="w-4 h-4 text-teal-800"></i>
            </h3>

            <div class="space-y-2.5">
              ${project.submissions
                .map(
                  (sub) => `
                <div class="p-3 rounded-xl border border-slate-200 bg-white space-y-1.5 text-xs">
                  <div class="flex items-center justify-between">
                    <span class="font-bold text-slate-800">${sub.title}</span>
                    <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">${sub.version}</span>
                  </div>
                  <p class="text-[11px] text-slate-400 font-mono">${sub.documentName} • ${sub.submittedDate}</p>
                  ${
                    sub.feedback
                      ? `<div class="p-2 rounded bg-teal-50 border border-teal-200 text-teal-900 text-[11px] leading-snug">
                          <strong>Mentor Review:</strong> ${sub.feedback}
                        </div>`
                      : ''
                  }
                </div>
              `
                )
                .join('')}
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}
