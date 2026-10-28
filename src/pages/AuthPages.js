// SJCEM NEXT MIS — High-Security Multi-Role Authentication & Verification Views
import { DEMO_USERS } from '../data/mockDatabase.js';
import { renderPortalSelectionCard, PORTAL_CARDS } from '../components/PortalSelectionCard.js';

/**
 * Landing Page at /login
 * Displays institutional branding and exactly 3 role cards: Student, Faculty, Administrator
 */
export function renderLoginLandingPage() {
  return `
    <div class="min-h-screen bg-[#F4F7FB] flex flex-col justify-between animate-fade-in text-[#18263A]">
      
      <!-- Full SJCEM Institutional Banner Header -->
      <header class="w-full bg-white border-b-2 border-[#073B70] shadow-sm">
        <!-- Primary College Identity Bar -->
        <div class="bg-white px-3 sm:px-8 py-2.5 sm:py-3 flex items-center justify-between max-w-7xl mx-auto gap-2">
          <!-- Left: SJCEM College Crest -->
          <div class="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <img
              src="public/assets/sjcem-logo.png"
              alt="St. John College of Engineering and Management"
              class="h-11 sm:h-16 md:h-20 w-auto object-contain flex-shrink-0"
              onerror="this.style.display='none'"
            />
          </div>

          <!-- Center: Full Institutional Text (matches official letterhead) -->
          <div class="flex-1 text-center px-1.5 sm:px-3">
            <h1 class="text-xs sm:text-2xl lg:text-3xl font-extrabold text-[#073B70] leading-tight tracking-tight font-display">
              ST. JOHN COLLEGE OF ENGINEERING &amp; MANAGEMENT
            </h1>
            <p class="text-[9px] sm:text-sm font-semibold text-slate-700 mt-0.5">
              Autonomous &nbsp;|&nbsp; (A Christian Religious Minority Institute)
            </p>
            <p class="text-[8px] sm:text-xs text-slate-600 mt-0.5 hidden xs:block">
              Approved by AICTE &nbsp;• &nbsp;Recognised by DTE &nbsp;• &nbsp;Affiliated to University of Mumbai, MSBTE
            </p>
            <div class="flex items-center justify-center gap-2 sm:gap-3 mt-0.5 sm:mt-1">
              <span class="text-[9px] sm:text-sm font-extrabold text-[#C62828]">NAAC 'A+' Grade</span>
              <span class="text-slate-300">|</span>
              <span class="text-[9px] sm:text-sm font-bold text-[#C62828]">NBA Accredited</span>
            </div>
          </div>

          <!-- Right: Official ALDEL Trust Logo -->
          <div class="flex items-center justify-end flex-shrink-0">
            <img
              src="public/assets/aldel-logo.png"
              alt="ALDEL Education Trust"
              class="h-10 sm:h-14 md:h-16 w-auto object-contain flex-shrink-0"
              onerror="this.style.display='none'"
            />
          </div>
        </div>

        <!-- Secondary Action Bar -->
        <div class="bg-[#073B70] px-4 sm:px-8 py-1.5 flex items-center justify-between">
          <div class="flex items-center space-x-1.5 text-white">
            <i data-lucide="shield-check" class="w-3.5 h-3.5 text-blue-200"></i>
            <span class="text-[11px] font-semibold tracking-wide">Student MIS — Secure Academic Portal</span>
          </div>
          <div class="flex items-center space-x-3">
            <button
              onclick="window.appOpenQrScanner()"
              class="inline-flex items-center space-x-1.5 px-3 py-1 rounded text-[11px] font-semibold bg-white/10 text-white border border-white/20 hover:bg-white/20 transition"
              title="Scan SJCEM Student or Faculty Digital ID"
            >
              <i data-lucide="scan-line" class="w-3.5 h-3.5"></i>
              <span class="hidden sm:inline">Verify Digital ID</span>
            </button>
          </div>
        </div>
      </header>

      <!-- Center Hero & Role Selection Area -->
      <main class="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 flex flex-col justify-center">
        
        <!-- Header Text -->
        <div class="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
          <div class="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#F0F4FA] border border-[#DCE4EE] text-[#073B70] text-xs font-semibold mb-4">
            <i data-lucide="shield-check" class="w-3.5 h-3.5 text-[#073B70]"></i>
            <span>Student MIS Security Architecture</span>
          </div>

          <h1 class="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Welcome to <span class="text-[#073B70]">Student MIS</span>
          </h1>
          <p class="text-base sm:text-lg font-semibold text-slate-700 mt-2">
            St. John College of Engineering and Management, Palghar
          </p>
          <p class="text-sm text-slate-500 mt-1 italic">
            "Your academics. Your campus. One secure portal."
          </p>
          <p class="text-xs text-slate-400 mt-3">
            Select your authorized portal to authenticate. Access privileges are verified securely after credentials and multi-factor validation.
          </p>
        </div>

        <!-- Exactly Three Prominent Role Cards: Shared PortalSelectionCard Component -->
        <div class="portal-card-grid">
          ${PORTAL_CARDS.map((cardConfig, index) => renderPortalSelectionCard(cardConfig, index)).join('')}
        </div>



      </main>

      <!-- Institutional Footer -->
      <footer class="w-full bg-white border-t border-slate-200 px-4 py-4 text-center text-xs text-slate-500">
        <div class="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2026 St. John College of Engineering and Management (SJCEM), Palghar. All rights reserved.</p>
          <div class="flex items-center space-x-4 text-[11px]">
            <a href="#" onclick="window.appOpenQrScanner(); return false;" class="text-teal-700 hover:underline font-semibold flex items-center gap-1">
              <i data-lucide="qr-code" class="w-3.5 h-3.5"></i>
              <span>Verify Digital ID</span>
            </a>
            <span class="text-slate-300">•</span>
            <span class="text-slate-500">Row-Level Security & Two-Step OTP Enforced</span>
          </div>
        </div>
      </footer>

    </div>
  `;
}

/**
 * Dedicated Login Page for /login/student, /login/faculty, /login/admin
 * Supports:
 * - Step 1: Email + Password validation with strict role check
 * - Step 2: 6-Digit Email OTP Challenge with single-use verification & demo simulated inbox
 */
export function renderDedicatedLoginPage(role = 'student', errorMessage = '', pendingChallenge = null) {
  const roleConfig = {
    student: {
      title: 'Student Portal',
      badge: 'Enrolled Student',
      badgeClass: 'bg-[#F0F4FA] text-[#073B70] border-[#DCE4EE]',
      icon: 'graduation-cap',
      accentColor: 'navy',
      defaultEmail: DEMO_USERS.student.email,
      defaultPassword: DEMO_USERS.student.password || 'DemoSecurePass2026!',
      sampleName: `${DEMO_USERS.student.firstName} ${DEMO_USERS.student.lastName}`,
    },
    faculty: {
      title: 'Faculty Portal',
      badge: 'Academic Staff',
      badgeClass: 'bg-blue-50 text-blue-900 border-blue-200',
      icon: 'briefcase',
      accentColor: 'blue',
      defaultEmail: DEMO_USERS.faculty.email,
      defaultPassword: DEMO_USERS.faculty.password || 'DemoSecurePass2026!',
      sampleName: `${DEMO_USERS.faculty.firstName} ${DEMO_USERS.faculty.lastName}`,
    },
    admin: {
      title: 'Administration Portal',
      badge: 'Authorized Administrator',
      badgeClass: 'bg-purple-50 text-purple-900 border-purple-200',
      icon: 'shield-check',
      accentColor: 'purple',
      defaultEmail: DEMO_USERS.admin.email,
      defaultPassword: DEMO_USERS.admin.password || 'DemoSecurePass2026!',
      sampleName: `${DEMO_USERS.admin.firstName} ${DEMO_USERS.admin.lastName}`,
    },
  }[role] || {
    title: 'Portal Login',
    badge: 'Institutional',
    badgeClass: 'bg-slate-100 text-slate-800 border-slate-300',
    icon: 'user',
    accentColor: 'navy',
    defaultEmail: '',
    defaultPassword: '',
    sampleName: 'Authorized User',
  };

  const isOtpStep = Boolean(pendingChallenge && pendingChallenge.requestedRole === role);

  return `
    <div class="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 flex flex-col justify-between animate-fade-in">
      
      <!-- Full SJCEM Institutional Banner (matches physical letterhead) -->
      <header class="w-full bg-white border-b border-slate-200 shadow-sm">
        <!-- Primary identity bar -->
        <div class="px-3 sm:px-8 py-2.5 sm:py-3 flex items-center justify-between max-w-5xl mx-auto gap-2">
          <!-- Official SJCEM Eye Logo -->
          <img
            src="public/assets/sjcem-logo.png"
            alt="St. John College of Engineering and Management"
            class="h-10 sm:h-14 w-auto object-contain flex-shrink-0"
            onerror="this.style.display='none'"
          />
          <!-- College Name & Accreditation -->
          <div class="flex-1 text-center px-1.5 sm:px-6">
            <h1 class="text-xs sm:text-lg font-extrabold text-blue-900 leading-tight font-display tracking-tight">ST. JOHN COLLEGE OF ENGINEERING &amp; MANAGEMENT</h1>
            <p class="text-[9px] sm:text-xs text-slate-600 font-semibold mt-0.5">Autonomous &nbsp;•&nbsp; NAAC 'A+' Grade &nbsp;•&nbsp; NBA Accredited</p>
            <p class="text-[8px] sm:text-[9px] text-slate-500 mt-0.5 hidden sm:block">Affiliated to University of Mumbai, MSBTE | Approved by AICTE</p>
          </div>
          <!-- ALDEL Logo -->
          <img
            src="public/assets/aldel-logo.png"
            alt="ALDEL Education Trust"
            class="h-9 sm:h-12 w-auto object-contain flex-shrink-0"
            onerror="this.style.display='none'"
          />
        </div>
      </header>

      <!-- Centered Login Content Area -->
      <main class="flex-1 flex flex-col justify-center py-8 px-4 sm:px-6 lg:px-8">
        <div class="sm:mx-auto sm:w-full sm:max-w-md">
          
          <div class="text-center mb-5">
            <div class="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold ${roleConfig.badgeClass} border mb-2 shadow-sm">
              <i data-lucide="${roleConfig.icon}" class="w-3.5 h-3.5"></i>
              <span>${roleConfig.title}</span>
            </div>

            <h2 class="text-2xl font-bold tracking-tight text-slate-900">
              ${isOtpStep ? 'Verify Email OTP' : `Sign In to ${roleConfig.title}`}
            </h2>
            <p class="text-xs text-slate-500 mt-1">
              St. John College of Engineering and Management, Palghar
            </p>
          </div>

          <div class="bg-white p-6 sm:p-8 rounded-2xl shadow-xl border border-slate-200">
            <!-- Navigation and Step directly at the top of the login card -->
            <div class="flex items-center justify-between flex-wrap gap-2 pb-3.5 mb-5 border-b border-slate-100">
              <button
                type="button"
                onclick="window.appNavigate('login')"
                class="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center space-x-1.5 transition"
              >
                <i data-lucide="arrow-left" class="w-3.5 h-3.5"></i>
                <span>Back to Role Selection</span>
              </button>
              <span class="text-xs text-slate-500 font-medium flex items-center gap-1">
                <span>${isOtpStep ? 'Step 2 of 2: Verification' : 'Step 1 of 2: Credentials'}</span>
              </span>
            </div>

          <!-- Error Alert Banner -->
          ${
            errorMessage
              ? `
            <div class="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs mb-5 flex items-start gap-2.5 animate-shake">
              <i data-lucide="alert-circle" class="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5"></i>
              <div class="leading-relaxed font-medium">
                ${errorMessage}
              </div>
            </div>
          `
              : ''
          }

          <!-- STEP 1: Email + Password Credentials Submission -->
          ${
            !isOtpStep
              ? `
            <form onsubmit="window.appHandleCredentialsSubmit(event, '${role}')" class="space-y-4 text-xs">
              <div>
                <label class="block text-slate-700 font-semibold mb-1">
                  Institutional Email Address
                </label>
                <div class="relative">
                  <input
                    id="login-email-input"
                    type="email"
                    required
                    autocomplete="email"
                    placeholder="user@sjcem.edu.in"
                    value="${roleConfig.defaultEmail}"
                    class="w-full px-3.5 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#073B70]/20 focus:border-[#073B70] text-slate-800 font-medium bg-white text-base sm:text-xs"
                  />
                  <div class="absolute right-3 top-2.5 text-slate-400">
                    <i data-lucide="mail" class="w-4 h-4"></i>
                  </div>
                </div>
                <p class="text-[10px] text-slate-400 mt-1">Use your registered @sjcem.edu.in account</p>
              </div>

              <div>
                <div class="flex items-center justify-between mb-1">
                  <label class="block text-slate-700 font-semibold">Account Password</label>
                  <button
                    type="button"
                    onclick="window.appOpenForgotPassword()"
                    class="text-[#073B70] hover:text-[#062B50] hover:underline font-semibold"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div class="relative">
                  <input
                    id="login-password-input"
                    type="password"
                    required
                    autocomplete="current-password"
                    placeholder="••••••••••••"
                    value="${roleConfig.defaultPassword}"
                    class="w-full px-3.5 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#073B70]/20 focus:border-[#073B70] text-slate-800 font-mono bg-white pr-10 text-base sm:text-xs"
                  />
                  <button
                    type="button"
                    onclick="window.appTogglePasswordVisibility('login-password-input')"
                    class="absolute right-3 top-3 text-slate-400 hover:text-slate-600 focus:outline-none"
                    title="Toggle password visibility"
                  >
                    <i data-lucide="eye" class="w-4 h-4"></i>
                  </button>
                </div>
              </div>

              <div class="pt-2 space-y-2">
                <button
                  type="submit"
                  id="login-submit-button"
                  class="w-full py-3.5 sm:py-3 rounded-xl bg-[#073B70] hover:bg-[#062B50] active:scale-[0.99] text-white font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <i data-lucide="shield-check" class="w-4 h-4"></i>
                  <span>Continue to Email Verification →</span>
                </button>

                <button
                  type="button"
                  id="direct-login-btn"
                  onclick="window.appDirectLogin('${role}')"
                  class="w-full py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs transition flex items-center justify-center space-x-1.5"
                >
                  <i data-lucide="zap" class="w-3.5 h-3.5 text-amber-500"></i>
                  <span>One-Click Demo Access (${roleConfig.title})</span>
                </button>
              </div>
            </form>
          `
              : `
            <!-- STEP 2: Email OTP Challenge Verification -->
            <div class="space-y-4 text-xs">
              
              <!-- Development Sandbox Simulation Banner -->
              <div class="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-950">
                <div class="flex items-center justify-between mb-1.5">
                  <div class="flex items-center space-x-1.5 text-[#073B70] font-bold">
                    <i data-lucide="mail-check" class="w-4 h-4 text-[#073B70]"></i>
                    <span>Simulated Email OTP Verification</span>
                  </div>
                  <span class="text-[10px] font-mono bg-blue-100 text-[#073B70] px-1.5 py-0.5 rounded font-bold">Dev Sandbox</span>
                </div>
                <p class="text-[11px] text-slate-700 leading-tight">
                  Development simulation: A single-use verification code has been generated for demo account <strong class="font-mono text-slate-900">${pendingChallenge.email}</strong>. (In production, codes are delivered via institutional SMTP).
                </p>
                <div class="mt-2.5 p-2 bg-white rounded-lg border border-blue-200 flex items-center justify-between">
                  <div>
                    <span class="text-[10px] text-slate-500 uppercase tracking-wider block">Demo Code (Valid for 5 mins):</span>
                    <span class="font-mono text-base font-extrabold tracking-widest text-[#073B70]">${pendingChallenge.otpCode}</span>
                  </div>
                  <button
                    type="button"
                    onclick="document.getElementById('login-otp-input').value = '${pendingChallenge.otpCode}';"
                    class="px-2.5 py-1 text-[11px] bg-[#073B70] hover:bg-[#062B50] text-white font-bold rounded transition"
                  >
                    Auto-Fill Code
                  </button>
                </div>
              </div>

              <form onsubmit="window.appHandleVerifyOtpSubmit(event)" class="space-y-4">
                <div>
                  <label class="block text-slate-700 font-semibold mb-1 text-center">
                    Enter 6-Digit Verification Code
                  </label>
                  <input
                    id="login-otp-input"
                    type="text"
                    inputmode="numeric"
                    pattern="[0-9]{6}"
                    maxlength="6"
                    required
                    autofocus
                    placeholder="••••••"
                    class="w-full text-center text-2xl font-mono tracking-[0.5em] px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#073B70]/20 focus:border-[#073B70] text-slate-900 font-bold bg-white"
                  />
                  <p class="text-[11px] text-slate-400 text-center mt-1.5">
                    Check your institutional inbox for the one-time code.
                  </p>
                </div>

                <div class="pt-2 space-y-2">
                  <button
                    type="submit"
                    class="w-full py-2.5 rounded-xl bg-[#073B70] hover:bg-[#062B50] text-white font-bold text-xs shadow-md transition flex items-center justify-center space-x-2"
                  >
                    <i data-lucide="shield-check" class="w-4 h-4"></i>
                    <span>Verify Code & Sign In</span>
                  </button>

                  <div class="flex items-center justify-between text-[11px] pt-1">
                    <button
                      type="button"
                      onclick="window.appResendOtp()"
                      class="text-[#073B70] hover:text-[#062B50] font-semibold flex items-center space-x-1"
                    >
                      <i data-lucide="refresh-cw" class="w-3 h-3"></i>
                      <span>Resend Verification Code</span>
                    </button>
                    <button
                      type="button"
                      onclick="window.appCancelOtp()"
                      class="text-slate-500 hover:text-slate-800"
                    >
                      Use Different Email
                    </button>
                  </div>
                </div>
              </form>
            </div>
          `
          }



        </div>

        <!-- Security footer -->
        <p class="text-center text-[11px] text-slate-400 mt-5 flex items-center justify-center gap-1.5">
          <i data-lucide="lock" class="w-3.5 h-3.5 text-[#073B70]"></i>
          <span>Secure Session • Cryptographic Row-Level Security</span>
        </p>• Cryptographic Row-Level Security</span>
        </p>
      </div>
      </main>

      <!-- Institutional Footer -->
      <footer class="w-full bg-white border-t border-slate-200 px-4 py-3 text-center text-xs text-slate-500">
        <div class="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-1 text-[11px]">
          <p>© 2026 St. John College of Engineering and Management (SJCEM), Palghar.</p>
          <span class="text-slate-400">Autonomous • NAAC 'A+' • NBA Accredited</span>
        </div>
      </footer>

    </div>
  `;
}

/**
 * Public or Authenticated Verification View (Route: /verify/:token)
 */
export function renderVerificationViewPage(token, result, isScanning = false) {
  if (isScanning) {
    return `
      <div class="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div class="bg-white p-8 rounded-2xl shadow-xl border border-slate-200 max-w-md w-full text-center space-y-4">
          <div class="w-12 h-12 rounded-full border-4 border-teal-600 border-t-transparent animate-spin mx-auto"></div>
          <h3 class="text-lg font-bold text-slate-800">Verifying Digital Identity Token</h3>
          <p class="text-xs text-slate-500">Connecting to SJCEM Row-Level Security Identity Registry...</p>
        </div>
      </div>
    `;
  }

  if (!result || !result.success) {
    const errorTitle = result && result.status === 'REVOKED' 
      ? 'Identity Token Revoked' 
      : result && result.status === 'EXPIRED'
      ? 'Identity Token Expired'
      : 'Invalid Identity Token';

    const errorDesc = result && result.status === 'REVOKED'
      ? 'This QR identity has been officially revoked or reported compromised. A newly generated credential is required.'
      : result && result.status === 'EXPIRED'
      ? 'This digital identity token has expired. The student or faculty member must refresh their credential.'
      : 'The scanned token does not match any verified record in the Student MIS Academic Registry.';

    return `
      <div class="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
        <div class="bg-white p-8 rounded-2xl shadow-xl border border-rose-200 max-w-md w-full text-center space-y-4">
          <div class="w-14 h-14 rounded-full bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center mx-auto">
            <i data-lucide="shield-x" class="w-8 h-8"></i>
          </div>
          <div>
            <h2 class="text-xl font-bold text-slate-900">${errorTitle}</h2>
            <p class="text-xs text-rose-700 font-semibold mt-1">Status: ${result ? result.status : 'INVALID'}</p>
          </div>
          <p class="text-xs text-slate-600 leading-relaxed">
            ${errorDesc}
          </p>
          <div class="p-3 bg-slate-50 rounded-xl border border-slate-200 text-left font-mono text-[11px] text-slate-500 break-all">
            Token: ${token || 'Unknown'}
          </div>
          <div class="pt-2 flex flex-col gap-2">
            <button
              onclick="window.appOpenQrScanner()"
              class="w-full py-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs shadow-md transition flex items-center justify-center space-x-2"
            >
              <i data-lucide="scan-line" class="w-4 h-4"></i>
              <span>Scan Another Digital ID</span>
            </button>
            <button
              onclick="window.appNavigate('login')"
              class="w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition"
            >
              Return to Login
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // Success view (Public minimal or Authenticated comprehensive)
  const isPrivileged = result.viewType === 'AUTHENTICATED';
  const data = result.data;

  return `
    <div class="min-h-screen bg-slate-50 flex flex-col justify-center items-center py-12 px-4 sm:px-6 animate-fade-in text-slate-800">
      
      <!-- Institutional Verification Badge -->
      <div class="max-w-md w-full mb-4 flex items-center justify-between">
        <div class="flex items-center space-x-2.5">
          <img
            src="public/assets/aldel-logo.png"
            alt="ALDEL Education Trust"
            class="h-9 w-auto object-contain flex-shrink-0"
          />
          <span class="text-xs font-bold text-teal-900 uppercase">Student MIS Verification</span>
        </div>
        <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
          isPrivileged ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-slate-100 text-slate-700 border border-slate-200'
        }">
          ${isPrivileged ? 'Institutional View' : 'Public Verification View'}
        </span>
      </div>

      <!-- Verified Digital ID Card Representation -->
      <div class="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full overflow-hidden">
        
        <!-- Header Ribbon -->
        <div class="bg-gradient-to-r from-teal-800 to-emerald-800 text-white px-6 py-4 flex items-center justify-between">
          <div>
            <p class="text-xs font-semibold text-teal-200 uppercase tracking-wider">St. John Technical Campus</p>
            <h3 class="text-base font-bold text-white">Verified Academic Identity</h3>
          </div>
          <div class="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white">
            <i data-lucide="badge-check" class="w-5 h-5 text-emerald-400"></i>
          </div>
        </div>

        <div class="p-6 space-y-4">
          <!-- Identity Summary -->
          <div class="flex items-center space-x-4 pb-4 border-b border-slate-100">
            <div class="w-16 h-16 rounded-2xl bg-teal-50 border-2 border-teal-200 text-teal-900 font-bold text-xl flex items-center justify-center flex-shrink-0">
              ${data.fullName ? data.fullName.split(' ').map(n => n[0]).join('') : 'ID'}
            </div>
            <div>
              <div class="flex items-center space-x-1.5">
                <h4 class="text-lg font-bold text-slate-900 leading-tight">${data.fullName}</h4>
                <i data-lucide="check-circle-2" class="w-4 h-4 text-emerald-600"></i>
              </div>
              <p class="text-xs font-semibold text-teal-800">${data.category}</p>
              <p class="text-[11px] text-slate-500">${data.department}</p>
            </div>
          </div>

          <!-- Verified Details Grid -->
          <div class="grid grid-cols-2 gap-3 text-xs">
            <div class="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
              <span class="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Account Status</span>
              <span class="font-bold text-emerald-700 flex items-center gap-1">
                <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                ${data.status}
              </span>
            </div>

            <div class="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
              <span class="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Institution</span>
              <span class="font-semibold text-slate-700 truncate block">SJCEM Palghar</span>
            </div>

            ${
              isPrivileged
                ? `
              <div class="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span class="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Identifier</span>
                <span class="font-mono font-bold text-slate-800">${data.studentId || data.facultyId || 'SJCEM-ID'}</span>
              </div>

              <div class="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span class="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Academic Program</span>
                <span class="font-semibold text-slate-700">${data.program || data.designation || 'Engineering'}</span>
              </div>

              ${
                data.currentSemester
                  ? `
                <div class="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <span class="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Current Semester</span>
                  <span class="font-bold text-teal-900">Semester ${data.currentSemester} (Div ${data.division || 'A'})</span>
                </div>
              `
                  : ''
              }

              ${
                data.officialEmail
                  ? `
                <div class="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <span class="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Official Contact</span>
                  <span class="font-mono text-[11px] text-slate-700 truncate block">${data.officialEmail}</span>
                </div>
              `
                  : ''
              }
            `
                : `
              <div class="col-span-2 p-2.5 rounded-lg bg-amber-50/70 border border-amber-200 text-amber-900 text-[11px]">
                <div class="flex items-center space-x-1.5 font-bold mb-0.5">
                  <i data-lucide="info" class="w-3.5 h-3.5 text-amber-700"></i>
                  <span>Limited Public Verification</span>
                </div>
                <span>Academic records, grades, and contact details are restricted to authorized institutional viewers under SJCEM RLS policies.</span>
              </div>
            `
            }
          </div>

          <!-- Cryptographic Token Proof -->
          <div class="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[10px] text-slate-500 font-mono">
            <span class="text-slate-400 uppercase tracking-wider block font-sans font-bold mb-1">Opaque Token Signature</span>
            <span class="break-all text-slate-700 font-semibold">${result.token}</span>
          </div>

          <div class="pt-2 flex flex-col gap-2">
            <button
              onclick="window.appOpenQrScanner()"
              class="w-full py-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs shadow-md transition flex items-center justify-center space-x-2"
            >
              <i data-lucide="scan-line" class="w-4 h-4"></i>
              <span>Scan Another Digital ID</span>
            </button>
            <button
              onclick="window.appNavigate('login')"
              class="w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition"
            >
              Back to Portal
            </button>
          </div>

        </div>
      </div>

    </div>
  `;
}

export function renderSessionExpiredScreen() {
  return `
    <div class="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div class="bg-white p-8 rounded-2xl shadow-xl border border-slate-200 max-w-md w-full text-center space-y-4">
        <div class="w-14 h-14 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
          <i data-lucide="clock" class="w-7 h-7"></i>
        </div>
        <h3 class="text-xl font-bold text-slate-800">Session Expired</h3>
        <p class="text-xs text-slate-500 leading-relaxed">
          Your portal session has timed out due to inactivity to protect your private academic records. Please sign in again.
        </p>
        <button
          onclick="window.appNavigate('login')"
          class="w-full py-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs shadow-md transition"
        >
          Return to Login
        </button>
      </div>
    </div>
  `;
}

export function renderUnauthorizedScreen() {
  return `
    <div class="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div class="bg-white p-8 rounded-2xl shadow-xl border border-rose-200 max-w-md w-full text-center space-y-4">
        <div class="w-14 h-14 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <i data-lucide="shield-alert" class="w-7 h-7"></i>
        </div>
        <h3 class="text-xl font-bold text-slate-800">Access Restricted</h3>
        <p class="text-xs text-slate-500 leading-relaxed">
          You do not have the required role permissions to access this administrative module under SJCEM Row-Level Security policies.
        </p>
        <button
          onclick="window.appNavigate('overview')"
          class="w-full py-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs shadow-md transition"
        >
          Return to My Workspace
        </button>
      </div>
    </div>
  `;
}
