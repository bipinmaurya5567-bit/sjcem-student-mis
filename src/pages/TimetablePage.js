// SJCEM NEXT MIS Timetable & Calendar Page
import { misStore } from '../services/store.js';

export function renderTimetablePage(selectedDay = 5, viewMode = 'grid') {
  const timetable = misStore.getTimetable();
  const days = [
    { num: 1, name: 'Monday' },
    { num: 2, name: 'Tuesday' },
    { num: 3, name: 'Wednesday' },
    { num: 4, name: 'Thursday' },
    { num: 5, name: 'Friday' },
    { num: 6, name: 'Saturday' },
  ];

  const currentDaySlots = timetable.filter((s) => s.dayOfWeek === selectedDay);

  return `
    <div class="space-y-6 animate-fade-in pb-12">
      <!-- Header Controls -->
      <div class="card-subtle p-5 md:p-6 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <h2 class="text-xl md:text-2xl font-bold text-slate-800">Department Academic Timetable</h2>
            <span class="text-xs px-2.5 py-0.5 rounded-full font-bold bg-teal-50 text-teal-800 border border-teal-200">
              Odd Term 2025–26
            </span>
          </div>
          <p class="text-xs md:text-sm text-slate-500">
            Department of Computer Engineering • Semester VI • Division A (Room 302 / CC Lab 402)
          </p>
        </div>

        <div class="flex items-center gap-2 w-full sm:w-auto">
          <!-- View Toggle: Weekly Grid vs Daily Agenda -->
          <div class="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-semibold w-full sm:w-auto">
            <button
              onclick="window.appSetTimetableView('grid')"
              class="text-center px-3 py-1.5 rounded-lg transition ${
                viewMode === 'grid' ? 'bg-white text-teal-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }"
            >
              Weekly Grid
            </button>
            <button
              onclick="window.appSetTimetableView('agenda')"
              class="text-center px-3 py-1.5 rounded-lg transition ${
                viewMode === 'agenda' ? 'bg-white text-teal-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }"
            >
              Daily Agenda
            </button>
          </div>
        </div>
      </div>

      <!-- Day Selector Pills (for Agenda and Quick Jump) -->
      <div class="flex items-center gap-2 overflow-x-auto pb-1">
        ${days
          .map((d) => {
            const isSelected = selectedDay === d.num;
            const isToday = d.num === 5; // Friday is current day
            return `
            <button
              onclick="window.appSelectTimetableDay(${d.num})"
              class="px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 flex-shrink-0 ${
                isSelected
                  ? 'bg-teal-800 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }"
            >
              <span>${d.name}</span>
              ${
                isToday
                  ? `<span class="px-1.5 py-0.2 rounded-full text-[10px] ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-teal-100 text-teal-800'
                    }">Today</span>`
                  : ''
              }
            </button>
          `;
          })
          .join('')}
      </div>

      ${
        viewMode === 'grid'
          ? `
        <!-- Weekly Grid View -->
        <div class="card-subtle p-5 md:p-6 overflow-x-auto">
          <div class="min-w-[850px]">
            <div class="grid grid-cols-6 gap-3 pb-3 border-b border-slate-200 text-center font-bold text-xs text-slate-700">
              ${days
                .map(
                  (d) => `
                <div class="${d.num === 5 ? 'text-teal-800 bg-teal-50/80 py-1.5 rounded-lg border border-teal-200' : 'py-1.5'}">
                  ${d.name}
                  ${d.num === 5 ? '<span class="block text-[10px] font-normal text-teal-600">(Today)</span>' : ''}
                </div>
              `
                )
                .join('')}
            </div>

            <!-- Grid Body with Day Columns -->
            <div class="grid grid-cols-6 gap-3 pt-3">
              ${days
                .map((d) => {
                  const daySlots = timetable.filter((s) => s.dayOfWeek === d.num);
                  return `
                  <div class="space-y-2.5 flex flex-col">
                    ${
                      daySlots.length === 0
                        ? '<div class="p-4 text-center text-slate-300 text-xs">No scheduled lectures</div>'
                        : daySlots
                            .map((s) => {
                              const isLab = s.type === 'LAB';
                              return `
                        <div class="p-3 rounded-xl border transition text-left flex flex-col justify-between ${
                          isLab
                            ? 'bg-purple-50/60 border-purple-200 hover:border-purple-300'
                            : 'bg-slate-50 border-slate-200 hover:border-teal-300 hover:bg-teal-50/30'
                        }">
                          <div>
                            <div class="flex items-center justify-between text-[10px] text-slate-400 font-mono mb-1">
                              <span>${s.startTime} - ${s.endTime}</span>
                              <span class="font-bold ${isLab ? 'text-purple-700' : 'text-teal-800'}">${s.type}</span>
                            </div>
                            <h4 class="text-xs font-bold text-slate-800 line-clamp-2 mb-1">${s.subjectName}</h4>
                            <p class="text-[11px] text-teal-800 font-mono font-semibold">${s.subjectCode}</p>
                          </div>
                          <div class="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-500">
                            <span class="truncate max-w-[80px]">${s.facultyName}</span>
                            <span class="font-semibold text-slate-700 font-mono">${s.roomNumber}</span>
                          </div>
                        </div>
                      `;
                            })
                            .join('')
                    }
                  </div>
                `;
                })
                .join('')}
            </div>
          </div>
        </div>
      `
          : `
        <!-- Daily Agenda View -->
        <div class="card-subtle p-5 md:p-6 space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 class="font-bold text-slate-800 text-base">
              Agenda for ${days.find((d) => d.num === selectedDay)?.name}
            </h3>
            <span class="text-xs text-slate-500 font-medium">${currentDaySlots.length} Sessions</span>
          </div>

          <div class="space-y-3">
            ${
              currentDaySlots.length === 0
                ? '<div class="p-8 text-center text-slate-400 text-xs">No classes scheduled on this day.</div>'
                : currentDaySlots
                    .map((s, idx) => {
                      const isLab = s.type === 'LAB';
                      return `
                <div class="p-4 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition">
                  <div class="flex items-start space-x-4">
                    <div class="w-20 flex-shrink-0 text-left">
                      <span class="text-sm font-bold text-slate-800 block">${s.startTime}</span>
                      <span class="text-xs text-slate-400 block">${s.endTime}</span>
                    </div>
                    <div>
                      <div class="flex items-center gap-2 mb-1">
                        <span class="text-sm font-bold text-slate-800">${s.subjectName}</span>
                        <span class="text-xs px-2 py-0.5 rounded font-mono font-semibold ${
                          isLab ? 'bg-purple-100 text-purple-800' : 'bg-teal-100 text-teal-800'
                        }">
                          ${s.type}
                        </span>
                      </div>
                      <p class="text-xs text-slate-600 flex items-center gap-2">
                        <span>Faculty: <strong class="text-slate-800">${s.facultyName}</strong></span>
                        <span>•</span>
                        <span>Subject Code: <strong class="text-teal-800 font-mono">${s.subjectCode}</strong></span>
                      </p>
                    </div>
                  </div>

                  <div class="flex items-center gap-3">
                    <span class="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-mono font-bold text-slate-800">
                      ${s.roomNumber}
                    </span>
                  </div>
                </div>
              `;
                    })
                    .join('')
            }
          </div>
        </div>
      `
      }
    </div>
  `;
}
