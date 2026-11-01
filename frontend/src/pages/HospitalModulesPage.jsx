import React, { useEffect, useState } from 'react';
import {
  getHospitalOverview, getHospitalDoctors, getHospitalAppointments,
  bookHospitalAppointment, getHospitalShifts, getHospitalLabReports,
  addHospitalLabReport, getHospitalConsultations, updateHospitalConsultation,
  getHospitalBilling, addHospitalBilling, getHospitalEmr, runHospitalAiTriage
} from '../api';
import AlertBanner from '../components/AlertBanner';
import StatusBadge from '../components/StatusBadge';

export default function HospitalModulesPage() {
  const [activeTab, setActiveTab] = useState('appointments'); 
  // 'appointments', 'shifts', 'labs', 'consultations', 'billing', 'ai', 'emr'
  
  const [hospitals, setHospitals] = useState([]);
  const [selectedHospital, setSelectedHospital] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Appointments State
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [showBookModal, setShowBookModal] = useState(false);
  const [simulateRaceCondition, setSimulateRaceCondition] = useState(false);
  const [bookForm, setBookForm] = useState({
    hospital_id: '1',
    doctor_id: '1',
    patient_name: '',
    patient_phone: '0300-1234567',
    appointment_date: '2026-10-27',
    time_slot: '09:00 - 09:30 AM',
    notes: ''
  });

  // Shifts State
  const [shifts, setShifts] = useState([]);

  // Labs State
  const [labReports, setLabReports] = useState([]);
  const [labSearch, setLabSearch] = useState('');
  const [selectedLabSlip, setSelectedLabSlip] = useState(null);
  const [showAddLabModal, setShowAddLabModal] = useState(false);
  const [newLabForm, setNewLabForm] = useState({
    hospital_id: '1',
    patient_name: '',
    patient_mrn: 'MRN-NEW-01',
    test_name: 'Complete Blood Count (CBC)',
    category: 'Hematology',
    result_value: 'Hb: 14.2 g/dL, WBC: 6,800, Platelets: 220,000',
    normal_range: 'Hb: 13-17 g/dL, WBC: 4000-11000',
    unit: 'g/dL',
    flag: 'Normal',
    doctor_notes: 'All indices normal.'
  });

  // Consultations State
  const [consultations, setConsultations] = useState([]);
  const [activeConsultSession, setActiveConsultSession] = useState(null);
  const [consultNotesForm, setConsultNotesForm] = useState({ diagnosis_notes: '', prescription: '' });

  // Billing State
  const [billingInvoices, setBillingInvoices] = useState([]);
  const [showAddInvoiceModal, setShowAddInvoiceModal] = useState(false);
  const [newInvoiceForm, setNewInvoiceForm] = useState({
    hospital_id: '1',
    patient_name: '',
    patient_mrn: 'MRN-INV-01',
    bed_charges: 5000,
    consultation_fee: 2000,
    lab_charges: 3000,
    pharmacy_charges: 1500,
    payment_status: 'Paid',
    payment_method: 'Sehat Card Plus'
  });

  // AI Triage State
  const [aiSymptoms, setAiSymptoms] = useState('');
  const [aiAge, setAiAge] = useState(45);
  const [aiGender, setAiGender] = useState('Male');
  const [aiResult, setAiResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  // EMR Vault State
  const [emrRecords, setEmrRecords] = useState([]);
  const [simulateEmrLeakage, setSimulateEmrLeakage] = useState(false);

  const [saving, setSaving] = useState(false);

  const loadAllData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [hData, dData] = await Promise.all([
        getHospitalOverview(),
        getHospitalDoctors()
      ]);
      setHospitals(hData);
      setDoctors(dData);

      if (hData.length > 0 && !selectedHospital) {
        setSelectedHospital(hData[0].id.toString());
      }

      await loadTabData(activeTab, selectedHospital);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadTabData = async (tab, hospId) => {
    try {
      const hid = hospId ? Number(hospId) : null;
      if (tab === 'appointments') {
        const data = await getHospitalAppointments(hid);
        setAppointments(data);
      } else if (tab === 'shifts') {
        const data = await getHospitalShifts(hid);
        setShifts(data);
      } else if (tab === 'labs') {
        const data = await getHospitalLabReports(hid, labSearch);
        setLabReports(data);
      } else if (tab === 'consultations') {
        const data = await getHospitalConsultations();
        setConsultations(data);
      } else if (tab === 'billing') {
        const data = await getHospitalBilling();
        setBillingInvoices(data);
      } else if (tab === 'emr') {
        const data = await getHospitalEmr(hid, simulateEmrLeakage);
        setEmrRecords(data);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  useEffect(() => {
    loadTabData(activeTab, selectedHospital);
  }, [activeTab, selectedHospital, simulateEmrLeakage]);

  // Appointment Booking
  const handleBookAppointment = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      const result = await bookHospitalAppointment({
        ...bookForm,
        hospital_id: Number(bookForm.hospital_id),
        doctor_id: Number(bookForm.doctor_id),
        trigger_race_condition: simulateRaceCondition
      });

      if (result.warning) {
        setError(result.warning);
      } else {
        setSuccess(`Appointment booked successfully for ${result.patient_name} with ${result.doctor_name}! Slot: ${result.time_slot}`);
      }
      setShowBookModal(false);
      loadTabData('appointments', selectedHospital);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Lab Search & Add
  const handleLabSearch = async (e) => {
    e.preventDefault();
    loadTabData('labs', selectedHospital);
  };

  const handleAddLabReport = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      await addHospitalLabReport({
        ...newLabForm,
        hospital_id: Number(newLabForm.hospital_id)
      });
      setSuccess(`Lab report for ${newLabForm.patient_name} (${newLabForm.test_name}) created successfully!`);
      setShowAddLabModal(false);
      loadTabData('labs', selectedHospital);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Consultation Session Update
  const handleSaveConsultSession = async (e) => {
    e.preventDefault();
    if (!activeConsultSession) return;
    try {
      setSaving(true);
      setError(null);
      await updateHospitalConsultation(activeConsultSession.id, {
        session_status: 'Completed',
        diagnosis_notes: consultNotesForm.diagnosis_notes,
        prescription: consultNotesForm.prescription
      });
      setSuccess(`Consultation for ${activeConsultSession.patient_name} completed with prescription dispatched.`);
      setActiveConsultSession(null);
      loadTabData('consultations', selectedHospital);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Billing Invoice
  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      const res = await addHospitalBilling({
        ...newInvoiceForm,
        hospital_id: Number(newInvoiceForm.hospital_id),
        bed_charges: parseFloat(newInvoiceForm.bed_charges),
        consultation_fee: parseFloat(newInvoiceForm.consultation_fee),
        lab_charges: parseFloat(newInvoiceForm.lab_charges),
        pharmacy_charges: parseFloat(newInvoiceForm.pharmacy_charges)
      });
      setSuccess(`Invoice ${res.invoice_no} generated for PKR ${Number(res.total_pkr).toLocaleString()} via ${res.payment_method}!`);
      setShowAddInvoiceModal(false);
      loadTabData('billing', selectedHospital);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // AI Triage
  const handleRunAiTriage = async (symptomsText) => {
    const textToRun = symptomsText || aiSymptoms;
    if (!textToRun.trim()) {
      setError("Please describe the patient's symptoms first.");
      return;
    }
    try {
      setAiLoading(true);
      setError(null);
      const res = await runHospitalAiTriage({
        symptoms: textToRun,
        patient_age: Number(aiAge),
        gender: aiGender
      });
      setAiResult(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1>
            <span>5-Hospital Network Deliverables Console</span>
            <span className="badge badge-emerald">Live Working Modules</span>
          </h1>
          <p className="page-description">
            Operational clinical workflows across the 5 hospitals (Appointments, Doctor Rotas, Diagnostics, Telehealth, Billing, AI Triage, and EMR).
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Hospital Branch:</label>
          <select 
            value={selectedHospital} 
            onChange={(e) => setSelectedHospital(e.target.value)}
            style={{ 
              background: 'var(--bg-elevated)', 
              color: 'var(--text-main)', 
              border: '1px solid var(--border)', 
              padding: '6px 12px', 
              borderRadius: '8px',
              fontSize: '0.82rem'
            }}
          >
            <option value="">All 5 Hospitals</option>
            {hospitals.map(h => (
              <option key={h.id} value={h.id}>{h.code} - {h.name}</option>
            ))}
          </select>
          <button className="btn btn-secondary btn-sm" onClick={() => loadTabData(activeTab, selectedHospital)}>
            ↻ Refresh
          </button>
        </div>
      </div>

      {error && <AlertBanner type="danger" message={error} onDismiss={() => setError(null)} />}
      {success && <AlertBanner type="success" message={success} onDismiss={() => setSuccess(null)} />}

      {/* 5 Network Hospital Quick Metrics */}
      <div className="stats-grid" style={{ marginBottom: '20px' }}>
        {hospitals.map(h => (
          <div 
            key={h.id} 
            className="stat-card"
            style={{ 
              cursor: 'pointer',
              background: selectedHospital === h.id.toString() ? 'rgba(129, 140, 248, 0.08)' : 'var(--bg-card)'
            }}
            onClick={() => setSelectedHospital(selectedHospital === h.id.toString() ? '' : h.id.toString())}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="stat-label">{h.code}</span>
              <span style={{ fontSize: '0.72rem', color: '#6ee7b7' }}>● Active</span>
            </div>
            <div style={{ fontSize: '1rem', fontWeight: 'bold', color: '#fff', marginTop: '4px' }}>
              {h.name}
            </div>
            <div className="stat-subtext" style={{ marginTop: '6px' }}>
              {h.total_beds} Beds • {h.doctor_count} Doctors • {h.appointment_count} Bookings
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Tabs for Modules */}
      <div className="tabs-nav" style={{ marginBottom: '20px' }}>
        {[
          { key: 'appointments', label: '📅 Appointments (REQ-01 & DEF-01)' },
          { key: 'shifts', label: '👨‍⚕️ Doctor Roster (REQ-03)' },
          { key: 'labs', label: '🧪 Lab Reports (REQ-02)' },
          { key: 'consultations', label: '💻 Telehealth (REQ-04)' },
          { key: 'billing', label: '💳 Invoicing & Claims (REQ-05)' },
          { key: 'ai', label: '🤖 AI Diagnosis Triage (CR-01)' },
          { key: 'emr', label: '🗄️ Patient EMR & Tenant Vault (DEF-02)' },
        ].map(t => (
          <button 
            key={t.key}
            className={`tab-btn ${activeTab === t.key ? 'active' : ''}`}
            onClick={() => setActiveTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ==================================================================== */}
      {/* TAB 1: APPOINTMENTS & SCHEDULING (CONCURRENCY LOCKING & DEF-01)      */}
      {/* ==================================================================== */}
      {activeTab === 'appointments' && (
        <div className="glass-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', color: '#fff' }}>Patient Appointments & Slot Booking Engine</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                Multi-hospital slot reservation. Testing concurrency race conditions (DEF-01).
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: simulateRaceCondition ? '#fca5a5' : 'var(--text-muted)', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={simulateRaceCondition} 
                  onChange={(e) => setSimulateRaceCondition(e.target.checked)} 
                />
                Simulate Race Condition (DEF-01)
              </label>

              <button className="btn btn-primary btn-sm" onClick={() => setShowBookModal(true)}>
                + Book New Appointment
              </button>
            </div>
          </div>

          {simulateRaceCondition && (
            <div className="alert-banner alert-danger" style={{ marginBottom: '16px' }}>
              <div>
                <strong>🚨 CRITICAL QA DEFECT DEF-01 MODE ACTIVE</strong>
                <p style={{ marginTop: '2px', fontSize: '0.8rem' }}>
                  Distributed Redis lock is disabled. Attempting to book an already taken slot will permit double-booking, demonstrating the defect logged in Case Study.
                </p>
              </div>
            </div>
          )}

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Time Slot</th>
                  <th>Hospital</th>
                  <th>Patient Name</th>
                  <th>Contact</th>
                  <th>Attending Physician</th>
                  <th>Department</th>
                  <th>Status</th>
                  <th>Clinical Notes</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map(a => (
                  <tr key={a.id}>
                    <td style={{ fontWeight: '600', color: '#a5b4fc', whiteSpace: 'nowrap' }}>
                      {a.appointment_date} <br/>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{a.time_slot}</span>
                    </td>
                    <td><span className="badge badge-indigo">{a.hospital_code || 'HOSP'}</span></td>
                    <td style={{ fontWeight: '600', color: '#fff' }}>{a.patient_name}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{a.patient_phone}</td>
                    <td style={{ color: '#e8eaed' }}>{a.doctor_name}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{a.specialization}</td>
                    <td>
                      <StatusBadge status={a.status} />
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{a.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 2: DOCTOR SHIFTS & ROTA MATRIX (REQ-03)                          */}
      {/* ==================================================================== */}
      {activeTab === 'shifts' && (
        <div className="glass-panel">
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.05rem', color: '#fff' }}>5-Hospital Doctor Duty Roster & Shift Matrix</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              24/7 duty roster management, on-call cover coordination, and emergency duty allocations.
            </p>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Shift Date</th>
                  <th>Shift Hours</th>
                  <th>Hospital Unit</th>
                  <th>Doctor</th>
                  <th>Specialty</th>
                  <th>Department</th>
                  <th>Duty Status</th>
                </tr>
              </thead>
              <tbody>
                {shifts.map(s => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: '600', color: '#fff' }}>{s.shift_date}</td>
                    <td style={{ color: '#a5b4fc', fontWeight: '500' }}>{s.shift_type}</td>
                    <td>{s.hospital_name}</td>
                    <td style={{ color: '#fff', fontWeight: '600' }}>{s.doctor_name}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{s.specialization}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{s.department}</td>
                    <td>
                      <span className={`badge ${s.duty_status === 'On Duty' ? 'badge-emerald' : 'badge-indigo'}`}>
                        {s.duty_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 3: LAB REPORTS & DIAGNOSTIC RESULTS (REQ-02)                     */}
      {/* ==================================================================== */}
      {activeTab === 'labs' && (
        <div className="glass-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', color: '#fff' }}>Centralized Laboratory Diagnostics & Results Dispatch</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                Digital pathology, biochemistry, and radiology reports with automated reference range flagging.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <form onSubmit={handleLabSearch} style={{ display: 'flex', gap: '6px' }}>
                <input 
                  type="text" 
                  placeholder="Search patient, MRN, test..." 
                  value={labSearch} 
                  onChange={(e) => setLabSearch(e.target.value)}
                  style={{ 
                    background: 'var(--bg-elevated)', 
                    color: '#fff', 
                    border: '1px solid var(--border)', 
                    padding: '6px 10px', 
                    borderRadius: '6px',
                    fontSize: '0.8rem'
                  }}
                />
                <button type="submit" className="btn btn-secondary btn-sm">Search</button>
              </form>

              <button className="btn btn-primary btn-sm" onClick={() => setShowAddLabModal(true)}>
                + Order / Upload Lab Result
              </button>
            </div>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Report Date</th>
                  <th>Patient MRN</th>
                  <th>Patient Name</th>
                  <th>Test Name</th>
                  <th>Category</th>
                  <th>Clinical Values</th>
                  <th>Reference Range</th>
                  <th>Flag</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {labReports.map(l => (
                  <tr key={l.id}>
                    <td style={{ whiteSpace: 'nowrap', color: 'var(--text-muted)' }}>{l.reported_date}</td>
                    <td style={{ fontWeight: '600', color: '#a5b4fc' }}>{l.patient_mrn}</td>
                    <td style={{ fontWeight: '600', color: '#fff' }}>{l.patient_name}</td>
                    <td style={{ color: '#fff' }}>{l.test_name}</td>
                    <td><span className="badge badge-purple">{l.category}</span></td>
                    <td style={{ fontSize: '0.8rem', color: '#e8eaed', maxWidth: '280px' }}>{l.result_value}</td>
                    <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{l.normal_range}</td>
                    <td>
                      <span className={`badge ${l.flag === 'Critical' ? 'badge-red' : l.flag === 'Abnormal' ? 'badge-amber' : 'badge-emerald'}`}>
                        {l.flag}
                      </span>
                    </td>
                    <td>
                      <button 
                        className="btn btn-secondary btn-sm"
                        onClick={() => setSelectedLabSlip(l)}
                        title="View printable laboratory diagnostic slip"
                      >
                        📄 Lab Slip
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 4: TELEMEDICINE & ONLINE CONSULTATIONS (REQ-04)                  */}
      {/* ==================================================================== */}
      {activeTab === 'consultations' && (
        <div className="glass-panel">
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.05rem', color: '#fff' }}>Telemedicine Consultation Rooms & Digital Prescriptions</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              Virtual patient waiting rooms, WebRTC video consultation sessions, and doctor prescription dispatch.
            </p>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Patient Name</th>
                  <th>Consultation Type</th>
                  <th>Attending Doctor</th>
                  <th>Hospital Branch</th>
                  <th>Session Status</th>
                  <th>Prescribed Medication</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {consultations.map(c => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: '600', color: '#fff' }}>{c.patient_name}</td>
                    <td style={{ color: '#a5b4fc' }}>{c.consultation_type}</td>
                    <td style={{ color: '#fff' }}>{c.doctor_name}</td>
                    <td>{c.hospital_name}</td>
                    <td>
                      <span className={`badge ${c.session_status === 'In Progress' ? 'badge-emerald' : c.session_status === 'Waiting Room' ? 'badge-amber' : 'badge-indigo'}`}>
                        {c.session_status}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)', maxWidth: '240px' }}>
                      {c.prescription || 'Pending consultation session'}
                    </td>
                    <td>
                      <button 
                        className="btn btn-secondary btn-sm"
                        onClick={() => {
                          setActiveConsultSession(c);
                          setConsultNotesForm({ diagnosis_notes: c.diagnosis_notes || '', prescription: c.prescription || '' });
                        }}
                      >
                        ✍️ Doctor Pad
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 5: HOSPITAL BILLING & CLAIMS (REQ-05)                            */}
      {/* ==================================================================== */}
      {activeTab === 'billing' && (
        <div className="glass-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', color: '#fff' }}>Multi-Hospital Billing Ledger & Insurance Reconciliation</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                Itemized invoice calculations (Bed, Doctor fee, Lab, Pharmacy) and Sehat Card / Insurance co-pay.
              </p>
            </div>

            <button className="btn btn-primary btn-sm" onClick={() => setShowAddInvoiceModal(true)}>
              + Generate Patient Invoice
            </button>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Invoice No</th>
                  <th>Hospital</th>
                  <th>Patient Name & MRN</th>
                  <th>Bed Charges</th>
                  <th>Doctor Fee</th>
                  <th>Lab Charges</th>
                  <th>Pharmacy</th>
                  <th>Tax (5%)</th>
                  <th>Total Amount</th>
                  <th>Payment Method</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {billingInvoices.map(b => (
                  <tr key={b.id}>
                    <td style={{ fontWeight: '600', color: '#a5b4fc', whiteSpace: 'nowrap' }}>{b.invoice_no}</td>
                    <td>{b.hospital_name}</td>
                    <td>
                      <span style={{ fontWeight: '600', color: '#fff' }}>{b.patient_name}</span> <br/>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{b.patient_mrn}</span>
                    </td>
                    <td>PKR {Number(b.bed_charges).toLocaleString()}</td>
                    <td>PKR {Number(b.consultation_fee).toLocaleString()}</td>
                    <td>PKR {Number(b.lab_charges).toLocaleString()}</td>
                    <td>PKR {Number(b.pharmacy_charges).toLocaleString()}</td>
                    <td style={{ color: 'var(--text-muted)' }}>PKR {Number(b.tax_pkr).toLocaleString()}</td>
                    <td style={{ fontWeight: 'bold', color: '#34d399' }}>
                      PKR {Number(b.total_pkr).toLocaleString()}
                    </td>
                    <td>
                      <span className="badge badge-purple">{b.payment_method}</span>
                    </td>
                    <td>
                      <span className={`badge ${b.payment_status === 'Paid' ? 'badge-emerald' : b.payment_status === 'Unpaid' ? 'badge-red' : 'badge-amber'}`}>
                        {b.payment_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 6: AI DIAGNOSIS & SYMPTOM TRIAGE ENGINE (CR-01 DELIVERABLE)      */}
      {/* ==================================================================== */}
      {activeTab === 'ai' && (
        <div>
          <div className="glass-panel" style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', color: '#fff' }}>🤖 AI-Based Preliminary Diagnosis & Symptom Checker (CR-01)</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '4px' }}>
                  Machine learning clinical triage module added mid-project (+PKR 450,000, +2 weeks).
                </p>
              </div>
              <span className="badge badge-indigo">Deliverable for REQ-07</span>
            </div>

            <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Patient Symptoms & Chief Complaint:
                </label>
                <textarea 
                  rows={4}
                  value={aiSymptoms}
                  onChange={(e) => setAiSymptoms(e.target.value)}
                  placeholder="e.g., Severe crushing chest pain radiating to left jaw, accompanied by profuse sweating and difficulty breathing..."
                  style={{
                    width: '100%',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    padding: '10px',
                    color: '#fff',
                    fontSize: '0.85rem'
                  }}
                />

                <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Age:</label>
                    <input 
                      type="number" 
                      value={aiAge} 
                      onChange={(e) => setAiAge(e.target.value)}
                      style={{ width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: '#fff', padding: '6px 10px', borderRadius: '6px' }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Gender:</label>
                    <select 
                      value={aiGender} 
                      onChange={(e) => setAiGender(e.target.value)}
                      style={{ width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: '#fff', padding: '6px 10px', borderRadius: '6px' }}
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                </div>

                <div style={{ marginTop: '14px', display: 'flex', gap: '8px' }}>
                  <button 
                    className="btn btn-primary" 
                    onClick={() => handleRunAiTriage()}
                    disabled={aiLoading}
                  >
                    {aiLoading ? 'Analyzing Symptoms…' : '⚡ Run Clinical AI Triage'}
                  </button>
                </div>

                {/* Quick Clinical Case Presets */}
                <div style={{ marginTop: '16px' }}>
                  <div style={{ fontSize: '0.74rem', textTransform: 'uppercase', color: 'var(--text-subtle)', fontWeight: 'bold', marginBottom: '8px' }}>
                    Quick Case Study Clinical Presets:
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {[
                      { label: "🚨 Acute Cardiac Event", text: "Severe chest pain radiating to left arm and neck, shortness of breath, cold sweat." },
                      { label: "🧠 Acute Stroke Protocol", text: "Sudden slurred speech, right-sided arm weakness, and facial droop." },
                      { label: "🫁 Severe Asthma Exacerbation", text: "Chronic wheezing, nocturnal coughing, breathlessness not relieved by inhaler." },
                      { label: "👶 Pediatric Febrile Emergency", text: "3-year-old child with persistent high fever 103F, viral rash on trunk, and lethargy." }
                    ].map((p, idx) => (
                      <button 
                        key={idx}
                        className="btn btn-secondary btn-sm"
                        style={{ textAlign: 'left', justifyContent: 'flex-start' }}
                        onClick={() => {
                          setAiSymptoms(p.text);
                          handleRunAiTriage(p.text);
                        }}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Triage Output Card */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Diagnostic Recommendation & Hospital Routing:
                </label>
                {aiResult ? (
                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: '10px', padding: '18px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <span className={`badge ${aiResult.urgency_level === 'Emergency' ? 'badge-red' : aiResult.urgency_level === 'Urgent' ? 'badge-amber' : 'badge-emerald'}`}>
                        TRIAGE LEVEL: {aiResult.urgency_level.toUpperCase()}
                      </span>
                      <span style={{ fontSize: '0.8rem', color: '#a5b4fc', fontWeight: 'bold' }}>
                        Confidence: {(aiResult.confidence_score * 100).toFixed(0)}%
                      </span>
                    </div>

                    <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#fff', marginBottom: '10px' }}>
                      {aiResult.suggested_condition}
                    </div>

                    <div style={{ marginBottom: '12px' }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 'bold' }}>Department Routing</div>
                      <div style={{ fontSize: '0.88rem', color: '#e8eaed', marginTop: '2px' }}>{aiResult.recommended_department}</div>
                    </div>

                    <div style={{ marginBottom: '12px' }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 'bold' }}>Immediate Clinical Protocol</div>
                      <div style={{ fontSize: '0.84rem', color: '#fca5a5', marginTop: '2px', lineHeight: 1.5 }}>{aiResult.clinical_advice}</div>
                    </div>

                    <div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 'bold' }}>Equipped Network Hospital Centers</div>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                        {aiResult.recommended_hospitals.map((hName, i) => (
                          <span key={i} className="badge badge-indigo">{hName}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed var(--border)', borderRadius: '10px', padding: '36px', textAlign: 'center', color: 'var(--text-subtle)' }}>
                    Enter symptoms or click a clinical preset above to see live AI diagnostic triage.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 7: PATIENT EMR VAULT & DEF-02 TENANT LEAKAGE DEFECT TEST        */}
      {/* ==================================================================== */}
      {activeTab === 'emr' && (
        <div className="glass-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', color: '#fff' }}>Unified Patient Electronic Medical Records (EMR) Vault</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                Multi-tenant hospital database partitioning. Testing tenant key isolation (DEF-02).
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: simulateEmrLeakage ? '#fca5a5' : 'var(--text-muted)', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={simulateEmrLeakage} 
                  onChange={(e) => setSimulateEmrLeakage(e.target.checked)} 
                />
                Simulate Tenant Partition Leakage (DEF-02)
              </label>
            </div>
          </div>

          {simulateEmrLeakage && (
            <div className="alert-banner alert-danger" style={{ marginBottom: '16px' }}>
              <div>
                <strong>🚨 CRITICAL SECURITY DEFECT DEF-02 ACTIVE</strong>
                <p style={{ marginTop: '2px', fontSize: '0.8rem' }}>
                  Missing tenant partition key in session cache! All hospital patient records are leaked across branches regardless of hospital filter.
                </p>
              </div>
            </div>
          )}

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Hospital Branch</th>
                  <th>MRN</th>
                  <th>Patient Name</th>
                  <th>Demographics</th>
                  <th>Chronic Illnesses</th>
                  <th>Known Allergies</th>
                  <th>Current Medications</th>
                  <th>Last Visit</th>
                </tr>
              </thead>
              <tbody>
                {emrRecords.map(p => (
                  <tr key={p.id}>
                    <td>
                      <span className="badge badge-indigo">{p.hospital_code}</span> <br/>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{p.hospital_name}</span>
                    </td>
                    <td style={{ fontWeight: '600', color: '#a5b4fc' }}>{p.mrn}</td>
                    <td style={{ fontWeight: '600', color: '#fff' }}>{p.patient_name}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      {p.age} yrs • {p.gender} • <strong style={{ color: '#fff' }}>{p.blood_group}</strong>
                    </td>
                    <td style={{ fontSize: '0.82rem', color: '#e8eaed' }}>{p.chronic_conditions}</td>
                    <td>
                      <span style={{ color: p.allergies?.includes('Severe') ? '#fca5a5' : '#fbbf24', fontSize: '0.8rem', fontWeight: '500' }}>
                        ⚠️ {p.allergies}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)', maxWidth: '240px' }}>{p.current_medications}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{p.last_visit_date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 1: BOOK APPOINTMENT                                            */}
      {/* ==================================================================== */}
      {showBookModal && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.05rem', color: '#fff' }}>Book Real-Time Hospital Appointment</h3>
              <button 
                onClick={() => setShowBookModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#888', fontSize: '1.4rem', cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleBookAppointment}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Hospital Center:</label>
                <select 
                  value={bookForm.hospital_id} 
                  onChange={(e) => setBookForm({ ...bookForm, hospital_id: e.target.value })}
                  style={{ width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: '#fff', padding: '8px', borderRadius: '6px' }}
                >
                  {hospitals.map(h => (
                    <option key={h.id} value={h.id}>{h.code} - {h.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Attending Doctor:</label>
                <select 
                  value={bookForm.doctor_id} 
                  onChange={(e) => setBookForm({ ...bookForm, doctor_id: e.target.value })}
                  style={{ width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: '#fff', padding: '8px', borderRadius: '6px' }}
                >
                  {doctors.filter(d => d.hospital_id === Number(bookForm.hospital_id)).map(d => (
                    <option key={d.id} value={d.id}>{d.name} ({d.specialization}) — Fee: PKR {d.fee_pkr}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Patient Full Name:</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g., Tariq Mehmood"
                    value={bookForm.patient_name} 
                    onChange={(e) => setBookForm({ ...bookForm, patient_name: e.target.value })}
                    style={{ width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: '#fff', padding: '8px', borderRadius: '6px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Phone Number:</label>
                  <input 
                    type="text" 
                    value={bookForm.patient_phone} 
                    onChange={(e) => setBookForm({ ...bookForm, patient_phone: e.target.value })}
                    style={{ width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: '#fff', padding: '8px', borderRadius: '6px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Date:</label>
                  <input 
                    type="date" 
                    required 
                    value={bookForm.appointment_date} 
                    onChange={(e) => setBookForm({ ...bookForm, appointment_date: e.target.value })}
                    style={{ width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: '#fff', padding: '8px', borderRadius: '6px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Time Slot:</label>
                  <select 
                    value={bookForm.time_slot} 
                    onChange={(e) => setBookForm({ ...bookForm, time_slot: e.target.value })}
                    style={{ width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: '#fff', padding: '8px', borderRadius: '6px' }}
                  >
                    <option value="09:00 - 09:30 AM">09:00 - 09:30 AM</option>
                    <option value="09:30 - 10:00 AM">09:30 - 10:00 AM</option>
                    <option value="10:00 - 10:30 AM">10:00 - 10:30 AM</option>
                    <option value="10:30 - 11:00 AM">10:30 - 11:00 AM</option>
                    <option value="11:00 - 11:30 AM">11:00 - 11:30 AM</option>
                    <option value="11:30 - 12:00 PM">11:30 - 12:00 PM</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Notes / Symptoms:</label>
                <input 
                  type="text" 
                  placeholder="e.g., Routine cardiac follow-up"
                  value={bookForm.notes} 
                  onChange={(e) => setBookForm({ ...bookForm, notes: e.target.value })}
                  style={{ width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: '#fff', padding: '8px', borderRadius: '6px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowBookModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Confirming…' : 'Confirm Slot Reservation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 2: PRINTABLE LAB REPORT SLIP                                   */}
      {/* ==================================================================== */}
      {selectedLabSlip && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: '640px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.4rem' }}>🏥</span>
                <div>
                  <h3 style={{ fontSize: '1rem', color: '#fff' }}>Official Clinical Diagnostic Report</h3>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{selectedLabSlip.hospital_name} — Diagnostic Services</div>
                </div>
              </div>
              <button 
                onClick={() => setSelectedLabSlip(null)}
                style={{ background: 'transparent', border: 'none', color: '#888', fontSize: '1.4rem', cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.82rem', marginBottom: '12px' }}>
                <div><strong style={{ color: 'var(--text-muted)' }}>Patient Name:</strong> <span style={{ color: '#fff' }}>{selectedLabSlip.patient_name}</span></div>
                <div><strong style={{ color: 'var(--text-muted)' }}>Patient MRN:</strong> <span style={{ color: '#a5b4fc' }}>{selectedLabSlip.patient_mrn}</span></div>
                <div><strong style={{ color: 'var(--text-muted)' }}>Date:</strong> <span style={{ color: '#fff' }}>{selectedLabSlip.reported_date}</span></div>
                <div><strong style={{ color: 'var(--text-muted)' }}>Department:</strong> <span style={{ color: '#fff' }}>{selectedLabSlip.category}</span></div>
              </div>

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                <div style={{ fontSize: '0.92rem', fontWeight: 'bold', color: '#fff', marginBottom: '6px' }}>
                  {selectedLabSlip.test_name}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#e8eaed', padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', marginBottom: '8px' }}>
                  {selectedLabSlip.result_value}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  <strong>Reference Range:</strong> {selectedLabSlip.normal_range} ({selectedLabSlip.unit})
                </div>
              </div>

              <div style={{ marginTop: '12px', borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Consultant Pathologist Remarks:</div>
                <div style={{ fontSize: '0.82rem', color: '#fca5a5', marginTop: '2px' }}>{selectedLabSlip.doctor_notes || 'No remarks recorded.'}</div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button className="btn btn-secondary" onClick={() => setSelectedLabSlip(null)}>Close</button>
              <button className="btn btn-primary" onClick={() => window.print()}>🖨️ Print / Save PDF</button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 3: DOCTOR CONSULTATION PAD                                     */}
      {/* ==================================================================== */}
      {activeConsultSession && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.05rem', color: '#fff' }}>
                Telemedicine Consultation Room: {activeConsultSession.patient_name}
              </h3>
              <button 
                onClick={() => setActiveConsultSession(null)}
                style={{ background: 'transparent', border: 'none', color: '#888', fontSize: '1.4rem', cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveConsultSession}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Attending Physician:
                </label>
                <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '0.9rem' }}>
                  {activeConsultSession.doctor_name} ({activeConsultSession.specialization}) — {activeConsultSession.hospital_name}
                </div>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Clinical Diagnosis Notes:
                </label>
                <textarea 
                  rows={3}
                  required
                  placeholder="Record symptoms, observations, vitals..."
                  value={consultNotesForm.diagnosis_notes}
                  onChange={(e) => setConsultNotesForm({ ...consultNotesForm, diagnosis_notes: e.target.value })}
                  style={{ width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: '#fff', padding: '8px', borderRadius: '6px' }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Electronic Prescription (Rx):
                </label>
                <textarea 
                  rows={3}
                  required
                  placeholder="e.g. Tab. Panadol 500mg 1 tab TDS for 3 days, Tab. Augmentin 625mg 1 tab BD..."
                  value={consultNotesForm.prescription}
                  onChange={(e) => setConsultNotesForm({ ...consultNotesForm, prescription: e.target.value })}
                  style={{ width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: '#fff', padding: '8px', borderRadius: '6px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setActiveConsultSession(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving…' : 'Complete Session & Dispatch Rx'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 4: CREATE BILLING INVOICE                                      */}
      {/* ==================================================================== */}
      {showAddInvoiceModal && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.05rem', color: '#fff' }}>Generate Hospital Patient Invoice</h3>
              <button 
                onClick={() => setShowAddInvoiceModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#888', fontSize: '1.4rem', cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateInvoice}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Hospital Branch:</label>
                <select 
                  value={newInvoiceForm.hospital_id} 
                  onChange={(e) => setNewInvoiceForm({ ...newInvoiceForm, hospital_id: e.target.value })}
                  style={{ width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: '#fff', padding: '8px', borderRadius: '6px' }}
                >
                  {hospitals.map(h => (
                    <option key={h.id} value={h.id}>{h.code} - {h.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Patient Name:</label>
                  <input 
                    type="text" 
                    required 
                    value={newInvoiceForm.patient_name} 
                    onChange={(e) => setNewInvoiceForm({ ...newInvoiceForm, patient_name: e.target.value })}
                    style={{ width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: '#fff', padding: '8px', borderRadius: '6px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>MRN Number:</label>
                  <input 
                    type="text" 
                    required 
                    value={newInvoiceForm.patient_mrn} 
                    onChange={(e) => setNewInvoiceForm({ ...newInvoiceForm, patient_mrn: e.target.value })}
                    style={{ width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: '#fff', padding: '8px', borderRadius: '6px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Bed / Room Charges (PKR):</label>
                  <input 
                    type="number" 
                    value={newInvoiceForm.bed_charges} 
                    onChange={(e) => setNewInvoiceForm({ ...newInvoiceForm, bed_charges: e.target.value })}
                    style={{ width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: '#fff', padding: '8px', borderRadius: '6px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Doctor Consultation Fee (PKR):</label>
                  <input 
                    type="number" 
                    value={newInvoiceForm.consultation_fee} 
                    onChange={(e) => setNewInvoiceForm({ ...newInvoiceForm, consultation_fee: e.target.value })}
                    style={{ width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: '#fff', padding: '8px', borderRadius: '6px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Lab Diagnostics (PKR):</label>
                  <input 
                    type="number" 
                    value={newInvoiceForm.lab_charges} 
                    onChange={(e) => setNewInvoiceForm({ ...newInvoiceForm, lab_charges: e.target.value })}
                    style={{ width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: '#fff', padding: '8px', borderRadius: '6px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Pharmacy Medication (PKR):</label>
                  <input 
                    type="number" 
                    value={newInvoiceForm.pharmacy_charges} 
                    onChange={(e) => setNewInvoiceForm({ ...newInvoiceForm, pharmacy_charges: e.target.value })}
                    style={{ width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: '#fff', padding: '8px', borderRadius: '6px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Payment Method:</label>
                  <select 
                    value={newInvoiceForm.payment_method} 
                    onChange={(e) => setNewInvoiceForm({ ...newInvoiceForm, payment_method: e.target.value })}
                    style={{ width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: '#fff', padding: '8px', borderRadius: '6px' }}
                  >
                    <option value="Cash">Cash Counter</option>
                    <option value="Credit Card">Credit / Debit Card</option>
                    <option value="Sehat Card Plus">Sehat Card Plus (Govt Co-Pay)</option>
                    <option value="Corporate Insurance">Corporate Insurance</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Payment Status:</label>
                  <select 
                    value={newInvoiceForm.payment_status} 
                    onChange={(e) => setNewInvoiceForm({ ...newInvoiceForm, payment_status: e.target.value })}
                    style={{ width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: '#fff', padding: '8px', borderRadius: '6px' }}
                  >
                    <option value="Paid">Paid</option>
                    <option value="Pending Insurance">Pending Insurance Approval</option>
                    <option value="Unpaid">Unpaid</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddInvoiceModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Generating…' : 'Calculate & Issue Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 5: ORDER NEW LAB REPORT                                        */}
      {/* ==================================================================== */}
      {showAddLabModal && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.05rem', color: '#fff' }}>Upload / Order Laboratory Diagnostic Test</h3>
              <button 
                onClick={() => setShowAddLabModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#888', fontSize: '1.4rem', cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleAddLabReport}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Hospital Center:</label>
                <select 
                  value={newLabForm.hospital_id} 
                  onChange={(e) => setNewLabForm({ ...newLabForm, hospital_id: e.target.value })}
                  style={{ width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: '#fff', padding: '8px', borderRadius: '6px' }}
                >
                  {hospitals.map(h => (
                    <option key={h.id} value={h.id}>{h.code} - {h.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Patient Name:</label>
                  <input 
                    type="text" 
                    required 
                    value={newLabForm.patient_name} 
                    onChange={(e) => setNewLabForm({ ...newLabForm, patient_name: e.target.value })}
                    style={{ width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: '#fff', padding: '8px', borderRadius: '6px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Patient MRN:</label>
                  <input 
                    type="text" 
                    required 
                    value={newLabForm.patient_mrn} 
                    onChange={(e) => setNewLabForm({ ...newLabForm, patient_mrn: e.target.value })}
                    style={{ width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: '#fff', padding: '8px', borderRadius: '6px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Test Name:</label>
                  <input 
                    type="text" 
                    required 
                    value={newLabForm.test_name} 
                    onChange={(e) => setNewLabForm({ ...newLabForm, test_name: e.target.value })}
                    style={{ width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: '#fff', padding: '8px', borderRadius: '6px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Category:</label>
                  <select 
                    value={newLabForm.category} 
                    onChange={(e) => setNewLabForm({ ...newLabForm, category: e.target.value })}
                    style={{ width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: '#fff', padding: '8px', borderRadius: '6px' }}
                  >
                    <option value="Hematology">Hematology</option>
                    <option value="Biochemistry">Biochemistry</option>
                    <option value="Pathology">Pathology</option>
                    <option value="Radiology">Radiology</option>
                    <option value="Microbiology">Microbiology</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Result Values:</label>
                <input 
                  type="text" 
                  required 
                  value={newLabForm.result_value} 
                  onChange={(e) => setNewLabForm({ ...newLabForm, result_value: e.target.value })}
                  style={{ width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: '#fff', padding: '8px', borderRadius: '6px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Normal Reference Range:</label>
                  <input 
                    type="text" 
                    value={newLabForm.normal_range} 
                    onChange={(e) => setNewLabForm({ ...newLabForm, normal_range: e.target.value })}
                    style={{ width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: '#fff', padding: '8px', borderRadius: '6px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Flag:</label>
                  <select 
                    value={newLabForm.flag} 
                    onChange={(e) => setNewLabForm({ ...newLabForm, flag: e.target.value })}
                    style={{ width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: '#fff', padding: '8px', borderRadius: '6px' }}
                  >
                    <option value="Normal">Normal</option>
                    <option value="Abnormal">Abnormal</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddLabModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving…' : 'Record Diagnostic Result'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
