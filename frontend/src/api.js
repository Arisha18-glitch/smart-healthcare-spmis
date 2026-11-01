/**
 * Frontend API Service Layer
 * Centralized HTTP client for FastAPI backend.
 * Captures all business rule error messages from the backend.
 */

const API_BASE = 'http://127.0.0.1:8000/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');
    const data = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      const errorMessage = (data && data.detail) 
        ? (typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail))
        : `Request failed with status ${response.status}: ${response.statusText}`;
      throw new Error(errorMessage);
    }

    return data;
  } catch (err) {
    console.error(`API Error on [${options.method || 'GET'}] ${endpoint}:`, err);
    throw err;
  }
}

// Module 1: Initiation & Integration
export const getCharter = () => request('/charter');
export const updateCharter = (data) => request('/charter', { method: 'PUT', body: JSON.stringify(data) });
export const getManagementPlan = () => request('/management-plan');
export const updateManagementPlan = (data) => request('/management-plan', { method: 'PUT', body: JSON.stringify(data) });
export const autoFillManagementPlan = () => request('/management-plan/auto-fill', { method: 'POST' });
export const closeProject = () => request('/project/close', { method: 'POST' });
export const getTeam = () => request('/team');

// Module 2: Scope & WBS
export const getRequirements = () => request('/requirements');
export const addRequirement = (data) => request('/requirements', { method: 'POST', body: JSON.stringify(data) });
export const updateRequirement = (id, data) => request(`/requirements/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const getWbs = () => request('/wbs');
export const getChangeRequests = () => request('/change-requests');
export const createChangeRequest = (data) => request('/change-requests', { method: 'POST', body: JSON.stringify(data) });
export const approveChangeRequest = (id, note = '') => 
  request(`/change-requests/${id}/approve`, { method: 'POST', body: JSON.stringify({ decision_note: note }) });
export const rejectChangeRequest = (id, note = '') => 
  request(`/change-requests/${id}/reject`, { method: 'POST', body: JSON.stringify({ decision_note: note }) });

// Module 3: Schedule & Resources
export const getSchedule = () => request('/schedule');
export const addActivity = (data) => request('/activities', { method: 'POST', body: JSON.stringify(data) });
export const updateActivityProgress = (id, data) => 
  request(`/activities/${id}/progress`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteActivity = (id) => request(`/activities/${id}`, { method: 'DELETE' });
export const getMilestones = () => request('/milestones');

// Module 4: Cost & EVM
export const getEvm = (statusDate) => {
  const query = statusDate ? `?status_date=${encodeURIComponent(statusDate)}` : '';
  return request(`/evm${query}`);
};
export const getSCurve = () => request('/evm/s-curve');

// Module 5: Quality & Risks
export const getDefects = () => request('/defects');
export const addDefect = (data) => request('/defects', { method: 'POST', body: JSON.stringify(data) });
export const updateDefect = (id, data) => request(`/defects/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const getQualityReadiness = () => request('/quality/readiness');
export const recordInspection = (itemId, data) => 
  request(`/quality/inspect/${itemId}`, { method: 'POST', body: JSON.stringify(data) });
export const getRisks = () => request('/risks');
export const addRisk = (data) => request('/risks', { method: 'POST', body: JSON.stringify(data) });
export const getPdpc = () => request('/pdpc');

// Module 6: Dashboard, Integrity & Reports
export const getDashboard = () => request('/dashboard');
export const getIntegrityAudit = () => request('/integrity');
export const getStatusReport = () => request('/report');
export const resetSampleData = () => request('/sample-data/reset', { method: 'POST' });

// ==============================================================================
// Working Hospital Deliverables (5-Hospital Network Operations)
// ==============================================================================
export const getHospitalOverview = () => request('/hospital/overview');
export const getHospitalDoctors = (hospitalId) => request(`/hospital/doctors${hospitalId ? `?hospital_id=${hospitalId}` : ''}`);
export const getHospitalAppointments = (hospitalId) => request(`/hospital/appointments${hospitalId ? `?hospital_id=${hospitalId}` : ''}`);
export const bookHospitalAppointment = (data) => request('/hospital/appointments', { method: 'POST', body: JSON.stringify(data) });
export const getHospitalShifts = (hospitalId) => request(`/hospital/doctor-shifts${hospitalId ? `?hospital_id=${hospitalId}` : ''}`);
export const getHospitalLabReports = (hospitalId, search) => {
  const params = new URLSearchParams();
  if (hospitalId) params.append('hospital_id', hospitalId);
  if (search) params.append('search', search);
  const q = params.toString() ? `?${params.toString()}` : '';
  return request(`/hospital/lab-reports${q}`);
};
export const addHospitalLabReport = (data) => request('/hospital/lab-reports', { method: 'POST', body: JSON.stringify(data) });
export const getHospitalConsultations = () => request('/hospital/consultations');
export const updateHospitalConsultation = (id, data) => request(`/hospital/consultations/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const getHospitalBilling = () => request('/hospital/billing');
export const addHospitalBilling = (data) => request('/hospital/billing', { method: 'POST', body: JSON.stringify(data) });
export const getHospitalEmr = (tenantHospitalId, simulateLeakage = false) => {
  const params = new URLSearchParams();
  if (tenantHospitalId) params.append('tenant_hospital_id', tenantHospitalId);
  if (simulateLeakage) params.append('simulate_leakage', 'true');
  const q = params.toString() ? `?${params.toString()}` : '';
  return request(`/hospital/emr${q}`);
};
export const runHospitalAiTriage = (data) => request('/hospital/ai-triage', { method: 'POST', body: JSON.stringify(data) });

