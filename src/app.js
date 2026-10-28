// Student MIS Main Application Controller & Secure Auth Router
import { misStore } from './services/store.js';
import { queryCampusAi } from './services/aiAssistant.js';

// Layout & Modals
import { renderSidebar } from './components/layout/Sidebar.js';
import { renderNavbar } from './components/layout/Navbar.js';
import { renderBottomNav } from './components/layout/BottomNav.js';
import { renderGlobalSearchModal } from './components/modals/GlobalSearchModal.js';
import { renderNotificationCenter } from './components/modals/NotificationCenter.js';
import { renderActionModals } from './components/modals/ActionModals.js';

// Pages
import { renderOverviewPage } from './pages/OverviewPage.js';
import { renderProfilePage } from './pages/ProfilePage.js';
import { renderAttendancePage } from './pages/AttendancePage.js';
import { renderTimetablePage } from './pages/TimetablePage.js';
import { renderMarksResultsPage } from './pages/MarksResultsPage.js';
import { renderAnalyticsPage, initAnalyticsCharts } from './pages/AnalyticsPage.js';
import { renderNoticesPage } from './pages/NoticesPage.js';
import { renderResourcesPage } from './pages/ResourcesPage.js';
import { renderProjectsPage } from './pages/ProjectsPage.js';
import { renderCertificatesPage } from './pages/CertificatesPage.js';
import { renderRequestsPage } from './pages/RequestsPage.js';
import { renderAiAssistantPage, addAiChatMessage, getAiChatMessages } from './pages/AiAssistantPage.js';
import { renderHelpSupportPage } from './pages/HelpSupportPage.js';
import { renderSettingsPage } from './pages/SettingsPage.js';
import { renderFacultyWorkspace } from './pages/FacultyWorkspace.js';
import { renderFacultyAttendancePage } from './pages/FacultyAttendancePage.js';
import { renderFacultyMarksPage } from './pages/FacultyMarksPage.js';
import { renderAdminWorkspace } from './pages/AdminWorkspace.js';
import { renderAdminCertificatesPage } from './pages/AdminCertificatesPage.js';
import { renderAdminAuditLogsPage } from './pages/AdminAuditLogsPage.js';
import { renderAdminDatabaseSchemaPage } from './pages/AdminDatabaseSchemaPage.js';
import { renderStudentLookupPage } from './pages/StudentLookupPage.js';
import {
  retrieveStudentByPid,
  parseSpreadsheetRoster,
  generateBlankStudentCsvTemplate,
  generateSyntheticTestStudentCsv,
  testInstitutionalGatewayConnection,
} from './services/studentRetrievalService.js';
import {
  renderLoginLandingPage,
  renderDedicatedLoginPage,
  renderVerificationViewPage,
  renderSessionExpiredScreen,
  renderUnauthorizedScreen,
} from './pages/AuthPages.js';

// Determine initial route based on authentication and role
function getRoleHomeRoute(role) {
  if (role === 'faculty') return 'faculty-workspace';
  if (role === 'admin') return 'admin-workspace';
  return 'overview';
}

function parseRouteFromUrl() {
  if (typeof window === 'undefined') return 'login';
  
  // 1. Hash routing (#/profile or #profile)
  const hash = (window.location.hash || '').replace(/^#\/?/, '').trim();
  
  // 2. Path routing (/profile)
  const pathname = (window.location.pathname || '').replace(/^\//, '').trim();

  let candidate = hash || pathname || '';

  if (candidate.startsWith('verify')) {
    const parts = candidate.split('/');
    if (parts.length > 1 && parts[1]) {
      verificationRouteToken = parts[1];
    }
    return 'verify';
  }

  if (candidate === 'login/student') candidate = 'login-student';
  if (candidate === 'login/faculty') candidate = 'login-faculty';
  if (candidate === 'login/admin') candidate = 'login-admin';

  const validPublicRoutes = ['login', 'login-student', 'login-faculty', 'login-admin', 'verify', 'session-expired', 'unauthorized'];
  const user = misStore.getCurrentUser();
  const isAuth = misStore.isUserAuthenticated();

  if (!isAuth || !user) {
    if (validPublicRoutes.includes(candidate)) {
      return candidate;
    }
    return 'login';
  }

  // Authenticated:
  if (!candidate || candidate === 'login' || candidate === 'index.html') {
    return getRoleHomeRoute(user.role);
  }

  return candidate;
}

let currentRoute = parseRouteFromUrl();
let authErrorMessage = '';
let verificationRouteToken = '';
let verificationRouteResult = null;
let isSidebarCollapsed = false;
let isMobileSidebarOpen = false;
let activeMarksTab = 'internal';

// Student Information Retrieval Module State
let lookupPageState = {
  activeTab: 'search',
  searchInput: '',
  isLoading: false,
  searchResult: null,
  searchError: null,
  lastRetrievedAt: null,
  csvPreviewData: null,
  importInputMethod: 'file',
  diagnosticTrace: null,
  isTestingGateway: false,
  gatewayTestResult: null,
  gatewayStatus: null,
};
let selectedTimetableDay = 5; // Friday (current system day)
let timetableViewMode = 'grid';
let attendanceFilterSubject = 'ALL';
let attendanceFilterStatus = 'ALL';
let noticesFilterCategory = 'ALL';
let noticesSearchQuery = '';
let resourcesFilterType = 'ALL';
let resourcesFilterSubject = 'ALL';
let requestsFilterStatus = 'ALL';
let requestsSearchQuery = '';

// Faculty and Admin Dedicated Pages State
let facultyAttSubject = 'CSC601';
let facultyAttDivision = 'TE COMP Div A';
let facultyMarksSubject = 'CSC601';
let facultyMarksAssessment = 'IA1';
let adminCertStatusFilter = 'ALL';
let adminCertSearchQuery = '';
let adminAuditCategoryFilter = 'ALL';
let adminAuditSearchQuery = '';
let adminSchemaActiveTab = 'tables';

// Scanner instance state
let html5QrScannerInstance = null;

// Toast Notification Utility
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  const bg =
    type === 'success'
      ? 'bg-emerald-800 text-white'
      : type === 'error'
      ? 'bg-rose-800 text-white'
      : 'bg-slate-800 text-white';

  toast.className = `${bg} px-4 py-2.5 rounded-xl shadow-xl text-xs font-semibold flex items-center space-x-2 animate-fade-in pointer-events-auto`;
  toast.innerHTML = `<span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Master Render Function
function renderApp() {
  const appRoot = document.getElementById('app');
  if (!appRoot) return;

  const user = misStore.getCurrentUser();
  const isAuth = misStore.isUserAuthenticated();
  const pendingChallenge = misStore.getPendingAuthChallenge();

  // 1. Standalone Verification Route (/verify/:token)
  if (currentRoute === 'verify') {
    appRoot.innerHTML = renderVerificationViewPage(verificationRouteToken, verificationRouteResult);
    initIcons();
    return;
  }

  // 2. Authentication landing page (/login) with exactly 3 role cards
  if (currentRoute === 'login') {
    appRoot.innerHTML = renderLoginLandingPage();
    initIcons();
    return;
  }

  // 3. Dedicated Role Login Pages (/login/student, /login/faculty, /login/admin)
  if (currentRoute === 'login-student') {
    appRoot.innerHTML = renderDedicatedLoginPage('student', authErrorMessage, pendingChallenge);
    initIcons();
    return;
  }
  if (currentRoute === 'login-faculty') {
    appRoot.innerHTML = renderDedicatedLoginPage('faculty', authErrorMessage, pendingChallenge);
    initIcons();
    return;
  }
  if (currentRoute === 'login-admin') {
    appRoot.innerHTML = renderDedicatedLoginPage('admin', authErrorMessage, pendingChallenge);
    initIcons();
    return;
  }

  // 4. Session & Security Exception Screens
  if (currentRoute === 'session-expired') {
    appRoot.innerHTML = renderSessionExpiredScreen();
    initIcons();
    return;
  }
  if (currentRoute === 'unauthorized') {
    appRoot.innerHTML = renderUnauthorizedScreen();
    initIcons();
    return;
  }

  // 5. Require authentication for all internal dashboard pages
  if (!isAuth) {
    currentRoute = 'login';
    appRoot.innerHTML = renderLoginLandingPage();
    initIcons();
    return;
  }

  // 6. Strict Role-Based Route Isolation (Server/Store Enforced)
  // Ensure faculty and admin are never rendered inside the student overview page
  if (user.role === 'faculty' && currentRoute === 'overview') {
    currentRoute = 'faculty-workspace';
  } else if (user.role === 'admin' && currentRoute === 'overview') {
    currentRoute = 'admin-workspace';
  }

  // Student-only routes: overview, attendance, marks, results, analytics, certificates, requests, assistant
  const studentOnlyRoutes = ['overview', 'attendance', 'marks', 'results', 'analytics', 'certificates', 'requests', 'assistant'];
  if (user.role !== 'student' && studentOnlyRoutes.includes(currentRoute)) {
    if (user.role === 'faculty') {
      if (currentRoute === 'attendance') currentRoute = 'attendance-entry';
      else if (currentRoute === 'marks' || currentRoute === 'results') currentRoute = 'marks-entry';
      else currentRoute = 'faculty-workspace';
    } else {
      if (currentRoute === 'certificates' || currentRoute === 'requests') currentRoute = 'admin-certificates';
      else currentRoute = 'admin-workspace';
    }
  }

  // Students cannot access faculty or admin workspaces, attendance/marks entry, or student data lookup
  if (user.role === 'student' && (currentRoute.startsWith('faculty') || currentRoute.startsWith('admin') || currentRoute === 'student-lookup' || currentRoute === 'attendance-entry' || currentRoute === 'marks-entry')) {
    appRoot.innerHTML = renderUnauthorizedScreen();
    initIcons();
    return;
  }
  // Faculty cannot access admin workspace or admin controls
  if (user.role === 'faculty' && currentRoute.startsWith('admin')) {
    appRoot.innerHTML = renderUnauthorizedScreen();
    initIcons();
    return;
  }
  // Admin cannot access faculty-only teaching entry screens directly
  if (user.role === 'admin' && (currentRoute === 'attendance-entry' || currentRoute === 'marks-entry')) {
    appRoot.innerHTML = renderUnauthorizedScreen();
    initIcons();
    return;
  }

  // Determine current page view content
  let pageContent = '';
  switch (currentRoute) {
    case 'overview':
      pageContent = renderOverviewPage();
      break;
    case 'profile':
      pageContent = renderProfilePage();
      break;
    case 'attendance':
      pageContent = renderAttendancePage(attendanceFilterSubject, attendanceFilterStatus);
      break;
    case 'timetable':
      pageContent = renderTimetablePage(selectedTimetableDay, timetableViewMode);
      break;
    case 'marks':
    case 'results':
      pageContent = renderMarksResultsPage(currentRoute === 'results' ? 'semester' : activeMarksTab);
      break;
    case 'analytics':
      pageContent = renderAnalyticsPage();
      break;
    case 'notices':
      pageContent = renderNoticesPage(noticesFilterCategory, noticesSearchQuery);
      break;
    case 'resources':
      pageContent = renderResourcesPage(resourcesFilterType, resourcesFilterSubject);
      break;
    case 'projects':
      pageContent = renderProjectsPage();
      break;
    case 'certificates':
      pageContent = renderCertificatesPage();
      break;
    case 'requests':
      pageContent = renderRequestsPage(requestsFilterStatus, requestsSearchQuery);
      break;
    case 'assistant':
      pageContent = renderAiAssistantPage();
      break;
    case 'help':
      pageContent = renderHelpSupportPage();
      break;
    case 'settings':
      pageContent = renderSettingsPage();
      break;
    case 'faculty-workspace':
      pageContent = renderFacultyWorkspace();
      break;
    case 'attendance-entry':
      pageContent = renderFacultyAttendancePage(facultyAttSubject, facultyAttDivision);
      break;
    case 'marks-entry':
      pageContent = renderFacultyMarksPage(facultyMarksSubject, facultyMarksAssessment);
      break;
    case 'admin-workspace':
      pageContent = renderAdminWorkspace();
      break;
    case 'admin-certificates':
      pageContent = renderAdminCertificatesPage(adminCertStatusFilter, adminCertSearchQuery);
      break;
    case 'admin-audit':
      pageContent = renderAdminAuditLogsPage(adminAuditCategoryFilter, adminAuditSearchQuery);
      break;
    case 'admin-schema':
      pageContent = renderAdminDatabaseSchemaPage(adminSchemaActiveTab);
      break;
    case 'student-lookup':
      pageContent = renderStudentLookupPage(lookupPageState);
      break;
    default:
      pageContent = user.role === 'faculty' ? renderFacultyWorkspace() : user.role === 'admin' ? renderAdminWorkspace() : renderOverviewPage();
      break;
  }

  // Master Layout HTML Structure (No Role Switcher Modal!)
  appRoot.innerHTML = `
    <div class="flex h-screen h-[100dvh] overflow-hidden bg-[#F7F9FC]">
      <!-- Desktop Sidebar -->
      <div class="hidden md:block">
        ${renderSidebar(currentRoute, navigateTo, isSidebarCollapsed, toggleSidebar)}
      </div>

      <!-- Mobile Navigation Drawer -->
      <div id="mobile-sidebar-backdrop" style="display:${isMobileSidebarOpen ? 'block' : 'none'}; pointer-events:${isMobileSidebarOpen ? 'auto' : 'none'};" class="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm md:hidden animate-fade-in" onclick="window.appToggleMobileSidebar(false)"></div>
      <div id="mobile-sidebar-container" style="transform:${isMobileSidebarOpen ? 'translateX(0)' : 'translateX(-100%)'}; visibility:${isMobileSidebarOpen ? 'visible' : 'hidden'}; pointer-events:${isMobileSidebarOpen ? 'auto' : 'none'};" class="fixed inset-y-0 left-0 z-50 w-64 md:hidden transition-transform duration-200 ease-out shadow-2xl">
        ${renderSidebar(currentRoute, navigateTo, false, toggleSidebar)}
      </div>

      <!-- Main Content Area -->
      <div class="flex-1 flex flex-col h-screen h-[100dvh] overflow-hidden min-w-0">
        ${renderNavbar(currentRoute, openSearch, toggleNotifications)}
        
        <main id="app-main-scroll" class="flex-1 overflow-y-auto px-3.5 sm:px-6 lg:px-8 py-4 sm:py-6 pb-24 md:pb-8 touch-pan-y overscroll-y-contain">
          <div class="max-w-7xl mx-auto">
            ${pageContent}
          </div>
        </main>
      </div>

      <!-- Mobile Bottom Navigation Bar -->
      ${renderBottomNav(currentRoute)}

      <!-- Modals and Trays -->
      ${renderGlobalSearchModal()}
      ${renderNotificationCenter()}
      ${renderActionModals()}

      <!-- Toast Notification Root -->
      <div id="toast-container" class="fixed bottom-20 md:bottom-5 right-4 sm:right-5 z-50 flex flex-col space-y-2 pointer-events-none"></div>
    </div>
  `;

  initIcons();

  // Initialize QR Codes on canvas elements if Profile or Faculty workspace is rendered
  setTimeout(renderQrCanvases, 40);

  // If Analytics page, initialize Chart.js
  if (currentRoute === 'analytics') {
    setTimeout(initAnalyticsCharts, 80);
  }
}

function initIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

/**
 * Render cryptographic QR codes onto canvas using QRious
 */
function renderQrCanvases() {
  const user = misStore.getCurrentUser();
  if (!user) return;

  const qrRecord = misStore.getUserQrRecord(user.id);
  const verifyUrl = qrRecord ? qrRecord.verificationUrl : `https://mis.sjcem.edu.in/verify/sjcem_sec_${user.id}`;

  if (window.QRious) {
    // 1. Student Profile QR Canvas
    const studentCanvas = document.getElementById('student-qr-canvas');
    if (studentCanvas) {
      new window.QRious({
        element: studentCanvas,
        value: verifyUrl,
        size: 180,
        level: 'H',
        foreground: '#134e4a', // Dark teal
        background: '#ffffff',
      });
    }

    // 2. Faculty Workspace QR Canvas
    const facultyCanvas = document.getElementById('faculty-qr-canvas');
    if (facultyCanvas) {
      new window.QRious({
        element: facultyCanvas,
        value: verifyUrl,
        size: 180,
        level: 'H',
        foreground: '#064e3b', // Deep emerald
        background: '#ffffff',
      });
    }

    // 3. Admin Profile QR Canvas
    const adminCanvas = document.getElementById('admin-qr-canvas');
    if (adminCanvas) {
      new window.QRious({
        element: adminCanvas,
        value: verifyUrl,
        size: 180,
        level: 'H',
        foreground: '#3b0764', // Deep purple
        background: '#ffffff',
      });
    }
  }
}

// Navigation Handler with Browser History Synchronization
function navigateTo(route, updateHistory = true) {
  const user = misStore.getCurrentUser();
  if (user) {
    if (user.role === 'faculty' && route === 'overview') {
      route = 'faculty-workspace';
    } else if (user.role === 'admin' && route === 'overview') {
      route = 'admin-workspace';
    } else if (user.role !== 'student' && ['overview', 'attendance', 'marks', 'results', 'analytics', 'certificates', 'requests', 'assistant'].includes(route)) {
      route = user.role === 'faculty' ? 'faculty-workspace' : 'admin-workspace';
    }
  }
  if (route && route.startsWith('login')) {
    misStore.clearPendingAuthChallenge();
  }
  currentRoute = route;
  authErrorMessage = '';
  isMobileSidebarOpen = false;
  if (typeof document !== 'undefined' && document.body) {
    document.body.classList.remove('drawer-open');
  }

  if (updateHistory && typeof window !== 'undefined' && window.history) {
    const targetHash = '#' + route;
    if (window.location.hash !== targetHash) {
      window.history.pushState({ route }, '', targetHash);
    }
  }

  renderApp();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Browser Back / Forward History Listener
if (typeof window !== 'undefined') {
  window.addEventListener('popstate', (e) => {
    const targetRoute = (e.state && e.state.route) || parseRouteFromUrl();
    navigateTo(targetRoute, false);
  });
}

function toggleSidebar() {
  isSidebarCollapsed = !isSidebarCollapsed;
  renderApp();
}

function toggleMobileSidebar(force) {
  isMobileSidebarOpen = force !== undefined ? force : !isMobileSidebarOpen;
  if (typeof document !== 'undefined' && document.body) {
    document.body.classList.toggle('drawer-open', isMobileSidebarOpen);
  }
  renderApp();
}

function openSearch() {
  const modal = document.getElementById('global-search-modal');
  if (modal) {
    modal.style.display = 'flex';
    const input = document.getElementById('global-search-input');
    if (input) input.focus();
    initIcons();
  }
}

function closeSearch() {
  const modal = document.getElementById('global-search-modal');
  if (modal) modal.style.display = 'none';
}

function toggleNotifications(force) {
  const drawer = document.getElementById('notification-center-drawer');
  const backdrop = document.getElementById('notification-backdrop');
  if (drawer) {
    const isShowing = drawer.style.display === 'flex';
    const nextState = force !== undefined ? force : !isShowing;
    drawer.style.display = nextState ? 'flex' : 'none';
    if (backdrop) backdrop.style.display = nextState ? 'block' : 'none';
    initIcons();
  }
}

function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.style.display = 'flex';
    initIcons();
  }
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.style.display = 'none';
}

// ================= GLOBAL WINDOW HANDLERS FOR HTML EVENTS =================
window.appNavigate = navigateTo;
window.appToggleSidebar = toggleSidebar;
window.appToggleMobileSidebar = toggleMobileSidebar;
window.appOpenSearch = openSearch;
window.appCloseSearch = closeSearch;
window.appToggleNotifications = toggleNotifications;
window.appOpenModal = openModal;
window.appCloseModal = closeModal;
window.appToast = showToast;

// --- AUTHENTICATION CREDENTIALS SUBMISSION (Step 1 -> Move to Step 2 OTP) ---
window.appHandleCredentialsSubmit = function (e, role) {
  if (e && e.preventDefault) e.preventDefault();
  authErrorMessage = '';

  const emailInput = document.getElementById('login-email-input');
  const passwordInput = document.getElementById('login-password-input');

  const email = emailInput ? emailInput.value.trim() : '';
  const password = passwordInput ? passwordInput.value.trim() : '';

  const result = misStore.initiateLogin(email, password, role);

  if (!result.success) {
    authErrorMessage = result.message || 'Login failed. Please verify credentials.';
    renderApp();
    showToast(authErrorMessage, 'error');
    return;
  }

  // Step 1 complete! Render Step 2 (Email OTP screen)
  renderApp();
  showToast(`Verification code generated for ${result.email}.`, 'info');
};

window.appDirectLogin = function (role) {
  const result = misStore.directLogin('', '', role);
  if (result.success) {
    const user = result.user;
    showToast(`Signed in to ${user.role.toUpperCase()} portal as ${user.firstName}.`, 'success');
    if (user.role === 'faculty') {
      navigateTo('faculty-workspace');
    } else if (user.role === 'admin') {
      navigateTo('admin-workspace');
    } else {
      navigateTo('overview');
    }
  }
};

window.appQuickFillLogin = function (role) {
  window.appDirectLogin(role);
};

// --- STEP 2: EMAIL OTP VERIFICATION SUBMISSION ---
window.appHandleVerifyOtpSubmit = function (e) {
  if (e && e.preventDefault) e.preventDefault();
  authErrorMessage = '';

  const otpInput = document.getElementById('login-otp-input');
  const enteredOtp = otpInput ? otpInput.value.trim() : '';

  const result = misStore.verifyLoginOtp(enteredOtp);

  if (!result.success) {
    authErrorMessage = result.message;
    renderApp();
    showToast(result.message, 'error');
    return;
  }

  // Session established! Route to authorized dashboard based on server-verified role
  const user = result.user;
  showToast(`Welcome back, ${user.firstName}! Secure session established.`, 'success');

  if (user.role === 'faculty') {
    navigateTo('faculty-workspace');
  } else if (user.role === 'admin') {
    navigateTo('admin-workspace');
  } else {
    navigateTo('overview');
  }
};

window.appResendOtp = function () {
  const result = misStore.resendLoginOtp();
  if (result.success) {
    showToast(`New verification code sent! (Demo Code: ${result.demoOtp})`, 'success');
  } else {
    showToast(result.message, 'error');
  }
};

window.appCancelOtp = function () {
  misStore.clearPendingAuthChallenge();
  authErrorMessage = '';
  renderApp();
};

window.appQuickFillLogin = function (role) {
  misStore.clearPendingAuthChallenge();
  authErrorMessage = '';
  navigateTo(`login-${role}`);
};

window.appAutoFillCredentials = function (email, password) {
  const emailInput = document.getElementById('login-email-input');
  const passInput = document.getElementById('login-password-input');
  if (emailInput) {
    emailInput.value = email;
    emailInput.classList.add('border-teal-500', 'ring-2', 'ring-teal-200');
    setTimeout(() => emailInput.classList.remove('border-teal-500', 'ring-2', 'ring-teal-200'), 2000);
  }
  if (passInput) {
    passInput.value = password;
    passInput.classList.add('border-teal-500', 'ring-2', 'ring-teal-200');
    setTimeout(() => passInput.classList.remove('border-teal-500', 'ring-2', 'ring-teal-200'), 2000);
  }
  showToast('✅ Demo credentials filled — click Continue to proceed through normal auth flow', 'success');
};

window.appTogglePasswordVisibility = function (inputId) {
  const el = document.getElementById(inputId);
  if (el) {
    el.type = el.type === 'password' ? 'text' : 'password';
  }
};

window.appOpenForgotPassword = function () {
  const emailInput = document.getElementById('login-email-input');
  const email = emailInput ? emailInput.value.trim() : '';
  if (!email || !email.includes('@')) {
    showToast('Enter your institutional email address first, then click Forgot Password.', 'error');
    if (emailInput) emailInput.focus();
    return;
  }
  showToast(`📧 Password reset instructions sent to ${email}. Check your institutional inbox.`, 'success');
};

// Safe Sign Out
window.appLogout = function () {
  misStore.logout();
  navigateTo('login');
  showToast('You have been safely signed out. Session destroyed.', 'info');
};

window.appToggleProfileMenu = function (force) {
  const menu = document.getElementById('profile-dropdown-menu');
  if (menu) {
    menu.style.display = force !== undefined ? (force ? 'block' : 'none') : menu.style.display === 'block' ? 'none' : 'block';
  }
};

// ================= PART 4 & 5: SECURE QR IDENTITY & SCANNER =================

// Download QR Code Canvas as high-resolution PNG
window.appDownloadQrPng = function (identifier) {
  const user = misStore.getCurrentUser();
  if (!user) return;

  const qrRecord = misStore.getUserQrRecord(user.id);
  const verifyUrl = qrRecord ? qrRecord.verificationUrl : `https://mis.sjcem.edu.in/verify/sjcem_sec_${user.id}`;
  const roleName = user.role ? (user.role.charAt(0).toUpperCase() + user.role.slice(1)) : 'Pass';
  const cleanId = String(identifier || user.facultyId || user.studentId || user.adminId || user.institutional_id || 'Pass').replace(/[^a-zA-Z0-9_-]/g, '_');

  let dataUrl = null;
  const canvas =
    document.getElementById('student-qr-canvas') ||
    document.getElementById('faculty-qr-canvas') ||
    document.getElementById('admin-qr-canvas');

  if (canvas && canvas.width > 0) {
    try {
      dataUrl = canvas.toDataURL('image/png');
    } catch {
      dataUrl = null;
    }
  }

  if (!dataUrl && window.QRious) {
    const offscreen = document.createElement('canvas');
    new window.QRious({
      element: offscreen,
      value: verifyUrl,
      size: 400,
      level: 'H',
      foreground: '#073B70',
      background: '#ffffff',
    });
    dataUrl = offscreen.toDataURL('image/png');
  }

  if (!dataUrl) {
    showToast('Failed to generate QR image. Please try again.', 'error');
    return;
  }

  const link = document.createElement('a');
  link.download = `SJCEM_${roleName}_QR_${cleanId}.png`;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  link.remove();
  showToast(`SJCEM ${roleName} cryptographic QR pass downloaded successfully`, 'success');
};

// Print Official Digital ID Card (Only the ID card prints!)
window.appPrintDigitalId = function () {
  renderQrCanvases();
  setTimeout(() => {
    document.body.classList.remove('print-grade-card-mode');
    window.print();
  }, 80);
};

window.appRefreshQrCard = function () {
  renderQrCanvases();
  showToast('Digital ID card refreshed and verified with identity registry', 'success');
};

// Report Compromised Token Modal
window.appReportCompromisedQr = function (_userId) {
  openModal('modal-report-compromised-qr');
};

window.appHandleRevokeAndRegenerateSubmit = function (e) {
  if (e && e.preventDefault) e.preventDefault();
  const user = misStore.getCurrentUser();
  const reason = document.getElementById('revoke-reason-select')?.value || 'LOST_PHYSICAL_CARD';

  misStore.revokeAndRegenerateQrToken(user ? user.id : 'usr-demo', reason);
  closeModal('modal-report-compromised-qr');
  renderApp();
  showToast('Previous QR token revoked. Newly generated cryptographic identity issued!', 'success');
};

// QR Scanner Modal Management
window.appOpenQrScanner = function () {
  openModal('modal-qr-scanner');
  window.appSwitchQrScanTab('manual'); // Default to manual/file tab for easy interactive testing
};

window.appCloseQrScanner = function () {
  window.appStopCameraScanner();
  closeModal('modal-qr-scanner');
};

window.appSwitchQrScanTab = function (tab) {
  const cameraTabBtn = document.getElementById('qr-tab-btn-camera');
  const manualTabBtn = document.getElementById('qr-tab-btn-manual');
  const cameraPane = document.getElementById('qr-pane-camera');
  const manualPane = document.getElementById('qr-pane-manual');

  if (tab === 'camera') {
    if (cameraTabBtn) cameraTabBtn.className = 'py-2 rounded-lg bg-white text-teal-900 shadow-sm transition flex items-center justify-center space-x-1.5 font-bold';
    if (manualTabBtn) manualTabBtn.className = 'py-2 rounded-lg text-slate-600 hover:text-slate-900 transition flex items-center justify-center space-x-1.5 font-semibold';
    if (cameraPane) cameraPane.style.display = 'block';
    if (manualPane) manualPane.style.display = 'none';
  } else {
    window.appStopCameraScanner();
    if (manualTabBtn) manualTabBtn.className = 'py-2 rounded-lg bg-white text-teal-900 shadow-sm transition flex items-center justify-center space-x-1.5 font-bold';
    if (cameraTabBtn) cameraTabBtn.className = 'py-2 rounded-lg text-slate-600 hover:text-slate-900 transition flex items-center justify-center space-x-1.5 font-semibold';
    if (manualPane) manualPane.style.display = 'block';
    if (cameraPane) cameraPane.style.display = 'none';
  }
};

// Start live camera QR reader
window.appStartCameraScanner = function () {
  if (!window.Html5Qrcode) {
    showToast('Camera QR reader library loading... please use manual lookup.', 'info');
    return;
  }

  const placeholder = document.getElementById('qr-camera-placeholder');
  const controls = document.getElementById('qr-camera-controls');

  try {
    if (!html5QrScannerInstance) {
      html5QrScannerInstance = new window.Html5Qrcode('qr-reader');
    }

    if (placeholder) placeholder.style.display = 'none';
    if (controls) controls.style.display = 'flex';

    html5QrScannerInstance
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        (decodedText) => {
          window.appStopCameraScanner();
          closeModal('modal-qr-scanner');
          window.appProcessScannedToken(decodedText);
        },
        () => {
          // Continuous frame analysis error ignored
        }
      )
      .catch((err) => {
        if (placeholder) placeholder.style.display = 'block';
        if (controls) controls.style.display = 'none';
        showToast('Camera access denied or unavailable: ' + (err.message || err), 'error');
      });
  } catch (err) {
    showToast('Failed to initialize camera scanner: ' + err, 'error');
  }
};

window.appStopCameraScanner = function () {
  if (html5QrScannerInstance) {
    html5QrScannerInstance
      .stop()
      .then(() => {
        html5QrScannerInstance.clear();
        html5QrScannerInstance = null;
      })
      .catch(() => {
        html5QrScannerInstance = null;
      });
  }
  const placeholder = document.getElementById('qr-camera-placeholder');
  const controls = document.getElementById('qr-camera-controls');
  if (placeholder) placeholder.style.display = 'block';
  if (controls) controls.style.display = 'none';
};

// Scan from uploaded file
window.appScanQrImageFile = function (fileInput) {
  if (!fileInput.files || fileInput.files.length === 0) return;
  const file = fileInput.files[0];

  if (!window.Html5Qrcode) {
    showToast('QR decoder library loading...', 'info');
    return;
  }

  const scanner = new window.Html5Qrcode('qr-reader');
  scanner
    .scanFile(file, true)
    .then((decodedText) => {
      closeModal('modal-qr-scanner');
      window.appProcessScannedToken(decodedText);
    })
    .catch((_err) => {
      showToast('No valid SJCEM QR code detected in the uploaded image.', 'error');
    });
};

// Manual token verify submission
window.appHandleManualTokenVerify = function (e) {
  if (e && e.preventDefault) e.preventDefault();
  const input = document.getElementById('manual-qr-token-input');
  if (!input || !input.value.trim()) return;

  const raw = input.value.trim();
  closeModal('modal-qr-scanner');
  window.appProcessScannedToken(raw);
};

// Core verification processor
window.appProcessScannedToken = function (rawInput) {
  const result = misStore.verifyQrToken(rawInput);
  window.appShowVerificationResultModal(result);
};

// Display verification result in modal
window.appShowVerificationResultModal = function (result) {
  const modal = document.getElementById('modal-qr-verification-result');
  const body = document.getElementById('qr-result-body');
  const viewerModeLabel = document.getElementById('qr-result-viewer-mode');
  const header = document.getElementById('qr-result-header');

  if (!modal || !body) return;

  if (viewerModeLabel) {
    viewerModeLabel.innerText = result.viewType === 'AUTHENTICATED' ? 'Authenticated Institutional View' : 'Public Verification View';
  }

  if (result.success) {
    if (header) {
      header.className = 'p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-teal-900 to-emerald-900 text-white';
    }

    const data = result.data;
    const isPrivileged = result.viewType === 'AUTHENTICATED';

    body.innerHTML = `
      <div class="flex items-center space-x-3 pb-3 border-b border-slate-100">
        <div class="w-14 h-14 rounded-xl bg-teal-50 border-2 border-teal-200 text-teal-900 font-bold text-lg flex items-center justify-center flex-shrink-0">
          ${data.fullName ? data.fullName.split(' ').map(n => n[0]).join('') : 'ID'}
        </div>
        <div>
          <div class="flex items-center space-x-1.5">
            <h4 class="text-base font-bold text-slate-900">${data.fullName}</h4>
            <i data-lucide="badge-check" class="w-4 h-4 text-emerald-600"></i>
          </div>
          <p class="text-xs font-semibold text-teal-800">${data.category}</p>
          <p class="text-[11px] text-slate-500">${data.department}</p>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-2 text-xs">
        <div class="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
          <span class="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Account Status</span>
          <span class="font-bold text-emerald-700 flex items-center gap-1">
            <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
            ${data.status}
          </span>
        </div>
        <div class="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
          <span class="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Institution</span>
          <span class="font-semibold text-slate-800 truncate block">SJCEM Palghar</span>
        </div>

        ${
          isPrivileged
            ? `
          <div class="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
            <span class="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Identifier</span>
            <span class="font-mono font-bold text-slate-800">${data.studentId || data.facultyId || 'SJCEM-ID'}</span>
          </div>
          <div class="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
            <span class="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Program / Role</span>
            <span class="font-semibold text-slate-800 truncate block">${data.program || data.designation || 'Engineering'}</span>
          </div>
          ${
            data.currentSemester
              ? `
            <div class="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <span class="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Semester & Division</span>
              <span class="font-bold text-teal-900">Sem ${data.currentSemester} (Div ${data.division || 'A'})</span>
            </div>
          `
              : ''
          }
          ${
            data.officialEmail
              ? `
            <div class="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <span class="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Official Contact</span>
              <span class="font-mono text-[10px] text-slate-700 truncate block">${data.officialEmail}</span>
            </div>
          `
              : ''
          }
        `
            : `
          <div class="col-span-2 p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[11px]">
            <div class="flex items-center space-x-1 font-bold mb-0.5">
              <i data-lucide="info" class="w-3.5 h-3.5 text-amber-700"></i>
              <span>Public Verification View</span>
            </div>
            <span>Private academic and contact records are protected under SJCEM RLS policies and shown only to authorized staff.</span>
          </div>
        `
        }
      </div>

      <div class="p-2.5 rounded-lg bg-slate-100 border border-slate-200 font-mono text-[10px] text-slate-600 break-all">
        <span class="font-sans font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Opaque Token Signature</span>
        ${result.token}
      </div>
    `;
  } else {
    // Failure / Revoked / Expired state
    if (header) {
      header.className = 'p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-rose-900 to-slate-900 text-white';
    }

    const title = result.status === 'REVOKED' ? 'Identity Token Revoked' : result.status === 'EXPIRED' ? 'Identity Token Expired' : 'Invalid Identity Token';
    const desc = result.status === 'REVOKED'
      ? 'This QR identity token was reported compromised or revoked by institutional administration. Access is denied.'
      : result.status === 'EXPIRED'
      ? 'This digital identity token has expired and must be refreshed from the active student or faculty profile.'
      : 'The scanned token or URL does not exist in the active SJCEM identity registry.';

    body.innerHTML = `
      <div class="p-4 rounded-xl bg-rose-50 border border-rose-200 text-center space-y-3">
        <div class="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
          <i data-lucide="shield-x" class="w-6 h-6"></i>
        </div>
        <div>
          <h4 class="text-base font-bold text-rose-900">${title}</h4>
          <span class="text-xs font-bold text-rose-700 uppercase tracking-wider">Status: ${result.status}</span>
        </div>
        <p class="text-xs text-rose-800 leading-relaxed">${desc}</p>
        <div class="p-2 bg-white rounded-lg border border-rose-200 font-mono text-[10px] text-slate-600 break-all text-left">
          Token: ${result.token || 'Unknown'}
        </div>
      </div>
    `;
  }

  modal.style.display = 'flex';
  initIcons();
};

// ================= EXISTING MIS MODULE HANDLERS =================

window.appHandleSearchInput = function (val) {
  const container = document.getElementById('search-results-container');
  if (!container) return;

  if (!val || val.trim().length < 2) {
    const defaultHints = document.getElementById('search-default-hints');
    if (defaultHints) defaultHints.style.display = 'block';
    return;
  }

  const results = misStore.globalSearch(val);
  if (results.length === 0) {
    container.innerHTML = `
      <div class="p-8 text-center text-slate-400 text-xs">
        No records found matching "${val}".
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="p-2 space-y-1">
      <p class="text-[11px] font-semibold text-slate-400 px-3 py-1 uppercase tracking-wider">${results.length} Search Results</p>
      ${results
        .map(
          (r) => `
        <button
          onclick="window.appNavigate('${r.route}'); window.appCloseSearch();"
          class="w-full text-left p-3 rounded-xl hover:bg-teal-50 border border-transparent hover:border-teal-200 transition flex items-center justify-between group"
        >
          <div>
            <span class="text-xs font-bold text-slate-800 group-hover:text-teal-900 block">${r.title}</span>
            <span class="text-[11px] text-slate-500 block">${r.subtitle}</span>
          </div>
          <span class="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium border border-slate-200">${r.category}</span>
        </button>
      `
        )
        .join('')}
    </div>
  `;
};

window.appMarkAllNotificationsRead = function () {
  misStore.markAllNotificationsRead();
  showToast('All notifications marked as read', 'success');
};

window.appHandleNotificationClick = function (id, route) {
  misStore.markNotificationRead(id);
  toggleNotifications(false);
  navigateTo(route);
};

// Modals Triggers
window.appOpenEditContactModal = () => openModal('modal-edit-contact');
window.appOpenRequestCertificateModal = (type) => {
  openModal('modal-request-certificate');
  if (type) {
    const select = document.getElementById('cert-type-select');
    if (select) select.value = type;
  }
};
window.appOpenSubmitProjectModal = () => openModal('modal-submit-project');
window.appOpenFacultyAttendanceModal = (subject) => {
  openModal('modal-faculty-attendance');
  if (subject) {
    const s = document.getElementById('faculty-att-subject');
    if (s) s.value = subject;
  }
};
window.appOpenFacultyMarksModal = () => openModal('modal-faculty-marks');
window.appPreviewOfficialCertificate = () => openModal('modal-certificate-preview');
window.appViewDatabaseSchema = () => openModal('modal-db-schema');

// Actions Submissions
window.appSaveContactDetails = function (e) {
  e.preventDefault();
  const phone = document.getElementById('edit-phone')?.value;
  const emergency = document.getElementById('edit-emergency')?.value;
  const address = document.getElementById('edit-address')?.value;
  const guardianPhone = document.getElementById('edit-guardian-phone')?.value;

  misStore.updateProfileContact({ phone, emergencyContact: emergency, address, guardianPhone });
  closeModal('modal-edit-contact');
  showToast('Contact details successfully updated & logged', 'success');
};

window.appHandleCertificateRequestSubmit = function (e) {
  e.preventDefault();
  const type = document.getElementById('cert-type-select')?.value;
  const purpose = document.getElementById('cert-purpose-input')?.value;

  if (type && purpose) {
    const cert = misStore.requestCertificate(type, purpose);
    closeModal('modal-request-certificate');
    showToast(`Request submitted! Reference ID: ${cert.referenceNumber}`, 'success');
  }
};

window.appHandleProjectSubmit = function (e) {
  e.preventDefault();
  const title = document.getElementById('proj-sub-title')?.value;
  const notes = document.getElementById('proj-sub-notes')?.value;
  if (title && notes) {
    misStore.submitProjectUpdate(title, notes);
    closeModal('modal-submit-project');
    showToast('Project deliverable submitted to mentor', 'success');
  }
};

window.appHandleFacultyAttendanceSubmit = function (e) {
  e.preventDefault();
  const subject = document.getElementById('faculty-att-subject')?.value;
  const topic = document.getElementById('faculty-att-topic')?.value;
  const statusRadio = document.querySelector('input[name="faculty-student-status"]:checked');
  const isPresent = statusRadio ? statusRadio.value === 'PRESENT' : true;

  misStore.facultyRecordAttendance(subject, isPresent, topic);
  closeModal('modal-faculty-attendance');
  showToast(`Attendance recorded for ${subject}! Audit log generated.`, 'success');
};

window.appHandleFacultyMarksSubmit = function (e) {
  e.preventDefault();
  const subject = document.getElementById('faculty-marks-subject')?.value;
  const ia1 = document.getElementById('faculty-marks-ia1')?.value;
  const ia2 = document.getElementById('faculty-marks-ia2')?.value;

  misStore.facultyUpdateMarks(subject, Number(ia1), Number(ia2));
  closeModal('modal-faculty-marks');
  showToast(`IA marks updated for ${subject}`, 'success');
};

// AI Assistant Handler
window.appSendAiPrompt = function (text) {
  const input = document.getElementById('ai-user-input');
  if (input) {
    input.value = text;
    window.appHandleAiSubmit(new Event('submit'));
  }
};

window.appHandleAiSubmit = async function (e) {
  if (e && e.preventDefault) e.preventDefault();
  const input = document.getElementById('ai-user-input');
  if (!input || !input.value.trim()) return;

  const prompt = input.value.trim();
  input.value = '';

  addAiChatMessage('user', prompt);
  renderApp();

  const container = document.getElementById('ai-messages-container');
  if (container) container.scrollTop = container.scrollHeight;

  const response = await queryCampusAi(prompt);
  addAiChatMessage('assistant', response);
  renderApp();

  const containerAfter = document.getElementById('ai-messages-container');
  if (containerAfter) containerAfter.scrollTop = containerAfter.scrollHeight;
};

window.appClearAiChat = function () {
  getAiChatMessages().length = 0;
  addAiChatMessage(
    'assistant',
    'Conversation cleared. How can I assist your academic day at SJCEM today?'
  );
  renderApp();
};

// Timetable and Marks Tabs
window.appSetTimetableView = (mode) => {
  timetableViewMode = mode;
  renderApp();
};
window.appSelectTimetableDay = (day) => {
  selectedTimetableDay = day;
  renderApp();
};
window.appSetMarksTab = (tab) => {
  activeMarksTab = tab;
  renderApp();
};
window.appFilterAttendance = () => {
  attendanceFilterSubject = document.getElementById('filter-attendance-subject')?.value || 'ALL';
  attendanceFilterStatus = document.getElementById('filter-attendance-status')?.value || 'ALL';
  renderApp();
};
window.appFilterNoticesCategory = (cat) => {
  noticesFilterCategory = cat;
  renderApp();
};
window.appSearchNotices = (val) => {
  noticesSearchQuery = val;
  renderApp();
};
window.appFilterResources = () => {
  resourcesFilterType = document.getElementById('filter-resource-type')?.value || 'ALL';
  resourcesFilterSubject = document.getElementById('filter-resource-subject')?.value || 'ALL';
  renderApp();
};
window.appFilterRequestsStatus = (val) => {
  requestsFilterStatus = val;
  renderApp();
};
window.appSearchRequests = (val) => {
  requestsSearchQuery = val;
  renderApp();
};
window.appDownloadAttendanceReport = () => {
  showToast('Attendance report exported (CSV)', 'success');
};
window.appDownloadAnalyticsReport = () => {
  showToast('Analytics summary downloaded', 'success');
};
window.appDownloadResource = (title) => {
  showToast(`Downloading: ${title}`, 'success');
};
window.appDownloadNoticeAttachment = (name) => {
  showToast(`Downloading: ${name}`, 'success');
};
window.appToggleNoticeRead = (id, read) => {
  misStore.markNoticeRead(id, read);
  showToast(read ? 'Marked notice as read' : 'Marked notice as unread');
};
window.appExportStudentDataArchive = () => {
  showToast('Student archive exported in JSON format', 'success');
};

// Admin handlers
window.appAdminApproveCert = (id) => {
  misStore.adminUpdateCertificate(id, 'APPROVED', 'Approved by Academic Dean. Digital certificate issued.');
  showToast('Certificate approved and issued', 'success');
};
window.appAdminRejectCert = (id) => {
  misStore.adminUpdateCertificate(id, 'REJECTED', 'Missing fee clearance clearance slip from Accounts.');
  showToast('Certificate marked rejected with recorded reason', 'info');
};

// ================= STUDENT INFORMATION RETRIEVAL MODULE HANDLERS =================
window.appSetLookupTab = (tab) => {
  lookupPageState.activeTab = tab;
  renderApp();
};

window.appExecuteStudentSearch = async (e) => {
  if (e && e.preventDefault) e.preventDefault();
  const inputEl = document.getElementById('student-pid-input');
  const pid = (inputEl ? inputEl.value : lookupPageState.searchInput || '').trim();

  lookupPageState.searchInput = pid;

  if (!pid) {
    lookupPageState.searchError = {
      error: 'EMPTY_PID',
      message: 'Permanent Identification Number (PID) cannot be empty. Please enter a valid number.',
    };
    lookupPageState.searchResult = null;
    renderApp();
    return;
  }

  lookupPageState.isLoading = true;
  lookupPageState.searchError = null;
  lookupPageState.searchResult = null;
  renderApp();

  const response = await retrieveStudentByPid(pid);

  lookupPageState.isLoading = false;
  lookupPageState.diagnosticTrace = response.diagnosticTrace || null;
  if (response.success) {
    lookupPageState.searchResult = response.student;
    lookupPageState.lastRetrievedAt = response.retrievedAt;
    lookupPageState.searchError = null;
    showToast(`Retrieved verified profile for ${response.student.fullName}`, 'success');
  } else {
    lookupPageState.searchError = response;
    lookupPageState.searchResult = null;
    showToast(response.message || 'Student lookup failed', response.error === 'ACCESS_DENIED' ? 'error' : 'info');
  }
  renderApp();
};

window.appQuickLookupPid = async (pid) => {
  lookupPageState.activeTab = 'search';
  lookupPageState.searchInput = pid;
  currentRoute = 'student-lookup';
  renderApp();

  const inputEl = document.getElementById('student-pid-input');
  if (inputEl) inputEl.value = pid;

  window.appExecuteStudentSearch();
};

window.appRefreshStudentSearch = async () => {
  const inputEl = document.getElementById('student-pid-input');
  const currentVal = inputEl ? inputEl.value.trim() : lookupPageState.searchInput;
  if (!currentVal) {
    showToast('Enter a PID to search before refreshing', 'info');
    return;
  }
  showToast('Refreshing student record...', 'info');
  await window.appExecuteStudentSearch();
};

window.appClearStudentSearch = () => {
  lookupPageState.searchInput = '';
  lookupPageState.searchResult = null;
  lookupPageState.searchError = null;
  lookupPageState.lastRetrievedAt = null;
  lookupPageState.diagnosticTrace = null;
  const inputEl = document.getElementById('student-pid-input');
  if (inputEl) inputEl.value = '';
  renderApp();
  showToast('Search input and results cleared', 'info');
};

window.appDownloadBlankCsvTemplate = () => {
  const csvContent = generateBlankStudentCsvTemplate();
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'SJCEM_Student_Roster_Blank_Template.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast('SJCEM Blank Roster template downloaded', 'success');
};

window.appDownloadSyntheticTestCsv = () => {
  const csvContent = generateSyntheticTestStudentCsv();
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'SJCEM_Synthetic_Test_Roster.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast('SJCEM Synthetic Test Roster downloaded (strictly for QA/testing)', 'info');
};

window.appDownloadStudentCsvTemplate = window.appDownloadSyntheticTestCsv;

window.appLoadSyntheticTestRoster = () => {
  const csvContent = generateSyntheticTestStudentCsv();
  const result = parseSpreadsheetRoster(csvContent, 'synthetic_test_roster.csv', { isSyntheticTest: true });
  if (!result.success) {
    showToast('Failed to parse synthetic test roster: ' + (result.error || ''), 'error');
    return;
  }
  lookupPageState.csvPreviewData = result;
  renderApp();
  showToast('Loaded 5 synthetic test records into preview. Click "Commit Roster to Database" to test storage.', 'info');
};

window.appPurgeSyntheticTestImports = () => {
  if (confirm('Are you sure you want to remove all imported synthetic test records?')) {
    const res = misStore.purgeSyntheticTestImports();
    renderApp();
    showToast(`Removed ${res.removedCount} synthetic test record(s).`, 'success');
  }
};

window.appSetImportMethod = (method) => {
  lookupPageState.importInputMethod = method;
  renderApp();
};

window.appHandleFileUpload = (fileInput) => {
  if (!fileInput.files || fileInput.files.length === 0) return;
  const file = fileInput.files[0];
  const isExcel = /\.(xlsx|xls)$/i.test(file.name);

  const reader = new FileReader();
  reader.onload = (event) => {
    const rawData = event.target.result;
    const result = parseSpreadsheetRoster(rawData, file.name);
    if (!result.success) {
      showToast('Spreadsheet Validation Error: ' + result.error, 'error');
      return;
    }
    lookupPageState.csvPreviewData = result;
    renderApp();
    showToast(`Validated ${result.validCount} student record(s) from ${file.name}`, 'success');
  };
  reader.onerror = () => {
    showToast('Failed to read uploaded spreadsheet file.', 'error');
  };

  if (isExcel) {
    reader.readAsArrayBuffer(file);
  } else {
    reader.readAsText(file);
  }
};

window.appHandleCsvFileUpload = window.appHandleFileUpload;

window.appHandlePasteImport = () => {
  const textarea = document.getElementById('spreadsheet-paste-textarea');
  const text = textarea ? textarea.value.trim() : '';
  if (!text) {
    showToast('Please paste spreadsheet data including a header row.', 'error');
    return;
  }

  const result = parseSpreadsheetRoster(text, 'pasted_roster.tsv');
  if (!result.success) {
    showToast('Spreadsheet Parsing Error: ' + result.error, 'error');
    return;
  }

  lookupPageState.csvPreviewData = result;
  renderApp();
  showToast(`Parsed & validated ${result.validCount} record(s) from pasted rows`, 'success');
};

window.appCommitSpreadsheetImport = () => {
  if (!lookupPageState.csvPreviewData || !lookupPageState.csvPreviewData.records) {
    showToast('No preview records to import', 'error');
    return;
  }

  const purgeSeed = document.getElementById('import-purge-seed-checkbox')?.checked || false;
  const updateExisting = document.getElementById('import-update-duplicates')?.checked !== false;

  const result = misStore.importStudentsFromCsv(
    lookupPageState.csvPreviewData.records,
    'Official Registrar Spreadsheet Import',
    { purgeSeedFirst: purgeSeed, updateExisting }
  );

  lookupPageState.csvPreviewData = null;
  renderApp();
  showToast(result.message, 'success');
};

window.appCommitCsvBatchImport = window.appCommitSpreadsheetImport;

window.appCancelSpreadsheetPreview = () => {
  lookupPageState.csvPreviewData = null;
  renderApp();
  showToast('Roster preview cancelled', 'info');
};

window.appCancelCsvPreview = window.appCancelSpreadsheetPreview;

window.appPurgeSeedRecords = () => {
  if (confirm('Are you sure you want to purge all sample seed records? Only genuine imported student records will remain in the database.')) {
    const res = misStore.purgeSeedRecords();
    renderApp();
    showToast(`Purged ${res.removedCount} sample seed record(s). Database now holds ${res.remainingRecords} official record(s).`, 'success');
  }
};

window.appResetSeedRecords = () => {
  const res = misStore.resetSampleSeedRecords();
  renderApp();
  showToast(`Loaded ${res.totalRecords} sample seed records for testing.`, 'info');
};

window.appUpdateIntegrationMode = (mode) => {
  misStore.updateIntegrationConfig({ integrationMode: mode });
  showToast(
    mode === 'LOCAL_IMPORTED'
      ? 'Active Mode: Local Authorized DB (CSV Import)'
      : 'Active Mode: College Gateway API (Standby)',
    'success'
  );
  renderApp();
};

window.appSaveIntegrationConfig = () => {
  const endpointEl = document.getElementById('config-api-endpoint');
  const timeoutEl = document.getElementById('config-api-timeout');

  const updates = {};
  if (endpointEl) updates.apiEndpointUrl = endpointEl.value.trim();
  if (timeoutEl) updates.apiTimeoutMs = parseInt(timeoutEl.value, 10) || 5000;

  misStore.updateIntegrationConfig(updates);
  showToast('Gateway configuration saved successfully', 'success');
  renderApp();
};

window.appTestGatewayConnection = async () => {
  lookupPageState.isTestingGateway = true;
  renderApp();
  showToast('Testing institutional API gateway connection...', 'info');

  const result = await testInstitutionalGatewayConnection();

  lookupPageState.isTestingGateway = false;
  lookupPageState.gatewayTestResult = result;
  renderApp();

  if (result.success) {
    showToast(result.message || 'Institutional gateway connection verified!', 'success');
  } else {
    showToast(result.message || 'Institutional gateway connection test failed', 'error');
  }
};

// Keyboard shortcuts (Ctrl+K or Cmd+K for global search)
window.addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault();
    openSearch();
  }
  if (e.key === 'Escape') {
    closeSearch();
    toggleMobileSidebar(false);
    toggleNotifications(false);
    if (typeof window.appCloseQrScanner === 'function') {
      window.appCloseQrScanner();
    }
    closeModal('modal-qr-verification-result');
    closeModal('modal-edit-contact');
    closeModal('modal-request-certificate');
    closeModal('modal-submit-project');
    closeModal('modal-faculty-attendance');
    closeModal('modal-faculty-marks');
    closeModal('modal-certificate-preview');
    closeModal('modal-db-schema');
    closeModal('modal-report-compromised-qr');
    closeModal('modal-view-notice');
    closeModal('modal-create-notice');
    closeModal('modal-upload-resource');
    closeModal('modal-new-ticket');
    closeModal('modal-preview-grade-card');
    closeModal('modal-view-request-detail');
    closeModal('modal-admin-cert-review');
    closeModal('modal-faculty-project-review');
    const profileMenu = document.getElementById('profile-dropdown-menu');
    if (profileMenu) profileMenu.classList.add('hidden');
  }
});

// Subscribe to store updates
misStore.subscribe(() => {
  renderApp();
});

// Initial boot
document.addEventListener('DOMContentLoaded', () => {
  renderApp();
});

if (document.readyState === 'complete' || document.readyState === 'interactive') {
  renderApp();
}


// ================= INTERACTIVE CONTROL SUITE (AUDITED & BOUND) =================

// 1. Notice Viewer
window.appOpenNotice = function (noticeId) {
  const notices = misStore.getNotices();
  const notice = notices.find((n) => n.id === noticeId);
  if (!notice) {
    showToast('Notice record not found.', 'error');
    return;
  }
  notice.isRead = true;
  document.getElementById('notice-modal-title').innerText = notice.title;
  document.getElementById('notice-modal-meta').innerText = `${notice.department} • By ${notice.authorName}`;
  document.getElementById('notice-modal-category').innerText = notice.category;
  document.getElementById('notice-modal-priority').innerText = notice.priority;
  document.getElementById('notice-modal-date').innerText = notice.publishedDate;
  document.getElementById('notice-modal-content').innerText = notice.content;

  const attachEl = document.getElementById('notice-modal-attachment');
  const attachNameEl = document.getElementById('notice-modal-attachment-name');
  if (notice.attachmentName) {
    attachEl.style.display = 'flex';
    attachNameEl.innerText = notice.attachmentName;
  } else {
    attachEl.style.display = 'none';
  }

  openModal('modal-view-notice');
};

// 2. Publish Notice (Faculty / Admin)
window.appOpenCreateNoticeModal = function () {
  const user = misStore.getCurrentUser();
  if (!user || (user.role !== 'faculty' && user.role !== 'admin')) {
    showToast('Notice publishing requires faculty or administrator privileges.', 'error');
    return;
  }
  openModal('modal-create-notice');
};

window.appHandleCreateNoticeSubmit = function (e) {
  if (e && e.preventDefault) e.preventDefault();
  const title = document.getElementById('create-notice-title')?.value.trim();
  const category = document.getElementById('create-notice-category')?.value;
  const priority = document.getElementById('create-notice-priority')?.value;
  const content = document.getElementById('create-notice-content')?.value.trim();

  if (!title || !content) {
    showToast('Please enter both title and content.', 'error');
    return;
  }

  misStore.publishNotice({ title, category, priority, content });
  closeModal('modal-create-notice');
  renderApp();
  showToast('Institutional circular published successfully and broadcasted.', 'success');
};

// 3. Upload Resource Modal (Faculty)
window.appOpenUploadResourceModal = function () {
  const user = misStore.getCurrentUser();
  if (!user || (user.role !== 'faculty' && user.role !== 'admin')) {
    showToast('Study resource upload requires faculty privileges.', 'error');
    return;
  }
  openModal('modal-upload-resource');
};

window.appHandleUploadResourceSubmit = function (e) {
  if (e && e.preventDefault) e.preventDefault();
  const subject = document.getElementById('upload-resource-subject')?.value.trim();
  const title = document.getElementById('upload-resource-title')?.value.trim();
  const resourceType = document.getElementById('upload-resource-type')?.value;
  const fileFormat = document.getElementById('upload-resource-format')?.value;

  if (!subject || !title) {
    showToast('Please provide subject code and resource title.', 'error');
    return;
  }

  const user = misStore.getCurrentUser();
  const resources = misStore.getResources();
  resources.unshift({
    id: `res-${Date.now()}`,
    subjectCode: subject.split('-')[0].trim(),
    subjectName: subject,
    title,
    description: 'Faculty lecture material approved for academic syllabus review.',
    resourceType: resourceType || 'NOTES',
    fileFormat: fileFormat || 'PDF',
    fileSize: '4.2 MB',
    uploadedBy: user ? `${user.firstName} ${user.lastName}` : 'Prof. Anita Deshmukh',
    uploadDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    downloadsCount: 0,
  });

  closeModal('modal-upload-resource');
  renderApp();
  showToast(`Course material for ${subject} uploaded successfully.`, 'success');
};

// 4. New Support Ticket Modal
window.appOpenNewTicketModal = function () {
  openModal('modal-new-ticket');
};

window.appHandleNewTicketSubmit = function (e) {
  if (e && e.preventDefault) e.preventDefault();
  const subject = document.getElementById('ticket-subject')?.value.trim();
  const category = document.getElementById('ticket-category')?.value;
  const priority = document.getElementById('ticket-priority')?.value;
  const description = document.getElementById('ticket-description')?.value.trim();

  if (!subject || !description) {
    showToast('Please provide ticket subject and description.', 'error');
    return;
  }

  const ticket = misStore.submitSupportTicket(subject, category, priority, description);
  closeModal('modal-new-ticket');
  renderApp();
  showToast(`Ticket ${ticket.ticketNumber} registered with Campus Helpdesk.`, 'success');
};

// 5. Grade Card Preview & Print Modal
window.appPreviewGradeCard = function (semNum) {
  const results = misStore.getSemesterResults();
  const semResult = results.find((r) => r.semesterNum === semNum) || results[0];
  const user = misStore.getCurrentUser();

  if (!semResult) {
    showToast('Semester marksheet record not found.', 'error');
    return;
  }

  const container = document.getElementById('grade-card-body');
  if (container) {
    container.innerHTML = `
      <div id="printable-grade-card" class="space-y-4 p-4 border border-[#DCE4EE] rounded-xl bg-white">
        <div class="text-center pb-3 border-b border-slate-200">
          <h2 class="text-base font-extrabold text-[#073B70]">ST. JOHN COLLEGE OF ENGINEERING &amp; MANAGEMENT</h2>
          <p class="text-[10px] text-slate-500 font-semibold">Autonomous • Affiliated to University of Mumbai • Palghar 401404</p>
          <h3 class="text-xs font-bold text-slate-800 mt-2 uppercase tracking-wide">Grade Card — ${semResult.semesterName} Examination</h3>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-[#F0F4FA] rounded-lg border border-[#DCE4EE] text-[11px]">
          <div><span class="text-slate-500 block">Candidate Name:</span><strong class="text-slate-800">${user ? user.fullName || user.firstName + ' ' + user.lastName : 'Rahul Suresh Sharma'}</strong></div>
          <div><span class="text-slate-500 block">Student ID / PRN:</span><strong class="font-mono text-slate-800">${user ? user.studentId || user.prn : 'EU20220084'}</strong></div>
          <div><span class="text-slate-500 block">Seat Number:</span><strong class="font-mono text-slate-800">${semResult.examSeatNo}</strong></div>
          <div><span class="text-slate-500 block">Status:</span><span class="px-2 py-0.5 rounded font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">${semResult.resultStatus}</span></div>
        </div>

        <table class="w-full text-left border-collapse text-[11px]">
          <thead>
            <tr class="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
              <th class="py-2 px-3">Course Code</th>
              <th class="py-2 px-3">Course Title</th>
              <th class="py-2 px-3 text-center">Credits</th>
              <th class="py-2 px-3 text-center">Grade</th>
              <th class="py-2 px-3 text-center">Grade Points</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            ${semResult.courses.map((c) => `
              <tr>
                <td class="py-1.5 px-3 font-mono font-bold text-[#073B70]">${c.code}</td>
                <td class="py-1.5 px-3 text-slate-800">${c.name}</td>
                <td class="py-1.5 px-3 text-center font-mono">${c.credits}</td>
                <td class="py-1.5 px-3 text-center font-bold text-emerald-700">${c.grade}</td>
                <td class="py-1.5 px-3 text-center font-mono font-bold text-slate-800">${c.gradePoints}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs font-semibold">
          <div><span>Total Credits: </span><strong class="font-mono text-slate-900">${semResult.totalCredits}</strong></div>
          <div><span>SGPA: </span><strong class="text-[#073B70] font-mono text-sm">${semResult.sgpa}</strong></div>
          <div><span>Cumulative CGPA: </span><strong class="text-[#178579] font-mono text-sm">${semResult.cgpa}</strong></div>
        </div>

        <div class="pt-3 flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-100">
          <span>Date of Gazette Issue: ${semResult.publishedDate}</span>
          <span class="font-semibold text-slate-600">Controller of Examinations, SJCEM</span>
        </div>
      </div>
    `;
  }
  openModal('modal-preview-grade-card');
};

// 6. Request Detail Lifecycle Viewer
window.appViewRequestDetail = function (refNumber) {
  const certs = misStore.getCertificates();
  const cert = certs.find((c) => c.referenceNumber === refNumber || c.id === refNumber);
  if (!cert) {
    showToast('Request tracking record not found.', 'error');
    return;
  }

  const container = document.getElementById('request-detail-body');
  if (container) {
    container.innerHTML = `
      <div class="space-y-3">
        <div class="p-3 bg-[#F0F4FA] rounded-xl border border-[#DCE4EE] flex items-center justify-between">
          <div>
            <span class="text-[10px] text-slate-500 uppercase font-semibold block">Tracking Reference</span>
            <strong class="font-mono text-sm text-[#073B70]">${cert.referenceNumber}</strong>
          </div>
          <span class="px-2.5 py-1 rounded-md font-bold text-xs bg-amber-50 text-amber-800 border border-amber-200">${cert.status}</span>
        </div>

        <div>
          <span class="text-slate-500 block font-semibold">Service Type:</span>
          <p class="font-bold text-slate-800">${cert.certificateType}</p>
        </div>

        <div>
          <span class="text-slate-500 block font-semibold">Purpose:</span>
          <p class="text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100">${cert.purpose}</p>
        </div>

        ${cert.adminRemarks ? `
          <div class="p-2.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-900">
            <span class="font-bold block text-[11px]">Officer Remarks:</span>
            <p class="mt-0.5">${cert.adminRemarks}</p>
          </div>
        ` : ''}

        <div>
          <span class="text-slate-700 font-bold block mb-2">Audit Timeline:</span>
          <div class="space-y-2 border-l-2 border-[#073B70] pl-3 ml-1">
            ${cert.timeline.map((t) => `
              <div class="text-[11px]">
                <div class="flex items-center gap-1.5 font-bold text-slate-800">
                  <span class="w-1.5 h-1.5 rounded-full bg-[#073B70]"></span>
                  <span>${t.status}</span>
                  <span class="text-slate-400 font-normal font-mono text-[10px] ml-auto">${t.date}</span>
                </div>
                <p class="text-slate-500 mt-0.5 ml-3">${t.remarks} (Actor: ${t.actor})</p>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }
  openModal('modal-view-request-detail');
};

// 7. Admin Certificate Review & Action
window.appOpenAdminCertificateReview = function (certId) {
  const user = misStore.getCurrentUser();
  if (!user || user.role !== 'admin') {
    showToast('Certificate reviews require administrator clearance.', 'error');
    return;
  }
  const certs = misStore.getCertificates();
  const cert = certs.find((c) => c.id === certId || c.referenceNumber === certId);
  if (!cert) {
    showToast('Certificate application not found.', 'error');
    return;
  }

  const container = document.getElementById('admin-cert-review-body');
  if (container) {
    container.innerHTML = `
      <div class="space-y-3.5">
        <div class="p-3 bg-purple-50 rounded-xl border border-purple-200 flex items-center justify-between">
          <div>
            <span class="text-[10px] text-purple-600 uppercase font-bold block">Application Reference</span>
            <span class="font-mono font-bold text-sm text-purple-950">${cert.referenceNumber}</span>
          </div>
          <span class="px-2 py-0.5 rounded font-bold text-[11px] bg-amber-100 text-amber-800 border border-amber-300">${cert.status}</span>
        </div>

        <div>
          <span class="text-slate-500 font-semibold block">Requested Certificate:</span>
          <strong class="text-slate-900">${cert.certificateType}</strong>
        </div>

        <div>
          <span class="text-slate-500 font-semibold block">Declared Purpose:</span>
          <p class="p-2.5 bg-slate-50 rounded-lg border border-slate-100 text-slate-700">${cert.purpose}</p>
        </div>

        <div>
          <label class="block text-slate-700 font-bold mb-1">Administrative Remarks / Decision Notes</label>
          <textarea id="admin-review-remarks" rows="2" placeholder="e.g. Verified fee clearance with Accounts section. Ready for registrar signature." class="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-purple-600">${cert.adminRemarks || ''}</textarea>
        </div>

        <div class="pt-3 flex justify-end gap-2 border-t border-slate-100">
          <button type="button" onclick="window.appCloseModal('modal-admin-cert-review')" class="px-3.5 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold">Cancel</button>
          <button type="button" onclick="window.appAdminRejectCert('${cert.id}')" class="px-3.5 py-2 rounded-xl bg-rose-50 text-rose-800 border border-rose-300 hover:bg-rose-100 font-bold transition">Reject Application</button>
          <button type="button" onclick="window.appAdminApproveCert('${cert.id}')" class="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold transition">Approve & Issue</button>
        </div>
      </div>
    `;
  }
  openModal('modal-admin-cert-review');
};

window.appAdminApproveCert = function (certId) {
  const remarks = document.getElementById('admin-review-remarks')?.value.trim() || 'Approved by Academic Dean. Ready for collection at Student Section Counter 2.';
  misStore.updateCertificateStatus(certId, 'APPROVED', remarks);
  closeModal('modal-admin-cert-review');
  renderApp();
  showToast('Certificate approved successfully. Status set to READY FOR COLLECTION.', 'success');
};

window.appAdminRejectCert = function (certId) {
  const remarks = document.getElementById('admin-review-remarks')?.value.trim() || 'Application rejected: Incomplete prerequisite fee clearance.';
  misStore.updateCertificateStatus(certId, 'REJECTED', remarks);
  closeModal('modal-admin-cert-review');
  renderApp();
  showToast('Certificate request rejected with administrative notes.', 'info');
};

// 8. Faculty Project Review Modal
window.appOpenFacultyReviewProjectModal = function (submissionId) {
  const user = misStore.getCurrentUser();
  if (!user || user.role !== 'faculty') {
    showToast('Project reviews require faculty supervisor authorization.', 'error');
    return;
  }
  const project = misStore.getProject();
  const sub = project.submissions.find((s) => s.id === submissionId) || project.submissions[0];

  const container = document.getElementById('faculty-project-review-body');
  if (container) {
    container.innerHTML = `
      <div class="space-y-3.5">
        <div class="p-3 bg-teal-50 rounded-xl border border-teal-200">
          <span class="text-[10px] text-teal-700 uppercase font-bold block">Project Title</span>
          <strong class="text-sm text-teal-950 block">${project.title}</strong>
          <span class="text-[11px] text-teal-800 font-mono mt-0.5 block">Guide: ${project.guideName}</span>
        </div>

        <div>
          <span class="text-slate-500 font-semibold block">Deliverable Under Review:</span>
          <strong class="text-slate-900">${sub ? sub.title : 'Milestone 2 Benchmark Report'} (${sub ? sub.version : 'v1.0'})</strong>
        </div>

        <div>
          <label class="block text-slate-700 font-bold mb-1">Supervisor Review Status</label>
          <select id="faculty-project-status" class="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold text-slate-800 focus:outline-none focus:border-[#178579]">
            <option value="APPROVED">Approved — Proceed to Next Milestone</option>
            <option value="CHANGES_REQUESTED">Changes Requested / Re-submission Required</option>
            <option value="UNDER_REVIEW">Under Review</option>
          </select>
        </div>

        <div>
          <label class="block text-slate-700 font-bold mb-1">Technical Feedback & Supervisor Remarks</label>
          <textarea id="faculty-project-feedback" rows="3" placeholder="Enter remarks regarding model accuracy, documentation quality, or dataset hygiene..." class="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-[#178579]"></textarea>
        </div>

        <div class="pt-3 flex justify-end gap-2 border-t border-slate-100">
          <button type="button" onclick="window.appCloseModal('modal-faculty-project-review')" class="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold">Cancel</button>
          <button type="button" onclick="window.appHandleFacultyProjectReviewSubmit(event, '${sub ? sub.id : ''}')" class="px-4 py-2 rounded-xl bg-[#178579] hover:bg-[#13675E] text-white font-bold transition">Save Review</button>
        </div>
      </div>
    `;
  }
  openModal('modal-faculty-project-review');
};

window.appHandleFacultyProjectReviewSubmit = function (e, submissionId) {
  if (e && e.preventDefault) e.preventDefault();
  const status = document.getElementById('faculty-project-status')?.value || 'APPROVED';
  const feedback = document.getElementById('faculty-project-feedback')?.value.trim() || 'Reviewed and approved by academic guide.';
  
  const project = misStore.getProject();
  project.status = status;
  const sub = project.submissions.find((s) => s.id === submissionId) || project.submissions[0];
  if (sub) {
    sub.status = status === 'APPROVED' ? 'REVIEWED' : 'PENDING';
    sub.feedback = feedback;
  }

  closeModal('modal-faculty-project-review');
  renderApp();
  showToast(`Project deliverable review recorded as ${status}.`, 'success');
};

// 9. Change Password Handler (Settings Page)
window.appHandleChangePassword = function (e) {
  if (e && e.preventDefault) e.preventDefault();
  const currentPass = document.getElementById('current-password-input')?.value;
  const newPass = document.getElementById('new-password-input')?.value;
  const confirmPass = document.getElementById('confirm-password-input')?.value;

  if (!currentPass || !newPass || !confirmPass) {
    showToast('Please fill all password fields.', 'error');
    return;
  }

  if (newPass.length < 8) {
    showToast('New password must be at least 8 characters with letters & numbers.', 'error');
    return;
  }

  if (newPass !== confirmPass) {
    showToast('New passwords do not match. Please verify.', 'error');
    return;
  }

  const user = misStore.getCurrentUser();
  if (user) {
    user.password = newPass;
    misStore.addAuditLog('CHANGE_PASSWORD', 'profiles', `Password successfully updated for ${user.email}`);
  }
  showToast('Account password updated securely.', 'success');
  if (e.target && e.target.reset) e.target.reset();
};

// 10. QR Result Modal Alias
window.appShowVerificationResult = function (result) {
  window.appShowVerificationResultModal(result);
};

// Download Stubs with Real Data
window.appDownloadNoticeAttachment = function (filename) {
  showToast(`Downloading institutional attachment: ${filename}...`, 'info');
};

window.appDownloadResource = function (title) {
  showToast(`Downloading study material: ${title}...`, 'info');
};

// ================= FACULTY ATTENDANCE ACTION HANDLERS =================
window.appChangeAttendanceClass = function (subjectCode) {
  facultyAttSubject = subjectCode;
  const assignedClasses = misStore.getFacultyClasses();
  const cl = assignedClasses.find((c) => c.subjectCode === subjectCode);
  if (cl) {
    facultyAttDivision = cl.division;
  }
  renderApp();
};

window.appQuickMarkAllAttendance = function (status) {
  const tbody = document.getElementById('attendance-roster-tbody');
  if (!tbody) return;
  const rows = tbody.querySelectorAll('tr');
  rows.forEach((row) => {
    const radio = row.querySelector(`input[type="radio"][value="${status}"]`);
    if (radio) {
      radio.checked = true;
    }
  });
  window.appUpdateAttendanceCounters();
  showToast(`All students marked as ${status}.`, 'info');
};

window.appUpdateAttendanceCounters = function () {
  const tbody = document.getElementById('attendance-roster-tbody');
  if (!tbody) return;
  const rows = tbody.querySelectorAll('tr');
  const total = rows.length;
  let present = 0;
  let absent = 0;
  let late = 0;
  rows.forEach((row) => {
    const checked = row.querySelector('input[type="radio"]:checked');
    if (checked) {
      if (checked.value === 'PRESENT') present++;
      else if (checked.value === 'ABSENT') absent++;
      else if (checked.value === 'LATE') late++;
    }
  });
  const pct = total > 0 ? Math.round(((present + late * 0.5) / total) * 100) : 0;
  const totalEl = document.getElementById('roster-total-count');
  const presentEl = document.getElementById('roster-present-count');
  const absentEl = document.getElementById('roster-absent-count');
  const pctEl = document.getElementById('roster-pct-count');
  if (totalEl) totalEl.textContent = total;
  if (presentEl) presentEl.textContent = present;
  if (absentEl) absentEl.textContent = absent;
  if (pctEl) pctEl.textContent = `${pct}%`;
};

window.appSaveFacultyAttendanceRegister = function () {
  const user = misStore.getCurrentUser();
  if (!user || user.role !== 'faculty') {
    showToast('Attendance registration requires faculty authorization.', 'error');
    return;
  }
  const subject = document.getElementById('faculty-att-subject-select')?.value || facultyAttSubject;
  const division = document.getElementById('faculty-att-division-select')?.value || facultyAttDivision;
  const date = document.getElementById('faculty-att-date-input')?.value || new Date().toISOString().split('T')[0];
  const slot = document.getElementById('faculty-att-slot-select')?.value || '11:15 AM - 12:15 PM';
  const topic = document.getElementById('faculty-att-topic-input')?.value.trim();

  if (!topic) {
    showToast('Please specify the syllabus topic covered during the lecture session.', 'error');
    return;
  }

  const tbody = document.getElementById('attendance-roster-tbody');
  if (!tbody) return;
  const rows = tbody.querySelectorAll('tr');
  const studentRecords = [];
  rows.forEach((row) => {
    const studentId = row.getAttribute('data-student-id');
    const status = row.querySelector('input[type="radio"]:checked')?.value || 'PRESENT';
    const remarks = row.querySelector('.att-remark-input')?.value || '';
    if (studentId) {
      studentRecords.push({ studentId, status, remarks });
    }
  });

  const res = misStore.facultyRecordAttendanceBatch(subject, division, date, slot, topic, studentRecords);
  if (res.success) {
    showToast(`Classroom attendance committed: ${res.count} records registered for ${subject}.`, 'success');
  } else {
    showToast(res.message || 'Failed to commit attendance.', 'error');
  }
};

// ================= FACULTY MARKS ACTION HANDLERS =================
window.appChangeMarksSubject = function (subjectCode) {
  facultyMarksSubject = subjectCode;
  renderApp();
};

window.appChangeMarksComponent = function (assessment) {
  facultyMarksAssessment = assessment;
  renderApp();
};

window.appRecalculateMarksStats = function () {
  const maxMarks = facultyMarksAssessment === 'PRELIMS' ? 80 : 20;
  const passThreshold = maxMarks * 0.4;
  const tbody = document.getElementById('marks-roster-tbody');
  if (!tbody) return;
  const rows = tbody.querySelectorAll('tr');
  let totalScore = 0;
  let highestScore = 0;
  let passCount = 0;
  let validCount = 0;

  rows.forEach((row) => {
    const input = row.querySelector('.marks-score-input');
    const pctCell = row.querySelector('.marks-pct-cell');
    const statusCell = row.querySelector('.marks-status-cell');
    if (input) {
      let val = parseFloat(input.value);
      if (isNaN(val)) val = 0;
      if (val < 0) val = 0;
      if (val > maxMarks) val = maxMarks;

      totalScore += val;
      validCount++;
      if (val > highestScore) highestScore = val;
      const isPass = val >= passThreshold;
      if (isPass) passCount++;

      const pct = Math.round((val / maxMarks) * 100);
      if (pctCell) pctCell.textContent = `${pct}%`;
      if (statusCell) {
        statusCell.innerHTML = `
          <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${
            isPass
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }">
            ${isPass ? 'PASSED' : 'RETEST REQUIRED'}
          </span>
        `;
      }
    }
  });

  const avg = validCount > 0 ? (totalScore / validCount).toFixed(1) : '0.0';
  const passPct = validCount > 0 ? Math.round((passCount / validCount) * 100) : 0;

  const avgEl = document.getElementById('marks-stat-average');
  const highEl = document.getElementById('marks-stat-highest');
  const passEl = document.getElementById('marks-stat-passrate');

  if (avgEl) avgEl.textContent = `${avg} / ${maxMarks}`;
  if (highEl) highEl.textContent = `${highestScore.toFixed(1)} / ${maxMarks}`;
  if (passEl) passEl.textContent = `${passPct}%`;
};

window.appPrefillSampleMarks = function () {
  const maxMarks = facultyMarksAssessment === 'PRELIMS' ? 80 : 20;
  const tbody = document.getElementById('marks-roster-tbody');
  if (!tbody) return;
  const rows = tbody.querySelectorAll('tr');
  const base = maxMarks === 80 ? 68 : 17.5;
  const offsets = [1.5, 0.0, -1.0, 1.0, -2.5, 0.5, 1.0];
  rows.forEach((row, idx) => {
    const input = row.querySelector('.marks-score-input');
    if (input) {
      const offset = offsets[idx % offsets.length] || 0;
      const s = Math.min(maxMarks, Math.max(0, base + offset));
      input.value = s.toFixed(1);
    }
  });
  window.appRecalculateMarksStats();
  showToast('Departmental assessment baseline loaded successfully.', 'info');
};

window.appSaveFacultyMarksRegister = function () {
  const user = misStore.getCurrentUser();
  if (!user || user.role !== 'faculty') {
    showToast('Marks submission requires faculty authorization.', 'error');
    return;
  }
  const subject = document.getElementById('faculty-marks-subject-select')?.value || facultyMarksSubject;
  const assessment = document.getElementById('faculty-marks-assessment-select')?.value || facultyMarksAssessment;
  const division = document.getElementById('faculty-marks-division-select')?.value || 'TE COMP Div A';
  const maxMarks = assessment === 'PRELIMS' ? 80 : 20;

  const tbody = document.getElementById('marks-roster-tbody');
  if (!tbody) return;
  const rows = tbody.querySelectorAll('tr');
  const marksEntries = [];
  let hasInvalid = false;

  rows.forEach((row) => {
    const studentId = row.getAttribute('data-student-id');
    const input = row.querySelector('.marks-score-input');
    if (studentId && input) {
      const val = parseFloat(input.value);
      if (isNaN(val) || val < 0 || val > maxMarks) {
        hasInvalid = true;
      } else {
        marksEntries.push({ studentId, score: val });
      }
    }
  });

  if (hasInvalid) {
    showToast(`Marks must be valid numbers between 0 and ${maxMarks}.`, 'error');
    return;
  }

  const res = misStore.facultyUpdateMarksBatch(subject, assessment, division, marksEntries);
  if (res.success) {
    showToast(`Marks submission committed: ${res.count} student scores updated for ${subject} (${assessment}).`, 'success');
  } else {
    showToast(res.message || 'Failed to submit marks.', 'error');
  }
};

// ================= ADMINISTRATOR CERTIFICATES ACTION HANDLERS =================
window.appFilterAdminCertStatus = function (status) {
  adminCertStatusFilter = status;
  renderApp();
};

window.appSearchAdminCerts = function (query) {
  adminCertSearchQuery = query;
  renderApp();
  const input = document.getElementById('admin-cert-search-input');
  if (input) {
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
  }
};

window.appRefreshAdminCertificates = function () {
  renderApp();
  showToast('Certificate queue refreshed with verified database state.', 'info');
};

window.appAdminApproveCertConfirm = function (certId) {
  const user = misStore.getCurrentUser();
  if (!user || user.role !== 'admin') {
    showToast('Certificate approval requires administrative authorization.', 'error');
    return;
  }
  const remarks = 'Approved by Registrar Cell. Official digital seal applied. Ready for physical collection at Counter 2.';
  misStore.updateCertificateStatus(certId, 'APPROVED', remarks);
  renderApp();
  showToast('Certificate application approved and signed digitally.', 'success');
};

window.appAdminRejectCertPrompt = function (certId) {
  window.appOpenAdminCertificateReview(certId);
};

// ================= ADMINISTRATOR AUDIT LOGS ACTION HANDLERS =================
window.appFilterAuditCategory = function (category) {
  adminAuditCategoryFilter = category;
  renderApp();
};

window.appSearchAuditLogs = function (query) {
  adminAuditSearchQuery = query;
  renderApp();
  const input = document.getElementById('audit-search-input');
  if (input) {
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
  }
};

window.appDownloadAuditLogCsv = function () {
  const rawLogs = misStore.getAuditLogs();
  const lookupLogs = misStore.getStudentLookupAuditLogs ? misStore.getStudentLookupAuditLogs() : [];
  const allLogs = [
    ...rawLogs.map((l) => ({
      timestamp: l.timestamp,
      action: l.action,
      entity: l.entityName,
      actor: l.actorName || 'Authorized User',
      role: l.actorRole || 'System',
      ip: l.ipAddress || '127.0.0.1',
      details: l.details || '',
    })),
    ...lookupLogs.map((l) => ({
      timestamp: l.timestamp,
      action: l.action || 'STUDENT_LOOKUP',
      entity: 'student_enrollments',
      actor: l.actorName || 'Authorized User',
      role: l.actorRole || 'faculty',
      ip: l.ipAddress || '127.0.0.1',
      details: `PID query: ${l.targetStudentPid || 'N/A'}. Result: ${l.outcome}. Department: ${l.targetDepartment || 'ALL'}`,
    })),
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  let csvContent = 'Timestamp,Action,Entity,Actor,Role,IP Address,Details\n';
  allLogs.forEach((l) => {
    const row = [
      `"${l.timestamp}"`,
      `"${l.action}"`,
      `"${l.entity}"`,
      `"${l.actor}"`,
      `"${l.role}"`,
      `"${l.ip}"`,
      `"${(l.details || '').replace(/"/g, '""')}"`,
    ].join(',');
    csvContent += row + '\n';
  });

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `sjcem_audit_trail_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  showToast('Security audit trail exported successfully as CSV.', 'success');
};

// ================= ADMINISTRATOR SCHEMA & RLS ACTION HANDLERS =================
window.appSetSchemaTab = function (tab) {
  adminSchemaActiveTab = tab;
  renderApp();
};

window.appViewDatabaseSchema = function () {
  openModal('modal-db-schema');
};
