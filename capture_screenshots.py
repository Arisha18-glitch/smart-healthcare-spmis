"""
Automated Screenshot Capture Engine for Smart Healthcare SPMIS
Launches backend and frontend, connects via headless Chrome, captures high-resolution
screenshots of every single page and module, and saves them to:
1. c:\\Users\\saath\\Desktop\\Coding\\spm_system\\screenshots\\
2. c:\\Users\\saath\\Desktop\\SPMIS_Report_Screenshots\\
"""

import os
import sys
import time
import subprocess
import urllib.request
import json

BASE_DIR = r"c:\Users\saath\Desktop\Coding\spm_system"
BACKEND_DIR = os.path.join(BASE_DIR, "backend")
FRONTEND_DIR = os.path.join(BASE_DIR, "frontend")
OUTPUT_DIRS = [
    os.path.join(BASE_DIR, "screenshots"),
    r"c:\Users\saath\Desktop\SPMIS_Report_Screenshots"
]

# Ensure Node.js from NVM is in PATH
NODE_PATH = r"C:\Users\saath\AppData\Local\nvm\v22.12.0"
if os.path.exists(NODE_PATH) and NODE_PATH not in os.environ.get("PATH", ""):
    os.environ["PATH"] = NODE_PATH + os.pathsep + os.environ.get("PATH", "")

for d in OUTPUT_DIRS:
    os.makedirs(d, exist_ok=True)

def wait_for_url(url, timeout=30):
    start = time.time()
    while time.time() - start < timeout:
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, timeout=2) as resp:
                if resp.status in (200, 304):
                    return True
        except Exception:
            pass
        time.sleep(1)
    return False

def main():
    print("=======================================================")
    print("SPMIS AUTOMATED SCREENSHOT CAPTURE SUITE")
    print("=======================================================")

    py_exe = sys.executable

    # Reset sample data first
    print("[1/5] Resetting database to clean baseline...")
    subprocess.run([py_exe, os.path.join(BACKEND_DIR, "sample_data.py")], check=True)

    # Start Backend
    print("[2/5] Starting FastAPI Backend on port 8000...")
    backend_proc = subprocess.Popen(
        f'"{py_exe}" -m uvicorn main:app --host 127.0.0.1 --port 8000',
        cwd=BACKEND_DIR,
        shell=True
    )

    # Start Frontend
    print("[3/5] Starting Vite Frontend on port 5173...")
    frontend_proc = subprocess.Popen(
        "npm.cmd run dev",
        cwd=FRONTEND_DIR,
        shell=True,
        env=os.environ
    )

    driver = None
    try:
        print("[4/5] Waiting for servers to be healthy...")
        backend_ready = wait_for_url("http://127.0.0.1:8000/api/charter", timeout=25)
        frontend_ready = wait_for_url("http://127.0.0.1:5173/", timeout=25)
        if not frontend_ready:
            frontend_ready = wait_for_url("http://localhost:5173/", timeout=15)

        if not backend_ready:
            print("ERROR: Backend failed to respond on http://127.0.0.1:8000/api/charter")
            return
        if not frontend_ready:
            print("ERROR: Frontend failed to respond on http://localhost:5173/")
            return
        print("Both servers are healthy and listening!")

        # Import selenium
        from selenium import webdriver
        from selenium.webdriver.chrome.service import Service
        from selenium.webdriver.chrome.options import Options

        chrome_options = Options()
        chrome_options.add_argument("--headless=new")
        chrome_options.add_argument("--window-size=1600,1100")
        chrome_options.add_argument("--disable-gpu")
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")

        driver = webdriver.Chrome(options=chrome_options)
        driver.set_window_size(1600, 1100)

        # List of screenshots to take
        screenshots_plan = [
            ("fig01_dashboard.png", "http://127.0.0.1:5173/", 3, "Executive Dashboard with Health Badge, EVM Cards & Defect Counters"),
            ("fig02_charter_form.png", "http://127.0.0.1:5173/charter", 3, "Project Charter Form with Approved Budget & Baseline Dates"),
            ("fig03_management_plan.png", "http://127.0.0.1:5173/charter", 2, "Auto-Filled Subsidiary Project Management Plan View"),
            ("fig04_milestones.png", "http://127.0.0.1:5173/charter", 2, "Milestones & Target Dates Schedule Table"),
            ("fig05_requirements_list.png", "http://127.0.0.1:5173/scope", 3, "Requirements Traceability Matrix with Approval Status"),
            ("fig07_wbs_tree.png", "http://127.0.0.1:5173/scope", 2, "Hierarchical Work Breakdown Structure with Cost Roll-Up"),
            ("fig08_change_requests.png", "http://127.0.0.1:5173/scope", 2, "Change Request Evaluation Panel (CR-001 & CR-002 Impact Simulator)"),
            ("fig10_schedule_table.png", "http://127.0.0.1:5173/schedule", 3, "Activities Table with Dependencies, Durations & CPM Dates"),
            ("fig11_gantt_chart.png", "http://127.0.0.1:5173/schedule", 3, "Interactive SVG Gantt Chart with Critical Path Highlighting"),
            ("fig12_delay_impact.png", "http://127.0.0.1:5173/schedule", 2, "Delayed Activities Cascade Analysis Drawer"),
            ("fig13_evm_metrics.png", "http://127.0.0.1:5173/cost", 3, "EVM Financial Performance Dashboard & Governance Alert Warnings"),
            ("fig14_s_curve.png", "http://127.0.0.1:5173/cost", 3, "Cumulative S-Curve (PV vs. EV vs. AC) Line Graph"),
            ("fig15_defect_tracker.png", "http://127.0.0.1:5173/quality", 3, "Quality Defects Register with Severity Categorization"),
            ("fig16_quality_checklist.png", "http://127.0.0.1:5173/quality", 2, "Deliverable Quality Inspection Gates (Pass/Fail)"),
            ("fig17_risk_matrix.png", "http://127.0.0.1:5173/quality", 2, "5x5 Risk Probability-Impact Heatmap Matrix"),
            ("fig18_pdpc_tree.png", "http://127.0.0.1:5173/quality", 2, "Process Decision Program Chart (PDPC) Tree"),
            ("fig19_integrity_audit.png", "http://127.0.0.1:5173/integrity", 3, "Automated 6-Point Project Data Integrity Audit Inspector"),
            ("fig22_hospital_console.png", "http://127.0.0.1:5173/hospital", 3, "5-Hospital Unified Clinical Operations Management Console"),
            ("fig23_academic_report.png", "http://127.0.0.1:5173/report", 3, "Academic Examination Report View Formatted in Times New Roman")
        ]

        print(f"[5/5] Capturing {len(screenshots_plan)} application screenshots...")
        captured_files = []

        for filename, url, delay, desc in screenshots_plan:
            print(f"  -> Capturing {filename} ({desc})...")
            driver.get(url)
            time.sleep(delay)

            # Scroll adjustments for targeted elements
            if "management_plan" in filename or "milestones" in filename:
                driver.execute_script("window.scrollBy(0, 500);")
                time.sleep(0.5)
            elif "wbs_tree" in filename:
                driver.execute_script("window.scrollBy(0, 550);")
                time.sleep(0.5)
            elif "change_requests" in filename:
                driver.execute_script("window.scrollBy(0, 1000);")
                time.sleep(0.5)
            elif "gantt" in filename:
                driver.execute_script("window.scrollBy(0, 400);")
                time.sleep(0.5)
            elif "s_curve" in filename:
                driver.execute_script("window.scrollBy(0, 450);")
                time.sleep(0.5)
            elif "quality_checklist" in filename:
                driver.execute_script("window.scrollBy(0, 350);")
                time.sleep(0.5)
            elif "risk_matrix" in filename or "pdpc" in filename:
                driver.execute_script("window.scrollBy(0, 650);")
                time.sleep(0.5)

            for out_dir in OUTPUT_DIRS:
                target_path = os.path.join(out_dir, filename)
                driver.save_screenshot(target_path)
            captured_files.append(filename)

        print(f"SUCCESS: Captured {len(captured_files)} browser screenshots!")

    except Exception as e:
        print(f"EXCEPTION DURING CAPTURE: {e}")
    finally:
        if driver:
            try:
                driver.quit()
            except Exception:
                pass
        print("Cleaning up server background processes...")
        try:
            backend_proc.terminate()
            backend_proc.kill()
        except Exception:
            pass
        try:
            frontend_proc.terminate()
            frontend_proc.kill()
            if sys.platform == "win32":
                subprocess.run(["taskkill", "/F", "/IM", "node.exe"], stderr=subprocess.DEVNULL, stdout=subprocess.DEVNULL)
        except Exception:
            pass

if __name__ == "__main__":
    main()
