import React, { useEffect, useState } from 'react';
import { 
  getRequirements, addRequirement, updateRequirement, 
  getWbs, getChangeRequests, createChangeRequest, 
  approveChangeRequest, rejectChangeRequest, getCharter
} from '../api';

export default function ScopeWbsPage() {
  const [requirements, setRequirements] = useState([]);
  const [wbsData, setWbsData] = useState(null);
  const [changeRequests, setChangeRequests] = useState([]);
  const [charter, setCharter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All'); // 'All', 'Approved', 'Proposed', 'Rejected'
  const [priorityFilter, setPriorityFilter] = useState('All'); // 'All', 'High', 'Medium', 'Low'
  const [expandedRows, setExpandedRows] = useState({ 1: true, 2: true, 7: true });

  // Selected CR for the Right Simulator Panel
  const [selectedCrId, setSelectedCrId] = useState(1);
  const [decisionNote, setDecisionNote] = useState('');
  const [processingAction, setProcessingAction] = useState(false);

  // Modals
  const [showAddCrModal, setShowAddCrModal] = useState(false);
  const [newCr, setNewCr] = useState({
    cr_number: '',
    title: '',
    justification: '',
    linked_requirement_id: '',
    cost_impact: 450000,
    schedule_impact_weeks: 2
  });

  const [showAddReqModal, setShowAddReqModal] = useState(false);
  const [newReq, setNewReq] = useState({
    req_code: '',
    title: '',
    description: '',
    priority: 'Medium',
    status: 'Proposed',
    category: 'Core Clinical'
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [rData, wData, crData, chData] = await Promise.all([
        getRequirements(),
        getWbs(),
        getChangeRequests(),
        getCharter()
      ]);
      setRequirements(rData || []);
      setWbsData(wData || null);
      setChangeRequests(crData || []);
      setCharter(chData || null);

      if (crData && crData.length > 0) {
        // Find first pending CR or keep selected
        const pending = crData.find(c => c.status === 'Pending');
        if (pending && (!selectedCrId || !crData.some(c => c.id === selectedCrId))) {
          setSelectedCrId(pending.id);
        } else if (!selectedCrId) {
          setSelectedCrId(crData[0].id);
        }
      }

      if (rData && rData.length > 0 && !newCr.linked_requirement_id) {
        setNewCr(prev => ({ ...prev, linked_requirement_id: rData[0].id }));
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

  // Deliverables mapping with Health & Work Packages info
  const deliverablesMeta = {
    1: { code: '1.1', title: 'Appointment Scheduling', packages: '2 Packages', cost: 'PKR 950,000', health: 'Delayed', healthType: 'amber', pkgsList: [{ code: '1.1.1', name: 'Multi-Hospital Scheduling Engine', hours: '120h' }, { code: '1.1.2', name: 'Patient Appointment Portal UI', hours: '90h' }] },
    2: { code: '1.2', title: 'Patient Records System (EMR)', packages: '3 Packages', cost: 'PKR 1,100,000', health: 'Critical Defect', healthType: 'red', pkgsList: [{ code: '1.2.1', name: 'EMR Core Patient Records API', hours: '140h' }, { code: '1.2.2', name: 'EMR Patient Dashboard & History UI', hours: '100h' }, { code: '1.2.3', name: 'FHIR Encryption Security Layer', hours: '80h' }] },
    3: { code: '1.3', title: 'Lab Reports Integration', packages: '2 Packages', cost: 'PKR 800,000', health: 'On Track', healthType: 'emerald', pkgsList: [{ code: '1.3.1', name: 'Lab Reports Model & Upload API', hours: '110h' }, { code: '1.3.2', name: 'Diagnostic PDF Generator & Viewer', hours: '85h' }] },
    4: { code: '1.4', title: 'Doctor Rostering & Schedules', packages: '2 Packages', cost: 'PKR 650,000', health: 'On Track', healthType: 'emerald', pkgsList: [{ code: '1.4.1', name: 'Doctor Rota & Shift Management API', hours: '100h' }, { code: '1.4.2', name: 'On-Call Emergency Allocation Grid', hours: '75h' }] },
    5: { code: '1.5', title: 'Online Consultation Web Portal', packages: '2 Packages', cost: 'PKR 700,000', health: 'On Track', healthType: 'emerald', pkgsList: [{ code: '1.5.1', name: 'Telehealth WebRTC Video Gateway', hours: '130h' }, { code: '1.5.2', name: 'Virtual Consultation Consultation UI', hours: '95h' }] },
    6: { code: '1.6', title: 'Centralized Billing & Claims', packages: '2 Packages', cost: 'PKR 500,000', health: 'On Track', healthType: 'emerald', pkgsList: [{ code: '1.6.1', name: 'Billing Engine & Ledger Invoicing', hours: '110h' }, { code: '1.6.2', name: 'Payment Receipt Reconciliation UI', hours: '70h' }] },
    7: { code: '1.7', title: 'AI Diagnosis Assistance Module', packages: '2 Pending Pkgs', cost: 'PKR 450,000', health: 'CR Pending', healthType: 'purple', linkedCr: 'CR-01', pkgsList: [{ code: '1.7.1', name: 'AI Backend & Triage API Integration', hours: '80h' }, { code: '1.7.2', name: 'Model Validation & Clinical Ethics Audit', hours: '60h' }] },
    8: { code: '1.8', title: 'Patient & Doctor Mobile App', packages: '2 Pending Pkgs', cost: 'PKR 350,000', health: 'CR Queue', healthType: 'blue', linkedCr: 'CR-02', pkgsList: [{ code: '1.8.1', name: 'Cross-Platform React Native App Shell', hours: '85h' }, { code: '1.8.2', name: 'Push Notification & Lab Alerts Bridge', hours: '55h' }] },
  };

  const toggleRow = (id) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleAllRows = () => {
    const allExpanded = Object.keys(expandedRows).length >= requirements.length;
    if (allExpanded) {
      setExpandedRows({});
    } else {
      const all = {};
      requirements.forEach(r => { all[r.id] = true; });
      setExpandedRows(all);
    }
  };

  // Filter requirements
  const filteredRequirements = requirements.filter(req => {
    const meta = deliverablesMeta[req.id] || { code: `1.${req.id}`, title: req.title };
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      meta.code.toLowerCase().includes(query) ||
      req.title.toLowerCase().includes(query) ||
      (req.description && req.description.toLowerCase().includes(query)) ||
      (req.category && req.category.toLowerCase().includes(query));
    
    const matchesStatus = statusFilter === 'All' || req.status === statusFilter;
    const matchesPriority = priorityFilter === 'All' || req.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Calculate totals
  const approvedReqs = requirements.filter(r => r.status === 'Approved');
  const proposedReqs = requirements.filter(r => r.status === 'Proposed');
  const rejectedReqs = requirements.filter(r => r.status === 'Rejected');

  // Currently focused Change Request
  const activeCr = changeRequests.find(c => c.id === selectedCrId) || changeRequests[0] || null;

  // Impact calculations
  const baselineCeiling = charter?.approved_budget || 5000000;
  const currentAllocated = 4700000;
  const reserveCap = Math.max(0, baselineCeiling - currentAllocated);
  const crCost = activeCr ? activeCr.cost_impact : 0;
  const postCommitBudget = baselineCeiling + (activeCr && activeCr.status === 'Pending' ? crCost : 0);
  const exceedsCap = postCommitBudget > baselineCeiling;
  const scheduleShiftWeeks = activeCr ? activeCr.schedule_impact_weeks : 0;

  // Handle Approve CR
  const handleApproveCr = async () => {
    if (!activeCr) return;
    try {
      setProcessingAction(true);
      setError(null);
      const res = await approveChangeRequest(activeCr.id, decisionNote || "Approved by Project Board (CCB)");
      setSuccess(`CR ${activeCr.cr_number} Approved! Scope and budget updated atomically.`);
      setDecisionNote('');
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessingAction(false);
    }
  };

  // Handle Reject CR
  const handleRejectCr = async () => {
    if (!activeCr) return;
    try {
      setProcessingAction(true);
      setError(null);
      await rejectChangeRequest(activeCr.id, decisionNote || "Rejected due to budget ceiling constraint.");
      setSuccess(`CR ${activeCr.cr_number} rejected.`);
      setDecisionNote('');
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessingAction(false);
    }
  };

  // Handle Create CR Modal
  const handleCreateCrSubmit = async (e) => {
    e.preventDefault();
    try {
      setProcessingAction(true);
      setError(null);
      await createChangeRequest({
        ...newCr,
        linked_requirement_id: Number(newCr.linked_requirement_id),
        cost_impact: parseFloat(newCr.cost_impact),
        schedule_impact_weeks: parseInt(newCr.schedule_impact_weeks)
      });
      setShowAddCrModal(false);
      setSuccess(`Change Request ${newCr.cr_number} submitted to CCB queue.`);
      setNewCr({ cr_number: '', title: '', justification: '', linked_requirement_id: requirements[0]?.id || 1, cost_impact: 450000, schedule_impact_weeks: 2 });
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessingAction(false);
    }
  };

  // Handle Add Requirement Modal
  const handleAddReqSubmit = async (e) => {
    e.preventDefault();
    try {
      setProcessingAction(true);
      setError(null);
      await addRequirement(newReq);
      setShowAddReqModal(false);
      setSuccess(`Deliverable ${newReq.req_code} added.`);
      setNewReq({ req_code: '', title: '', description: '', priority: 'Medium', status: 'Proposed', category: 'Core Clinical' });
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessingAction(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-background h-full overflow-y-auto">
      {/* Sticky Page Header & Scope Locking Notification */}
      <div className="px-space-xl pt-space-lg pb-space-sm border-b border-outline-variant bg-surface-container-lowest sticky top-0 z-20">
        {/* Breadcrumbs & Status Banner */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-label-xs font-label-xs text-outline">
            <span className="hover:text-primary cursor-pointer">HealthOps PMIS</span>
            <span className="material-symbols-outlined text-[12px]">chevron_right</span>
            <span className="hover:text-primary cursor-pointer">WBS Execution</span>
            <span className="material-symbols-outlined text-[12px]">chevron_right</span>
            <span className="text-primary font-semibold">Scope &amp; Hierarchical WBS</span>
          </div>

          {/* Rule notice from case study prompt */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-surface-container border border-outline-variant text-label-xs font-label-xs text-primary font-medium">
            <span className="material-symbols-outlined text-[14px]">lock</span>
            <span>Scope Locking active. Changes out of Planning phase require atomic Change Request approval.</span>
          </div>
        </div>

        {/* Global Alert Notification */}
        {error && (
          <div className="mb-2 p-2 bg-error-container border border-error text-on-error-container rounded-lg text-label-sm font-label-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-error text-[16px]">error</span>
              <span><strong>Constraint Violation:</strong> {error}</span>
            </div>
            <button onClick={() => setError(null)} className="text-on-error-container font-bold text-xs">✕</button>
          </div>
        )}
        {success && (
          <div className="mb-2 p-2 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-lg text-label-sm font-label-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-600 text-[16px]">check_circle</span>
              <span>{success}</span>
            </div>
            <button onClick={() => setSuccess(null)} className="text-emerald-900 font-bold text-xs">✕</button>
          </div>
        )}

        {/* Title, Key Statistics & Top Summary Cards */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-2">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-headline-lg font-headline-lg text-on-surface tracking-tight font-bold">Scope &amp; Hierarchical WBS Explorer</h1>
              <span className="px-2 py-0.5 rounded text-label-xs font-label-xs uppercase font-semibold bg-primary-fixed text-on-primary-fixed-variant border border-primary-fixed-dim">
                Phase 2: Execution
              </span>
            </div>
            <p className="text-body-md font-body-md text-on-surface-variant mt-1">
              Project: <span className="font-semibold text-on-surface">Smart Healthcare Network</span> • Baseline Ceiling: <span className="font-semibold font-label-md text-on-surface">PKR 5,000,000 cap</span>
            </p>
          </div>

          {/* Quick EVM Scope Health Strip */}
          <div className="flex items-center gap-3">
            <div className="bg-surface-container-low border border-outline-variant rounded-lg px-3 py-1.5 flex items-center gap-2.5">
              <div>
                <span className="text-label-xs font-label-xs text-outline block">ALLOCATED COST</span>
                <span className="text-label-md font-label-md font-semibold text-on-surface">PKR 4,700,000</span>
              </div>
              <div className="h-6 w-px bg-outline-variant"></div>
              <div>
                <span className="text-label-xs font-label-xs text-outline block">RESERVE CAP</span>
                <span className="text-label-md font-label-md font-semibold text-primary">PKR 300,000</span>
              </div>
            </div>

            <div className="bg-surface-container-low border border-outline-variant rounded-lg px-3 py-1.5 flex items-center gap-2.5">
              <div>
                <span className="text-label-xs font-label-xs text-outline block">PENDING CRs</span>
                <span className="text-label-md font-label-md font-semibold text-error">
                  {changeRequests.filter(c => c.status === 'Pending').length} Proposals (+PKR 800k)
                </span>
              </div>
              <span className="material-symbols-outlined text-[18px] text-error">notification_important</span>
            </div>
          </div>
        </div>

        {/* Filter & Control Bar */}
        <div className="pt-3 border-t border-outline-variant flex flex-wrap items-center justify-between gap-3">
          {/* Requirement Search & Filters */}
          <div className="flex items-center gap-2.5 flex-1 max-w-2xl">
            {/* Search requirements */}
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-2.5 top-2 text-outline text-[16px]">filter_alt</span>
              <input 
                id="wbsSearch"
                type="text"
                placeholder="Filter deliverables, WBS codes (e.g. 1.2)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-8 pl-8 pr-3 text-label-sm font-label-sm bg-surface-container-lowest border border-outline-variant rounded-lg text-on-surface placeholder:text-outline focus:outline-none focus:border-primary"
              />
            </div>

            {/* Filter by Status */}
            <div className="flex items-center border border-outline-variant rounded-lg bg-surface-container-low p-0.5 text-label-xs font-label-xs">
              <button 
                onClick={() => setStatusFilter('All')}
                className={`px-2.5 py-1 rounded-lg transition-colors ${statusFilter === 'All' ? 'bg-surface-container-lowest text-primary font-semibold shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}
              >
                All ({requirements.length})
              </button>
              <button 
                onClick={() => setStatusFilter('Approved')}
                className={`px-2.5 py-1 rounded-lg transition-colors ${statusFilter === 'Approved' ? 'bg-surface-container-lowest text-primary font-semibold shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}
              >
                Approved ({approvedReqs.length})
              </button>
              <button 
                onClick={() => setStatusFilter('Proposed')}
                className={`px-2.5 py-1 rounded-lg transition-colors ${statusFilter === 'Proposed' ? 'bg-surface-container-lowest text-primary font-semibold shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}
              >
                Proposed ({proposedReqs.length})
              </button>
              {rejectedReqs.length > 0 && (
                <button 
                  onClick={() => setStatusFilter('Rejected')}
                  className={`px-2.5 py-1 rounded-lg transition-colors ${statusFilter === 'Rejected' ? 'bg-surface-container-lowest text-primary font-semibold shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}
                >
                  Rejected ({rejectedReqs.length})
                </button>
              )}
            </div>

            {/* Filter by Priority */}
            <div className="flex items-center gap-1.5">
              <span className="text-label-xs font-label-xs text-outline uppercase tracking-wider">Priority:</span>
              <select 
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="h-8 text-label-xs font-label-xs bg-surface-container-lowest border border-outline-variant rounded-lg px-2 text-on-surface focus:outline-none focus:border-primary"
              >
                <option value="All">All Priorities</option>
                <option value="High">High Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="Low">Low Priority</option>
              </select>
            </div>
          </div>

          {/* Secondary Auxiliary Controls */}
          <div className="flex items-center gap-2">
            <button 
              onClick={toggleAllRows}
              className="h-8 px-2.5 border border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:text-on-surface text-label-xs font-label-xs rounded-lg flex items-center gap-1 transition-colors"
            >
              <span className="material-symbols-outlined text-[15px]">unfold_more</span>
              Expand / Collapse
            </button>
            <button 
              onClick={() => setShowAddCrModal(true)}
              className="h-8 px-2.5 bg-surface-container-low hover:bg-surface-container border border-outline-variant text-primary text-label-xs font-label-xs font-semibold rounded-lg flex items-center gap-1 transition-colors"
            >
              <span className="material-symbols-outlined text-[15px]">post_add</span>
              New Change Request
            </button>
            <button 
              onClick={() => setShowAddReqModal(true)}
              className="h-8 px-2.5 bg-primary hover:bg-primary-container text-on-primary text-label-xs font-label-xs font-semibold rounded-lg flex items-center gap-1 transition-colors"
            >
              <span className="material-symbols-outlined text-[15px]">add</span>
              Add Scope Item
            </button>
          </div>
        </div>
      </div>

      {/* MAIN SPLIT WORKSPACE: Hierarchical Table (Left 7/12) + Impact Management Card (Right 5/12) */}
      <div className="p-space-xl flex-1 flex flex-col xl:flex-row gap-space-lg items-start">
        
        {/* REQUIREMENTS & SCOPE BREAKDOWN TABLE CONTAINER */}
        <div className="w-full xl:w-7/12 flex flex-col bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-none">
          {/* Table Header Controls */}
          <div className="px-space-md py-space-sm bg-surface-container-low border-b border-outline-variant flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-primary">account_tree</span>
              <span className="text-label-md font-label-md font-semibold text-on-surface">Work Breakdown Structure (WBS Level 1 - 2)</span>
            </div>
            <span className="text-label-xs font-label-xs text-outline">Smart Healthcare Network • Cap PKR 5.0M</span>
          </div>

          {/* High-Density WBS Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-high/40 border-b border-outline-variant text-label-xs font-label-xs uppercase tracking-wider text-on-surface-variant select-none">
                  <th className="py-2.5 px-3 font-semibold w-16">WBS Code</th>
                  <th className="py-2.5 px-3 font-semibold">Deliverable / Work Package</th>
                  <th className="py-2.5 px-2.5 font-semibold text-center w-20">Status</th>
                  <th className="py-2.5 px-2.5 font-semibold text-center w-16">Priority</th>
                  <th className="py-2.5 px-3 font-semibold text-right w-24">Work Pkgs</th>
                  <th className="py-2.5 px-3 font-semibold text-right w-28">Est. Cost</th>
                  <th className="py-2.5 px-3 font-semibold text-center w-28">Health</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/60 font-body-sm text-body-sm">
                {filteredRequirements.map((req) => {
                  const meta = deliverablesMeta[req.id] || {
                    code: `1.${req.id}`,
                    title: req.title,
                    packages: '2 Packages',
                    cost: 'PKR 400k',
                    health: req.status === 'Approved' ? 'On Track' : 'Proposed',
                    healthType: req.status === 'Approved' ? 'emerald' : 'purple',
                    pkgsList: []
                  };

                  const isExpanded = !!expandedRows[req.id];
                  const isProposed = req.status === 'Proposed';
                  const isCr01 = req.id === 7 || meta.linkedCr === 'CR-01';
                  const isCr02 = req.id === 8 || meta.linkedCr === 'CR-02';

                  return (
                    <React.Fragment key={req.id}>
                      <tr 
                        onClick={() => {
                          if (isCr01) {
                            const cr = changeRequests.find(c => c.cr_number === 'CR-01');
                            if (cr) setSelectedCrId(cr.id);
                          } else if (isCr02) {
                            const cr = changeRequests.find(c => c.cr_number === 'CR-02');
                            if (cr) setSelectedCrId(cr.id);
                          }
                          toggleRow(req.id);
                        }}
                        className={`transition-colors cursor-pointer group ${
                          isCr01 
                            ? 'bg-primary/5 hover:bg-primary/10 border-l-4 border-l-primary' 
                            : isCr02 
                              ? 'bg-surface-container-low/40 hover:bg-surface-container-low border-l-4 border-l-secondary-container'
                              : meta.healthType === 'red'
                                ? 'bg-error-container/10 hover:bg-error-container/20'
                                : 'hover:bg-surface-container-low/60'
                        }`}
                      >
                        <td className={`py-2 px-3 font-label-xs font-label-xs font-semibold ${isProposed ? 'text-primary' : 'text-outline'}`}>
                          {meta.code}
                        </td>
                        <td className="py-2 px-3">
                          <div className="flex flex-col">
                            <div className={`flex items-center gap-1.5 font-semibold ${isProposed ? 'text-primary' : 'text-on-surface'}`}>
                              <span className="material-symbols-outlined text-[14px] text-outline transition-transform duration-150" style={{ transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)' }}>
                                arrow_drop_down
                              </span>
                              {meta.title}
                            </div>
                            {isProposed && (
                              <span className="text-label-xs font-label-xs text-outline pl-5">
                                Awaiting {meta.linkedCr || 'Change Request'} • {req.id === 7 ? '+2 weeks' : '+1 week'} schedule delta
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-2 px-2.5 text-center">
                          <span className={`inline-block px-1.5 py-0.5 rounded text-label-xs font-label-xs uppercase font-medium ${
                            req.status === 'Approved'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : req.status === 'Proposed'
                                ? 'bg-primary-fixed/60 text-on-primary-fixed-variant border border-primary-fixed-dim font-semibold'
                                : 'bg-surface-container text-on-surface-variant border border-outline-variant'
                          }`}>
                            {req.status}
                          </span>
                        </td>
                        <td className="py-2 px-2.5 text-center">
                          <span className={`text-label-xs font-label-xs font-semibold ${
                            req.priority === 'High' ? 'text-error' : req.priority === 'Medium' ? 'text-secondary' : 'text-outline'
                          }`}>
                            {req.priority}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right font-label-sm font-label-sm text-on-surface-variant">
                          <span className={isProposed ? 'text-outline italic' : ''}>{meta.packages}</span>
                        </td>
                        <td className={`py-2 px-3 text-right font-label-sm font-label-sm font-medium ${isProposed ? 'text-primary font-semibold' : 'text-on-surface'}`}>
                          {meta.cost}
                        </td>
                        <td className="py-2 px-3 text-center">
                          {meta.healthType === 'red' && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-label-xs font-label-xs font-semibold bg-red-50 text-red-900 border border-red-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
                              Critical Defect
                            </span>
                          )}
                          {meta.healthType === 'amber' && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-label-xs font-label-xs font-semibold bg-amber-50 text-amber-900 border border-amber-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                              Delayed
                            </span>
                          )}
                          {meta.healthType === 'emerald' && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-label-xs font-label-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                              On Track
                            </span>
                          )}
                          {meta.healthType === 'purple' && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-label-xs font-label-xs font-semibold bg-surface-container text-on-surface-variant border border-outline-variant">
                              <span className="material-symbols-outlined text-[12px] text-primary">pending_actions</span>
                              CR Pending
                            </span>
                          )}
                          {meta.healthType === 'blue' && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-label-xs font-label-xs font-semibold bg-surface-container text-on-surface-variant border border-outline-variant">
                              <span className="material-symbols-outlined text-[12px] text-secondary">hourglass_top</span>
                              CR Queue
                            </span>
                          )}
                        </td>
                      </tr>

                      {/* Expandable Level 3 Work Packages */}
                      {isExpanded && meta.pkgsList && meta.pkgsList.length > 0 && (
                        <tr className="bg-surface-container-low/30">
                          <td colSpan={7} className="py-2 px-4 pl-12 border-b border-outline-variant/40">
                            <div className="space-y-1.5 py-1">
                              <span className="text-[10px] font-label-xs uppercase tracking-wider text-outline font-semibold block">
                                Sub-Packages (Level 3 WBS)
                              </span>
                              {meta.pkgsList.map((pkg, idx) => (
                                <div key={idx} className="flex items-center justify-between py-1 px-2.5 rounded bg-surface-container-lowest border border-outline-variant/50 text-label-xs font-label-xs">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono font-bold text-outline">{pkg.code}</span>
                                    <span className="font-medium text-on-surface">{pkg.name}</span>
                                  </div>
                                  <span className="text-on-surface-variant font-mono">{pkg.hours}</span>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table Summary Footer / Rollup Footnote */}
          <div className="px-space-md py-space-sm bg-surface-container-low border-t border-outline-variant flex flex-wrap items-center justify-between text-label-xs font-label-xs gap-2">
            <span className="text-outline">
              Displaying {requirements.length} WBS deliverables ({approvedReqs.length} Baseline Approved, {proposedReqs.length} Uncommitted Proposals)
            </span>
            <div className="flex items-center gap-4">
              <span className="text-on-surface-variant">Approved Total: <strong className="text-on-surface">PKR 4,700,000</strong></span>
              <span className="text-primary font-semibold">Simulated Delta: <strong>+PKR 800,000</strong></span>
            </div>
          </div>
        </div>

        {/* CHANGE REQUEST IMPACT MANAGEMENT CARD (SIDE-BY-SIDE INSPECTOR) */}
        <div className="w-full xl:w-5/12 flex flex-col bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-none sticky top-20">
          {/* Card Header & Badge */}
          <div className="px-space-lg py-space-md bg-surface-container-low border-b border-outline-variant flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[16px]">swap_horiz</span>
              </span>
              <div>
                <h3 className="text-headline-sm font-headline-sm text-on-surface leading-tight font-bold">Change Request Impact Simulator</h3>
                <span className="text-label-xs font-label-xs text-outline">Atomic Transaction Verification Stage</span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded text-label-xs font-label-xs font-bold uppercase bg-primary text-on-primary">
              Active Focus
            </span>
          </div>

          {activeCr ? (
            <div className="p-space-lg flex flex-col gap-space-lg">
              {/* CR Selection Tabs if multiple change requests */}
              {changeRequests.length > 1 && (
                <div className="flex items-center gap-1.5 p-1 bg-surface-container-low rounded-lg border border-outline-variant">
                  {changeRequests.map((cr) => (
                    <button
                      key={cr.id}
                      onClick={() => setSelectedCrId(cr.id)}
                      className={`flex-1 py-1 px-2 text-label-xs font-label-xs font-semibold rounded transition-colors ${
                        selectedCrId === cr.id 
                          ? 'bg-surface-container-lowest text-primary shadow-sm border border-outline-variant' 
                          : 'text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      {cr.cr_number}: {cr.title.length > 20 ? cr.title.substring(0, 18) + '...' : cr.title}
                      {cr.status !== 'Pending' && ` (${cr.status})`}
                    </button>
                  ))}
                </div>
              )}

              {/* CR Identification Banner */}
              <div className="p-space-md rounded-lg bg-surface border border-outline-variant flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-label-sm font-label-sm font-bold text-primary">{activeCr.cr_number}</span>
                    <span className="text-label-xs font-label-xs px-1.5 py-0.2 bg-surface-container text-on-surface rounded font-medium">
                      Scope Extension
                    </span>
                    <span className={`text-[10px] font-label-xs font-bold uppercase px-1.5 py-0.5 rounded ${
                      activeCr.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' : activeCr.status === 'Rejected' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-900'
                    }`}>
                      {activeCr.status}
                    </span>
                  </div>
                  <h4 className="text-headline-sm font-headline-sm text-on-surface font-semibold mt-1">{activeCr.title}</h4>
                  <p className="text-body-sm font-body-sm text-on-surface-variant mt-0.5">
                    {activeCr.justification}
                  </p>
                </div>
                <span className="material-symbols-outlined text-[20px] text-primary">verified</span>
              </div>

              {/* Before vs After Atomic Simulation Comparison Grid */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-label-xs font-label-xs uppercase tracking-wider font-semibold text-outline">Atomic Transaction Simulation</span>
                  <span className="text-label-xs font-label-xs text-primary font-semibold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[13px]">sync_alt</span>
                    Simulated Impact Analysis
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-space-sm">
                  {/* Metric 1: Budget Impact */}
                  <div className="p-space-md rounded-lg border border-outline-variant bg-surface-container-lowest flex flex-col justify-between">
                    <div className="flex items-center justify-between text-label-xs font-label-xs text-outline">
                      <span>TOTAL BUDGET IMPACT</span>
                      <span className="text-error font-semibold">+PKR {(activeCr.cost_impact / 1000).toFixed(0)}k</span>
                    </div>
                    <div className="mt-2 flex items-baseline justify-between">
                      <div>
                        <span className="text-label-xs font-label-xs text-outline block">Pre-Change</span>
                        <span className="text-label-md font-label-md font-medium line-through text-outline">PKR {baselineCeiling.toLocaleString()}</span>
                      </div>
                      <span className="material-symbols-outlined text-[16px] text-primary">arrow_forward</span>
                      <div className="text-right">
                        <span className="text-label-xs font-label-xs text-error font-semibold block">Post-Commit</span>
                        <span className="text-headline-sm font-headline-sm font-bold text-error">
                          PKR {(baselineCeiling + activeCr.cost_impact).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    {/* Budget Ceiling Warning Tag */}
                    <div className="mt-2 pt-2 border-t border-outline-variant/60 flex items-center gap-1 text-label-xs font-label-xs text-error">
                      <span className="material-symbols-outlined text-[13px]">warning</span>
                      <span>Exceeds baseline cap by PKR {(activeCr.cost_impact).toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Metric 2: Schedule & Deadline Impact */}
                  <div className="p-space-md rounded-lg border border-outline-variant bg-surface-container-lowest flex flex-col justify-between">
                    <div className="flex items-center justify-between text-label-xs font-label-xs text-outline">
                      <span>DEADLINE SHIFT</span>
                      <span className="text-amber-800 font-semibold">+{activeCr.schedule_impact_weeks} {activeCr.schedule_impact_weeks === 1 ? 'Week' : 'Weeks'}</span>
                    </div>
                    <div className="mt-2 flex items-baseline justify-between">
                      <div>
                        <span className="text-label-xs font-label-xs text-outline block">Current Target</span>
                        <span className="text-label-md font-label-md font-medium text-outline">2026-12-27</span>
                      </div>
                      <span className="material-symbols-outlined text-[16px] text-primary">arrow_forward</span>
                      <div className="text-right">
                        <span className="text-label-xs font-label-xs text-amber-800 font-semibold block">Projected Target</span>
                        <span className="text-headline-sm font-headline-sm font-bold text-on-surface">
                          {activeCr.schedule_impact_weeks === 2 ? '2027-01-10' : '2027-01-03'}
                        </span>
                      </div>
                    </div>
                    {/* Critical Path Notice */}
                    <div className="mt-2 pt-2 border-t border-outline-variant/60 flex items-center gap-1 text-label-xs font-label-xs text-on-surface-variant">
                      <span className="material-symbols-outlined text-[13px] text-secondary">timelapse</span>
                      <span>Affects Final System Integration milestone</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Automatic Work Packages Creation Preview */}
              <div className="border border-outline-variant rounded-lg p-space-md bg-surface-container-low/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-label-xs font-label-xs uppercase tracking-wider font-semibold text-on-surface">
                    Automated Work Packages (Level 3 WBS)
                  </span>
                  <span className="text-label-xs font-label-xs text-primary font-medium">Auto-generated</span>
                </div>
                <p className="text-body-sm font-body-sm text-on-surface-variant mb-2.5">
                  Approving will automatically construct and bind operational work packages into the master baseline:
                </p>
                <div className="space-y-1.5">
                  {activeCr.cr_number === 'CR-01' ? (
                    <>
                      <div className="p-2 rounded bg-surface-container-lowest border border-outline-variant flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded bg-primary/10 text-primary flex items-center justify-center text-label-xs font-bold">1</span>
                          <div>
                            <span className="text-label-sm font-label-sm font-semibold text-on-surface block">AI Backend Integration</span>
                            <span className="text-label-xs font-label-xs text-outline">WBS 1.7.1 • 80 Work Hours • HL7 FHIR Bridge</span>
                          </div>
                        </div>
                        <span className="text-label-sm font-label-sm font-medium text-on-surface">PKR 250,000</span>
                      </div>
                      <div className="p-2 rounded bg-surface-container-lowest border border-outline-variant flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded bg-primary/10 text-primary flex items-center justify-center text-label-xs font-bold">2</span>
                          <div>
                            <span className="text-label-sm font-label-sm font-semibold text-on-surface block">Model Validation &amp; Clinical Audit</span>
                            <span className="text-label-xs font-label-xs text-outline">WBS 1.7.2 • 60 Work Hours • Ethics Approval</span>
                          </div>
                        </div>
                        <span className="text-label-sm font-label-sm font-medium text-on-surface">PKR 200,000</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="p-2 rounded bg-surface-container-lowest border border-outline-variant flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded bg-secondary/10 text-secondary flex items-center justify-center text-label-xs font-bold">1</span>
                          <div>
                            <span className="text-label-sm font-label-sm font-semibold text-on-surface block">Mobile Core Shell &amp; Auth</span>
                            <span className="text-label-xs font-label-xs text-outline">WBS 1.8.1 • 85 Work Hours • React Native</span>
                          </div>
                        </div>
                        <span className="text-label-sm font-label-sm font-medium text-on-surface">PKR 200,000</span>
                      </div>
                      <div className="p-2 rounded bg-surface-container-lowest border border-outline-variant flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded bg-secondary/10 text-secondary flex items-center justify-center text-label-xs font-bold">2</span>
                          <div>
                            <span className="text-label-sm font-label-sm font-semibold text-on-surface block">Push Alerts &amp; Diagnostic Dispatch</span>
                            <span className="text-label-xs font-label-xs text-outline">WBS 1.8.2 • 55 Work Hours • APNS / FCM</span>
                          </div>
                        </div>
                        <span className="text-label-sm font-label-sm font-medium text-on-surface">PKR 150,000</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Governance Compliance Check */}
              <div className="rounded-lg bg-surface border border-outline-variant p-space-sm flex items-center gap-2.5">
                <span className="material-symbols-outlined text-primary text-[20px]">verified_user</span>
                <div className="text-label-xs font-label-xs text-on-surface-variant">
                  <span className="font-semibold text-on-surface">PMI PMBOK &amp; ISO 13485 Compliant:</span>
                  {' '}Transaction logs checksum to audit ledger prior to baseline commit.
                </div>
              </div>

              {/* Decision Note Input if Pending */}
              {activeCr.status === 'Pending' && (
                <div>
                  <label className="block text-label-xs font-label-xs text-outline uppercase tracking-wider font-semibold mb-1">
                    CCB Decision Note
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Approved with management reserve adjustment..."
                    value={decisionNote}
                    onChange={(e) => setDecisionNote(e.target.value)}
                    className="w-full h-8 px-3 text-label-sm font-label-sm border border-outline-variant rounded-lg bg-surface-container-lowest focus:border-primary focus:outline-none"
                  />
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex items-center gap-space-sm border-t border-outline-variant">
                {activeCr.status === 'Pending' ? (
                  <>
                    <button 
                      onClick={handleApproveCr}
                      disabled={processingAction}
                      className="flex-1 h-9 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-label-sm font-label-sm font-semibold flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95 disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-[17px]">check_circle</span>
                      {processingAction ? 'Committing...' : 'Approve & Commit Transaction'}
                    </button>
                    <button 
                      onClick={handleRejectCr}
                      disabled={processingAction}
                      className="h-9 px-space-md bg-surface-container-lowest border border-error/40 hover:bg-red-50 text-error rounded-lg text-label-sm font-label-sm font-semibold flex items-center justify-center gap-1 transition-all disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-[16px]">cancel</span>
                      Reject Request
                    </button>
                  </>
                ) : (
                  <div className="w-full py-2 px-3 text-center text-label-sm font-label-sm font-semibold rounded bg-surface-container text-on-surface-variant border border-outline-variant">
                    Decision Recorded: {activeCr.status} on {activeCr.decided_date || '2026-10-26'}
                    {activeCr.decision_note && <div className="text-label-xs font-normal text-outline mt-0.5 font-sans">"{activeCr.decision_note}"</div>}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-on-surface-variant">
              No change requests in queue.
            </div>
          )}
        </div>
      </div>

      {/* Modal: Add Change Request */}
      {showAddCrModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant mb-4">
              <h3 className="text-headline-sm font-bold text-on-surface">Submit New Change Request (CR)</h3>
              <button onClick={() => setShowAddCrModal(false)} className="text-outline hover:text-on-surface">✕</button>
            </div>
            <form onSubmit={handleCreateCrSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-label-xs font-semibold text-outline mb-1">CR Number</label>
                  <input
                    type="text"
                    required
                    placeholder="CR-03"
                    value={newCr.cr_number}
                    onChange={(e) => setNewCr({ ...newCr, cr_number: e.target.value })}
                    className="w-full h-8 px-2.5 text-label-sm border border-outline-variant rounded-lg bg-surface-container-lowest focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-label-xs font-semibold text-outline mb-1">Cost Impact (PKR)</label>
                  <input
                    type="number"
                    required
                    value={newCr.cost_impact}
                    onChange={(e) => setNewCr({ ...newCr, cost_impact: e.target.value })}
                    className="w-full h-8 px-2.5 text-label-sm border border-outline-variant rounded-lg bg-surface-container-lowest focus:border-primary focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-label-xs font-semibold text-outline mb-1">Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AI-Assisted Radiology Triage Engine"
                  value={newCr.title}
                  onChange={(e) => setNewCr({ ...newCr, title: e.target.value })}
                  className="w-full h-8 px-2.5 text-label-sm border border-outline-variant rounded-lg bg-surface-container-lowest focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-label-xs font-semibold text-outline mb-1">Justification</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Clinical need, stakeholders involved, and expected operational impact..."
                  value={newCr.justification}
                  onChange={(e) => setNewCr({ ...newCr, justification: e.target.value })}
                  className="w-full p-2.5 text-label-sm border border-outline-variant rounded-lg bg-surface-container-lowest focus:border-primary focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-label-xs font-semibold text-outline mb-1">Schedule Impact (Weeks)</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={newCr.schedule_impact_weeks}
                    onChange={(e) => setNewCr({ ...newCr, schedule_impact_weeks: e.target.value })}
                    className="w-full h-8 px-2.5 text-label-sm border border-outline-variant rounded-lg bg-surface-container-lowest focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-label-xs font-semibold text-outline mb-1">Linked Deliverable</label>
                  <select
                    value={newCr.linked_requirement_id}
                    onChange={(e) => setNewCr({ ...newCr, linked_requirement_id: e.target.value })}
                    className="w-full h-8 px-2 text-label-sm border border-outline-variant rounded-lg bg-surface-container-lowest focus:border-primary focus:outline-none"
                  >
                    {requirements.map(r => (
                      <option key={r.id} value={r.id}>{r.req_code}: {r.title}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="pt-3 border-t border-outline-variant flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddCrModal(false)}
                  className="px-4 py-1.5 border border-outline-variant rounded-lg text-label-sm font-medium hover:bg-surface-container"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processingAction}
                  className="px-4 py-1.5 bg-primary text-on-primary rounded-lg text-label-sm font-semibold hover:bg-primary-container"
                >
                  {processingAction ? 'Saving...' : 'Submit to CCB'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Requirement / Scope Deliverable */}
      {showAddReqModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant mb-4">
              <h3 className="text-headline-sm font-bold text-on-surface">Add Scope Deliverable (WBS Level 2)</h3>
              <button onClick={() => setShowAddReqModal(false)} className="text-outline hover:text-on-surface">✕</button>
            </div>
            <form onSubmit={handleAddReqSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-label-xs font-semibold text-outline mb-1">Requirement / WBS Code</label>
                  <input
                    type="text"
                    required
                    placeholder="REQ-09"
                    value={newReq.req_code}
                    onChange={(e) => setNewReq({ ...newReq, req_code: e.target.value })}
                    className="w-full h-8 px-2.5 text-label-sm border border-outline-variant rounded-lg bg-surface-container-lowest focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-label-xs font-semibold text-outline mb-1">Priority</label>
                  <select
                    value={newReq.priority}
                    onChange={(e) => setNewReq({ ...newReq, priority: e.target.value })}
                    className="w-full h-8 px-2 text-label-sm border border-outline-variant rounded-lg bg-surface-container-lowest focus:border-primary focus:outline-none"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-label-xs font-semibold text-outline mb-1">Deliverable Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pharmacy Supply & Drug Inventory Integration"
                  value={newReq.title}
                  onChange={(e) => setNewReq({ ...newReq, title: e.target.value })}
                  className="w-full h-8 px-2.5 text-label-sm border border-outline-variant rounded-lg bg-surface-container-lowest focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-label-xs font-semibold text-outline mb-1">Description</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Functional specifications, boundary constraints..."
                  value={newReq.description}
                  onChange={(e) => setNewReq({ ...newReq, description: e.target.value })}
                  className="w-full p-2.5 text-label-sm border border-outline-variant rounded-lg bg-surface-container-lowest focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-label-xs font-semibold text-outline mb-1">Category</label>
                <input
                  type="text"
                  required
                  placeholder="Core Clinical, Diagnostics, Admin, etc."
                  value={newReq.category}
                  onChange={(e) => setNewReq({ ...newReq, category: e.target.value })}
                  className="w-full h-8 px-2.5 text-label-sm border border-outline-variant rounded-lg bg-surface-container-lowest focus:border-primary focus:outline-none"
                />
              </div>
              <div className="pt-3 border-t border-outline-variant flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddReqModal(false)}
                  className="px-4 py-1.5 border border-outline-variant rounded-lg text-label-sm font-medium hover:bg-surface-container"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processingAction}
                  className="px-4 py-1.5 bg-primary text-on-primary rounded-lg text-label-sm font-semibold hover:bg-primary-container"
                >
                  {processingAction ? 'Saving...' : 'Add Deliverable'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
