"""
generate_diagrams.py
Generates clean, high-resolution publication-quality diagrams for the academic project report:
1. Three-Tier System Architecture (fig_arch_3tier.png)
2. 20-Table Relational ERD Diagram (fig_erd_20tables.png)
3. Level-0 Context DFD (fig_dfd_level0.png)
4. Level-1 Detailed Process DFD (fig_dfd_level1.png)
5. Multi-Tier Deployment Topology (fig_deploy_topology.png)
6. Four-Layer Defense-in-Depth Security Architecture (fig_security_layers.png)
"""

import os
import shutil
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as patches

OUTPUT_DIRS = [
    os.path.join(os.path.dirname(__file__), "screenshots"),
    r"c:\Users\saath\Desktop\SPMIS_Report_Screenshots"
]

for d in OUTPUT_DIRS:
    os.makedirs(d, exist_ok=True)

def save_fig(fig, filename):
    for d in OUTPUT_DIRS:
        dest = os.path.join(d, filename)
        fig.savefig(dest, dpi=300, bbox_inches='tight')
    plt.close(fig)
    print(f"Saved: {filename}")

# -----------------------------------------------------------------------------
# 1. THREE-TIER ARCHITECTURE DIAGRAM
# -----------------------------------------------------------------------------
def create_architecture_diagram():
    fig, ax = plt.subplots(figsize=(10, 6.2))
    ax.axis('off')
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)

    # Title
    ax.text(50, 96, "Smart Healthcare SPMIS: Three-Tier Decoupled Architecture",
            fontsize=13, weight='bold', ha='center', va='top', fontname='Times New Roman')

    # Tier 1: Presentation
    t1 = patches.FancyBboxPatch((5, 68), 90, 22, boxstyle="round,pad=1.5",
                                fc='#F0F4F8', ec='#1A365D', lw=2)
    ax.add_patch(t1)
    ax.text(50, 87, "PRESENTATION TIER (Single-Page Application Client)",
            fontsize=11, weight='bold', ha='center', va='center', color='#1A365D', fontname='Times New Roman')
    ax.text(50, 77, "React 18  |  Vite 5  |  React Router 6  |  Lucide Icons  |  Recharts (S-Curve & Gantt)\nResponsive Academic Examination UI, Executive Dashboard, WBS Explorer, Hospital Operations Console",
            fontsize=9.5, ha='center', va='center', color='#2D3748', fontname='Times New Roman')

    # Arrow 1 <-> 2
    ax.annotate('', xy=(50, 61), xytext=(50, 67),
                arrowprops=dict(arrowstyle="<->", lw=2, color="#4A5568"))
    ax.text(52, 64, "Asynchronous RESTful JSON HTTP (Axios / Fetch on Port 8000)",
            fontsize=9, style='italic', va='center', fontname='Times New Roman')

    # Tier 2: Application
    t2 = patches.FancyBboxPatch((5, 36), 90, 24, boxstyle="round,pad=1.5",
                                fc='#EBF8FF', ec='#2B6CB0', lw=2)
    ax.add_patch(t2)
    ax.text(50, 56, "APPLICATION LOGIC TIER (Asynchronous ASGI Server)",
            fontsize=11, weight='bold', ha='center', va='center', color='#2B6CB0', fontname='Times New Roman')
    ax.text(50, 45, "Python 3.12  |  FastAPI 0.115.14  |  Uvicorn 0.38.0  |  Pydantic 2.12.4 Validation\n• Kahn's Algorithm DAG Topological Sort & CPM Forward/Backward Pass Engine\n• Dynamic Earned Value Management (EVM) Calculator  |  Atomic Change Request Transactional Gatekeeper\n• Multi-Hospital Appointment Concurrency Manager  |  Risk Scoring & Defect Tracking Engines",
            fontsize=9, ha='center', va='center', color='#2D3748', fontname='Times New Roman')

    # Arrow 2 <-> 3
    ax.annotate('', xy=(50, 29), xytext=(50, 35),
                arrowprops=dict(arrowstyle="<->", lw=2, color="#4A5568"))
    ax.text(52, 32, "sqlite3 Connection Bus (PRAGMA foreign_keys = ON, journal_mode = WAL)",
            fontsize=9, style='italic', va='center', fontname='Times New Roman')

    # Tier 3: Data Tier
    t3 = patches.FancyBboxPatch((5, 4), 90, 24, boxstyle="round,pad=1.5",
                                fc='#F7FAFC', ec='#4A5568', lw=2)
    ax.add_patch(t3)
    ax.text(50, 24, "DATA PERSISTENCE TIER (ACID Relational RDBMS)",
            fontsize=11, weight='bold', ha='center', va='center', color='#2D3748', fontname='Times New Roman')
    ax.text(50, 13, "SQLite 3.45.3 Database Engine (spm.db)\n• 20 Normalized Relational Tables with Composite Keys & Strict CHECK Constraints\n• Project Management Schemas (Charter, WBS, Schedule, EVM, Quality, Risks, Defects)\n• Healthcare Clinical Domain Schemas (5 Hospitals, Doctors, Appointments, EMR, Billing, Lab, AI Triage)",
            fontsize=9, ha='center', va='center', color='#2D3748', fontname='Times New Roman')

    save_fig(fig, "fig_arch_3tier.png")

# -----------------------------------------------------------------------------
# 2. 20-TABLE RELATIONAL ERD DIAGRAM
# -----------------------------------------------------------------------------
def create_erd_diagram():
    fig, ax = plt.subplots(figsize=(11, 7.5))
    ax.axis('off')
    ax.set_xlim(0, 110)
    ax.set_ylim(0, 100)

    ax.text(55, 98, "Smart Healthcare SPMIS: 20-Table Relational Entity Relationship Diagram",
            fontsize=13, weight='bold', ha='center', va='top', fontname='Times New Roman')

    # Sub-domain 1: PM Governance (Left)
    pm_gov = patches.FancyBboxPatch((4, 66), 48, 28, boxstyle="round,pad=0.8", fc='#EDF2F7', ec='#4A5568', lw=1.5)
    ax.add_patch(pm_gov)
    ax.text(28, 91, "1. PM GOVERNANCE & SCOPE ENTITIES", fontsize=9.5, weight='bold', color='#2B6CB0', fontname='Times New Roman')
    ax.text(28, 77, "• project_charter (PK: id [CHECK id=1])\n• management_plan (PK: id [CHECK id=1])\n• team_members (PK: id)\n• requirements (PK: id, FK: parent_id)\n• change_requests (PK: id, FK: approved_by)",
            fontsize=8.5, fontname='Times New Roman', color='#1A202C')

    # Sub-domain 2: PM Schedule (Left Bottom)
    pm_sch = patches.FancyBboxPatch((4, 34), 48, 29, boxstyle="round,pad=0.8", fc='#EDF2F7', ec='#4A5568', lw=1.5)
    ax.add_patch(pm_sch)
    ax.text(28, 59, "2. PM SCHEDULE & QUALITY ENTITIES", fontsize=9.5, weight='bold', color='#2B6CB0', fontname='Times New Roman')
    ax.text(28, 45, "• activities (PK: id, FK: assigned_to, req_id)\n• activity_dependencies (PK: act_id, pred_id)\n• milestones (PK: id, FK: activity_id)\n• defects (PK: id, FK: act_id, reported_by)\n• quality_checklist_items (PK: id, FK: req_id)\n• risks (PK: id, FK: activity_id, owner_id)",
            fontsize=8.5, fontname='Times New Roman', color='#1A202C')

    # Sub-domain 3: Clinical Hospital Operations (Right Top)
    hosp_core = patches.FancyBboxPatch((58, 54), 48, 40, boxstyle="round,pad=0.8", fc='#FEFCBF', ec='#B7791F', lw=1.5)
    ax.add_patch(hosp_core)
    ax.text(82, 91, "3. HEALTHCARE CLINICAL CORE ENTITIES", fontsize=9.5, weight='bold', color='#B7791F', fontname='Times New Roman')
    ax.text(82, 73, "• hospitals (PK: id) [5 Lahore Hospitals]\n• doctors (PK: id, FK: hospital_id)\n• doctor_shifts (PK: id, FK: doctor_id)\n• appointments (PK: id, FK: hosp_id, doc_id)\n• billing_invoices (PK: id, FK: appt_id)\n• patient_emr (PK: id, FK: hospital_id)\n• lab_reports (PK: id, FK: hosp_id, doc_id)\n• online_consultations (PK: id, FK: appt_id)\n• ai_diagnosis_logs (PK: id, FK: appt_id)",
            fontsize=8.5, fontname='Times New Roman', color='#1A202C')

    # Integration Box (Bottom)
    bridge_box = patches.FancyBboxPatch((4, 4), 102, 26, boxstyle="round,pad=0.8", fc='#EBF8FF', ec='#3182CE', lw=1.5)
    ax.add_patch(bridge_box)
    ax.text(55, 26, "RELATIONAL INTEGRATION & REFERENTIAL INTEGRITY CONSTRAINTS",
            fontsize=10, weight='bold', ha='center', color='#2B6CB0', fontname='Times New Roman')
    ax.text(55, 14, "• Composite Key on activity_dependencies: PRIMARY KEY (activity_id, predecessor_id) with CHECK (activity_id != predecessor_id)\n• 1-to-Many Relationships: hospitals -> doctors -> shifts -> appointments -> invoices / lab_reports / EMR\n• Scope & Schedule Traceability: requirements -> activities -> dependencies -> milestones & defects\n• ON DELETE CASCADE & ON UPDATE CASCADE enforced via PRAGMA foreign_keys = ON across all 20 tables",
            fontsize=8.5, ha='center', color='#2D3748', fontname='Times New Roman')

    # Connecting arrows
    ax.annotate('', xy=(58, 75), xytext=(52, 75),
                arrowprops=dict(arrowstyle="<->", lw=1.5, color="#4A5568"))
    ax.text(55, 77, "Trace", fontsize=7.5, ha='center', fontname='Times New Roman')

    save_fig(fig, "fig_erd_20tables.png")

# -----------------------------------------------------------------------------
# 3. LEVEL-0 CONTEXT DFD
# -----------------------------------------------------------------------------
def create_dfd_level0():
    fig, ax = plt.subplots(figsize=(10, 6.2))
    ax.axis('off')
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)

    ax.text(50, 96, "Smart Healthcare SPMIS: Level-0 Context Data Flow Diagram",
            fontsize=13, weight='bold', ha='center', va='top', fontname='Times New Roman')

    # Central System Bubble
    sys_bubble = patches.Circle((50, 48), 16, fc='#EBF8FF', ec='#2B6CB0', lw=2.5)
    ax.add_patch(sys_bubble)
    ax.text(50, 51, "0.0\nSMART HEALTHCARE\nSPMIS CORE",
            fontsize=10.5, weight='bold', ha='center', va='center', color='#1A365D', fontname='Times New Roman')
    ax.text(50, 39, "(Central PM & Hospital Engine)",
            fontsize=7.5, style='italic', ha='center', va='center', color='#4A5568', fontname='Times New Roman')

    # External Entities (Rectangles)
    # 1. Project Manager (Top Left)
    pm = patches.Rectangle((6, 70), 22, 14, fc='#EDF2F7', ec='#2D3748', lw=1.5)
    ax.add_patch(pm)
    ax.text(17, 77, "Project Manager\n(Syeda Arisha)", fontsize=9, weight='bold', ha='center', va='center', fontname='Times New Roman')

    # 2. CCB / Executive Sponsor (Top Right)
    ccb = patches.Rectangle((72, 70), 22, 14, fc='#EDF2F7', ec='#2D3748', lw=1.5)
    ax.add_patch(ccb)
    ax.text(83, 77, "Change Control Board\n(CCB / Sponsor)", fontsize=9, weight='bold', ha='center', va='center', fontname='Times New Roman')

    # 3. Engineering Team (Bottom Left)
    eng = patches.Rectangle((6, 12), 22, 14, fc='#EDF2F7', ec='#2D3748', lw=1.5)
    ax.add_patch(eng)
    ax.text(17, 19, "Software Team\n(Devs & QA)", fontsize=9, weight='bold', ha='center', va='center', fontname='Times New Roman')

    # 4. Hospital Staff & Patients (Bottom Right)
    hosp = patches.Rectangle((72, 12), 22, 14, fc='#EDF2F7', ec='#2D3748', lw=1.5)
    ax.add_patch(hosp)
    ax.text(83, 19, "Hospital Stakeholders\n(Doctors, Staff, Patients)", fontsize=9, weight='bold', ha='center', va='center', fontname='Times New Roman')

    # Arrows & Data Flows
    # PM <-> System
    ax.annotate('', xy=(37, 56), xytext=(28, 70), arrowprops=dict(arrowstyle="->", lw=1.5, color="#2B6CB0"))
    ax.text(26, 63, "Charter, WBS, Baseline", fontsize=7.5, fontname='Times New Roman')
    ax.annotate('', xy=(28, 73), xytext=(38, 59), arrowprops=dict(arrowstyle="->", lw=1.5, color="#4A5568"))
    ax.text(35, 68, "EVM, Health, S-Curve", fontsize=7.5, fontname='Times New Roman')

    # CCB <-> System
    ax.annotate('', xy=(63, 56), xytext=(72, 70), arrowprops=dict(arrowstyle="->", lw=1.5, color="#2B6CB0"))
    ax.text(67, 65, "CR Approval", fontsize=7.5, fontname='Times New Roman')
    ax.annotate('', xy=(72, 74), xytext=(62, 59), arrowprops=dict(arrowstyle="->", lw=1.5, color="#4A5568"))
    ax.text(54, 73, "Impact Analysis", fontsize=7.5, fontname='Times New Roman')

    # Team <-> System
    ax.annotate('', xy=(37, 42), xytext=(28, 26), arrowprops=dict(arrowstyle="->", lw=1.5, color="#2B6CB0"))
    ax.text(16, 36, "Progress %, Defects, Actual Cost", fontsize=7.5, fontname='Times New Roman')
    ax.annotate('', xy=(28, 23), xytext=(38, 39), arrowprops=dict(arrowstyle="->", lw=1.5, color="#4A5568"))
    ax.text(33, 31, "Task Schedule, Slack", fontsize=7.5, fontname='Times New Roman')

    # Hosp <-> System
    ax.annotate('', xy=(63, 42), xytext=(72, 26), arrowprops=dict(arrowstyle="->", lw=1.5, color="#2B6CB0"))
    ax.text(70, 36, "Bookings, Shift Updates, EMR", fontsize=7.5, fontname='Times New Roman')
    ax.annotate('', xy=(72, 23), xytext=(62, 39), arrowprops=dict(arrowstyle="->", lw=1.5, color="#4A5568"))
    ax.text(62, 31, "Console KPI, Billing", fontsize=7.5, fontname='Times New Roman')

    save_fig(fig, "fig_dfd_level0.png")

# -----------------------------------------------------------------------------
# 4. LEVEL-1 DETAILED DFD
# -----------------------------------------------------------------------------
def create_dfd_level1():
    fig, ax = plt.subplots(figsize=(10.5, 6.5))
    ax.axis('off')
    ax.set_xlim(0, 105)
    ax.set_ylim(0, 100)

    ax.text(52.5, 98, "Smart Healthcare SPMIS: Level-1 Detailed Process Data Flow Diagram",
            fontsize=13, weight='bold', ha='center', va='top', fontname='Times New Roman')

    # Six Processes (P1 - P6)
    procs = [
        ("P1.0", "Initiation &\nCharter Gate", 14, 76),
        ("P2.0", "Scope & WBS\nManagement", 52.5, 76),
        ("P3.0", "CPM Schedule &\nFloat Engine", 90, 76),
        ("P4.0", "Earned Value\n(EVM) Calculator", 14, 28),
        ("P5.0", "Quality & Risk\nGating System", 52.5, 28),
        ("P6.0", "Hospital Clinical\nOperations", 90, 28),
    ]

    for code, title, x, y in procs:
        circ = patches.Circle((x, y), 11, fc='#EBF8FF', ec='#2B6CB0', lw=2)
        ax.add_patch(circ)
        ax.text(x, y + 2, code, fontsize=8.5, weight='bold', ha='center', va='center', color='#1A365D', fontname='Times New Roman')
        ax.text(x, y - 4, title, fontsize=8, ha='center', va='center', color='#2D3748', fontname='Times New Roman')

    # Data Stores (Open-ended rectangles)
    # D1: PM Database (Center)
    d1 = patches.Rectangle((35, 48), 35, 9, fc='#F7FAFC', ec='#4A5568', lw=1.5)
    ax.add_patch(d1)
    ax.text(52.5, 52.5, "D1: SPM Relational Database (spm.db)\n[20 Normalized Relational Tables]",
            fontsize=8.5, weight='bold', ha='center', va='center', fontname='Times New Roman', color='#2D3748')

    # Process connections to D1
    # P1 -> D1
    ax.annotate('', xy=(38, 57), xytext=(25, 72), arrowprops=dict(arrowstyle="->", lw=1.2, color="#4A5568"))
    # P2 -> D1
    ax.annotate('', xy=(52.5, 57), xytext=(52.5, 65), arrowprops=dict(arrowstyle="->", lw=1.2, color="#4A5568"))
    # P3 -> D1
    ax.annotate('', xy=(67, 57), xytext=(80, 72), arrowprops=dict(arrowstyle="->", lw=1.2, color="#4A5568"))
    # D1 -> P4
    ax.annotate('', xy=(24, 34), xytext=(36, 48), arrowprops=dict(arrowstyle="->", lw=1.2, color="#4A5568"))
    # D1 -> P5
    ax.annotate('', xy=(52.5, 39), xytext=(52.5, 48), arrowprops=dict(arrowstyle="->", lw=1.2, color="#4A5568"))
    # D1 -> P6
    ax.annotate('', xy=(81, 34), xytext=(69, 48), arrowprops=dict(arrowstyle="->", lw=1.2, color="#4A5568"))

    # Labels
    ax.text(26, 60, "Charter Data", fontsize=7.5, fontname='Times New Roman')
    ax.text(53.5, 61, "Reqs, WBS, CRs", fontsize=7.5, fontname='Times New Roman')
    ax.text(76, 60, "CPM Schedule", fontsize=7.5, fontname='Times New Roman')
    ax.text(26, 44, "Costs, % Done", fontsize=7.5, fontname='Times New Roman')
    ax.text(53.5, 43.5, "Defects, Gates", fontsize=7.5, fontname='Times New Roman')
    ax.text(77, 44, "Clinics, Booking", fontsize=7.5, fontname='Times New Roman')

    save_fig(fig, "fig_dfd_level1.png")

# -----------------------------------------------------------------------------
# 5. MULTI-TIER DEPLOYMENT TOPOLOGY DIAGRAM
# -----------------------------------------------------------------------------
def create_deployment_diagram():
    fig, ax = plt.subplots(figsize=(10.5, 6.2))
    ax.axis('off')
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)

    ax.text(50, 96, "Smart Healthcare SPMIS: Multi-Tier Deployment Architecture",
            fontsize=13, weight='bold', ha='center', va='top', fontname='Times New Roman')

    # Tier 1: Local Dev
    t1 = patches.FancyBboxPatch((4, 15), 28, 72, boxstyle="round,pad=1", fc='#EDF2F7', ec='#4A5568', lw=1.5)
    ax.add_patch(t1)
    ax.text(18, 83, "TIER 1: LOCAL DEV\n(Developer Workstation)", fontsize=9.5, weight='bold', ha='center', color='#1A202C', fontname='Times New Roman')
    ax.text(18, 50, "• Windows 11 / Linux Host\n• Python 3.12 (.venv)\n• Node.js v22.12 / Vite 5\n• SQLite 3.45.3 File (spm.db)\n• FastAPI ASGI Dev Server\n  (127.0.0.1:8000)\n• Vite React SPA Hot-Reload\n  (localhost:5173)\n• Full Pytest & Adversarial\n  Test Suite Execution",
            fontsize=8.5, ha='center', fontname='Times New Roman', color='#2D3748')

    # Tier 2: Staging LAN
    t2 = patches.FancyBboxPatch((36, 15), 28, 72, boxstyle="round,pad=1", fc='#EBF8FF', ec='#2B6CB0', lw=1.5)
    ax.add_patch(t2)
    ax.text(50, 83, "TIER 2: STAGING LAN\n(Central Hospital Server)", fontsize=9.5, weight='bold', ha='center', color='#2B6CB0', fontname='Times New Roman')
    ax.text(50, 50, "• Ubuntu 22.04 LTS Dedicated\n• Systemd Daemonized Service\n• Static Production React Build\n  served via Nginx HTTP\n• Single Shared SQLite DB\n  with WAL Checkpointing\n• Accessible via Hospital Intranet\n  (192.168.10.50)\n• Internal Staff Pilot Testing\n  and User Acceptance (UAT)",
            fontsize=8.5, ha='center', fontname='Times New Roman', color='#2D3748')

    # Tier 3: Production Cloud
    t3 = patches.FancyBboxPatch((68, 15), 28, 72, boxstyle="round,pad=1", fc='#F0FFF4', ec='#276749', lw=1.5)
    ax.add_patch(t3)
    ax.text(82, 83, "TIER 3: PRODUCTION\n(Cloud VPS / Reverse Proxy)", fontsize=9.5, weight='bold', ha='center', color='#276749', fontname='Times New Roman')
    ax.text(82, 50, "• Linux Cloud VPS (4 Core / 8GB)\n• Nginx Reverse Proxy with\n  Let's Encrypt SSL/TLS (HTTPS)\n• Multi-Worker Gunicorn+Uvicorn\n• Read-Replicas / WAL Backup\n  Cron Jobs to Off-Site Storage\n• Connected 5 Teaching Hospitals:\n  Services, Mayo, Jinnah,\n  General, Ganga Ram\n• Zero-Install Browser Client",
            fontsize=8.5, ha='center', fontname='Times New Roman', color='#2D3748')

    # Connectors
    ax.annotate('', xy=(36, 50), xytext=(32, 50), arrowprops=dict(arrowstyle="->", lw=1.8, color="#2B6CB0"))
    ax.text(34, 52, "Git Push", fontsize=7.5, ha='center', fontname='Times New Roman')

    ax.annotate('', xy=(68, 50), xytext=(64, 50), arrowprops=dict(arrowstyle="->", lw=1.8, color="#276749"))
    ax.text(66, 52, "CI/CD Deploy", fontsize=7.5, ha='center', fontname='Times New Roman')

    save_fig(fig, "fig_deploy_topology.png")

# -----------------------------------------------------------------------------
# 6. FOUR-LAYER SECURITY ARCHITECTURE DIAGRAM
# -----------------------------------------------------------------------------
def create_security_diagram():
    fig, ax = plt.subplots(figsize=(10, 6.2))
    ax.axis('off')
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)

    ax.text(50, 96, "Smart Healthcare SPMIS: Four-Layer Defense-in-Depth Security Model",
            fontsize=13, weight='bold', ha='center', va='top', fontname='Times New Roman')

    # 4 Layers (Concentric / Stacked)
    layers = [
        ("Layer 4: Network & API Gateway Defense",
         "CORS Middleware (Whitelisted Origins)  |  Standardized JSON Error Formatter  |  Strict HTTP Status Code Mappings\nPrevents Internal Stack-Trace Leakage & Unauthorized Cross-Origin Exploitation",
         80, '#FED7D7', '#9B2C2C'),
        ("Layer 3: Project Management Governance & Business Rules",
         "Scope Lock Enforcer  |  Atomic ACID Change Request Transaction Gatekeeper  |  Budget Cap Validation\nCircular Dependency Cycle Blocker (Kahn's DAG)  |  Inspection Gate Closure Blocker",
         58, '#FEEBC8', '#C05621'),
        ("Layer 2: Pydantic Schema Validation & Type Enforcement",
         "Strict BaseModel Subclasses  |  Regex Field Formatting  |  Range Validations (Progress 0-100%, Budget > 0)\nPayload Sanitization  |  Automatic 422 Unprocessable Entity Rejection on Malformed Types",
         36, '#FEFCBF', '#D69E2E'),
        ("Layer 1: Relational Database Integrity & Constraint Defense",
         "PRAGMA foreign_keys = ON  |  Parameterized SQL Queries (? placeholders prevent SQL Injection)\nTable-Level CHECK Constraints  |  Composite PRIMARY KEYs  |  FOREIGN KEY Integrity with CASCADE",
         14, '#C6F6D5', '#276749'),
    ]

    for title, desc, y, bg, border in layers:
        box = patches.FancyBboxPatch((8, y - 8), 84, 18, boxstyle="round,pad=1", fc=bg, ec=border, lw=2)
        ax.add_patch(box)
        ax.text(50, y + 5.5, title, fontsize=10.5, weight='bold', ha='center', va='center', color=border, fontname='Times New Roman')
        ax.text(50, y - 2, desc, fontsize=8.5, ha='center', va='center', color='#1A202C', fontname='Times New Roman')

        if y > 14:
            ax.annotate('', xy=(50, y - 8.5), xytext=(50, y - 5.5),
                        arrowprops=dict(arrowstyle="->", lw=1.5, color="#4A5568"))

    save_fig(fig, "fig_security_layers.png")

if __name__ == "__main__":
    print("Generating Academic Report Diagrams...")
    create_architecture_diagram()
    create_erd_diagram()
    create_dfd_level0()
    create_dfd_level1()
    create_deployment_diagram()
    create_security_diagram()
    print("All 6 diagrams generated successfully!")

