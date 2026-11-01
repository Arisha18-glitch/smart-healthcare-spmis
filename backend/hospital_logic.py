"""
Hospital Modules Business Logic & Deliverable Operations
Implements real, functional working modules for the 5-Hospital Network:
1. Appointments & Concurrency Engine (with DEF-01 double-booking race condition toggle)
2. Doctor Schedules & Shift Rota Matrix
3. Lab Diagnostics & Report Dispatch
4. Telemedicine & Online Consultation Portal
5. Multi-Hospital Billing & Insurance Claims Calculator
6. Patient EMR Vault (with DEF-02 tenant partition key leakage test)
7. AI Diagnosis & Symptom Checker (CR-01 Deliverable)
"""

import sqlite3
from typing import Dict, Any, List, Optional
from datetime import datetime

# ------------------------------------------------------------------------------
# SEEDING REAL HOSPITAL DATA
# ------------------------------------------------------------------------------

def seed_hospital_data(conn: sqlite3.Connection):
    """Populates realistic clinical and operational data for the 5 hospitals."""
    cursor = conn.cursor()
    
    # Check if already seeded
    cnt = cursor.execute("SELECT COUNT(*) as count FROM hospitals").fetchone()["count"]
    if cnt >= 5:
        return

    # 1. The 5 Network Hospitals
    hospitals = [
        (1, 'H-01', 'Jinnah Hospital Lahore', 'Lahore (Allama Iqbal Town)', 1500, '+92-42-99231400'),
        (2, 'H-02', 'Services Hospital Lahore', 'Lahore (Jail Road)', 1250, '+92-42-99205517'),
        (3, 'H-03', 'Mayo Hospital Lahore', 'Lahore (Anarkali)', 2300, '+92-42-99211100'),
        (4, 'H-04', 'Lahore General Hospital', 'Lahore (Ferozepur Road)', 1000, '+92-42-99268800'),
        (5, 'H-05', 'The Children\'s Hospital Lahore', 'Lahore (Ferozepur Road)', 1100, '+92-42-99230901')
    ]
    cursor.executemany("""
        INSERT OR REPLACE INTO hospitals (id, code, name, city, total_beds, emergency_contact)
        VALUES (?, ?, ?, ?, ?, ?)
    """, hospitals)

    # 2. Doctors across the 5 Hospitals
    doctors = [
        (1, 1, 'Prof. Dr. Tariq Mahmood', 'Cardiology', 'Department of Cardiology', 'Room 204, OPD Block A', 2500.0, 'Mon, Wed, Fri'),
        (2, 1, 'Dr. Sarah Bilal', 'Neurology', 'Department of Neurology', 'Room 112, OPD Block A', 2000.0, 'Tue, Thu, Sat'),
        (3, 2, 'Prof. Dr. Javaid Iqbal', 'General Surgery', 'Surgical Unit 1', 'Room 305, Main Block', 2200.0, 'Mon, Tue, Thu'),
        (4, 2, 'Dr. Amina Farooq', 'Pulmonology', 'Chest & Respiratory Care', 'Room 108, Clinic Wing', 1800.0, 'Mon-Fri'),
        (5, 3, 'Dr. Kamran Akram', 'Orthopedics & Trauma', 'Trauma Centre', 'Emergency Room 4', 2000.0, 'Mon, Wed, Sat'),
        (6, 3, 'Dr. Zainab Hashmi', 'Internal Medicine', 'Medical Unit 3', 'Room 215, South Wing', 1500.0, 'Mon-Sat'),
        (7, 4, 'Dr. Usman Ghani', 'Neurosurgery', 'Spine & Brain Clinic', 'Room 402, LGH Neuro Block', 2500.0, 'Tue, Thu'),
        (8, 4, 'Dr. Maria Khalid', 'Pathology & Diagnostics', 'Central Diagnostic Lab', 'Lab Office 1', 1200.0, 'Mon-Fri'),
        (9, 5, 'Prof. Dr. Sajid Maqbool', 'Pediatrics', 'Pediatric Medicine Unit', 'Room 101, Child OPD', 2000.0, 'Mon, Wed, Fri'),
        (10, 5, 'Dr. Hina Rizvi', 'Pediatric Cardiology', 'Pediatric Cardiac Centre', 'Room 202, Child OPD', 2200.0, 'Tue, Thu')
    ]
    cursor.executemany("""
        INSERT OR REPLACE INTO doctors (id, hospital_id, name, specialization, department, room_no, fee_pkr, available_days)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, doctors)

    # 3. Appointments (Real Booking Data)
    appointments = [
        (1, 1, 1, 'Muhammad Arshad', '0300-4567891', '2026-10-27', '09:00 - 09:30 AM', 'Confirmed', 'Cardiac evaluation post-angioplasty'),
        (2, 1, 1, 'Shahid Mehmood', '0321-8765432', '2026-10-27', '09:30 - 10:00 AM', 'Confirmed', 'Hypertension follow-up and ECG check'),
        (3, 1, 2, 'Zubair Ahmed', '0333-1122334', '2026-10-27', '10:00 - 10:30 AM', 'In Consultation', 'Frequent migraine and episodic dizziness'),
        (4, 2, 3, 'Rashid Latif', '0345-9988776', '2026-10-28', '11:00 - 11:30 AM', 'Confirmed', 'Post-operative hernia checkup'),
        (5, 2, 4, 'Nasreen Akhtar', '0312-3344556', '2026-10-28', '11:30 - 12:00 PM', 'Confirmed', 'Asthma exacerbation and inhaler review'),
        (6, 3, 5, 'Ghulam Murtaza', '0301-7788990', '2026-10-29', '02:00 - 02:30 PM', 'Confirmed', 'Knee arthroscopy rehabilitation assessment'),
        (7, 5, 9, 'Baby Zainab (Mother: Saira)', '0322-6655443', '2026-10-27', '10:00 - 10:30 AM', 'Confirmed', 'Persistent fever and pediatric cough for 4 days'),
        (8, 5, 10, 'Master Ali (Father: Imran)', '0300-1122445', '2026-10-29', '11:00 - 11:30 AM', 'Confirmed', 'Congenital heart murmur evaluation')
    ]
    cursor.executemany("""
        INSERT OR REPLACE INTO appointments (id, hospital_id, doctor_id, patient_name, patient_phone, appointment_date, time_slot, status, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, appointments)

    # 4. Doctor Shifts Matrix across 5 Hospitals
    shifts = [
        (1, 1, 1, '2026-10-26', 'Morning (08:00 - 14:00)', 'Department of Cardiology', 'On Duty'),
        (2, 1, 2, '2026-10-26', 'Evening (14:00 - 20:00)', 'Department of Neurology', 'Scheduled'),
        (3, 2, 3, '2026-10-26', 'Morning (08:00 - 14:00)', 'Surgical Unit 1', 'On Duty'),
        (4, 2, 4, '2026-10-26', 'Night (20:00 - 08:00)', 'Chest & Respiratory Care', 'Scheduled'),
        (5, 3, 5, '2026-10-26', 'Morning (08:00 - 14:00)', 'Trauma Centre', 'On Duty'),
        (6, 3, 6, '2026-10-26', 'On-Call Emergency', 'Medical Unit 3', 'Scheduled'),
        (7, 4, 7, '2026-10-26', 'Morning (08:00 - 14:00)', 'Spine & Brain Clinic', 'On Duty'),
        (8, 5, 9, '2026-10-26', 'Morning (08:00 - 14:00)', 'Pediatric Medicine Unit', 'On Duty'),
        (9, 5, 10, '2026-10-26', 'Evening (14:00 - 20:00)', 'Pediatric Cardiac Centre', 'Scheduled')
    ]
    cursor.executemany("""
        INSERT OR REPLACE INTO doctor_shifts (id, hospital_id, doctor_id, shift_date, shift_type, department, duty_status)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, shifts)

    # 5. Lab Reports with Clinical Values
    lab_reports = [
        (1, 1, 'Muhammad Arshad', 'MRN-JIN-10492', 'Complete Blood Count (CBC)', 'Hematology', 'Hemoglobin: 13.8, WBC: 7,400, Platelets: 245,000', 'Hb: 13-17 g/dL, WBC: 4000-11000/mcL', 'g/dL & /mcL', 'Normal', 'Within normal adult reference limits.', '2026-10-25'),
        (2, 1, 'Muhammad Arshad', 'MRN-JIN-10492', 'Lipid Profile Screen', 'Biochemistry', 'Total Cholesterol: 248, LDL: 165, HDL: 38, Triglycerides: 225', 'Chol < 200, LDL < 100, HDL > 40', 'mg/dL', 'Abnormal', 'Elevated LDL and serum triglycerides. Atorvastatin 20mg recommended.', '2026-10-25'),
        (3, 2, 'Nasreen Akhtar', 'MRN-SRV-20831', 'Arterial Blood Gases (ABG)', 'Biochemistry', 'pH: 7.34, pO2: 78, pCO2: 48, HCO3: 26, SpO2: 92%', 'pH: 7.35-7.45, pO2: 80-100', 'mmHg', 'Abnormal', 'Mild respiratory acidosis secondary to acute bronchospasm.', '2026-10-24'),
        (4, 2, 'Tariq Javed', 'MRN-SRV-30114', 'Glycated Hemoglobin (HbA1c)', 'Biochemistry', 'HbA1c: 9.4%', 'Normal: < 5.7%, Diabetic: > 6.5%', '%', 'Critical', 'Severely unmanaged Type 2 Diabetes Mellitus. Endocrinology referral advised.', '2026-10-24'),
        (5, 3, 'Ghulam Murtaza', 'MRN-MYO-40912', 'MRI Right Knee Joint', 'Radiology', 'Grade II tear of posterior horn of medial meniscus. Joint effusion present.', 'Intact menisci and cruciate ligaments', 'Visual', 'Abnormal', 'Orthopedic surgical consultation recommended.', '2026-10-23'),
        (6, 4, 'Babar Azam', 'MRN-LGH-50821', 'Renal Function Tests (RFT)', 'Biochemistry', 'Serum Creatinine: 1.1, Urea: 28, eGFR: > 90', 'Creatinine: 0.7-1.3 mg/dL, Urea: 15-45 mg/dL', 'mg/dL', 'Normal', 'Normal renal excretion profile.', '2026-10-25'),
        (7, 5, 'Baby Zainab', 'MRN-CHD-60192', 'Blood Culture & Sensitivity', 'Microbiology', 'No bacterial growth after 48 hours of aerobic incubation.', 'Sterile (No Growth)', 'Growth', 'Normal', 'Bacterial sepsis ruled out. Viral prodrome suspected.', '2026-10-26')
    ]
    cursor.executemany("""
        INSERT OR REPLACE INTO lab_reports (id, hospital_id, patient_name, patient_mrn, test_name, category, result_value, normal_range, unit, flag, doctor_notes, reported_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, lab_reports)

    # 6. Online Consultations & Telehealth
    consultations = [
        (1, 1, 1, 'Pervez Musharraf', 'Cardiac Review', 'Completed', 'Patient reports stable exercise tolerance without angina. BP 125/80.', 'Tab. Nebivolol 5mg OD, Tab. Aspirin 75mg OD.', 2500.0),
        (2, 2, 4, 'Farah Naz', 'Pulmonology Followup', 'In Progress', 'Post-COVID interstitial lung monitoring. Inhaler compliance confirmed.', 'Inhaler Budesonide/Formoterol 200/6 2 puffs BD.', 1800.0),
        (3, 5, 9, 'Baby Hamza (Mother: Rabia)', 'Pediatric Teleguidance', 'Waiting Room', 'Pediatric rash over trunk and arms, mild fever.', 'Syrup Paracetamol 120mg TDS as needed for fever.', 1500.0)
    ]
    cursor.executemany("""
        INSERT OR REPLACE INTO online_consultations (id, hospital_id, doctor_id, patient_name, consultation_type, session_status, diagnosis_notes, prescription, fee_pkr)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, consultations)

    # 7. Billing & Invoices
    invoices = [
        (1, 1, 'INV-JIN-2026-001', 'Muhammad Arshad', 'MRN-JIN-10492', 15000.0, 2500.0, 6500.0, 4500.0, 1425.0, 29925.0, 'Paid', 'Sehat Card Plus'),
        (2, 2, 'INV-SRV-2026-002', 'Nasreen Akhtar', 'MRN-SRV-20831', 8000.0, 1800.0, 3200.0, 2900.0, 795.0, 16695.0, 'Paid', 'Cash'),
        (3, 3, 'INV-MYO-2026-003', 'Ghulam Murtaza', 'MRN-MYO-40912', 0.0, 2000.0, 12000.0, 1500.0, 775.0, 16275.0, 'Pending Insurance', 'Corporate Insurance'),
        (4, 4, 'INV-LGH-2026-004', 'Babar Azam', 'MRN-LGH-50821', 0.0, 1500.0, 2200.0, 800.0, 225.0, 4725.0, 'Paid', 'Credit Card'),
        (5, 5, 'INV-CHD-2026-005', 'Baby Zainab', 'MRN-CHD-60192', 5000.0, 2000.0, 4500.0, 2100.0, 680.0, 14280.0, 'Unpaid', 'Cash')
    ]
    cursor.executemany("""
        INSERT OR REPLACE INTO billing_invoices (id, hospital_id, invoice_no, patient_name, patient_mrn, bed_charges, consultation_fee, lab_charges, pharmacy_charges, tax_pkr, total_pkr, payment_status, payment_method)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, invoices)

    # 8. Patient EMR Vault (Tenant Partition Key = hospital_id)
    emrs = [
        (1, 1, 'MRN-JIN-10492', 'Muhammad Arshad', 54, 'Male', 'B+ Positive', 'Ischemic Heart Disease, Essential Hypertension', 'Penicillin (Severe anaphylaxis)', 'Aspirin 75mg, Atorvastatin 20mg, Amlodipine 5mg', '2026-10-25'),
        (2, 2, 'MRN-SRV-20831', 'Nasreen Akhtar', 46, 'Female', 'O+ Positive', 'Chronic Bronchial Asthma, Allergic Rhinitis', 'Sulfa Antibiotics', 'Salbutamol Inhaler, Montelukast 10mg', '2026-10-24'),
        (3, 3, 'MRN-MYO-40912', 'Ghulam Murtaza', 38, 'Male', 'A+ Positive', 'Traumatic Meniscal Injury (Right Knee)', 'NSAIDs (Gastric Ulceration)', 'Paracetamol 1g, Glucosamine Sulphate', '2026-10-23'),
        (4, 4, 'MRN-LGH-50821', 'Babar Azam', 29, 'Male', 'AB+ Positive', 'Migraine with Aura, Cervical Radiculopathy', 'None Known', 'Zolmitriptan 2.5mg PRN', '2026-10-25'),
        (5, 5, 'MRN-CHD-60192', 'Baby Zainab', 3, 'Female', 'O- Negative', 'Recurrent Upper Respiratory Tract Infections', 'Ceftriaxone', 'Paracetamol Syrup, Saline Nasal Drops', '2026-10-26')
    ]
    cursor.executemany("""
        INSERT OR REPLACE INTO patient_emr (id, hospital_id, mrn, patient_name, age, gender, blood_group, chronic_conditions, allergies, current_medications, last_visit_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, emrs)

    conn.commit()


# ------------------------------------------------------------------------------
# OPERATIONAL MODULE LOGIC & DEFECT SIMULATION
# ------------------------------------------------------------------------------

def get_hospitals_overview(conn: sqlite3.Connection) -> List[Dict[str, Any]]:
    """Returns the 5 network hospitals with live counts of doctors, appointments, and beds."""
    rows = conn.execute("""
        SELECT 
            h.*,
            (SELECT COUNT(*) FROM doctors d WHERE d.hospital_id = h.id) as doctor_count,
            (SELECT COUNT(*) FROM appointments a WHERE a.hospital_id = h.id) as appointment_count,
            (SELECT COUNT(*) FROM billing_invoices b WHERE b.hospital_id = h.id AND b.payment_status = 'Paid') as paid_invoices_count,
            (SELECT COALESCE(SUM(b.total_pkr), 0) FROM billing_invoices b WHERE b.hospital_id = h.id AND b.payment_status = 'Paid') as revenue_collected_pkr
        FROM hospitals h
        ORDER BY h.id
    """).fetchall()
    return [dict(r) for r in rows]

def get_doctors_list(conn: sqlite3.Connection, hospital_id: Optional[int] = None) -> List[Dict[str, Any]]:
    query = """
        SELECT d.*, h.name as hospital_name, h.code as hospital_code
        FROM doctors d
        JOIN hospitals h ON d.hospital_id = h.id
    """
    params = ()
    if hospital_id:
        query += " WHERE d.hospital_id = ?"
        params = (hospital_id,)
    query += " ORDER BY d.hospital_id, d.name"
    rows = conn.execute(query, params).fetchall()
    return [dict(r) for r in rows]

def book_appointment(conn: sqlite3.Connection, appt_data: Dict[str, Any], trigger_race_condition: bool = False) -> Dict[str, Any]:
    """
    Books an appointment slot.
    If trigger_race_condition is False:
       Validates doctor availability and PREVENTS double-booking (Fix for DEF-01).
    If trigger_race_condition is True:
       Demonstrates the case study critical defect DEF-01: bypassing slot lock causing double-booking!
    """
    hospital_id = int(appt_data["hospital_id"])
    doctor_id = int(appt_data["doctor_id"])
    date = appt_data["appointment_date"]
    slot = appt_data["time_slot"]
    patient_name = appt_data["patient_name"].strip()
    phone = appt_data.get("patient_phone", "0300-0000000").strip()
    notes = appt_data.get("notes", "")

    if not patient_name:
        raise ValueError("Patient name is required.")
    if not date or not slot:
        raise ValueError("Appointment date and time slot are required.")

    # Check existing booking on this doctor and slot
    existing = conn.execute("""
        SELECT a.*, d.name as doctor_name 
        FROM appointments a
        JOIN doctors d ON a.doctor_id = d.id
        WHERE a.doctor_id = ? AND a.appointment_date = ? AND a.time_slot = ? AND a.status != 'Cancelled'
    """, (doctor_id, date, slot)).fetchone()

    if existing and not trigger_race_condition:
        raise ValueError(
            f"SLOT CONFLICT (DEF-01 Lock Engaged): Doctor {existing['doctor_name']} is already booked "
            f"for time slot '{slot}' on {date} by patient '{existing['patient_name']}'. "
            f"Please choose another time slot."
        )

    # Insert appointment
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO appointments (hospital_id, doctor_id, patient_name, patient_phone, appointment_date, time_slot, status, notes)
        VALUES (?, ?, ?, ?, ?, ?, 'Confirmed', ?)
    """, (hospital_id, doctor_id, patient_name, phone, date, slot, notes))
    conn.commit()

    new_id = cursor.lastrowid
    row = conn.execute("""
        SELECT a.*, d.name as doctor_name, d.specialization, h.name as hospital_name
        FROM appointments a
        JOIN doctors d ON a.doctor_id = d.id
        JOIN hospitals h ON a.hospital_id = h.id
        WHERE a.id = ?
    """, (new_id,)).fetchone()
    
    res = dict(row)
    if existing and trigger_race_condition:
        res["warning"] = f"CRITICAL DEFECT DEF-01 TRIGGERED: Double booking allowed! Slot {slot} is now held by both {existing['patient_name']} and {patient_name}."
    return res

def get_appointments_list(conn: sqlite3.Connection, hospital_id: Optional[int] = None) -> List[Dict[str, Any]]:
    query = """
        SELECT a.*, d.name as doctor_name, d.specialization, d.room_no, h.name as hospital_name, h.code as hospital_code
        FROM appointments a
        JOIN doctors d ON a.doctor_id = d.id
        JOIN hospitals h ON a.hospital_id = h.id
    """
    params = ()
    if hospital_id:
        query += " WHERE a.hospital_id = ?"
        params = (hospital_id,)
    query += " ORDER BY a.appointment_date DESC, a.time_slot ASC"
    rows = conn.execute(query, params).fetchall()
    return [dict(r) for r in rows]

def get_doctor_shifts_matrix(conn: sqlite3.Connection, hospital_id: Optional[int] = None) -> List[Dict[str, Any]]:
    query = """
        SELECT s.*, d.name as doctor_name, d.specialization, h.name as hospital_name
        FROM doctor_shifts s
        JOIN doctors d ON s.doctor_id = d.id
        JOIN hospitals h ON s.hospital_id = h.id
    """
    params = ()
    if hospital_id:
        query += " WHERE s.hospital_id = ?"
        params = (hospital_id,)
    query += " ORDER BY s.shift_date, s.shift_type"
    rows = conn.execute(query, params).fetchall()
    return [dict(r) for r in rows]

def get_lab_reports_list(conn: sqlite3.Connection, hospital_id: Optional[int] = None, search: Optional[str] = None) -> List[Dict[str, Any]]:
    query = """
        SELECT l.*, h.name as hospital_name
        FROM lab_reports l
        JOIN hospitals h ON l.hospital_id = h.id
        WHERE 1=1
    """
    params = []
    if hospital_id:
        query += " AND l.hospital_id = ?"
        params.append(hospital_id)
    if search:
        query += " AND (l.patient_name LIKE ? OR l.patient_mrn LIKE ? OR l.test_name LIKE ?)"
        s = f"%{search}%"
        params.extend([s, s, s])
    query += " ORDER BY l.reported_date DESC"
    rows = conn.execute(query, tuple(params)).fetchall()
    return [dict(r) for r in rows]

def create_lab_report(conn: sqlite3.Connection, data: Dict[str, Any]) -> Dict[str, Any]:
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO lab_reports (
            hospital_id, patient_name, patient_mrn, test_name, category,
            result_value, normal_range, unit, flag, doctor_notes, reported_date
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, date('now'))
    """, (
        int(data["hospital_id"]), data["patient_name"], data["patient_mrn"],
        data["test_name"], data["category"], data["result_value"],
        data["normal_range"], data["unit"], data.get("flag", "Normal"),
        data.get("doctor_notes", "")
    ))
    conn.commit()
    row = conn.execute("SELECT * FROM lab_reports WHERE id = ?", (cursor.lastrowid,)).fetchone()
    return dict(row)

def get_online_consultations_list(conn: sqlite3.Connection) -> List[Dict[str, Any]]:
    rows = conn.execute("""
        SELECT c.*, d.name as doctor_name, d.specialization, h.name as hospital_name
        FROM online_consultations c
        JOIN doctors d ON c.doctor_id = d.id
        JOIN hospitals h ON c.hospital_id = h.id
        ORDER BY c.created_at DESC
    """).fetchall()
    return [dict(r) for r in rows]

def update_consultation_session(conn: sqlite3.Connection, consult_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
    conn.execute("""
        UPDATE online_consultations
        SET session_status = :status,
            diagnosis_notes = :diag,
            prescription = :rx
        WHERE id = :id
    """, {
        "id": consult_id,
        "status": data.get("session_status", "Completed"),
        "diag": data.get("diagnosis_notes", ""),
        "rx": data.get("prescription", "")
    })
    conn.commit()
    row = conn.execute("SELECT * FROM online_consultations WHERE id = ?", (consult_id,)).fetchone()
    return dict(row)

def get_billing_invoices_list(conn: sqlite3.Connection) -> List[Dict[str, Any]]:
    rows = conn.execute("""
        SELECT b.*, h.name as hospital_name
        FROM billing_invoices b
        JOIN hospitals h ON b.hospital_id = h.id
        ORDER BY b.id DESC
    """).fetchall()
    return [dict(r) for r in rows]

def create_billing_invoice(conn: sqlite3.Connection, data: Dict[str, Any]) -> Dict[str, Any]:
    bed = float(data.get("bed_charges", 0.0))
    doc = float(data.get("consultation_fee", 0.0))
    lab = float(data.get("lab_charges", 0.0))
    rx = float(data.get("pharmacy_charges", 0.0))
    subtotal = bed + doc + lab + rx
    tax = round(subtotal * 0.05, 2) # 5% healthcare service tax
    total = round(subtotal + tax, 2)
    inv_no = f"INV-GEN-{int(datetime.now().timestamp())}"

    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO billing_invoices (
            hospital_id, invoice_no, patient_name, patient_mrn,
            bed_charges, consultation_fee, lab_charges, pharmacy_charges,
            tax_pkr, total_pkr, payment_status, payment_method
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        int(data["hospital_id"]), inv_no, data["patient_name"], data["patient_mrn"],
        bed, doc, lab, rx, tax, total, data.get("payment_status", "Paid"),
        data.get("payment_method", "Cash")
    ))
    conn.commit()
    row = conn.execute("SELECT * FROM billing_invoices WHERE id = ?", (cursor.lastrowid,)).fetchone()
    return dict(row)

def get_patient_emr_vault(conn: sqlite3.Connection, tenant_hospital_id: Optional[int] = None, simulate_leakage_defect: bool = False) -> List[Dict[str, Any]]:
    """
    Returns patient EMR records.
    If simulate_leakage_defect is False:
       Strictly isolates records by tenant_hospital_id (Proper Multi-Tenant HIPAA security).
    If simulate_leakage_defect is True:
       Demonstrates the case study critical defect DEF-02:
       Missing tenant partition key exposes patient records across different hospital branches!
    """
    query = """
        SELECT p.*, h.name as hospital_name, h.code as hospital_code
        FROM patient_emr p
        JOIN hospitals h ON p.hospital_id = h.id
    """
    params = ()
    if tenant_hospital_id and not simulate_leakage_defect:
        query += " WHERE p.hospital_id = ?"
        params = (tenant_hospital_id,)
    query += " ORDER BY p.id"
    rows = conn.execute(query, params).fetchall()
    return [dict(r) for r in rows]

def run_ai_symptom_triage(symptoms: str, age: int = 35, gender: str = "Male") -> Dict[str, Any]:
    """
    CR-01 AI Diagnosis & Triage Engine.
    Evaluates patient symptoms against clinical rules to output suggested condition,
    urgency classification (Emergency / Urgent / Routine), and department routing.
    """
    s_lower = symptoms.lower()
    
    # 1. Cardiac & Emergency
    if any(k in s_lower for k in ["chest pain", "angina", "left arm", "shortness of breath", "sweating", "heart attack"]):
        return {
            "suggested_condition": "Acute Coronary Syndrome (Suspected Myocardial Infarction)",
            "urgency_level": "Emergency",
            "confidence_score": 0.94,
            "recommended_department": "Emergency Cardiology & Cath Lab",
            "clinical_advice": "CRITICAL: Immediate 12-lead ECG and Troponin-I test required. Transfer to Jinnah or Mayo Cardiac CCU.",
            "recommended_hospitals": ["Jinnah Hospital Lahore", "Mayo Hospital Lahore"]
        }
    # 2. Neurological / Stroke
    elif any(k in s_lower for k in ["slurred speech", "facial droop", "paralysis", "weakness one side", "stroke", "seizure"]):
        return {
            "suggested_condition": "Acute Cerebrovascular Event (Stroke / CVA)",
            "urgency_level": "Emergency",
            "confidence_score": 0.91,
            "recommended_department": "Emergency Neurosurgery / Stroke Unit",
            "clinical_advice": "CRITICAL: FAST protocol triggered. Immediate non-contrast CT Brain to rule out hemorrhage.",
            "recommended_hospitals": ["Lahore General Hospital (Neuro Centre)", "Jinnah Hospital"]
        }
    # 3. Respiratory / Pneumonia
    elif any(k in s_lower for k in ["cough", "wheezing", "asthma", "phlegm", "breathlessness"]):
        urgency = "Urgent" if "fever" in s_lower or "severe" in s_lower else "Routine"
        return {
            "suggested_condition": "Lower Respiratory Tract Infection / Bronchial Asthma Exacerbation",
            "urgency_level": urgency,
            "confidence_score": 0.86,
            "recommended_department": "Department of Pulmonology & Chest Medicine",
            "clinical_advice": "Nebulization with bronchodilator, Chest X-Ray PA view, and arterial oxygen saturation monitoring.",
            "recommended_hospitals": ["Services Hospital Lahore", "Mayo Hospital Lahore"]
        }
    # 4. Pediatric
    elif age < 14 or any(k in s_lower for k in ["child", "baby", "toddler", "infant", "measles", "teething"]):
        return {
            "suggested_condition": "Pediatric Acute Febrile Illness / Viral Syndrome",
            "urgency_level": "Urgent",
            "confidence_score": 0.89,
            "recommended_department": "Pediatric Emergency & Child Care",
            "clinical_advice": "Fluid hydration, oral antipyretic, pediatric CBC and blood culture.",
            "recommended_hospitals": ["The Children's Hospital Lahore"]
        }
    # 5. Orthopedic / Trauma
    elif any(k in s_lower for k in ["fracture", "joint pain", "knee", "swelling", "bone", "fall"]):
        return {
            "suggested_condition": "Musculoskeletal Trauma / Ligamentous Derangement",
            "urgency_level": "Urgent",
            "confidence_score": 0.87,
            "recommended_department": "Orthopedics & Trauma Centre",
            "clinical_advice": "Limb immobilization, digital X-Ray, analgesic cover, orthopedic evaluation.",
            "recommended_hospitals": ["Mayo Hospital Trauma Centre", "Services Hospital"]
        }
    # Default General Consultation
    else:
        return {
            "suggested_condition": "General Non-Specific Symptom Presentation",
            "urgency_level": "Routine",
            "confidence_score": 0.75,
            "recommended_department": "Outpatient Internal Medicine",
            "clinical_advice": "Routine clinical assessment, basic metabolic panel, vitals recording.",
            "recommended_hospitals": ["Jinnah Hospital", "Services Hospital", "Mayo Hospital"]
        }
