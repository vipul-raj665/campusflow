import React from 'react';

const Badge = ({ variant = 'default', children, className = '' }) => {
  const styles = {
    pending: 'bg-amber-50 text-amber-700 border-amber-200 ring-1 ring-amber-500/10',
    approved: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-1 ring-emerald-500/10',
    rejected: 'bg-rose-50 text-rose-700 border-rose-200 ring-1 ring-rose-500/10',
    cancelled: 'bg-slate-100 text-slate-700 border-slate-200 ring-1 ring-slate-400/10',
    active: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-1 ring-emerald-500/10',
    maintenance: 'bg-orange-50 text-orange-700 border-orange-200 ring-1 ring-orange-500/10',
    inactive: 'bg-slate-100 text-slate-600 border-slate-200',
    admin: 'bg-indigo-50 text-indigo-700 border-indigo-200 font-semibold',
    faculty: 'bg-purple-50 text-purple-700 border-purple-200 font-semibold',
    student: 'bg-sky-50 text-sky-700 border-sky-200 font-semibold',
    default: 'bg-slate-50 text-slate-700 border-slate-200',
  };

  const selectedStyle = styles[variant.toLowerCase()] || styles.default;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize transition-colors ${selectedStyle} ${className}`}
    >
      {children || variant}
    </span>
  );
};

export default Badge;
