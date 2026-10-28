// SJCEM NEXT MIS Global Search Modal
export function renderGlobalSearchModal() {
  return `
    <div id="global-search-modal" style="display:none;" class="fixed inset-0 z-50 overflow-y-auto modal-backdrop flex items-start justify-center pt-6 sm:pt-20 px-3 sm:px-4">
      <div class="relative bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden animate-fade-in my-auto sm:my-0">
        <!-- Search Input Bar -->
        <div class="p-3 sm:p-4 border-b border-slate-200 flex items-center space-x-3 bg-slate-50">
          <i data-lucide="search" class="w-5 h-5 text-slate-400 flex-shrink-0"></i>
          <input
            id="global-search-input"
            type="text"
            placeholder="Search circulars, subjects, timetable, certificates, resources..."
            class="w-full bg-transparent border-none text-slate-800 text-sm focus:outline-none placeholder-slate-400 font-medium"
            oninput="window.appHandleSearchInput(this.value)"
          />
          <button
            onclick="window.appCloseSearch()"
            class="text-xs bg-slate-200 hover:bg-slate-300 text-slate-600 px-2 py-1 rounded font-mono transition"
          >
            ESC
          </button>
        </div>

        <!-- Search Results / Suggestions Container -->
        <div id="search-results-container" class="max-h-[calc(100vh-12rem)] sm:max-h-96 overflow-y-auto p-2">
          <!-- Default Quick Links -->
          <div id="search-default-hints" class="p-3 sm:p-4 space-y-3">
            <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Quick Navigation</p>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <button onclick="window.appNavigate('attendance'); window.appCloseSearch();" class="p-2.5 rounded-lg border border-slate-200 text-left hover:bg-teal-50 hover:border-teal-300 transition flex items-center gap-2 text-slate-700">
                <i data-lucide="calendar-check" class="w-4 h-4 text-teal-700"></i>
                <span>Check Attendance (84.2%)</span>
              </button>
              <button onclick="window.appNavigate('timetable'); window.appCloseSearch();" class="p-2.5 rounded-lg border border-slate-200 text-left hover:bg-teal-50 hover:border-teal-300 transition flex items-center gap-2 text-slate-700">
                <i data-lucide="clock" class="w-4 h-4 text-teal-700"></i>
                <span>Today's Class Schedule</span>
              </button>
              <button onclick="window.appNavigate('results'); window.appCloseSearch();" class="p-2.5 rounded-lg border border-slate-200 text-left hover:bg-teal-50 hover:border-teal-300 transition flex items-center gap-2 text-slate-700">
                <i data-lucide="award" class="w-4 h-4 text-teal-700"></i>
                <span>Semester V Result (SGPA 8.72)</span>
              </button>
              <button onclick="window.appNavigate('certificates'); window.appCloseSearch();" class="p-2.5 rounded-lg border border-slate-200 text-left hover:bg-teal-50 hover:border-teal-300 transition flex items-center gap-2 text-slate-700">
                <i data-lucide="file-badge-2" class="w-4 h-4 text-teal-700"></i>
                <span>Request Bonafide Certificate</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <span class="truncate pr-2">SJCEM Global Directory</span>
          <span class="flex-shrink-0">Press ESC to close</span>
        </div>
      </div>
    </div>
  `;
}
