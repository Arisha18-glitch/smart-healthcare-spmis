-- Smart Healthcare Project Management System
-- Database Schema for SQLite

PRAGMA foreign_keys = ON;

-- 1. Project Charter
CREATE TABLE IF NOT EXISTS project_charter (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    title TEXT NOT NULL,
    objectives TEXT NOT NULL,
    stakeholders TEXT NOT NULL,
    scope_boundaries TEXT NOT NULL,
    approved_budget REAL NOT NULL CHECK(approved_budget > 0),
    initial_budget REAL NOT NULL CHECK(initial_budget > 0),
    start_date TEXT NOT NULL,
    deadline TEXT NOT NULL,
    initial_deadline TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('Planning', 'Executing', 'Monitoring', 'On Hold', 'Closed')) DEFAULT 'Planning',
    cpi_threshold REAL NOT NULL DEFAULT 0.90,
    spi_threshold REAL NOT NULL DEFAULT 0.90,
    status_date TEXT NOT NULL DEFAULT '2026-10-26',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- 2. Project Management Plan
CREATE TABLE IF NOT EXISTS management_plan (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    scope_plan TEXT NOT NULL DEFAULT '',
    schedule_plan TEXT NOT NULL DEFAULT '',
    cost_plan TEXT NOT NULL DEFAULT '',
    quality_plan TEXT NOT NULL DEFAULT '',
    last_autofilled_at TEXT
);

-- 3. Team Members
CREATE TABLE IF NOT EXISTS team_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    email TEXT
);

-- 4. Requirements (Deliverables)
CREATE TABLE IF NOT EXISTS requirements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    req_code TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    priority TEXT NOT NULL CHECK(priority IN ('High', 'Medium', 'Low')) DEFAULT 'Medium',
    status TEXT NOT NULL CHECK(status IN ('Proposed', 'Approved', 'Rejected')) DEFAULT 'Proposed',
    category TEXT NOT NULL DEFAULT 'Core Module',
    created_at TEXT DEFAULT (datetime('now'))
);

-- 5. Change Requests
CREATE TABLE IF NOT EXISTS change_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cr_number TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    justification TEXT NOT NULL,
    linked_requirement_id INTEGER NOT NULL REFERENCES requirements(id) ON DELETE RESTRICT,
    cost_impact REAL NOT NULL CHECK(cost_impact >= 0),
    schedule_impact_weeks INTEGER NOT NULL CHECK(schedule_impact_weeks >= 0),
    status TEXT NOT NULL CHECK(status IN ('Pending', 'Approved', 'Rejected')) DEFAULT 'Pending',
    decision_note TEXT,
    created_date TEXT NOT NULL,
    decided_date TEXT
);

-- 6. Activities (Work Packages)
CREATE TABLE IF NOT EXISTS activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    activity_code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    assignee_id INTEGER NOT NULL REFERENCES team_members(id),
    duration_days INTEGER NOT NULL CHECK(duration_days > 0),
    estimated_cost REAL NOT NULL CHECK(estimated_cost >= 0),
    requirement_id INTEGER NOT NULL REFERENCES requirements(id) ON DELETE RESTRICT,
    progress_percent REAL NOT NULL DEFAULT 0.0 CHECK(progress_percent >= 0.0 AND progress_percent <= 100.0),
    actual_cost REAL NOT NULL DEFAULT 0.0 CHECK(actual_cost >= 0.0),
    delay_days INTEGER NOT NULL DEFAULT 0 CHECK(delay_days >= 0),
    created_at TEXT DEFAULT (datetime('now'))
);

-- 7. Activity Dependencies (Predecessors)
CREATE TABLE IF NOT EXISTS activity_dependencies (
    activity_id INTEGER NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
    predecessor_id INTEGER NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
    PRIMARY KEY (activity_id, predecessor_id),
    CHECK (activity_id != predecessor_id)
);

-- 8. Milestones
CREATE TABLE IF NOT EXISTS milestones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    linked_activity_id INTEGER NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
    target_date TEXT NOT NULL,
    responsible_person TEXT NOT NULL
);

-- 9. Defects Tracker
CREATE TABLE IF NOT EXISTS defects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    defect_code TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    severity TEXT NOT NULL CHECK(severity IN ('Critical', 'High', 'Medium', 'Low')),
    assigned_to INTEGER REFERENCES team_members(id),
    activity_id INTEGER REFERENCES activities(id) ON DELETE SET NULL,
    status TEXT NOT NULL CHECK(status IN ('Open', 'In Progress', 'Resolved', 'Closed')) DEFAULT 'Open',
    reported_date TEXT NOT NULL,
    resolution_notes TEXT
);

-- 10. Quality Checklist per Deliverable (Standard 5 items per approved requirement)
CREATE TABLE IF NOT EXISTS quality_checklist_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    deliverable_id INTEGER NOT NULL REFERENCES requirements(id) ON DELETE CASCADE,
    item_text TEXT NOT NULL,
    result TEXT NOT NULL CHECK(result IN ('Pending', 'Pass', 'Fail')) DEFAULT 'Pending',
    inspector_id INTEGER REFERENCES team_members(id),
    inspection_date TEXT,
    notes TEXT
);

-- 11. Risks & PDPC
CREATE TABLE IF NOT EXISTS risks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    risk_code TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    likelihood INTEGER NOT NULL CHECK(likelihood BETWEEN 1 AND 5),
    impact INTEGER NOT NULL CHECK(impact BETWEEN 1 AND 5),
    status TEXT NOT NULL CHECK(status IN ('Open', 'Mitigated', 'Closed')) DEFAULT 'Open',
    goal TEXT NOT NULL,
    preventive_action TEXT NOT NULL,
    corrective_action TEXT NOT NULL
);

-- ==============================================================================
-- DELIVERABLE WORKING DOMAIN TABLES (5-HOSPITAL NETWORK LIVE MODULES)
-- ==============================================================================

-- 12. Hospitals (The 5 Case Study Network Hospitals)
CREATE TABLE IF NOT EXISTS hospitals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    city TEXT NOT NULL,
    total_beds INTEGER NOT NULL,
    emergency_contact TEXT NOT NULL
);

-- 13. Doctors across the 5 Hospitals
CREATE TABLE IF NOT EXISTS doctors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hospital_id INTEGER NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    specialization TEXT NOT NULL,
    department TEXT NOT NULL,
    room_no TEXT NOT NULL,
    fee_pkr REAL NOT NULL CHECK(fee_pkr >= 0),
    available_days TEXT NOT NULL DEFAULT 'Mon-Fri'
);

-- 14. Appointments (Module 1 Deliverable: Real-Time Booking & Concurrency Engine)
CREATE TABLE IF NOT EXISTS appointments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hospital_id INTEGER NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    doctor_id INTEGER NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    patient_name TEXT NOT NULL,
    patient_phone TEXT NOT NULL,
    appointment_date TEXT NOT NULL,
    time_slot TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('Confirmed', 'In Consultation', 'Completed', 'Cancelled')) DEFAULT 'Confirmed',
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

-- 15. Doctor Shifts & Rota (Module 2 Deliverable: 5-Hospital Shift Matrix)
CREATE TABLE IF NOT EXISTS doctor_shifts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hospital_id INTEGER NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    doctor_id INTEGER NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    shift_date TEXT NOT NULL,
    shift_type TEXT NOT NULL CHECK(shift_type IN ('Morning (08:00 - 14:00)', 'Evening (14:00 - 20:00)', 'Night (20:00 - 08:00)', 'On-Call Emergency')),
    department TEXT NOT NULL,
    duty_status TEXT NOT NULL CHECK(duty_status IN ('Scheduled', 'On Duty', 'Completed', 'Cover Assigned')) DEFAULT 'Scheduled'
);

-- 16. Lab Diagnostics & Reports (Module 3 Deliverable: Results & PDF Dispatch)
CREATE TABLE IF NOT EXISTS lab_reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hospital_id INTEGER NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    patient_name TEXT NOT NULL,
    patient_mrn TEXT NOT NULL,
    test_name TEXT NOT NULL,
    category TEXT NOT NULL CHECK(category IN ('Hematology', 'Biochemistry', 'Pathology', 'Radiology', 'Microbiology')),
    result_value TEXT NOT NULL,
    normal_range TEXT NOT NULL,
    unit TEXT NOT NULL,
    flag TEXT NOT NULL CHECK(flag IN ('Normal', 'Abnormal', 'Critical')) DEFAULT 'Normal',
    doctor_notes TEXT,
    reported_date TEXT NOT NULL
);

-- 17. Telemedicine & Online Consultations (Module 4 Deliverable)
CREATE TABLE IF NOT EXISTS online_consultations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hospital_id INTEGER NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    doctor_id INTEGER NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    patient_name TEXT NOT NULL,
    consultation_type TEXT NOT NULL,
    session_status TEXT NOT NULL CHECK(session_status IN ('Waiting Room', 'In Progress', 'Completed', 'Cancelled')) DEFAULT 'Waiting Room',
    diagnosis_notes TEXT,
    prescription TEXT,
    fee_pkr REAL NOT NULL DEFAULT 1500.0,
    created_at TEXT DEFAULT (datetime('now'))
);

-- 18. Hospital Billing & Insurance Claims (Module 5 Deliverable)
CREATE TABLE IF NOT EXISTS billing_invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hospital_id INTEGER NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    invoice_no TEXT UNIQUE NOT NULL,
    patient_name TEXT NOT NULL,
    patient_mrn TEXT NOT NULL,
    bed_charges REAL NOT NULL DEFAULT 0.0,
    consultation_fee REAL NOT NULL DEFAULT 0.0,
    lab_charges REAL NOT NULL DEFAULT 0.0,
    pharmacy_charges REAL NOT NULL DEFAULT 0.0,
    tax_pkr REAL NOT NULL DEFAULT 0.0,
    total_pkr REAL NOT NULL,
    payment_status TEXT NOT NULL CHECK(payment_status IN ('Paid', 'Unpaid', 'Pending Insurance')) DEFAULT 'Unpaid',
    payment_method TEXT NOT NULL CHECK(payment_method IN ('Cash', 'Credit Card', 'Sehat Card Plus', 'Corporate Insurance')) DEFAULT 'Cash',
    created_at TEXT DEFAULT (datetime('now'))
);

-- 19. Patient EMR Vault (Module 6 Deliverable & DEF-02 Tenant Key Verification)
CREATE TABLE IF NOT EXISTS patient_emr (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hospital_id INTEGER NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    mrn TEXT UNIQUE NOT NULL,
    patient_name TEXT NOT NULL,
    age INTEGER NOT NULL,
    gender TEXT NOT NULL,
    blood_group TEXT NOT NULL,
    chronic_conditions TEXT,
    allergies TEXT,
    current_medications TEXT,
    last_visit_date TEXT NOT NULL
);

-- 20. AI Diagnosis & Symptom Checker (CR-01 Deliverable)
CREATE TABLE IF NOT EXISTS ai_diagnosis_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    symptoms TEXT NOT NULL,
    patient_age INTEGER,
    gender TEXT,
    suggested_condition TEXT NOT NULL,
    urgency_level TEXT NOT NULL CHECK(urgency_level IN ('Emergency', 'Urgent', 'Routine')),
    confidence_score REAL NOT NULL,
    recommended_department TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
);
