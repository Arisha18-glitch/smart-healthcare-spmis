"""
Software Project Management System - Core Business Logic & Calculations
ALL business rules, scheduling, EVM, risk scoring, validation, and transactions
are strictly contained in this module.
"""

from datetime import datetime, timedelta
import sqlite3
from typing import Dict, List, Any, Optional, Tuple

DATE_FMT = "%Y-%m-%d"

def parse_date(date_str: str) -> datetime:
    """Parses a YYYY-MM-DD string into a datetime object."""
    return datetime.strptime(date_str, DATE_FMT)

def format_date(dt: datetime) -> str:
    """Formats a datetime object into a YYYY-MM-DD string."""
    return dt.strftime(DATE_FMT)

# ==============================================================================
# MODULE 1: INITIATION & INTEGRATION MANAGEMENT
# ==============================================================================

def validate_charter_dates_and_budget(start_date: str, deadline: str, budget: float):
    """Validates deadline > start_date and budget > 0."""
    try:
        s_dt = parse_date(start_date)
        d_dt = parse_date(deadline)
    except ValueError as e:
        raise ValueError(f"Invalid date format (must be YYYY-MM-DD): {str(e)}")
    
    if d_dt <= s_dt:
        raise ValueError(f"Project deadline ({deadline}) must be strictly after start date ({start_date}).")
    
    if budget <= 0:
        raise ValueError(f"Approved budget must be greater than zero. Received: PKR {budget}")

def get_charter(conn: sqlite3.Connection) -> Dict[str, Any]:
    """Retrieves the project charter."""
    row = conn.execute("SELECT * FROM project_charter WHERE id = 1").fetchone()
    if not row:
        raise ValueError("Project charter has not been initialized.")
    return dict(row)

def update_charter(conn: sqlite3.Connection, charter_data: Dict[str, Any]) -> Dict[str, Any]:
    """Updates the project charter with strict validations."""
    start_date = charter_data.get("start_date")
    deadline = charter_data.get("deadline")
    approved_budget = float(charter_data.get("approved_budget", 0))
    
    validate_charter_dates_and_budget(start_date, deadline, approved_budget)
    
    status = charter_data.get("status", "Planning")
    if status not in ('Planning', 'Executing', 'Monitoring', 'On Hold', 'Closed'):
        raise ValueError(f"Invalid project status: {status}")
    
    if status == 'Closed':
        # Must pass closure validation
        can_close, reasons = validate_project_closure(conn)
        if not can_close:
            raise ValueError("Cannot close project. " + " ".join(reasons))
    
    conn.execute("""
        UPDATE project_charter
        SET title = :title,
            objectives = :objectives,
            stakeholders = :stakeholders,
            scope_boundaries = :scope_boundaries,
            approved_budget = :approved_budget,
            start_date = :start_date,
            deadline = :deadline,
            status = :status,
            cpi_threshold = :cpi_threshold,
            spi_threshold = :spi_threshold,
            status_date = :status_date,
            updated_at = datetime('now')
        WHERE id = 1
    """, {
        "title": charter_data["title"],
        "objectives": charter_data["objectives"],
        "stakeholders": charter_data["stakeholders"],
        "scope_boundaries": charter_data["scope_boundaries"],
        "approved_budget": approved_budget,
        "start_date": start_date,
        "deadline": deadline,
        "status": status,
        "cpi_threshold": float(charter_data.get("cpi_threshold", 0.90)),
        "spi_threshold": float(charter_data.get("spi_threshold", 0.90)),
        "status_date": charter_data.get("status_date", "2026-10-26")
    })
    conn.commit()
    return get_charter(conn)

def auto_fill_management_plan(conn: sqlite3.Connection) -> Dict[str, Any]:
    """
    Auto-fills the Management Plan (Scope, Schedule, Cost, Quality)
    from live project database data.
    """
    charter = get_charter(conn)
    schedule_data = compute_schedule(conn)
    evm_data = calculate_evm(conn)
    
    req_counts = conn.execute("""
        SELECT 
            COUNT(CASE WHEN status = 'Approved' THEN 1 END) as approved_count,
            COUNT(CASE WHEN status = 'Proposed' THEN 1 END) as proposed_count,
            COUNT(*) as total_count
        FROM requirements
    """).fetchone()
    
    act_count = conn.execute("SELECT COUNT(*) as cnt FROM activities").fetchone()["cnt"]
    critical_activities = [a["name"] for a in schedule_data["activities"] if a.get("is_critical")]
    milestones = get_milestones_with_status(conn)
    
    scope_plan = (
        f"SCOPE MANAGEMENT PLAN\n"
        f"---------------------\n"
        f"1. Scope Boundaries: {charter['scope_boundaries']}\n"
        f"2. Requirements Baseline: Total requirements: {req_counts['total_count']}, "
        f"Approved Deliverables: {req_counts['approved_count']}, "
        f"Proposed (Pending CR): {req_counts['proposed_count']}.\n"
        f"3. Work Breakdown Structure: {act_count} Work Packages defined across approved deliverables.\n"
        f"4. Change Control Procedure: Scope additions require formal Change Requests with cost & schedule impact analysis. "
        f"Unapproved requirements are strictly barred from scope execution."
    )
    
    sched_plan = (
        f"SCHEDULE MANAGEMENT PLAN\n"
        f"------------------------\n"
        f"1. Project Duration: {charter['start_date']} to {charter['deadline']} "
        f"({(parse_date(charter['deadline']) - parse_date(charter['start_date'])).days // 7} weeks, "
        f"{(parse_date(charter['deadline']) - parse_date(charter['start_date'])).days} calendar days).\n"
        f"2. Method: Critical Path Method (CPM) with programmatic forward and backward passes.\n"
        f"3. Critical Path Activities ({len(critical_activities)}): {', '.join(critical_activities) if critical_activities else 'None'}.\n"
        f"4. Projected Project Finish: {schedule_data['projected_finish']} "
        f"({'Delayed beyond deadline!' if schedule_data['projected_finish'] > charter['deadline'] else 'On track'}).\n"
        f"5. Key Milestones: {len(milestones)} defined (Achieved: {sum(1 for m in milestones if m['status']=='Achieved')}, "
        f"On Track: {sum(1 for m in milestones if m['status']=='On Track')}, "
        f"Delayed: {sum(1 for m in milestones if m['status']=='Delayed')})."
    )
    
    cost_plan = (
        f"COST MANAGEMENT PLAN\n"
        f"--------------------\n"
        f"1. Approved Budget Cap: PKR {charter['approved_budget']:,.2f}\n"
        f"2. Budget at Completion (BAC - Planned): PKR {evm_data['bac']:,.2f}\n"
        f"3. Contingency/Management Reserve: PKR {evm_data['reserve']:,.2f}\n"
        f"4. Performance Monitoring: Earned Value Management (EVM) evaluated weekly.\n"
        f"5. Control Thresholds: CPI warning threshold set at {charter['cpi_threshold']:.2f}, "
        f"SPI warning threshold set at {charter['spi_threshold']:.2f}.\n"
        f"6. Forecast at Completion (EAC): PKR {evm_data['eac']:,.2f} with VAC of PKR {evm_data['vac']:,.2f}."
    )
    
    quality_plan = (
        f"QUALITY MANAGEMENT PLAN\n"
        f"-----------------------\n"
        f"1. Quality Standards: Standard 5-point verification checklist required for every approved deliverable "
        f"(Architecture & Security, Unit/Integration Tests, UI/UX Standards, Concurrency Benchmarks, User Acceptance).\n"
        f"2. Defect Resolution Policy: Deliverable readiness is blocked while any Critical or High defect remains open.\n"
        f"3. Readiness Threshold: Deliverables require 100% inspection pass rate and 0 open critical defects before production release."
    )
    
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    conn.execute("""
        INSERT INTO management_plan (id, scope_plan, schedule_plan, cost_plan, quality_plan, last_autofilled_at)
        VALUES (1, :scope, :sched, :cost, :qual, :autofill)
        ON CONFLICT(id) DO UPDATE SET
            scope_plan = :scope,
            schedule_plan = :sched,
            cost_plan = :cost,
            quality_plan = :qual,
            last_autofilled_at = :autofill
    """, {
        "scope": scope_plan,
        "sched": sched_plan,
        "cost": cost_plan,
        "qual": quality_plan,
        "autofill": now_str
    })
    conn.commit()
    
    row = conn.execute("SELECT * FROM management_plan WHERE id = 1").fetchone()
    return dict(row)

def get_management_plan(conn: sqlite3.Connection) -> Dict[str, Any]:
    """Retrieves the management plan."""
    row = conn.execute("SELECT * FROM management_plan WHERE id = 1").fetchone()
    if not row:
        return auto_fill_management_plan(conn)
    return dict(row)

def update_management_plan(conn: sqlite3.Connection, plan_data: Dict[str, Any]) -> Dict[str, Any]:
    """Updates the management plan manually."""
    conn.execute("""
        INSERT INTO management_plan (id, scope_plan, schedule_plan, cost_plan, quality_plan, last_autofilled_at)
        VALUES (1, :scope, :sched, :cost, :qual, datetime('now'))
        ON CONFLICT(id) DO UPDATE SET
            scope_plan = :scope,
            schedule_plan = :sched,
            cost_plan = :cost,
            quality_plan = :qual
    """, {
        "scope": plan_data.get("scope_plan", ""),
        "sched": plan_data.get("schedule_plan", ""),
        "cost": plan_data.get("cost_plan", ""),
        "qual": plan_data.get("quality_plan", "")
    })
    conn.commit()
    return get_management_plan(conn)

def validate_project_closure(conn: sqlite3.Connection) -> Tuple[bool, List[str]]:
    """
    Project closure is blocked while:
    1. Activities are incomplete (< 100% progress).
    2. Change requests are pending.
    3. Critical defects are unresolved (Open or In Progress).
    """
    reasons = []
    
    incomplete_acts = conn.execute("""
        SELECT activity_code, name, progress_percent 
        FROM activities 
        WHERE progress_percent < 100
    """).fetchall()
    if incomplete_acts:
        act_names = [f"{a['activity_code']} ({a['name']} - {a['progress_percent']}%)" for a in incomplete_acts[:3]]
        more = f" and {len(incomplete_acts) - 3} more" if len(incomplete_acts) > 3 else ""
        reasons.append(f"{len(incomplete_acts)} incomplete activities remain: {', '.join(act_names)}{more}.")
    
    pending_crs = conn.execute("""
        SELECT cr_number, title 
        FROM change_requests 
        WHERE status = 'Pending'
    """).fetchall()
    if pending_crs:
        cr_names = [f"{cr['cr_number']} ({cr['title']})" for cr in pending_crs]
        reasons.append(f"{len(pending_crs)} change requests are still pending decision: {', '.join(cr_names)}.")
    
    critical_defects = conn.execute("""
        SELECT defect_code, title, status 
        FROM defects 
        WHERE severity = 'Critical' AND status IN ('Open', 'In Progress')
    """).fetchall()
    if critical_defects:
        def_names = [f"{d['defect_code']} ({d['title']} - {d['status']})" for d in critical_defects]
        reasons.append(f"{len(critical_defects)} unresolved critical defects: {', '.join(def_names)}.")
        
    return (len(reasons) == 0, reasons)

def close_project(conn: sqlite3.Connection) -> Dict[str, Any]:
    """Closes the project if all gates are satisfied."""
    can_close, reasons = validate_project_closure(conn)
    if not can_close:
        raise ValueError("Project closure rejected: " + " ".join(reasons))
    
    conn.execute("UPDATE project_charter SET status = 'Closed', updated_at = datetime('now') WHERE id = 1")
    conn.commit()
    return get_charter(conn)


# ==============================================================================
# MODULE 2: SCOPE & WORK BREAKDOWN STRUCTURE (WBS)
# ==============================================================================

def get_requirements(conn: sqlite3.Connection) -> List[Dict[str, Any]]:
    """Retrieves all requirements."""
    rows = conn.execute("SELECT * FROM requirements ORDER BY id").fetchall()
    return [dict(r) for r in rows]

def add_requirement(conn: sqlite3.Connection, req_data: Dict[str, Any]) -> Dict[str, Any]:
    """Adds a new requirement with initial Proposed status."""
    charter = get_charter(conn)
    status = req_data.get("status", "Proposed")
    
    # Scope locking rule:
    # If project is beyond Planning phase, new requirements can ONLY start as Proposed
    # and must be approved via change request.
    if charter["status"] != "Planning" and status == "Approved":
        raise ValueError(
            f"Project status is '{charter['status']}'. New requirements cannot be approved directly outside Planning. "
            f"Please create the requirement as 'Proposed' and raise a Change Request."
        )
    
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO requirements (req_code, title, description, priority, status, category)
        VALUES (:req_code, :title, :description, :priority, :status, :category)
    """, {
        "req_code": req_data["req_code"],
        "title": req_data["title"],
        "description": req_data.get("description", ""),
        "priority": req_data.get("priority", "Medium"),
        "status": status,
        "category": req_data.get("category", "Core Module")
    })
    req_id = cursor.lastrowid
    
    # If approved, seed quality checklist
    if status == "Approved":
        init_deliverable_checklist(conn, req_id)
        
    conn.commit()
    row = conn.execute("SELECT * FROM requirements WHERE id = ?", (req_id,)).fetchone()
    return dict(row)

def update_requirement(conn: sqlite3.Connection, req_id: int, req_data: Dict[str, Any]) -> Dict[str, Any]:
    """Updates an existing requirement respecting scope locking rules."""
    charter = get_charter(conn)
    existing = conn.execute("SELECT * FROM requirements WHERE id = ?", (req_id,)).fetchone()
    if not existing:
        raise ValueError(f"Requirement with ID {req_id} does not exist.")
    
    new_status = req_data.get("status", existing["status"])
    
    # Scope locking rule:
    # After project moves out of Planning, a requirement can only be approved through an approved change request.
    if charter["status"] != "Planning" and existing["status"] == "Proposed" and new_status == "Approved":
        raise ValueError(
            f"Scope is locked because project is in '{charter['status']}' phase. "
            f"Requirement '{existing['req_code']}' cannot be directly approved. "
            f"An approved Change Request is required to expand scope."
        )
    
    conn.execute("""
        UPDATE requirements
        SET title = :title,
            description = :description,
            priority = :priority,
            status = :status,
            category = :category
        WHERE id = :id
    """, {
        "id": req_id,
        "title": req_data.get("title", existing["title"]),
        "description": req_data.get("description", existing["description"]),
        "priority": req_data.get("priority", existing["priority"]),
        "status": new_status,
        "category": req_data.get("category", existing["category"])
    })
    
    if existing["status"] != "Approved" and new_status == "Approved":
        init_deliverable_checklist(conn, req_id)
        
    conn.commit()
    row = conn.execute("SELECT * FROM requirements WHERE id = ?", (req_id,)).fetchone()
    return dict(row)

def generate_wbs(conn: sqlite3.Connection) -> Dict[str, Any]:
    """
    Generates hierarchical WBS:
    Project -> Deliverables (Approved Requirements) -> Work Packages (Activities)
    Calculates cost roll-up at every level.
    Unapproved requirements are strictly omitted.
    """
    charter = get_charter(conn)
    deliverables = conn.execute("""
        SELECT * FROM requirements WHERE status = 'Approved' ORDER BY id
    """).fetchall()
    
    wbs_deliverables = []
    total_project_cost = 0.0
    
    for d in deliverables:
        activities = conn.execute("""
            SELECT a.*, tm.name as assignee_name, tm.role as assignee_role
            FROM activities a
            JOIN team_members tm ON a.assignee_id = tm.id
            WHERE a.requirement_id = ?
            ORDER BY a.id
        """, (d["id"],)).fetchall()
        
        work_packages = []
        deliverable_cost = 0.0
        deliverable_actual_cost = 0.0
        
        for act in activities:
            cost = float(act["estimated_cost"])
            act_cost = float(act["actual_cost"])
            deliverable_cost += cost
            deliverable_actual_cost += act_cost
            work_packages.append({
                "id": act["id"],
                "code": act["activity_code"],
                "name": act["name"],
                "assignee": f"{act['assignee_name']} ({act['assignee_role']})",
                "duration_days": act["duration_days"],
                "estimated_cost": cost,
                "actual_cost": act_cost,
                "progress_percent": act["progress_percent"],
                "delay_days": act["delay_days"]
            })
            
        total_project_cost += deliverable_cost
        wbs_deliverables.append({
            "id": d["id"],
            "code": d["req_code"],
            "title": d["title"],
            "category": d["category"],
            "priority": d["priority"],
            "estimated_cost": deliverable_cost,
            "actual_cost": deliverable_actual_cost,
            "work_packages": work_packages,
            "work_package_count": len(work_packages)
        })
        
    return {
        "project_name": charter["title"],
        "approved_budget": charter["approved_budget"],
        "total_wbs_planned_cost": total_project_cost,
        "total_project_cost": total_project_cost,
        "deliverable_count": len(wbs_deliverables),
        "deliverables": wbs_deliverables
    }

def get_change_requests(conn: sqlite3.Connection) -> List[Dict[str, Any]]:
    """Retrieves all change requests with linked requirement details."""
    rows = conn.execute("""
        SELECT cr.*, r.req_code, r.title as requirement_title, r.status as req_status
        FROM change_requests cr
        JOIN requirements r ON cr.linked_requirement_id = r.id
        ORDER BY cr.id
    """).fetchall()
    return [dict(r) for r in rows]

def create_change_request(conn: sqlite3.Connection, cr_data: Dict[str, Any]) -> Dict[str, Any]:
    """Creates a new change request."""
    cost_impact = float(cr_data.get("cost_impact", 0))
    sched_impact = int(cr_data.get("schedule_impact_weeks", 0))
    
    if cost_impact < 0:
        raise ValueError("Cost impact cannot be negative.")
    if sched_impact < 0:
        raise ValueError("Schedule impact cannot be negative.")
        
    linked_req = conn.execute("SELECT * FROM requirements WHERE id = ?", (cr_data["linked_requirement_id"],)).fetchone()
    if not linked_req:
        raise ValueError(f"Linked requirement ID {cr_data['linked_requirement_id']} does not exist.")
        
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO change_requests (
            cr_number, title, justification, linked_requirement_id, 
            cost_impact, schedule_impact_weeks, status, created_date
        ) VALUES (
            :cr_num, :title, :just, :req_id, :cost, :sched, 'Pending', :cdate
        )
    """, {
        "cr_num": cr_data["cr_number"],
        "title": cr_data["title"],
        "just": cr_data["justification"],
        "req_id": cr_data["linked_requirement_id"],
        "cost": cost_impact,
        "sched": sched_impact,
        "cdate": cr_data.get("created_date", datetime.now().strftime(DATE_FMT))
    })
    conn.commit()
    cr_id = cursor.lastrowid
    return dict(conn.execute("SELECT * FROM change_requests WHERE id = ?", (cr_id,)).fetchone())

def approve_change_request_transaction(
    conn: sqlite3.Connection, 
    cr_id: int, 
    decision_note: str,
    default_assignee_id: Optional[int] = None
) -> Dict[str, Any]:
    """
    CRITICAL ATOMIC TRANSACTION:
    Approving a change request must, in ONE database transaction:
    1. Increase approved budget: approved_budget += cost_impact
    2. Extend deadline: deadline += schedule_impact_weeks * 7 days
    3. Approve linked requirement: requirement.status = 'Approved'
    4. Create work package / activity for this requirement
    5. Regenerate schedule & WBS
    6. Rollback everything on failure
    Returns before and after values for budget, deadline, projected finish, work packages.
    """
    # Verify change request
    cr = conn.execute("SELECT * FROM change_requests WHERE id = ?", (cr_id,)).fetchone()
    if not cr:
        raise ValueError(f"Change Request with ID {cr_id} does not exist.")
    if cr["status"] != "Pending":
        raise ValueError(f"Change Request '{cr['cr_number']}' has already been decided ({cr['status']}).")
        
    req = conn.execute("SELECT * FROM requirements WHERE id = ?", (cr["linked_requirement_id"],)).fetchone()
    if not req:
        raise ValueError(f"Linked requirement ID {cr['linked_requirement_id']} not found.")

    # Capture BEFORE state
    charter_before = get_charter(conn)
    schedule_before = compute_schedule(conn)
    wbs_before = generate_wbs(conn)
    
    before_state = {
        "approved_budget": charter_before["approved_budget"],
        "deadline": charter_before["deadline"],
        "projected_finish": schedule_before["projected_finish"],
        "work_package_count": sum(len(d["work_packages"]) for d in wbs_before["deliverables"]),
        "deliverable_status": req["status"]
    }
    
    # Resolve default assignee if not provided
    if not default_assignee_id:
        member = conn.execute("SELECT id FROM team_members LIMIT 1").fetchone()
        if not member:
            raise ValueError("Cannot create work package: No team members exist.")
        default_assignee_id = member["id"]

    # Transaction begins
    try:
        # 1. Update approved budget
        new_budget = charter_before["approved_budget"] + float(cr["cost_impact"])
        
        # 2. Extend deadline
        old_deadline_dt = parse_date(charter_before["deadline"])
        new_deadline_dt = old_deadline_dt + timedelta(days=int(cr["schedule_impact_weeks"]) * 7)
        new_deadline_str = format_date(new_deadline_dt)
        
        conn.execute("""
            UPDATE project_charter
            SET approved_budget = ?,
                deadline = ?,
                updated_at = datetime('now')
            WHERE id = 1
        """, (new_budget, new_deadline_str))
        
        # 3. Approve linked requirement
        conn.execute("""
            UPDATE requirements
            SET status = 'Approved'
            WHERE id = ?
        """, (req["id"],))
        
        # Initialize quality checklist for this deliverable
        init_deliverable_checklist(conn, req["id"])
        
        # 4. Create work package / activity
        # Check if an activity already exists for this requirement
        existing_acts = conn.execute("SELECT COUNT(*) as cnt FROM activities WHERE requirement_id = ?", (req["id"],)).fetchone()["cnt"]
        act_code = f"ACT-{req['req_code']}-01"
        duration_days = max(1, int(cr["schedule_impact_weeks"]) * 7)
        
        # Find latest existing activity to link as predecessor if applicable
        last_act = conn.execute("SELECT id FROM activities ORDER BY id DESC LIMIT 1").fetchone()
        
        conn.execute("""
            INSERT INTO activities (
                activity_code, name, assignee_id, duration_days, 
                estimated_cost, requirement_id, progress_percent, actual_cost, delay_days
            ) VALUES (
                :code, :name, :assignee, :duration, :cost, :req_id, 0.0, 0.0, 0
            )
        """, {
            "code": act_code,
            "name": f"Implementation of {req['title']}",
            "assignee": default_assignee_id,
            "duration": duration_days,
            "cost": float(cr["cost_impact"]),
            "req_id": req["id"]
        })
        new_act_id = conn.execute("SELECT last_insert_rowid() as id").fetchone()["id"]
        
        # Link to previous activity if one exists to sequence it realistically
        if last_act and last_act["id"] != new_act_id:
            conn.execute("""
                INSERT INTO activity_dependencies (activity_id, predecessor_id)
                VALUES (?, ?)
            """, (new_act_id, last_act["id"]))
            
        # 5. Update Change Request record
        now_date = datetime.now().strftime(DATE_FMT)
        conn.execute("""
            UPDATE change_requests
            SET status = 'Approved',
                decision_note = :note,
                decided_date = :ddate
            WHERE id = :id
        """, {
            "id": cr_id,
            "note": decision_note or f"Approved. Budget increased by PKR {cr['cost_impact']:,.2f}, deadline extended by {cr['schedule_impact_weeks']} weeks.",
            "ddate": now_date
        })
        
        # 6. Recompute schedule to verify integrity & detect cycles
        schedule_after = compute_schedule(conn)
        wbs_after = generate_wbs(conn)
        charter_after = get_charter(conn)
        
        # Commit transaction
        conn.commit()
        
    except Exception as e:
        conn.rollback()
        raise ValueError(f"Change Request approval failed and rolled back completely: {str(e)}")

    after_state = {
        "approved_budget": charter_after["approved_budget"],
        "deadline": charter_after["deadline"],
        "projected_finish": schedule_after["projected_finish"],
        "work_package_count": sum(len(d["work_packages"]) for d in wbs_after["deliverables"]),
        "deliverable_status": "Approved",
        "created_activity_code": act_code
    }
    
    return {
        "change_request_id": cr_id,
        "cr_number": cr["cr_number"],
        "status": "Approved",
        "before": before_state,
        "after": after_state,
        "impact": {
            "budget_delta": after_state["approved_budget"] - before_state["approved_budget"],
            "deadline_extended_days": (parse_date(after_state["deadline"]) - parse_date(before_state["deadline"])).days,
            "new_activities_created": 1
        }
    }

def reject_change_request(conn: sqlite3.Connection, cr_id: int, decision_note: str) -> Dict[str, Any]:
    """Rejects a pending change request."""
    cr = conn.execute("SELECT * FROM change_requests WHERE id = ?", (cr_id,)).fetchone()
    if not cr:
        raise ValueError(f"Change Request with ID {cr_id} does not exist.")
    if cr["status"] != "Pending":
        raise ValueError(f"Change Request '{cr['cr_number']}' has already been decided ({cr['status']}).")
        
    now_date = datetime.now().strftime(DATE_FMT)
    conn.execute("""
        UPDATE change_requests
        SET status = 'Rejected',
            decision_note = :note,
            decided_date = :ddate
        WHERE id = :id
    """, {
        "id": cr_id,
        "note": decision_note or "Change request rejected by Project Manager / CCB.",
        "ddate": now_date
    })
    conn.commit()
    return dict(conn.execute("SELECT * FROM change_requests WHERE id = ?", (cr_id,)).fetchone())


# ==============================================================================
# MODULE 3: SCHEDULE, CRITICAL PATH & RESOURCE MANAGEMENT
# ==============================================================================

def detect_circular_dependencies(activities: List[Dict[str, Any]], dependencies: List[Tuple[int, int]]) -> Optional[List[int]]:
    """
    Detects circular dependencies using Kahn's algorithm (topological sort).
    Returns cycle path or None if acyclic.
    dependencies: list of (activity_id, predecessor_id), meaning pred -> act
    """
    adj = {a["id"]: set() for a in activities}
    in_degree = {a["id"]: 0 for a in activities}
    
    for act_id, pred_id in dependencies:
        if pred_id in adj and act_id in adj:
            adj[pred_id].add(act_id)
            in_degree[act_id] += 1
            
    queue = [a_id for a_id, deg in in_degree.items() if deg == 0]
    visited_count = 0
    
    while queue:
        curr = queue.pop(0)
        visited_count += 1
        for neighbor in adj[curr]:
            in_degree[neighbor] -= 1
            if in_degree[neighbor] == 0:
                queue.append(neighbor)
                
    if visited_count < len(activities):
        # Cycle exists
        return [a_id for a_id, deg in in_degree.items() if deg > 0]
    return None

def compute_schedule(conn: sqlite3.Connection) -> Dict[str, Any]:
    """
    Computes schedule programmatically using CPM:
    - Baseline schedule (forward pass without delays)
    - Forecast schedule (forward pass incorporating recorded delay_days)
    - Backward pass for slack and critical path
    - Delayed activities tracking & impact on dependent activities
    - Resource conflict detection
    """
    charter = get_charter(conn)
    project_start_dt = parse_date(charter["start_date"])
    project_deadline_dt = parse_date(charter["deadline"])
    status_date_dt = parse_date(charter["status_date"])
    
    act_rows = conn.execute("""
        SELECT a.*, r.req_code, r.title as req_title, r.status as req_status,
               tm.name as assignee_name, tm.role as assignee_role
        FROM activities a
        JOIN requirements r ON a.requirement_id = r.id
        JOIN team_members tm ON a.assignee_id = tm.id
        ORDER BY a.id
    """).fetchall()
    
    activities = [dict(r) for r in act_rows]
    if not activities:
        return {
            "project_start": charter["start_date"],
            "deadline": charter["deadline"],
            "projected_finish": charter["start_date"],
            "is_delayed_beyond_deadline": False,
            "variance_days": 0,
            "activities": [],
            "critical_path": [],
            "resource_conflicts": [],
            "delayed_activities": []
        }
        
    dep_rows = conn.execute("SELECT activity_id, predecessor_id FROM activity_dependencies").fetchall()
    deps = [(r["activity_id"], r["predecessor_id"]) for r in dep_rows]
    
    # Check for cycles
    cycle = detect_circular_dependencies(activities, deps)
    if cycle:
        raise ValueError(f"Circular dependency detected involving activity IDs: {cycle}")
        
    # Build predecessor & successor maps
    pred_map = {a["id"]: [] for a in activities}
    succ_map = {a["id"]: [] for a in activities}
    for act_id, pred_id in deps:
        if act_id in pred_map and pred_id in succ_map:
            pred_map[act_id].append(pred_id)
            succ_map[pred_id].append(act_id)
            
    act_dict = {a["id"]: a for a in activities}
    
    # --------------------------------------------------------------------------
    # FORWARD PASS (Topological order)
    # --------------------------------------------------------------------------
    in_deg = {a["id"]: len(pred_map[a["id"]]) for a in activities}
    queue = [a["id"] for a in activities if in_deg[a["id"]] == 0]
    topo_order = []
    
    while queue:
        curr_id = queue.pop(0)
        topo_order.append(curr_id)
        for s_id in succ_map[curr_id]:
            in_deg[s_id] -= 1
            if in_deg[s_id] == 0:
                queue.append(s_id)
                
    for a_id in topo_order:
        act = act_dict[a_id]
        dur = int(act["duration_days"])
        delay = int(act.get("delay_days", 0))
        preds = pred_map[a_id]
        
        # Baseline calculations
        if not preds:
            b_start_dt = project_start_dt
        else:
            latest_b_finish_dt = max(parse_date(act_dict[p]["baseline_finish"]) for p in preds)
            b_start_dt = latest_b_finish_dt + timedelta(days=1)
            
        b_finish_dt = b_start_dt + timedelta(days=max(0, dur - 1))
        act["baseline_start"] = format_date(b_start_dt)
        act["baseline_finish"] = format_date(b_finish_dt)
        
        # Forecast calculations (including delays)
        if not preds:
            f_start_dt = project_start_dt
        else:
            latest_f_finish_dt = max(parse_date(act_dict[p]["forecast_finish"]) for p in preds)
            f_start_dt = latest_f_finish_dt + timedelta(days=1)
            
        f_finish_dt = f_start_dt + timedelta(days=max(0, dur + delay - 1))
        act["forecast_start"] = format_date(f_start_dt)
        act["forecast_finish"] = format_date(f_finish_dt)
        act["effective_duration"] = dur + delay

    # --------------------------------------------------------------------------
    # BACKWARD PASS (for Slack & Critical Path on Forecast Schedule)
    # --------------------------------------------------------------------------
    max_forecast_finish_dt = max(parse_date(a["forecast_finish"]) for a in activities)
    projected_finish_str = format_date(max_forecast_finish_dt)
    
    # Initialize Late Finish (LF) for end nodes
    for a in activities:
        a["late_finish"] = projected_finish_str
        
    for a_id in reversed(topo_order):
        act = act_dict[a_id]
        succs = succ_map[a_id]
        dur_eff = act["effective_duration"]
        
        if succs:
            earliest_succ_ls_dt = min(parse_date(act_dict[s]["late_start"]) for s in succs)
            lf_dt = earliest_succ_ls_dt - timedelta(days=1)
        else:
            lf_dt = max_forecast_finish_dt
            
        ls_dt = lf_dt - timedelta(days=max(0, dur_eff - 1))
        act["late_finish"] = format_date(lf_dt)
        act["late_start"] = format_date(ls_dt)
        
        # Slack / Float in days
        es_dt = parse_date(act["forecast_start"])
        act["slack"] = (ls_dt - es_dt).days
        act["is_critical"] = (act["slack"] == 0)

    # --------------------------------------------------------------------------
    # DELAYED ACTIVITIES & IMPACT ANALYSIS
    # --------------------------------------------------------------------------
    delayed_activities = []
    
    for act in activities:
        delay_val = int(act.get("delay_days", 0))
        b_start_dt = parse_date(act["baseline_start"])
        f_start_dt = parse_date(act["forecast_start"])
        b_finish_dt = parse_date(act["baseline_finish"])
        prog = float(act.get("progress_percent", 0.0))
        
        is_delayed = (
            delay_val > 0 or 
            (f_start_dt > b_start_dt) or 
            (status_date_dt > b_finish_dt and prog < 100.0)
        )
        
        # Determine status label
        if prog >= 100.0:
            act["status_label"] = "Complete"
        elif is_delayed:
            act["status_label"] = "Delayed"
        elif act["is_critical"]:
            act["status_label"] = "Critical"
        else:
            act["status_label"] = "On Track"
            
        if is_delayed:
            # Find all dependent successors pushed by this activity
            pushed_successors = []
            visited_succs = set()
            
            def collect_pushed(curr_act_id):
                for sid in succ_map[curr_act_id]:
                    if sid not in visited_succs:
                        visited_succs.add(sid)
                        s_act = act_dict[sid]
                        sb_start = parse_date(s_act["baseline_start"])
                        sf_start = parse_date(s_act["forecast_start"])
                        pushed_days = max(0, (sf_start - sb_start).days)
                        pushed_successors.append({
                            "activity_id": sid,
                            "code": s_act["activity_code"],
                            "name": s_act["name"],
                            "assignee": s_act["assignee_name"],
                            "pushed_days": pushed_days
                        })
                        collect_pushed(sid)
                        
            collect_pushed(act["id"])
            
            # Impact on project deadline
            projected_days_beyond_deadline = (max_forecast_finish_dt - project_deadline_dt).days
            
            delayed_activities.append({
                "activity_id": act["id"],
                "code": act["activity_code"],
                "name": act["name"],
                "assignee": act["assignee_name"],
                "recorded_delay_days": delay_val,
                "baseline_dates": f"{act['baseline_start']} to {act['baseline_finish']}",
                "forecast_dates": f"{act['forecast_start']} to {act['forecast_finish']}",
                "progress_percent": prog,
                "pushed_dependent_activities": pushed_successors,
                "pushed_count": len(pushed_successors),
                "effect_on_final_deadline": (
                    f"Pushes project finish to {projected_finish_str} "
                    f"({projected_days_beyond_deadline} days past deadline)" 
                    if projected_days_beyond_deadline > 0 
                    else f"Within approved deadline buffer ({abs(projected_days_beyond_deadline)} days remaining)"
                )
            })

    # --------------------------------------------------------------------------
    # RESOURCE CONFLICT DETECTION
    # --------------------------------------------------------------------------
    resource_conflicts = []
    # Group activities by assignee
    by_assignee = {}
    for act in activities:
        aid = act["assignee_id"]
        if aid not in by_assignee:
            by_assignee[aid] = []
        by_assignee[aid].append(act)
        
    for aid, assigned_acts in by_assignee.items():
        if len(assigned_acts) > 1:
            # Check pairwise overlapping forecast intervals
            for i in range(len(assigned_acts)):
                for j in range(i + 1, len(assigned_acts)):
                    a1 = assigned_acts[i]
                    a2 = assigned_acts[j]
                    s1, f1 = parse_date(a1["forecast_start"]), parse_date(a1["forecast_finish"])
                    s2, f2 = parse_date(a2["forecast_start"]), parse_date(a2["forecast_finish"])
                    
                    overlap_start = max(s1, s2)
                    overlap_finish = min(f1, f2)
                    
                    if overlap_start <= overlap_finish:
                        resource_conflicts.append({
                            "assignee_id": aid,
                            "assignee_name": a1["assignee_name"],
                            "role": a1["assignee_role"],
                            "activity_1": f"{a1['activity_code']} - {a1['name']}",
                            "activity_2": f"{a2['activity_code']} - {a2['name']}",
                            "overlap_start": format_date(overlap_start),
                            "overlap_finish": format_date(overlap_finish),
                            "overlap_days": (overlap_finish - overlap_start).days + 1
                        })
                        
    critical_path = [a["activity_code"] for a in activities if a["is_critical"]]
    variance_days = (max_forecast_finish_dt - project_deadline_dt).days
    
    # Attach predecessor codes for easy frontend viewing
    for a in activities:
        a["predecessors"] = [act_dict[pid]["activity_code"] for pid in pred_map[a["id"]]]

    return {
        "project_start": charter["start_date"],
        "deadline": charter["deadline"],
        "projected_finish": projected_finish_str,
        "is_delayed_beyond_deadline": (variance_days > 0),
        "variance_days": variance_days,
        "activities": activities,
        "critical_path": critical_path,
        "resource_conflicts": resource_conflicts,
        "delayed_activities": delayed_activities
    }

def add_activity(conn: sqlite3.Connection, act_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Adds a new activity with strict validations:
    1. Requirement must be Approved (unapproved requirements never enter scope).
    2. BAC cap: adding this activity must NOT push total BAC above approved budget.
    3. Validates dependencies and cycle prevention.
    """
    charter = get_charter(conn)
    req_id = act_data["requirement_id"]
    
    # 1. Scope boundary: requirement must be Approved
    req = conn.execute("SELECT * FROM requirements WHERE id = ?", (req_id,)).fetchone()
    if not req:
        raise ValueError(f"Requirement with ID {req_id} does not exist.")
    if req["status"] != "Approved":
        raise ValueError(
            f"Scope Violation: Requirement '{req['req_code']} - {req['title']}' is {req['status']}. "
            f"Activities can only be created for Approved requirements. Please raise a Change Request."
        )
        
    est_cost = float(act_data.get("estimated_cost", 0))
    if est_cost < 0:
        raise ValueError("Estimated cost cannot be negative.")
        
    # 2. BAC Cap validation
    current_bac = conn.execute("SELECT COALESCE(SUM(estimated_cost), 0) as bac FROM activities").fetchone()["bac"]
    new_bac = current_bac + est_cost
    if new_bac > charter["approved_budget"]:
        raise ValueError(
            f"Budget Cap Exceeded: Adding this activity would push total planned budget (BAC = PKR {new_bac:,.2f}) "
            f"above the approved budget (PKR {charter['approved_budget']:,.2f}). "
            f"Please submit a Change Request to increase the approved budget before adding this activity."
        )
        
    duration = int(act_data.get("duration_days", 1))
    if duration <= 0:
        raise ValueError("Duration must be at least 1 day.")
        
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO activities (
            activity_code, name, assignee_id, duration_days, 
            estimated_cost, requirement_id, progress_percent, actual_cost, delay_days
        ) VALUES (
            :code, :name, :assignee, :duration, :cost, :req_id, :prog, :acost, :delay
        )
    """, {
        "code": act_data["activity_code"],
        "name": act_data["name"],
        "assignee": act_data["assignee_id"],
        "duration": duration,
        "cost": est_cost,
        "req_id": req_id,
        "prog": float(act_data.get("progress_percent", 0.0)),
        "acost": float(act_data.get("actual_cost", 0.0)),
        "delay": int(act_data.get("delay_days", 0))
    })
    act_id = cursor.lastrowid
    
    # Add predecessors if any
    predecessors = act_data.get("predecessor_ids", [])
    for p_id in predecessors:
        cursor.execute("INSERT INTO activity_dependencies (activity_id, predecessor_id) VALUES (?, ?)", (act_id, p_id))
        
    # Test schedule computation to check for circular dependencies
    try:
        compute_schedule(conn)
        conn.commit()
    except Exception as e:
        conn.rollback()
        raise ValueError(f"Failed to add activity due to dependency conflict: {str(e)}")
        
    row = conn.execute("SELECT * FROM activities WHERE id = ?", (act_id,)).fetchone()
    return dict(row)

def delete_activity(conn: sqlite3.Connection, act_id: int) -> Dict[str, Any]:
    """
    Deletes an activity, but strictly enforces that no other activities depend on it
    as a predecessor. If dependents exist, raises ValueError with dependent activity codes.
    """
    act = conn.execute("SELECT * FROM activities WHERE id = ?", (act_id,)).fetchone()
    if not act:
        raise ValueError(f"Activity with ID {act_id} does not exist.")
    
    # Check if this activity is a predecessor to other activities
    dependents = conn.execute("""
        SELECT a.activity_code, a.name 
        FROM activity_dependencies d
        JOIN activities a ON d.activity_id = a.id
        WHERE d.predecessor_id = ?
    """, (act_id,)).fetchall()
    
    if dependents:
        dep_codes = ", ".join([d["activity_code"] for d in dependents])
        raise ValueError(
            f"Cannot delete activity '{act['activity_code']}' ({act['name']}): "
            f"Other activities ({dep_codes}) depend on it as a predecessor. "
            f"Remove or reassign these dependencies first."
        )
        
    conn.execute("DELETE FROM activity_dependencies WHERE activity_id = ? OR predecessor_id = ?", (act_id, act_id))
    conn.execute("DELETE FROM milestones WHERE linked_activity_id = ?", (act_id,))
    conn.execute("DELETE FROM activities WHERE id = ?", (act_id,))
    conn.commit()
    return {"status": "Deleted", "activity_code": act["activity_code"]}

def update_activity_progress(conn: sqlite3.Connection, act_id: int, prog_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Updates progress form per activity:
    - percent_complete (0 - 100)
    - actual_cost (>= 0)
    - delay_days (>= 0)
    """
    act = conn.execute("SELECT * FROM activities WHERE id = ?", (act_id,)).fetchone()
    if not act:
        raise ValueError(f"Activity with ID {act_id} does not exist.")
        
    prog = float(prog_data.get("progress_percent", act["progress_percent"]))
    acost = float(prog_data.get("actual_cost", act["actual_cost"]))
    delay = int(prog_data.get("delay_days", act["delay_days"]))
    
    if not (0.0 <= prog <= 100.0):
        raise ValueError("Progress percent must be between 0.0 and 100.0.")
    if acost < 0.0:
        raise ValueError("Actual cost cannot be negative.")
    if delay < 0:
        raise ValueError("Delay days cannot be negative.")
        
    conn.execute("""
        UPDATE activities
        SET progress_percent = :prog,
            actual_cost = :acost,
            delay_days = :delay
        WHERE id = :id
    """, {
        "id": act_id,
        "prog": prog,
        "acost": acost,
        "delay": delay
    })
    conn.commit()
    return dict(conn.execute("SELECT * FROM activities WHERE id = ?", (act_id,)).fetchone())

def get_milestones_with_status(conn: sqlite3.Connection) -> List[Dict[str, Any]]:
    """
    Calculates milestone status auto-computed programmatically:
    - Achieved: linked activity progress == 100%
    - On Track: forecast finish <= target_date
    - Delayed: forecast finish > target_date or past target date and incomplete
    """
    schedule_data = compute_schedule(conn)
    act_dict = {a["id"]: a for a in schedule_data["activities"]}
    charter = get_charter(conn)
    status_date_dt = parse_date(charter["status_date"])
    
    rows = conn.execute("""
        SELECT m.*, a.activity_code, a.name as activity_name, a.progress_percent
        FROM milestones m
        JOIN activities a ON m.linked_activity_id = a.id
        ORDER BY m.target_date
    """).fetchall()
    
    result = []
    for r in rows:
        m = dict(r)
        act = act_dict.get(m["linked_activity_id"])
        target_dt = parse_date(m["target_date"])
        
        if act:
            f_finish_dt = parse_date(act["forecast_finish"])
            prog = float(act["progress_percent"])
            
            if prog >= 100.0:
                m["status"] = "Achieved"
            elif f_finish_dt <= target_dt:
                m["status"] = "On Track"
            else:
                m["status"] = "Delayed"
                
            m["forecast_finish"] = act["forecast_finish"]
            m["baseline_finish"] = act["baseline_finish"]
            m["delay_days_from_target"] = (f_finish_dt - target_dt).days if f_finish_dt > target_dt else 0
        else:
            m["status"] = "Unknown"
            m["delay_days_from_target"] = 0
            
        result.append(m)
        
    return result


# ==============================================================================
# MODULE 4: COST MANAGEMENT & EARNED VALUE ANALYSIS (EVM)
# ==============================================================================

def calculate_evm(conn: sqlite3.Connection, as_of_date: Optional[str] = None) -> Dict[str, Any]:
    """
    Performs complete Earned Value Management (EVM) calculations at the status date:
    - BAC = Sum of planned activity costs
    - PV = Planned Value (linear accrual between baseline_start and baseline_finish)
    - EV = Earned Value = sum(cost * percent_complete)
    - AC = Actual Cost = sum(actual_cost)
    - CV = EV - AC
    - SV = EV - PV
    - CPI = EV / AC
    - SPI = EV / PV
    - EAC = BAC / CPI
    - VAC = BAC - EAC
    - Contingency Reserve = approved_budget - BAC
    - Warnings generated automatically against configurable thresholds
    """
    charter = get_charter(conn)
    status_date_str = as_of_date if as_of_date else charter["status_date"]
    status_dt = parse_date(status_date_str)
    
    schedule_data = compute_schedule(conn)
    activities = schedule_data["activities"]
    
    total_bac = 0.0
    total_pv = 0.0
    total_ev = 0.0
    total_ac = 0.0
    
    activity_evm = []
    
    for act in activities:
        cost = float(act["estimated_cost"])
        prog = float(act.get("progress_percent", 0.0))
        acost = float(act.get("actual_cost", 0.0))
        
        b_start_dt = parse_date(act["baseline_start"])
        b_finish_dt = parse_date(act["baseline_finish"])
        total_days = max(1, (b_finish_dt - b_start_dt).days + 1)
        
        # Planned Value linear interpolation
        if status_dt < b_start_dt:
            pv = 0.0
        elif status_dt >= b_finish_dt:
            pv = cost
        else:
            elapsed_days = (status_dt - b_start_dt).days + 1
            pv = round(cost * (elapsed_days / total_days), 2)
            
        # Earned Value
        ev = round(cost * (prog / 100.0), 2)
        
        cv = round(ev - acost, 2)
        sv = round(ev - pv, 2)
        cpi_act = round(ev / acost, 3) if acost > 0 else 1.0
        spi_act = round(ev / pv, 3) if pv > 0 else 1.0
        
        total_bac += cost
        total_pv += pv
        total_ev += ev
        total_ac += acost
        
        activity_evm.append({
            "activity_id": act["id"],
            "code": act["activity_code"],
            "name": act["name"],
            "estimated_cost": cost,
            "actual_cost": acost,
            "progress_percent": prog,
            "baseline_start": act["baseline_start"],
            "baseline_finish": act["baseline_finish"],
            "pv": pv,
            "ev": ev,
            "ac": acost,
            "cv": cv,
            "sv": sv,
            "cpi": cpi_act,
            "spi": spi_act
        })
        
    total_bac = round(total_bac, 2)
    total_pv = round(total_pv, 2)
    total_ev = round(total_ev, 2)
    total_ac = round(total_ac, 2)
    
    cv_total = round(total_ev - total_ac, 2)
    sv_total = round(total_ev - total_pv, 2)
    
    cpi_unrounded = (total_ev / total_ac) if total_ac > 0 else 1.0
    cpi = round(total_ev / total_ac, 3) if total_ac > 0 else 1.0
    spi = round(total_ev / total_pv, 3) if total_pv > 0 else 1.0
    
    eac = round(total_bac / cpi_unrounded, 2) if cpi_unrounded > 0 else total_bac
    vac = round(total_bac - eac, 2)
    
    approved_budget = float(charter["approved_budget"])
    reserve = round(approved_budget - total_bac, 2)
    progress_overall = round((total_ev / total_bac) * 100, 2) if total_bac > 0 else 0.0
    
    # Threshold warnings
    warnings = []
    cpi_thresh = float(charter.get("cpi_threshold", 0.90))
    spi_thresh = float(charter.get("spi_threshold", 0.90))
    
    if cpi < cpi_thresh:
        warnings.append({
            "type": "COST_OVERRUN",
            "severity": "CRITICAL" if cpi < 0.80 else "WARNING",
            "message": f"Cost Performance Index (CPI = {cpi:.2f}) is below approved threshold ({cpi_thresh:.2f}). "
                       f"Cost deficit to date: PKR {abs(cv_total):,.2f}."
        })
        
    if spi < spi_thresh:
        warnings.append({
            "type": "SCHEDULE_DEVIATION",
            "severity": "CRITICAL" if spi < 0.80 else "WARNING",
            "message": f"Schedule Performance Index (SPI = {spi:.2f}) is below approved threshold ({spi_thresh:.2f}). "
                       f"Earned work lags planned value by PKR {abs(sv_total):,.2f}."
        })
        
    if eac > approved_budget:
        warnings.append({
            "type": "BUDGET_CAP_EXCEEDED",
            "severity": "CRITICAL",
            "message": f"Forecast at Completion (EAC = PKR {eac:,.2f}) exceeds Approved Budget (PKR {approved_budget:,.2f}) "
                       f"by PKR {eac - approved_budget:,.2f}."
        })
        warnings.append({
            "type": "BUDGET_OVERRUN_RISK",
            "severity": "CRITICAL",
            "message": f"Forecast at Completion (EAC = PKR {eac:,.2f}) exceeds Approved Budget (PKR {approved_budget:,.2f})."
        })
        
    if total_ac > approved_budget:
        warnings.append({
            "type": "ACTUAL_COST_OVER_BUDGET",
            "severity": "CRITICAL",
            "message": f"Actual Cost to date (PKR {total_ac:,.2f}) has already exceeded the approved budget (PKR {approved_budget:,.2f})!"
        })
        
    if schedule_data["is_delayed_beyond_deadline"]:
        warnings.append({
            "type": "PROJECTED_FINISH_LATE",
            "severity": "CRITICAL",
            "message": f"Projected completion ({schedule_data['projected_finish']}) exceeds charter deadline "
                       f"({charter['deadline']}) by {schedule_data['variance_days']} calendar days."
        })
        
    return {
        "status_date": status_date_str,
        "approved_budget": approved_budget,
        "bac": total_bac,
        "pv": total_pv,
        "ev": total_ev,
        "ac": total_ac,
        "cv": cv_total,
        "sv": sv_total,
        "cpi": cpi,
        "spi": spi,
        "eac": eac,
        "vac": vac,
        "reserve": reserve,
        "overall_progress_percent": progress_overall,
        "progress_percent": progress_overall,
        "cpi_threshold": cpi_thresh,
        "spi_threshold": spi_thresh,
        "warnings": warnings,
        "activity_breakdown": activity_evm
    }

def generate_s_curve_data(conn: sqlite3.Connection) -> List[Dict[str, Any]]:
    """
    Generates weekly time-series checkpoints for S-Curve chart:
    Dates from project start to deadline / projected finish.
    Computes Cumulative PV, Cumulative EV (up to status date), and Cumulative AC (up to status date).
    """
    charter = get_charter(conn)
    start_dt = parse_date(charter["start_date"])
    deadline_dt = parse_date(charter["deadline"])
    status_dt = parse_date(charter["status_date"])
    
    schedule_data = compute_schedule(conn)
    finish_dt = max(deadline_dt, parse_date(schedule_data["projected_finish"]))
    
    points = []
    curr_dt = start_dt
    
    while curr_dt <= finish_dt + timedelta(days=6):
        date_str = format_date(min(curr_dt, finish_dt))
        # Compute EVM at this checkpoint
        evm_pt = calculate_evm(conn, as_of_date=date_str)
        
        pt = {
            "date": date_str,
            "pv": evm_pt["pv"],
            "ev": evm_pt["ev"] if curr_dt <= status_dt else None,
            "ac": evm_pt["ac"] if curr_dt <= status_dt else None,
            "is_status_date": (curr_dt == status_dt)
        }
        points.append(pt)
        
        if curr_dt >= finish_dt:
            break
        curr_dt += timedelta(days=7) # weekly intervals
        
    return points


# ==============================================================================
# MODULE 5: QUALITY MANAGEMENT & RISK CONTROL
# ==============================================================================

STANDARD_CHECKLIST_ITEMS = [
    "Architecture, security compliance and patient data encryption validation",
    "Core business logic unit and integration test suite 100% pass",
    "User interface & clinical workflow UX standards verification",
    "Multi-hospital concurrent performance & latency benchmark test",
    "Clinical staff & hospital administrative user acceptance sign-off"
]

def init_deliverable_checklist(conn: sqlite3.Connection, deliverable_id: int):
    """Initializes the standard 5-item quality checklist for an approved deliverable."""
    existing = conn.execute(
        "SELECT COUNT(*) as cnt FROM quality_checklist_items WHERE deliverable_id = ?", 
        (deliverable_id,)
    ).fetchone()["cnt"]
    
    if existing == 0:
        for item in STANDARD_CHECKLIST_ITEMS:
            conn.execute("""
                INSERT INTO quality_checklist_items (deliverable_id, item_text, result)
                VALUES (?, ?, 'Pending')
            """, (deliverable_id, item))

def get_defects(conn: sqlite3.Connection) -> List[Dict[str, Any]]:
    """Retrieves all defects with assignee and activity metadata."""
    rows = conn.execute("""
        SELECT d.*, a.activity_code, a.name as activity_name, a.requirement_id,
               tm.name as assignee_name
        FROM defects d
        LEFT JOIN activities a ON d.activity_id = a.id
        LEFT JOIN team_members tm ON d.assigned_to = tm.id
        ORDER BY d.id
    """).fetchall()
    return [dict(r) for r in rows]

def add_defect(conn: sqlite3.Connection, def_data: Dict[str, Any]) -> Dict[str, Any]:
    """Adds a new defect."""
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO defects (
            defect_code, title, severity, assigned_to, activity_id, status, reported_date, resolution_notes
        ) VALUES (
            :code, :title, :sev, :assigned, :act_id, :status, :rdate, :rnotes
        )
    """, {
        "code": def_data["defect_code"],
        "title": def_data["title"],
        "sev": def_data["severity"],
        "assigned": def_data.get("assigned_to"),
        "act_id": def_data.get("activity_id"),
        "status": def_data.get("status", "Open"),
        "rdate": def_data.get("reported_date", datetime.now().strftime(DATE_FMT)),
        "rnotes": def_data.get("resolution_notes", "")
    })
    conn.commit()
    return dict(conn.execute("SELECT * FROM defects WHERE id = ?", (cursor.lastrowid,)).fetchone())

def update_defect(conn: sqlite3.Connection, def_id: int, def_data: Dict[str, Any]) -> Dict[str, Any]:
    """Updates defect status and resolution notes."""
    existing = conn.execute("SELECT * FROM defects WHERE id = ?", (def_id,)).fetchone()
    if not existing:
        raise ValueError(f"Defect with ID {def_id} not found.")
        
    conn.execute("""
        UPDATE defects
        SET status = :status,
            resolution_notes = :rnotes,
            severity = :sev,
            assigned_to = :assigned
        WHERE id = :id
    """, {
        "id": def_id,
        "status": def_data.get("status", existing["status"]),
        "rnotes": def_data.get("resolution_notes", existing["resolution_notes"]),
        "sev": def_data.get("severity", existing["severity"]),
        "assigned": def_data.get("assigned_to", existing["assigned_to"])
    })
    conn.commit()
    return dict(conn.execute("SELECT * FROM defects WHERE id = ?", (def_id,)).fetchone())

def get_deliverable_readiness(conn: sqlite3.Connection) -> List[Dict[str, Any]]:
    """
    Computes deliverable readiness across all approved deliverables:
    - Pass rate = passed items / total items (5) * 100%
    - Has unresolved critical defect? (linked to activities of this requirement)
    - Ready: pass rate == 100% AND 0 unresolved critical defects
    """
    reqs = conn.execute("SELECT * FROM requirements WHERE status = 'Approved' ORDER BY id").fetchall()
    readiness_list = []
    
    for r in reqs:
        req_id = r["id"]
        init_deliverable_checklist(conn, req_id)
        
        items = conn.execute("""
            SELECT q.*, tm.name as inspector_name
            FROM quality_checklist_items q
            LEFT JOIN team_members tm ON q.inspector_id = tm.id
            WHERE q.deliverable_id = ?
            ORDER BY q.id
        """, (req_id,)).fetchall()
        
        passed_count = sum(1 for it in items if it["result"] == "Pass")
        failed_count = sum(1 for it in items if it["result"] == "Fail")
        pending_count = sum(1 for it in items if it["result"] == "Pending")
        total_items = len(items)
        pass_rate = round((passed_count / total_items) * 100, 1) if total_items > 0 else 0.0
        
        # Check for unresolved critical defects linked to this deliverable
        critical_defects = conn.execute("""
            SELECT d.defect_code, d.title, d.status
            FROM defects d
            JOIN activities a ON d.activity_id = a.id
            WHERE a.requirement_id = ? 
              AND d.severity = 'Critical'
              AND d.status IN ('Open', 'In Progress')
        """, (req_id,)).fetchall()
        
        has_critical = len(critical_defects) > 0
        is_ready = (pass_rate == 100.0) and (not has_critical)
        
        readiness_list.append({
            "deliverable_id": req_id,
            "req_code": r["req_code"],
            "title": r["title"],
            "total_items": total_items,
            "passed_count": passed_count,
            "failed_count": failed_count,
            "pending_count": pending_count,
            "pass_rate": pass_rate,
            "has_unresolved_critical_defects": has_critical,
            "critical_defect_count": len(critical_defects),
            "critical_defects": [dict(cd) for cd in critical_defects],
            "is_ready": is_ready,
            "checklist": [dict(it) for it in items]
        })
        
    return readiness_list

def record_quality_inspection(conn: sqlite3.Connection, item_id: int, inspect_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Records an inspection result (Pass / Fail / Pending).
    Rules:
    1. If Fail, notes are MANDATORY.
    2. BLOCK 'Pass' while the deliverable has an unresolved critical defect.
    """
    item = conn.execute("SELECT * FROM quality_checklist_items WHERE id = ?", (item_id,)).fetchone()
    if not item:
        raise ValueError(f"Checklist item with ID {item_id} does not exist.")
        
    result = inspect_data.get("result")
    notes = inspect_data.get("notes", "").strip()
    inspector_id = inspect_data.get("inspector_id")
    inspect_date = inspect_data.get("inspection_date", datetime.now().strftime(DATE_FMT))
    
    if result not in ("Pending", "Pass", "Fail"):
        raise ValueError(f"Invalid inspection result: {result}")
        
    # Rule 1: Notes mandatory for Fail
    if result == "Fail" and not notes:
        raise ValueError("Inspection rejection notes are strictly required when recording a 'Fail' result.")
        
    # Rule 2: Block Pass while deliverable has an unresolved critical defect
    if result == "Pass":
        deliverable_id = item["deliverable_id"]
        critical_defects = conn.execute("""
            SELECT d.defect_code, d.title
            FROM defects d
            JOIN activities a ON d.activity_id = a.id
            WHERE a.requirement_id = ?
              AND d.severity = 'Critical'
              AND d.status IN ('Open', 'In Progress')
        """, (deliverable_id,)).fetchall()
        
        if critical_defects:
            codes = ", ".join([d["defect_code"] for d in critical_defects])
            req = conn.execute("SELECT req_code, title FROM requirements WHERE id = ?", (deliverable_id,)).fetchone()
            raise ValueError(
                f"Inspection Pass Blocked: Deliverable '{req['req_code']} - {req['title']}' "
                f"has unresolved critical defect(s): [{codes}]. "
                f"All critical defects must be resolved before passing quality inspection."
            )
            
    conn.execute("""
        UPDATE quality_checklist_items
        SET result = :res,
            notes = :notes,
            inspector_id = :insp,
            inspection_date = :idate
        WHERE id = :id
    """, {
        "id": item_id,
        "res": result,
        "notes": notes,
        "insp": inspector_id,
        "idate": inspect_date
    })
    conn.commit()
    return dict(conn.execute("SELECT * FROM quality_checklist_items WHERE id = ?", (item_id,)).fetchone())

def calculate_risk_rating(score: int) -> str:
    """Calculates risk rating according to specification."""
    if score >= 15:
        return "High"
    elif score >= 8:
        return "Medium"
    else:
        return "Low"

def get_risks(conn: sqlite3.Connection) -> Dict[str, Any]:
    """
    Returns risk prioritization matrix and PDPC items:
    - score = likelihood * impact
    - rating: High (>=15), Medium (8-14), Low (<8)
    - 5x5 color grid
    - ranked list sorted by score descending
    """
    rows = conn.execute("SELECT * FROM risks ORDER BY (likelihood * impact) DESC").fetchall()
    risk_list = []
    
    # 5x5 grid: matrix[likelihood][impact] (1-indexed)
    grid = [[[] for _ in range(6)] for _ in range(6)]
    
    for r in rows:
        item = dict(r)
        score = item["likelihood"] * item["impact"]
        item["score"] = score
        item["rating"] = calculate_risk_rating(score)
        risk_list.append(item)
        
        lik = item["likelihood"]
        imp = item["impact"]
        if 1 <= lik <= 5 and 1 <= imp <= 5:
            grid[lik][imp].append({
                "code": item["risk_code"],
                "title": item["title"],
                "rating": item["rating"],
                "score": score
            })
            
    return {
        "ranked_risks": risk_list,
        "total_count": len(risk_list),
        "high_count": sum(1 for r in risk_list if r["rating"] == "High"),
        "medium_count": sum(1 for r in risk_list if r["rating"] == "Medium"),
        "low_count": sum(1 for r in risk_list if r["rating"] == "Low"),
        "grid_5x5": grid
    }

def get_pdpc_view(conn: sqlite3.Connection) -> List[Dict[str, Any]]:
    """
    Generates Process Decision Program Chart (PDPC) view:
    Goal -> Potential Problem (Risk) -> Preventive Action -> Corrective Action
    """
    rows = conn.execute("""
        SELECT risk_code, title, goal, preventive_action, corrective_action, 
               likelihood, impact, (likelihood * impact) as score, status
        FROM risks
        ORDER BY score DESC
    """).fetchall()
    
    pdpc_tree = []
    for r in rows:
        score = r["score"]
        pdpc_tree.append({
            "risk_code": r["risk_code"],
            "goal": r["goal"],
            "potential_problem": r["title"],
            "likelihood": r["likelihood"],
            "impact": r["impact"],
            "score": score,
            "rating": calculate_risk_rating(score),
            "preventive_action": r["preventive_action"],
            "corrective_action": r["corrective_action"],
            "status": r["status"]
        })
    return pdpc_tree

def add_risk(conn: sqlite3.Connection, risk_data: Dict[str, Any]) -> Dict[str, Any]:
    """Adds a new risk with PDPC actions."""
    lik = int(risk_data.get("likelihood", 1))
    imp = int(risk_data.get("impact", 1))
    
    if not (1 <= lik <= 5):
        raise ValueError("Likelihood must be an integer between 1 and 5.")
    if not (1 <= imp <= 5):
        raise ValueError("Impact must be an integer between 1 and 5.")
        
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO risks (
            risk_code, title, description, likelihood, impact, status, goal, preventive_action, corrective_action
        ) VALUES (
            :code, :title, :desc, :lik, :imp, :status, :goal, :prev, :corr
        )
    """, {
        "code": risk_data["risk_code"],
        "title": risk_data["title"],
        "desc": risk_data.get("description", ""),
        "lik": lik,
        "imp": imp,
        "status": risk_data.get("status", "Open"),
        "goal": risk_data["goal"],
        "prev": risk_data["preventive_action"],
        "corr": risk_data["corrective_action"]
    })
    conn.commit()
    row = conn.execute("SELECT * FROM risks WHERE id = ?", (cursor.lastrowid,)).fetchone()
    item = dict(row)
    item["score"] = item["likelihood"] * item["impact"]
    item["rating"] = calculate_risk_rating(item["score"])
    return item


# ==============================================================================
# MODULE 6: SYSTEM INTEGRATION, VALIDATION & REPORTING
# ==============================================================================

def get_dashboard_summary(conn: sqlite3.Connection) -> Dict[str, Any]:
    """
    Generates high-level project dashboard data:
    - Overall Progress (EV / BAC)
    - CPI, SPI, EAC, VAC
    - Projected Finish vs Deadline
    - Budget status (Approved, Planned BAC, Actual Cost, Reserve)
    - Pending change requests count
    - Delayed activities count
    - Unresolved critical defects count
    - Overall Project Health: Green / Amber / Red
    """
    charter = get_charter(conn)
    schedule_data = compute_schedule(conn)
    evm_data = calculate_evm(conn)
    
    pending_crs = conn.execute("SELECT COUNT(*) as cnt FROM change_requests WHERE status = 'Pending'").fetchone()["cnt"]
    critical_defects = conn.execute("""
        SELECT COUNT(*) as cnt FROM defects 
        WHERE severity = 'Critical' AND status IN ('Open', 'In Progress')
    """).fetchone()["cnt"]
    
    delayed_count = len(schedule_data["delayed_activities"])
    
    cpi = evm_data["cpi"]
    spi = evm_data["spi"]
    proj_finish = schedule_data["projected_finish"]
    deadline = charter["deadline"]
    is_late = schedule_data["is_delayed_beyond_deadline"]
    variance_days = schedule_data["variance_days"]
    
    # Calculate Overall Health
    if cpi < 0.85 or spi < 0.85 or critical_defects > 0 or variance_days > 7:
        health = "Red"
        health_reason = (
            f"Project is in RED status due to: "
            f"{'Critical defects unresolved (' + str(critical_defects) + '). ' if critical_defects else ''}"
            f"{'Severe cost lag (CPI = ' + str(cpi) + '). ' if cpi < 0.85 else ''}"
            f"{'Severe schedule lag (SPI = ' + str(spi) + '). ' if spi < 0.85 else ''}"
            f"{'Finish delayed by ' + str(variance_days) + ' days past deadline. ' if variance_days > 7 else ''}"
        )
    elif cpi < 0.95 or spi < 0.95 or is_late or delayed_count > 0:
        health = "Amber"
        health_reason = (
            f"Project is in AMBER status: "
            f"{'CPI under target (' + str(cpi) + '). ' if cpi < 0.95 else ''}"
            f"{'SPI under target (' + str(spi) + '). ' if spi < 0.95 else ''}"
            f"{'Schedule delay variance ' + str(variance_days) + ' days.' if is_late else ''}"
        )
    else:
        health = "Green"
        health_reason = "All project health indicators are within acceptable limits."
        
    return {
        "project_title": charter["title"],
        "project_status": charter["status"],
        "status_date": charter["status_date"],
        "overall_health": health,
        "health_reason": health_reason,
        "overall_progress_percent": evm_data["overall_progress_percent"],
        "cpi": cpi,
        "spi": spi,
        "cv": evm_data["cv"],
        "sv": evm_data["sv"],
        "approved_budget": charter["approved_budget"],
        "bac": evm_data["bac"],
        "actual_cost": evm_data["ac"],
        "eac": evm_data["eac"],
        "reserve": evm_data["reserve"],
        "start_date": charter["start_date"],
        "deadline": deadline,
        "projected_finish": proj_finish,
        "is_delayed_beyond_deadline": is_late,
        "variance_days": variance_days,
        "pending_change_requests": pending_crs,
        "delayed_activities_count": delayed_count,
        "unresolved_critical_defects": critical_defects,
        "resource_conflicts_count": len(schedule_data["resource_conflicts"]),
        "warnings": evm_data["warnings"]
    }

def run_integrity_audit(conn: sqlite3.Connection) -> Dict[str, Any]:
    """
    Performs comprehensive project integrity verification:
    1. Activities on non-approved requirements (must be 0)
    2. Budget integrity: approved_budget == initial_budget + sum(approved CR cost_impact)
    3. Deadline integrity: deadline == initial_deadline + sum(approved CR schedule_impact_weeks * 7)
    4. Approved requirements without activities (orphans)
    5. WBS roll-up out of sync with activity costs
    6. BAC > approved_budget check
    7. Premature project closure check
    """
    charter = get_charter(conn)
    checks = []
    
    # 1. Activities on unapproved requirements
    invalid_acts = conn.execute("""
        SELECT a.activity_code, a.name, r.req_code, r.status as req_status
        FROM activities a
        JOIN requirements r ON a.requirement_id = r.id
        WHERE r.status != 'Approved'
    """).fetchall()
    checks.append({
        "check_name": "Scope Locking: Activities on Approved Requirements Only",
        "passed": len(invalid_acts) == 0,
        "details": f"Found {len(invalid_acts)} activities assigned to unapproved requirements." if invalid_acts else "All activities strictly linked to Approved requirements.",
        "violating_items": [dict(r) for r in invalid_acts]
    })
    
    # 2. Budget integrity
    approved_cr_cost = conn.execute("""
        SELECT COALESCE(SUM(cost_impact), 0) as cr_cost 
        FROM change_requests 
        WHERE status = 'Approved'
    """).fetchone()["cr_cost"]
    expected_budget = charter["initial_budget"] + approved_cr_cost
    budget_ok = abs(charter["approved_budget"] - expected_budget) < 0.01
    checks.append({
        "check_name": "Budget Lineage Integrity (Initial Budget + Approved CRs)",
        "passed": budget_ok,
        "details": (
            f"Approved budget (PKR {charter['approved_budget']:,.2f}) matches initial "
            f"(PKR {charter['initial_budget']:,.2f}) + approved CRs (PKR {approved_cr_cost:,.2f})."
            if budget_ok else
            f"Budget Mismatch: Charter shows PKR {charter['approved_budget']:,.2f}, "
            f"expected PKR {expected_budget:,.2f}."
        )
    })
    
    # 3. Deadline integrity
    approved_cr_weeks = conn.execute("""
        SELECT COALESCE(SUM(schedule_impact_weeks), 0) as weeks 
        FROM change_requests 
        WHERE status = 'Approved'
    """).fetchone()["weeks"]
    init_deadline_dt = parse_date(charter["initial_deadline"])
    expected_deadline = format_date(init_deadline_dt + timedelta(days=approved_cr_weeks * 7))
    deadline_ok = (charter["deadline"] == expected_deadline)
    checks.append({
        "check_name": "Schedule Lineage Integrity (Initial Deadline + Approved CRs)",
        "passed": deadline_ok,
        "details": (
            f"Charter deadline ({charter['deadline']}) matches initial ({charter['initial_deadline']}) "
            f"+ {approved_cr_weeks} weeks from approved CRs."
            if deadline_ok else
            f"Deadline Mismatch: Charter shows {charter['deadline']}, expected {expected_deadline}."
        )
    })
    
    # 4. Approved requirements without activities
    orphan_reqs = conn.execute("""
        SELECT r.req_code, r.title
        FROM requirements r
        LEFT JOIN activities a ON r.id = a.requirement_id
        WHERE r.status = 'Approved' AND a.id IS NULL
    """).fetchall()
    checks.append({
        "check_name": "Deliverable Execution Coverage (Approved Requirements have Activities)",
        "passed": len(orphan_reqs) == 0,
        "details": (
            "All approved deliverables have mapped work packages."
            if not orphan_reqs else
            f"{len(orphan_reqs)} approved deliverables have no work packages defined: " +
            ", ".join([f"{r['req_code']} ({r['title']})" for r in orphan_reqs])
        )
    })
    
    # 5. WBS Roll-up Consistency
    act_sum = conn.execute("SELECT COALESCE(SUM(estimated_cost), 0) as s FROM activities").fetchone()["s"]
    wbs = generate_wbs(conn)
    wbs_ok = abs(act_sum - wbs["total_wbs_planned_cost"]) < 0.01
    checks.append({
        "check_name": "WBS Cost Roll-up Consistency",
        "passed": wbs_ok,
        "details": f"WBS rolled-up cost (PKR {wbs['total_wbs_planned_cost']:,.2f}) perfectly matches activity sum (PKR {act_sum:,.2f})."
    })
    
    # 6. Planned Budget within Approved Cap
    bac_cap_ok = act_sum <= charter["approved_budget"]
    checks.append({
        "check_name": "Planned Budget within Approved Budget Cap",
        "passed": bac_cap_ok,
        "details": (
            f"Planned BAC (PKR {act_sum:,.2f}) is within approved budget (PKR {charter['approved_budget']:,.2f}). "
            f"Reserve: PKR {charter['approved_budget'] - act_sum:,.2f}."
            if bac_cap_ok else
            f"VIOLATION: Planned BAC (PKR {act_sum:,.2f}) exceeds approved budget (PKR {charter['approved_budget']:,.2f})!"
        )
    })
    
    # 7. Project Closure Gate Integrity
    if charter["status"] == "Closed":
        can_close, reasons = validate_project_closure(conn)
        checks.append({
            "check_name": "Closed Project Gate Integrity",
            "passed": can_close,
            "details": "Project is closed and all completion gates were satisfied." if can_close else f"Premature closure: {'; '.join(reasons)}"
        })
        
    all_passed = all(c["passed"] for c in checks)
    passed_count = sum(1 for c in checks if c["passed"])
    return {
        "audit_timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "all_passed": all_passed,
        "passed_count": passed_count,
        "total_checks": len(checks),
        "checks": checks
    }

run_system_integrity_check = run_integrity_audit

def get_risk_rating(prob: int, imp: int) -> str:
    score = prob * imp
    if score >= 15:
        return "High"
    elif score >= 8:
        return "Medium"
    else:
        return "Low"

def generate_status_report(conn: sqlite3.Connection) -> Dict[str, Any]:
    """Generates complete exportable status report payload."""
    charter = get_charter(conn)
    dashboard = get_dashboard_summary(conn)
    evm = calculate_evm(conn)
    schedule = compute_schedule(conn)
    milestones = get_milestones_with_status(conn)
    defects = get_defects(conn)
    risks = get_risks(conn)
    crs = get_change_requests(conn)
    integrity = run_integrity_audit(conn)
    
    return {
        "report_generated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "project": charter,
        "executive_summary": dashboard,
        "evm_metrics": evm,
        "schedule_summary": {
            "critical_path": schedule["critical_path"],
            "delayed_activities": schedule["delayed_activities"],
            "resource_conflicts": schedule["resource_conflicts"]
        },
        "milestones": milestones,
        "change_requests": crs,
        "defects": defects,
        "risks": risks["ranked_risks"],
        "integrity_audit": integrity
    }
