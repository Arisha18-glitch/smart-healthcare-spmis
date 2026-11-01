import React, { useEffect, useState } from 'react';
import { 
  getSchedule, getMilestones, getRequirements, getTeam, 
  addActivity, updateActivityProgress, deleteActivity 
} from '../api';

export default function ScheduleGanttPage() {
  const [schedule, setSchedule] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [requirements, setRequirements] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Selected Activity for Slide-Out Drawer
  const [selectedActId, setSelectedActId] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [recalculating, setRecalculating] = useState(false);
  const [savingProgress, setSavingProgress] = useState(false);

  // Drawer Form State
  const [drawerForm, setDrawerForm] = useState({
    progress_percent: 65,
    delay_days: 6,
    actual_cost: 510000,
    duration_days: 18,
    predecessor_ids: []
  });

  // Modal to Add Activity
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAct, setNewAct] = useState({
    activity_code: '',
    name: '',
    assignee_id: 1,
    duration_days: 10,
    estimated_cost: 200000,
    requirement_id: 1,
    predecessor_ids: []
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [sData, mData, rData, tData] = await Promise.all([
        getSchedule(),
        getMilestones(),
        getRequirements(),
        getTeam()
      ]);
      setSchedule(sData);
      setMilestones(mData || []);
      setRequirements(rData || []);
      setTeamMembers(tData || []);

      if (sData?.activities?.length > 0) {
        // Default to ACT-05 (or first delayed activity, or first critical activity)
        const delayed = sData.activities.find(a => a.delay_days > 0);
        const defaultAct = delayed || sData.activities[0];
        if (!selectedActId || !sData.activities.some(a => a.id === selectedActId)) {
          setSelectedActId(defaultAct.id);
          setDrawerForm({
            progress_percent: defaultAct.progress_percent,
            delay_days: defaultAct.delay_days,
            actual_cost: defaultAct.actual_cost,
            duration_days: defaultAct.duration_days,
            predecessor_ids: defaultAct.predecessors?.map(p => p.predecessor_id) || []
          });
        }
      }

      if (rData?.length > 0 && !newAct.requirement_id) {
        setNewAct(prev => ({ ...prev, requirement_id: rData[0].id }));
      }
      if (tData?.length > 0 && !newAct.assignee_id) {
        setNewAct(prev => ({ ...prev, assignee_id: tData[0].id }));
      }
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

  // When selected activity changes, sync form
  const handleSelectActivity = (act) => {
    setSelectedActId(act.id);
    setDrawerOpen(true);
    setDrawerForm({
      progress_percent: act.progress_percent,
      delay_days: act.delay_days,
      actual_cost: act.actual_cost,
      duration_days: act.duration_days,
      predecessor_ids: act.predecessors?.map(p => p.predecessor_id) || []
    });
  };

  // Recalculate CPM
  const handleRecalculateCpm = async () => {
    setRecalculating(true);
    try {
      await loadData();
      setSuccess("CPM Schedule converged successfully! Critical path updated.");
    } catch (err) {
      setError(err.message);
    } finally {
      setTimeout(() => setRecalculating(false), 800);
    }
  };

  // Save Activity Progress
  const handleSaveProgress = async () => {
    if (!selectedAct) return;
    try {
      setSavingProgress(true);
      setError(null);
      await updateActivityProgress(selectedAct.id, {
        progress_percent: parseFloat(drawerForm.progress_percent),
        delay_days: parseInt(drawerForm.delay_days),
        actual_cost: parseFloat(drawerForm.actual_cost)
      });
      setSuccess(`Progress for ${selectedAct.activity_code} updated! Downstream cascade recalculated.`);
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingProgress(false);
    }
  };

  // Add Activity Submit
  const handleAddActivitySubmit = async (e) => {
    e.preventDefault();
    try {
      setSavingProgress(true);
      setError(null);
      await addActivity({
        ...newAct,
        assignee_id: Number(newAct.assignee_id),
        requirement_id: Number(newAct.requirement_id),
        duration_days: Number(newAct.duration_days),
        estimated_cost: Number(newAct.estimated_cost),
        predecessor_ids: newAct.predecessor_ids.map(Number)
      });
      setShowAddModal(false);
      setSuccess(`Activity ${newAct.activity_code} added successfully!`);
      setNewAct({
        activity_code: '',
        name: '',
        assignee_id: teamMembers[0]?.id || 1,
        duration_days: 10,
        estimated_cost: 200000,
        requirement_id: requirements[0]?.id || 1,
        predecessor_ids: []
      });
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingProgress(false);
    }
  };

  // Find currently selected activity object
  const activities = schedule?.activities || [];
  const selectedAct = activities.find(a => a.id === selectedActId) || activities[0] || null;

  // Week column definitions (W1 through W16)
  const weeks = [
    { label: 'W1', date: 'Aug 24', isConflict: false, isStatus: false, isDeadline: false },
    { label: 'W2', date: 'Aug 31', isConflict: false, isStatus: false, isDeadline: false },
    { label: 'W3', date: 'Sep 07', isConflict: false, isStatus: false, isDeadline: false },
    { label: 'W4', date: 'Sep 14', isConflict: false, isStatus: false, isDeadline: false },
    { label: 'W5', date: 'Sep 21', isConflict: false, isStatus: false, isDeadline: false },
    { label: 'W6 ⚠', date: 'Sep 28', isConflict: true, isStatus: false, isDeadline: false },
    { label: 'W7 ⚠', date: 'Oct 05', isConflict: true, isStatus: false, isDeadline: false },
    { label: 'W8', date: 'Oct 12', isConflict: false, isStatus: false, isDeadline: false },
    { label: 'W9', date: 'Oct 19', isConflict: false, isStatus: false, isDeadline: false },
    { label: 'W10 📍', date: 'Oct 26', isConflict: false, isStatus: true, isDeadline: false },
    { label: 'W11', date: 'Nov 02', isConflict: false, isStatus: false, isDeadline: false },
    { label: 'W12', date: 'Nov 09', isConflict: false, isStatus: false, isDeadline: false },
    { label: 'W13', date: 'Nov 16', isConflict: false, isStatus: false, isDeadline: false },
    { label: 'W14', date: 'Nov 23', isConflict: false, isStatus: false, isDeadline: false },
    { label: 'W15', date: 'Nov 30', isConflict: false, isStatus: false, isDeadline: false },
    { label: 'W16 🏁', date: 'Dec 27', isConflict: false, isStatus: false, isDeadline: true }
  ];

  // Helper to calculate pixel position on the Gantt timeline
  // Each week is 72px wide (7 days = 72px => 1 day ≈ 10.285px)
  const pxPerDay = 72 / 7;
  const colWidth = 72;

  return (
    <div className="h-full overflow-hidden flex flex-col bg-surface select-none">
      {/* 1. CONTROL HEADER */}
      <div className="bg-surface-container-lowest px-space-lg py-2 border-b border-outline-variant flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-4">
          <div>
            <span className="text-label-xs font-label-xs uppercase tracking-wider text-outline font-semibold">Gantt Controller</span>
            <h1 className="text-headline-md font-headline-md font-bold text-on-surface">Integrated Master Schedule (IMS)</h1>
          </div>
          <div className="h-6 w-[1px] bg-outline-variant"></div>
          {/* Date Markers Indicators */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-secondary-fixed/30 border border-secondary/30 px-2.5 py-1 rounded-lg">
              <span className="w-2.5 h-2.5 rounded-full bg-secondary"></span>
              <span className="text-label-xs font-label-xs text-on-surface-variant">Status Date:</span>
              <span className="text-label-sm font-label-sm font-semibold text-secondary">2026-10-26 (W10)</span>
            </div>
            <div className="flex items-center gap-1.5 bg-error-container/40 border border-error/30 px-2.5 py-1 rounded-lg">
              <span className="w-2.5 h-2.5 rounded-full bg-error"></span>
              <span className="text-label-xs font-label-xs text-on-surface-variant">Target Go-Live:</span>
              <span className="text-label-sm font-label-sm font-semibold text-error">2026-12-27 (W16)</span>
            </div>
            {/* Forward Pass calculation indicator */}
            <div className="flex items-center gap-1.5 px-2 py-1 bg-surface-container rounded-lg border border-outline-variant/60 text-label-xs font-label-xs text-on-surface">
              <span className="material-symbols-outlined text-primary text-[15px]">sync</span>
              <span>Forward Pass: <strong className="text-primary">Converged (CPM v4.2)</strong></span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border border-outline-variant p-0.5 bg-surface-container-low">
            <button className="px-2.5 py-1 text-label-xs font-label-xs font-semibold rounded bg-surface-container-lowest shadow-sm text-primary">Weeks</button>
            <button className="px-2.5 py-1 text-label-xs font-label-xs font-medium text-on-surface-variant hover:text-on-surface">Days</button>
            <button className="px-2.5 py-1 text-label-xs font-label-xs font-medium text-on-surface-variant hover:text-on-surface">Months</button>
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="h-8 px-3 bg-surface-container-low border border-outline-variant text-primary text-label-sm font-label-sm font-semibold rounded-lg hover:bg-surface-container transition-all flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[16px]">add_task</span>
            Add Activity
          </button>
          <button 
            onClick={handleRecalculateCpm}
            disabled={recalculating}
            className="h-8 px-3 bg-primary text-on-primary text-label-sm font-label-sm font-semibold rounded-lg hover:bg-primary-container transition-all flex items-center gap-1.5 shadow-sm active:scale-95 disabled:opacity-50"
          >
            <span className={`material-symbols-outlined text-[16px] ${recalculating ? 'animate-spin' : ''}`}>
              {recalculating ? 'progress_activity' : 'rebase_edit'}
            </span>
            {recalculating ? 'Running Forward Pass...' : 'Recalculate Critical Path'}
          </button>
        </div>
      </div>

      {/* Global Alerts */}
      {error && (
        <div className="mx-space-lg mt-2 p-2 bg-error-container border border-error text-on-error-container rounded-lg text-label-sm font-label-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-error text-[16px]">error</span>
            <span><strong>CPM Engine Alert:</strong> {error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-on-error-container font-bold text-xs">✕</button>
        </div>
      )}
      {success && (
        <div className="mx-space-lg mt-2 p-2 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-lg text-label-sm font-label-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-600 text-[16px]">check_circle</span>
            <span>{success}</span>
          </div>
          <button onClick={() => setSuccess(null)} className="text-emerald-900 font-bold text-xs">✕</button>
        </div>
      )}

      {/* 2. BANNERS STRIP (Critical Path Delay & Resource Conflict) */}
      <div className="px-space-lg py-2 flex flex-col gap-2 shrink-0 bg-surface">
        {/* Schedule Summary Banner */}
        <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-surface-container-lowest border-l-4 border-error border-y border-r border-outline-variant shadow-sm text-body-sm font-body-sm">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-error text-[18px]">error_outline</span>
            <span className="text-on-surface">
              <strong className="font-semibold text-error">Critical Path duration: {schedule?.project_duration_days || 112} days.</strong>
              {' '}1 Recorded delay <span className="bg-error-container text-on-error-container px-1.5 py-0.2 rounded font-label-sm font-semibold">(Backend API - 6 days)</span> pushing 3 dependent activities:
              <span className="font-medium text-on-surface"> Integration Testing (+6d)</span>, 
              <span className="font-medium text-on-surface"> User Acceptance (+6d)</span>, 
              <span className="font-medium text-on-surface"> Final Deployment (+6d)</span>.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-label-xs font-label-xs font-semibold uppercase px-2 py-0.5 rounded bg-error-container text-on-error-container">
              Variance: {schedule?.variance_days ? `+${schedule.variance_days}d` : '-6d'} Slip
            </span>
          </div>
        </div>

        {/* Resource Conflict Alert */}
        <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-[#FFFBEB] border-l-4 border-[#F59E0B] border-y border-r border-[#FDE68A] text-body-sm font-body-sm">
          <div className="flex items-center gap-2 text-[#92400E]">
            <span className="material-symbols-outlined text-[#D97706] text-[18px]">group_remove</span>
            <span>
              <strong>Conflict detected:</strong>
              <span className="font-semibold underline decoration-[#D97706]/40"> Dr. Tariq Shah (Backend Dev 1)</span> allocated to <em>DB Migration</em> and <em>API Endpoints</em> simultaneously during <strong>Week 6-7</strong>.
            </span>
          </div>
          <button 
            onClick={() => {
              setSuccess("Resource Leveling evaluated: Suggested staggering DB migration by 3 days or delegating to Eng. Tariq.");
            }}
            className="text-label-xs font-label-xs font-semibold bg-[#F59E0B] text-white px-2 py-0.5 rounded hover:bg-[#D97706] transition-colors"
          >
            Resolve Leveling
          </button>
        </div>
      </div>

      {/* 3. MAIN SPLIT GRID (Activities Table + Gantt Visualization + Parameters Drawer) */}
      <div className="flex-1 flex overflow-hidden border-t border-outline-variant bg-surface-container-lowest">
        
        {/* LEFT PANE: ACTIVITIES LIST TABLE */}
        <div className="w-[480px] shrink-0 border-r border-outline-variant flex flex-col bg-surface-container-lowest">
          {/* Table Header */}
          <div className="h-10 bg-surface-container-low border-b border-outline-variant flex items-center px-3 text-label-xs font-label-xs text-on-surface-variant uppercase tracking-wider font-semibold">
            <div className="w-16">WBS/ID</div>
            <div className="flex-1">Activity Name</div>
            <div className="w-24 text-right pr-2">Assignee</div>
            <div className="w-12 text-center">Dur.</div>
            <div className="w-14 text-center">Status</div>
          </div>

          {/* Table Rows */}
          <div className="flex-1 overflow-y-auto divide-y divide-outline-variant/40 custom-scrollbar">
            {activities.map((act) => {
              const isSelected = selectedAct?.id === act.id;
              const isCritical = act.is_critical;
              const isDelayed = act.delay_days > 0;
              const isDone = act.progress_percent >= 100;
              const isBlocked = act.delay_days === 0 && act.predecessors?.some(p => {
                const pred = activities.find(a => a.id === p.predecessor_id);
                return pred && pred.delay_days > 0 && pred.progress_percent < 100;
              });

              return (
                <div
                  key={act.id}
                  onClick={() => handleSelectActivity(act)}
                  className={`h-12 flex items-center px-3 cursor-pointer transition-colors text-body-sm font-body-sm ${
                    isSelected 
                      ? 'bg-primary/10 border-l-4 border-primary' 
                      : isDelayed 
                        ? 'bg-error-container/20 border-l-4 border-error hover:bg-error-container/30'
                        : isCritical
                          ? 'border-l-4 border-error/50 hover:bg-surface-container-low/50'
                          : 'hover:bg-surface-container-low/50'
                  }`}
                >
                  <div className={`w-16 font-label-xs font-mono font-bold ${isDelayed ? 'text-error' : 'text-on-surface-variant'}`}>
                    {act.activity_code}
                  </div>
                  <div className="flex-1 min-w-0 pr-2">
                    <div className="font-semibold text-on-surface truncate flex items-center gap-1">
                      {act.name}
                      {isDelayed && (
                        <span className="material-symbols-outlined text-[14px] text-error">report</span>
                      )}
                    </div>
                    <div className={`text-label-xs truncate ${isDelayed ? 'text-error font-medium' : isBlocked ? 'text-[#D97706]' : 'text-outline'}`}>
                      {isDelayed ? `Recorded Delay: +${act.delay_days} days (Critical)` : isBlocked ? 'Blocked by predecessor slip' : act.assignee_role || 'Assigned'}
                    </div>
                  </div>
                  <div className="w-24 text-right text-label-xs text-on-surface-variant truncate pr-2">
                    {act.assignee_name?.split(' ')[0] || 'Dev'}
                  </div>
                  <div className={`w-12 text-center font-label-xs font-mono ${isDelayed ? 'font-bold text-error' : ''}`}>
                    {act.duration_days}d
                  </div>
                  <div className="w-14 text-center">
                    {isDone ? (
                      <span className="text-[9px] font-label-xs uppercase px-1 py-0.5 rounded bg-[#ECFDF5] text-[#065F46] font-bold border border-[#A7F3D0]">Done</span>
                    ) : isDelayed ? (
                      <span className="text-[9px] font-label-xs uppercase px-1 py-0.5 rounded bg-[#FEF2F2] text-[#991B1B] font-bold border border-[#FECACA]">Delay</span>
                    ) : isBlocked ? (
                      <span className="text-[9px] font-label-xs uppercase px-1 py-0.5 rounded bg-[#FFFBEB] text-[#92400E] font-bold border border-[#FDE68A]">Block</span>
                    ) : isCritical ? (
                      <span className="text-[9px] font-label-xs uppercase px-1 py-0.5 rounded bg-[#FEF2F2] text-[#991B1B] font-bold border border-[#FECACA]">CPM</span>
                    ) : act.progress_percent > 0 ? (
                      <span className="text-[9px] font-label-xs uppercase px-1 py-0.5 rounded bg-[#F0F9FF] text-[#0369A1] font-bold border border-[#BAE6FD]">Active</span>
                    ) : (
                      <span className="text-[9px] font-label-xs uppercase px-1 py-0.5 rounded bg-surface-container text-tertiary font-bold border border-outline-variant/50">Plan</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT PANE: INTERACTIVE GANTT CHART VISUALIZATION */}
        <div className="flex-1 flex flex-col overflow-x-auto overflow-y-hidden custom-scrollbar bg-surface relative">
          {/* Timeline Header (Weeks 1 to 16 with calendar dates) */}
          <div className="h-10 bg-surface-container-low border-b border-outline-variant flex items-center sticky top-0 z-20 min-w-max">
            {weeks.map((wk, idx) => (
              <div 
                key={idx}
                className={`gantt-grid-col text-center border-r border-outline-variant/60 py-1 ${
                  wk.isConflict ? 'bg-amber-50/50' : wk.isStatus ? 'bg-blue-50/60' : wk.isDeadline ? 'bg-red-50/50' : ''
                }`}
                style={{ width: `${colWidth}px`, minWidth: `${colWidth}px` }}
              >
                <div className={`text-[10px] font-label-xs font-bold ${
                  wk.isConflict ? 'text-[#B45309]' : wk.isStatus ? 'text-secondary' : wk.isDeadline ? 'text-error' : 'text-on-surface'
                }`}>
                  {wk.label}
                </div>
                <div className={`text-[9px] font-mono ${
                  wk.isStatus ? 'text-secondary font-semibold' : wk.isDeadline ? 'text-error font-semibold' : 'text-outline'
                }`}>
                  {wk.date}
                </div>
              </div>
            ))}
          </div>

          {/* Gantt Canvas Container with Bars & Overlays */}
          <div className="flex-1 relative overflow-y-auto min-w-max custom-scrollbar">
            {/* Background Grid Columns */}
            <div className="absolute inset-0 flex pointer-events-none z-0">
              {weeks.map((wk, idx) => (
                <div 
                  key={idx}
                  className={`border-r border-outline-variant/30 h-full ${
                    wk.isConflict ? 'bg-[#FFFBEB]/40' : wk.isDeadline ? 'bg-red-50/20' : ''
                  }`}
                  style={{ width: `${colWidth}px`, minWidth: `${colWidth}px` }}
                />
              ))}
            </div>

            {/* Vertical STATUS DATE Line: 2026-10-26 (W10 left: 9 * 72px = 648px) */}
            <div className="absolute top-0 bottom-0 left-[648px] w-0.5 border-l-2 border-dotted border-secondary z-20 pointer-events-none">
              <div className="sticky top-1 -ml-16 bg-secondary text-white text-[9px] font-label-xs px-1.5 py-0.5 rounded shadow">
                Status: Oct 26
              </div>
            </div>

            {/* Vertical DEADLINE Line: 2026-12-27 (End of W16: 16 * 72px = 1152px) */}
            <div className="absolute top-0 bottom-0 left-[1152px] w-0.5 border-l-2 border-dashed border-error z-20 pointer-events-none">
              <div className="sticky top-1 -ml-14 bg-error text-white text-[9px] font-label-xs px-1.5 py-0.5 rounded shadow">
                Deadline: Dec 27
              </div>
            </div>

            {/* SVG Linkage Overlay for Dependency Connectors */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" style={{ minWidth: '1152px' }}>
              <defs>
                <marker id="arrow-cpm" markerHeight="6" markerWidth="6" orient="auto-start-reverse" refX="6" refY="5" viewBox="0 0 10 10">
                  <path d="M 0 1 L 8 5 L 0 9 z" fill="#EF4444" />
                </marker>
                <marker id="arrow-std" markerHeight="6" markerWidth="6" orient="auto-start-reverse" refX="6" refY="5" viewBox="0 0 10 10">
                  <path d="M 0 1 L 8 5 L 0 9 z" fill="#64748B" />
                </marker>
              </defs>
              {/* Dynamic dependency paths */}
              {activities.map((act, actIdx) => {
                if (!act.predecessors || act.predecessors.length === 0) return null;
                return act.predecessors.map((p, pIdx) => {
                  const predAct = activities.find(a => a.id === p.predecessor_id);
                  if (!predAct) return null;
                  const predIndex = activities.findIndex(a => a.id === predAct.id);
                  if (predIndex === -1) return null;

                  const startX = Math.max(12, (predAct.ef_days || (predAct.duration_days)) * pxPerDay);
                  const startY = predIndex * 48 + 24;
                  const endX = Math.max(startX + 10, (act.es_days || 0) * pxPerDay);
                  const endY = actIdx * 48 + 24;
                  const isCpm = act.is_critical && predAct.is_critical;

                  return (
                    <path
                      key={`${act.id}-${p.predecessor_id}-${pIdx}`}
                      d={`M ${startX} ${startY} H ${startX + 12} V ${endY} H ${endX}`}
                      fill="none"
                      stroke={isCpm ? '#EF4444' : '#64748B'}
                      strokeWidth={isCpm ? 2 : 1.5}
                      strokeDasharray={act.delay_days > 0 ? '3 3' : 'none'}
                      markerEnd={isCpm ? 'url(#arrow-cpm)' : 'url(#arrow-std)'}
                    />
                  );
                });
              })}
            </svg>

            {/* Gantt Row Bars matching 48px height of table rows */}
            <div className="flex flex-col z-10 relative">
              {activities.map((act) => {
                const isSelected = selectedAct?.id === act.id;
                const isDelayed = act.delay_days > 0;
                const isDone = act.progress_percent >= 100;
                const isCritical = act.is_critical;

                // Start position and width based on CPM days
                const startDay = act.es_days || 0;
                const plannedDuration = act.duration_days || 10;
                const effectiveDuration = (act.effective_duration || plannedDuration);

                const leftPx = Math.max(6, startDay * pxPerDay);
                const widthPx = Math.max(60, effectiveDuration * pxPerDay);
                const plannedWidthPx = Math.max(50, plannedDuration * pxPerDay);

                return (
                  <div 
                    key={act.id} 
                    className="h-12 flex items-center relative cursor-pointer"
                    onClick={() => handleSelectActivity(act)}
                  >
                    {/* Baseline ghost bar showing planned vs actual slip if delayed */}
                    {isDelayed && (
                      <div 
                        className="absolute h-6 bg-slate-200 border border-slate-300 rounded opacity-60 flex items-center pl-2 text-[10px] text-slate-500 font-mono"
                        style={{ left: `${leftPx}px`, width: `${plannedWidthPx}px` }}
                      >
                        Planned: {plannedDuration}d
                      </div>
                    )}

                    {/* Actual Bar */}
                    <div 
                      className={`absolute h-6 rounded text-white text-[11px] font-label-sm font-semibold flex items-center justify-between px-2.5 shadow-sm transition-all ${
                        isDone 
                          ? 'bg-[#10B981] border border-[#059669]' 
                          : isDelayed 
                            ? 'bg-gradient-to-r from-[#EF4444] via-[#DC2626] to-[#B91C1C] border-2 border-[#991B1B] shadow-md animate-pulse'
                            : isCritical
                              ? 'bg-[#EF4444] border-2 border-[#B91C1C]'
                              : act.progress_percent > 0 
                                ? 'bg-[#0284C7] border border-[#0369A1]'
                                : 'bg-slate-400 border border-slate-500'
                      } ${isSelected ? 'ring-2 ring-primary ring-offset-1' : ''}`}
                      style={{ left: `${leftPx}px`, width: `${widthPx}px` }}
                    >
                      <span className="truncate flex items-center gap-1">
                        {isDelayed && <span className="material-symbols-outlined text-[13px]">crisis_alert</span>}
                        {act.activity_code} {act.name} {isDelayed ? `(+${act.delay_days}d)` : ''}
                      </span>
                      <span className="text-[10px] bg-black/25 px-1 rounded font-mono ml-1">
                        {act.progress_percent}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Gantt Chart Footnote Legend */}
          <div className="h-8 bg-surface-container-lowest border-t border-outline-variant flex items-center px-space-lg gap-6 text-[11px] font-label-xs text-on-surface-variant shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-[#10B981]"></span>
              <span>Completed</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-[#0284C7]"></span>
              <span>In-Progress (Healthy)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-[#F59E0B]"></span>
              <span>At-Risk / Blocked</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-[#EF4444] border border-[#991B1B]"></span>
              <span className="font-semibold text-error">Critical Path (Delayed)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 border-t-2 border-dotted border-secondary"></span>
              <span>Status Date (Oct 26)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 border-t-2 border-dashed border-error"></span>
              <span>Contract Deadline (Dec 27)</span>
            </div>
          </div>
        </div>

        {/* 4. ACTIVITY DETAIL SLIDE-OUT PREVIEW PANE */}
        {drawerOpen && selectedAct && (
          <aside className="w-80 border-l border-outline-variant bg-surface-container-lowest flex flex-col shrink-0">
            {/* Drawer Header */}
            <div className="h-10 px-4 border-b border-outline-variant flex items-center justify-between bg-surface-container-low">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[18px]">edit_calendar</span>
                <span className="text-label-sm font-label-sm font-bold text-on-surface uppercase tracking-wider">Activity Parameters</span>
              </div>
              <button 
                onClick={() => setDrawerOpen(false)}
                className="text-on-surface-variant hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 text-body-sm">
              {/* Selected Activity Identity Badge */}
              <div className="p-3 bg-surface-container-low rounded-lg border border-outline-variant/60 flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className={`text-label-xs font-mono font-bold px-1.5 py-0.5 rounded ${
                    selectedAct.delay_days > 0 ? 'text-error bg-error-container' : 'text-primary bg-primary/10'
                  }`}>
                    {selectedAct.activity_code}
                  </span>
                  <span className={`text-label-xs font-semibold ${
                    selectedAct.delay_days > 0 ? 'text-error' : selectedAct.is_critical ? 'text-error' : 'text-primary'
                  }`}>
                    {selectedAct.delay_days > 0 ? 'Critical Path [delayed]' : selectedAct.is_critical ? 'Critical Path' : 'On Track'}
                  </span>
                </div>
                <h3 className="text-headline-sm font-headline-sm font-bold text-on-surface leading-snug">{selectedAct.name}</h3>
                <p className="text-label-xs text-outline">{selectedAct.req_title || 'Hospital clinical infrastructure milestone component.'}</p>
              </div>

              {/* Assignee & Role */}
              <div>
                <label className="block text-label-xs font-label-xs uppercase font-semibold text-on-surface-variant mb-1">Assigned Resource</label>
                <div className="flex items-center justify-between p-2 rounded-lg border border-outline-variant bg-surface-container-lowest">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-secondary text-white flex items-center justify-center text-[10px] font-bold">
                      {selectedAct.assignee_name ? selectedAct.assignee_name.substring(0, 2).toUpperCase() : 'B1'}
                    </div>
                    <div>
                      <div className="text-label-sm font-label-sm font-semibold text-on-surface">{selectedAct.assignee_name || 'Dr. Tariq Shah'}</div>
                      {selectedAct.assignee_name?.includes('Tariq') && (
                        <div className="text-[10px] text-error font-medium flex items-center gap-0.5">
                          <span className="material-symbols-outlined text-[12px]">warning</span> Overallocated (W6-7)
                        </div>
                      )}
                    </div>
                  </div>
                  <span className="text-[11px] text-outline">{selectedAct.assignee_role?.split(' ')[0]}</span>
                </div>
              </div>

              {/* Percent Complete Slider */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-label-xs font-label-xs uppercase font-semibold text-on-surface-variant">Percent Complete</label>
                  <span className="text-label-sm font-label-sm font-bold text-primary font-mono">{drawerForm.progress_percent}%</span>
                </div>
                <input 
                  type="range"
                  min="0"
                  max="100"
                  value={drawerForm.progress_percent}
                  onChange={(e) => setDrawerForm({ ...drawerForm, progress_percent: Number(e.target.value) })}
                  className="w-full h-1.5 bg-outline-variant/50 rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between text-[10px] font-mono text-outline mt-1">
                  <span>0%</span>
                  <span>Baseline: 85%</span>
                  <span>100%</span>
                </div>
              </div>

              {/* Form Fields Grid */}
              <div className="grid grid-cols-2 gap-3">
                {/* Duration */}
                <div>
                  <label className="block text-label-xs font-label-xs uppercase font-semibold text-on-surface-variant mb-1">Planned Days</label>
                  <input 
                    type="number"
                    value={drawerForm.duration_days}
                    readOnly
                    className="w-full h-8 px-2.5 text-label-sm font-mono border border-outline-variant rounded-lg bg-surface-container-low text-on-surface-variant"
                  />
                </div>
                {/* Delay Days Input */}
                <div>
                  <label className="block text-label-xs font-label-xs uppercase font-semibold text-error mb-1">Recorded Delay (Days)</label>
                  <div className="relative">
                    <input 
                      type="number"
                      min="0"
                      value={drawerForm.delay_days}
                      onChange={(e) => setDrawerForm({ ...drawerForm, delay_days: Number(e.target.value) })}
                      className="w-full h-8 pl-6 pr-2 text-label-sm font-mono font-bold text-error border border-error/50 rounded-lg bg-error-container/20 focus:border-error focus:outline-none"
                    />
                    <span className="absolute left-2.5 top-1.5 text-label-sm font-bold text-error">+</span>
                  </div>
                </div>
              </div>

              {/* Actual Cost Field */}
              <div>
                <label className="block text-label-xs font-label-xs uppercase font-semibold text-on-surface-variant mb-1">Actual Cost (ACWP)</label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-label-sm font-mono text-outline">PKR</span>
                  <input 
                    type="number"
                    value={drawerForm.actual_cost}
                    onChange={(e) => setDrawerForm({ ...drawerForm, actual_cost: Number(e.target.value) })}
                    className="w-full h-8 pl-12 pr-2.5 text-label-sm font-mono font-semibold text-on-surface border border-outline-variant rounded-lg bg-surface-container-lowest focus:border-primary focus:outline-none"
                  />
                </div>
                <div className="text-[10px] text-outline mt-1 flex justify-between">
                  <span>Est: PKR {(selectedAct.estimated_cost || 0).toLocaleString()}</span>
                  <span className={drawerForm.actual_cost > selectedAct.estimated_cost ? 'text-error font-medium' : 'text-emerald-700'}>
                    CV: PKR {((selectedAct.estimated_cost * (drawerForm.progress_percent / 100)) - drawerForm.actual_cost).toFixed(0)}
                  </span>
                </div>
              </div>

              {/* Predecessors Display */}
              <div>
                <label className="block text-label-xs font-label-xs uppercase font-semibold text-on-surface-variant mb-1">Predecessors (Finish-to-Start)</label>
                <div className="p-2 border border-outline-variant rounded-lg bg-surface-container-lowest text-label-xs font-label-xs">
                  {selectedAct.predecessors && selectedAct.predecessors.length > 0 ? (
                    selectedAct.predecessors.map((p, i) => (
                      <div key={i} className="text-on-surface font-medium flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px] text-primary">arrow_forward</span>
                        {p.predecessor_code}: {p.predecessor_name} [FS]
                      </div>
                    ))
                  ) : (
                    <span className="text-outline italic">None (Independent starting task)</span>
                  )}
                </div>
              </div>

              {/* Downstream Cascade Preview */}
              <div className="p-2.5 bg-surface rounded-lg border border-outline-variant/60 flex flex-col gap-1.5">
                <span className="text-label-xs font-label-xs uppercase font-semibold text-outline">
                  Downstream Cascade ({drawerForm.delay_days > 0 ? `+${drawerForm.delay_days}d` : 'None'})
                </span>
                {drawerForm.delay_days > 0 ? (
                  <>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-on-surface">ACT-06 Appointment Portal</span>
                      <span className="text-error font-mono font-semibold">+{drawerForm.delay_days}d slip</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-on-surface">ACT-13 Multi-Hospital Testing</span>
                      <span className="text-error font-mono font-semibold">+{drawerForm.delay_days}d slip</span>
                    </div>
                  </>
                ) : (
                  <span className="text-[11px] text-outline italic">No cascade delays recorded.</span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2 border-t border-outline-variant/60 mt-auto">
                <button 
                  onClick={() => {
                    setDrawerForm({
                      progress_percent: selectedAct.progress_percent,
                      delay_days: selectedAct.delay_days,
                      actual_cost: selectedAct.actual_cost,
                      duration_days: selectedAct.duration_days,
                      predecessor_ids: selectedAct.predecessors?.map(p => p.predecessor_id) || []
                    });
                  }}
                  className="flex-1 h-8 bg-surface-container-lowest border border-outline-variant rounded-lg text-label-sm font-label-sm font-medium hover:bg-surface-container-low transition-colors"
                >
                  Revert
                </button>
                <button 
                  onClick={handleSaveProgress}
                  disabled={savingProgress}
                  className="flex-1 h-8 bg-primary text-on-primary rounded-lg text-label-sm font-label-sm font-semibold hover:bg-primary-container transition-all flex items-center justify-center gap-1 shadow-sm disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[16px]">save</span>
                  {savingProgress ? 'Saving...' : 'Save Update'}
                </button>
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* MODAL: ADD ACTIVITY */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant mb-4">
              <h3 className="text-headline-sm font-bold text-on-surface">Add Activity (WBS Level 3 Work Package)</h3>
              <button onClick={() => setShowAddModal(false)} className="text-outline hover:text-on-surface">✕</button>
            </div>
            <form onSubmit={handleAddActivitySubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-label-xs font-semibold text-outline mb-1">Activity Code</label>
                  <input
                    type="text"
                    required
                    placeholder="ACT-14"
                    value={newAct.activity_code}
                    onChange={(e) => setNewAct({ ...newAct, activity_code: e.target.value })}
                    className="w-full h-8 px-2.5 text-label-sm border border-outline-variant rounded-lg bg-surface-container-lowest focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-label-xs font-semibold text-outline mb-1">Duration (Days)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={newAct.duration_days}
                    onChange={(e) => setNewAct({ ...newAct, duration_days: e.target.value })}
                    className="w-full h-8 px-2.5 text-label-sm border border-outline-variant rounded-lg bg-surface-container-lowest focus:border-primary focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-label-xs font-semibold text-outline mb-1">Activity Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. End-to-End Encryption Audit"
                  value={newAct.name}
                  onChange={(e) => setNewAct({ ...newAct, name: e.target.value })}
                  className="w-full h-8 px-2.5 text-label-sm border border-outline-variant rounded-lg bg-surface-container-lowest focus:border-primary focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-label-xs font-semibold text-outline mb-1">Assignee</label>
                  <select
                    value={newAct.assignee_id}
                    onChange={(e) => setNewAct({ ...newAct, assignee_id: e.target.value })}
                    className="w-full h-8 px-2 text-label-sm border border-outline-variant rounded-lg bg-surface-container-lowest focus:border-primary focus:outline-none"
                  >
                    {teamMembers.map(tm => (
                      <option key={tm.id} value={tm.id}>{tm.name} ({tm.role})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-label-xs font-semibold text-outline mb-1">Estimated Cost (PKR)</label>
                  <input
                    type="number"
                    required
                    value={newAct.estimated_cost}
                    onChange={(e) => setNewAct({ ...newAct, estimated_cost: e.target.value })}
                    className="w-full h-8 px-2.5 text-label-sm border border-outline-variant rounded-lg bg-surface-container-lowest focus:border-primary focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-label-xs font-semibold text-outline mb-1">Linked Scope Deliverable</label>
                <select
                  value={newAct.requirement_id}
                  onChange={(e) => setNewAct({ ...newAct, requirement_id: e.target.value })}
                  className="w-full h-8 px-2 text-label-sm border border-outline-variant rounded-lg bg-surface-container-lowest focus:border-primary focus:outline-none"
                >
                  {requirements.filter(r => r.status === 'Approved').map(r => (
                    <option key={r.id} value={r.id}>{r.req_code}: {r.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-label-xs font-semibold text-outline mb-1">Predecessor Activities</label>
                <select
                  multiple
                  value={newAct.predecessor_ids.map(String)}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions, option => option.value);
                    setNewAct({ ...newAct, predecessor_ids: selected });
                  }}
                  className="w-full h-20 p-2 text-label-xs border border-outline-variant rounded-lg bg-surface-container-lowest focus:border-primary focus:outline-none"
                >
                  {activities.map(a => (
                    <option key={a.id} value={a.id}>{a.activity_code}: {a.name}</option>
                  ))}
                </select>
                <span className="text-[10px] text-outline">Hold Ctrl (Windows) to select multiple predecessors</span>
              </div>
              <div className="pt-3 border-t border-outline-variant flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-1.5 border border-outline-variant rounded-lg text-label-sm font-medium hover:bg-surface-container"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProgress}
                  className="px-4 py-1.5 bg-primary text-on-primary rounded-lg text-label-sm font-semibold hover:bg-primary-container"
                >
                  {savingProgress ? 'Saving...' : 'Add Activity'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
