
import React, { useState } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Roadmap from './pages/Roadmap';
import SkillMap from './pages/SkillMap';
import Calibration from './pages/Calibration';
import Playground from './pages/Playground';
import Interview from './pages/Interview';
import VoiceLive from './pages/VoiceLive';
import ImageAnalysis from './pages/ImageAnalysis';
import ThinkingChat from './pages/ThinkingChat';
import { SkillAnalysis, Roadmap as RoadmapType } from './types';

const App: React.FC = () => {
  const [analysis, setAnalysis] = useState<any>(null);
  const [roadmap, setRoadmap] = useState<RoadmapType | null>(null);
  const [skills, setSkills] = useState<string[]>([]);
  const [matchScore, setMatchScore] = useState(0);

  const handleAnalysisUpdate = (data: { analysis: SkillAnalysis[], matchScore: number, roadmap: RoadmapType, skills: string[] }) => {
    setAnalysis({ analysis: data.analysis, matchScore: data.matchScore });
    setMatchScore(data.matchScore);
    setRoadmap(data.roadmap);
    setSkills(data.skills);
  };

  return (
    <Router>
      <Layout matchScore={matchScore}>
        <Routes>
          <Route path="/" element={<Dashboard onAnalysisUpdate={handleAnalysisUpdate} analysis={analysis} />} />
          <Route path="/roadmap" element={<Roadmap roadmap={roadmap} skills={skills} />} />
          <Route path="/skill-map" element={<SkillMap skills={skills} />} />
          <Route path="/calibration" element={<Calibration skills={skills} />} />
          <Route path="/playground" element={<Playground skills={skills} projectName={roadmap?.project_name || "General Growth Project"} />} />
          <Route path="/interview" element={<Interview />} />
          <Route path="/voice" element={<VoiceLive />} />
          <Route path="/scanner" element={<ImageAnalysis />} />
          <Route path="/thinking" element={<ThinkingChat />} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;
