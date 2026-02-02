
import React, { useState } from 'react';
import { CalibrationQuiz, QuizQuestion } from '../types';
import { generateCalibrationQuiz } from '../services/gemini';
import { Zap, Activity, Info, AlertTriangle, CheckCircle } from 'lucide-react';
import MetricCard from '../components/MetricCard';

interface CalibrationProps {
  skills: string[];
}

const Calibration: React.FC<CalibrationProps> = ({ skills }) => {
  const [selectedSkill, setSelectedSkill] = useState("");
  const [selfRating, setSelfRating] = useState(5);
  const [quiz, setQuiz] = useState<CalibrationQuiz | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const startQuiz = async () => {
    if (!selectedSkill) return;
    setLoading(true);
    setSubmitted(false);
    setAnswers({});
    try {
      const q = await generateCalibrationQuiz(selectedSkill);
      setQuiz(q);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const calculateScore = () => {
    if (!quiz || !quiz.questions) return 0;
    let correct = 0;
    quiz.questions.forEach((q, i) => {
      if (answers[i] === q.correct) correct++;
    });
    return Math.round((correct / quiz.questions.length) * 10);
  };

  const getVerdict = (actual: number) => {
    const diff = selfRating - actual;
    if (diff > 2) return { label: "OVERCONFIDENT", color: "text-rose-600", bg: "bg-rose-50", icon: <AlertTriangle /> };
    if (diff < -2) return { label: "UNDERCONFIDENT", color: "text-amber-600", bg: "bg-amber-50", icon: <Activity /> };
    return { label: "WELL CALIBRATED", color: "text-emerald-600", bg: "bg-emerald-50", icon: <CheckCircle /> };
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-extrabold text-slate-900">Confidence Calibration</h2>
        <p className="text-slate-500">Test your actual proficiency vs your perceived knowledge.</p>
      </div>

      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Select Skill to Calibrate</label>
            <select 
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-semibold text-slate-700"
              value={selectedSkill}
              onChange={(e) => setSelectedSkill(e.target.value)}
            >
              <option value="">Choose a skill...</option>
              {skills.map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">How do you rate yourself? (1-10)</label>
            <div className="flex items-center gap-4">
              <input 
                type="range" min="1" max="10" value={selfRating}
                onChange={(e) => setSelfRating(parseInt(e.target.value))}
                className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <span className="w-12 h-12 flex items-center justify-center bg-blue-600 text-white font-bold rounded-xl text-lg">{selfRating}</span>
            </div>
          </div>
        </div>

        <button 
          onClick={startQuiz}
          disabled={loading || !selectedSkill}
          className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
        >
          {loading ? "Generating Intelligence Quiz..." : "Start Calibration Quiz"}
          <Zap size={18} fill="currentColor" />
        </button>
      </div>

      {quiz && !submitted && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-xl uppercase tracking-tight">
            <Zap className="text-yellow-500" />
            {(quiz.skill || selectedSkill)} Practical Assessment
          </div>
          {(quiz.questions || []).map((q, idx) => (
            <div key={idx} className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h4 className="font-bold text-slate-800 leading-snug">Q{idx + 1}: {q.question}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(q.options || []).map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => setAnswers({...answers, [idx]: opt.id})}
                    className={`p-4 text-left rounded-xl border transition-all font-medium text-sm flex items-center gap-3 ${
                      answers[idx] === opt.id 
                        ? 'border-blue-600 bg-blue-50 text-blue-700' 
                        : 'border-slate-100 bg-slate-50 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <span className={`w-6 h-6 flex-shrink-0 flex items-center justify-center rounded-lg font-bold text-xs ${answers[idx] === opt.id ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                      {opt.id}
                    </span>
                    {opt.text}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <button 
            onClick={() => setSubmitted(true)}
            className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-lg hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all"
          >
            Submit for Calibration Analysis
          </button>
        </div>
      )}

      {submitted && quiz && (
        <div className="space-y-8 animate-in zoom-in duration-500">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <MetricCard label="Self Perception" value={`${selfRating}/10`} icon={<Info />} />
            <MetricCard label="Actual Performance" value={`${calculateScore()}/10`} icon={<Zap />} />
            {(() => {
              const v = getVerdict(calculateScore());
              return (
                <div className={`p-6 rounded-2xl border shadow-sm flex flex-col items-center justify-center text-center ${v.bg}`}>
                  <div className={`mb-2 ${v.color}`}>{v.icon}</div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Calibration Verdict</span>
                  <h3 className={`text-xl font-black tracking-tighter ${v.color}`}>{v.label}</h3>
                </div>
              )
            })()}
          </div>

          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <h3 className="text-xl font-bold border-b border-slate-100 pb-4">Detailed Insights</h3>
            {(quiz.questions || []).map((q, idx) => {
              const isCorrect = answers[idx] === q.correct;
              return (
                <div key={idx} className={`p-6 rounded-xl border ${isCorrect ? 'border-emerald-100 bg-emerald-50/30' : 'border-rose-100 bg-rose-50/30'}`}>
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-lg ${isCorrect ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                      {isCorrect ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
                    </div>
                    <div className="space-y-2">
                      <p className="font-bold text-slate-800 text-sm">Q{idx + 1}: {q.question}</p>
                      <div className="flex flex-wrap gap-4 text-xs">
                        <span className="font-medium text-slate-500">Your Answer: <span className="text-slate-900 font-bold">{answers[idx]}</span></span>
                        <span className="font-medium text-slate-500">Correct Answer: <span className="text-emerald-600 font-bold">{q.correct}</span></span>
                      </div>
                      <p className="text-xs text-slate-600 italic bg-white p-3 rounded-lg border border-slate-100 mt-2">
                        {q.explanation}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default Calibration;
