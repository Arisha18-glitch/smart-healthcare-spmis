import db
import logic
import sqlite3

def run_adversarial_tests():
    conn = db.get_db()
    print("=== 8 ADVERSARIAL TESTS RESULTS ===")

    # 1. Approve a requirement that is not in an approved change request
    try:
        logic.add_requirement(conn, {
            'req_code': 'REQ-BAD',
            'title': 'Direct Feature',
            'priority': 'High',
            'status': 'Approved',
            'category': 'Core'
        })
        print("1. Direct Requirement Approval: FAIL (Allowed)")
    except Exception as e:
        print("1. Direct Requirement Approval: BLOCKED -", type(e).__name__, ":", e)

    # 2. Add an activity that exceeds the approved budget
    try:
        logic.add_activity(conn, {
            'activity_code': 'ACT-EXP',
            'name': 'Too Expensive',
            'assignee_id': 2,
            'duration_days': 5,
            'estimated_cost': 999999999,
            'requirement_id': 1
        })
        print("2. Add Activity Exceeding Budget: FAIL (Allowed)")
    except Exception as e:
        print("2. Add Activity Exceeding Budget: BLOCKED -", type(e).__name__, ":", e)

    # 3. Create a circular dependency
    try:
        acts = [{'id': 1, 'activity_code': 'ACT-01'}, {'id': 2, 'activity_code': 'ACT-02'}]
        deps = [(1, 2), (2, 1)]  # 1 -> 2 and 2 -> 1
        cycle = logic.detect_circular_dependencies(acts, deps)
        if cycle:
            raise ValueError(f"Circular dependency detected between activities: {cycle}")
        print("3. Circular Dependency: FAIL (Allowed)")
    except Exception as e:
        print("3. Circular Dependency: BLOCKED -", type(e).__name__, ":", e)

    # 4. Set a deadline before the start date
    try:
        logic.validate_charter_dates_and_budget('2026-10-01', '2026-09-01', 5000000)
        print("4. Set Deadline Before Start: FAIL (Allowed)")
    except Exception as e:
        print("4. Set Deadline Before Start: BLOCKED -", type(e).__name__, ":", e)

    # 5. Close the project with unresolved critical defects
    try:
        logic.close_project(conn)
        print("5. Close Project with Critical Defects: FAIL (Allowed)")
    except Exception as e:
        print("5. Close Project with Critical Defects: BLOCKED -", type(e).__name__, ":", e)

    # 6. Approve the same change request twice
    try:
        # Check CR-01
        cr1 = conn.execute("SELECT status FROM change_requests WHERE id = 1").fetchone()
        if cr1 and cr1['status'] == 'Approved':
            logic.approve_change_request_transaction(conn, 1, "Attempting 2nd approval")
        else:
            logic.approve_change_request_transaction(conn, 1, "First approval")
            logic.approve_change_request_transaction(conn, 1, "Second approval")
        print("6. Duplicate CR Approval: FAIL (Allowed)")
    except Exception as e:
        print("6. Duplicate CR Approval: BLOCKED -", type(e).__name__, ":", e)

    # 7. Enter text where a number is expected
    try:
        import main
        main.ActivityCreate(
            activity_code='ACT-X',
            name='Test',
            assignee_id=1,
            duration_days='not_a_number',
            estimated_cost=100,
            requirement_id=1
        )
        print("7. Text in numeric field: FAIL (Allowed)")
    except Exception as e:
        print("7. Text in numeric field: BLOCKED -", type(e).__name__, ":", e)

    # 8. Delete an activity that others depend on
    try:
        # A01 has dependents (A02, A03)
        act1 = conn.execute("SELECT id FROM activities WHERE activity_code IN ('A01', 'ACT-01')").fetchone()
        logic.delete_activity(conn, act1['id'])
        print("8. Delete Activity with Dependents: FAIL (Allowed)")
    except Exception as e:
        print("8. Delete Activity with Dependents: BLOCKED -", type(e).__name__, ":", e)

    conn.close()

if __name__ == "__main__":
    run_adversarial_tests()
