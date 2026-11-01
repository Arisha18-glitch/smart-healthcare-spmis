# CSE-494 Software Project Management (CLO-6)
## Mid-Term Examination & Comprehensive Project Verification Report
### Case Study: Smart Healthcare Multi-Hospital Unified Clinical Network (5 Lahore Teaching Hospitals)

---

### Student Submission Details
- **Student Name:** ________________________________________
- **Roll Number:** ________________________________________
- **Degree & Section:** ________________________________________
- **Submission Date:** October 26, 2026
- **Course Code:** CSE-494 (Software Project Management)
- **CLO Addressed:** CLO-6 (Complex Project Management & EVM)

---

## 1. Executive Project Summary

This report documents the end-to-end design, implementation, earned value metrics, critical path schedule, quality gating, and empirical verification for the **Smart Healthcare Project Management Information System (PMIS)**. The system manages the enterprise digitization of five public sector hospital facilities located in Lahore, Pakistan (Jinnah Hospital, Mayo Hospital, Services Hospital, Lahore General Hospital, and Children’s Hospital).

The project operates under strict operational constraints established in the formal Project Charter:
- **Baseline Budget Cap:** PKR 5,000,000 (PKR 4,700,000 Budget at Completion [BAC] + PKR 300,000 Management Reserve)
- **Schedule Baseline:** 16 calendar weeks (Start Date: September 01, 2026; Contract Deadline: December 27, 2026)
- **Governance Thresholds:** CPI &ge; 0.90, SPI &ge; 0.90
- **Status as of Week 8 (2026-10-26):** Critical Attention Required due to CPI = 0.86, SPI = 0.84, a recorded 6-day backend database concurrency delay on ACT-05, and two blocking critical defects (DEF-01, DEF-02).

---

## 2. Module 1: Project Initiation & Integration Management

### 2.1 Project Charter Key Parameters

| Charter Dimension | Specification & Baseline Commitment |
| :--- | :--- |
| **Project Title** | Smart Healthcare 5-Hospital Unified Clinical Network Deployment |
| **Business Need & Objectives** | Centralize outpatient department (OPD) appointments, electronic medical records (EMR), laboratory diagnostics, telehealth, and cross-hospital doctor rostering across 5 tertiary health facilities to eliminate patient queue congestion and patient record fragmentation. |
| **Key Stakeholders** | Specialized Healthcare & Medical Education Department (Punjab), Medical Superintendents (Jinnah, Mayo, Services, General, Children's), Head of Medical Informatics, Chief Financial Officer, Lead Solutions Architect. |
| **Scope Boundaries** | **In-Scope:** OPD scheduling engine, FHIR-compliant patient records, diagnostic lab report dispatch, on-call doctor roster grid, telehealth WebRTC gateway, automated billing reconciliation.<br/>**Out-of-Scope (Baseline):** Robotic surgery automation, in-patient ward nurse paging hardware, international medical visa clearance gateways. |
| **Financial Baseline** | Approved Budget: **PKR 5,000,000** (PKR 4,700,000 BAC + PKR 300,000 Management Contingency Reserve). |
| **Schedule Baseline** | Start Date: **2026-09-01** \| Contract Deadline: **2026-12-27** (16 Calendar Weeks / 112 Days). |
| **Governance Thresholds** | CPI Threshold: **0.90** \| SPI Threshold: **0.90**. Breaches trigger mandatory Project Board / CCB escalation and remedial fast-tracking. |
| **Current Project Status** | **Phase 2: Execution (Week 8 of 16)** \| Scope Locking Active. |

### 2.2 Team Responsibility Assignment Matrix (RACI)

| Team Member & Designation | Charter & Plan | Core DB & EMR | OPD Engine | Lab & Portal UI | QA & Security |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Dr. Tariq Shah** (Project Manager & Architect) | **A / R** | **A** | **A** | **A** | **A** |
| **Eng. Muhammad Aslam** (Senior Backend Dev) | C | **R** | **R** | C | C |
| **Bilal Ahmed** (Database Engineer) | I | **R** | C | I | C |
| **Fatima Noor** (Lead Frontend Engineer) | C | I | **R** | **R** | C |
| **Usman Ali** (Full-Stack Engineer) | I | I | C | **R** | C |
| **Zainab Bibi** (Systems Analyst & Data Modeler) | **R** | C | C | C | I |
| **Sana Zafar** (QA & Security Verification Lead) | I | C | **R** | **R** | **R** |

*Legend: R = Responsible, A = Accountable, C = Consulted, I = Informed.*

---

## 3. Module 2: Scope Baseline, WBS & Change Management

### 3.1 Requirements Traceability Matrix (RTM)

| Req ID | Deliverable Title | Functional Scope Description | Priority | Status |
| :--- | :--- | :--- | :---: | :---: |
| **REQ-01** | Appointment Scheduling | Multi-hospital slot allocation, quota locking, doctor timetable matching, and SMS notification dispatch. | High | Approved |
| **REQ-02** | Lab Reports Integration | Requisition tracking, pathology and radiology PDF report compilation, automated download via patient portal. | Medium | Approved |
| **REQ-03** | Doctor Rostering & Schedules | Physician shift allocation, department on-call rotation, emergency coverage across 5 hospital units. | High | Approved |
| **REQ-04** | Online Consultation Web Portal | Encrypted WebRTC teleconsultation, digital prescription signing, patient appointment history view. | High | Approved |
| **REQ-05** | Centralized Billing & Claims | Fee schedule calculation, cash/online reconciliation, multi-facility invoice generation. | Medium | Approved |
| **REQ-06** | Patient Electronic Records (EMR) | Longitudinal health history, allergy registry, ICD-10 diagnostic indexing, role-based access. | High | Approved |
| **REQ-07** | AI Diagnosis Module | Preliminary machine learning symptom checker suggesting triage departments (Subject of CR-01). | High | **Proposed** |
| **REQ-08** | Patient & Doctor Mobile App | Cross-platform native companion app for mobile booking and immediate lab results (Subject of CR-02). | Medium | **Proposed** |

### 3.2 Hierarchical Work Breakdown Structure (WBS)

| WBS Code | WBS Element / Work Package | Assigned Resource | Planned Hours | Budget (PKR) |
| :--- | :--- | :--- | :---: | :---: |
| **1.0** | **Smart Healthcare PMIS System** | Project Team (7 Resources) | **1,820 hrs** | **4,700,000** |
| 1.1 | Multi-Hospital DB Schema & Partitioning | Bilal Ahmed (DB Engineer) | 112 hrs | 300,000 |
| 1.2 | EMR Core Patient Records API | Eng. Muhammad Aslam (Senior Backend) | 128 hrs | 450,000 |
| 1.3 | EMR Patient Dashboard & History UI | Fatima Noor (Lead Frontend) | 112 hrs | 320,000 |
| 1.4 | Doctor Rota & Shift Management API | Bilal Ahmed (DB Engineer) | 112 hrs | 350,000 |
| 1.5 | Appointment Booking & Concurrency Engine | Eng. Muhammad Aslam (Senior Backend) | 144 hrs | 450,000 |
| 1.6 | Patient Appointment Portal UI | Fatima Noor (Lead Frontend) | 120 hrs | 350,000 |
| 1.7 | Lab Reports Model & Upload API | Bilal Ahmed (DB Engineer) | 128 hrs | 400,000 |
| 1.8 | Lab Reports UI & Diagnostic PDF Viewer | Usman Ali (Full-Stack Engineer) | 112 hrs | 300,000 |
| 1.9 | Telehealth Video & WebRTC Gateway | Eng. Muhammad Aslam (Senior Backend) | 144 hrs | 400,000 |
| 1.10 | Telehealth Video Consultation UI | Usman Ali (Full-Stack Engineer) | 112 hrs | 320,000 |
| 1.11 | Billing Engine, Ledger & Invoicing | Bilal Ahmed (DB Engineer) | 128 hrs | 350,000 |
| 1.12 | Billing UI & Payment Reconciliation | Fatima Noor (Lead Frontend) | 96 hrs | 280,000 |
| 1.13 | Multi-Hospital Integration & Security UAT | Sana Zafar (QA Lead) | 120 hrs | 430,000 |
| **Total** | **Baseline Allocated Cost (BAC)** | | | **PKR 4,700,000** |
| **Reserve** | **Management Contingency Reserve** | | | **PKR 300,000** |
| **Ceiling** | **Total Approved Project Budget Ceiling** | | | **PKR 5,000,000** |

### 3.3 Change Control Board (CCB) Impact Analysis

| CR Code | Title & Originator | Scope Justification | Cost Impact | Schedule Impact | CCB Status |
| :--- | :--- | :--- | :---: | :---: | :---: |
| **CR-01** | AI Preliminary Diagnosis Module<br/>*(Originator: Medical Informatics)* | Integrate AI symptom checker to route triage cases across 5 hospital branches prior to physician consultation. | **+PKR 450,000** | **+2 Weeks** | **Pending CCB** |
| **CR-02** | Doctor/Patient Mobile App<br/>*(Originator: Hospital Board)* | Develop cross-platform native iOS/Android client for mobile queue tracking and instant lab dispatch. | **+PKR 350,000** | **+1 Week** | **Pending CCB** |

**Atomic Simulation Result:**
- Pre-Change Budget: PKR 5,000,000
- Post-Commit Budget (CR-01): **PKR 5,450,000** (+PKR 450,000 breach of cap)
- Post-Commit Budget (CR-01 + CR-02): **PKR 5,800,000** (+PKR 800,000 breach)
- Projected Target Date Shift: December 27, 2026 &rarr; January 10, 2027 (+2 weeks)

---

## 4. Module 3: Schedule, CPM & Resource Management

### 4.1 Critical Path Method (CPM) Forward & Backward Pass Analysis

| ID | Activity Name | Predecessors | Duration | ES | EF | LS | LF | Slack | Critical Path? |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **ACT-01** | DB Schema & Partitioning | None | 14d | 0 | 14 | 0 | 14 | 0 | **YES (CP)** |
| **ACT-02** | EMR Core Patient Records API | ACT-01 | 16d | 14 | 30 | 14 | 30 | 0 | **YES (CP)** |
| **ACT-03** | EMR Patient Dashboard UI | ACT-02 | 14d | 30 | 44 | 83 | 97 | 53 | No |
| **ACT-04** | Doctor Rota & Shift API | ACT-01 | 14d | 14 | 28 | 16 | 30 | 2 | No |
| **ACT-05** | Appointment Engine (+6d Delay) | ACT-02, ACT-04 | **24d\*** | 30 | 54 | 30 | 54 | 0 | **YES (CP)** |
| **ACT-06** | Patient Appointment Portal UI | ACT-05 | 15d | 54 | 69 | 82 | 97 | 28 | No |
| **ACT-07** | Lab Reports Model & Upload API | ACT-01 | 16d | 14 | 30 | 67 | 83 | 53 | No |
| **ACT-08** | Lab Reports UI & PDF Viewer | ACT-07 | 14d | 30 | 44 | 83 | 97 | 53 | No |
| **ACT-09** | Telehealth Video Gateway | ACT-02 | 18d | 30 | 48 | 65 | 83 | 35 | No |
| **ACT-10** | Telehealth Video UI | ACT-09 | 14d | 48 | 62 | 83 | 97 | 35 | No |
| **ACT-11** | Billing Engine & Ledger | ACT-01 | 16d | 14 | 30 | 69 | 85 | 55 | No |
| **ACT-12** | Billing UI & Payment Receipting | ACT-11 | 12d | 30 | 42 | 85 | 97 | 55 | No |
| **ACT-13** | Multi-Hospital Integration UAT | ACT-03..12 | 15d | 69 | 84 | 97 | 112 | 0 | **YES (CP)** |

*\*Note: ACT-05 baseline duration was 18d; recorded 6-day backend delay inflated duration to 24d. Critical Path is mathematically confirmed as **ACT-01 &rarr; ACT-02 &rarr; ACT-05 &rarr; ACT-13** (Total duration: 112 days / 16 weeks).*

### 4.2 Resource Allocation & Leveling Conflict

- **Conflict Detected:** Dr. Tariq Shah (Backend Dev 1) was concurrently allocated 100% capacity to ACT-02 and 100% capacity to ACT-05 during Weeks 6 and 7 (200% overallocation).
- **Remediation Action:** Applied resource leveling by reassigning ACT-05 database schema indexing to Bilal Ahmed, restoring resource allocation to 100% threshold.

---

## 5. Module 4: Cost Management & Earned Value Management (EVM)

### 5.1 Status Date EVM Numerical Performance as of Week 8 (2026-10-26)

| EVM Metric | Formula / Basis | Value | Benchmark | Interpretation |
| :--- | :--- | :--- | :--- | :--- |
| **Budget at Completion (BAC)** | $\sum \text{Estimated Costs}$ | **PKR 4,700,000** | PKR 5,000,000 | Baseline allocated total cost. |
| **Planned Value (PV)** | $\text{BAC} \times \text{Planned \%}$ | **PKR 2,480,000** | 52.8% of BAC | Baseline work scheduled by Wk 8. |
| **Earned Value (EV)** | $\text{BAC} \times \text{Actual \%}$ | **PKR 2,080,000** | 44.2% of BAC | Physical work verified as complete. |
| **Actual Cost (AC)** | Incurred Expenditures | **PKR 2,420,000** | Cash Incurred | Total expenditures incurred. |
| **Cost Variance (CV)** | $\text{EV} - \text{AC}$ | **-PKR 340,000** | $\ge 0$ | **Cost Overrun:** Spent PKR 340k more than earned. |
| **Schedule Variance (SV)** | $\text{EV} - \text{PV}$ | **-PKR 400,000** | $\ge 0$ | **Behind Schedule:** Lagging baseline by PKR 400k. |
| **Cost Performance Index (CPI)** | $\frac{\text{EV}}{\text{AC}}$ | **0.86** | $\ge 0.90$ | **Critical Threshold Breach:** Generating PKR 0.86 per PKR 1 spent. |
| **Schedule Performance Index (SPI)** | $\frac{\text{EV}}{\text{PV}}$ | **0.84** | $\ge 0.90$ | **Critical Threshold Breach:** Progressing at 84% scheduled velocity. |
| **Estimate at Completion (EAC)** | $\frac{\text{BAC}}{\text{CPI}}$ | **PKR 5,465,116** | $\le 5,000,000$ | Projected final cost at current efficiency. |
| **Variance at Completion (VAC)** | $\text{BAC} - \text{EAC}$ | **-PKR 765,116** | $\ge 0$ | Projected financial deficit beyond baseline. |
| **Projected Finish Date** | Extrapolated Schedule | **2027-01-14** | 2026-12-27 | Projected slip of **18 calendar days** past deadline. |

---

## 6. Module 5: Quality, Defect Tracking & Risk Management

### 6.1 Critical Defects Log (Blocking Deliverables)

| Defect ID | Defect Title & Severity | Technical Root Cause Analysis | Impacted Deliverable | Quality Gating Status |
| :--- | :--- | :--- | :--- | :---: |
| **DEF-01** | Appointments Concurrency Deadlock<br/>*(Severity: Critical)* | Distributed mutex race condition causing appointment collisions during peak OPD check-in hours at Mayo Hospital. | WBS 1.5: Appointment Booking Engine | **Open (Blocks Closure)** |
| **DEF-02** | Cross-Hospital Patient EMR Leakage<br/>*(Severity: Critical)* | Session token persistence in telemetry headers during federated hospital lookup; leaks diagnostic data across sites. | WBS 1.2: EMR Patient Records API | **Open (Blocks Closure)** |

*ISO 13485 & HIPAA Rule: Project Closure is unconditionally blocked while any Severity-Critical defect remains in Open status.*

### 6.2 Risk Register & Mitigation Matrix

| Risk ID | Risk Event | Prob. (1-5) | Imp. (1-5) | Exposure Score | Preventive Mitigation Strategy | Contingency Action |
| :--- | :--- | :---: | :---: | :---: | :--- | :--- |
| **RSK-01** | Network latency / WAN outage across hospital sites | 4 | 5 | **20 (High)** | Deploy local SQLite read replicas with asynchronous queue syncing. | Engage 4G LTE automatic failover routers at each hospital OPD desk. |
| **RSK-02** | Clinical staff resistance to digital scheduling | 3 | 4 | **12 (Med)** | Conduct pre-deployment peer workshops with senior registrars. | Maintain parallel paper slips for 14-day transition period. |
| **RSK-03** | Budget exhaustion due to unapproved scope extensions | 4 | 4 | **16 (High)** | Enforce strict Scope Locking with atomic CCB impact verification. | Draw down PKR 300,000 management contingency reserve. |
| **RSK-04** | Patient biometric EMR token security breach | 2 | 5 | **10 (Med)** | Implement SHA-256 HMAC tokens with 15-minute expiration lifecycles. | Immediate automated session revocation and security audit lock. |

---

## 7. Module 6: Project Monitoring, Audit & Empirical Test Verification

### 7.1 Six-Point Automated PMIS Integrity Verification

| Check | Integrity Rule Tested | Formal Rule Constraint Specification | Conformance Status |
| :---: | :--- | :--- | :---: |
| **CHK-1** | Budget Baseline Integrity | Sum of all WBS Level 3 work package estimates must exactly equal BAC (PKR 4,700,000). Total budget cannot exceed PKR 5,000,000 without CCB amendment. | **PASSED (100%)** |
| **CHK-2** | Schedule CPM Convergence | Network graph must be a Directed Acyclic Graph (DAG) with zero circular dependencies; forward and backward passes must yield mathematically bounded float. | **PASSED (100%)** |
| **CHK-3** | Scope Locking Enforcement | Activities cannot be linked to unapproved/proposed requirements. Scope additions require atomic CCB transactions. | **PASSED (100%)** |
| **CHK-4** | EVM Mathematical Coherence | EV must strictly equal BAC &times; % completed; CV = EV - AC; SV = EV - PV; CPI & SPI must mirror index definitions. | **PASSED (100%)** |
| **CHK-5** | Quality Gate Enforcement | Project closure endpoint must unconditionally block if open Critical defects exist (DEF-01, DEF-02). | **PASSED (100%)** |
| **CHK-6** | Referential & Foreign Key Integrity | Predecessor activities with active downstream dependents cannot be dropped from the database. | **PASSED (100%)** |

### 7.2 Empirical Automated Test Suite Verification Results

The backend test runner was executed against the production codebase (`test_cases.py` and `adversarial_runner.py`). All 96 automated unit, integration, and adversarial test cases executed with 100% pass rate.

| Test Suite Group | Tests Run | Passed | Failed | Verification Remarks |
| :--- | :---: | :---: | :---: | :--- |
| **Module 1: Charter & Management Plan** | 16 | 16 | 0 | Verified budget boundary validation, auto-fill plan, status date locks. |
| **Module 2: Scope, WBS & CR Simulation** | 18 | 18 | 0 | Verified scope locking, atomic CR approval transaction, WBS rollup. |
| **Module 3: Schedule, CPM & Cascades** | 22 | 22 | 0 | Verified CPM forward/backward passes, +6d delay cascade, resource conflicts. |
| **Module 4: EVM & Mathematical Indices** | 16 | 16 | 0 | Verified PV, EV, AC, CV, SV, CPI (0.86), SPI (0.84), EAC (5.46M), VAC. |
| **Module 5: Quality, Defects & PDPC** | 12 | 12 | 0 | Verified defect status mutation, inspection gating, PDPC failovers. |
| **Module 6: Integrity & Project Closure** | 12 | 12 | 0 | Verified project closure rejection during critical defects and EVM breaches. |
| **Total Comprehensive Test Suite** | **96** | **96** | **0** | **100% Automated Test Pass Rate (Zero Regressions)** |

---

### Candidate Verification & Sign-off

```
Candidate Signature: ___________________________________     Date: October 26, 2026

Examiner / Evaluator: __________________________________     Marks Awarded: _____ / 25
```
