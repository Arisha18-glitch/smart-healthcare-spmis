import React from 'react';
import StatusBadge from './StatusBadge';

export default function PdpcView({ pdpcData }) {
  if (!pdpcData || pdpcData.length === 0) {
    return <div className="glass-panel">No open risks found for PDPC analysis.</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div className="glass-panel" style={{ padding: '16px 20px' }}>
        <h3 style={{ fontSize: '1.05rem', marginBottom: '4px', color: '#fff' }}>
          Process Decision Program Chart (PDPC)
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
          Contingency tree: <strong style={{color:'var(--text-main)'}}>Goal → Potential Problem → Preventive Action → Corrective Action</strong>
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {pdpcData.map((item, idx) => (
          <div key={idx} className="glass-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="mono-pill">{item.risk_code}</span>
                <span style={{ fontWeight: '600', fontSize: '0.95rem', color: '#fff' }}>{item.potential_problem}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.76rem', color: 'var(--text-subtle)' }}>Score: {item.score} ({item.likelihood} × {item.impact})</span>
                <StatusBadge status={item.rating} />
              </div>
            </div>

            {/* Tree Flow — clean borderless panels */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '14px', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#a5b4fc', fontWeight: '700', marginBottom: '6px' }}>
                  🎯 Project Objective
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  {item.goal}
                </div>
              </div>

              <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '14px', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6ee7b7', fontWeight: '700', marginBottom: '6px' }}>
                  🛡️ Preventive Action
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  {item.preventive_action}
                </div>
              </div>

              <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '14px', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#fca5a5', fontWeight: '700', marginBottom: '6px' }}>
                  🚨 Corrective Action
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  {item.corrective_action}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
