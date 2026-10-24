// AI Student Assistant ("SJCEM Campus AI") Engine
// Grounded in verified SJCEM & Aldel institutional knowledge

import { misStore } from './store';
import { INSTITUTION_INFO } from '../data/mockDatabase';

export interface AiChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  suggestedActions?: { label: string; route: string }[];
}

export function queryCampusAi(prompt: string): Promise<string> {
  const query = prompt.toLowerCase().trim();
  const user = misStore.getCurrentUser();
  const attendance = misStore.getAttendance();
  const overall = misStore.getOverallAttendance();
  const todayClasses = misStore.getTodayClasses();
  const notices = misStore.getNotices();
  const certificates = misStore.getCertificates();

  return new Promise((resolve) => {
    setTimeout(() => {
      // 1. Attendance queries
      if (query.includes('attendance') || query.includes('percentage') || query.includes('bunk') || query.includes('shortage')) {
        let resp = `### 📊 Your Attendance Summary\n\n`;
        resp += `• **Overall Attendance:** **${overall.percentage}%** (${overall.attended}/${overall.conducted} lectures attended)\n`;
        resp += `• **Status:** ${overall.percentage >= 75 ? '✅ Satisfies Mumbai University 75% norm.' : '⚠️ Below 75% threshold. Subject to condonation review.'}\n\n`;
        resp += `**Subject Breakdown:**\n`;
        attendance.forEach((att) => {
          resp += `- **${att.subjectCode}** (${att.subjectName}): **${att.percentage}%** (${att.attended}/${att.conducted})\n`;
        });
        resp += `\n*Calculation Note: Attendance % = (Total Attended / Total Conducted) × 100. Laboratory practicals carry double weightage in syllabus hours.*`;
        resolve(resp);
        return;
      }

      // 2. Next class / Timetable queries
      if (query.includes('next class') || query.includes('class') || query.includes('timetable') || query.includes('schedule') || query.includes('today')) {
        let resp = `### 🗓️ Today's Schedule (${todayClasses.length > 0 ? todayClasses[0].dayName : 'Today'})\n\n`;
        if (todayClasses.length === 0) {
          resp += `No regular lectures scheduled today. Check the circulars for scheduled events.`;
        } else {
          todayClasses.forEach((slot, idx) => {
            resp += `${idx + 1}. **${slot.startTime} - ${slot.endTime}**: ${slot.subjectName} (${slot.subjectCode})\n   • Faculty: **${slot.facultyName}**\n   • Location: **${slot.roomNumber}** [${slot.type}]\n\n`;
          });
        }
        resolve(resp);
        return;
      }

      // 3. Notice / circular queries
      if (query.includes('notice') || query.includes('circular') || query.includes('exam form') || query.includes('exam')) {
        const topNotices = notices.slice(0, 3);
        let resp = `### 📢 Latest Official College Circulars\n\n`;
        topNotices.forEach((n) => {
          resp += `• **${n.title}**\n  - Category: *${n.category}* | Published: *${n.publishedDate}* | Priority: **${n.priority}**\n  - Department: ${n.department}\n\n`;
        });
        resp += `You can view full details and download authorized circular attachments from the **Notices & Circulars** module.`;
        resolve(resp);
        return;
      }

      // 4. Bonafide / Certificate procedure
      if (query.includes('bonafide') || query.includes('certificate') || query.includes('leaving') || query.includes('transcript')) {
        let resp = `### 📜 Certificate Request Procedure at SJCEM\n\n`;
        resp += `1. Navigate to **Certificate Services** in the left sidebar.\n`;
        resp += `2. Click **"Request New Certificate"** and select: Bonafide, Leaving Certificate, or Official Transcript.\n`;
        resp += `3. State the verified institutional purpose (e.g., Bank Education Loan, Passport, Bus/Railway Concession, or Higher Studies).\n`;
        resp += `4. An automated reference tracking ID (e.g. \`SJCEM-CERT-2026-XXXX\`) will be generated.\n`;
        resp += `5. Standard processing time is **2 to 3 working days** following Student Section and Principal office endorsement.\n\n`;
        if (certificates.length > 0) {
          resp += `**Your Active Certificate Request:**\n• Ref: \`${certificates[0].referenceNumber}\` (${certificates[0].certificateType}) — Current Status: **${certificates[0].status}**`;
        }
        resolve(resp);
        return;
      }

      // 5. Capstone / Project submission
      if (query.includes('project') || query.includes('capstone') || query.includes('guide') || query.includes('milestone')) {
        let resp = `### 💻 Academic Project Workspace Guidance\n\n`;
        resp += `• **Assigned Guide:** Prof. Anita Deshmukh (Dept of Computer Engineering)\n`;
        resp += `• **Project Title:** AI-Powered Real-time Campus Surveillance & Vehicle Analytics\n`;
        resp += `• **Upcoming Milestone:** Dataset Collection & Model Training (YOLOv8)\n\n`;
        resp += `To submit project deliverables, go to **Projects** → click **"Submit Progress Update"** to attach your PDF report or slides for mentor review and formal approval.`;
        resolve(resp);
        return;
      }

      // 6. Railway concession / Fee / Admin contacts
      if (query.includes('railway') || query.includes('concession') || query.includes('contact') || query.includes('office') || query.includes('phone') || query.includes('address')) {
        let resp = `### 🏛️ SJCEM Administrative Information\n\n`;
        resp += `• **Institution:** ${INSTITUTION_INFO.name}\n`;
        resp += `• **Campus Address:** ${INSTITUTION_INFO.location}\n`;
        resp += `• **Student Section Counter Hours:** Mon - Fri: 10:30 AM to 01:30 PM & 02:30 PM to 04:30 PM\n`;
        resp += `• **Phone:** ${INSTITUTION_INFO.contacts.phone}\n`;
        resp += `• **Registrar Email:** \`${INSTITUTION_INFO.contacts.email}\`\n`;
        resp += `• **Examination Cell:** \`${INSTITUTION_INFO.contacts.examCellEmail}\`\n\n`;
        resp += `*Railway concession passes are stamped at Counter 3 upon presentation of physical College Identity Card.*`;
        resolve(resp);
        return;
      }

      // Default contextual response
      let fallback = `Hello ${user.firstName}! I am your **SJCEM Campus AI Assistant**.\n\n`;
      fallback += `I can assist you with:\n`;
      fallback += `• Checking your real-time subject-wise attendance and shortage alerts\n`;
      fallback += `• Showing your upcoming lectures, practical labs, and faculty locations\n`;
      fallback += `• Summarizing Mumbai University examination guidelines and deadlines\n`;
      fallback += `• Guiding you through Bonafide, Transcript, and Leaving Certificate requests\n`;
      fallback += `• Tracking your Capstone Project Phase I milestone submissions\n\n`;
      fallback += `Try one of the suggested prompts below, or ask a specific question regarding college regulations.`;
      resolve(fallback);
    }, 450);
  });
}
