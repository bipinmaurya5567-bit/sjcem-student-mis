// SJCEM NEXT MIS Student Overview Dashboard
import { misStore } from '../services/store.js';

export function renderOverviewPage() {
  const user = misStore.getCurrentUser();
  const overallAtt = misStore.getOverallAttendance();
  const todayClasses = misStore.getTodayClasses();
  const internalMarks = misStore.getInternalMarks();
  const notices = misStore.getNotices();
  const certificates = misStore.getCertificates();
  const unreadNotices = notices.filter((n) => !n.isRead);
  const pendingRequests = certificates.filter((c) => c.status === 'UNDER_REVIEW' || c.status === 'SUBMITTED');

  // Subjects requiring attention (<75% threshold)
  const lowAttendanceSubjects = misStore.getAttendance().filter((a) => a.percentage < 75);

  const todayDateStr = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return `
    <div class="space-y-6 animate-fade-in pb-12">
      <!-- 1. Personalized Welcome Header Banner -->
      <div class="card-subtle bg-gradient-to-r from-teal-900 via-teal-800 to-[#19685F] text-white p-6 md:p-8 rounded-2xl relative overflow-hidden shadow-md">
        <!-- Background decorative pattern -->
        <div class="absolute -right-10 -bottom-10 w-64 h-64 rounded-full bg-white/5 pointer-events-none"></div>
        <div class="absolute right-32 -top-12 w-48 h-48 rounded-full bg-teal-400/10 pointer-events-none"></div>

        <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div class="flex items-start md:items-center space-x-4">
            <img
              src="${user.avatarUrl}"
              alt="${user.firstName}"
              class="w-16 h-16 md:w-20 md:h-20 rounded-2xl object-cover border-2 border-white/20 shadow-md flex-shrink-0"
              onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(user.firstName + ' ' + user.lastName)}&background=247F73&color=fff'"
            />
            <div>
              <div class="flex items-center gap-2 mb-1">
                <span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/15 text-teal-100 border border-white/20">
                  ${user.rollNumber || 'SJCEM2022CS084'}
                </span>
                <span class="text-xs text-teal-200">PRN: ${user.prn || '2022016400987654'}</span>
              </div>
              <h2 class="text-2xl md:text-3xl font-bold tracking-tight text-white mb-1">
                Welcome back, ${user.firstName} ${user.lastName}
              </h2>
              <p class="text-xs md:text-sm text-teal-100/90 font-medium flex flex-wrap items-center gap-x-3 gap-y-1">
                <span>${user.program || 'B.E. Computer Engineering'}</span>
                <span>•</span>
                <span>Semester ${user.semester || 6} (Div ${user.division || 'A'})</span>
                <span>•</span>
                <span>Academic Year 2025–26</span>
              </p>
            </div>
          </div>

          <!-- Current Date & Quick Primary Action -->
          <div class="flex flex-col md:items-end justify-between space-y-3">
            <div class="text-left md:text-right">
              <span class="text-[11px] uppercase tracking-wider text-teal-200 font-semibold block">Today</span>
              <span class="text-sm font-bold text-white">${todayDateStr}</span>
            </div>
            <div class="flex items-center gap-2">
              <button
                onclick="window.appNavigate('assistant')"
                class="px-3.5 py-2 rounded-xl bg-white text-teal-900 font-semibold text-xs hover:bg-teal-50 transition shadow-sm flex items-center gap-1.5"
              >
                <i data-lucide="sparkles" class="w-4 h-4 text-emerald-600"></i>
                <span>Ask Campus AI</span>
              </button>
              <button
                onclick="window.appNavigate('certificates')"
                class="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs border border-white/20 transition flex items-center gap-1.5"
              >
                <i data-lucide="file-plus" class="w-4 h-4"></i>
                <span>Request Certificate</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 2. Academic Summary Cards (6 Key Metric Tiles) -->
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <!-- Attendance Card -->
        <div
          onclick="window.appNavigate('attendance')"
          class="card-subtle p-4 cursor-pointer hover:border-teal-500 transition group relative overflow-hidden"
        >
          <div class="flex items-center justify-between text-slate-500 mb-2">
            <span class="text-xs font-semibold text-slate-500 group-hover:text-teal-700">Attendance</span>
            <div class="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
              <i data-lucide="calendar-check" class="w-4 h-4"></i>
            </div>
          </div>
          <div class="text-xl md:text-2xl font-bold text-slate-800 tracking-tight mb-1">
            ${overallAtt.percentage}%
          </div>
          <p class="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
            <i data-lucide="check-circle" class="w-3 h-3"></i>
            <span>Above 75% MU norm</span>
          </p>
        </div>

        <!-- Today's Classes Card -->
        <div
          onclick="window.appNavigate('timetable')"
          class="card-subtle p-4 cursor-pointer hover:border-teal-500 transition group"
        >
          <div class="flex items-center justify-between text-slate-500 mb-2">
            <span class="text-xs font-semibold text-slate-500 group-hover:text-teal-700">Lectures Today</span>
            <div class="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <i data-lucide="clock" class="w-4 h-4"></i>
            </div>
          </div>
          <div class="text-xl md:text-2xl font-bold text-slate-800 tracking-tight mb-1">
            ${todayClasses.length} Slots
          </div>
          <p class="text-[11px] text-slate-500 font-medium">9:00 AM – 4:45 PM</p>
        </div>

        <!-- Upcoming Exam Card -->
        <div
          onclick="window.appNavigate('marks')"
          class="card-subtle p-4 cursor-pointer hover:border-teal-500 transition group"
        >
          <div class="flex items-center justify-between text-slate-500 mb-2">
            <span class="text-xs font-semibold text-slate-500 group-hover:text-teal-700">Next Assessment</span>
            <div class="w-7 h-7 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
              <i data-lucide="file-text" class="w-4 h-4"></i>
            </div>
          </div>
          <div class="text-xl md:text-2xl font-bold text-slate-800 tracking-tight mb-1">
            IA-2 Exam
          </div>
          <p class="text-[11px] text-purple-600 font-medium">Commencing 12 Nov</p>
        </div>

        <!-- Latest Assessment Status -->
        <div
          onclick="window.appNavigate('marks')"
          class="card-subtle p-4 cursor-pointer hover:border-teal-500 transition group"
        >
          <div class="flex items-center justify-between text-slate-500 mb-2">
            <span class="text-xs font-semibold text-slate-500 group-hover:text-teal-700">IA-1 Score Avg</span>
            <div class="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <i data-lucide="award" class="w-4 h-4"></i>
            </div>
          </div>
          <div class="text-xl md:text-2xl font-bold text-slate-800 tracking-tight mb-1">
            18.2 / 20
          </div>
          <p class="text-[11px] text-emerald-600 font-medium">Verified by HOD</p>
        </div>

        <!-- Pending Requests Card -->
        <div
          onclick="window.appNavigate('requests')"
          class="card-subtle p-4 cursor-pointer hover:border-teal-500 transition group"
        >
          <div class="flex items-center justify-between text-slate-500 mb-2">
            <span class="text-xs font-semibold text-slate-500 group-hover:text-teal-700">Requests</span>
            <div class="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <i data-lucide="inbox" class="w-4 h-4"></i>
            </div>
          </div>
          <div class="text-xl md:text-2xl font-bold text-slate-800 tracking-tight mb-1">
            ${pendingRequests.length} Pending
          </div>
          <p class="text-[11px] text-amber-600 font-medium">1 Bonafide in review</p>
        </div>

        <!-- Unread Circulars Card -->
        <div
          onclick="window.appNavigate('notices')"
          class="card-subtle p-4 cursor-pointer hover:border-teal-500 transition group"
        >
          <div class="flex items-center justify-between text-slate-500 mb-2">
            <span class="text-xs font-semibold text-slate-500 group-hover:text-teal-700">Notices</span>
            <div class="w-7 h-7 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center">
              <i data-lucide="bell" class="w-4 h-4"></i>
            </div>
          </div>
          <div class="text-xl md:text-2xl font-bold text-slate-800 tracking-tight mb-1">
            ${unreadNotices.length} Unread
          </div>
          <p class="text-[11px] text-rose-600 font-medium">Exam form notice urgent</p>
        </div>
      </div>

      <!-- 3. Two Column Layout: Today's Timetable & Attendance Snapshot -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Today's Timetable (2 Cols on lg) -->
        <div class="lg:col-span-2 card-subtle p-5 md:p-6 flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center space-x-2.5">
                <div class="w-8 h-8 rounded-lg bg-teal-50 text-teal-800 flex items-center justify-center font-bold">
                  <i data-lucide="calendar" class="w-4 h-4"></i>
                </div>
                <div>
                  <h3 class="font-bold text-slate-800 text-sm md:text-base">Today's Class Schedule</h3>
                  <p class="text-xs text-slate-400">Computer Engineering • Sem VI Div A</p>
                </div>
              </div>
              <button
                onclick="window.appNavigate('timetable')"
                class="text-xs text-teal-700 hover:text-teal-900 font-semibold flex items-center gap-1 transition"
              >
                <span>Full Week Grid</span>
                <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
              </button>
            </div>

            <!-- List of Today's Lectures -->
            <div class="divide-y divide-slate-100">
              ${
                todayClasses.length === 0
                  ? `
                <div class="p-8 text-center text-slate-400">
                  <p class="text-xs">No classes scheduled for today.</p>
                </div>
              `
                  : todayClasses
                      .map((slot, index) => {
                        const isFirst = index === 0;
                        const isLab = slot.type === 'LAB';
                        return `
                  <div class="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 group hover:bg-slate-50/80 px-2 rounded-lg transition">
                    <div class="flex items-start space-x-3">
                      <div class="w-16 flex-shrink-0 text-left pt-0.5">
                        <span class="text-xs font-bold text-slate-800 block">${slot.startTime}</span>
                        <span class="text-[10px] text-slate-400 font-medium block">${slot.endTime}</span>
                      </div>
                      <div>
                        <div class="flex items-center gap-2 mb-0.5">
                          <span class="text-xs font-bold text-slate-800">${slot.subjectName}</span>
                          <span class="text-[10px] px-1.5 py-0.2 rounded font-mono font-medium ${
                            isLab
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : 'bg-teal-50 text-teal-700 border border-teal-200'
                          }">
                            ${slot.type}
                          </span>
                        </div>
                        <p class="text-xs text-slate-500 flex items-center gap-1.5">
                          <span>${slot.facultyName}</span>
                          <span>•</span>
                          <span class="font-mono text-slate-600 font-semibold">${slot.roomNumber}</span>
                        </p>
                      </div>
                    </div>

                    <div class="sm:text-right flex items-center sm:flex-col gap-2">
                      <span class="text-[11px] px-2 py-0.5 rounded-full font-medium ${
                        isFirst
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-600'
                      }">
                        ${isFirst ? 'Completed' : 'Upcoming'}
                      </span>
                    </div>
                  </div>
                `;
                      })
                      .join('')
              }
            </div>
          </div>

          <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
            <span>Location: St. John Technical Campus Academic Block 3</span>
            <span class="text-teal-700 font-medium">Attendance marked via RFID & Faculty log</span>
          </div>
        </div>

        <!-- Attendance Snapshot (1 Col on lg) -->
        <div class="card-subtle p-5 md:p-6 flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-bold text-slate-800 text-sm md:text-base">Attendance Snapshot</h3>
              <button
                onclick="window.appNavigate('attendance')"
                class="text-xs text-teal-700 hover:text-teal-900 font-semibold flex items-center gap-1"
              >
                <span>Details</span>
                <i data-lucide="chevron-right" class="w-3.5 h-3.5"></i>
              </button>
            </div>

            <!-- Big Circular/Progress Gauge -->
            <div class="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center mb-4">
              <div class="text-3xl font-extrabold text-teal-800 tracking-tight">
                ${overallAtt.percentage}%
              </div>
              <p class="text-xs text-slate-600 font-semibold mt-1">Overall Academic Attendance</p>
              <p class="text-[11px] text-slate-400 mt-0.5">
                ${overallAtt.attended} of ${overallAtt.conducted} lectures attended
              </p>

              <!-- Progress bar -->
              <div class="w-full bg-slate-200 rounded-full h-2 mt-3 overflow-hidden">
                <div
                  class="bg-[#247F73] h-2 rounded-full transition-all duration-500"
                  style="width: ${overallAtt.percentage}%;"
                ></div>
              </div>
            </div>

            <!-- Warning if any subject below 75% -->
            ${
              lowAttendanceSubjects.length > 0
                ? `
              <div class="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs mb-3 flex items-start gap-2">
                <i data-lucide="alert-triangle" class="w-4 h-4 flex-shrink-0 text-amber-600 mt-0.5"></i>
                <div>
                  <span class="font-bold">Attention Required:</span>
                  ${lowAttendanceSubjects.map((s) => `${s.subjectCode} (${s.percentage}%)`).join(', ')} is currently below the 75% threshold.
                </div>
              </div>
            `
                : `
              <div class="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs mb-3 flex items-center gap-2">
                <i data-lucide="check-circle-2" class="w-4 h-4 flex-shrink-0 text-emerald-600"></i>
                <span class="font-medium">All subjects satisfy the minimum 75% attendance rule.</span>
              </div>
            `
            }

            <!-- Top Subjects List -->
            <div class="space-y-2">
              ${misStore
                .getAttendance()
                .slice(0, 3)
                .map(
                  (a) => `
                <div class="flex items-center justify-between text-xs py-1 border-b border-slate-100 last:border-none">
                  <span class="text-slate-700 truncate max-w-[160px]">${a.subjectName}</span>
                  <div class="flex items-center gap-2">
                    <span class="font-mono text-slate-500">${a.attended}/${a.conducted}</span>
                    <span class="font-bold ${a.percentage >= 75 ? 'text-teal-800' : 'text-amber-600'}">${a.percentage}%</span>
                  </div>
                </div>
              `
                )
                .join('')}
            </div>
          </div>

          <div class="mt-4 pt-3 border-t border-slate-100 text-[10px] text-slate-400">
            *Formula: (Attended / Conducted) × 100 as per Mumbai University Academic Ordinance 6086.
          </div>
        </div>
      </div>

      <!-- 4. Notice Board Preview & Quick Actions Section -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Notice Board (2 Cols on lg) -->
        <div class="lg:col-span-2 card-subtle p-5 md:p-6">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center space-x-2">
              <div class="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                <i data-lucide="bell" class="w-4 h-4"></i>
              </div>
              <h3 class="font-bold text-slate-800 text-sm md:text-base">Official Notices & Circulars</h3>
            </div>
            <button
              onclick="window.appNavigate('notices')"
              class="text-xs text-teal-700 hover:text-teal-900 font-semibold flex items-center gap-1"
            >
              <span>View All Circulars</span>
              <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
            </button>
          </div>

          <div class="space-y-3">
            ${notices
              .slice(0, 3)
              .map((n) => {
                const priorityBadge =
                  n.priority === 'URGENT'
                    ? 'bg-rose-100 text-rose-800 border-rose-200'
                    : n.priority === 'IMPORTANT'
                    ? 'bg-amber-100 text-amber-800 border-amber-200'
                    : 'bg-slate-100 text-slate-700 border-slate-200';

                return `
                <div
                  onclick="window.appOpenNotice('${n.id}')"
                  class="p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50/80 transition cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-2"
                >
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-1">
                      <span class="text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${priorityBadge}">
                        ${n.priority}
                      </span>
                      <span class="text-[10px] text-teal-800 font-semibold bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                        ${n.category}
                      </span>
                      <span class="text-[10px] text-slate-400 font-medium">${n.publishedDate}</span>
                    </div>
                    <h4 class="text-xs md:text-sm font-bold text-slate-800 hover:text-teal-800 transition line-clamp-1">
                      ${n.title}
                    </h4>
                    <p class="text-xs text-slate-500 line-clamp-1 mt-0.5">${n.content}</p>
                  </div>
                  ${
                    n.attachmentName
                      ? `
                    <div class="flex items-center gap-1 text-[11px] text-teal-700 bg-white border border-teal-200 px-2.5 py-1 rounded-md flex-shrink-0">
                      <i data-lucide="paperclip" class="w-3.5 h-3.5"></i>
                      <span class="font-mono">${n.attachmentSize}</span>
                    </div>
                  `
                      : ''
                  }
                </div>
              `;
              })
              .join('')}
          </div>
        </div>

        <!-- Quick Access Services -->
        <div class="card-subtle p-5 md:p-6 flex flex-col justify-between">
          <div>
            <h3 class="font-bold text-slate-800 text-sm md:text-base mb-4">Quick Student Actions</h3>
            <div class="grid grid-cols-2 gap-2.5">
              <button
                onclick="window.appNavigate('certificates')"
                class="p-3 rounded-xl border border-slate-200 hover:border-teal-400 hover:bg-teal-50/50 transition text-left flex flex-col justify-between group"
              >
                <div class="w-8 h-8 rounded-lg bg-teal-50 text-teal-800 flex items-center justify-center mb-2 group-hover:bg-teal-700 group-hover:text-white transition">
                  <i data-lucide="file-badge-2" class="w-4 h-4"></i>
                </div>
                <span class="text-xs font-bold text-slate-800 block">Bonafide Certificate</span>
                <span class="text-[10px] text-slate-400 block">Apply online</span>
              </button>

              <button
                onclick="window.appNavigate('projects')"
                class="p-3 rounded-xl border border-slate-200 hover:border-teal-400 hover:bg-teal-50/50 transition text-left flex flex-col justify-between group"
              >
                <div class="w-8 h-8 rounded-lg bg-blue-50 text-blue-800 flex items-center justify-center mb-2 group-hover:bg-blue-700 group-hover:text-white transition">
                  <i data-lucide="folder-git-2" class="w-4 h-4"></i>
                </div>
                <span class="text-xs font-bold text-slate-800 block">Capstone Project</span>
                <span class="text-[10px] text-slate-400 block">Submit milestone</span>
              </button>

              <button
                onclick="window.appNavigate('results')"
                class="p-3 rounded-xl border border-slate-200 hover:border-teal-400 hover:bg-teal-50/50 transition text-left flex flex-col justify-between group"
              >
                <div class="w-8 h-8 rounded-lg bg-purple-50 text-purple-800 flex items-center justify-center mb-2 group-hover:bg-purple-700 group-hover:text-white transition">
                  <i data-lucide="award" class="w-4 h-4"></i>
                </div>
                <span class="text-xs font-bold text-slate-800 block">Grade Cards</span>
                <span class="text-[10px] text-slate-400 block">Sem 1 to 5</span>
              </button>

              <button
                onclick="window.appNavigate('resources')"
                class="p-3 rounded-xl border border-slate-200 hover:border-teal-400 hover:bg-teal-50/50 transition text-left flex flex-col justify-between group"
              >
                <div class="w-8 h-8 rounded-lg bg-amber-50 text-amber-800 flex items-center justify-center mb-2 group-hover:bg-amber-700 group-hover:text-white transition">
                  <i data-lucide="book-open" class="w-4 h-4"></i>
                </div>
                <span class="text-xs font-bold text-slate-800 block">Study Notes & PYQs</span>
                <span class="text-[10px] text-slate-400 block">Download PDFs</span>
              </button>
            </div>
          </div>

          <!-- Institutional Helpline Banner -->
          <div class="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 flex items-center justify-between">
            <span class="flex items-center gap-1.5 font-medium">
              <i data-lucide="phone" class="w-3.5 h-3.5 text-teal-800"></i>
              <span>Exam Cell: 02525-297275</span>
            </span>
            <button onclick="window.appNavigate('help')" class="text-teal-800 font-bold hover:underline">
              Helpline
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}
