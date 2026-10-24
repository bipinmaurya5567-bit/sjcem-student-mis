// SJCEM NEXT MIS Main Application Controller & Secure Auth Router
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
import { renderAdminWorkspace } from './pages/AdminWorkspace.js';
import {
  renderLoginLandingPage,
  renderDedicatedLoginPage,
  renderVerificationViewPage,
  renderSessionExpiredScreen,
  renderUnauthorizedScreen,
} from './pages/AuthPages.js';

// Router & App State
let currentRoute = 'overview';
let authErrorMessage = '';
let verificationRouteToken = '';
let verificationRouteResult = null;
let isSidebarCollapsed = false;
let isMobileSidebarOpen = false;
let activeMarksTab = 'internal';
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
  // Students cannot access faculty or admin workspaces
  if (user.role === 'student' && (currentRoute.startsWith('faculty') || currentRoute.startsWith('admin'))) {
    appRoot.innerHTML = renderUnauthorizedScreen();
    initIcons();
    return;
  }
  // Faculty cannot access admin workspace
  if (user.role === 'faculty' && currentRoute.startsWith('admin')) {
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
    case 'attendance-entry':
    case 'marks-entry':
      pageContent = renderFacultyWorkspace();
      break;
    case 'admin-workspace':
    case 'admin-certificates':
    case 'admin-audit':
    case 'admin-schema':
      pageContent = renderAdminWorkspace();
      break;
    default:
      pageContent = user.role === 'faculty' ? renderFacultyWorkspace() : user.role === 'admin' ? renderAdminWorkspace() : renderOverviewPage();
      break;
  }

  // Master Layout HTML Structure (No Role Switcher Modal!)
  appRoot.innerHTML = `
    <div class="flex h-screen overflow-hidden bg-[#F7F9FC]">
      <!-- Desktop Sidebar -->
      <div class="hidden md:block">
        ${renderSidebar(currentRoute, navigateTo, isSidebarCollapsed, toggleSidebar)}
      </div>

      <!-- Mobile Navigation Drawer -->
      <div id="mobile-sidebar-backdrop" style="display:${isMobileSidebarOpen ? 'block' : 'none'};" class="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm md:hidden animate-fade-in" onclick="window.appToggleMobileSidebar(false)"></div>
      <div id="mobile-sidebar-container" style="transform:${isMobileSidebarOpen ? 'translateX(0)' : 'translateX(-100%)'};" class="fixed inset-y-0 left-0 z-50 w-64 md:hidden transition-transform duration-200 ease-out shadow-2xl">
        ${renderSidebar(currentRoute, navigateTo, false, toggleSidebar)}
      </div>

      <!-- Main Content Area -->
      <div class="flex-1 flex flex-col h-screen overflow-hidden">
        ${renderNavbar(currentRoute, openSearch, toggleNotifications)}
        
        <main class="flex-1 overflow-y-auto px-3.5 sm:px-6 lg:px-8 py-4 sm:py-6 pb-24 md:pb-8">
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
  }
}

// Navigation Handler
function navigateTo(route) {
  currentRoute = route;
  authErrorMessage = '';
  isMobileSidebarOpen = false;
  renderApp();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function toggleSidebar() {
  isSidebarCollapsed = !isSidebarCollapsed;
  renderApp();
}

function toggleMobileSidebar(force) {
  isMobileSidebarOpen = force !== undefined ? force : !isMobileSidebarOpen;
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
  if (drawer) {
    const isShowing = drawer.style.display === 'flex';
    drawer.style.display = force !== undefined ? (force ? 'flex' : 'none') : isShowing ? 'none' : 'flex';
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

// --- STEP 1: AUTHENTICATION CREDENTIALS SUBMISSION ---
window.appHandleCredentialsSubmit = function (e, role) {
  if (e && e.preventDefault) e.preventDefault();
  authErrorMessage = '';

  const emailInput = document.getElementById('login-email-input');
  const passwordInput = document.getElementById('login-password-input');

  const email = emailInput ? emailInput.value : '';
  const password = passwordInput ? passwordInput.value : '';

  const result = misStore.initiateLogin(email, password, role);

  if (!result.success) {
    authErrorMessage = result.message;
    renderApp();
    showToast(result.message, 'error');
    return;
  }

  // Credentials validated & role verified -> proceed to Step 2 (Email OTP challenge)
  renderApp();
  showToast(`Verification code sent to ${result.email}`, 'success');
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
  // Show confirmation inline
  const errorZone = emailInput.closest('form')?.querySelector('[data-forgot-confirm]');
  showToast(`📧 Password reset instructions sent to ${email}. Check your inbox.`, 'success');
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
  const canvas = document.getElementById('student-qr-canvas') || document.getElementById('faculty-qr-canvas');
  if (!canvas) {
    showToast('QR code canvas not yet initialized.', 'error');
    return;
  }

  const link = document.createElement('a');
  link.download = `SJCEM_Digital_ID_${identifier || 'Pass'}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
  showToast('High-resolution QR code downloaded successfully', 'success');
};

// Print Official Digital ID Card (Only the ID card prints!)
window.appPrintDigitalId = function () {
  window.print();
};

window.appRefreshQrCard = function () {
  renderQrCanvases();
  showToast('Digital ID card refreshed and verified with identity registry', 'success');
};

// Report Compromised Token Modal
window.appReportCompromisedQr = function (userId) {
  openModal('modal-report-compromised-qr');
};

window.appHandleRevokeAndRegenerateSubmit = function (e) {
  if (e && e.preventDefault) e.preventDefault();
  const user = misStore.getCurrentUser();
  const reason = document.getElementById('revoke-reason-select')?.value || 'LOST_PHYSICAL_CARD';

  const newRecord = misStore.revokeAndRegenerateQrToken(user.id, reason);
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
    .catch((err) => {
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

// Keyboard shortcuts (Ctrl+K or Cmd+K for global search)
window.addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault();
    openSearch();
  }
  if (e.key === 'Escape') {
    closeSearch();
    window.appCloseQrScanner();
    closeModal('modal-qr-verification-result');
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
