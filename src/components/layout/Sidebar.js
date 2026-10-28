// SJCEM NEXT MIS Sidebar Navigation Component
import { misStore } from '../../services/store.js';

export function renderSidebar(currentRoute, onNavigate, isCollapsed, _onToggleCollapse) {
  const user = misStore.getCurrentUser();
  const unreadNotices = misStore.getNotices().filter((n) => !n.isRead).length;
  const pendingRequests = misStore.getCertificates().filter((c) => c.status === 'UNDER_REVIEW' || c.status === 'SUBMITTED').length;

  // Student Navigation Items (All 15 required sections)
  const studentNavItems = [
    { id: 'overview', label: 'Overview', icon: 'layout-dashboard' },
    { id: 'profile', label: 'My Profile', icon: 'user' },
    { id: 'attendance', label: 'Attendance', icon: 'calendar-check', badge: '84.2%' },
    { id: 'timetable', label: 'Timetable', icon: 'clock' },
    { id: 'marks', label: 'Internal Marks', icon: 'file-spreadsheet' },
    { id: 'results', label: 'Semester Results', icon: 'award' },
    { id: 'analytics', label: 'Academic Analytics', icon: 'bar-chart-2' },
    { id: 'notices', label: 'Notices & Circulars', icon: 'bell', badge: unreadNotices > 0 ? unreadNotices : null, badgeColor: 'bg-amber-500' },
    { id: 'resources', label: 'Study Resources', icon: 'book-open' },
    { id: 'projects', label: 'Projects', icon: 'folder-git-2', badge: 'Active' },
    { id: 'certificates', label: 'Certificate Services', icon: 'file-badge-2' },
    { id: 'requests', label: 'My Requests', icon: 'inbox', badge: pendingRequests > 0 ? pendingRequests : null },
    { id: 'assistant', label: 'AI Student Assistant', icon: 'sparkles', badge: 'AI', badgeColor: 'bg-emerald-600' },
    { id: 'help', label: 'Help & Support', icon: 'help-circle' },
    { id: 'settings', label: 'Settings', icon: 'settings' },
  ];

  // Faculty Navigation Items
  const facultyNavItems = [
    { id: 'faculty-workspace', label: 'Faculty Dashboard', icon: 'layout-dashboard' },
    { id: 'student-lookup', label: 'Student Data Lookup', icon: 'search' },
    { id: 'attendance-entry', label: 'Class Attendance', icon: 'calendar-check', badge: 'Action' },
    { id: 'marks-entry', label: 'IA Marks Submission', icon: 'file-spreadsheet' },
    { id: 'timetable', label: 'Teaching Timetable', icon: 'clock' },
    { id: 'projects', label: 'Project Mentoring', icon: 'folder-git-2' },
    { id: 'resources', label: 'Upload Study Materials', icon: 'book-open' },
    { id: 'notices', label: 'Publish Notices', icon: 'bell' },
    { id: 'settings', label: 'Settings', icon: 'settings' },
  ];

  // Administrator Navigation Items
  const adminNavItems = [
    { id: 'admin-workspace', label: 'Admin Dashboard', icon: 'shield-check' },
    { id: 'student-lookup', label: 'Student Data Lookup', icon: 'search' },
    { id: 'admin-certificates', label: 'Certificate Approvals', icon: 'file-badge-2', badge: pendingRequests },
    { id: 'timetable', label: 'Timetable Oversight', icon: 'clock' },
    { id: 'notices', label: 'Notice Management', icon: 'bell' },
    { id: 'admin-audit', label: 'System Audit Logs', icon: 'list' },
    { id: 'admin-schema', label: 'Database Schema & RLS', icon: 'database' },
    { id: 'settings', label: 'Institutional Settings', icon: 'settings' },
  ];

  let itemsToRender = studentNavItems;
  if (user.role === 'faculty') itemsToRender = facultyNavItems;
  if (user.role === 'admin') itemsToRender = adminNavItems;

  const widthClass = isCollapsed ? 'w-20' : 'w-64';

  return `
    <aside class="${widthClass} bg-white border-r border-slate-200 h-screen flex flex-col transition-all duration-200 select-none z-30 flex-shrink-0">
      <!-- Institutional Branding Header -->
      <div class="h-20 px-4 border-b border-slate-200 flex items-center justify-between">
        <div class="flex items-center space-x-3 overflow-hidden ${isCollapsed ? 'justify-center w-full' : ''}">
          <img 
            src="public/assets/aldel-logo.png" 
            alt="ALDEL Education Trust" 
            class="h-10 w-auto object-contain flex-shrink-0"
            onerror="this.style.display='none'; document.getElementById('logo-fallback').style.display='flex';"
          />
          <div id="logo-fallback" style="display:none;" class="h-9 w-9 rounded-lg bg-[#073B70] text-white font-bold flex items-center justify-center text-sm">
            A
          </div>
          ${
            !isCollapsed
              ? `
            <div class="flex flex-col">
              <span class="font-bold text-sm text-slate-800 tracking-tight flex items-center gap-1.5">
                Student MIS
                <span class="px-1.5 py-0.2 bg-[#F0F4FA] text-[#073B70] text-[10px] rounded font-semibold border border-[#DCE4EE]">v2.4</span>
              </span>
              <span class="text-[11px] text-slate-500 font-medium truncate max-w-[130px]">SJCEM • Palghar</span>
            </div>
          `
              : ''
          }
        </div>
        <button
          onclick="window.appToggleMobileSidebar(false)"
          class="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition focus:outline-none flex-shrink-0"
          title="Close Navigation"
        >
          <i data-lucide="x" class="w-5 h-5"></i>
        </button>
      </div>

      <!-- Navigation Menu -->
      <div class="flex-1 overflow-y-auto py-3 px-3 space-y-1">
        ${
          !isCollapsed
            ? `
          <div class="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            ${user.role === 'student' ? 'Academic Portal' : user.role === 'faculty' ? 'Faculty Workspace' : 'Administration'}
          </div>
        `
            : ''
        }

        ${itemsToRender
          .map((item) => {
            const isActive = currentRoute === item.id;
            const activeClass = isActive
              ? 'bg-[#073B70] text-white shadow-sm font-semibold'
              : 'text-slate-700 hover:bg-[#F0F4FA] hover:text-[#073B70] font-medium';

            return `
            <button
              id="nav-${item.id}"
              onclick="window.appNavigate('${item.id}')"
              title="${item.label}"
              class="w-full flex items-center ${isCollapsed ? 'justify-center px-2' : 'px-3'} py-2.5 rounded-lg text-sm transition-colors group relative ${activeClass}"
            >
              <i data-lucide="${item.icon}" class="w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-800'}"></i>
              ${
                !isCollapsed
                  ? `
                <span class="ml-3 truncate text-left flex-1">${item.label}</span>
                ${
                  item.badge
                    ? `
                  <span class="ml-auto text-[11px] px-2 py-0.5 rounded-full font-medium ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : item.badgeColor
                      ? `${item.badgeColor} text-white`
                      : 'bg-slate-100 text-slate-700 border border-slate-200'
                  }">
                    ${item.badge}
                  </span>
                `
                    : ''
                }
              `
                  : ''
              }
            </button>
          `;
          })
          .join('')}
      </div>

      <!-- Collapse Toggle Button & Session Status Footer -->
      <div class="p-3 border-t border-slate-200 bg-slate-50/50">
        <div class="flex items-center ${isCollapsed ? 'flex-col gap-2' : 'justify-between'}">
          ${
            !isCollapsed
              ? `
            <div class="flex items-center space-x-1.5 text-xs text-slate-600">
              <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span class="font-medium capitalize text-slate-700">${user.role} Portal</span>
              <span class="text-[10px] text-slate-400 font-mono">v2.4</span>
            </div>
          `
              : `
            <div class="w-7 h-7 rounded bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200" title="Active Session: ${user.role}">
              <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
            </div>
          `
          }

          <button
            onclick="window.appToggleSidebar()"
            class="p-1.5 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition"
            title="${isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}"
          >
            <i data-lucide="${isCollapsed ? 'chevron-right' : 'chevron-left'}" class="w-4 h-4"></i>
          </button>
        </div>
      </div>
    </aside>
  `;
}
