// SJCEM NEXT MIS Notification Center Dropdown
import { misStore } from '../../services/store.js';

export function renderNotificationCenter() {
  const notifications = misStore.getNotifications();
  const unreadCount = misStore.getUnreadNotificationCount();

  return `
    <div id="notification-backdrop" style="display:none;" class="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm" onclick="window.appToggleNotifications(false)"></div>
    <div
      id="notification-center-drawer"
      style="display:none;"
      class="fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-white shadow-2xl border-l border-slate-200 flex flex-col animate-fade-in"
    >
      <!-- Header -->
      <div class="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
        <div class="flex items-center space-x-2">
          <i data-lucide="bell" class="w-5 h-5 text-teal-800"></i>
          <h3 class="font-bold text-slate-800 text-sm">Notifications</h3>
          ${
            unreadCount > 0
              ? `
            <span class="px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
              ${unreadCount} New
            </span>
          `
              : ''
          }
        </div>
        <div class="flex items-center space-x-2">
          ${
            unreadCount > 0
              ? `
            <button
              onclick="window.appMarkAllNotificationsRead()"
              class="text-xs text-teal-700 hover:text-teal-900 font-medium hover:underline"
            >
              Mark all read
            </button>
          `
              : ''
          }
          <button
            onclick="window.appToggleNotifications(false)"
            class="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200"
            title="Close"
          >
            <i data-lucide="x" class="w-4 h-4"></i>
          </button>
        </div>
      </div>

      <!-- Notification Items List -->
      <div class="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1">
        ${
          notifications.length === 0
            ? `
          <div class="p-8 text-center text-slate-400">
            <i data-lucide="bell-off" class="w-8 h-8 mx-auto mb-2 text-slate-300"></i>
            <p class="text-xs">No notifications right now.</p>
          </div>
        `
            : notifications
                .map((n) => {
                  const typeColors = {
                    CERTIFICATE: 'bg-emerald-50 text-emerald-800 border-emerald-200',
                    NOTICE: 'bg-amber-50 text-amber-800 border-amber-200',
                    PROJECT: 'bg-blue-50 text-blue-800 border-blue-200',
                    ACADEMIC: 'bg-purple-50 text-purple-800 border-purple-200',
                    GENERAL: 'bg-slate-50 text-slate-700 border-slate-200',
                  };

                  return `
            <div
              onclick="window.appHandleNotificationClick('${n.id}', '${n.targetPath}')"
              class="p-3 rounded-xl transition cursor-pointer flex items-start space-x-3 ${
                n.isRead ? 'bg-white hover:bg-slate-50 opacity-80' : 'bg-teal-50/50 hover:bg-teal-50 border border-teal-100'
              }"
            >
              <div class="w-2 h-2 rounded-full mt-2 flex-shrink-0 ${n.isRead ? 'bg-transparent' : 'bg-teal-600'}"></div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between gap-1 mb-1">
                  <span class="text-[10px] font-semibold px-1.5 py-0.5 rounded border ${typeColors[n.type] || typeColors.GENERAL}">
                    ${n.type}
                  </span>
                  <span class="text-[10px] text-slate-400 whitespace-nowrap">${n.timestamp}</span>
                </div>
                <h4 class="text-xs font-bold text-slate-800 mb-0.5 line-clamp-1">${n.title}</h4>
                <p class="text-xs text-slate-600 line-clamp-2 leading-relaxed">${n.message}</p>
              </div>
            </div>
          `;
                })
                .join('')
        }
      </div>

      <!-- Footer Info -->
      <div class="p-3 bg-slate-50 border-t border-slate-200 text-center">
        <p class="text-[11px] text-slate-500">Official updates from SJCEM Registrar & Departments</p>
      </div>
    </div>
  `;
}
