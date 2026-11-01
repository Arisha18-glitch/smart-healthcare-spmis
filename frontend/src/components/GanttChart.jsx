import React, { useState } from 'react';

export default function GanttChart({ scheduleData, milestones = [], statusDate, deadline }) {
  const [hoveredTask, setHoveredTask] = useState(null);

  if (!scheduleData || !scheduleData.activities || scheduleData.activities.length === 0) {
    return <div className="glass-panel">No activities found to display Gantt chart.</div>;
  }

  const activities = scheduleData.activities;
  const projectStart = new Date(scheduleData.project_start);
  const projFinish = new Date(scheduleData.projected_finish);
  const deadlineDate = new Date(deadline || scheduleData.deadline);
  const statusDateObj = new Date(statusDate || '2026-10-26');

  // Find overall timeline bounds
  const minDate = new Date(projectStart);
  minDate.setDate(minDate.getDate() - 3);

  const maxDate = new Date(Math.max(projFinish.getTime(), deadlineDate.getTime()));
  maxDate.setDate(maxDate.getDate() + 7);

  const totalDays = Math.max(1, Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24)));
  const dayWidth = 14;
  const labelWidth = 260;
  const rowHeight = 36;
  const headerHeight = 50;
  const svgWidth = labelWidth + totalDays * dayWidth;
  const svgHeight = headerHeight + activities.length * rowHeight + 40;

  const getX = (dateStr) => {
    const d = new Date(dateStr);
    const diff = (d - minDate) / (1000 * 60 * 60 * 24);
    return labelWidth + diff * dayWidth;
  };

  const getBarColor = (act) => {
    if (act.progress_percent >= 100) return '#34d399';
    if (act.status_label === 'Delayed') return '#fbbf24';
    if (act.is_critical) return '#f87171';
    return '#818cf8';
  };

  // Generate week grid markers
  const weekMarkers = [];
  const curr = new Date(minDate);
  while (curr <= maxDate) {
    weekMarkers.push({
      dateStr: curr.toISOString().split('T')[0],
      x: getX(curr.toISOString().split('T')[0]),
      label: `${curr.toLocaleString('default', { month: 'short' })} ${curr.getDate()}`
    });
    curr.setDate(curr.getDate() + 7);
  }

  const statusX = getX(statusDateObj.toISOString().split('T')[0]);
  const deadlineX = getX(deadlineDate.toISOString().split('T')[0]);

  return (
    <div className="glass-panel" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h3 style={{ fontSize: '1.1rem', color: '#fff' }}>Gantt Schedule & Critical Path Timeline</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
            Baseline vs Forecast schedule. Critical activities in red, delayed in amber.
          </p>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '0.76rem', flexWrap: 'wrap', color: 'var(--text-muted)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#34d399' }}></span> Complete
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#818cf8' }}></span> On Track
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#fbbf24' }}></span> Delayed
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#f87171' }}></span> Critical Path
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '10px', height: '5px', border: '1px dashed rgba(255,255,255,0.2)' }}></span> Baseline
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ color: '#fbbf24', fontSize: '12px' }}>◆</span> Milestone
          </span>
        </div>
      </div>

      <div className="gantt-svg-container" style={{ position: 'relative' }}>
        <svg width={svgWidth} height={svgHeight}>
          {/* Background */}
          <rect x="0" y="0" width={svgWidth} height={svgHeight} fill="#0a0a0f" rx="0" />

          {/* Header Background */}
          <rect x="0" y="0" width={svgWidth} height={headerHeight} fill="rgba(255,255,255,0.02)" />
          <line x1="0" y1={headerHeight} x2={svgWidth} y2={headerHeight} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />

          {/* Left Label column boundary */}
          <line x1={labelWidth} y1="0" x2={labelWidth} y2={svgHeight} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />

          {/* Week Grid Lines */}
          {weekMarkers.map((wm, i) => (
            <g key={i}>
              <line x1={wm.x} y1={headerHeight} x2={wm.x} y2={svgHeight} stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
              <text x={wm.x + 4} y={headerHeight - 12} fill="rgba(255,255,255,0.25)" fontSize="10" fontFamily="var(--font-mono)">
                {wm.label}
              </text>
            </g>
          ))}

          {/* Activity Rows */}
          {activities.map((act, idx) => {
            const y = headerHeight + idx * rowHeight;
            const bStartX = getX(act.baseline_start);
            const bEndX = getX(act.baseline_finish);
            const bWidth = Math.max(8, bEndX - bStartX + dayWidth);

            const fStartX = getX(act.forecast_start);
            const fEndX = getX(act.forecast_finish);
            const fWidth = Math.max(8, fEndX - fStartX + dayWidth);

            const isHovered = hoveredTask && hoveredTask.id === act.id;

            return (
              <g 
                key={act.id} 
                onMouseEnter={() => setHoveredTask(act)}
                onMouseLeave={() => setHoveredTask(null)}
                style={{ cursor: 'pointer' }}
              >
                {/* Row alternating background */}
                <rect 
                  x="0" 
                  y={y} 
                  width={svgWidth} 
                  height={rowHeight} 
                  fill={isHovered ? 'rgba(255,255,255,0.04)' : idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)'} 
                />

                {/* Left Label Text */}
                <text x="12" y={y + 16} fill={act.is_critical ? '#fca5a5' : '#e8eaed'} fontSize="11" fontWeight={act.is_critical ? '600' : '500'}>
                  <tspan fontWeight="bold" fill={act.is_critical ? '#f87171' : '#818cf8'}>{act.activity_code}</tspan>: {act.name.length > 25 ? act.name.slice(0, 25) + '…' : act.name}
                </text>
                <text x="12" y={y + 29} fill="rgba(255,255,255,0.25)" fontSize="9">
                  {act.assignee_name} | Float: {act.slack}d | {act.progress_percent}%
                </text>

                {/* Baseline bar (top half, hollow/dashed outline) */}
                <rect 
                  x={bStartX} 
                  y={y + 5} 
                  width={bWidth} 
                  height={10} 
                  rx="3" 
                  fill="rgba(255,255,255,0.03)"
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="1"
                  strokeDasharray="2,2"
                />

                {/* Forecast bar (bottom half, solid color) */}
                <rect 
                  x={fStartX} 
                  y={y + 17} 
                  width={fWidth} 
                  height={14} 
                  rx="4" 
                  fill={getBarColor(act)} 
                  opacity={isHovered ? 1 : 0.8}
                />

                {/* Progress bar fill inside forecast bar */}
                {act.progress_percent > 0 && (
                  <rect 
                    x={fStartX} 
                    y={y + 17} 
                    width={fWidth * (act.progress_percent / 100)} 
                    height={14} 
                    rx="4" 
                    fill="rgba(255,255,255,0.2)" 
                  />
                )}

                {/* Percent complete text on bar */}
                <text x={fStartX + 6} y={y + 28} fill="#ffffff" fontSize="9" fontWeight="bold">
                  {act.progress_percent > 15 ? `${act.progress_percent}%` : ''}
                </text>
              </g>
            );
          })}

          {/* Milestone markers */}
          {milestones.map((m) => {
            const mx = getX(m.target_date);
            const my = headerHeight - 24;
            return (
              <g key={m.id} title={`${m.name} (${m.status})`}>
                <polygon 
                  points={`${mx},${my} ${mx + 6},${my + 6} ${mx},${my + 12} ${mx - 6},${my + 6}`} 
                  fill={m.status === 'Achieved' ? '#34d399' : m.status === 'Delayed' ? '#f87171' : '#fbbf24'} 
                />
              </g>
            );
          })}

          {/* Status Date Vertical Line */}
          <line 
            x1={statusX} 
            y1={headerHeight} 
            x2={statusX} 
            y2={svgHeight} 
            stroke="#fbbf24" 
            strokeWidth="1.5" 
            strokeDasharray="4,3" 
            opacity="0.6"
          />
          <rect x={statusX - 48} y={8} width="96" height="22" rx="6" fill="rgba(251, 191, 36, 0.15)" stroke="rgba(251,191,36,0.3)" strokeWidth="1" />
          <text x={statusX} y={23} fill="#fcd34d" fontSize="9.5" fontWeight="600" textAnchor="middle">
            STATUS: {statusDate || '2026-10-26'}
          </text>

          {/* Project Deadline Vertical Line */}
          <line 
            x1={deadlineX} 
            y1={headerHeight} 
            x2={deadlineX} 
            y2={svgHeight} 
            stroke="#f87171" 
            strokeWidth="1.5" 
            strokeDasharray="6,4" 
            opacity="0.5"
          />
          <rect x={deadlineX - 50} y={8} width="100" height="22" rx="6" fill="rgba(248, 113, 113, 0.12)" stroke="rgba(248,113,113,0.25)" strokeWidth="1" />
          <text x={deadlineX} y={23} fill="#fca5a5" fontSize="9.5" fontWeight="600" textAnchor="middle">
            DEADLINE: {deadline || '2026-12-27'}
          </text>
        </svg>

        {/* Hover Tooltip */}
        {hoveredTask && (
          <div style={{
            position: 'absolute',
            bottom: '15px',
            right: '20px',
            background: '#1a1a2e',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '10px',
            padding: '14px 18px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            fontSize: '0.8rem',
            pointerEvents: 'none',
            zIndex: 10,
            maxWidth: '340px',
            color: '#e8eaed'
          }}>
            <div style={{ fontWeight: 'bold', color: '#818cf8', marginBottom: '6px', fontSize: '0.88rem' }}>
              {hoveredTask.activity_code}: {hoveredTask.name}
            </div>
            <div><span style={{color:'var(--text-subtle)'}}>Assignee:</span> {hoveredTask.assignee_name} ({hoveredTask.assignee_role})</div>
            <div><span style={{color:'var(--text-subtle)'}}>Baseline:</span> {hoveredTask.baseline_start} → {hoveredTask.baseline_finish}</div>
            <div><span style={{color:'var(--text-subtle)'}}>Forecast:</span> {hoveredTask.forecast_start} → {hoveredTask.forecast_finish}</div>
            <div><span style={{color:'var(--text-subtle)'}}>Float:</span> {hoveredTask.slack} days ({hoveredTask.is_critical ? 'Critical Path' : 'Non-critical'})</div>
            <div><span style={{color:'var(--text-subtle)'}}>Delay:</span> {hoveredTask.delay_days} days</div>
            <div><span style={{color:'var(--text-subtle)'}}>Progress:</span> {hoveredTask.progress_percent}% · <span style={{color:'var(--text-subtle)'}}>Cost:</span> PKR {Number(hoveredTask.estimated_cost).toLocaleString()}</div>
          </div>
        )}
      </div>
    </div>
  );
}
