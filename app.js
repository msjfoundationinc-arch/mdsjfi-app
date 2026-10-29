/* ============================================================
   Montessori de San Jose Foundation Inc.
   Student Database — Core Application Logic
   ============================================================ */

function escHtml(str) {
    if (!str && str !== 0) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}
const escapeHtml = escHtml;
window.escHtml = escHtml;
window.escapeHtml = escHtml;

function formatNumber(num) {
    const n = Number(num);
    if (isNaN(n)) return '0.00';
    return n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
window.formatNumber = formatNumber;

const DB_KEY = 'mdsj_students';
const SESSION_KEY = 'mdsj_session';
const ROWS_PER_PAGE = 15;
const DEFAULT_BASE_TUITION = 13000;

const USERS = [
    { id: "admin", username: "admin", password: "admin123", displayName: "NI\u00D1O ALOYSIUS B. COLEGADO", role: "School President", avatar: "president-avatar.jpg" },
    { id: "registrar", username: "registrar", password: "mdsjfiregistrar", displayName: "CARRELLE B. COLEGADO", role: "Registrar / In-Charge, Accounting", avatar: "registrar-avatar.jpg" },
    { id: "teacher", username: "teacher", password: "mdsjfiteacher", displayName: "FACULTY TEACHER", role: "Faculty / Class Adviser", avatar: "" }
];

let students = [];
let currentPage = 1;
let sortField = 'lastName';
let sortDir = 'asc';
let currentViewId = null;
let currentSOAStudentId = null;
let currentSOAMode = 'view';
let gradeChart = null;
let genderChart = null;
let deleteTargetId = null;
window.deleteTargetId = null;
let currentUser = null;
let currentSchoolYear = '2026-2027';

const GRADE_SECTIONS = {
    '7': 'Jade',
    '8': 'Diamond',
    '9': 'Gold',
    '10': 'Amber'
};
window.GRADE_SECTIONS = GRADE_SECTIONS;

// ======================== DASHBOARD QUICK ACCESS SEARCH & LAUNCHER ========================

const DASHBOARD_QUICK_ACTIONS = [
    {
        id: 'soa',
        name: 'Statement of Account (SOA)',
        category: 'Financial & Accounting',
        keywords: 'statement account financial ledger billing tuition fees payment soa balance print summary',
        icon: 'fas fa-file-invoice-dollar',
        color: '#0284c7',
        action: () => navigateTo('soa')
    },
    {
        id: 'print-financial-summary',
        name: 'Print Financial Summary (SOA)',
        category: 'Financial & Accounting',
        keywords: 'print financial summary soa statement account ledger report signatories carrelle nino',
        icon: 'fas fa-print',
        color: '#0284c7',
        action: () => printSOAPageSummary()
    },
    {
        id: 'export-options',
        name: 'Export Data & Reports',
        category: 'Data Management & Export',
        keywords: 'export data options download excel csv students soa cash flow activities payroll',
        icon: 'fas fa-file-export',
        color: '#16a34a',
        action: () => openExportOptionsModal()
    },
    {
        id: 'cash-flow',
        name: 'Daily Cash In & Out Flow',
        category: 'Financial & Accounting',
        keywords: 'daily cash in out flow register income expense collections transactions disbursement receipt delete',
        icon: 'fas fa-cash-register',
        color: '#16a34a',
        action: () => navigateTo('cash-flow')
    },
    {
        id: 'clearance',
        name: 'Student Clearance (Examination)',
        category: 'Academic & Examination',
        keywords: 'student clearance examination exam permit quarter testing assessment approval partial payment',
        icon: 'fas fa-clipboard-check',
        color: '#d97706',
        action: () => navigateTo('clearance')
    },
    {
        id: 'promissory',
        name: 'Promissory Notes & Granted Overrides',
        category: 'Academic & Examination',
        keywords: 'promissory note granted overrides exception partial payment countdown exam clearance remaining days',
        icon: 'fas fa-handshake',
        color: '#8b5cf6',
        action: () => { navigateTo('clearance'); switchClearanceSubTab('promissory'); }
    },
    {
        id: 'payroll',
        name: 'Faculty & Staff Payroll',
        category: 'Human Resources & Compensation',
        keywords: 'payroll faculty staff salary 8000 363.60 daily rate compensation 15th 30th days attended remarks payslip',
        icon: 'fas fa-money-check-alt',
        color: '#059669',
        action: () => navigateTo('payroll')
    },
    {
        id: 'teachers',
        name: 'Teachers & Faculty Directory',
        category: 'Human Resources & Academics',
        keywords: 'teachers faculty directory roster profiles photos subjects load teacher assignment credentials principal',
        icon: 'fas fa-chalkboard-teacher',
        color: '#2563eb',
        action: () => navigateTo('teachers')
    },
    {
        id: 'grade7',
        name: 'Grade 7 Students Roster',
        category: 'Learner Cohorts',
        keywords: 'grade 7 seven jade junior high enrollees class list',
        icon: 'fas fa-layer-group',
        color: '#0891b2',
        action: () => navigateTo('grade7')
    },
    {
        id: 'grade8',
        name: 'Grade 8 Students Roster',
        category: 'Learner Cohorts',
        keywords: 'grade 8 eight ruby junior high enrollees class list',
        icon: 'fas fa-layer-group',
        color: '#0891b2',
        action: () => navigateTo('grade8')
    },
    {
        id: 'grade9',
        name: 'Grade 9 Students Roster',
        category: 'Learner Cohorts',
        keywords: 'grade 9 nine sapphire junior high enrollees class list',
        icon: 'fas fa-layer-group',
        color: '#0891b2',
        action: () => navigateTo('grade9')
    },
    {
        id: 'grade10',
        name: 'Grade 10 Students Roster',
        category: 'Learner Cohorts',
        keywords: 'grade 10 ten diamond junior high enrollees class list completer finisher',
        icon: 'fas fa-layer-group',
        color: '#0891b2',
        action: () => navigateTo('grade10')
    },
    {
        id: 'students',
        name: 'All Enrolled Learners Database',
        category: 'Learner Records',
        keywords: 'all students learners enrolled database list directory masterlist 49 active',
        icon: 'fas fa-users',
        color: '#0b2545',
        action: () => navigateTo('students')
    },
    {
        id: 'add-student',
        name: 'Enroll New Learner',
        category: 'Admissions & Enrollment',
        keywords: 'enroll new student register admission encode learner profile photo upload',
        icon: 'fas fa-user-plus',
        color: '#15803d',
        action: () => navigateTo('add-student')
    },
    {
        id: 'activities',
        name: 'Current Activities & Audit Trail',
        category: 'System Logs',
        keywords: 'current activities audit trail log history actions user events timestamp refresh',
        icon: 'fas fa-history',
        color: '#475569',
        action: () => navigateTo('activities')
    },
    {
        id: 'promote',
        name: 'Advance / Promote to Next S.Y.',
        category: 'Academic Advancement',
        keywords: 'advance promote next school year roll over graduation step up promotion batch',
        icon: 'fas fa-graduation-cap',
        color: '#7c3aed',
        action: () => navigateTo('promote')
    },
    {
        id: 'alumni',
        name: 'JHS Finisher / Alumni Directory',
        category: 'Alumni Registry',
        keywords: 'jhs finisher alumni graduates completers directory historical records diploma',
        icon: 'fas fa-award',
        color: '#b45309',
        action: () => navigateTo('alumni')
    },
    {
        id: 'archive',
        name: 'Archived Student Records',
        category: 'Records Management',
        keywords: 'archive archived soft deleted restored records repository restore purge',
        icon: 'fas fa-archive',
        color: '#64748b',
        action: () => navigateTo('archive')
    }
];

function initDashboardQuickSearch() {
    const grid = document.getElementById('dashboardQuickLinksGrid');
    if (grid) {
        grid.innerHTML = '';
        grid.style.display = 'none';
    }
}

function filterDashboardQuickLinks(query) {
    const q = (query || '').toLowerCase().trim();
    const clearBtn = document.getElementById('btnClearDashboardQuickSearch');
    if (clearBtn) clearBtn.style.display = q ? 'block' : 'none';

    const grid = document.getElementById('dashboardQuickLinksGrid');
    if (!grid) return;

    if (!q) {
        grid.innerHTML = '';
        grid.style.display = 'none';
        return;
    }

    const filtered = DASHBOARD_QUICK_ACTIONS.filter(item => {
        const text = `${item.name} ${item.category} ${item.keywords}`.toLowerCase();
        return text.includes(q);
    });

    grid.style.display = 'flex';
    renderDashboardQuickLinks(filtered, q);
}

function clearDashboardQuickSearch() {
    const input = document.getElementById('dashboardQuickSearchInput');
    if (input) input.value = '';
    const clearBtn = document.getElementById('btnClearDashboardQuickSearch');
    if (clearBtn) clearBtn.style.display = 'none';
    const grid = document.getElementById('dashboardQuickLinksGrid');
    if (grid) {
        grid.innerHTML = '';
        grid.style.display = 'none';
    }
}

function renderDashboardQuickLinks(items, query = '') {
    const grid = document.getElementById('dashboardQuickLinksGrid');
    if (!grid) return;

    if (!items || items.length === 0) {
        grid.innerHTML = `
            <div style="width: 100%; padding: 12px; background: rgba(255,255,255,0.08); border-radius: 8px; font-size: 0.85rem; color: #cbd5e1; text-align: center;">
                <i class="fas fa-search" style="margin-right: 6px; color: #94a3b8;"></i> No quick action modules found matching "<strong>${escapeHtml(query)}</strong>".
            </div>
        `;
        return;
    }

    grid.innerHTML = items.map(item => `
        <div class="quick-link-tile" 
            onclick="executeDashboardQuickAction('${item.id}')" 
            title="Open ${escapeHtml(item.name)} (${escapeHtml(item.category)})"
            style="display:flex; align-items:center; gap:8px; padding:7px 12px; background:rgba(255,255,255,0.12); border-radius:8px; cursor:pointer; transition:all 0.15s ease; border:1px solid rgba(255,255,255,0.18); font-size:0.83rem; font-weight:600; color:#fff;">
            <i class="${item.icon}" style="color:${item.color}; font-size:0.95rem;"></i>
            <span>${escapeHtml(item.name)}</span>
        </div>
    `).join('');
}

function executeDashboardQuickAction(actionId) {
    const item = DASHBOARD_QUICK_ACTIONS.find(a => a.id === actionId);
    if (item && typeof item.action === 'function') {
        item.action();
    }
}
window.realExecuteDashboardQuickAction = executeDashboardQuickAction;
window.executeDashboardQuickAction = executeDashboardQuickAction;
window.DASHBOARD_QUICK_ACTIONS = DASHBOARD_QUICK_ACTIONS;
window.initDashboardQuickSearch = initDashboardQuickSearch;
window.filterDashboardQuickLinks = filterDashboardQuickLinks;
window.clearDashboardQuickSearch = clearDashboardQuickSearch;
window.renderDashboardQuickLinks = renderDashboardQuickLinks;

function handleGradeLevelChange(val) {
    const secInput = document.getElementById('section');
    if (secInput && val && GRADE_SECTIONS[val]) {
        secInput.value = GRADE_SECTIONS[val];
    }
    const finisherGroup = document.getElementById('jhsFinisherGroup');
    const finisherCheck = document.getElementById('isJhsFinisher');
    if (finisherGroup) {
        if (String(val) === '10') {
            finisherGroup.style.display = 'block';
            const statusVal = (document.getElementById('enrollmentStatus')?.value || '').toLowerCase();
            if (statusVal === 'graduated' || statusVal === 'completed') {
                if (finisherCheck) finisherCheck.checked = true;
            }
        } else {
            finisherGroup.style.display = 'none';
            if (finisherCheck) finisherCheck.checked = false;
        }
    }
}
window.handleGradeLevelChange = handleGradeLevelChange;

// Sample document placeholders
const SAMPLE_DOC_DATA = 'data:application/pdf;base64,JVBERi0xLjQKJcTl8uXrp/Og0MTGCjQgMCBvYmoKPDwKL0ZpbHRlciAvRmxhdGVEZWNvZGUKL0xlbmd0aCA0Mg==Cj4+CnN0cmVhbQp4nGNgYGBkYGdgYWBiYAgAQwEAADoAPQplbmRzdHJlYW0KZW5kb2JqCg==';
const SAMPLE_SIG_DATA = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="60"><path d="M 10 35 Q 40 10 70 30 T 130 25 T 190 35" stroke="%231e3a8a" stroke-width="2.5" fill="none"/></svg>';

function getCurrentUser() {
    if (currentUser && currentUser.username) return currentUser;
    if (window.currentUser && window.currentUser.username) {
        currentUser = window.currentUser;
        return currentUser;
    }
    try {
        const raw = sessionStorage.getItem('mdsj_session') || sessionStorage.getItem('mdsj_user') || localStorage.getItem('mdsj_session') || localStorage.getItem('mdsj_user');
        if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed && parsed.username) {
                currentUser = parsed;
                window.currentUser = parsed;
                try {
                    sessionStorage.setItem('mdsj_session', raw);
                    sessionStorage.setItem('mdsj_user', raw);
                    localStorage.setItem('mdsj_session', raw);
                    localStorage.setItem('mdsj_user', raw);
                } catch(e) {}
                return parsed;
            }
        }
    } catch(e) {}
    return null;
}
window.getCurrentUser = getCurrentUser;

function isAdmin() {
    const u = getCurrentUser();
    if (!u) return false;
    const un = (u.username || '').toLowerCase();
    const r = (u.role || '').toLowerCase();
    return un === 'admin' || r.includes('president') || r.includes('administrator');
}
window.isAdmin = isAdmin;

function isRegistrar() {
    const u = getCurrentUser();
    if (!u) return false;
    const un = (u.username || '').toLowerCase();
    const r = (u.role || '').toLowerCase();
    return un === 'registrar' || r.includes('registrar');
}
window.isRegistrar = isRegistrar;

function isTeacher() {
    const u = getCurrentUser();
    if (!u) return false;
    const un = (u.username || '').toLowerCase();
    const r = (u.role || '').toLowerCase();
    return un === 'teacher' || r.includes('teacher') || r.includes('faculty');
}
window.isTeacher = isTeacher;

function canEncodeCashFlow() {
    return isAdmin() || isRegistrar();
}
window.canEncodeCashFlow = canEncodeCashFlow;

function generateId() {
    return 'STU-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6);
}

function findStudent(id) {
    if (!id) return null;
    const strId = String(id).trim();
    const stripped = strId.replace(/^STU-/, '');
    return students.find(s => 
        String(s.id) === strId || 
        String(s.id) === stripped || 
        String(s.id) === ('STU-' + stripped) ||
        String(s.studentNumber) === strId ||
        String(s.studentNumber) === stripped ||
        String(s.lrn) === strId
    ) || null;
}

// ======================== DATA LAYER & COHORT SEEDING ========================

function loadStudents() {
    const matrixData = (typeof OFFICIAL_IMPORTED_STUDENTS !== 'undefined' && Array.isArray(OFFICIAL_IMPORTED_STUDENTS) && OFFICIAL_IMPORTED_STUDENTS.length > 0)
        ? OFFICIAL_IMPORTED_STUDENTS
        : ((typeof window !== 'undefined' && Array.isArray(window.IMPORTED_STUDENTS_MATRIX))
            ? window.IMPORTED_STUDENTS_MATRIX
            : (typeof IMPORTED_STUDENTS_MATRIX !== 'undefined' ? IMPORTED_STUDENTS_MATRIX : []));

    let data = null;
    try { data = localStorage.getItem(DB_KEY); } catch (e) {}

    if (data && (data.includes('\u00e2\u201a\u00b1') || data.includes('â‚±'))) {
        data = data.replace(/(\u00e2\u201a\u00b1|â‚±)/g, '₱');
        try { localStorage.setItem(DB_KEY, data); } catch (e) {}
    }

    students = [];
    if (data) {
        try { students = JSON.parse(data); } catch (e) { students = []; }
    }
    if (!Array.isArray(students)) students = [];

    const sy2026Count = students.filter(s => s.schoolYear === '2026-2027').length;
    const hasObsoleteMock = students.some(s => ['STU-001', 'STU-002', 'STU-003', 'STU-004'].includes(s.id));

    if (matrixData && matrixData.length > 0) {
        if (students.length === 0 || hasObsoleteMock || sy2026Count < matrixData.length) {
            const matrixLrns = new Set(matrixData.map(m => String(m.lrn).trim()));
            const matrixIds = new Set(matrixData.map(m => m.id || (m.studentNumber ? ('STU-' + m.studentNumber) : ('STU-' + m.lrn))));
            const retainedCustomStudents = students.filter(s => 
                !['STU-001', 'STU-002', 'STU-003', 'STU-004'].includes(s.id) && 
                !matrixIds.has(s.id) && 
                !matrixLrns.has(String(s.lrn).trim())
            );
            const officialCopy = JSON.parse(JSON.stringify(matrixData));
            officialCopy.forEach(s => {
                if (!s.id) s.id = s.studentNumber ? ('STU-' + s.studentNumber) : ('STU-' + s.lrn);
                s.schoolYear = s.schoolYear || '2026-2027';
                if (s.studentNumber === '2026-07001' || s.lrn === '110253190313') {
                    s.signature = SAMPLE_SIG_DATA;
                    s.birthCertDoc = { name: 'PSA_BirthCertificate.pdf', type: 'application/pdf', size: '156 KB', data: SAMPLE_DOC_DATA, dateUploaded: new Date().toISOString() };
                    s.torDoc = { name: 'Form_137_TOR.pdf', type: 'application/pdf', size: '142 KB', data: SAMPLE_DOC_DATA, dateUploaded: new Date().toISOString() };
                    s.studentCardDoc = { name: 'Form_138_ReportCard.pdf', type: 'application/pdf', size: '118 KB', data: SAMPLE_DOC_DATA, dateUploaded: new Date().toISOString() };
                }
            });
            students = [...officialCopy, ...retainedCustomStudents];
            saveStudents();
        }
    }

    students.forEach(s => {
        if (!s.photo) s.photo = '';
        if (!s.schoolYear || s.schoolYear === '2025-2026') {
            s.schoolYear = '2026-2027';
        }
        if (s.gradeLevel && GRADE_SECTIONS[s.gradeLevel]) {
            s.section = GRADE_SECTIONS[s.gradeLevel];
        }
        if (s.payments && Array.isArray(s.payments)) {
            s.payments = s.payments.map(p => {
                if (!p) return null;
                if (typeof p === 'string') {
                    if (p.startsWith('@{') && p.endsWith('}')) {
                        const body = p.slice(2, -1);
                        const parts = body.split(';');
                        const obj = {};
                        parts.forEach(part => {
                            const eqIdx = part.indexOf('=');
                            if (eqIdx !== -1) {
                                const k = part.slice(0, eqIdx).trim();
                                let v = part.slice(eqIdx + 1).trim();
                                if (k === 'amount') v = Number(v) || 0;
                                obj[k] = v;
                            }
                        });
                        return obj;
                    }
                    try { return JSON.parse(p); } catch (e) { return { term: 'Installment', amount: 0, notes: p }; }
                }
                if (typeof p === 'object') {
                    p.amount = Number(p.amount) || 0;
                    if (p.notes && typeof p.notes === 'string' && p.notes.includes('2025-2026')) {
                        p.notes = p.notes.replace(/2025-2026/g, '2026-2027');
                    }
                    return p;
                }
                return null;
            }).filter(Boolean);
        }
    });
    saveStudents();
}

function saveStudents() {
    try {
        localStorage.setItem(DB_KEY, JSON.stringify(students));
    } catch (e) {
        console.warn('LocalStorage save failed:', e);
    }
}

// ======================== INITIALIZATION & AUTH ========================

function initApp() {
    try {
        const isReload = (window.performance && window.performance.navigation && window.performance.navigation.type === 1) ||
                         (window.performance && window.performance.getEntriesByType && window.performance.getEntriesByType('navigation')[0] && window.performance.getEntriesByType('navigation')[0].type === 'reload');
        if (isReload) {
            const overlay = document.getElementById('appRefreshOverlay');
            if (overlay) {
                overlay.classList.add('active');
                setTimeout(() => overlay.classList.remove('active'), 450);
            }
        }
    } catch(e) {}

    let savedSy = '2026-2027';
    try {
        savedSy = sessionStorage.getItem('mdsj_selected_sy') || localStorage.getItem('mdsj_selected_sy') || '2026-2027';
    } catch(e) {}
    currentSchoolYear = savedSy;

    // Load persistent activities log (or initialize if empty)
    try {
        const storedActs = localStorage.getItem(ACTIVITIES_KEY);
        if (!storedActs) {
            localStorage.setItem(ACTIVITIES_KEY, JSON.stringify([]));
        }
    } catch(e) {}

    loadStudents();
    initGeoDropdowns();
    try { getCashFlowEntries(); } catch(e) {}
    try { getPayrollEmployees(); } catch(e) {}
    try { initDashboardQuickSearch(); } catch(e) {}

    // Check for direct mobile QR scan (?lrn=...)
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const lrnParam = urlParams.get('lrn');
        if (lrnParam) {
            const matched = (students || []).find(s => String(s.lrn).trim() === String(lrnParam).trim() || s.id === lrnParam);
            if (matched) {
                setTimeout(() => {
                    openLearnerMobilePass(matched.id);
                }, 200);
            }
        }
    } catch(e) {}

    const u = getCurrentUser();
    if (u && u.username) {
        showApp(u);
    } else {
        const overlay = document.getElementById('loginOverlay');
        if (overlay) {
            overlay.classList.remove('hidden');
            overlay.style.removeProperty('display');
            overlay.style.display = 'flex';
        }
        document.documentElement.classList.remove('user-logged-in');
        document.body.classList.add('app-hidden');
    }
}

function showApp(user) {
    currentUser = user || getCurrentUser();
    if (!currentUser || !currentUser.username) {
        const overlay = document.getElementById('loginOverlay');
        if (overlay) {
            overlay.classList.remove('hidden');
            overlay.style.removeProperty('display');
            overlay.style.display = 'flex';
        }
        document.documentElement.classList.remove('user-logged-in');
        document.body.classList.add('app-hidden');
        return;
    }
    window.currentUser = currentUser;
    try {
        const userJson = JSON.stringify(currentUser);
        sessionStorage.setItem('mdsj_session', userJson);
        sessionStorage.setItem('mdsj_user', userJson);
        sessionStorage.setItem('currentUser', userJson);
        localStorage.setItem('mdsj_session', userJson);
        localStorage.setItem('mdsj_user', userJson);
        localStorage.setItem('mdsj_currentUser', userJson);
        localStorage.setItem('currentUser', userJson);
    } catch(e) {}

    const overlay = document.getElementById('loginOverlay');
    if (overlay) {
        overlay.classList.add('hidden');
        overlay.style.display = 'none';
    }
    document.body.classList.remove('app-hidden');
    document.documentElement.classList.add('user-logged-in');

    if (isTeacher()) {
        document.body.classList.add('role-teacher');
        document.documentElement.classList.add('role-teacher');
    } else {
        document.body.classList.remove('role-teacher');
        document.documentElement.classList.remove('role-teacher');
    }

    const userEl = document.getElementById('loggedInUser');
    if (userEl) userEl.textContent = currentUser.displayName || (isAdmin() ? 'NI\u00D1O ALOYSIUS B. COLEGADO' : 'CARRELLE B. COLEGADO');
    const roleEl = document.getElementById('loggedInRole');
    if (roleEl) roleEl.textContent = currentUser.role || (isAdmin() ? 'School President' : 'Registrar / In-Charge, Accounting');
    const avatarEl = document.getElementById('sidebarUserAvatar');
    if (avatarEl) {
        if (isTeacher()) {
            avatarEl.innerHTML = '<div style="width:100%; height:100%; border-radius:50%; background:#dbeafe; color:#1e40af; display:flex; align-items:center; justify-content:center; font-size:1.25rem; font-weight:700;"><i class="fas fa-chalkboard-teacher"></i></div>';
            avatarEl.classList.remove('has-image');
        } else if (isRegistrar()) {
            avatarEl.innerHTML = '<img src="registrar-avatar.jpg" alt="' + (currentUser.displayName || 'Registrar') + '" class="president-avatar-img">';
            avatarEl.classList.add('has-image');
        } else {
            avatarEl.innerHTML = '<img src="president-avatar.jpg" alt="' + (currentUser.displayName || 'President') + '" class="president-avatar-img">';
            avatarEl.classList.add('has-image');
        }
    }

    try { initNavigation(); } catch (e) {}
    try { initForm(); } catch (e) {}
    try { initFilters(); } catch (e) {}
    try { initModals(); } catch (e) {}
    try { initExportImport(); } catch (e) {}
    try { initMobileMenu(); } catch (e) {}
    try { populateSchoolYearDropdowns(); } catch (e) {}
    try { setGlobalSchoolYear('2026-2027', true); } catch (e) {}
    try { refreshAll(); } catch (e) {}
    try { updatePayrollArchivesBadge(); } catch (e) {}

    // Restore current active page on refresh / F5 or reopening closed window
    let savedPage = 'dashboard';
    try {
        const hash = (window.location.hash || '').replace('#', '').trim();
        savedPage = hash || sessionStorage.getItem('mdsj_active_page') || localStorage.getItem('mdsj_active_page') || 'dashboard';
        if (isTeacher() && (savedPage === 'soa' || savedPage === 'cash-flow' || savedPage === 'payroll')) {
            savedPage = 'dashboard';
        }
    } catch(e) {}
    navigateTo(savedPage);
}

// ======================== NAVIGATION & S.Y. MANAGER ========================

function initNavigation() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', e => {
            const page = item.dataset.page;
            if (page) {
                e.preventDefault();
                navigateTo(page);
            }
        });
    });
}

function navigateTo(pageId) {
    if (!pageId) return;

    if (pageId === 'cashflow') pageId = 'cash-flow';

    if (pageId === 'soa' && typeof isTeacher === 'function' && isTeacher()) {
        showToast('Access Restricted: Teachers cannot view confidential Statement of Account.', 'warning');
        navigateTo('dashboard');
        return;
    }
    if (pageId === 'cash-flow' && typeof isTeacher === 'function' && isTeacher()) {
        showToast('Access Restricted: Teachers cannot view Cash In & Out Flow.', 'warning');
        navigateTo('dashboard');
        return;
    }
    if (pageId === 'payroll' && typeof isTeacher === 'function' && isTeacher()) {
        showToast('Access Restricted: Only School President and Registrar/Accounting accounts can view Faculty & Staff Payroll.', 'warning');
        navigateTo('dashboard');
        return;
    }

    // Toggle view-fit-window mode for fixed-height single-window views
    const fitWindowPages = ['clearance', 'payroll', 'teachers', 'cash-flow'];
    if (fitWindowPages.includes(pageId)) {
        document.body.classList.add('view-fit-window');
    } else {
        document.body.classList.remove('view-fit-window');
    }

    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.querySelectorAll('.nav-subitem').forEach(n => n.classList.remove('active'));

    const ylDropdown = document.getElementById('navYearLevelDropdown');
    const ylToggle = document.getElementById('btnYearLevelToggle');

    if (pageId.startsWith('grade')) {
        if (ylDropdown) ylDropdown.classList.add('open');
        if (ylToggle) {
            ylToggle.classList.add('active');
            ylToggle.setAttribute('aria-expanded', 'true');
        }
        const activeSub = document.querySelector(`.nav-subitem[data-page="${pageId}"]`);
        if (activeSub) activeSub.classList.add('active');
    } else {
        const navItem = document.querySelector(`.nav-item[data-page="${pageId}"]`);
        if (navItem) navItem.classList.add('active');
        if (ylToggle) ylToggle.classList.remove('active');
    }

    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const targetPage = document.getElementById('page-' + pageId);
    if (targetPage) targetPage.classList.add('active');

    // Persist current active tab for browser refresh (F5)
    try {
        sessionStorage.setItem('mdsj_active_page', pageId);
        localStorage.setItem('mdsj_active_page', pageId);
        if (window.location.hash !== '#' + pageId) {
            history.replaceState(null, null, '#' + pageId);
        }
    } catch(e) {}

    const sidebar = document.getElementById('sidebar');
    if (sidebar) sidebar.classList.remove('open');

    if (pageId === 'dashboard') refreshDashboard();
    else if (pageId === 'students') { 
        currentPage = 1; 
        initTableSorting(); 
        refreshStudentsTable(); 
    }
    else if (pageId.startsWith('grade')) refreshGradeTable(pageId.replace('grade', ''));
    else if (pageId === 'soa') refreshSOAPage();
    else if (pageId === 'cash-flow') refreshCashFlowPage();
    else if (pageId === 'clearance') refreshClearancePage();
    else if (pageId === 'payroll') refreshPayrollPage();
    else if (pageId === 'teachers') refreshTeachersPage();
    else if (pageId === 'archive') refreshArchiveTable();
    else if (pageId === 'activities') refreshActivitiesPage();
    else if (pageId === 'promote') initPromotePage();
    else if (pageId === 'alumni') refreshAlumniPage();
    else if (pageId === 'add-student') {
        if (!document.getElementById('editStudentId').value) resetForm();
    }

    window.scrollTo(0, 0);
}

function getAllSchoolYears() {
    const currentCalYear = new Date().getFullYear();
    const maxFutureYear = Math.max(2040, currentCalYear + 15);
    const standardYears = [];
    
    // Future and upcoming years (from maxFutureYear down to 2000)
    for (let y = maxFutureYear; y >= 2000; y--) {
        standardYears.push(`${y}-${y + 1}`);
    }

    // Existing years from student database
    const studentYears = (students || []).map(s => s.schoolYear).filter(Boolean);

    // Custom school years saved by user/admin
    let customYears = [];
    try {
        const saved = localStorage.getItem('mdsj_custom_school_years');
        if (saved) customYears = JSON.parse(saved);
    } catch(e) {}

    const allSet = new Set([...studentYears, ...customYears, ...standardYears]);
    const list = Array.from(allSet);

    // Sort descending (latest/future first)
    list.sort((a, b) => {
        const ya = parseInt(a.split('-')[0]) || 0;
        const yb = parseInt(b.split('-')[0]) || 0;
        return yb - ya;
    });

    return list;
}
window.getAllSchoolYears = getAllSchoolYears;

function renderSchoolYearOptionsHtml(selectedValue, includeAll = false, includeCustom = false) {
    const allYears = getAllSchoolYears();
    const curOfficial = '2026-2027';
    let html = '';

    if (includeAll) {
        html += '<option value="">All School Years (Complete Archive)</option>';
    }

    const currentYearNum = parseInt(curOfficial.split('-')[0]) || 2026;

    const futureYears = allYears.filter(sy => {
        const y = parseInt(sy.split('-')[0]);
        return y > currentYearNum;
    });

    const pastYears = allYears.filter(sy => {
        const y = parseInt(sy.split('-')[0]);
        return y < currentYearNum;
    });

    // 1. Current Active School Year
    html += `<optgroup label="Current Active School Year">`;
    html += `<option value="${curOfficial}" ${selectedValue === curOfficial ? 'selected' : ''}>S.Y. ${curOfficial} (Current S.Y.)</option>`;
    html += `</optgroup>`;

    // 2. Upcoming & Future School Years (2027-2028 and beyond)
    if (futureYears.length > 0) {
        html += `<optgroup label="Upcoming & Future Academic Years">`;
        futureYears.forEach(sy => {
            const isNearFuture = parseInt(sy.split('-')[0]) <= currentYearNum + 2;
            const label = isNearFuture ? `S.Y. ${sy} (Upcoming S.Y.)` : `S.Y. ${sy}`;
            html += `<option value="${sy}" ${selectedValue === sy ? 'selected' : ''}>${label}</option>`;
        });
        html += `</optgroup>`;
    }

    // 3. Past School Years & Archive
    if (pastYears.length > 0) {
        html += `<optgroup label="Past School Years & Historical Archive">`;
        pastYears.forEach(sy => {
            html += `<option value="${sy}" ${selectedValue === sy ? 'selected' : ''}>S.Y. ${sy}</option>`;
        });
        html += `</optgroup>`;
    }

    if (includeCustom) {
        html += `<option value="__custom__">+ Enter Custom / Future S.Y...</option>`;
    }

    return html;
}
window.renderSchoolYearOptionsHtml = renderSchoolYearOptionsHtml;

function setGlobalSchoolYear(sy, skipRefresh = false) {
    currentSchoolYear = sy || '2026-2027';
    try {
        sessionStorage.setItem('mdsj_selected_sy', currentSchoolYear);
        localStorage.setItem('mdsj_selected_sy', currentSchoolYear);
    } catch (e) {}

    const dashSelect = document.getElementById('dashboardSchoolYear');
    if (dashSelect && dashSelect.value !== currentSchoolYear) dashSelect.value = currentSchoolYear;

    const filterSelect = document.getElementById('filterSchoolYear');
    if (filterSelect && filterSelect.value !== currentSchoolYear) filterSelect.value = currentSchoolYear;

    const soaFilterSy = document.getElementById('soaFilterSchoolYear');
    if (soaFilterSy && soaFilterSy.value !== currentSchoolYear) soaFilterSy.value = currentSchoolYear;

    document.querySelectorAll('.grade-sy-filter').forEach(sel => {
        if (sel.value !== currentSchoolYear) sel.value = currentSchoolYear;
    });

    updateSYHeaderLabels(currentSchoolYear);

    if (!skipRefresh) {
        refreshAll();
    }
}
window.setGlobalSchoolYear = setGlobalSchoolYear;

function updateSYHeaderLabels(sy) {
    const text = sy ? (' - S.Y. ' + sy) : ' - All School Years';
    const syLabel = document.getElementById('schoolYear');
    if (syLabel) syLabel.textContent = sy || '2026-2027';

    document.querySelectorAll('.sy-dynamic-title').forEach(el => {
        const base = el.dataset.baseTitle || el.textContent.split(' - ')[0];
        el.dataset.baseTitle = base;
        el.textContent = base + text;
    });

    const stuSyLabel = document.getElementById('studentsSyLabel');
    if (stuSyLabel) stuSyLabel.textContent = text;
}
window.updateSYHeaderLabels = updateSYHeaderLabels;

function populateSchoolYearDropdowns() {
    const cur = currentSchoolYear || '2026-2027';

    const filterSelect = document.getElementById('filterSchoolYear');
    if (filterSelect) {
        filterSelect.innerHTML = renderSchoolYearOptionsHtml(cur, true, false);
        filterSelect.value = cur;
    }

    const dashSelect = document.getElementById('dashboardSchoolYear');
    if (dashSelect) {
        dashSelect.innerHTML = renderSchoolYearOptionsHtml(cur, false, false);
        dashSelect.value = cur;
    }

    const soaFilterSy = document.getElementById('soaFilterSchoolYear');
    if (soaFilterSy) {
        soaFilterSy.innerHTML = renderSchoolYearOptionsHtml(cur, true, false);
        soaFilterSy.value = cur;
    }

    document.querySelectorAll('.grade-sy-filter').forEach(select => {
        select.innerHTML = renderSchoolYearOptionsHtml(cur, true, false);
        select.value = cur;
    });

    const formSy = document.getElementById('formSchoolYear');
    if (formSy) {
        formSy.innerHTML = renderSchoolYearOptionsHtml(cur, false, true);
        formSy.value = cur;
    }
}
window.populateSchoolYearDropdowns = populateSchoolYearDropdowns;

function handleFormSchoolYearChange(val) {
    const customInput = document.getElementById('customSchoolYear');
    if (!customInput) return;
    if (val === '__custom__' || val === 'custom') {
        customInput.style.display = 'block';
        customInput.focus();
    } else {
        customInput.style.display = 'none';
        customInput.value = '';
    }
}
window.handleFormSchoolYearChange = handleFormSchoolYearChange;

function registerCustomSchoolYear(sy) {
    if (!sy) return;
    const cleanSy = String(sy).trim();
    const parts = cleanSy.split('-');
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        try {
            let customYears = [];
            const saved = localStorage.getItem('mdsj_custom_school_years');
            if (saved) customYears = JSON.parse(saved);
            if (!customYears.includes(cleanSy)) {
                customYears.push(cleanSy);
                localStorage.setItem('mdsj_custom_school_years', JSON.stringify(customYears));
            }
        } catch(e) {}
        populateSchoolYearDropdowns();
    }
}
window.registerCustomSchoolYear = registerCustomSchoolYear;

function enrollForCurrentSY() {
    navigateTo('add-student');
    resetForm();
    const sySelect = document.getElementById('formSchoolYear');
    if (sySelect) {
        sySelect.value = currentSchoolYear || '2026-2027';
    }
}
window.enrollForCurrentSY = enrollForCurrentSY;

function openPromoteSYModal() {
    const modal = document.getElementById('promoteSchoolYearModal');
    if (!modal) return;

    const allYears = getAllSchoolYears();
    const sourceSelect = document.getElementById('promoteSourceSY');
    const targetSelect = document.getElementById('promoteTargetSY');

    if (sourceSelect) {
        sourceSelect.innerHTML = allYears.map(sy => `<option value="${sy}" ${sy === currentSchoolYear ? 'selected' : ''}>S.Y. ${sy}</option>`).join('');
    }

    if (targetSelect) {
        const curParts = (currentSchoolYear || '2026-2027').split('-');
        const nextSy = `${parseInt(curParts[0]) + 1}-${parseInt(curParts[1]) + 1}`;
        targetSelect.innerHTML = allYears.map(sy => `<option value="${sy}" ${sy === nextSy ? 'selected' : ''}>S.Y. ${sy}</option>`).join('');
        if (!allYears.includes(nextSy)) {
            targetSelect.innerHTML = `<option value="${nextSy}" selected>S.Y. ${nextSy} (Upcoming)</option>` + targetSelect.innerHTML;
        }
        targetSelect.value = nextSy;
    }

    updatePromotePreview();
    openModal('promoteSchoolYearModal');
}
window.openPromoteSYModal = openPromoteSYModal;

function updatePromotePreview() {
    const sourceSy = document.getElementById('promoteSourceSY')?.value || currentSchoolYear || '2026-2027';
    const targetSy = document.getElementById('promoteTargetSY')?.value || '2027-2028';
    const activeStudents = students.filter(s => s.schoolYear === sourceSy && (s.enrollmentStatus || 'Active') === 'Active');

    const g7 = activeStudents.filter(s => String(s.gradeLevel) === '7').length;
    const g8 = activeStudents.filter(s => String(s.gradeLevel) === '8').length;
    const g9 = activeStudents.filter(s => String(s.gradeLevel) === '9').length;
    const g10 = activeStudents.filter(s => String(s.gradeLevel) === '10').length;

    const summaryEl = document.getElementById('promotePreviewSummary');
    if (summaryEl) {
        summaryEl.innerHTML = `
            <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:12px; font-size:0.83rem; line-height:1.5;">
                <div style="font-weight:700; color:var(--primary); margin-bottom:8px;">
                    <i class="fas fa-users"></i> Cohort Promotion Preview (${activeStudents.length} Active Students in S.Y. ${sourceSy}):
                </div>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px;">
                    <div>&bull; <strong>${g7}</strong> Grade 7 &rarr; <strong>Grade 8 (Diamond)</strong> in ${targetSy}</div>
                    <div>&bull; <strong>${g8}</strong> Grade 8 &rarr; <strong>Grade 9 (Gold)</strong> in ${targetSy}</div>
                    <div>&bull; <strong>${g9}</strong> Grade 9 &rarr; <strong>Grade 10 (Amber)</strong> in ${targetSy}</div>
                    <div>&bull; <strong>${g10}</strong> Grade 10 &rarr; <strong>JHS Completer / Alumni</strong></div>
                </div>
                <div style="margin-top:8px; font-size:0.78rem; color:#64748b;">
                    <i class="fas fa-shield-alt"></i> Historical records for S.Y. ${sourceSy} remain 100% saved and intact.
                </div>
            </div>
        `;
    }
}
window.updatePromotePreview = updatePromotePreview;

function initPromotePage() {
    const allYears = getAllSchoolYears();
    const sourceSelect = document.getElementById('promotePageSourceSY');
    const targetSelect = document.getElementById('promotePageTargetSY');

    if (sourceSelect) {
        sourceSelect.innerHTML = allYears.map(sy => `<option value="${sy}" ${sy === currentSchoolYear ? 'selected' : ''}>S.Y. ${sy}</option>`).join('');
    }

    if (targetSelect) {
        const curParts = (currentSchoolYear || '2026-2027').split('-');
        const nextSy = `${parseInt(curParts[0]) + 1}-${parseInt(curParts[1]) + 1}`;
        targetSelect.innerHTML = allYears.map(sy => `<option value="${sy}" ${sy === nextSy ? 'selected' : ''}>S.Y. ${sy}</option>`).join('');
        if (!allYears.includes(nextSy)) {
            targetSelect.innerHTML = `<option value="${nextSy}" selected>S.Y. ${nextSy} (Upcoming)</option>` + targetSelect.innerHTML;
        }
        targetSelect.value = nextSy;
    }

    updatePromotePagePreview();
}
window.initPromotePage = initPromotePage;

function updatePromotePagePreview() {
    const sourceSy = document.getElementById('promotePageSourceSY')?.value || currentSchoolYear || '2026-2027';
    const targetSy = document.getElementById('promotePageTargetSY')?.value || '2027-2028';
    const activeStudents = students.filter(s => s.schoolYear === sourceSy && (s.enrollmentStatus || 'Active') === 'Active');

    const g7 = activeStudents.filter(s => String(s.gradeLevel) === '7').length;
    const g8 = activeStudents.filter(s => String(s.gradeLevel) === '8').length;
    const g9 = activeStudents.filter(s => String(s.gradeLevel) === '9').length;
    const g10 = activeStudents.filter(s => String(s.gradeLevel) === '10').length;

    const summaryEl = document.getElementById('promotePagePreviewSummary');
    if (summaryEl) {
        summaryEl.innerHTML = `
            <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:18px;">
                <div style="font-weight:700; color:var(--primary); font-size:1rem; margin-bottom:12px; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px;">
                    <span><i class="fas fa-users" style="color:#2563eb;"></i> Cohort Promotion Breakdown (S.Y. ${sourceSy} &rarr; S.Y. ${targetSy})</span>
                    <span style="font-size:0.85rem; padding:3px 10px; border-radius:20px; background:#dbeafe; color:#1e40af; font-weight:600;">
                        ${activeStudents.length} Active Students in S.Y. ${sourceSy}
                    </span>
                </div>
                <div class="cohort-stat-grid">
                    <div class="cohort-stat-card">
                        <span class="stat-label"><i class="fas fa-arrow-circle-right" style="color:#16a34a;"></i> Grade 7 to 8</span>
                        <span class="stat-val">${g7}</span>
                        <span style="font-size:0.75rem; color:#64748b;">Advances to Grade 8 (Diamond)</span>
                    </div>
                    <div class="cohort-stat-card">
                        <span class="stat-label"><i class="fas fa-arrow-circle-right" style="color:#16a34a;"></i> Grade 8 to 9</span>
                        <span class="stat-val">${g8}</span>
                        <span style="font-size:0.75rem; color:#64748b;">Advances to Grade 9 (Gold)</span>
                    </div>
                    <div class="cohort-stat-card">
                        <span class="stat-label"><i class="fas fa-arrow-circle-right" style="color:#16a34a;"></i> Grade 9 to 10</span>
                        <span class="stat-val">${g9}</span>
                        <span style="font-size:0.75rem; color:#64748b;">Advances to Grade 10 (Amber)</span>
                    </div>
                    <div class="cohort-stat-card">
                        <span class="stat-label"><i class="fas fa-graduation-cap" style="color:#ea580c;"></i> Completers</span>
                        <span class="stat-val">${g10}</span>
                        <span style="font-size:0.75rem; color:#64748b;">JHS Completer / Alumni</span>
                    </div>
                </div>
            </div>
        `;
    }
}
window.updatePromotePagePreview = updatePromotePagePreview;

function executeBatchPromotionFromPage() {
    const sourceSy = document.getElementById('promotePageSourceSY')?.value;
    const targetSy = document.getElementById('promotePageTargetSY')?.value;

    if (!sourceSy || !targetSy) {
        showToast('Please select source and target school years.', 'error');
        return;
    }

    if (sourceSy === targetSy) {
        showToast('Target school year must be different from source school year.', 'warning');
        return;
    }

    const activeStudents = students.filter(s => s.schoolYear === sourceSy && (s.enrollmentStatus || 'Active') === 'Active');
    if (activeStudents.length === 0) {
        showToast(`No active students found in S.Y. ${sourceSy} to promote.`, 'warning');
        return;
    }

    // Confirmation from admin is strictly required regardless if user is admin
    requestAdminAuth(() => {
        proceedExecuteBatchPromotion(sourceSy, targetSy);
    }, 'Batch Student Promotion', `Advancing and promoting ${activeStudents.length} active students from S.Y. ${sourceSy} to S.Y. ${targetSy} is an audited administrative operation. Administrator credentials verification is required to proceed.`, true);
}
window.executeBatchPromotionFromPage = executeBatchPromotionFromPage;

function executeBatchPromotion() {
    const sourceSy = document.getElementById('promoteSourceSY')?.value;
    const targetSy = document.getElementById('promoteTargetSY')?.value;

    if (!sourceSy || !targetSy) {
        showToast('Please select source and target school years.', 'error');
        return;
    }

    if (sourceSy === targetSy) {
        showToast('Target school year must be different from source school year.', 'warning');
        return;
    }

    // Confirmation from admin is strictly required regardless if user is admin
    requestAdminAuth(() => {
        proceedExecuteBatchPromotion(sourceSy, targetSy);
    }, 'Batch Student Promotion', `Promoting students from S.Y. ${sourceSy} to S.Y. ${targetSy} requires Administrator credentials verification.`, true);
}
window.executeBatchPromotion = executeBatchPromotion;

function proceedExecuteBatchPromotion(sourceSy, targetSy) {
    const activeStudents = students.filter(s => s.schoolYear === sourceSy && (s.enrollmentStatus || 'Active') === 'Active');
    if (activeStudents.length === 0) {
        showToast(`No active students found in S.Y. ${sourceSy} to promote.`, 'warning');
        return;
    }

    const existingInTarget = new Set(students.filter(s => s.schoolYear === targetSy).map(s => String(s.lrn).trim()));

    let promotedCount = 0;
    let completedCount = 0;
    const newCohort = [];

    activeStudents.forEach(orig => {
        const lrn = String(orig.lrn).trim();
        if (existingInTarget.has(lrn)) {
            return;
        }

        const currentGrade = String(orig.gradeLevel);
        let nextGrade = '';
        let nextSection = '';

        if (currentGrade === '7') {
            nextGrade = '8';
            nextSection = GRADE_SECTIONS['8'] || 'Diamond';
        } else if (currentGrade === '8') {
            nextGrade = '9';
            nextSection = GRADE_SECTIONS['9'] || 'Gold';
        } else if (currentGrade === '9') {
            nextGrade = '10';
            nextSection = GRADE_SECTIONS['10'] || 'Amber';
        } else if (currentGrade === '10') {
            orig.enrollmentStatus = 'Graduated';
            orig.isJhsFinisher = true;
            orig.completionSchoolYear = orig.schoolYear || sourceSy;
            orig.completionDate = new Date().toISOString();
            orig.dateModified = new Date().toISOString();
            completedCount++;
            return;
        }

        if (nextGrade) {
            const tuition = Number(orig.tuitionFee) || DEFAULT_BASE_TUITION;
            const isEsc = (orig.escGrantee === 'YES');
            const discount = isEsc ? 9000 : ((orig.isDiscounted === 'YES' && Number(orig.discountAmount) > 0) ? Number(orig.discountAmount) : 0);
            const net = Math.max(0, tuition - discount);

            const promoted = {
                ...orig,
                id: generateId(),
                schoolYear: targetSy,
                gradeLevel: nextGrade,
                section: nextSection,
                enrollmentStatus: 'Active',
                tuitionFee: tuition,
                discountAmount: discount,
                netPayable: net,
                totalPaid: 0,
                remainingBalance: net,
                payments: [],
                dateCreated: new Date().toISOString(),
                dateModified: new Date().toISOString()
            };
            newCohort.push(promoted);
            promotedCount++;
        }
    });

    if (newCohort.length > 0 || completedCount > 0) {
        if (newCohort.length > 0) {
            students = [...newCohort, ...students];
        }
        registerCustomSchoolYear(targetSy);
        saveStudents();
        logActivity('STUDENT_PROMOTION', `Batch promoted ${promotedCount} students from S.Y. ${sourceSy} to S.Y. ${targetSy} (${completedCount} JHS Finishers marked)`);
    }

    closeModal('promoteSchoolYearModal');
    setGlobalSchoolYear(targetSy);
    if (document.getElementById('page-promote')?.classList.contains('active')) {
        initPromotePage();
    }
    showToast(`Successfully promoted ${promotedCount} students to S.Y. ${targetSy}! (${completedCount} Grade 10 completers)`, 'success');
}
window.proceedExecuteBatchPromotion = proceedExecuteBatchPromotion;

// ======================== DASHBOARD ========================
function refreshDashboard() {
    try {
        const cohort = currentSchoolYear ? students.filter(s => s.schoolYear === currentSchoolYear) : students;
        const active = cohort.filter(s => s.enrollmentStatus === 'Active');

        const setT = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
        setT('statTotal', cohort.length);
        setT('statGrade7', cohort.filter(s => String(s.gradeLevel) === '7').length);
        setT('statGrade8', cohort.filter(s => String(s.gradeLevel) === '8').length);
        setT('statGrade9', cohort.filter(s => String(s.gradeLevel) === '9').length);
        setT('statGrade10', cohort.filter(s => String(s.gradeLevel) === '10').length);
        setT('statMale', cohort.filter(s => (s.gender || '').toLowerCase() === 'male').length);
        setT('statFemale', cohort.filter(s => (s.gender || '').toLowerCase() === 'female').length);
        setT('statActive', active.length);
        setT('statEsc', cohort.filter(s => (s.escGrantee || 'NO').toUpperCase() === 'YES').length);

        const dashSY = document.getElementById('dashboardSchoolYear');
        if (dashSY && dashSY.value !== currentSchoolYear) {
            dashSY.value = currentSchoolYear;
        }

        try { renderCharts(cohort); } catch (e) { console.error('Dashboard charts error:', e); }
        try { renderRecentTable(cohort); } catch (e) { console.error('Dashboard recent table error:', e); }
        try { initDashboardQuickSearch(); } catch (e) { console.error('Dashboard quick search error:', e); }
    } catch (err) {
        console.error('Fatal in refreshDashboard:', err);
    }
}

function viewEscGrantees() {
    navigateTo('students');
    const escFilter = document.getElementById('filterEsc');
    if (escFilter) {
        escFilter.value = 'YES';
        currentPage = 1;
        refreshStudentsTable();
    }
}
window.viewEscGrantees = viewEscGrantees;

function viewStudentsByGender(gender) {
    navigateTo('students');
    const genFilter = document.getElementById('filterGender');
    if (genFilter) {
        genFilter.value = gender;
        currentPage = 1;
        refreshStudentsTable();
    }
}
window.viewStudentsByGender = viewStudentsByGender;

function renderCharts(cohort) {
    const list = cohort || [];
    const g7 = list.filter(s => String(s.gradeLevel) === '7').length;
    const g8 = list.filter(s => String(s.gradeLevel) === '8').length;
    const g9 = list.filter(s => String(s.gradeLevel) === '9').length;
    const g10 = list.filter(s => String(s.gradeLevel) === '10').length;
    const male = list.filter(s => (s.gender || '').toLowerCase() === 'male').length;
    const female = list.filter(s => (s.gender || '').toLowerCase() === 'female').length;

    const gradeCtx = document.getElementById('gradeChart');
    const genderCtx = document.getElementById('genderChart');

    if (typeof Chart !== 'undefined') {
        try {
            if (gradeCtx) {
                if (gradeChart) gradeChart.destroy();
                gradeChart = new Chart(gradeCtx, {
                    type: 'bar',
                    data: {
                        labels: ['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10'],
                        datasets: [{
                            label: 'Students',
                            data: [g7, g8, g9, g10],
                            backgroundColor: ['#42A5F5', '#AB47BC', '#FF7043', '#26A69A'],
                            borderRadius: 8
                        }]
                    },
                    options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }
                });
            }

            if (genderCtx) {
                if (genderChart) genderChart.destroy();
                genderChart = new Chart(genderCtx, {
                    type: 'doughnut',
                    data: {
                        labels: ['Male', 'Female'],
                        datasets: [{ data: [male, female], backgroundColor: ['#1976D2', '#E91E63'], borderWidth: 0 }]
                    },
                    options: { responsive: true, cutout: '60%', plugins: { legend: { position: 'bottom' } } }
                });
            }
            return;
        } catch (err) {
            console.warn('Chart.js render error, falling back to native 2D canvas:', err);
        }
    }

    // Native HTML5 Canvas 2D fallback renderer (100% offline, zero-dependency)
    if (gradeCtx && gradeCtx.getContext) {
        try {
            const ctx = gradeCtx.getContext('2d');
            const parentW = gradeCtx.parentElement ? gradeCtx.parentElement.clientWidth : 380;
            const w = Math.max(280, parentW - 30);
            const h = 200;
            gradeCtx.width = w;
            gradeCtx.height = h;
            ctx.clearRect(0, 0, w, h);

            const grades = [
                { label: 'Grade 7', count: g7, color: '#42A5F5' },
                { label: 'Grade 8', count: g8, color: '#AB47BC' },
                { label: 'Grade 9', count: g9, color: '#FF7043' },
                { label: 'Grade 10', count: g10, color: '#26A69A' }
            ];
            const maxVal = Math.max(1, ...grades.map(g => g.count));
            const barWidth = Math.floor(w / 6);
            const gap = Math.floor((w - (barWidth * 4)) / 5);

            grades.forEach((g, i) => {
                const x = gap + i * (barWidth + gap);
                const barH = Math.max(6, Math.round((g.count / maxVal) * (h - 65)));
                const y = (h - 32) - barH;

                ctx.fillStyle = g.color;
                if (ctx.roundRect) {
                    ctx.beginPath();
                    ctx.roundRect(x, y, barWidth, barH, [6, 6, 0, 0]);
                    ctx.fill();
                } else {
                    ctx.fillRect(x, y, barWidth, barH);
                }

                ctx.fillStyle = '#0f172a';
                ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(String(g.count), x + barWidth / 2, y - 6);

                ctx.fillStyle = '#64748b';
                ctx.font = '600 11px -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif';
                ctx.fillText(g.label, x + barWidth / 2, h - 12);
            });
        } catch (e) {
            console.error('Error drawing native grade chart:', e);
        }
    }

    if (genderCtx && genderCtx.getContext) {
        try {
            const ctx = genderCtx.getContext('2d');
            const parentW = genderCtx.parentElement ? genderCtx.parentElement.clientWidth : 380;
            const w = Math.max(280, parentW - 30);
            const h = 200;
            genderCtx.width = w;
            genderCtx.height = h;
            ctx.clearRect(0, 0, w, h);

            const total = (male + female) || 1;
            const malePct = Math.round((male / total) * 100);
            const femalePct = Math.round((female / total) * 100);

            const centerX = Math.floor(w / 2);
            const centerY = 85;
            const outerR = 56;
            const innerR = 34;

            const maleAngle = (male / total) * 2 * Math.PI;

            // Male slice
            ctx.fillStyle = '#1976D2';
            ctx.beginPath();
            ctx.arc(centerX, centerY, outerR, -Math.PI / 2, -Math.PI / 2 + maleAngle);
            ctx.arc(centerX, centerY, innerR, -Math.PI / 2 + maleAngle, -Math.PI / 2, true);
            ctx.closePath();
            ctx.fill();

            // Female slice
            ctx.fillStyle = '#E91E63';
            ctx.beginPath();
            ctx.arc(centerX, centerY, outerR, -Math.PI / 2 + maleAngle, -Math.PI / 2 + 2 * Math.PI);
            ctx.arc(centerX, centerY, innerR, -Math.PI / 2 + 2 * Math.PI, -Math.PI / 2 + maleAngle, true);
            ctx.closePath();
            ctx.fill();

            // Center count
            ctx.fillStyle = '#0f172a';
            ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(String(male + female), centerX, centerY);

            // Legend
            ctx.textBaseline = 'alphabetic';
            ctx.font = '600 12px -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif';
            
            ctx.fillStyle = '#1976D2';
            ctx.fillRect(centerX - 95, h - 20, 12, 12);
            ctx.fillStyle = '#334155';
            ctx.textAlign = 'left';
            ctx.fillText(`Male: ${male} (${malePct}%)`, centerX - 78, h - 10);

            ctx.fillStyle = '#E91E63';
            ctx.fillRect(centerX + 15, h - 20, 12, 12);
            ctx.fillStyle = '#334155';
            ctx.fillText(`Female: ${female} (${femalePct}%)`, centerX + 32, h - 10);
        } catch (e) {
            console.error('Error drawing native gender chart:', e);
        }
    }
}

// Window load listener to upgrade to Chart.js once loaded
window.addEventListener('load', () => {
    try {
        if (typeof Chart !== 'undefined') {
            const cohort = currentSchoolYear ? students.filter(s => s.schoolYear === currentSchoolYear) : students;
            renderCharts(cohort);
        }
    } catch(e) {}
});

function getStudentInitials(s) {
    const fn = (s.firstName || '').trim();
    const ln = (s.lastName || '').trim();
    const f = fn ? fn[0] : '';
    const l = ln ? ln[0] : '';
    return (f + l).toUpperCase() || 'ST';
}

function getStudentThumbHtml(s) {
    if (s.photo) {
        return `<div class="student-table-thumb"><img src="${s.photo}" alt="${escHtml(s.lastName)}"></div>`;
    }
    const initials = getStudentInitials(s);
    return `<div class="student-table-thumb"><span>${escHtml(initials)}</span></div>`;
}

function getDocBadgesHtml(s) {
    const hasBirthCert = s.birthCertDoc && s.birthCertDoc.data;
    const hasTor = s.torDoc && s.torDoc.data;
    const hasCard = s.studentCardDoc && s.studentCardDoc.data;

    let badges = [];
    if (hasBirthCert) {
        badges.push(`<span class="doc-badge ready" title="PSA Birth Certificate on file (Click to preview)" onclick="previewDocFromTable('${s.id}', 'birthCert')"><i class="fas fa-check"></i> PSA</span>`);
    } else {
        badges.push(`<span class="doc-badge missing" title="No PSA Birth Certificate on file"><i class="fas fa-times"></i> PSA</span>`);
    }

    if (hasTor) {
        badges.push(`<span class="doc-badge ready" title="Form 137 / TOR on file (Click to preview)" onclick="previewDocFromTable('${s.id}', 'tor')"><i class="fas fa-check"></i> TOR</span>`);
    } else {
        badges.push(`<span class="doc-badge missing" title="No Form 137 / TOR on file"><i class="fas fa-times"></i> TOR</span>`);
    }

    if (hasCard) {
        badges.push(`<span class="doc-badge ready" title="Report Card on file (Click to preview)" onclick="previewDocFromTable('${s.id}', 'card')"><i class="fas fa-check"></i> CARD</span>`);
    } else {
        badges.push(`<span class="doc-badge missing" title="No Report Card / Form 138 on file"><i class="fas fa-times"></i> CARD</span>`);
    }

    return `<div class="doc-badge-group">${badges.join('')}</div>`;
}

function previewDocFromTable(studentId, docType) {
    const s = findStudent(studentId);
    if (!s) {
        showToast('Student record not found.', 'error');
        return;
    }

    let doc = null;
    let title = 'Document Preview';
    if (docType === 'birthCert') {
        doc = s.birthCertDoc;
        title = 'PSA / NSO Birth Certificate';
    } else if (docType === 'tor') {
        doc = s.torDoc;
        title = 'Transcript of Records (SF10 / Form 137)';
    } else if (docType === 'card') {
        doc = s.studentCardDoc;
        title = 'Report Card (SF9 / Form 138)';
    }

    if (doc && doc.data) {
        viewDocumentInModal(title, `${s.lastName}, ${s.firstName} (LRN: ${s.lrn})`, doc);
    } else {
        showToast(`${title} is not yet uploaded for this student.`, 'info');
    }
}
window.previewDocFromTable = previewDocFromTable;

function renderRecentTable(cohort) {
    const tbody = document.querySelector('#recentTable tbody');
    if (!tbody) return;

    const recent = [...cohort].slice(0, 8);
    if (recent.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" class="empty-state"><i class="fas fa-inbox"></i><p>No student records for this school year.</p></td></tr>`;
        return;
    }

    tbody.innerHTML = recent.map(s => {
        const thumb = getStudentThumbHtml(s);
        return `
        <tr onclick="viewStudent('${s.id}')" style="cursor:pointer;" title="Click to open ${escHtml(s.lastName)}, ${escHtml(s.firstName)} profile">
            <td style="text-align:center;">${thumb}</td>
            <td style="text-align:center;"><code style="font-size:0.78rem; font-family:monospace; color:#0b2545;">${escHtml(s.lrn)}</code></td>
            <td><strong class="table-student-name" style="font-size:0.82rem; color:#0f172a;">${escHtml(s.lastName)}, ${escHtml(s.firstName)}</strong></td>
            <td style="text-align:center;"><span class="sy-pill" style="font-size:0.72rem;">${escHtml(s.schoolYear || '2026-2027')}</span></td>
            <td style="text-align:center; font-size:0.80rem;">Grade ${escHtml(s.gradeLevel)}</td>
            <td style="text-align:center; font-size:0.80rem;">${escHtml(s.section)}</td>
            <td style="text-align:center; font-size:0.80rem;">${escHtml(s.gender)}</td>
            <td style="text-align:center;"><span class="status-badge ${(s.enrollmentStatus || 'Active').toLowerCase()}" style="font-size:0.72rem;">${escHtml(s.enrollmentStatus || 'Active')}</span></td>
            <td style="text-align:center; font-size:0.80rem;">${formatDate(s.dateCreated || s.dateModified)}</td>
        </tr>
        `;
    }).join('');
}

// ======================== STUDENTS TABLE & ACTIONS ========================

function setFilterGender(gender) {
    const filterGen = document.getElementById('filterGender');
    if (filterGen) {
        if (filterGen.value.toLowerCase() === (gender || '').toLowerCase()) {
            filterGen.value = '';
        } else {
            filterGen.value = gender;
        }
        currentPage = 1;
        refreshStudentsTable();
    }
}
window.setFilterGender = setFilterGender;

function initTableSorting() {
    const table = document.getElementById('studentsTable');
    if (!table) return;

    const headers = table.querySelectorAll('th[data-sort]');
    headers.forEach(th => {
        th.style.cursor = 'pointer';
        th.style.userSelect = 'none';
        th.setAttribute('title', 'Click to sort');

        th.onclick = function() {
            const field = this.dataset.sort;
            if (!field) return;

            if (sortField === field) {
                sortDir = (sortDir === 'asc' ? 'desc' : 'asc');
            } else {
                sortField = field;
                sortDir = 'asc';
            }

            currentPage = 1;
            updateSortHeaderIcons();
            refreshStudentsTable();
        };
    });

    updateSortHeaderIcons();
}
window.initTableSorting = initTableSorting;

function updateSortHeaderIcons() {
    const table = document.getElementById('studentsTable');
    if (!table) return;

    table.querySelectorAll('th[data-sort]').forEach(th => {
        const field = th.dataset.sort;
        const icon = th.querySelector('i');
        th.classList.remove('sorted-asc', 'sorted-desc');

        if (field === sortField) {
            th.classList.add(sortDir === 'asc' ? 'sorted-asc' : 'sorted-desc');
            if (icon) {
                icon.className = sortDir === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down';
            }
        } else {
            if (icon) {
                icon.className = 'fas fa-sort';
            }
        }
    });
}
window.updateSortHeaderIcons = updateSortHeaderIcons;

function refreshStudentsTable() {
    const searchInput = document.getElementById('searchInput');
    const search = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const syFilter = document.getElementById('filterSchoolYear') ? document.getElementById('filterSchoolYear').value : '';
    const grade = document.getElementById('filterGrade') ? document.getElementById('filterGrade').value : '';
    const section = document.getElementById('filterSection') ? document.getElementById('filterSection').value : '';
    const gender = document.getElementById('filterGender') ? document.getElementById('filterGender').value : '';
    const status = document.getElementById('filterStatus') ? document.getElementById('filterStatus').value : '';
    const escFilter = document.getElementById('filterEsc') ? document.getElementById('filterEsc').value : '';
    const province = document.getElementById('filterProvince') ? document.getElementById('filterProvince').value : '';
    const municipality = document.getElementById('filterMunicipality') ? document.getElementById('filterMunicipality').value : '';

    let filtered = students.filter(s => {
        if (syFilter && s.schoolYear !== syFilter) return false;
        if (grade && String(s.gradeLevel) !== String(grade)) return false;
        if (section && s.section !== section) return false;
        if (gender && (s.gender || '').toLowerCase() !== gender.toLowerCase()) return false;
        if (status && (s.enrollmentStatus || 'Active').toLowerCase() !== status.toLowerCase()) return false;
        if (escFilter && (s.escGrantee || 'NO').toUpperCase() !== escFilter.toUpperCase()) return false;
        if (province && (s.addressProvince || '') !== province) return false;
        if (municipality && (s.addressMunicipality || '') !== municipality) return false;
        if (search) {
            const fullName = `${s.lastName} ${s.firstName} ${s.middleName || ''}`.toLowerCase();
            if (!fullName.includes(search) && !String(s.lrn).includes(search) && !(s.section || '').toLowerCase().includes(search)) {
                return false;
            }
        }
        return true;
    });

    filtered.sort((a, b) => {
        let aVal = '';
        let bVal = '';

        if (sortField === 'lastName') {
            aVal = `${a.lastName || ''} ${a.firstName || ''}`.toLowerCase();
            bVal = `${b.lastName || ''} ${b.firstName || ''}`.toLowerCase();
        } else if (sortField === 'gradeLevel') {
            aVal = parseInt(a.gradeLevel) || 0;
            bVal = parseInt(b.gradeLevel) || 0;
        } else if (sortField === 'status') {
            aVal = (a.enrollmentStatus || a.status || '').toString().toLowerCase();
            bVal = (b.enrollmentStatus || b.status || '').toString().toLowerCase();
        } else if (sortField === 'escGrantee') {
            aVal = (a.escGrantee || 'NO').toString().toLowerCase();
            bVal = (b.escGrantee || 'NO').toString().toLowerCase();
        } else if (sortField === 'gender') {
            aVal = (a.gender || '').toString().toLowerCase();
            bVal = (b.gender || '').toString().toLowerCase();
        } else {
            aVal = (a[sortField] || '').toString().toLowerCase();
            bVal = (b[sortField] || '').toString().toLowerCase();
        }

        if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;

        // Secondary tie-breaker by student name
        const aName = `${a.lastName || ''} ${a.firstName || ''}`.toLowerCase();
        const bName = `${b.lastName || ''} ${b.firstName || ''}`.toLowerCase();
        return aName.localeCompare(bName);
    });

    updateSortHeaderIcons();
    updateSectionFilter();

    const totalPages = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE));
    if (currentPage > totalPages) currentPage = totalPages;
    const start = (currentPage - 1) * ROWS_PER_PAGE;
    const pageData = filtered.slice(start, start + ROWS_PER_PAGE);

    const countEl = document.getElementById('tableCount');
    if (countEl) countEl.textContent = `${filtered.length} student${filtered.length !== 1 ? 's' : ''} found`;

    const tbody = document.getElementById('studentsTableBody');
    if (!tbody) return;

    if (pageData.length === 0) {
        tbody.innerHTML = `<tr><td colspan="11" class="empty-state"><i class="fas fa-search"></i><p>No students match your criteria.</p></td></tr>`;
    } else {
        tbody.innerHTML = pageData.map(s => {
            const thumb = getStudentThumbHtml(s);
            const docBadge = getDocBadgesHtml(s);
            const isEsc = (s.escGrantee === 'YES');
            const escBadge = isEsc
                ? '<span class="badge-esc yes"><i class="fas fa-check"></i> YES</span>'
                : '<span class="badge-esc no">NO</span>';
            const genderClass = (s.gender || 'male').toLowerCase();
            const genderIcon = genderClass === 'female' ? 'venus' : 'mars';

            return `
                <tr data-student-id="${s.id}">
                    <td>${thumb}</td>
                    <td>${escHtml(s.lrn)}</td>
                    <td><strong class="table-student-name">${escHtml(s.lastName)}, ${escHtml(s.firstName)}</strong>${s.middleName ? ' ' + escHtml(s.middleName) : ''}${s.suffix ? ' ' + escHtml(s.suffix) : ''}</td>
                    <td><span class="sy-pill">${escHtml(s.schoolYear || '2026-2027')}</span></td>
                    <td>Grade ${escHtml(s.gradeLevel)}</td>
                    <td>${escHtml(s.section)}</td>
                    <td>
                        <span class="gender-pill ${genderClass}" onclick="setFilterGender('${escHtml(s.gender)}')" title="Click to filter by ${escHtml(s.gender)}" style="cursor: pointer;">
                            <i class="fas fa-${genderIcon}"></i> ${escHtml(s.gender)}
                        </span>
                    </td>
                    <td>${escBadge}</td>
                    <td><span class="status-badge ${(s.enrollmentStatus || 'Active').toLowerCase()}">${escHtml(s.enrollmentStatus || 'Active')}</span></td>
                    <td>${docBadge}</td>
                    <td class="actions-cell">
                        <button type="button" class="btn-icon view" title="View Profile" data-action="view" data-id="${s.id}" onclick="viewStudent('${s.id}')"><i class="fas fa-eye"></i></button>
                        <button type="button" class="btn-icon soa" title="Statement of Account" data-action="soa" data-id="${s.id}" onclick="openSOAModal('${s.id}')"><i class="fas fa-file-invoice-dollar"></i></button>
                        <button type="button" class="btn-icon edit" title="Edit Record" data-action="edit" data-id="${s.id}" onclick="editStudent('${s.id}')"><i class="fas fa-edit"></i></button>
                        <button type="button" class="btn-icon delete" title="Delete Record" data-action="delete" data-id="${s.id}" onclick="confirmDelete('${s.id}')"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    renderPagination(totalPages);
}

function renderPagination(totalPages) {
    const container = document.getElementById('pagination');
    if (!container) return;
    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }

    let html = `<button type="button" ${currentPage === 1 ? 'disabled' : ''} onclick="goToPage(${currentPage - 1})"><i class="fas fa-chevron-left"></i></button>`;
    for (let i = 1; i <= totalPages; i++) {
        if (totalPages > 7) {
            if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
                html += `<button type="button" class="${i === currentPage ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
            } else if (i === currentPage - 2 || i === currentPage + 2) {
                html += `<button type="button" disabled>...</button>`;
            }
        } else {
            html += `<button type="button" class="${i === currentPage ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
        }
    }
    html += `<button type="button" ${currentPage === totalPages ? 'disabled' : ''} onclick="goToPage(${currentPage + 1})"><i class="fas fa-chevron-right"></i></button>`;
    container.innerHTML = html;
}

function goToPage(page) {
    currentPage = page;
    refreshStudentsTable();
}

function updateSectionFilter() {
    const select = document.getElementById('filterSection');
    if (!select) return;
    const currentVal = select.value;
    const sections = [...new Set(students.map(s => s.section).filter(Boolean))].sort();
    select.innerHTML = '<option value="">All Sections</option>' + sections.map(sec => `<option value="${sec}" ${sec === currentVal ? 'selected' : ''}>${sec}</option>`).join('');
}

// ======================== GRADE TABLES ========================

function refreshGradeTable(grade) {
    const tbody = document.getElementById(`grade${grade}TableBody`);
    if (!tbody) return;

    const searchInput = document.querySelector(`.grade-search[data-grade="${grade}"]`);
    const sectionFilter = document.querySelector(`.grade-section-filter[data-grade="${grade}"]`);
    const syFilter = document.querySelector(`.grade-sy-filter[data-grade="${grade}"]`);

    const search = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const section = sectionFilter ? sectionFilter.value : '';
    const sy = syFilter ? syFilter.value : currentSchoolYear;

    // Compute Grade Level Dashboard KPI Stats
    const gradeCohort = students.filter(s => String(s.gradeLevel) === String(grade) && (!sy || s.schoolYear === sy));
    const totalCount = gradeCohort.length;
    const maleCount = gradeCohort.filter(s => (s.gender || '').toUpperCase() === 'MALE').length;
    const femaleCount = gradeCohort.filter(s => (s.gender || '').toUpperCase() === 'FEMALE').length;
    const escCount = gradeCohort.filter(s => (s.escGrantee || '').toUpperCase() === 'YES').length;
    const sections = [...new Set(gradeCohort.map(s => s.section).filter(Boolean))];

    const elTotal = document.getElementById(`statGrade${grade}Total`);
    const elGender = document.getElementById(`statGrade${grade}Gender`);
    const elEsc = document.getElementById(`statGrade${grade}Esc`);
    const elSections = document.getElementById(`statGrade${grade}Sections`);
    const elTotalSub = document.getElementById(`statGrade${grade}TotalSub`);
    const elSectionsSub = document.getElementById(`statGrade${grade}SectionsSub`);
    const elSyLabel = document.getElementById(`grade${grade}SyLabel`);

    if (elTotal) elTotal.textContent = totalCount;
    if (elGender) elGender.textContent = `${maleCount}M / ${femaleCount}F`;
    if (elEsc) elEsc.textContent = escCount;
    if (elSections) elSections.textContent = sections.length;
    if (elTotalSub) elTotalSub.textContent = sy ? `S.Y. ${sy} Cohort` : 'All School Years';
    if (elSectionsSub) elSectionsSub.textContent = sections.length > 0 ? sections.join(', ') : 'No Section Assigned';
    if (elSyLabel) elSyLabel.textContent = sy ? `— S.Y. ${sy}` : '— All School Years';

    let gradeStudents = students.filter(s => String(s.gradeLevel) === String(grade));
    if (sy) gradeStudents = gradeStudents.filter(s => s.schoolYear === sy);
    if (section) gradeStudents = gradeStudents.filter(s => s.section === section);
    if (search) {
        gradeStudents = gradeStudents.filter(s => {
            const fullName = `${s.lastName} ${s.firstName} ${s.middleName || ''}`.toLowerCase();
            return fullName.includes(search) || String(s.lrn).includes(search) || (s.section || '').toLowerCase().includes(search);
        });
    }

    gradeStudents.sort((a, b) => (a.lastName || '').localeCompare(b.lastName || ''));

    if (gradeStudents.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" class="empty-state"><i class="fas fa-inbox"></i><p>No Grade ${grade} students found for this filter.</p></td></tr>`;
    } else {
        tbody.innerHTML = gradeStudents.map(s => {
            const thumb = getStudentThumbHtml(s);
            const isEsc = (s.escGrantee === 'YES');
            const escBadge = isEsc
                ? '<span class="badge-esc yes"><i class="fas fa-check"></i> YES</span>'
                : '<span class="badge-esc no">NO</span>';

            return `
            <tr data-student-id="${s.id}">
                <td>${thumb}</td>
                <td><code>${escHtml(s.lrn)}</code></td>
                <td><strong class="table-student-name">${escHtml(s.lastName)}, ${escHtml(s.firstName)}</strong>${s.middleName ? ' ' + escHtml(s.middleName) : ''}${s.suffix ? ' ' + escHtml(s.suffix) : ''}</td>
                <td><span class="sy-pill">${escHtml(s.schoolYear || '2026-2027')}</span></td>
                <td>${escHtml(s.section)}</td>
                <td>${escHtml(s.gender)}</td>
                <td>${escBadge}</td>
                <td><span class="status-badge ${(s.enrollmentStatus || 'Active').toLowerCase()}">${escHtml(s.enrollmentStatus || 'Active')}</span></td>
                <td class="actions-cell">
                    <button type="button" class="btn-icon view" title="View Profile" data-action="view" data-id="${s.id}" onclick="viewStudent('${s.id}')"><i class="fas fa-eye"></i></button>
                    <button type="button" class="btn-icon soa" title="Statement of Account" data-action="soa" data-id="${s.id}" onclick="openSOAModal('${s.id}')"><i class="fas fa-file-invoice-dollar"></i></button>
                    <button type="button" class="btn-icon edit" title="Edit Record" data-action="edit" data-id="${s.id}" onclick="editStudent('${s.id}')"><i class="fas fa-edit"></i></button>
                    <button type="button" class="btn-icon delete" title="Delete Record" data-action="delete" data-id="${s.id}" onclick="confirmDelete('${s.id}')"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
            `;
        }).join('');
    }
}

// ======================== SOA PAGE TABLE ========================

function filterSOAList() {
    refreshSOAPage();
}
window.filterSOAList = filterSOAList;

function refreshSOAPage() {
    const tbody = document.getElementById('soaHubTableBody') || document.getElementById('soaSummaryTableBody');
    if (!tbody) return;

    const sySelect = document.getElementById('soaFilterSchoolYear');
    const selectedSy = (sySelect && sySelect.value) ? sySelect.value : (currentSchoolYear || '2026-2027');
    const gradeSelect = document.getElementById('soaFilterGrade');
    const selectedGrade = (gradeSelect && gradeSelect.value) ? gradeSelect.value : '';
    const statusSelect = document.getElementById('soaFilterStatus');
    const selectedStatus = (statusSelect && statusSelect.value) ? statusSelect.value : '';
    const searchInput = document.getElementById('soaSearchInput');
    const searchTerm = searchInput ? searchInput.value.trim().toLowerCase() : '';

    let cohort = students;
    if (selectedSy) cohort = cohort.filter(s => s.schoolYear === selectedSy);
    if (selectedGrade) cohort = cohort.filter(s => String(s.gradeLevel) === selectedGrade);
    if (searchTerm) {
        cohort = cohort.filter(s => {
            const name = `${s.lastName || ''}, ${s.firstName || ''} ${s.middleName || ''}`.toLowerCase();
            const lrn = String(s.lrn || '').toLowerCase();
            return name.includes(searchTerm) || lrn.includes(searchTerm);
        });
    }

    let totalAssessed = 0;
    let totalPaid = 0;
    let totalBal = 0;
    let totalDiscounts = 0;
    let discountedCount = 0;
    let totalPaymentsCount = 0;
    let withBalanceCount = 0;

    const rows = [];
    cohort.forEach(s => {
        const tuition = Number(s.tuitionFee) || DEFAULT_BASE_TUITION;
        const isEsc = (s.escGrantee === 'YES');
        const isDisc = (isEsc || s.isDiscounted === 'YES');
        const discount = (s.isDiscounted === 'YES' && Number(s.discountAmount) > 0)
            ? Number(s.discountAmount)
            : (isEsc ? 9000 : 0);
        const net = Math.max(0, tuition - discount);
        const payments = Array.isArray(s.payments) ? s.payments : [];
        const paid = payments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
        const bal = Math.max(0, net - paid);

        totalAssessed += net;
        totalPaid += paid;
        totalBal += bal;
        if (discount > 0) {
            totalDiscounts += discount;
            discountedCount++;
        }
        totalPaymentsCount += payments.length;
        if (bal > 0) {
            withBalanceCount++;
        }

        // Status Filter
        if (selectedStatus === 'has_balance' && bal <= 0) return;
        if (selectedStatus === 'fully_paid' && bal > 0) return;
        if (selectedStatus === 'discounted' && !isDisc) return;

        const isFullyPaid = bal === 0;
        const discBadge = isDisc
            ? `<span class="badge-esc yes" style="white-space:nowrap;"><i class="fas fa-tags"></i> -\u20B1${discount.toLocaleString('en-PH', { minimumFractionDigits: 0 })}</span>`
            : `<span class="badge-esc no" style="white-space:nowrap;">None</span>`;

        const statusBadge = isFullyPaid
            ? '<span class="status-badge active"><i class="fas fa-check-circle"></i> Paid</span>'
            : (paid > 0 
                ? '<span class="status-badge active"><i class="fas fa-clock"></i> Partial</span>' 
                : '<span class="status-badge inactive"><i class="fas fa-exclamation-circle"></i> Unpaid</span>');

        rows.push(`
            <tr data-student-id="${s.id}">
                <td>
                    <strong class="soa-student-name">${escHtml(s.lastName)}, ${escHtml(s.firstName)}</strong>
                    <div class="soa-lrn-sub">LRN: ${escHtml(s.lrn)}</div>
                </td>
                <td>
                    <span class="badge-grade">Grade ${escHtml(s.gradeLevel)} - ${escHtml(s.section)}</span>
                    <div class="soa-sy-sub">S.Y. ${escHtml(s.schoolYear || '2026-2027')}</div>
                </td>
                <td>\u20B1${tuition.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
                <td>${discBadge}</td>
                <td><strong>\u20B1${net.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</strong></td>
                <td class="text-success font-weight-bold">\u20B1${paid.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
                <td class="text-danger font-weight-bold">\u20B1${bal.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
                <td>${statusBadge}</td>
                <td class="text-center actions-cell" style="justify-content:center;">
                    <button type="button" class="btn-sm btn-primary view-soa" data-action="soa" data-id="${s.id}" onclick="openSOAModal('${s.id}')" title="View Detailed Statement">
                        <i class="fas fa-receipt"></i> View SOA
                    </button>
                </td>
            </tr>
        `);
    });

    if (rows.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" class="empty-state" style="text-align:center; padding:24px;"><i class="fas fa-search" style="font-size:1.5rem; color:#94a3b8; margin-bottom:8px;"></i><p style="color:#64748b; font-size:0.85rem; margin:0;">No statement records match your criteria.</p></td></tr>`;
    } else {
        tbody.innerHTML = rows.join('');
    }

    const elTotalAssessed = document.getElementById('soaSummaryTotalAssessed') || document.getElementById('soaHubTotalTuition') || document.getElementById('soaHubTotalAssessed');
    if (elTotalAssessed) elTotalAssessed.textContent = '₱' + totalAssessed.toLocaleString('en-PH', { minimumFractionDigits: 2 });
    const elStudentCount = document.getElementById('soaHubStudentCount');
    if (elStudentCount) elStudentCount.textContent = `${cohort.length} enrolled student${cohort.length === 1 ? '' : 's'}`;

    const elTotalDiscounts = document.getElementById('soaHubTotalDiscounts');
    if (elTotalDiscounts) elTotalDiscounts.textContent = '₱' + totalDiscounts.toLocaleString('en-PH', { minimumFractionDigits: 2 });
    const elDiscountedCount = document.getElementById('soaHubDiscountedCount');
    if (elDiscountedCount) elDiscountedCount.textContent = `${discountedCount} discounted learner${discountedCount === 1 ? '' : 's'}`;

    const elTotalPaid = document.getElementById('soaSummaryTotalPaid') || document.getElementById('soaHubTotalPaid');
    if (elTotalPaid) elTotalPaid.textContent = '₱' + totalPaid.toLocaleString('en-PH', { minimumFractionDigits: 2 });
    const elPaymentsCount = document.getElementById('soaHubPaymentsCount');
    if (elPaymentsCount) elPaymentsCount.textContent = `${totalPaymentsCount} installment${totalPaymentsCount === 1 ? '' : 's'} collected`;

    const elTotalBal = document.getElementById('soaSummaryTotalBalance') || document.getElementById('soaHubTotalBalance');
    if (elTotalBal) elTotalBal.textContent = '₱' + totalBal.toLocaleString('en-PH', { minimumFractionDigits: 2 });
    const elWithBalanceCount = document.getElementById('soaHubWithBalanceCount');
    if (elWithBalanceCount) elWithBalanceCount.textContent = `${withBalanceCount} learner${withBalanceCount === 1 ? '' : 's'} with balance`;
}

function refreshArchiveTable() {
    const tbody = document.getElementById('archiveTableBody');
    if (!tbody) return;

    const archived = students.filter(s => ['Inactive', 'Transferred', 'Dropped', 'Graduated'].includes(s.enrollmentStatus));
    if (archived.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" class="empty-state"><i class="fas fa-archive"></i><p>No archived students.</p></td></tr>`;
        return;
    }

    tbody.innerHTML = archived.map(s => {
        const thumb = getStudentThumbHtml(s);
        const isEsc = (s.escGrantee === 'YES');
        const escBadge = isEsc ? '<span class="badge-esc yes"><i class="fas fa-check"></i> YES</span>' : '<span class="badge-esc no">NO</span>';
        return `
        <tr data-student-id="${s.id}">
            <td>${thumb}</td>
            <td><code>${escHtml(s.lrn)}</code></td>
            <td><strong class="table-student-name">${escHtml(s.lastName)}, ${escHtml(s.firstName)}</strong></td>
            <td><span class="sy-pill">${escHtml(s.schoolYear || '2026-2027')}</span></td>
            <td>Grade ${escHtml(s.gradeLevel)}</td>
            <td>${escHtml(s.section)}</td>
            <td>${escBadge}</td>
            <td><span class="status-badge ${(s.enrollmentStatus || 'Inactive').toLowerCase()}">${escHtml(s.enrollmentStatus)}</span></td>
            <td class="actions-cell">
                <button type="button" class="btn-icon view" title="View Profile" data-action="view" data-id="${s.id}" onclick="viewStudent('${s.id}')"><i class="fas fa-eye"></i></button>
                <button type="button" class="btn-icon soa" title="Statement of Account" data-action="soa" data-id="${s.id}" onclick="openSOAModal('${s.id}')"><i class="fas fa-file-invoice-dollar"></i></button>
                <button type="button" class="btn-icon edit" title="Edit Record" data-action="edit" data-id="${s.id}" onclick="editStudent('${s.id}')"><i class="fas fa-edit"></i></button>
                <button type="button" class="btn-icon delete" title="Delete Record" data-action="delete" data-id="${s.id}" onclick="confirmDelete('${s.id}')"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
        `;
    }).join('');
}
window.refreshArchiveTable = refreshArchiveTable;

// ======================== JHS FINISHER & ALUMNI DIRECTORY ========================

function getAlumniStudents() {
    return (students || []).filter(s => {
        if (s.isJhsFinisher === true) return true;
        const g = String(s.gradeLevel || '').trim();
        const st = (s.enrollmentStatus || '').toLowerCase();
        return g === '10' && ['graduated', 'completed', 'alumni', 'promoted'].includes(st);
    });
}
window.getAlumniStudents = getAlumniStudents;

function refreshAlumniPage() {
    const tbody = document.getElementById('alumniTableBody');
    if (!tbody) return;

    const allAlumni = getAlumniStudents();

    // Populate Completion School Year filter dynamically
    const syFilter = document.getElementById('alumniFilterSy');
    if (syFilter) {
        const currentSelectedSy = syFilter.value;
        const distinctSys = Array.from(new Set(allAlumni.map(s => s.completionSchoolYear || s.schoolYear).filter(Boolean))).sort().reverse();
        
        // Also combine with registered school years
        const allSys = getAllSchoolYears();
        allSys.forEach(sy => {
            if (!distinctSys.includes(sy) && (students || []).some(s => s.schoolYear === sy && String(s.gradeLevel) === '10')) {
                distinctSys.push(sy);
            }
        });

        let syHtml = '<option value="">All Completion School Years</option>';
        distinctSys.forEach(sy => {
            syHtml += `<option value="${escHtml(sy)}" ${sy === currentSelectedSy ? 'selected' : ''}>S.Y. ${escHtml(sy)}</option>`;
        });
        syFilter.innerHTML = syHtml;
    }

    // Populate Section filter dynamically
    const secFilter = document.getElementById('alumniFilterSection');
    if (secFilter) {
        const currentSelectedSec = secFilter.value;
        const distinctSecs = Array.from(new Set(allAlumni.map(s => s.section).filter(Boolean))).sort();
        if (!distinctSecs.includes('Amber')) distinctSecs.unshift('Amber');

        let secHtml = '<option value="">All Sections</option>';
        distinctSecs.forEach(sec => {
            secHtml += `<option value="${escHtml(sec)}" ${sec === currentSelectedSec ? 'selected' : ''}>${escHtml(sec)}</option>`;
        });
        secFilter.innerHTML = secHtml;
    }

    // Read active filter values
    const searchVal = (document.getElementById('alumniSearchInput')?.value || '').trim().toLowerCase();
    const syVal = document.getElementById('alumniFilterSy')?.value || '';
    const secVal = document.getElementById('alumniFilterSection')?.value || '';
    const genVal = document.getElementById('alumniFilterGender')?.value || '';
    const escVal = document.getElementById('alumniFilterEsc')?.value || '';

    // Filter alumni records
    const filtered = allAlumni.filter(s => {
        if (syVal && (s.completionSchoolYear || s.schoolYear) !== syVal) return false;
        if (secVal && s.section !== secVal) return false;
        if (genVal && (s.gender || '').toLowerCase() !== genVal.toLowerCase()) return false;
        if (escVal && (s.escGrantee || 'NO').toUpperCase() !== escVal.toUpperCase()) return false;
        if (searchVal) {
            const fullName = `${s.lastName || ''} ${s.firstName || ''} ${s.middleName || ''}`.toLowerCase();
            const lrn = String(s.lrn || '').toLowerCase();
            const sec = (s.section || '').toLowerCase();
            if (!fullName.includes(searchVal) && !lrn.includes(searchVal) && !sec.includes(searchVal)) {
                return false;
            }
        }
        return true;
    });

    // Update statistics
    const totalCount = allAlumni.length;
    const escCount = allAlumni.filter(s => (s.escGrantee || 'NO').toUpperCase() === 'YES').length;
    const maleCount = allAlumni.filter(s => (s.gender || '').toLowerCase() === 'male').length;
    const femaleCount = allAlumni.filter(s => (s.gender || '').toLowerCase() === 'female').length;
    const batchesCount = new Set(allAlumni.map(s => s.completionSchoolYear || s.schoolYear).filter(Boolean)).size;

    const elTotal = document.getElementById('statAlumniTotal');
    const elEsc = document.getElementById('statAlumniEsc');
    const elRatio = document.getElementById('statAlumniRatio');
    const elBatches = document.getElementById('statAlumniBatches');
    const elShowing = document.getElementById('alumniCountShowing');
    const elCountTotal = document.getElementById('alumniCountTotal');

    if (elTotal) elTotal.textContent = totalCount;
    if (elEsc) elEsc.textContent = escCount;
    if (elRatio) elRatio.textContent = `${maleCount}M / ${femaleCount}F`;
    if (elBatches) elBatches.textContent = batchesCount;
    if (elShowing) elShowing.textContent = filtered.length;
    if (elCountTotal) elCountTotal.textContent = totalCount;

    // Render table rows
    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" class="empty-state" style="padding: 40px 20px; text-align: center; color: var(--text-muted);"><i class="fas fa-user-graduate" style="font-size: 2.2rem; color: #cbd5e1; margin-bottom: 10px; display: block;"></i><p style="font-size: 0.95rem; font-weight: 600;">No JHS Finishers / Alumni records match the selected filters.</p><p style="font-size: 0.82rem;">Grade 10 students will appear here automatically upon Confirm Batch Promotion or when encoded in the Enroll Student tab.</p></td></tr>`;
        return;
    }

    tbody.innerHTML = filtered.map(s => {
        const thumb = getStudentThumbHtml(s);
        const isEsc = (s.escGrantee === 'YES');
        const escBadge = isEsc ? '<span class="badge-esc yes"><i class="fas fa-check"></i> YES</span>' : '<span class="badge-esc no">NO</span>';
        const compSy = s.completionSchoolYear || s.schoolYear || '2026-2027';

        return `
        <tr data-student-id="${s.id}">
            <td style="text-align: center;">${thumb}</td>
            <td><code>${escHtml(s.lrn)}</code></td>
            <td><strong class="table-student-name">${escHtml(s.lastName)}, ${escHtml(s.firstName)} ${escHtml(s.middleName ? s.middleName.charAt(0) + '.' : '')} ${escHtml(s.suffix || '')}</strong></td>
            <td><span class="sy-pill" style="background:#ecfdf5; color:#065f46; border:1px solid #a7f3d0;"><i class="fas fa-graduation-cap"></i> S.Y. ${escHtml(compSy)}</span></td>
            <td>Grade 10 - ${escHtml(s.section || 'Amber')}</td>
            <td>${escHtml(s.gender || 'N/A')}</td>
            <td>${escBadge}</td>
            <td><span class="status-badge graduated" style="background:#ecfdf5; color:#065f46; border:1px solid #a7f3d0;"><i class="fas fa-user-graduate"></i> Completer</span></td>
            <td class="actions-cell" style="text-align: center;">
                <button type="button" class="btn-icon view" title="View Profile" data-action="view" data-id="${s.id}" onclick="viewStudent('${s.id}')"><i class="fas fa-eye"></i></button>
                <button type="button" class="btn-icon soa" title="Statement of Account" data-action="soa" data-id="${s.id}" onclick="openSOAModal('${s.id}')"><i class="fas fa-file-invoice-dollar"></i></button>
                <button type="button" class="btn-icon edit" title="Edit Record" data-action="edit" data-id="${s.id}" onclick="editStudent('${s.id}')"><i class="fas fa-edit"></i></button>
                <button type="button" class="btn-icon delete" title="Delete Record" data-action="delete" data-id="${s.id}" onclick="confirmDelete('${s.id}')"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
        `;
    }).join('');
}
window.refreshAlumniPage = refreshAlumniPage;

function clearAlumniFilters() {
    const sInput = document.getElementById('alumniSearchInput');
    const sSy = document.getElementById('alumniFilterSy');
    const sSec = document.getElementById('alumniFilterSection');
    const sGen = document.getElementById('alumniFilterGender');
    const sEsc = document.getElementById('alumniFilterEsc');

    if (sInput) sInput.value = '';
    if (sSy) sSy.value = '';
    if (sSec) sSec.value = '';
    if (sGen) sGen.value = '';
    if (sEsc) sEsc.value = '';

    refreshAlumniPage();
}
window.clearAlumniFilters = clearAlumniFilters;

function exportAlumniData(format) {
    const alumni = getAlumniStudents();
    if (alumni.length === 0) {
        showToast('No alumni records available to export.', 'info');
        return;
    }

    const headers = ['LRN', 'Last Name', 'First Name', 'Middle Name', 'Suffix', 'Completion School Year', 'Grade Level', 'Section', 'Gender', 'ESC Grantee', 'Status', 'Date Completed'];
    const rows = alumni.map(s => [
        `"${s.lrn || ''}"`,
        `"${(s.lastName || '').replace(/"/g, '""')}"`,
        `"${(s.firstName || '').replace(/"/g, '""')}"`,
        `"${(s.middleName || '').replace(/"/g, '""')}"`,
        `"${(s.suffix || '').replace(/"/g, '""')}"`,
        `"${s.completionSchoolYear || s.schoolYear || ''}"`,
        `"Grade 10"`,
        `"${(s.section || '').replace(/"/g, '""')}"`,
        `"${s.gender || ''}"`,
        `"${s.escGrantee || 'NO'}"`,
        `"Completed / JHS Finisher"`,
        `"${s.completionDate || s.dateModified || s.dateCreated || ''}"`
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `MDSJFI_JHS_Finishers_Alumni_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('JHS Finishers & Alumni roster exported successfully.', 'success');
}
window.exportAlumniData = exportAlumniData;

// ======================== VIEW PROFILE MODAL ========================

function viewStudent(id) {
    const s = findStudent(id);
    if (!s) {
        console.warn('Student record not found:', id);
        return;
    }

    currentViewId = s.id;
    window.currentViewId = s.id;

    const setT = (elemId, val) => {
        const el = document.getElementById(elemId);
        if (el) el.textContent = (val !== undefined && val !== null && val !== '') ? val : '—';
    };

    setT('viewFullName', `${s.lastName}, ${s.firstName} ${s.middleName || ''}${s.suffix ? ' ' + s.suffix : ''}`);
    setT('viewGradeSection', `Grade ${s.gradeLevel} — ${s.section}`);
    setT('viewLRN', s.lrn);
    setT('viewSchoolYear', s.schoolYear || '2026-2027');
    setT('viewSchoolYearBadge', s.schoolYear || '2026-2027');
    setT('printPage2StudentTag', `${s.lastName}, ${s.firstName} | LRN: ${s.lrn} | Grade ${s.gradeLevel} - ${s.section}`);

    const isEsc = (s.escGrantee || 'NO').toUpperCase() === 'YES';
    setT('viewEscGrantee', isEsc ? 'YES' : 'NO');
    const escBadge = document.getElementById('viewEscBadge');
    if (escBadge) {
        escBadge.className = isEsc ? 'badge-esc-yes' : 'badge-esc-no';
    }
    setT('viewEscBadgeText', isEsc ? 'ESC Grantee' : 'Non-ESC');
    const escRow = document.getElementById('viewEscNumRow');
    if (escRow) escRow.style.display = isEsc ? 'flex' : 'none';
    setT('viewEscNumber', s.escNumber || '—');

    setT('viewDOB', s.dateOfBirth ? formatDate(s.dateOfBirth) : '—');
    setT('viewAge', s.age || '—');
    setT('viewGender', s.gender || '—');
    setT('viewBirthPlace', s.birthPlace || 'San Jose, Batangas');
    setT('viewReligion', s.religion || 'Roman Catholic');
    setT('viewMotherTongue', s.motherTongue || 'Tagalog');

    setT('viewRegion', s.addressRegion || 'Region IV-A (CALABARZON)');
    setT('viewProvince', s.addressProvince || 'Batangas');
    setT('viewMunicipality', s.addressMunicipality || 'San Jose');
    setT('viewBarangay', s.addressBarangay || 'Poblacion');
    setT('viewStreet', s.addressStreet || '—');
    setT('viewAddress', s.address || `${s.addressBarangay || 'Poblacion'}, ${s.addressMunicipality || 'San Jose'}, ${s.addressProvince || 'Batangas'}`);

    setT('viewContact', s.contactNumber || '—');
    setT('viewEmail', s.email || '—');

    setT('viewFather', s.fatherName || '—');
    setT('viewFatherOcc', s.fatherOccupation || '—');
    setT('viewFatherContact', s.fatherContact || '—');
    setT('viewMother', s.motherName || '—');
    setT('viewMotherOcc', s.motherOccupation || '—');
    setT('viewMotherContact', s.motherContact || '—');
    setT('viewGuardian', s.guardianName || '—');
    setT('viewGuardianRel', s.guardianRelationship || '—');
    setT('viewGuardianContact', s.guardianContact || '—');

    setT('viewEmergencyName', s.emergencyName || '—');
    setT('viewEmergencyRel', s.emergencyRelation || 'Parent / Guardian');
    setT('viewEmergencyContact', s.emergencyContact || '—');

    setT('viewPrevSchool', s.previousSchool || 'San Jose Elementary School');
    setT('viewPrevSchoolAddr', s.previousSchoolAddress || 'San Jose, Batangas');
    setT('viewRemarks', s.remarks || 'None');

    const statusBadge = document.getElementById('viewStatus');
    if (statusBadge) {
        statusBadge.textContent = s.enrollmentStatus || 'Active';
        statusBadge.className = 'status-badge ' + (s.enrollmentStatus || 'Active').toLowerCase();
    }

    const avatar = document.getElementById('viewAvatar');
    const photoDelBtn = document.getElementById('btnDeletePhotoFromProfile');
    if (avatar) {
        if (s.photo) {
            avatar.innerHTML = `<img src="${s.photo}" alt="Student Photo" class="student-avatar-img">`;
            if (photoDelBtn) photoDelBtn.style.display = 'inline-block';
        } else {
            avatar.innerHTML = `<i class="fas fa-user-graduate"></i>`;
            if (photoDelBtn) photoDelBtn.style.display = 'none';
        }
    }

    // Documents
    renderDocPreview('viewBirthCert', s.birthCertDoc);
    renderDocPreview('viewTor', s.torDoc);
    renderDocPreview('viewCard', s.studentCardDoc);

    // Signature
    const sigImg = document.getElementById('viewSigImg');
    const noSigBox = document.getElementById('viewNoSigBox');
    const sigStudentName = document.getElementById('viewSigStudentName');
    if (sigStudentName) sigStudentName.textContent = `${s.firstName} ${s.lastName}`;

    if (s.signature) {
        if (sigImg) {
            sigImg.src = s.signature;
            sigImg.style.display = 'block';
        }
        if (noSigBox) noSigBox.style.display = 'none';
    } else {
        if (sigImg) sigImg.style.display = 'none';
        if (noSigBox) noSigBox.style.display = 'flex';
    }

    // Render Learner Profile Mobile QR Code
    renderStudentQr(s);

    // Always pre-render the dedicated 2-page print layout for this student
    renderPrintableStudentProfile(s);

    openModal('viewModal');
}

// ======================== LEARNER MOBILE QR PASS ========================

function getStudentQrPayload(s) {
    if (!s) return '';
    const origin = window.location.origin;
    const pathname = window.location.pathname;
    const isHttp = window.location.protocol.startsWith('http');
    
    // If hosted over http/https, link directly to mobile view URL
    if (isHttp && origin && !origin.includes('null')) {
        return `${origin}${pathname}?lrn=${encodeURIComponent(s.lrn || s.id)}`;
    }

    // Standard offline / local digital ID card payload (compact & scannable)
    const escStatus = (s.escGrantee || 'NO').toUpperCase() === 'YES' ? 'YES' : 'NO';
    const contact = s.guardianContact || s.contactNumber || s.emergencyContact || 'N/A';
    
    return [
        'MDSJFI OFFICIAL LEARNER PASS',
        `LRN: ${s.lrn || 'N/A'}`,
        `Learner: ${s.lastName}, ${s.firstName} ${s.middleName || ''}`.trim(),
        `Grade ${s.gradeLevel} - ${s.section}`,
        `S.Y. ${s.schoolYear || '2026-2027'} | ESC: ${escStatus}`,
        `Status: ${s.enrollmentStatus || 'Active'}`,
        `Contact: ${contact}`,
        `Montessori De San Jose Foundation Inc.`
    ].join('\n');
}
window.getStudentQrPayload = getStudentQrPayload;

function renderStudentQr(s) {
    if (!s || typeof QRCode === 'undefined') return;
    const payload = getStudentQrPayload(s);
    const miniWrap = document.getElementById('viewQrMini');
    if (miniWrap) {
        miniWrap.innerHTML = QRCode.createSvg(payload, 2, 0);
    }
}
window.renderStudentQr = renderStudentQr;

function openLearnerMobilePass(studentId, isDirectScan = false) {
    const id = studentId || currentViewId;
    const s = findStudent(id);
    if (!s) return;

    currentViewId = s.id;
    window.currentViewId = s.id;

    const payload = getStudentQrPayload(s);
    const largeWrap = document.getElementById('learnerMobileQrLarge');
    if (largeWrap && typeof QRCode !== 'undefined') {
        largeWrap.innerHTML = QRCode.createSvg(payload, 5, 2);
    }

    const setT = (elemId, val) => {
        const el = document.getElementById(elemId);
        if (el) el.textContent = (val !== undefined && val !== null && val !== '') ? val : '—';
    };

    setT('mobilePassName', `${s.lastName}, ${s.firstName} ${s.middleName ? s.middleName.charAt(0) + '.' : ''} ${s.suffix || ''}`);
    setT('mobilePassLrn', s.lrn || '—');
    setT('mobilePassGradeSection', `Grade ${s.gradeLevel} - ${s.section}`);
    setT('mobilePassSy', `S.Y. ${s.schoolYear || '2026-2027'}`);
    const isEsc = (s.escGrantee || 'NO').toUpperCase() === 'YES';
    setT('mobilePassEsc', isEsc ? 'YES (Grantee)' : 'NO');
    
    const statEl = document.getElementById('mobilePassStatus');
    if (statEl) {
        statEl.textContent = s.enrollmentStatus || 'Active';
        statEl.className = 'status-badge ' + (s.enrollmentStatus || 'Active').toLowerCase();
    }

    const avatarEl = document.getElementById('mobilePassAvatar');
    if (avatarEl) {
        if (s.photo) {
            avatarEl.innerHTML = `<img src="${s.photo}" alt="${escHtml(s.lastName)}" style="width:100%; height:100%; object-fit:cover;">`;
        } else {
            const initials = `${s.firstName ? s.firstName.charAt(0) : ''}${s.lastName ? s.lastName.charAt(0) : ''}`.toUpperCase();
            avatarEl.textContent = initials || 'SJ';
        }
    }

    openModal('learnerMobileModal');
}
window.openLearnerMobilePass = openLearnerMobilePass;

// ======================== DEDICATED QR & BARCODE SCANNER ========================

let qrVideoMediaStream = null;
let qrCameraFacing = 'environment';
let qrScanAnimationId = null;
let barcodeDetectorInstance = null;

function playScanBeep() {
    try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const audioCtx = new AudioCtx();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.15);
    } catch(e) {}
}
window.playScanBeep = playScanBeep;

function openQrScannerModal() {
    openModal('qrScannerModal');
    switchQrScannerTab('camera');
    setTimeout(() => {
        startQrCamera();
    }, 200);
}
window.openQrScannerModal = openQrScannerModal;

function closeQrScannerModal() {
    stopQrCamera();
    closeModal('qrScannerModal');
    const input = document.getElementById('qrScannerInput');
    if (input) input.value = '';
    const statusBox = document.getElementById('qrScannerStatusBox');
    if (statusBox) statusBox.style.display = 'none';
}
window.closeQrScannerModal = closeQrScannerModal;

function switchQrScannerTab(tab) {
    const tabs = ['camera', 'manual', 'upload'];
    tabs.forEach(t => {
        const btn = document.getElementById('tabScanner' + t.charAt(0).toUpperCase() + t.slice(1));
        const view = document.getElementById('qrScanner' + t.charAt(0).toUpperCase() + t.slice(1) + 'View');
        if (btn) btn.classList.toggle('active', t === tab);
        if (view) view.style.display = (t === tab) ? 'block' : 'none';
    });

    if (tab === 'camera') {
        startQrCamera();
    } else {
        stopQrCamera();
        if (tab === 'manual') {
            const inp = document.getElementById('qrScannerInput');
            if (inp) setTimeout(() => inp.focus(), 150);
        }
    }
}
window.switchQrScannerTab = switchQrScannerTab;

async function startQrCamera() {
    const video = document.getElementById('qrScannerVideo');
    const prompt = document.getElementById('qrScannerPrompt');
    const btnStart = document.getElementById('btnStartQrCamera');
    const btnStop = document.getElementById('btnStopQrCamera');
    const btnSwitch = document.getElementById('btnSwitchQrCamera');

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        if (prompt) prompt.textContent = 'Camera not supported. Please use scanner gun / manual LRN input.';
        return;
    }

    try {
        if (qrVideoMediaStream) {
            qrVideoMediaStream.getTracks().forEach(t => t.stop());
        }

        const constraints = {
            video: {
                facingMode: qrCameraFacing,
                width: { ideal: 1280 },
                height: { ideal: 720 }
            },
            audio: false
        };

        qrVideoMediaStream = await navigator.mediaDevices.getUserMedia(constraints);
        if (video) {
            video.srcObject = qrVideoMediaStream;
            video.setAttribute('playsinline', 'true');
            video.play();
        }

        if (btnStart) btnStart.style.display = 'none';
        if (btnStop) btnStop.style.display = 'inline-flex';
        if (btnSwitch) btnSwitch.style.display = 'inline-flex';
        if (prompt) prompt.textContent = 'Align QR Code within the viewfinder...';

        startScanningLoop();
    } catch(err) {
        console.warn('Camera access denied or failed:', err);
        if (prompt) prompt.textContent = 'Camera access unavailable. Please use scanner gun / LRN.';
        if (btnStart) btnStart.style.display = 'inline-flex';
        if (btnStop) btnStop.style.display = 'none';
        if (btnSwitch) btnSwitch.style.display = 'none';
    }
}
window.startQrCamera = startQrCamera;

function stopQrCamera() {
    if (qrScanAnimationId) {
        cancelAnimationFrame(qrScanAnimationId);
        qrScanAnimationId = null;
    }
    if (qrVideoMediaStream) {
        qrVideoMediaStream.getTracks().forEach(t => t.stop());
        qrVideoMediaStream = null;
    }
    const video = document.getElementById('qrScannerVideo');
    if (video) video.srcObject = null;

    const btnStart = document.getElementById('btnStartQrCamera');
    const btnStop = document.getElementById('btnStopQrCamera');
    const btnSwitch = document.getElementById('btnSwitchQrCamera');
    if (btnStart) btnStart.style.display = 'inline-flex';
    if (btnStop) btnStop.style.display = 'none';
    if (btnSwitch) btnSwitch.style.display = 'none';
}
window.stopQrCamera = stopQrCamera;

function switchQrCameraFacing() {
    qrCameraFacing = (qrCameraFacing === 'environment') ? 'user' : 'environment';
    startQrCamera();
}
window.switchQrCameraFacing = switchQrCameraFacing;

function startScanningLoop() {
    const video = document.getElementById('qrScannerVideo');
    if (!video) return;

    if ('BarcodeDetector' in window) {
        try {
            if (!barcodeDetectorInstance) {
                barcodeDetectorInstance = new BarcodeDetector({ formats: ['qr_code', 'code_128', 'ean_13', 'upc_a'] });
            }
        } catch(e) {}
    }

    const scanFrame = async () => {
        if (!qrVideoMediaStream || video.readyState !== video.HAVE_ENOUGH_DATA) {
            qrScanAnimationId = requestAnimationFrame(scanFrame);
            return;
        }

        if (barcodeDetectorInstance) {
            try {
                const barcodes = await barcodeDetectorInstance.detect(video);
                if (barcodes && barcodes.length > 0) {
                    const rawValue = barcodes[0].rawValue;
                    if (rawValue) {
                        handleQrScanResult(rawValue);
                        return;
                    }
                }
            } catch(e) {}
        }

        qrScanAnimationId = requestAnimationFrame(scanFrame);
    };

    qrScanAnimationId = requestAnimationFrame(scanFrame);
}

function handleQrScanResult(scannedText) {
    if (!scannedText) return;
    const text = String(scannedText).trim();

    let targetLrn = '';
    const urlMatch = text.match(/[?&]lrn=([^&]+)/i);
    if (urlMatch) {
        targetLrn = decodeURIComponent(urlMatch[1]).trim();
    } else {
        const lrnMatch = text.match(/LRN[:\s]+(\d{10,14})/i);
        if (lrnMatch) {
            targetLrn = lrnMatch[1].trim();
        } else {
            const pureDigits = text.match(/\b\d{10,14}\b/);
            if (pureDigits) {
                targetLrn = pureDigits[0].trim();
            } else {
                const idMatch = text.match(/STU-[\w-]+/i);
                if (idMatch) {
                    targetLrn = idMatch[0].trim();
                } else {
                    targetLrn = text;
                }
            }
        }
    }

    const s = (students || []).find(st => 
        (st.lrn && String(st.lrn).trim() === targetLrn) || 
        st.id === targetLrn || 
        String(st.id).replace(/^STU-/, '') === targetLrn.replace(/^STU-/, '') ||
        (`${st.lastName}, ${st.firstName}`.toLowerCase().includes(text.toLowerCase()) && text.length > 3)
    );

    if (s) {
        playScanBeep();
        stopQrCamera();
        closeModal('qrScannerModal');
        showToast(`Found student: ${s.lastName}, ${s.firstName} (LRN: ${s.lrn})`, 'success');
        setTimeout(() => {
            viewStudent(s.id);
        }, 150);
    } else {
        const statusBox = document.getElementById('qrScannerStatusBox');
        const statusMsg = document.getElementById('qrScannerStatusMsg');
        if (statusBox && statusMsg) {
            statusBox.style.display = 'block';
            statusBox.style.background = '#fef2f2';
            statusBox.style.borderColor = '#fca5a5';
            statusMsg.style.color = '#dc2626';
            statusMsg.textContent = `No student record found matching "${targetLrn}". Please verify LRN.`;
        }
        showToast(`No student found matching "${targetLrn}".`, 'warning');
    }
}
window.handleQrScanResult = handleQrScanResult;

function executeManualQrLookup() {
    const input = document.getElementById('qrScannerInput');
    if (!input || !input.value.trim()) {
        showToast('Please enter an LRN or scan barcode.', 'warning');
        return;
    }
    handleQrScanResult(input.value.trim());
}
window.executeManualQrLookup = executeManualQrLookup;

async function handleQrPhotoUpload(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    const statusBox = document.getElementById('qrScannerStatusBox');
    const statusMsg = document.getElementById('qrScannerStatusMsg');
    if (statusBox && statusMsg) {
        statusBox.style.display = 'block';
        statusBox.style.background = '#eff6ff';
        statusBox.style.borderColor = '#bfdbfe';
        statusMsg.style.color = '#1d4ed8';
        statusMsg.textContent = 'Decoding uploaded QR code image...';
    }

    const img = new Image();
    img.onload = async () => {
        if ('BarcodeDetector' in window) {
            try {
                const detector = new BarcodeDetector({ formats: ['qr_code', 'code_128', 'ean_13'] });
                const barcodes = await detector.detect(img);
                if (barcodes && barcodes.length > 0) {
                    handleQrScanResult(barcodes[0].rawValue);
                    return;
                }
            } catch(e) {}
        }
        if (statusBox && statusMsg) {
            statusBox.style.background = '#fef2f2';
            statusBox.style.borderColor = '#fca5a5';
            statusMsg.style.color = '#dc2626';
            statusMsg.textContent = 'Could not auto-decode QR code image. Please use camera or enter LRN manually.';
        }
        showToast('Could not decode QR image. Try manual LRN input.', 'warning');
    };
    img.src = URL.createObjectURL(file);
}
window.handleQrPhotoUpload = handleQrPhotoUpload;

function downloadLearnerQrCode() {
    const s = findStudent(currentViewId);
    if (!s) return;
    const payload = getStudentQrPayload(s);
    if (typeof QRCode === 'undefined') return;

    const svgString = QRCode.createSvg(payload, 8, 4);
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MDSJFI_QR_${s.lrn || s.lastName}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Learner Mobile QR downloaded successfully!', 'success');
}
window.downloadLearnerQrCode = downloadLearnerQrCode;

function printLearnerMobileCard() {
    const s = findStudent(currentViewId);
    if (!s) return;
    const payload = getStudentQrPayload(s);
    const qrSvg = (typeof QRCode !== 'undefined') ? QRCode.createSvg(payload, 4, 1) : '';
    const isEsc = (s.escGrantee || 'NO').toUpperCase() === 'YES';

    const printWin = window.open('', '_blank', 'width=480,height=680');
    if (!printWin) {
        showToast('Please allow popups to print ID card.', 'warning');
        return;
    }

    printWin.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Digital Learner Pass - ${s.lastName}, ${s.firstName}</title>
            <style>
                body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #fff; margin: 0; padding: 24px; display: flex; justify-content: center; }
                .card { width: 340px; border: 2px solid #0b2545; border-radius: 14px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
                .card-header { background: #0b2545; color: #fff; padding: 14px; text-align: center; }
                .card-header h2 { margin: 4px 0 0; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; }
                .card-header p { margin: 2px 0 0; font-size: 10px; opacity: 0.85; }
                .card-body { padding: 16px; text-align: center; }
                .qr-wrap { width: 160px; height: 160px; margin: 0 auto 12px; }
                .qr-wrap svg { width: 100%; height: 100%; }
                .student-name { font-size: 16px; font-weight: 700; color: #0b2545; margin: 0 0 4px; }
                .lrn { font-family: monospace; font-size: 13px; font-weight: 600; color: #475569; margin-bottom: 12px; }
                .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; text-align: left; font-size: 11px; border-top: 1px solid #e2e8f0; padding-top: 10px; }
                .info-label { color: #64748b; font-size: 9px; text-transform: uppercase; }
                .card-footer { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 8px; font-size: 9px; text-align: center; color: #64748b; }
            </style>
        </head>
        <body onload="window.print(); window.close();">
            <div class="card">
                <div class="card-header">
                    <h2>Montessori De San Jose</h2>
                    <p>Official Learner Mobile Pass • S.Y. ${s.schoolYear || '2026-2027'}</p>
                </div>
                <div class="card-body">
                    <div class="qr-wrap">${qrSvg}</div>
                    <div class="student-name">${s.lastName}, ${s.firstName} ${s.middleName || ''}</div>
                    <div class="lrn">LRN: ${s.lrn || 'N/A'}</div>
                    <div class="info-grid">
                        <div><div class="info-label">Grade & Section</div><strong>Grade ${s.gradeLevel} - ${s.section}</strong></div>
                        <div><div class="info-label">ESC Grantee</div><strong>${isEsc ? 'YES' : 'NO'}</strong></div>
                        <div><div class="info-label">Status</div><strong>${s.enrollmentStatus || 'Active'}</strong></div>
                        <div><div class="info-label">Contact</div><strong>${s.emergencyContact || s.contactNumber || 'N/A'}</strong></div>
                    </div>
                </div>
                <div class="card-footer">
                    DepEd Recognized • Verified Official Institutional Record
                </div>
            </div>
        </body>
        </html>
    `);
    printWin.document.close();
}
window.printLearnerMobileCard = printLearnerMobileCard;

function renderDocPreview(prefix, doc) {
    const details = document.getElementById(prefix + 'Details');
    const btnWrap = document.getElementById(prefix + 'BtnWrap');
    if (!details || !btnWrap) return;

    if (doc && doc.data) {
        details.innerHTML = `
            <div style="display:flex; flex-direction:column; gap:2px;">
                <span class="badge-uploaded" style="display:inline-flex; align-items:center; gap:4px; padding:2px 7px; border-radius:4px; background:#dcfce7; color:#15803d; font-size:0.75rem; font-weight:700; width:fit-content;">
                    <i class="fas fa-check-circle"></i> File Uploaded
                </span>
                <strong style="font-size:0.86rem; color:#0f172a; word-break:break-all;">${escHtml(doc.name || 'Document.pdf')}</strong>
                <small style="color:#64748b; font-size:0.75rem;">Size: ${doc.size || 'Attached'}</small>
            </div>
        `;
        btnWrap.innerHTML = `
            <div style="display:flex; gap:6px; align-items:center; flex-wrap:wrap; width:100%;">
                <button type="button" class="btn-sm btn-info" onclick="previewDocData('${prefix}')" title="Click to view uploaded file">
                    <i class="fas fa-eye"></i> View File
                </button>
                <button type="button" class="btn-sm btn-danger" onclick="deleteDocFromProfile('${prefix}')" title="Delete or replace this file">
                    <i class="fas fa-trash-alt"></i> Delete
                </button>
                <button type="button" class="btn-sm btn-secondary" onclick="triggerDocUploadFromProfile('${prefix}')" title="Replace with another file">
                    <i class="fas fa-sync-alt"></i> Replace
                </button>
            </div>
        `;
    } else {
        details.innerHTML = `
            <div style="display:flex; flex-direction:column; gap:2px;">
                <span class="badge-missing" style="display:inline-flex; align-items:center; gap:4px; padding:2px 7px; border-radius:4px; background:#fee2e2; color:#b91c1c; font-size:0.75rem; font-weight:700; width:fit-content;">
                    <i class="fas fa-exclamation-circle"></i> Not Uploaded
                </span>
                <span style="color:#94a3b8; font-size:0.8rem; font-style:italic;">No official document on file</span>
            </div>
        `;
        btnWrap.innerHTML = `
            <button type="button" class="btn-sm btn-primary" onclick="triggerDocUploadFromProfile('${prefix}')" title="Upload official file">
                <i class="fas fa-upload"></i> Upload File
            </button>
        `;
    }
}

window.activeProfileDocPrefix = null;

window.triggerDocUploadFromProfile = function(prefix) {
    window.activeProfileDocPrefix = prefix;
    const input = document.getElementById('profileDirectDocInput');
    if (input) {
        input.value = '';
        input.click();
    }
};

window.handleDirectDocUpload = function(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    const prefix = window.activeProfileDocPrefix;
    if (!prefix) return;
    const s = findStudent(currentViewId);
    if (!s) return;

    const details = document.getElementById(prefix + 'Details');
    if (details) {
        details.innerHTML = `<span style="color:#2563eb; font-weight:600; font-size:0.84rem;"><i class="fas fa-spinner fa-spin"></i> Uploading ${escHtml(file.name)}...</span>`;
    }

    const isImage = file.type.startsWith('image/');
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isImage && !isPdf) {
        showToast('Please upload a PDF document or scanned image (JPG, PNG).', 'warning');
        renderDocPreview(prefix, getDocFromStudent(s, prefix));
        return;
    }

    const processComplete = (dataUrl) => {
        const docObj = {
            data: dataUrl,
            name: file.name,
            type: file.type || (isPdf ? 'application/pdf' : 'image/jpeg'),
            size: formatBytes(file.size),
            dateUploaded: new Date().toISOString()
        };
        if (prefix === 'viewBirthCert') s.birthCertDoc = docObj;
        else if (prefix === 'viewTor') s.torDoc = docObj;
        else if (prefix === 'viewCard') s.studentCardDoc = docObj;

        saveStudents();
        renderDocPreview(prefix, docObj);
        renderPrintableStudentProfile(s);
        try { refreshStudentsTable(); } catch(e){}
        try { refreshGradeTable(s.gradeLevel); } catch(e){}
        showToast(`${file.name} uploaded successfully!`, 'success');
    };

    if (isImage) {
        optimizeImage(file, 1600, 1600, 0.85, processComplete);
    } else {
        const reader = new FileReader();
        reader.onload = (e) => processComplete(e.target.result);
        reader.readAsDataURL(file);
    }
};

window.deleteDocFromProfile = function(prefix) {
    const s = findStudent(currentViewId);
    if (!s) return;
    const title = prefix === 'viewBirthCert' ? 'PSA Birth Certificate' : (prefix === 'viewTor' ? 'Form 137 / TOR' : 'Report Card');
    if (!confirm(`Are you sure you want to delete or replace the ${title}?`)) return;

    if (prefix === 'viewBirthCert') s.birthCertDoc = null;
    else if (prefix === 'viewTor') s.torDoc = null;
    else if (prefix === 'viewCard') s.studentCardDoc = null;

    saveStudents();
    renderDocPreview(prefix, null);
    renderPrintableStudentProfile(s);
    try { refreshStudentsTable(); } catch(e){}
    try { refreshGradeTable(s.gradeLevel); } catch(e){}
    showToast(`${title} removed. You can now upload a replacement file.`, 'info');
};

function getDocFromStudent(s, prefix) {
    if (!s) return null;
    if (prefix === 'viewBirthCert') return s.birthCertDoc;
    if (prefix === 'viewTor') return s.torDoc;
    if (prefix === 'viewCard') return s.studentCardDoc;
    return null;
}

window.uploadPhotoFromProfile = function() {
    const input = document.getElementById('profileDirectPhotoInput');
    if (input) {
        input.value = '';
        input.click();
    }
};

window.handleDirectPhotoUpload = function(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    const s = findStudent(currentViewId);
    if (!s) return;

    const loader = document.getElementById('viewPhotoLoading');
    if (loader) loader.style.display = 'block';

    optimizeImage(file, 400, 400, 0.85, function(dataUrl) {
        s.photo = dataUrl;
        saveStudents();
        if (loader) loader.style.display = 'none';

        const avatar = document.getElementById('viewAvatar');
        if (avatar) {
            avatar.innerHTML = `<img src="${dataUrl}" alt="Student Photo" class="student-avatar-img">`;
        }
        const delBtn = document.getElementById('btnDeletePhotoFromProfile');
        if (delBtn) delBtn.style.display = 'inline-block';

        renderPrintableStudentProfile(s);
        try { refreshStudentsTable(); } catch(e){}
        try { refreshGradeTable(s.gradeLevel); } catch(e){}
        showToast('Student profile picture uploaded successfully!', 'success');
    });
};

window.deletePhotoFromProfile = function() {
    const s = findStudent(currentViewId);
    if (!s) return;

    requestAdminAuth(() => {
        if (!confirm('Are you sure you want to delete this Student Profile Picture?')) return;

        s.photo = '';
        saveStudents();

        const avatar = document.getElementById('viewAvatar');
        if (avatar) {
            avatar.innerHTML = `<i class="fas fa-user-graduate"></i>`;
        }
        const delBtn = document.getElementById('btnDeletePhotoFromProfile');
        if (delBtn) delBtn.style.display = 'none';

        renderPrintableStudentProfile(s);
        try { refreshStudentsTable(); } catch(e){}
        try { refreshGradeTable(s.gradeLevel); } catch(e){}
        showToast('Student profile picture deleted.', 'info');
    }, 'Delete Student Photo', `Deleting official student photo for ${s.lastName}, ${s.firstName} requires Administrator credentials verification.`, true);
};

function previewDocData(prefix) {
    const s = findStudent(currentViewId);
    if (!s) {
        showToast('No student record selected.', 'error');
        return;
    }

    let doc = null;
    let title = 'Document Preview';

    if (prefix === 'viewBirthCert') {
        doc = s.birthCertDoc;
        title = 'PSA / NSO Birth Certificate';
    } else if (prefix === 'viewTor') {
        doc = s.torDoc;
        title = 'Transcript of Records (SF10 / Form 137)';
    } else if (prefix === 'viewCard') {
        doc = s.studentCardDoc;
        title = 'Student Report Card (SF9 / Form 138)';
    }

    if (!doc || !doc.data) {
        showToast('No document attached for this record.', 'warning');
        return;
    }

    viewDocumentInModal(title, `${s.lastName}, ${s.firstName} (LRN: ${s.lrn})`, doc);
}

function viewDocumentInModal(title, subtitle, doc) {
    const titleEl = document.getElementById('docViewerTitle');
    const subEl = document.getElementById('docViewerSubtitle');
    const container = document.getElementById('docViewerContainer');
    const btnDl = document.getElementById('btnDownloadDoc');

    if (titleEl) titleEl.innerHTML = `<i class="fas fa-file-alt"></i> ${escHtml(title)}`;
    if (subEl) subEl.textContent = subtitle || 'Official Academic Credential';

    if (btnDl && doc && doc.data) {
        btnDl.href = doc.data;
        btnDl.download = doc.name || 'document_download';
    }

    if (container && doc && doc.data) {
        const isPdf = (doc.type && doc.type.includes('pdf')) || (doc.name && doc.name.toLowerCase().endsWith('.pdf')) || (doc.data && doc.data.startsWith('data:application/pdf'));

        if (isPdf) {
            container.innerHTML = `<iframe src="${doc.data}" title="${escHtml(title)}" style="width:100%; height:75vh; border:none; border-radius:6px; background:#fff;"></iframe>`;
        } else {
            container.innerHTML = `<img src="${doc.data}" alt="${escHtml(title)}" style="max-width:100%; max-height:70vh; object-fit:contain; border-radius:6px; box-shadow:0 8px 30px rgba(0,0,0,0.5); background:#fff;">`;
        }
    }

    openModal('docViewerModal');
}

function renderPrintableStudentProfile(s) {
    const container = document.getElementById('printableStudentProfileContainer');
    if (!container) return;

    const isEsc = (s.escGrantee || 'NO').toUpperCase() === 'YES';
    const fullName = `${s.lastName}, ${s.firstName} ${s.middleName || ''}${s.suffix ? ' ' + s.suffix : ''}`.trim();
    const dobFormatted = s.dateOfBirth ? formatDate(s.dateOfBirth) : '—';
    const nowFormatted = new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
    const fullAddress = s.address || `${s.addressBarangay || 'Poblacion'}, ${s.addressMunicipality || 'San Jose'}, ${s.addressProvince || 'Batangas'}`;

    let avatarHtml = `<div class="print-profile-avatar-fallback"><i class="fas fa-user-graduate"></i></div>`;
    if (s.photo) {
        avatarHtml = `<img src="${s.photo}" alt="Student Photo" class="print-profile-avatar-img">`;
    }

    let sigContentHtml = `
        <div class="print-sig-space">
            <span class="print-sig-placeholder">Digital Signature on Record</span>
        </div>`;
    if (s.signature) {
        sigContentHtml = `
        <div class="print-sig-img-wrap">
            <img src="${s.signature}" alt="Student Signature" class="print-sig-img">
        </div>`;
    }

    const printQrSvg = (typeof QRCode !== 'undefined') ? QRCode.createSvg(getStudentQrPayload(s), 2, 0) : '';

    container.innerHTML = `
        <!-- ==================== SINGLE PAGE OFFICIAL LEARNER'S PERMANENT RECORD ==================== -->
        <div class="profile-print-sheet single-page">
            <div class="print-sheet-header">
                <img src="school-logo.png" alt="School Logo" class="print-sheet-logo">
                <div class="print-sheet-header-text">
                    <h2>Montessori de San Jose Foundation Inc.</h2>
                    <p class="print-sheet-sub">0696 P. Burgos St., Brgy. Pag-asa, San Jose, Occidental Mindoro &bull; Recognized by the Department of Education</p>
                    <h3 class="print-sheet-doc-title">OFFICIAL LEARNER'S PERMANENT RECORD</h3>
                </div>
                <div class="print-sheet-header-meta" style="display: flex; align-items: center; gap: 8px;">
                    <div style="width: 48px; height: 48px; background: #fff; border: 1px solid #cbd5e1; border-radius: 4px; padding: 2px; flex-shrink: 0; display: flex; align-items: center; justify-content: center;">
                        ${printQrSvg}
                    </div>
                    <div>
                        <span class="print-meta-badge">CONFIDENTIAL</span>
                        <small>Issued: ${nowFormatted}</small>
                        <small style="display: block; font-size: 8px; color: #64748b; margin-top: 1px;">Mobile Pass</small>
                    </div>
                </div>
            </div>

            <div class="print-profile-hero">
                <div class="print-profile-avatar-box">
                    ${avatarHtml}
                </div>
                <div class="print-profile-hero-info">
                    <h1 class="print-profile-name">${escHtml(fullName)}</h1>
                    <div class="print-profile-grade">Grade ${escHtml(s.gradeLevel || '—')} &bull; Section ${escHtml(s.section || '—')}</div>
                    <div class="print-profile-badges">
                        <span class="print-badge sy">S.Y. ${escHtml(s.schoolYear || '2026-2027')}</span>
                        <span class="print-badge esc ${isEsc ? 'yes' : 'no'}">${isEsc ? 'ESC Grantee' + (s.escNumber ? ' (' + escHtml(s.escNumber) + ')' : '') : 'Non-ESC'}</span>
                        <span class="print-badge status ${(s.enrollmentStatus || 'Active').toLowerCase()}">${escHtml(s.enrollmentStatus || 'Active')}</span>
                    </div>
                </div>
            </div>

            <!-- Row 1: Student Details & Address (2 Columns) -->
            <div class="print-sections-grid-2col">
                <div class="print-card">
                    <div class="print-card-title"><i class="fas fa-id-card"></i> Student Identification &amp; Demographics</div>
                    <div class="print-row"><span>Learner Reference No. (LRN):</span><strong>${escHtml(s.lrn || '—')}</strong></div>
                    <div class="print-row"><span>Date of Birth / Age:</span><strong>${escHtml(dobFormatted)} (${escHtml(s.age || '—')} yrs)</strong></div>
                    <div class="print-row"><span>Gender / Birth Place:</span><strong>${escHtml(s.gender || '—')} &bull; ${escHtml(s.birthPlace || 'San Jose, Batangas')}</strong></div>
                    <div class="print-row"><span>Religion / First Language (L1):</span><strong>${escHtml(s.religion || 'Roman Catholic')} &bull; ${escHtml(s.motherTongue || 'Tagalog')}</strong></div>
                    <div class="print-row"><span>ESC Status:</span><strong>${isEsc ? 'YES' + (s.escNumber ? ' (No. ' + escHtml(s.escNumber) + ')' : ' (Grantee)') : 'NO (Regular)'}</strong></div>
                </div>

                <div class="print-card">
                    <div class="print-card-title"><i class="fas fa-map-marker-alt"></i> Complete Address &amp; Contact</div>
                    <div class="print-row"><span>Complete Address:</span><strong>${escHtml(fullAddress)}</strong></div>
                    <div class="print-row"><span>Barangay / Municipality:</span><strong>${escHtml(s.addressBarangay || 'Poblacion')}, ${escHtml(s.addressMunicipality || 'San Jose')}</strong></div>
                    <div class="print-row"><span>Province / Region:</span><strong>${escHtml(s.addressProvince || 'Batangas')}, ${escHtml(s.addressRegion || 'Region IV-A')}</strong></div>
                    <div class="print-row"><span>Contact Number:</span><strong>${escHtml(s.contactNumber || '—')}</strong></div>
                    <div class="print-row"><span>Email Address:</span><strong>${escHtml(s.email || '—')}</strong></div>
                </div>
            </div>

            <!-- Row 2: Emergency & Previous School, and Parent / Guardian (2 Columns) -->
            <div class="print-sections-grid-2col print-mt-xs">
                <div class="print-card">
                    <div class="print-card-title"><i class="fas fa-phone-alt"></i> Emergency &amp; Previous School</div>
                    <div class="print-row"><span>Emergency Contact:</span><strong>${escHtml(s.emergencyName || '—')} (${escHtml(s.emergencyRelation || 'Parent / Guardian')})</strong></div>
                    <div class="print-row"><span>Emergency Phone:</span><strong>${escHtml(s.emergencyContact || '—')}</strong></div>
                    <div class="print-row"><span>Previous School:</span><strong>${escHtml(s.previousSchool || 'San Jose Elementary School')}</strong></div>
                    <div class="print-row"><span>School Location:</span><strong>${escHtml(s.previousSchoolAddress || 'San Jose, Batangas')}</strong></div>
                </div>

                <div class="print-card">
                    <div class="print-card-title"><i class="fas fa-user-friends"></i> Parent &amp; Guardian Information</div>
                    <div class="print-row"><span>Father's Details:</span><strong>${escHtml(s.fatherName || '—')}${s.fatherContact ? ' &bull; ' + escHtml(s.fatherContact) : ''}</strong></div>
                    <div class="print-row"><span>Mother's Details:</span><strong>${escHtml(s.motherName || '—')}${s.motherContact ? ' &bull; ' + escHtml(s.motherContact) : ''}</strong></div>
                    <div class="print-row"><span>Guardian's Details:</span><strong>${escHtml(s.guardianName || '—')}${s.guardianRelationship ? ' (' + escHtml(s.guardianRelationship) + ')' : ''}</strong></div>
                    <div class="print-row"><span>Guardian Contact:</span><strong>${escHtml(s.guardianContact || '—')}</strong></div>
                </div>
            </div>

            <!-- Row 3: Remarks -->
            <div class="print-card print-mt-xs">
                <div class="print-card-title"><i class="fas fa-sticky-note"></i> Remarks &amp; Academic Status</div>
                <div class="print-remarks-box">
                    ${escHtml(s.remarks || 'Official DepEd Matriculation & Permanent Student Record.')}
                </div>
            </div>

            <!-- Row 4: Student E-Signature & Record Verification -->
            <div class="print-card print-mt-xs print-verification-card">
                <div class="print-card-title print-text-center"><i class="fas fa-signature"></i> Student E-Signature &amp; Record Verification</div>
                
                <div class="print-student-sig-wrap">
                    <div class="print-student-sig-card">
                        ${sigContentHtml}
                        <div class="print-sig-rule"></div>
                        <strong class="print-sig-name">${escHtml(s.firstName)} ${escHtml(s.lastName)}</strong>
                        <small class="print-sig-label">Learner / Student Signature</small>
                    </div>
                </div>

                <div class="print-signatories-3col">
                    <div class="print-sig-block">
                        <div class="print-signatory-space"></div>
                        <div class="print-signatory-line"></div>
                        <strong class="print-signatory-name">CARRELLE B. COLEGADO</strong>
                        <span class="print-signatory-role">Registrar/In-Charge, Accounting</span>
                    </div>
                    <div class="print-sig-block">
                        <div class="print-signatory-space"></div>
                        <div class="print-signatory-line"></div>
                        <strong class="print-signatory-name">GANITO P. CASUNCAD</strong>
                        <span class="print-signatory-role">School Principal</span>
                    </div>
                    <div class="print-sig-block">
                        <div class="print-signatory-space"></div>
                        <div class="print-signatory-line"></div>
                        <strong class="print-signatory-name">NI&Ntilde;O ALOYSIUS B. COLEGADO</strong>
                        <span class="print-signatory-role">School President</span>
                    </div>
                </div>
            </div>

            <!-- Pinned Single-Page Footer -->
            <div class="print-sheet-footer">
                <span>Official Learner Permanent Record &bull; Montessori de San Jose Foundation Inc.</span>
                <span>Page 1 of 1</span>
            </div>
        </div>
    `;
}

function printStudentRecord(studentId) {
    let id = (typeof studentId === 'string' || typeof studentId === 'number') ? studentId : null;
    if (!id) {
        id = currentViewId || window.currentViewId;
    }
    const s = findStudent(id);
    if (!s) {
        console.warn('Student record not found for printing:', id);
        return;
    }

    renderPrintableStudentProfile(s);

    document.body.classList.remove('printing-soa', 'printing-financial-summary');
    document.body.classList.add('printing-profile');

    const cleanup = () => {
        document.body.classList.remove('printing-profile');
        window.removeEventListener('afterprint', cleanup);
    };

    window.addEventListener('afterprint', cleanup);

    setTimeout(() => {
        window.print();
        setTimeout(cleanup, 1200);
    }, 150);
}

// ======================== STATEMENT OF ACCOUNT (SOA) MODAL ========================

function openSOAModal(id) {
    if (typeof isTeacher === 'function' && isTeacher()) {
        showToast('Access Restricted: Teachers cannot access confidential Statement of Account.', 'warning');
        return;
    }

    const s = findStudent(id);
    if (!s) {
        console.warn('Student record not found for SOA:', id);
        return;
    }

    currentSOAStudentId = s.id;
    window.currentSOAStudentId = s.id;
    currentSOAMode = 'view';

    const tuition = Number(s.tuitionFee) || DEFAULT_BASE_TUITION;
    const isEsc = (s.escGrantee === 'YES');
    const isDisc = (isEsc || s.isDiscounted === 'YES');
    const discount = (s.isDiscounted === 'YES' && Number(s.discountAmount) > 0)
        ? Number(s.discountAmount)
        : (isEsc ? 9000 : 0);
    const net = Math.max(0, tuition - discount);
    const payments = Array.isArray(s.payments) ? s.payments : [];
    const totalPaid = payments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
    const remainingBalance = Math.max(0, net - totalPaid);

    const setT = (elemId, val) => {
        const el = document.getElementById(elemId);
        if (el) el.textContent = val;
    };

    setT('soaModalStudentName', `${s.lastName}, ${s.firstName} ${s.middleName || ''}${s.suffix ? ' ' + s.suffix : ''}`);
    setT('soaModalGradeSec', `Grade ${s.gradeLevel} - ${s.section}`);
    setT('soaModalLRN', `LRN: ${s.lrn}`);
    setT('soaModalSY', `S.Y. ${s.schoolYear || '2026-2027'}`);

    const escBadge = document.getElementById('soaModalEscBadge');
    if (escBadge) {
        const isEsc = (s.escGrantee === 'YES');
        escBadge.className = isEsc ? 'badge-esc-yes' : 'badge-esc-no';
        escBadge.textContent = isEsc ? 'ESC Grantee' : 'Non-ESC';
    }

    setT('soaTuitionVal', '₱' + tuition.toLocaleString('en-PH', { minimumFractionDigits: 2 }));
    const discBadge = document.getElementById('soaDiscBadge');
    if (discBadge) {
        if (isEsc) {
            discBadge.textContent = 'ESC Grantee';
            discBadge.className = 'soa-disc-badge yes';
        } else if (isDisc) {
            discBadge.textContent = 'DISCOUNTED';
            discBadge.className = 'soa-disc-badge yes';
        } else {
            discBadge.textContent = 'STANDARD';
            discBadge.className = 'soa-disc-badge no';
        }
    }
    setT('soaDiscAmountText', isDisc ? ('-₱' + discount.toLocaleString('en-PH', { minimumFractionDigits: 2 })) : '₱0.00');
    setT('soaNetPayableText', '₱' + net.toLocaleString('en-PH', { minimumFractionDigits: 2 }));
    setT('soaTotalPaidVal', '₱' + totalPaid.toLocaleString('en-PH', { minimumFractionDigits: 2 }));
    setT('soaInstallmentsCount', `${payments.length} installment${payments.length !== 1 ? 's' : ''}`);
    setT('soaRemainingBalanceVal', '₱' + remainingBalance.toLocaleString('en-PH', { minimumFractionDigits: 2 }));

    const statusPill = document.getElementById('soaStatusPill');
    const balCard = document.getElementById('soaBalanceCard');
    const balSymbol = document.getElementById('soaBalanceSymbol');
    if (remainingBalance === 0) {
        if (statusPill) { statusPill.textContent = 'SETTLED'; statusPill.className = 'soa-status-pill settled'; }
        if (balCard) balCard.className = 'soa-stat-card card-balance soa-balance-hero settled';
        if (balSymbol) balSymbol.innerHTML = '<i class="fas fa-check-circle"></i>';
    } else {
        if (statusPill) { statusPill.textContent = 'UNSETTLED'; statusPill.className = 'soa-status-pill unsettled'; }
        if (balCard) balCard.className = 'soa-stat-card card-balance soa-balance-hero unsettled';
        if (balSymbol) balSymbol.innerHTML = '<i class="fas fa-balance-scale"></i>';
    }

    // Print header values
    setT('soaPrintSY', s.schoolYear || '2026-2027');
    setT('soaPrintName', `${s.lastName}, ${s.firstName} ${s.middleName || ''}`);
    setT('soaPrintLRN', s.lrn);
    setT('soaPrintGradeSec', `Grade ${s.gradeLevel} - ${s.section}`);
    setT('soaPrintDate', new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' }));

    // Payment breakdown table (Read-Only View)
    currentSOAMode = 'view';
    document.querySelectorAll('.soa-action-col').forEach(el => el.style.display = 'none');

    const btnSOA = document.getElementById('btnToggleSOAEdit') || document.getElementById('btnUpdateSOA');
    const btnSOAText = document.getElementById('btnUpdateSOAText');
    if (btnSOAText) btnSOAText.textContent = 'Update SOA';
    else if (btnSOA) btnSOA.innerHTML = '<i class="fas fa-edit"></i> Update SOA';

    const btnSOABottom = document.getElementById('btnUpdateSOABottom');
    const btnSOABottomText = document.getElementById('btnUpdateSOABottomText');
    if (btnSOABottomText) btnSOABottomText.textContent = 'Update SOA';
    else if (btnSOABottom) btnSOABottom.innerHTML = '<i class="fas fa-edit"></i> Update SOA';

    const adjustCard = document.getElementById('soaTuitionAdjustCard');
    if (adjustCard) adjustCard.style.display = 'none';

    const tableBody = document.getElementById('soaPaymentTableBody');
    if (tableBody) {
        if (payments.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="5" class="empty-state" style="text-align:center; padding:18px;"><i class="fas fa-receipt" style="font-size:1.5rem; color:#94a3b8; margin-bottom:6px;"></i><p style="color:#64748b; font-size:0.85rem; margin:0;">No payment records found.</p></td></tr>`;
        } else {
            tableBody.innerHTML = payments.map((p, idx) => `
                <tr>
                    <td style="text-align:center; font-weight:600;">${idx + 1}</td>
                    <td><strong>${escHtml(p.term || 'Installment ' + (idx + 1))}</strong></td>
                    <td><code>${escHtml(p.orNumber || '\u2014')}</code></td>
                    <td>${p.date ? formatDate(p.date) : '\u2014'}</td>
                    <td style="text-align:right; font-weight:700; color:#16a34a;">\u20B1${(Number(p.amount) || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
                </tr>
            `).join('');
        }
    }

    setT('soaFootTotalPaid', '\u20B1' + totalPaid.toLocaleString('en-PH', { minimumFractionDigits: 2 }));
    setT('soaFootRemainingBalance', '\u20B1' + remainingBalance.toLocaleString('en-PH', { minimumFractionDigits: 2 }));

    openModal('soaModal');
}

function printSOAModal() {
    const activeId = currentSOAStudentId || window.currentSOAStudentId;
    if (activeId) {
        currentSOAStudentId = activeId;
        window.currentSOAStudentId = activeId;
    }

    const modal = document.getElementById('soaModal');
    if (!modal) {
        window.print();
        return;
    }

    document.body.classList.remove('printing-profile', 'printing-financial-summary');
    document.body.classList.add('printing-soa');

    const cleanup = () => {
        document.body.classList.remove('printing-soa');
        window.removeEventListener('afterprint', cleanup);
    };

    window.addEventListener('afterprint', cleanup);

    setTimeout(() => {
        window.print();
        setTimeout(cleanup, 1200);
    }, 80);
}

function toggleSOAEditMode() {
    const s = findStudent(currentSOAStudentId);
    if (!s) return;

    if (currentSOAMode === 'view') {
        if (!isAdmin()) {
            requestAdminAuth(() => {
                proceedToggleSOAEditMode(s);
            }, 'Update Statement of Account', `Modifying tuition fees, subsidy discounts, or existing installment records for ${s.lastName}, ${s.firstName} requires Administrator credentials.`);
            return;
        }
        proceedToggleSOAEditMode(s);
    } else {
        proceedToggleSOAEditMode(s);
    }
}
window.toggleSOAEditMode = toggleSOAEditMode;

function renderSOAEditRows(s) {
    const tableBody = document.getElementById('soaPaymentTableBody');
    if (!tableBody) return;
    const payments = Array.isArray(s.payments) ? s.payments : [];

    // Ensure action column is displayed in edit mode
    document.querySelectorAll('.soa-action-col').forEach(el => el.style.display = '');

    if (payments.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="empty-state" style="text-align:center; padding:18px;">
                    <i class="fas fa-receipt" style="font-size:1.5rem; color:#94a3b8; margin-bottom:6px;"></i>
                    <p style="color:#64748b; font-size:0.85rem; margin:0 0 10px 0;">No installment records entered yet.</p>
                    <button type="button" class="btn-sm btn-primary" onclick="addSOAPaymentRow()">
                        <i class="fas fa-plus-circle"></i> Add First Payment Item
                    </button>
                </td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = payments.map((p, idx) => `
        <tr data-payment-index="${idx}">
            <td style="text-align:center; font-weight:600;">${idx + 1}</td>
            <td>
                <input type="text" class="input-inline" value="${escHtml(p.term || '')}" placeholder="e.g. Installment ${idx + 1}" onchange="updateSOAPaymentField(${idx}, 'term', this.value)" style="width:100%; padding:6px 8px; border:1px solid #cbd5e1; border-radius:4px; font-size:0.85rem;">
            </td>
            <td>
                <input type="text" class="input-inline" value="${escHtml(p.orNumber || '')}" placeholder="e.g. OR-1234" onchange="updateSOAPaymentField(${idx}, 'orNumber', this.value)" style="width:100%; padding:6px 8px; border:1px solid #cbd5e1; border-radius:4px; font-size:0.85rem; font-family:monospace;">
            </td>
            <td>
                <input type="date" class="input-inline" value="${p.date || ''}" onchange="updateSOAPaymentField(${idx}, 'date', this.value)" style="width:100%; padding:6px 8px; border:1px solid #cbd5e1; border-radius:4px; font-size:0.85rem;">
            </td>
            <td>
                <input type="number" class="input-inline" style="width:100%; padding:6px 8px; border:1px solid #cbd5e1; border-radius:4px; font-size:0.85rem; text-align:right; font-weight:700; color:#16a34a;" value="${p.amount !== undefined ? p.amount : 0}" min="0" step="any" onchange="updateSOAPaymentField(${idx}, 'amount', Number(this.value))">
            </td>
            <td style="text-align:center; vertical-align:middle;">
                <button type="button" class="btn-icon delete btn-delete-payment" onclick="deleteSOAPaymentRow(${idx})" title="Delete Payment Item #${idx + 1}" style="color:#ef4444; background:#fee2e2; border:1px solid #fca5a5; width:30px; height:30px; border-radius:6px; display:inline-flex; align-items:center; justify-content:center; cursor:pointer;">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </td>
        </tr>
    `).join('') + `
        <tr>
            <td colspan="6" style="text-align:center; padding:10px; background:#f8fafc;">
                <button type="button" class="btn-sm btn-primary" onclick="addSOAPaymentRow()" style="display:inline-flex; align-items:center; gap:6px;">
                    <i class="fas fa-plus-circle"></i> Add Payment Item
                </button>
            </td>
        </tr>
    `;
}
window.renderSOAEditRows = renderSOAEditRows;

function updateSOALiveTotals(s) {
    if (!s) return;
    const tuition = Number(s.tuitionFee) || DEFAULT_BASE_TUITION;
    const isEsc = (s.escGrantee === 'YES');
    const isDisc = (isEsc || s.isDiscounted === 'YES');
    const discount = (s.isDiscounted === 'YES' && Number(s.discountAmount) > 0)
        ? Number(s.discountAmount)
        : (isEsc ? 9000 : 0);
    const net = Math.max(0, tuition - discount);
    const payments = Array.isArray(s.payments) ? s.payments : [];
    const totalPaid = payments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
    const remainingBalance = Math.max(0, net - totalPaid);
    s.remainingBalance = remainingBalance;

    const setT = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
    };

    setT('soaTotalPaidVal', '\u20B1' + totalPaid.toLocaleString('en-PH', { minimumFractionDigits: 2 }));
    setT('soaInstallmentsCount', `${payments.length} installment${payments.length !== 1 ? 's' : ''}`);
    setT('soaRemainingBalanceVal', '\u20B1' + remainingBalance.toLocaleString('en-PH', { minimumFractionDigits: 2 }));
    setT('soaFootTotalPaid', '\u20B1' + totalPaid.toLocaleString('en-PH', { minimumFractionDigits: 2 }));
    setT('soaFootRemainingBalance', '\u20B1' + remainingBalance.toLocaleString('en-PH', { minimumFractionDigits: 2 }));

    const statusPill = document.getElementById('soaStatusPill');
    const balCard = document.getElementById('soaBalanceCard');
    const balSymbol = document.getElementById('soaBalanceSymbol');
    if (remainingBalance === 0) {
        if (statusPill) { statusPill.textContent = 'SETTLED'; statusPill.className = 'soa-status-pill settled'; }
        if (balCard) balCard.className = 'soa-stat-card card-balance soa-balance-hero settled';
        if (balSymbol) balSymbol.innerHTML = '<i class="fas fa-check-circle"></i>';
    } else {
        if (statusPill) { statusPill.textContent = 'UNSETTLED'; statusPill.className = 'soa-status-pill unsettled'; }
        if (balCard) balCard.className = 'soa-stat-card card-balance soa-balance-hero unsettled';
        if (balSymbol) balSymbol.innerHTML = '<i class="fas fa-balance-scale"></i>';
    }
}
window.updateSOALiveTotals = updateSOALiveTotals;

function proceedToggleSOAEditMode(s) {
    const btn = document.getElementById('btnToggleSOAEdit') || document.getElementById('btnUpdateSOA');
    const btnText = document.getElementById('btnUpdateSOAText');
    const btnBottom = document.getElementById('btnUpdateSOABottom');
    const btnBottomText = document.getElementById('btnUpdateSOABottomText');
    const adjustCard = document.getElementById('soaTuitionAdjustCard');

    if (currentSOAMode === 'view') {
        currentSOAMode = 'edit';
        if (btnText) btnText.textContent = 'Save / Done Editing';
        else if (btn) btn.innerHTML = '<i class="fas fa-check"></i> Done Editing';
        if (btnBottomText) btnBottomText.textContent = 'Save / Done Editing';
        else if (btnBottom) btnBottom.innerHTML = '<i class="fas fa-check"></i> Save / Done Editing';
        if (adjustCard) {
            adjustCard.style.display = 'block';
            const qTuition = document.getElementById('soaQuickTuition');
            const qDisc = document.getElementById('soaQuickDiscounted');
            const qAmt = document.getElementById('soaQuickDiscountAmt');
            const qAmtGroup = document.getElementById('soaQuickDiscountAmtGroup');

            if (qTuition) qTuition.value = Number(s.tuitionFee) || DEFAULT_BASE_TUITION;
            const isEsc = (s.escGrantee === 'YES');
            const isDisc = (isEsc || s.isDiscounted === 'YES');
            if (qDisc) qDisc.value = isDisc ? 'YES' : 'NO';
            if (qAmt) qAmt.value = Number(s.discountAmount) || (isEsc ? 9000 : 0);
            if (qAmtGroup) qAmtGroup.style.display = isDisc ? 'flex' : 'none';
        }

        renderSOAEditRows(s);
    } else {
        currentSOAMode = 'view';
        if (btnText) btnText.textContent = 'Update SOA';
        else if (btn) btn.innerHTML = '<i class="fas fa-edit"></i> Update SOA';
        if (btnBottomText) btnBottomText.textContent = 'Update SOA';
        else if (btnBottom) btnBottom.innerHTML = '<i class="fas fa-edit"></i> Update SOA';
        if (adjustCard) adjustCard.style.display = 'none';

        document.querySelectorAll('.soa-action-col').forEach(el => el.style.display = 'none');
        saveStudents();
        openSOAModal(s.id);
        refreshSOAPage();
        showToast('Statement of Account updated successfully!', 'success');
    }
}
window.proceedToggleSOAEditMode = proceedToggleSOAEditMode;

function updateSOAPaymentField(idx, field, value) {
    const s = findStudent(currentSOAStudentId);
    if (!s || !Array.isArray(s.payments) || !s.payments[idx]) return;
    s.payments[idx][field] = value;
    updateSOALiveTotals(s);
    saveStudents();
}
window.updateSOAPaymentField = updateSOAPaymentField;

function deleteSOAPaymentRow(idx) {
    const s = findStudent(currentSOAStudentId);
    if (!s || !Array.isArray(s.payments) || !s.payments[idx]) return;

    const p = s.payments[idx];
    const pTitle = p.term || `Installment #${idx + 1}`;
    const pAmt = Number(p.amount) || 0;

    requestAdminAuth(() => {
        proceedDeleteSOAPaymentRow(s, idx, p, pTitle, pAmt);
    }, 'Delete SOA Payment Item', `Deleting payment item "${pTitle}" (₱${pAmt.toLocaleString('en-PH', { minimumFractionDigits: 2 })}) for ${s.lastName}, ${s.firstName} is an audited financial operation. Administrator credentials verification is strictly required to proceed.`, true);
}

function proceedDeleteSOAPaymentRow(s, idx, p, pTitle, pAmt) {
    if (!s || !Array.isArray(s.payments) || !s.payments[idx]) return;

    const pOr = (p.orNumber || '').trim();
    const pDate = p.date || '';

    if (!confirm(`Are you sure you want to delete payment item "${pTitle}" (₱${pAmt.toLocaleString('en-PH', { minimumFractionDigits: 2 })})? This action will also automatically remove the matching transaction from Daily Cash In & Out Flow.`)) {
        return;
    }

    // Automatically remove matching transaction from Daily Cash In & Out Flow
    try {
        const cfEntries = getCashFlowEntries();
        let deletedCf = null;

        const updatedCf = cfEntries.filter(cf => {
            if (deletedCf) return true; // Delete at most one matching entry per deleted SOA installment

            const matchesRef = pOr && cf.refNo && cf.refNo.trim().toLowerCase() === pOr.toLowerCase();
            const matchesAmount = Math.abs((Number(cf.amount) || 0) - pAmt) < 0.01;
            const matchesDate = !pDate || !cf.date || cf.date === pDate;
            const matchesStudent = (cf.studentId && cf.studentId === s.id) ||
                                   (cf.entity && cf.entity.toLowerCase().includes((s.lastName || '').toLowerCase()));

            if (matchesRef && (matchesStudent || matchesAmount)) {
                deletedCf = cf;
                return false;
            }
            if (!pOr && matchesStudent && matchesAmount && matchesDate) {
                deletedCf = cf;
                return false;
            }
            return true;
        });

        if (deletedCf) {
            saveCashFlowEntries(updatedCf);
            if (typeof logActivity === 'function') {
                logActivity('Cash Flow Auto-Sync Deletion', `Auto-deleted Cash Flow transaction ${deletedCf.refNo} (₱${formatNumber(deletedCf.amount)}) due to SOA deletion for ${s.lastName}, ${s.firstName}`, deletedCf);
            }
            if (typeof refreshCashFlowPage === 'function') {
                refreshCashFlowPage();
            }
        }
    } catch(err) {
        console.error('Error auto-syncing SOA payment deletion to Cash Flow:', err);
    }

    s.payments.splice(idx, 1);
    updateSOALiveTotals(s);
    saveStudents();
    renderSOAEditRows(s);
    if (typeof refreshClearancePage === 'function') refreshClearancePage();
    showToast(`Payment item "${pTitle}" deleted and synchronized with Daily Cash Flow.`, 'info');
}
window.deleteSOAPaymentRow = deleteSOAPaymentRow;

function addSOAPaymentRow() {
    const s = findStudent(currentSOAStudentId);
    if (!s) return;
    if (!Array.isArray(s.payments)) s.payments = [];
    s.payments.push({
        id: 'PAY-' + Date.now(),
        term: 'Installment ' + (s.payments.length + 1),
        orNumber: 'OR-' + String(Math.floor(1000 + Math.random() * 9000)),
        date: new Date().toISOString().split('T')[0],
        amount: 500,
        notes: `Installment payment for S.Y. ${s.schoolYear || '2026-2027'}`
    });
    updateSOALiveTotals(s);
    saveStudents();
    renderSOAEditRows(s);
    showToast('New payment installment added.', 'info');
}
window.addSOAPaymentRow = addSOAPaymentRow;
window.showAddPaymentModal = addSOAPaymentRow;

function toggleTuitionAdjustForm() {
    const body = document.getElementById('soaAdjustBody');
    const chevron = document.getElementById('adjustChevron');
    if (!body) return;
    if (body.style.display === 'none') {
        body.style.display = 'block';
        if (chevron) chevron.className = 'fas fa-chevron-up';
    } else {
        body.style.display = 'none';
        if (chevron) chevron.className = 'fas fa-chevron-down';
    }
}

function onQuickDiscountChange() {
    const val = document.getElementById('soaQuickDiscounted')?.value;
    const group = document.getElementById('soaQuickDiscountAmtGroup');
    if (group) group.style.display = (val === 'YES') ? 'flex' : 'none';
}

function saveQuickTuitionSettings() {
    const s = findStudent(currentSOAStudentId);
    if (!s) return;

    if (!isAdmin()) {
        requestAdminAuth(() => {
            proceedSaveQuickTuitionSettings(s);
        }, 'Adjust Tuition & Subsidy Rates', 'Modifying official tuition assessments or subsidy rates requires Administrator credentials.');
        return;
    }
    proceedSaveQuickTuitionSettings(s);
}

function proceedSaveQuickTuitionSettings(s) {
    const newTuition = Number(document.getElementById('soaQuickTuition')?.value) || DEFAULT_BASE_TUITION;
    const isDisc = document.getElementById('soaQuickDiscounted')?.value || 'NO';
    const discAmt = (isDisc === 'YES') ? (Number(document.getElementById('soaQuickDiscountAmt')?.value) || 0) : 0;

    s.tuitionFee = newTuition;
    s.isDiscounted = isDisc;
    s.discountAmount = discAmt;

    const payments = Array.isArray(s.payments) ? s.payments : [];
    const totalPaid = payments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
    s.remainingBalance = Math.max(0, (newTuition - discAmt) - totalPaid);

    saveStudents();
    openSOAModal(s.id);
    refreshSOAPage();
    showToast('Tuition fee & discount rates updated successfully!', 'success');
}

// ======================== EDIT PROFILE ========================

// ======================== ACCOUNT RESTRICTIONS & ADMIN AUTHORIZATION ========================

let pendingAdminAuthCallback = null;

function requestAdminAuth(onSuccess, actionTitle, actionDescription, forcePrompt = false) {
    if (!forcePrompt && isAdmin()) {
        if (typeof onSuccess === 'function') onSuccess();
        return;
    }

    pendingAdminAuthCallback = onSuccess;

    const modal = document.getElementById('adminAuthModal');
    if (!modal) {
        const u = prompt('Administrator Authorization Required.\nEnter Admin Username:');
        const p = prompt('Enter Admin Password:');
        if (u && p && u.trim().toLowerCase() === 'admin' && p.trim() === 'admin123') {
            showToast('Administrator authorization granted.', 'success');
            if (typeof onSuccess === 'function') onSuccess();
        } else {
            showToast('Invalid administrator credentials. Access denied.', 'error');
        }
        return;
    }

    const titleSpan = document.querySelector('#adminAuthTitle span');
    if (titleSpan && actionTitle) {
        titleSpan.textContent = `Authorization Required: ${actionTitle}`;
    }
    const subEl = document.getElementById('adminAuthSubtitle');
    if (subEl) {
        subEl.textContent = actionDescription || 'Administrator credentials required to verify and authorize this action.';
    }

    const userInput = document.getElementById('adminAuthUsername');
    const passInput = document.getElementById('adminAuthPassword');
    const errEl = document.getElementById('adminAuthError');
    if (userInput) userInput.value = '';
    if (passInput) passInput.value = '';
    if (errEl) {
        errEl.style.display = 'none';
        errEl.classList.remove('show');
    }

    openModal('adminAuthModal');
    if (userInput) setTimeout(() => userInput.focus(), 150);
}
window.requestAdminAuth = requestAdminAuth;

function closeAdminAuthModal() {
    closeModal('adminAuthModal');
    pendingAdminAuthCallback = null;
    const errEl = document.getElementById('adminAuthError');
    if (errEl) {
        errEl.style.display = 'none';
        errEl.classList.remove('show');
    }
}
window.closeAdminAuthModal = closeAdminAuthModal;

function executeAdminAuth() {
    const userInput = document.getElementById('adminAuthUsername');
    const passInput = document.getElementById('adminAuthPassword');
    const errEl = document.getElementById('adminAuthError');
    const errMsg = document.getElementById('adminAuthErrorMsg');

    const u = (userInput ? userInput.value : '').trim().toLowerCase();
    const p = (passInput ? passInput.value : '').trim();

    // Verify against School President / Admin credentials
    if (u === 'admin' && p === 'admin123') {
        closeModal('adminAuthModal');
        showToast('Administrator authorization granted.', 'success');

        const cb = pendingAdminAuthCallback;
        pendingAdminAuthCallback = null;
        if (typeof cb === 'function') {
            cb();
        }
    } else {
        if (errEl) {
            errEl.style.display = 'flex';
            errEl.classList.add('show');
            if (errMsg) errMsg.textContent = 'Invalid administrator credentials. Access denied.';
        }
        if (passInput) {
            passInput.value = '';
            passInput.focus();
        }
    }
}
window.executeAdminAuth = executeAdminAuth;

function handleImportClick() {
    if (!isAdmin()) {
        requestAdminAuth(() => {
            const input = document.getElementById('importFileInput');
            if (input) input.click();
        }, 'Import Student Data', 'Importing or overwriting student records into the database requires Administrator credentials.');
        return;
    }
    const input = document.getElementById('importFileInput');
    if (input) input.click();
}
window.handleImportClick = handleImportClick;

function editStudent(id) {
    if (typeof isTeacher === 'function' && isTeacher()) {
        showToast('Teacher account has view-only permissions. Modifying student records is restricted.', 'info');
        viewStudent(id);
        return;
    }

    const s = findStudent(id);
    if (!s) {
        console.warn('Student record not found for edit:', id);
        return;
    }

    if (!isAdmin()) {
        requestAdminAuth(() => {
            proceedEditStudent(s);
        }, 'Edit Student Record', `Registrar account can enroll/encode new students once. Modifying or editing the enrolled record of ${s.lastName}, ${s.firstName} (LRN: ${s.lrn}) requires Administrator credentials.`);
    } else {
        proceedEditStudent(s);
    }
}
window.editStudent = editStudent;
window.realEditStudent = editStudent;

function proceedEditStudent(s) {
    const setVal = (elemId, val) => {
        const el = document.getElementById(elemId);
        if (el) el.value = (val !== undefined && val !== null) ? val : '';
    };

    setVal('editStudentId', s.id);
    setVal('lrn', s.lrn);

    const sySelect = document.getElementById('formSchoolYear');
    if (sySelect) {
        sySelect.value = s.schoolYear || '2026-2027';
    }

    setVal('escGrantee', (s.escGrantee || 'NO').toUpperCase());
    setVal('escNumber', s.escNumber || '');

    setVal('lastName', s.lastName);
    setVal('firstName', s.firstName);
    setVal('middleName', s.middleName || '');
    setVal('suffix', s.suffix || '');
    setVal('gradeLevel', s.gradeLevel);
    setVal('section', s.section);
    setVal('gender', s.gender);
    setVal('dateOfBirth', s.dateOfBirth);
    setVal('age', s.age || '');

    // Cascading geographic location selectors
    setBirthPlaceValues(s.birthRegion || s.birthRegionCode, s.birthProvince || s.birthProvinceCode, s.birthMunicipality || s.birthMunicipalityCode, s.birthBarangay, s.birthPlace);
    setAddressValues(s.addressRegion || s.addressRegionCode, s.addressProvince || s.addressProvinceCode, s.addressMunicipality || s.addressMunicipalityCode, s.addressBarangay, s.addressStreet, s.address);

    const relSelect = document.getElementById('religion');
    const relOtherContainer = document.getElementById('religionOtherContainer');
    const relOtherInput = document.getElementById('religionOther');
    if (relSelect) {
        const hasOpt = Array.from(relSelect.options).some(o => o.value === s.religion);
        if (hasOpt) {
            relSelect.value = s.religion;
            if (relOtherContainer) relOtherContainer.style.display = 'none';
            if (relOtherInput) relOtherInput.value = '';
        } else if (s.religion) {
            relSelect.value = 'Other';
            if (relOtherContainer) relOtherContainer.style.display = 'block';
            if (relOtherInput) relOtherInput.value = s.religion;
        } else {
            relSelect.value = 'Roman Catholic';
            if (relOtherContainer) relOtherContainer.style.display = 'none';
            if (relOtherInput) relOtherInput.value = '';
        }
    }
    setVal('motherTongue', s.motherTongue || 'Tagalog');
    setVal('enrollmentStatus', s.enrollmentStatus || 'Active');

    const finisherGroup = document.getElementById('jhsFinisherGroup');
    const finisherCheck = document.getElementById('isJhsFinisher');
    if (finisherGroup) {
        if (String(s.gradeLevel) === '10') {
            finisherGroup.style.display = 'block';
            if (finisherCheck) {
                finisherCheck.checked = !!(s.isJhsFinisher || ['graduated', 'completed', 'alumni'].includes((s.enrollmentStatus || '').toLowerCase()));
            }
        } else {
            finisherGroup.style.display = 'none';
            if (finisherCheck) finisherCheck.checked = false;
        }
    }

    setVal('contactNumber', s.contactNumber || '');
    setVal('email', s.email || '');

    setVal('fatherName', s.fatherName || '');
    setVal('fatherOccupation', s.fatherOccupation || '');
    setVal('fatherContact', s.fatherContact || '');
    setVal('motherName', s.motherName || '');
    setVal('motherOccupation', s.motherOccupation || '');
    setVal('motherContact', s.motherContact || '');
    setVal('guardianName', s.guardianName || '');
    setVal('guardianRelationship', s.guardianRelationship || '');
    setVal('guardianContact', s.guardianContact || '');

    setVal('emergencyName', s.emergencyName || '');
    setVal('emergencyRelation', s.emergencyRelation || 'Parent / Guardian');
    setVal('emergencyContact', s.emergencyContact || '');

    setVal('previousSchool', s.previousSchool || '');
    setVal('previousSchoolAddress', s.previousSchoolAddress || '');
    setVal('remarks', s.remarks || '');

    // Tuition and discount
    setVal('tuitionFee', s.tuitionFee || DEFAULT_BASE_TUITION);
    setVal('isDiscounted', s.isDiscounted || 'NO');
    setVal('discountAmount', s.discountAmount || 0);

    const discGroup = document.getElementById('discountAmountGroup');
    if (discGroup) discGroup.style.display = (s.isDiscounted === 'YES') ? 'block' : 'none';

    // Restore Student Photo
    if (s.photo) {
        setPhotoPreview(s.photo);
    } else {
        removeCurrentPhoto(false);
    }

    // Restore Documents
    if (s.birthCertDoc && s.birthCertDoc.data) {
        setDocCardState('birthCert', s.birthCertDoc);
    } else {
        removeCurrentDoc('birthCert', false);
    }

    if (s.torDoc && s.torDoc.data) {
        setDocCardState('tor', s.torDoc);
    } else {
        removeCurrentDoc('tor', false);
    }

    if (s.studentCardDoc && s.studentCardDoc.data) {
        setDocCardState('card', s.studentCardDoc);
    } else {
        removeCurrentDoc('card', false);
    }

    // Restore Signature
    if (s.signature) {
        setSignatureState(s.signature);
    } else {
        clearSignaturePad(false);

    const relOtherContainer = document.getElementById('religionOtherContainer');
    const relOtherInput = document.getElementById('religionOther');
    if (relOtherContainer) relOtherContainer.style.display = 'none';
    if (relOtherInput) relOtherInput.value = '';
    }

    const titleEl = document.getElementById('formTitle');
    if (titleEl) titleEl.textContent = 'Edit Student Record';
    const descEl = document.getElementById('formDesc');
    if (descEl) descEl.textContent = `Editing: ${s.firstName} ${s.lastName} (LRN: ${s.lrn})`;
    const btnSubmit = document.getElementById('btnSubmitForm');
    if (btnSubmit) btnSubmit.innerHTML = '<i class="fas fa-save"></i> Update Student Record';

    closeModal('viewModal');
    navigateTo('add-student');
}

// ======================== DELETE MODAL & EXECUTION ========================

function confirmDelete(id) {
    if (typeof isTeacher === 'function' && isTeacher()) {
        showToast('Teacher account has view-only permissions. Deleting records is strictly prohibited.', 'warning');
        return;
    }

    const s = findStudent(id);
    if (!s) {
        console.warn('Student record not found for delete:', id);
        return;
    }

    // Strictly ask again for admin username and password regardless of who is logged in
    requestAdminAuth(() => {
        proceedConfirmDelete(s);
    }, 'Delete Student Record', `Deleting the permanent official record of ${s.lastName}, ${s.firstName} (LRN: ${s.lrn || 'N/A'}) is an audited administrative operation. Administrator credentials verification is strictly required to proceed.`, true);
}
window.confirmDelete = confirmDelete;
window.realConfirmDelete = confirmDelete;

function proceedConfirmDelete(s) {
    deleteTargetId = s.id;
    window.deleteTargetId = s.id;
    const nameEl = document.getElementById('deleteStudentName');
    if (nameEl) {
        nameEl.textContent = `Are you sure you want to delete the record of ${s.firstName} ${s.lastName} (LRN: ${s.lrn})? This action will remove the student from all tables and cannot be undone.`;
    }
    openModal('deleteModal');
}

function executeConfirmDelete() {
    if (!deleteTargetId) return;

    const target = findStudent(deleteTargetId);
    const targetId = target ? target.id : deleteTargetId;
    const stripped = String(targetId).replace(/^STU-/, '');

    students = students.filter(s => s.id !== targetId && s.id !== stripped && s.id !== ('STU-' + stripped));
    saveStudents();
    if (target) {
        logActivity('Student Deletion', `Permanently deleted record of ${target.lastName}, ${target.firstName} (LRN: ${target.lrn || 'N/A'})`, target);
    }
    deleteTargetId = null;
    window.deleteTargetId = null;

    closeModal('deleteModal');
    closeModal('viewModal');
    refreshAll();
    showToast('Student record deleted successfully.', 'info');
}

// ======================== MODALS & CONTROLS ========================

function initModals() {
    const closeV = document.getElementById('closeViewModal');
    if (closeV) closeV.onclick = () => closeModal('viewModal');

    const closeD = document.getElementById('closeDeleteModal');
    if (closeD) closeD.onclick = () => { deleteTargetId = null;
    window.deleteTargetId = null; closeModal('deleteModal'); };

    const btnEditFromView = document.getElementById('btnEditFromView');
    if (btnEditFromView) {
        btnEditFromView.onclick = () => {
            if (currentViewId) {
                closeModal('viewModal');
                editStudent(currentViewId);
            }
        };
    }

    const btnConfirmDelete = document.getElementById('btnConfirmDelete');
    if (btnConfirmDelete) btnConfirmDelete.onclick = executeConfirmDelete;

    const closeSOA = document.getElementById('closeSOAModal');
    if (closeSOA) closeSOA.onclick = () => closeModal('soaModal');

    const btnPrintSOA = document.getElementById('btnPrintSOA');
    if (btnPrintSOA) btnPrintSOA.onclick = printSOAModal;

    const btnConfirmAdmin = document.getElementById('btnConfirmAdminAuth');
    if (btnConfirmAdmin) btnConfirmAdmin.onclick = executeAdminAuth;

    const closeAdmin = document.getElementById('closeAdminAuthModal');
    if (closeAdmin) closeAdmin.onclick = closeAdminAuthModal;

    const toggleAdminPass = document.getElementById('toggleAdminAuthPassword');
    const adminPassInput = document.getElementById('adminAuthPassword');
    if (toggleAdminPass && adminPassInput) {
        toggleAdminPass.onclick = () => {
            const isPass = adminPassInput.type === 'password';
            adminPassInput.type = isPass ? 'text' : 'password';
            toggleAdminPass.innerHTML = isPass ? '<i class="fas fa-eye-slash"></i>' : '<i class="fas fa-eye"></i>';
        };
    }

    const adminUserInput = document.getElementById('adminAuthUsername');
    if (adminUserInput) {
        adminUserInput.onkeydown = (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (adminPassInput) adminPassInput.focus();
            }
        };
    }
    if (adminPassInput) {
        adminPassInput.onkeydown = (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                executeAdminAuth();
            }
        };
    }

    const btnUpdateSOABottom = document.getElementById('btnUpdateSOABottom');
    if (btnUpdateSOABottom) btnUpdateSOABottom.onclick = toggleSOAEditMode;

    const btnToggleSOAEdit = document.getElementById('btnUpdateSOA') || document.getElementById('btnToggleSOAEdit');
    if (btnToggleSOAEdit) btnToggleSOAEdit.onclick = toggleSOAEditMode;

    const btnPrintProfile = document.getElementById('btnPrintProfile');
    if (btnPrintProfile) {
        btnPrintProfile.onclick = function(e) {
            if (e && e.preventDefault) e.preventDefault();
            printStudentRecord();
        };
    }

    // Overlay click closes modals
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.onclick = (e) => {
            if (e.target === modal) {
                if (modal.id === 'deleteModal') deleteTargetId = null;
    window.deleteTargetId = null;
                closeModal(modal.id);
            }
        };
    });

    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            deleteTargetId = null;
    window.deleteTargetId = null;
            document.querySelectorAll('.modal-overlay.show, .modal-overlay.active').forEach(m => closeModal(m.id));
        }
    });
}

function openModal(id) {
    const m = document.getElementById(id);
    if (!m) return;
    m.classList.add('show', 'active');
    document.body.style.overflow = 'hidden';
}

function closeModal(id) {
    const m = document.getElementById(id);
    if (!m) return;
    m.classList.remove('show', 'active');
    if (!document.querySelector('.modal-overlay.show, .modal-overlay.active')) {
        document.body.style.overflow = '';
    }
}

// ======================== GEOGRAPHIC SELECTORS ========================

function populateRegionSelect(selectEl, selectedVal, placeholder = '-- Select Region --') {
    if (!selectEl || typeof PH_GEO_DATA === 'undefined') return;
    const regions = PH_GEO_DATA.getRegions();
    selectEl.innerHTML = `<option value="">${placeholder}</option>` +
        regions.map(r => {
            const isSel = (r.code === selectedVal || r.name === selectedVal || r.regionName === selectedVal);
            return `<option value="${r.code}" ${isSel ? 'selected' : ''}>${r.name}</option>`;
        }).join('');
    if (selectedVal) {
        const matched = regions.find(r => r.code === selectedVal || r.name === selectedVal || r.regionName === selectedVal);
        if (matched) selectEl.value = matched.code;
    }
}

function populateProvinceSelect(selectEl, regionVal, selectedVal, placeholder = '-- Select Province / City --') {
    if (!selectEl || typeof PH_GEO_DATA === 'undefined') return;

    let provs = [];
    if (regionVal) {
        const provObjs = PH_GEO_DATA.getProvincesOfRegion(regionVal);
        provs = provObjs.map(p => p.name);
    }
    if (provs.length === 0) {
        provs = PH_GEO_DATA.getAllProvinces();
    }

    selectEl.disabled = false;
    selectEl.innerHTML = `<option value="">${placeholder}</option>` +
        provs.map(p => `<option value="${p}" ${p === selectedVal ? 'selected' : ''}>${p}</option>`).join('');
    if (selectedVal) selectEl.value = selectedVal;
}

function populateMunicipalitySelect(muniEl, provVal, selectedVal, placeholder = '-- Select Municipality / City --') {
    if (!muniEl || typeof PH_GEO_DATA === 'undefined') return;
    const munis = provVal ? PH_GEO_DATA.getMunicipalities(provVal) : PH_GEO_DATA.getAllMunicipalities();
    muniEl.disabled = false;
    muniEl.innerHTML = `<option value="">${placeholder}</option>` +
        munis.map(m => `<option value="${m}" ${m === selectedVal ? 'selected' : ''}>${m}</option>`).join('');
    if (selectedVal) muniEl.value = selectedVal;
}

function populateBarangaySelect(brgyEl, muniVal, provVal, selectedVal, placeholder = '-- Select Barangay --') {
    if (!brgyEl || typeof PH_GEO_DATA === 'undefined') return;
    const brgys = muniVal ? PH_GEO_DATA.getBarangays(muniVal, provVal) : [];
    brgyEl.disabled = false;
    brgyEl.innerHTML = `<option value="">${placeholder}</option>` +
        brgys.map(b => `<option value="${b}" ${b === selectedVal ? 'selected' : ''}>${b}</option>`).join('');
    if (selectedVal) brgyEl.value = selectedVal;
}

function updateBirthPlaceHidden() {
    const p = document.getElementById('birthProvince')?.value || '';
    const m = document.getElementById('birthMunicipality')?.value || '';
    const b = document.getElementById('birthBarangay')?.value || '';
    const hidden = document.getElementById('birthPlace');
    if (hidden) {
        const parts = [b, m, p].filter(Boolean);
        hidden.value = parts.join(', ');
    }
}

function updateAddressHidden() {
    const s = document.getElementById('addrStreet')?.value || '';
    const b = document.getElementById('addrBarangay')?.value || '';
    const m = document.getElementById('addrMunicipality')?.value || '';
    const p = document.getElementById('addrProvince')?.value || '';
    const hidden = document.getElementById('address');
    if (hidden) {
        const parts = [s, b, m, p].filter(Boolean);
        hidden.value = parts.join(', ');
    }
}

function initGeoDropdowns() {
    if (typeof PH_GEO_DATA === 'undefined') return;

    const bReg = document.getElementById('birthRegion');
    const bProv = document.getElementById('birthProvince');
    const bMuni = document.getElementById('birthMunicipality');
    const bBrgy = document.getElementById('birthBarangay');

    const aReg = document.getElementById('addrRegion');
    const aProv = document.getElementById('addrProvince');
    const aMuni = document.getElementById('addrMunicipality');
    const aBrgy = document.getElementById('addrBarangay');

    // Initialize with blank '-- Select Region --' prompt without forcing CALABARZON as default
    populateRegionSelect(bReg, '', '-- Select Region --');
    populateProvinceSelect(bProv, '', '', '-- Select Region First --');
    populateMunicipalitySelect(bMuni, '', '', '-- Select Province First --');
    populateBarangaySelect(bBrgy, '', '', '', '-- Select City/Municipality First --');
    updateBirthPlaceHidden();

    populateRegionSelect(aReg, '', '-- Select Region --');
    populateProvinceSelect(aProv, '', '', '-- Select Region First --');
    populateMunicipalitySelect(aMuni, '', '', '-- Select Province First --');
    populateBarangaySelect(aBrgy, '', '', '', '-- Select City/Municipality First --');
    updateAddressHidden();

    // Cascading Listeners for Place of Birth
    if (bReg) {
        bReg.onchange = () => {
            const regVal = bReg.value;
            populateProvinceSelect(bProv, regVal, '', '-- Select Province --');
            populateMunicipalitySelect(bMuni, '', '', '-- Select Province First --');
            populateBarangaySelect(bBrgy, '', '', '', '-- Select Municipality First --');
            updateBirthPlaceHidden();
        };
    }

    if (bProv) {
        bProv.onchange = () => {
            populateMunicipalitySelect(bMuni, bProv.value, '', '-- Select Municipality / City --');
            populateBarangaySelect(bBrgy, '', bProv.value, '', '-- Select Municipality First --');
            updateBirthPlaceHidden();
        };
    }

    if (bMuni) {
        bMuni.onchange = () => {
            const provVal = bProv ? bProv.value : '';
            populateBarangaySelect(bBrgy, bMuni.value, provVal, '', '-- Select Barangay --');
            updateBirthPlaceHidden();
        };
    }

    if (bBrgy) {
        bBrgy.onchange = updateBirthPlaceHidden;
    }

    // Cascading Listeners for Address
    if (aReg) {
        aReg.onchange = () => {
            const regVal = aReg.value;
            populateProvinceSelect(aProv, regVal, '', '-- Select Province --');
            populateMunicipalitySelect(aMuni, '', '', '-- Select Province First --');
            populateBarangaySelect(aBrgy, '', '', '', '-- Select Municipality First --');
            updateAddressHidden();
        };
    }

    if (aProv) {
        aProv.onchange = () => {
            populateMunicipalitySelect(aMuni, aProv.value, '', '-- Select Municipality / City --');
            populateBarangaySelect(aBrgy, '', aProv.value, '', '-- Select Municipality First --');
            updateAddressHidden();
        };
    }

    if (aMuni) {
        aMuni.onchange = () => {
            const provVal = aProv ? aProv.value : '';
            populateBarangaySelect(aBrgy, aMuni.value, provVal, '', '-- Select Barangay --');
            updateAddressHidden();
        };
    }

    if (aBrgy) {
        aBrgy.onchange = updateAddressHidden;
    }
}

function handleBirthRegionChange(val) {
    const bProv = document.getElementById('birthProvince');
    const bMuni = document.getElementById('birthMunicipality');
    const bBrgy = document.getElementById('birthBarangay');
    if (typeof populateProvinceSelect === 'function') {
        populateProvinceSelect(bProv, val, '', '-- Select Province --');
        populateMunicipalitySelect(bMuni, '', '', '-- Select Province First --');
        populateBarangaySelect(bBrgy, '', '', '', '-- Select Municipality First --');
        if (typeof updateBirthPlaceHidden === 'function') updateBirthPlaceHidden();
    }
}

function handleAddrRegionChange(val) {
    const aProv = document.getElementById('addrProvince');
    const aMuni = document.getElementById('addrMunicipality');
    const aBrgy = document.getElementById('addrBarangay');
    if (typeof populateProvinceSelect === 'function') {
        populateProvinceSelect(aProv, val, '', '-- Select Province --');
        populateMunicipalitySelect(aMuni, '', '', '-- Select Province First --');
        populateBarangaySelect(aBrgy, '', '', '', '-- Select Municipality First --');
        if (typeof updateAddressHidden === 'function') updateAddressHidden();
    }
}

function handleReligionChange(val) {
    const container = document.getElementById('religionOtherContainer');
    const input = document.getElementById('religionOther');
    if (!container) return;
    const isOther = (val === 'Other' || val === 'Others' || val === "Other's" || String(val).toLowerCase().startsWith('other'));
    if (isOther) {
        container.style.display = 'block';
        if (input) input.focus();
    } else {
        container.style.display = 'none';
        if (input) input.value = '';
    }
}

function setBirthPlaceValues(region, prov, muni, brgy, raw) {
    if (typeof PH_GEO_DATA === 'undefined') return;

    let rVal = region;
    const pVal = prov || 'Batangas';
    const mVal = muni || 'San Jose';
    const bVal = brgy || 'Poblacion';

    if (!rVal && pVal) {
        const regObj = PH_GEO_DATA.getRegionOfProvince(pVal);
        if (regObj) rVal = regObj.code;
    }
    if (!rVal) rVal = '04';

    populateRegionSelect(document.getElementById('birthRegion'), rVal);
    populateProvinceSelect(document.getElementById('birthProvince'), rVal, pVal);
    populateMunicipalitySelect(document.getElementById('birthMunicipality'), pVal, mVal);
    populateBarangaySelect(document.getElementById('birthBarangay'), mVal, pVal, bVal);

    const rawEl = document.getElementById('birthPlace');
    if (rawEl) rawEl.value = raw || `${bVal}, ${mVal}, ${pVal}`;
}

function setAddressValues(region, prov, muni, brgy, street, raw) {
    if (typeof PH_GEO_DATA === 'undefined') return;

    let rVal = region;
    const pVal = prov || 'Batangas';
    const mVal = muni || 'San Jose';
    const bVal = brgy || 'Poblacion';

    if (!rVal && pVal) {
        const regObj = PH_GEO_DATA.getRegionOfProvince(pVal);
        if (regObj) rVal = regObj.code;
    }
    if (!rVal) rVal = '04';

    populateRegionSelect(document.getElementById('addrRegion'), rVal);
    populateProvinceSelect(document.getElementById('addrProvince'), rVal, pVal);
    populateMunicipalitySelect(document.getElementById('addrMunicipality'), pVal, mVal);
    populateBarangaySelect(document.getElementById('addrBarangay'), mVal, pVal, bVal);

    const streetEl = document.getElementById('addrStreet');
    if (streetEl) streetEl.value = street || '';

    const rawEl = document.getElementById('address');
    if (rawEl) rawEl.value = raw || (street ? `${street}, ${bVal}, ${mVal}, ${pVal}` : `${bVal}, ${mVal}, ${pVal}`);
}

// ======================== PHOTO, DOCUMENT & SIGNATURE UPLOADS ========================

function formatBytes(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function optimizeImage(file, maxWidth, maxHeight, quality, callback) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            let width = img.width;
            let height = img.height;
            if (width > maxWidth || height > maxHeight) {
                if (width / height > maxWidth / maxHeight) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                } else {
                    width = Math.round((width * maxHeight) / height);
                    height = maxHeight;
                }
            }
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            const mime = (file.type === 'image/png') ? 'image/png' : 'image/jpeg';
            const dataUrl = canvas.toDataURL(mime, quality || 0.85);
            callback(dataUrl);
        };
        img.onerror = function() {
            callback(e.target.result);
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function setPhotoPreview(dataUrl) {
    const hidden = document.getElementById('studentPhoto');
    if (hidden) hidden.value = dataUrl;

    const img = document.getElementById('photoPreviewImg');
    const placeholder = document.getElementById('photoPlaceholder');
    const badge = document.getElementById('photoUploadedBadge');
    const viewBtn = document.getElementById('btnPreviewPhoto');
    const removeBtn = document.getElementById('btnRemovePhoto');
    const spinner = document.getElementById('photoLoadingSpinner');
    const indicator = document.getElementById('photoUploadingIndicator');

    if (spinner) spinner.style.display = 'none';
    if (indicator) indicator.style.display = 'none';

    if (img) {
        img.src = dataUrl;
        img.style.display = 'block';
    }
    if (placeholder) placeholder.style.display = 'none';
    if (badge) badge.style.display = 'flex';
    if (viewBtn) viewBtn.style.display = 'inline-flex';
    if (removeBtn) removeBtn.style.display = 'inline-flex';
}

function removeCurrentPhoto(showFeedback = true) {
    const hidden = document.getElementById('studentPhoto');
    const input = document.getElementById('studentPhotoInput');
    const img = document.getElementById('photoPreviewImg');
    const placeholder = document.getElementById('photoPlaceholder');
    const badge = document.getElementById('photoUploadedBadge');
    const viewBtn = document.getElementById('btnPreviewPhoto');
    const removeBtn = document.getElementById('btnRemovePhoto');
    const spinner = document.getElementById('photoLoadingSpinner');
    const indicator = document.getElementById('photoUploadingIndicator');

    if (hidden) hidden.value = '';
    if (input) input.value = '';
    if (img) {
        img.src = '';
        img.style.display = 'none';
    }
    if (placeholder) placeholder.style.display = 'flex';
    if (badge) badge.style.display = 'none';
    if (viewBtn) viewBtn.style.display = 'none';
    if (removeBtn) removeBtn.style.display = 'none';
    if (spinner) spinner.style.display = 'none';
    if (indicator) indicator.style.display = 'none';

    if (showFeedback) showToast('Student photo removed.', 'info');
}

function previewCurrentPhoto() {
    const photo = document.getElementById('studentPhoto')?.value;
    if (!photo) {
        showToast('No photo uploaded to preview.', 'warning');
        return;
    }
    viewDocumentInModal('Student Profile Photo', 'Official Identification Picture', {
        data: photo,
        name: 'student_photo.png',
        type: 'image/png'
    });
}

function initPhotoUpload() {
    const input = document.getElementById('studentPhotoInput');
    const card = document.getElementById('photoUploaderCard');
    const indicator = document.getElementById('photoUploadingIndicator');
    const progressFill = document.getElementById('photoProgressFill');
    const spinner = document.getElementById('photoLoadingSpinner');
    const removeBtn = document.getElementById('btnRemovePhoto');

    function processPhoto(file) {
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            showToast('Please upload an image file (JPG, PNG, WebP).', 'warning');
            return;
        }

        if (spinner) spinner.style.display = 'flex';
        if (indicator) indicator.style.display = 'block';
        if (progressFill) progressFill.style.width = '35%';

        optimizeImage(file, 600, 600, 0.85, function(dataUrl) {
            if (progressFill) progressFill.style.width = '100%';
            setTimeout(() => {
                if (spinner) spinner.style.display = 'none';
                if (indicator) indicator.style.display = 'none';
                if (progressFill) progressFill.style.width = '0%';
                setPhotoPreview(dataUrl);
                showToast('Student photo uploaded successfully!', 'success');
            }, 250);
        });
    }

    if (input) {
        input.onchange = function(e) {
            const file = e.target.files[0];
            if (file) processPhoto(file);
        };
    }

    if (card) {
        card.ondragover = function(e) {
            e.preventDefault();
            card.classList.add('drag-active');
        };
        card.ondragleave = function(e) {
            e.preventDefault();
            card.classList.remove('drag-active');
        };
        card.ondrop = function(e) {
            e.preventDefault();
            card.classList.remove('drag-active');
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                processPhoto(e.dataTransfer.files[0]);
            }
        };
    }

    if (removeBtn) {
        removeBtn.onclick = function() {
            removeCurrentPhoto(true);
        };
    }
}

function setDocCardState(type, doc) {
    const dataEl = document.getElementById(`${type}DocData`);
    const nameEl = document.getElementById(`${type}DocName`);
    const typeEl = document.getElementById(`${type}DocType`);
    const sizeEl = document.getElementById(`${type}DocSize`);
    const dateEl = document.getElementById(`${type}DocDate`);

    if (dataEl) dataEl.value = doc.data || '';
    if (nameEl) nameEl.value = doc.name || 'Document.pdf';
    if (typeEl) typeEl.value = doc.type || 'application/pdf';
    if (sizeEl) sizeEl.value = doc.size || 'Attached';
    if (dateEl) dateEl.value = doc.date || '';

    const dropzone = document.getElementById(`${type}Dropzone`);
    const fileCard = document.getElementById(`${type}FileCard`);
    const fileNameDisplay = document.getElementById(`${type}FileNameDisplay`);
    const fileSizeDisplay = document.getElementById(`${type}FileSizeDisplay`);
    const uploadTimeDisplay = document.getElementById(`${type}UploadTimeDisplay`);
    const iconDisplay = document.getElementById(`${type}IconDisplay`);

    if (dropzone) dropzone.style.display = 'none';
    if (fileCard) fileCard.style.display = 'block';
    if (fileNameDisplay) fileNameDisplay.textContent = doc.name || 'Document on file';
    if (fileSizeDisplay) fileSizeDisplay.textContent = doc.size || 'Attached';
    if (uploadTimeDisplay) uploadTimeDisplay.textContent = doc.date ? ('Uploaded ' + formatDate(doc.date)) : 'On File';

    if (iconDisplay) {
        const isPdf = (doc.type && doc.type.includes('pdf')) || (doc.name && doc.name.toLowerCase().endsWith('.pdf'));
        iconDisplay.className = isPdf ? 'fas fa-file-pdf' : 'fas fa-file-image';
        iconDisplay.style.color = isPdf ? '#ef4444' : '#3b82f6';
    }
}

function removeCurrentDoc(type, showFeedback = true) {
    const dataEl = document.getElementById(`${type}DocData`);
    const nameEl = document.getElementById(`${type}DocName`);
    const typeEl = document.getElementById(`${type}DocType`);
    const sizeEl = document.getElementById(`${type}DocSize`);
    const dateEl = document.getElementById(`${type}DocDate`);
    const fileInput = document.getElementById(`${type}FileInput`);

    if (dataEl) dataEl.value = '';
    if (nameEl) nameEl.value = '';
    if (typeEl) typeEl.value = '';
    if (sizeEl) sizeEl.value = '';
    if (dateEl) dateEl.value = '';
    if (fileInput) fileInput.value = '';

    const dropzone = document.getElementById(`${type}Dropzone`);
    const fileCard = document.getElementById(`${type}FileCard`);
    const indicator = document.getElementById(`${type}UploadingIndicator`);

    if (dropzone) dropzone.style.display = 'block';
    if (fileCard) fileCard.style.display = 'none';
    if (indicator) indicator.style.display = 'none';

    if (showFeedback) showToast('Document removed.', 'info');
}

function previewCurrentDoc(type) {
    const data = document.getElementById(`${type}DocData`)?.value;
    const name = document.getElementById(`${type}DocName`)?.value || 'Document';
    const docType = document.getElementById(`${type}DocType`)?.value || 'application/pdf';

    if (!data) {
        showToast('No document file attached.', 'warning');
        return;
    }

    const titles = {
        birthCert: 'PSA / NSO Birth Certificate',
        tor: 'Transcript of Records (SF10 / Form 137)',
        card: 'Student Report Card (SF9 / Form 138)'
    };

    viewDocumentInModal(titles[type] || 'Document Preview', name, {
        data: data,
        name: name,
        type: docType
    });
}

function initDocUploads() {
    ['birthCert', 'tor', 'card'].forEach(type => {
        const fileInput = document.getElementById(`${type}FileInput`);
        const dropzone = document.getElementById(`${type}Dropzone`);
        const indicator = document.getElementById(`${type}UploadingIndicator`);
        const progressFill = document.getElementById(`${type}ProgressFill`);

        function processFile(file) {
            if (!file) return;

            const isImage = file.type.startsWith('image/');
            const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

            if (!isImage && !isPdf) {
                showToast('Please upload a PDF document or scanned image (JPG, PNG).', 'warning');
                return;
            }

            if (indicator) indicator.style.display = 'block';
            if (progressFill) progressFill.style.width = '30%';

            if (isImage) {
                optimizeImage(file, 1600, 1600, 0.85, function(dataUrl) {
                    if (progressFill) progressFill.style.width = '100%';
                    setTimeout(() => {
                        if (indicator) indicator.style.display = 'none';
                        if (progressFill) progressFill.style.width = '0%';
                        setDocCardState(type, {
                            data: dataUrl,
                            name: file.name,
                            type: file.type || 'image/jpeg',
                            size: formatBytes(file.size),
                            date: new Date().toISOString()
                        });
                        showToast(`${file.name} uploaded successfully!`, 'success');
                    }, 250);
                });
            } else {
                const reader = new FileReader();
                reader.onload = function(e) {
                    if (progressFill) progressFill.style.width = '100%';
                    setTimeout(() => {
                        if (indicator) indicator.style.display = 'none';
                        if (progressFill) progressFill.style.width = '0%';
                        setDocCardState(type, {
                            data: e.target.result,
                            name: file.name,
                            type: 'application/pdf',
                            size: formatBytes(file.size),
                            date: new Date().toISOString()
                        });
                        showToast(`${file.name} uploaded successfully!`, 'success');
                    }, 250);
                };
                reader.readAsDataURL(file);
            }
        }

        if (fileInput) {
            fileInput.onchange = function(e) {
                const file = e.target.files[0];
                if (file) processFile(file);
            };
        }

        if (dropzone) {
            dropzone.ondragover = function(e) {
                e.preventDefault();
                dropzone.classList.add('drag-active');
            };
            dropzone.ondragleave = function(e) {
                e.preventDefault();
                dropzone.classList.remove('drag-active');
            };
            dropzone.ondrop = function(e) {
                e.preventDefault();
                dropzone.classList.remove('drag-active');
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    processFile(e.dataTransfer.files[0]);
                }
            };
        }
    });
}

// Student E-Signature Drawing & Upload
let isDrawingSig = false;
let sigHasStrokes = false;

function setSignatureState(dataUrl) {
    const hidden = document.getElementById('studentSignature');
    if (hidden) hidden.value = dataUrl;

    const canvas = document.getElementById('signaturePad');
    const prompt = document.getElementById('sigPrompt');
    const viewBtn = document.getElementById('btnViewSig');
    const removeBtn = document.getElementById('btnRemoveSig');
    const badge = document.getElementById('sigUploadedBadge');
    const statusTag = document.getElementById('sigStatusTag');

    if (prompt) prompt.style.display = 'none';
    if (viewBtn) viewBtn.style.display = 'inline-flex';
    if (removeBtn) removeBtn.style.display = 'inline-flex';
    if (badge) badge.style.display = 'flex';
    if (statusTag) statusTag.innerHTML = '<i class="fas fa-check-circle" style="color:#16a34a;"></i> Signature on record';

    if (canvas && dataUrl) {
        const ctx = canvas.getContext('2d');
        const img = new Image();
        img.onload = function() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const scale = Math.min((canvas.width - 20) / img.width, (canvas.height - 20) / img.height, 1);
            const w = img.width * scale;
            const h = img.height * scale;
            const x = (canvas.width - w) / 2;
            const y = (canvas.height - h) / 2;
            ctx.drawImage(img, x, y, w, h);
            sigHasStrokes = true;
        };
        img.src = dataUrl;
    }
}

function clearSignaturePad(showFeedback = true) {
    const canvas = document.getElementById('signaturePad');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    sigHasStrokes = false;

    const hidden = document.getElementById('studentSignature');
    if (hidden) hidden.value = '';

    const sigInput = document.getElementById('sigImgFileInput');
    if (sigInput) sigInput.value = '';

    const prompt = document.getElementById('sigPrompt');
    if (prompt) prompt.style.display = 'flex';

    const viewBtn = document.getElementById('btnViewSig');
    if (viewBtn) viewBtn.style.display = 'none';

    const removeBtn = document.getElementById('btnRemoveSig');
    if (removeBtn) removeBtn.style.display = 'none';

    const badge = document.getElementById('sigUploadedBadge');
    if (badge) badge.style.display = 'none';

    const statusTag = document.getElementById('sigStatusTag');
    if (statusTag) statusTag.innerHTML = '<i class="fas fa-pen"></i> No signature yet';

    if (showFeedback) showToast('Signature cleared.', 'info');
}

function removeCurrentSig() {
    clearSignaturePad(true);
}

function previewCurrentSig() {
    const sig = document.getElementById('studentSignature')?.value;
    if (!sig) {
        showToast('No signature to preview.', 'warning');
        return;
    }
    viewDocumentInModal('Student E-Signature', 'Digital Signature Record', {
        data: sig,
        name: 'student_signature.png',
        type: 'image/png'
    });
}

function initSignaturePad() {
    const canvas = document.getElementById('signaturePad');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    function getPos(e) {
        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY
        };
    }

    function startDrawing(e) {
        if (e.touches) e.preventDefault();
        isDrawingSig = true;
        const pos = getPos(e);
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = '#0f172a';
    }

    function draw(e) {
        if (!isDrawingSig) return;
        if (e.touches) e.preventDefault();
        const pos = getPos(e);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();

        if (!sigHasStrokes) {
            sigHasStrokes = true;
            const prompt = document.getElementById('sigPrompt');
            if (prompt) prompt.style.display = 'none';
            const viewBtn = document.getElementById('btnViewSig');
            if (viewBtn) viewBtn.style.display = 'inline-flex';
            const removeBtn = document.getElementById('btnRemoveSig');
            if (removeBtn) removeBtn.style.display = 'inline-flex';
            const statusTag = document.getElementById('sigStatusTag');
            if (statusTag) statusTag.innerHTML = '<i class="fas fa-check-circle" style="color:#16a34a;"></i> Signature captured';
        }
    }

    function stopDrawing(e) {
        if (!isDrawingSig) return;
        isDrawingSig = false;
        const hidden = document.getElementById('studentSignature');
        if (hidden && sigHasStrokes) {
            hidden.value = canvas.toDataURL('image/png');
        }
    }

    canvas.onmousedown = startDrawing;
    canvas.onmousemove = draw;
    canvas.onmouseup = stopDrawing;
    canvas.onmouseleave = stopDrawing;

    canvas.addEventListener('touchstart', startDrawing, { passive: false });
    canvas.addEventListener('touchmove', draw, { passive: false });
    canvas.addEventListener('touchend', stopDrawing, { passive: false });

    const sigInput = document.getElementById('sigImgFileInput');
    if (sigInput) {
        sigInput.onchange = function(e) {
            const file = e.target.files[0];
            if (!file) return;
            if (!file.type.startsWith('image/')) {
                showToast('Please upload a valid image file for the signature.', 'warning');
                return;
            }

            const indicator = document.getElementById('sigUploadingIndicator');
            const progressFill = document.getElementById('sigProgressFill');
            if (indicator) indicator.style.display = 'block';
            if (progressFill) progressFill.style.width = '30%';

            optimizeImage(file, 600, 250, 0.9, function(dataUrl) {
                if (progressFill) progressFill.style.width = '100%';
                setTimeout(() => {
                    if (indicator) indicator.style.display = 'none';
                    if (progressFill) progressFill.style.width = '0%';
                    setSignatureState(dataUrl);
                    showToast('Signature image uploaded successfully.', 'success');
                }, 200);
            });
        };
    }
}

// ======================== FORM SUBMISSION ========================

function initForm() {
    initPhotoUpload();
    initDocUploads();
    initSignaturePad();

    const form = document.getElementById('studentForm');
    if (!form) return;

    const dobInput = document.getElementById('dateOfBirth');
    if (dobInput) {
        dobInput.addEventListener('change', () => {
            const dob = new Date(dobInput.value);
            if (!isNaN(dob)) {
                const today = new Date();
                let age = today.getFullYear() - dob.getFullYear();
                const m = today.getMonth() - dob.getMonth();
                if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
                const ageInput = document.getElementById('age');
                if (ageInput) ageInput.value = Math.max(0, age);
            }
        });
    }

    const discSelect = document.getElementById('isDiscounted');
    if (discSelect) {
        discSelect.addEventListener('change', () => {
            const group = document.getElementById('discountAmountGroup');
            if (group) group.style.display = (discSelect.value === 'YES') ? 'block' : 'none';
        });
    }

    const escSelect = document.getElementById('escGrantee');
    if (escSelect) {
        escSelect.addEventListener('change', () => {
            const isEsc = (escSelect.value === 'YES');
            const escGroup = document.getElementById('escNumberGroup');
            if (escGroup) escGroup.style.display = isEsc ? 'block' : 'none';

            if (isEsc) {
                if (discSelect) discSelect.value = 'YES';
                const group = document.getElementById('discountAmountGroup');
                if (group) group.style.display = 'block';
                const discAmtInput = document.getElementById('discountAmount');
                if (discAmtInput && (!discAmtInput.value || Number(discAmtInput.value) === 0)) {
                    discAmtInput.value = 9000;
                }
            }
        });
    }

    form.onsubmit = (e) => {
        e.preventDefault();
        const lrnEl = document.getElementById('lrn');
        const lrnVal = (lrnEl ? lrnEl.value : '').trim();
        const lastName = (document.getElementById('lastName')?.value || '').trim();
        const firstName = (document.getElementById('firstName')?.value || '').trim();
        const gradeLevel = document.getElementById('gradeLevel')?.value || '7';
        const section = (document.getElementById('section')?.value || (GRADE_SECTIONS[document.getElementById('gradeLevel')?.value] || 'Jade')).trim();

        if (!lrnVal || !lastName || !firstName) {
            showToast('Please fill out LRN, Last Name, and First Name.', 'error');
            return;
        }

        const editId = document.getElementById('editStudentId')?.value;
        if (editId) {
            const index = students.findIndex(s => s.id === editId);
            if (index !== -1) {
                const prev = students[index];
                const formData = collectFormData();
                if (prev.isJhsFinisher && !formData.isJhsFinisher && String(formData.gradeLevel) === '10' && ['graduated', 'completed', 'alumni'].includes((formData.enrollmentStatus || '').toLowerCase())) {
                    formData.isJhsFinisher = true;
                    formData.completionSchoolYear = prev.completionSchoolYear || formData.schoolYear;
                }
                const updated = { ...prev, ...formData, id: editId, dateModified: new Date().toISOString() };
                students[index] = updated;
                saveStudents();
                showToast('Student record updated successfully!', 'success');
            }
        } else {
            const newStudent = { ...collectFormData(), id: generateId(), dateCreated: new Date().toISOString(), dateModified: new Date().toISOString() };
            students.unshift(newStudent);
            saveStudents();
            showToast(`Student ${newStudent.firstName} ${newStudent.lastName} enrolled successfully! Generated dedicated Mobile QR Pass.`, 'success');
            resetForm();
            refreshAll();
            navigateTo('students');
            setTimeout(() => {
                openLearnerMobilePass(newStudent.id);
            }, 300);
            return;
        }

        resetForm();
        refreshAll();
        navigateTo('students');
    };
}

function collectFormData() {
    const getV = (id) => (document.getElementById(id)?.value || '').trim();
    const addrP = getV('addrProvince') || 'Batangas';
    const addrM = getV('addrMunicipality') || 'San Jose';
    const addrB = getV('addrBarangay') || 'Poblacion';
    const addrS = getV('addrStreet');
    const fullAddr = addrS ? `${addrS}, ${addrB}, ${addrM}, ${addrP}` : `${addrB}, ${addrM}, ${addrP}`;

    const birthP = getV('birthProvince') || 'Batangas';
    const birthM = getV('birthMunicipality') || 'San Jose';
    const birthB = getV('birthBarangay') || 'Poblacion';
    const fullBirth = `${birthB}, ${birthM}, ${birthP}`;

    const birthR = getV('birthRegion') || '04';
    const addrR = getV('addrRegion') || '04';

    const relVal = getV('religion');
    const relOther = getV('religionOther');
    const finalRel = (relVal === 'Other' && relOther) ? relOther : (relVal || 'Roman Catholic');

    const tuition = Number(getV('tuitionFee')) || DEFAULT_BASE_TUITION;
    const isDisc = getV('isDiscounted') || 'NO';
    const discAmt = isDisc === 'YES' ? (Number(getV('discountAmount')) || 0) : 0;
    const net = Math.max(0, tuition - discAmt);

    const photo = document.getElementById('studentPhoto')?.value || '';
    const signature = document.getElementById('studentSignature')?.value || '';

    const bcData = document.getElementById('birthCertDocData')?.value;
    const birthCertDoc = bcData ? {
        data: bcData,
        name: document.getElementById('birthCertDocName')?.value || 'BirthCertificate.pdf',
        type: document.getElementById('birthCertDocType')?.value || 'application/pdf',
        size: document.getElementById('birthCertDocSize')?.value || 'Attached',
        date: document.getElementById('birthCertDocDate')?.value || new Date().toISOString()
    } : null;

    const torData = document.getElementById('torDocData')?.value;
    const torDoc = torData ? {
        data: torData,
        name: document.getElementById('torDocName')?.value || 'TranscriptOfRecords.pdf',
        type: document.getElementById('torDocType')?.value || 'application/pdf',
        size: document.getElementById('torDocSize')?.value || 'Attached',
        date: document.getElementById('torDocDate')?.value || new Date().toISOString()
    } : null;

    const cardData = document.getElementById('cardDocData')?.value;
    const studentCardDoc = cardData ? {
        data: cardData,
        name: document.getElementById('cardDocName')?.value || 'ReportCard.pdf',
        type: document.getElementById('cardDocType')?.value || 'application/pdf',
        size: document.getElementById('cardDocSize')?.value || 'Attached',
        date: document.getElementById('cardDocDate')?.value || new Date().toISOString()
    } : null;

    const enrolledGrade = getV('gradeLevel') || '7';
    const statusVal = getV('enrollmentStatus') || 'Active';
    const finisherCheck = document.getElementById('isJhsFinisher')?.checked;
    const isG10 = String(enrolledGrade) === '10';
    const isCompletedStatus = ['completed', 'graduated', 'alumni'].includes(statusVal.toLowerCase());
    const isFinisher = isG10 && (finisherCheck || isCompletedStatus);

    const formSy = (() => {
        let syVal = getV('formSchoolYear');
        if (syVal === '__custom__' || syVal === 'custom') {
            const cVal = (getV('customSchoolYear') || '').trim();
            if (cVal) {
                registerCustomSchoolYear(cVal);
                return cVal;
            }
            return currentSchoolYear || '2026-2027';
        }
        return syVal || currentSchoolYear || '2026-2027';
    })();

    return {
        lrn: getV('lrn'),
        schoolYear: formSy,
        escGrantee: getV('escGrantee') || 'NO',
        escNumber: getV('escNumber'),
        lastName: getV('lastName'),
        firstName: getV('firstName'),
        middleName: getV('middleName'),
        suffix: getV('suffix'),
        gradeLevel: getV('gradeLevel') || '7',
        section: getV('section') || (GRADE_SECTIONS[getV('gradeLevel')] || 'Jade'),
        gender: getV('gender') || 'Male',
        dateOfBirth: getV('dateOfBirth'),
        age: getV('age'),
        birthRegion: birthR,
        birthProvince: birthP,
        birthMunicipality: birthM,
        birthBarangay: birthB,
        birthPlace: fullBirth,
        religion: finalRel,
        motherTongue: getV('motherTongue') || 'Tagalog',
        enrollmentStatus: getV('enrollmentStatus') || 'Active',
        addressRegion: addrR,
        addressProvince: addrP,
        addressMunicipality: addrM,
        addressBarangay: addrB,
        addressStreet: addrS,
        address: fullAddr,
        contactNumber: getV('contactNumber'),
        email: getV('email'),
        fatherName: getV('fatherName'),
        fatherOccupation: getV('fatherOccupation'),
        fatherContact: getV('fatherContact'),
        motherName: getV('motherName'),
        motherOccupation: getV('motherOccupation'),
        motherContact: getV('motherContact'),
        guardianName: getV('guardianName'),
        guardianRelationship: getV('guardianRelationship'),
        guardianContact: getV('guardianContact'),
        emergencyName: getV('emergencyName'),
        emergencyRelation: getV('emergencyRelation') || 'Parent / Guardian',
        emergencyContact: getV('emergencyContact'),
        previousSchool: getV('previousSchool'),
        previousSchoolAddress: getV('previousSchoolAddress'),
        remarks: getV('remarks'),
        tuitionFee: tuition,
        isDiscounted: isDisc,
        discountAmount: discAmt,
        remainingBalance: net,
        totalPaid: 0,
        payments: [],
        photo: photo,
        signature: signature,
        birthCertDoc: birthCertDoc,
        torDoc: torDoc,
        studentCardDoc: studentCardDoc,
        isJhsFinisher: isFinisher,
        completionSchoolYear: isFinisher ? formSy : undefined
    };
}

function resetForm() {
    const form = document.getElementById('studentForm');
    if (form) form.reset();
    const editId = document.getElementById('editStudentId');
    if (editId) editId.value = '';
    const ageEl = document.getElementById('age');
    if (ageEl) ageEl.value = '';
    const titleEl = document.getElementById('formTitle');
    if (titleEl) titleEl.textContent = 'Enroll New Student';
    const descEl = document.getElementById('formDesc');
    if (descEl) descEl.textContent = 'Fill out all required fields to register a new student.';
    const btnSubmit = document.getElementById('btnSubmitForm');
    if (btnSubmit) btnSubmit.innerHTML = '<i class="fas fa-save"></i> Save Student Record';

    const formSy = document.getElementById('formSchoolYear');
    if (formSy) formSy.value = currentSchoolYear || '2026-2027';

    const finisherGroup = document.getElementById('jhsFinisherGroup');
    const finisherCheck = document.getElementById('isJhsFinisher');
    if (finisherGroup) finisherGroup.style.display = 'none';
    if (finisherCheck) finisherCheck.checked = false;

    removeCurrentPhoto(false);
    removeCurrentDoc('birthCert', false);
    removeCurrentDoc('tor', false);
    removeCurrentDoc('card', false);
    clearSignaturePad(false);

    const relOtherContainer = document.getElementById('religionOtherContainer');
    const relOtherInput = document.getElementById('religionOther');
    if (relOtherContainer) relOtherContainer.style.display = 'none';
    if (relOtherInput) relOtherInput.value = '';

    initGeoDropdowns();
}

// ======================== FILTERS & EXPORT/IMPORT ========================

function initFilters() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.oninput = () => { currentPage = 1; refreshStudentsTable(); };

    const filterSY = document.getElementById('filterSchoolYear');
    if (filterSY) {
        filterSY.onchange = () => {
            currentSchoolYear = filterSY.value;
            setGlobalSchoolYear(filterSY.value, false);
        };
    }

    const filterGrade = document.getElementById('filterGrade');
    if (filterGrade) filterGrade.onchange = () => { currentPage = 1; refreshStudentsTable(); };

    const filterSec = document.getElementById('filterSection');
    if (filterSec) filterSec.onchange = () => { currentPage = 1; refreshStudentsTable(); };

    const filterGen = document.getElementById('filterGender');
    if (filterGen) filterGen.onchange = () => { currentPage = 1; refreshStudentsTable(); };

    const filterStat = document.getElementById('filterStatus');
    if (filterStat) filterStat.onchange = () => { currentPage = 1; refreshStudentsTable(); };

    const filterEsc = document.getElementById('filterEsc');
    if (filterEsc) filterEsc.onchange = () => { currentPage = 1; refreshStudentsTable(); };

    const filterProv = document.getElementById('filterProvince');
    if (filterProv) filterProv.onchange = () => { currentPage = 1; refreshStudentsTable(); };

    const filterMuni = document.getElementById('filterMunicipality');
    if (filterMuni) filterMuni.onchange = () => { currentPage = 1; refreshStudentsTable(); };

    // Initialize clickable sorting on table headers
    initTableSorting();

    const actSearch = document.getElementById('activitySearchInput');
    const actCat = document.getElementById('activityFilterCategory');
    const actAcc = document.getElementById('activityFilterAccount');
    const actDate = document.getElementById('activityFilterDate');
    if (actSearch) actSearch.oninput = refreshActivitiesPage;
    if (actCat) actCat.onchange = refreshActivitiesPage;
    if (actAcc) actAcc.onchange = refreshActivitiesPage;
    if (actDate) actDate.onchange = refreshActivitiesPage;

    const clearBtn = document.getElementById('btnClearFilters');
    if (clearBtn) {
        clearBtn.onclick = () => {
            if (searchInput) searchInput.value = '';
            if (filterGrade) filterGrade.value = '';
            if (filterSec) filterSec.value = '';
            if (filterGen) filterGen.value = '';
            if (filterStat) filterStat.value = '';
            if (filterEsc) filterEsc.value = '';
            if (filterProv) filterProv.value = '';
            if (filterMuni) filterMuni.value = '';
            sortField = 'lastName';
            sortDir = 'asc';
            currentPage = 1;
            refreshStudentsTable();
        };
    }

    document.querySelectorAll('.grade-search').forEach(input => {
        input.oninput = () => refreshGradeTable(input.dataset.grade);
    });

    document.querySelectorAll('.grade-section-filter').forEach(select => {
        select.onchange = () => refreshGradeTable(select.dataset.grade);
    });

    document.querySelectorAll('.grade-sy-filter').forEach(select => {
        select.onchange = () => refreshGradeTable(select.dataset.grade);
    });

    const dashSY = document.getElementById('dashboardSchoolYear');
    if (dashSY) {
        dashSY.onchange = () => setGlobalSchoolYear(dashSY.value, false);
    }
}

// ======================== GLOBAL BUTTON UTILITIES & RECOVERY ========================

function navigateToDashboardFromLogo() {
    navigateTo('dashboard');
}
window.navigateToDashboardFromLogo = navigateToDashboardFromLogo;

function cancelEdit() {
    resetForm();
    navigateTo('students');
    showToast('Editing cancelled.', 'info');
}
window.cancelEdit = cancelEdit;

function clearAllFilters() {
    const searchInput = document.getElementById('searchInput');
    const filterGrade = document.getElementById('filterGrade');
    const filterSec = document.getElementById('filterSection');
    const filterGen = document.getElementById('filterGender');
    const filterStat = document.getElementById('filterStatus');
    const filterEsc = document.getElementById('filterEsc');
    const filterProv = document.getElementById('filterProvince');
    const filterMuni = document.getElementById('filterMunicipality');

    if (searchInput) searchInput.value = '';
    if (filterGrade) filterGrade.value = '';
    if (filterSec) filterSec.value = '';
    if (filterGen) filterGen.value = '';
    if (filterStat) filterStat.value = '';
    if (filterEsc) filterEsc.value = '';
    if (filterProv) filterProv.value = '';
    if (filterMuni) filterMuni.value = '';
    sortField = 'lastName';
    sortDir = 'asc';
    currentPage = 1;
    refreshStudentsTable();
    showToast('All filters have been reset.', 'info');
}
window.clearAllFilters = clearAllFilters;

function toggleLoginPassword() {
    const pEl = document.getElementById('loginPassword');
    const btn = document.getElementById('togglePassword');
    if (!pEl) return;
    const isPass = pEl.type === 'password';
    pEl.type = isPass ? 'text' : 'password';
    if (btn) btn.innerHTML = isPass ? '<i class="fas fa-eye-slash"></i>' : '<i class="fas fa-eye"></i>';
}
window.toggleLoginPassword = toggleLoginPassword;

function toggleAdminPassVisibility() {
    const pEl = document.getElementById('adminAuthPassword');
    const btn = document.getElementById('toggleAdminAuthPassword');
    if (!pEl) return;
    const isPass = pEl.type === 'password';
    pEl.type = isPass ? 'text' : 'password';
    if (btn) btn.innerHTML = isPass ? '<i class="fas fa-eye-slash"></i>' : '<i class="fas fa-eye"></i>';
}
window.toggleAdminPassVisibility = toggleAdminPassVisibility;

// ======================== PAYMENT INSTALLMENT MODAL WORKFLOW ========================

function showAddPaymentModal() {
    const s = findStudent(currentSOAStudentId);
    if (!s) {
        showToast('Please select a student Statement of Account first.', 'warning');
        return;
    }

    const nameEl = document.getElementById('payModalStudentName');
    if (nameEl) nameEl.textContent = `${s.lastName}, ${s.firstName} ${s.middleName || ''}`;
    const lrnEl = document.getElementById('payModalStudentLRN');
    if (lrnEl) lrnEl.textContent = s.lrn;

    const dateInput = document.getElementById('payDate');
    if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];

    const orInput = document.getElementById('payOrNumber');
    if (orInput) orInput.value = 'OR-' + Math.floor(1000 + Math.random() * 9000);

    const amtInput = document.getElementById('payAmount');
    if (amtInput) amtInput.value = '';

    const termInput = document.getElementById('payTerm');
    if (termInput) termInput.value = '1st Monthly Installment';

    openModal('addPaymentModal');
}
window.showAddPaymentModal = showAddPaymentModal;

function submitInstallmentPayment() {
    const s = findStudent(currentSOAStudentId);
    if (!s) return;

    const dateVal = document.getElementById('payDate')?.value || new Date().toISOString().split('T')[0];
    const orVal = (document.getElementById('payOrNumber')?.value || '').trim();
    const amtVal = Number(document.getElementById('payAmount')?.value) || 0;
    const termVal = document.getElementById('payTerm')?.value || 'Installment';

    if (!amtVal || amtVal <= 0) {
        showToast('Please enter a valid payment amount greater than zero.', 'error');
        return;
    }

    if (!Array.isArray(s.payments)) s.payments = [];
    const newPayment = {
        id: 'PAY-' + Date.now(),
        term: termVal,
        orNumber: orVal || ('OR-' + Math.floor(1000 + Math.random() * 9000)),
        date: dateVal,
        amount: amtVal,
        notes: `Payment for S.Y. ${s.schoolYear || '2026-2027'}`
    };
    s.payments.push(newPayment);

    updateSOALiveTotals(s);
    saveStudents();
    logActivity('Statement of Account', `Recorded payment installment: ${termVal} (\u20B1${amtVal.toLocaleString('en-PH', { minimumFractionDigits: 2 })})`, s);

    closeModal('addPaymentModal');
    if (currentSOAMode === 'edit') {
        renderSOAEditRows(s);
    } else {
        openSOAModal(s.id);
    }
    refreshSOAPage();
    showToast('Payment recorded successfully!', 'success');
}
window.submitInstallmentPayment = submitInstallmentPayment;

// ======================== AUDIT LOGS & CURRENT ACTIVITIES ENGINE ========================

const ACTIVITIES_KEY = 'mdsj_activities';

function getActivities() {
    try {
        const stored = localStorage.getItem(ACTIVITIES_KEY);
        if (stored !== null && stored !== undefined) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) return parsed;
        }
    } catch (e) {}
    return [];
}

function clearActivities() {
    try {
        localStorage.setItem(ACTIVITIES_KEY, JSON.stringify([]));
    } catch (e) {}
    refreshActivitiesPage();
    showToast('Current activities cleared successfully.', 'info');
}
window.clearActivities = clearActivities;

function confirmClearActivities() {
    // Only Administrator accounts can clear history
    requestAdminAuth(() => {
        if (confirm('Are you sure you want to permanently clear all Current Activities logs? This action cannot be undone.')) {
            clearActivities();
        }
    }, 'Clear Activity History', 'Clearing audit and activity history logs is restricted to School Administrators. Administrator verification is required to proceed.', true);
}
window.confirmClearActivities = confirmClearActivities;

function logActivity(category, actionDesc, student = null) {
    const user = getCurrentUser() || { username: 'admin', role: 'School President' };
    const activities = getActivities();
    const newAct = {
        id: 'ACT-' + Date.now(),
        timestamp: new Date().toISOString(),
        account: user.username || 'admin',
        role: user.role || 'Administrator',
        category: category || 'System Event',
        targetName: student ? `${student.lastName}, ${student.firstName}` : 'System',
        lrn: student ? student.lrn : '\u2014',
        studentId: student ? student.id : '',
        details: actionDesc
    };
    activities.unshift(newAct);
    if (activities.length > 250) activities.pop();
    try { localStorage.setItem(ACTIVITIES_KEY, JSON.stringify(activities)); } catch (e) {}

    const actPage = document.getElementById('page-activities');
    if (actPage && actPage.classList.contains('active')) {
        refreshActivitiesPage();
    }
}
window.logActivity = logActivity;

function refreshActivitiesPage(silent = false) {
    const tbody = document.getElementById('activitiesTableBody');
    if (!tbody) return;

    // Reset filters to default view on refresh
    const searchInput = document.getElementById('activitySearchInput');
    const filterCat = document.getElementById('activityFilterCategory');
    const filterAcc = document.getElementById('activityFilterAccount');
    const filterDate = document.getElementById('activityFilterDate');
    if (!silent) {
        if (searchInput && searchInput.value) searchInput.value = '';
        if (filterCat) filterCat.value = 'ALL';
        if (filterAcc) filterAcc.value = 'ALL';
        if (filterDate) filterDate.value = 'ALL';
    }

    let acts = getActivities();

    const search = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const cat = filterCat ? filterCat.value : 'ALL';
    const acc = filterAcc ? filterAcc.value : 'ALL';
    const dateRange = filterDate ? filterDate.value : 'ALL';

    const statTotal = document.getElementById('statTotalActivities');
    const statProfile = document.getElementById('statProfileUpdates');
    const statFinancial = document.getElementById('statFinancialActivities');
    const statAccounts = document.getElementById('statActiveAccounts');

    if (statTotal) statTotal.textContent = acts.length;
    if (statProfile) statProfile.textContent = acts.filter(a => a.category === 'Learner Profile' || a.category === 'Enrollment').length;
    if (statFinancial) statFinancial.textContent = acts.filter(a => a.category === 'Statement of Account').length;
    if (statAccounts) statAccounts.textContent = '2';

    if (cat !== 'ALL') acts = acts.filter(a => a.category === cat);
    if (acc !== 'ALL') acts = acts.filter(a => (a.account || '').toLowerCase() === acc.toLowerCase());
    if (search) {
        acts = acts.filter(a =>
            (a.targetName || '').toLowerCase().includes(search) ||
            String(a.lrn || '').includes(search) ||
            (a.details || '').toLowerCase().includes(search) ||
            (a.account || '').toLowerCase().includes(search)
        );
    }
    if (dateRange !== 'ALL') {
        const now = Date.now();
        const oneDay = 86400000;
        if (dateRange === 'today') acts = acts.filter(a => (now - new Date(a.timestamp).getTime()) <= oneDay);
        else if (dateRange === 'week') acts = acts.filter(a => (now - new Date(a.timestamp).getTime()) <= (7 * oneDay));
        else if (dateRange === 'month') acts = acts.filter(a => (now - new Date(a.timestamp).getTime()) <= (30 * oneDay));
    }

    const emptyState = document.getElementById('activitiesEmptyState');
    if (acts.length === 0) {
        tbody.innerHTML = '';
        if (emptyState) emptyState.style.display = 'block';
    } else {
        if (emptyState) emptyState.style.display = 'none';
        tbody.innerHTML = acts.map(a => {
            const dateStr = a.timestamp ? new Date(a.timestamp).toLocaleString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '\u2014';
            const catBadge = (a.category === 'Statement of Account')
                ? '<span class="status-badge active" style="background:#e0f2fe; color:#0369a1; font-size:0.72rem; padding:2.5px 6px; font-weight:700;"><i class="fas fa-file-invoice-dollar"></i> SOA</span>'
                : ((a.category === 'Enrollment')
                    ? '<span class="status-badge active" style="background:#dcfce7; color:#15803d; font-size:0.72rem; padding:2.5px 6px; font-weight:700;"><i class="fas fa-user-plus"></i> Enrollment</span>'
                    : '<span class="status-badge active" style="background:#fef3c7; color:#b45309; font-size:0.72rem; padding:2.5px 6px; font-weight:700;"><i class="fas fa-user-edit"></i> Profile</span>');

            const quickBtn = a.studentId
                ? `<button type="button" class="btn-icon view" onclick="viewStudent('${a.studentId}')" title="View Learner Profile" style="background:#e0f2fe; color:#0284c7; width:25px; height:25px; border-radius:4px; font-size:0.74rem;"><i class="fas fa-eye"></i></button>`
                : '\u2014';

            return `
                <tr>
                    <td><small style="color:#64748b; font-weight:600; font-size:0.71rem;">${dateStr}</small></td>
                    <td><strong style="font-size:0.82rem; color:#0f172a;">${escHtml(a.account || 'Staff')}</strong><br><small class="text-muted" style="font-size:0.71rem;">${escHtml(a.role || '')}</small></td>
                    <td style="text-align:center;">${catBadge}</td>
                    <td><strong style="font-size:0.82rem; color:#0f172a;">${escHtml(a.targetName || '\u2014')}</strong><br><small class="text-muted" style="font-size:0.71rem;">LRN: ${escHtml(a.lrn || '\u2014')}</small></td>
                    <td style="font-size:0.81rem; color:#334155;">${escHtml(a.details || '')}</td>
                    <td class="text-center actions-cell" style="text-align:center; white-space:nowrap;">${quickBtn}</td>
                </tr>
            `;
        }).join('');
    }

    if (!silent) {
        showToast(`Activity logs refreshed (${acts.length} event${acts.length === 1 ? '' : 's'}).`, 'info');
    }
}
window.refreshActivitiesPage = refreshActivitiesPage;

function resetActivityFilters() {
    const searchInput = document.getElementById('activitySearchInput');
    const filterCat = document.getElementById('activityFilterCategory');
    const filterAcc = document.getElementById('activityFilterAccount');
    const filterDate = document.getElementById('activityFilterDate');
    if (searchInput) searchInput.value = '';
    if (filterCat) filterCat.value = 'ALL';
    if (filterAcc) filterAcc.value = 'ALL';
    if (filterDate) filterDate.value = 'ALL';
    refreshActivitiesPage();
    showToast('Activity filters reset.', 'info');
}
window.resetActivityFilters = resetActivityFilters;

function exportActivitiesCSV() {
    const acts = getActivities();
    if (acts.length === 0) {
        showToast('No activities to export.', 'info');
        return;
    }
    const headers = ['Timestamp', 'Account', 'Role', 'Category', 'Target Learner', 'LRN', 'Details'];
    const rows = acts.map(a => [
        `"${a.timestamp}"`,
        `"${a.account}"`,
        `"${a.role}"`,
        `"${a.category}"`,
        `"${a.targetName}"`,
        `"${a.lrn}"`,
        `"${(a.details || '').replace(/"/g, '""')}"`
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `MDSJFI_Activity_Logs_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Activity logs exported to CSV successfully.', 'success');
}
window.exportActivitiesCSV = exportActivitiesCSV;

function initExportImport() {
    const btnExp = document.getElementById('btnExportAll');
    if (btnExp) btnExp.onclick = openExportOptionsModal;

    const btnExpFiltered = document.getElementById('btnExportFiltered');
    if (btnExpFiltered) btnExpFiltered.onclick = openExportOptionsModal;

    const btnImp = document.getElementById('btnImportData');
    const impFile = document.getElementById('importFileInput');
    if (btnImp) {
        btnImp.onclick = handleImportClick;
    }
    if (impFile) {
        impFile.onchange = importData;
    }

    const btnExpOpt = document.getElementById('btnOpenExportOptions') || document.getElementById('btnExportAll');
    if (btnExpOpt) btnExpOpt.onclick = openExportOptionsModal;
}

function openExportOptionsModal(defaultScope) {
    if (defaultScope) {
        const val = (defaultScope === 'soa' || defaultScope === 'financial') ? 'financial_matrix' : defaultScope;
        const targetRadio = document.querySelector(`input[name="exportScope"][value="${val}"]`);
        if (targetRadio) {
            targetRadio.checked = true;
        }
    }
    updateExportSummary();
    openModal('exportOptionsModal');
}

function updateExportSummary() {
    const scopeEl = document.querySelector('input[name="exportScope"]:checked');
    const formatEl = document.querySelector('input[name="exportFormat"]:checked');
    const scope = scopeEl ? scopeEl.value : 'all';
    const format = formatEl ? formatEl.value : 'csv';

    const bAll = document.getElementById('exportBadgeAll');
    if (bAll) bAll.textContent = `${students.length} Records`;

    const sy = currentSchoolYear || '2026-2027';
    const syStudents = students.filter(s => s.schoolYear === sy);
    const bSy = document.getElementById('exportBadgeSy2026');
    if (bSy) bSy.textContent = `${syStudents.length} Records`;

    ['7', '8', '9', '10'].forEach(g => {
        const badge = document.getElementById(`exportBadgeG${g}`);
        if (badge) {
            const count = students.filter(s => String(s.gradeLevel) === g).length;
            badge.textContent = `${count} Records`;
        }
    });

    const bFin = document.getElementById('exportBadgeFin');
    if (bFin) bFin.textContent = `${syStudents.length} Accounts`;

    const summaryText = document.getElementById('exportSummaryText');
    if (summaryText) {
        let count = students.length;
        if (scope === 'sy2026') count = syStudents.length;
        else if (scope === 'grade7') count = students.filter(s => String(s.gradeLevel) === '7').length;
        else if (scope === 'grade8') count = students.filter(s => String(s.gradeLevel) === '8').length;
        else if (scope === 'grade9') count = students.filter(s => String(s.gradeLevel) === '9').length;
        else if (scope === 'grade10') count = students.filter(s => String(s.gradeLevel) === '10').length;
        else if (scope === 'financial_matrix') count = syStudents.length;

        summaryText.innerHTML = `<i class="fas fa-check-circle" style="color:#16a34a;"></i> Ready to export <strong>${count}</strong> record(s) as <strong>.${format.toUpperCase()}</strong>`;
    }
}

function executeExportWithOptions() {
    const scopeEl = document.querySelector('input[name="exportScope"]:checked');
    const formatEl = document.querySelector('input[name="exportFormat"]:checked');
    const scope = scopeEl ? scopeEl.value : 'all';
    const format = formatEl ? formatEl.value : 'csv';

    let exportSet = [...students];
    let filePrefix = 'MDSJ_Students_All';

    if (scope === 'sy2026') {
        const sy = currentSchoolYear || '2026-2027';
        exportSet = students.filter(s => s.schoolYear === sy);
        filePrefix = `MDSJ_Students_SY${sy.replace('-', '_')}`;
    } else if (scope === 'grade7') {
        exportSet = students.filter(s => String(s.gradeLevel) === '7');
        filePrefix = 'MDSJ_Students_Grade7';
    } else if (scope === 'grade8') {
        exportSet = students.filter(s => String(s.gradeLevel) === '8');
        filePrefix = 'MDSJ_Students_Grade8';
    } else if (scope === 'grade9') {
        exportSet = students.filter(s => String(s.gradeLevel) === '9');
        filePrefix = 'MDSJ_Students_Grade9';
    } else if (scope === 'grade10') {
        exportSet = students.filter(s => String(s.gradeLevel) === '10');
        filePrefix = 'MDSJ_Students_Grade10';
    } else if (scope === 'financial_matrix') {
        exportSet = students.map(s => {
            const tuition = Number(s.tuitionFee) || DEFAULT_BASE_TUITION;
            const discount = (s.isDiscounted === 'YES') ? (Number(s.discountAmount) || 0) : 0;
            const net = Math.max(0, tuition - discount);
            const payments = Array.isArray(s.payments) ? s.payments : [];
            const paid = payments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
            const bal = Math.max(0, net - paid);
            return {
                lrn: s.lrn,
                studentName: `${s.lastName}, ${s.firstName} ${s.middleName || ''}`.trim(),
                gradeLevel: s.gradeLevel,
                section: s.section,
                schoolYear: s.schoolYear,
                tuitionFee: tuition,
                discountAmount: discount,
                netPayable: net,
                totalPaid: paid,
                remainingBalance: bal,
                status: bal === 0 ? 'Fully Paid' : (paid > 0 ? 'Partial' : 'Unpaid')
            };
        });
        filePrefix = 'MDSJ_Financial_Matrix';
    }

    if (exportSet.length === 0) {
        showToast('No records found for selected export scope.', 'warning');
        return;
    }

    const timestamp = getDateStr();
    if (format === 'json') {
        const blob = new Blob([JSON.stringify(exportSet, null, 2)], { type: 'application/json' });
        downloadBlob(blob, `${filePrefix}_${timestamp}.json`);
    } else {
        const keys = Object.keys(exportSet[0]).filter(k => k !== 'photo' && k !== 'signature' && k !== 'birthCertDoc' && k !== 'torDoc' && k !== 'studentCardDoc');
        const csvHeader = keys.join(',');
        const csvRows = exportSet.map(row => {
            return keys.map(k => {
                let val = row[k] === undefined || row[k] === null ? '' : String(row[k]);
                val = val.replace(/"/g, '""');
                if (val.includes(',') || val.includes('\n') || val.includes('"')) {
                    val = `"${val}"`;
                }
                return val;
            }).join(',');
        });
        const csvContent = '\uFEFF' + [csvHeader, ...csvRows].join('\r\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        downloadBlob(blob, `${filePrefix}_${timestamp}.csv`);
    }

    closeModal('exportOptionsModal');
    showToast(`Exported ${exportSet.length} records successfully.`, 'success');
}

function downloadBlob(blob, filename) {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

function exportAllData() {
    if (students.length === 0) {
        showToast('No data to export.', 'warning');
        return;
    }
    const blob = new Blob([JSON.stringify(students, null, 2)], { type: 'application/json' });
    downloadBlob(blob, `MDSJ_Students_SY2026_${getDateStr()}.json`);
    showToast(`Exported ${students.length} student records.`, 'success');
}

function parseCSV(text) {
    const lines = text.split(/\r\n|\n/).filter(line => line.trim().length > 0);
    if (lines.length < 2) return [];

    function parseLine(line) {
        const result = [];
        let cur = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                if (inQuotes && line[i + 1] === '"') {
                    cur += '"';
                    i++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                result.push(cur.trim());
                cur = '';
            } else {
                cur += char;
            }
        }
        result.push(cur.trim());
        return result;
    }

    const headers = parseLine(lines[0]).map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
        const vals = parseLine(lines[i]);
        if (vals.length === 0 || (vals.length === 1 && !vals[0])) continue;
        const obj = {};
        headers.forEach((h, idx) => {
            obj[h] = vals[idx] !== undefined ? vals[idx] : '';
        });
        rows.push(obj);
    }
    return rows;
}

function mapRawToStudent(raw) {
    if (!raw || typeof raw !== 'object') return null;

    // Build case-insensitive, alphanumeric-normalized key-value dictionary
    const clean = {};
    for (const k in raw) {
        if (Object.prototype.hasOwnProperty.call(raw, k)) {
            const normKey = String(k).toLowerCase().replace(/[^a-z0-9]/g, '');
            clean[normKey] = String(raw[k] !== undefined && raw[k] !== null ? raw[k] : '').trim();
        }
    }

    // Comprehensive LRN resolution
    let lrn = clean.lrn || clean.learnerreferencenumber || clean.learnerreferenceno || clean.lrnno ||
              clean.studentlrn || clean.studentnumber || clean.studentno || clean.studentid || clean.id || '';

    // Name resolution
    let lastName = clean.lastname || clean.surname || clean.familyname || clean.last || '';
    let firstName = clean.firstname || clean.givenname || clean.first || '';
    let middleName = clean.middlename || clean.middle || clean.mi || '';
    let suffix = clean.suffix || '';

    // If separate name fields are not found, parse full name column
    if (!lastName && !firstName) {
        const fullName = clean.name || clean.studentname || clean.fullname || clean.learnername || clean.learnerfullname || '';
        if (fullName) {
            if (fullName.includes(',')) {
                const parts = fullName.split(',');
                lastName = parts[0].trim();
                const rest = (parts[1] || '').trim().split(/\s+/);
                firstName = rest[0] || '';
                middleName = rest.slice(1).join(' ') || '';
            } else {
                const parts = fullName.trim().split(/\s+/);
                if (parts.length === 1) {
                    lastName = parts[0];
                    firstName = parts[0];
                } else if (parts.length === 2) {
                    firstName = parts[0];
                    lastName = parts[1];
                } else {
                    firstName = parts[0];
                    middleName = parts.slice(1, -1).join(' ');
                    lastName = parts[parts.length - 1];
                }
            }
        }
    }

    if (!lrn) {
        if (lastName || firstName) {
            // Auto-generate unique LRN if name exists so the student is never dropped
            lrn = 'LRN-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
        } else {
            return null; // Empty row
        }
    }

    // Grade resolution (7, 8, 9, 10)
    let grade = '7';
    const rawGrade = clean.gradelevel || clean.grade || clean.yearlevel || clean.year || clean.level || '';
    const gradeMatch = String(rawGrade).match(/10|[789]/);
    if (gradeMatch) {
        grade = gradeMatch[0];
    }

    // Section resolution
    const section = clean.section || (GRADE_SECTIONS && GRADE_SECTIONS[grade]) || 'Jade';

    // Gender resolution
    let gender = 'Male';
    const rawGender = (clean.gender || clean.sex || '').toLowerCase();
    if (rawGender.startsWith('f')) gender = 'Female';
    else if (rawGender.startsWith('m')) gender = 'Male';

    // School Year
    const sy = clean.schoolyear || clean.sy || currentSchoolYear || '2026-2027';

    // ESC Grantee
    const rawEsc = (clean.escgrantee || clean.esc || clean.grantee || '').toUpperCase();
    const esc = (rawEsc.includes('Y') || rawEsc.includes('TRUE')) ? 'YES' : 'NO';

    // Status
    const status = clean.status || clean.enrollmentstatus || 'Active';

    // Tuition, payments, etc.
    const baseTuition = Number(clean.tuitionfee || clean.tuition || clean.basetuition) || DEFAULT_BASE_TUITION;
    const discountAmount = esc === 'YES' ? 9000 : (Number(clean.discountamount || clean.discount) || 0);
    const isDiscounted = (esc === 'YES' || discountAmount > 0) ? 'YES' : 'NO';
    const totalPaid = Number(clean.totalpaid || clean.paid) || 0;
    const remainingBalance = Math.max(0, baseTuition - discountAmount - totalPaid);

    return {
        id: generateId(),
        lrn: String(lrn).trim(),
        schoolYear: sy,
        escGrantee: esc,
        escNumber: clean.escnumber || (esc === 'YES' ? ('ESC-' + lrn) : ''),
        lastName: (lastName || 'Student').trim(),
        firstName: (firstName || 'Record').trim(),
        middleName: middleName.trim(),
        suffix: suffix.trim(),
        gradeLevel: grade,
        section: section.trim(),
        gender: gender,
        dateOfBirth: clean.dateofbirth || clean.dob || clean.birthdate || '2012-01-01',
        age: clean.age || '14',
        birthProvince: clean.birthprovince || 'Batangas',
        birthMunicipality: clean.birthmunicipality || 'San Jose',
        birthBarangay: clean.birthbarangay || 'Poblacion',
        birthPlace: clean.birthplace || 'San Jose, Batangas',
        religion: clean.religion || 'Roman Catholic',
        motherTongue: clean.mothertongue || 'Tagalog',
        enrollmentStatus: status,
        addressProvince: clean.addressprovince || 'Batangas',
        addressMunicipality: clean.addressmunicipality || 'San Jose',
        addressBarangay: clean.addressbarangay || 'Poblacion',
        addressStreet: clean.addressstreet || '',
        address: clean.address || 'Poblacion, San Jose, Batangas',
        contactNumber: clean.contactnumber || clean.contact || clean.phone || '',
        email: clean.email || '',
        fatherName: clean.fathername || '',
        fatherOccupation: clean.fatheroccupation || '',
        fatherContact: clean.fathercontact || '',
        motherName: clean.mothername || '',
        motherOccupation: clean.motheroccupation || '',
        motherContact: clean.mothercontact || '',
        guardianName: clean.guardianname || '',
        guardianRelationship: clean.guardianrelationship || '',
        guardianContact: clean.guardiancontact || '',
        emergencyName: clean.emergencyname || '',
        emergencyRelation: clean.emergencyrelation || 'Parent / Guardian',
        emergencyContact: clean.emergencycontact || '',
        previousSchool: clean.previousschool || '',
        previousSchoolAddress: clean.previousschooladdress || '',
        remarks: clean.remarks || 'Imported via Data Management',
        tuitionFee: baseTuition,
        isDiscounted: isDiscounted,
        discountAmount: discountAmount,
        remainingBalance: remainingBalance,
        totalPaid: totalPaid,
        payments: [],
        dateCreated: new Date().toISOString(),
        dateModified: new Date().toISOString()
    };
}

function processImportedRecords(records) {
    let count = 0;
    records.forEach(s => {
        if (!s) return;
        // If LRN is missing but student has a name or student number, assign a unique identifier
        if (!s.lrn) {
            if (s.studentNumber) {
                s.lrn = String(s.studentNumber).replace(/[^0-9]/g, '');
            } else if (s.lastName || s.firstName) {
                s.lrn = 'LRN' + Date.now().toString().slice(-8) + Math.floor(Math.random() * 1000);
            } else {
                return;
            }
        }
        const lrn = String(s.lrn).trim();
        const existingIdx = students.findIndex(existing => String(existing.lrn).trim() === lrn || existing.id === s.id);

        if (!s.id) s.id = generateId();
        if (!s.schoolYear) s.schoolYear = currentSchoolYear || '2026-2027';
        if (!s.tuitionFee) s.tuitionFee = DEFAULT_BASE_TUITION;
        if (!s.payments) s.payments = [];

        if (existingIdx !== -1) {
            students[existingIdx] = { ...students[existingIdx], ...s, dateModified: new Date().toISOString() };
        } else {
            students.unshift({ ...s, dateCreated: new Date().toISOString(), dateModified: new Date().toISOString() });
        }
        count++;
    });

    saveStudents();
    refreshAll();
    navigateTo('students');
    return count;
}

function importData(e) {
    const file = e.target.files[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();

    if (fileName.endsWith('.json')) {
        const reader = new FileReader();
        reader.onload = function(event) {
            try {
                let imported = JSON.parse(event.target.result);
                if (!Array.isArray(imported) && imported.students && Array.isArray(imported.students)) {
                    imported = imported.students;
                }
                if (!Array.isArray(imported)) throw new Error('Invalid JSON format');

                const count = processImportedRecords(imported);
                showToast(`Imported ${count} student record(s) from JSON.`, 'success');
            } catch (err) {
                showToast('Invalid JSON file format.', 'error');
            }
        };
        reader.readAsText(file);
    } else if (fileName.endsWith('.csv')) {
        const reader = new FileReader();
        reader.onload = function(event) {
            try {
                const rows = parseCSV(event.target.result);
                if (rows.length === 0) {
                    showToast('No records found in CSV file.', 'warning');
                    return;
                }
                const mapped = rows.map(mapRawToStudent).filter(Boolean);
                const count = processImportedRecords(mapped);
                showToast(`Imported ${count} student record(s) from CSV.`, 'success');
            } catch (err) {
                showToast('Failed to parse CSV file: ' + err.message, 'error');
            }
        };
        reader.readAsText(file);
    } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        const parseExcel = () => {
            const reader = new FileReader();
            reader.onload = function(event) {
                try {
                    const data = new Uint8Array(event.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const firstSheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheetName];
                    const json = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
                    if (!json || json.length === 0) {
                        showToast('No records found in Excel sheet.', 'warning');
                        return;
                    }
                    const mapped = json.map(mapRawToStudent).filter(Boolean);
                    const count = processImportedRecords(mapped);
                    showToast(`Imported ${count} student record(s) from Excel!`, 'success');
                } catch (err) {
                    showToast('Failed to parse Excel file: ' + err.message, 'error');
                }
            };
            reader.readAsArrayBuffer(file);
        };

        if (window.XLSX) {
            parseExcel();
        } else {
            showToast('Loading Excel processing engine...', 'info');
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
            script.onload = parseExcel;
            script.onerror = () => showToast('Could not load Excel engine. Please save as CSV and re-upload.', 'error');
            document.head.appendChild(script);
        }
    } else {
        showToast('Unsupported file type. Please upload a JSON, CSV, or XLSX file.', 'warning');
    }

    e.target.value = '';
}

function initMobileMenu() {
    const ham = document.getElementById('hamburger');
    const sidebar = document.getElementById('sidebar');
    if (ham && sidebar) {
        ham.onclick = () => sidebar.classList.toggle('open');
    }
}

// ======================== UTILITIES & REFRESH ========================

function refreshAll() {
    try { refreshDashboard(); } catch (e) { console.error('Dashboard refresh err:', e); }
    try { refreshStudentsTable(); } catch (e) { console.error('Students table refresh err:', e); }
    try { refreshSOAPage(); } catch (e) { console.error('SOA page refresh err:', e); }
    try { refreshGradeTable('7'); } catch (e) { console.error('Grade 7 table refresh err:', e); }
    try { refreshGradeTable('8'); } catch (e) { console.error('Grade 8 table refresh err:', e); }
    try { refreshGradeTable('9'); } catch (e) { console.error('Grade 9 table refresh err:', e); }
    try { refreshGradeTable('10'); } catch (e) { console.error('Grade 10 table refresh err:', e); }
    try { refreshArchiveTable(); } catch (e) { console.error('Archive table refresh err:', e); }
    try { refreshCashFlowPage(); } catch (e) { console.error('Cash flow refresh err:', e); }
    try { refreshClearancePage(); } catch (e) { console.error('Clearance refresh err:', e); }
    try { refreshPayrollPage(); } catch (e) { console.error('Payroll refresh err:', e); }
    try { refreshTeachersPage(); } catch (e) { console.error('Teachers refresh err:', e); }
    try { updatePayrollArchivesBadge(); } catch (e) { console.error('Payroll archives badge err:', e); }
}

function escHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function formatDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    return d.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
}

function getDateStr() {
    const d = new Date();
    return `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const icons = { success: 'fa-check-circle', error: 'fa-exclamation-circle', warning: 'fa-exclamation-triangle', info: 'fa-info-circle' };
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="fas ${icons[type] || icons.info}"></i>
        <span class="toast-msg">${escHtml(message)}</span>
        <button type="button" class="toast-close" onclick="this.parentElement.remove()">&times;</button>
    `;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

function printSOAPageSummary() {
    const sy = currentSchoolYear || '2026-2027';
    const cohort = students.filter(s => s.schoolYear === sy);

    let totalAssessed = 0;
    let totalDiscount = 0;
    let totalPaid = 0;
    let totalBalance = 0;

    const rowsHtml = cohort.map((s, idx) => {
        const tuition = Number(s.tuitionFee) || DEFAULT_BASE_TUITION;
        const isEsc = (s.escGrantee === 'YES');
        const isDisc = (isEsc || s.isDiscounted === 'YES');
        const discount = (s.isDiscounted === 'YES' && Number(s.discountAmount) > 0)
            ? Number(s.discountAmount)
            : (isEsc ? 9000 : 0);
        const net = Math.max(0, tuition - discount);
        const payments = Array.isArray(s.payments) ? s.payments : [];
        const paid = payments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
        const bal = Math.max(0, net - paid);

        totalAssessed += tuition;
        totalDiscount += discount;
        totalPaid += paid;
        totalBalance += bal;

        const statusText = bal === 0 ? 'Fully Paid' : (paid > 0 ? 'Partial' : 'Unpaid');

        return `
            <tr>
                <td style="text-align:center;">${idx + 1}</td>
                <td><code>${escHtml(s.lrn)}</code></td>
                <td><strong>${escHtml(s.lastName)}, ${escHtml(s.firstName)} ${escHtml(s.middleName || '')}</strong></td>
                <td style="text-align:center;">Grade ${escHtml(s.gradeLevel)} - ${escHtml(s.section)}</td>
                <td style="text-align:right;">₱${tuition.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
                <td style="text-align:right;">${discount > 0 ? ('-₱' + discount.toLocaleString('en-PH', { minimumFractionDigits: 2 })) : '—'}</td>
                <td style="text-align:right; font-weight:700;">₱${net.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
                <td style="text-align:right; color:#16a34a; font-weight:600;">₱${paid.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
                <td style="text-align:right; color:#dc2626; font-weight:700;">₱${bal.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
                <td style="text-align:center;">${statusText}</td>
            </tr>
        `;
    }).join('');

    const netPayableTotal = Math.max(0, totalAssessed - totalDiscount);

    const container = document.getElementById('printableFinancialSummaryContainer');
    if (!container) return;

    container.innerHTML = `
        <div class="fin-print-header">
            <div class="fin-print-brand">
                <img src="school-logo.png" alt="MDSJ Logo" class="fin-print-logo">
                <div class="fin-print-title-block">
                    <h1>Montessori de San Jose Foundation Inc.</h1>
                    <p>0696 P. Burgos St., Brgy. Pag-asa, San Jose, Occidental Mindoro &bull; Recognized by the Department of Education</p>
                </div>
            </div>
            <div class="fin-print-meta">
                <strong>OFFICIAL FINANCIAL REPORT</strong>
                <div>Date Issued: ${new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
            </div>
        </div>

        <div class="fin-report-banner">
            <h2>Statement of Account &amp; Comprehensive Financial Matrix</h2>
            <span>Official S.Y. ${escHtml(sy)} • ${cohort.length} Enrolled Learners</span>
        </div>

        <div class="fin-metrics-grid">
            <div class="fin-metric-box">
                <span>Total Tuition Assessed</span>
                <strong>₱${totalAssessed.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</strong>
                <small>${cohort.length} total students</small>
            </div>
            <div class="fin-metric-box">
                <span>Discounts &amp; Subsidies</span>
                <strong style="color:#d97706;">₱${totalDiscount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</strong>
                <small>ESC &amp; institutional grants</small>
            </div>
            <div class="fin-metric-box">
                <span>Total Collections</span>
                <strong style="color:#16a34a;">₱${totalPaid.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</strong>
                <small>Actual payments received</small>
            </div>
            <div class="fin-metric-box">
                <span>Outstanding Balances</span>
                <strong style="color:#dc2626;">₱${totalBalance.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</strong>
                <small>Remaining receivables</small>
            </div>
        </div>

        <table class="fin-table">
            <thead>
                <tr>
                    <th style="width:30px; text-align:center;">#</th>
                    <th>LRN</th>
                    <th>Student Name</th>
                    <th style="text-align:center;">Grade &amp; Section</th>
                    <th style="text-align:right;">Tuition</th>
                    <th style="text-align:right;">Discount</th>
                    <th style="text-align:right;">Net Due</th>
                    <th style="text-align:right;">Total Paid</th>
                    <th style="text-align:right;">Balance</th>
                    <th style="text-align:center;">Status</th>
                </tr>
            </thead>
            <tbody>
                ${rowsHtml}
            </tbody>
            <tfoot>
                <tr>
                    <th colspan="4" style="text-align:right;">GRAND TOTALS:</th>
                    <th style="text-align:right;">₱${totalAssessed.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</th>
                    <th style="text-align:right;">₱${totalDiscount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</th>
                    <th style="text-align:right;">₱${netPayableTotal.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</th>
                    <th style="text-align:right; color:#16a34a;">₱${totalPaid.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</th>
                    <th style="text-align:right; color:#dc2626;">₱${totalBalance.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</th>
                    <th></th>
                </tr>
            </tfoot>
        </table>

        <!-- Signatories: CARRELLE B. COLEGADO & NIÑO ALOYSIUS B. COLEGADO -->
        <div class="financial-summary-signatories">
            <div class="fin-sig-block">
                <div class="fin-sig-caption">Prepared / Certified by:</div>
                <div class="fin-sig-line"></div>
                <strong class="fin-sig-name">CARRELLE B. COLEGADO</strong>
                <span class="fin-sig-role">Registrar/In-Charge, Accounting</span>
            </div>
            <div class="fin-sig-block">
                <div class="fin-sig-caption">Approved by:</div>
                <div class="fin-sig-line"></div>
                <strong class="fin-sig-name">NI&Ntilde;O ALOYSIUS B. COLEGADO</strong>
                <span class="fin-sig-role">School President</span>
            </div>
        </div>
    `;

    document.body.classList.remove('printing-profile', 'printing-soa');
    document.body.classList.add('printing-financial-summary');

    const cleanup = () => {
        document.body.classList.remove('printing-financial-summary');
        window.removeEventListener('afterprint', cleanup);
    };

    window.addEventListener('afterprint', cleanup);

    setTimeout(() => {
        window.print();
        setTimeout(cleanup, 1200);
    }, 80);
}

// ======================== GLOBAL ATTACHMENTS & CLICK DELEGATION ========================

window.viewStudent = viewStudent;
window.realViewStudent = viewStudent;
window.openSOAModal = openSOAModal;
window.realOpenSOAModal = openSOAModal;
window.editStudent = editStudent;
window.realEditStudent = editStudent;
window.confirmDelete = confirmDelete;
window.realConfirmDelete = confirmDelete;
window.executeConfirmDelete = executeConfirmDelete;
window.realExecuteConfirmDelete = executeConfirmDelete;
window.printStudentRecord = printStudentRecord;
window.realPrintStudentRecord = printStudentRecord;
window.printSOAModal = printSOAModal;
window.realPrintSOAModal = printSOAModal;
window.toggleSOAEditMode = toggleSOAEditMode;
window.realToggleSOAEditMode = toggleSOAEditMode;
window.printSOAPageSummary = printSOAPageSummary;
window.fullPrintSOAPageSummary = printSOAPageSummary;
window.openModal = openModal;
window.closeModal = closeModal;
window.navigateTo = navigateTo;
window.fullNavigateTo = navigateTo;
window.showApp = showApp;
window.refreshAll = refreshAll;
window.findStudent = findStudent;
window.setGlobalSchoolYear = setGlobalSchoolYear;

// Upload & Document Preview Window Attachments
window.previewCurrentPhoto = previewCurrentPhoto;
window.removeCurrentPhoto = removeCurrentPhoto;
window.previewCurrentDoc = previewCurrentDoc;
window.removeCurrentDoc = removeCurrentDoc;
window.clearSignaturePad = clearSignaturePad;
window.removeCurrentSig = removeCurrentSig;
window.previewCurrentSig = previewCurrentSig;
window.previewDocData = previewDocData;
window.viewDocumentInModal = viewDocumentInModal;
window.openExportOptionsModal = openExportOptionsModal;
window.fullOpenExportOptionsModal = openExportOptionsModal;
window.updateExportSummary = updateExportSummary;
window.executeExportWithOptions = executeExportWithOptions;
window.handleReligionChange = handleReligionChange;
window.handleBirthRegionChange = handleBirthRegionChange;
window.handleAddrRegionChange = handleAddrRegionChange;
window.importData = importData;
window.exportAllData = exportAllData;
window.toggleTuitionAdjustForm = toggleTuitionAdjustForm;
window.onQuickDiscountChange = onQuickDiscountChange;
window.saveQuickTuitionSettings = saveQuickTuitionSettings;

// ======================== DAILY CASH IN AND OUT FLOW ENGINE ========================

const CASH_FLOW_KEY = 'mdsj_cash_flow';

function loadCashFlowInitialData() {
    if (typeof window !== 'undefined' && Array.isArray(window.SEED_CASH_FLOW_DATA) && window.SEED_CASH_FLOW_DATA.length > 0) {
        return JSON.parse(JSON.stringify(window.SEED_CASH_FLOW_DATA));
    }
    return [];
}

function getCashFlowEntries() {
    try {
        const stored = localStorage.getItem(CASH_FLOW_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed) && parsed.length >= 100) {
                return parsed;
            }
        }
    } catch (e) {
        console.error('Error reading cash flow storage:', e);
    }
    const initial = loadCashFlowInitialData();
    if (Array.isArray(initial) && initial.length > 0) {
        saveCashFlowEntries(initial);
        return initial;
    }
    return [];
}

function saveCashFlowEntries(entries) {
    try {
        localStorage.setItem(CASH_FLOW_KEY, JSON.stringify(entries));
    } catch (e) {
        console.error('Error saving cash flow storage:', e);
    }
}

function refreshCashFlowPage() {
    const allEntries = getCashFlowEntries();
    const syFilterVal = document.getElementById('cashFlowSyFilter')?.value || '2026-2027';
    
    // Filter by school year for stats if selected
    const syEntries = (syFilterVal && syFilterVal !== 'ALL')
        ? allEntries.filter(e => (e.schoolYear || '2026-2027') === syFilterVal)
        : allEntries;

    // Calculate KPIs
    let totalIn = 0;
    let totalOut = 0;
    syEntries.forEach(e => {
        const amt = parseFloat(e.amount) || 0;
        if (e.type === 'IN') totalIn += amt;
        else if (e.type === 'OUT') totalOut += amt;
    });
    const netBalance = totalIn - totalOut;

    const elTotalIn = document.getElementById('statTotalCashIn');
    const elTotalOut = document.getElementById('statTotalCashOut');
    const elNet = document.getElementById('statNetCashBalance');
    const elNetSub = document.getElementById('statNetBalanceSub');
    const elCount = document.getElementById('statCashFlowTxnCount');

    if (elTotalIn) elTotalIn.innerHTML = `&#8369;${formatNumber(totalIn)}`;
    if (elTotalOut) elTotalOut.innerHTML = `&#8369;${formatNumber(totalOut)}`;
    if (elNet) {
        elNet.innerHTML = `&#8369;${formatNumber(netBalance)}`;
        elNet.style.color = netBalance >= 0 ? '#15803d' : '#dc2626';
    }
    if (elNetSub) {
        elNetSub.textContent = netBalance >= 0 ? 'Operating Cash Surplus' : 'Net Cash Deficit';
    }
    if (elCount) elCount.textContent = syEntries.length;

    // Filter entries for table
    filterCashFlow();
}

function filterCashFlow() {
    const allEntries = getCashFlowEntries();
    const syFilterVal = document.getElementById('cashFlowSyFilter')?.value || '2026-2027';
    const searchVal = (document.getElementById('cashFlowSearch')?.value || '').toLowerCase().trim();
    const typeVal = document.getElementById('cashFlowTypeFilter')?.value || 'ALL';
    const dateVal = document.getElementById('cashFlowDateFilter')?.value || '';

    const filtered = allEntries.filter(e => {
        if (syFilterVal && syFilterVal !== 'ALL' && (e.schoolYear || '2026-2027') !== syFilterVal) return false;
        if (typeVal !== 'ALL' && e.type !== typeVal) return false;
        if (dateVal && e.date !== dateVal) return false;
        if (searchVal) {
            const targetStr = `${e.refNo || ''} ${e.entity || ''} ${e.category || ''} ${e.remarks || ''} ${e.receivedBy || ''} ${e.encodedBy || ''} ${e.encoder || ''} ${e.method || ''}`.toLowerCase();
            if (!targetStr.includes(searchVal)) return false;
        }
        return true;
    });

    renderCashFlowTable(filtered);
}

function renderCashFlowTable(list) {
    const tbody = document.getElementById('cashFlowTableBody');
    if (!tbody) return;

    if (!list || list.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="10" style="text-align: center; padding: 36px 16px; color: #64748b;">
                    <i class="fas fa-folder-open" style="font-size: 2rem; color: #94a3b8; display: block; margin-bottom: 8px;"></i>
                    <strong>No Cash Flow records found</strong>
                    <p style="font-size: 0.85rem; margin-top: 4px;">Try clearing your date, school year, or search filter, or click "New Encoding" to record a transaction.</p>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = list.map(item => {
        const isIn = item.type === 'IN';
        const badgeClass = isIn ? 'cf-badge in' : 'cf-badge out';
        const badgeIcon = isIn ? '<i class="fas fa-arrow-down"></i>' : '<i class="fas fa-arrow-up"></i>';
        const badgeText = isIn ? 'Cash In' : 'Cash Out';
        const amtClass = isIn ? 'cf-amount-in' : 'cf-amount-out';
        const sign = isIn ? '+' : '-';
        const formattedAmount = `${sign}&#8369;${formatNumber(item.amount)}`;

        // Official Receiver & Encoder formatting
        const rawRec = item.receivedBy || (item.encoder && item.encoder.includes('Niño') ? '1. School President' : '2. Registrar/Accounting');
        const rawEnc = item.encodedBy || (item.encoder && item.encoder.includes('Niño') ? '1. School President' : '2. Registrar/Accounting');

        const recBadge = rawRec.includes('President')
            ? '<span class="status-badge" style="background:#e0f2fe; color:#0369a1; font-weight:700; font-size:0.71rem; padding:2px 6px;" title="1. School President"><i class="fas fa-user-tie"></i> Pres.</span>'
            : '<span class="status-badge" style="background:#fef3c7; color:#92400e; font-weight:700; font-size:0.71rem; padding:2px 6px;" title="2. Registrar / Accounting"><i class="fas fa-cash-register"></i> Reg.</span>';

        const encBadge = rawEnc.includes('President')
            ? '<span class="status-badge" style="background:#e0f2fe; color:#0369a1; font-weight:700; font-size:0.71rem; padding:2px 6px;" title="1. School President"><i class="fas fa-user-shield"></i> Pres.</span>'
            : '<span class="status-badge" style="background:#f1f5f9; color:#334155; font-weight:700; font-size:0.71rem; padding:2px 6px;" title="2. Registrar / Accounting"><i class="fas fa-user-edit"></i> Reg.</span>';

        let actionBtns = `
            <button type="button" class="btn-icon view" title="Print Transaction Voucher / Receipt" onclick="printCashFlowVoucher('${item.id}')" style="background:#e0f2fe; color:#0284c7; width:23px; height:23px; border-radius:3px; font-size:0.70rem; margin:0 1.5px;">
                <i class="fas fa-receipt"></i>
            </button>
        `;
        if (typeof isTeacher !== 'function' || !isTeacher()) {
            actionBtns += `
                <button type="button" class="btn-icon edit" title="Edit Transaction" onclick="openNewCashFlowModal('${item.id}')" style="background:#eff6ff; color:#2563eb; width:23px; height:23px; border-radius:3px; font-size:0.70rem; margin:0 1.5px;">
                    <i class="fas fa-edit"></i>
                </button>
                <button type="button" class="btn-icon delete" title="Delete Transaction" onclick="deleteCashFlowEntry('${item.id}')" style="background:#fee2e2; color:#dc2626; width:23px; height:23px; border-radius:3px; font-size:0.70rem; margin:0 1.5px;">
                    <i class="fas fa-trash-alt"></i>
                </button>
            `;
        }

        return `
            <tr data-cf-id="${item.id}">
                <td>
                    <div style="font-weight: 600; font-size: 0.81rem; color: #1e293b; line-height: 1.25;">${item.date}</div>
                    <div style="font-size: 0.71rem; color: #64748b; line-height: 1.15;">${item.time || ''}</div>
                </td>
                <td style="text-align:center;">
                    <span class="${badgeClass}">${badgeIcon} ${badgeText}</span>
                </td>
                <td>
                    <span style="font-family: monospace; font-size: 0.81rem; font-weight: 700; color: #0f172a;">${escapeHtml(item.refNo)}</span>
                </td>
                <td>
                    <div style="font-weight: 600; color: #1e293b; font-size: 0.81rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${escapeHtml(item.category)}">${escapeHtml(item.category)}</div>
                    ${item.remarks ? `<div style="font-size: 0.71rem; color: #64748b; font-style: italic; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${escapeHtml(item.remarks)}">${escapeHtml(item.remarks)}</div>` : ''}
                </td>
                <td>
                    <div style="font-weight: 500; color: #334155; font-size: 0.81rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${escapeHtml(item.entity)}">${escapeHtml(item.entity)}</div>
                </td>
                <td style="text-align:center;">
                    <span style="display:inline-block; padding: 2px 6px; border-radius: 4px; background: #f1f5f9; color: #475569; font-size: 0.72rem; font-weight: 600;">
                        ${escapeHtml(item.method || 'Cash')}
                    </span>
                </td>
                <td class="text-right ${amtClass}" style="font-size: 0.82rem; font-weight: 700;">
                    ${formattedAmount}
                </td>
                <td style="text-align:center;">
                    ${recBadge}
                </td>
                <td style="text-align:center;">
                    ${encBadge}
                </td>
                <td class="text-center actions-cell">
                    ${actionBtns}
                </td>
            </tr>
        `;
    }).join('');
}

function setCashFlowDateQuick(range) {
    const dateInput = document.getElementById('cashFlowDateFilter');
    if (!dateInput) return;

    if (range === 'today') {
        dateInput.value = new Date().toISOString().split('T')[0];
    } else if (range === 'all') {
        dateInput.value = '';
    } else if (range === 'this_month') {
        dateInput.value = '';
    }
    filterCashFlow();
}

function openNewCashFlowModal(editId = null) {
    if (typeof isTeacher === 'function' && isTeacher()) {
        showToast('Access Restricted: Teachers cannot encode cash flow transactions.', 'warning');
        return;
    }
    if (typeof canEncodeCashFlow === 'function' && !canEncodeCashFlow()) {
        showToast('Access Denied: Only Registrar and Administrator accounts can encode cash transactions.', 'error');
        return;
    }

    const form = document.getElementById('cashFlowForm');
    if (form) form.reset();

    populateCashFlowStudentDropdown();

    const cfEditId = document.getElementById('cfEditId');
    const title = document.getElementById('cashFlowModalTitle');
    const btnSubmit = document.querySelector('#cashFlowModal button[type="submit"]');

    if (editId) {
        const entries = getCashFlowEntries();
        const target = entries.find(e => e.id === editId);
        if (!target) return;

        if (cfEditId) cfEditId.value = target.id;
        if (title) title.textContent = `Edit Transaction: ${target.refNo}`;
        if (btnSubmit) btnSubmit.innerHTML = '<i class="fas fa-save"></i> Update Transaction';

        const cfType = document.getElementById('cfType');
        if (cfType) {
            cfType.value = target.type || 'IN';
            onCashFlowTypeSelectChange(target.type || 'IN');
        }
        const cfDate = document.getElementById('cfDate');
        if (cfDate) cfDate.value = target.date || '';
        const cfSy = document.getElementById('cfSchoolYear');
        if (cfSy) cfSy.value = target.schoolYear || currentSchoolYear || '2026-2027';
        const cfCategory = document.getElementById('cfCategory');
        if (cfCategory) cfCategory.value = target.category || '';
        const cfRefNo = document.getElementById('cfRefNo');
        if (cfRefNo) cfRefNo.value = target.refNo || '';
        const cfEntity = document.getElementById('cfEntity');
        if (cfEntity) cfEntity.value = target.entity || '';
        const cfAmount = document.getElementById('cfAmount');
        if (cfAmount) cfAmount.value = target.amount || '';
        const cfMethod = document.getElementById('cfMethod');
        if (cfMethod) cfMethod.value = target.method || 'Cash';
        const cfReceivedBy = document.getElementById('cfReceivedBy');
        if (cfReceivedBy) cfReceivedBy.value = target.receivedBy || '2. Registrar/Accounting';
        const cfEncodedBy = document.getElementById('cfEncodedBy');
        if (cfEncodedBy) cfEncodedBy.value = target.encodedBy || '2. Registrar/Accounting';
        const cfRemarks = document.getElementById('cfRemarks');
        if (cfRemarks) cfRemarks.value = target.remarks || '';
        const cfStudentSelect = document.getElementById('cfStudentSelect');
        if (cfStudentSelect && target.studentId) cfStudentSelect.value = target.studentId;
    } else {
        if (cfEditId) cfEditId.value = '';
        if (title) title.textContent = 'New Cash Flow Transaction';
        if (btnSubmit) btnSubmit.innerHTML = '<i class="fas fa-save"></i> Save Transaction';

        const cfDate = document.getElementById('cfDate');
        if (cfDate) cfDate.value = new Date().toISOString().split('T')[0];

        const cfSy = document.getElementById('cfSchoolYear');
        if (cfSy) cfSy.value = currentSchoolYear || '2026-2027';

        const cfPayerType = document.getElementById('cfPayerType');
        if (cfPayerType) {
            cfPayerType.value = 'enrolled';
            onCashFlowPayerTypeChange('enrolled');
        }

        const cfType = document.getElementById('cfType');
        if (cfType) {
            cfType.value = 'IN';
            onCashFlowTypeSelectChange('IN');
        }

        const curU = (typeof getCurrentUser === 'function') ? getCurrentUser() : null;
        const isPres = curU && (curU.username === 'admin' || (curU.role && curU.role.includes('President')));
        const cfReceivedBy = document.getElementById('cfReceivedBy');
        const cfEncodedBy = document.getElementById('cfEncodedBy');
        if (cfReceivedBy) cfReceivedBy.value = isPres ? '1. School President' : '2. Registrar/Accounting';
        if (cfEncodedBy) cfEncodedBy.value = isPres ? '1. School President' : '2. Registrar/Accounting';
    }

    const modal = document.getElementById('cashFlowModal');
    if (modal) modal.style.display = 'flex';
}

function populateCashFlowStudentDropdown() {
    const select = document.getElementById('cfStudentSelect');
    if (!select) return;

    const enrolled = (students || []).filter(s => s.enrollmentStatus !== 'Inactive' && s.enrollmentStatus !== 'Transferred' && s.enrollmentStatus !== 'Dropped');
    
    // Sort students by Last Name, First Name
    enrolled.sort((a, b) => (a.lastName || '').localeCompare(b.lastName || ''));

    let html = '<option value="">-- Choose Enrolled Learner --</option>';
    enrolled.forEach(s => {
        const full = `${s.lastName || ''}, ${s.firstName || ''} ${s.middleName || ''}`.trim();
        html += `<option value="${s.id}" data-name="${escHtml(full)}" data-grade="${escHtml(s.gradeLevel)}" data-section="${escHtml(s.section)}" data-lrn="${escHtml(s.lrn)}">
            ${escHtml(full)} (Grade ${escHtml(s.gradeLevel)} - ${escHtml(s.section)})
        </option>`;
    });

    select.innerHTML = html;
}

function onCashFlowPayerTypeChange(val) {
    const group = document.getElementById('cfEnrolledStudentGroup');
    const entityInput = document.getElementById('cfEntity');
    const entityLabel = document.getElementById('cfEntityLabel');
    const catSelect = document.getElementById('cfCategory');

    if (val === 'enrolled') {
        if (group) group.style.display = 'block';
        if (entityLabel) entityLabel.innerHTML = 'Received From (Payer / Student Name) <span class="required" style="color:#ef4444;">*</span>';
        if (entityInput) {
            entityInput.placeholder = 'Select student from dropdown above or edit name';
        }
        if (catSelect && document.getElementById('cfType')?.value === 'IN') {
            catSelect.value = 'Tuition Fee Collection';
        }
    } else if (val === 'former') {
        if (group) group.style.display = 'none';
        if (entityLabel) entityLabel.innerHTML = 'Former Student / Alumni Name <span class="required" style="color:#ef4444;">*</span>';
        if (entityInput) {
            entityInput.value = '';
            entityInput.placeholder = 'e.g. Dela Cruz, Maria (Former Student / Requesting Academic Records)';
            entityInput.focus();
        }
        if (catSelect && document.getElementById('cfType')?.value === 'IN') {
            catSelect.value = 'Miscellaneous & Other Fees';
        }
    } else {
        if (group) group.style.display = 'none';
        const type = document.getElementById('cfType')?.value || 'IN';
        if (entityLabel) {
            entityLabel.innerHTML = (type === 'IN')
                ? 'Received From (Payer Name / Agency) <span class="required" style="color:#ef4444;">*</span>'
                : 'Paid To (Payee / Vendor / Supplier) <span class="required" style="color:#ef4444;">*</span>';
        }
        if (entityInput) {
            entityInput.value = '';
            entityInput.placeholder = (type === 'IN') ? 'e.g. DepEd / PEAC / Sponsor' : 'e.g. PLDT / Batangas Electric / Supplier';
            entityInput.focus();
        }
    }
}

function onCashFlowStudentSelectChange(studentId) {
    const entityInput = document.getElementById('cfEntity');
    const catSelect = document.getElementById('cfCategory');
    if (!studentId) {
        if (entityInput) entityInput.value = '';
        return;
    }

    const s = findStudent(studentId);
    if (!s) return;

    const fullName = `${s.lastName || ''}, ${s.firstName || ''} ${s.middleName || ''}`.trim();
    if (entityInput) entityInput.value = fullName;

    // Default category to Tuition Fee Collection
    if (catSelect && document.getElementById('cfType')?.value === 'IN') {
        catSelect.value = 'Tuition Fee Collection';
    }
}

function closeCashFlowModal() {
    const modal = document.getElementById('cashFlowModal');
    if (modal) modal.style.display = 'none';
}

function onCashFlowTypeSelectChange(type) {
    const catSelect = document.getElementById('cfCategory');
    const entityLabel = document.getElementById('cfEntityLabel');
    const entityInput = document.getElementById('cfEntity');

    if (type === 'IN') {
        if (entityLabel) entityLabel.innerHTML = 'Received From (Payer / Student Name) <span class="required" style="color:#ef4444;">*</span>';
        if (entityInput) entityInput.placeholder = 'e.g. Juan Dela Cruz / Maria Santos';
        if (catSelect) {
            catSelect.innerHTML = `
                <option value="Tuition Fee Collection" selected>Tuition Fee Collection</option>
                <option value="Downpayment / Registration">Downpayment / Registration</option>
                <option value="Miscellaneous & Other Fees">Miscellaneous &amp; Other Fees</option>
                <option value="ESC Grant Subsidy PEAC">ESC Grant Subsidy PEAC</option>
                <option value="Books & Uniforms">Books &amp; Uniforms</option>
                <option value="Graduation / Moving Up Fee">Graduation / Moving Up Fee</option>
                <option value="Other Inflow">Other Cash In</option>
            `;
        }
    } else {
        if (entityLabel) entityLabel.innerHTML = 'Paid To (Payee / Vendor / Supplier) <span class="required" style="color:#ef4444;">*</span>';
        if (entityInput) entityInput.placeholder = 'e.g. Pandayan Bookshop / PLDT Enterprise';
        if (catSelect) {
            catSelect.innerHTML = `
                <option value="Office & Instructional Supplies" selected>Office &amp; Instructional Supplies</option>
                <option value="Utilities & Communication">Utilities &amp; Communication (Electric, Water, Internet)</option>
                <option value="Building Maintenance & Repairs">Building Maintenance &amp; Repairs</option>
                <option value="Faculty & Staff Honorarium">Faculty &amp; Staff Honorarium</option>
                <option value="DepEd & PEAC Accreditation Fees">DepEd &amp; PEAC Accreditation Fees</option>
                <option value="Laboratory & IT Equipment">Laboratory &amp; IT Equipment</option>
                <option value="Refund / Overpayment">Refund / Overpayment</option>
                <option value="Other Outflow">Other Cash Out</option>
            `;
        }
    }
}

function handleSaveCashFlow(e) {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();

    if (typeof canEncodeCashFlow === 'function' && !canEncodeCashFlow()) {
        showToast('Access Restricted: Only Registrar and Administrator can encode cash transactions.', 'error');
        return;
    }

    const type = document.getElementById('cfType')?.value || 'IN';
    const date = document.getElementById('cfDate')?.value || new Date().toISOString().split('T')[0];
    const category = document.getElementById('cfCategory')?.value || 'General';
    const refNo = (document.getElementById('cfRefNo')?.value || '').trim();
    const entity = (document.getElementById('cfEntity')?.value || '').trim();
    const amountVal = parseFloat(document.getElementById('cfAmount')?.value);
    const method = document.getElementById('cfMethod')?.value || 'Cash';
    const remarks = (document.getElementById('cfRemarks')?.value || '').trim();
    const schoolYear = document.getElementById('cfSchoolYear')?.value || currentSchoolYear || '2026-2027';
    const receivedBy = document.getElementById('cfReceivedBy')?.value || '2. Registrar/Accounting';
    const encodedBy = document.getElementById('cfEncodedBy')?.value || '2. Registrar/Accounting';
    const payerType = document.getElementById('cfPayerType')?.value || 'enrolled';
    const selectedStudentId = document.getElementById('cfStudentSelect')?.value || '';

    if (!refNo) {
        showToast('Please enter an Official Receipt or Reference Number.', 'warning');
        document.getElementById('cfRefNo')?.focus();
        return;
    }
    if (!entity) {
        showToast('Please specify the Payer or Payee name.', 'warning');
        document.getElementById('cfEntity')?.focus();
        return;
    }
    if (isNaN(amountVal) || amountVal <= 0) {
        showToast('Please enter a valid amount greater than 0.00.', 'warning');
        document.getElementById('cfAmount')?.focus();
        return;
    }

    const user = (typeof getCurrentUser === 'function') ? getCurrentUser() : null;
    const encoderRoleName = (encodedBy.includes('President')) ? 'School President' : 'Registrar / Accounting';

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

    // Try to match student if payer is enrolled or matches an enrolled learner
    let matchedStudent = null;
    if (selectedStudentId) {
        matchedStudent = findStudent(selectedStudentId);
    } else if (type === 'IN') {
        const normEntity = entity.toLowerCase().replace(/[^a-z0-9]/g, '');
        matchedStudent = (students || []).find(s => {
            const last = (s.lastName || '').toLowerCase().replace(/[^a-z0-9]/g, '');
            const first = (s.firstName || '').toLowerCase().replace(/[^a-z0-9]/g, '');
            return normEntity.includes(last) && normEntity.includes(first);
        });
    }

    const cfEditIdVal = document.getElementById('cfEditId')?.value;
    const entries = getCashFlowEntries();

    if (cfEditIdVal) {
        const existingIdx = entries.findIndex(e => e.id === cfEditIdVal);
        if (existingIdx !== -1) {
            entries[existingIdx].type = type;
            entries[existingIdx].date = date;
            entries[existingIdx].schoolYear = schoolYear;
            entries[existingIdx].category = category;
            entries[existingIdx].refNo = refNo;
            entries[existingIdx].entity = entity;
            entries[existingIdx].amount = amountVal;
            entries[existingIdx].method = method;
            entries[existingIdx].receivedBy = receivedBy;
            entries[existingIdx].encodedBy = encodedBy;
            entries[existingIdx].remarks = remarks;
            entries[existingIdx].studentId = matchedStudent ? matchedStudent.id : '';
            saveCashFlowEntries(entries);
            if (typeof logActivity === 'function') {
                logActivity('Cash Flow Updated', `Updated transaction ${refNo} (${type === 'IN' ? 'Inflow' : 'Outflow'} of ₱${formatNumber(amountVal)})`, matchedStudent || { lastName: entity, firstName: '', lrn: refNo });
            }
            closeCashFlowModal();
            refreshCashFlowPage();
            if (typeof refreshSOAPage === 'function') refreshSOAPage();
            if (typeof refreshClearancePage === 'function') refreshClearancePage();
            showToast('Transaction updated successfully.', 'success');
            return;
        }
    }

    const newEntry = {
        id: 'CF-' + Date.now(),
        type: type,
        date: date,
        time: timeStr,
        schoolYear: schoolYear,
        category: category,
        refNo: refNo,
        entity: entity,
        amount: amountVal,
        method: method,
        receivedBy: receivedBy,
        encodedBy: encodedBy,
        encoder: encodedBy.includes('President') ? 'Niño Aloysius B. Colegado' : 'Carrelle B. Colegado',
        remarks: remarks,
        studentId: matchedStudent ? matchedStudent.id : '',
        createdAt: now.toISOString()
    };

    entries.unshift(newEntry);
    saveCashFlowEntries(entries);

    // AUTOMATIC SOA SYNC: If payment is for an enrolled student, insert into student's SOA payments!
    let soaSyncNotice = '';
    if (type === 'IN' && matchedStudent) {
        if (!Array.isArray(matchedStudent.payments)) matchedStudent.payments = [];
        
        // Check if payment with this refNo already exists to prevent duplicates
        const exists = matchedStudent.payments.some(p => p.orNumber && p.orNumber.trim().toLowerCase() === refNo.toLowerCase());
        if (!exists) {
            const nextInstallmentNum = matchedStudent.payments.length + 1;
            const installmentTerm = (category && category.includes('Tuition')) 
                ? `Installment ${nextInstallmentNum}` 
                : (category || `Installment ${nextInstallmentNum}`);

            matchedStudent.payments.push({
                id: 'PAY-' + Date.now(),
                term: installmentTerm,
                orNumber: refNo,
                date: date,
                amount: amountVal,
                notes: remarks ? `${remarks} (Received by ${receivedBy})` : `Payment recorded via Daily Cash Flow (Received by ${receivedBy})`
            });

            if (typeof updateSOALiveTotals === 'function') {
                updateSOALiveTotals(matchedStudent);
            }
            if (typeof saveStudents === 'function') {
                saveStudents();
            }
            soaSyncNotice = ` & automatically posted to ${matchedStudent.lastName}'s Statement of Account`;
        }
    }

    // Log this action to Current Activities
    if (typeof logActivity === 'function') {
        const actionDesc = type === 'IN'
            ? `Recorded Cash IN of ₱${formatNumber(amountVal)} from ${entity} (${category}) - Ref: ${refNo} [Received: ${receivedBy}, Encoded: ${encodedBy}]${soaSyncNotice}`
            : `Recorded Cash OUT of ₱${formatNumber(amountVal)} to ${entity} (${category}) - Ref: ${refNo} [Disbursed by: ${receivedBy}, Encoded: ${encodedBy}]`;
        logActivity('Cash Flow Transaction', actionDesc, matchedStudent || { lastName: entity, firstName: '', lrn: refNo });
    }

    closeCashFlowModal();
    refreshCashFlowPage();
    if (typeof refreshSOAPage === 'function') refreshSOAPage();
    if (typeof refreshClearancePage === 'function') refreshClearancePage();

    showToast(`Cash ${type === 'IN' ? 'In' : 'Out'} transaction saved successfully${soaSyncNotice}!`, 'success');
}

function deleteCashFlowEntry(id) {
    if (typeof isTeacher === 'function' && isTeacher()) {
        showToast('Access Restricted: Teachers cannot delete cash flow transactions.', 'warning');
        return;
    }

    const entries = getCashFlowEntries();
    const target = entries.find(e => e.id === id);
    if (!target) return;

    requestAdminAuth(() => {
        proceedDeleteCashFlowEntry(target);
    }, 'Delete Cash Flow Transaction', `Deleting Cash Flow transaction ${target.refNo} (${target.type === 'IN' ? 'Cash In' : 'Cash Out'} of ₱${formatNumber(target.amount)}) is an audited financial transaction. Administrator credentials verification is strictly required to proceed.`, true);
}

function proceedDeleteCashFlowEntry(target) {
    if (!confirm(`Are you sure you want to DELETE transaction ${target.refNo} (${target.type === 'IN' ? 'Cash In' : 'Cash Out'} of ₱${formatNumber(target.amount)})?\n\nThis will remove the transaction from the Cash Flow ledger.`)) {
        return;
    }

    const entries = getCashFlowEntries();
    const updated = entries.filter(e => e.id !== target.id);
    saveCashFlowEntries(updated);

    if (typeof logActivity === 'function') {
        logActivity('Cash Flow Deletion', `Deleted Cash Flow transaction ${target.refNo} (${target.type === 'IN' ? 'Inflow' : 'Outflow'} of ₱${formatNumber(target.amount)})`, target);
    }

    refreshCashFlowPage();
    showToast('Transaction record deleted successfully.', 'info');
}

function exportCashFlowCSV() {
    const entries = getCashFlowEntries();
    if (!entries || entries.length === 0) {
        showToast('No Cash Flow records available to export.', 'warning');
        return;
    }

    const headers = ['Transaction ID', 'Date', 'Time', 'Flow Type', 'Ref / OR No.', 'Category / Particulars', 'Payer / Payee', 'Payment Method', 'Amount (PHP)', 'Encoder', 'Remarks'];
    const rows = entries.map(e => [
        `"${e.id || ''}"`,
        `"${e.date || ''}"`,
        `"${e.time || ''}"`,
        `"${e.type === 'IN' ? 'Cash In (Collection)' : 'Cash Out (Disbursement)'}"`,
        `"${(e.refNo || '').replace(/"/g, '""')}"`,
        `"${(e.category || '').replace(/"/g, '""')}"`,
        `"${(e.entity || '').replace(/"/g, '""')}"`,
        `"${e.method || 'Cash'}"`,
        e.amount ? Number(e.amount).toFixed(2) : '0.00',
        `"${(e.encoder || '').replace(/"/g, '""')}"`,
        `"${(e.remarks || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `MDSJFI_Cash_Flow_Journal_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast('Cash Flow ledger exported successfully as CSV.', 'success');
}

function printCashFlowReport() {
    const entries = getCashFlowEntries();
    let totalIn = 0;
    let totalOut = 0;
    entries.forEach(e => {
        const amt = parseFloat(e.amount) || 0;
        if (e.type === 'IN') totalIn += amt;
        else if (e.type === 'OUT') totalOut += amt;
    });
    const net = totalIn - totalOut;

    const printWin = window.open('', '_blank', 'width=950,height=750');
    if (!printWin) {
        window.print();
        return;
    }

    const tableRows = entries.map((e, idx) => `
        <tr>
            <td style="padding:6px 8px; border-bottom:1px solid #e2e8f0; font-size:12px;">${idx + 1}</td>
            <td style="padding:6px 8px; border-bottom:1px solid #e2e8f0; font-size:12px;">${e.date} ${e.time || ''}</td>
            <td style="padding:6px 8px; border-bottom:1px solid #e2e8f0; font-size:12px; font-weight:bold; color:${e.type === 'IN' ? '#16a34a' : '#dc2626'};">${e.type === 'IN' ? 'INFLOW' : 'OUTFLOW'}</td>
            <td style="padding:6px 8px; border-bottom:1px solid #e2e8f0; font-size:12px; font-family:monospace;">${escapeHtml(e.refNo)}</td>
            <td style="padding:6px 8px; border-bottom:1px solid #e2e8f0; font-size:12px;"><strong>${escapeHtml(e.category)}</strong><br><small style="color:#64748b;">${escapeHtml(e.remarks || '')}</small></td>
            <td style="padding:6px 8px; border-bottom:1px solid #e2e8f0; font-size:12px;">${escapeHtml(e.entity)}</td>
            <td style="padding:6px 8px; border-bottom:1px solid #e2e8f0; font-size:12px;">${escapeHtml(e.method || 'Cash')}</td>
            <td style="padding:6px 8px; border-bottom:1px solid #e2e8f0; font-size:12px; text-align:right; font-weight:bold; color:${e.type === 'IN' ? '#16a34a' : '#dc2626'};">&#8369;${formatNumber(e.amount)}</td>
        </tr>
    `).join('');

    printWin.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>MDSJFI - Daily Cash Flow Summary Report</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 24px; color: #1e293b; }
                .header { text-align: center; border-bottom: 2px solid #0b2545; padding-bottom: 12px; margin-bottom: 18px; }
                .header h2 { margin: 0; color: #0b2545; font-size: 20px; text-transform: uppercase; }
                .header p { margin: 4px 0 0 0; font-size: 13px; color: #64748b; }
                .summary-cards { display: flex; justify-content: space-between; gap: 12px; margin-bottom: 18px; }
                .card { flex: 1; border: 1px solid #cbd5e1; border-radius: 6px; padding: 10px 14px; text-align: center; }
                .card h4 { margin: 0; font-size: 11px; text-transform: uppercase; color: #64748b; }
                .card p { margin: 6px 0 0 0; font-size: 18px; font-weight: bold; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
                th { background: #f1f5f9; padding: 8px; font-size: 11px; text-transform: uppercase; text-align: left; border-bottom: 2px solid #cbd5e1; }
                .footer { display: flex; justify-content: space-between; margin-top: 40px; font-size: 12px; }
                .sig-box { text-align: center; width: 220px; border-top: 1px solid #000; padding-top: 6px; }
            </style>
        </head>
        <body>
            <div class="header">
                <h2>Montessori de San Jose Foundation Inc.</h2>
                <p>0696 P. Burgos St., Brgy. Pag-asa, San Jose, Occidental Mindoro &bull; Recognized by the Department of Education</p>
                <h3 style="margin: 8px 0 0 0; color: #134074; font-size: 16px;">DAILY CASH IN AND OUT FLOW JOURNAL REPORT</h3>
                <p style="font-size: 11px; color: #64748b;">Generated on: ${new Date().toLocaleString()}</p>
            </div>

            <div class="summary-cards">
                <div class="card" style="border-top: 3px solid #16a34a;">
                    <h4>Total Cash Inflow</h4>
                    <p style="color: #16a34a;">&#8369;${formatNumber(totalIn)}</p>
                </div>
                <div class="card" style="border-top: 3px solid #dc2626;">
                    <h4>Total Cash Outflow</h4>
                    <p style="color: #dc2626;">&#8369;${formatNumber(totalOut)}</p>
                </div>
                <div class="card" style="border-top: 3px solid #0284c7;">
                    <h4>Net Cash Balance</h4>
                    <p style="color: ${net >= 0 ? '#15803d' : '#dc2626'};">&#8369;${formatNumber(net)}</p>
                </div>
                <div class="card" style="border-top: 3px solid #64748b;">
                    <h4>Total Transactions</h4>
                    <p style="color: #1e293b;">${entries.length}</p>
                </div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th style="width: 30px;">#</th>
                        <th style="width: 120px;">Date &amp; Time</th>
                        <th style="width: 75px;">Type</th>
                        <th style="width: 100px;">Ref / OR #</th>
                        <th>Category / Particulars</th>
                        <th style="width: 180px;">Payer / Payee</th>
                        <th style="width: 80px;">Method</th>
                        <th style="width: 100px; text-align: right;">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    ${tableRows}
                </tbody>
            </table>

            <div class="footer" style="display: flex; justify-content: space-between; margin-top: 45px; font-size: 12px; gap: 20px;">
                <div class="sig-box" style="text-align: center; flex: 1; border-top: 1.5px solid #0f172a; padding-top: 6px;">
                    <strong>Prepared &amp; Encoded By:</strong><br><br>
                    <span style="font-weight: bold; font-size: 13px;">CARRELLE B. COLEGADO</span><br>
                    <small style="color: #64748b;">Registrar / In-Charge</small>
                </div>
                <div class="sig-box" style="text-align: center; flex: 1; border-top: 1.5px solid #0f172a; padding-top: 6px;">
                    <strong>Checked &amp; Audited By:</strong><br><br>
                    <span style="font-weight: bold; font-size: 13px;">ACCOUNTING</span><br>
                    <small style="color: #64748b;">Accounting Office</small>
                </div>
                <div class="sig-box" style="text-align: center; flex: 1; border-top: 1.5px solid #0f172a; padding-top: 6px;">
                    <strong>Approved &amp; Certified Official:</strong><br><br>
                    <span style="font-weight: bold; font-size: 13px;">NIÑO ALOYSIUS B. COLEGADO</span><br>
                    <small style="color: #64748b;">School President</small>
                </div>
            </div>
            <script>
                window.onload = function() { window.print(); };
            </script>
        </body>
        </html>
    `);
    printWin.document.close();
}

function printCashFlowVoucher(id) {
    const entries = getCashFlowEntries();
    const item = entries.find(e => e.id === id);
    if (!item) return;

    const printWin = window.open('', '_blank', 'width=750,height=550');
    if (!printWin) return;

    const isIn = item.type === 'IN';
    const docTitle = isIn ? 'OFFICIAL CASH RECEIPT VOUCHER' : 'CASH DISBURSEMENT VOUCHER';
    const badgeColor = isIn ? '#16a34a' : '#dc2626';

    printWin.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>${docTitle} - ${escapeHtml(item.refNo)}</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 30px; color: #1e293b; }
                .voucher-card { border: 2px solid #cbd5e1; border-radius: 10px; padding: 24px; position: relative; }
                .header { text-align: center; border-bottom: 1.5px solid #0b2545; padding-bottom: 12px; margin-bottom: 16px; }
                .header h3 { margin: 0; color: #0b2545; font-size: 18px; }
                .header p { margin: 4px 0 0 0; font-size: 12px; color: #64748b; }
                .doc-badge { display: inline-block; background: ${badgeColor}; color: #fff; padding: 4px 12px; border-radius: 12px; font-weight: bold; font-size: 12px; margin-top: 8px; }
                .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #e2e8f0; font-size: 13px; }
                .row .label { color: #64748b; font-weight: 600; width: 180px; }
                .row .val { color: #0f172a; font-weight: bold; flex: 1; }
                .amount-highlight { font-size: 18px; color: ${badgeColor}; }
                .footer { display: flex; justify-content: space-between; margin-top: 45px; font-size: 12px; }
                .sig-box { text-align: center; width: 200px; border-top: 1px solid #000; padding-top: 4px; }
            </style>
        </head>
        <body>
            <div class="voucher-card">
                <div class="header">
                    <h3>MONTESSORI DE SAN JOSE FOUNDATION INC.</h3>
                    <p>0696 P. Burgos St., Brgy. Pag-asa, San Jose, Occidental Mindoro &bull; DepEd Recognized Official Transaction Voucher</p>
                    <div class="doc-badge">${docTitle}</div>
                </div>

                <div class="row">
                    <span class="label">Reference / OR No.:</span>
                    <span class="val" style="font-family: monospace;">${escapeHtml(item.refNo)}</span>
                </div>
                <div class="row">
                    <span class="label">Date &amp; Time:</span>
                    <span class="val">${item.date} at ${item.time || ''}</span>
                </div>
                <div class="row">
                    <span class="label">${isIn ? 'Received From:' : 'Paid To:'}</span>
                    <span class="val">${escapeHtml(item.entity)}</span>
                </div>
                <div class="row">
                    <span class="label">Particulars / Category:</span>
                    <span class="val">${escapeHtml(item.category)}</span>
                </div>
                <div class="row">
                    <span class="label">Payment Method:</span>
                    <span class="val">${escapeHtml(item.method || 'Cash')}</span>
                </div>
                <div class="row">
                    <span class="label">Remarks / Description:</span>
                    <span class="val">${escapeHtml(item.remarks || 'None')}</span>
                </div>
                <div class="row" style="border-bottom: 2px solid #0f172a; padding: 12px 0;">
                    <span class="label" style="font-size: 15px;">TOTAL AMOUNT:</span>
                    <span class="val amount-highlight">&#8369;${formatNumber(item.amount)}</span>
                </div>

                <div class="footer">
                    <div class="sig-box">
                        <strong>Encoded By:</strong><br><br>
                        <span>${escapeHtml(item.encoder || 'Registrar Staff')}</span>
                    </div>
                    <div class="sig-box">
                        <strong>Approved / Received By:</strong><br><br>
                        <span>Official Signatory</span>
                    </div>
                </div>
            </div>
            <script>
                window.onload = function() { window.print(); };
            </script>
        </body>
        </html>
    `);
    printWin.document.close();
}

function handleImportCashFlowClick() {
    if (typeof isTeacher === 'function' && isTeacher()) {
        showToast('Access Restricted: Teachers cannot import cash transactions.', 'warning');
        return;
    }
    const input = document.getElementById('cashFlowFileInput');
    if (input) input.click();
}

function importCashFlowFile(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const content = e.target.result;
            const imported = parseCashFlowCsv(content);
            if (!imported || imported.length === 0) {
                showToast('No valid cash flow transactions recognized in file.', 'warning');
                return;
            }

            const current = getCashFlowEntries();
            const existingRefs = new Set(current.map(c => `${c.type}_${c.refNo}_${c.date}`));
            let addedCount = 0;

            imported.forEach(item => {
                const key = `${item.type}_${item.refNo}_${item.date}`;
                if (!existingRefs.has(key)) {
                    current.push(item);
                    existingRefs.add(key);
                    addedCount++;
                }
            });

            // Sort descending by date
            current.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
            saveCashFlowEntries(current);
            refreshCashFlowPage();

            if (typeof logActivity === 'function') {
                logActivity('Cash Flow Import', `Imported ${addedCount} transactions from ${file.name}`);
            }

            showToast(`Successfully imported ${addedCount} new cash flow transactions!`, 'success');
        } catch (err) {
            console.error('Import cash flow error:', err);
            showToast('Failed to process cash flow file: ' + err.message, 'error');
        } finally {
            event.target.value = '';
        }
    };
    reader.readAsText(file);
}

function parseCashFlowCsv(raw) {
    const lines = raw.split(/\r?\n/);
    const parsed = [];
    let section = 'ALL';

    const parseRow = (line) => {
        const res = [];
        let cur = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            const c = line[i];
            if (c === '"') {
                if (inQuotes && line[i + 1] === '"') {
                    cur += '"';
                    i++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (c === ',' && !inQuotes) {
                res.push(cur.trim());
                cur = '';
            } else {
                cur += c;
            }
        }
        res.push(cur.trim());
        return res;
    };

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        if (line.includes('MDSJFI DAILY CASH INFLOW TRACKER')) {
            section = 'IN';
            continue;
        }
        if (line.includes('MDSJFI DAILY CASH OUTFLOW')) {
            section = 'OUT';
            continue;
        }

        const cols = parseRow(line);

        // Standard Exported CSV format
        if (cols.length >= 9 && (cols[3] === 'Cash In (Collection)' || cols[3] === 'Cash Out (Disbursement)' || cols[3] === 'IN' || cols[3] === 'OUT')) {
            const flowType = (cols[3].includes('In') || cols[3] === 'IN') ? 'IN' : 'OUT';
            const amt = parseFloat((cols[8] || '0').replace(/,/g, '')) || 0;
            if (amt > 0) {
                parsed.push({
                    id: cols[0] || ('CF-' + Date.now() + '-' + parsed.length),
                    type: flowType,
                    date: cols[1] || new Date().toISOString().split('T')[0],
                    time: cols[2] || '08:00 AM',
                    refNo: cols[4] || 'N/A',
                    category: cols[5] || 'General',
                    entity: cols[6] || 'N/A',
                    method: cols[7] || 'Cash',
                    amount: amt,
                    encoder: cols[9] || 'Registrar Staff',
                    remarks: cols[10] || '',
                    createdAt: (cols[1] || new Date().toISOString().split('T')[0]) + 'T08:00:00.000Z'
                });
            }
            continue;
        }

        // Multi-tracker Inflow template format
        if (section === 'IN' || (!line.includes('MDSJFI DAILY CASH') && cols[0] && cols[0].startsWith('2026-') && cols.length >= 11 && !cols[1].startsWith('DV-'))) {
            if (cols[0] && cols[0].startsWith('202')) {
                const dateClean = cols[0].replace('2026-06-026', '2026-06-26').replace('2026-0615', '2026-06-15');
                const amt = parseFloat((cols[10] || '0').replace(/,/g, '')) || 0;
                if (amt > 0) {
                    const grade = cols[4] || '';
                    const remarks = [cols[7] || '', grade ? `(${grade})` : '', cols[14] || ''].filter(Boolean).join(' - ');
                    parsed.push({
                        id: 'CF-IN-' + Date.now() + '-' + parsed.length,
                        type: 'IN',
                        date: dateClean,
                        time: '08:30 AM',
                        category: cols[6] || 'Tuition / Fee Collection',
                        refNo: cols[1] || 'OR-N/A',
                        entity: cols[3] || 'Student / Payor',
                        amount: amt,
                        method: cols[8] || 'Cash',
                        remarks: remarks,
                        encoder: cols[13] || 'Rea Mea Asong',
                        createdAt: dateClean + 'T08:30:00.000Z'
                    });
                }
            }
        } else if (section === 'OUT' || (cols[0] && cols[0].startsWith('2026-') && cols[1] && cols[1].startsWith('DV-'))) {
            // Multi-tracker Outflow template format
            if (cols[0] && cols[0].startsWith('202')) {
                const amt = parseFloat((cols[7] || '0').replace(/,/g, '')) || 0;
                if (amt > 0) {
                    const remParts = [cols[4] || '', cols[9] ? `Paid by ${cols[9]}` : '', cols[8] ? `Approved by ${cols[8]}` : ''].filter(Boolean);
                    parsed.push({
                        id: 'CF-OUT-' + Date.now() + '-' + parsed.length,
                        type: 'OUT',
                        date: cols[0],
                        time: '09:00 AM',
                        category: cols[3] || 'School Expenses',
                        refNo: cols[1] || 'DV-N/A',
                        entity: cols[2] || 'Payee / Supplier',
                        amount: amt,
                        method: cols[5] || 'Cash',
                        remarks: remParts.join(' | '),
                        encoder: cols[9] || 'Cashier',
                        createdAt: cols[0] + 'T09:00:00.000Z'
                    });
                }
            }
        }
    }
    return parsed;
}

window.handleImportCashFlowClick = handleImportCashFlowClick;
window.importCashFlowFile = importCashFlowFile;
window.openNewCashFlowModal = openNewCashFlowModal;
window.closeCashFlowModal = closeCashFlowModal;
window.onCashFlowTypeSelectChange = onCashFlowTypeSelectChange;
window.onCashFlowPayerTypeChange = onCashFlowPayerTypeChange;
window.onCashFlowStudentSelectChange = onCashFlowStudentSelectChange;
window.populateCashFlowStudentDropdown = populateCashFlowStudentDropdown;
window.handleSaveCashFlow = handleSaveCashFlow;
window.refreshCashFlowPage = refreshCashFlowPage;
window.filterCashFlow = filterCashFlow;
window.setCashFlowDateQuick = setCashFlowDateQuick;
window.deleteCashFlowEntry = deleteCashFlowEntry;
window.exportCashFlowCSV = exportCashFlowCSV;
window.printCashFlowReport = printCashFlowReport;
window.printCashFlowVoucher = printCashFlowVoucher;

// ======================== EXAMINATION CLEARANCE ENGINE & OVERRIDES ========================

function getExamOverrides() {
    try {
        const raw = localStorage.getItem('mdsj_exam_overrides');
        if (raw !== null) {
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed === 'object') {
                return parsed;
            }
        }
        // Seed default promissory notes and exam overrides for learners with outstanding balances ONLY on first initial launch
        const defaultOverrides = {
            "STU-2026-07001": {
                status: "OVERRIDDEN",
                reason: "Promissory Note Filed (Approved by Administration)",
                authorizedBy: "NIÑO ALOYSIUS B. COLEGADO (School President)",
                dueDate: "2026-11-15",
                notes: "Parent promised to settle remaining ₱500 balance on or before Nov 15, 2026.",
                updatedAt: "2026-10-24T08:00:00.000Z",
                dateStr: "2026-10-24"
            },
            "STU-2026-07002": {
                status: "OVERRIDDEN",
                reason: "Learner Made Partial Payment",
                authorizedBy: "CARRELLE B. COLEGADO (Registrar / Accounting)",
                dueDate: "2026-11-20",
                notes: "Partial payment made. Remaining ₱2,500 to be settled in 2 installments.",
                updatedAt: "2026-10-24T08:00:00.000Z",
                dateStr: "2026-10-24"
            },
            "STU-2026-10010": {
                status: "OVERRIDDEN",
                reason: "Promissory Note Filed (Approved by Administration)",
                authorizedBy: "CARRELLE B. COLEGADO (Registrar / Accounting)",
                dueDate: "2026-11-10",
                notes: "Official promissory note signed by parents on file at Registrar office.",
                updatedAt: "2026-10-24T08:00:00.000Z",
                dateStr: "2026-10-24"
            }
        };
        saveExamOverrides(defaultOverrides);
        return defaultOverrides;
    } catch(e) {
        return {};
    }
}

function saveExamOverrides(overrides) {
    try {
        localStorage.setItem('mdsj_exam_overrides', JSON.stringify(overrides));
    } catch(e) {
        console.error('Error saving exam clearance overrides:', e);
    }
}

function getStudentExamOverride(studentId) {
    if (!studentId) return null;
    const overrides = getExamOverrides();
    const rawId = String(studentId).trim();
    const cleanId = rawId.replace(/^STU-/, '');
    if (overrides[rawId]) return overrides[rawId];
    if (overrides[cleanId]) return overrides[cleanId];
    if (overrides['STU-' + cleanId]) return overrides['STU-' + cleanId];
    const s = findStudent(studentId);
    if (s && s.studentNumber && overrides[s.studentNumber]) return overrides[s.studentNumber];
    if (s && s.lrn && overrides[s.lrn]) return overrides[s.lrn];
    return (s && s.examOverride) ? s.examOverride : null;
}

function getClearanceRosterData() {
    const syFilter = document.getElementById('clearanceFilterSy');
    const selectedSy = syFilter ? syFilter.value : (currentSchoolYear || '2026-2027');

    let cohort = (students || []).filter(s => s.enrollmentStatus !== 'Inactive' && s.enrollmentStatus !== 'Transferred' && s.enrollmentStatus !== 'Dropped');
    if (selectedSy && selectedSy !== 'ALL') {
        cohort = cohort.filter(s => (s.schoolYear || '2026-2027') === selectedSy);
    }

    const overrides = getExamOverrides();

    return cohort.map(s => {
        const tuition = Number(s.tuitionFee) || DEFAULT_BASE_TUITION;
        const isEsc = (s.escGrantee === 'YES');
        const isDisc = (isEsc || s.isDiscounted === 'YES');
        const discount = (s.isDiscounted === 'YES' && Number(s.discountAmount) > 0)
            ? Number(s.discountAmount)
            : (isEsc ? 9000 : 0);
        const net = Math.max(0, tuition - discount);
        const payments = Array.isArray(s.payments) ? s.payments : [];
        const totalPaid = payments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
        const remainingBalance = Math.max(0, net - totalPaid);

        // Clearance rule: A learner is CLEARED if remainingBalance === 0 OR authorized override exists
        const sRawId = String(s.id || '').trim();
        const sCleanId = sRawId.replace(/^STU-/, '');
        const override = overrides[sRawId] || overrides[sCleanId] || overrides['STU-' + sCleanId] || (s.studentNumber && (overrides[s.studentNumber] || overrides['STU-' + String(s.studentNumber).replace(/^STU-/, '')])) || s.examOverride || null;
        const isOverridden = Boolean(override && override.status === 'OVERRIDDEN');
        const isCleared = (remainingBalance === 0) || isOverridden;

        return {
            student: s,
            id: s.id,
            lrn: s.lrn,
            fullName: `${s.lastName || ''}, ${s.firstName || ''} ${s.middleName || ''}`.trim(),
            gradeLevel: s.gradeLevel,
            section: s.section,
            schoolYear: s.schoolYear || '2026-2027',
            isEsc: isEsc,
            tuition: tuition,
            discount: discount,
            netTuition: net,
            totalPaid: totalPaid,
            remainingBalance: remainingBalance,
            isCleared: isCleared,
            isOverridden: isOverridden,
            override: override
        };
    });
}

function refreshClearancePage() {
    const data = getClearanceRosterData();
    const totalCount = data.length;
    const clearedCount = data.filter(d => d.isCleared).length;
    const pendingCount = totalCount - clearedCount;
    const clearanceRate = totalCount > 0 ? Math.round((clearedCount / totalCount) * 100) : 0;
    const promissoryCount = data.filter(d => d.isOverridden).length;

    const elTotal = document.getElementById('statClearanceTotal');
    const elCleared = document.getElementById('statClearanceCleared');
    const elPending = document.getElementById('statClearancePending');
    const elRate = document.getElementById('statClearanceRate');
    const elSySub = document.getElementById('statClearanceSySub');
    const syFilter = document.getElementById('clearanceFilterSy');
    const badgeAll = document.getElementById('badgeClearanceAllCount');
    const badgePromissory = document.getElementById('badgeClearancePromissoryCount');

    if (elTotal) elTotal.textContent = totalCount;
    if (elCleared) elCleared.textContent = clearedCount;
    if (elPending) elPending.textContent = pendingCount;
    if (elRate) elRate.textContent = clearanceRate + '%';
    if (badgeAll) badgeAll.textContent = totalCount;
    if (badgePromissory) badgePromissory.textContent = promissoryCount;

    if (elSySub && syFilter) {
        const qVal = document.getElementById('clearanceFilterQuarter')?.value || '4th';
        elSySub.textContent = (syFilter.value === 'ALL') ? `${qVal} Quarter &bull; All School Years` : `${qVal} Qtr &bull; S.Y. ${syFilter.value}`;
    }

    filterClearanceTable();
    renderPromissoryClearanceTable();
}

function switchClearanceSubTab(tabName) {
    const btnAll = document.getElementById('tabBtnClearanceAll');
    const btnPromissory = document.getElementById('tabBtnClearancePromissory');
    const contAll = document.getElementById('clearanceAllTabContainer');
    const contPromissory = document.getElementById('clearancePromissoryTabContainer');
    const actPromissory = document.getElementById('promissoryTabActionContainer');

    if (tabName === 'promissory') {
        if (btnAll) {
            btnAll.classList.remove('active');
            btnAll.style.background = '#f1f5f9';
            btnAll.style.color = '#475569';
        }
        if (btnPromissory) {
            btnPromissory.classList.add('active');
            btnPromissory.style.background = '#0b2545';
            btnPromissory.style.color = '#fff';
        }
        if (contAll) {
            contAll.classList.add('tab-hidden');
            contAll.style.display = 'none';
        }
        if (contPromissory) {
            contPromissory.classList.remove('tab-hidden');
            contPromissory.style.display = 'flex';
        }
        if (actPromissory) actPromissory.style.display = 'block';
        renderPromissoryClearanceTable();
    } else {
        if (btnAll) {
            btnAll.classList.add('active');
            btnAll.style.background = '#0b2545';
            btnAll.style.color = '#fff';
        }
        if (btnPromissory) {
            btnPromissory.classList.remove('active');
            btnPromissory.style.background = '#f1f5f9';
            btnPromissory.style.color = '#475569';
        }
        if (contAll) {
            contAll.classList.remove('tab-hidden');
            contAll.style.display = 'flex';
        }
        if (contPromissory) {
            contPromissory.classList.add('tab-hidden');
            contPromissory.style.display = 'none';
        }
        if (actPromissory) actPromissory.style.display = 'none';
        filterClearanceTable();
    }
}

function getCountdownBadge(dueDateStr) {
    if (!dueDateStr) {
        return '<span class="badge" style="background:#f1f5f9; color:#64748b; font-size:0.63rem; padding:1.5px 4px; border-radius:3px; font-weight:600;"><i class="fas fa-calendar-minus"></i> Prior to Exam</span>';
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const parts = dueDateStr.split('-');
    if (parts.length !== 3) {
        return `<span class="badge" style="background:#e0f2fe; color:#0369a1; font-size:0.63rem; padding:1.5px 4px; border-radius:3px;">${escapeHtml(dueDateStr)}</span>`;
    }
    const target = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 1) {
        return `<span class="badge" style="background:#fef3c7; color:#92400e; font-size:0.63rem; padding:1.5px 5px; border-radius:3px; font-weight:700; border:1px solid #fde68a; display:inline-flex; align-items:center; gap:3px;"><i class="fas fa-hourglass-half" style="color:#d97706; font-size:0.60rem;"></i> ${diffDays}d left</span>`;
    } else if (diffDays === 1) {
        return `<span class="badge" style="background:#ffedd5; color:#c2410c; font-size:0.63rem; padding:1.5px 5px; border-radius:3px; font-weight:700; border:1px solid #fed7aa; display:inline-flex; align-items:center; gap:3px;"><i class="fas fa-exclamation-circle" style="color:#ea580c; font-size:0.60rem;"></i> Due Tomorrow</span>`;
    } else if (diffDays === 0) {
        return `<span class="badge badge-due-today" style="background:#fee2e2; color:#b91c1c; font-size:0.63rem; padding:1.5px 5px; border-radius:3px; font-weight:700; border:1px solid #fca5a5; display:inline-flex; align-items:center; gap:3px;"><i class="fas fa-bell" style="color:#dc2626; font-size:0.60rem;"></i> Due Today</span>`;
    } else {
        const overdueDays = Math.abs(diffDays);
        return `<span class="badge" style="background:#7f1d1d; color:#fee2e2; font-size:0.63rem; padding:1.5px 5px; border-radius:3px; font-weight:700; display:inline-flex; align-items:center; gap:3px;"><i class="fas fa-exclamation-triangle" style="color:#f87171; font-size:0.60rem;"></i> ${overdueDays}d overdue</span>`;
    }
}

function renderPromissoryClearanceTable() {
    const tbody = document.getElementById('promissoryTableBody');
    if (!tbody) return;

    const data = getClearanceRosterData();
    const searchVal = (document.getElementById('clearanceSearchInput')?.value || '').toLowerCase().trim();
    const gradeVal = document.getElementById('clearanceFilterGrade')?.value || '';

    const promissoryList = data.filter(item => {
        if (!item.isOverridden) return false;
        if (gradeVal && String(item.gradeLevel) !== String(gradeVal)) return false;
        if (searchVal) {
            const str = `${item.fullName} ${item.lrn} ${item.gradeLevel} ${item.section} ${(item.override && item.override.reason) || ''}`.toLowerCase();
            if (!str.includes(searchVal)) return false;
        }
        return true;
    });

    if (promissoryList.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="10" style="text-align: center; padding: 40px 16px; color: #64748b;">
                    <i class="fas fa-handshake-slash" style="font-size: 2.2rem; color: #94a3b8; display: block; margin-bottom: 10px;"></i>
                    <strong style="font-size:0.95rem; color:#1e293b;">No Promissory Notes or Clearance Overrides on File</strong>
                    <p style="font-size: 0.85rem; margin-top: 4px; max-width:540px; margin-left:auto; margin-right:auto;">
                        When an Admin (School President) or Registrar grants an examination clearance override or records a promissory agreement for a learner with an outstanding balance, they will appear here with live countdown tracking.
                    </p>
                </td>
            </tr>
        `;
        return;
    }

    const isUserTeacher = (typeof isTeacher === 'function' && isTeacher());

    tbody.innerHTML = promissoryList.map((item, idx) => {
        const ov = item.override || {};
        const countdownHtml = getCountdownBadge(ov.dueDate);

        let actionBtns = `
            <button type="button" class="btn-icon soa" onclick="openSOAModal('${item.id}')" title="View Statement of Account" style="background:#ecfdf5; color:#15803d; width:24px; height:24px; border-radius:4px; font-size:0.70rem; margin:0 2px;">
                <i class="fas fa-file-invoice-dollar"></i>
            </button>
        `;

        if (!isUserTeacher) {
            actionBtns += `
                <button type="button" class="btn-icon edit" onclick="openClearanceOverrideModal('${item.id}')" title="Edit Override Terms or Promised Date" style="background:#fef3c7; color:#d97706; width:24px; height:24px; border-radius:4px; font-size:0.70rem; margin:0 2px;">
                    <i class="fas fa-user-edit"></i>
                </button>
                <button type="button" class="btn-icon delete" onclick="revokeClearanceOverrideById('${item.id}')" title="Revoke Clearance Override (Admin Authorization Required)" style="background:#fee2e2; color:#dc2626; width:24px; height:24px; border-radius:4px; font-size:0.70rem; margin:0 2px;">
                    <i class="fas fa-trash-alt"></i>
                </button>
            `;
        }

        return `
            <tr>
                <td style="color:#64748b; font-size:0.78rem; font-weight:600; text-align:center;">${idx + 1}</td>
                <td>
                    <div style="font-weight:700; color:#0b2545; font-size:0.80rem; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${escapeHtml(item.fullName)}">${escapeHtml(item.fullName)}</div>
                    <div style="font-size:0.71rem; color:#64748b; font-family:monospace; margin-top:1px;">LRN: ${escapeHtml(item.lrn)}</div>
                </td>
                <td style="text-align:center;">
                    <span class="badge-grade" style="font-weight:600; font-size:0.72rem; white-space:nowrap; padding:2px 6px;">Grade ${escapeHtml(item.gradeLevel)} - ${escapeHtml(item.section)}</span>
                </td>
                <td class="text-right text-danger" style="font-weight:700; font-size:0.80rem;">
                    &#8369;${formatNumber(item.remainingBalance)}
                </td>
                <td style="overflow:hidden;">
                    <span style="display:inline-block; max-width:100%; padding:2.5px 6px; border-radius:4px; background:#fef3c7; color:#92400e; font-weight:700; font-size:0.72rem; border:1px solid #fde68a; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; box-sizing:border-box; vertical-align:middle;" title="${escapeHtml(ov.reason || 'Promissory Note Filed')}">
                        <i class="fas fa-file-signature"></i> ${escapeHtml(ov.reason || 'Promissory Note Filed')}
                    </span>
                </td>
                <td style="overflow:hidden;">
                    <div style="font-weight:600; font-size:0.75rem; color:#1e293b; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${escapeHtml(ov.authorizedBy || 'Administration')}">
                        <i class="fas fa-user-check" style="color:#0284c7; margin-right:3px; font-size:0.70rem;"></i>${escapeHtml(ov.authorizedBy || 'Administration')}
                    </div>
                    <div style="font-size:0.68rem; color:#64748b; margin-top:1px;">Granted: ${escapeHtml(ov.dateStr || '—')}</div>
                </td>
                <td style="font-weight:600; font-size:0.75rem; color:#0f172a; white-space:nowrap; text-align:center;">
                    ${ov.dueDate ? `<i class="fas fa-calendar-day" style="color:#0284c7; margin-right:3px; font-size:0.70rem;"></i>${escapeHtml(ov.dueDate)}` : '<span style="color:#94a3b8; font-style:italic;">Before Exams</span>'}
                </td>
                <td style="text-align:center;">
                    ${countdownHtml}
                </td>
                <td>
                    <div style="font-size:0.73rem; color:#334155; line-height:1.2; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${escapeHtml(ov.notes || 'No remarks')}">
                        ${escapeHtml(ov.notes || 'No remarks')}
                    </div>
                </td>
                <td class="text-center actions-cell" style="white-space:nowrap !important; overflow:visible !important;">
                    ${actionBtns}
                </td>
            </tr>
        `;
    }).join('');
}

function filterClearanceTable() {
    const tbody = document.getElementById('clearanceTableBody');
    if (!tbody) return;

    const data = getClearanceRosterData();
    const searchVal = (document.getElementById('clearanceSearchInput')?.value || '').toLowerCase().trim();
    const gradeVal = document.getElementById('clearanceFilterGrade')?.value || '';
    const statusVal = document.getElementById('clearanceFilterStatus')?.value || 'ALL';

    const filtered = data.filter(item => {
        if (gradeVal && String(item.gradeLevel) !== String(gradeVal)) return false;
        if (statusVal === 'CLEARED' && !item.isCleared) return false;
        if (statusVal === 'PENDING' && item.isCleared) return false;
        if (searchVal) {
            const str = `${item.fullName} ${item.lrn} ${item.gradeLevel} ${item.section}`.toLowerCase();
            if (!str.includes(searchVal)) return false;
        }
        return true;
    });

    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" style="text-align: center; padding: 36px 16px; color: #64748b;">
                    <i class="fas fa-clipboard-list" style="font-size: 2rem; color: #94a3b8; display: block; margin-bottom: 8px;"></i>
                    <strong>No students found for this clearance criteria</strong>
                    <p style="font-size: 0.85rem; margin-top: 4px;">Try clearing filters or search term.</p>
                </td>
            </tr>
        `;
        return;
    }

    const isUserTeacher = (typeof isTeacher === 'function' && isTeacher());

    tbody.innerHTML = filtered.map((item, idx) => {
        const escBadge = item.isEsc
            ? '<span class="status-badge" style="background:#dcfce7; color:#15803d; font-weight:700; font-size:0.63rem; padding:1.5px 4px;"><i class="fas fa-award"></i> ESC</span>'
            : '<span class="status-badge" style="background:#f1f5f9; color:#64748b; font-size:0.63rem; padding:1.5px 4px;">Non-ESC</span>';

        let clearanceBadge = '';
        if (item.remainingBalance === 0) {
            clearanceBadge = `
                <span class="status-badge" style="background:#dcfce7; color:#15803d; font-weight:800; font-size:0.64rem; padding:1.5px 5px; border-radius:4px; border:1px solid #86efac; display:inline-flex; align-items:center; gap:3px; white-space:nowrap;" title="Full Tuition Settled">
                    <i class="fas fa-check-circle" style="color:#16a34a; font-size:0.60rem;"></i> CLEARED
                </span>`;
        } else if (item.isOverridden) {
            const ov = item.override || {};
            const tip = `Override: ${ov.reason || 'Promissory Agreement'} | Authorized by: ${ov.authorizedBy || 'Administration'}${ov.dueDate ? ' | Due: ' + ov.dueDate : ''}`;
            clearanceBadge = `
                <span class="status-badge" style="background:#fef3c7; color:#92400e; font-weight:800; font-size:0.64rem; padding:1.5px 5px; border-radius:4px; border:1px solid #fde68a; display:inline-flex; align-items:center; gap:3px; white-space:nowrap;" title="${escHtml(tip)}">
                    <i class="fas fa-file-signature" style="color:#d97706; font-size:0.60rem;"></i> OVERRIDE
                </span>`;
        } else {
            clearanceBadge = `
                <span class="status-badge" style="background:#fee2e2; color:#b91c1c; font-weight:800; font-size:0.64rem; padding:1.5px 5px; border-radius:4px; border:1px solid #fca5a5; display:inline-flex; align-items:center; gap:3px; white-space:nowrap;" title="Balance: &#8369;${formatNumber(item.remainingBalance)}">
                    <i class="fas fa-times-circle" style="color:#dc2626; font-size:0.60rem;"></i> NOT CLEARED
                </span>`;
        }

        // Action buttons: SOA for all; Override buttons only for Admin and Registrar
        let overrideBtn = '';
        if (!isUserTeacher) {
            if (item.isOverridden) {
                overrideBtn = `
                    <button type="button" class="btn-icon edit" onclick="openClearanceOverrideModal('${item.id}')" title="Edit Override Terms or Promised Date" style="background:#fef3c7; color:#d97706; width:24px; height:24px; border-radius:4px; font-size:0.70rem; margin:0 2px;">
                        <i class="fas fa-user-edit"></i>
                    </button>
                    <button type="button" class="btn-icon delete" onclick="revokeClearanceOverrideById('${item.id}')" title="Revoke Clearance Override (Admin Authorization Required)" style="background:#fee2e2; color:#dc2626; width:24px; height:24px; border-radius:4px; font-size:0.70rem; margin:0 2px;">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                `;
            } else if (item.remainingBalance > 0) {
                overrideBtn = `
                    <button type="button" class="btn-icon" onclick="openClearanceOverrideModal('${item.id}')" title="Authorize Exam Clearance Override (Promissory Note / Partial Payment)" style="background:#e0f2fe; color:#0284c7; width:24px; height:24px; border-radius:4px; font-size:0.70rem; margin:0 2px;">
                        <i class="fas fa-user-shield"></i>
                    </button>
                `;
            }
        }

        return `
            <tr>
                <td style="color:#64748b; font-size:0.78rem; font-weight:600; text-align:center;">${idx + 1}</td>
                <td>
                    <div style="font-weight:700; color:#1e293b; font-size:0.80rem; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${escapeHtml(item.fullName)}">${escapeHtml(item.fullName)}</div>
                    <div style="font-size:0.71rem; color:#64748b; font-family:monospace; margin-top:1px;">LRN: ${escapeHtml(item.lrn)}</div>
                </td>
                <td style="text-align:center;">
                    <span class="badge-grade" style="font-weight:600; font-size:0.72rem; white-space:nowrap; padding:2px 6px;">Grade ${escapeHtml(item.gradeLevel)} - ${escapeHtml(item.section)}</span>
                </td>
                <td style="text-align:center;">${escBadge}</td>
                <td class="text-right" style="font-weight:600; color:#1e293b; font-size:0.80rem;">&#8369;${formatNumber(item.netTuition)}</td>
                <td class="text-right text-success" style="font-weight:700; font-size:0.80rem;">&#8369;${formatNumber(item.totalPaid)}</td>
                <td class="text-right text-danger" style="font-weight:700; font-size:0.80rem;">&#8369;${formatNumber(item.remainingBalance)}</td>
                <td style="text-align:center;">
                    ${clearanceBadge}
                </td>
                <td class="text-center actions-cell" style="white-space:nowrap !important; overflow:visible !important;">
                    <button type="button" class="btn-icon soa" onclick="openSOAModal('${item.id}')" title="View Student Statement of Account" style="background:#ecfdf5; color:#15803d; width:24px; height:24px; border-radius:4px; font-size:0.70rem; margin:0 2px;">
                        <i class="fas fa-file-invoice-dollar"></i>
                    </button>
                    ${overrideBtn}
                </td>
            </tr>
        `;
    }).join('');
}

// Clearance Override Modal Handlers
function openClearanceOverrideModal(studentId) {
    if (typeof isTeacher === 'function' && isTeacher()) {
        showToast('Access Restricted: Only School President and Registrar/Accounting accounts can override student exam clearance.', 'warning');
        return;
    }

    const s = findStudent(studentId);
    if (!s) {
        showToast('Student record not found.', 'error');
        return;
    }

    const tuition = Number(s.tuitionFee) || DEFAULT_BASE_TUITION;
    const isEsc = (s.escGrantee === 'YES');
    const discount = (s.isDiscounted === 'YES' && Number(s.discountAmount) > 0)
        ? Number(s.discountAmount)
        : (isEsc ? 9000 : 0);
    const net = Math.max(0, tuition - discount);
    const payments = Array.isArray(s.payments) ? s.payments : [];
    const totalPaid = payments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
    const remainingBalance = Math.max(0, net - totalPaid);

    const elId = document.getElementById('overrideStudentId');
    const elName = document.getElementById('overrideStudentName');
    const elLrn = document.getElementById('overrideStudentLrn');
    const elGradeSec = document.getElementById('overrideStudentGradeSection');
    const elSy = document.getElementById('overrideStudentSy');
    const elBal = document.getElementById('overrideStudentBalance');

    if (elId) elId.value = s.id;
    if (elName) elName.textContent = `${s.lastName || ''}, ${s.firstName || ''} ${s.middleName || ''}`.trim();
    if (elLrn) elLrn.textContent = s.lrn || '—';
    if (elGradeSec) elGradeSec.textContent = `Grade ${s.gradeLevel} - ${s.section}`;
    if (elSy) elSy.textContent = s.schoolYear || '2026-2027';
    if (elBal) elBal.innerHTML = `&#8369;${formatNumber(remainingBalance)}`;

    const existingOverride = getStudentExamOverride(s.id);
    const selReason = document.getElementById('overrideReason');
    const selAuth = document.getElementById('overrideAuthorizedBy');
    const inpDue = document.getElementById('overrideDueDate');
    const txtNotes = document.getElementById('overrideNotes');
    const btnRevoke = document.getElementById('btnRevokeClearanceOverride');
    const btnSave = document.getElementById('btnSaveClearanceOverride');

    // Pre-select current logged-in role
    let defaultAuth = 'CARRELLE B. COLEGADO (Registrar/Accounting)';
    try {
        const user = JSON.parse(localStorage.getItem('mdsj_current_user') || '{}');
        if (user && user.role === 'admin') {
            defaultAuth = 'NIÑO ALOYSIUS B. COLEGADO (School President)';
        }
    } catch(e) {}

    if (existingOverride && existingOverride.status === 'OVERRIDDEN') {
        if (selReason) selReason.value = existingOverride.reason || 'Promissory Note Filed';
        if (selAuth) selAuth.value = existingOverride.authorizedBy || defaultAuth;
        if (inpDue) inpDue.value = existingOverride.dueDate || '';
        if (txtNotes) txtNotes.value = existingOverride.notes || '';
        if (btnRevoke) btnRevoke.style.display = 'inline-flex';
        if (btnSave) btnSave.innerHTML = '<i class="fas fa-check-shield"></i> Update Clearance Override';
    } else {
        if (selReason) selReason.selectedIndex = 0;
        if (selAuth) selAuth.value = defaultAuth;
        if (inpDue) inpDue.value = '';
        if (txtNotes) txtNotes.value = '';
        if (btnRevoke) btnRevoke.style.display = 'none';
        if (btnSave) btnSave.innerHTML = '<i class="fas fa-check-shield"></i> Grant Clearance Override';
    }

    const modal = document.getElementById('clearanceOverrideModal');
    if (modal) {
        modal.style.display = 'flex';
        modal.classList.add('show', 'active');
    }
}

function closeClearanceOverrideModal() {
    const modal = document.getElementById('clearanceOverrideModal');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('show', 'active');
    }
}

function handleSaveClearanceOverride(e) {
    if (e && e.preventDefault) e.preventDefault();

    if (typeof isTeacher === 'function' && isTeacher()) {
        showToast('Access Restricted: Teachers cannot grant clearance overrides.', 'warning');
        return;
    }

    const studentId = document.getElementById('overrideStudentId')?.value;
    if (!studentId) return;

    const s = findStudent(studentId);
    if (!s) return;

    const reason = document.getElementById('overrideReason')?.value || 'Promissory Note Filed';
    const authorizedBy = document.getElementById('overrideAuthorizedBy')?.value || 'CARRELLE B. COLEGADO (Registrar/Accounting)';
    const dueDate = document.getElementById('overrideDueDate')?.value || '';
    const notes = document.getElementById('overrideNotes')?.value || '';

    const overrideObj = {
        status: 'OVERRIDDEN',
        studentId: s.id,
        lrn: s.lrn,
        reason: reason,
        authorizedBy: authorizedBy,
        dueDate: dueDate,
        notes: notes,
        createdAt: new Date().toISOString(),
        dateStr: new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })
    };

    // Save in storage map
    const overrides = getExamOverrides();
    overrides[s.id] = overrideObj;
    saveExamOverrides(overrides);

    // Also attach to student object
    s.examOverride = overrideObj;
    if (typeof saveStudents === 'function') saveStudents();

    // Audit Log
    if (typeof logActivity === 'function') {
        logActivity('Clearance Override Granted', `Authorized exam clearance for ${s.lastName}, ${s.firstName} (${reason} - Auth: ${authorizedBy})`, overrideObj);
    }

    closeClearanceOverrideModal();
    refreshClearancePage();
    showToast(`Exam clearance override granted for ${s.lastName}, ${s.firstName}.`, 'success');
}

function handleRevokeClearanceOverride() {
    const studentId = document.getElementById('overrideStudentId')?.value;
    if (!studentId) return;
    revokeClearanceOverrideById(studentId);
}

function revokeClearanceOverrideById(studentId) {
    if (typeof isTeacher === 'function' && isTeacher()) {
        showToast('Access Restricted: Teachers cannot revoke clearance overrides.', 'warning');
        return;
    }
    const s = findStudent(studentId);
    if (!s) {
        showToast('Student record not found.', 'error');
        return;
    }

    requestAdminAuth(() => {
        proceedRevokeClearanceOverride(s);
    }, 'Revoke Clearance Override', `Revoking the examination clearance override for ${s.lastName}, ${s.firstName} requires Administrator credentials verification.`, true);
}

function proceedRevokeClearanceOverride(s) {
    if (!confirm(`Are you sure you want to REVOKE the examination clearance override for ${s.lastName}, ${s.firstName}?`)) {
        return;
    }

    const overrides = getExamOverrides();
    const rawId = String(s.id || '').trim();
    const cleanId = rawId.replace(/^STU-/, '');

    // Delete all ID variants from overrides dictionary
    delete overrides[rawId];
    delete overrides[cleanId];
    delete overrides['STU-' + cleanId];
    if (s.studentNumber) {
        delete overrides[String(s.studentNumber).trim()];
        delete overrides['STU-' + String(s.studentNumber).replace(/^STU-/, '')];
    }
    if (s.lrn) delete overrides[String(s.lrn).trim()];

    saveExamOverrides(overrides);

    delete s.examOverride;
    s.examOverride = null;

    if (typeof students !== 'undefined' && Array.isArray(students)) {
        const found = students.find(st => st.id === s.id || st.studentNumber === s.studentNumber || (s.lrn && st.lrn === s.lrn));
        if (found) {
            delete found.examOverride;
            found.examOverride = null;
        }
    }
    if (typeof saveStudents === 'function') saveStudents();

    if (typeof logActivity === 'function') {
        logActivity('Clearance Override Revoked', `Revoked exam clearance override for ${s.lastName}, ${s.firstName}`, { studentId: s.id, lrn: s.lrn });
    }

    closeClearanceOverrideModal();
    refreshClearancePage();
    showToast(`Exam clearance override revoked for ${s.lastName}, ${s.firstName}.`, 'info');
}

function revokeAllClearanceOverrides() {
    if (typeof isTeacher === 'function' && isTeacher()) {
        showToast('Access Restricted: Teachers cannot revoke clearance overrides.', 'warning');
        return;
    }
    const overrides = getExamOverrides();
    const count = Object.keys(overrides).length;
    if (count === 0) {
        showToast('No active clearance overrides or promissory notes found to revoke.', 'info');
        return;
    }

    requestAdminAuth(() => {
        if (!confirm(`Are you sure you want to permanently REVOKE ALL (${count}) examination clearance overrides and promissory agreements?`)) {
            return;
        }

        saveExamOverrides({});

        if (typeof students !== 'undefined' && Array.isArray(students)) {
            students.forEach(st => {
                delete st.examOverride;
                st.examOverride = null;
            });
            if (typeof saveStudents === 'function') saveStudents();
        }

        if (typeof logActivity === 'function') {
            logActivity('All Clearance Overrides Revoked', `Revoked all ${count} exam clearance overrides & promissory agreements`, {});
        }

        refreshClearancePage();
        showToast(`All ${count} examination clearance overrides have been permanently revoked.`, 'info');
    }, 'Revoke All Clearance Overrides', 'Enter Administrator credentials (admin / admin123) to permanently revoke all examination clearance overrides.', true);
}

function exportClearanceCSV() {
    const data = getClearanceRosterData();
    if (!data || data.length === 0) {
        showToast('No student clearance records available to export.', 'warning');
        return;
    }

    const syVal = document.getElementById('clearanceFilterSy')?.value || currentSchoolYear || '2026-2027';
    const headers = ['#', 'LRN', 'Learner Full Name', 'Grade Level', 'Section', 'School Year', 'ESC Grantee', 'Net Tuition (PHP)', 'Total Paid (PHP)', 'Remaining Balance (PHP)', 'Exam Clearance Status', 'Override Details / Notes'];
    const rows = data.map((d, i) => {
        let statusText = 'NOT CLEARED (WITH BALANCE)';
        let overrideNotes = '';
        if (d.remainingBalance === 0) {
            statusText = 'CLEARED (PAID IN FULL)';
        } else if (d.isOverridden) {
            const ov = d.override || {};
            statusText = `CLEARED (OVERRIDE: ${ov.reason || 'Promissory Agreement'})`;
            overrideNotes = `Authorized by: ${ov.authorizedBy || ''}; Due: ${ov.dueDate || 'N/A'}; Notes: ${ov.notes || ''}`;
        }

        return [
            i + 1,
            `"${d.lrn || ''}"`,
            `"${d.fullName.replace(/"/g, '""')}"`,
            `"Grade ${d.gradeLevel}"`,
            `"${(d.section || '').replace(/"/g, '""')}"`,
            `"${d.schoolYear}"`,
            `"${d.isEsc ? 'YES' : 'NO'}"`,
            d.netTuition.toFixed(2),
            d.totalPaid.toFixed(2),
            d.remainingBalance.toFixed(2),
            `"${statusText}"`,
            `"${overrideNotes.replace(/"/g, '""')}"`
        ];
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `MDSJFI_Student_Clearance_Examination_Roster_${syVal}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast('Examination Clearance roster exported as CSV.', 'success');
}

function printClearanceRoster() {
    const data = getClearanceRosterData();
    const syVal = document.getElementById('clearanceFilterSy')?.value || currentSchoolYear || '2026-2027';
    const clearedCount = data.filter(d => d.isCleared).length;
    const pendingCount = data.length - clearedCount;

    const printWin = window.open('', '_blank', 'width=980,height=780');
    if (!printWin) {
        window.print();
        return;
    }

    const tableRows = data.map((d, idx) => {
        let statusLabel = 'NOT CLEARED';
        let statusColor = '#dc2626';
        if (d.remainingBalance === 0) {
            statusLabel = 'CLEARED (PAID)';
            statusColor = '#16a34a';
        } else if (d.isOverridden) {
            statusLabel = `CLEARED (${d.override?.reason || 'OVERRIDE'})`;
            statusColor = '#d97706';
        }

        return `
        <tr>
            <td style="padding:6px 8px; border-bottom:1px solid #e2e8f0; font-size:12px;">${idx + 1}</td>
            <td style="padding:6px 8px; border-bottom:1px solid #e2e8f0; font-size:12px; font-family:monospace;">${escapeHtml(d.lrn)}</td>
            <td style="padding:6px 8px; border-bottom:1px solid #e2e8f0; font-size:12px;"><strong>${escapeHtml(d.fullName)}</strong></td>
            <td style="padding:6px 8px; border-bottom:1px solid #e2e8f0; font-size:12px;">Grade ${escapeHtml(d.gradeLevel)} - ${escapeHtml(d.section)}</td>
            <td style="padding:6px 8px; border-bottom:1px solid #e2e8f0; font-size:12px;">${d.isEsc ? 'YES' : 'NO'}</td>
            <td style="padding:6px 8px; border-bottom:1px solid #e2e8f0; font-size:12px; text-align:right;">&#8369;${formatNumber(d.netTuition)}</td>
            <td style="padding:6px 8px; border-bottom:1px solid #e2e8f0; font-size:12px; text-align:right; color:#15803d; font-weight:bold;">&#8369;${formatNumber(d.totalPaid)}</td>
            <td style="padding:6px 8px; border-bottom:1px solid #e2e8f0; font-size:12px; text-align:right; color:#dc2626; font-weight:bold;">&#8369;${formatNumber(d.remainingBalance)}</td>
            <td style="padding:6px 8px; border-bottom:1px solid #e2e8f0; font-size:11px; text-align:center; font-weight:bold; color:${statusColor};">
                ${statusLabel}
            </td>
        </tr>
    `;
    }).join('');

    printWin.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>MDSJFI - Official Student Clearance (Examination) Roster (S.Y. ${syVal})</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 24px; color: #1e293b; }
                .header { text-align: center; border-bottom: 2px solid #0b2545; padding-bottom: 12px; margin-bottom: 16px; }
                .header h2 { margin: 0; color: #0b2545; font-size: 20px; text-transform: uppercase; }
                .header p { margin: 4px 0 0 0; font-size: 13px; color: #64748b; }
                .meta-bar { display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 14px; background: #f8fafc; padding: 8px 12px; border-radius: 6px; }
                table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
                th { background: #0b2545; color: #fff; padding: 7px 8px; text-align: left; font-size: 11px; text-transform: uppercase; }
                .signatures { margin-top: 36px; display: flex; justify-content: space-between; page-break-inside: avoid; }
                .sig-box { text-align: center; width: 42%; }
                .sig-label { font-size: 11px; font-weight: bold; color: #334155; margin-bottom: 30px; text-align: left; }
                .sig-line { border-top: 1.5px solid #000; margin-bottom: 4px; }
                .sig-name { font-weight: bold; font-size: 13px; }
                .sig-title { font-size: 11px; color: #475569; }
                @media print {
                    @page { size: portrait; margin: 12mm; }
                    body { margin: 0; }
                }
            </style>
        </head>
        <body>
            <div class="header" style="display: flex; align-items: center; justify-content: center; gap: 16px; border-bottom: 2px solid #0b2545; padding-bottom: 12px; margin-bottom: 16px;">
                <img src="school-logo.png" alt="MDSJFI Official Logo" style="height:65px; width:65px; object-fit:contain;" onerror="this.src='logo.jpg'; this.onerror=null;">
                <div style="text-align:center;">
                    <h2 style="margin: 0; color: #0b2545; font-size: 20px; text-transform: uppercase;">MONTESSORI DE SAN JOSE FOUNDATION INC.</h2>
                    <p style="margin: 3px 0 0 0; font-size: 12px; color: #475569;">0696 P. Burgost St., Brgy. Pag-asa, San Jose, Occidental Mindoro</p>
                    <p style="margin: 2px 0 0 0; font-size: 12px; font-weight: bold; color: #0b2545;">School Year ${syVal}</p>
                    <h3 style="margin: 6px 0 0 0; color: #1e293b; font-size: 15px; letter-spacing: 0.5px;">OFFICIAL STUDENT CLEARANCE (EXAMINATION) ROSTER</h3>
                    <p style="margin: 2px 0 0 0; font-size: 11px; font-weight: bold; color: #64748b;">Generated: ${new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
            </div>
            <div class="meta-bar">
                <div><strong>Total Learners:</strong> ${data.length} Enrolled</div>
                <div><strong>Cleared for Exam:</strong> <span style="color:#16a34a; font-weight:bold;">${clearedCount}</span></div>
                <div><strong>Pending Clearance:</strong> <span style="color:#dc2626; font-weight:bold;">${pendingCount}</span></div>
            </div>
            <table>
                <thead>
                    <tr>
                        <th style="width:30px;">#</th>
                        <th>LRN</th>
                        <th>Learner Name</th>
                        <th>Grade &amp; Section</th>
                        <th>ESC</th>
                        <th style="text-align:right;">Tuition</th>
                        <th style="text-align:right;">Paid</th>
                        <th style="text-align:right;">Balance</th>
                        <th style="text-align:center;">Exam Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${tableRows}
                </tbody>
            </table>
            <div class="signatures">
                <div class="sig-box">
                    <div class="sig-label">Prepared by:</div>
                    <div class="sig-line"></div>
                    <div class="sig-name">CARRELLE B. COLEGADO</div>
                    <div class="sig-title">Registrar / In-Charge, Accounting</div>
                </div>
                <div class="sig-box">
                    <div class="sig-label">Approved by:</div>
                    <div class="sig-line"></div>
                    <div class="sig-name">NI&Ntilde;O ALOYSIUS B. COLEGADO</div>
                    <div class="sig-title">School President</div>
                </div>
            </div>
        </body>
        </html>
    `);
    printWin.document.close();
    printWin.focus();
    setTimeout(() => {
        printWin.print();
    }, 400);
}

// ======================== PAGE REFRESH TRANSITION & SHORTCUTS ========================

function triggerSmoothPageRefresh() {
    const overlay = document.getElementById('appRefreshOverlay');
    if (overlay) overlay.classList.add('active');

    setTimeout(() => {
        try {
            const page = sessionStorage.getItem('mdsj_active_page') || 
                         localStorage.getItem('mdsj_active_page') ||
                         (window.location.hash ? window.location.hash.replace('#', '') : 'dashboard');
            refreshAll();
            if (typeof navigateTo === 'function') {
                navigateTo(page);
            }
            if (typeof showToast === 'function') {
                showToast('All records, ledgers, and views refreshed successfully.', 'success');
            }
        } catch(err) {
            console.error('Error during smooth refresh:', err);
        }

        setTimeout(() => {
            if (overlay) overlay.classList.remove('active');
        }, 360);
    }, 300);
}
window.triggerSmoothPageRefresh = triggerSmoothPageRefresh;

// Intercept F5 and Ctrl+R to play smooth animated refresh overlay and refresh all data
window.addEventListener('keydown', function(e) {
    if ((e.key === 'F5' || ((e.ctrlKey || e.metaKey) && (e.key === 'r' || e.key === 'R'))) && !e.shiftKey) {
        e.preventDefault();
        triggerSmoothPageRefresh();
    }
});

window.getExamOverrides = getExamOverrides;
window.saveExamOverrides = saveExamOverrides;
window.getStudentExamOverride = getStudentExamOverride;
window.openClearanceOverrideModal = openClearanceOverrideModal;
window.closeClearanceOverrideModal = closeClearanceOverrideModal;
window.handleSaveClearanceOverride = handleSaveClearanceOverride;
window.handleRevokeClearanceOverride = handleRevokeClearanceOverride;
window.revokeClearanceOverrideById = revokeClearanceOverrideById;
window.revokeAllClearanceOverrides = revokeAllClearanceOverrides;

window.getClearanceRosterData = getClearanceRosterData;
window.refreshClearancePage = refreshClearancePage;
window.filterClearanceTable = filterClearanceTable;
window.exportClearanceCSV = exportClearanceCSV;
window.printClearanceRoster = printClearanceRoster;

// Automatically scope print view if browser print shortcut (Ctrl+P) is pressed
window.addEventListener('beforeprint', function() {
    const soaModal = document.getElementById('soaModal');
    const viewModal = document.getElementById('viewModal');
    if (soaModal && (soaModal.classList.contains('show') || soaModal.classList.contains('active'))) {
        document.body.classList.remove('printing-profile', 'printing-financial-summary');
        document.body.classList.add('printing-soa');
    } else if (viewModal && (viewModal.classList.contains('show') || viewModal.classList.contains('active'))) {
        const id = currentViewId || window.currentViewId;
        const s = findStudent(id);
        if (s) {
            renderPrintableStudentProfile(s);
        }
        document.body.classList.remove('printing-soa', 'printing-financial-summary');
        document.body.classList.add('printing-profile');
    }
});

window.addEventListener('afterprint', function() {
    document.body.classList.remove('printing-soa', 'printing-profile', 'printing-financial-summary');
});

// ======================== FACULTY & STAFF PAYROLL MANAGEMENT ========================

const PAYROLL_STORAGE_KEY = 'mdsj_faculty_payroll';

const DEFAULT_FACULTY_MEMBERS = [
    {
        id: 'EMP-T001',
        employeeNo: 'T001',
        name: 'Rosabelyn R. Esteban',
        position: 'AP Teacher',
        department: 'Junior High School Faculty',
        dailyRate: 363.60,
        daysAttended15th: 11,
        daysAttended30th: 11,
        monthlySalary: 7999.20,
        cutoff15th: 3999.60,
        cutoff30th: 3999.60,
        incentive: 1000,
        bonus: 2000,
        payoutSchedule: 'Semi-Monthly (15th & 30th)',
        schoolYear: '2026-2027',
        employmentStatus: 'Active',
        dateHired: '2024-06-10',
        gender: 'Female',
        dob: '1992-08-14',
        civilStatus: 'Single',
        phone: '0917-823-4512',
        email: 'r.esteban@mdsjfi.edu.ph',
        address: 'Poblacion, San Jose, Occidental Mindoro',
        prcNo: 'PRC-0849201',
        prcExpiry: '2027-08-14',
        degree: 'Bachelor of Secondary Education (BSEd)',
        major: 'Araling Panlipunan / Social Studies',
        schoolGraduated: 'Occidental Mindoro State College',
        sss: '34-1284920-1',
        philhealth: '12-049281729-1',
        pagibig: '1210-4829-1928',
        tin: '312-849-201-000',
        advisoryClass: 'Grade 7 - Jade',
        subjects: 'Araling Panlipunan 7, 8, 9, 10',
        emergencyName: 'Remedios Esteban',
        emergencyRelation: 'Mother',
        emergencyPhone: '0918-234-5678'
    },
    {
        id: 'EMP-T002',
        employeeNo: 'T002',
        name: 'Mica Mae B. Barel',
        position: 'Science, MAPEH & ESP Teacher',
        department: 'Junior High School Faculty',
        dailyRate: 363.60,
        daysAttended15th: 11,
        daysAttended30th: 11,
        monthlySalary: 7999.20,
        cutoff15th: 3999.60,
        cutoff30th: 3999.60,
        incentive: 1000,
        bonus: 2000,
        payoutSchedule: 'Semi-Monthly (15th & 30th)',
        schoolYear: '2026-2027',
        employmentStatus: 'Active',
        dateHired: '2024-06-10',
        gender: 'Female',
        dob: '1994-03-22',
        civilStatus: 'Single',
        phone: '0919-456-7890',
        email: 'm.barel@mdsjfi.edu.ph',
        address: 'Brgy. Pag-asa, San Jose, Occidental Mindoro',
        prcNo: 'PRC-0918273',
        prcExpiry: '2028-03-22',
        degree: 'Bachelor of Secondary Education (BSEd)',
        major: 'General Science & MAPEH',
        schoolGraduated: 'Batangas State University',
        sss: '34-2918273-4',
        philhealth: '12-192837465-2',
        pagibig: '1210-9182-7364',
        tin: '421-918-273-000',
        advisoryClass: 'Grade 8 - Emerald',
        subjects: 'Science 7, Science 8, MAPEH 8, ESP 8',
        emergencyName: 'Manuel Barel',
        emergencyRelation: 'Father',
        emergencyPhone: '0920-123-4567'
    },
    {
        id: 'EMP-T004',
        employeeNo: 'T004',
        name: 'Lucky Irich M. Bartolo',
        position: 'TLE, ESP & MAPEH Teacher',
        department: 'Junior High School Faculty',
        dailyRate: 363.60,
        daysAttended15th: 11,
        daysAttended30th: 11,
        monthlySalary: 7999.20,
        cutoff15th: 3999.60,
        cutoff30th: 3999.60,
        incentive: 1000,
        bonus: 2000,
        payoutSchedule: 'Semi-Monthly (15th & 30th)',
        schoolYear: '2026-2027',
        employmentStatus: 'Active',
        dateHired: '2024-06-10',
        gender: 'Female',
        dob: '1995-11-05',
        civilStatus: 'Single',
        phone: '0927-345-6789',
        email: 'l.bartolo@mdsjfi.edu.ph',
        address: 'Brgy. Central, San Jose, Occidental Mindoro',
        prcNo: 'PRC-1029384',
        prcExpiry: '2027-11-05',
        degree: 'Bachelor of Technology and Livelihood Education (BTLEd)',
        major: 'Home Economics & TLE',
        schoolGraduated: 'Occidental Mindoro State College',
        sss: '34-3029384-5',
        philhealth: '12-203948576-3',
        pagibig: '1210-2039-4857',
        tin: '532-029-384-000',
        advisoryClass: 'Grade 9 - Ruby',
        subjects: 'TLE 7, 8, 9, 10, ESP 9, MAPEH 9',
        emergencyName: 'Irene Bartolo',
        emergencyRelation: 'Mother',
        emergencyPhone: '0928-456-7890'
    },
    {
        id: 'EMP-T005',
        employeeNo: 'T005',
        name: 'Genelyn P. Aguilana',
        position: 'Filipino & ESP Teacher',
        department: 'Junior High School Faculty',
        dailyRate: 363.60,
        daysAttended15th: 11,
        daysAttended30th: 11,
        monthlySalary: 7999.20,
        cutoff15th: 3999.60,
        cutoff30th: 3999.60,
        incentive: 1000,
        bonus: 2000,
        payoutSchedule: 'Semi-Monthly (15th & 30th)',
        schoolYear: '2026-2027',
        employmentStatus: 'Active',
        dateHired: '2024-06-10',
        gender: 'Female',
        dob: '1991-05-18',
        civilStatus: 'Married',
        phone: '0939-567-8901',
        email: 'g.aguilana@mdsjfi.edu.ph',
        address: 'Brgy. Bagong Sikat, San Jose, Occidental Mindoro',
        prcNo: 'PRC-0782910',
        prcExpiry: '2026-05-18',
        degree: 'Bachelor of Secondary Education (BSEd)',
        major: 'Filipino Language & Literature',
        schoolGraduated: 'Philippine Normal University',
        sss: '34-4829102-6',
        philhealth: '12-384920182-4',
        pagibig: '1210-4829-1029',
        tin: '643-829-102-000',
        advisoryClass: 'None',
        subjects: 'Filipino 7, 8, 9, 10, ESP 7, 10',
        emergencyName: 'Eduardo Aguilana',
        emergencyRelation: 'Spouse',
        emergencyPhone: '0930-678-9012'
    },
    {
        id: 'EMP-T006',
        employeeNo: 'T006',
        name: 'Rea Mea M. Asong',
        position: 'English & ESP Teacher',
        department: 'Junior High School Faculty',
        dailyRate: 363.60,
        daysAttended15th: 11,
        daysAttended30th: 11,
        monthlySalary: 7999.20,
        cutoff15th: 3999.60,
        cutoff30th: 3999.60,
        incentive: 1000,
        bonus: 2000,
        payoutSchedule: 'Semi-Monthly (15th & 30th)',
        schoolYear: '2026-2027',
        employmentStatus: 'Active',
        dateHired: '2024-06-10',
        gender: 'Female',
        dob: '1993-09-30',
        civilStatus: 'Single',
        phone: '0945-678-9012',
        email: 'r.asong@mdsjfi.edu.ph',
        address: 'Brgy. San Roque, San Jose, Occidental Mindoro',
        prcNo: 'PRC-0891029',
        prcExpiry: '2028-09-30',
        degree: 'Bachelor of Secondary Education (BSEd)',
        major: 'English Language Education',
        schoolGraduated: 'Occidental Mindoro State College',
        sss: '34-5891029-7',
        philhealth: '12-492019283-5',
        pagibig: '1210-5891-0293',
        tin: '754-891-029-000',
        advisoryClass: 'None',
        subjects: 'English 7, 8, 9, 10',
        emergencyName: 'Merlita Asong',
        emergencyRelation: 'Mother',
        emergencyPhone: '0946-789-0123'
    },
    {
        id: 'EMP-T007',
        employeeNo: 'T007',
        name: 'Mara Lykka G. Fabrigas',
        position: 'Math & MAPEH Teacher',
        department: 'Junior High School Faculty',
        dailyRate: 363.60,
        daysAttended15th: 11,
        daysAttended30th: 11,
        monthlySalary: 7999.20,
        cutoff15th: 3999.60,
        cutoff30th: 3999.60,
        incentive: 1000,
        bonus: 2000,
        payoutSchedule: 'Semi-Monthly (15th & 30th)',
        schoolYear: '2026-2027',
        employmentStatus: 'Active',
        dateHired: '2024-06-10',
        gender: 'Female',
        dob: '1996-01-12',
        civilStatus: 'Single',
        phone: '0956-789-0123',
        email: 'm.fabrigas@mdsjfi.edu.ph',
        address: 'Brgy. Caminawit, San Jose, Occidental Mindoro',
        prcNo: 'PRC-1192830',
        prcExpiry: '2029-01-12',
        degree: 'Bachelor of Secondary Education (BSEd)',
        major: 'Mathematics Education',
        schoolGraduated: 'Batangas State University',
        sss: '34-6192830-8',
        philhealth: '12-503928174-6',
        pagibig: '1210-6192-8304',
        tin: '865-192-830-000',
        advisoryClass: 'Grade 10 - Diamond',
        subjects: 'Mathematics 7, 8, 9, 10, MAPEH 10',
        emergencyName: 'Gary Fabrigas',
        emergencyRelation: 'Father',
        emergencyPhone: '0950-890-1234'
    },
    {
        id: 'EMP-T008',
        employeeNo: 'T008',
        name: 'Ganito P. Cansuncad',
        position: 'School Principal',
        department: 'School Administration & Faculty',
        dailyRate: 363.60,
        daysAttended15th: 11,
        daysAttended30th: 11,
        monthlySalary: 7999.20,
        cutoff15th: 3999.60,
        cutoff30th: 3999.60,
        incentive: 1000,
        bonus: 2000,
        payoutSchedule: 'Semi-Monthly (15th & 30th)',
        schoolYear: '2026-2027',
        employmentStatus: 'Active',
        dateHired: '2023-08-01',
        gender: 'Male',
        dob: '1980-04-25',
        civilStatus: 'Married',
        phone: '0998-901-2345',
        email: 'principal@mdsjfi.edu.ph',
        address: '0696 P. Burgost St., Brgy. Pag-asa, San Jose, Occidental Mindoro',
        prcNo: 'PRC-0482910',
        prcExpiry: '2028-04-25',
        degree: 'Master of Arts in Education (MAEd) & BSEd',
        major: 'Educational Management',
        schoolGraduated: 'Philippine Normal University',
        sss: '34-0482910-9',
        philhealth: '12-004829102-7',
        pagibig: '1210-0482-9102',
        tin: '102-482-910-000',
        advisoryClass: 'Administration Overseer',
        subjects: 'School Leadership & Administration',
        emergencyName: 'Grace Cansuncad',
        emergencyRelation: 'Spouse',
        emergencyPhone: '0999-012-3456'
    }
];

function getPayrollEmployees() {
    let list = [];
    try {
        const stored = localStorage.getItem(PAYROLL_STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed) && parsed.length > 0) list = parsed;
        }
    } catch(e) {
        console.error('Error loading payroll roster:', e);
    }

    if (!list || list.length === 0) {
        list = JSON.parse(JSON.stringify(DEFAULT_FACULTY_MEMBERS));
        savePayrollEmployees(list);
        return list;
    }

    // Auto-migrate to guarantee updated teacher subjects, daily rate ₱363.60, and attendance inputs
    let needsSave = false;
    DEFAULT_FACULTY_MEMBERS.forEach(defEmp => {
        const existing = list.find(e => e.employeeNo === defEmp.employeeNo || e.id === defEmp.id);
        if (existing) {
            Object.keys(defEmp).forEach(k => {
                if (existing[k] === undefined || existing[k] === null || existing[k] === '') {
                    existing[k] = defEmp[k];
                    needsSave = true;
                }
            });
            if (existing.position !== defEmp.position) {
                existing.position = defEmp.position;
                needsSave = true;
            }
            if (!existing.dailyRate || existing.dailyRate !== 363.60) {
                existing.dailyRate = 363.60;
                needsSave = true;
            }
            if (existing.daysAttended15th === undefined) {
                existing.daysAttended15th = 11;
                needsSave = true;
            }
            if (existing.daysAttended30th === undefined) {
                existing.daysAttended30th = 11;
                needsSave = true;
            }
            if (existing.incentive === undefined) {
                existing.incentive = defEmp.incentive || 1000;
                needsSave = true;
            }
            if (existing.bonus === undefined) {
                existing.bonus = defEmp.bonus || 2000;
                needsSave = true;
            }
            const c15 = Math.round((Number(existing.daysAttended15th) * Number(existing.dailyRate)) * 100) / 100;
            const c30 = Math.round((Number(existing.daysAttended30th) * Number(existing.dailyRate)) * 100) / 100;
            if (existing.cutoff15th !== c15 || existing.cutoff30th !== c30) {
                existing.cutoff15th = c15;
                existing.cutoff30th = c30;
                existing.monthlySalary = Math.round((c15 + c30) * 100) / 100;
                needsSave = true;
            }
        } else {
            list.push(JSON.parse(JSON.stringify(defEmp)));
            needsSave = true;
        }
    });

    if (needsSave) {
        savePayrollEmployees(list);
    }
    return list;
}

function savePayrollEmployees(list) {
    try {
        localStorage.setItem(PAYROLL_STORAGE_KEY, JSON.stringify(list));
    } catch(e) {
        console.error('Error saving payroll roster:', e);
    }
}

function updateEmployeeDays(empId, cutoff, value) {
    if (typeof isTeacher === 'function' && isTeacher()) {
        showToast('Access Restricted: Teachers cannot modify attendance records.', 'warning');
        return;
    }
    const days = Math.max(0, Math.min(31, parseFloat(value) || 0));
    const all = getPayrollEmployees();
    const emp = all.find(e => e.id === empId || e.employeeNo === empId);
    if (!emp) return;

    const rate = Number(emp.dailyRate) || 363.60;
    if (cutoff === '15th') {
        emp.daysAttended15th = days;
        emp.cutoff15th = Math.round(days * rate * 100) / 100;
    } else {
        emp.daysAttended30th = days;
        emp.cutoff30th = Math.round(days * rate * 100) / 100;
    }
    const c15 = (emp.cutoff15th !== undefined) ? Number(emp.cutoff15th) : (Number(emp.daysAttended15th || 11) * rate);
    const c30 = (emp.cutoff30th !== undefined) ? Number(emp.cutoff30th) : (Number(emp.daysAttended30th || 11) * rate);
    emp.monthlySalary = Math.round((c15 + c30) * 100) / 100;

    savePayrollEmployees(all);
    refreshPayrollPage();
    showToast(`Updated attendance for ${emp.name}: ${days} days (${cutoff} payout = ₱${formatNumber(cutoff === '15th' ? c15 : c30)}).`, 'success');
}

function updateEmployeeIncentive(empId, value) {
    updateEmployeeBonusAmount(empId, value);
}

function updateEmployeeBonus(empId, value) {
    updateEmployeeBonusAmount(empId, value);
}

function updateEmployeeBonusAmount(empId, value) {
    if (typeof isTeacher === 'function' && isTeacher()) {
        showToast('Access Restricted: Teachers cannot modify bonus/incentive amounts.', 'warning');
        return;
    }
    const val = Math.max(0, parseFloat(value) || 0);
    const all = getPayrollEmployees();
    const emp = all.find(e => e.id === empId || e.employeeNo === empId);
    if (!emp) return;

    emp.bonusAmount = val;
    emp.bonus = val;
    savePayrollEmployees(all);
    filterPayrollTable();
    showToast(`Updated amount for ${emp.name}: ₱${formatNumber(val)}.`, 'success');
}

function updateEmployeeBonusType(empId, value) {
    if (typeof isTeacher === 'function' && isTeacher()) {
        showToast('Access Restricted: Teachers cannot modify bonus/incentive types.', 'warning');
        return;
    }
    const val = String(value || 'Incentive').trim();
    const all = getPayrollEmployees();
    const emp = all.find(e => e.id === empId || e.employeeNo === empId);
    if (!emp) return;

    emp.bonusType = val;
    savePayrollEmployees(all);
    showToast(`Updated grant type for ${emp.name}: ${val}.`, 'success');
}

function updateEmployeeBonusRemarks(empId, value) {
    if (typeof isTeacher === 'function' && isTeacher()) {
        showToast('Access Restricted: Teachers cannot modify remarks.', 'warning');
        return;
    }
    const val = String(value || '').trim();
    const all = getPayrollEmployees();
    const emp = all.find(e => e.id === empId || e.employeeNo === empId);
    if (!emp) return;

    emp.bonusRemarks = val;
    savePayrollEmployees(all);
    showToast(`Updated remarks for ${emp.name}.`, 'success');
}

function refreshPayrollPage() {
    const allEmployees = getPayrollEmployees();
    const syFilterVal = document.getElementById('payrollFilterSy')?.value || '2026-2027';

    const syEmployees = (syFilterVal && syFilterVal !== 'ALL')
        ? allEmployees.filter(e => (e.schoolYear || '2026-2027') === syFilterVal)
        : allEmployees;

    let totalMonthly = 0;
    let total15th = 0;
    let total30th = 0;

    syEmployees.forEach(emp => {
        const rate = Number(emp.dailyRate) || 363.60;
        const d15 = (emp.daysAttended15th !== undefined) ? Number(emp.daysAttended15th) : 11;
        const d30 = (emp.daysAttended30th !== undefined) ? Number(emp.daysAttended30th) : 11;
        const c15 = (emp.cutoff15th !== undefined) ? Number(emp.cutoff15th) : (d15 * rate);
        const c30 = (emp.cutoff30th !== undefined) ? Number(emp.cutoff30th) : (d30 * rate);
        const salary = (emp.monthlySalary !== undefined) ? Number(emp.monthlySalary) : (c15 + c30);

        totalMonthly += salary;
        total15th += c15;
        total30th += c30;
    });

    const elCount = document.getElementById('statPayrollTotalCount');
    const elMonthly = document.getElementById('statPayrollTotalMonthly');
    const el15th = document.getElementById('statPayrollTotal15th');
    const el30th = document.getElementById('statPayrollTotal30th');
    const elSySub = document.getElementById('statPayrollSySub');

    if (elCount) elCount.textContent = `${syEmployees.length} Staff / Faculty`;
    if (elMonthly) elMonthly.innerHTML = `&#8369;${formatNumber(totalMonthly)}`;
    if (el15th) el15th.innerHTML = `&#8369;${formatNumber(total15th)}`;
    if (el30th) el30th.innerHTML = `&#8369;${formatNumber(total30th)}`;
    if (elSySub) elSySub.textContent = (syFilterVal === 'ALL') ? 'All School Years' : `S.Y. ${syFilterVal} Cohort`;

    filterPayrollTable();
    if (typeof updatePayrollArchivesBadge === 'function') {
        updatePayrollArchivesBadge();
    }
}

function updateEmployeeRemarks(empId, value) {
    if (typeof isTeacher === 'function' && isTeacher()) {
        showToast('Access Restricted: Teachers cannot modify employee remarks.', 'warning');
        return;
    }
    const all = getPayrollEmployees();
    const emp = all.find(e => e.id === empId || e.employeeNo === empId);
    if (!emp) return;

    emp.remarks = String(value || '').trim();
    savePayrollEmployees(all);
    showToast(`Updated remarks for ${emp.name}.`, 'success');
}

let currentPayrollSubTab = '15th';

function switchPayrollSubTab(tab) {
    currentPayrollSubTab = tab;
    const cutoffSelect = document.getElementById('payrollCutoffFilter');
    if (cutoffSelect) cutoffSelect.value = tab;
    filterPayrollTable();
    if (typeof updatePayrollArchivesBadge === 'function') {
        updatePayrollArchivesBadge();
    }
}

function filterPayrollTable() {
    const allEmployees = getPayrollEmployees();
    const syFilterVal = document.getElementById('payrollFilterSy')?.value || '2026-2027';
    const cutoffSelect = document.getElementById('payrollCutoffFilter');
    const cutoffFilterVal = (cutoffSelect && cutoffSelect.value) ? cutoffSelect.value : (currentPayrollSubTab || '15th');
    currentPayrollSubTab = cutoffFilterVal;

    // Synchronize subtab buttons active state
    const btn15th = document.getElementById('btnPayrollTab15th');
    const btn30th = document.getElementById('btnPayrollTab30th');
    const btnBonus = document.getElementById('btnPayrollTabBonus');
    if (btn15th) {
        btn15th.className = 'btn-subtab' + (cutoffFilterVal === '15th' ? ' active' : '');
        btn15th.style.background = (cutoffFilterVal === '15th' ? '#0b2545' : '#e2e8f0');
        btn15th.style.color = (cutoffFilterVal === '15th' ? '#ffffff' : '#334155');
    }
    if (btn30th) {
        btn30th.className = 'btn-subtab' + (cutoffFilterVal === '30th' ? ' active' : '');
        btn30th.style.background = (cutoffFilterVal === '30th' ? '#0b2545' : '#e2e8f0');
        btn30th.style.color = (cutoffFilterVal === '30th' ? '#ffffff' : '#334155');
    }
    if (btnBonus) {
        btnBonus.className = 'btn-subtab' + (cutoffFilterVal === 'bonus' ? ' active' : '');
        btnBonus.style.background = (cutoffFilterVal === 'bonus' ? '#0b2545' : '#e2e8f0');
        btnBonus.style.color = (cutoffFilterVal === 'bonus' ? '#ffffff' : '#334155');
    }

    // Month filter & status labels
    const monthSelect = document.getElementById('payrollFilterMonth');
    const monthVal = monthSelect?.value || 'ALL';
    const monthText = monthSelect ? (monthSelect.options[monthSelect.selectedIndex]?.text || '') : '';
    const elMonthlySub = document.getElementById('statPayrollSySub');
    if (elMonthlySub) {
        const syLabel = (syFilterVal === 'ALL') ? 'All School Years' : `S.Y. ${syFilterVal}`;
        const mLabel = (monthVal === 'ALL') ? 'Whole Year Base' : `${monthText} Roster`;
        elMonthlySub.textContent = `${syLabel} • ${mLabel}`;
    }

    const statusFilterEl = document.getElementById('payrollStatusFilter');
    const statusFilterVal = statusFilterEl ? statusFilterEl.value : 'Active';
    const searchVal = (document.getElementById('payrollSearchInput')?.value || '').toLowerCase().trim();

    const filtered = allEmployees.filter(emp => {
        if (syFilterVal && syFilterVal !== 'ALL' && (emp.schoolYear || '2026-2027') !== syFilterVal) return false;
        if (statusFilterEl) {
            if (statusFilterVal !== 'ALL' && emp.employmentStatus !== statusFilterVal) return false;
        } else {
            if (emp.employmentStatus === 'Inactive') return false;
        }
        if (searchVal) {
            const text = `${emp.employeeNo || ''} ${emp.name || ''} ${emp.position || ''} ${emp.department || ''} ${emp.remarks || ''}`.toLowerCase();
            if (!text.includes(searchVal)) return false;
        }
        return true;
    });

    renderPayrollTable(filtered, cutoffFilterVal);
}

function renderPayrollTable(list, cutoffFilter = '15th') {
    const tbody = document.getElementById('payrollTableBody');
    if (!tbody) return;

    const payrollTableEl = document.getElementById('payrollTable');
    if (payrollTableEl) {
        payrollTableEl.classList.remove('cutoff-mode', 'bonus-mode');
        if (cutoffFilter === '15th' || cutoffFilter === '30th') {
            payrollTableEl.classList.add('cutoff-mode');
        } else if (cutoffFilter === 'bonus') {
            payrollTableEl.classList.add('bonus-mode');
        }
    }

    const theadRow = document.getElementById('payrollTableHeadRow');
    if (theadRow) {
        if (cutoffFilter === '15th') {
            theadRow.innerHTML = `
                <th style="width: 3%;">#</th>
                <th style="width: 7%;">Emp No.</th>
                <th style="width: 16%;">Faculty / Employee Name</th>
                <th style="width: 16%;">Position &amp; Subject Assignment</th>
                <th style="width: 9%;" class="text-right">Daily Rate (&#8369;)</th>
                <th style="width: 10%; text-align:center;">Days Attended (1st-15th)</th>
                <th style="width: 9%;" class="text-right">15th Payout (&#8369;)</th>
                <th style="width: 11%;">Remarks / Notes</th>
                <th style="width: 6%; text-align:center;">Status</th>
                <th style="width: 13%; text-align:center;">Actions</th>
            `;
        } else if (cutoffFilter === '30th') {
            theadRow.innerHTML = `
                <th style="width: 3%;">#</th>
                <th style="width: 7%;">Emp No.</th>
                <th style="width: 16%;">Faculty / Employee Name</th>
                <th style="width: 16%;">Position &amp; Subject Assignment</th>
                <th style="width: 9%;" class="text-right">Daily Rate (&#8369;)</th>
                <th style="width: 10%; text-align:center;">Days Attended (16th-30th)</th>
                <th style="width: 9%;" class="text-right">30th Payout (&#8369;)</th>
                <th style="width: 11%;">Remarks / Notes</th>
                <th style="width: 6%; text-align:center;">Status</th>
                <th style="width: 13%; text-align:center;">Actions</th>
            `;
        } else if (cutoffFilter === 'bonus') {
            theadRow.innerHTML = `
                <th style="width: 3.5%; text-align:center;">#</th>
                <th style="width: 7.5%;">Emp No.</th>
                <th style="width: 18%;">Faculty / Employee Name</th>
                <th style="width: 15%;">Position &amp; Subject Assignment</th>
                <th style="width: 14%; text-align:center;">Type</th>
                <th style="width: 12%; text-align:center;">Amount to be Given (&#8369;)</th>
                <th style="width: 14%;">Remarks</th>
                <th style="width: 5%; text-align:center;">Status</th>
                <th style="width: 11%; text-align:center;">Actions</th>
            `;
        } else {
            theadRow.innerHTML = `
                <th style="width: 3%;">#</th>
                <th style="width: 7%;">Emp No.</th>
                <th style="width: 16%;">Faculty / Employee Name</th>
                <th style="width: 16%;">Position &amp; Subject Assignment</th>
                <th style="width: 9%;" class="text-right">Daily Rate (&#8369;)</th>
                <th style="width: 10%; text-align:center;">Days Attended (1st-15th)</th>
                <th style="width: 9%;" class="text-right">15th Payout (&#8369;)</th>
                <th style="width: 11%;">Remarks / Notes</th>
                <th style="width: 6%; text-align:center;">Status</th>
                <th style="width: 13%; text-align:center;">Actions</th>
            `;
        }
    }

    const colSpan = 10;

    if (!list || list.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="${colSpan}" style="text-align: center; padding: 36px 16px; color: #64748b;">
                    <i class="fas fa-users-slash" style="font-size: 2rem; color: #94a3b8; display: block; margin-bottom: 8px;"></i>
                    <strong>No faculty or staff payroll records found</strong>
                    <p style="font-size: 0.85rem; margin-top: 4px;">Try clearing filters or click "+ Encode New Employee" to register staff.</p>
                </td>
            </tr>
        `;
        return;
    }

    const isUserTeacher = (typeof isTeacher === 'function' && isTeacher());

    tbody.innerHTML = list.map((emp, idx) => {
        const rate = Number(emp.dailyRate) || 363.60;
        const d15 = (emp.daysAttended15th !== undefined) ? Number(emp.daysAttended15th) : 11;
        const d30 = (emp.daysAttended30th !== undefined) ? Number(emp.daysAttended30th) : 11;
        const c15 = (emp.cutoff15th !== undefined) ? Number(emp.cutoff15th) : Math.round(d15 * rate * 100) / 100;
        const c30 = (emp.cutoff30th !== undefined) ? Number(emp.cutoff30th) : Math.round(d30 * rate * 100) / 100;
        const salary = (emp.monthlySalary !== undefined) ? Number(emp.monthlySalary) : Math.round((c15 + c30) * 100) / 100;
        const status = emp.employmentStatus || 'Active';

        const statusBadge = (status === 'Active')
            ? '<span class="status-badge" style="background:#dcfce7; color:#15803d; font-weight:700; font-size:0.72rem; padding:2.5px 6px;"><i class="fas fa-check-circle"></i> Active</span>'
            : `<span class="status-badge" style="background:#f1f5f9; color:#475569; font-size:0.72rem; padding:2.5px 6px;">${escapeHtml(status)}</span>`;

        let actionBtns = `
            <button type="button" class="btn-icon" onclick="openEmployeePayslip('${emp.id}')" title="Generate &amp; Print Official Payslip" style="background:#e0f2fe; color:#0369a1; border:1px solid #bae6fd; width:24px; height:24px; border-radius:4px; font-size:0.70rem; display:inline-flex; align-items:center; justify-content:center; cursor:pointer; margin:0 1px;">
                <i class="fas fa-file-invoice-dollar"></i>
            </button>
        `;

        if (!isUserTeacher) {
            actionBtns += `
                <button type="button" class="btn-icon edit" onclick="openNewEmployeeModal('${emp.id}')" title="Edit Employee Details" style="margin:0 1px; width:24px; height:24px; border-radius:4px; font-size:0.70rem;">
                    <i class="fas fa-edit"></i>
                </button>
                <button type="button" class="btn-icon delete" onclick="deletePayrollEmployee('${emp.id}')" title="Delete Employee Record" style="margin:0 1px; width:24px; height:24px; border-radius:4px; font-size:0.70rem;">
                    <i class="fas fa-trash-alt"></i>
                </button>
            `;
        }

        const remarksCell = isUserTeacher
            ? `<span style="font-size:0.76rem; color:#475569;">${escapeHtml(emp.remarks || '—')}</span>`
            : `<input type="text" value="${escapeHtml(emp.remarks || '')}" 
                   placeholder="Remarks..." 
                   onchange="updateEmployeeRemarks('${emp.id}', this.value)" 
                   title="Attendance remarks or notes"
                   style="width:100%; max-width:100px; padding:2px 4px; font-size:0.76rem; border:1px solid #cbd5e1; border-radius:3px; outline:none;">`;

        if (cutoffFilter === '15th') {
            const d15Cell = isUserTeacher
                ? `<div style="font-weight:700; font-size:0.78rem; color:#0369a1;">${d15}d</div>`
                : `<input type="number" min="0" max="16" step="0.5" value="${d15}" 
                       onchange="updateEmployeeDays('${emp.id}', '15th', this.value)" 
                       title="Days attended 1st half (1st-15th)" 
                       style="width:36px; text-align:center; padding:2px 3px; border:1px solid #cbd5e1; border-radius:3px; font-weight:700; color:#0369a1; font-size:0.78rem;">`;

            return `
                <tr data-emp-id="${emp.id}">
                    <td style="color:#64748b; font-weight:600; font-size:0.78rem;">${idx + 1}</td>
                    <td><strong style="font-family: monospace; font-size: 0.78rem; color: #0b2545;">${escapeHtml(emp.employeeNo)}</strong></td>
                    <td>
                        <div style="font-weight: 700; color: #0f172a; font-size: 0.81rem; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${escapeHtml(emp.name)}">${escapeHtml(emp.name)}</div>
                        <div style="font-size: 0.71rem; color: #64748b;">${escapeHtml(emp.department || 'Faculty')}</div>
                    </td>
                    <td>
                        <span style="display:inline-block; padding: 2px 6px; border-radius: 4px; background: #e0f2fe; color: #0369a1; font-weight: 600; font-size: 0.72rem; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${escapeHtml(emp.position)}">
                            ${escapeHtml(emp.position)}
                        </span>
                    </td>
                    <td class="text-right" style="font-weight: 700; color: #0b2545; font-size: 0.80rem;">₱${formatNumber(rate)}</td>
                    <td style="text-align:center;">${d15Cell}</td>
                    <td class="text-right" style="font-weight: 700; color: #0284c7; font-size: 0.80rem;">₱${formatNumber(c15)}</td>
                    <td>${remarksCell}</td>
                    <td style="text-align:center;">${statusBadge}</td>
                    <td class="text-center actions-cell">${actionBtns}</td>
                </tr>
            `;
        } else if (cutoffFilter === '30th') {
            const d30Cell = isUserTeacher
                ? `<div style="font-weight:700; font-size:0.78rem; color:#16a34a;">${d30}d</div>`
                : `<input type="number" min="0" max="16" step="0.5" value="${d30}" 
                       onchange="updateEmployeeDays('${emp.id}', '30th', this.value)" 
                       title="Days attended 2nd half (16th-30th)" 
                       style="width:36px; text-align:center; padding:2px 3px; border:1px solid #cbd5e1; border-radius:3px; font-weight:700; color:#16a34a; font-size:0.78rem;">`;

            return `
                <tr data-emp-id="${emp.id}">
                    <td style="color:#64748b; font-weight:600; font-size:0.78rem;">${idx + 1}</td>
                    <td><strong style="font-family: monospace; font-size: 0.78rem; color: #0b2545;">${escapeHtml(emp.employeeNo)}</strong></td>
                    <td>
                        <div style="font-weight: 700; color: #0f172a; font-size: 0.81rem; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${escapeHtml(emp.name)}">${escapeHtml(emp.name)}</div>
                        <div style="font-size: 0.71rem; color: #64748b;">${escapeHtml(emp.department || 'Faculty')}</div>
                    </td>
                    <td>
                        <span style="display:inline-block; padding: 2px 6px; border-radius: 4px; background: #e0f2fe; color: #0369a1; font-weight: 600; font-size: 0.72rem; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${escapeHtml(emp.position)}">
                            ${escapeHtml(emp.position)}
                        </span>
                    </td>
                    <td class="text-right" style="font-weight: 700; color: #0b2545; font-size: 0.80rem;">₱${formatNumber(rate)}</td>
                    <td style="text-align:center;">${d30Cell}</td>
                    <td class="text-right" style="font-weight: 700; color: #16a34a; font-size: 0.80rem;">₱${formatNumber(c30)}</td>
                    <td>${remarksCell}</td>
                    <td style="text-align:center;">${statusBadge}</td>
                    <td class="text-center actions-cell">${actionBtns}</td>
                </tr>
            `;
        } else if (cutoffFilter === 'bonus') {
            const bType = emp.bonusType || (emp.bonus > 0 ? 'Bonus' : 'Incentive');
            const bAmt = (emp.bonusAmount !== undefined)
                ? Number(emp.bonusAmount)
                : ((Number(emp.bonus) || 0) + (Number(emp.incentive) || 0)) || 1000;
            const bRem = emp.bonusRemarks || emp.remarks || '';

            const typeCell = isUserTeacher
                ? `<span class="badge" style="background:#fef3c7; color:#92400e; font-weight:700; font-size:0.72rem; padding:2.5px 6px; border-radius:4px; border:1px solid #fde68a;">${escapeHtml(bType)}</span>`
                : `<select class="bonus-type-select" onchange="updateEmployeeBonusType('${emp.id}', this.value)" 
                          title="Select Type: Bonus, Incentive, or TSS-PEAC">
                       <option value="Incentive" ${bType === 'Incentive' ? 'selected' : ''}>Incentive</option>
                       <option value="Bonus" ${bType === 'Bonus' ? 'selected' : ''}>Bonus</option>
                       <option value="TSS-PEAC" ${bType === 'TSS-PEAC' ? 'selected' : ''}>TSS-PEAC</option>
                       <option value="Performance Incentive" ${bType === 'Performance Incentive' ? 'selected' : ''}>Performance Incentive</option>
                       <option value="Holiday Bonus" ${bType === 'Holiday Bonus' ? 'selected' : ''}>Holiday Bonus</option>
                       <option value="Mid-Year Bonus" ${bType === 'Mid-Year Bonus' ? 'selected' : ''}>Mid-Year Bonus</option>
                       <option value="13th Month Pay" ${bType === '13th Month Pay' ? 'selected' : ''}>13th Month Pay</option>
                       <option value="Special Honorarium" ${bType === 'Special Honorarium' ? 'selected' : ''}>Special Honorarium</option>
                   </select>`;

            const amountCell = isUserTeacher
                ? `<div style="font-weight:800; font-size:0.80rem; color:#059669; text-align:right; padding-right:6px;">₱${formatNumber(bAmt)}</div>`
                : `<div style="display:inline-flex; align-items:center; justify-content:center; gap:3px;">
                       <span style="font-size:0.75rem; font-weight:800; color:#059669;">₱</span>
                       <input type="number" min="0" step="100" value="${bAmt}" 
                              onchange="updateEmployeeBonusAmount('${emp.id}', this.value)" 
                              title="Amount to be given to this staff member" 
                              class="bonus-amount-input">
                   </div>`;

            const bonusRemarksCell = isUserTeacher
                ? `<span style="font-size:0.76rem; color:#475569;" title="${escapeHtml(bRem || '—')}">${escapeHtml(bRem || '—')}</span>`
                : `<input type="text" value="${escapeHtml(bRem)}" 
                          placeholder="Remarks / Basis..." 
                          onchange="updateEmployeeBonusRemarks('${emp.id}', this.value)" 
                          title="Incentive / Bonus remarks or notes"
                          class="bonus-remarks-input">`;

            let actionBonusBtns = `
                <button type="button" class="btn-icon" onclick="openEmployeePayslip('${emp.id}', 'bonus')" title="Generate &amp; Print Incentives/Bonus Voucher" style="background:#fef3c7; color:#b45309; border:1px solid #fde68a; width:24px; height:24px; border-radius:4px; font-size:0.70rem; display:inline-flex; align-items:center; justify-content:center; cursor:pointer; margin:0 1px;">
                    <i class="fas fa-gift"></i>
                </button>
            `;
            if (!isUserTeacher) {
                actionBonusBtns += `
                    <button type="button" class="btn-icon edit" onclick="openNewEmployeeModal('${emp.id}')" title="Edit Employee Details" style="margin:0 1px; width:24px; height:24px; border-radius:4px; font-size:0.70rem;">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button type="button" class="btn-icon delete" onclick="deletePayrollEmployee('${emp.id}')" title="Delete Employee Record" style="margin:0 1px; width:24px; height:24px; border-radius:4px; font-size:0.70rem;">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                `;
            }

            return `
                <tr data-emp-id="${emp.id}">
                    <td style="color:#64748b; font-weight:600; font-size:0.78rem; text-align:center;">${idx + 1}</td>
                    <td><strong style="font-family: monospace; font-size: 0.78rem; color: #0b2545;">${escapeHtml(emp.employeeNo)}</strong></td>
                    <td>
                        <div style="font-weight: 700; color: #0f172a; font-size: 0.81rem; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${escapeHtml(emp.name)}">${escapeHtml(emp.name)}</div>
                        <div style="font-size: 0.71rem; color: #64748b;">${escapeHtml(emp.department || 'Faculty')}</div>
                    </td>
                    <td>
                        <span style="display:inline-block; padding: 2px 6px; border-radius: 4px; background: #e0f2fe; color: #0369a1; font-weight: 600; font-size: 0.72rem; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${escapeHtml(emp.position)}">
                            ${escapeHtml(emp.position)}
                        </span>
                    </td>
                    <td style="text-align:center;">${typeCell}</td>
                    <td style="text-align:center;">${amountCell}</td>
                    <td>${bonusRemarksCell}</td>
                    <td style="text-align:center;">${statusBadge}</td>
                    <td class="text-center actions-cell">${actionBonusBtns}</td>
                </tr>
            `;
        } else {
            const d15Cell = isUserTeacher
                ? `<div style="font-weight:700; font-size:0.78rem; color:#0369a1;">${d15}d</div>`
                : `<input type="number" min="0" max="16" step="0.5" value="${d15}" 
                       onchange="updateEmployeeDays('${emp.id}', '15th', this.value)" 
                       title="Days attended 1st half (1st-15th)" 
                       style="width:36px; text-align:center; padding:2px 3px; border:1px solid #cbd5e1; border-radius:3px; font-weight:700; color:#0369a1; font-size:0.78rem;">`;

            return `
                <tr data-emp-id="${emp.id}">
                    <td style="color:#64748b; font-weight:600; font-size:0.78rem;">${idx + 1}</td>
                    <td><strong style="font-family: monospace; font-size: 0.78rem; color: #0b2545;">${escapeHtml(emp.employeeNo)}</strong></td>
                    <td>
                        <div style="font-weight: 700; color: #0f172a; font-size: 0.81rem; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${escapeHtml(emp.name)}">${escapeHtml(emp.name)}</div>
                        <div style="font-size: 0.71rem; color: #64748b;">${escapeHtml(emp.department || 'Faculty')}</div>
                    </td>
                    <td>
                        <span style="display:inline-block; padding: 2px 6px; border-radius: 4px; background: #e0f2fe; color: #0369a1; font-weight: 600; font-size: 0.72rem; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${escapeHtml(emp.position)}">
                            ${escapeHtml(emp.position)}
                        </span>
                    </td>
                    <td class="text-right" style="font-weight: 700; color: #0b2545; font-size: 0.80rem;">₱${formatNumber(rate)}</td>
                    <td style="text-align:center;">${d15Cell}</td>
                    <td class="text-right" style="font-weight: 700; color: #0284c7; font-size: 0.80rem;">₱${formatNumber(c15)}</td>
                    <td>${remarksCell}</td>
                    <td style="text-align:center;">${statusBadge}</td>
                    <td class="text-center actions-cell">${actionBtns}</td>
                </tr>
            `;
        }
    }).join('');
}

function recalcEmployeeModalSalary() {
    const rate = Number(document.getElementById('empDailyRate')?.value) || 363.60;
    const d15 = Number(document.getElementById('empDays15th')?.value) || 0;
    const d30 = Number(document.getElementById('empDays30th')?.value) || 0;
    const c15 = Math.round(d15 * rate * 100) / 100;
    const c30 = Math.round(d30 * rate * 100) / 100;
    const total = Math.round((c15 + c30) * 100) / 100;

    const salaryEl = document.getElementById('empSalary');
    if (salaryEl) salaryEl.value = total;
    const schedEl = document.getElementById('empSchedule');
    if (schedEl) schedEl.value = `15th: ₱${formatNumber(c15)} (${d15}d) | 30th: ₱${formatNumber(c30)} (${d30}d)`;
}

function openNewEmployeeModal(editId = null) {
    if (typeof isTeacher === 'function' && isTeacher()) {
        showToast('Access Restricted: Teachers cannot encode or modify employee payroll records.', 'warning');
        return;
    }

    const modal = document.getElementById('newEmployeeModal');
    if (!modal) return;

    const inpEditId = document.getElementById('empEditId');
    const inpNo = document.getElementById('empNo');
    const inpName = document.getElementById('empName');
    const inpPos = document.getElementById('empPosition');
    const inpDept = document.getElementById('empDepartment');
    const inpDaily = document.getElementById('empDailyRate');
    const inpD15 = document.getElementById('empDays15th');
    const inpD30 = document.getElementById('empDays30th');
    const inpIncentive = document.getElementById('empIncentive');
    const inpBonus = document.getElementById('empBonus');
    const inpSal = document.getElementById('empSalary');
    const inpSy = document.getElementById('empSchoolYear');
    const inpDate = document.getElementById('empDateHired');
    const inpStatus = document.getElementById('empStatus');
    const title = document.getElementById('newEmployeeModalTitle');
    const btnSave = document.getElementById('btnSaveEmployee');

    if (editId) {
        const allEmployees = getPayrollEmployees();
        const emp = allEmployees.find(e => e.id === editId);
        if (!emp) return;

        if (inpEditId) inpEditId.value = emp.id;
        if (inpNo) inpNo.value = emp.employeeNo || '';
        if (inpName) inpName.value = emp.name || '';
        if (inpPos) inpPos.value = emp.position || '';
        if (inpDept) inpDept.value = emp.department || 'Junior High School Faculty';
        if (inpDaily) inpDaily.value = emp.dailyRate || 363.60;
        if (inpD15) inpD15.value = (emp.daysAttended15th !== undefined) ? emp.daysAttended15th : 11;
        if (inpD30) inpD30.value = (emp.daysAttended30th !== undefined) ? emp.daysAttended30th : 11;
        if (inpIncentive) inpIncentive.value = (emp.incentive !== undefined) ? emp.incentive : 1000;
        if (inpBonus) inpBonus.value = (emp.bonus !== undefined) ? emp.bonus : 2000;
        if (inpSal) inpSal.value = emp.monthlySalary || 7999.20;
        if (inpSy) inpSy.value = emp.schoolYear || '2026-2027';
        if (inpDate) inpDate.value = emp.dateHired || '';
        if (inpStatus) inpStatus.value = emp.employmentStatus || 'Active';

        recalcEmployeeModalSalary();

        if (title) title.textContent = `Edit Employee: ${emp.name}`;
        if (btnSave) btnSave.innerHTML = '<i class="fas fa-save"></i> Update Employee Record';
    } else {
        if (inpEditId) inpEditId.value = '';
        if (inpNo) {
            const allEmployees = getPayrollEmployees();
            const nextNum = allEmployees.length + 1;
            inpNo.value = 'T' + String(nextNum).padStart(3, '0');
        }
        if (inpName) inpName.value = '';
        if (inpPos) inpPos.value = '';
        if (inpDept) inpDept.value = 'Junior High School Faculty';
        if (inpDaily) inpDaily.value = '363.60';
        if (inpD15) inpD15.value = '11';
        if (inpD30) inpD30.value = '11';
        if (inpIncentive) inpIncentive.value = '1000';
        if (inpBonus) inpBonus.value = '2000';
        if (inpSal) inpSal.value = '7999.20';
        if (inpSy) inpSy.value = '2026-2027';
        if (inpDate) inpDate.value = new Date().toISOString().split('T')[0];
        if (inpStatus) inpStatus.value = 'Active';

        recalcEmployeeModalSalary();

        if (title) title.textContent = 'Encode New Hired Employee';
        if (btnSave) btnSave.innerHTML = '<i class="fas fa-save"></i> Save Employee Record';
    }

    modal.style.display = 'flex';
    modal.classList.add('show', 'active');
}

function closeNewEmployeeModal() {
    const modal = document.getElementById('newEmployeeModal');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('show', 'active');
    }
}

function updatePayoutPreviews(val) {
    recalcEmployeeModalSalary();
}

function handleSaveEmployee(e) {
    if (e && e.preventDefault) e.preventDefault();

    if (typeof isTeacher === 'function' && isTeacher()) {
        showToast('Access Restricted: Teachers cannot encode or edit employees.', 'warning');
        return;
    }

    const editId = document.getElementById('empEditId')?.value;
    const empNo = (document.getElementById('empNo')?.value || '').trim().toUpperCase();
    const name = (document.getElementById('empName')?.value || '').trim();
    const position = (document.getElementById('empPosition')?.value || '').trim();
    const department = document.getElementById('empDepartment')?.value || 'Junior High School Faculty';
    const dailyRate = Number(document.getElementById('empDailyRate')?.value) || 363.60;
    const d15 = Number(document.getElementById('empDays15th')?.value) || 11;
    const d30 = Number(document.getElementById('empDays30th')?.value) || 11;
    const c15 = Math.round(d15 * dailyRate * 100) / 100;
    const c30 = Math.round(d30 * dailyRate * 100) / 100;
    const salary = Math.round((c15 + c30) * 100) / 100;
    const schoolYear = document.getElementById('empSchoolYear')?.value || '2026-2027';
    const dateHired = document.getElementById('empDateHired')?.value || new Date().toISOString().split('T')[0];
    const status = document.getElementById('empStatus')?.value || 'Active';
    const incentive = Number(document.getElementById('empIncentive')?.value) || 1000;
    const bonus = Number(document.getElementById('empBonus')?.value) || 2000;

    if (!empNo || !name || !position) {
        showToast('Please fill in Employee No., Full Name, and Position.', 'warning');
        return;
    }

    const allEmployees = getPayrollEmployees();

    if (editId) {
        const idx = allEmployees.findIndex(e => e.id === editId);
        if (idx !== -1) {
            allEmployees[idx] = {
                ...allEmployees[idx],
                employeeNo: empNo,
                name: name,
                position: position,
                department: department,
                dailyRate: dailyRate,
                daysAttended15th: d15,
                daysAttended30th: d30,
                monthlySalary: salary,
                cutoff15th: c15,
                cutoff30th: c30,
                incentive: incentive,
                bonus: bonus,
                schoolYear: schoolYear,
                dateHired: dateHired,
                employmentStatus: status
            };
            savePayrollEmployees(allEmployees);
            if (typeof logActivity === 'function') {
                logActivity('Employee Updated', `Updated employee record for ${name} (${empNo} - ${position})`);
            }
            showToast(`Employee record for ${name} updated successfully!`, 'success');
        }
    } else {
        const newEmp = {
            id: 'EMP-' + Date.now(),
            employeeNo: empNo,
            name: name,
            position: position,
            department: department,
            dailyRate: dailyRate,
            daysAttended15th: d15,
            daysAttended30th: d30,
            monthlySalary: salary,
            cutoff15th: c15,
            cutoff30th: c30,
            incentive: incentive,
            bonus: bonus,
            payoutSchedule: 'Semi-Monthly (15th & 30th)',
            schoolYear: schoolYear,
            dateHired: dateHired,
            employmentStatus: status
        };
        allEmployees.push(newEmp);
        savePayrollEmployees(allEmployees);
        if (typeof logActivity === 'function') {
            logActivity('New Employee Hired', `Encoded new employee ${name} (${empNo} - ${position}) at ₱${formatNumber(dailyRate)}/day`);
        }
        showToast(`New employee ${name} (${empNo}) successfully encoded!`, 'success');
    }

    closeNewEmployeeModal();
    refreshPayrollPage();
}

function deletePayrollEmployee(id) {
    if (typeof isTeacher === 'function' && isTeacher()) {
        showToast('Access Restricted: Teachers cannot delete employee records.', 'warning');
        return;
    }

    const allEmployees = getPayrollEmployees();
    const target = allEmployees.find(e => e.id === id);
    if (!target) return;

    requestAdminAuth(() => {
        proceedDeletePayrollEmployee(target);
    }, 'Delete Employee Record', `Deleting official payroll and service record for ${target.name} (${target.employeeNo} - ${target.position}) requires Administrator credentials verification.`, true);
}

function proceedDeletePayrollEmployee(target) {
    if (!confirm(`Are you sure you want to DELETE employee record for ${target.name} (${target.employeeNo} - ${target.position})?\n\nThis will remove them from the active payroll roster.`)) {
        return;
    }

    const allEmployees = getPayrollEmployees();
    const updated = allEmployees.filter(e => e.id !== target.id);
    savePayrollEmployees(updated);

    if (typeof logActivity === 'function') {
        logActivity('Employee Deleted', `Deleted employee record for ${target.name} (${target.employeeNo})`);
    }

    refreshPayrollPage();
    showToast(`Employee ${target.name} deleted successfully.`, 'info');
}

// Universal Refresh Buttons Trigger with Spin Animation & Feedback
function triggerRefreshWithAnimation(btnOrEvent, callback, successMessage) {
    let btn = null;
    if (btnOrEvent && btnOrEvent.currentTarget) btn = btnOrEvent.currentTarget;
    else if (btnOrEvent && btnOrEvent.target) {
        btn = btnOrEvent.target.closest('button');
    } else if (btnOrEvent && btnOrEvent.tagName === 'BUTTON') {
        btn = btnOrEvent;
    }
    const icon = btn ? btn.querySelector('i.fa-sync-alt, i.fa-sync') : null;
    if (icon) icon.classList.add('fa-spin');
    if (btn) btn.disabled = true;

    try {
        if (typeof callback === 'function') callback();
    } catch (err) {
        console.error('Refresh error:', err);
    }

    setTimeout(() => {
        if (icon) icon.classList.remove('fa-spin');
        if (btn) btn.disabled = false;
        if (successMessage && typeof showToast === 'function') {
            showToast(successMessage, 'success');
        }
    }, 450);
}

function triggerCashFlowRefresh(e) {
    triggerRefreshWithAnimation(e, refreshCashFlowPage, 'Daily Cash In & Out Flow transactions refreshed successfully.');
}
function triggerClearanceRefresh(e) {
    triggerRefreshWithAnimation(e, refreshClearancePage, 'Student examination clearance roster refreshed successfully.');
}
function triggerPayrollRefresh(e) {
    triggerRefreshWithAnimation(e, refreshPayrollPage, 'Faculty & staff payroll roster refreshed successfully.');
}
function triggerActivitiesRefresh(e) {
    triggerRefreshWithAnimation(e, refreshActivitiesPage, 'Current activities logs refreshed successfully.');
}

let currentPayslipEmployee = null;

function openEmployeePayslip(id, cutoff = '15th') {
    const allEmployees = getPayrollEmployees();
    const emp = allEmployees.find(e => e.id === id);
    if (!emp) return;

    currentPayslipEmployee = emp;

    const area = document.getElementById('payslipPrintArea');
    if (!area) return;

    const rate = Number(emp.dailyRate) || 363.60;
    const d15 = (emp.daysAttended15th !== undefined) ? Number(emp.daysAttended15th) : 11;
    const d30 = (emp.daysAttended30th !== undefined) ? Number(emp.daysAttended30th) : 11;
    const c15 = (emp.cutoff15th !== undefined) ? Number(emp.cutoff15th) : Math.round(d15 * rate * 100) / 100;
    const c30 = (emp.cutoff30th !== undefined) ? Number(emp.cutoff30th) : Math.round(d30 * rate * 100) / 100;
    const salary = (emp.monthlySalary !== undefined) ? Number(emp.monthlySalary) : Math.round((c15 + c30) * 100) / 100;
    const inc = (emp.incentive !== undefined) ? Number(emp.incentive) : 1000;
    const bon = (emp.bonus !== undefined) ? Number(emp.bonus) : 2000;
    const totalBonus = Math.round((inc + bon) * 100) / 100;

    const now = new Date();
    const monthSelect = document.getElementById('payrollFilterMonth');
    let monthLabel = '';
    if (monthSelect && monthSelect.value !== 'ALL') {
        const mText = monthSelect.options[monthSelect.selectedIndex]?.text || '';
        const syYear = emp.schoolYear ? emp.schoolYear.split('-')[0] : now.getFullYear();
        monthLabel = `${mText} ${syYear}`;
    } else {
        monthLabel = now.toLocaleDateString('en-PH', { month: 'long', year: 'numeric' });
    }

    if (cutoff === 'bonus') {
        const bType = emp.bonusType || (emp.bonus > 0 ? 'Bonus' : 'Incentive');
        const bAmt = (emp.bonusAmount !== undefined)
            ? Number(emp.bonusAmount)
            : ((Number(emp.bonus) || 0) + (Number(emp.incentive) || 0)) || 1000;
        const bRem = emp.bonusRemarks || emp.remarks || 'Authorized Grant';

        area.innerHTML = `
            <div style="text-align:center; border-bottom:2px solid #0b2545; padding-bottom:12px; margin-bottom:14px;">
                <div style="display:flex; align-items:center; justify-content:center; gap:12px; margin-bottom:4px;">
                    <img src="school-logo.png" alt="Logo" style="height:48px; width:auto;">
                    <div>
                        <h3 style="margin:0; color:#0b2545; font-size:1.05rem; font-weight:800; text-transform:uppercase;">Montessori de San Jose Foundation Inc.</h3>
                        <p style="margin:2px 0 0 0; font-size:0.75rem; color:#64748b;">0696 P. Burgos St., Brgy. Pag-asa, San Jose, Occidental Mindoro &bull; DepEd Recognized</p>
                    </div>
                </div>
                <h4 style="margin:8px 0 0 0; font-size:0.95rem; color:#b45309; letter-spacing:0.5px;"><i class="fas fa-gift" style="margin-right:6px;"></i> OFFICIAL INCENTIVES &amp; BONUS DISBURSEMENT VOUCHER</h4>
                <div style="font-size:0.78rem; font-weight:700; color:#0369a1; margin-top:2px;">Period: ${monthLabel} &bull; S.Y. ${emp.schoolYear || '2026-2027'}</div>
            </div>

            <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:12px 14px; margin-bottom:16px; font-size:0.84rem;">
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
                    <div><strong>Employee Name:</strong> <span style="color:#0b2545; font-weight:700;">${escapeHtml(emp.name)}</span></div>
                    <div><strong>Employee No.:</strong> <code style="font-weight:700; color:#0b2545;">${escapeHtml(emp.employeeNo)}</code></div>
                    <div><strong>Position:</strong> ${escapeHtml(emp.position)}</div>
                    <div><strong>Department:</strong> ${escapeHtml(emp.department || 'Faculty')}</div>
                </div>
            </div>

            <div style="border:1px solid #cbd5e1; border-radius:8px; overflow:hidden; margin-bottom:16px;">
                <table style="width:100%; border-collapse:collapse; font-size:0.84rem;">
                    <tr style="background:#0b2545; color:#fff;">
                        <th style="padding:7px 10px; text-align:left;">Classification</th>
                        <th style="padding:7px 10px; text-align:center;">Type of Grant</th>
                        <th style="padding:7px 10px; text-align:left;">Remarks / Purpose</th>
                        <th style="padding:7px 10px; text-align:right;">Amount to be Given (PHP)</th>
                    </tr>
                    <tr style="border-bottom:1px solid #e2e8f0; background:#f0fdf4;">
                        <td style="padding:9px 10px; font-weight:700; color:#0b2545;"><i class="fas fa-gift" style="color:#d97706; margin-right:6px;"></i> ${escapeHtml(bType)}</td>
                        <td style="padding:9px 10px; text-align:center; font-weight:700; color:#0369a1;">${escapeHtml(bType)}</td>
                        <td style="padding:9px 10px; font-size:0.80rem; color:#475569;">${escapeHtml(bRem)}</td>
                        <td style="padding:9px 10px; text-align:right; font-weight:800; font-size:0.95rem; color:#059669;">₱${formatNumber(bAmt)}</td>
                    </tr>
                    <tr style="background:#fef3c7; font-weight:700; font-size:0.90rem;">
                        <td colspan="3" style="padding:9px 10px; color:#0b2545;">Total Amount to be Given to Staff</td>
                        <td style="padding:9px 10px; text-align:right; color:#b45309; font-weight:800; font-size:1rem;">₱${formatNumber(bAmt)}</td>
                    </tr>
                </table>
            </div>

            <div style="margin-top:24px; display:flex; justify-content:space-between; text-align:center; font-size:0.80rem;">
                <div style="width:45%;">
                    <div style="border-top:1.5px solid #000; padding-top:4px; margin-top:28px;">
                        <strong>CARRELLE B. COLEGADO</strong><br>
                        <span style="font-size:0.74rem; color:#64748b;">Registrar / In-Charge, Accounting</span>
                    </div>
                </div>
                <div style="width:45%;">
                    <div style="border-top:1.5px solid #000; padding-top:4px; margin-top:28px;">
                        <strong>NIÑO ALOYSIUS B. COLEGADO</strong><br>
                        <span style="font-size:0.74rem; color:#64748b;">School President</span>
                    </div>
                </div>
            </div>
        `;
        const modal = document.getElementById('payslipModal');
        if (modal) {
            modal.style.display = 'flex';
            modal.classList.add('show', 'active');
        }
        return;
    }

    area.innerHTML = `
        <div style="text-align:center; border-bottom:2px solid #0b2545; padding-bottom:12px; margin-bottom:14px;">
            <div style="display:flex; align-items:center; justify-content:center; gap:12px; margin-bottom:4px;">
                <img src="school-logo.png" alt="Logo" style="height:48px; width:auto;">
                <div>
                    <h3 style="margin:0; color:#0b2545; font-size:1.05rem; font-weight:800; text-transform:uppercase;">Montessori de San Jose Foundation Inc.</h3>
                    <p style="margin:2px 0 0 0; font-size:0.75rem; color:#64748b;">0696 P. Burgos St., Brgy. Pag-asa, San Jose, Occidental Mindoro &bull; DepEd Recognized</p>
                </div>
            </div>
            <h4 style="margin:8px 0 0 0; font-size:0.95rem; color:#1e293b; letter-spacing:0.5px;">OFFICIAL EMPLOYEE COMPENSATION PAYSLIP</h4>
            <div style="font-size:0.78rem; font-weight:700; color:#0369a1; margin-top:2px;">Month of ${monthLabel} &bull; S.Y. ${emp.schoolYear || '2026-2027'}</div>
        </div>

        <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:12px 14px; margin-bottom:16px; font-size:0.84rem;">
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
                <div><strong>Employee Name:</strong> <span style="color:#0b2545; font-weight:700;">${escapeHtml(emp.name)}</span></div>
                <div><strong>Employee No.:</strong> <code style="font-weight:700; color:#0b2545;">${escapeHtml(emp.employeeNo)}</code></div>
                <div><strong>Position:</strong> ${escapeHtml(emp.position)}</div>
                <div><strong>Department:</strong> ${escapeHtml(emp.department || 'Faculty')}</div>
            </div>
        </div>

        <div style="border:1px solid #cbd5e1; border-radius:8px; overflow:hidden; margin-bottom:16px;">
            <table style="width:100%; border-collapse:collapse; font-size:0.84rem;">
                <tr style="background:#0b2545; color:#fff;">
                    <th style="padding:7px 10px; text-align:left;">Compensation / Earnings Basis</th>
                    <th style="padding:7px 10px; text-align:center;">Days Attended</th>
                    <th style="padding:7px 10px; text-align:right;">Amount (PHP)</th>
                </tr>
                <tr style="border-bottom:1px solid #e2e8f0;">
                    <td style="padding:8px 10px;">Daily Compensation Rate</td>
                    <td style="padding:8px 10px; text-align:center;">—</td>
                    <td style="padding:8px 10px; text-align:right; font-weight:600;">&#8369;${formatNumber(rate)} / day</td>
                </tr>
                <tr style="border-bottom:1px solid #e2e8f0; background:#f0fdf4;">
                    <td style="padding:8px 10px;"><i class="fas fa-check-circle" style="color:#16a34a; margin-right:4px;"></i> 1st Half Payout (15th of the month)</td>
                    <td style="padding:8px 10px; text-align:center; font-weight:700; color:#0284c7;">${d15} days</td>
                    <td style="padding:8px 10px; text-align:right; font-weight:700; color:#15803d;">&#8369;${formatNumber(c15)}</td>
                </tr>
                <tr style="border-bottom:1px solid #e2e8f0; background:#f0fdf4;">
                    <td style="padding:8px 10px;"><i class="fas fa-check-circle" style="color:#16a34a; margin-right:4px;"></i> 2nd Half Payout (30th of the month)</td>
                    <td style="padding:8px 10px; text-align:center; font-weight:700; color:#16a34a;">${d30} days</td>
                    <td style="padding:8px 10px; text-align:right; font-weight:700; color:#15803d;">&#8369;${formatNumber(c30)}</td>
                </tr>
                <tr style="background:#f8fafc; font-weight:700; font-size:0.90rem;">
                    <td style="padding:9px 10px; color:#0b2545;">Total Monthly Net Compensation</td>
                    <td style="padding:9px 10px; text-align:center; color:#0b2545;">${d15 + d30} days</td>
                    <td style="padding:9px 10px; text-align:right; color:#15803d;">&#8369;${formatNumber(salary)}</td>
                </tr>
            </table>
        </div>

        <div style="margin-top:24px; display:flex; justify-content:space-between; text-align:center; font-size:0.80rem;">
            <div style="width:45%;">
                <div style="border-top:1.5px solid #000; padding-top:4px; margin-top:28px;">
                    <strong>CARRELLE B. COLEGADO</strong><br>
                    <span style="font-size:0.74rem; color:#64748b;">Registrar / In-Charge, Accounting</span>
                </div>
            </div>
            <div style="width:45%;">
                <div style="border-top:1.5px solid #000; padding-top:4px; margin-top:28px;">
                    <strong>NIÑO ALOYSIUS B. COLEGADO</strong><br>
                    <span style="font-size:0.74rem; color:#64748b;">School President</span>
                </div>
            </div>
        </div>
    `;

    const modal = document.getElementById('payslipModal');
    if (modal) {
        modal.style.display = 'flex';
        modal.classList.add('show', 'active');
    }
}

function closePayslipModal() {
    const modal = document.getElementById('payslipModal');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('show', 'active');
    }
    currentPayslipEmployee = null;
}

function printCurrentPayslip() {
    if (!currentPayslipEmployee) return;
    const printArea = document.getElementById('payslipPrintArea');
    if (!printArea) return;

    const printWin = window.open('', '_blank', 'width=700,height=600');
    if (!printWin) {
        window.print();
        return;
    }

    printWin.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>MDSJFI - Official Payslip (${escapeHtml(currentPayslipEmployee.name)})</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 30px; color: #1e293b; }
                table { width: 100%; border-collapse: collapse; }
                th, td { padding: 8px 10px; }
                @media print {
                    @page { size: portrait; margin: 15mm; }
                    body { margin: 0; }
                }
            </style>
        </head>
        <body>
            ${printArea.innerHTML}
        </body>
        </html>
    `);
    printWin.document.close();
    printWin.focus();
    setTimeout(() => {
        printWin.print();
    }, 350);
}

function convertNumberToWordsPesos(amount) {
    if (isNaN(amount) || amount === null || amount === undefined) return 'Zero Pesos Only';
    amount = Math.round(Number(amount) * 100) / 100;
    if (amount <= 0) return 'Zero Pesos Only';

    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
                  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
                  'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    function convertGroup(num) {
        let str = '';
        if (num >= 100) {
            str += ones[Math.floor(num / 100)] + ' Hundred ';
            num %= 100;
        }
        if (num >= 20) {
            str += tens[Math.floor(num / 10)] + (num % 10 > 0 ? '-' + ones[num % 10] : '') + ' ';
        } else if (num > 0) {
            str += ones[num] + ' ';
        }
        return str.trim();
    }

    const wholePart = Math.floor(amount);
    const centavosPart = Math.round((amount - wholePart) * 100);

    let words = '';
    const billions = Math.floor(wholePart / 1000000000);
    const millions = Math.floor((wholePart % 1000000000) / 1000000);
    const thousands = Math.floor((wholePart % 1000000) / 1000);
    const remainder = wholePart % 1000;

    if (billions > 0) words += convertGroup(billions) + ' Billion ';
    if (millions > 0) words += convertGroup(millions) + ' Million ';
    if (thousands > 0) words += convertGroup(thousands) + ' Thousand ';
    if (remainder > 0 || words === '') words += convertGroup(remainder) + ' ';

    words = words.trim();
    if (!words) words = 'Zero';

    if (centavosPart > 0) {
        return `${words} Pesos and ${centavosPart}/100 Only`;
    } else {
        return `${words} Pesos Only`;
    }
}
window.convertNumberToWordsPesos = convertNumberToWordsPesos;

function printPayrollSummary() {
    const allEmployees = getPayrollEmployees();
    const syFilterVal = document.getElementById('payrollFilterSy')?.value || '2026-2027';
    const cutoffSelect = document.getElementById('payrollCutoffFilter');
    const cutoffFilterVal = (cutoffSelect && cutoffSelect.value) ? cutoffSelect.value : (currentPayrollSubTab || '15th');
    const monthNum = document.getElementById('payrollFilterMonth')?.value || '10';
    const monthNames = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const monthName = (monthNum === 'ALL') ? 'All Months / Whole Year' : (monthNames[Number(monthNum)] || 'October');

    const statusFilterEl = document.getElementById('payrollStatusFilter');
    const statusFilterVal = statusFilterEl ? statusFilterEl.value : 'Active';
    const searchVal = (document.getElementById('payrollSearchInput')?.value || '').toLowerCase().trim();

    const list = allEmployees.filter(emp => {
        if (syFilterVal && syFilterVal !== 'ALL' && (emp.schoolYear || '2026-2027') !== syFilterVal) return false;
        if (statusFilterEl) {
            if (statusFilterVal !== 'ALL' && emp.employmentStatus !== statusFilterVal) return false;
        } else {
            if (emp.employmentStatus === 'Inactive') return false;
        }
        if (searchVal) {
            const text = `${emp.employeeNo || ''} ${emp.name || ''} ${emp.position || ''} ${emp.department || ''} ${emp.remarks || ''}`.toLowerCase();
            if (!text.includes(searchVal)) return false;
        }
        return true;
    });

    let totalMonthly = 0;
    let total15th = 0;
    let total30th = 0;
    let totalBonusDisb = 0;

    let tableHeadHtml = '';
    let tableFootHtml = '';
    let payoutPeriodLabel = 'Full Month (15th & 30th Day Payout)';

    if (cutoffFilterVal === '15th') {
        payoutPeriodLabel = '15th Day Payout Period (1st - 15th)';
        tableHeadHtml = `
            <tr>
                <th style="width:4%; text-align:center;">#</th>
                <th style="width:9%; text-align:center;">Emp No.</th>
                <th style="width:20%; text-align:left;">Faculty / Employee Name</th>
                <th style="width:18%; text-align:left;">Position &amp; Subject Assignment</th>
                <th style="width:10%; text-align:right;">Daily Rate</th>
                <th style="width:9%; text-align:center;">Days (1st-15th)</th>
                <th style="width:11%; text-align:right;">15th Payout</th>
                <th style="width:9%; text-align:left;">Remarks / Notes</th>
                <th style="width:10%; text-align:center;">Signature</th>
            </tr>
        `;
    } else if (cutoffFilterVal === '30th') {
        payoutPeriodLabel = '30th Day Payout Period (16th - 30th/31st)';
        tableHeadHtml = `
            <tr>
                <th style="width:4%; text-align:center;">#</th>
                <th style="width:9%; text-align:center;">Emp No.</th>
                <th style="width:20%; text-align:left;">Faculty / Employee Name</th>
                <th style="width:18%; text-align:left;">Position &amp; Subject Assignment</th>
                <th style="width:10%; text-align:right;">Daily Rate</th>
                <th style="width:9%; text-align:center;">Days (16th-30th)</th>
                <th style="width:11%; text-align:right;">30th Payout</th>
                <th style="width:9%; text-align:left;">Remarks / Notes</th>
                <th style="width:10%; text-align:center;">Signature</th>
            </tr>
        `;
    } else if (cutoffFilterVal === 'bonus') {
        payoutPeriodLabel = 'Official Incentives &amp; Bonus Grant Summary';
        tableHeadHtml = `
            <tr>
                <th style="width:4%; text-align:center;">#</th>
                <th style="width:9%; text-align:center;">Emp No.</th>
                <th style="width:22%; text-align:left;">Faculty / Employee Name</th>
                <th style="width:20%; text-align:left;">Position &amp; Subject Assignment</th>
                <th style="width:11%; text-align:center;">Type</th>
                <th style="width:14%; text-align:right;">Amount to be Given</th>
                <th style="width:10%; text-align:left;">Remarks / Basis</th>
                <th style="width:10%; text-align:center;">Signature</th>
            </tr>
        `;
    } else {
        tableHeadHtml = `
            <tr>
                <th style="width:3%; text-align:center;">#</th>
                <th style="width:7.5%; text-align:center;">Emp No.</th>
                <th style="width:18%; text-align:left;">Faculty / Employee Name</th>
                <th style="width:14.5%; text-align:left;">Position &amp; Subject</th>
                <th style="width:8%; text-align:right;">Daily Rate</th>
                <th style="width:8%; text-align:center;">Days Attended</th>
                <th style="width:9.5%; text-align:right;">15th Payout</th>
                <th style="width:9.5%; text-align:right;">30th Payout</th>
                <th style="width:10%; text-align:right;">Total Monthly</th>
                <th style="width:8%; text-align:left;">Remarks</th>
                <th style="width:9%; text-align:center;">Signature</th>
            </tr>
        `;
    }

    const rows = list.map((emp, idx) => {
        const rate = Number(emp.dailyRate) || 363.60;
        const d15 = (emp.daysAttended15th !== undefined) ? Number(emp.daysAttended15th) : 11;
        const d30 = (emp.daysAttended30th !== undefined) ? Number(emp.daysAttended30th) : 11;
        const c15 = (emp.cutoff15th !== undefined) ? Number(emp.cutoff15th) : Math.round(d15 * rate * 100) / 100;
        const c30 = (emp.cutoff30th !== undefined) ? Number(emp.cutoff30th) : Math.round(d30 * rate * 100) / 100;
        const salary = (emp.monthlySalary !== undefined) ? Number(emp.monthlySalary) : Math.round((c15 + c30) * 100) / 100;
        const remarks = emp.remarks || '';

        totalMonthly = Math.round((totalMonthly + salary) * 100) / 100;
        total15th = Math.round((total15th + c15) * 100) / 100;
        total30th = Math.round((total30th + c30) * 100) / 100;

        if (cutoffFilterVal === '15th') {
            return `
                <tr>
                    <td style="padding:6px 8px; border:1px solid #cbd5e1; font-size:12px; text-align:center;">${idx + 1}</td>
                    <td style="padding:6px 8px; border:1px solid #cbd5e1; font-size:12px; font-family:monospace; font-weight:bold; text-align:center;">${escapeHtml(emp.employeeNo)}</td>
                    <td style="padding:6px 8px; border:1px solid #cbd5e1; font-size:12px; text-align:left;"><strong>${escapeHtml(emp.name)}</strong></td>
                    <td style="padding:6px 8px; border:1px solid #cbd5e1; font-size:12px; text-align:left;">${escapeHtml(emp.position)}</td>
                    <td style="padding:6px 8px; border:1px solid #cbd5e1; font-size:12px; text-align:right;">&#8369;${formatNumber(rate)}</td>
                    <td style="padding:6px 8px; border:1px solid #cbd5e1; font-size:12px; text-align:center; font-weight:bold; color:#0369a1;">${d15}d</td>
                    <td style="padding:6px 8px; border:1px solid #cbd5e1; font-size:12px; text-align:right; font-weight:bold; color:#0369a1;">&#8369;${formatNumber(c15)}</td>
                    <td style="padding:6px 8px; border:1px solid #cbd5e1; font-size:11px; color:#475569; text-align:left;">${escapeHtml(remarks)}</td>
                    <td style="padding:6px 8px; border:1px solid #cbd5e1; font-size:11px; text-align:center;">
                        <span style="border-bottom:1px solid #64748b; display:inline-block; width:80px; height:18px;"></span>
                    </td>
                </tr>
            `;
        } else if (cutoffFilterVal === '30th') {
            return `
                <tr>
                    <td style="padding:6px 8px; border:1px solid #cbd5e1; font-size:12px; text-align:center;">${idx + 1}</td>
                    <td style="padding:6px 8px; border:1px solid #cbd5e1; font-size:12px; font-family:monospace; font-weight:bold; text-align:center;">${escapeHtml(emp.employeeNo)}</td>
                    <td style="padding:6px 8px; border:1px solid #cbd5e1; font-size:12px; text-align:left;"><strong>${escapeHtml(emp.name)}</strong></td>
                    <td style="padding:6px 8px; border:1px solid #cbd5e1; font-size:12px; text-align:left;">${escapeHtml(emp.position)}</td>
                    <td style="padding:6px 8px; border:1px solid #cbd5e1; font-size:12px; text-align:right;">&#8369;${formatNumber(rate)}</td>
                    <td style="padding:6px 8px; border:1px solid #cbd5e1; font-size:12px; text-align:center; font-weight:bold; color:#16a34a;">${d30}d</td>
                    <td style="padding:6px 8px; border:1px solid #cbd5e1; font-size:12px; text-align:right; font-weight:bold; color:#16a34a;">&#8369;${formatNumber(c30)}</td>
                    <td style="padding:6px 8px; border:1px solid #cbd5e1; font-size:11px; color:#475569; text-align:left;">${escapeHtml(remarks)}</td>
                    <td style="padding:6px 8px; border:1px solid #cbd5e1; font-size:11px; text-align:center;">
                        <span style="border-bottom:1px solid #64748b; display:inline-block; width:80px; height:18px;"></span>
                    </td>
                </tr>
            `;
        } else if (cutoffFilterVal === 'bonus') {
            const bType = emp.bonusType || (emp.bonus > 0 ? 'Bonus' : 'Incentive');
            const bAmt = (emp.bonusAmount !== undefined)
                ? Number(emp.bonusAmount)
                : (((Number(emp.bonus) || 0) + (Number(emp.incentives) || Number(emp.incentive) || 0)) || 1000);
            const bRem = emp.bonusRemarks || emp.remarks || 'Authorized Grant';
            totalBonusDisb = Math.round((totalBonusDisb + bAmt) * 100) / 100;

            return `
                <tr>
                    <td style="padding:6px 8px; border:1px solid #cbd5e1; font-size:12px; text-align:center;">${idx + 1}</td>
                    <td style="padding:6px 8px; border:1px solid #cbd5e1; font-size:12px; font-family:monospace; font-weight:bold; text-align:center;">${escapeHtml(emp.employeeNo)}</td>
                    <td style="padding:6px 8px; border:1px solid #cbd5e1; font-size:12px; text-align:left;"><strong>${escapeHtml(emp.name)}</strong></td>
                    <td style="padding:6px 8px; border:1px solid #cbd5e1; font-size:12px; text-align:left;">${escapeHtml(emp.position)}</td>
                    <td style="padding:6px 8px; border:1px solid #cbd5e1; font-size:12px; text-align:center; font-weight:bold; color:#0369a1;">${escapeHtml(bType)}</td>
                    <td style="padding:6px 8px; border:1px solid #cbd5e1; font-size:12px; text-align:right; font-weight:bold; color:#059669;">&#8369;${formatNumber(bAmt)}</td>
                    <td style="padding:6px 8px; border:1px solid #cbd5e1; font-size:11px; color:#475569; text-align:left;">${escapeHtml(bRem)}</td>
                    <td style="padding:6px 8px; border:1px solid #cbd5e1; font-size:11px; text-align:center;">
                        <span style="border-bottom:1px solid #64748b; display:inline-block; width:80px; height:18px;"></span>
                    </td>
                </tr>
            `;
        } else {
            return `
                <tr>
                    <td style="padding:6px 6px; border:1px solid #cbd5e1; font-size:11px; text-align:center;">${idx + 1}</td>
                    <td style="padding:6px 6px; border:1px solid #cbd5e1; font-size:11px; font-family:monospace; font-weight:bold; text-align:center;">${escapeHtml(emp.employeeNo)}</td>
                    <td style="padding:6px 6px; border:1px solid #cbd5e1; font-size:11px; text-align:left;"><strong>${escapeHtml(emp.name)}</strong></td>
                    <td style="padding:6px 6px; border:1px solid #cbd5e1; font-size:11px; text-align:left;">${escapeHtml(emp.position)}</td>
                    <td style="padding:6px 6px; border:1px solid #cbd5e1; font-size:11px; text-align:right;">&#8369;${formatNumber(rate)}</td>
                    <td style="padding:6px 6px; border:1px solid #cbd5e1; font-size:11px; text-align:center;">${d15}d / ${d30}d</td>
                    <td style="padding:6px 6px; border:1px solid #cbd5e1; font-size:11px; text-align:right; color:#0284c7;">&#8369;${formatNumber(c15)}</td>
                    <td style="padding:6px 6px; border:1px solid #cbd5e1; font-size:11px; text-align:right; color:#16a34a;">&#8369;${formatNumber(c30)}</td>
                    <td style="padding:6px 6px; border:1px solid #cbd5e1; font-size:11px; text-align:right; font-weight:bold;">&#8369;${formatNumber(salary)}</td>
                    <td style="padding:6px 6px; border:1px solid #cbd5e1; font-size:10px; color:#475569; text-align:left;">${escapeHtml(remarks)}</td>
                    <td style="padding:6px 6px; border:1px solid #cbd5e1; font-size:10px; text-align:center;">
                        <span style="border-bottom:1px solid #64748b; display:inline-block; width:70px; height:16px;"></span>
                    </td>
                </tr>
            `;
        }
    }).join('');

    let activeNetPayable = 0;
    if (cutoffFilterVal === '15th') {
        activeNetPayable = total15th;
    } else if (cutoffFilterVal === '30th') {
        activeNetPayable = total30th;
    } else if (cutoffFilterVal === 'bonus') {
        activeNetPayable = totalBonusDisb;
    } else {
        activeNetPayable = totalMonthly;
    }
    activeNetPayable = Math.round(activeNetPayable * 100) / 100;

    if (cutoffFilterVal === '15th') {
        tableFootHtml = `
            <tr style="background:#f1f5f9; font-weight:bold;">
                <td colspan="6" style="padding:8px; text-align:right; font-size:12px; border:1px solid #cbd5e1; border-top:2px solid #0b2545;">TOTAL 15TH DAY PAYOUT:</td>
                <td style="padding:8px; text-align:right; font-size:12px; color:#0369a1; border:1px solid #cbd5e1; border-top:2px solid #0b2545;">&#8369;${formatNumber(total15th)}</td>
                <td colspan="2" style="border:1px solid #cbd5e1; border-top:2px solid #0b2545;"></td>
            </tr>
        `;
    } else if (cutoffFilterVal === '30th') {
        tableFootHtml = `
            <tr style="background:#f1f5f9; font-weight:bold;">
                <td colspan="6" style="padding:8px; text-align:right; font-size:12px; border:1px solid #cbd5e1; border-top:2px solid #0b2545;">TOTAL 30TH DAY PAYOUT:</td>
                <td style="padding:8px; text-align:right; font-size:12px; color:#16a34a; border:1px solid #cbd5e1; border-top:2px solid #0b2545;">&#8369;${formatNumber(total30th)}</td>
                <td colspan="2" style="border:1px solid #cbd5e1; border-top:2px solid #0b2545;"></td>
            </tr>
        `;
    } else if (cutoffFilterVal === 'bonus') {
        tableFootHtml = `
            <tr style="background:#fef3c7; font-weight:bold;">
                <td colspan="5" style="padding:8px 12px; text-align:right; font-size:12px; border:1px solid #cbd5e1; border-top:2px solid #0b2545;">TOTAL INCENTIVES &amp; BONUS DISBURSEMENT:</td>
                <td style="padding:8px; text-align:right; font-size:12.5px; font-weight:800; color:#059669; border:1px solid #cbd5e1; border-top:2px solid #0b2545;">&#8369;${formatNumber(totalBonusDisb)}</td>
                <td colspan="2" style="border:1px solid #cbd5e1; border-top:2px solid #0b2545; background:#fef3c7;"></td>
            </tr>
        `;
    } else {
        tableFootHtml = `
            <tr style="background:#f1f5f9; font-weight:bold;">
                <td colspan="6" style="padding:8px; text-align:right; font-size:11px; border:1px solid #cbd5e1; border-top:2px solid #0b2545;">TOTALS:</td>
                <td style="padding:8px; text-align:right; font-size:11px; color:#0284c7; border:1px solid #cbd5e1; border-top:2px solid #0b2545;">&#8369;${formatNumber(total15th)}</td>
                <td style="padding:8px; text-align:right; font-size:11px; color:#16a34a; border:1px solid #cbd5e1; border-top:2px solid #0b2545;">&#8369;${formatNumber(total30th)}</td>
                <td style="padding:8px; text-align:right; font-size:11px; font-weight:800; border:1px solid #cbd5e1; border-top:2px solid #0b2545;">&#8369;${formatNumber(totalMonthly)}</td>
                <td colspan="2" style="border:1px solid #cbd5e1; border-top:2px solid #0b2545;"></td>
            </tr>
        `;
    }

    const printWin = window.open('', '_blank', 'width=980,height=750');
    if (!printWin) {
        window.print();
        return;
    }

    const nowStr = new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });

    printWin.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>MDSJFI - Official Faculty &amp; Staff Payroll (S.Y. ${syFilterVal} - ${monthName})</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 24px; color: #1e293b; }
                .header { display: flex; align-items: center; justify-content: center; gap: 16px; border-bottom: 2px solid #0b2545; padding-bottom: 12px; margin-bottom: 16px; }
                .header h2 { margin: 0; color: #0b2545; font-size: 20px; text-transform: uppercase; letter-spacing: 0.5px; }
                .header p { margin: 3px 0 0 0; font-size: 12px; color: #64748b; }
                .meta-bar { display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 14px; background: #f8fafc; padding: 8px 12px; border-radius: 6px; border: 1px solid #e2e8f0; }
                table { width: 100% !important; border-collapse: collapse !important; margin-top: 10px; font-size: 12px; table-layout: fixed !important; }
                th, td { box-sizing: border-box !important; }
                th { background: #0b2545 !important; color: #fff !important; padding: 7px 8px !important; font-size: 11px !important; text-transform: uppercase !important; border: 1px solid #0b2545 !important; vertical-align: middle !important; }
                td { padding: 6px 8px !important; border: 1px solid #cbd5e1 !important; font-size: 11.5px !important; vertical-align: middle !important; }
                .signatures { margin-top: 40px; display: flex; justify-content: space-between; page-break-inside: avoid; }
                .sig-box { text-align: center; width: 44%; }
                .sig-label { font-size: 11px; font-weight: bold; color: #334155; margin-bottom: 30px; text-align: left; }
                .sig-line { border-top: 1.5px solid #000; margin-bottom: 4px; }
                .sig-name { font-weight: bold; font-size: 13px; }
                .sig-title { font-size: 11px; color: #475569; }
                @media print {
                    @page { size: landscape; margin: 12mm; }
                    body { margin: 0; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <img src="school-logo.png" alt="MDSJFI Official Logo" style="height:65px; width:65px; object-fit:contain;" onerror="this.src='logo.jpg'; this.onerror=null;">
                <div style="text-align:center;">
                    <h2>MONTESSORI DE SAN JOSE FOUNDATION INC.</h2>
                    <p style="margin: 2px 0 0 0; font-size: 12px; color: #475569;">0696 P. Burgost St., Brgy. Pag-asa, San Jose, Occidental Mindoro</p>
                    <p style="margin: 3px 0 0 0; font-size: 12px; font-weight: bold; color: #0b2545;">School Year ${syFilterVal}</p>
                    <h3 style="margin: 6px 0 0 0; color: #1e293b; font-size: 15px; letter-spacing: 0.5px; text-transform:uppercase;">OFFICIAL FACULTY &amp; STAFF PAYROLL</h3>
                    <p style="margin: 2px 0 0 0; font-size: 11px; color: #0b2545; font-weight: bold;">Month of ${monthName} &bull; ${payoutPeriodLabel} &bull; Printed: ${nowStr}</p>
                </div>
            </div>
            <div class="meta-bar">
                <div><strong>Total Personnel:</strong> ${list.length} Faculty &amp; Staff</div>
                <div><strong>Active Period:</strong> ${payoutPeriodLabel}</div>
                <div><strong>${cutoffFilterVal === 'bonus' ? 'Total Incentives &amp; Bonus:' : 'Total Net Payout:'}</strong> &#8369;${formatNumber(activeNetPayable)}</div>
            </div>
            <table>
                <thead>
                    ${tableHeadHtml}
                </thead>
                <tbody>
                    ${rows}
                </tbody>
                <tfoot>
                    ${tableFootHtml}
                </tfoot>
            </table>
            <!-- Generated Amount in Words in the Lower Part After the Table -->
            <div style="margin-top: 14px; background: #f8fafc; border: 1.5px solid #0b2545; border-radius: 6px; padding: 10px 14px; display: flex; align-items: center; justify-content: space-between; font-size: 12px; page-break-inside: avoid;">
                <div>
                    <span style="font-weight: 700; color: #0b2545; text-transform: uppercase; font-size: 11px; display: block; letter-spacing: 0.5px;">${cutoffFilterVal === 'bonus' ? 'Official Incentives &amp; Bonus Disbursement in Words:' : 'Official Net Payout in Words:'}</span>
                    <strong style="font-size: 13px; color: #0f172a; font-style: italic;">${convertNumberToWordsPesos(activeNetPayable)}</strong>
                </div>
                <div style="text-align: right;">
                    <span style="font-size: 11px; color: #64748b; font-weight: 600;">${cutoffFilterVal === 'bonus' ? 'Total Disbursement:' : 'Net Payable Total:'}</span>
                    <div style="font-size: 16px; font-weight: 800; color: ${cutoffFilterVal === 'bonus' ? '#059669' : '#0b2545'};">&#8369;${formatNumber(activeNetPayable)}</div>
                </div>
            </div>
            <div class="signatures">
                <div class="sig-box">
                    <div class="sig-label">Prepared by:</div>
                    <div class="sig-line"></div>
                    <div class="sig-name">CARRELLE B. COLEGADO</div>
                    <div class="sig-title">Registrar / In-Charge, Accounting</div>
                </div>
                <div class="sig-box">
                    <div class="sig-label">Approved by:</div>
                    <div class="sig-line"></div>
                    <div class="sig-name">NI&Ntilde;O ALOYSIUS B. COLEGADO</div>
                    <div class="sig-title">School President</div>
                </div>
            </div>
        </body>
        </html>
    `);
    printWin.document.close();
    printWin.focus();
    setTimeout(() => {
        printWin.print();
    }, 400);
}

function exportPayrollCSV() {
    const allEmployees = getPayrollEmployees();
    if (!allEmployees || allEmployees.length === 0) {
        showToast('No payroll records available to export.', 'warning');
        return;
    }

    const syVal = document.getElementById('payrollFilterSy')?.value || '2026-2027';
    const monthNum = document.getElementById('payrollFilterMonth')?.value || '10';
    const monthNames = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const monthName = (monthNum === 'ALL') ? 'All Months / Whole Year' : (monthNames[Number(monthNum)] || 'October');

    const cutoffSelect = document.getElementById('payrollCutoffFilter');
    const cutoffFilterVal = cutoffSelect ? cutoffSelect.value : (currentPayrollSubTab || '15th');

    if (cutoffFilterVal === 'bonus') {
        const headers = ['#', 'Employee No.', 'Faculty Name', 'Position & Subjects', 'Department', 'School Year', 'Month', 'Type', 'Amount to be Given (PHP)', 'Remarks', 'Employment Status'];

        const rows = allEmployees.map((emp, i) => {
            const bType = emp.bonusType || (emp.bonus > 0 ? 'Bonus' : 'Incentive');
            const bAmt = (emp.bonusAmount !== undefined)
                ? Number(emp.bonusAmount)
                : (((Number(emp.bonus) || 0) + (Number(emp.incentives) || Number(emp.incentive) || 0)) || 1000);
            const bRem = emp.bonusRemarks !== undefined ? emp.bonusRemarks : (emp.remarks || '');

            return [
                i + 1,
                `"${emp.employeeNo || ''}"`,
                `"${(emp.name || '').replace(/"/g, '""')}"`,
                `"${(emp.position || '').replace(/"/g, '""')}"`,
                `"${(emp.department || '').replace(/"/g, '""')}"`,
                `"${emp.schoolYear || syVal}"`,
                `"${monthName}"`,
                `"${bType.replace(/"/g, '""')}"`,
                bAmt.toFixed(2),
                `"${(bRem || '').replace(/"/g, '""')}"`,
                `"${emp.employmentStatus || 'Active'}"`
            ];
        });

        const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `MDSJFI_Official_Faculty_Incentives_Bonus_${monthName}_${syVal}_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        showToast(`Official Faculty & Staff Incentives/Bonus for ${monthName} exported as CSV.`, 'success');
        return;
    }

    const headers = ['#', 'Employee No.', 'Faculty Name', 'Position & Subjects', 'Department', 'School Year', 'Month', 'Daily Rate (PHP)', 'Days 15th', '15th Payout (PHP)', 'Days 30th', '30th Payout (PHP)', 'Monthly Total (PHP)', 'Remarks', 'Employment Status', 'Date Hired'];

    const rows = allEmployees.map((emp, i) => {
        const rate = Number(emp.dailyRate) || 363.60;
        const d15 = (emp.daysAttended15th !== undefined) ? Number(emp.daysAttended15th) : 11;
        const d30 = (emp.daysAttended30th !== undefined) ? Number(emp.daysAttended30th) : 11;
        const c15 = (emp.cutoff15th !== undefined) ? Number(emp.cutoff15th) : Math.round(d15 * rate * 100) / 100;
        const c30 = (emp.cutoff30th !== undefined) ? Number(emp.cutoff30th) : Math.round(d30 * rate * 100) / 100;
        const salary = (emp.monthlySalary !== undefined) ? Number(emp.monthlySalary) : Math.round((c15 + c30) * 100) / 100;

        return [
            i + 1,
            `"${emp.employeeNo || ''}"`,
            `"${(emp.name || '').replace(/"/g, '""')}"`,
            `"${(emp.position || '').replace(/"/g, '""')}"`,
            `"${(emp.department || '').replace(/"/g, '""')}"`,
            `"${emp.schoolYear || '2026-2027'}"`,
            `"${monthName}"`,
            rate.toFixed(2),
            d15,
            c15.toFixed(2),
            d30,
            c30.toFixed(2),
            salary.toFixed(2),
            `"${(emp.remarks || '').replace(/"/g, '""')}"`,
            `"${emp.employmentStatus || 'Active'}"`,
            `"${emp.dateHired || ''}"`
        ];
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `MDSJFI_Official_Faculty_Payroll_${monthName}_${syVal}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast(`Official Faculty & Staff payroll for ${monthName} exported as CSV.`, 'success');
}

// ======================== TEACHERS & FACULTY DIRECTORY MODULE ========================

let currentTeacherViewMode = 'cards';
let activeTeacherProfileEmp = null;
let activePhotoUploadEmp = null;

function refreshTeachersPage() {
    filterTeachersPage();
}

function filterTeachersPage() {
    const all = getPayrollEmployees();
    const q = (document.getElementById('teachersSearchInput')?.value || '').toLowerCase().trim();
    const dept = document.getElementById('teachersFilterDept')?.value || 'ALL';
    const sy = document.getElementById('teachersFilterSy')?.value || '2026-2027';

    const filtered = all.filter(emp => {
        if (sy !== 'ALL' && (emp.schoolYear || '2026-2027') !== sy) return false;
        if (dept !== 'ALL') {
            if (dept === 'Faculty' && !String(emp.department || '').toLowerCase().includes('faculty')) return false;
            if (dept === 'Administration' && !String(emp.department || '').toLowerCase().includes('administration')) return false;
        }
        if (q) {
            const text = `${emp.employeeNo || ''} ${emp.name || ''} ${emp.position || ''} ${emp.department || ''}`.toLowerCase();
            if (!text.includes(q)) return false;
        }
        return true;
    });

    renderTeachersPage(filtered);
}

function switchTeacherView(mode) {
    currentTeacherViewMode = mode;
    const cardsGrid = document.getElementById('teachersCardsGrid');
    const tableCont = document.getElementById('teachersTableContainer');
    const btnCards = document.getElementById('btnTeachersViewCards');
    const btnTable = document.getElementById('btnTeachersViewTable');

    if (mode === 'cards') {
        if (cardsGrid) cardsGrid.style.display = 'grid';
        if (tableCont) tableCont.style.display = 'none';
        if (btnCards) { btnCards.className = 'btn-sm btn-primary'; }
        if (btnTable) { btnTable.className = 'btn-sm btn-secondary'; }
    } else {
        if (cardsGrid) cardsGrid.style.display = 'none';
        if (tableCont) tableCont.style.display = 'block';
        if (btnCards) { btnCards.className = 'btn-sm btn-secondary'; }
        if (btnTable) { btnTable.className = 'btn-sm btn-primary'; }
    }
}

function renderTeachersPage(list) {
    const all = getPayrollEmployees();
    const totalCount = all.length;
    const activeFaculty = all.filter(e => String(e.department || '').toLowerCase().includes('faculty')).length;
    const adminCount = all.filter(e => String(e.department || '').toLowerCase().includes('administration')).length;
    const withPhotos = all.filter(e => !!e.photo).length;

    const elTotal = document.getElementById('statTeachersTotalCount');
    const elFaculty = document.getElementById('statTeachersActiveTeachers');
    const elAdmin = document.getElementById('statTeachersAdminCount');
    const elPhotos = document.getElementById('statTeachersWithPhotos');

    if (elTotal) elTotal.textContent = `${totalCount} Personnel`;
    if (elFaculty) elFaculty.textContent = `${activeFaculty} Teachers`;
    if (elAdmin) elAdmin.textContent = `${adminCount} Principal`;
    if (elPhotos) elPhotos.textContent = `${withPhotos || totalCount} Profiles`;

    // Render Cards Grid
    const cardsGrid = document.getElementById('teachersCardsGrid');
    if (cardsGrid) {
        if (!list || list.length === 0) {
            cardsGrid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 48px 16px; color: #64748b; background: #fff; border-radius: 12px; border: 1px dashed #cbd5e1;">
                    <i class="fas fa-user-tie" style="font-size: 2.5rem; color: #94a3b8; display: block; margin-bottom: 10px;"></i>
                    <strong style="font-size: 1.05rem; color: #0b2545;">No teachers or faculty members found</strong>
                    <p style="font-size: 0.85rem; margin-top: 4px;">Try adjusting search keywords or clearing filters.</p>
                </div>
            `;
        } else {
            cardsGrid.innerHTML = list.map(emp => {
                const initials = (emp.name || 'T').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
                const photoSrc = emp.photo || '';
                const avatarHtml = photoSrc
                    ? `<img src="${photoSrc}" alt="${escapeHtml(emp.name)}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`
                    : `<span style="font-weight:700; font-size:1.4rem; color:var(--primary);">${initials}</span>`;

                return `
                    <div class="teacher-profile-card" style="background:#fff; border-radius:12px; border:1px solid #e2e8f0; padding:18px; box-shadow:0 3px 10px rgba(0,0,0,0.04); display:flex; flex-direction:column; transition:transform 0.15s, box-shadow 0.15s; position:relative;">
                        <div style="display:flex; gap:14px; align-items:flex-start; margin-bottom:12px;">
                            <div class="teacher-card-avatar" onclick="openTeacherPhotoModal('${emp.id}')" title="Click to view or upload photo" style="width:68px; height:68px; border-radius:50%; background:#f1f5f9; display:flex; align-items:center; justify-content:center; flex-shrink:0; border:2.5px solid #2563eb; position:relative; cursor:pointer; overflow:hidden;">
                                ${avatarHtml}
                                <span style="position:absolute; bottom:0; right:0; background:#2563eb; color:#fff; width:20px; height:20px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:0.60rem; border:1.5px solid #fff;"><i class="fas fa-camera"></i></span>
                            </div>
                            <div style="flex:1; min-width:0;">
                                <div style="display:flex; justify-content:space-between; align-items:center; gap:6px;">
                                    <span style="font-family:monospace; font-size:0.80rem; font-weight:700; color:#0b2545; background:#e0f2fe; padding:2px 7px; border-radius:4px;">${escapeHtml(emp.employeeNo)}</span>
                                    <span class="status-badge" style="background:#dcfce7; color:#15803d; font-size:0.72rem; font-weight:700; padding:2px 8px; border-radius:12px;"><i class="fas fa-check-circle"></i> Active</span>
                                </div>
                                <h4 style="margin:6px 0 2px 0; font-size:0.98rem; font-weight:700; color:#0f172a; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${escapeHtml(emp.name)}">${escapeHtml(emp.name)}</h4>
                                <div style="font-size:0.78rem; font-weight:600; color:#0284c7; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHtml(emp.position)}</div>
                            </div>
                        </div>

                        <div style="background:#f8fafc; border-radius:8px; padding:10px 12px; margin-bottom:12px; font-size:0.80rem; color:#475569; display:flex; flex-direction:column; gap:4px;">
                            <div style="display:flex; justify-content:space-between;">
                                <span><i class="fas fa-building" style="color:#94a3b8; margin-right:4px;"></i> Department:</span>
                                <strong style="color:#1e293b;">${escapeHtml(emp.department || 'Faculty')}</strong>
                            </div>
                            <div style="display:flex; justify-content:space-between;">
                                <span><i class="fas fa-coins" style="color:#d97706; margin-right:4px;"></i> Compensation:</span>
                                <strong style="color:#0f172a;">&#8369;363.60 / day</strong>
                            </div>
                            <div style="display:flex; justify-content:space-between;">
                                <span><i class="fas fa-calendar-alt" style="color:#2563eb; margin-right:4px;"></i> School Year:</span>
                                <span class="sy-pill" style="font-size:0.72rem;">${escapeHtml(emp.schoolYear || '2026-2027')}</span>
                            </div>
                        </div>

                        <div style="margin-top:auto; display:flex; gap:6px; flex-wrap:wrap;">
                            <button type="button" class="btn-sm btn-outline-primary" onclick="openTeacherProfileModal('${emp.id}')" style="flex:1; padding:5px 8px; font-size:0.78rem; text-align:center;">
                                <i class="fas fa-id-card"></i> Profile
                            </button>
                            <button type="button" class="btn-sm btn-secondary" onclick="openEditTeacherDetailsModal('${emp.id}')" title="Edit Teacher's Profile & Credentials" style="padding:5px 9px; font-size:0.78rem; background:#eff6ff; color:#2563eb; border-color:#93c5fd;">
                                <i class="fas fa-user-edit"></i> Edit
                            </button>
                            <button type="button" class="btn-sm btn-secondary" onclick="openTeacherPhotoModal('${emp.id}')" title="Upload / change photo" style="padding:5px 9px; font-size:0.78rem;">
                                <i class="fas fa-camera"></i> Photo
                            </button>
                            <button type="button" class="btn-sm btn-secondary" onclick="printTeacherProfile('${emp.id}')" title="Print Profile Sheet" style="padding:5px 9px; font-size:0.78rem;">
                                <i class="fas fa-print"></i>
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
        }
    }

    // Render Table View
    const tbody = document.getElementById('teachersTableBody');
    if (tbody) {
        if (!list || list.length === 0) {
            tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding:32px; color:#64748b;">No teacher records found.</td></tr>`;
        } else {
            tbody.innerHTML = list.map((emp, idx) => {
                const initials = (emp.name || 'T').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
                const photoSrc = emp.photo || '';
                const thumbHtml = photoSrc
                    ? `<img src="${photoSrc}" alt="${escapeHtml(emp.name)}" style="width:24px; height:24px; border-radius:50%; object-fit:cover; border:1px solid #2563eb;">`
                    : `<div style="width:24px; height:24px; border-radius:50%; background:#e0f2fe; color:#0369a1; font-weight:700; font-size:0.65rem; display:flex; align-items:center; justify-content:center; margin:auto;">${initials}</div>`;

                return `
                    <tr data-emp-id="${emp.id}">
                        <td style="color:#64748b; font-weight:600; font-size:0.68rem;">${idx + 1}</td>
                        <td style="text-align:center;">${thumbHtml}</td>
                        <td><strong style="font-family: monospace; font-size: 0.68rem; color: #0b2545;">${escapeHtml(emp.employeeNo)}</strong></td>
                        <td>
                            <div style="font-weight: 700; color: #0f172a; font-size: 0.68rem; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${escapeHtml(emp.name)}">${escapeHtml(emp.name)}</div>
                        </td>
                        <td>
                            <span style="display:inline-block; padding: 1.5px 5px; border-radius: 3px; background: #e0f2fe; color: #0369a1; font-weight: 600; font-size: 0.65rem; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${escapeHtml(emp.position)}">
                                ${escapeHtml(emp.position)}
                            </span>
                        </td>
                        <td style="font-size:0.68rem; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${escapeHtml(emp.department || 'Faculty')}</td>
                        <td><span class="sy-pill" style="font-size:0.63rem; padding:1.5px 4px;">${escapeHtml(emp.schoolYear || '2026-2027')}</span></td>
                        <td style="text-align:center;"><span class="status-badge" style="background:#dcfce7; color:#15803d; font-size:0.63rem; font-weight:700; padding:1.5px 4px;"><i class="fas fa-check-circle" style="font-size:0.60rem;"></i> Active</span></td>
                        <td class="text-center actions-cell">
                            <button type="button" class="btn-icon" onclick="openTeacherProfileModal('${emp.id}')" title="View Teacher Profile" style="background:#e0f2fe; color:#0369a1; width:21px; height:21px; border-radius:3px; font-size:0.64rem; margin:0 1px;">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button type="button" class="btn-icon edit" onclick="openEditTeacherDetailsModal('${emp.id}')" title="Edit Teacher's Profile & Credentials" style="background:#eff6ff; color:#2563eb; width:21px; height:21px; border-radius:3px; font-size:0.64rem; margin:0 1px;">
                                <i class="fas fa-user-edit"></i>
                            </button>
                            <button type="button" class="btn-icon" onclick="openTeacherPhotoModal('${emp.id}')" title="Change Photo" style="background:#f1f5f9; color:#475569; width:21px; height:21px; border-radius:3px; font-size:0.64rem; margin:0 1px;">
                                <i class="fas fa-camera"></i>
                            </button>
                            <button type="button" class="btn-icon" onclick="printTeacherProfile('${emp.id}')" title="Print Profile Sheet" style="background:#f8fafc; color:#334155; width:21px; height:21px; border-radius:3px; font-size:0.64rem; margin:0 1px;">
                                <i class="fas fa-print"></i>
                            </button>
                        </td>
                    </tr>
                `;
            }).join('');
        }
    }
}

function openTeacherProfileModal(empId) {
    const all = getPayrollEmployees();
    const emp = all.find(e => e.id === empId || e.employeeNo === empId);
    if (!emp) return;

    activeTeacherProfileEmp = emp;
    const modal = document.getElementById('teacherProfileModal');
    const body = document.getElementById('teacherProfileBody');
    if (!modal || !body) return;

    const initials = (emp.name || 'T').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
    const photoSrc = emp.photo || '';
    const avatarHtml = photoSrc
        ? `<img src="${photoSrc}" alt="${escapeHtml(emp.name)}" style="width:110px; height:110px; border-radius:50%; object-fit:cover; border:3px solid #2563eb; box-shadow:0 4px 12px rgba(0,0,0,0.12);">`
        : `<div style="width:110px; height:110px; border-radius:50%; background:#e0f2fe; color:#0369a1; font-weight:700; font-size:2.2rem; display:flex; align-items:center; justify-content:center; border:3px solid #2563eb; box-shadow:0 4px 12px rgba(0,0,0,0.12);">${initials}</div>`;

    body.innerHTML = `
        <div style="display:flex; flex-direction:column; gap:16px;">
            <!-- Header with Photo and Core Info -->
            <div style="display:flex; gap:18px; align-items:center; border-bottom:1px solid #e2e8f0; padding-bottom:14px;">
                <div style="flex-shrink:0; cursor:pointer; position:relative;" onclick="triggerPhotoUploadFromProfile()" title="Click to upload or replace photo">
                    ${avatarHtml}
                    <span style="position:absolute; bottom:2px; right:2px; background:#2563eb; color:#fff; width:26px; height:26px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:0.75rem; border:2px solid #fff;"><i class="fas fa-camera"></i></span>
                </div>
                <div style="flex:1;">
                    <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px; flex-wrap:wrap;">
                        <span style="font-family:monospace; font-size:0.88rem; font-weight:700; color:#0b2545; background:#e0f2fe; padding:2px 8px; border-radius:4px;">Employee ID: ${escapeHtml(emp.employeeNo)}</span>
                        <span class="status-badge" style="background:#dcfce7; color:#15803d; font-size:0.75rem; font-weight:700; padding:2px 8px; border-radius:12px;"><i class="fas fa-check-circle"></i> ${escapeHtml(emp.employmentStatus || 'Active')}</span>
                        <span class="sy-pill" style="font-size:0.74rem;">S.Y. ${escapeHtml(emp.schoolYear || '2026-2027')}</span>
                    </div>
                    <h3 style="margin:0 0 3px 0; color:#0f172a; font-size:1.35rem; font-weight:800;">${escapeHtml(emp.name)}</h3>
                    <p style="margin:0 0 4px 0; color:#0284c7; font-weight:700; font-size:0.95rem;">${escapeHtml(emp.position)}</p>
                    <span style="font-size:0.80rem; color:#64748b;"><i class="fas fa-building" style="margin-right:4px;"></i> ${escapeHtml(emp.department || 'Junior High School Faculty')} &bull; Advisory: <strong>${escapeHtml(emp.advisoryClass || 'None')}</strong></span>
                </div>
            </div>

            <!-- 5 Detailed Categories Grid -->
            <!-- 1. Personal Information -->
            <div style="background:#f8fafc; border-radius:8px; padding:12px 14px; border:1px solid #e2e8f0;">
                <h5 style="margin:0 0 10px 0; color:#0b2545; font-size:0.85rem; font-weight:700; border-bottom:1.5px solid #cbd5e1; padding-bottom:4px; display:flex; align-items:center; gap:6px;">
                    <i class="fas fa-user" style="color:#0284c7;"></i> 1. Personal Information
                </h5>
                <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:10px; font-size:0.82rem;">
                    <div><span style="color:#64748b; font-size:0.73rem; display:block;">Gender:</span><strong>${escapeHtml(emp.gender || 'Not specified')}</strong></div>
                    <div><span style="color:#64748b; font-size:0.73rem; display:block;">Date of Birth:</span><strong>${escapeHtml(emp.dob || 'Not specified')}</strong></div>
                    <div><span style="color:#64748b; font-size:0.73rem; display:block;">Civil Status:</span><strong>${escapeHtml(emp.civilStatus || 'Single')}</strong></div>
                    <div><span style="color:#64748b; font-size:0.73rem; display:block;">Contact Number:</span><strong>${escapeHtml(emp.phone || 'None')}</strong></div>
                    <div style="grid-column: span 2;"><span style="color:#64748b; font-size:0.73rem; display:block;">Email Address:</span><strong>${escapeHtml(emp.email || 'None')}</strong></div>
                    <div style="grid-column: 1 / -1;"><span style="color:#64748b; font-size:0.73rem; display:block;">Residential Address:</span><strong>${escapeHtml(emp.address || 'San Jose, Occidental Mindoro')}</strong></div>
                </div>
            </div>

            <!-- 2. Professional Credentials & Education -->
            <div style="background:#f8fafc; border-radius:8px; padding:12px 14px; border:1px solid #e2e8f0;">
                <h5 style="margin:0 0 10px 0; color:#0b2545; font-size:0.85rem; font-weight:700; border-bottom:1.5px solid #cbd5e1; padding-bottom:4px; display:flex; align-items:center; gap:6px;">
                    <i class="fas fa-certificate" style="color:#d97706;"></i> 2. Professional Credentials &amp; Education
                </h5>
                <div style="display:grid; grid-template-columns:repeat(2, 1fr); gap:10px; font-size:0.82rem;">
                    <div><span style="color:#64748b; font-size:0.73rem; display:block;">PRC License No.:</span><strong style="font-family:monospace; color:#0b2545;">${escapeHtml(emp.prcNo || 'N/A')}</strong></div>
                    <div><span style="color:#64748b; font-size:0.73rem; display:block;">PRC License Expiry:</span><strong>${escapeHtml(emp.prcExpiry || 'N/A')}</strong></div>
                    <div><span style="color:#64748b; font-size:0.73rem; display:block;">Highest Degree:</span><strong>${escapeHtml(emp.degree || 'Bachelor of Secondary Education')}</strong></div>
                    <div><span style="color:#64748b; font-size:0.73rem; display:block;">Major / Specialization:</span><strong>${escapeHtml(emp.major || 'Education')}</strong></div>
                    <div style="grid-column: 1 / -1;"><span style="color:#64748b; font-size:0.73rem; display:block;">College / Alma Mater:</span><strong>${escapeHtml(emp.schoolGraduated || 'State University')}</strong></div>
                </div>
            </div>

            <!-- 3. Statutory Government Identification -->
            <div style="background:#f8fafc; border-radius:8px; padding:12px 14px; border:1px solid #e2e8f0;">
                <h5 style="margin:0 0 10px 0; color:#0b2545; font-size:0.85rem; font-weight:700; border-bottom:1.5px solid #cbd5e1; padding-bottom:4px; display:flex; align-items:center; gap:6px;">
                    <i class="fas fa-id-card" style="color:#059669;"></i> 3. Statutory Government Identification
                </h5>
                <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:10px; font-size:0.82rem;">
                    <div><span style="color:#64748b; font-size:0.73rem; display:block;">SSS No.:</span><strong style="font-family:monospace;">${escapeHtml(emp.sss || 'N/A')}</strong></div>
                    <div><span style="color:#64748b; font-size:0.73rem; display:block;">PhilHealth:</span><strong style="font-family:monospace;">${escapeHtml(emp.philhealth || 'N/A')}</strong></div>
                    <div><span style="color:#64748b; font-size:0.73rem; display:block;">Pag-IBIG:</span><strong style="font-family:monospace;">${escapeHtml(emp.pagibig || 'N/A')}</strong></div>
                    <div><span style="color:#64748b; font-size:0.73rem; display:block;">TIN:</span><strong style="font-family:monospace;">${escapeHtml(emp.tin || 'N/A')}</strong></div>
                </div>
            </div>

            <!-- 4. Institutional Assignment & Load -->
            <div style="background:#f8fafc; border-radius:8px; padding:12px 14px; border:1px solid #e2e8f0;">
                <h5 style="margin:0 0 10px 0; color:#0b2545; font-size:0.85rem; font-weight:700; border-bottom:1.5px solid #cbd5e1; padding-bottom:4px; display:flex; align-items:center; gap:6px;">
                    <i class="fas fa-chalkboard-teacher" style="color:#6366f1;"></i> 4. Institutional Assignment &amp; Load
                </h5>
                <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:10px; font-size:0.82rem;">
                    <div><span style="color:#64748b; font-size:0.73rem; display:block;">Official Designation:</span><strong>${escapeHtml(emp.position)}</strong></div>
                    <div><span style="color:#64748b; font-size:0.73rem; display:block;">Department / Division:</span><strong>${escapeHtml(emp.department || 'Faculty')}</strong></div>
                    <div><span style="color:#64748b; font-size:0.73rem; display:block;">Advisory Section:</span><strong>${escapeHtml(emp.advisoryClass || 'None')}</strong></div>
                    <div style="grid-column: 1 / span 2;"><span style="color:#64748b; font-size:0.73rem; display:block;">Subjects Handled:</span><strong>${escapeHtml(emp.subjects || 'General Curriculum')}</strong></div>
                    <div><span style="color:#64748b; font-size:0.73rem; display:block;">Daily Rate:</span><strong style="color:#16a34a;">&#8369;${(emp.dailyRate || 363.60).toFixed(2)} / attended day</strong></div>
                    <div><span style="color:#64748b; font-size:0.73rem; display:block;">Payout Schedule:</span><strong>Semi-Monthly (15th &amp; 30th)</strong></div>
                    <div><span style="color:#64748b; font-size:0.73rem; display:block;">Date of Appointment:</span><strong>${escapeHtml(emp.dateHired || '2024-06-10')}</strong></div>
                    <div><span style="color:#64748b; font-size:0.73rem; display:block;">Assigned S.Y.:</span><strong>S.Y. ${escapeHtml(emp.schoolYear || '2026-2027')}</strong></div>
                </div>
            </div>

            <!-- 5. Emergency Contact -->
            <div style="background:#f8fafc; border-radius:8px; padding:12px 14px; border:1px solid #e2e8f0;">
                <h5 style="margin:0 0 10px 0; color:#0b2545; font-size:0.85rem; font-weight:700; border-bottom:1.5px solid #cbd5e1; padding-bottom:4px; display:flex; align-items:center; gap:6px;">
                    <i class="fas fa-phone-alt" style="color:#ef4444;"></i> 5. Emergency Contact
                </h5>
                <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:10px; font-size:0.82rem;">
                    <div><span style="color:#64748b; font-size:0.73rem; display:block;">Contact Person:</span><strong>${escapeHtml(emp.emergencyName || 'N/A')}</strong></div>
                    <div><span style="color:#64748b; font-size:0.73rem; display:block;">Relationship:</span><strong>${escapeHtml(emp.emergencyRelation || 'N/A')}</strong></div>
                    <div><span style="color:#64748b; font-size:0.73rem; display:block;">Emergency Contact No.:</span><strong>${escapeHtml(emp.emergencyPhone || 'N/A')}</strong></div>
                </div>
            </div>
        </div>
    `;

    modal.style.display = 'flex';
}

function closeTeacherProfileModal() {
    const modal = document.getElementById('teacherProfileModal');
    if (modal) modal.style.display = 'none';
    activeTeacherProfileEmp = null;
}

function triggerPhotoUploadFromProfile() {
    if (activeTeacherProfileEmp) {
        const targetId = activeTeacherProfileEmp.id;
        closeTeacherProfileModal();
        openTeacherPhotoModal(targetId);
    }
}

function printActiveTeacherProfile() {
    if (activeTeacherProfileEmp) {
        printTeacherProfile(activeTeacherProfileEmp.id);
    }
}

function openEditTeacherDetailsModalFromProfile() {
    if (activeTeacherProfileEmp) {
        openEditTeacherDetailsModal(activeTeacherProfileEmp.id);
    }
}

function openEditTeacherDetailsModal(empId) {
    if (typeof isTeacher === 'function' && isTeacher()) {
        showToast('Access Restricted: Teachers cannot edit faculty professional credentials.', 'warning');
        return;
    }
    const all = getPayrollEmployees();
    const emp = all.find(e => e.id === empId || e.employeeNo === empId);
    if (!emp) return;

    document.getElementById('editTeacherEmpId').value = emp.id;
    document.getElementById('editTeacherDetailsTitle').textContent = `Edit Profile: ${emp.name} (${emp.employeeNo})`;

    // Section 1: Personal
    document.getElementById('tEditName').value = emp.name || '';
    document.getElementById('tEditNo').value = emp.employeeNo || '';
    document.getElementById('tEditGender').value = emp.gender || 'Female';
    document.getElementById('tEditDob').value = emp.dob || '';
    document.getElementById('tEditCivilStatus').value = emp.civilStatus || 'Single';
    document.getElementById('tEditPhone').value = emp.phone || '';
    document.getElementById('tEditEmail').value = emp.email || '';
    document.getElementById('tEditAddress').value = emp.address || '';

    // Section 2: Professional
    document.getElementById('tEditPrcNo').value = emp.prcNo || '';
    document.getElementById('tEditPrcExpiry').value = emp.prcExpiry || '';
    document.getElementById('tEditDegree').value = emp.degree || '';
    document.getElementById('tEditMajor').value = emp.major || '';
    document.getElementById('tEditSchool').value = emp.schoolGraduated || '';

    // Section 3: Statutory IDs
    document.getElementById('tEditSss').value = emp.sss || '';
    document.getElementById('tEditPhilhealth').value = emp.philhealth || '';
    document.getElementById('tEditPagibig').value = emp.pagibig || '';
    document.getElementById('tEditTin').value = emp.tin || '';

    // Section 4: Institutional
    document.getElementById('tEditPosition').value = emp.position || '';
    document.getElementById('tEditDept').value = emp.department || 'Junior High School Faculty';
    document.getElementById('tEditAdvisory').value = emp.advisoryClass || 'None';
    document.getElementById('tEditSubjects').value = emp.subjects || '';
    document.getElementById('tEditStatus').value = emp.employmentStatus || 'Active';
    document.getElementById('tEditDateHired').value = emp.dateHired || '';
    document.getElementById('tEditDailyRate').value = emp.dailyRate || 363.60;
    document.getElementById('tEditSchoolYear').value = emp.schoolYear || '2026-2027';

    // Section 5: Emergency
    document.getElementById('tEditEmergencyName').value = emp.emergencyName || '';
    document.getElementById('tEditEmergencyRelation').value = emp.emergencyRelation || '';
    document.getElementById('tEditEmergencyPhone').value = emp.emergencyPhone || '';

    const modal = document.getElementById('editTeacherDetailsModal');
    if (modal) modal.style.display = 'flex';
}

function closeEditTeacherDetailsModal() {
    const modal = document.getElementById('editTeacherDetailsModal');
    if (modal) modal.style.display = 'none';
}

function handleSaveTeacherDetails(e) {
    if (e && e.preventDefault) e.preventDefault();
    if (typeof isTeacher === 'function' && isTeacher()) {
        showToast('Access Restricted: Teachers cannot modify faculty credentials.', 'warning');
        return;
    }

    const empId = document.getElementById('editTeacherEmpId').value;
    const all = getPayrollEmployees();
    const idx = all.findIndex(x => x.id === empId);
    if (idx === -1) {
        showToast('Teacher record not found.', 'error');
        return;
    }

    const name = document.getElementById('tEditName').value.trim();
    const employeeNo = document.getElementById('tEditNo').value.trim();
    if (!name || !employeeNo) {
        showToast('Full name and Employee ID are required.', 'warning');
        return;
    }

    const updatedEmp = {
        ...all[idx],
        name: name,
        employeeNo: employeeNo,
        gender: document.getElementById('tEditGender').value,
        dob: document.getElementById('tEditDob').value,
        civilStatus: document.getElementById('tEditCivilStatus').value,
        phone: document.getElementById('tEditPhone').value.trim(),
        email: document.getElementById('tEditEmail').value.trim(),
        address: document.getElementById('tEditAddress').value.trim(),

        prcNo: document.getElementById('tEditPrcNo').value.trim(),
        prcExpiry: document.getElementById('tEditPrcExpiry').value,
        degree: document.getElementById('tEditDegree').value.trim(),
        major: document.getElementById('tEditMajor').value.trim(),
        schoolGraduated: document.getElementById('tEditSchool').value.trim(),

        sss: document.getElementById('tEditSss').value.trim(),
        philhealth: document.getElementById('tEditPhilhealth').value.trim(),
        pagibig: document.getElementById('tEditPagibig').value.trim(),
        tin: document.getElementById('tEditTin').value.trim(),

        position: document.getElementById('tEditPosition').value.trim(),
        department: document.getElementById('tEditDept').value,
        advisoryClass: document.getElementById('tEditAdvisory').value.trim(),
        subjects: document.getElementById('tEditSubjects').value.trim(),
        employmentStatus: document.getElementById('tEditStatus').value,
        dateHired: document.getElementById('tEditDateHired').value,
        dailyRate: parseFloat(document.getElementById('tEditDailyRate').value) || 363.60,
        schoolYear: document.getElementById('tEditSchoolYear').value.trim() || '2026-2027',

        emergencyName: document.getElementById('tEditEmergencyName').value.trim(),
        emergencyRelation: document.getElementById('tEditEmergencyRelation').value.trim(),
        emergencyPhone: document.getElementById('tEditEmergencyPhone').value.trim()
    };

    all[idx] = updatedEmp;
    savePayrollEmployees(all);

    filterTeachersPage();
    filterPayrollTable();

    closeEditTeacherDetailsModal();

    // If profile modal was open, refresh it with updated details
    const profModal = document.getElementById('teacherProfileModal');
    if (profModal && profModal.style.display !== 'none') {
        openTeacherProfileModal(updatedEmp.id);
    }

    showToast(`Profile details for ${updatedEmp.name} updated successfully!`, 'success');
}

function printTeacherProfile(empId) {
    const all = getPayrollEmployees();
    const emp = all.find(e => e.id === empId || e.employeeNo === empId);
    if (!emp) return;

    const printWin = window.open('', '_blank', 'width=850,height=800');
    if (!printWin) {
        window.print();
        return;
    }

    const nowStr = new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
    const photoImg = emp.photo ? `<img src="${emp.photo}" style="width:125px; height:125px; object-fit:cover; border-radius:6px; border:2px solid #0b2545;">` : `<div style="width:125px; height:125px; border:2px dashed #94a3b8; display:flex; align-items:center; justify-content:center; font-weight:bold; color:#64748b;">PHOTO</div>`;

    printWin.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>MDSJFI - Official Faculty Profile Sheet (${escapeHtml(emp.name)})</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 25px; color: #1e293b; line-height: 1.45; font-size: 12px; }
                .header { display: flex; align-items: center; justify-content: center; gap: 15px; border-bottom: 2px solid #0b2545; padding-bottom: 10px; margin-bottom: 16px; }
                .header img { height: 68px; width: 68px; object-fit: contain; }
                .header-text { text-align: center; }
                .header-text h2 { margin: 0; color: #0b2545; font-size: 17px; font-weight: bold; }
                .header-text .addr { margin: 2px 0 0 0; font-size: 11px; color: #334155; }
                .header-text .sy { margin: 2px 0 0 0; font-size: 11.5px; font-weight: bold; color: #0b2545; }
                .header-text h3 { margin: 4px 0 0 0; color: #0284c7; font-size: 13px; text-transform: uppercase; }
                .section-title { margin: 12px 0 6px 0; font-size: 12px; font-weight: bold; color: #0b2545; border-bottom: 1.5px solid #cbd5e1; padding-bottom: 3px; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
                th, td { padding: 6px 10px; border: 1px solid #cbd5e1; font-size: 11.5px; text-align: left; }
                th { background: #f8fafc; width: 28%; color: #0b2545; }
                .signatures { margin-top: 35px; display: flex; justify-content: space-between; }
                .sig-box { text-align: center; width: 44%; }
                .sig-line { border-top: 1.5px solid #000; margin-top: 40px; margin-bottom: 4px; }
                @media print {
                    @page { size: portrait; margin: 12mm; }
                    body { margin: 0; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <img src="school-logo.png" alt="MDSJFI Logo" onerror="this.style.display='none'">
                <div class="header-text">
                    <h2>MONTESSORI DE SAN JOSE FOUNDATION INC.</h2>
                    <div class="addr">0696 P. Burgost St., Brgy. Pag-asa, San Jose, Occidental Mindoro</div>
                    <div class="sy">School Year ${escapeHtml(emp.schoolYear || '2026-2027')}</div>
                    <h3>OFFICIAL FACULTY &amp; STAFF PROFILE SHEET</h3>
                    <div style="font-size: 10px; color: #64748b; margin-top: 2px;">Generated on: ${nowStr}</div>
                </div>
            </div>

            <div style="display:flex; gap:18px; align-items:center; margin-bottom:14px; background:#f8fafc; border:1px solid #cbd5e1; padding:12px; border-radius:6px;">
                ${photoImg}
                <div>
                    <h3 style="margin:0; font-size:17px; color:#0b2545;">${escapeHtml(emp.name)}</h3>
                    <p style="margin:3px 0; font-size:13px; font-weight:bold; color:#0284c7;">${escapeHtml(emp.position)}</p>
                    <p style="margin:0; font-size:11px; color:#64748b;">
                        Employee ID: <strong style="color:#0b2545;">${escapeHtml(emp.employeeNo)}</strong> &bull; Department: <strong>${escapeHtml(emp.department || 'Faculty')}</strong> &bull; Status: <strong>${escapeHtml(emp.employmentStatus || 'Active')}</strong>
                    </p>
                </div>
            </div>

            <div class="section-title">1. PERSONAL INFORMATION</div>
            <table>
                <tr><th>Full Legal Name</th><td><strong>${escapeHtml(emp.name)}</strong></td><th>Employee ID</th><td><strong>${escapeHtml(emp.employeeNo)}</strong></td></tr>
                <tr><th>Gender</th><td>${escapeHtml(emp.gender || 'Not specified')}</td><th>Date of Birth</th><td>${escapeHtml(emp.dob || 'Not specified')}</td></tr>
                <tr><th>Civil Status</th><td>${escapeHtml(emp.civilStatus || 'Single')}</td><th>Contact Number</th><td>${escapeHtml(emp.phone || 'None')}</td></tr>
                <tr><th>Email Address</th><td colspan="3">${escapeHtml(emp.email || 'None')}</td></tr>
                <tr><th>Residential Address</th><td colspan="3">${escapeHtml(emp.address || 'San Jose, Occidental Mindoro')}</td></tr>
            </table>

            <div class="section-title">2. PROFESSIONAL CREDENTIALS &amp; EDUCATION</div>
            <table>
                <tr><th>PRC License No.</th><td><strong style="font-family:monospace;">${escapeHtml(emp.prcNo || 'N/A')}</strong></td><th>PRC License Expiry</th><td>${escapeHtml(emp.prcExpiry || 'N/A')}</td></tr>
                <tr><th>Highest Degree Earned</th><td>${escapeHtml(emp.degree || 'Bachelor of Secondary Education')}</td><th>Major / Specialization</th><td>${escapeHtml(emp.major || 'Education')}</td></tr>
                <tr><th>College / Alma Mater</th><td colspan="3">${escapeHtml(emp.schoolGraduated || 'State University')}</td></tr>
            </table>

            <div class="section-title">3. STATUTORY GOVERNMENT IDENTIFICATION</div>
            <table>
                <tr><th>SSS Number</th><td><strong style="font-family:monospace;">${escapeHtml(emp.sss || 'N/A')}</strong></td><th>PhilHealth Number</th><td><strong style="font-family:monospace;">${escapeHtml(emp.philhealth || 'N/A')}</strong></td></tr>
                <tr><th>Pag-IBIG / HDMF</th><td><strong style="font-family:monospace;">${escapeHtml(emp.pagibig || 'N/A')}</strong></td><th>Tax Identification No. (TIN)</th><td><strong style="font-family:monospace;">${escapeHtml(emp.tin || 'N/A')}</strong></td></tr>
            </table>

            <div class="section-title">4. INSTITUTIONAL ASSIGNMENT &amp; LOAD</div>
            <table>
                <tr><th>Designation / Position</th><td><strong>${escapeHtml(emp.position)}</strong></td><th>Department / Division</th><td>${escapeHtml(emp.department || 'Junior High School Faculty')}</td></tr>
                <tr><th>Advisory Class / Section</th><td><strong>${escapeHtml(emp.advisoryClass || 'None')}</strong></td><th>Date of Appointment</th><td>${escapeHtml(emp.dateHired || '2024-06-10')}</td></tr>
                <tr><th>Teaching Subjects Handled</th><td colspan="3">${escapeHtml(emp.subjects || 'General Curriculum')}</td></tr>
                <tr><th>Compensation / Daily Rate</th><td>&#8369;${(emp.dailyRate || 363.60).toFixed(2)} / attended day</td><th>Payout Schedule</th><td>Semi-Monthly (15th &amp; 30th)</td></tr>
                <tr><th>School Year</th><td>S.Y. ${escapeHtml(emp.schoolYear || '2026-2027')}</td><th>Employment Status</th><td>${escapeHtml(emp.employmentStatus || 'Active')}</td></tr>
            </table>

            <div class="section-title">5. EMERGENCY CONTACT INFORMATION</div>
            <table>
                <tr><th>Emergency Contact Person</th><td>${escapeHtml(emp.emergencyName || 'N/A')}</td><th>Relationship</th><td>${escapeHtml(emp.emergencyRelation || 'N/A')}</td></tr>
                <tr><th>Emergency Contact Number</th><td colspan="3">${escapeHtml(emp.emergencyPhone || 'N/A')}</td></tr>
            </table>

            <div class="signatures">
                <div class="sig-box">
                    <div class="sig-line"></div>
                    <div style="font-weight:bold; font-size:12px;">CARRELLE B. COLEGADO</div>
                    <div style="font-size:10px; color:#475569;">Registrar / In-Charge, Accounting</div>
                </div>
                <div class="sig-box">
                    <div class="sig-line"></div>
                    <div style="font-weight:bold; font-size:12px;">NIÑO ALOYSIUS B. COLEGADO</div>
                    <div style="font-size:10px; color:#475569;">School President</div>
                </div>
            </div>
        </body>
        </html>
    `);
    printWin.document.close();
    printWin.focus();
    setTimeout(() => {
        printWin.print();
    }, 350);
}

// Teacher Photo Upload & Management (Identical flow to learner profile picture)
let teacherPhotoPendingDataUrl = '';

function openTeacherPhotoModal(empId) {
    if (typeof isTeacher === 'function' && isTeacher()) {
        showToast('Access Restricted: Teachers cannot change faculty identification pictures.', 'warning');
        return;
    }

    const all = getPayrollEmployees();
    const emp = all.find(e => e.id === empId || e.employeeNo === empId);
    if (!emp) return;

    activePhotoUploadEmp = emp;
    teacherPhotoPendingDataUrl = emp.photo || '';

    const modal = document.getElementById('teacherPhotoUploadModal');
    if (!modal) return;

    document.getElementById('teacherPhotoModalEmpId').value = emp.id;
    document.getElementById('teacherPhotoModalName').textContent = emp.name;
    document.getElementById('teacherPhotoModalEmpNo').textContent = `Employee No. ${emp.employeeNo} • ${emp.position}`;

    const img = document.getElementById('teacherPhotoModalPreviewImg');
    const placeholder = document.getElementById('teacherPhotoModalPlaceholder');
    const badge = document.getElementById('teacherPhotoUploadedBadge');
    const btnPreview = document.getElementById('btnPreviewTeacherPhotoModal');
    const btnRemove = document.getElementById('btnRemoveTeacherPhotoModal');
    const indicator = document.getElementById('teacherPhotoLoadingIndicator');
    const fileInput = document.getElementById('teacherPhotoModalFileInput');

    if (fileInput) fileInput.value = '';
    if (indicator) indicator.style.display = 'none';

    initTeacherPhotoDropArea();

    if (teacherPhotoPendingDataUrl) {
        if (img) { img.src = teacherPhotoPendingDataUrl; img.style.display = 'block'; }
        if (placeholder) placeholder.style.display = 'none';
        if (badge) badge.style.display = 'inline-block';
        if (btnPreview) btnPreview.style.display = 'inline-block';
        if (btnRemove) btnRemove.style.display = 'inline-block';
    } else {
        if (img) { img.src = ''; img.style.display = 'none'; }
        if (placeholder) placeholder.style.display = 'flex';
        if (badge) badge.style.display = 'none';
        if (btnPreview) btnPreview.style.display = 'none';
        if (btnRemove) btnRemove.style.display = 'none';
    }

    modal.style.display = 'flex';
}

function initTeacherPhotoDropArea() {
    const dropArea = document.getElementById('teacherPhotoDropArea');
    if (!dropArea || dropArea.dataset.dropInit === 'true') return;
    dropArea.dataset.dropInit = 'true';

    dropArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        e.stopPropagation();
        dropArea.style.borderColor = '#2563eb';
        dropArea.style.background = '#eff6ff';
    });
    dropArea.addEventListener('dragleave', function(e) {
        e.preventDefault();
        e.stopPropagation();
        dropArea.style.borderColor = '#cbd5e1';
        dropArea.style.background = '#f8fafc';
    });
    dropArea.addEventListener('drop', function(e) {
        e.preventDefault();
        e.stopPropagation();
        dropArea.style.borderColor = '#cbd5e1';
        dropArea.style.background = '#f8fafc';
        if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
            processTeacherPhotoFile(e.dataTransfer.files[0]);
        }
    });
}

function closeTeacherPhotoModal() {
    const modal = document.getElementById('teacherPhotoUploadModal');
    if (modal) modal.style.display = 'none';
    activePhotoUploadEmp = null;
    teacherPhotoPendingDataUrl = '';
}

function handleTeacherPhotoModalFileChange(input) {
    const file = input?.files?.[0];
    if (!file) return;
    processTeacherPhotoFile(file);
}

function optimizeTeacherAvatar(file, callback) {
    try {
        const reader = new FileReader();
        reader.onerror = function(err) {
            console.error('FileReader error:', err);
            callback(null);
        };
        reader.onload = function(e) {
            const img = new Image();
            img.onerror = function(err) {
                console.error('Image load error:', err);
                callback(null);
            };
            img.onload = function() {
                try {
                    let maxW = 240, maxH = 240;
                    let width = img.width, height = img.height;
                    if (width > maxW || height > maxH) {
                        if (width / height > maxW / maxH) {
                            height = Math.round((height * maxW) / width);
                            width = maxW;
                        } else {
                            width = Math.round((width * maxH) / height);
                            height = maxH;
                        }
                    }
                    const canvas = document.createElement('canvas');
                    canvas.width = Math.max(1, width);
                    canvas.height = Math.max(1, height);
                    const ctx = canvas.getContext('2d');
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    // Compresses cleanly to JPEG at 0.82 quality (~12KB - 16KB per avatar), completely preventing QuotaExceededError
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
                    callback(dataUrl);
                } catch(e) {
                    console.error('Canvas processing error:', e);
                    callback(null);
                }
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    } catch(err) {
        console.error('optimizeTeacherAvatar exception:', err);
        callback(null);
    }
}

function processTeacherPhotoFile(file) {
    if (!file) return;

    const isImage = (file.type && file.type.startsWith('image/')) || /\.(jpe?g|png|webp|gif|bmp|jfif)$/i.test(file.name || '');
    if (!isImage) {
        showToast('Please upload a valid image file (JPG, PNG, WebP).', 'warning');
        return;
    }

    const indicator = document.getElementById('teacherPhotoLoadingIndicator');
    const progressFill = document.getElementById('teacherPhotoProgressFill');
    const badge = document.getElementById('teacherPhotoUploadedBadge');
    const btnPreview = document.getElementById('btnPreviewTeacherPhotoModal');
    const btnRemove = document.getElementById('btnRemoveTeacherPhotoModal');
    const img = document.getElementById('teacherPhotoModalPreviewImg');
    const placeholder = document.getElementById('teacherPhotoModalPlaceholder');

    if (indicator) indicator.style.display = 'block';
    if (badge) badge.style.display = 'none';
    if (progressFill) progressFill.style.width = '35%';

    optimizeTeacherAvatar(file, function(dataUrl) {
        if (!dataUrl) {
            if (indicator) indicator.style.display = 'none';
            showToast('Unable to process photo file. Please try another image.', 'error');
            return;
        }
        if (progressFill) progressFill.style.width = '100%';
        setTimeout(() => {
            teacherPhotoPendingDataUrl = dataUrl;
            if (indicator) indicator.style.display = 'none';
            if (img) {
                img.src = teacherPhotoPendingDataUrl;
                img.style.display = 'block';
            }
            if (placeholder) placeholder.style.display = 'none';
            if (badge) badge.style.display = 'inline-block';
            if (btnPreview) btnPreview.style.display = 'inline-block';
            if (btnRemove) btnRemove.style.display = 'inline-block';
            showToast('Teacher identification picture uploaded successfully! Click "Save Profile Picture" to confirm.', 'success');
        }, 150);
    });
}

function previewTeacherPhotoModalImg() {
    if (!teacherPhotoPendingDataUrl) {
        showToast('No picture uploaded to view.', 'warning');
        return;
    }
    const name = activePhotoUploadEmp ? activePhotoUploadEmp.name : 'Teacher';
    viewDocumentInModal('Teacher Profile Photo', `Official Photo - ${name}`, {
        data: teacherPhotoPendingDataUrl,
        name: 'teacher_photo.jpg',
        type: 'image/jpeg'
    });
}

function removeTeacherPhotoModalImg() {
    teacherPhotoPendingDataUrl = '';
    const img = document.getElementById('teacherPhotoModalPreviewImg');
    const placeholder = document.getElementById('teacherPhotoModalPlaceholder');
    const badge = document.getElementById('teacherPhotoUploadedBadge');
    const btnPreview = document.getElementById('btnPreviewTeacherPhotoModal');
    const btnRemove = document.getElementById('btnRemoveTeacherPhotoModal');
    const fileInput = document.getElementById('teacherPhotoModalFileInput');

    if (fileInput) fileInput.value = '';
    if (img) { img.src = ''; img.style.display = 'none'; }
    if (placeholder) placeholder.style.display = 'flex';
    if (badge) badge.style.display = 'none';
    if (btnPreview) btnPreview.style.display = 'none';
    if (btnRemove) btnRemove.style.display = 'none';

    showToast('Photo removed. You may browse a replacement or save to clear.', 'info');
}

function saveTeacherPhotoModal() {
    const hiddenId = document.getElementById('teacherPhotoModalEmpId')?.value;
    const all = getPayrollEmployees();
    const emp = all.find(e => (hiddenId && (e.id === hiddenId || e.employeeNo === hiddenId)) || (activePhotoUploadEmp && (e.id === activePhotoUploadEmp.id || e.employeeNo === activePhotoUploadEmp.employeeNo)));
    if (!emp) {
        showToast('Unable to find teacher record to save photo.', 'error');
        return;
    }

    emp.photo = teacherPhotoPendingDataUrl || '';
    
    try {
        localStorage.setItem(PAYROLL_STORAGE_KEY, JSON.stringify(all));
    } catch(err) {
        console.error('Storage quota exceeded:', err);
        showToast('Storage quota exceeded. Please upload a smaller photo or clear cache.', 'error');
        return;
    }

    if (activePhotoUploadEmp) {
        activePhotoUploadEmp.photo = emp.photo;
    }
    const targetEmpId = emp.id;

    closeTeacherPhotoModal();
    filterTeachersPage();
    filterPayrollTable();

    const profModal = document.getElementById('teacherProfileModal');
    if (profModal && profModal.style.display !== 'none') {
        openTeacherProfileModal(targetEmpId);
    }

    showToast(`Profile picture for ${emp.name} saved successfully.`, 'success');
}

function triggerTeachersRefresh(event) {
    if (event && event.currentTarget) {
        const icon = event.currentTarget.querySelector('i');
        if (icon) {
            icon.classList.add('fa-spin');
            setTimeout(() => icon.classList.remove('fa-spin'), 600);
        }
    }
    filterTeachersPage();
    showToast('Teachers & Faculty Directory refreshed.', 'info');
}

function printTeachersDirectory() {
    const all = getPayrollEmployees();
    const sy = document.getElementById('teachersFilterSy')?.value || '2026-2027';
    const list = (sy !== 'ALL') ? all.filter(e => (e.schoolYear || '2026-2027') === sy) : all;

    const printWin = window.open('', '_blank', 'width=900,height=750');
    if (!printWin) {
        window.print();
        return;
    }

    const nowStr = new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
    const rows = list.map((emp, idx) => `
        <tr>
            <td style="padding:7px; border:1px solid #cbd5e1; text-align:center;">${idx + 1}</td>
            <td style="padding:7px; border:1px solid #cbd5e1; font-family:monospace; font-weight:bold;">${escapeHtml(emp.employeeNo)}</td>
            <td style="padding:7px; border:1px solid #cbd5e1;"><strong>${escapeHtml(emp.name)}</strong></td>
            <td style="padding:7px; border:1px solid #cbd5e1;">${escapeHtml(emp.position)}</td>
            <td style="padding:7px; border:1px solid #cbd5e1;">${escapeHtml(emp.department || 'Faculty')}</td>
            <td style="padding:7px; border:1px solid #cbd5e1; text-align:right;">&#8369;363.60 / day</td>
            <td style="padding:7px; border:1px solid #cbd5e1; text-align:center;">Active</td>
        </tr>
    `).join('');

    printWin.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>MDSJFI - Faculty Directory (${sy})</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 25px; color: #1e293b; }
                .header { display: flex; align-items: center; justify-content: center; gap: 14px; border-bottom: 2px solid #0b2545; padding-bottom: 12px; margin-bottom: 18px; }
                .header h2 { margin: 0; color: #0b2545; font-size: 19px; }
                table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
                th { background: #0b2545; color: #fff; padding: 7px 8px; text-align: left; }
                .signatures { margin-top: 40px; display: flex; justify-content: space-between; }
                .sig-box { text-align: center; width: 44%; }
                .sig-line { border-top: 1.5px solid #000; margin-top: 40px; margin-bottom: 4px; }
                @media print {
                    @page { size: portrait; margin: 12mm; }
                    body { margin: 0; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <img src="school-logo.png" alt="MDSJFI Logo" style="height:65px; width:65px; object-fit:contain;" onerror="this.style.display='none'">
                <div style="text-align:center;">
                    <h2>MONTESSORI DE SAN JOSE FOUNDATION INC.</h2>
                    <p style="margin:2px 0 0 0; font-size:12px; color:#64748b;">0696 P. Burgos St., Brgy. Pag-asa, San Jose, Occidental Mindoro &bull; Government Recognized by DepEd</p>
                    <h3 style="margin:6px 0 0 0; font-size:14px; color:#0b2545;">OFFICIAL FACULTY &amp; TEACHERS DIRECTORY</h3>
                    <p style="margin:2px 0 0 0; font-size:11px; color:#64748b;">School Year ${sy} &bull; Generated: ${nowStr}</p>
                </div>
            </div>
            <table>
                <thead>
                    <tr>
                        <th style="width:30px; text-align:center;">#</th>
                        <th style="width:75px;">Emp No.</th>
                        <th>Faculty / Teacher Name</th>
                        <th>Teaching Loads / Position</th>
                        <th>Department</th>
                        <th style="text-align:right;">Daily Base</th>
                        <th style="text-align:center;">Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>
            <div class="signatures">
                <div class="sig-box">
                    <div class="sig-line"></div>
                    <div style="font-weight:bold; font-size:13px;">CARRELLE B. COLEGADO</div>
                    <div style="font-size:11px; color:#475569;">Registrar / In-Charge, Accounting</div>
                </div>
                <div class="sig-box">
                    <div class="sig-line"></div>
                    <div style="font-weight:bold; font-size:13px;">NIÑO ALOYSIUS B. COLEGADO</div>
                    <div style="font-size:11px; color:#475569;">School President</div>
                </div>
            </div>
        </body>
        </html>
    `);
    printWin.document.close();
    printWin.focus();
    setTimeout(() => {
        printWin.print();
    }, 350);
}

function exportTeachersCSV() {
    const all = getPayrollEmployees();
    const sy = document.getElementById('teachersFilterSy')?.value || '2026-2027';
    const list = (sy !== 'ALL') ? all.filter(e => (e.schoolYear || '2026-2027') === sy) : all;

    const headers = ['#', 'Employee No.', 'Full Name', 'Position & Subjects', 'Department', 'Daily Rate', 'School Year', 'Status', 'Date Hired', 'Has Photo'];
    const rows = list.map((e, idx) => [
        idx + 1,
        `"${e.employeeNo || ''}"`,
        `"${(e.name || '').replace(/"/g, '""')}"`,
        `"${(e.position || '').replace(/"/g, '""')}"`,
        `"${(e.department || '').replace(/"/g, '""')}"`,
        '363.60',
        `"${e.schoolYear || '2026-2027'}"`,
        `"${e.employmentStatus || 'Active'}"`,
        `"${e.dateHired || ''}"`,
        e.photo ? 'Yes' : 'No'
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `MDSJFI_Teachers_Directory_${sy}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast('Teachers & Faculty Directory exported as CSV.', 'success');
}

window.getPayrollEmployees = getPayrollEmployees;
window.savePayrollEmployees = savePayrollEmployees;
window.refreshPayrollPage = refreshPayrollPage;
window.filterPayrollTable = filterPayrollTable;
window.renderPayrollTable = renderPayrollTable;
window.openNewEmployeeModal = openNewEmployeeModal;
window.closeNewEmployeeModal = closeNewEmployeeModal;
window.updatePayoutPreviews = updatePayoutPreviews;
window.handleSaveEmployee = handleSaveEmployee;
window.deletePayrollEmployee = deletePayrollEmployee;
window.openEmployeePayslip = openEmployeePayslip;
window.closePayslipModal = closePayslipModal;
window.printCurrentPayslip = printCurrentPayslip;
window.printPayrollSummary = printPayrollSummary;
window.exportPayrollCSV = exportPayrollCSV;
window.switchPayrollSubTab = switchPayrollSubTab;

window.updateEmployeeDays = updateEmployeeDays;
window.updateEmployeeIncentive = updateEmployeeIncentive;
window.updateEmployeeBonus = updateEmployeeBonus;
window.updateEmployeeBonusAmount = updateEmployeeBonusAmount;
window.updateEmployeeBonusType = updateEmployeeBonusType;
window.updateEmployeeBonusRemarks = updateEmployeeBonusRemarks;
window.updateEmployeeRemarks = updateEmployeeRemarks;
window.recalcEmployeeModalSalary = recalcEmployeeModalSalary;
window.switchClearanceSubTab = switchClearanceSubTab;
window.renderPromissoryClearanceTable = renderPromissoryClearanceTable;
window.getCountdownBadge = getCountdownBadge;

window.initDashboardQuickSearch = initDashboardQuickSearch;
window.filterDashboardQuickLinks = filterDashboardQuickLinks;
window.clearDashboardQuickSearch = clearDashboardQuickSearch;
window.executeDashboardQuickAction = executeDashboardQuickAction;

window.refreshTeachersPage = refreshTeachersPage;
window.filterTeachersPage = filterTeachersPage;
window.renderTeachersPage = renderTeachersPage;
window.switchTeacherView = switchTeacherView;
window.openTeacherProfileModal = openTeacherProfileModal;
window.closeTeacherProfileModal = closeTeacherProfileModal;
window.triggerPhotoUploadFromProfile = triggerPhotoUploadFromProfile;
window.printActiveTeacherProfile = printActiveTeacherProfile;
window.printTeacherProfile = printTeacherProfile;
window.openTeacherPhotoModal = openTeacherPhotoModal;
window.closeTeacherPhotoModal = closeTeacherPhotoModal;
window.optimizeTeacherAvatar = optimizeTeacherAvatar;
window.handleTeacherPhotoModalFileChange = handleTeacherPhotoModalFileChange;
window.previewTeacherPhotoModalImg = previewTeacherPhotoModalImg;
window.removeTeacherPhotoModalImg = removeTeacherPhotoModalImg;
window.saveTeacherPhotoModal = saveTeacherPhotoModal;
window.triggerTeachersRefresh = triggerTeachersRefresh;
window.printTeachersDirectory = printTeachersDirectory;
window.exportTeachersCSV = exportTeachersCSV;

window.triggerRefreshWithAnimation = triggerRefreshWithAnimation;
window.triggerCashFlowRefresh = triggerCashFlowRefresh;
window.triggerClearanceRefresh = triggerClearanceRefresh;
window.triggerPayrollRefresh = triggerPayrollRefresh;
window.triggerTeachersRefresh = triggerTeachersRefresh;
window.triggerActivitiesRefresh = triggerActivitiesRefresh;

// ======================== PAYROLL HISTORICAL ARCHIVES (ADMIN & REGISTRAR ONLY) ========================
const PAYROLL_ARCHIVES_STORAGE_KEY = 'mdsj_payroll_archives';

function getDefaultPayrollArchives() {
    const defaultStaff = (typeof getPayrollEmployees === 'function') ? getPayrollEmployees() : [];
    const staffRecords15th = defaultStaff.map(emp => ({
        id: emp.id,
        employeeNo: emp.employeeNo,
        name: emp.name,
        position: emp.position,
        dailyRate: emp.dailyRate || 363.60,
        activeDays: 11,
        gross: (emp.dailyRate || 363.60) * 11,
        deductions: 0,
        netPay: (emp.dailyRate || 363.60) * 11,
        remarks: '1st Cutoff Attendance Verified'
    }));

    return [
        {
            id: 'ARCH-20261015-01',
            archiveNo: 'MDSJ-PAY-2026-10A',
            title: 'Semi-Monthly Faculty & Staff Payroll (October 1 - 15, 2026)',
            notes: 'Official 1st semi-monthly payout for S.Y. 2026-2027 faculty. Fully verified against attendance logs and signed by School President.',
            schoolYear: '2026-2027',
            month: 'October',
            cutoffVal: '15th',
            cutoffText: '15th Day Payout (1st - 15th)',
            savedAt: '2026-10-15T16:00:00.000Z',
            savedBy: 'CARRELLE B. COLEGADO (Registrar / Accounting)',
            totalGross: 27997.20,
            totalDeductions: 0,
            totalNet: 27997.20,
            totalNetWords: 'Twenty-Seven Thousand Nine Hundred Ninety-Seven Pesos and 20/100 Only',
            staffCount: staffRecords15th.length || 7,
            records: staffRecords15th
        },
        {
            id: 'ARCH-20260930-02',
            archiveNo: 'MDSJ-PAY-2026-09B',
            title: 'Semi-Monthly Faculty & Staff Payroll (September 16 - 30, 2026)',
            notes: 'Official 2nd semi-monthly payout for September 2026 approved for disbursement.',
            schoolYear: '2026-2027',
            month: 'September',
            cutoffVal: '30th',
            cutoffText: '30th Day Payout (16th - 30th)',
            savedAt: '2026-09-30T16:30:00.000Z',
            savedBy: 'NIÑO ALOYSIUS B. COLEGADO (School President)',
            totalGross: 27997.20,
            totalDeductions: 0,
            totalNet: 27997.20,
            totalNetWords: 'Twenty-Seven Thousand Nine Hundred Ninety-Seven Pesos and 20/100 Only',
            staffCount: staffRecords15th.length || 7,
            records: staffRecords15th
        },
        {
            id: 'ARCH-20260915-03',
            archiveNo: 'MDSJ-PAY-2026-09A',
            title: 'Semi-Monthly Faculty & Staff Payroll (September 1 - 15, 2026)',
            notes: 'Official 1st semi-monthly payout for September 2026.',
            schoolYear: '2026-2027',
            month: 'September',
            cutoffVal: '15th',
            cutoffText: '15th Day Payout (1st - 15th)',
            savedAt: '2026-09-15T15:45:00.000Z',
            savedBy: 'CARRELLE B. COLEGADO (Registrar / Accounting)',
            totalGross: 27997.20,
            totalDeductions: 0,
            totalNet: 27997.20,
            totalNetWords: 'Twenty-Seven Thousand Nine Hundred Ninety-Seven Pesos and 20/100 Only',
            staffCount: staffRecords15th.length || 7,
            records: staffRecords15th
        }
    ];
}

function getPayrollArchives() {
    try {
        const isInit = localStorage.getItem('mdsj_payroll_archives_initialized');
        const raw = localStorage.getItem(PAYROLL_ARCHIVES_STORAGE_KEY);
        if (isInit && raw !== null) {
            const list = JSON.parse(raw);
            if (Array.isArray(list)) return list;
        }
    } catch (e) {
        console.error('Error loading payroll archives:', e);
    }
    const defaults = getDefaultPayrollArchives();
    try {
        localStorage.setItem(PAYROLL_ARCHIVES_STORAGE_KEY, JSON.stringify(defaults));
        localStorage.setItem('mdsj_payroll_archives_initialized', 'true');
    } catch (e) {}
    return defaults;
}

function savePayrollArchives(list) {
    try {
        localStorage.setItem(PAYROLL_ARCHIVES_STORAGE_KEY, JSON.stringify(list || []));
        localStorage.setItem('mdsj_payroll_archives_initialized', 'true');
        updatePayrollArchivesBadge();
    } catch (e) {
        console.error('Error saving payroll archives:', e);
        showToast('Storage quota exceeded or error saving archive.', 'error');
    }
}

function updatePayrollArchivesBadge() {
    const list = getPayrollArchives();
    const count = list.length;
    const badgeModal = document.getElementById('badgePayrollArchivesCount');
    if (badgeModal) badgeModal.textContent = count;
}

let activeArchiveSnapshot = null;

function openSavePayrollModal() {
    if (typeof isTeacher === 'function' && isTeacher()) {
        showToast('Access Restricted: Only Administrator and Registrar can save or lock payroll records.', 'warning');
        return;
    }

    const sySelect = document.getElementById('payrollFilterSy');
    const syVal = sySelect ? sySelect.value : '2026-2027';

    const monthSelect = document.getElementById('payrollFilterMonth');
    const monthVal = monthSelect ? (monthSelect.options[monthSelect.selectedIndex]?.text || monthSelect.value) : 'October';

    const cutoffSelect = document.getElementById('payrollCutoffFilter') || document.getElementById('payrollFilterCutoff');
    const isBonusTab = (currentPayrollSubTab === 'bonus') || (cutoffSelect && cutoffSelect.value === 'bonus');
    const cutoffVal = isBonusTab ? 'bonus' : (cutoffSelect ? cutoffSelect.value : (currentPayrollSubTab || '15th'));
    const cutoffText = isBonusTab
        ? 'Incentives/Bonus'
        : (cutoffSelect ? (cutoffSelect.options[cutoffSelect.selectedIndex]?.text || '15th Day Payout') : '15th Day Payout');

    const allEmps = getPayrollEmployees();
    const filteredEmps = (syVal && syVal !== 'ALL')
        ? allEmps.filter(emp => !emp.schoolYear || emp.schoolYear === syVal)
        : allEmps;

    let totalGross = 0;
    let totalDeductions = 0;
    let totalNet = 0;

    const records = filteredEmps.map(emp => {
        const days15 = (emp.daysAttended15th !== undefined) ? Number(emp.daysAttended15th) : 11;
        const days30 = (emp.daysAttended30th !== undefined) ? Number(emp.daysAttended30th) : 11;
        const dailyRate = Number(emp.dailyRate) || 363.60;

        let bAmt = (emp.bonusAmount !== undefined) 
            ? Number(emp.bonusAmount) 
            : (((Number(emp.bonus) || 0) + (Number(emp.incentive) || 0)) || 1000);
        let bType = emp.bonusType || (emp.bonus > 0 ? 'Bonus' : 'Incentive');
        let bRemarks = emp.bonusRemarks || emp.remarks || 'Authorized Grant';

        // Read live DOM input elements if currently rendered in table
        if (isBonusTab) {
            const rowEl = document.querySelector(`tr[data-emp-id="${emp.id}"]`);
            if (rowEl) {
                const amtInp = rowEl.querySelector('.bonus-amount-input');
                if (amtInp && amtInp.value !== '') bAmt = Math.max(0, parseFloat(amtInp.value) || 0);
                const typeInp = rowEl.querySelector('.bonus-type-select');
                if (typeInp && typeInp.value) bType = typeInp.value;
                const remInp = rowEl.querySelector('.bonus-remarks-input');
                if (remInp && remInp.value !== undefined) bRemarks = remInp.value.trim() || 'Authorized Grant';
            }
        }
        
        let activeDays = 0;
        let activeGross = 0;
        let deductions = 0;
        let netPay = 0;

        if (cutoffVal === '15th') {
            activeDays = days15;
            activeGross = Math.round(activeDays * dailyRate * 100) / 100;
            deductions = 0;
            netPay = activeGross;
        } else if (cutoffVal === '30th') {
            activeDays = days30;
            activeGross = Math.round(activeDays * dailyRate * 100) / 100;
            deductions = 0;
            netPay = activeGross;
        } else if (cutoffVal === 'bonus') {
            activeDays = 1;
            activeGross = Math.round(bAmt * 100) / 100;
            deductions = 0;
            netPay = activeGross;
        } else {
            activeDays = days15;
            activeGross = Math.round(activeDays * dailyRate * 100) / 100;
            deductions = 0;
            netPay = activeGross;
        }

        totalGross += activeGross;
        totalDeductions += deductions;
        totalNet += netPay;

        return {
            id: emp.id,
            employeeNo: emp.employeeNo,
            name: emp.name,
            position: emp.position,
            department: emp.department || 'Faculty',
            dailyRate: dailyRate,
            days15: days15,
            days30: days30,
            activeDays: activeDays,
            gross: activeGross,
            deductions: deductions,
            netPay: netPay,
            bonusType: (cutoffVal === 'bonus' ? bType : ''),
            bonusAmount: (cutoffVal === 'bonus' ? bAmt : 0),
            bonusRemarks: (cutoffVal === 'bonus' ? bRemarks : ''),
            remarks: (cutoffVal === 'bonus' ? bRemarks : (emp.remarks || 'Standard Attended'))
        };
    });

    totalNet = Math.round(totalNet * 100) / 100;

    const elSyText = document.getElementById('savePayrollSyText');
    const elMonthText = document.getElementById('savePayrollMonthText');
    const elCutoffText = document.getElementById('savePayrollCutoffText');
    const elCountText = document.getElementById('savePayrollStaffCountText');
    const elTotalText = document.getElementById('savePayrollTotalText');
    const elWordsText = document.getElementById('savePayrollWordsText');

    if (elSyText) elSyText.textContent = `S.Y. ${syVal === 'ALL' ? '2026-2027' : syVal}`;
    if (elMonthText) elMonthText.textContent = monthVal;
    if (elCutoffText) elCutoffText.textContent = cutoffText;
    if (elCountText) elCountText.textContent = `${records.length} Personnel`;
    if (elTotalText) elTotalText.innerHTML = `&#8369;${totalNet.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (elWordsText) elWordsText.textContent = convertNumberToWordsPesos(totalNet);

    const defaultTitle = (cutoffVal === 'bonus')
        ? `${monthVal} Incentives & Bonus Grant (S.Y. ${syVal === 'ALL' ? '2026-2027' : syVal})`
        : `${monthVal} ${cutoffText} Payroll (S.Y. ${syVal === 'ALL' ? '2026-2027' : syVal})`;
    const elTitle = document.getElementById('savePayrollTitleInput');
    const elNotes = document.getElementById('savePayrollNotesInput');
    if (elTitle) elTitle.value = defaultTitle;
    if (elNotes) elNotes.value = `Official signed payroll certified by Registrar Carrelle B. Colegado and President Niño Aloysius B. Colegado.`;

    // Cache current snapshot in memory for confirmation
    window._pendingPayrollSnapshot = {
        syVal: (syVal === 'ALL' ? '2026-2027' : syVal),
        monthVal,
        cutoffVal,
        cutoffText,
        totalGross,
        totalDeductions,
        totalNet,
        records
    };

    const modal = document.getElementById('savePayrollModal');
    if (modal) modal.style.display = 'flex';
}

function closeSavePayrollModal() {
    const modal = document.getElementById('savePayrollModal');
    if (modal) modal.style.display = 'none';
    window._pendingPayrollSnapshot = null;
}

function confirmSavePayrollSnapshot() {
    if (typeof isTeacher === 'function' && isTeacher()) {
        showToast('Access Restricted: Teachers cannot lock payroll records.', 'warning');
        return;
    }

    const snap = window._pendingPayrollSnapshot;
    if (!snap) {
        showToast('No active payroll period data found to save.', 'error');
        return;
    }

    const titleInput = document.getElementById('savePayrollTitleInput');
    const titleVal = titleInput ? titleInput.value.trim() : '';
    if (!titleVal) {
        showToast('Please enter an Archive Reference Title.', 'warning');
        if (titleInput) titleInput.focus();
        return;
    }

    const notesVal = document.getElementById('savePayrollNotesInput')?.value.trim() || '';
    const user = getCurrentUser();
    const savedBy = (user && user.fullName) ? user.fullName : (user && user.username) ? user.username : 'Registrar / Accounting';

    const archives = getPayrollArchives();
    const archiveId = 'ARCH-' + Date.now();
    const archiveNo = 'MDSJ-PAY-' + String(archives.length + 1).padStart(4, '0');

    const newArchive = {
        id: archiveId,
        archiveNo: archiveNo,
        title: titleVal,
        notes: notesVal,
        schoolYear: snap.syVal,
        month: snap.monthVal,
        cutoffVal: snap.cutoffVal,
        cutoffText: snap.cutoffText,
        savedAt: new Date().toISOString(),
        savedBy: savedBy,
        totalGross: snap.totalGross,
        totalDeductions: snap.totalDeductions,
        totalNet: snap.totalNet,
        totalNetWords: convertNumberToWordsPesos(snap.totalNet),
        staffCount: snap.records.length,
        records: snap.records
    };

    archives.unshift(newArchive);
    savePayrollArchives(archives);

    // Automatic Outflow Reflection in Daily Cash Flow
    try {
        const cfEntries = getCashFlowEntries();
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const cfOutflow = {
            id: 'CF-PAY-' + archiveId,
            type: 'OUT',
            date: dateStr,
            time: timeStr,
            schoolYear: snap.syVal || '2026-2027',
            category: 'Faculty & Staff Payroll',
            refNo: archiveNo,
            entity: `Payroll Disbursement: ${titleVal}`,
            amount: Number(snap.totalNet) || 0,
            method: 'Bank / Cash Disbursement',
            receivedBy: `${snap.records.length} Staff Personnel`,
            encodedBy: savedBy,
            encoder: savedBy.includes('President') ? 'Niño Aloysius B. Colegado' : 'Carrelle B. Colegado',
            remarks: `Official locked payroll archive [${archiveNo}] for ${snap.cutoffText} (${snap.records.length} personnel). ${notesVal ? 'Notes: ' + notesVal : ''}`.trim(),
            payrollArchiveId: archiveId,
            payrollArchiveNo: archiveNo,
            studentId: '',
            createdAt: now.toISOString()
        };
        cfEntries.unshift(cfOutflow);
        saveCashFlowEntries(cfEntries);
        if (typeof refreshCashFlowPage === 'function') refreshCashFlowPage();
        if (typeof logActivity === 'function') {
            logActivity('Payroll Outflow Recorded', `Auto-recorded Cash Flow Outflow of ₱${formatNumber(snap.totalNet)} for ${archiveNo} (${titleVal})`, { title: titleVal, archiveNo: archiveNo, amount: snap.totalNet });
        }
    } catch (cfErr) {
        console.error('Error auto-syncing payroll archive to Cash Flow outflow:', cfErr);
    }

    closeSavePayrollModal();
    showToast(`Payroll locked and archived as [${archiveNo}], and automatically recorded into Cash Outflow!`, 'success');
}

function openPayrollArchivesModal() {
    if (typeof isTeacher === 'function' && isTeacher()) {
        showToast('Access Restricted: Teachers cannot access historical payroll archives.', 'warning');
        return;
    }
    const modal = document.getElementById('payrollArchivesModal');
    if (modal) {
        modal.style.display = 'flex';
        renderPayrollArchivesList();
    }
}

function closePayrollArchivesModal() {
    const modal = document.getElementById('payrollArchivesModal');
    if (modal) modal.style.display = 'none';
}

function filterPayrollArchivesList() {
    renderPayrollArchivesList();
}

function renderPayrollArchivesList() {
    const container = document.getElementById('payrollArchivesTableContainer');
    if (!container) return;

    const archives = getPayrollArchives();
    const q = (document.getElementById('archiveSearchInput')?.value || '').toLowerCase().trim();
    const syFilter = document.getElementById('archiveFilterSy')?.value || 'ALL';

    const filtered = archives.filter(item => {
        if (syFilter !== 'ALL' && item.schoolYear !== syFilter) return false;
        if (q) {
            const matchTitle = (item.title || '').toLowerCase().includes(q);
            const matchNo = (item.archiveNo || '').toLowerCase().includes(q);
            const matchBy = (item.savedBy || '').toLowerCase().includes(q);
            const matchMonth = (item.month || '').toLowerCase().includes(q);
            if (!matchTitle && !matchNo && !matchBy && !matchMonth) return false;
        }
        return true;
    });

    if (filtered.length === 0) {
        container.innerHTML = `
            <div style="padding: 40px 20px; text-align: center; color: #94a3b8;">
                <i class="fas fa-archive" style="font-size: 2.5rem; color: #cbd5e1; margin-bottom: 12px; display:block;"></i>
                <h4 style="margin: 0 0 6px 0; color: #64748b; font-size: 1rem;">No Saved Payroll Archives Found</h4>
                <p style="margin: 0; font-size: 0.82rem;">Click <strong>"Save &amp; Lock Payroll"</strong> from the Payroll tab to create your first locked historical record.</p>
            </div>
        `;
        return;
    }

    const rowsHtml = filtered.map((item, idx) => {
        const rowBg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
        const dateFormatted = new Date(item.savedAt).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        return `
            <tr style="background:${rowBg}; border-bottom:1px solid #e2e8f0;">
                <td style="padding:6px 8px; font-family:monospace; font-weight:700; color:#0284c7; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; border-right:1px solid #f1f5f9;" title="${escapeHtml(item.archiveNo)}">${escapeHtml(item.archiveNo)}</td>
                <td style="padding:6px 8px; overflow:hidden; border-right:1px solid #f1f5f9;">
                    <strong style="color:#0f172a; display:block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:0.77rem;" title="${escapeHtml(item.title)}">${escapeHtml(item.title)}</strong>
                    <span style="font-size:0.68rem; color:#64748b; display:block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${escapeHtml(item.month)} &bull; ${escapeHtml(item.cutoffText)}</span>
                </td>
                <td style="padding:6px 8px; text-align:center; border-right:1px solid #f1f5f9;"><span class="sy-pill" style="font-size:0.69rem; padding:2px 6px;">${escapeHtml(item.schoolYear)}</span></td>
                <td style="padding:6px 8px; text-align:center; font-weight:600; font-size:0.74rem; border-right:1px solid #f1f5f9;">${item.staffCount || item.records?.length || 0} Staff</td>
                <td style="padding:6px 14px 6px 6px; text-align:right; font-weight:800; color:#059669; font-size:0.77rem; border-right:1px solid #f1f5f9;">&#8369;${(item.totalNet || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td style="padding:6px 8px 6px 14px; overflow:hidden; border-right:1px solid #f1f5f9;">
                    <div style="font-size:0.70rem; color:#0f172a; font-weight:600; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${escapeHtml(item.savedBy)}"><i class="fas fa-user-shield" style="color:#0284c7; margin-right:4px;"></i>${escapeHtml(item.savedBy)}</div>
                    <div style="font-size:0.63rem; color:#64748b; margin-top:1px;">${dateFormatted}</div>
                </td>
                <td class="actions-cell" style="padding:4px 6px; text-align:center; white-space:nowrap !important; overflow:visible !important; text-overflow:clip !important;">
                    <div style="display:inline-flex; align-items:center; justify-content:center; gap:6px; flex-wrap:nowrap;">
                        <button type="button" class="btn-archive-action btn-archive-view" onclick="viewPayrollArchiveSnapshot('${item.id}')" title="View Locked Payroll Snapshot">
                            <i class="fas fa-eye"></i> View Payroll
                        </button>
                        <button type="button" class="btn-archive-action btn-archive-delete" onclick="deletePayrollArchive('${item.id}')" title="Delete Payroll Record (Admin Account Required)">
                            <i class="fas fa-trash-alt"></i> Delete Payroll
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    container.innerHTML = `
        <table class="data-table payroll-archives-table" id="payrollArchivesTable" style="width:100% !important; table-layout:fixed !important; border-collapse:separate !important; border-spacing:0 !important; font-size:0.75rem !important; text-align:left;">
            <thead>
                <tr style="background:#0b2545; color:#fff;">
                    <th style="width:10.5%; padding:8px 8px; border-right:1px solid rgba(255,255,255,0.25);">Archive No.</th>
                    <th style="width:22.5%; padding:8px 10px; border-right:1px solid rgba(255,255,255,0.25);">Reference Title &amp; Period</th>
                    <th style="width:7.5%; padding:8px 6px; text-align:center; border-right:1px solid rgba(255,255,255,0.25);">School Year</th>
                    <th style="width:6.5%; padding:8px 6px; text-align:center; border-right:1px solid rgba(255,255,255,0.25);">Staff Count</th>
                    <th style="width:11%; padding:8px 14px 8px 6px; text-align:right; border-right:1px solid rgba(255,255,255,0.25);">Net Payout</th>
                    <th style="width:14%; padding:8px 8px 8px 14px; text-align:left; border-right:1px solid rgba(255,255,255,0.25);">Saved By / Date</th>
                    <th style="width:28%; padding:8px 8px; text-align:center;">Actions</th>
                </tr>
            </thead>
            <tbody>
                ${rowsHtml}
            </tbody>
        </table>
    `;
}

function viewPayrollArchiveSnapshot(archiveId) {
    const archives = getPayrollArchives();
    const item = archives.find(a => a.id === archiveId);
    if (!item) return;

    activeArchiveSnapshot = item;

    const elTitle = document.getElementById('archiveViewModalTitle');
    const elSub = document.getElementById('archiveViewModalSubtitle');
    if (elTitle) elTitle.textContent = `Archived Record: ${item.archiveNo} — ${item.title}`;
    if (elSub) elSub.textContent = `Locked by ${item.savedBy} on ${new Date(item.savedAt).toLocaleString('en-PH')} • S.Y. ${item.schoolYear}`;

    const body = document.getElementById('payrollArchiveViewModalBody');
    if (!body) return;

    const isBonus = (item.cutoffVal === 'bonus') ||
                    (item.cutoffText && (item.cutoffText.toLowerCase().includes('bonus') || item.cutoffText.toLowerCase().includes('incentive'))) ||
                    (item.title && (item.title.toLowerCase().includes('bonus') || item.title.toLowerCase().includes('incentive')));

    const rowsHtml = (item.records || []).map((rec, i) => {
        if (isBonus) {
            const bType = rec.bonusType || (rec.bonus > 0 ? 'Bonus' : 'Incentive') || 'Incentive';
            const bAmt = Number(rec.netPay !== undefined ? rec.netPay : (rec.bonusAmount !== undefined ? rec.bonusAmount : rec.gross)) || 0;
            const bRem = rec.bonusRemarks || rec.remarks || 'Authorized Grant';
            return `
                <tr style="border-bottom:1px solid #e2e8f0; background:${i % 2 === 0 ? '#fff' : '#f8fafc'};">
                    <td style="padding:6px 8px; text-align:center; font-weight:600;">${i + 1}</td>
                    <td style="padding:6px 8px; font-family:monospace; font-weight:700; color:#0b2545; text-align:center;">${escapeHtml(rec.employeeNo)}</td>
                    <td style="padding:6px 8px; font-weight:700; color:#0f172a;">${escapeHtml(rec.name)}</td>
                    <td style="padding:6px 8px; font-size:0.78rem; color:#475569;">${escapeHtml(rec.position)}</td>
                    <td style="padding:6px 8px; text-align:center; font-weight:700; color:#0369a1;">${escapeHtml(bType)}</td>
                    <td style="padding:6px 8px; text-align:right; font-weight:800; color:#059669;">&#8369;${bAmt.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td style="padding:6px 8px; font-size:0.75rem; color:#64748b;">${escapeHtml(bRem)}</td>
                </tr>
            `;
        }
        return `
            <tr style="border-bottom:1px solid #e2e8f0; background:${i % 2 === 0 ? '#fff' : '#f8fafc'};">
                <td style="padding:6px 8px; text-align:center; font-weight:600;">${i + 1}</td>
                <td style="padding:6px 8px; font-family:monospace; font-weight:700; color:#0b2545;">${escapeHtml(rec.employeeNo)}</td>
                <td style="padding:6px 8px; font-weight:700; color:#0f172a;">${escapeHtml(rec.name)}</td>
                <td style="padding:6px 8px; font-size:0.78rem; color:#475569;">${escapeHtml(rec.position)}</td>
                <td style="padding:6px 8px; text-align:right;">&#8369;${(rec.dailyRate || 363.60).toFixed(2)}</td>
                <td style="padding:6px 8px; text-align:center; font-weight:700; color:#0284c7;">${rec.activeDays}</td>
                <td style="padding:6px 8px; text-align:right;">&#8369;${(rec.gross || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td style="padding:6px 8px; text-align:right; color:#ef4444;">&#8369;${(rec.deductions || 0).toFixed(2)}</td>
                <td style="padding:6px 8px; text-align:right; font-weight:800; color:#15803d;">&#8369;${(rec.netPay || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td style="padding:6px 8px; font-size:0.75rem; color:#64748b;">${escapeHtml(rec.remarks || '')}</td>
            </tr>
        `;
    }).join('');

    body.innerHTML = `
        <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:12px 16px; margin-bottom:16px; display:flex; justify-content:space-between; flex-wrap:wrap; gap:12px;">
            <div>
                <span style="font-size:0.75rem; color:#64748b; font-weight:600; display:block;">Archive Number:</span>
                <strong style="font-size:0.95rem; font-family:monospace; color:#0284c7;">${escapeHtml(item.archiveNo)}</strong>
            </div>
            <div>
                <span style="font-size:0.75rem; color:#64748b; font-weight:600; display:block;">School Year &amp; Period:</span>
                <strong style="font-size:0.95rem; color:#0b2545;">S.Y. ${escapeHtml(item.schoolYear)} &bull; ${escapeHtml(item.month)} (${escapeHtml(item.cutoffText)})</strong>
            </div>
            <div>
                <span style="font-size:0.75rem; color:#64748b; font-weight:600; display:block;">Archived By:</span>
                <strong style="font-size:0.95rem; color:#0f172a;">${escapeHtml(item.savedBy)}</strong>
            </div>
            <div>
                <span style="font-size:0.75rem; color:#64748b; font-weight:600; display:block;">${isBonus ? 'Total Disbursement:' : 'Total Locked Payout:'}</span>
                <strong style="font-size:1.15rem; color:#15803d;">&#8369;${(item.totalNet || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
            </div>
        </div>

        <div style="overflow-x:auto; border:1px solid #cbd5e1; border-radius:6px; margin-bottom:14px;">
            <table style="width:100%; border-collapse:collapse; font-size:0.80rem; text-align:left;">
                <thead>
                    ${isBonus ? `
                        <tr style="background:#0b2545; color:#fff;">
                            <th style="padding:8px; text-align:center; width:35px;">#</th>
                            <th style="padding:8px; text-align:center; width:85px;">Emp No.</th>
                            <th style="padding:8px;">Employee Name</th>
                            <th style="padding:8px;">Position</th>
                            <th style="padding:8px; text-align:center; width:110px;">Type</th>
                            <th style="padding:8px; text-align:right; width:130px;">Amount to be Given</th>
                            <th style="padding:8px;">Remarks / Basis</th>
                        </tr>
                    ` : `
                        <tr style="background:#0b2545; color:#fff;">
                            <th style="padding:8px; text-align:center;">#</th>
                            <th style="padding:8px;">ID</th>
                            <th style="padding:8px;">Employee Name</th>
                            <th style="padding:8px;">Position</th>
                            <th style="padding:8px; text-align:right;">Daily Rate</th>
                            <th style="padding:8px; text-align:center;">Days</th>
                            <th style="padding:8px; text-align:right;">Gross</th>
                            <th style="padding:8px; text-align:right;">Deductions</th>
                            <th style="padding:8px; text-align:right;">Net Pay</th>
                            <th style="padding:8px;">Remarks</th>
                        </tr>
                    `}
                </thead>
                <tbody>
                    ${rowsHtml}
                </tbody>
                <tfoot>
                    <tr style="background:${isBonus ? '#fef3c7' : '#f1f5f9'}; font-weight:800; border-top:2px solid #0b2545;">
                        ${isBonus ? `
                            <td colspan="5" style="padding:8px; text-align:right;">TOTAL INCENTIVES &amp; BONUS DISBURSEMENT:</td>
                            <td style="padding:8px; text-align:right; color:#059669; font-size:0.90rem;">&#8369;${(item.totalNet || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                            <td></td>
                        ` : `
                            <td colspan="6" style="padding:8px; text-align:right;">TOTAL AMOUNT DISBURSED:</td>
                            <td style="padding:8px; text-align:right;">&#8369;${(item.totalGross || item.totalNet || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                            <td style="padding:8px; text-align:right; color:#ef4444;">&#8369;${(item.totalDeductions || 0).toFixed(2)}</td>
                            <td style="padding:8px; text-align:right; color:#15803d; font-size:0.90rem;">&#8369;${(item.totalNet || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                            <td></td>
                        `}
                    </tr>
                </tfoot>
            </table>
        </div>

        <div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:6px; padding:10px 14px; margin-bottom:16px;">
            <span style="font-size:0.75rem; color:#166534; font-weight:700; text-transform:uppercase;">Official Amount in Words:</span>
            <div style="font-size:0.86rem; font-weight:800; color:#14532d; font-style:italic; margin-top:2px;">${escapeHtml(item.totalNetWords || convertNumberToWordsPesos(item.totalNet))}</div>
        </div>

        ${item.notes ? `
            <div style="background:#fffbeb; border:1px solid #fef3c7; border-radius:6px; padding:8px 12px; font-size:0.80rem; color:#92400e; margin-bottom:14px;">
                <strong>Archival Notes:</strong> ${escapeHtml(item.notes)}
            </div>
        ` : ''}

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px; border-top:1px dashed #cbd5e1; padding-top:16px;">
            <div style="text-align:center;">
                <div style="font-size:0.75rem; color:#64748b; font-weight:700;">Prepared By:</div>
                <div style="margin-top:25px; font-weight:700; font-size:0.88rem; color:#0b2545;">CARRELLE B. COLEGADO</div>
                <div style="font-size:0.75rem; color:#64748b;">Registrar / In-Charge, Accounting</div>
            </div>
            <div style="text-align:center;">
                <div style="font-size:0.75rem; color:#64748b; font-weight:700;">Approved by:</div>
                <div style="margin-top:25px; font-weight:700; font-size:0.88rem; color:#0b2545;">NIÑO ALOYSIUS B. COLEGADO</div>
                <div style="font-size:0.75rem; color:#64748b;">School President</div>
            </div>
        </div>
    `;

    const modal = document.getElementById('payrollArchiveViewModal');
    if (modal) modal.style.display = 'flex';
}

function closePayrollArchiveViewModal() {
    const modal = document.getElementById('payrollArchiveViewModal');
    if (modal) modal.style.display = 'none';
    activeArchiveSnapshot = null;
}

function printActiveArchiveSnapshot() {
    if (activeArchiveSnapshot) {
        printPayrollArchive(activeArchiveSnapshot.id);
    }
}

function printPayrollArchive(archiveId) {
    const archives = getPayrollArchives();
    const item = archives.find(a => a.id === archiveId);
    if (!item) return;

    const printWin = window.open('', '_blank', 'width=1100,height=800');
    if (!printWin) {
        window.print();
        return;
    }

    const isBonus = (item.cutoffVal === 'bonus') || 
                    (item.cutoffText && (item.cutoffText.toLowerCase().includes('bonus') || item.cutoffText.toLowerCase().includes('incentive'))) ||
                    (item.title && (item.title.toLowerCase().includes('bonus') || item.title.toLowerCase().includes('incentive')));

    const rowsHtml = (item.records || []).map((rec, i) => {
        if (isBonus) {
            const bType = rec.bonusType || (rec.bonus > 0 ? 'Bonus' : 'Incentive') || 'Incentive';
            const bAmt = Number(rec.netPay !== undefined ? rec.netPay : (rec.bonusAmount !== undefined ? rec.bonusAmount : rec.gross)) || 0;
            const bRem = rec.bonusRemarks || rec.remarks || 'Authorized Grant';
            return `
                <tr>
                    <td style="text-align:center;">${i + 1}</td>
                    <td style="font-family:monospace; font-weight:bold; text-align:center;">${escapeHtml(rec.employeeNo)}</td>
                    <td style="font-weight:bold; text-align:left;">${escapeHtml(rec.name)}</td>
                    <td style="text-align:left;">${escapeHtml(rec.position)}</td>
                    <td style="text-align:center; font-weight:bold; color:#0369a1;">${escapeHtml(bType)}</td>
                    <td style="text-align:right; font-weight:bold; color:#059669;">&#8369;${bAmt.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td style="text-align:left; color:#475569;">${escapeHtml(bRem)}</td>
                    <td style="text-align:center;"><span style="border-bottom:1px solid #64748b; display:inline-block; width:75px; height:16px;"></span></td>
                </tr>
            `;
        }
        return `
            <tr>
                <td style="text-align:center;">${i + 1}</td>
                <td style="font-family:monospace; font-weight:bold; text-align:center;">${escapeHtml(rec.employeeNo)}</td>
                <td style="font-weight:bold; text-align:left;">${escapeHtml(rec.name)}</td>
                <td style="text-align:left;">${escapeHtml(rec.position)}</td>
                <td style="text-align:right;">&#8369;${(rec.dailyRate || 363.60).toFixed(2)}</td>
                <td style="text-align:center; font-weight:bold;">${rec.activeDays}</td>
                <td style="text-align:right;">&#8369;${(rec.gross || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td style="text-align:right; color:#dc2626;">&#8369;${(rec.deductions || 0).toFixed(2)}</td>
                <td style="text-align:right; font-weight:bold;">&#8369;${(rec.netPay || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td style="text-align:left;">${escapeHtml(rec.remarks || '')}</td>
            </tr>
        `;
    }).join('');

    printWin.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>MDSJFI - Official Archived Payroll (${escapeHtml(item.archiveNo)})</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; color: #1e293b; font-size: 11px; }
                .header-container { display: flex; align-items: center; justify-content: center; gap: 15px; margin-bottom: 12px; border-bottom: 2px solid #0b2545; padding-bottom: 10px; }
                .header-logo { width: 68px; height: 68px; object-fit: contain; }
                .header-text { text-align: center; }
                .header-text h1 { margin: 0; font-size: 17px; color: #0b2545; text-transform: uppercase; font-weight: bold; }
                .header-text .address { margin: 2px 0 0 0; font-size: 11px; color: #334155; }
                .header-text .sy { margin: 2px 0 0 0; font-size: 12px; font-weight: bold; color: #0b2545; }
                .header-text h2 { margin: 5px 0 0 0; font-size: 13px; color: #0284c7; text-transform: uppercase; letter-spacing: 0.5px; }
                table { width: 100%; border-collapse: collapse; margin-top: 10px; table-layout: fixed; }
                th, td { border: 1px solid #cbd5e1; padding: 5px 6px; font-size: 10.5px; box-sizing: border-box; }
                th { background-color: #0b2545; color: #ffffff; font-weight: bold; }
                .amount-in-words-box { margin-top: 12px; border: 1.5px solid #0b2545; background-color: #f8fafc; padding: 8px 12px; border-radius: 4px; }
                .amount-in-words-label { font-size: 10px; font-weight: bold; color: #0b2545; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px; }
                .amount-in-words-text { font-size: 12px; font-weight: bold; color: #0f172a; font-style: italic; }
                .signatures { margin-top: 36px; display: flex; justify-content: space-between; page-break-inside: avoid; }
                .sig-box { text-align: center; width: 44%; }
                .sig-label { font-size: 11px; font-weight: bold; color: #334155; margin-bottom: 28px; text-align: left; }
                .sig-line { border-top: 1.5px solid #000; margin-bottom: 4px; }
                .sig-name { font-weight: bold; font-size: 12px; }
                .sig-title { font-size: 10px; color: #475569; }
                @media print {
                    @page { size: landscape; margin: 10mm; }
                    body { margin: 0; }
                }
            </style>
        </head>
        <body>
            <div class="header-container">
                <img src="school-logo.png" alt="MDSJFI Official Logo" class="header-logo" onerror="this.style.display='none'">
                <div class="header-text">
                    <h1>Montessori De San Jose Foundation Inc.</h1>
                    <div class="address">0696 P. Burgost St., Brgy. Pag-asa, San Jose, Occidental Mindoro</div>
                    <div class="sy">School Year ${escapeHtml(item.schoolYear || '2026-2027')}</div>
                    <h2>${isBonus ? 'LOCKED OFFICIAL INCENTIVES &amp; BONUS ARCHIVE' : 'LOCKED OFFICIAL FACULTY &amp; STAFF PAYROLL ARCHIVE'} (${escapeHtml(item.archiveNo)})</h2>
                    <div style="font-size: 10px; color: #64748b; margin-top: 2px;">
                        Period: <strong>${escapeHtml(item.month)} (${escapeHtml(item.cutoffText)})</strong> &bull; Title: <strong>${escapeHtml(item.title)}</strong> &bull; Locked: <strong>${new Date(item.savedAt).toLocaleDateString('en-PH')}</strong>
                    </div>
                </div>
            </div>

            <table>
                <thead>
                    ${isBonus ? `
                        <tr>
                            <th style="width:4%; text-align:center;">#</th>
                            <th style="width:9%; text-align:center;">Emp No.</th>
                            <th style="width:22%; text-align:left;">Faculty / Employee Name</th>
                            <th style="width:20%; text-align:left;">Position &amp; Subject Assignment</th>
                            <th style="width:12%; text-align:center;">Type</th>
                            <th style="width:13%; text-align:right;">Amount to be Given</th>
                            <th style="width:10%; text-align:left;">Remarks / Basis</th>
                            <th style="width:10%; text-align:center;">Signature</th>
                        </tr>
                    ` : `
                        <tr>
                            <th style="width:30px; text-align:center;">#</th>
                            <th style="width:80px; text-align:center;">Emp No.</th>
                            <th style="text-align:left;">Employee Name</th>
                            <th style="text-align:left;">Position</th>
                            <th style="width:90px; text-align:right;">Daily Rate</th>
                            <th style="width:85px; text-align:center;">Attended Days</th>
                            <th style="width:95px; text-align:right;">Gross Pay</th>
                            <th style="width:85px; text-align:right;">Deductions</th>
                            <th style="width:95px; text-align:right;">Net Payout</th>
                            <th style="width:110px; text-align:left;">Remarks</th>
                        </tr>
                    `}
                </thead>
                <tbody>
                    ${rowsHtml}
                </tbody>
                <tfoot>
                    <tr style="background-color: ${isBonus ? '#fef3c7' : '#f1f5f9'}; font-weight: bold; border-top: 2px solid #0b2545;">
                        ${isBonus ? `
                            <td colspan="5" style="text-align: right; padding: 6px 10px;">TOTAL INCENTIVES &amp; BONUS DISBURSEMENT:</td>
                            <td style="text-align: right; font-weight: 800; color: #059669; font-size: 11.5px;">&#8369;${(item.totalNet || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                            <td colspan="2"></td>
                        ` : `
                            <td colspan="6" style="text-align: right; padding: 6px;">TOTAL NET DISBURSEMENT:</td>
                            <td style="text-align: right;">&#8369;${(item.totalGross || item.totalNet || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                            <td style="text-align: right; color:#dc2626;">&#8369;${(item.totalDeductions || 0).toFixed(2)}</td>
                            <td style="text-align: right; color:#15803d; font-size:11.5px;">&#8369;${(item.totalNet || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                            <td></td>
                        `}
                    </tr>
                </tfoot>
            </table>

            <div class="amount-in-words-box">
                <div class="amount-in-words-label">Certified Amount in Words (Philippine Pesos):</div>
                <div class="amount-in-words-text">${escapeHtml(item.totalNetWords || convertNumberToWordsPesos(item.totalNet))}</div>
            </div>

            <div class="signatures">
                <div class="sig-box">
                    <div class="sig-label">Prepared By:</div>
                    <div class="sig-line"></div>
                    <div class="sig-name">CARRELLE B. COLEGADO</div>
                    <div class="sig-title">Registrar / In-Charge, Accounting</div>
                </div>
                <div class="sig-box">
                    <div class="sig-label">Approved by:</div>
                    <div class="sig-line"></div>
                    <div class="sig-name">NIÑO ALOYSIUS B. COLEGADO</div>
                    <div class="sig-title">School President</div>
                </div>
            </div>
        </body>
        </html>
    `);
    printWin.document.close();
    printWin.focus();
    setTimeout(() => { printWin.print(); }, 400);
}

function deletePayrollArchive(archiveId) {
    if (typeof isTeacher === 'function' && isTeacher()) {
        showToast('Access Restricted: Teachers cannot delete historical archives.', 'warning');
        return;
    }

    if (typeof requestAdminAuth === 'function') {
        requestAdminAuth(() => {
            performDeletePayrollArchive(archiveId);
        }, 'Delete Historical Payroll Archive', 'Enter Admin (School President) credentials (admin / admin123) to permanently delete this locked payroll archive.', true);
        return;
    }

    performDeletePayrollArchive(archiveId);
}

function performDeletePayrollArchive(archiveId) {
    if (!confirm('Are you sure you want to delete this historical payroll archive? This cannot be undone.')) {
        return;
    }

    const targetId = String(archiveId || '').trim();
    const archives = getPayrollArchives();
    const targetArchive = archives.find(a => (a.id && String(a.id).trim() === targetId) || (a.archiveNo && String(a.archiveNo).trim() === targetId));
    const targetNo = targetArchive ? targetArchive.archiveNo : targetId;
    const targetDbId = targetArchive ? targetArchive.id : targetId;

    const updated = archives.filter(a => {
        const idMatch = a.id && String(a.id).trim() === targetId;
        const noMatch = a.archiveNo && String(a.archiveNo).trim() === targetId;
        return !idMatch && !noMatch;
    });
    savePayrollArchives(updated);

    // Automatically delete associated Cash Flow outflow entry
    try {
        const cfEntries = getCashFlowEntries();
        const updatedCf = cfEntries.filter(e => {
            const matchesId = e.payrollArchiveId && (String(e.payrollArchiveId).trim() === targetDbId || String(e.payrollArchiveId).trim() === targetId);
            const matchesNo = e.payrollArchiveNo && (String(e.payrollArchiveNo).trim() === targetNo || String(e.payrollArchiveNo).trim() === targetId);
            const matchesRef = e.refNo && (String(e.refNo).trim() === targetNo || String(e.refNo).trim() === targetId);
            const matchesCfId = e.id && (e.id === 'CF-PAY-' + targetDbId || e.id === 'CF-PAY-' + targetId);
            return !matchesId && !matchesNo && !matchesRef && !matchesCfId;
        });
        if (updatedCf.length !== cfEntries.length) {
            saveCashFlowEntries(updatedCf);
            if (typeof refreshCashFlowPage === 'function') refreshCashFlowPage();
            if (typeof logActivity === 'function') {
                logActivity('Payroll Outflow Deleted', `Auto-deleted Cash Flow Outflow for removed payroll archive ${targetNo}`);
            }
        }
    } catch (cfErr) {
        console.error('Error auto-deleting payroll outflow from Cash Flow:', cfErr);
    }

    renderPayrollArchivesList();
    showToast(`Historical payroll archive [${targetNo}] and its Cash Flow Outflow entry were deleted successfully.`, 'info');
}

function deleteAllPayrollArchives() {
    if (typeof isTeacher === 'function' && isTeacher()) {
        showToast('Access Restricted: Teachers cannot delete historical archives.', 'warning');
        return;
    }

    if (typeof requestAdminAuth === 'function') {
        requestAdminAuth(() => {
            performDeleteAllPayrollArchives();
        }, 'Delete All Historical Payroll Archives', 'Enter Admin (School President) credentials (admin / admin123) to permanently delete all locked payroll archives.', true);
        return;
    }

    performDeleteAllPayrollArchives();
}

function performDeleteAllPayrollArchives() {
    const archives = getPayrollArchives();
    if (!archives || archives.length === 0) {
        showToast('No saved payroll archives found to delete.', 'info');
        return;
    }

    if (!confirm(`Are you sure you want to permanently delete ALL ${archives.length} historical payroll archive(s)?\n\nAll saved archives will be erased completely. This cannot be undone.`)) {
        return;
    }

    savePayrollArchives([]);

    // Automatically delete all associated Cash Flow outflow entries
    try {
        const cfEntries = getCashFlowEntries();
        const updatedCf = cfEntries.filter(e => !e.payrollArchiveId && !e.payrollArchiveNo && !(e.id && String(e.id).startsWith('CF-PAY-')));
        if (updatedCf.length !== cfEntries.length) {
            saveCashFlowEntries(updatedCf);
            if (typeof refreshCashFlowPage === 'function') refreshCashFlowPage();
        }
    } catch (cfErr) {
        console.error('Error auto-deleting all payroll outflows from Cash Flow:', cfErr);
    }

    renderPayrollArchivesList();
    showToast('All historical payroll archives and their Cash Flow Outflows have been permanently deleted.', 'info');
}

function deleteActiveArchiveSnapshot() {
    if (!activeArchiveSnapshot) return;
    const targetId = activeArchiveSnapshot.id;
    closePayrollArchiveViewModal();
    deletePayrollArchive(targetId);
}

// Window exports for Teacher Details & Payroll Archives
window.openEditTeacherDetailsModalFromProfile = openEditTeacherDetailsModalFromProfile;
window.openEditTeacherDetailsModal = openEditTeacherDetailsModal;
window.closeEditTeacherDetailsModal = closeEditTeacherDetailsModal;
window.handleSaveTeacherDetails = handleSaveTeacherDetails;

window.getPayrollArchives = getPayrollArchives;
window.savePayrollArchives = savePayrollArchives;
window.updatePayrollArchivesBadge = updatePayrollArchivesBadge;
window.openSavePayrollModal = openSavePayrollModal;
window.closeSavePayrollModal = closeSavePayrollModal;
window.confirmSavePayrollSnapshot = confirmSavePayrollSnapshot;
window.openPayrollArchivesModal = openPayrollArchivesModal;
window.closePayrollArchivesModal = closePayrollArchivesModal;
window.filterPayrollArchivesList = filterPayrollArchivesList;
window.renderPayrollArchivesList = renderPayrollArchivesList;
window.viewPayrollArchiveSnapshot = viewPayrollArchiveSnapshot;
window.closePayrollArchiveViewModal = closePayrollArchiveViewModal;
window.printActiveArchiveSnapshot = printActiveArchiveSnapshot;
window.printPayrollArchive = printPayrollArchive;
window.deletePayrollArchive = deletePayrollArchive;
window.deleteAllPayrollArchives = deleteAllPayrollArchives;
window.performDeleteAllPayrollArchives = performDeleteAllPayrollArchives;
window.deleteActiveArchiveSnapshot = deleteActiveArchiveSnapshot;

// Safe Table Action Click Delegation (Only targets rows without explicit inline onclick)
document.addEventListener('click', function(e) {
    const btn = e.target.closest('.actions-cell button, tr button.btn-icon');
    if (!btn) return;

    // If element already has an inline onclick, let browser execute it natively!
    if (btn.hasAttribute('onclick')) {
        return;
    }

    let action = btn.dataset.action;
    if (!action) {
        if (btn.classList.contains('view')) action = 'view';
        else if (btn.classList.contains('soa')) action = 'soa';
        else if (btn.classList.contains('edit')) action = 'edit';
        else if (btn.classList.contains('delete')) action = 'delete';
    }

    if (!action) return;

    let id = btn.dataset.id;
    if (!id) {
        const tr = btn.closest('tr');
        if (tr) id = tr.dataset.studentId || tr.dataset.id;
    }

    if (!id) return;

    e.preventDefault();
    if (action === 'view') viewStudent(id);
    else if (action === 'soa') openSOAModal(id);
    else if (action === 'edit') editStudent(id);
    else if (action === 'delete') confirmDelete(id);
});

// ======================== SESSION PERSISTENCE ========================
// Session is preserved across browser refresh (F5). Explicit logout is handled via handleLogout.

// ======================== BOOT ========================
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
