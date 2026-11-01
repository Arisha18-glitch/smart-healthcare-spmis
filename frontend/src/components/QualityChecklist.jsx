import React, { useState } from 'react';
import StatusBadge from './StatusBadge';
import AlertBanner from './AlertBanner';
import { recordInspection } from '../api';

export default function QualityChecklist({ readinessList, teamMembers = [], onInspectionRecorded }) {
  const [selectedDeliverableId, setSelectedDeliverableId] = useState(
    readinessList && readinessList.length > 0 ? readinessList[0].deliverable_id : null
  );
  const [inspectingItem, setInspectingItem] = useState(null);
  const [result, setResult] = useState('Pass');
  const [notes, setNotes] = useState('');
  const [inspectorId, setInspectorId] = useState(teamMembers[0] ? teamMembers[0].id : 1);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  if (!readinessList || readinessList.length === 0) {
    return <div className="glass-panel">No approved deliverables found for quality inspection.</div>;
  }

  const currentDeliverable = readinessList.find(d => d.deliverable_id === selectedDeliverableId) || readinessList[0];

  const handleOpenInspection = (item) => {
    setInspectingItem(item);
    setResult(item.result === 'Pending' ? 'Pass' : item.result);
    setNotes(item.notes || '');
    setError(null);
  };

  const handleSaveInspection = async (e) => {
    e.preventDefault();
    setError(null);

    if (result === 'Fail' && !notes.trim()) {
      setError("Inspection notes are strictly required when recording a 'Fail' result.");
      return;
    }

    try {
      setSaving(true);
      await recordInspection(inspectingItem.id, {
        result,
        notes,
        inspector_id: Number(inspectorId),
        inspection_date: new Date().toISOString().split('T')[0]
      });
      setInspectingItem(null);
      if (onInspectionRecorded) onInspectionRecorded();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Deliverable Selector Tabs */}
      <div className="tabs-header">
        {readinessList.map((d) => (
          <button
            key={d.deliverable_id}
            className={`tab-btn ${currentDeliverable.deliverable_id === d.deliverable_id ? 'active' : ''}`}
            onClick={() => { setSelectedDeliverableId(d.deliverable_id); setError(null); }}
          >
            <span>{d.req_code}</span>: {d.title.length > 20 ? d.title.slice(0, 20) + '…' : d.title}
            <span style={{ marginLeft: '8px', opacity: 0.6, fontSize: '0.76rem' }}>({d.pass_rate}%)</span>
          </button>
        ))}
      </div>

      {/* Deliverable Readiness Card */}
      <div className="glass-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <span className="mono-pill">{currentDeliverable.req_code}</span>
              <h3 style={{ fontSize: '1.2rem', color: '#fff' }}>{currentDeliverable.title}</h3>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
              Standard 5-Point Quality Verification Checklist & Production Readiness Gate.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', color: 'var(--text-subtle)', fontWeight: '600', letterSpacing: '0.04em' }}>Pass Rate</div>
              <div style={{ fontSize: '1.8rem', fontWeight: '800', color: currentDeliverable.pass_rate === 100 ? '#6ee7b7' : '#fcd34d' }}>
                {currentDeliverable.pass_rate}%
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', color: 'var(--text-subtle)', fontWeight: '600', letterSpacing: '0.04em' }}>Readiness</div>
              <StatusBadge status={currentDeliverable.is_ready ? 'Pass' : 'Fail'} />
            </div>
          </div>
        </div>

        {/* Blocking Alert if critical defects exist */}
        {currentDeliverable.has_unresolved_critical_defects && (
          <AlertBanner 
            type="danger" 
            title="QUALITY INSPECTION PASS BLOCKED!"
            message={`This deliverable has ${currentDeliverable.critical_defect_count} open Critical defect(s). All critical defects must be resolved before inspection can pass.`}
          />
        )}

        {/* 5-Item Checklist Table */}
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '4%' }}>#</th>
                <th style={{ width: '45%' }}>Verification Standard</th>
                <th style={{ width: '12%' }}>Result</th>
                <th style={{ width: '15%' }}>Inspector</th>
                <th style={{ width: '14%' }}>Date</th>
                <th style={{ width: '10%' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {currentDeliverable.checklist.map((item, idx) => (
                <tr key={item.id}>
                  <td><strong>{idx + 1}</strong></td>
                  <td>
                    <div style={{ fontWeight: '500' }}>{item.item_text}</div>
                    {item.notes && (
                      <div style={{ fontSize: '0.78rem', color: '#fca5a5', marginTop: '4px' }}>
                        <em>Note: {item.notes}</em>
                      </div>
                    )}
                  </td>
                  <td>
                    <StatusBadge status={item.result} />
                  </td>
                  <td style={{ color: 'var(--text-muted)' }}>{item.inspector_name || '—'}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{item.inspection_date || '—'}</td>
                  <td>
                    <button 
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleOpenInspection(item)}
                    >
                      Audit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspection Modal */}
      {inspectingItem && (
        <div className="modal-overlay" onClick={() => setInspectingItem(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Quality Inspection Audit</h3>
              <button className="modal-close-btn" onClick={() => setInspectingItem(null)}>&times;</button>
            </div>

            {error && <AlertBanner type="danger" message={error} onDismiss={() => setError(null)} />}

            <div style={{ marginBottom: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', padding: '14px', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', textTransform: 'uppercase' }}>Checklist Standard</div>
              <div style={{ fontWeight: '600', color: '#fff', marginTop: '4px' }}>{inspectingItem.item_text}</div>
            </div>

            <form onSubmit={handleSaveInspection}>
              <div className="form-group">
                <label className="form-label">Inspection Result</label>
                <select className="form-control" value={result} onChange={(e) => setResult(e.target.value)}>
                  <option value="Pass">Pass</option>
                  <option value="Fail">Fail</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Inspector</label>
                <select className="form-control" value={inspectorId} onChange={(e) => setInspectorId(e.target.value)}>
                  {teamMembers.map(m => (
                    <option key={m.id} value={m.id}>{m.name} ({m.role})</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Inspection Notes {result === 'Fail' && <span style={{ color: '#fca5a5' }}>* (Required for Fail)</span>}
                </label>
                <textarea 
                  className="form-control" 
                  value={notes} 
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={result === 'Fail' ? "Describe defect or test failure reason..." : "Optional verification comments..."}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setInspectingItem(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Recording...' : 'Submit Inspection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
