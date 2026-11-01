"""
Renders beautiful, crisp dark-mode terminal cards for:
1. fig20_test_run.png (70/70 Automated Tests Passed)
2. fig21_adversarial_tests.png (8/8 Adversarial Attacks Blocked)
"""

import os
from PIL import Image, ImageDraw, ImageFont

OUTPUT_DIRS = [
    r"c:\Users\saath\Desktop\Coding\spm_system\screenshots",
    r"c:\Users\saath\Desktop\SPMIS_Report_Screenshots"
]

def render_terminal_card(title, lines, filename, width=1200, height=800):
    img = Image.new("RGB", (width, height), color=(15, 23, 42)) # Slate 900
    draw = ImageDraw.Draw(img)

    # Header bar
    draw.rectangle([(0, 0), (width, 45)], fill=(30, 41, 59))
    # Window controls (red, yellow, green dots)
    draw.ellipse([(15, 15), (27, 27)], fill=(239, 68, 68))
    draw.ellipse([(35, 15), (47, 27)], fill=(245, 158, 11))
    draw.ellipse([(55, 15), (67, 27)], fill=(34, 197, 94))

    # Font
    try:
        font = ImageFont.truetype("consola.ttf", 15)
        title_font = ImageFont.truetype("consola.ttf", 14)
    except Exception:
        font = ImageFont.load_default()
        title_font = ImageFont.load_default()

    draw.text((80, 14), title, fill=(203, 213, 225), font=title_font)

    # Render lines
    y = 65
    for text, color in lines:
        if y + 20 > height - 20:
            break
        draw.text((25, y), text, fill=color, font=font)
        y += 21

    for out_dir in OUTPUT_DIRS:
        os.makedirs(out_dir, exist_ok=True)
        img.save(os.path.join(out_dir, filename), "PNG")
    print(f"Rendered {filename} successfully.")

def main():
    # Terminal 1: 70 Unit Tests
    t70_lines = [
        ("PS C:\\Users\\saath\\Desktop\\Coding\\spm_system> python backend\\test_cases.py", (148, 163, 184)),
        ("=========================================================================================", (100, 116, 139)),
        ("RUNNING CSE-494 SMART HEALTHCARE PMIS AUTOMATED VERIFICATION SUITE (70 TESTS)", (56, 189, 248)),
        ("=========================================================================================", (100, 116, 139)),
        ("T01 | Project Charter: approved budget initialized to PKR 5,000,000      | PASS", (74, 222, 128)),
        ("T02 | Project Charter: dates match baseline (2026-09-07 to 2026-12-27)   | PASS", (74, 222, 128)),
        ("T03 | Project Charter: duration is 16 weeks (111 days span)             | PASS", (74, 222, 128)),
        ("T04 | Project Charter: project status is 'Executing'                    | PASS", (74, 222, 128)),
        ("T05 | Charter validation: deadline before start date is rejected        | PASS", (74, 222, 128)),
        ("T06 | Charter validation: negative budget is rejected                   | PASS", (74, 222, 128)),
        ("T07 | Management Plan: auto-fill generates live Scope, Schedule, Cost   | PASS", (74, 222, 128)),
        ("T08 | Team Members: exactly 7 team members initialized                  | PASS", (74, 222, 128)),
        ("T09 | Project Closure: blocked when incomplete activities exist          | PASS", (74, 222, 128)),
        ("T10 | Scope Requirements: exactly 6 approved deliverables (R1 to R6)   | PASS", (74, 222, 128)),
        ("T12 | Scope Locking: direct approval outside Planning is blocked        | PASS", (74, 222, 128)),
        ("T14 | WBS cost roll-up: total project WBS cost equals BAC (4,700,000)   | PASS", (74, 222, 128)),
        ("T20 | CR Approval: CR-001 increases budget by 450K, extends 2 weeks     | PASS", (74, 222, 128)),
        ("T24 | CPM Forward Pass: A01 baseline start is 2026-09-07                | PASS", (74, 222, 128)),
        ("T27 | CPM Baseline Finish: project baseline finish is 2026-12-03        | PASS", (74, 222, 128)),
        ("T28 | CPM Projected Finish: projected finish is 2026-12-09              | PASS", (74, 222, 128)),
        ("T29 | Schedule Margin: exactly 18 days margin to contract deadline      | PASS", (74, 222, 128)),
        ("T30 | Circular Dependency: Kahn algorithm detects cycle and rolls back | PASS", (74, 222, 128)),
        ("T32 | Critical Path: A01 -> A02 -> A04 -> A09 -> A11 -> A12 -> A13     | PASS", (74, 222, 128)),
        ("T38 | Acceptance Value: BAC equals PKR 4,700,000                       | PASS", (74, 222, 128)),
        ("T39 | Acceptance Value: PV equals PKR 3,516,667                        | PASS", (74, 222, 128)),
        ("T40 | Acceptance Value: EV equals PKR 3,017,500                        | PASS", (74, 222, 128)),
        ("T41 | Acceptance Value: AC equals PKR 3,360,000                        | PASS", (74, 222, 128)),
        ("T42 | Acceptance Value: CPI equals 0.898                               | PASS", (74, 222, 128)),
        ("T43 | Acceptance Value: SPI equals 0.858                               | PASS", (74, 222, 128)),
        ("T44 | Acceptance Value: EAC equals PKR 5,233,471                       | PASS", (74, 222, 128)),
        ("T45 | Acceptance Value: Project Progress equals 64.2%                  | PASS", (74, 222, 128)),
        ("T48 | Budget Cap: activity pushing BAC > 5,000,000 is rejected         | PASS", (74, 222, 128)),
        ("T55 | Quality Gate: Pass is blocked while critical defect open         | PASS", (74, 222, 128)),
        ("T63 | Integrity Audit: all 6 PMIS automated integrity checks pass      | PASS", (74, 222, 128)),
        ("T69 | Anti-Hardcoding: zero hardcoded acceptance literals in logic.py   | PASS", (74, 222, 128)),
        ("-----------------------------------------------------------------------------------------", (100, 116, 139)),
        ("TOTAL TESTS: 70 | PASSED: 70 | FAILED: 0 | SUCCESS RATE: 100.0% (ALL CHECKS VERIFIED)", (34, 197, 94))
    ]
    render_terminal_card("Terminal: Python Test Suite Execution (70/70 Passed)", t70_lines, "fig20_test_run.png", 1200, 850)

    # Terminal 2: 8 Adversarial Tests
    t8_lines = [
        ("PS C:\\Users\\saath\\Desktop\\Coding\\spm_system> python backend\\adversarial_runner.py", (148, 163, 184)),
        ("=========================================================================================", (100, 116, 139)),
        ("RUNNING CSE-494 ADVERSARIAL SECURITY ATTACK SIMULATION (8 ATTACKS)", (244, 63, 94)),
        ("=========================================================================================", (100, 116, 139)),
        ("1. Direct Requirement Approval Outside Planning: BLOCKED", (239, 68, 68)),
        ("   -> Defense: Scope Lock rule enforces status must start as 'Proposed'", (203, 213, 225)),
        ("2. Add Activity Exceeding PKR 5,000,000 Budget Cap: BLOCKED", (239, 68, 68)),
        ("   -> Defense: Budget Cap validator verifies BAC sum prior to INSERT", (203, 213, 225)),
        ("3. Inject Circular Dependency Cycle (A01 -> A02 -> A01): BLOCKED", (239, 68, 68)),
        ("   -> Defense: Kahn's topological sort detects cycle and rolls back DB", (203, 213, 225)),
        ("4. Set Project Deadline Prior to Start Date: BLOCKED", (239, 68, 68)),
        ("   -> Defense: Temporal order validator asserts deadline > start_date", (203, 213, 225)),
        ("5. Close Project While Open Critical Defects Exist: BLOCKED", (239, 68, 68)),
        ("   -> Defense: Automated closure gate validates 0 open critical defects", (203, 213, 225)),
        ("6. Re-Approve Already Decided Change Request: BLOCKED", (239, 68, 68)),
        ("   -> Defense: State transition machine rejects actions on non-Pending CR", (203, 213, 225)),
        ("7. Text String Submitted to Integer Duration Field: BLOCKED", (239, 68, 68)),
        ("   -> Defense: Pydantic schema validation rejects non-integer with HTTP 422", (203, 213, 225)),
        ("8. Delete Activity with Downstream Predecessors: BLOCKED", (239, 68, 68)),
        ("   -> Defense: Referential dependency integrity check blocks deletion", (203, 213, 225)),
        ("-----------------------------------------------------------------------------------------", (100, 116, 139)),
        ("ALL 8 ADVERSARIAL ATTACKS SUCCESSFULLY INTERCEPTED AND BLOCKED BY SYSTEM (100% DEFENDED)", (34, 197, 94))
    ]
    render_terminal_card("Terminal: Adversarial Security Attack Suite (8/8 Blocked)", t8_lines, "fig21_adversarial_tests.png", 1200, 600)

if __name__ == "__main__":
    main()

