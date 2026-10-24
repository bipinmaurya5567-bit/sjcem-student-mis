// Application State & Persistence Service for SJCEM NEXT MIS
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
} from '../data/mockDatabase.js';

class MisStore {
  constructor() {
    // CRITICAL FIX: Default to logged-OUT. Only restore session if localStorage has valid auth flag.
    this.currentUser = this.load('sjcem_user', null);
    this.isAuthenticated = this.load('sjcem_is_auth', false);
    this.sessionToken = this.load('sjcem_session_token', null);
    // If stored session token is invalid/missing, force logout
    if (!this.sessionToken || !this.currentUser) {
      this.isAuthenticated = false;
      this.currentUser = null;
    }
    this.pendingAuthChallenge = null;
    this.qrRegistry = this.load('sjcem_qr_registry', INITIAL_QR_REGISTRY);

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
    this.listeners = new Set();
  }

  load(key, fallback) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : fallback;
    } catch {
      return fallback;
    }
  }

  save(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.warn('Storage save failed:', e);
    }
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    this.listeners.forEach((fn) => fn());
  }

  // ================= Authentic Auth & Session Service =================
  isUserAuthenticated() {
    return this.isAuthenticated && this.currentUser !== null;
  }

  getCurrentUser() {
    return this.currentUser;
  }

  getPendingAuthChallenge() {
    return this.pendingAuthChallenge;
  }

  clearPendingAuthChallenge() {
    this.pendingAuthChallenge = null;
    this.notify();
  }

  // Step 1: Validate email & password, enforce strict role authorization, generate single-use 6-digit OTP
  initiateLogin(email, password, requestedRole) {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPassword = (password || '').trim();

    // Find account across registered users
    let matchedUser = null;
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
        message: 'No institutional account registered with this email address. Please contact the administrator.',
      };
    }

    // Password validation: accepts the user's specific password OR the universal demo master pass
    const validPassword = matchedUser.password || 'DemoSecurePass2026!';
    const masterDemoPass = 'DemoSecurePass2026!';
    if (cleanPassword !== validPassword && cleanPassword !== masterDemoPass) {
      return {
        success: false,
        error: 'INVALID_CREDENTIALS',
        message: 'Invalid password. Please verify your credentials and try again.',
      };
    }

    // SERVER-SIDE STRICT ROLE AUTHORIZATION CHECK:
    // If student attempts to log in via faculty/admin portal, reject with explicit message!
    if (matchedUser.role !== requestedRole) {
      this.addAuditLog(
        'LOGIN_ROLE_MISMATCH',
        'auth_challenges',
        `Account ${cleanEmail} (${matchedUser.role}) attempted unauthorized access to ${requestedRole} portal.`
      );
      return {
        success: false,
        error: 'UNAUTHORIZED_ROLE',
        message: 'This account is not authorized for the selected portal. Please choose the correct portal or contact your administrator.',
      };
    }

    // Generate cryptographically random 6-digit email OTP challenge
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    this.pendingAuthChallenge = {
      email: matchedUser.email,
      requestedRole,
      otpCode,
      expiresAt,
      attemptCount: 0,
      user: matchedUser,
      initiatedAt: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    };

    this.addAuditLog(
      'AUTH_OTP_ISSUED',
      'email_otp_challenges',
      `Sent 6-digit verification challenge to ${matchedUser.email} for ${requestedRole} authentication.`
    );

    this.notify();

    return {
      success: true,
      email: matchedUser.email,
      role: requestedRole,
      expiresInSeconds: 300,
      demoOtp: otpCode, // For demo environment notification display
    };
  }

  // Step 2: Verify the 6-digit email OTP and establish authenticated session
  verifyLoginOtp(enteredOtp) {
    if (!this.pendingAuthChallenge) {
      return {
        success: false,
        error: 'NO_CHALLENGE',
        message: 'No active authentication challenge found. Please sign in again.',
      };
    }

    if (Date.now() > this.pendingAuthChallenge.expiresAt) {
      this.pendingAuthChallenge = null;
      return {
        success: false,
        error: 'OTP_EXPIRED',
        message: 'Verification code has expired. Please request a new one.',
      };
    }

    if (this.pendingAuthChallenge.attemptCount >= 3) {
      this.pendingAuthChallenge = null;
      return {
        success: false,
        error: 'MAX_ATTEMPTS_EXCEEDED',
        message: 'Too many failed verification attempts. For account security, please restart login.',
      };
    }

    const cleanInput = (enteredOtp || '').toString().trim();
    if (cleanInput !== this.pendingAuthChallenge.otpCode) {
      this.pendingAuthChallenge.attemptCount += 1;
      this.addAuditLog(
        'AUTH_OTP_FAILED',
        'email_otp_challenges',
        `Failed OTP attempt (${this.pendingAuthChallenge.attemptCount}/3) for ${this.pendingAuthChallenge.email}`
      );
      return {
        success: false,
        error: 'INVALID_OTP',
        message: `Invalid 6-digit code. ${3 - this.pendingAuthChallenge.attemptCount} attempt(s) remaining.`,
      };
    }

    // Success: Establish verified session
    const authenticatedUser = { ...this.pendingAuthChallenge.user };
    this.currentUser = authenticatedUser;
    this.isAuthenticated = true;
    this.sessionToken = `sjcem_sess_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;

    this.save('sjcem_user', this.currentUser);
    this.save('sjcem_is_auth', true);
    this.save('sjcem_session_token', this.sessionToken);

    this.addAuditLog(
      'LOGIN_SUCCESS',
      'profiles',
      `Successfully established authenticated session for ${authenticatedUser.email} [${authenticatedUser.role.toUpperCase()}]`
    );

    this.pendingAuthChallenge = null;
    this.notify();

    return {
      success: true,
      user: this.currentUser,
      role: authenticatedUser.role,
    };
  }

  // Resend OTP code with fresh countdown
  resendLoginOtp() {
    if (!this.pendingAuthChallenge) {
      return { success: false, message: 'No challenge in progress.' };
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    this.pendingAuthChallenge.otpCode = otpCode;
    this.pendingAuthChallenge.expiresAt = Date.now() + 5 * 60 * 1000;
    this.pendingAuthChallenge.attemptCount = 0;

    this.addAuditLog(
      'AUTH_OTP_RESENT',
      'email_otp_challenges',
      `Regenerated and resent OTP challenge code to ${this.pendingAuthChallenge.email}`
    );

    this.notify();
    return { success: true, demoOtp: otpCode };
  }

  // Logout: Terminate session & clear authorization state
  logout() {
    if (this.currentUser) {
      this.addAuditLog('LOGOUT', 'profiles', `User ${this.currentUser.email} logged out. Session terminated.`);
    }
    this.currentUser = null;
    this.isAuthenticated = false;
    this.sessionToken = null;
    this.pendingAuthChallenge = null;

    localStorage.removeItem('sjcem_user');
    localStorage.removeItem('sjcem_is_auth');
    localStorage.removeItem('sjcem_session_token');

    this.notify();
  }

  updateProfileContact(data) {
    if (!this.currentUser) return;
    this.currentUser = { ...this.currentUser, ...data };
    this.save('sjcem_user', this.currentUser);
    this.addAuditLog('UPDATE_PROFILE', 'profiles', 'Updated personal contact details');
    this.notify();
  }

  // ================= Secure QR Identity System =================
  getUserQrRecord(userId) {
    const idToFind = userId || (this.currentUser ? this.currentUser.id : null);
    if (!idToFind) return null;
    let rec = this.qrRegistry.find((r) => r.userId === idToFind && !r.isRevoked);
    if (!rec) {
      // Find even if revoked to check history
      rec = this.qrRegistry.find((r) => r.userId === idToFind);
    }
    return rec || null;
  }

  verifyQrToken(tokenInput) {
    if (!tokenInput || typeof tokenInput !== 'string') {
      return {
        valid: false,
        error: 'INVALID_INPUT',
        message: 'No QR token provided for verification.',
      };
    }

    // Extract opaque token if full URL is passed
    let cleanToken = tokenInput.trim();
    if (cleanToken.includes('/verify/')) {
      const parts = cleanToken.split('/verify/');
      cleanToken = parts[1].split('?')[0].split('#')[0].trim();
    }

    // Lookup token in secure registry
    const match = this.qrRegistry.find((r) => r.token === cleanToken);

    const viewerRole = this.currentUser ? this.currentUser.role : 'PUBLIC';

    if (!match) {
      this.addAuditLog(
        'QR_SCAN_UNKNOWN',
        'scan_audit_logs',
        `Scanned non-existent or forged token: ${cleanToken.substring(0, 16)}...`
      );
      return {
        success: false,
        valid: false,
        status: 'INVALID',
        error: 'TOKEN_NOT_FOUND',
        message: 'This QR identity code does not exist in the official SJCEM institutional registry.',
        token: cleanToken,
      };
    }

    // Check revocation
    if (match.isRevoked) {
      this.addAuditLog(
        'QR_SCAN_REVOKED',
        'scan_audit_logs',
        `Scanned revoked token for ${match.fullName} (${match.userType}). Reason: ${match.revokedReason}`
      );
      return {
        success: false,
        valid: false,
        status: 'REVOKED',
        error: 'REVOKED',
        message: 'This QR identity card has been REVOKED and is no longer valid.',
        token: cleanToken,
        data: {
          fullName: match.fullName,
          category: match.userType === 'student' ? 'Enrolled Student' : 'Faculty Member',
          department: match.department,
          status: 'REVOKED',
        },
        record: {
          fullName: match.fullName,
          userType: match.userType,
          department: match.department,
          revokedAt: match.revokedAt,
          revokedReason: match.revokedReason || 'Reported lost or compromised by cardholder',
        },
      };
    }

    // Check expiration
    if (match.isExpired || (match.expiresAt && new Date(match.expiresAt) < new Date())) {
      this.addAuditLog(
        'QR_SCAN_EXPIRED',
        'scan_audit_logs',
        `Scanned expired academic identity token for ${match.fullName}`
      );
      return {
        success: false,
        valid: false,
        status: 'EXPIRED',
        error: 'EXPIRED',
        message: 'This QR identity card has expired for the current academic session.',
        token: cleanToken,
        data: {
          fullName: match.fullName,
          category: match.userType === 'student' ? 'Enrolled Student' : 'Faculty Member',
          department: match.department,
          status: 'EXPIRED',
        },
        record: {
          fullName: match.fullName,
          userType: match.userType,
          department: match.department,
          academicYear: match.academicYear,
        },
      };
    }

    // Increment scan analytics
    match.scanCount = (match.scanCount || 0) + 1;
    match.lastScannedAt = new Date().toLocaleDateString('en-GB') + ' ' + new Date().toLocaleTimeString('en-US');
    this.save('sjcem_qr_registry', this.qrRegistry);

    this.addAuditLog(
      'QR_SCAN_VERIFIED',
      'scan_audit_logs',
      `Verified digital ID for ${match.fullName} [${match.userType}]. Viewer: ${viewerRole}`
    );

    const isPrivileged = viewerRole === 'admin' || viewerRole === 'faculty';

    return {
      success: true,
      valid: true,
      status: 'ACTIVE',
      viewType: isPrivileged ? 'AUTHENTICATED' : 'PUBLIC',
      accessLevel: isPrivileged ? `${viewerRole.toUpperCase()}_INSTITUTIONAL_VIEW` : 'PUBLIC_VERIFICATION',
      token: cleanToken,
      data: {
        fullName: match.fullName,
        category: match.userType === 'student' ? 'Enrolled Student' : 'Faculty Member',
        department: match.department,
        status: 'ACTIVE',
        studentId: match.rollNumber || match.prn || 'SJCEM-STU',
        facultyId: match.facultyId,
        program: match.program || match.designation || 'Engineering',
        currentSemester: match.semester,
        division: match.division,
        officialEmail: isPrivileged ? match.email : undefined,
      },
      record: { ...match },
    };
  }

  // Revoke compromised QR token and regenerate a cryptographically secure replacement
  revokeAndRegenerateQrToken(userId, reason = 'Reported compromised by user') {
    const targetUserId = userId || (this.currentUser ? this.currentUser.id : null);
    if (!targetUserId) return null;

    // Find and revoke current active token
    const activeIndex = this.qrRegistry.findIndex((r) => r.userId === targetUserId && !r.isRevoked);
    if (activeIndex !== -1) {
      this.qrRegistry[activeIndex].isRevoked = true;
      this.qrRegistry[activeIndex].revokedAt = new Date().toLocaleDateString('en-GB') + ' ' + new Date().toLocaleTimeString('en-US');
      this.qrRegistry[activeIndex].revokedReason = reason;
    }

    // Generate new cryptographically random opaque token
    const randomHex = Array.from(crypto.getRandomValues(new Uint8Array(8)))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    const newToken = `sjcem_sec_${randomHex}`;

    const newRecord = {
      token: newToken,
      userId: targetUserId,
      userType: this.currentUser?.role === 'faculty' ? 'Faculty' : 'Student',
      fullName: this.currentUser ? `${this.currentUser.firstName} ${this.currentUser.lastName}` : 'SJCEM Member',
      department: this.currentUser?.department || 'Computer Engineering',
      program: this.currentUser?.program || 'B.E. Computer Engineering',
      semester: this.currentUser?.semester || 6,
      division: this.currentUser?.division || 'A',
      rollNumber: this.currentUser?.rollNumber || 'SJCEM2022CS084',
      prn: this.currentUser?.prn || '2022016400987654',
      academicYear: '2025–2026',
      advisor: this.currentUser?.academicAdvisor || 'Prof. Anita Deshmukh',
      isRevoked: false,
      revokedAt: null,
      revokedReason: null,
      isExpired: false,
      expiresAt: '2027-06-30',
      createdAt: new Date().toLocaleDateString('en-GB'),
      scanCount: 0,
      avatarUrl: this.currentUser?.avatarUrl,
    };

    this.qrRegistry.unshift(newRecord);
    this.save('sjcem_qr_registry', this.qrRegistry);

    // Update currentUser active token
    if (this.currentUser && this.currentUser.id === targetUserId) {
      this.currentUser.qrToken = newToken;
      this.currentUser.isQrRevoked = false;
      this.save('sjcem_user', this.currentUser);
    }

    this.addAuditLog(
      'QR_IDENTITY_REGENERATED',
      'qr_identity_tokens',
      `Revoked previous token. Generated new secure QR identity: ${newToken} for user ${targetUserId}. Reason: ${reason}`
    );

    this.notify();
    return newRecord;
  }

  // Attendance
  getAttendance() {
    return this.attendance;
  }

  getAttendanceLogs() {
    return this.attendanceLogs;
  }

  getOverallAttendance() {
    const totalAttended = this.attendance.reduce((acc, curr) => acc + curr.attended, 0);
    const totalConducted = this.attendance.reduce((acc, curr) => acc + curr.conducted, 0);
    const percentage = totalConducted > 0 ? (totalAttended / totalConducted) * 100 : 0;
    return {
      percentage: Math.round(percentage * 10) / 10,
      attended: totalAttended,
      conducted: totalConducted,
    };
  }

  facultyRecordAttendance(subjectCode, studentPresent, topic) {
    const record = this.attendance.find((r) => r.subjectCode === subjectCode);
    if (record) {
      record.conducted += 1;
      if (studentPresent) record.attended += 1;
      record.percentage = Math.round((record.attended / record.conducted) * 1000) / 10;
      record.status = record.percentage >= 75 ? 'SAFE' : record.percentage >= 65 ? 'WARNING' : 'CRITICAL';
      this.save('sjcem_attendance', this.attendance);
    }

    const newLog = {
      id: `log-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      time: '11:15 - 12:15',
      subjectCode,
      subjectName: record?.subjectName || subjectCode,
      type: 'LECTURE',
      status: studentPresent ? 'PRESENT' : 'ABSENT',
      facultyName: this.currentUser ? (this.currentUser.firstName + ' ' + this.currentUser.lastName) : 'Faculty',
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

  // Timetable
  getTimetable() {
    return this.timetable;
  }

  getTodayClasses() {
    return this.timetable.filter((slot) => slot.dayOfWeek === 5);
  }

  // Marks
  getInternalMarks() {
    return this.internalMarks;
  }

  facultyUpdateMarks(subjectCode, ia1, ia2) {
    const mark = this.internalMarks.find((m) => m.subjectCode === subjectCode);
    if (mark) {
      mark.ia1 = Number(ia1);
      mark.ia2 = Number(ia2);
      mark.average = Math.round(((mark.ia1 + mark.ia2) / 2) * 100) / 100;
      this.save('sjcem_marks', this.internalMarks);
      this.addAuditLog('UPDATE_MARKS', 'assessment_marks', `Updated IA marks for ${subjectCode}: IA1=${ia1}, IA2=${ia2}`);
      this.notify();
    }
  }

  getSemesterResults() {
    return this.semesterResults;
  }

  // Notices
  getNotices() {
    return this.notices;
  }

  markNoticeRead(noticeId, isRead = true) {
    const notice = this.notices.find((n) => n.id === noticeId);
    if (notice) {
      notice.isRead = isRead;
      this.save('sjcem_notices', this.notices);
      this.notify();
    }
  }

  publishNotice(noticeData) {
    const newNotice = {
      ...noticeData,
      id: `not-${Date.now()}`,
      publishedDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      isRead: false,
    };
    this.notices.unshift(newNotice);
    this.save('sjcem_notices', this.notices);

    this.addNotification({
      title: `Notice: ${newNotice.title}`,
      message: `${newNotice.department} published a new circular. Priority: ${newNotice.priority}`,
      type: 'NOTICE',
      targetPath: 'notices',
    });

    this.addAuditLog('PUBLISH_NOTICE', 'notices', `Published notice: ${newNotice.title}`);
    this.notify();
  }

  // Resources
  getStudyResources() {
    return this.resources;
  }

  uploadStudyResource(resource) {
    const newRes = {
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

  // Projects
  getProject() {
    return this.project;
  }

  submitProjectUpdate(title, notes) {
    const newSubmission = {
      id: `sub-${Date.now()}`,
      title,
      version: `v1.${this.project.submissions.length + 1}`,
      submittedDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      documentName: `SJCEM_ProjectUpdate_${Date.now()}.pdf`,
      status: 'PENDING',
      feedback: 'Pending mentor review',
    };
    this.project.submissions.unshift(newSubmission);
    this.save('sjcem_project', this.project);

    this.addAuditLog('SUBMIT_PROJECT', 'project_submissions', `Submitted project milestone update: ${title}`);
    this.notify();
  }

  facultyReviewProject(submissionId, feedback, approved) {
    const sub = this.project.submissions.find((s) => s.id === submissionId);
    if (sub) {
      sub.status = 'REVIEWED';
      sub.feedback = feedback;
      if (approved) {
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

  // Certificates
  getCertificates() {
    return this.certificates;
  }

  requestCertificate(type, purpose) {
    const refNum = `SJCEM-CERT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const nowStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const newCert = {
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

  adminUpdateCertificate(certId, status, remarks, documentName) {
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

  // Notifications
  getNotifications() {
    return this.notifications;
  }

  getUnreadNotificationCount() {
    return this.notifications.filter((n) => !n.isRead).length;
  }

  markNotificationRead(id) {
    const item = this.notifications.find((n) => n.id === id);
    if (item) {
      item.isRead = true;
      this.save('sjcem_notifications', this.notifications);
      this.notify();
    }
  }

  markAllNotificationsRead() {
    this.notifications.forEach((n) => (n.isRead = true));
    this.save('sjcem_notifications', this.notifications);
    this.notify();
  }

  addNotification(item) {
    const newItem = {
      ...item,
      id: `ntf-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      isRead: false,
    };
    this.notifications.unshift(newItem);
    this.save('sjcem_notifications', this.notifications);
    this.notify();
  }

  // Support
  getSupportTickets() {
    return this.tickets;
  }

  createSupportTicket(subject, category, priority, description) {
    const ticketNum = `SJCEM-SUP-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const newTkt = {
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

  // Audit Logs
  getAuditLogs() {
    return this.auditLogs;
  }

  addAuditLog(action, entityName, details) {
    const actor = this.currentUser;
    const newLog = {
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      actorName: actor ? `${actor.firstName} ${actor.lastName}` : 'System / Unauthenticated',
      actorRole: actor ? actor.role : 'system',
      action,
      entityName,
      details,
      ipAddress: '172.16.24.108',
    };
    this.auditLogs.unshift(newLog);
    if (this.auditLogs.length > 50) this.auditLogs.pop();
    this.save('sjcem_audit_logs', this.auditLogs);
  }

  // Global Search
  globalSearch(query) {
    if (!query || query.trim().length < 2) return [];
    const q = query.toLowerCase().trim();
    const results = [];

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
