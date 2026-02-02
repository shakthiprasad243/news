
export enum SkillStatus {
  FOUND = 'found',
  MISSING = 'missing',
  PARTIAL = 'partial'
}

export interface SkillAnalysis {
  skill: string;
  status: SkillStatus;
  evidence: string;
  reasoning: string;
}

export interface LearningPhase {
  phase_name: string;
  estimated_hours: number;
  description: string;
  topics: string[];
  weekly_project: string;
  start_date?: string;
  end_date?: string;
}

export interface Roadmap {
  project_name: string;
  roadmap: LearningPhase[];
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: { id: string; text: string }[];
  correct: string;
  explanation: string;
}

export interface CalibrationQuiz {
  skill: string;
  questions: QuizQuestion[];
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ArchitectureBlueprint {
  overview: string;
  mermaid_code: string;
  api_endpoints: string[];
  tech_stack_decisions: string[];
}
