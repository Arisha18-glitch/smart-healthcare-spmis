"""
FastAPI Application for Smart Healthcare Project Management System
Exposes RESTful endpoints for all 6 PM modules.
All business rules and EVM calculations are delegated to logic.py.
Handles errors with clear HTTP 400 and 404 responses.
CORS enabled for Vite dev frontend.
"""

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator
from typing import List, Optional, Dict, Any
import sqlite3

from db import get_db, init_db, DB_PATH
import logic
import sample_data

app = FastAPI(
    title="Smart Healthcare Project Management System API",
    description="Backend API for managing the 5-hospital network healthcare software project.",
    version="1.0.0"
)

# Enable CORS for Vite dev server and standard frontend ports
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_conn():
    conn = get_db()
    try:
        yield conn
    finally:
        conn.close()

# ------------------------------------------------------------------------------
# Pydantic Request Models
# ------------------------------------------------------------------------------

class CharterUpdate(BaseModel):
    title: str = Field(..., min_length=3)
    objectives: str = Field(..., min_length=5)
    stakeholders: str = Field(..., min_length=5)
    scope_boundaries: str = Field(..., min_length=5)
    approved_budget: float = Field(..., gt=0)
    start_date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$")
    deadline: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$")
    status: str = Field("Planning")
    cpi_threshold: float = Field(0.90, gt=0, le=1.5)
    spi_threshold: float = Field(0.90, gt=0, le=1.5)
    status_date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$")

class ManagementPlanUpdate(BaseModel):
    scope_plan: Optional[str] = ""
    schedule_plan: Optional[str] = ""
    cost_plan: Optional[str] = ""
    quality_plan: Optional[str] = ""

class RequirementCreate(BaseModel):
    req_code: str = Field(..., min_length=2)
    title: str = Field(..., min_length=3)
    description: Optional[str] = ""
    priority: str = Field("Medium")
    status: Optional[str] = "Proposed"
    category: Optional[str] = "Core Module"

    @field_validator("priority")
    def check_priority(cls, v):
        if v not in ("High", "Medium", "Low"):
            raise ValueError("Priority must be High, Medium, or Low")
        return v

    @field_validator("status")
    def check_status(cls, v):
        if v not in ("Proposed", "Approved", "Rejected"):
            raise ValueError("Status must be Proposed, Approved, or Rejected")
        return v

class RequirementUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    category: Optional[str] = None

class ChangeRequestCreate(BaseModel):
    cr_number: str = Field(..., min_length=2)
    title: str = Field(..., min_length=3)
    justification: str = Field(..., min_length=5)
    linked_requirement_id: int
    cost_impact: float = Field(..., ge=0)
    schedule_impact_weeks: int = Field(..., ge=0)

class DecisionPayload(BaseModel):
    decision_note: Optional[str] = ""

class ActivityCreate(BaseModel):
    activity_code: str = Field(..., min_length=2)
    name: str = Field(..., min_length=3)
    assignee_id: int
    duration_days: int = Field(..., gt=0)
    estimated_cost: float = Field(..., ge=0)
    requirement_id: int
    predecessor_ids: Optional[List[int]] = []
    progress_percent: Optional[float] = 0.0
    actual_cost: Optional[float] = 0.0
    delay_days: Optional[int] = 0

class ProgressUpdate(BaseModel):
    progress_percent: float = Field(..., ge=0.0, le=100.0)
    actual_cost: float = Field(..., ge=0.0)
    delay_days: int = Field(0, ge=0)

class DefectCreate(BaseModel):
    defect_code: str = Field(..., min_length=2)
    title: str = Field(..., min_length=3)
    severity: str = Field(...)
    assigned_to: Optional[int] = None
    activity_id: Optional[int] = None
    status: Optional[str] = "Open"
    reported_date: Optional[str] = None
    resolution_notes: Optional[str] = ""

    @field_validator("severity")
    def check_severity(cls, v):
        if v not in ("Critical", "High", "Medium", "Low"):
            raise ValueError("Severity must be Critical, High, Medium, or Low")
        return v

class DefectUpdate(BaseModel):
    status: Optional[str] = None
    resolution_notes: Optional[str] = None
    severity: Optional[str] = None
    assigned_to: Optional[int] = None

class InspectionPayload(BaseModel):
    result: str = Field(...)
    notes: Optional[str] = ""
    inspector_id: Optional[int] = None
    inspection_date: Optional[str] = None

class RiskCreate(BaseModel):
    risk_code: str = Field(..., min_length=2)
    title: str = Field(..., min_length=3)
    description: Optional[str] = ""
    likelihood: int = Field(..., ge=1, le=5)
    impact: int = Field(..., ge=1, le=5)
    status: Optional[str] = "Open"
    goal: str = Field(..., min_length=3)
    preventive_action: str = Field(..., min_length=3)
    corrective_action: str = Field(..., min_length=3)

# ------------------------------------------------------------------------------
# MODULE 1: INITIATION & INTEGRATION ROUTES
# ------------------------------------------------------------------------------

@app.get("/api/charter")
def get_charter(conn: sqlite3.Connection = Depends(get_conn)):
    try:
        return logic.get_charter(conn)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.put("/api/charter")
def update_charter(payload: CharterUpdate, conn: sqlite3.Connection = Depends(get_conn)):
    try:
        return logic.update_charter(conn, payload.model_dump())
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/management-plan")
def get_management_plan(conn: sqlite3.Connection = Depends(get_conn)):
    return logic.get_management_plan(conn)

@app.put("/api/management-plan")
def update_management_plan(payload: ManagementPlanUpdate, conn: sqlite3.Connection = Depends(get_conn)):
    return logic.update_management_plan(conn, payload.model_dump())

@app.post("/api/management-plan/auto-fill")
def auto_fill_management_plan(conn: sqlite3.Connection = Depends(get_conn)):
    try:
        return logic.auto_fill_management_plan(conn)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/project/close")
def close_project(conn: sqlite3.Connection = Depends(get_conn)):
    try:
        return logic.close_project(conn)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/team")
def get_team_members(conn: sqlite3.Connection = Depends(get_conn)):
    rows = conn.execute("SELECT * FROM team_members ORDER BY id").fetchall()
    return [dict(r) for r in rows]

# ------------------------------------------------------------------------------
# MODULE 2: SCOPE & WBS ROUTES
# ------------------------------------------------------------------------------

@app.get("/api/requirements")
def get_requirements(conn: sqlite3.Connection = Depends(get_conn)):
    return logic.get_requirements(conn)

@app.post("/api/requirements")
def add_requirement(payload: RequirementCreate, conn: sqlite3.Connection = Depends(get_conn)):
    try:
        return logic.add_requirement(conn, payload.model_dump())
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.put("/api/requirements/{req_id}")
def update_requirement(req_id: int, payload: RequirementUpdate, conn: sqlite3.Connection = Depends(get_conn)):
    try:
        return logic.update_requirement(conn, req_id, {k: v for k, v in payload.model_dump().items() if v is not None})
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/wbs")
def get_wbs(conn: sqlite3.Connection = Depends(get_conn)):
    try:
        return logic.generate_wbs(conn)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/change-requests")
def get_change_requests(conn: sqlite3.Connection = Depends(get_conn)):
    return logic.get_change_requests(conn)

@app.post("/api/change-requests")
def create_change_request(payload: ChangeRequestCreate, conn: sqlite3.Connection = Depends(get_conn)):
    try:
        return logic.create_change_request(conn, payload.model_dump())
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/change-requests/{cr_id}/approve")
def approve_change_request(cr_id: int, payload: DecisionPayload, conn: sqlite3.Connection = Depends(get_conn)):
    try:
        return logic.approve_change_request_transaction(conn, cr_id, payload.decision_note)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/change-requests/{cr_id}/reject")
def reject_change_request(cr_id: int, payload: DecisionPayload, conn: sqlite3.Connection = Depends(get_conn)):
    try:
        return logic.reject_change_request(conn, cr_id, payload.decision_note)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

# ------------------------------------------------------------------------------
# MODULE 3: SCHEDULE & RESOURCE MANAGEMENT ROUTES
# ------------------------------------------------------------------------------

@app.get("/api/schedule")
def get_schedule(conn: sqlite3.Connection = Depends(get_conn)):
    try:
        return logic.compute_schedule(conn)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/activities")
def add_activity(payload: ActivityCreate, conn: sqlite3.Connection = Depends(get_conn)):
    try:
        return logic.add_activity(conn, payload.model_dump())
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.put("/api/activities/{act_id}/progress")
def update_activity_progress(act_id: int, payload: ProgressUpdate, conn: sqlite3.Connection = Depends(get_conn)):
    try:
        return logic.update_activity_progress(conn, act_id, payload.model_dump())
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.delete("/api/activities/{act_id}")
def delete_activity(act_id: int, conn: sqlite3.Connection = Depends(get_conn)):
    try:
        return logic.delete_activity(conn, act_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/milestones")
def get_milestones(conn: sqlite3.Connection = Depends(get_conn)):
    try:
        return logic.get_milestones_with_status(conn)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ------------------------------------------------------------------------------
# MODULE 4: COST MANAGEMENT & EVM ROUTES
# ------------------------------------------------------------------------------

@app.get("/api/evm")
def get_evm(status_date: Optional[str] = None, conn: sqlite3.Connection = Depends(get_conn)):
    try:
        return logic.calculate_evm(conn, status_date)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/evm/s-curve")
def get_s_curve(conn: sqlite3.Connection = Depends(get_conn)):
    try:
        return logic.generate_s_curve_data(conn)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ------------------------------------------------------------------------------
# MODULE 5: QUALITY & RISK MANAGEMENT ROUTES
# ------------------------------------------------------------------------------

@app.get("/api/defects")
def get_defects(conn: sqlite3.Connection = Depends(get_conn)):
    return logic.get_defects(conn)

@app.post("/api/defects")
def add_defect(payload: DefectCreate, conn: sqlite3.Connection = Depends(get_conn)):
    try:
        return logic.add_defect(conn, payload.model_dump())
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.put("/api/defects/{def_id}")
def update_defect(def_id: int, payload: DefectUpdate, conn: sqlite3.Connection = Depends(get_conn)):
    try:
        return logic.update_defect(conn, def_id, {k: v for k, v in payload.model_dump().items() if v is not None})
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/quality/readiness")
def get_deliverable_readiness(conn: sqlite3.Connection = Depends(get_conn)):
    try:
        return logic.get_deliverable_readiness(conn)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/quality/inspect/{item_id}")
def record_quality_inspection(item_id: int, payload: InspectionPayload, conn: sqlite3.Connection = Depends(get_conn)):
    try:
        return logic.record_quality_inspection(conn, item_id, payload.model_dump())
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/risks")
def get_risks(conn: sqlite3.Connection = Depends(get_conn)):
    return logic.get_risks(conn)

@app.post("/api/risks")
def add_risk(payload: RiskCreate, conn: sqlite3.Connection = Depends(get_conn)):
    try:
        return logic.add_risk(conn, payload.model_dump())
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/pdpc")
def get_pdpc(conn: sqlite3.Connection = Depends(get_conn)):
    return logic.get_pdpc_view(conn)

# ------------------------------------------------------------------------------
# MODULE 6: DASHBOARD, INTEGRITY & REPORTING ROUTES
# ------------------------------------------------------------------------------

@app.get("/api/dashboard")
def get_dashboard(conn: sqlite3.Connection = Depends(get_conn)):
    try:
        return logic.get_dashboard_summary(conn)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/integrity")
def get_integrity_audit(conn: sqlite3.Connection = Depends(get_conn)):
    try:
        return logic.run_integrity_audit(conn)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/report")
def get_status_report(conn: sqlite3.Connection = Depends(get_conn)):
    try:
        return logic.generate_status_report(conn)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/sample-data/reset")
def reset_sample_data():
    try:
        sample_data.load_sample_data()
        return {"status": "success", "message": "Sample data reset to case study baseline successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==============================================================================
# WORKING HOSPITAL DELIVERABLE MODULES (5-HOSPITAL NETWORK LIVE OPERATIONS)
# ==============================================================================

import hospital_logic

class AppointmentBookingPayload(BaseModel):
    hospital_id: int
    doctor_id: int
    patient_name: str
    patient_phone: str = "0300-1234567"
    appointment_date: str
    time_slot: str
    notes: Optional[str] = ""
    trigger_race_condition: Optional[bool] = False

class LabReportPayload(BaseModel):
    hospital_id: int
    patient_name: str
    patient_mrn: str
    test_name: str
    category: str
    result_value: str
    normal_range: str
    unit: str
    flag: Optional[str] = "Normal"
    doctor_notes: Optional[str] = ""

class BillingInvoicePayload(BaseModel):
    hospital_id: int
    patient_name: str
    patient_mrn: str
    bed_charges: float = 0.0
    consultation_fee: float = 0.0
    lab_charges: float = 0.0
    pharmacy_charges: float = 0.0
    payment_status: str = "Paid"
    payment_method: str = "Cash"

class AiTriagePayload(BaseModel):
    symptoms: str
    patient_age: Optional[int] = 35
    gender: Optional[str] = "Male"

class ConsultationSessionPayload(BaseModel):
    session_status: str
    diagnosis_notes: Optional[str] = ""
    prescription: Optional[str] = ""

@app.get("/api/hospital/overview")
def get_hospital_overview(conn: sqlite3.Connection = Depends(get_conn)):
    return hospital_logic.get_hospitals_overview(conn)

@app.get("/api/hospital/doctors")
def get_hospital_doctors(hospital_id: Optional[int] = None, conn: sqlite3.Connection = Depends(get_conn)):
    return hospital_logic.get_doctors_list(conn, hospital_id)

@app.get("/api/hospital/appointments")
def get_hospital_appointments(hospital_id: Optional[int] = None, conn: sqlite3.Connection = Depends(get_conn)):
    return hospital_logic.get_appointments_list(conn, hospital_id)

@app.post("/api/hospital/appointments")
def book_hospital_appointment(payload: AppointmentBookingPayload, conn: sqlite3.Connection = Depends(get_conn)):
    try:
        return hospital_logic.book_appointment(conn, payload.model_dump(), trigger_race_condition=payload.trigger_race_condition or False)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/hospital/doctor-shifts")
def get_hospital_shifts(hospital_id: Optional[int] = None, conn: sqlite3.Connection = Depends(get_conn)):
    return hospital_logic.get_doctor_shifts_matrix(conn, hospital_id)

@app.get("/api/hospital/lab-reports")
def get_hospital_lab_reports(hospital_id: Optional[int] = None, search: Optional[str] = None, conn: sqlite3.Connection = Depends(get_conn)):
    return hospital_logic.get_lab_reports_list(conn, hospital_id, search)

@app.post("/api/hospital/lab-reports")
def add_hospital_lab_report(payload: LabReportPayload, conn: sqlite3.Connection = Depends(get_conn)):
    try:
        return hospital_logic.create_lab_report(conn, payload.model_dump())
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/hospital/consultations")
def get_hospital_consultations(conn: sqlite3.Connection = Depends(get_conn)):
    return hospital_logic.get_online_consultations_list(conn)

@app.put("/api/hospital/consultations/{consult_id}")
def update_hospital_consultation(consult_id: int, payload: ConsultationSessionPayload, conn: sqlite3.Connection = Depends(get_conn)):
    try:
        return hospital_logic.update_consultation_session(conn, consult_id, payload.model_dump())
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/hospital/billing")
def get_hospital_billing(conn: sqlite3.Connection = Depends(get_conn)):
    return hospital_logic.get_billing_invoices_list(conn)

@app.post("/api/hospital/billing")
def add_hospital_billing(payload: BillingInvoicePayload, conn: sqlite3.Connection = Depends(get_conn)):
    try:
        return hospital_logic.create_billing_invoice(conn, payload.model_dump())
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/hospital/emr")
def get_hospital_emr(tenant_hospital_id: Optional[int] = None, simulate_leakage: bool = False, conn: sqlite3.Connection = Depends(get_conn)):
    return hospital_logic.get_patient_emr_vault(conn, tenant_hospital_id, simulate_leakage_defect=simulate_leakage)

@app.post("/api/hospital/ai-triage")
def run_hospital_ai_triage(payload: AiTriagePayload):
    try:
        return hospital_logic.run_ai_symptom_triage(payload.symptoms, payload.patient_age or 35, payload.gender or "Male")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
