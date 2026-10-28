// SJCEM Student MIS — Shared Reusable Portal Selection Card Component
// Institution: St. John College of Engineering and Management, Palghar
// Purpose: Guarantees 100% unified geometry, layout alignment, typography, and button positioning across Student, Faculty, and Admin cards.

/**
 * Standard configuration for all three institutional portals.
 * Ensures consistent data flow and role-specific thematic styling.
 */
export const PORTAL_CARDS = [
  {
    role: 'student',
    title: 'Student Portal',
    statusLabel: 'Enrolled',
    icon: 'graduation-cap',
    description: 'Access attendance, timetable, internal marks, results, projects, and student services.',
    primaryButtonLabel: 'Continue as Student',
    demoButtonLabel: 'One-Click Student Demo',
    helperText: 'Requires verified @sjcem.edu.in email',
    targetRoute: 'login-student',
    theme: {
      accentBarClass: 'bg-[#073B70]',
      hoverBorderClass: 'hover:border-[#073B70]',
      iconBgClass: 'bg-[#F0F4FA]',
      iconTextClass: 'text-[#073B70]',
      iconBorderClass: 'border-[#DCE4EE]',
      iconHoverClass: 'group-hover:bg-[#073B70] group-hover:text-white',
      badgeClass: 'text-[#073B70] bg-[#F0F4FA] border-[#DCE4EE]',
      primaryBtnClass: 'bg-[#073B70] hover:bg-[#062B50] text-white',
      focusRingClass: 'focus:ring-2 focus:ring-[#073B70]/40',
    },
  },
  {
    role: 'faculty',
    title: 'Faculty Portal',
    statusLabel: 'Staff',
    icon: 'briefcase',
    description: 'Manage assigned classes, attendance, assessments, notices, and student projects.',
    primaryButtonLabel: 'Continue as Faculty',
    demoButtonLabel: 'One-Click Faculty Demo',
    helperText: 'Institutional faculty credentials required',
    targetRoute: 'login-faculty',
    theme: {
      accentBarClass: 'bg-[#178579]',
      hoverBorderClass: 'hover:border-[#178579]',
      iconBgClass: 'bg-teal-50',
      iconTextClass: 'text-[#178579]',
      iconBorderClass: 'border-teal-200',
      iconHoverClass: 'group-hover:bg-[#178579] group-hover:text-white',
      badgeClass: 'text-[#178579] bg-teal-50 border-teal-200',
      primaryBtnClass: 'bg-[#073B70] hover:bg-[#062B50] text-white',
      focusRingClass: 'focus:ring-2 focus:ring-[#178579]/40',
    },
  },
  {
    role: 'admin',
    title: 'Administration Portal',
    statusLabel: 'Executive',
    icon: 'shield-check',
    description: 'Manage authorized institutional operations, users, academic records, requests, and system configuration.',
    primaryButtonLabel: 'Continue as Administrator',
    demoButtonLabel: 'One-Click Admin Demo',
    helperText: 'Authorized administrative role verification required',
    targetRoute: 'login-admin',
    theme: {
      accentBarClass: 'bg-[#062B50]',
      hoverBorderClass: 'hover:border-[#062B50]',
      iconBgClass: 'bg-slate-100',
      iconTextClass: 'text-slate-800',
      iconBorderClass: 'border-slate-300',
      iconHoverClass: 'group-hover:bg-[#062B50] group-hover:text-white',
      badgeClass: 'text-slate-700 bg-slate-100 border-slate-200',
      primaryBtnClass: 'bg-[#062B50] hover:bg-[#041E38] text-white',
      focusRingClass: 'focus:ring-2 focus:ring-[#062B50]/40',
    },
  },
];

/**
 * Shared Portal Selection Card Renderer
 * Uses unified classes from main.css for strict dimensional harmony.
 *
 * @param {import('../types/index.ts').PortalCardConfig} config
 * @param {number} [index=0]
 * @returns {string} HTML string
 */
export function renderPortalSelectionCard(config, index = 0) {
  const {
    role,
    title,
    statusLabel,
    icon,
    description,
    primaryButtonLabel,
    demoButtonLabel,
    helperText,
    targetRoute,
    theme = {},
  } = config;

  // On tablet (768-1023px), card index 2 (Admin) centers across both columns cleanly
  const tabletSpanClass = index === 2 ? 'md:col-span-2 md:max-w-md md:w-full md:mx-auto lg:col-span-1 lg:max-w-none lg:mx-0' : '';

  return `
    <div
      id="portal-card-${role}"
      data-testid="portal-card-${role}"
      class="portal-selection-card group ${tabletSpanClass} ${theme.hoverBorderClass || ''}"
    >
      <!-- Top Role Accent Strip (Fixed 6px height) -->
      <div class="portal-card-accent-bar ${theme.accentBarClass || 'bg-[#073B70]'}"></div>

      <!-- Icon Container (Strictly uniform 48x48px box) -->
      <div class="portal-card-icon-wrapper ${theme.iconBgClass || 'bg-slate-100'} ${theme.iconTextClass || 'text-slate-800'} ${theme.iconBorderClass || 'border-slate-200'} ${theme.iconHoverClass || ''}">
        <i data-lucide="${icon}" class="w-6 h-6"></i>
      </div>

      <!-- Card Header: Title & Status Badge (Uniform vertical height) -->
      <div class="portal-card-header">
        <h3 class="portal-card-title">${title}</h3>
        <span class="portal-card-badge ${theme.badgeClass || 'bg-slate-100 text-slate-700 border-slate-200'}">${statusLabel}</span>
      </div>

      <!-- Description Area (Guaranteed consistent reserved height) -->
      <p class="portal-card-desc">
        ${description}
      </p>

      <!-- Action Area (Pinned to Bottom via mt-auto) -->
      <div class="portal-card-actions">
        <!-- Primary Login Button (Full width, fixed 44px height) -->
        <button
          id="btn-portal-login-${role}"
          type="button"
          onclick="window.appNavigate('${targetRoute}')"
          class="portal-card-primary-btn ${theme.primaryBtnClass || 'bg-[#073B70] text-white'} ${theme.focusRingClass || ''}"
          aria-label="${primaryButtonLabel}"
        >
          <span>${primaryButtonLabel}</span>
          <i data-lucide="arrow-right" class="w-4 h-4"></i>
        </button>

        <!-- Secondary One-Click Demo Button (Full width, fixed 36px height) -->
        <button
          id="btn-portal-demo-${role}"
          type="button"
          onclick="window.appDirectLogin('${role}')"
          class="portal-card-demo-btn"
          title="Direct Demo Access for ${title}"
          aria-label="${demoButtonLabel}"
        >
          <i data-lucide="zap" class="w-3.5 h-3.5 text-amber-500"></i>
          <span>${demoButtonLabel}</span>
        </button>

        <!-- Helper Text Footer (Reserved vertical height so 1 or 2 lines don't shift buttons) -->
        <div class="portal-card-helper">
          <span>${helperText}</span>
        </div>
      </div>
    </div>
  `;
}
