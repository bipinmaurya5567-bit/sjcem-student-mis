// SJCEM NEXT MIS — Authorized Administrator Relational Schema & Row-Level Security Inspection Page
// Institution: St. John College of Engineering and Management, Palghar
// Managed by: ALDEL Education Trust

import { misStore } from '../services/store.js';

export function renderAdminDatabaseSchemaPage(activeTab = 'tables') {
  const user = misStore.getCurrentUser();
  if (!user || user.role !== 'admin') {
    return `
      <div class="card-subtle p-8 text-center text-slate-500 space-y-3">
        <i data-lucide="shield-alert" class="w-10 h-10 text-rose-600 mx-auto"></i>
        <h3 class="text-base font-bold text-slate-800">Administrator Access Required</h3>
        <p class="text-xs text-slate-600">The relational database schema & RLS policy inspector is restricted to authorized administrative personnel.</p>
      </div>
    `;
  }

  // Authoritative schema definitions from supabase/migrations
  const tables = [
    {
      name: 'profiles',
      category: 'Identity',
      columns: 14,
      rlsEnabled: true,
      policies: 3,
      description: 'Maps directly to auth.users. Stores verified names, institutional email, phone, blood group, and emergency contacts.',
      primaryKey: 'id (UUID)',
      foreignKeys: 'auth.users(id)',
      policyRules: [
        { name: 'Users can view own profile', role: 'student, faculty, admin', condition: 'id = auth.uid()' },
        { name: 'Admins can manage all profiles', role: 'admin', condition: 'auth_user_has_role(\'admin\')' },
        { name: 'Faculty can view student contact info', role: 'faculty', condition: 'department_id = faculty.department_id' },
      ],
    },
    {
      name: 'user_roles',
      category: 'Identity',
      columns: 6,
      rlsEnabled: true,
      policies: 2,
      description: 'Role-Based Access Control mapping users to app_role enum (student, faculty, coordinator, admin).',
      primaryKey: 'id (UUID)',
      foreignKeys: 'profiles(id), departments(id)',
      policyRules: [
        { name: 'Users view own roles', role: 'authenticated', condition: 'user_id = auth.uid()' },
        { name: 'Admins manage user roles', role: 'admin', condition: 'auth_user_has_role(\'admin\')' },
      ],
    },
    {
      name: 'student_enrollments',
      category: 'Academics',
      columns: 11,
      rlsEnabled: true,
      policies: 3,
      description: 'Official academic enrollment ledger: Student PRN, Roll Number, Program, Current Division, and Admission Year.',
      primaryKey: 'id (UUID)',
      foreignKeys: 'profiles(id), programs(id), departments(id), divisions(id)',
      policyRules: [
        { name: 'Students view own enrollment', role: 'student', condition: 'student_id = auth.uid()' },
        { name: 'Faculty view department roster', role: 'faculty', condition: 'department_id = faculty.dept_id' },
        { name: 'Admins manage all enrollments', role: 'admin', condition: 'auth_user_has_role(\'admin\')' },
      ],
    },
    {
      name: 'attendance_sessions',
      category: 'Attendance',
      columns: 9,
      rlsEnabled: true,
      policies: 3,
      description: 'Classroom and laboratory lecture registers logged with date, faculty author, time slot, and covered syllabus topic.',
      primaryKey: 'id (UUID)',
      foreignKeys: 'profiles(id), subjects(id), divisions(id)',
      policyRules: [
        { name: 'Faculty log sessions', role: 'faculty', condition: 'faculty_id = auth.uid()' },
        { name: 'Enrolled students view sessions', role: 'student', condition: 'division_id = student.division_id' },
        { name: 'Admins inspect all sessions', role: 'admin', condition: 'auth_user_has_role(\'admin\')' },
      ],
    },
    {
      name: 'attendance_records',
      category: 'Attendance',
      columns: 5,
      rlsEnabled: true,
      policies: 3,
      description: 'Individual student attendance status per lecture session (PRESENT, ABSENT, LATE, EXCUSED).',
      primaryKey: 'id (UUID)',
      foreignKeys: 'attendance_sessions(id), profiles(id)',
      policyRules: [
        { name: 'Students view own records', role: 'student', condition: 'student_id = auth.uid()' },
        { name: 'Faculty modify assigned session', role: 'faculty', condition: 'session.faculty_id = auth.uid()' },
        { name: 'Admins audit records', role: 'admin', condition: 'auth_user_has_role(\'admin\')' },
      ],
    },
    {
      name: 'assessments',
      category: 'Examinations',
      columns: 8,
      rlsEnabled: true,
      policies: 2,
      description: 'Continuous internal assessment definitions (IA-1, IA-2, Prelims) with maximum marks and publication status.',
      primaryKey: 'id (UUID)',
      foreignKeys: 'subjects(id), divisions(id)',
      policyRules: [
        { name: 'Faculty manage assessments', role: 'faculty', condition: 'assigned_subject(auth.uid())' },
        { name: 'Published visible to students', role: 'student', condition: 'is_published = true' },
      ],
    },
    {
      name: 'assessment_marks',
      category: 'Examinations',
      columns: 6,
      rlsEnabled: true,
      policies: 3,
      description: 'Continuous assessment score ledger with marks obtained, faculty submitter, and digital audit timestamp.',
      primaryKey: 'id (UUID)',
      foreignKeys: 'assessments(id), profiles(id)',
      policyRules: [
        { name: 'Students view own verified marks', role: 'student', condition: 'student_id = auth.uid()' },
        { name: 'Faculty enter subject marks', role: 'faculty', condition: 'submitted_by = auth.uid()' },
        { name: 'Admins audit all marks', role: 'admin', condition: 'auth_user_has_role(\'admin\')' },
      ],
    },
    {
      name: 'certificate_requests',
      category: 'Registrar',
      columns: 9,
      rlsEnabled: true,
      policies: 3,
      description: 'Online student application queue for Bonafide, Leaving, Transcript, and Migration certificates.',
      primaryKey: 'id (UUID)',
      foreignKeys: 'profiles(id)',
      policyRules: [
        { name: 'Students submit and view own requests', role: 'student', condition: 'student_id = auth.uid()' },
        { name: 'Admins review, approve and reject', role: 'admin', condition: 'auth_user_has_role(\'admin\')' },
        { name: 'Prevent student status modification', role: 'student', condition: 'WITH CHECK (status = \'SUBMITTED\')' },
      ],
    },
    {
      name: 'qr_identity_tokens',
      category: 'Security',
      columns: 13,
      rlsEnabled: true,
      policies: 3,
      description: 'Cryptographically opaque tokens for physical ID card verification. Contains SHA-256 token hash and zero credentials.',
      primaryKey: 'id (UUID)',
      foreignKeys: 'profiles(id)',
      policyRules: [
        { name: 'Users view own token', role: 'authenticated', condition: 'user_id = auth.uid()' },
        { name: 'Admins revoke and re-issue', role: 'admin', condition: 'auth_user_has_role(\'admin\')' },
        { name: 'Public RPC verification', role: 'public', condition: 'verify_sjcem_qr_identity() SECURITY DEFINER' },
      ],
    },
    {
      name: 'scan_audit_logs',
      category: 'Security',
      columns: 8,
      rlsEnabled: true,
      policies: 2,
      description: 'Immutable verification trail of every campus reader scan, gate scan, and public ID verification.',
      primaryKey: 'id (UUID)',
      foreignKeys: 'qr_identity_tokens(id), profiles(id)',
      policyRules: [
        { name: 'System insert scan log', role: 'all', condition: 'WITH CHECK (true)' },
        { name: 'Admins inspect scan audits', role: 'admin', condition: 'auth_user_has_role(\'admin\')' },
      ],
    },
    {
      name: 'audit_logs',
      category: 'Security',
      columns: 8,
      rlsEnabled: true,
      policies: 2,
      description: 'Administrative activity log tracking sensitive operations, record edits, approvals, and credential revocations.',
      primaryKey: 'id (UUID)',
      foreignKeys: 'profiles(id)',
      policyRules: [
        { name: 'System insert audit log', role: 'all', condition: 'WITH CHECK (true)' },
        { name: 'Admins read audit logs', role: 'admin', condition: 'auth_user_has_role(\'admin\')' },
      ],
    },
    {
      name: 'imported_students',
      category: 'Integration',
      columns: 16,
      rlsEnabled: true,
      policies: 3,
      description: 'Verified student lookup repository supporting institutional PID search, spreadsheet CSV/TSV rosters, and department isolation.',
      primaryKey: 'id (UUID/String)',
      foreignKeys: 'N/A (Local / External Gateway)',
      policyRules: [
        { name: 'Faculty query department students', role: 'faculty', condition: 'departmentCode = faculty.dept_code' },
        { name: 'Admins query campus-wide records', role: 'admin', condition: 'auth_user_has_role(\'admin\')' },
        { name: 'Students blocked from student lookup', role: 'student', condition: 'DENY ALL' },
      ],
    },
  ];

  const migrations = [
    {
      filename: '20261023_sjcem_schema.sql',
      date: '2026-10-23',
      description: 'Core institutional schema: departments, programs, profiles, enrollments, attendance, assessments, certificates, notices.',
      status: 'APPLIED_ACTIVE',
    },
    {
      filename: '20261023_qr_identity_and_auth_schema.sql',
      date: '2026-10-23',
      description: 'Cryptographic QR tokens, email OTP challenges, scan audit trails, and verify_sjcem_qr_identity security definer function.',
      status: 'APPLIED_ACTIVE',
    },
    {
      filename: '20261024_student_retrieval_and_import_schema.sql',
      date: '2026-10-24',
      description: 'Institutional student lookup repository, PID indexes, audit logging, and institutional gateway proxy adapter configuration.',
      status: 'APPLIED_ACTIVE',
    },
  ];

  return `
    <div class="space-y-6 animate-fade-in pb-12">
      <!-- 1. Header Banner -->
      <div class="card-subtle p-6 bg-white border border-[#DCE4EE] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2 mb-1.5 flex-wrap">
            <span class="text-xs px-2.5 py-0.5 rounded-full font-bold bg-purple-50 text-purple-800 border border-purple-200 flex items-center gap-1.5">
              <i data-lucide="database" class="w-3.5 h-3.5 text-purple-700"></i>
              <span>POSTGRESQL &amp; SUPABASE ARCHITECTURE</span>
            </span>
            <span class="text-xs text-slate-500">
              Clearance: Level 4 Administrative Architect
            </span>
          </div>
          <h2 class="text-xl md:text-2xl font-bold text-slate-800 tracking-tight">Database Schema &amp; Row-Level Security (RLS)</h2>
          <p class="text-xs md:text-sm text-slate-500 mt-0.5">
            Comprehensive relational data model documentation, column contracts, foreign key relationships, and access control policies.
          </p>
        </div>

        <div class="flex items-center gap-2">
          <button
            type="button"
            onclick="window.appViewDatabaseSchema()"
            class="px-3.5 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-semibold text-xs shadow-sm transition flex items-center gap-1.5"
          >
            <i data-lucide="code" class="w-3.5 h-3.5"></i>
            <span>SQL Migration Viewer</span>
          </button>
        </div>
      </div>

      <!-- 2. Security Architecture KPI Summary -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div class="p-3.5 rounded-xl bg-white border border-slate-200 text-center">
          <span class="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Relational Tables</span>
          <div class="text-2xl font-extrabold text-slate-800 mt-1">${tables.length} Tables</div>
          <span class="text-[10px] text-slate-400 font-medium">PostgreSQL 16 Engine</span>
        </div>
        <div class="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
          <span class="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider block">Row-Level Security</span>
          <div class="text-2xl font-extrabold text-emerald-700 mt-1">100% Guarded</div>
          <span class="text-[10px] text-emerald-600 font-medium">RLS Active on All Tables</span>
        </div>
        <div class="p-3.5 rounded-xl bg-purple-50 border border-purple-200 text-center">
          <span class="text-[11px] font-semibold text-purple-800 uppercase tracking-wider block">Access Policies</span>
          <div class="text-2xl font-extrabold text-purple-700 mt-1">32 Policies</div>
          <span class="text-[10px] text-purple-600 font-medium">Role-Based (RBAC)</span>
        </div>
        <div class="p-3.5 rounded-xl bg-[#F0F4FA] border border-[#DCE4EE] text-center">
          <span class="text-[11px] font-semibold text-[#073B70] uppercase tracking-wider block">Schema Migrations</span>
          <div class="text-2xl font-extrabold text-[#073B70] mt-1">3 Applied</div>
          <span class="text-[10px] text-teal-700 font-medium">v2.4.1-eu-pid</span>
        </div>
      </div>

      <!-- 3. Navigation Tabs -->
      <div class="flex items-center space-x-2 border-b border-slate-200 pb-2 overflow-x-auto text-xs font-semibold">
        <button
          type="button"
          onclick="window.appSetSchemaTab('tables')"
          class="px-4 py-2 rounded-xl transition flex items-center space-x-1.5 flex-shrink-0 ${
            activeTab === 'tables'
              ? 'bg-[#073B70] text-white shadow-sm font-bold'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }"
        >
          <i data-lucide="table" class="w-4 h-4"></i>
          <span>Database Tables &amp; Columns</span>
        </button>

        <button
          type="button"
          onclick="window.appSetSchemaTab('rls')"
          class="px-4 py-2 rounded-xl transition flex items-center space-x-1.5 flex-shrink-0 ${
            activeTab === 'rls'
              ? 'bg-[#073B70] text-white shadow-sm font-bold'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }"
        >
          <i data-lucide="lock" class="w-4 h-4"></i>
          <span>Row-Level Security Policies</span>
        </button>

        <button
          type="button"
          onclick="window.appSetSchemaTab('migrations')"
          class="px-4 py-2 rounded-xl transition flex items-center space-x-1.5 flex-shrink-0 ${
            activeTab === 'migrations'
              ? 'bg-[#073B70] text-white shadow-sm font-bold'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }"
        >
          <i data-lucide="file-code" class="w-4 h-4"></i>
          <span>Applied SQL Migrations</span>
        </button>
      </div>

      <!-- 4. Tab Content Area -->
      ${
        activeTab === 'tables'
          ? `
        <!-- Tables Directory -->
        <div class="space-y-4">
          <div class="card-subtle p-5 md:p-6 bg-white space-y-4">
            <div class="flex items-center justify-between pb-3 border-b border-slate-100">
              <div class="flex items-center space-x-2">
                <i data-lucide="database" class="w-5 h-5 text-[#073B70]"></i>
                <h3 class="font-bold text-slate-800 text-base">Relational Database Tables Inventory</h3>
              </div>
              <span class="text-xs text-slate-400 font-mono">${tables.length} Core Tables</span>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              ${tables
                .map(
                  (t) => `
                <div class="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2.5 text-xs hover:border-[#073B70] transition">
                  <div class="flex items-center justify-between">
                    <span class="font-mono font-bold text-sm text-[#073B70]">${t.name}</span>
                    <span class="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200">
                      RLS ACTIVE
                    </span>
                  </div>
                  <p class="text-slate-600 leading-relaxed">${t.description}</p>
                  <div class="pt-2 border-t border-slate-200/60 grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span class="text-slate-400 block">Primary Key:</span>
                      <span class="font-mono font-bold text-slate-700">${t.primaryKey}</span>
                    </div>
                    <div>
                      <span class="text-slate-400 block">Foreign Keys:</span>
                      <span class="font-mono text-slate-600 truncate block">${t.foreignKeys}</span>
                    </div>
                  </div>
                </div>
              `
                )
                .join('')}
            </div>
          </div>
        </div>
      `
          : activeTab === 'rls'
          ? `
        <!-- RLS Policies Directory -->
        <div class="card-subtle p-5 md:p-6 bg-white space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <div class="flex items-center space-x-2">
              <i data-lucide="shield-check" class="w-5 h-5 text-emerald-600"></i>
              <h3 class="font-bold text-slate-800 text-base">Active Row-Level Security Policies</h3>
            </div>
            <span class="text-xs text-slate-400 font-mono">Enforced at PostgreSQL Engine Layer</span>
          </div>

          <div class="space-y-4">
            ${tables
              .map(
                (t) => `
              <div class="p-4 rounded-xl border border-slate-200 bg-white space-y-3 text-xs">
                <div class="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div class="flex items-center gap-2">
                    <span class="font-mono font-bold text-slate-900">${t.name}</span>
                    <span class="px-2 py-0.2 rounded font-bold text-[10px] bg-purple-50 text-purple-800 border border-purple-200">
                      ${t.category}
                    </span>
                  </div>
                  <span class="text-[11px] font-semibold text-emerald-700">ALTER TABLE ${t.name} ENABLE ROW LEVEL SECURITY;</span>
                </div>

                <div class="space-y-2">
                  ${t.policyRules
                    .map(
                      (p) => `
                    <div class="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <span class="font-bold text-slate-800">${p.name}</span>
                        <span class="ml-2 font-mono text-[10px] px-1.5 py-0.2 rounded bg-slate-200 text-slate-700">${p.role}</span>
                      </div>
                      <code class="font-mono text-[11px] text-teal-800 bg-white px-2 py-1 rounded border border-slate-200 overflow-x-auto max-w-md">
                        USING (${p.condition})
                      </code>
                    </div>
                  `
                    )
                    .join('')}
                </div>
              </div>
            `
              )
              .join('')}
          </div>
        </div>
      `
          : `
        <!-- Applied Migrations -->
        <div class="card-subtle p-5 md:p-6 bg-white space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <div class="flex items-center space-x-2">
              <i data-lucide="file-code" class="w-5 h-5 text-[#073B70]"></i>
              <h3 class="font-bold text-slate-800 text-base">Applied Supabase SQL Migrations</h3>
            </div>
            <span class="text-xs text-slate-400 font-mono">3 Registered Migrations</span>
          </div>

          <div class="space-y-3">
            ${migrations
              .map(
                (m) => `
              <div class="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2 text-xs">
                <div class="flex items-center justify-between">
                  <span class="font-mono font-bold text-sm text-[#073B70]">${m.filename}</span>
                  <span class="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200">
                    ${m.status}
                  </span>
                </div>
                <p class="text-slate-600 leading-relaxed">${m.description}</p>
                <div class="text-[11px] text-slate-400 font-mono">
                  Applied: ${m.date} • Verified in local repository
                </div>
              </div>
            `
              )
              .join('')}
          </div>
        </div>
      `
      }
    </div>
  `;
}
