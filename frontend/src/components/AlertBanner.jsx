import React from 'react';

export default function AlertBanner({ type = 'danger', message, onDismiss, title }) {
  if (!message) return null;

  const alertClass = `alert-banner alert-${type}`;

  return (
    <div className={alertClass} role="alert">
      <div style={{ flex: 1 }}>
        {title && <strong style={{ display: 'block', marginBottom: '2px' }}>{title}</strong>}
        <span>{message}</span>
      </div>
      {onDismiss && (
        <button 
          onClick={onDismiss} 
          style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '1.2rem', padding: '0 4px' }}
          title="Dismiss"
        >
          &times;
        </button>
      )}
    </div>
  );
}
