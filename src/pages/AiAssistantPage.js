// SJCEM NEXT MIS AI Student Assistant ("SJCEM Campus AI")
import { misStore } from '../services/store.js';

let assistantChatMessages = [
  {
    id: 'msg-0',
    sender: 'assistant',
    text: `Hello Rahul! I am **SJCEM Campus AI**, your personal academic copilot. I am connected to your authenticated records at St. John College of Engineering and Management.\n\nAsk me about your attendance, today's schedule, Mumbai University circulars, or how to submit certificate and project requests!`,
    timestamp: 'Just now',
  },
];

export function getAiChatMessages() {
  return assistantChatMessages;
}

export function addAiChatMessage(sender, text) {
  assistantChatMessages.push({
    id: `msg-${Date.now()}`,
    sender,
    text,
    timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
  });
}

export function renderAiAssistantPage() {
  const suggestedPrompts = [
    'What is my attendance in each subject?',
    'Show my next class today.',
    'Are there any new examination notices?',
    'How do I request a bonafide certificate?',
    'How do I submit my capstone project update?',
    'What are the college office hours and contact numbers?',
  ];

  return `
    <div class="h-[calc(100vh-130px)] flex flex-col card-subtle bg-white overflow-hidden animate-fade-in border-slate-200">
      <!-- Assistant Header -->
      <div class="p-4 border-b border-slate-200 bg-gradient-to-r from-teal-900 to-teal-800 text-white flex items-center justify-between flex-shrink-0">
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-teal-200">
            <i data-lucide="sparkles" class="w-5 h-5 text-emerald-400"></i>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h3 class="font-bold text-white text-base">SJCEM Campus AI Assistant</h3>
              <span class="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.2 rounded-full font-bold border border-emerald-400/30">
                Grounded MIS Core
              </span>
            </div>
            <p class="text-xs text-teal-100/80">Authorized Student Assistant • St. John Technical Campus</p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <button
            onclick="window.appClearAiChat()"
            class="text-xs text-teal-200 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg border border-white/20 transition flex items-center gap-1.5"
          >
            <i data-lucide="rotate-ccw" class="w-3.5 h-3.5"></i>
            <span>Reset Chat</span>
          </button>
        </div>
      </div>

      <!-- Chat Messages Container -->
      <div id="ai-messages-container" class="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-slate-50/50">
        ${assistantChatMessages
          .map((msg) => {
            const isUser = msg.sender === 'user';
            return `
            <div class="flex items-start space-x-3 ${isUser ? 'flex-row-reverse space-x-reverse' : ''}">
              <div class="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-white ${
                isUser ? 'bg-teal-800' : 'bg-[#19685F]'
              }">
                <i data-lucide="${isUser ? 'user' : 'bot'}" class="w-4 h-4"></i>
              </div>

              <div class="max-w-2xl rounded-2xl p-4 text-xs md:text-sm leading-relaxed ${
                isUser
                  ? 'bg-teal-800 text-white rounded-tr-none shadow-sm'
                  : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none shadow-sm'
              }">
                <div class="whitespace-pre-line">${msg.text}</div>
                <span class="block text-[10px] mt-2 font-mono ${isUser ? 'text-teal-200 text-right' : 'text-slate-400'}">
                  ${msg.timestamp}
                </span>
              </div>
            </div>
          `;
          })
          .join('')}
      </div>

      <!-- Suggested Quick Prompt Chips -->
      <div class="p-3 bg-white border-t border-slate-100 flex items-center gap-2 overflow-x-auto flex-shrink-0">
        <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap pl-2">
          Suggested:
        </span>
        ${suggestedPrompts
          .map(
            (prompt) => `
          <button
            onclick="window.appSendAiPrompt('${prompt.replace(/'/g, "\\'")}')"
            class="px-3 py-1.5 rounded-full bg-slate-100 hover:bg-teal-50 hover:text-teal-800 hover:border-teal-300 text-slate-600 text-xs whitespace-nowrap border border-slate-200 transition font-medium flex-shrink-0"
          >
            ${prompt}
          </button>
        `
          )
          .join('')}
      </div>

      <!-- Chat Input Field -->
      <div class="p-3 md:p-4 bg-white border-t border-slate-200 flex-shrink-0">
        <form onsubmit="window.appHandleAiSubmit(event)" class="flex items-center space-x-3">
          <input
            id="ai-user-input"
            type="text"
            placeholder="Ask a question about your attendance, classes, notices, or certificates..."
            class="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-xs md:text-sm focus:outline-none focus:border-teal-700 focus:bg-white transition"
          />
          <button
            type="submit"
            class="px-5 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-semibold text-xs md:text-sm shadow-sm transition flex items-center gap-2 flex-shrink-0"
          >
            <span>Send</span>
            <i data-lucide="send" class="w-4 h-4"></i>
          </button>
        </form>
        <p class="text-[10px] text-slate-400 mt-2 text-center">
          SJCEM Campus AI responses are grounded strictly in your verified records & University of Mumbai regulations.
        </p>
      </div>
    </div>
  `;
}
