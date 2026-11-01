import React, { useEffect, useState } from 'react';
import { getIntegrityAudit, getStatusReport } from '../api';
import AlertBanner from '../components/AlertBanner';
import StatusBadge from '../components/StatusBadge';

export default function IntegrityReportPage() {
  const [audit, setAudit] = useState(null);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [aData, rData] = await Promise.all([
        getIntegrityAudit(),
        getStatusReport()
      ]);
      setAudit(aData);
      setReport(rData);
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

  const downloadJsonReport = () => {
    if (!report) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(report, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `Project_Status_Report_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const printReport = () => {
    window.print();
  };

  if (loading) return <div className="spinner"></div>;

  return (
    <div>
      <div className="page-header">
        <div className="page-title-group">
          <h1>System Integrity Audit & Status Report</h1>
          <p className="page-description">
            Automated database consistency verification, baseline lineage auditing, and downloadable status reporting.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary btn-sm" onClick={loadData}>
            ↻ Re-Run Audit
          </button>
          <button id="btn-download-report-json" className="btn btn-primary btn-sm" onClick={downloadJsonReport}>
            ⬇ Download Report (JSON)
          </button>
          <button className="btn btn-secondary btn-sm" onClick={printReport}>
            🖨️ Print / Save PDF
          </button>
        </div>
      </div>

      {error && <AlertBanner type="danger" message={error} onDismiss={() => setError(null)} />}

      {/* Audit Summary Card */}
      {audit && (
        <div className="glass-panel" style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: audit.all_passed ? '#6ee7b7' : '#fca5a5', fontWeight: '700', letterSpacing: '0.05em' }}>
                DATABASE INTEGRITY AUDIT &bull; {audit.audit_timestamp}
              </div>
              <h2 style={{ fontSize: '1.3rem', color: '#ffffff', marginTop: '4px' }}>
                {audit.all_passed ? '✓ All Core System Integrity Rules Passed' : '⚠️ Integrity Violations Detected'}
              </h2>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <span className={`badge ${audit.all_passed ? 'badge-green' : 'badge-red'}`} style={{ fontSize: '0.8rem', padding: '5px 14px' }}>
                {audit.all_passed ? 'INTEGRITY 100% OK' : 'ACTION REQUIRED'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Integrity Checks Table */}
      <div className="glass-panel" style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '1.2rem', marginBottom: '6px' }}>Automated Consistency Rules Audit</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', marginBottom: '16px' }}>
          Validates that database foreign keys, schedule lineages, scope locks, and cost roll-ups are perfectly in sync.
        </p>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '4%' }}>Status</th>
                <th style={{ width: '36%' }}>Integrity Check Rule</th>
                <th style={{ width: '60%' }}>Detailed Verification Result</th>
              </tr>
            </thead>
            <tbody>
              {audit?.checks?.map((check, idx) => (
                <tr key={idx}>
                  <td>
                    {check.passed ? (
                      <span style={{ color: '#6ee7b7', fontSize: '1.1rem' }}>✓</span>
                    ) : (
                      <span style={{ color: '#fca5a5', fontSize: '1.1rem' }}>✕</span>
                    )}
                  </td>
                  <td>
                    <div style={{ fontWeight: '600' }}>{check.check_name}</div>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.84rem', color: check.passed ? 'var(--text-muted)' : '#fca5a5' }}>
                      {check.details}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Live Downloadable Status Report Preview */}
      {report && (
        <div className="glass-panel" id="printable-status-report">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
            <div>
              <h3 style={{ fontSize: '1.25rem' }}>Official Project Status Report</h3>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Generated on: {report.report_generated_at} &bull; Network of 5 Hospitals
              </div>
            </div>

            <button className="btn btn-secondary btn-sm" onClick={downloadJsonReport}>
              Download JSON
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '20px' }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', textTransform: 'uppercase' }}>Overall Health</div>
              <div style={{ marginTop: '4px' }}>
                <span className={`health-pill ${report.executive_summary.overall_health}`}>
                  {report.executive_summary.overall_health.toUpperCase()}
                </span>
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', textTransform: 'uppercase' }}>Completion (EV/BAC)</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#ffffff', marginTop: '4px' }}>
                {report.executive_summary.overall_progress_percent}%
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', textTransform: 'uppercase' }}>CPI / SPI</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#ffffff', marginTop: '4px' }}>
                {report.executive_summary.cpi} / {report.executive_summary.spi}
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Approved Budget</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#a5b4fc', marginTop: '4px' }}>
                PKR {Number(report.executive_summary.approved_budget).toLocaleString()}
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Forecast EAC</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#fcd34d', marginTop: '4px' }}>
                PKR {Number(report.executive_summary.eac).toLocaleString()}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '8px' }}>
            <div>
              <h4 style={{ fontSize: '0.95rem', marginBottom: '10px', color: '#a5b4fc' }}>Critical Path Tasks ({report.schedule_summary.critical_path?.length})</h4>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {report.schedule_summary.critical_path?.map((c, i) => (
                  <span key={i} className="mono-pill" style={{ background: 'rgba(239, 68, 68, 0.25)', color: '#fca5a5' }}>
                    {c}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h4 style={{ fontSize: '1rem', marginBottom: '8px', color: '#f87171' }}>Unresolved Critical Defects</h4>
              <div style={{ fontSize: '0.86rem', color: 'var(--text-muted)' }}>
                {report.defects.filter(d => d.severity === 'Critical' && d.status !== 'Closed').length} open critical defects requiring resolution.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
