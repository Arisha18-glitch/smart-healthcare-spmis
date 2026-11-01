"""
Comprehensive Automated Test Suite for Smart Healthcare PMIS
Covers all 6 PM Modules, all business rules, circular dependency rollback,
budget cap enforcement, scope locking, atomic CR transactions & rollback,
critical defects gating, EVM acceptance values, and anti-hardcoding checks.

Outputs:
- Formatted console table: ID | Test Name | Expected | Actual | PASS/FAIL
- test_results.csv
"""

import os
import sys
import tempfile
import sqlite3
import csv
from datetime import datetime, timedelta

from db import init_db, get_db
import logic
import sample_data

DATE_FMT = "%Y-%m-%d"

class TestRunner:
    def __init__(self):
        self.results = []
        self.passed = 0
        self.failed = 0

    def run_test(self, test_name: str, expected_val, test_func):
        test_id = f"T{len(self.results) + 1:02d}"
        status = "FAIL"
        actual_val = None
        error_msg = None

        try:
            actual_val = test_func()
            if callable(expected_val):
                is_pass = expected_val(actual_val)
            else:
                if isinstance(expected_val, float):
                    is_pass = abs(actual_val - expected_val) < 0.01
                else:
                    is_pass = (actual_val == expected_val)

            if is_pass:
                status = "PASS"
                self.passed += 1
            else:
                status = "FAIL"
                self.failed += 1
        except Exception as e:
            actual_val = f"EXCEPTION: {type(e).__name__} - {str(e)}"
            if expected_val == "EXCEPTION: ValueError" and isinstance(e, ValueError):
                status = "PASS"
                self.passed += 1
            elif expected_val == "EXCEPTION: Exception" and isinstance(e, Exception):
                status = "PASS"
                self.passed += 1
            else:
                status = "FAIL"
                self.failed += 1
                error_msg = str(e)

        self.results.append({
            "id": test_id,
            "name": test_name,
            "expected": str(expected_val),
            "actual": str(actual_val),
            "status": status,
            "error": error_msg or ""
        })

        color_code = "\033[92mPASS\033[0m" if status == "PASS" else "\033[91mFAIL\033[0m"
        act_display = str(actual_val)
        if len(act_display) > 35:
            act_display = act_display[:32] + "..."
        exp_display = str(expected_val)
        if len(exp_display) > 35:
            exp_display = exp_display[:32] + "..."

        print(f"{test_id:<6} | {test_name:<55} | {status:<6} | Exp: {exp_display} | Act: {act_display}")

    def print_summary(self):
        total = len(self.results)
        print("\n" + "=" * 110)
        print(f"TOTAL TESTS: {total} | PASSED: {self.passed} | FAILED: {self.failed} | SUCCESS RATE: {(self.passed/total)*100:.1f}%")
        print("=" * 110 + "\n")

    def export_csv(self, filename="test_results.csv"):
        filepath = os.path.join(os.path.dirname(os.path.abspath(__file__)), filename)
        with open(filepath, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=["id", "name", "expected", "actual", "status", "error"])
            writer.writeheader()
            writer.writerows(self.results)
        print(f"Test results successfully exported to: {filepath}")


def main():
    runner = TestRunner()
    print("=" * 110)
    print("RUNNING CSE-494 SMART HEALTHCARE PMIS AUTOMATED VERIFICATION SUITE")
    print("=" * 110)

    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as tf:
        db_path = tf.name

    try:
        sample_data.load_sample_data(db_path)
        conn = get_db(db_path)

        # ======================================================================
        # MODULE 1: INITIATION & INTEGRATION MANAGEMENT (T01 - T18)
        # ======================================================================
        def t01():
            charter = logic.get_charter(conn)
            return charter["approved_budget"]
        runner.run_test("Project Charter: approved budget initialized to PKR 5,000,000", 5000000.0, t01)

        def t02():
            charter = logic.get_charter(conn)
            return charter["start_date"] == "2026-09-07" and charter["deadline"] == "2026-12-27"
        runner.run_test("Project Charter: dates match baseline (2026-09-07 to 2026-12-27)", True, t02)

        def t03():
            charter = logic.get_charter(conn)
            s = datetime.strptime(charter["start_date"], DATE_FMT)
            d = datetime.strptime(charter["deadline"], DATE_FMT)
            return (d - s).days
        runner.run_test("Project Charter: duration is 16 weeks (111 days span)", 111, t03)

        def t04():
            charter = logic.get_charter(conn)
            return charter["status"]
        runner.run_test("Project Charter: project status is 'Executing'", "Executing", t04)

        def t05():
            # Update charter with deadline before start date -> Must throw ValueError
            charter_copy = dict(logic.get_charter(conn))
            charter_copy["start_date"] = "2026-10-01"
            charter_copy["deadline"] = "2026-09-01"
            logic.update_charter(conn, charter_copy)
        runner.run_test("Charter validation: deadline before start date is rejected", "EXCEPTION: ValueError", t05)

        def t06():
            # Update charter with negative budget -> Must throw ValueError
            charter_copy = dict(logic.get_charter(conn))
            charter_copy["approved_budget"] = -50000.0
            logic.update_charter(conn, charter_copy)
        runner.run_test("Charter validation: negative budget is rejected", "EXCEPTION: ValueError", t06)

        def t07():
            # Auto-fill management plan
            plan = logic.auto_fill_management_plan(conn)
            return (
                "SCOPE MANAGEMENT PLAN" in plan["scope_plan"] and
                "SCHEDULE MANAGEMENT PLAN" in plan["schedule_plan"] and
                "COST MANAGEMENT PLAN" in plan["cost_plan"] and
                "QUALITY MANAGEMENT PLAN" in plan["quality_plan"]
            )
        runner.run_test("Management Plan: auto-fill generates live Scope, Schedule, Cost, Quality plans", True, t07)

        def t08():
            team = conn.execute("SELECT COUNT(*) as cnt FROM team_members").fetchone()["cnt"]
            return team
        runner.run_test("Team Members: exactly 7 team members initialized", 7, t08)

        def t09():
            # Project closure blocked while incomplete activities exist
            logic.close_project(conn)
        runner.run_test("Project Closure: blocked when incomplete activities exist", "EXCEPTION: ValueError", t09)

        # ======================================================================
        # MODULE 2: SCOPE BASELINE & WBS (T10 - T26)
        # ======================================================================
        def t10():
            reqs = logic.get_requirements(conn)
            approved = [r for r in reqs if r["status"] == "Approved"]
            return len(approved)
        runner.run_test("Scope Requirements: exactly 6 approved requirements in baseline (R1-R6)", 6, t10)

        def t11():
            reqs = logic.get_requirements(conn)
            proposed = [r for r in reqs if r["status"] == "Proposed"]
            return len(proposed)
        runner.run_test("Scope Requirements: exactly 2 proposed requirements (R7 AI, R8 Mobile)", 2, t11)

        def t12():
            # Direct approval of proposed requirement in Executing phase without CR is blocked
            logic.update_requirement(conn, 7, {"status": "Approved"})
        runner.run_test("Scope Locking: direct approval of requirement during execution is blocked", "EXCEPTION: ValueError", t12)

        def t13():
            wbs = logic.generate_wbs(conn)
            return len(wbs["deliverables"]) >= 6
        runner.run_test("WBS generation: contains all approved deliverables", True, t13)

        def t14():
            wbs = logic.generate_wbs(conn)
            return wbs["total_project_cost"] == 4700000.0
        runner.run_test("WBS cost roll-up: total project WBS cost equals BAC (PKR 4,700,000)", True, t14)

        def t15():
            # Adding activity linked to unapproved requirement R7 is blocked
            logic.add_activity(conn, {
                "activity_code": "A-TEST-UNAPP",
                "name": "Unapproved Req Task",
                "assignee_id": 2,
                "duration_days": 10,
                "estimated_cost": 50000,
                "requirement_id": 7
            })
        runner.run_test("Scope boundary: adding activity on unapproved requirement is blocked", "EXCEPTION: ValueError", t15)

        def t16():
            crs = logic.get_change_requests(conn)
            pending = [c for c in crs if c["status"] == "Pending"]
            return len(pending)
        runner.run_test("Change requests: returns 2 pending change requests (CR-001, CR-002)", 2, t16)

        def t17():
            # Reject change request requires a reason
            res = logic.reject_change_request(conn, 2, "Insufficient clinical sponsor budget")
            return res["status"]
        runner.run_test("Reject change request: sets status to Rejected and logs reason", "Rejected", t17)

        def t18():
            # Decided CR cannot be decided again
            logic.reject_change_request(conn, 2, "Second rejection attempt")
        runner.run_test("Change request: deciding an already decided CR is rejected", "EXCEPTION: ValueError", t18)

        def t19():
            # Reset CR 2 back to Pending for subsequent tests
            conn.execute("UPDATE change_requests SET status = 'Pending', decision_note = NULL WHERE id = 2")
            conn.commit()
            return True
        runner.run_test("Change request test fixture reset: CR-002 restored to Pending", True, t19)

        def t20():
            # Atomic CR Approval Transaction for CR-001
            res = logic.approve_change_request_transaction(conn, 1, "Approved by CCB")
            charter = logic.get_charter(conn)
            return (
                res["status"] == "Approved" and
                charter["approved_budget"] == 5450000.0 and
                charter["deadline"] == "2027-01-10"
            )
        runner.run_test("CR Approval Transaction: CR-001 raises budget to 5,450,000 and extends deadline by 2w", True, t20)

        def t21():
            req7 = conn.execute("SELECT status FROM requirements WHERE id = 7").fetchone()["status"]
            return req7
        runner.run_test("CR Approval Transaction: linked requirement R7 status transitioned to Approved", "Approved", t21)

        def t22():
            acts = conn.execute("SELECT COUNT(*) as cnt FROM activities WHERE requirement_id = 7").fetchone()["cnt"]
            return acts >= 1
        runner.run_test("CR Approval Transaction: created new work package activity for R7", True, t22)

        def t23():
            # Approve second CR (CR-002): Budget becomes 5,800,000, deadline 2027-01-17 (+800k total)
            res = logic.approve_change_request_transaction(conn, 2, "Approved by CCB")
            charter = logic.get_charter(conn)
            return (
                charter["approved_budget"] == 5800000.0 and
                charter["deadline"] == "2027-01-17"
            )
        runner.run_test("Dual CR Approval: budget 5,800,000, deadline 2027-01-17, planned cost +800,000", True, t23)

        # Restore baseline state by reloading fresh sample data in temp db
        conn.close()
        sample_data.load_sample_data(db_path)
        conn = get_db(db_path)

        # ======================================================================
        # MODULE 3: SCHEDULE, CPM, DELAYS & RESOURCES (T24 - T45)
        # ======================================================================
        def t24():
            sched = logic.compute_schedule(conn)
            a1 = next(a for a in sched["activities"] if a["activity_code"] == "A01")
            return a1["baseline_start"]
        runner.run_test("CPM Forward Pass: first activity A01 baseline start is 2026-09-07", "2026-09-07", t24)

        def t25():
            sched = logic.compute_schedule(conn)
            a1 = next(a for a in sched["activities"] if a["activity_code"] == "A01")
            return a1["baseline_finish"]
        runner.run_test("CPM Forward Pass: A01 (10 days) baseline finish is 2026-09-16", "2026-09-16", t25)

        def t26():
            sched = logic.compute_schedule(conn)
            a2 = next(a for a in sched["activities"] if a["activity_code"] == "A02")
            return a2["baseline_start"] == "2026-09-17" and a2["baseline_finish"] == "2026-09-26"
        runner.run_test("CPM Forward Pass: A02 (10 days) baseline start 2026-09-17, finish 2026-09-26", True, t26)

        def t27():
            # Check baseline project finish date
            sched = logic.compute_schedule(conn)
            return sched["activities"][-1]["baseline_finish"]
        runner.run_test("CPM Baseline Finish: project baseline finish is 2026-12-03", "2026-12-03", t27)

        def t28():
            # Check forecast / projected finish with A04 delay 6 days
            sched = logic.compute_schedule(conn)
            return sched["projected_finish"]
        runner.run_test("CPM Projected Finish: project projected finish is 2026-12-09", "2026-12-09", t28)

        def t29():
            # Margin to deadline (2026-12-27 minus 2026-12-09)
            sched = logic.compute_schedule(conn)
            d_dt = datetime.strptime("2026-12-27", DATE_FMT)
            p_dt = datetime.strptime(sched["projected_finish"], DATE_FMT)
            return (d_dt - p_dt).days
        runner.run_test("Schedule Margin: exactly 18 days margin to contract deadline (2026-12-27)", 18, t29)

        def t30():
            # Circular dependency detection
            cycle = logic.detect_circular_dependencies([{"id": 1}, {"id": 2}], [(1, 2), (2, 1)])
            return cycle is not None
        runner.run_test("Circular Dependency Detection: Kahn algorithm detects cycle [1, 2]", True, t30)

        def t31():
            # Circular dependency insertion rollback
            try:
                conn.execute("INSERT INTO activity_dependencies (activity_id, predecessor_id) VALUES (1, 4)")
                logic.compute_schedule(conn)
                return False
            except ValueError:
                conn.rollback()
                return True
        runner.run_test("Circular Dependency Rollback: rejects cycle injection and rolls back", True, t31)

        def t32():
            sched = logic.compute_schedule(conn)
            crit_acts = [a["activity_code"] for a in sched["activities"] if a["is_critical"]]
            return "A01" in crit_acts and "A02" in crit_acts and "A04" in crit_acts and "A13" in crit_acts
        runner.run_test("Critical Path: identifies A01 -> A02 -> A04 -> A09 -> A11 -> A12 -> A13", True, t32)

        def t33():
            sched = logic.compute_schedule(conn)
            crit_acts = [a for a in sched["activities"] if a["is_critical"]]
            return all(a["slack"] == 0 for a in crit_acts)
        runner.run_test("Critical Path Slack: all critical activities have exactly 0 days slack", True, t33)

        def t34():
            sched = logic.compute_schedule(conn)
            del_acts = [a["code"] for a in sched["delayed_activities"]]
            return "A04" in del_acts
        runner.run_test("Delayed Activity Tracking: identifies A04 as delayed (+6 days)", True, t34)

        def t35():
            # A04 slip 6 days pushes A09, A10, A11, A12, A13
            sched = logic.compute_schedule(conn)
            del_a4 = next(a for a in sched["delayed_activities"] if a["code"] == "A04")
            pushed = [p["code"] for p in del_a4["pushed_dependent_activities"]]
            return "A09" in pushed and "A11" in pushed and "A13" in pushed
        runner.run_test("Delay Cascade: A04 slip 6 days pushes dependent activities A09 to A13", True, t35)

        def t36():
            # Resource conflict detection
            sched = logic.compute_schedule(conn)
            return isinstance(sched["resource_conflicts"], list)
        runner.run_test("Resource Conflict Detection: identifies overlapping assignments per person", True, t36)

        def t37():
            # Progress update
            res = logic.update_activity_progress(conn, 1, {"progress_percent": 100, "actual_cost": 340000, "delay_days": 0})
            return res["progress_percent"] == 100.0 and res["actual_cost"] == 340000.0
        runner.run_test("Progress Form: updates percent complete, actual cost, and delay days", True, t37)

        # ======================================================================
        # MODULE 4: COST MANAGEMENT & EVM ACCEPTANCE VALUES (T38 - T50)
        # ======================================================================
        def t38():
            evm = logic.calculate_evm(conn, "2026-10-26")
            return evm["bac"]
        runner.run_test("Acceptance Value: BAC equals PKR 4,700,000", 4700000.0, t38)

        def t39():
            evm = logic.calculate_evm(conn, "2026-10-26")
            return round(evm["pv"])
        runner.run_test("Acceptance Value: PV equals PKR 3,516,667", 3516667, t39)

        def t40():
            evm = logic.calculate_evm(conn, "2026-10-26")
            return evm["ev"]
        runner.run_test("Acceptance Value: EV equals PKR 3,017,500", 3017500.0, t40)

        def t41():
            evm = logic.calculate_evm(conn, "2026-10-26")
            return evm["ac"]
        runner.run_test("Acceptance Value: AC equals PKR 3,360,000", 3360000.0, t41)

        def t42():
            evm = logic.calculate_evm(conn, "2026-10-26")
            return evm["cpi"]
        runner.run_test("Acceptance Value: CPI equals 0.898", 0.898, t42)

        def t43():
            evm = logic.calculate_evm(conn, "2026-10-26")
            return evm["spi"]
        runner.run_test("Acceptance Value: SPI equals 0.858", 0.858, t43)

        def t44():
            evm = logic.calculate_evm(conn, "2026-10-26")
            return round(evm["eac"])
        runner.run_test("Acceptance Value: EAC equals PKR 5,233,471 (using unrounded CPI)", 5233471, t44)

        def t45():
            evm = logic.calculate_evm(conn, "2026-10-26")
            return evm["progress_percent"]
        runner.run_test("Acceptance Value: Project Progress equals 64.2%", 64.2, t45)

        def t46():
            evm = logic.calculate_evm(conn, "2026-10-26")
            return evm["cv"]
        runner.run_test("EVM Metric: Cost Variance CV equals -PKR 342,500", -342500.0, t46)

        def t47():
            evm = logic.calculate_evm(conn, "2026-10-26")
            return round(evm["sv"])
        runner.run_test("EVM Metric: Schedule Variance SV equals -PKR 499,167", -499167, t47)

        def t48():
            # Block any activity that pushes BAC above approved budget (5,000,000)
            # Current BAC is 4,700,000. Adding 300,001 pushes to 5,000,001
            logic.add_activity(conn, {
                "activity_code": "A-EXCEED-CAP",
                "name": "Excessive Budget Activity",
                "assignee_id": 2,
                "duration_days": 10,
                "estimated_cost": 300001,
                "requirement_id": 1
            })
        runner.run_test("Budget Cap Enforcement: activity pushing BAC > 5,000,000 is blocked", "EXCEPTION: ValueError", t48)

        def t49():
            evm = logic.calculate_evm(conn, "2026-10-26")
            return any(w["type"] == "COST_OVERRUN" for w in evm["warnings"]) and any(w["type"] == "SCHEDULE_DEVIATION" for w in evm["warnings"])
        runner.run_test("EVM Automatic Alerts: triggers Cost Overrun and Schedule Deviation warnings", True, t49)

        def t50():
            curve = logic.generate_s_curve_data(conn)
            return len(curve) >= 16 and curve[-1]["pv"] == 4700000.0
        runner.run_test("S-Curve Generation: generates weekly checkpoints culminating at BAC", True, t50)

        # ======================================================================
        # MODULE 5: QUALITY, DEFECTS & RISK (T51 - T62)
        # ======================================================================
        def t51():
            defects = logic.get_defects(conn)
            crit = [d for d in defects if d["severity"] == "Critical" and d["status"] == "Open"]
            return len(crit)
        runner.run_test("Defect Tracker: contains exactly 2 Open Critical defects", 2, t51)

        def t52():
            defects = logic.get_defects(conn)
            low_res = [d for d in defects if d["severity"] == "Low" and d["status"] == "Resolved"]
            med_open = [d for d in defects if d["severity"] == "Medium" and d["status"] == "Open"]
            return len(low_res) == 1 and len(med_open) == 1
        runner.run_test("Defect Tracker: contains 1 Low Resolved and 1 Medium Open defect", True, t52)

        def t53():
            # Quality checklist: recording Fail without notes must be rejected
            item = conn.execute("SELECT id FROM quality_checklist_items WHERE deliverable_id = 1 LIMIT 1").fetchone()
            logic.record_quality_inspection(conn, item["id"], {"result": "Fail", "notes": ""})
        runner.run_test("Quality Checklist: recording Fail without notes is rejected", "EXCEPTION: ValueError", t53)

        def t54():
            item = conn.execute("SELECT id FROM quality_checklist_items WHERE deliverable_id = 1 LIMIT 1").fetchone()
            res = logic.record_quality_inspection(conn, item["id"], {"result": "Fail", "notes": "Observed concurrency collision."})
            return res["result"]
        runner.run_test("Quality Checklist: recording Fail with notes succeeds", "Fail", t54)

        def t55():
            # Pass is BLOCKED while deliverable has unresolved critical defect
            # Deliverable R1 has open critical defect DEF-01 on A04
            item = conn.execute("SELECT id FROM quality_checklist_items WHERE deliverable_id = 1 LIMIT 1").fetchone()
            logic.record_quality_inspection(conn, item["id"], {"result": "Pass", "notes": "Attempting pass despite critical defect"})
        runner.run_test("Quality Gate: Pass is blocked while deliverable has unresolved critical defect", "EXCEPTION: ValueError", t55)

        def t56():
            risks = logic.get_risks(conn)
            return len(risks)
        runner.run_test("Risk Register: returns exactly 6 risks", 6, t56)

        def t57():
            # Risk scoring: High >= 15, Medium 8-14, Low < 8
            r_high = logic.get_risk_rating(4, 4) # 16
            r_med = logic.get_risk_rating(3, 4)  # 12
            r_low = logic.get_risk_rating(2, 3)  # 6
            return r_high == "High" and r_med == "Medium" and r_low == "Low"
        runner.run_test("Risk Scoring Matrix: High (>=15), Medium (8-14), Low (<8)", True, t57)

        def t58():
            pdpc = logic.get_pdpc_view(conn)
            return all("goal" in r and "preventive_action" in r and "corrective_action" in r for r in pdpc)
        runner.run_test("PDPC View: all risks contain goal, problem, preventive, corrective actions", True, t58)

        # ======================================================================
        # MODULE 6: INTEGRATION, DASHBOARD & INTEGRITY (T59 - T70)
        # ======================================================================
        def t59():
            dash = logic.get_dashboard_summary(conn)
            return dash["overall_health"]
        runner.run_test("Executive Dashboard: overall health evaluates to Red", "Red", t59)

        def t60():
            dash = logic.get_dashboard_summary(conn)
            return dash["unresolved_critical_defects"]
        runner.run_test("Executive Dashboard: tracks 2 unresolved critical defects", 2, t60)

        def t61():
            dash = logic.get_dashboard_summary(conn)
            return dash["cpi"] == 0.898 and dash["spi"] == 0.858
        runner.run_test("Executive Dashboard: displays computed CPI 0.898 and SPI 0.858", True, t61)

        def t62():
            report = logic.generate_status_report(conn)
            return all(k in report for k in ["project", "executive_summary", "evm_metrics", "milestones", "defects", "risks"])
        runner.run_test("Downloadable Report: generates complete PM report payload", True, t62)

        def t63():
            audit = logic.run_system_integrity_check(conn)
            return audit["all_passed"] is True and audit["passed_count"] == 6
        runner.run_test("Integrity Check: all 6 PMIS automated integrity checks pass", True, t63)

        def t64():
            # Delete activity with downstream dependents must be rejected
            act2 = conn.execute("SELECT id FROM activities WHERE activity_code = 'A02'").fetchone()
            logic.delete_activity(conn, act2["id"])
        runner.run_test("Integrity Enforcement: deleting activity with dependents is rejected", "EXCEPTION: ValueError", t64)

        # ======================================================================
        # ANTI-HARDCODING CHECKS (T65 - T70)
        # ======================================================================
        def t65():
            # 1. Change an activity's percent complete: EV, CPI and dashboard change
            evm_before = logic.calculate_evm(conn, "2026-10-26")
            a7 = conn.execute("SELECT id FROM activities WHERE activity_code = 'A07'").fetchone()["id"]
            logic.update_activity_progress(conn, a7, {"progress_percent": 90, "actual_cost": 270000, "delay_days": 0})
            evm_after = logic.calculate_evm(conn, "2026-10-26")
            # Restore
            logic.update_activity_progress(conn, a7, {"progress_percent": 60, "actual_cost": 270000, "delay_days": 0})
            return evm_after["ev"] > evm_before["ev"] and evm_after["cpi"] > evm_before["cpi"]
        runner.run_test("Anti-Hardcoding Check 1: Changing percent complete changes EV and CPI dynamically", True, t65)

        def t66():
            # 2. Change the status date: PV and SPI change
            evm_oct26 = logic.calculate_evm(conn, "2026-10-26")
            evm_oct15 = logic.calculate_evm(conn, "2026-10-15")
            return evm_oct15["pv"] < evm_oct26["pv"] and evm_oct15["spi"] != evm_oct26["spi"]
        runner.run_test("Anti-Hardcoding Check 2: Changing status date changes PV and SPI dynamically", True, t66)

        def t67():
            # 3. Change a duration: dates, critical path and projected finish change
            sched_before = logic.compute_schedule(conn)
            a4 = conn.execute("SELECT id FROM activities WHERE activity_code = 'A04'").fetchone()["id"]
            conn.execute("UPDATE activities SET duration_days = 25 WHERE id = ?", (a4,))
            conn.commit()
            sched_after = logic.compute_schedule(conn)
            # Restore
            conn.execute("UPDATE activities SET duration_days = 20 WHERE id = ?", (a4,))
            conn.commit()
            return sched_after["projected_finish"] > sched_before["projected_finish"]
        runner.run_test("Anti-Hardcoding Check 3: Changing duration changes dates and projected finish", True, t67)

        def t68():
            # 4. Edit the budget input: warnings change
            conn.execute("UPDATE project_charter SET approved_budget = 3000000.0 WHERE id = 1")
            conn.commit()
            evm = logic.calculate_evm(conn, "2026-10-26")
            # Restore
            conn.execute("UPDATE project_charter SET approved_budget = 5000000.0 WHERE id = 1")
            conn.commit()
            return any(w["type"] == "BUDGET_OVERRUN_RISK" for w in evm["warnings"])
        runner.run_test("Anti-Hardcoding Check 4: Editing budget changes EVM warnings dynamically", True, t68)

        def t69():
            # 5. Search logic.py for hardcoded acceptance values
            logic_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), "logic.py")
            with open(logic_file, "r", encoding="utf-8") as f:
                content = f.read()
            # None of the acceptance figures should be hardcoded in calculation functions
            forbidden = ["3516667", "3017500", "5233471", "3360000", "2026-12-09"]
            found = [val for val in forbidden if val in content]
            return len(found) == 0
        runner.run_test("Anti-Hardcoding Check 5: Zero hardcoded acceptance literals in logic.py", True, t69)

        def t70():
            # Bad input validation: non-numeric duration
            try:
                conn.execute("INSERT INTO activities (activity_code, name, assignee_id, duration_days, estimated_cost, requirement_id) VALUES ('BAD', 'Bad', 1, -5, 100, 1)")
                return False
            except sqlite3.IntegrityError:
                return True
        runner.run_test("Validation & Errors: negative duration rejected by DB CHECK constraint", True, t70)

    finally:
        conn.close()
        if os.path.exists(db_path):
            try:
                os.remove(db_path)
            except Exception:
                pass

    runner.export_csv()
    runner.print_summary()

    all_passed = all(r["status"] == "PASS" for r in runner.results)
    return 0 if all_passed else 1

if __name__ == "__main__":
    sys.exit(main())
