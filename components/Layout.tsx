
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Map, 
  Scale, 
  Gamepad2, 
  Mic2, 
  MessageSquare, 
  Image as ImageIcon,
  BrainCircuit,
  ShieldCheck,
  Network
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  matchScore: number;
}

const Layout: React.FC<LayoutProps> = ({ children, matchScore }) => {
  const navItems = [
    { to: '/', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { to: '/roadmap', icon: <Map size={20} />, label: 'Roadmap' },
    { to: '/skill-map', icon: <Network size={20} />, label: 'Skill Map' },
    { to: '/calibration', icon: <Scale size={20} />, label: 'Calibration' },
    { to: '/playground', icon: <Gamepad2 size={20} />, label: 'Playground' },
    { to: '/interview', icon: <MessageSquare size={20} />, label: 'Interviews' },
    { to: '/voice', icon: <Mic2 size={20} />, label: 'Live Coach' },
    { to: '/scanner', icon: <ImageIcon size={20} />, label: 'Resume Scanner' },
    { to: '/thinking', icon: <BrainCircuit size={20} />, label: 'Deep Analysis' },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col sticky top-0 h-screen overflow-y-auto z-20">
        <div className="p-6 border-b border-slate-100">
          <h1 className="text-2xl font-black text-blue-600 flex items-center gap-2 tracking-tighter">
            <BrainCircuit size={28} /> skillX
          </h1>
          <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-[0.2em] font-black">Career Intelligence</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`
              }
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="bg-slate-50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 uppercase">Match Score</span>
              <span className="text-xs font-bold text-blue-600">{matchScore}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-1.5">
              <div 
                className="bg-blue-600 h-1.5 rounded-full transition-all duration-500" 
                style={{ width: `${matchScore}%` }}
              ></div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
              <ShieldCheck size={14} className="text-green-500" />
              <span>ATS Shield Active</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-x-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-10 shadow-sm">
          <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
            Strategic Protocol v3.0 // <span className="text-blue-600">skillX Core</span>
          </div>
          <div className="flex items-center gap-4">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm">
              Upgrade to Enterprise
            </button>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto">
          {children}
        </div>

        <footer className="mt-12 py-8 border-t border-slate-200 text-center text-slate-400 text-xs font-medium">
          &copy; 2025 skillX • The Intelligence Framework for Modern Careers
        </footer>
      </main>
    </div>
  );
};

export default Layout;
