# Smart Healthcare Project Management System (SPM)
**Course:** CSE-494 Software Project Management | **Exam:** Mid-Term Examinations Fall-2026  
**Institution:** COMSATS University Islamabad, Sahiwal Campus | **Instructor:** Mr. Bilal Shabbir Qaisar  
**Target Case Study:** Smart Healthcare Project Management System for a network of 5 hospitals.

---

## 🚀 One-Click Quick Start ("The Middle Way")

To run the entire system (backend, frontend, database, and browser) **without typing any terminal commands or managing multiple scripts**:

### Option 1: From Workspace Root
👉 Double-click **`start_spm.bat`** in `c:\Users\saath\Desktop\Coding\`

### Option 2: From `spm_system` Folder
👉 Double-click **`start_all.bat`** in `c:\Users\saath\Desktop\Coding\spm_system\`

**What this unified script does automatically:**
1. Detects Python 3.11/3.12 in `.venv` (or system).
2. Initializes SQLite database (`spm.db`) and seeds the Fall-2026 case study dataset.
3. Launches the FastAPI backend on `http://127.0.0.1:8000`.
4. Launches the Vite React frontend on `http://localhost:5173`.
5. Automatically opens `http://localhost:5173` in your default web browser!

---

## 🛠️ Architecture & Tech Stack

- **Backend:** Python 3.11+, FastAPI, SQLite (`sqlite3` built-in with `PRAGMA foreign_keys = ON`), Pydantic models.
- **Frontend:** React 18, Vite, React Router v6, Recharts, Plain CSS (Dark Mode + Glassmorphism).
- **Core Rule:** **100% of business logic, EVM formulas, CPM schedule calculations, risk scoring, and transaction rollbacks reside strictly in `backend/logic.py`**. The frontend only consumes API endpoints.

---

## 📋 Project Structure

```
spm_system/
├── start_all.bat                 # One-click unified runner (Backend + Frontend + Browser)
├── test_results.csv              # Full automated test run report (95 tests, 100% pass rate)
├── README.md                     # Comprehensive documentation & demo script
├── backend/
│   ├── schema.sql                # SQLite relational schema with CHECK & FOREIGN KEY constraints
│   ├── db.py                     # Connection manager & SQLite initializer
│   ├── logic.py                  # ALL PM business rules, EVM, CPM forward/backward pass, and CR transactions
│   ├── main.py                   # FastAPI REST API endpoints & Pydantic validation
│   ├── sample_data.py            # Case study seed loader & SQL dump generator
│   ├── sample_data_dump.sql      # Plain SQL export of the case study database
│   └── test_cases.py             # 95 automated tests with ID, test name, expected, actual, PASS/FAIL
└── frontend/
    ├── package.json
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── App.jsx               # React Router & shell
        ├── api.js                # Centralized backend HTTP client
        ├── index.css             # Unified CSS Design System (Aesthetics)
        ├── components/
        │   ├── Navbar.jsx        # Navigation & Reset Case Study button
        │   ├── GanttChart.jsx    # Dynamic SVG Gantt chart (baseline vs forecast, milestones, status date line)
        │   ├── RiskMatrix.jsx    # Interactive 5x5 Prioritization Heatmap & ranked register
        │   ├── EvmCharts.jsx     # Recharts PV vs EV vs AC comparison & Cumulative S-Curve
        │   ├── PdpcView.jsx      # Process Decision Program Chart tree (Goal -> Risk -> Prev -> Corr)
        │   ├── QualityChecklist.jsx # 5-Point inspection checklist with critical defect blocking
        │   ├── WbsTree.jsx       # Hierarchical WBS tree with cost roll-ups
        │   ├── StatusBadge.jsx   # Color-coded status badge
        │   └── AlertBanner.jsx   # Dynamic error & warning banners
        └── pages/
            ├── DashboardPage.jsx     # Executive KPI overview & project health indicator
            ├── CharterPlanPage.jsx   # Charter baseline & auto-fill management plan
            ├── ScopeWbsPage.jsx      # Requirements scope locking & atomic Change Request transaction
            ├── ScheduleGanttPage.jsx # CPM schedule network, delays & resource conflicts
            ├── CostEvmPage.jsx       # EVM performance monitoring & date selector
            ├── QualityRisksPage.jsx  # Quality inspections, defect tracker, risk matrix & PDPC
            └── IntegrityReportPage.jsx # Automated database consistency audit & status report download
```

---

## 🧪 Automated Tests (95 Tests, 100% Pass Rate)

To re-run the 95 automated test cases from terminal:
```powershell
cd spm_system\backend
python test_cases.py
```

### Coverage Highlights:
- **Charter & Closure:** Start < deadline, positive budget, closure gates blocked on incomplete tasks / pending CRs / open critical defects.
- **Scope & Locking:** Direct requirement approval blocked outside Planning; unapproved requirements strictly barred from WBS and activities.
- **Change Request Transaction:** Atomic `BEGIN TRANSACTION` $\rightarrow$ budget increase $\rightarrow$ deadline extension $\rightarrow$ requirement approval $\rightarrow$ activity creation $\rightarrow$ schedule recomputation $\rightarrow$ rollback on error.
- **Schedule CPM:** Forward pass, backward pass, float/slack calculation, critical path identification, circular dependency detection and rollback, delay propagation to successors.
- **EVM Math:** Hand-calculated Planned Value (PV), Earned Value (EV), Actual Cost (AC), CPI (< 0.90), SPI (< 0.90), EAC, VAC, and automatic warning thresholds.
- **Quality & Defects:** 5-point standard checklist, inspection pass blocked when deliverable has unresolved critical defects.
- **Risks & PDPC:** Score ($L \times I$), High/Medium/Low rating boundaries, 5x5 grid coordinates, PDPC tree consistency.
- **System Integrity:** 7 automated audit rules verifying database foreign keys and lineage.

---

## 🗺️ Complete Mapping Table: Exam Requirement $\rightarrow$ Code $\rightarrow$ UI Location

| # | Exam Paper Requirement | Backend File & Function | Frontend File / Component | Where to See It in the UI |
|---|------------------------|-------------------------|---------------------------|----------------------------|
| **1.1** | Project Charter (objectives, stakeholders, scope, budget, start, deadline) | [`logic.py`](file:///c:/Users/saath/Desktop/Coding/spm_system/backend/logic.py): `get_charter`, `update_charter`, `validate_charter_dates_and_budget` | [`CharterPlanPage.jsx`](file:///c:/Users/saath/Desktop/Coding/spm_system/frontend/src/pages/CharterPlanPage.jsx) | **Charter & Plan** tab $\rightarrow$ "Project Charter" form |
| **1.2** | Management Plan with "Auto-fill from live project data" button | [`logic.py`](file:///c:/Users/saath/Desktop/Coding/spm_system/backend/logic.py): `auto_fill_management_plan`, `get_management_plan` | [`CharterPlanPage.jsx`](file:///c:/Users/saath/Desktop/Coding/spm_system/frontend/src/pages/CharterPlanPage.jsx) | **Charter & Plan** tab $\rightarrow$ "Management Plan" $\rightarrow$ Click `⚡ Auto-Fill From Live Project Data` |
| **1.3** | Milestones linked to activities with auto-calculated status (Achieved / On Track / Delayed) | [`logic.py`](file:///c:/Users/saath/Desktop/Coding/spm_system/backend/logic.py): `get_milestones_with_status` | [`CharterPlanPage.jsx`](file:///c:/Users/saath/Desktop/Coding/spm_system/frontend/src/pages/CharterPlanPage.jsx) & [`GanttChart.jsx`](file:///c:/Users/saath/Desktop/Coding/spm_system/frontend/src/components/GanttChart.jsx) | **Charter & Plan** $\rightarrow$ "Milestones" tab & Gantt diamond markers |
| **1.4** | Project Closure Gate (blocked on incomplete work, pending CRs, critical defects) | [`logic.py`](file:///c:/Users/saath/Desktop/Coding/spm_system/backend/logic.py): `validate_project_closure`, `close_project` | [`CharterPlanPage.jsx`](file:///c:/Users/saath/Desktop/Coding/spm_system/frontend/src/pages/CharterPlanPage.jsx) | Header button `🔒 Final Project Closure` (shows exact blocking reasons) |
| **2.1** | Requirements management (add, update, prioritize, approve/reject) | [`logic.py`](file:///c:/Users/saath/Desktop/Coding/spm_system/backend/logic.py): `get_requirements`, `add_requirement`, `update_requirement` | [`ScopeWbsPage.jsx`](file:///c:/Users/saath/Desktop/Coding/spm_system/frontend/src/pages/ScopeWbsPage.jsx) | **Scope & WBS** $\rightarrow$ "Requirements Register" tab |
| **2.2** | Scope Locking (unapproved requirements barred; direct approval locked outside Planning) | [`logic.py`](file:///c:/Users/saath/Desktop/Coding/spm_system/backend/logic.py): `add_requirement`, `update_requirement`, `add_activity` | [`ScopeWbsPage.jsx`](file:///c:/Users/saath/Desktop/Coding/spm_system/frontend/src/pages/ScopeWbsPage.jsx) | Try clicking "Approve" on Proposed req while Executing $\rightarrow$ Error alert displayed |
| **2.3** | Hierarchical WBS (Project > Deliverable > Work Package) with Cost Roll-up | [`logic.py`](file:///c:/Users/saath/Desktop/Coding/spm_system/backend/logic.py): `generate_wbs` | [`WbsTree.jsx`](file:///c:/Users/saath/Desktop/Coding/spm_system/frontend/src/components/WbsTree.jsx) | **Scope & WBS** $\rightarrow$ "Hierarchical WBS & Cost Roll-up" tab |
| **2.4** | Atomic Change Request Approval Transaction (budget, deadline, scope, WBS, schedule) | [`logic.py`](file:///c:/Users/saath/Desktop/Coding/spm_system/backend/logic.py): `approve_change_request_transaction` | [`ScopeWbsPage.jsx`](file:///c:/Users/saath/Desktop/Coding/spm_system/frontend/src/pages/ScopeWbsPage.jsx) | **Scope & WBS** $\rightarrow$ "Change Requests" tab $\rightarrow$ Click `Decide` on CR-01 $\rightarrow$ Shows Before vs After Impact Modal |
| **3.1** | Activities CPM Forward/Backward pass (Baseline vs Forecast schedule) | [`logic.py`](file:///c:/Users/saath/Desktop/Coding/spm_system/backend/logic.py): `compute_schedule` | [`ScheduleGanttPage.jsx`](file:///c:/Users/saath/Desktop/Coding/spm_system/frontend/src/pages/ScheduleGanttPage.jsx) | **Schedule & Gantt** $\rightarrow$ "All Activities" table |
| **3.2** | Circular dependency detection and rollback | [`logic.py`](file:///c:/Users/saath/Desktop/Coding/spm_system/backend/logic.py): `detect_circular_dependencies` | [`ScheduleGanttPage.jsx`](file:///c:/Users/saath/Desktop/Coding/spm_system/frontend/src/pages/ScheduleGanttPage.jsx) | Add Activity modal (rejects loops with error alert) |
| **3.3** | Slack (Float) & Critical Path calculation | [`logic.py`](file:///c:/Users/saath/Desktop/Coding/spm_system/backend/logic.py): `compute_schedule` | [`ScheduleGanttPage.jsx`](file:///c:/Users/saath/Desktop/Coding/spm_system/frontend/src/pages/ScheduleGanttPage.jsx) & [`GanttChart.jsx`](file:///c:/Users/saath/Desktop/Coding/spm_system/frontend/src/components/GanttChart.jsx) | Top banner "Critical Path Tasks" + Red bars on Gantt chart |
| **3.4** | Delayed activities tracking & impact propagation list | [`logic.py`](file:///c:/Users/saath/Desktop/Coding/spm_system/backend/logic.py): `compute_schedule` | [`ScheduleGanttPage.jsx`](file:///c:/Users/saath/Desktop/Coding/spm_system/frontend/src/pages/ScheduleGanttPage.jsx) | **Schedule & Gantt** $\rightarrow$ "Delayed Activities & Impact Analysis" tab |
| **3.5** | Dynamic SVG Gantt Chart (complete, delayed, critical, on track, markers, lines) | [`components/GanttChart.jsx`](file:///c:/Users/saath/Desktop/Coding/spm_system/frontend/src/components/GanttChart.jsx) | [`GanttChart.jsx`](file:///c:/Users/saath/Desktop/Coding/spm_system/frontend/src/components/GanttChart.jsx) | **Schedule & Gantt** $\rightarrow$ "Interactive Gantt Chart" tab |
| **3.6** | Resource Conflict Detection (same person on overlapping forecast tasks) | [`logic.py`](file:///c:/Users/saath/Desktop/Coding/spm_system/backend/logic.py): `compute_schedule` | [`ScheduleGanttPage.jsx`](file:///c:/Users/saath/Desktop/Coding/spm_system/frontend/src/pages/ScheduleGanttPage.jsx) | **Schedule & Gantt** $\rightarrow$ "Resource Conflicts" tab |
| **3.7** | Activity progress form (% complete, actual cost, delay days) | [`logic.py`](file:///c:/Users/saath/Desktop/Coding/spm_system/backend/logic.py): `update_activity_progress` | [`ScheduleGanttPage.jsx`](file:///c:/Users/saath/Desktop/Coding/spm_system/frontend/src/pages/ScheduleGanttPage.jsx) | Click `Update Progress` on any activity row |
| **4.1** | Total Planned Budget (BAC) & Budget Cap Enforcement | [`logic.py`](file:///c:/Users/saath/Desktop/Coding/spm_system/backend/logic.py): `add_activity` (BAC check) | [`CostEvmPage.jsx`](file:///c:/Users/saath/Desktop/Coding/spm_system/frontend/src/pages/CostEvmPage.jsx) | **Cost & EVM** header cards + Add activity budget block |
| **4.2** | EVM indicators at user-selectable Status Date (PV, EV, AC, CPI, SPI, CV, SV, EAC, VAC) | [`logic.py`](file:///c:/Users/saath/Desktop/Coding/spm_system/backend/logic.py): `calculate_evm` | [`CostEvmPage.jsx`](file:///c:/Users/saath/Desktop/Coding/spm_system/frontend/src/pages/CostEvmPage.jsx) | **Cost & EVM** $\rightarrow$ Date input form at top right |
| **4.3** | Configurable Warning Thresholds & Alerts (Cost overrun, schedule deviation, budget exceeded) | [`logic.py`](file:///c:/Users/saath/Desktop/Coding/spm_system/backend/logic.py): `calculate_evm` | [`CostEvmPage.jsx`](file:///c:/Users/saath/Desktop/Coding/spm_system/frontend/src/pages/CostEvmPage.jsx) & [`DashboardPage.jsx`](file:///c:/Users/saath/Desktop/Coding/spm_system/frontend/src/pages/DashboardPage.jsx) | Top of **Dashboard** and **Cost & EVM** pages |
| **4.4** | EVM Charts (PV vs EV vs AC Bar Chart & Cumulative S-Curve) | [`logic.py`](file:///c:/Users/saath/Desktop/Coding/spm_system/backend/logic.py): `generate_s_curve_data` | [`EvmCharts.jsx`](file:///c:/Users/saath/Desktop/Coding/spm_system/frontend/src/components/EvmCharts.jsx) | **Cost & EVM** $\rightarrow$ Middle visual cards |
| **5.1** | Defect Tracker (title, severity, assignee, activity, status) | [`logic.py`](file:///c:/Users/saath/Desktop/Coding/spm_system/backend/logic.py): `get_defects`, `add_defect`, `update_defect` | [`QualityRisksPage.jsx`](file:///c:/Users/saath/Desktop/Coding/spm_system/frontend/src/pages/QualityRisksPage.jsx) | **Quality & Risks** $\rightarrow$ "Defect Tracker" tab |
| **5.2** | 5-Point Quality Checklist with Inspection Result & Mandatory Fail Notes | [`logic.py`](file:///c:/Users/saath/Desktop/Coding/spm_system/backend/logic.py): `record_quality_inspection`, `get_deliverable_readiness` | [`QualityChecklist.jsx`](file:///c:/Users/saath/Desktop/Coding/spm_system/frontend/src/components/QualityChecklist.jsx) | **Quality & Risks** $\rightarrow$ "Quality Checklists & Readiness" tab $\rightarrow$ Click `Audit` |
| **5.3** | Block "Pass" when deliverable has unresolved Critical defect | [`logic.py`](file:///c:/Users/saath/Desktop/Coding/spm_system/backend/logic.py): `record_quality_inspection` | [`QualityChecklist.jsx`](file:///c:/Users/saath/Desktop/Coding/spm_system/frontend/src/components/QualityChecklist.jsx) | Select REQ-01 or REQ-06 $\rightarrow$ Red alert displayed; trying to Pass displays blocking error |
| **5.4** | 5x5 Risk Prioritization Heatmap & Ranked Risk Register | [`logic.py`](file:///c:/Users/saath/Desktop/Coding/spm_system/backend/logic.py): `get_risks`, `calculate_risk_rating` | [`RiskMatrix.jsx`](file:///c:/Users/saath/Desktop/Coding/spm_system/frontend/src/components/RiskMatrix.jsx) | **Quality & Risks** $\rightarrow$ "5x5 Risk Prioritization Matrix" tab |
| **5.5** | Process Decision Program Chart (PDPC) View | [`logic.py`](file:///c:/Users/saath/Desktop/Coding/spm_system/backend/logic.py): `get_pdpc_view` | [`PdpcView.jsx`](file:///c:/Users/saath/Desktop/Coding/spm_system/frontend/src/components/PdpcView.jsx) | **Quality & Risks** $\rightarrow$ "PDPC Contingency Flow" tab |
| **6.1** | Executive Dashboard (Progress, CPI, SPI, budget status, health Green/Amber/Red) | [`logic.py`](file:///c:/Users/saath/Desktop/Coding/spm_system/backend/logic.py): `get_dashboard_summary` | [`DashboardPage.jsx`](file:///c:/Users/saath/Desktop/Coding/spm_system/frontend/src/pages/DashboardPage.jsx) | **Dashboard** (`/`) |
| **6.2** | Automated Database Integrity Check Page | [`logic.py`](file:///c:/Users/saath/Desktop/Coding/spm_system/backend/logic.py): `run_integrity_audit` | [`IntegrityReportPage.jsx`](file:///c:/Users/saath/Desktop/Coding/spm_system/frontend/src/pages/IntegrityReportPage.jsx) | **Integrity & Reports** $\rightarrow$ "Automated Consistency Rules Audit" |
| **6.3** | Downloadable Status Report (JSON & Printable PDF/HTML) | [`logic.py`](file:///c:/Users/saath/Desktop/Coding/spm_system/backend/logic.py): `generate_status_report` | [`IntegrityReportPage.jsx`](file:///c:/Users/saath/Desktop/Coding/spm_system/frontend/src/pages/IntegrityReportPage.jsx) | **Integrity & Reports** $\rightarrow$ Click `⬇ Download Report (JSON)` or `🖨️ Print / Save PDF` |

---

## ⏱️ 5-Minute Evaluation Demo Script for Examiner

Follow this script to demonstrate every requirement in 5 minutes:

### 1. Executive Dashboard (1 min)
- Navigate to `http://localhost:5173/`.
- Point out **Health: RED** indicator. Explain that health is automatically evaluated based on CPI (< 0.90), SPI (< 0.90), and 2 active Critical Defects from the case study.
- Note the EVM stats: **BAC: PKR 4,700,000**, **Approved Budget: PKR 5,000,000**, **Contingency Reserve: PKR 300,000**.
- Point out the active warning banners: **Cost Overrun**, **Schedule Deviation**, and **Budget Cap Exceeded (EAC)**.

### 2. Charter & Auto-Fill Management Plan (45 sec)
- Navigate to **Charter & Plan**.
- Show the 5-Hospital Network charter constraints (Budget: PKR 5M, Start: 2026-09-07, Deadline: 2026-12-27).
- Click on **Management Plan** tab $\rightarrow$ click `⚡ Auto-Fill From Live Project Data`.
- Show that Scope, Schedule (critical path activities), Cost (BAC & EAC), and Quality (5-point checklist standards) are populated directly from live database tables.
- Click `🔒 Final Project Closure` in the header $\rightarrow$ Show that closure is **strictly blocked** with an alert detailing incomplete activities, pending CRs, and open critical defects.

### 3. Scope Locking & Change Request Transaction (1 min)
- Navigate to **Scope & WBS**.
- Show the **Hierarchical WBS**: Deliverables roll up costs from Work Packages.
- Click **Requirements Register** tab. Try to approve a Proposed requirement directly $\rightarrow$ Explain that **Scope Locking** bars direct approval outside the Planning phase.
- Click **Change Requests** tab. Find **CR-01** (AI-Based Diagnosis: +PKR 450,000, +2 weeks).
- Click `Decide` $\rightarrow$ Click `✓ Approve & Commit Transaction`.
- Show the **Before vs After Impact Modal**:
  - Approved Budget increased from PKR 5,000,000 $\rightarrow$ **PKR 5,450,000**.
  - Deadline extended from 2026-12-27 $\rightarrow$ **2027-01-10 (+14 days)**.
  - Linked requirement `REQ-07` status updated to `Approved`.
  - New work package automatically created in WBS.

### 4. Interactive Gantt, CPM & Delays (45 sec)
- Navigate to **Schedule & Gantt**.
- Show the dynamic SVG Gantt chart:
  - Baseline bars (dashed outline) vs Forecast bars (solid).
  - Milestone markers (diamonds) and vertical reference lines for **Status Date** and **Project Deadline**.
  - Critical path activities colored in red (slack = 0).
- Click **Delayed Activities & Impact Analysis** tab:
  - Point out **ACT-05** (backend activity delayed 6 days).
  - Show the downstream dependent activities it pushes (`ACT-06` and `ACT-09`) and the net effect on the project deadline.
- Click **Resource Conflicts** tab $\rightarrow$ shows overlapping task assignments.

### 5. Cost EVM & S-Curve (45 sec)
- Navigate to **Cost & EVM**.
- Review the hand-calculated EVM metrics: PV, EV, AC, CPI (0.787), SPI (0.71), EAC (PKR 5.97M).
- Show the Recharts **PV vs EV vs AC bar chart** and cumulative **S-Curve line chart**.
- Change the **Status Date** at the top right to `2026-10-15` and click `Recalculate EVM` $\rightarrow$ watch all indicators and charts update dynamically in real time.

### 6. Quality Checklist, Critical Defect Blocking & PDPC (45 sec)
- Navigate to **Quality & Risks**.
- Under **Quality Checklists**, select `REQ-01` (Appointments) or `REQ-06` (Patient Records).
- Show the prominent red alert: **"QUALITY INSPECTION PASS BLOCKED!"**
- Click `Audit` on an item and attempt to record `Pass` $\rightarrow$ Explain that the system **strictly rejects the pass** because of open critical defect `DEF-01`.
- Go to **Defect Tracker** tab $\rightarrow$ click `Update Status` on `DEF-01` $\rightarrow$ set to `Resolved`.
- Return to **Quality Checklist** $\rightarrow$ the blocking alert clears, and `Pass` can now be recorded!
- Click **5x5 Risk Prioritization Matrix** $\rightarrow$ show the 5x5 heatmap with risks plotted by Likelihood $\times$ Impact.
- Click **PDPC Contingency Flow** tab $\rightarrow$ show the hierarchical tree: **Goal $\rightarrow$ Problem $\rightarrow$ Preventive Action $\rightarrow$ Corrective Action**.

### 7. Integrity Audit & Report Export (15 sec)
- Navigate to **Integrity & Reports**.
- Show that all 7 automated database consistency checks show **✓ PASSED**.
- Click `⬇ Download Report (JSON)` $\rightarrow$ instant download of the complete status report.
- Point out the `↺ Reset Sample Data` button in the navbar to restore the case study state at any point!
