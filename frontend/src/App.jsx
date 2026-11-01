import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import DashboardPage from './pages/DashboardPage';
import ScopeWbsPage from './pages/ScopeWbsPage';
import ScheduleGanttPage from './pages/ScheduleGanttPage';
import CostEvmPage from './pages/CostEvmPage';
import QualityRisksPage from './pages/QualityRisksPage';
import IntegrityReportPage from './pages/IntegrityReportPage';
import CharterPlanPage from './pages/CharterPlanPage';
import HospitalModulesPage from './pages/HospitalModulesPage';
import AcademicReportPage from './pages/AcademicReportPage';

export default function App() {
  return (
    <Router>
      <div className="h-full flex flex-col antialiased bg-surface text-on-surface">
        <Navbar />

        <div className="flex flex-1 pt-12 overflow-hidden h-full">
          <main className="ml-60 flex-1 flex flex-col bg-background h-full overflow-y-auto">
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/scope" element={<ScopeWbsPage />} />
              <Route path="/schedule" element={<ScheduleGanttPage />} />
              <Route path="/cost" element={<CostEvmPage />} />
              <Route path="/quality" element={<QualityRisksPage />} />
              <Route path="/integrity" element={<IntegrityReportPage />} />
              <Route path="/charter" element={<CharterPlanPage />} />
              <Route path="/hospital" element={<HospitalModulesPage />} />
              <Route path="/report" element={<AcademicReportPage />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}
