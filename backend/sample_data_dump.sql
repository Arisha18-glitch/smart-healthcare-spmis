BEGIN TRANSACTION;
CREATE TABLE activities (
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
INSERT INTO "activities" VALUES(1,'A01','Requirements',1,10,350000.0,1,100.0,340000.0,0,'2026-11-01 16:47:47');
INSERT INTO "activities" VALUES(2,'A02','DB design',6,10,300000.0,6,100.0,310000.0,0,'2026-11-01 16:47:47');
INSERT INTO "activities" VALUES(3,'A03','Architecture and UI design',4,10,300000.0,4,100.0,300000.0,0,'2026-11-01 16:47:47');
INSERT INTO "activities" VALUES(4,'A04','Appointment backend',2,20,450000.0,1,100.0,600000.0,6,'2026-11-01 16:47:47');
INSERT INTO "activities" VALUES(5,'A05','Appointment UI',5,15,350000.0,1,100.0,360000.0,0,'2026-11-01 16:47:47');
INSERT INTO "activities" VALUES(6,'A06','Doctor schedule',3,15,400000.0,3,100.0,430000.0,3,'2026-11-01 16:47:47');
INSERT INTO "activities" VALUES(7,'A07','Lab reports',3,15,400000.0,2,60.0,270000.0,0,'2026-11-01 16:47:47');
INSERT INTO "activities" VALUES(8,'A08','Online consultation',4,20,450000.0,4,85.0,470000.0,0,'2026-11-01 16:47:47');
INSERT INTO "activities" VALUES(9,'A09','Billing',2,15,400000.0,5,30.0,150000.0,0,'2026-11-01 16:47:47');
INSERT INTO "activities" VALUES(10,'A10','Patient records',6,10,250000.0,6,50.0,130000.0,0,'2026-11-01 16:47:47');
INSERT INTO "activities" VALUES(11,'A11','Integration',5,10,350000.0,1,0.0,0.0,0,'2026-11-01 16:47:47');
INSERT INTO "activities" VALUES(12,'A12','Testing',7,15,400000.0,1,0.0,0.0,0,'2026-11-01 16:47:47');
INSERT INTO "activities" VALUES(13,'A13','Deployment',7,8,300000.0,1,0.0,0.0,0,'2026-11-01 16:47:47');
CREATE TABLE activity_dependencies (
    activity_id INTEGER NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
    predecessor_id INTEGER NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
    PRIMARY KEY (activity_id, predecessor_id),
    CHECK (activity_id != predecessor_id)
);
INSERT INTO "activity_dependencies" VALUES(2,1);
INSERT INTO "activity_dependencies" VALUES(3,1);
INSERT INTO "activity_dependencies" VALUES(4,2);
INSERT INTO "activity_dependencies" VALUES(5,2);
INSERT INTO "activity_dependencies" VALUES(5,3);
INSERT INTO "activity_dependencies" VALUES(6,2);
INSERT INTO "activity_dependencies" VALUES(7,6);
INSERT INTO "activity_dependencies" VALUES(8,2);
INSERT INTO "activity_dependencies" VALUES(8,3);
INSERT INTO "activity_dependencies" VALUES(9,4);
INSERT INTO "activity_dependencies" VALUES(10,4);
INSERT INTO "activity_dependencies" VALUES(10,6);
INSERT INTO "activity_dependencies" VALUES(11,5);
INSERT INTO "activity_dependencies" VALUES(11,7);
INSERT INTO "activity_dependencies" VALUES(11,8);
INSERT INTO "activity_dependencies" VALUES(11,9);
INSERT INTO "activity_dependencies" VALUES(11,10);
INSERT INTO "activity_dependencies" VALUES(12,11);
INSERT INTO "activity_dependencies" VALUES(13,12);
CREATE TABLE ai_diagnosis_logs (
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
CREATE TABLE appointments (
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
INSERT INTO "appointments" VALUES(1,1,1,'Muhammad Arshad','0300-4567891','2026-10-27','09:00 - 09:30 AM','Confirmed','Cardiac evaluation post-angioplasty','2026-10-25 20:39:06');
INSERT INTO "appointments" VALUES(2,1,1,'Shahid Mehmood','0321-8765432','2026-10-27','09:30 - 10:00 AM','Confirmed','Hypertension follow-up and ECG check','2026-10-25 20:39:06');
INSERT INTO "appointments" VALUES(3,1,2,'Zubair Ahmed','0333-1122334','2026-10-27','10:00 - 10:30 AM','In Consultation','Frequent migraine and episodic dizziness','2026-10-25 20:39:06');
INSERT INTO "appointments" VALUES(4,2,3,'Rashid Latif','0345-9988776','2026-10-28','11:00 - 11:30 AM','Confirmed','Post-operative hernia checkup','2026-10-25 20:39:06');
INSERT INTO "appointments" VALUES(5,2,4,'Nasreen Akhtar','0312-3344556','2026-10-28','11:30 - 12:00 PM','Confirmed','Asthma exacerbation and inhaler review','2026-10-25 20:39:06');
INSERT INTO "appointments" VALUES(6,3,5,'Ghulam Murtaza','0301-7788990','2026-10-29','02:00 - 02:30 PM','Confirmed','Knee arthroscopy rehabilitation assessment','2026-10-25 20:39:06');
INSERT INTO "appointments" VALUES(7,5,9,'Baby Zainab (Mother: Saira)','0322-6655443','2026-10-27','10:00 - 10:30 AM','Confirmed','Persistent fever and pediatric cough for 4 days','2026-10-25 20:39:06');
INSERT INTO "appointments" VALUES(8,5,10,'Master Ali (Father: Imran)','0300-1122445','2026-10-29','11:00 - 11:30 AM','Confirmed','Congenital heart murmur evaluation','2026-10-25 20:39:06');
CREATE TABLE billing_invoices (
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
INSERT INTO "billing_invoices" VALUES(1,1,'INV-JIN-2026-001','Muhammad Arshad','MRN-JIN-10492',15000.0,2500.0,6500.0,4500.0,1425.0,29925.0,'Paid','Sehat Card Plus','2026-10-25 20:39:06');
INSERT INTO "billing_invoices" VALUES(2,2,'INV-SRV-2026-002','Nasreen Akhtar','MRN-SRV-20831',8000.0,1800.0,3200.0,2900.0,795.0,16695.0,'Paid','Cash','2026-10-25 20:39:06');
INSERT INTO "billing_invoices" VALUES(3,3,'INV-MYO-2026-003','Ghulam Murtaza','MRN-MYO-40912',0.0,2000.0,12000.0,1500.0,775.0,16275.0,'Pending Insurance','Corporate Insurance','2026-10-25 20:39:06');
INSERT INTO "billing_invoices" VALUES(4,4,'INV-LGH-2026-004','Babar Azam','MRN-LGH-50821',0.0,1500.0,2200.0,800.0,225.0,4725.0,'Paid','Credit Card','2026-10-25 20:39:06');
INSERT INTO "billing_invoices" VALUES(5,5,'INV-CHD-2026-005','Baby Zainab','MRN-CHD-60192',5000.0,2000.0,4500.0,2100.0,680.0,14280.0,'Unpaid','Cash','2026-10-25 20:39:06');
CREATE TABLE change_requests (
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
INSERT INTO "change_requests" VALUES(1,'CR-001','Add AI Diagnosis Module','Hospital management requested integrating an AI diagnosis module to triage incoming emergency and outpatient cases across the 5 hospital branches before physician assignment.',7,450000.0,2,'Pending',NULL,'2026-10-15',NULL);
INSERT INTO "change_requests" VALUES(2,'CR-002','Develop Mobile App Companion','Patient feedback and hospital board requested mobile iOS and Android applications to enable push notifications for lab reports and remote queue tracking.',8,350000.0,1,'Pending',NULL,'2026-10-18',NULL);
CREATE TABLE defects (
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
INSERT INTO "defects" VALUES(1,'DEF-01','Race condition in appointment concurrency lock causing double-booking of doctor slots','Critical',2,4,'Open','2026-10-20',NULL);
INSERT INTO "defects" VALUES(2,'DEF-02','Patient electronic record overwritten during simultaneous federated hospital lookups','Critical',6,10,'Open','2026-10-22',NULL);
INSERT INTO "defects" VALUES(3,'DEF-03','Minor padding alignment issue in printable lab diagnostic report PDF header','Low',5,7,'Resolved','2026-10-18','Adjusted PDF print media margin and typography rules.');
INSERT INTO "defects" VALUES(4,'DEF-04','Slow query execution on multi-hospital doctor schedule filter dropdown','Medium',3,6,'Open','2026-10-24',NULL);
CREATE TABLE doctor_shifts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hospital_id INTEGER NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    doctor_id INTEGER NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    shift_date TEXT NOT NULL,
    shift_type TEXT NOT NULL CHECK(shift_type IN ('Morning (08:00 - 14:00)', 'Evening (14:00 - 20:00)', 'Night (20:00 - 08:00)', 'On-Call Emergency')),
    department TEXT NOT NULL,
    duty_status TEXT NOT NULL CHECK(duty_status IN ('Scheduled', 'On Duty', 'Completed', 'Cover Assigned')) DEFAULT 'Scheduled'
);
INSERT INTO "doctor_shifts" VALUES(1,1,1,'2026-10-26','Morning (08:00 - 14:00)','Department of Cardiology','On Duty');
INSERT INTO "doctor_shifts" VALUES(2,1,2,'2026-10-26','Evening (14:00 - 20:00)','Department of Neurology','Scheduled');
INSERT INTO "doctor_shifts" VALUES(3,2,3,'2026-10-26','Morning (08:00 - 14:00)','Surgical Unit 1','On Duty');
INSERT INTO "doctor_shifts" VALUES(4,2,4,'2026-10-26','Night (20:00 - 08:00)','Chest & Respiratory Care','Scheduled');
INSERT INTO "doctor_shifts" VALUES(5,3,5,'2026-10-26','Morning (08:00 - 14:00)','Trauma Centre','On Duty');
INSERT INTO "doctor_shifts" VALUES(6,3,6,'2026-10-26','On-Call Emergency','Medical Unit 3','Scheduled');
INSERT INTO "doctor_shifts" VALUES(7,4,7,'2026-10-26','Morning (08:00 - 14:00)','Spine & Brain Clinic','On Duty');
INSERT INTO "doctor_shifts" VALUES(8,5,9,'2026-10-26','Morning (08:00 - 14:00)','Pediatric Medicine Unit','On Duty');
INSERT INTO "doctor_shifts" VALUES(9,5,10,'2026-10-26','Evening (14:00 - 20:00)','Pediatric Cardiac Centre','Scheduled');
CREATE TABLE doctors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hospital_id INTEGER NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    specialization TEXT NOT NULL,
    department TEXT NOT NULL,
    room_no TEXT NOT NULL,
    fee_pkr REAL NOT NULL CHECK(fee_pkr >= 0),
    available_days TEXT NOT NULL DEFAULT 'Mon-Fri'
);
INSERT INTO "doctors" VALUES(1,1,'Prof. Dr. Tariq Mahmood','Cardiology','Department of Cardiology','Room 204, OPD Block A',2500.0,'Mon, Wed, Fri');
INSERT INTO "doctors" VALUES(2,1,'Dr. Sarah Bilal','Neurology','Department of Neurology','Room 112, OPD Block A',2000.0,'Tue, Thu, Sat');
INSERT INTO "doctors" VALUES(3,2,'Prof. Dr. Javaid Iqbal','General Surgery','Surgical Unit 1','Room 305, Main Block',2200.0,'Mon, Tue, Thu');
INSERT INTO "doctors" VALUES(4,2,'Dr. Amina Farooq','Pulmonology','Chest & Respiratory Care','Room 108, Clinic Wing',1800.0,'Mon-Fri');
INSERT INTO "doctors" VALUES(5,3,'Dr. Kamran Akram','Orthopedics & Trauma','Trauma Centre','Emergency Room 4',2000.0,'Mon, Wed, Sat');
INSERT INTO "doctors" VALUES(6,3,'Dr. Zainab Hashmi','Internal Medicine','Medical Unit 3','Room 215, South Wing',1500.0,'Mon-Sat');
INSERT INTO "doctors" VALUES(7,4,'Dr. Usman Ghani','Neurosurgery','Spine & Brain Clinic','Room 402, LGH Neuro Block',2500.0,'Tue, Thu');
INSERT INTO "doctors" VALUES(8,4,'Dr. Maria Khalid','Pathology & Diagnostics','Central Diagnostic Lab','Lab Office 1',1200.0,'Mon-Fri');
INSERT INTO "doctors" VALUES(9,5,'Prof. Dr. Sajid Maqbool','Pediatrics','Pediatric Medicine Unit','Room 101, Child OPD',2000.0,'Mon, Wed, Fri');
INSERT INTO "doctors" VALUES(10,5,'Dr. Hina Rizvi','Pediatric Cardiology','Pediatric Cardiac Centre','Room 202, Child OPD',2200.0,'Tue, Thu');
CREATE TABLE hospitals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    city TEXT NOT NULL,
    total_beds INTEGER NOT NULL,
    emergency_contact TEXT NOT NULL
);
INSERT INTO "hospitals" VALUES(1,'H-01','Jinnah Hospital Lahore','Lahore (Allama Iqbal Town)',1500,'+92-42-99231400');
INSERT INTO "hospitals" VALUES(2,'H-02','Services Hospital Lahore','Lahore (Jail Road)',1250,'+92-42-99205517');
INSERT INTO "hospitals" VALUES(3,'H-03','Mayo Hospital Lahore','Lahore (Anarkali)',2300,'+92-42-99211100');
INSERT INTO "hospitals" VALUES(4,'H-04','Lahore General Hospital','Lahore (Ferozepur Road)',1000,'+92-42-99268800');
INSERT INTO "hospitals" VALUES(5,'H-05','The Children''s Hospital Lahore','Lahore (Ferozepur Road)',1100,'+92-42-99230901');
CREATE TABLE lab_reports (
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
INSERT INTO "lab_reports" VALUES(1,1,'Muhammad Arshad','MRN-JIN-10492','Complete Blood Count (CBC)','Hematology','Hemoglobin: 13.8, WBC: 7,400, Platelets: 245,000','Hb: 13-17 g/dL, WBC: 4000-11000/mcL','g/dL & /mcL','Normal','Within normal adult reference limits.','2026-10-25');
INSERT INTO "lab_reports" VALUES(2,1,'Muhammad Arshad','MRN-JIN-10492','Lipid Profile Screen','Biochemistry','Total Cholesterol: 248, LDL: 165, HDL: 38, Triglycerides: 225','Chol < 200, LDL < 100, HDL > 40','mg/dL','Abnormal','Elevated LDL and serum triglycerides. Atorvastatin 20mg recommended.','2026-10-25');
INSERT INTO "lab_reports" VALUES(3,2,'Nasreen Akhtar','MRN-SRV-20831','Arterial Blood Gases (ABG)','Biochemistry','pH: 7.34, pO2: 78, pCO2: 48, HCO3: 26, SpO2: 92%','pH: 7.35-7.45, pO2: 80-100','mmHg','Abnormal','Mild respiratory acidosis secondary to acute bronchospasm.','2026-10-24');
INSERT INTO "lab_reports" VALUES(4,2,'Tariq Javed','MRN-SRV-30114','Glycated Hemoglobin (HbA1c)','Biochemistry','HbA1c: 9.4%','Normal: < 5.7%, Diabetic: > 6.5%','%','Critical','Severely unmanaged Type 2 Diabetes Mellitus. Endocrinology referral advised.','2026-10-24');
INSERT INTO "lab_reports" VALUES(5,3,'Ghulam Murtaza','MRN-MYO-40912','MRI Right Knee Joint','Radiology','Grade II tear of posterior horn of medial meniscus. Joint effusion present.','Intact menisci and cruciate ligaments','Visual','Abnormal','Orthopedic surgical consultation recommended.','2026-10-23');
INSERT INTO "lab_reports" VALUES(6,4,'Babar Azam','MRN-LGH-50821','Renal Function Tests (RFT)','Biochemistry','Serum Creatinine: 1.1, Urea: 28, eGFR: > 90','Creatinine: 0.7-1.3 mg/dL, Urea: 15-45 mg/dL','mg/dL','Normal','Normal renal excretion profile.','2026-10-25');
INSERT INTO "lab_reports" VALUES(7,5,'Baby Zainab','MRN-CHD-60192','Blood Culture & Sensitivity','Microbiology','No bacterial growth after 48 hours of aerobic incubation.','Sterile (No Growth)','Growth','Normal','Bacterial sepsis ruled out. Viral prodrome suspected.','2026-10-26');
CREATE TABLE management_plan (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    scope_plan TEXT NOT NULL DEFAULT '',
    schedule_plan TEXT NOT NULL DEFAULT '',
    cost_plan TEXT NOT NULL DEFAULT '',
    quality_plan TEXT NOT NULL DEFAULT '',
    last_autofilled_at TEXT
);
INSERT INTO "management_plan" VALUES(1,'SCOPE MANAGEMENT PLAN
---------------------
1. Scope Boundaries: In-Scope: Outpatient appointments, electronic medical records, lab reports, doctor schedules, online consultations, billing. Out-of-Scope: Pharmacy hardware and external insurance underwriting.
2. Requirements Baseline: Total requirements: 8, Approved Deliverables: 6, Proposed (Pending CR): 2.
3. Work Breakdown Structure: 13 Work Packages defined across approved deliverables.
4. Change Control Procedure: Scope additions require formal Change Requests with cost & schedule impact analysis. Unapproved requirements are strictly barred from scope execution.','SCHEDULE MANAGEMENT PLAN
------------------------
1. Project Duration: 2026-09-07 to 2026-12-27 (15 weeks, 111 calendar days).
2. Method: Critical Path Method (CPM) with programmatic forward and backward passes.
3. Critical Path Activities (7): Requirements, DB design, Appointment backend, Billing, Integration, Testing, Deployment.
4. Projected Project Finish: 2026-12-09 (On track).
5. Key Milestones: 6 defined (Achieved: 3, On Track: 1, Delayed: 2).','COST MANAGEMENT PLAN
--------------------
1. Approved Budget Cap: PKR 5,000,000.00
2. Budget at Completion (BAC - Planned): PKR 4,700,000.00
3. Contingency/Management Reserve: PKR 300,000.00
4. Performance Monitoring: Earned Value Management (EVM) evaluated weekly.
5. Control Thresholds: CPI warning threshold set at 0.90, SPI warning threshold set at 0.90.
6. Forecast at Completion (EAC): PKR 5,233,471.42 with VAC of PKR -533,471.42.','QUALITY MANAGEMENT PLAN
-----------------------
1. Quality Standards: Standard 5-point verification checklist required for every approved deliverable (Architecture & Security, Unit/Integration Tests, UI/UX Standards, Concurrency Benchmarks, User Acceptance).
2. Defect Resolution Policy: Deliverable readiness is blocked while any Critical or High defect remains open.
3. Readiness Threshold: Deliverables require 100% inspection pass rate and 0 open critical defects before production release.','2026-11-01 21:47:47');
CREATE TABLE milestones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    linked_activity_id INTEGER NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
    target_date TEXT NOT NULL,
    responsible_person TEXT NOT NULL
);
INSERT INTO "milestones" VALUES(1,'M1: Requirements Specification Baseline',1,'2026-09-16','Project Manager');
INSERT INTO "milestones" VALUES(2,'M2: Architecture & DB Design Sign-off',2,'2026-09-26','Database Developer');
INSERT INTO "milestones" VALUES(3,'M3: Outpatient Scheduling Engine Pilot',4,'2026-10-16','Backend 1');
INSERT INTO "milestones" VALUES(4,'M4: Online Consultation & Telehealth Beta',8,'2026-10-16','Frontend 1');
INSERT INTO "milestones" VALUES(5,'M5: Cross-Hospital System Integration',11,'2026-11-10','Frontend 2');
INSERT INTO "milestones" VALUES(6,'M6: Final Hospital Network Go-Live',13,'2026-12-03','QA Engineer');
CREATE TABLE online_consultations (
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
INSERT INTO "online_consultations" VALUES(1,1,1,'Pervez Musharraf','Cardiac Review','Completed','Patient reports stable exercise tolerance without angina. BP 125/80.','Tab. Nebivolol 5mg OD, Tab. Aspirin 75mg OD.',2500.0,'2026-10-25 20:39:06');
INSERT INTO "online_consultations" VALUES(2,2,4,'Farah Naz','Pulmonology Followup','In Progress','Post-COVID interstitial lung monitoring. Inhaler compliance confirmed.','Inhaler Budesonide/Formoterol 200/6 2 puffs BD.',1800.0,'2026-10-25 20:39:06');
INSERT INTO "online_consultations" VALUES(3,5,9,'Baby Hamza (Mother: Rabia)','Pediatric Teleguidance','Waiting Room','Pediatric rash over trunk and arms, mild fever.','Syrup Paracetamol 120mg TDS as needed for fever.',1500.0,'2026-10-25 20:39:06');
CREATE TABLE patient_emr (
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
INSERT INTO "patient_emr" VALUES(1,1,'MRN-JIN-10492','Muhammad Arshad',54,'Male','B+ Positive','Ischemic Heart Disease, Essential Hypertension','Penicillin (Severe anaphylaxis)','Aspirin 75mg, Atorvastatin 20mg, Amlodipine 5mg','2026-10-25');
INSERT INTO "patient_emr" VALUES(2,2,'MRN-SRV-20831','Nasreen Akhtar',46,'Female','O+ Positive','Chronic Bronchial Asthma, Allergic Rhinitis','Sulfa Antibiotics','Salbutamol Inhaler, Montelukast 10mg','2026-10-24');
INSERT INTO "patient_emr" VALUES(3,3,'MRN-MYO-40912','Ghulam Murtaza',38,'Male','A+ Positive','Traumatic Meniscal Injury (Right Knee)','NSAIDs (Gastric Ulceration)','Paracetamol 1g, Glucosamine Sulphate','2026-10-23');
INSERT INTO "patient_emr" VALUES(4,4,'MRN-LGH-50821','Babar Azam',29,'Male','AB+ Positive','Migraine with Aura, Cervical Radiculopathy','None Known','Zolmitriptan 2.5mg PRN','2026-10-25');
INSERT INTO "patient_emr" VALUES(5,5,'MRN-CHD-60192','Baby Zainab',3,'Female','O- Negative','Recurrent Upper Respiratory Tract Infections','Ceftriaxone','Paracetamol Syrup, Saline Nasal Drops','2026-10-26');
CREATE TABLE project_charter (
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
INSERT INTO "project_charter" VALUES(1,'Smart Healthcare Project Management System (5-Hospital Network)','Design, implement, validate, and roll out a centralized, high-availability healthcare project management and clinical workflow system across 5 hospital branches (appointments, lab diagnostics, doctor rota schedules, online consultations, billing, and electronic medical records).','Hospital Network Executive Board, Chief Medical Officers, 5 Hospital Branch Directors, Head of Nursing, Chief Financial Officer, Patient Advocacy Council, Engineering Project Team.','In-Scope: Outpatient appointments, electronic medical records, lab reports, doctor schedules, online consultations, billing. Out-of-Scope: Pharmacy hardware and external insurance underwriting.',5000000.0,5000000.0,'2026-09-07','2026-12-27','2026-12-27','Executing',0.9,0.9,'2026-10-26','2026-11-01 16:47:47','2026-11-01 16:47:47');
CREATE TABLE quality_checklist_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    deliverable_id INTEGER NOT NULL REFERENCES requirements(id) ON DELETE CASCADE,
    item_text TEXT NOT NULL,
    result TEXT NOT NULL CHECK(result IN ('Pending', 'Pass', 'Fail')) DEFAULT 'Pending',
    inspector_id INTEGER REFERENCES team_members(id),
    inspection_date TEXT,
    notes TEXT
);
INSERT INTO "quality_checklist_items" VALUES(211,1,'Architecture, security compliance and patient data encryption validation','Pending',NULL,NULL,NULL);
INSERT INTO "quality_checklist_items" VALUES(212,1,'Core business logic unit and integration test suite 100% pass','Pending',NULL,NULL,NULL);
INSERT INTO "quality_checklist_items" VALUES(213,1,'User interface & clinical workflow UX standards verification','Pending',NULL,NULL,NULL);
INSERT INTO "quality_checklist_items" VALUES(214,1,'Multi-hospital concurrent performance & latency benchmark test','Pending',NULL,NULL,NULL);
INSERT INTO "quality_checklist_items" VALUES(215,1,'Clinical staff & hospital administrative user acceptance sign-off','Pending',NULL,NULL,NULL);
INSERT INTO "quality_checklist_items" VALUES(216,2,'Architecture, security compliance and patient data encryption validation','Pass',7,'2026-10-22','Diagnostic result upload and HL7 FHIR encryption verified.');
INSERT INTO "quality_checklist_items" VALUES(217,2,'Core business logic unit and integration test suite 100% pass','Pass',7,'2026-10-22','Diagnostic result upload and HL7 FHIR encryption verified.');
INSERT INTO "quality_checklist_items" VALUES(218,2,'User interface & clinical workflow UX standards verification','Pass',7,'2026-10-22','Diagnostic result upload and HL7 FHIR encryption verified.');
INSERT INTO "quality_checklist_items" VALUES(219,2,'Multi-hospital concurrent performance & latency benchmark test','Pass',7,'2026-10-22','Diagnostic result upload and HL7 FHIR encryption verified.');
INSERT INTO "quality_checklist_items" VALUES(220,2,'Clinical staff & hospital administrative user acceptance sign-off','Pending',NULL,NULL,NULL);
INSERT INTO "quality_checklist_items" VALUES(221,3,'Architecture, security compliance and patient data encryption validation','Pass',7,'2026-10-10','Verified against hospital physician shift rules.');
INSERT INTO "quality_checklist_items" VALUES(222,3,'Core business logic unit and integration test suite 100% pass','Pass',7,'2026-10-10','Verified against hospital physician shift rules.');
INSERT INTO "quality_checklist_items" VALUES(223,3,'User interface & clinical workflow UX standards verification','Pass',7,'2026-10-10','Verified against hospital physician shift rules.');
INSERT INTO "quality_checklist_items" VALUES(224,3,'Multi-hospital concurrent performance & latency benchmark test','Pass',7,'2026-10-10','Verified against hospital physician shift rules.');
INSERT INTO "quality_checklist_items" VALUES(225,3,'Clinical staff & hospital administrative user acceptance sign-off','Pass',7,'2026-10-10','Verified against hospital physician shift rules.');
INSERT INTO "quality_checklist_items" VALUES(226,6,'Architecture, security compliance and patient data encryption validation','Pending',NULL,NULL,NULL);
INSERT INTO "quality_checklist_items" VALUES(227,6,'Core business logic unit and integration test suite 100% pass','Pending',NULL,NULL,NULL);
INSERT INTO "quality_checklist_items" VALUES(228,6,'User interface & clinical workflow UX standards verification','Pending',NULL,NULL,NULL);
INSERT INTO "quality_checklist_items" VALUES(229,6,'Multi-hospital concurrent performance & latency benchmark test','Pending',NULL,NULL,NULL);
INSERT INTO "quality_checklist_items" VALUES(230,6,'Clinical staff & hospital administrative user acceptance sign-off','Pending',NULL,NULL,NULL);
CREATE TABLE requirements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    req_code TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    priority TEXT NOT NULL CHECK(priority IN ('High', 'Medium', 'Low')) DEFAULT 'Medium',
    status TEXT NOT NULL CHECK(status IN ('Proposed', 'Approved', 'Rejected')) DEFAULT 'Proposed',
    category TEXT NOT NULL DEFAULT 'Core Module',
    created_at TEXT DEFAULT (datetime('now'))
);
INSERT INTO "requirements" VALUES(1,'R1','Appointments','Multi-hospital appointment booking, time-slot reservation, doctor availability matching, and SMS confirmation notifications.','High','Approved','Core Clinical','2026-11-01 16:47:47');
INSERT INTO "requirements" VALUES(2,'R2','Lab reports','Digital test requisition, pathology and radiology result upload, automated PDF report generation, and portal download.','Medium','Approved','Diagnostics','2026-11-01 16:47:47');
INSERT INTO "requirements" VALUES(3,'R3','Doctor schedules','Doctor shift rostering, on-call duty scheduling, leave cover coordination, and emergency department doctor allocation across 5 hospital units.','High','Approved','Hospital Admin','2026-11-01 16:47:47');
INSERT INTO "requirements" VALUES(4,'R4','Online consultation','Secure WebRTC video conferencing for remote doctor-patient consultations, digital prescription pad, and consultation history.','High','Approved','Telehealth','2026-11-01 16:47:47');
INSERT INTO "requirements" VALUES(5,'R5','Billing','Automated fee computation, multi-department invoice generation, cash/card payment receipting, and daily hospital ledger balancing.','Medium','Approved','Financials','2026-11-01 16:47:47');
INSERT INTO "requirements" VALUES(6,'R6','Patient records','Longitudinal patient health records, diagnostic history, allergies, medication tracking, and role-based HIPAA-compliant access control.','High','Approved','Core Clinical','2026-11-01 16:47:47');
INSERT INTO "requirements" VALUES(7,'R7','AI diagnosis','Machine learning preliminary symptom triaging module suggesting differential diagnoses and recommended clinical departments.','High','Proposed','AI & Innovations','2026-11-01 16:47:47');
INSERT INTO "requirements" VALUES(8,'R8','Mobile app','Smart Healthcare native companion application for mobile booking, instant lab alerts, and prescription access.','Medium','Proposed','Mobile Platform','2026-11-01 16:47:47');
CREATE TABLE risks (
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
INSERT INTO "risks" VALUES(1,'RSK-01','Legacy Hospital EHR Interoperability Failure','Different hospital branches use proprietary legacy schema formats that may cause data loss or corruption during migration.',4,4,'Open','Achieve zero-data-loss patient history synchronization across all 5 hospitals.','Build HL7 FHIR-compliant schema validation adapters with strict JSON schema sanitization prior to ingest.','Deploy automated fallback translation service with dead-letter queue and immediate manual triage notification.');
INSERT INTO "risks" VALUES(2,'RSK-02','High Concurrency Traffic Surges During Morning Booking Peak','Peak morning outpatient booking (8:00 AM - 10:00 AM) may saturate database connection pool and cause timeouts.',3,5,'Open','Maintain < 500ms transaction response time during peak load of 2,000 concurrent bookings.','Implement Redis distributed locking, connection pooling, and read-replica offloading for available doctor slots.','Activate priority queuing with token-based throttling and graceful degradation to wait-room messaging.');
INSERT INTO "risks" VALUES(3,'RSK-03','Scope Creep from Departmental Clinical Chiefs','Hospital departmental heads requesting custom clinical specialty forms without project manager authorization.',4,3,'Open','Strictly constrain project delivery within 16-week timeline and approved PKR 5,000,000 budget.','Enforce formal Change Control Board (CCB) review requiring financial and schedule impact sign-off prior to code development.','Defer non-standard department variations to Phase 2 roadmap and provide generic configurable notes field in core EMR.');
INSERT INTO "risks" VALUES(4,'RSK-04','Doctor Resistance to Digital Rota and Telehealth System','Senior clinicians may resist digital schedule rostering and online video consultation workflows.',3,3,'Open','Achieve > 80% daily active doctor engagement across all 5 hospital branches within 3 weeks of rollout.','Involve clinical department chiefs in UI prototype evaluations and conduct mandatory 1-on-1 accredited training sessions.','Deploy dedicated on-site hospital engineering champions for rapid assistance during doctor shifts.');
INSERT INTO "risks" VALUES(5,'RSK-05','Cloud Gateway Latency Spikes in Remote Branch Locations','Unstable WAN connectivity between suburban hospital clinics and central cloud servers causing lab download delays.',2,4,'Open','Guarantee 99.9% uptime and high-speed diagnostic report availability across all branch terminals.','Configure edge CDN caching and local offline-capable Progressive Web caching for daily clinic schedules.','Failover to dedicated secondary 4G LTE cellular data tunnel with compressed payload payloads.');
INSERT INTO "risks" VALUES(6,'RSK-06','Minor UI Display Variations Across Hospital Terminal Monitors','Hospital terminals have varied aspect ratios (1080p, 720p, legacy monitors) causing occasional table wrapping.',2,2,'Open','Ensure responsive and readable user interface across all hospital workstation hardware.','Establish unified CSS token design system and automated multi-viewport testing suite in CI pipeline.','Apply custom viewport CSS resets and dynamic responsive typography overrides.');
CREATE TABLE team_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    email TEXT
);
INSERT INTO "team_members" VALUES(1,'Project Manager','Project Manager','pm@healthcare.network');
INSERT INTO "team_members" VALUES(2,'Backend 1','Senior Backend Developer','backend1@healthcare.network');
INSERT INTO "team_members" VALUES(3,'Backend 2','Backend Developer','backend2@healthcare.network');
INSERT INTO "team_members" VALUES(4,'Frontend 1','Senior Frontend Developer','frontend1@healthcare.network');
INSERT INTO "team_members" VALUES(5,'Frontend 2','Frontend Developer','frontend2@healthcare.network');
INSERT INTO "team_members" VALUES(6,'Database Developer','Database Developer & DBA','dba@healthcare.network');
INSERT INTO "team_members" VALUES(7,'QA Engineer','Quality Assurance Engineer','qa@healthcare.network');
DELETE FROM "sqlite_sequence";
INSERT INTO "sqlite_sequence" VALUES('team_members',7);
INSERT INTO "sqlite_sequence" VALUES('requirements',8);
INSERT INTO "sqlite_sequence" VALUES('change_requests',2);
INSERT INTO "sqlite_sequence" VALUES('activities',17);
INSERT INTO "sqlite_sequence" VALUES('milestones',6);
INSERT INTO "sqlite_sequence" VALUES('defects',4);
INSERT INTO "sqlite_sequence" VALUES('quality_checklist_items',230);
INSERT INTO "sqlite_sequence" VALUES('risks',6);
INSERT INTO "sqlite_sequence" VALUES('hospitals',5);
INSERT INTO "sqlite_sequence" VALUES('doctors',10);
INSERT INTO "sqlite_sequence" VALUES('appointments',8);
INSERT INTO "sqlite_sequence" VALUES('doctor_shifts',9);
INSERT INTO "sqlite_sequence" VALUES('lab_reports',7);
INSERT INTO "sqlite_sequence" VALUES('online_consultations',3);
INSERT INTO "sqlite_sequence" VALUES('billing_invoices',5);
INSERT INTO "sqlite_sequence" VALUES('patient_emr',5);
COMMIT;
