// SJCEM NEXT MIS Top Navigation Bar Component
import { misStore } from '../../services/store.js';

export function renderNavbar(currentRoute, _onOpenSearch, _onOpenNotifications, _onOpenRoleSwitcher) {
  const user = misStore.getCurrentUser();
  const unreadCount = misStore.getUnreadNotificationCount();

  const routeTitles = {
    overview: 'Student Dashboard',
    profile: 'My Profile & Records',
    attendance: 'Attendance Management',
    timetable: 'Weekly Timetable & Schedule',
    marks: 'Internal Assessment Marks',
    results: 'Semester Results & Transcripts',
    analytics: 'Academic Analytics & Trends',
    notices: 'Notices, Circulars & Announcements',
    resources: 'Study Resources & Lab Manuals',
    projects: 'Academic Project Workspace',
    certificates: 'Certificate Request Services',
    requests: 'Unified Request Tracking',
    assistant: 'SJCEM Campus AI Assistant',
    help: 'Help, Support & Campus Directory',
    settings: 'Account & Institutional Settings',
    'faculty-workspace': 'Faculty Academic Workspace',
    'attendance-entry': 'Class Attendance Recording',
    'marks-entry': 'Internal Assessment Marks Entry',
    'student-lookup': 'Student Data Lookup',
    'admin-workspace': 'Institutional Administration Console',
    'admin-certificates': 'Student Certificate Approvals',
    'admin-audit': 'System Audit Logs & Security Trails',
    'admin-schema': 'Relational Database Schema & RLS',
  };

  const title = routeTitles[currentRoute] || 'Academic Information System';

  if (!user) {
    return `
      <header class="h-20 bg-white border-b border-slate-200 px-4 md:px-6 flex items-center justify-between sticky top-0 z-20">
        <div class="flex items-center space-x-3">
          <img src="public/assets/aldel-logo.png" alt="ALDEL Logo" class="h-8 w-auto object-contain" />
          <span class="text-xs text-slate-400 font-medium">SJCEM Student MIS</span>
        </div>
      </header>
    `;
  }

  const roleLabel = user.role === 'admin' ? 'Administrator' : user.role === 'faculty' ? 'Faculty' : 'Student';
  const rolePortalLabel = user.role === 'admin' ? 'Administration' : user.role === 'faculty' ? 'Faculty Staff' : 'Student Portal';
  const roleIdBadge = user.role === 'admin'
    ? (user.adminId || user.employeeId || user.institutional_id || 'Profile information unavailable')
    : user.role === 'faculty'
    ? (user.facultyId || user.employeeId || user.institutional_id || 'Profile information unavailable')
    : (user.studentId || user.rollNumber || user.institutional_id || 'Profile information unavailable');

  return `
    <header class="h-16 md:h-20 bg-white border-b border-slate-200 px-3 sm:px-4 md:px-6 flex items-center justify-between sticky top-0 z-20 transition-all">
      <!-- Left: Mobile Menu Toggle, Brand Logo & Breadcrumb / Title -->
      <div class="flex items-center space-x-2 sm:space-x-3 min-w-0">
        <button
          onclick="window.appToggleMobileSidebar()"
          class="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 focus:outline-none touch-target-min"
          title="Open menu"
          aria-label="Open navigation menu"
        >
          <i data-lucide="menu" class="w-5 h-5"></i>
        </button>

        <img
          src="public/assets/aldel-logo.png"
          alt="ALDEL Education Trust"
          class="h-7 sm:h-8 w-auto object-contain md:hidden flex-shrink-0"
        />

        <div class="flex flex-col min-w-0">
          <div class="hidden sm:flex items-center text-xs text-slate-400 space-x-1.5 font-medium">
            <span>SJCEM Palghar</span>
            <span>/</span>
            <span class="text-slate-600 font-semibold">${rolePortalLabel}</span>
            <span>/</span>
            <span class="text-[#073B70] font-semibold">${title}</span>
          </div>
          <h1 class="text-sm xs:text-base md:text-xl font-bold text-slate-800 tracking-tight leading-tight truncate max-w-[130px] xs:max-w-[200px] sm:max-w-none">
            ${title}
          </h1>
        </div>
      </div>

      <!-- Right: Global Search, Term Badge, Notifications, Profile Menu -->
      <div class="flex items-center space-x-1.5 sm:space-x-2.5 md:space-x-3 flex-shrink-0">
        <!-- Global Search Button -->
        <button
          onclick="window.appOpenSearch()"
          class="flex items-center space-x-2 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 border border-[#DCE4EE] p-2 sm:px-3 sm:py-1.5 rounded-lg text-xs md:text-sm font-medium transition cursor-pointer"
          title="Global Search (Ctrl+K)"
          aria-label="Search"
        >
          <i data-lucide="search" class="w-4 h-4"></i>
          <span class="hidden lg:inline text-slate-400">Search notices, timetable, files...</span>
          <span class="hidden sm:inline-block ml-2 text-[10px] bg-white border border-[#DCE4EE] px-1.5 py-0.5 rounded text-slate-400 font-mono">⌘K</span>
        </button>

        <!-- Academic Term Pill -->
        <div class="hidden xl:flex items-center gap-1.5 text-xs bg-[#F0F4FA] text-[#073B70] border border-[#DCE4EE] px-2.5 py-1.5 rounded-lg font-medium">
          <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>AY 2025–26 (${user.role === 'student' ? 'Sem VI' : user.role === 'faculty' ? 'Faculty Staff' : 'Administration'})</span>
        </div>

        <!-- Verified Role Pill (Canonical Server Enforced) -->
        <div class="hidden sm:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border ${
          user.role === 'admin'
            ? 'bg-purple-50 text-purple-800 border-purple-200'
            : user.role === 'faculty'
            ? 'bg-blue-50 text-blue-800 border-blue-200'
            : 'bg-[#F0F4FA] text-[#073B70] border-[#DCE4EE]'
        }">
          <i data-lucide="${user.role === 'admin' ? 'shield-check' : user.role === 'faculty' ? 'briefcase' : 'graduation-cap'}" class="w-3.5 h-3.5"></i>
          <span>${roleLabel}</span>
        </div>

        <!-- Scan Digital ID Button -->
        <button
          onclick="window.appOpenQrScanner()"
          class="hidden xs:flex items-center space-x-1.5 p-2 sm:px-2.5 sm:py-1.5 rounded-lg text-xs font-semibold bg-[#F0F4FA] hover:bg-[#DCE4EE] text-[#073B70] border border-[#DCE4EE] transition shadow-sm"
          title="Scan Student or Faculty Digital ID"
          aria-label="Scan Digital ID"
        >
          <i data-lucide="scan-line" class="w-4 h-4 text-[#073B70]"></i>
          <span class="hidden md:inline">Scan Digital ID</span>
        </button>

        <!-- Notification Bell -->
        <div class="relative">
          <button
            id="btn-notifications-trigger"
            onclick="window.appToggleNotifications()"
            class="relative p-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition focus:outline-none touch-target-min"
            title="Notifications"
            aria-label="Notifications"
          >
            <i data-lucide="bell" class="w-5 h-5"></i>
            ${
              unreadCount > 0
                ? `
              <span class="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#C62828] text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
                ${unreadCount}
              </span>
            `
                : ''
            }
          </button>
        </div>

        <!-- User Profile Dropdown Trigger -->
        <div class="relative">
          <button
            onclick="window.appToggleProfileMenu()"
            class="flex items-center space-x-1.5 sm:space-x-2 p-1 sm:pl-2 rounded-lg hover:bg-slate-100 border border-transparent hover:border-slate-200 transition focus:outline-none cursor-pointer"
            aria-label="User profile menu"
          >
            <img
              src="${user.avatarUrl}"
              alt="${user.firstName}"
              class="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border border-slate-300 flex-shrink-0"
              onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(user.firstName + ' ' + user.lastName)}&background=${user.role === 'admin' ? '581c87' : user.role === 'faculty' ? '073B70' : '073B70'}&color=fff'"
            />
            <div class="hidden md:flex flex-col text-left">
              <span class="text-xs font-bold text-slate-800 leading-tight truncate max-w-[140px]">
                ${user.firstName} ${user.lastName}
              </span>
              <span class="text-[10px] text-slate-500 truncate max-w-[140px] font-mono">
                ${roleIdBadge}
              </span>
            </div>
            <i data-lucide="chevron-down" class="w-3.5 h-3.5 text-slate-400"></i>
          </button>

          <!-- Standard User Profile Dropdown Menu (Guaranteed Viewport Bound) -->
          <div
            id="profile-dropdown-menu"
            style="display:none;"
            class="absolute right-0 mt-2 w-72 max-w-[calc(100vw-1.5rem)] bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-fade-in"
          >
            <div class="px-4 py-3 border-b border-slate-100 bg-slate-50/80 rounded-t-xl">
              <div class="flex items-center space-x-3">
                <img
                  src="${user.avatarUrl}"
                  alt="${user.firstName}"
                  class="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm flex-shrink-0"
                  onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(user.firstName + ' ' + user.lastName)}&background=${user.role === 'admin' ? '581c87' : user.role === 'faculty' ? '073B70' : '073B70'}&color=fff'"
                />
                <div class="overflow-hidden">
                  <p class="text-xs font-bold text-slate-900 truncate">${user.firstName} ${user.lastName}</p>
                  <p class="text-[11px] text-slate-500 font-mono truncate">${user.email}</p>
                  <p class="text-[10px] text-slate-600 font-mono font-medium truncate mt-0.5">ID: <span class="font-bold text-slate-800">${roleIdBadge}</span></p>
                  <div class="mt-1 flex items-center gap-1 text-[10px] font-bold ${
                    user.role === 'admin'
                      ? 'text-purple-800 bg-purple-100 border border-purple-200'
                      : user.role === 'faculty'
                      ? 'text-blue-800 bg-blue-100 border border-blue-200'
                      : 'text-[#073B70] bg-[#F0F4FA] border border-[#DCE4EE]'
                  } px-2 py-0.5 rounded w-fit">
                    <span class="w-1.5 h-1.5 rounded-full ${
                      user.role === 'admin' ? 'bg-purple-600' : user.role === 'faculty' ? 'bg-blue-600' : 'bg-[#073B70]'
                    }"></span>
                    <span>Verified: ${roleLabel.toUpperCase()}</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="py-1">
              <button
                onclick="window.appNavigate('profile'); window.appToggleProfileMenu(false);"
                class="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center space-x-2"
              >
                <i data-lucide="user" class="w-3.5 h-3.5 text-slate-400"></i>
                <span>${user.role === 'admin' ? 'Admin Profile & Security Pass' : user.role === 'faculty' ? 'Faculty Profile & Pass' : 'My Profile & Digital ID'}</span>
              </button>

              ${
                user.role === 'faculty'
                  ? `
                <button
                  onclick="window.appNavigate('faculty-workspace'); window.appToggleProfileMenu(false);"
                  class="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center space-x-2"
                >
                  <i data-lucide="layout-dashboard" class="w-3.5 h-3.5 text-slate-400"></i>
                  <span>Faculty Academic Workspace</span>
                </button>
              `
                  : user.role === 'admin'
                  ? `
                <button
                  onclick="window.appNavigate('admin-workspace'); window.appToggleProfileMenu(false);"
                  class="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center space-x-2"
                >
                  <i data-lucide="shield-check" class="w-3.5 h-3.5 text-slate-400"></i>
                  <span>Administration Console</span>
                </button>
                <button
                  onclick="window.appNavigate('admin-audit'); window.appToggleProfileMenu(false);"
                  class="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center space-x-2"
                >
                  <i data-lucide="list" class="w-3.5 h-3.5 text-slate-400"></i>
                  <span>System Audit Trails</span>
                </button>
              `
                  : ''
              }

              <button
                onclick="window.appNavigate('settings'); window.appToggleProfileMenu(false);"
                class="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center space-x-2"
              >
                <i data-lucide="settings" class="w-3.5 h-3.5 text-slate-400"></i>
                <span>Account & Institutional Settings</span>
              </button>

              <button
                onclick="window.appNavigate('help'); window.appToggleProfileMenu(false);"
                class="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center space-x-2"
              >
                <i data-lucide="help-circle" class="w-3.5 h-3.5 text-slate-400"></i>
                <span>Help & Directory</span>
              </button>
            </div>

            <div class="border-t border-slate-100 pt-1">
              <button
                onclick="window.appLogout()"
                class="w-full text-left px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center space-x-2 font-medium cursor-pointer"
              >
                <i data-lucide="log-out" class="w-3.5 h-3.5"></i>
                <span>Sign Out of Portal</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  `;
}
