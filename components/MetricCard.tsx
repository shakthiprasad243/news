
import React from 'react';

interface MetricCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isUp: boolean;
  };
}

const MetricCard: React.FC<MetricCardProps> = ({ label, value, icon, trend }) => {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 mb-1">{label}</p>
          <h3 className="text-3xl font-bold text-slate-900">{value}</h3>
          {trend && (
            <div className={`flex items-center gap-1 mt-2 text-xs font-semibold ${trend.isUp ? 'text-emerald-500' : 'text-rose-500'}`}>
              <span>{trend.isUp ? '↑' : '↓'} {trend.value}%</span>
              <span className="text-slate-400 font-normal">from last analysis</span>
            </div>
          )}
        </div>
        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
          {icon}
        </div>
      </div>
    </div>
  );
};

export default MetricCard;
