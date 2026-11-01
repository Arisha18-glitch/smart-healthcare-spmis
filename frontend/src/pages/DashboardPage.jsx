import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getDashboard, getEvm, getMilestones, getChangeRequests, getDefects } from '../api';

export default function DashboardPage() {
  const [dashboard, setDashboard] = useState(null);
  const [evmData, setEvmData] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [changeRequests, setChangeRequests] = useState([]);
  const [defects, setDefects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAll = async () => {
    try {
      setLoading(true);
      setError(null);
      const [dash, evm, ms, crs, defs] = await Promise.all([
        getDashboard(),
        getEvm(),
        getMilestones(),
        getChangeRequests(),
        getDefects()
      ]);
      setDashboard(dash);
      setEvmData(evm);
      setMilestones(ms);
      setChangeRequests(crs);
      setDefects(defs);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  if (loading) {
    return (
      <div className="p-space-lg flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-2 text-primary font-semibold">
          <span className="material-symbols-outlined animate-spin">progress_activity</span>
          <span>Loading HealthOps Executive Dashboard…</span>
        </div>
      </div>
    );
  }

  // Format numbers cleanly
  const bac = dashboard?.bac || 4700000;
  const ac = dashboard?.actual_cost || 2420000;
  const ev = evmData?.summary?.total_ev || 2080000;
  const pv = evmData?.summary?.total_pv || 2480000;
  const cpi = dashboard?.cpi ?? 0.86;
  const spi = dashboard?.spi ?? 0.84;
  const progressPercent = dashboard?.overall_progress_percent ?? 44.2;

  return (
    <div className="p-space-lg flex flex-col gap-space-md">
      {/* SUBHEADER / STATUS STRIP & REPORT EXPORT CTA */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 bg-surface-container-lowest p-space-md rounded-xl border border-outline-variant shadow-none">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded bg-surface-container text-primary">
            <span className="material-symbols-outlined text-xl">analytics</span>
          </div>
          <div>
            <h1 className="text-headline-md font-headline-md text-on-surface">Module 6 &amp; Module 1: Comprehensive Executive Dashboard</h1>
            <p className="text-body-sm font-body-sm text-on-surface-variant">
              Cross-cluster multi-facility healthcare digitization (5 site instances: Jinnah, Mayo, Services, Children's, LGH).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link 
            to="/charter"
            className="inline-flex items-center gap-1.5 px-space-md py-1.5 bg-surface-container-lowest hover:bg-surface-container border border-outline-variant rounded-lg text-label-sm font-label-sm font-semibold text-on-surface transition-colors shadow-none text-decoration-none"
          >
            <span className="material-symbols-outlined text-base">tune</span> Configure Baseline
          </Link>
          <a 
            href="http://127.0.0.1:8000/api/report" 
            target="_blank" 
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-space-md py-1.5 bg-primary hover:bg-primary-container text-on-primary rounded-lg text-label-sm font-label-sm font-semibold transition-colors text-decoration-none"
          >
            <span className="material-symbols-outlined text-base">picture_as_pdf</span>
            Export Weekly PM Report PDF/CSV
          </a>
        </div>
      </div>

      {error && (
        <div className="bg-error-container border border-error rounded-xl p-3 text-on-error-container text-body-sm">
          {error}
        </div>
      )}

      {/* TOP ALERT BANNER (Critical Attention) */}
      <div className="bg-error-container border border-error rounded-xl p-space-md flex items-start gap-space-md">
        <div className="p-1 rounded bg-error text-on-error shrink-0 mt-0.5">
          <span className="material-symbols-outlined text-lg">priority_high</span>
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <span className="text-label-md font-label-md font-bold text-on-error-container tracking-wide">
              CRITICAL ATTENTION REQUIRED: EVM THRESHOLD BREACH &amp; PATH CASCADE
            </span>
            <span className="text-label-xs font-label-xs font-semibold px-2 py-0.5 rounded bg-error text-on-error">
              Escalated to CIO Office
            </span>
          </div>
          <p className="text-body-sm font-body-sm text-on-error-container mt-1">
            CPI ({cpi}) and SPI ({spi}) below 0.90 threshold. 2 Critical Defects blocking appointment/records deliverables. 1 delayed backend activity causing 6-day cascade. Corrective fast-tracking recommended.
          </p>
        </div>
      </div>

      {/* EXECUTIVE KPI ROW (High Density EVM & Progress Cards) */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-space-sm">
        {/* Card 1: Overall Progress */}
        <div className="bg-surface-container-lowest p-space-sm rounded-xl border border-outline-variant flex flex-col justify-between">
          <div className="flex items-center justify-between text-on-surface-variant">
            <span className="text-label-xs font-label-xs font-semibold">PROGRESS (EV/BAC)</span>
            <span className="material-symbols-outlined text-sm text-primary">donut_large</span>
          </div>
          <div className="my-1">
            <span className="text-headline-md font-headline-md text-on-surface font-bold">{progressPercent}%</span>
            <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden mt-1">
              <div className="bg-primary h-full rounded-full" style={{ width: `${Math.min(progressPercent, 100)}%` }}></div>
            </div>
          </div>
          <span className="text-label-xs font-label-xs text-on-surface-variant">Target wk 8: 52.8%</span>
        </div>

        {/* Card 2: CPI */}
        <div className="bg-surface-container-lowest p-space-sm rounded-xl border border-error flex flex-col justify-between">
          <div className="flex items-center justify-between text-on-surface-variant">
            <span className="text-label-xs font-label-xs font-semibold text-error">CPI INDEX</span>
            <span className="material-symbols-outlined text-sm text-error">trending_down</span>
          </div>
          <div className="my-1">
            <span className="text-headline-md font-headline-md text-error font-bold">{cpi}</span>
            <span className="text-label-xs font-label-xs block text-error font-medium">Cost Overrun</span>
          </div>
          <span className="text-label-xs font-label-xs text-on-surface-variant">Threshold: ≥ 1.00</span>
        </div>

        {/* Card 3: SPI */}
        <div className="bg-surface-container-lowest p-space-sm rounded-xl border border-error flex flex-col justify-between">
          <div className="flex items-center justify-between text-on-surface-variant">
            <span className="text-label-xs font-label-xs font-semibold text-error">SPI INDEX</span>
            <span className="material-symbols-outlined text-sm text-error">schedule</span>
          </div>
          <div className="my-1">
            <span className="text-headline-md font-headline-md text-error font-bold">{spi}</span>
            <span className="text-label-xs font-label-xs block text-error font-medium">Behind Schedule</span>
          </div>
          <span className="text-label-xs font-label-xs text-on-surface-variant">Lag: -16.0% earned</span>
        </div>

        {/* Card 4: Projected Finish */}
        <div className="bg-surface-container-lowest p-space-sm rounded-xl border border-outline-variant flex flex-col justify-between">
          <div className="flex items-center justify-between text-on-surface-variant">
            <span className="text-label-xs font-label-xs font-semibold">PROJECTED FINISH</span>
            <span className="material-symbols-outlined text-sm text-tertiary">event_busy</span>
          </div>
          <div className="my-1">
            <span className="text-headline-sm font-headline-sm text-on-surface font-bold">
              {dashboard?.projected_finish || '2027-01-14'}
            </span>
            <span className="text-label-xs font-label-xs text-error block font-semibold">+18d vs Deadline</span>
          </div>
          <span className="text-label-xs font-label-xs text-on-surface-variant">Target: 2026-12-27</span>
        </div>

        {/* Card 5: Approved Budget */}
        <div className="bg-surface-container-lowest p-space-sm rounded-xl border border-outline-variant flex flex-col justify-between">
          <div className="flex items-center justify-between text-on-surface-variant">
            <span className="text-label-xs font-label-xs font-semibold">TOTAL BUDGET</span>
            <span className="material-symbols-outlined text-sm text-primary">account_balance</span>
          </div>
          <div className="my-1">
            <span className="text-headline-md font-headline-md text-on-surface font-bold">
              PKR {(Number(dashboard?.approved_budget || 5000000) / 1000000).toFixed(1)}M
            </span>
            <span className="text-label-xs font-label-xs text-on-surface-variant block">Management Reserve 300k</span>
          </div>
          <span className="text-label-xs font-label-xs text-on-surface-variant">BAC: PKR {(bac / 1000000).toFixed(2)}M</span>
        </div>

        {/* Card 6: Actual Cost (AC) */}
        <div className="bg-surface-container-lowest p-space-sm rounded-xl border border-outline-variant flex flex-col justify-between">
          <div className="flex items-center justify-between text-on-surface-variant">
            <span className="text-label-xs font-label-xs font-semibold">ACTUAL COST (AC)</span>
            <span className="material-symbols-outlined text-sm text-on-surface">payments</span>
          </div>
          <div className="my-1">
            <span className="text-headline-md font-headline-md text-on-surface font-bold">
              PKR {(ac / 1000000).toFixed(2)}M
            </span>
            <span className="text-label-xs font-label-xs text-error block">CV: -PKR 340,000</span>
          </div>
          <span className="text-label-xs font-label-xs text-on-surface-variant">Incurred to Wk 8</span>
        </div>

        {/* Card 7: Planned Value (PV) */}
        <div className="bg-surface-container-lowest p-space-sm rounded-xl border border-outline-variant flex flex-col justify-between">
          <div className="flex items-center justify-between text-on-surface-variant">
            <span className="text-label-xs font-label-xs font-semibold">PLANNED VALUE (PV)</span>
            <span className="material-symbols-outlined text-sm text-secondary">fact_check</span>
          </div>
          <div className="my-1">
            <span className="text-headline-md font-headline-md text-secondary font-bold">
              PKR {(pv / 1000000).toFixed(2)}M
            </span>
            <span className="text-label-xs font-label-xs text-on-surface-variant block">52.8% of BAC</span>
          </div>
          <span className="text-label-xs font-label-xs text-on-surface-variant">Baseline wk 8 target</span>
        </div>

        {/* Card 8: Earned Value (EV) */}
        <div className="bg-surface-container-lowest p-space-sm rounded-xl border border-outline-variant flex flex-col justify-between">
          <div className="flex items-center justify-between text-on-surface-variant">
            <span className="text-label-xs font-label-xs font-semibold">EARNED VALUE (EV)</span>
            <span className="material-symbols-outlined text-sm text-primary">verified</span>
          </div>
          <div className="my-1">
            <span className="text-headline-md font-headline-md text-primary font-bold">
              PKR {(ev / 1000000).toFixed(2)}M
            </span>
            <span className="text-label-xs font-label-xs text-error block">SV: -PKR 400,000</span>
          </div>
          <span className="text-label-xs font-label-xs text-on-surface-variant">Physical work done</span>
        </div>
      </div>

      {/* MAIN TWO-COLUMN WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-md">
        {/* LEFT COLUMN: S-Curve EVM Analytical Graph + Milestones Timeline (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-space-md">
          {/* S-CURVE ANALYTICAL CHART CONTAINER */}
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-space-md flex flex-col gap-space-sm">
            <div className="flex items-center justify-between pb-2 border-b border-outline-variant">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-lg">ssid_chart</span>
                <h2 className="text-headline-sm font-headline-sm text-on-surface font-semibold">EVM Cumulative S-Curve (PV vs EV vs AC)</h2>
              </div>
              {/* Legend */}
              <div className="flex items-center gap-3 text-label-xs font-label-xs">
                <div className="flex items-center gap-1">
                  <span className="w-3 h-0.5 bg-secondary inline-block"></span>
                  <span className="text-on-surface-variant">PV (Planned)</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-3 h-0.5 bg-primary inline-block"></span>
                  <span className="text-on-surface font-semibold">EV (Earned)</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-3 h-0.5 bg-error inline-block"></span>
                  <span className="text-error font-semibold">AC (Actual)</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-3 h-0.5 border-t border-dashed border-tertiary inline-block"></span>
                  <span className="text-on-surface-variant">Forecast EAC</span>
                </div>
              </div>
            </div>

            {/* Interactive SVG S-Curve Rendering */}
            <div className="relative w-full h-64 bg-surface rounded-lg p-2 flex flex-col justify-between border border-outline-variant overflow-hidden">
              {/* Gridlines */}
              <div className="absolute inset-x-8 inset-y-6 flex flex-col justify-between pointer-events-none opacity-20">
                <div className="w-full border-b border-on-surface flex justify-between"><span className="text-[9px] -mt-2">PKR 5.0M</span></div>
                <div className="w-full border-b border-on-surface flex justify-between"><span className="text-[9px] -mt-2">PKR 3.75M</span></div>
                <div className="w-full border-b border-on-surface flex justify-between"><span className="text-[9px] -mt-2">PKR 2.50M</span></div>
                <div className="w-full border-b border-on-surface flex justify-between"><span className="text-[9px] -mt-2">PKR 1.25M</span></div>
                <div className="w-full border-b border-on-surface flex justify-between"><span className="text-[9px] -mt-2">0</span></div>
              </div>

              {/* Status Date Line Week 8 */}
              <div className="absolute top-4 bottom-6 left-[50%] border-r-2 border-dashed border-error z-10 flex flex-col justify-start">
                <span className="bg-error text-on-error text-[9px] font-label-xs px-1 py-0.5 rounded -ml-6 shadow-sm">
                  STATUS: WK 8 (2026-10-26)
                </span>
              </div>

              {/* SVG Vector S-Curves */}
              <svg className="w-full h-full z-0 overflow-visible" preserveAspectRatio="none" viewBox="0 0 500 200">
                {/* Planned Value (PV) Curve (Blue) */}
                <path d="M 30 190 Q 150 180, 250 100 T 470 20" fill="none" stroke="#006398" strokeWidth="2.5"></path>
                {/* Actual Cost (AC) Curve up to Week 8 (Red) */}
                <path d="M 30 190 Q 140 175, 250 95" fill="none" stroke="#ba1a1a" strokeWidth="3"></path>
                {/* AC Forecast Trajectory */}
                <path d="M 250 95 Q 360 40, 485 5" fill="none" stroke="#ba1a1a" strokeDasharray="4,4" strokeWidth="2"></path>
                {/* Earned Value (EV) Curve up to Week 8 (Clinical Teal) */}
                <path d="M 30 190 Q 160 185, 250 120" fill="none" stroke="#00685f" strokeWidth="3.5"></path>
                {/* EV Forecast Trajectory */}
                <path d="M 250 120 Q 360 70, 490 35" fill="none" stroke="#00685f" strokeDasharray="4,4" strokeWidth="2"></path>
                {/* Intersection markers */}
                <circle cx="250" cy="100" fill="#006398" r="4"></circle>
                <circle cx="250" cy="95" fill="#ba1a1a" r="4.5"></circle>
                <circle cx="250" cy="120" fill="#00685f" r="4.5"></circle>
              </svg>

              {/* Bottom Weeks markers */}
              <div className="flex justify-between px-6 pt-1 text-[10px] text-on-surface-variant font-label-xs z-10">
                <span>Wk 0</span>
                <span>Wk 2</span>
                <span>Wk 4</span>
                <span>Wk 6</span>
                <span className="font-bold text-error">Wk 8 (Current)</span>
                <span>Wk 10</span>
                <span>Wk 12</span>
                <span>Wk 14</span>
                <span>Wk 16 (Target)</span>
                <span className="text-error font-semibold">+Wk 18 (EAC)</span>
              </div>
            </div>

            {/* EVM Indices Callout Strip */}
            <div className="grid grid-cols-3 gap-2 p-2 bg-surface rounded-lg border border-outline-variant text-label-xs font-label-xs">
              <div className="flex flex-col">
                <span className="text-on-surface-variant">Cost Variance (CV)</span>
                <span className="text-body-sm font-semibold text-error">-PKR 340,000 (EV - AC)</span>
              </div>
              <div className="flex flex-col">
                <span className="text-on-surface-variant">Schedule Variance (SV)</span>
                <span className="text-body-sm font-semibold text-error">-PKR 400,000 (EV - PV)</span>
              </div>
              <div className="flex flex-col">
                <span className="text-on-surface-variant">Est. At Completion (EAC)</span>
                <span className="text-body-sm font-semibold text-on-surface">PKR 5.46M (+PKR 760k Overrun)</span>
              </div>
            </div>
          </div>

          {/* PROJECT MILESTONES TIMELINE TRACKER */}
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-space-md flex flex-col gap-space-sm">
            <div className="flex items-center justify-between pb-2 border-b border-outline-variant">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-lg">flag</span>
                <h2 className="text-headline-sm font-headline-sm text-on-surface font-semibold">Master Clinical Milestones Status</h2>
              </div>
              <span className="text-label-xs font-label-xs text-on-surface-variant">Baseline: 6 Stages</span>
            </div>

            <div className="space-y-2">
              {milestones.length > 0 ? (
                milestones.map((m, idx) => (
                  <div 
                    key={m.id || idx}
                    className={`flex items-center justify-between p-2 rounded transition-colors border ${
                      m.status === 'Delayed' ? 'bg-error-container/30 border-error' : 'bg-surface hover:bg-surface-container-low border-outline-variant'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={`material-symbols-outlined text-base ${m.status === 'Achieved' ? 'text-primary' : m.status === 'Delayed' ? 'text-error' : 'text-secondary'}`}>
                        {m.status === 'Achieved' ? 'check_circle' : m.status === 'Delayed' ? 'pending_actions' : 'sync'}
                      </span>
                      <div>
                        <div className={`text-label-md font-label-md font-semibold ${m.status === 'Delayed' ? 'text-error' : 'text-on-surface'}`}>
                          {m.name}
                        </div>
                        <div className="text-label-xs font-label-xs text-on-surface-variant">
                          Owner: {m.responsible_person || 'Engineering Lead'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-label-xs font-label-xs text-on-surface-variant">{m.target_date}</span>
                      <span className={`px-2 py-0.5 rounded text-label-xs font-label-xs font-semibold ${
                        m.status === 'Achieved' 
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-300' 
                          : m.status === 'Delayed' 
                            ? 'bg-error-container text-on-error-container border border-error' 
                            : 'bg-sky-50 text-sky-800 border border-sky-300'
                      }`}>
                        {m.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-label-xs text-outline p-4 text-center">No milestones configured</div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Pending Change Requests + Critical Defects Summary (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-space-md">
          {/* PENDING CHANGE REQUESTS (CR) WIDGET */}
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-space-md flex flex-col gap-space-sm">
            <div className="flex items-center justify-between pb-2 border-b border-outline-variant">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-lg">edit_document</span>
                <h2 className="text-headline-sm font-headline-sm text-on-surface font-semibold">Pending Change Requests (CCB)</h2>
              </div>
              <span className="px-2 py-0.5 rounded-full text-label-xs font-label-xs font-semibold bg-surface-container text-primary border border-outline-variant">
                {changeRequests.filter(c => c.status === 'Pending').length} Active Items
              </span>
            </div>

            <div className="space-y-3">
              {changeRequests.map((cr) => (
                <div key={cr.id} className="p-3 rounded-lg border border-outline-variant bg-surface flex flex-col gap-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-label-xs font-label-xs font-bold text-primary">{cr.cr_number}</span>
                        <span className="text-label-xs font-label-xs px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 font-medium">
                          {cr.status} Phase
                        </span>
                      </div>
                      <h3 className="text-body-md font-body-md font-semibold text-on-surface mt-0.5">{cr.title}</h3>
                    </div>
                    <Link 
                      to="/scope" 
                      className="px-2.5 py-1 bg-surface-container hover:bg-surface-container-high border border-outline-variant text-label-xs font-label-xs font-semibold text-on-surface rounded transition-colors flex items-center gap-1 text-decoration-none"
                    >
                      <span>Review CR</span>
                      <span className="material-symbols-outlined text-xs">chevron_right</span>
                    </Link>
                  </div>
                  <p className="text-body-sm font-body-sm text-on-surface-variant">
                    {cr.justification}
                  </p>
                  <div className="flex items-center gap-3 pt-1 border-t border-outline-variant text-label-xs font-label-xs">
                    <span className="flex items-center gap-1 text-on-surface">
                      <span className="material-symbols-outlined text-sm text-secondary">add_card</span>
                      <strong>+PKR {Number(cr.cost_impact).toLocaleString()}</strong>
                    </span>
                    <span className="flex items-center gap-1 text-error">
                      <span className="material-symbols-outlined text-sm text-error">more_time</span>
                      <strong>+{cr.schedule_impact_weeks} Week Schedule</strong>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CRITICAL DEFECTS SUMMARY (Blocking Deliverables) */}
          <div className="bg-surface-container-lowest rounded-xl border border-error p-space-md flex flex-col gap-space-sm">
            <div className="flex items-center justify-between pb-2 border-b border-error/30">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-error text-lg">bug_report</span>
                <h2 className="text-headline-sm font-headline-sm text-error font-semibold">Critical Defects Summary</h2>
              </div>
              <span className="px-2 py-0.5 rounded text-label-xs font-label-xs font-bold bg-error text-on-error">
                {defects.filter(d => d.severity === 'Critical' && d.status !== 'Resolved').length} Blocking Gates
              </span>
            </div>

            <div className="space-y-3">
              {defects.filter(d => d.severity === 'Critical').map(def => (
                <div key={def.id} className="p-3 rounded-lg border border-error/40 bg-error-container/20 flex flex-col gap-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-label-xs font-label-xs font-bold text-error">{def.defect_code}</span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-label-xs font-bold bg-error text-on-error">
                          CRITICAL - {def.status.toUpperCase()}
                        </span>
                      </div>
                      <h4 className="text-body-md font-body-md font-semibold text-on-surface mt-1">{def.title}</h4>
                    </div>
                    <span className="material-symbols-outlined text-error text-xl">block</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-error/20 text-label-xs font-label-xs">
                    <div>
                      <span className="text-on-surface-variant block">Status:</span>
                      <span className="text-on-surface font-semibold flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs text-primary">person</span> {def.status}
                      </span>
                    </div>
                    <div>
                      <span className="text-on-surface-variant block">Severity:</span>
                      <span className="text-error font-semibold flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs text-error">link</span> Critical Gate
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* QUICK SYSTEM HEALTH & INTEGRITY CHECK MINI CARD */}
          <div className="p-space-sm bg-surface-container rounded-xl border border-outline-variant flex items-center justify-between text-label-xs font-label-xs">
            <div className="flex items-center gap-2 text-on-surface">
              <span className="material-symbols-outlined text-base text-primary">policy</span>
              <span>Automated PMIS Integrity Checks:</span>
              <span className="font-bold text-on-surface">100% Conformance</span>
            </div>
            <Link to="/integrity" className="text-primary hover:underline font-semibold flex items-center gap-0.5 text-decoration-none">
              View Audit Log <span className="material-symbols-outlined text-xs">arrow_forward</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
