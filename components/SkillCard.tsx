
import React from 'react';
import { SkillStatus } from '../types';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

interface SkillCardProps {
  skill: string;
  status: SkillStatus;
  reasoning: string;
  evidence: string;
}

const SkillCard: React.FC<SkillCardProps> = ({ skill, status, reasoning, evidence }) => {
  const styles = {
    [SkillStatus.FOUND]: {
      bg: 'bg-emerald-50',
      border: 'border-emerald-100',
      text: 'text-emerald-700',
      icon: <CheckCircle2 size={16} className="text-emerald-500" />,
      badge: 'bg-emerald-100 text-emerald-700'
    },
    [SkillStatus.MISSING]: {
      bg: 'bg-rose-50',
      border: 'border-rose-100',
      text: 'text-rose-700',
      icon: <XCircle size={16} className="text-rose-500" />,
      badge: 'bg-rose-100 text-rose-700'
    },
    [SkillStatus.PARTIAL]: {
      bg: 'bg-amber-50',
      border: 'border-amber-100',
      text: 'text-amber-700',
      icon: <AlertCircle size={16} className="text-amber-500" />,
      badge: 'bg-amber-100 text-amber-700'
    }
  }[status];

  return (
    <div className={`p-5 rounded-xl border ${styles.border} ${styles.bg} transition-all hover:scale-[1.01]`}>
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-bold text-slate-900 uppercase tracking-tight text-sm">{skill}</h4>
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${styles.badge}`}>
          {styles.icon}
          {status}
        </div>
      </div>
      <p className="text-sm text-slate-700 leading-relaxed mb-4">
        {reasoning}
      </p>
      <div className="flex items-start gap-2 pt-3 border-t border-slate-200/50">
        <span className="text-xs font-semibold text-slate-500 uppercase">Evidence:</span>
        <span className="text-xs text-slate-600 italic leading-snug">
          {evidence || "No specific evidence detected in resume."}
        </span>
      </div>
    </div>
  );
};

export default SkillCard;
