import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, 
  LineChart, Line, CartesianGrid, ReferenceLine 
} from 'recharts';

const CHART_COLORS = {
  pv: '#818cf8',
  ev: '#34d399',
  ac: '#f87171',
  bac: '#c084fc',
  eac: '#fbbf24'
};

const darkTooltipStyle = {
  background: '#1a1a2e',
  borderColor: 'rgba(255,255,255,0.08)',
  borderRadius: '10px',
  color: '#e8eaed',
  boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
  fontSize: '0.82rem'
};

export default function EvmCharts({ evmData, sCurveData }) {
  if (!evmData) {
    return <div className="glass-panel">Loading EVM performance charts...</div>;
  }

  // Summary bar data
  const summaryBarData = [
    { name: 'PV', amount: evmData.pv, fill: CHART_COLORS.pv },
    { name: 'EV', amount: evmData.ev, fill: CHART_COLORS.ev },
    { name: 'AC', amount: evmData.ac, fill: CHART_COLORS.ac },
    { name: 'BAC', amount: evmData.bac, fill: CHART_COLORS.bac },
    { name: 'EAC', amount: evmData.eac, fill: CHART_COLORS.eac }
  ];

  // Activity-level breakdown data
  const activityData = (evmData.activity_breakdown || []).map(a => ({
    code: a.code,
    name: a.name,
    PV: a.pv,
    EV: a.ev,
    AC: a.ac
  }));

  const formatPKR = (val) => {
    if (val === null || val === undefined) return '';
    return `${(val / 1000).toFixed(0)}k`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top row: Summary Bar & S-Curve */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: '20px' }}>
        {/* Core EVM Bar Chart */}
        <div className="glass-panel">
          <h3 style={{ fontSize: '1.05rem', marginBottom: '4px', color: '#fff' }}>EVM Aggregate Comparison</h3>
          <p style={{ color: 'var(--text-subtle)', fontSize: '0.8rem', marginBottom: '16px' }}>
            PV, EV, AC, BAC and forecast EAC at Status Date.
          </p>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={summaryBarData} margin={{ top: 20, right: 20, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }} axisLine={{ stroke: 'rgba(255,255,255,0.06)' }} />
                <YAxis tickFormatter={formatPKR} tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={{ stroke: 'rgba(255,255,255,0.06)' }} />
                <Tooltip 
                  formatter={(val) => [`PKR ${Number(val).toLocaleString()}`, 'Value']}
                  contentStyle={darkTooltipStyle}
                />
                <Bar dataKey="amount" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* S-Curve Line Chart */}
        <div className="glass-panel">
          <h3 style={{ fontSize: '1.05rem', marginBottom: '4px', color: '#fff' }}>Cumulative S-Curve (PV · EV · AC)</h3>
          <p style={{ color: 'var(--text-subtle)', fontSize: '0.8rem', marginBottom: '16px' }}>
            Weekly cumulative trajectories from start to deadline ({evmData.status_date} checkpoint).
          </p>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <LineChart data={sCurveData || []} margin={{ top: 20, right: 20, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={{ stroke: 'rgba(255,255,255,0.06)' }} />
                <YAxis tickFormatter={formatPKR} tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={{ stroke: 'rgba(255,255,255,0.06)' }} />
                <Tooltip 
                  formatter={(val, name) => [`PKR ${Number(val).toLocaleString()}`, name]}
                  contentStyle={darkTooltipStyle}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px', color: 'rgba(255,255,255,0.5)' }} />
                <ReferenceLine x={evmData.status_date} stroke="rgba(251,191,36,0.4)" strokeDasharray="3 3" label={{ value: 'Status', fill: '#fcd34d', fontSize: 10 }} />
                <Line type="monotone" dataKey="pv" stroke={CHART_COLORS.pv} name="Planned Value" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="ev" stroke={CHART_COLORS.ev} name="Earned Value" strokeWidth={2.5} connectNulls={false} />
                <Line type="monotone" dataKey="ac" stroke={CHART_COLORS.ac} name="Actual Cost" strokeWidth={2.5} connectNulls={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Activity Breakdown Bar Chart */}
      <div className="glass-panel">
        <h3 style={{ fontSize: '1.05rem', marginBottom: '4px', color: '#fff' }}>Work Package EVM Breakdown</h3>
        <p style={{ color: 'var(--text-subtle)', fontSize: '0.8rem', marginBottom: '16px' }}>
          PV, EV, and AC across all {activityData.length} project activities.
        </p>
        <div style={{ width: '100%', height: 340 }}>
          <ResponsiveContainer>
            <BarChart data={activityData} margin={{ top: 20, right: 20, left: 10, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="code" angle={-30} textAnchor="end" tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 10 }} interval={0} axisLine={{ stroke: 'rgba(255,255,255,0.06)' }} />
              <YAxis tickFormatter={formatPKR} tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={{ stroke: 'rgba(255,255,255,0.06)' }} />
              <Tooltip 
                formatter={(val, name) => [`PKR ${Number(val).toLocaleString()}`, name]}
                contentStyle={darkTooltipStyle}
              />
              <Legend wrapperStyle={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }} />
              <Bar dataKey="PV" fill={CHART_COLORS.pv} radius={[3, 3, 0, 0]} />
              <Bar dataKey="EV" fill={CHART_COLORS.ev} radius={[3, 3, 0, 0]} />
              <Bar dataKey="AC" fill={CHART_COLORS.ac} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
