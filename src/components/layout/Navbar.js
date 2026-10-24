// SJCEM NEXT MIS Top Navigation Bar Component
import { misStore } from '../../services/store.js';

export function renderNavbar(currentRoute, onOpenSearch, onOpenNotifications, onOpenRoleSwitcher) {
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
    'admin-workspace': 'Institutional Administration Console',
    'admin-certificates': 'Student Certificate Approvals',
    'admin-audit': 'System Audit Logs & Security Trails',
    'admin-schema': 'Relational Database Schema & RLS',
  };

  const title = routeTitles[currentRoute] || 'Academic Information System';

  return `
    <header class="h-20 bg-white border-b border-slate-200 px-4 md:px-6 flex items-center justify-between sticky top-0 z-20">
      <!-- Left: Mobile Menu Toggle, Brand Logo & Breadcrumb / Title -->
      <div class="flex items-center space-x-3">
        <button
          onclick="window.appToggleMobileSidebar()"
          class="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 focus:outline-none"
          title="Open menu"
        >
          <i data-lucide="menu" class="w-5 h-5"></i>
        </button>

        <img
          src="public/assets/aldel-logo.png"
          alt="ALDEL Education Trust"
          class="h-8 w-auto object-contain md:hidden flex-shrink-0"
        />

        <div class="flex flex-col">
          <div class="hidden sm:flex items-center text-xs text-slate-400 space-x-1.5 font-medium">
            <span>SJCEM Palghar</span>
            <span>/</span>
            <span class="capitalize text-slate-600">${user.role}</span>
            <span>/</span>
            <span class="text-teal-700 font-semibold">${title}</span>
          </div>
          <h1 class="text-lg md:text-xl font-bold text-slate-800 tracking-tight leading-tight">
            ${title}
          </h1>
        </div>
      </div>

      <!-- Right: Global Search, Term Badge, Notifications, Profile Menu -->
      <div class="flex items-center space-x-2.5 md:space-x-3">
        <!-- Global Search Button -->
        <button
          onclick="window.appOpenSearch()"
          class="flex items-center space-x-2 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 border border-slate-200 px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium transition cursor-pointer"
          title="Global Search (Ctrl+K)"
        >
          <i data-lucide="search" class="w-4 h-4"></i>
          <span class="hidden lg:inline text-slate-400">Search notices, timetable, files...</span>
          <span class="hidden sm:inline-block ml-2 text-[10px] bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-400 font-mono">⌘K</span>
        </button>

        <!-- Academic Term Pill -->
        <div class="hidden xl:flex items-center gap-1.5 text-xs bg-slate-100 text-slate-700 border border-slate-200 px-2.5 py-1.5 rounded-lg font-medium">
          <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>AY 2025–26 (Sem VI)</span>
        </div>

        <!-- Verified Role Pill (Non-switchable) -->
        <div class="hidden sm:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border ${
          user.role === 'admin'
            ? 'bg-purple-50 text-purple-800 border-purple-200'
            : user.role === 'faculty'
            ? 'bg-blue-50 text-blue-800 border-blue-200'
            : 'bg-teal-50 text-teal-800 border-teal-200'
        }">
          <i data-lucide="${user.role === 'admin' ? 'shield-check' : user.role === 'faculty' ? 'briefcase' : 'graduation-cap'}" class="w-3.5 h-3.5"></i>
          <span class="capitalize">${user.role}</span>
        </div>

        <!-- Scan Digital ID Button -->
        <button
          onclick="window.appOpenQrScanner()"
          class="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 transition shadow-sm"
          title="Scan Student or Faculty Digital ID"
        >
          <i data-lucide="scan-line" class="w-4 h-4 text-teal-800"></i>
          <span class="hidden md:inline">Scan Digital ID</span>
        </button>

        <!-- Notification Bell -->
        <div class="relative">
          <button
            id="btn-notifications-trigger"
            onclick="window.appToggleNotifications()"
            class="relative p-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition focus:outline-none"
            title="Notifications"
          >
            <i data-lucide="bell" class="w-5 h-5"></i>
            ${
              unreadCount > 0
                ? `
              <span class="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
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
            class="flex items-center space-x-2 p-1 pl-2 rounded-lg hover:bg-slate-100 border border-transparent hover:border-slate-200 transition focus:outline-none"
          >
            <img
              src="${user.avatarUrl}"
              alt="${user.firstName}"
              class="w-8 h-8 rounded-full object-cover border border-slate-300 flex-shrink-0"
              onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(user.firstName + ' ' + user.lastName)}&background=247F73&color=fff'"
            />
            <div class="hidden md:flex flex-col text-left">
              <span class="text-xs font-bold text-slate-800 leading-tight truncate max-w-[120px]">
                ${user.firstName} ${user.lastName}
              </span>
              <span class="text-[10px] text-slate-400 capitalize truncate max-w-[120px]">
                ${user.role === 'student' ? user.rollNumber || 'Student' : user.designation || user.role}
              </span>
            </div>
            <i data-lucide="chevron-down" class="w-3.5 h-3.5 text-slate-400"></i>
          </button>

          <!-- Standard User Profile Dropdown Menu -->
          <div
            id="profile-dropdown-menu"
            style="display:none;"
            class="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50 animate-fade-in"
          >
            <div class="px-4 py-2 border-b border-slate-100">
              <p class="text-xs font-bold text-slate-800">${user.firstName} ${user.lastName}</p>
              <p class="text-[11px] text-slate-500 truncate">${user.email}</p>
              <div class="mt-1 flex items-center gap-1 text-[10px] text-teal-800 bg-teal-50 px-2 py-0.5 rounded font-medium border border-teal-200 w-fit">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>Verified: ${user.role.toUpperCase()}</span>
              </div>
            </div>

            <div class="py-1">
              <button
                onclick="window.appNavigate('profile'); window.appToggleProfileMenu(false);"
                class="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center space-x-2"
              >
                <i data-lucide="user" class="w-3.5 h-3.5 text-slate-400"></i>
                <span>My Profile & Digital ID</span>
              </button>

              <button
                onclick="window.appNavigate('settings'); window.appToggleProfileMenu(false);"
                class="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center space-x-2"
              >
                <i data-lucide="settings" class="w-3.5 h-3.5 text-slate-400"></i>
                <span>Account Settings</span>
              </button>

              <button
                onclick="window.appNavigate('settings'); window.appToggleProfileMenu(false);"
                class="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center space-x-2"
              >
                <i data-lucide="shield" class="w-3.5 h-3.5 text-slate-400"></i>
                <span>Security Settings & 2FA</span>
              </button>

              <button
                onclick="window.appNavigate('help'); window.appToggleProfileMenu(false);"
                class="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center space-x-2"
              >
                <i data-lucide="help-circle" class="w-3.5 h-3.5 text-slate-400"></i>
                <span>Help & Support</span>
              </button>
            </div>

            <div class="border-t border-slate-100 pt-1">
              <button
                onclick="window.appLogout()"
                class="w-full text-left px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center space-x-2 font-medium"
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
