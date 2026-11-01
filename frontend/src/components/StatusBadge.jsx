import React from 'react';

export default function StatusBadge({ status, type }) {
  if (!status) return null;

  let colorClass = 'badge-gray';
  const s = String(status).toLowerCase();

  if (['approved', 'complete', 'achieved', 'pass', 'resolved', 'closed', 'green', 'low'].includes(s)) {
    colorClass = 'badge-green';
  } else if (['on track', 'in progress', 'monitoring', 'amber', 'medium'].includes(s)) {
    colorClass = 'badge-amber';
  } else if (['delayed', 'fail', 'rejected', 'open', 'critical', 'red', 'high'].includes(s)) {
    colorClass = 'badge-red';
  } else if (['planning', 'executing', 'proposed', 'pending'].includes(s)) {
    colorClass = 'badge-blue';
  }

  return (
    <span className={`badge ${colorClass}`}>
      {status}
    </span>
  );
}
