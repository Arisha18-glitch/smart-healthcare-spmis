import React from 'react';
import StatusBadge from './StatusBadge';

export default function RiskMatrix({ risksData, onSelectRisk }) {
  if (!risksData || !risksData.ranked_risks) {
    return <div className="glass-panel">Loading risk matrix...</div>;
  }

  const { ranked_risks, grid_5x5, total_count, high_count, medium_count, low_count } = risksData;

  const getCellClass = (likelihood, impact) => {
    const score = likelihood * impact;
    if (score >= 15) return 'cell-high';
    if (score >= 8) return 'cell-med';
    return 'cell-low';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Summary KPI row */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 0 }}>
        <div className="stat-card">
          <span className="stat-label">Total Identified Risks</span>
          <span className="stat-value">{total_count}</span>
          <span className="stat-subtext">Active risk register</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">High Priority Risks</span>
          <span className="stat-value" style={{ color: '#fca5a5' }}>{high_count}</span>
          <span className="stat-subtext">Score ≥ 15 (Requires mitigation)</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Medium Priority Risks</span>
          <span className="stat-value" style={{ color: '#fcd34d' }}>{medium_count}</span>
          <span className="stat-subtext">Score 8 – 14</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Low Priority Risks</span>
          <span className="stat-value" style={{ color: '#6ee7b7' }}>{low_count}</span>
          <span className="stat-subtext">Score &lt; 8</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* 5x5 Color Matrix */}
        <div className="glass-panel">
          <h3 style={{ fontSize: '1.05rem', marginBottom: '4px', color: '#fff' }}>5×5 Risk Prioritization Heatmap</h3>
          <p style={{ color: 'var(--text-subtle)', fontSize: '0.8rem', marginBottom: '16px' }}>
            Likelihood (Y) vs Impact (X). High (≥15), Medium (8-14), Low (&lt;8).
          </p>

          <table className="risk-matrix-table">
            <thead>
              <tr>
                <th style={{ width: '12%', background: 'transparent', border: 'none' }}></th>
                <th colSpan="5" style={{ background: 'rgba(255,255,255,0.02)', padding: '6px', fontSize: '0.7rem' }}>
                  IMPACT (1 – 5) →
                </th>
              </tr>
              <tr>
                <th style={{ fontSize: '0.65rem' }}>LIKELIHOOD ↓</th>
                <th>1</th>
                <th>2</th>
                <th>3</th>
                <th>4</th>
                <th>5</th>
              </tr>
            </thead>
            <tbody>
              {[5, 4, 3, 2, 1].map((lik) => (
                <tr key={lik}>
                  <td style={{ fontWeight: 'bold', fontSize: '0.78rem', background: 'rgba(255,255,255,0.02)' }}>
                    {lik}
                  </td>
                  {[1, 2, 3, 4, 5].map((imp) => {
                    const cellRisks = (grid_5x5 && grid_5x5[lik] && grid_5x5[lik][imp]) ? grid_5x5[lik][imp] : [];
                    const cellClass = getCellClass(lik, imp);
                    const score = lik * imp;

                    return (
                      <td key={imp} className={cellClass} title={`Likelihood: ${lik}, Impact: ${imp}, Score: ${score}`}>
                        <div style={{ fontSize: '0.65rem', opacity: 0.4, position: 'absolute', top: '3px', right: '5px' }}>
                          {score}
                        </div>
                        {cellRisks.map((r, i) => (
                          <div 
                            key={i} 
                            style={{ 
                              background: 'rgba(255,255,255,0.08)', 
                              padding: '2px 5px', 
                              borderRadius: '4px', 
                              margin: '2px 0',
                              fontSize: '0.7rem',
                              fontWeight: 'bold',
                              cursor: 'pointer'
                            }}
                            title={r.title}
                            onClick={() => onSelectRisk && onSelectRisk(r.code)}
                          >
                            {r.code}
                          </div>
                        ))}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Ranked Risks Table */}
        <div className="glass-panel">
          <h3 style={{ fontSize: '1.05rem', marginBottom: '4px', color: '#fff' }}>Ranked Risk Register</h3>
          <p style={{ color: 'var(--text-subtle)', fontSize: '0.8rem', marginBottom: '16px' }}>
            Sorted by severity score (Likelihood × Impact).
          </p>

          <div className="table-container" style={{ maxHeight: '390px', overflowY: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Risk Title</th>
                  <th>L × I</th>
                  <th>Score</th>
                  <th>Rating</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {ranked_risks.map((r) => (
                  <tr key={r.id}>
                    <td><span className="mono-pill">{r.risk_code}</span></td>
                    <td style={{ maxWidth: '200px' }} title={r.description}>
                      <div style={{ fontWeight: '500' }}>{r.title}</div>
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>{r.likelihood} × {r.impact}</td>
                    <td><strong style={{ color: '#fff' }}>{r.score}</strong></td>
                    <td><StatusBadge status={r.rating} /></td>
                    <td><StatusBadge status={r.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
