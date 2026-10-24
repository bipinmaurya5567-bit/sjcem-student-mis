// Type definitions for SJCEM NEXT MIS

export type UserRole = 'student' | 'faculty' | 'coordinator' | 'admin';

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  avatarUrl?: string;
  phone: string;
  dob: string;
  bloodGroup: string;
  address: string;
  role: UserRole;
  guardianName?: string;
  guardianPhone?: string;
  guardianRelation?: string;
  emergencyContact?: string;
  // Student-specific
  prn?: string;
  rollNumber?: string;
  department?: string;
  program?: string;
  semester?: number;
  division?: string;
  admissionYear?: number;
  academicAdvisor?: string;
  // Faculty-specific
  designation?: string;
  departmentCode?: string;
  employeeId?: string;
}

export interface AttendanceRecord {
  id: string;
  subjectCode: string;
  subjectName: string;
  facultyName: string;
  attended: number;
  conducted: number;
  percentage: number;
  status: 'SAFE' | 'WARNING' | 'CRITICAL'; // >=75% safe, 65-75% warning, <65% critical
}

export interface AttendanceLog {
  id: string;
  date: string;
  time: string;
  subjectCode: string;
  subjectName: string;
  type: 'LECTURE' | 'LAB';
  status: 'PRESENT' | 'ABSENT' | 'LATE';
  facultyName: string;
}

export interface TimetableSlot {
  id: string;
  dayOfWeek: number; // 1 = Monday ... 6 = Saturday
  dayName: string;
  startTime: string;
  endTime: string;
  subjectCode: string;
  subjectName: string;
  facultyName: string;
  roomNumber: string;
  type: 'LECTURE' | 'LAB' | 'TUTORIAL';
  batch?: string;
}

export interface InternalMark {
  id: string;
  subjectCode: string;
  subjectName: string;
  ia1: number;
  ia2: number;
  maxMarks: number;
  average: number;
  prelims: number;
  status: 'PUBLISHED' | 'PROVISIONAL';
}

export interface SemesterResult {
  semesterNum: number;
  semesterName: string;
  examSeatNo: string;
  sgpa: number;
  cgpa: number;
  totalCredits: number;
  resultStatus: 'PASS' | 'FAIL' | 'ATKT';
  publishedDate: string;
  courses: {
    code: string;
    name: string;
    credits: number;
    grade: string;
    gradePoints: number;
  }[];
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  category: 'ACADEMIC' | 'EXAMINATION' | 'EVENTS' | 'ADMINISTRATIVE' | 'PLACEMENT' | 'SCHOLARSHIPS' | 'GENERAL';
  priority: 'LOW' | 'NORMAL' | 'IMPORTANT' | 'URGENT';
  targetAudience: 'ALL' | 'STUDENTS' | 'FACULTY';
  department: string;
  publishedDate: string;
  expiryDate?: string;
  isPinned: boolean;
  authorName: string;
  attachmentName?: string;
  attachmentSize?: string;
  isRead?: boolean;
}

export interface StudyResource {
  id: string;
  subjectCode: string;
  subjectName: string;
  title: string;
  description: string;
  resourceType: 'NOTES' | 'QUESTION_PAPER' | 'LAB_MANUAL' | 'SYLLABUS';
  fileFormat: 'PDF' | 'ZIP' | 'DOCX';
  fileSize: string;
  uploadedBy: string;
  uploadDate: string;
  downloadsCount: number;
}

export interface ProjectWorkspace {
  id: string;
  title: string;
  abstract: string;
  category: string;
  department: string;
  academicYear: string;
  guideName: string;
  guideEmail: string;
  status: 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'CHANGES_REQUESTED' | 'APPROVED' | 'IN_PROGRESS' | 'COMPLETED';
  teamMembers: {
    name: string;
    roll: string;
    email: string;
    isLeader: boolean;
  }[];
  milestones: {
    id: string;
    title: string;
    dueDate: string;
    isCompleted: boolean;
    remarks?: string;
  }[];
  submissions: {
    id: string;
    title: string;
    version: string;
    submittedDate: string;
    documentName: string;
    status: 'REVIEWED' | 'PENDING';
    feedback?: string;
  }[];
}

export interface CertificateRequest {
  id: string;
  referenceNumber: string;
  certificateType: 'BONAFIDE' | 'LEAVING_CERTIFICATE' | 'TRANSCRIPT' | 'MIGRATION';
  purpose: string;
  submittedDate: string;
  lastUpdated: string;
  status: 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'ADDITIONAL_INFO' | 'APPROVED' | 'READY_FOR_COLLECTION' | 'REJECTED';
  adminRemarks?: string;
  issuedDocumentName?: string;
  timeline: {
    date: string;
    status: string;
    actor: string;
    remarks: string;
  }[];
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'ACADEMIC' | 'TIMETABLE' | 'CERTIFICATE' | 'NOTICE' | 'PROJECT';
  timestamp: string;
  isRead: boolean;
  targetPath: string;
}

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  subject: string;
  category: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  createdDate: string;
  description: string;
  lastReply?: string;
}

export interface AuditLogItem {
  id: string;
  timestamp: string;
  actorName: string;
  actorRole: string;
  action: string;
  entityName: string;
  details: string;
  ipAddress: string;
}
