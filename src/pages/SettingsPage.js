// SJCEM NEXT MIS Account & Institutional Settings Page
import { misStore } from '../services/store.js';

export function renderSettingsPage() {
  const user = misStore.getCurrentUser();

  return `
    <div class="space-y-6 animate-fade-in pb-12">
      <!-- Header -->
      <div class="card-subtle p-6 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <h2 class="text-xl md:text-2xl font-bold text-slate-800">Account & Security Settings</h2>
            <span class="text-xs px-2.5 py-0.5 rounded-full font-bold bg-teal-50 text-teal-800 border border-teal-200">
              User Preferences
            </span>
          </div>
          <p class="text-xs md:text-sm text-slate-500">
            Manage your authenticated session credentials, multi-factor authentication, and notification triggers.
          </p>
        </div>
      </div>

      <!-- Settings Sections Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- 1. Account Security & Password Change -->
        <div class="card-subtle p-5 md:p-6 bg-white space-y-4">
          <div class="flex items-center space-x-2 pb-3 border-b border-slate-100">
            <i data-lucide="lock" class="w-5 h-5 text-teal-800"></i>
            <h3 class="font-bold text-slate-800 text-base">Password & Authentication Security</h3>
          </div>

          <form onsubmit="window.appHandleChangePassword(event)" class="space-y-3 text-xs">
            <div>
              <label class="block text-slate-600 font-semibold mb-1">Current Password</label>
              <input
                type="password"
                required
                placeholder="••••••••••••"
                class="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-700"
              />
            </div>
            <div>
              <label class="block text-slate-600 font-semibold mb-1">New Password (Min 8 chars, 1 number, 1 special)</label>
              <input
                type="password"
                required
                placeholder="••••••••••••"
                class="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-700"
              />
            </div>
            <div>
              <label class="block text-slate-600 font-semibold mb-1">Confirm New Password</label>
              <input
                type="password"
                required
                placeholder="••••••••••••"
                class="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-700"
              />
            </div>

            <div class="pt-2">
              <button
                type="submit"
                class="px-4 py-2 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-semibold text-xs shadow-sm transition"
              >
                Update Password
              </button>
            </div>
          </form>

          <!-- 2FA Box -->
          <div class="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
            <div>
              <span class="font-bold text-slate-800 block">Two-Factor Authentication (2FA)</span>
              <span class="text-slate-400">Protect account with Authenticator App or SMS OTP</span>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked class="sr-only peer" onchange="window.appToast('2FA setting saved', 'success')">
              <div class="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-800"></div>
            </label>
          </div>
        </div>

        <!-- 2. Notification Preferences -->
        <div class="card-subtle p-5 md:p-6 bg-white space-y-4">
          <div class="flex items-center space-x-2 pb-3 border-b border-slate-100">
            <i data-lucide="bell" class="w-5 h-5 text-teal-800"></i>
            <h3 class="font-bold text-slate-800 text-base">Notification Channels</h3>
          </div>

          <div class="space-y-3 text-xs">
            <div class="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <span class="font-bold text-slate-800 block">University Examination Circulars</span>
                <span class="text-slate-400">Instant in-app and SMS alert on exam schedules</span>
              </div>
              <input type="checkbox" checked class="accent-teal-800 w-4 h-4 cursor-pointer" onchange="window.appToast('Preferences updated')">
            </div>

            <div class="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <span class="font-bold text-slate-800 block">Attendance Defaulter Warning</span>
                <span class="text-slate-400">Weekly alert if any course drops under 75%</span>
              </div>
              <input type="checkbox" checked class="accent-teal-800 w-4 h-4 cursor-pointer" onchange="window.appToast('Preferences updated')">
            </div>

            <div class="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <span class="font-bold text-slate-800 block">Certificate Status Transition</span>
                <span class="text-slate-400">Notification when bonafide/transcript is approved</span>
              </div>
              <input type="checkbox" checked class="accent-teal-800 w-4 h-4 cursor-pointer" onchange="window.appToast('Preferences updated')">
            </div>

            <div class="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <span class="font-bold text-slate-800 block">Campus Placement Opportunities</span>
                <span class="text-slate-400">Notifications from Training & Placement Cell</span>
              </div>
              <input type="checkbox" checked class="accent-teal-800 w-4 h-4 cursor-pointer" onchange="window.appToast('Preferences updated')">
            </div>
          </div>
        </div>

        <!-- 3. Active Sessions & Device Log -->
        <div class="card-subtle p-5 md:p-6 bg-white space-y-4">
          <div class="flex items-center space-x-2 pb-3 border-b border-slate-100">
            <i data-lucide="smartphone" class="w-5 h-5 text-teal-800"></i>
            <h3 class="font-bold text-slate-800 text-base">Active Logged-in Devices</h3>
          </div>

          <div class="space-y-2.5 text-xs">
            <div class="p-3 rounded-xl bg-teal-50/50 border border-teal-200 flex items-center justify-between">
              <div class="flex items-center space-x-3">
                <i data-lucide="monitor" class="w-5 h-5 text-teal-800"></i>
                <div>
                  <span class="font-bold text-slate-800 block">Current Browser Session (Windows / Chrome)</span>
                  <span class="text-[10px] text-teal-800 font-mono">IP: 172.16.24.108 • Palghar, MH (Active now)</span>
                </div>
              </div>
              <span class="text-[10px] bg-teal-800 text-white px-2 py-0.5 rounded font-bold">This Device</span>
            </div>

            <div class="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div class="flex items-center space-x-3">
                <i data-lucide="smartphone" class="w-5 h-5 text-slate-400"></i>
                <div>
                  <span class="font-bold text-slate-800 block">Android Mobile App (Samsung Galaxy)</span>
                  <span class="text-[10px] text-slate-400 font-mono">Last active: Yesterday 07:15 PM</span>
                </div>
              </div>
              <button onclick="window.appToast('Remote session terminated', 'success')" class="text-rose-600 hover:text-rose-800 font-semibold text-xs">
                Revoke
              </button>
            </div>
          </div>
        </div>

        <!-- 4. Data Privacy & GDPR/DPDP Export -->
        <div class="card-subtle p-5 md:p-6 bg-white space-y-4 flex flex-col justify-between">
          <div>
            <div class="flex items-center space-x-2 pb-3 border-b border-slate-100">
              <i data-lucide="shield" class="w-5 h-5 text-teal-800"></i>
              <h3 class="font-bold text-slate-800 text-base">Data Privacy & Archival Export</h3>
            </div>
            <p class="text-xs text-slate-500 mt-2 leading-relaxed">
              In compliance with Digital Personal Data Protection (DPDP) Act, you may download a complete JSON archive of all your academic attendance logs, internal marks, and request status records.
            </p>
          </div>

          <div class="pt-4 border-t border-slate-100 flex items-center justify-between">
            <span class="text-xs text-slate-400 font-mono">Encrypted Student Archive</span>
            <button
              onclick="window.appExportStudentDataArchive()"
              class="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs transition flex items-center gap-1.5"
            >
              <i data-lucide="download" class="w-3.5 h-3.5"></i>
              <span>Download Full Data Archive (JSON)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}
