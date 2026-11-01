import React, { useEffect, useState } from 'react';
import { 
  getDefects, addDefect, updateDefect, 
  getQualityReadiness, getRisks, addRisk, getPdpc, 
  getTeam, getSchedule 
} from '../api';
import AlertBanner from '../components/AlertBanner';
import StatusBadge from '../components/StatusBadge';
import QualityChecklist from '../components/QualityChecklist';
import RiskMatrix from '../components/RiskMatrix';
import PdpcView from '../components/PdpcView';

export default function QualityRisksPage() {
  const [activeTab, setActiveTab] = useState('checklist'); // 'checklist', 'defects', 'risks', 'pdpc'
  const [readinessList, setReadinessList] = useState([]);
  const [defects, setDefects] = useState([]);
  const [risksData, setRisksData] = useState(null);
  const [pdpcData, setPdpcData] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Modals & forms
  const [showAddDefectModal, setShowAddDefectModal] = useState(false);
  const [newDefect, setNewDefect] = useState({ defect_code: '', title: '', severity: 'Critical', assigned_to: '', activity_id: '', status: 'Open' });

  const [showAddRiskModal, setShowAddRiskModal] = useState(false);
  const [newRisk, setNewRisk] = useState({ risk_code: '', title: '', description: '', likelihood: 4, impact: 4, goal: '', preventive_action: '', corrective_action: '' });

  const [editingDefect, setEditingDefect] = useState(null);
  const [defectStatusUpdate, setDefectStatusUpdate] = useState({ status: 'Open', resolution_notes: '' });
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [qData, dData, rData, pData, tData, sData] = await Promise.all([
        getQualityReadiness(),
        getDefects(),
        getRisks(),
        getPdpc(),
        getTeam(),
        getSchedule()
      ]);
      setReadinessList(qData);
      setDefects(dData);
      setRisksData(rData);
      setPdpcData(pData);
      setTeamMembers(tData);
      setActivities(sData.activities || []);

      if (tData.length > 0 && !newDefect.assigned_to) {
        setNewDefect(prev => ({ ...prev, assigned_to: tData[0].id }));
      }
      if (sData.activities && sData.activities.length > 0 && !newDefect.activity_id) {
        setNewDefect(prev => ({ ...prev, activity_id: sData.activities[0].id }));
      }
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddDefect = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      await addDefect({
        ...newDefect,
        assigned_to: Number(newDefect.assigned_to),
        activity_id: Number(newDefect.activity_id)
      });
      setShowAddDefectModal(false);
      setNewDefect({ defect_code: '', title: '', severity: 'Critical', assigned_to: teamMembers[0]?.id || 1, activity_id: activities[0]?.id || 1, status: 'Open' });
      setSuccess("Defect logged successfully!");
      loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateDefectStatus = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      await updateDefect(editingDefect.id, defectStatusUpdate);
      setEditingDefect(null);
      setSuccess("Defect status updated successfully!");
      loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddRisk = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      await addRisk({
        ...newRisk,
        likelihood: parseInt(newRisk.likelihood),
        impact: parseInt(newRisk.impact)
      });
      setShowAddRiskModal(false);
      setSuccess("Risk logged and mapped to Prioritization Matrix & PDPC!");
      loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="spinner"></div>;

  return (
    <div>
      <div className="page-header">
        <div className="page-title-group">
          <h1>Quality Assurance, Defects & Risk Management</h1>
          <p className="page-description">
            5-Point quality verification checklists, critical defect gating, 5&times;5 risk matrix, and PDPC contingency views.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            id="btn-log-defect"
            className="btn btn-danger btn-sm"
            onClick={() => setShowAddDefectModal(true)}
          >
            + Log Defect
          </button>
          <button 
            id="btn-add-risk"
            className="btn btn-primary btn-sm"
            onClick={() => setShowAddRiskModal(true)}
          >
            + Register Risk
          </button>
        </div>
      </div>

      {error && <AlertBanner type="danger" message={error} onDismiss={() => setError(null)} />}
      {success && <AlertBanner type="success" message={success} onDismiss={() => setSuccess(null)} />}

      {/* Tabs */}
      <div className="tabs-header">
        <button 
          className={`tab-btn ${activeTab === 'checklist' ? 'active' : ''}`}
          onClick={() => setActiveTab('checklist')}
        >
          Quality Checklists & Readiness ({readinessList.length} Deliverables)
        </button>
        <button 
          className={`tab-btn ${activeTab === 'defects' ? 'active' : ''}`}
          onClick={() => setActiveTab('defects')}
        >
          Defect Tracker ({defects.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'risks' ? 'active' : ''}`}
          onClick={() => setActiveTab('risks')}
        >
          5&times;5 Risk Prioritization Matrix
        </button>
        <button 
          className={`tab-btn ${activeTab === 'pdpc' ? 'active' : ''}`}
          onClick={() => setActiveTab('pdpc')}
        >
          PDPC Contingency Flow ({pdpcData.length})
        </button>
      </div>

      {/* TAB 1: Quality Checklists & Readiness */}
      {activeTab === 'checklist' && (
        <QualityChecklist 
          readinessList={readinessList} 
          teamMembers={teamMembers}
          onInspectionRecorded={loadData}
        />
      )}

      {/* TAB 2: Defect Tracker */}
      {activeTab === 'defects' && (
        <div className="glass-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem' }}>Defect & Anomaly Tracker</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem' }}>
                Tracks severity and resolution. Critical defects block deliverable readiness and project closure.
              </p>
            </div>
            <button className="btn btn-danger btn-sm" onClick={() => setShowAddDefectModal(true)}>
              + Log Defect
            </button>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Defect Code</th>
                  <th>Title & Description</th>
                  <th>Severity</th>
                  <th>Assigned Person</th>
                  <th>Related Activity</th>
                  <th>Status</th>
                  <th>Resolution Actions</th>
                </tr>
              </thead>
              <tbody>
                {defects.map((d) => (
                  <tr key={d.id}>
                    <td><span className="mono-pill">{d.defect_code}</span></td>
                    <td style={{ maxWidth: '320px' }}>
                      <div style={{ fontWeight: '600' }}>{d.title}</div>
                      {d.resolution_notes && (
                        <div style={{ fontSize: '0.8rem', color: '#34d399', marginTop: '4px' }}>
                          <em>Resolution: {d.resolution_notes}</em>
                        </div>
                      )}
                    </td>
                    <td><StatusBadge status={d.severity} /></td>
                    <td>{d.assignee_name || 'Unassigned'}</td>
                    <td>
                      {d.activity_code ? (
                        <span><span className="mono-pill">{d.activity_code}</span> {d.activity_name}</span>
                      ) : 'General'}
                    </td>
                    <td><StatusBadge status={d.status} /></td>
                    <td>
                      <button 
                        className="btn btn-secondary btn-sm"
                        onClick={() => {
                          setEditingDefect(d);
                          setDefectStatusUpdate({ status: d.status, resolution_notes: d.resolution_notes || '' });
                        }}
                      >
                        Update Status
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: 5x5 Risk Prioritization Matrix */}
      {activeTab === 'risks' && (
        <RiskMatrix risksData={risksData} onSelectRisk={() => setActiveTab('pdpc')} />
      )}

      {/* TAB 4: PDPC Contingency Flow */}
      {activeTab === 'pdpc' && (
        <PdpcView pdpcData={pdpcData} />
      )}

      {/* Edit Defect Status Modal */}
      {editingDefect && (
        <div className="modal-overlay" onClick={() => setEditingDefect(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Resolve / Update Defect: {editingDefect.defect_code}</h3>
              <button className="modal-close-btn" onClick={() => setEditingDefect(null)}>&times;</button>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '8px', marginBottom: '20px' }}>
              <div style={{ fontWeight: 'bold', color: '#f87171' }}>{editingDefect.title}</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Severity: <strong>{editingDefect.severity}</strong> &bull; Assigned to: <strong>{editingDefect.assignee_name}</strong>
              </div>
            </div>

            <form onSubmit={handleUpdateDefectStatus}>
              <div className="form-group">
                <label className="form-label">Defect Status *</label>
                <select 
                  className="form-control"
                  value={defectStatusUpdate.status}
                  onChange={(e) => setDefectStatusUpdate({ ...defectStatusUpdate, status: e.target.value })}
                >
                  <option value="Open">Open</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Resolution / Root Cause Notes</label>
                <textarea 
                  className="form-control"
                  rows="3"
                  value={defectStatusUpdate.resolution_notes}
                  onChange={(e) => setDefectStatusUpdate({ ...defectStatusUpdate, resolution_notes: e.target.value })}
                  placeholder="Detail the code fix, test validation, or architectural remediation applied..."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setEditingDefect(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Updating...' : 'Save Defect Status'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Defect Modal */}
      {showAddDefectModal && (
        <div className="modal-overlay" onClick={() => setShowAddDefectModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Log New Software Defect</h3>
              <button className="modal-close-btn" onClick={() => setShowAddDefectModal(false)}>&times;</button>
            </div>

            <form onSubmit={handleAddDefect}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Defect Code *</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={newDefect.defect_code} 
                    onChange={(e) => setNewDefect({ ...newDefect, defect_code: e.target.value })} 
                    placeholder="e.g. DEF-04" 
                    required 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Defect Title *</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={newDefect.title} 
                    onChange={(e) => setNewDefect({ ...newDefect, title: e.target.value })} 
                    placeholder="e.g. Concurrency deadlock on billing ledger" 
                    required 
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Severity Level *</label>
                  <select 
                    className="form-control"
                    value={newDefect.severity}
                    onChange={(e) => setNewDefect({ ...newDefect, severity: e.target.value })}
                  >
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Assigned Engineer</label>
                  <select 
                    className="form-control"
                    value={newDefect.assigned_to}
                    onChange={(e) => setNewDefect({ ...newDefect, assigned_to: e.target.value })}
                  >
                    {teamMembers.map(m => (
                      <option key={m.id} value={m.id}>{m.name} ({m.role})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Related Activity</label>
                <select 
                  className="form-control"
                  value={newDefect.activity_id}
                  onChange={(e) => setNewDefect({ ...newDefect, activity_id: e.target.value })}
                >
                  {activities.map(a => (
                    <option key={a.id} value={a.id}>{a.activity_code} - {a.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddDefectModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Logging...' : 'Log Defect'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Risk Modal */}
      {showAddRiskModal && (
        <div className="modal-overlay" onClick={() => setShowAddRiskModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Register Project Risk (with PDPC)</h3>
              <button className="modal-close-btn" onClick={() => setShowAddRiskModal(false)}>&times;</button>
            </div>

            <form onSubmit={handleAddRisk}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Risk Code *</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={newRisk.risk_code} 
                    onChange={(e) => setNewRisk({ ...newRisk, risk_code: e.target.value })} 
                    placeholder="e.g. RSK-07" 
                    required 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Risk Event Title *</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={newRisk.title} 
                    onChange={(e) => setNewRisk({ ...newRisk, title: e.target.value })} 
                    placeholder="e.g. Multi-hospital bandwidth saturation" 
                    required 
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Likelihood (1 &ndash; 5) *</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    value={newRisk.likelihood} 
                    onChange={(e) => setNewRisk({ ...newRisk, likelihood: e.target.value })} 
                    min="1" 
                    max="5" 
                    required 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Impact (1 &ndash; 5) *</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    value={newRisk.impact} 
                    onChange={(e) => setNewRisk({ ...newRisk, impact: e.target.value })} 
                    min="1" 
                    max="5" 
                    required 
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">PDPC Goal / Project Objective *</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={newRisk.goal} 
                  onChange={(e) => setNewRisk({ ...newRisk, goal: e.target.value })} 
                  placeholder="e.g. Ensure uninterrupted 24/7 emergency dispatch" 
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">PDPC Preventive Action (Shield) *</label>
                <textarea 
                  className="form-control" 
                  rows="2"
                  value={newRisk.preventive_action} 
                  onChange={(e) => setNewRisk({ ...newRisk, preventive_action: e.target.value })} 
                  placeholder="Proactive steps to prevent risk from materializing..." 
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">PDPC Corrective Action (Contingency Fallback) *</label>
                <textarea 
                  className="form-control" 
                  rows="2"
                  value={newRisk.corrective_action} 
                  onChange={(e) => setNewRisk({ ...newRisk, corrective_action: e.target.value })} 
                  placeholder="Corrective procedure if prevention fails..." 
                  required 
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddRiskModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Registering...' : 'Register Risk & PDPC'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
