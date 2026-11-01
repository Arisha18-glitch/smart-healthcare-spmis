"""
Sample Data Loader for Smart Healthcare Project Management System
Populates realistic, consistent sample data strictly adhering to the CSE-494 Mid-Term Case Study:
- Start Date: 2026-09-07, Deadline: 2026-12-27 (16 weeks), Budget: PKR 5,000,000
- 7 Team Members: Project Manager, Backend 1, Backend 2, Frontend 1, Frontend 2, Database Developer, QA Engineer
- Requirements R1 to R6 Approved, R7 (AI diagnosis) and R8 (mobile app) Proposed
- Change Requests: CR-001 (450,000, 2 weeks) and CR-002 (350,000, 1 week) Pending
- Activities A01 to A13 with exact costs, durations, and progress
- Progress at Status Date 2026-10-26: A04 delay 6 days, A06 delay 3 days
- Acceptance Values:
  BAC: 4,700,000 | PV: 3,516,667 | EV: 3,017,500 | AC: 3,360,000
  CPI: 0.898 | SPI: 0.858 | EAC: 5,233,471
  Baseline finish: 2026-12-03 | Projected finish: 2026-12-09 | Margin: 18 days
  A04 slip 6 days pushing A09 to A13 | Progress: 64.2% | Health: Red
  After CR approval: Budget 5,800,000 | Deadline 2027-01-17 | +800,000 cost
"""

import os
import sqlite3
from datetime import datetime
from db import get_db, init_db, DB_PATH
import logic

def load_sample_data(db_path: str = None) -> None:
    """Initializes and loads the case study sample dataset."""
    init_db(db_path)
    conn = get_db(db_path)
    cursor = conn.cursor()

    try:
        # Clear existing tables (in proper order for foreign keys)
        cursor.execute("PRAGMA foreign_keys = OFF;")
        tables = [
            "quality_checklist_items", "defects", "milestones", 
            "activity_dependencies", "activities", "change_requests", 
            "requirements", "team_members", "risks", "management_plan", "project_charter"
        ]
        for t in tables:
            cursor.execute(f"DELETE FROM {t}")
        cursor.execute("PRAGMA foreign_keys = ON;")

        # 1. Project Charter
        cursor.execute("""
            INSERT INTO project_charter (
                id, title, objectives, stakeholders, scope_boundaries,
                approved_budget, initial_budget, start_date, deadline, initial_deadline,
                status, cpi_threshold, spi_threshold, status_date
            ) VALUES (
                1,
                'Smart Healthcare Project Management System (5-Hospital Network)',
                'Design, implement, validate, and roll out a centralized, high-availability healthcare project management and clinical workflow system across 5 hospital branches (appointments, lab diagnostics, doctor rota schedules, online consultations, billing, and electronic medical records).',
                'Hospital Network Executive Board, Chief Medical Officers, 5 Hospital Branch Directors, Head of Nursing, Chief Financial Officer, Patient Advocacy Council, Engineering Project Team.',
                'In-Scope: Outpatient appointments, electronic medical records, lab reports, doctor schedules, online consultations, billing. Out-of-Scope: Pharmacy hardware and external insurance underwriting.',
                5000000.0,
                5000000.0,
                '2026-09-07',
                '2026-12-27',
                '2026-12-27',
                'Executing',
                0.90,
                0.90,
                '2026-10-26'
            )
        """)

        # 2. Team Members (7 members as required)
        team = [
            (1, 'Project Manager', 'Project Manager', 'pm@healthcare.network'),
            (2, 'Backend 1', 'Senior Backend Developer', 'backend1@healthcare.network'),
            (3, 'Backend 2', 'Backend Developer', 'backend2@healthcare.network'),
            (4, 'Frontend 1', 'Senior Frontend Developer', 'frontend1@healthcare.network'),
            (5, 'Frontend 2', 'Frontend Developer', 'frontend2@healthcare.network'),
            (6, 'Database Developer', 'Database Developer & DBA', 'dba@healthcare.network'),
            (7, 'QA Engineer', 'Quality Assurance Engineer', 'qa@healthcare.network')
        ]
        cursor.executemany("INSERT INTO team_members (id, name, role, email) VALUES (?, ?, ?, ?)", team)

        # 3. Requirements (R1 to R6 Approved, R7 and R8 Proposed)
        reqs = [
            (1, 'R1', 'Appointments', 'Multi-hospital appointment booking, time-slot reservation, doctor availability matching, and SMS confirmation notifications.', 'High', 'Approved', 'Core Clinical'),
            (2, 'R2', 'Lab reports', 'Digital test requisition, pathology and radiology result upload, automated PDF report generation, and portal download.', 'Medium', 'Approved', 'Diagnostics'),
            (3, 'R3', 'Doctor schedules', 'Doctor shift rostering, on-call duty scheduling, leave cover coordination, and emergency department doctor allocation across 5 hospital units.', 'High', 'Approved', 'Hospital Admin'),
            (4, 'R4', 'Online consultation', 'Secure WebRTC video conferencing for remote doctor-patient consultations, digital prescription pad, and consultation history.', 'High', 'Approved', 'Telehealth'),
            (5, 'R5', 'Billing', 'Automated fee computation, multi-department invoice generation, cash/card payment receipting, and daily hospital ledger balancing.', 'Medium', 'Approved', 'Financials'),
            (6, 'R6', 'Patient records', 'Longitudinal patient health records, diagnostic history, allergies, medication tracking, and role-based HIPAA-compliant access control.', 'High', 'Approved', 'Core Clinical'),
            (7, 'R7', 'AI diagnosis', 'Machine learning preliminary symptom triaging module suggesting differential diagnoses and recommended clinical departments.', 'High', 'Proposed', 'AI & Innovations'),
            (8, 'R8', 'Mobile app', 'Smart Healthcare native companion application for mobile booking, instant lab alerts, and prescription access.', 'Medium', 'Proposed', 'Mobile Platform')
        ]
        cursor.executemany("""
            INSERT INTO requirements (id, req_code, title, description, priority, status, category)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, reqs)

        # 4. Change Requests (CR-001 and CR-002)
        crs = [
            (1, 'CR-001', 'Add AI Diagnosis Module', 
             'Hospital management requested integrating an AI diagnosis module to triage incoming emergency and outpatient cases across the 5 hospital branches before physician assignment.',
             7, 450000.0, 2, 'Pending', None, '2026-10-15', None),
            (2, 'CR-002', 'Develop Mobile App Companion', 
             'Patient feedback and hospital board requested mobile iOS and Android applications to enable push notifications for lab reports and remote queue tracking.',
             8, 350000.0, 1, 'Pending', None, '2026-10-18', None)
        ]
        cursor.executemany("""
            INSERT INTO change_requests (
                id, cr_number, title, justification, linked_requirement_id,
                cost_impact, schedule_impact_weeks, status, decision_note, created_date, decided_date
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, crs)

        # 5. Activities (A01 to A13 strictly matching prompt specifications)
        # Total cost: 350+300+300+450+350+400+400+450+400+250+350+400+300 = 4,700,000
        # Assignees chosen so no person has overlapping activities in baseline
        activities = [
            (1, 'A01', 'Requirements', 1, 10, 350000.0, 1, 100.0, 340000.0, 0),
            (2, 'A02', 'DB design', 6, 10, 300000.0, 6, 100.0, 310000.0, 0),
            (3, 'A03', 'Architecture and UI design', 4, 10, 300000.0, 4, 100.0, 300000.0, 0),
            (4, 'A04', 'Appointment backend', 2, 20, 450000.0, 1, 100.0, 600000.0, 6),
            (5, 'A05', 'Appointment UI', 5, 15, 350000.0, 1, 100.0, 360000.0, 0),
            (6, 'A06', 'Doctor schedule', 3, 15, 400000.0, 3, 100.0, 430000.0, 3),
            (7, 'A07', 'Lab reports', 3, 15, 400000.0, 2, 60.0, 270000.0, 0),
            (8, 'A08', 'Online consultation', 4, 20, 450000.0, 4, 85.0, 470000.0, 0),
            (9, 'A09', 'Billing', 2, 15, 400000.0, 5, 30.0, 150000.0, 0),
            (10, 'A10', 'Patient records', 6, 10, 250000.0, 6, 50.0, 130000.0, 0),
            (11, 'A11', 'Integration', 5, 10, 350000.0, 1, 0.0, 0.0, 0),
            (12, 'A12', 'Testing', 7, 15, 400000.0, 1, 0.0, 0.0, 0),
            (13, 'A13', 'Deployment', 7, 8, 300000.0, 1, 0.0, 0.0, 0)
        ]
        cursor.executemany("""
            INSERT INTO activities (
                id, activity_code, name, assignee_id, duration_days,
                estimated_cost, requirement_id, progress_percent, actual_cost, delay_days
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, activities)

        # 6. Activity Dependencies
        # A01: None
        # A02: A01
        # A03: A01
        # A04: A02
        # A05: A02, A03
        # A06: A02
        # A07: A06
        # A08: A02, A03
        # A09: A04
        # A10: A04, A06
        # A11: A05, A07, A08, A09, A10
        # A12: A11
        # A13: A12
        deps = [
            (2, 1),   # A02 -> A01
            (3, 1),   # A03 -> A01
            (4, 2),   # A04 -> A02
            (5, 2),   # A05 -> A02
            (5, 3),   # A05 -> A03
            (6, 2),   # A06 -> A02
            (7, 6),   # A07 -> A06
            (8, 2),   # A08 -> A02
            (8, 3),   # A08 -> A03
            (9, 4),   # A09 -> A04
            (10, 4),  # A10 -> A04
            (10, 6),  # A10 -> A06
            (11, 5),  # A11 -> A05
            (11, 7),  # A11 -> A07
            (11, 8),  # A11 -> A08
            (11, 9),  # A11 -> A09
            (11, 10), # A11 -> A10
            (12, 11), # A12 -> A11
            (13, 12)  # A13 -> A12
        ]
        cursor.executemany("INSERT INTO activity_dependencies (activity_id, predecessor_id) VALUES (?, ?)", deps)

        # 7. Milestones (6 milestones linked to key deliverables)
        milestones = [
            (1, 'M1: Requirements Specification Baseline', 1, '2026-09-16', 'Project Manager'),
            (2, 'M2: Architecture & DB Design Sign-off', 2, '2026-09-26', 'Database Developer'),
            (3, 'M3: Outpatient Scheduling Engine Pilot', 4, '2026-10-16', 'Backend 1'),
            (4, 'M4: Online Consultation & Telehealth Beta', 8, '2026-10-16', 'Frontend 1'),
            (5, 'M5: Cross-Hospital System Integration', 11, '2026-11-10', 'Frontend 2'),
            (6, 'M6: Final Hospital Network Go-Live', 13, '2026-12-03', 'QA Engineer')
        ]
        cursor.executemany("""
            INSERT INTO milestones (id, name, linked_activity_id, target_date, responsible_person)
            VALUES (?, ?, ?, ?, ?)
        """, milestones)

        # 8. Defects (2 Critical Open, 1 Low Resolved, 1 Medium Open)
        defects = [
            (1, 'DEF-01', 'Race condition in appointment concurrency lock causing double-booking of doctor slots',
             'Critical', 2, 4, 'Open', '2026-10-20', None),
            (2, 'DEF-02', 'Patient electronic record overwritten during simultaneous federated hospital lookups',
             'Critical', 6, 10, 'Open', '2026-10-22', None),
            (3, 'DEF-03', 'Minor padding alignment issue in printable lab diagnostic report PDF header',
             'Low', 5, 7, 'Resolved', '2026-10-18', 'Adjusted PDF print media margin and typography rules.'),
            (4, 'DEF-04', 'Slow query execution on multi-hospital doctor schedule filter dropdown',
             'Medium', 3, 6, 'Open', '2026-10-24', None)
        ]
        cursor.executemany("""
            INSERT INTO defects (
                id, defect_code, title, severity, assigned_to, activity_id, status, reported_date, resolution_notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, defects)

        # 9. Quality Checklists for Deliverables (Checklists for 4 approved deliverables: R1, R2, R3, R6)
        for req_id in [1, 2, 3, 6]:
            logic.init_deliverable_checklist(conn, req_id)

        # Seed realistic inspection results:
        # R3: all passed
        cursor.execute("""
            UPDATE quality_checklist_items 
            SET result = 'Pass', inspector_id = 7, inspection_date = '2026-10-10', notes = 'Verified against hospital physician shift rules.'
            WHERE deliverable_id = 3
        """)
        # R2: 4 passed, 1 pending
        cursor.execute("""
            UPDATE quality_checklist_items 
            SET result = 'Pass', inspector_id = 7, inspection_date = '2026-10-22', notes = 'Diagnostic result upload and HL7 FHIR encryption verified.'
            WHERE deliverable_id = 2 AND id IN (
                SELECT id FROM quality_checklist_items WHERE deliverable_id = 2 LIMIT 4
            )
        """)
        # R1: One Fail recorded with notes (reflecting critical defect on appointments)
        cursor.execute("""
            UPDATE quality_checklist_items 
            SET result = 'Fail', inspector_id = 7, inspection_date = '2026-10-24', 
                notes = 'Concurrency benchmark failed under 50 simultaneous hospital booking requests (DEF-01).'
            WHERE deliverable_id = 1 AND item_text LIKE '%concurrency%'
        """)

        # 10. Risks (6 risks with PDPC actions)
        risks = [
            (1, 'RSK-01', 'Legacy Hospital EHR Interoperability Failure', 
             'Different hospital branches use proprietary legacy schema formats that may cause data loss or corruption during migration.',
             4, 4, 'Open',
             'Achieve zero-data-loss patient history synchronization across all 5 hospitals.',
             'Build HL7 FHIR-compliant schema validation adapters with strict JSON schema sanitization prior to ingest.',
             'Deploy automated fallback translation service with dead-letter queue and immediate manual triage notification.'),
            
            (2, 'RSK-02', 'High Concurrency Traffic Surges During Morning Booking Peak', 
             'Peak morning outpatient booking (8:00 AM - 10:00 AM) may saturate database connection pool and cause timeouts.',
             3, 5, 'Open',
             'Maintain < 500ms transaction response time during peak load of 2,000 concurrent bookings.',
             'Implement Redis distributed locking, connection pooling, and read-replica offloading for available doctor slots.',
             'Activate priority queuing with token-based throttling and graceful degradation to wait-room messaging.'),
            
            (3, 'RSK-03', 'Scope Creep from Departmental Clinical Chiefs', 
             'Hospital departmental heads requesting custom clinical specialty forms without project manager authorization.',
             4, 3, 'Open',
             'Strictly constrain project delivery within 16-week timeline and approved PKR 5,000,000 budget.',
             'Enforce formal Change Control Board (CCB) review requiring financial and schedule impact sign-off prior to code development.',
             'Defer non-standard department variations to Phase 2 roadmap and provide generic configurable notes field in core EMR.'),
            
            (4, 'RSK-04', 'Doctor Resistance to Digital Rota and Telehealth System', 
             'Senior clinicians may resist digital schedule rostering and online video consultation workflows.',
             3, 3, 'Open',
             'Achieve > 80% daily active doctor engagement across all 5 hospital branches within 3 weeks of rollout.',
             'Involve clinical department chiefs in UI prototype evaluations and conduct mandatory 1-on-1 accredited training sessions.',
             'Deploy dedicated on-site hospital engineering champions for rapid assistance during doctor shifts.'),
            
            (5, 'RSK-05', 'Cloud Gateway Latency Spikes in Remote Branch Locations', 
             'Unstable WAN connectivity between suburban hospital clinics and central cloud servers causing lab download delays.',
             2, 4, 'Open',
             'Guarantee 99.9% uptime and high-speed diagnostic report availability across all branch terminals.',
             'Configure edge CDN caching and local offline-capable Progressive Web caching for daily clinic schedules.',
             'Failover to dedicated secondary 4G LTE cellular data tunnel with compressed payload payloads.'),
            
            (6, 'RSK-06', 'Minor UI Display Variations Across Hospital Terminal Monitors', 
             'Hospital terminals have varied aspect ratios (1080p, 720p, legacy monitors) causing occasional table wrapping.',
             2, 2, 'Open',
             'Ensure responsive and readable user interface across all hospital workstation hardware.',
             'Establish unified CSS token design system and automated multi-viewport testing suite in CI pipeline.',
             'Apply custom viewport CSS resets and dynamic responsive typography overrides.')
        ]
        cursor.executemany("""
            INSERT INTO risks (
                id, risk_code, title, description, likelihood, impact, status,
                goal, preventive_action, corrective_action
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, risks)

        # 11. Auto-fill Project Management Plan
        conn.commit()
        logic.auto_fill_management_plan(conn)

        print("Sample data successfully loaded into:", db_path or DB_PATH)

    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()

def dump_sql_sample_data(dump_path: str = None) -> None:
    """Exports SQLite database to a plain SQL dump file."""
    target_dump = dump_path or os.path.join(os.path.dirname(os.path.abspath(__file__)), "sample_data_dump.sql")
    conn = get_db()
    try:
        with open(target_dump, "w", encoding="utf-8") as f:
            for line in conn.iterdump():
                f.write(f"{line}\n")
        print("SQL dump generated at:", target_dump)
    finally:
        conn.close()

if __name__ == "__main__":
    load_sample_data()
    dump_sql_sample_data()
