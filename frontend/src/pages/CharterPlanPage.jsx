import React, { useEffect, useState } from 'react';
import { 
  getCharter, updateCharter, getManagementPlan, updateManagementPlan, 
  autoFillManagementPlan, closeProject, getMilestones 
} from '../api';
import AlertBanner from '../components/AlertBanner';
import StatusBadge from '../components/StatusBadge';

export default function CharterPlanPage() {
  const [activeTab, setActiveTab] = useState('charter'); // 'charter', 'plan', 'milestones'
  const [charter, setCharter] = useState(null);
  const [plan, setPlan] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [saving, setSaving] = useState(false);

  // Form states
  const [charterForm, setCharterForm] = useState({});
  const [planForm, setPlanForm] = useState({});

  const loadData = async () => {
    try {
      setLoading(true);
      const [cData, pData, mData] = await Promise.all([
        getCharter(),
        getManagementPlan(),
        getMilestones()
      ]);
      setCharter(cData);
      setCharterForm(cData);
      setPlan(pData);
      setPlanForm(pData);
      setMilestones(mData);
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

  const handleCharterSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      const updated = await updateCharter(charterForm);
      setCharter(updated);
      setCharterForm(updated);
      setSuccess("Project Charter updated successfully!");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePlanSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      const updated = await updateManagementPlan(planForm);
      setPlan(updated);
      setPlanForm(updated);
      setSuccess("Project Management Plan saved successfully!");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAutoFillPlan = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      const autofilled = await autoFillManagementPlan();
      setPlan(autofilled);
      setPlanForm(autofilled);
      setSuccess("Management Plan auto-filled from live CPM and EVM data successfully!");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCloseProject = async () => {
    if (!window.confirm("Attempt project closure? This requires 100% completion of all activities, 0 pending change requests, and 0 unresolved critical defects.")) {
      return;
    }
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      const updated = await closeProject();
      setCharter(updated);
      setCharterForm(updated);
      setSuccess("🎉 Project closed successfully! All completion gates verified.");
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
          <h1>Project Initiation, Integration & Governance</h1>
          <p className="page-description">
            Charter baseline, auto-filled management plan, milestone tracking, and formal closure gates.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            id="btn-close-project"
            className="btn btn-danger btn-sm"
            onClick={handleCloseProject}
            disabled={charter?.status === 'Closed' || saving}
          >
            {charter?.status === 'Closed' ? 'Project Closed' : '🔒 Final Project Closure'}
          </button>
        </div>
      </div>

      {error && <AlertBanner type="danger" message={error} onDismiss={() => setError(null)} />}
      {success && <AlertBanner type="success" message={success} onDismiss={() => setSuccess(null)} />}

      {/* Tabs */}
      <div className="tabs-header">
        <button 
          className={`tab-btn ${activeTab === 'charter' ? 'active' : ''}`}
          onClick={() => setActiveTab('charter')}
        >
          Project Charter
        </button>
        <button 
          className={`tab-btn ${activeTab === 'plan' ? 'active' : ''}`}
          onClick={() => setActiveTab('plan')}
        >
          Management Plan (Auto-Fill)
        </button>
        <button 
          className={`tab-btn ${activeTab === 'milestones' ? 'active' : ''}`}
          onClick={() => setActiveTab('milestones')}
        >
          Milestones ({milestones.length})
        </button>
      </div>

      {/* TAB 1: Project Charter */}
      {activeTab === 'charter' && (
        <form onSubmit={handleCharterSave} className="glass-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '1.2rem' }}>Project Charter & Baseline Constraints</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Status:</span>
              <StatusBadge status={charterForm.status} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
            <div>
              <div className="form-group">
                <label className="form-label">Project Title</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={charterForm.title || ''} 
                  onChange={(e) => setCharterForm({ ...charterForm, title: e.target.value })} 
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Strategic Objectives</label>
                <textarea 
                  className="form-control" 
                  rows="3"
                  value={charterForm.objectives || ''} 
                  onChange={(e) => setCharterForm({ ...charterForm, objectives: e.target.value })} 
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Key Stakeholders</label>
                <textarea 
                  className="form-control" 
                  rows="2"
                  value={charterForm.stakeholders || ''} 
                  onChange={(e) => setCharterForm({ ...charterForm, stakeholders: e.target.value })} 
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Scope Boundaries (In-Scope & Out-of-Scope)</label>
                <textarea 
                  className="form-control" 
                  rows="3"
                  value={charterForm.scope_boundaries || ''} 
                  onChange={(e) => setCharterForm({ ...charterForm, scope_boundaries: e.target.value })} 
                  required 
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Approved Budget (PKR) *</label>
                <input 
                  type="number" 
                  className="form-control" 
                  value={charterForm.approved_budget || ''} 
                  onChange={(e) => setCharterForm({ ...charterForm, approved_budget: parseFloat(e.target.value) })} 
                  required 
                  min="1"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Project Start Date *</label>
                <input 
                  type="date" 
                  className="form-control" 
                  value={charterForm.start_date || ''} 
                  onChange={(e) => setCharterForm({ ...charterForm, start_date: e.target.value })} 
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Approved Deadline *</label>
                <input 
                  type="date" 
                  className="form-control" 
                  value={charterForm.deadline || ''} 
                  onChange={(e) => setCharterForm({ ...charterForm, deadline: e.target.value })} 
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Project Status</label>
                <select 
                  className="form-control" 
                  value={charterForm.status || 'Planning'} 
                  onChange={(e) => setCharterForm({ ...charterForm, status: e.target.value })}
                >
                  <option value="Planning">Planning</option>
                  <option value="Executing">Executing</option>
                  <option value="Monitoring">Monitoring</option>
                  <option value="On Hold">On Hold</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Evaluation Status Date</label>
                <input 
                  type="date" 
                  className="form-control" 
                  value={charterForm.status_date || ''} 
                  onChange={(e) => setCharterForm({ ...charterForm, status_date: e.target.value })} 
                  required 
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Charter Baseline'}
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: Management Plan */}
      {activeTab === 'plan' && (
        <form onSubmit={handlePlanSave} className="glass-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem' }}>Comprehensive Project Management Plan</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem' }}>
                Scope, Schedule, Cost, and Quality sections. Click auto-fill to populate from live CPM and EVM data.
              </p>
            </div>

            <button 
              type="button" 
              id="btn-autofill-plan"
              className="btn btn-secondary" 
              onClick={handleAutoFillPlan}
              disabled={saving}
            >
              ⚡ Auto-Fill From Live Project Data
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="form-group">
              <label className="form-label">1. Scope Management Plan</label>
              <textarea 
                className="form-control" 
                rows="6"
                value={planForm.scope_plan || ''} 
                onChange={(e) => setPlanForm({ ...planForm, scope_plan: e.target.value })} 
              />
            </div>

            <div className="form-group">
              <label className="form-label">2. Schedule Management Plan</label>
              <textarea 
                className="form-control" 
                rows="6"
                value={planForm.schedule_plan || ''} 
                onChange={(e) => setPlanForm({ ...planForm, schedule_plan: e.target.value })} 
              />
            </div>

            <div className="form-group">
              <label className="form-label">3. Cost Management Plan</label>
              <textarea 
                className="form-control" 
                rows="6"
                value={planForm.cost_plan || ''} 
                onChange={(e) => setPlanForm({ ...planForm, cost_plan: e.target.value })} 
              />
            </div>

            <div className="form-group">
              <label className="form-label">4. Quality Management Plan</label>
              <textarea 
                className="form-control" 
                rows="5"
                value={planForm.quality_plan || ''} 
                onChange={(e) => setPlanForm({ ...planForm, quality_plan: e.target.value })} 
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Management Plan'}
            </button>
          </div>
        </form>
      )}

      {/* TAB 3: Milestones */}
      {activeTab === 'milestones' && (
        <div className="glass-panel">
          <h3 style={{ fontSize: '1.2rem', marginBottom: '6px' }}>Project Milestones Schedule & Governance</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', marginBottom: '16px' }}>
            Milestones linked to activities with programmatic status calculation (Achieved / On Track / Delayed).
          </p>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Milestone Name</th>
                  <th>Linked Activity</th>
                  <th>Target Date</th>
                  <th>Forecast Finish</th>
                  <th>Responsible Person</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {milestones.map((m) => (
                  <tr key={m.id}>
                    <td><strong>{m.name}</strong></td>
                    <td>
                      <span className="mono-pill">{m.activity_code}</span> {m.activity_name} ({m.progress_percent}%)
                    </td>
                    <td>{m.target_date}</td>
                    <td>{m.forecast_finish || '—'}</td>
                    <td>{m.responsible_person}</td>
                    <td><StatusBadge status={m.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
