// Application State & Persistence Service for SJCEM NEXT MIS
import {
  UserProfile,
  AttendanceRecord,
  AttendanceLog,
  TimetableSlot,
  InternalMark,
  SemesterResult,
  Notice,
  StudyResource,
  ProjectWorkspace,
  CertificateRequest,
  NotificationItem,
  SupportTicket,
  AuditLogItem,
  UserRole,
} from '../types';

import {
  DEMO_USERS,
  INITIAL_ATTENDANCE,
  INITIAL_ATTENDANCE_LOGS,
  INITIAL_TIMETABLE,
  INITIAL_INTERNAL_MARKS,
  INITIAL_SEMESTER_RESULTS,
  INITIAL_NOTICES,
  INITIAL_STUDY_RESOURCES,
  INITIAL_PROJECT,
  INITIAL_CERTIFICATES,
  INITIAL_NOTIFICATIONS,
  INITIAL_SUPPORT_TICKETS,
  INITIAL_AUDIT_LOGS,
} from '../data/mockDatabase';

class MisStore {
  private currentUser: UserProfile;
  private attendance: AttendanceRecord[];
  private attendanceLogs: AttendanceLog[];
  private timetable: TimetableSlot[];
  private internalMarks: InternalMark[];
  private semesterResults: SemesterResult[];
  private notices: Notice[];
  private resources: StudyResource[];
  private project: ProjectWorkspace;
  private certificates: CertificateRequest[];
  private notifications: NotificationItem[];
  private tickets: SupportTicket[];
  private auditLogs: AuditLogItem[];
  private listeners: Set<() => void> = new Set();

  constructor() {
    // Try to load persisted state or use defaults
    this.currentUser = this.load('sjcem_user', DEMO_USERS.student);
    this.attendance = this.load('sjcem_attendance', INITIAL_ATTENDANCE);
    this.attendanceLogs = this.load('sjcem_attendance_logs', INITIAL_ATTENDANCE_LOGS);
    this.timetable = this.load('sjcem_timetable', INITIAL_TIMETABLE);
    this.internalMarks = this.load('sjcem_marks', INITIAL_INTERNAL_MARKS);
    this.semesterResults = this.load('sjcem_results', INITIAL_SEMESTER_RESULTS);
    this.notices = this.load('sjcem_notices', INITIAL_NOTICES);
    this.resources = this.load('sjcem_resources', INITIAL_STUDY_RESOURCES);
    this.project = this.load('sjcem_project', INITIAL_PROJECT);
    this.certificates = this.load('sjcem_certificates', INITIAL_CERTIFICATES);
    this.notifications = this.load('sjcem_notifications', INITIAL_NOTIFICATIONS);
    this.tickets = this.load('sjcem_tickets', INITIAL_SUPPORT_TICKETS);
    this.auditLogs = this.load('sjcem_audit_logs', INITIAL_AUDIT_LOGS);
  }

  private load<T>(key: string, fallback: T): T {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : fallback;
    } catch {
      return fallback;
    }
  }

  private save<T>(key: string, data: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.warn('Storage save failed:', e);
    }
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((fn) => fn());
  }

  // ================= Auth & User =================
  public getCurrentUser(): UserProfile {
    return this.currentUser;
  }

  public switchRole(role: UserRole): void {
    if (DEMO_USERS[role]) {
      this.currentUser = DEMO_USERS[role];
      this.save('sjcem_user', this.currentUser);
      this.addAuditLog('SWITCH_ROLE', 'user_roles', `Switched active role to ${role}`);
      this.notify();
    }
  }

  public updateProfileContact(data: Partial<UserProfile>): void {
    this.currentUser = { ...this.currentUser, ...data };
    this.save('sjcem_user', this.currentUser);
    this.addAuditLog('UPDATE_PROFILE', 'profiles', 'Updated personal contact details');
    this.notify();
  }

  public logout(): void {
    // Reset to student demo for presentation or clear session
    this.addAuditLog('LOGOUT', 'profiles', `User ${this.currentUser.email} logged out`);
    this.currentUser = DEMO_USERS.student;
    this.save('sjcem_user', this.currentUser);
    this.notify();
  }

  // ================= Attendance =================
  public getAttendance(): AttendanceRecord[] {
    return this.attendance;
  }

  public getAttendanceLogs(): AttendanceLog[] {
    return this.attendanceLogs;
  }

  public getOverallAttendance(): { percentage: number; attended: number; conducted: number } {
    const totalAttended = this.attendance.reduce((acc, curr) => acc + curr.attended, 0);
    const totalConducted = this.attendance.reduce((acc, curr) => acc + curr.conducted, 0);
    const percentage = totalConducted > 0 ? (totalAttended / totalConducted) * 100 : 0;
    return {
      percentage: Math.round(percentage * 10) / 10,
      attended: totalAttended,
      conducted: totalConducted,
    };
  }

  public facultyRecordAttendance(subjectCode: string, studentPresent: boolean, topic: string): void {
    const record = this.attendance.find((r) => r.subjectCode === subjectCode);
    if (record) {
      record.conducted += 1;
      if (studentPresent) record.attended += 1;
      record.percentage = Math.round((record.attended / record.conducted) * 1000) / 10;
      record.status = record.percentage >= 75 ? 'SAFE' : record.percentage >= 65 ? 'WARNING' : 'CRITICAL';
      this.save('sjcem_attendance', this.attendance);
    }

    const newLog: AttendanceLog = {
      id: `log-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      time: '11:15 - 12:15',
      subjectCode,
      subjectName: record?.subjectName || subjectCode,
      type: 'LECTURE',
      status: studentPresent ? 'PRESENT' : 'ABSENT',
      facultyName: this.currentUser.firstName + ' ' + this.currentUser.lastName,
    };
    this.attendanceLogs.unshift(newLog);
    this.save('sjcem_attendance_logs', this.attendanceLogs);

    this.addAuditLog(
      'RECORD_ATTENDANCE',
      'attendance_sessions',
      `Marked attendance for ${subjectCode}. Student ${studentPresent ? 'Present' : 'Absent'}. Topic: ${topic}`
    );
    this.notify();
  }

  // ================= Timetable =================
  public getTimetable(): TimetableSlot[] {
    return this.timetable;
  }

  public getTodayClasses(): TimetableSlot[] {
    // Return Friday classes for demo representation (matches current system day)
    return this.timetable.filter((slot) => slot.dayOfWeek === 5);
  }

  // ================= Marks & Results =================
  public getInternalMarks(): InternalMark[] {
    return this.internalMarks;
  }

  public facultyUpdateMarks(subjectCode: string, ia1: number, ia2: number): void {
    const mark = this.internalMarks.find((m) => m.subjectCode === subjectCode);
    if (mark) {
      mark.ia1 = ia1;
      mark.ia2 = ia2;
      mark.average = Math.round(((ia1 + ia2) / 2) * 100) / 100;
      this.save('sjcem_marks', this.internalMarks);
      this.addAuditLog('UPDATE_MARKS', 'assessment_marks', `Updated IA marks for ${subjectCode}: IA1=${ia1}, IA2=${ia2}`);
      this.notify();
    }
  }

  public getSemesterResults(): SemesterResult[] {
    return this.semesterResults;
  }

  // ================= Notices =================
  public getNotices(): Notice[] {
    return this.notices;
  }

  public markNoticeRead(noticeId: string, isRead = true): void {
    const notice = this.notices.find((n) => n.id === noticeId);
    if (notice) {
      notice.isRead = isRead;
      this.save('sjcem_notices', this.notices);
      this.notify();
    }
  }

  public publishNotice(noticeData: Omit<Notice, 'id' | 'publishedDate' | 'isRead'>): void {
    const newNotice: Notice = {
      ...noticeData,
      id: `not-${Date.now()}`,
      publishedDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      isRead: false,
    };
    this.notices.unshift(newNotice);
    this.save('sjcem_notices', this.notices);

    // Add in-app notification for all users
    this.addNotification({
      title: `Notice: ${newNotice.title}`,
      message: `${newNotice.department} published a new circular. Priority: ${newNotice.priority}`,
      type: 'NOTICE',
      targetPath: 'notices',
    });

    this.addAuditLog('PUBLISH_NOTICE', 'notices', `Published notice: ${newNotice.title}`);
    this.notify();
  }

  // ================= Study Resources =================
  public getStudyResources(): StudyResource[] {
    return this.resources;
  }

  public uploadStudyResource(resource: Omit<StudyResource, 'id' | 'uploadDate' | 'downloadsCount'>): void {
    const newRes: StudyResource = {
      ...resource,
      id: `res-${Date.now()}`,
      uploadDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      downloadsCount: 0,
    };
    this.resources.unshift(newRes);
    this.save('sjcem_resources', this.resources);

    this.addNotification({
      title: `New Material: ${newRes.title}`,
      message: `${newRes.uploadedBy} uploaded notes for ${newRes.subjectCode}`,
      type: 'ACADEMIC',
      targetPath: 'resources',
    });

    this.addAuditLog('UPLOAD_RESOURCE', 'study_resources', `Uploaded material: ${newRes.title}`);
    this.notify();
  }

  // ================= Projects =================
  public getProject(): ProjectWorkspace {
    return this.project;
  }

  public submitProjectUpdate(title: string, notes: string): void {
    const newSubmission = {
      id: `sub-${Date.now()}`,
      title,
      version: `v1.${this.project.submissions.length + 1}`,
      submittedDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      documentName: `SJCEM_ProjectUpdate_${Date.now()}.pdf`,
      status: 'PENDING' as const,
      feedback: 'Pending mentor review',
    };
    this.project.submissions.unshift(newSubmission);
    this.save('sjcem_project', this.project);

    this.addAuditLog('SUBMIT_PROJECT', 'project_submissions', `Submitted project milestone update: ${title}`);
    this.notify();
  }

  public facultyReviewProject(submissionId: string, feedback: string, approved: boolean): void {
    const sub = this.project.submissions.find((s) => s.id === submissionId);
    if (sub) {
      sub.status = 'REVIEWED';
      sub.feedback = feedback;
      if (approved) {
        // Mark current pending milestone as completed
        const pendingMilestone = this.project.milestones.find((m) => !m.isCompleted);
        if (pendingMilestone) {
          pendingMilestone.isCompleted = true;
          pendingMilestone.remarks = feedback;
        }
      }
      this.save('sjcem_project', this.project);

      this.addNotification({
        title: 'Project Feedback Received',
        message: `${this.currentUser.firstName} reviewed submission "${sub.title}": ${feedback.substring(0, 50)}...`,
        type: 'PROJECT',
        targetPath: 'projects',
      });

      this.addAuditLog('REVIEW_PROJECT', 'project_reviews', `Reviewed submission: ${sub.title}. Approved=${approved}`);
      this.notify();
    }
  }

  // ================= Certificates =================
  public getCertificates(): CertificateRequest[] {
    return this.certificates;
  }

  public requestCertificate(type: CertificateRequest['certificateType'], purpose: string): CertificateRequest {
    const refNum = `SJCEM-CERT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const nowStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const newCert: CertificateRequest = {
      id: `cert-${Date.now()}`,
      referenceNumber: refNum,
      certificateType: type,
      purpose,
      submittedDate: nowStr,
      lastUpdated: nowStr,
      status: 'SUBMITTED',
      timeline: [
        {
          date: `${nowStr} (Online)`,
          status: 'SUBMITTED',
          actor: `${this.currentUser.firstName} ${this.currentUser.lastName} (Student)`,
          remarks: `Initiated ${type} request with purpose: ${purpose}`,
        },
      ],
    };

    this.certificates.unshift(newCert);
    this.save('sjcem_certificates', this.certificates);

    this.addNotification({
      title: 'Certificate Request Submitted',
      message: `Your request ${refNum} has been logged and sent to Student Section for verification.`,
      type: 'CERTIFICATE',
      targetPath: 'certificates',
    });

    this.addAuditLog('REQUEST_CERTIFICATE', 'certificate_requests', `Submitted request ${refNum} for ${type}`);
    this.notify();
    return newCert;
  }

  public adminUpdateCertificate(
    certId: string,
    status: CertificateRequest['status'],
    remarks: string,
    documentName?: string
  ): void {
    const cert = this.certificates.find((c) => c.id === certId);
    if (cert) {
      cert.status = status;
      cert.lastUpdated = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      cert.adminRemarks = remarks;
      if (documentName) cert.issuedDocumentName = documentName;

      cert.timeline.unshift({
        date: `${cert.lastUpdated} ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`,
        status,
        actor: `${this.currentUser.firstName} ${this.currentUser.lastName} (Admin)`,
        remarks,
      });

      this.save('sjcem_certificates', this.certificates);

      this.addNotification({
        title: `Certificate Status: ${status}`,
        message: `Your request ${cert.referenceNumber} is now ${status}. ${remarks}`,
        type: 'CERTIFICATE',
        targetPath: 'certificates',
      });

      this.addAuditLog('UPDATE_CERTIFICATE', 'certificate_requests', `Updated ${cert.referenceNumber} to ${status}`);
      this.notify();
    }
  }

  // ================= Notifications =================
  public getNotifications(): NotificationItem[] {
    return this.notifications;
  }

  public getUnreadNotificationCount(): number {
    return this.notifications.filter((n) => !n.isRead).length;
  }

  public markNotificationRead(id: string): void {
    const item = this.notifications.find((n) => n.id === id);
    if (item) {
      item.isRead = true;
      this.save('sjcem_notifications', this.notifications);
      this.notify();
    }
  }

  public markAllNotificationsRead(): void {
    this.notifications.forEach((n) => (n.isRead = true));
    this.save('sjcem_notifications', this.notifications);
    this.notify();
  }

  public addNotification(item: Omit<NotificationItem, 'id' | 'timestamp' | 'isRead'>): void {
    const newItem: NotificationItem = {
      ...item,
      id: `ntf-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      isRead: false,
    };
    this.notifications.unshift(newItem);
    this.save('sjcem_notifications', this.notifications);
    this.notify();
  }

  // ================= Support Tickets =================
  public getSupportTickets(): SupportTicket[] {
    return this.tickets;
  }

  public createSupportTicket(subject: string, category: string, priority: SupportTicket['priority'], description: string): SupportTicket {
    const ticketNum = `SJCEM-SUP-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const newTkt: SupportTicket = {
      id: `tkt-${Date.now()}`,
      ticketNumber: ticketNum,
      subject,
      category,
      priority,
      status: 'OPEN',
      createdDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      description,
    };
    this.tickets.unshift(newTkt);
    this.save('sjcem_tickets', this.tickets);

    this.addAuditLog('CREATE_TICKET', 'support_tickets', `Created ticket ${ticketNum}: ${subject}`);
    this.notify();
    return newTkt;
  }

  // ================= Audit Logs =================
  public getAuditLogs(): AuditLogItem[] {
    return this.auditLogs;
  }

  private addAuditLog(action: string, entityName: string, details: string): void {
    const newLog: AuditLogItem = {
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      actorName: `${this.currentUser.firstName} ${this.currentUser.lastName}`,
      actorRole: this.currentUser.role,
      action,
      entityName,
      details,
      ipAddress: '172.16.24.108',
    };
    this.auditLogs.unshift(newLog);
    if (this.auditLogs.length > 50) this.auditLogs.pop();
    this.save('sjcem_audit_logs', this.auditLogs);
  }

  // ================= Global Search =================
  public globalSearch(query: string): { title: string; subtitle: string; category: string; route: string }[] {
    if (!query || query.trim().length < 2) return [];
    const q = query.toLowerCase().trim();
    const results: { title: string; subtitle: string; category: string; route: string }[] = [];

    // Search notices
    this.notices.forEach((n) => {
      if (n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)) {
        results.push({
          title: n.title,
          subtitle: `Notice • ${n.category} • ${n.publishedDate}`,
          category: 'Notice',
          route: 'notices',
        });
      }
    });

    // Search resources
    this.resources.forEach((r) => {
      if (r.title.toLowerCase().includes(q) || r.subjectName.toLowerCase().includes(q)) {
        results.push({
          title: r.title,
          subtitle: `${r.subjectCode} • ${r.resourceType} • Uploaded by ${r.uploadedBy}`,
          category: 'Study Resource',
          route: 'resources',
        });
      }
    });

    // Search timetable
    this.timetable.forEach((t) => {
      if (t.subjectName.toLowerCase().includes(q) || t.subjectCode.toLowerCase().includes(q) || t.facultyName.toLowerCase().includes(q)) {
        results.push({
          title: `${t.subjectCode}: ${t.subjectName}`,
          subtitle: `${t.dayName} ${t.startTime}-${t.endTime} • ${t.roomNumber} (${t.facultyName})`,
          category: 'Timetable',
          route: 'timetable',
        });
      }
    });

    // Search certificates
    this.certificates.forEach((c) => {
      if (c.referenceNumber.toLowerCase().includes(q) || c.certificateType.toLowerCase().includes(q) || c.purpose.toLowerCase().includes(q)) {
        results.push({
          title: `${c.certificateType} (${c.referenceNumber})`,
          subtitle: `Status: ${c.status} • Purpose: ${c.purpose}`,
          category: 'Certificate',
          route: 'certificates',
        });
      }
    });

    return results.slice(0, 8);
  }
}

export const misStore = new MisStore();
