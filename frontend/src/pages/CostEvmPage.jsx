import React, { useEffect, useState } from 'react';
import { getEvm, getSCurve } from '../api';
import AlertBanner from '../components/AlertBanner';
import StatusBadge from '../components/StatusBadge';
import EvmCharts from '../components/EvmCharts';

export default function CostEvmPage() {
  const [evmData, setEvmData] = useState(null);
  const [sCurveData, setSCurveData] = useState([]);
  const [statusDateInput, setStatusDateInput] = useState('2026-10-26');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchEvmMetrics = async (date) => {
    try {
      setLoading(true);
      const [eData, sData] = await Promise.all([
        getEvm(date),
        getSCurve()
      ]);
      setEvmData(eData);
      setSCurveData(sData);
      setStatusDateInput(eData.status_date);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvmMetrics('2026-10-26');
  }, []);

  const handleDateChange = (e) => {
    e.preventDefault();
    fetchEvmMetrics(statusDateInput);
  };

  if (loading && !evmData) return <div className="spinner"></div>;

  return (
    <div>
      <div className="page-header">
        <div className="page-title-group">
          <h1>Cost Management & Earned Value Analysis (EVM)</h1>
          <p className="page-description">
            Objective performance measurement: PV, EV, AC, CPI, SPI, EAC forecasting, and S-Curves.
          </p>
        </div>

        {/* User-Selectable Status Date Form */}
        <form onSubmit={handleDateChange} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-elevated)', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Status Date:</span>
          <input 
            type="date" 
            className="form-control" 
            style={{ padding: '4px 8px', fontSize: '0.84rem' }}
            value={statusDateInput} 
            onChange={(e) => setStatusDateInput(e.target.value)} 
          />
          <button type="submit" className="btn btn-secondary btn-sm">
            Recalculate EVM
          </button>
        </form>
      </div>

      {error && <AlertBanner type="danger" message={error} onDismiss={() => setError(null)} />}

      {/* Threshold Warnings */}
      {evmData?.warnings && evmData.warnings.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          {evmData.warnings.map((w, idx) => (
            <AlertBanner
              key={idx}
              type={w.severity === 'CRITICAL' ? 'danger' : 'warning'}
              title={`${w.type.replace(/_/g, ' ')}`}
              message={w.message}
            />
          ))}
        </div>
      )}

      {/* EVM Top Metric Cards */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <div className="stat-card">
          <span className="stat-label">Planned Value (PV)</span>
          <span className="stat-value">PKR {Number(evmData?.pv || 0).toLocaleString()}</span>
          <span className="stat-subtext">Linear baseline accrual to date</span>
        </div>

        <div className="stat-card">
          <span className="stat-label">Earned Value (EV)</span>
          <span className="stat-value">PKR {Number(evmData?.ev || 0).toLocaleString()}</span>
          <span className="stat-subtext">Value of work completed</span>
        </div>

        <div className="stat-card">
          <span className="stat-label">Actual Cost (AC)</span>
          <span className="stat-value">PKR {Number(evmData?.ac || 0).toLocaleString()}</span>
          <span className="stat-subtext">Total expenditure incurred</span>
        </div>

        <div className="stat-card">
          <span className="stat-label">CPI (EV / AC)</span>
          <span className="stat-value" style={{ color: evmData?.cpi < 0.9 ? '#b91c1c' : '#15803d' }}>
            {evmData?.cpi}
          </span>
          <span className="stat-subtext">
            CV: <span style={{ color: evmData?.cv < 0 ? '#b91c1c' : '#15803d', fontWeight: '600' }}>
              PKR {Number(evmData?.cv || 0).toLocaleString()}
            </span>
          </span>
        </div>

        <div className="stat-card">
          <span className="stat-label">SPI (EV / PV)</span>
          <span className="stat-value" style={{ color: evmData?.spi < 0.9 ? '#b91c1c' : '#15803d' }}>
            {evmData?.spi}
          </span>
          <span className="stat-subtext">
            SV: <span style={{ color: evmData?.sv < 0 ? '#b91c1c' : '#15803d', fontWeight: '600' }}>
              PKR {Number(evmData?.sv || 0).toLocaleString()}
            </span>
          </span>
        </div>

        <div className="stat-card">
          <span className="stat-label">Estimate at Completion (EAC)</span>
          <span className="stat-value">PKR {Number(evmData?.eac || 0).toLocaleString()}</span>
          <span className="stat-subtext">
            VAC: <span style={{ color: evmData?.vac < 0 ? '#f87171' : '#34d399' }}>
              PKR {Number(evmData?.vac || 0).toLocaleString()}
            </span>
          </span>
        </div>
      </div>

      {/* EVM Charts: PV/EV/AC comparison and S-Curve */}
      <EvmCharts evmData={evmData} sCurveData={sCurveData} />

      {/* Detailed Activity EVM Table */}
      <div className="glass-panel" style={{ marginTop: '24px' }}>
        <h3 style={{ fontSize: '1.2rem', marginBottom: '6px' }}>Activity-by-Activity EVM Calculation Ledger</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', marginBottom: '16px' }}>
          Exact programmatic EVM breakdown evaluated as of {evmData?.status_date}.
        </p>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Activity Name</th>
                <th>Est. Cost (BAC)</th>
                <th>Planned Value (PV)</th>
                <th>Earned Value (EV)</th>
                <th>Actual Cost (AC)</th>
                <th>Cost Var (CV)</th>
                <th>Sched Var (SV)</th>
                <th>CPI</th>
                <th>SPI</th>
                <th>Progress</th>
              </tr>
            </thead>
            <tbody>
              {evmData?.activity_breakdown?.map((act) => (
                <tr key={act.activity_id}>
                  <td><span className="mono-pill">{act.code}</span></td>
                  <td style={{ fontWeight: '500', maxWidth: '220px' }}>{act.name}</td>
                  <td>PKR {Number(act.estimated_cost).toLocaleString()}</td>
                  <td>PKR {Number(act.pv).toLocaleString()}</td>
                  <td><strong>PKR {Number(act.ev).toLocaleString()}</strong></td>
                  <td>PKR {Number(act.ac).toLocaleString()}</td>
                  <td style={{ color: act.cv < 0 ? '#f87171' : '#34d399', fontWeight: 'bold' }}>
                    PKR {Number(act.cv).toLocaleString()}
                  </td>
                  <td style={{ color: act.sv < 0 ? '#f87171' : '#34d399', fontWeight: 'bold' }}>
                    PKR {Number(act.sv).toLocaleString()}
                  </td>
                  <td>
                    <span style={{ color: act.cpi < 0.9 ? '#ef4444' : '#10b981', fontWeight: 'bold' }}>
                      {act.cpi}
                    </span>
                  </td>
                  <td>
                    <span style={{ color: act.spi < 0.9 ? '#ef4444' : '#10b981', fontWeight: 'bold' }}>
                      {act.spi}
                    </span>
                  </td>
                  <td>{act.progress_percent}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
