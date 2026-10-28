// Application State & Persistence Service for SJCEM NEXT MIS
import type {
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
  QrRegistryItem,
  ImportedStudent,
  IntegrationConfig,
  StudentLookupAuditLog,
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
  INITIAL_QR_REGISTRY,
  INITIAL_IMPORTED_STUDENTS,
  INITIAL_INTEGRATION_CONFIG,
  INITIAL_STUDENT_LOOKUP_AUDIT_LOGS,
} from '../data/mockDatabase';

export interface PendingAuthChallenge {
  user: UserProfile;
  email: string;
  requestedRole: string;
  otpCode: string;
  expiresAt: number;
  attemptCount: number;
}

export interface AuthResult {
  success: boolean;
  user?: UserProfile;
  role?: string;
  error?: string;
  message?: string;
  email?: string;
  isSimulatedOtp?: boolean;
}

class MisStore {
  private currentUser: UserProfile | null;
  private isAuthenticated: boolean;
  private sessionToken: string | null;
  private pendingAuthChallenge: PendingAuthChallenge | null = null;
  private qrRegistry: QrRegistryItem[];
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
  private importedStudents: ImportedStudent[];
  private integrationConfig: IntegrationConfig;
  private lookupAuditLogs: StudentLookupAuditLog[];
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.currentUser = this.load<UserProfile | null>('sjcem_user', null);
    this.isAuthenticated = this.load<boolean>('sjcem_is_auth', false);
    this.sessionToken = this.load<string | null>('sjcem_session_token', null);

    if (!this.sessionToken || !this.currentUser) {
      this.isAuthenticated = false;
      this.currentUser = null;
    } else if (this.currentUser && this.currentUser.role && DEMO_USERS[this.currentUser.role]) {
      const demoRef = DEMO_USERS[this.currentUser.role];
      if (this.currentUser.id === demoRef.id) {
        this.currentUser = {
          ...demoRef,
          ...this.currentUser,
          auth_user_id: demoRef.auth_user_id || this.currentUser.auth_user_id,
          fullName: demoRef.fullName || this.currentUser.fullName,
          name: demoRef.name || this.currentUser.name,
          institutional_id: demoRef.institutional_id || this.currentUser.institutional_id,
          facultyId: demoRef.facultyId || this.currentUser.facultyId,
          adminId: demoRef.adminId || this.currentUser.adminId,
          studentId: demoRef.studentId || this.currentUser.studentId,
        };
        this.save('sjcem_user', this.currentUser);
      }
    }

    this.qrRegistry = this.load<QrRegistryItem[]>('sjcem_qr_registry', INITIAL_QR_REGISTRY);
    this.attendance = this.load<AttendanceRecord[]>('sjcem_attendance', INITIAL_ATTENDANCE);
    this.attendanceLogs = this.load<AttendanceLog[]>('sjcem_attendance_logs', INITIAL_ATTENDANCE_LOGS);
    this.timetable = this.load<TimetableSlot[]>('sjcem_timetable', INITIAL_TIMETABLE);
    this.internalMarks = this.load<InternalMark[]>('sjcem_marks', INITIAL_INTERNAL_MARKS);
    this.semesterResults = this.load<SemesterResult[]>('sjcem_results', INITIAL_SEMESTER_RESULTS);
    this.notices = this.load<Notice[]>('sjcem_notices', INITIAL_NOTICES);
    this.resources = this.load<StudyResource[]>('sjcem_resources', INITIAL_STUDY_RESOURCES);
    this.project = this.load<ProjectWorkspace>('sjcem_project', INITIAL_PROJECT);
    this.certificates = this.load<CertificateRequest[]>('sjcem_certificates', INITIAL_CERTIFICATES);
    this.notifications = this.load<NotificationItem[]>('sjcem_notifications', INITIAL_NOTIFICATIONS);
    this.tickets = this.load<SupportTicket[]>('sjcem_tickets', INITIAL_SUPPORT_TICKETS);
    this.auditLogs = this.load<AuditLogItem[]>('sjcem_audit_logs', INITIAL_AUDIT_LOGS);
    this.importedStudents = this.load<ImportedStudent[]>('sjcem_imported_students', INITIAL_IMPORTED_STUDENTS);
    this.integrationConfig = this.load<IntegrationConfig>('sjcem_integration_config', INITIAL_INTEGRATION_CONFIG);
    this.lookupAuditLogs = this.load<StudentLookupAuditLog[]>('sjcem_lookup_audit_logs', INITIAL_STUDENT_LOOKUP_AUDIT_LOGS);
  }

  private load<T>(key: string, fallback: T): T {
    try {
      if (typeof localStorage === 'undefined') return fallback;
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : fallback;
    } catch {
      return fallback;
    }
  }

  private save<T>(key: string, data: T): void {
    try {
      if (typeof localStorage === 'undefined') return;
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
  public isUserAuthenticated(): boolean {
    return this.isAuthenticated && this.currentUser !== null;
  }

  public getCurrentUser(): UserProfile | null {
    return this.currentUser;
  }

  public getPendingAuthChallenge(): PendingAuthChallenge | null {
    return this.pendingAuthChallenge;
  }

  public clearPendingAuthChallenge(): void {
    this.pendingAuthChallenge = null;
    this.notify();
  }

  public directLogin(email?: string, password?: string, requestedRole?: string): AuthResult {
    if (password && ['student', 'faculty', 'coordinator', 'admin'].includes(password) && !requestedRole) {
      requestedRole = password;
      password = '';
    }

    const cleanEmail = (email || '').trim().toLowerCase();
    let matchedUser: UserProfile | null = null;

    if (cleanEmail) {
      for (const key of Object.keys(DEMO_USERS)) {
        if (DEMO_USERS[key].email.toLowerCase() === cleanEmail) {
          matchedUser = { ...DEMO_USERS[key] };
          break;
        }
      }
      if (!matchedUser) {
        return {
          success: false,
          error: 'ACCOUNT_NOT_FOUND',
          message: 'No institutional account registered with this email address.',
        };
      }
    } else if (requestedRole && DEMO_USERS[requestedRole]) {
      matchedUser = { ...DEMO_USERS[requestedRole] };
    } else {
      return {
        success: false,
        error: 'INVALID_CREDENTIALS',
        message: 'Institutional account or role identifier is required.',
      };
    }

    if (requestedRole && matchedUser.role !== requestedRole) {
      this.addAuditLog(
        'LOGIN_ROLE_MISMATCH',
        'auth_challenges',
        `Account ${matchedUser.email} (${matchedUser.role}) attempted unauthorized access to ${requestedRole} portal.`
      );
      return {
        success: false,
        error: 'UNAUTHORIZED_ROLE',
        message: `This account is authorized for the ${matchedUser.role.toUpperCase()} portal, not the ${requestedRole.toUpperCase()} portal.`,
      };
    }

    this.currentUser = { ...matchedUser };
    this.isAuthenticated = true;
    this.sessionToken = `sjcem_sess_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    this.pendingAuthChallenge = null;

    this.save('sjcem_user', this.currentUser);
    this.save('sjcem_is_auth', true);
    this.save('sjcem_session_token', this.sessionToken);

    this.addAuditLog(
      'LOGIN_SUCCESS',
      'profiles',
      `Direct login succeeded for ${this.currentUser.email} [${this.currentUser.role.toUpperCase()}]`
    );

    this.notify();
    return { success: true, user: this.currentUser, role: this.currentUser.role };
  }

  public initiateLogin(email: string, _password?: string, requestedRole?: string): AuthResult {
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail) {
      return { success: false, error: 'MISSING_EMAIL', message: 'Please enter your institutional email address.' };
    }

    let matchedUser: UserProfile | null = null;
    for (const key of Object.keys(DEMO_USERS)) {
      if (DEMO_USERS[key].email.toLowerCase() === cleanEmail) {
        matchedUser = { ...DEMO_USERS[key] };
        break;
      }
    }

    if (!matchedUser) {
      return { success: false, error: 'ACCOUNT_NOT_FOUND', message: 'No account registered with this email.' };
    }

    if (requestedRole && matchedUser.role !== requestedRole) {
      return {
        success: false,
        error: 'UNAUTHORIZED_ROLE',
        message: `This account is authorized for ${matchedUser.role.toUpperCase()}, not ${requestedRole.toUpperCase()}.`,
      };
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    this.pendingAuthChallenge = {
      user: matchedUser,
      email: cleanEmail,
      requestedRole: requestedRole || matchedUser.role,
      otpCode,
      expiresAt: Date.now() + 5 * 60 * 1000,
      attemptCount: 0,
    };

    this.addAuditLog('AUTH_OTP_ISSUED', 'email_otp_challenges', `Generated verification code for ${cleanEmail}`);
    this.notify();
    return { success: true, email: cleanEmail, isSimulatedOtp: true };
  }

  public verifyLoginOtp(enteredOtp: string): AuthResult {
    if (!this.pendingAuthChallenge) {
      return { success: false, error: 'NO_CHALLENGE', message: 'No active verification challenge.' };
    }

    if (Date.now() > this.pendingAuthChallenge.expiresAt) {
      this.pendingAuthChallenge = null;
      this.notify();
      return { success: false, error: 'OTP_EXPIRED', message: 'Verification code has expired. Please request a new code.' };
    }

    const cleanInput = (enteredOtp || '').toString().trim();
    if (cleanInput !== this.pendingAuthChallenge.otpCode) {
      this.pendingAuthChallenge.attemptCount += 1;
      return { success: false, error: 'INVALID_OTP', message: 'Invalid verification code.' };
    }

    this.currentUser = { ...this.pendingAuthChallenge.user };
    this.isAuthenticated = true;
    this.sessionToken = `sjcem_sess_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    this.pendingAuthChallenge = null;

    this.save('sjcem_user', this.currentUser);
    this.save('sjcem_is_auth', true);
    this.save('sjcem_session_token', this.sessionToken);

    this.addAuditLog('LOGIN_SUCCESS', 'profiles', `OTP verified for ${this.currentUser.email}`);
    this.notify();
    return { success: true, user: this.currentUser, role: this.currentUser.role };
  }

  public resendLoginOtp(): { success: boolean; demoOtp?: string; message?: string } {
    if (!this.pendingAuthChallenge) return { success: false, message: 'No challenge in progress.' };
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    this.pendingAuthChallenge.otpCode = otpCode;
    this.pendingAuthChallenge.expiresAt = Date.now() + 5 * 60 * 1000;
    this.pendingAuthChallenge.attemptCount = 0;
    this.notify();
    return { success: true, demoOtp: otpCode };
  }

  public logout(): void {
    if (this.currentUser) {
      this.addAuditLog('LOGOUT', 'profiles', `User ${this.currentUser.email} logged out. Session terminated.`);
    }
    this.currentUser = null;
    this.isAuthenticated = false;
    this.sessionToken = null;
    this.pendingAuthChallenge = null;

    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('sjcem_user');
        localStorage.removeItem('sjcem_is_auth');
        localStorage.removeItem('sjcem_session_token');
      }
    } catch {
      // Storage unavailable
    }
    this.notify();
  }

  public updateProfileContact(data: Partial<UserProfile>): void {
    if (!this.currentUser) return;
    this.currentUser = { ...this.currentUser, ...data };
    this.save('sjcem_user', this.currentUser);
    this.addAuditLog('UPDATE_PROFILE', 'profiles', 'Updated personal contact details');
    this.notify();
  }

  // ================= QR Identity System =================
  public getUserQrRecord(userId?: string): QrRegistryItem | null {
    const idToFind = userId || (this.currentUser ? this.currentUser.id : null);
    if (!idToFind) return null;
    let rec = this.qrRegistry.find((r) => r.userId === idToFind && !r.isRevoked);
    if (!rec) rec = this.qrRegistry.find((r) => r.userId === idToFind);
    if (rec) {
      return {
        ...rec,
        role: rec.role || (rec.userType ? rec.userType.toLowerCase() : 'student'),
        status: rec.status || (rec.isRevoked ? 'REVOKED' : rec.isExpired ? 'EXPIRED' : 'ACTIVE'),
        facultyId: rec.facultyId || (rec.userType === 'Faculty' ? rec.employeeId : undefined),
        adminId: rec.adminId || (rec.userType === 'Admin' ? rec.employeeId : undefined),
        institutional_id: rec.institutional_id || rec.studentId || rec.facultyId || rec.adminId || rec.employeeId,
      };
    }
    return null;
  }

  public revokeAndRegenerateQrToken(userId: string, reason: string): QrRegistryItem | null {
    const oldIndex = this.qrRegistry.findIndex((r) => r.userId === userId && !r.isRevoked);
    if (oldIndex !== -1) {
      this.qrRegistry[oldIndex].isRevoked = true;
      this.qrRegistry[oldIndex].revokedAt = new Date().toISOString().split('T')[0];
      this.qrRegistry[oldIndex].revokedReason = reason;
      this.qrRegistry[oldIndex].status = 'REVOKED';
    }

    const randomSuffix = Math.random().toString(36).substring(2, 10);
    const u = this.currentUser;
    const newRecord: QrRegistryItem = {
      token: `sjcem_sec_${randomSuffix}`,
      userId,
      userType: u && u.role === 'faculty' ? 'Faculty' : u && u.role === 'admin' ? 'Admin' : 'Student',
      fullName: u?.fullName || (u ? `${u.firstName} ${u.lastName}` : 'Verified User'),
      department: u?.department || 'Computer Engineering',
      institutional_id: u?.institutional_id || u?.studentId || u?.facultyId || u?.adminId || u?.employeeId,
      facultyId: u?.facultyId,
      adminId: u?.adminId,
      studentId: u?.studentId,
      employeeId: u?.employeeId,
      isRevoked: false,
      isExpired: false,
      expiresAt: '2027-06-30',
      createdAt: new Date().toISOString().split('T')[0],
      scanCount: 0,
      avatarUrl: u?.avatarUrl,
      status: 'ACTIVE',
    };

    this.qrRegistry.unshift(newRecord);
    this.save('sjcem_qr_registry', this.qrRegistry);
    this.addAuditLog('REVOKE_QR_TOKEN', 'qr_token_registry', `Revoked old token and reissued new token for user ${userId}. Reason: ${reason}`);
    this.notify();
    return newRecord;
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

  // ================= Timetable =================
  public getTimetable(): TimetableSlot[] {
    return this.timetable;
  }

  public getTodayClasses(): TimetableSlot[] {
    return this.timetable.filter((slot) => slot.dayOfWeek === 5);
  }

  // ================= Marks & Results =================
  public getInternalMarks(): InternalMark[] {
    return this.internalMarks;
  }

  public getSemesterResults(): SemesterResult[] {
    return this.semesterResults;
  }

  // ================= Notices =================
  public getNotices(): Notice[] {
    return this.notices;
  }

  public publishNotice(notice: Partial<Notice>): void {
    const newNotice: Notice = {
      id: `notice-${Date.now()}`,
      title: notice.title || 'Official Academic Notice',
      content: notice.content || '',
      category: notice.category || 'ACADEMIC',
      priority: notice.priority || 'NORMAL',
      targetAudience: notice.targetAudience || 'ALL',
      department: notice.department || 'Computer Engineering',
      publishedDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      isPinned: Boolean(notice.isPinned),
      authorName: this.currentUser ? `${this.currentUser.firstName} ${this.currentUser.lastName}` : 'Academic Office',
      attachmentName: notice.attachmentName,
      isRead: false,
    };
    this.notices.unshift(newNotice);
    this.save('sjcem_notices', this.notices);
    this.addAuditLog('PUBLISH_NOTICE', 'notices', `Published notice: ${newNotice.title}`);
    this.notify();
  }

  // ================= Resources =================
  public getResources(): StudyResource[] {
    return this.resources;
  }

  // ================= Projects =================
  public getProject(): ProjectWorkspace {
    return this.project;
  }

  // ================= Certificates =================
  public getCertificates(): CertificateRequest[] {
    return this.certificates;
  }

  public submitCertificateRequest(certificateType: CertificateRequest['certificateType'], purpose: string): CertificateRequest {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const ref = `SJCEM-CERT-2026-${randomNum}`;
    const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    const newRequest: CertificateRequest = {
      id: `cert-${Date.now()}`,
      referenceNumber: ref,
      certificateType,
      purpose,
      submittedDate: today,
      lastUpdated: today,
      status: 'SUBMITTED',
      timeline: [
        {
          date: today,
          status: 'SUBMITTED',
          actor: this.currentUser ? `${this.currentUser.firstName} ${this.currentUser.lastName}` : 'Student',
          remarks: 'Application submitted through Student MIS portal.',
        },
      ],
    };

    this.certificates.unshift(newRequest);
    this.save('sjcem_certificates', this.certificates);
    this.addAuditLog('REQUEST_CERTIFICATE', 'certificate_requests', `Submitted ${certificateType} request ${ref}`);
    this.notify();
    return newRequest;
  }

  public updateCertificateStatus(id: string, newStatus: CertificateRequest['status'], remarks?: string): void {
    const cert = this.certificates.find((c) => c.id === id);
    if (!cert) return;

    const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    cert.status = newStatus;
    cert.lastUpdated = today;
    if (remarks) cert.adminRemarks = remarks;

    cert.timeline.push({
      date: today,
      status: newStatus,
      actor: this.currentUser ? `${this.currentUser.firstName} ${this.currentUser.lastName}` : 'Admin',
      remarks: remarks || `Status updated to ${newStatus}`,
    });

    this.save('sjcem_certificates', this.certificates);
    this.addAuditLog('UPDATE_CERTIFICATE_STATUS', 'certificate_requests', `Updated ${cert.referenceNumber} to ${newStatus}`);
    this.notify();
  }

  // ================= Notifications =================
  public getNotifications(): NotificationItem[] {
    return this.notifications;
  }

  public getUnreadNotificationCount(): number {
    return this.notifications.filter((n) => !n.isRead).length;
  }

  public markNotificationAsRead(id: string): void {
    const item = this.notifications.find((n) => n.id === id);
    if (item && !item.isRead) {
      item.isRead = true;
      this.save('sjcem_notifications', this.notifications);
      this.notify();
    }
  }

  public markAllNotificationsAsRead(): void {
    this.notifications.forEach((n) => (n.isRead = true));
    this.save('sjcem_notifications', this.notifications);
    this.notify();
  }

  // ================= Support Tickets =================
  public getTickets(): SupportTicket[] {
    return this.tickets;
  }

  public submitSupportTicket(subject: string, category: string, priority: SupportTicket['priority'], description: string): SupportTicket {
    const num = Math.floor(1000 + Math.random() * 9000);
    const today = new Date().toISOString().split('T')[0];
    const ticket: SupportTicket = {
      id: `ticket-${Date.now()}`,
      ticketNumber: `TCK-${num}`,
      subject,
      category,
      priority,
      status: 'OPEN',
      createdDate: today,
      description,
    };
    this.tickets.unshift(ticket);
    this.save('sjcem_tickets', this.tickets);
    this.addAuditLog('CREATE_SUPPORT_TICKET', 'support_tickets', `Created ticket ${ticket.ticketNumber}: ${subject}`);
    this.notify();
    return ticket;
  }

  // ================= Audit Logs =================
  public getAuditLogs(): AuditLogItem[] {
    return this.auditLogs;
  }

  public addAuditLog(action: string, entityName: string, details: string): void {
    const newLog: AuditLogItem = {
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      actorName: this.currentUser ? `${this.currentUser.firstName} ${this.currentUser.lastName}` : 'System Session',
      actorRole: this.currentUser ? this.currentUser.role : 'system',
      action,
      entityName,
      details,
      ipAddress: '172.16.24.108',
    };
    this.auditLogs.unshift(newLog);
    if (this.auditLogs.length > 100) this.auditLogs.pop();
    this.save('sjcem_audit_logs', this.auditLogs);
  }

  // ================= Student Retrieval & Integration =================
  public getImportedStudents(): ImportedStudent[] {
    return this.importedStudents;
  }

  public findStudentByPid(pid: string): ImportedStudent | null {
    if (!pid) return null;
    const clean = pid.trim().toLowerCase();
    return (
      this.importedStudents.find(
        (s) =>
          (s.studentId && s.studentId.toLowerCase() === clean) ||
          (s.pid && s.pid.toLowerCase() === clean) ||
          (s.prn && s.prn.toLowerCase() === clean) ||
          (s.rollNumber && s.rollNumber.toLowerCase() === clean)
      ) || null
    );
  }

  public getIntegrationConfig(): IntegrationConfig {
    return this.integrationConfig;
  }

  public getLookupAuditLogs(): StudentLookupAuditLog[] {
    return this.lookupAuditLogs;
  }
}

export const misStore = new MisStore();
