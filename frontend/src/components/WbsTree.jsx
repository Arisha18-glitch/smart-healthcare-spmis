import React, { useState } from 'react';

export default function WbsTree({ wbsData }) {
  const [collapsed, setCollapsed] = useState({});

  if (!wbsData || !wbsData.deliverables) {
    return <div className="glass-panel">Loading Work Breakdown Structure (WBS)...</div>;
  }

  const toggleCollapse = (id) => {
    setCollapsed(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const { project_name, approved_budget, total_wbs_planned_cost, deliverables } = wbsData;
  const reserve = approved_budget - total_wbs_planned_cost;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Level 1: Project Root Panel */}
      <div className="glass-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', color: 'var(--accent)', fontWeight: '700', letterSpacing: '0.06em' }}>
              WBS LEVEL 1 · PROJECT ROOT
            </div>
            <h2 style={{ fontSize: '1.3rem', color: '#fff', marginTop: '4px' }}>{project_name}</h2>
          </div>

          <div style={{ display: 'flex', gap: '28px', alignItems: 'center' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.04em' }}>Planned BAC</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#fff' }}>
                PKR {Number(total_wbs_planned_cost).toLocaleString()}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.04em' }}>Approved Budget</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#a5b4fc' }}>
                PKR {Number(approved_budget).toLocaleString()}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.04em' }}>Reserve</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: reserve >= 0 ? '#6ee7b7' : '#fca5a5' }}>
                PKR {Number(reserve).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Level 2: Deliverables */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {deliverables.map((deliv) => {
          const isCollapsed = !!collapsed[deliv.id];

          return (
            <div key={deliv.id} className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
              {/* Deliverable Header */}
              <div 
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  padding: '14px 20px', 
                  background: 'rgba(255,255,255,0.02)',
                  borderBottom: isCollapsed ? 'none' : '1px solid var(--border)',
                  cursor: 'pointer'
                }}
                onClick={() => toggleCollapse(deliv.id)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button 
                    style={{ background: 'transparent', border: 'none', color: 'var(--accent)', fontSize: '0.9rem', cursor: 'pointer', width: '20px', padding: 0 }}
                  >
                    {isCollapsed ? '▶' : '▼'}
                  </button>
                  <span className="mono-pill">{deliv.code}</span>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '1rem', color: '#fff' }}>{deliv.title}</div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {deliv.category} · Priority: {deliv.priority} · {deliv.work_package_count} Work Packages
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Deliverable Roll-up</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 'bold', color: '#a5b4fc' }}>
                    PKR {Number(deliv.estimated_cost).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Level 3: Work Packages */}
              {!isCollapsed && (
                <div style={{ padding: '14px 20px' }}>
                  {deliv.work_packages.length === 0 ? (
                    <div style={{ color: 'var(--text-subtle)', fontStyle: 'italic', fontSize: '0.84rem' }}>
                      No work packages defined yet for this deliverable.
                    </div>
                  ) : (
                    <div className="table-container">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>WBS Code</th>
                            <th>Work Package Name</th>
                            <th>Assignee</th>
                            <th>Duration</th>
                            <th>Estimated Cost</th>
                            <th>Actual Cost</th>
                            <th>Progress</th>
                            <th>Delay</th>
                          </tr>
                        </thead>
                        <tbody>
                          {deliv.work_packages.map((wp) => (
                            <tr key={wp.id}>
                              <td><span className="mono-pill">{wp.code}</span></td>
                              <td style={{ fontWeight: '500' }}>{wp.name}</td>
                              <td style={{ color: 'var(--text-muted)' }}>{wp.assignee}</td>
                              <td style={{ color: 'var(--text-muted)' }}>{wp.duration_days}d</td>
                              <td><strong>PKR {Number(wp.estimated_cost).toLocaleString()}</strong></td>
                              <td style={{ color: 'var(--text-muted)' }}>PKR {Number(wp.actual_cost).toLocaleString()}</td>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <div className="progress-bar-bg" style={{ width: '60px' }}>
                                    <div className="progress-bar-fill" style={{ width: `${wp.progress_percent}%` }}></div>
                                  </div>
                                  <span style={{ fontSize: '0.8rem' }}>{wp.progress_percent}%</span>
                                </div>
                              </td>
                              <td>
                                {wp.delay_days > 0 ? (
                                  <span style={{ color: '#fcd34d', fontWeight: 'bold' }}>+{wp.delay_days}d</span>
                                ) : (
                                  <span style={{ color: 'var(--text-subtle)' }}>—</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
