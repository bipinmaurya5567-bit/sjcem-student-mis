// SJCEM NEXT MIS Interactive Action Modals
import { misStore } from '../../services/store.js';

export function renderActionModals() {
  const user = misStore.getCurrentUser();
  if (!user) return "";
  const attendance = misStore.getAttendance();

  return `
    <!-- 1. Edit Contact Details Modal -->
    <div id="modal-edit-contact" style="display:none;" class="fixed inset-0 z-50 modal-backdrop overflow-y-auto flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden animate-fade-in">
        <div class="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <h3 class="font-bold text-slate-800 text-sm">Update Contact & Guardian Details</h3>
          <button onclick="window.appCloseModal('modal-edit-contact')" class="text-slate-400 hover:text-slate-700">
            <i data-lucide="x" class="w-4 h-4"></i>
          </button>
        </div>
        <form onsubmit="window.appSaveContactDetails(event)" class="p-5 space-y-3 text-xs">
          <div>
            <label class="block text-slate-600 font-semibold mb-1">Mobile Phone Number</label>
            <input id="edit-phone" type="text" required value="${user.phone}" class="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-700" />
          </div>
          <div>
            <label class="block text-slate-600 font-semibold mb-1">Emergency Contact Number</label>
            <input id="edit-emergency" type="text" required value="${user.emergencyContact || user.phone}" class="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-700" />
          </div>
          <div>
            <label class="block text-slate-600 font-semibold mb-1">Residential Address</label>
            <textarea id="edit-address" rows="3" required class="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-700">${user.address}</textarea>
          </div>
          <div>
            <label class="block text-slate-600 font-semibold mb-1">Guardian Phone Number</label>
            <input id="edit-guardian-phone" type="text" value="${user.guardianPhone || ''}" class="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-700" />
          </div>
          <div class="pt-3 flex justify-end gap-2">
            <button type="button" onclick="window.appCloseModal('modal-edit-contact')" class="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold">Cancel</button>
            <button type="submit" class="px-4 py-2 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-semibold">Save Contact Details</button>
          </div>
        </form>
      </div>
    </div>

    <!-- 2. Request Certificate Modal -->
    <div id="modal-request-certificate" style="display:none;" class="fixed inset-0 z-50 modal-backdrop overflow-y-auto flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden animate-fade-in">
        <div class="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div class="flex items-center space-x-2">
            <i data-lucide="file-plus" class="w-5 h-5 text-teal-800"></i>
            <h3 class="font-bold text-slate-800 text-sm">Request Official Certificate</h3>
          </div>
          <button onclick="window.appCloseModal('modal-request-certificate')" class="text-slate-400 hover:text-slate-700">
            <i data-lucide="x" class="w-4 h-4"></i>
          </button>
        </div>
        <form onsubmit="window.appHandleCertificateRequestSubmit(event)" class="p-5 space-y-3.5 text-xs">
          <div>
            <label class="block text-slate-700 font-bold mb-1">Certificate Type</label>
            <select id="cert-type-select" class="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold text-slate-800 focus:outline-none focus:border-teal-700">
              <option value="BONAFIDE">Bonafide Certificate</option>
              <option value="TRANSCRIPT">Official Academic Transcript (All Semesters)</option>
              <option value="LEAVING_CERTIFICATE">Leaving / Program Transfer Certificate</option>
              <option value="MIGRATION">University Migration Certificate</option>
            </select>
          </div>
          <div>
            <label class="block text-slate-700 font-bold mb-1">Specific Purpose / Institutional Reason</label>
            <textarea
              id="cert-purpose-input"
              rows="3"
              required
              placeholder="e.g. Required for Bank Education Loan renewal at SBI Palghar branch..."
              class="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:border-teal-700"
            ></textarea>
          </div>
          <div class="p-3 bg-teal-50 border border-teal-200 rounded-xl text-teal-900 leading-relaxed text-[11px]">
            <strong>Note:</strong> Standard institutional turnaround time is 2 working days. An automated tracking reference ID (SJCEM-CERT-2026-XXXX) will be generated.
          </div>
          <div class="pt-3 flex justify-end gap-2">
            <button type="button" onclick="window.appCloseModal('modal-request-certificate')" class="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold">Cancel</button>
            <button type="submit" class="px-4 py-2 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-semibold">Submit Application</button>
          </div>
        </form>
      </div>
    </div>

    <!-- 3. Submit Project Update Modal -->
    <div id="modal-submit-project" style="display:none;" class="fixed inset-0 z-50 modal-backdrop overflow-y-auto flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden animate-fade-in">
        <div class="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <h3 class="font-bold text-slate-800 text-sm">Submit Project Progress Deliverable</h3>
          <button onclick="window.appCloseModal('modal-submit-project')" class="text-slate-400 hover:text-slate-700">
            <i data-lucide="x" class="w-4 h-4"></i>
          </button>
        </div>
        <form onsubmit="window.appHandleProjectSubmit(event)" class="p-5 space-y-3.5 text-xs">
          <div>
            <label class="block text-slate-700 font-bold mb-1">Deliverable Title / Milestone</label>
            <input id="proj-sub-title" type="text" required placeholder="e.g. YOLOv8 Model Training Benchmark Results" class="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-700" />
          </div>
          <div>
            <label class="block text-slate-700 font-bold mb-1">Submission Notes & Summary of Work Done</label>
            <textarea id="proj-sub-notes" rows="3" required placeholder="Describe dataset annotated, training accuracy achieved, and pending blockers..." class="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-700"></textarea>
          </div>
          <div class="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center">
            <i data-lucide="upload-cloud" class="w-6 h-6 mx-auto mb-1 text-slate-400"></i>
            <span class="text-slate-600 font-medium block">Upload PDF Report or Slides</span>
            <span class="text-[10px] text-slate-400 font-mono">Max size 25 MB • PDF / PPTX</span>
          </div>
          <div class="pt-2 flex justify-end gap-2">
            <button type="button" onclick="window.appCloseModal('modal-submit-project')" class="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold">Cancel</button>
            <button type="submit" class="px-4 py-2 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-semibold">Upload & Notify Guide</button>
          </div>
        </form>
      </div>
    </div>

    <!-- 4. Faculty Attendance Recording Modal -->
    <div id="modal-faculty-attendance" style="display:none;" class="fixed inset-0 z-50 modal-backdrop overflow-y-auto flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden animate-fade-in">
        <div class="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div class="flex items-center space-x-2">
            <i data-lucide="calendar-check" class="w-5 h-5 text-teal-800"></i>
            <h3 class="font-bold text-slate-800 text-sm">Faculty Lecture Attendance Recording</h3>
          </div>
          <button onclick="window.appCloseModal('modal-faculty-attendance')" class="text-slate-400 hover:text-slate-700">
            <i data-lucide="x" class="w-4 h-4"></i>
          </button>
        </div>
        <form onsubmit="window.appHandleFacultyAttendanceSubmit(event)" class="p-5 space-y-3.5 text-xs">
          <div>
            <label class="block text-slate-700 font-bold mb-1">Select Course</label>
            <select id="faculty-att-subject" class="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold text-slate-800 focus:outline-none focus:border-teal-700">
              ${attendance
                .map((a) => `<option value="${a.subjectCode}">${a.subjectCode} - ${a.subjectName}</option>`)
                .join('')}
            </select>
          </div>
          <div>
            <label class="block text-slate-700 font-bold mb-1">Topic Covered in Session</label>
            <input id="faculty-att-topic" type="text" required value="Container Orchestration with Kubernetes pods & services" class="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-700" />
          </div>
          <div>
            <label class="block text-slate-700 font-bold mb-1">Student Attendance Status (Rahul S. Sharma)</label>
            <div class="flex items-center gap-4">
              <label class="flex items-center gap-1.5 cursor-pointer">
                <input type="radio" name="faculty-student-status" value="PRESENT" checked class="accent-teal-800" />
                <span class="font-bold text-emerald-700">Present</span>
              </label>
              <label class="flex items-center gap-1.5 cursor-pointer">
                <input type="radio" name="faculty-student-status" value="ABSENT" class="accent-teal-800" />
                <span class="font-bold text-rose-700">Absent</span>
              </label>
            </div>
          </div>
          <p class="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
            This submission will increment conducted lecture counts and append an immutable server audit record.
          </p>
          <div class="pt-2 flex justify-end gap-2">
            <button type="button" onclick="window.appCloseModal('modal-faculty-attendance')" class="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold">Cancel</button>
            <button type="submit" class="px-4 py-2 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-semibold">Submit & Log Attendance</button>
          </div>
        </form>
      </div>
    </div>

    <!-- 5. Faculty IA Marks Entry Modal -->
    <div id="modal-faculty-marks" style="display:none;" class="fixed inset-0 z-50 modal-backdrop overflow-y-auto flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden animate-fade-in">
        <div class="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div class="flex items-center space-x-2">
            <i data-lucide="file-spreadsheet" class="w-5 h-5 text-teal-800"></i>
            <h3 class="font-bold text-slate-800 text-sm">Enter Continuous Assessment (IA) Marks</h3>
          </div>
          <button onclick="window.appCloseModal('modal-faculty-marks')" class="text-slate-400 hover:text-slate-700">
            <i data-lucide="x" class="w-4 h-4"></i>
          </button>
        </div>
        <form onsubmit="window.appHandleFacultyMarksSubmit(event)" class="p-5 space-y-3.5 text-xs">
          <div>
            <label class="block text-slate-700 font-bold mb-1">Subject</label>
            <select id="faculty-marks-subject" class="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold text-slate-800 focus:outline-none focus:border-teal-700">
              <option value="CSC601">CSC601 - Cloud Computing & Virtualization</option>
              <option value="CSC602">CSC602 - Machine Learning & Applications</option>
              <option value="CSC603">CSC603 - Cryptography & Network Security</option>
              <option value="CSDO601">CSDO601 - DevOps Engineering</option>
            </select>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-slate-700 font-bold mb-1">IA-1 Score (Out of 20)</label>
              <input id="faculty-marks-ia1" type="number" step="0.5" min="0" max="20" required value="19.0" class="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-700 font-mono" />
            </div>
            <div>
              <label class="block text-slate-700 font-bold mb-1">IA-2 Score (Out of 20)</label>
              <input id="faculty-marks-ia2" type="number" step="0.5" min="0" max="20" required value="19.5" class="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-700 font-mono" />
            </div>
          </div>
          <div class="pt-2 flex justify-end gap-2">
            <button type="button" onclick="window.appCloseModal('modal-faculty-marks')" class="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold">Cancel</button>
            <button type="submit" class="px-4 py-2 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-semibold">Update Student Marksheet</button>
          </div>
        </form>
      </div>
    </div>

    <!-- 6. Official Issued Bonafide Certificate Document Preview Modal -->
    <div id="modal-certificate-preview" style="display:none;" class="fixed inset-0 z-50 modal-backdrop overflow-y-auto flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden animate-fade-in p-6">
        <div class="flex justify-between items-center pb-3 border-b border-slate-100">
          <span class="text-xs font-bold text-teal-800 uppercase tracking-wider">Official Certificate Document</span>
          <button onclick="window.appCloseModal('modal-certificate-preview')" class="text-slate-400 hover:text-slate-700">
            <i data-lucide="x" class="w-4 h-4"></i>
          </button>
        </div>

        <!-- Rendered Certificate Sheet -->
        <div class="p-8 border-4 border-double border-teal-900/30 rounded-xl my-4 bg-[#FCFDFD] space-y-6 text-center text-slate-800">
          <!-- Institutional Brand Header -->
          <div class="space-y-1">
            <img src="public/assets/aldel-logo.png" alt="ALDEL Education Trust" class="h-12 w-auto mx-auto object-contain mb-1" />
            <h2 class="text-lg font-extrabold uppercase tracking-wide text-teal-900">
              St. John College of Engineering and Management
            </h2>
            <p class="text-[11px] text-slate-500">
              (Approved by AICTE, Recognized by DTE Maharashtra & Affiliated to University of Mumbai)
            </p>
            <p class="text-[10px] text-slate-400 font-mono">
              St. John Technical Campus, Vevoor, Manor Road, Palghar (E) 401404, Maharashtra
            </p>
          </div>

          <div class="py-2 border-y border-teal-900/20">
            <h3 class="text-base font-bold underline uppercase tracking-widest text-slate-900">
              BONAFIDE CERTIFICATE
            </h3>
            <p class="text-[11px] font-mono text-slate-500 mt-0.5">Ref No: SJCEM-CERT-2026-0841</p>
          </div>

          <p class="text-xs text-justify leading-relaxed text-slate-700">
            This is to certify that <strong>Mr. Rahul Suresh Sharma</strong>, PRN: <strong>2022016400987654</strong>, Roll No: <strong>SJCEM2022CS084</strong>, is a bonafide student of this institute studying in the <strong>Third Year (Semester VI)</strong> of the four-year degree course leading to <strong>Bachelor of Engineering in Computer Engineering</strong> for the Academic Year <strong>2025–2026</strong>.
          </p>

          <p class="text-xs text-justify leading-relaxed text-slate-700">
            To the best of our institutional knowledge, his conduct and character during his tenure in this college have been good. This certificate is issued on his request for the verified purpose of <strong>Bank Education Loan Subsidy Renewal (SBI Palghar)</strong>.
          </p>

          <div class="pt-8 flex items-center justify-between text-xs">
            <div class="text-left">
              <span class="font-mono block">Date: 20 Oct 2026</span>
              <span class="block">Place: Palghar</span>
            </div>
            <div class="text-center">
              <div class="w-16 h-16 rounded-full border border-teal-800/40 text-[9px] flex items-center justify-center font-bold text-teal-900 mx-auto uppercase rotate-12 bg-teal-50/50">
                Official Seal
              </div>
            </div>
            <div class="text-right">
              <div class="font-bold text-slate-800">Dr. Vikram K. Patil</div>
              <div class="text-[11px] text-slate-500">Registrar & Principal</div>
            </div>
          </div>
        </div>

        <div class="flex justify-end gap-2 pt-2">
          <button onclick="window.print()" class="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center gap-1.5">
            <i data-lucide="printer" class="w-3.5 h-3.5"></i>
            <span>Print</span>
          </button>
          <button onclick="window.appToast('Document downloaded (PDF)', 'success')" class="px-4 py-2 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-semibold text-xs flex items-center gap-1.5">
            <i data-lucide="download" class="w-3.5 h-3.5"></i>
            <span>Download Authenticated PDF</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 7. Database Schema Viewer Modal -->
    <div id="modal-db-schema" style="display:none;" class="fixed inset-0 z-50 modal-backdrop overflow-y-auto flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden animate-fade-in p-6">
        <div class="flex justify-between items-center pb-3 border-b border-slate-100">
          <div>
            <h3 class="font-bold text-slate-800 text-base">Relational Database Schema & Row-Level Security</h3>
            <p class="text-xs text-slate-500">PostgreSQL Migration • 25+ Tables with Enforced RLS</p>
          </div>
          <button onclick="window.appCloseModal('modal-db-schema')" class="text-slate-400 hover:text-slate-700">
            <i data-lucide="x" class="w-4 h-4"></i>
          </button>
        </div>

        <div class="my-4 max-h-96 overflow-y-auto bg-slate-900 text-slate-100 rounded-xl p-4 font-mono text-xs leading-relaxed">
          <pre><code>-- Student MIS Relational Schema Excerpt
-- Location: supabase/migrations/20261023_sjcem_schema.sql

CREATE TABLE profiles (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    prn VARCHAR(30) UNIQUE,
    roll_number VARCHAR(20),
    department_id UUID REFERENCES departments(id),
    role app_role NOT NULL
);

CREATE TABLE attendance_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES attendance_sessions(id) ON DELETE CASCADE,
    student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL,
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row-Level Security Policies:
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own attendance"
    ON attendance_records FOR SELECT
    USING (student_id = auth.uid() OR auth_user_has_role('admin') OR auth_user_has_role('faculty'));

CREATE POLICY "Faculty can record attendance"
    ON attendance_records FOR INSERT
    WITH CHECK (auth_user_has_role('faculty') OR auth_user_has_role('admin'));

-- Migration: 20261024_student_retrieval_and_import_schema.sql
CREATE TABLE imported_student_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pid VARCHAR(50) UNIQUE NOT NULL,
    prn VARCHAR(30) UNIQUE NOT NULL,
    roll_number VARCHAR(20) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    department_code VARCHAR(20) NOT NULL,
    program_name VARCHAR(255) NOT NULL,
    current_semester INT NOT NULL,
    status VARCHAR(30) DEFAULT 'ACTIVE',
    attendance_details JSONB,
    ia_marks JSONB,
    semester_results JSONB,
    source_type VARCHAR(50) DEFAULT 'CSV_IMPORT'
);

ALTER TABLE imported_student_records ENABLE ROW LEVEL SECURITY;

-- Faculty can only access student records within their assigned department
CREATE POLICY "Faculty department isolation for student lookup"
    ON imported_student_records FOR SELECT
    USING (auth_user_has_role('admin') OR (auth_user_has_role('faculty') AND department_code = auth_user_department_code()));

-- Immutable Security Audit Trail for All Student Queries
CREATE TABLE student_lookup_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id UUID REFERENCES profiles(id),
    queried_pid VARCHAR(50) NOT NULL,
    lookup_result VARCHAR(50) NOT NULL, -- 'SUCCESS', 'NOT_FOUND', 'ACCESS_DENIED'
    student_department VARCHAR(50),
    ip_address VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
          </code></pre>
        </div>

        <div class="flex justify-between items-center pt-2 text-xs">
          <span class="text-slate-400">Migrations: 20261023_sjcem_schema.sql & 20261024_student_retrieval_and_import_schema.sql</span>
          <button onclick="window.appToast('Schema SQL copied to clipboard', 'success')" class="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-semibold">
            Copy Full SQL
          </button>
        </div>
      </div>
    </div>

    <!-- ================= PART 5: QR SCANNER MODAL ================= -->
    <div id="modal-qr-scanner" style="display:none;" class="fixed inset-0 z-50 modal-backdrop overflow-y-auto flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden animate-fade-in">
        
        <!-- Modal Header -->
        <div class="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-teal-900 to-slate-900 text-white">
          <div class="flex items-center space-x-2.5">
            <div class="w-8 h-8 rounded-lg bg-teal-800/80 border border-teal-500/40 flex items-center justify-center">
              <i data-lucide="scan-line" class="w-4 h-4 text-emerald-400"></i>
            </div>
            <div>
              <h3 class="font-bold text-sm text-white">Scan SJCEM Digital Identity</h3>
              <p class="text-[10px] text-teal-200">Cryptographic Identity Verification Reader</p>
            </div>
          </div>
          <button onclick="window.appCloseQrScanner()" class="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition">
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>
        </div>

        <div class="p-5 space-y-4 text-xs">
          
          <!-- Mode Tabs: Camera Scanner vs Manual Token Entry -->
          <div class="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-xl text-xs font-semibold">
            <button
              id="qr-tab-btn-camera"
              type="button"
              onclick="window.appSwitchQrScanTab('camera')"
              class="py-2 rounded-lg bg-white text-teal-900 shadow-sm transition flex items-center justify-center space-x-1.5"
            >
              <i data-lucide="camera" class="w-3.5 h-3.5 text-teal-700"></i>
              <span>Live Camera Scanner</span>
            </button>
            <button
              id="qr-tab-btn-manual"
              type="button"
              onclick="window.appSwitchQrScanTab('manual')"
              class="py-2 rounded-lg text-slate-600 hover:text-slate-900 transition flex items-center justify-center space-x-1.5"
            >
              <i data-lucide="keyboard" class="w-3.5 h-3.5"></i>
              <span>Manual / File Lookup</span>
            </button>
          </div>

          <!-- Tab Pane 1: Camera Scanner -->
          <div id="qr-pane-camera" class="space-y-3">
            <div class="relative bg-slate-950 rounded-xl overflow-hidden min-h-[260px] flex flex-col items-center justify-center border border-slate-800">
              
              <!-- Video / Reader Container for html5-qrcode -->
              <div id="qr-reader" class="w-full h-full max-w-[320px]"></div>

              <!-- Permission / Stopped Overlay -->
              <div id="qr-camera-placeholder" class="text-center p-6 space-y-3">
                <div class="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 text-teal-400 flex items-center justify-center mx-auto">
                  <i data-lucide="video" class="w-6 h-6"></i>
                </div>
                <p class="text-slate-300 font-medium text-xs">Camera is ready for scanning.</p>
                <button
                  type="button"
                  id="qr-start-camera-btn"
                  onclick="window.appStartCameraScanner()"
                  class="px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-600 text-white font-bold text-xs shadow-md transition inline-flex items-center space-x-1.5"
                >
                  <i data-lucide="play" class="w-3.5 h-3.5"></i>
                  <span>Start Camera</span>
                </button>
              </div>

              <!-- Camera Controls (Visible when camera running) -->
              <div id="qr-camera-controls" style="display:none;" class="absolute bottom-3 left-0 right-0 flex justify-center gap-2 z-20">
                <button
                  type="button"
                  onclick="window.appStopCameraScanner()"
                  class="px-3 py-1.5 rounded-lg bg-black/70 backdrop-blur hover:bg-black text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center space-x-1"
                >
                  <i data-lucide="square" class="w-3 h-3"></i>
                  <span>Stop Camera</span>
                </button>
              </div>
            </div>

            <div class="flex items-center justify-between text-[11px] text-slate-500">
              <span>Point camera at any SJCEM Student or Faculty Digital ID.</span>
              <label class="cursor-pointer text-teal-700 hover:underline font-semibold flex items-center space-x-1">
                <i data-lucide="upload" class="w-3 h-3"></i>
                <span>Scan Image File</span>
                <input type="file" id="qr-file-input" accept="image/*" class="hidden" onchange="window.appScanQrImageFile(this)" />
              </label>
            </div>
          </div>

          <!-- Tab Pane 2: Manual Token / URL Fallback Lookup -->
          <div id="qr-pane-manual" style="display:none;" class="space-y-3">
            <form onsubmit="window.appHandleManualTokenVerify(event)" class="space-y-3">
              <div>
                <label class="block text-slate-700 font-semibold mb-1">
                  Opaque Token or Verification URL
                </label>
                <div class="relative">
                  <input
                    id="manual-qr-token-input"
                    type="text"
                    required
                    placeholder="e.g. sjcem_sec_7a9f2b84c1e0d356 or https://mis.sjcem.edu.in/verify/..."
                    class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-teal-700 font-mono text-xs text-slate-800 bg-white"
                  />
                </div>
                <p class="text-[10px] text-slate-400 mt-1">Accepts full verification URL or extracted opaque hash identifier.</p>
              </div>

              <button
                type="submit"
                class="w-full py-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs shadow-md transition flex items-center justify-center space-x-2"
              >
                <i data-lucide="shield-check" class="w-4 h-4"></i>
                <span>Verify Token Status</span>
              </button>
            </form>

            <!-- Sample Test Tokens for Verification Assessment -->
            <div class="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <span class="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">Institutional Verification Test Tokens:</span>
              <div class="grid grid-cols-2 gap-1.5 text-[11px]">
                <button
                  type="button"
                  onclick="document.getElementById('manual-qr-token-input').value = 'sjcem_sec_7a9f2b84c1e0d356';"
                  class="p-1.5 rounded bg-emerald-50 text-emerald-900 border border-emerald-200 text-left font-mono truncate hover:bg-emerald-100 transition"
                  title="Active Student Token (Rahul Sharma)"
                >
                  ✔ Valid Student
                </button>
                <button
                  type="button"
                  onclick="document.getElementById('manual-qr-token-input').value = 'sjcem_sec_4d8e1a90b7c3f251';"
                  class="p-1.5 rounded bg-teal-50 text-teal-900 border border-teal-200 text-left font-mono truncate hover:bg-teal-100 transition"
                  title="Active Faculty Token (Anita Deshmukh)"
                >
                  ✔ Valid Faculty
                </button>
                <button
                  type="button"
                  onclick="document.getElementById('manual-qr-token-input').value = 'sjcem_sec_revoked_test_99';"
                  class="p-1.5 rounded bg-rose-50 text-rose-900 border border-rose-200 text-left font-mono truncate hover:bg-rose-100 transition"
                  title="Revoked Compromised Token"
                >
                  ✕ Revoked Token
                </button>
                <button
                  type="button"
                  onclick="document.getElementById('manual-qr-token-input').value = 'sjcem_sec_expired_test_88';"
                  class="p-1.5 rounded bg-amber-50 text-amber-900 border border-amber-200 text-left font-mono truncate hover:bg-amber-100 transition"
                  title="Expired Token"
                >
                  ⚠ Expired Token
                </button>
              </div>
            </div>
          </div>

          <!-- Loading State Indicator -->
          <div id="qr-scan-loading" style="display:none;" class="p-4 rounded-xl bg-teal-50 border border-teal-200 text-center space-y-2">
            <div class="w-6 h-6 rounded-full border-2 border-teal-700 border-t-transparent animate-spin mx-auto"></div>
            <p class="text-xs font-bold text-teal-900">Validating cryptographic token with SJCEM Row-Level Security...</p>
          </div>

        </div>
      </div>
    </div>

    <!-- ================= PART 5: QR VERIFICATION PROFILE VIEWER MODAL ================= -->
    <div id="modal-qr-verification-result" style="display:none;" class="fixed inset-0 z-50 modal-backdrop overflow-y-auto flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden animate-fade-in">
        
        <!-- Header -->
        <div id="qr-result-header" class="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-teal-900 to-emerald-900 text-white">
          <div class="flex items-center space-x-2.5">
            <div class="h-8 w-8 bg-white rounded-lg p-1 shadow-sm flex items-center justify-center flex-shrink-0">
              <img src="public/assets/aldel-logo.png" alt="ALDEL" class="h-full w-full object-contain" />
            </div>
            <div>
              <h3 class="font-bold text-sm text-white">SJCEM Identity Verification</h3>
              <p id="qr-result-viewer-mode" class="text-[10px] text-teal-200">Authenticated Institutional View</p>
            </div>
          </div>
          <button onclick="window.appCloseModal('modal-qr-verification-result')" class="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition">
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>
        </div>

        <!-- Dynamic Result Content Container -->
        <div id="qr-result-body" class="p-6 space-y-4 text-xs">
          <!-- Populated dynamically by window.appShowVerificationResult() -->
        </div>

        <!-- Footer -->
        <div class="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center text-xs">
          <button
            type="button"
            onclick="window.appCloseModal('modal-qr-verification-result'); window.appOpenQrScanner();"
            class="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold flex items-center space-x-1.5 transition"
          >
            <i data-lucide="scan-line" class="w-3.5 h-3.5"></i>
            <span>Scan Another</span>
          </button>
          <button
            type="button"
            onclick="window.appCloseModal('modal-qr-verification-result')"
            class="px-4 py-2 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-semibold transition"
          >
            Close Result
          </button>
        </div>
      </div>
    </div>

    <!-- ================= PART 4: REPORT COMPROMISED QR MODAL ================= -->
    <div id="modal-report-compromised-qr" style="display:none;" class="fixed inset-0 z-50 modal-backdrop overflow-y-auto flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden animate-fade-in">
        <div class="p-5 border-b border-slate-100 flex items-center justify-between bg-rose-50 text-rose-900">
          <div class="flex items-center space-x-2">
            <i data-lucide="alert-triangle" class="w-5 h-5 text-rose-600"></i>
            <h3 class="font-bold text-sm">Report Lost or Compromised Digital ID</h3>
          </div>
          <button onclick="window.appCloseModal('modal-report-compromised-qr')" class="text-rose-400 hover:text-rose-700">
            <i data-lucide="x" class="w-4 h-4"></i>
          </button>
        </div>
        <form onsubmit="window.appHandleRevokeAndRegenerateSubmit(event)" class="p-5 space-y-3.5 text-xs">
          <p class="text-slate-600 leading-relaxed">
            Revoking your Digital ID immediately invalidates your current QR code across all campus scanners. A new cryptographic token will be generated instantly and recorded in the audit registry.
          </p>
          <div>
            <label class="block text-slate-700 font-bold mb-1">Reason for Revocation</label>
            <select id="revoke-reason-select" class="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold text-slate-800 focus:outline-none focus:border-rose-600">
              <option value="LOST_PHYSICAL_CARD">Lost printed physical ID card</option>
              <option value="UNAUTHORIZED_PHOTO">QR code photographed or posted on social media</option>
              <option value="SUSPECTED_MISUSE">Suspected proxy attendance or unauthorized scan</option>
              <option value="SCHEDULED_ROTATION">Routine security credential rotation</option>
            </select>
          </div>
          <div class="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-[11px] leading-relaxed">
            <strong>Warning:</strong> Any previously printed physical ID cards bearing the old QR code will immediately fail verification at college gates and examination centers.
          </div>
          <div class="pt-2 flex justify-end gap-2">
            <button type="button" onclick="window.appCloseModal('modal-report-compromised-qr')" class="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold">Cancel</button>
            <button type="submit" class="px-4 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white font-bold shadow-md">Revoke & Re-issue Token</button>
          </div>
        </form>
      </div>
    </div>
    <!-- 9. Notice Viewer Modal -->
    <div id="modal-view-notice" style="display:none;" class="fixed inset-0 z-50 modal-backdrop overflow-y-auto flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden animate-fade-in">
        <div class="p-5 border-b border-[#DCE4EE] flex items-center justify-between bg-gradient-to-r from-[#073B70] to-[#062B50] text-white">
          <div class="flex items-center space-x-2.5">
            <div class="h-8 w-8 bg-white rounded-lg p-1 shadow-sm flex items-center justify-center flex-shrink-0">
              <img src="public/assets/aldel-logo.png" alt="ALDEL" class="h-full w-full object-contain" />
            </div>
            <div>
              <h3 id="notice-modal-title" class="font-bold text-sm text-white">Official Circular</h3>
              <p id="notice-modal-meta" class="text-[10px] text-blue-200 font-medium">SJCEM Administration</p>
            </div>
          </div>
          <button onclick="window.appCloseModal('modal-view-notice')" class="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition">
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>
        </div>
        <div class="p-6 space-y-4 text-xs text-[#18263A]">
          <div class="flex items-center gap-2">
            <span id="notice-modal-category" class="px-2 py-0.5 rounded font-bold text-[10px] bg-[#F0F4FA] text-[#073B70] border border-[#DCE4EE]">ACADEMIC</span>
            <span id="notice-modal-priority" class="px-2 py-0.5 rounded font-bold text-[10px] bg-amber-50 text-amber-800 border border-amber-200">NORMAL</span>
            <span id="notice-modal-date" class="ml-auto text-[11px] text-slate-500 font-mono">Date</span>
          </div>
          <div id="notice-modal-content" class="leading-relaxed whitespace-pre-line text-slate-700 bg-slate-50/70 p-4 rounded-xl border border-slate-100"></div>
          <div id="notice-modal-attachment" style="display:none;" class="p-3 bg-blue-50/70 border border-blue-200 rounded-xl flex items-center justify-between">
            <div class="flex items-center space-x-2">
              <i data-lucide="paperclip" class="w-4 h-4 text-[#073B70]"></i>
              <span id="notice-modal-attachment-name" class="font-mono text-[11px] font-semibold text-[#073B70]">attachment.pdf</span>
            </div>
            <button onclick="window.appDownloadNoticeAttachment(document.getElementById('notice-modal-attachment-name').innerText)" class="px-3 py-1 bg-[#073B70] text-white rounded-lg font-bold text-[10px] hover:bg-[#062B50] transition">
              Download
            </button>
          </div>
        </div>
        <div class="p-4 bg-slate-50 border-t border-[#DCE4EE] flex justify-end">
          <button type="button" onclick="window.appCloseModal('modal-view-notice')" class="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold text-xs transition">
            Close Circular
          </button>
        </div>
      </div>
    </div>

    <!-- 10. Create Notice Modal (Faculty & Admin) -->
    <div id="modal-create-notice" style="display:none;" class="fixed inset-0 z-50 modal-backdrop overflow-y-auto flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden animate-fade-in">
        <div class="p-5 border-b border-[#DCE4EE] flex items-center justify-between bg-gradient-to-r from-[#073B70] to-[#062B50] text-white">
          <div class="flex items-center space-x-2">
            <i data-lucide="bell-plus" class="w-5 h-5 text-white"></i>
            <h3 class="font-bold text-sm text-white">Publish Institutional Circular</h3>
          </div>
          <button onclick="window.appCloseModal('modal-create-notice')" class="text-white/80 hover:text-white">
            <i data-lucide="x" class="w-4 h-4"></i>
          </button>
        </div>
        <form onsubmit="window.appHandleCreateNoticeSubmit(event)" class="p-5 space-y-3.5 text-xs">
          <div>
            <label class="block text-slate-700 font-bold mb-1">Circular Title</label>
            <input id="create-notice-title" type="text" required placeholder="e.g. Commencement of In-Semester Assessment II (AY 2025–26)" class="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-[#073B70]" />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-slate-700 font-bold mb-1">Category</label>
              <select id="create-notice-category" class="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold text-slate-800 focus:outline-none focus:border-[#073B70]">
                <option value="ACADEMIC">Academic</option>
                <option value="EXAMINATION">Examination</option>
                <option value="EVENTS">Events & Activities</option>
                <option value="ADMINISTRATIVE">Administrative</option>
                <option value="PLACEMENT">Training & Placement</option>
              </select>
            </div>
            <div>
              <label class="block text-slate-700 font-bold mb-1">Priority</label>
              <select id="create-notice-priority" class="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold text-slate-800 focus:outline-none focus:border-[#073B70]">
                <option value="NORMAL">Normal</option>
                <option value="IMPORTANT">Important</option>
                <option value="URGENT">Urgent Alert</option>
              </select>
            </div>
          </div>
          <div>
            <label class="block text-slate-700 font-bold mb-1">Circular Details & Instructions</label>
            <textarea id="create-notice-content" rows="4" required placeholder="Type the complete circular text, timetable schedule, or examination instructions..." class="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-[#073B70]"></textarea>
          </div>
          <div class="pt-2 flex justify-end gap-2">
            <button type="button" onclick="window.appCloseModal('modal-create-notice')" class="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold">Cancel</button>
            <button type="submit" class="px-4 py-2 rounded-xl bg-[#073B70] hover:bg-[#062B50] text-white font-semibold">Publish Notice</button>
          </div>
        </form>
      </div>
    </div>

    <!-- 11. Upload Study Resource Modal (Faculty) -->
    <div id="modal-upload-resource" style="display:none;" class="fixed inset-0 z-50 modal-backdrop overflow-y-auto flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden animate-fade-in">
        <div class="p-5 border-b border-[#DCE4EE] flex items-center justify-between bg-gradient-to-r from-[#073B70] to-[#062B50] text-white">
          <div class="flex items-center space-x-2">
            <i data-lucide="book-open" class="w-5 h-5 text-white"></i>
            <h3 class="font-bold text-sm text-white">Upload Subject Study Resource</h3>
          </div>
          <button onclick="window.appCloseModal('modal-upload-resource')" class="text-white/80 hover:text-white">
            <i data-lucide="x" class="w-4 h-4"></i>
          </button>
        </div>
        <form onsubmit="window.appHandleUploadResourceSubmit(event)" class="p-5 space-y-3.5 text-xs">
          <div>
            <label class="block text-slate-700 font-bold mb-1">Subject / Course</label>
            <input id="upload-resource-subject" type="text" required placeholder="e.g. CSC601 - Cloud Computing & Virtualization" class="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-[#073B70]" />
          </div>
          <div>
            <label class="block text-slate-700 font-bold mb-1">Resource Title</label>
            <input id="upload-resource-title" type="text" required placeholder="e.g. Module 3: Virtual Machine Provisioning Lab Manual" class="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-[#073B70]" />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-slate-700 font-bold mb-1">Resource Type</label>
              <select id="upload-resource-type" class="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold text-slate-800 focus:outline-none focus:border-[#073B70]">
                <option value="NOTES">Lecture Notes</option>
                <option value="LAB_MANUAL">Lab Manual</option>
                <option value="QUESTION_PAPER">Question Paper Bank</option>
                <option value="SYLLABUS">Course Syllabus</option>
              </select>
            </div>
            <div>
              <label class="block text-slate-700 font-bold mb-1">File Format</label>
              <select id="upload-resource-format" class="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold text-slate-800 focus:outline-none focus:border-[#073B70]">
                <option value="PDF">PDF Document</option>
                <option value="ZIP">ZIP Archive</option>
                <option value="DOCX">Word Document (DOCX)</option>
              </select>
            </div>
          </div>
          <div class="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center">
            <i data-lucide="upload-cloud" class="w-6 h-6 mx-auto mb-1 text-slate-400"></i>
            <span class="text-slate-600 font-medium block">Select File from Computer</span>
            <span class="text-[10px] text-slate-400 font-mono">Max size 25 MB</span>
          </div>
          <div class="pt-2 flex justify-end gap-2">
            <button type="button" onclick="window.appCloseModal('modal-upload-resource')" class="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold">Cancel</button>
            <button type="submit" class="px-4 py-2 rounded-xl bg-[#073B70] hover:bg-[#062B50] text-white font-semibold">Upload Resource</button>
          </div>
        </form>
      </div>
    </div>

    <!-- 12. Create Support Ticket Modal -->
    <div id="modal-new-ticket" style="display:none;" class="fixed inset-0 z-50 modal-backdrop overflow-y-auto flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden animate-fade-in">
        <div class="p-5 border-b border-[#DCE4EE] flex items-center justify-between bg-gradient-to-r from-[#073B70] to-[#062B50] text-white">
          <div class="flex items-center space-x-2">
            <i data-lucide="help-circle" class="w-5 h-5 text-white"></i>
            <h3 class="font-bold text-sm text-white">Submit Campus Helpdesk Ticket</h3>
          </div>
          <button onclick="window.appCloseModal('modal-new-ticket')" class="text-white/80 hover:text-white">
            <i data-lucide="x" class="w-4 h-4"></i>
          </button>
        </div>
        <form onsubmit="window.appHandleNewTicketSubmit(event)" class="p-5 space-y-3.5 text-xs">
          <div>
            <label class="block text-slate-700 font-bold mb-1">Subject / Query</label>
            <input id="ticket-subject" type="text" required placeholder="e.g. In-Semester assessment score discrepancy in CSC602" class="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-[#073B70]" />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-slate-700 font-bold mb-1">Category</label>
              <select id="ticket-category" class="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold text-slate-800 focus:outline-none focus:border-[#073B70]">
                <option value="Academic">Academic Office</option>
                <option value="Attendance">Attendance Correction</option>
                <option value="Examination">Examination Cell</option>
                <option value="IT Systems">MIS Portal / Account</option>
                <option value="Library">Central Library</option>
              </select>
            </div>
            <div>
              <label class="block text-slate-700 font-bold mb-1">Priority</label>
              <select id="ticket-priority" class="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold text-slate-800 focus:outline-none focus:border-[#073B70]">
                <option value="NORMAL">Normal</option>
                <option value="HIGH">High Priority</option>
                <option value="URGENT">Urgent (Deadline within 24h)</option>
              </select>
            </div>
          </div>
          <div>
            <label class="block text-slate-700 font-bold mb-1">Detailed Description</label>
            <textarea id="ticket-description" rows="3" required placeholder="Provide relevant details such as subject code, date, lecture slot, or screenshot reference..." class="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-[#073B70]"></textarea>
          </div>
          <div class="pt-2 flex justify-end gap-2">
            <button type="button" onclick="window.appCloseModal('modal-new-ticket')" class="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold">Cancel</button>
            <button type="submit" class="px-4 py-2 rounded-xl bg-[#073B70] hover:bg-[#062B50] text-white font-semibold">Submit Ticket</button>
          </div>
        </form>
      </div>
    </div>

    <!-- 13. Preview Official Grade Card Modal -->
    <div id="modal-preview-grade-card" style="display:none;" class="fixed inset-0 z-50 modal-backdrop overflow-y-auto flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden animate-fade-in">
        <div class="p-4 border-b border-[#DCE4EE] flex items-center justify-between bg-gradient-to-r from-[#073B70] to-[#062B50] text-white">
          <div class="flex items-center space-x-2">
            <i data-lucide="award" class="w-5 h-5 text-white"></i>
            <h3 class="font-bold text-sm text-white">Official Semester Marksheet & Transcript Preview</h3>
          </div>
          <div class="flex items-center space-x-2">
            <button onclick="window.print()" class="px-3 py-1 bg-white text-[#073B70] font-bold rounded-lg text-xs hover:bg-slate-100 transition flex items-center gap-1">
              <i data-lucide="printer" class="w-3.5 h-3.5"></i>
              <span>Print Marksheet</span>
            </button>
            <button onclick="window.appCloseModal('modal-preview-grade-card')" class="text-white/80 hover:text-white p-1">
              <i data-lucide="x" class="w-5 h-5"></i>
            </button>
          </div>
        </div>
        <div id="grade-card-body" class="p-6 space-y-4 text-xs text-[#18263A] max-h-[75vh] overflow-y-auto">
          <!-- Populated dynamically by window.appPreviewGradeCard -->
        </div>
      </div>
    </div>

    <!-- 14. Request Tracking Detail Modal -->
    <div id="modal-view-request-detail" style="display:none;" class="fixed inset-0 z-50 modal-backdrop overflow-y-auto flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden animate-fade-in">
        <div class="p-5 border-b border-[#DCE4EE] flex items-center justify-between bg-gradient-to-r from-[#073B70] to-[#062B50] text-white">
          <div class="flex items-center space-x-2">
            <i data-lucide="file-check" class="w-5 h-5 text-white"></i>
            <h3 class="font-bold text-sm text-white">Request Lifecycle & Timeline</h3>
          </div>
          <button onclick="window.appCloseModal('modal-view-request-detail')" class="text-white/80 hover:text-white">
            <i data-lucide="x" class="w-4 h-4"></i>
          </button>
        </div>
        <div id="request-detail-body" class="p-6 space-y-4 text-xs text-[#18263A]">
          <!-- Populated dynamically by window.appViewRequestDetail -->
        </div>
        <div class="p-4 bg-slate-50 border-t border-[#DCE4EE] flex justify-end">
          <button type="button" onclick="window.appCloseModal('modal-view-request-detail')" class="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold text-xs transition">
            Close Tracking
          </button>
        </div>
      </div>
    </div>

    <!-- 15. Admin Certificate Review Modal -->
    <div id="modal-admin-cert-review" style="display:none;" class="fixed inset-0 z-50 modal-backdrop overflow-y-auto flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden animate-fade-in">
        <div class="p-5 border-b border-[#DCE4EE] flex items-center justify-between bg-gradient-to-r from-purple-900 to-indigo-900 text-white">
          <div class="flex items-center space-x-2">
            <i data-lucide="file-badge-2" class="w-5 h-5 text-purple-200"></i>
            <h3 class="font-bold text-sm text-white">Review Student Certificate Application</h3>
          </div>
          <button onclick="window.appCloseModal('modal-admin-cert-review')" class="text-white/80 hover:text-white">
            <i data-lucide="x" class="w-4 h-4"></i>
          </button>
        </div>
        <div id="admin-cert-review-body" class="p-6 space-y-4 text-xs text-[#18263A]">
          <!-- Populated dynamically by window.appOpenAdminCertificateReview -->
        </div>
      </div>
    </div>

    <!-- 16. Faculty Project Deliverable Review Modal -->
    <div id="modal-faculty-project-review" style="display:none;" class="fixed inset-0 z-50 modal-backdrop overflow-y-auto flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden animate-fade-in">
        <div class="p-5 border-b border-[#DCE4EE] flex items-center justify-between bg-gradient-to-r from-teal-900 to-[#178579] text-white">
          <div class="flex items-center space-x-2">
            <i data-lucide="folder-check" class="w-5 h-5 text-teal-200"></i>
            <h3 class="font-bold text-sm text-white">Review Capstone Project Submission</h3>
          </div>
          <button onclick="window.appCloseModal('modal-faculty-project-review')" class="text-white/80 hover:text-white">
            <i data-lucide="x" class="w-4 h-4"></i>
          </button>
        </div>
        <div id="faculty-project-review-body" class="p-6 space-y-4 text-xs text-[#18263A]">
          <!-- Populated dynamically by window.appOpenFacultyReviewProjectModal -->
        </div>
      </div>
    </div>
  `;
}
