// SJCEM NEXT MIS — High-Usability Mobile Bottom Navigation Bar
import { misStore } from '../../services/store.js';

export function renderBottomNav(currentRoute) {
  const user = misStore.getCurrentUser();
  if (!user) return '';

  const unreadCount = misStore.getUnreadNotificationCount();
  const notices = misStore.getNotices();
  const unreadNoticesCount = notices.filter((n) => !n.isRead).length;
  const certificates = misStore.getCertificates();
  const pendingCertCount = certificates.filter(
    (c) => c.status === 'UNDER_REVIEW' || c.status === 'SUBMITTED'
  ).length;

  let navItems = [];

  if (user.role === 'student') {
    navItems = [
      { id: 'overview', label: 'Home', icon: 'layout-dashboard' },
      { id: 'attendance', label: 'Attendance', icon: 'calendar-check' },
      { id: 'timetable', label: 'Timetable', icon: 'clock' },
      { id: 'notices', label: 'Notices', icon: 'bell', badge: unreadNoticesCount },
      { id: 'profile', label: 'ID & Profile', icon: 'user' },
    ];
  } else if (user.role === 'faculty') {
    navItems = [
      { id: 'faculty-workspace', label: 'Workspace', icon: 'briefcase' },
      { id: 'attendance-entry', label: 'Attendance', icon: 'clipboard-check' },
      { id: 'marks-entry', label: 'Marks', icon: 'file-check-2' },
      { id: 'notices', label: 'Notices', icon: 'bell' },
      { id: 'more', label: 'More', icon: 'menu', isAction: true },
    ];
  } else if (user.role === 'admin') {
    navItems = [
      { id: 'admin-workspace', label: 'Console', icon: 'shield-check' },
      { id: 'admin-certificates', label: 'Approvals', icon: 'file-badge-2', badge: pendingCertCount },
      { id: 'admin-audit', label: 'Audit', icon: 'list-checks' },
      { id: 'admin-schema', label: 'Schema', icon: 'database' },
      { id: 'more', label: 'More', icon: 'menu', isAction: true },
    ];
  }

  return `
    <!-- Mobile Bottom Navigation Bar (Thumb Friendly, iOS Safe-Area Aware) -->
    <nav class="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-2 pt-1 pb-[max(0.35rem,env(safe-area-inset-bottom))] select-none">
      <div class="grid grid-cols-5 items-center justify-around max-w-md mx-auto">
        ${navItems
          .map((item) => {
            const isActive = currentRoute === item.id;
            const clickHandler = item.isAction
              ? "window.appToggleMobileSidebar(true)"
              : `window.appNavigate('${item.id}')`;

            return `
            <button
              type="button"
              onclick="${clickHandler}"
              class="relative flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all duration-150 active:scale-95 group focus:outline-none ${
                isActive ? 'text-teal-800' : 'text-slate-400 hover:text-slate-600'
              }"
            >
              ${
                isActive
                  ? '<span class="absolute -top-1 w-8 h-1 rounded-full bg-teal-700 animate-fade-in shadow-sm"></span>'
                  : ''
              }
              <div class="relative p-1 rounded-lg ${
                isActive ? 'bg-teal-50 text-teal-800' : 'group-hover:bg-slate-50'
              }">
                <i data-lucide="${item.icon}" class="w-5 h-5 transition-transform ${
                  isActive ? 'stroke-[2.4]' : 'stroke-[1.8]'
                }"></i>
                ${
                  item.badge && item.badge > 0
                    ? `
                  <span class="absolute -top-0.5 -right-1 flex h-4 min-w-[1rem] px-1 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white shadow ring-2 ring-white">
                    ${item.badge}
                  </span>
                `
                    : ''
                }
              </div>
              <span class="text-[10px] tracking-tight truncate max-w-[64px] ${
                isActive ? 'font-bold text-teal-900' : 'font-medium text-slate-500'
              }">
                ${item.label}
              </span>
            </button>
          `;
          })
          .join('')}
      </div>
    </nav>
  `;
}
